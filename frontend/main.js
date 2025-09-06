// ==============================
// Backend API URLs
// ==============================
const API_URL = '/chat';   // FastAPI endpoint generate pertanyaan
const CHECK_URL = '/check'; // FastAPI endpoint cek jawaban

// ==============================
// Ambil materi (dummy online)
async function getMaterials() {
  return [{ slug: 'jurumiya-bab1', content: 'Ini adalah materi contoh untuk bab 1.' }];
}

// ==============================
// Generate pertanyaan AI
async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ message: materialText, session_id: "jurumiya-bab1" })
    });
    const data = await res.json();
    return data.reply || null;
  } catch (err) {
    console.error('Error generate:', err);
    return null;
  }
}

// ==============================
// Koreksi jawaban user
async function checkAnswer(answer, materi) {
  try {
    const res = await fetch(CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ answer, context: materi, session_id: "jurumiya-bab1" })
    });
    const data = await res.json();
    return data; // { score, feedback }
  } catch (err) {
    console.error('Error check:', err);
    return null;
  }
}

// ==============================
// Inisialisasi Halaman
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiOutput = document.getElementById('aiOutput');
  const btnCheck = document.getElementById('btnCheck');
  const userAnswer = document.getElementById('userAnswer');
  const aiCorrection = document.getElementById('aiCorrection');

  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';

  // Generate pertanyaan
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

  // Cek jawaban user
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