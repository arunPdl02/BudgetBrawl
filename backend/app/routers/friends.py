"""Friends router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Friend, Challenge
from app.schemas import FriendAdd, FriendAccept, FriendResponse, PendingRequestResponse
from app.services.friends import (
    add_friend_request,
    accept_friend,
    get_friends,
    get_pending_requests,
)
from app.services.challenges import get_head_to_head

router = APIRouter()


@router.post("/add")
async def add_friend(
    data: FriendAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add friend by email."""
    try:
        friend = await add_friend_request(db, user.id, data.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    await db.commit()
    return {"status": "pending", "message": "Friend request sent"}


@router.post("/accept")
async def accept_friend_endpoint(
    data: FriendAccept,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a pending friend request."""
    friend = await accept_friend(db, user.id, data.email)
    if not friend:
        raise HTTPException(status_code=404, detail="Friend request not found or already accepted")
    await db.commit()
    return {"status": "accepted"}


@router.get("/list", response_model=list[FriendResponse])
async def list_friends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List accepted friends with H2H and active bet count."""
    friends_with_status = await get_friends(db, user.id)
    result = []
    for friend_user, _ in friends_with_status:
        a_wins, b_wins = await get_head_to_head(db, user.id, friend_user.id)
        h2h = f"{a_wins}-{b_wins}" if user.id < friend_user.id else f"{b_wins}-{a_wins}"
        # Active bet count: pending + active challenges
        bet_res = await db.execute(
            select(func.count(Challenge.id)).where(
                ((Challenge.subject_user_id == user.id) & (Challenge.opponent_user_id == friend_user.id))
                | ((Challenge.subject_user_id == friend_user.id) & (Challenge.opponent_user_id == user.id)),
                Challenge.status.in_(["pending", "active"]),
            )
        )
        active_bets = bet_res.scalar() or 0
        result.append(
            FriendResponse(
                id=friend_user.id,
                name=friend_user.name,
                email=friend_user.email,
                active_bet_count=active_bets,
                head_to_head=h2h,
            )
        )
    return result


@router.get("/pending", response_model=list[PendingRequestResponse])
async def list_pending(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending friend requests (where user is recipient)."""
    pending = await get_pending_requests(db, user.id)
    return [
        PendingRequestResponse(id=u.id, email=u.email, name=u.name)
        for u, _ in pending
    ]
