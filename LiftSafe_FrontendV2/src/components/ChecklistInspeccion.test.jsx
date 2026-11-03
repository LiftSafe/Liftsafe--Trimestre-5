import { createRef } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChecklistInspeccion from './ChecklistInspeccion'
import { resumenChecklist } from '../utils/checklist'

const categorias = [
  { id_categoria: 1, nombre_categoria: 'Cuarto de Máquinas', items: [
    { id_item: 10, descripcion: 'Acceso exclusivo y señalizado' },
    { id_item: 11, descripcion: 'Iluminación adecuada' },
  ] },
  { id_categoria: 2, nombre_categoria: 'Foso del Ascensor', items: [
    { id_item: 20, descripcion: 'Iluminación mínima de 50 lux' },
  ] },
]
const detalles = { 10: { resultado: 'Cumple' }, 20: { resultado: 'No Cumple' } }

const pintar = (props = {}) => {
  const onCalificar = vi.fn()
  const onQuitar = vi.fn()
  render(<ChecklistInspeccion categorias={categorias} detalles={detalles} onCalificar={onCalificar} onQuitar={onQuitar} {...props} />)
  return { onCalificar, onQuitar }
}

describe('ChecklistInspeccion', () => {
  it('should summarize graded, not compliant and N/A items', () => {
    expect(resumenChecklist(categorias, detalles)).toEqual({ total: 3, calificados: 2, noCumple: 1, noAplica: 0 })
    expect(resumenChecklist()).toEqual({ total: 0, calificados: 0, noCumple: 0, noAplica: 0 })
  })

  it('should show the progress and number the items across categories', () => {
    pintar()
    expect(screen.getByText('2/3 calificados')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Siguiente'))
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Iluminación mínima de 50 lux')).toBeInTheDocument()
  })

  it('should grade an item when an option is clicked', () => {
    const { onCalificar } = pintar()
    const grupo = screen.getByRole('group', { name: 'Calificación del ítem 2' })
    fireEvent.click(grupo.querySelector('button[value="No Aplica"]'))
    expect(onCalificar).toHaveBeenCalledWith(categorias[0].items[1], 'No Aplica')
  })

  it('should remove the grade when the selected option is clicked again', () => {
    const { onQuitar, onCalificar } = pintar()
    const grupo = screen.getByRole('group', { name: 'Calificación del ítem 1' })
    fireEvent.click(grupo.querySelector('button[value="Cumple"]'))
    expect(onQuitar).toHaveBeenCalledWith(categorias[0].items[0])
    expect(onCalificar).not.toHaveBeenCalled()
  })

  it('should filter pending and not compliant items', () => {
    pintar()
    fireEvent.click(screen.getByText('Pendientes (1)'))
    expect(screen.getByText('Iluminación adecuada')).toBeInTheDocument()
    expect(screen.queryByText('Acceso exclusivo y señalizado')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('No cumple (1)'))
    expect(screen.getByText('Iluminación mínima de 50 lux')).toBeInTheDocument()
    expect(screen.queryByText('Iluminación adecuada')).not.toBeInTheDocument()
  })

  it('should tell when every item is already graded', () => {
    pintar({ detalles: { 10: { resultado: 'Cumple' }, 11: { resultado: 'Cumple' }, 20: { resultado: 'Cumple' } } })
    fireEvent.click(screen.getByText('Pendientes (0)'))
    expect(screen.getByText('¡Todos los ítems están calificados!')).toBeInTheDocument()
  })

  it('should show a Foto button per item with its photo count for inspectors', () => {
    pintar({
      puedeSubirFotos: true,
      onSubirFoto: vi.fn(),
      fotos: [{ id_foto: 1, id_item: 10, ruta_archivo: 'uploads/fotos/a.jpg' }],
      urlFoto: (f) => `http://api/${f.ruta_archivo}`,
    })
    expect(screen.getByText('Foto (1)')).toBeInTheDocument()
    expect(screen.getAllByText('Foto (0)')).toHaveLength(1)
    expect(screen.getByAltText('Foto del ítem: Acceso exclusivo y señalizado')).toHaveAttribute('src', 'http://api/uploads/fotos/a.jpg')
  })

  it('should upload the chosen file for that item', async () => {
    const onSubirFoto = vi.fn().mockResolvedValue()
    pintar({ puedeSubirFotos: true, onSubirFoto })
    const archivo = new File(['x'], 'cabina.jpg', { type: 'image/jpeg' })
    fireEvent.change(document.getElementById('foto-item-11'), { target: { files: [archivo] } })
    await vi.waitFor(() => expect(onSubirFoto).toHaveBeenCalledWith(categorias[0].items[1], archivo))
  })

  it('should let the inspector remove a photo', () => {
    const onEliminarFoto = vi.fn()
    const foto = { id_foto: 5, id_item: 20, ruta_archivo: 'f.jpg' }
    pintar({ puedeSubirFotos: true, onSubirFoto: vi.fn(), onEliminarFoto, fotos: [foto] })
    fireEvent.click(screen.getByText('Siguiente'))
    fireEvent.click(screen.getByTitle('Quitar foto'))
    expect(onEliminarFoto).toHaveBeenCalledWith(foto)
  })

  it('should only show existing photos (no button) to other roles', () => {
    pintar({ fotos: [{ id_foto: 1, id_item: 10, ruta_archivo: 'a.jpg' }] })
    expect(screen.queryByText(/Foto \(/)).not.toBeInTheDocument()
    expect(screen.getByAltText('Foto del ítem: Acceso exclusivo y señalizado')).toBeInTheDocument()
    expect(screen.queryByTitle('Quitar foto')).not.toBeInTheDocument()
  })
  it('should warn that a not compliant item needs a photo until it has one', () => {
    const conNA = { 11: { resultado: 'No Cumple' } }
    const { unmount } = render(<ChecklistInspeccion categorias={categorias} detalles={conNA} puedeSubirFotos onSubirFoto={vi.fn()} onCalificar={vi.fn()} onQuitar={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Foto obligatoria')
    unmount()
    render(<ChecklistInspeccion categorias={categorias} detalles={conNA} puedeSubirFotos onSubirFoto={vi.fn()} onCalificar={vi.fn()} onQuitar={vi.fn()} fotos={[{ id_foto: 1, id_item: 11, ruta_archivo: 'a.jpg' }]} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should show one group per page and move between them', () => {
    pintar()
    expect(screen.getByText('Cuarto de Máquinas')).toBeInTheDocument()
    expect(screen.queryByText('Foso del Ascensor')).not.toBeInTheDocument()
    expect(screen.getByText('Grupo 1 de 2')).toBeInTheDocument()
    expect(screen.getByText('Anterior').closest('button')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /page 2/i }))
    expect(screen.getByText('Foso del Ascensor')).toBeInTheDocument()
    expect(screen.queryByText('Cuarto de Máquinas')).not.toBeInTheDocument()
    expect(screen.getByText('Siguiente').closest('button')).toBeDisabled()
    fireEvent.click(screen.getByText('Anterior'))
    expect(screen.getByText('Cuarto de Máquinas')).toBeInTheDocument()
  })

  it('should go back to the first page when the filter changes', () => {
    pintar()
    fireEvent.click(screen.getByText('Siguiente'))
    fireEvent.click(screen.getByText('Todos (3)'))
    expect(screen.getByText('Cuarto de Máquinas')).toBeInTheDocument()
  })

  it('should show the item code and the NTC defect level', () => {
    const cats = [{ id_categoria: 1, nombre_categoria: '6.1 Puertas', items: [
      { id_item: 1, descripcion: 'Enclavamiento de puertas', codigo_item: 'NTC-6.1-01', nivel_criticidad: 'Muy grave' },
    ] }]
    render(<ChecklistInspeccion categorias={cats} detalles={{}} onCalificar={vi.fn()} onQuitar={vi.fn()} />)
    expect(screen.getByText(/NTC-6.1-01/)).toBeInTheDocument()
    expect(screen.getByText('Muy grave')).toBeInTheDocument()
    expect(screen.queryByText('Siguiente')).not.toBeInTheDocument()
  })

  it('should jump to the page of an item when asked from outside', () => {
    const ref = createRef()
    render(<ChecklistInspeccion ref={ref} categorias={categorias} detalles={detalles} onCalificar={vi.fn()} onQuitar={vi.fn()} />)
    fireEvent.click(screen.getByText('Pendientes (1)'))
    act(() => ref.current.irAItem(20))
    expect(screen.getByText('Foso del Ascensor')).toBeInTheDocument()
    expect(screen.getByText('Grupo 2 de 2')).toBeInTheDocument()
    expect(document.getElementById('item-checklist-20')).toBeInTheDocument()
    act(() => ref.current.irAItem(999))
    expect(screen.getByText('Foso del Ascensor')).toBeInTheDocument()
  })

  it('should not let grade or upload photos when the inspection is closed', () => {
    const { onCalificar } = pintar({ bloqueado: true })
    const grupo = screen.getByRole('group', { name: 'Calificación del ítem 2' })
    expect(grupo.querySelector('button[value="Cumple"]')).toBeDisabled()
    fireEvent.click(grupo.querySelector('button[value="Cumple"]'))
    expect(onCalificar).not.toHaveBeenCalled()
  })
})
