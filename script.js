// Game State
let gameState = {
    mode: null,
    currentPlayer: 'X',
    gameActive: true,
    board: ['', '', '', '', '', '', '', '', ''],
    scores: {
        player1: 0,
        player2: 0,
        human: 0,
        computer: 0,
        draws: 0
    },
    winningCells: [],
    humanSide: 'X',
    difficulty: 'easy'
};

// Winning Combinations
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const game2Player = document.getElementById('game-2player');
const gameComputer = document.getElementById('game-computer');
const winMessage = document.getElementById('win-message');
const winnerText = document.getElementById('winner-text');
const messageText = document.getElementById('message-text');

// Initialize Game
function initGame(mode) {
    gameState.mode = mode;
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.gameActive = true;
    gameState.winningCells = [];
    gameState.currentPlayer = 'X';
    
    // Hide selection screen, show game screen
    selectionScreen.style.display = 'none';
    
    if (mode === '2player') {
        game2Player.style.display = 'block';
        gameComputer.style.display = 'none';
        createGrid('board-2player');
    } else {
        game2Player.style.display = 'none';
        gameComputer.style.display = 'block';
        createGrid('board-computer');
        
        // If human plays as O, computer goes first
        if (gameState.humanSide === 'O') {
            gameState.currentPlayer = 'X'; // Computer starts
            setTimeout(computerMove, 500);
        }
    }
    
    updateScores();
    updateTurnIndicator();
}

// Create Game Grid
function createGrid(boardId) {
    const board = document.getElementById(boardId);
    board.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const box = document.createElement('button');
        box.className = 'box';
        box.dataset.index = i;
        box.onclick = () => handleBoxClick(i);
        board.appendChild(box);
    }
}

// Handle Box Click
function handleBoxClick(index) {
    if (!gameState.gameActive || gameState.board[index] !== '') return;
    
    if (gameState.mode === 'computer' && gameState.currentPlayer !== gameState.humanSide) {
        return; // Not player's turn
    }
    
    // Make move
    makeMove(index, gameState.currentPlayer);
    
    // Check for win or draw
    if (checkWin(gameState.currentPlayer)) {
        handleWin(gameState.currentPlayer);
    } else if (checkDraw()) {
        handleDraw();
    } else {
        // Switch player
        gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
        updateTurnIndicator();
        
        // Computer's turn
        if (gameState.mode === 'computer' && gameState.currentPlayer !== gameState.humanSide) {
            setTimeout(computerMove, 500);
        }
    }
}

// Make Move - FIXED HERE
function makeMove(index, player) {
    gameState.board[index] = player;
    const boardId = gameState.mode === '2player' ? 'board-2player' : 'board-computer';
    const box = document.querySelector(`#${boardId} .box[data-index="${index}"]`);
    box.textContent = player;
    box.classList.add(player.toLowerCase());
    box.classList.add('occupied');
}

// Computer Move
function computerMove() {
    if (!gameState.gameActive) return;
    
    let moveIndex;
    
    if (gameState.difficulty === 'easy') {
        moveIndex = getRandomMove();
    } else {
        moveIndex = getMediumMove();
    }
    
    if (moveIndex !== -1) {
        makeMove(moveIndex, gameState.currentPlayer);
        
        if (checkWin(gameState.currentPlayer)) {
            handleWin(gameState.currentPlayer);
        } else if (checkDraw()) {
            handleDraw();
        } else {
            gameState.currentPlayer = gameState.humanSide;
            updateTurnIndicator();
        }
    }
}

// Get Random Move (Easy)
function getRandomMove() {
    const emptyCells = [];
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') emptyCells.push(i);
    }
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
}

// Get Medium Move
function getMediumMove() {
    const computerSymbol = gameState.currentPlayer;
    const humanSymbol = gameState.humanSide;
    
    // Try to win
    let winMove = findWinningMove(computerSymbol);
    if (winMove !== -1) return winMove;
    
    // Try to block human
    let blockMove = findWinningMove(humanSymbol);
    if (blockMove !== -1) return blockMove;
    
    // Take center if available
    if (gameState.board[4] === '') return 4;
    
    // Take a corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameState.board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Random move
    return getRandomMove();
}

// Find Winning Move
function findWinningMove(symbol) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];
        
        let emptyCount = 0;
        let matchCount = 0;
        let emptyIndex = -1;
        
        for (let i = 0; i < 3; i++) {
            if (cells[i] === '') {
                emptyCount++;
                emptyIndex = pattern[i];
            } else if (cells[i] === symbol) {
                matchCount++;
            }
        }
        
        if (matchCount === 2 && emptyCount === 1) {
            return emptyIndex;
        }
    }
    return -1;
}

