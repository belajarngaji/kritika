// /kritika/assets/js/statistics.js
import { _supabase } from './supabase-client.js';

async function loadUserStats() {
    // Ambil user saat ini
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert("Anda harus login untuk melihat statistik.");

    // Ambil data statistik dari tabel kritika_stat
    const { data: stats, error } = await _supabase
        .from('kritika_stat')
        .select('category, avg_score')
        .eq('user_id', user.id);

    if (error) {
        console.error("Gagal mengambil data statistik:", error);
        return;
    }

    if (!stats || stats.length === 0) {
        console.warn("Statistik tidak ditemukan untuk user ini.");
        return;
    }

    // Susun label dan data untuk Chart.js
    const labels = stats.map(s => s.category);
    const scores = stats.map(s => s.avg_score);

    // Konfigurasi Chart
    const data = {
        labels: labels,
        datasets: [{
            label: 'Keahlian Berpikir Kritis',
            data: scores,
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
        data: data,
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
    };

    // Render chart
    new Chart(document.getElementById('radarChart'), config);
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadUserStats);