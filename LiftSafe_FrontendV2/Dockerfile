# ========================
# LiftSafe — Dockerfile del Frontend
# ========================
# ¿Qué? Imagen Docker multi-stage para el frontend React + Vite.
# ¿Para qué? Stage 1 compila con npm; Stage 2 sirve con Nginx.
# ¿Impacto? Imagen final ~30MB vs ~1GB+ con Node.

# ────────────────────────────
# Stage 1: builder
# Compila React con npm
# ────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# ARG para URL de API del backend
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Copiar manifiestos primero para caché
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar para producción
RUN npm run build

# ────────────────────────────
# Stage 2: runtime
# Sirve archivos estáticos con Nginx
# ────────────────────────────
FROM nginx:1.28.3-alpine AS runtime

# Copiar configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80
