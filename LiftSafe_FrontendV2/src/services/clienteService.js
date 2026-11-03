import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const clienteService = {
  crear: (data) => apiPost('/clientes/', data),
  listar: () => apiGet('/clientes/'),
  obtener: (id) => apiGet(`/clientes/${id}`),
  modificar: (id, data) => apiPut(`/clientes/${id}`, data),
  // Sedes (sucursales) del cliente
  listarSedes: (idCliente) => apiGet(`/clientes/${idCliente}/sedes`),
  // Edificios del cliente que inició sesión
  misSedes: () => apiGet('/clientes/mis-sedes'),
  crearSede: (idCliente, data) => apiPost(`/clientes/${idCliente}/sedes`, data),
  modificarSede: (idSede, data) => apiPut(`/clientes/sedes/${idSede}`, data),
  eliminarSede: (idSede) => apiDelete(`/clientes/sedes/${idSede}`),
  // Ascensores de una sede (para el Asesor, "edificio")
  listarAscensoresSede: (idSede) => apiGet(`/clientes/sedes/${idSede}/ascensores`),
};