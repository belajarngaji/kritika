const SUPABASE_URL = 'https://jpxtbdawajjyrvqrgijd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweHRiZGF3YWpqeXJ2cXJnaWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTI4OTgsImV4cCI6MjA3MTg4ODg5OH0.vEqCzHYBByFZEXeLIBqx6b40x6-tjSYa3Il_b2mI9NE';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

async function loadAccountData() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return; // Ditangani oleh auth-guard.js
    
    currentUser = user;
    document.getElementById('email').value = user.email;

    const { data: profile } = await _supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

    if (profile) {
        document.getElementById('username').value = profile.username || '';
        const editNameSection = document.getElementById('edit-name-section');
        
        if (profile.full_name) {
            // Jika nama sudah ada, ganti form dengan teks biasa
            editNameSection.innerHTML = `
                <div class="form-group">
                    <label>Nama Pengguna</label>
                    <input type="text" class="form-control" value="${profile.full_name}" disabled>
                </div>`;
        }
    }
}

// Event listener untuk update nama
document.getElementById('profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const newFullName = document.getElementById('fullName').value;
    if (!newFullName.trim()) return alert('Nama tidak boleh kosong.');

    const { error } = await _supabase
        .from('profiles')
        .update({ full_name: newFullName })
        .eq('id', currentUser.id);

    if (error) {
        alert('Gagal menyimpan nama: ' + error.message);
    } else {
        alert('Nama berhasil disimpan!');
        loadAccountData(); // Muat ulang untuk menyembunyikan form
    }
});

// Panggil fungsi utama saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadAccountData);
