"""Repara los permisos de liftsafe_app sobre liftsafe_db (solo XAMPP local).

Síntoma: el login responde "Error interno del servidor" y el log dice
(1044, "Access denied for user 'liftsafe_app'@'localhost' to database 'liftsafe_db'").
Causa: la tabla del sistema mysql.db de XAMPP quedó dañada (tras un cierre
inesperado de MySQL) y se perdieron los permisos por base de datos.

Se conecta como root sin contraseña (valor por defecto de XAMPP). Si mysql.db
está dañada, la renombra (no la borra) y crea una nueva vacía con la misma
estructura; después vuelve a dar los permisos. Requiere MySQL encendido.
"""
from datetime import datetime

import pymysql

USUARIO_APP = "liftsafe_app"
BASE = "liftsafe_db"
HOSTS = ["localhost", "127.0.0.1", "%"]


def tabla_ok(c, tabla):
    try:
        c.execute(f"CHECK TABLE mysql.{tabla}")
        revision = c.fetchall()
        print(f"CHECK mysql.{tabla}:", revision)
        return any(f[2] == "status" and f[3] == "OK" for f in revision)
    except pymysql.MySQLError as e:
        print(f"CHECK mysql.{tabla} falló:", e)
        return False


def recrear_si_danada(c, tabla):
    """Si la tabla está dañada la renombra (no la borra) y crea una vacía igual."""
    if tabla_ok(c, tabla):
        return False
    c.execute(f"SHOW CREATE TABLE mysql.{tabla}")
    definicion = c.fetchone()[1]
    respaldo = f"{tabla}_danada_" + datetime.now().strftime("%Y%m%d_%H%M%S")
    c.execute(f"RENAME TABLE mysql.{tabla} TO mysql.`{respaldo}`")
    c.execute("USE mysql")
    c.execute(definicion)
    print(f"mysql.{tabla} estaba dañada: se guardó como mysql.{respaldo} y se creó una nueva.")
    if not tabla_ok(c, tabla):
        raise SystemExit(f"La tabla nueva mysql.{tabla} tampoco quedó bien; revisa el log de MySQL.")
    return True


con = pymysql.connect(host="127.0.0.1", port=3306, user="root", password="", autocommit=True)
with con.cursor() as c:
    recrear_si_danada(c, "db")
    recrear_si_danada(c, "proxies_priv")
    # Filas que XAMPP trae por defecto (root puede actuar como proxy). Se
    # insertan directo porque GRANT PROXY exige que root ya tenga ese permiso.
    c.execute("SELECT COUNT(*) FROM mysql.proxies_priv WHERE User = 'root'")
    if c.fetchone()[0] == 0:
        c.execute("SELECT Host FROM mysql.user WHERE User = 'root'")
        for (host_root,) in c.fetchall():
            c.execute(
                "INSERT INTO mysql.proxies_priv (Host, User, Proxied_host, Proxied_user, With_grant, Grantor)"
                " VALUES (%s, 'root', '', '', 1, '')",
                (host_root,),
            )
            print(f"Proxy de root@{host_root} restaurado")

    c.execute("SELECT Host FROM mysql.user WHERE User = %s", (USUARIO_APP,))
    hosts_existentes = {fila[0] for fila in c.fetchall()}
    for host in HOSTS:
        if host in hosts_existentes:
            c.execute(f"GRANT ALL PRIVILEGES ON `{BASE}`.* TO %s@%s", (USUARIO_APP, host))
            print(f"Permisos dados a {USUARIO_APP}@{host} sobre {BASE}")
        else:
            print(f"(no existe {USUARIO_APP}@{host}, se omite)")
    c.execute("FLUSH PRIVILEGES")

    c.execute("SHOW GRANTS FOR %s@'localhost'", (USUARIO_APP,))
    for fila in c.fetchall():
        print("  ", fila[0])
con.close()
print("Listo. Vuelve a intentar el login.")
