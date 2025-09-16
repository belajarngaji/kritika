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

  // Ambil user
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;

  // Load bookmarks dari DB
  async function loadBookmarks() {
    const { data: bookmarks, error } = await _supabase
      .from('kritika_bookmark')
      .select(`material_slug, materials(title)`)
      .eq('user_id', user.id);

    if (error) { console.error(error); return; }

    bookmarkList.innerHTML = '';
    for (let b of bookmarks) {
      const li = document.createElement('li');
      li.textContent = b.materials?.title || b.material_slug;
      li.addEventListener('click', () => {
        window.location.href = `/kritika/material/jurumiya/${b.material_slug}/?slug=${b.material_slug}`;
      });
      bookmarkList.appendChild(li);
    }
  }

  await loadBookmarks();
});