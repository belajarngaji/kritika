// Impor client Supabase Anda. Pastikan path-nya benar.
// Anda mungkin perlu membuat file ini jika belum ada.
import { supabase } from './supabase-client.js';

/**
 * Fungsi utama untuk memuat statistik pengguna dan menggambar chart.
 */
async function loadUserStats() {
    // Ambil elemen-elemen penting dari halaman HTML
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
            console.warn("Pengguna belum login.");
            return;
        }

        // 2. Panggil endpoint backend Python untuk mengambil data statistik
        const response = await fetch(`https://hmmz-bot01.vercel.app/stats/${user.id}`);
        if (!response.ok) {
            throw new Error(`Gagal mengambil data dari server (Status: ${response.status})`);
        }
        const statsData = await response.json();

        // 3. Cek apakah ada data statistik yang dikembalikan
        if (!statsData || Object.keys(statsData).length === 0) {
            chartTitle.textContent = "Belum Ada Statistik";
            ctx.fillText("Kerjakan beberapa kuis untuk melihat statistik Anda di sini.", 10, 50);
            console.warn("Statistik tidak ditemukan untuk pengguna ini.");
            return;
        }

        // 4. Proses data untuk Chart.js
        const labels = Object.keys(statsData);   // -> ["Analisa", "Logika", "Memori", ...]
        const scores = Object.values(statsData); // -> [80, 95, 60, ...]
        
        // Ganti judul kembali jika sebelumnya ada pesan error
        chartTitle.textContent = "Statistik Keahlian Kritis";

        // 5. Konfigurasi dan gambar chart
        new Chart(ctx, {
            type: 'radar', // Tipe chart adalah 'radar' (pentagon/spider)
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
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: { // 'r' adalah untuk sumbu radial (nilai)
                        angleLines: { display: true },
                        suggestedMin: 0,   // Nilai minimal pada chart
                        suggestedMax: 100, // Nilai maksimal pada chart
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            backdropColor: 'rgba(255, 255, 255, 1)' // Latar belakang angka (0, 25, 50,..)
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // Menyembunyikan label "Skor Rata-rata (%)" di atas chart
                    }
                }
            }
        });

    } catch (error) {
        chartTitle.textContent = "Gagal Memuat Statistik";
        ctx.fillText("Terjadi kesalahan saat memuat chart.", 10, 50);
        console.error("Gagal menjalankan fungsi loadUserStats:", error);
    }
}

// Jalankan seluruh fungsi setelah halaman HTML selesai dimuat
document.addEventListener('DOMContentLoaded', loadUserStats);
