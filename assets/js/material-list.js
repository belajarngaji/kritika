import { supabase } from './supabase-client.js'; // Pastikan path ini benar

async function tampilkanDaftarMateri() {
  const container = document.getElementById('babList'); // Pastikan ID di HTML adalah "babList"
  if (!container) return;

  // Baca kategori dari atribut data-category di HTML
  const kategori = container.dataset.category;
  if (!kategori) {
    console.error("Atribut 'data-category' tidak ditemukan di elemen #babList");
    container.innerHTML = "<p>Konfigurasi halaman salah.</p>";
    return;
  }

  container.innerHTML = `<p>Memuat materi...</p>`;

  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('title, slug')
      .eq('category', kategori) // Filter berdasarkan kategori dari HTML
      // --- PERBAIKAN DI SINI ---
      .order('order', { ascending: true }); // Mengurutkan berdasarkan kolom 'order'

    if (error) throw error;

    container.innerHTML = ''; // Kosongkan container

    materials.forEach(materi => {
      const link = document.createElement('a');
      link.href = `/kritika/material/?slug=${materi.slug}`; // Sesuaikan path ke halaman materi
      link.className = 'bab-card'; // Gunakan class CSS Anda

      link.innerHTML = `
        <h3>${materi.title}</h3>
      `;
      container.appendChild(link);
    });

  } catch (error) {
    container.innerHTML = `<p>Gagal memuat materi. Silakan coba lagi nanti.</p>`;
    console.error('Error saat mengambil materi:', error.message);
  }
}

document.addEventListener('DOMContentLoaded', tampilkanDaftarMateri);