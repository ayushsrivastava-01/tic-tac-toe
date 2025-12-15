document.addEventListener('DOMContentLoaded', () => {
    // Game State
    const gameState = {
        mode: null, // '2player' or 'computer'
        currentPlayer: 'X',
        gameActive: true,
        board: ['', '', '', '', '', '', '', '', ''],
        scores: {
            player1: 0,
            player2: 0,
            human: 0,
            computer: 0,
            draws: 0,
            totalGames: 0
        },
        winningCells: [],
        humanSide: 'X', // For computer mode
        difficulty: 'easy', // 'easy', 'medium', 'hard'
        isComputerThinking: false
    };

    // DOM Elements
    const mainMenu = document.getElementById('main-menu');
    const game2Player = document.getElementById('game-2player');
    const gameComputer = document.getElementById('game-computer');
    const celebration = document.getElementById('celebration');
    const winModal = document.getElementById('win-modal');
    const winTitle = document.getElementById('win-title');
    const winMessage = document.getElementById('win-message');
    const winnerSymbol = document.getElementById('winner-symbol');
    const modalIcon = document.getElementById('modal-icon');

    // Mode Selection
    document.getElementById('select-2player').addEventListener('click', () => {
        showScreen('2player');
        initGame('2player');
    });

    document.getElementById('select-computer').addEventListener('click', () => {
        showScreen('computer');
        initGame('computer');
    });

    // Back to Menu Buttons
    document.getElementById('back-2player').addEventListener('click', () => showScreen('menu'));
    document.getElementById('back-computer').addEventListener('click', () => showScreen('menu'));

    // 2 Player Mode Controls
    document.getElementById('new-game-2p').addEventListener('click', () => resetBoard('2player'));
    document.getElementById('reset-2p').addEventListener('click', () => resetScores('2player'));

    // Computer Mode Controls
    document.getElementById('new-game-comp').addEventListener('click', () => resetBoard('computer'));
    document.getElementById('reset-comp').addEventListener('click', () => resetScores('computer'));

    // Side Selection
    document.getElementById('side-x').addEventListener('click', () => {
        setHumanSide('X');
        document.getElementById('side-x').classList.add('active');
        document.getElementById('side-o').classList.remove('active');
    });

    document.getElementById('side-o').addEventListener('click', () => {
        setHumanSide('O');
        document.getElementById('side-o').classList.add('active');
        document.getElementById('side-x').classList.remove('active');
    });

    // Difficulty Selection
    document.getElementById('diff-easy').addEventListener('click', () => {
        setDifficulty('easy');
        updateDifficultyButtons('easy');
    });

    document.getElementById('diff-medium').addEventListener('click', () => {
        setDifficulty('medium');
        updateDifficultyButtons('medium');
    });

    document.getElementById('diff-hard').addEventListener('click', () => {
        setDifficulty('hard');
        updateDifficultyButtons('hard');
    });

    // Modal Controls
    document.getElementById('play-again').addEventListener('click', () => {
        winModal.classList.remove('active');
        celebration.classList.remove('active');
        resetBoard(gameState.mode);
    });

    document.getElementById('back-to-menu').addEventListener('click', () => {
        winModal.classList.remove('active');
        celebration.classList.remove('active');
        showScreen('menu');
    });

    // Show specific screen
    function showScreen(screen) {
        mainMenu.classList.remove('active-screen');
        game2Player.classList.remove('active-screen');
        gameComputer.classList.remove('active-screen');

        if (screen === 'menu') {
            mainMenu.classList.add('active-screen');
        } else if (screen === '2player') {
            game2Player.classList.add('active-screen');
        } else if (screen === 'computer') {
            gameComputer.classList.add('active-screen');
        }
    }

    // Initialize game
    function initGame(mode) {
        gameState.mode = mode;
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.gameActive = true;
        gameState.winningCells = [];

        // Load scores from localStorage
        loadScores();

        // Create game grid
        const gridId = mode === '2player' ? 'grid-2player' : 'grid-computer';
        const grid = document.getElementById(gridId);
        grid.innerHTML = '';

        for (let i = 0; i < 9; i++) {
            const box = document.createElement('button');
            box.className = 'box';
            box.dataset.index = i;
            box.addEventListener('click', () => handleBoxClick(i));
            grid.appendChild(box);
        }

        // Set initial player
        gameState.currentPlayer = 'X';

        // For computer mode, if human plays as O, computer goes first
        if (mode === 'computer' && gameState.humanSide === 'O') {
            gameState.currentPlayer = 'X'; // Computer is X
            setTimeout(computerMove, 1000);
        }

        updateGameDisplay();
    }

    // Handle box click
    function handleBoxClick(index) {
        if (!gameState.gameActive || 
            gameState.board[index] !== '' || 
            (gameState.mode === 'computer' && 
             gameState.currentPlayer !== gameState.humanSide) ||
            gameState.isComputerThinking) {
            return;
        }

        // Make the move
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

            // If computer's turn in computer mode
            if (gameState.mode === 'computer' && gameState.currentPlayer !== gameState.humanSide) {
                gameState.isComputerThinking = true;
                showComputerThinking(true);
                setTimeout(computerMove, 1000);
            }
        }
    }

    // Make a move
    function makeMove(index, player) {
        gameState.board[index] = player;
        
        const gridId = gameState.mode === '2player' ? 'grid-2player' : 'grid-computer';
        const box = document.querySelector(`#${gridId} .box[data-index="${index}"]`);
        box.textContent = player;
        box.classList.add(player.toLowerCase());
        box.classList.add('occupied');
    }

    // Computer move logic
    function computerMove() {
        if (!gameState.gameActive || gameState.isComputerThinking === false) return;

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
            makeMove(moveIndex, gameState.currentPlayer);
            
            // Check for win or draw
            if (checkWin(gameState.currentPlayer)) {
                setTimeout(() => {
                    gameState.isComputerThinking = false;
                    showComputerThinking(false);
                    handleWin(gameState.currentPlayer);
                }, 500);
            } else if (checkDraw()) {
                setTimeout(() => {
                    gameState.isComputerThinking = false;
                    showComputerThinking(false);
                    handleDraw();
                }, 500);
            } else {
                // Switch back to human
                gameState.currentPlayer = gameState.humanSide;
                setTimeout(() => {
                    gameState.isComputerThinking = false;
                    showComputerThinking(false);
                    updateGameDisplay();
                }, 500);
            }
        }
    }

    // Get random move (Easy)
    function getRandomMove() {
        const emptyCells = [];
        for (let i = 0; i < 9; i++) {
            if (gameState.board[i] === '') {
                emptyCells.push(i);
            }
        }
        return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
    }

    // Get medium difficulty move
    function getMediumMove() {
        const computerSymbol = gameState.currentPlayer;
        const humanSymbol = gameState.humanSide;

        // Try to win
        let winMove = findWinningMove(computerSymbol);
        if (winMove !== -1) return winMove;

        // Try to block
        let blockMove = findWinningMove(humanSymbol);
        if (blockMove !== -1) return blockMove;

        // Take center
        if (gameState.board[4] === '') return 4;

        // Take corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => gameState.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Random move
        return getRandomMove();
    }

    // Get hard difficulty move (MiniMax)
    function getHardMove() {
        const computerSymbol = gameState.currentPlayer;
        const humanSymbol = gameState.humanSide;

        // Use MiniMax algorithm
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
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

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

    // Check win for specific symbol on specific board
    function checkWinForSymbol(board, symbol) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === symbol && board[a] === board[b] && board[a] === board[c]) {
                return true;
            }
        }
        return false;
    }

    // Check draw for specific board
    function checkDrawForBoard(board) {
        return !board.includes('');
    }

    // Check win
    function checkWin(player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

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

    // Check draw
    function checkDraw() {
        return !gameState.board.includes('');
    }

    // Handle win
    function handleWin(winner) {
        gameState.gameActive = false;
        gameState.scores.totalGames++;

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

        saveScores();
        updateScoreDisplay();

        // Highlight winning cells
        highlightWinningCells();

        // Show celebration
        setTimeout(() => {
            celebration.classList.add('active');
            triggerFireworks();
        }, 500);

        // Show win modal
        setTimeout(() => {
            let title, message, icon;
            
            if (gameState.mode === '2player') {
                title = `Player ${winner === 'X' ? '1' : '2'} Wins!`;
                message = `Player ${winner === 'X' ? '1 (X)' : '2 (O)'} is the champion!`;
                icon = 'fas fa-trophy';
            } else {
                if (winner === gameState.humanSide) {
                    title = 'You Win!';
                    message = 'Congratulations! You defeated the computer!';
                    icon = 'fas fa-trophy';
                } else {
                    title = 'Computer Wins!';
                    message = 'The AI was too strong this time!';
                    icon = 'fas fa-robot';
                }
            }

            winTitle.textContent = title;
            winMessage.textContent = message;
            winnerSymbol.textContent = winner;
            modalIcon.className = 'modal-icon';
            modalIcon.innerHTML = `<i class="${icon}"></i>`;
            winModal.classList.add('active');
        }, 1000);
    }

    // Handle draw
    function handleDraw() {
        gameState.gameActive = false;
        gameState.scores.totalGames++;
        gameState.scores.draws++;

        saveScores();
        updateScoreDisplay();

        // Show draw modal
        setTimeout(() => {
            winTitle.textContent = "It's a Draw!";
            winMessage.textContent = 'The game ended in a tie. Try again!';
            winnerSymbol.textContent = '=';
            modalIcon.className = 'modal-icon';
            modalIcon.innerHTML = '<i class="fas fa-handshake"></i>';
            winModal.classList.add('active');
        }, 500);
    }

    // Highlight winning cells
    function highlightWinningCells() {
        const gridId = gameState.mode === '2player' ? 'grid-2player' : 'grid-computer';
        gameState.winningCells.forEach(index => {
            const box = document.querySelector(`#${gridId} .box[data-index="${index}"]`);
            box.classList.add('winning');
        });
    }

    // Trigger fireworks
    function triggerFireworks() {
        const container = document.getElementById('celebration');
        
        // Create fireworks
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = `${Math.random() * 100}%`;
                firework.style.top = `${Math.random() * 100}%`;
                firework.style.background = `hsl(${Math.random() * 360}, 100%, 60%)`;
                container.appendChild(firework);
                
                setTimeout(() => {
                    firework.remove();
                }, 1000);
            }, i * 300);
        }
    }

    // Reset board
    function resetBoard(mode) {
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.gameActive = true;
        gameState.winningCells = [];
        gameState.isComputerThinking = false;
        showComputerThinking(false);

        // Set initial player
        gameState.currentPlayer = 'X';

        // Reset grid
        const gridId = mode === '2player' ? 'grid-2player' : 'grid-computer';
        const grid = document.getElementById(gridId);
        
        document.querySelectorAll(`#${gridId} .box`).forEach(box => {
            box.textContent = '';
            box.classList.remove('x', 'o', 'winning', 'occupied');
        });

        // For computer mode, if human plays as O, computer goes first
        if (mode === 'computer' && gameState.humanSide === 'O') {
            gameState.currentPlayer = 'X'; // Computer is X
            setTimeout(() => {
                computerMove();
            }, 500);
        }

        updateGameDisplay();
    }

    // Reset scores
    function resetScores(mode) {
        if (mode === '2player') {
            gameState.scores.player1 = 0;
            gameState.scores.player2 = 0;
        } else {
            gameState.scores.human = 0;
            gameState.scores.computer = 0;
        }
        gameState.scores.draws = 0;
        gameState.scores.totalGames = 0;
        
        saveScores();
        updateScoreDisplay();
    }

    // Set human side
    function setHumanSide(side) {
        gameState.humanSide = side;
        resetBoard('computer');
    }

    // Set difficulty
    function setDifficulty(difficulty) {
        gameState.difficulty = difficulty;
        
        // Update UI
        const desc = document.getElementById('diff-desc');
        const badge = document.getElementById('current-diff');
        
        let description = '';
        let badgeText = '';
        let badgeClass = '';

        switch (difficulty) {
            case 'easy':
                description = 'Computer makes random moves';
                badgeText = 'Easy';
                badgeClass = 'easy';
                break;
            case 'medium':
                description = 'Computer tries to win or block';
                badgeText = 'Medium';
                badgeClass = 'medium';
                break;
            case 'hard':
                description = 'Computer uses advanced AI strategy';
                badgeText = 'Hard';
                badgeClass = 'hard';
                break;
        }

        desc.textContent = description;
        badge.textContent = badgeText;
        badge.className = `diff-badge ${badgeClass}`;
        badge.innerHTML = `<i class="fas fa-${difficulty === 'easy' ? 'smile' : difficulty === 'medium' ? 'meh' : 'brain'}"></i> ${badgeText}`;
    }

    // Update difficulty buttons
    function updateDifficultyButtons(selected) {
        ['easy', 'medium', 'hard'].forEach(diff => {
            const btn = document.getElementById(`diff-${diff}`);
            if (diff === selected) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Show computer thinking
    function showComputerThinking(show) {
        const thinkingElement = document.getElementById('ai-thinking');
        if (show) {
            thinkingElement.classList.remove('hide');
        } else {
            thinkingElement.classList.add('hide');
        }
    }

    // Update game display
    function updateGameDisplay() {
        if (gameState.mode === '2player') {
            // Update turn text
            const turnText = document.getElementById('turn-text-2p');
            turnText.textContent = `Player ${gameState.currentPlayer === 'X' ? '1' : '2'}'s Turn (${gameState.currentPlayer})`;

            // Update player cards
            const player1Card = document.getElementById('player1-card');
            const player2Card = document.getElementById('player2-card');
            
            if (gameState.currentPlayer === 'X') {
                player1Card.classList.add('active');
                player2Card.classList.remove('active');
            } else {
                player1Card.classList.remove('active');
                player2Card.classList.add('active');
            }
        } else {
            // Update turn text
            const turnText = document.getElementById('turn-text-comp');
            if (gameState.currentPlayer === gameState.humanSide) {
                turnText.textContent = 'Your Turn';
            } else {
                turnText.textContent = "Computer's Turn";
            }

            // Update player cards
            const humanCard = document.getElementById('human-card');
            const computerCard = document.getElementById('computer-card');
            
            if (gameState.currentPlayer === gameState.humanSide) {
                humanCard.classList.add('active');
                computerCard.classList.remove('active');
            } else {
                humanCard.classList.remove('active');
                computerCard.classList.add('active');
            }
        }
    }

    // Update score display
    function updateScoreDisplay() {
        if (gameState.mode === '2player') {
            document.getElementById('score-player1').textContent = gameState.scores.player1;
            document.getElementById('score-player2').textContent = gameState.scores.player2;
        } else {
            document.getElementById('score-human').textContent = gameState.scores.human;
            document.getElementById('score-computer').textContent = gameState.scores.computer;
        }
        
        document.getElementById('total-games').textContent = gameState.scores.totalGames;
        document.getElementById('total-draws').textContent = gameState.scores.draws;
    }

    // Load scores from localStorage
    function loadScores() {
        const saved = localStorage.getItem('ticTacToeScores');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(gameState.scores, parsed);
        }
    }

    // Save scores to localStorage
    function saveScores() {
        localStorage.setItem('ticTacToeScores', JSON.stringify(gameState.scores));
    }

    // Initialize on load
    showScreen('menu');
    setDifficulty('easy');
    updateDifficultyButtons('easy');
});