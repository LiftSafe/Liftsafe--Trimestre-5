// src/services/dashboardService.js
import { getToken, setToken } from '../utils/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cliente API con manejo de errores mejorado
const apiClient = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        detail: `Error HTTP ${response.status}: ${response.statusText}`
      }));
      const error = new Error(errorData.detail || `Error ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8000');
    }
    throw error;
  }
};

// ============ DASHBOARD ENDPOINTS ============

export const fetchStats = () => apiClient('/dashboard/stats');

export const fetchCharts = () => apiClient('/dashboard/charts');

export const fetchInspecciones = () => apiClient('/dashboard/inspecciones');

export const fetchAscensores = () => apiClient('/dashboard/ascensores');

export const fetchEdificios = async () => {
  const raw = await apiClient('/ascensores/edificios');
  // ✅ FIX: el backend ahora devuelve toda la info disponible del cliente
  // dueño del edificio (antes solo mandaba cliente/direccion/total_ascensores
  // y Buildings.jsx mostraba casi todo el modal de detalle vacío). Se traduce
  // a los nombres en inglés que ya usa Buildings.jsx, agregando los campos
  // nuevos (id real, ciudad, estado, correo, teléfono, documento, etc.)
  return (raw || []).map((e) => ({
    id: e.id_cliente,
    name: e.cliente || null,
    address: e.direccion || null,
    city: e.ciudad || null,
    status: e.estado || null,
    email: e.correo || null,
    phone: e.telefono || null,
    tipoDocumento: e.tipo_documento || null,
    documento: e.documento_identidad || null,
    razonSocial: e.razon_social || null,
    nit: e.nit || null,
    fechaRegistro: e.fecha_registro || null,
    elevators: e.total_ascensores || 0,
  }));
};

export const fetchUsuarios = () => apiClient('/dashboard/usuarios');

export const fetchInformes = () => apiClient('/dashboard/informes');

export const fetchReportsSummary = () => apiClient('/dashboard/reports-summary');

// ============ AUTH ENDPOINTS ============
// Nota: el login "real" de la app vive en context/AuthContext.jsx + authService.js.
// Esta función se deja por compatibilidad pero ya usa el mismo storage que todo lo demás.

export const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error en login');
  }

  const data = await response.json();
  setToken(data.access_token);
  return data;
};

export const getCurrentUser = () => apiClient('/auth/me');

// ============ VISTAS Y PROCEDIMIENTOS ============

export const fetchVistaResumen = () => apiClient('/vistas/resumen-inspecciones');

export const fetchInspeccionesPorEstado = (estado) =>
  apiClient(`/vistas/inspecciones-por-estado/${estado}`);

// ============ USUARIOS ============

export const fetchUserProfile = (userId) => apiClient(`/usuarios/perfil/${userId}`);

export const fetchAdminStats = () => apiClient('/usuarios/dashboard/admin');

export const fetchClienteAscensores = (clientId) =>
  apiClient(`/usuarios/dashboard/cliente/${clientId}`);

export const fetchInspectorInspecciones = (inspectorId) =>
  apiClient(`/usuarios/dashboard/inspector/${inspectorId}`);

// ============ ASCENSORES (RUTAS DIRECTAS) ============

export const fetchListadoAscensores = () => apiClient('/ascensores/listado');

export const fetchEdificiosAscensores = () => apiClient('/ascensores/edificios');

export const fetchMisAscensores = () => apiClient('/ascensores/mis-ascensores');

// ============ INSPECCIONES (RUTAS DIRECTAS) ============

export const fetchMisInspecciones = () => apiClient('/inspecciones/mis-inspecciones');

// ============ CREAR INSPECCIÓN ============

export const crearInspeccion = async (data) => {
  const token = getToken();

  const response = await fetch(`${API_URL}/inspecciones/crear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al crear inspección' }));
    throw new Error(error.detail || 'Error al crear inspección');
  }

  return response.json();
};

// ============ ELIMINAR USUARIO ============

export const eliminarUsuario = async (userId) => {
  const token = getToken();

  const response = await fetch(`${API_URL}/usuarios/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al eliminar usuario' }));
    throw new Error(error.detail || 'Error al eliminar usuario');
  }

  return response.json();
};