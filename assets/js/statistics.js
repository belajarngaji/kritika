// Impor langsung Supabase SDK dari CDN
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inisialisasi client langsung di sini
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE'; // anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fungsi utama untuk memuat statistik pengguna dan menggambar radar chart + grid.
 */
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
    // 1. Ambil data pengguna yang sedang login
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) console.error('Supabase Auth Error:', userError);
    console.log('User Supabase:', user);

    if (!user) {
      chartTitle.textContent = 'Silakan Login untuk melihat statistik';
      return;
    }

    // 2. Panggil endpoint backend Python untuk ambil data statistik
    const url = `https://hmmz-bot01.vercel.app/stats/${user.id}`;
    console.log('Fetch URL:', url);

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Server merespons dengan status: ${response.status}`);
    }

    const statsData = await response.json();
    console.log('Stats Data:', statsData);

    // 3. Cek jika data statistik kosong
    if (!statsData || Object.keys(statsData).length === 0) {
      chartTitle.textContent =
        'Belum Ada Statistik - Kerjakan beberapa kuis terlebih dahulu';
      return;
    }

    // 4. Gambar chart radar
    chartTitle.textContent = 'Statistik Keahlian Kritis';
    const labels = Object.keys(statsData);
    const scores = Object.values(statsData);

    console.log('Labels:', labels);
    console.log('Scores:', scores);

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Skor Rata-rata (%)',
            data: scores,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(59, 130, 246)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: { line: { borderWidth: 3 } },
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: 100,
            pointLabels: { font: { size: 12, weight: 'bold' } },
            ticks: { backdropColor: 'rgba(255, 255, 255, 1)' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });

    // 5. Render grid di Slide 1
    if (statsOverview) {
      statsOverview.innerHTML = ''; // reset isi

      labels.forEach((label, idx) => {
        const value = scores[idx];
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `
          <strong>${label}</strong><br>
          ${value}%
        `;
        statsOverview.appendChild(div);
      });
    }
  } catch (error) {
    chartTitle.textContent = 'Gagal Memuat Statistik';
    console.error('Gagal menjalankan fungsi loadUserStats:', error);
  }
}

// Jalankan fungsi setelah seluruh halaman siap
document.addEventListener('DOMContentLoaded', loadUserStats);