-- RF-008: observaciones durante la inspección (antes exigían el informe)
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
