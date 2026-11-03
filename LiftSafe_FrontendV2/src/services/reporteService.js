import { apiGet } from './apiClient';

// RF-024: reporte de productividad de los inspectores
export const reporteService = {
  productividad: (desde, hasta) => {
    const q = new URLSearchParams();
    if (desde) q.set('desde', desde);
    if (hasta) q.set('hasta', hasta);
    const texto = q.toString();
    return apiGet(`/reportes/productividad${texto ? `?${texto}` : ''}`);
  },
};
