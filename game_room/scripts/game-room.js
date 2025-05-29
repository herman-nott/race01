const socket = io();
let roomId = null;
let isPlayer = null; // true = lower row, false = upper row, null = neither role, dynamic
let currentTimerInterval = null; // for timer resetting
let combatInProgress = false; // for proper round change

// Game state - deck management moved to server
const gameState = {
    playerHand: [],
    opponentHand: [], // Simulating opponent's hand - not really exists
    playerField: {
        left: null,
        center: null,
        right: null
    },
    opponentField: {
        left: null,
        center: null,
        right: null
    },
    playerMana: 3,
    opponentMana: 3,
    playerHP: 30,
    opponentHP: 30,
    round: 1,
    isPlayerReady: false,
    isOpponentReady: false,
    selectedCard: null,
    selectedPosition: null,
    gameOver: false,
    winner: null,
    timeLeft: 30,
    deckCount: 0 // Server will manage this
};

// DOM elements
const elements = {
    playerHand: document.getElementById('player-hand'),
    playerHP: document.getElementById('player-hp'),
    opponentHP: document.getElementById('opponent-hp'),
    playerMana: document.getElementById('player-mana'),
    opponentMana: document.getElementById('opponent-mana'),
    playerManaCrystals: document.getElementById('player-mana-crystals'),
    opponentManaCrystals: document.getElementById('opponent-mana-crystals'),
    playerHPFill: document.getElementById('player-hp-fill'),
    opponentHPFill: document.getElementById('opponent-hp-fill'),
    roundNumber: document.getElementById('round-number'),
    timer: document.getElementById('timer'),
    statusMessage: document.getElementById('status-message'),
    readyButton: document.getElementById('ready-button'),
    deckCount: document.getElementById('deck-count'),
    gameOverModal: document.getElementById('game-over-modal'),
    gameOverMessage: document.getElementById('game-over-message'),
    playAgainButton: document.getElementById('play-again-button'),
    playerFieldCells: {
        left: document.getElementById('player-left'),
        center: document.getElementById('player-center'),
        right: document.getElementById('player-right')
    },
    opponentFieldCells: {
        left: document.getElementById('opponent-left'),
        center: document.getElementById('opponent-center'),
        right: document.getElementById('opponent-right')
    }
};

// Card rendering - Always check current mana state
function createCardElement(card, isField = false) {
    // For card validation, always use the current player's mana (gameState.playerMana)
    const currentMana = gameState.playerMana;
    const isPlayable = card.cost <= currentMana;
    
    const cardDiv = document.createElement('div');
    cardDiv.className = isField ? 'field-card' : 'card';
    if (!isPlayable && !isField) {
        cardDiv.classList.add('unplayable');
    }
    cardDiv.dataset.cardId = card.id;
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'card-name';
    nameDiv.textContent = card.name;
    cardDiv.appendChild(nameDiv);
    
    const imageDiv = document.createElement('div');
    imageDiv.className = 'card-image';
    
    // Replace the random color with actual image
    const imgElement = document.createElement('img');
    imgElement.src = card.image; // Use the image path from card data
    imgElement.alt = card.name;
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';
    imgElement.style.objectFit = 'cover';
    imageDiv.appendChild(imgElement);
    
    cardDiv.appendChild(imageDiv);
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'card-stats';
    
    const attackDiv = document.createElement('div');
    attackDiv.className = 'stat attack';
    attackDiv.textContent = card.attack;
    statsDiv.appendChild(attackDiv);
    
    const defenseDiv = document.createElement('div');
    defenseDiv.className = 'stat defense';
    defenseDiv.textContent = card.defense;
    statsDiv.appendChild(defenseDiv);
    
    cardDiv.appendChild(statsDiv);
    
    const costDiv = document.createElement('div');
    costDiv.className = 'cost';
    costDiv.textContent = card.cost;
    cardDiv.appendChild(costDiv);
    
    // Add event listeners only for playable hand cards
    if (!isField && isPlayable) {
        cardDiv.addEventListener('click', () => selectCard(card));
        cardDiv.style.cursor = 'pointer';
    } else if (!isField) {
        // Visual indication for unplayable cards
        cardDiv.style.cursor = 'not-allowed';
    }
    
    return cardDiv;
}



// Re-render hand when mana changes to update playability
function renderPlayerHand() {
    elements.playerHand.innerHTML = '';
    
    gameState.playerHand.forEach(card => {
        const cardElement = createCardElement(card);
        elements.playerHand.appendChild(cardElement);
    });
}


