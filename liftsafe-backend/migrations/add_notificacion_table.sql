-- FIX: la columna `leida` estaba como bit(1). PyMySQL devuelve un
-- bit(1) como bytes (b'\x00' / b'\x01'), y el modelo SQLAlchemy la
-- declara como Boolean genérico -> bool(b'\x00') es True en Python
-- (cualquier bytes no vacío es verdadero), así que TODAS las
-- notificaciones se leían como "ya leídas" aunque fueran nuevas y
-- la campanita nunca mostraba el número en rojo. Se usa tinyint(1),
-- que sí se interpreta correctamente como 0/1.
-- Crea la tabla notificacion, que ya existe como modelo SQLAlchemy (app/models/models.py)
-- y como pantalla en el frontend (campanita de notificaciones), pero nunca se migró a la
-- base de datos. Ejecutar este script en MySQL antes de activar el router de notificaciones.

CREATE TABLE IF NOT EXISTS `notificacion` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario_destino` int(11) NOT NULL COMMENT 'Usuario que recibe la notificación',
  `mensaje` varchar(255) NOT NULL COMMENT 'Contenido de la notificación',
  `enlace` varchar(255) DEFAULT NULL COMMENT 'Ruta del frontend a la que lleva al hacer clic',
  `leida` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la notificación fue leída',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_notificacion_usuario` (`id_usuario_destino`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`id_usuario_destino`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
