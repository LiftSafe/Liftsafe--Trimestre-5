-- Fotos por ítem del checklist durante la inspección: la foto queda ligada
-- a la inspección (y al ítem) aunque todavía no exista el informe. Al
-- generar el informe se le asocian automáticamente.
-- También se puede aplicar con:  uv run python run_migration.py

ALTER TABLE `fotografia` MODIFY `id_informe` int(11) NULL;
ALTER TABLE `fotografia` ADD COLUMN `id_inspeccion` int(11) NULL COMMENT 'Inspección donde se tomó la foto' AFTER `id_informe`;
ALTER TABLE `fotografia` ADD KEY `idx_fotografia_inspeccion` (`id_inspeccion`);
ALTER TABLE `fotografia` ADD CONSTRAINT `fk_fotografia_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE;
UPDATE `fotografia` f JOIN `informe` i ON i.id_informe = f.id_informe SET f.id_inspeccion = i.id_inspeccion WHERE f.id_inspeccion IS NULL;
