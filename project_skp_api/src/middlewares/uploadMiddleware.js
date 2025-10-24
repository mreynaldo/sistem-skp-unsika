const multer = require('multer');
const path = require('path');

// Tentukan lokasi penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Simpan file di folder 'uploads/' di root proyek
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        // Buat nama file yang unik untuk mencegah tumpang tindih
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter file untuk hanya menerima tipe gambar dan PDF
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb('Error: Tipe file tidak diizinkan! Hanya JPEG, JPG, PNG, dan PDF.');
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Batas ukuran file 5MB
    fileFilter: fileFilter 
});

module.exports = upload;