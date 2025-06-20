import { PUZZLE_TYPES, TIMED_INPUT_TIMER_INITIAL_PERCENT, TIMED_INPUT_TIMER_DECREMENT_PER_INTERVAL, TIMED_INPUT_INTERVAL_MS } from './puzzleConstants.js';
import { MIN_CREDITS } from '../gameConstants.js';

let timedInputPuzzleArea, timedInputSequence, timedInputTimer, timedInputField;
let timedInputTarget = '';
let timedInputInterval = null;
let onCompleteCallback;

export const timedInputPuzzle = {
    init(elements, callbacks, stateGetters) {
        timedInputPuzzleArea = elements.timedInputPuzzleArea;
        timedInputSequence = elements.timedInputSequence;
        timedInputTimer = elements.timedInputTimer;
        timedInputField = elements.timedInputField;
        onCompleteCallback = callbacks.onPuzzleComplete;
        // getMinCredits is no longer needed as MIN_CREDITS is imported directly
    },

    activate(node, isBossFight, currentBossStageIndex) {
        timedInputPuzzleArea.classList.remove('hidden');
        timedInputField.value = '';
        timedInputField.disabled = false;
        timedInputField.focus();

        const chars = 'ABCDEF0123456789';
        timedInputTarget = '';
        const length = isBossFight
            ? node.bossStages[currentBossStageIndex].puzzleLength
            : 8; // Default length for timed input if not specified for regular nodes
        for (let i = 0; i < length; i++) {
            timedInputTarget += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        timedInputSequence.textContent = timedInputTarget;

        timedInputField.addEventListener('input', handleTimedInput);

        let timeLeft = TIMED_INPUT_TIMER_INITIAL_PERCENT;
        timedInputTimer.style.width = `${TIMED_INPUT_TIMER_INITIAL_PERCENT}%`;
        timedInputInterval = setInterval(() => {
            timeLeft -= TIMED_INPUT_TIMER_DECREMENT_PER_INTERVAL;
            timedInputTimer.style.width = `${timeLeft}%`;
            if (timeLeft <= MIN_CREDITS) { // Using MIN_CREDITS as 0
                clearInterval(timedInputInterval);
                timedInputField.disabled = true;
                onCompleteCallback(false, PUZZLE_TYPES.TIMED_INPUT);
            }
        }, TIMED_INPUT_INTERVAL_MS);
    },

    reset() {
        timedInputPuzzleArea.classList.add('hidden');
        timedInputField.removeEventListener('input', handleTimedInput);
        clearInterval(timedInputInterval);
        timedInputTarget = '';
        timedInputInterval = null;
    }
};

function handleTimedInput() {
    const currentInput = timedInputField.value.toUpperCase();
    if (currentInput === timedInputTarget) {
        clearInterval(timedInputInterval);
        onCompleteCallback(true, PUZZLE_TYPES.TIMED_INPUT);
    }
}