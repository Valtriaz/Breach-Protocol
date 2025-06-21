// src/gameLoop.js

import { gameState, saveGame } from './gameState.js';
import {
    MAX_PROGRESS, MAX_TRACE_LEVEL, MIN_CREDITS,
    BASE_HACK_PROGRESS_MIN, BASE_HACK_PROGRESS_MAX, BOSS_HACK_PROGRESS_BONUS,
    BASE_TRACE_INCREASE_MIN, BASE_TRACE_INCREASE_MAX,
    MISSION_FAIL_PENALTY_CREDITS, MISSION_FAIL_PENALTY_TRACE, BOSS_MISSION_FAIL_PENALTY_CREDITS, BOSS_MISSION_FAIL_PENALTY_TRACE,
    ABORT_PENALTY_CREDITS, ABORT_PENALTY_TRACE, BOSS_ABORT_PENALTY_CREDITS, BOSS_ABORT_PENALTY_TRACE,
    TRACE_WARNING_HIGH, TRACE_WARNING_CRITICAL, CONSOLE_MESSAGE_DELAY
} from './gameConstants.js';
import { difficultyManager } from './difficultyManager.js'; // New import

// Dependencies from app.js, set during initialization
let uiManager;
let puzzleManager;
let handleGameOver;
let handleGameComplete;
let checkMissionUnlocks;
let INTEL_LOGS;
let difficultyManagerInstance; // Renamed to avoid conflict with imported module
let elements;

// Internal state for flavor text
const AMBIENT_CONSOLE_CHATTTER = [
    "Packet stream analysis: OK", "Data integrity check: Passed", "Routing table update: Complete",
    "Firewall logs: Nominal", "System heartbeat: Stable", "Network traffic: Low variance",
    "Encryption protocols: Active", "Sub-routine checksum: Valid", "Proxy connection: Established"
];

const AMBIENT_HACK_MESSAGES = [
    "Scanning for open ports...", "Analyzing packet headers...", "Executing brute-force on root password...",
    "Cerberus AI ping detected... masking signature.", "Memory buffer overflow attempt in progress...",
    "Searching for known exploits in kernel version...", "Decrypting data stream fragments...",
    "Spoofing MAC address...", "Pinging subnet for active devices..."
];

