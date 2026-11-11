"""Qué categorías e ítems del checklist se muestran en una inspección."""


def categorias_visibles(categorias: list, ids_categorias_activas: set, ids_items_activos: set,
                        ids_items_respondidos: set) -> list:
    """Categorías activas con sus ítems activos, en orden.

    Si la inspección ya tiene respuestas en ítems que hoy están inactivos
    (por ejemplo del checklist anterior), esos ítems y su categoría se
    siguen mostrando para no perder lo que el inspector calificó.
    """
    orden = lambda o, id_: (o.orden_visualizacion or 0, id_)
    resultado = []
    # Primero el checklist vigente; después lo respondido del checklist anterior
    clave = lambda c: (c.id_categoria not in ids_categorias_activas, *orden(c, c.id_categoria))
    for cat in sorted(categorias, key=clave):
        activa = cat.id_categoria in ids_categorias_activas
        items = [
            i for i in sorted(cat.items or [], key=lambda i: orden(i, i.id_item))
            if i.id_item in ids_items_respondidos or (activa and i.id_item in ids_items_activos)
        ]
        if not items:
            continue
        resultado.append({
            "id_categoria": cat.id_categoria,
            "nombre_categoria": cat.nombre_categoria,
            "descripcion": cat.descripcion,
            "orden_visualizacion": cat.orden_visualizacion or 0,
            "norma_referencia": cat.norma_referencia,
            "items": items,
        })
    return resultado
