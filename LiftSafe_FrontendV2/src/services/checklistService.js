import { apiGet, apiPost, apiDelete } from './apiClient';

export const checklistService = {
  calificar: (data) => apiPost('/checklist/', data),
  listarPorInspeccion: (id) => apiGet(`/checklist/inspeccion/${id}`),
  // Con idInspeccion también trae lo ya respondido del checklist anterior
  obtenerCategorias: (idInspeccion) =>
    apiGet(idInspeccion ? `/checklist/categorias?id_inspeccion=${idInspeccion}` : '/checklist/categorias'),
  obtenerCumplimiento: (id) => apiGet(`/checklist/cumplimiento/${id}`),
  eliminar: (idDetalle) => apiDelete(`/checklist/${idDetalle}`),
};