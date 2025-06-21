// Defines the initial state for a new game.
const defaultPersistentState = {
    credits: 500,
    agentName: null,
    purchasedUpgrades: {},
    discoveredLogs: [],
};

// Defines the initial runtime state, reset between sessions or on game reset.
const defaultRuntimeState = {
    currentView: 'sanctuary',
    traceLevel: 0,
    hackProgress: 0,
    hackInterval: null,
    hackScore: 0,
    currentHackedNode: null,
    firewallBypassed: false,
    dataExtracted: false,
    bossFightActive: false,
    currentBossStageIndex: -1,
    highTraceMessageShown: false,
    criticalTraceMessageShown: false,
};

// --- Game State Object ---
// Centralized object to hold all game state.
// It's initialized by combining the default persistent and runtime states.
export let gameState = {
    ...defaultPersistentState,
    ...defaultRuntimeState,
};

// To hold dependencies from app.js (UI functions, constants, etc.)
let dependencies = {};

/**
 * Initializes the game state module with necessary dependencies from the main app.
 * @param {object} deps - An object containing functions and constants from app.js.
 */
export function initGameState(deps) {
    dependencies = deps;
    // Initialize purchasedUpgrades based on the UPGRADES constant passed in
    if (dependencies.UPGRADES) {
        for (const key in dependencies.UPGRADES) {
            // Ensure we don't overwrite loaded data if init is called after load
            if (gameState.purchasedUpgrades[key] === undefined) {
                gameState.purchasedUpgrades[key] = false;
            }
        }
    }
}

export function saveGame(isAutoSave = false) {
    const { NETWORK_NODES, showMessage, addConsoleMessage, activityFeed, difficultyManager } = dependencies;
    if (!NETWORK_NODES || !showMessage || !addConsoleMessage || !activityFeed || !difficultyManager) {
        console.error("GameState module not initialized with required dependencies for saveGame.");
        return;
    }

    const persistentState = {
        credits: gameState.credits,
        agentName: gameState.agentName, // Save agent's name
        purchasedUpgrades: gameState.purchasedUpgrades,
        discoveredLogs: gameState.discoveredLogs,
        networkNodesState: NETWORK_NODES.map(node => ({ id: node.id, isLocked: node.isLocked, isCompleted: node.isCompleted })),
        playerPerformanceHistory: difficultyManager.getPerformanceHistory()
    };

    localStorage.setItem('breachProtocolSaveData', JSON.stringify(persistentState));

    if (isAutoSave) {
        addConsoleMessage(activityFeed, 'SYSTEM', 'Auto-saving progress after successful mission.', 'text-gray-500');
    } else {
        showMessage('Game Saved', 'Your progress has been saved to this browser\'s local storage.', false);
        addConsoleMessage(activityFeed, 'SYSTEM', 'Session progress saved.', 'text-[#00F0FF]');
    }
}

export function loadGame() {
    const { NETWORK_NODES, showMessage, difficultyManager } = dependencies;
    if (!NETWORK_NODES || !showMessage || !difficultyManager) {
        console.error("GameState module not initialized with required dependencies for loadGame.");
        return false;
    }

    const savedData = localStorage.getItem('breachProtocolSaveData');
    if (savedData) {
        try {
            const savedState = JSON.parse(savedData);

            // Reset runtime state to default before loading persistent data
            Object.assign(gameState, defaultRuntimeState);

            // Load persistent data, using nullish coalescing for safety
            gameState.credits = savedState.credits ?? defaultPersistentState.credits;
            gameState.agentName = savedState.agentName ?? defaultPersistentState.agentName;
            gameState.discoveredLogs = savedState.discoveredLogs ?? [];
            
            if (savedState.purchasedUpgrades) {
                Object.assign(gameState.purchasedUpgrades, savedState.purchasesUpgrades);
                Object.assign(gameState.purchasedUpgrades, savedState.purchasedUpgrades);
            }

            if (savedState.networkNodesState) {
                savedState.networkNodesState.forEach(savedNode => {
                    const nodeToUpdate = NETWORK_NODES.find(n => n.id === savedNode.id);
                    if (nodeToUpdate) {
                        nodeToUpdate.isLocked = savedNode.isLocked;
                        nodeToUpdate.isCompleted = savedNode.isCompleted ?? false;
                    }
                });
            }

            if (savedState.playerPerformanceHistory) {
                difficultyManager.setPerformanceHistory(savedState.playerPerformanceHistory);
            }

            return true; // Indicate success
        } catch (error) {
            console.error("Failed to load or parse save data:", error);
            // If save is corrupted, notify user and reset the game state to prevent errors.
            showMessage('Load Error', 'Save data was corrupted. Resetting game.', true);
            resetGame();
            return 'corrupted';
        }
    }
    return false; // Indicate no save data found
}

export function resetGame() {
    const { NETWORK_NODES, UPGRADES, difficultyManager } = dependencies;
    if (!NETWORK_NODES || !UPGRADES || !difficultyManager) {
        console.error("GameState module not initialized with required dependencies for resetGame.");
        return;
    }

    localStorage.removeItem('breachProtocolSaveData');
    localStorage.removeItem('breachProtocolSettings'); // Also clear settings

    // Reset gameState to initial values using the default state objects
    Object.assign(gameState, defaultPersistentState, defaultRuntimeState);
    
    // Re-initialize purchasedUpgrades to ensure it's a fresh object with all keys set to false.
    gameState.purchasedUpgrades = {};
    for (const key in UPGRADES) {
        gameState.purchasedUpgrades[key] = false;
    }

    // Reset network nodes to their initial locked/uncompleted state.
    NETWORK_NODES.forEach(node => {
        node.isLocked = (node.id !== 'surveillance-grid');
        node.isCompleted = false;
    });

    difficultyManager.resetPerformanceHistory();
}
