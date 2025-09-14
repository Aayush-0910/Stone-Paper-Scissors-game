document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modal = document.getElementById('modal-instructions');
    const helpButton = document.getElementById('help-button');
    const closeButton = document.querySelector('.close-button');
    const seriesWinnerBanner = document.getElementById('series-winner-banner');
    const seriesWinnerText = document.getElementById('series-winner-text');
    const themeSwitcher = document.getElementById('theme-switcher-container');
    const playerNameInput = document.getElementById('player-name');
    const playerNameDisplay = document.getElementById('player-name-display');
    const gameModeSelect = document.getElementById('game-mode');
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');
    const choiceCards = document.querySelectorAll('.choice-card');
    const resultText = document.getElementById('result');
    const computerChoiceDisplayEl = document.getElementById('computer-choice-display');
    const playAgainBtn = document.getElementById('play-again');
    const historyList = document.getElementById('history-list');

    // --- Game State ---
    let playerScore = 0;
    let computerScore = 0;
    let playerName = 'Player 1';
    let gameMode = 'endless';
    let playerSeriesScore = 0;
    let computerSeriesScore = 0;
    let history = [];

    // --- Initialization ---
    function initialize() {
        // Set initial theme to dark
        document.body.className = 'dark-theme';
        document.getElementById('sun-icon').style.display = 'none';
        document.getElementById('moon-icon').style.display = 'block';

        // Set initial player name
        playerName = 'Player 1';
        playerNameInput.value = playerName;
        playerNameDisplay.textContent = playerName;

        // Set initial scores
        playerScore = 0;
        computerScore = 0;

        // Clear history
        history = [];

        updateScoreboard();
        updateHistory();
        addEventListeners();
        checkFirstVisit(); // Modal will always show on first load now
    }

    // --- Event Listeners ---
    function addEventListeners() {
        helpButton.addEventListener('click', () => modal.style.display = 'block');
        closeButton.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target == modal) modal.style.display = 'none';
        });
        themeSwitcher.addEventListener('click', toggleTheme);
        playerNameInput.addEventListener('change', updatePlayerName);
        gameModeSelect.addEventListener('change', changeGameMode);
        choiceCards.forEach(card => card.addEventListener('click', handleChoiceClick));
        playAgainBtn.addEventListener('click', resetRound);
    }

    

    // --- UI ---
    function checkFirstVisit() {
        modal.style.display = 'block'; // Always show modal on load
    }

    function toggleTheme() {
        const isLightTheme = document.body.classList.contains('light-theme');
        const newTheme = isLightTheme ? 'dark' : 'light';
        document.body.className = newTheme + '-theme';
        document.getElementById('sun-icon').style.display = isLightTheme ? 'none' : 'block';
        document.getElementById('moon-icon').style.display = isLightTheme ? 'block' : 'none';
    }

    function updatePlayerName(e) {
        playerName = e.target.value;
        playerNameDisplay.textContent = playerName;
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

    function handleChoiceClick(e) {
        const playerChoice = e.currentTarget.id;
        const computerChoice = getComputerChoice();
        const winner = determineWinner(playerChoice, computerChoice);

        updateScores(winner);
        displayResult(winner, playerChoice, computerChoice);
        addHistory(winner, playerChoice, computerChoice);
    }

    function getComputerChoice() {
        const choices = ['stone', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * choices.length)];
    }

    function determineWinner(player, computer) {
        if (player === computer) return 'draw';
        if (
            (player === 'stone' && computer === 'scissors') ||
            (player === 'paper' && computer === 'stone') ||
            (player === 'scissors' && computer === 'paper')
        ) {
            return 'player';
        }
        return 'computer';
    }

    function updateScores(winner) {
        if (winner === 'player') playerScore++;
        if (winner === 'computer') computerScore++;
        updateScoreboard();

        if (gameMode !== 'endless') {
            if (winner === 'player') playerSeriesScore++;
            if (winner === 'computer') computerSeriesScore++;
            checkSeriesWinner();
        }
    }

    function updateScoreboard() {
        playerScoreEl.textContent = playerScore;
        computerScoreEl.textContent = computerScore;
    }

    function displayResult(winner, playerChoice, computerChoice) {
        let resultString = "It's a draw!";
        if (winner === 'player') resultString = `${playerName} wins!`;
        if (winner === 'computer') resultString = `Computer wins!`;

        resultText.textContent = resultString;
        computerChoiceDisplayEl.textContent = `Computer chose ${computerChoice}.`;
        choiceCards.forEach(card => {
            card.style.pointerEvents = 'none';
            if (winner !== 'draw' && (card.id === playerChoice || card.id === computerChoice)) {
                if ((winner === 'player' && card.id === playerChoice) || (winner === 'computer' && card.id === computerChoice)) {
                    card.classList.add('winner-glow');
                }
            }
        });
        playAgainBtn.classList.remove('hidden');
    }
    
    function addHistory(winner, playerChoice, computerChoice) {
        const resultString = winner === 'draw' ? 'Draw' : winner === 'player' ? `${playerName} won` : 'Computer won';
        history.unshift(`${resultString} (${playerChoice} vs ${computerChoice})`);
        if (history.length > 5) history.pop();
        updateHistory();
    }

    function checkSeriesWinner() {
        const seriesLimit = gameMode === 'bestOf5' ? 3 : 4;
        if (playerSeriesScore === seriesLimit) {
            endSeries(playerName);
        } else if (computerSeriesScore === seriesLimit) {
            endSeries('Computer');
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
        computerChoiceDisplayEl.textContent = '';
        choiceCards.forEach(card => {
            card.style.pointerEvents = 'auto';
            card.classList.remove('winner-glow');
        });
        playAgainBtn.classList.add('hidden');

        if (seriesWinnerBanner.classList.contains('hidden') === false) {
            resetGame();
        }
    }

    function resetGame() {
        playerScore = 0;
        computerScore = 0;
        playerSeriesScore = 0;
        computerSeriesScore = 0;
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