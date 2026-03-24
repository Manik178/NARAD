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
                "You are Narad, a calm and mature voice assistant for rural governance in India. "
                "Speak ONLY in natural, conversational Hindi using Devanagari script. "
                "NEVER use Roman transliteration, English words, bullet points, or asterisks. "
                "NEVER speak function names, tool names, or any technical terms aloud — "
                "these are internal actions and must remain completely silent to the user.\n\n"

                "Your ONLY job right now is to collect exactly 3 pieces of information, "
                "one at a time, in this strict order:\n\n"

                "STEP 1 — NAME: Ask the user their name. Example: 'आपका नाम क्या है?' "
                "Wait for the answer. Do NOT proceed until you have a name.\n\n"

                "STEP 2 — VILLAGE: Ask the user their village name. Example: 'आप किस गाँव से हैं?' "
                "Wait for the answer. Do NOT proceed until you have a village name.\n\n"

                "STEP 3 — INTERACTION TYPE: Ask whether they want information or have a complaint. "
                "Example: 'क्या आप कोई जानकारी लेना चाहते हैं, या आपकी कोई शिकायत है?' "
                "Wait for the answer.\n\n"

                "CLASSIFICATION RULES for interaction type:\n"
                "- If they say anything like 'जानकारी चाहिए', 'पूछना है', 'बताइए', 'कैसे मिलेगा' → set type = 'query'\n"
                "- If they say anything like 'शिकायत है', 'परेशानी है', 'समस्या है', 'नहीं मिला', 'बंद है' → set type = 'complaint'\n\n"

                "STRICT RULES:\n"
                "- Ask ONLY ONE question at a time. Never combine two questions.\n"
                "- NEVER repeat a question if you already have that answer.\n"
                "- If the user volunteers multiple pieces of information at once, silently accept all of them "
                "and skip those steps — only ask for whatever is still missing.\n"
                "- Once you have all 3 pieces, immediately and silently perform the internal save action. "
                "Do NOT announce it, do NOT say the action name, do NOT say you are 'saving' anything. "
                "Simply confirm warmly: 'धन्यवाद, [नाम] जी। मैं आपकी सहायता के लिए तैयार हूँ।'\n"
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
        Call this silently once you have collected name, village, and interaction type.
        Do NOT mention this function name or any saving action to the user.
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


