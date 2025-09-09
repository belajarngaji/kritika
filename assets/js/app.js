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

async function generateQuestions(materialText, slug, category) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materi: materialText, session_id: slug, category })
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
      duration_seconds,
      submitted_at: new Date().toISOString()
    }]);
    if (error) { console.error(error); return { success: false }; }
    return { success: true };
  } catch(e) { console.error(e); return { success: false }; }
}

/* ==============================
   INIT Quiz Sequential (5 soal)
============================== */
async function init() {
  const materiContainer = document.getElementById('materiContainer'); 
  const btnGenerate = document.getElementById('btnGenerate');

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    materiContainer.innerHTML = "<h1>Error: Slug materi tidak ditemukan.</h1>";
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

  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === slug);

  if (!materi) {
    materiContainer.innerHTML = `<p>Materi dengan slug "${slug}" tidak ditemukan.</p>`;
    btnGenerate.style.display = 'none';
    return;
  }
  materiContainer.innerHTML = materi.content;

  const { data: { user } } = await supabase.auth.getUser();
  const user_id = user ? user.id : null;

  btnGenerate.addEventListener('click', async () => {
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';
    summary.innerHTML = '';

    materiContainer.classList.add('tertutup');

    const quizData = await generateQuestions(materi.content, materi.slug, materi.category);

    if (!quizData) {
      aiOutput.innerHTML = '<p>AI gagal generate pertanyaan.</p>';
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Soal';
      materiContainer.classList.remove('tertutup'); 
      return;
    }

    // hanya ambil 5 soal pertama
    const questions = quizData.questions.slice(0, 5);
    let total = questions.length;
    let answered = 0;
    let correctCount = 0;
    let currentIndex = 0;

    const showQuestion = (q) => {
      aiOutput.innerHTML = '';

      const div = document.createElement('div');
      div.classList.add('question-block');
      div.dataset.correct = q.correct_answer;

      div.innerHTML = `
        <p><strong>${currentIndex + 1}.</strong> ${q.question}</p>
        <ul class="options">
          ${shuffle(q.options).map(opt => `<li><button class="option-btn" data-text="${opt}">${opt}</button></li>`).join('')}
        </ul>
        <p class="feedback"></p>
      `;
      aiOutput.appendChild(div);

      let timer;
      let timeLeft = 30;
      let startTime = Date.now();

      const fb = div.querySelector('.feedback');
      const optionBtns = div.querySelectorAll('.option-btn');

      const finishQuestion = async (userAnswer, isCorrect, timeout=false) => {
        clearInterval(timer);
        optionBtns.forEach(b => b.disabled = true);
        answered++;
        if (isCorrect) correctCount++;

        let duration_seconds = Math.floor((Date.now() - startTime) / 1000);

        if (user_id) {
          await saveAttempt({
            user_id,
            session_id: materi.slug,
            question_id: q.id,
            category: q.category,
            dimension: q.dimension,
            user_answer: userAnswer,
            correct_answer: q.correct_answer,
            is_correct: isCorrect,
            score: isCorrect ? 1 : 0,
            duration_seconds
          });
        }

        fb.textContent = timeout 
          ? "❌ Time out" 
          : (isCorrect ? "✅ Benar" : `❌ Salah. Jawaban benar: ${q.correct_answer}`);

        setTimeout(() => {
          currentIndex++;
          if (currentIndex < total) {
            showQuestion(questions[currentIndex]);
          } else {
            // tampilkan summary final
            summary.innerHTML = `
              <h3>Hasil Quiz</h3>
              <strong>Total Soal:</strong> ${total}<br>
              <strong>Terjawab:</strong> ${answered}<br>
              <strong>Benar:</strong> ${correctCount}<br>
              <strong>Salah:</strong> ${answered - correctCount}<br>
              <strong>Nilai:</strong> ${correctCount}<br>
              <strong>Rate:</strong> ${((correctCount / total) * 100).toFixed(0)}%
            `;
            btnGenerate.disabled = false;
            btnGenerate.textContent = 'Generate Soal';
          }
        }, 1500);
      };

      optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const userAnswer = btn.dataset.text;
          const isCorrect = (userAnswer === q.correct_answer);
          finishQuestion(userAnswer, isCorrect, false);
        });
      });

      timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          finishQuestion(null, false, true);
        }
      }, 1000);
    };

    showQuestion(questions[currentIndex]);
  });
}

init();