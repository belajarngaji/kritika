const SUPABASE_URL_GUARD = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_ANON_KEY_GUARD = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

// --- TAMBAHAN BARU ---
// Atur ke 'true' saat Anda sedang coding, 
// atur ke 'false' saat di-upload ke server (production).
const devMode = true; 
// --- SELESAI ---

const { createClient } = supabase;
const _supabaseGuard = createClient(SUPABASE_URL_GUARD, SUPABASE_ANON_KEY_GUARD);

// Cek status login
_supabaseGuard.auth.onAuthStateChange((event, session) => {
    // Pengecekan hanya berjalan jika devMode adalah 'false'
    if (!session && !devMode) { 
        // Jika belum login, paksa pindah ke halaman login
        window.location.replace('/kritika/login.html'); // Ganti path jika perlu
    }
});
