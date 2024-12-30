// Global variables
let searchTimeout;

// Add this near the top with other global variables
const loadingMessages = [
    "Dusting off ancient tomes...",
    "Checking the forbidden section...",
    "Consulting with the library ghost...",
    "Climbing the tallest bookshelf...",
    "Asking the wise librarian...",
    "Searching through magical scrolls...",
    "Decoding mysterious book titles...", 
    "Navigating the endless aisles...",
    "Waking up sleeping books...",
    "Organizing enchanted card catalogs...",
    "Polishing golden bookmarks...",
    "Untangling bookmark ribbons...",
    "Feeding the library dragons...",
    "Brewing reading potions...",
    "Summoning literary spirits...",
    "Deciphering ancient languages...",
    "Exploring hidden chapters...",
    "Dueling with dictionary definitions...",
    "Casting book-finding spells...",
    "Taming wild stories...",
    "Gathering lost pages...",
    "Repairing magical bindings...",
    "Consulting wise owls...",
    "Following bookmark trails...",
    "Unlocking secret passages...",
    "Befriending book fairies...",
    "Mapping the library maze...",
    "Collecting scattered quotes...",
    "Solving riddles in margins...",
    "Chasing runaway plots...",
    "Catching escaped characters...",
    "Mending torn pages...",
    "Lighting reading lanterns...",
    "Sweeping between shelves...",
    "Organizing floating books...",
    "Translating ancient texts...",
    "Hunting rare editions...",
    "Gathering story threads...",
    "Polishing reading glasses...",
    "Warming up reading nooks...",
    "Trimming quill pens...",
    "Mixing ink potions...",
    "Dusting off book covers...",
    "Sorting enchanted bookmarks...",
    "Whispering to shy books...",
    "Calming excited chapters...",
    "Untangling plot twists...",
    "Feeding bookworms...",
    "Watering story seeds...",
    "Training library cats...",
    "Negotiating with book spirits...",
    "Arranging reading chairs...",
    "Tuning reading lamps...",
    "Polishing story gems...",
    "Brewing reading tea...",
    "Adjusting magical shelves...",
    "Winding story clocks...",
    "Warming book spines...",
    "Folding origami bookmarks...",
    "Lighting reading candles..."
];

// Add this near the top with other global variables
const streakQuotes = [
    "Today a reader, tomorrow a leader. - Margaret Fuller",
    "A word after a word after a word is power. - Margaret Atwood",
    "One glance at a book and you hear the voice of another person, perhaps someone dead for 1,000 years. To read is to voyage through time. - Carl Sagan",
    "Show me a family of readers, and I will show you the people who move the world. - Napoleon Bonaparte",
    "A book is a garden, an orchard, a storehouse, a party, a company by the way, a counselor, a multitude of counselors. - Charles Baudelaire",
    "When I look back, I am so impressed again with the life-giving power of literature. If I were a young person today, trying to gain a sense of myself in the world, I would do that again by reading, just as I did when I was young. - Maya Angelou",
    "Reading should not be presented to children as a chore, a duty. It should be offered as a gift. - Kate DiCamillo",
    "I think books are like people, in the sense that they'll turn up in your life when you most need them. - Emma Thompson",
    "It wasn't until I started reading and found books they wouldn't let us read in school that I discovered you could be insane and happy and have a good life without being like everybody else. - John Waters",
    "Books are a uniquely portable magic. - Stephen King",
    "Books are mirrors: You only see in them what you already have inside you. - Carlos Ruiz Zafón",
    "Think before you speak. Read before you think. - Fran Lebowitz",
    "Let's be reasonable and add an eighth day to the week that is devoted exclusively to reading. - Lena Dunham",
    "If you don't like to read, you haven't found the right book. - J.K. Rowling",
    "I can feel infinitely alive curled up on the sofa reading a book. - Benedict Cumberbatch",
    "Some books leave us free and some books make us free. - Ralph Waldo Emerson",
    "Writing and reading decrease our sense of isolation. They deepen and widen and expand our sense of life: They feed the soul. - Anne Lamott",
    "We tell ourselves stories in order to live. - Joan Didion",
    "Books and doors are the same thing. You open them, and you go through into another world. - Jeanette Winterson",
    "A good book would take me out of myself and then stuff me back in, outsized, now, and uneasy with the fit. - David Sedaris",
    "Books are, let's face it, better than everything else. - Nick Hornby",
    "We read to know we are not alone. - C.S. Lewis",
    "As you read a book word by word and page by page, you participate in its creation. - Ursula K. Le Guin",
    "It is really hard to be lonely very long in a world of words. - Naomi Shihab Nye",
    "Read a lot. Expect something big, something exalting or deepening from a book. No book is worth reading that isn't worth re-reading. - Susan Sontag",
    "Have books 'happened' to you? Unless your answer to that question is 'yes,' I'm unsure how to talk to you. - Haruki Murakami",
    "A story can always break into pieces while it sits inside a book on a shelf; and, decades after we have read it even twenty times, it can open us up, by cut or caress, to a new truth. - Andre Dubus",
    "Once you learn to read, you will be forever free. - Frederick Douglass",
    "Literature is the safe and traditional vehicle through which we learn about the world and pass on values from one generation to the next. Books save lives. - Laurie Anderson",
    "Reading fiction is important. It is a vital means of imagining a life other than our own, which in turn makes us more empathetic beings. - Ann Patchett",
    "Both reading and writing are experiences – lifelong – in the course of which we who encounter words used in certain ways are persuaded by them to be brought mind and heart within the presence, the power, of the imagination. - Eudora Welty",
    "A room without books is like a body without a soul. - Cicero",
    "The reading of all good books is like a conversation with the finest minds of past centuries. - Rene Descartes",
    "That's the thing about books. They let you travel without moving your feet. - Jhumpa Lahiri",
    "Reading is an exercise in empathy; an exercise in walking in someone else's shoes for a while. - Malorie Blackman",
    "Reading is a form of prayer, a guided meditation that briefly makes us believe we're someone else, disrupting the delusion that we're permanent and at the center of the universe. - George Saunders",
    "A great book should leave you with many experiences, and slightly exhausted at the end. You live several lives while reading. - William Styron",
    "I guess a big part of serious fiction's purpose is to give the reader, who like all of us is sort of marooned in her own skull, to give her imaginative access to other selves. - David Foster Wallace",
    "Reading is escape, and the opposite of escape; it's a way to make contact with reality after a day of making things up. - Nora Ephron",
    "Reading makes immigrants of us all. It takes us away from home, but more important, it finds homes for us everywhere. - Jean Rhys",
    "Salvation is certainly among the reasons I read. Reading and writing have always pulled me out of the darkest experiences in my life. - Roxane Gay",
    "You think your pain and your heartbreak are unprecedented in the history of the world, but then you read. - James Baldwin",
    "Reading is important. If you know how to read, then the whole world opens up to you. - Barack Obama",
    "That is part of the beauty of all literature. You discover that your longings are universal longings, that you're not lonely and isolated from anyone. You belong. - F. Scott Fitzgerald",
    "We don't need a list of rights and wrongs, tables of dos and don'ts: We need books, time, and silence. - Philip Pullman",
    "Books may well be the only true magic. - Alice Hoffman",
    "Maybe this is why we read, and why in moments of darkness we return to books: to find words for what we already know. - Alberto Manguel",
    "A book lying idle on a shelf is wasted ammunition. Like money, books must be kept in constant circulation. - Henry Miller",
    "Reading is an active, imaginative act; it takes work. - Khaled Hosseini",
    "It is known that reading quickens the growth of a heart like nothing else. - Catherynne M. Valente",
    "If you would tell me the heart of a man, tell me not what he reads, but what he rereads. - François Mauriac",
    "To acquire the habit of reading is to construct for yourself a refuge from almost all the miseries of life. - W. Somerset Maugham",
    "I don't read a book; I hold a conversation with the author. - Elbert Hubbard",
    "Some books are so familiar that reading them is like being home again. - Louisa May Alcott"
];

