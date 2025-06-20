import { PUZZLE_TYPES } from './puzzleConstants.js';

let sequencePuzzleArea, sequenceInstructions, codeSequenceDisplay, puzzleFeedback, resetPuzzleBtn;
let correctSequence = [];
let playerSequence = [];
let onCompleteCallback; // Callback to notify puzzle manager of completion
let getPurchasedUpgrades; // Function to get purchased upgrades state

export const sequencePuzzle = {
    init(elements, callbacks, stateGetters) {
        sequencePuzzleArea = elements.sequencePuzzleArea;
        sequenceInstructions = elements.sequenceInstructions;
        codeSequenceDisplay = elements.codeSequenceDisplay;
        puzzleFeedback = elements.puzzleFeedback;
        resetPuzzleBtn = elements.resetPuzzleBtn;
        onCompleteCallback = callbacks.onPuzzleComplete;
        getPurchasedUpgrades = stateGetters.getPurchasedUpgrades;
    },

    activate(node, isBossFight, currentBossStageIndex, instruction) {
        sequencePuzzleArea.classList.remove('hidden');
        sequenceInstructions.textContent = instruction;
        const purchasedUpgrades = getPurchasedUpgrades();

        const baseLength = isBossFight
            ? node.bossStages[currentBossStageIndex].puzzleLength
            : node.puzzleLength;
        const length = purchasedUpgrades.sequenceDecryptor ? baseLength - 1 : baseLength;

        const chars = ['0', '1', 'F', 'A', 'E', '7', 'C', 'B'];
        correctSequence = [];
        codeSequenceDisplay.innerHTML = '';
        for (let i = 0; i < length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            correctSequence.push(char);
            const nodeDiv = document.createElement('div');
            nodeDiv.classList.add('puzzle-node', 'opacity-0');
            nodeDiv.textContent = char;
            nodeDiv.dataset.index = i;
            codeSequenceDisplay.appendChild(nodeDiv);
        }
        playerSequence = [];
        puzzleFeedback.textContent = '';
        resetPuzzleBtn.classList.add('hidden');

        // Reveal sequence one by one with highlight
        let delay = 0;
        codeSequenceDisplay.querySelectorAll('.puzzle-node').forEach((nodeDiv, index) => {
            setTimeout(() => {
                nodeDiv.classList.remove('opacity-0');
                nodeDiv.classList.add('node-active-highlight');
                setTimeout(() => {
                    nodeDiv.classList.remove('node-active-highlight');
                }, 500);
            }, delay);
            delay += 750;
        });

        codeSequenceDisplay.addEventListener('click', handleNodeClick);
    },

    reset() {
        sequencePuzzleArea.classList.add('hidden');
        codeSequenceDisplay.removeEventListener('click', handleNodeClick);
        correctSequence = [];
        playerSequence = [];
    }
};

function handleNodeClick(event) {
    const clickedNode = event.target.closest('.puzzle-node');
    if (!clickedNode) return;

    const char = clickedNode.textContent;
    const index = parseInt(clickedNode.dataset.index);

    // Prevent clicking already selected nodes in the same attempt
    // This logic might need refinement based on exact game rules (e.g., can you click out of order?)
    // For now, assuming strict sequential input or unique character selection per attempt.
    // If it's a sequence, playerSequence.length should match index for strict order.
    if (playerSequence.length !== index) {
        // This means they clicked out of order or re-clicked a previous one.
        // For a strict sequence, this should probably be a fail or ignored.
        // For now, we'll just ignore clicks that are not the next in sequence.
        return;
    }

    playerSequence.push(char);
    clickedNode.classList.add('node-active-highlight');

    if (playerSequence.length === correctSequence.length) {
        checkSequenceCompletion();
    }
}

function checkSequenceCompletion() {
    codeSequenceDisplay.removeEventListener('click', handleNodeClick);
    const isCorrect = playerSequence.every((char, i) => char === correctSequence[i]);
    onCompleteCallback(isCorrect, PUZZLE_TYPES.SEQUENCE);
}