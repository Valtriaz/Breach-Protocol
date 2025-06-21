// src/ui/modalManager.js

let elements = {};

export const modalManager = {
    init(dependencies) {
        elements = dependencies.elements;
    },

    showMessage(title, message, isError = false, isConfirm = false, onConfirm = () => {}) {
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
        elements.modalTitle.style.color = isError ? '#EF4444' : '#00F0FF';

        const modalButtons = document.getElementById('modal-buttons');
        modalButtons.innerHTML = ''; // Clear previous buttons

        const hideModal = () => elements.messageModal.classList.remove('modal-show');

        if (isConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'CONFIRM';
            confirmBtn.className = isError ? 'btn btn-red' : 'btn btn-green';
            confirmBtn.addEventListener('click', () => {
                onConfirm();
                hideModal();
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'CANCEL';
            cancelBtn.className = 'btn';
            cancelBtn.addEventListener('click', hideModal);

            modalButtons.appendChild(confirmBtn);
            modalButtons.appendChild(cancelBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.className = 'btn';
            okBtn.addEventListener('click', hideModal);
            modalButtons.appendChild(okBtn);
        }

        elements.messageModal.classList.add('modal-show');
    },

    showGameOver() {
        elements.gameOverModal.classList.add('modal-show');
        document.querySelectorAll('.nav-tab, .btn').forEach(el => el.disabled = true);
    },

    showGameComplete() {
        elements.gameCompleteModal.classList.add('modal-show');
        document.querySelectorAll('.nav-tab, .btn').forEach(el => el.disabled = true);
    },
};
