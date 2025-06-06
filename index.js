const express = require('express');
const session = require('express-session');
const path = require('path');
const router = require('./router');
const http = require('http');
const User = require('./models/User');
const { Server } = require('socket.io');
const { createAIOpponent } = require('./game_room/scripts/ai-opponent.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const waitingPlayers = [];
const gameRooms = new Map(); // Store game room data
const aiOpponents = new Map(); // Store AI opponents

// Card database - centralized on server
const cardDatabase = [
    { id: 1, name: "Arya Stark", attack: 4, defense: 3, cost: 2, image: "/cards/card_arya.png" },
    { id: 2, name: "Brienne of Tarth", attack: 2, defense: 3, cost: 1, image: "/cards/card_briena.png" },
    { id: 3, name: "Cersei Lannister", attack: 4, defense: 3, cost: 3, image: "/cards/card_cersei.png" },
    { id: 4, name: "Daenerys Targaryen", attack: 5, defense: 4, cost: 3, image: "/cards/card_daeneris.png" },
    { id: 5, name: "Khal Drogo", attack: 6, defense: 4, cost: 4, image: "/cards/card_drogo.png" },
    { id: 6, name: "Jaime Lannister", attack: 2, defense: 3, cost: 2, image: "/cards/card_jaime.png" },
    { id: 7, name: "Margaery Tyrell", attack: 3, defense: 5, cost: 3, image: "/cards/card_margaery.png"},
    { id: 8, name: "Oberyn Martell", attack: 3, defense: 3, cost: 2, image: "/cards/card_martel.png" },
    { id: 9, name: "Melisandre", attack: 6, defense: 8, cost: 5, image: "/cards/card_melisandre.png" },
    { id: 10, name:"Missandei", attack: 1, defense: 1, cost: 1, image: "/cards/card_missandei.png" },
    { id: 11, name: "The Mountain", attack: 2, defense: 3, cost: 1, image: "/cards/card_mountain.png" },
    { id: 12, name: "Ned Stark", attack: 4, defense: 3, cost: 2, image: "/cards/card_ned.png" },
    { id: 13, name: "Olenna Tyrell", attack: 2, defense: 1, cost: 1, image: "/cards/card_olenna.png" },
    { id: 14, name: "Petyr Baelish", attack: 8, defense: 6, cost: 5, image: "/cards/card_petir.png" },
    { id: 15, name: "Robb Stark", attack: 6, defense: 5, cost: 4, image: "/cards/card_rob.png" },
    { id: 16, name: "Robert Baratheon", attack: 5, defense: 7, cost: 4, image: "/cards/card_robert.png" },
    { id: 17, name: "Sansa Stark", attack: 5, defense: 4, cost: 3, image: "/cards/card_sansa.png" },
    { id: 18, name: "Jon Snow", attack: 8, defense: 7, cost: 5, image: "/cards/card_snow.png" },
    { id: 19, name: "Tyrion Lannister", attack: 6, defense: 7, cost: 5, image: "/cards/card_tyrion.png" },
    { id: 20, name: "Tywin Lannister", attack: 5, defense: 7, cost: 4, image: "/cards/card_tywin.png" }
    // { id: 20, name: "Night King", attack: 8, defense: 8, cost: 5, image: "/cards/card_night_king.png" },
    // { id: 21, name: "White Walker", attack: 6, defense: 3, cost: 2, image: "/cards/card_white_walker.png" },
    // { id: 22, name: "Dragon", attack: 9, defense: 7, cost: 5, image: "/cards/card_dragon.png" }
];

// Helper functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Timer management for singleplayer AI timeout
const singlePlayerTimers = new Map();

function startSinglePlayerTimer(socket) {
    const timerId = setTimeout(() => {
        // If still waiting after 4 seconds, create AI opponent
        const playerIndex = waitingPlayers.indexOf(socket);
        if (playerIndex !== -1) {
            waitingPlayers.splice(playerIndex, 1);
            createSinglePlayerGame(socket);
        }
    }, 4000); // 4 second timeout
    
    singlePlayerTimers.set(socket.id, timerId);
}

function clearSinglePlayerTimer(socketId) {
    const timerId = singlePlayerTimers.get(socketId);
    if (timerId) {
        clearTimeout(timerId);
        singlePlayerTimers.delete(socketId);
    }
}

function createSinglePlayerGame(socket) {
    const roomID = `room-${socket.id}-ai`;
    
    socket.join(roomID);
    
    // Create game room with AI placeholder
    const gameRoom = createGameRoomWithAI(roomID, socket);
    
    // Create AI opponent
    const aiOpponent = createAIOpponent(socket, roomID, gameRoom, gameRooms);
    aiOpponents.set(roomID, aiOpponent);
    
    // Get AI player ID
    const aiPlayerId = Object.keys(gameRoom.players).find(id => id !== socket.id);
    
    // console.log(`Created singleplayer game for ${socket.id} vs AI in room ${roomID}`);
    
    // Send game start data to human player
    socket.emit('startGame', {
        roomId: roomID,
        playerCount: 2,
        playerRoles: {
            [socket.id]: 'player',
            [aiPlayerId]: 'opponent'
        },
        initialHand: gameRoom.players[socket.id].hand,
        deckCount: gameRoom.deck.length,
        playerMana: gameRoom.players[socket.id].mana,
        opponentMana: gameRoom.players[aiPlayerId].mana
    });
}

function createGameRoomWithAI(roomID, humanSocket) {
    // Create shuffled deck for this game
    const shuffledDeck = shuffleArray(cardDatabase);
    
    // Deal initial hands (4 cards each)
    const humanHand = [];
    const aiHand = [];
    
    for (let i = 0; i < 4; i++) {
        if (shuffledDeck.length > 0) humanHand.push(shuffledDeck.pop());
        if (shuffledDeck.length > 0) aiHand.push(shuffledDeck.pop());
    }
    
    // Generate unique AI player ID
    const aiPlayerId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const gameRoom = {
        id: roomID,
        players: {
            [humanSocket.id]: {
                socket: humanSocket,
                role: 'player',
                hand: humanHand,
                mana: 3,
                hp: 30,
                field: { left: null, center: null, right: null },
                ready: false
            },
            [aiPlayerId]: {
                socket: null, // AI doesn't have a real socket
                role: 'opponent',
                hand: aiHand,
                mana: 3,
                hp: 30,
                field: { left: null, center: null, right: null },
                ready: false
            }
        },
        deck: shuffledDeck,
        round: 1,
        gameOver: false
    };
    
    gameRooms.set(roomID, gameRoom);
    return gameRoom;
}

function createGameRoom(roomID, player1, player2) {
    // Create shuffled deck for this game
    const shuffledDeck = shuffleArray(cardDatabase);
    
    // Deal initial hands (4 cards each)
    const player1Hand = [];
    const player2Hand = [];
    
    for (let i = 0; i < 4; i++) {
        if (shuffledDeck.length > 0) player1Hand.push(shuffledDeck.pop());
        if (shuffledDeck.length > 0) player2Hand.push(shuffledDeck.pop());
    }
    
    const gameRoom = {
        id: roomID,
        players: {
            [player1.id]: {
                socket: player1,
                role: 'player',
                hand: player1Hand,
                mana: 3,
                hp: 30,
                field: { left: null, center: null, right: null },
                ready: false
            },
            [player2.id]: {
                socket: player2,
                role: 'opponent', 
                hand: player2Hand,
                mana: 3,
                hp: 30,
                field: { left: null, center: null, right: null },
                ready: false
            }
        },
        deck: shuffledDeck,
        round: 1,
        gameOver: false
    };
    
    gameRooms.set(roomID, gameRoom);
    return gameRoom;
}

const sessionMiddleware = session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
});

