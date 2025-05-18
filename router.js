const express = require('express');
const path = require('path');
const AuthController = require('./controllers/AuthController');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

router.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'login_system/views/register.html')));
router.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login_system/views/login.html')));
router.get('/main-menu', (req, res) => res.sendFile(path.join(__dirname, 'main-menu/views/main-menu.html')));
router.get('/', (req, res) => {    
    res.redirect('/login');
});

module.exports = router;
