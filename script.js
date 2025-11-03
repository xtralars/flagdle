document.addEventListener("DOMContentLoaded", () => {
    let countries = [];
    let currentCountry;
    let attempts = 5;
    let selectedIndex = -1; // Track the selected suggestion index

    const flagImage = document.getElementById("flagImage");
    const guessInput = document.getElementById("guessInput");
    const submitGuess = document.getElementById("submitGuess");
    const messageDisplay = document.getElementById("messageDisplay");
    const suggestions = document.getElementById("suggestions");

    async function fetchCountries() {
        try {
            const response = await fetch("https://restcountries.com/v3.1/all?fields=name,flags");
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

    function filterCountries(query) {
        return countries
            .map(country => country.name)
            .filter(name => name.toLowerCase().includes(query.toLowerCase()));
    }

    function showSuggestions(matches) {
        suggestions.innerHTML = '';
        selectedIndex = -1; // Reset selection on new input

        if (matches.length === 0 || !guessInput.value.trim()) {
            suggestions.style.display = 'none';
            return;
        }

        matches.forEach(match => {
            const li = document.createElement('li');
            li.textContent = match;
            li.addEventListener('click', () => {
                guessInput.value = match;
                suggestions.style.display = 'none';
            });
            suggestions.appendChild(li);
        });

        suggestions.style.display = 'block';
    }

    guessInput.addEventListener("input", () => {
        const query = guessInput.value;
        const matches = filterCountries(query);
        showSuggestions(matches);
    });

    guessInput.addEventListener("keydown", (event) => {
        const visibleSuggestions = suggestions.querySelectorAll('li');

        if (event.key === "Enter") {
            if (selectedIndex >= 0) {
                guessInput.value = visibleSuggestions[selectedIndex].textContent;
                suggestions.style.display = 'none';
            }
            checkGuess();
        } else if (event.key === "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % visibleSuggestions.length;
            updateHighlightedSuggestion(visibleSuggestions);
        } else if (event.key === "ArrowUp") {
            selectedIndex = (selectedIndex - 1 + visibleSuggestions.length) % visibleSuggestions.length;
            updateHighlightedSuggestion(visibleSuggestions);
        }
    });

    function updateHighlightedSuggestion(suggestions) {
        suggestions.forEach((suggestion, index) => {
            if (index === selectedIndex) {
                suggestion.style.backgroundColor = '#f0f0f0';
                suggestion.scrollIntoView({ block: 'nearest' });
            } else {
                suggestion.style.backgroundColor = '#fff';
            }
        });
    }

    submitGuess.addEventListener("click", checkGuess);

    document.addEventListener('click', (e) => {
        if (!guessInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });

    fetchCountries();

});