// Use session middleware for both Express and Socket.io
app.use(sessionMiddleware);

// Share session with Socket.io
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
    socket.on('joinQueue', () => {
        waitingPlayers.push(socket);
        
        // Start timer for singleplayer fallback
        startSinglePlayerTimer(socket);

        if (waitingPlayers.length >= 2) {
            const player1 = waitingPlayers.shift();
            const player2 = waitingPlayers.shift();
            
            // Clear timers for both players since they found a match
            clearSinglePlayerTimer(player1.id);
            clearSinglePlayerTimer(player2.id);

            const roomID = `room-${player1.id}-${player2.id}`;

            player1.join(roomID);
            player2.join(roomID);

            // Create game room with deck management
            const gameRoom = createGameRoom(roomID, player1, player2);

            // Send game start data including initial hands and mana
            player1.emit('startGame', {
                roomId: roomID,
                playerCount: 2,
                playerRoles: {
                    [player1.id]: 'player',
                    [player2.id]: 'opponent'
                },
                initialHand: gameRoom.players[player1.id].hand,
                deckCount: gameRoom.deck.length,
                playerMana: gameRoom.players[player1.id].mana,
                opponentMana: gameRoom.players[player2.id].mana
            });

            player2.emit('startGame', {
                roomId: roomID,
                playerCount: 2,
                playerRoles: {
                    [player1.id]: 'player',
                    [player2.id]: 'opponent'
                },
                initialHand: gameRoom.players[player2.id].hand,
                deckCount: gameRoom.deck.length,
                playerMana: gameRoom.players[player2.id].mana,
                opponentMana: gameRoom.players[player1.id].mana
            });

        } else {
            socket.emit('waitingForOpponent', { playerCount: 1 });
        }
    });

    socket.on('placeCard', ({ roomId, position, card }) => {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom || !gameRoom.players[socket.id]) return;

        const player = gameRoom.players[socket.id];
        
        // Verify player has the card and enough mana
        const cardIndex = player.hand.findIndex(c => c.id === card.id);
        if (cardIndex === -1 || player.mana < card.cost) return;

        // Remove card from hand and place on field
        player.hand.splice(cardIndex, 1);
        player.field[position] = card;
        player.mana -= card.cost;

        // Send updated mana to the player who placed the card
        socket.emit('manaUpdate', { mana: player.mana });
        
        // Notify other player about card placement and their opponent's new mana
        socket.to(roomId).emit('cardPlaced', { position, card, opponentMana: player.mana });
        
        // Update deck count for all players in room
        io.to(roomId).emit('deckCountUpdate', { deckCount: gameRoom.deck.length });
    });

    socket.on('playerReady', (roomId) => {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom || !gameRoom.players[socket.id]) return;

        gameRoom.players[socket.id].ready = true;
        socket.to(roomId).emit('playerReady');
        
        // Check if both players are ready
        const allReady = Object.values(gameRoom.players).every(p => p.ready);
        if (allReady) {
            handleNextRound(roomId);
        }
    });

    socket.on('opponentReady', (roomId) => {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom || !gameRoom.players[socket.id]) return;

        gameRoom.players[socket.id].ready = true;
        socket.to(roomId).emit('opponentReady');
        
        // Check if both players are ready
        const allReady = Object.values(gameRoom.players).every(p => p.ready);
        if (allReady) {
            handleNextRound(roomId);
        }
    });

    socket.on('requestNewCard', (roomId) => {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom || !gameRoom.players[socket.id]) return;

        const player = gameRoom.players[socket.id];
        
        // Draw card if hand has less than 4 cards and deck has cards
        if (player.hand.length < 4 && gameRoom.deck.length > 0) {
            const newCard = gameRoom.deck.pop();
            player.hand.push(newCard);
            
            socket.emit('newCardDrawn', { 
                card: newCard, 
                deckCount: gameRoom.deck.length 
            });
            
            // Update deck count for all players
            io.to(roomId).emit('deckCountUpdate', { deckCount: gameRoom.deck.length });
        }
    });

    function handleNextRound(roomId) {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom) return;

        // Increment round
        gameRoom.round++;

        const playerIds = Object.keys(gameRoom.players);
        const [id1, id2] = playerIds;
        const player1 = gameRoom.players[id1];
        const player2 = gameRoom.players[id2];

        // Reset ready, increase mana, draw cards
        for (const player of [player1, player2]) {
            player.ready = false;
            player.mana = Math.min(10, player.mana + 1);

            if (player.hand.length < 4 && gameRoom.deck.length > 0) {
                const newCard = gameRoom.deck.pop();
                player.hand.push(newCard);

                if (player.socket) {
                    player.socket.emit('newCardDrawn', {
                        card: newCard,
                        deckCount: gameRoom.deck.length
                    });
                }
            }
        }

        // Send round update to human (only if socket exists)
        if (player1.socket) {
            player1.socket.emit('newRound', {
                round: gameRoom.round,
                deckCount: gameRoom.deck.length,
                playerMana: player1.mana,
                opponentMana: player2.mana
            });
        }

        if (player2.socket) {
            player2.socket.emit('newRound', {
                round: gameRoom.round,
                deckCount: gameRoom.deck.length,
                playerMana: player2.mana,
                opponentMana: player1.mana
            });
        }

        // If AI is in this game, trigger its next turn manually
        const aiOpponent = aiOpponents.get(roomId);
        if (aiOpponent && aiOpponent.shouldBeActive()) {
            setTimeout(() => aiOpponent.startAI(), 100);
        }
    }

    // Game result incrementation
    socket.on('gameResult', async ({ roomId, winner, loser, isDraw }) => {
        const gameRoom = gameRooms.get(roomId);
        if (!gameRoom || gameRoom.gameOver) return;

        gameRoom.gameOver = true; // Prevent duplicate processing

        try {
            const playerIds = Object.keys(gameRoom.players);
            const aiOpponent = aiOpponents.get(roomId);

            if (aiOpponent) {
                gameRoom.gameOver = true; // Prevent duplicate processing

                // Single player vs AI
                const humanPlayerId = playerIds.find(id => gameRoom.players[id].socket);
                const humanPlayer = gameRoom.players[humanPlayerId];

                if (humanPlayer && humanPlayer.socket.request.session && humanPlayer.socket.request.session.user) {
                    const userId = humanPlayer.socket.request.session.user.id;

                    if (isDraw) {
                        // No stat change
                    } else if (winner === 'player') {
                        await User.incrementWins(userId);
                        humanPlayer.socket.request.session.user.wins_counter = (humanPlayer.socket.request.session.user.wins_counter || 0) + 1;
                    } else if (winner === 'opponent') {
                        await User.incrementLosses(userId);
                        humanPlayer.socket.request.session.user.losses_counter = (humanPlayer.socket.request.session.user.losses_counter || 0) + 1;
                    }
                }
            } else {
                // Multiplayer game - update both players based on sender's result
                const senderPlayer = gameRoom.players[socket.id];
                if (!senderPlayer) return;

                const otherPlayerId = playerIds.find(id => id !== socket.id);
                const otherPlayer = gameRoom.players[otherPlayerId];

                // Validate both players' sessions
                if (
                    otherPlayer?.socket?.request?.session?.user &&
                    socket?.request?.session?.user &&
                    !isDraw
                ) {
                    const senderUserId = socket.request.session.user.id;
                    const otherUserId = otherPlayer.socket.request.session.user.id;

                    const senderRole = senderPlayer.role;
                    const otherRole = otherPlayer.role;

                    const updates = [];

                    // Determine roles and prepare update actions
                    if (senderRole === winner) {
                        updates.push({ id: senderUserId, action: User.incrementWins, sessionField: 'wins_counter', session: socket.request.session.user });
                        updates.push({ id: otherUserId, action: User.incrementLosses, sessionField: 'losses_counter', session: otherPlayer.socket.request.session.user });
                    } else if (senderRole === loser) {
                        updates.push({ id: senderUserId, action: User.incrementLosses, sessionField: 'losses_counter', session: socket.request.session.user });
                        updates.push({ id: otherUserId, action: User.incrementWins, sessionField: 'wins_counter', session: otherPlayer.socket.request.session.user });
                    }

                    // Sort updates to prevent deadlocks
                    updates.sort((a, b) => String(a.id).localeCompare(String(b.id)));

                    for (const { id, action, sessionField, session } of updates) {
                        try {
                            await action(id);
                            session[sessionField] = (session[sessionField] || 0) + 1;
                        } catch (err) {
                            console.error(`Error updating ${sessionField} for user ${id}:`, err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error updating game results:', error);
        }
    });

    socket.on('disconnect', () => {
        // Clear any pending singleplayer timer
        clearSinglePlayerTimer(socket.id);
        
        // Remove from waiting queue
        const index = waitingPlayers.indexOf(socket);
        if (index !== -1) waitingPlayers.splice(index, 1);

        // Handle disconnection from active games
        for (const [roomId, gameRoom] of gameRooms.entries()) {
            if (gameRoom.players[socket.id]) {
                // Check if this is an AI game
                const aiOpponent = aiOpponents.get(roomId);
                if (aiOpponent) {
                    // Deactivate AI and clean up
                    aiOpponent.deactivate();
                    aiOpponents.delete(roomId);
                } else {
                    // Notify other player of disconnection (multiplayer only)
                    socket.to(roomId).emit('playerDisconnected');
                }
                
                // Clean up game room
                gameRooms.delete(roomId);
                break;
            }
        }
    });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));

app.use('/styles', express.static(path.join(__dirname, 'login_system/styles')));
app.use('/styles', express.static(path.join(__dirname, 'menus/styles')));
app.use('/styles', express.static(path.join(__dirname, 'game_room/styles')));
app.use('/scripts', express.static(path.join(__dirname, 'game_room/scripts')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

app.use(router);

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));