const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');
const path = require('path');

// Konfigurasi penyimpanan Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'skp_bukti', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], 
    // (Opsional) Transformasi jika perlu (misal resize gambar)
    // transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => {
      const fileName = path.parse(file.originalname).name;
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `bukti-${fileName}-${uniqueSuffix}`;
    },
  },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Tipe file tidak diizinkan! Hanya JPEG, JPG, PNG, dan PDF.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Batas ukuran file 5MB
    fileFilter: fileFilter 
});

module.exports = upload;