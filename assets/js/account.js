const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel global untuk menyimpan data pengguna saat ini
let currentUser = null;

/**
 * Fungsi untuk memuat data pengguna ke dalam form di halaman akun.
 */
async function loadAccountData() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return; // auth-guard.js sudah menangani pengalihan

    currentUser = user;
    document.getElementById('email').value = user.email;

    // Ambil data dari tabel profiles
    const { data: profile, error } = await _supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error mengambil profil:', error);
        return;
    }
    
    if (profile) {
        document.getElementById('username').value = profile.username || 'Belum diatur';
        const editNameSection = document.getElementById('edit-name-section');
        
        // Logika untuk menampilkan atau menyembunyikan form ubah nama
        if (profile.full_name) {
            editNameSection.innerHTML = `
                <div class="form-group">
                    <label>Nama Pengguna</label>
                    <input type="text" class="form-control" value="${profile.full_name}" disabled>
                </div>`;
        }
    }
}

/**
 * Fungsi untuk menangani pembaruan nama pengguna.
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    const newFullName = document.getElementById('fullName').value;
    if (!newFullName.trim()) return alert('Nama Pengguna tidak boleh kosong.');

    const { error } = await _supabase
        .from('profiles')
        .update({ full_name: newFullName, updated_at: new Date() })
        .eq('id', currentUser.id);

    if (error) {
        alert('Gagal memperbarui nama: ' + error.message);
    } else {
        alert('Nama berhasil disimpan!');
        loadAccountData(); // Muat ulang data untuk menyembunyikan form
    }
}

/**
 * Fungsi untuk menangani pembaruan kata sandi.
 */
async function handlePasswordUpdate(event) {
    event.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    if (!newPassword) return alert('Kata sandi baru tidak boleh kosong.');
    if (newPassword.length < 6) return alert('Kata sandi minimal 6 karakter.');

    const { error } = await _supabase.auth.updateUser({ password: newPassword });
    if (error) {
        alert('Gagal mengubah kata sandi: ' + error.message);
    } else {
        alert('Kata sandi berhasil diubah!');
        event.target.reset(); // Mengosongkan form
    }
}

/**
 * Fungsi untuk menangani logout.
 */
async function handleLogout() {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error('Error saat logout:', error);
    }
    // Tidak perlu redirect di sini karena auth-guard akan otomatis menangani
}

// Menambahkan semua event listener saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadAccountData();
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('security-form').addEventListener('submit', handlePasswordUpdate);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
});
