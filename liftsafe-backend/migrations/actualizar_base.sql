-- =====================================================================
-- ACTUALIZAR UNA BASE liftsafe_db QUE YA TENÍAS IMPORTADA
-- =====================================================================
-- Úsalo si importaste liftsafe_db.sql ANTES de los cambios de sedes y
-- fotos por ítem. Agrega solo lo que falte y NO borra tus datos.
-- Se puede importar varias veces: si algo ya existe, lo salta.
--
-- phpMyAdmin: selecciona la base liftsafe_db -> Importar -> este archivo.
-- (Equivale a correr en liftsafe-backend:  uv run python run_migration.py)
-- Funciona en XAMPP (MariaDB) y en MySQL 8.
-- =====================================================================

-- 1) Tabla de notificaciones (campana)
CREATE TABLE IF NOT EXISTS `notificacion` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario_destino` int(11) NOT NULL,
  `mensaje` varchar(255) NOT NULL,
  `enlace` varchar(255) DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_notificacion_usuario` (`id_usuario_destino`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`id_usuario_destino`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Tabla de encuestas de satisfacción
CREATE TABLE IF NOT EXISTS `encuesta` (
  `id_encuesta` int(11) NOT NULL AUTO_INCREMENT,
  `id_inspeccion` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `calificacion` int(11) DEFAULT NULL,
  `comentario` text DEFAULT NULL,
  `respondida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_respuesta` datetime DEFAULT NULL,
  PRIMARY KEY (`id_encuesta`),
  KEY `idx_encuesta_inspeccion` (`id_inspeccion`),
  KEY `idx_encuesta_cliente` (`id_cliente`),
  CONSTRAINT `fk_encuesta_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE,
  CONSTRAINT `fk_encuesta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Columna usuario.tipo_documento
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario' AND COLUMN_NAME = 'tipo_documento');
SET @sql := IF(@falta, 'ALTER TABLE `usuario` ADD COLUMN `tipo_documento` varchar(10) NULL AFTER `telefono`', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- 4) Sedes (sucursales) de cada cliente
CREATE TABLE IF NOT EXISTS `sede` (
  `id_sede` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL COMMENT 'Usuario con rol Cliente dueño de la sede',
  `nombre` varchar(120) NOT NULL,
  `direccion` varchar(250) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_sede`),
  KEY `idx_sede_cliente` (`id_cliente`),
  CONSTRAINT `fk_sede_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Columna ascensor.id_sede (+ índice y llave foránea)
SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ascensor' AND COLUMN_NAME = 'id_sede');
SET @sql := IF(@falta, 'ALTER TABLE `ascensor` ADD COLUMN `id_sede` int(11) NULL COMMENT ''Sede del cliente'' AFTER `fecha_instalacion`', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ascensor' AND INDEX_NAME = 'idx_ascensor_sede');
SET @sql := IF(@falta, 'ALTER TABLE `ascensor` ADD KEY `idx_ascensor_sede` (`id_sede`)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.TABLE_CONSTRAINTS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ascensor' AND CONSTRAINT_NAME = 'fk_ascensor_sede');
SET @sql := IF(@falta, 'ALTER TABLE `ascensor` ADD CONSTRAINT `fk_ascensor_sede` FOREIGN KEY (`id_sede`) REFERENCES `sede` (`id_sede`) ON DELETE SET NULL', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

-- 6) Fotos por ítem del checklist: la foto se liga a la inspección
ALTER TABLE `fotografia` MODIFY `id_informe` int(11) NULL;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fotografia' AND COLUMN_NAME = 'id_inspeccion');
SET @sql := IF(@falta, 'ALTER TABLE `fotografia` ADD COLUMN `id_inspeccion` int(11) NULL AFTER `id_informe`', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fotografia' AND INDEX_NAME = 'idx_fotografia_inspeccion');
SET @sql := IF(@falta, 'ALTER TABLE `fotografia` ADD KEY `idx_fotografia_inspeccion` (`id_inspeccion`)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.TABLE_CONSTRAINTS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fotografia' AND CONSTRAINT_NAME = 'fk_fotografia_inspeccion');
SET @sql := IF(@falta, 'ALTER TABLE `fotografia` ADD CONSTRAINT `fk_fotografia_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

UPDATE `fotografia` f JOIN `informe` i ON i.id_informe = f.id_informe
   SET f.id_inspeccion = i.id_inspeccion
 WHERE f.id_inspeccion IS NULL;

-- Listo: la base queda igual a la de liftsafe_db.sql actual.
SELECT 'Base de datos actualizada correctamente' AS resultado;
