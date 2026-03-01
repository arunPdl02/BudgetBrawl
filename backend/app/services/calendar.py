"""Calendar service - sync from Google or manual events."""

from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CalendarEvent, User
from app.services.category import normalize_category
from app.services.prediction import get_numeric_values, predict_spend


async def sync_events(
    db: AsyncSession,
    user_id: int,
    events: list[dict],
) -> list[CalendarEvent]:
    """
    Sync calendar events for user. Replace next 7 days.
    events: list of {title, start_time, location}
    """
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=7)

    # Delete existing events in window
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.user_id == user_id,
            CalendarEvent.start_time >= now,
            CalendarEvent.start_time < window_end,
        )
    )
    for ev in result.scalars().all():
        await db.delete(ev)
    await db.flush()

    created = []
    for ev_data in events:
        title = ev_data.get("title", "")
        start = ev_data.get("start_time")
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace("Z", "+00:00"))
        if not start or start < now or start >= window_end:
            continue
        location = ev_data.get("location")
        cat = normalize_category(title)
        event = CalendarEvent(
            user_id=user_id,
            title=title,
            start_time=start,
            location=location,
            normalized_category=cat,
        )
        db.add(event)
        await db.flush()
        created.append(event)
    await db.flush()
    for e in created:
        await db.refresh(e)
    return created


async def add_event(
    db: AsyncSession,
    user_id: int,
    title: str,
    start_time: datetime,
    location: str | None = None,
) -> CalendarEvent:
    """Add a single calendar event (manual)."""
    cat = normalize_category(title)
    event = CalendarEvent(
        user_id=user_id,
        title=title,
        start_time=start_time,
        location=location,
        normalized_category=cat,
    )
    db.add(event)
    await db.flush()
    return event
