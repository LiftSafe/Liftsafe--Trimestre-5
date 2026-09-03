const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

const apiPost = (endpoint, data) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(handleResponse);
};

const apiPut = (endpoint, data) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(handleResponse);
};

const apiDelete = (endpoint) => {
    return fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
        },
    }).then(handleResponse);
};

export const solicitudService = {
    crear: (data) => apiPost('/solicitudes/', data),
    listar: () => apiGet('/solicitudes/'),
    obtener: (id) => apiGet(`/solicitudes/${id}`),
    modificar: (id, data) => apiPut(`/solicitudes/${id}`, data),
    eliminar: (id) => apiDelete(`/solicitudes/${id}`),
};