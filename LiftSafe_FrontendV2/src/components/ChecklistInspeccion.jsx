import { useMemo, useState } from 'react';
import {
  Box, Chip, LinearProgress, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { brand } from '../theme/colors';
import { resumenChecklist } from '../utils/checklist';

// Opciones de calificación: el valor es el que guarda el backend.
const OPCIONES = [
  { valor: 'Cumple', texto: 'Cumple', color: '#1B8A4B', fondo: 'rgba(27, 138, 75, 0.14)' },
  { valor: 'No Cumple', texto: 'No cumple', color: '#C62828', fondo: 'rgba(198, 40, 40, 0.12)' },
  { valor: 'No Aplica', texto: 'N/A', color: brand.silverDark, fondo: brand.grayLight },
];

const FILTROS = [
  { id: 'todos', texto: 'Todos' },
  { id: 'pendientes', texto: 'Pendientes' },
  { id: 'nocumple', texto: 'No cumple' },
];

function pasaFiltro(filtro, resultado) {
  if (filtro === 'pendientes') return !resultado;
  if (filtro === 'nocumple') return resultado === 'No Cumple';
  return true;
}

// Checklist NTC 5926-1 con el estilo de la app de inspección:
// barra de progreso, filtros y botones grandes por ítem.
// Tocar otra vez la opción elegida quita la calificación.
export default function ChecklistInspeccion({ categorias = [], detalles = {}, savingItem, onCalificar, onQuitar }) {
  const [filtro, setFiltro] = useState('todos');
  const resumen = useMemo(() => resumenChecklist(categorias, detalles), [categorias, detalles]);
  const porcentaje = resumen.total ? Math.round((resumen.calificados / resumen.total) * 100) : 0;

  // Numeración continua de los ítems (1, 2, 3...) aunque estén en categorías distintas
  const bloques = categorias.reduce((acc, cat) => {
    const inicio = acc.length ? acc[acc.length - 1].fin : 0;
    const items = (cat.items || []).map((item, i) => ({
      item, numero: inicio + i + 1, resultado: detalles[item.id_item]?.resultado || '',
    }));
    return [...acc, { cat, items, fin: inicio + items.length, calificados: items.filter((i) => i.resultado).length }];
  }, []);

  const conteoFiltro = {
    todos: resumen.total,
    pendientes: resumen.total - resumen.calificados,
    nocumple: resumen.noCumple,
  };

  return (
    <Box>
      {/* Resumen y progreso */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="body2" fontWeight={700} sx={{ color: brand.navy }}>
          {resumen.calificados}/{resumen.total} calificados
          <Typography component="span" variant="body2" color="text.secondary" fontWeight={500}>
            {'  ·  '}No cumple: {resumen.noCumple}{'  ·  '}N/A: {resumen.noAplica}
          </Typography>
        </Typography>
        <LinearProgress
          variant="determinate"
          value={porcentaje}
          aria-label="Progreso del checklist"
          sx={{
            mt: 1, height: 6, borderRadius: 3, bgcolor: brand.grayLight,
            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: brand.accent },
          }}
        />
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {FILTROS.map((f) => {
          const activo = filtro === f.id;
          return (
            <Chip
              key={f.id}
              label={`${f.texto} (${conteoFiltro[f.id]})`}
              icon={activo ? <CheckIcon /> : undefined}
              onClick={() => setFiltro(f.id)}
              sx={{
                borderRadius: 5, fontWeight: 600, px: 0.5,
                bgcolor: activo ? brand.accentSoft : brand.surface,
                color: activo ? brand.blueDark : brand.silverDark,
                border: '1px solid', borderColor: activo ? brand.accent : brand.grayLight,
                '& .MuiChip-icon': { color: brand.blueDark },
              }}
            />
          );
        })}
      </Box>

      {bloques.map(({ cat, items, calificados }) => {
        const visibles = items.filter((i) => pasaFiltro(filtro, i.resultado));
        if (!visibles.length) return null;
        return (
          <Box key={cat.id_categoria} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1, pb: 0.5, borderBottom: '1px solid', borderColor: brand.grayLight }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: brand.blueDark }}>
                {cat.nombre_categoria}
              </Typography>
              <Typography variant="caption" color="text.secondary">{calificados}/{items.length}</Typography>
            </Box>

            {visibles.map(({ item, numero: n, resultado }) => (
              <Box key={item.id_item} sx={{ display: 'flex', gap: 1.5, py: 1.25 }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: brand.silverDark, minWidth: 24, textAlign: 'right', pt: 0.1 }}>
                  {n}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: brand.navy }}>{item.descripcion}</Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={resultado || null}
                    disabled={savingItem === item.id_item}
                    aria-label={`Calificación del ítem ${n}`}
                    onChange={(_e, valor) => (valor ? onCalificar(item, valor) : onQuitar(item))}
                    sx={{
                      borderRadius: 5, overflow: 'hidden', bgcolor: brand.white,
                      '& .MuiToggleButton-root': {
                        textTransform: 'none', fontWeight: 600, py: 0.9, border: '1px solid', borderColor: brand.grayLight, color: brand.silverDark,
                      },
                      '& .MuiToggleButtonGroup-firstButton': { borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
                      '& .MuiToggleButtonGroup-lastButton': { borderTopRightRadius: 20, borderBottomRightRadius: 20 },
                    }}
                  >
                    {OPCIONES.map((o) => (
                      <ToggleButton
                        key={o.valor}
                        value={o.valor}
                        sx={{
                          '&.Mui-selected, &.Mui-selected:hover': { bgcolor: o.fondo, color: o.color, borderColor: o.color },
                        }}
                      >
                        {o.texto}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              </Box>
            ))}
          </Box>
        );
      })}

      {filtro !== 'todos' && conteoFiltro[filtro] === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          {filtro === 'pendientes' ? '¡Todos los ítems están calificados!' : 'No hay ítems que no cumplan.'}
        </Typography>
      )}
    </Box>
  );
}
