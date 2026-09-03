// src/components/MessageDialog.jsx
//
// Reemplazo genérico de alert(). Mismo estilo visual que el ConfirmDialog
// que ya existía en Reports.jsx/Users.jsx, para que todos los módulos
// muestren sus mensajes de la misma forma en vez de usar el cuadro nativo
// del navegador (que no se puede personalizar y se ve fuera de lugar).

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const MESSAGE_ICONS = {
  success: <CheckCircleOutlinedIcon color="success" />,
  error: <CancelOutlinedIcon color="error" />,
  warning: <WarningAmberIcon color="warning" />,
  info: <InfoOutlinedIcon color="info" />,
};

export const MESSAGE_TITLES = {
  success: 'Éxito',
  error: 'Error',
  warning: 'Atención',
  info: 'Información',
};

export default function MessageDialog({ open, onClose, title, message, severity = 'info' }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {MESSAGE_ICONS[severity] || MESSAGE_ICONS.info}
          <Typography fontWeight={700}>{title || MESSAGE_TITLES[severity] || 'Información'}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} autoFocus>Aceptar</Button>
      </DialogActions>
    </Dialog>
  );
}
