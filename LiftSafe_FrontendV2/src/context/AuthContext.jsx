import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canDo } from '../config/roles';
import { loginRequest, registerRequest } from '../services/authService';
import { decodeDeep } from '../utils/encoding';

// ✅ La sesión se guarda en sessionStorage (no localStorage) a propósito:
// sessionStorage es independiente por cada PESTAÑA del navegador, aunque
// sea la misma URL. Así se puede tener, por ejemplo, un Cliente logueado
// en una pestaña y un Coordinador en otra, sin que una sesión pise a la
// otra (con localStorage todas las pestañas comparten el mismo login).
// Al cerrar la pestaña se cierra esa sesión; recargar la misma pestaña no
// afecta el login.
const AuthContext = createContext(null);

function buildUserFromLogin(data, correo) {
  return {
    name: data.nombre || data.user?.nombre,
    email: correo,
    role: data.rol || data.user?.rol,
    token: data.access_token,
  };
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('liftsafe_user');
    if (!saved) return null;
    try {
      const parsed = decodeDeep(JSON.parse(saved));
      sessionStorage.setItem('liftsafe_user', JSON.stringify(parsed));
      return parsed;
    } catch (e) {
      console.error('Error al cargar usuario:', e);
      sessionStorage.removeItem('liftsafe_user');
      sessionStorage.removeItem('token');
    }
    return null;
  });

  // Verificar token al cargar
  useEffect(() => {
    if (user) {
      try {
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        const expDate = new Date(payload.exp * 1000);
        if (expDate < new Date()) {
          console.log('Token expirado');
          logout();
        }
      } catch (e) {
        console.error('Error verificando token:', e);
        logout();
      }
    }
  }, [user]);

  // ============================================
  // LOGIN
  // ============================================
  const login = async (email, password) => {
    try {
      const data = await loginRequest(email, password);
      sessionStorage.setItem('token', data.access_token);

      const userData = decodeDeep({
        name: data.nombre || data.user?.nombre,
        email: email,
        role: data.rol || data.user?.rol,
        token: data.access_token,
      });

      sessionStorage.setItem('liftsafe_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.message || 'Correo o contraseña incorrectos',
      };
    }
  };

  // ============================================
  // REGISTER
  // ============================================
  const register = async (formData) => {
    try {
      const result = await registerRequest(formData);
      if (result.success !== false) {
        const loginResult = await login(formData.email, formData.password);
        if (!loginResult.success) {
          return { success: true, message: 'Cuenta creada. Inicia sesión.' };
        }
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Error en register:', error);
      return { success: false, message: error.message || 'No se pudo registrar' };
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = () => {
    sessionStorage.removeItem('liftsafe_user');
    sessionStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  // ============================================
  // PERMISOS
  // ============================================
  const hasAction = (action) => canDo(user?.role || user?.rol, action);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK useAuth
// ============================================
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}