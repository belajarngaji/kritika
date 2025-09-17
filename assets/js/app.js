import { supabase } from './supabase-client.js';

// =================================================
// ELEMEN-ELEMEN DOM
// =================================================
const judulEl = document.getElementById('judul-bab');
const containerEl = document.getElementById('materiContainer');
const btnGenerateEl = document.getElementById('btnGenerate');
const btnKembaliEl = document.getElementById('btnKembali');
const btnLanjutEl = document.getElementById('btnLanjut');
const bookmarkBtnEl = document.getElementById('headerBookmarkBtn');
const aiOutputEl = document.getElementById('aiOutput');
const quizSummaryEl = document.getElementById('quizSummary');

// =================================================
// FUNGSI UTAMA
// =================================================

/**
 * Fungsi utama yang dipanggil saat halaman dimuat
 */
async function initPage() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) {
        judulEl.textContent = "Materi tidak ditemukan (slug tidak ada)";
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: materi, error } = await supabase
        .from('materials')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !materi) {
        judulEl.textContent = "Gagal Memuat Konten";
        console.error("Error mengambil materi:", error);
        return;
    }

    populateContent(materi);
    setupNavigation(materi);
    setupQuiz(materi, user);
    if (user) {
        setupBookmark(materi, user);
    } else {
        bookmarkBtnEl.style.display = 'none';
    }
}

/**
 * Mengisi konten utama halaman
 */
function populateContent(materi) {
    document.title = `${materi.title} | Kritika`;
    judulEl.textContent = materi.title;
    containerEl.innerHTML = materi.content;
}

/**
 * Mengatur tombol navigasi dinamis
 */
async function setupNavigation(materi) {
  const btnKembaliEl = document.getElementById('btnKembali');
  const btnLanjutEl = document.getElementById('btnLanjut');

  // --- LOGIKA TOMBOL KEMBALI ---
  // 1. Ambil nama kategori dari data materi (misal: "Sintaksis")
  const categorySlug = materi.category.toLowerCase().split(' ')[0];

  // 2. Atur link tombol kembali ke halaman daftar bab yang sesuai
  btnKembaliEl.onclick = () => {
      // Pastikan path ini sesuai dengan struktur folder Anda
      window.location.href = `/kritika/material/${categorySlug}/`;
  };
  // Pastikan tombolnya selalu aktif
  btnKembaliEl.disabled = false;
  btnKembaliEl.textContent = "← Kembali ke Daftar Bab";


  // --- LOGIKA TOMBOL LANJUT ---
  // (logika untuk tombol lanjut tetap sama)
  const { data: nextMateri } = await supabase
    .from('materials')
    .select('slug')
    .eq('category', materi.category)
    .eq('order', materi.order + 1)
    .single();

  if (nextMateri) {
    btnLanjutEl.style.display = 'inline-block';
    btnLanjutEl.onclick = () => window.location.href = `?slug=${nextMateri.slug}`;
  } else {
    btnLanjutEl.style.display = 'none'; // Sembunyikan jika bab terakhir
  }
}

/**
 * Mengatur logika tombol bookmark
 */
async function setupBookmark(materi, user) {
    bookmarkBtnEl.style.display = 'flex';
    const { data: existingBookmark } = await supabase.from('kritika_bookmark').select('id').eq('user_id', user.id).eq('material_slug', materi.slug).maybeSingle();
    let isBookmarked = !!existingBookmark;
    bookmarkBtnEl.classList.toggle("active", isBookmarked);

    bookmarkBtnEl.addEventListener('click', async () => {
        isBookmarked = !isBookmarked;
        bookmarkBtnEl.classList.toggle("active", isBookmarked);
        if (isBookmarked) {
            await supabase.from('kritika_bookmark').insert([{ user_id: user.id, material_slug: materi.slug, title: materi.title }]);
        } else {
            await supabase.from('kritika_bookmark').delete().eq('user_id', user.id).eq('material_slug', materi.slug);
        }
    });
}

