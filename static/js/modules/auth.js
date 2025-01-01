import { ui } from './ui.js';
import { initializeApp, attachEventListeners } from '../script.js';

export const auth = {
    async checkAuthentication() {
        try {
            console.log('Checking authentication status...');
            const response = await fetch('/api/check-auth', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Auth check response:', data);
            
            if (data.authenticated) {
                console.log('User is authenticated, hiding overlay');
                document.getElementById('auth-overlay').style.display = 'none';
                return true;
            }
            
            console.log('User is not authenticated, showing overlay');
            document.getElementById('auth-overlay').style.display = 'flex';
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            document.getElementById('auth-overlay').style.display = 'flex';
            return false;
        }
    },

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok && data.authenticated) {
                document.getElementById('auth-overlay').style.display = 'none';
                document.getElementById('login-form-element').reset();
                return true;
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login failed:', error);
            document.getElementById('login-error').textContent = 
                error.message || 'Login failed. Please try again.';
            return false;
        }
    },

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            document.getElementById('register-error').textContent = 'Passwords do not match';
            return false;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok && data.authenticated) {
                document.getElementById('auth-overlay').style.display = 'none';
                document.getElementById('register-form-element').reset();
                return true;
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            document.getElementById('register-error').textContent = 
                error.message || 'Registration failed. Please try again.';
            return false;
        }
    },

    showLogin() {
        console.log('Showing login form');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('reset-form').classList.add('hidden');
    },

    showRegister() {
        console.log('Showing register form');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('reset-form').classList.add('hidden');
    },

    showPasswordReset() {
        console.log('Showing password reset form');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('reset-form').classList.remove('hidden');
    },

    async handleLogout() {
        console.log('Handling logout');
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                console.log('Logout successful, showing auth overlay');
                document.getElementById('auth-overlay').style.display = 'flex';
                document.getElementById('login-form-element').reset();
                document.getElementById('register-form-element').reset();
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },

    async updatePassword() {
        const newPassword = document.getElementById('profile-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        if (!newPassword || !confirmPassword) {
            ui.showError('Please fill in both password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            ui.showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ new_password: newPassword })
            });

            const data = await response.json();
            
            if (response.ok) {
                ui.showSuccess('Password updated successfully');
                document.getElementById('profile-password').value = '';
                document.getElementById('profile-confirm-password').value = '';
            } else {
                throw new Error(data.error || 'Failed to update password');
            }
        } catch (error) {
            console.error('Password update failed:', error);
            ui.showError(error.message || 'Failed to update password');
        }
    },

    async deleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/delete-account', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                ui.showSuccess('Account deleted successfully');
                // Show login screen
                document.getElementById('auth-overlay').style.display = 'flex';
                this.showLogin();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Account deletion failed:', error);
            ui.showError(error.message || 'Failed to delete account');
        }
    },

    async updateUsername() {
        const newUsername = document.getElementById('profile-username').value;
        
        if (!newUsername) {
            ui.showError('Please enter a new username');
            return;
        }

        try {
            const response = await fetch('/api/update-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ new_username: newUsername })
            });

            const data = await response.json();
            
            if (response.ok) {
                ui.showSuccess('Username updated successfully');
                document.getElementById('profile-username').value = '';
            } else {
                throw new Error(data.error || 'Failed to update username');
            }
        } catch (error) {
            console.error('Username update failed:', error);
            ui.showError(error.message || 'Failed to update username');
        }
    }
}; 