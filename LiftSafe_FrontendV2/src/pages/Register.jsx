// src/pages/Register.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Box, 
  Alert, 
  InputAdornment, 
  MenuItem, 
  Tooltip,
  Typography  // ← AGREGAR ESTA IMPORTACIÓN
} from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AuthLayout from '../layouts/AuthLayout';
import PasswordRequirements from '../components/PasswordRequirements';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme/colors';
import { ADULT_DOCUMENT_TYPES } from '../config/api';
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
  '& .MuiSelect-icon': { color: brand.accent },
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    documentType: 'CC',  // ← Por defecto CC
    document: '',
    businessName: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.firstName || !form.lastName || !form.email || !form.document || !form.password) {
      setError('Completa los campos obligatorios');
      return;
    }
    if (!isPasswordValid(form.password)) {
      setError('La contraseña no cumple los requisitos de seguridad');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;

    const result = await register({
      ...form,
      name: fullName,
    });
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'No se pudo crear la cuenta');
    }
  };

  // Obtener descripción del tipo de documento seleccionado
  const selectedDocType = ADULT_DOCUMENT_TYPES.find(d => d.value === form.documentType);

  return (
    <AuthLayout
      allowScroll
      title="Crear cuenta"
      subtitle="Registro disponible solo para clientes"
    >
      <Box component="form" onSubmit={handleSubmit}>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          
          {/* Nombre */}
          <TextField 
            fullWidth 
            size="small" 
            label="Nombre" 
            name="firstName" 
            value={form.firstName} 
            onChange={handleChange} 
            sx={fieldSx}
            required
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              ) 
            }} 
          />

          {/* Apellidos */}
          <TextField 
            fullWidth 
            size="small" 
            label="Apellidos" 
            name="lastName" 
            value={form.lastName} 
            onChange={handleChange} 
            sx={fieldSx}
            required
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              ) 
            }} 
          />

          {/* Correo */}
          <TextField 
            fullWidth 
            size="small" 
            label="Correo electrónico" 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            sx={fieldSx}
            required
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              ) 
            }} 
          />

          {/* ========== TIPO DE DOCUMENTO CON INFO ========== */}
          <TextField 
            fullWidth 
            size="small" 
            select 
            label="Tipo de documento" 
            name="documentType" 
            value={form.documentType} 
            onChange={handleChange} 
            sx={fieldSx}
            required
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: selectedDocType && (
                <InputAdornment position="end">
                  <Tooltip title={`${selectedDocType.description} | Entidad: ${selectedDocType.entity}`}>
                    <InfoOutlinedIcon sx={{ color: brand.silverDark, fontSize: 18, cursor: 'help' }} />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          >
            {ADULT_DOCUMENT_TYPES.map((doc) => (
              <MenuItem key={doc.value} value={doc.value}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {doc.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 11 }}>
                    {doc.entity}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {/* Número de documento */}
          <TextField 
            fullWidth 
            size="small" 
            label={form.documentType === 'NIT' ? 'Número de NIT' : 'Número de documento'} 
            name="document" 
            value={form.document} 
            onChange={handleChange} 
            sx={fieldSx}
            required
          />

          {/* Razón social (solo NIT) */}
          {form.documentType === 'NIT' && (
            <TextField 
              fullWidth 
              size="small" 
              label="Razón social" 
              name="businessName" 
              value={form.businessName} 
              onChange={handleChange} 
              sx={fieldSx} 
            />
          )}

          {/* Contraseña */}
          <TextField 
            fullWidth 
            size="small" 
            label="Contraseña" 
            name="password" 
            type="password" 
            value={form.password} 
            onChange={handleChange} 
            sx={fieldSx}
            required
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: brand.accent, fontSize: 20 }} />
                </InputAdornment>
              ) 
            }} 
          />
          <PasswordRequirements password={form.password} />

          {/* Confirmar contraseña */}
          <TextField 
            fullWidth 
            size="small" 
            label="Confirmar contraseña" 
            name="confirm" 
            type="password" 
            value={form.confirm} 
            onChange={handleChange} 
            sx={fieldSx}
            required
          />
        </Box>

        <Button
          type="submit" 
          fullWidth 
          variant="contained" 
          size="medium"
          sx={{
            py: 1.2, 
            mt: 2, 
            mb: 1.5,
            bgcolor: brand.accent, 
            '&:hover': { bgcolor: brand.accentHover },
            boxShadow: '0 4px 20px rgba(43,124,184,0.4)',
          }}
        >
          Crear cuenta de cliente
        </Button>
        
        <Box textAlign="center">
          <Link to="/login" style={{ color: brand.accent, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </Box>
      </Box>
    </AuthLayout>
  );
}