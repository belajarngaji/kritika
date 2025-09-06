import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==============================
// Supabase Config
// ==============================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// FastAPI Backend Endpoints
// ==============================
const API_URL = '/chat';
const CHECK_URL = '/check';

async function generateCriticalQuestion(text) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ message: text, session_id: "jurumiya-bab1" })
  });
  const data = await res.json();
  return data.reply;
}

async function checkAnswer(answer, materi) {
  const res = await fetch(CHECK_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ answer, context: materi, session_id: "jurumiya-bab1" })
  });
  const data = await res.json();
  return data.feedback;
}

// Event listener tombol
document.getElementById('btnGenerate').onclick = async () => {
  const materiText = document.getElementById('materiContent').innerText;
  const reply = await generateCriticalQuestion(materiText);
  document.getElementById('aiOutput').innerText = reply;
};

document.getElementById('btnCheck').onclick = async () => {
  const answer = document.getElementById('userAnswer').value;
  const materi = document.getElementById('materiContent').innerText;
  const feedback = await checkAnswer(answer, materi);
  document.getElementById('aiCorrection').innerText = feedback;
};
// Jalankan init
init();