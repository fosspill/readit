import { ui } from './ui.js';
import { books } from './books.js';

// Social features (clubs, friends) related functions
export const social = {
    async loadClubs() {
        try {
            const response = await fetch('/api/get-clubs', {
                credentials: 'include'
            });
            const data = await response.json();
            
            const clubs = Array.isArray(data) ? data : [];
            const clubsContainer = document.getElementById('book-clubs');
            
            if (!clubs.length) {
                clubsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No book clubs found. Create one or join using a club code!</p>
                    </div>`;
                return;
            }
            
            clubsContainer.innerHTML = '';
            const clubsGrid = document.createElement('div');
            clubsGrid.className = 'social-grid';
            
            clubs.forEach(club => {
                console.log('Club data:', {
                    id: club.id,
                    name: club.name,
                    current_book_isbn: club.current_book_isbn,
                    book_title: club.book_title
                });
                
                // Ensure book_title is set if there's a current_book_isbn
                if (club.current_book_isbn && !club.book_title) {
                    console.log('Fetching book details for club:', club.id);
                    club.book_title = 'Loading book...';
                    // Fetch book details if needed
                    fetch(`/api/get-book/${club.current_book_isbn}`, { credentials: 'include' })
                        .then(r => r.json())
                        .then(book => {
                            console.log('Book details received:', book);
                            if (book && book.title) {
                                club.book_title = book.title;
                                club.book_author = book.author;
                                const clubElement = document.querySelector(`[data-club-id="${club.id}"]`);
                                if (clubElement) {
                                    const bookTitleEl = clubElement.querySelector('.book-title');
                                    if (bookTitleEl) {
                                        bookTitleEl.textContent = `${book.title} by ${book.author}`;c
                                    }
                                }
                            }
                        })
                        .catch(error => console.error('Error fetching book:', error));
                }
                const clubElement = this.createClubElement(club);
                clubElement.dataset.clubId = club.id;
                clubsGrid.appendChild(clubElement);
            });
            
            clubsContainer.appendChild(clubsGrid);
        } catch (error) {
            console.error('Failed to load clubs:', error);
            ui.showError('Failed to load book clubs');
        }
    },

    createClubElement(club) {
        const div = document.createElement('div');
        div.className = 'club-item';
        div.dataset.clubId = club.id;
        
        const addToListButton = club.current_book_isbn && !club.in_my_list ? 
            `<button class="action-button small book-action add-to-list-btn">
                <span class="icon">📚</span> Add to My List
            </button>` : '';
        
        div.innerHTML = `
            <div class="club-info">
                <h4>${club.name}</h4>
                <p>${club.member_count} members</p>
                <p>Currently reading: <span class="book-title">${
                    club.current_book_isbn ? 
                        (club.book_title ? `${club.book_title} by ${club.book_author || 'Unknown Author'}` : 'Loading book...') 
                        : 'No book set'
                }</span></p>
                ${club.readers_count ? `<p>${club.readers_count} members reading this book</p>` : ''}
                ${addToListButton}
                ${club.created_by === club.user_id ? 
                    `<div class="club-code">Club Code: ${club.join_code}</div>` : ''
                }
            </div>
            <div class="club-actions">
                ${club.created_by === club.user_id ? `
                    <button onclick="social.modifyClub(${club.id})" class="action-button small modify-btn">
                        <span class="icon">✏️</span> Modify Club
                    </button>
                    <button onclick="social.deleteClub(${club.id})" class="action-button small delete-btn">
                        <span class="icon">🗑️</span>
                    </button>
                ` : `
                    <button onclick="social.toggleClubMembership({
                        id: ${club.id}, 
                        isMember: true
                    })" class="action-button small leave-btn">
                        <span class="icon">🚪</span> Leave
                    </button>
                `}
            </div>
        `;

        // Add click handler for add to list button
        const addButton = div.querySelector('.add-to-list-btn');
        if (addButton) {
            addButton.addEventListener('click', () => {
                ui.showConfirmDialog(
                    'Add to Reading List',
                    `Would you like to add "${club.book_title}" by ${club.book_author || 'Unknown Author'} to your reading list?`,
                    async () => {
                        await books.addToReadingList(club.current_book_isbn, club.book_title, club.book_author);
                        await books.loadReadingList();
                        await social.loadClubs(); // Refresh clubs to update button state
                    }
                );
            });
        }
        
        return div;
    },

    async toggleClubMembership(club) {
        try {
            const response = await fetch(`/api/leave-club/${club.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to leave club');
            }
            
            await this.loadClubs();
            ui.showSuccess('Successfully left the club');
        } catch (error) {
            console.error('Failed to leave club:', error);
            ui.showError(error.message || 'Failed to leave club');
        }
    },

    async createClub(event) {
        event.preventDefault();
        const form = event.target;
        
        try {
            const name = form.querySelector('#club-name').value.trim();
            if (!name) {
                throw new Error('Club name is required');
            }

            const bookSelect = form.querySelector('#club-current-book');
            const selectedOption = bookSelect.selectedOptions[0];
            const currentBook = {
                isbn: bookSelect.value,
                title: selectedOption.textContent.split(' by ')[0],
                author: selectedOption.textContent.split(' by ')[1]
            };

            const response = await fetch('/api/create-club', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: name,
                    currentBook: currentBook
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create club');
            }

            form.reset();
            ui.hideModals();
            await this.loadClubs();
            ui.showSuccess('Club created successfully');
        } catch (error) {
            console.error('Failed to create club:', error);
            ui.showError(error.message || 'Failed to create club');
        }
    },

    async loadFriends() {
        try {
            const response = await fetch('/api/get-friends', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Friends response:', data); // Debug log
            
            const friends = Array.isArray(data) ? data : [];
            const friendsContainer = document.getElementById('friends-list');
            friendsContainer.innerHTML = friends.length ? '' : '<p>No friends added yet</p>';
            
            friends.forEach(friend => {
                const friendElement = this.createFriendElement(friend);
                friendsContainer.appendChild(friendElement);
            });
        } catch (error) {
            console.error('Failed to load friends:', error);
            ui.showError('Failed to load friends list');
        }
    },

    createFriendElement(friend) {
        const div = document.createElement('div');
        div.className = 'friend-item';
        
        const bookDisplay = friend.currently_reading ? 
            `<p>Reading: <a href="#" class="book-link" data-isbn="${friend.book_isbn}" data-title="${friend.currently_reading}" data-author="${friend.book_author}">
                ${friend.currently_reading}</a> by ${friend.book_author}</p>` :
            '<p>Reading: Nothing right now</p>';
        
        div.innerHTML = `
            <div class="friend-info">
                <h4>${friend.username}</h4>
                ${bookDisplay}
                <p>Reading streak: ${friend.streak || 0} days</p>
            </div>
            <div class="friend-actions">
                <button onclick="social.removeFriend('${friend.id}')" 
                        class="action-button small danger">
                    Remove Friend
                </button>
            </div>
        `;
        
        // Add click handler for book links
        const bookLink = div.querySelector('.book-link');
        if (bookLink) {
            bookLink.addEventListener('click', (e) => {
                e.preventDefault();
                const link = e.target.closest('.book-link');
                if (!link) return;
                
                const isbn = link.dataset.isbn;
                const title = link.dataset.title;
                const author = link.dataset.author;
                
                ui.showConfirmDialog(
                    'Add to Reading List',
                    `Would you like to add "${title}" by ${author} to your reading list?`,
                    async () => {
                        await books.addToReadingList(isbn, title, author);
                        await books.loadReadingList();
                    }
                );
            });
        }
        
        return div;
    },

    showJoinClubModal() {
        ui.toggleModal('join-club-modal', true);
    },

    async joinClub(event) {
        event.preventDefault();
        try {
            const clubCode = document.getElementById('club-code').value.trim();
            
            if (!clubCode) {
                throw new Error('Please enter a club code');
            }
            
            const response = await fetch('/api/join-club', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ join_code: clubCode })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to join club');
            }
            
            await this.loadClubs();
            ui.showSuccess('Successfully joined the club');
            ui.toggleModal('join-club-modal', false);
            document.getElementById('club-code').value = '';
            
        } catch (error) {
            console.error('Failed to join club:', error);
            ui.showError(error.message || 'Failed to join club');
        }
    },

    async showCreateClubModal() {
        const bookSelect = document.getElementById('club-current-book');
        if (bookSelect) {
            // Clear existing options except the default one
            while (bookSelect.options.length > 1) {
                bookSelect.remove(1);
            }
            
            try {
                const response = await fetch('/api/get-reading-list', {
                    credentials: 'include'
                });
                const books = await response.json();
                
                if (Array.isArray(books)) {
                    books.forEach(book => {
                        const option = document.createElement('option');
                        option.value = book.isbn;
                        option.textContent = `${book.title} by ${book.author}`;
                        bookSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Failed to load books for club creation:', error);
            }
        }
        
        ui.toggleModal('create-club-modal', true);
    },

    showAddFriendModal() {
        ui.toggleModal('add-friend-modal', true);
    },

    async updateFriendCode() {
        try {
            const friendCodeInput = document.getElementById('my-friend-code');
            const newCode = friendCodeInput.value.trim();
            
            if (!newCode) {
                throw new Error('Please enter a friend code');
            }
            
            const response = await fetch('/api/update-friend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friend_code: newCode })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update friend code');
            }
            
            const data = await response.json();
            friendCodeInput.value = data.friend_code;
            ui.showSuccess('Friend code updated successfully');
            
        } catch (error) {
            console.error('Friend code update failed:', error);
            ui.showError(error.message || 'Failed to update friend code');
        }
    },

    async loadFriendCode() {
        try {
            const response = await fetch('/api/get-friend-code', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                const friendCodeInput = document.getElementById('my-friend-code');
                if (friendCodeInput) {
                    friendCodeInput.value = data.friend_code || '';
                }
            }
        } catch (error) {
            console.error('Failed to load friend code:', error);
        }
    },

    async loadSocialSection() {
        await Promise.all([
            this.loadFriends(),
            this.loadClubs(),
            this.loadFriendCode()
        ]);
    },

    async removeFriend(friendId) {
        try {
            const response = await fetch('/api/remove-friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friend_id: friendId })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove friend');
            }
            
            await this.loadFriends();
            ui.showSuccess('Friend removed successfully');
            
        } catch (error) {
            console.error('Failed to remove friend:', error);
            ui.showError(error.message || 'Failed to remove friend');
        }
    },

    async modifyClub(clubId) {
        const form = document.getElementById('modify-club-form');
        form.querySelector('#modify-club-id').value = clubId;
        
        try {
            const [clubResponse, booksResponse] = await Promise.all([
                fetch(`/api/get-club-details/${clubId}`, { credentials: 'include' }),
                fetch('/api/get-reading-list', { credentials: 'include' })
            ]);

            if (!clubResponse.ok || !booksResponse.ok) {
                throw new Error('Failed to load club or books data');
            }

            const club = await clubResponse.json();
            const books = await booksResponse.json();
            
            form.querySelector('#modify-club-name').value = club.name || '';
            
            const bookSelect = form.querySelector('#modify-club-book');
            bookSelect.innerHTML = '<option value="">Select a book (optional)</option>';
            
            if (Array.isArray(books)) {
                books.forEach(book => {
                    const option = document.createElement('option');
                    option.value = book.isbn;
                    option.textContent = `${book.title} by ${book.author}`;
                    option.selected = book.isbn === club.current_book_isbn;
                    bookSelect.appendChild(option);
                });
            }
            
            ui.toggleModal('modify-club-modal', true);
            
            // Add form submit handler
            form.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    const selectedOption = form.querySelector('#modify-club-book').selectedOptions[0];
                    const currentBook = selectedOption ? {
                        isbn: selectedOption.value,
                        title: selectedOption.textContent.split(' by ')[0],
                        author: selectedOption.textContent.split(' by ')[1]
                    } : null;

                    const response = await fetch(`/api/modify-club/${clubId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            name: form.querySelector('#modify-club-name').value.trim(),
                            currentBook: currentBook
                        })
                    });

                    if (!response.ok) throw new Error('Failed to modify club');
                    
                    ui.hideModals();
                    await this.loadClubs();
                    ui.showSuccess('Club modified successfully');
                } catch (error) {
                    console.error('Failed to modify club:', error);
                    ui.showError(error.message || 'Failed to modify club');
                }
            };
        } catch (error) {
            console.error('Failed to load club details:', error);
            ui.showError('Failed to load club details');
        }
    },

    async deleteClub(clubId) {
        if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/delete-club/${clubId}`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Failed to delete club');
            
            await this.loadClubs();
            ui.showSuccess('Club deleted successfully');
        } catch (error) {
            console.error('Failed to delete club:', error);
            ui.showError('Failed to delete club');
        }
    },

    async addFriend() {
        try {
            const friendCode = document.getElementById('friend-code').value.trim();
            
            if (!friendCode) {
                throw new Error('Please enter a friend code');
            }
            
            const response = await fetch('/api/add-friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friend_code: friendCode })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add friend');
            }
            
            await this.loadFriends();
            ui.showSuccess('Friend added successfully');
            ui.toggleModal('add-friend-modal', false);
            document.getElementById('friend-code').value = '';
            
        } catch (error) {
            console.error('Failed to add friend:', error);
            ui.showError(error.message || 'Failed to add friend');
        }
    }
}; 