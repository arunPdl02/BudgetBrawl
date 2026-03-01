"""Prediction service: run Cortex for unpredicted events and store results."""

from fastapi import HTTPException

from database import run_query
from predictions.cortex import predict_spending


def get_predictions(user_id: str) -> list[dict]:
    return run_query(
        """
        SELECT sp.prediction_id, sp.event_id, sp.predicted_amount,
               sp.suggested_limit, sp.reasoning_text, sp.generated_at,
               ce.title, ce.start_time
        FROM spending_predictions sp
        JOIN calendar_events ce ON ce.event_id = sp.event_id AND ce.user_id = sp.user_id
        WHERE sp.user_id = %s
        ORDER BY ce.start_time
        """,
        (user_id,),
    )


def generate_predictions(user_id: str) -> list[dict]:
    """
    Run Cortex COMPLETE() for every calendar event that lacks a prediction.
    Returns list of newly created prediction records.
    """
    # Get quiz answers
    answers_rows = run_query(
        "SELECT question_key, answer_text FROM quiz_answers WHERE user_id = %s",
        (user_id,),
    )
    if not answers_rows:
        raise HTTPException(
            status_code=400,
            detail="Complete onboarding quiz before generating predictions",
        )
    habits = {r["QUESTION_KEY"]: r["ANSWER_TEXT"] for r in answers_rows}

    # Events without predictions
    events = run_query(
        """
        SELECT ce.event_id, ce.title, ce.start_time, ce.location
        FROM calendar_events ce
        LEFT JOIN spending_predictions sp
            ON sp.event_id = ce.event_id AND sp.user_id = ce.user_id
        WHERE ce.user_id = %s
          AND sp.prediction_id IS NULL
          AND ce.start_time >= CURRENT_TIMESTAMP()
        """,
        (user_id,),
    )

    results = []
    for ev in events:
        try:
            pred = predict_spending(
                title=ev.get("TITLE") or "",
                date=str(ev.get("START_TIME") or ""),
                location=ev.get("LOCATION") or "",
                lunch_last_3=habits.get("lunch_last_3", ""),
                transport_last_week=habits.get("transport_last_week", ""),
                going_out_last_weekend=habits.get("going_out_last_weekend", ""),
            )
        except Exception as exc:
            # Skip events that fail prediction
            continue

        run_query(
            """
            INSERT INTO spending_predictions
                (user_id, event_id, predicted_amount, suggested_limit, reasoning_text)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                ev["EVENT_ID"],
                float(pred.get("predicted_amount", 0)),
                float(pred.get("suggested_limit", 0)),
                pred.get("reasoning", ""),
            ),
            fetch=False,
        )

        results.append(
            {
                "event_id": ev["EVENT_ID"],
                "predicted_amount": pred.get("predicted_amount"),
                "suggested_limit": pred.get("suggested_limit"),
                "reasoning": pred.get("reasoning"),
            }
        )

    return results


def get_prediction(prediction_id: int, user_id: str) -> dict:
    rows = run_query(
        "SELECT * FROM spending_predictions WHERE prediction_id = %s AND user_id = %s",
        (prediction_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return rows[0]
