// src/ui/networkMapRenderer.js

let elements = {};
let constants = {};

export const networkMapRenderer = {
    init(dependencies) {
        elements = dependencies.elements;
        constants = dependencies.constants;
    },

    render() {
        elements.networkMapGrid.innerHTML = '';
        constants.NETWORK_NODES.forEach(node => {
            const canHack = !node.isLocked;
            const nodeCard = document.createElement('div');
            nodeCard.classList.add('network-node');
            nodeCard.dataset.nodeId = node.id;

            let requirementsHtml = '';
            if (!canHack && node.requirements && node.requirements.nodes) {
                const requiredNodeNames = node.requirements.nodes.map(reqId => {
                    const requiredNode = constants.NETWORK_NODES.find(n => n.id === reqId);
                    return requiredNode ? requiredNode.name : 'Unknown Node';
                }).map(name => `<li>- ${name}</li>`).join('');

                requirementsHtml = `
                    <div class="node-requirements">
                        <span class="requirements-title">REQUIRES COMPLETION OF:</span>
                        <ul>${requiredNodeNames}</ul>
                    </div>
                `;
            }

            const buttonHtml = canHack
                ? `<button class="btn btn-green hack-node-btn" data-node-id="${node.id}">HACK NODE</button>`
                : `<button class="btn btn-disabled" disabled>LOCKED</button>`;

            if (!canHack) nodeCard.classList.add('locked');
            if (node.isCompleted) nodeCard.classList.add('completed');

            nodeCard.innerHTML = `
                <h3 class="node-title">${node.name} ${node.isBoss ? '(BOSS)' : ''}</h3>
                <p class="node-description">${node.description}</p>
                <div class="node-details">
                    <span>DIFFICULTY: <span class="text-[#FFC107]">${node.difficulty.toUpperCase()}</span></span><br>
                    <span>REWARD: <span class="text-[#00FF99]">C ${node.baseReward}</span></span>
                </div>
                ${requirementsHtml}
                ${buttonHtml}
            `;
            elements.networkMapGrid.appendChild(nodeCard);
        });
    },
};