// Add this near the top with other global variables
const profileHtml = `
    <div class="profile-section">
        <h2>My Profile</h2>
        <form id="profile-form" class="profile-form">
            <div class="form-group">
                <label for="profile-username">Username</label>
                <input type="text" id="profile-username" placeholder="New username">
            </div>
            <div class="form-group">
                <label for="profile-password">New Password</label>
                <input type="password" id="profile-password" placeholder="New password">
            </div>
            <div class="form-group">
                <label for="profile-confirm-password">Confirm New Password</label>
                <input type="password" id="profile-confirm-password" placeholder="Confirm new password">
            </div>
            <button type="submit" class="auth-button">Update Profile</button>
        </form>
        
        <button onclick="handleLogout()" class="auth-button logout-button">
            Log Out
        </button>

        <div class="profile-section-group">
            <h3>Reading Goals</h3>
            <div id="profile-goals-list" class="profile-list">
                Loading goals...
            </div>
        </div>

        <div class="profile-section-group">
            <h3>Books</h3>
            <div id="profile-books-list" class="profile-list">
                Loading books...
            </div>
        </div>
    </div>
`;

// Helper function to format book titles consistently
function formatBookTitle(title, author) {
    return `${title} by ${author}`;
}

// Show/Hide form functions
function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('reset-form').classList.add('hidden');
}

function showPasswordReset() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
    document.getElementById('new-password-fields').classList.add('hidden');
}

// Handle login with auth check
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        console.log('Checking current auth status...'); // Debug log
        // First check if we're already authenticated with the server
        const authCheck = await fetch('/api/check-auth');
        const authData = await authCheck.json();
        
        if (authData.authenticated) {
            console.log('User already authenticated, proceeding...'); // Debug log
            // Hide auth overlay and initialize
            document.getElementById('auth-overlay').style.display = 'none';
            await Promise.all([
                loadTodaysGoals(),
                updateReadingListSelect()
            ]);
            showSection('today-goals');
            return;
        }
        
        console.log('Attempting login...'); // Debug log
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data); // Debug log
        
        if (data.success) {
            console.log('Login successful, setting user data...'); // Debug log
            // Set auth data first
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', username);
            
            console.log('Auth data set:', { 
                userId: localStorage.getItem('userId'),
                username: localStorage.getItem('username')
            }); // Debug log
            
            // Show success message
            showToast('Welcome back!');
            
            // Hide auth overlay
            document.getElementById('auth-overlay').style.display = 'none';
            
            console.log('Initializing data...'); // Debug log
            // Initialize all data after successful login
            await Promise.all([
                loadTodaysGoals(),
                updateReadingListSelect()
            ]);
            
            console.log('Data initialized, showing today section...'); // Debug log
            // Show initial section (today)
            showSection('today-goals');
        } else {
            console.log('Login failed:', data.message); // Debug log
            showToast(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.');
    }
}

// Handle registration with debug logging
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match');
        return;
    }
    
    try {
        console.log('Attempting registration...'); // Debug log
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('Registration response:', data); // Debug log
        
        if (data.success) {
            console.log('Registration successful'); // Debug log
            showToast('Registration successful! Please log in.');
            showLogin(); // Switch to login form
        } else {
            console.log('Registration failed:', data.message); // Debug log
            showToast(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed. Please try again.');
    }
}

// Handle password reset
async function handlePasswordReset(event) {
    event.preventDefault();
    
    const username = document.getElementById('reset-username').value;
    const bookTitle = document.getElementById('reset-book').value;
    const newPasswordFields = document.getElementById('new-password-fields');
    
    if (newPasswordFields.classList.contains('hidden')) {
        // First step: verify book title
        try {
            const response = await fetch('/api/verify-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, book_title: bookTitle })
            });
            
            const data = await response.json();
            
            if (data.success) {
                newPasswordFields.classList.remove('hidden');
                showToast('Book verified! Please enter your new password.');
            } else {
                showToast(data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Reset verification error:', error);
            showToast('Verification failed. Please try again.');
        }
    } else {
        // Second step: set new password
        const newPassword = document.getElementById('reset-new-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Password reset successful! Please log in.');
                showLogin();
            } else {
                showToast(data.message || 'Password reset failed');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            showToast('Password reset failed. Please try again.');
        }
    }
}

// Add this authentication check function
function isAuthenticated() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    console.log('Checking auth status:', { userId, username }); // Debug log
    return Boolean(userId);
}

