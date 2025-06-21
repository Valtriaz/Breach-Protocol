// src/ui/headerManager.js

let elements = {};
let gameState = {};

export const headerManager = {
    init(dependencies) {
        elements = dependencies.elements;
        gameState = dependencies.gameState;
    },

    updateCredits() {
        elements.creditsIndicator.textContent = `C ${gameState.credits}`;
    },

    updateAgentName(name) {
        if (!name) return;
        elements.agentNameDisplay.textContent = `AGENT: ${name.toUpperCase()}`;
    },
};
