# api/index.py
import os
import logging
import requests
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env
load_dotenv()  
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Setup FastAPI
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

# Prompt dasar
BASE_SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "Kamu adalah asisten AI untuk materi pendidikan. "
        "Jika diminta, buat 3 pertanyaan kritis dari materi. "
        "Jika diminta, koreksi jawaban user dengan memberikan skor dan feedback singkat."
    )
}

def call_openrouter_api(messages: list) -> str:
    if not OPENROUTER_API_KEY:
        logging.error("OPENROUTER_API_KEY is not set.")
        return "❌ API key tidak ditemukan."
    try:
        headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
        payload = {"model": MODEL_NAME, "messages": messages, "max_tokens": 3000, "temperature": 0.3, "top_p": 0.9}
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        logging.error(f"API error: {e}")
        return "❌ Error saat memproses respons AI."

# Generate pertanyaan
@app.post("/chat")
async def chat(request: Request):
    try:
        body = await request.json()
        materi_text = body.get("message", "").strip()
        if not materi_text:
            return JSONResponse({"error": "Materi kosong"}, status_code=400)

        messages = [
            BASE_SYSTEM_PROMPT,
            {"role": "user", "content": f"Buatkan 3 pertanyaan kritis dari teks berikut:\n{materi_text}"}
        ]
        reply = call_openrouter_api(messages)
        return {"reply": reply}
    except Exception as e:
        logging.error(f"/chat error: {e}")
        return JSONResponse({"error": "Bad request"}, status_code=400)

# Koreksi jawaban
@app.post("/check")
async def check(request: Request):
    try:
        body = await request.json()
        answer = body.get("answer", "").strip()
        materi = body.get("context", "").strip()
        if not answer or not materi:
            return JSONResponse({"error": "Answer atau context kosong"}, status_code=400)

        messages = [
            BASE_SYSTEM_PROMPT,
            {"role": "user", "content": f"Materi: {materi}\nJawaban user: {answer}\nBerikan skor 0-100 dan feedback singkat."}
        ]
        reply = call_openrouter_api(messages)
        return {"score": "?", "feedback": reply}
    except Exception as e:
        logging.error(f"/check error: {e}")
        return JSONResponse({"error": "Bad request"}, status_code=400)