document.addEventListener("DOMContentLoaded", () => {
    // Simple array of countries and their flags
    const flags = [
        { country: "Finland", flagUrl: "finland.png" },
        { country: "Sweden", flagUrl: "sweden.png" },
        { country: "Norway", flagUrl: "norway.png" },
        // Add more countries and flags as needed
    ];

    let currentFlag;
    let attempts = 5;

    const flagImage = document.getElementById("flagImage");
    const guessInput = document.getElementById("guessInput");
    const submitGuess = document.getElementById("submitGuess");
    const messageDisplay = document.getElementById("messageDisplay");

    function pickRandomFlag() {
        const randomIndex = Math.floor(Math.random() * flags.length);
        currentFlag = flags[randomIndex];
        flagImage.src = currentFlag.flagUrl;
    }

    function resetGame() {
        attempts = 5;
        guessInput.value = '';
        messageDisplay.textContent = "";
        pickRandomFlag();
    }

    function checkGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            messageDisplay.textContent = "Please enter a guess!";
            return;
        }

        if (userGuess.toLowerCase() === currentFlag.country.toLowerCase()) {
            messageDisplay.textContent = "Correct! You guessed the flag.";
            setTimeout(resetGame, 2000); // Reset the game after 2 seconds
        } else {
            attempts -= 1;
            if (attempts > 0) {
                messageDisplay.textContent = `Wrong! You have ${attempts} attempts left.`;
            } else {
                messageDisplay.textContent = `Game over! The correct answer was ${currentFlag.country}.`;
                setTimeout(resetGame, 2000); // Reset the game after 2 seconds
            }
        }
    }

    submitGuess.addEventListener("click", checkGuess);

    // Initialize game
    resetGame();
});