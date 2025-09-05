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
  console.log('✅ Data materials:', data); // debug
  return data;
}

// ===============================
// CONFIG AI (OpenRouter)
// ===============================
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Generate pertanyaan kritis
async function generateCriticalQuestion(materialText) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://belajarngaji.github.io',
        'X-Title': 'Kritika'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'user',
            content: `Buatkan 3 pertanyaan kritis dari teks berikut:\n${materialText}`
          }
        ],
        max_tokens: 200
      })
    });

    const result = await response.json();
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    }
    return null;
  } catch (err) {
    console.error('❌ Error generate AI question:', err);
    return null;
  }
}

// ===============================
// INIT LANGSUNG
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

// Jalankan langsung
init();