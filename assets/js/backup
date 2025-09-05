import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_URL = 'https://hmmz-bot01.vercel.app/chat';

// Ambil materi dari Supabase
async function getMaterials() {
  const { data, error } = await supabase.from('materials').select('*').order('id');
  if (error) { console.error('❌ Error fetch materials:', error); return []; }
  return data;
}

// Generate pertanyaan kritis AI
async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message:`Buatkan 3 pertanyaan kritis dari teks berikut:\n${materialText}`,
        mode:"qa",
        session_id:"jurumiya-bab1"
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || null;
  } catch (err) { console.error('❌ Error AI:', err); return null; }
}

// Koreksi jawaban user via AI
async function checkAnswer(answer, materi) {
  try {
    const res = await fetch('https://hmmz-bot01.vercel.app/check', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ answer, context: materi, mode: "check" })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch(err) { console.error('❌ Error AI koreksi:', err); return null; }
}

// INIT
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiOutput = document.getElementById('aiOutput');

  // Ambil materi
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');

  if (!materi) {
    materiContent.innerHTML = '<p>Materi belum tersedia.</p>';
    return; // hentikan init jika materi tidak ada
  }

  // Tampilkan materi
  materiContent.innerHTML = materi.content;

  // Pastikan kolom jawaban & koreksi HANYA ada satu
  let answerSection = document.querySelector('.answer-section');
  let aiCorrection = document.getElementById('aiCorrection');

  if (!answerSection) {
    answerSection = document.createElement('div');
    answerSection.classList.add('answer-section');
    answerSection.innerHTML = `
      <h3>Jawaban Anda</h3>
      <textarea id="userAnswer" placeholder="Tulis jawaban Anda di sini..." rows="4"></textarea>
      <button id="btnCheck" class="btn">Cek Jawaban</button>
    `;
    materiContent.after(answerSection);
  }

  if (!aiCorrection) {
    aiCorrection = document.createElement('div');
    aiCorrection.id = 'aiCorrection';
    aiCorrection.classList.add('ai-output');
    aiCorrection.innerHTML = '<p>Koreksi akan ditampilkan di sini setelah dicek.</p>';
    answerSection.after(aiCorrection);
  }

  // Pasang listener generate pertanyaan (hanya sekali)
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

  // Pasang listener cek jawaban (hanya sekali)
  const btnCheck = document.getElementById('btnCheck');
  const userAnswer = document.getElementById('userAnswer');

  if (!btnCheck.dataset.listenerAdded) {
    btnCheck.addEventListener('click', async () => {
      const answerText = userAnswer.value.trim();
      if (!answerText) return alert('Tulis jawaban dulu!');

      aiCorrection.innerHTML = '<p>Memeriksa jawaban...</p>';

      // Kirim ke endpoint koreksi
      const result = await checkAnswer(answerText, materi.content);

      // Tampilkan hasil
      if (result && typeof result === 'object' && 'score' in result && 'feedback' in result) {
        aiCorrection.innerHTML = `<p>Skor: ${result.score}</p><p>Feedback: ${result.feedback}</p>`;
      } else {
        aiCorrection.innerHTML = '<p>AI gagal memeriksa jawaban.</p>';
        console.error('❌ Response AI tidak valid:', result);
      }
    });
    btnCheck.dataset.listenerAdded = 'true';
  }
}

init();