# instalar las librerias 
# pip install -r requirements.txt

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import (
    auth,
    vistas,
    usuarios,
    ascensores,
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
)

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
# ROUTERS - TODOS LOS MÓDULOS DE TODOS
# ============================================
app.include_router(auth.router)              # Equipo
app.include_router(vistas.router)            # Equipo
app.include_router(usuarios.router)          # Equipo
app.include_router(ascensores.router)        # Equipo
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