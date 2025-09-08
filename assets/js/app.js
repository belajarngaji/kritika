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

async function generateQuestions(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materi: materialText, session_id: "jurumiya-bab1" })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.quiz || null;
  } catch(err) { console.error(err); return null; }
}

async function saveAttempt({ user_id, session_id, question_id, category, user_answer, correct_answer, is_correct, score }) {
  if (!user_id) return { success: false }; // guest/demo tidak simpan
  try {
    const { error } = await supabase.from("kritika_attempts").insert([{
      user_id,
      session_id,
      question_id,
      category,
      user_answer,
      correct_answer,
      is_correct,
      score,
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
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');

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

  // Ambil materi
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';
  if (!materi) return;

  // Ambil user_id dari auth
  const { data: { user } } = await supabase.auth.getUser();
  const user_id = user ? user.id : null;

  btnGenerate.addEventListener('click', async () => {
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';
    summary.innerHTML = '';

    const quizData = await generateQuestions(materi.content);
    if (!quizData) {
      aiOutput.innerHTML = '<p>AI gagal generate pertanyaan.</p>';
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Soal';
      return;
    }

    let total = quizData.questions.length;
    let answered = 0;
    let correctCount = 0;

    quizData.questions.forEach(q => {
      const correctText = q.answer; // jawaban text
      const shuffledOpts = shuffle(q.options.map(o => o.text));

      const div = document.createElement('div');
      div.classList.add('question-block');
      div.dataset.correct = correctText;
      div.innerHTML = `
        <p><strong>${q.id.replace('q','')}.</strong> ${q.question}</p>
        <ul class="options">
          ${shuffledOpts.map(opt => `<li><button class="option-btn" data-text="${opt}">${opt}</button></li>`).join('')}
        </ul>
        <p class="feedback"></p>
      `;
      aiOutput.appendChild(div);

      div.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userAnswer = btn.dataset.text;
          const fb = div.querySelector('.feedback');

          div.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

          const isCorrect = (userAnswer === correctText);
          if (isCorrect) {
            correctCount += 1;
            fb.textContent = '✅ Benar';
            fb.style.color = 'green';
          } else {
            fb.textContent = `❌ Salah. Jawaban benar: ${correctText}`;
            fb.style.color = 'red';
          }

          answered += 1;

          // Simpan attempt
          const result = await saveAttempt({
            user_id,
            session_id: "jurumiya-bab1",
            question_id: q.id,
            category: q.category,
            user_answer: userAnswer,
            correct_answer: correctText,
            is_correct: isCorrect,
            score: isCorrect ? 1 : 0
          });

          fb.innerHTML += result.success ? " <span style='color:green'>(tersimpan)</span>"
                                         : " <span style='color:red'>(gagal simpan)</span>";

          // Update ringkasan
          const scorePercent = ((correctCount / total) * 100).toFixed(0);
          summary.innerHTML = `
<strong>Total Soal:</strong> ${total}<br>
<strong>Terjawab:</strong> ${answered}<br>
<strong>Benar:</strong> ${correctCount}<br>
<strong>Salah:</strong> ${answered - correctCount}<br>
<strong>Nilai:</strong> ${correctCount}<br>
<strong>Rate:</strong> ${scorePercent}%
`;
        });
      });
    });

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Soal';
  });
}

init();