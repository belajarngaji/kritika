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
  const header = document.querySelector('.profile-header');
  if (!header) return;

  // --- Tambahkan tombol bookmark di header ---
  const bookmarkBtn = document.createElement('button');
  bookmarkBtn.id = 'bookmarkHeaderBtn';
  bookmarkBtn.style = 'background:none; border:none; cursor:pointer; margin-left:8px;';
  bookmarkBtn.innerHTML = `<i class="fi fi-rr-bookmark" style="font-size:1.8rem; color:white;"></i>`;
  header.appendChild(bookmarkBtn);

  // --- Tambahkan modal bookmark ---
  const bookmarkModal = document.createElement('div');
  bookmarkModal.id = 'bookmarkModal';
  bookmarkModal.style = `
    display:none; position:fixed; top:60px; right:10px;
    background:#fff; border:1px solid #ccc; border-radius:6px;
    padding:12px; width:250px; max-height:400px; overflow:auto;
    box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:1000;
  `;
  bookmarkModal.innerHTML = `<h3 style="margin-top:0;">Bookmarks</h3><ul id="bookmarkList" style="list-style:none; padding:0; margin:0;"></ul>`;
  document.body.appendChild(bookmarkModal);

  const bookmarkList = bookmarkModal.querySelector('#bookmarkList');

  // --- Toggle modal ---
  bookmarkBtn.addEventListener('click', () => {
    bookmarkModal.style.display = bookmarkModal.style.display === 'none' ? 'block' : 'none';
  });

  // --- Ambil user ---
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return;

  // --- Load bookmark dari DB ---
  async function loadBookmarks() {
    const { data: bookmarks, error } = await _supabase
      .from('kritika_bookmark')
      .select('material_slug')
      .eq('user_id', user.id);

    if (error) { console.error(error); return; }

    bookmarkList.innerHTML = '';
    for (let b of bookmarks) {
      const li = document.createElement('li');
      li.style.marginBottom = '6px';
      li.style.cursor = 'pointer';
      li.style.padding = '4px 6px';
      li.style.borderRadius = '4px';
      li.style.transition = 'background 0.2s';
      li.textContent = b.material_slug;

      li.addEventListener('mouseenter', () => li.style.background = '#f0f0f0');
      li.addEventListener('mouseleave', () => li.style.background = 'transparent');

      li.addEventListener('click', () => {
        window.location.href = `/kritika/material/jurumiya/${b.material_slug}/?slug=${b.material_slug}`;
      });

      bookmarkList.appendChild(li);
    }

    if (bookmarks.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'Belum ada bookmark';
      empty.style.color = '#888';
      empty.style.fontStyle = 'italic';
      bookmarkList.appendChild(empty);
    }
  }

  await loadBookmarks();
});