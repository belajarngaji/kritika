// /kritika/assets/js/profile.js

import { _supabase } from './supabase-client.js';

// Elemen-elemen HTML
const profileUsername = document.getElementById('profile-username');
const profileUserid = document.getElementById('profile-userid');
const profileAvatar = document.getElementById('profile-avatar');
const profileStats = document.getElementById('profile-stats');

const statsScore = document.getElementById('stats-score'); // ← baru ditambahkan

const avatarInput = document.getElementById('avatar-input');
const avatarModal = document.getElementById('avatar-modal');
const modalImage = document.getElementById('modal-image');
const modalClose = document.querySelector('.modal-close');
const modalUploadBtn = document.getElementById('modal-upload-btn');

let currentProfile = null;

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

    const avatarUrl = profile.avatar_url;
    if (avatarUrl) {
      profileAvatar.src = `${avatarUrl}?width=200&height=200`;
    } else {
      profileAvatar.src = `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username || '?'}`;
    }

    profileStats.style.display = 'flex';

    if (user && user.id === profile.id) {
        profileAvatar.style.cursor = 'pointer';
    } else {
        profileAvatar.style.cursor = 'default';
    }
}

// Fungsi untuk menghitung Total Skor dari tabel kritika_attempts
async function loadTotalScore(userId) {
    try {
        const { data, error } = await _supabase
            .from('kritika_attempts')
            .select('nilai')
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Error fetch total score:', error);
            return;
        }

        const totalScore = data?.reduce((sum, row) => sum + (row.nilai || 0), 0) || 0;

        if (statsScore) statsScore.textContent = totalScore;
    } catch (err) {
        console.error('❌ Exception load total score:', err);
    }
}

// Fungsi utama untuk memuat profil
async function loadProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const { data: { user } } = await _supabase.auth.getUser();

    if (username) {
        const { data: profile } = await _supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('username', username)
            .single();

        if (profile) {
            displayProfileData(profile, user);
            await loadTotalScore(profile.id); // ← panggil total skor
        } else {
            displayUnknownProfile();
            profileUsername.textContent = `Pengguna '${username}' Tidak Ditemukan`;
        }
    } else {
        if (user) {
            const { data: profile } = await _supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                displayProfileData(profile, user);
                await loadTotalScore(profile.id); // ← panggil total skor
            }
        } else {
            displayUnknownProfile();
        }
    }
}

/**
 * Mengunggah file avatar ke Supabase Storage dengan kompresi.
 * @param {File} file - File gambar yang akan diunggah.
 */
function uploadAvatar(file) {
    if (!file) return;

    avatarModal.style.display = 'none';

    new Compressor(file, {
        width: 100,
        height: 100,
        quality: 0.8,
        success(result) {
            handleUpload(result);
        },
        error(err) {
            alert('Gagal mengompres gambar: ' + err.message);
        },
    });
}

/**
 * Menangani proses unggah ke Supabase setelah kompresi.
 * @param {File} compressedFile - File yang sudah dikompresi.
 */
async function handleUpload(compressedFile) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        alert('Anda harus login untuk mengunggah foto profil.');
        return;
    }

    const fileExt = compressedFile.name.split('.').pop();
    const newFilename = `${user.id}.${fileExt}`;
    const filePath = `avatars/${newFilename}`;

    const { error: uploadError } = await _supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true });

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
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    if (profileAvatar) {
        profileAvatar.addEventListener('click', async () => {
            const { data: { user } } = await _supabase.auth.getUser();

            if (user && currentProfile && user.id === currentProfile.id) {
                avatarModal.style.display = 'flex';
                modalImage.src = profileAvatar.src.replace(/\?.*$/, '');
                modalUploadBtn.style.display = 'block';
            } else if (profileAvatar.src && profileAvatar.src.includes('http')) {
                avatarModal.style.display = 'flex';
                modalImage.src = profileAvatar.src.replace(/\?.*$/, '');
                modalUploadBtn.style.display = 'none';
            }
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            avatarModal.style.display = 'none';
        });
    }

    if (modalUploadBtn) {
        modalUploadBtn.addEventListener('click', () => {
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