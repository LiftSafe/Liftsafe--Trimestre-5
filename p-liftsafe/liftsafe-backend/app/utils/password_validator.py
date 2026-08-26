import re

MIN_PASSWORD_LENGTH = 8

PASSWORD_RULES = [
    ("length", f"Mínimo {MIN_PASSWORD_LENGTH} caracteres"),
    ("uppercase", "Al menos una mayúscula"),
    ("lowercase", "Al menos una minúscula"),
    ("digit", "Al menos un número"),
    ("no_consecutive", "Sin dígitos consecutivos (ej: 123, 456)"),
]


def has_consecutive_digits(password: str) -> bool:
    for i in range(len(password) - 2):
        chunk = password[i : i + 3]
        if not chunk.isdigit():
            continue
        a, b, c = int(chunk[0]), int(chunk[1]), int(chunk[2])
        if b == a + 1 and c == b + 1:
            return True
        if b == a - 1 and c == b - 1:
            return True
    return False


def get_password_errors(password: str) -> list[str]:
    errors = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(PASSWORD_RULES[0][1])
    if not re.search(r"[A-Z]", password):
        errors.append(PASSWORD_RULES[1][1])
    if not re.search(r"[a-z]", password):
        errors.append(PASSWORD_RULES[2][1])
    if not re.search(r"\d", password):
        errors.append(PASSWORD_RULES[3][1])
    if has_consecutive_digits(password):
        errors.append(PASSWORD_RULES[4][1])
    return errors


def validate_password(password: str) -> None:
    errors = get_password_errors(password)
    if errors:
        raise ValueError(errors[0])
