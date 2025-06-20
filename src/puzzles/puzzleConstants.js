export const PUZZLE_TYPES = {
    SEQUENCE: 'sequence',
    PATHFINDING: 'pathfinding',
    TIMED_INPUT: 'timed_input'
};

export const PUZZLE_SUCCESS_SCORE = 50;
export const DEFAULT_PUZZLE_FAIL_TRACE_PENALTY = 15;
export const BOSS_PUZZLE_FAIL_TRACE_PENALTY = 25;
export const PUZZLE_FEEDBACK_DISPLAY_DELAY = 1500; // Delay before resetting puzzle UI after success

// Timed Input Puzzle Constants
export const TIMED_INPUT_TIMER_INITIAL_PERCENT = 100;
export const TIMED_INPUT_TIMER_DECREMENT_PER_INTERVAL = 1.5;
export const TIMED_INPUT_INTERVAL_MS = 100;