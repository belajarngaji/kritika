import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_URL = 'https://hmmz-bot01.vercel.app/chat';
const CHECK_URL = 'https://hmmz-bot01.vercel.app/check';

// Ambil semua materi
async function getMaterials() {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('id');
    if (error) { console.error(error); return []; }
    return data;
  } catch (err) { console.error(err); return []; }
}

// Generate pertanyaan AI
async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ message: materialText, mode: "qa" })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || null;
  } catch(err) { console.error(err); return null; }
}

// Koreksi jawaban
async function checkAnswer(answer, materi) {
  try {
    const res = await fetch(CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ answer, context: materi, mode: "check" })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch(err) { console.error(err); return null; }
}

// ==============================
// Inisialisasi halaman materi
// ==============================
// Pastikan struktur HTML di main content:
// materiContent
// btnGenerate
// aiOutput
// kolom jawaban & koreksi (akan dibuat JS)

// INIT
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  
  // Buat aiOutput hanya sekali
  let aiOutput = document.getElementById('aiOutput');
  if (!aiOutput) {
    aiOutput = document.createElement('div');
    aiOutput.id = 'aiOutput';
    aiOutput.classList.add('ai-output');
    btnGenerate.after(aiOutput); // Hasil generate muncul tepat di bawah tombol
  }

  // Buat kolom jawaban & koreksi hanya jika belum ada
  let answerSection = document.querySelector('.answer-section');
  if (!answerSection) {
    answerSection = document.createElement('div');
    answerSection.classList.add('answer-section');
    answerSection.innerHTML = `
      <h3>Jawaban Anda</h3>
      <textarea id="userAnswer" placeholder="Tulis jawaban Anda di sini..." rows="4"></textarea>
      <button id="btnCheck" class="btn">Cek Jawaban</button>
    `;
    aiOutput.after(answerSection); // Kolom jawaban muncul setelah aiOutput
  }

  let aiCorrection = document.getElementById('aiCorrection');
  if (!aiCorrection) {
    aiCorrection = document.createElement('div');
    aiCorrection.id = 'aiCorrection';
    aiCorrection.classList.add('ai-output');
    aiCorrection.innerHTML = '<p>Koreksi akan ditampilkan di sini setelah dicek.</p>';
    answerSection.after(aiCorrection);
  }

  // Ambil materi dari Supabase
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';

  // Event Generate Pertanyaan
  btnGenerate.addEventListener('click', async () => {
    if (!materi) return;
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = ''; // Hasil generate masuk sini

    const questions = await generateCriticalQuestion(materi.content);
    aiOutput.innerHTML = questions ? marked.parse(questions) : '<p>AI gagal generate pertanyaan.</p>';

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Pertanyaan Kritis';
  });

  // Event Cek Jawaban
  const btnCheck = document.getElementById('btnCheck');
  const userAnswer = document.getElementById('userAnswer');
  btnCheck.addEventListener('click', async () => {
    const answerText = userAnswer.value.trim();
    if (!answerText) return alert('Tulis jawaban dulu!');

    aiCorrection.innerHTML = '<p>Memeriksa jawaban...</p>';
    const result = await checkAnswer(answerText, materi.content);

    if (result && 'score' in result && 'feedback' in result) {
      aiCorrection.innerHTML = `
        <p><strong>Skor:</strong> ${result.score}</p>
        <p><strong>Feedback:</strong> ${result.feedback}</p>
      `;
    } else {
      aiCorrection.innerHTML = '<p>AI gagal memeriksa jawaban.</p>';
    }
  });
}

init();