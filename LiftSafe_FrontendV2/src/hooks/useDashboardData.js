import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useDashboardData(fetchFunction) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { logout } = useAuth();

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();

        if (mounted) {
          // ✅ Asegurar que siempre sea un array
          setData(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error en useDashboardData:', err);

          // ✅ Si el error es de autenticación real, cerramos sesión
          // usando el AuthContext (logout real: limpia localStorage,
          // limpia el user en memoria, y navega a /login). Antes esto
          // hacía navigate('/login') a mano sin tocar el AuthContext,
          // por lo que el user "fantasma" seguía existiendo y Login.jsx
          // te devolvía a /dashboard de inmediato -> loop infinito.
          const isAuthError =
            err.status === 401 ||
            err.message?.includes('401') ||
            err.message?.includes('Unauthorized') ||
            err.message?.includes('expired') ||
            err.message?.includes('Not authenticated');

          if (isAuthError) {
            logout();
            return;
          }

          setError(err.message || 'Error al cargar datos');
          setData([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [fetchFunction, logout, reloadKey]);

  return { data, loading, error, refetch };
}