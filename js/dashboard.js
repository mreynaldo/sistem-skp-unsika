let fullHistory = [];
let allSkpPointsMaster = [];

document.addEventListener('DOMContentLoaded', function () {
    const jwtToken = localStorage.getItem('jwtToken');
    const userData = JSON.parse(localStorage.getItem('skp_user'));

    if (!jwtToken || !userData) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('skp_user');
        window.location.href = 'login.html';
        return;
    }
    if (userData.role === 'admin') {
        window.location.href = 'dashboard-admin.html';
        return;
    }

    initializeDashboard(userData);
    initializeNavigation();
    populateProfileSection(userData);
    initializeSubmissionForm();
    initializeSubmissionHandler();
    initializeHistoryFilter();
    initializeProfileFormHandler();
    initializeProfileModeToggle();
    initializeNotificationBell();
    initializePrintReportButton();
    initializeAccountActions();
    initializePasswordToggles();
    initializeLogout(jwtToken);
});

function initializeDashboard(userData) {
    document.getElementById('user-name').textContent = userData.name;
    loadDashboardData();
}

async function loadDashboardData() {
    const token = localStorage.getItem('jwtToken');
    const userData = JSON.parse(localStorage.getItem('skp_user'));
    if (!token || !userData) {
        console.error("Token atau data pengguna tidak ditemukan.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/submissions/my-submissions', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Gagal mengambil data riwayat dari server.');
        }

        const historyFromDB = await response.json();
        fullHistory = historyFromDB;

        const verifiedPoints = historyFromDB
            .filter(entry => entry.status && entry.status.toLowerCase() === 'approved')
            .reduce((sum, entry) => sum + Number(entry.poin_saat_pengajuan), 0);

        // Update semua bagian UI dengan data terbaru
        updateStatCards(verifiedPoints, historyFromDB);
        updateOverviewDetails(historyFromDB, verifiedPoints, userData);
        updateHistoryCardCounts();
        populateHistoryList('all');
        populateNotifications();

    } catch (error) {
        console.error("Error saat memuat data dashboard:", error);
    }
}

function updateStatCards(verifiedPoints, history) {
    const pendingPoints = history
        .filter(entry => entry.status && entry.status.toLowerCase() === 'pending')
        .reduce((sum, entry) => sum + Number(entry.poin_saat_pengajuan), 0);

    const totalSubmittedPoints = verifiedPoints + pendingPoints;

    const totalEl = document.getElementById('total-submitted-points');
    const pendingEl = document.getElementById('pending-points');
    const verifiedEl = document.getElementById('verified-points');

    if (totalEl) totalEl.textContent = totalSubmittedPoints;
    if (pendingEl) pendingEl.textContent = pendingPoints;
    if (verifiedEl) verifiedEl.textContent = verifiedPoints;
}


function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links and sections
            navLinks.forEach(nav => nav.parentElement.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));

            // Add active class to clicked link
            this.parentElement.classList.add('active');

            // Show corresponding section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');

                // Update page title
                updatePageTitle(this.querySelector('.nav-text').textContent);
            }
        });
    });
}

function updatePageTitle(title) {
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-subtitle').textContent = `Dashboard ${title} - Sistem SKP Unsika`;
}

// function initializeCalculator() {
//     const form = document.getElementById('dashboard-skp-form');
//     const resultSection = document.getElementById('dashboard-result');

//     if (form) {
//         form.addEventListener('submit', function (e) {
//             e.preventDefault();

//             const activityType = document.getElementById('dashboard-activity-type').value;
//             const activityLevel = document.getElementById('dashboard-activity-level').value;
//             const role = document.getElementById('dashboard-role').value;
//             const duration = parseInt(document.getElementById('dashboard-duration').value);

//             if (!activityType || !activityLevel || !role || !duration) {
//                 alert('Harap lengkapi semua field!');
//                 return;
//             }

//             const points = calculateSKPPoints(activityType, activityLevel, role, duration);

//             document.getElementById('dashboard-total-points').textContent = points;
//             document.getElementById('dashboard-result-description').textContent =
//                 generateResultDescription(activityType, activityLevel, role, duration, points);

//             resultSection.style.display = 'block';

//             // Scroll to result
//             resultSection.scrollIntoView({ behavior: 'smooth' });

//             // Simpan ke riwayat
//             saveToHistory(activityType, activityLevel, role, duration, points);
//         });
//     }
// }

function calculateSKPPoints(type, level, role, duration) {
    let basePoints = 0;

    switch (type) {
        case 'akademik': basePoints = 5; break;
        case 'organisasi': basePoints = 4; break;
        case 'penelitian': basePoints = 6; break;
        case 'pengabdian': basePoints = 7; break;
        case 'prestasi': basePoints = 8; break;
    }

    let levelMultiplier = 1;
    switch (level) {
        case 'internal': levelMultiplier = 1; break;
        case 'lokal': levelMultiplier = 1.5; break;
        case 'nasional': levelMultiplier = 2; break;
        case 'internasional': levelMultiplier = 3; break;
    }

    let roleMultiplier = 1;
    switch (role) {
        case 'peserta': roleMultiplier = 1; break;
        case 'panitia': roleMultiplier = 1.5; break;
        case 'pembicara': roleMultiplier = 2; break;
        case 'ketua': roleMultiplier = 2.5; break;
    }

    let totalPoints = basePoints * levelMultiplier * roleMultiplier;
    let durationBonus = Math.min(duration * 0.1, totalPoints * 0.5);
    totalPoints += durationBonus;

    return Math.round(totalPoints);
}

