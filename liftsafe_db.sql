CREATE DATABASE  IF NOT EXISTS `liftsafe_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `liftsafe_db`;
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
INSERT INTO `ascensor` VALUES (1,11,'ASC-001','Schindler','5500','OT-2020-001','Pasajeros',750,10,12,2,'Torre A - Lobby','Calle 123 #45-67','Bogota','Activo','2022-06-15','2026-03-08 20:49:47','2026-06-07 20:56:55'),(2,11,'ASC-002','Schindler','3300 MRL','SC-2019-002','Pasajeros',630,8,10,1,'Torre B - Costado norte','Calle 120 #15-88','Bogotá','Activo','2019-07-20','2026-03-08 20:49:47','2026-03-08 20:49:47'),(3,12,'ASC-003','KONE','MonoSpace','KN-2021-003','Pasajeros',1000,13,15,1.75,'Edificio principal lobby','Carrera 11 #93-40','Bogotá','Activo','2021-01-10','2026-03-08 20:49:47','2026-03-08 20:49:47'),(4,12,'ASC-004','ThyssenKrupp','Evolution','TK-2018-004','Carga',2000,0,8,0.5,'Sótano - zona de cargue','Carrera 11 #93-40','Bogotá','Activo','2018-11-05','2026-03-08 20:49:47','2026-03-08 20:49:47'),(5,13,'ASC-005','Mitsubishi','NEXIEZ-MRL','MT-2022-005','Pasajeros',800,11,14,1.6,'Bloque 1 - acceso principal','Calle 85 #13-22','Bogotá','Activo','2022-04-18','2026-03-08 20:49:47','2026-03-08 20:49:47'),(6,13,'ASC-006','Otis','GeN2-Comfort','OT-2020-006','Pasajeros',630,8,14,1,'Bloque 2 - ala sur','Calle 85 #13-22','Bogotá','Inactivo','2020-09-30','2026-03-08 20:49:47','2026-03-08 20:49:47'),(7,14,'ASC-007','Schindler','5500','SC-2021-007','Pasajeros',1000,13,20,2,'Torre Norte - núcleo','Carrera 9 #150-60','Bogotá','Activo','2021-06-14','2026-03-08 20:49:47','2026-03-08 20:49:47'),(8,14,'ASC-008','KONE','EcoSpace','KN-2019-008','Pasajeros',750,10,20,1.75,'Torre Sur - núcleo','Carrera 9 #150-60','Bogotá','Activo','2019-03-22','2026-03-08 20:49:47','2026-03-08 20:49:47'),(9,15,'ASC-009','Fujitec','GLVF-II','FJ-2020-009','Pasajeros',800,11,16,1.5,'Bloque residencial A','Calle 170 #8-40','Bogotá','Activo','2020-12-01','2026-03-08 20:49:47','2026-03-08 20:49:47'),(10,15,'ASC-010','Hyundai','NEXEN-MRL','HY-2018-010','Montacamillas',300,4,8,0.4,'Zona médica - camillas','Calle 170 #8-40','Bogotá','Activo','2018-05-17','2026-03-08 20:49:47','2026-03-08 20:49:47'),(11,16,'ASC-011','Otis','Gen2-Life','OT-2023-011','Pasajeros',630,8,12,1,'Lobby principal','Carrera 14 #60-55','Bogotá','Activo','2023-02-28','2026-03-08 20:49:47','2026-03-08 20:49:47'),(12,16,'ASC-012','ThyssenKrupp','Synergy','TK-2021-012','Carga',3000,0,6,0.3,'Zona comercial - cargue','Carrera 14 #60-55','Bogotá','Activo','2021-08-10','2026-03-08 20:49:47','2026-03-08 20:49:47'),(13,17,'ASC-013','KONE','TranSys','KN-2022-013','Pasajeros',1000,13,18,1.75,'Torre Río - acceso este','Calle 110 #20-30','Bogotá','Activo','2022-07-05','2026-03-08 20:49:47','2026-03-08 20:49:47'),(14,17,'ASC-014','Schindler','6300','SC-2020-014','Pasajeros',800,11,18,1.6,'Torre Río - acceso oeste','Calle 110 #20-30','Bogotá','Activo','2020-11-19','2026-03-08 20:49:47','2026-03-08 20:49:47'),(15,18,'ASC-015','Mitsubishi','ELENESSA','MT-2019-015','Pasajeros',750,10,10,1.5,'Conjunto - bloque central','Carrera 70 #45-20','Bogotá','Activo','2019-04-07','2026-03-08 20:49:47','2026-03-08 20:49:47'),(16,18,'ASC-016','Fujitec','GLVF-II','FJ-2023-016','Pasajeros',630,8,10,1,'Conjunto - bloque norte','Carrera 70 #45-20','Bogotá','Inactivo','2023-01-15','2026-03-08 20:49:47','2026-03-08 20:49:47'),(17,19,'ASC-017','Hyundai','LUXEN','HY-2021-017','Pasajeros',1000,13,22,2,'Parque Central - Torre 1','Calle 50 #30-45','Bogotá','Activo','2021-10-08','2026-03-08 20:49:47','2026-03-08 20:49:47'),(18,19,'ASC-018','Otis','Gen2-MRL','OT-2022-018','Pasajeros',800,11,22,1.75,'Parque Central - Torre 2','Calle 50 #30-45','Bogotá','Activo','2022-03-21','2026-03-08 20:49:47','2026-03-08 20:49:47'),(19,20,'ASC-019','KONE','MonoSpace','KN-2020-019','Pasajeros',750,10,17,1.5,'Valle PH - Torre Principal','Carrera 80 #25-90','Bogotá','Activo','2020-06-30','2026-03-08 20:49:47','2026-03-08 20:49:47'),(20,20,'ASC-020','Schindler','3300 MRL','SC-2018-020','Carga',1500,0,5,0.4,'Valle PH - Zona servicios','Carrera 80 #25-90','Bogotá','Activo','2018-08-12','2026-03-08 20:49:47','2026-03-08 20:49:47'),(25,35,'ASC-TN-101','Schindler','5500 MRL','SCH-2023-001234','Pasajeros',1000,13,22,2,'Torre Norte - Núcleo','Carrera 9 #150-60, Bogotá','Bogotá','Activo','2023-06-15','2026-04-06 12:43:16','2026-04-06 12:43:16'),(26,11,'ASC-099','Otis','Gen2','OT-2025-099','Pasajeros',750,10,8,1.2,'Torre C - Lobby','Calle 120 #15-88','Bogotá','Activo','2025-01-10','2026-04-09 02:03:07','2026-04-09 02:03:07');
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
INSERT INTO `auditoria` VALUES (1,1,'usuario','LOGIN',1,NULL,'{\"session\":\"iniciada\"}','192.168.1.10','Mozilla/5.0 Windows Chrome/120','2025-01-10 13:00:00'),(2,1,'rol','INSERT',1,NULL,'{\"nombre_rol\":\"Administrador\"}','192.168.1.10','Mozilla/5.0 Windows Chrome/120','2025-01-10 13:05:00'),(3,1,'usuario','INSERT',2,NULL,'{\"nombre\":\"Laura Andrea Gomez\",\"rol\":\"Director Tecnico\"}','192.168.1.10','Mozilla/5.0 Windows Chrome/120','2025-01-11 13:30:00'),(4,1,'usuario','INSERT',4,NULL,'{\"nombre\":\"Andres Felipe Martinez\",\"rol\":\"Inspector\"}','192.168.1.10','Mozilla/5.0 Windows Chrome/120','2025-01-13 12:45:00'),(5,3,'ascensor','INSERT',1,NULL,'{\"codigo\":\"ASC-001\",\"marca\":\"Otis\",\"cliente_id\":11}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2025-01-20 14:15:00'),(6,3,'solicitud','INSERT',1,NULL,'{\"tipo_servicio\":\"Inspeccion Periodica\",\"estado\":\"Programada\",\"ascensor_id\":1}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2025-01-15 15:00:00'),(7,3,'programacion','INSERT',1,NULL,'{\"fecha_programada\":\"2025-01-25\",\"inspector_id\":4,\"estado\":\"Programada\"}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2025-01-16 16:00:00'),(8,5,'usuario','LOGIN',5,NULL,'{\"session\":\"iniciada\"}','192.168.1.50','Mozilla/5.0 Android Chrome/120','2025-01-22 14:00:00'),(9,5,'inspeccion','INSERT',2,NULL,'{\"estado\":\"Borrador\",\"ascensor_id\":2,\"inspector_id\":5}','192.168.1.50','Mozilla/5.0 Android Chrome/120','2025-01-22 14:05:00'),(10,5,'inspeccion','UPDATE',2,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobada\",\"fecha_fin\":\"2025-01-22 10:55:00\"}','192.168.1.50','Mozilla/5.0 Android Chrome/120','2025-01-22 15:55:00'),(11,5,'informe','INSERT',2,NULL,'{\"numero_informe\":\"INF-2025-002\",\"estado\":\"Borrador\"}','192.168.1.50','Mozilla/5.0 Android Chrome/120','2025-01-22 16:00:00'),(12,3,'informe','UPDATE',2,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobado\",\"fecha_aprobacion\":\"2025-01-23 14:00:00\"}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2025-01-23 19:00:00'),(13,4,'usuario','LOGIN',4,NULL,'{\"session\":\"iniciada\"}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 12:00:00'),(14,4,'inspeccion','INSERT',4,NULL,'{\"estado\":\"Borrador\",\"ascensor_id\":4,\"inspector_id\":4}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 12:05:00'),(15,4,'detalle_checklist','INSERT',9,NULL,'{\"resultado\":\"No Cumple\",\"item_id\":9,\"inspeccion_id\":4}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 12:45:00'),(16,2,'informe','UPDATE',4,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobado con observaciones\",\"id_revisor\":2}','192.168.1.20','Mozilla/5.0 Windows Chrome/120','2025-01-25 15:00:00'),(17,8,'usuario','LOGIN',8,NULL,'{\"session\":\"iniciada\"}','192.168.1.80','Mozilla/5.0 Android Chrome/120','2025-02-05 11:30:00'),(18,8,'inspeccion','INSERT',10,NULL,'{\"estado\":\"Borrador\",\"ascensor_id\":10,\"inspector_id\":8}','192.168.1.80','Mozilla/5.0 Android Chrome/120','2025-02-05 11:35:00'),(19,8,'inspeccion','UPDATE',10,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobada\",\"fecha_fin\":\"2025-02-05 07:55:00\"}','192.168.1.80','Mozilla/5.0 Android Chrome/120','2025-02-05 12:55:00'),(20,8,'usuario','LOGOUT',8,'{\"session\":\"activa\"}','{\"session\":\"cerrada\"}','192.168.1.80','Mozilla/5.0 Android Chrome/120','2025-02-05 13:20:00'),(22,4,'inspeccion','INSERT',4,NULL,'{\"estado\":\"Borrador\",\"ascensor_id\":4,\"inspector_id\":4}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 12:05:00'),(23,4,'detalle_checklist','INSERT',9,NULL,'{\"resultado\":\"No Cumple\",\"item_id\":9,\"inspeccion_id\":4}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 12:20:00'),(24,4,'detalle_checklist','INSERT',10,NULL,'{\"resultado\":\"No Cumple\",\"item_id\":10,\"inspeccion_id\":4}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 12:38:00'),(25,4,'inspeccion','UPDATE',4,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobada\",\"fecha_fin\":\"2025-01-24 08:50:00\"}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2025-01-24 13:55:00'),(26,2,'informe','UPDATE',4,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobado con observaciones\",\"id_revisor\":2}','192.168.1.20','Mozilla/5.0 Windows Chrome/120','2025-01-25 15:00:00'),(27,6,'usuario','LOGIN',6,NULL,'{\"session\":\"iniciada\"}','192.168.1.60','Mozilla/5.0 Android Chrome/120','2025-02-01 13:25:00'),(28,6,'inspeccion','INSERT',3,NULL,'{\"estado\":\"Borrador\",\"ascensor_id\":3,\"inspector_id\":6}','192.168.1.60','Mozilla/5.0 Android Chrome/120','2025-02-01 13:30:00'),(29,8,'usuario','LOGIN',8,NULL,'{\"session\":\"iniciada\"}','192.168.1.80','Mozilla/5.0 Android Chrome/120','2025-02-05 11:30:00'),(30,8,'inspeccion','UPDATE',10,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobada\",\"fecha_fin\":\"2025-02-05 07:55:00\"}','192.168.1.80','Mozilla/5.0 Android Chrome/120','2025-02-05 12:58:00'),(31,2,'informe','UPDATE',10,'{\"estado\":\"Borrador\"}','{\"estado\":\"Aprobado\",\"fecha_aprobacion\":\"2025-02-06 09:00:00\"}','192.168.1.20','Mozilla/5.0 Windows Chrome/120','2025-02-06 14:00:00'),(32,3,'solicitud','INSERT',22,NULL,'{\"tipo_servicio\":\"Inspeccion Periodica\",\"estado\":\"Aprobada\",\"ascensor_id\":25}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2026-04-06 17:45:00'),(33,4,'usuario','LOGIN',4,NULL,'{\"session\":\"iniciada\"}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2026-04-06 12:50:00'),(34,4,'inspeccion','INSERT',28,NULL,'{\"estado\":\"Borrador\",\"ascensor_id\":25,\"inspector_id\":4}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2026-04-06 12:54:00'),(35,4,'detalle_checklist','INSERT',23,NULL,'{\"resultado\":\"No Cumple\",\"item_id\":3,\"inspeccion_id\":28}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2026-04-06 13:08:00'),(36,4,'inspeccion','UPDATE',28,'{\"estado\":\"Borrador\"}','{\"estado\":\"Finalizada\",\"fecha_fin\":\"2026-04-06 08:04:22\"}','192.168.1.40','Mozilla/5.0 Android Chrome/120','2026-04-06 13:05:00'),(37,3,'informe','INSERT',28,NULL,'{\"numero_informe\":\"INF-2026-028\",\"estado\":\"Pendiente Revision\"}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2026-04-06 14:30:00'),(38,1,'usuario','LOGIN',1,NULL,'{\"session\":\"iniciada\"}','192.168.1.10','Mozilla/5.0 Windows Chrome/120','2026-06-01 13:00:00'),(39,1,'usuario','INSERT',36,NULL,'{\"nombre\":\"Nuevo Inspector\",\"rol\":\"Inspector\"}','192.168.1.10','Mozilla/5.0 Windows Chrome/120','2026-06-01 13:15:00'),(40,3,'ascensor','UPDATE',1,'{\"estado\":\"Activo\",\"tipo_ascensor\":\"Electrico\"}','{\"estado\":\"Activo\",\"tipo_ascensor\":\"Pasajeros\"}','192.168.1.30','Mozilla/5.0 Windows Chrome/120','2026-06-08 01:56:55');
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
INSERT INTO `detalle_checklist` VALUES (1,2,1,'Cumple','Puerta del cuarto de máquinas con cerradura, señal de peligro eléctrico y aviso de acceso restringido visible.',NULL,'2026-03-08 23:38:44'),(2,2,2,'Cumple','Iluminación del foso operativa. Interruptor ubicado en la parte superior de la escalera de acceso. Medición: 65 lux.',NULL,'2026-03-08 23:38:44'),(3,2,3,'Cumple','Intercomunicador bidireccional operativo. Se realizó prueba de llamada hacia portería con respuesta inmediata.',NULL,'2026-03-08 23:38:44'),(4,2,4,'Cumple','Enclavamientos mecánicos y eléctricos verificados en los 10 pisos. Ninguna puerta abrió con cabina fuera del nivel.',NULL,'2026-03-08 23:38:44'),(5,2,5,'Cumple','Cables de tracción sin hilos rotos. Lubricación adecuada y uniforme. Sin corrosión visible en ningún ramal.',NULL,'2026-03-08 23:38:44'),(6,4,6,'Cumple','Limitador de velocidad con sello de calibración vigente hasta noviembre 2025. Prueba de disparo exitosa.',NULL,'2026-03-08 23:38:44'),(7,4,7,'Cumple','Tablero eléctrico con todos los circuitos identificados. Protecciones termomagnéticas en buen estado. Sin conexiones improvisadas.',NULL,'2026-03-08 23:38:44'),(8,4,8,'Cumple','Licencia de operación vigente. Copia disponible en cuarto de máquinas y en poder del administrador del edificio.',NULL,'2026-03-08 23:38:44'),(9,4,9,'No Cumple','Guías de contrapeso presentan oxidación superficial en tramo entre pisos 3 y 5. No afecta funcionamiento actual pero requiere atención.','Aplicar tratamiento anticorrosivo y lubricación en guías afectadas. Plazo recomendado: 15 días.','2026-03-08 23:38:44'),(10,4,10,'No Cumple','Se evidenció fuga de aceite menor en la tubería de retorno del grupo hidráulico. Mancha de aceite en piso del foso.','Reemplazar empaque de tubería de retorno. Limpiar derrame. Plazo: inmediato antes de próxima operación.','2026-03-08 23:38:44'),(11,5,11,'Cumple','Luz de emergencia autónoma probada. Se activó correctamente al simular corte de energía. Autonomía estimada mayor a 1 hora.',NULL,'2026-03-08 23:38:44'),(12,5,12,'Cumple','Alarma sonora de emergencia operativa. Botón en cabina activa señal audible en portería y cuarto de máquinas.',NULL,'2026-03-08 23:38:44'),(13,5,13,'Cumple','Amortiguadores hidráulicos de cabina y contrapeso en buen estado. Sin fugas, sin deformaciones. Nivel de aceite correcto.',NULL,'2026-03-08 23:38:44'),(14,5,14,'Cumple','Recinto del ascensor completamente cerrado. Sin aberturas no autorizadas en paredes ni puertas del hueco.',NULL,'2026-03-08 23:38:44'),(15,5,15,'No Cumple','Cuadro de maniobra presenta relé auxiliar con conector flojo en tarjeta de control. Posible causa de paradas intermitentes reportadas.','Asegurar conector del relé auxiliar y verificar continuidad. Revisar historial de fallas. Plazo: antes de finalizar inspección.','2026-03-08 23:38:44'),(16,10,16,'Cumple','Freno electromagnético verificado bajo carga nominal de 300 kg. Sin deslizamiento al cortar corriente. Acción eficaz confirmada.',NULL,'2026-03-08 23:38:44'),(17,10,17,'Cumple','Velocidad medida en recorrido nominal: 0.38 m/s. Velocidad nominal declarada: 0.40 m/s. Diferencia del 5%, dentro del rango.',NULL,'2026-03-08 23:38:44'),(18,10,18,'Cumple','Guardas de polea de tracción y polea de desvío instaladas y fijas. No presentan daños ni desplazamientos.',NULL,'2026-03-08 23:38:44'),(19,10,19,'Cumple','Nivelación verificada en los 8 pisos. Diferencia máxima registrada de 6 mm en piso 4. Dentro del límite de ±10 mm.',NULL,'2026-03-08 23:38:44'),(20,10,20,'No Cumple','Registro de mantenimiento desactualizado. Última anotación con fecha de hace 4 meses. Falta registro de intervención de agosto.','Actualizar el libro de mantenimiento con todas las intervenciones realizadas. Responsable: empresa de mantenimiento contratada. Plazo: 5 días.','2026-03-08 23:38:44'),(22,28,1,'Cumple','Puerta con cerradura, señal de peligro eléctrico visible',NULL,'2026-04-06 13:00:03'),(23,28,4,'No Cumple','Intercomunicador no funciona, no hay respuesta desde portería','Reparar o reemplazar el sistema de comunicación antes de 15 días','2026-04-06 13:00:03'),(24,28,5,'Cumple','Cables sin hilos rotos, lubricación adecuada',NULL,'2026-04-06 13:00:03'),(25,28,16,'Cumple','Freno probado bajo carga nominal, sin deslizamiento',NULL,'2026-04-06 13:00:03'),(26,2,6,'Cumple','Limitador de velocidad con sello de calibracion vigente hasta diciembre 2025. Prueba de disparo exitosa.',NULL,'2025-01-22 14:50:00'),(27,2,7,'Cumple','Tablero electrico con todos los circuitos identificados. Protecciones termicas en buen estado. Sin conexiones improvisadas.',NULL,'2025-01-22 14:55:00'),(28,2,8,'Cumple','Licencia de operacion vigente. Copia disponible en cuarto de maquinas y con el administrador.',NULL,'2025-01-22 15:05:00'),(29,2,9,'Cumple','Guias de cabina y contrapeso alineadas correctamente. Sin corrosion ni deformaciones en ningun tramo.',NULL,'2025-01-22 15:10:00'),(30,2,10,'No Aplica','Ascensor electrico de traccion. No cuenta con sistema hidraulico. Item no aplica.',NULL,'2025-01-22 15:12:00'),(31,2,11,'Cumple','Luz de emergencia autonoma operativa. Se activo correctamente al simular corte de energia. Autonomia mayor a 1 hora.',NULL,'2025-01-22 15:15:00'),(32,2,12,'Cumple','Alarma sonora de emergencia operativa. Botón de cabina activa señal audible en porteria y cuarto de maquinas.',NULL,'2025-01-22 15:20:00'),(33,2,13,'Cumple','Amortiguadores hidraulicos de cabina y contrapeso en buen estado. Sin fugas ni deformaciones. Nivel de aceite correcto.',NULL,'2025-01-22 15:22:00'),(34,2,14,'Cumple','Recinto completamente cerrado. Sin aberturas no autorizadas en paredes ni puertas del hueco.',NULL,'2025-01-22 15:24:00'),(35,2,15,'Cumple','Cuadro de maniobra cerrado con llave. Circuitos identificados. Sin componentes sueltos ni quemados.',NULL,'2025-01-22 15:26:00'),(36,2,16,'Cumple','Freno electromagnetico verificado bajo carga nominal. Sin deslizamiento al cortar corriente. Accion eficaz confirmada.',NULL,'2025-01-22 15:28:00'),(37,2,17,'Cumple','Velocidad medida: 0.97 m/s. Velocidad nominal: 1.00 m/s. Diferencia del 3%. Dentro del rango permitido.',NULL,'2025-01-22 15:30:00'),(38,2,18,'Cumple','Guardas de polea de traccion y desvio instaladas y fijas. Sin danos ni desplazamientos.',NULL,'2025-01-22 15:33:00'),(39,2,19,'Cumple','Nivelacion verificada en los 10 pisos. Diferencia maxima de 5 mm en piso 7. Dentro del limite de 10 mm.',NULL,'2025-01-22 15:36:00'),(40,2,20,'Cumple','Plan de mantenimiento preventivo al dia. Todas las intervenciones registradas con firma del tecnico responsable.',NULL,'2025-01-22 15:40:00'),(41,4,1,'Cumple','Puerta del cuarto de maquinas con cerradura, senial de peligro electrico y aviso de acceso restringido.',NULL,'2025-01-24 12:10:00'),(42,4,2,'Cumple','Iluminacion del foso operativa. Interruptor accesible desde la parte superior. Medicion: 58 lux.',NULL,'2025-01-24 12:15:00'),(43,4,3,'Cumple','Intercomunicador operativo. Prueba de llamada hacia porteria con respuesta inmediata confirmada.',NULL,'2025-01-24 12:18:00'),(44,4,4,'Cumple','Enclavamientos de puertas de rellano verificados en los 8 pisos. Ningun apertura con cabina fuera de nivel.',NULL,'2025-01-24 12:20:00'),(45,4,5,'Cumple','Cables de traccion de ascensor de carga sin hilos rotos. Lubricacion uniforme. Sin corrosion visible.',NULL,'2025-01-24 12:30:00'),(46,4,11,'Cumple','Luz de emergencia autonoma operativa. Activacion inmediata al simular corte de energia.',NULL,'2025-01-24 13:00:00'),(47,4,12,'Cumple','Alarma sonora operativa desde cabina de carga. Senial audible en cuarto de maquinas y porteria.',NULL,'2025-01-24 13:05:00'),(48,4,13,'Cumple','Amortiguadores de cabina y contrapeso en buen estado. Sin fugas de aceite ni deformaciones.',NULL,'2025-01-24 13:08:00'),(49,4,14,'Cumple','Recinto cerrado correctamente. Sin aberturas no autorizadas. Acceso de emergencia señalizado.',NULL,'2025-01-24 13:10:00'),(50,4,15,'Cumple','Cuadro de maniobra cerrado con llave. Todos los circuitos identificados. Sin componentes danados.',NULL,'2025-01-24 13:12:00'),(51,4,16,'Cumple','Freno electromagnetico de carga verificado con 2000 kg. Sin deslizamiento al cortar corriente.',NULL,'2025-01-24 13:15:00'),(52,4,17,'Cumple','Velocidad medida: 0.48 m/s. Velocidad nominal: 0.50 m/s. Diferencia del 4%. Dentro del rango.',NULL,'2025-01-24 13:20:00'),(53,4,18,'Cumple','Guardas de poleas instaladas y fijas. Sin danos ni desplazamientos. Proteccion anti-atrapamiento correcta.',NULL,'2025-01-24 13:25:00'),(54,4,19,'Cumple','Nivelacion verificada en los 8 pisos. Diferencia maxima de 7 mm en piso 3. Dentro del limite.',NULL,'2025-01-24 13:30:00'),(55,4,20,'Cumple','Plan de mantenimiento al dia. Libro de mantenimiento con intervenciones registradas correctamente.',NULL,'2025-01-24 13:35:00'),(104,10,1,'Cumple','Puerta cuarto de maquinas con cerradura y senalizacion visible. Acceso restringido verificado.',NULL,'2025-02-05 11:40:00'),(105,10,2,'Cumple','Iluminacion foso operativa. Medicion: 62 lux. Interruptor accesible desde acceso superior.',NULL,'2025-02-05 11:45:00'),(106,10,3,'Cumple','Intercomunicador de emergencia operativo en cabina montacamillas. Prueba exitosa.',NULL,'2025-02-05 11:55:00'),(107,10,4,'Cumple','Enclavamientos verificados en los 8 pisos. Sin apertura de puertas con cabina fuera de nivel.',NULL,'2025-02-05 12:00:00'),(108,10,5,'Cumple','Cables de traccion sin hilos rotos. Lubricacion adecuada. Sin corrosion visible en ningun ramal.',NULL,'2025-02-05 12:05:00'),(109,10,6,'Cumple','Limitador de velocidad con sello de calibracion vigente. Prueba de disparo satisfactoria.',NULL,'2025-02-05 12:08:00'),(110,10,7,'Cumple','Tablero electrico con circuitos identificados. Sin conexiones improvisadas. Protecciones en buen estado.',NULL,'2025-02-05 12:10:00'),(111,10,8,'Cumple','Licencia de operacion vigente para montacamillas. Disponible en cuarto de maquinas.',NULL,'2025-02-05 12:12:00'),(112,10,9,'No Cumple','Zapatas de guia de cabina con desgaste significativo. Causa identificada del ruido reportado. Reemplazadas in situ.','Zapatas de guia reemplazadas durante la inspeccion. Verificar alineacion en proximo mantenimiento.','2025-02-05 12:15:00'),(113,10,10,'No Aplica','Montacamillas de traccion electrica. No cuenta con sistema hidraulico. Item no aplica.',NULL,'2025-02-05 12:18:00'),(114,10,11,'Cumple','Luz de emergencia autonoma operativa. Activacion correcta al simular corte de energia.',NULL,'2025-02-05 12:20:00'),(115,10,12,'Cumple','Alarma sonora de emergencia operativa. Senial audible desde exterior de cabina confirmada.',NULL,'2025-02-05 12:25:00'),(116,10,13,'Cumple','Amortiguadores en buen estado. Sin fugas de aceite ni deformaciones en cabina ni contrapeso.',NULL,'2025-02-05 12:28:00'),(117,10,14,'Cumple','Recinto cerrado correctamente. Sin aberturas no autorizadas ni accesos no previstos.',NULL,'2025-02-05 12:30:00'),(118,10,15,'Cumple','Cuadro de maniobra cerrado. Circuitos identificados. Sin componentes sueltos ni quemados.',NULL,'2025-02-05 12:32:00'),(135,20,1,'Cumple','Puerta cuarto de maquinas con cerradura y senalizacion correcta. Acceso solo a personal autorizado.',NULL,'2025-02-27 11:08:00'),(136,20,2,'Cumple','Iluminacion foso operativa. Medicion: 70 lux. Interruptor accesible desde acceso principal.',NULL,'2025-02-27 11:12:00'),(137,20,3,'Cumple','Intercomunicador bidireccional operativo. Prueba de llamada hacia porteria con respuesta inmediata.',NULL,'2025-02-27 11:18:00'),(138,20,4,'Cumple','Enclavamientos verificados en los 5 pisos. Sin apertura de puertas con cabina fuera de nivel.',NULL,'2025-02-27 11:20:00'),(139,20,5,'Cumple','Cables de traccion en buen estado. Lubricacion uniforme. Sin hilos rotos ni corrosion.',NULL,'2025-02-27 11:22:00'),(140,20,6,'Cumple','Limitador de velocidad con sello vigente hasta diciembre 2025. Prueba de disparo exitosa.',NULL,'2025-02-27 11:25:00'),(141,20,7,'Cumple','Tablero electrico con circuitos identificados correctamente. Sin conexiones improvisadas.',NULL,'2025-02-27 11:30:00'),(142,20,8,'Cumple','Licencia de operacion vigente para ascensor de servicios. Capacidad 1500 kg certificada.',NULL,'2025-02-27 11:35:00'),(143,20,9,'Cumple','Guias de cabina y contrapeso alineadas. Sin corrosion ni deformaciones en ningún tramo.',NULL,'2025-02-27 11:40:00'),(144,20,10,'No Aplica','Ascensor de traccion electrica. No cuenta con sistema hidraulico. Item no aplica.',NULL,'2025-02-27 11:42:00'),(145,20,11,'Cumple','Luz de emergencia autonoma operativa. Activacion inmediata al simular corte de energia.',NULL,'2025-02-27 11:44:00'),(146,20,12,'Cumple','Alarma sonora operativa. Senial audible desde exterior de cabina en prueba realizada.',NULL,'2025-02-27 11:46:00'),(147,20,14,'Cumple','Recinto cerrado correctamente. Sin aberturas no autorizadas en paredes del hueco.',NULL,'2025-02-27 11:52:00'),(148,20,15,'Cumple','Cuadro de maniobra cerrado. Circuitos identificados. Sin componentes sueltos ni quemados.',NULL,'2025-02-27 11:55:00'),(149,20,16,'Cumple','Freno electromagnetico verificado bajo carga nominal 1500 kg. Sin deslizamiento. Accion eficaz.',NULL,'2025-02-27 12:12:00'),(150,20,18,'Cumple','Guardas de poleas instaladas y fijas. Sin danos ni desplazamientos. Estado correcto.',NULL,'2025-02-27 12:16:00'),(152,20,13,'Cumple','Amortiguadores hidraulicos de cabina y contrapeso en buen estado. Sin fugas ni deformaciones. Nivel de aceite correcto.',NULL,'2025-02-27 16:48:00'),(153,20,17,'Cumple','Velocidad medida en recorrido nominal: 0.39 m/s. Velocidad nominal declarada: 0.40 m/s. Diferencia del 2.5%. Dentro del rango.',NULL,'2025-02-27 17:00:00'),(154,20,19,'Cumple','Nivelacion verificada en los 5 pisos. Diferencia maxima de 7 mm en piso 3. Dentro del limite de 10 mm.',NULL,'2025-02-27 17:08:00'),(155,20,20,'Cumple','Plan de mantenimiento preventivo al dia. Libro de mantenimiento con todas las intervenciones registradas y firmadas.',NULL,'2025-02-27 17:20:00'),(156,28,2,'Cumple','Iluminacion del foso operativa. Medicion: 60 lux. Interruptor accesible desde acceso superior al foso.',NULL,'2026-04-06 13:05:00'),(157,28,3,'No Cumple','Intercomunicador de emergencia no operativo. Sin respuesta desde porteria al realizar prueba de llamada.','Reparar o reemplazar sistema de comunicacion de emergencia. Plazo maximo: 15 dias habiles.','2026-04-06 13:08:00'),(158,28,6,'Cumple','Limitador de velocidad con sello de calibracion vigente hasta junio 2026. Prueba de disparo exitosa.',NULL,'2026-04-06 13:15:00'),(159,28,7,'Cumple','Tablero electrico con circuitos identificados y protecciones en buen estado. Sin conexiones improvisadas.',NULL,'2026-04-06 13:20:00'),(160,28,8,'Cumple','Licencia de operacion vigente. Copia disponible en cuarto de maquinas y con el administrador del edificio.',NULL,'2026-04-06 13:25:00'),(161,28,9,'Cumple','Guias de cabina y contrapeso alineadas correctamente. Sin corrosion ni deformaciones en ningún tramo.',NULL,'2026-04-06 13:30:00'),(162,28,10,'No Aplica','Ascensor electrico de traccion. No cuenta con sistema hidraulico. Item no aplica.',NULL,'2026-04-06 13:32:00'),(163,28,11,'Cumple','Luz de emergencia autonoma operativa. Activacion correcta al simular corte de energia. Autonomia mayor a 1 hora.',NULL,'2026-04-06 13:35:00'),(164,28,12,'Cumple','Alarma sonora de emergencia operativa. Botón activa señal audible en cuarto de maquinas y porteria.',NULL,'2026-04-06 13:38:00'),(165,28,13,'Cumple','Amortiguadores hidraulicos en buen estado. Sin fugas ni deformaciones. Nivel de aceite correcto.',NULL,'2026-04-06 13:40:00'),(166,28,14,'Cumple','Recinto completamente cerrado. Sin aberturas no autorizadas en paredes ni puertas del hueco.',NULL,'2026-04-06 13:42:00'),(167,28,15,'Cumple','Cuadro de maniobra cerrado con llave. Circuitos identificados. Sin componentes sueltos ni quemados.',NULL,'2026-04-06 13:45:00'),(168,28,17,'Cumple','Velocidad medida: 1.95 m/s. Velocidad nominal declarada: 2.00 m/s. Diferencia del 2.5%. Dentro del rango.',NULL,'2026-04-06 13:50:00'),(169,28,18,'Cumple','Guardas de polea de traccion y desvio instaladas y fijas. Sin danos ni desplazamientos.',NULL,'2026-04-06 13:52:00'),(170,28,19,'Cumple','Nivelacion verificada en los 22 pisos. Diferencia maxima de 8 mm en piso 15. Dentro del limite de 10 mm.',NULL,'2026-04-06 13:55:00'),(171,28,20,'Cumple','Plan de mantenimiento preventivo ejecutado. Libro con todas las intervenciones registradas correctamente.',NULL,'2026-04-06 14:00:00');
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
INSERT INTO `fotografia` VALUES (1,2,1,'asc2_cuarto_maquinas.jpg','/fotos/2025/INF-002/asc2_cuarto_maquinas.jpg',1240,'Vista general del cuarto de maquinas. Puerta con cerradura y senalizacion visible.','Contexto','2025-01-22 09:10:00',4.68520000,-74.05480000,_binary ''),(2,2,3,'asc2_cabina_intercomunicador.jpg','/fotos/2025/INF-002/asc2_cabina_intercomunicador.jpg',980,'Panel de cabina con boton de alarma e intercomunicador operativo.','Detalle tecnico','2025-01-22 09:25:00',4.68520000,-74.05480000,_binary ''),(3,2,5,'asc2_cables_traccion.jpg','/fotos/2025/INF-002/asc2_cables_traccion.jpg',1480,'Cables de traccion sin hilos rotos. Lubricacion uniforme verificada visualmente.','Detalle tecnico','2025-01-22 10:00:00',4.68520000,-74.05480000,_binary ''),(4,4,9,'asc4_guias_oxidacion.jpg','/fotos/2025/INF-004/asc4_guias_oxidacion.jpg',1650,'Oxidacion superficial en guias de contrapeso tramo pisos 3 a 5. Hallazgo documentado.','Hallazgo','2025-01-24 07:20:00',4.69010000,-74.04920000,_binary ''),(5,4,10,'asc4_foso_fuga_aceite.jpg','/fotos/2025/INF-004/asc4_foso_fuga_aceite.jpg',1820,'Fuga de aceite en tuberia de retorno del grupo hidraulico. Mancha de aceite documentada en piso del foso.','Hallazgo','2025-01-24 07:35:00',4.69010000,-74.04920000,_binary ''),(6,4,6,'asc4_limitador_sello.jpg','/fotos/2025/INF-004/asc4_limitador_sello.jpg',1120,'Limitador de velocidad con sello de calibracion vigente hasta noviembre 2025.','Detalle tecnico','2025-01-24 08:00:00',4.69010000,-74.04920000,_binary ''),(7,4,NULL,'asc4_vista_foso_general.jpg','/fotos/2025/INF-004/asc4_vista_foso_general.jpg',1380,'Vista general del foso del ascensor de carga. Estado general documentado.','Contexto','2025-01-24 08:20:00',4.69010000,-74.04920000,_binary ''),(8,5,15,'asc5_cuadro_rele_flojo.jpg','/fotos/2025/INF-005/asc5_cuadro_rele_flojo.jpg',1560,'Rele auxiliar con conector flojo en tarjeta de control. Causa de paradas intermitentes.','Hallazgo','2025-02-05 11:30:00',4.67340000,-74.05610000,_binary '\0'),(9,5,11,'asc5_luz_emergencia.jpg','/fotos/2025/INF-005/asc5_luz_emergencia.jpg',890,'Prueba de luz de emergencia autonoma. Activacion correcta al simular corte de energia.','Detalle tecnico','2025-02-05 10:20:00',4.67340000,-74.05610000,_binary '\0'),(10,10,NULL,'asc10_guias_desgaste.jpg','/fotos/2025/INF-010/asc10_guias_desgaste.jpg',1740,'Desgaste en zapatas de guia de cabina. Causa identificada del ruido reportado por usuarios.','Hallazgo','2025-02-05 06:50:00',4.65780000,-74.09230000,_binary ''),(11,10,NULL,'asc10_zapatas_nuevas.jpg','/fotos/2025/INF-010/asc10_zapatas_nuevas.jpg',1390,'Zapatas de guia nuevas instaladas in situ. Montacamillas operativo tras la intervencion.','Detalle tecnico','2025-02-05 07:30:00',4.65780000,-74.09230000,_binary ''),(12,10,20,'asc10_libro_mant.jpg','/fotos/2025/INF-010/asc10_libro_mant.jpg',760,'Libro de mantenimiento con ultima anotacion desactualizada. Falta registro de intervencion de agosto.','Hallazgo','2025-02-05 07:45:00',4.65780000,-74.09230000,_binary ''),(13,10,16,'asc10_freno_prueba.jpg','/fotos/2025/INF-010/asc10_freno_prueba.jpg',1230,'Prueba de freno electromagnetico bajo carga nominal 300 kg. Resultado satisfactorio.','Detalle tecnico','2025-02-05 07:10:00',4.65780000,-74.09230000,_binary ''),(14,12,5,'asc12_cables_nuevos.jpg','/fotos/2025/INF-012/asc12_cables_nuevos.jpg',1610,'Cables de traccion nuevos instalados. Tension y lubricacion verificadas visualmente.','Detalle tecnico','2025-02-14 07:20:00',4.69010000,-74.04920000,_binary '\0'),(15,12,NULL,'asc12_cuarto_maq_gral.jpg','/fotos/2025/INF-012/asc12_cuarto_maq_gral.jpg',1180,'Vista general cuarto de maquinas post-mantenimiento. Orden y limpieza adecuados.','Contexto','2025-02-14 07:40:00',4.69010000,-74.04920000,_binary '\0'),(16,20,NULL,'asc20_sensor_pesaje.jpg','/fotos/2025/INF-020/asc20_sensor_pesaje.jpg',1450,'Sensor de pesaje descalibrado identificado. Intervencion de calibracion documentada.','Hallazgo','2025-02-27 06:15:00',4.66780000,-74.11230000,_binary ''),(17,20,NULL,'asc20_prueba_carga.jpg','/fotos/2025/INF-020/asc20_prueba_carga.jpg',1870,'Prueba de carga estatica con 1500 kg. Resultado satisfactorio. Capacidad nominal verificada.','Detalle tecnico','2025-02-27 07:00:00',4.66780000,-74.11230000,_binary ''),(18,20,NULL,'asc20_foso_general.jpg','/fotos/2025/INF-020/asc20_foso_general.jpg',1320,'Vista general foso ascensor de servicios. Sin danos estructurales ni derrames.','Contexto','2025-02-27 06:30:00',4.66780000,-74.11230000,_binary ''),(19,20,NULL,'asc20_cabina_interna.jpg','/fotos/2025/INF-020/asc20_cabina_interna.jpg',1095,'Interior de cabina de servicios. Sin danos en paredes, piso ni techo tras prueba de carga.','Contexto','2025-02-27 07:15:00',4.66780000,-74.11230000,_binary ''),(21,8,NULL,'motor.jpg','/fotos/motor.jpg',NULL,'Motor en buen estado',NULL,'2026-04-05 13:34:25',NULL,NULL,NULL),(25,7,NULL,'freno_emergencia.jpg','/foto/freno_emergencia.jpg',NULL,'Freno electromagnetico operativo',NULL,'2026-04-08 14:18:49',NULL,NULL,NULL),(26,2,2,'asc2_foso_iluminacion.jpg','/fotos/2025/INF-002/asc2_foso_iluminacion.jpg',1050,'Iluminacion del foso operativa. Medicion de 65 lux verificada con luxometro.','Detalle tecnico','2025-01-22 09:15:00',4.68520000,-74.05480000,_binary ''),(27,2,4,'asc2_puerta_rellano_p1.jpg','/fotos/2025/INF-002/asc2_puerta_rellano_p1.jpg',1180,'Enclavamiento mecanico puerta rellano piso 1 verificado. Apertura imposible con cabina fuera de nivel.','Detalle tecnico','2025-01-22 09:30:00',4.68520000,-74.05480000,_binary ''),(28,2,4,'asc2_puerta_rellano_p5.jpg','/fotos/2025/INF-002/asc2_puerta_rellano_p5.jpg',1220,'Enclavamiento mecanico puerta rellano piso 5 verificado. Contacto electrico en buen estado.','Detalle tecnico','2025-01-22 09:35:00',4.68520000,-74.05480000,_binary ''),(29,2,4,'asc2_puerta_rellano_p10.jpg','/fotos/2025/INF-002/asc2_puerta_rellano_p10.jpg',1190,'Enclavamiento mecanico puerta rellano piso 10 verificado. Sin holguras ni deformaciones.','Detalle tecnico','2025-01-22 09:40:00',4.68520000,-74.05480000,_binary ''),(30,2,6,'asc2_limitador_velocidad.jpg','/fotos/2025/INF-002/asc2_limitador_velocidad.jpg',1310,'Limitador de velocidad con sello de calibracion vigente. Prueba de disparo exitosa.','Detalle tecnico','2025-01-22 09:50:00',4.68520000,-74.05480000,_binary ''),(31,2,7,'asc2_tablero_electrico.jpg','/fotos/2025/INF-002/asc2_tablero_electrico.jpg',1420,'Tablero electrico con circuitos identificados y protecciones termicas en buen estado.','Detalle tecnico','2025-01-22 09:55:00',4.68520000,-74.05480000,_binary ''),(32,2,8,'asc2_licencia_operacion.jpg','/fotos/2025/INF-002/asc2_licencia_operacion.jpg',870,'Licencia de operacion vigente. Copia disponible en cuarto de maquinas.','Documento','2025-01-22 10:05:00',4.68520000,-74.05480000,_binary ''),(33,2,9,'asc2_guias_cabina.jpg','/fotos/2025/INF-002/asc2_guias_cabina.jpg',1380,'Guias de cabina alineadas correctamente. Sin corrosion ni deformaciones visibles.','Detalle tecnico','2025-01-22 10:10:00',4.68520000,-74.05480000,_binary ''),(34,2,11,'asc2_luz_emergencia.jpg','/fotos/2025/INF-002/asc2_luz_emergencia.jpg',920,'Luz de emergencia autonoma operativa. Activacion correcta al simular corte de energia.','Detalle tecnico','2025-01-22 10:15:00',4.68520000,-74.05480000,_binary ''),(35,2,12,'asc2_alarma_emergencia.jpg','/fotos/2025/INF-002/asc2_alarma_emergencia.jpg',850,'Boton de alarma de emergencia probado. Senial audible confirmada desde exterior de cabina.','Detalle tecnico','2025-01-22 10:20:00',4.68520000,-74.05480000,_binary ''),(36,2,16,'asc2_freno_electromagnetico.jpg','/fotos/2025/INF-002/asc2_freno_electromagnetico.jpg',1450,'Freno electromagnetico verificado bajo carga nominal. Sin deslizamiento al cortar corriente.','Detalle tecnico','2025-01-22 10:25:00',4.68520000,-74.05480000,_binary ''),(37,2,17,'asc2_medicion_velocidad.jpg','/fotos/2025/INF-002/asc2_medicion_velocidad.jpg',1100,'Medicion de velocidad nominal con tacometro. Resultado dentro del rango permitido.','Detalle tecnico','2025-01-22 10:30:00',4.68520000,-74.05480000,_binary ''),(38,2,19,'asc2_nivelacion_p1.jpg','/fotos/2025/INF-002/asc2_nivelacion_p1.jpg',980,'Nivelacion piso 1 verificada. Diferencia de 4 mm entre cabina y rellano. Dentro del limite.','Detalle tecnico','2025-01-22 10:35:00',4.68520000,-74.05480000,_binary ''),(39,2,20,'asc2_libro_mantenimiento.jpg','/fotos/2025/INF-002/asc2_libro_mantenimiento.jpg',790,'Libro de mantenimiento al dia. Todas las intervenciones registradas correctamente.','Documento','2025-01-22 10:40:00',4.68520000,-74.05480000,_binary ''),(40,2,NULL,'asc2_foso_general.jpg','/fotos/2025/INF-002/asc2_foso_general.jpg',1560,'Vista general del foso. Estado general satisfactorio. Sin acumulacion de agua ni residuos.','Contexto','2025-01-22 10:45:00',4.68520000,-74.05480000,_binary ''),(41,2,NULL,'asc2_contrapeso.jpg','/fotos/2025/INF-002/asc2_contrapeso.jpg',1280,'Contrapeso y guias en buen estado. Sin corrosion ni deformaciones en ninguna seccion.','Contexto','2025-01-22 10:50:00',4.68520000,-74.05480000,_binary ''),(42,2,NULL,'asc2_cabina_interior.jpg','/fotos/2025/INF-002/asc2_cabina_interior.jpg',1150,'Interior de cabina. Paredes, piso y techo en buen estado. Iluminacion operativa.','Contexto','2025-01-22 10:52:00',4.68520000,-74.05480000,_binary ''),(43,4,9,'asc4_guias_oxidacion_detalle.jpg','/fotos/2025/INF-004/asc4_guias_oxidacion_detalle.jpg',1720,'Detalle de oxidacion superficial en guia de contrapeso entre pisos 3 y 5. Zona marcada para tratamiento.','Hallazgo','2025-01-24 07:25:00',4.69010000,-74.04920000,_binary ''),(44,4,9,'asc4_guias_oxidacion_p4.jpg','/fotos/2025/INF-004/asc4_guias_oxidacion_p4.jpg',1680,'Oxidacion en guia lateral derecha a altura de piso 4. Mayor concentracion en este tramo.','Hallazgo','2025-01-24 07:28:00',4.69010000,-74.04920000,_binary ''),(45,4,10,'asc4_fuga_aceite_detalle.jpg','/fotos/2025/INF-004/asc4_fuga_aceite_detalle.jpg',1890,'Fuga de aceite en tuberia de retorno del grupo hidraulico. Derrame activo documentado.','Hallazgo','2025-01-24 07:38:00',4.69010000,-74.04920000,_binary ''),(46,4,10,'asc4_derrame_foso.jpg','/fotos/2025/INF-004/asc4_derrame_foso.jpg',1760,'Mancha de aceite en piso del foso bajo tuberia de retorno. Extension aproximada 30 cm.','Hallazgo','2025-01-24 07:42:00',4.69010000,-74.04920000,_binary ''),(47,4,7,'asc4_tablero_identificado.jpg','/fotos/2025/INF-004/asc4_tablero_identificado.jpg',1350,'Tablero electrico con circuitos correctamente identificados. Sin conexiones improvisadas.','Detalle tecnico','2025-01-24 08:05:00',4.69010000,-74.04920000,_binary ''),(48,4,8,'asc4_licencia_carga.jpg','/fotos/2025/INF-004/asc4_licencia_carga.jpg',890,'Licencia de operacion para ascensor de carga vigente. Capacidad nominal 2000 kg certificada.','Documento','2025-01-24 08:10:00',4.69010000,-74.04920000,_binary ''),(49,4,16,'asc4_freno_verificado.jpg','/fotos/2025/INF-004/asc4_freno_verificado.jpg',1480,'Freno de carga verificado con 2000 kg. Sin deslizamiento. Accion eficaz confirmada.','Detalle tecnico','2025-01-24 08:15:00',4.69010000,-74.04920000,_binary ''),(50,4,17,'asc4_velocidad_carga.jpg','/fotos/2025/INF-004/asc4_velocidad_carga.jpg',1120,'Velocidad medida 0.48 m/s en recorrido de carga. Nominal 0.50 m/s. Dentro de rango permitido.','Detalle tecnico','2025-01-24 08:22:00',4.69010000,-74.04920000,_binary ''),(51,4,18,'asc4_guardas_polea.jpg','/fotos/2025/INF-004/asc4_guardas_polea.jpg',1290,'Guardas de polea de traccion y desvio instaladas y fijas. Sin danos ni desplazamientos.','Detalle tecnico','2025-01-24 08:28:00',4.69010000,-74.04920000,_binary ''),(52,4,NULL,'asc4_cuarto_maquinas_gral.jpg','/fotos/2025/INF-004/asc4_cuarto_maquinas_gral.jpg',1420,'Vista general cuarto de maquinas ascensor de carga. Orden y acceso restringido verificados.','Contexto','2025-01-24 07:10:00',4.69010000,-74.04920000,_binary ''),(53,4,NULL,'asc4_cabina_carga_interior.jpg','/fotos/2025/INF-004/asc4_cabina_carga_interior.jpg',1310,'Interior cabina de carga. Paredes reforzadas en buen estado. Piso antideslizante sin danos.','Contexto','2025-01-24 07:50:00',4.69010000,-74.04920000,_binary ''),(54,4,NULL,'asc4_placa_capacidad.jpg','/fotos/2025/INF-004/asc4_placa_capacidad.jpg',760,'Placa de capacidad nominal visible en cabina. 2000 kg. Sin danos ni manipulacion.','Documento','2025-01-24 07:52:00',4.69010000,-74.04920000,_binary ''),(55,10,NULL,'asc10_cuarto_maquinas.jpg','/fotos/2025/INF-010/asc10_cuarto_maquinas.jpg',1380,'Vista general cuarto de maquinas montacamillas. Acceso restringido y senalizacion visible.','Contexto','2025-02-05 06:40:00',4.65780000,-74.09230000,_binary ''),(56,10,1,'asc10_puerta_cm_cerrada.jpg','/fotos/2025/INF-010/asc10_puerta_cm_cerrada.jpg',1100,'Puerta cuarto de maquinas con cerradura y senial de peligro electrico visible.','Detalle tecnico','2025-02-05 06:42:00',4.65780000,-74.09230000,_binary ''),(57,10,2,'asc10_foso_iluminacion.jpg','/fotos/2025/INF-010/asc10_foso_iluminacion.jpg',980,'Iluminacion del foso operativa. Interruptor accesible desde acceso superior al foso.','Detalle tecnico','2025-02-05 06:45:00',4.65780000,-74.09230000,_binary ''),(58,10,3,'asc10_intercomunicador.jpg','/fotos/2025/INF-010/asc10_intercomunicador.jpg',870,'Intercomunicador de emergencia en cabina montacamillas operativo. Prueba de llamada exitosa.','Detalle tecnico','2025-02-05 06:55:00',4.65780000,-74.09230000,_binary ''),(59,10,5,'asc10_cables_traccion.jpg','/fotos/2025/INF-010/asc10_cables_traccion.jpg',1340,'Cables de traccion sin hilos rotos. Lubricacion adecuada. Sin corrosion visible.','Detalle tecnico','2025-02-05 07:05:00',4.65780000,-74.09230000,_binary ''),(60,10,6,'asc10_limitador_sello.jpg','/fotos/2025/INF-010/asc10_limitador_sello.jpg',1150,'Limitador de velocidad con sello de calibracion vigente. Prueba de disparo satisfactoria.','Detalle tecnico','2025-02-05 07:08:00',4.65780000,-74.09230000,_binary ''),(61,10,8,'asc10_licencia_montacamillas.jpg','/fotos/2025/INF-010/asc10_licencia_montacamillas.jpg',820,'Licencia de operacion vigente para montacamillas. Capacidad 300 kg certificada.','Documento','2025-02-05 07:12:00',4.65780000,-74.09230000,_binary ''),(62,10,19,'asc10_nivelacion_p1.jpg','/fotos/2025/INF-010/asc10_nivelacion_p1.jpg',960,'Nivelacion piso 1 verificada con regla metalica. Diferencia de 5 mm. Dentro del limite.','Detalle tecnico','2025-02-05 07:20:00',4.65780000,-74.09230000,_binary ''),(63,10,19,'asc10_nivelacion_p4.jpg','/fotos/2025/INF-010/asc10_nivelacion_p4.jpg',940,'Nivelacion piso 4 verificada. Diferencia de 6 mm registrada como maxima. Dentro del limite.','Detalle tecnico','2025-02-05 07:22:00',4.65780000,-74.09230000,_binary ''),(64,10,NULL,'asc10_cabina_montacamillas.jpg','/fotos/2025/INF-010/asc10_cabina_montacamillas.jpg',1200,'Interior cabina montacamillas. Paredes y piso sin danos. Placa capacidad 300 kg visible.','Contexto','2025-02-05 07:35:00',4.65780000,-74.09230000,_binary ''),(65,10,NULL,'asc10_foso_general.jpg','/fotos/2025/INF-010/asc10_foso_general.jpg',1480,'Vista general foso montacamillas. Sin acumulacion de agua ni residuos. Estado limpio.','Contexto','2025-02-05 07:40:00',4.65780000,-74.09230000,_binary ''),(66,10,NULL,'asc10_contrapeso_guias.jpg','/fotos/2025/INF-010/asc10_contrapeso_guias.jpg',1350,'Contrapeso y guias tras reemplazo de zapatas. Alineacion correcta verificada.','Contexto','2025-02-05 07:45:00',4.65780000,-74.09230000,_binary ''),(67,20,1,'asc20_cuarto_maquinas.jpg','/fotos/2025/INF-020/asc20_cuarto_maquinas.jpg',1290,'Cuarto de maquinas con acceso restringido. Senalizacion de peligro electrico visible.','Contexto','2025-02-27 06:08:00',4.66780000,-74.11230000,_binary ''),(68,20,3,'asc20_intercomunicador.jpg','/fotos/2025/INF-020/asc20_intercomunicador.jpg',890,'Intercomunicador de emergencia operativo. Prueba bidireccional exitosa con porteria.','Detalle tecnico','2025-02-27 06:20:00',4.66780000,-74.11230000,_binary ''),(69,20,5,'asc20_cables_traccion.jpg','/fotos/2025/INF-020/asc20_cables_traccion.jpg',1380,'Cables de traccion en buen estado. Lubricacion uniforme. Sin hilos rotos ni corrosion.','Detalle tecnico','2025-02-27 06:25:00',4.66780000,-74.11230000,_binary ''),(70,20,6,'asc20_limitador_velocidad.jpg','/fotos/2025/INF-020/asc20_limitador_velocidad.jpg',1180,'Limitador de velocidad con sello de calibracion vigente hasta diciembre 2025.','Detalle tecnico','2025-02-27 06:35:00',4.66780000,-74.11230000,_binary ''),(71,20,7,'asc20_tablero_electrico.jpg','/fotos/2025/INF-020/asc20_tablero_electrico.jpg',1420,'Tablero electrico con circuitos identificados. Sin conexiones improvisadas. Protecciones en buen estado.','Detalle tecnico','2025-02-27 06:40:00',4.66780000,-74.11230000,_binary ''),(72,20,8,'asc20_licencia_servicios.jpg','/fotos/2025/INF-020/asc20_licencia_servicios.jpg',840,'Licencia de operacion ascensor de servicios vigente. Capacidad 1500 kg certificada.','Documento','2025-02-27 06:45:00',4.66780000,-74.11230000,_binary ''),(73,20,9,'asc20_guias_cabina.jpg','/fotos/2025/INF-020/asc20_guias_cabina.jpg',1310,'Guias de cabina alineadas correctamente. Sin corrosion ni deformaciones en ningun tramo.','Detalle tecnico','2025-02-27 06:50:00',4.66780000,-74.11230000,_binary ''),(74,20,11,'asc20_luz_emergencia.jpg','/fotos/2025/INF-020/asc20_luz_emergencia.jpg',910,'Luz de emergencia autonoma operativa. Activacion inmediata al simular corte de energia.','Detalle tecnico','2025-02-27 06:55:00',4.66780000,-74.11230000,_binary ''),(75,20,12,'asc20_alarma_emergencia.jpg','/fotos/2025/INF-020/asc20_alarma_emergencia.jpg',870,'Alarma sonora operativa. Senial audible desde exterior de cabina confirmada en prueba.','Detalle tecnico','2025-02-27 07:05:00',4.66780000,-74.11230000,_binary ''),(76,20,13,'asc20_amortiguadores.jpg','/fotos/2025/INF-020/asc20_amortiguadores.jpg',1250,'Amortiguadores hidraulicos cabina y contrapeso en buen estado. Sin fugas ni deformaciones.','Detalle tecnico','2025-02-27 07:10:00',4.66780000,-74.11230000,_binary ''),(77,20,17,'asc20_medicion_velocidad.jpg','/fotos/2025/INF-020/asc20_medicion_velocidad.jpg',1090,'Medicion velocidad nominal ascensor de servicios. Resultado dentro del rango permitido.','Detalle tecnico','2025-02-27 07:18:00',4.66780000,-74.11230000,_binary ''),(78,20,19,'asc20_nivelacion_pisos.jpg','/fotos/2025/INF-020/asc20_nivelacion_pisos.jpg',1020,'Nivelacion verificada en los 5 pisos. Maxima diferencia de 7 mm. Dentro del limite de 10 mm.','Detalle tecnico','2025-02-27 07:22:00',4.66780000,-74.11230000,_binary ''),(79,20,NULL,'asc20_cabina_servicios.jpg','/fotos/2025/INF-020/asc20_cabina_servicios.jpg',1180,'Interior cabina de servicios. Sin danos en paredes ni piso tras prueba de carga con 1500 kg.','Contexto','2025-02-27 07:25:00',4.66780000,-74.11230000,_binary '');
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
INSERT INTO `informe` VALUES (1,1,'INF-2025-001','2025-01-25 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-001_borrador.pdf',NULL,'Informe en elaboración. Inspección programada pendiente de ejecución.',NULL,'2026-03-09 04:03:38'),(2,2,'INF-2025-002','2025-01-22 11:30:00','2025-01-23 09:00:00','2025-01-23 14:00:00','Aprobado',3,'Informe completo y bien diligenciado. Checklist sin inconsistencias. Firmas validadas.','/informes/2025/INF-2025-002_aprobado.pdf','a3f1b2c4d5e6f7890123456789abcdef0123456789abcdef0123456789abcdef','Ascensor Schindler 3300 MRL en Torre B cumple con todos los requisitos de la NTC 5926-1. Sin hallazgos críticos. Documentación técnica vigente.','Aprobado','2026-03-09 04:03:38'),(3,3,'INF-2025-003','2025-02-01 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-003_borrador.pdf',NULL,'Informe en elaboración. Inspección anual KONE MonoSpace pendiente de ejecución.',NULL,'2026-03-09 04:03:38'),(4,4,'INF-2025-004','2025-01-24 09:30:00','2025-01-24 15:00:00','2025-01-25 10:00:00','Aprobado',2,'Informe de inspección extraordinaria revisado y aprobado. Corrección de falla documentada correctamente. Se adjuntan evidencias fotográficas.','/informes/2025/INF-2025-004_aprobado.pdf','b4e2c3d6f8a9012345678901bcdef0123456789abcdef0123456789abcdef01','Ascensor ThyssenKrupp Evolution de carga presenta historial de falla en frenos corregida. Sistema de frenado verificado y aprobado. Se recomienda inspección de seguimiento en 3 meses.','Aprobado con observaciones','2026-03-09 04:03:38'),(5,5,'INF-2025-005','2025-02-05 14:00:00',NULL,NULL,'Pendiente Revisión',7,NULL,'/informes/2025/INF-2025-005_pendiente.pdf',NULL,'Inspección parcialmente ejecutada. Cuarto de máquinas y cabina revisados sin novedades. Pendiente revisión de puertas y foso para completar informe.',NULL,'2026-03-09 04:03:38'),(6,6,'INF-2025-006','2025-01-30 10:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-006_borrador.pdf',NULL,'Inspección cancelada por baja temporal del ascensor. Informe no procede hasta que el ascensor sea reactivado y habilitado para inspección.',NULL,'2026-03-09 04:03:38'),(7,7,'INF-2025-007','2025-02-08 12:00:00',NULL,NULL,'Borrador',7,NULL,'/informes/2025/INF-2025-007_borrador.pdf',NULL,'Informe en elaboración. Inspección periódica anual Torres del Norte edificio 20 pisos pendiente de ejecución.',NULL,'2026-03-09 04:03:38'),(8,8,'INF-2025-008','2025-02-15 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-008_borrador.pdf',NULL,'Informe de inspección inicial pendiente. Ascensor KONE EcoSpace Torre Sur incorporado recientemente al contrato de mantenimiento.',NULL,'2026-03-09 04:03:38'),(9,9,'INF-2025-009','2025-02-12 12:00:00',NULL,NULL,'Borrador',7,NULL,'/informes/2025/INF-2025-009_borrador.pdf',NULL,'Informe en elaboración. Inspección semestral Bloque Residencial A pendiente de ejecución.',NULL,'2026-03-09 04:03:38'),(10,10,'INF-2025-010','2025-02-05 08:30:00','2025-02-05 16:00:00','2025-02-06 09:00:00','Aprobado',2,'Informe extraordinario bien sustentado. Causa del ruido identificada y corregida. Evidencia fotográfica adjunta. Prueba de funcionamiento validada.','/informes/2025/INF-2025-010_aprobado.pdf','c5f3d4e7a0b1234567890234cdef0123456789abcdef0123456789abcdef0234','Montacamillas Hyundai NEXEN-MRL presenta corrección exitosa de desgaste en guías. Equipo operativo en condiciones seguras. Sin restricciones de uso.','Aprobado','2026-03-09 04:03:38'),(11,11,'INF-2025-011','2025-02-18 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-011_borrador.pdf',NULL,'Informe pendiente. Certificado de inspección vencido - ejecución urgente requerida antes del cierre de mes.',NULL,'2026-03-09 04:03:38'),(12,12,'INF-2025-012','2025-02-14 10:00:00',NULL,NULL,'Pendiente Revisión',7,NULL,'/informes/2025/INF-2025-012_pendiente.pdf',NULL,'Post-mantenimiento en curso. Cables de tracción nuevos instalados. Cuarto de máquinas verificado. Pendiente prueba de carga para cierre de informe.',NULL,'2026-03-09 04:03:38'),(13,13,'INF-2025-013','2025-02-20 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-013_borrador.pdf',NULL,'Informe en elaboración. Inspección de alta prioridad por vencimiento de licencia. Ejecución programada para el 20 de febrero.',NULL,'2026-03-09 04:03:38'),(14,14,'INF-2025-014','2025-02-25 12:00:00',NULL,NULL,'Borrador',7,NULL,'/informes/2025/INF-2025-014_borrador.pdf',NULL,'Informe semestral Torres del Río torre oeste pendiente de ejecución. Sin novedades reportadas por operador.',NULL,'2026-03-09 04:03:38'),(15,15,'INF-2025-015','2025-03-01 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-015_borrador.pdf',NULL,'Informe de inspección inicial Conjunto Primavera. Nuevo cliente. Documentación técnica completa recibida y validada en pre-inspección.',NULL,'2026-03-09 04:03:38'),(16,16,'INF-2025-016','2025-02-19 10:00:00',NULL,NULL,'Borrador',7,NULL,'/informes/2025/INF-2025-016_borrador.pdf',NULL,'Inspección post-mantenimiento no ejecutada. Mantenimiento correctivo del proveedor externo sin finalizar. Informe en espera de reprogramación.',NULL,'2026-03-09 04:03:38'),(17,17,'INF-2025-017','2025-03-03 12:00:00',NULL,NULL,'Borrador',2,NULL,'/informes/2025/INF-2025-017_borrador.pdf',NULL,'Inspección anual Torre 1 Parque Central pendiente. Histórico de inspecciones satisfactorio. Sin alertas previas registradas.',NULL,'2026-03-09 04:03:38'),(18,18,'INF-2025-018','2025-03-05 12:00:00',NULL,NULL,'Borrador',3,NULL,'/informes/2025/INF-2025-018_borrador.pdf',NULL,'Inspección anual Torre 2 Parque Central pendiente. Coordinada con la inspección de Torre 1 para optimizar desplazamiento del inspector.',NULL,'2026-03-09 04:03:38'),(19,19,'INF-2025-019','2025-03-06 12:00:00',NULL,NULL,'Borrador',7,NULL,'/informes/2025/INF-2025-019_borrador.pdf',NULL,'Informe requerido por curaduría urbana. Plazo definido por entidad. Inspección KONE MonoSpace Torres del Valle programada con alta prioridad.',NULL,'2026-03-09 04:03:38'),(20,20,'INF-2025-020','2025-02-27 08:00:00','2025-02-27 14:00:00','2025-02-28 09:00:00','Aprobado',2,'Informe extraordinario revisado. Diagnóstico de sobrecarga bien documentado. Calibración del sensor verificada. Resultados de prueba de carga adjuntos.','/informes/2025/INF-2025-020_aprobado.pdf','d6a4e5f8b2c3456789012345def0123456789abcdef0123456789abcdef0345','Ascensor Schindler 3300 MRL de servicios Torres del Valle operativo tras calibración de sensor de pesaje. Capacidad nominal de 1500 kg verificada mediante prueba estática y dinámica. Sin restricciones de operación.','Aprobado','2026-03-09 04:03:38');
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
INSERT INTO `inspeccion` VALUES (1,1,1,4,1,'2025-01-25 08:00:00','2025-01-25 10:55:00',115,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección semestral ejecutada. Ascensor Schindler 5500 en operación normal. Sin hallazgos relevantes. Documentación vigente. Se recomienda revisión preventiva de puertas de rellano en próximo mantenimiento.','2026-03-08 22:14:22','2026-06-08 02:13:35'),(2,2,2,5,2,'2025-01-22 09:05:00','2025-01-22 10:55:00',110,'Aprobada','firma_base64_insp_daniela_asc2','2025-01-22 11:00:00','firma_base64_cliente_11_asc2','2025-01-22 11:10:00',_binary '','2025-01-22 16:15:00','Inspección inicial satisfactoria. Ascensor en buen estado general. Documentación al día. Se recomienda mantenimiento preventivo en 6 meses','2026-03-08 22:14:22','2026-03-08 22:14:22'),(3,3,3,6,3,'2025-02-01 08:30:00','2025-02-01 10:45:00',135,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección anual reglamentaria ejecutada. Ascensor KONE MonoSpace en buen estado general. Documentación vigente. Cumple con NTC 5926-1:2012. Sin hallazgos críticos.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(4,4,4,4,4,'2025-01-24 07:05:00','2025-01-24 08:50:00',105,'Aprobada','firma_base64_insp_andres_asc4','2025-01-24 08:55:00','firma_base64_cliente_12_asc4','2025-01-24 09:05:00',_binary '','2025-01-24 14:10:00','Se verificó falla en sistema de frenado de carga. Falla corregida por técnico antes de inspección. Se valida funcionamiento correcto. Requiere revisión de frenos en próximo mantenimiento','2026-03-08 22:14:22','2026-03-08 22:14:22'),(5,5,5,5,5,'2025-02-05 10:00:00','2025-02-05 12:30:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección completada. Relé auxiliar con conector flojo identificado y asegurado durante la visita. Ascensor operativo tras corrección. Se recomienda revisión de tarjeta de control en próximo mantenimiento preventivo.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(6,6,6,6,6,'2025-01-30 08:00:00','2025-01-30 10:20:00',140,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección ejecutada a pesar de baja temporal reportada. Cliente autorizó ejecución para mantener vigencia del certificado. Ascensor GeN2-Comfort en condiciones aceptables. Se recomienda reactivación con mantenimiento previo.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(7,7,7,8,7,'2025-02-08 07:30:00','2025-02-08 10:00:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Revisión anual edificio 20 pisos completada. Ascensor Schindler 5500 en excelente estado. Documentación completa y vigente. Sin hallazgos. Se certifica cumplimiento total de NTC 5926-1:2012.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(8,8,8,4,8,'2025-02-15 09:00:00','2025-02-15 11:30:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Primera inspección de ingreso al contrato completada. Ascensor KONE EcoSpace en buen estado general. Documentación técnica revisada y aprobada. Sin hallazgos críticos en esta revisión inicial.','2026-03-08 22:14:22','2026-06-08 02:13:35'),(9,9,9,5,9,'2025-02-12 08:00:00','2025-02-12 10:30:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección semestral bloque residencial A ejecutada. Ascensor Fujitec GLVF-II sin novedades según operador. Verificación técnica confirma operación correcta. Documentación al día.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(10,10,10,8,10,'2025-02-05 06:35:00','2025-02-05 07:55:00',80,'Aprobada','firma_base64_insp_sergio_asc10','2025-02-05 08:00:00','firma_base64_cliente_15_asc10','2025-02-05 08:10:00',_binary '','2025-02-05 13:15:00','Ruido inusual originado por desgaste en guías de cabina. Se reemplazaron zapatas de guía in situ. Montacamillas opera correctamente tras intervención. Sin riesgo para usuarios','2026-03-08 22:14:22','2026-03-08 22:14:22'),(11,11,11,6,11,'2025-02-18 10:00:00','2025-02-18 12:45:00',165,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección ejecutada con urgencia por vencimiento de certificado. Ascensor Otis Gen2-Life en buen estado. Certificado renovado. Sin hallazgos críticos. Documentación actualizada correctamente.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(12,12,12,4,12,'2025-02-14 07:05:00','2025-02-14 09:15:00',130,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Verificación de cables de tracción recién instalados completada. Prueba de carga con 3000 kg exitosa. Tensión y lubricación de cables verificadas. Ascensor ThyssenKrupp Synergy operativo y en condiciones óptimas.','2026-03-08 22:14:22','2026-06-08 02:13:35'),(13,13,13,8,13,'2025-02-20 07:00:00','2025-02-20 09:40:00',160,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección ejecutada por vencimiento inminente de licencia. Ascensor KONE TranSys en buen estado general. Licencia renovada tras inspección satisfactoria. Cumple NTC 5926-1:2012.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(14,14,14,5,14,'2025-02-25 09:30:00','2025-02-25 12:00:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección semestral torre oeste ejecutada. Ascensor Schindler 6300 con operación estable confirmada. Sin hallazgos. Documentación vigente. Se programa próxima inspección en 6 meses.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(15,15,15,6,15,'2025-03-01 08:00:00','2025-03-01 10:30:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Primera inspección de ingreso Conjunto Primavera completada. Ascensor Mitsubishi ELENESSA en buen estado. Documentación técnica completa y vigente. Sin observaciones de riesgo.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(16,16,16,4,16,'2025-02-19 08:00:00','2025-02-19 10:15:00',135,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección ejecutada tras finalización del mantenimiento correctivo por proveedor externo. Ascensor Fujitec GLVF-II en condiciones aceptables tras la intervención. Se verificó corrección de fallas reportadas.','2026-03-08 22:14:22','2026-06-08 02:13:35'),(17,17,17,8,17,'2025-03-03 08:30:00','2025-03-03 11:00:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección anual Torre 1 Parque Central ejecutada. Ascensor Hyundai LUXEN en excelente estado. Última inspección aprobada hace 11 meses. Cumple completamente NTC 5926-1:2012.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(18,18,18,5,18,'2025-03-05 09:00:00','2025-03-05 11:30:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección anual Torre 2 Parque Central ejecutada junto con Torre 1. Ascensor Otis Gen2-MRL en buen estado. Sin hallazgos. Documentación completa y vigente.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(19,19,19,6,19,'2025-03-06 07:00:00','2025-03-06 09:30:00',150,'Finalizada',NULL,NULL,NULL,NULL,_binary '\0',NULL,'Inspección obligatoria por requerimiento de curaduría urbana completada dentro del plazo. Ascensor KONE MonoSpace en condiciones satisfactorias. Informe remitido a curaduría dentro del plazo legal.','2026-03-08 22:14:22','2026-06-08 02:11:35'),(20,20,20,8,20,'2025-02-27 06:05:00','2025-02-27 07:25:00',80,'Aprobada','firma_base64_insp_sergio_asc20','2025-02-27 07:30:00','firma_base64_cliente_20_asc20','2025-02-27 07:40:00',_binary '','2025-02-27 12:45:00','Sobrecarga detectada por sensor de pesaje. Sensor calibrado y ajustado. Prueba de carga realizada con resultado satisfactorio. Capacidad nominal de 1500 kg verificada. Sin daños estructurales en cabina ni contrapeso','2026-03-08 22:14:22','2026-03-08 22:14:22'),(28,24,25,4,22,'2026-04-06 07:54:39','2026-04-06 10:25:00',151,'Finalizada',NULL,NULL,NULL,NULL,_binary '',NULL,'Inspección anual Torre Norte 22 pisos completada. Ascensor Schindler 5500 MRL en buen estado general. Hallazgo: intercomunicador de emergencia no operativo. Requiere reparación en plazo de 15 días. Demás sistemas cumplen NTC 5926-1:2012.','2026-04-06 12:54:39','2026-06-08 02:11:35'),(29,24,25,4,22,'2026-04-09 08:00:00','2026-04-09 10:00:00',120,'Finalizada',NULL,NULL,NULL,NULL,NULL,NULL,'Inspección de seguimiento ejecutada. Verificación de correcciones solicitadas en inspección anterior. Ascensor en condiciones satisfactorias. Cumple con todos los criterios de NTC 5926-1:2012.','2026-04-09 08:05:57','2026-06-08 02:13:35'),(30,25,1,1,26,'2026-07-14 00:00:00',NULL,NULL,'Programada',NULL,NULL,NULL,NULL,NULL,NULL,'prueba ','2026-06-22 06:40:52','2026-06-22 06:40:52'),(31,26,1,1,27,'2026-07-15 00:00:00',NULL,NULL,'Programada',NULL,NULL,NULL,NULL,NULL,NULL,'prueba','2026-06-22 06:54:05','2026-06-22 06:54:05'),(32,27,1,1,28,'2026-07-01 00:00:00',NULL,NULL,'Programada',NULL,NULL,NULL,NULL,NULL,NULL,'certificacion','2026-06-25 03:45:21','2026-06-25 03:45:21'),(33,28,5,1,29,'2026-03-01 00:00:00',NULL,NULL,'Programada',NULL,NULL,NULL,NULL,NULL,NULL,'No sube','2026-06-25 04:33:46','2026-06-25 04:33:46'),(34,29,1,1,30,'2026-06-01 00:00:00',NULL,NULL,'Programada',NULL,NULL,NULL,NULL,NULL,NULL,'','2026-06-25 05:29:49','2026-06-25 05:29:49');
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
INSERT INTO `observacion` VALUES (1,2,'Recomendacion','Se recomienda realizar mantenimiento preventivo en los proximos 6 meses para mantener el estado optimo del ascensor.','Bajo',_binary '\0','2025-07-22','2026-03-09 04:05:22'),(2,2,'Nota tecnica','Lubricacion de cables en buen estado. Se sugiere revision de lubricacion en siguiente mantenimiento programado.','Bajo',_binary '\0','2025-06-01','2026-03-09 04:05:22'),(3,4,'Hallazgo','Guias de contrapeso presentan oxidacion superficial en tramo entre pisos 3 y 5. Requiere tratamiento anticorrosivo urgente.','Alto',_binary '\0','2025-02-08','2026-03-09 04:05:22'),(4,4,'Hallazgo','Fuga de aceite menor detectada en tuberia de retorno del grupo hidraulico. Derrame en piso del foso documentado fotograficamente.','Alto',_binary '','2025-01-25','2026-03-09 04:05:22'),(5,4,'Recomendacion','Se recomienda inspeccion de seguimiento en 3 meses para verificar correccion de no conformidades documentadas en este informe.','Medio',_binary '\0','2025-04-25','2026-03-09 04:05:22'),(6,5,'Hallazgo','Rele auxiliar con conector flojo en tarjeta de control del cuadro de maniobra. Posible causa de paradas intermitentes reportadas por usuarios.','Alto',_binary '','2025-02-05','2026-03-09 04:05:22'),(7,5,'Nota tecnica','Inspeccion parcialmente ejecutada. Pendiente revision de puertas y foso para completar evaluacion total del equipo.','Medio',_binary '\0','2025-02-15','2026-03-09 04:05:22'),(8,10,'Hallazgo','Desgaste en guias de cabina identificado como causa del ruido inusual reportado. Zapatas de guia reemplazadas in situ durante la inspeccion.','Medio',_binary '\0',NULL,'2026-03-09 04:05:22'),(9,10,'Hallazgo','Registro de mantenimiento desactualizado. Falta anotacion de intervencion de agosto. Libro de mantenimiento incompleto.','Medio',_binary '\0','2025-02-10','2026-03-09 04:05:22'),(10,10,'Recomendacion','Se recomienda que la empresa de mantenimiento actualice el libro con todas las intervenciones realizadas en los ultimos 6 meses.','Bajo',_binary '\0','2025-02-10','2026-03-09 04:05:22'),(11,12,'Nota tecnica','Cables de traccion nuevos instalados correctamente. Tension y lubricacion verificadas. Pendiente prueba de carga para certificar operacion.','Medio',_binary '\0','2025-02-20','2026-03-09 04:05:22'),(12,12,'Recomendacion','Se recomienda realizar prueba de carga al 100% de capacidad nominal antes de emitir concepto tecnico definitivo del post-mantenimiento.','Medio',_binary '\0','2025-02-20','2026-03-09 04:05:22'),(13,20,'Hallazgo','Sensor de pesaje presentaba descalibracion que generaba activacion erronea de alarma de sobrecarga con carga dentro de rango nominal.','Alto',_binary '','2025-02-27','2026-03-09 04:05:22'),(14,20,'Nota tecnica','Calibracion del sensor de pesaje realizada in situ. Prueba estatica con 1500 kg y dinamica con recorrido completo exitosas.','Medio',_binary '\0',NULL,'2026-03-09 04:05:22'),(15,20,'Recomendacion','Se recomienda verificacion del sensor en proximo mantenimiento preventivo para confirmar estabilidad de calibracion a largo plazo.','Bajo',_binary '\0','2025-05-27','2026-03-09 04:05:22'),(16,1,'Nota tecnica','Inspeccion semestral programada. Ascensor Otis Gen2-MRL Torre A reportado sin novedades por el operador del edificio.','Bajo',_binary '\0',NULL,'2026-03-09 04:05:22'),(17,3,'Nota tecnica','Inspeccion anual KONE MonoSpace pendiente. Documentacion tecnica vigente. Sin alertas previas registradas en historial.','Bajo',_binary '\0',NULL,'2026-03-09 04:05:22'),(18,7,'Nota tecnica','Inspeccion periodica Torres del Norte programada. Edificio de 20 pisos con historial de inspecciones satisfactorio.','Bajo',_binary '\0',NULL,'2026-03-09 04:05:22'),(19,11,'Hallazgo','Certificado de inspeccion vencido. Operacion del ascensor en situacion de incumplimiento normativo hasta obtencion de nuevo certificado.','Critico',_binary '','2025-02-28','2026-03-09 04:05:22'),(20,13,'Hallazgo','Licencia de operacion proxima a vencer. Requerimiento de la curaduria urbana con plazo definido para presentacion de informe.','Alto',_binary '','2025-02-20','2026-03-09 04:05:22'),(21,19,'Hallazgo','Inspeccion requerida formalmente por curaduria urbana. Incumplimiento podria generar sancion administrativa al propietario del edificio.','Critico',_binary '','2025-03-06','2026-03-09 04:05:22');
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
INSERT INTO `programacion` VALUES (1,1,4,'2025-01-25','08:00:00','10:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(2,2,5,'2025-01-22','09:00:00','11:00:00','Finalizada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(3,3,6,'2025-02-01','08:30:00','10:30:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(4,4,4,'2025-01-24','07:00:00','09:00:00','Finalizada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(5,5,5,'2025-02-05','10:00:00','12:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(6,6,6,'2025-01-30','08:00:00','09:30:00','Cancelada','Ascensor dado de baja temporal - sin autorización para inspección','2026-03-08 22:12:27','2026-03-08 22:12:27'),(7,7,8,'2025-02-08','07:30:00','09:30:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(8,8,4,'2025-02-15','09:00:00','11:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(9,9,5,'2025-02-12','08:00:00','10:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(10,10,8,'2025-02-05','06:30:00','08:00:00','Finalizada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(11,11,6,'2025-02-18','10:00:00','12:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(12,12,4,'2025-02-14','07:00:00','08:30:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(13,13,8,'2025-02-20','07:00:00','09:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(14,14,5,'2025-02-25','09:30:00','11:30:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(15,15,6,'2025-03-01','08:00:00','10:30:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(16,16,4,'2025-02-19','08:00:00','09:30:00','Cancelada','Pendiente resolución de mantenimiento correctivo por parte del proveedor','2026-03-08 22:12:27','2026-03-08 22:12:27'),(17,17,8,'2025-03-03','08:30:00','10:30:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(18,18,5,'2025-03-05','09:00:00','11:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(19,19,6,'2025-03-06','07:00:00','09:00:00','Programada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(20,20,8,'2025-02-27','06:00:00','07:30:00','Finalizada',NULL,'2026-03-08 22:12:27','2026-03-08 22:12:27'),(24,22,4,'2026-04-06','08:00:00','10:30:00','Programada',NULL,'2026-04-06 12:50:13','2026-04-06 12:50:13'),(25,26,1,'2026-07-14','00:00:00',NULL,'Programada',NULL,'2026-06-22 06:40:52','2026-06-22 06:40:52'),(26,27,1,'2026-07-15','00:00:00',NULL,'Programada',NULL,'2026-06-22 06:54:05','2026-06-22 06:54:05'),(27,28,1,'2026-07-01','00:00:00',NULL,'Programada',NULL,'2026-06-25 03:45:21','2026-06-25 03:45:21'),(28,29,1,'2026-03-01','00:00:00',NULL,'Programada',NULL,'2026-06-25 04:33:46','2026-06-25 04:33:46'),(29,30,1,'2026-06-01','00:00:00',NULL,'Programada',NULL,'2026-06-25 05:29:49','2026-06-25 05:29:49');
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
INSERT INTO `solicitud` VALUES (1,11,1,'Inspección Periódica','Media','2025-01-15','2025-01-25','Programada','Inspección semestral reglamentaria NTC 5926-1','2026-03-08 20:49:53'),(2,11,2,'Inspección Inicial','Alta','2025-01-16','2025-01-22','Finalizada','Primera inspección tras renovación de contrato','2026-03-08 20:49:53'),(3,12,3,'Inspección Periódica','Media','2025-01-20','2025-02-01','Programada','Inspección anual reglamentaria','2026-03-08 20:49:53'),(4,12,4,'Inspección Extraordinaria','Alta','2025-01-21','2025-01-24','Finalizada','Falla reportada en sistema de frenado de carga','2026-03-08 20:49:53'),(5,13,5,'Inspección Periódica','Media','2025-01-25','2025-02-05','Pendiente','Inspección semestral programada','2026-03-08 20:49:53'),(6,13,6,'Post-mantenimiento','Alta','2025-01-26','2025-01-30','Cancelada','Cancelada - ascensor dado de baja temporalmente','2026-03-08 20:49:53'),(7,14,7,'Inspección Periódica','Media','2025-01-28','2025-02-08','Programada','Revisión anual obligatoria edificio 20 pisos','2026-03-08 20:49:53'),(8,14,8,'Inspección Inicial','Baja','2025-01-29','2025-02-15','Pendiente','Nueva incorporación al contrato de mantenimiento','2026-03-08 20:49:53'),(9,15,9,'Inspección Periódica','Media','2025-02-01','2025-02-12','Programada','Inspección semestral bloque residencial','2026-03-08 20:49:53'),(10,15,10,'Inspección Extraordinaria','Alta','2025-02-02','2025-02-05','Finalizada','Ruido inusual reportado por usuarios del montacamillas','2026-03-08 20:49:53'),(11,16,11,'Inspección Periódica','Media','2025-02-05','2025-02-18','Pendiente','Vencimiento de certificado de inspección','2026-03-08 20:49:53'),(12,16,12,'Post-mantenimiento','Media','2025-02-06','2025-02-14','Programada','Verificación tras cambio de cables de tracción','2026-03-08 20:49:53'),(13,17,13,'Inspección Periódica','Alta','2025-02-10','2025-02-20','Programada','Inspección urgente - vencimiento de licencia','2026-03-08 20:49:53'),(14,17,14,'Inspección Periódica','Media','2025-02-11','2025-02-25','Pendiente','Inspección semestral torre oeste','2026-03-08 20:49:53'),(15,18,15,'Inspección Inicial','Baja','2025-02-14','2025-03-01','Pendiente','Primer contrato con la empresa - inspección de ingreso','2026-03-08 20:49:53'),(16,18,16,'Post-mantenimiento','Alta','2025-02-15','2025-02-19','Cancelada','Cancelada - pendiente resolución de mantenimiento','2026-03-08 20:49:53'),(17,19,17,'Inspección Periódica','Media','2025-02-18','2025-03-03','Programada','Inspección anual Torre 1','2026-03-08 20:49:53'),(18,19,18,'Inspección Periódica','Media','2025-02-19','2025-03-05','Pendiente','Inspección anual Torre 2','2026-03-08 20:49:53'),(19,11,1,'Inspección Extraordinaria','Media','2026-04-10','2026-04-25','Programada','Solicitud actualizada - cambio de fecha','2026-03-08 20:49:53'),(20,20,20,'Inspección Extraordinaria','Alta','2025-02-23','2025-02-27','Finalizada','Reporte de sobrecarga en ascensor de servicios','2026-03-08 20:49:53'),(22,35,25,'Inspección Periódica','Alta','2026-04-06','2026-04-06','Aprobada','Inspección anual reglamentaria según NTC 5926-1','2026-04-06 12:47:42'),(23,11,1,'Inspección Periódica','Alta','2026-04-09','2026-04-30','Pendiente','Revisión anual','2026-04-09 08:02:43'),(24,11,1,'Inspección Periódica','Alta','2026-04-01','2026-04-20','Pendiente','Solicitud de prueba para API','2026-04-10 00:08:04'),(26,1,1,'Anual','Normal','2026-06-21','2026-07-14','Programada','prueba ','2026-06-22 06:40:52'),(27,1,1,'Anual','Normal','2026-06-21','2026-07-15','Programada','prueba','2026-06-22 06:54:05'),(28,1,1,'Anual','Normal','2026-06-24','2026-07-01','Programada','certificacion','2026-06-25 03:45:21'),(29,1,5,'Extraordinaria','Normal','2026-06-24','2026-03-01','Programada','No sube','2026-06-25 04:33:46'),(30,1,1,'Periódica','Normal','2026-06-24','2026-06-01','Programada','','2026-06-25 05:29:49');
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
INSERT INTO `usuario` VALUES (1,1,'Juan Carlos Pérez','juan.perez@elevatec.com',_binary '�\�ię&V؞\0 ��','3004567891','CC','1023456789','Elevatec Inspecciones SAS','901234567-1','Calle 45 #12-34 Bogotá','activo','2025-01-10 13:00:00','2025-03-01 14:10:00'),(2,2,'Laura Andrea Gómez','laura.gomez@elevatec.com',_binary '�\�ię&V؞\0 ��','3015678943','CC','1034567890','Elevatec Inspecciones SAS','901234567-1','Carrera 15 #88-20 Bogotá','activo','2025-01-11 13:30:00','2025-03-02 15:15:00'),(3,3,'Carlos Andrés Ramírez','carlos.ramirez@elevatec.com',_binary '�\�ię&V؞\0 ��','3026789451','CC','1045678901','Elevatec Inspecciones SAS','901234567-1','Calle 72 #10-55 Bogotá','activo','2025-01-12 14:00:00','2025-03-02 16:00:00'),(4,4,'Andrés Felipe Martínez','andres.martinez@elevatec.com',_binary '�\�ię&V؞\0 ��','3007891234','CC','1056789012','Elevatec Inspecciones SAS','901234567-1','Calle 100 #20-30 Bogotá','activo','2025-01-13 12:45:00','2025-03-01 13:40:00'),(5,4,'Daniela Torres Rojas','daniela.torres@elevatec.com',_binary '�\�ię&V؞\0 ��','3012345678','CC','1067890123','Elevatec Inspecciones SAS','901234567-1','Carrera 50 #40-12 Medellín','activo','2025-01-14 13:10:00','2025-03-02 14:25:00'),(6,4,'Felipe Santiago Castro','felipe.castro@elevatec.com',_binary '�\�ię&V؞\0 ��','3023456789','CC','1078901234','Elevatec Inspecciones SAS','901234567-1','Calle 33 #15-90 Cali','activo','2025-01-15 13:30:00','2025-03-01 19:10:00'),(7,3,'Natalia Herrera López','natalia.herrera@elevatec.com',_binary '�\�ię&V؞\0 ��','3104567890','CC','1089012345','Elevatec Inspecciones SAS','901234567-1','Carrera 7 #120-33 Bogotá','activo','2025-01-16 14:15:00','2025-03-02 20:40:00'),(8,4,'Sergio Alejandro Vargas','sergio.vargas@elevatec.com',_binary '�\�ię&V؞\0 ��','3115678901','CC','1090123456','Elevatec Inspecciones SAS','901234567-1','Calle 80 #25-40 Bogotá','activo','2025-01-17 12:50:00','2025-03-02 13:10:00'),(9,5,'Paola Rojas Méndez','paola.rojas@elevatec.com',_binary '�\�ię&V؞\0 ��','3126789012','CC','1101234567','Elevatec Inspecciones SAS','901234567-1','Calle 60 #30-12 Bucaramanga','activo','2025-01-18 15:00:00','2025-03-01 21:20:00'),(10,5,'Miguel Ángel Salazar','miguel.salazar@elevatec.com',_binary '�\�ię&V؞\0 ��','3137890123','CC','1112345678','Elevatec Inspecciones SAS','901234567-1','Carrera 19 #45-67 Bogotá','activo','2025-01-19 15:30:00','2025-03-02 17:00:00'),(11,6,'Camila Fernanda Mendoza','camila.mendoza@torresaltas.com',_binary '�\�ię&V؞\0 ��','3148901234','CC','1123456789','Torres Altas PH','900456789-2','Calle 120 #15-88 Bogotá','activo','2025-01-20 14:00:00','2025-02-28 16:30:00'),(12,6,'Ricardo Suárez Gómez','ricardo.suarez@ascensoresplus.com',_binary '�\�ię&V؞\0 ��','3159012345','CC','1134567890','Ascensores Plus SAS','900567890-3','Carrera 11 #93-40 Bogotá','activo','2025-01-21 14:10:00','2025-03-01 15:45:00'),(13,6,'Patricia León Vargas','patricia.leon@edificiolago.com',_binary '�\�ię&V؞\0 ��','3160123456','CC','1145678901','Edificio Lago Azul','900678901-4','Calle 85 #13-22 Bogotá','activo','2025-01-22 14:20:00','2025-02-27 20:10:00'),(14,6,'Diego Fernando Navarro','diego.navarro@torresdelnorte.com',_binary '�\�ię&V؞\0 ��','3171234567','CC','1156789012','Torres del Norte PH','900789012-5','Carrera 9 #150-60 Bogotá','activo','2025-01-23 14:30:00','2025-03-01 13:50:00'),(15,6,'Sandra Milena Pineda','sandra.pineda@residencialsol.com',_binary '�\�ię&V؞\0 ��','3182345678','CC','1167890123','Residencial Sol Naciente','900890123-6','Calle 170 #8-40 Bogotá','activo','2025-01-24 14:40:00','2025-02-26 22:20:00'),(16,6,'Jorge Alberto Cárdenas','jorge.cardenas@edificiocentral.com',_binary '�\�ię&V؞\0 ��','3193456789','CC','1178901234','Edificio Central Plaza','900901234-7','Carrera 14 #60-55 Bogotá','activo','2025-01-25 15:00:00','2025-02-28 14:15:00'),(17,6,'Valentina Ortiz Delgado','valentina.ortiz@torresdelrio.com',_binary '�\�ię&V؞\0 ��','3204567891','CC','1189012345','Torres del Río PH','901012345-8','Calle 110 #20-30 Bogotá','activo','2025-01-26 15:20:00','2025-03-01 18:00:00'),(18,6,'Oscar Javier Castillo','oscar.castillo@conjuntoprimavera.com',_binary '�\�ię&V؞\0 ��','3215678902','CC','1190123456','Conjunto Primavera','901123456-9','Carrera 70 #45-20 Medellín','activo','2025-01-27 15:40:00','2025-02-25 16:10:00'),(19,6,'Andrea Beltrán Ríos','andrea.beltran@edificioparque.com',_binary '�\�ię&V؞\0 ��','3226789013','CC','1201234567','Edificio Parque Central','901234567-0','Calle 50 #30-45 Cali','activo','2025-01-28 16:00:00','2025-03-01 19:45:00'),(20,6,'Mauricio Galindo Torres','mauricio.galindo@torresdelvalle.com',_binary '�\�ię&V؞\0 ��','3237890124','CC','1212345678','Torres del Valle PH','901345678-1','Carrera 80 #25-90 Barranquilla','activo','2025-01-29 16:20:00','2025-02-27 21:00:00'),(35,6,'Maria Fernanda Rojas','maria.rojas@torresdelnorte.com',_binary '�\�ię&V؞\0 ��','3105551234','CC','52345678','Torres del Torre PH','901234567-8','Carrera 9 #150-60, Bogotá','activo','2026-04-06 12:34:10',NULL),(37,4,'esteban','esteban282407@gmail.com',_binary '?5�\�\�g	{ͼ\��',NULL,'CC','123456789',NULL,NULL,NULL,'activo','2026-06-12 00:49:27',NULL),(38,1,'felipe mesa','juanfelipe1346795@gmail.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','1234567',NULL,NULL,NULL,'activo','2026-06-12 02:30:54',NULL),(39,1,'admin1','admin1@liftsafe.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','123456789',NULL,NULL,NULL,'activo','2026-06-12 19:29:39',NULL),(40,6,'cliente1','cliente1@liftsafe.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','12345789451',NULL,NULL,NULL,'activo','2026-06-12 19:31:11',NULL),(41,1,'prueba2','prueba2@gmail.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','896541',NULL,NULL,NULL,'activo','2026-06-14 01:25:02',NULL),(42,1,'prueba3','prueba3@gmail.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','895619586',NULL,NULL,NULL,'activo','2026-06-15 05:10:49',NULL),(43,5,'jhojan','jhojan123456@gmail.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','101234568',NULL,NULL,NULL,'activo','2026-06-17 05:20:41',NULL),(44,1,'freddy ardila','freddycardila@gmail.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','80125125',NULL,NULL,NULL,'activo','2026-06-17 06:05:42',NULL),(45,6,'Cliente Prueba','cliente.test@liftsafe.com',_binary '�\�ię&V؞\0 ��',NULL,'CC','1098765432',NULL,NULL,NULL,'activo','2026-06-18 07:17:54',NULL),(47,6,'prueba11','prueba11@gmail.com',_binary '�\�ię&V؞\0 ��',NULL,'NIT','78965423',NULL,NULL,NULL,'activo','2026-06-24 19:33:15',NULL),(49,6,'Freddy','freddy@gmail.com',_binary '��\�|\\�w/3�B\�',NULL,'CC','80808024',NULL,NULL,NULL,'activo','2026-06-24 23:30:03',NULL),(50,6,'valen mendi','mendi@gmail.com',_binary '�\Z\0{\�[|z-�\�NaM�',NULL,'CC','9841538956',NULL,NULL,NULL,'activo','2026-06-25 00:19:53',NULL),(51,6,'daya mape','mape@gmail.com',_binary '�\Z\0{\�[|z-�\�NaM�',NULL,'CD','84165498156',NULL,NULL,NULL,'activo','2026-06-25 00:20:56',NULL);
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
INSERT INTO `usuario_ascensor` VALUES (21,4,1,'Responsable Principal','2025-01-05',NULL,'Inspector principal zona norte Bogotá'),(22,5,2,'Inspector Alterno','2025-01-05',NULL,'Cubre ausencias del responsable principal'),(23,4,3,'Responsable Principal','2025-01-08',NULL,'Asignado por cercanía de zona'),(24,6,4,'Responsable Principal','2025-01-08',NULL,'Especialista en ascensores de carga'),(25,5,5,'Responsable Principal','2025-01-10',NULL,'Inspector zona occidente'),(26,8,6,'Responsable Principal','2025-01-10','2025-02-15','Ascensor inactivo - suspendida asignación'),(27,4,7,'Responsable Principal','2025-01-12',NULL,'Torres del norte - edificio de 20 pisos'),(28,6,8,'Inspector Alterno','2025-01-12',NULL,'Apoyo en zona norte'),(29,8,9,'Responsable Principal','2025-01-14',NULL,'Asignado por disponibilidad'),(30,5,10,'Responsable Principal','2025-01-14',NULL,'Especialista en montacamillas'),(31,4,11,'Inspector Alterno','2025-01-16',NULL,'Rotación por carga de trabajo'),(32,6,12,'Responsable Principal','2025-01-16',NULL,'Especialista en ascensores de carga pesada'),(33,8,13,'Responsable Principal','2025-01-18',NULL,'Torres del río - zona sur'),(34,5,14,'Inspector Alterno','2025-01-18',NULL,'Apoyo torre oeste'),(35,6,15,'Responsable Principal','2025-01-20',NULL,'Conjunto Primavera - asignación regular'),(36,4,16,'Responsable Principal','2025-01-20','2025-02-20','Ascensor inactivo - en espera de mantenimiento'),(37,8,17,'Responsable Principal','2025-01-22',NULL,'Torre 1 edificio parque central'),(38,5,18,'Inspector Alterno','2025-01-22',NULL,'Torre 2 - apoyo en inspecciones'),(39,6,19,'Responsable Principal','2025-01-24',NULL,'Torres del valle - responsable zona'),(40,8,20,'Responsable Principal','2025-01-24',NULL,'Zona de servicios - carga');
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
