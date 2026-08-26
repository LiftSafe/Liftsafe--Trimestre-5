import { Box, Typography } from '@mui/material';
import Logo from '../components/Logo';
import { brand } from '../theme/colors';

export default function AuthLayout({ children, title, subtitle, allowScroll = false }) {
  return (
    <Box sx={{ height: '100dvh', overflow: 'hidden', display: 'flex', bgcolor: brand.charcoal }}>
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: 1,
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          bgcolor: brand.navy,
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <Box sx={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', bgcolor: brand.accentGlow, filter: 'blur(80px)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 4 }}>
          <Logo width={180} sx={{ mb: 2, filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }} />
          <Typography variant="overline" sx={{ color: brand.accent, letterSpacing: '0.2em', fontWeight: 700 }}>
            INSPECCIÓN · CERTIFICACIÓN · SEGURIDAD
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 1.5, sm: 2 }, bgcolor: brand.charcoal, overflow: 'hidden' }}>
        <Box
          sx={{
            width: '100%', maxWidth: 400,
            maxHeight: allowScroll ? 'calc(100dvh - 24px)' : 'calc(100dvh - 24px)',
            overflow: allowScroll ? 'auto' : 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            bgcolor: brand.charcoalLight,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'center', mb: 1 }}>
            <Logo width={90} />
          </Box>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', mb: 0.3 }}>{title}</Typography>
          <Typography variant="caption" sx={{ color: brand.silver, mb: 2, display: 'block' }}>{subtitle}</Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
