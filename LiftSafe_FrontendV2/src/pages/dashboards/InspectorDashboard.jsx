import { Box, Button, Chip, LinearProgress, Typography, Skeleton } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiGet } from '../../services/apiClient';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import { useAuth } from '../../context/AuthContext';

export default function InspectorDashboard() {
  const { user } = useAuth();
  const [inspecciones, setInspecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiGet('/dashboard/inspecciones');
        setInspecciones(data || []);
      } catch (error) {
        console.error('Error cargando inspecciones:', error);
        setInspecciones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calcular estadísticas desde los datos reales
  const total = inspecciones.length;
  const completadas = inspecciones.filter(i => 
    ['Completada', 'Finalizada', 'Aprobada'].includes(i.status)
  ).length;
  const pendientes = inspecciones.filter(i => 
    ['Pendiente', 'Programada'].includes(i.status)
  ).length;
  // const enProgreso = inspecciones.filter(i => 
  //   ['En Progreso', 'En Proceso'].includes(i.status)
  // ).length;

  const getStatusColor = (status) => {
    const colors = {
      'Aprobada': 'success',
      'Finalizada': 'success',
      'Completada': 'success',
      'Pendiente': 'warning',
      'Programada': 'info',
      'En Progreso': 'info',
      'En Proceso': 'info',
      'Observaciones': 'error',
      'Cancelada': 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: 3 }} />
          ))
        ) : (
          <>
            <StatCard title="Mis inspecciones" value={String(total)} subtitle="Asignadas a ti" icon={<AssignmentIcon />} accent="#0066CC" />
            <StatCard title="Completadas" value={String(completadas)} subtitle="Aprobadas este mes" icon={<CheckCircleIcon />} accent="#0E7C4A" />
            <StatCard title="Pendientes" value={String(pendientes)} subtitle="Por finalizar" icon={<ScheduleIcon />} accent="#C97B1A" />
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
        <Button component={Link} to="/dashboard/inspecciones" variant="contained" startIcon={<AddIcon />} sx={{ boxShadow: '0 4px 14px rgba(0,102,204,0.3)' }}>
          Registrar inspección
        </Button>
      </Box>

      <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid #0E7C4A', bgcolor: '#fff', p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Mis trabajos asignados {loading && <Skeleton width={100} display="inline" />}
        </Typography>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={60} sx={{ my: 1 }} />)
        ) : inspecciones.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No tienes inspecciones asignadas actualmente.
          </Typography>
        ) : (
          inspecciones.map((row) => (
            <Box key={row.id} sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 0 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600}>
                  {row.id} — {row.building || 'Sin edificio'}
                </Typography>
                <Chip label={row.status || 'Pendiente'} color={getStatusColor(row.status)} size="small" />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {row.elevator || 'Sin ascensor'} · {row.date || 'Sin fecha'} · {row.progress || 0}% completado
              </Typography>
              <LinearProgress
                variant="determinate"
                value={row.progress || 0}
                sx={{
                  mt: 1.25,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#E8EDF2',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: (row.progress || 0) === 100 ? '#0E7C4A' : '#0066CC',
                  },
                }}
              />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}