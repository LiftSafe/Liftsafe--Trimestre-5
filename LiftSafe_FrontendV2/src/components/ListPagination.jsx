import { TablePagination } from '@mui/material';

export default function ListPagination({ count, page, onPageChange, rowsPerPage = 10 }) {
  if (count <= rowsPerPage) return null;

  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[rowsPerPage]}
      labelDisplayedRows={({ from, to, count: total }) => `${from}-${to} de ${total}`}
    />
  );
}
