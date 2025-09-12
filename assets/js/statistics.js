// Impor dan inisialisasi Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadUserStats() {
  // Ambil semua elemen target dari HTML
  const chartTitle = document.querySelector('.chart-title');
  const chartCanvas = document.getElementById('radarChart');
  const statsOverview = document.getElementById('statsOverview');
  const iqScoreContainer = document.getElementById('iqScoreContainer'); // Ambil elemen IQ baru
  
  if (!chartCanvas) {
    console.error("Elemen canvas 'radarChart' tidak ditemukan.");
    return;
  }
  const ctx = chartCanvas.getContext('2d');

  try {
    // 1. Ambil data user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      chartTitle.textContent = 'Silakan Login untuk melihat statistik';
      if (iqScoreContainer) iqScoreContainer.innerHTML = '';
      return;
    }

    // 2. Panggil semua data (stats, iq, dan speed) secara bersamaan untuk efisiensi
    const [statsResponse, iqResponse, speedQuery] = await Promise.all([
      fetch(`https://hmmz-bot01.vercel.app/stats/${user.id}`),
      fetch(`https://hmmz-bot01.vercel.app/iq-score/${user.id}`), // Panggil endpoint IQ baru
      supabase.from('kritika_attempts').select('duration_seconds').eq('user_id', user.id)
    ]);

    // 3. Proses hasil dari /stats untuk chart dan grid
    if (!statsResponse.ok) throw new Error(`Server error [stats]: ${statsResponse.status}`);
    const statsData = await statsResponse.json();

    if (!statsData || Object.keys(statsData).length === 0) {
      chartTitle.textContent = 'Belum Ada Statistik';
      if (iqScoreContainer) iqScoreContainer.innerHTML = '<p>Kerjakan kuis untuk melihat skor IQ.</p>';
      return;
    }

    // 4. Tampilkan Chart Radar
    chartTitle.textContent = 'Statistik Keahlian Kritis';
    const labels = Object.keys(statsData);
    const scores = Object.values(statsData);
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Skor Gabungan (%)',
          data: scores,
          fill: true,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
        }],
      },
      options: { /* ...opsi chart Anda... */ }
    });

    // 5. Tampilkan Skor IQ di wadah yang baru
    if (!iqResponse.ok) throw new Error(`Server error [iq]: ${iqResponse.status}`);
    const iqData = await iqResponse.json();
    if (iqData.iqScore && iqScoreContainer) {
      iqScoreContainer.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-700">Skor Kognitif (IQ Ekuivalen)</h3>
        <div class="iq-score-value">${iqData.iqScore}</div>
      `;
    }

    // 6. Tampilkan Grid Statistik
    let speed = null;
    if (speedQuery.data && speedQuery.data.length > 0) {
        const total = speedQuery.data.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
        speed = (total / speedQuery.data.length).toFixed(1);
    }
    if (statsOverview) {
      statsOverview.innerHTML = '';
      labels.forEach((label, idx) => {
        const div = document.createElement('div');
        div.className = 'stat-item';
        div.innerHTML = `<strong>${label}</strong><br>${scores[idx]}%`;
        statsOverview.appendChild(div);
      });
      const speedDiv = document.createElement('div');
      speedDiv.className = 'stat-item';
      speedDiv.innerHTML = `<strong>Speed</strong><br>${speed ? speed + 's' : '-'}`;
      statsOverview.appendChild(speedDiv);
    }

    // 7. Sembunyikan slide lain (logika asli Anda)
    const allSlides = document.querySelectorAll('.swiper-slide');
    allSlides.forEach((slide, idx) => {
      if (idx !== 0) slide.style.display = 'none';
    });

  } catch (error) {
    chartTitle.textContent = 'Gagal Memuat Statistik';
    if (iqScoreContainer) iqScoreContainer.innerHTML = `<p style="color: red;">Gagal memuat skor IQ.</p>`;
    console.error('Gagal loadUserStats:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadUserStats);