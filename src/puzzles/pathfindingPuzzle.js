// src/puzzles/pathfindingPuzzle.js
import { PUZZLE_TYPES } from './puzzleConstants.js';

let pathfindingPuzzleArea, pathfindingGrid, puzzleFeedback, resetPuzzleBtn;
let playerPath = [];
let pathfindingEndNode = null;
let onCompleteCallback;

export const pathfindingPuzzle = {
    init(elements, callbacks) {
        pathfindingPuzzleArea = elements.pathfindingPuzzleArea;
        pathfindingGrid = elements.pathfindingGrid;
        puzzleFeedback = elements.puzzleFeedback;
        resetPuzzleBtn = elements.resetPuzzleBtn;
        onCompleteCallback = callbacks.onPuzzleComplete;
    },

    activate(node, isBossFight, currentBossStageIndex) {
        pathfindingPuzzleArea.classList.remove('hidden');
        pathfindingGrid.innerHTML = '';
        playerPath = [];

        const rows = 5;
        const cols = 7;
        const grid = Array(rows).fill(null).map(() => Array(cols).fill(0));

        // Set start and end
        const start = { r: Math.floor(Math.random() * rows), c: 0 };
        let end = { r: Math.floor(Math.random() * rows), c: cols - 1 };
        while (start.r === end.r) {
            end = { r: Math.floor(Math.random() * rows), c: cols - 1 };
        }
        grid[start.r][start.c] = 'S';
        grid[end.r][end.c] = 'E';
        pathfindingEndNode = end;
        playerPath.push(start);

        // Add obstacles
        for (let i = 0; i < 7; i++) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * (cols - 2)) + 1;
            if (grid[r][c] === 0) grid[r][c] = 'X';
        }

        // Render grid
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const nodeDiv = document.createElement('div');
                nodeDiv.classList.add('path-node');
                nodeDiv.dataset.r = r;
                nodeDiv.dataset.c = c;
                if (grid[r][c] === 'S') nodeDiv.classList.add('start', 'active');
                if (grid[r][c] === 'E') nodeDiv.classList.add('end');
                if (grid[r][c] === 'X') nodeDiv.classList.add('obstacle');
                pathfindingGrid.appendChild(nodeDiv);
            }
        }
        pathfindingGrid.addEventListener('click', handlePathfindingClick);
    },

    reset() {
        pathfindingPuzzleArea.classList.add('hidden');
        pathfindingGrid.removeEventListener('click', handlePathfindingClick);
        playerPath = [];
        pathfindingEndNode = null;
    }
};

function handlePathfindingClick(event) {
    const nodeDiv = event.target;
    if (!nodeDiv.classList.contains('path-node') || nodeDiv.classList.contains('obstacle') || nodeDiv.classList.contains('active')) return;

    const r = parseInt(nodeDiv.dataset.r);
    const c = parseInt(nodeDiv.dataset.c);
    const lastNode = playerPath[playerPath.length - 1];

    // Check for adjacency
    const isAdjacent = Math.abs(r - lastNode.r) + Math.abs(c - lastNode.c) === 1;
    if (isAdjacent) {
        playerPath.push({ r, c });
        nodeDiv.classList.add('active');

        if (r === pathfindingEndNode.r && c === pathfindingEndNode.c) {
            pathfindingGrid.removeEventListener('click', handlePathfindingClick);
            onCompleteCallback(true, PUZZLE_TYPES.PATHFINDING);
        }
    }
}
