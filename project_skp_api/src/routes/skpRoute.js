const express = require('express');
const router = express.Router();
const skpController = require('../controllers/skpController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// --- Rute untuk Poin SKP ---

// Rute Publik (Read-Only) untuk semua user yang sudah login
// GET /api/skp -> Dapatkan semua item poin SKP
router.get('/', protect, skpController.getAllSkp);

// GET /api/skp/:id -> Dapatkan satu item poin SKP
router.get('/:id', protect, skpController.getSkpById);


// Rute Khusus Admin (Create, Update, Delete)
// Membutuhkan login (protect) DAN role 'admin' (authorize)
// POST /api/skp -> Buat item poin SKP baru
router.post('/', protect, authorize('admin'), skpController.createSkp);

// PUT /api/skp/:id -> Perbarui item poin SKP
router.put('/:id', protect, authorize('admin'), skpController.updateSkp);

// DELETE /api/skp/:id -> Hapus item poin SKP
router.delete('/:id', protect, authorize('admin'), skpController.deleteSkp);

router.post('/bulk', protect, authorize('admin'), skpController.createBulkSkp);


module.exports = router;