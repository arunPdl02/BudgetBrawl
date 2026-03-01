"""Onboarding router: POST /onboarding/quiz."""

from fastapi import APIRouter, Depends

from auth.jwt_utils import get_current_user
from onboarding.models import QuizSubmission
from onboarding.service import save_quiz_answers

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/quiz")
def submit_quiz(
    body: QuizSubmission,
    current_user: dict = Depends(get_current_user),
):
    save_quiz_answers(
        user_id=current_user["sub"],
        answers=[a.model_dump() for a in body.answers],
    )
    return {"status": "ok", "onboarding_done": True}
