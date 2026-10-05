import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path inside backend directory
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new Database(dbPath, {
  // verbose: console.log
});

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // 1. Usuarios: estudiantes, docentes, admin
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT CHECK(rol IN ('estudiante', 'docente', 'admin')) NOT NULL,
      carrera TEXT DEFAULT 'Informática',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Materias
  db.exec(`
    CREATE TABLE IF NOT EXISTS materias (
      codigo TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      semestre INTEGER NOT NULL,
      creditos INTEGER NOT NULL DEFAULT 3,
      carrera TEXT DEFAULT 'Informática'
    );
  `);

  // 3. Secciones / Cátedras
  db.exec(`
    CREATE TABLE IF NOT EXISTS secciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo_materia TEXT NOT NULL REFERENCES materias(codigo) ON DELETE CASCADE,
      docente_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      periodo TEXT NOT NULL,
      seccion TEXT NOT NULL,
      aula TEXT DEFAULT 'Lab 1 / Virtual',
      UNIQUE(codigo_materia, docente_id, periodo, seccion)
    );
  `);

  // 4. Inscripciones (Vinculación Estudiante - Sección con estado de evaluación)
  db.exec(`
    CREATE TABLE IF NOT EXISTS inscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      seccion_id INTEGER NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
      evaluada INTEGER DEFAULT 0, -- 0: false, 1: true
      fecha_evaluacion DATETIME,
      UNIQUE(estudiante_id, seccion_id)
    );
  `);

  // 5. Respuestas_Evaluacion (100% ANÓNIMA - SIN FK NI ID DEL ESTUDIANTE)
  // Regla de Negocio: No debe registrar cédula, id_estudiante ni metadata que vulnere anonimato.
  db.exec(`
    CREATE TABLE IF NOT EXISTS respuestas_evaluacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seccion_id INTEGER NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      p1 INTEGER NOT NULL CHECK(p1 BETWEEN 1 AND 5),
      p2 INTEGER NOT NULL CHECK(p2 BETWEEN 1 AND 5),
      p3 INTEGER NOT NULL CHECK(p3 BETWEEN 1 AND 5),
      p4 INTEGER NOT NULL CHECK(p4 BETWEEN 1 AND 5),
      p5 INTEGER NOT NULL CHECK(p5 BETWEEN 1 AND 5),
      p6 INTEGER NOT NULL CHECK(p6 BETWEEN 1 AND 5),
      p7 INTEGER NOT NULL CHECK(p7 BETWEEN 1 AND 5),
      p8 INTEGER NOT NULL CHECK(p8 BETWEEN 1 AND 5),
      p9 INTEGER NOT NULL CHECK(p9 BETWEEN 1 AND 5),
      p10 INTEGER NOT NULL CHECK(p10 BETWEEN 1 AND 5),
      p11 INTEGER NOT NULL CHECK(p11 BETWEEN 1 AND 5),
      p12 INTEGER NOT NULL CHECK(p12 BETWEEN 1 AND 5),
      p13 INTEGER NOT NULL CHECK(p13 BETWEEN 1 AND 5),
      p14 INTEGER NOT NULL CHECK(p14 BETWEEN 1 AND 5),
      p15 INTEGER NOT NULL CHECK(p15 BETWEEN 1 AND 5),
      observaciones TEXT
    );
  `);

  // Indexes for high performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_secciones_docente ON secciones(docente_id);
    CREATE INDEX IF NOT EXISTS idx_secciones_periodo ON secciones(periodo);
    CREATE INDEX IF NOT EXISTS idx_inscrip_estudiante ON inscripciones(estudiante_id);
    CREATE INDEX IF NOT EXISTS idx_inscrip_seccion ON inscripciones(seccion_id);
    CREATE INDEX IF NOT EXISTS idx_respuestas_seccion ON respuestas_evaluacion(seccion_id);
  `);
}

export default db;
