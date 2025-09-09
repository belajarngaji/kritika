// Impor langsung Supabase SDK dari CDN
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inisialisasi client langsung di sini
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE'; // anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadUserStats() {
  const chartTitle = document.querySelector('.chart-title');
  const chartCanvas = document.getElementById('radarChart');
  const statsOverview = document.getElementById('statsOverview');

  if (!chartCanvas) {
    console.error("Elemen canvas dengan id 'radarChart' tidak ditemukan.");
    return;
  }
  const ctx = chartCanvas.getContext('2d');

  try {
    // 1. Ambil data user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) console.error('Supabase Auth Error:', userError);
    if (!user) {
      chartTitle.textContent = 'Silakan Login untuk melihat statistik';
      return;
    }

    // 2. Panggil backend untuk skor dimensi
    const url = `https://hmmz-bot01.vercel.app/stats/${user.id}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const statsData = await response.json();

    if (!statsData || Object.keys(statsData).length === 0) {
      chartTitle.textContent = 'Belum Ada Statistik - Kerjakan beberapa kuis terlebih dahulu';
      return;
    }

    // 3. Ambil rata-rata speed langsung dari tabel attempts
    let speed = null;
    const { data: kritika_attempts, error: kritika_attemptsError } = await supabase
      .from('kritika_attempts')
      .select('duration_seconds')
      .eq('user_id', user.id);

    if (!kritika_attemptsError && kritika_attempts && kritika_attempts.length > 0) {
      const total = kritika_attempts.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
      speed = (total / kritika_attempts.length).toFixed(1);
    }

    // 4. Pisahkan skill dari statsData (tanpa speed)
    const labels = Object.keys(statsData);
    const scores = Object.values(statsData);

    // 5. Gambar chart radar
    chartTitle.textContent = 'Statistik Keahlian Kritis';
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Skor Rata-rata (%)',
            data: scores,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            pointBackgroundColor: 'rgb(59, 130, 246)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: { line: { borderWidth: 3 } },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
          },
        },
        plugins: { legend: { display: false } },
      },
    });

    // 6. Render grid skill + speed
    if (statsOverview) {
      statsOverview.innerHTML = '';
      labels.forEach((label, idx) => {
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `<strong>${label}</strong><br>${scores[idx]}%`;
        statsOverview.appendChild(div);
      });

      // Tambahkan speed di grid
      const speedDiv = document.createElement('div');
      speedDiv.className = 'stat-item';
      speedDiv.innerHTML = `<strong>Speed</strong><br>${speed ? speed + 's' : '-'}`;
      statsOverview.appendChild(speedDiv);
    }

    // 7. Sembunyikan slide 2 dst
    const allSlides = document.querySelectorAll('.swiper-slide');
    allSlides.forEach((slide, idx) => {
      if (idx !== 0) slide.style.display = 'none';
    });
  } catch (error) {
    chartTitle.textContent = 'Gagal Memuat Statistik';
    console.error('Gagal loadUserStats:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadUserStats);