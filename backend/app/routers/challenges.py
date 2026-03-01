"""Challenges (bets) router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Challenge, CalendarEvent
from app.schemas import ChallengeCreate, ChallengeResponse, SpendSubmit
from app.services.challenges import (
    create_challenge,
    accept_challenge,
    submit_spend,
    get_head_to_head,
)

router = APIRouter()


def _challenge_to_response(c: Challenge, opponent_name: str | None, event_title: str | None) -> ChallengeResponse:
    return ChallengeResponse(
        id=c.id,
        subject_user_id=c.subject_user_id,
        opponent_user_id=c.opponent_user_id,
        event_id=c.event_id,
        threshold_amount=c.threshold_amount,
        bet_amount=c.bet_amount,
        status=c.status,
        created_at=c.created_at,
        opponent_name=opponent_name,
        event_title=event_title,
    )


@router.post("/", response_model=ChallengeResponse)
async def create_bet(
    data: ChallengeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new challenge (bet on own spend)."""
    result = await db.execute(select(User).where(User.email == data.opponent_email))
    opponent = result.scalar_one_or_none()
    if not opponent:
        raise HTTPException(status_code=404, detail="Opponent not found")
    try:
        challenge = await create_challenge(
            db, user.id, opponent.id, data.event_id, data.threshold_amount
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == data.event_id))
    ev = result.scalar_one_or_none()
    await db.commit()
    await db.refresh(challenge)
    return _challenge_to_response(challenge, opponent.name, ev.title if ev else None)


@router.post("/{challenge_id}/accept", response_model=ChallengeResponse)
async def accept_bet(
    challenge_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a pending challenge."""
    challenge = await accept_challenge(db, challenge_id, user.id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found or cannot be accepted")
    result = await db.execute(select(User).where(User.id == challenge.subject_user_id))
    subj = result.scalar_one_or_none()
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == challenge.event_id))
    ev = result.scalar_one_or_none()
    await db.commit()
    await db.refresh(challenge)
    return _challenge_to_response(challenge, subj.name if subj else None, ev.title if ev else None)


@router.post("/{challenge_id}/submit")
async def submit_spend_endpoint(
    challenge_id: int,
    data: SpendSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit actual spend to resolve challenge (subject only)."""
    try:
        challenge = await submit_spend(db, challenge_id, user.id, data.actual_spend)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found or cannot submit")
    await db.commit()
    return {"status": "completed", "winner": "subject" if data.actual_spend < challenge.threshold_amount else "opponent"}


@router.get("/")
async def list_challenges(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List challenges where user is subject or opponent."""
    result = await db.execute(
        select(Challenge, CalendarEvent)
        .join(CalendarEvent, CalendarEvent.id == Challenge.event_id)
        .where(
            (Challenge.subject_user_id == user.id) | (Challenge.opponent_user_id == user.id),
        )
        .order_by(Challenge.created_at.desc())
    )
    rows = result.all()
    out = []
    for c, ev in rows:
        other_id = c.opponent_user_id if c.subject_user_id == user.id else c.subject_user_id
        res = await db.execute(select(User).where(User.id == other_id))
        other = res.scalar_one_or_none()
        out.append({
            "id": c.id,
            "event_title": ev.title,
            "opponent_name": other.name if other else "",
            "opponent_email": other.email if other else "",
            "opponent_id": other_id,
            "threshold_amount": c.threshold_amount,
            "bet_amount": c.bet_amount,
            "status": c.status,
            "created_at": c.created_at.isoformat(),
            "event_start": ev.start_time.isoformat(),
            "is_subject": c.subject_user_id == user.id,
        })
    return {"challenges": out}


@router.get("/h2h/{friend_id}")
async def head_to_head(
    friend_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get head-to-head record with a friend."""
    a_wins, b_wins = await get_head_to_head(db, user.id, friend_id)
    return {"you_wins": a_wins, "friend_wins": b_wins, "record": f"{a_wins}-{b_wins}"}
