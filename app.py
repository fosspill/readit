from flask import Flask, render_template, request, jsonify
from db_utils import init_db, add_user, save_reading_goal, update_daily_progress, get_streak_and_friends, get_reading_list, add_book_to_reading_list, get_reading_goals, verify_database, add_book_details
from datetime import date, timedelta, datetime
import sqlite3
import isbnlib
import secrets
from auth_utils import AuthManager
from flask import session
from functools import wraps
from string import ascii_uppercase, digits
import random
import string

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# Initialize the database when starting the app
with app.app_context():
    init_db()
    verify_database()

# Initialize auth manager
auth_manager = AuthManager()

# Session security configuration
app.config.update(
    SESSION_COOKIE_SECURE=False,      # Only send cookie over HTTPS
    SESSION_COOKIE_HTTPONLY=True,    # Prevent JavaScript access to session cookie
    SESSION_COOKIE_SAMESITE='Lax',   # Protect against CSRF
    PERMANENT_SESSION_LIFETIME=timedelta(days=7),  # Session expires after 7 days
    SESSION_COOKIE_NAME='readit_session'  # Custom cookie name
)

class OpenBookAPI:
    def __init__(self):
        pass

    def search_books(self, query):
        try:
            # Search for books using isbnlib
            results = []
            books = isbnlib.goom(query)
            
            for book in books[:10]:  # Limit to 10 results
                # Extract metadata
                result = {
                    "title": book.get("Title", ""),
                    "author": book.get("Authors", [""])[0],  # Get first author
                    "isbn": book.get("ISBN-13", "")  # Get ISBN-13
                }
                # Only include if we have all required fields
                if result["title"] and result["author"] and result["isbn"]:
                    results.append(result)
            return results

        except Exception as e:
            print(f"Error searching books: {e}")
            return []

open_book_api = OpenBookAPI()

def refresh_session():
    """Refresh session if it's close to expiring"""
    if 'logged_in_at' in session:
        last_activity = datetime.fromisoformat(session['logged_in_at'])
        # Refresh if last activity was more than 6 days ago (1 day before expiration)
        if datetime.now() - last_activity > timedelta(days=6):
            session['logged_in_at'] = datetime.now().isoformat()
            session.modified = True

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        refresh_session()  # Refresh session on each authenticated request
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():

    return render_template('index.html')

