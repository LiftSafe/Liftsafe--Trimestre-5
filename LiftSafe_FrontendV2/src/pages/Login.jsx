import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  TextField, Button, Box, Alert, InputAdornment, 
  CircularProgress, Typography 
} from '@mui/material';
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
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
      WebkitBoxShadow: `0 0 0 100px ${brand.charcoalLight} inset`,
      WebkitTextFillColor: '#fff',
      caretColor: '#fff',
    },
  },
  '& .MuiInputLabel-root': { color: brand.silverDark },
  '& .MuiInputLabel-root.Mui-focused': { color: brand.accent },
};

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ============================================
  // REDIRECCIONAR SI YA ESTÁ LOGUEADO
  // Un solo useEffect: si ya hay sesión activa y alguien entra a /login
  // a mano (ej. escribiendo la URL), lo mandamos al dashboard.
  // La redirección post-login exitoso la hace SOLO handleSubmit,
  // para no disparar dos navigate() casi al mismo tiempo (eso era
  // lo que causaba el parpadeo/loop con /dashboard).
  // ============================================
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // HANDLE SUBMIT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      setLoading(false);

      if (result.success) {
        // Redirigir a la página que intentaba visitar o al dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from);
      } else {
        setError(result.message || 'Correo o contraseña incorrectos');
      }
    } catch (err) {
      setLoading(false);
      console.error('Error en login:', err);
      setError('Correo o contraseña incorrectos');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Ingresa tus credenciales para continuar"
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth 
            size="small" 
            label="Correo electrónico" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            autoComplete="email"
            sx={fieldSx}
            slotProps={{ input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              )
            } , inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth 
            size="small" 
            label="Contraseña" 
            type="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            autoComplete="current-password"
            sx={fieldSx}
            slotProps={{ input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              )
            } , inputLabel: { shrink: true } }}
          />
        </Box>
        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Link 
            to="/forgot-password" 
            style={{ 
              color: brand.accent, 
              textDecoration: 'none', 
              fontWeight: 600, 
              fontSize: 13 
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </Box>
        <Button
          type="submit" 
          fullWidth 
          variant="contained" 
          size="medium" 
          disabled={loading}
          sx={{
            py: 1.2, 
            mt: 2, 
            mb: 1.5,
            bgcolor: brand.accent, 
            '&:hover': { bgcolor: brand.accentHover || brand.accent },
            boxShadow: '0 4px 20px rgba(43,124,184,0.4)',
            position: 'relative',
          }}
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
                color: '#fff',
              }}
            />
          )}
        </Button>
        <Box textAlign="center">
          <Link 
            to="/register" 
            style={{ 
              color: brand.accent, 
              textDecoration: 'none', 
              fontWeight: 600, 
              fontSize: 14 
            }}
          >
            ¿Eres cliente? Regístrate aquí
          </Link>
        </Box>
        <Box textAlign="center" sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: brand.silverDark }}>
            © 2024 LiftSafe - Todos los derechos reservados
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}