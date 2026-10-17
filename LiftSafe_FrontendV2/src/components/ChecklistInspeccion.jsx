import { useMemo, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, IconButton, LinearProgress, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { brand } from '../theme/colors';
import { resumenChecklist } from '../utils/checklist';

// Opciones de calificación: el valor es el que guarda el backend.
const OPCIONES = [
  { valor: 'Cumple', texto: 'Cumple', color: '#1E8E5A', hover: 'rgba(30, 142, 90, 0.08)', Icono: CheckCircleRoundedIcon },
  { valor: 'No Cumple', texto: 'No cumple', color: '#D14343', hover: 'rgba(209, 67, 67, 0.08)', Icono: CancelRoundedIcon },
  { valor: 'No Aplica', texto: 'N/A', color: '#6B7A8C', hover: 'rgba(107, 122, 140, 0.10)', Icono: RemoveCircleRoundedIcon },
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
// Fotos de un ítem: botón "Foto (n)" abajo a la izquierda y miniaturas.
function FotosItem({ item, fotos, puedeSubir, onSubir, onEliminar, urlFoto }) {
  const [subiendo, setSubiendo] = useState(false);
  const idInput = `foto-item-${item.id_item}`;

  const elegirArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSubiendo(true);
    try {
      await onSubir(item, file);
    } finally {
      setSubiendo(false);
    }
  };

  if (!puedeSubir && !fotos.length) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
      {puedeSubir && (
        <>
          <input id={idInput} type="file" accept="image/jpeg,image/png" hidden onChange={elegirArchivo} />
          <label htmlFor={idInput}>
            <Button
              component="span"
              size="small"
              variant="text"
              disabled={subiendo}
              startIcon={subiendo ? <CircularProgress size={14} /> : <PhotoCameraOutlinedIcon />}
              sx={{
                borderRadius: 2.5, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', px: 1.5, py: 0.4,
                color: brand.blueDark, bgcolor: brand.accentSoft, border: 0,
                '&:hover': { bgcolor: 'rgba(0, 102, 204, 0.16)', border: 0 },
              }}
            >
              Foto ({fotos.length})
            </Button>
          </label>
        </>
      )}
      {fotos.map((foto) => (
        <Box key={foto.id_foto} sx={{ position: 'relative' }}>
          <a href={urlFoto(foto)} target="_blank" rel="noreferrer" title="Ver foto">
            <Box
              component="img"
              src={urlFoto(foto)}
              alt={`Foto del ítem: ${item.descripcion}`}
              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, border: '2px solid', borderColor: brand.white, boxShadow: '0 1px 4px rgba(11, 25, 41, 0.18)', display: 'block', bgcolor: brand.grayLight }}
            />
          </a>
          {puedeSubir && (
            <IconButton
              size="small"
              onClick={() => onEliminar(foto)}
              title="Quitar foto"
              sx={{ position: 'absolute', top: -8, right: -8, p: 0.25, bgcolor: brand.white, border: '1px solid', borderColor: brand.grayLight, '&:hover': { bgcolor: brand.surface } }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default function ChecklistInspeccion({
  categorias = [], detalles = {}, savingItem, onCalificar, onQuitar,
  fotos = [], puedeSubirFotos = false, onSubirFoto, onEliminarFoto, urlFoto = () => '',
}) {
  const [filtro, setFiltro] = useState('todos');
  const fotosDe = (idItem) => fotos.filter((f) => f.id_item === idItem);
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
                      // Barra suave con tres botones redondeados separados
                      p: 0.5, gap: 0.5, borderRadius: 3, bgcolor: brand.surface,
                      border: '1px solid', borderColor: brand.grayLight,
                      '& .MuiToggleButtonGroup-grouped': {
                        border: 0, m: 0, borderRadius: '10px !important',
                      },
                      '& .MuiToggleButton-root': {
                        textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', py: 0.75,
                        color: brand.silverDark, gap: 0.75, transition: 'all .15s ease',
                      },
                    }}
                  >
                    {OPCIONES.map(({ valor, texto, color, hover, Icono }) => (
                      <ToggleButton
                        key={valor}
                        value={valor}
                        sx={{
                          '&:hover': { bgcolor: hover, color },
                          '&.Mui-selected, &.Mui-selected:hover': {
                            bgcolor: color, color: brand.white, boxShadow: `0 2px 6px ${hover.replace(/0\.\d+\)$/, '0.35)')}`,
                          },
                        }}
                      >
                        {resultado === valor && <Icono sx={{ fontSize: 18 }} />}
                        {texto}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  <FotosItem
                    item={item}
                    fotos={fotosDe(item.id_item)}
                    puedeSubir={puedeSubirFotos && Boolean(onSubirFoto)}
                    onSubir={onSubirFoto}
                    onEliminar={onEliminarFoto}
                    urlFoto={urlFoto}
                  />
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