// Check Win
function checkWin(player) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState.board[a] === player && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            gameState.winningCells = pattern;
            return true;
        }
    }
    return false;
}

// Check Draw
function checkDraw() {
    return !gameState.board.includes('');
}

// Handle Win
function handleWin(winner) {
    gameState.gameActive = false;
    
    // Update scores
    if (gameState.mode === '2player') {
        if (winner === 'X') {
            gameState.scores.player1++;
        } else {
            gameState.scores.player2++;
        }
    } else {
        if (winner === gameState.humanSide) {
            gameState.scores.human++;
        } else {
            gameState.scores.computer++;
        }
    }
    
    // Highlight winning cells
    highlightWinningCells();
    
    // Show win message
    showWinMessage(winner, 'wins!');
}

// Handle Draw
function handleDraw() {
    gameState.gameActive = false;
    gameState.scores.draws++;
    showWinMessage(null, "It's a draw!");
}

// Highlight Winning Cells - FIXED HERE
function highlightWinningCells() {
    const boardId = gameState.mode === '2player' ? 'board-2player' : 'board-computer';
    gameState.winningCells.forEach(index => {
        const box = document.querySelector(`#${boardId} .box[data-index="${index}"]`);
        box.classList.add('win');
        box.style.backgroundColor = '#ffeb3b'; 
        box.style.boxShadow = '0 0 30px #ffcc00';
    });
}

// Show Win Message
function showWinMessage(winner, message) {
    if (winner) {
        if (gameState.mode === '2player') {
            winnerText.textContent = `Player ${winner === 'X' ? '1' : '2'} ${message}`;
        } else {
            if (winner === gameState.humanSide) {
                winnerText.textContent = `You ${message}`;
            } else {
                winnerText.textContent = `Computer ${message}`;
            }
        }
    } else {
        winnerText.textContent = message;
    }
    
    messageText.textContent = winner ? 'Well played!' : 'Try again!';
    winMessage.style.display = 'flex';
}

// Play Again
function playAgain() {
    winMessage.style.display = 'none';
    initGame(gameState.mode);
}

// Back to Menu
function backToMenu() {
    winMessage.style.display = 'none';
    game2Player.style.display = 'none';
    gameComputer.style.display = 'none';
    selectionScreen.style.display = 'block';
}

// Reset Game
function resetGame(mode) {
    initGame(mode);
}

// Reset Scores
function resetScores(mode) {
    if (mode === '2player') {
        gameState.scores.player1 = 0;
        gameState.scores.player2 = 0;
    } else {
        gameState.scores.human = 0;
        gameState.scores.computer = 0;
    }
    gameState.scores.draws = 0;
    updateScores();
}

// Update Scores Display
function updateScores() {
    document.getElementById('score1').textContent = gameState.scores.player1;
    document.getElementById('score2').textContent = gameState.scores.player2;
    document.getElementById('score-human').textContent = gameState.scores.human;
    document.getElementById('score-computer').textContent = gameState.scores.computer;
}

// Update Turn Indicator
function updateTurnIndicator() {
    if (gameState.mode === '2player') {
        const indicator = document.getElementById('turn-indicator-2p');
        indicator.innerHTML = `<span>Player ${gameState.currentPlayer === 'X' ? '1' : '2'}'s Turn (${gameState.currentPlayer})</span>`;
    } else {
        const indicator = document.getElementById('turn-indicator-comp');
        if (gameState.currentPlayer === gameState.humanSide) {
            indicator.innerHTML = `<span>Your Turn (${gameState.humanSide})</span>`;
        } else {
            indicator.innerHTML = `<span>Computer's Turn</span>`;
        }
    }
}

// Set Difficulty
function setDifficulty(difficulty) {
    gameState.difficulty = difficulty;
}

// Set Side - FIXED HERE (added parameter)
function setSide(side) {
    gameState.humanSide = side;
    
    // Update button styles
    document.querySelectorAll('.side-btn').forEach(btn => {
        if (btn.textContent.includes(side)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Reset game with new side
    if (gameState.mode === 'computer') {
        resetGame('computer');
    }
}

// Event Listeners
document.getElementById('play-2player').onclick = () => initGame('2player');
document.getElementById('play-computer').onclick = () => initGame('computer');

// Initialize
updateScores();