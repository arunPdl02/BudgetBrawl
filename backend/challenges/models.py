"""Pydantic models for challenges."""

from pydantic import BaseModel


class CreateChallenge(BaseModel):
    friend_id: str
    prediction_id: int
    event_id: str
    spend_limit: float
    stake_per_side: float = 5.00


class ReportSpend(BaseModel):
    actual_amount_spent: float
