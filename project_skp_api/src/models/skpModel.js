const db = require('../config/db');

// Mengambil semua data poin SKP
exports.getAllSkpPoints = async () => {
    const [rows] = await db.execute('SELECT * FROM skp_points ORDER BY kegiatan, bobot_poin DESC');
    return rows;
};

// Mengambil satu data poin SKP berdasarkan ID
exports.getSkpPointById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM skp_points WHERE id = ?', [id]);
    return rows[0];
};

// Membuat data poin SKP baru (Admin only)
exports.createSkpPoint = async (skpData) => {
    // DIUBAH: 'jabatan' dihapus
    const { kegiatan, tingkat, bobot_poin } = skpData;
    const [result] = await db.execute(
        // DIUBAH: Query INSERT disesuaikan
        'INSERT INTO skp_points (kegiatan, tingkat, bobot_poin) VALUES (?, ?, ?)',
        [kegiatan, tingkat, bobot_poin]
    );
    return result.insertId;
};

// Memperbarui data poin SKP (Admin only)
exports.updateSkpPoint = async (id, skpData) => {
    // DIUBAH: 'jabatan' dihapus
    const { kegiatan, tingkat, bobot_poin } = skpData;
    const [result] = await db.execute(
        // DIUBAH: Query UPDATE disesuaikan
        'UPDATE skp_points SET kegiatan = ?, tingkat = ?, bobot_poin = ? WHERE id = ?',
        [kegiatan, tingkat, bobot_poin, id]
    );
    return result.affectedRows;
};

// Menghapus data poin SKP (Admin only)
exports.deleteSkpPoint = async (id) => {
    const [result] = await db.execute('DELETE FROM skp_points WHERE id = ?', [id]);
    return result.affectedRows;
};

exports.createBulkSkpPoints = async (skpDataArray) => {
    // Kita perlu mengubah array of objects menjadi array of arrays
    // Contoh: [[kegiatan1, tingkat1, bobot1], [kegiatan2, tingkat2, bobot2]]
    const values = skpDataArray.map(item => [item.kegiatan, item.tingkat, item.bobot_poin]);

    const [result] = await db.query(
        // Tanda tanya ganda (?) adalah sintaks khusus mysql2 untuk bulk insert
        'INSERT INTO skp_points (kegiatan, tingkat, bobot_poin) VALUES ?',
        [values]
    );
    return result.affectedRows; // Mengembalikan jumlah baris yang berhasil ditambahkan
};