from datetime import date


def current_boards_year(today: date | None = None) -> int:
    """Calendar year in which the CURRENT academic session's class 12 boards fall.

    Sessions run June - May; a session that starts in year Y sits its boards in Y + 1.
    """
    today = today or date.today()
    return today.year + 1 if today.month >= 6 else today.year


def class_level_to_years(class_level: str, today: date | None = None) -> tuple[int, int]:
    """(class_12_year, target_year) from the legacy class_level string.

    See docs/database-schema.md section 14 for the conversion table this implements.
    """
    y = current_boards_year(today)
    if class_level == "11":
        return y + 1, y + 1
    if class_level == "12":
        return y, y
    if class_level == "dropper":
        return y - 1, y
    raise ValueError(f"Unknown class_level: {class_level!r}")
