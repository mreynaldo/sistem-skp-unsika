let apiBaseUrl;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    apiBaseUrl = 'http://localhost:3000'; 
    console.log('Running in local environment, using local API.');
} else {
    apiBaseUrl = 'https://sistem-skp-unsika-production.up.railway.app'; 
    console.log('Running in live environment, using deployed API.');
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userJson = urlParams.get('user');
    const error = urlParams.get('error');

    if (token && userJson) {
        // 1. Ditemukan token & user di URL (Sukses Login Google)
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('skp_user', decodeURIComponent(userJson));

        // Hapus parameter dari URL agar bersih
        window.history.replaceState({}, document.title, "/login.html");
        
        showAlert('Login Google berhasil!', 'success');

        // Arahkan ke dashboard
        setTimeout(() => {
            const user = JSON.parse(decodeURIComponent(userJson));
            if (user.role === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);

    } else if (error) {
        // 2. Ditemukan error di URL (Gagal Login Google)
        if (error === 'google-auth-failed') {
            showAlert('Login Google gagal. Pastikan Anda menggunakan email Unsika.', 'error');
        } else {
            showAlert('Login Google gagal.', 'error');
        }
        // Hapus parameter dari URL agar bersih
        window.history.replaceState({}, document.title, "/login.html");
    }


    // Cek jika user sudah login
    const savedToken = localStorage.getItem('jwtToken');
    const savedUser = localStorage.getItem('skp_user');

    if (savedToken && savedUser) {
        const userData = JSON.parse(savedUser);
        // Cek role dan redirect ke dashboard yang sesuai
        if (userData.role === 'admin') {
            window.location.href = 'dashboard-admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    // Traditional login form handler
    // Traditional login form handler (DIMODIFIKASI TOTAL)
    loginForm.addEventListener('submit', async function (e) { // <-- Dibuat ASYNC
        e.preventDefault();

        // Ambil nilai input dari form
        // Catatan: Pastikan input di login.html memiliki id 'email' dan 'password'
        const emailInput = loginForm.querySelector('input[type="email"]');
        const passwordInput = loginForm.querySelector('input[type="password"]');

        const email = emailInput ? emailInput.value : ''; // Mengambil email dari input
        const password = passwordInput ? passwordInput.value : ''; // Mengambil password dari input

        // Validasi input
        if (!email || !password) { // <-- Mengganti 'username' dengan 'email'
            showAlert('Harap isi semua field!', 'error');
            return;
        }

        const studentEmailRegex = /^\d+@student\.unsika\.ac\.id$/;
        const adminEmail = 'admin@unsika.ac.id'; // Sesuai func determineUserRole

        if (!studentEmailRegex.test(email) && email !== adminEmail) {
            showAlert('Login gagal. Gunakan email Unsika untuk mengakses website ini.', 'error');
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('.btn-login');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Memproses...';
        submitBtn.disabled = true;

        const API_URL = `${apiBaseUrl}/api/auth/login`; // <-- Ganti dengan URL API Anda

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('jwtToken', data.token);
                localStorage.setItem('skp_user', JSON.stringify(data.user));

                showAlert('Login berhasil! Mengarahkan ke dashboard', 'success');

                // Logika redirect berdasarkan role
                setTimeout(() => {
                    if (data.user && data.user.role === 'admin') {
                        window.location.href = 'dashboard-admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 1500);
            } else {
                showAlert(data.message || 'Login gagal. Silakan coba lagi.', 'error');
            }

        } catch (error) {
            console.error('Network Error:', error);
            showAlert('Terjadi kesalahan koneksi ke server.', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Alert function
    function showAlert(message, type) {
        // Hapus alert sebelumnya jika ada
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Buat alert baru
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        document.body.appendChild(alert);

        // Hapus alert setelah 3 detik
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
});