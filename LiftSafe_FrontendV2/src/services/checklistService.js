import { apiGet, apiPost, apiDelete } from './apiClient';

export const checklistService = {
  calificar: (data) => apiPost('/checklist', data),
  listarPorInspeccion: (id) => apiGet(`/checklist/inspeccion/${id}`),
  obtenerCategorias: () => apiGet('/checklist/categorias'),
  obtenerCumplimiento: (id) => apiGet(`/checklist/cumplimiento/${id}`),
  eliminar: (idDetalle) => apiDelete(`/checklist/${idDetalle}`),
};