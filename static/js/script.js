import { auth } from './modules/auth.js';
import { ui } from './modules/ui.js';
import { goals } from './modules/goals.js';
import { books } from './modules/books.js';
import { social } from './modules/social.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        ui.toggleModal('auth-overlay', true);
        return;
    }

    initializeNavigation();
    await initializeApp();
    attachEventListeners();
});

function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (!auth.isAuthenticated()) return;
            const sectionId = link.getAttribute('href').substring(1);
            ui.showSection(sectionId);
        });
    });
}

async function initializeApp() {
    try {
        await Promise.all([
            goals.loadTodaysGoals(),
            books.updateReadingListSelect(),
            social.loadClubs(),
            social.loadFriends()
        ]);
        ui.showSection('today-goals');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        ui.showError('Failed to load some components');
    }
}

function attachEventListeners() {
    // Auth related
    document.getElementById('login-form')?.addEventListener('submit', auth.handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', auth.handleRegister);
    document.getElementById('logout-button')?.addEventListener('click', auth.handleLogout);

    // Books related
    document.getElementById('book-search-form')?.addEventListener('submit', e => {
        e.preventDefault();
        books.searchBooks(document.getElementById('book-search').value);
    });

    // Goals related
    document.getElementById('create-goal-form')?.addEventListener('submit', goals.createGoal.bind(goals));
    document.getElementById('update-progress-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const goalId = e.target.dataset.goalId;
        const pages = document.getElementById('pages-read').value;
        goals.updateProgress(goalId, parseInt(pages));
    });

    // Social related
    document.getElementById('create-club-form')?.addEventListener('submit', social.createClub.bind(social));
}

