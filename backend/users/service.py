"""User upsert and lookup service."""

from database import get_db_type, run_query


def upsert_user(
    user_id: str,
    email: str,
    display_name: str,
    avatar_url: str,
    encrypted_refresh_token: str,
) -> None:
    params = (user_id, email, display_name, avatar_url, encrypted_refresh_token)
    if get_db_type() == "snowflake":
        run_query(
            """
            MERGE INTO users AS tgt
            USING (SELECT %s AS user_id, %s AS email, %s AS display_name,
                          %s AS avatar_url, %s AS google_refresh_token) AS src
            ON tgt.user_id = src.user_id
            WHEN MATCHED THEN UPDATE SET
                email                = src.email,
                display_name         = src.display_name,
                avatar_url           = src.avatar_url,
                google_refresh_token = src.google_refresh_token,
                updated_at           = CURRENT_TIMESTAMP()
            WHEN NOT MATCHED THEN INSERT
                (user_id, email, display_name, avatar_url, google_refresh_token)
            VALUES
                (src.user_id, src.email, src.display_name, src.avatar_url, src.google_refresh_token)
            """,
            params,
            fetch=False,
        )
    else:
        run_query(
            """
            INSERT INTO users (user_id, email, display_name, avatar_url, google_refresh_token, updated_at)
            VALUES (%s, %s, %s, %s, %s, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
                email = excluded.email,
                display_name = excluded.display_name,
                avatar_url = excluded.avatar_url,
                google_refresh_token = excluded.google_refresh_token,
                updated_at = datetime('now')
            """,
            params,
            fetch=False,
        )


def find_by_email(email: str) -> dict | None:
    rows = run_query(
        "SELECT user_id, email, display_name, avatar_url FROM users WHERE email = %s",
        (email,),
    )
    return rows[0] if rows else None
