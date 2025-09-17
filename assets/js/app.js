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
    
    console.log("--- MEMULAI INVESTIGASI NAVIGASI ---");

    // 1. Cek data materi yang diterima oleh fungsi ini
    console.log("Data 'materi' yang diterima:", materi);

    // 2. Cek variabel kunci dari objek 'materi'
    const kategori = materi.category;
    const urutanSekarang = materi.order;
    console.log(`Kategori terdeteksi: '${kategori}' (Tipe data: ${typeof kategori})`);
    console.log(`Urutan saat ini: ${urutanSekarang} (Tipe data: ${typeof urutanSekarang})`);

    // 3. Pastikan variabelnya ada dan benar
    if (!kategori || urutanSekarang === undefined || urutanSekarang === null) {
        console.error("INVESTIGASI GAGAL: Properti 'category' atau 'order' tidak ditemukan atau null di objek materi.");
        console.log("--- INVESTIGASI SELESAI ---");
        return;
    }
    
    const urutanBerikutnya = urutanSekarang + 1;
    console.log(`Mencari bab selanjutnya dengan 'order': ${urutanBerikutnya}`);

    // 4. Lakukan query untuk bab selanjutnya
    const { data: nextMateri, error } = await supabase
        .from('materials')
        .select('slug, order')
        .eq('category', kategori)
        .eq('order', urutanBerikutnya)
        .single();

    // 5. Tampilkan hasil query
    if (error) {
        console.error("Error saat query bab selanjutnya:", error);
    } else {
        console.log("Hasil pencarian bab selanjutnya:", nextMateri);
    }
    
    console.log("--- INVESTIGASI SELESAI ---");
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
        containerEl.classList.add('tertutup');

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materi: materi.content, session_id: materi.slug, category: materi.category })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const quizData = await res.json();
            if (!quizData || !quizData.quiz) throw new Error('Format respons AI tidak valid.');

            // --- Logika Kuis Lengkap ---
            startQuiz(quizData.quiz.questions, materi, user_id);

        } catch (err) {
            console.error(err);
            aiOutputEl.innerHTML = '<p style="color:red;">AI gagal membuat pertanyaan.</p>';
            containerEl.classList.remove('tertutup');
            btnGenerateEl.disabled = false;
            btnGenerateEl.textContent = 'Generate Soal';
        }
    });
}

/**
 * Menjalankan alur kuis
 */
function startQuiz(questions, materi, user_id) {
    const questionsToShow = questions.slice(0, 5);
    let correctCount = 0;
    let currentIndex = 0;

    const showQuestion = (q) => {
        aiOutputEl.innerHTML = '';
        const div = document.createElement('div');
        div.classList.add('question-block');
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
                    if (currentIndex < questionsToShow.length) {
                        showQuestion(questionsToShow[currentIndex]);
                    } else {
                        quizSummaryEl.innerHTML = `
                            <h3>Hasil Kuis</h3>
                            <p><strong>Benar:</strong> ${correctCount} dari ${questionsToShow.length}</p>
                            <p><strong>Skor:</strong> ${((correctCount / questionsToShow.length) * 100).toFixed(0)}%</p>`;
                        containerEl.classList.remove('tertutup');
                        btnGenerateEl.disabled = false;
                        btnGenerateEl.textContent = 'Coba Lagi';
                    }
                }, 1500);
            });
        });
    };
    showQuestion(questionsToShow[currentIndex]);
}

/**
 * Helper function untuk menyimpan hasil percobaan kuis
 */
async function saveAttempt(attemptData) {
    if (!attemptData.user_id) return;
    try {
        await supabase.from("kritika_attempts").insert([attemptData]);
    } catch (e) {
        console.error("Gagal menyimpan hasil kuis:", e);
    }
}

// =================================================
// INISIALISASI
// =================================================
document.addEventListener('DOMContentLoaded', initPage);