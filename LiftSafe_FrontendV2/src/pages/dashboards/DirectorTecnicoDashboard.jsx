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
import { BuildingBarChart, ComplianceLineChart } from '../../components/dashboard/DashboardCharts';
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

  // ✅ FIX: charts?.inspectionStatusData viene del backend sin campo "color",
  // y StatusPieChart pinta cada porción con entry.color (si no viene, cae
  // siempre al mismo morado por defecto) -> por eso la torta se veía toda
  // de un solo color. Se arma acá el mismo mapeo de colores por estado que
  // ya usa AdminDashboard para su donut, así los dos quedan consistentes.
  const statusData = (charts?.inspectionStatusData || []).map(item => ({
    ...item,
    color: item.name === 'Aprobada' ? '#0E7C4A'
        : item.name === 'Finalizada' ? '#1ABC9C'
        : item.name === 'Programada' ? '#0066CC'
        : item.name === 'Borrador' ? '#C97B1A'
        : item.name === 'En Proceso' ? '#F39C12'
        : item.name === 'Observaciones' ? '#C0392B'
        : item.name === 'No Cumple' ? '#E74C3C'
        : item.color || '#888888'
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
          <StatusPieChart data={statusData} />
        </ChartCard>
      )}

      {/* ✅ FIX: la documentación del rol dice que Director Técnico puede "ver
          el top de edificios y tendencias de cumplimiento", pero este
          dashboard no mostraba ninguna de las dos cosas (los componentes
          BuildingBarChart/ComplianceLineChart existían pero no se usaban en
          ningún lado). Se agregan acá con los datos nuevos que devuelve
          /dashboard/charts (topBuildings, complianceTrend). */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ChartCard title="Top edificios" subtitle="Con más inspecciones">
          <BuildingBarChart data={charts?.topBuildings || []} />
        </ChartCard>
        <ChartCard title="Tendencia de cumplimiento" subtitle="% de informes aprobados por mes">
          <ComplianceLineChart data={charts?.complianceTrend || []} />
        </ChartCard>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel title="Informes por aprobar" subtitle="Revisión técnica pendiente" items={approvalItems} accent="#C97B1A" />
        <ActivityPanel title="Con observaciones" subtitle="Seguimiento requerido" items={observationItems} accent="#C0392B" />
      </Box>
    </Box>
  );
}