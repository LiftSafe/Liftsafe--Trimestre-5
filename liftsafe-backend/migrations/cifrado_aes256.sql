-- RNF-003: espacio para los datos cifrados con AES-256-GCM.
-- La conversión de las contraseñas y firmas existentes la hace run_migration.py
-- (la aplicación igual lee el formato anterior mientras tanto).
ALTER TABLE `usuario` MODIFY `contrasena_encriptada` VARBINARY(512) NULL;
ALTER TABLE `inspeccion` MODIFY `firma_inspector` MEDIUMTEXT NULL;
ALTER TABLE `inspeccion` MODIFY `firma_cliente` MEDIUMTEXT NULL;
