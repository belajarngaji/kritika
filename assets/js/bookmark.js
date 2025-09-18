import { supabase } from './supabase-client.js'; // client Supabase utama

document.addEventListener('DOMContentLoaded', initBookmarks);

async function initBookmarks() {
  const bookmarkBtn   = document.getElementById('headerBookmarkBtn');
  const bookmarkModal = document.getElementById('bookmarkModal');
  const bookmarkList  = document.getElementById('bookmarkList');

  // Jika elemen penting tidak ditemukan, hentikan
  if (!bookmarkBtn || !bookmarkModal || !bookmarkList) {
    console.warn('Elemen bookmark tidak ditemukan.');
    return;
  }

  // Toggle modal ketika tombol ditekan
  bookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bookmarkModal.style.display =
      bookmarkModal.style.display === 'block' ? 'none' : 'block';
  });

  // Tutup modal jika klik di luar
  document.addEventListener('click', (e) => {
    if (!bookmarkModal.contains(e.target) && !bookmarkBtn.contains(e.target)) {
      bookmarkModal.style.display = 'none';
    }
  });

  // Pastikan user login
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  if (!user) {
    bookmarkBtn.style.display = 'none'; // sembunyikan jika tidak login
    return;
  }

  // Muat daftar bookmark
  await loadBookmarks(user.id, bookmarkList);
}

async function loadBookmarks(userId, listElement) {
  // 1. Ambil semua slug bookmark milik user
  const { data: bookmarkRows, error: e1 } = await supabase
    .from('kritika_bookmark')
    .select('material_slug')
    .eq('user_id', userId);

  if (e1) {
    console.error('Gagal memuat slug bookmark:', e1);
    return;
  }

  if (!bookmarkRows || bookmarkRows.length === 0) {
    listElement.innerHTML = '<li>Belum ada bookmark.</li>';
    return;
  }

  // 2. Ambil category dari tabel materials berdasarkan slug
  const slugs = bookmarkRows.map(b => b.material_slug);
  const { data: materials, error: e2 } = await supabase
    .from('materials')
    .select('slug, category')
    .in('slug', slugs);

  if (e2) {
    console.error('Gagal memuat kategori materi:', e2);
    return;
  }

  // 3. Tampilkan hanya category di modal
  listElement.innerHTML = '';
  materials.forEach(m => {
    const li = document.createElement('li');
    li.textContent = m.category;               // hanya kategori
    li.style.cursor = 'pointer';
    li.style.padding = '4px 0';
    li.style.borderBottom = '1px solid #eee';

    li.addEventListener('click', () => {
      window.location.href = `/kritika/learning/?slug=${m.slug}`;
    });

    listElement.appendChild(li);
  });
}