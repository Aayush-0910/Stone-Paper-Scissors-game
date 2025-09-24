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
    const createRoomBtn = document.getElementById('create-room-btn');
    const joinRoomBtn = document.getElementById('join-room-btn');
    const joinRoomInput = document.getElementById('join-room-input');
    const roomIdDisplay = document.getElementById('room-id');
    const joinRoomContainer = document.querySelector('.join-room-container');
    const matchmakeBtn = document.getElementById('matchmake-btn');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const matchStatusEl = document.createElement('div');
    matchStatusEl.className = 'match-status';
    // try to append near lobby actions if present
    const lobbyEl = document.querySelector('.lobby');
    if (lobbyEl) lobbyEl.appendChild(matchStatusEl);

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
    let wsMessageQueue = [];
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 6;
    // --- WebSocket configuration ---
    // Set `productionUrl` to your hosted WebSocket server (must include ws:// or wss://)
    // Example: 'wss://my-ws-host.example.com'
    const WS_CONFIG = {
        productionUrl: '' , // <-- set this before deploying to production
        // If true, the client will attempt reconnects even when productionUrl is set.
        allowAutoReconnectInProd: true
    };
    // UI elements for websocket status
    const wsQueueEl = document.getElementById('ws-queue');
    const wsQueueCountEl = document.getElementById('ws-queue-count');
    const wsReconnectEl = document.getElementById('ws-reconnect');
    const wsReconnectCountEl = document.getElementById('ws-reconnect-count');
    const wsRetryBtn = document.getElementById('ws-retry-btn');

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
        matchmakeBtn?.addEventListener('click', () => {
            const name = prompt('Enter your display name', 'Player') || 'Player';
            safeSend({ type: 'setName', name });
            safeSend({ type: 'matchmake' });
            // show a friendly searching state
            if (matchStatusEl) matchStatusEl.textContent = 'Searching for a match...';
            setWsStatus('connecting');
        });
        chatSendBtn?.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (!text) return;
            safeSend({ type: 'chat', text });
            // locally echo
            if (chatMessages) {
                const el = document.createElement('div');
                el.className = 'chat-line me';
                el.textContent = `You: ${text}`;
                chatMessages.appendChild(el);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            chatInput.value = '';
        });

        // allow Enter to send chat
        chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                chatSendBtn?.click();
            }
        });
    }

    // --- WebSocket ---
    function connectWebSocket() {
        // Avoid creating multiple connections
        if (ws) return;

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Prefer explicit productionUrl if provided
        let url = WS_CONFIG.productionUrl && WS_CONFIG.productionUrl.length > 0
            ? WS_CONFIG.productionUrl
            : (isLocal ? `${proto}//localhost:8080` : `${proto}//${window.location.host}/api/socket`);

    console.log('Attempting WebSocket connection to', url);

    // Update UI
    setWsStatus('connecting');
    updateQueueCount();
    updateReconnectCount();

    ws = new WebSocket(url);

        // If initial attempt errors (for example when hosted on GitHub Pages without a serverless endpoint),
        // try a localhost fallback once.
        let triedFallback = false;
        ws.onerror = (err) => {
            console.error('WebSocket error', err);
            setWsStatus('error');
            // fallbacks handled onclose to keep logic centralized
        };

        function attachWsHandlers() {
            if (!ws) return;
            ws.onopen = () => {
                console.log('Connected to WebSocket server');
                reconnectAttempts = 0;
                setWsStatus('connected');
                // flush queued messages
                while (wsMessageQueue.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
                    const msg = wsMessageQueue.shift();
                    ws.send(msg);
                }
                updateQueueCount();
                updateReconnectCount();
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
                        if (chatContainer) chatContainer.classList.remove('hidden');
                        break;
                    case 'chat':
                        // { type: 'chat', from, text }
                        if (chatMessages) {
                            const el = document.createElement('div');
                            el.className = 'chat-line';
                            el.textContent = `${data.from}: ${data.text}`;
                            chatMessages.appendChild(el);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }
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
                    case 'reset':
                        // Server-side reset: re-enable UI for a new round
                        resetRound();
                        break;
                    case 'error':
                        alert(data.message);
                        break;
                }
            };

            ws.onclose = () => {
                console.log('Disconnected from WebSocket server');
                ws = null;
                setWsStatus('disconnected');
                updateQueueCount();
                // try reconnect with exponential backoff
                // In production, respect allowAutoReconnectInProd flag
                const allowReconnect = (WS_CONFIG.productionUrl && WS_CONFIG.productionUrl.length > 0)
                    ? WS_CONFIG.allowAutoReconnectInProd
                    : true;
                if (allowReconnect && reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(30000, 500 * Math.pow(2, reconnectAttempts));
                    reconnectAttempts++;
                    updateReconnectCount();
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
                    setTimeout(() => connectWebSocket(), delay);
                } else {
                    console.log('Max reconnect attempts reached');
                    // show retry button
                    if (wsRetryBtn) wsRetryBtn.classList.remove('hidden');
                }
            };
        }

        attachWsHandlers();
    }

    // --- WebSocket helpers ---
    function setWsStatus(status) {
        const dot = document.getElementById('ws-dot');
        const text = document.getElementById('ws-status-text');
        if (!dot || !text) return;
        switch (status) {
            case 'connected':
                dot.style.background = '#2ecc71';
                text.textContent = 'connected';
                break;
            case 'connecting':
                dot.style.background = '#f1c40f';
                text.textContent = 'connecting';
                break;
            case 'error':
                dot.style.background = '#e67e22';
                text.textContent = 'error';
                break;
            default:
                dot.style.background = '#bbb';
                text.textContent = 'disconnected';
        }
        // Manage visibility of retry/queue/reconnect indicators
        if (wsQueueEl) wsQueueEl.classList.toggle('hidden', wsMessageQueue.length === 0);
        if (wsReconnectEl) wsReconnectEl.classList.toggle('hidden', reconnectAttempts === 0);
        if (wsRetryBtn) wsRetryBtn.classList.toggle('hidden', status !== 'disconnected' || reconnectAttempts < maxReconnectAttempts);
    }

    function safeSend(obj) {
        const payload = JSON.stringify(obj);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        } else {
            // queue the message to send when connected
            wsMessageQueue.push(payload);
            // try to connect if not already
            if (!ws) connectWebSocket();
            updateQueueCount();
        }
    }

    function updateQueueCount() {
        if (wsQueueCountEl) wsQueueCountEl.textContent = String(wsMessageQueue.length);
        if (wsQueueEl) wsQueueEl.classList.toggle('hidden', wsMessageQueue.length === 0);
    }

    function updateReconnectCount() {
        if (wsReconnectCountEl) wsReconnectCountEl.textContent = String(reconnectAttempts);
        if (wsReconnectEl) wsReconnectEl.classList.toggle('hidden', reconnectAttempts === 0);
    }

    if (wsRetryBtn) {
        wsRetryBtn.addEventListener('click', () => {
            // reset attempts and force reconnect
            reconnectAttempts = 0;
            updateReconnectCount();
            if (ws) {
                try { ws.close(); } catch (e) { /* ignore */ }
                ws = null;
            }
            if (wsRetryBtn) wsRetryBtn.classList.add('hidden');
            connectWebSocket();
        });
    }

    function createRoom() {
        if (!ws) connectWebSocket();
        // Use a timeout to ensure the connection is open before sending the message
        setTimeout(() => {
            // Queue or send immediately
            safeSend({ type: 'create' });
        }, 500);
    }

    function joinRoom() {
        if (!ws) connectWebSocket();
        const id = joinRoomInput.value;
        if (id) {
            resultText.textContent = `Joining room ${id}...`;
            // Use a timeout to ensure the connection is open before sending the message
            setTimeout(() => {
                // Use safeSend so message is queued if needed
                safeSend({ type: 'join', roomId: id });
                roomId = id;
                roomIdDisplay.textContent = roomId;
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
            // Use safeSend so the message is queued if socket is not open yet
            safeSend({ type: 'choice', choice: choice });
            resultText.textContent = 'Waiting for opponent...';
            choiceCards.forEach(card => card.style.pointerEvents = 'none');
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

        if (gameType === 'online') {
            safeSend({ type: 'reset' });
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