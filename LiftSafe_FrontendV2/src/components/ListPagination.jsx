import { TablePagination } from '@mui/material';

// position="top" se usa para repetir la paginación ENCIMA de la lista/tabla
// (con línea divisoria abajo); por defecto va al pie, como siempre.
export default function ListPagination({ count, page, onPageChange, rowsPerPage = 10, position = 'bottom', sx = {} }) {
  if (count <= rowsPerPage) return null;

  const borde = position === 'top'
    ? { borderBottom: 1, borderColor: 'divider' }
    : {};

  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[rowsPerPage]}
      labelDisplayedRows={({ from, to, count: total }) => `${from}-${to} de ${total}`}
      sx={{ ...borde, ...sx }}
    />
  );
}
