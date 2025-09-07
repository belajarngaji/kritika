

// ==============================
// KONFIGURASI SUPABASE BARU
// ==============================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// API URL
// ==============================
const API_URL = 'https://hmmz-bot01.vercel.app/chat'; 

// ==============================
// Ambil semua materi dari Supabase
// ==============================
async function getMaterials() {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('id');
    if (error) {
      console.error('❌ Error fetch materials:', error);
      return [];
    }
    return data;
  } catch (err) {
    console.error('❌ Exception fetch materials:', err);
    return [];
  }
}

// ... (semua fungsi dan logika lain tetap sama)

// ==============================
// INIT Halaman Materi
// ==============================
let currentMaterial = null; 

async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');
  const aiQuestionContainer = document.getElementById('aiQuestionContainer');
  const questionText = document.getElementById('questionText');
  const optionsList = document.getElementById('optionsList');
  const feedbackMessage = document.getElementById('feedbackMessage');

  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');

  if (materi) {
      currentMaterial = materi;
      materiContent.innerHTML = marked.parse(currentMaterial.content);
  } else {
      materiContent.innerHTML = '<p>Materi belum tersedia.</p>';
      btnGenerate.disabled = true;
  }
  
  btnGenerate.addEventListener('click', async () => {
    // ... (logic for generating questions)
  });
}
init();
