// ===============================
// IMPORT SUPABASE
// ===============================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ===============================
// CONFIG SUPABASE
// ===============================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE'; // ganti dengan key kamu
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// FETCH DATA
// ===============================
export async function getMaterials() {
  const { data, error } = await supabase.from('materials').select('*').order('id', { ascending: true });
  return error ? [] : data;
}

export async function getQuestions(material_id) {
  const { data, error } = await supabase.from('questions').select('*').eq('material_id', material_id).order('id', { ascending: true });
  return error ? [] : data;
}

export async function getReflections(material_id, user_id) {
  const { data, error } = await supabase.from('reflections').select('*').eq('material_id', material_id).eq('user_id', user_id).order('created_at', { ascending: false });
  return error ? [] : data;
}

export async function saveReflection(material_id, user_id, reflectionText) {
  const { data, error } = await supabase.from('reflections').insert([{ material_id, user_id, reflection: reflectionText }]);
  return error ? null : data;
}

// ===============================
// CONFIG AI (OpenRouter)
// ===============================
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function generateCriticalQuestion(materialText) {
  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages:[{role:'user', content:`Buatkan 3 pertanyaan kritis dari teks berikut:\n${materialText}`}],
        max_tokens:200
      })
    });
    const json = await res.json();
    return (json.choices && json.choices.length > 0) ? json.choices[0].message.content : null;
  } catch { return null; }
}

export async function analyzeReflection(reflectionText) {
  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${OPENROUTER_API_KEY}`},
      body: JSON.stringify({
        model:'gpt-4o-mini',
        messages:[{role:'user', content:`Analisis refleksi berikut dan berikan insight tambahan:\n${reflectionText}`}],
        max_tokens:200
      })
    });
    const json = await res.json();
    return (json.choices && json.choices.length > 0) ? json.choices[0].message.content : null;
  } catch { return null; }
}

// ===============================
// EXPORT KE GLOBAL (opsional, agar HTML bisa akses tanpa import)
window.App = { getMaterials, getQuestions, getReflections, saveReflection };
window.AppAI = { generateCriticalQuestion, analyzeReflection };