// ✅ FIX: este servicio apuntaba por defecto al puerto 8001, mientras que el
// backend y todos los demás services usan 8000 -> si VITE_API_URL no estaba
// definida, ascensorService.listar() siempre fallaba con error de conexión
// (afectaba a Buildings.jsx y al selector de Edificio/Ascensor en Inspecciones).
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

export const ascensorService = {
    listar: () => apiGet('/ascensores/listado'),
};