// Add this to your main JavaScript file
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            // User is logged in, update UI accordingly
            console.log('User is authenticated:', data.username);
            // Update your UI here
            return true;
        } else {
            // User is not logged in
            console.log('User is not authenticated');
            // Update your UI here
            return false;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        return false;
    }
}

// Check auth status when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Update loadTodaysGoals to check auth first
async function loadTodaysGoals() {
    if (!isAuthenticated()) {
        console.log('Not loading goals - user not authenticated');
        return;
    }

    try {
        const response = await fetch('/api/get-todays-goals');
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - handle quietly
                console.log('Session expired or unauthorized');
                return;
            }
            throw new Error('Failed to fetch goals');
        }
        
        const data = await response.json();
        
        const todayContainer = document.getElementById('today-goals');
        const goalsList = todayContainer.querySelector('#book-goals-list');
        const completedList = todayContainer.querySelector('#completed-goals-list');
        
        if (!goalsList || !completedList) return;
        
        const goals = data.goals || [];
        
        // Separate active and completed goals
        const activeGoals = goals.filter(goal => !goal.completed_today);
        const completedGoals = goals.filter(goal => goal.completed_today);

        // Display active goals
        if (activeGoals.length === 0) {
            goalsList.innerHTML = '<p class="no-goals">No active reading goals for today</p>';
        } else {
            goalsList.innerHTML = activeGoals.map(goal => {
                const isGoalMet = goal.daily_progress >= goal.goal_quantity;
                return `
                    <div class="goal-item">
                        <div class="goal-info">
                            <h4>${goal.book_title}</h4>
                            <p class="goal-progress">
                                Progress: ${goal.daily_progress} / ${goal.goal_quantity} ${goal.goal_type}
                            </p>
                        </div>
                        <div class="goal-actions">
                            <button onclick="updateProgress(${goal.id}, false)" class="progress-button decrement">
                                <span class="button-text">-1</span>
                            </button>
                            <button onclick="updateProgress(${goal.id}, true)" class="progress-button increment">
                                <span class="button-text">+1</span>
                            </button>
                            <button onclick="markGoalComplete(${goal.id})" class="complete-button" title="Mark as done">
                                <span class="button-text">✓</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Display completed goals
        if (completedGoals.length > 0) {
            completedList.innerHTML = `
                <h3>Completed Today</h3>
                ${completedGoals.map(goal => `
                    <div class="goal-item completed">
                        <div class="goal-info">
                            <h4>${goal.book_title}</h4>
                            <p class="goal-progress">
                                Completed: ${goal.daily_progress} ${goal.goal_type}
                            </p>
                        </div>
                        <div class="goal-actions">
                            <button onclick="updateProgress(${goal.id}, false)" class="progress-button decrement">
                                <span class="button-text">Undo</span>
                            </button>
                        </div>
                    </div>
                `).join('')}
            `;
        } else {
            completedList.innerHTML = '';
        }

        // Update streak display
        const streakCount = document.getElementById('streak-count');
        const streakDays = document.getElementById('streak-days');
        if (streakCount && streakDays) {
            streakCount.textContent = data.streak;
            streakDays.textContent = data.streak === 1 ? 'day' : 'days';
        }

    } catch (error) {
        // Only show errors if:
        // 1. User is authenticated AND
        // 2. It's not a 401 unauthorized error
        if (isAuthenticated() && error.message !== 'Failed to fetch') {
            console.error('Error loading today\'s data:', error);
        }
    }
}

// Update getCurrentUserId to be more strict
function getCurrentUserId() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        document.getElementById('auth-overlay').style.display = 'flex';
        return null;
    }
    return userId;
}

// Add auth check to page load
document.addEventListener('DOMContentLoaded', function() {
    if (!isAuthenticated()) {
        document.getElementById('auth-overlay').style.display = 'flex';
        return; // Don't load any data if not authenticated
    }
    loadTodaysGoals();
});

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', async function() {
    // Single check for authentication
    if (!isAuthenticated()) {
        console.log('User not authenticated - showing auth overlay');
        document.getElementById('auth-overlay').style.display = 'flex';
        return; // Don't do anything else if not authenticated
    }

    // Initialize navigation only if authenticated
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isAuthenticated()) {
                console.log('Not handling navigation - user not authenticated');
                return;
            }
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Show initial section (today) only if authenticated
    showSection('today-goals');
});

async function updateReadingListSelect() {
    try {
        const response = await fetch('/api/get-reading-list');
        const books = await response.json();
        
        const select = document.getElementById('selected-book');
        select.innerHTML = '<option value="">Select a book from your reading list...</option>';
        
        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.isbn;
            option.textContent = `${book.title} by ${book.author}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating reading list select:', error);
        showToast('Failed to load reading list');
    }
}


async function searchBooks(query) {
    if (!isAuthenticated()) {
        document.getElementById('auth-overlay').style.display = 'flex';
        return;
    }
    try {
        const response = await fetch('/api/search-books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });
        
        const results = await response.json();
        console.log("Search results:", results);
        
        // Display results in the UI
        displaySearchResults(results);
    } catch (error) {
        console.error("Error searching books:", error);
        showToast('Error searching books. Please try again.');
    }
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) {
        console.error('Search results container not found!');
        return;
    }
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No books found.</p>';
        return;
    }
    
    results.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-result';
        bookElement.innerHTML = `
            <h3>${book.title}</h3>
            <p class="author">By ${book.author}</p>
            <p class="isbn">ISBN: ${book.isbn}</p>
            <button class="add-book-btn" onclick="addToReadingList('${book.isbn}', '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}')">
                Add to Reading List
            </button>
        `;
        resultsContainer.appendChild(bookElement);
    });
}

