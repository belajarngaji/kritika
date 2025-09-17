import { supabase } from './supabase-client.js'; // Pastikan path ini benar

async function tampilkanDaftarMateri() {
  const container = document.getElementById('babList');
  if (!container) {
    console.error('Wadah "babList" tidak ditemukan.');
    return;
  }

  const kategori = container.dataset.category;
  if (!kategori) {
    console.error("Atribut 'data-category' tidak ditemukan.");
    container.innerHTML = "<p>Konfigurasi halaman salah.</p>";
    return;
  }

  container.innerHTML = `<p>Memuat materi...</p>`;

  try {
    // Mengambil data berdasarkan izin publik yang sudah ada
    const { data: materials, error } = await supabase
      .from('materials')
      .select('title, slug')
      .eq('category', kategori)
      .order('order', { ascending: true }); // Menggunakan kolom 'order'

    if (error) throw error;

    container.innerHTML = ''; // Kosongkan container

    materials.forEach(materi => {
      const link = document.createElement('a');
      link.href = `/kritika/material/?slug=${materi.slug}`;
      link.className = 'bab-card';
      link.innerHTML = `<h3>${materi.title}</h3>`;
      container.appendChild(link);
    });

  } catch (error) {
    container.innerHTML = `<p>Gagal memuat materi. Silakan coba lagi nanti.</p>`;
    console.error('Error saat mengambil materi:', error.message);
  }
}

document.addEventListener('DOMContentLoaded', tampilkanDaftarMateri);