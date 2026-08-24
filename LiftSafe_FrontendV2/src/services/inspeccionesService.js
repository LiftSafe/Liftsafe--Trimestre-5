 import { apiGet } from './apiClient'; 
 export const inspeccionesService = { misInspecciones: () => apiGet('/inspecciones/mis-inspecciones'), };