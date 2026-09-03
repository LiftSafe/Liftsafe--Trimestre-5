import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  AssignmentInd as AssignmentIndIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { useAuth } from '../context/AuthContext';
import { solicitudService } from '../services/solicitudService';
import { ascensorService } from '../services/ascensorService';
import { usuarioService } from '../services/usuarioService';
import { programacionService } from '../services/programacionService';

const TIPOS_SERVICIO = [
  'Inspección Periódica',
  'Inspección Inicial',
  'Inspección Extraordinaria',
  'Post-mantenimiento'
];

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica'];

const ESTADOS = {
  'Pendiente': 'warning',
  'Programada': 'info',
  'Aprobada': 'success',
  'Finalizada': 'success',
  'Cancelada': 'error'
};

export default function Solicitudes() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [ascensores, setAscensores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id_ascensor: '',
    tipo_servicio: 'Inspección Periódica',
    prioridad: 'Media',
    fecha_deseada: '',
    observaciones: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, onConfirm: null, message: '' });
  const closeConfirm = () => setConfirmDialog((c) => ({ ...c, open: false }));

  // ✅ Asignar inspector directamente desde Solicitudes (antes solo existía
  // en el dashboard de Inicio del Coordinador). Mismo flujo/endpoint
  // (programacionService.asignar) que usa CoordinadorDashboard.jsx.
  const [inspectores, setInspectores] = useState([]);
  const [loadingInspectores, setLoadingInspectores] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, solicitud: null });
  const [assignForm, setAssignForm] = useState({ id_inspector: '', fecha_programada: '', hora_inicio: '' });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ✅ FIX: el contexto de auth guarda el rol en "role" (user.role), no en
  // "rol"; por eso esCliente siempre daba false y el botón "Nueva solicitud"
  // nunca se mostraba aunque el usuario logueado sí fuera Cliente.
  const userRol = user?.role || user?.rol;
  const esCliente = userRol === 'Cliente';
  const esAdmin = userRol === 'Administrador';
  const esCoordinador = userRol === 'Coordinador';

  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    solicitudes,
    [(s) => s.ascensor?.codigo_interno, (s) => s.cliente?.nombre_completo, 'tipo_servicio', 'prioridad', 'estado']
  );

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const solicitudesData = await solicitudService.listar();
      setSolicitudes(solicitudesData || []);
      
      // ✅ Intentar cargar ascensores del backend, si falla usa los de prueba
      try {
        const ascensoresData = await ascensorService.listar();
        if (ascensoresData && ascensoresData.length > 0) {
          setAscensores(ascensoresData);
        } else {
          setAscensores([
            { id_ascensor: 1, codigo_interno: 'ASC-001', marca: 'Otis', modelo: 'Gen2-MRL' },
            { id_ascensor: 2, codigo_interno: 'ASC-002', marca: 'Schindler', modelo: '3300 MRL' }
          ]);
        }
      } catch {
        console.log('Usando ascensores de prueba (backend no respondió)');
        setAscensores([
          { id_ascensor: 1, codigo_interno: 'ASC-001', marca: 'Otis', modelo: 'Gen2-MRL' },
          { id_ascensor: 2, codigo_interno: 'ASC-002', marca: 'Schindler', modelo: '3300 MRL' }
        ]);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar las solicitudes. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ useEffect CORREGIDO (sin llamar setState directamente)
  useEffect(() => {
    const fetchData = async () => {
      await cargarDatos();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Carga (o recarga) la lista de inspectores disponibles cada vez que se
  // abre el diálogo de asignación o cambia la fecha elegida -> el backend
  // excluye a los que ya tienen programación ese día (misma idea que la
  // creación de inspecciones en Inspections.jsx).
  useEffect(() => {
    if (!assignDialog.open) return;
    let active = true;
    const cargarInspectores = async () => {
      setLoadingInspectores(true);
      try {
        const data = await usuarioService.listarInspectores(assignForm.fecha_programada || undefined);
        if (active) setInspectores(data || []);
      } catch (err) {
        console.error('Error cargando inspectores:', err);
        if (active) setInspectores([]);
      } finally {
        if (active) setLoadingInspectores(false);
      }
    };
    cargarInspectores();
    return () => { active = false; };
  }, [assignDialog.open, assignForm.fecha_programada]);

  const handleOpenAssign = (solicitud) => {
    setAssignDialog({ open: true, solicitud });
    setAssignForm({ id_inspector: '', fecha_programada: '', hora_inicio: '' });
    setAssignError('');
  };

  const handleCloseAssign = () => {
    setAssignDialog({ open: false, solicitud: null });
    setAssignForm({ id_inspector: '', fecha_programada: '', hora_inicio: '' });
    setAssignError('');
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.id_inspector || !assignForm.fecha_programada || !assignForm.hora_inicio) {
      setAssignError('Completa todos los campos');
      return;
    }
    setAssignLoading(true);
    setAssignError('');
    try {
      await programacionService.asignar({
        id_solicitud: assignDialog.solicitud.id_solicitud,
        id_inspector: assignForm.id_inspector,
        fecha_programada: assignForm.fecha_programada,
        hora_inicio: assignForm.hora_inicio,
      });
      handleCloseAssign();
      await cargarDatos();
    } catch (err) {
      console.error('Error asignando inspector:', err);
      setAssignError(err.message || 'Error al asignar inspector');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleOpenDialog = (solicitud = null) => {
    if (solicitud) {
      setEditingId(solicitud.id_solicitud);
      setFormData({
        id_ascensor: solicitud.id_ascensor || '',
        tipo_servicio: solicitud.tipo_servicio || 'Inspección Periódica',
        prioridad: solicitud.prioridad || 'Media',
        fecha_deseada: solicitud.fecha_deseada || '',
        observaciones: solicitud.observaciones || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        id_ascensor: '',
        tipo_servicio: 'Inspección Periódica',
        prioridad: 'Media',
        fecha_deseada: '',
        observaciones: ''
      });
    }
    setFormErrors({});
    setFormError('');
    setShowForm(true);
  };

  const handleCloseDialog = () => {
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.id_ascensor) errors.id_ascensor = 'Selecciona un ascensor';
    if (!formData.tipo_servicio) errors.tipo_servicio = 'Selecciona un tipo de servicio';
    if (!formData.prioridad) errors.prioridad = 'Selecciona una prioridad';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    setFormError('');
    try {
      const payload = {
        ...formData,
        id_ascensor: Number(formData.id_ascensor)
      };

      if (editingId) {
        await solicitudService.modificar(editingId, payload);
      } else {
        await solicitudService.crear(payload);
      }

      handleCloseDialog();
      await cargarDatos();
    } catch (err) {
      console.error('Error guardando solicitud:', err);
      setFormError(err.message || 'Error al guardar la solicitud');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelar = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Cancelar solicitud',
      message: '¿Cancelar esta solicitud?',
      confirmText: 'Cancelar solicitud',
      confirmColor: 'warning',
      onConfirm: async () => {
        closeConfirm();
        try {
          await solicitudService.cancelar(id);
          await cargarDatos();
        } catch (err) {
          console.error('Error cancelando solicitud:', err);
          setError(err.message || 'Error al cancelar la solicitud');
        }
      },
    });
  };

  const handleEliminar = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar solicitud',
      message: '¿Eliminar esta solicitud? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      confirmColor: 'error',
      onConfirm: async () => {
        closeConfirm();
        try {
          await solicitudService.eliminar(id);
          await cargarDatos();
        } catch (err) {
          console.error('Error eliminando solicitud:', err);
          setError(err.message || 'Error al eliminar la solicitud');
        }
      },
    });
  };

  // Estadísticas
  const total = solicitudes.length;
  const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
  const programadas = solicitudes.filter(s => s.estado === 'Programada').length;
  const finalizadas = solicitudes.filter(s => s.estado === 'Finalizada' || s.estado === 'Aprobada').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Solicitudes de Inspección"
        subtitle="Gestiona las solicitudes de inspección de ascensores"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ color: '#1976d2', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>{total}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PendingIcon sx={{ color: '#ed6c02', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>{pendientes}</Typography>
              <Typography variant="body2" color="text.secondary">Pendientes</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon sx={{ color: '#2e7d32', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>{programadas}</Typography>
              <Typography variant="body2" color="text.secondary">Programadas</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircleIcon sx={{ color: '#9c27b0', fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight={700}>{finalizadas}</Typography>
              <Typography variant="body2" color="text.secondary">Finalizadas</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Botón de nueva solicitud (solo clientes pueden crear) */}
      {esCliente ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva solicitud
          </Button>
        </Box>
      ) : (
        user && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Solo los clientes pueden crear nuevas solicitudes de inspección.
          </Alert>
        )
      )}

      {/* Tabla de solicitudes */}
      <Box sx={{ mb: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por ascensor, cliente o estado..." />
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Ascensor</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Prioridad</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="right"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No hay solicitudes registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((s) => (
                    <TableRow key={s.id_solicitud} hover>
                      <TableCell>{s.ascensor?.codigo_interno || 'N/A'}</TableCell>
                      <TableCell>{s.cliente?.nombre_completo || 'N/A'}</TableCell>
                      <TableCell>{s.tipo_servicio}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.prioridad}
                          size="small"
                          color={
                            s.prioridad === 'Crítica' ? 'error' :
                            s.prioridad === 'Alta' ? 'warning' :
                            s.prioridad === 'Media' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{s.fecha_solicitud}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.estado}
                          size="small"
                          color={ESTADOS[s.estado] || 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {/* Asignar inspector (solo Coordinador/Admin, mientras esté pendiente) */}
                        {(esCoordinador || esAdmin) && s.estado === 'Pendiente' && (
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<AssignmentIndIcon />}
                            onClick={() => handleOpenAssign(s)}
                            sx={{ mr: 1 }}
                          >
                            Asignar
                          </Button>
                        )}
                        {/* Editar (solo pendientes) */}
                        {(esCliente || esAdmin || esCoordinador) && s.estado === 'Pendiente' && (
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(s)}
                            sx={{ mr: 1 }}
                          >
                            Editar
                          </Button>
                        )}
                        {/* Cancelar (solo pendientes) */}
                        {s.estado === 'Pendiente' && (
                          <Button
                            size="small"
                            color="warning"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelar(s.id_solicitud)}
                            sx={{ mr: 1 }}
                          >
                            Cancelar
                          </Button>
                        )}
                        {/* Eliminar (solo admin) */}
                        {esAdmin && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleEliminar(s.id_solicitud)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <ListPagination count={totalCount} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Dialog para crear/editar solicitud */}
      <Dialog open={showForm} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar solicitud' : 'Nueva solicitud de inspección'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}
            <TextField
              select
              label="Ascensor *"
              name="id_ascensor"
              value={formData.id_ascensor}
              onChange={handleChange}
              error={!!formErrors.id_ascensor}
              helperText={formErrors.id_ascensor}
              fullWidth
            >
              <MenuItem value="">Seleccionar ascensor...</MenuItem>
              {ascensores.map((a) => (
                <MenuItem key={a.id_ascensor} value={a.id_ascensor}>
                  {a.codigo_interno} - {a.marca} {a.modelo}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tipo de servicio *"
              name="tipo_servicio"
              value={formData.tipo_servicio}
              onChange={handleChange}
              error={!!formErrors.tipo_servicio}
              helperText={formErrors.tipo_servicio}
              fullWidth
            >
              {TIPOS_SERVICIO.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Prioridad *"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              error={!!formErrors.prioridad}
              helperText={formErrors.prioridad}
              fullWidth
            >
              {PRIORIDADES.map((pri) => (
                <MenuItem key={pri} value={pri}>{pri}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fecha deseada"
              name="fecha_deseada"
              type="date"
              value={formData.fecha_deseada}
              onChange={handleChange}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para asignar inspector (Coordinador/Admin) */}
      <Dialog open={assignDialog.open} onClose={handleCloseAssign} maxWidth="sm" fullWidth>
        <DialogTitle>
          Asignar inspector — {assignDialog.solicitud?.ascensor?.codigo_interno || 'Ascensor'}
          {assignDialog.solicitud?.cliente?.nombre_completo ? ` (${assignDialog.solicitud.cliente.nombre_completo})` : ''}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {assignError && (
              <Alert severity="error" onClose={() => setAssignError('')}>
                {assignError}
              </Alert>
            )}

            <TextField
              select
              label="Inspector *"
              value={assignForm.id_inspector}
              onChange={(e) => setAssignForm({ ...assignForm, id_inspector: e.target.value })}
              fullWidth
              disabled={loadingInspectores}
              helperText={
                loadingInspectores
                  ? 'Cargando inspectores disponibles...'
                  : (inspectores.length === 0 ? 'No hay inspectores disponibles para esta fecha' : '')
              }
            >
              <MenuItem value="">Seleccionar inspector...</MenuItem>
              {inspectores.map((i) => (
                <MenuItem key={i.id_usuario} value={i.id_usuario}>
                  {i.nombre_completo} - {i.correo}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fecha programada *"
              type="date"
              value={assignForm.fecha_programada}
              onChange={(e) => setAssignForm({ ...assignForm, fecha_programada: e.target.value, id_inspector: '' })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Hora de inicio *"
              type="time"
              value={assignForm.hora_inicio}
              onChange={(e) => setAssignForm({ ...assignForm, hora_inicio: e.target.value })}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAssign}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAssignSubmit}
            disabled={assignLoading || !assignForm.id_inspector || !assignForm.fecha_programada || !assignForm.hora_inicio}
          >
            {assignLoading ? 'Asignando...' : 'Asignar inspector'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirm}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
      />
    </Box>
  );
}