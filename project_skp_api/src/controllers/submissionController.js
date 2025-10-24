const submissionModel = require('../models/submissionModel');
const skpModel = require('../models/skpModel'); 

exports.createSubmission = async (req, res) => {
    try {
        const id_mahasiswa = req.user.id; // Ambil ID mahasiswa dari token JWT
        // Data form (non-file) sekarang ada di req.body
        const { id_skp_point, deskripsi_kegiatan, tanggal_kegiatan } = req.body;

        // Path file yang di-upload ada di req.file
        const bukti_file_path = req.file ? req.file.path : null;

        if (!id_skp_point || !deskripsi_kegiatan || !tanggal_kegiatan) {
            return res.status(400).json({ message: 'ID Poin SKP, deskripsi, dan tanggal kegiatan wajib diisi' });
        }

        // Ambil data poin dari master skp_points untuk keamanan
        const skpPointRule = await skpModel.getSkpPointById(id_skp_point);
        if (!skpPointRule) {
            return res.status(404).json({ message: 'Aturan Poin SKP tidak ditemukan.' });
        }

        const submissionData = {
            id_mahasiswa,
            id_skp_point,
            deskripsi_kegiatan,
            tanggal_kegiatan,
            bukti_file: bukti_file_path,// Opsional
            poin_saat_pengajuan: skpPointRule.bobot_poin // Ambil poin dari database, bukan dari input user
        };

        const newSubmissionId = await submissionModel.createSubmission(submissionData);
        res.status(201).json({ message: 'Pengajuan SKP berhasil dibuat', submissionId: newSubmissionId });

    } catch (error) {
        res.status(500).json({ message: 'Error saat membuat pengajuan', error: error.message });
    }
};

// [Mahasiswa] - Melihat riwayat pengajuan sendiri
exports.getMySubmissions = async (req, res) => {
    try {
        const id_mahasiswa = req.user.id;
        const submissions = await submissionModel.findSubmissionsByUserId(id_mahasiswa);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error saat mengambil riwayat pengajuan', error: error.message });
    }
};

// [Admin] - Melihat semua pengajuan
exports.getAllSubmissions = async (req, res) => {
    try {
        const submissions = await submissionModel.findAllSubmissions();
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error saat mengambil semua pengajuan', error: error.message });
    }
};

// [Admin] - Menyetujui atau menolak pengajuan
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, catatan_admin } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Status harus 'approved' atau 'rejected'" });
        }

        const affectedRows = await submissionModel.updateSubmissionStatus(id, status, catatan_admin || null);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });
        }

        res.status(200).json({ message: `Pengajuan berhasil diubah menjadi ${status}` });

    } catch (error) {
        res.status(500).json({ message: 'Error saat memperbarui status pengajuan', error: error.message });
    }
};