// Import puzzle manager and constants at the top level
import { puzzleManager } from './src/puzzles/puzzleManager.js';
import { gameState, initGameState, saveGame, loadGame, resetGame } from './src/gameState.js';
import { audioManager } from './src/audioManager.js';
import { uiManager } from './src/uiManager.js';
import { gameLoop } from './src/gameLoop.js';
import { difficultyManager } from './src/difficultyManager.js'; // New import
import { UPGRADES, NETWORK_NODES, INTEL_LOGS } from './src/gameData.js';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const navTabs = document.querySelectorAll('.nav-tab');
    const mainNavTabs = document.getElementById('main-nav-tabs'); // Reference to the nav container
    const gameHeader = document.getElementById('game-header'); // Reference to the game header
    const viewContents = document.querySelectorAll('.view-content');
    const startHackButton = document.getElementById('start-hack-button');
    const terminalContainer = document.getElementById('terminal-container'); // Added reference to main terminal container
    const hackProgressBar = document.getElementById('hack-progress-bar');
    const hackingConsole = document.getElementById('hacking-console');
    const hackingViewTitle = document.getElementById('hacking-view-title');
    const abortHackBtn = document.getElementById('abort-hack-btn');
    const traceLevelIndicator = document.getElementById('trace-level');
    const creditsIndicator = document.getElementById('credits');
    const statusIndicator = document.getElementById('status-indicator');
    const hackScoreDisplay = document.getElementById('hack-score');

    // Puzzle elements
    const puzzleContainer = document.getElementById('puzzle-container'); // Main puzzle area
    const puzzleFeedback = document.getElementById('puzzle-feedback'); // Feedback for puzzles
    const resetPuzzleBtn = document.getElementById('reset-puzzle-btn'); // Retry button for puzzles
    const sequencePuzzleArea = document.getElementById('sequence-puzzle-area'); // Sequence puzzle container
    const sequenceInstructions = document.getElementById('sequence-instructions'); // Sequence puzzle instructions
    const codeSequenceDisplay = document.getElementById('code-sequence-display'); // Sequence puzzle display
    const pathfindingPuzzleArea = document.getElementById('pathfinding-puzzle-area'); // Pathfinding puzzle container
    const pathfindingGrid = document.getElementById('pathfinding-grid'); // Pathfinding grid
    const timedInputPuzzleArea = document.getElementById('timed-input-puzzle-area'); // Timed input puzzle container
    const timedInputSequence = document.getElementById('timed-input-sequence'); // Timed input sequence display
    const timedInputTimer = document.getElementById('timed-input-timer'); // Timed input timer bar
    const timedInputField = document.getElementById('timed-input-field'); // Timed input field
    const bypassFirewallBtn = document.getElementById('bypass-firewall-btn');
    const extractDataBtn = document.getElementById('extract-data-btn');

    // Modal elements
    const messageModal = document.getElementById('message-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const loadFromGameOverBtn = document.getElementById('load-from-game-over-btn');
    const gameCompleteModal = document.getElementById('game-complete-modal');
    const newGameBtn = document.getElementById('new-game-btn');

    // Hacking Modal specific elements
    const hackingViewModal = document.getElementById('view-hacking'); // The hacking console itself is now a modal
    const closeHackingModalBtn = document.getElementById('close-hacking-modal-btn');


    // Tools/Upgrades elements
    const networkMapGrid = document.getElementById('network-map-grid');
    const dataLogsList = document.getElementById('data-logs-list');
    const breachBossBtn = document.getElementById('breach-boss-btn');
    const bossNodeCard = document.getElementById('boss-node-chimera');
    const upgradesGrid = document.getElementById('upgrades-grid');

    // Login Elements
    const agentNameInput = document.getElementById('agent-name-input');
    const loginBtn = document.getElementById('login-btn');
    const loginErrorMessage = document.getElementById('login-error-message');
    // Settings Elements
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const muteCheckbox = document.getElementById('mute-checkbox');

    // Save/Load Buttons
    const newGameBtnLogin = document.getElementById('new-game-btn-login');
    const saveGameBtn = document.getElementById('save-game-btn');
    const agentNameDisplay = document.getElementById('agent-name-display');
    const loadGameBtn = document.getElementById('load-game-btn');
    const deleteSaveBtn = document.getElementById('delete-save-btn'); // Corrected ID

    // --- Game State Flow (Game Over / Win) ---
    function handleGameOver() {
        clearInterval(gameState.hackInterval);
        puzzleManager.resetPuzzleUI();
        audioManager.play('game-over');
        uiManager.showGameOverModal();
    }

    function handleGameComplete() {
        clearInterval(gameState.hackInterval);
        puzzleManager.resetPuzzleUI();
        audioManager.play('game-win');
        uiManager.showGameCompleteModal();
    }

    // --- Network Map Logic ---
    function handleNetworkNodeClick(event) {
        const hackBtn = event.target.closest('.hack-node-btn');
        if (!hackBtn) return;

        const nodeId = hackBtn.dataset.nodeId;
        const selectedNode = NETWORK_NODES.find(node => node.id === nodeId);

        if (selectedNode) {
            // uiManager.showView('hacking'); // Removed: gameLoop.start will now show the modal
            gameLoop.start(selectedNode);
        }
    }

    // --- Upgrades Logic ---
    function handleUpgradePurchase(event) {
        const purchaseBtn = event.target.closest('.upgrade-purchase-btn');
        if (!purchaseBtn) return;

        const card = purchaseBtn.closest('.upgrade-card');
        const upgradeId = card.dataset.upgrade;
        const upgrade = UPGRADES[upgradeId];

        if (gameState.purchasedUpgrades[upgradeId]) {
            uiManager.showMessage('Already Owned', `You have already acquired the ${upgrade.name}.`, false);
            return;
        }

        if (gameState.credits >= upgrade.cost) {
            gameState.credits -= upgrade.cost;
            gameState.purchasedUpgrades[upgradeId] = true;
            uiManager.updateCreditsUI();
            uiManager.updateUpgradeCardUI(card);

            uiManager.showMessage('Purchase Successful', `${upgrade.name} has been integrated into your system.`, false);
            uiManager.addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `Acquired new tool: ${upgrade.name}.`, 'text-[#00F0FF]');
        } else {
            uiManager.showMessage('Insufficient Credits', `You need C ${upgrade.cost} to purchase the ${upgrade.name}. You only have C ${gameState.credits}.`, true);
        }
    }

    // --- Story Progression Logic ---
    function checkMissionUnlocks() {
        let aNodeWasUnlocked = false;
        NETWORK_NODES.forEach(node => {
            if (node.isLocked && node.requirements && node.requirements.nodes) {
                const requiredNodes = node.requirements.nodes;
                
                const allRequirementsMet = requiredNodes.every(reqNodeId => {
                    const requiredNode = NETWORK_NODES.find(n => n.id === reqNodeId);
                    return requiredNode && requiredNode.isCompleted;
                });

                if (allRequirementsMet) {
                    node.isLocked = false;
                    aNodeWasUnlocked = true;
                    uiManager.addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `New network node available: ${node.name}`, 'text-[#00F0FF]');
                    if (node.isBoss) {
                         uiManager.addConsoleMessage(document.getElementById('activity-feed'), 'CRITICAL', `All critical intel acquired. The path to the Nexus Core is open. End this.`, 'text-[#EF4444]');
                         uiManager.showMessage('NEXUS CORE UNLOCKED', 'You have pieced together the conspiracy. It\'s time to take down their central server and clear your name.', false);
                         // Enable the static boss node button and add animation
                         if (breachBossBtn && bossNodeCard) {
                            breachBossBtn.disabled = false;
                            breachBossBtn.classList.remove('btn-disabled');
                            bossNodeCard.classList.add('unlocked-pulse');
                         }
                    }
                }
            }
        });

        if (aNodeWasUnlocked) {
            uiManager.renderNetworkMap();
        }
    }

    // --- Callbacks for Puzzle Manager ---
    function updateTraceLevel(newTrace) {
        gameState.traceLevel = newTrace;
        traceLevelIndicator.textContent = `${Math.floor(gameState.traceLevel)}%`;
    }

    function updateHackScore(scoreIncrease) {
        gameState.hackScore += scoreIncrease;
        hackScoreDisplay.textContent = gameState.hackScore;
    }

    function onPuzzleSuccess(isBossFight, completedBossStageIndex) {
        if (isBossFight) {
            gameState.currentBossStageIndex = completedBossStageIndex + 1;
            if (gameState.currentBossStageIndex < gameState.currentHackedNode.bossStages.length) {
                uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', `Nexus Core Stage ${gameState.currentBossStageIndex} bypassed. Proceeding to next phase.`, 'text-[#00F0FF]');
                setTimeout(() => puzzleManager.activatePuzzle(gameState.currentHackedNode, null, true, gameState.currentBossStageIndex), 1500);
            } else {
                uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', 'NEXUS CORE BREACHED! MISSION COMPLETE!', 'text-[#00FF99]');
                gameState.firewallBypassed = true;
                gameState.dataExtracted = true;
            }
        } else {
            if (!gameState.firewallBypassed) {
                gameState.firewallBypassed = true;
                uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', 'Firewall bypassed. Data extraction ready.', 'text-[#00F0FF]');
            } else if (!gameState.dataExtracted) {
                gameState.dataExtracted = true;
                uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', 'Critical data acquired. Prepare for virus deployment.', 'text-[#00F0FF]');
            }
        }

        uiManager.updateHackActionButtons();
    }

    function onPuzzleFail() {
        uiManager.updateHackActionButtons();
    }

    // Initialize view to Sanctuary on load
    function initializeGame() {
        audioManager.init();

        if (volumeSlider) {
            volumeSlider.value = audioManager.volume;
            volumeValue.textContent = `${Math.round(volumeSlider.value * 100)}%`; // Use volumeSlider.value
        }
        if (muteCheckbox) {
            muteCheckbox.checked = audioManager.isMuted;
        }
        const uiElements = {
            navTabs, mainNavTabs, gameHeader, viewContents, terminalContainer, hackProgressBar, hackingConsole,
            hackingViewTitle, abortHackBtn, traceLevelIndicator, creditsIndicator,
            statusIndicator, hackScoreDisplay, puzzleContainer, puzzleFeedback,
            resetPuzzleBtn, sequencePuzzleArea, sequenceInstructions, codeSequenceDisplay,
            pathfindingPuzzleArea, pathfindingGrid, timedInputPuzzleArea, timedInputSequence,
            timedInputTimer, timedInputField, bypassFirewallBtn, extractDataBtn,
            messageModal, modalTitle, modalMessage, modalCloseBtn, gameOverModal, saveGameBtn, loadGameBtn, deleteSaveBtn,
            restartGameBtn, loadFromGameOverBtn, gameCompleteModal, newGameBtn,
            networkMapGrid, dataLogsList, upgradesGrid, agentNameDisplay, agentNameInput, loginErrorMessage,
            hackingViewModal // Pass the hacking modal element
        };

        uiManager.init({
            elements: uiElements,
            gameState,
            constants: { NETWORK_NODES, UPGRADES, INTEL_LOGS },
            puzzleManager
        });
        uiManager.updateAgentNameDisplay(gameState.agentName || 'CIPHER');
        audioManager.loadSettings();

        difficultyManager.init(); // Initialize difficulty manager
        initGameState({
            UPGRADES,
            NETWORK_NODES,
            showMessage: uiManager.showMessage,
            addConsoleMessage: uiManager.addConsoleMessage,
            activityFeed: document.getElementById('activity-feed'),
            difficultyManager // Add this dependency
        });

        const wasGameLoaded = loadGame();

        if (gameState.agentName) {
            postLoginInitialization(wasGameLoaded);
        } else {
            uiManager.showView('login');
        }
    }

    function postLoginInitialization(wasGameLoaded) {
        uiManager.updateAgentNameDisplay(gameState.agentName);
        gameLoop.init({
            uiManager,
            puzzleManager,
            handleGameOver,
            handleGameComplete,
            checkMissionUnlocks,
            INTEL_LOGS,
            difficultyManager, // Pass difficultyManager to gameLoop
            elements: {
                navTabs, mainNavTabs, gameHeader, viewContents, terminalContainer, hackProgressBar, hackingConsole,
                hackingViewTitle, abortHackBtn, traceLevelIndicator, creditsIndicator,
                statusIndicator, hackScoreDisplay, puzzleContainer, puzzleFeedback,
                resetPuzzleBtn, sequencePuzzleArea, sequenceInstructions, codeSequenceDisplay,
                pathfindingPuzzleArea, pathfindingGrid, timedInputPuzzleArea, timedInputSequence,
                timedInputTimer, timedInputField, bypassFirewallBtn, extractDataBtn,
                messageModal, modalTitle, modalMessage, modalCloseBtn, gameOverModal, saveGameBtn, loadGameBtn, deleteSaveBtn,
                restartGameBtn, loadFromGameOverBtn, gameCompleteModal, newGameBtn,
                networkMapGrid, dataLogsList, upgradesGrid, agentNameDisplay, agentNameInput, loginErrorMessage,
                hackingViewModal // Pass the hacking modal element
            }
        });

        puzzleManager.init({
            puzzleContainer, puzzleFeedback, resetPuzzleBtn, sequencePuzzleArea, sequenceInstructions, codeSequenceDisplay,
            pathfindingPuzzleArea, pathfindingGrid, timedInputPuzzleArea, timedInputSequence, timedInputTimer, timedInputField,
            hackingConsole, traceLevelIndicator, hackScoreDisplay, statusIndicator, audioManager,
            showMessage: uiManager.showMessage, 
            addConsoleMessage: uiManager.addConsoleMessage,
            difficultyManager: difficultyManager, // Pass difficultyManager to puzzleManager
            triggerScreenShake: uiManager.triggerScreenShake
        }, {
            updateTraceLevel, updateHackScore, onPuzzleSuccess, onPuzzleFail
        }, {
            getGameStates: () => ({
                traceLevel: gameState.traceLevel, 
                hackScore: gameState.hackScore, 
                purchasedUpgrades: gameState.purchasedUpgrades, 
                firewallBypassed: gameState.firewallBypassed, 
                dataExtracted: gameState.dataExtracted
            })
        });
        uiManager.showView('sanctuary');
        if (wasGameLoaded) {
            uiManager.addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', 'Save data loaded successfully.', 'text-[#00F0FF]');
        }
        
        uiManager.updateCreditsUI();
        uiManager.renderNetworkMap();
        uiManager.initializeUpgradesUI();
        uiManager.renderDataLogs();
    }
    
    // --- Event Listeners ---
    startHackButton.addEventListener('click', () => {
        const firstNode = NETWORK_NODES.find(node => !node.isLocked);
        if (firstNode) {
            // uiManager.showView('hacking'); // Removed: gameLoop.start will now show the modal
            gameLoop.start(firstNode);
        }
    });

    function handleLogin() {
        const agentName = agentNameInput.value.trim();
        if (agentName.length < 3) {
            uiManager.displayLoginError('Agent codename must be at least 3 characters long.');
            audioManager.play('buttonClick');
            return;
        }
        uiManager.clearLoginError();
        gameState.agentName = agentName;
        saveGame();
        postLoginInitialization(false);
        uiManager.addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `Welcome, Agent ${agentName.toUpperCase()}.`, 'text-[#00FF99]');
        audioManager.play('buttonClick');
    }

    loginBtn.addEventListener('click', handleLogin);

    agentNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    });

    newGameBtnLogin.addEventListener('click', () => {
        uiManager.showMessage(
            'Start New Game?',
            'This will permanently delete any saved progress. Are you sure?',
            true, true,
            () => {
                resetGame();
                uiManager.showMessage('Game Reset', 'All progress has been cleared. The application will now restart.', false);
                setTimeout(() => location.reload(), 2000);
            }
        );
    });

    abortHackBtn.addEventListener('click', gameLoop.abort);
    closeHackingModalBtn.addEventListener('click', gameLoop.abort); // New: Close button for hacking modal

    // This check is necessary because the boss button is static HTML and might not exist if the HTML is changed.
    if (breachBossBtn) {
        breachBossBtn.addEventListener('click', () => {
            // Find the boss node data from the game constants
            const bossNode = NETWORK_NODES.find(node => node.isBoss);
            if (bossNode && !bossNode.isLocked) {
                gameLoop.start(bossNode);
            } else {
                audioManager.play('error');
                uiManager.showMessage('Access Denied', 'All other network nodes must be compromised before you can attempt this breach.', true);
            }
        });
    }

    networkMapGrid.addEventListener('click', handleNetworkNodeClick);
    upgradesGrid.addEventListener('click', handleUpgradePurchase);
    
    saveGameBtn.addEventListener('click', () => {
        if (gameState.currentView === 'hacking' || hackingViewModal.classList.contains('modal-show')) { // Check if hacking modal is open
            uiManager.showMessage('Action Unavailable', 'Cannot save during an active breach.', true);
            return;
        }
        saveGame();
    });

    loadGameBtn.addEventListener('click', () => {
        uiManager.showMessage(
            'Load Game?',
            'Loading will overwrite your current unsaved progress. Are you sure you want to load?',
            false, true,
            () => {
                performLoadGame();
            
            }
        );
    });

    function performLoadGame() {
        if (gameState.currentView === 'hacking' || hackingViewModal.classList.contains('modal-show')) { // Check if hacking modal is open
            uiManager.showMessage('Action Unavailable', 'Cannot load a game during an active breach.', true);
            return;
        }
        const loadResult = loadGame();

        switch (loadResult) {
            case true: // Success
                uiManager.updateCreditsUI();
                uiManager.initializeUpgradesUI();
                uiManager.renderDataLogs();
                uiManager.renderNetworkMap();
                uiManager.updateAgentNameDisplay(gameState.agentName);
                uiManager.showMessage('Game Loaded', 'Your progress has been restored.', false);
                uiManager.addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', 'Session progress loaded.', 'text-[#00F0FF]');
                break;
            case false: // No save file
                uiManager.showMessage('Load Failed', 'No save data found in this browser.', true);
                break;
            case 'corrupted': // Corrupted save file
                // Message is shown from gameState.js. Reload to reflect reset state.
                setTimeout(() => location.reload(), 2000);
                break;
        }
    }

    deleteSaveBtn.addEventListener('click', () => {
        uiManager.showMessage(
            'Delete Save?',
            'This will permanently delete your saved game data. This action cannot be undone. Are you sure?',
            true, true,
            () => {
                resetGame();
                uiManager.showMessage('Game Reset', 'All progress has been cleared. The application will now restart.', false);
                setTimeout(() => location.reload(), 2000);
            }
        );
    });

    volumeSlider.addEventListener('input', () => {
        const newVolume = volumeSlider.value;
        audioManager.setVolume(newVolume);
        volumeValue.textContent = `${Math.round(newVolume * 100)}%`;
    });

    muteCheckbox.addEventListener('input', () => {
        audioManager.setMute(muteCheckbox.checked);
        audioManager.play('buttonClick');
    });

    volumeSlider.addEventListener('change', () => {
        audioManager.play('buttonClick');
    });

    bypassFirewallBtn.addEventListener('click', () => {
        if (gameState.bossFightActive) return;
        if (!gameState.firewallBypassed && !puzzleManager.isPuzzleActive()) {
            uiManager.addConsoleMessage(hackingConsole, 'USER', 'Attempting to bypass firewall...', 'text-[#00F0FF]');
            puzzleManager.activatePuzzle(gameState.currentHackedNode, 'firewall');
            uiManager.updateHackActionButtons();
        } else if (gameState.firewallBypassed) {
            uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', 'Firewall already bypassed.', 'text-gray-500');
            uiManager.showMessage('Info', 'Firewall already bypassed.', false);
        }
    });

    extractDataBtn.addEventListener('click', () => {
        if (gameState.bossFightActive) return;
        if (gameState.firewallBypassed && !gameState.dataExtracted && !puzzleManager.isPuzzleActive()) {
            uiManager.addConsoleMessage(hackingConsole, 'USER', 'Initiating data extraction...', 'text-[#00F0FF]');
            puzzleManager.activatePuzzle(gameState.currentHackedNode, 'data');
            uiManager.updateHackActionButtons();
        } else if (!gameState.firewallBypassed) {
            uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', 'Bypass firewall first!', 'text-[#EF4444]');
            uiManager.showMessage('Error', 'Bypass firewall first!', true);
        } else if (gameState.dataExtracted) {
            uiManager.addConsoleMessage(hackingConsole, 'SYSTEM', 'Data already extracted!', 'text-gray-500');
            uiManager.showMessage('Info', 'Data already extracted!', false);
        }
    });

    // Game Over / Win Modal Listeners
    restartGameBtn.addEventListener('click', () => {
        location.reload();
    });

    loadFromGameOverBtn.addEventListener('click', () => {
        location.reload();
    });

    newGameBtn.addEventListener('click', () => {
        localStorage.removeItem('breachProtocolSaveData');
        location.reload();
    });

    // Start background music on first user interaction
    document.body.addEventListener('click', () => {
        audioManager.playBgMusic();
    }, { once: true });

    initializeGame();
});
