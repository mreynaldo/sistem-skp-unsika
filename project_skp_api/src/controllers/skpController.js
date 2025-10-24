const skpModel = require('../models/skpModel');

// GET /api/skp - Mengambil semua poin SKP
exports.getAllSkp = async (req, res) => {
    try {
        const skpPoints = await skpModel.getAllSkpPoints();
        res.status(200).json(skpPoints);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving SKP points', error: error.message });
    }
};

// GET /api/skp/:id - Mengambil satu poin SKP
exports.getSkpById = async (req, res) => {
    try {
        const { id } = req.params;
        const skpPoint = await skpModel.getSkpPointById(id);
        if (!skpPoint) {
            return res.status(404).json({ message: 'SKP point not found' });
        }
        res.status(200).json(skpPoint);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving SKP point', error: error.message });
    }
};

// POST /api/skp - Membuat poin SKP baru (Admin)
exports.createSkp = async (req, res) => {
    try {
        // DIUBAH: 'jabatan' dihapus dari validasi
        const { kegiatan, tingkat, bobot_poin } = req.body;
        if (!kegiatan || !tingkat || bobot_poin === undefined) {
            return res.status(400).json({ message: 'Fields (kegiatan, tingkat, bobot_poin) are required' });
        }
        const newSkpId = await skpModel.createSkpPoint(req.body);
        res.status(201).json({ message: 'SKP point created successfully', id: newSkpId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating SKP point', error: error.message });
    }
};

// PUT /api/skp/:id - Memperbarui poin SKP (Admin)
exports.updateSkp = async (req, res) => {
    try {
        const { id } = req.params;
        // DIUBAH: 'jabatan' dihapus dari validasi
        const { kegiatan, tingkat, bobot_poin } = req.body;
        if (!kegiatan || !tingkat || bobot_poin === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const affectedRows = await skpModel.updateSkpPoint(id, req.body);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'SKP point not found or no changes made' });
        }
        res.status(200).json({ message: 'SKP point updated successfully', id: id });
    } catch (error) {
        res.status(500).json({ message: 'Error updating SKP point', error: error.message });
    }
};

// DELETE /api/skp/:id - Menghapus poin SKP (Admin)
exports.deleteSkp = async (req, res) => {
    try {
        const { id } = req.params;
        const affectedRows = await skpModel.deleteSkpPoint(id);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'SKP point not found' });
        }
        res.status(200).json({ message: 'SKP point deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting SKP point', error: error.message });
    }
};

exports.createBulkSkp = async (req, res) => {
    try {
        const skpDataArray = req.body;

        // Validasi: pastikan body adalah array dan tidak kosong
        if (!Array.isArray(skpDataArray) || skpDataArray.length === 0) {
            return res.status(400).json({ message: 'Request body must be a non-empty array of SKP points' });
        }

        const affectedRows = await skpModel.createBulkSkpPoints(skpDataArray);
        
        res.status(201).json({ 
            message: 'Bulk insert successful', 
            insertedCount: affectedRows 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error during bulk insert', error: error.message });
    }
};