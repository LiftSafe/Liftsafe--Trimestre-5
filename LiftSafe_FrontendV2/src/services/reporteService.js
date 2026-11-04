import { apiGet, API_BASE_URL } from './apiClient';
import { getToken } from '../utils/tokenStorage';

// RF-024: reporte de productividad de los inspectores
export const reporteService = {
  productividad: (desde, hasta) => {
    const q = new URLSearchParams();
    if (desde) q.set('desde', desde);
    if (hasta) q.set('hasta', hasta);
    const texto = q.toString();
    return apiGet(`/reportes/productividad${texto ? `?${texto}` : ''}`);
  },
  // Excel (.xlsx) con logo y formato, generado por el servidor
  productividadExcel: async (desde, hasta) => {
    const q = new URLSearchParams();
    if (desde) q.set('desde', desde);
    if (hasta) q.set('hasta', hasta);
    const token = getToken();
    const r = await fetch(`${API_BASE_URL}/reportes/productividad/excel?${q.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.detail || 'No se pudo generar el Excel');
    }
    const nombre = (r.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1]
      || `Productividad_LiftSafe_${desde}_a_${hasta}.xlsx`;
    return { blob: await r.blob(), nombre };
  },
};
