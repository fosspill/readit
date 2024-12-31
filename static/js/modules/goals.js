import { ui } from './ui.js';

// Reading goals related functions
export const goals = {
    currentGoals: [],

    async loadTodayGoals() {
        try {
            const response = await fetch('/api/get-daily-goals');
            const data = await response.json();
            console.log('Daily goals response:', data);
            
            // Update streak count
            const streakElement = document.getElementById('streak-count');
            if (streakElement) {
                streakElement.textContent = data.streak || 0;
            }
            
            const goalsContainer = document.getElementById('today-goals-list');
            goalsContainer.innerHTML = '';
            
            this.currentGoals = Array.isArray(data.goals) ? data.goals : [];
            
            if (this.currentGoals.length === 0) {
                goalsContainer.innerHTML = '<p class="no-goals">No reading goals set for today</p>';
                return;
            }
            
            this.currentGoals.forEach(goal => {
                const progress = goal.daily_progress || 0;
                const progressPercentage = Math.min((progress / goal.goal_quantity) * 100, 100);
                
                const goalElement = document.createElement('div');
                goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
                goalElement.innerHTML = `
                    <div class="goal-info">
                        <h4>${goal.book_title}</h4>
                        <p class="book-author">by ${goal.book_author || 'Unknown Author'}</p>
                        <p class="goal-target">Daily Goal: ${goal.goal_quantity} ${goal.goal_type}</p>
                    </div>
                    <div class="goal-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="progress-controls">
                            <span class="progress-count">${progress} / ${goal.goal_quantity}</span>
                            <button onclick="goals.updateProgress(${goal.id}, false)" class="progress-button">-</button>
                            <button onclick="goals.updateProgress(${goal.id}, true)" class="progress-button">+</button>
                            <button onclick="goals.completeGoal(${goal.id})" class="complete-button ${goal.completed ? 'completed' : ''}">
                                <span class="checkmark">✓</span>
                            </button>
                        </div>
                    </div>
                `;
                goalsContainer.appendChild(goalElement);
            });
            
        } catch (error) {
            console.error('Failed to load today\'s goals:', error);
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

    async updateProgress(goalId, increment, setAbsolute = false) {
        try {
            const goal = this.currentGoals.find(g => g.id === goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            const response = await fetch('/api/update-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal_id: goalId,
                    increment: increment,
                    set_absolute: setAbsolute
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                await this.loadTodayGoals();
                if (data.goalMet) {
                    ui.showSuccess('Goal completed! 🎉');
                }
            } else {
                throw new Error(data.error || 'Failed to update progress');
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
            ui.showError(error.message || 'Failed to update progress');
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
    },

    async completeGoal(goalId) {
        try {
            const goal = this.currentGoals.find(g => g.id === goalId);
            if (!goal) {
                throw new Error('Goal not found');
            }

            // Set progress to the goal quantity
            await this.updateProgress(goalId, goal.goal_quantity, true);

            // Mark as complete
            const response = await fetch('/api/complete-daily-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal_id: goalId,
                    completed: true
                })
            });
            
            const data = await response.json();
            if (response.ok) {
                await this.loadTodayGoals();
                ui.showSuccess('Goal completed! 🎉');
            } else {
                throw new Error(data.error || 'Failed to complete goal');
            }
        } catch (error) {
            console.error('Failed to complete goal:', error);
            ui.showError(error.message || 'Failed to complete goal');
        }
    }
}; 