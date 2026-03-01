"""Pydantic models for friend requests."""

from pydantic import BaseModel


class FriendRequest(BaseModel):
    addressee_email: str


class FriendAction(BaseModel):
    friendship_id: int
