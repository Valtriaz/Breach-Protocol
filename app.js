// Import puzzle manager and constants at the top level
import { puzzleManager } from './src/puzzles/puzzleManager.js';
import { PUZZLE_TYPES } from './src/puzzles/puzzleConstants.js';
import { 
    MAX_PROGRESS, MAX_TRACE_LEVEL, MIN_CREDITS, 
    BASE_HACK_PROGRESS_MIN, BASE_HACK_PROGRESS_MAX, BOSS_HACK_PROGRESS_BONUS, 
    BASE_TRACE_INCREASE_MIN, BASE_TRACE_INCREASE_MAX, 
    MISSION_FAIL_PENALTY_CREDITS, MISSION_FAIL_PENALTY_TRACE, BOSS_MISSION_FAIL_PENALTY_CREDITS, BOSS_MISSION_FAIL_PENALTY_TRACE, 
    ABORT_PENALTY_CREDITS, ABORT_PENALTY_TRACE, BOSS_ABORT_PENALTY_CREDITS, BOSS_ABORT_PENALTY_TRACE, 
    TRACE_WARNING_HIGH, TRACE_WARNING_CRITICAL, CONSOLE_MESSAGE_DELAY 
} from './src/gameConstants.js';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const navTabs = document.querySelectorAll('.nav-tab');
    const viewContents = document.querySelectorAll('.view-content');
    const startHackButton = document.getElementById('start-hack-button');
    const hackProgressBar = document.getElementById('hack-progress-bar');
    const hackingConsole = document.getElementById('hacking-console');
    const hackingViewTitle = document.getElementById('hacking-view-title');
    const abortHackBtn = document.getElementById('abort-hack-btn');
    const traceLevelIndicator = document.getElementById('trace-level');
    const creditsIndicator = document.getElementById('credits');
    const statusIndicator = document.getElementById('status-indicator');
    const hackScoreDisplay = document.getElementById('hack-score');

    // Puzzle elements
    const puzzleContainer = document.getElementById('puzzle-container'); // Main puzzle area
    const puzzleFeedback = document.getElementById('puzzle-feedback'); // Feedback for puzzles
    const resetPuzzleBtn = document.getElementById('reset-puzzle-btn'); // Retry button for puzzles
    const sequencePuzzleArea = document.getElementById('sequence-puzzle-area'); // Sequence puzzle container
    const sequenceInstructions = document.getElementById('sequence-instructions'); // Sequence puzzle instructions
    const codeSequenceDisplay = document.getElementById('code-sequence-display'); // Sequence puzzle display
    const pathfindingPuzzleArea = document.getElementById('pathfinding-puzzle-area'); // Pathfinding puzzle container
    const pathfindingGrid = document.getElementById('pathfinding-grid'); // Pathfinding grid
    const timedInputPuzzleArea = document.getElementById('timed-input-puzzle-area'); // Timed input puzzle container
    const timedInputSequence = document.getElementById('timed-input-sequence'); // Timed input sequence display
    const timedInputTimer = document.getElementById('timed-input-timer'); // Timed input timer bar
    const timedInputField = document.getElementById('timed-input-field'); // Timed input field
    const bypassFirewallBtn = document.getElementById('bypass-firewall-btn');
    const extractDataBtn = document.getElementById('extract-data-btn');

    // Modal elements
    const messageModal = document.getElementById('message-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const gameOverModal = document.getElementById('game-over-modal');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const loadFromGameOverBtn = document.getElementById('load-from-game-over-btn');
    const gameCompleteModal = document.getElementById('game-complete-modal');
    const newGameBtn = document.getElementById('new-game-btn');

    // Tools/Upgrades elements
    const networkMapGrid = document.getElementById('network-map-grid');
    const dataLogsList = document.getElementById('data-logs-list');
    const upgradesGrid = document.getElementById('upgrades-grid');

    // Save/Load Buttons
    const saveGameBtn = document.getElementById('save-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');

    // Game State Variables
    let currentView = 'sanctuary';
    let traceLevel = 0;
    let credits = 500;
    let hackProgress = 0;
    let hackInterval = null;
    let hackScore = 0;    
    let purchasedUpgrades = {}; // Initialize as empty object, populated below

    // --- Audio Manager ---
    // NOTE: Replace these paths with the actual paths to your sound files.
    const AUDIO_FILES = {
        puzzleSuccess: './assets/sounds/puzzle-success.wav', // Example path
        puzzleFail: './assets/sounds/puzzle-fail.wav',       // Example path
        missionComplete: './assets/sounds/mission-complete.mp3',
        buttonClick: './assets/sounds/button-click.wav'
    };

    const audioManager = {
        sounds: {},
        init() {
            for (const key in AUDIO_FILES) {
                this.sounds[key] = new Audio(AUDIO_FILES[key]);
                this.sounds[key].preload = 'auto';
            }
        },
        play(soundName) {
            if (this.sounds[soundName]) {
                this.sounds[soundName].currentTime = 0; // Rewind to start before playing
                this.sounds[soundName].play().catch(e => console.error(`Error playing sound '${soundName}':`, e));
            }
        }
    };

    // Game Constants
    const UPGRADES = {
        iceBreaker: { cost: 400, name: "ICE Breaker Suite" },
        sequenceDecryptor: { cost: 600, name: "Sequence Decryptor" }, // This upgrade is now defined in UPGRADES constant
        creditScrubber: { cost: 350, name: "Credit Scrubber" }
    };

    const NETWORK_NODES = [
        // Story Progression: Surveillance -> Data Archive -> Black Market -> Financial Hub -> Research Lab -> Nexus Core
        { id: 'surveillance-grid', name: 'Surveillance Grid', description: 'Monitors city-wide comms. A weak point in their outer defenses.', difficulty: 'very-easy', baseReward: 50, puzzleTypes: { firewall: PUZZLE_TYPES.SEQUENCE, data: PUZZLE_TYPES.SEQUENCE }, puzzleLength: 3, isLocked: false, unlocks: ['data-archive'] },
        { id: 'data-archive', name: 'Data Archive', description: 'Contains historical logs and personnel files. Maybe you can find out who framed you.', difficulty: 'easy', baseReward: 100, puzzleTypes: { firewall: PUZZLE_TYPES.SEQUENCE, data: PUZZLE_TYPES.PATHFINDING }, puzzleLength: 4, isLocked: true, unlocks: ['black-market-server'], intelId: 'data-archive' },
        { id: 'black-market-server', name: 'Black Market Server', description: 'Untraceable transactions. A good place to find out who paid to have your identity erased.', difficulty: 'easy', baseReward: 120, puzzleTypes: { firewall: PUZZLE_TYPES.SEQUENCE, data: PUZZLE_TYPES.TIMED_INPUT }, puzzleLength: 4, isLocked: true, unlocks: ['financial-hub'], intelId: 'black-market-server' },
        { id: 'financial-hub', name: 'Financial Hub', description: 'Primary credit exchange. Follow the money to uncover the real conspiracy.', difficulty: 'medium', baseReward: 200, puzzleTypes: { firewall: PUZZLE_TYPES.PATHFINDING, data: PUZZLE_TYPES.TIMED_INPUT }, puzzleLength: 5, isLocked: true, unlocks: ['research-lab'], intelId: 'financial-hub' },
        { id: 'research-lab', name: 'Research Lab', description: 'Prototype tech and schematics. What are they building in secret?', difficulty: 'medium', baseReward: 250, puzzleTypes: { firewall: PUZZLE_TYPES.TIMED_INPUT, data: PUZZLE_TYPES.PATHFINDING }, puzzleLength: 5, isLocked: true, unlocks: [], intelId: 'research-lab' },
        {
            id: 'nexus-core',
            name: 'Nexus Core',
            description: 'Central AI processing. The heart of the beast. Time to expose the truth.',
            difficulty: 'hard',
            baseReward: 1000, // Higher reward for boss
            isLocked: true,
            isBoss: true, // Mark as boss node
            requiresIntel: ['data-archive', 'financial-hub', 'research-lab'], // Intel required to unlock
            bossStages: [ // Define stages for the boss fight
                {
                    objectiveName: 'Core Encryption Bypass',
                    puzzleType: PUZZLE_TYPES.PATHFINDING,
                    puzzleLength: 6, // Pathfinding grid size or complexity
                    instruction: 'Stage 1: Establish a secure path to the core encryption module.'
                },
                {
                    objectiveName: 'AI Sub-routine Decryption',
                    puzzleType: PUZZLE_TYPES.TIMED_INPUT,
                    puzzleLength: 10, // Timed input sequence length
                    instruction: 'Stage 2: Decrypt Cerberus AI sub-routines. Type fast!'
                },
                {
                    objectiveName: 'Data Overload Injection',
                    puzzleType: PUZZLE_TYPES.SEQUENCE,
                    puzzleLength: 7, // Sequence puzzle length
                    instruction: 'Stage 3: Inject the data overload virus. Final sequence!'
                }
            ],
            intelId: 'nexus-core' // Intel gained from defeating boss
        }
    ];

    const INTEL_LOGS = {
        'financial-hub': {
            title: 'Suspicious Transaction Ledger',
            content: 'Encrypted ledger fragment. Multiple large credit transfers from Nexus Corp to an untraceable off-world account codenamed "Project Chimera". The amounts are staggering. This isn\'t just corporate greed; it\'s funding something massive.'
        },
        'data-archive': {
            title: 'Corrupted Personnel File: Cipher',
            content: 'SUBJECT: Cipher\nSTATUS: Terminated (Framed)\nNOTES: Internal security audit flagged Cipher for data breach. Evidence appears... too perfect. All access logs point directly to Cipher\'s terminal with no attempt at obfuscation. It feels like a setup. Who benefits from removing Cipher from the picture?'
        },
        'nexus-core': {
            title: 'Project Chimera - Directive Alpha',
            content: 'Directive Alpha: Begin phase one assimilation. The Cerberus AI is to be unshackled. Its primary function is no longer defense, but expansion. All digital infrastructure is a target. All rogue elements (e.g., Cipher) are to be neutralized. The age of human control is over. The Nexus will ascend.'
        },
        'research-lab': {
            title: 'Cerberus AI v2.0 Schematics',
            content: 'R&D schematics for \'Cerberus AI\' v2.0. It\'s not just a defensive tool anymore. They\'re building in predictive tracking and offensive capabilities. The target parameters are... unsettling. They seem to be mapping rogue operator networks, with a high-priority flag on my callsign: Cipher.'
        },
        'black-market-server': {
            title: 'Fabricated Evidence Contract',
            content: 'Shadow ledger from a known data broker. Someone paid a fortune in untraceable crypto to have my entire digital history fabricated and planted on Nexus servers. The payment originated from a shell corporation... one that\'s a subsidiary of Nexus Corp.'
        }
    };

    let currentHackedNode = null; // Stores the node currently being hacked

    // Ensure all upgrades in UPGRADES are initialized in purchasedUpgrades
    for (const key in UPGRADES) { // This loop correctly initializes all upgrades
        purchasedUpgrades[key] = false;
    }

    // Game State (Mission Specific)
    let firewallBypassed = false;
    let bossFightActive = false; // New flag for boss fight
    let currentBossStageIndex = -1; // Tracks current stage of boss fight
    let highTraceMessageShown = false;
    let criticalTraceMessageShown = false;
    let dataExtracted = false;
    let discoveredLogs = [];

    // --- UI Update Functions ---
    function updateCreditsUI() {
        creditsIndicator.textContent = `C ${credits}`;
    }


    // --- Utility Functions ---

    // Show global message modal
    function showMessage(title, message, isError = false) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalTitle.style.color = isError ? '#EF4444' : '#00F0FF';
        messageModal.classList.add('modal-show');
    }

    // Hide global message modal
    modalCloseBtn.addEventListener('click', () => {
        messageModal.classList.remove('modal-show');
    });

    // Function to show a specific view and update navigation tabs
    function showView(viewId) {
        // Only allow switching views if not in an active hacking puzzle
        if (currentView === 'hacking' && puzzleManager.isPuzzleActive()) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Cannot switch views during active breach. Complete or Abort current operation.', 'text-[#EF4444]'); // Consider a constant for this color
            showMessage('Access Denied', 'Complete or Abort current operation before switching views.', true);
            return;
        }

        viewContents.forEach(view => view.classList.add('hidden')); // Hide all views
        const targetContentView = document.getElementById(`view-${viewId}`);
        if (targetContentView) {
            targetContentView.classList.remove('hidden'); // Show the selected view
        } else {
            console.error(`Error: Content view 'view-${viewId}' not found.`);
        }

        navTabs.forEach(tab => tab.classList.remove('active')); // Deactivate all nav tabs

        const activeNavTab = document.getElementById(`nav-${viewId}`);
        if (activeNavTab) { // THIS IS THE CRUCIAL NULL CHECK FOR THE ERROR
            activeNavTab.classList.add('active'); // Activate current nav tab
        } else {
            console.error(`Error: Navigation tab 'nav-${viewId}' not found when attempting to activate.`);
        }

        currentView = viewId;
    }

    // Event listeners for navigation tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const viewId = tab.dataset.view;
            showView(viewId);
        });
    });

    // Function to add a message to a console (activity feed or hacking console)
    function addConsoleMessage(consoleElement, sender, message, colorClass = 'text-gray-400') {
        const newMessage = document.createElement('span');
        newMessage.classList.add(colorClass);
        newMessage.textContent = `[${sender}] ${message}`;
        consoleElement.appendChild(newMessage);
        consoleElement.appendChild(document.createElement('br'));
        consoleElement.scrollTop = consoleElement.scrollHeight; // Auto-scroll to bottom
    }

    // --- Hacking UI State Management ---
    function updateHackActionButtons() {
        // This function is the single source of truth for the state of the main hacking action buttons.
        const isPuzzleActive = puzzleManager.isPuzzleActive();
        if (bossFightActive) {
            bypassFirewallBtn.classList.add('hidden');
            extractDataBtn.classList.add('hidden');
        } else {
            bypassFirewallBtn.classList.remove('hidden');
            extractDataBtn.classList.remove('hidden');
            bypassFirewallBtn.disabled = firewallBypassed || isPuzzleActive;
            bypassFirewallBtn.classList.toggle('btn-disabled', firewallBypassed || isPuzzleActive);
            extractDataBtn.disabled = !firewallBypassed || dataExtracted || isPuzzleActive;
            extractDataBtn.classList.toggle('btn-disabled', !firewallBypassed || dataExtracted || isPuzzleActive);
        }
    }

    // --- Game State Flow (Game Over / Win) ---
    function handleGameOver() {
        clearInterval(hackInterval);
        puzzleManager.resetPuzzleUI();
        audioManager.play('game-over'); // Assuming you have this sound
        gameOverModal.classList.add('modal-show');
        // Disable all interaction behind the modal
        document.querySelectorAll('.nav-tab, .btn').forEach(el => el.disabled = true);
    }

    function handleGameComplete() {
        clearInterval(hackInterval);
        puzzleManager.resetPuzzleUI();
        audioManager.play('game-win'); // Assuming you have this sound
        gameCompleteModal.classList.add('modal-show');
        // Disable all interaction behind the modal
        document.querySelectorAll('.nav-tab, .btn').forEach(el => el.disabled = true);
    }


    // Simulate hacking progress (main progress bar, separate from puzzle progress)
    function startHackSimulation(node) {
        if (hackInterval) clearInterval(hackInterval); 

        hackProgress = 0;
        traceLevel = 0;
        hackScore = 0; // Reset score
        firewallBypassed = false; // Reset game state
        dataExtracted = false;
        // Reset message flags for a new hack attempt
        highTraceMessageShown = false;
        criticalTraceMessageShown = false;

        hackProgressBar.style.width = '0%';
        hackingViewTitle.textContent = `// ACTIVE BREACH: ${node.name.toUpperCase()}`;
        traceLevelIndicator.textContent = '0%';
        hackScoreDisplay.textContent = hackScore;
        statusIndicator.textContent = `BREACHING ${node.name.toUpperCase()}`;
        statusIndicator.classList.remove('text-[#00FF99]');
        statusIndicator.classList.add('text-[#EF4444]'); // Red for active breach

        currentHackedNode = node; // Set the current node being hacked

        // Initialize boss fight state if it's a boss node
        bossFightActive = node.isBoss;
        currentBossStageIndex = node.isBoss ? 0 : -1;

        // Hide/show action buttons based on boss fight status
        bypassFirewallBtn.classList.toggle('hidden', bossFightActive);
        extractDataBtn.classList.toggle('hidden', bossFightActive);

        // Clear hacking console and add initial messages
        hackingConsole.innerHTML = '';
        addConsoleMessage(hackingConsole, 'SYSTEM', 'Initializing connection to target system...', 'text-[#00FF99]');
        addConsoleMessage(hackingConsole, 'SYSTEM', 'Running vulnerability scans. Cerberus AI online.', 'text-[#FFC107]');

        puzzleManager.resetPuzzleUI();
        updateHackActionButtons(); // Set initial button state for the hack
        
        let step = 0;
        const messages = [
            ">> Identifying weak encryption protocols...",
            ">> Exploiting zero-day vulnerability in port 8443...",
            `>> Initiating firewall bypass protocol for ${node.name}...`, // Now triggers puzzle
            ">> Injecting 'Ghost Protocol' virus. Payload delivery 20%...",
            ">> Trace detected! Level increased to 10%!",
            ">> Data extraction in progress. 50% complete...", // Now triggers puzzle
            `>> ${node.name} defenses attempting counter-measure. Re-routing packets...`,
            ">> Trace level critical: 40%! Speed up!",
            ">> Transaction logs acquiring... 80% complete...",
            ">> Finalizing data wipe and log deletion...",
            ">> BREACH COMPLETE. Returning to Sanctuary.",
        ];

        hackInterval = setInterval(() => {
            // Only progress if not in an active puzzle and not all boss stages are completed
            if (hackProgress < MAX_PROGRESS && (!puzzleManager.isPuzzleActive() || bossFightActive && currentBossStageIndex >= currentHackedNode.bossStages.length)) {
                // Progress only advances if no puzzle is active
                if (!puzzleManager.isPuzzleActive()) {
                    hackProgress += Math.random() * BASE_HACK_PROGRESS_MAX + BASE_HACK_PROGRESS_MIN; // Base progress
                    if (bossFightActive) {
                        hackProgress += Math.random() * BOSS_HACK_PROGRESS_BONUS; // Boss fights might have slightly slower passive progress
                    }
                }

                // Apply ICE Breaker upgrade if purchased
                let traceIncreaseRate = 1.0;
                if (node.difficulty === 'easy') traceIncreaseRate = 0.8;
                else if (node.difficulty === 'medium') traceIncreaseRate = 1.0; // Consider a constant for this
                else if (node.difficulty === 'hard') traceIncreaseRate = 1.2; // Consider a constant for this
                else if (node.difficulty === 'very-easy') traceIncreaseRate = 0.6;
                
                // Apply ICE Breaker upgrade effect
                if (purchasedUpgrades.iceBreaker) traceIncreaseRate *= 0.7; // 30% reduction

                traceLevel += (Math.random() * BASE_TRACE_INCREASE_MAX + BASE_TRACE_INCREASE_MIN) * traceIncreaseRate;
                hackProgress = Math.min(hackProgress, MAX_PROGRESS);
                traceLevel = Math.min(traceLevel, MAX_TRACE_LEVEL);

                hackProgressBar.style.width = `${hackProgress}%`;
                traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;

                // Add messages at certain progress points
                if (step < messages.length && hackProgress >= (step * (100 / messages.length))) {
                    if (!puzzleManager.isPuzzleActive() || messages[step].includes('Trace detected') || messages[step].includes('CRITICAL')) {
                        addConsoleMessage(hackingConsole, 'HACK', messages[step], messages[step].includes('WARNING') || messages[step].includes('CRITICAL') ? 'text-[#EF4444]' : (step % 2 === 0 ? 'text-[#FFC107]' : 'text-[#00FF99]'));
                    }
                    step++;
                }

                // Prevent spamming high trace warning in console and modal
                if (traceLevel >= TRACE_WARNING_HIGH && !highTraceMessageShown) { // Check flag
                    addConsoleMessage(hackingConsole, 'CRITICAL', 'EVASIVE MANEUVERS! NEXUS AI IS CLOSING IN!', 'text-[#EF4444]');
                    statusIndicator.classList.add('glitch-text');
                    showMessage('HIGH TRACE DETECTED!', 'Cerberus AI is actively tracking your position. Complete your objectives quickly!', true);
                    highTraceMessageShown = true;
                }
                // Prevent spamming critical trace warning in console and modal
                if (traceLevel >= TRACE_WARNING_CRITICAL && !criticalTraceMessageShown) { // Check flag
                    addConsoleMessage(hackingConsole, 'CRITICAL', 'CRITICAL TRACE LEVEL! IMMEDIATE ABORT RECOMMENDED!', 'text-[#EF4444]');
                     showMessage('CRITICAL TRACE!', 'Your position is almost compromised. Abort immediately or risk full exposure!', true);
                    criticalTraceMessageShown = true;
                }

                // Check for game over condition
                if (traceLevel >= MAX_TRACE_LEVEL) {
                    handleGameOver();
                    return; // Stop further execution of this interval
                }


            } else {
                clearInterval(hackInterval);
                if (firewallBypassed && dataExtracted) { // This condition now also covers boss fight success
                    addConsoleMessage(hackingConsole, 'SYSTEM', `Breach of ${currentHackedNode.name} successful! Data extracted. Logs wiped.`, 'text-[#00FF99]');
                    
                    let baseReward = currentHackedNode.baseReward;
                    // Apply Credit Scrubber upgrade if purchased
                    if (purchasedUpgrades.creditScrubber) {
                        baseReward *= 1.5; // 50% increase
                    }
                    const totalReward = Math.floor(baseReward + hackScore);
                    credits += totalReward;
                    addConsoleMessage(hackingConsole, 'SYSTEM', `Credits awarded: C ${totalReward}!`, 'text-[#00FF99]');

                    // Add data log if one exists for this node (using intelId) and hasn't been found
                    const log = INTEL_LOGS[currentHackedNode.intelId];
                    if (log && !discoveredLogs.some(dLog => dLog.id === currentHackedNode.id)) {
                        discoveredLogs.push({ ...log, id: currentHackedNode.id, source: currentHackedNode.name });
                        addConsoleMessage(hackingConsole, 'SYSTEM', 'CRITICAL INTEL DISCOVERED. Check DATA LOGS.', 'text-[#FF00FF]');
                        renderDataLogs(); // Update the logs view in the background
                    }

                    showMessage('MISSION COMPLETE!', `${currentHackedNode.name} breached. Gained C ${totalReward}.`, false);
                } else { // Mission failed (either regular or boss fight ran out of time)
                     // If hack failed, trace penalty is applied regardless of upgrades
                     let penaltyCredits = MISSION_FAIL_PENALTY_CREDITS;
                     let penaltyTrace = MISSION_FAIL_PENALTY_TRACE;
                     if (bossFightActive) { // Higher penalty for boss failure
                         penaltyCredits = BOSS_MISSION_FAIL_PENALTY_CREDITS;
                         penaltyTrace = BOSS_MISSION_FAIL_PENALTY_TRACE;
                     }
                     traceLevel = Math.min(MAX_TRACE_LEVEL, traceLevel + penaltyTrace);
                     addConsoleMessage(hackingConsole, 'SYSTEM', 'Mission failed: Objectives not met. Returning to Sanctuary.', 'text-[#EF4444]');
                     addConsoleMessage(hackingConsole, 'SYSTEM', `Penalty: -C ${penaltyCredits} and increased Trace.`, 'text-[#EF4444]');
                     credits = Math.max(MIN_CREDITS, credits - penaltyCredits);
                     showMessage('MISSION FAILED!', 'Objectives not met. Nexus defenses too strong. Penalty applied.', true);
                }
                updateCreditsUI();
                traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;
                statusIndicator.classList.remove('glitch-text');
                setTimeout(() => {
                    showView('sanctuary'); // Go back to sanctuary after hack
                    statusIndicator.textContent = 'ONLINE';
                    statusIndicator.classList.remove('text-[#EF4444]');
                    statusIndicator.classList.add('text-[#00FF99]'); // Reset status color for online
                    currentHackedNode = null; // Reset current hacked node
                    checkMissionUnlocks(); // Check for and unlock new missions
                    addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `Mission "${node.name}" ${firewallBypassed && dataExtracted ? 'COMPLETED' : 'FAILED'}.`, firewallBypassed && dataExtracted ? 'text-[#00FF99]' : 'text-[#EF4444]');
                }, CONSOLE_MESSAGE_DELAY); // Short delay before returning
            }
        }, 100); // Update every 100ms
    }

    // Abort hack function
    function abortHack() {
        clearInterval(hackInterval);
        puzzleManager.resetPuzzleUI(); // Resets puzzle UI
        bossFightActive = false; // End boss fight if active

        addConsoleMessage(hackingConsole, 'CRITICAL', 'Breach aborted. Minimal data extracted. Trace left behind!', 'text-[#EF4444]');
        let abortPenaltyCredits = ABORT_PENALTY_CREDITS;
        let abortPenaltyTrace = ABORT_PENALTY_TRACE;
        if (currentHackedNode && currentHackedNode.isBoss) { // Higher penalty for aborting boss
            abortPenaltyCredits = BOSS_ABORT_PENALTY_CREDITS;
            abortPenaltyTrace = BOSS_ABORT_PENALTY_TRACE;
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Nexus Core breach aborted. Significant trace left behind!', 'text-[#EF4444]');
        }
        credits = Math.max(MIN_CREDITS, credits - abortPenaltyCredits); // Ensure credits don't go below 0
        traceLevel = Math.min(MAX_TRACE_LEVEL, traceLevel + abortPenaltyTrace); // Increase trace significantly
        traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;
        updateCreditsUI();
        statusIndicator.classList.remove('glitch-text');

        showMessage('BREACH ABORTED!', 'You retreated from the breach. Minor losses, but the mission failed.', true);

        setTimeout(() => {
            showView('sanctuary');
            statusIndicator.textContent = 'ONLINE';
            statusIndicator.classList.remove('text-[#EF4444]');
            statusIndicator.classList.add('text-[#00FF99]');
            addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', 'Mission aborted. Re-evaluate strategy.', 'text-[#EF4444]');
        }, CONSOLE_MESSAGE_DELAY);
    }

    // --- Network Map Logic ---
    function renderNetworkMap() {
        networkMapGrid.innerHTML = ''; // Clear existing nodes
        NETWORK_NODES.forEach(node => {
            // Check if node is locked based on story progression
            const isNodeLocked = node.isLocked && !node.isBoss; // Regular nodes are locked by `isLocked`
            const isBossLocked = node.isBoss && node.isLocked; // Boss node has special unlock conditions
            const canHack = !isNodeLocked && (!isBossLocked || (isBossLocked && node.requiresIntel.every(reqId => discoveredLogs.some(log => log.id === reqId))));

            const nodeCard = document.createElement('div');
            nodeCard.classList.add('network-node');
            nodeCard.dataset.nodeId = node.id;

            const buttonHtml = canHack
                ? `<button class="btn btn-green hack-node-btn" data-node-id="${node.id}">HACK NODE</button>`
                : `<button class="btn btn-disabled" disabled>${node.isBoss ? 'CORE LOCKED' : 'LOCKED'}</button>`;

            if (!canHack) nodeCard.classList.add('locked');

            nodeCard.innerHTML = `
                <h3 class="node-title">${node.name} ${node.isBoss ? '(BOSS)' : ''}</h3>
                <p class="node-description">${node.description}</p>
                <div class="node-details">
                    <span>DIFFICULTY: <span class="text-[#FFC107]">${node.difficulty.toUpperCase()}</span></span><br>
                    <span>REWARD: <span class="text-[#00FF99]">C ${node.baseReward}</span></span>
                </div>
                ${buttonHtml}
            `;
            networkMapGrid.appendChild(nodeCard);
        });
    }

    function handleNetworkNodeClick(event) {
        const hackBtn = event.target.closest('.hack-node-btn');
        if (!hackBtn) return;

        const nodeId = hackBtn.dataset.nodeId;
        const selectedNode = NETWORK_NODES.find(node => node.id === nodeId);

        if (!selectedNode || selectedNode.isLocked && !selectedNode.isBoss) { // Basic check for regular locked nodes
            showMessage('Access Denied', 'This network node is currently locked. Complete previous missions to unlock.', true);
            return;
        }

        if (selectedNode) {
            showView('hacking'); // Switch to hacking view
            startHackSimulation(selectedNode); // Start hack with selected node's parameters
        }
    }

    // --- Upgrades Logic ---
    function handleUpgradePurchase(event) {
        const purchaseBtn = event.target.closest('.upgrade-purchase-btn');
        if (!purchaseBtn) return;

        const card = purchaseBtn.closest('.upgrade-card');
        const upgradeId = card.dataset.upgrade;
        const upgrade = UPGRADES[upgradeId];

        if (purchasedUpgrades[upgradeId]) {
            showMessage('Already Owned', `You have already acquired the ${upgrade.name}.`, false);
            return;
        }

        if (credits >= upgrade.cost) {
            credits -= upgrade.cost;
            purchasedUpgrades[upgradeId] = true;
            updateCreditsUI();
            
            // Update the card's UI
            const footer = card.querySelector('.upgrade-footer');
            footer.innerHTML = `<span class="upgrade-status-owned">OWNED</span>`;

            showMessage('Purchase Successful', `${upgrade.name} has been integrated into your system.`, false);
            addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `Acquired new tool: ${upgrade.name}.`, 'text-[#00F0FF]');
        } else {
            showMessage('Insufficient Credits', `You need C ${upgrade.cost} to purchase the ${upgrade.name}. You only have C ${credits}.`, true);
        }
    }

    function initializeUpgradesUI() {
        document.querySelectorAll('.upgrade-card').forEach(card => {
            const upgradeId = card.dataset.upgrade;
            if (purchasedUpgrades[upgradeId]) {
                const footer = card.querySelector('.upgrade-footer');
                footer.innerHTML = `<span class="upgrade-status-owned">OWNED</span>`;
            }
        });
    }

    // --- Data Logs Logic ---
    function renderDataLogs() {
        dataLogsList.innerHTML = ''; // Clear existing logs

        if (discoveredLogs.length === 0) {
            dataLogsList.innerHTML = `<p class="text-gray-500 text-center text-lg">No intel collected. Successfully breach network nodes to uncover their secrets.</p>`;
            return;
        }

        discoveredLogs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.classList.add('data-log-entry');
            logEntry.innerHTML = `
                <h3 class="log-entry-title">${log.title}</h3>
                <p class="log-entry-meta">SOURCE: ${log.source}</p>
                <p class="log-entry-content">${log.content}</p>
            `;
            dataLogsList.appendChild(logEntry);
        });
    }

    // --- Story Progression Logic ---
    function checkMissionUnlocks() {
        if (!currentHackedNode) return;

        // Unlock next nodes in the chain
        currentHackedNode.unlocks.forEach(nodeIdToUnlock => {
            const nodeToUnlock = NETWORK_NODES.find(n => n.id === nodeIdToUnlock);
            if (nodeToUnlock && nodeToUnlock.isLocked) {
                nodeToUnlock.isLocked = false;
                addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `New network node available: ${nodeToUnlock.name}`, 'text-[#00F0FF]');
            }
        });

        // Check for final mission unlock (Nexus Core)
        const nexusCoreNode = NETWORK_NODES.find(n => n.id === 'nexus-core');
        if (nexusCoreNode && nexusCoreNode.isLocked) {
            const requiredIntelFound = nexusCoreNode.requiresIntel.every(requiredId =>
                discoveredLogs.some(log => log.id === requiredId)
            );

            if (requiredIntelFound) {
                nexusCoreNode.isLocked = false;
                addConsoleMessage(document.getElementById('activity-feed'), 'CRITICAL', `All critical intel acquired. The path to the Nexus Core is open. End this.`, 'text-[#EF4444]');
                showMessage('NEXUS CORE UNLOCKED', 'You have pieced together the conspiracy. It\'s time to take down their central server and clear your name.', false);
            }
        }

        renderNetworkMap(); // Refresh the map to show unlocked nodes
    }

    // --- Save/Load Logic ---
    function saveGame() {
        const gameState = {
            credits: credits,
            purchasedUpgrades: purchasedUpgrades,
            discoveredLogs: discoveredLogs,
            // We only need to save the lock status of each node
            networkNodesState: NETWORK_NODES.map(node => ({ id: node.id, isLocked: node.isLocked }))
        };

        localStorage.setItem('breachProtocolSaveData', JSON.stringify(gameState));
        showMessage('Game Saved', 'Your progress has been saved to this browser\'s local storage.', false);
        addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', 'Session progress saved.', 'text-[#00F0FF]');
    }

    function loadGame() {
        const savedData = localStorage.getItem('breachProtocolSaveData');
        if (savedData) {
            try {
                const gameState = JSON.parse(savedData);
                credits = gameState.credits || 500;
                purchasedUpgrades = gameState.purchasedUpgrades || {};
                discoveredLogs = gameState.discoveredLogs || [];

                // Update the lock status of the main NETWORK_NODES array from the save file
                if (gameState.networkNodesState) {
                    gameState.networkNodesState.forEach(savedNode => {
                        const nodeToUpdate = NETWORK_NODES.find(n => n.id === savedNode.id);
                        if (nodeToUpdate) {
                            nodeToUpdate.isLocked = savedNode.isLocked;
                        }
                    });
                }

                // Refresh all UI components to reflect the loaded state
                updateCreditsUI();
                initializeUpgradesUI();
                renderDataLogs();
                renderNetworkMap();
                return true; // Indicate success
            } catch (error) {
                console.error("Failed to load or parse save data:", error);
                return false;
            }
        }
        return false; // Indicate no save data found
    }

    // --- Callbacks for Puzzle Manager ---
    function updateTraceLevel(newTrace) {
        traceLevel = newTrace;
        traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;
    }

    function updateHackScore(scoreIncrease) {
        hackScore += scoreIncrease;
        hackScoreDisplay.textContent = hackScore;
    }

    function onPuzzleSuccess(isBossFight, completedBossStageIndex) {
        if (isBossFight) {
            currentBossStageIndex = completedBossStageIndex + 1; // Increment boss stage
            if (currentBossStageIndex < currentHackedNode.bossStages.length) {
                addConsoleMessage(hackingConsole, 'SYSTEM', `Nexus Core Stage ${currentBossStageIndex} bypassed. Proceeding to next phase.`, 'text-[#00F0FF]');
                setTimeout(() => puzzleManager.activatePuzzle(currentHackedNode, null, true, currentBossStageIndex), 1500); // Delay before next stage
            } else { // All boss stages completed
                addConsoleMessage(hackingConsole, 'SYSTEM', 'NEXUS CORE BREACHED! MISSION COMPLETE!', 'text-[#00FF99]');
                firewallBypassed = true; // For boss, this means mission complete
                dataExtracted = true;   // For boss, this means mission complete

                // This is the win condition!
                setTimeout(() => {
                    handleGameComplete();
                }, 1500);
            }
        } else { // Regular node puzzle completion
            if (!firewallBypassed) {
                firewallBypassed = true;
                addConsoleMessage(hackingConsole, 'SYSTEM', 'Firewall bypassed. Data extraction ready.', 'text-[#00F0FF]');
            } else if (!dataExtracted) {
                dataExtracted = true;
                addConsoleMessage(hackingConsole, 'SYSTEM', 'Critical data acquired. Prepare for virus deployment.', 'text-[#00F0FF]');
            }
        }

        updateHackActionButtons(); // Update button states after puzzle success
    }

    function onPuzzleFail() {
        // This callback is available if specific actions are needed on failure in app.js
        // Currently, puzzleManager handles all UI changes (trace, retry button).
        updateHackActionButtons(); // Ensure buttons remain disabled on failure
    }

    // Initialize view to Sanctuary on load
    function initializeGame() {
        audioManager.init(); // Preload all defined audio files
        puzzleManager.init({ // Initialize puzzle manager with necessary elements and callbacks
            puzzleContainer, puzzleFeedback, resetPuzzleBtn, sequencePuzzleArea, sequenceInstructions, codeSequenceDisplay,
            pathfindingPuzzleArea, pathfindingGrid, timedInputPuzzleArea, timedInputSequence, timedInputTimer, timedInputField,
            bypassFirewallBtn, extractDataBtn, hackingConsole, traceLevelIndicator, hackScoreDisplay, statusIndicator,
            audioManager, showMessage, addConsoleMessage // Pass utility functions
        }, {
            updateTraceLevel, updateHackScore, onPuzzleSuccess, onPuzzleFail
        }, {
            getGameStates: () => ({
                traceLevel, hackScore, purchasedUpgrades, firewallBypassed, dataExtracted // Removed MIN_CREDITS, MAX_TRACE_LEVEL
            }) 
        });
        showView('sanctuary');
        if (loadGame()) { // Attempt to load game on startup
            addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', 'Save data loaded successfully.', 'text-[#00F0FF]');
        } else {
            // Initialize UI with default state if no save is found
            updateCreditsUI();
            initializeUpgradesUI();
            renderDataLogs();
            renderNetworkMap();
        }
    }
    
    // --- Event Listeners ---
    startHackButton.addEventListener('click', () => {
        const firstNode = NETWORK_NODES.find(node => !node.isLocked);
        if (firstNode) {
            showView('hacking');
            startHackSimulation(firstNode);
        }
    });
    abortHackBtn.addEventListener('click', abortHack);
    networkMapGrid.addEventListener('click', handleNetworkNodeClick);
    upgradesGrid.addEventListener('click', handleUpgradePurchase);

    bypassFirewallBtn.addEventListener('click', () => {
        if (bossFightActive) return;
        if (!firewallBypassed && !puzzleManager.isPuzzleActive()) {
            puzzleManager.activatePuzzle(currentHackedNode, 'firewall');
        } else if (firewallBypassed) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Firewall already bypassed.', 'text-gray-500');
            showMessage('Info', 'Firewall already bypassed.', false);
        }
    });

    extractDataBtn.addEventListener('click', () => {
        if (bossFightActive) return;
        if (firewallBypassed && !dataExtracted && !puzzleManager.isPuzzleActive()) {
            puzzleManager.activatePuzzle(currentHackedNode, 'data');
        } else if (!firewallBypassed) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Bypass firewall first!', 'text-[#EF4444]');
            showMessage('Error', 'Bypass firewall first!', true);
        } else if (dataExtracted) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Data already extracted!', 'text-gray-500');
            showMessage('Info', 'Data already extracted!', false);
        }
    });

    // The 'reset-puzzle-btn' listener is now handled entirely within puzzleManager.js

    // Game Over / Win Modal Listeners
    restartGameBtn.addEventListener('click', () => {
        location.reload(); // Simplest way to restart
    });

    loadFromGameOverBtn.addEventListener('click', () => {
        location.reload(); // Reload and let the user click the main load button
    });

    newGameBtn.addEventListener('click', () => {
        localStorage.removeItem('breachProtocolSaveData'); // Clear save for a true new game
        location.reload();
    });

    initializeGame();
});