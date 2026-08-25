import { API_BASE_URL } from '../config/api';
import { decodeDeep } from '../utils/encoding';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg || e).join(', ')
      : detail || data.message || 'Error en la solicitud';
    throw new Error(message);
  }
  return decodeDeep(data);
}

export async function loginRequest(correo, contrasena) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  return parseResponse(response);
}
