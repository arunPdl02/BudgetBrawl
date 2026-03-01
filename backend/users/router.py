"""Users router: search by email."""

from fastapi import APIRouter, Depends, HTTPException

from auth.jwt_utils import get_current_user
from users.service import find_by_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search")
def search_user(email: str, _: dict = Depends(get_current_user)):
    user = find_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
