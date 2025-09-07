import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

/* ==============================
   Supabase Config
============================== */
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ==============================
   Helpers: Text processing
============================== */
// hapus tag HTML → plain text
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  // ambil juga text dalam <li> supaya gak hilang tanda titik
  div.querySelectorAll('li').forEach(li => { if (!li.textContent.trim().endsWith('.')) li.textContent += '.'; });
  return div.textContent.replace(/\s+/g, ' ').trim();
}

// pecah kalimat sederhana (latin + tanda tanya arab)
function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|(?<=\u061F)\s+/u)
    .map(s => s.trim())
    .filter(s => s.length >= 30 && s.length <= 220);
}

const ID_STOPWORDS = new Set([
  'dan','yang','di','ke','dari','untuk','pada','dengan','adalah','atau','itu','ini','sebuah','seorang','para',
  'oleh','karena','sebagai','bahwa','dalam','tidak','akan','kita','mereka','dia','ia','sudah','telah','ada',
  'kami','aku','kamu','anda','serta','hingga','antara','sehingga','agar','juga','atau','pun','bagi','dapat'
]);

const ARABIC_RE = /[\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*/gu; // frasa arab
const PROPER_RE = /(?:[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’\-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’\-]+){0,3})/gu; // Nama kapital

function unique(arr) {
  return [...new Set(arr.map(s => s.trim()))].filter(Boolean);
}

// ekstrak kandidat jawaban (nama diri, frasa arab, angka penting)
function extractCandidates(text) {
  const arab = (text.match(ARABIC_RE) || []);
  const proper = (text.match(PROPER_RE) || []);
  const numbers = (text.match(/\b(?:\d{3,4}|\d{1,2}\s+[A-Z][a-z]+(?:\s+\d{4})?)\b/g) || []);
  let pool = unique([...arab, ...proper, ...numbers])
    .filter(s => s.length >= 3 && s.length <= 60);
  return pool;
}

// fallback keywords dari satu kalimat jika tidak ketemu kandidat “penting”
function keywordsFromSentence(sent) {
  return sent
    .replace(/[“”"(){}\[\],:;—–\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 5 && !ID_STOPWORDS.has(w.toLowerCase()))
    .slice(0, 12);
}

// apakah string bernuansa arab?
function isArabic(str) { return /[\u0600-\u06FF]/.test(str); }

/* Distractor generator (kalau pool kurang) */
function mutateLatin(s) {
  if (s.length < 5) return s + 'a';
  const i = Math.max(1, Math.min(s.length - 2, Math.floor(s.length / 2)));
  return s.slice(0, i) + s[i+1] + s[i] + s.slice(i+2); // swap 2 huruf tengah
}
function mutateArabic(s) {
  if (s.startsWith('ال')) return s.slice(2);     // buang al-
  if (s.length > 4) return 'ال' + s;             // tambah al-
  return s + 'ة';                                 // variasi kecil
}

/* ambil sampai n distractor dari pool (prioritas sejenis), fallback mutasi */
function pickDistractors(correct, pool, n=3) {
  const sameType = pool.filter(p => p !== correct && (isArabic(p) === isArabic(correct)));
  let picks = [];
  while (picks.length < n && sameType.length) {
    const idx = Math.floor(Math.random() * sameType.length);
    picks.push(sameType.splice(idx,1)[0]);
    picks = unique(picks);
  }
  // fallback mutasi
  while (picks.length < n) {
    const m = isArabic(correct) ? mutateArabic(correct) : mutateLatin(correct);
    if (!picks.includes(m) && m !== correct) picks.push(m);
  }
  return picks.slice(0, n);
}

/* ==============================
   Soal generator offline (tanpa AI)
============================== */
function generateQuestionsOffline(materialHtml, total = 3) {
  const text = stripHtml(materialHtml);
  const sentences = splitSentences(text);
  const globalPool = extractCandidates(text);

  const questions = [];
  const usedSentences = new Set();

  for (const sent of sentences) {
    if (questions.length >= total) break;
    if (usedSentences.has(sent)) continue;

    // cari kandidat jawaban yang muncul di kalimat
    let candidateInSentence = null;
    for (const cand of globalPool) {
      if (sent.includes(cand) && cand.length >= 3) { candidateInSentence = cand; break; }
    }
    // fallback: ambil keyword dari kalimat
    if (!candidateInSentence) {
      const kws = keywordsFromSentence(sent);
      if (!kws.length) continue;
      candidateInSentence = kws[0];
    }

    // buat cloze sentence
    const blanked = sent.replace(candidateInSentence, '_____');

    // distractor
    const distractors = pickDistractors(candidateInSentence, globalPool, 3);
    const options = [candidateInSentence, ...distractors]
      .map((text, i) => ({ key: ['A','B','C','D'][i], text }));

    questions.push({
      id: 'q' + (questions.length + 1),
      question: `Lengkapi kalimat berikut: "${blanked}"`,
      options,
      correct_answer: options[0].key // sementara A (nanti diacak & diremap)
    });
    usedSentences.add(sent);
  }

  // kalau masih kurang, isi dummy dari kalimat lain
  while (questions.length < total && sentences.length) {
    const s = sentences[Math.floor(Math.random() * sentences.length)];
    const kw = keywordsFromSentence(s)[0] || 'kata';
    const blanked = s.replace(kw, '_____');
    const distractors = pickDistractors(kw, globalPool, 3);
    const options = [kw, ...distractors].map((text, i) => ({ key: ['A','B','C','D'][i], text }));
    questions.push({
      id: 'q' + (questions.length + 1),
      question: `Lengkapi kalimat berikut: "${blanked}"`,
      options,
      correct_answer: options[0].key
    });
  }

  return { questions };
}

/* ==============================
   UI helpers
============================== */
function shuffle(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a,b) => a.r - b.r)
    .map(x => x.v);
}

