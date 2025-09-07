// /kritika/assets/js/account.js (File Gabungan)

// =================================================
// KONFIGURASI SUPABASE
// =================================================
const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =================================================
// ELEMEN HTML
// =================================================
const profileForm = document.getElementById('profile-form');
const securityForm = document.getElementById('security-form');
const logoutButton = document.getElementById('logout-button');

const protectedContent = document.getElementById('protected-content');
const loginPrompt = document.getElementById('login-prompt');

// =================================================
// STATE APLIKASI
// =================================================
let currentUser = null;
const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// =================================================
// FUNGSI UTAMA
// =================================================

/**
 * Memuat data pengguna yang login dan menampilkannya di form.
 */
async function loadAccountData() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        // Jika tidak ada user, hentikan fungsi
        return;
    }

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
        const fullNameInput = document.getElementById('fullName');
        const saveButton = editNameSection.querySelector('.btn-save');

        // PERBAIKAN LOGIKA: Jangan hapus HTML, tapi atur tampilan elemen
        if (profile.full_name) {
            fullNameInput.value = profile.full_name;
            fullNameInput.disabled = true;
            if (saveButton) saveButton.style.display = 'none'; // Sembunyikan tombol
        } else {
            fullNameInput.disabled = false;
            if (saveButton) saveButton.style.display = 'block'; // Tampilkan tombol
        }
    }
}

/**
 * Menangani update nama pengguna.
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    if (!currentUser) return; // Pastikan user sudah dimuat
    const saveButton = event.target.querySelector('.btn-save');
    const originalButtonText = saveButton.textContent;
    const newFullName = document.getElementById('fullName').value;

    if (!newFullName.trim()) {
        alert('Nama Pengguna tidak boleh kosong.');
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Menyimpan...';

    try {
        const { error } = await _supabase
            .from('profiles')
            .update({ full_name: newFullName, updated_at: new Date() })
            .eq('id', currentUser.id);

        if (error) throw error;

        alert('Nama berhasil disimpan!');
        await loadAccountData(); // Muat ulang data setelah disimpan
    } catch (error) {
        alert('Gagal memperbarui nama: ' + error.message);
    } finally {
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

    if (newPassword.length < 6) {
        alert('Kata sandi minimal 6 karakter.');
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Mengubah...';

    try {
        const { error } = await _supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        alert('Kata sandi berhasil diubah!');
        event.target.reset(); // Reset form setelah sukses
    } catch (error) {
        alert('Gagal mengubah kata sandi: ' + error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
}

/**
 * Menangani proses logout.
 */
async function handleLogout() {
    if (!logoutButton) return;
    logoutButton.disabled = true;
    logoutButton.textContent = 'Keluar...';
    await _supabase.auth.signOut();
    // authStateChange akan mengalihkan halaman
}

// =================================================
// AUTENTIKASI DAN TAMPILAN
// =================================================
_supabase.auth.onAuthStateChange((event, session) => {
    if (!protectedContent || !loginPrompt) {
        console.warn('Peringatan: Elemen otentikasi tidak ditemukan.');
        return;
    }
    
    if (session) {
        protectedContent.classList.remove('hidden');
        loginPrompt.classList.add('hidden');
        loadAccountData(); // Muat data setelah user terautentikasi
    } else {
        if (isDevMode) {
            console.log('Mode Dev Aktif: Konten ditampilkan tanpa login.');
            protectedContent.classList.remove('hidden');
            loginPrompt.classList.add('hidden');
            loadAccountData(); // Untuk pengujian di mode dev
        } else {
            protectedContent.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
        }
    }
});

// =================================================
// EVENT LISTENERS
// =================================================
document.addEventListener('DOMContentLoaded', () => {
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    if (securityForm) securityForm.addEventListener('submit', handlePasswordUpdate);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
});
