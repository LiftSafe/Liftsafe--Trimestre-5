
## // instalar las librerias 
## pip install -r requirements.txt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
from fastapi.staticfiles import StaticFiles
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard, fotografias, usuario_ascensor, checklist, observaciones
import os
=======
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard, informes, auditoria, checklist, fotografias, observaciones, programacion, solicitudes, usuario_ascensor
>>>>>>> feature/esteban-local

app = FastAPI(
    title="LiftSafe API",
    version="1.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

<<<<<<< HEAD
# ============================================
# CORS - CON MÚLTIPLES ORÍGENES
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
=======
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
>>>>>>> feature/esteban-local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
# ============================================
# ROUTERS - TODOS LOS MÓDULOS
# ============================================
=======
>>>>>>> feature/esteban-local
app.include_router(auth.router)
app.include_router(vistas.router)
app.include_router(usuarios.router)
app.include_router(ascensores.router)
app.include_router(inspecciones.router)
app.include_router(dashboard.router)
<<<<<<< HEAD
app.include_router(fotografias.router)      # Valentina
app.include_router(usuario_ascensor.router) # Dayan
app.include_router(checklist.router)        # Felipe
app.include_router(observaciones.router)    # Felipe

# ============================================
# SERVIR FOTOS SUBIDAS
# ============================================
os.makedirs("uploads/fotos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
=======
app.include_router(informes.router)
app.include_router(auditoria.router)
app.include_router(checklist.router)
app.include_router(fotografias.router)
app.include_router(observaciones.router)
app.include_router(programacion.router)
app.include_router(solicitudes.router)
app.include_router(usuario_ascensor.router)

app = FastAPI(
    title="LiftSafe API",
    version="1.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vistas.router)
app.include_router(usuarios.router)
app.include_router(ascensores.router)
app.include_router(inspecciones.router)
app.include_router(dashboard.router)
app.include_router(informes.router)
>>>>>>> feature/esteban-local

@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}
