"""Calendar events and predictions router."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, CalendarEvent, UserBehavior, Prediction
from app.schemas import CalendarEventSync, CalendarEventAdd
from app.services.calendar import sync_events
from app.services.prediction import get_numeric_values, predict_spend
from app.services.category import normalize_category

router = APIRouter()


@router.post("/sync")
async def sync_calendar(
    events: list[CalendarEventSync],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync calendar events (next 7 days)."""
    ev_data = [e.model_dump() for e in events]
    synced = await sync_events(db, user.id, ev_data)
    await db.commit()
    return {"synced": len(synced)}


@router.post("/add")
async def add_event(
    data: CalendarEventAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a single calendar event manually."""
    try:
        dt = datetime.fromisoformat(data.start_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_time format")
    now = datetime.now(timezone.utc)
    if dt < now or dt > now + timedelta(days=7):
        raise HTTPException(status_code=400, detail="Event must be in next 7 days")
    from app.services.calendar import add_event as add_event_svc

    ev = await add_event_svc(db, user.id, data.title, dt, data.location)
    await db.commit()
    await db.refresh(ev)
    return {"id": ev.id, "title": ev.title, "start_time": ev.start_time.isoformat(), "category": ev.normalized_category}


@router.get("/")
async def list_events(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List next 7 days calendar events with predictions."""
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(days=7)
    result = await db.execute(
        select(CalendarEvent, Prediction)
        .outerjoin(Prediction, Prediction.event_id == CalendarEvent.id)
        .where(
            CalendarEvent.user_id == user.id,
            CalendarEvent.start_time >= now,
            CalendarEvent.start_time < window_end,
        )
        .order_by(CalendarEvent.start_time)
    )
    rows = result.all()
    result_beh = await db.execute(select(UserBehavior).where(UserBehavior.user_id == user.id))
    behavior = result_beh.scalar_one_or_none()
    avg_lunch, weekly_transport, eat_out_mult = get_numeric_values(
        behavior.avg_lunch_band if behavior else None,
        behavior.weekly_transport_band if behavior else None,
        behavior.eat_out_band if behavior else None,
    )
    events_out = []
    for ev, pred in rows:
        pred_val = pred.predicted_total if pred else predict_spend(
            avg_lunch, weekly_transport, eat_out_mult,
            ev.normalized_category or "OTHER",
            ev.start_time,
        )
        events_out.append({
            "id": ev.id,
            "title": ev.title,
            "start_time": ev.start_time.isoformat(),
            "location": ev.location,
            "normalized_category": ev.normalized_category,
            "predicted_total": round(pred_val, 2),
        })
    return {"events": events_out}


@router.post("/{event_id}/predict")
async def compute_prediction(
    event_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Compute and store prediction for an event."""
    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == user.id)
    )
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    result_beh = await db.execute(select(UserBehavior).where(UserBehavior.user_id == user.id))
    behavior = result_beh.scalar_one_or_none()
    avg_lunch, weekly_transport, eat_out_mult = get_numeric_values(
        behavior.avg_lunch_band if behavior else None,
        behavior.weekly_transport_band if behavior else None,
        behavior.eat_out_band if behavior else None,
    )
    predicted = predict_spend(
        avg_lunch, weekly_transport, eat_out_mult,
        ev.normalized_category or "OTHER",
        ev.start_time,
    )
    result_pred = await db.execute(select(Prediction).where(Prediction.event_id == event_id))
    existing = result_pred.scalar_one_or_none()
    if existing:
        existing.predicted_total = predicted
    else:
        db.add(Prediction(event_id=event_id, predicted_total=predicted))
    await db.commit()
    return {"event_id": event_id, "predicted_total": predicted}
