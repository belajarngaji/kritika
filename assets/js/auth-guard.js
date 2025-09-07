const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Mode development sekarang otomatis. 
 * Script akan tahu jika Anda sedang di 'localhost' atau di server live.
 */
const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

document.addEventListener('DOMContentLoaded', () => {
    const protectedContent = document.getElementById('protected-content');
    const loginPrompt = document.getElementById('login-prompt');

    // Jika elemen-elemen penting tidak ditemukan, hentikan eksekusi.
    if (!protectedContent || !loginPrompt) {
        console.warn('Peringatan: Elemen #protected-content atau #login-prompt tidak ditemukan di halaman ini. Auth Guard tidak berjalan.');
        return;
    }

    _supabaseGuard.auth.onAuthStateChange((event, session) => {
        if (session) {
            // Jika pengguna login, selalu tampilkan konten utama.
            protectedContent.classList.remove('hidden');
            loginPrompt.classList.add('hidden');
        } else {
            // Jika pengguna TIDAK login...
            if (isDevMode) {
                // ...tapi kita di mode dev, tetap tampilkan konten agar mudah di-styling.
                console.log('Mode Dev Aktif: Konten ditampilkan tanpa perlu login.');
                protectedContent.classList.remove('hidden');
                loginPrompt.classList.add('hidden');
            } else {
                // ...dan kita di server live, tampilkan pesan untuk login.
                protectedContent.classList.add('hidden');
                loginPrompt.classList.remove('hidden');
            }
        }
    });
});
