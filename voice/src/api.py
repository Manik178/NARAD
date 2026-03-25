import os
import sys
import uuid
import time
import json
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional
import json

from geopy.geocoders import Nominatim
from time import sleep

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import base64
from pydantic import BaseModel
from dotenv import load_dotenv
from livekit.api import AccessToken, VideoGrants, LiveKitAPI
from livekit.protocol.agent_dispatch import CreateAgentDispatchRequest
from groq import Groq
import firebase_admin
from firebase_admin import credentials, firestore
from Social_reddit import get_complaint_data

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
# Lazy-load RAG to avoid TensorFlow import errors at startup
_retriever = None
def get_retriever():
    global _retriever
    if _retriever is None:
        from rag.retriever import SmartRetriever
        _retriever = SmartRetriever()
    return _retriever

load_dotenv(".env.local")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("narad.api")

LIVEKIT_URL        = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY    = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
GROQ_API_KEY       = os.getenv("GROQ_API_KEY")
groq_client        = Groq(api_key=GROQ_API_KEY)

geolocator = Nominatim(user_agent="narad_governance_platform")
MAP_DATA_FILE = "complaint_data_with_coords.json"


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


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Narad API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Static files for proof images ──────────────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ── Request models ─────────────────────────────────────────────────────────────

class TokenRequest(BaseModel):
    user_id: Optional[str] = None
    room_name: Optional[str] = "narad-room"
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_village: Optional[str] = None

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
    phone: Optional[str] = None
    interaction_type: str       # 'query' or 'complaint'
    room_name: Optional[str] = "narad-room"

class InteractionRequest(BaseModel):
    """Sent by agent.py at end of conversation."""
    name: str
    village: str
    phone: Optional[str] = None
    interaction_type: str
    summary: str                # one-sentence English summary of the conversation
    category: str               # e.g. 'ration card', 'pension', 'road', 'water'
    urgency: Optional[str] = "not_urgent"  # 'emergency', 'urgent', 'not_urgent'
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
        from livekit.protocol.room import UpdateRoomMetadataRequest
        async with LiveKitAPI(
            url=LIVEKIT_URL,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
        ) as lk:
            # Set room metadata with user info so the agent can read it
            if req.user_name:
                room_metadata = json.dumps({
                    "user_name": req.user_name,
                    "user_phone": req.user_phone or "",
                    "user_village": req.user_village or "",
                })
                try:
                    await lk.room.update_room_metadata(
                        UpdateRoomMetadataRequest(room=req.room_name, metadata=room_metadata)
                    )
                    logger.info(f"Room metadata set: {room_metadata}")
                except Exception as e:
                    logger.warning(f"Failed to set room metadata: {e}")

            # Build dispatch metadata with user info from the frontend form
            dispatch_metadata = ""
            if req.user_name:
                dispatch_metadata = json.dumps({
                    "user_name": req.user_name,
                    "user_phone": req.user_phone or "",
                    "user_village": req.user_village or "",
                })
            await lk.agent_dispatch.create_dispatch(
                CreateAgentDispatchRequest(
                    agent_name="my-agent",
                    room=req.room_name,
                    metadata=dispatch_metadata,
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
        "phone":            req.phone,
        "interaction_type": req.interaction_type,   # 'query' or 'complaint'
        "room_name":        req.room_name,
    })
    logger.info(f"User logged — {req.name} / {req.village} / {req.phone} / {req.interaction_type}")
    return {"status": "logged"}


@app.post("/log_interaction")
def log_interaction(req: InteractionRequest):
    """
    Called by agent.py at end of conversation.
    Always generates a complaint_id for tracking.
    """
    complaint_id = f"NRD-{uuid.uuid4().hex[:6].upper()}"

    data = {
        "name":             req.name,
        "village":          req.village,
        "phone":            req.phone,
        "interaction_type": req.interaction_type,
        "summary":          req.summary,
        "category":         req.category,
        "urgency":          req.urgency or "not_urgent",
        "room_name":        req.room_name,
        "status":           "Pending",
        "complaint_id":     complaint_id,
    }

    log_to_firebase("interactions", data)
    logger.info(f"Interaction logged — {req.name} / {req.category} / {req.interaction_type} / urgency={req.urgency} (ID: {complaint_id})")
    return {"status": "logged", "complaint_id": complaint_id}


@app.get("/complaints")
def list_complaints():
    """Returns all interactions from Firestore."""
    if db is None:
        raise HTTPException(503, "Database not connected")
    try:
        docs = db.collection("interactions").order_by("timestamp", direction=firestore.Query.DESCENDING).get()
        results = []
        for doc in docs:
            d = doc.to_dict()
            d["doc_id"] = doc.id
            results.append(d)
        return {"complaints": results}
    except Exception as e:
        logger.error(f"Error listing complaints: {e}")
        # Fallback without ordering if index not ready
        try:
            docs = db.collection("interactions").get()
            results = []
            for doc in docs:
                d = doc.to_dict()
                d["doc_id"] = doc.id
                results.append(d)
            return {"complaints": results}
        except Exception as e2:
            raise HTTPException(500, f"Error listing complaints: {e2}")


