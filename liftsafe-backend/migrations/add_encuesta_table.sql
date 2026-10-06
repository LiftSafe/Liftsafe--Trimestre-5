-- FIX: mismo problema que en add_notificacion_table.sql -> 'respondida'
-- estaba como bit(1), que PyMySQL devuelve como bytes, y
-- bool(b'\x00') es True en Python -> TODAS las encuestas se leían como
-- "ya respondidas" desde el momento en que se creaban, y el cliente
-- nunca podía calificar nada. Se usa tinyint(1).
-- Crea la tabla encuesta de satisfacción, que se genera automáticamente
-- cuando una inspección pasa a estado "Finalizada" (ver actualizar_estado
-- en app/routes/inspecciones.py): ahí mismo se le crea una notificación en
-- la app al cliente y se le envía un correo avisándole. Ejecutar este
-- script en MySQL (igual que add_notificacion_table.sql) antes de marcar
-- ninguna inspección como Finalizada, o esa parte del flujo fallará porque
-- la tabla no existe todavía.

CREATE TABLE IF NOT EXISTS `encuesta` (
  `id_encuesta` int(11) NOT NULL AUTO_INCREMENT,
  `id_inspeccion` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL COMMENT 'Cliente que debe responder la encuesta',
  `calificacion` int(11) DEFAULT NULL COMMENT 'De 1 (peor) a 5 (mejor)',
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
