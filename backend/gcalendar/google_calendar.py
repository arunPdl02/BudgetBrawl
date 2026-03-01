"""Google Calendar API helper using stored refresh token."""

import base64
from datetime import datetime, timedelta, timezone

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from config import settings


def _decrypt_token(encrypted: str) -> str:
    from cryptography.fernet import Fernet

    key = settings.ENCRYPTION_KEY.encode()
    f = Fernet(key)
    return f.decrypt(encrypted.encode()).decode()


def fetch_next_7_days(encrypted_refresh_token: str) -> list[dict]:
    """Return calendar events for the next 7 days."""
    refresh_token = _decrypt_token(encrypted_refresh_token)

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
    )

    service = build("calendar", "v3", credentials=creds)
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=7)

    result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=now.isoformat(),
            timeMax=end.isoformat(),
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )

    events = []
    for item in result.get("items", []):
        start = item["start"].get("dateTime") or item["start"].get("date")
        end_t = item["end"].get("dateTime") or item["end"].get("date")
        events.append(
            {
                "event_id": item["id"],
                "title": item.get("summary", ""),
                "start_time": start,
                "end_time": end_t,
                "description": item.get("description", ""),
                "location": item.get("location", ""),
            }
        )
    return events
