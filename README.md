# NARAD — Rural Governance Intelligence Platform

NARAD is a comprehensive AI platform designed to bridge the connectivity and accessibility gap between rural citizens and Indian government services. It provides a voice-first interface, data visualization, and automated complaint listening for transparent and efficient governance.

## 🏛️ Project Vision
In many rural areas, high-tech digital portals remain inaccessible due to literacy gaps or technical friction. NARAD solves this by providing **Narad AI**, a conversational assistant that speaks the language of the people, collects their issues, and routes them directly to the right administrative channels.

---

## 🏗️ System Architecture

The project consists of three interconnected layers:

### 1. Narad Web Platform (`/narad-web`)
*   **Technology**: Vite + Vanilla JS + Tailwind CSS + OGL (WebGL).
*   **Key Features**:
    *   **Direct Governance Portal**: A voice-activated command center.
    *   **WebGL Orb Interaction**: Real-time visual feedback for voice sessions.
    *   **Admin Dashboard**: Heatmaps and analytical oversight of incoming citizen queries.

### 2. Voice AI Backend (`/voice`)
*   **Technology**: FastAPI + LiveKit Agents + Groq LLM.
*   **Key Features**:
    *   **Conversational Hindi Agent**: Mature, calm voice using Devanagari script.
    *   **Live Event Streaming**: Low-latency audio and transcription via LiveKit.
    *   **Automated Classification**: Automatically determines if an interaction is a general query or a formal complaint.

### 3. Governance Analytics & Listening (Root Files)
*   **Technology**: Python + Gemini AI + Streamlit + Folium.
*   **Components**:
    *   `main.py`: Social Listening API — Scrapes Reddit (r/india, etc.) to detect citizen complaints using zero-shot classification and Gemini structured extraction.
    *   `app.py`: India Governance Pulse — A Streamlit dashboard that maps complaints and provides a high-level view of governance trends.

---

## 🚀 Getting Started

### Backend Setup (Voice AI)
1.  Navigate to `/voice`.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Copy `.env.example` to `.env.local` and add your API keys.
4.  Run the API: `uv run python src/api.py`.
5.  Start the Agent: `uv run src/agent.py start`.

### Frontend Setup
1.  Navigate to `/narad-web`.
2.  Install dependencies: `npm install`.
3.  Start the dev server: `npm run dev`.

### Analytics Tools
1.  In the root directory, install requirements: `pip install -r requirements.txt`.
2.  Run the Reddit scraper: `python main.py`.
3.  Run the Analytics Dashboard: `streamlit run app.py`.

---

## 🛠️ Problems Solved
*   **Accessibility**: Voice-first design for non-literate populations.
*   **Transparency**: Citizens can "talk" to the system; admins see real-time heatmaps of issues.
*   **Intervention**: Automatic routing of complaints to Block Offices and Gram Panchayats.
*   **Social Listening**: Detecting issues from social media before they escalate.

---

## 📋 Dependencies & Environment
*   **Core AI**: Groq (Llama-3), OpenAI (Whisper), Gemini (Structured Extraction).
*   **Real-time**: LiveKit Cloud.
*   **Frontend**: Vanilla JS with OGL for WebGL animations.
*   **Styling**: Modern dark-mode "Saffron Edition" (Tailwind CSS).
