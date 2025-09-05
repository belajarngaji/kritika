import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const API_URL = 'https://hmmz-bot01.vercel.app/chat';
const CHECK_URL = 'https://hmmz-bot01.vercel.app/check';

// ==============================
// Ambil materi dari Supabase
// ==============================
async function getMaterials() {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('id');
    if (error) {
      console.error('❌ Error fetch materials:', error);
      return [];
    }
    return data;
  } catch (err) {
    console.error('❌ Exception fetch materials:', err);
    return [];
  }
}

// ==============================
// Generate pertanyaan kritis AI
// ==============================
async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        message: `Buatkan 3 pertanyaan kritis dari teks berikut:\n${materialText}`,
        mode: "qa",
        session_id: "jurumiya-bab1"
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || null;
  } catch (err) {
    console.error('❌ Error AI generate:', err);
    return null;
  }
}

// ==============================
// Koreksi jawaban user via AI
// ==============================
async function checkAnswer(answer, materi) {
  try {
    const res = await fetch(CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ answer, context: materi, mode: "check" })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('✅ Response AI koreksi:', data);
    return data;
  } catch(err) {
    console.error('❌ Error AI koreksi:', err);
    return null;
  }
}

// ==============================
// INIT
// ==============================
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiOutput = document.getElementById('aiOutput');
  const userAnswer = document.getElementById('userAnswer');
  const btnCheck = document.getElementById('btnCheck');
  const aiCorrection = document.getElementById('aiCorrection');

  // Ambil materi
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');

  if (!materi) {
    materiContent.innerHTML = '<p>Materi belum tersedia.</p>';
    return;
  }

  // Tampilkan materi
  materiContent.innerHTML = materi.content;

  // ==============================
  // Event generate pertanyaan
  // ==============================
  if (!btnGenerate.dataset.listenerAdded) {
    btnGenerate.addEventListener('click', async () => {
      btnGenerate.disabled = true;
      btnGenerate.textContent = 'Loading...';
      aiOutput.innerHTML = '';

      const questions = await generateCriticalQuestion(materi.content);
      aiOutput.innerHTML = questions ? marked.parse(questions) : '<p>AI gagal generate pertanyaan.</p>';

      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Pertanyaan Kritis';
    });
    btnGenerate.dataset.listenerAdded = 'true';
  }

  // ==============================
  // Event cek jawaban
  // ==============================
  if (!btnCheck.dataset.listenerAdded) {
    btnCheck.addEventListener('click', async () => {
      const answerText = userAnswer.value.trim();
      if (!answerText) return alert('Tulis jawaban dulu!');

      aiCorrection.innerHTML = '<p>Memeriksa jawaban...</p>';

      const result = await checkAnswer(answerText, materi.content);

      if (result && typeof result === 'object' && 'score' in result && 'feedback' in result) {
        aiCorrection.innerHTML = `
          <p><strong>Skor:</strong> ${result.score}</p>
          <p><strong>Feedback:</strong> ${result.feedback}</p>
        `;
      } else {
        aiCorrection.innerHTML = '<p>AI gagal memeriksa jawaban.</p>';
      }
    });
    btnCheck.dataset.listenerAdded = 'true';
  }
}

init();