function showToast(message) {
    // Allow auth-related messages even when not authenticated
    if (!isAuthenticated() && 
        !message.toLowerCase().includes('welcome') && 
        !message.toLowerCase().includes('registration') && 
        !message.toLowerCase().includes('password') && 
        message.toLowerCase().includes('failed')) {
        console.log('Suppressing error toast for unauthenticated user');
        return;
    }

    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    toast.style.bottom = '70px';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function addToReadingList(isbn, title, author) {
    if (!isAuthenticated()) {
        document.getElementById('auth-overlay').style.display = 'flex';
        return;
    }
    try {
        const userId = getCurrentUserId();
        
        const response = await fetch('/api/add-to-reading-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                book_isbn: isbn,
                book_title: title,
                book_author: author
            })
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Book added to reading list!');
            
            // Clear search results
            const searchResults = document.getElementById('search-results');
            if (searchResults) {
                searchResults.innerHTML = '';
            }
            
            // Clear search input
            const searchInput = document.getElementById('book-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Update the reading list dropdown
            await updateReadingListSelect();
        } else {
            showToast(data.error || 'Failed to add book to reading list');
        }
    } catch (error) {
        console.error('Error adding book to reading list:', error);
        showToast('Error adding book to reading list');
    }
}

// Helper function to get current user ID
function getCurrentUserId() {
    // Implement this based on how you're storing the user ID
    // For example, you might get it from localStorage, a global variable, or a data attribute
    return localStorage.getItem('userId') || 1; // Default to 1 for testing
}

// Optional: Refresh the reading list display
async function refreshReadingList() {
    try {
        const userId = getCurrentUserId();
        const response = await fetch(`/api/get-reading-list?user_id=${userId}`);
        const books = await response.json();
        
        // Update the reading list display
        const readingListContainer = document.getElementById('reading-list');
        if (readingListContainer) {
            readingListContainer.innerHTML = books.map(book => `
                <div class="book-item">
                    <h3>${book.title}</h3>
                    <p>By ${book.author}</p>
                    <p>ISBN: ${book.isbn}</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error refreshing reading list:', error);
    }
}

// Add new section handling functions
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections and remove active class from nav items
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items first
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
    });
    
    // Show the selected section
    const section = document.getElementById(sectionId);
    console.log('Selected section:', section);
    if (section) {
        section.classList.add('active');
        
        // Add active class to the corresponding nav item
        const navItem = document.querySelector(`.nav-item[href="#${sectionId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Only load section-specific data if authenticated
        if (isAuthenticated()) {
            // Load section-specific data
            switch(sectionId) {
                case 'today-goals':
                    loadTodaysGoals();
                    break;
                case 'friends':
                    loadFriendCode();
                    loadClubs();
                    loadFriends();
                    break;
                case 'add-goals':
                    updateReadingListSelect();
                    break;
                case 'profile':
                    loadProfile();
                    break;
            }
        }
    } else {
        console.error('Could not find section with ID:', sectionId);
    }
}

// Add the loadProfile function
async function loadProfile() {
    console.log('Loading profile...');
    try {
        const response = await fetch('/api/get-profile');
        const data = await response.json();
        console.log('Profile data:', data);
        
        if (data.success) {
            // Update reading goals list
            const goalsList = document.getElementById('profile-goals-list');
            if (goalsList) {
                console.log('Updating goals list...');
                if (data.goals && data.goals.length > 0) {
                    goalsList.innerHTML = data.goals.map(goal => `
                        <div class="profile-item">
                            <h4>${goal.book_title}</h4>
                            <p>Goal: ${goal.goal_quantity} ${goal.goal_type}</p>
                        </div>
                    `).join('');
                } else {
                    goalsList.innerHTML = '<p class="no-items">No active reading goals</p>';
                }
            } else {
                console.log('Goals list element not found');
            }

            // Update books list
            const booksList = document.getElementById('profile-books-list');
            if (booksList) {
                console.log('Updating books list...');
                if (data.books && data.books.length > 0) {
                    booksList.innerHTML = data.books.map(book => `
                        <div class="profile-item">
                            <h4>${book.title}</h4>
                            <p>By ${book.author}</p>
                        </div>
                    `).join('');
                } else {
                    booksList.innerHTML = '<p class="no-items">No books in reading list</p>';
                }
            } else {
                console.log('Books list element not found');
            }
        } else {
            console.log('Profile data load failed:', data.error);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile data');
    }
}

// Update the event listener to handle clicks properly
document.addEventListener('DOMContentLoaded', () => {
    // Navigation event listeners
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Get the href attribute and remove the '#' to get the section ID
            const sectionId = e.currentTarget.getAttribute('href').substring(1);
            console.log('Nav click - section ID:', sectionId); // Debug log
            showSection(sectionId);
        });
    });

    // Show initial section (today)
    showSection('today-goals');
});

// Add function to refresh streak periodically
function startStreakRefresh() {
    // Initial load
    loadTodaysGoals();
    
    // Refresh every 5 minutes
    setInterval(loadTodaysGoals, 5 * 60 * 1000);
}

async function updateGoalProgress(goalId, increment = true) {
    try {
        const response = await fetch('/api/update-goal-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: getCurrentUserId(),
                goal_id: goalId,
                increment: increment
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update progress');
        }

        await loadTodaysGoals(); // Refresh the goals display
    } catch (error) {
        console.error('Error updating progress:', error);
        showToast('Failed to update progress');
    }
}

async function markGoalComplete(goalId) {
    try {
        const response = await fetch('/api/complete-daily-goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goal_id: goalId
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            await loadTodaysGoals(); // Refresh the goals display
            showToast('Goal completed for today!');
        } else {
            showToast(data.error || 'Failed to complete goal');
        }
    } catch (error) {
        console.error('Error completing goal:', error);
        showToast('Failed to complete goal');
    }
}

// Add this helper function
function getRandomLoadingMessage() {
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    return loadingMessages[randomIndex];
}

