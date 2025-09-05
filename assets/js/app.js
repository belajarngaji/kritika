import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_URL = 'https://hmmz-bot01.vercel.app/chat';

async function getMaterials() {
  const { data, error } = await supabase.from('materials').select('*').order('id');
  if (error) { console.error('❌ Error fetch materials:', error); return []; }
  return data;
}

async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message:`Buatkan 3 pertanyaan kritis dari teks berikut:\n${materialText}`, mode:"qa", session_id:"jurumiya-bab1"})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || null;
  } catch (err) { console.error('❌ Error AI:', err); return null; }
}

async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiOutput = document.getElementById('aiOutput');

  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');

  if (materi) {
    // Gunakan innerHTML agar HTML Supabase tampil
    materiContent.innerHTML = materi.content;
  } else {
    materiContent.innerHTML = '<p>Materi belum tersedia.</p>';
  }

  btnGenerate.addEventListener('click', async () => {
    if (!materi) return;
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';

    const questions = await generateCriticalQuestion(materi.content);
    aiOutput.innerHTML = questions ? marked.parse(questions) : '<p>AI gagal generate pertanyaan.</p>';

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Pertanyaan Kritis';
  });
}

init();