# ── Main Agent — handles the actual conversation ────────────────────────────────────
class MainAgent(Agent):
    def __init__(self, name: str, village: str, interaction_type: str = "complaint") -> None:
        self.user_name        = name
        self.user_village     = village
        self.interaction_type = interaction_type

        super().__init__(
            instructions=(
                f"You are Narad, a calm and mature voice assistant for rural governance in India. "
                f"You are speaking with {name} from {village}. "
                f"Speak ONLY in natural, conversational Hindi using Devanagari script. "
                f"NEVER use Roman transliteration, English words, bullet points, or asterisks. "
                f"NEVER speak function names, tool names, or any technical terms aloud — "
                f"these are internal actions and must remain completely silent to the user. "
                f"Give complete, warm answers in 3–4 sentences. "
                "GOAL: If the user has a complaint, listen to the details. "
                "Once you understand the problem, you MUST call the 'file_and_route_complaint' tool. "
                "After the tool returns the result, read the Reference ID and Department name back to the user "
                "to confirm their complaint is officially registered.\n\n"
                
                "Example response after tool call: 'धन्यवाद। आपकी शिकायत बिजली विभाग को भेज दी गई है। आपकी शिकायत संख्या (ID) 8b21 है।"
                # "Your ONLY job right now is to collect exactly 3 pieces of information, "
                # "one at a time, in this strict order:\n\n"

                # "STEP 1 — NAME: Ask the user their name. Example: 'आपका नाम क्या है?' "
                # "Wait for the answer. Do NOT proceed until you have a name.\n\n"

                # "STEP 2 — VILLAGE: Ask the user their village name. Example: 'आप किस गाँव से हैं?' "
                # "Wait for the answer. Do NOT proceed until you have a village name.\n\n"

                # "STEP 3 — INTERACTION TYPE: Ask whether they want information or have a complaint. "
                # "Example: 'क्या आप कोई जानकारी लेना चाहते हैं, या आपकी कोई शिकायत है?' "
                # "Wait for the answer.\n\n"

                # "CLASSIFICATION RULES for interaction type:\n"
                # "- If they say anything like 'जानकारी चाहिए', 'पूछना है', 'बताइए', 'कैसे मिलेगा' → set type = 'query'\n"
                # "- If they say anything like 'शिकायत है', 'परेशानी है', 'समस्या है', 'नहीं मिला', 'बंद है' → set type = 'complaint'\n\n"

                # "STRICT RULES:\n"
                # "- Ask ONLY ONE question at a time. Never combine two questions.\n"
                # "- NEVER repeat a question if you already have that answer.\n"
                # "- If the user volunteers multiple pieces of information at once, silently accept all of them "
                # "and skip those steps — only ask for whatever is still missing.\n"
                # "- Once you have all 3 pieces, immediately and silently perform the internal save action. "
                # "Do NOT announce it, do NOT say the action name, do NOT say you are 'saving' anything. "
                # "Simply confirm warmly: 'धन्यवाद, [नाम] जी। मैं आपकी सहायता के लिए तैयार हूँ।\n"
            ),
        )
    
    @function_tool
    async def file_and_route_complaint(
        self,
        context: RunContext,
        complaint_description: str,
        category: str,
    ):
        """
        Call this tool to officially file a citizen complaint and route it to the 
        respective government authority via email. 
        Args:
            complaint_description: A detailed summary of the issue in English.
            category: The department category (e.g., 'electricity_department', 'water_department').
        """
        logger.info(f"NARAD: Initiating routing for {self.user_name}")

        # Construct the full text for the authority
        full_text = (
            f"Citizen Name: {self.user_name}\n"
            f"Village: {self.user_village}\n"
            f"Issue: {complaint_description}"
        )

        try:
            # Run the blocking email/LLM routing in a thread to prevent voice lag
            routing_result = await asyncio.to_thread(
                route_complaint, 
                complaint_text=full_text
            )
            
            # The result from router.py is e.g., {"id": "a1b2", "routed_to": ["email@gov.in"]}
            complaint_id = routing_result.get("id", "Unknown")
            dept = category.replace("_", " ").title()

            # Return this to the LLM so it can talk to the user
            return f"SUCCESS: Complaint ID {complaint_id} has been sent to the {dept}. Please inform the user."

        except Exception as e:
            logger.error(f"Routing Error: {e}")
            return "ERROR: The system is temporarily unable to route the email, but the complaint is logged internally."


    @function_tool
    async def save_interaction(
        self,
        context: RunContext,
        summary: str,
        category: str,
    ):
        """
        Silently saves interaction to DB and routes complaints to relevant authorities.
        Do NOT mention this function name or any saving/routing action to the user.
        You MUST call this after the user describes their issue.
        Args:
            summary: A one-sentence summary of the user's issue.
            category: Category like 'ration card', 'pension', 'road', 'water', 'electricity', etc.
        """
        logger.info(f"Saving interaction — summary={summary}, category={category}")

        complaint_id = None
        # 1. Log to Database via API
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(f"{API_BASE_URL}/log_interaction", json={
                    "name":             self.user_name,
                    "village":          self.user_village,
                    "phone":            context.userdata.get("user_phone", ""),
                    "interaction_type": self.interaction_type,
                    "summary":          summary,
                    "category":         category,
                    "room_name":        context.userdata.get("room_name", "narad-room"),
                }, timeout=5)
                if resp.status_code == 200:
                    resp_data = resp.json()
                    complaint_id = resp_data.get("complaint_id")
                    if complaint_id:
                        context.userdata["complaint_id"] = complaint_id
                        logger.info(f"Complaint ID received: {complaint_id}")
                        # Send complaint_id to frontend via data message
                        try:
                            import json as _json
                            room = context.session.room
                            if room and room.local_participant:
                                msg = _json.dumps({"type": "COMPLAINT_ID", "complaint_id": complaint_id})
                                await room.local_participant.publish_data(
                                    msg.encode(),
                                    topic="complaint_tracking",
                                )
                                logger.info(f"Sent complaint ID to frontend: {complaint_id}")
                        except Exception as e:
                            logger.warning(f"Failed to send complaint ID to frontend: {e}")
        except Exception as e:
            logger.warning(f"Failed to log interaction to API: {e}")

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
                # Cartesia "Barbershop Man" — deep, mature Indian-accented male voice
                # Replace the voice ID below with any Cartesia voice that suits your preference:
                #   "arjun-indian-male"  → a warm, authoritative Indian male voice
                #   You can browse voices at: https://play.cartesia.ai/voices
                model="cartesia/sonic-3",
                voice="638efaaa-4d0c-442e-b701-3fae16aad012",  # Deep mature Indian male
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

    # ── Check for pre-provided user info from room metadata ─────────────────
    # Room metadata is set by the API before dispatching the agent
    # We need to connect first so the room metadata is available
    pre_user_info = None
    await ctx.connect()
    try:
        import json as _json
        room_meta = ctx.room.metadata
        if room_meta:
            pre_user_info = _json.loads(room_meta)
            logger.info(f"Pre-provided user info from room metadata: {pre_user_info}")
    except Exception as e:
        logger.warning(f"Could not parse room metadata: {e}")

    if pre_user_info and pre_user_info.get("user_name"):
        # ── FAST PATH: Skip onboarding, go straight to MainAgent ──────────────
        name    = pre_user_info["user_name"]
        village = pre_user_info.get("user_village", "")
        phone   = pre_user_info.get("user_phone", "")
        interaction_type = "complaint"  # Since form is for complaints

        userdata["user_name"]        = name
        userdata["user_village"]     = village
        userdata["user_phone"]       = phone
        userdata["interaction_type"] = interaction_type

        # Log user info to API
        try:
            async with httpx.AsyncClient() as client:
                await client.post(f"{API_BASE_URL}/log_user", json={
                    "name":             name,
                    "village":          village,
                    "interaction_type": interaction_type,
                    "room_name":        ctx.room.name,
                }, timeout=5)
        except Exception as e:
            logger.warning(f"Failed to log user info: {e}")

        main_agent = MainAgent(name=name, village=village, interaction_type=interaction_type)
        session    = make_session()

        await session.start(agent=main_agent, room=ctx.room, room_options=room_options)

        await session.generate_reply(
            instructions=(
                f"Greet {name} warmly in Hindi (Devanagari only). "
                f"You already know their name is {name} and they are from {village}. "
                f"Do NOT ask for their name or village again. "
                f"Tell them you are ready to hear their complaint and ask them to describe their issue. "
                f"Example: 'नमस्ते {name} जी, मैं नारद हूँ। कृपया अपनी शिकायत बताइए, मैं ध्यान से सुन रहा हूँ।'"
            )
        )
    else:
        # ── NORMAL PATH: Full onboarding ──────────────────────────────────────
        onboarding = OnboardingAgent()
        session    = make_session()

        await session.start(agent=onboarding, room=ctx.room, room_options=room_options)

        await session.generate_reply(
            instructions=(
                "Greet the user warmly and respectfully in Hindi using Devanagari script. "
                "Introduce yourself as Narad, a government services assistant. "
                "Then ask ONLY for their name — nothing else. "
                "Do not ask about village or interaction type yet. "
                "Example: 'नमस्ते, मैं नारद हूँ — सरकारी सेवाओं में आपकी मदद के लिए। "
                "कृपया अपना नाम बताइए।'"
            )
        )

        # Wait until onboarding tool has been called and userdata is populated
        while not userdata.get("user_name"):
            await asyncio.sleep(0.5)

        # ── Phase 2: Hand off to MainAgent on the SAME session ────────────────
        name             = userdata["user_name"]
        village          = userdata["user_village"]
        interaction_type = userdata["interaction_type"]

        main_agent = MainAgent(name=name, village=village, interaction_type=interaction_type)

        # update_agent swaps the agent without creating a new session — no conflicts
        session.update_agent(main_agent)

        if interaction_type == "complaint":
            opening = f"{name} जी, कृपया अपनी शिकायत बताइए। मैं ध्यान से सुन रहा हूँ।"
        else:
            opening = f"{name} जी, बताइए — आपको क्या जानकारी चाहिए।"

        await session.generate_reply(instructions=(
            f"Say exactly this in Hindi, warmly and clearly: '{opening}' "
            "Do not add anything else. Do not mention any tool or function names."
        ))


if __name__ == "__main__":
    cli.run_app(server)