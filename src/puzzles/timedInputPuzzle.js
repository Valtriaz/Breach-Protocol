// src/puzzles/timedInputPuzzle.js
import { PUZZLE_TYPES, TIMED_INPUT_TIMER_INITIAL_PERCENT, TIMED_INPUT_TIMER_DECREMENT_PER_INTERVAL, TIMED_INPUT_INTERVAL_MS } from './puzzleConstants.js';

// Module-level variables
let timedInputPuzzleArea, timedInputSequence, timedInputTimer, timedInputField;
let timedInputTarget = '';
let timedInputInterval = null;
let onCompleteCallback;

// Named handler for the input event to allow for reliable removal
function handleTimedInput() {
    const currentInput = timedInputField.value.toUpperCase();
    if (currentInput === timedInputTarget) {
        // Stop the timer
        if (timedInputInterval) {
            clearInterval(timedInputInterval);
            timedInputInterval = null;
        }
        
        // Disable the field to prevent further input
        timedInputField.disabled = true;
        
        // Remove the listener to clean up
        timedInputField.removeEventListener('input', handleTimedInput);
        
        // Report success
        onCompleteCallback(true, PUZZLE_TYPES.TIMED_INPUT);
    }
}

export const timedInputPuzzle = {
    init(elements, callbacks) {
        timedInputPuzzleArea = elements.timedInputPuzzleArea;
        timedInputSequence = elements.timedInputSequence;
        timedInputTimer = elements.timedInputTimer;
        timedInputField = elements.timedInputField;
        onCompleteCallback = callbacks.onPuzzleComplete;
    },

    activate(node, isBossFight, currentBossStageIndex, effectiveLength) {
        // --- Setup UI ---
        timedInputPuzzleArea.classList.remove('hidden');
        timedInputField.value = '';
        timedInputField.disabled = false;
        timedInputField.focus();

        // --- Generate Puzzle ---
        const chars = 'ABCDEF0123456789';
        timedInputTarget = '';
        // Use the effectiveLength passed from puzzleManager for dynamic difficulty
        const length = effectiveLength || 8; // Fallback length
        for (let i = 0; i < length; i++) {
            timedInputTarget += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        timedInputSequence.textContent = timedInputTarget;

        // --- Setup Event Listener ---
        // Remove any old listener before adding a new one
        timedInputField.removeEventListener('input', handleTimedInput);
        timedInputField.addEventListener('input', handleTimedInput);

        // --- Setup Timer ---
        let timeLeft = TIMED_INPUT_TIMER_INITIAL_PERCENT;
        timedInputTimer.style.width = `${timeLeft}%`;

        // Clear any existing interval before starting a new one to prevent bugs
        if (timedInputInterval) {
            clearInterval(timedInputInterval);
        }

        timedInputInterval = setInterval(() => {
            timeLeft -= TIMED_INPUT_TIMER_DECREMENT_PER_INTERVAL;
            timedInputTimer.style.width = `${Math.max(0, timeLeft)}%`;

            if (timeLeft <= 0) {
                clearInterval(timedInputInterval);
                timedInputInterval = null;
                timedInputField.disabled = true;
                timedInputField.removeEventListener('input', handleTimedInput); // Clean up listener on failure
                onCompleteCallback(false, PUZZLE_TYPES.TIMED_INPUT);
            }
        }, TIMED_INPUT_INTERVAL_MS);
    },

    reset() {
        timedInputPuzzleArea.classList.add('hidden');
        timedInputField.removeEventListener('input', handleTimedInput);
        
        if (timedInputInterval) {
            clearInterval(timedInputInterval);
            timedInputInterval = null;
        }
        
        timedInputTarget = '';
    }
};
