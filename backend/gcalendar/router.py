"""Calendar router: POST /calendar/sync."""

from fastapi import APIRouter, Depends

from auth.jwt_utils import get_current_user
from gcalendar.service import list_events, sync_calendar

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.post("/sync")
def sync(current_user: dict = Depends(get_current_user)):
    events = sync_calendar(current_user["sub"])
    return {"synced": len(events), "events": events}


@router.get("/events")
def events(current_user: dict = Depends(get_current_user)):
    return list_events(current_user["sub"])
