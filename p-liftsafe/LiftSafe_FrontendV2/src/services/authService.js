// src/services/authService.js

import { API_BASE_URL, ROLE_IDS } from '../config/api';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg || e).join(', ')
      : detail || data.message || 'Error en la solicitud';
    throw new Error(message);
  }
  return data;
}

export async function loginRequest(correo, contrasena) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  return parseResponse(response);
}

export async function registerRequest(formData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre_completo: formData.name,
      correo: formData.email,
      contrasena: formData.password,
      tipo_documento: formData.documentType,
      documento_identidad: formData.document,
      nit: formData.documentType === 'NIT' ? formData.document : null,
      razon_social: formData.documentType === 'NIT' ? formData.businessName || null : null,
      telefono: formData.phone || null,
      id_rol: ROLE_IDS.Cliente,
    }),
  });
  return parseResponse(response);
}

export async function createUserRequest(formData, token) {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre_completo: formData.name,
      correo: formData.email,
      contrasena: formData.password,
      tipo_documento: formData.documentType,
      documento_identidad: formData.document,
      nit: formData.documentType === 'NIT' ? formData.document : null,
      razon_social: formData.documentType === 'NIT' ? formData.businessName || null : null,
      telefono: formData.phone || null,
      id_rol: ROLE_IDS[formData.role],
    }),
  });
  return parseResponse(response);
}

// ✅ NUEVO: Eliminar usuario
export async function eliminarUsuario(userId) {
  const token = sessionStorage.getItem('liftsafe_token') || sessionStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al eliminar usuario' }));
    throw new Error(error.detail || 'Error al eliminar usuario');
  }
  
  return response.json();
}

export async function recoverPasswordRequest(correo) {
  const response = await fetch(`${API_BASE_URL}/auth/recuperar-clave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });
  return parseResponse(response);
}

export async function resetPasswordRequest(token, nueva_contrasena) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-clave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nueva_contrasena }),
  });
  return parseResponse(response);
}

export async function resetPasswordWithCodeRequest(correo, code, nueva_contrasena) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-clave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, code, nueva_contrasena }),
  });
  return parseResponse(response);
}