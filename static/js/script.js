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

// Export these functions so auth.js can use them
export function initializeNavigation() {
    console.log('Initializing navigation...'); // Debug log
    
    // Remove any existing event listeners by cloning and replacing nav items
    document.querySelectorAll('.nav-item').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // Set initial active state
    document.querySelector('[href="#today-goals"]')?.classList.add('active');
    
    // Attach click handlers once
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const isAuthenticated = await auth.checkAuthentication();
            if (!isAuthenticated) return;
            
            const sectionId = link.getAttribute('href').substring(1);
            console.log('Navigating to section:', sectionId);
            
            // Only load data if it's not already loaded
            switch(sectionId) {
                case 'today-goals':
                    await goals.loadTodayGoals();
                    break;
                case 'friends':
                    await social.loadFriends();
                    await social.loadClubs();
                    break;
                case 'add-goals':
                    await books.updateReadingListSelect();
                    break;
                case 'profile':
                    await profile.loadProfile();
                    break;
            }
            
            ui.showSection(sectionId);
        });
    });
}

export async function initializeApp() {
    try {
        console.log('Initializing app...'); // Debug log
        
        // Initialize sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // Load initial data for the first visible section only
        await goals.loadTodayGoals();

        console.log('App initialization complete'); // Debug log
        
        // Show the initial section
        ui.showSection('today-goals');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        ui.showError('Failed to load some components');
    }
}

export function attachEventListeners() {
    console.log('Attaching event listeners...'); // Debug log

    // Books related
    document.getElementById('book-search-form')?.addEventListener('submit', e => {
        e.preventDefault();
        books.searchBooks(document.getElementById('book-search').value);
    });

    // Goals related
    document.getElementById('create-goal-form')?.addEventListener('submit', e => {
        e.preventDefault();
        goals.createGoal(e);
    });
    
    document.getElementById('update-progress-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const goalId = e.target.dataset.goalId;
        const pages = document.getElementById('pages-read').value;
        goals.updateProgress(goalId, parseInt(pages));
    });

    // Social related
    document.getElementById('create-club-form')?.addEventListener('submit', e => {
        e.preventDefault();
        social.createClub(e);
    });

    // Logout
    document.getElementById('logout-button')?.addEventListener('click', e => {
        e.preventDefault();
        auth.handleLogout();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Attach auth form listeners first
    document.getElementById('login-form-element')?.addEventListener('submit', (e) => {
        e.preventDefault();
        auth.handleLogin(e);
        return false;
    });
    
    document.getElementById('register-form-element')?.addEventListener('submit', (e) => {
        e.preventDefault();
        auth.handleRegister(e);
        return false;
    });

    // Check authentication and initialize app if logged in
    const isAuthenticated = await auth.checkAuthentication();
    if (!isAuthenticated) {
        ui.toggleModal('auth-overlay', true);
        return;
    }

    initializeNavigation();
    await initializeApp();
    attachEventListeners();
});

