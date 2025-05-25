const bcrypt = require('bcrypt');
const User = require('../models/User');
const path = require('path');

module.exports = {
    async register(req, res) {
        const { login, email, password_hash, avatar_url, wins_counter, losses_counter } = req.body;
        const exists = await User.findByLoginOrEmail(login, email);
        
        if (exists) {
            return res.json({ success: false, message: 'Login or email already in use' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

        const newUser = await User.create({ login, email, password_hash: hashedPassword, avatar_url, wins_counter: 0, losses_counter: 0 });
        const avatarPath = newUser.avatar_url ? path.basename(newUser.avatar_url) : 'default_avatar.png';        

        req.session.user = {
            id: newUser.id,
            login: newUser.login,
            email: newUser.email,
            avatar_url: avatarPath,
            password_hash: newUser.password_hash,
            wins_counter: wins_counter,
            losses_counter: losses_counter
        };

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
                id: user.id,
                login: user.login,
                email: user.email,
                avatar_url: path.basename(user.avatar_url),
                password_hash: user.password_hash,
                wins_counter: user.wins_counter,
                losses_counter: user.losses_counter
            };
            res.json({ success: true, message: 'Login successful!' });
        } else {
            res.json({ success: false, message: 'Invalid password' });
        }
    }
}