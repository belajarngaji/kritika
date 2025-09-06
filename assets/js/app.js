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
const API_URL = '/chat';   // Generate pertanyaan
const CHECK_URL = '/check'; // Koreksi jawaban

// ==============================
// Ambil materi dari Supabase
// ==============================
async function getMaterials() {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('id');
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('❌ Error fetch materials:', err);
    return [];
  }
}

// ==============================
// Generate pertanyaan kritis
// ==============================
async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: materialText,
        session_id: "jurumiya-bab1"
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || null;
  } catch (err) {
    console.error('❌ Error generate pertanyaan:', err);
    return null;
  }
}

// ==============================
// Koreksi jawaban user
// ==============================
async function checkAnswer(answer, materi) {
  try {
    const res = await fetch(CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer,
        context: materi,
        session_id: "jurumiya-bab1"
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('❌ Error koreksi jawaban:', err);
    return null;
  }
}

// ==============================
// Inisialisasi halaman
// ==============================
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');

  // Buat output AI jika belum ada
  let aiOutput = document.getElementById('aiOutput');
  if (!aiOutput) {
    aiOutput = document.createElement('div');
    aiOutput.id = 'aiOutput';
    aiOutput.classList.add('ai-output');
    btnGenerate.after(aiOutput);
  }

  // Buat kolom jawaban user
  let answerSection = document.querySelector('.answer-section');
  if (!answerSection) {
    answerSection = document.createElement('div');
    answerSection.classList.add('answer-section');
    answerSection.innerHTML = `
      <h3>Jawaban Anda</h3>
      <textarea id="userAnswer" rows="4" placeholder="Tulis jawaban Anda di sini..."></textarea>
      <button id="btnCheck" class="btn">Cek Jawaban</button>
    `;
    aiOutput.after(answerSection);
  }

  // Buat kolom koreksi AI
  let aiCorrection = document.getElementById('aiCorrection');
  if (!aiCorrection) {
    aiCorrection = document.createElement('div');
    aiCorrection.id = 'aiCorrection';
    aiCorrection.classList.add('ai-output');
    aiCorrection.innerHTML = '<p>Koreksi akan ditampilkan di sini.</p>';
    answerSection.after(aiCorrection);
  }

  // Ambil materi dari Supabase
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';

  // Event generate pertanyaan
  btnGenerate.addEventListener('click', async () => {
    if (!materi) return;
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';

    const questions = await generateCriticalQuestion(materi.content);
    aiOutput.innerHTML = questions || '<p>AI gagal generate pertanyaan.</p>';

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Pertanyaan Kritis';
  });

  // Event cek jawaban
  const btnCheck = document.getElementById('btnCheck');
  const userAnswer = document.getElementById('userAnswer');

  btnCheck.addEventListener('click', async () => {
    const answerText = userAnswer.value.trim();
    if (!answerText) return alert('Tulis jawaban dulu!');

    aiCorrection.innerHTML = '<p>Memeriksa jawaban...</p>';
    const result = await checkAnswer(answerText, materi.content);

    if (result && 'feedback' in result) {
      aiCorrection.innerHTML = `
        <p><strong>Skor:</strong> ${result.score || '?'}</p>
        <p><strong>Feedback:</strong> ${result.feedback}</p>
      `;
    } else {
      aiCorrection.innerHTML = '<p>AI gagal memeriksa jawaban.</p>';
    }
  });
}

// Jalankan init
init();