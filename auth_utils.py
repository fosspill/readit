import bcrypt
from datetime import datetime, timedelta
import secrets
import sqlite3
from typing import Optional, Tuple

class AuthManager:
    def __init__(self, db_path: str = 'readit.db'):
        self.db_path = db_path
        self._init_auth_tables()

    def _init_auth_tables(self) -> None:
        """Initialize authentication-related database tables."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        try:
            # Update users table with hashed username
            c.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username_hash BLOB NOT NULL UNIQUE,
                    password_hash BLOB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    failed_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP
                )
            """)
            conn.commit()
        finally:
            conn.close()

    def register_user(self, username: str, password: str) -> Tuple[bool, str]:
        """Register a new user with the given username and password."""
        try:
            # Hash both username and password
            username_hash = bcrypt.hashpw(username.lower().encode('utf-8'), bcrypt.gensalt())
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            try:
                c.execute("INSERT INTO users (username_hash, password_hash) VALUES (?, ?)",
                         (username_hash, password_hash))
                conn.commit()
                return True, "Registration successful"
            except sqlite3.IntegrityError:
                return False, "Username already exists"
        except Exception as e:
            return False, f"Registration failed: {str(e)}"
        finally:
            conn.close()

    def verify_login(self, username: str, password: str) -> Tuple[bool, str, Optional[int]]:
        """Verify user login credentials."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Get all users to find matching username hash
            c.execute("SELECT id, username_hash, password_hash, failed_attempts, locked_until FROM users")
            users = c.fetchall()
            user = None
            
            # Find matching user by comparing hashed usernames
            for uid, stored_username_hash, stored_pass_hash, failed_attempts, locked_until in users:
                if bcrypt.checkpw(username.lower().encode('utf-8'), stored_username_hash):
                    user = (uid, stored_pass_hash, failed_attempts, locked_until)
                    break
                
            if not user:
                return False, "Invalid username or password", None

            user_id, stored_hash, failed_attempts, locked_until = user
            
            if locked_until and datetime.fromisoformat(locked_until) > datetime.now():
                return False, "Account is temporarily locked", None

            if bcrypt.checkpw(password.encode('utf-8'), stored_hash):
                c.execute("""
                    UPDATE users 
                    SET failed_attempts = 0, 
                        locked_until = NULL, 
                        last_login = CURRENT_TIMESTAMP 
                    WHERE id = ?
                """, (user_id,))
                conn.commit()
                return True, "Login successful", user_id
                
            c.execute("""
                UPDATE users 
                SET failed_attempts = failed_attempts + 1,
                    locked_until = CASE 
                        WHEN failed_attempts >= 4 THEN datetime('now', '+15 minutes')
                        ELSE NULL 
                    END
                WHERE id = ?
            """, (user_id,))
            conn.commit()
            return False, "Invalid username or password", None

        finally:
            conn.close()

    def verify_password_reset(self, username: str, book_title: str) -> Tuple[bool, str]:
        """Verify password reset attempt using a book from user's reading list."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        try:
            # Get all users since we need to check hashed usernames
            c.execute("""
                SELECT u.id, u.username_hash
                FROM users u
                JOIN reading_list rl ON u.id = rl.user_id
                JOIN books b ON rl.book_isbn = b.isbn
                WHERE LOWER(b.title) = LOWER(?)
            """, (book_title,))
            
            potential_matches = c.fetchall()
            user_id = None
            
            # Find matching user by comparing hashed usernames
            for uid, stored_username_hash in potential_matches:
                if bcrypt.checkpw(username.lower().encode('utf-8'), stored_username_hash):
                    user_id = uid
                    break
                
            if not user_id:
                return False, "Invalid username or book title"

            # Log the reset attempt
            c.execute("""
                INSERT INTO password_reset_attempts (user_id, successful)
                VALUES (?, ?)
            """, (user_id, True))
            
            conn.commit()
            return True, "Password reset verification successful"

        except Exception as e:
            return False, f"Verification failed: {str(e)}"
        finally:
            conn.close()

    def reset_password(self, username: str, new_password: str) -> Tuple[bool, str]:
        """Reset user's password after successful verification."""
        try:
            # Generate new password hash
            new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            # Get all users to find matching username hash
            c.execute("SELECT id, username_hash FROM users")
            users = c.fetchall()
            user_id = None
            
            # Find matching user by comparing hashed usernames
            for uid, stored_username_hash in users:
                if bcrypt.checkpw(username.lower().encode('utf-8'), stored_username_hash):
                    user_id = uid
                    break
            
            if not user_id:
                return False, "User not found"
            
            c.execute("""
                UPDATE users 
                SET password_hash = ?,
                    failed_attempts = 0,
                    locked_until = NULL
                WHERE id = ?
            """, (new_password_hash, user_id))
            
            if c.rowcount == 0:
                return False, "Password reset failed"

            conn.commit()
            return True, "Password reset successful"

        except Exception as e:
            return False, f"Password reset failed: {str(e)}"
        finally:
            conn.close()

    def update_password(self, user_id: int, new_password: str) -> Tuple[bool, str]:
        """Update user's password."""
        try:
            # Generate new password hash
            new_password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())

            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            c.execute("""
                UPDATE users 
                SET password_hash = ?,
                    failed_attempts = 0,
                    locked_until = NULL
                WHERE id = ?
            """, (new_password_hash, user_id))
            
            if c.rowcount == 0:
                return False, "User not found"

            conn.commit()
            return True, "Password updated successfully"

        except Exception as e:
            return False, f"Password update failed: {str(e)}"
        finally:
            conn.close()

    def update_username(self, user_id: int, new_username: str) -> Tuple[bool, str]:
        """Update user's username."""
        try:
            # Hash new username
            new_username_hash = bcrypt.hashpw(new_username.lower().encode('utf-8'), bcrypt.gensalt())

            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            try:
                c.execute("""
                    UPDATE users 
                    SET username_hash = ?
                    WHERE id = ?
                """, (new_username_hash, user_id))
                
                if c.rowcount == 0:
                    return False, "User not found"

                conn.commit()
                return True, "Username updated successfully"
            except sqlite3.IntegrityError:
                return False, "Username already exists"

        except Exception as e:
            return False, f"Username update failed: {str(e)}"
        finally:
            conn.close() 