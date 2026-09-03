-- Crea la tabla notificacion, que ya existe como modelo SQLAlchemy (app/models/models.py)
-- y como pantalla en el frontend (campanita de notificaciones), pero nunca se migró a la
-- base de datos. Ejecutar este script en MySQL antes de activar el router de notificaciones.

CREATE TABLE IF NOT EXISTS `notificacion` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario_destino` int(11) NOT NULL COMMENT 'Usuario que recibe la notificación',
  `mensaje` varchar(255) NOT NULL COMMENT 'Contenido de la notificación',
  `leida` bit(1) NOT NULL DEFAULT b'0' COMMENT 'Indica si la notificación fue leída',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `idx_notificacion_usuario` (`id_usuario_destino`),
  CONSTRAINT `fk_notificacion_usuario` FOREIGN KEY (`id_usuario_destino`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