@app.route('/api/search-books', methods=['POST'])
@login_required
def search_books():
    query = request.json.get('query', '')
    results = []
    
    try:
        # If the query looks like an ISBN, try to get book details directly
        if query.replace('-', '').isdigit() and len(query.replace('-', '')) in [10, 13]:
            book = isbnlib.meta(query)
            if book:
                results.append({
                    'isbn': query,
                    'title': book['Title'],
                    'author': book['Authors'][0] if book['Authors'] else 'Unknown Author'
                })
        else:
            # Use the OpenLibrary search for non-ISBN queries
            search_results = open_book_api.search_books(query)
            for book in search_results:
                # For each result, try to get additional metadata using isbnlib
                if 'isbn' in book and book['isbn']:
                    isbn = book['isbn'][0] if isinstance(book['isbn'], list) else book['isbn']
                    try:
                        metadata = isbnlib.meta(isbn)
                        if metadata:
                            results.append({
                                'isbn': isbn,
                                'title': metadata['Title'],
                                'author': metadata['Authors'][0] if metadata['Authors'] else 'Unknown Author'
                            })
                    except Exception as e:
                        print(f"Error getting metadata for ISBN {isbn}: {e}")
                        # Fall back to OpenLibrary data if isbnlib fails
                        results.append({
                            'isbn': isbn,
                            'title': book.get('title', 'Unknown Title'),
                            'author': book.get('author_name', ['Unknown Author'])[0] if book.get('author_name') else 'Unknown Author'
                        })
        
        print("Search results:", results)  # Debug log
        return jsonify(results)
        
    except Exception as e:
        print(f"Error in search_books: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/add-to-reading-list', methods=['POST'])
@login_required
def add_to_reading_list():
    data = request.json
    print("Received data:", data)
    
    try:
        user_id = data['user_id']
        book_isbn = data['book_isbn']
        
        # If title and author weren't provided, get them from isbnlib
        if 'book_title' not in data or 'book_author' not in data:
            metadata = isbnlib.meta(book_isbn)
            if metadata:
                book_title = metadata['Title']
                book_author = metadata['Authors'][0] if metadata['Authors'] else 'Unknown Author'
            else:
                return jsonify({"error": "Could not fetch book metadata"}), 400
        else:
            book_title = data['book_title']
            book_author = data['book_author']
        
        # Add book details and to reading list
        add_book_details(book_isbn, book_title, book_author)
        add_book_to_reading_list(user_id, book_isbn)
        
        return jsonify({
            "success": True,
            "book": {
                "isbn": book_isbn,
                "title": book_title,
                "author": book_author
            }
        })
        
    except Exception as e:
        error_msg = f"Error adding book to reading list: {str(e)}"
        print(error_msg)
        return jsonify({"error": error_msg}), 500

@app.route('/api/get-reading-list', methods=['GET'])
@login_required
def serve_get_reading_list():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    try:
        print(f"Getting reading list for user {user_id}")  # Debug log
        books = get_reading_list(user_id)
        print(f"Retrieved books: {books}")  # Debug log
        return jsonify(books)
    except Exception as e:
        print(f"Error in serve_get_reading_list: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/save-reading-goal', methods=['POST'])
@login_required
def servesave_reading_goal():
    try:
        data = request.json
        user_id = session.get('user_id')  # Get user_id from session
        
        if not user_id:
            return jsonify({"error": "Not authenticated"}), 401
        
        # Extract goal data
        book_isbn = data.get('book_isbn')
        goal_quantity = data.get('goal_quantity')
        goal_type = data.get('goal_type')
        
        if not all([book_isbn, goal_quantity, goal_type]):
            return jsonify({"error": "Missing required fields"}), 400
            
        # Save the goal using the db_utils function
        success = save_reading_goal(user_id, book_isbn, goal_quantity, goal_type)
        
        if success:
            return jsonify({"success": True})
        else:
            return jsonify({"error": "Failed to save goal"}), 500
            
    except Exception as e:
        print(f"Error saving reading goal: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-reading-goals', methods=['GET'])
@login_required
def get_user_reading_goals():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all recurring goals with book details
        c.execute("""
            SELECT 
                rg.id,
                b.title,
                rg.goal_quantity,
                rg.goal_type,
                rg.archived,
                b.author
            FROM reading_goals rg
            JOIN books b ON rg.book_isbn = b.isbn
            WHERE rg.user_id = ? 
            ORDER BY rg.created_at DESC
        """, (user_id,))
        
        goals = [{
            'id': row[0],
            'book_title': row[1],
            'goal_quantity': row[2],
            'goal_type': row[3],
            'archived': bool(row[4]),  # Changed from 'completed' to 'archived'
            'book_author': row[5]
        } for row in c.fetchall()]
        
        return jsonify(goals)
    except Exception as e:
        print(f"Error getting reading goals: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-todays-goals', methods=['GET'])
@login_required
def get_todays_goals():
    try:
        user_id = session.get('user_id')
        today = date.today().isoformat()
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all active (non-archived) goals with their daily progress
        c.execute("""
            SELECT 
                rg.id,
                b.title,
                rg.goal_quantity,
                rg.goal_type,
                COALESCE(drg.daily_progress, 0) as daily_progress,
                COALESCE(drg.completed, 0) as completed_today
            FROM reading_goals rg
            JOIN books b ON rg.book_isbn = b.isbn
            LEFT JOIN daily_reading_goals drg ON rg.id = drg.reading_goal_id 
                AND drg.date = ?
            WHERE rg.user_id = ? 
                AND rg.archived = 0
        """, (today, user_id))
        
        goals = [{
            'id': row[0],
            'book_title': row[1],
            'goal_quantity': row[2],
            'goal_type': row[3],
            'daily_progress': row[4],
            'completed_today': bool(row[5])
        } for row in c.fetchall()]
        
        # Simplified streak calculation
        c.execute("""
            WITH RECURSIVE dates(date) AS (
                SELECT date(?, '-30 days')
                UNION ALL
                SELECT date(date, '+1 day')
                FROM dates
                WHERE date < ?
            )
            SELECT COUNT(*) 
            FROM (
                SELECT d.date
                FROM dates d
                LEFT JOIN reading_goals rg ON rg.user_id = ? 
                    AND rg.archived = 0
                    AND rg.created_at <= date(d.date, '+1 day')
                LEFT JOIN daily_reading_goals drg 
                    ON drg.reading_goal_id = rg.id 
                    AND drg.date = d.date
                GROUP BY d.date
                HAVING COUNT(DISTINCT rg.id) > 0 
                    AND COUNT(DISTINCT rg.id) = COUNT(CASE WHEN drg.completed = 1 THEN 1 END)
                ORDER BY d.date DESC
            )
        """, (today, today, user_id))
        
        streak = c.fetchone()[0]
        
        print(f"Found {len(goals)} goals and streak of {streak} for user {user_id}")  # Debug logging
        
        return jsonify({
            'goals': goals,
            'streak': streak
        })
        
    except Exception as e:
        print(f"Error getting today's goals: {e}")
        return jsonify({"error": str(e)}), 500  # Changed to 500 for server errors
    finally:
        conn.close()

@app.route('/api/set-reading-goal', methods=['POST'])
@login_required
def set_reading_goal():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_id = session.get('user_id')  # Get user_id from session instead of request
        book_isbn = data.get('book_isbn')
        goal_quantity = data.get('goal_quantity')
        goal_type = data.get('goal_type')
        
        print(f"Setting goal: {goal_quantity} {goal_type} for book {book_isbn}")  # Debug log
        
        if not all([user_id, book_isbn, goal_quantity, goal_type]):
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        try:
            # First, verify the book exists
            c.execute("SELECT 1 FROM books WHERE isbn = ?", (book_isbn,))
            if not c.fetchone():
                return jsonify({"error": "Book not found"}), 404
            
            # Check if a similar active goal already exists
            c.execute("""
                SELECT 1 FROM reading_goals 
                WHERE user_id = ? 
                AND book_isbn = ? 
                AND archived = 0
            """, (user_id, book_isbn))
            
            if c.fetchone():
                return jsonify({"error": "An active goal already exists for this book"}), 400
            
            # Insert the new goal
            c.execute("""
                INSERT INTO reading_goals 
                (user_id, book_isbn, goal_quantity, goal_type, archived)
                VALUES (?, ?, ?, ?, 0)
            """, (user_id, book_isbn, goal_quantity, goal_type))
            
            goal_id = c.lastrowid
            
            # Initialize today's progress
            today = date.today().isoformat()
            c.execute("""
                INSERT INTO daily_reading_goals 
                (reading_goal_id, date, daily_progress, completed)
                VALUES (?, ?, 0, 0)
            """, (goal_id, today))
            
            conn.commit()
            
            print(f"Successfully created goal with ID {goal_id}")  # Debug log
            return jsonify({
                "success": True,
                "goal_id": goal_id
            })
            
        except sqlite3.IntegrityError as e:
            print(f"Database integrity error: {e}")  # Debug log
            return jsonify({"error": "Goal could not be created"}), 400
            
    except Exception as e:
        print(f"Error setting reading goal: {e}")  # Debug log
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/update-progress', methods=['POST'])
@login_required
def update_progress():
    try:
        user_id = session.get('user_id')
        goal_id = request.json.get('goal_id')
        increment = request.json.get('increment', True)
        decrement = request.json.get('decrement', False)
        reset = request.json.get('reset', False)
        today = date.today().isoformat()
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        try:
            # Get goal details
            c.execute("""
                SELECT goal_quantity 
                FROM reading_goals 
                WHERE id = ? AND user_id = ? AND archived = 0
            """, (goal_id, user_id))
            
            goal_row = c.fetchone()
            if not goal_row:
                return jsonify({"error": "Goal not found"}), 404
            
            goal_quantity = goal_row[0]
                
            # Get or create today's progress
            c.execute("""
                INSERT OR IGNORE INTO daily_reading_goals 
                (reading_goal_id, date, daily_progress, completed)
                VALUES (?, ?, 0, 0)
            """, (goal_id, today))
            
            # Update progress
            if reset:
                # Complete reset of progress and completion status
                c.execute("""
                    UPDATE daily_reading_goals 
                    SET daily_progress = 0,
                        completed = 0
                    WHERE reading_goal_id = ? AND date = ?
                """, (goal_id, today))
            elif increment:
                c.execute("""
                    UPDATE daily_reading_goals 
                    SET daily_progress = daily_progress + 1
                    WHERE reading_goal_id = ? AND date = ?
                """, (goal_id, today))
            else:
                c.execute("""
                    UPDATE daily_reading_goals 
                    SET daily_progress = MAX(0, daily_progress - 1),
                        completed = 0
                    WHERE reading_goal_id = ? AND date = ?
                """, (goal_id, today))
            
            # Check if goal is met
            c.execute("""
                SELECT daily_progress 
                FROM daily_reading_goals 
                WHERE reading_goal_id = ? AND date = ?
            """, (goal_id, today))
            
            current_progress = c.fetchone()[0]
            goal_met = current_progress >= goal_quantity
            
            # If goal is met, mark it as completed
            if goal_met:
                c.execute("""
                    UPDATE daily_reading_goals 
                    SET completed = 1
                    WHERE reading_goal_id = ? AND date = ?
                """, (goal_id, today))
            
            conn.commit()
            return jsonify({
                "success": True,
                "goalMet": goal_met
            })
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Database error"}), 500
            
    except Exception as e:
        print(f"Error updating progress: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/complete-daily-goal', methods=['POST'])
@login_required
def complete_daily_goal():
    try:
        user_id = session.get('user_id')
        goal_id = request.json.get('goal_id')
        today = date.today().isoformat()
        
        if not all([user_id, goal_id]):
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        try:
            # Verify goal belongs to user
            c.execute("""
                SELECT 1 FROM reading_goals 
                WHERE id = ? AND user_id = ? AND archived = 0
            """, (goal_id, user_id))
            
            if not c.fetchone():
                return jsonify({"error": "Goal not found"}), 404
                
            # Get or create today's progress
            c.execute("""
                INSERT OR IGNORE INTO daily_reading_goals 
                (reading_goal_id, date, daily_progress, completed)
                VALUES (?, ?, 0, 0)
            """, (goal_id, today))
            
            # Mark as completed
            c.execute("""
                UPDATE daily_reading_goals 
                SET completed = 1
                WHERE reading_goal_id = ? AND date = ?
            """, (goal_id, today))
            
            conn.commit()
            return jsonify({"success": True})
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Database error"}), 500
            
    except Exception as e:
        print(f"Error completing goal: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/archive-goal', methods=['POST'])
@login_required
def archive_goal():
    try:
        user_id = session.get('user_id')
        goal_id = request.json.get('goal_id')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Verify goal belongs to user
        c.execute("""
            SELECT 1 FROM reading_goals 
            WHERE id = ? AND user_id = ?
        """, (goal_id, user_id))
        
        if not c.fetchone():
            return jsonify({"success": False, "message": "Goal not found"}), 404
        
        # Mark goal as archived instead of completed
        c.execute("""
            UPDATE reading_goals 
            SET archived = 1 
            WHERE id = ? AND user_id = ?
        """, (goal_id, user_id))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/delete-goal', methods=['POST'])
@login_required
def delete_goal():
    try:
        user_id = session.get('user_id')
        goal_id = request.json.get('goal_id')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Verify goal belongs to user
        c.execute("""
            SELECT 1 FROM reading_goals 
            WHERE id = ? AND user_id = ?
        """, (goal_id, user_id))
        
        if not c.fetchone():
            return jsonify({"success": False, "message": "Goal not found"}), 404
        
        # Delete daily progress for this goal
        c.execute("""
            DELETE FROM daily_reading_goals 
            WHERE reading_goal_id = ?
        """, (goal_id,))
        
        # Delete the goal itself
        c.execute("""
            DELETE FROM reading_goals 
            WHERE id = ? AND user_id = ?
        """, (goal_id, user_id))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/mark-book-read', methods=['POST'])
@login_required
def mark_book_read():
    try:
        user_id = session.get('user_id')
        isbn = request.json.get('isbn')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all goals for this book
        c.execute("""
            SELECT id FROM reading_goals 
            WHERE user_id = ? AND book_isbn = ?
        """, (user_id, isbn))
        
        goal_ids = [row[0] for row in c.fetchall()]
        
        # Mark all goals as completed
        for goal_id in goal_ids:
            c.execute("""
                UPDATE reading_goals 
                SET completed = 1 
                WHERE id = ?
            """, (goal_id,))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/delete-book', methods=['POST'])
@login_required
def delete_book():
    try:
        user_id = session.get('user_id')
        isbn = request.json.get('isbn')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all goals for this book
        c.execute("""
            SELECT id FROM reading_goals 
            WHERE user_id = ? AND book_isbn = ?
        """, (user_id, isbn))
        
        goal_ids = [row[0] for row in c.fetchall()]
        
        # Delete daily progress for all goals
        for goal_id in goal_ids:
            c.execute("""
                DELETE FROM daily_reading_goals 
                WHERE reading_goal_id = ?
            """, (goal_id,))
        
        # Delete all goals for this book
        c.execute("""
            DELETE FROM reading_goals 
            WHERE user_id = ? AND book_isbn = ?
        """, (user_id, isbn))
        
        # Remove book from reading list
        c.execute("""
            DELETE FROM reading_list 
            WHERE user_id = ? AND book_isbn = ?
        """, (user_id, isbn))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    success, message = auth_manager.register_user(username, password)
    return jsonify({"success": success, "message": message})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    success, message, user_id = auth_manager.verify_login(username, password)
    if success:
        session.permanent = True
        session['user_id'] = user_id
        session['username'] = username
        session['logged_in_at'] = datetime.now().isoformat()
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user_id": user_id,
            "username": username
        })
    
    return jsonify({
        "success": False,
        "message": message
    }), 401  # Added 401 status code for failed login

@app.route('/api/verify-reset', methods=['POST'])
def verify_reset():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get('username')
    book_title = data.get('book_title')

    if not username or not book_title:
        return jsonify({"error": "Username and book title required"}), 400

    success, message = auth_manager.verify_password_reset(username, book_title)
    return jsonify({"success": success, "message": message})

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get('username')
    new_password = data.get('new_password')

    if not username or not new_password:
        return jsonify({"error": "Username and new password required"}), 400

    success, message = auth_manager.reset_password(username, new_password)
    return jsonify({"success": success, "message": message})

# Add a logout route to properly clear the session
@app.route('/api/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({"success": True, "message": "Logged out successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Add a route to check authentication status
@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        refresh_session()
        return jsonify({
            "authenticated": True,
            "user_id": session['user_id'],
            "username": session.get('username')
        })
    return jsonify({"authenticated": False}), 401

@app.route('/api/update-profile', methods=['POST'])
@login_required
def update_profile():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try:
        user_id = session.get('user_id')
        new_username = data.get('new_username')
        new_password = data.get('new_password')
        
        if new_username:
            auth_manager.update_username(user_id, new_username)
        
        if new_password:
            auth_manager.update_password(user_id, new_password)
        
        return jsonify({"success": True, "message": "Profile updated successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/clear-reading-list', methods=['POST'])
@login_required
def clear_reading_list():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        c.execute("DELETE FROM reading_list WHERE user_id = ?", (user_id,))
        conn.commit()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/clear-reading-goals', methods=['POST'])
@login_required
def clear_reading_goals():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all goal IDs for the user
        c.execute("SELECT id FROM reading_goals WHERE user_id = ?", (user_id,))
        goal_ids = [row[0] for row in c.fetchall()]
        
        # Delete daily progress for these goals
        for goal_id in goal_ids:
            c.execute("DELETE FROM daily_reading_goals WHERE reading_goal_id = ?", (goal_id,))
        
        # Delete the goals themselves
        c.execute("DELETE FROM reading_goals WHERE user_id = ?", (user_id,))
        conn.commit()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        # First, add a new column to reading_goals if it doesn't exist
        c.execute("""
        CREATE TABLE IF NOT EXISTS reading_goals_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            book_isbn TEXT,
            goal_quantity INTEGER NOT NULL,
            goal_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            archived BOOLEAN DEFAULT 0,  -- Changed 'completed' to 'archived'
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_isbn) REFERENCES books(isbn)
        )
        """)
        
        # If the table already existed, migrate the data
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='reading_goals'")
        if c.fetchone():
            # Copy data to new table, setting archived = completed
            c.execute("""
                INSERT INTO reading_goals_new (id, user_id, book_isbn, goal_quantity, goal_type, created_at, archived)
                SELECT id, user_id, book_isbn, goal_quantity, goal_type, created_at, completed
                FROM reading_goals
            """)
            c.execute("DROP TABLE reading_goals")
            c.execute("ALTER TABLE reading_goals_new RENAME TO reading_goals")

        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Database migration error: {e}")
        return False
    finally:
        conn.close()

def generate_memorable_code(length=6):
    """Generate a memorable code using uppercase letters and numbers"""
    # Use only easily distinguishable characters
    chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'  # Removed similar-looking characters
    return ''.join(random.choice(chars) for _ in range(length))

@app.route('/api/create-club', methods=['POST'])
@login_required
def create_club():
    try:
        data = request.json
        club_name = data.get('name')
        user_id = session.get('user_id')
        
        if not club_name:
            return jsonify({"error": "Club name is required"}), 400
            
        # Generate unique join code
        while True:
            join_code = generate_memorable_code()
            # Check if code already exists
            conn = sqlite3.connect('readit.db')
            c = conn.cursor()
            c.execute("SELECT 1 FROM reading_clubs WHERE join_code = ?", (join_code,))
            if not c.fetchone():
                break
        
        # Create the club
        c.execute("""
            INSERT INTO reading_clubs (name, join_code, created_by)
            VALUES (?, ?, ?)
        """, (club_name, join_code, user_id))
        
        club_id = c.lastrowid
        
        # Add creator as first member
        c.execute("""
            INSERT INTO club_members (club_id, user_id)
            VALUES (?, ?)
        """, (club_id, user_id))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "club_id": club_id,
            "join_code": join_code
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/join-club', methods=['POST'])
@login_required
def join_club():
    try:
        join_code = request.json.get('join_code')
        user_id = session.get('user_id')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Find club by join code
        c.execute("SELECT id FROM reading_clubs WHERE join_code = ?", (join_code,))
        result = c.fetchone()
        
        if not result:
            return jsonify({"error": "Invalid join code"}), 404
            
        club_id = result[0]
        
        # Add user to club
        try:
            c.execute("""
                INSERT INTO club_members (club_id, user_id)
                VALUES (?, ?)
            """, (club_id, user_id))
            conn.commit()
            return jsonify({"success": True})
        except sqlite3.IntegrityError:
            return jsonify({"error": "Already a member of this club"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/add-friend', methods=['POST'])
@login_required
def add_friend():
    try:
        friend_code = request.json.get('friend_code')
        user_id = session.get('user_id')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Find user by friend code
        c.execute("SELECT id FROM users WHERE friend_code = ?", (friend_code,))
        result = c.fetchone()
        
        if not result:
            return jsonify({"error": "Invalid friend code"}), 404
            
        friend_id = result[0]
        
        if friend_id == user_id:
            return jsonify({"error": "Cannot add yourself as a friend"}), 400
            
        # Add friendship (both ways)
        try:
            c.execute("""
                INSERT INTO friendships (user_id1, user_id2)
                VALUES (?, ?), (?, ?)
            """, (user_id, friend_id, friend_id, user_id))
            conn.commit()
            return jsonify({"success": True})
        except sqlite3.IntegrityError:
            return jsonify({"error": "Already friends"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-clubs', methods=['GET'])
@login_required
def get_clubs():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all clubs with current book info and reader count
        c.execute("""
            WITH reader_counts AS (
                SELECT rc.id as club_id, COUNT(DISTINCT rl.user_id) as readers
                FROM reading_clubs rc
                LEFT JOIN reading_list rl ON rc.current_book_isbn = rl.book_isbn
                GROUP BY rc.id
            )
            SELECT 
                rc.id,
                rc.name,
                rc.join_code,
                rc.created_by,
                COUNT(cm2.user_id) as member_count,
                rc.current_book_isbn,
                b.title as book_title,
                rc.book_set_at,
                r.readers as readers_count,
                EXISTS(
                    SELECT 1 FROM reading_list rl 
                    WHERE rl.user_id = ? AND rl.book_isbn = rc.current_book_isbn
                ) as in_my_list
            FROM reading_clubs rc
            JOIN club_members cm ON rc.id = cm.club_id
            LEFT JOIN club_members cm2 ON rc.id = cm2.club_id
            LEFT JOIN books b ON rc.current_book_isbn = b.isbn
            LEFT JOIN reader_counts r ON rc.id = r.club_id
            WHERE cm.user_id = ?
            GROUP BY rc.id
        """, (user_id, user_id))
        
        clubs = []
        for row in c.fetchall():
            club = {
                'id': row[0],
                'name': row[1],
                'join_code': row[2] if row[3] == user_id else None,
                'is_owner': row[3] == user_id,
                'member_count': row[4],
                'current_book': {
                    'isbn': row[5],
                    'title': row[6],
                    'in_my_list': bool(row[9])
                } if row[5] else None,
                'readers_count': row[8] or 0
            }
            clubs.append(club)
        
        return jsonify(clubs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-friends', methods=['GET'])
@login_required
def get_friends():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get all friends and their current streaks
        c.execute("""
            WITH friend_streaks AS (
                SELECT 
                    u.id as friend_id,
                    COUNT(DISTINCT drg.date) as streak
                FROM users u
                LEFT JOIN reading_goals rg ON u.id = rg.user_id
                LEFT JOIN daily_reading_goals drg ON rg.id = drg.reading_goal_id
                WHERE drg.completed = 1
                AND drg.date >= date('now', '-30 days')
                GROUP BY u.id
            )
            SELECT 
                u.id,
                u.friend_code,
                COALESCE(fs.streak, 0) as streak
            FROM friendships f
            JOIN users u ON f.user_id2 = u.id
            LEFT JOIN friend_streaks fs ON u.id = fs.friend_id
            WHERE f.user_id1 = ?
        """, (user_id,))
        
        friends = []
        for row in c.fetchall():
            friends.append({
                'id': row[0],
                'username': row[1],
                'streak': row[2]
            })
        
        return jsonify(friends)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/leave-club/<int:club_id>', methods=['POST'])
@login_required
def leave_club(club_id):
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Check if user is the owner
        c.execute("SELECT created_by FROM reading_clubs WHERE id = ?", (club_id,))
        result = c.fetchone()
        if result and result[0] == user_id:
            return jsonify({"error": "Club owner cannot leave. Delete the club instead."}), 400
        
        # Remove user from club
        c.execute("""
            DELETE FROM club_members 
            WHERE club_id = ? AND user_id = ?
        """, (club_id, user_id))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/delete-club/<int:club_id>', methods=['POST'])
@login_required
def delete_club(club_id):
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Verify user is the owner
        c.execute("SELECT 1 FROM reading_clubs WHERE id = ? AND created_by = ?", (club_id, user_id))
        if not c.fetchone():
            return jsonify({"error": "Not authorized to delete this club"}), 403
        
        # Delete all members first (due to foreign key constraints)
        c.execute("DELETE FROM club_members WHERE club_id = ?", (club_id,))
        
        # Delete the club
        c.execute("DELETE FROM reading_clubs WHERE id = ?", (club_id,))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/remove-friend/<int:friend_id>', methods=['POST'])
@login_required
def remove_friend(friend_id):
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Remove friendship in both directions
        c.execute("""
            DELETE FROM friendships 
            WHERE (user_id1 = ? AND user_id2 = ?)
            OR (user_id1 = ? AND user_id2 = ?)
        """, (user_id, friend_id, friend_id, user_id))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-profile', methods=['GET'])
@login_required
def get_profile():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get user's reading goals
        c.execute("""
            SELECT 
                rg.id,
                b.title as book_title,
                rg.goal_quantity,
                rg.goal_type
            FROM reading_goals rg
            JOIN books b ON rg.book_isbn = b.isbn
            WHERE rg.user_id = ? AND rg.archived = 0
        """, (user_id,))
        goals = [{'id': row[0], 'book_title': row[1], 'goal_quantity': row[2], 'goal_type': row[3]} 
                for row in c.fetchall()]

        # Get user's reading list
        c.execute("""
            SELECT b.isbn, b.title, b.author
            FROM reading_list rl
            JOIN books b ON rl.book_isbn = b.isbn
            WHERE rl.user_id = ?
        """, (user_id,))
        books = [{'isbn': row[0], 'title': row[1], 'author': row[2]} 
                for row in c.fetchall()]

        return jsonify({
            'success': True,
            'goals': goals,
            'books': books
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/update-username', methods=['POST'])
@login_required
def update_username():
    try:
        user_id = session.get('user_id')
        new_username = request.json.get('new_username')
        
        if not new_username:
            return jsonify({"error": "New username is required"}), 400
            
        success, message = auth_manager.update_username(user_id, new_username)
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/update-password', methods=['POST'])
@login_required
def update_password():
    try:
        user_id = session.get('user_id')
        new_password = request.json.get('new_password')
        
        if not new_password:
            return jsonify({"error": "New password is required"}), 400
            
        success, message = auth_manager.update_password(user_id, new_password)
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/delete-account', methods=['POST'])
@login_required
def delete_account():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Delete all user data in the correct order (due to foreign key constraints)
        c.execute("DELETE FROM daily_reading_goals WHERE reading_goal_id IN (SELECT id FROM reading_goals WHERE user_id = ?)", (user_id,))
        c.execute("DELETE FROM reading_goals WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM reading_list WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM club_members WHERE user_id = ?", (user_id,))
        c.execute("DELETE FROM friendships WHERE user_id1 = ? OR user_id2 = ?", (user_id, user_id))
        c.execute("DELETE FROM users WHERE id = ?", (user_id,))
        
        conn.commit()
        session.clear()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-friend-code')
@login_required
def get_friend_code():
    try:
        user_id = session.get('user_id')
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get the user's friend code
        c.execute("SELECT friend_code FROM users WHERE id = ?", (user_id,))
        result = c.fetchone()
        
        if result and result[0]:
            friend_code = result[0]
        else:
            # Generate a new friend code if none exists
            friend_code = generate_unique_code()
            c.execute("UPDATE users SET friend_code = ? WHERE id = ?", (friend_code, user_id))
            conn.commit()
        
        return jsonify({"success": True, "friend_code": friend_code})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

def generate_unique_code(length=8):
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        # Check if code already exists
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM users WHERE friend_code = ?", (code,))
        if c.fetchone()[0] == 0:
            conn.close()
            return code
        conn.close()

@app.route('/api/update-friend-code', methods=['POST'])
@login_required
def update_friend_code():
    try:
        user_id = session.get('user_id')
        new_code = request.json.get('friend_code')
        
        if not new_code:
            return jsonify({"error": "Nickname cannot be empty"}), 400
            
        if len(new_code) > 15:
            return jsonify({"error": "Nickname too long (max 15 characters)"}), 400
            
        # Check if code contains only valid characters
        if not all(c.isalnum() or c.isspace() for c in new_code):
            return jsonify({"error": "Nickname can only contain letters, numbers, and spaces"}), 400
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Check if code is already taken by another user
        c.execute("SELECT id FROM users WHERE friend_code = ? AND id != ?", (new_code, user_id))
        if c.fetchone():
            return jsonify({"error": "This nickname is already taken"}), 400
        
        # Update the friend code
        c.execute("UPDATE users SET friend_code = ? WHERE id = ?", (new_code, user_id))
        conn.commit()
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/set-club-book', methods=['POST'])
@login_required
def set_club_book():
    try:
        user_id = session.get('user_id')
        club_id = request.json.get('club_id')
        book_isbn = request.json.get('book_isbn')
        
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Verify user is club owner
        c.execute("SELECT 1 FROM reading_clubs WHERE id = ? AND created_by = ?", (club_id, user_id))
        if not c.fetchone():
            return jsonify({"error": "Not authorized to set club book"}), 403
        
        # Update club's current book
        c.execute("""
            UPDATE reading_clubs 
            SET current_book_isbn = ?, book_set_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (book_isbn, club_id))
        
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/get-daily-goals', methods=['GET'])
@login_required
def get_daily_goals():
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({"error": "Not authenticated"}), 401

        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Get today's goals and their progress
        today = date.today().isoformat()
        c.execute("""
            SELECT 
                rg.id,
                b.title as book_title,
                rg.goal_quantity,
                rg.goal_type,
                drg.daily_progress,
                drg.completed
            FROM reading_goals rg
            JOIN books b ON rg.book_isbn = b.isbn
            LEFT JOIN daily_reading_goals drg 
                ON drg.reading_goal_id = rg.id 
                AND drg.date = ?
            WHERE rg.user_id = ? 
            AND rg.archived = 0
        """, (today, user_id))
        
        goals = []
        for row in c.fetchall():
            goals.append({
                'id': row[0],
                'book_title': row[1],
                'goal_quantity': row[2],
                'goal_type': row[3],
                'daily_progress': row[4] or 0,
                'completed': bool(row[5])
            })
        
        return jsonify(goals)
        
    except Exception as e:
        print(f"Error getting daily goals: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
