import { Box, Alert, Skeleton } from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import StatCard from '../../components/StatCard';
import WelcomeBanner from '../../components/WelcomeBanner';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityPanel from '../../components/dashboard/ActivityPanel';
import { InspectionTrendChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { fetchInspecciones, fetchCharts, fetchAscensores } from '../../services/dashboardService';

export default function AsesorDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);
  const { data: ascensores = [] } = useDashboardData(fetchAscensores);

  // Clientes asociados (ascensores)
  const clientesUnicos = [...new Set(ascensores.map(a => a.client))];

  // Inspecciones de mis clientes
  const pending = inspecciones.filter((item) => 
    item.status === 'Programada' || item.status === 'Borrador'
  );
  const completed = inspecciones.filter((item) => 
    item.status === 'Finalizada' || item.status === 'Aprobada'
  );

  const clientItems = ascensores.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `Cliente: ${item.client}`,
    chip: `${item.elevators} ascensores`,
    chipColor: 'info',
    type: 'info',
  }));

  const inspectionItems = pending.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Programada: ${item.nextDate}`,
    chip: item.status,
    chipColor: 'warning',
    type: 'warning',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Clientes" value={String(clientesUnicos.length)} subtitle="Asignados" icon={<PeopleOutlinedIcon />} accent="#0066CC" />
        <StatCard title="Ascensores" value={String(ascensores.length)} subtitle="En cartera" icon={<ElevatorOutlinedIcon />} accent="#7C5CBF" />
        <StatCard title="Inspecciones" value={String(inspecciones.length)} subtitle="Total" icon={<AssignmentOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="Pendientes" value={String(pending.length)} subtitle="Por ejecutar" icon={<DescriptionOutlinedIcon />} accent="#C0392B" />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Inspecciones de mis clientes" subtitle="Tendencia mensual">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Mis clientes" subtitle="Edificios asignados" items={clientItems} accent="#0066CC" />
        <ActivityPanel title="Inspecciones pendientes" subtitle="Próximas actividades" items={inspectionItems} accent="#C97B1A" />
      </Box>
    </Box>
  );
}