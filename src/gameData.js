// src/gameData.js
import { PUZZLE_TYPES } from './puzzles/puzzleConstants.js';

export const UPGRADES = {
    iceBreaker: { cost: 400, name: "ICE Breaker Suite" },
    sequenceDecryptor: { cost: 600, name: "Sequence Decryptor" },
    creditScrubber: { cost: 350, name: "Credit Scrubber" }
};

export const NETWORK_NODES = [
    // Story Progression: Surveillance -> Data Archive -> Black Market -> Financial Hub -> Research Lab -> Nexus Core
    { id: 'surveillance-grid', name: 'Surveillance Grid', description: 'Monitors city-wide comms. A weak point in their outer defenses.', difficulty: 'very-easy', baseReward: 50, puzzleTypes: { firewall: PUZZLE_TYPES.SEQUENCE, data: PUZZLE_TYPES.PATHFINDING }, puzzleLength: 3, isLocked: false, isCompleted: false, intelId: 'surveillance-grid' },
    {
        id: 'data-archive', name: 'Data Archive', description: 'Contains historical logs and personnel files. Maybe you can find out who framed you.', difficulty: 'easy', baseReward: 100, puzzleTypes: { firewall: PUZZLE_TYPES.TIMED_INPUT, data: PUZZLE_TYPES.SEQUENCE }, puzzleLength: 4,
        isLocked: true, isCompleted: false, requirements: { nodes: ['surveillance-grid'] }, intelId: 'data-archive'
    },
    {
        id: 'black-market-server', name: 'Black Market Server', description: 'Untraceable transactions. A good place to find out who paid to have your identity erased.', difficulty: 'easy', baseReward: 120, puzzleTypes: { firewall: PUZZLE_TYPES.PATHFINDING, data: PUZZLE_TYPES.TIMED_INPUT }, puzzleLength: 4,
        isLocked: true, isCompleted: false, requirements: { nodes: ['surveillance-grid'] }, intelId: 'black-market-server'
    },
    {
        id: 'financial-hub', name: 'Financial Hub', description: 'Primary credit exchange. Follow the money to uncover the real conspiracy.', difficulty: 'medium', baseReward: 200, puzzleTypes: { firewall: PUZZLE_TYPES.SEQUENCE, data: PUZZLE_TYPES.PATHFINDING }, puzzleLength: 6,
        isLocked: true, isCompleted: false, requirements: { nodes: ['data-archive', 'black-market-server'] }, intelId: 'financial-hub'
    },
    {
        id: 'research-lab', name: 'Research Lab', description: 'Prototype tech and schematics. What are they building in secret?', difficulty: 'medium', baseReward: 250, puzzleTypes: { firewall: PUZZLE_TYPES.TIMED_INPUT, data: PUZZLE_TYPES.SEQUENCE }, puzzleLength: 6,
        isLocked: true, isCompleted: false, requirements: { nodes: ['financial-hub'] }, intelId: 'research-lab'
    },
    {
        id: 'nexus-core',
        name: 'Nexus Core',
        description: 'Central AI processing. The heart of the beast. Time to expose the truth.',
        difficulty: 'hard',
        baseReward: 1000, // Higher reward for boss
        isLocked: true, isCompleted: false,
        isBoss: true, // Mark as boss node
        requirements: { nodes: ['data-archive', 'financial-hub', 'research-lab'] }, // Intel required to unlock
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

export const INTEL_LOGS = {
    'surveillance-grid': { title: 'Initial Access Vector', content: 'Gained initial access through a poorly secured municipal surveillance grid. The path is open to more sensitive parts of the network.' },
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
