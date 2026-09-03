const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ✅ sessionStorage (no localStorage): así cada pestaña del navegador
// mantiene su propia sesión, para poder probar con varios roles a la vez.
const getToken = () => {
    return sessionStorage.getItem('token');
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

export const usuarioService = {
    // fecha (YYYY-MM-DD) es opcional: si se pasa, el backend excluye a los
    // inspectores que ya tienen una programación ese día.
    listarInspectores: (fecha) => apiGet(`/usuarios/inspectores${fecha ? `?fecha=${fecha}` : ''}`),
};