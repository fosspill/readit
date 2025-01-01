import { auth } from './modules/auth.js';
import { ui } from './modules/ui.js';
import { goals } from './modules/goals.js';
import { books } from './modules/books.js';
import { social } from './modules/social.js';
import { profile } from './modules/profile.js';

// Make modules available globally
window.auth = auth;
window.social = social;
window.ui = ui;
window.books = books;
window.goals = goals;
window.profile = profile;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form-element');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const success = await auth.handleLogin();
            if (success) {
                await initializeApp();
                attachEventListeners();
            }
            return false;
        });
    }

    const registerForm = document.getElementById('register-form-element');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const success = await auth.handleRegister();
            if (success) {
                await initializeApp();
                attachEventListeners();
            }
            return false;
        });
    }
});

export function initializeNavigation() {
    console.log('Initializing navigation...');
    document.querySelectorAll('.nav-item').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    document.querySelector('[href="#today-goals"]')?.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            ui.showSection(section);
            
            // Load profile data when switching to profile section
            if (section === 'profile') {
                await profile.loadProfile();
            }
        });
    });
}

export function attachEventListeners() {
    console.log('Attaching event listeners...');
    
    // Book search form
    document.getElementById('book-search-form')?.addEventListener('submit', e => {
        e.preventDefault();
        books.searchBooks(document.getElementById('book-search').value);
    });

    // Create goal form
    document.getElementById('create-goal-form')?.addEventListener('submit', e => {
        e.preventDefault();
        goals.createGoal(e);
    });

    // Update progress form
    document.getElementById('update-progress-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const goalId = e.target.dataset.goalId;
        const pages = document.getElementById('pages-read').value;
        goals.updateProgress(goalId, parseInt(pages));
    });

    // Create club form
    document.getElementById('create-club-form')?.addEventListener('submit', e => {
        e.preventDefault();
        social.createClub(e);
    });

    // Join club form
    document.getElementById('join-club-form')?.addEventListener('submit', e => {
        e.preventDefault();
        social.joinClub(e);
    });

    // Add friend form
    document.getElementById('add-friend-form')?.addEventListener('submit', e => {
        e.preventDefault();
        social.addFriend(e);
    });

    // Set club book form
    document.getElementById('set-club-book-form')?.addEventListener('submit', e => {
        e.preventDefault();
        social.setClubBook(e);
    });

    // Logout button
    document.getElementById('logout-button')?.addEventListener('click', e => {
        e.preventDefault();
        auth.handleLogout();
    });
}

export async function initializeApp() {
    console.log('Initializing app...');
    const isAuthenticated = await auth.checkAuthentication();
    
    if (!isAuthenticated) {
        console.log('Not authenticated, showing auth overlay');
        return false;
    }

    initializeNavigation();
    
    try {
        // Show the Today section first
        ui.showSection('today-goals');
        
        // Then load all the data
        await Promise.all([
            goals.loadTodayGoals(),
            books.loadReadingList(),
            social.loadSocialSection(),
            profile.loadProfile()
        ]);
    } catch (error) {
        console.error('Error initializing app:', error);
    }
    
    console.log('App initialization complete');
    return true;
}

initializeApp().then(initialized => {
    if (initialized) {
        attachEventListeners();
    }
});

