import { Box, Alert, Skeleton } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StatCard from "../../components/StatCard";
import WelcomeBanner from "../../components/WelcomeBanner";
import ChartCard from "../../components/dashboard/ChartCard";
import ActivityPanel from "../../components/dashboard/ActivityPanel";
import { InspectionTrendChart } from "../../components/dashboard/DashboardCharts";
import { useAuth } from "../../context/AuthContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import { fetchInspecciones, fetchCharts } from "../../services/dashboardService";

export default function InspectorDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);

  // Mis inspecciones por estado
  const programmed = inspecciones.filter((item) => item.status === 'Programada');
  const inProgress = inspecciones.filter((item) => item.status === 'En Proceso' || item.status === 'Borrador');
  const completed = inspecciones.filter((item) => item.status === 'Finalizada' || item.status === 'Aprobada');

  const upcomingItems = programmed.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Fecha: ${item.date}`,
    chip: item.status,
    chipColor: 'info',
    type: 'info',
  }));

  const completedItems = completed.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Completada: ${item.date}`,
    chip: item.status,
    chipColor: 'success',
    type: 'success',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Programadas" value={String(programmed.length)} subtitle="Por ejecutar" icon={<ScheduleOutlinedIcon />} accent="#0066CC" />
        <StatCard title="En proceso" value={String(inProgress.length)} subtitle="Activas" icon={<WarningAmberOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="Completadas" value={String(completed.length)} subtitle="Este mes" icon={<CheckCircleOutlinedIcon />} accent="#0E7C4A" />
        <StatCard title="Total" value={String(inspecciones.length)} subtitle="Asignadas" icon={<AssignmentOutlinedIcon />} accent="#7C5CBF" />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Mis inspecciones" subtitle="Tendencia mensual">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Próximas inspecciones" subtitle="Programadas" items={upcomingItems} accent="#0066CC" />
        <ActivityPanel title="Completadas recientemente" subtitle="Historial" items={completedItems} accent="#0E7C4A" />
      </Box>
    </Box>
  );
}