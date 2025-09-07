// =================================================
// KONFIGURASI SUPABASE
// =================================================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg8ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================================================
// ELEMEN HTML
// =================================================
const profileForm = document.getElementById('profile-form');
const securityForm = document.getElementById('security-form');
const logoutButton = document.getElementById('logout-button');

// =================================================
// STATE APLIKASI
// =================================================
let currentUser = null;

// =================================================
// FUNGSI UTAMA
// =================================================

/**
 * Memuat data pengguna yang login dan menampilkannya di form.
 */
async function loadAccountData() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    currentUser = user;
    document.getElementById('email').value = user.email;

    const { data: profile, error } = await _supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error mengambil profil:', error.message);
        return;
    }
    
    if (profile) {
        document.getElementById('username').value = profile.username || 'Belum diatur';
        const editNameSection = document.getElementById('edit-name-section');
        
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
 * Menangani update nama pengguna.
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    const saveButton = event.target.querySelector('.btn-save');
    const originalButtonText = saveButton.textContent;
    const newFullName = document.getElementById('fullName').value;

    if (!newFullName.trim()) return alert('Nama Pengguna tidak boleh kosong.');

    saveButton.disabled = true;
    saveButton.textContent = 'Menyimpan...';

    try {
        const { error } = await _supabase
            .from('profiles')
            .update({ full_name: newFullName, updated_at: new Date() })
            .eq('id', currentUser.id);

        if (error) throw error;

        alert('Nama berhasil disimpan!');
        loadAccountData();
    } catch (error) {
        alert('Gagal memperbarui nama: ' + error.message);
    } finally {
        // Bagian ini akan selalu berjalan, baik berhasil maupun gagal
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
}

/**
 * Menangani update kata sandi.
 */
async function handlePasswordUpdate(event) {
    event.preventDefault();
    const saveButton = event.target.querySelector('.btn-save');
    const originalButtonText = saveButton.textContent;
    const newPassword = document.getElementById('newPassword').value;

    if (newPassword.length < 6) return alert('Kata sandi minimal 6 karakter.');
    
    saveButton.disabled = true;
    saveButton.textContent = 'Mengubah...';

    try {
        const { error } = await _supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        alert('Kata sandi berhasil diubah!');
        event.target.reset();
    } catch (error) {
        alert('Gagal mengubah kata sandi: ' + error.message);
    } finally {
        // Bagian ini akan selalu berjalan
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
}

/**
 * Menangani proses logout.
 */
async function handleLogout() {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Keluar...';
    await _supabase.auth.signOut();
    // auth-guard.js akan otomatis mengalihkan
}

// =================================================
// EVENT LISTENERS
// =================================================
document.addEventListener('DOMContentLoaded', () => {
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    if (securityForm) securityForm.addEventListener('submit', handlePasswordUpdate);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    
    loadAccountData();
});
