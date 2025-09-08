import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { _supabase } from './supabase-client.js';
const API_URL = 'https://hmmz-bot01.vercel.app/chat';

async function getMaterials() {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('id');
    if (error) console.error('❌ Error fetch materials:', error);
    return data || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function generateQuestions(materialText) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        message: `Buat 5 soal pilihan ganda dari teks berikut. Sertakan "category" untuk tiap soal: Analisis, Logika, Evaluasi, Refleksi, Konsistensi. Format JSON valid.`,
        mode: "qa",
        session_id: "jurumiya-bab1"
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || null;
  } catch (err) {
    console.error('❌ Error AI generate:', err);
    return null;
  }
}

function shuffle(array) {
  return array.map(v => ({v, r: Math.random()}))
              .sort((a,b)=> a.r-b.r)
              .map(x=>x.v);
}

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

  const materials = await getMaterials();
  const materi = materials.find(m => m.slug === 'jurumiya-bab1');
  materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';
  if (!materi) return;

  btnGenerate.addEventListener('click', async () => {
    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Loading...';
    aiOutput.innerHTML = '';
    summary.innerHTML = '';

    const questionsJson = await generateQuestions(materi.content);
    if (!questionsJson) {
      aiOutput.innerHTML = '<p>AI gagal generate pertanyaan.</p>';
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Soal';
      return;
    }

    let parsed;
    try { parsed = JSON.parse(questionsJson); }
    catch (err) {
      console.error('❌ JSON parse error:', err, questionsJson);
      aiOutput.innerHTML = '<p>Format JSON tidak valid.</p>';
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate Soal';
      return;
    }

    const total = parsed.questions.length;
    let answered = 0, correctCount = 0;

    // Untuk radar chart kategori
    const categoryScore = {Analisis:0, Logika:0, Evaluasi:0, Refleksi:0, Konsistensi:0};

    parsed.questions.forEach(q => {
      const originalCorrect = q.options.find(o=>o.key===q.correct_answer);
      let shuffled = shuffle(q.options);
      const keys=['A','B','C','D'];
      shuffled = shuffled.map((opt,i)=>({key:keys[i], text:opt.text}));
      const newCorrect = shuffled.find(o=>o.text===originalCorrect.text);

      const div = document.createElement('div');
      div.classList.add('question-block');
      div.dataset.correct = newCorrect.key;
      div.dataset.category = q.category || 'Analisis'; // default Analisis
      div.innerHTML = `
        <p><strong>${q.id}.</strong> ${q.question}</p>
        <ul class="options">
          ${shuffled.map(opt=>`<li><button class="option-btn" data-key="${opt.key}">${opt.key}. ${opt.text}</button></li>`).join('')}
        </ul>
        <p class="feedback"></p>
      `;
      aiOutput.appendChild(div);

      div.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const user = btn.dataset.key;
          const correct = div.dataset.correct;
          const fb = div.querySelector('.feedback');
          const category = div.dataset.category;

          div.querySelectorAll('.option-btn').forEach(b => b.disabled=true);

          const isCorrect = user===correct;
          if (isCorrect) {
            correctCount++;
            categoryScore[category] += 1; // tambah skor kategori
            fb.textContent = '✅ Benar';
            fb.style.color='green';
          } else {
            fb.textContent=`❌ Salah. Jawaban benar: ${correct}`;
            fb.style.color='red';
          }

          answered++;
          summary.innerHTML=`
<strong>Total Soal:</strong> ${total}<br>
<strong>Terjawab:</strong> ${answered}<br>
<strong>Benar:</strong> ${correctCount}<br>
<strong>Salah:</strong> ${answered-correctCount}<br>
<strong>Nilai:</strong> ${correctCount}<br>
<strong>Rate:</strong> ${Math.round(correctCount/total*100)}%
`;
          // Simpan ke Supabase
          const { data: { user } } = await _supabase.auth.getUser();
          if (user) {
            await _supabase.from('kritika_attempts').insert([{
              user_id: user.id,
              question_id: q.id,
              category: category,
              is_correct: isCorrect,
              created_at: new Date()
            }]);
          }

          // Update chart per klik (opsional)
          renderRadarChart(categoryScore);
        });
      });
    });

    btnGenerate.disabled=false;
    btnGenerate.textContent='Generate Soal';
  });
}

// Chart radar kategori
let radarChartInstance=null;
function renderRadarChart(categoryScore) {
  const labels = ['Analisis','Logika','Evaluasi','Refleksi','Konsistensi'];
  const data = {
    labels,
    datasets:[{
      label:'Keahlian Berpikir Kritis',
      data: labels.map(l=>categoryScore[l]||0),
      fill:true,
      backgroundColor:'rgba(59,130,246,0.2)',
      borderColor:'rgb(59,130,246)',
      pointBackgroundColor:'rgb(59,130,246)',
      pointBorderColor:'#fff',
      pointHoverBackgroundColor:'#fff',
      pointHoverBorderColor:'rgb(59,130,246)'
    }]
  };

  const config = {type:'radar', data, options:{responsive:true, maintainAspectRatio:true,
    elements:{line:{borderWidth:3}}, scales:{r:{angleLines:{display:true}, suggestedMin:0, suggestedMax:5}}}};
  
  if(radarChartInstance) radarChartInstance.destroy();
  radarChartInstance = new Chart(document.getElementById('radarChart'), config);
}

init();