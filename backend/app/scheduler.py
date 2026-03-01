"""APScheduler background jobs for auto-resolve."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database import async_session_maker
from app.services.challenges import auto_resolve_expired, expire_pending_before_event


async def run_auto_resolve():
    """Auto-resolve challenges where subject failed to submit within 24h."""
    async with async_session_maker() as db:
        try:
            count = await auto_resolve_expired(db)
            await db.commit()
            if count:
                print(f"[AutoResolve] Resolved {count} challenges (opponent wins)")
        except Exception as e:
            await db.rollback()
            print(f"[AutoResolve] Error: {e}")


async def run_expire_pending():
    """Expire pending challenges where event has started."""
    async with async_session_maker() as db:
        try:
            count = await expire_pending_before_event(db)
            await db.commit()
            if count:
                print(f"[ExpirePending] Expired {count} pending challenges")
        except Exception as e:
            await db.rollback()
            print(f"[ExpirePending] Error: {e}")


def start_scheduler():
    """Start APScheduler with auto-resolve and expire jobs."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_auto_resolve, IntervalTrigger(minutes=5))
    scheduler.add_job(run_expire_pending, IntervalTrigger(minutes=2))
    scheduler.start()
    return scheduler
