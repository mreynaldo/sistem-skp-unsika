// dashboard-admin.js
let pointsChartInstance = null;
let statusChartInstance = null;
let allSkpPoints = [];

document.addEventListener('DOMContentLoaded', function () {
  const jwtToken = localStorage.getItem('jwtToken');
  const userData = JSON.parse(localStorage.getItem('skp_user'));

  if (!jwtToken || !userData || userData.role !== 'admin') {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('skp_user');
    window.location.href = 'login.html';
    return;
  }

  initializeNavigation();
  initializeLogout(jwtToken);
  initializeModalEvents();
  initializeTableEvents();
  initializeSkpManagementEvents();
  initializeSkpFiltering();
  initializeAutocomplete();

  loadAdminData();
  loadSkpManagementData();

  updateCurrentDate();
  setInterval(updateCurrentDate, 60000);

  const studentSearch = document.getElementById('student-search');
  if (studentSearch) {
    studentSearch.addEventListener('input', filterStudents);
  }

});

function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navLinks.forEach(n => n.parentElement.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      link.parentElement.classList.add('active');
      document.querySelector(link.getAttribute('href')).classList.add('active');
    });
  });
}

function initializeModalEvents() {
  const modal = document.getElementById('pdf-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  if (modal && closeModalBtn) {
    closeModalBtn.addEventListener('click', closePdfModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closePdfModal();
      }
    });
  }
}

function initializeTableEvents() {
  const pendingTableBody = document.querySelector('#pending-table tbody');
  if (pendingTableBody) {
    pendingTableBody.addEventListener('click', function (e) {
      const target = e.target;

      const viewProofBtn = target.closest('.btn-view-proof');
      if (viewProofBtn) {
        const fileUrl = viewProofBtn.dataset.fileUrl;
        if (fileUrl) {
          openPdfModal(fileUrl);
        }
        return;
      }

      const approveBtn = target.closest('.btn-approve');
      if (approveBtn) {
        const submissionId = approveBtn.dataset.id;
        if (submissionId) {
          handleApproval(submissionId, 'approved');
        }
        return;
      }

      const rejectBtn = target.closest('.btn-reject');
      if (rejectBtn) {
        const submissionId = rejectBtn.dataset.id;
        if (submissionId) {
          handleApproval(submissionId, 'rejected');
        }
        return;
      }
    });
  }
}

function updateCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', options);
}

async function loadAdminData() {
  const token = localStorage.getItem('jwtToken');
  try {
    const response = await fetch('http://localhost:3000/api/submissions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Gagal memuat data pengajuan.');

    const allSubmissions = await response.json();

    updateStatCards(allSubmissions);
    populatePendingTable(allSubmissions);
    populateStudentCards(allSubmissions);
    updateCharts(allSubmissions);

  } catch (error) {
    console.error('Error memuat data admin:', error);
    showToast('Gagal memuat data dari server.', 'error');
  }
}

function updateStatCards(submissions) {
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const uniqueStudentEmails = [...new Set(submissions.map(s => s.email_mahasiswa))];

  document.getElementById('total-students').textContent = uniqueStudentEmails.length;
  document.getElementById('total-activities').textContent = submissions.length;
  document.getElementById('pending-activities').textContent = pendingCount;
  document.getElementById('approved-activities').textContent = submissions.filter(s => s.status === 'approved').length;
  document.getElementById('pending-badge').textContent = pendingCount;
  document.getElementById('notification-badge').textContent = pendingCount;
}

function populatePendingTable(submissions) {
  const pendingTableBody = document.querySelector('#pending-table tbody');
  pendingTableBody.innerHTML = '';
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  if (pendingSubmissions.length === 0) {
    pendingTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">Tidak ada pengajuan yang menunggu verifikasi.</td></tr>`;
    return;
  }

  pendingSubmissions.forEach(entry => {
    const tr = document.createElement('tr');
    let buktiCellHTML = '<em>Tidak ada</em>';
    if (entry.bukti_file) {
      const fileUrl = `http://localhost:3000/${entry.bukti_file.replace(/\\/g, '/')}`;
      buktiCellHTML = `<button data-file-url="${fileUrl}" class="btn-view-proof">Lihat Bukti</button>`;
    }

    tr.innerHTML = `
            <td>${entry.nama_mahasiswa}</td>
            <td>${entry.deskripsi_kegiatan}</td>
            <td><strong>${entry.kegiatan}</strong><br><small>${entry.tingkat}</small></td>
            <td>${entry.poin_saat_pengajuan}</td>
            <td>${new Date(entry.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            <td>${buktiCellHTML}</td>
            <td>${new Date(entry.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            <td>
                <button data-id="${entry.id}" class="btn-approve">Setujui</button>
                <button data-id="${entry.id}" class="btn-reject">Tolak</button>
            </td>
        `;
    pendingTableBody.appendChild(tr);
  });
}

