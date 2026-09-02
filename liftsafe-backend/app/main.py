## // instalar las librerias 
## pip install -r requirements.txt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard, usuario_ascensor, auditoria
app = FastAPI(title="LiftSafe API", version="1.0")

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
app.include_router(usuario_ascensor.router)  # <-- NUEVO
app.include_router(auditoria.router)


@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}