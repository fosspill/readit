import { ui } from './ui.js';

// Reading goals related functions
export const goals = {
    currentGoals: [],
    updateTimeout: null,
    pendingUpdates: new Map(),

    async loadTodayGoals() {
        try {
            const response = await fetch('/api/get-daily-goals', {
                credentials: 'include'
            });
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
                        <div class="progress-bar-container" data-goal-id="${goal.id}" data-goal-quantity="${goal.goal_quantity}">
                            <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                            <div class="progress-bar-overlay"></div>
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
            
            this.initializeProgressBars();
            
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
            const response = await fetch('/api/set-reading-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    book_isbn: form.querySelector('#book-select').value,
                    goal_quantity: form.querySelector('#goal-quantity').value,
                    goal_type: form.querySelector('#goal-type').value
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create goal');
            }

            await this.loadTodayGoals();
            ui.showSuccess('Goal created successfully');
            form.reset();
            
            // Use ui.showSection to properly switch sections
            ui.showSection('today-goals');
            
        } catch (error) {
            console.error('Failed to create goal:', error);
            ui.showError(error.message || 'Failed to create goal');
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
    },

    updateVisualProgress(goalId, newProgress) {
        const container = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (!container) return;
        
        const goal = this.currentGoals.find(g => g.id === goalId);
        if (!goal) return;

        const progressBar = container.querySelector('.progress-bar');
        const progressCount = container.closest('.goal-progress').querySelector('.progress-count');
        const percentage = Math.min((newProgress / goal.goal_quantity) * 100, 100);
        
        progressBar.style.width = `${percentage}%`;
        progressCount.textContent = `${newProgress} / ${goal.goal_quantity}`;
    },

    initializeProgressBars() {
        document.querySelectorAll('.progress-bar-container').forEach(container => {
            let isDragging = false;

            // Handle click events (keep existing code)
            container.addEventListener('click', (e) => {
                if (isDragging) return; // Prevent click when dragging ends
                
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.min(Math.max(x / rect.width, 0), 1);
                const goalId = parseInt(container.dataset.goalId);
                const goalQuantity = parseInt(container.dataset.goalQuantity);
                const newProgress = Math.round(percentage * goalQuantity);

                // Update visual immediately
                this.updateVisualProgress(goalId, newProgress);

                // Clear any pending timeout
                if (this.updateTimeout) {
                    clearTimeout(this.updateTimeout);
                }

                // Store the pending update
                this.pendingUpdates.set(goalId, newProgress);

                // Debounce the API call
                this.updateTimeout = setTimeout(() => {
                    this.pendingUpdates.forEach((progress, id) => {
                        this.updateProgress(id, progress, true);
                    });
                    this.pendingUpdates.clear();
                }, 500);
            });

            // Mouse drag events
            container.addEventListener('mousedown', () => {
                isDragging = true;
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                const rect = container.getBoundingClientRect();
                const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
                const percentage = x / rect.width;
                const goalId = parseInt(container.dataset.goalId);
                const goalQuantity = parseInt(container.dataset.goalQuantity);
                const newProgress = Math.round(percentage * goalQuantity);

                this.updateVisualProgress(goalId, newProgress);
                this.pendingUpdates.set(goalId, newProgress);
            });

            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;

                // Send update after drag ends
                if (this.updateTimeout) {
                    clearTimeout(this.updateTimeout);
                }

                this.updateTimeout = setTimeout(() => {
                    this.pendingUpdates.forEach((progress, id) => {
                        this.updateProgress(id, progress, true);
                    });
                    this.pendingUpdates.clear();
                }, 500);
            });

            // Touch events
            container.addEventListener('touchstart', (e) => {
                isDragging = true;
                e.preventDefault(); // Prevent scrolling while dragging
            });

            container.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                const touch = e.touches[0];
                const rect = container.getBoundingClientRect();
                const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
                const percentage = x / rect.width;
                const goalId = parseInt(container.dataset.goalId);
                const goalQuantity = parseInt(container.dataset.goalQuantity);
                const newProgress = Math.round(percentage * goalQuantity);

                this.updateVisualProgress(goalId, newProgress);
                this.pendingUpdates.set(goalId, newProgress);
            });

            container.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;

                // Send update after touch ends
                if (this.updateTimeout) {
                    clearTimeout(this.updateTimeout);
                }

                this.updateTimeout = setTimeout(() => {
                    this.pendingUpdates.forEach((progress, id) => {
                        this.updateProgress(id, progress, true);
                    });
                    this.pendingUpdates.clear();
                }, 500);
            });
        });
    },

    showQuickEdit(goalId, currentProgress, goalQuantity) {
        const progressElement = document.querySelector(`[data-goal-id="${goalId}"]`)
            .closest('.goal-progress')
            .querySelector('.progress-number');
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentProgress;
        input.min = 0;
        input.max = goalQuantity;
        input.className = 'quick-edit-input';
        
        const saveEdit = () => {
            const newValue = parseInt(input.value);
            if (!isNaN(newValue) && newValue >= 0 && newValue <= goalQuantity) {
                this.updateProgress(goalId, newValue, true);
            }
            progressElement.textContent = currentProgress;
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                progressElement.textContent = currentProgress;
            }
        });

        progressElement.textContent = '';
        progressElement.appendChild(input);
        input.select();
    }
}; 