// Add this function to show loading state
function showSearchLoading() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <p class="loading-message">${getRandomLoadingMessage()}</p>
            </div>
        `;
    }
}

// Add periodic auth check and session refresh
function startSessionRefresh() {
    // Check auth status every 5 minutes
    setInterval(async () => {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            
            if (!data.authenticated) {
                // If session expired, show login
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                document.getElementById('auth-overlay').style.display = 'flex';
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Update the initial page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', data.username);
            document.getElementById('auth-overlay').style.display = 'none';
            loadTodaysGoals();
            startSessionRefresh();
        } else {
            document.getElementById('auth-overlay').style.display = 'flex';
        }
    } catch (error) {
        console.error('Initial auth check failed:', error);
        document.getElementById('auth-overlay').style.display = 'flex';
    }
});

// Add logout functionality
async function handleLogout() {
    if (!confirm('Are you sure you want to log out?')) {
        return;
    }

    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.success) {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            document.getElementById('auth-overlay').style.display = 'flex';
            showToast('Logged out successfully');
        } else {
            showToast(data.error || 'Failed to log out');
        }
    } catch (error) {
        console.error('Error logging out:', error);
        showToast('Failed to log out');
    }
}

// Add these new functions
async function updateProfile(event) {
    event.preventDefault();
    
    const newUsername = document.getElementById('profile-username').value;
    const newPassword = document.getElementById('profile-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        showToast('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                new_username: newUsername || undefined,
                new_password: newPassword || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Profile updated successfully');
            if (newUsername) {
                localStorage.setItem('username', newUsername);
            }
            document.getElementById('profile-form').reset();
        } else {
            showToast(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Failed to update profile');
    }
}

async function clearReadingList() {
    if (!confirm('Are you sure you want to clear your reading list? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/clear-reading-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Reading list cleared');
            await updateReadingListSelect(); // Refresh the reading list dropdown
        } else {
            showToast(data.message || 'Failed to clear reading list');
        }
    } catch (error) {
        console.error('Clear reading list error:', error);
        showToast('Failed to clear reading list');
    }
}

async function clearReadingGoals() {
    if (!confirm('Are you sure you want to clear all your reading goals? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/clear-reading-goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Reading goals cleared');
            await loadTodaysGoals(); // Refresh the goals display
        } else {
            showToast(data.message || 'Failed to clear reading goals');
        }
    } catch (error) {
        console.error('Clear reading goals error:', error);
        showToast('Failed to clear reading goals');
    }
}

// Add new functions to handle the profile section data
async function loadProfileData() {
    if (!isAuthenticated()) {
        console.log('Not loading profile data - user not authenticated');
        return;
    }

    await Promise.all([
        loadProfileGoals(),
        loadProfileBooks()
    ]);
}

async function loadProfileGoals() {
    if (!isAuthenticated()) {
        console.log('Not loading profile goals - user not authenticated');
        return;
    }

    try {
        const response = await fetch('/api/get-reading-goals');
        if (!response.ok) {
            throw new Error('Failed to fetch goals');
        }
        const goals = await response.json();
        
        const goalsContainer = document.getElementById('profile-goals-list');
        if (!goalsContainer) return;

        if (!Array.isArray(goals) || goals.length === 0) {
            goalsContainer.innerHTML = '<p class="no-items">No reading goals set</p>';
            return;
        }

        // Group goals by archive status
        const activeGoals = goals.filter(goal => !goal.archived);
        const archivedGoals = goals.filter(goal => goal.archived);

        let html = '';
        
        // Active Goals Section
        if (activeGoals.length > 0) {
            html += '<div class="goals-section"><h4>Active Goals</h4>';
            html += activeGoals.map(goal => `
                <div class="profile-item">
                    <div class="item-details">
                        <h4>${goal.book_title}</h4>
                        <p>by ${goal.book_author}</p>
                        <p class="goal-details">Goal: ${goal.goal_quantity} ${goal.goal_type} per day</p>
                    </div>
                    <div class="item-actions">
                        <button onclick="archiveGoal(${goal.id})" class="action-button">
                            Archive Goal
                        </button>
                        <button onclick="deleteGoal(${goal.id})" class="action-button danger">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        // Archived Goals Section
        if (archivedGoals.length > 0) {
            html += '<div class="goals-section archived"><h4>Archived Goals</h4>';
            html += archivedGoals.map(goal => `
                <div class="profile-item archived">
                    <div class="item-details">
                        <h4>${goal.book_title}</h4>
                        <p>by ${goal.book_author}</p>
                        <p class="goal-details">Was: ${goal.goal_quantity} ${goal.goal_type} per day</p>
                    </div>
                    <div class="item-actions">
                        <button onclick="deleteGoal(${goal.id})" class="action-button danger">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
            html += '</div>';
        }

        goalsContainer.innerHTML = html || '<p class="no-items">No reading goals set</p>';
    } catch (error) {
        console.error('Error loading profile goals:', error);
        showToast('Failed to load reading goals');
    }
}

async function loadProfileBooks() {
    if (!isAuthenticated()) {
        console.log('Not loading profile books - user not authenticated');
        return;
    }

    try {
        const response = await fetch('/api/get-reading-list');
        const books = await response.json();
        
        const booksContainer = document.getElementById('profile-books-list');
        if (!booksContainer) return;

        if (books.length === 0) {
            booksContainer.innerHTML = '<p class="no-items">No books in reading list</p>';
            return;
        }

        booksContainer.innerHTML = books.map(book => `
            <div class="profile-item">
                <div class="item-details">
                    <h4>${book.title}</h4>
                    <p>by ${book.author}</p>
                </div>
                <div class="item-actions">
                    <button onclick="markBookAsRead('${book.isbn}')" class="action-button">
                        Mark as Read
                    </button>
                    <button onclick="deleteBook('${book.isbn}')" class="action-button danger">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading profile books:', error);
        showToast('Failed to load books');
    }
}

// Add these action functions
async function completeGoal(goalId) {
    if (!confirm('Mark this goal as completed? You won\'t see daily tasks for it anymore.')) return;
    
    try {
        const response = await fetch('/api/complete-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal_id: goalId })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Goal marked as completed');
            await loadProfileGoals();
            await loadTodaysGoals();
        } else {
            showToast(data.message || 'Failed to complete goal');
        }
    } catch (error) {
        console.error('Error completing goal:', error);
        showToast('Failed to complete goal');
    }
}

async function deleteGoal(goalId) {
    if (!confirm('Delete this goal and all its daily progress? This cannot be undone.')) return;
    
    try {
        const response = await fetch('/api/delete-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal_id: goalId })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Goal deleted');
            await loadProfileGoals();
            await loadTodaysGoals();
        } else {
            showToast(data.message || 'Failed to delete goal');
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('Failed to delete goal');
    }
}

