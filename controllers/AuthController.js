const bcrypt = require('bcrypt');
const User = require('../models/User');

module.exports = {
    async register(req, res) {
        const { login, email, password_hash, avatar_url } = req.body;
        const exists = await User.findByLoginOrEmail(login, email);
        
        if (exists) {
            return res.json({ success: false, message: 'Login or email already in use' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

        await User.create({ login, email, password_hash: hashedPassword, avatar_url });
        res.json({ success: true, message: 'User successfully registered!' });
    },

    async login(req, res) {
        const { loginOrEmail, password_hash } = req.body;

        const user = await User.findByCredentials(loginOrEmail);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password_hash, user.password_hash);
        if (isMatch) {
            req.session.loggedIn = true;
            req.session.user = {
                login: user.login,
                status: user.status,
                id: user.id
            };
            res.json({ success: true, message: 'Login successful!' });
        } else {
            res.json({ success: false, message: 'Invalid password' });
        }
    }
}