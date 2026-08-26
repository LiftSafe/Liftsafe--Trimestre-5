import { apiGet, apiPut } from './apiClient';

export const firmaService = {
  firmarInspector: (id, data) => apiPut(`/inspecciones/${id}/firma-inspector`, data),
  firmarCliente: (id, data) => apiPut(`/inspecciones/${id}/firma-cliente`, data),
  verificarFirmas: (id) => apiGet(`/inspecciones/${id}/firmas`),
};
