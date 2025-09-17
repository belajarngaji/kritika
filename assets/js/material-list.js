import { supabase } from "./supabase-client.js";

async function loadBabNahwu() {
  const { data, error } = await supabase
    .from("materials")
    .select("id, title, slug, category, order")
    .ilike("category", "Nahwu%")
    .order("order", { ascending: true }); // urutkan berdasarkan kolom order

  if (error) {
    console.error("Error ambil data:", error.message);
    return;
  }

  const babList = document.getElementById("babList");
  babList.innerHTML = "";

  data.forEach((bab) => {
    const card = document.createElement("a");

    // langsung menuju folder slug
    card.href = `/kritika/material/${bab.slug}/`;
    card.className = "bab-card";
    card.innerHTML = `
      <h3>${bab.category}</h3>
      <p>${bab.title}</p>
    `;
    babList.appendChild(card);
  });
}

loadBabNahwu();