function openPdfModal(fileUrl) {
  const modal = document.getElementById('pdf-modal');
  const pdfViewer = document.getElementById('pdf-viewer');
  pdfViewer.src = fileUrl;
  modal.classList.add('active');
}

function closePdfModal() {
  const modal = document.getElementById('pdf-modal');
  const pdfViewer = document.getElementById('pdf-viewer');
  modal.classList.remove('active');
  pdfViewer.src = '';
}

function populateStudentCards(submissions) {
  const studentsCardsContainer = document.getElementById('students-cards');
  studentsCardsContainer.innerHTML = '';

  const studentsData = {};
  submissions.forEach(s => {
    if (!studentsData[s.email_mahasiswa]) {
      studentsData[s.email_mahasiswa] = {
        name: s.nama_mahasiswa,
        email: s.email_mahasiswa,
        approved_points: 0
      };
    }
    if (s.status === 'approved') {
      studentsData[s.email_mahasiswa].approved_points += s.poin_saat_pengajuan;
    }
  });

  for (const email in studentsData) {
    const student = studentsData[email];
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
            <h4>${student.name}</h4>
            <p>${student.email}</p>
            <div class="student-points">
                <span>Total Poin Resmi</span>
                <strong>${student.approved_points}</strong>
            </div>
        `;
    studentsCardsContainer.appendChild(card);
  }
}

function updateCharts(submissions) {
  const studentsData = {};
  submissions.forEach(s => {
    if (s.status === 'approved') {
      if (!studentsData[s.nama_mahasiswa]) {
        studentsData[s.nama_mahasiswa] = 0;
      }
      studentsData[s.nama_mahasiswa] += s.poin_saat_pengajuan;
    }
  });
  const chartLabels = Object.keys(studentsData);
  const chartPointsData = Object.values(studentsData);

  // Proses data untuk chart status
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  // Bar Chart
  const pointsCtx = document.getElementById('pointsChart').getContext('2d');
  if (pointsChartInstance) pointsChartInstance.destroy();
  pointsChartInstance = new Chart(pointsCtx, {
    type: 'bar',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Total Poin Disetujui',
        data: chartPointsData,
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderColor: 'rgba(41, 128, 185, 1)',
        borderWidth: 1
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // Doughnut Chart
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  if (statusChartInstance) statusChartInstance.destroy();
  statusChartInstance = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [{
        data: [pendingCount, approvedCount, rejectedCount],
        backgroundColor: ['#f39c12', '#27ae60', '#e74c3c']
      }]
    },
    options: { responsive: true, cutout: '70%' }
  });
}

function filterStudents() {
  const searchTerm = document.getElementById('student-search').value.toLowerCase();
  const studentCards = document.querySelectorAll('.student-card');

  studentCards.forEach(card => {
    const studentName = card.querySelector('h4').textContent.toLowerCase();
    const studentEmail = card.querySelector('p').textContent.toLowerCase();

    if (studentName.includes(searchTerm) || studentEmail.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

async function handleApproval(submissionId, newStatus) {
  const token = localStorage.getItem('jwtToken');
  let catatan = '';

  if (newStatus === 'rejected') {
    catatan = prompt("Harap masukkan alasan penolakan:");
    if (catatan === null || catatan.trim() === '') {
      showToast('Penolakan dibatalkan karena alasan tidak diisi.', 'error');
      return;
    }
  }

  try {
    const response = await fetch(`http://localhost:3000/api/submissions/${submissionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus,
        catatan_admin: catatan
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    showToast(`Pengajuan berhasil diubah menjadi ${newStatus}!`, 'success');
    loadAdminData();

  } catch (error) {
    console.error('Error saat update status:', error);
    showToast(`Gagal update status: ${error.message}`, 'error');
  }
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function initializeLogout(jwtToken) {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        handleLogout(jwtToken);
      }
    });
  }
}