async function markBookAsRead(isbn) {
    if (!confirm('Mark this book as read? This will complete all related reading goals.')) return;
    
    try {
        const response = await fetch('/api/mark-book-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbn })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Book marked as read');
            await loadProfileData();
            await loadTodaysGoals();
        } else {
            showToast(data.message || 'Failed to mark book as read');
        }
    } catch (error) {
        console.error('Error marking book as read:', error);
        showToast('Failed to mark book as read');
    }
}

async function deleteBook(isbn) {
    if (!confirm('Delete this book? This will also delete all related reading goals!')) return;
    
    try {
        const response = await fetch('/api/delete-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbn })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Book deleted');
            await loadProfileData();
            await loadTodaysGoals();
        } else {
            showToast(data.message || 'Failed to delete book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showToast('Failed to delete book');
    }
}

// Update the function name and messaging
async function archiveGoal(goalId) {
    if (!confirm('Archive this goal? It will no longer appear in your daily tasks, but you can still view it here.')) return;
    
    try {
        const response = await fetch('/api/archive-goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ goal_id: goalId })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Goal archived');
            await loadProfileGoals();
            await loadTodaysGoals();
        } else {
            showToast(data.message || 'Failed to archive goal');
        }
    } catch (error) {
        console.error('Error archiving goal:', error);
        showToast('Failed to archive goal');
    }
}

async function handleSetGoal(event) {
    event.preventDefault();
    console.log('Setting goal...');
    
    const bookSelect = document.getElementById('selected-book');
    const goalQuantity = document.getElementById('goal-quantity');
    const goalType = document.getElementById('goal-type');
    
    if (!bookSelect.value) {
        showToast('Please select a book');
        return;
    }
    
    if (!goalQuantity.value || goalQuantity.value < 1) {
        showToast('Please enter a valid goal quantity');
        return;
    }
    
    try {
        console.log('Sending request...', {
            book_isbn: bookSelect.value,
            goal_quantity: parseInt(goalQuantity.value),
            goal_type: goalType.value
        });
        
        const response = await fetch('/api/set-reading-goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                book_isbn: bookSelect.value,
                goal_quantity: parseInt(goalQuantity.value),
                goal_type: goalType.value
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok && data.success) {
            showToast('Reading goal set successfully!');
            // Reset form
            bookSelect.value = '';
            goalQuantity.value = '';
            goalType.value = 'pages';
            
            // Refresh goals display
            await loadTodaysGoals();
            
            // Switch to Today view
            showSection('today-goals');
        } else {
            showToast(data.error || 'Failed to set goal');
        }
    } catch (error) {
        console.error('Error setting goal:', error);
        showToast('Failed to set goal');
    }
}

// Add these functions to handle goal progress updates
async function updateProgress(goalId, increment = true) {
    if (!isAuthenticated()) return;

    try {
        const response = await fetch('/api/update-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goal_id: goalId,
                increment: increment,
                decrement: !increment && !reset,
                reset: !increment && reset
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            if (data.goalMet) {
                await markGoalComplete(goalId);
            } else {
                await loadTodaysGoals();
            }
            
            let message = 'Progress updated!';
            if (reset) {
                message = 'Progress reset';
            } else if (!increment) {
                message = 'Progress decreased';
            }
            showToast(message);
        } else {
            showToast(data.error || 'Failed to update progress');
        }
    } catch (error) {
        console.error('Error updating progress:', error);
        showToast('Failed to update progress');
    }
}

async function markGoalComplete(goalId) {
    if (!isAuthenticated()) {
        console.log('Not marking goal complete - user not authenticated');
        return;
    }

    try {
        const response = await fetch('/api/complete-daily-goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                goal_id: goalId
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            await loadTodaysGoals(); // Refresh the goals display
            showToast('Goal completed for today!');
        } else {
            showToast(data.error || 'Failed to complete goal');
        }
    } catch (error) {
        console.error('Error completing goal:', error);
        showToast('Failed to complete goal');
    }
}

// Add these functions to handle club and friend interactions
async function handleCreateClub(event) {
    event.preventDefault();
    const clubName = document.getElementById('club-name').value;
    
    try {
        const response = await fetch('/api/create-club', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: clubName })
        });
        
        const data = await response.json();
        if (data.success) {
            hideModals();
            showToast('Club created successfully!');
            // Show the join code in a special toast or modal
            showToast(`Club Join Code: ${data.join_code}`, 5000); // Show for 5 seconds
            await loadClubs(); // Refresh the clubs list
        } else {
            showToast(data.error || 'Failed to create club');
        }
    } catch (error) {
        console.error('Error creating club:', error);
        showToast('Failed to create club');
    }
}

async function handleJoinClub(event) {
    event.preventDefault();
    const joinCode = document.getElementById('club-code').value;
    
    try {
        const response = await fetch('/api/join-club', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ join_code: joinCode })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Successfully joined club!');
            document.getElementById('club-code').value = '';
            await loadClubs();
        } else {
            showToast(data.error || 'Failed to join club');
        }
    } catch (error) {
        console.error('Error joining club:', error);
        showToast('Failed to join club');
    }
}

async function handleAddFriend(event) {
    event.preventDefault();
    const friendCode = document.getElementById('friend-code').value;
    
    try {
        const response = await fetch('/api/add-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friend_code: friendCode })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Friend added successfully!');
            document.getElementById('friend-code').value = '';
            await loadFriends();
        } else {
            showToast(data.error || 'Failed to add friend');
        }
    } catch (error) {
        console.error('Error adding friend:', error);
        showToast('Failed to add friend');
    }
}

