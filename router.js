const express = require('express');
const path = require('path');
const AuthController = require('./controllers/AuthController');
const ProfileController  = require('./controllers/ProfileController');
const upload = require('./middlewares/upload');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/profile', upload.single('avatar'), ProfileController.updateProfile);

router.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'login_system/views/register.html')));
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login_system/views/login.html')));
router.get('/main-menu', (req, res) => res.sendFile(path.join(__dirname, 'menus/views/main-menu.html')));
router.get('/profile', ProfileController.getProfile);

router.get('/game-room', (req, res) => res.sendFile(path.join(__dirname, 'game_room/views/game-room.html')));
router.get('/', (req, res) => {
    res.redirect('/login');
});

module.exports = router;
