import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Radio, RadioGroup, TextField, Typography,
} from '@mui/material';
import { programacionService } from '../services/programacionService';

// Cancela la visita programada de una solicitud (Coordinador / Administrador).
// La solicitud vuelve a Pendiente para reprogramarla, o queda Cancelada.
export default function CancelarVisitaDialog({ solicitud, onClose, onCancelada }) {
  const [motivo, setMotivo] = useState('');
  const [destino, setDestino] = useState('reprogramar');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const confirmar = async () => {
    setGuardando(true);
    setError('');
    try {
      await programacionService.cancelarVisita(solicitud.id_solicitud, motivo.trim(), destino === 'cancelar');
      onCancelada();
    } catch (e) {
      setError(e.message || 'No se pudo cancelar la visita');
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={guardando ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancelar visita</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {solicitud.ascensor?.codigo_interno || `Solicitud #${solicitud.id_solicitud}`}
          {solicitud.cliente?.nombre_completo ? ` · ${solicitud.cliente.nombre_completo}` : ''}.
          Se avisará al inspector y al cliente.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Motivo" required fullWidth multiline minRows={2} autoFocus
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
        />
        <Typography variant="subtitle2" sx={{ mt: 2 }}>¿Qué pasa con la solicitud?</Typography>
        <RadioGroup value={destino} onChange={(e) => setDestino(e.target.value)}>
          <FormControlLabel value="reprogramar" control={<Radio />} label="Vuelve a Pendiente para programarla otra vez" />
          <FormControlLabel value="cancelar" control={<Radio />} label="Se cancela la solicitud (no se hará la inspección)" />
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={guardando}>Volver</Button>
        <Button variant="contained" color="warning" onClick={confirmar} disabled={guardando || !motivo.trim()}>
          {guardando ? 'Cancelando...' : 'Cancelar visita'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
