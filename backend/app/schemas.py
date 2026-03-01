"""Pydantic schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserBehaviorBase(BaseModel):
    avg_lunch_band: str | None = None
    weekly_transport_band: str | None = None
    eat_out_band: str | None = None


class UserBehaviorCreate(UserBehaviorBase):
    pass


class UserBehavior(UserBehaviorBase):
    user_id: int

    model_config = {"from_attributes": True}


class FriendAdd(BaseModel):
    email: EmailStr


class FriendAccept(BaseModel):
    email: EmailStr


class FriendResponse(BaseModel):
    id: int
    name: str
    email: str
    active_bet_count: int = 0
    head_to_head: str = "0-0"


class PendingRequestResponse(BaseModel):
    id: int
    email: str
    name: str


class CalendarEventBase(BaseModel):
    title: str
    start_time: datetime
    location: str | None = None
    normalized_category: str | None = None


class CalendarEvent(CalendarEventBase):
    id: int
    user_id: int
    predicted_total: float | None = None

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    event_id: int
    predicted_total: float


class ChallengeCreate(BaseModel):
    opponent_email: EmailStr
    event_id: int
    threshold_amount: float = Field(gt=0)


class ChallengeResponse(BaseModel):
    id: int
    subject_user_id: int
    opponent_user_id: int
    event_id: int
    threshold_amount: float
    bet_amount: float
    status: str
    created_at: datetime
    event_title: str | None = None
    opponent_name: str | None = None

    model_config = {"from_attributes": True}


class SpendSubmit(BaseModel):
    actual_spend: float = Field(ge=0)


class CalendarEventSync(BaseModel):
    title: str
    start_time: str
    location: str | None = None


class CalendarEventAdd(BaseModel):
    title: str
    start_time: str
    location: str | None = None

