import { supabase } from "./supabase-client.js";

// Fungsi ini sekarang menjadi global dan bisa dipakai di mana saja
async function loadMateriByCategory() {
  const babListContainer = document.getElementById("babList");
  if (!babListContainer) return;

  // 1. Baca kategori dari atribut data-category di HTML
  const kategori = babListContainer.dataset.category;

  if (!kategori) {
    console.error("Atribut 'data-category' tidak ditemukan di elemen #babList");
    return;
  }
  
  // 2. Gunakan variabel 'kategori' untuk memfilter data di Supabase
  const { data, error } = await supabase
    .from("materials")
    .select("id, title, slug, category, description, order") // Ambil kolom yang Anda butuhkan
    .ilike("category", `${kategori}%`) // Filter dinamis
    .order("order", { ascending: true });

  if (error) {
    console.error("Error ambil data:", error.message);
    babListContainer.innerHTML = "<p>Gagal memuat materi.</p>";
    return;
  }

  babListContainer.innerHTML = ""; // Kosongkan container

  data.forEach((bab) => {
    const card = document.createElement("a");
    
    // PENTING: Gunakan struktur link ke halaman template dinamis
    card.href = `/kritika/material/?slug=${bab.slug}`;
    card.className = "bab-card";
    card.innerHTML = `
      <h3>${bab.title}</h3>
      <p>${bab.description}</p>
    `;
    babListContainer.appendChild(card);
  });
}

// Panggil fungsi saat halaman dimuat
loadMateriByCategory();