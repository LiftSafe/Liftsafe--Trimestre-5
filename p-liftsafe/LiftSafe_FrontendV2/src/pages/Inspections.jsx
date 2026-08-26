// src/pages/Inspections.jsx
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import IconButton from '@mui/material/IconButton';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography, Checkbox, FormControlLabel, Divider, Alert, CircularProgress,
  Snackbar, // ✅ AGREGADO
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import ListPagination from '../components/ListPagination';
import { statusColor } from '../utils/statusHelpers';
import { brand } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { usePaginatedSearch } from '../hooks/usePaginatedSearch';
import { fetchInspecciones, fetchEdificios, fetchAscensores, crearInspeccion } from '../services/dashboardService';

const CHECKLIST_CATEGORIES = [
  { category: 'Seguridad', items: ['Frenos de emergencia', 'Paracaídas', 'Límite de velocidad', 'Puertas de cabina'] },
  { category: 'Mecánica', items: ['Cables de tracción', 'Poleas', 'Motor de tracción', 'Sistema de guías'] },
  { category: 'Eléctrica', items: ['Tablero de control', 'Botonera', 'Iluminación de cabina', 'Sistema de alarma'] },
  { category: 'Documentación', items: ['Manual de mantenimiento', 'Registro de revisiones', 'Placa de capacidad', 'Certificado vigente'] },
];

