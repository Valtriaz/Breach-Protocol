// src/puzzles/puzzleManager.js
import { sequencePuzzle } from './sequencePuzzle.js';
import { pathfindingPuzzle } from './pathfindingPuzzle.js';
import { timedInputPuzzle } from './timedInputPuzzle.js';
import {
    PUZZLE_TYPES,
    PUZZLE_SUCCESS_SCORE,
    DEFAULT_PUZZLE_FAIL_TRACE_PENALTY,
    BOSS_PUZZLE_FAIL_TRACE_PENALTY,
    PUZZLE_FEEDBACK_DISPLAY_DELAY
} from './puzzleConstants.js'; // MAX_TRACE_LEVEL is imported by puzzleConstants.js if needed there.

let puzzleContainer, puzzleFeedback, resetPuzzleBtn;
let hackingConsole, traceLevelIndicator, hackScoreDisplay, statusIndicator;
let audioManager;
let showMessage, addConsoleMessage, triggerScreenShake;
let difficultyManagerInstance; // New: Reference to the difficulty manager

// Callbacks to update main game state
let updateTraceLevel, updateHackScore, onPuzzleSuccess, onPuzzleFail;
let getGameStates; // Function to get current game states like traceLevel, hackScore, etc. (from app.js)

// Internal state for puzzle manager
let puzzleActive = false;
let currentHackedNode = null;
let bossFightActive = false;
let currentBossStageIndex = -1;
let currentObjectiveType = null; // Stores the type of objective (e.g., 'firewall', 'data') for retry logic

