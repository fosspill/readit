// Authentication related functions
export const auth = {
    isAuthenticated() {
        return Boolean(localStorage.getItem('userId'));
    },

    getCurrentUserId() {
        return localStorage.getItem('userId');
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
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', username);
                document.getElementById('auth-overlay').style.display = 'none';
                location.reload();
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
                location.reload();
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
            location.reload();
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
            alert('Passwords do not match');
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
                alert('Profile updated successfully');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            alert(error.message || 'Profile update failed. Please try again.');
        }
    }
}; 