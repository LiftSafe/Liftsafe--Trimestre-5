# instalar las librerias 
# pip install -r requirements.txt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard, usuario_ascensor, auditoria
=======
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard
# 👇 IMPORTACIONES DE TUS MÓDULOS
from app.routes import solicitudes, programacion
# 👇 IMPORTACIÓN DE NOTIFICACIONES (NUEVA)
from app.routes import notificaciones

>>>>>>> feature/luz
app = FastAPI(title="LiftSafe API", version="1.0")

app.add_middleware(
    CORSMiddleware,
<<<<<<< HEAD
    allow_origins=["http://localhost:5173"],
=======
    # 👇 CORREGIDO: NO USAR "*" CON allow_credentials=True
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
>>>>>>> feature/luz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 REGISTRO DE TODOS LOS ROUTERS
app.include_router(auth.router)
app.include_router(vistas.router)
app.include_router(usuarios.router)
app.include_router(ascensores.router)
app.include_router(inspecciones.router)
app.include_router(dashboard.router)
app.include_router(usuario_ascensor.router)  # <-- NUEVO
app.include_router(auditoria.router)

# 👇 TUS RUTAS (Solicitudes y Programación)
app.include_router(solicitudes.router)
app.include_router(programacion.router)

# 👇 RUTAS DE NOTIFICACIONES (NUEVA)
app.include_router(notificaciones.router)

@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}