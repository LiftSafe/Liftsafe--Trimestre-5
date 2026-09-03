import { useState, useEffect } from 'react';
import {
  Box, Button, Alert, Skeleton, Modal, TextField, MenuItem,
  Select, InputLabel, FormControl, Typography
} from '@mui/material';
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
import { solicitudService } from '../../services/solicitudService';
import { programacionService } from '../../services/programacionService';
import { usuarioService } from '../../services/usuarioService';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  border: '2px solid #1976d2',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

export default function CoordinadorDashboard() {
  const { user } = useAuth();
  const { data: inspecciones = [], loading, error } = useDashboardData(fetchInspecciones);
  const { data: charts } = useDashboardData(fetchCharts);

  // Estados para solicitudes y programaciones (Luz)
  const [solicitudes, setSolicitudes] = useState([]);
  const [inspectores, setInspectores] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [formData, setFormData] = useState({
    id_solicitud: '',
    id_inspector: '',
    fecha_programada: '',
    hora_inicio: '',
  });

  // Estados reales de la base de datos
  const pending = inspecciones.filter((item) =>
    item.status === 'Programada' || item.status === 'Borrador' || item.status === 'En Proceso'
  );

  const toReview = inspecciones.filter((item) =>
    item.status === 'Aprobada' || item.status === 'Finalizada' || item.reportNumber
  );

  // Cargar datos de solicitudes y programaciones
  useEffect(() => {
    const cargarDatos = async () => {
      setLoadingData(true);
      try {
        const solicitudesData = await solicitudService.listar();
        setSolicitudes(solicitudesData || []);

        // Cargar inspectores (usuarios con rol 4)
        const inspectoresData = await usuarioService.listarInspectores();
        setInspectores(inspectoresData || []);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingData(false);
      }
    };
    cargarDatos();
  }, []);

  // Preparar items para ActivityPanel
  const assignmentItems = pending.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.building,
    subtitle: `${item.elevator} · Programada: ${item.nextDate}`,
    chip: item.type,
    chipColor: 'warning',
    actionBtn: (
      <Button
        component={Link}
        to="/dashboard/inspecciones"
        size="small"
        variant="contained"
        sx={{ ml: 1, flexShrink: 0 }}
      >
        Ver
      </Button>
    ),
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

  // Funciones para el modal de asignación (Luz)
  const handleOpenModal = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setFormData({
      id_solicitud: solicitud.id_solicitud,
      id_inspector: '',
      fecha_programada: '',
      hora_inicio: '',
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSolicitud(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await programacionService.asignar(formData);
      handleCloseModal();
      // Recargar datos
      const solicitudesData = await solicitudService.listar();
      setSolicitudes(solicitudesData || []);
      alert('✅ Inspector asignado correctamente');
    } catch (error) {
      console.error('Error asignando inspector:', error);
      alert('❌ Error al asignar inspector');
    }
  };

  // Datos para el modal
  const pendientes = solicitudes.filter(s => s.estado === 'Pendiente');

  const assignmentItemsModal = pendientes.map((s) => ({
    id: s.id_solicitud,
    title: `${s.ascensor?.codigo_interno || 'ASC-' + s.id_ascensor} — ${s.ascensor?.ciudad || 'Sin ciudad'}`,
    subtitle: `Cliente: ${s.cliente?.nombre_completo || 'No asignado'}`,
    chip: s.prioridad || 'Media',
    chipColor: s.prioridad === 'Crítica' ? 'error' : s.prioridad === 'Alta' ? 'warning' : 'info',
    actionBtn: (
      <Button
        size="small"
        variant="contained"
        onClick={() => handleOpenModal(s)}
        sx={{ ml: 1, flexShrink: 0 }}
      >
        Asignar
      </Button>
    ),
    type: s.prioridad === 'Crítica' ? 'error' : s.prioridad === 'Alta' ? 'warning' : 'info',
  }));

  if (loading || loadingData) {
    return (
      <Box sx={{ p: 3 }}>
        <WelcomeBanner name={user?.name} role={user?.role} />
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6">Cargando datos...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <WelcomeBanner name={user?.name} role={user?.role} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard
          title="Inspecciones activas"
          value={String(inspecciones.length)}
          subtitle="En seguimiento"
          icon={<AssignmentOutlinedIcon />}
          accent="#0066CC"
        />
        <StatCard
          title="Pendientes"
          value={String(pending.length)}
          subtitle="Por programar o ejecutar"
          icon={<ScheduleOutlinedIcon />}
          accent="#C97B1A"
        />
        <StatCard
          title="En revisión"
          value={String(toReview.length)}
          subtitle="Informes y observaciones"
          icon={<RateReviewOutlinedIcon />}
          accent="#7C5CBF"
        />
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, mb: 2.5 }} />
      ) : (
        <ChartCard title="Tendencia de inspecciones" subtitle="Datos reales del sistema">
          <InspectionTrendChart data={charts?.monthlyInspections || []} />
        </ChartCard>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mt: 2.5 }}>
        <ActivityPanel
          title="Asignaciones pendientes"
          subtitle="Inspecciones por gestionar"
          items={assignmentItemsModal.length > 0 ? assignmentItemsModal : assignmentItems}
          accent="#C97B1A"
          action={
            <Button
              component={Link}
              to="/dashboard/solicitudes"
              size="small"
              variant="outlined"
            >
              Ver todas
            </Button>
          }
        />
        <ActivityPanel
          title="Informes por revisar"
          subtitle="Seguimiento de hallazgos"
          items={reviewItems}
          accent="#7C5CBF"
        />
      </Box>

      {/* Modal para asignar inspector (Luz) */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Asignar Inspector — {selectedSolicitud?.ascensor?.codigo_interno || 'Ascensor'}
            {selectedSolicitud?.cliente?.nombre_completo ? ` (${selectedSolicitud.cliente.nombre_completo})` : ''}
          </Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Inspector *</InputLabel>
              <Select
                value={formData.id_inspector}
                onChange={(e) => setFormData({ ...formData, id_inspector: e.target.value })}
                label="Inspector *"
                required
              >
                {inspectores.map((i) => (
                  <MenuItem key={i.id_usuario} value={i.id_usuario}>
                    {i.nombre_completo} - {i.correo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Fecha programada *"
              type="date"
              value={formData.fecha_programada}
              onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              fullWidth
              label="Hora de inicio *"
              type="time"
              value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
              required
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Asignar Inspector
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>
    </Box>
  );
}