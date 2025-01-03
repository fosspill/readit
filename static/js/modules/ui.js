// UI related functions (toasts, modals, section display)

export const ui = {
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast') || this.createToastElement();
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    createToastElement() {
        const toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
        return toast;
    },

    showError(message) {
        this.showToast(message, 'error');
    },

    showSuccess(message) {
        this.showToast(message, 'success');
    },

    toggleModal(modalId, show = true) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
        
        if (show) {
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn?.addEventListener('click', () => this.toggleModal(modalId, false));
        }
    },

    showSection(sectionId) {
        // First hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Show the requested section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`)?.classList.add('active');
    },

    clearForm(formId) {
        document.getElementById(formId).reset();
        const errorElement = document.getElementById(`${formId}-error`);
        if (errorElement) errorElement.textContent = '';
    },

    setLoading(elementId, isLoading) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.disabled = isLoading;
        element.innerHTML = isLoading ? 
            '<span class="spinner"></span>' : 
            element.getAttribute('data-original-text') || element.innerHTML;
    },

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    },

    showConfirmDialog(title, message, onConfirm) {
        const modalHtml = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="action-button secondary" id="confirm-cancel">Cancel</button>
                    <button class="action-button" id="confirm-ok">OK</button>
                </div>
            </div>
        `;

        const modalElement = document.createElement('div');
        modalElement.className = 'modal';
        modalElement.id = 'confirm-dialog';
        modalElement.innerHTML = modalHtml;
        document.body.appendChild(modalElement);

        const handleConfirm = async () => {
            modalElement.remove();
            await onConfirm();
        };

        modalElement.querySelector('#confirm-ok').addEventListener('click', handleConfirm);
        modalElement.querySelector('#confirm-cancel').addEventListener('click', () => {
            modalElement.remove();
        });

        modalElement.style.display = 'flex';
    }
}; 