# instalar las librerias 
# pip install -r requirements.txt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard
# 👇 AGREGA ESTAS DOS IMPORTACIONES (LAS QUE TE FALTABAN)
from app.routes import solicitudes, programacion

app = FastAPI(title="LiftSafe API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    # 👇 CORREGIDO: NO USAR "*" CON allow_credentials=True
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
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

# 👇 AGREGA ESTAS DOS LÍNEAS PARA REGISTRAR TUS RUTAS
app.include_router(solicitudes.router)
app.include_router(programacion.router)

@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}