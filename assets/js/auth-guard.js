const SUPABASE_URL_GUARD = 'URL_PROYEK_ANDA';
const SUPABASE_ANON_KEY_GUARD = 'KUNCI_ANON_ANDA';

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
