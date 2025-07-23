// login.js

// --- DOM Elements ---
const agentNameInput = document.getElementById('agent-name-input');
const loginBtn = document.getElementById('login-btn');
const newGameBtn = document.getElementById('new-game-btn-login');
const errorMessage = document.getElementById('login-error-message');

const SAVE_KEY = 'breachProtocolSaveData';

function handleLogin() {
    const agentName = agentNameInput.value.trim();
    if (agentName.length < 3) {
        errorMessage.textContent = 'Agent codename must be at least 3 characters long.';
        errorMessage.classList.remove('hidden');
        return;
    }

    // Create a complete, valid save object to prevent any errors in the main app.
    const newSaveData = {
        agentName: agentName,
        credits: 500,
        traceLevel: 0,
        hackScore: 0,
        purchasedUpgrades: {},
        completedNodes: [],
        discoveredIntel: [],
        // Add any other default fields your gameState expects
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(newSaveData));

    // Redirect to the main game page
    window.location.href = 'index.html';
}

function handleNewGame() {
    if (confirm('This will permanently delete any saved progress. Are you sure?')) {
        localStorage.removeItem(SAVE_KEY);
        agentNameInput.value = '';
        errorMessage.textContent = 'Save data cleared. Please enter a new codename.';
        errorMessage.classList.remove('hidden');
    }
}

// --- Event Listeners ---
loginBtn.addEventListener('click', handleLogin);
agentNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleLogin();
    }
});
newGameBtn.addEventListener('click', handleNewGame);

document.addEventListener('DOMContentLoaded', () => {
    const existingSave = localStorage.getItem(SAVE_KEY);
    if (existingSave) {
        try {
            const data = JSON.parse(existingSave);
            if (data && data.agentName) {
                window.location.href = 'index.html';
            }
        } catch (e) {
            console.error("Could not parse existing save data.", e);
        }
    }
});