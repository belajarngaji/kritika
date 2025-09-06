// ==============================
// FastAPI Backend Endpoints
// Pastikan URL ini sesuai dengan alamat server FastAPI Anda
// ==============================
const BASE_API_URL = 'http://127.0.0.1:8000'; // Ganti jika perlu
const API_URL = `${BASE_API_URL}/chat`;
const CHECK_URL = `${BASE_API_URL}/check`;

// Fungsi untuk membuat elemen jawaban dan koreksi secara dinamis
function createAnswerSection() {
    const mainContent = document.querySelector('.content');
    const aiOutput = document.getElementById('aiOutput');

    // Hindari membuat elemen duplikat jika sudah ada
    if (document.getElementById('userAnswer')) return;

    // Buat textarea untuk jawaban user
    const answerTextarea = document.createElement('textarea');
    answerTextarea.id = 'userAnswer';
    answerTextarea.className = 'textarea-input';
    answerTextarea.placeholder = 'Ketik jawaban Anda di sini...';

    // Buat tombol untuk mengecek jawaban
    const checkButton = document.createElement('button');
    checkButton.id = 'btnCheck';
    checkButton.className = 'btn';
    checkButton.innerText = 'Cek Jawaban';

    // Buat div untuk menampilkan koreksi dari AI
    const correctionDiv = document.createElement('div');
    correctionDiv.id = 'aiCorrection';
    correctionDiv.className = 'ai-output correction';
    correctionDiv.setAttribute('aria-live', 'polite');

    // Buat wrapper untuk tombol
    const actionDiv = document.createElement('div');
    actionDiv.className = 'ai-actions';
    actionDiv.appendChild(checkButton);

    // Masukkan elemen-elemen baru ke dalam halaman setelah output AI
    aiOutput.insertAdjacentElement('afterend', correctionDiv);
    aiOutput.insertAdjacentElement('afterend', actionDiv);
    aiOutput.insertAdjacentElement('afterend', answerTextarea);

    // Tambahkan event listener ke tombol yang baru dibuat
    document.getElementById('btnCheck').onclick = async () => {
        const answer = document.getElementById('userAnswer').value;
        const materi = document.getElementById('materiContent').innerText;
        const feedback = await checkAnswer(answer, materi);
        document.getElementById('aiCorrection').innerText = feedback;
    };
}


async function generateCriticalQuestion(text) {
  // Tampilkan loading
  document.getElementById('aiOutput').innerText = 'Membuat pertanyaan...';
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: text, session_id: "jurumiya-bab1" })
    });
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data.reply;
  } catch (error) {
    console.error("Error generating question:", error);
    return "Maaf, terjadi kesalahan saat menghubungi AI. Coba lagi nanti.";
  }
}

async function checkAnswer(answer, materi) {
  // Tampilkan loading
  document.getElementById('aiCorrection').innerText = 'Mengecek jawaban...';
  try {
    const res = await fetch(CHECK_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ answer, context: materi, session_id: "jurumiya-bab1" })
    });
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data.feedback;
  } catch(error) {
    console.error("Error checking answer:", error);
    return "Maaf, terjadi kesalahan saat memeriksa jawaban.";
  }
}

// Event listener tombol Generate
document.getElementById('btnGenerate').onclick = async () => {
  const materiText = document.getElementById('materiContent').innerText;
  if (!materiText.trim()) {
      alert("Materi kosong!");
      return;
  }
  const reply = await generateCriticalQuestion(materiText);
  document.getElementById('aiOutput').innerText = reply;

  // Setelah pertanyaan muncul, buat kolom jawaban dan tombol cek
  createAnswerSection();
};

// Catatan: Supabase config tidak digunakan di sini, jadi saya hapus agar lebih bersih
// Begitu juga dengan pemanggilan init() dan kurung kurawal tambahan.
// Jalankan init
init();