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

-- 7) Checklist según la estructura de la NTC 5926-1:2012 (numeral 6, grupos 6.1 a 6.11).
-- Se puede ejecutar varias veces: no duplica nada.
-- Las categorías anteriores quedan inactivas: las inspecciones viejas conservan sus respuestas.
SET NAMES utf8mb4;
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.1 Puertas de piso y su sistema mecánico', 'Puertas de acceso en los pisos: enclavamientos, contactos de seguridad, cierre y estado de hojas y marcos.', 1, 'NTC 5926-1:2012 num. 6.1', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.1-01', 'Enclavamiento de las puertas de piso: no se pueden abrir si la cabina no está en ese nivel', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.1 Puertas de piso y su sistema mecánico';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.1-02', 'Contactos eléctricos de seguridad de puertas de piso: el ascensor no arranca con una puerta abierta', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.1 Puertas de piso y su sistema mecánico';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.1-03', 'Desenclavamiento de emergencia: la puerta solo se abre desde el piso con la llave especial', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.1 Puertas de piso y su sistema mecánico';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.1-04', 'Hojas, marcos y umbrales sin deformaciones, roturas ni holguras excesivas', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.1 Puertas de piso y su sistema mecánico';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.1-05', 'Cierre automático de las puertas de piso cuando la cabina se aleja', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.1 Puertas de piso y su sistema mecánico';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.1-06', 'Holguras entre hojas y entre hoja y marco dentro de lo permitido', NULL, 'Leve', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.1 Puertas de piso y su sistema mecánico';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.2 Cables de tracción y sus amarres', 'Cables de suspensión: hilos rotos, diámetro, corrosión, amarres y tensión.', 2, 'NTC 5926-1:2012 num. 6.2', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.2-01', 'Cables sin hilos rotos por encima del criterio de descarte', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.2 Cables de tracción y sus amarres';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.2-02', 'Amarres y terminales de cables completos, con pasadores y contratuercas', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.2 Cables de tracción y sus amarres';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.2-03', 'Diámetro de los cables sin reducción excesiva frente al nominal', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.2 Cables de tracción y sus amarres';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.2-04', 'Cables sin corrosión, aplastamientos, cocas ni deformaciones', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.2 Cables de tracción y sus amarres';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.2-05', 'Tensión de los cables equilibrada entre sí', NULL, 'Leve', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.2 Cables de tracción y sus amarres';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.2-06', 'Cables sin rozamiento con otras partes de la instalación', NULL, 'Leve', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.2 Cables de tracción y sus amarres';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.3 Máquina de tracción y freno', 'Máquina y freno: detención, retención sin energía, estado de zapatas y medios de rescate.', 3, 'NTC 5926-1:2012 num. 6.3', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.3-01', 'El freno detiene la cabina y la retiene al cortar la energía', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.3 Máquina de tracción y freno';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.3-02', 'Circuito de alimentación del freno sin puentes ni anulaciones', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.3 Máquina de tracción y freno';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.3-03', 'Zapatas, forros y resortes del freno en buen estado', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.3 Máquina de tracción y freno';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.3-04', 'Liberación manual del freno disponible y operativa para el rescate', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.3 Máquina de tracción y freno';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.3-05', 'Medio de maniobra manual de emergencia (volante) disponible e identificado', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.3 Máquina de tracción y freno';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.3-06', 'Máquina sin fugas de aceite, ruidos ni vibraciones anormales', NULL, 'Leve', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.3 Máquina de tracción y freno';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.4 Paracaídas y limitador de velocidad', 'Prueba del limitador de velocidad y del paracaídas; estado del cable y de los contactos.', 4, 'NTC 5926-1:2012 num. 6.4', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.4-01', 'El limitador de velocidad se dispara en la prueba', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.4 Paracaídas y limitador de velocidad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.4-02', 'El paracaídas de la cabina actúa y detiene la cabina en la prueba', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.4 Paracaídas y limitador de velocidad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.4-03', 'Cable del limitador en buen estado y tensado por su polea tensora', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.4 Paracaídas y limitador de velocidad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.4-04', 'Contacto eléctrico del limitador y del aflojamiento o rotura de su cable operativo', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.4 Paracaídas y limitador de velocidad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.4-05', 'Limitador precintado, sin señales de manipulación', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.4 Paracaídas y limitador de velocidad';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.5 Cabina y acceso a la cabina', 'Cabina: puertas, protección de cierre, estructura, iluminación, ventilación y mandos en el techo.', 5, 'NTC 5926-1:2012 num. 6.5', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-01', 'Contacto de seguridad de la puerta de cabina: no hay marcha con la puerta abierta', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-02', 'Interruptor de parada y mando de inspección en el techo de cabina operativos', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-03', 'Protección de cierre (borde sensible o cortina) reabre la puerta ante un obstáculo', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-04', 'Paredes, piso y techo de cabina íntegros, sin aberturas peligrosas', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-05', 'Guardapiés bajo el umbral de cabina presente y bien fijado', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-06', 'Iluminación normal y de emergencia de la cabina operativa', NULL, 'Grave', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-07', 'Ventilación de la cabina adecuada', NULL, 'Leve', 1, 7, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.5-08', 'Placa de carga nominal y número máximo de personas visible', NULL, 'Leve', 1, 8, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.5 Cabina y acceso a la cabina';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.6 Contrapeso', 'Contrapeso: bloques, fijaciones, guiadores, paracaídas (si aplica) y protección en el foso.', 6, 'NTC 5926-1:2012 num. 6.6', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.6-01', 'Paracaídas del contrapeso operativo, cuando la instalación lo exige', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.6 Contrapeso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.6-02', 'Bloques del contrapeso asegurados en el bastidor, sin desplazarse', NULL, 'Grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.6 Contrapeso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.6-03', 'Fijaciones y guiadores del contrapeso en buen estado', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.6 Contrapeso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.6-04', 'Pantalla de protección del contrapeso en el foso instalada', NULL, 'Leve', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.6 Contrapeso';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.7 Circuitos eléctricos de seguridad', 'Cadena de seguridad: paradas, finales de carrera, alarma, intercomunicador y cables viajeros.', 7, 'NTC 5926-1:2012 num. 6.7', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.7-01', 'Dispositivos de parada (foso, techo y cuarto de máquinas) detienen la marcha', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.7 Circuitos eléctricos de seguridad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.7-02', 'Finales de carrera superior e inferior bien ubicados y de apertura mecánica', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.7 Circuitos eléctricos de seguridad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.7-03', 'Cadena de seguridad sin puentes ni anulaciones', NULL, 'Muy grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.7 Circuitos eléctricos de seguridad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.7-04', 'Alarma de emergencia audible y operativa desde la cabina', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.7 Circuitos eléctricos de seguridad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.7-05', 'Intercomunicador o teléfono bidireccional de cabina operativo', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.7 Circuitos eléctricos de seguridad';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.7-06', 'Cables viajeros en buen estado y sin rozamientos', NULL, 'Leve', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.7 Circuitos eléctricos de seguridad';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.8 Señalización y mandos', 'Señales, botoneras, indicadores, rotulado de circuitos y protección de huecos abiertos.', 8, 'NTC 5926-1:2012 num. 6.8', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.8-01', 'Huecos abiertos protegidos con baranda o cierre', NULL, 'Grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.8 Señalización y mandos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.8-02', 'Instrucciones de uso y de rescate en emergencia visibles', NULL, 'Leve', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.8 Señalización y mandos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.8-03', 'Indicador de piso o posición en cabina funcional', NULL, 'Leve', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.8 Señalización y mandos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.8-04', 'Botoneras de cabina y de piso funcionan y están identificadas', NULL, 'Leve', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.8 Señalización y mandos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.8-05', 'Interruptores y circuitos identificados y rotulados', NULL, 'Leve', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.8 Señalización y mandos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.8-06', 'Señal de riesgo eléctrico y de acceso restringido en zonas de máquinas', NULL, 'Leve', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.8 Señalización y mandos';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.9 Hueco y foso', 'Hueco y foso: amortiguadores, espacios de refugio, guías, agua, escalera e iluminación.', 9, 'NTC 5926-1:2012 num. 6.9', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-01', 'Amortiguadores de cabina y contrapeso íntegros, fijos y con aceite si son hidráulicos', NULL, 'Muy grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-02', 'Espacios de refugio libres en el foso y en la parte alta del hueco', NULL, 'Muy grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-03', 'Foso seco, sin agua cerca de equipos eléctricos', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-04', 'Escalera o medio de acceso seguro al foso', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-05', 'Guías de cabina y contrapeso alineadas, fijas y sin corrosión excesiva', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-06', 'Hueco cerrado, sin aberturas no previstas ni instalaciones ajenas al ascensor', NULL, 'Grave', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.9-07', 'Iluminación del hueco y del foso operativa', NULL, 'Leve', 1, 7, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.9 Hueco y foso';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.10 Cuarto de máquinas y poleas', 'Cuarto de máquinas: acceso, interruptor principal, poleas, guardas, cableado e hidráulica.', 10, 'NTC 5926-1:2012 num. 6.10', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-01', 'Interruptor principal accesible y que corta la alimentación del ascensor', NULL, 'Grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-02', 'Acceso seguro al cuarto, con cerradura y solo para personal autorizado', NULL, 'Grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-03', 'Poleas sin desgaste excesivo y con los cables bien asentados en sus canales', NULL, 'Grave', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-04', 'Guardas de protección en poleas y partes giratorias', NULL, 'Grave', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-05', 'Cableado con aislamiento en buen estado y conexión a tierra', NULL, 'Grave', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-06', 'Ascensores hidráulicos: grupo, válvulas y tuberías sin fugas y con el nivel de aceite correcto', NULL, 'Grave', 1, 6, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-07', 'Iluminación y toma de corriente del cuarto de máquinas operativas', NULL, 'Leve', 1, 7, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.10-08', 'Cuarto libre de objetos ajenos, humedad y filtraciones', NULL, 'Leve', 1, 8, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.10 Cuarto de máquinas y poleas';
INSERT IGNORE INTO `checklist_categoria` (`nombre_categoria`, `descripcion`, `orden_visualizacion`, `norma_referencia`, `activo`) VALUES ('6.11 Mantenimiento, identificación y rótulos', 'Contrato y registros de mantenimiento, placas de identificación y corrección de defectos anteriores.', 11, 'NTC 5926-1:2012 num. 6.11', 1);
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.11-01', 'Contrato de mantenimiento vigente con empresa responsable', NULL, 'Grave', 1, 1, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.11 Mantenimiento, identificación y rótulos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.11-02', 'Defectos de la inspección anterior corregidos', NULL, 'Grave', 1, 2, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.11 Mantenimiento, identificación y rótulos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.11-03', 'Libro o registro de mantenimiento al día', NULL, 'Leve', 1, 3, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.11 Mantenimiento, identificación y rótulos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.11-04', 'Placa de identificación del ascensor (fabricante, número de serie y capacidad)', NULL, 'Leve', 1, 4, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.11 Mantenimiento, identificación y rótulos';
INSERT IGNORE INTO `checklist_item` (`id_categoria`, `codigo_item`, `descripcion`, `criterio_cumplimiento`, `nivel_criticidad`, `obligatorio`, `orden_visualizacion`, `activo`) SELECT `id_categoria`, 'NTC-6.11-05', 'Rótulo de la empresa de mantenimiento y teléfono de emergencia en sitio', NULL, 'Leve', 1, 5, 1 FROM `checklist_categoria` WHERE `nombre_categoria` = '6.11 Mantenimiento, identificación y rótulos';
UPDATE `checklist_categoria` SET `activo` = 0 WHERE `norma_referencia` IS NULL OR `norma_referencia` NOT LIKE 'NTC 5926-1:2012 num. 6.%';
UPDATE `checklist_categoria` SET `activo` = 1 WHERE `norma_referencia` LIKE 'NTC 5926-1:2012 num. 6.%';

