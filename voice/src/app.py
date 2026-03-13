import streamlit as st
import requests
import streamlit.components.v1 as components

API_URL = "http://localhost:8000"

st.set_page_config(page_title="Narad Voice Tester", page_icon="🪔", layout="centered")

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
* { font-family: 'DM Sans', sans-serif !important; }
.stApp { background: #0A0500 !important; }
.stButton > button {
    background: #FF6B00 !important; color: white !important;
    border: none !important; border-radius: 10px !important;
    font-weight: 600 !important; font-size: 16px !important;
    padding: 10px 28px !important; width: 100% !important;
}
.stButton > button:hover { background: #e05e00 !important; }
.stTextInput > div > div > input {
    background: #180C02 !important; border: 1px solid #2E1505 !important;
    color: #F0DEC8 !important; border-radius: 8px !important;
}
label, .stTextInput label { color: #6A4A2A !important; font-size: 12px !important; }
h1, h2, h3, p { color: #F0DEC8 !important; }
</style>
""", unsafe_allow_html=True)

st.markdown("## 🪔 Narad Voice Agent Tester")
st.caption("Live voice test — mic input → STT → Groq LLM + RAG → TTS → speaker")

# ── Check API is alive ────────────────────────────────────────────────────────
try:
    h = requests.get(f"{API_URL}/health", timeout=3).json()
    svc = h.get("services", {})
    ok = all([svc.get("groq"), svc.get("livekit"), svc.get("rag")])
    if ok:
        st.success("✓ API healthy — Groq, LiveKit, RAG all online")
    else:
        st.warning(f"⚠️ Some services down: {svc}")
except Exception:
    st.error("❌ API not reachable — run `python src/api.py` first")
    st.stop()

st.divider()

# ── Room config ───────────────────────────────────────────────────────────────
col1, col2 = st.columns(2)
with col1:
    room = st.text_input("Room Name", value="narad-room")
with col2:
    uid = st.text_input("User ID", placeholder="auto-generated")

# ── Session state ─────────────────────────────────────────────────────────────
if "voice_active" not in st.session_state:
    st.session_state.voice_active = False
if "token_data" not in st.session_state:
    st.session_state.token_data = None

# ── Connect button ────────────────────────────────────────────────────────────
if not st.session_state.voice_active:
    if st.button("🎙️ Start Voice Session"):
        with st.spinner("Getting token..."):
            try:
                r = requests.post(f"{API_URL}/token", json={
                    "user_id": uid.strip() or None,
                    "room_name": room.strip() or "narad-room",
                })
                data = r.json()
                if r.status_code == 200:
                    st.session_state.token_data = data
                    st.session_state.voice_active = True
                    st.rerun()
                else:
                    st.error(f"Token error: {data}")
            except Exception as e:
                st.error(f"Failed: {e}")
else:
    if st.button("✕ End Session"):
        st.session_state.voice_active = False
        st.session_state.token_data = None
        st.rerun()

# ── Embedded voice UI ─────────────────────────────────────────────────────────
if st.session_state.voice_active and st.session_state.token_data:
    d = st.session_state.token_data
    token       = d["token"]
    livekit_url = d["livekit_url"]
    user_id     = d["user_id"]

    st.success(f"Room joined as `{user_id}` — allow mic access when prompted")
    st.info("⚠️ Make sure `uv run src/agent.py dev` is running in a separate terminal")

    html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #0A0500;
    color: #F0DEC8;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 380px;
    gap: 20px;
    padding: 28px 20px;
}}

/* Status */
#status {{
    font-size: 12px;
    color: #6A4A2A;
    font-family: monospace;
    letter-spacing: 0.5px;
    min-height: 16px;
    text-align: center;
}}

/* Orb */
#orb {{
    width: 110px;
    height: 110px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    transition: all 0.3s;
    background: radial-gradient(circle at 35% 35%, #2A1200, #120800);
    border: 2px solid #2E1505;
    box-shadow: none;
}}
#orb.connecting {{
    border-color: #FF6B00;
    animation: blink 1s ease infinite;
}}
#orb.listening {{
    background: radial-gradient(circle at 35% 35%, #FF8C00, #FF4500, #8B0000);
    border-color: #FF6B00;
    box-shadow: 0 0 40px #FF6B0099;
    animation: pulse 1.5s ease-in-out infinite;
}}
#orb.speaking {{
    background: radial-gradient(circle at 35% 35%, #FFD700, #FF8C00, #FF4500);
    border-color: #FFB300;
    box-shadow: 0 0 55px #FFB300BB;
    animation: speak 0.45s ease-in-out infinite alternate;
}}
@keyframes blink  {{ 0%,100%{{opacity:1}} 50%{{opacity:0.4}} }}
@keyframes pulse  {{ 0%,100%{{transform:scale(1)}} 50%{{transform:scale(1.1)}} }}
@keyframes speak  {{ 0%{{transform:scale(1)}} 100%{{transform:scale(1.18)}} }}

/* Volume bar */
#vol-wrap {{
    width: 200px;
    height: 4px;
    background: #2E1505;
    border-radius: 2px;
    overflow: hidden;
}}
#vol-bar {{
    height: 100%;
    width: 0%;
    background: #FF6B00;
    border-radius: 2px;
    transition: width 0.08s;
}}

/* Transcript box */
#box {{
    width: 100%;
    max-width: 400px;
    background: #180C02;
    border: 1px solid #2E1505;
    border-left: 3px solid #FFB300;
    border-radius: 10px;
    padding: 14px 18px;
    min-height: 70px;
    text-align: center;
}}
#box .lbl {{
    font-size: 10px;
    color: #6A4A2A;
    font-family: monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
}}
#txt {{
    font-size: 15px;
    line-height: 1.75;
    color: #F0DEC8;
    min-height: 24px;
}}

/* Unmute button */
#unmute-btn {{
    background: #FF6B00;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 22px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: none;
    font-family: 'DM Sans', sans-serif;
}}
#unmute-btn:hover {{ background: #e05e00; }}
</style>
</head>
<body>

<div id="status">Connecting to LiveKit…</div>
<div id="orb" class="connecting">🪔</div>
<div id="vol-wrap"><div id="vol-bar"></div></div>
<div id="box">
    <div class="lbl">Live Transcript</div>
    <div id="txt">Waiting…</div>
</div>
<button id="unmute-btn" onclick="unmute()">🔊 Tap to hear Narad</button>

<script src="https://cdn.jsdelivr.net/npm/livekit-client@2/dist/livekit-client.umd.min.js"></script>
<script>
const WS    = "{livekit_url}";
const TOKEN = "{token}";

const orb       = document.getElementById("orb");
const statusEl  = document.getElementById("status");
const txtEl     = document.getElementById("txt");
const volBar    = document.getElementById("vol-bar");
const unmuteBtn = document.getElementById("unmute-btn");

let pendingAudio  = null;
let volInterval   = null;

const setStatus = (m, c) => {{ statusEl.textContent = m; if(c) statusEl.style.color = c; }};
const setTxt    = t => {{ if(t && t.trim()) txtEl.textContent = t; }};
const setOrb    = (cls, emoji) => {{ orb.className = cls; if(emoji) orb.textContent = emoji; }};

function unmute() {{
    if (pendingAudio) {{
        pendingAudio.play().catch(()=>{{}});
        pendingAudio = null;
    }}
    unmuteBtn.style.display = "none";
    setOrb("speaking", "🔊");
    setStatus("Narad is speaking…");
}}

// Mic volume meter
function startMeter() {{
    try {{
        navigator.mediaDevices.getUserMedia({{audio:true}}).then(stream => {{
            const ctx = new AudioContext();
            const src = ctx.createMediaStreamSource(stream);
            const an  = ctx.createAnalyser();
            an.fftSize = 256;
            src.connect(an);
            const buf = new Uint8Array(an.frequencyBinCount);
            volInterval = setInterval(() => {{
                an.getByteFrequencyData(buf);
                const avg = buf.reduce((a,b)=>a+b,0)/buf.length;
                volBar.style.width = Math.min(avg*2.5, 100) + "%";
            }}, 80);
        }});
    }} catch(e) {{}}
}}

async function connect() {{
    const room = new LivekitClient.Room({{
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {{
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        }},
    }});

    room.on(LivekitClient.RoomEvent.Connected, async () => {{
        setStatus("✓ Connected — speak to Narad", "#4CAF82");
        setOrb("listening");
        await room.localParticipant.setMicrophoneEnabled(true);
        startMeter();
    }});

    room.on(LivekitClient.RoomEvent.Disconnected, () => {{
        setStatus("Session ended");
        setOrb("", "🪔");
        clearInterval(volInterval);
    }});

    // Agent joins room
    room.on(LivekitClient.RoomEvent.ParticipantConnected, p => {{
        if (!p.isLocal) setStatus("Narad joined — listening…", "#4CAF82");
    }});

    // Agent speaks — attach audio
    room.on(LivekitClient.RoomEvent.TrackSubscribed, (track, pub, participant) => {{
        if (track.kind !== LivekitClient.Track.Kind.Audio || participant.isLocal) return;

        const audio = track.attach();
        audio.autoplay = true;
        document.body.appendChild(audio);

        audio.play().then(() => {{
            setOrb("speaking", "🔊");
            setStatus("Narad is speaking…");
        }}).catch(() => {{
            // Autoplay blocked — show tap button
            pendingAudio = audio;
            unmuteBtn.style.display = "inline-block";
            setStatus("👆 Tap the button to hear Narad", "#FFB300");
        }});

        audio.addEventListener("play",  () => {{ setOrb("speaking", "🔊"); setStatus("Narad is speaking…"); }});
        audio.addEventListener("ended", () => {{ setOrb("listening");     setStatus("🎙️ Listening…"); }});
        audio.addEventListener("pause", () => {{ setOrb("listening");     setStatus("🎙️ Listening…"); }});
    }});

    room.on(LivekitClient.RoomEvent.TrackUnsubscribed, track => {{
        if (track.kind === LivekitClient.Track.Kind.Audio) {{
            track.detach();
            setOrb("listening");
            setStatus("🎙️ Listening…");
        }}
    }});

    // Transcripts
    room.on(LivekitClient.RoomEvent.TranscriptionReceived, segments => {{
        const t = segments.map(s => s.text).join(" ").trim();
        if (t) setTxt(t);
    }});

    room.on(LivekitClient.RoomEvent.DataReceived, data => {{
        try {{ const m = JSON.parse(new TextDecoder().decode(data)); if(m.text) setTxt(m.text); }} catch{{}}
    }});

    room.on(LivekitClient.RoomEvent.ActiveSpeakersChanged, speakers => {{
        const agent = speakers.some(s => !s.isLocal);
        const user  = speakers.some(s =>  s.isLocal);
        if      (agent) {{ setOrb("speaking", "🔊"); setStatus("Narad is speaking…"); }}
        else if (user)  {{ setStatus("🎙️ Hearing you…"); }}
    }});

    try {{
        await room.connect(WS, TOKEN);
    }} catch(e) {{
        setStatus("❌ " + e.message, "#E05252");
        setOrb("", "🪔");
    }}
}}

connect();
</script>
</body>
</html>
"""
    components.html(html, height=440, scrolling=False)