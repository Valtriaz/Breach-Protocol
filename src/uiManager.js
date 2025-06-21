// src/uiManager.js
import { headerManager } from './ui/headerManager.js';
import { viewManager } from './ui/viewManager.js';
import { modalManager } from './ui/modalManager.js';
import { networkMapRenderer } from './ui/networkMapRenderer.js';
import { dataLogsRenderer } from './ui/dataLogsRenderer.js';
import { upgradesManager } from './ui/upgradesManager.js';

// This module is responsible for all direct DOM manipulation and UI updates.
// It is initialized with all necessary DOM elements, game state, and callbacks.

let elements = {};
let gameState = {};
let constants = {};
let puzzleManager = {};

export const uiManager = {
    init(dependencies) {
        elements = dependencies.elements;
        gameState = dependencies.gameState;
        constants = dependencies.constants;
        puzzleManager = dependencies.puzzleManager;

        // Diagnostic: Check if hackingViewModal is correctly passed
        if (!elements.hackingViewModal) {
            console.error("uiManager: Hacking modal element (id='view-hacking') not found in DOM during initialization. Please ensure 'view-hacking' exists in index.html and is correctly passed.");
        }

        // Initialize all sub-managers
        const subManagerDeps = {
            elements: elements,
            gameState: gameState,
            constants: constants,
            puzzleManager: puzzleManager,
            showMessage: this.showMessage.bind(this),
            addConsoleMessage: this.addConsoleMessage.bind(this),
        };

        headerManager.init(subManagerDeps);
        viewManager.init(subManagerDeps);
        modalManager.init(subManagerDeps);
        networkMapRenderer.init(subManagerDeps);
        dataLogsRenderer.init(subManagerDeps);
        upgradesManager.init(subManagerDeps);
    },

    // --- Facade Methods ---
    // These methods delegate to the appropriate sub-manager.
    // This keeps the API consistent for app.js while organizing the internal logic.

    showView(viewId) {
        viewManager.show(viewId);
    },
    showMessage(title, message, isError = false, isConfirm = false, onConfirm = () => {}) {
        modalManager.showMessage(title, message, isError, isConfirm, onConfirm);
    },

    updateCreditsUI() {
        headerManager.updateCredits();
    },

    updateAgentNameDisplay(name) {
        headerManager.updateAgentName(name);
    },

    renderNetworkMap() {
        networkMapRenderer.render();
    },
    renderDataLogs() {
        dataLogsRenderer.render();
    },
    initializeUpgradesUI() {
        upgradesManager.initialize();
    },
    updateUpgradeCardUI(cardElement) {
        upgradesManager.updateCard(cardElement);
    },

    // --- Methods that remain in the main UI Manager ---
    // These are either simple, cross-cutting, or don't fit a specific sub-manager.
    displayLoginError(message) {
        if (elements.loginErrorMessage) {
            elements.loginErrorMessage.textContent = message;
            elements.loginErrorMessage.classList.remove('hidden');
        }
    },

    clearLoginError() {
        if (elements.loginErrorMessage) {
            elements.loginErrorMessage.textContent = '';
            elements.loginErrorMessage.classList.add('hidden');
        }
    },

    addConsoleMessage(consoleElement, sender, message, colorClass = 'text-gray-400') {
        const newMessage = document.createElement('span');
        newMessage.classList.add(colorClass);
        newMessage.textContent = `[${sender}] ${message}`;
        consoleElement.appendChild(newMessage);
        consoleElement.appendChild(document.createElement('br'));
        consoleElement.scrollTop = consoleElement.scrollHeight;
    },

    updateHackActionButtons() {
        const isPuzzleActive = puzzleManager.isPuzzleActive();
        if (gameState.bossFightActive) {
            elements.bypassFirewallBtn.classList.add('hidden');
            elements.extractDataBtn.classList.add('hidden');
        } else {
            elements.bypassFirewallBtn.classList.remove('hidden');
            elements.extractDataBtn.classList.remove('hidden');
            elements.bypassFirewallBtn.disabled = gameState.firewallBypassed || isPuzzleActive;
            elements.bypassFirewallBtn.classList.toggle('btn-disabled', gameState.firewallBypassed || isPuzzleActive);
            elements.extractDataBtn.disabled = !gameState.firewallBypassed || gameState.dataExtracted || isPuzzleActive;
            elements.extractDataBtn.classList.toggle('btn-disabled', !gameState.firewallBypassed || gameState.dataExtracted || isPuzzleActive);
        }
    },

    triggerScreenShake() {
        if (elements.terminalContainer) {
            elements.terminalContainer.classList.add('shake');
            setTimeout(() => {
                elements.terminalContainer.classList.remove('shake');
            }, 500); // Duration must match the CSS animation duration
        }
    },

    showGameOverModal() {
        modalManager.showGameOver();
    },

    showGameCompleteModal() {
        modalManager.showGameComplete();
    },

    // New methods for hacking console modal
    showHackingViewAsModal() {
        if (elements.hackingViewModal) {
            elements.mainNavTabs.classList.add('hidden'); // Hide main navigation
            elements.gameHeader.classList.add('hidden'); // Hide game header
            elements.hackingViewModal.classList.add('modal-show');
            // Optionally, disable main nav tabs while hacking modal is open
            elements.mainNavTabs.querySelectorAll('.nav-tab').forEach(tab => tab.disabled = true);
        }
    },

    hideHackingViewAsModal() {
        if (elements.hackingViewModal) {
            elements.mainNavTabs.classList.remove('hidden'); // Show main navigation
            elements.gameHeader.classList.remove('hidden'); // Show game header
            elements.hackingViewModal.classList.remove('modal-show');
            // Re-enable main nav tabs
            elements.mainNavTabs.querySelectorAll('.nav-tab').forEach(tab => tab.disabled = false);
        }
    }
};
