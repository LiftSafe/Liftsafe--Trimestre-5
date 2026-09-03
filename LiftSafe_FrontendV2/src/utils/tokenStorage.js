// src/utils/tokenStorage.js
//
// Fuente ÚNICA de verdad para leer/guardar el token y el usuario.
//
// ✅ Se guarda en sessionStorage (no localStorage) a propósito: así cada
// PESTAÑA del navegador tiene su propia sesión independiente, y se puede
// probar el flujo completo con varios roles a la vez (Cliente en una
// pestaña, Coordinador en otra, Inspector en otra...) sin que una sesión
// pise a la otra. Con localStorage todas las pestañas comparten el mismo
// login. AuthContext.jsx es quien realmente maneja el login/logout; este
// archivo es el que usan los servicios que solo necesitan leer el token.

const TOKEN_KEY = 'token';
const USER_KEY = 'liftsafe_user';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Limpia todo rastro de sesión: las claves actuales en sessionStorage, y
// también las viejas en localStorage (de antes de este cambio) para que no
// quede una sesión vieja "fantasma" confundiendo a nadie que revise el
// almacenamiento del navegador.
export function clearAuthStorage() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('liftsafe_token');
  sessionStorage.removeItem('user');
}
