// ============================================
// CONFIGURACIÓN DE URL (TODAS LAS VERSIONES)
// ============================================

// Versión 1: HEAD (tuya)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Versión 2: feature/luz
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// ============================================
// DECODIFICACIÓN UTF-8 (de Esteban)
// ============================================
import { decodeDeep } from '../utils/encoding';

// ============================================
// MANEJO DE RESPUESTAS - VERSIÓN 1 (HEAD)
// ============================================
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.detail?.[0]?.msg
      || errorData.detail
      || `Error ${response.status}`;
    throw new Error(msg);
  }
  if (response.status === 204) return null;
  return response.json();
}

function getHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// ============================================
// MANEJO DE RESPUESTAS - VERSIÓN 2 (Esteban)
// ============================================
async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg || e).join(', ')
      : detail || data.message || 'Error en la petición';
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return decodeDeep(data);
}

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
}

// ============================================
// MANEJO DE RESPUESTAS - VERSIÓN 3 (Luz)
// ============================================
const getToken = () => {
  return localStorage.getItem('token');
};

const handleResponseLuz = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Error en la petición');
  }
  return response.json();
};

// ============================================
// MÉTODOS HTTP - VERSIÓN 1 (HEAD - TUYA)
// ============================================
export const apiGet = async (url) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const apiPost = async (url, data) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const apiPut = async (url, data) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const apiDelete = async (url) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ============================================
// MÉTODOS HTTP - VERSIÓN 2 (ESTEBAN)
// ============================================
export async function apiGetEsteban(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
}

export async function apiPostEsteban(endpoint, data, options = {}) {
  const isFormData = data instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...getAuthHeaders(isFormData), ...options.headers },
    body: isFormData ? data : JSON.stringify(data),
  });
  return parseResponse(response);
}

export async function apiPutEsteban(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
}

export async function apiDeleteEsteban(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return parseResponse(response);
}

// ============================================
// MÉTODOS HTTP - VERSIÓN 3 (LUZ)
// ============================================
export const apiGetLuz = (endpoint) => {
  return fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  }).then(handleResponseLuz);
};

export const apiPostLuz = (endpoint, data) => {
  return fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(handleResponseLuz);
};

export const apiPutLuz = (endpoint, data) => {
  return fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(handleResponseLuz);
};

export const apiDeleteLuz = (endpoint) => {
  return fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  }).then(handleResponseLuz);
};

// ============================================
// EXPORTACIÓN DEL CLIENTE (de Esteban)
// ============================================
export const apiClient = {
  get: apiGetEsteban,
  post: apiPostEsteban,
  put: apiPutEsteban,
  delete: apiDeleteEsteban,
};

// Exportar todas las URLs
export { API_BASE_URL, API_URL };