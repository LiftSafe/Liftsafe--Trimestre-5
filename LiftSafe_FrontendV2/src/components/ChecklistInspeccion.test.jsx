import { render, screen, fireEvent } from '@testing-library/react'
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
})
