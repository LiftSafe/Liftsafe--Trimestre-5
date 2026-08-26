import { Box, Button, Alert, Skeleton } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { InspectionTrendChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchInspecciones, fetchCharts } from '../../services/dashboardService';

export default function CoordinadorDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);

  // ✅ Estados reales de la base de datos
  const pending = inspecciones.filter((item) => 
    item.status === 'Programada' || item.status === 'Borrador' || item.status === 'En Proceso'
  );
  
  const toReview = inspecciones.filter((item) => 
    item.status === 'Aprobada' || item.status === 'Finalizada' || item.reportNumber
  );

  const assignmentItems = pending.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Programada: ${item.nextDate}`,
    chip: item.type,
    chipColor: 'warning',
    actionBtn: <Button component={Link} to="/dashboard/inspecciones" size="small" variant="contained" sx={{ ml: 1, flexShrink: 0 }}>Ver</Button>,
    type: 'warning',
  }));

  const reviewItems = toReview.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · ${item.inspector}`,
    chip: item.status,
    chipColor: item.status === 'Aprobada' ? 'success' : 'info',
    type: item.status === 'Aprobada' ? 'success' : 'info',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Inspecciones activas" value={String(inspecciones.length)} subtitle="En seguimiento" icon={<AssignmentOutlinedIcon />} accent="#0066CC" />
        <StatCard title="Pendientes" value={String(pending.length)} subtitle="Por programar o ejecutar" icon={<ScheduleOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="En revisión" value={String(toReview.length)} subtitle="Informes y observaciones" icon={<RateReviewOutlinedIcon />} accent="#7C5CBF" />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Tendencia de inspecciones" subtitle="Datos reales del sistema">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Asignaciones pendientes" subtitle="Inspecciones por gestionar" items={assignmentItems} accent="#C97B1A" />
        <ActivityPanel title="Informes por revisar" subtitle="Seguimiento de hallazgos" items={reviewItems} accent="#7C5CBF" />
      </Box>
    </Box>
  );
}