/* ==============================
   Ambil materi dari Supabase
============================== */
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

/* ==============================
   INIT Halaman (tanpa AI)
============================== */
async function init() {
  const materiContent = document.getElementById('materiContent');
  const btnGenerate = document.getElementById('btnGenerate');

  let aiOutput = document.getElementById('aiOutput');
  if (!aiOutput) {
    aiOutput = document.createElement('div');
    aiOutput.id = 'aiOutput';
    aiOutput.classList.add('ai-output');
    btnGenerate.after(aiOutput);
  }

  let summary = document.getElementById('quizSummary');
  if (!summary) {
    summary = document.createElement('div');
    summary.id = 'quizSummary';
    summary.classList.add('ai-output');
    aiOutput.after(summary);
  }

  // ambil materi
  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';
  if (!materi) return;

  // generator offline
  btnGenerate.addEventListener('click', async () => {
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Menyusun...';
    aiOutput.innerHTML = '';
    summary.innerHTML = '';

    const data = generateQuestionsOffline(materi.content, 3);

    let total = data.questions.length;
    let answered = 0;
    let correctCount = 0;

    data.questions.forEach(q => {
      // acak opsi
      const originalCorrect = q.options.find(o => o.key === q.correct_answer);
      let shuffled = shuffle(q.options);
      const keys = ['A','B','C','D'];
      shuffled = shuffled.map((opt, i) => ({ key: keys[i], text: opt.text }));
      const newCorrect = shuffled.find(o => o.text === originalCorrect.text);

      // render
      const div = document.createElement('div');
      div.classList.add('question-block');
      div.dataset.correct = newCorrect.key;
      div.innerHTML = `
        <p><strong>${q.id}.</strong> ${q.question}</p>
        <ul class="options">
          ${shuffled.map(opt => `
            <li><button class="option-btn" data-key="${opt.key}">${opt.key}. ${opt.text}</button></li>
          `).join('')}
        </ul>
        <p class="feedback"></p>
      `;
      aiOutput.appendChild(div);

      // event pilih jawaban
      div.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const user = btn.dataset.key;
          const correct = div.dataset.correct;
          const fb = div.querySelector('.feedback');

          // kunci setelah memilih
          div.querySelectorAll('.option-btn').forEach(b => (b.disabled = true));

          if (user === correct) {
            correctCount += 1;
            fb.textContent = '✅ Benar';
            fb.style.color = 'green';
          } else {
            fb.textContent = `❌ Salah. Jawaban benar: ${correct}`;
            fb.style.color = 'red';
          }
          answered += 1;
          summary.innerHTML = `<strong>Skor:</strong> ${correctCount}/${total} (terjawab ${answered}/${total})`;
        });
      });
    });

    btnGenerate.disabled = false;
    btnGenerate.textContent = 'Generate Pertanyaan';
  });
}

// start
init();