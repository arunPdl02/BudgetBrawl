"""Snowflake connection management with SQLite fallback when Snowflake is unavailable."""

import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any

try:
    import snowflake.connector
    _SNOWFLAKE_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    snowflake = None  # type: ignore
    _SNOWFLAKE_AVAILABLE = False

from config import settings

_thread_local = threading.local()
_SQLITE_DB_PATH = Path(__file__).resolve().parent / "data" / "budgetbrawl.db"


def get_db_type() -> str:
    """Return 'snowflake' or 'sqlite' depending on which backend is active."""
    return "snowflake" if _SNOWFLAKE_AVAILABLE else "sqlite"


def _init_sqlite():
    """Ensure SQLite DB exists and has required tables."""
    _SQLITE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_SQLITE_DB_PATH))
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            display_name TEXT DEFAULT '',
            avatar_url TEXT DEFAULT '',
            google_refresh_token TEXT DEFAULT '',
            onboarding_done INTEGER DEFAULT 0,
            wallet_balance INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            txn_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            challenge_id INTEGER,
            txn_type TEXT NOT NULL,
            amount REAL NOT NULL,
            balance_after REAL NOT NULL,
            description TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS quiz_answers (
            user_id TEXT NOT NULL,
            question_key TEXT NOT NULL,
            answer_text TEXT DEFAULT '',
            PRIMARY KEY (user_id, question_key)
        );
    """)
    conn.commit()
    conn.close()


def _get_sqlite_connection():
    """Return a thread-local SQLite connection."""
    conn = getattr(_thread_local, "sqlite_connection", None)
    if conn is None:
        _init_sqlite()
        conn = sqlite3.connect(str(_SQLITE_DB_PATH))
        conn.row_factory = sqlite3.Row
        _thread_local.sqlite_connection = conn
    return conn


def _get_snowflake_connection():
    """Return a thread-local Snowflake connection."""
    conn = getattr(_thread_local, "connection", None)
    if conn is None or conn.is_closed():
        conn = snowflake.connector.connect(
            account=settings.SNOWFLAKE_ACCOUNT,
            user=settings.SNOWFLAKE_USER,
            password=settings.SNOWFLAKE_PASSWORD,
            database=settings.SNOWFLAKE_DATABASE,
            schema=settings.SNOWFLAKE_SCHEMA,
            warehouse=settings.SNOWFLAKE_WAREHOUSE,
            role=settings.SNOWFLAKE_ROLE,
        )
        _thread_local.connection = conn
    return conn


def _get_connection():
    """Return connection for active backend."""
    if _SNOWFLAKE_AVAILABLE:
        return _get_snowflake_connection()
    return _get_sqlite_connection()


def run_query(
    sql: str,
    params: tuple | dict | None = None,
    *,
    fetch: bool = True,
) -> list[dict[str, Any]]:
    """
    Execute a SQL statement and return results as a list of dicts.

    For INSERT/UPDATE/DELETE pass fetch=False to skip result fetching.
    Uses Snowflake when available, otherwise SQLite (local dev fallback).
    """
    params = params or ()
    if _SNOWFLAKE_AVAILABLE:
        conn = _get_snowflake_connection()
        with conn.cursor(snowflake.connector.DictCursor) as cur:  # type: ignore
            cur.execute(sql, params)
            if fetch:
                return cur.fetchall()
            return []
    conn = _get_sqlite_connection()
    sql_sqlite = sql.replace("%s", "?").replace("CURRENT_TIMESTAMP()", "datetime('now')")
    cur = conn.execute(sql_sqlite, params)
    if fetch:
        rows = cur.fetchall()
        return [{k.upper(): v for k, v in dict(r).items()} for r in rows]
    conn.commit()
    return []


@contextmanager
def transaction():
    """Context manager that wraps statements in an explicit transaction."""
    conn = _get_connection()
    if _SNOWFLAKE_AVAILABLE:
        conn.autocommit(False)
    else:
        conn.execute("BEGIN")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        if _SNOWFLAKE_AVAILABLE:
            conn.autocommit(True)


def run_query_in_txn(
    conn: "Any",
    sql: str,
    params: tuple | dict | None = None,
    *,
    fetch: bool = True,
) -> list[dict[str, Any]]:
    """Execute SQL on a connection that's already inside a transaction."""
    params = params or ()
    if _SNOWFLAKE_AVAILABLE:
        with conn.cursor(snowflake.connector.DictCursor) as cur:  # type: ignore
            cur.execute(sql, params)
            if fetch:
                return cur.fetchall()
            return []
    sql_sqlite = sql.replace("%s", "?").replace("CURRENT_TIMESTAMP()", "datetime('now')")
    cur = conn.execute(sql_sqlite, params)
    if fetch:
        rows = cur.fetchall()
        return [{k.upper(): v for k, v in dict(r).items()} for r in rows]
    return []
