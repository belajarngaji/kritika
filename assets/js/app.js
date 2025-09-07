import { _supabase } from './supabase-client.js';

// ==============================
// API URL
// ==============================
const API_URL = 'https://hmmz-bot01.vercel.app/chat'; 

// ==============================
// Ambil semua materi dari Supabase
// ==============================
async function getMaterials() {
  try {
    // Ganti 'supabase' dengan '_supabase' dari import
    const { data, error } = await _supabase.from('materials').select('*').order('id');
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
// Generate pertanyaan pilihan ganda
// ==============================
async function generateMultipleChoiceQuestion(materialText) {
  try {
    const prompt = `Berdasarkan teks berikut (dan *hanya teks ini*), buatkan 1 soal pilihan ganda dengan 4 opsi.
- Opsi jawaban harus singkat dan berbeda.
- Hanya 1 jawaban yang benar.
- Tampilkan dalam format JSON berikut:
{
  "question": "Soal di sini",
  "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
  "correct_answer": "Opsi yang benar"
}

Teks:
${materialText}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        mode: "qa",
        session_id: "jurumiya-bab1"
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.reply); // Mengubah string JSON menjadi objek JavaScript
  } catch (err) {
    console.error('❌ Error AI generate:', err);
    return null;
  }
}

// ==============================
// INIT Halaman Materi
// ==============================
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiQuestionContainer = document.getElementById('aiQuestionContainer');
  const questionText = document.getElementById('questionText');
  const optionsList = document.getElementById('optionsList');
  const feedbackMessage = document.getElementById('feedbackMessage');

  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  
  // Memastikan materi ditemukan sebelum mencoba memprosesnya
  if (materi) {
      // Gunakan marked.js untuk memproses konten markdown
      materiContent.innerHTML = marked.parse(materi.content);
  } else {
      materiContent.innerHTML = '<p>Materi belum tersedia.</p>';
  }

  // ======= Event Generate Pertanyaan =======
  btnGenerate.addEventListener('click', async () => {
    if (!materi) {
        alert('Materi belum dimuat. Silakan muat ulang halaman.');
        return;
    }

    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Membuat Soal...';
    aiQuestionContainer.style.display = 'none';
    optionsList.innerHTML = ''; // Kosongkan opsi sebelumnya
    feedbackMessage.textContent = ''; // Kosongkan feedback

    const questionData = await generateMultipleChoiceQuestion(materi.content);

    if (questionData && questionData.question && questionData.options && questionData.correct_answer) {
      aiQuestionContainer.style.display = 'block';
      questionText.textContent = questionData.question;

      // Mengacak urutan opsi jawaban
      const shuffledOptions = questionData.options.sort(() => Math.random() - 0.5);

      shuffledOptions.forEach(option => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = option;

        button.addEventListener('click', () => {
          optionsList.querySelectorAll('button').forEach(btn => btn.disabled = true);

          if (option === questionData.correct_answer) {
            button.classList.add('correct');
            feedbackMessage.innerHTML = '✅ **Jawaban Anda benar!**';
            feedbackMessage.style.color = 'green';
          } else {
            button.classList.add('wrong');
            // Tandai jawaban yang benar
            optionsList.querySelector(`button[data-correct="true"]`).classList.add('correct');
            feedbackMessage.innerHTML = `❌ **Jawaban Anda salah.** Jawaban yang benar adalah: "${questionData.correct_answer}"`;
            feedbackMessage.style.color = 'red';
          }
        });

        if (option === questionData.correct_answer) {
            button.setAttribute('data-correct', 'true');
        }

        li.appendChild(button);
        optionsList.appendChild(li);
      });

    } else {
      aiQuestionContainer.style.display = 'block';
      questionText.textContent = 'AI gagal membuat soal. Silakan coba lagi.';
    }

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Pertanyaan';
  });
}

// Jalankan init
init();
