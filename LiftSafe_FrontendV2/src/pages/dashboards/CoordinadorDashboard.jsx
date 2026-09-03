import { Box, Button, Skeleton, Typography } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiGet } from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import { useAuth } from '../../context/AuthContext';

export default function CoordinadorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    solicitudes_pendientes: 0,
    programadas: 0,
    inspecciones_activas: 0,
    inspecciones_completadas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiGet('/dashboard/stats');
        setStats({
          solicitudes_pendientes: data.solicitudes_pendientes || 0,
          programadas: data.programadas || 0,
          inspecciones_activas: data.inspecciones_activas || 0,
          inspecciones_completadas: data.inspecciones_completadas || 0
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        setStats({
          solicitudes_pendientes: 0,
          programadas: 0,
          inspecciones_activas: 0,
          inspecciones_completadas: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statItems = [
    { 
      title: 'Solicitudes Pendientes', 
      value: stats.solicitudes_pendientes, 
      icon: <AssignmentOutlinedIcon />, 
      accent: '#E65100' 
    },
    { 
      title: 'Inspecciones Programadas', 
      value: stats.programadas, 
      icon: <ScheduleOutlinedIcon />, 
      accent: '#2C3E50' 
    },
    { 
      title: 'Inspecciones Activas', 
      value: stats.inspecciones_activas, 
      icon: <AssignmentOutlinedIcon />, 
      accent: '#0066CC' 
    },
    { 
      title: 'Inspecciones Completadas', 
      value: stats.inspecciones_completadas, 
      icon: <RateReviewOutlinedIcon />, 
      accent: '#0E7C4A' 
    },
  ];

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            ))
          : statItems.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
        <Button component={Link} to="/dashboard/solicitudes" variant="contained" sx={{ boxShadow: '0 4px 14px rgba(0,102,204,0.3)' }}>
          Ver solicitudes
        </Button>
      </Box>

      <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #E65100', bgcolor: '#fff', p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Resumen de gestión
        </Typography>
        {loading ? (
          <Skeleton height={100} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {stats.solicitudes_pendientes > 0 
              ? `Tienes ${stats.solicitudes_pendientes} solicitudes pendientes de asignación.` 
              : 'No hay solicitudes pendientes de asignación.'}
            <br />
            {stats.inspecciones_activas > 0 
              ? `Hay ${stats.inspecciones_activas} inspecciones en progreso.` 
              : 'No hay inspecciones en progreso.'}
            <br />
            {stats.inspecciones_completadas > 0 
              ? `Se han completado ${stats.inspecciones_completadas} inspecciones.` 
              : 'Aún no hay inspecciones completadas.'}
          </Typography>
        )}
      </Box>
    </Box>
  );
}