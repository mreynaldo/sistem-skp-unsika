const db = require('../config/db');

exports.findUserByEmail = async (email) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

exports.getAllUsers = async () => {
    const [rows] = await db.execute('SELECT id, name, email, role, created_at FROM users');
    return rows;
};

exports.getUserById = async (id) => {
    const [rows] = await db.execute(
        'SELECT id, name, email, role, nim, fakultas, program_studi, angkatan, jenjang_pendidikan, created_at, auth_provider FROM users WHERE id = ?',
        [id]
    );
    return rows[0];
};
exports.createUser = async (userData) => {
    const { name, email, password, role, nim, auth_provider } = userData;
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, role, nim, auth_provider, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [name, email, password, role, nim || null, auth_provider || 'local']
    );
    return result.insertId;
};

exports.updateUser = async (id, userData) => {
    const { name, nim, fakultas, program_studi, angkatan, jenjang_pendidikan } = userData;

    const [result] = await db.execute(
        `UPDATE users SET 
            name = ?, 
            nim = ?, 
            fakultas = ?, 
            program_studi = ?, 
            angkatan = ?, 
            jenjang_pendidikan = ? 
        WHERE id = ?`,
        [name, nim, fakultas, program_studi, angkatan, jenjang_pendidikan, id]
    );
    return result.affectedRows;
};

exports.deleteUser = async (id) => {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
};

exports.saveRevokedToken = async (tokenSignature, expirationTimestamp) => {
    const [result] = await db.execute(
        'INSERT INTO revoked_tokens (token_signature, expires_at) VALUES (?, FROM_UNIXTIME(?))',
        [tokenSignature, expirationTimestamp]
    );
    return result.insertId;
};

exports.isTokenRevoked = async (tokenSignature) => {
    const [rows] = await db.execute(
        'SELECT 1 FROM revoked_tokens WHERE token_signature = ? AND expires_at > NOW()',
        [tokenSignature]
    );

    return rows.length > 0;
};

exports.updatePassword = async (userId, hashedPassword) => {
    const [result] = await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    return result.affectedRows;
};

exports.getFullUserById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

exports.updateAuthProvider = async (userId, provider) => {
    const [result] = await db.execute(
        'UPDATE users SET auth_provider = ? WHERE id = ?',
        [provider, userId]
    );
    return result.affectedRows;
};