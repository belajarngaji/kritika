import os
import logging
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# ===== Load API key dari GitHub Secret via env =====
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
MODEL_NAME = "openai/gpt-oss-120b" # Mengganti model jika yang lama tidak ada
BASE_SYSTEM_PROMPT = {
    "role": "system",
    "content": "Kamu adalah asisten AI yang memberikan jawaban singkat, jelas, dan relevan. Hanya jawab pertanyaan user atau koreksi jawaban user."
}
MODE_SETTINGS = {"max_tokens": 1024, "temperature": 0.3, "top_p": 0.9}
CONVERSATIONS = {}
MAX_HISTORY = 10

def add_to_conversation(session_id: str, role: str, content: str):
    if session_id not in CONVERSATIONS:
        CONVERSATIONS[session_id] = []
    CONVERSATIONS[session_id].append({"role": role, "content": content})
    if len(CONVERSATIONS[session_id]) > MAX_HISTORY*2:
        CONVERSATIONS[session_id] = CONVERSATIONS[session_id][-MAX_HISTORY*2:]

def call_openrouter_api(messages: list) -> str:
    if not OPENROUTER_API_KEY:
        logging.error("OPENROUTER_API_KEY tidak ditemukan.")
        return "❌ Error: API key tidak ditemukan."
    try:
        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "max_tokens": MODE_SETTINGS["max_tokens"],
            "temperature": MODE_SETTINGS["temperature"],
            "top_p": MODE_SETTINGS["top_p"]
        }
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logging.error(f"API error: {e}")
        return "❌ Error saat memproses respons AI."

@app.post("/chat")
async def chat(request: Request):
    try:
        body = await request.json()
        materi_text = body.get("message", "").strip()
        session_id = body.get("session_id", "default")
        if not materi_text:
            return JSONResponse({"error": "Pesan kosong"}, status_code=400)
        
        # Buat prompt yang lebih spesifik
        prompt = f"Berdasarkan materi berikut:\n---\n{materi_text}\n---\nBuatlah satu pertanyaan kritis dan mendalam yang relevan dengan materi tersebut."
        add_to_conversation(session_id, "user", prompt)
        
        messages = [BASE_SYSTEM_PROMPT] + CONVERSATIONS[session_id]
        reply = call_openrouter_api(messages)
        add_to_conversation(session_id, "assistant", reply)
        return {"reply": reply, "session_id": session_id}
    except Exception as e:
        logging.error(f"/chat error: {e}")
        return JSONResponse({"error": "Bad request"}, status_code=400)

@app.post("/check")
async def check(request: Request):
    try:
        body = await request.json()
        answer = body.get("answer", "").strip()
        materi = body.get("context", "").strip()
        session_id = body.get("session_id", "default")
        if not answer or not materi:
            return JSONResponse({"error": "Answer atau context kosong"}, status_code=400)
        
        # Ambil pertanyaan terakhir dari histori
        last_question = ""
        if session_id in CONVERSATIONS:
            for msg in reversed(CONVERSATIONS[session_id]):
                if msg["role"] == "assistant":
                    last_question = msg["content"]
                    break
        
        prompt = f"Materi: {materi}\nPertanyaan: {last_question}\nJawaban user: {answer}\n\nBerikan feedback atau koreksi yang membangun atas jawaban user berdasarkan materi dan pertanyaan tersebut. Jawab dengan singkat dan jelas."
        
        # Tidak perlu menyimpan histori koreksi agar tidak membingungkan chat berikutnya
        messages_for_check = [BASE_SYSTEM_PROMPT, {"role": "user", "content": prompt}]
        
        reply = call_openrouter_api(messages_for_check)
        
        # === INI BAGIAN YANG DITAMBAHKAN ===
        return {"feedback": reply, "session_id": session_id}
        # ====================================

    except Exception as e:
        logging.error(f"/check error: {e}")
        return JSONResponse({"error": "Internal server error"}, status_code=500)