async function loadClubs() {
    try {
        const response = await fetch('/api/get-clubs');
        const data = await response.json();
        
        // Check if data is an array
        if (!Array.isArray(data)) {
            console.error('Unexpected response format:', data);
            showToast('Failed to load clubs');
            return;
        }
        
        const clubsList = document.getElementById('clubs-list');
        clubsList.innerHTML = '';
        
        if (data.length === 0) {
            clubsList.innerHTML = '<p class="no-items">No clubs joined yet</p>';
            return;
        }
        
        data.forEach(club => {
            const clubElement = document.createElement('div');
            clubElement.className = 'club-item';
            clubElement.innerHTML = `
                <div class="club-info">
                    <h4>${club.name}</h4>
                    <p>${club.member_count} member${club.member_count !== 1 ? 's' : ''}</p>
                    
                    <!-- Current Book Section -->
                    ${club.current_book ? `
                        <div class="club-book">
                            <h5>Currently Reading:</h5>
                            <div class="book-info">
                                <p>${club.current_book.title}</p>
                                <p class="readers-count">${club.readers_count} currently reading</p>
                                ${!club.current_book.in_my_list ? `
                                    <button onclick="addToReadingList('${club.current_book.isbn}')" class="action-button small">
                                        <span class="icon">����</span> Add to My List
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    ` : club.is_owner ? `
                        <button onclick="showSetClubBookModal(${club.id})" class="action-button small">
                            <span class="icon">📖</span> Set Club Book
                        </button>
                    ` : `
                        <p class="no-book">No book selected yet</p>
                    `}
                    
                    ${club.is_owner ? `
                        <div class="club-code-container">
                            <p class="code-label">Club Join Code:</p>
                            <span class="club-code">${club.join_code}</span>
                            <button onclick="copyToClipboard('${club.join_code}')" class="action-button small">
                                <span class="icon">📋</span> Copy
                            </button>
                        </div>
                    ` : ''}
                </div>
                ${club.is_owner ? `
                    <button onclick="deleteClub(${club.id})" class="action-button danger small">Delete Club</button>
                ` : `
                    <button onclick="leaveClub(${club.id})" class="action-button small">Leave Club</button>
                `}
            `;
            clubsList.appendChild(clubElement);
        });
    } catch (error) {
        console.error('Error loading clubs:', error);
        showToast('Failed to load clubs');
    }
}

async function loadFriends() {
    try {
        const response = await fetch('/api/get-friends');
        const friends = await response.json();
        
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';
        
        if (friends.length === 0) {
            friendsList.innerHTML = '<p class="no-items">No friends added yet</p>';
            return;
        }
        
        friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <div class="friend-info">
                    <h4>${friend.username}</h4>
                    <p>Current Streak: ${friend.streak} days</p>
                </div>
                <button onclick="removeFriend(${friend.id})" class="action-button danger">
                    Remove Friend
                </button>
            `;
            friendsList.appendChild(friendElement);
        });
    } catch (error) {
        console.error('Error loading friends:', error);
        showToast('Failed to load friends');
    }
}

// Add event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... existing event listeners ...
    
    document.getElementById('create-club-form').addEventListener('submit', handleCreateClub);
    document.getElementById('join-club-form').addEventListener('submit', handleJoinClub);
    document.getElementById('add-friend-form').addEventListener('submit', handleAddFriend);
});

async function deleteClub(clubId) {
    if (!confirm('Are you sure you want to delete this club? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/delete-club/${clubId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Club deleted successfully');
            await loadClubs();
        } else {
            showToast(data.error || 'Failed to delete club');
        }
    } catch (error) {
        console.error('Error deleting club:', error);
        showToast('Failed to delete club');
    }
}

async function leaveClub(clubId) {
    if (!confirm('Are you sure you want to leave this club?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/leave-club/${clubId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Left club successfully');
            await loadClubs();
        } else {
            showToast(data.error || 'Failed to leave club');
        }
    } catch (error) {
        console.error('Error leaving club:', error);
        showToast('Failed to leave club');
    }
}

async function removeFriend(friendId) {
    if (!confirm('Are you sure you want to remove this friend?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/remove-friend/${friendId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Friend removed successfully');
            await loadFriends();
        } else {
            showToast(data.error || 'Failed to remove friend');
        }
    } catch (error) {
        console.error('Error removing friend:', error);
        showToast('Failed to remove friend');
    }
}

async function updateUsername() {
    const newUsername = document.getElementById('profile-username').value;
    if (!newUsername) {
        showToast('Please enter a new username');
        return;
    }

    try {
        const response = await fetch('/api/update-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_username: newUsername })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Username updated successfully');
            document.getElementById('profile-username').value = '';
        } else {
            showToast(data.error || 'Failed to update username');
        }
    } catch (error) {
        console.error('Error updating username:', error);
        showToast('Failed to update username');
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('profile-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;

    if (!newPassword || !confirmPassword) {
        showToast('Please fill in both password fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('/api/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_password: newPassword })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Password updated successfully');
            document.getElementById('profile-password').value = '';
            document.getElementById('profile-confirm-password').value = '';
        } else {
            showToast(data.error || 'Failed to update password');
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showToast('Failed to update password');
    }
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone!')) {
        return;
    }

    if (!confirm('Really delete your account? All your data will be lost!')) {
        return;
    }

    try {
        const response = await fetch('/api/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data.success) {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            document.getElementById('auth-overlay').style.display = 'flex';
            showToast('Account deleted successfully');
        } else {
            showToast(data.error || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showToast('Failed to delete account');
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showJoinClubModal() {
    showModal('join-club-modal');
}

function showCreateClubModal() {
    showModal('create-club-modal');
}

function showAddFriendModal() {
    showModal('add-friend-modal');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideModals();
    }
});

// Add clipboard functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Code copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy code');
    });
}

// Add this function to load the friend code
async function loadFriendCode() {
    try {
        const response = await fetch('/api/get-friend-code');
        const data = await response.json();
        if (data.success) {
            document.getElementById('my-friend-code').value = data.friend_code;
        } else {
            showToast('Failed to load friend code');
        }
    } catch (error) {
        console.error('Error loading friend code:', error);
        showToast('Failed to load friend code');
    }
}

// Add function to update friend code
async function updateFriendCode() {
    const newCode = document.getElementById('my-friend-code').value.trim();
    
    if (!newCode) {
        showToast('Please enter a nickname');
        return;
    }
    
    try {
        const response = await fetch('/api/update-friend-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friend_code: newCode })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Nickname updated successfully!');
        } else {
            showToast(data.error || 'Failed to update nickname');
            // Reset to previous value if update failed
            loadFriendCode();
        }
    } catch (error) {
        console.error('Error updating friend code:', error);
        showToast('Failed to update nickname');
        loadFriendCode();
    }
}

