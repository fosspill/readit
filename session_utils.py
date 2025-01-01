from flask.sessions import SessionInterface, SessionMixin
from datetime import datetime
import sqlite3
import json
import secrets
from contextlib import contextmanager

class Session(dict, SessionMixin):
    def __init__(self, initial=None, sid=None):
        dict.__init__(self, initial or {})
        self.sid = sid
        self.modified = False

class SQLiteSessionInterface(SessionInterface):
    def __init__(self, db_path='sessions.db'):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    expiry TIMESTAMP NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_expiry ON sessions(expiry)")

    @contextmanager
    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def new_session(self):
        """Generate a new session"""
        return Session(sid=secrets.token_urlsafe(32))

    def open_session(self, app, request):
        session_id = request.cookies.get(app.config['SESSION_COOKIE_NAME'])
        if not session_id:
            return Session()

        with self._get_conn() as conn:
            # Clean up expired sessions
            conn.execute("DELETE FROM sessions WHERE expiry < datetime('now')")
            
            # Get session data
            row = conn.execute(
                "SELECT data FROM sessions WHERE session_id = ? AND expiry > datetime('now')",
                (session_id,)
            ).fetchone()

            if row:
                try:
                    data = json.loads(row[0])
                    return Session(data, sid=session_id)
                except:
                    return Session()

        return Session()

    def save_session(self, app, session, response):
        domain = self.get_cookie_domain(app)
        path = self.get_cookie_path(app)
        
        if not session:
            with self._get_conn() as conn:
                conn.execute("DELETE FROM sessions WHERE session_id = ?", (session.sid,))
            response.delete_cookie(app.config['SESSION_COOKIE_NAME'], domain=domain, path=path)
            return

        # If the session is modified to be empty, remove it.
        if not session and session.modified:
            with self._get_conn() as conn:
                conn.execute("DELETE FROM sessions WHERE session_id = ?", (session.sid,))
            response.delete_cookie(app.config['SESSION_COOKIE_NAME'], domain=domain, path=path)
            return

        # Generate new session ID if needed
        if not session.sid:
            session.sid = secrets.token_urlsafe(32)

        # Calculate expiry
        lifetime = app.permanent_session_lifetime
        expiry = datetime.utcnow() + lifetime

        # Save to database
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO sessions (session_id, data, expiry)
                VALUES (?, ?, ?)
                """,
                (session.sid, json.dumps(dict(session)), expiry)
            )

        # Set cookie
        response.set_cookie(
            app.config['SESSION_COOKIE_NAME'],
            session.sid,
            expires=expiry,
            httponly=True,
            domain=domain,
            path=path,
            secure=app.config['SESSION_COOKIE_SECURE'],
            samesite=app.config['SESSION_COOKIE_SAMESITE']
        )

def cleanup_expired_sessions(db_path='sessions.db'):
    """Utility function to clean up expired sessions"""
    try:
        with sqlite3.connect(db_path) as conn:
            conn.execute("DELETE FROM sessions WHERE expiry < datetime('now')")
    except Exception as e:
        print(f"Session cleanup error: {e}") 