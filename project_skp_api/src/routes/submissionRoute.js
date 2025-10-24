const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// --- Rute untuk Mahasiswa ---
// POST /api/submissions -> Membuat pengajuan baru
router.post('/', protect, upload.single('bukti_file'), submissionController.createSubmission); // <-- DIUBAH

// GET /api/submissions/my-submissions -> Melihat riwayat pengajuan sendiri
router.get('/my-submissions', protect, submissionController.getMySubmissions);


// --- Rute untuk Admin ---
// GET /api/submissions -> Melihat semua pengajuan dari semua mahasiswa
router.get('/', protect, authorize('admin'), submissionController.getAllSubmissions);

// PATCH /api/submissions/:id/status -> Menyetujui/menolak pengajuan
router.patch('/:id/status', protect, authorize('admin'), submissionController.updateStatus);


module.exports = router;