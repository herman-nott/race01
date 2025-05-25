const db = require('../db');

module.exports = {
    async findByLoginOrEmail(login, email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE login = ? OR email = ?',
            [login, email]
        );
        return rows[0];
    },

    async create({ login, email, password_hash, avatar_url, wins_counter, losses_counter }) {
        return db.query(
            'INSERT INTO users (login, email, password_hash, avatar_url, wins_counter, losses_counter) VALUES (?, ?, ?, ?, ?, ?)',
            [login, email, password_hash, avatar_url, wins_counter, losses_counter]
        );
    },

    async findByCredentials(loginOrEmail) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE login = ? OR email = ?',
            [loginOrEmail, loginOrEmail]
        );
        return rows[0];
    },

    async findByLogin(login) {
        const [rows] = await db.query('SELECT * FROM users WHERE login = ?', [login]);
        return rows[0];
    },

    async updateLogin(userId, newLogin) {
        return db.query('UPDATE users SET login = ? WHERE id = ?', [newLogin, userId]);
    }
}