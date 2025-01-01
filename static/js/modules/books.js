import { ui } from './ui.js';
import { loadingMessages } from './constants.js';

// Book management related functions
export const books = {
    currentSearchResults: [],

    async loadReadingList() {
        try {
            const response = await fetch('/api/get-reading-list', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Reading list response:', data);
            
            // Update reading list display if container exists
            const container = document.getElementById('reading-list');
            if (container) {
                if (!Array.isArray(data) || data.length === 0) {
                    container.innerHTML = '<p class="no-books">Your reading list is empty</p>';
                } else {
                    container.innerHTML = data.map(book => `
                        <div class="book-item">
                            <h4>${book.title}</h4>
                            <p class="book-author">by ${book.author}</p>
                            <div class="book-actions">
                                <button onclick="books.setGoal('${book.isbn}')" class="action-button small">Set Goal</button>
                                <button onclick="books.markRead('${book.isbn}')" class="action-button small secondary">Mark Read</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
            
            // Always update book select options if it exists
            const bookSelect = document.getElementById('book-select');
            if (bookSelect) {
                // Clear existing options except the default one
                while (bookSelect.options.length > 1) {
                    bookSelect.remove(1);
                }
                
                // Add books from reading list
                if (Array.isArray(data)) {
                    data.forEach(book => {
                        const option = document.createElement('option');
                        option.value = book.isbn;
                        option.textContent = `${book.title} by ${book.author}`;
                        bookSelect.appendChild(option);
                    });
                }
            }
            
        } catch (error) {
            console.error('Failed to load reading list:', error);
            ui.showError('Failed to load reading list');
        }
    },

    async searchBooks(query) {
        try {
            const searchButton = document.getElementById('search-button');
            const originalText = searchButton.dataset.originalText;
            searchButton.textContent = '...';
            searchButton.disabled = true;
            
            // Show loading state with spinner
            const resultsContainer = document.getElementById('search-results');
            const randomQuote = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
            resultsContainer.innerHTML = `
                <div class="search-loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${randomQuote}</p>
                </div>
            `;
            
            const response = await fetch('/api/search-books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query })
            });
            
            const data = await response.json();
            this.currentSearchResults = data;
            
            // Reset button state
            searchButton.textContent = originalText;
            searchButton.disabled = false;
            
            if (!Array.isArray(data) || data.length === 0) {
                resultsContainer.innerHTML = '<p class="no-results">No books found</p>';
                return;
            }
            
            resultsContainer.innerHTML = data.map(book => `
                <div class="book-result">
                    <h4>${book.title}</h4>
                    <p class="book-author">by ${book.author}</p>
                    <button onclick="books.addToReadingList('${book.isbn}')" class="action-button small">Add to List</button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Search failed:', error);
            ui.showError('Book search failed');
            // Reset button state on error
            const searchButton = document.getElementById('search-button');
            searchButton.textContent = searchButton.dataset.originalText;
            searchButton.disabled = false;
        }
    },

    async addToReadingList(isbn, title, author) {
        try {
            let book;
            if (title && author) {
                book = { isbn, title, author };
            } else {
                book = this.currentSearchResults.find(b => b.isbn === isbn);
                if (!book) {
                    throw new Error('Book not found in search results');
                }
            }
            
            const response = await fetch('/api/add-to-reading-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    book_isbn: isbn,
                    book_title: book.title,
                    book_author: book.author
                })
            });
            
            if (response.ok) {
                // Clear search results and search input if they exist
                const searchResults = document.getElementById('search-results');
                const searchInput = document.getElementById('book-search');
                if (searchResults) searchResults.innerHTML = '';
                if (searchInput) searchInput.value = '';
                
                // Update book select options in the goal form
                const bookSelect = document.getElementById('book-select');
                if (bookSelect) {
                    const option = document.createElement('option');
                    option.value = isbn;
                    option.textContent = `${book.title} by ${book.author}`;
                    bookSelect.appendChild(option);
                }
                
                // Show success message and refresh reading list
                ui.showSuccess('Book added to reading list');
                await this.loadReadingList();
                
                // Reset search button if it exists
                const searchButton = document.getElementById('search-button');
                if (searchButton) {
                    searchButton.textContent = searchButton.dataset.originalText;
                    searchButton.disabled = false;
                }
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to add book to reading list');
            }
        } catch (error) {
            console.error('Failed to add book:', error);
            ui.showError(error.message);
        }
    },

    async setGoal(isbn) {
        const book = this.currentSearchResults.find(b => b.isbn === isbn);
        if (!book) return;
        
        // Show goal creation modal
        const modal = document.getElementById('create-goal-modal');
        const form = modal.querySelector('form');
        form.dataset.bookIsbn = isbn;
        form.querySelector('.book-title').textContent = book.title;
        ui.toggleModal('create-goal-modal', true);
    },

    async markRead(isbn) {
        try {
            const response = await fetch('/api/mark-book-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ book_isbn: isbn })
            });
            
            if (response.ok) {
                ui.showSuccess('Book marked as read');
                await this.loadReadingList();
            } else {
                throw new Error('Failed to mark book as read');
            }
        } catch (error) {
            console.error('Failed to mark book as read:', error);
            ui.showError(error.message);
        }
    }
}; 