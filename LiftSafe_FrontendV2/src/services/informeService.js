import { apiGet, apiPost, apiPut } from './apiClient';

export const informeService = {
  generar: (idInspeccion) => apiPost(`/informes/${idInspeccion}/generar`),
  listar: () => apiGet('/informes'),
  obtenerPorInspeccion: (id) => apiGet(`/informes/inspeccion/${id}`),
  enviar: (idInforme) => apiPut(`/informes/${idInforme}/enviar`),
  // RF-023 - Aprobación (paso 7 del flujo)
  aprobar: (idInforme, { concepto_tecnico, observaciones_revision } = {}) =>
    apiPut(`/informes/${idInforme}/revisar`, { decision: 'Aprobado', concepto_tecnico, observaciones_revision }),
  rechazar: (idInforme, { concepto_tecnico, observaciones_revision } = {}) =>
    apiPut(`/informes/${idInforme}/revisar`, { decision: 'Rechazado', concepto_tecnico, observaciones_revision }),
};
