const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware'); // Asumsi diletakkan di folder controllers

// Routes CRUD untuk resource '/users'
// C - Create
// router.post('/',protect ,userController.createUser);

// R - Read All
router.get('/',protect ,userController.getUsers);

// R - Read One
router.get('/:id',protect ,userController.getUser);

// U - Update
router.put('/:id',protect ,userController.updateUser);

// D - Delete
router.delete('/:id',protect ,userController.deleteUser);

// PATCH /api/users/me/password -> Mengubah password user yang sedang login
router.patch('/me/password', protect, userController.changePassword);

// DELETE /api/users/me -> Menghapus akun user yang sedang login
router.post('/me', protect, userController.deleteMyAccount);

module.exports = router;