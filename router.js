const express = require('express');
const path = require('path');
const fs = require('fs');
const AuthController = require('./controllers/AuthController');
const ProfileController  = require('./controllers/ProfileController');
const upload = require('./middlewares/upload');
const db = require('./db');
const User = require('./models/User');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/main-menu', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userId = req.session.user.id;
    const { login } = req.body;

    try {        const exists = await User.findByLogin(login);
        if (exists && exists.id !== userId) {
            return res.status(400).send('Login already taken');
        }
        await User.updateLogin(userId, login);
        req.session.user.login = login;

        res.redirect('/main-menu'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.post('/settings/save', (req, res) => {
    const { musicVolume, soundEnabled, theme } = req.body;
    req.session.settings = { musicVolume, soundEnabled: !!soundEnabled, theme };
    res.redirect('/settings');
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

router.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'login_system/views/register.html')));
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login_system/views/login.html')));
router.get('/main-menu', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        // Use findByLogin method to get fresh data
        const freshUserData = await User.findByLogin(req.session.user.login);
        
        if (!freshUserData) {
            return res.redirect('/login');
        }

        // Update session with fresh data
        req.session.user = {
            ...req.session.user,
            wins_counter: freshUserData.wins_counter || 0,
            losses_counter: freshUserData.losses_counter || 0
        };

        const filePath = path.join(__dirname, 'menus/views/main-menu.html');

        fs.readFile(filePath, 'utf8', (err, html) => {
            if (err) return res.status(500).send('Error loading main menu');

            const user = req.session.user;

            // Replace username
            html = html.replace(/>User</g, `>${user.login}<`);

            // Replace values
            html = html.replace(/(<input[^>]*name="login"[^>]*value=")[^"]*(")/, `$1${user.login}$2`);
            html = html.replace(/(<p>Wins: <span>)\d+(<\/span><\/p>)/, `$1${user.wins_counter || 0}$2`);
            html = html.replace(/(<p>Losses: <span>)\d+(<\/span><\/p>)/, `$1${user.losses_counter || 0}$2`);

            res.send(html);
        });

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error loading main menu');
    }
});
router.get('/game-room', (req, res) => res.sendFile(path.join(__dirname, 'game_room/views/game-room.html')));
router.get('/', (req, res) => {
    res.redirect('/login');
});
router.get('/settings', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'menus/views/settings.html'));
});

module.exports = router;
