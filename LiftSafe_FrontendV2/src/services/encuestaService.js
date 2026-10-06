import { apiGet, apiPut } from './apiClient';

export const encuestaService = {
    listarMias: () => apiGet('/encuestas/'),
    responder: (id, data) => apiPut(`/encuestas/${id}/responder`, data),
};