export const puzzleManager = {
    init(elements, callbacks, stateGetters) {
        // DOM Elements
        puzzleContainer = elements.puzzleContainer;
        puzzleFeedback = elements.puzzleFeedback;
        resetPuzzleBtn = elements.resetPuzzleBtn;
        hackingConsole = elements.hackingConsole;
        traceLevelIndicator = elements.traceLevelIndicator;
        hackScoreDisplay = elements.hackScoreDisplay;
        statusIndicator = elements.statusIndicator;

        // External Managers/Utilities
        audioManager = elements.audioManager;
        showMessage = elements.showMessage;
        addConsoleMessage = elements.addConsoleMessage;
        difficultyManagerInstance = elements.difficultyManager; // Assign the instance
        triggerScreenShake = elements.triggerScreenShake;

        // Callbacks for game state updates
        updateTraceLevel = callbacks.updateTraceLevel;
        updateHackScore = callbacks.updateHackScore;
        onPuzzleSuccess = callbacks.onPuzzleSuccess; // For app.js to handle mission progress
        onPuzzleFail = callbacks.onPuzzleFail;     // For app.js to handle mission failure

        // State Getters
        getGameStates = stateGetters.getGameStates;

        // Initialize individual puzzle modules
        const puzzleElements = {
            sequencePuzzleArea: elements.sequencePuzzleArea,
            sequenceInstructions: elements.sequenceInstructions,
            codeSequenceDisplay: elements.codeSequenceDisplay,
            pathfindingPuzzleArea: elements.pathfindingPuzzleArea,
            pathfindingGrid: elements.pathfindingGrid,
            timedInputPuzzleArea: elements.timedInputPuzzleArea,
            timedInputSequence: elements.timedInputSequence,
            timedInputTimer: elements.timedInputTimer,
            timedInputField: elements.timedInputField,
            puzzleFeedback: puzzleFeedback,
            resetPuzzleBtn: resetPuzzleBtn
        };

        const puzzleCallbacks = {
            onPuzzleComplete: this.handlePuzzleCompletionInternal.bind(this) // Bind 'this' to puzzleManager
        };

        const puzzleStateGetters = {
            getPurchasedUpgrades: () => getGameStates().purchasedUpgrades,
        };

        sequencePuzzle.init(puzzleElements, puzzleCallbacks, puzzleStateGetters);
        pathfindingPuzzle.init(puzzleElements, puzzleCallbacks);
        timedInputPuzzle.init(puzzleElements, puzzleCallbacks); // timedInputPuzzle does not use stateGetters

        resetPuzzleBtn.addEventListener('click', this.retryCurrentPuzzle.bind(this)); // Bind 'this'
    },

    activatePuzzle(node, objectiveType, isBoss = false, bossStageIndex = -1) {
        currentHackedNode = node;
        bossFightActive = isBoss;
        currentBossStageIndex = bossStageIndex;
        currentObjectiveType = objectiveType; // Store the objective type for retry logic

        let puzzleType;
        let instruction = '';

        const adjustedParams = difficultyManagerInstance.getAdjustedParameters(node.difficulty);

        if (isBoss) {
            const currentStage = node.bossStages[bossStageIndex];
            puzzleType = currentStage.puzzleType;
            instruction = currentStage.instruction;
            addConsoleMessage(hackingConsole, 'SYSTEM', `Nexus Core: Initiating ${currentStage.objectiveName}...`, 'text-[#FFC107]');
            statusIndicator.textContent = `BREACHING NEXUS CORE - STAGE ${bossStageIndex + 1}/${node.bossStages.length}`;
            // Calculate effective puzzle length for boss stages
            currentStage.effectivePuzzleLength = Math.max(1, Math.round(currentStage.puzzleLength * adjustedParams.puzzleLengthModifier));
            if (getGameStates().purchasedUpgrades.sequenceDecryptor && puzzleType === PUZZLE_TYPES.SEQUENCE) {
                currentStage.effectivePuzzleLength = Math.max(1, currentStage.effectivePuzzleLength - 1);
            }
        } else {
            puzzleType = node.puzzleTypes[objectiveType];
            if (objectiveType === 'firewall') instruction = "Bypass Firewall: Decrypt shield!";
            if (objectiveType === 'data') instruction = "Data Extraction: Verify checksum!";
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Sub-routine activated! System requires manual input.', 'text-[#FFC107]');
        }
        // Calculate effective puzzle length for regular nodes
        node.effectivePuzzleLength = Math.max(1, Math.round(node.puzzleLength * adjustedParams.puzzleLengthModifier));
        if (getGameStates().purchasedUpgrades.sequenceDecryptor && puzzleType === PUZZLE_TYPES.SEQUENCE) {
            node.effectivePuzzleLength = Math.max(1, node.effectivePuzzleLength - 1);
        }


        puzzleActive = true;
        puzzleFeedback.textContent = ''; // Clear feedback when new puzzle starts

        puzzleContainer.classList.remove('hidden');
        puzzleContainer.classList.add('flex');

        switch (puzzleType) {
            case PUZZLE_TYPES.SEQUENCE: // Pass effective puzzle length
                sequencePuzzle.activate(node, isBoss, bossStageIndex, instruction, isBoss ? node.bossStages[bossStageIndex].effectivePuzzleLength : node.effectivePuzzleLength);
                break;
            case PUZZLE_TYPES.PATHFINDING:
                pathfindingPuzzle.activate(node, isBoss, bossStageIndex, isBoss ? node.bossStages[bossStageIndex].effectivePuzzleLength : node.effectivePuzzleLength); // Pass effective puzzle length
                break;
            case PUZZLE_TYPES.TIMED_INPUT: // Pass effective puzzle length
                timedInputPuzzle.activate(node, isBoss, bossStageIndex, isBoss ? node.bossStages[bossStageIndex].effectivePuzzleLength : node.effectivePuzzleLength);
                break;
            default:
                console.error('Unknown puzzle type:', puzzleType);
        }
    },

    handlePuzzleCompletionInternal(isCorrect, puzzleType) {
        const { traceLevel } = getGameStates();

        if (isCorrect) {
            audioManager.play('puzzleSuccess');
            puzzleFeedback.textContent = 'SUB-ROUTINE SUCCESSFUL!';
            puzzleFeedback.className = 'text-xl font-bold mt-4 text-[#00FF99]';
            addConsoleMessage(hackingConsole, 'HACK', 'Sub-routine successful! Access granted.', 'text-[#00FF99]');
            updateHackScore(PUZZLE_SUCCESS_SCORE);

            difficultyManagerInstance.updatePlayerPerformance('puzzleSuccess'); // Report success

            const isLastBossStage = bossFightActive && (currentBossStageIndex + 1 >= currentHackedNode.bossStages.length);

            setTimeout(() => {
                this.resetPuzzleUI(); // Reset puzzle UI after delay

                // IMPORTANT: Set puzzleActive to false BEFORE calling onPuzzleSuccess
                // This ensures app.js gets the correct state when it updates buttons.
                if (!bossFightActive || isLastBossStage) {
                    puzzleActive = false;
                }

                onPuzzleSuccess(bossFightActive, currentBossStageIndex); // Notify app.js

            }, PUZZLE_FEEDBACK_DISPLAY_DELAY);

        } else {
            // On failure, puzzle remains active until user retries or aborts.
            triggerScreenShake();
            audioManager.play('puzzleFail');
            puzzleFeedback.textContent = 'SUB-ROUTINE FAILED!';
            puzzleFeedback.className = 'text-xl font-bold mt-4 text-[#EF4444]';

            let penaltyTrace = DEFAULT_PUZZLE_FAIL_TRACE_PENALTY;
            let failMessage = 'Incorrect sequence! Trace level increased!';

            if (bossFightActive) {
                penaltyTrace = BOSS_PUZZLE_FAIL_TRACE_PENALTY;
                failMessage = 'Nexus Core defenses holding! Trace level increased!';
                addConsoleMessage(hackingConsole, 'CRITICAL', failMessage, 'text-[#EF4444]');
                puzzleFeedback.textContent = 'NEXUS CORE DEFENSES HOLDING!';
            } else {
                addConsoleMessage(hackingConsole, 'CRITICAL', failMessage, 'text-[#EF4444]');
            }

            updateTraceLevel(Math.min(MAX_TRACE_LEVEL, traceLevel + penaltyTrace));
            difficultyManagerInstance.updatePlayerPerformance('puzzleFail', { traceGained: penaltyTrace }); // Report failure
            resetPuzzleBtn.classList.remove('hidden');
            onPuzzleFail(); // Notify app.js (e.g., to re-enable hack buttons)
        }
    },

    retryCurrentPuzzle() {
        resetPuzzleBtn.classList.add('hidden');
        puzzleFeedback.textContent = ''; // Clear feedback
        // Re-activate the same puzzle that just failed
        if (bossFightActive) {
            this.activatePuzzle(currentHackedNode, null, true, currentBossStageIndex);
        } else {
            // Use the stored objective type for the retry
            this.activatePuzzle(currentHackedNode, currentObjectiveType);
        }
    },

    resetPuzzleUI() {
        puzzleContainer.classList.add('hidden');
        sequencePuzzle.reset();
        pathfindingPuzzle.reset();
        timedInputPuzzle.reset();
        resetPuzzleBtn.classList.add('hidden');
        puzzleFeedback.textContent = '';
    },

    isPuzzleActive() {
        return puzzleActive;
    }
};