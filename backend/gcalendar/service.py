"""Calendar sync service."""

from fastapi import HTTPException

from database import run_query
from gcalendar.google_calendar import fetch_next_7_days


def sync_calendar(user_id: str) -> list[dict]:
    """Fetch Google Calendar events and upsert into Snowflake."""
    rows = run_query(
        "SELECT google_refresh_token FROM users WHERE user_id = %s",
        (user_id,),
    )
    if not rows or not rows[0].get("GOOGLE_REFRESH_TOKEN"):
        raise HTTPException(status_code=400, detail="No Google refresh token on file")

    encrypted_token = rows[0]["GOOGLE_REFRESH_TOKEN"]
    try:
        events = fetch_next_7_days(encrypted_token)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Google Calendar fetch failed: {exc}"
        )

    sql = """
        MERGE INTO calendar_events AS tgt
        USING (SELECT %s AS event_id, %s AS user_id, %s AS title,
                      %s::TIMESTAMP_TZ AS start_time, %s::TIMESTAMP_TZ AS end_time,
                      %s AS description, %s AS location) AS src
        ON tgt.event_id = src.event_id AND tgt.user_id = src.user_id
        WHEN MATCHED THEN UPDATE SET
            title = src.title, start_time = src.start_time, end_time = src.end_time,
            description = src.description, location = src.location,
            synced_at = CURRENT_TIMESTAMP()
        WHEN NOT MATCHED THEN INSERT
            (event_id, user_id, title, start_time, end_time, description, location)
        VALUES
            (src.event_id, src.user_id, src.title, src.start_time, src.end_time,
             src.description, src.location)
    """

    try:
        for ev in events:
            run_query(
                sql,
                (
                    ev["event_id"], user_id, ev["title"],
                    ev["start_time"], ev["end_time"],
                    ev["description"], ev["location"],
                ),
                fetch=False,
            )
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Calendar save failed: {exc}"
        )

    # --- Clean up deleted/cancelled events ---
    synced_ids = [ev["event_id"] for ev in events]

    if synced_ids:
        placeholders = ", ".join(["%s"] * len(synced_ids))
        not_in_clause = f"event_id NOT IN ({placeholders})"
        params: tuple = (user_id, *synced_ids)
    else:
        # No events from Google — all events in the window are orphaned
        not_in_clause = "1=1"
        params = (user_id,)

    # Delete orphaned predictions (only if not referenced by a challenge)
    run_query(
        f"""
        DELETE FROM spending_predictions
        WHERE user_id = %s
          AND {not_in_clause}
          AND prediction_id NOT IN (SELECT prediction_id FROM challenges)
        """,
        params,
        fetch=False,
    )

    # Delete orphaned calendar events in the 7-day future window
    run_query(
        f"""
        DELETE FROM calendar_events
        WHERE user_id = %s
          AND start_time >= CURRENT_TIMESTAMP()
          AND start_time <= DATEADD('day', 7, CURRENT_TIMESTAMP())
          AND {not_in_clause}
        """,
        params,
        fetch=False,
    )

    return events


def list_events(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT ce.event_id, ce.title, ce.start_time, ce.end_time,
               ce.description, ce.location,
               sp.prediction_id, sp.predicted_amount, sp.suggested_limit, sp.reasoning_text
        FROM calendar_events ce
        LEFT JOIN spending_predictions sp
            ON sp.event_id = ce.event_id AND sp.user_id = ce.user_id
        WHERE ce.user_id = %s
          AND ce.start_time >= CURRENT_TIMESTAMP()
          AND ce.start_time <= DATEADD('day', 7, CURRENT_TIMESTAMP())
        ORDER BY ce.start_time
        """,
        (user_id,),
    )
