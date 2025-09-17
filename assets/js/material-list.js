import { supabase } from './supabase-client.js'; // Pastikan path ini benar

async function tampilkanDaftarMateri() {
  const container = document.getElementById('babList');
  if (!container) {
    console.error('Error: Wadah dengan ID "babList" tidak ditemukan di HTML.');
    return;
  }

  // Baca kategori dari atribut `data-category` di HTML (contoh: "Nahwu")
  const kategori = container.dataset.category;
  if (!kategori) {
    console.error("Error: Atribut 'data-category' tidak ditemukan di elemen #babList.");
    container.innerHTML = "<p>Konfigurasi halaman salah.</p>";
    return;
  }

  container.innerHTML = `<p>Memuat materi...</p>`;

  try {
    // Ambil data dari Supabase dengan filter dan urutan yang benar
    const { data: materials, error } = await supabase
      .from('materials')
      .select('title, slug')
      // Menggunakan .ilike() agar lebih fleksibel, cocok untuk "Nahwu Bab I", dll.
      .ilike('category', `${kategori}%`) 
      // Mengurutkan berdasarkan kolom 'order' yang sudah Anda konfirmasi
      .order('order', { ascending: true }); 

    if (error) {
      // Jika ada error dari Supabase, lempar error untuk ditangkap oleh 'catch'
      throw error;
    }

    // Kosongkan container dari pesan "Memuat..."
    container.innerHTML = '';

    // Periksa jika tidak ada materi yang ditemukan
    if (materials.length === 0) {
      container.innerHTML = `<p>Belum ada materi untuk kategori ini.</p>`;
      return;
    }

    // Loop melalui setiap data materi dan buat elemen HTML-nya
    materials.forEach(materi => {
      const link = document.createElement('a');
      // Arahkan ke halaman template materi yang dinamis
      link.href = `/kritika/material/?slug=${materi.slug}`;
      link.className = 'bab-card'; // Gunakan class CSS Anda

      link.innerHTML = `<h3>${materi.title}</h3>`;
      
      container.appendChild(link);
    });

  } catch (error) {
    container.innerHTML = `<p>Gagal memuat materi. Silakan coba lagi nanti.</p>`;
    console.error('Error saat mengambil materi:', error.message);
  }
}

// Jalankan fungsi utama saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', tampilkanDaftarMateri);