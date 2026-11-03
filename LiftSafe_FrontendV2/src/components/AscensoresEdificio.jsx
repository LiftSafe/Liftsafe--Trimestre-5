import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse, IconButton, MenuItem, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { clienteService } from '../services/clienteService';
import { ascensorService } from '../services/ascensorService';
import {
  ASCENSOR_VACIO, TIPOS_ASCENSOR, ascensorDesdeEdificio, datosEdicionAscensor, formDesdeAscensor, validarAscensor,
} from '../utils/edificios';

// Color del chip según el tipo de ascensor
const COLOR_TIPO = { Eléctrico: 'primary', Hidráulico: 'warning', Panorámico: 'info', Montacargas: 'secondary' };

// Tabla ordenada de los ascensores de un edificio
function TablaAscensores({ ascensores, onEditar, editandoId }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Ascensores del edificio">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' } }}>
            <TableCell>Código</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Marca y modelo</TableCell>
            <TableCell align="center">Pisos</TableCell>
            <TableCell>Capacidad</TableCell>
            <TableCell>Ubicación</TableCell>
            {onEditar && <TableCell align="right">Editar</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {ascensores.map((a) => (
            <TableRow
              key={a.id_ascensor}
              selected={editandoId === a.id_ascensor}
              sx={{ '&:last-child td': { borderBottom: 0 }, '& td': { fontSize: '0.82rem' } }}
            >
              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{a.codigo_interno}</TableCell>
              <TableCell>
                {a.tipo_ascensor
                  ? <Chip size="small" variant="outlined" color={COLOR_TIPO[a.tipo_ascensor] || 'default'} label={a.tipo_ascensor} />
                  : '—'}
              </TableCell>
              <TableCell>{[a.marca, a.modelo].filter(Boolean).join(' ') || '—'}</TableCell>
              <TableCell align="center">{a.numero_pisos ?? '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {a.capacidad_kg ? `${a.capacidad_kg} kg` : '—'}
                {a.capacidad_personas ? ` · ${a.capacidad_personas} pers.` : ''}
              </TableCell>
              <TableCell>{a.ubicacion_exacta || '—'}</TableCell>
              {onEditar && (
                <TableCell align="right" sx={{ py: 0 }}>
                  <IconButton size="small" color="primary" onClick={() => onEditar(a)} title={`Editar ascensor ${a.codigo_interno}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// Ascensores de un edificio del cliente: lista y formulario para agregar uno.
// enTarjeta: se muestra siempre abierto (sin el botón "Ascensores (n)"), dentro de la tarjeta del edificio.
export default function AscensoresEdificio({
  sede, idCliente, onCambio, soloLectura = false, abiertoAlInicio = false, enTarjeta = false,
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio || enTarjeta);
  const [ascensores, setAscensores] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null = formulario cerrado
  const [editandoId, setEditandoId] = useState(null); // id del ascensor que se edita (null = nuevo)
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto || ascensores) return;
    clienteService.listarAscensoresSede(sede.id_sede)
      .then((lista) => setAscensores(lista || []))
      .catch((err) => { setAscensores([]); setError(err.message || 'No se pudieron cargar los ascensores'); });
  }, [abierto, ascensores, sede.id_sede]);

  const campo = (nombre) => ({
    name: nombre,
    value: form?.[nombre] ?? '',
    onChange: (e) => setForm({ ...form, [nombre]: e.target.value }),
    size: 'small',
  });

  const guardar = async () => {
    const problema = validarAscensor(form);
    if (problema) { setError(problema); return; }
    setGuardando(true);
    setError('');
    try {
      if (editandoId) {
        await ascensorService.modificar(editandoId, datosEdicionAscensor(form));
      } else {
        await ascensorService.crear(ascensorDesdeEdificio(form, sede, idCliente));
      }
      setForm(null);
      setEditandoId(null);
      setAscensores(await clienteService.listarAscensoresSede(sede.id_sede));
      onCambio?.();
    } catch (err) {
      setError(err.message || (editandoId ? 'No se pudo guardar el ascensor' : 'No se pudo registrar el ascensor'));
    } finally {
      setGuardando(false);
    }
  };

  const total = ascensores ? ascensores.length : sede.total_ascensores || 0;

  return (
    <Box sx={enTarjeta ? {} : { pl: 1, pb: 1 }}>
      {!enTarjeta && (
        <Button
          size="small"
          startIcon={<ElevatorOutlinedIcon />}
          endIcon={abierto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setAbierto((v) => !v)}
          sx={{ textTransform: 'none' }}
        >
          Ascensores ({total})
        </Button>
      )}
      <Collapse in={abierto} unmountOnExit>
        <Box sx={enTarjeta ? {} : { pl: 1.5, pt: 0.5 }}>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {!ascensores ? (
            <CircularProgress size={20} />
          ) : (
            <>
              {!ascensores.length ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Este edificio todavía no tiene ascensores.</Typography>
              ) : (
                <TablaAscensores
                  ascensores={ascensores}
                  editandoId={editandoId}
                  onEditar={soloLectura ? null : (a) => { setEditandoId(a.id_ascensor); setForm(formDesdeAscensor(a)); setError(''); }}
                />
              )}
            </>
          )}

          {soloLectura ? null : form ? (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {editandoId ? `Editar ascensor ${ascensores?.find((a) => a.id_ascensor === editandoId)?.codigo_interno || ''}` : `Nuevo ascensor en ${sede.nombre}`}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                <TextField label="Código interno *" placeholder="Ej: ASC-120" {...campo('codigo_interno')} />
                <TextField select label="Tipo" {...campo('tipo_ascensor')}>
                  {TIPOS_ASCENSOR.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField label="Marca *" {...campo('marca')} />
                <TextField label="Modelo *" {...campo('modelo')} />
                <TextField label="Número de serie *" {...campo('numero_serie')} />
                <TextField label="Número de pisos *" type="number" {...campo('numero_pisos')} />
                <TextField label="Capacidad (kg) *" type="number" {...campo('capacidad_kg')} />
                <TextField label="Capacidad (personas)" type="number" {...campo('capacidad_personas')} />
                <TextField label="Ubicación en el edificio" placeholder="Ej: Torre A, ascensor 2" sx={{ gridColumn: '1 / -1' }} {...campo('ubicacion_exacta')} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1.5 }}>
                <Button size="small" onClick={() => { setForm(null); setEditandoId(null); setError(''); }}>Cancelar</Button>
                <Button size="small" variant="contained" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar ascensor'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} sx={{ mt: 1.5 }} onClick={() => { setEditandoId(null); setForm({ ...ASCENSOR_VACIO }); }}>
              Agregar ascensor
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
