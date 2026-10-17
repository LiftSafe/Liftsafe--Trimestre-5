-- Sedes (sucursales) de cada cliente. Si un cliente tiene 2 o más sedes,
-- al registrar un ascensor hay que indicar en cuál sede está.
-- También se puede aplicar con:  uv run python run_migration.py

CREATE TABLE IF NOT EXISTS `sede` (
  `id_sede` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL COMMENT 'Usuario con rol Cliente dueño de la sede',
  `nombre` varchar(120) NOT NULL COMMENT 'Ej: Sede Norte, Torre B',
  `direccion` varchar(250) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_sede`),
  KEY `idx_sede_cliente` (`id_cliente`),
  CONSTRAINT `fk_sede_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `ascensor` ADD COLUMN `id_sede` int(11) NULL COMMENT 'Sede del cliente' AFTER `fecha_instalacion`;
ALTER TABLE `ascensor` ADD KEY `idx_ascensor_sede` (`id_sede`);
ALTER TABLE `ascensor` ADD CONSTRAINT `fk_ascensor_sede` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id_sede`) ON DELETE SET NULL;
