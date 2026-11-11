import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const checklistService = {
  calificar: (data) => apiPost('/checklist/', data),
  listarPorInspeccion: (id) => apiGet(`/checklist/inspeccion/${id}`),
  // Con idInspeccion también trae lo ya respondido del checklist anterior
  obtenerCategorias: (idInspeccion) =>
    apiGet(idInspeccion ? `/checklist/categorias?id_inspeccion=${idInspeccion}` : '/checklist/categorias'),
  obtenerCumplimiento: (id) => apiGet(`/checklist/cumplimiento/${id}`),
  eliminar: (idDetalle) => apiDelete(`/checklist/${idDetalle}`),
};

// RNF-011: mantenimiento de la lista de chequeo (Administrador / Director Técnico)
export const checklistAdminService = {
  listar: () => apiGet('/checklist/admin/categorias'),
  crearGrupo: (data) => apiPost('/checklist/admin/categorias', data),
  editarGrupo: (id, data) => apiPut(`/checklist/admin/categorias/${id}`, data),
  crearItem: (data) => apiPost('/checklist/admin/items', data),
  editarItem: (id, data) => apiPut(`/checklist/admin/items/${id}`, data),
};