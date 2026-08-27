import { apiGet, apiPost, apiPut } from './apiClient';

export const usuarioAscensorService = {
  asignar: (data) => apiPost('/usuario-ascensor', data),
  listar: () => apiGet('/usuario-ascensor'),
  obtener: (id) => apiGet(`/usuario-ascensor/${id}`),
  desasignar: (id, data) => apiPut(`/usuario-ascensor/${id}/desasignar`, data),
};