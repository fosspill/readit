from typing import Tuple, Optional
import sqlite3
import bcrypt
from db_utils import init_db
import os
from utils import generate_memorable_code
from flask import session, current_app
from datetime import datetime, timedelta

class AuthManager:
    def __init__(self, db_path: str = 'readit.db'):
        self.db_path = db_path
        if not os.path.exists(db_path):
            init_db()

    def check_auth(self) -> Tuple[dict, int]:
        """Check if user is authenticated"""
        try:
            user_id = session.get('user_id')
            if user_id:
                # Refresh session
                session.modified = True
                return {"authenticated": True, "userId": user_id}, 200
            return {"authenticated": False}, 200
        except Exception as e:
            print(f"Auth check error: {e}")
            return {"authenticated": False}, 500

    def handle_login(self, username: str, password: str) -> Tuple[dict, int]:
        if not username or not password:
            return {"error": "Username and password are required"}, 400

        success, message, user_id = self.verify_login(username, password)
        
        if success and user_id:
            try:
                session.permanent = True
                session['user_id'] = user_id
                session['username'] = username
                session['logged_in_at'] = datetime.now().isoformat()
                session.modified = True
                
                return {
                    "success": True,
                    "userId": user_id,
                    "username": username,
                    "authenticated": True
                }, 200
            except Exception as e:
                print(f"Session error during login: {e}")
                return {"error": "Session error"}, 500
        else:
            return {"error": message}, 401

    def handle_register(self, username: str, password: str) -> Tuple[dict, int]:
        if not username or not password:
            return {"error": "Username and password are required"}, 400

        try:
            username_hash = bcrypt.hashpw(username.lower().encode('utf-8'), bcrypt.gensalt())
            success, message = self.register_user(username, password, username_hash)
            
            if success:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                try:
                    c.execute('SELECT id, friend_code FROM users WHERE username_hash = ?', (username_hash,))
                    user_id, friend_code = c.fetchone()
                    
                    session['user_id'] = user_id
                    session['username'] = username
                    session['logged_in_at'] = datetime.now().isoformat()
                    session.modified = True
                    
                    return {
                        "success": True,
                        "userId": user_id,
                        "authenticated": True,
                        "friendCode": friend_code
                    }, 200
                finally:
                    conn.close()
            else:
                return {"error": message}, 409
        except Exception as e:
            print(f"Registration error: {e}")
            return {"error": "Registration failed"}, 500

    def handle_logout(self) -> Tuple[dict, int]:
        try:
            session.clear()
            return {"success": True}, 200
        except Exception as e:
            print(f"Logout error: {e}")
            return {"error": "Logout failed"}, 500

    def register_user(self, username: str, password: str, username_hash: bytes) -> Tuple[bool, str]:
        try:
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            friend_code = generate_memorable_code()
            
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            try:
                c.execute("""
                    INSERT INTO users 
                    (username_hash, password_hash, friend_code) 
                    VALUES (?, ?, ?)
                """, (username_hash, password_hash, friend_code))
                conn.commit()
                return True, "Registration successful"
            except sqlite3.IntegrityError as e:
                if "username_hash" in str(e):
                    return False, "Username already exists"
                if "friend_code" in str(e):
                    return False, "Please try again"
                return False, "Registration failed"
        except Exception as e:
            print(f"Database error during registration: {e}")
            return False, "Registration failed"
        finally:
            if 'conn' in locals():
                conn.close()

    def verify_login(self, username: str, password: str) -> Tuple[bool, str, Optional[int]]:
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            c.execute('SELECT id, username_hash, password_hash FROM users')
            users = c.fetchall()
            
            username_bytes = username.lower().encode('utf-8')
            password_bytes = password.encode('utf-8')
            
            for user_id, stored_username_hash, stored_password_hash in users:
                try:
                    if bcrypt.checkpw(username_bytes, stored_username_hash):
                        if bcrypt.checkpw(password_bytes, stored_password_hash):
                            c.execute("""
                                UPDATE users 
                                SET last_login = CURRENT_TIMESTAMP,
                                    failed_attempts = 0,
                                    locked_until = NULL
                                WHERE id = ?
                            """, (user_id,))
                            conn.commit()
                            return True, "Login successful", user_id
                        
                        c.execute("""
                            UPDATE users 
                            SET failed_attempts = failed_attempts + 1
                            WHERE id = ?
                        """, (user_id,))
                        conn.commit()
                        return False, "Invalid username or password", None
                except Exception as e:
                    print(f"Error checking credentials: {e}")
                    continue
            
            return False, "Invalid username or password", None
                
        except Exception as e:
            print(f"Database error during login: {e}")
            return False, "Login failed", None
        finally:
            if 'conn' in locals():
                conn.close() 

    def update_password(self, user_id: int, new_password: str) -> Tuple[bool, str]:
        try:
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            c.execute("""
                UPDATE users 
                SET password_hash = ?
                WHERE id = ?
            """, (password_hash, user_id))
            
            conn.commit()
            return True, "Password updated successfully"
        except Exception as e:
            print(f"Password update error: {e}")
            return False, "Failed to update password"
        finally:
            if 'conn' in locals():
                conn.close() 

    def update_username(self, user_id: int, new_username: str) -> Tuple[bool, str]:
        try:
            username_hash = bcrypt.hashpw(new_username.lower().encode('utf-8'), bcrypt.gensalt())
            
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            # Check if username is already taken
            c.execute('SELECT 1 FROM users WHERE username_hash = ? AND id != ?', (username_hash, user_id))
            if c.fetchone():
                return False, "Username already taken"
            
            # Update username
            c.execute('UPDATE users SET username_hash = ? WHERE id = ?', (username_hash, user_id))
            conn.commit()
            
            return True, "Username updated successfully"
        except Exception as e:
            print(f"Username update error: {e}")
            return False, "Failed to update username"
        finally:
            if 'conn' in locals():
                conn.close() 