import { ui } from './ui.js';

// Social features (clubs, friends) related functions
export const social = {
    async loadClubs() {
        try {
            const response = await fetch('/api/get-clubs');
            const data = await response.json();
            console.log('Clubs response:', data); // Debug log
            
            const clubs = Array.isArray(data) ? data : [];
            const clubsContainer = document.getElementById('book-clubs');
            clubsContainer.innerHTML = clubs.length ? '' : '<p>No book clubs found</p>';
            
            clubs.forEach(club => {
                const clubElement = this.createClubElement(club);
                clubsContainer.appendChild(clubElement);
            });
        } catch (error) {
            console.error('Failed to load clubs:', error);
            ui.showError('Failed to load book clubs');
        }
    },

    createClubElement(club) {
        const div = document.createElement('div');
        div.className = 'club-item';
        div.innerHTML = `
            <h3>${club.name}</h3>
            <p>${club.memberCount} members</p>
            <p>Currently reading: ${club.currentBook}</p>
            <button class="join-club" data-club-id="${club.id}">
                ${club.isMember ? 'Leave Club' : 'Join Club'}
            </button>
        `;

        div.querySelector('.join-club').addEventListener('click', 
            () => this.toggleClubMembership(club));

        return div;
    },

    async toggleClubMembership(club) {
        try {
            const endpoint = club.isMember ? 'leave' : 'join';
            const response = await fetch(`/api/clubs/${club.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`Failed to ${endpoint} club`);
            
            await this.loadClubs();
            ui.showSuccess(`Successfully ${endpoint}ed the club`);
        } catch (error) {
            console.error(`Failed to ${endpoint} club:`, error);
            ui.showError(`Failed to ${endpoint} club`);
        }
    },

    async createClub(event) {
        event.preventDefault();
        const form = event.target;
        
        try {
            const response = await fetch('/api/clubs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.querySelector('#club-name').value,
                    description: form.querySelector('#club-description').value,
                    currentBook: form.querySelector('#club-current-book').value
                })
            });

            if (!response.ok) throw new Error('Failed to create club');

            ui.clearForm('create-club-form');
            ui.toggleModal('create-club-modal', false);
            await this.loadClubs();
            ui.showSuccess('Club created successfully');
        } catch (error) {
            console.error('Failed to create club:', error);
            ui.showError('Failed to create club');
        }
    },

    async loadFriends() {
        try {
            const response = await fetch('/api/get-friends');
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
        div.innerHTML = `
            <img src="${friend.avatar}" alt="${friend.username}'s avatar">
            <div class="friend-details">
                <h3>${friend.username}</h3>
                <p>Reading: ${friend.currentlyReading || 'Nothing'}</p>
                <p>Books completed: ${friend.booksCompleted}</p>
            </div>
        `;
        return div;
    },

    showJoinClubModal() {
        ui.toggleModal('join-club-modal', true);
    },

    showCreateClubModal() {
        ui.toggleModal('create-club-modal', true);
    },

    showAddFriendModal() {
        ui.toggleModal('add-friend-modal', true);
    },

    async updateFriendCode() {
        try {
            const response = await fetch('/api/update-friend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (response.ok) {
                ui.showSuccess('Friend code updated successfully');
                await this.loadFriends(); // Refresh the friends list
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Friend code update failed:', error);
            ui.showError(error.message || 'Failed to update friend code');
        }
    }
}; 