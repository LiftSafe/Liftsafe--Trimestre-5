// src/utils/tokenStorage.js
//
// Fuente ÚNICA de verdad para leer/guardar el token y el usuario.
// Antes había código (dashboardService.js, authService.js) que usaba
// sessionStorage con nombres distintos ('liftsafe_token', 'token', 'user')
// mientras el login real (AuthContext) guarda todo en localStorage.
// Esto evita que eso vuelva a pasar: todos importan de aquí.

const TOKEN_KEY = 'token';
const USER_KEY = 'liftsafe_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Limpia TODO rastro de sesión, incluyendo las claves viejas de
// sessionStorage que dejaron ramas anteriores, para que no quede
// basura que confunda a otras partes del código.
export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('liftsafe_token');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}