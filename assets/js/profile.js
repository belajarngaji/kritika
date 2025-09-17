// /kritika/assets/js/profile.js

import { supabase } from './supabase-client.js';

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

let currentProfile = null;

// Fungsi untuk menampilkan profil "Tidak Diketahui"
function displayUnknownProfile() {
    profileUsername.textContent = 'Nama Tidak Diketahui';
    profileUserid.textContent = 'Username Tidak Diketahui';
    profileAvatar.src = 'https://api.dicebear.com/8.x/initials/svg?seed=?';
    profileStats.style.display = 'none';
}

// === Fungsi Load Stats User ===
async function loadProfileStats(userId) {
    const { data, error } = await supabase
        .from('kritika_attempts')
        .select('score, is_correct, category')
        .eq('user_id', userId);

    if (error) {
        console.error('Gagal load stats:', error.message);
        return;
    }

    let totalScore = 0;
    let completed = 0;
    let categoryCount = {};

    data.forEach(row => {
        totalScore += row.score || 0;
        completed++;
        if (row.category) {
            categoryCount[row.category] = (categoryCount[row.category] || 0) + 1;
        }
    });

    // Materi favorit
    let favorite = '-';
    if (Object.keys(categoryCount).length > 0) {
        favorite = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Level dan Badge
    const level = Math.floor(totalScore / 100) + 1;
    const xpProgress = totalScore % 100;
    const badge = level >= 5 ? 'Master' : level >= 3 ? 'Intermediate' : 'Beginner';

    // Update HTML
    document.getElementById('stats-score').textContent = totalScore;
    document.getElementById('stats-completed').textContent = completed;
    document.getElementById('stats-favorite').textContent = favorite;
    document.getElementById('profile-level').textContent = `LV. ${level}`;
    document.getElementById('profile-badge').textContent = badge;

    // Progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${xpProgress}%`;
    }
}

// Fungsi untuk menampilkan data profil yang ditemukan
function displayProfileData(profile, user) {
    currentProfile = profile;
    profileUsername.textContent = profile.full_name || profile.username || 'Tidak Diketahui';
    profileUserid.textContent = `@${profile.username || 'tidak diketahui'}`;

    const avatarUrl = profile.avatar_url;
    profileAvatar.src = avatarUrl
        ? `${avatarUrl}?width=200&height=200`
        : `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username || '?'}`;

    profileStats.style.display = 'flex';

    if (user && user.id === profile.id) {
        profileAvatar.style.cursor = 'pointer';
    } else {
        profileAvatar.style.cursor = 'default';
    }

    // 🚀 Panggil load stats
    loadProfileStats(profile.id);
}

// Fungsi utama untuk memuat profil
async function loadProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const { data: { user } } = await supabase.auth.getUser();

    if (username) {
        const { data: profile } = await supabase
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
        if (user) {
            const { data: profile } = await supabase
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
 * Mengunggah file avatar ke Supabase Storage dengan kompresi.
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

async function handleUpload(compressedFile) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Anda harus login untuk mengunggah foto profil.');
        return;
    }

    const fileExt = compressedFile.name.split('.').pop();
    const newFilename = `${user.id}.${fileExt}`;
    const filePath = `avatars/${newFilename}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true });

    if (uploadError) {
        alert('Gagal mengunggah foto: ' + uploadError.message);
        return;
    }

    const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase
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
            const { data: { user } } = await supabase.auth.getUser();

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