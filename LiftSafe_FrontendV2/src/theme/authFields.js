import { brand } from './colors';

export const authFieldSx = {
  '& .MuiFilledInput-root': {
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.07)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    '&:before, &:after': { display: 'none' },
    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
    '&.Mui-focused': {
      bgcolor: 'rgba(255,255,255,0.1)',
      borderColor: brand.accent,
    },
  },
  '& .MuiFilledInput-input': {
    color: '#fff',
    '&:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 100px ${brand.charcoalLight} inset`,
      WebkitTextFillColor: '#fff',
      caretColor: '#fff',
      borderRadius: 'inherit',
    },
  },
  '& .MuiInputLabel-root': { color: brand.silverDark },
  '& .MuiInputLabel-root.Mui-focused': { color: brand.accent },
  '& .MuiSelect-icon': { color: brand.silver },
};
