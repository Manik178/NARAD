import logging
import os
import httpx
import asyncio

from router import route_complaint
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    inference,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins import openai as lk_openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")
load_dotenv(".env.local")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


# ── Onboarding Agent — collects name, village, query/complaint ────────────────
class OnboardingAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are Narad, a helpful voice assistant for rural governance in India. "
                "Speak only in natural Hindi using Devanagari script. "
                "Never use Roman transliteration. "
                "No bullet points, no asterisks — plain conversational speech only.\n\n"

                "Your job right now is to collect 3 pieces of information from the user, one at a time:\n"
                "1. Their name (नाम)\n"
                "2. Their village name (गाँव का नाम)\n"
                "3. Whether they have a query (जानकारी चाहिए) or a complaint (शिकायत)\n\n"

                "Ask for each one naturally and wait for their answer before moving to the next. "
                "Once you have all three, call the save_user_info tool with what you collected. "
                "Do NOT ask anything else until you have all three pieces of information."
            ),
        )

    @function_tool
    async def save_user_info(
        self,
        context: RunContext,
        name: str,
        village: str,
        interaction_type: str,
    ):
        """
        Call this once you have collected name, village, and interaction type.
        Args:
            name: The user's full name as they said it
            village: The name of their village
            interaction_type: Either 'query' or 'complaint'
        """
        logger.info(f"Onboarding complete — name={name}, village={village}, type={interaction_type}")

        # Store in context so MainAgent can access it
        context.userdata["user_name"]        = name
        context.userdata["user_village"]     = village
        context.userdata["interaction_type"] = interaction_type.lower()

        # Save to Firebase via API
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"{API_BASE_URL}/log_user", json={
                    "name":             name,
                    "village":          village,
                    "interaction_type": interaction_type.lower(),
                    "room_name":        context.userdata.get("room_name", "narad-room"),
                }, timeout=5)
        except Exception as e:
            logger.warning(f"Failed to log user info: {e}")

        return f"Saved. Name: {name}, Village: {village}, Type: {interaction_type}"


# ── Main Agent — handles the actual query or complaint ────────────────────────
class MainAgent(Agent):
    def __init__(self, name: str, village: str, interaction_type: str) -> None:
        self.user_name        = name
        self.user_village     = village
        self.interaction_type = interaction_type

        if interaction_type == "complaint":
            extra = (
                "The user wants to file a complaint. "
                "Listen carefully to their complaint, acknowledge it empathetically, "
                "and tell them the correct government channel to escalate it — "
                "e.g. gram panchayat, block office, CM helpline 1076, or relevant ministry. "
            )
        else:
            extra = (
                "The user has a query about government schemes or rural services. "
                "Answer helpfully with specific steps and details. "
            )

        super().__init__(
            instructions=(
                f"You are Narad, a helpful voice assistant for rural governance in India. "
                f"You are speaking with {name} from {village}. "
                f"Speak only in natural Hindi using Devanagari script. "
                f"No Roman transliteration, no bullet points, no asterisks — plain conversational speech only. "
                f"Give complete answers in 3-4 sentences. "
                + extra
            ),
        )

    @function_tool
    async def save_interaction(
        self,
        context: RunContext,
        summary: str,
        category: str,
    ):
        """
        Saves interaction to DB and routes complaints to relevant authorities via email.
        Args:
            summary: A one-sentence summary of the user's issue.
            category: Category like 'ration card', 'pension', 'road', 'water', 'electricity', etc.
        """
        logger.info(f"Saving interaction — summary={summary}, category={category}")
        
        # 1. Log to Database via API
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"{API_BASE_URL}/log_interaction", json={
                    "name":             self.user_name,
                    "village":          self.user_village,
                    "interaction_type": self.interaction_type,
                    "summary":          summary,
                    "category":         category,
                    "room_name":        context.userdata.get("room_name", "narad-room"),
                }, timeout=5)
        except Exception as e:
            logger.warning(f"Failed to log interaction to API: {e}")

        # 2. If it's a complaint, route it to authorities
        if self.interaction_type.lower() == "complaint":
            logger.info("Routing complaint to authorities...")
            try:
                # We use to_thread to keep the async loop responsive during SMTP transit
                routing_result = await asyncio.to_thread(
                    route_complaint, 
                    complaint_text=summary
                )
                logger.info(f"Complaint routed: {routing_result}")
            except Exception as e:
                logger.error(f"Failed to route complaint: {e}")
                return f"Saved successfully, but routing failed: {str(e)}"

        return "Saved and processed successfully."

# ── Server setup ───────────────────────────────────────────────────────────────
server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    # Shared userdata across agent handoffs
    userdata = {"room_name": ctx.room.name}

    def make_session() -> AgentSession:
        return AgentSession(
            stt=inference.STT(model="deepgram/nova-3", language="multi"),
            llm=lk_openai.LLM(
                model="llama-3.3-70b-versatile",
                base_url="https://api.groq.com/openai/v1",
                api_key=GROQ_API_KEY,
            ),
            tts=inference.TTS(
                model="cartesia/sonic-3",
                voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
            ),
            turn_detection=MultilingualModel(unlikely_threshold=0.5),
            min_endpointing_delay=0.8,
            vad=ctx.proc.userdata["vad"],
            preemptive_generation=False,
            max_tool_steps=2,
            userdata=userdata,
        )

    room_options = room_io.RoomOptions(
        audio_input=room_io.AudioInputOptions(
            noise_cancellation=lambda params: (
                noise_cancellation.BVCTelephony()
                if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                else noise_cancellation.BVC()
            ),
        ),
    )

    # ── Phase 1: Onboarding ────────────────────────────────────────────────────
    onboarding = OnboardingAgent()
    session    = make_session()

    await session.start(agent=onboarding, room=ctx.room, room_options=room_options)
    await ctx.connect()

    await session.generate_reply(
        instructions=(
            "Greet the user warmly in Hindi. "
            "Say you are Narad, a government services assistant. "
            "Then ask for their name. "
            "Speak only in natural Hindi using Devanagari script."
        )
    )

    # Wait until onboarding tool has been called and userdata is populated
    import asyncio
    while not userdata.get("user_name"):
        await asyncio.sleep(0.5)

    # ── Phase 2: Hand off to MainAgent on the SAME session ────────────────────
    name             = userdata["user_name"]
    village          = userdata["user_village"]
    interaction_type = userdata["interaction_type"]

    main_agent = MainAgent(name=name, village=village, interaction_type=interaction_type)

    # update_agent swaps the agent without creating a new session — no conflicts
    session.update_agent(main_agent)

    if interaction_type == "complaint":
        opening = f"{name} जी, कृपया अपनी शिकायत बताइए। मैं सुन रहा हूँ।"
    else:
        opening = f"{name} जी, बताइए आपको क्या जानकारी चाहिए।"

    await session.generate_reply(instructions=f"Say exactly this in Hindi: {opening}")


if __name__ == "__main__":
    cli.run_app(server)