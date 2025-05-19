const express = require('express');
const session = require('express-session');
const path = require('path');
const router = require('./router');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

const waitingPlayers = [];

io.on('connection', (socket) => {
    // console.log('A user connected:', socket.id);

    socket.on('joinQueue', () => {
        waitingPlayers.push(socket);

        if (waitingPlayers.length >= 2) {
            const player1 = waitingPlayers.shift();
            const player2 = waitingPlayers.shift();

            const roomID = `room-${player1.id}-${player2.id}`;

            player1.join(roomID);
            player2.join(roomID);

            io.to(roomID).emit('startGame', { roomId: roomID });
        }
    });

    socket.on('disconnect', () => {
        const index = waitingPlayers.indexOf(socket);
        if (index !== -1) waitingPlayers.splice(index, 1);
    });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));

app.use('/styles', express.static(path.join(__dirname, 'login_system/styles')));
app.use('/styles', express.static(path.join(__dirname, 'menus/styles')));
app.use('/styles', express.static(path.join(__dirname, 'game_room/styles')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

app.use(router);

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
