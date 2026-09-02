const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    body: JSON.stringify(data), // ← ESTO ES LO CRÍTICO
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