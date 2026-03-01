"""Friends router."""

from fastapi import APIRouter, Depends

from auth.jwt_utils import get_current_user
from friends.models import FriendRequest
from friends.service import (
    accept_request,
    decline_request,
    list_friends,
    list_pending,
    send_request,
)

router = APIRouter(prefix="/friends", tags=["friends"])


@router.post("/request")
def request_friend(
    body: FriendRequest,
    current_user: dict = Depends(get_current_user),
):
    return send_request(current_user["sub"], body.addressee_email)


@router.post("/{friendship_id}/accept")
def accept(friendship_id: int, current_user: dict = Depends(get_current_user)):
    return accept_request(friendship_id, current_user["sub"])


@router.post("/{friendship_id}/decline")
def decline(friendship_id: int, current_user: dict = Depends(get_current_user)):
    return decline_request(friendship_id, current_user["sub"])


@router.get("/")
def friends(current_user: dict = Depends(get_current_user)):
    return list_friends(current_user["sub"])


@router.get("/pending")
def pending(current_user: dict = Depends(get_current_user)):
    return list_pending(current_user["sub"])
