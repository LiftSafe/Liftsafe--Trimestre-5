# ========================
# LiftSafe — Dockerfile del Backend
# ========================
# ¿Qué? Imagen Docker multi-stage para el backend FastAPI.
# ¿Para qué? Separar la instalación de dependencias (builder) del runtime final.
# ¿Impacto? Imagen más pequeña y build más rápido con caché de capas.

# ────────────────────────────
# Stage 1: builder
# Instala todas las dependencias Python con uv
# ────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Instalar uv — gestor de paquetes ultrarrápido
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /usr/local/bin/uv

# Instalar dependencias en /opt/venv
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

# Copiar archivos de dependencias primero para caché
COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-install-project

# ────────────────────────────
# Stage 2: runtime
# Imagen final para ejecución
# ────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Variables de entorno para Python en contenedores
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Copiar venv desde builder
COPY --from=builder /opt/venv /opt/venv

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploads fotos informes

# Exponer puerto 8000
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
