// Book management related functions
export const books = {
    async searchBooks(query) {
        try {
            ui.setLoading('search-button', true);
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
            const books = await response.json();
            
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = books.length ? '' : '<p>No books found</p>';
            
            books.forEach(book => {
                const bookElement = this.createBookElement(book);
                resultsContainer.appendChild(bookElement);
            });
        } catch (error) {
            console.error('Book search failed:', error);
            ui.showError('Failed to search books');
        } finally {
            ui.setLoading('search-button', false);
        }
    },

    createBookElement(book) {
        const div = document.createElement('div');
        div.className = 'book-item';
        div.innerHTML = `
            <img src="${book.coverUrl}" alt="${book.title} cover">
            <div class="book-details">
                <h3>${book.title}</h3>
                <p>By ${book.author}</p>
                <p>${book.pageCount} pages</p>
                <button class="add-to-list" data-isbn="${book.isbn}">
                    Add to Reading List
                </button>
            </div>
        `;

        div.querySelector('.add-to-list').addEventListener('click', 
            () => this.addToReadingList(book));

        return div;
    },

    async addToReadingList(book) {
        try {
            const response = await fetch('/api/reading-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isbn: book.isbn,
                    title: book.title,
                    author: book.author,
                    pageCount: book.pageCount
                })
            });

            if (!response.ok) throw new Error('Failed to add book');
            
            await this.updateReadingListSelect();
            ui.showSuccess('Book added to reading list');
        } catch (error) {
            console.error('Failed to add book:', error);
            ui.showError('Failed to add book to reading list');
        }
    },

    async updateReadingListSelect() {
        try {
            const response = await fetch('/api/reading-list');
            const books = await response.json();
            
            const select = document.getElementById('book-select');
            select.innerHTML = '<option value="">Select a book</option>';
            
            books.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = book.title;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to update book list:', error);
            ui.showError('Failed to load reading list');
        }
    },

    async getBookDetails(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get book details:', error);
            ui.showError('Failed to load book details');
            return null;
        }
    }
}; 