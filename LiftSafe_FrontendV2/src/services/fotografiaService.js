import { apiGet, apiPost, apiDelete } from './apiClient';

export const fotografiaService = {
  subir: (id_informe, file, descripcion) => {
    const formData = new FormData();
    formData.append('id_informe', id_informe);
    formData.append('file', file);
    if (descripcion) formData.append('descripcion', descripcion);
    return apiPost('/fotografias/', formData);
  },
  listarPorInforme: (id) => apiGet(`/fotografias/informe/${id}`),
  // Fotos de la inspección (generales o de un ítem del checklist).
  // No necesitan que el informe exista todavía.
  subirAInspeccion: (idInspeccion, file, { idItem, descripcion } = {}) => {
    const formData = new FormData();
    formData.append('id_inspeccion', idInspeccion);
    formData.append('file', file);
    if (idItem) formData.append('id_item', idItem);
    if (descripcion) formData.append('descripcion', descripcion);
    return apiPost('/fotografias/inspeccion', formData);
  },
  listarPorInspeccion: (id) => apiGet(`/fotografias/inspeccion/${id}`),
  eliminar: (id) => apiDelete(`/fotografias/${id}`),
};
