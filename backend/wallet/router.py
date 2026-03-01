"""Wallet router."""

from fastapi import APIRouter, Depends

from auth.jwt_utils import get_current_user
from wallet.service import get_balance, get_transactions

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("/balance")
def balance(current_user: dict = Depends(get_current_user)):
    return get_balance(current_user["sub"])


@router.get("/transactions")
def transactions(current_user: dict = Depends(get_current_user)):
    return get_transactions(current_user["sub"])
