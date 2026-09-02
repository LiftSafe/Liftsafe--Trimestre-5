import { apiGet, apiPost, apiDelete } from './apiClient';

export const checklistService = {
<<<<<<< HEAD
  calificar: (data) => apiPost('/checklist/', data),  // ← barra final
=======
  calificar: (data) => apiPost('/checklist', data),
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
  listarPorInspeccion: (id) => apiGet(`/checklist/inspeccion/${id}`),
  obtenerCategorias: () => apiGet('/checklist/categorias'),
  obtenerCumplimiento: (id) => apiGet(`/checklist/cumplimiento/${id}`),
  eliminar: (idDetalle) => apiDelete(`/checklist/${idDetalle}`),
};