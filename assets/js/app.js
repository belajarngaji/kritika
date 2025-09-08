import { _supabase } from './supabase-client.js';

/* ==============================
   Helpers
============================== */
function shuffle(array) {
    return array.map(v => ({ v, r: Math.random() })).sort((a,b) => a.r - b.r).map(x => x.v);
}

/* ==============================
   Simpan attempt ke Supabase
============================== */
async function saveAttempt(userId, questionId, selectedKey, correctKey, materiSlug, category) {
    const { error } = await _supabase
        .from('kritika_attempts')
        .insert([{
            user_id: userId,
            question_id: questionId,
            selected_key: selectedKey,
            correct_key: correctKey,
            materi_slug: materiSlug,
            category: category,
            created_at: new Date()
        }]);
    if (error) console.error('❌ Error save attempt:', error);
}

/* ==============================
   Hitung stats per kategori
============================== */
async function getCategoryStats(userId) {
    const { data, error } = await _supabase
        .from('kritika_attempts')
        .select('category, selected_key, correct_key')
        .eq('user_id', userId);

    if (error) {
        console.error('❌ Error fetching stats:', error);
        return { labels: [], values: [] };
    }

    const stats = {};
    data.forEach(a => {
        if (!stats[a.category]) stats[a.category] = { correct:0, total:0 };
        stats[a.category].total++;
        if (a.selected_key === a.correct_key) stats[a.category].correct++;
    });

    const labels = Object.keys(stats);
    const values = labels.map(cat => Math.round((stats[cat].correct / stats[cat].total) * 100));
    return { labels, values };
}

/* ==============================
   Render radar chart
============================== */
function renderRadarChart(labels, values) {
    const radarData = {
        labels: labels,
        datasets: [{
            label: 'Keahlian Berpikir Kritis',
            data: values,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(59, 130, 246)'
        }]
    };

    const config = {
        type: 'radar',
        data: radarData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            elements: { line: { borderWidth: 3 } },
            scales: {
                r: { suggestedMin:0, suggestedMax:100 }
            },
            plugins: { legend: { display: false } }
        }
    };

    const ctx = document.getElementById('radarChart');
    if (ctx) new Chart(ctx, config);
}

/* ==============================
   Init halaman materi
============================== */
async function init() {
    const materiContent = document.getElementById('materiContent');
    const btnGenerate = document.getElementById('btnGenerate');
    const aiOutput = document.getElementById('aiOutput') || (() => {
        const el = document.createElement('div');
        el.id = 'aiOutput';
        el.classList.add('ai-output');
        btnGenerate.after(el);
        return el;
    })();

    const summary = document.getElementById('quizSummary') || (() => {
        const el = document.createElement('div');
        el.id = 'quizSummary';
        el.classList.add('ai-output');
        aiOutput.after(el);
        return el;
    })();

    // Ambil materi
    const { data: materials } = await _supabase.from('materials').select('*').order('id');
    const materi = materials.find(m => m.slug === 'jurumiya-bab1');
    materiContent.innerHTML = materi ? materi.content : '<p>Materi belum tersedia.</p>';
    if (!materi) return;

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    // Event generate soal
    btnGenerate.addEventListener('click', async () => {
        btnGenerate.disabled = true;
        btnGenerate.textContent = 'Loading...';
        aiOutput.innerHTML = '';
        summary.innerHTML = '';

        const questionsJson = await generateQuestions(materi.content); // fungsi AI generate pertanyaan
        if (!questionsJson) {
            aiOutput.innerHTML = '<p>AI gagal generate pertanyaan.</p>';
            btnGenerate.disabled = false;
            btnGenerate.textContent = 'Generate Soal';
            return;
        }

        let parsed;
        try { parsed = JSON.parse(questionsJson); } 
        catch(e) { 
            console.error('❌ JSON parse error:', e, questionsJson);
            aiOutput.innerHTML = '<p>Format JSON tidak valid.</p>';
            btnGenerate.disabled = false;
            btnGenerate.textContent = 'Generate Soal';
            return;
        }

        const total = parsed.questions.length;
        let answered = 0;
        let correctCount = 0;

        parsed.questions.forEach(q => {
            const originalCorrect = q.options.find(o => o.key === q.correct_answer);
            const shuffled = shuffle(q.options).map((opt,i)=>({ key:['A','B','C','D'][i], text:opt.text }));
            const newCorrect = shuffled.find(o => o.text===originalCorrect.text);

            const div = document.createElement('div');
            div.classList.add('question-block');
            div.dataset.correct = newCorrect.key;
            div.dataset.category = q.category || 'Umum';
            div.innerHTML = `
                <p><strong>${q.id}.</strong> ${q.question}</p>
                <ul class="options">
                    ${shuffled.map(opt=>`<li><button class="option-btn" data-key="${opt.key}">${opt.key}. ${opt.text}</button></li>`).join('')}
                </ul>
                <p class="feedback"></p>
            `;
            aiOutput.appendChild(div);

            div.querySelectorAll('.option-btn').forEach(btn=>{
                btn.addEventListener('click', async ()=>{
                    const userChoice = btn.dataset.key;
                    const correct = div.dataset.correct;
                    const category = div.dataset.category;
                    div.querySelectorAll('.option-btn').forEach(b=>b.disabled=true);

                    const isCorrect = (userChoice===correct);
                    if(isCorrect){ correctCount++; btn.nextElementSibling.textContent='✅ Benar'; btn.nextElementSibling.style.color='green'; }
                    else { btn.nextElementSibling.textContent=`❌ Salah. Jawaban benar: ${correct}`; btn.nextElementSibling.style.color='red'; }

                    answered++;
                    await saveAttempt(user.id, q.id, userChoice, correct, materi.slug, category);

                    summary.innerHTML = `
                        <strong>Total Soal:</strong> ${total}<br>
                        <strong>Terjawab:</strong> ${answered}<br>
                        <strong>Benar:</strong> ${correctCount}<br>
                        <strong>Salah:</strong> ${answered-correctCount}<br>
                        <strong>Nilai:</strong> ${correctCount}<br>
                        <strong>Rate:</strong> ${Math.round((correctCount/total)*100)}%
                    `;
                });
            });
        });

        btnGenerate.disabled = false;
        btnGenerate.textContent = 'Generate Soal';
    });

    // Render radar chart awal (kosong)
    renderRadarChart([], []);
}

// Start
init();