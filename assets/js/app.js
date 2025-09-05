// ===============================
// IMPORT SUPABASE
// ===============================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Konfigurasi Supabase
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// FETCH MATERI
// ===============================
async function getMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error fetch materials:', error);
    return [];
  }
  console.log('✅ Data materials:', data);
  return data;
}

// ===============================
// CONFIG AI (via FastAPI Proxy)
// ===============================
const API_URL = 'https://hmmz-bot01.vercel.app/chat';

// Generate pertanyaan kritis
async function generateCriticalQuestion(materialText) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Buatkan 3 pertanyaan kritis dari teks berikut:\n${materialText}`,
        mode: "qa",
        session_id: "jurumiya-bab1"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errText);
      return null;
    }

    const result = await response.json();
    console.log('✅ Full response AI:', result);

    return result.reply || null;
  } catch (err) {
    console.error('❌ Error generate AI question:', err);
    return null;
  }
}

// ===============================
// INIT
// ===============================
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiOutput = document.getElementById('aiOutput');

  // Ambil materi Bab 1
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');

  if (materi) {
    materiContent.innerHTML = materi.content;
  } else {
    materiContent.innerHTML = '<p>Materi belum tersedia.</p>';
  }

  // Event: generate pertanyaan kritis
  btnGenerate.addEventListener('click', async () => {
    if (!materi) return;
    aiOutput.innerHTML = '<p>Loading AI...</p>';
    const questions = await generateCriticalQuestion(materi.content);
    aiOutput.innerHTML = questions
      ? `<p>${questions}</p>`
      : '<p>AI gagal generate pertanyaan.</p>';
  });
}

// Jalankan
init();