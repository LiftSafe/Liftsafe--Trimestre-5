import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TextField, Button, Box, Alert, InputAdornment } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AuthLayout from '../layouts/AuthLayout';
import PasswordRequirements from '../components/PasswordRequirements';
import { brand } from '../theme/colors';
import { resetPasswordRequest } from '../services/authService';
import { isPasswordValid } from '../utils/passwordValidation';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.05)',
    '& fieldset': { borderColor: 'rgba(43,124,184,0.3)' },
    '&:hover fieldset': { borderColor: brand.accent },
    '&.Mui-focused fieldset': { borderColor: brand.accent },
  },
  '& .MuiInputLabel-root': { color: brand.silverDark },
  '& .MuiInputLabel-root.Mui-focused': { color: brand.accent },
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('El enlace no es válido. Solicita uno nuevo.');
      return;
    }
    if (!isPasswordValid(password)) {
      setError('La contraseña no cumple los requisitos de seguridad');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await resetPasswordRequest(token, password);
      setMessage(data.message || 'Contraseña actualizada correctamente');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Ingresa y confirma tu nueva contraseña"
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 1.5 }}>{message}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth size="small" label="Nueva contraseña" type="password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
            sx={fieldSx}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} /></InputAdornment>
            }}
          />
          <PasswordRequirements password={password} />
          <TextField
            fullWidth size="small" label="Confirmar contraseña" type="password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required
            sx={fieldSx}
          />
        </Box>
        <Button
          type="submit" fullWidth variant="contained" size="medium" disabled={loading}
          sx={{
            py: 1.2, mt: 2, mb: 1.5,
            bgcolor: brand.accent, '&:hover': { bgcolor: brand.accentHover || brand.accent },
            boxShadow: '0 4px 20px rgba(43,124,184,0.4)',
          }}
        >
          {loading ? 'Guardando...' : 'Restablecer contraseña'}
        </Button>
        <Box textAlign="center">
          <Link to="/login" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Volver al inicio de sesión
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}
