-- Esquema de la BD de PRUEBAS de LiftSafe (semana 6). Generado desde liftsafe_db.sql:
-- misma estructura, sin datos de ejemplo; solo los catálogos que exigen las llaves foráneas.
-- Docker lo ejecuta al crear el contenedor (docker-entrypoint-initdb.d).
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: liftsafe_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ascensor`
--

DROP TABLE IF EXISTS `ascensor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ascensor` (
  `id_ascensor` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL COMMENT 'Usuario con rol Cliente',
  `codigo_interno` varchar(50) NOT NULL COMMENT 'Código único de identificación',
  `marca` varchar(80) NOT NULL,
  `modelo` varchar(80) NOT NULL,
  `numero_serie` varchar(80) NOT NULL,
  `tipo_ascensor` varchar(50) NOT NULL COMMENT 'Pasajeros, Carga, Montacamillas, etc.',
  `capacidad_kg` int(11) NOT NULL,
  `capacidad_personas` int(11) DEFAULT NULL,
  `numero_pisos` int(11) NOT NULL,
  `velocidad_ms` double DEFAULT NULL,
  `ubicacion_exacta` varchar(200) NOT NULL COMMENT 'Torre, piso, sector',
  `direccion_completa` varchar(250) NOT NULL,
  `ciudad` varchar(100) NOT NULL,
  `estado` varchar(255) NOT NULL,
  `fecha_instalacion` date DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_ascensor`),
  UNIQUE KEY `codigo_interno` (`codigo_interno`),
  KEY `idx_cliente` (`id_cliente`),
  CONSTRAINT `fk_ascensor_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ascensor`
--

