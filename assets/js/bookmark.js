// --- assets/js/bookmark.js ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ==============================
// Supabase Client
// ==============================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// DOMContentLoaded
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
  const bookmarkBtn = document.getElementById('bookmarkHeaderBtn');
  const bookmarkModal = document.getElementById('bookmarkModal');
  const bookmarkList = document.getElementById('bookmarkList');

  if (!bookmarkBtn || !bookmarkModal || !bookmarkList) return;

  // Toggle modal
  bookmarkBtn.addEventListener('click', () => {
    bookmarkModal.style.display = bookmarkModal.style.display === 'none' ? 'block' : 'none';
  });

  // Ambil user dari Supabase
  const { data: { user }, error: userError } = await _supabase.auth.getUser();
  if (userError || !user) {
    console.error('User not found or not logged in');
    return;
  }

  // Fungsi untuk memuat bookmark dari DB
  async function loadBookmarks() {
    const { data: bookmarks, error } = await _supabase
      .from('kritika_bookmark')
      .select(`material_slug, materials(title)`)
      .eq('user_id', user.id);

    if (error) {
      console.error(error);
      return;
    }

    // Hapus semua elemen sebelumnya
    bookmarkList.innerHTML = '';

    // Tambahkan bookmark baru, pastikan tidak duplikat
    bookmarks.forEach(b => {
      const slug = b.material_slug;
      if (!document.getElementById(`bookmark-${slug}`)) {
        const li = document.createElement('li');
        li.id = `bookmark-${slug}`; // ID unik
        li.textContent = b.materials?.title || slug;
        li.style.cursor = 'pointer';
        li.style.marginBottom = '6px';

        li.addEventListener('click', () => {
          window.location.href = `/kritika/material/jurumiya/${slug}/?slug=${slug}`;
        });

        bookmarkList.appendChild(li);
      }
    });
  }

  // Panggil loadBookmarks
  await loadBookmarks();
});