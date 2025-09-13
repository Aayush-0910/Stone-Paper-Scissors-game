document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js loaded and DOM fully parsed.");

    // Web Audio API setup
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Sound generation functions
    function playSound(type) {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);

        switch (type) {
            case 'click':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
                break;
            case 'win':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.linearRampToValueAtTime(1046.50, audioContext.currentTime + 0.2); // C6
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
                break;
            case 'lose':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
                oscillator.frequency.linearRampToValueAtTime(220, audioContext.currentTime + 0.3); // A3
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.4);
                break;
            case 'draw':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime); // F4
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
                break;
        }

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Game choices and DOM elements
    const choices = ['stone', 'paper', 'scissors'];
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const resultText = document.getElementById('result');
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');
    const playAgainBtn = document.getElementById('play-again');
    const gameContainer = document.querySelector('.game-container');
    const computerChoiceDisplayEl = document.getElementById('computer-choice-display');

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
            playerScoreEl.parentElement.classList.add('score-update-animation');
        } else if (winner === 'computer') {
            computerScore++;
            computerScoreEl.textContent = computerScore;
            computerScoreEl.parentElement.classList.add('score-update-animation');
        }

        // Remove the animation class after it finishes
        setTimeout(() => {
            playerScoreEl.parentElement.classList.remove('score-update-animation');
            computerScoreEl.parentElement.classList.remove('score-update-animation');
        }, 500);
    }

    // Function to display the result of the round
    function displayResult(winner, playerChoice, computerChoice) {
        gameContainer.classList.remove('win', 'lose', 'draw');
        computerChoiceDisplayEl.classList.remove('revealed'); // Reset animation class

        if (winner === 'player') {
            resultText.textContent = `You win! ${playerChoice} beats ${computerChoice}.`;
            gameContainer.classList.add('win');
            playSound('win');
        } else if (winner === 'computer') {
            resultText.textContent = `You lose! ${computerChoice} beats ${playerChoice}.`;
            gameContainer.classList.add('lose');
            playSound('lose');
        } else {
            resultText.textContent = "It's a draw!";
            gameContainer.classList.add('draw');
            playSound('draw');
        }
        resultText.classList.add('result-animation');
        playAgainBtn.classList.remove('hidden');
        
        // Animate the computer choice display
        setTimeout(() => {
            computerChoiceDisplayEl.textContent = `Computer chose: ${computerChoice}`;
            computerChoiceDisplayEl.classList.add('revealed');
        }, 100);

        choiceBtns.forEach(btn => {
            btn.disabled = true;
            if (btn.id === playerChoice) {
                btn.classList.add('selected');
            }
            // Highlight computer's choice as well
            if (btn.id === computerChoice) {
                btn.classList.add('selected'); // Using 'selected' for now, can be a different class
            }
        });
    }

    // Function to reset the game for a new round
    function resetGame() {
        resultText.textContent = 'Choose your weapon!';
        playAgainBtn.classList.add('hidden');
        gameContainer.classList.remove('win', 'lose', 'draw');
        resultText.classList.remove('result-animation');
        computerChoiceDisplayEl.textContent = 'Computer chose: ?';
        computerChoiceDisplayEl.classList.remove('revealed'); // Reset animation class
        choiceBtns.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });
    }

    // Event listeners for player choice buttons
    choiceBtns.forEach(button => {
        button.addEventListener('click', () => {
            playSound('click');
            const playerChoice = button.id;
            console.log(`Player chose: ${playerChoice}`);
            const computerChoice = getComputerChoice();
            console.log(`Computer chose: ${computerChoice}`);
            const winner = determineWinner(playerChoice, computerChoice);
            console.log(`Round winner: ${winner}`);
            updateScore(winner);
            displayResult(winner, playerChoice, computerChoice);

            // Simulate network request
            fetch('https://api.example.com/game-round', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ player: playerChoice, computer: computerChoice, winner: winner, timestamp: new Date().toISOString() }),
            })
            .then(response => {
                console.log('Simulated network request sent.');
                // You can add more logic here to handle the response if needed
            })
            .catch(error => {
                console.error('Simulated network request failed:', error);
            });
        });
    });

    // Event listener for the "Play Again" button
    playAgainBtn.addEventListener('click', resetGame);
});
