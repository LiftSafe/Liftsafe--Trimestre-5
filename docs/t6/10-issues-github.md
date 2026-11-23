# 10 · Texto de los issues para GitHub

Crear en https://github.com/LiftSafe/Liftsafe--Trimestre-5/issues/new, uno por defecto, con las etiquetas indicadas. Como ya están corregidos, se crean y se cierran enlazando el commit (así queda el ciclo completo en el tablero).

---

## DEF-01 · El login muestra "Failed to fetch" cuando el backend responde 500
**Etiquetas:** `bug, severidad:alta`

**Pasos para reproducir**
1. Apagar MySQL o romper la conexión.
2. Iniciar sesión en http://localhost:5173.

**Resultado esperado:** Mensaje "Error interno del servidor".
**Resultado obtenido:** "Failed to fetch": la respuesta 500 sale sin cabeceras CORS y el navegador la bloquea.

**Corrección:** 69f8579 · **Verificación:** `tests/test_regresion_defectos.py::test_def01_*`

---

## DEF-02 · Un grupo de la lista de chequeo se puede guardar con el nombre "o"
**Etiquetas:** `bug, severidad:media`

**Pasos para reproducir**
1. Lista de chequeo → Editar grupo 6.2.
2. Nombre: `o` → Guardar.

**Resultado esperado:** Que no permita guardar un nombre de menos de 3 caracteres.
**Resultado obtenido:** Se guardó "o" y se perdió el nombre "6.2 Cables de tracción y sus amarres".

**Corrección:** 69f8579 · **Verificación:** `test_def02_*` y `ChecklistNorma.test.jsx`

---

## DEF-03 · El Excel de productividad no cuenta inspecciones terminadas antes de la fecha programada
**Etiquetas:** `bug, severidad:media`

**Pasos para reproducir**
1. Inspección programada para mañana, terminarla hoy.
2. Descargar el Excel con periodo hasta hoy.

**Resultado esperado:** El inspector suma 1 terminada.
**Resultado obtenido:** La inspección no aparece: se filtraba solo por fecha_inicio.

**Corrección:** 69f8579 · **Verificación:** `test_def03_productividad_filtra_por_fecha_de_terminacion`

---

## DEF-04 · Los campos de correo aceptan espacios
**Etiquetas:** `bug, severidad:media`

**Pasos para reproducir**
1. Escribir ` ana@correo.com ` en el login, el registro o crear usuario.

**Resultado esperado:** Se quitan los espacios.
**Resultado obtenido:** Se enviaba con espacios. Primer arreglo (36c85b5) incompleto: en pantalla seguían; reabierto y cerrado con a01fe24.

**Corrección:** 36c85b5, a01fe24 · **Verificación:** `utils/correo.test.js`, `authPages.test.jsx`

---

## DEF-05 · Chrome rellena "Teléfono" con el correo al crear un cliente
**Etiquetas:** `bug, severidad:baja`

**Pasos para reproducir**
1. Iniciar sesión como Asesor con la contraseña guardada en Chrome.
2. Usuarios → Nuevo cliente.

**Resultado esperado:** Campos vacíos.
**Resultado obtenido:** Teléfono con el correo del login y la contraseña rellenada.

**Corrección:** 69f8579 · **Verificación:** Manual en Chrome

---

## DEF-06 · El backend no conecta a MySQL: Access denied (1044) para liftsafe_app
**Etiquetas:** `bug, severidad:critica, ambiente`

**Pasos para reproducir**
1. Reiniciar MySQL en XAMPP.
2. Iniciar sesión.

**Resultado esperado:** Login normal.
**Resultado obtenido:** 500 con `Access denied for user 'liftsafe_app'@'localhost' to database 'liftsafe_db'`: la tabla mysql.db quedó dañada.

**Corrección:** scripts/reparar_permisos_bd.py · **Verificación:** Login de nuevo + salida del script

---

## DEF-07 · El edificio escrito se pierde al pulsar "Listo" y no se puede agregar su ascensor
**Etiquetas:** `bug, severidad:media`

**Pasos para reproducir**
1. Asesor → Usuarios → edificios de un cliente.
2. Escribir el edificio y pulsar "Listo".

**Resultado esperado:** Que se guarde o avise.
**Resultado obtenido:** Se cierra sin guardar; el cliente queda sin edificios.

**Corrección:** 69f8579 · **Verificación:** Manual

---

## DEF-08 · "Ver ascensores" y "Ver inspecciones" del detalle del edificio no hacen nada
**Etiquetas:** `bug, severidad:baja`

**Pasos para reproducir**
1. Edificios → Ver detalle → Ver ascensores.

**Resultado esperado:** Lista filtrada por el edificio.
**Resultado obtenido:** No pasa nada.

**Corrección:** 69f8579 · **Verificación:** Manual