async function handleLogout(token) {
  const API_URL_LOGOUT = 'http://localhost:3000/api/auth/logout';
  try {
    await fetch(API_URL_LOGOUT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Server logout error:', error);
  } finally {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('skp_user');
    window.location.href = 'login.html';
  }
}

function initializeSkpManagementEvents() {
  // Tombol "Tambah Poin Baru"
  document.getElementById('add-skp-point-btn').addEventListener('click', () => openSkpModal());

  // Tombol Batal di modal
  document.getElementById('skp-modal-cancel-btn').addEventListener('click', closeSkpModal);

  // Form submit
  document.getElementById('skp-form').addEventListener('submit', handleSkpFormSubmit);

  // Event delegation untuk tombol Edit dan Delete di tabel
  const tableBody = document.querySelector('#skp-points-table tbody');
  tableBody.addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = parseInt(editBtn.dataset.id);
      const pointToEdit = allSkpPoints.find(p => p.id === id);
      if (pointToEdit) openSkpModal(pointToEdit);
    }

    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id);
      handleDeleteSkpPoint(id);
    }
  });
}

async function loadSkpManagementData() {
  const token = localStorage.getItem('jwtToken');
  try {
    const response = await fetch('http://localhost:3000/api/skp', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Gagal memuat data poin SKP.');

    allSkpPoints = await response.json();
    populateSkpTable(allSkpPoints);
    populateSkpFilters(allSkpPoints);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function populateSkpTable(points) {
  const tableBody = document.querySelector('#skp-points-table tbody');
  tableBody.innerHTML = '';

  points.forEach(point => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${point.kegiatan}</td>
            <td>${point.tingkat}</td>
            <td>${point.bobot_poin}</td>
            <td>
                <div class="table-action-buttons">
                    <button class="btn-edit" data-id="${point.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-delete" data-id="${point.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </td>
        `;
    tableBody.appendChild(tr);
  });
}

function openSkpModal(point = null) {
  const modal = document.getElementById('skp-modal-overlay');
  const form = document.getElementById('skp-form');
  const modalTitle = document.getElementById('skp-modal-title');

  form.reset(); // Selalu reset form

  if (point) { // Mode Edit
    modalTitle.textContent = 'Edit Poin SKP';
    form.elements['id'].value = point.id;
    form.elements['kegiatan'].value = point.kegiatan;
    form.elements['tingkat'].value = point.tingkat;
    form.elements['bobot_poin'].value = point.bobot_poin;
  } else { // Mode Add
    modalTitle.textContent = 'Tambah Poin SKP Baru';
    form.elements['id'].value = '';
  }
  modal.classList.add('active');
}

function closeSkpModal() {
  document.getElementById('skp-modal-overlay').classList.remove('active');
}

async function handleSkpFormSubmit(e) {
  e.preventDefault();
  const token = localStorage.getItem('jwtToken');
  const form = e.target;
  const id = form.elements['id'].value;
  const data = {
    kegiatan: form.elements['kegiatan'].value,
    tingkat: form.elements['tingkat'].value,
    bobot_poin: form.elements['bobot_poin'].value,
  };

  const isEditing = id !== '';
  const url = isEditing ? `http://localhost:3000/api/skp/${id}` : 'http://localhost:3000/api/skp';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    showToast(result.message, 'success');
    closeSkpModal();
    loadSkpManagementData(); // Muat ulang data tabel
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleDeleteSkpPoint(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;

  const token = localStorage.getItem('jwtToken');
  try {
    const response = await fetch(`http://localhost:3000/api/skp/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);

    showToast(result.message, 'success');
    loadSkpManagementData(); // Muat ulang data tabel
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function initializeAutocomplete() {
  const input = document.getElementById('kegiatan');
  const suggestionsPanel = document.getElementById('kegiatan-suggestions');

  if (!input || !suggestionsPanel) return;

  // Tampilkan saran saat mengetik
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    if (query.length > 0) {
      const filteredKegiatan = [...new Set(allSkpPoints.map(p => p.kegiatan))]
        .filter(kegiatan => kegiatan.toLowerCase().includes(query));

      showSuggestions(filteredKegiatan, query, input, suggestionsPanel);
    } else {
      suggestionsPanel.classList.remove('active');
    }
  });

  // Pilih item saat diklik
  suggestionsPanel.addEventListener('click', e => {
    if (e.target.classList.contains('suggestion-item')) {
      input.value = e.target.textContent;
      suggestionsPanel.classList.remove('active');
    }
  });

  // Sembunyikan dropdown saat klik di luar
  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-container')) {
      suggestionsPanel.classList.remove('active');
    }
  });
}

function showSuggestions(suggestions, query, input, panel) {
  panel.innerHTML = '';
  if (suggestions.length === 0) {
    panel.classList.remove('active');
    return;
  }

  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';

    const regex = new RegExp(`(${query})`, 'gi');
    item.innerHTML = suggestion.replace(regex, '<strong>$1</strong>');

    panel.appendChild(item);
  });

  panel.classList.add('active');
}

// --- FUNGSI-FUNGSI BARU UNTUK FILTER POIN SKP ---

// Mengisi dropdown filter dengan data yang unik
// FUNGSI BARU
function populateSkpFilters(points) {
    const kegiatanFilter = document.getElementById('filter-kegiatan');
    if (!kegiatanFilter) return;

    const uniqueKegiatan = [...new Set(points.map(p => p.kegiatan))];

    kegiatanFilter.innerHTML = '<option value="all">Semua Jenis Kegiatan</option>';
    uniqueKegiatan.forEach(k => {
        kegiatanFilter.innerHTML += `<option value="${k}">${k}</option>`;
    });

    // Nonaktifkan filter tingkat saat pertama kali dimuat
    document.getElementById('filter-tingkat').disabled = true;
}

// Menerapkan filter dan menampilkan ulang tabel
function applySkpFilters() {
  const kegiatanFilter = document.getElementById('filter-kegiatan').value;
  const tingkatFilter = document.getElementById('filter-tingkat').value;

  let filteredPoints = allSkpPoints;

  if (kegiatanFilter !== 'all') {
    filteredPoints = filteredPoints.filter(p => p.kegiatan === kegiatanFilter);
  }
  if (tingkatFilter !== 'all') {
    filteredPoints = filteredPoints.filter(p => p.tingkat === tingkatFilter);
  }

  populateSkpTable(filteredPoints);
}


// FUNGSI BARU
function initializeSkpFiltering() {
    const kegiatanFilter = document.getElementById('filter-kegiatan');
    const tingkatFilter = document.getElementById('filter-tingkat');

    if (kegiatanFilter && tingkatFilter) {
        // Event listener untuk filter KEGIATAN
        kegiatanFilter.addEventListener('change', () => {
            updateTingkatFilter(); 
            applySkpFilters();    
        });

        tingkatFilter.addEventListener('change', applySkpFilters);
    }
}

function updateTingkatFilter() {
    const kegiatanFilter = document.getElementById('filter-kegiatan');
    const tingkatFilter = document.getElementById('filter-tingkat');
    const selectedKegiatan = kegiatanFilter.value;

    tingkatFilter.innerHTML = '<option value="all">Semua Tingkatan</option>';
    
    if (selectedKegiatan === 'all') {
        tingkatFilter.disabled = true;
    } else {
        // Jika kegiatan spesifik dipilih...
        const relevantTingkat = allSkpPoints
            .filter(p => p.kegiatan === selectedKegiatan) // 1. Cari semua yang cocok
            .map(p => p.tingkat); // 2. Ambil tingkatnya

        // 3. Ambil nilai unik dan isi dropdown
        const uniqueTingkat = [...new Set(relevantTingkat)];
        uniqueTingkat.forEach(t => {
            tingkatFilter.innerHTML += `<option value="${t}">${t}</option>`;
        });

        // Aktifkan kembali filter tingkat
        tingkatFilter.disabled = false;
    }
}