function generateResultDescription(type, level, role, duration, points) {
    const typeText = {
        'akademik': 'Kegiatan Akademik',
        'organisasi': 'Kegiatan Organisasi',
        'penelitian': 'Kegiatan Penelitian',
        'pengabdian': 'Kegiatan Pengabdian Masyarakat',
        'prestasi': 'Prestasi'
    };

    const levelText = {
        'internal': 'Tingkat Internal Kampus',
        'lokal': 'Tingkat Lokal/Wilayah',
        'nasional': 'Tingkat Nasional',
        'internasional': 'Tingkat Internasional'
    };

    const roleText = {
        'peserta': 'sebagai Peserta',
        'panitia': 'sebagai Panitia',
        'pembicara': 'sebagai Pembicara/Pemateri',
        'ketua': 'sebagai Ketua Panitia'
    };

    return `Anda mengikuti ${typeText[type]} ${levelText[level]} ${roleText[role]} selama ${duration} jam. Total poin SKP yang Anda peroleh adalah ${points} poin.`;
}

function saveToHistory(type, level, role, duration, points) {
    const history = JSON.parse(localStorage.getItem('skp_history')) || [];

    const newEntry = {
        id: Date.now(),
        type: type,
        level: level,
        role: role,
        duration: duration,
        points: points,
        date: new Date().toISOString(),
        status: 'pending'
    };

    history.unshift(newEntry);
    localStorage.setItem('skp_history', JSON.stringify(history));
}

function updateProgressCircle(points) {
    const progress = Math.min(points, 100);
    const circle = document.querySelector('.circle-progress');
    if (circle) {
        circle.style.background = `conic-gradient(var(--maroon-primary) ${progress}%, var(--light-bg) 0)`;
        circle.querySelector('.progress-value').textContent = `${progress}%`;
    }
}

function loadUserProfile(userData) {
    // Data dummy profil
    const profileData = {
        name: userData.role === 'admin' ? 'Administrator' : 'Mahasiswa Unsika',
        nim: userData.role === 'admin' ? 'ADMIN001' : '202301001',
        faculty: 'Fakultas Ilmu Komputer',
        email: userData.username + '@unsika.ac.id',
        major: 'Teknik Informatika',
        year: '2023',
        totalPoints: 65
    };

    document.getElementById('profile-name').textContent = profileData.name;
    document.getElementById('profile-nim').textContent = `NIM: ${profileData.nim}`;
    document.getElementById('profile-faculty').textContent = `Fakultas: ${profileData.faculty}`;
    document.getElementById('profile-email').textContent = profileData.email;
    document.getElementById('profile-major').textContent = profileData.major;
    document.getElementById('profile-year').textContent = profileData.year;
    document.getElementById('profile-total-points').textContent = `${profileData.totalPoints} poin`;
}

function initializeLogout(jwtToken) {
    // Mencari tombol dengan ID yang baru ditambahkan
    const logoutBtn = document.getElementById('logout-btn');
    // Pengecekan penting jika elemen tidak ditemukan
    if (!logoutBtn) {
        console.error("Error: Tombol Logout dengan ID 'logout-btn' tidak ditemukan.");
        return;
    }

    logoutBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Mencegah link navigasi default jika tombol adalah <a>
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            // Panggil fungsi handleLogout
            handleLogout(jwtToken);
        }
    });
}

async function handleLogout(token) {
    const API_URL_LOGOUT = 'http://localhost:3000/api/auth/logout';

    try {
        const response = await fetch(API_URL_LOGOUT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Kirim token untuk dibatalkan di server
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // Opsional: tampilkan pesan sukses dari server
            console.log('Token revoked on server.');
        } else {
            // Jika token sudah expired, server mungkin menolak, tetapi kita tetap harus menghapus di klien
            console.warn('Server logout failed or token already expired/revoked.');
        }

    } catch (error) {
        console.error('Network or Server Error during logout API call:', error);
    } finally {
        // Hapus token dan data user (WAJIB DILAKUKAN OLEH KLIEN)
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('skp_user');

        // Redirect
        window.location.href = 'login.html';
    }
}

function updateOverviewDetails(history, verifiedPoints, userData) {
    const recentList = document.getElementById('recent-submissions-list');

    // --- 1. Mengisi 5 Ajuan Terbaru ---
    if (recentList) {
        recentList.innerHTML = ''; // Kosongkan
        const recentSubmissions = history.slice(-4).reverse(); // Ambil 5 item pertama (terbaru)

        if (recentSubmissions.length === 0) {
            recentList.innerHTML = '<p>Belum ada pengajuan.</p>';
        } else {
            recentSubmissions.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'submission-item';
                item.innerHTML = `
                    <div class="submission-info">
                        <p>${entry.deskripsi_kegiatan}</p>
                        <small>${new Date(entry.created_at).toLocaleDateString('id-ID')}</small>
                    </div>
                    <div class="submission-status">
                        <div class="points">${entry.poin_saat_pengajuan} Poin</div>
                        <span class="status-badge status-${entry.status}">${entry.status}</span>
                    </div>
                `;
                recentList.appendChild(item);
            });
        }
    }

    const progressContainer = document.getElementById('progress-card-content');
    const printBtn = document.getElementById('print-report-btn');

    if (!progressContainer) return;

    if (userData.jenjang_pendidikan) {
        // JIKA SUDAH DIISI: Tampilkan Progress Bar
        const targetPoin = userData.jenjang_pendidikan === 'Sarjana' ? 250 : 200;
        const percentage = Math.min((verifiedPoints / targetPoin) * 100, 100);

        progressContainer.innerHTML = `
            <div class="progress-circle-container">
                <div id="progress-circle" class="progress-circle">
                    <div class="progress-value">
                        <span id="progress-percentage-text">0%</span>
                    </div>
                </div>
                <p class="progress-label" id="progress-points-label">0 / ${targetPoin} Poin</p>
            </div>
            <p class="progress-info" id="progress-info-text">Memuat progress...</p>
        `;

        updateCircularProgress(verifiedPoints, targetPoin, percentage);

        if (percentage >= 100) {
            printBtn.style.display = 'block';
        } else {
            printBtn.style.display = 'none';
        }

    } else {
        progressContainer.innerHTML = `
            <div class="complete-profile-prompt">
                <h4>Lengkapi Profil Anda</h4>
                <p>Harap lengkapi jenjang pendidikan Anda di halaman profil untuk melihat progress SKP.</p>
                <button id="go-to-profile-btn" class="btn btn-primary">Buka Profil</button>
            </div>
        `;
        document.getElementById('go-to-profile-btn').addEventListener('click', () => {
            document.querySelector('a[href="#profile"]').click();
        });
        printBtn.style.display = 'none';
    }
}

