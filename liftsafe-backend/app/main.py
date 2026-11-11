# instalar las librerias 
# pip install -r requirements.txt

import logging
import os

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import (
    auth,
    vistas,
    usuarios,
    ascensores,
    clientes,
    inspecciones,
    dashboard,
    fotografias,
    usuario_ascensor,
    checklist,
    observaciones,
    informes,
    auditoria,
    programacion,
    solicitudes,
    notificaciones,
    encuestas,
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="LiftSafe API",
    version="1.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

# ============================================
# CORS - CON MÚLTIPLES ORÍGENES
# ✅ FIX: Vite corre en el primer puerto libre a partir de 5173 (5174, 5175,
# ...) cuando ya hay otro "npm run dev" abierto. Como allow_origins era una
# lista fija de puertos, cualquier origen que no fuera EXACTAMENTE
# localhost:5173 fallaba el preflight con "No 'Access-Control-Allow-Origin'
# header" (se ve en el navegador como "Failed to fetch"). Se agrega
# allow_origin_regex para aceptar cualquier puerto de localhost/127.0.0.1 en
# desarrollo, sin perder la lista explícita.
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# CONTRATO DE ERRORES (semana 4)
# Todo error responde JSON con la clave "detail" y nunca expone información
# interna (stack traces, SQL, rutas del servidor).
# ============================================
@app.exception_handler(RequestValidationError)
async def handle_request_validation(request: Request, exc: RequestValidationError):
    # JSON mal formado: 400 con el formato del contrato.
    # El resto (tipos incorrectos, campos faltantes) conserva el 422 de FastAPI.
    if any(error["type"] == "json_invalid" for error in exc.errors()):
        return JSONResponse(status_code=400, content={"detail": "Cuerpo de la petición mal formado"})
    return await request_validation_exception_handler(request, exc)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    # El detalle real queda en el log del servidor, no en la respuesta.
    logger.exception("Error no controlado en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


# ============================================
# ROUTERS - TODOS LOS MÓDULOS DE TODOS
# ============================================
app.include_router(auth.router)              # Equipo
app.include_router(vistas.router)            # Equipo
app.include_router(usuarios.router)          # Equipo
app.include_router(ascensores.router)        # Equipo
app.include_router(clientes.router)          # Luz - sedes de cada cliente
app.include_router(inspecciones.router)      # Valentina
app.include_router(dashboard.router)         # Equipo
app.include_router(fotografias.router)       # Valentina
app.include_router(usuario_ascensor.router)  # Dayan - reactivado (no se encontró causa técnica para desactivarlo)
app.include_router(checklist.router)         # Felipe
app.include_router(observaciones.router)     # Felipe
app.include_router(informes.router)          # Esteban
app.include_router(auditoria.router)         # Dayan
app.include_router(programacion.router)      # Luz
app.include_router(solicitudes.router)       # Luz
app.include_router(notificaciones.router)    # Equipo - requiere correr migrations/add_notificacion_table.sql antes de usar
app.include_router(encuestas.router)         # requiere correr migrations/add_encuesta_table.sql antes de usar

# ============================================
# SERVIR FOTOS SUBIDAS
# ============================================
os.makedirs("uploads/fotos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ============================================
# SERVIR INFORMES PDF GENERADOS (Esteban)
# ============================================
os.makedirs("informes", exist_ok=True)
app.mount("/informes", StaticFiles(directory="informes"), name="informes")

@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}