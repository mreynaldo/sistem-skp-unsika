// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4wGmJdX6X6X6X6X6X6X6X6X6X6X6X6X6X6X6",
    authDomain: "unsika-skp-system.firebaseapp.com",
    projectId: "unsika-skp-system",
    storageBucket: "unsika-skp-system.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const googleLoginBtn = document.getElementById('google-login');

    // Data dummy untuk simulasi login tradisional
    const validUsers = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'mahasiswa', password: 'mhs123', role: 'mahasiswa' },
        { username: '202301001', password: 'unsika123', role: 'mahasiswa' }
    ];

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

        // Show loading state
        const submitBtn = loginForm.querySelector('.btn-login');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Memproses...';
        submitBtn.disabled = true;

        const API_URL = 'http://localhost:3000/api/auth/login'; // <-- Ganti dengan URL API Anda

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

    // Google Login handler
    googleLoginBtn.addEventListener('click', function () {
        const provider = new firebase.auth.GoogleAuthProvider();

        // Tambahkan scope tambahan jika diperlukan
        provider.addScope('email');
        provider.addScope('profile');

        // Show loading state
        const originalText = googleLoginBtn.innerHTML;
        googleLoginBtn.innerHTML = '<div class="loading-spinner"></div> Membuka Google...';
        googleLoginBtn.disabled = true;

        // Sign in dengan popup
        auth.signInWithPopup(provider)
            .then((result) => {
                // Login berhasil
                const user = result.user;
                handleGoogleLoginSuccess(user);
            })
            .catch((error) => {
                // Handle error
                console.error('Google Login Error:', error);
                handleGoogleLoginError(error);

                // Reset button state
                googleLoginBtn.innerHTML = originalText;
                googleLoginBtn.disabled = false;
            });
    });

    // Handle successful Google login
    function handleGoogleLoginSuccess(user) {
        const userData = {
            uid: user.uid,
            username: user.displayName || user.email.split('@')[0],
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: determineUserRole(user.email),
            loginTime: new Date().toISOString(),
            loginMethod: 'google',
            isEmailVerified: user.emailVerified
        };

        // Simpan ke localStorage
        localStorage.setItem('skp_user', JSON.stringify(userData));

        showAlert('Login dengan Google berhasil!', 'success');

        // Redirect ke dashboard setelah delay singkat berdasarkan role
        setTimeout(() => {
            if (userData.role === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);
    }

    // Handle Google login error
    function handleGoogleLoginError(error) {
        let errorMessage = 'Terjadi kesalahan saat login dengan Google.';

        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Login dibatalkan oleh pengguna.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Popup login diblokir oleh browser. Izinkan popup untuk situs ini.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Koneksi internet bermasalah. Periksa koneksi Anda.';
                break;
            case 'auth/unauthorized-domain':
                errorMessage = 'Domain ini tidak diizinkan untuk login Google.';
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }

        showAlert(errorMessage, 'error');
    }

    // Determine user role based on email domain
    function determineUserRole(email) {
        if (email.endsWith('@unsika.ac.id')) {
            return 'dosen';
        } else if (email.endsWith('@student.unsika.ac.id')) {
            return 'mahasiswa';
        } else if (email === 'admin@unsika.ac.id') {
            return 'admin';
        } else {
            return 'mahasiswa'; // Default role
        }
    }

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

    // Listen for auth state changes (optional, for future enhancements)
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User is signed in:', user);
        } else {
            console.log('User is signed out');
        }
    });
});