// Impor client Supabase dari file terpusat
import { _supabase } from './supabase-client.js';
/**
 * Fungsi utama untuk memuat statistik pengguna dan menggambar radar chart.
 */
async function loadUserStats() {
    const chartTitle = document.querySelector('.chart-title');
    const chartCanvas = document.getElementById('radarChart');

    if (!chartCanvas) {
        console.error("Elemen canvas dengan id 'radarChart' tidak ditemukan.");
        return;
    }
    const ctx = chartCanvas.getContext('2d');

    try {
        // 1. Ambil data pengguna yang sedang login
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            chartTitle.textContent = "Silakan Login";
            ctx.fillText("Anda harus login untuk melihat statistik.", 10, 50);
            return;
        }

        // 2. Panggil endpoint backend Python untuk mengambil data statistik
        const response = await fetch(`https://hmmz-bot01.vercel.app/stats/${user.id}`);
        if (!response.ok) {
            throw new Error(`Server merespons dengan status: ${response.status}`);
        }
        const statsData = await response.json();

        // 3. Cek jika data statistik kosong
        if (!statsData || Object.keys(statsData).length === 0) {
            chartTitle.textContent = "Belum Ada Statistik";
            ctx.fillText("Kerjakan beberapa kuis untuk melihat statistik Anda di sini.", 10, 50);
            return;
        }

        // 4. Proses data dan gambar chart
        chartTitle.textContent = "Statistik Keahlian Kritis";
        const labels = Object.keys(statsData);
        const scores = Object.values(statsData);
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Skor Rata-rata (%)',
                    data: scores,
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(59, 130, 246)'
                }]
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
                        ticks: { backdropColor: 'rgba(255, 255, 255, 1)' }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

    } catch (error) {
        chartTitle.textContent = "Gagal Memuat Statistik";
        ctx.fillText("Terjadi kesalahan saat memuat chart.", 10, 50);
        console.error("Gagal menjalankan fungsi loadUserStats:", error);
    }
}

// Jalankan fungsi setelah seluruh halaman siap
document.addEventListener('DOMContentLoaded', loadUserStats);
