// src/components/PromptDialog.jsx
//
// Reemplazo genérico de window.prompt(). Pide un texto corto (motivo,
// concepto técnico, etc.) con el mismo estilo visual que el resto de
// diálogos, en vez del cuadro nativo del navegador.

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography } from '@mui/material';

export default function PromptDialog({ open, onClose, onConfirm, title, label, confirmText = 'Confirmar', required = false, helperText }) {
  // required: no deja confirmar con el texto vacío (ej: motivo del rechazo)
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography fontWeight={700}>{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label={label}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          helperText={helperText}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onConfirm(value)} disabled={required && !value.trim()}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
