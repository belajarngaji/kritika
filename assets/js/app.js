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
    setupQuiz(materi, user); // Memindahkan semua logika kuis ke sini
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
    const categorySlug = materi.category.toLowerCase().split(' ')[0];
    btnKembaliEl.onclick = () => { window.location.href = `/kritika/${categorySlug}/`; };

    const { data: nextMateri } = await supabase
        .from('materials')
        .select('slug')
        .eq('category', materi.category)
        .eq('order', materi.order + 1)
        .single();

    if (nextMateri) {
        btnLanjutEl.onclick = () => window.location.href = `?slug=${nextMateri.slug}`;
    } else {
        btnLanjutEl.disabled = true;
        btnLanjutEl.textContent = "Ini Bab Terakhir";
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

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materi: materi.content, session_id: materi.slug, category: materi.category })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const quizData = await res.json();
            if (!quizData || !quizData.quiz) throw new Error('Format respons AI tidak valid.');

            // --- LOGIKA KUIS LENGKAP DIMULAI DI SINI ---
            const questions = quizData.quiz.questions.slice(0, 5);
            let total = questions.length;
            let correctCount = 0;
            let currentIndex = 0;

            const showQuestion = (q) => {
                aiOutputEl.innerHTML = '';
                const div = document.createElement('div');
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
                                btnGenerateEl.disabled = false;
                                btnGenerateEl.textContent = 'Coba Lagi';
                            }
                        }, 1500);
                    });
                });
            };
            showQuestion(questions[currentIndex]);
            // --- AKHIR DARI LOGIKA KUIS ---

        } catch (err) {
            console.error(err);
            aiOutputEl.innerHTML = '<p style="color:red;">AI gagal membuat pertanyaan.</p>';
            btnGenerateEl.disabled = false;
            btnGenerateEl.textContent = 'Generate Soal';
        }
    });
}

// =================================================
// INISIALISASI
// =================================================
document.addEventListener('DOMContentLoaded', initPage);