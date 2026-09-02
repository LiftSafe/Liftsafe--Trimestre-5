import { apiGet } from './apiClient';

export const auditoriaService = {
  listar: () => apiGet('/auditoria/'),
  filtrarPorTabla: (tabla) => apiGet(`/auditoria/?tabla=${tabla}`),
  filtrarPorUsuario: (id) => apiGet(`/auditoria/?usuario=${id}`),
};