import sqlite3
from datetime import datetime, date
from contextlib import contextmanager

@contextmanager
def get_db():
    conn = sqlite3.connect('readit.db')
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        print("Starting database initialization...")
        
        # Update users table with auth fields and hashed username
        print("Creating users table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username_hash BLOB NOT NULL UNIQUE,
                password_hash BLOB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                failed_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP,
                friend_code TEXT UNIQUE
            )
        """)
        
        # Create books table
        print("Creating books table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS books (
                isbn TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL
            )
        """)
        
        # Create reading_list table
        print("Creating reading_list table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS reading_list (
                user_id INTEGER,
                book_isbn TEXT,
                PRIMARY KEY (user_id, book_isbn),
                FOREIGN KEY (book_isbn) REFERENCES books(isbn),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create reading_goals table
        print("Creating reading_goals table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS reading_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                book_isbn TEXT,
                goal_quantity INTEGER NOT NULL,
                goal_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                archived BOOLEAN DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (book_isbn) REFERENCES books(isbn)
            )
        """)
        
        # Create daily_reading_goals table
        print("Creating daily_reading_goals table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS daily_reading_goals (
                reading_goal_id INTEGER,
                date TEXT,
                daily_progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT 0,
                PRIMARY KEY (reading_goal_id, date),
                FOREIGN KEY (reading_goal_id) REFERENCES reading_goals(id)
            )
        """)
        
        # Create reading_clubs table with current book support
        print("Creating reading_clubs table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS reading_clubs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                join_code TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                current_book_isbn TEXT,
                book_set_at TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (current_book_isbn) REFERENCES books(isbn)
            )
        """)
        
        # Create club_members table
        print("Creating club_members table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS club_members (
                club_id INTEGER,
                user_id INTEGER,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (club_id, user_id),
                FOREIGN KEY (club_id) REFERENCES reading_clubs(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create friendships table
        print("Creating friendships table...")
        c.execute("""
            CREATE TABLE IF NOT EXISTS friendships (
                user_id1 INTEGER,
                user_id2 INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id1, user_id2),
                FOREIGN KEY (user_id1) REFERENCES users(id),
                FOREIGN KEY (user_id2) REFERENCES users(id)
            )
        """)
        
        c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            friend_code TEXT UNIQUE
        )
        ''')

        # Create books table
        c.execute('''
            CREATE TABLE IF NOT EXISTS books (
                isbn TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                cover_url TEXT
            )
        ''')

        # Create reading_list table
        c.execute('''
            CREATE TABLE IF NOT EXISTS reading_list (
                user_id INTEGER,
                book_isbn TEXT,
                added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_date TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (book_isbn) REFERENCES books (isbn),
                PRIMARY KEY (user_id, book_isbn)
            )
        ''')

        # Create reading_goals table
        c.execute('''
            CREATE TABLE IF NOT EXISTS reading_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                book_isbn TEXT,
                goal_type TEXT NOT NULL,
                goal_quantity INTEGER NOT NULL,
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_date TIMESTAMP,
                archived_date TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (book_isbn) REFERENCES books (isbn)
            )
        ''')

        # Create daily_progress table
        c.execute('''
            CREATE TABLE IF NOT EXISTS daily_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goal_id INTEGER,
                progress_date DATE,
                quantity INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT 0,
                FOREIGN KEY (goal_id) REFERENCES reading_goals (id)
            )
        ''')

        # Create reading_clubs table with current book support
        c.execute('''
            CREATE TABLE IF NOT EXISTS reading_clubs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_by INTEGER NOT NULL,
                join_code TEXT UNIQUE NOT NULL,
                current_book_isbn TEXT,
                book_set_at TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users (id),
                FOREIGN KEY (current_book_isbn) REFERENCES books (isbn)
            )
        ''')

        # Create club_members table
        c.execute('''
            CREATE TABLE IF NOT EXISTS club_members (
                club_id INTEGER,
                user_id INTEGER,
                joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (club_id) REFERENCES reading_clubs (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                PRIMARY KEY (club_id, user_id)
            )
        ''')

        conn.commit()
        print("Database initialization completed successfully!")
        return True
    except sqlite3.Error as e:
        print(f"Database initialization error: {e}")
        return False
    finally:
        conn.close()

def add_user(username):
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username) VALUES (?)", (username,))
        conn.commit()
        return c.lastrowid
    except sqlite3.Error as e:
        print(f"Error adding user: {e}")
        return None
    finally:
        conn.close()

def save_reading_goal(user_id: int, book_isbn: str, goal_quantity: int, goal_type: str) -> bool:
    """
    Save a new reading goal for a user.
    
    Args:
        user_id (int): The ID of the user setting the goal
        book_isbn (str): The ISBN of the book for the goal
        goal_quantity (int): The target quantity for the goal
        goal_type (str): The type of goal (pages, minutes, etc.)
        
    Returns:
        bool: True if goal was saved successfully, False otherwise
    """
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        # First verify the book exists
        c.execute("SELECT 1 FROM books WHERE isbn = ?", (book_isbn,))
        if not c.fetchone():
            print("Book not found")
            return False
            
        # Check if a similar active goal already exists
        c.execute("""
            SELECT 1 FROM reading_goals 
            WHERE user_id = ? 
            AND book_isbn = ? 
            AND archived = 0
        """, (user_id, book_isbn))
        
        if c.fetchone():
            print("Active goal already exists")
            return False
            
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
        return True
        
    except sqlite3.Error as e:
        print(f"Database error in save_reading_goal: {e}")
        return False
    finally:
        conn.close()

def update_daily_progress(user_id, pages_read, progress_date=None):
    if progress_date is None:
        progress_date = date.today()
    
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        c.execute("""
            INSERT OR REPLACE INTO daily_progress (user_id, date, pages_read)
            VALUES (?, ?, ?)
        """, (user_id, progress_date, pages_read))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error updating daily progress: {e}")
        return False
    finally:
        conn.close()

def get_streak_and_friends(user_id):
    if not user_id:  # Add authentication check
        return {'current_streak': 0, 'friends': []}
        
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        # Get user's current streak
        c.execute("""
            WITH RECURSIVE dates AS (
                SELECT date('now', '-30 days') as date
                UNION ALL
                SELECT date(date, '+1 day')
                FROM dates
                WHERE date < date('now')
            )
            SELECT COUNT(*) as streak
            FROM (
                SELECT d.date
                FROM dates d
                LEFT JOIN daily_reading_goals drg 
                    ON drg.date = d.date
                LEFT JOIN reading_goals rg 
                    ON drg.reading_goal_id = rg.id
                WHERE rg.user_id = ?
                GROUP BY d.date
                HAVING COUNT(CASE WHEN drg.completed = 1 THEN 1 END) > 0
                ORDER BY d.date DESC
            ) consecutive_days
        """, (user_id,))
        
        streak = c.fetchone()[0] or 0
        
        return {
            'current_streak': streak,
            'friends': []  # Placeholder for future friend system implementation
        }
    except sqlite3.Error as e:
        print(f"Error getting streak: {e}")
        return {'current_streak': 0, 'friends': []}
    finally:
        conn.close()

def get_reading_goals(user_id):
    if not user_id:  # Add authentication check
        return []
        
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        # Update query to include only active (non-completed) goals
        c.execute("""
            SELECT g.id, g.goal_quantity, g.goal_type, g.progress, g.completed,
                   b.title, b.author, b.isbn
            FROM reading_goals g
            JOIN books b ON g.book_isbn = b.isbn
            WHERE g.user_id = ? AND g.completed = 0
            ORDER BY g.created_at DESC
        """, (user_id,))
        
        goals = []
        for row in c.fetchall():
            goals.append({
                'id': row[0],
                'goal_quantity': row[1],
                'goal_type': row[2],
                'progress': row[3],
                'completed': row[4],
                'book_title': row[5],
                'book_author': row[6],
                'book_isbn': row[7]
            })
        return goals
    except sqlite3.Error as e:
        print(f"Error getting reading goals: {e}")
        return []
    finally:
        conn.close()

def verify_database():
    try:
        conn = sqlite3.connect('readit.db')
        c = conn.cursor()
        
        # Check if all required tables exist
        required_tables = ['users', 'books', 'reading_list', 'reading_goals', 'daily_progress', 'reading_clubs', 'club_members']
        
        # Get table info
        c.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
        tables = c.fetchall()
        
        existing_tables = {}
        for table in tables:
            name, schema = table
            existing_tables[name] = schema
            print(f"\nTable: {name}")
            print(f"Schema: {schema}")
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        
        if missing_tables:
            print(f"\nMissing tables: {missing_tables}")
            init_db()  # Reinitialize if any tables are missing
            return False
            
        return True
    except Exception as e:
        print(f"Error verifying database: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def get_reading_list(user_id):
    if not user_id:  # Add authentication check
        return []
        
    print(f"Getting reading list for user {user_id}")
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        c.execute("""
            SELECT b.isbn, b.title, b.author
            FROM reading_list rl
            JOIN books b ON rl.book_isbn = b.isbn
            WHERE rl.user_id = ?
        """, (user_id,))
        
        reading_list = []
        for row in c.fetchall():
            book = {
                "isbn": row[0],
                "title": row[1],
                "author": row[2]
            }
            reading_list.append(book)
        return reading_list
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return []
    finally:
        conn.close()

def add_book_to_reading_list(user_id, book_isbn):
    if not user_id:  # Add authentication check
        return False
        
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        # First check if the book is already in the user's reading list
        c.execute("""
            SELECT 1 FROM reading_list 
            WHERE user_id = ? AND book_isbn = ?
        """, (user_id, book_isbn))
        
        if c.fetchone():
            return True  # Book is already in the list
            
        c.execute("""
            INSERT INTO reading_list (user_id, book_isbn)
            VALUES (?, ?)
        """, (user_id, book_isbn))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Database error in add_book_to_reading_list: {e}")
        return False
    finally:
        conn.close()

def add_book_details(isbn, title, author):
    conn = sqlite3.connect('readit.db')
    c = conn.cursor()
    try:
        c.execute("""
            INSERT OR REPLACE INTO books (isbn, title, author)
            VALUES (?, ?, ?)
        """, (isbn, title, author))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Database error in add_book_details: {e}")
        return False
    finally:
        conn.close()

def update_goal_progress(user_id: int, goal_id: int, increment: bool = True) -> bool:
    with get_db() as conn:
        c = conn.cursor()
        c.execute("SELECT 1 FROM reading_goals WHERE id = ? AND user_id = ?", 
                 (goal_id, user_id))
        
        if not c.fetchone():
            return False
            
        c.execute("""
            UPDATE reading_goals 
            SET progress = progress + ?
            WHERE id = ? AND user_id = ?
        """, (1 if increment else -1, goal_id, user_id))
        
        return True
