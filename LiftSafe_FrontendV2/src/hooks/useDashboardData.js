import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useDashboardData(fetchFunction) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();
        
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error en useDashboardData:', err);
          
          // ✅ CORREGIDO: Busca el token en localStorage (NO en sessionStorage)
          if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('expired')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
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
  }, [fetchFunction, navigate, reloadKey]);

  return { data, loading, error, refetch };
}