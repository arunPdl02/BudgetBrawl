"""Friend request service."""

from fastapi import HTTPException

from database import run_query
from users.service import find_by_email


def send_request(requester_id: str, addressee_email: str) -> dict:
    addressee = find_by_email(addressee_email)
    if not addressee:
        raise HTTPException(status_code=404, detail="User not found")
    if addressee["USER_ID"] == requester_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")

    # Check existing
    existing = run_query(
        """
        SELECT friendship_id, status FROM friends
        WHERE (requester_id = %s AND addressee_id = %s)
           OR (requester_id = %s AND addressee_id = %s)
        """,
        (requester_id, addressee["USER_ID"], addressee["USER_ID"], requester_id),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Friend relationship already exists")

    run_query(
        "INSERT INTO friends (requester_id, addressee_id) VALUES (%s, %s)",
        (requester_id, addressee["USER_ID"]),
        fetch=False,
    )
    return {"status": "pending", "addressee": addressee["USER_ID"]}


def accept_request(friendship_id: int, user_id: str) -> dict:
    rows = run_query(
        "SELECT * FROM friends WHERE friendship_id = %s AND addressee_id = %s AND status = 'pending'",
        (friendship_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Pending request not found")
    run_query(
        "UPDATE friends SET status = 'accepted', updated_at = CURRENT_TIMESTAMP() "
        "WHERE friendship_id = %s",
        (friendship_id,),
        fetch=False,
    )
    return {"status": "accepted"}


def decline_request(friendship_id: int, user_id: str) -> dict:
    rows = run_query(
        "SELECT * FROM friends WHERE friendship_id = %s AND addressee_id = %s AND status = 'pending'",
        (friendship_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Pending request not found")
    run_query(
        "UPDATE friends SET status = 'declined', updated_at = CURRENT_TIMESTAMP() "
        "WHERE friendship_id = %s",
        (friendship_id,),
        fetch=False,
    )
    return {"status": "declined"}


def list_friends(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT f.friendship_id, f.requester_id, f.addressee_id,
               u.user_id, u.email, u.display_name, u.avatar_url
        FROM friends f
        JOIN users u ON u.user_id = CASE
            WHEN f.requester_id = %s THEN f.addressee_id
            ELSE f.requester_id
        END
        WHERE (f.requester_id = %s OR f.addressee_id = %s)
          AND f.status = 'accepted'
        """,
        (user_id, user_id, user_id),
    )


def list_pending(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT f.friendship_id, f.requester_id,
               u.email, u.display_name, u.avatar_url, f.created_at
        FROM friends f
        JOIN users u ON u.user_id = f.requester_id
        WHERE f.addressee_id = %s AND f.status = 'pending'
        """,
        (user_id,),
    )


def are_friends(user_a: str, user_b: str) -> bool:
    rows = run_query(
        """
        SELECT 1 FROM friends
        WHERE status = 'accepted'
          AND ((requester_id = %s AND addressee_id = %s)
               OR (requester_id = %s AND addressee_id = %s))
        """,
        (user_a, user_b, user_b, user_a),
    )
    return bool(rows)
