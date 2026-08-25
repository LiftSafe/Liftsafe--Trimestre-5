/**
 * Corrige texto UTF-8 mal interpretado como Latin-1 (mojibake).
 * Ej: "VerificaciÃ³n" → "Verificación", "AndrÃ©s" → "Andrés"
 */
export function decodeMojibake(value) {
  if (typeof value !== 'string' || !value) return value;
  if (!/[ÃÂ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(value, (ch) => ch.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (!decoded || decoded.includes('\uFFFD')) return value;
    return decoded;
  } catch {
    return value;
  }
}

export function decodeDeep(data) {
  if (data == null) return data;
  if (typeof data === 'string') return decodeMojibake(data);
  if (Array.isArray(data)) return data.map(decodeDeep);
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, val]) => [key, decodeDeep(val)])
    );
  }
  return data;
}
