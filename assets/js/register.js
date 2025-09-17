// --- assets/js/register.js ---

import { supabase } from './supabase-client.js';

// =================================================
// ELEMEN DOM
// =================================================
const form = document.getElementById('register-form');
const fullNameInput = document.getElementById('full-name');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const submitButton = document.getElementById('submit-button');

const messageBox = document.getElementById('message-box');
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');

const togglePassword = document.getElementById('toggle-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');

// =================================================
// FUNGSI BANTU (HELPERS)
// =================================================

// Fungsi untuk menampilkan notifikasi
function showMessage(title, text) {
  messageTitle.textContent = title;
  messageText.textContent = text;
  messageBox.style.display = 'block';
  messageBox.querySelector('button').onclick = () => {
    messageBox.style.display = 'none';
  };
}

// Fungsi untuk fitur lihat/sembunyikan password
function setupPasswordToggle(toggleElement, passwordElement) {
  if (toggleElement) {
    toggleElement.addEventListener('click', () => {
      // Ganti tipe input
      const type = passwordElement.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordElement.setAttribute('type', type);
      // Ganti ikon mata
      toggleElement.classList.toggle('fa-eye');
      toggleElement.classList.toggle('fa-eye-slash');
    });
  }
}

// =================================================
// LOGIKA UTAMA
// =================================================

// Aktifkan fitur lihat/sembunyikan password
setupPasswordToggle(togglePassword, passwordInput);
setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);

// Event listener untuk form pendaftaran
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = 'Memproses...';

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Buat email unik dari username (fitur otomatis tetap ada)
    const email = `${username.toLowerCase().replace(/\s+/g, '')}@belajarngaji.user`;

    // Validasi Sisi Klien
    if (!fullName || !username) {
      showMessage('Pendaftaran Gagal', 'Nama Lengkap dan Nama Pengguna tidak boleh kosong.');
    } else if (password.length < 6) {
      showMessage('Pendaftaran Gagal', 'Password minimal harus 6 karakter.');
    } else if (password !== confirmPassword) {
      showMessage('Pendaftaran Gagal', 'Konfirmasi password tidak cocok.');
    } else {
      // Proses Pendaftaran ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        console.error('Error saat mendaftar:', error.message);
        const errorMessage = error.message.includes("User already registered") 
          ? 'Nama pengguna ini sudah terdaftar. Silakan pilih yang lain.'
          : 'Terjadi kesalahan saat pendaftaran.';
        showMessage('Pendaftaran Gagal', errorMessage);
      } else if (data.user) {
        // Pendaftaran Auth berhasil, sekarang UPDATE profil dengan `full_name`.
        // Trigger di database akan menangani `id`, `email`, dan `username`.
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error saat update nama lengkap:', updateError.message);
          showMessage('Pendaftaran Berhasil', 'Akun Anda dibuat, namun gagal menyimpan Nama Lengkap.');
        } else {
          showMessage('Pendaftaran Berhasil!', 'Akun Anda berhasil dibuat. Anda akan dialihkan...');
          setTimeout(() => {
            window.location.href = '../masuk/'; // Ganti jika path login Anda berbeda
          }, 2000);
        }
      }
    }

    // Aktifkan kembali tombol jika terjadi kesalahan
    if (submitButton.disabled) {
      submitButton.disabled = false;
      submitButton.textContent = 'Daftar';
    }
  });
}