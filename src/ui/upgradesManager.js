// src/ui/upgradesManager.js

let elements = {};
let gameState = {};
let constants = {};

/**
 * Creates the HTML for a single upgrade card.
 * @param {string} upgradeId - The key for the upgrade in the UPGRADES object.
 * @param {object} upgradeData - The upgrade's data (name, cost, description).
 * @returns {string} - The inner HTML for the upgrade card.
 */
function createUpgradeCardHTML(upgradeId, upgradeData) {
    const isOwned = gameState.purchasedUpgrades[upgradeId];

    // Display "OWNED" if the upgrade has been purchased, otherwise show cost and button.
    const footerHTML = isOwned
        ? `<span class="upgrade-status-owned">OWNED</span>`
        : `
        <span class="upgrade-cost">COST: C ${upgradeData.cost}</span>
        <button class="btn btn-green upgrade-purchase-btn">ACQUIRE</button>
    `;

    return `
        <h3 class="upgrade-title">${upgradeData.name}</h3>
        <p class="upgrade-description">${upgradeData.description}</p>
        <div class="upgrade-footer">
            ${footerHTML}
        </div>
    `;
}

export const upgradesManager = {
    init(dependencies) {
        elements = dependencies.elements;
        gameState = dependencies.gameState;
        constants = dependencies.constants;
    },

    /**
     * Renders all upgrade cards into the grid, based on gameData.js.
     * This is the core function that builds the UI for this tab.
     */
    initialize() {
        if (!elements.upgradesGrid || !constants.UPGRADES) return;

        elements.upgradesGrid.innerHTML = ''; // Clear any stale content

        // Loop through the UPGRADES object from gameData.js
        for (const upgradeId in constants.UPGRADES) {
            const upgradeData = constants.UPGRADES[upgradeId];
            const isOwned = gameState.purchasedUpgrades[upgradeId];

            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.dataset.upgrade = upgradeId;

            if (isOwned) {
                card.classList.add('completed'); // Add a class for styling owned cards
            }

            card.innerHTML = createUpgradeCardHTML(upgradeId, upgradeData);
            elements.upgradesGrid.appendChild(card);
        }
    },

    /**
     * Updates a specific card's UI after it has been purchased.
     * @param {HTMLElement} cardElement - The card element to update.
     */
    updateCard(cardElement) {
        const footer = cardElement.querySelector('.upgrade-footer');
        if (footer) {
            footer.innerHTML = `<span class="upgrade-status-owned">OWNED</span>`;
        }
        cardElement.classList.add('completed');
    },
};