import os
import logging
import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()  # ambil OPENROUTER_API_KEY dari .env
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "openai/gpt-oss-120b"

BASE_SYSTEM_PROMPT = {
    "role": "system",
    "content": "Kamu adalah asisten AI. Jawab singkat dan jelas pertanyaan user atau koreksi jawaban user."
}

MODE_SETTINGS = {"max_tokens": 3000, "temperature": 0.3, "top_p": 0.9}
CONVERSATIONS = {}

def add_to_conversation(session_id: str, role: str, content: str):
    if session_id not in CONVERSATIONS:
        CONVERSATIONS[session_id] = []
    CONVERSATIONS[session_id].append({"role": role, "content": content})
    if len(CONVERSATIONS[session_id]) > 20:
        CONVERSATIONS[session_id] = CONVERSATIONS[session_id][-20:]

def call_openrouter_api(messages: list) -> str:
    if not OPENROUTER_API_KEY:
        return "❌ API key tidak ditemukan."
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "max_tokens": MODE_SETTINGS["max_tokens"],
            "temperature": MODE_SETTINGS["temperature"],
            "top_p": MODE_SETTINGS["top_p"]
        }
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logging.error(f"API error: {e}")
        return "❌ Error AI"

@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    materi_text = body.get("message", "").strip()
    session_id = body.get("session_id", "default")
    if not materi_text:
        return JSONResponse({"error": "Pesan kosong"}, status_code=400)
    add_to_conversation(session_id, "user", materi_text)
    messages = [BASE_SYSTEM_PROMPT] + CONVERSATIONS[session_id]
    reply = call_openrouter_api(messages)
    add_to_conversation(session_id, "assistant", reply)
    return {"reply": reply}

@app.post("/check")
async def check(request: Request):
    body = await request.json()
    answer = body.get("answer", "").strip()
    materi = body.get("context", "").strip()
    session_id = body.get("session_id", "default")
    if not answer or not materi:
        return JSONResponse({"error": "Answer atau context kosong"}, status_code=400)
    add_to_conversation(session_id, "user", f"Jawaban: {answer}\nMateri: {materi}")
    messages = [BASE_SYSTEM_PROMPT] + CONVERSATIONS[session_id]
    reply = call_openrouter_api(messages)
    add_to_conversation(session_id, "assistant", reply)
    return {"score": "?", "feedback": reply}