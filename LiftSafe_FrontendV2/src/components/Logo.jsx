import { Box } from '@mui/material';
import logo from '../assets/logo.png';

export default function Logo({ width = 180, sx = {} }) {
  return (
    <Box
      component="img"
      src={logo}
      alt="LiftSafe - Sistema de Inspecciones"
      sx={{ width, height: 'auto', display: 'block', mx: 'auto', ...sx }}
    />
  );
}
