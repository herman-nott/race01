const express = require('express');
const session = require('express-session');
const path = require('path');
const router = require('./router');

const app = express();
const PORT = 3000;

app.use('/styles', express.static(path.join(__dirname, 'login_system/styles')));
app.use('/styles', express.static(path.join(__dirname, 'main-menu/styles')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

app.use(router);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
