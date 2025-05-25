class AIOpponent {
    constructor(socket, roomId, gameRoom, gameRooms) {
        this.socket = socket;
        this.roomId = roomId;
        this.gameRoom = gameRoom;
        this.gameRooms = gameRooms;
        this.isActive = true;
        this.difficulty = 'medium'; // easy, medium, hard
        this.thinkingTime = this.getThinkingTime();
        this.playerId = this.findAIPlayerId();
        
        // AI decision weights based on difficulty
        this.weights = this.getDifficultyWeights();
        
        // Track AI state
        this.hasActedThisRound = false;
        this.roundStartTime = null;
        
        // console.log(`AI opponent initialized for room ${roomId} with difficulty: ${this.difficulty}`);
        this.startAI();
    }

    findAIPlayerId() {
        // Find which player ID belongs to the AI (not the human socket)
        const playerIds = Object.keys(this.gameRoom.players);
        return playerIds.find(id => id !== this.socket.id);
    }

    getDifficultyWeights() {
        switch (this.difficulty) {
            case 'easy':
                return {
                    aggressive: 0.3,
                    defensive: 0.2,
                    efficient: 0.1,
                    random: 0.4
                };
            case 'medium':
                return {
                    aggressive: 0.4,
                    defensive: 0.3,
                    efficient: 0.2,
                    random: 0.1
                };
            case 'hard':
                return {
                    aggressive: 0.3,
                    defensive: 0.4,
                    efficient: 0.4,
                    random: 0.0
                };
            default:
                return this.getDifficultyWeights('medium');
        }
    }

    getThinkingTime() {
        switch (this.difficulty) {
            case 'easy':
                return { min: 3000, max: 8000 }; // 3-8 seconds
            case 'medium':
                return { min: 2000, max: 6000 }; // 2-6 seconds
            case 'hard':
                return { min: 1000, max: 4000 }; // 1-4 seconds
            default:
                return { min: 2000, max: 6000 };
        }
    }

    getRandomThinkingDelay() {
        const { min, max } = this.thinkingTime;
        return Math.random() * (max - min) + min;
    }

    startAI() {
        if (!this.isActive) return;
        
        // Reset round state
        this.hasActedThisRound = false;
        this.roundStartTime = Date.now();
        
        // Start AI turn with thinking delay
        const delay = this.getRandomThinkingDelay();
        
        setTimeout(() => {
            if (this.isActive && !this.hasActedThisRound) {
                this.takeTurn();
            }
        }, delay);
    }

    takeTurn() {
        if (!this.isActive || this.hasActedThisRound) return;
        
        const currentGameRoom = this.gameRooms.get(this.roomId);
        if (!currentGameRoom || !currentGameRoom.players[this.playerId]) {
            this.deactivate();
            return;
        }

        const aiPlayer = currentGameRoom.players[this.playerId];
        
        // Make AI decisions
        this.makeDecisions(aiPlayer, currentGameRoom);
        
        // Mark as acted this round
        this.hasActedThisRound = true;
        
        // Auto-ready after a short delay
        setTimeout(() => {
            if (this.isActive) {
                this.setReady();
            }
        }, this.getRandomThinkingDelay() * 0.3);
    }

    makeDecisions(aiPlayer, gameRoom) {
        const playableCards = this.getPlayableCards(aiPlayer);
        const emptyPositions = this.getEmptyPositions(aiPlayer);
        
        // Decide how many cards to play based on strategy
        const cardsToPlay = this.decideCardCount(playableCards, aiPlayer.mana);
        
        // Play cards based on strategy
        for (let i = 0; i < cardsToPlay && playableCards.length > 0 && emptyPositions.length > 0; i++) {
            const cardChoice = this.chooseCard(playableCards, aiPlayer, gameRoom);
            const positionChoice = this.choosePosition(emptyPositions, cardChoice, aiPlayer, gameRoom);
            
            if (cardChoice && positionChoice) {
                this.placeCard(cardChoice, positionChoice, aiPlayer);
                
                // Update arrays for next iteration
                playableCards.splice(playableCards.indexOf(cardChoice), 1);
                emptyPositions.splice(emptyPositions.indexOf(positionChoice), 1);
            }
        }
    }

    getPlayableCards(aiPlayer) {
        return aiPlayer.hand.filter(card => card.cost <= aiPlayer.mana);
    }

    getEmptyPositions(aiPlayer) {
        const positions = [];
        if (!aiPlayer.field.left) positions.push('left');
        if (!aiPlayer.field.center) positions.push('center');
        if (!aiPlayer.field.right) positions.push('right');
        return positions;
    }

    decideCardCount(playableCards, mana) {
        if (playableCards.length === 0) return 0;
        
        // Strategy based on difficulty and game state
        const maxAffordable = Math.floor(mana / Math.min(...playableCards.map(c => c.cost)));
        const maxPossible = Math.min(maxAffordable, playableCards.length, 3);
        
        // Random factor based on difficulty
        const randomFactor = Math.random();
        
        switch (this.difficulty) {
            case 'easy':
                return Math.max(1, Math.floor(maxPossible * (0.3 + randomFactor * 0.4)));
            case 'medium':
                return Math.max(1, Math.floor(maxPossible * (0.5 + randomFactor * 0.4)));
            case 'hard':
                return Math.max(1, Math.min(maxPossible, Math.floor(maxPossible * (0.7 + randomFactor * 0.3))));
            default:
                return 1;
        }
    }

    chooseCard(playableCards, aiPlayer, gameRoom) {
        if (playableCards.length === 0) return null;
        
        // Get opponent field for strategic decisions
        const humanPlayerId = Object.keys(gameRoom.players).find(id => id !== this.playerId);
        const humanPlayer = gameRoom.players[humanPlayerId];
        
        // Score each card based on multiple factors
        const cardScores = playableCards.map(card => ({
            card,
            score: this.scoreCard(card, aiPlayer, humanPlayer, gameRoom)
        }));
        
        // Sort by score (highest first)
        cardScores.sort((a, b) => b.score - a.score);
        
        // Choose based on difficulty (higher difficulty = better choices)
        const randomFactor = Math.random();
        let choiceIndex;
        
        switch (this.difficulty) {
            case 'easy':
                choiceIndex = Math.floor(randomFactor * cardScores.length);
                break;
            case 'medium':
                choiceIndex = Math.floor(randomFactor * randomFactor * cardScores.length);
                break;
            case 'hard':
                choiceIndex = Math.floor(Math.pow(randomFactor, 3) * cardScores.length);
                break;
            default:
                choiceIndex = 0;
        }
        
        return cardScores[choiceIndex].card;
    }

    scoreCard(card, aiPlayer, humanPlayer, gameRoom) {
        let score = 0;
        
        // Base stats value
        score += (card.attack * 2 + card.defense) / card.cost;
        
        // Mana efficiency
        score += this.weights.efficient * (10 - card.cost);
        
        // Aggressive play (high attack)
        score += this.weights.aggressive * card.attack;
        
        // Defensive play (high defense)
        score += this.weights.defensive * card.defense;
        
        // Counter-play against human field
        score += this.evaluateCounterPlay(card, humanPlayer);
        
        // Random factor
        score += this.weights.random * Math.random() * 10;
        
        return score;
    }

    evaluateCounterPlay(card, humanPlayer) {
        let counterScore = 0;
        
        // Check if this card can counter human's cards
        Object.values(humanPlayer.field).forEach(humanCard => {
            if (humanCard) {
                // Favor cards that can kill human cards
                if (card.attack >= humanCard.defense) {
                    counterScore += 5;
                }
                // Favor cards that can survive human attacks
                if (card.defense > humanCard.attack) {
                    counterScore += 3;
                }
            }
        });
        
        return counterScore;
    }

    choosePosition(emptyPositions, card, aiPlayer, gameRoom) {
        if (emptyPositions.length === 0) return null;
        if (emptyPositions.length === 1) return emptyPositions[0];
        
        // Strategic position choice
        const humanPlayerId = Object.keys(gameRoom.players).find(id => id !== this.playerId);
        const humanPlayer = gameRoom.players[humanPlayerId];
        
        const positionScores = emptyPositions.map(position => ({
            position,
            score: this.scorePosition(position, card, aiPlayer, humanPlayer)
        }));
        
        positionScores.sort((a, b) => b.score - a.score);
        
        // Choose position based on difficulty
        const randomFactor = Math.random();
        let choiceIndex;
        
        switch (this.difficulty) {
            case 'easy':
                choiceIndex = Math.floor(randomFactor * positionScores.length);
                break;
            case 'medium':
                choiceIndex = Math.floor(randomFactor * randomFactor * positionScores.length);
                break;
            case 'hard':
                choiceIndex = Math.floor(Math.pow(randomFactor, 2) * positionScores.length);
                break;
            default:
                choiceIndex = 0;
        }
        
        return positionScores[choiceIndex].position;
    }

    scorePosition(position, card, aiPlayer, humanPlayer) {
        let score = Math.random() * 2; // Base random score
        
        // Check what's across from this position
        const oppositeCard = humanPlayer.field[position];
        
        if (oppositeCard) {
            // There's an enemy card across
            if (card.attack >= oppositeCard.defense) {
                score += 10; // Can kill enemy card
            } else if (card.defense > oppositeCard.attack) {
                score += 5; // Can survive enemy attack
            } else {
                score -= 3; // Unfavorable matchup
            }
        } else {
            // Empty across - direct attack opportunity
            score += card.attack * 2; // Value direct damage
        }
        
        // Positional preferences (center slightly favored)
        if (position === 'center') {
            score += 1;
        }
        
        return score;
    }

    placeCard(card, position, aiPlayer) {
        if (!this.isActive) return;
        
        // Verify the move is legal
        if (card.cost > aiPlayer.mana || aiPlayer.field[position]) {
            console.warn(`AI attempted illegal move: ${card.name} to ${position}`);
            return;
        }
        
        // Remove card from hand and place on field
        const cardIndex = aiPlayer.hand.findIndex(c => c.id === card.id);
        if (cardIndex === -1) {
            console.warn('AI tried to play card not in hand');
            return;
        }
        
        aiPlayer.hand.splice(cardIndex, 1);
        aiPlayer.field[position] = card;
        aiPlayer.mana -= card.cost;
        
        // console.log(`AI placed ${card.name} (${card.attack}/${card.defense}) at ${position} for ${card.cost} mana`);
        
        // Notify human player about AI's move
        this.socket.emit('cardPlaced', { 
            position, 
            card, 
            opponentMana: aiPlayer.mana 
        });
        
        // Update deck count for human player
        const currentGameRoom = this.gameRooms.get(this.roomId);
        if (currentGameRoom) {
            this.socket.emit('deckCountUpdate', { deckCount: currentGameRoom.deck.length });
        }
    }

    setReady() {
        if (!this.isActive) return;
        
        const currentGameRoom = this.gameRooms.get(this.roomId);
        if (!currentGameRoom || !currentGameRoom.players[this.playerId]) {
            this.deactivate();
            return;
        }
        
        // Set AI as ready
        currentGameRoom.players[this.playerId].ready = true;
        
        // console.log('AI is ready for combat');
        
        // Notify human player
        this.socket.emit('playerReady');
        
        // Check if both players are ready
        const allReady = Object.values(currentGameRoom.players).every(p => p.ready);
        if (allReady) {
            this.handleNextRound();
        }
    }

    handleNextRound() {
        const currentGameRoom = this.gameRooms.get(this.roomId);
        if (!currentGameRoom) {
            this.deactivate();
            return;
        }
        
        // Increment round
        currentGameRoom.round++;
        
        // Reset ready states and increase mana for both players
        const playerIds = Object.keys(currentGameRoom.players);
        Object.values(currentGameRoom.players).forEach(player => {
            player.ready = false;
            player.mana = Math.min(10, player.mana + 1);
            
            // Draw card if possible
            if (player.hand.length < 4 && currentGameRoom.deck.length > 0) {
                const newCard = currentGameRoom.deck.pop();
                player.hand.push(newCard);
                
                // Only send card to human player
                if (player.socket === this.socket) {
                    player.socket.emit('newCardDrawn', { 
                        card: newCard, 
                        deckCount: currentGameRoom.deck.length 
                    });
                }
            }
        });

        // Send round update to human player
        const humanPlayer = currentGameRoom.players[this.socket.id];
        const aiPlayer = currentGameRoom.players[this.playerId];
        
        this.socket.emit('newRound', {
            round: currentGameRoom.round,
            deckCount: currentGameRoom.deck.length,
            playerMana: humanPlayer.mana,
            opponentMana: aiPlayer.mana
        });
        
        // Reset AI state for new round
        this.hasActedThisRound = false;
        
        // Start AI turn for new round
        setTimeout(() => {
            if (this.isActive) {
                this.startAI();
            }
        }, this.getRandomThinkingDelay());
    }

    // Handle AI drawing cards
    handleCardDraw() {
        if (!this.isActive) return;
        
        const currentGameRoom = this.gameRooms.get(this.roomId);
        if (!currentGameRoom || !currentGameRoom.players[this.playerId]) {
            this.deactivate();
            return;
        }
        
        const aiPlayer = currentGameRoom.players[this.playerId];
        
        // Draw card if hand has less than 4 cards and deck has cards
        if (aiPlayer.hand.length < 4 && currentGameRoom.deck.length > 0) {
            const newCard = currentGameRoom.deck.pop();
            aiPlayer.hand.push(newCard);
            
            // console.log(`AI drew card: ${newCard.name}`);
            
            // Update deck count for human player
            this.socket.emit('deckCountUpdate', { deckCount: currentGameRoom.deck.length });
        }
    }

    // Check if game is over
    checkGameEnd() {
        const currentGameRoom = this.gameRooms.get(this.roomId);
        if (!currentGameRoom) {
            this.deactivate();
            return true;
        }
        
        const players = Object.values(currentGameRoom.players);
        const gameOver = players.some(player => player.hp <= 0);
        
        if (gameOver) {
            this.deactivate();
            return true;
        }
        
        return false;
    }

    // Deactivate AI
    deactivate() {
        // console.log(`AI opponent deactivated for room ${this.roomId}`);
        this.isActive = false;
    }

    // Check if AI should still be active
    shouldBeActive() {
        return this.isActive && 
               this.gameRooms.has(this.roomId) && 
               this.gameRooms.get(this.roomId).players[this.playerId];
    }
}

// Factory function to create AI opponent
function createAIOpponent(socket, roomId, gameRoom, gameRooms, difficulty = 'medium') {
    return new AIOpponent(socket, roomId, gameRoom, gameRooms, difficulty);
}

module.exports = { createAIOpponent, AIOpponent };