"""Constants and mappings for BudgetBrawl."""

# Category enum (locked)
CATEGORIES = frozenset({"FOOD", "COFFEE", "ENTERTAINMENT", "TRANSPORT", "OTHER"})

# Keyword -> category mapping for title normalization
CATEGORY_KEYWORDS = {
    "FOOD": ["lunch", "dinner", "breakfast", "meal", "food", "restaurant", "eat", "brunch", "cafe", "dining"],
    "COFFEE": ["coffee", "cafe", "tea", "latte", "espresso", "starbucks", "coffeehouse"],
    "ENTERTAINMENT": ["movie", "cinema", "concert", "show", "game", "bar", "party", "event", "entertainment", "club"],
    "TRANSPORT": ["uber", "lyft", "taxi", "bus", "train", "metro", "transport", "commute", "ride"],
}

# Band -> numeric value for avg_lunch (in $)
AVG_LUNCH_BANDS = {
    "under_10": 8,
    "10_15": 12.5,
    "15_20": 17.5,
    "20_25": 22.5,
    "25_plus": 30,
}

# Band -> numeric value for weekly_transport (in $)
WEEKLY_TRANSPORT_BANDS = {
    "under_20": 15,
    "20_40": 30,
    "40_60": 50,
    "60_100": 80,
    "100_plus": 120,
}

# Band -> eat_out multiplier
EAT_OUT_BANDS = {
    "rarely": 0.8,
    "weekly": 1.0,
    "few_times_week": 1.2,
    "daily": 1.5,
}
