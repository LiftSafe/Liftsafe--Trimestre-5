import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function PageHeader({ title, subtitle, breadcrumbs = [] }) {
  return (
    <Box sx={{ mb: 2 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((b, i) =>
            b.path ? (
              <Link key={i} component={RouterLink} to={b.path} underline="hover" color="inherit" variant="body2">{b.label}</Link>
            ) : (
              <Typography key={i} variant="body2" color="text.primary">{b.label}</Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Typography variant="h5" fontWeight={700} color="primary.dark">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
    </Box>
  );
}
