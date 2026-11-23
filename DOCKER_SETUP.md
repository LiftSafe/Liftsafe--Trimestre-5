# Docker + uv Setup - LiftSafe

## 🧑‍🤝‍🧑 Para el equipo: correr LiftSafe con Docker (sin XAMPP, sin Python, sin Node)

Solo necesitas **Git** y **Docker Desktop** (abierto y con la ballena en verde).

```bash
git clone https://github.com/LiftSafe/Liftsafe--Trimestre-5.git
cd Liftsafe--Trimestre-5
git checkout feat/foto-obligatoria-na   # o main, cuando se integre el PR
docker compose up -d --build
```

La primera vez tarda varios minutos (descarga imágenes, instala dependencias e
importa la base de datos). Después abre:

| Qué | Dirección |
|-----|-----------|
| Aplicación (frontend) | http://localhost:3000 |
| API (Swagger) | http://localhost:8000/docs |
| Base de datos (DBeaver / Workbench) | `localhost:3307` · usuario `liftsafe_app` · clave `123456` |

- **Antes del primer `docker compose up`**, pon el respaldo `01-liftsafe_db.sql` en
  `docker/mysql/`. No está en GitHub porque el repositorio es público: pídelo al líder por un
  canal privado o genéralo desde XAMPP con la tarea "LiftSafe: exportar base para Docker".
  Docker lo importa solo al crear la base.
- Solo se importa la **primera vez**. Para volver a cargarla desde cero:
  `docker compose down -v` y luego `docker compose up -d --build`.
- No necesitas crear `liftsafe-backend/.env`: Docker trae la configuración.
  Si quieres que funcione "Olvidé mi contraseña", crea un `.env` en la **raíz**
  del proyecto con `MAIL_USERNAME`, `MAIL_PASSWORD` y `MAIL_FROM`.
- Si tienes XAMPP encendido no hay problema: Docker usa el puerto 3307 para la base.

## 📋 Resumen de la Migración

El proyecto LiftSafe ha sido migrado para usar:
- **uv**: Gestor de paquetes Python ultrarrápido (reemplaza pip/requirements.txt)
- **Docker Compose**: Orquestación de MySQL, backend FastAPI y frontend React

## 🚀 Comandos Rápidos

### Levantar toda la aplicación
```bash
docker compose up -d --build
```

### Ver logs
```bash
# Ver todos los logs
docker compose logs -f

# Ver solo logs del backend
docker compose logs -f be

# Ver solo logs del frontend
docker compose logs -f fe
```

### Detener la aplicación
```bash
docker compose down
```

### Detener y borrar datos de BD
```bash
docker compose down -v
```

## 📦 Servicios

| Servicio | Imagen | Puerto | Descripción |
|----------|--------|--------|-------------|
| db | mariadb:10.4 | 3307 → 3306 | Base de datos (mismo motor de XAMPP) |
| be | liftsafe-be | 8000 | Backend FastAPI |
| fe | liftsafe-fe | 3000 | Frontend React (Nginx) |

## 🔧 Desarrollo Local con uv

### Backend
```bash
cd liftsafe-backend

# Instalar dependencias con uv
uv sync

# Ejecutar tests con cobertura
uv run pytest

# Levantar servidor de desarrollo
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd LiftSafe_FrontendV2

# Instalar dependencias
npm install

# Ejecutar tests con cobertura
npm test

# Levantar servidor de desarrollo
npm run dev
```

## 🗂️ Estructura de Archivos Nuevos

```
LiftSafe/
├── docker-compose.yml          # Orquestación Docker
├── liftsafe-backend/
│   ├── pyproject.toml         # Dependencias Python (uv)
│   ├── uv.lock                # Lockfile de uv
│   ├── Dockerfile             # Imagen Docker del backend
│   └── .dockerignore          # Archivos a ignorar en Docker
├── LiftSafe_FrontendV2/
│   ├── Dockerfile             # Imagen Docker del frontend
│   ├── nginx.conf             # Configuración Nginx para SPA
│   └── .dockerignore          # Archivos a ignorar en Docker
```

## 🔐 Variables de Entorno

Las variables de entorno se configuran en:
- `liftsafe-backend/.env` (para desarrollo local)
- `docker-compose.yml` (para contenedores Docker)

### Variables requeridas en Docker:
- `DATABASE_URL`: URL de conexión a MySQL
- `SECRET_KEY`: Clave para JWT
- `SECRET_KEY_MYSQL`: Clave para cifrado AES
- `FRONTEND_URL`: URL del frontend para CORS

## 🐛 Troubleshooting

### Los contenedores no inician
```bash
# Ver logs de error
docker compose logs

# Reconstruir imágenes
docker compose up -d --build --force-recreate
```

### Error de conexión a BD
```bash
# Verificar que MySQL esté healthy
docker compose ps db

# Ver logs de MySQL
docker compose logs db
```

### Puerto ocupado
Si el puerto 3306, 8000 o 3000 está ocupado, cámbialo en `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"  # Cambiar puerto del host
```

## 📝 Notas

- El frontend usa `npm` (no pnpm) - se cambió el Dockerfile
- Los datos de MySQL persisten en el volumen `mysql_data`
- Para limpieza completa, usar `docker compose down -v` (borra datos de BD)
