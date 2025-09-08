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
const API_URL = 'https://hmmz-bot01.vercel.app/api/quiz';

/* ==============================
   Ambil materi dari Supabase
============================== */
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

/* ==============================
   Panggil backend untuk generate soal
============================== */
async function generateQuestions(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materi: materialText,
        session_id: "jurumiya-bab1"
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.quiz || null;
  } catch (err) {
    console.error('❌ Error generate quiz:', err);
    return null;
  }
}

/* ==============================
   Supabase: Save Attempts & Stat
============================== */
async function saveAttempt({ user_id, session_id, question_id, category, user_answer, correct_answer, is_correct }) {
  try {
    const { error } = await supabase.from("kritika_attempts").insert([{
      user_id,
      session_id,
      question_id,
      category,
      user_answer,
      correct_answer,
      is_correct
    }]);
    if (error) console.error("❌ Error insert attempt:", error);
  } catch (err) {
    console.error("❌ Exception insert attempt:", err);
  }
}

async function saveStat({ user_id, category, avg_score }) {
  try {
    const { error } = await supabase.from("kritika_stat").insert([{
      user_id,
      category,
      avg_score
    }]);
    if (error) console.error("❌ Error insert stat:", error);
  } catch (err) {
    console.error("❌ Exception insert stat:", err);
  }
}

/* ==============================
   Helpers
============================== */
function shuffle(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a,b) => a.r - b.r)
    .map(x => x.v);
}

/* ==============================
   INIT Halaman
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

  // Event Generate Soal
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

    let parsed = quizData;
    let total = parsed.questions.length;
    let answered = 0;
    let correctCount = 0;

    // user_id sementara (bisa dari auth Supabase kalau sudah ada login)
    const user_id = "demo-user"; 

    parsed.questions.forEach(q => {
      // ambil jawaban benar dari backend
      const originalCorrect = q.options.find(o => o.key === q.correct_answer);

      // acak opsi
      let shuffled = shuffle(q.options);
      const keys = ['A','B','C','D'];
      shuffled = shuffled.map((opt, i) => ({ key: keys[i], text: opt.text }));

      // cari jawaban yang benar setelah acak
      const newCorrect = shuffled.find(o => o.text === originalCorrect.text);

      // render pertanyaan
      const div = document.createElement('div');
      div.classList.add('question-block');
      div.dataset.correct = newCorrect.key;
      div.innerHTML = `
        <p><strong>${q.id}.</strong> [${q.category}] ${q.question}</p>
        <ul class="options">
          ${shuffled.map(opt => `
            <li><button class="option-btn" data-key="${opt.key}">${opt.key}. ${opt.text}</button></li>
          `).join('')}
        </ul>
        <p class="feedback"></p>
      `;
      aiOutput.appendChild(div);

      // event pilih jawaban
      div.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const user = btn.dataset.key;
          const correct = div.dataset.correct;
          const fb = div.querySelector('.feedback');

          div.querySelectorAll('.option-btn').forEach(b => (b.disabled = true));

          const isCorrect = (user === correct);

          if (isCorrect) {
            correctCount += 1;
            fb.textContent = '✅ Benar';
            fb.style.color = 'green';
          } else {
            fb.textContent = `❌ Salah. Jawaban benar: ${correct}`;
            fb.style.color = 'red';
          }

          answered += 1;

          // simpan attempt
          await saveAttempt({
            user_id,
            session_id: "jurumiya-bab1",
            question_id: q.id,
            category: q.category,
            user_answer: user,
            correct_answer: correct,
            is_correct: isCorrect
          });

          // kalau semua soal sudah dijawab, simpan stat per kategori
          if (answered === total) {
            // hitung skor per kategori
            const categories = {};
            parsed.questions.forEach((qq, i) => {
              if (!categories[qq.category]) categories[qq.category] = { total: 0, correct: 0 };
              categories[qq.category].total += 1;
              const userAns = document.querySelector(`[data-correct][data-correct]`)?.dataset.correct;
              if (qq.correct_answer === userAns) {
                categories[qq.category].correct += 1;
              }
            });

            for (const [cat, stat] of Object.entries(categories)) {
              const avg_score = Math.round((stat.correct / stat.total) * 100);
              await saveStat({ user_id, category: cat, avg_score });
            }
          }

          // tampilkan ringkasan skor global
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

// start
init();