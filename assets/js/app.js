import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

/* ==============================
   Supabase Config
============================== */
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ==============================
   API URL (Backend FastAPI)
============================== */
const API_URL = 'https://hmmz-bot01.vercel.app/quiz';

/* ==============================
   Helpers
============================== */
function shuffle(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a,b) => a.r - b.r)
    .map(x => x.v);
}

async function getMaterials() {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('id');
    if (error) { console.error(error); return []; }
    return data;
  } catch(e) { console.error(e); return []; }
}

// REVISI: Fungsi ini sekarang menerima slug dan category
async function generateQuestions(materialText, slug, category) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // REVISI: Mengirim slug dan category secara dinamis
      body: JSON.stringify({ 
        materi: materialText, 
        session_id: slug,
        category: category
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.quiz || null;
  } catch(err) { console.error(err); return null; }
}

async function saveAttempt({ user_id, session_id, question_id, category, dimension, user_answer, correct_answer, is_correct, score, duration_seconds }) {
  if (!user_id) return { success: false };
  try {
    const { error } = await supabase.from("kritika_attempts").insert([{
      user_id,
      session_id,
      question_id,
      category,
      dimension,
      user_answer,
      correct_answer,
      is_correct,
      score,
      duration_seconds,   // << tambahan
      submitted_at: new Date().toISOString()
    }]);
    if (error) { console.error(error); return { success: false }; }
    return { success: true };
  } catch(e) { console.error(e); return { success: false }; }
}
/* ==============================
   INIT Halaman Quiz
============================== */
async function init() {
  // REVISI: Menggunakan ID 'materiContainer' untuk elemen <article>
  const materiContainer = document.getElementById('materiContainer'); 
  const btnGenerate = document.getElementById('btnGenerate');
  
  // REVISI: Ambil slug dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
      materiContainer.innerHTML = "<h1>Error: Slug materi tidak ditemukan di URL. Coba akses dari halaman daftar materi.</h1>";
      btnGenerate.style.display = 'none';
      return;
  }

  let aiOutput = document.getElementById('aiOutput');
  if (!aiOutput) {
    aiOutput = document.createElement('div');
    aiOutput.id = 'aiOutput';
    aiOutput.classList.add('ai-output');
    btnGenerate.after(aiOutput);
  }

  let summary = document.getElementById('quizSummary');
  if (!summary) {
    summary = document.createElement('div');
    summary.id = 'quizSummary';
    summary.classList.add('ai-output');
    aiOutput.after(summary);
  }

  // REVISI: Ambil materi berdasarkan slug dari URL
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === slug);

  if (!materi) {
      materiContainer.innerHTML = `<p>Materi dengan slug "${slug}" tidak ditemukan.</p>`;
      btnGenerate.style.display = 'none';
      return;
  }
  materiContainer.innerHTML = materi.content; // Memuat konten ke dalam kontainer

  // Ambil user_id dari auth
  const { data: { user } } = await supabase.auth.getUser();
  const user_id = user ? user.id : null;

  btnGenerate.addEventListener('click', async () => {
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';
    summary.innerHTML = '';

    // REVISI: Menambahkan class 'tertutup' untuk menyembunyikan materi
    materiContainer.classList.add('tertutup');

    // REVISI: Mengirim slug dan category materi ke fungsi generateQuestions
    const quizData = await generateQuestions(materi.content, materi.slug, materi.category);
    
    if (!quizData) {
      aiOutput.innerHTML = '<p>AI gagal generate pertanyaan.</p>';
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Soal';
      // Jika gagal, tampilkan lagi materinya
      materiContainer.classList.remove('tertutup'); 
      return;
    }

    let total = quizData.questions.length;
    let answered = 0;
    let correctCount = 0;

    quizData.questions.forEach(q => {
  const correctText = q.correct_answer;
  const shuffledOpts = shuffle(q.options);

  const div = document.createElement('div');
  div.classList.add('question-block');
  div.dataset.correct = correctText;

  const questionNumber = q.id.replace(/\D/g, '') || '1';

  div.innerHTML = `
    <p><strong>${questionNumber}.</strong> ${q.question}</p>
    <ul class="options">
      ${shuffledOpts.map(opt => `<li><button class="option-btn" data-text="${opt}">${opt}</button></li>`).join('')}
    </ul>
    <p class="feedback"></p>
  `;
  aiOutput.appendChild(div);

  let startTime = Date.now();
  let answeredFlag = false;

  // fungsi untuk submit (manual atau timeout)
  async function handleSubmit(userAnswer, isTimeout = false) {
    if (answeredFlag) return; 
    answeredFlag = true;

    const usedTime = Math.min(30, Math.floor((Date.now() - startTime) / 1000));
    const isCorrect = !isTimeout && (userAnswer === correctText);
    const fb = div.querySelector('.feedback');

    div.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

    if (isTimeout) {
      fb.textContent = "❌ Time out";
      fb.style.color = "red";
    } else {
      fb.textContent = isCorrect ? '✅ Benar' : `❌ Salah. Jawaban benar: ${correctText}`;
      fb.style.color = isCorrect ? 'green' : 'red';
    }

    answered += 1;
    if (isCorrect) correctCount += 1;

    if (user_id) {
      const result = await saveAttempt({
        user_id,
        session_id: materi.slug,
        question_id: q.id,
        category: q.category,
        dimension: q.dimension,
        user_answer: isTimeout ? null : userAnswer,
        correct_answer: correctText,
        is_correct: isCorrect,
        score: isCorrect ? 1 : 0,
        duration_seconds: usedTime
      });
      fb.innerHTML += result.success ? " <span style='color:green'>(tersimpan)</span>"
                                     : " <span style='color:red'>(gagal simpan)</span>";
    }

    const scorePercent = ((correctCount / total) * 100).toFixed(0);
    summary.innerHTML = `
      <strong>Total Soal:</strong> ${total}<br>
      <strong>Terjawab:</strong> ${answered}<br>
      <strong>Benar:</strong> ${correctCount}<br>
      <strong>Salah:</strong> ${answered - correctCount}<br>
      <strong>Nilai:</strong> ${correctCount}<br>
      <strong>Rate:</strong> ${scorePercent}%
    `;
  }

  // listener klik
  div.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSubmit(btn.dataset.text, false);
    });
  });

  // auto timeout 30 detik
  setTimeout(() => {
    handleSubmit(null, true);
  }, 30000);
});

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Soal';
  });
}

init();
