import { initializeNavigation, initializeApp, attachEventListeners } from '../script.js';

// Authentication related functions
export const auth = {
    async checkAuthentication() {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            
            if (data.authenticated) {
                document.getElementById('auth-overlay').style.display = 'none';
                initializeNavigation();
                await initializeApp();
                attachEventListeners();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    },

    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById('auth-overlay').style.display = 'none';
                initializeNavigation();
                await initializeApp();
                attachEventListeners();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Login failed:', error);
            document.getElementById('login-error').textContent = 
                error.message || 'Login failed. Please try again.';
        }
    },

    async handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            document.getElementById('register-error').textContent = 'Passwords do not match';
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', username);
                document.getElementById('auth-overlay').style.display = 'none';
                initializeNavigation();
                await initializeApp();
                attachEventListeners();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            document.getElementById('register-error').textContent = 
                error.message || 'Registration failed. Please try again.';
        }
    },

    async handleLogout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            document.getElementById('auth-overlay').style.display = 'flex';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },

    async updateProfile(event) {
        event.preventDefault();
        const username = document.getElementById('profile-username').value;
        const password = document.getElementById('profile-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        if (password && password !== confirmPassword) {
            ui.showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: username || undefined,
                    password: password || undefined 
                })
            });

            const data = await response.json();
            if (response.ok) {
                if (username) localStorage.setItem('username', username);
                ui.showSuccess('Profile updated successfully');
                ui.hideModals();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            ui.showError(error.message || 'Profile update failed. Please try again.');
        }
    },

    showLogin() {
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('reset-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    },

    showRegister() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('reset-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    },

    showPasswordReset() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('reset-form').classList.remove('hidden');
    },

    async handlePasswordReset(event) {
        event.preventDefault();
        const email = document.getElementById('reset-email').value;
        
        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                ui.showSuccess('Password reset instructions sent to your email');
                ui.hideModals();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Password reset failed:', error);
            ui.showError(error.message || 'Password reset failed. Please try again.');
        }
    },

    async updateUsername() {
        const username = document.getElementById('profile-username').value;
        if (!username) {
            ui.showError('Username cannot be empty');
            return;
        }

        await this.updateProfile({
            target: {
                querySelector: (id) => document.getElementById('profile-username')
            },
            preventDefault: () => {}
        });
    },

    async updatePassword() {
        const password = document.getElementById('profile-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        if (!password) {
            ui.showError('Password cannot be empty');
            return;
        }

        if (password !== confirmPassword) {
            ui.showError('Passwords do not match');
            return;
        }

        await this.updateProfile({
            target: {
                querySelector: (id) => document.getElementById('profile-password')
            },
            preventDefault: () => {}
        });
    },

    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                window.location.reload();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Account deletion failed:', error);
            ui.showError(error.message || 'Account deletion failed. Please try again.');
        }
    }
}; 

// Check authentication status when the page loads
document.addEventListener('DOMContentLoaded', () => {
    auth.checkAuthentication();
}); 