import { supabase } from './supabase-client.js'; // Menggunakan client terpusat

// Fungsi ini akan berjalan setelah seluruh halaman dimuat
async function initBookmarks() {
    const bookmarkBtn = document.getElementById('headerBookmarkBtn');
    const bookmarkModal = document.getElementById('bookmarkModal');
    const bookmarkList = document.getElementById('bookmarkList');

    // Jika elemen-elemen penting tidak ditemukan, hentikan fungsi
    if (!bookmarkBtn || !bookmarkModal || !bookmarkList) {
        console.warn("Elemen bookmark tidak ditemukan, fungsionalitas bookmark tidak aktif.");
        return;
    }

    // Logika untuk menampilkan/menyembunyikan modal
    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah klik menyebar ke elemen lain
        bookmarkModal.style.display = bookmarkModal.style.display === 'none' ? 'block' : 'none';
    });

    // Sembunyikan modal jika klik di luar
    document.addEventListener('click', (e) => {
        if (!bookmarkModal.contains(e.target) && !bookmarkBtn.contains(e.target)) {
            bookmarkModal.style.display = 'none';
        }
    });

    // Ambil data pengguna yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        bookmarkBtn.style.display = 'none'; // Sembunyikan tombol jika tidak ada user
        return;
    }

    // Muat daftar bookmark dari database
    await loadBookmarks(user.id, bookmarkList);
}

/**
 * Mengambil dan menampilkan daftar bookmark untuk pengguna
 * @param {string} userId - ID pengguna yang sedang login
 * @param {HTMLElement} listElement - Elemen <ul> untuk menampilkan daftar
 */
async function loadBookmarks(userId, listElement) {
    const { data: bookmarks, error } = await supabase
        .from('kritika_bookmark')
        .select('material_slug, title')
        .eq('user_id', userId);

    if (error) {
        console.error("Gagal memuat bookmark:", error);
        return;
    }

    listElement.innerHTML = ''; // Kosongkan daftar

    if (bookmarks.length === 0) {
        listElement.innerHTML = '<li>Belum ada bookmark.</li>';
        return;
    }

    bookmarks.forEach(bookmark => {
        const li = document.createElement('li');
        li.textContent = bookmark.title || bookmark.material_slug;
        li.style.cursor = 'pointer';
        li.style.padding = '4px 0';
        li.style.borderBottom = '1px solid #eee';

        // PERBAIKAN UTAMA: URL sekarang selalu mengarah ke halaman template dinamis
        li.addEventListener('click', () => {
            window.location.href = `/kritika/learning/?slug=${bookmark.material_slug}`;
        });

        listElement.appendChild(li);
    });
}

// Jalankan fungsi inisialisasi
document.addEventListener('DOMContentLoaded', initBookmarks);