// Update deck count display
function updateDeckCount() {
    elements.deckCount.textContent = gameState.deckCount;
}

// Render mana crystals
function renderManaCrystals() {
    // The server handles which mana pool belongs to which player
    
    // Bottom (your) mana - always show gameState.playerMana
    elements.playerManaCrystals.innerHTML = '';
    elements.playerMana.textContent = gameState.playerMana;
    for (let i = 0; i < 10; i++) {
        const crystal = document.createElement('div');
        crystal.className = 'mana-crystal';
        if (i < gameState.playerMana) crystal.classList.add('filled');
        elements.playerManaCrystals.appendChild(crystal);
    }

    // Top (opponent) mana - always show gameState.opponentMana
    elements.opponentManaCrystals.innerHTML = '';
    elements.opponentMana.textContent = gameState.opponentMana;
    for (let i = 0; i < 10; i++) {
        const crystal = document.createElement('div');
        crystal.className = 'mana-crystal';
        if (i < gameState.opponentMana) crystal.classList.add('filled');
        elements.opponentManaCrystals.appendChild(crystal);
    }
}

// Update health bars
function updateHealthBars() {
    elements.playerHP.textContent = gameState.playerHP;
    elements.opponentHP.textContent = gameState.opponentHP;
    
    const playerHPPercentage = (gameState.playerHP / 30) * 100;
    const opponentHPPercentage = (gameState.opponentHP / 30) * 100;
    
    elements.playerHPFill.style.width = `${playerHPPercentage}%`;
    elements.opponentHPFill.style.width = `${opponentHPPercentage}%`;
    
    // Change color based on HP
    if (playerHPPercentage < 30) {
        elements.playerHPFill.style.backgroundColor = '#f44336'; // red
    } else if (playerHPPercentage < 60) {
        elements.playerHPFill.style.backgroundColor = '#ff9800'; // orange
    } else {
        elements.playerHPFill.style.backgroundColor = '#4caf50'; // green
    }
    
    if (opponentHPPercentage < 30) {
        elements.opponentHPFill.style.backgroundColor = '#f44336';
    } else if (opponentHPPercentage < 60) {
        elements.opponentHPFill.style.backgroundColor = '#ff9800';
    } else {
        elements.opponentHPFill.style.backgroundColor = '#4caf50';
    }
}

// Card selection logic
function selectCard(card) {
    // Check if card is playable before allowing selection
    if (card.cost > gameState.playerMana) {
        console.log(`Cannot select ${card.name} - insufficient mana (${card.cost} > ${gameState.playerMana})`);
        return;
    }
    
    // If a card is already selected, deselect it
    if (gameState.selectedCard) {
        const selectedCardElement = document.querySelector('.card.selected');
        if (selectedCardElement) {
            selectedCardElement.classList.remove('selected');
        }
    }
    
    // Select new card if it's different from the current one
    if (!gameState.selectedCard || gameState.selectedCard.id !== card.id) {
        gameState.selectedCard = card;
        const cardElement = document.querySelector(`.card[data-card-id="${card.id}"]`);
        cardElement.classList.add('selected');
        
        // Highlight empty field positions
        highlightEmptyPositions();
    } else {
        // If the same card was clicked again, deselect it
        gameState.selectedCard = null;
        clearHighlights();
    }
}

// Highlight empty field positions
function highlightEmptyPositions() {
    clearHighlights();
    
    for (const position of ['left', 'center', 'right']) {
        if (!gameState.playerField[position]) {
            elements.playerFieldCells[position].classList.add('highlight');
            
            // Add event listener for placing card
            elements.playerFieldCells[position].addEventListener('click', () => {
                placeCard(position);
            });
        }
    }
}

// Clear highlights
function clearHighlights() {
    for (const position of ['left', 'center', 'right']) {
        elements.playerFieldCells[position].classList.remove('highlight');
        
        // Remove event listeners
        const oldElement = elements.playerFieldCells[position];
        const newElement = oldElement.cloneNode(true);
        oldElement.parentNode.replaceChild(newElement, oldElement);
        elements.playerFieldCells[position] = newElement;
    }
}

// Place card on the field
function placeCard(position) {
    const card = gameState.selectedCard;
    // Always use gameState.playerMana for validation
    const playerMana = gameState.playerMana;

    if (card && card.cost <= playerMana) {
        // Always place in local playerField
        gameState.playerField[position] = card;

        socket.emit('placeCard', {
            roomId,
            position,
            card
        });

        const cardIndex = gameState.playerHand.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) gameState.playerHand.splice(cardIndex, 1);

        gameState.selectedCard = null;

        renderPlayerHand();
        renderField();
        renderManaCrystals();
        clearHighlights();
    }
}

