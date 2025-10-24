const db = require('../config/db');

// Membuat pengajuan baru oleh mahasiswa
exports.createSubmission = async (submissionData) => {
    const { id_mahasiswa, id_skp_point, deskripsi_kegiatan, tanggal_kegiatan, bukti_file, poin_saat_pengajuan } = submissionData;
    const [result] = await db.execute(
        'INSERT INTO skp_submissions (id_mahasiswa, id_skp_point, deskripsi_kegiatan, tanggal_kegiatan, bukti_file, poin_saat_pengajuan, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id_mahasiswa, id_skp_point, deskripsi_kegiatan, tanggal_kegiatan, bukti_file, poin_saat_pengajuan, 'pending']
    );
    return result.insertId;
};

// Mengambil semua pengajuan milik satu mahasiswa
exports.findSubmissionsByUserId = async (userId) => {
    const [rows] = await db.execute(`
        SELECT 
            s.id, s.deskripsi_kegiatan, s.tanggal_kegiatan, s.bukti_file, 
            s.poin_saat_pengajuan, s.status, s.catatan_admin, s.created_at,
            p.kegiatan, p.tingkat
        FROM skp_submissions s
        JOIN skp_points p ON s.id_skp_point = p.id
        WHERE s.id_mahasiswa = ?
        ORDER BY s.created_at ASC
    `, [userId]);
    return rows;
};

// Mengambil semua pengajuan untuk dilihat admin
exports.findAllSubmissions = async () => {
    const [rows] = await db.execute(`
        SELECT 
            s.id, s.deskripsi_kegiatan, s.tanggal_kegiatan, 
            s.poin_saat_pengajuan, s.status, s.created_at,
            s.bukti_file,
            p.kegiatan, p.tingkat,
            u.name as nama_mahasiswa, u.email as email_mahasiswa
        FROM skp_submissions s
        JOIN skp_points p ON s.id_skp_point = p.id
        JOIN users u ON s.id_mahasiswa = u.id
        ORDER BY s.status ASC, s.created_at ASC
    `);
    return rows;
};

// Mengubah status pengajuan oleh admin
exports.updateSubmissionStatus = async (submissionId, status, catatan_admin) => {
    const [result] = await db.execute(
        'UPDATE skp_submissions SET status = ?, catatan_admin = ? WHERE id = ?',
        [status, catatan_admin, submissionId]
    );
    return result.affectedRows;
};