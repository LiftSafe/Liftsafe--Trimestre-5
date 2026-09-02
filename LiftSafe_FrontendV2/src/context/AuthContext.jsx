import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canDo } from '../config/roles';
import { decodeDeep } from '../utils/encoding';
import { loginRequest, registerRequest } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('liftsafe_user');
      if (!saved) return null;
      const parsed = decodeDeep(JSON.parse(saved));
      if (parsed && (parsed.role || parsed.rol) && parsed.token) {
        localStorage.setItem('liftsafe_user', JSON.stringify(parsed));
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Error al cargar usuario:', e);
      localStorage.removeItem('liftsafe_user');
      localStorage.removeItem('token');
      return null;
    }
  });

  // Verificar expiración del token al cargar
  useEffect(() => {
    if (user?.token) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        token: data.access_token,
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
  // REGISTER
  // ============================================
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
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = () => {
    localStorage.removeItem('liftsafe_user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
