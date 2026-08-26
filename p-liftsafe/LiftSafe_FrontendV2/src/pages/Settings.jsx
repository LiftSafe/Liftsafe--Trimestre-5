import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Switch, FormControlLabel, Divider, Alert } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, hasAction } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, expiry: true, reports: false });
  const isClient = user?.role === 'Cliente';
  const isInspector = user?.role === 'Inspector';

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <PageHeader title="Mi cuenta" subtitle="Datos personales y preferencias" breadcrumbs={[{ label: 'Inicio', path: '/dashboard' }, { label: 'Mi cuenta' }]} />
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Cambios guardados</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: hasAction('manageNotifications') ? '1fr 1fr' : '1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Datos personales</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Nombre completo" defaultValue={user?.name} fullWidth size="small" />
              <TextField label="Correo electrónico" defaultValue={user?.email} fullWidth size="small" />
              <TextField label="Teléfono" defaultValue="300 123 4567" fullWidth size="small" />
              {isInspector && <TextField label="Número de licencia" defaultValue="INS-2024-0892" fullWidth size="small" />}
              {isClient && <TextField label="Edificio" defaultValue="Torre Central" fullWidth size="small" disabled />}
            </Box>
          </CardContent>
        </Card>
        {hasAction('manageNotifications') && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Notificaciones</Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControlLabel control={<Switch checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })} />} label="Alertas por correo" />
              <FormControlLabel control={<Switch checked={notifications.expiry} onChange={(e) => setNotifications({ ...notifications, expiry: e.target.checked })} />} label="Vencimiento de certificados" />
              {!isClient && (
                <FormControlLabel control={<Switch checked={notifications.reports} onChange={(e) => setNotifications({ ...notifications, reports: e.target.checked })} />} label="Nuevos reportes" />
              )}
            </CardContent>
          </Card>
        )}
      </Box>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Seguridad</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Nueva contraseña" type="password" fullWidth size="small" />
            <TextField label="Confirmar contraseña" type="password" fullWidth size="small" />
          </Box>
        </CardContent>
      </Card>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={handleSave}>Guardar cambios</Button>
      </Box>
    </Box>
  );
}
