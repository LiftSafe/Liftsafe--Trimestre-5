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

const apiGet = (endpoint) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    }).then(handleResponse);
};

const apiPut = (endpoint) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    }).then(handleResponse);
};

export const notificacionService = {
    listar: () => apiGet('/notificaciones'),
    marcarLeida: (id) => apiPut(`/notificaciones/${id}/leer`),
    marcarTodasLeidas: () => apiPut('/notificaciones/leer-todas'),
};