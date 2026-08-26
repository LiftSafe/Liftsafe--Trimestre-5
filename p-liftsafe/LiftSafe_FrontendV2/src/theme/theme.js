import { createTheme } from '@mui/material/styles';
import { brand } from './colors';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.accent, dark: brand.accentHover, light: brand.blueLight },
    secondary: { main: brand.silverDark },
    background: { default: brand.surface, paper: brand.white },
    success: { main: '#0E7C4A' },
    warning: { main: '#C97B1A' },
    error: { main: '#C0392B' },
    text: { primary: brand.navy, secondary: brand.silverDark },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10, boxShadow: 'none' },
        containedPrimary: { bgcolor: brand.accent, '&:hover': { bgcolor: brand.accentHover } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(11,25,41,0.06)',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export default theme;
