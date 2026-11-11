-- RNF-012: el log de auditoría es inmutable (no se puede modificar ni borrar).
-- Se puede ejecutar varias veces.
DROP TRIGGER IF EXISTS `auditoria_no_modificar`;
CREATE TRIGGER `auditoria_no_modificar` BEFORE UPDATE ON `auditoria` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El log de auditoria es inmutable: no se puede modificar';
DROP TRIGGER IF EXISTS `auditoria_no_borrar`;
CREATE TRIGGER `auditoria_no_borrar` BEFORE DELETE ON `auditoria` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El log de auditoria es inmutable: no se puede borrar';
