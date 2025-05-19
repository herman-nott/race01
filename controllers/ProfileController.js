const db = require('../db');
const path = require('path');
const fs = require('fs');

module.exports = {
    async getProfile(req, res) {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const user = req.session.user;

        const filePath = path.join(__dirname, '../menus/views/profile.html');

        fs.readFile(filePath, 'utf8', (err, html) => {
            if (err) return res.status(500).send('Error loading profile page');            
            
            html = html.replace('User123', user.login)
                       .replace('user@example.com', user.email)
                       .replace('/avatars/default_avatar.png', `/avatars/${user.avatar_url}`);

            res.send(html);
        });
    },

    async updateProfile(req, res) {
        if (!req.session.user) return res.redirect('/login');

        const userId = req.session.user.id;
        const { login, email, password } = req.body;
        const avatar = req.file ? req.file.filename : req.session.user.avatar_url;

        const passwordHash = password ? require('crypto').createHash('sha256').update(password).digest('hex') : req.session.user.password_hash;

        const sql = 'UPDATE users SET login = ?, email = ?, password_hash = ?, avatar_url = ? WHERE id = ?';
        const values = [login, email, passwordHash, avatar, userId];

        db.query(sql, values, (err) => {
            if (err) return res.status(500).send('Failed to update profile');

            req.session.user = {
                id: userId,
                login,
                email,
                password_hash: passwordHash,
                avatar_url: avatar
            };

            res.redirect('/profile');
        });
    }
}