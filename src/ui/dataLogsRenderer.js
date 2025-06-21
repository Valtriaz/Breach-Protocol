// src/ui/dataLogsRenderer.js

let elements = {};
let gameState = {};

export const dataLogsRenderer = {
    init(dependencies) {
        elements = dependencies.elements;
        gameState = dependencies.gameState;
    },

    render() {
        elements.dataLogsList.innerHTML = '';
        if (gameState.discoveredLogs.length === 0) {
            elements.dataLogsList.innerHTML = `<p class="text-gray-500 text-center text-lg">No intel collected. Successfully breach network nodes to uncover their secrets.</p>`;
            return;
        }

        gameState.discoveredLogs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.classList.add('data-log-entry');
            logEntry.innerHTML = `
                <h3 class="log-entry-title">${log.title}</h3>
                <p class="log-entry-meta">SOURCE: ${log.source}</p>
                <p class="log-entry-content">${log.content}</p>
            `;
            elements.dataLogsList.appendChild(logEntry);
        });
    },
};
