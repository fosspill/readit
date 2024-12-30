// Reading goals related functions
export const goals = {
    async loadTodaysGoals() {
        try {
            const response = await fetch('/api/goals/today');
            const goals = await response.json();
            
            const goalsContainer = document.getElementById('today-goals-list');
            goalsContainer.innerHTML = goals.length ? '' : '<p>No goals set for today</p>';
            
            goals.forEach(goal => {
                const goalElement = this.createGoalElement(goal);
                goalsContainer.appendChild(goalElement);
            });
        } catch (error) {
            console.error('Failed to load goals:', error);
            ui.showError('Failed to load today\'s goals');
        }
    },

    createGoalElement(goal) {
        const div = document.createElement('div');
        div.className = 'goal-item';
        div.innerHTML = `
            <h3>${goal.bookTitle}</h3>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${(goal.currentPages / goal.targetPages) * 100}%"></div>
            </div>
            <p>${goal.currentPages} / ${goal.targetPages} pages</p>
            <button class="update-progress" data-goal-id="${goal.id}">
                Update Progress
            </button>
        `;

        div.querySelector('.update-progress').addEventListener('click', 
            () => this.showUpdateProgressModal(goal.id));

        return div;
    },

    async updateProgress(goalId, pagesRead) {
        try {
            const response = await fetch(`/api/goals/${goalId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pagesRead })
            });

            if (!response.ok) throw new Error('Failed to update progress');
            
            await this.loadTodaysGoals();
            ui.showSuccess('Progress updated successfully');
        } catch (error) {
            console.error('Failed to update progress:', error);
            ui.showError('Failed to update progress');
        }
    },

    showUpdateProgressModal(goalId) {
        const modal = document.getElementById('update-progress-modal');
        modal.querySelector('form').dataset.goalId = goalId;
        ui.toggleModal('update-progress-modal', true);
    },

    async createGoal(event) {
        event.preventDefault();
        const form = event.target;
        
        try {
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: form.querySelector('#book-select').value,
                    targetPages: form.querySelector('#target-pages').value,
                    deadline: form.querySelector('#deadline').value
                })
            });

            if (!response.ok) throw new Error('Failed to create goal');

            ui.clearForm('create-goal-form');
            ui.toggleModal('create-goal-modal', false);
            await this.loadTodaysGoals();
            ui.showSuccess('Goal created successfully');
        } catch (error) {
            console.error('Failed to create goal:', error);
            ui.showError('Failed to create goal');
        }
    }
}; 