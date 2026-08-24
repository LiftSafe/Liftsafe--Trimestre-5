const API_URL = 'http://127.0.0.1:8000'; // Usa 127.0.0.1 o localhost

// Función para obtener el token del localStorage
const getToken = () => localStorage.getItem('token');

// Función base para hacer peticiones
const request = async (method, url, body = null, isFormData = false) => {
  const headers = {};
  const token = getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${url}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en la solicitud');
  }

  return response.json();
};

// Exportar funciones listas para usar
export const apiGet = (url) => request('GET', url);
export const apiPost = (url, data) => request('POST', url, data);
export const apiPut = (url, data) => request('PUT', url, data);
export const apiDelete = (url) => request('DELETE', url);