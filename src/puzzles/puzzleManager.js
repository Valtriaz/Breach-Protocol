import { sequencePuzzle } from './sequencePuzzle.js';
import { pathfindingPuzzle } from './pathfindingPuzzle.js';
import { timedInputPuzzle } from './timedInputPuzzle.js';
import {
    PUZZLE_TYPES,
    PUZZLE_SUCCESS_SCORE,
    DEFAULT_PUZZLE_FAIL_TRACE_PENALTY,
    BOSS_PUZZLE_FAIL_TRACE_PENALTY,
    PUZZLE_FEEDBACK_DISPLAY_DELAY, // Corrected import
} from './puzzleConstants.js'; // Corrected import
import { MAX_TRACE_LEVEL } from '../gameConstants.js';

let puzzleContainer, puzzleFeedback, resetPuzzleBtn;
let bypassFirewallBtn, extractDataBtn;
let hackingConsole, traceLevelIndicator, hackScoreDisplay, statusIndicator;
let audioManager;
let showMessage, addConsoleMessage;

// Callbacks to update main game state
let updateTraceLevel, updateHackScore, onPuzzleSuccess, onPuzzleFail;
let getGameStates; // Function to get current game states like traceLevel, hackScore, etc.
let puzzleActive = false;
let currentHackedNode = null;
let bossFightActive = false;
let currentBossStageIndex = -1;

export const puzzleManager = {
    init(elements, callbacks, stateGetters) {
        // DOM Elements
        puzzleContainer = elements.puzzleContainer;
        puzzleFeedback = elements.puzzleFeedback;
        resetPuzzleBtn = elements.resetPuzzleBtn;
        bypassFirewallBtn = elements.bypassFirewallBtn;
        extractDataBtn = elements.extractDataBtn;
        hackingConsole = elements.hackingConsole;
        traceLevelIndicator = elements.traceLevelIndicator;
        hackScoreDisplay = elements.hackScoreDisplay;
        statusIndicator = elements.statusIndicator;

        // External Managers/Utilities
        audioManager = elements.audioManager;
        showMessage = elements.showMessage;
        addConsoleMessage = elements.addConsoleMessage;

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
        timedInputPuzzle.init(puzzleElements, puzzleCallbacks, puzzleStateGetters);

        resetPuzzleBtn.addEventListener('click', this.retryCurrentPuzzle.bind(this)); // Bind 'this'
    },

    activatePuzzle(node, objectiveType, isBoss = false, bossStageIndex = -1) {
        currentHackedNode = node;
        bossFightActive = isBoss;
        currentBossStageIndex = bossStageIndex;

        let puzzleType;
        let instruction = '';

        if (isBoss) {
            const currentStage = node.bossStages[bossStageIndex];
            puzzleType = currentStage.puzzleType;
            instruction = currentStage.instruction;
            addConsoleMessage(hackingConsole, 'SYSTEM', `Nexus Core: Initiating ${currentStage.objectiveName}...`, 'text-[#FFC107]');
            statusIndicator.textContent = `BREACHING NEXUS CORE - STAGE ${bossStageIndex + 1}/${node.bossStages.length}`;
        } else {
            puzzleType = node.puzzleTypes[objectiveType];
            if (objectiveType === 'firewall') instruction = "Bypass Firewall: Decrypt shield!";
            if (objectiveType === 'data') instruction = "Data Extraction: Verify checksum!";
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Sub-routine activated! System requires manual input.', 'text-[#FFC107]');
        }

        puzzleActive = true;
        puzzleFeedback.textContent = ''; // Clear feedback when new puzzle starts

        puzzleContainer.classList.remove('hidden');
        puzzleContainer.classList.add('flex');

        // Hide/disable regular action buttons during puzzle
        bypassFirewallBtn.disabled = true; bypassFirewallBtn.classList.add('btn-disabled');
        extractDataBtn.disabled = true; extractDataBtn.classList.add('btn-disabled');

        // Hide/show action buttons based on boss fight status
        bypassFirewallBtn.classList.toggle('hidden', bossFightActive);
        extractDataBtn.classList.toggle('hidden', bossFightActive);

        switch (puzzleType) {
            case PUZZLE_TYPES.SEQUENCE:
                sequencePuzzle.activate(node, isBoss, bossStageIndex, instruction);
                break;
            case PUZZLE_TYPES.PATHFINDING:
                pathfindingPuzzle.activate(node, isBoss, bossStageIndex);
                break;
            case PUZZLE_TYPES.TIMED_INPUT:
                timedInputPuzzle.activate(node, isBoss, bossStageIndex);
                break;
            default:
                console.error('Unknown puzzle type:', puzzleType);
        }
    },

    handlePuzzleCompletionInternal(isCorrect, puzzleType) {
        const { traceLevel } = getGameStates(); // traceLevel is dynamic, MAX_TRACE_LEVEL is imported directly

        if (isCorrect) {
            audioManager.play('puzzleSuccess');
            puzzleFeedback.textContent = 'SUB-ROUTINE SUCCESSFUL!';
            puzzleFeedback.className = 'text-xl font-bold mt-4 text-[#00FF99]';
            addConsoleMessage(hackingConsole, 'HACK', 'Sub-routine successful! Access granted.', 'text-[#00FF99]');
            updateHackScore(PUZZLE_SUCCESS_SCORE);

            setTimeout(() => {
                this.resetPuzzleUI(); // Reset puzzle UI after delay
                onPuzzleSuccess(bossFightActive, currentBossStageIndex); // Notify app.js
                puzzleActive = false; // Puzzle is no longer active after feedback
            }, PUZZLE_FEEDBACK_DISPLAY_DELAY);

        } else {
            // On failure, puzzle remains active until user retries or aborts.
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
            resetPuzzleBtn.classList.remove('hidden');
            onPuzzleFail(); // Notify app.js (e.g., to re-enable hack buttons)
        }
    },

    retryCurrentPuzzle() {
        resetPuzzleBtn.classList.add('hidden');
        puzzleFeedback.textContent = ''; // Clear feedback
        if (bossFightActive) {
            puzzleManager.activatePuzzle(currentHackedNode, null, true, currentBossStageIndex);
        } else {
            // Determine if it was firewall or data puzzle
            const { firewallBypassed } = getGameStates();
            puzzleManager.activatePuzzle(currentHackedNode, firewallBypassed ? 'data' : 'firewall');
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