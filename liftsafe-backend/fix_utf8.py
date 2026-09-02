from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Textos CORRECTOS (por ID)
correcciones = {
    1: ("Cuarto de Máquinas", "Verificación de condiciones del cuarto de máquinas: acceso, ventilación, iluminación, equipos y seguridad eléctrica."),
    2: ("Foso del Ascensor", "Inspección del foso: dimensiones, iluminación, drenaje, dispositivos de parada y estado general."),
    3: ("Cabina", "Revisión de la cabina: dimensiones, iluminación, ventilación, comunicación de emergencia y capacidad."),
    4: ("Puertas de Cabina y Rellano", "Control de puertas: funcionamiento, enclavamientos, contactos eléctricos, velocidad de cierre y reapertura."),
    5: ("Sistema de Tracción y Suspensión", "Evaluación de cables, poleas, contrapeso, tambor y mecanismo de tracción principal."),
    6: ("Dispositivos de Seguridad", "Verificación de limitador de velocidad, amortiguadores, paracaídas, freno y enclavamientos de seguridad."),
    7: ("Instalación Eléctrica", "Revisión del tablero eléctrico, cableado, toma de tierra, protecciones y circuitos de seguridad."),
    8: ("Documentación Técnica y Legal", "Verificación de licencias, manuales, planos, libro de mantenimiento y certificados vigentes."),
    9: ("Guías y Estructuras de Soporte", "Inspección de guías de cabina y contrapeso, soportes, fijaciones y alineación general."),
    10: ("Sistema Hidráulico", "Revisión del grupo hidráulico, tuberías, válvulas, cilindro y nivel de aceite en ascensores hidráulicos."),
    11: ("Iluminación y Señalización", "Verificación de iluminación en cabina, rellanos, foso y cuarto de máquinas, así como señalización de emergencia."),
    12: ("Sistema de Comunicación y Alarma", "Revisión del intercomunicador, alarma sonora, botón de emergencia y sistema de llamada en cabina."),
    13: ("Contrapeso y Amortiguadores", "Inspección del contrapeso, sus guías, fijaciones y los amortiguadores de cabina y contrapeso en el foso."),
    14: ("Recinto y Accesos del Ascensor", "Verificación del recinto, huecos, accesos de emergencia, trampillas y puertas de inspección."),
    15: ("Cuadro de Maniobra y Control", "Revisión del cuadro de maniobra, tarjetas electrónicas, relés, contactores y lógica de control."),
    16: ("Frenos y Sistema de Parada", "Verificación del freno electromagnético, sistema de parada de emergencia y retención bajo carga nominal."),
    17: ("Velocidad y Rendimiento", "Medición de velocidad nominal, aceleración, desaceleración y comportamiento en marcha normal y de emergencia."),
    18: ("Protecciones Mecánicas", "Inspección de guardas, cubiertas de poleas, protecciones de maquinaria giratoria y dispositivos anti-atrapamiento."),
    19: ("Nivelación y Confort", "Evaluación de la precisión de nivelación en todos los pisos, vibraciones, ruido y confort en el recorrido."),
    20: ("Mantenimiento Preventivo", "Revisión del cumplimiento del plan de mantenimiento preventivo, lubricación, ajustes y reemplazos programados."),
}

with engine.connect() as conn:
    # Mostrar actuales
    print("=== DATOS ACTUALES ===")
    result = conn.execute(text("SELECT id_categoria, nombre_categoria FROM checklist_categoria ORDER BY id_categoria"))
    filas = list(result)
    for row in filas:
        print(f"ID {row.id_categoria}: {repr(row.nombre_categoria)}")
    
    # Actualizar cada una por su ID
    print("\n=== ACTUALIZANDO ===")
    for row in filas:
        cid = row.id_categoria
        if cid in correcciones:
            nombre, desc = correcciones[cid]
            conn.execute(
                text("UPDATE checklist_categoria SET nombre_categoria = :nom, descripcion = :desc WHERE id_categoria = :id"),
                {"nom": nombre, "desc": desc, "id": cid}
            )
            print(f"✅ ID {cid}: {nombre}")
        else:
            print(f"⚠️  ID {cid}: no está en el diccionario de correcciones")
    
    conn.commit()
    
    # Verificar
    print("\n=== VERIFICACIÓN ===")
    result = conn.execute(text("SELECT nombre_categoria FROM checklist_categoria ORDER BY id_categoria"))
    for row in result:
        print(f"  {row.nombre_categoria}")

print("\n🎯 LISTO. Reiniciá el backend (uvicorn) y refrescá el navegador.")