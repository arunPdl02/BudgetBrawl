"""Deterministic prediction engine - no ML, fully formula-based."""

from datetime import datetime

from app.constants import (
    AVG_LUNCH_BANDS,
    EAT_OUT_BANDS,
    WEEKLY_TRANSPORT_BANDS,
)


def get_numeric_values(
    avg_lunch_band: str | None,
    weekly_transport_band: str | None,
    eat_out_band: str | None,
) -> tuple[float, float, float]:
    """Map bands to numeric values for prediction."""
    avg_lunch = AVG_LUNCH_BANDS.get(avg_lunch_band or "", 15.0)
    weekly_transport = WEEKLY_TRANSPORT_BANDS.get(weekly_transport_band or "", 30.0)
    eat_out_mult = EAT_OUT_BANDS.get(eat_out_band or "", 1.0)
    return avg_lunch, weekly_transport, eat_out_mult


def predict_spend(
    avg_lunch: float,
    weekly_transport: float,
    eat_out_multiplier: float,
    category: str,
    event_start: datetime,
) -> float:
    """
    Deterministic prediction for a single event.
    Formula: predicted_total = (food + transport + extras) * eat_out_mult * weekend_boost
    """
    transport = weekly_transport / 7.0

    food_map = {
        "FOOD": avg_lunch * 1.5,
        "COFFEE": avg_lunch * 0.5,
        "ENTERTAINMENT": avg_lunch * 2.0,
        "TRANSPORT": transport,
        "OTHER": avg_lunch * 1.0,
    }
    food = food_map.get(category, avg_lunch * 1.0)

    extras = 0.0
    if category == "ENTERTAINMENT":
        extras = avg_lunch * 2.0

    base = food + transport + extras

    weekend_boost = 1.2 if event_start.weekday() >= 5 else 1.0

    predicted_total = base * eat_out_multiplier * weekend_boost
    return round(predicted_total, 2)
