"""Snowflake connection management with thread-local connections and run_query helper."""

import threading
from contextlib import contextmanager
from typing import Any

import snowflake.connector

from config import settings

_thread_local = threading.local()


def _get_connection() -> snowflake.connector.SnowflakeConnection:
    """Return a thread-local Snowflake connection, creating one if needed."""
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


def run_query(
    sql: str,
    params: tuple | dict | None = None,
    *,
    fetch: bool = True,
) -> list[dict[str, Any]]:
    """
    Execute a SQL statement and return results as a list of dicts.

    For INSERT/UPDATE/DELETE pass fetch=False to skip result fetching.
    """
    conn = _get_connection()
    with conn.cursor(snowflake.connector.DictCursor) as cur:
        cur.execute(sql, params or ())
        if fetch:
            return cur.fetchall()
        return []


@contextmanager
def transaction():
    """Context manager that wraps statements in an explicit transaction."""
    conn = _get_connection()
    conn.autocommit(False)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.autocommit(True)


def run_query_in_txn(
    conn: snowflake.connector.SnowflakeConnection,
    sql: str,
    params: tuple | dict | None = None,
    *,
    fetch: bool = True,
) -> list[dict[str, Any]]:
    """Execute SQL on a connection that's already inside a transaction."""
    with conn.cursor(snowflake.connector.DictCursor) as cur:
        cur.execute(sql, params or ())
        if fetch:
            return cur.fetchall()
        return []