function start(node) {
    if (gameState.hackInterval) clearInterval(gameState.hackInterval);

    // Reset mission-specific state
    gameState.hackProgress = 0;
    gameState.traceLevel = 0;
    gameState.hackScore = 0;
    gameState.firewallBypassed = false;
    gameState.dataExtracted = false;
    gameState.highTraceMessageShown = false;
    gameState.criticalTraceMessageShown = false;
    gameState.currentHackedNode = node;
    gameState.bossFightActive = node.isBoss;
    gameState.currentBossStageIndex = node.isBoss ? 0 : -1;

    // Initial UI setup for the hack
    elements.hackProgressBar.style.width = '0%';
    elements.hackingViewTitle.textContent = `// ACTIVE BREACH: ${node.name.toUpperCase()}`;
    elements.traceLevelIndicator.textContent = '0%';
    elements.hackScoreDisplay.textContent = gameState.hackScore;
    elements.statusIndicator.textContent = `BREACHING ${node.name.toUpperCase()}`;
    elements.statusIndicator.classList.remove('text-[#00FF99]');
    elements.statusIndicator.classList.add('text-[#EF4444]');
    elements.bypassFirewallBtn.classList.toggle('hidden', gameState.bossFightActive);
    elements.extractDataBtn.classList.toggle('hidden', gameState.bossFightActive);
    elements.hackingConsole.innerHTML = '';
    uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', 'Initializing connection to target system...', 'text-[#00FF99]');
    uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', 'Running vulnerability scans. Cerberus AI online.', 'text-[#FFC107]');
    puzzleManager.resetPuzzleUI();
    uiManager.updateHackActionButtons();

    // Show the hacking console modal
    uiManager.showHackingViewAsModal();

    gameState.hackInterval = setInterval(() => {
        // --- 1. Check for Mission Completion by Progress ---
        if (gameState.hackProgress >= MAX_PROGRESS) {
            clearInterval(gameState.hackInterval);
            const missionSuccess = gameState.firewallBypassed && gameState.dataExtracted;

            if (missionSuccess) {
                uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', `Breach of ${gameState.currentHackedNode.name} successful! Data extracted. Logs wiped.`, 'text-[#00FF99]');
                gameState.currentHackedNode.isCompleted = true;

                let baseReward = gameState.currentHackedNode.baseReward;
                const adjustedParams = difficultyManagerInstance.getAdjustedParameters(gameState.currentHackedNode.difficulty);
                if (gameState.purchasedUpgrades.creditScrubber) {
                    baseReward *= 1.5;
                }
                const totalReward = Math.floor(baseReward * adjustedParams.rewardModifier + gameState.hackScore); // Apply reward modifier
                gameState.credits += totalReward;
                uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', `Credits awarded: C ${totalReward}!`, 'text-[#00FF99]');

                const log = INTEL_LOGS[gameState.currentHackedNode.intelId];
                if (log && !gameState.discoveredLogs.some(dLog => dLog.id === gameState.currentHackedNode.id)) {
                    gameState.discoveredLogs.push({ ...log, id: gameState.currentHackedNode.id, source: gameState.currentHackedNode.name });
                    uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', 'CRITICAL INTEL DISCOVERED. Check DATA LOGS.', 'text-[#FF00FF]');
                    uiManager.renderDataLogs();
                }

                uiManager.showMessage('MISSION COMPLETE!', `${gameState.currentHackedNode.name} breached. Gained C ${totalReward}.`, false);
                saveGame(true); // Auto-save
                difficultyManagerInstance.updatePlayerPerformance('missionComplete', { creditsEarned: totalReward });
            } else {
                const adjustedParams = difficultyManagerInstance.getAdjustedParameters(gameState.currentHackedNode.difficulty);
                let penaltyCredits = MISSION_FAIL_PENALTY_CREDITS * adjustedParams.penaltyModifier;
                let penaltyTrace = MISSION_FAIL_PENALTY_TRACE * adjustedParams.penaltyModifier;
                if (gameState.bossFightActive) {
                    penaltyCredits = BOSS_MISSION_FAIL_PENALTY_CREDITS * adjustedParams.penaltyModifier;
                    penaltyTrace = BOSS_MISSION_FAIL_PENALTY_TRACE * adjustedParams.penaltyModifier;
                }
                gameState.credits = Math.max(MIN_CREDITS, gameState.credits - penaltyCredits);
                gameState.traceLevel = Math.min(MAX_TRACE_LEVEL, gameState.traceLevel + penaltyTrace);
                uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', 'Mission failed: Objectives not met. Returning to Sanctuary.', 'text-[#EF4444]');
                uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', `Penalty: -C ${penaltyCredits.toFixed(0)} and increased Trace.`, 'text-[#EF4444]'); // Fixed toFixed for display
                uiManager.showMessage('MISSION FAILED!', 'Objectives not met. Nexus defenses too strong. Penalty applied.', true);
                difficultyManagerInstance.updatePlayerPerformance('missionFail', { creditsLost: penaltyCredits, traceGained: penaltyTrace });
            }

            uiManager.updateCreditsUI();
            elements.traceLevelIndicator.textContent = `${Math.floor(gameState.traceLevel)}%`;
            elements.statusIndicator.classList.remove('glitch-text');

            // Hide the hacking modal before showing game over/complete or switching view
            uiManager.hideHackingViewAsModal();

            setTimeout(() => {
                if (missionSuccess && gameState.currentHackedNode.isBoss) {
                    handleGameComplete();
                } else {
                    uiManager.showView('sanctuary');
                    elements.statusIndicator.textContent = 'ONLINE';
                    elements.statusIndicator.classList.remove('text-[#EF4444]');
                    elements.statusIndicator.classList.add('text-[#00FF99]');
                    if (missionSuccess) {
                        checkMissionUnlocks();
                    }
                    uiManager.addConsoleMessage(elements.activityFeed, 'SYSTEM', `Mission "${node.name}" ${missionSuccess ? 'COMPLETED' : 'FAILED'}.`, missionSuccess ? 'text-[#00FF99]' : 'text-[#EF4444]');
                    gameState.currentHackedNode = null;
                }
            }, CONSOLE_MESSAGE_DELAY);
            return;
        }

        // --- 2. Check for Game Over by Trace ---
        if (gameState.traceLevel >= MAX_TRACE_LEVEL) {
            uiManager.hideHackingViewAsModal(); // Hide hacking modal on game over
            handleGameOver();
            return;
        }

        // --- 3. Progress the Hack if not paused by a puzzle ---
        const canProgress = !puzzleManager.isPuzzleActive() || (gameState.bossFightActive && gameState.currentBossStageIndex >= gameState.currentHackedNode.bossStages.length);
        if (canProgress) {
            gameState.hackProgress += Math.random() * BASE_HACK_PROGRESS_MAX + BASE_HACK_PROGRESS_MIN;
            if (gameState.bossFightActive) {
                gameState.hackProgress += Math.random() * BOSS_HACK_PROGRESS_BONUS;
            }
            gameState.hackProgress = Math.min(gameState.hackProgress, MAX_PROGRESS);
            elements.hackProgressBar.style.width = `${gameState.hackProgress}%`;

            const adjustedParams = difficultyManagerInstance.getAdjustedParameters(node.difficulty);
            gameState.traceLevel += (Math.random() * BASE_TRACE_INCREASE_MAX + BASE_TRACE_INCREASE_MIN) * adjustedParams.traceIncreaseRate;
            gameState.traceLevel = Math.min(gameState.traceLevel, MAX_TRACE_LEVEL);
            elements.traceLevelIndicator.textContent = `${Math.floor(gameState.traceLevel)}%`;

            if (Math.random() < 0.05) {
                const randomIndex = Math.floor(Math.random() * AMBIENT_CONSOLE_CHATTTER.length);
                uiManager.addConsoleMessage(elements.hackingConsole, 'AMBIENT', AMBIENT_CONSOLE_CHATTTER[randomIndex], 'text-gray-500');
            }
            if (Math.random() < 0.03) {
                const randomIndex = Math.floor(Math.random() * AMBIENT_HACK_MESSAGES.length);
                uiManager.addConsoleMessage(elements.hackingConsole, 'HACK', AMBIENT_HACK_MESSAGES[randomIndex], 'text-[#00FF99]');
            }
        }

        // --- 4. Display Warnings ---
        if (gameState.traceLevel >= TRACE_WARNING_HIGH && !gameState.highTraceMessageShown) {
            uiManager.addConsoleMessage(elements.hackingConsole, 'CRITICAL', 'EVASIVE MANEUVERS! NEXUS AI IS CLOSING IN!', 'text-[#EF4444]');
            elements.statusIndicator.classList.add('glitch-text');
            uiManager.showMessage('HIGH TRACE DETECTED!', 'Cerberus AI is actively tracking your position. Complete your objectives quickly!', true);
            gameState.highTraceMessageShown = true;
        }
        if (gameState.traceLevel >= TRACE_WARNING_CRITICAL && !gameState.criticalTraceMessageShown) {
            uiManager.addConsoleMessage(elements.hackingConsole, 'CRITICAL', 'CRITICAL TRACE LEVEL! IMMEDIATE ABORT RECOMMENDED!', 'text-[#EF4444]');
            uiManager.showMessage('CRITICAL TRACE!', 'Your position is almost compromised. Abort immediately or risk full exposure!', true);
            gameState.criticalTraceMessageShown = true;
        }

        elements.terminalContainer.classList.toggle('critical-trace-effect', gameState.traceLevel >= TRACE_WARNING_CRITICAL);
    }, 100);
}

function abort() {
    clearInterval(gameState.hackInterval);
    puzzleManager.resetPuzzleUI();
    gameState.bossFightActive = false;

    const adjustedParams = difficultyManagerInstance.getAdjustedParameters(gameState.currentHackedNode?.difficulty || 'medium'); // Use optional chaining for safety
    uiManager.addConsoleMessage(elements.hackingConsole, 'CRITICAL', 'Breach aborted. Minimal data extracted. Trace left behind!', 'text-[#EF4444]');
    let abortPenaltyCredits = ABORT_PENALTY_CREDITS * adjustedParams.penaltyModifier;
    let abortPenaltyTrace = ABORT_PENALTY_TRACE * adjustedParams.penaltyModifier;
    if (gameState.currentHackedNode && gameState.currentHackedNode.isBoss) {
        abortPenaltyCredits = BOSS_ABORT_PENALTY_CREDITS * adjustedParams.penaltyModifier;
        abortPenaltyTrace = BOSS_ABORT_PENALTY_TRACE * adjustedParams.penaltyModifier;
        uiManager.addConsoleMessage(elements.hackingConsole, 'SYSTEM', 'Nexus Core breach aborted. Significant trace left behind!', 'text-[#EF4444]');
    }
    gameState.credits = Math.max(MIN_CREDITS, gameState.credits - abortPenaltyCredits);
    gameState.traceLevel = Math.min(MAX_TRACE_LEVEL, gameState.traceLevel + abortPenaltyTrace);
    difficultyManagerInstance.updatePlayerPerformance('abort', { creditsLost: abortPenaltyCredits, traceGained: abortPenaltyTrace });
    elements.traceLevelIndicator.textContent = `${Math.floor(gameState.traceLevel)}%`;
    uiManager.updateCreditsUI();
    elements.statusIndicator.classList.remove('glitch-text');
    elements.terminalContainer.classList.remove('critical-trace-effect');

    uiManager.showMessage('BREACH ABORTED!', 'You retreated from the breach. Minor losses, but the mission failed.', true);

    // Hide the hacking modal before returning to sanctuary
    uiManager.hideHackingViewAsModal();

    setTimeout(() => {
        uiManager.showView('sanctuary');
        elements.statusIndicator.textContent = 'ONLINE';
        elements.statusIndicator.classList.remove('text-[#EF4444]');
        elements.statusIndicator.classList.add('text-[#00FF99]');
        uiManager.addConsoleMessage(elements.activityFeed, 'SYSTEM', 'Mission aborted. Re-evaluate strategy.', 'text-[#EF4444]');
    }, CONSOLE_MESSAGE_DELAY);
}

export const gameLoop = {
    init(dependencies) {
        uiManager = dependencies.uiManager;
        puzzleManager = dependencies.puzzleManager;
        handleGameOver = dependencies.handleGameOver;
        handleGameComplete = dependencies.handleGameComplete;
        checkMissionUnlocks = dependencies.checkMissionUnlocks;
        INTEL_LOGS = dependencies.INTEL_LOGS;
        difficultyManagerInstance = dependencies.difficultyManager; // Assign the instance
        elements = dependencies.elements;
    },
    start,
    abort
};
