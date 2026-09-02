<<<<<<< HEAD

## // instalar las librerias 
## pip install -r requirements.txt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, vistas, usuarios, ascensores, inspecciones, dashboard, informes, auditoria, checklist, fotografias, observaciones, programacion, solicitudes, usuario_ascensor

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
=======
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
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
=======
# 👇 REGISTRO DE TODOS LOS ROUTERS
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
app.include_router(auth.router)
app.include_router(vistas.router)
app.include_router(usuarios.router)
app.include_router(ascensores.router)
app.include_router(inspecciones.router)
app.include_router(dashboard.router)
<<<<<<< HEAD
app.include_router(informes.router)
app.include_router(auditoria.router)
app.include_router(checklist.router)
app.include_router(fotografias.router)
app.include_router(observaciones.router)
app.include_router(programacion.router)
app.include_router(solicitudes.router)
app.include_router(usuario_ascensor.router)

@app.get("/")
def root():
    return {"message": "LiftSafe API funcionando"}
=======
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
>>>>>>> c8306d785873f7353c3912678d3673587c1f0869
