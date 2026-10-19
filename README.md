# LiftSafe - Sistema de Gestión de Inspecciones de Ascensores

## Descripción del Proyecto

**LiftSafe** es una aplicación web completa para la gestión de inspecciones técnicas de ascensores. El sistema permite:

- Registro y gestión de usuarios (Administradores, Coordinadores, Inspectores, Clientes, Director Técnico)
- Administración de ascensores y su historial
- Programación de inspecciones periódicas
- Generación de informes técnicos en PDF
- Captura y gestión de fotografías como evidencia
- Checklist de cumplimiento normativo
- Solicitudes de servicio
- Auditoría de operaciones
- Notificaciones por correo electrónico

## Integrantes del Equipo

| Nombre | Rol |
|--------|-----|
| Esteban | Líder de Proyecto / Backend |
| Felipe | Desarrollador Frontend |
| Dayan | Desarrollador Frontend |
| Valentina | Desarrolladora Backend / Base de Datos |
| Luz | Desarrolladora Backend / API |

## Tecnologías Utilizadas

### Backend
- **Python 3.12**
- **FastAPI 0.141.1** - Framework web de alto rendimiento
- **SQLAlchemy 2.0.52** - ORM para base de datos
- **PyMySQL 1.2.0** - Conector MySQL
- **Pydantic 2.13.4** - Validación de datos
- **python-jose 3.5.0** - Autenticación JWT
- **bcrypt 5.0.0** - Hash de contraseñas
- **reportlab 4.2.0** - Generación de PDFs
- **fastapi-mail 1.6.8** - Envío de correos
- **Pillow 12.3.0** - Procesamiento de imágenes

### Frontend
- **React 19.2.6**
- **Vite 8.0.12** - Bundler y dev server
- **Material UI (MUI) 9.0.1** - Componentes de interfaz
- **React Router DOM 7.17.0** - Enrutamiento
- **Recharts 3.8.1** - Gráficas y dashboards
- **Emotion 11.14** - Estilos CSS-in-JS

### Base de Datos
- **MySQL 8.0** (gestionada vía XAMPP / phpMyAdmin)
- Cifrado AES para contraseñas
- Vistas SQL para seguridad

## Estructura del Proyecto

```
LiftSafe/
├── liftsafe-backend/          # API REST (FastAPI)
│   ├── app/
│   │   ├── main.py             # Punto de entrada
│   │   ├── config.py           # Configuración
│   │   ├── database.py         # Conexión a MySQL
│   │   ├── models/             # Modelos SQLAlchemy
│   │   ├── routes/             # Endpoints de la API
│   │   │   ├── auth.py         # Login / JWT
│   │   │   ├── usuarios.py     # CRUD Usuarios
│   │   │   ├── ascensores.py   # CRUD Ascensores
│   │   │   ├── inspecciones.py # CRUD Inspecciones
│   │   │   ├── informes.py     # CRUD Informes + PDF
│   │   │   ├── fotografias.py  # CRUD Fotografías
│   │   │   ├── programacion.py # CRUD Programación
│   │   │   ├── usuario_ascensor.py  # CRUD Asignaciones
│   │   │   ├── checklist.py    # Checklist de inspección
│   │   │   ├── observaciones.py# Observaciones técnicas
│   │   │   ├── solicitudes.py  # Solicitudes de servicio
│   │   │   ├── auditoria.py    # Registro de auditoría
│   │   │   ├── dashboard.py    # Estadísticas
│   │   │   └── vistas.py       # Vistas SQL
│   │   ├── schemas/            # Esquemas Pydantic
│   │   ├── controllers/        # Lógica de negocio
│   │   └── utils/              # Utilidades (auth, validaciones)
│   ├── uploads/                # Archivos subidos
│   ├── requirements.txt        # Dependencias Python
│   └── .venv/                  # Entorno virtual
│
├── LiftSafe_FrontendV2/       # Aplicación React
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   ├── pages/              # Páginas principales
│   │   ├── hooks/              # Custom hooks
│   │   ├── context/            # Contextos React
│   │   ├── services/           # Llamadas a la API
│   │   └── assets/             # Imágenes y estilos
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── liftsafe_db.sql            # Script de base de datos
├── Checklist_Verificacion_LiftSafe.docx
├── CRUD_Verificacion_Modulos.docx
└── README.md
```

## Instalación Paso a Paso

> Sigue los pasos en orden. Si un paso falla, mira **Problemas frecuentes** al final de esta sección.

