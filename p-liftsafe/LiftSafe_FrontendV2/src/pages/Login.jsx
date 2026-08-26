import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Alert, InputAdornment } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/colors';

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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Correo o contraseña incorrectos');
    }
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Ingresa tus credenciales para continuar"
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth size="small" label="Correo electrónico" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required
            sx={fieldSx}
            InputProps={{
              startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} /></InputAdornment>
            }}
          />
          <TextField
            fullWidth size="small" label="Contraseña" type="password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
            sx={fieldSx}
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} /></InputAdornment>
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Link to="/forgot-password" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>
        <Button
          type="submit" fullWidth variant="contained" size="medium" disabled={loading}
          sx={{
            py: 1.2, mt: 2, mb: 1.5,
            bgcolor: brand.accent, '&:hover': { bgcolor: brand.accentHover || brand.accent },
            boxShadow: '0 4px 20px rgba(43,124,184,0.4)',
          }}
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </Button>
        <Box textAlign="center">
          <Link to="/register" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            ¿Eres cliente? Regístrate aquí
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}