// Render field
function renderField() {
    // Render player's field
    for (const position of ['left', 'center', 'right']) {
        elements.playerFieldCells[position].innerHTML = '';
        
        if (gameState.playerField[position]) {
            const cardElement = createCardElement(gameState.playerField[position], true);
            elements.playerFieldCells[position].appendChild(cardElement);
        }
    }
    
    // Render opponent's field
    for (const position of ['left', 'center', 'right']) {
        elements.opponentFieldCells[position].innerHTML = '';
        
        if (gameState.opponentField[position]) {
            const cardElement = createCardElement(gameState.opponentField[position], true);
            elements.opponentFieldCells[position].appendChild(cardElement);
        }
    }
}

// Timer management and ready state handling
function resetReadyStates() {
    gameState.isPlayerReady = false;
    gameState.isOpponentReady = false;
    elements.readyButton.disabled = false;
    elements.statusMessage.textContent = 'Your turn...';
}

// Handle ready button click
elements.readyButton.addEventListener('click', () => {
    if (gameState.isPlayerReady) return; // Prevent double-clicking
    
    gameState.isPlayerReady = true;
    elements.readyButton.disabled = true;

    socket.emit('playerReady', roomId);
    checkBothReady();
});

// Relay the button click functional data
socket.on('playerReady', () => {
    if (gameState.isOpponentReady) return; // Prevent duplicate ready states
    
    gameState.isOpponentReady = true;
    elements.statusMessage.textContent = 'Opponent is READY. Waiting for combat...';
    checkBothReady();
});

socket.on('opponentReady', () => {
    if (gameState.isOpponentReady) return; // Prevent duplicate ready states
    
    gameState.isOpponentReady = true;
    elements.statusMessage.textContent = 'Opponent is READY. Waiting for combat...';
    checkBothReady();
});

// Ready state checking and timer management
function checkBothReady() {
    if (gameState.isPlayerReady && gameState.isOpponentReady && !combatInProgress && !gameState.gameOver) {
        combatInProgress = true; // Set flag to prevent multiple executions
        elements.statusMessage.textContent = 'Combat phase...';
        
        // Clear the timer since both players are ready
        clearTimer();
        
        setTimeout(() => {
            executeCombatPhase();
        }, 1000);
    }
}

// Proper timer management
function clearTimer() {
    if (currentTimerInterval) {
        clearInterval(currentTimerInterval);
        currentTimerInterval = null;
    }
}

// Execute combat phase
function executeCombatPhase() {
    const positions = ['left', 'center', 'right'];
    
    for (const position of positions) {
        const playerCard = gameState.playerField[position];
        const opponentCard = gameState.opponentField[position];
        
        if (playerCard && opponentCard) {
            // Card vs card combat
            combatAnimation(elements.playerFieldCells[position], elements.opponentFieldCells[position]);

            // Initial defense SPONGEBOB SQUAREPANTS SPONGEBOB SQUAREPANTS
            const initialPlayerDefense = playerCard.attack;
            const initialOpponentDefense = opponentCard.attack;

            // Apply damage
            opponentCard.defense -= playerCard.attack;
            playerCard.defense -= opponentCard.attack;

            // Check if cards are destroyed
            let excessDamage = 0;

            if (opponentCard.defense <= 0) {
                excessDamage = Math.abs(opponentCard.defense);
                playerCard.attack = Math.max(0, playerCard.attack - initialOpponentDefense); // Subtract damage

                gameState.opponentField[position] = null;
                
                // Deal excess damage to opponent
                if (excessDamage > 0) {
                    gameState.opponentHP -= excessDamage;
                }
            }
            
            if (playerCard.defense <= 0) {
                excessDamage = Math.abs(playerCard.defense);
                opponentCard.attack = Math.max(0, opponentCard.attack - initialPlayerDefense); // Subtract damage

                gameState.playerField[position] = null;
                
                // Deal excess damage to player
                if (excessDamage > 0) {
                    gameState.playerHP -= excessDamage;
                }
            }
        } else if (playerCard && !opponentCard) {
            // Direct attack to opponent
            directAttackAnimation(elements.playerFieldCells[position], 'opponent');
            gameState.opponentHP -= playerCard.attack;
        } else if (!playerCard && opponentCard) {
            // Direct attack to player
            directAttackAnimation(elements.opponentFieldCells[position], 'player');
            gameState.playerHP -= opponentCard.attack;
        }
    }
    
    // Update UI
    renderField();
    updateHealthBars();
    
    // Check for game over
    if (gameState.playerHP <= 0 || gameState.opponentHP <= 0) {
        endGame();
    } else {
        // Request new card from server instead of drawing from local deck
        socket.emit('requestNewCard', roomId);
    }
}

