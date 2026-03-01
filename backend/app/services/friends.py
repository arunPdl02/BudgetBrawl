"""Friends service - sorted pairs, no duplicates."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Friend, User


def _sorted_pair(user_id: int, other_id: int) -> tuple[int, int]:
    """Return sorted (user_a_id, user_b_id) for storage."""
    return (min(user_id, other_id), max(user_id, other_id))


async def add_friend_request(
    db: AsyncSession,
    initiator_id: int,
    target_email: str,
) -> Friend | None:
    """
    Add friend by email. If target exists, create pending request.
    Returns the Friend record or None if target not found.
    """
    result = await db.execute(select(User).where(User.email == target_email))
    target = result.scalar_one_or_none()
    if not target:
        return None
    if target.id == initiator_id:
        raise ValueError("Cannot add yourself")

    ua, ub = _sorted_pair(initiator_id, target.id)
    result = await db.execute(
        select(Friend).where(Friend.user_a_id == ua, Friend.user_b_id == ub)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError("Friendship already exists")
    friend = Friend(
        user_a_id=ua,
        user_b_id=ub,
        status="pending",
        initiator_user_id=initiator_id,
    )
    db.add(friend)
    await db.flush()
    return friend


async def accept_friend(
    db: AsyncSession,
    acceptor_id: int,
    initiator_email: str,
) -> Friend | None:
    """
    Accept friend request. Acceptor must be the recipient, status must be pending.
    Returns the updated Friend or None if not found.
    """
    result = await db.execute(select(User).where(User.email == initiator_email))
    initiator = result.scalar_one_or_none()
    if not initiator:
        return None

    ua, ub = _sorted_pair(initiator.id, acceptor_id)
    result = await db.execute(
        select(Friend).where(Friend.user_a_id == ua, Friend.user_b_id == ub)
    )
    friend = result.scalar_one_or_none()
    if not friend or friend.status != "pending":
        return None
    if friend.initiator_user_id != initiator.id:
        return None  # acceptor must be the non-initiator
    friend.status = "accepted"
    await db.flush()
    return friend


async def get_friends(db: AsyncSession, user_id: int) -> list[tuple[User, str]]:
    """
    Get accepted friends for a user.
    Returns list of (friend_user, status).
    """
    result = await db.execute(
        select(Friend, User)
        .join(User, or_(User.id == Friend.user_a_id, User.id == Friend.user_b_id))
        .where(
            or_(Friend.user_a_id == user_id, Friend.user_b_id == user_id),
            Friend.status == "accepted",
            User.id != user_id,
        )
    )
    rows = result.all()
    return [(u, f.status) for f, u in rows]


async def get_pending_requests(db: AsyncSession, user_id: int) -> list[tuple[User, Friend]]:
    """Get pending friend requests where user is the recipient."""
    result = await db.execute(
        select(Friend, User)
        .join(User, User.id == Friend.initiator_user_id)
        .where(
            or_(Friend.user_a_id == user_id, Friend.user_b_id == user_id),
            Friend.status == "pending",
            Friend.initiator_user_id != user_id,
        )
    )
    return [(u, f) for f, u in result.all()]


async def are_friends(db: AsyncSession, user_a_id: int, user_b_id: int) -> bool:
    """Check if two users are accepted friends."""
    ua, ub = _sorted_pair(user_a_id, user_b_id)
    result = await db.execute(
        select(Friend).where(Friend.user_a_id == ua, Friend.user_b_id == ub, Friend.status == "accepted")
    )
    return result.scalar_one_or_none() is not None
