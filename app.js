document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const navTabs = document.querySelectorAll('.nav-tab');
    const viewContents = document.querySelectorAll('.view-content');
    const startHackButton = document.getElementById('start-hack-button');
    const hackProgressBar = document.getElementById('hack-progress-bar');
    const hackingConsole = document.getElementById('hacking-console');
    const abortHackBtn = document.getElementById('abort-hack-btn');
    const traceLevelIndicator = document.getElementById('trace-level');
    const creditsIndicator = document.getElementById('credits');
    const statusIndicator = document.getElementById('status-indicator');
    const hackScoreDisplay = document.getElementById('hack-score');

    // Puzzle elements
    const puzzleArea = document.getElementById('puzzle-area');
    const puzzleInstructions = document.getElementById('puzzle-instructions');
    const codeSequenceDisplay = document.getElementById('code-sequence-display');
    const puzzleFeedback = document.getElementById('puzzle-feedback');
    const resetPuzzleBtn = document.getElementById('reset-puzzle-btn');
    const bypassFirewallBtn = document.getElementById('bypass-firewall-btn');
    const extractDataBtn = document.getElementById('extract-data-btn');

    // Modal elements
    const messageModal = document.getElementById('message-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Tools/Upgrades elements
    const upgradesGrid = document.getElementById('upgrades-grid');

    // Game State Variables
    let currentView = 'sanctuary';
    let traceLevel = 0;
    let credits = 500;
    let hackProgress = 0;
    let hackInterval = null;
    let hackScore = 0;
    let purchasedUpgrades = {
        iceBreaker: false,
        sequenceDecryptor: false,
        creditScrubber: false
    };

    // Game Constants
    const UPGRADES = {
        iceBreaker: { cost: 400, name: "ICE Breaker Suite" },
        sequenceDecryptor: { cost: 600, name: "Sequence Decryptor" },
        creditScrubber: { cost: 350, name: "Credit Scrubber" }
    };

    // Puzzle State
    let correctSequence = [];
    let playerSequence = [];
    let puzzleActive = false;
    let firewallBypassed = false;
    let dataExtracted = false;

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
        if (currentView === 'hacking' && puzzleActive) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Cannot switch views during active breach. Complete or Abort current operation.', 'text-[#EF4444]');
            showMessage('Access Denied', 'Complete or Abort current operation before switching views.', true);
            return;
        }

        viewContents.forEach(view => {
            // Added null check for safety, though querySelectorAll should return valid elements
            if (view) {
                view.classList.add('hidden'); // Hide all views
            }
        });

        const targetContentView = document.getElementById(`view-${viewId}`);
        if (targetContentView) {
            targetContentView.classList.remove('hidden'); // Show the selected view
        } else {
            console.error(`Error: Content view 'view-${viewId}' not found.`);
        }


        navTabs.forEach(tab => {
            // Added null check for safety, though navTabs is a NodeList so elements should exist
            if (tab) {
                tab.classList.remove('active'); // Deactivate all nav tabs
            }
        });

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

    // --- Code Sequence Puzzle Logic ---
    function generatePuzzle(baseLength = 5) {
        const length = purchasedUpgrades.sequenceDecryptor ? baseLength - 1 : baseLength;
        const chars = ['0', '1', 'F', 'A', 'E', '7', 'C', 'B']; // More characters for variety
        correctSequence = [];
        codeSequenceDisplay.innerHTML = '';
        for (let i = 0; i < length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            correctSequence.push(char);
            const node = document.createElement('div');
            node.classList.add('puzzle-node', 'opacity-0'); // Start hidden
            node.textContent = char;
            node.dataset.index = i;
            codeSequenceDisplay.appendChild(node);
        }
        playerSequence = [];
        puzzleFeedback.textContent = '';
        resetPuzzleBtn.classList.add('hidden');
    }

    function activatePuzzle(instruction = "Enter the highlighted sequence:") {
        puzzleArea.classList.remove('hidden', 'flex-col');
        puzzleArea.classList.add('flex'); // Ensure flex display
        puzzleInstructions.textContent = instruction;
        // Disable main action buttons while puzzle is active
        bypassFirewallBtn.disabled = true;
        bypassFirewallBtn.classList.add('btn-disabled');
        extractDataBtn.disabled = true;
        extractDataBtn.classList.add('btn-disabled');

        puzzleActive = true;
        addConsoleMessage(hackingConsole, 'SYSTEM', 'Sub-routine activated! System requires manual input.', 'text-[#FFC107]');

        generatePuzzle(); // Generate new sequence

        // Reveal sequence one by one with highlight
        let delay = 0;
        codeSequenceDisplay.querySelectorAll('.puzzle-node').forEach((node, index) => {
            setTimeout(() => {
                node.classList.remove('opacity-0');
                node.classList.add('node-active-highlight'); // Apply temporary highlight
                setTimeout(() => {
                    node.classList.remove('node-active-highlight');
                }, 500); // Remove highlight after half a second
            }, delay);
            delay += 750; // Delay for next node
        });

        // Add event listener for clicking nodes
        codeSequenceDisplay.addEventListener('click', handleNodeClick);
    }

    function handleNodeClick(event) {
        if (!puzzleActive) return;

        const clickedNode = event.target.closest('.puzzle-node');
        if (!clickedNode) return;

        const char = clickedNode.textContent;
        const index = parseInt(clickedNode.dataset.index);

        // Prevent clicking already selected nodes in the same attempt
        if (playerSequence.includes(char) && playerSequence.indexOf(char) === index) {
            return; // Or handle as an error if strict no-repeat is desired
        }

        playerSequence.push(char);
        clickedNode.classList.add('node-active-highlight'); // Show selection highlight

        if (playerSequence.length === correctSequence.length) {
            checkPuzzleCompletion();
        }
    }

    function checkPuzzleCompletion() {
        puzzleActive = false; // Puzzle ends after full sequence input
        codeSequenceDisplay.removeEventListener('click', handleNodeClick); // Remove listener

        const isCorrect = playerSequence.every((char, i) => char === correctSequence[i]);

        if (isCorrect) {
            puzzleFeedback.textContent = 'SEQUENCE ACCEPTED!';
            puzzleFeedback.classList.remove('text-[#EF4444]');
            puzzleFeedback.classList.add('text-[#00FF99]');
            addConsoleMessage(hackingConsole, 'HACK', 'Encryption bypassed! Access granted.', 'text-[#00FF99]');
            hackScore += 50; // Reward for puzzle completion (increased)
            hackScoreDisplay.textContent = hackScore;

            // Apply success styling to nodes
            codeSequenceDisplay.querySelectorAll('.puzzle-node').forEach((node, i) => {
                node.classList.remove('node-active-highlight');
                node.classList.add('node-correct');
            });

            // Enable relevant action based on which puzzle was completed
            if (!firewallBypassed) {
                firewallBypassed = true;
                extractDataBtn.disabled = false;
                extractDataBtn.classList.remove('btn-disabled');
                // Bypass firewall button is disabled after first use
                bypassFirewallBtn.classList.add('btn-disabled');
                bypassFirewallBtn.disabled = true;
                puzzleArea.classList.add('hidden'); // Hide puzzle after success
                addConsoleMessage(hackingConsole, 'SYSTEM', 'Firewall bypassed. Data extraction ready.', 'text-[#00F0FF]');
            } else if (!dataExtracted) {
                dataExtracted = true;
                addConsoleMessage(hackingConsole, 'HACK', 'Data transfer initiated. Prepare for final stage.', 'text-[#00FF99]');
                puzzleArea.classList.add('hidden'); // Hide puzzle after success
                // Disable the extract button after extraction
                extractDataBtn.disabled = true;
                extractDataBtn.classList.add('btn-disabled');
                addConsoleMessage(hackingConsole, 'SYSTEM', 'Critical data acquired. Prepare for virus deployment.', 'text-[#00F0FF]');
            }

        } else {
            puzzleFeedback.textContent = 'SEQUENCE DENIED! Trace increased!';
            puzzleFeedback.classList.remove('text-[#00FF99]');
            puzzleFeedback.classList.add('text-[#EF4444]');
            addConsoleMessage(hackingConsole, 'CRITICAL', 'Incorrect sequence! Trace level increased!', 'text-[#EF4444]');
            traceLevel = Math.min(100, traceLevel + 15); // Penalty for failure (increased)
            traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;
            resetPuzzleBtn.classList.remove('hidden'); // Show retry button

            // Apply incorrect styling to nodes
            codeSequenceDisplay.querySelectorAll('.puzzle-node').forEach((node, i) => {
                node.classList.remove('node-active-highlight');
                node.classList.add('node-incorrect');
            });
        }
    }

    resetPuzzleBtn.addEventListener('click', () => {
        // A new puzzle is generated which clears the old nodes, so no cleanup is needed here.
        activatePuzzle(puzzleInstructions.textContent); // Regenerate and activate with same instruction
    });

    // --- End Code Sequence Puzzle Logic ---

    // Simulate hacking progress (main progress bar, separate from puzzle progress)
    function startHackSimulation() {
        if (hackInterval) clearInterval(hackInterval);

        hackProgress = 0;
        traceLevel = 0;
        hackScore = 0; // Reset score
        firewallBypassed = false; // Reset game state
        dataExtracted = false;

        hackProgressBar.style.width = '0%';
        traceLevelIndicator.textContent = '0%';
        hackScoreDisplay.textContent = hackScore;
        statusIndicator.textContent = 'BREACH ACTIVE';
        statusIndicator.classList.remove('text-[#00FF99]');
        statusIndicator.classList.add('text-[#EF4444]');

        // Clear hacking console and add initial messages
        hackingConsole.innerHTML = '';
        addConsoleMessage(hackingConsole, 'SYSTEM', 'Initializing connection to target system...', 'text-[#00FF99]');
        addConsoleMessage(hackingConsole, 'SYSTEM', 'Running vulnerability scans. Cerberus AI online.', 'text-[#FFC107]');

        // Reset and enable buttons for a new hack
        bypassFirewallBtn.disabled = false;
        bypassFirewallBtn.classList.remove('btn-disabled');
        extractDataBtn.disabled = true; // Disable until firewall bypassed
        extractDataBtn.classList.add('btn-disabled');
        puzzleArea.classList.add('hidden'); // Hide puzzle initially

        let step = 0;
        const messages = [
            ">> Identifying weak encryption protocols...",
            ">> Exploiting zero-day vulnerability in port 8443...",
            ">> Initiating firewall bypass protocol...", // Now triggers puzzle
            ">> Injecting 'Ghost Protocol' virus. Payload delivery 20%...",
            ">> Trace detected! Level increased to 10%!",
            ">> Data extraction in progress. 50% complete...", // Now triggers puzzle
            ">> Firewall attempting counter-measure. Re-routing packets...",
            ">> Trace level critical: 40%! Speed up!",
            ">> Transaction logs acquiring... 80% complete...",
            ">> Finalizing data wipe and log deletion...",
            ">> BREACH COMPLETE. Returning to Sanctuary.",
        ];

        hackInterval = setInterval(() => {
            if (hackProgress < 100) {
                // Progress only advances if no puzzle is active
                if (!puzzleActive) {
                    hackProgress += Math.random() * 1.5 + 0.5; // Slower, more controlled progress
                }
                // Apply ICE Breaker upgrade if purchased
                const traceIncreaseRate = purchasedUpgrades.iceBreaker ? 0.7 : 1.0; // 30% reduction
                traceLevel += (Math.random() * 0.8 + 0.1) * traceIncreaseRate;
                hackProgress = Math.min(hackProgress, 100);
                traceLevel = Math.min(traceLevel, 100);

                hackProgressBar.style.width = `${hackProgress}%`;
                traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;

                // Add messages at certain progress points
                if (step < messages.length && hackProgress >= (step * (100 / messages.length))) {
                    // Only display messages if not involved in a puzzle, except critical warnings
                    if (!puzzleActive || messages[step].includes('Trace detected') || messages[step].includes('CRITICAL')) {
                        addConsoleMessage(hackingConsole, 'HACK', messages[step], messages[step].includes('WARNING') || messages[step].includes('CRITICAL') ? 'text-[#EF4444]' : (step % 2 === 0 ? 'text-[#FFC107]' : 'text-[#00FF99]'));
                    }
                    step++;
                }

                if (traceLevel >= 70 && !hackingConsole.innerHTML.includes('Evasive maneuvers!')) {
                    addConsoleMessage(hackingConsole, 'CRITICAL', 'EVASIVE MANEUVERS! NEXUS AI IS CLOSING IN!', 'text-[#EF4444]');
                    statusIndicator.classList.add('glitch-text');
                    showMessage('HIGH TRACE DETECTED!', 'Cerberus AI is actively tracking your position. Complete your objectives quickly!', true);
                }
                if (traceLevel >= 90 && !hackingConsole.innerHTML.includes('IMMEDIATE ABORT RECOMMENDED')) {
                     addConsoleMessage(hackingConsole, 'CRITICAL', 'CRITICAL TRACE LEVEL! IMMEDIATE ABORT RECOMMENDED!', 'text-[#EF4444]');
                     showMessage('CRITICAL TRACE!', 'Your position is almost compromised. Abort immediately or risk full exposure!', true);
                }


            } else {
                clearInterval(hackInterval);
                if (firewallBypassed && dataExtracted) {
                    addConsoleMessage(hackingConsole, 'SYSTEM', 'Mission success! Data extracted. Logs wiped. Returning to Sanctuary.', 'text-[#00FF99]');
                    
                    let baseReward = 200;
                    // Apply Credit Scrubber upgrade if purchased
                    if (purchasedUpgrades.creditScrubber) {
                        baseReward *= 1.5; // 50% increase
                    }
                    const totalReward = Math.floor(baseReward + hackScore);
                    credits += totalReward;
                    addConsoleMessage(hackingConsole, 'SYSTEM', `Credits awarded: C ${totalReward}!`, 'text-[#FFC107]');
                    showMessage('MISSION COMPLETE!', `Financial Hub breached. Gained C ${totalReward}.`, false);
                } else {
                     addConsoleMessage(hackingConsole, 'SYSTEM', 'Mission failed: Objectives not met. Returning to Sanctuary.', 'text-[#EF4444]');
                     addConsoleMessage(hackingConsole, 'SYSTEM', `Penalty: -C 150 and increased Trace.`, 'text-[#EF4444]');
                     credits = Math.max(0, credits - 150);
                     showMessage('MISSION FAILED!', 'Objectives not met. Nexus defenses too strong. Penalty applied.', true);
                }
                updateCreditsUI();
                traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;
                statusIndicator.classList.remove('glitch-text');
                setTimeout(() => {
                    showView('sanctuary'); // Go back to sanctuary after hack
                    statusIndicator.textContent = 'ONLINE';
                    statusIndicator.classList.remove('text-[#EF4444]');
                    statusIndicator.classList.add('text-[#00FF99]');
                    addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', `Mission "Breach Financial Hub" ${firewallBypassed && dataExtracted ? 'COMPLETED' : 'FAILED'}.`, firewallBypassed && dataExtracted ? 'text-[#00FF99]' : 'text-[#EF4444]');
                }, 2000); // Short delay before returning
            }
        }, 100); // Update every 100ms
    }

    // Abort hack function
    function abortHack() {
        clearInterval(hackInterval);
        puzzleActive = false; // Stop any active puzzle
        puzzleArea.classList.add('hidden'); // Hide puzzle on abort

        addConsoleMessage(hackingConsole, 'CRITICAL', 'Breach aborted. Minimal data extracted. Trace left behind!', 'text-[#EF4444]');
        addConsoleMessage(hackingConsole, 'SYSTEM', 'Returning to Sanctuary. Penalty: -C 75 and increased Trace Level.', 'text-[#EF4444]');
        credits = Math.max(0, credits - 75); // Ensure credits don't go below 0
        traceLevel = Math.min(100, traceLevel + 25); // Increase trace significantly
        traceLevelIndicator.textContent = `${Math.floor(traceLevel)}%`;
        updateCreditsUI();
        statusIndicator.classList.remove('glitch-text');

        // Re-enable/disable buttons as appropriate for sanctuary return
        bypassFirewallBtn.disabled = false;
        bypassFirewallBtn.classList.remove('btn-disabled');
        extractDataBtn.disabled = true;
        extractDataBtn.classList.add('btn-disabled');

        showMessage('BREACH ABORTED!', 'You retreated from the breach. Minor losses, but the mission failed.', true);

        setTimeout(() => {
            showView('sanctuary');
            statusIndicator.textContent = 'ONLINE';
            statusIndicator.classList.remove('text-[#EF4444]');
            statusIndicator.classList.add('text-[#00FF99]');
            addConsoleMessage(document.getElementById('activity-feed'), 'SYSTEM', 'Mission aborted. Re-evaluate strategy.', 'text-[#EF4444]');
        }, 2000);
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



    // --- Event Listeners ---

    // Event listener for Start Hack button
    startHackButton.addEventListener('click', () => {
        showView('hacking');
        startHackSimulation();
    });

    // Event listener for Abort Hack button
    abortHackBtn.addEventListener('click', abortHack);

    // Event listeners for new interactive elements
    bypassFirewallBtn.addEventListener('click', () => {
        if (!firewallBypassed && !puzzleActive) { // Only activate if not bypassed and no puzzle active
            activatePuzzle("Bypass Firewall: Input sequence to decrypt shield!");
        } else if (firewallBypassed) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Firewall already bypassed.', 'text-gray-500');
            showMessage('Info', 'Firewall already bypassed.', false);
        }
    });

    extractDataBtn.addEventListener('click', () => {
        if (firewallBypassed && !dataExtracted && !puzzleActive) { // Only activate if firewall bypassed, not extracted, and no puzzle active
            activatePuzzle("Data Extraction: Verify checksum sequence!");
        } else if (!firewallBypassed) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Bypass firewall first!', 'text-[#EF4444]');
            showMessage('Error', 'Bypass firewall first!', true);
        } else if (dataExtracted) {
            addConsoleMessage(hackingConsole, 'SYSTEM', 'Data already extracted!', 'text-gray-500');
            showMessage('Info', 'Data already extracted!', false);
        }
    });

    // Event listener for upgrade purchases
    upgradesGrid.addEventListener('click', handleUpgradePurchase);


    // Initialize view to Sanctuary on load
    showView('sanctuary');
    updateCreditsUI();
    initializeUpgradesUI();
});