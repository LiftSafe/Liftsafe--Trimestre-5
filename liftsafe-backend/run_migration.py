"""Aplica migraciones pendientes en la base de datos."""
from sqlalchemy import text
from app.database import engine

MIGRATIONS = [
    """
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'usuario'
      AND COLUMN_NAME = 'tipo_documento'
    """,
]


def column_exists(conn, column_name: str, table_name: str = "usuario") -> bool:
    result = conn.execute(
        text(
            """
            SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :table
              AND COLUMN_NAME = :column
            """
        ),
        {"table": table_name, "column": column_name},
    ).scalar()
    return result > 0


def run():
    with engine.begin() as conn:
        if not column_exists(conn, "tipo_documento"):
            conn.execute(
                text(
                    "ALTER TABLE usuario ADD COLUMN tipo_documento VARCHAR(10) NULL "
                    "COMMENT 'CC, NIT, PPE, CE' AFTER telefono"
                )
            )
            print("Columna tipo_documento agregada.")
        else:
            print("Columna tipo_documento ya existe.")

        # Sedes (sucursales) de los clientes
        tabla_sede = conn.execute(
            text(
                "SELECT COUNT(*) FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sede'"
            )
        ).scalar()
        if not tabla_sede:
            conn.execute(text(
                "CREATE TABLE sede ("
                " id_sede INT NOT NULL AUTO_INCREMENT,"
                " id_cliente INT NOT NULL,"
                " nombre VARCHAR(120) NOT NULL,"
                " direccion VARCHAR(250) NULL,"
                " ciudad VARCHAR(100) NULL,"
                " fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                " PRIMARY KEY (id_sede),"
                " KEY idx_sede_cliente (id_cliente),"
                " CONSTRAINT fk_sede_cliente FOREIGN KEY (id_cliente)"
                "   REFERENCES usuario (id_usuario) ON DELETE CASCADE"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            ))
            print("Tabla sede creada.")
        else:
            print("Tabla sede ya existe.")

        if not column_exists(conn, "id_sede", "ascensor"):
            conn.execute(text(
                "ALTER TABLE ascensor ADD COLUMN id_sede INT NULL AFTER fecha_instalacion"
            ))
            conn.execute(text("ALTER TABLE ascensor ADD KEY idx_ascensor_sede (id_sede)"))
            conn.execute(text(
                "ALTER TABLE ascensor ADD CONSTRAINT fk_ascensor_sede FOREIGN KEY (id_sede)"
                " REFERENCES sede (id_sede) ON DELETE SET NULL"
            ))
            print("Columna ascensor.id_sede agregada.")
        else:
            print("Columna ascensor.id_sede ya existe.")

        # Fotos por ítem del checklist (ligadas a la inspección)
        if not column_exists(conn, "id_inspeccion", "fotografia"):
            conn.execute(text("ALTER TABLE fotografia MODIFY id_informe INT NULL"))
            conn.execute(text("ALTER TABLE fotografia ADD COLUMN id_inspeccion INT NULL AFTER id_informe"))
            conn.execute(text("ALTER TABLE fotografia ADD KEY idx_fotografia_inspeccion (id_inspeccion)"))
            conn.execute(text(
                "ALTER TABLE fotografia ADD CONSTRAINT fk_fotografia_inspeccion FOREIGN KEY (id_inspeccion)"
                " REFERENCES inspeccion (id_inspeccion) ON DELETE CASCADE"
            ))
            conn.execute(text(
                "UPDATE fotografia f JOIN informe i ON i.id_informe = f.id_informe"
                " SET f.id_inspeccion = i.id_inspeccion WHERE f.id_inspeccion IS NULL"
            ))
            print("Columna fotografia.id_inspeccion agregada.")
        else:
            print("Columna fotografia.id_inspeccion ya existe.")


if __name__ == "__main__":
    run()
