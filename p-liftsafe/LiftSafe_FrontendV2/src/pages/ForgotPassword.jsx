import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Alert, InputAdornment, Typography } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import AuthLayout from '../layouts/AuthLayout';
import PasswordRequirements from '../components/PasswordRequirements';
import { brand } from '../theme/colors';
import { recoverPasswordRequest, resetPasswordWithCodeRequest } from '../services/authService';
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
  // ✅ NUEVO: Asegurar que los textos de requisitos se vean
  '& .MuiTypography-root': { color: '#fff' },
  '& .MuiSvgIcon-root': { color: brand.silverDark },
};

// Paso 1: ingresar correo → recibir código
// Paso 2: ingresar código + nueva contraseña → reset

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = código + nueva contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Paso 1: solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await recoverPasswordRequest(email);
      // ✅ CORREGIDO: Si el mensaje contiene "Error", va en rojo
      if (data.message && data.message.includes('Error')) {
        setError(data.message);
      } else {
        setMessage(data.message || 'Si el correo existe, recibirás un código de recuperación');
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: enviar código + nueva contraseña
  const handleResetWithCode = async (e) => {
    e.preventDefault();
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
      // El endpoint reset-clave ahora recibe { correo, code, nueva_contrasena }
const data = await resetPasswordWithCodeRequest(email, code, password);
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
      title={step === 1 ? 'Recuperar contraseña' : 'Ingresa tu código'}
      subtitle={
        step === 1
          ? 'Te enviaremos un código de 6 dígitos a tu correo'
          : `Código enviado a ${email}`
      }
    >
      {/* ── Paso 1: correo ─────────────────────────────────────── */}
      {step === 1 && (
        <Box component="form" onSubmit={handleRequestCode}>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 1.5 }}>{message}</Alert>}
          <TextField
            fullWidth size="small" label="Correo electrónico" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required
            sx={fieldSx}
            InputProps={{
              startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} /></InputAdornment>
            }}
          />
          <Button
            type="submit" fullWidth variant="contained" size="medium" disabled={loading}
            sx={{
              py: 1.2, mt: 2, mb: 1.5,
              bgcolor: brand.accent, '&:hover': { bgcolor: brand.accentHover || brand.accent },
              boxShadow: '0 4px 20px rgba(43,124,184,0.4)',
            }}
          >
            {loading ? 'Enviando...' : 'Enviar código de recuperación'}
          </Button>
          <Box textAlign="center">
            <Link to="/login" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Volver al inicio de sesión
            </Link>
          </Box>
        </Box>
      )}

      {/* ── Paso 2: código + nueva contraseña ─────────────────── */}
      {step === 2 && (
        <Box component="form" onSubmit={handleResetWithCode}>
          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 1.5 }}>{message}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              fullWidth size="small" label="Código de 6 dígitos" type="text"
              inputProps={{ maxLength: 6, pattern: '[0-9]*', inputMode: 'numeric' }}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required
              sx={fieldSx}
              InputProps={{
                startAdornment: <InputAdornment position="start"><TagOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} /></InputAdornment>
              }}
            />
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
          <Box textAlign="center" sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              component="span"
              onClick={() => { setStep(1); setError(''); setMessage(''); }}
              sx={{ color: brand.silverDark, cursor: 'pointer', fontSize: 14 }}
            >
              ← Cambiar correo
            </Typography>
            <Link to="/login" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Volver al login
            </Link>
          </Box>
        </Box>
      )}
    </AuthLayout>
  );
}

