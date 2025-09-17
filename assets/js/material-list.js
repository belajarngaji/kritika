import { supabase } from './supabase-client.js';

async function tesKoneksiTabel() {
  const container = document.getElementById('babList');
  if (!container) {
    alert('Error: Elemen dengan ID "babList" tidak ditemukan di HTML.');
    return;
  }
  
  container.innerHTML = '<p>Menjalankan tes koneksi ke tabel "materials"...</p>';
  console.log("Memulai tes...");

  // Hanya mencoba mengambil 5 baris dari 'materials' tanpa filter apa pun
  const { data, error } = await supabase
    .from('materials')
    .select('*') // Ambil semua kolom
    .limit(5);   // Ambil 5 baris saja untuk tes

  if (error) {
    console.error("TES GAGAL:", error);
    container.innerHTML = `<p style="color: red;"><strong>Tes Gagal.</strong> Koneksi ke tabel 'materials' bermasalah. Silakan periksa tab Console (F12) untuk melihat detail error.</p>`;
  } else {
    console.log("TES BERHASIL:", data);
    container.innerHTML = `<p style="color: green;"><strong>Tes Berhasil.</strong> Koneksi ke tabel 'materials' berhasil dan ditemukan ${data.length} data.</p>`;
    // Menampilkan data mentah untuk verifikasi
    container.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}

document.addEventListener('DOMContentLoaded', tesKoneksiTabel);