function updateCircularProgress(verifiedPoints, targetPoin, percentage) {
    const progressCircle = document.getElementById('progress-circle');
    const percentageText = document.getElementById('progress-percentage-text');
    const pointsLabel = document.getElementById('progress-points-label');
    const progressInfoText = document.getElementById('progress-info-text');

    const degrees = (percentage / 100) * 360;

    percentageText.textContent = `${Math.round(percentage)}%`;
    pointsLabel.textContent = `${verifiedPoints} / ${targetPoin} Poin`;

    if (percentage >= 100) {
        progressCircle.classList.add('is-complete');
        progressCircle.style.background = '';
        progressInfoText.textContent = 'Selamat! Anda telah memenuhi target minimum poin SKP.';
    } else {
        progressCircle.classList.remove('is-complete');
        progressCircle.style.background = `conic-gradient(var(--maroon-primary) ${degrees}deg, var(--light-bg) ${degrees}deg)`;
        const poinKurang = targetPoin - verifiedPoints;
        progressInfoText.textContent = `Anda membutuhkan ${poinKurang} poin lagi untuk mencapai target.`;
    }
}

function initializeSubmissionForm() {
    // Ambil elemen-elemen dari DOM (hanya jika ada di halaman)
    const kategoriSelect = document.getElementById('id_kategori');
    const levelSelect = document.getElementById('level_pencapaian');
    const poinDisplay = document.getElementById('bobot_poin_display');

    // Jika elemen-elemen form tidak ditemukan, hentikan fungsi ini.
    // Ini penting agar tidak error saat berada di section lain.
    if (!kategoriSelect || !levelSelect || !poinDisplay) {
        return;
    }

    // Variabel untuk menyimpan semua data SKP dari server
    let allSkpData = [];

    // Ambil token dari localStorage
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        console.error('Akses ditolak: Tidak ada token untuk form pengajuan.');
        return;
    }

    // Ambil data dari API
    fetch('http://localhost:3000/api/skp', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal mengambil data SKP');
            }
            return response.json();
        })
        .then(data => {
            allSkpData = data;
            allSkpPointsMaster = data;
            populateKategoriDropdown(allSkpData);

            initializeInformationSection();
        })
        .catch(error => {
            console.error('Error:', error);
            Toastify({
                text: 'Gagal memuat data SKP. Coba refresh halaman.',
                duration: 5000, close: true, gravity: "top", position: "center",
                style: { background: "linear-gradient(to right, #FF5F6D, #FFC371)" }
            }).showToast();
        });

    // Fungsi untuk mengisi dropdown Kategori Prestasi
    function populateKategoriDropdown(data) {
        const uniqueKegiatan = [...new Set(data.map(item => item.kegiatan))];

        uniqueKegiatan.forEach(kegiatan => {
            const option = document.createElement('option');
            option.value = kegiatan;
            option.textContent = kegiatan;
            kategoriSelect.appendChild(option);
        });
    }

    // Tambahkan event listener untuk dropdown Kategori
    kategoriSelect.addEventListener('change', function () {
        const selectedKegiatan = this.value;

        levelSelect.innerHTML = '<option value="">Pilih Level</option>';
        poinDisplay.value = '';

        if (selectedKegiatan) {
            const filteredLevels = allSkpData.filter(item => item.kegiatan === selectedKegiatan);

            filteredLevels.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.tingkat;
                levelSelect.appendChild(option);
            });

            levelSelect.disabled = false;
        } else {
            levelSelect.disabled = true;
        }
    });

    // Tambahkan event listener untuk dropdown Level untuk menampilkan poin
    levelSelect.addEventListener('change', function () {
        const selectedId = this.value;

        if (selectedId) {
            const selectedSkp = allSkpData.find(item => item.id == selectedId);
            if (selectedSkp) {
                poinDisplay.value = selectedSkp.bobot_poin;
            }
        } else {
            poinDisplay.value = '';
        }
    });
}

// ==========================================================================
// ===== GANTI SELURUH FUNGSI initializeSubmissionHandler DENGAN KODE INI =====
// ==========================================================================

