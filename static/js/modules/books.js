import { ui } from './ui.js';
import { loadingMessages } from './constants.js';

// Book management related functions
export const books = {
    async searchBooks(query) {
        try {
            // Show loading state with random message
            const loadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = `
                <div class="search-loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${loadingMessage}</p>
                </div>
            `;
            
            // Hide search button during search
            const searchButton = document.getElementById('search-button');
            searchButton.style.display = 'none';
            
            const response = await fetch('/api/search-books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ query })
            });
            
            const data = await response.json();
            console.log('Search response:', data);
            
            this.currentSearchResults = Array.isArray(data) ? data : []; // Store the results
            resultsContainer.innerHTML = this.currentSearchResults.length ? '' : '<p>No books found</p>';
            
            this.currentSearchResults.forEach(book => {
                const bookElement = this.createBookElement(book);
                resultsContainer.appendChild(bookElement);
            });
        } catch (error) {
            console.error('Book search failed:', error);
            ui.showError('Failed to search books');
        } finally {
            // Show search button again after search completes
            const searchButton = document.getElementById('search-button');
            searchButton.style.display = 'block';
        }
    },

    createBookElement(book) {
        const div = document.createElement('div');
        div.className = 'book-result';
        div.innerHTML = `
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="author">by ${book.author}</p>
                ${book.description ? `<p class="description">${book.description}</p>` : ''}
            </div>
            <div class="book-actions">
                <button onclick="books.addToReadingList('${book.isbn}')" class="action-button small">
                    Add to Reading List
                </button>
            </div>
        `;
        return div;
    },

    async addToReadingList(isbn) {
        if (!isbn) {
            ui.showError('Invalid book selection');
            return;
        }

        try {
            const book = this.currentSearchResults.find(b => b.isbn === isbn);
            const response = await fetch('/api/add-to-reading-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    book_isbn: isbn,
                    book_title: book?.title,
                    book_author: book?.author
                })
            });

            const data = await response.json();
            if (response.ok) {
                // Clear search results and input
                document.getElementById('search-results').innerHTML = '';
                document.getElementById('book-search').value = '';
                document.getElementById('search-button').style.display = 'block';
                
                ui.showSuccess('Book added to reading list');
                
                // Update the book select and set it to the newly added book
                await this.updateReadingListSelect(isbn);
            } else {
                throw new Error(data.message || 'Failed to add book');
            }
        } catch (error) {
            console.error('Failed to add book:', error);
            ui.showError(error.message || 'Failed to add book to reading list');
        }
    },

    async updateReadingListSelect(selectedIsbn = null) {
        try {
            const response = await fetch('/api/get-reading-list', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Books response:', data);
            
            const books = Array.isArray(data) ? data : [];
            const select = document.getElementById('book-select');
            select.innerHTML = '<option value="">Select a book</option>';
            
            books.forEach(book => {
                const option = document.createElement('option');
                option.value = book.isbn;
                option.textContent = `${book.title} by ${book.author}`;
                select.appendChild(option);
            });

            // If a selectedIsbn is provided, set it as the selected option
            if (selectedIsbn) {
                select.value = selectedIsbn;
            }
        } catch (error) {
            console.error('Failed to update book list:', error);
            ui.showError('Failed to load reading list');
        }
    },

    async getBookDetails(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}`, {
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to get book details:', error);
            ui.showError('Failed to load book details');
            return null;
        }
    },

    // Add this property to store search results
    currentSearchResults: [],

    // Add this new method to handle goal creation
    async createGoal(event) {
        event.preventDefault();
        
        const form = document.getElementById('set-goal-form');
        const bookSelect = document.getElementById('book-select');
        const goalQuantity = document.getElementById('goal-quantity');
        const goalType = document.getElementById('goal-type');
        
        // Debug log to see what we're sending
        const goalData = {
            book_isbn: bookSelect.value,
            goal_quantity: parseInt(goalQuantity.value),
            goal_type: goalType.value
        };
        console.log('Creating goal with data:', goalData);
        
        try {
            const response = await fetch('/api/set-reading-goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(goalData)
            });
            
            const data = await response.json();
            console.log('Goal creation response:', data); // Debug log for response
            
            if (response.ok) {
                ui.showSuccess('Reading goal created successfully! 📚');
                form.reset();
                document.querySelector('a[href="#today-goals"]').click();
            } else {
                throw new Error(data.error || 'Failed to create goal');
            }
        } catch (error) {
            console.error('Failed to create goal:', error);
            ui.showError(error.message || 'Failed to create reading goal');
        }
    }
}; 