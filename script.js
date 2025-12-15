document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameGrid = document.getElementById('game-grid');
    const turnIndicator = document.getElementById('turn-indicator');
    const currentTurn = document.getElementById('turn-display');
    const scoreHumanElement = document.getElementById('score-human');
    const scoreComputerElement = document.getElementById('score-computer');
    const scoreDrawsElement = document.getElementById('score-draws');
    const gameModal = document.getElementById('game-modal');
    const pauseModal = document.getElementById('pause-modal');
    const winnerMessage = document.getElementById('winner-message');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalIcon = document.getElementById('modal-icon');
    
    // Mode elements
    const modePvP = document.getElementById('mode-pvp');
    const modePvC = document.getElementById('mode-pvc');
    const selectPvP = document.getElementById('select-pvp');
    const selectPvC = document.getElementById('select-pvc');
    const modeBadge = document.getElementById('mode-badge');
    const gameStatus = document.getElementById('game-status');
    
    // Player side elements
    const sideX = document.getElementById('side-x');
    const sideO = document.getElementById('side-o');
    
    // Difficulty elements
    const diffEasy = document.getElementById('diff-easy');
    const diffMedium = document.getElementById('diff-medium');
    const diffHard = document.getElementById('diff-hard');
    const diffDesc = document.getElementById('diff-desc');
    const diffBadge = document.getElementById('diff-badge');
    
    // Button elements
    const newGameBtn = document.getElementById('new-game-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const modalNewGameBtn = document.getElementById('modal-new-game');
    const modalCloseBtn = document.getElementById('modal-close');
    const resumeBtn = document.getElementById('resume-btn');
    const newGamePauseBtn = document.getElementById('new-game-pause');
    
    // Game state
    let gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameActive: true,
        gamePaused: false,
        gameMode: 'pvc', // 'pvp' or 'pvc'
        humanSide: 'X', // 'X' or 'O'
        difficulty: 'easy', // 'easy', 'medium', 'hard'
        scores: {
            human: 0,
            computer: 0,
            draws: 0
        },
        winningCells: []
    };
    
    // Winning combinations
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    // Initialize the game
    function initGame() {
        // Create game boxes
        gameGrid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const box = document.createElement('button');
            box.className = 'box';
            box.dataset.index = i;
            box.addEventListener('click', () => handleBoxClick(i));
            gameGrid.appendChild(box);
        }
        
        // Load saved scores from localStorage
        const savedScores = localStorage.getItem('ticTacToeSinglePlayerScores');
        if (savedScores) {
            gameState.scores = JSON.parse(savedScores);
            updateScoreDisplay();
        }
        
        // Set initial game state based on selected options
        if (gameState.gameMode === 'pvc') {
            // Player vs Computer mode
            gameStatus.textContent = 'Playing vs Computer';
            modeBadge.innerHTML = '<i class="fas fa-robot"></i> VS Computer';
            
            // If human plays as O, computer goes first
            if (gameState.humanSide === 'O') {
                gameState.currentPlayer = 'X'; // Computer starts
                setTimeout(computerMove, 500);
            }
        } else {
            // Player vs Player mode
            gameStatus.textContent = 'Player vs Player';
            modeBadge.innerHTML = '<i class="fas fa-users"></i> Player vs Player';
            gameState.currentPlayer = 'X'; // X always starts in PvP
        }
        
        updateGameDisplay();
    }
    
    // Handle box click
    function handleBoxClick(index) {
        if (!gameState.gameActive || gameState.gamePaused || 
            gameState.board[index] !== '' || 
            (gameState.gameMode === 'pvc' && gameState.currentPlayer !== gameState.humanSide)) {
            return;
        }
        
        // Make player move
        makeMove(index, gameState.currentPlayer);
        
        // Check for win or draw
        if (checkWin(gameState.currentPlayer)) {
            handleWin(gameState.currentPlayer);
        } else if (checkDraw()) {
            handleDraw();
        } else {
            // Switch player
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
            updateGameDisplay();
            
            // If in PvC mode and it's computer's turn
            if (gameState.gameMode === 'pvc' && gameState.currentPlayer !== gameState.humanSide) {
                setTimeout(computerMove, 500);
            }
        }
    }
    
    // Make a move on the board
    function makeMove(index, player) {
        gameState.board[index] = player;
        
        const boxElement = document.querySelector(`.box[data-index="${index}"]`);
        boxElement.textContent = player;
        boxElement.classList.add(player.toLowerCase());
        boxElement.disabled = true;
    }
    
    // Computer's move logic
    function computerMove() {
        if (!gameState.gameActive || gameState.gamePaused) return;
        
        let moveIndex;
        
        switch (gameState.difficulty) {
            case 'easy':
                moveIndex = getRandomMove();
                break;
            case 'medium':
                moveIndex = getMediumMove();
                break;
            case 'hard':
                moveIndex = getHardMove();
                break;
            default:
                moveIndex = getRandomMove();
        }
        
        if (moveIndex !== -1) {
            // Add a small delay for realism
            setTimeout(() => {
                makeMove(moveIndex, gameState.currentPlayer);
                
                // Check for win or draw
                if (checkWin(gameState.currentPlayer)) {
                    handleWin(gameState.currentPlayer);
                } else if (checkDraw()) {
                    handleDraw();
                } else {
                    // Switch back to human player
                    gameState.currentPlayer = gameState.humanSide;
                    updateGameDisplay();
                }
            }, 300);
        }
    }
    
    // Get random move (Easy difficulty)
    function getRandomMove() {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            if (gameState.board[i] === '') {
                emptyCells.push(i);
            }
        }
        
        if (emptyCells.length === 0) return -1;
        
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
    
    // Get medium difficulty move (tries to win or block)
    function getMediumMove() {
        const computerSymbol = gameState.currentPlayer;
        const humanSymbol = gameState.humanSide;
        
        // 1. Try to win
        let winMove = findWinningMove(computerSymbol);
        if (winMove !== -1) return winMove;
        
        // 2. Try to block human
        let blockMove = findWinningMove(humanSymbol);
        if (blockMove !== -1) return blockMove;
        
        // 3. Take center if available
        if (gameState.board[4] === '') return 4;
        
        // 4. Take a corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => gameState.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // 5. Random move
        return getRandomMove();
    }
    
    // Get hard difficulty move (MiniMax algorithm)
    function getHardMove() {
        const computerSymbol = gameState.currentPlayer;
        const humanSymbol = gameState.humanSide;
        
        // Use MiniMax algorithm for hard difficulty
        let bestScore = -Infinity;
        let bestMove;
        
        for (let i = 0; i < 9; i++) {
            if (gameState.board[i] === '') {
                gameState.board[i] = computerSymbol;
                let score = minimax(gameState.board, 0, false, computerSymbol, humanSymbol);
                gameState.board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove !== undefined ? bestMove : getMediumMove();
    }
    
    // MiniMax algorithm
    function minimax(board, depth, isMaximizing, computerSymbol, humanSymbol) {
        // Check terminal states
        if (checkWinForSymbol(board, computerSymbol)) return 10 - depth;
        if (checkWinForSymbol(board, humanSymbol)) return depth - 10;
        if (checkDrawForBoard(board)) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = computerSymbol;
                    let score = minimax(board, depth + 1, false, computerSymbol, humanSymbol);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = humanSymbol;
                    let score = minimax(board, depth + 1, true, computerSymbol, humanSymbol);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    // Find winning move for a symbol
    function findWinningMove(symbol) {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            const cells = [gameState.board[a], gameState.board[b], gameState.board[c]];
            
            // Count empty and matching cells
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
    
    // Check for win for specific symbol
    function checkWinForSymbol(board, symbol) {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === symbol && board[a] === board[b] && board[a] === board[c]) {
                return true;
            }
        }
        return false;
    }
    
    // Check for draw for specific board
    function checkDrawForBoard(board) {
        return !board.includes('');
    }
    
    // Check for win
    function checkWin(player) {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (
                gameState.board[a] === player &&
                gameState.board[a] === gameState.board[b] &&
                gameState.board[a] === gameState.board[c]
            ) {
                gameState.winningCells = pattern;
                return true;
            }
        }
        return false;
    }
    
    // Check for draw
    function checkDraw() {
        return !gameState.board.includes('');
    }
    
    // Handle win
    function handleWin(winner) {
        gameState.gameActive = false;
        
        // Update scores
        if (gameState.gameMode === 'pvp') {
            // In PvP mode
            if (winner === 'X') {
                gameState.scores.human++; // X is always human in PvP
            } else {
                gameState.scores.computer++; // O is human2/computer
            }
        } else {
            // In PvC mode
            if (winner === gameState.humanSide) {
                gameState.scores.human++;
            } else {
                gameState.scores.computer++;
            }
        }
        
        saveScores();
        updateScoreDisplay();
        
        // Highlight winning cells
        gameState.winningCells.forEach(index => {
            const box = document.querySelector(`.box[data-index="${index}"]`);
            box.classList.add('winning');
        });
        
        // Show win modal
        let title, subtitle, type;
        
        if (gameState.gameMode === 'pvp') {
            title = `Player ${winner} Wins!`;
            subtitle = 'Congratulations to the winner!';
            type = 'win';
        } else {
            if (winner === gameState.humanSide) {
                title = 'You Win!';
                subtitle = 'Congratulations on your victory!';
                type = 'win';
            } else {
                title = 'Computer Wins!';
                subtitle = 'Better luck next time!';
                type = 'lose';
            }
        }
        
        showModal(title, subtitle, type);
    }
    
    // Handle draw
    function handleDraw() {
        gameState.gameActive = false;
        gameState.scores.draws++;
        saveScores();
        updateScoreDisplay();
        
        showModal("It's a Draw!", 'The game ended in a tie. Try again!', 'draw');
    }
    
    // Show modal
    function showModal(title, subtitle, type) {
        winnerMessage.textContent = title;
        modalSubtitle.textContent = subtitle;
        
        // Update icon based on result type
        if (type === 'win') {
            modalIcon.innerHTML = '<i class="fas fa-trophy"></i>';
            modalIcon.className = 'modal-icon win';
        } else if (type === 'lose') {
            modalIcon.innerHTML = '<i class="fas fa-robot"></i>';
            modalIcon.className = 'modal-icon lose';
        } else {
            modalIcon.innerHTML = '<i class="fas fa-handshake"></i>';
            modalIcon.className = 'modal-icon draw';
        }
        
        gameModal.classList.add('active');
    }
    
    // Hide modal
    function hideModal() {
        gameModal.classList.remove('active');
        pauseModal.classList.remove('active');
    }
    
    // Reset the game board
    function resetBoard() {
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.gameActive = true;
        gameState.gamePaused = false;
        gameState.winningCells = [];
        
        // Set initial player based on mode and side
        if (gameState.gameMode === 'pvc') {
            gameState.currentPlayer = gameState.humanSide === 'X' ? 'X' : 'X'; // Human starts if X, computer starts if O
        } else {
            gameState.currentPlayer = 'X'; // X always starts in PvP
        }
        
        // Reset UI
        document.querySelectorAll('.box').forEach(box => {
            box.textContent = '';
            box.classList.remove('x', 'o', 'winning');
            box.disabled = false;
        });
        
        updateGameDisplay();
        hideModal();
        
        // If in PvC mode and computer should start
        if (gameState.gameMode === 'pvc' && gameState.humanSide === 'O') {
            setTimeout(computerMove, 500);
        }
    }
    
    // Start a new game
    function newGame() {
        resetBoard();
    }
    
    // Reset everything
    function resetAll() {
        gameState.scores = { human: 0, computer: 0, draws: 0 };
        saveScores();
        updateScoreDisplay();
        resetBoard();
    }
    
    // Pause game
    function pauseGame() {
        gameState.gamePaused = true;
        pauseModal.classList.add('active');
    }
    
    // Resume game
    function resumeGame() {
        gameState.gamePaused = false;
        pauseModal.classList.remove('active');
    }
    
    // Update game display
    function updateGameDisplay() {
        // Update turn indicator
        if (gameState.gameMode === 'pvp') {
            turnIndicator.textContent = `Player ${gameState.currentPlayer}'s Turn`;
            turnIndicator.className = `player-indicator ${gameState.currentPlayer === 'X' ? 'human' : 'computer'}`;
        } else {
            if (gameState.currentPlayer === gameState.humanSide) {
                turnIndicator.textContent = 'Your Turn';
                turnIndicator.className = 'player-indicator human';
            } else {
                turnIndicator.textContent = "Computer's Turn";
                turnIndicator.className = 'player-indicator computer';
            }
        }
        
        // Pulse animation for current player's turn
        if (gameState.gameActive && !gameState.gamePaused) {
            currentTurn.classList.add('active');
        } else {
            currentTurn.classList.remove('active');
        }
    }
    
    // Update score display
    function updateScoreDisplay() {
        scoreHumanElement.textContent = gameState.scores.human;
        scoreComputerElement.textContent = gameState.scores.computer;
        scoreDrawsElement.textContent = gameState.scores.draws;
    }
    
    // Save scores to localStorage
    function saveScores() {
        localStorage.setItem('ticTacToeSinglePlayerScores', JSON.stringify(gameState.scores));
    }
    
    // Set game mode
    function setGameMode(mode) {
        gameState.gameMode = mode;
        
        // Update UI
        if (mode === 'pvp') {
            modePvP.classList.add('active');
            modePvC.classList.remove('active');
            selectPvP.textContent = 'Selected';
            selectPvP.classList.add('active');
            selectPvC.textContent = 'Select';
            selectPvC.classList.remove('active');
            
            gameStatus.textContent = 'Player vs Player';
            modeBadge.innerHTML = '<i class="fas fa-users"></i> Player vs Player';
        } else {
            modePvP.classList.remove('active');
            modePvC.classList.add('active');
            selectPvP.textContent = 'Select';
            selectPvP.classList.remove('active');
            selectPvC.textContent = 'Selected';
            selectPvC.classList.add('active');
            
            gameStatus.textContent = 'Playing vs Computer';
            modeBadge.innerHTML = '<i class="fas fa-robot"></i> VS Computer';
        }
        
        resetBoard();
    }
    
    // Set human side
    function setHumanSide(side) {
        gameState.humanSide = side;
        
        // Update UI
        if (side === 'X') {
            sideX.classList.add('active');
            sideO.classList.remove('active');
        } else {
            sideX.classList.remove('active');
            sideO.classList.add('active');
        }
        
        resetBoard();
    }
    
    // Set difficulty
    function setDifficulty(difficulty) {
        gameState.difficulty = difficulty;
        
        // Update UI
        diffEasy.classList.remove('active');
        diffMedium.classList.remove('active');
        diffHard.classList.remove('active');
        
        let description = '';
        let badgeIcon = '';
        
        switch (difficulty) {
            case 'easy':
                diffEasy.classList.add('active');
                description = 'Computer makes random moves';
                badgeIcon = '<i class="fas fa-smile"></i>';
                break;
            case 'medium':
                diffMedium.classList.add('active');
                description = 'Computer tries to win or block';
                badgeIcon = '<i class="fas fa-meh"></i>';
                break;
            case 'hard':
                diffHard.classList.add('active');
                description = 'Computer uses advanced AI strategy';
                badgeIcon = '<i class="fas fa-brain"></i>';
                break;
        }
        
        diffDesc.textContent = description;
        diffBadge.innerHTML = `${badgeIcon} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    }
    
    // Event listeners for mode selection
    selectPvP.addEventListener('click', () => setGameMode('pvp'));
    selectPvC.addEventListener('click', () => setGameMode('pvc'));
    
    // Event listeners for side selection
    sideX.addEventListener('click', () => setHumanSide('X'));
    sideO.addEventListener('click', () => setHumanSide('O'));
    
    // Event listeners for difficulty selection
    diffEasy.addEventListener('click', () => setDifficulty('easy'));
    diffMedium.addEventListener('click', () => setDifficulty('medium'));
    diffHard.addEventListener('click', () => setDifficulty('hard'));
    
    // Event listeners for buttons
    newGameBtn.addEventListener('click', newGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetAllBtn.addEventListener('click', resetAll);
    modalNewGameBtn.addEventListener('click', () => {
        hideModal();
        newGame();
    });
    modalCloseBtn.addEventListener('click', hideModal);
    resumeBtn.addEventListener('click', resumeGame);
    newGamePauseBtn.addEventListener('click', () => {
        hideModal();
        newGame();
    });
    
    // Initialize the game
    initGame();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Spacebar to pause/resume
        if (e.code === 'Space') {
            if (gameState.gamePaused) {
                resumeGame();
            } else if (gameState.gameActive) {
                pauseGame();
            }
        }
        
        // Escape to close modals
        if (e.code === 'Escape') {
            hideModal();
        }
        
        // R to reset board
        if (e.code === 'KeyR' && e.ctrlKey) {
            resetBoard();
        }
        
        // N for new game
        if (e.code === 'KeyN' && e.ctrlKey) {
            newGame();
        }
    });
    
    // Add touch device optimization
    if ('ontouchstart' in window) {
        document.querySelectorAll('.box').forEach(box => {
            box.style.cursor = 'pointer';
        });
    }
});