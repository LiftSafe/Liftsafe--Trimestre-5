import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Divider, IconButton, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { fotografiaService } from '../services/fotografiaService';
import { firmaService } from '../services/firmaService';
import { API_BASE_URL } from '../config/api';

const inspeccionService = {
  listar: () => apiClient.get('/inspecciones/mis-inspecciones'),
  obtener: (id) => apiClient.get(`/inspecciones/${id}`),
  crear: (data) => apiClient.post('/inspecciones/crear', data),
  actualizarEstado: (id, estado) => apiClient.put(`/inspecciones/${id}/estado?estado=${estado}`),
};

const checklistService = {
  listarPorInspeccion: (id) => apiClient.get(`/checklist/inspeccion/${id}`),
};

const statusColor = {
  Programada: 'warning',
  'En Progreso': 'info',
  Completada: 'success',
  Finalizada: 'success',
  Aprobada: 'success',
  Cancelada: 'error',
  Borrador: 'default',
};

function SignaturePad({ onSave, disabled, label }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    if (disabled) return;
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing.current || disabled) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    drawing.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const guardar = () => {
    const firma = canvasRef.current.toDataURL('image/png');
    onSave(firma);
  };

  return (
    <Box sx={{ flex: 1, minWidth: 220 }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Box
        sx={{
          border: '1px solid #ccc',
          borderRadius: 1,
          bgcolor: disabled ? 'grey.100' : '#fff',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={120}
          style={{ display: 'block', width: '100%', cursor: disabled ? 'not-allowed' : 'crosshair' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </Box>
      {!disabled && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button size="small" onClick={limpiar}>Limpiar</Button>
          <Button size="small" variant="contained" onClick={guardar}>Firmar</Button>
        </Box>
      )}
    </Box>
  );
}

export default function Inspections() {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [newInspection, setNewInspection] = useState({
    id_ascensor: '',
    id_inspector: '',
    fecha_programada: '',
    observaciones_generales: '',
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [firmas, setFirmas] = useState({
    firma_inspector: false,
    firma_cliente: false,
    ambas_firmas: false,
  });
  const [fotos, setFotos] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fotoDescripcion, setFotoDescripcion] = useState('');

  const userRol = user?.rol || user?.role;

  const cargarInspecciones = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await inspeccionService.listar();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando inspecciones:', err);
      setError('Error al cargar las inspecciones. Verifica tu conexión con el backend.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await inspeccionService.listar();
        if (!cancelled) {
          setInspections(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando inspecciones:', err);
          setError('Error al cargar las inspecciones. Verifica tu conexión con el backend.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const abrirDetalle = async (row) => {
    setSelected(row);
    setDetailOpen(true);
    setLoadingDetail(true);
    setChecklist([]);
    setFotos([]);
    setFirmas({ firma_inspector: false, firma_cliente: false, ambas_firmas: false });

    try {
      const id = row.id_inspeccion || row.id;
      const detalle = await inspeccionService.obtener(id);
      setSelected(detalle);

      try {
        const checklistData = await checklistService.listarPorInspeccion(id);
        setChecklist(Array.isArray(checklistData) ? checklistData : []);
      } catch {
        setChecklist([]);
      }

      try {
        const firmasData = await firmaService.verificarFirmas(id);
        setFirmas(firmasData);
      } catch {
        setFirmas({ firma_inspector: false, firma_cliente: false, ambas_firmas: false });
      }

      if (detalle.id_informe) {
        try {
          const fotosData = await fotografiaService.listarPorInforme(detalle.id_informe);
          setFotos(Array.isArray(fotosData) ? fotosData : []);
        } catch {
          setFotos([]);
        }
      }
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const crearInspeccion = async () => {
    try {
      await inspeccionService.crear(newInspection);
      setOpenCreate(false);
      setNewInspection({ id_ascensor: '', id_inspector: '', fecha_programada: '', observaciones_generales: '' });
      await cargarInspecciones();
      alert('Inspección creada exitosamente');
    } catch (err) {
      console.error('Error creando inspección:', err);
      alert('Error al crear la inspección');
    }
  };

  const subirFoto = async () => {
    if (!selectedFile) {
      alert('Selecciona una foto primero');
      return;
    }
    if (!selected?.id_informe) {
      alert('Esta inspección no tiene un informe asociado');
      return;
    }
    try {
      await fotografiaService.subir(selected.id_informe, selectedFile, fotoDescripcion);
      setSelectedFile(null);
      setFotoDescripcion('');
      const fotosData = await fotografiaService.listarPorInforme(selected.id_informe);
      setFotos(Array.isArray(fotosData) ? fotosData : []);
    } catch (err) {
      console.error('Error subiendo foto:', err);
      alert('Error al subir la foto');
    }
  };

  const eliminarFoto = async (idFoto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      await fotografiaService.eliminar(idFoto);
      const fotosData = await fotografiaService.listarPorInforme(selected.id_informe);
      setFotos(Array.isArray(fotosData) ? fotosData : []);
    } catch (err) {
      console.error('Error eliminando foto:', err);
      alert('Error al eliminar la foto');
    }
  };

  const firmarComoInspector = async (firmaBase64) => {
    const id = selected?.id_inspeccion || selected?.id;
    try {
      await firmaService.firmarInspector(id, { firma: firmaBase64 });
      const firmasData = await firmaService.verificarFirmas(id);
      setFirmas(firmasData);
      alert('Firma del inspector registrada');
    } catch (err) {
      alert(err.message || 'Error al registrar firma');
    }
  };

  const firmarComoCliente = async (firmaBase64) => {
    const id = selected?.id_inspeccion || selected?.id;
    try {
      await firmaService.firmarCliente(id, { firma: firmaBase64 });
      const firmasData = await firmaService.verificarFirmas(id);
      setFirmas(firmasData);
      alert('Firma del cliente registrada');
    } catch (err) {
      alert(err.message || 'Error al registrar firma');
    }
  };

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
        title="Inspecciones"
        subtitle={userRol === 'Administrador' ? 'Gestión global de inspecciones' : 'Tus inspecciones asignadas'}
        breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Inspecciones' }]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {userRol !== 'Cliente' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            Nueva inspección
          </Button>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Edificio/Ascensor</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Inspector</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Firmas</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!inspections || inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No hay inspecciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((row) => (
                    <TableRow
                      key={row.id_inspeccion || row.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => abrirDetalle(row)}
                    >
                      <TableCell>
                        <Typography fontWeight={600} color="primary.main">
                          {row.id_inspeccion || row.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.codigo_ascensor || row.elevator || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.marca || ''}</Typography>
                      </TableCell>
                      <TableCell>{row.tipo_servicio || row.type || 'Periódica'}</TableCell>
                      <TableCell>{row.nombre_inspector || row.inspector || 'N/A'}</TableCell>
                      <TableCell>{row.fecha_inicio ? new Date(row.fecha_inicio).toLocaleDateString() : row.date || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.estado || row.status || 'Pendiente'}
                          color={statusColor[row.estado || row.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.firma_inspector && row.firma_cliente ? '✅' :
                          row.firma_inspector ? '⚠️ Inspector' :
                            row.firma_cliente ? '⚠️ Cliente' : '❌'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          Nueva inspección
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setOpenCreate(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="ID del Ascensor" fullWidth type="number" value={newInspection.id_ascensor}
              onChange={(e) => setNewInspection({ ...newInspection, id_ascensor: e.target.value })} required />
            <TextField label="ID del Inspector" fullWidth type="number" value={newInspection.id_inspector}
              onChange={(e) => setNewInspection({ ...newInspection, id_inspector: e.target.value })} required />
            <TextField label="Fecha programada" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={newInspection.fecha_programada}
              onChange={(e) => setNewInspection({ ...newInspection, fecha_programada: e.target.value })} required />
            <TextField label="Observaciones iniciales" multiline rows={3} fullWidth
              value={newInspection.observaciones_generales}
              onChange={(e) => setNewInspection({ ...newInspection, observaciones_generales: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={crearInspeccion}>Crear inspección</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography fontWeight={700}>Inspección #{selected?.id_inspeccion || selected?.id}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selected?.codigo_ascensor || selected?.elevator || 'N/A'} ·
                {selected?.tipo_servicio || selected?.type || 'Periódica'}
              </Typography>
            </Box>
            <Chip label={selected?.estado || selected?.status || 'Pendiente'}
              color={statusColor[selected?.estado || selected?.status] || 'default'} />
          </Box>
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setDetailOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Fecha inicio</Typography>
                  <Typography variant="body2">
                    {selected?.fecha_inicio ? new Date(selected.fecha_inicio).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body2">{selected?.observaciones_generales || 'Sin observaciones'}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
                Firmas Digitales
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                <Typography variant="body2" color={firmas?.firma_inspector ? 'success.main' : 'error.main'}>
                  Inspector: {firmas?.firma_inspector ? 'Firmado' : 'Pendiente'}
                </Typography>
                <Typography variant="body2" color={firmas?.firma_cliente ? 'success.main' : 'error.main'}>
                  Cliente: {firmas?.firma_cliente ? 'Firmado' : 'Pendiente'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                {userRol === 'Inspector' && (
                  <SignaturePad
                    label="Firma del inspector"
                    disabled={firmas?.firma_inspector}
                    onSave={firmarComoInspector}
                  />
                )}
                {userRol === 'Cliente' && (
                  <SignaturePad
                    label="Firma del cliente"
                    disabled={firmas?.firma_cliente}
                    onSave={firmarComoCliente}
                  />
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
                Checklist de Inspección
              </Typography>
              {!checklist || checklist.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No hay items de checklist registrados
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  {checklist.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <Chip label={item.resultado || 'Pendiente'} size="small" />
                      <Typography variant="body2">{item.descripcion || `Item ${item.id_item}`}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
                Fotografías ({fotos.length})
              </Typography>

              {userRol === 'Inspector' && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                  <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} id="foto-upload"
                    onChange={(e) => setSelectedFile(e.target.files[0])} />
                  <label htmlFor="foto-upload">
                    <Button variant="outlined" component="span" startIcon={<PhotoCameraIcon />}>
                      Seleccionar foto
                    </Button>
                  </label>
                  {selectedFile && <Typography variant="body2">{selectedFile.name}</Typography>}
                  <TextField label="Descripción" size="small" value={fotoDescripcion}
                    onChange={(e) => setFotoDescripcion(e.target.value)} sx={{ flex: 1, minWidth: 150 }} />
                  <Button variant="contained" onClick={subirFoto} disabled={!selectedFile}>Subir</Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {!fotos || fotos.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay fotos</Typography>
                ) : (
                  fotos.map((foto) => (
                    <Box key={foto.id_foto} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, width: 130, position: 'relative' }}>
                      <img
                        src={`${API_BASE_URL}/${foto.ruta_archivo.replace(/\\/g, '/')}`}
                        alt={foto.descripcion || 'Foto'}
                        style={{ width: '100%', height: 80, objectFit: 'cover' }}
                      />
                      <Typography variant="caption" display="block" noWrap>
                        {foto.descripcion || 'Sin descripción'}
                      </Typography>
                      {userRol === 'Inspector' && (
                        <IconButton size="small" color="error" onClick={() => eliminarFoto(foto.id_foto)}
                          sx={{ position: 'absolute', top: 0, right: 0 }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
