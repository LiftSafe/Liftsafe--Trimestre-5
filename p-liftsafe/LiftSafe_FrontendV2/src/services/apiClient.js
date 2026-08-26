import { API_BASE_URL } from '../config/api';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.detail === 'string'
      ? data.detail
      : data.message || 'Error en la solicitud';
    throw new Error(message);
  }
  return data;
}

export async function apiGet(path) {
  const token = sessionStorage.getItem('liftsafe_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  return parseResponse(response);
}