@app.get("/complaint/{complaint_id}")
def get_complaint(complaint_id: str):
    """Lookup a single complaint by its token ID."""
    if db is None:
        raise HTTPException(503, "Database not connected")
    try:
        docs = db.collection("interactions").where("complaint_id", "==", complaint_id.upper()).limit(1).get()
        if not docs:
            raise HTTPException(404, "Complaint not found")
        d = docs[0].to_dict()
        d["doc_id"] = docs[0].id
        return d
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/complaint/{complaint_id}/resolve")
async def resolve_complaint(complaint_id: str, proof_image: UploadFile = File(None), resolution_note: str = Form("")):
    """Admin: mark a complaint as Completed with optional proof image."""
    if db is None:
        raise HTTPException(503, "Database not connected")
    try:
        docs = db.collection("interactions").where("complaint_id", "==", complaint_id.upper()).limit(1).get()
        if not docs:
            raise HTTPException(404, "Complaint not found")

        update_data = {
            "status": "Completed",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "resolution_note": resolution_note,
        }

        # Save proof image if provided
        if proof_image and proof_image.filename:
            ext = os.path.splitext(proof_image.filename)[1] or ".jpg"
            fname = f"{complaint_id}{ext}"
            fpath = os.path.join(UPLOAD_DIR, fname)
            content = await proof_image.read()
            with open(fpath, "wb") as f:
                f.write(content)
            update_data["proof_image"] = f"/uploads/{fname}"
            logger.info(f"Proof image saved: {fpath}")

        doc_ref = db.collection("interactions").document(docs[0].id)
        doc_ref.update(update_data)
        logger.info(f"Complaint {complaint_id} resolved")
        return {"status": "resolved", "complaint_id": complaint_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving complaint: {e}")
        raise HTTPException(500, str(e))


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
        retriever = get_retriever()
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
        retriever = get_retriever()
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
    
def get_coordinates(location_name):
    try:
        location = geolocator.geocode(location_name)
        if location:
            return location.latitude, location.longitude
    except:
        return None, None
    return None, None

    
@app.post("/scrape")
async def trigger_scrape():
    """
    Scrapes Reddit, geocodes locations, and saves to a JSON file.
    """
    logger.info("Starting Web Scrape...")
    
    # 1. Scrape data using your existing logic in Social_reddit.py
    # We pass a temporary filename or handle the list return
    raw_complaints = get_complaint_data(limit = 2)
    
    enriched_data = []
    
    # 2. Add coordinates to each complaint
    if (raw_complaints):
        for item in raw_complaints:
            # Check if locations exist in the Gemini-extracted JSON
            locations = item.get("locations", [])
            coords_list = []
            
            for loc_name in locations:
                lat, lon = get_coordinates(loc_name)
                if lat and lon:
                    coords_list.append({
                        "name": loc_name,
                        "lat": lat,
                        "lon": lon
                    })
                sleep(1) # Respect Nominatim usage limits
            
            item["coords"] = coords_list
            enriched_data.append(item)
        
    # 3. Save to the final JSON file
    with open(MAP_DATA_FILE, "w") as f:
        json.dump(enriched_data, f, indent=4)
        
    return {"status": "success", "count": len(enriched_data)}


@app.get("/get-map-data")
async def get_map_data():
    """
    Reads the saved JSON file and returns it to the frontend.
    """
    if os.path.exists(MAP_DATA_FILE):
        with open(MAP_DATA_FILE, "r") as f:
            return json.load(f)
    return []

@app.post("/generate_announcement")
async def generate_announcement(data: dict):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=data,
            timeout=30,
        )
    return res.json()


class AnnouncementRequest(BaseModel):
    title: str
    body: str
    footer: str = ""
    department: str = "Gram Panchayat"
    urgency: str = "normal"


@app.post("/announcements")
def publish_announcement(req: AnnouncementRequest):
    """Admin: publish an announcement visible to all users."""
    data = {
        "title":      req.title,
        "body":       req.body,
        "footer":     req.footer,
        "department": req.department,
        "urgency":    req.urgency,
        "active":     True,
    }
    log_to_firebase("announcements", data)
    logger.info(f"Announcement published: {req.title[:50]}")
    return {"status": "published"}


@app.get("/announcements")
def list_announcements():
    """Public: list all active announcements."""
    if db is None:
        return {"announcements": []}
    try:
        docs = db.collection("announcements").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).get()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if d.get("active", True):
                results.append(d)
        return {"announcements": results}
    except Exception as e:
        logger.warning(f"Announcements list error: {e}")
        try:
            docs = db.collection("announcements").limit(10).get()
            results = [doc.to_dict() for doc in docs if doc.to_dict().get("active", True)]
            return {"announcements": results}
        except Exception:
            return {"announcements": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)