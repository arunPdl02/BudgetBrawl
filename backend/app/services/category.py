"""Category normalization from event title."""

from app.constants import CATEGORIES, CATEGORY_KEYWORDS


def normalize_category(title: str) -> str:
    """
    Normalize event category from title using keyword matching.
    Returns one of: FOOD, COFFEE, ENTERTAINMENT, TRANSPORT, OTHER
    """
    if not title:
        return "OTHER"
    lower = title.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return category
    return "OTHER"
