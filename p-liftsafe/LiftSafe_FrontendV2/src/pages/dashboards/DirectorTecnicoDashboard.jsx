import { Box, Button, Alert, Skeleton } from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Link } from "react-router-dom";
import StatCard from "../../components/StatCard";
import WelcomeBanner from "../../components/WelcomeBanner";
import ChartCard from "../../components/dashboard/ChartCard";
import ActivityPanel from "../../components/dashboard/ActivityPanel";
import { InspectionTrendChart } from '../../components/dashboard/DashboardCharts';
import { useAuth } from "../../context/AuthContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import { fetchInspecciones, fetchCharts, fetchInformes } from "../../services/dashboardService";
import StatusPieChart from "../../components/dashboard/StatusPieChart";


export default function DirectorTecnicoDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);
  const { data: informes = [] } = useDashboardData(fetchInformes);

  // Informes pendientes de aprobación
  const pendingApproval = informes.filter((item) => 
    item.status === 'Pendiente Revisión' || item.status === 'Borrador'
  );

  // Informes con observaciones
  const withObservations = informes.filter((item) => 
    item.status === 'Aprobado con observaciones'
  );

  const approvalItems = pendingApproval.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Fecha: ${item.date}`,
    chip: item.status,
    chipColor: 'warning',
    actionBtn: <Button component={Link} to="/dashboard/reportes" size="small" variant="contained" sx={{ ml: 1, flexShrink: 0 }}>Revisar</Button>,
    type: 'warning',
  }));

  const observationItems = withObservations.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Inspector: ${item.inspector}`,
    chip: 'Observaciones',
    chipColor: 'error',
    type: 'error',
  }));

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard title="Total inspecciones" value={String(inspecciones.length)} subtitle="En sistema" icon={<AssignmentOutlinedIcon />} accent="#0066CC" />
        <StatCard title="Por aprobar" value={String(pendingApproval.length)} subtitle="Pendientes revisión" icon={<RateReviewOutlinedIcon />} accent="#C97B1A" />
        <StatCard title="Con observaciones" value={String(withObservations.length)} subtitle="Requieren seguimiento" icon={<WarningAmberOutlinedIcon />} accent="#C0392B" />
        <StatCard title="Aprobadas" value={String(informes.filter(i => i.status === 'Aprobado').length)} subtitle="Este mes" icon={<CheckCircleOutlinedIcon />} accent="#0E7C4A" />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Estado de inspecciones" subtitle="Distribución actual">
          <StatusPieChart data={charts?.inspectionStatusData || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Informes por aprobar" subtitle="Revisión técnica pendiente" items={approvalItems} accent="#C97B1A" />
        <ActivityPanel title="Con observaciones" subtitle="Seguimiento requerido" items={observationItems} accent="#C0392B" />
      </Box>
    </Box>
  );
}