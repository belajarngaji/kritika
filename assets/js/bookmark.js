import { _supabase as supabase } from './supabase-client.js';

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
    display:none; position:absolute; top:60px; right:10px;
    background:#fff; border:1px solid #ccc; border-radius:6px;
    padding:12px; width:250px; max-height:400px; overflow:auto;
    box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:1000;
  `;
  bookmarkModal.innerHTML = `<h3>Bookmarks</h3><ul id="bookmarkList" style="list-style:none; padding:0; margin:0;"></ul>`;
  document.body.appendChild(bookmarkModal);

  const bookmarkList = bookmarkModal.querySelector('#bookmarkList');

  // --- Toggle modal ---
  bookmarkBtn.addEventListener('click', () => {
    bookmarkModal.style.display = bookmarkModal.style.display === 'none' ? 'block' : 'none';
  });

  // --- Ambil user ---
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // --- Load bookmark dari DB ---
  async function loadBookmarks() {
    const { data: bookmarks, error } = await supabase
      .from('kritika_bookmark')
      .select(`material_slug, materials(title)`)
      .eq('user_id', user.id);

    if (error) { console.error(error); return; }

    bookmarkList.innerHTML = '';
    for (let b of bookmarks) {
      const li = document.createElement('li');
      li.style.marginBottom = '6px';
      li.style.cursor = 'pointer';
      li.textContent = b.materials?.title || b.material_slug;
      li.addEventListener('click', () => {
        window.location.href = `/kritika/material/jurumiya/${b.material_slug}/?slug=${b.material_slug}`;
      });
      bookmarkList.appendChild(li);
    }
  }

  await loadBookmarks();
});