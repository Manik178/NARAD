import os
import sys
import uuid
import time
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from livekit.api import AccessToken, VideoGrants, LiveKitAPI
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest
from groq import Groq
import firebase_admin
from firebase_admin import credentials, firestore

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from rag.retriever import SmartRetriever

load_dotenv(".env.local")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("narad.api")

LIVEKIT_URL        = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY    = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
groq_client        = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── Firebase ───────────────────────────────────────────────────────────────────
db = None
_cred_path = os.getenv("FIREBASE_CREDENTIALS")
if _cred_path and os.path.exists(_cred_path):
    try:
        cred = credentials.Certificate(_cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase connected")
    except Exception as e:
        logger.warning(f"Firebase init failed: {e}")
else:
    logger.warning("FIREBASE_CREDENTIALS not set — logging disabled")


def log_to_firebase(collection: str, data: dict):
    """Fire-and-forget. Never blocks or crashes the API."""
    if db is None:
        return
    try:
        db.collection(collection).add({
            **data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"Firebase write failed: {e}")


# ── RAG ────────────────────────────────────────────────────────────────────────
logger.info("Loading SmartRetriever...")
retriever = SmartRetriever()
logger.info("SmartRetriever ready")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Narad API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ── Request models ─────────────────────────────────────────────────────────────

class TokenRequest(BaseModel):
    user_id: Optional[str] = None
    room_name: Optional[str] = "narad-room"

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "hinglish"
    user_id: Optional[str] = None

class RAGRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

class VoiceLogRequest(BaseModel):
    user_id: str
    room_name: str
    query: str
    response: str
    duration_ms: Optional[int] = None

class UserInfoRequest(BaseModel):
    """Sent by agent.py once onboarding is complete."""
    name: str
    village: str
    interaction_type: str       # 'query' or 'complaint'
    room_name: Optional[str] = "narad-room"

class InteractionRequest(BaseModel):
    """Sent by agent.py at end of conversation."""
    name: str
    village: str
    interaction_type: str
    summary: str                # one-sentence English summary of the conversation
    category: str               # e.g. 'ration card', 'pension', 'road', 'water'
    room_name: Optional[str] = "narad-room"


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/voice", response_class=HTMLResponse)
def voice_page():
    html_path = os.path.join(os.path.dirname(__file__), "voice.html")
    with open(html_path) as f:
        return f.read()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "firebase": db is not None,
        "services": {
            "groq":    bool(os.getenv("GROQ_API_KEY")),
            "livekit": bool(LIVEKIT_API_KEY),
            "rag":     retriever is not None,
        },
    }


@app.post("/token")
async def get_token(req: TokenRequest):
    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        raise HTTPException(500, "LiveKit credentials not set")
    user_id = req.user_id or f"user-{uuid.uuid4().hex[:8]}"
    token = (
        AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        .with_identity(user_id)
        .with_name(user_id)
        .with_grants(VideoGrants(room_join=True, room=req.room_name))
        .to_jwt()
    )
    log_to_firebase("sessions", {
        "user_id":   user_id,
        "room_name": req.room_name,
        "type":      "session_start",
    })
    # ── Auto-dispatch agent to the room ──────────────────────────────────────
    try:
        async with LiveKitAPI(
            url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        ) as lk:
            await lk.agent_dispatch.create_dispatch(
                CreateAgentDispatchRequest(
                    agent_name="my-agent",
                    room=req.room_name,
                )
            )
        logger.info(f"Agent dispatched to room: {req.room_name}")
    except Exception as e:
        logger.warning(f"Agent dispatch failed (may already be in room): {e}")

    return {"token": token, "room_name": req.room_name, "user_id": user_id, "livekit_url": LIVEKIT_URL}


@app.post("/log_user")
def log_user(req: UserInfoRequest):
    """
    Called by agent.py after onboarding.
    Stores name, village, interaction type in 'users' collection.
    """
    log_to_firebase("users", {
        "name":             req.name,
        "village":          req.village,
        "interaction_type": req.interaction_type,   # 'query' or 'complaint'
        "room_name":        req.room_name,
    })
    logger.info(f"User logged — {req.name} / {req.village} / {req.interaction_type}")
    return {"status": "logged"}


@app.post("/log_interaction")
def log_interaction(req: InteractionRequest):
    """
    Called by agent.py at end of conversation.
    Stores the full labeled record in 'interactions' collection.
    """
    log_to_firebase("interactions", {
        "name":             req.name,
        "village":          req.village,
        "interaction_type": req.interaction_type,   # 'query' or 'complaint'
        "summary":          req.summary,
        "category":         req.category,           # e.g. 'ration card', 'road'
        "room_name":        req.room_name,
    })
    logger.info(f"Interaction logged — {req.name} / {req.category} / {req.interaction_type}")
    return {"status": "logged"}


@app.post("/log_voice")
def log_voice(req: VoiceLogRequest):
    """Called by voice.html after each conversation turn."""
    log_to_firebase("conversations", {
        "type":        "voice",
        "user_id":     req.user_id,
        "room_name":   req.room_name,
        "query":       req.query,
        "response":    req.response,
        "duration_ms": req.duration_ms,
    })
    return {"status": "logged"}


@app.post("/chat")
def chat(req: ChatRequest):
    t = time.perf_counter()
    rag_context, rag_domain = "", ""
    try:
        domain, docs = retriever.retrieve(req.message)
        rag_context = "\n".join([d.get("text", d.get("answer", "")) for d in docs[:3]])[:1500]
        rag_domain  = domain
    except Exception as e:
        logger.warning(f"RAG failed: {e}")

    lang_map = {
        "hi":       "Always respond in natural Hindi using Devanagari script.",
        "en":       "Always respond in clear English.",
        "hinglish": "Always respond in Hinglish (mix of Hindi and English).",
    }
    resp = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are Narad, a helpful assistant for rural governance in India. "
                    f"{lang_map.get(req.language, lang_map['hinglish'])} "
                    f"Give complete helpful answers in 3-4 sentences. No bullet points."
                    + (f"\n\nContext:\n{rag_context}" if rag_context else "")
                ),
            },
            {"role": "user", "content": req.message},
        ],
        max_tokens=300,
        temperature=0.7,
    )
    latency_ms = round((time.perf_counter() - t) * 1000)
    reply      = resp.choices[0].message.content.strip()

    log_to_firebase("conversations", {
        "type":        "text_chat",
        "user_id":     req.user_id or "anonymous",
        "query":       req.message,
        "response":    reply,
        "language":    req.language,
        "rag_domain":  rag_domain,
        "rag_used":    bool(rag_context),
        "latency_ms":  latency_ms,
        "tokens_used": resp.usage.total_tokens,
    })

    return {
        "reply":       reply,
        "rag_domain":  rag_domain,
        "rag_used":    bool(rag_context),
        "latency_ms":  latency_ms,
        "tokens_used": resp.usage.total_tokens,
    }


@app.post("/rag")
def rag_search(req: RAGRequest):
    t = time.perf_counter()
    try:
        domain, docs = retriever.retrieve(req.query)
        return {
            "query":      req.query,
            "domain":     domain,
            "latency_ms": round((time.perf_counter() - t) * 1000),
            "results": [
                {"rank": i+1, "text": d.get("text", d.get("answer", ""))[:600], "score": d.get("score")}
                for i, d in enumerate(docs[:req.top_k])
            ],
        }
    except Exception as e:
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)