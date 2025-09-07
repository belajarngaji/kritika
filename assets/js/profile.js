// /kritika/assets/js/profile.js

import { _supabase } from './supabase-client.js';

// Elemen-elemen HTML
const profileUsername = document.getElementById('profile-username');
const profileUserid = document.getElementById('profile-userid');
const profileAvatar = document.getElementById('profile-avatar');
const profileStats = document.getElementById('profile-stats');

const avatarInput = document.getElementById('avatar-input');
const avatarModal = document.getElementById('avatar-modal');
const modalImage = document.getElementById('modal-image');
const modalClose = document.querySelector('.modal-close');
const modalUploadBtn = document.getElementById('modal-upload-btn');

let currentProfile = null; // Tambahkan variabel untuk menyimpan data profil

// Fungsi untuk menampilkan profil "Tidak Diketahui"
function displayUnknownProfile() {
    profileUsername.textContent = 'Nama Tidak Diketahui';
    profileUserid.textContent = 'Username Tidak Diketahui';
    profileAvatar.src = 'https://api.dicebear.com/8.x/initials/svg?seed=?';
    profileStats.style.display = 'none';
}

// Fungsi untuk menampilkan data profil yang ditemukan
function displayProfileData(profile, user) {
    currentProfile = profile;
    profileUsername.textContent = profile.full_name || profile.username || 'Tidak Diketahui';
    profileUserid.textContent = `@${profile.username || 'tidak diketahui'}`;
    
    // Gunakan Image Transformations saat menampilkan gambar
    const avatarUrl = profile.avatar_url;
    if (avatarUrl) {
      profileAvatar.src = `${avatarUrl}?width=200&height=200`;
    } else {
      profileAvatar.src = `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username || '?'}`;
    }
    
    profileStats.style.display = 'flex';
    
    // Tampilkan/Sembunyikan fitur interaksi berdasarkan kepemilikan profil
    if (user && user.id === profile.id) {
        profileAvatar.style.cursor = 'pointer'; // Menandakan bisa diklik
    } else {
        profileAvatar.style.cursor = 'default';
    }
}

// Fungsi utama untuk memuat profil
async function loadProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const { data: { user } } = await _supabase.auth.getUser();

    // Skenario 1: Profil Publik (username di URL)
    if (username) {
        const { data: profile } = await _supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('username', username)
            .single();

        if (profile) {
            displayProfileData(profile, user);
        } else {
            displayUnknownProfile();
            profileUsername.textContent = `Pengguna '${username}' Tidak Ditemukan`;
        }
    } else {
        // Skenario 2: Profil Pengguna yang Sedang Login
        if (user) {
            const { data: profile } = await _supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                displayProfileData(profile, user);
            }
        } else {
            displayUnknownProfile();
        }
    }
}

/**
 * Mengunggah file avatar ke Supabase Storage.
 * @param {File} file - File gambar yang akan diunggah.
 */
async function uploadAvatar(file) {
    if (!file) return;

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        alert('Anda harus login untuk mengunggah foto profil.');
        return;
    }
    
    // Sembunyikan modal saat upload
    avatarModal.style.display = 'none';

    // Logika unggah yang sama seperti sebelumnya
    const fileExt = file.name.split('.').pop();
    const newFilename = `${user.id}.${fileExt}`;
    const filePath = `avatars/${newFilename}`;

    const { error: uploadError } = await _supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true
        });

    if (uploadError) {
        alert('Gagal mengunggah foto: ' + uploadError.message);
        return;
    }

    const { data: publicUrl } = _supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await _supabase
        .from('profiles')
        .update({ avatar_url: publicUrl.publicUrl, updated_at: new Date() })
        .eq('id', user.id);

    if (updateError) {
        alert('Gagal memperbarui URL foto profil: ' + updateError.message);
    } else {
        alert('Foto profil berhasil diperbarui!');
        await loadProfile();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadProfile);

// Menangani klik pada foto profil
if (profileAvatar) {
    profileAvatar.addEventListener('click', async () => {
        const { data: { user } } = await _supabase.auth.getUser();
        
        // Tampilkan modal hanya jika user login dan melihat profilnya sendiri
        if (user && currentProfile && user.id === currentProfile.id) {
            avatarModal.style.display = 'flex';
            modalImage.src = profileAvatar.src.replace(`?width=200&height=200`, ''); // Tampilkan gambar asli (tanpa transformasi)
        } else {
            // Jika user lain, langsung zoom gambar saja
            avatarModal.style.display = 'flex';
            modalImage.src = profileAvatar.src.replace(`?width=200&height=200`, '');
            modalUploadBtn.style.display = 'none'; // Sembunyikan tombol upload
        }
    });
}

// Menangani klik tombol tutup modal
if (modalClose) {
    modalClose.addEventListener('click', () => {
        avatarModal.style.display = 'none';
    });
}

// Menangani klik tombol unggah di dalam modal
if (modalUploadBtn) {
    modalUploadBtn.addEventListener('click', () => {
        avatarInput.click();
    });
}

// Menangani pemilihan file dari input
if (avatarInput) {
    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        uploadAvatar(file);
    });
}
