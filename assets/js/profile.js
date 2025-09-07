// Konfigurasi koneksi ke Supabase
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co'; // Ganti dengan URL proyek Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE'; // Ganti dengan Kunci Anon Supabase Anda

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fungsi utama untuk memuat data profil pengguna yang sedang login
async function loadProfileData() {
  // 1. Ambil data sesi pengguna saat ini
  const { data: { user }, error: userError } = await _supabase.auth.getUser();

  // Jika tidak ada pengguna yang login, paksa ke halaman login
  if (userError || !user) {
    console.log('Pengguna belum login, mengalihkan ke halaman login...');
    window.location.replace('/kritika/login.html'); // Sesuaikan path jika perlu
    return;
  }

  // 2. Ambil data dari tabel 'profiles' berdasarkan ID pengguna
  const { data: profile, error: profileError } = await _supabase
    .from('profiles')
    .select('username, avatar_url') // Ambil kolom yang diminta
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Gagal mengambil profil:', profileError);
    return;
  }

  // 3. Tampilkan data ke elemen HTML menggunakan ID
  if (profile) {
    // Tampilkan username, jika tidak ada, tampilkan pesan
    document.getElementById('profile-username').textContent = profile.username || 'Username belum diatur';
    
    // Tampilkan avatar, jika tidak ada, gunakan avatar default
    document.getElementById('profile-avatar').src = profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username || '?'}`;
    
    // Tampilkan 8 karakter pertama dari ID pengguna
    document.getElementById('profile-userid').textContent = `ID: ${user.id.substring(0, 8)}...`;
  }
}

// Jalankan fungsi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  loadProfileData();
});
