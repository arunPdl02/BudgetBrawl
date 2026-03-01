"""Pydantic models for onboarding quiz."""

from pydantic import BaseModel


class QuizAnswer(BaseModel):
    question_key: str  # lunch_last_3 | transport_last_week | going_out_last_weekend
    answer_text: str


class QuizSubmission(BaseModel):
    answers: list[QuizAnswer]
