export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULES = [
  { key: 'length', label: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { key: 'uppercase', label: 'Al menos una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos una minúscula', test: (p) => /[a-z]/.test(p) },
  { key: 'digit', label: 'Al menos un número', test: (p) => /\d/.test(p) },
  {
    key: 'no_consecutive',
    label: 'Sin dígitos consecutivos (ej: 123, 456)',
    test: (p) => !hasConsecutiveDigits(p),
  },
];

function hasConsecutiveDigits(password) {
  for (let i = 0; i < password.length - 2; i += 1) {
    const chunk = password.slice(i, i + 3);
    if (!/^\d{3}$/.test(chunk)) continue;
    const a = Number(chunk[0]);
    const b = Number(chunk[1]);
    const c = Number(chunk[2]);
    if (b === a + 1 && c === b + 1) return true;
    if (b === a - 1 && c === b - 1) return true;
  }
  return false;
}

export function getPasswordRuleStatus(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    valid: rule.test(password),
  }));
}

export function isPasswordValid(password) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function getPasswordError(password) {
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failed ? failed.label : null;
}