// Combat animation
function combatAnimation(playerCell, opponentCell) {
    playerCell.classList.add('attacking');
    opponentCell.classList.add('defending');
    
    setTimeout(() => {
        playerCell.classList.remove('attacking');
        opponentCell.classList.remove('defending');
    }, 500);
}

// Direct attack animation
function directAttackAnimation(attackerCell, target) {
    attackerCell.classList.add('attacking');
    
    if (target === 'player') {
        document.querySelector('.player-avatar').classList.add('damaged');
        
        setTimeout(() => {
            document.querySelector('.player-avatar').classList.remove('damaged');
        }, 500);
    } else {
        document.querySelector('.opponent-avatar').classList.add('damaged');
        
        setTimeout(() => {
            document.querySelector('.opponent-avatar').classList.remove('damaged');
        }, 500);
    }
    
    setTimeout(() => {
        attackerCell.classList.remove('attacking');
    }, 500);
}

// Round timer with proper cleanup
function startRoundTimer() {
    // Clear any existing timer first
    clearTimer();
    
    gameState.timeLeft = 30;
    elements.timer.textContent = gameState.timeLeft;
    
    currentTimerInterval = setInterval(() => {
        if (gameState.gameOver || combatInProgress) {
            clearTimer();
            return;
        }
        
        gameState.timeLeft--;
        elements.timer.textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            clearTimer();
            
            // Auto-ready if timer expires and player hasn't readied yet
            if (!gameState.isPlayerReady) {
                gameState.isPlayerReady = true;
                elements.readyButton.disabled = true;
                socket.emit('playerReady', roomId);
            }
            
            checkBothReady();
        }
    }, 1000);
}

// Game ends
function endGame() {
    // Clear any running timer
    clearTimer();
    
    // Reset combat flag
    combatInProgress = false;
    
    let winner = null;
    let isDraw = false;
    
    if (gameState.playerHP <= 0 && gameState.opponentHP <= 0 && gameState.gameOver === false) {
        isDraw = true;
        elements.gameOverMessage.textContent = 'Game Over - Draw!';
    } else if (gameState.playerHP <= 0 && gameState.gameOver === false) {
        winner = 'opponent';
        elements.gameOverMessage.textContent = 'Game Over - You Lose!';
    } else if (gameState.opponentHP <= 0 && gameState.gameOver === false) {
        winner = 'player';
        elements.gameOverMessage.textContent = 'Game Over - You Win!';
    }
    
    // Only send game result if this client is the designated "player" role
    // This prevents duplicate processing from both clients
    if (!gameState.gameOver && isPlayer) {
        socket.emit('gameResult', {
            roomId: roomId,
            winner: winner,
            loser: winner === 'player' ? 'opponent' : winner === 'opponent' ? 'player' : null,
            isDraw: isDraw
        });
    }
    
    gameState.gameOver = true;
    elements.gameOverModal.style.display = 'flex';
}

// Complete game reset for play again
function resetGameState() {
    // Clear any running timer
    clearTimer();
    
    // Reset combat flag
    combatInProgress = false;
    
    // Reset game state completely
    gameState.playerHand = [];
    gameState.opponentHand = [];
    gameState.playerField = { left: null, center: null, right: null };
    gameState.opponentField = { left: null, center: null, right: null };
    gameState.playerMana = 3;
    gameState.opponentMana = 3;
    gameState.playerHP = 30;
    gameState.opponentHP = 30;
    gameState.round = 1;
    gameState.isPlayerReady = false;
    gameState.isOpponentReady = false;
    gameState.selectedCard = null;
    gameState.selectedPosition = null;
    gameState.gameOver = false;
    gameState.winner = null;
    gameState.timeLeft = 30;
    gameState.deckCount = 0;
    
    // Reset UI elements
    elements.roundNumber.textContent = 1;
    elements.statusMessage.textContent = 'Finding new opponent...';
    elements.readyButton.disabled = false;
    elements.timer.textContent = 30;
    
    // Clear any selected cards or highlights
    clearHighlights();
    const selectedCards = document.querySelectorAll('.card.selected');
    selectedCards.forEach(card => card.classList.remove('selected'));
    
    // Reset room ID
    roomId = null;
    isPlayer = null;
}

