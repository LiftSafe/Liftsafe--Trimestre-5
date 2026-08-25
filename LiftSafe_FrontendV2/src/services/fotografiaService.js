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
  eliminar: (id) => apiDelete(`/fotografias/${id}`),
};
