// src/difficultyManager.js

import { gameState } from './gameState.js'; // Assuming gameState is accessible for upgrades
import { 
    BASE_TRACE_INCREASE_MIN, BASE_TRACE_INCREASE_MAX, 
    MISSION_FAIL_PENALTY_CREDITS, MISSION_FAIL_PENALTY_TRACE,
    ABORT_PENALTY_CREDITS, ABORT_PENALTY_TRACE
} from './gameConstants.js';

// Internal state for DDA
let playerPerformanceHistory = {
    puzzleSuccesses: 0,
    puzzleFailures: 0,
    missionsCompleted: 0,
    missionsFailed: 0,
    totalTraceGained: 0, // Trace gained from failures/aborts
    totalCreditsEarned: 0,
    totalCreditsLost: 0,
    // Add more metrics as needed, e.g., time taken per puzzle type
};

// Current difficulty modifier (e.g., 0.8 for easier, 1.0 for normal, 1.2 for harder)
let currentDifficultyModifier = 1.0;
const DIFFICULTY_ADJUSTMENT_STEP = 0.05; // How much to change difficulty by each time
const MIN_DIFFICULTY_MODIFIER = 0.7; // Cap for making it easier
const MAX_DIFFICULTY_MODIFIER = 1.3; // Cap for making it harder

