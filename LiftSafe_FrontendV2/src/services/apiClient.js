<<<<<<< HEAD
import { API_BASE_URL } from '../config/api';
<<<<<<< HEAD
import { decodeDeep } from '../utils/encoding';

// ============================================
// DECODIFICACIÓN UTF-8
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
  // Si es 204 No Content, devolver null
  if (response.status === 204) return null;
  // Decodificar caracteres UTF-8
  return decodeDeep(data);
}

// ============================================
// HEADERS DE AUTENTICACIÓN
// ============================================
function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
}

// ============================================
// MÉTODOS HTTP
// ============================================
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

// ============================================
// EXPORTACIÓN DEL CLIENTE
// ============================================
export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
};

export { API_BASE_URL };
=======

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
>>>>>>> feature/esteban-local
=======
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const getToken = () => {
    return localStorage.getItem('token');
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Error en la petición');
    }
    return response.json();
};

export const apiGet = (endpoint) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    }).then(handleResponse);
};

export const apiPost = (endpoint, data) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(handleResponse);
};

export const apiPut = (endpoint, data) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(handleResponse);
};

export const apiDelete = (endpoint) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    }).then(handleResponse);
};
>>>>>>> feature/luz