// ========== COMPONENTE CONFIRM DIALOG (reutilizable inline) ==========
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  confirmColor = 'error',
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningAmberIcon color={confirmColor} />
          <Typography fontWeight={700}>{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Eliminando...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Inspections() {
  const { hasAction } = useAuth();
  const { data: rows = [], loading, error, refetch } = useDashboardData(fetchInspecciones);
  const { search, setSearch, page, setPage, paginated, totalCount } = usePaginatedSearch(
    rows,
    ['building', 'elevator', 'brand', 'model', 'type', 'inspector', 'status', 'date']
  );
  
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [edificios, setEdificios] = useState([]);
  const [ascensores, setAscensores] = useState([]);
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');
  const [ascensorSeleccionado, setAscensorSeleccionado] = useState('');
  const [tipoInspeccion, setTipoInspeccion] = useState('Periódica');
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [fechaError, setFechaError] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // ✅ ESTADOS PARA SNACKBAR (reemplazan todos los alert)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // ✅ ESTADOS PARA CONFIRM DIALOG DE ELIMINAR
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [deleting, setDeleting] = useState(false);

  // Helper para mostrar snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const setFechaMin = useCallback((node) => {
    if (node !== null) {
      const input = node.querySelector('input[type="date"]');
      if (input) {
        const hoy = new Date().toISOString().split('T')[0];
        input.setAttribute('min', hoy);
      }
    }
  }, []);

  const getHoy = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const validarFecha = (fecha) => {
    if (!fecha) {
      setFechaError('');
      return false;
    }
    const hoy = getHoy();
    if (fecha < hoy) {
      setFechaError('La fecha no puede ser anterior a hoy');
      return false;
    }
    setFechaError('');
    return true;
  };

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    const hoy = getHoy();
    if (nuevaFecha && nuevaFecha < hoy) {
      setFechaProgramada('');
      setFechaError('La fecha no puede ser anterior a hoy');
      return;
    }
    setFechaProgramada(nuevaFecha);
    setFechaError('');
  };

  useEffect(() => {
    if (open) {
      cargarEdificios();
    }
  }, [open]);

  const cargarEdificios = async () => {
    setLoadingModal(true);
    try {
      const data = await fetchEdificios();
      setEdificios(data || []);
    } catch (err) {
      console.error('Error cargando edificios:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleEdificioChange = async (edificioId) => {
    setEdificioSeleccionado(edificioId);
    setAscensorSeleccionado('');
    if (!edificioId) {
      setAscensores([]);
      return;
    }
    setLoadingModal(true);
    try {
      const todosAscensores = await fetchAscensores();
      const ascensoresFiltrados = todosAscensores.filter(a => a.building === edificioId);
      setAscensores(ascensoresFiltrados);
    } catch (err) {
      console.error('Error cargando ascensores:', err);
    } finally {
      setLoadingModal(false);
    }
  };

  const limpiarFormulario = () => {
    setEdificioSeleccionado('');
    setAscensorSeleccionado('');
    setTipoInspeccion('Periódica');
    setFechaProgramada('');
    setFechaError('');
    setObservaciones('');
    setAscensores([]);
  };

  // ✅ REEMPLAZADOS: 4 alert() → showSnackbar()
  const handleCrearInspeccion = async () => {
    if (!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada) {
      showSnackbar('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }
    if (!validarFecha(fechaProgramada)) {
      showSnackbar(fechaError || 'La fecha programada no es válida', 'error');
      return;
    }
    const ascensor = ascensores.find(a => a.id === ascensorSeleccionado);
    if (!ascensor) {
      showSnackbar('Ascensor no válido', 'error');
      return;
    }
    
    const data = {
      id_ascensor: parseInt(ascensorSeleccionado),
      id_inspector: 1,
      fecha_programada: fechaProgramada,
      tipo_servicio: tipoInspeccion,
      observaciones: observaciones
    };
    
    try {
      setLoadingModal(true);
      const result = await crearInspeccion(data);
      console.log('Inspección creada:', result);
      setOpen(false);
      limpiarFormulario();
      if (refetch) refetch();
      showSnackbar('Inspección creada exitosamente', 'success');
    } catch (err) {
      console.error('Error creando inspección:', err);
      showSnackbar(err.message || 'Error al crear inspección', 'error');
    } finally {
      setLoadingModal(false);
    }
  };

  // ✅ REEMPLAZADO: window.confirm() → ConfirmDialog
  const handleDeleteClick = (row) => {
    setDeleteDialog({ open: true, row });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.row) return;
    setDeleting(true);
    try {
      // TODO: await deleteInspeccion(deleteDialog.row.id);
      console.log('Eliminar inspección:', deleteDialog.row.id);
      showSnackbar('Inspección eliminada correctamente', 'success');
      if (refetch) refetch();
    } catch (err) {
      showSnackbar(err.message || 'Error al eliminar la inspección', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, row: null });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Inspecciones"
        subtitle="Inspecciones registradas en LiftSafe"
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar inspección..." />
        {hasAction('createInspection') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Nueva inspección</Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Edificio</strong></TableCell>
                      <TableCell><strong>Ascensor</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Inspector</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Próxima</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="right"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginated.map((row) => (
                      <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.building}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.elevator}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.type}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.inspector}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.date}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          {row.nextDate}
                        </TableCell>
                        <TableCell onClick={() => { setSelected(row); setDetailOpen(true); }}>
                          <Chip label={row.status} color={statusColor[row.status] || 'default'} size="small" />
                        </TableCell>
                        
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Editar inspección:', row.id);
                            }}
                            title="Editar inspección"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(row);
                            }}
                            title="Eliminar inspección"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!paginated.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">No hay inspecciones registradas</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <ListPagination count={totalCount} page={page} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE NUEVA INSPECCIÓN */}
      <Dialog open={open} onClose={() => { setOpen(false); limpiarFormulario(); }} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Nueva inspección</DialogTitle>
        <DialogContent>
          {loadingModal && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              select 
              label="Edificio" 
              fullWidth 
              value={edificioSeleccionado}
              onChange={(e) => handleEdificioChange(e.target.value)}
              disabled={loadingModal}
            >
              <MenuItem value=""><em>Seleccione un edificio</em></MenuItem>
              {edificios.map((ed) => (
                <MenuItem key={ed.id} value={ed.id}>
                  {ed.name} - {ed.address}
                </MenuItem>
              ))}
            </TextField>

            <TextField 
              select 
              label="Ascensor" 
              fullWidth 
              value={ascensorSeleccionado}
              onChange={(e) => setAscensorSeleccionado(e.target.value)}
              disabled={!edificioSeleccionado || loadingModal}
            >
              <MenuItem value=""><em>Seleccione un ascensor</em></MenuItem>
              {ascensores.map((asc) => (
                <MenuItem key={asc.id} value={asc.id}>
                  {asc.brand} {asc.model} - {asc.type} ({asc.capacity}kg)
                </MenuItem>
              ))}
            </TextField>

            <TextField 
              select 
              label="Tipo de inspección" 
              fullWidth 
              value={tipoInspeccion}
              onChange={(e) => setTipoInspeccion(e.target.value)}
            >
              <MenuItem value="Anual">Anual</MenuItem>
              <MenuItem value="Periódica">Periódica</MenuItem>
              <MenuItem value="Extraordinaria">Extraordinaria</MenuItem>
            </TextField>

            <TextField 
              ref={setFechaMin}
              label="Fecha programada" 
              type="date" 
              fullWidth 
              InputLabelProps={{ shrink: true }}
              value={fechaProgramada}
              onChange={handleFechaChange}
              error={!!fechaError}
              helperText={fechaError || ''}
              sx={{
                '& .MuiInputBase-root': {
                  pt: 1.5,
                }
              }}
            />

            <TextField 
              label="Observaciones iniciales" 
              multiline 
              rows={3} 
              fullWidth 
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setOpen(false); limpiarFormulario(); }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleCrearInspeccion}
            disabled={!edificioSeleccionado || !ascensorSeleccionado || !fechaProgramada || !!fechaError}
          >
            Crear inspección
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE DETALLE */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700}>{selected?.building}</Typography>
          <Typography variant="body2" color="text.secondary">{selected?.elevator} · {selected?.type} · {selected?.inspector}</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <Box><Typography variant="caption" color="text.secondary">Dirección</Typography><Typography variant="body2">{selected?.building}</Typography></Box>
            <Box><Typography variant="caption" color="text.secondary">Marca / Modelo</Typography><Typography variant="body2">{selected?.brand} {selected?.model}</Typography></Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">Lista de verificación técnica</Typography>
          {CHECKLIST_CATEGORIES.map((cat) => (
            <Box key={cat.category} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: brand.blueDark }}>{cat.category}</Typography>
              {cat.items.map((item) => (
                <FormControlLabel key={item} control={<Checkbox defaultChecked={selected?.status === 'Aprobada'} />} label={item} />
              ))}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
          <Button variant="outlined">Generar reporte</Button>
          <Button variant="contained">Aprobar inspección</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ SNACKBAR GLOBAL - Reemplaza todos los alert() */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ✅ CONFIRM DIALOG PARA ELIMINAR - Reemplaza window.confirm() */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, row: null })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar inspección"
        message={
          deleteDialog.row
            ? `¿Eliminar inspección de "${deleteDialog.row.building}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Eliminar"
        confirmColor="error"
        loading={deleting}
      />
    </Box>
  );
}