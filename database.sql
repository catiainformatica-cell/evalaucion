-- ==============================================================================
-- SISTEMA DE EVALUACIÓN DEL DESEMPEÑO DOCENTE - IUJO (INFORMÁTICA)
-- Script compatible con MySQL / MariaDB (XAMPP phpMyAdmin) y PostgreSQL / SQLite
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS iujo_evaluacion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iujo_evaluacion;

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('estudiante', 'docente', 'admin') NOT NULL,
  carrera VARCHAR(100) DEFAULT 'Informática',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABLA: materias
CREATE TABLE IF NOT EXISTS materias (
  codigo VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  semestre INT NOT NULL,
  creditos INT NOT NULL DEFAULT 3,
  carrera VARCHAR(100) DEFAULT 'Informática'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABLA: secciones
CREATE TABLE IF NOT EXISTS secciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_materia VARCHAR(20) NOT NULL,
  docente_id INT NOT NULL,
  periodo VARCHAR(20) NOT NULL,
  seccion VARCHAR(5) NOT NULL,
  aula VARCHAR(100) DEFAULT 'Lab 1 / Virtual',
  UNIQUE KEY uq_seccion (codigo_materia, docente_id, periodo, seccion),
  CONSTRAINT fk_secciones_materia FOREIGN KEY (codigo_materia) REFERENCES materias(codigo) ON DELETE CASCADE,
  CONSTRAINT fk_secciones_docente FOREIGN KEY (docente_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABLA: inscripciones
-- Vincula al estudiante con la asignatura/sección e indica si ya emitió su voto.
CREATE TABLE IF NOT EXISTS inscripciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  seccion_id INT NOT NULL,
  evaluada TINYINT(1) DEFAULT 0,
  fecha_evaluacion TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_inscripcion (estudiante_id, seccion_id),
  CONSTRAINT fk_inscripciones_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_inscripciones_seccion FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABLA: respuestas_evaluacion (100% ANÓNIMA)
-- REGLA CLAVE: ¡NO contiene estudiante_id ni cédula! Solo guarda la sección evaluada y las respuestas Likert.
CREATE TABLE IF NOT EXISTS respuestas_evaluacion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seccion_id INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  p1 TINYINT NOT NULL CHECK (p1 BETWEEN 1 AND 5),
  p2 TINYINT NOT NULL CHECK (p2 BETWEEN 1 AND 5),
  p3 TINYINT NOT NULL CHECK (p3 BETWEEN 1 AND 5),
  p4 TINYINT NOT NULL CHECK (p4 BETWEEN 1 AND 5),
  p5 TINYINT NOT NULL CHECK (p5 BETWEEN 1 AND 5),
  p6 TINYINT NOT NULL CHECK (p6 BETWEEN 1 AND 5),
  p7 TINYINT NOT NULL CHECK (p7 BETWEEN 1 AND 5),
  p8 TINYINT NOT NULL CHECK (p8 BETWEEN 1 AND 5),
  p9 TINYINT NOT NULL CHECK (p9 BETWEEN 1 AND 5),
  p10 TINYINT NOT NULL CHECK (p10 BETWEEN 1 AND 5),
  p11 TINYINT NOT NULL CHECK (p11 BETWEEN 1 AND 5),
  p12 TINYINT NOT NULL CHECK (p12 BETWEEN 1 AND 5),
  p13 TINYINT NOT NULL CHECK (p13 BETWEEN 1 AND 5),
  p14 TINYINT NOT NULL CHECK (p14 BETWEEN 1 AND 5),
  p15 TINYINT NOT NULL CHECK (p15 BETWEEN 1 AND 5),
  observaciones TEXT DEFAULT NULL,
  CONSTRAINT fk_respuestas_seccion FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