export const difficultyManager = {
    init() {
        // In a real game, you'd load playerPerformanceHistory from save data here
        this.resetPerformanceHistory();
    },

    resetPerformanceHistory() {
        playerPerformanceHistory = {
            puzzleSuccesses: 0,
            puzzleFailures: 0,
            missionsCompleted: 0,
            missionsFailed: 0,
            totalTraceGained: 0,
            totalCreditsEarned: 0,
            totalCreditsLost: 0,
        };
        currentDifficultyModifier = 1.0;
    },

    setPerformanceHistory(history) {
        if (!history) return;
        playerPerformanceHistory = history;
        this.recalculateDifficulty(); // Recalculate modifier based on loaded history
    },

    /**
     * Updates player performance metrics and potentially triggers difficulty recalculation.
     * @param {string} eventType - e.g., 'puzzleSuccess', 'puzzleFail', 'missionComplete', 'missionFail', 'abort'
     * @param {object} [data] - Optional data relevant to the event (e.g., { traceGained: 10 } for puzzleFail)
     */
    updatePlayerPerformance(eventType, data = {}) {
        switch (eventType) {
            case 'puzzleSuccess':
                playerPerformanceHistory.puzzleSuccesses++;
                break;
            case 'puzzleFail':
                playerPerformanceHistory.puzzleFailures++;
                playerPerformanceHistory.totalTraceGained += data.traceGained || 0;
                break;
            case 'missionComplete':
                playerPerformanceHistory.missionsCompleted++;
                playerPerformanceHistory.totalCreditsEarned += data.creditsEarned || 0;
                break;
            case 'missionFail':
                playerPerformanceHistory.missionsFailed++;
                playerPerformanceHistory.totalCreditsLost += data.creditsLost || 0;
                playerPerformanceHistory.totalTraceGained += data.traceGained || 0;
                break;
            case 'abort':
                playerPerformanceHistory.totalCreditsLost += data.creditsLost || 0;
                playerPerformanceHistory.totalTraceGained += data.traceGained || 0;
                break;
            // Add more event types as you track them
        }

        this.recalculateDifficulty();
    },

    /**
     * Recalculates the overall difficulty modifier based on performance history.
     * This is a simplified example; a real system would use more complex algorithms
     * and might only adjust after a certain number of events or missions.
     */
    recalculateDifficulty() {
        const totalPuzzles = playerPerformanceHistory.puzzleSuccesses + playerPerformanceHistory.puzzleFailures;
        // Avoid division by zero; default to a neutral 0.5 success rate if no history.
        const puzzleSuccessRate = totalPuzzles > 0 ? playerPerformanceHistory.puzzleSuccesses / totalPuzzles : 0.5;

        const totalMissions = playerPerformanceHistory.missionsCompleted + playerPerformanceHistory.missionsFailed;
        const missionSuccessRate = totalMissions > 0 ? playerPerformanceHistory.missionsCompleted / totalMissions : 0.5;

        let puzzleAdjustment = 0;
        const PUZZLE_UPPER_THRESHOLD = 0.8;
        const PUZZLE_LOWER_THRESHOLD = 0.4;

        // If player is doing very well, increase difficulty proportionally.
        if (puzzleSuccessRate > PUZZLE_UPPER_THRESHOLD) {
            // Scale adjustment based on how far above the threshold they are.
            const successMargin = (puzzleSuccessRate - PUZZLE_UPPER_THRESHOLD) / (1 - PUZZLE_UPPER_THRESHOLD);
            puzzleAdjustment = DIFFICULTY_ADJUSTMENT_STEP * successMargin;
        } 
        // If player is struggling, decrease difficulty proportionally.
        else if (puzzleSuccessRate < PUZZLE_LOWER_THRESHOLD) {
            // Scale adjustment based on how far below the threshold they are.
            const failureMargin = (PUZZLE_LOWER_THRESHOLD - puzzleSuccessRate) / PUZZLE_LOWER_THRESHOLD;
            puzzleAdjustment = -DIFFICULTY_ADJUSTMENT_STEP * failureMargin;
        }

        let missionAdjustment = 0;
        const MISSION_UPPER_THRESHOLD = 0.7;
        const MISSION_LOWER_THRESHOLD = 0.3;

        if (missionSuccessRate > MISSION_UPPER_THRESHOLD) {
            const successMargin = (missionSuccessRate - MISSION_UPPER_THRESHOLD) / (1 - MISSION_UPPER_THRESHOLD);
            missionAdjustment = DIFFICULTY_ADJUSTMENT_STEP * successMargin;
        } else if (missionSuccessRate < MISSION_LOWER_THRESHOLD) {
            const failureMargin = (MISSION_LOWER_THRESHOLD - missionSuccessRate) / MISSION_LOWER_THRESHOLD;
            missionAdjustment = -DIFFICULTY_ADJUSTMENT_STEP * failureMargin;
        }

        // Combine adjustments (you could weigh them differently, e.g., missions are more important)
        const totalAdjustment = puzzleAdjustment + missionAdjustment;

        currentDifficultyModifier += totalAdjustment;

        // Clamp the modifier to its min/max bounds.
        currentDifficultyModifier = Math.max(MIN_DIFFICULTY_MODIFIER, Math.min(MAX_DIFFICULTY_MODIFIER, currentDifficultyModifier));

        console.log(`DDA: Puzzle SR: ${puzzleSuccessRate.toFixed(2)}, Mission SR: ${missionSuccessRate.toFixed(2)}, New Modifier: ${currentDifficultyModifier.toFixed(2)}`);
    },

    /**
     * Returns adjusted game parameters based on the current difficulty modifier
     * and the base difficulty of the current node.
     * @param {string} baseNodeDifficulty - The 'difficulty' property of the current NETWORK_NODE.
     * @returns {object} An object containing adjusted factors for various game parameters.
     */
    getAdjustedParameters(baseNodeDifficulty = 'medium') {
        let traceIncreaseFactor = 1.0;
        let puzzleLengthFactor = 1.0;
        let rewardFactor = 1.0;
        let penaltyFactor = 1.0;

        // Apply DDA modifier first
        traceIncreaseFactor = currentDifficultyModifier;
        puzzleLengthFactor = currentDifficultyModifier;
        rewardFactor = 1 / currentDifficultyModifier; // Inverse for rewards (harder = less reward)
        penaltyFactor = currentDifficultyModifier;

        // Apply node-specific difficulty on top of DDA
        switch (baseNodeDifficulty) {
            case 'very-easy': traceIncreaseFactor *= 0.6; puzzleLengthFactor *= 0.8; break;
            case 'easy': traceIncreaseFactor *= 0.8; puzzleLengthFactor *= 0.9; break;
            case 'medium': /* base is 1.0, already applied by DDA modifier */ break;
            case 'hard': traceIncreaseFactor *= 1.2; puzzleLengthFactor *= 1.1; break;
        }

        // Apply upgrade effects AFTER DDA and base node difficulty
        // Note: Upgrades are typically direct modifiers, not factors, but can be combined.
        if (gameState.purchasedUpgrades.iceBreaker) {
            traceIncreaseFactor *= 0.7; // Ice Breaker reduces trace increase by 30%
        }
        // sequenceDecryptor is a direct length reduction, handled in puzzleManager
        if (gameState.purchasedUpgrades.creditScrubber) {
            rewardFactor *= 1.5; // Credit Scrubber increases rewards by 50%
        }

        return {
            traceIncreaseRate: traceIncreaseFactor,
            puzzleLengthModifier: puzzleLengthFactor,
            rewardModifier: rewardFactor,
            penaltyModifier: penaltyFactor,
        };
    },

    getPerformanceHistory() {
        return playerPerformanceHistory;
    }
};
