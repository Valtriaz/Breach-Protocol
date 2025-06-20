// src/gameConstants.js

// Game Constants
export const MAX_PROGRESS = 100;
export const MAX_TRACE_LEVEL = 100;
export const MIN_CREDITS = 0;

// Hack Simulation Constants
export const BASE_HACK_PROGRESS_MIN = 0.5;
export const BASE_HACK_PROGRESS_MAX = 1.5; // Range is 0.5 to 2.0
export const BOSS_HACK_PROGRESS_BONUS = 0.5;

export const BASE_TRACE_INCREASE_MIN = 0.1;
export const BASE_TRACE_INCREASE_MAX = 0.8; // Range is 0.1 to 0.9

// Penalty Constants
export const MISSION_FAIL_PENALTY_CREDITS = 150;
export const MISSION_FAIL_PENALTY_TRACE = 40;
export const BOSS_MISSION_FAIL_PENALTY_CREDITS = 300;
export const BOSS_MISSION_FAIL_PENALTY_TRACE = 50;

export const ABORT_PENALTY_CREDITS = 75;
export const ABORT_PENALTY_TRACE = 25;
export const BOSS_ABORT_PENALTY_CREDITS = 150;
export const BOSS_ABORT_PENALTY_TRACE = 40;

// Trace Warning Thresholds
export const TRACE_WARNING_HIGH = 70;
export const TRACE_WARNING_CRITICAL = 90;
export const CONSOLE_MESSAGE_DELAY = 2000; // Delay before returning to sanctuary
