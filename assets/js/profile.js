// /kritika/assets/js/profile.js

import { _supabase } from './supabase-client.js';

// Elemen-elemen HTML
const profileUsername = document.getElementById('profile-username');
const profileUserid = document.getElementById('profile-userid');
const profileAvatar = document.getElementById('profile-avatar');
const profileStats = document.getElementById('profile-stats');

const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
const avatarInput = document.getElementById('avatar-input');

// Fungsi untuk menampilkan profil "Tidak Diketahui"
function displayUnknownProfile() {
    profileUsername.textContent = 'Nama Tidak Diketahui';
    profileUserid.textContent = 'Username Tidak Diketahui';
    profileAvatar.src = 'https://api.dicebear.com/8.x/initials/svg?seed=?';
    profileStats.style.display = 'none';
    if (uploadAvatarBtn) {
        uploadAvatarBtn.style.display = 'none'; // Sembunyikan tombol unggah
    }
}

// Fungsi untuk menampilkan data profil yang ditemukan
function displayProfileData(profile) {
    profileUsername.textContent = profile.full_name || profile.username || 'Tidak Diketahui';
    profileUserid.textContent = `@${profile.username || 'tidak diketahui'}`;
    
    // Perbaikan: Gunakan Image Transformations saat menampilkan gambar
    const avatarUrl = profile.avatar_url;
    if (avatarUrl) {
      // Ubah ukuran gambar menjadi 200x200 piksel
      profileAvatar.src = `${avatarUrl}?width=200&height=200`;
    } else {
      profileAvatar.src = `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username || '?'}`;
    }
    
    profileStats.style.display = 'flex';
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
            .select('username, full_name, avatar_url')
            .eq('username', username)
            .single();

        if (profile) {
            displayProfileData(profile);
        } else {
            displayUnknownProfile();
            profileUsername.textContent = `Pengguna '${username}' Tidak Ditemukan`;
        }
    } else {
        // Skenario 2: Profil Pengguna yang Sedang Login
        if (user) {
            const { data: profile } = await _supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                displayProfileData(profile);
            }
        } else {
            displayUnknownProfile();
        }
    }

    // Tampilkan tombol unggah hanya jika pengguna sedang melihat profilnya sendiri
    if (user && !username) {
        if (uploadAvatarBtn) {
            uploadAvatarBtn.style.display = 'flex';
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

    const fileExt = file.name.split('.').pop();
    const newFilename = `${user.id}.${fileExt}`;
    const filePath = `avatars/${newFilename}`;

    // Unggah file ke bucket 'avatars'
    const { error: uploadError } = await _supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true // Ganti file jika sudah ada
        });

    if (uploadError) {
        alert('Gagal mengunggah foto: ' + uploadError.message);
        return;
    }

    // Dapatkan URL publik dari file yang diunggah
    const { data: publicUrl } = _supabase.storage.from('avatars').getPublicUrl(filePath);

    // Perbarui URL avatar di tabel 'profiles'
    const { error: updateError } = await _supabase
        .from('profiles')
        .update({ avatar_url: publicUrl.publicUrl, updated_at: new Date() })
        .eq('id', user.id);

    if (updateError) {
        alert('Gagal memperbarui URL foto profil: ' + updateError.message);
    } else {
        alert('Foto profil berhasil diperbarui!');
        await loadProfile(); // Muat ulang profil untuk menampilkan foto baru
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    
    if (uploadAvatarBtn) {
        uploadAvatarBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            uploadAvatar(file);
        });
    }
});
