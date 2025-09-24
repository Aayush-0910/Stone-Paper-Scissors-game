document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modal = document.getElementById('modal-instructions');
    const helpButton = document.getElementById('help-button');
    const closeButton = document.querySelector('.close-button');
    const seriesWinnerBanner = document.getElementById('series-winner-banner');
    const seriesWinnerText = document.getElementById('series-winner-text');
    const playerNameInput = document.getElementById('player-name');
    const player2NameContainer = document.getElementById('player2-name-container');
    const player2NameInput = document.getElementById('player2-name');
    const playerNameDisplay = document.getElementById('player-name-display');
    const opponentNameDisplay = document.getElementById('opponent-name-display');
    const gameModeSelect = document.getElementById('game-mode');
    const gameTypeSelect = document.getElementById('game-type');
    const playerScoreEl = document.getElementById('player-score');
    const opponentScoreEl = document.getElementById('opponent-score');
    const choiceCards = document.querySelectorAll('.choice-card');
    const resultText = document.getElementById('result');
    const opponentChoiceDisplayEl = document.getElementById('opponent-choice-display');
    const playAgainBtn = document.getElementById('play-again');
    const historyList = document.getElementById('history-list');
    const onlineContainer = document.getElementById('online-container');
    const createRoomBtn = document = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const joinRoomInput = document.getElementById('join-room-input');
    const roomIdDisplay = document.getElementById('room-id');
    const joinRoomContainer = document.querySelector('.join-room-container');

    // --- Game State ---
    let playerScore = 0;
    let opponentScore = 0;
    let playerName = 'Player 1';
    let player2Name = 'Player 2';
    let gameMode = 'endless';
    let gameType = 'pvc';
    let playerSeriesScore = 0;
    let opponentSeriesScore = 0;
    let history = [];
    let player1Choice = null;
    let currentPlayer = 1;
    let ws = null;
    let roomId = null;

    // --- Initialization ---
    function initialize() {
        playerNameInput.value = playerName;
        playerNameDisplay.textContent = playerName;
        player2NameInput.value = player2Name;
        opponentNameDisplay.textContent = 'Computer';

        updateScoreboard();
        updateHistory();
        addEventListeners();
    }

    // --- Event Listeners ---
    function addEventListeners() {
        helpButton.addEventListener('click', () => modal.style.display = 'block');
        closeButton.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target == modal) modal.style.display = 'none';
        });
        playerNameInput.addEventListener('change', updatePlayerName);
        player2NameInput.addEventListener('change', updatePlayerName);
        gameModeSelect.addEventListener('change', changeGameMode);
        gameTypeSelect.addEventListener('change', changeGameType);
        choiceCards.forEach(card => card.addEventListener('click', handleChoiceClick));
        playAgainBtn.addEventListener('click', resetRound);
        createRoomBtn.addEventListener('click', createRoom);
        joinRoomBtn.addEventListener('click', joinRoom);
    }

    // --- WebSocket ---
    function connectWebSocket() {
        // Connect to the Vercel serverless function for WebSockets
        const protocol = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'ws' : 'wss';
        const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.hostname : 'web-production-59aa.up.railway.app';
        ws = new WebSocket(`${protocol}://${host}/api/socket`);

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            switch (data.type) {
                case 'roomCreated':
                    roomId = data.roomId;
                    roomIdDisplay.textContent = roomId;
                    resultText.textContent = `Room created! Your Room ID is ${roomId}. Share this with your friend. Waiting for another player...`;
                    createRoomBtn.style.display = 'none';
                    joinRoomContainer.style.display = 'none';
                    break;
                case 'playerJoined':
                    resultText.textContent = 'Player 2 has joined. Make your move!';
                    onlineContainer.classList.add('hidden');
                    break;
                case 'result':
                    const { winner, choices } = data;
                    const opponentChoice = choices[1];
                    updateScores(winner);
                    displayResult(winner, choices[0], opponentChoice);
                    addHistory(winner, choices[0], opponentChoice);
                    break;
                case 'playerLeft':
                    resultText.textContent = 'The other player has left the room.';
                    resetGame();
                    break;
                case 'error':
                    alert(data.message);
                    break;
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
            ws = null;
        };
    }

    function createRoom() {
        if (!ws) connectWebSocket();
        // Use a timeout to ensure the connection is open before sending the message
        setTimeout(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'create' }));
            } else {
                console.error("WebSocket is not open. Cannot create room.");
            }
        }, 500);
    }

    function joinRoom() {
        if (!ws) connectWebSocket();
        const id = joinRoomInput.value;
        if (id) {
            resultText.textContent = `Joining room ${id}...`;
            // Use a timeout to ensure the connection is open before sending the message
            setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'join', roomId: id }));
                    roomId = id;
                    roomIdDisplay.textContent = roomId;
                } else {
                    console.error("WebSocket is not open. Cannot join room.");
                    resultText.textContent = 'Error: Could not connect to server.';
                }
            }, 500);
        }
    }

    // --- UI ---
    function updatePlayerName(e) {
        if (e.target.id === 'player-name') {
            playerName = e.target.value;
            playerNameDisplay.textContent = playerName;
        } else {
            player2Name = e.target.value;
            if (gameType === 'pvp' || gameType === 'online') {
                opponentNameDisplay.textContent = player2Name;
            }
        }
    }

    function updateHistory() {
        historyList.innerHTML = '';
        history.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            historyList.appendChild(li);
        });
    }

    // --- Game Logic ---
    function changeGameMode(e) {
        gameMode = e.target.value;
        resetGame();
    }

    function changeGameType(e) {
        gameType = e.target.value;
        if (gameType === 'pvp') {
            player2NameContainer.classList.remove('hidden');
            onlineContainer.classList.add('hidden');
            opponentNameDisplay.textContent = player2Name;
        } else if (gameType === 'online') {
            player2NameContainer.classList.add('hidden');
            onlineContainer.classList.remove('hidden');
            opponentNameDisplay.textContent = 'Opponent';
            connectWebSocket();
        } else {
            player2NameContainer.classList.add('hidden');
            onlineContainer.classList.add('hidden');
            opponentNameDisplay.textContent = 'Computer';
        }
        resetGame();
    }

    function handleChoiceClick(e) {
        const choice = e.currentTarget.id;
        if (gameType === 'pvc') {
            player1Choice = choice;
            const computerChoice = getComputerChoice();
            const winner = determineWinner(player1Choice, computerChoice);
            updateScores(winner);
            displayResult(winner, player1Choice, computerChoice);
            addHistory(winner, player1Choice, computerChoice);
        } else if (gameType === 'pvp') {
            if (currentPlayer === 1) {
                player1Choice = choice;
                currentPlayer = 2;
                resultText.textContent = `${player2Name}, make your move!`;
                choiceCards.forEach(card => card.style.pointerEvents = 'none');
                setTimeout(() => {
                    choiceCards.forEach(card => card.style.pointerEvents = 'auto');
                }, 500);
            } else {
                const player2Choice = choice;
                const winner = determineWinner(player1Choice, player2Choice);
                updateScores(winner);
                displayResult(winner, player1Choice, player2Choice);
                addHistory(winner, player1Choice, player2Choice);
                currentPlayer = 1;
            }
        } else if (gameType === 'online') {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'choice', choice: choice }));
                resultText.textContent = 'Waiting for opponent...';
                choiceCards.forEach(card => card.style.pointerEvents = 'none');
            }
        }
    }

    function getComputerChoice() {
        const choices = ['stone', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * choices.length)];
    }

    function determineWinner(choice1, choice2) {
        if (choice1 === choice2) return 'draw';
        if (
            (choice1 === 'stone' && choice2 === 'scissors') ||
            (choice1 === 'paper' && choice2 === 'stone') ||
            (choice1 === 'scissors' && choice2 === 'paper')
        ) {
            return 'player1';
        }
        return 'player2';
    }

    function updateScores(winner) {
        if (winner === 'player1') playerScore++;
        if (winner === 'player2') opponentScore++;
        updateScoreboard();

        if (gameMode !== 'endless') {
            if (winner === 'player1') playerSeriesScore++;
            if (winner === 'player2') opponentSeriesScore++;
            checkSeriesWinner();
        }
    }

    function updateScoreboard() {
        playerScoreEl.textContent = playerScore;
        opponentScoreEl.textContent = opponentScore;
    }

    function displayResult(winner, choice1, choice2) {
        let resultString = "It's a draw!";
        let opponentNameValue = gameType === 'pvc' ? 'Computer' : (gameType === 'online' ? 'Opponent' : player2Name);
        if (winner === 'player1') resultString = `${playerName} wins!`;
        if (winner === 'player2') resultString = `${opponentNameValue} wins!`;

        resultText.textContent = resultString;
        opponentChoiceDisplayEl.textContent = `${opponentNameValue} chose ${choice2}.`;
        choiceCards.forEach(card => {
            card.style.pointerEvents = 'none';
            if (winner !== 'draw') {
                if ((winner === 'player1' && card.id === choice1) || (winner === 'player2' && card.id === choice2)) {
                    card.classList.add('winner-glow');
                }
            }
        });
        playAgainBtn.classList.remove('hidden');
    }
    
    function addHistory(winner, choice1, choice2) {
        let winnerName = '';
        if (winner === 'draw') {
            winnerName = 'Draw';
        } else if (winner === 'player1') {
            winnerName = `${playerName} won`;
        } else {
            winnerName = gameType === 'pvc' ? 'Computer won' : (gameType === 'online' ? 'Opponent won' : `${player2Name} won`);
        }
        history.unshift(`${winnerName} (${choice1} vs ${choice2})`);
        if (history.length > 5) history.pop();
        updateHistory();
    }

    function checkSeriesWinner() {
        const seriesLimit = gameMode === 'bestOf3' ? 2 : gameMode === 'bestOf5' ? 3 : 4;
        if (playerSeriesScore === seriesLimit) {
            endSeries(playerName);
        } else if (opponentSeriesScore === seriesLimit) {
            const opponentName = gameType === 'pvc' ? 'Computer' : (gameType === 'online' ? 'Opponent' : player2Name);
            endSeries(opponentName);
        }
    }

    function endSeries(winner) {
        seriesWinnerText.textContent = `${winner} wins the series!`;
        seriesWinnerBanner.classList.remove('hidden');
        choiceCards.forEach(card => card.style.pointerEvents = 'none');
        playAgainBtn.textContent = 'New Game';
    }

    function resetRound() {
        resultText.textContent = 'Make your move!';
        opponentChoiceDisplayEl.textContent = '';
        choiceCards.forEach(card => {
            card.style.pointerEvents = 'auto';
            card.classList.remove('winner-glow');
        });
        playAgainBtn.classList.add('hidden');
        player1Choice = null;
        currentPlayer = 1;

        if (gameType === 'online' && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'reset' }));
        }

        createRoomBtn.style.display = 'block';
        joinRoomContainer.style.display = 'block';
        roomIdDisplay.textContent = '';

        if (seriesWinnerBanner.classList.contains('hidden') === false) {
            resetGame();
        }
    }

    function resetGame() {
        playerScore = 0;
        opponentScore = 0;
        playerSeriesScore = 0;
        opponentSeriesScore = 0;
        history = [];
        updateScoreboard();
        updateHistory();
        seriesWinnerBanner.classList.add('hidden');
        playAgainBtn.textContent = 'Play Again';
        resetRound();
    }

    // --- Initialize ---
    initialize();
});