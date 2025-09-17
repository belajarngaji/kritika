import { supabase } from './supabase-client.js';

// =================================================
// ELEMEN-ELEMEN DOM
// =================================================
const judulEl = document.getElementById('judul-bab');
const containerEl = document.getElementById('materiContainer');
const btnGenerateEl = document.getElementById('btnGenerate');
const btnKembaliEl = document.getElementById('btnKembali');
const btnLanjutEl = document.getElementById('btnLanjut');
const bookmarkBtnEl = document.getElementById('headerBookmarkBtn'); // Tombol bookmark di header
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

    // Ambil data user dan materi secara bersamaan
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

    // Setelah data didapat, jalankan semua fungsi untuk mengisi halaman
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
 * Mengisi konten utama halaman (judul, isi materi)
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
    // Tombol kembali selalu ke daftar bab
    const categorySlug = materi.category.toLowerCase().split(' ')[0];
    btnKembaliEl.onclick = () => {
        window.location.href = `/kritika/${categorySlug}/`;
    };

    // Tombol lanjut mencari bab berikutnya
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

    const { data: existingBookmark } = await supabase
        .from('kritika_bookmark')
        .select('id')
        .eq('user_id', user.id)
        .eq('material_slug', materi.slug)
        .maybeSingle();

    let isBookmarked = !!existingBookmark;
    bookmarkBtnEl.classList.toggle("active", isBookmarked);

    bookmarkBtnEl.addEventListener('click', async () => {
        isBookmarked = !isBookmarked; // Optimistic update
        bookmarkBtnEl.classList.toggle("active", isBookmarked);

        if (isBookmarked) {
            await supabase
                .from('kritika_bookmark')
                .insert([{ user_id: user.id, material_slug: materi.slug, title: materi.title }]);
        } else {
            await supabase
                .from('kritika_bookmark')
                .delete()
                .eq('user_id', user.id)
                .eq('material_slug', materi.slug);
        }
    });
}

/**
 * Menyiapkan tombol "Generate Soal" dan seluruh logika kuisnya
 */
function setupQuiz(materi, user) {
    btnGenerateEl.addEventListener('click', async () => {
        // Logika generate soal dan alur kuis Anda ditempatkan di sini
        // (Ini adalah bagian "Quiz Button" dari kode lama Anda)
        console.log("Memulai proses generate soal untuk materi:", materi.title);
        // ... (Anda bisa tempel logika lengkap kuis Anda di sini)
    });
}


// =================================================
// INISIALISASI
// =================================================
document.addEventListener('DOMContentLoaded', initPage);