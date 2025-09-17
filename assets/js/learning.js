import { supabase } from './supabase-client.js';

const judulEl = document.getElementById('judul-bab');
const containerEl = document.getElementById('materiContainer');
const btnKembaliEl = document.getElementById('btnKembali');
const btnLanjutEl = document.getElementById('btnLanjut');

async function muatMateriDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    judulEl.textContent = "Materi tidak ditemukan";
    return;
  }

  const { data: currentMateri, error } = await supabase
    .from('materials')
    .select('title, content, category, order')
    .eq('slug', slug)
    .single();

  if (error || !currentMateri) {
    judulEl.textContent = "Gagal Memuat Konten";
    console.error(error);
    return;
  }

  judulEl.textContent = currentMateri.title;
  containerEl.innerHTML = currentMateri.content;
  
  // Siapkan navigasi dinamis
  setupNavigation(currentMateri.category, currentMateri.order);
}

async function setupNavigation(kategori, urutanSekarang) {
  const { data: navData, error } = await supabase
    .from('materials')
    .select('slug, order')
    .eq('category', kategori)
    .in('order', [urutanSekarang - 1, urutanSekarang + 1]);

  if (error) return;

  const prevMateri = navData.find(m => m.order === urutanSekarang - 1);
  const nextMateri = navData.find(m => m.order === urutanSekarang + 1);

  if (prevMateri) {
    btnKembaliEl.onclick = () => window.location.href = `?slug=${prevMateri.slug}`;
  } else {
    btnKembaliEl.disabled = true;
    btnKembaliEl.textContent = "Ini Bab Pertama";
  }

  if (nextMateri) {
    btnLanjutEl.onclick = () => window.location.href = `?slug=${nextMateri.slug}`;
  } else {
    btnLanjutEl.disabled = true;
    btnLanjutEl.textContent = "Ini Bab Terakhir";
  }
}

document.addEventListener('DOMContentLoaded', muatMateriDetail);