// ===============================
// CONFIG SUPABASE
// ===============================
const SUPABASE_URL = "https://jpxtbdawajjyrvqrgijd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE";
const supabase = supabaseCreateClient(SUPABASE_URL, SUPABASE_KEY);

// Fungsi helper untuk membuat client Supabase
function supabaseCreateClient(url, key) {
  return supabaseJs.createClient(url, key);
}

// ===============================
// FETCH DAFTAR MATERI
// ===============================
async function getMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetch materials:', error);
    return [];
  }
  return data;
}

// ===============================
// FETCH PERTANYAAN BERDASARKAN MATERIAL
// ===============================
async function getQuestions(material_id) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('material_id', material_id)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetch questions:', error);
    return [];
  }
  return data;
}

// ===============================
// FETCH REFLEKSI USER
// ===============================
async function getReflections(material_id, user_id) {
  const { data, error } = await supabase
    .from('reflections')
    .select('*')
    .eq('material_id', material_id)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetch reflections:', error);
    return [];
  }
  return data;
}

// ===============================
// SIMPAN REFLEKSI USER
// ===============================
async function saveReflection(material_id, user_id, reflectionText) {
  const { data, error } = await supabase
    .from('reflections')
    .insert([
      { material_id, user_id, reflection: reflectionText }
    ]);

  if (error) {
    console.error('Error save reflection:', error);
    return null;
  }
  return data;
}

// ===============================
// EXPORT FUNCTION (bisa dipanggil di HTML)
// ===============================
window.App = {
  getMaterials,
  getQuestions,
  getReflections,
  saveReflection
};

// ===============================
// CONFIG AI (OpenRouter)
// ===============================
const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// ===============================
// GENERATE PERTANYAAN KRITIS DARI TEKS MATERI
// ===============================
async function generateCriticalQuestion(materialText) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // bisa disesuaikan
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
    // Hasil bisa berupa text atau array tergantung response OpenRouter
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    } else {
      console.error('AI response kosong:', result);
      return null;
    }
  } catch (err) {
    console.error('Error generate AI question:', err);
    return null;
  }
}

// ===============================
// ANALISIS REFLEKSI USER
// ===============================
async function analyzeReflection(reflectionText) {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Analisis refleksi berikut dan berikan insight tambahan:\n${reflectionText}`
          }
        ],
        max_tokens: 200
      })
    });

    const result = await response.json();
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    } else {
      console.error('AI response kosong:', result);
      return null;
    }
  } catch (err) {
    console.error('Error analyze reflection:', err);
    return null;
  }
}

// ===============================
// EXPORT FUNCTION AI
// ===============================
window.AppAI = {
  generateCriticalQuestion,
  analyzeReflection
};