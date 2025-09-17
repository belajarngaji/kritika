import { supabase } from "./supabase-client.js";

const babList = document.getElementById("babList");

async function loadMaterials() {
  const { data, error } = await supabase
    .from("materials")
    .select("id, title, slug, order, category")
    .eq("category", "sintaksis") // filter sesuai folder/category
    .order("order", { ascending: true });

  if (error) {
    babList.innerHTML = `<p style="color:red">Gagal memuat data.</p>`;
    console.error(error);
    return;
  }

  babList.innerHTML = "";
  data.forEach((bab) => {
    const card = document.createElement("a");
    card.href = `bab${bab.order}/?slug=${bab.slug}`;
    card.className = "card";
    card.innerHTML = `
      <h3>Bab ${bab.order}</h3>
      <p>${bab.title}</p>
    `;
    babList.appendChild(card);
  });
}

loadMaterials();