/**
 * Menyiapkan tombol "Generate Soal" dan seluruh logika kuisnya
 */
function setupQuiz(materi, user) {
    const API_URL = 'https://hmmz-bot01.vercel.app/quiz';
    const user_id = user ? user.id : null;

    btnGenerateEl.addEventListener('click', async () => {
        btnGenerateEl.disabled = true;
        btnGenerateEl.textContent = 'Membuat soal...';
        aiOutputEl.innerHTML = '';
        quizSummaryEl.innerHTML = '';
        containerEl.classList.add('tertutup'); // PERBAIKAN: Materi ditutup

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materi: materi.content, session_id: materi.slug, category: materi.category })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const quizData = await res.json();
            if (!quizData || !quizData.quiz) throw new Error('Format respons AI tidak valid.');

            // --- Logika Kuis Lengkap Anda Dimulai ---
            const questions = quizData.quiz.questions.slice(0, 5);
            let total = questions.length;
            let correctCount = 0;
            let currentIndex = 0;

            const showQuestion = (q) => {
                aiOutputEl.innerHTML = '';
                const div = document.createElement('div');
                div.classList.add('question-block'); // PERBAIKAN: Menambah kelas untuk CSS
                div.innerHTML = `
                    <p><strong>${currentIndex + 1}.</strong> ${q.question}</p>
                    <ul class="options">
                        ${[...q.options].sort(() => Math.random() - 0.5).map(opt => `<li><button class="option-btn">${opt}</button></li>`).join('')}
                    </ul>
                    <p class="feedback"></p>`;
                aiOutputEl.appendChild(div);

                const optionBtns = div.querySelectorAll('.option-btn');
                optionBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        optionBtns.forEach(b => b.disabled = true);
                        const userAnswer = btn.textContent;
                        const isCorrect = (userAnswer === q.correct_answer);
                        if (isCorrect) correctCount++;
                        
                        saveAttempt({
                            user_id, session_id: materi.slug, question_id: q.id, category: materi.category, dimension: q.dimension,
                            user_answer: userAnswer, correct_answer: q.correct_answer, is_correct: isCorrect, score: isCorrect ? 1 : 0
                        });
                        
                        div.querySelector('.feedback').textContent = isCorrect ? "✅ Benar" : `❌ Salah. Jawaban: ${q.correct_answer}`;
                        
                        setTimeout(() => {
                            currentIndex++;
                            if (currentIndex < questions.length) {
                                showQuestion(questions[currentIndex]);
                            } else {
                                quizSummaryEl.innerHTML = `
                                    <h3>Hasil Kuis</h3>
                                    <p><strong>Benar:</strong> ${correctCount} dari ${total}</p>
                                    <p><strong>Skor:</strong> ${((correctCount / total) * 100).toFixed(0)}%</p>`;
                                containerEl.classList.remove('tertutup'); // PERBAIKAN: Materi ditampilkan lagi
                                btnGenerateEl.disabled = false;
                                btnGenerateEl.textContent = 'Coba Lagi';
                            }
                        }, 1500);
                    });
                });
            };
            showQuestion(questions[currentIndex]);

        } catch (err) {
            console.error(err);
            aiOutputEl.innerHTML = '<p style="color:red;">AI gagal membuat pertanyaan.</p>';
            containerEl.classList.remove('tertutup'); // PERBAIKAN: Tampilkan materi jika gagal
            btnGenerateEl.disabled = false;
            btnGenerateEl.textContent = 'Generate Soal';
        }
    });
}

// Helper function untuk menyimpan hasil
async function saveAttempt(attemptData) {
    if (!attemptData.user_id) return;
    await supabase.from("kritika_attempts").insert([attemptData]);
}

// =================================================
// INISIALISASI
// =================================================
document.addEventListener('DOMContentLoaded', initPage);