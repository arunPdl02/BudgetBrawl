"""Challenge service - state machine, validation, resolution."""

from datetime import datetime, timezone, timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge, ChallengeResult, CalendarEvent, User
from app.services.friends import are_friends

BET_AMOUNT = 5.0
VALID_STATUSES = frozenset({"pending", "active", "expired", "completed"})
ALLOWED_TRANSITIONS = {
    "pending": {"active", "expired"},
    "active": {"completed"},
    "expired": set(),
    "completed": set(),
}


def _can_transition(from_status: str, to_status: str) -> bool:
    return to_status in ALLOWED_TRANSITIONS.get(from_status, set())


async def create_challenge(
    db: AsyncSession,
    subject_user_id: int,
    opponent_user_id: int,
    event_id: int,
    threshold_amount: float,
) -> Challenge:
    """
    Create a new challenge.
    Validation: must be friends, cannot bet against self.
    """
    if subject_user_id == opponent_user_id:
        raise ValueError("Cannot bet against yourself")
    if not await are_friends(db, subject_user_id, opponent_user_id):
        raise ValueError("Must be friends to create a bet")

    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == event_id, CalendarEvent.user_id == subject_user_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise ValueError("Event not found or not owned by subject")
    if event.start_time <= datetime.now(timezone.utc):
        raise ValueError("Cannot create bet for past event")

    # Check no duplicate active challenge for same event
    result = await db.execute(
        select(Challenge).where(
            Challenge.event_id == event_id,
            Challenge.status.in_(["pending", "active"]),
        )
    )
    if result.scalar_one_or_none():
        raise ValueError("Challenge already exists for this event")

    challenge = Challenge(
        subject_user_id=subject_user_id,
        opponent_user_id=opponent_user_id,
        event_id=event_id,
        threshold_amount=threshold_amount,
        bet_amount=BET_AMOUNT,
        status="pending",
    )
    db.add(challenge)
    await db.flush()
    return challenge


async def accept_challenge(db: AsyncSession, challenge_id: int, accepter_user_id: int) -> Challenge | None:
    """
    Accept a pending challenge. Must be opponent, before event start.
    Returns updated challenge or None.
    """
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        return None
    if challenge.status != "pending":
        return None
    if challenge.opponent_user_id != accepter_user_id:
        return None

    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == challenge.event_id)
    )
    event = result.scalar_one_or_none()
    if not event or event.start_time <= datetime.now(timezone.utc):
        challenge.status = "expired"
        await db.flush()
        return challenge

    challenge.status = "active"
    await db.flush()
    return challenge


async def submit_spend(
    db: AsyncSession,
    challenge_id: int,
    subject_user_id: int,
    actual_spend: float,
) -> Challenge | None:
    """
    Submit actual spend and resolve challenge. Subject only, active only,
    after event start, within 24h.
    """
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        return None
    if challenge.subject_user_id != subject_user_id:
        return None
    if challenge.status != "active":
        return None

    result = await db.execute(
        select(CalendarEvent).where(CalendarEvent.id == challenge.event_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        return None
    now = datetime.now(timezone.utc)
    if event.start_time > now:
        raise ValueError("Cannot submit before event start")
    if now > event.start_time + timedelta(hours=24):
        raise ValueError("Must submit within 24 hours of event start")

    # Check not already submitted
    result = await db.execute(
        select(ChallengeResult).where(ChallengeResult.challenge_id == challenge_id)
    )
    if result.scalar_one_or_none():
        raise ValueError("Already submitted")

    winner_id = challenge.subject_user_id if actual_spend < challenge.threshold_amount else challenge.opponent_user_id
    cr = ChallengeResult(
        challenge_id=challenge_id,
        actual_spend=actual_spend,
        winner_user_id=winner_id,
    )
    db.add(cr)
    challenge.status = "completed"
    await db.flush()
    return challenge


async def auto_resolve_expired(db: AsyncSession) -> int:
    """
    Background job: mark active challenges as expired where event start + 24h has passed
    without spend submission. Opponent wins.
    Returns count of challenges auto-resolved.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)
    result = await db.execute(
        select(Challenge, CalendarEvent)
        .join(CalendarEvent, CalendarEvent.id == Challenge.event_id)
        .where(
            Challenge.status == "active",
            CalendarEvent.start_time < cutoff,
        )
    )
    count = 0
    for challenge, event in result.all():
        if event.start_time + timedelta(hours=24) < now:
            cr = ChallengeResult(
                challenge_id=challenge.id,
                actual_spend=challenge.threshold_amount,  # treat as "overspent"
                winner_user_id=challenge.opponent_user_id,
            )
            db.add(cr)
            challenge.status = "completed"
            count += 1
    await db.flush()
    return count


async def expire_pending_before_event(db: AsyncSession) -> int:
    """Mark pending challenges as expired where event has started."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Challenge).join(CalendarEvent, CalendarEvent.id == Challenge.event_id).where(
            Challenge.status == "pending",
            CalendarEvent.start_time <= now,
        )
    )
    challenges = result.scalars().all()
    for c in challenges:
        c.status = "expired"
    await db.flush()
    return len(challenges)


async def get_head_to_head(db: AsyncSession, user_a_id: int, user_b_id: int) -> tuple[int, int]:
    """Get head-to-head record (user_a_wins, user_b_wins)."""
    result = await db.execute(
        select(ChallengeResult.winner_user_id, func.count(ChallengeResult.id))
        .join(Challenge, Challenge.id == ChallengeResult.challenge_id)
        .where(
            ((Challenge.subject_user_id == user_a_id) & (Challenge.opponent_user_id == user_b_id))
            | ((Challenge.subject_user_id == user_b_id) & (Challenge.opponent_user_id == user_a_id)),
            Challenge.status == "completed",
        )
        .group_by(ChallengeResult.winner_user_id)
    )
    a_wins = 0
    b_wins = 0
    for winner_id, cnt in result.all():
        if winner_id == user_a_id:
            a_wins = cnt
        else:
            b_wins = cnt
    return a_wins, b_wins