function initializeSubmissionHandler() {
    const submitButton = document.getElementById('submit-skp-btn');
    const submissionForm = document.getElementById('dashboard-skp-form'); // Tetap butuh referensi form

    if (!submitButton || !submissionForm) {
        console.error("Tombol submit (#submit-skp-btn) atau form (#dashboard-skp-form) tidak ditemukan.");
        return;
    }

    submitButton.addEventListener('click', async function () {
        console.log("[SUBMIT HANDLER] Tombol diklik.");

        const token = localStorage.getItem('jwtToken');
        const buttonElement = this; 

        const idSkpPoint = submissionForm.querySelector('#level_pencapaian').value;
        const buktiFile = submissionForm.querySelector('#bukti_sertifikat').files[0];
        const namaKegiatan = submissionForm.querySelector('#nama_kegiatan').value;
        const penyelenggara = submissionForm.querySelector('#penyelenggara').value;
        const tanggalKegiatan = submissionForm.querySelector('#tanggal_kegiatan').value;

        // Validasi field teks dasar
        if (!namaKegiatan || !penyelenggara || !tanggalKegiatan) {
             Toastify({ text: 'Nama Kegiatan, Penyelenggara, dan Tanggal wajib diisi!', duration: 3000, close: true, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #FF5F6D, #FFC371)" }}).showToast();
             return;
        }
        if (!idSkpPoint) {
            Toastify({ text: 'Pilih Kategori dan Level Pencapaian!', duration: 3000, close: true, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #FF5F6D, #FFC371)" } }).showToast();
            return;
        }
        if (!buktiFile) {
            Toastify({ text: 'Harap unggah file bukti!', duration: 3000, close: true, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #FF5F6D, #FFC371)" } }).showToast();
            return;
        }

        const deskripsiLengkap = `${namaKegiatan} - diselenggarakan oleh ${penyelenggara}`;
        const formData = new FormData(); 
        formData.append('id_skp_point', idSkpPoint);
        formData.append('deskripsi_kegiatan', deskripsiLengkap);
        formData.append('tanggal_kegiatan', tanggalKegiatan);
        formData.append('bukti_file', buktiFile, buktiFile.name);
        formData.append('nama_kegiatan', namaKegiatan);
        formData.append('penyelenggara', penyelenggara);


        // --- Kirim ke Server ---
        buttonElement.disabled = true;
        buttonElement.textContent = 'Mengirim...';

        let promptResult = null; // Untuk menyimpan hasil SweetAlert
        let success = false;     // Untuk menandai fetch berhasil

        try {
            const response = await fetch('http://localhost:3000/api/submissions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, 
                body: formData
            });

            const result = await response.json(); 

            if (!response.ok) { 
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            success = true; 

            promptResult = await Swal.fire({
                title: 'Berhasil Terkirim!',
                text: result.message,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Ya, Ajukan Lagi',
                cancelButtonText: 'Tidak, Kembali ke Overview',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#6c757d',
                allowOutsideClick: false, // Mencegah menutup dengan klik di luar
                allowEscapeKey: false    // Mencegah menutup dengan tombol Esc
            });
            console.log("[SUBMIT HANDLER] Swal ditutup. Hasil:", promptResult);

        } catch (error) {
            // Tangani error fetch atau jika response.ok false
            console.error('[SUBMIT HANDLER] Error:', error);
            Toastify({
                text: `Gagal mengirim: ${error.message}`,
                duration: 5000, close: true, gravity: "top", position: "right",
                style: { background: "linear-gradient(to right, #FF5F6D, #FFC371)" }
            }).showToast();
            // PENTING: Aktifkan kembali tombol JIKA terjadi error
            buttonElement.disabled = false;
            buttonElement.textContent = 'Ajukan Kegiatan';
        }

        // --- Logika SETELAH SweetAlert Ditutup (hanya jika fetch sukses) ---
        if (success && promptResult) {
             // Beri jeda sedikit agar SweetAlert sempat hilang sepenuhnya dari DOM
             setTimeout(() => {

                // 1. Selalu reset form
                submissionForm.reset();
                const levelSelect = submissionForm.querySelector('#level_pencapaian');
                levelSelect.innerHTML = '<option value="">Pilih Level</option>';
                levelSelect.disabled = true;
                submissionForm.querySelector('#bobot_poin_display').value = '';

                // 2. Selalu aktifkan kembali tombol
                buttonElement.disabled = false;
                buttonElement.textContent = 'Ajukan Kegiatan';

                // 3. Cek pilihan & navigasi/load data
                if (!promptResult.isConfirmed) {
                    // Pindah section manual
                    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));

                    const overviewSection = document.getElementById('overview');
                    const overviewNavItem = document.querySelector('.sidebar-nav a[href="#overview"]').parentElement;
                    if (overviewSection) overviewSection.classList.add('active');
                    if (overviewNavItem) overviewNavItem.classList.add('active');

                    updatePageTitle('Overview');

                    // Panggil loadDashboardData setelah pindah section, dengan jeda tambahan
                    setTimeout(() => {
                        loadDashboardData();
                    }, 50); // Jeda singkat setelah pindah section
                } else {
                    // Muat ulang data dashboard di latar belakang agar data terbaru (misal di riwayat) muncul
                    // tanpa pindah halaman
                     setTimeout(() => {
                        loadDashboardData();
                    }, 50); 
                }
             }, 100); // Jeda 100ms SETELAH SweetAlert ditutup sebelum melakukan aksi

        } else if (success && !promptResult) {
             // Tetap aktifkan tombol jika terjadi hal aneh
             buttonElement.disabled = false;
             buttonElement.textContent = 'Ajukan Kegiatan';
        }
        // Jika fetch gagal (success === false), tombol sudah diaktifkan di catch

    }); // Akhir addEventListener 'click'
}

function initializeCharts() {
    // Ini adalah placeholder untuk integrasi chart library seperti Chart.js
    const ctx = document.getElementById('pointsChart');
    if (ctx) {
        // Code untuk inisialisasi chart akan ditambahkan di sini
        console.log('Chart canvas ready for initialization');
    }
}

function initializeHistoryFilter() {
    const filterGrid = document.querySelector('.filter-grid');
    if (!filterGrid) return;

    filterGrid.addEventListener('click', function (e) {
        const clickedCard = e.target.closest('.filter-card');
        if (!clickedCard) return;

        // Ambil nilai filter dari atribut data-filter
        const filterValue = clickedCard.dataset.filter;

        // Hapus kelas 'active' dari semua kartu
        document.querySelectorAll('.filter-card').forEach(card => {
            card.classList.remove('active');
        });
        // Tambahkan kelas 'active' ke kartu yang diklik
        clickedCard.classList.add('active');

        // Panggil fungsi untuk menampilkan ulang tabel dengan data yang sudah difilter
        populateHistoryList(filterValue);
    });
}

function populateHistoryList(filter = 'all') {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    // Filter data dari variabel global fullHistory
    let filteredHistory = fullHistory;
    if (filter !== 'all') {
        filteredHistory = fullHistory.filter(entry => entry.status === filter);
    }

    tableBody.innerHTML = '';

    if (filteredHistory.length === 0) {
        // DIUBAH: colspan sekarang menjadi 6 karena ada kolom baru
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Anda belum memiliki riwayat pengajuan kegiatan.</td></tr>';
        return;
    }

    filteredHistory.forEach((entry, index) => {
        const statusClass = `status-${entry.status}`;
        const kegiatanLengkap = `
            <div class="kegiatan-title">${entry.deskripsi_kegiatan}</div>
            <div class="kegiatan-category">${entry.kegiatan} - ${entry.tingkat}</div>
        `;

        // --- BARU: Logika untuk menampilkan keterangan/alasan ditolak ---
        let keteranganCellHTML = '<td>-</td>'; // Defaultnya strip
        if (entry.status === 'rejected' && entry.catatan_admin) {
            keteranganCellHTML = `<td><span class="rejection-note">${entry.catatan_admin}</span></td>`;
        } else if (entry.status === 'rejected' && !entry.catatan_admin) {
            keteranganCellHTML = `<td><span class="rejection-note">Ditolak tanpa catatan.</span></td>`;
        }
        // --- Akhir Blok Logika ---

        const row = document.createElement('tr');
        row.dataset.id = entry.id;
        // DIUBAH: Tambahkan ${keteranganCellHTML} ke dalam baris
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${kegiatanLengkap}</td>
            <td>${entry.poin_saat_pengajuan}</td>
            <td>${new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            <td><span class="status-badge ${statusClass}">${entry.status}</span></td>
            ${keteranganCellHTML}
        `;

        tableBody.appendChild(row);
    });
}

function updateHistoryCardCounts() {
    const countAll = fullHistory.length;
    const countApproved = fullHistory.filter(e => e.status === 'approved').length;
    const countPending = fullHistory.filter(e => e.status === 'pending').length;
    const countRejected = fullHistory.filter(e => e.status === 'rejected').length;

    document.getElementById('history-count-all').textContent = countAll;
    document.getElementById('history-count-approved').textContent = countApproved;
    document.getElementById('history-count-pending').textContent = countPending;
    document.getElementById('history-count-rejected').textContent = countRejected;
}

function populateProfileSection(userData) {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.elements['name'].value = userData.name || '';
    form.elements['email'].value = userData.email || '';
    form.elements['nim'].value = userData.nim || '';
    form.elements['fakultas'].value = userData.fakultas || '';
    form.elements['jenjang_pendidikan'].value = userData.jenjang_pendidikan || '';
    form.elements['program_studi'].value = userData.program_studi || '';
    form.elements['angkatan'].value = userData.angkatan || '';

    Array.from(form.elements).forEach(el => {
        if (el.name !== 'email') {
            el.readOnly = true;
        }
    });
}

function initializeProfileFormHandler() {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;

    profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';

        const token = localStorage.getItem('jwtToken');
        const userData = JSON.parse(localStorage.getItem('skp_user'));

        const formData = new FormData(this);
        const updatedData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`http://localhost:3000/api/users/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal memperbarui profil.');
            }

            localStorage.setItem('skp_user', JSON.stringify(result.user));

            Toastify({
                text: "Profil berhasil diperbarui!",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "center",
                style: {
                    background: "linear-gradient(135deg, #28a745, #20c997)",
                }
            }).showToast();

            loadDashboardData();
            populateProfileSection(result.user);

            profileForm.classList.remove('is-editing');
            Array.from(profileForm.elements).forEach(el => el.readOnly = true);

        } catch (error) {
            Toastify({
                text: `Error: ${error.message}`,
                duration: 4000,
                close: true,
                gravity: "top",
                position: "right",
                style: {
                    background: "linear-gradient(to right, #FF5F6D, #FFC371)",
                }
            }).showToast();
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Simpan Perubahan';
        }
    });
}

// TAMBAHKAN FUNGSI BARU INI
function initializeProfileModeToggle() {
    const form = document.getElementById('profile-form');
    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const fields = form.querySelectorAll('input, select');

    if (!form || !editBtn || !cancelBtn) return;

    // Saat tombol "Edit Profil" di-klik
    editBtn.addEventListener('click', () => {
        form.classList.add('is-editing');
        fields.forEach(field => {
            if (field.name !== 'email') {
                field.readOnly = false;
            }
        });
        document.getElementById('profile-name').focus(); // Fokus ke input nama
    });

    // Saat tombol "Batal" di-klik
    cancelBtn.addEventListener('click', () => {
        form.classList.remove('is-editing');
        fields.forEach(field => {
            field.readOnly = true;
        });
        // Muat ulang data asli dari localStorage untuk membatalkan perubahan
        const originalUserData = JSON.parse(localStorage.getItem('skp_user'));
        populateProfileSection(originalUserData);
    });
}

function initializeNotificationBell() {
    const bell = document.getElementById('notification-bell');
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notification-list');

    if (!bell || !panel || !list) return;

    // Tampilkan/sembunyikan panel saat lonceng diklik
    bell.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah event klik menyebar ke window
        panel.classList.toggle('active');
    });

    // Sembunyikan panel saat mengklik di luar
    window.addEventListener('click', () => {
        panel.classList.remove('active');
    });
    panel.addEventListener('click', (e) => e.stopPropagation());

    // Event handler untuk klik pada item notifikasi
    list.addEventListener('click', (e) => {
        const item = e.target.closest('.notification-item');
        if (!item) return;

        const submissionId = parseInt(item.dataset.submissionId);

        // Tandai sebagai sudah dibaca
        let readNotifs = JSON.parse(localStorage.getItem('read_notifications')) || [];
        if (!readNotifs.includes(submissionId)) {
            readNotifs.push(submissionId);
            localStorage.setItem('read_notifications', JSON.stringify(readNotifs));
        }

        // Pindahkan ke halaman riwayat dan highlight barisnya
        document.querySelector('a[href="#history"]').click();
        highlightHistoryRow(submissionId);

        // Perbarui tampilan notifikasi
        populateNotifications();
        panel.classList.remove('active');
    });
}

function populateNotifications() {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-badge');
    if (!list || !badge) return;

    // Ambil data notifikasi yang sudah dibaca
    const readNotifs = JSON.parse(localStorage.getItem('read_notifications')) || [];

    // Filter riwayat untuk mendapatkan notifikasi (approved/rejected)
    const notifications = fullHistory
        .filter(entry => entry.status === 'approved' || entry.status === 'rejected')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Urutkan dari yang terbaru

    list.innerHTML = '';
    let unreadCount = 0;

    if (notifications.length === 0) {
        list.innerHTML = '<p class="empty-state">Tidak ada notifikasi.</p>';
        badge.style.display = 'none';
        return;
    }

    notifications.forEach(notif => {
        const isUnread = !readNotifs.includes(notif.id);
        if (isUnread) {
            unreadCount++;
        }

        const icon = notif.status === 'approved' ? '✅' : '❌';
        const message = notif.status === 'approved' ? 'Pengajuan Anda telah diterima.' : 'Pengajuan Anda ditolak.';

        const item = document.createElement('div');
        item.className = `notification-item ${isUnread ? 'is-unread' : ''}`;
        item.dataset.submissionId = notif.id;
        item.innerHTML = `
            <div class="notification-icon ${notif.status}">${icon}</div>
            <div class="notification-content">
                <p>${message}</p>
                <small>${notif.deskripsi_kegiatan}</small>
            </div>
        `;
        list.appendChild(item);
    });

    // Update badge unread count
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function highlightHistoryRow(submissionId) {
    // Tunggu sebentar agar section history sempat ditampilkan
    setTimeout(() => {
        // Hapus highlight dari baris lain jika ada
        document.querySelectorAll('.history-table tbody tr.highlight').forEach(row => {
            row.classList.remove('highlight');
        });

        const rowToHighlight = document.querySelector(`.history-table tbody tr[data-id="${submissionId}"]`);
        if (rowToHighlight) {
            rowToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            rowToHighlight.classList.add('highlight');

            // Hapus highlight setelah beberapa detik
            setTimeout(() => {
                rowToHighlight.classList.remove('highlight');
            }, 3000);
        }
    }, 100); // delay 100ms
}

function initializePrintReportButton() {
    const printBtn = document.getElementById('print-report-btn');
    if (!printBtn) return;

    printBtn.addEventListener('click', () => {
        const userData = JSON.parse(localStorage.getItem('skp_user'));
        const approvedHistory = fullHistory.filter(entry => entry.status.toLowerCase() === 'approved');

        // 1. Inisialisasi Dokumen PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4'); // p: portrait, pt: points, a4: size

        // 2. Buat Header Dokumen
        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.text('LEMBAR SATUAN KREDIT PRESTASI (SKP) MAHASISWA', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
        doc.text('UNIVERSITAS SINGAPERBANGSA KARAWANG', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

        // 3. Buat Info Profil Mahasiswa
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        let startY = 120;
        doc.text('NAMA MAHASISWA', 40, startY);
        doc.text(':', 160, startY);
        doc.text(userData.name || '-', 170, startY);
        startY += 20;
        doc.text('NPM', 40, startY);
        doc.text(':', 160, startY);
        doc.text(userData.nim || '-', 170, startY);
        startY += 20;
        doc.text('PROGRAM STUDI', 40, startY);
        doc.text(':', 160, startY);
        doc.text(userData.program_studi || '-', 170, startY);

        // 4. Siapkan Data untuk Tabel
        const head = [['No', 'KEGIATAN', 'NAMA KEGIATAN', 'TAUTAN BUKTI', 'SKOR']];
        const body = [];
        let overallTotalPoints = 0;
        let categoryIndex = 1;

        const allMasterCategories = [...new Set(allSkpPointsMaster.map(point => point.kegiatan))];

        allMasterCategories.forEach(category => {
            const entriesInCategory = approvedHistory.filter(entry => entry.kegiatan === category);
            const categoryTotalPoints = entriesInCategory.reduce((sum, entry) => sum + Number(entry.poin_saat_pengajuan), 0);
            overallTotalPoints += categoryTotalPoints;

            // Baris Kategori Utama
            body.push([
                { content: categoryIndex, styles: { halign: 'center' } },
                { content: category, colSpan: 3, styles: { fontStyle: 'bold' } },
                { content: categoryTotalPoints, styles: { halign: 'center', fontStyle: 'bold' } }
            ]);

            // Baris Rincian
            entriesInCategory.forEach(entry => {
                const buktiLink = entry.bukti_file ? `http://localhost:3000/${entry.bukti_file.replace(/\\/g, '/')}` : null;
                body.push([
                    '',
                    `${entry.tingkat}`,
                    `${entry.deskripsi_kegiatan}`,
                    // Tambahkan URL ke dalam cell untuk membuat link
                    { content: 'Lihat Bukti', url: buktiLink },
                    { content: entry.poin_saat_pengajuan, styles: { halign: 'center' } }
                ]);
            });
            categoryIndex++;
        });

        // Baris Total
        body.push([
            { content: 'SKOR TOTAL', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } },
            { content: overallTotalPoints, styles: { halign: 'center', fontStyle: 'bold' } }
        ]);

        // 5. Gambar Tabel menggunakan AutoTable
        doc.autoTable({
            head: head,
            body: body,
            startY: startY + 30,
            theme: 'grid', // 'striped', 'grid', or 'plain'
            headStyles: {
                fillColor: [242, 242, 242],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                lineColor: [44, 62, 80],
                lineWidth: 0.5
            },
            bodyStyles: {
                lineColor: [44, 62, 80],
                lineWidth: 0.5
            },
            didDrawCell: (data) => {
                // Tambahkan link fungsional pada cell "Lihat Bukti"
                if (data.section === 'body' && data.column.index === 3 && data.cell.raw.url) {
                    doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: data.cell.raw.url });
                }
            },
        });

        const finalY = doc.autoTable.previous.finalY;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Atur posisi untuk blok tanda tangan
        let signatureY = finalY + 60; // Beri jarak 60pt dari bawah tabel

        doc.setFont('times', 'normal');
        doc.setFontSize(11);

        // Tulis teks tanda tangan, ratakan ke kanan
        doc.text(`Karawang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 60, signatureY, { align: 'right' });
        signatureY += 20;
        doc.text('Mengetahui,', pageWidth - 60, signatureY, { align: 'right' });
        signatureY += 20;
        doc.text('Koordinator Program Studi', pageWidth - 60, signatureY, { align: 'right' });
        signatureY += 80; // Beri ruang untuk tanda tangan
        doc.text('(Nama Koordinator Prodi)', pageWidth - 60, signatureY, { align: 'right' });
        signatureY += 15;
        doc.text('NIP. (NIP Koordinator Prodi)', pageWidth - 60, signatureY, { align: 'right' });

        // 6. Simpan PDF
        doc.save(`Laporan Poin SKP - ${userData.name}.pdf`);
    });
}

// TAMBAHKAN FUNGSI BARU INI di dashboard.js
// GANTI SELURUH FUNGSI initializeAccountActions YANG LAMA DENGAN INI:

function initializeAccountActions() {
    // Referensi Elemen
    const changePasswordModal = document.getElementById('change-password-modal');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const changePasswordForm = document.getElementById('change-password-form');
    const deleteAccountForm = document.getElementById('delete-account-form');

    // Pastikan semua elemen ada sebelum melanjutkan
    if (!changePasswordModal || !deleteAccountModal || !changePasswordForm || !deleteAccountForm ||
        !document.getElementById('open-change-password-modal-btn') ||
        !document.getElementById('open-delete-account-modal-btn')) {
        console.warn("Elemen untuk Aksi Akun tidak ditemukan sepenuhnya. Melewati inisialisasi.");
        return; // Hentikan jika elemen penting tidak ada
    }

    // Fungsi helper untuk modal (tidak berubah)
    const toggleModal = (modal, show) => {
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    };

    // Event listener untuk membuka modal UBAH PASSWORD (sudah benar)
    document.getElementById('open-change-password-modal-btn').addEventListener('click', () => {
        const userData = JSON.parse(localStorage.getItem('skp_user'));
        const oldPasswordGroup = changePasswordForm.querySelector('#old-password').closest('.form-group');
        const oldPasswordInput = changePasswordForm.querySelector('#old-password');
        const modalTitle = changePasswordModal.querySelector('.modal-header h2');

        if (userData && userData.auth_provider === 'google') {
            modalTitle.textContent = 'Atur Password Lokal';
            oldPasswordGroup.style.display = 'none';
            oldPasswordInput.required = false;
        } else {
            modalTitle.textContent = 'Ubah Password';
            oldPasswordGroup.style.display = 'block';
            oldPasswordInput.required = true;
        }
        toggleModal(changePasswordModal, true);
    });

    // Event listener untuk membuka modal HAPUS AKUN (tidak berubah)
    document.getElementById('open-delete-account-modal-btn').addEventListener('click', () => toggleModal(deleteAccountModal, true));

    // Event listener untuk semua tombol close (tidak berubah)
    document.querySelectorAll('.modal-overlay .close-button, .modal-overlay .close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleModal(changePasswordModal, false);
            toggleModal(deleteAccountModal, false);
            // Reset form jika ditutup
            changePasswordForm.reset();
            deleteAccountForm.reset();
        });
    });

    // Event listener untuk submit form UBAH PASSWORD (dengan Toastify)
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const userData = JSON.parse(localStorage.getItem('skp_user'));
        const token = localStorage.getItem('jwtToken');

        if (userData && userData.auth_provider === 'google') {
            delete data.oldPassword;
        }

        try {
            const response = await fetch('http://localhost:3000/api/users/me/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            // Ganti alert sukses dengan Toastify
            Toastify({
                text: result.message, // "Password berhasil diubah. Silakan login kembali."
                duration: 4000,
                close: true, gravity: "top", position: "center",
                style: { background: "linear-gradient(135deg, #28a745, #20c997)" },
                stopOnFocus: true, // Biarkan toast tampil jika kursor di atasnya
                callback: function () { handleLogout(token); } // Logout SETELAH toast hilang
            }).showToast();

            toggleModal(changePasswordModal, false);
            changePasswordForm.reset(); // Reset form setelah sukses

        } catch (error) {
            // Ganti alert error dengan Toastify
            Toastify({
                text: `${error.message}`,
                duration: 5000,
                close: true, gravity: "top", position: "center",
                style: { background: "linear-gradient(to right, #FF5F6D)" }
            }).showToast();
        }
    });

    // Event listener untuk submit form HAPUS AKUN (dengan SweetAlert2) - VERSI BENAR
    deleteAccountForm.addEventListener('submit', async (e) => { // Tambahkan async di sini
        e.preventDefault();

        // Ambil data form SEBELUM menampilkan konfirmasi
        const formData = new FormData(deleteAccountForm);
        const data = Object.fromEntries(formData.entries());
        const token = localStorage.getItem('jwtToken');

        // Tampilkan konfirmasi SweetAlert
        Swal.fire({
            title: 'Anda Yakin Ingin Hapus Akun?',
            text: "Tindakan ini permanen dan tidak dapat diurungkan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545', // Warna Merah Bahaya
            cancelButtonColor: '#6c757d', // Warna Abu Batal
            confirmButtonText: 'Ya, Hapus Akun Saya!',
            cancelButtonText: 'Batal'
        }).then(async (result) => { // Pastikan async ada di dalam .then() juga
            if (result.isConfirmed) {
                // HANYA jika dikonfirmasi, lanjutkan fetch
                try {
                    const response = await fetch('http://localhost:3000/api/users/me', { // Pastikan URL benar
                        method: 'POST', // Pastikan method benar
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(data) // Kirim data form yang sudah diambil tadi
                    });
                    const deleteResult = await response.json();
                    if (!response.ok) throw new Error(deleteResult.message);

                    // Notifikasi Sukses SETELAH berhasil hapus
                    Swal.fire({
                        title: 'Berhasil Dihapus!',
                        text: deleteResult.message,
                        icon: 'success',
                        confirmButtonColor: '#800020'
                    }).then(() => {
                        // Bersihkan localStorage dan redirect SETELAH notifikasi sukses ditutup
                        console.log('Akun dihapus, membersihkan localStorage dan redirect...');
                        localStorage.removeItem('jwtToken');
                        localStorage.removeItem('skp_user');
                        window.location.href = 'login.html';
                    });

                } catch (error) {
                    // Notifikasi Error jika GAGAL hapus
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menghapus Akun',
                        text: `${error.message}`,
                        confirmButtonColor: '#800020'
                    });
                }
            } else {
                // Jika user klik "Batal", reset form hapus akun
                deleteAccountForm.reset();
            }
        });
    });
}

// TAMBAHKAN FUNGSI BARU INI
function initializePasswordToggles() {
    // Cari semua ikon mata di dalam dokumen
    const toggleIcons = document.querySelectorAll('.password-toggle-icon');

    toggleIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            // Temukan input password yang berada tepat sebelum ikon ini
            const passwordInput = this.previousElementSibling;
            if (!passwordInput) return;

            // Cek tipe input saat ini
            if (passwordInput.type === 'password') {
                // Jika tipenya password, ubah menjadi text (lihat password)
                passwordInput.type = 'text';
                // Ubah ikonnya menjadi mata-dicoret
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                // Jika tipenya text, kembalikan menjadi password (sembunyikan)
                passwordInput.type = 'password';
                // Ubah ikonnya kembali menjadi mata
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
}

/**
 * FUNGSI BARU: Untuk menggambar ulang isi tabel informasi.
 * @param {Array} data - Array berisi data poin SKP yang akan ditampilkan.
 */
function renderInformationTable(data) {
    const tableBody = document.getElementById('information-table-body');
    if (!tableBody) return; // Keluar jika elemen tidak ditemukan

    // Kosongkan isi tabel terlebih dahulu
    tableBody.innerHTML = '';

    // Tampilkan pesan jika tidak ada data yang cocok dengan filter
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Tidak ada data yang cocok dengan filter Anda.</td></tr>';
        return;
    }

    // Buat baris untuk setiap item data
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${index + 1}</td>
            <td>${item.kegiatan}</td>
            <td>${item.tingkat}</td>
            <td style="text-align: center; font-weight: 600;">${item.bobot_poin}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * FUNGSI BARU: Inisialisasi untuk section "Information".
 * Mengisi filter, menampilkan data awal, dan menambahkan event listener.
 */
function initializeInformationSection() {
    // Ambil elemen-elemen yang dibutuhkan
    const searchInput = document.getElementById('info-search-input');
    const categoryFilter = document.getElementById('info-category-filter');
    const tableBody = document.getElementById('information-table-body');

    // Jika kita tidak berada di section "Information", elemen-elemen ini tidak akan ada.
    // Pengecekan ini penting agar tidak terjadi error.
    if (!searchInput || !categoryFilter || !tableBody) {
        return;
    }

    // --- Mengisi Dropdown Kategori ---
    // Kita gunakan data `allSkpPointsMaster` yang sudah diambil saat inisialisasi form.
    // Ini lebih efisien karena tidak perlu fetch API lagi.
    if (allSkpPointsMaster && allSkpPointsMaster.length > 0) {
        // Ambil kategori unik menggunakan Set
        const uniqueCategories = [...new Set(allSkpPointsMaster.map(item => item.kegiatan))];

        // Kosongkan opsi yang ada (kecuali 'Semua Kategori')
        categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';

        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Tampilkan semua data di tabel saat pertama kali dibuka
        renderInformationTable(allSkpPointsMaster);
    }

    // --- Fungsi untuk memfilter dan menampilkan ulang data ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        let filteredData = allSkpPointsMaster;

        // 1. Filter berdasarkan kategori yang dipilih
        if (selectedCategory !== 'all') {
            filteredData = filteredData.filter(item => item.kegiatan === selectedCategory);
        }

        // 2. Filter berdasarkan teks pencarian dari hasil filter kategori
        if (searchTerm) {
            filteredData = filteredData.filter(item =>
                item.kegiatan.toLowerCase().includes(searchTerm) ||
                item.tingkat.toLowerCase().includes(searchTerm)
            );
        }

        // Gambar ulang tabel dengan data yang sudah difilter
        renderInformationTable(filteredData);
    }

    // --- Tambahkan Event Listener ke input filter ---
    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
}
