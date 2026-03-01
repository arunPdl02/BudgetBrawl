"""Users and onboarding router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import User as UserSchema, UserBehaviorCreate, UserBehavior
from app.constants import AVG_LUNCH_BANDS, WEEKLY_TRANSPORT_BANDS, EAT_OUT_BANDS

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_me(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return user


@router.get("/me/behavior", response_model=UserBehavior | None)
async def get_behavior(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user behavior (onboarding answers)."""
    result = await db.execute(select(UserBehavior).where(UserBehavior.user_id == user.id))
    return result.scalar_one_or_none()


@router.put("/me/behavior", response_model=UserBehavior)
async def update_behavior(
    data: UserBehaviorCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update or create user behavior (onboarding quiz)."""
    result = await db.execute(select(UserBehavior).where(UserBehavior.user_id == user.id))
    behavior = result.scalar_one_or_none()
    if behavior:
        behavior.avg_lunch_band = data.avg_lunch_band
        behavior.weekly_transport_band = data.weekly_transport_band
        behavior.eat_out_band = data.eat_out_band
    else:
        behavior = UserBehavior(
            user_id=user.id,
            avg_lunch_band=data.avg_lunch_band,
            weekly_transport_band=data.weekly_transport_band,
            eat_out_band=data.eat_out_band,
        )
        db.add(behavior)
    await db.commit()
    await db.refresh(behavior)
    return behavior


@router.get("/bands")
async def get_bands():
    """Get available band options for onboarding."""
    return {
        "avg_lunch": list(AVG_LUNCH_BANDS.keys()),
        "weekly_transport": list(WEEKLY_TRANSPORT_BANDS.keys()),
        "eat_out": list(EAT_OUT_BANDS.keys()),
    }
