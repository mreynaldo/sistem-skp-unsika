let apiBaseUrl;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    apiBaseUrl = 'http://localhost:3000'; 
    console.log('Running in local environment, using local API.');
} else {
    apiBaseUrl = 'https://sistem-skp-unsika-production.up.railway.app'; 
    console.log('Running in live environment, using deployed API.');
}

document.addEventListener("DOMContentLoaded", () => {
  function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`; // Asumsi Anda memiliki CSS untuk .alert-success/.alert-error
    alert.textContent = message;

    // Asumsi alert diletakkan di atas form container
    const registerCard = document.querySelector('.register-card');
    if (registerCard) {
      registerCard.insertBefore(alert, registerCard.firstChild);
    } else {
      document.body.appendChild(alert);
    }

    setTimeout(() => {
      alert.remove();
    }, 3000);
  }
  // Toggle password visibility
  const toggles = document.querySelectorAll(".toggle-password");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.getAttribute("data-target");
      const input = document.getElementById(targetId);

      if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "🙈";

      } else {
        input.type = "password";
        toggle.textContent = "👁";
      }
    });
  });

  // Handle form submit (FUNGSI INI DIMODIFIKASI)
  const form = document.getElementById("register-form");
  form.addEventListener("submit", async (e) => { // <-- Dibuat ASYNC
    e.preventDefault();

    // Ambil nilai input
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 1. Validasi
    const emailRegex = /^\d+@student\.unsika\.ac\.id$/;
    if (!emailRegex.test(email)) {
      showAlert('Pendaftaran gagal. Gunakan email Unsika yang valid', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Konfirmasi password tidak cocok!', 'error');
      return;
    }
    if (!name || !email || !password) {
      showAlert('Harap isi semua field!', 'error');
      return;
    }

    if (password.length < 8) {
      showAlert('Password harus memiliki minimal 8 karakter!', 'error');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      showAlert('Password harus mengandung minimal satu huruf besar, satu huruf kecil, dan satu angka!', 'error');
      return;
    }

    // Tampilkan loading state
    const submitBtn = form.querySelector('.btn-register');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading-spinner"></div> Mendaftar...';
    submitBtn.disabled = true;

    const API_URL = '${apiBaseUrl}/api/auth/register';

    try {
      // 2. Panggilan API ke Backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 3. REGISTER BERHASIL: Simpan Token dan Data User
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('skp_user', JSON.stringify(data.user));

        // 4. Redirect ke Dashboard
        showAlert('Pendaftaran berhasil! Mengarahkan ke dashboard...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        // Pendaftaran Gagal (misalnya, Email sudah terdaftar)
        showAlert(data.message || 'Pendaftaran gagal. Silakan coba lagi.', 'error');
      }

    } catch (error) {
      // Error koneksi atau server
      console.error('Network Error:', error);
      showAlert('Terjadi kesalahan koneksi ke server.', 'error');
    } finally {
      // Reset button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
});
