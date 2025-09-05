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