### 0. Programas necesarios (una sola vez)

| Programa | Para qué | Cómo comprobarlo |
|----------|----------|------------------|
| **XAMPP** (https://www.apachefriends.org/) | Base de datos MySQL | Abre el XAMPP Control Panel |
| **uv** | Instala Python y las librerías del backend | `uv --version` |
| **Node.js 20 o más** (https://nodejs.org/) | Frontend | `node --version` |
| **Git** | Descargar el proyecto | `git --version` |

Instalar **uv** en Windows (PowerShell):

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Cierra y vuelve a abrir la terminal después de instalarlo. No hace falta instalar Python aparte: `uv` descarga la versión correcta solo.

### 1. Base de Datos (XAMPP + phpMyAdmin)

1. Abre el **XAMPP Control Panel** e inicia **Apache** y **MySQL**.
2. Abre http://localhost/phpmyadmin
3. Si ya tenías una base `liftsafe_db` vieja, bórrala (pestaña **Operaciones → Eliminar la base de datos**) para empezar limpio.
4. Crea una base de datos nueva llamada `liftsafe_db`.
5. Entra a ella, ve a **Importar**, elige el archivo `liftsafe_db.sql` de la raíz del proyecto y pulsa **Continuar**.
6. Debes ver 17 tablas (entre ellas `notificacion`, `encuesta` y `sede`) y 2 vistas.

> **¿Ya tenías la base importada de antes y no quieres borrarla?** Actualízala de una
> de estas dos formas (las dos agregan solo lo que falte y no borran datos):
>
> - **phpMyAdmin:** selecciona `liftsafe_db` → **Importar** → archivo
>   `liftsafe-backend/migrations/actualizar_base.sql` → **Continuar**.
>   Al final debe decir *"Base de datos actualizada correctamente"*.
> - **Terminal** (en `liftsafe-backend`): `uv run python run_migration.py`
>
> Las dos se pueden repetir sin problema: si algo ya existe, lo saltan.

### 2. Backend (FastAPI)

```bash
cd liftsafe-backend

# Crear tu archivo de configuración a partir del ejemplo
copy .env.example .env        # Windows (CMD/PowerShell)
# cp .env.example .env        # Git Bash / Linux / Mac

# Instalar dependencias (crea .venv automáticamente)
uv sync

# Poner una contraseña conocida a todos los usuarios de prueba (solo la primera vez).
# El script imprime en pantalla la contraseña que quedó.
uv run python update_all_passwords.py

# Iniciar el servidor
uv run uvicorn app.main:app --reload --port 8000
```

- El archivo `.env` es **obligatorio**: sin él el backend no arranca.
- Con XAMPP recién instalado, deja `DB_USER=root` y `DB_PASSWORD=` (vacío), como viene en el ejemplo.
- **No cambies `SECRET_KEY_MYSQL`**: debe ser la misma con la que se cifraron las contraseñas de `liftsafe_db.sql`.
- Las variables `MAIL_*` solo se usan para "Olvidé mi contraseña"; sin ellas el resto de la app funciona.

La API queda en http://localhost:8000 y la documentación en http://localhost:8000/docs

### 3. Frontend (React + Vite)

En **otra** terminal (el backend debe seguir corriendo):

```bash
cd LiftSafe_FrontendV2
npm install
npm run dev
```

La aplicación queda en http://localhost:5173

### 4. Pruebas (opcional)

```bash
cd liftsafe-backend && uv run pytest          # backend + cobertura
cd LiftSafe_FrontendV2 && npm test            # frontend + cobertura
```

### Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `uv` no se reconoce como comando | No está instalado o no reabriste la terminal | Instálalo (paso 0) y abre una terminal nueva |
| El backend se cierra con `SECRET_KEY ... Field required` | Falta el archivo `.env` | `copy .env.example .env` dentro de `liftsafe-backend` |
| `Can't connect to MySQL server` | MySQL de XAMPP apagado | Inicia MySQL en el XAMPP Control Panel |
| `Access denied for user` | Usuario o clave de MySQL distintos | Ajusta `DB_USER` / `DB_PASSWORD` en `.env` |
| `Table 'liftsafe_db.notificacion' doesn't exist` (campana en error) | Base importada con un `.sql` viejo | Vuelve a importar `liftsafe_db.sql` o las migraciones del paso 1 |
| `Unknown column 'ascensor.id_sede'` o `'fotografia.id_inspeccion'` (Ascensores, Inspecciones o fotos en error) | Falta aplicar las migraciones nuevas | Importa `liftsafe-backend/migrations/actualizar_base.sql` en phpMyAdmin, o `uv run python run_migration.py` |
| "Credenciales incorrectas" al iniciar sesión | No se corrió el script de contraseñas | `uv run python update_all_passwords.py` |
| El frontend carga pero nada funciona | El backend no está corriendo | Inicia el backend (paso 2) |

## Credenciales por Defecto

### Base de Datos MySQL (XAMPP)
| Campo | Valor |
|-------|-------|
| Host | 127.0.0.1 |
| Puerto | 3306 |
| Usuario | `root` |
| Contraseña | (vacía) |
| Base de datos | `liftsafe_db` |

### Usuarios del Sistema (pre-cargados en `liftsafe_db.sql`)

Después de correr `update_all_passwords.py`, todos usan la contraseña que imprime el script.

| Rol | Correo |
|-----|--------|
| Administrador | admin1@liftsafe.com |
| Director Técnico | laura.gomez@elevatec.com |
| Coordinador | carlos.ramirez@elevatec.com |
| Inspector | andres.martinez@elevatec.com |
| Cliente | andrea.beltran@edificioparque.com |
| Asesor | jhojan123456@gmail.com |

> ⚠️ **Nota:** Las contraseñas se guardan cifradas con AES en la base de datos. Esa contraseña común es solo para desarrollo.

## Módulos del Sistema (CRUD Completo)

| Módulo | Crear | Leer | Actualizar | Eliminar |
|--------|:-----:|:----:|:----------:|:--------:|
| Usuarios | ✅ | ✅ | ✅ | ✅ |
| Ascensores | ✅ | ✅ | ✅ | ✅ |
| Inspecciones | ✅ | ✅ | ✅ | ✅ |
| Informes | ✅ | ✅ | ✅ (envío) | ✅ |
| Fotografías | ✅ | ✅ | ✅ | ✅ |
| Programación | ✅ | ✅ | ✅ (reasignar/cancelar) | ✅ |
| Usuario-Ascensor | ✅ | ✅ | ✅ (desasignar) | ✅ |
| Solicitudes | ✅ | ✅ | ✅ | - |
| Checklist | ✅ | ✅ | - | - |
| Observaciones | ✅ | ✅ | ✅ | - |
| Auditoría | - | ✅ | - | - |

## Endpoints de la API Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/usuarios` | Crear usuario |
| GET | `/usuarios/listado` | Listar usuarios |
| PUT | `/usuarios/{id}` | Actualizar usuario |
| DELETE | `/usuarios/{id}` | Eliminar usuario |
| POST | `/ascensores/` | Crear ascensor |
| GET | `/ascensores/listado` | Listar ascensores |
| PUT | `/ascensores/{id}` | Actualizar ascensor |
| DELETE | `/ascensores/{id}` | Eliminar ascensor |
| POST | `/inspecciones/crear` | Crear inspección |
| PUT | `/inspecciones/{id}` | Actualizar inspección |
| DELETE | `/inspecciones/{id}` | Eliminar inspección |
| POST | `/informes/{id}/generar` | Generar PDF |
| DELETE | `/informes/{id}` | Eliminar informe |
| POST | `/fotografias/` | Subir foto |
| PUT | `/fotografias/{id}` | Actualizar foto |
| DELETE | `/fotografias/{id}` | Eliminar foto |
| POST | `/programacion/` | Programar inspección |
| PUT | `/programacion/{id}/reasignar` | Reasignar inspector |
| DELETE | `/programacion/{id}` | Eliminar programación |

## Variables de Entorno

El backend lee su configuración de `liftsafe-backend/.env` (obligatorio). Cópialo desde
`liftsafe-backend/.env.example`, que trae comentada cada variable. El frontend no necesita
`.env`: usa `http://localhost:8000` por defecto (se puede cambiar con `VITE_API_URL` en
`LiftSafe_FrontendV2/.env`, ver `LiftSafe_FrontendV2/.env.example`).

## Notas de Seguridad

- Las contraseñas se almacenan con cifrado AES en la base de datos
- La autenticación usa tokens JWT con expiración de 30 minutos
- El acceso a endpoints está restringido por roles
- Las vistas SQL (`vista_usuarios_segura`, `vista_resumen_inspecciones`) ocultan datos sensibles

---

**Proyecto académico - SENA**  
*Trimestre 5 - 2026*
