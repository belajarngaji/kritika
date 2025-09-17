import { supabase } from './supabase-client.js'; // Pastikan path ini benar

async function tampilkanDaftarMateri() {
  const container = document.getElementById('babList');
  if (!container) return;

  const kategori = container.dataset.category;
  if (!kategori) {
    console.error("Atribut 'data-category' tidak ditemukan.");
    return;
  }

  container.innerHTML = `<p>Memuat materi...</p>`;

  try {
    const { data: materials, error } = await supabase
      .from('materials')
      // Pastikan Anda mengambil kolom 'category' dan 'title'
      .select('slug, category, title') 
      .ilike('category', `${kategori}%`)
      .order('order', { ascending: true });

    if (error) throw error;

    container.innerHTML = '';

    materials.forEach(materi => {
      const link = document.createElement('a');
      link.href = `/kritika/learning/?slug=${materi.slug}`;
      link.className = 'bab-card';

      // --- PERUBAHAN LOGIKA DI SINI ---
      // 1. <h3> sekarang diisi dari kolom 'category'.
      // 2. <p> sekarang diisi dari kolom 'title'.
      link.innerHTML = `
        <h3>${materi.category}</h3>
        <p>${materi.title}</p>
      `;
      
      container.appendChild(link);
    });

  } catch (error) {
    container.innerHTML = `<p>Gagal memuat materi. Silakan coba lagi nanti.</p>`;
    console.error('Error saat mengambil materi:', error.message);
  }
}

document.addEventListener('DOMContentLoaded', tampilkanDaftarMateri);