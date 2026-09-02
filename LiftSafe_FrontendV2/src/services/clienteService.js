import { apiGet, apiPost, apiPut } from './apiClient';

export const clienteService = {
  crear: (data) => apiPost('/clientes/', data),
  listar: () => apiGet('/clientes/'),
  obtener: (id) => apiGet(`/clientes/${id}`),
  modificar: (id, data) => apiPut(`/clientes/${id}`, data),
};