-- 8) Solicitudes que quedaron 'Programada' aunque su inspección ya terminó
UPDATE `solicitud` s JOIN `inspeccion` i ON i.id_solicitud = s.id_solicitud
   SET s.estado = 'Finalizada'
 WHERE i.estado IN ('Finalizada', 'Aprobada') AND s.estado NOT IN ('Finalizada', 'Cancelada');

-- 9) -- RF-008: observaciones durante la inspección (antes exigían el informe)
ALTER TABLE `observacion` MODIFY `id_informe` int(11) NULL;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'observacion' AND COLUMN_NAME = 'id_inspeccion');
SET @sql := IF(@falta, 'ALTER TABLE `observacion` ADD COLUMN `id_inspeccion` int(11) NULL AFTER `id_informe`', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'observacion' AND INDEX_NAME = 'idx_observacion_inspeccion');
SET @sql := IF(@falta, 'ALTER TABLE `observacion` ADD KEY `idx_observacion_inspeccion` (`id_inspeccion`)', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

SET @falta := (SELECT COUNT(*) = 0 FROM information_schema.TABLE_CONSTRAINTS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'observacion' AND CONSTRAINT_NAME = 'fk_observacion_inspeccion');
SET @sql := IF(@falta, 'ALTER TABLE `observacion` ADD CONSTRAINT `fk_observacion_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE', 'SELECT 1');
PREPARE paso FROM @sql; EXECUTE paso; DEALLOCATE PREPARE paso;

UPDATE `observacion` o JOIN `informe` i ON i.id_informe = o.id_informe
   SET o.id_inspeccion = i.id_inspeccion
 WHERE o.id_inspeccion IS NULL;

-- Listo: la base queda igual a la de liftsafe_db.sql actual.
SELECT 'Base de datos actualizada correctamente' AS resultado;