// Show modal for setting club book
function showSetClubBookModal(clubId) {
    document.getElementById('club-id-for-book').value = clubId;
    loadReadingListForClub();
    showModal('set-club-book-modal');
}

// Load reading list for club book selection
async function loadReadingListForClub() {
    try {
        const response = await fetch('/api/get-reading-list');
        const data = await response.json();
        
        const select = document.getElementById('reading-list-select');
        select.innerHTML = '<option value="">Select a book from your reading list</option>';
        
        data.forEach(book => {
            const option = document.createElement('option');
            option.value = book.isbn;
            option.textContent = book.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading reading list:', error);
        showToast('Failed to load reading list');
    }
}

// Handle setting club book
document.getElementById('set-club-book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const clubId = document.getElementById('club-id-for-book').value;
    const bookIsbn = document.getElementById('reading-list-select').value;
    
    try {
        const response = await fetch('/api/set-club-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ club_id: clubId, book_isbn: bookIsbn })
        });
        
        const data = await response.json();
        if (data.success) {
            hideModals();
            showToast('Club book updated successfully!');
            loadClubs(); // Refresh clubs list
        } else {
            showToast(data.error || 'Failed to set club book');
        }
    } catch (error) {
        console.error('Error setting club book:', error);
        showToast('Failed to set club book');
    }
});

// Add book to reading list
async function addToReadingList(isbn) {
    try {
        const response = await fetch('/api/add-to-reading-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isbn: isbn })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Book added to your reading list!');
            loadClubs(); // Refresh to update UI
        } else {
            showToast(data.error || 'Failed to add book');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showToast('Failed to add book');
    }
}

// Add this near the top with other event listeners
document.getElementById('book-search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('book-search').value;
    
    if (!query) {
        showToast('Please enter a search term');
        return;
    }

    const resultsContainer = document.getElementById('search-results');
    
    // Show loading state with random message
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    resultsContainer.innerHTML = `
        <div class="search-loading">
            <div class="loading-spinner"></div>
            <p class="loading-message">${randomMessage}</p>
        </div>
    `;

    try {
        const response = await fetch('/api/search-books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const results = await response.json();
        
        if (!Array.isArray(results)) {
            throw new Error('Invalid response format');
        }

        resultsContainer.innerHTML = ''; // Clear loading state

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No books found</p>';
            return;
        }

        results.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.className = 'book-result';
            bookElement.innerHTML = `
                <h3>${book.title}</h3>
                <p>by ${book.author}</p>
                <button onclick="addToReadingList('${book.isbn}', '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}')">
                    Add to Reading List
                </button>
            `;
            resultsContainer.appendChild(bookElement);
        });

    } catch (error) {
        console.error('Search error:', error);
        showToast('Error searching for books');
        resultsContainer.innerHTML = '<p>Error searching for books</p>';
    }
});

// Update the addToReadingList function
async function addToReadingList(book_isbn, book_title, book_author) {
    try {
        const response = await fetch('/api/add-to-reading-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: localStorage.getItem('userId'),
                book_isbn,
                book_title,
                book_author
            })
        });

        const data = await response.json();
        if (data.success) {
            showToast('Book added to your reading list!');
            
            // Clear search results
            const searchResults = document.getElementById('search-results');
            if (searchResults) {
                searchResults.innerHTML = '';
            }
            
            // Clear search input
            const searchInput = document.getElementById('book-search');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Update the reading list dropdown and set the new book as selected
            await updateReadingListSelect();
            
            // Set the newly added book as the selected option
            const selectElement = document.getElementById('selected-book');
            if (selectElement) {
                selectElement.value = book_isbn;
            }
        } else {
            showToast(data.error || 'Failed to add book');
        }
    } catch (error) {
        console.error('Error adding book:', error);
        showToast('Failed to add book');
    }
}

// Add this event listener for the set-goal form
document.getElementById('set-goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookIsbn = document.getElementById('selected-book').value;
    const goalQuantity = document.getElementById('goal-quantity').value;
    const goalType = document.getElementById('goal-type').value;

    if (!bookIsbn || !goalQuantity || !goalType) {
        showToast('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/save-reading-goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                book_isbn: bookIsbn,
                goal_quantity: parseInt(goalQuantity),
                goal_type: goalType
            })
        });

        // Debug the raw response
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            showToast('Invalid response from server');
            return;
        }

        if (data.success) {
            showToast('Reading goal set successfully!');
            document.getElementById('set-goal-form').reset();
            // Switch to Today view and refresh goals
            document.querySelector('a[href="#today-goals"]').click();
            await loadDailyGoals();
        } else {
            showToast(data.error || 'Failed to set goal');
        }
    } catch (error) {
        console.error('Error setting goal:', error);
        showToast('Failed to set goal');
    }
});

// Add this helper function to load daily goals
async function loadDailyGoals() {
    try {
        const response = await fetch('/api/get-daily-goals');
        const data = await response.json();
        
        const goalsList = document.getElementById('book-goals-list');
        goalsList.innerHTML = '';
        
        if (data.length === 0) {
            goalsList.innerHTML = '<p class="no-items">No reading goals set</p>';
            return;
        }
        
        data.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = `goal-item ${goal.completed ? 'completed' : ''}`;
            goalElement.innerHTML = `
                <div class="goal-info">
                    <h4>${goal.book_title}</h4>
                    <p class="goal-progress">
                        Progress: ${goal.daily_progress || 0} / ${goal.goal_quantity} ${goal.goal_type}
                    </p>
                </div>
                <div class="goal-actions">
                    ${!goal.completed ? `
                        <button onclick="updateProgress(${goal.id}, true)" class="progress-button">
                            <span class="icon">📖</span> +1
                        </button>
                        <button onclick="markGoalComplete(${goal.id})" class="complete-button">
                            <span class="icon">✓</span> Complete
                        </button>
                    ` : `
                        <span class="completed-text">✓ Done</span>
                    `}
                </div>
            `;
            goalsList.appendChild(goalElement);
        });
    } catch (error) {
        console.error('Error loading daily goals:', error);
        showToast('Failed to load daily goals');
    }
}

