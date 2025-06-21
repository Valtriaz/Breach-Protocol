// src/ui/upgradesManager.js

let gameState = {};

export const upgradesManager = {
    init(dependencies) {
        gameState = dependencies.gameState;
    },

    initialize() {
        document.querySelectorAll('.upgrade-card').forEach(card => {
            const upgradeId = card.dataset.upgrade;
            if (gameState.purchasedUpgrades[upgradeId]) {
                this.updateCard(card);
            }
        });
    },

    updateCard(cardElement) {
        const footer = cardElement.querySelector('.upgrade-footer');
        if (footer) {
            footer.innerHTML = `<span class="upgrade-status-owned">OWNED</span>`;
        }
    },
};
