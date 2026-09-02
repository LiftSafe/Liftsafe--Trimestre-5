<<<<<<< HEAD
=======
<<<<<<< HEAD
import { createContext, useContext, useState } from 'react';
import { canDo } from '../config/roles';
import { decodeDeep } from '../utils/encoding';
import { loginRequest } from '../services/authService';
=======
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canDo } from '../config/roles';
import { loginRequest, registerRequest } from '../services/authService';
<<<<<<< HEAD

=======
>>>>>>> feature/esteban-local

const BASE_URL = 'http://127.0.0.1:8000';
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
const AuthContext = createContext(null);

function buildUserFromLogin(data, correo) {
  return {
    name: data.nombre,
    email: correo,
    role: data.rol,
    token: data.access_token,
  };
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(() => {
<<<<<<< HEAD
=======
<<<<<<< HEAD
    const saved = localStorage.getItem('liftsafe_user');
    if (!saved) return null;
    const parsed = decodeDeep(JSON.parse(saved));
    localStorage.setItem('liftsafe_user', JSON.stringify(parsed));
    return parsed;
  });

  // ============================================
  // LOGIN - Usando authService (modular)
  // ============================================
  const login = async (correo, contrasena) => {
    try {
      const data = await loginRequest(correo, contrasena);
      localStorage.setItem('token', data.access_token);
      
      const userData = decodeDeep({
        name: data.nombre,
        email: correo,
        rol: data.rol,
        role: data.rol,
      });
      
      localStorage.setItem('liftsafe_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        message: error.message || 'Correo o contraseña incorrectos' 
      };
    }
  };

  // ============================================
  // REGISTER - Con manejo de errores (de Felipe)
  // ============================================
  const register = async (formData) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.detail || 'No se pudo registrar' };
      }

      return { success: true };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor' };
=======
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    try {
const saved = sessionStorage.getItem('liftsafe_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role && parsed.token) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error al cargar usuario:', e);
sessionStorage.removeItem('liftsafe_user');
sessionStorage.removeItem('liftsafe_token');
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
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginRequest(email, password);
      const userData = buildUserFromLogin(data, email);
      sessionStorage.setItem('liftsafe_user', JSON.stringify(userData));
sessionStorage.setItem('liftsafe_token', data.access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Correo o contraseña incorrectos' };
    }
  };

  const register = async (formData) => {
    try {
      await registerRequest(formData);
      const loginResult = await login(formData.email, formData.password);
      if (!loginResult.success) {
        return { success: true, message: 'Cuenta creada. Inicia sesión.' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'No se pudo registrar' };
<<<<<<< HEAD
    }
  };

  const logout = () => {
sessionStorage.removeItem('liftsafe_user');
sessionStorage.removeItem('liftsafe_token');
=======
>>>>>>> feature/esteban-local
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = () => {
<<<<<<< HEAD
    localStorage.removeItem('liftsafe_user');
    localStorage.removeItem('token');
=======
sessionStorage.removeItem('liftsafe_user');
sessionStorage.removeItem('liftsafe_token');
>>>>>>> feature/esteban-local
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    setUser(null);
    navigate('/login');
  };

<<<<<<< HEAD
  const hasAction = (action) => canDo(user?.role, action);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasAction }}>
=======
  // ============================================
  // PERMISOS
  // ============================================
  const hasAction = (action) => canDo(user?.rol || user?.role, action);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user, 
      hasAction 
    }}>
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
      {children}
    </AuthContext.Provider>
  );
}

<<<<<<< HEAD
export const useAuth = () => useContext(AuthContext);
=======
<<<<<<< HEAD
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
=======
export const useAuth = () => useContext(AuthContext);
>>>>>>> feature/esteban-local
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
