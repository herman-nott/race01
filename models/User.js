const db = require('../db');

module.exports = {
    async findByLoginOrEmail(login, email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE login = ? OR email = ?',
            [login, email]
        );
        return rows[0];
    },

    async create({ login, email, password_hash, avatar_url }) {
        return db.query(
            'INSERT INTO users (login, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)',
            [login, email, password_hash, avatar_url]
        );
    },

    async findByCredentials(loginOrEmail, password) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE login = ? OR email = ?',
            [loginOrEmail, loginOrEmail]
        );
        return rows[0];
    }
}