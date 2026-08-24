import { apiGet, apiPost, apiPut } from './apiClient';

export const programacionService = {
    asignar: (data) => apiPost('/programacion', data),
    listar: () => apiGet('/programacion'),
    reasignar: (id, data) => apiPut(`/programacion/${id}/reasignar`, data),
    cancelar: (id, motivo) => apiPut(`/programacion/${id}/cancelar?motivo=${encodeURIComponent(motivo)}`),
};