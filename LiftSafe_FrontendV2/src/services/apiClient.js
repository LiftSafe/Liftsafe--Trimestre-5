// src/services/apiClient.js
//
// Antes este archivo tenía TRES implementaciones completas duplicadas
// de las mismas funciones (versión "HEAD", versión "Esteban", versión
// "Luz"), sobrantes de fusionar las 5 ramas sin resolver el conflicto.
// La versión "Luz" además apuntaba al puerto 8001 en vez de 8000.
// Aquí queda solo UNA implementación. Se mantienen los nombres
// `apiGet` y `apiClient` porque son los que usa el resto del código
// (AdminDashboard.jsx e Inspections.jsx respectivamente).

import { decodeDeep } from '../utils/encoding';
import { getToken } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders(isFormData = false) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg || e).join(', ')
      : detail || data.message || 'Error en la petición';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return decodeDeep(data);
}

// ============================================
// FUNCIONES SUELTAS (usadas por AdminDashboard.jsx)
// ============================================
export const apiGet = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
};

export const apiPost = async (endpoint, data, options = {}) => {
  const isFormData = data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(isFormData), ...options.headers },
    body: isFormData ? data : JSON.stringify(data),
  });
  return parseResponse(response);
};

export const apiPut = async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
};

export const apiDelete = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
};

// ============================================
// OBJETO apiClient (usado por Inspections.jsx)
// ============================================
export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

export { API_BASE_URL };