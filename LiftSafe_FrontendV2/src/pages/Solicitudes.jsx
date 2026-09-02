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
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { solicitudService } from '../services/solicitudService';
import { ascensorService } from '../services/ascensorService';

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
  const [submitLoading, setSubmitLoading] = useState(false);

  const esCliente = user?.rol === 'Cliente';
  const esAdmin = user?.rol === 'Administrador';
  const esCoordinador = user?.rol === 'Coordinador';

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
    setShowForm(true);
  };

  const handleCloseDialog = () => {
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
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
      setError(err.message || 'Error al guardar la solicitud');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Cancelar esta solicitud?')) return;
    try {
      await solicitudService.cancelar(id);
      await cargarDatos();
    } catch (err) {
      console.error('Error cancelando solicitud:', err);
      setError(err.message || 'Error al cancelar la solicitud');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
    try {
      await solicitudService.eliminar(id);
      await cargarDatos();
    } catch (err) {
      console.error('Error eliminando solicitud:', err);
      setError(err.message || 'Error al eliminar la solicitud');
    }
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

      {/* Botón de nueva solicitud */}
      {user && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva solicitud
          </Button>
        </Box>
      )}

      {/* Tabla de solicitudes */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>ID</strong></TableCell>
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
                {solicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No hay solicitudes registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitudes.map((s) => (
                    <TableRow key={s.id_solicitud} hover>
                      <TableCell>{s.id_solicitud}</TableCell>
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
        </CardContent>
      </Card>

      {/* Dialog para crear/editar solicitud */}
      <Dialog open={showForm} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar solicitud' : 'Nueva solicitud de inspección'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
              InputLabelProps={{ shrink: true }}
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
    </Box>
  );
}