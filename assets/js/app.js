import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==============================
// Supabase Config
// ==============================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// API URL
// ==============================
const API_URL = 'https://hmmz-bot01.vercel.app/chat';
const CHECK_URL = 'https://hmmz-bot01.vercel.app/check';

// ==============================
// Ambil semua materi dari Supabase
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
// Generate pertanyaan pilihan ganda dari AI
// ==============================
async function generateQuestions(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        message: `Berdasarkan teks berikut (dan *hanya teks ini*), buatkan 3 soal pilihan ganda.
- Format output HARUS JSON valid dengan struktur:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": [
        {"key": "A", "text": "string"},
        {"key": "B", "text": "string"},
        {"key": "C", "text": "string"},
        {"key": "D", "text": "string"}
      ],
      "correct_answer": "A|B|C|D"
    }
  ]
}
- Jangan menuliskan kunci jawaban di luar JSON.
- "correct_answer" hanya untuk sistem, tidak ditampilkan ke siswa.

Teks:
${materialText}`,
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
      body: JSON.stringify({ 
        answer, 
        context: materi, 
        mode: "check",
        session_id: "jurumiya-bab1",
        instruction: `Evaluasi jawaban siswa *hanya berdasarkan teks berikut*:

"${materi}"

Tugas:
1. Nilai apakah jawaban relevan dengan isi teks.
2. Berikan skor 0-10 (0 jika sama sekali tidak relevan).
3. Tulis feedback singkat, jelas, to the point. 
Jangan tambahkan referensi luar.`
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json(); // { score, feedback }
  } catch(err) {
    console.error('❌ Error AI koreksi:', err);
    return null;
  }
}

// ==============================
// Shuffle Array Helper
// ==============================
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// ==============================
// INIT Halaman Materi
// ==============================
async function init() {
  // Ambil elemen dari HTML
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');

  // ======= Buat aiOutput =======
  let aiOutput = document.getElementById('aiOutput');
  if (!aiOutput) {
    aiOutput = document.createElement('div');
    aiOutput.id = 'aiOutput';
    aiOutput.classList.add('ai-output');
    btnGenerate.after(aiOutput);
  }

  // ======= Buat kolom koreksi AI =======
  let aiCorrection = document.getElementById('aiCorrection');
  if (!aiCorrection) {
    aiCorrection = document.createElement('div');
    aiCorrection.id = 'aiCorrection';
    aiCorrection.classList.add('ai-output');
    aiCorrection.innerHTML = '<p>Koreksi akan ditampilkan di sini.</p>';
    aiOutput.after(aiCorrection);
  }

  // ======= Ambil materi dari Supabase =======
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';

  // ======= Event Generate Pertanyaan =======
  btnGenerate.addEventListener('click', async () => {
    if (!materi) return;

    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';

    const raw = await generateQuestions(materi.content);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('❌ JSON parse error:', e, raw);
      aiOutput.innerHTML = '<p>AI gagal generate pertanyaan (JSON tidak valid).</p>';
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Pertanyaan';
      return;
    }

    parsed.questions.forEach(q => {
      const div = document.createElement('div');
      div.classList.add('question-block');
      div.dataset.correct = q.correct_answer; // simpan kunci rahasia

      // Acak opsi
      const shuffled = shuffleArray([...q.options]);

      div.innerHTML = `
        <p><strong>${q.id}.</strong> ${q.question}</p>
        <ul>
          ${shuffled.map(opt => `
            <li>
              <button class="option-btn" data-key="${opt.key}">${opt.key}. ${opt.text}</button>
            </li>
          `).join('')}
        </ul>
        <p class="feedback"></p>
      `;

      // Event handler jawaban
      div.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const userChoice = btn.dataset.key;
          const correct = div.dataset.correct;
          const feedbackEl = div.querySelector('.feedback');

          if (userChoice === correct) {
            feedbackEl.textContent = "✅ Benar!";
            feedbackEl.style.color = "green";
          } else {
            feedbackEl.textContent = `❌ Salah. Jawaban yang benar: ${correct}`;
            feedbackEl.style.color = "red";
          }

          // (Opsional) cek dengan AI untuk feedback lebih detail
          const result = await checkAnswer(userChoice, materi.content);
          if (result && 'score' in result && 'feedback' in result) {
            aiCorrection.innerHTML = `
              <p><strong>Skor:</strong> ${result.score}</p>
              <p><strong>Feedback AI:</strong> ${result.feedback}</p>
            `;
          }
        });
      });

      aiOutput.appendChild(div);
    });

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Pertanyaan';
  });
}

// Jalankan init
init();