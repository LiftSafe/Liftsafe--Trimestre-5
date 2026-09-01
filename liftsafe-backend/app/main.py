from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard, fotografias, usuario_ascensor, checklist, observaciones
import os

app = FastAPI(
    title="LiftSafe API",
    version="1.0",
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    }
)

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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ROUTERS - TODOS LOS MÓDULOS
# ============================================
app.include_router(auth.router)
app.include_router(vistas.router)
app.include_router(usuarios.router)
app.include_router(ascensores.router)
app.include_router(inspecciones.router)
app.include_router(dashboard.router)
app.include_router(fotografias.router)      # Valentina
app.include_router(usuario_ascensor.router) # Dayan
app.include_router(checklist.router)        # Felipe
app.include_router(observaciones.router)    # Felipe

# ============================================
# SERVIR FOTOS SUBIDAS
# ============================================
os.makedirs("uploads/fotos", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}