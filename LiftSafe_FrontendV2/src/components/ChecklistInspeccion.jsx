import { useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, IconButton, LinearProgress, Pagination, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { brand } from '../theme/colors';
import { resumenChecklist, RESULTADO_FOTO_OBLIGATORIA } from '../utils/checklist';

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

// Color del nivel de defecto según la NTC 5926-1 (Leve, Grave, Muy grave)
const COLOR_NIVEL = { 'Muy grave': '#D14343', Grave: '#C77700', Leve: '#6B7A8C' };

function pasaFiltro(filtro, resultado) {
  if (filtro === 'pendientes') return !resultado;
  if (filtro === 'nocumple') return resultado === 'No Cumple';
  return true;
}

// Checklist NTC 5926-1 con el estilo de la app de inspección:
// barra de progreso, filtros y botones grandes por ítem.
// Tocar otra vez la opción elegida quita la calificación.
// Fotos de un ítem: botón "Foto (n)" abajo a la izquierda y miniaturas.
function FotosItem({ item, fotos, puedeSubir, onSubir, onEliminar, urlFoto, obligatoria = false }) {
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
          {obligatoria && !fotos.length && (
            <Typography variant="caption" role="alert" sx={{ color: '#D14343', fontWeight: 600 }}>
              Foto obligatoria: los ítems que no cumplen deben tener foto.
            </Typography>
          )}
        </>
      )}
      {fotos.map((foto, i) => (
        <Box key={foto.id_foto} sx={{ position: 'relative', textAlign: 'center' }}>
          <a href={urlFoto(foto)} target="_blank" rel="noreferrer" title="Ver foto">
            <Box
              component="img"
              src={urlFoto(foto)}
              alt={`Foto del ítem: ${item.descripcion}`}
              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, border: '2px solid', borderColor: brand.white, boxShadow: '0 1px 4px rgba(11, 25, 41, 0.18)', display: 'block', bgcolor: brand.grayLight }}
            />
          </a>
          <Box
            component="a"
            href={urlFoto(foto)}
            target="_blank"
            rel="noreferrer"
            sx={{ display: 'block', mt: 0.25, fontSize: '0.68rem', fontWeight: 600, color: brand.accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {fotos.length > 1 ? `Ver foto ${i + 1}` : 'Ver foto'}
          </Box>
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

// RF-008: observación técnica de un ítem (qué se encontró, por qué no cumple...)
function ObservacionItem({ item, texto, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);

  const abrir = () => { setValor(texto || ''); setEditando(true); };
  const guardar = async () => {
    setGuardando(true);
    try {
      await onGuardar(item, valor);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  };

  if (editando) {
    return (
      <Box sx={{ mt: 1 }}>
        <TextField
          fullWidth size="small" multiline minRows={2} autoFocus
          label="Observación del ítem"
          placeholder="Ej: el contacto de la puerta del piso 3 no corta la marcha"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 0.75 }}>
          <Button size="small" onClick={() => setEditando(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button size="small" variant="contained" onClick={guardar} disabled={guardando} sx={{ textTransform: 'none' }}>
            {guardando ? 'Guardando...' : 'Guardar observación'}
          </Button>
        </Box>
      </Box>
    );
  }
  if (texto) {
    return (
      <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'flex-start', p: 1, borderRadius: 2, bgcolor: brand.surface, border: '1px solid', borderColor: brand.grayLight }}>
        <NotesOutlinedIcon sx={{ fontSize: 18, color: brand.silverDark, mt: 0.2 }} />
        <Typography variant="body2" sx={{ flex: 1, fontSize: '0.82rem', color: brand.navy, whiteSpace: 'pre-wrap' }}>{texto}</Typography>
        {onGuardar && (
          <IconButton size="small" onClick={abrir} title="Editar observación"><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
        )}
      </Box>
    );
  }
  if (!onGuardar) return null;
  return (
    <Button size="small" startIcon={<NotesOutlinedIcon />} onClick={abrir}
      sx={{ mt: 0.75, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', color: brand.silverDark }}>
      Agregar observación
    </Button>
  );
}

export default function ChecklistInspeccion({
  categorias = [], detalles = {}, savingItem, onCalificar, onQuitar,
  fotos = [], puedeSubirFotos = false, onSubirFoto, onEliminarFoto, urlFoto = () => '',
  bloqueado = false, // RF-011: inspección cerrada o rol que solo consulta
  onObservacion = null, // RF-008: guarda la observación de un ítem (null = solo lectura)
  ref,
}) {
  const [filtro, setFiltro] = useState('todos');
  const [pagina, setPagina] = useState(0);
  const arriba = useRef(null);
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

  // Paginado: un grupo de la norma por página para no saturar el scroll
  const paginas = bloques
    .map((b) => ({ ...b, visibles: b.items.filter((i) => pasaFiltro(filtro, i.resultado)) }))
    .filter((b) => b.visibles.length);
  const actual = Math.min(pagina, Math.max(paginas.length - 1, 0));
  const irA = (i) => {
    setPagina(i);
    arriba.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };
  // Ir a un ítem desde fuera (lista de fotos faltantes): muestra todos,
  // abre la página de su grupo, baja hasta él y lo resalta un momento.
  const [resaltado, setResaltado] = useState(null);
  useImperativeHandle(ref, () => ({
    irAItem(idItem) {
      const indice = bloques.filter((b) => b.items.length).findIndex((b) => b.items.some((i) => i.item.id_item === idItem));
      if (indice < 0) return;
      setFiltro('todos');
      setPagina(indice);
      setResaltado(idItem);
      setTimeout(() => {
        document.getElementById(`item-checklist-${idItem}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      }, 120);
      setTimeout(() => setResaltado((r) => (r === idItem ? null : r)), 2500);
    },
  }));

  const elegirFiltro = (id) => {
    setFiltro(id);
    setPagina(0);
  };

  const conteoFiltro = {
    todos: resumen.total,
    pendientes: resumen.total - resumen.calificados,
    nocumple: resumen.noCumple,
  };

  return (
    <Box ref={arriba}>
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
              onClick={() => elegirFiltro(f.id)}
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

      {paginas.length > 1 && (
        <Pagination
          count={paginas.length}
          page={actual + 1}
          onChange={(_e, p) => irA(p - 1)}
          size="small"
          color="primary"
          siblingCount={1}
          aria-label="Grupos del checklist"
          sx={{ mb: 2, '& .MuiPagination-ul': { justifyContent: 'center' } }}
        />
      )}

      {paginas.slice(actual, actual + 1).map(({ cat, items, calificados, visibles }) => {
        return (
          <Box key={cat.id_categoria} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1, pb: 0.5, borderBottom: '1px solid', borderColor: brand.grayLight }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: brand.blueDark }}>
                {cat.nombre_categoria}
              </Typography>
              <Typography variant="caption" color="text.secondary">{calificados}/{items.length}</Typography>
            </Box>

            {visibles.map(({ item, numero: n, resultado }) => (
              <Box
                key={item.id_item}
                id={`item-checklist-${item.id_item}`}
                sx={{
                  display: 'flex', gap: 1.5, py: 1.25, px: 1, mx: -1, borderRadius: 2, transition: 'background-color .4s ease',
                  bgcolor: resaltado === item.id_item ? 'rgba(209, 67, 67, 0.10)' : 'transparent',
                }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ color: brand.silverDark, minWidth: 24, textAlign: 'right', pt: 0.1 }}>
                  {n}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ mb: item.nivel_criticidad ? 0.25 : 1, color: brand.navy }}>{item.descripcion}</Typography>
                  {item.nivel_criticidad && (
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: brand.silverDark }}>
                      {item.codigo_item}{item.codigo_item ? ' · ' : ''}
                      <Box component="span" sx={{ fontWeight: 700, color: COLOR_NIVEL[item.nivel_criticidad] || brand.silverDark }}>
                        {item.nivel_criticidad}
                      </Box>
                    </Typography>
                  )}
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={resultado || null}
                    disabled={bloqueado || savingItem === item.id_item}
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
                    obligatoria={resultado === RESULTADO_FOTO_OBLIGATORIA}
                  />
                  {resultado && (
                    <ObservacionItem item={item} texto={detalles[item.id_item]?.observacion || ''} onGuardar={onObservacion} />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        );
      })}

      {paginas.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mt: 1 }}>
          <Button size="small" startIcon={<ChevronLeftIcon />} disabled={actual === 0} onClick={() => irA(actual - 1)} sx={{ textTransform: 'none' }}>
            Anterior
          </Button>
          <Typography variant="caption" color="text.secondary">
            Grupo {actual + 1} de {paginas.length}
          </Typography>
          <Button size="small" endIcon={<ChevronRightIcon />} disabled={actual >= paginas.length - 1} onClick={() => irA(actual + 1)} sx={{ textTransform: 'none' }}>
            Siguiente
          </Button>
        </Box>
      )}

      {filtro !== 'todos' && conteoFiltro[filtro] === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          {filtro === 'pendientes' ? '¡Todos los ítems están calificados!' : 'No hay ítems que no cumplan.'}
        </Typography>
      )}
    </Box>
  );
}
