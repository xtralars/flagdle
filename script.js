document.addEventListener("DOMContentLoaded", () => {
    let countries = [];
    let currentCountry;
    let attempts = 5;

    const flagImage = document.getElementById("flagImage");
    const guessInput = document.getElementById("guessInput");
    const submitGuess = document.getElementById("submitGuess");
    const messageDisplay = document.getElementById("messageDisplay");

    async function fetchCountries() {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all");
            const data = await response.json();
            countries = data.map(country => ({
                name: country.name.common,
                flagUrl: country.flags.svg
            }));
            resetGame();
        } catch (error) {
            console.error("Error fetching countries:", error);
            messageDisplay.textContent = "Failed to load country data.";
        }
    }

    function pickRandomCountry() {
        const randomIndex = Math.floor(Math.random() * countries.length);
        currentCountry = countries[randomIndex];
        flagImage.src = currentCountry.flagUrl;
    }

    function resetGame() {
        if (countries.length === 0) {
            messageDisplay.textContent = "No countries data available.";
            return;
        }
        attempts = 5;
        guessInput.value = '';
        messageDisplay.textContent = "";
        pickRandomCountry();
    }

    function checkGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            messageDisplay.textContent = "Please enter a guess!";
            return;
        }

        if (userGuess.toLowerCase() === currentCountry.name.toLowerCase()) {
            messageDisplay.textContent = "Correct! You guessed the flag.";
            setTimeout(resetGame, 2000); // Reset the game after 2 seconds
        } else {
            attempts -= 1;
            if (attempts > 0) {
                messageDisplay.textContent = `Wrong! You have ${attempts} attempts left.`;
            } else {
                messageDisplay.textContent = `Game over! The correct answer was ${currentCountry.name}.`;
                setTimeout(resetGame, 2000); // Reset the game after 2 seconds
            }
        }
    }

    submitGuess.addEventListener("click", checkGuess);

    // Fetch countries data
    fetchCountries();
});
