"""Prueba rápida de flujos auth y usuarios."""
import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
PASSWORD = "ClienteT3st!"
CLIENT_EMAIL = "cliente.test@liftsafe.com"


def request(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        try:
            detail = json.loads(payload)
        except json.JSONDecodeError:
            detail = payload
        return e.code, detail


def main():
    from app.database import SessionLocal
    from app.models.models import Usuario, Rol

    db = SessionLocal()
    admin = db.query(Usuario, Rol.nombre_rol).join(Rol).filter(Rol.nombre_rol == "Administrador").first()
    db.close()
    if not admin:
        print("FAIL: no hay administrador en BD")
        return
    admin_user, admin_role = admin
    print(f"Admin encontrado: {admin_user.correo}")

    # 1) Registro cliente
    status, res = request("POST", "/auth/register", {
        "nombre_completo": "Cliente Prueba",
        "correo": CLIENT_EMAIL,
        "contrasena": PASSWORD,
        "tipo_documento": "CC",
        "documento_identidad": "1098765432",
        "id_rol": 6,
    })
    print(f"Registro cliente: {status} -> {res}")

    # 2) Rechazar rol no cliente
    status, res = request("POST", "/auth/register", {
        "nombre_completo": "Inspector Hack",
        "correo": "hack@test.com",
        "contrasena": PASSWORD,
        "tipo_documento": "CC",
        "documento_identidad": "111111",
        "id_rol": 4,
    })
    print(f"Registro inspector (debe fallar): {status} -> {res}")

    # 3) Rechazar contraseña débil
    status, res = request("POST", "/auth/register", {
        "nombre_completo": "Weak Pass",
        "correo": "weak@test.com",
        "contrasena": "abc123",
        "tipo_documento": "CC",
        "documento_identidad": "222222",
        "id_rol": 6,
    })
    print(f"Registro contraseña débil (debe fallar): {status} -> {res}")

    # 4) Login admin - try common passwords or query is needed
    # We'll use TestClient with DB to verify admin password if login fails
    from app.controllers.auth_controller import verify_password
    db = SessionLocal()
    admin_db = db.query(Usuario).filter(Usuario.id_usuario == admin_user.id_usuario).first()
    db.close()

    admin_password = None
    for candidate in ["admin123", "Admin123!", "Administrador1", "admin1234", "Admin1234"]:
        if verify_password(candidate, admin_db.contrasena):
            admin_password = candidate
            break

    if not admin_password:
        print("WARN: no se pudo adivinar contraseña admin; probando login con Admin123!")
        admin_password = "Admin123!"

    status, login = request("POST", "/auth/login", {
        "correo": admin_user.correo,
        "contrasena": admin_password,
    })
    print(f"Login admin: {status} -> {login if status != 200 else {'rol': login.get('rol'), 'token': 'ok'}}")
    if status != 200:
        print("No se pudo probar creación de usuario sin login admin")
        return

    token = login["access_token"]

    # 5) Crear inspector
    status, res = request("POST", "/usuarios", {
        "nombre_completo": "Inspector Prueba",
        "correo": "inspector.test@liftsafe.com",
        "contrasena": PASSWORD,
        "tipo_documento": "CC",
        "documento_identidad": "9876543210",
        "id_rol": 4,
    }, token=token)
    print(f"Crear inspector: {status} -> {res}")

    # 6) Login inspector
    status, res = request("POST", "/auth/login", {
        "correo": "inspector.test@liftsafe.com",
        "contrasena": PASSWORD,
    })
    print(f"Login inspector: {status} -> {res if status != 200 else {'rol': res.get('rol')}}")

    # 7) Ascensores sin code en respuesta (si hay datos)
    status, asc = request("GET", "/dashboard/ascensores", token=token)
    if status == 200 and asc:
        sample = asc[0]
        has_code = "code" in sample
        print(f"Ascensores: {len(asc)} registros, campo code presente={has_code}, keys={list(sample.keys())[:8]}")
    else:
        print(f"Ascensores: {status}")


if __name__ == "__main__":
    main()
