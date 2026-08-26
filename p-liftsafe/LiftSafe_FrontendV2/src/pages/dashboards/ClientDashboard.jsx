import { Box, Alert, Skeleton } from '@mui/material';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StatCard from "../../components/StatCard";
import WelcomeBanner from "../../components/WelcomeBanner";
import ChartCard from "../../components/dashboard/ChartCard";
import ActivityPanel from "../../components/dashboard/ActivityPanel";
import { InspectionTrendChart } from "../../components/dashboard/DashboardCharts";
import { useAuth } from "../../context/AuthContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import { fetchInspecciones, fetchCharts, fetchAscensores } from "../../services/dashboardService";

export default function ClienteDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);
  const { data: ascensores = [] } = useDashboardData(fetchAscensores);

  // Mis ascensores
  const activeElevators = ascensores.filter(a => a.status === 'Activo');
  const inactiveElevators = ascensores.filter(a => a.status === 'Inactivo');

  // Mis inspecciones
  const pending = inspecciones.filter((item) => 
    item.status === 'Programada' || item.status === 'Borrador'
  );
  const completed = inspecciones.filter((item) => 
    item.status === 'Finalizada' || item.status === 'Aprobada'
  );

  const elevatorItems = ascensores.slice(0, 5).map((item) => ({
    id: item.id,
    title: `${item.brand} ${item.model}`.trim(),
    subtitle: item.building,
    chip: item.status,
    chipColor: item.status === 'Activo' ? 'success' : 'error',
    type: item.status === 'Activo' ? 'success' : 'error',
  }));

  const inspectionItems = inspecciones.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Estado: ${item.status}`,
    chip: item.status,
    chipColor: item.status === 'Aprobada' ? 'success' : item.status === 'Finalizada' ? 'success' : 'warning',
    type: item.status === 'Aprobada' ? 'success' : 'warning',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Mis ascensores" value={String(ascensores.length)} subtitle="Registrados" icon={<ElevatorOutlinedIcon />} accent="#0066CC" />
        <StatCard title="Activos" value={String(activeElevators.length)} subtitle="En operación" icon={<CheckCircleOutlinedIcon />} accent="#0E7C4A" />
        <StatCard title="Inspecciones" value={String(inspecciones.length)} subtitle="Total" icon={<AssignmentOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="Pendientes" value={String(pending.length)} subtitle="Por realizar" icon={<WarningAmberOutlinedIcon />} accent="#C0392B" />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Historial de inspecciones" subtitle="Mis ascensores">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Mis ascensores" subtitle="Equipos registrados" items={elevatorItems} accent="#0066CC" />
        <ActivityPanel title="Inspecciones" subtitle="Estado actual" items={inspectionItems} accent="#C97B1A" />
      </Box>
    </Box>
  );
}