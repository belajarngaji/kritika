# api/index.py
import os
import logging
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS agar bisa diakses dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

OPENROUTER_API_KEY = ("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "openai/gpt-oss-120b"

# Prompt dasar untuk generate & koreksi
BASE_SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "Kamu adalah asisten AI yang memberikan jawaban singkat, jelas, dan relevan. "
        "Hanya jawab pertanyaan user atau koreksi jawaban user."
    )
}

# Konfigurasi mode QA
MODE_SETTINGS = {
    "qa": {"max_tokens": 3000, "temperature": 0.3, "top_p": 0.9}
}

# Riwayat percakapan per session
CONVERSATIONS = {}
MAX_HISTORY = 10

def add_to_conversation(session_id: str, role: str, content: str):
    if session_id not in CONVERSATIONS:
        CONVERSATIONS[session_id] = []
    CONVERSATIONS[session_id].append({"role": role, "content": content})
    if len(CONVERSATIONS[session_id]) > MAX_HISTORY * 2:
        CONVERSATIONS[session_id] = CONVERSATIONS[session_id][-MAX_HISTORY*2:]

def call_openrouter_api(messages: list) -> str:
    if not OPENROUTER_API_KEY:
        logging.error("OPENROUTER_API_KEY is not set.")
        return "❌ Error: API key tidak ditemukan."
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "max_tokens": MODE_SETTINGS["qa"]["max_tokens"],
            "temperature": MODE_SETTINGS["qa"]["temperature"],
            "top_p": MODE_SETTINGS["qa"]["top_p"]
        }
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logging.error(f"API error: {e}")
        return "❌ Error saat memproses respons AI."

@app.post("/chat")
async def chat(request: Request):
    """Generate pertanyaan kritis dari materi."""
    try:
        body = await request.json()
        materi_text = body.get("message", "").strip()
        session_id = body.get("session_id", "default")

        if not materi_text:
            return JSONResponse({"error": "Pesan kosong"}, status_code=400)

        add_to_conversation(session_id, "user", materi_text)
        messages = [BASE_SYSTEM_PROMPT] + CONVERSATIONS[session_id]
        reply = call_openrouter_api(messages)
        add_to_conversation(session_id, "assistant", reply)

        return {"reply": reply, "session_id": session_id}
    except Exception as e:
        logging.error(f"/chat error: {e}")
        return JSONResponse({"error": "Bad request"}, status_code=400)

@app.post("/check")
async def check(request: Request):
    """Koreksi jawaban user berdasarkan materi."""
    try:
        body = await request.json()
        answer = body.get("answer", "").strip()
        materi = body.get("context", "").strip()
        session_id = body.get("session_id", "default")

        if not answer or not materi:
            return JSONResponse({"error": "Answer atau context kosong"}, status_code=400)

        add_to_conversation(session_id, "user", f"Jawaban user: {answer}\nMateri: {materi}")
        messages = [BASE_SYSTEM_PROMPT] + CONVERSATIONS[session_id]
        reply = call_openrouter_api(messages)
        add_to_conversation(session_id, "assistant", reply)

        # Optional: bisa parse skor & feedback dari reply jika backend AI formatnya
        return {"score": "?", "feedback": reply, "session_id": session_id}
    except Exception as e:
        logging.error(f"/check error: {e}")
        return JSONResponse({"error": "Bad request"}, status_code=400)