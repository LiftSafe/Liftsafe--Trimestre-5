import { Box, Typography, Chip } from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { brand, gradients } from '../theme/colors';

const ROLE_LABELS = {
  Administrador: { label: 'Panel administrativo', color: brand.accent },
  Asesor: { label: 'Panel comercial', color: '#E65100' },
  Coordinador: { label: 'Panel de coordinación', color: '#2C3E50' },
  'Director Técnico': { label: 'Dirección técnica', color: '#7C5CBF' },
  Inspector: { label: 'Panel de inspección', color: '#0E7C4A' },
  Cliente: { label: 'Portal del cliente', color: '#7C5CBF' },
};

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function getFormattedDate() {
  const now = new Date();
  return `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export default function WelcomeBanner({ name, role, welcomeIcon, actions  }) {
  const meta = ROLE_LABELS[role] || { label: 'Mi panel', color: brand.accent };
  const firstName = name?.split(' ')[0] || '';

  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background: gradients.hero,
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: -40, right: -20, width: 180, height: 180, borderRadius: '50%', bgcolor: brand.accentGlow, filter: 'blur(50px)' }} />
      <Box sx={{ position: 'absolute', bottom: -60, left: '30%', width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(14,124,74,0.15)', filter: 'blur(40px)' }} />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

<Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
  <Box>
    <Typography variant="overline" sx={{ color: brand.silverDark, letterSpacing: '0.12em', fontSize: 10 }}>
      BIENVENIDO
    </Typography>
    <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
      Hola, {role} {firstName}
      {welcomeIcon}
    </Typography>
    <Typography variant="body2" sx={{ color: brand.silver, mt: 0.5 }}>
      {meta.label} · LiftSafe
    </Typography>
  </Box>

  {/* ✅ NUEVO: Botones de acción rápida */}
  {actions && (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {actions}
    </Box>
  )}

  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            icon={<CalendarTodayOutlinedIcon sx={{ fontSize: '14px !important', color: `${brand.silver} !important` }} />}
            label={getFormattedDate()}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.06)',
              color: brand.silver,
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 500,
              fontSize: 11,
            }}
          />
          {/* Etiqueta del rol, ej: "Administrador", "Asesor", etc. 
        <Chip
             label={role}
             size="small"
            sx={{
              bgcolor: `${meta.color}22`,
              color: meta.color,
              border: `1px solid ${meta.color}55`,
              fontWeight: 700,
              fontSize: 11,
            }} 
          /> */}
        </Box> 
      </Box> 
    </Box> 
  );
}