LOCK TABLES `ascensor` WRITE;
/*!40000 ALTER TABLE `ascensor` DISABLE KEYS */;
/*!40000 ALTER TABLE `ascensor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id_auditoria` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL COMMENT 'Usuario que ejecutó la acción',
  `tabla_afectada` varchar(50) NOT NULL,
  `operacion` varchar(20) NOT NULL,
  `id_registro` int(11) DEFAULT NULL COMMENT 'ID del registro afectado',
  `datos_anteriores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Valores antes del cambio' CHECK (json_valid(`datos_anteriores`)),
  `datos_nuevos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Valores después del cambio' CHECK (json_valid(`datos_nuevos`)),
  `ip_origen` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `fecha_evento` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_auditoria`),
  KEY `idx_usuario` (`id_usuario`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checklist_categoria`
--

DROP TABLE IF EXISTS `checklist_categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_categoria` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_categoria` varchar(150) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `orden_visualizacion` int(11) NOT NULL DEFAULT 0,
  `norma_referencia` varchar(100) DEFAULT NULL COMMENT 'NTC 5926-1:2012',
  `activo` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE KEY `nombre_categoria` (`nombre_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklist_categoria`
--

LOCK TABLES `checklist_categoria` WRITE;
/*!40000 ALTER TABLE `checklist_categoria` DISABLE KEYS */;
INSERT INTO `checklist_categoria` VALUES (1,'Cuarto de Máquinas','Verificación de condiciones del cuarto de máquinas: acceso, ventilación, iluminación, equipos y seguridad eléctrica.',1,'NTC 5926-1:2012 Sección 6.3',_binary ''),(2,'Foso del Ascensor','Inspección del foso: dimensiones, iluminación, drenaje, dispositivos de parada y estado general.',2,'NTC 5926-1:2012 Sección 5.7',_binary ''),(3,'Cabina','Revisión de la cabina: dimensiones, iluminación, ventilación, comunicación de emergencia y capacidad.',3,'NTC 5926-1:2012 Sección 8.1',_binary ''),(4,'Puertas de Cabina y Rellano','Control de puertas: funcionamiento, enclavamientos, contactos eléctricos, velocidad de cierre y reapertura.',4,'NTC 5926-1:2012 Sección 7.1',_binary ''),(5,'Sistema de Tracción y Suspensión','Evaluación de cables, poleas, contrapeso, tambor y mecanismo de tracción principal.',5,'NTC 5926-1:2012 Sección 9.1',_binary ''),(6,'Dispositivos de Seguridad','Verificación de limitador de velocidad, amortiguadores, paracaídas, freno y enclavamientos de seguridad.',6,'NTC 5926-1:2012 Sección 10.1',_binary ''),(7,'Instalación Eléctrica','Revisión del tablero eléctrico, cableado, toma de tierra, protecciones y circuitos de seguridad.',7,'NTC 5926-1:2012 Sección 13.1',_binary ''),(8,'Documentación Técnica y Legal','Verificación de licencias, manuales, planos, libro de mantenimiento y certificados vigentes.',8,'NTC 5926-1:2012 Sección 4.1',_binary ''),(9,'Guías y Estructuras de Soporte','Inspección de guías de cabina y contrapeso, soportes, fijaciones y alineación general.',9,'NTC 5926-1:2012 Sección 11.1',_binary ''),(10,'Sistema Hidráulico','Revisión del grupo hidráulico, tuberías, válvulas, cilindro y nivel de aceite en ascensores hidráulicos.',10,'NTC 5926-1:2012 Sección 14.1',_binary ''),(11,'Iluminación y Señalización','Verificación de iluminación en cabina, rellanos, foso y cuarto de máquinas, así como señalización de emergencia.',11,'NTC 5926-1:2012 Sección 12.3',_binary ''),(12,'Sistema de Comunicación y Alarma','Revisión del intercomunicador, alarma sonora, botón de emergencia y sistema de llamada en cabina.',12,'NTC 5926-1:2012 Sección 8.4',_binary ''),(13,'Contrapeso y Amortiguadores','Inspección del contrapeso, sus guías, fijaciones y los amortiguadores de cabina y contrapeso en el foso.',13,'NTC 5926-1:2012 Sección 10.4',_binary ''),(14,'Recinto y Accesos del Ascensor','Verificación del recinto, huecos, accesos de emergencia, trampillas y puertas de inspección.',14,'NTC 5926-1:2012 Sección 5.2',_binary ''),(15,'Cuadro de Maniobra y Control','Revisión del cuadro de maniobra, tarjetas electrónicas, relés, contactores y lógica de control.',15,'NTC 5926-1:2012 Sección 13.4',_binary ''),(16,'Frenos y Sistema de Parada','Verificación del freno electromagnético, sistema de parada de emergencia y retención bajo carga nominal.',16,'NTC 5926-1:2012 Sección 10.2',_binary ''),(17,'Velocidad y Rendimiento','Medición de velocidad nominal, aceleración, desaceleración y comportamiento en marcha normal y de emergencia.',17,'NTC 5926-1:2012 Sección 9.3',_binary ''),(18,'Protecciones Mecánicas','Inspección de guardas, cubiertas de poleas, protecciones de maquinaria giratoria y dispositivos anti-atrapamiento.',18,'NTC 5926-1:2012 Sección 6.5',_binary ''),(19,'Nivelación y Confort','Evaluación de la precisión de nivelación en todos los pisos, vibraciones, ruido y confort en el recorrido.',19,'NTC 5926-1:2012 Sección 9.4',_binary ''),(20,'Mantenimiento Preventivo','Revisión del cumplimiento del plan de mantenimiento preventivo, lubricación, ajustes y reemplazos programados.',20,'NTC 5926-1:2012 Sección 4.3',_binary '');
/*!40000 ALTER TABLE `checklist_categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checklist_item`
--

DROP TABLE IF EXISTS `checklist_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_item` (
  `id_item` int(11) NOT NULL AUTO_INCREMENT,
  `id_categoria` int(11) NOT NULL COMMENT 'Categoría a la que pertenece',
  `codigo_item` varchar(20) NOT NULL COMMENT 'Ej: CM-01, CAB-03',
  `descripcion` text NOT NULL,
  `criterio_cumplimiento` text DEFAULT NULL COMMENT 'Descripción de qué se considera cumplimiento',
  `nivel_criticidad` varchar(255) NOT NULL,
  `obligatorio` bit(1) DEFAULT NULL,
  `orden_visualizacion` int(11) NOT NULL DEFAULT 0,
  `activo` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id_item`),
  UNIQUE KEY `codigo_item` (`codigo_item`),
  KEY `idx_categoria` (`id_categoria`),
  CONSTRAINT `fk_item_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `checklist_categoria` (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklist_item`
--

LOCK TABLES `checklist_item` WRITE;
/*!40000 ALTER TABLE `checklist_item` DISABLE KEYS */;
INSERT INTO `checklist_item` VALUES (1,1,'CM-01','Acceso exclusivo y señalizado al cuarto de máquinas','La puerta debe ser de acceso restringido, con señal de peligro eléctrico y aviso de acceso solo a personal autorizado.','Alto',_binary '',1,_binary ''),(2,2,'FO-01','Iluminación permanente mínima de 50 lux en el foso','El foso debe contar con iluminación eléctrica permanente de mínimo 50 lux, con interruptor accesible desde el acceso.','Medio',_binary '',1,_binary ''),(3,3,'CAB-01','Dispositivo de comunicación de emergencia bidireccional en cabina','Debe existir intercomunicador operativo que permita comunicación bidireccional entre cabina y puesto de vigilancia.','Crítico',_binary '',1,_binary ''),(4,4,'PU-01','Enclavamiento mecánico y eléctrico de puertas de rellano','Todas las puertas de rellano deben contar con enclavamiento que impida su apertura con la cabina fuera del nivel.','Crítico',_binary '',1,_binary ''),(5,5,'TR-01','Estado de cables de tracción sin hilos rotos ni corrosión','Los cables no deben presentar hilos rotos, corrosión superficial mayor al 30% ni deformaciones visibles.','Crítico',_binary '',1,_binary ''),(6,6,'SEG-01','Limitador de velocidad operativo y con sello de calibración vigente','El limitador debe activarse a la velocidad de disparo establecida. Debe contar con sello de calibración vigente.','Crítico',_binary '',1,_binary ''),(7,7,'EL-01','Tablero eléctrico con protecciones y etiquetado correcto','Todos los circuitos deben estar identificados, con protecciones adecuadas y sin conexiones improvisadas.','Alto',_binary '',1,_binary ''),(8,8,'DOC-01','Licencia de operación del ascensor vigente','El ascensor debe contar con licencia o permiso de operación vigente emitido por la autoridad competente.','Crítico',_binary '',1,_binary ''),(9,9,'GUI-01','Guías de cabina y contrapeso alineadas y sin deformaciones','Las guías deben estar correctamente alineadas, fijas a la estructura, sin torceduras ni corrosión excesiva.','Alto',_binary '',1,_binary ''),(10,10,'HID-01','Nivel de aceite del grupo hidráulico dentro del rango permitido','El nivel de aceite debe estar entre las marcas mínima y máxima del depósito. Sin fugas en tuberías ni cilindro.','Alto',_binary '',1,_binary ''),(11,11,'ILU-01','Iluminación de emergencia autónoma operativa en cabina','La luz de emergencia debe activarse automáticamente al corte de energía y mantenerse encendida mínimo 1 hora.','Crítico',_binary '',1,_binary ''),(12,12,'COM-01','Alarma sonora de emergencia operativa desde cabina','El botón de alarma debe activar una señal sonora audible desde el exterior. Prueba de funcionamiento obligatoria.','Crítico',_binary '',1,_binary ''),(13,13,'CNT-01','Amortiguadores de cabina y contrapeso en buen estado','Los amortiguadores deben estar íntegros, sin corrosión, deformaciones ni fugas de aceite en los hidráulicos.','Crítico',_binary '',1,_binary ''),(14,14,'REC-01','Recinto del ascensor cerrado y sin accesos no autorizados','El recinto debe estar completamente cerrado. No deben existir aberturas no previstas en el diseño original.','Alto',_binary '',1,_binary ''),(15,15,'MAN-01','Cuadro de maniobra accesible y con identificación de circuitos','El cuadro debe estar cerrado con llave, con todos sus circuitos identificados y sin componentes sueltos o quemados.','Alto',_binary '',1,_binary ''),(16,16,'FRE-01','Freno electromagnético con acción eficaz bajo carga nominal','El freno debe detener y mantener la cabina con carga nominal sin deslizamiento al cortarse la corriente eléctrica.','Crítico',_binary '',1,_binary ''),(17,17,'VEL-01','Velocidad nominal dentro del rango permitido por diseño','La velocidad medida en recorrido nominal no debe superar en más del 5% la velocidad nominal declarada por el fabricante.','Alto',_binary '',1,_binary ''),(18,18,'PRO-01','Guardas de polea de tracción y desvío instaladas y fijas','Todas las poleas deben contar con guardas de protección fijas que impidan el contacto accidental con partes móviles.','Alto',_binary '',1,_binary ''),(19,19,'NIV-01','Precisión de nivelación máximo ±10 mm en todos los pisos','Al detenerse en cada piso, la diferencia entre el nivel de la cabina y el rellano no debe superar ±10 mm.','Alto',_binary '',1,_binary ''),(20,20,'MNT-01','Plan de mantenimiento preventivo ejecutado y documentado','Deben existir registros firmados de todas las actividades de mantenimiento preventivo según el plan del fabricante.','Medio',_binary '',1,_binary '');
/*!40000 ALTER TABLE `checklist_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_checklist`
--

DROP TABLE IF EXISTS `detalle_checklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_checklist` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_inspeccion` int(11) NOT NULL,
  `id_item` int(11) NOT NULL,
  `resultado` varchar(20) NOT NULL COMMENT 'Cumple, No Cumple, No Aplica',
  `observacion` varchar(500) DEFAULT NULL COMMENT 'Detalle del hallazgo',
  `accion_requerida` text DEFAULT NULL COMMENT 'Corrección o mejora sugerida',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_detalle`),
  UNIQUE KEY `id_inspeccion` (`id_inspeccion`,`id_item`),
  KEY `idx_item` (`id_item`),
  CONSTRAINT `fk_detalle_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_item` FOREIGN KEY (`id_item`) REFERENCES `checklist_item` (`id_item`)
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_checklist`
--

LOCK TABLES `detalle_checklist` WRITE;
/*!40000 ALTER TABLE `detalle_checklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalle_checklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fotografia`
--

DROP TABLE IF EXISTS `fotografia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fotografia` (
  `id_foto` int(11) NOT NULL AUTO_INCREMENT,
  `id_informe` int(11) NOT NULL COMMENT 'Informe al que pertenece la fotografía',
  `id_item` int(11) DEFAULT NULL COMMENT 'Item del checklist asociado (opcional)',
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL COMMENT 'URL o path del archivo',
  `tamano_kb` int(11) DEFAULT NULL,
  `descripcion` varchar(300) DEFAULT NULL,
  `tipo_evidencia` varchar(255) DEFAULT NULL,
  `fecha_captura` datetime NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL COMMENT 'Geolocalización',
  `longitud` decimal(11,8) DEFAULT NULL,
  `sincronizado` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id_foto`),
  KEY `idx_informe` (`id_informe`),
  KEY `idx_item` (`id_item`),
  CONSTRAINT `fk_foto_informe` FOREIGN KEY (`id_informe`) REFERENCES `informe` (`id_informe`) ON DELETE CASCADE,
  CONSTRAINT `fk_foto_item` FOREIGN KEY (`id_item`) REFERENCES `checklist_item` (`id_item`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fotografia`
--

LOCK TABLES `fotografia` WRITE;
/*!40000 ALTER TABLE `fotografia` DISABLE KEYS */;
/*!40000 ALTER TABLE `fotografia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `informe`
--

DROP TABLE IF EXISTS `informe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `informe` (
  `id_informe` int(11) NOT NULL AUTO_INCREMENT,
  `id_inspeccion` int(11) NOT NULL,
  `numero_informe` varchar(50) NOT NULL COMMENT 'Código único del informe',
  `fecha_generacion` datetime DEFAULT NULL,
  `fecha_revision` datetime DEFAULT NULL,
  `fecha_aprobacion` datetime DEFAULT NULL,
  `estado` varchar(255) NOT NULL,
  `id_revisor` int(11) DEFAULT NULL COMMENT 'Coordinador o Director Técnico',
  `observaciones_revision` text DEFAULT NULL,
  `ruta_pdf` varchar(500) DEFAULT NULL COMMENT 'Ubicación del PDF generado',
  `hash_documento` varchar(64) DEFAULT NULL COMMENT 'SHA-256 para integridad',
  `conclusion_general` text DEFAULT NULL,
  `concepto_tecnico` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_informe`),
  UNIQUE KEY `id_inspeccion` (`id_inspeccion`),
  UNIQUE KEY `numero_informe` (`numero_informe`),
  KEY `idx_revisor` (`id_revisor`),
  CONSTRAINT `fk_informe_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`),
  CONSTRAINT `fk_informe_revisor` FOREIGN KEY (`id_revisor`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `informe`
--

LOCK TABLES `informe` WRITE;
/*!40000 ALTER TABLE `informe` DISABLE KEYS */;
/*!40000 ALTER TABLE `informe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspeccion`
--

DROP TABLE IF EXISTS `inspeccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspeccion` (
  `id_inspeccion` int(11) NOT NULL AUTO_INCREMENT,
  `id_programacion` int(11) NOT NULL,
  `id_ascensor` int(11) NOT NULL,
  `id_inspector` int(11) NOT NULL,
  `id_solicitud` int(11) NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `duracion_minutos` int(11) DEFAULT NULL,
  `estado` varchar(255) NOT NULL,
  `firma_inspector` text DEFAULT NULL COMMENT 'Firma digital base64',
  `fecha_firma_inspector` datetime DEFAULT NULL,
  `firma_cliente` text DEFAULT NULL COMMENT 'Firma digital base64',
  `fecha_firma_cliente` datetime DEFAULT NULL,
  `sincronizado` bit(1) DEFAULT NULL,
  `fecha_sincronizacion` timestamp NULL DEFAULT NULL,
  `observaciones_generales` text DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_inspeccion`),
  KEY `idx_programacion` (`id_programacion`),
  KEY `idx_ascensor` (`id_ascensor`),
  KEY `idx_inspector` (`id_inspector`),
  KEY `idx_solicitud` (`id_solicitud`),
  CONSTRAINT `fk_inspeccion_ascensor` FOREIGN KEY (`id_ascensor`) REFERENCES `ascensor` (`id_ascensor`),
  CONSTRAINT `fk_inspeccion_inspector` FOREIGN KEY (`id_inspector`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_inspeccion_programacion` FOREIGN KEY (`id_programacion`) REFERENCES `programacion` (`id_programacion`),
  CONSTRAINT `fk_inspeccion_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspeccion`
--

LOCK TABLES `inspeccion` WRITE;
/*!40000 ALTER TABLE `inspeccion` DISABLE KEYS */;
/*!40000 ALTER TABLE `inspeccion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `observacion`
--

DROP TABLE IF EXISTS `observacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `observacion` (
  `id_observacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_informe` int(11) NOT NULL,
  `tipo_observacion` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `nivel_riesgo` varchar(255) NOT NULL,
  `requiere_atencion_inmediata` bit(1) DEFAULT NULL,
  `fecha_limite_recomendada` date DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_observacion`),
  KEY `idx_informe` (`id_informe`),
  CONSTRAINT `fk_observacion_informe` FOREIGN KEY (`id_informe`) REFERENCES `informe` (`id_informe`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `observacion`
--

LOCK TABLES `observacion` WRITE;
/*!40000 ALTER TABLE `observacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `observacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programacion`
--

DROP TABLE IF EXISTS `programacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programacion` (
  `id_programacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_solicitud` int(11) NOT NULL,
  `id_inspector` int(11) NOT NULL COMMENT 'Usuario con rol Inspector',
  `fecha_programada` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin_estimada` time DEFAULT NULL,
  `estado` varchar(255) NOT NULL,
  `motivo_cancelacion` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_modificacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_programacion`),
  KEY `idx_solicitud` (`id_solicitud`),
  KEY `idx_inspector` (`id_inspector`),
  CONSTRAINT `fk_programacion_inspector` FOREIGN KEY (`id_inspector`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `fk_programacion_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`id_solicitud`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programacion`
--

LOCK TABLES `programacion` WRITE;
/*!40000 ALTER TABLE `programacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `programacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL COMMENT 'Administrador, Director Técnico, Coordinador, Inspector, Asesor, Cliente',
  `descripcion` varchar(200) DEFAULT NULL COMMENT 'Descripción de permisos del rol',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'Administrador','Acceso total al sistema, gestión de usuarios y configuración','2025-01-10 13:00:00'),(2,'Director Técnico','Aprueba informes, supervisa inspectores y coordina operaciones','2025-01-10 13:00:00'),(3,'Coordinador','Programa inspecciones, asigna inspectores y revisa informes','2025-01-10 13:00:00'),(4,'Inspector','Ejecuta inspecciones en campo, diligencia checklist y firma informes','2025-01-10 13:00:00'),(5,'Asesor','Gestión comercial, atención al cliente y seguimiento de contratos','2025-01-10 13:00:00'),(6,'Cliente','Consulta estado de sus ascensores e informes de inspección','2025-01-10 13:00:00'),(8,'RolEditadoExitoso','Este rol fue editado correctamente','2026-04-01 02:54:50');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud`
--

DROP TABLE IF EXISTS `solicitud`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud` (
  `id_solicitud` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `id_ascensor` int(11) NOT NULL,
  `tipo_servicio` varchar(100) NOT NULL COMMENT 'Inspección Inicial, Periódica, Extraordinaria, Post-mantenimiento',
  `prioridad` varchar(255) NOT NULL,
  `fecha_solicitud` date NOT NULL,
  `fecha_deseada` date DEFAULT NULL COMMENT 'Fecha preferida por el cliente',
  `estado` varchar(255) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_solicitud`),
  KEY `idx_cliente` (`id_cliente`),
  KEY `idx_ascensor` (`id_ascensor`),
  CONSTRAINT `fk_solicitud_ascensor` FOREIGN KEY (`id_ascensor`) REFERENCES `ascensor` (`id_ascensor`),
  CONSTRAINT `fk_solicitud_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud`
--

LOCK TABLES `solicitud` WRITE;
/*!40000 ALTER TABLE `solicitud` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitud` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `id_rol` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `correo` varchar(120) NOT NULL,
  `contrasena_encriptada` varbinary(255) DEFAULT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `tipo_documento` varchar(10) DEFAULT NULL COMMENT 'CC, NIT, PPE, CE',
  `documento_identidad` varchar(255) DEFAULT NULL,
  `razon_social` varchar(255) DEFAULT NULL,
  `nit` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `estado` varchar(255) NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_sesion` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `idx_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_ascensor`
--

DROP TABLE IF EXISTS `usuario_ascensor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_ascensor` (
  `id_usuario_ascensor` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL COMMENT 'Inspector o técnico',
  `id_ascensor` int(11) NOT NULL,
  `tipo_asignacion` varchar(255) NOT NULL,
  `fecha_asignacion` date NOT NULL,
  `fecha_desasignacion` date DEFAULT NULL,
  `observaciones` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id_usuario_ascensor`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_ascensor` (`id_ascensor`),
  CONSTRAINT `fk_usuarioascensor_ascensor` FOREIGN KEY (`id_ascensor`) REFERENCES `ascensor` (`id_ascensor`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuarioascensor_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_ascensor`
--

LOCK TABLES `usuario_ascensor` WRITE;
/*!40000 ALTER TABLE `usuario_ascensor` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_ascensor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vista_resumen_inspecciones`
--

DROP TABLE IF EXISTS `vista_resumen_inspecciones`;
/*!50001 DROP VIEW IF EXISTS `vista_resumen_inspecciones`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_resumen_inspecciones` AS SELECT 
 1 AS `id_inspeccion`,
 1 AS `codigo_ascensor`,
 1 AS `marca`,
 1 AS `modelo`,
 1 AS `tipo_ascensor`,
 1 AS `ciudad`,
 1 AS `nombre_inspector`,
 1 AS `nombre_cliente`,
 1 AS `tipo_servicio`,
 1 AS `prioridad`,
 1 AS `fecha_programada`,
 1 AS `hora_inicio`,
 1 AS `fecha_inicio`,
 1 AS `fecha_fin`,
 1 AS `duracion_minutos`,
 1 AS `estado_inspeccion`,
 1 AS `numero_informe`,
 1 AS `estado_informe`,
 1 AS `concepto_tecnico`,
 1 AS `total_items_evaluados`,
 1 AS `items_cumplen`,
 1 AS `items_no_cumplen`,
 1 AS `items_no_aplican`,
 1 AS `total_fotografias`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_usuarios_segura`
--

DROP TABLE IF EXISTS `vista_usuarios_segura`;
/*!50001 DROP VIEW IF EXISTS `vista_usuarios_segura`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_usuarios_segura` AS SELECT 
 1 AS `id_usuario`,
 1 AS `id_rol`,
 1 AS `nombre_completo`,
 1 AS `correo`,
 1 AS `telefono`,
 1 AS `tipo_documento`,
 1 AS `documento_identidad`,
 1 AS `razon_social`,
 1 AS `nit`,
 1 AS `direccion`,
 1 AS `estado`,
 1 AS `fecha_registro`,
 1 AS `ultima_sesion`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'liftsafe_db'
--

--
-- Dumping routines for database 'liftsafe_db'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_inspecciones_por_inspector` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_inspecciones_por_inspector`(IN `p_id_inspector` INT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM usuario 
        WHERE id_usuario = p_id_inspector
    ) THEN
        SELECT 'Error: Inspector no encontrado' AS mensaje;
    ELSE
        -- Resumen del inspector
        SELECT 
            u.id_usuario,
            u.nombre_completo AS nombre_inspector,
            r.nombre_rol,
            COUNT(DISTINCT i.id_inspeccion) AS total_inspecciones,
            SUM(CASE WHEN i.estado IN ('Aprobada','Finalizada','finalizada') THEN 1 ELSE 0 END) AS inspecciones_finalizadas,
            SUM(CASE WHEN i.estado IN ('Borrador','En Proceso') THEN 1 ELSE 0 END) AS inspecciones_pendientes
        FROM usuario u
        INNER JOIN rol r ON u.id_rol = r.id_rol
        LEFT JOIN inspeccion i ON i.id_inspector = u.id_usuario
        WHERE u.id_usuario = p_id_inspector
        GROUP BY u.id_usuario, u.nombre_completo, r.nombre_rol;

        -- Detalle de cada inspeccion
        SELECT 
            i.id_inspeccion,
            a.codigo_interno AS codigo_ascensor,
            a.marca,
            a.modelo,
            a.tipo_ascensor,
            u_cliente.nombre_completo AS cliente,
            a.direccion_completa,
            a.ciudad,
            p.fecha_programada,
            i.fecha_inicio,
            i.fecha_fin,
            i.duracion_minutos,
            i.estado,
            i.observaciones_generales,
            inf.numero_informe,
            inf.estado AS estado_informe,
            inf.concepto_tecnico,
            COUNT(DISTINCT dc.id_detalle) AS items_evaluados,
            SUM(CASE WHEN dc.resultado = 'No Cumple' THEN 1 ELSE 0 END) AS hallazgos,
            COUNT(DISTINCT f.id_foto) AS fotografias
        FROM inspeccion i
        INNER JOIN ascensor a ON i.id_ascensor = a.id_ascensor
        INNER JOIN usuario u_cliente ON a.id_cliente = u_cliente.id_usuario
        INNER JOIN programacion p ON i.id_programacion = p.id_programacion
        LEFT JOIN informe inf ON inf.id_inspeccion = i.id_inspeccion
        LEFT JOIN detalle_checklist dc ON dc.id_inspeccion = i.id_inspeccion
        LEFT JOIN fotografia f ON f.id_informe = inf.id_informe
        WHERE i.id_inspector = p_id_inspector
        GROUP BY 
            i.id_inspeccion, a.codigo_interno, a.marca, a.modelo,
            a.tipo_ascensor, u_cliente.nombre_completo,
            a.direccion_completa, a.ciudad, p.fecha_programada,
            i.fecha_inicio, i.fecha_fin, i.duracion_minutos,
            i.estado, i.observaciones_generales, inf.numero_informe,
            inf.estado, inf.concepto_tecnico
        ORDER BY p.fecha_programada DESC;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_listar_inspecciones_por_estado` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_listar_inspecciones_por_estado`(
    IN p_estado VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    SELECT 
        i.id_inspeccion,
        a.codigo_interno AS codigo_ascensor,
        a.marca,
        a.modelo,
        u.nombre_completo AS inspector,
        i.fecha_inicio,
        i.fecha_fin,
        i.estado,
        i.observaciones_generales
    FROM inspeccion i
    INNER JOIN ascensor a ON i.id_ascensor = a.id_ascensor
    INNER JOIN usuario u ON i.id_inspector = u.id_usuario
    WHERE i.estado COLLATE utf8mb4_unicode_ci = p_estado COLLATE utf8mb4_unicode_ci
    ORDER BY i.fecha_inicio DESC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vista_resumen_inspecciones`
--

/*!50001 DROP VIEW IF EXISTS `vista_resumen_inspecciones`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_resumen_inspecciones` AS select `i`.`id_inspeccion` AS `id_inspeccion`,`a`.`codigo_interno` AS `codigo_ascensor`,`a`.`marca` AS `marca`,`a`.`modelo` AS `modelo`,`a`.`tipo_ascensor` AS `tipo_ascensor`,`a`.`ciudad` AS `ciudad`,`u_inspector`.`nombre_completo` AS `nombre_inspector`,`u_cliente`.`nombre_completo` AS `nombre_cliente`,`s`.`tipo_servicio` AS `tipo_servicio`,`s`.`prioridad` AS `prioridad`,`p`.`fecha_programada` AS `fecha_programada`,`p`.`hora_inicio` AS `hora_inicio`,`i`.`fecha_inicio` AS `fecha_inicio`,`i`.`fecha_fin` AS `fecha_fin`,`i`.`duracion_minutos` AS `duracion_minutos`,`i`.`estado` AS `estado_inspeccion`,`inf`.`numero_informe` AS `numero_informe`,`inf`.`estado` AS `estado_informe`,`inf`.`concepto_tecnico` AS `concepto_tecnico`,count(distinct `dc`.`id_detalle`) AS `total_items_evaluados`,sum(case when `dc`.`resultado` = 'Cumple' then 1 else 0 end) AS `items_cumplen`,sum(case when `dc`.`resultado` = 'No Cumple' then 1 else 0 end) AS `items_no_cumplen`,sum(case when `dc`.`resultado` = 'No Aplica' then 1 else 0 end) AS `items_no_aplican`,count(distinct `f`.`id_foto`) AS `total_fotografias` from ((((((((`inspeccion` `i` join `ascensor` `a` on(`i`.`id_ascensor` = `a`.`id_ascensor`)) join `usuario` `u_inspector` on(`i`.`id_inspector` = `u_inspector`.`id_usuario`)) join `usuario` `u_cliente` on(`a`.`id_cliente` = `u_cliente`.`id_usuario`)) join `programacion` `p` on(`i`.`id_programacion` = `p`.`id_programacion`)) join `solicitud` `s` on(`i`.`id_solicitud` = `s`.`id_solicitud`)) left join `informe` `inf` on(`inf`.`id_inspeccion` = `i`.`id_inspeccion`)) left join `detalle_checklist` `dc` on(`dc`.`id_inspeccion` = `i`.`id_inspeccion`)) left join `fotografia` `f` on(`f`.`id_informe` = `inf`.`id_informe`)) group by `i`.`id_inspeccion`,`a`.`codigo_interno`,`a`.`marca`,`a`.`modelo`,`a`.`tipo_ascensor`,`a`.`ciudad`,`u_inspector`.`nombre_completo`,`u_cliente`.`nombre_completo`,`s`.`tipo_servicio`,`s`.`prioridad`,`p`.`fecha_programada`,`p`.`hora_inicio`,`i`.`fecha_inicio`,`i`.`fecha_fin`,`i`.`duracion_minutos`,`i`.`estado`,`inf`.`numero_informe`,`inf`.`estado`,`inf`.`concepto_tecnico` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_usuarios_segura`
--

/*!50001 DROP VIEW IF EXISTS `vista_usuarios_segura`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_usuarios_segura` AS select `usuario`.`id_usuario` AS `id_usuario`,`usuario`.`id_rol` AS `id_rol`,`usuario`.`nombre_completo` AS `nombre_completo`,`usuario`.`correo` AS `correo`,`usuario`.`telefono` AS `telefono`,`usuario`.`tipo_documento` AS `tipo_documento`,`usuario`.`documento_identidad` AS `documento_identidad`,`usuario`.`razon_social` AS `razon_social`,`usuario`.`nit` AS `nit`,`usuario`.`direccion` AS `direccion`,`usuario`.`estado` AS `estado`,`usuario`.`fecha_registro` AS `fecha_registro`,`usuario`.`ultima_sesion` AS `ultima_sesion` from `usuario` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-02 14:48:23

-- ------------------------------------------------------------------
-- Tablas agregadas después del dump original (antes estaban solo en
-- liftsafe-backend/migrations/). Sin ellas la campana de notificaciones
-- y las encuestas dan error 500 en una instalación nueva.
-- ------------------------------------------------------------------


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


ALTER TABLE `fotografia` MODIFY `id_informe` int(11) NULL;
ALTER TABLE `fotografia` ADD COLUMN `id_inspeccion` int(11) NULL COMMENT 'Inspección donde se tomó la foto' AFTER `id_informe`;
ALTER TABLE `fotografia` ADD KEY `idx_fotografia_inspeccion` (`id_inspeccion`);
ALTER TABLE `fotografia` ADD CONSTRAINT `fk_fotografia_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE;
UPDATE `fotografia` f JOIN `informe` i ON i.id_informe = f.id_informe SET f.id_inspeccion = i.id_inspeccion WHERE f.id_inspeccion IS NULL;

-- Checklist según la estructura de la NTC 5926-1:2012 (numeral 6, grupos 6.1 a 6.11).
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

-- RF-008: observaciones ligadas a la inspección
ALTER TABLE `observacion` MODIFY `id_informe` int(11) NULL;
ALTER TABLE `observacion` ADD COLUMN `id_inspeccion` int(11) NULL AFTER `id_informe`;
ALTER TABLE `observacion` ADD KEY `idx_observacion_inspeccion` (`id_inspeccion`);
ALTER TABLE `observacion` ADD CONSTRAINT `fk_observacion_inspeccion` FOREIGN KEY (`id_inspeccion`) REFERENCES `inspeccion` (`id_inspeccion`) ON DELETE CASCADE;
UPDATE `observacion` o JOIN `informe` i ON i.id_informe = o.id_informe SET o.id_inspeccion = i.id_inspeccion WHERE o.id_inspeccion IS NULL;

-- RNF-012: el log de auditoría es inmutable (no se puede modificar ni borrar).
-- Se puede ejecutar varias veces.
DROP TRIGGER IF EXISTS `auditoria_no_modificar`;
CREATE TRIGGER `auditoria_no_modificar` BEFORE UPDATE ON `auditoria` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El log de auditoria es inmutable: no se puede modificar';
DROP TRIGGER IF EXISTS `auditoria_no_borrar`;
CREATE TRIGGER `auditoria_no_borrar` BEFORE DELETE ON `auditoria` FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El log de auditoria es inmutable: no se puede borrar';

-- RNF-003: espacio para los datos cifrados con AES-256-GCM.
-- La conversión de las contraseñas y firmas existentes la hace run_migration.py
-- (la aplicación igual lee el formato anterior mientras tanto).
ALTER TABLE `usuario` MODIFY `contrasena_encriptada` VARBINARY(512) NULL;
ALTER TABLE `inspeccion` MODIFY `firma_inspector` MEDIUMTEXT NULL;
ALTER TABLE `inspeccion` MODIFY `firma_cliente` MEDIUMTEXT NULL;


-- ===== migraciones del proyecto aplicadas sobre el dump =====