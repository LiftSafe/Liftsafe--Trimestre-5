import { API_BASE_URL } from '../config/api';
import { decodeDeep } from '../utils/encoding';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg || e).join(', ')
      : detail || data.message || 'Error en la petición';
    throw new Error(message);
  }
  return decodeDeep(data);
}

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
}

export async function apiPost(endpoint, data, options = {}) {
  const isFormData = data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(isFormData), ...options.headers },
    body: isFormData ? data : JSON.stringify(data),
  });
  return parseResponse(response);
}

export async function apiPut(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
}

export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

export { API_BASE_URL };
