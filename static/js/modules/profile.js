export const profile = {
    async loadProfile() {
        try {
            const response = await fetch('/api/get-profile', {
                credentials: 'include'
            });
            const data = await response.json();
            
            this.renderGoals(data.goals);
            this.renderBooks(data.books);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    },

    renderGoals(goals) {
        const container = document.getElementById('profile-goals-list');
        if (!goals.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📖 No reading goals yet. Why not set one?</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => `
            <div class="goal-card ${goal.archived ? 'completed' : ''}">
                <div class="goal-info">
                    <h4>${goal.book_title}</h4>
                    <p>${goal.goal_quantity} ${goal.goal_type} per day</p>
                    ${goal.archived ? '<span class="completion-badge">✨ Completed!</span>' : ''}
                </div>
                <div class="goal-actions">
                    <button onclick="profile.toggleGoalArchive(${goal.id}, ${!goal.archived})" 
                            class="action-button small ${goal.archived ? 'secondary' : 'primary'}">
                        ${goal.archived ? '↺ Resume' : '✓ Complete'}
                    </button>
                    <button onclick="profile.deleteGoal(${goal.id})" 
                            class="action-button small danger">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderBooks(books) {
        const container = document.getElementById('profile-books-list');
        if (!books.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📚 Your bookshelf is empty. Time to add some books!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = books.map(book => {
            console.log('Book data:', book);
            const isCompleted = Boolean(book.completed_date);
            return `
                <div class="book-card ${isCompleted ? 'completed' : ''}">
                    <div class="book-info">
                        <h4>${book.title}</h4>
                        <p>by ${book.author}</p>
                        ${isCompleted ? '<span class="completion-badge">✨ Read!</span>' : ''}
                    </div>
                    <div class="book-actions">
                        <button onclick="profile.toggleBookRead('${book.isbn}', ${!isCompleted})" 
                                class="action-button small ${isCompleted ? 'secondary' : 'primary'}">
                            ${isCompleted ? '↺ Undo' : '📖 Mark as Read'}
                        </button>
                        <button onclick="profile.deleteBook('${book.isbn}')" 
                                class="action-button small danger">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    async toggleBookRead(isbn, markAsRead) {
        try {
            console.log('Toggling book read status:', { isbn, markAsRead });
            const response = await fetch('/api/mark-book-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    isbn,
                    is_read: markAsRead
                })
            });
            
            if (response.ok) {
                ui.showSuccess(markAsRead ? '✨ Book marked as read!' : 'Book marked as unread');
                await this.loadProfile();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update book status');
            }
        } catch (error) {
            console.error('Failed to mark book as read:', error);
            ui.showError('Failed to update book status');
        }
    },

    async toggleGoalArchive(goalId, archive) {
        try {
            const response = await fetch('/api/archive-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    goal_id: goalId,
                    archive: archive
                })
            });
            
            if (response.ok) {
                ui.showSuccess(archive ? '✨ Goal completed!' : 'Goal resumed');
                this.loadProfile();
            }
        } catch (error) {
            console.error('Failed to archive goal:', error);
            ui.showError('Failed to update goal status');
        }
    },

    async deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        
        try {
            const response = await fetch('/api/delete-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ goal_id: goalId })
            });
            
            if (response.ok) {
                this.loadProfile();
            }
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    },

    async deleteBook(isbn) {
        if (!confirm('Are you sure you want to remove this book?')) return;
        
        try {
            const response = await fetch('/api/delete-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isbn })
            });
            
            if (response.ok) {
                this.loadProfile();
            }
        } catch (error) {
            console.error('Failed to delete book:', error);
        }
    }
}; 