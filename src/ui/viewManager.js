// src/ui/viewManager.js

let elements = {};
let gameState = {};
let puzzleManager = {};
let dependencies = {};

export const viewManager = {
    init(deps) {
        elements = deps.elements;
        gameState = deps.gameState;
        puzzleManager = deps.puzzleManager;
        dependencies = deps; // To access showMessage, addConsoleMessage

        this.setupEventListeners();
    },

    setupEventListeners() {
        elements.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const viewId = tab.dataset.view;
                this.show(viewId);
            });
        });
    },

    show(viewId) {
        // Prevent switching views if hacking modal is active
        if (elements.hackingViewModal && elements.hackingViewModal.classList.contains('modal-show')) {
            dependencies.addConsoleMessage(elements.hackingConsole, 'SYSTEM', 'Cannot switch views during active breach. Complete or Abort current operation.', 'text-[#EF4444]');
            dependencies.showMessage('Access Denied', 'Complete or Abort current operation before switching views.', true);
            return;
        }

        elements.viewContents.forEach(view => view.classList.add('hidden'));
        const targetContentView = document.getElementById(`view-${viewId}`);
        if (targetContentView) {
            targetContentView.classList.remove('hidden');
        }

        if (viewId === 'login') {
            elements.mainNavTabs.classList.add('hidden');
            elements.gameHeader.classList.add('hidden');
            elements.agentNameInput.focus();
        } else {
            elements.mainNavTabs.classList.remove('hidden');
            elements.gameHeader.classList.remove('hidden');
            elements.navTabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`nav-${viewId}`)?.classList.add('active');
        }
        gameState.currentView = viewId;
    },
};
