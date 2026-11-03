import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Collapse, MenuItem, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ElevatorOutlinedIcon from '@mui/icons-material/ElevatorOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { clienteService } from '../services/clienteService';
import { ascensorService } from '../services/ascensorService';
import { ASCENSOR_VACIO, TIPOS_ASCENSOR, ascensorDesdeEdificio, validarAscensor } from '../utils/edificios';

// Ascensores de un edificio del cliente: lista y formulario para agregar uno.
export default function AscensoresEdificio({ sede, idCliente, onCambio, soloLectura = false, abiertoAlInicio = false }) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  const [ascensores, setAscensores] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null = formulario cerrado
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
      await ascensorService.crear(ascensorDesdeEdificio(form, sede, idCliente));
      setForm(null);
      setAscensores(await clienteService.listarAscensoresSede(sede.id_sede));
      onCambio?.();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el ascensor');
    } finally {
      setGuardando(false);
    }
  };

  const total = ascensores ? ascensores.length : sede.total_ascensores || 0;

  return (
    <Box sx={{ pl: 1, pb: 1 }}>
      <Button
        size="small"
        startIcon={<ElevatorOutlinedIcon />}
        endIcon={abierto ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        onClick={() => setAbierto((v) => !v)}
        sx={{ textTransform: 'none' }}
      >
        Ascensores ({total})
      </Button>
      <Collapse in={abierto} unmountOnExit>
        <Box sx={{ pl: 1.5, pt: 0.5 }}>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {!ascensores ? (
            <CircularProgress size={20} />
          ) : (
            <>
              {!ascensores.length && (
                <Typography variant="body2" color="text.secondary">Este edificio todavía no tiene ascensores.</Typography>
              )}
              {ascensores.map((a) => (
                <Typography key={a.id_ascensor} variant="body2" sx={{ py: 0.25 }}>
                  <strong>{a.codigo_interno}</strong>
                  <Typography component="span" variant="body2" color="text.secondary">
                    {'  ·  '}{[a.tipo_ascensor, `${a.marca} ${a.modelo}`, `${a.numero_pisos} pisos`, a.ubicacion_exacta].filter(Boolean).join(' · ')}
                  </Typography>
                </Typography>
              ))}
            </>
          )}

          {soloLectura ? null : form ? (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Nuevo ascensor en {sede.nombre}</Typography>
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
                <Button size="small" onClick={() => { setForm(null); setError(''); }}>Cancelar</Button>
                <Button size="small" variant="contained" onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar ascensor'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => setForm({ ...ASCENSOR_VACIO })}>
              Agregar ascensor
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
