# Base de datos inicial para Docker

Docker importa automáticamente los archivos `.sql` de esta carpeta la **primera vez** que crea
el contenedor `db`.

El respaldo con los datos reales (`01-liftsafe_db.sql`) **no se sube a GitHub** porque el
repositorio es público. Pídelo al líder del equipo por un canal privado y guárdalo aquí, o
genéralo desde tu XAMPP con la tarea de VS Code **"LiftSafe: exportar base para Docker"**.

Para volver a importarlo: `docker compose down -v` y `docker compose up -d --build`.
