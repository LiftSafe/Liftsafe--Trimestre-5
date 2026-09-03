import { apiGet, apiPost, apiPut } from './apiClient';

export const informeService = {
  generar: (idInspeccion) => apiPost(`/informes/${idInspeccion}/generar`),
  listar: () => apiGet('/informes'),
  obtenerPorInspeccion: (id) => apiGet(`/informes/inspeccion/${id}`),
  enviar: (idInforme) => apiPut(`/informes/${idInforme}/enviar`),
};