// Play Again Button
elements.playAgainButton.addEventListener('click', () => {
    // Hide modal first
    elements.gameOverModal.style.display = 'none';
    
    // Complete reset
    resetGameState();
    
    // Re-render everything
    renderPlayerHand();
    renderField();
    renderManaCrystals();
    updateHealthBars();
    updateDeckCount();
    
    // Reinitialize game - join queue again
    initializeMultiplayer();
});

// Handle mana updates and re-render hand for card playability
socket.on('manaUpdate', ({ mana }) => {
    gameState.playerMana = mana;
    renderManaCrystals();
    renderPlayerHand(); // Re-render to update card playability
});

// Socket event handlers for server-managed deck
socket.on('cardPlaced', ({ position, card, opponentMana }) => {
    // Always place opponent's card into opponentField
    gameState.opponentField[position] = card;

    // Remove the card from the simulated opponent hand
    const index = gameState.opponentHand.findIndex(c => c.id === card.id);
    if (index !== -1) {
        gameState.opponentHand.splice(index, 1);
    }

    // Update opponent mana from server
    gameState.opponentMana = opponentMana;

    renderField();
    renderManaCrystals();
});

// Handle new card drawn from server
socket.on('newCardDrawn', ({ card, deckCount }) => {
    gameState.playerHand.push(card);
    gameState.deckCount = deckCount;
    
    renderPlayerHand();
    updateDeckCount();
    
    // Continue to next round after drawing card
    startNextRound();
});

// Handle deck count updates
socket.on('deckCountUpdate', ({ deckCount }) => {
    gameState.deckCount = deckCount;
    updateDeckCount();
});

// Handle new round from server with proper state reset
socket.on('newRound', ({ round, deckCount, playerMana, opponentMana }) => {
    gameState.round = round;
    gameState.deckCount = deckCount;
    gameState.playerMana = playerMana;
    gameState.opponentMana = opponentMana;
    
    // Reset states properly
    resetReadyStates();
    combatInProgress = false;
    
    elements.roundNumber.textContent = round;
    
    renderManaCrystals();
    renderPlayerHand(); // Re-render to update card playability with new mana
    updateDeckCount();
    startRoundTimer();
});

function startNextRound() {
    gameState.round++;
    elements.roundNumber.textContent = gameState.round;
    
    // Reset ready states and combat flag properly
    resetReadyStates();
    combatInProgress = false;
    
    // Update UI
    renderPlayerHand();
    renderManaCrystals();
    updateDeckCount();
    
    // Start round timer
    startRoundTimer();
}

// Handle player disconnection
socket.on('playerDisconnected', () => {
    elements.statusMessage.textContent = 'Opponent disconnected. Game ended.';
    
    // Clear timer
    clearTimer();
    
    // Show game over modal
    elements.gameOverMessage.textContent = 'Game Over - Opponent Disconnected!';
    elements.gameOverModal.style.display = 'flex';
});

async function initializeMultiplayer() {
    return new Promise((resolve) => {
        socket.emit('joinQueue');

        socket.once('startGame', ({ roomId: id, playerRoles, initialHand, deckCount, playerMana, opponentMana }) => {
            roomId = id;
            isPlayer = (playerRoles[socket.id] === 'player');
            gameState.playerHand = initialHand;
            gameState.deckCount = deckCount;
            gameState.playerMana = playerMana;
            gameState.opponentMana = opponentMana;
            
            console.log(`Assigned role: ${isPlayer ? 'Player 1' : 'Player 2'}`);
            console.log(`Initial hand:`, initialHand);
            console.log(`Deck count:`, deckCount);
            
            // Start the game properly
            updateDeckCount();
            renderPlayerHand();
            renderField();
            renderManaCrystals();
            updateHealthBars();
            startRoundTimer();
            
            resolve();
        });

        socket.on('waitingForOpponent', () => {
            console.log("Waiting for another player...");
            elements.statusMessage.textContent = 'Waiting for opponent...';
        });
    });
}

// Initialize the game
window.addEventListener('DOMContentLoaded', async function () {
    await initializeGame();
});

async function initializeGame() {
    console.log("Initializing multiplayer game...");
    await initializeMultiplayer();
}