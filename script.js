document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js loaded and DOM fully parsed.");

    // Game choices and DOM elements
    const choices = ['stone', 'paper', 'scissors'];
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const resultText = document.getElementById('result');
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');
    const playAgainBtn = document.getElementById('play-again');

    // Initialize scores
    let playerScore = 0;
    let computerScore = 0;

    // Function to get computer's random choice
    function getComputerChoice() {
        return choices[Math.floor(Math.random() * choices.length)];
    }

    // Function to determine the winner of a round
    function determineWinner(playerChoice, computerChoice) {
        if (playerChoice === computerChoice) {
            return 'draw';
        }
        if (
            (playerChoice === 'stone' && computerChoice === 'scissors') ||
            (playerChoice === 'paper' && computerChoice === 'stone') ||
            (playerChoice === 'scissors' && computerChoice === 'paper')
        ) {
            return 'player';
        }
        return 'computer';
    }

    // Function to update the score display
    function updateScore(winner) {
        if (winner === 'player') {
            playerScore++;
            playerScoreEl.textContent = playerScore;
        } else if (winner === 'computer') {
            computerScore++;
            computerScoreEl.textContent = computerScore;
        }
    }

    // Function to display the result of the round
    function displayResult(winner, playerChoice, computerChoice) {
        if (winner === 'player') {
            resultText.textContent = `You win! ${playerChoice} beats ${computerChoice}.`;
        } else if (winner === 'computer') {
            resultText.textContent = `You lose! ${computerChoice} beats ${playerChoice}.`;
        } else {
            resultText.textContent = "It's a draw!";
        }
        playAgainBtn.classList.remove('hidden');
        choiceBtns.forEach(btn => btn.disabled = true); // Disable choice buttons after a round
    }

    // Function to reset the game for a new round
    function resetGame() {
        resultText.textContent = 'Choose your weapon!';
        playAgainBtn.classList.add('hidden');
        choiceBtns.forEach(btn => btn.disabled = false); // Re-enable choice buttons
    }

    // Event listeners for player choice buttons
    choiceBtns.forEach(button => {
        button.addEventListener('click', () => {
            const playerChoice = button.id;
            const computerChoice = getComputerChoice();
            const winner = determineWinner(playerChoice, computerChoice);
            updateScore(winner);
            displayResult(winner, playerChoice, computerChoice);
        });
    });

    // Event listener for the "Play Again" button
    playAgainBtn.addEventListener('click', resetGame);
});
