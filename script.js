document.addEventListener("DOMContentLoaded", () => {
    const MAX_ATTEMPTS = 5;
    const BEST_KEY = "flagQuizBestStreak";

    let countries = [];
    let knownGuesses = new Set();
    let deck = [];
    let currentCountry = null;
    let attempts = MAX_ATTEMPTS;
    let roundOver = false;
    let hintText = "";
    let selectedIndex = -1;
    let score = 0;
    let streak = 0;
    let bestStreak = loadBest();

    // DOM elements
    const flagImage = document.getElementById("flagImage");
    const guessInput = document.getElementById("guessInput");
    const submitGuess = document.getElementById("submitGuess");
    const hintButton = document.getElementById("hintButton");
    const skipButton = document.getElementById("skipButton");
    const nextButton = document.getElementById("nextButton");
    const messageDisplay = document.getElementById("messageDisplay");
    const suggestions = document.getElementById("suggestions");
    const attemptsDisplay = document.getElementById("attemptsDisplay");
    const scoreEl = document.getElementById("score");
    const streakEl = document.getElementById("streak");
    const bestEl = document.getElementById("bestStreak");

    // ---------- Helpers ----------
    function loadBest() {
        try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
    }

    function saveBest(value) {
        try { localStorage.setItem(BEST_KEY, String(value)); } catch (e) { /* storage unavailable */ }
    }

    // Lowercase and strip accents so "São Tomé" matches "sao tome"
    function normalize(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function setMessage(text, type) {
        messageDisplay.textContent = text;
        messageDisplay.className = "message" + (type ? " " + type : "");
    }

    function updateStats() {
        scoreEl.textContent = score;
        streakEl.textContent = streak;
        bestEl.textContent = bestStreak;
    }

    function renderAttempts() {
        attemptsDisplay.innerHTML = "";
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const dot = document.createElement("span");
            dot.className = "dot" + (i < attempts ? "" : " used");
            attemptsDisplay.appendChild(dot);
        }
        attemptsDisplay.setAttribute("aria-label", `${attempts} attempts left`);
    }

    // Only auto-focus on devices with a precise pointer, so phones don't pop the keyboard
    function focusInput() {
        if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) guessInput.focus();
    }

    function drawCountry() {
        if (deck.length === 0) deck = shuffle([...countries]);   // every flag once before any repeats
        const country = deck.pop();
        if (deck.length > 0) new Image().src = deck[deck.length - 1].flagUrl;  // preload the next one
        return country;
    }

    function setControls(active) {
        guessInput.disabled = !active;
        submitGuess.disabled = !active;
        hintButton.disabled = !active;
        skipButton.disabled = !active;
    }

    // ---------- Data ----------
    async function fetchCountries() {
        try {
            const response = await fetch("countries.json");
            if (!response.ok) throw new Error("HTTP " + response.status);
            const data = await response.json();

            countries = data.map(c => ({
                name: c.name,
                aliases: c.aliases || [],
                flagUrl: `https://flagcdn.com/w640/${c.code}.png`
            }));
            knownGuesses = new Set(
                countries.flatMap(c => [c.name, ...c.aliases]).map(normalize)
            );

            updateStats();
            startRound();
        } catch (error) {
            console.error("Error fetching countries:", error);
            setMessage("Couldn't load the country list. Check your connection and refresh the page.", "wrong");
        }
    }

    // ---------- Round flow ----------
    function startRound() {
        roundOver = false;
        attempts = MAX_ATTEMPTS;
        hintText = "";
        selectedIndex = -1;
        currentCountry = drawCountry();

        flagImage.src = currentCountry.flagUrl;
        guessInput.value = "";
        suggestions.style.display = "none";
        nextButton.hidden = true;
        setMessage("");
        setControls(true);
        renderAttempts();
        focusInput();
    }

    function endRound(text, type) {
        roundOver = true;
        setControls(false);
        suggestions.style.display = "none";
        setMessage(text, type);
        nextButton.hidden = false;
        nextButton.focus();
    }

    function checkGuess() {
        if (roundOver) return;

        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            setMessage("Type a country name first.");
            return;
        }

        // Typos and non-countries don't cost an attempt
        if (!knownGuesses.has(normalize(userGuess))) {
            setMessage("That isn't in the list. Pick one of the suggestions.");
            return;
        }

        const accepted = [currentCountry.name, ...currentCountry.aliases].map(normalize);
        if (accepted.includes(normalize(userGuess))) {
            score += 1;
            streak += 1;
            if (streak > bestStreak) {
                bestStreak = streak;
                saveBest(bestStreak);
            }
            updateStats();
            endRound(`Correct! It's ${currentCountry.name}.`, "correct");
            return;
        }

        attempts -= 1;
        renderAttempts();
        if (attempts > 0) {
            setMessage(`Not quite. ${attempts} ${attempts === 1 ? "attempt" : "attempts"} left. ${hintText}`.trim(), "wrong");
            guessInput.select();
        } else {
            streak = 0;
            updateStats();
            endRound(`Out of attempts. It was ${currentCountry.name}.`, "wrong");
        }
    }

    function showHint() {
        if (roundOver) return;
        const name = currentCountry.name;
        hintText = `Hint: starts with ${name[0]}, ${name.length} letters.`;
        setMessage(hintText);
        hintButton.disabled = true;
        guessInput.focus();
    }

    function skipFlag() {
        if (roundOver) return;
        streak = 0;
        updateStats();
        endRound(`Skipped. It was ${currentCountry.name}.`);
    }

    // ---------- Suggestions ----------
    function filterCountries(query) {
        const q = normalize(query);
        return countries
            .filter(c => [c.name, ...c.aliases].some(n => normalize(n).includes(q)))
            .map(c => c.name);
    }

    function showSuggestions(matches) {
        suggestions.innerHTML = "";
        selectedIndex = -1;

        if (matches.length === 0 || !guessInput.value.trim()) {
            suggestions.style.display = "none";
            return;
        }

        matches.forEach(match => {
            const li = document.createElement("li");
            li.textContent = match;
            li.setAttribute("role", "option");
            li.addEventListener("click", () => {
                guessInput.value = match;
                suggestions.style.display = "none";
                guessInput.focus();
            });
            suggestions.appendChild(li);
        });

        suggestions.style.display = "block";
    }

    function updateHighlightedSuggestion(items) {
        items.forEach((item, index) => {
            const selected = index === selectedIndex;
            item.classList.toggle("selected-suggestion", selected);
            if (selected) item.scrollIntoView({ block: "nearest" });
        });
    }

    guessInput.addEventListener("input", () => {
        showSuggestions(filterCountries(guessInput.value));
    });

    guessInput.addEventListener("keydown", (event) => {
        const items = suggestions.querySelectorAll("li");

        if (event.key === "Enter") {
            if (selectedIndex >= 0 && items[selectedIndex]) {
                guessInput.value = items[selectedIndex].textContent;
                suggestions.style.display = "none";
            }
            checkGuess();
        } else if (event.key === "Escape") {
            suggestions.style.display = "none";
        } else if (event.key === "ArrowDown" && items.length > 0) {
            event.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateHighlightedSuggestion(items);
        } else if (event.key === "ArrowUp" && items.length > 0) {
            event.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateHighlightedSuggestion(items);
        }
    });

    document.addEventListener("click", (e) => {
        if (!guessInput.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });

    flagImage.addEventListener("error", () => {
        if (currentCountry) setMessage("Couldn't load this flag. Check your connection, or press Skip.", "wrong");
    });

    submitGuess.addEventListener("click", checkGuess);
    hintButton.addEventListener("click", showHint);
    skipButton.addEventListener("click", skipFlag);
    nextButton.addEventListener("click", startRound);

    fetchCountries();
});
