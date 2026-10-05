import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import bcrypt from 'bcryptjs';
import db from '../config/database.js';

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function hashPw(plain) {
  return bcrypt.hashSync(plain, 10);
}

/**
 * Try to extract from the raw PDF text:
 *  - docenteNombre  (Prof. / Lcdo. / Ing. / Lic. ...)
 *  - materiaNombre
 *  - seccion        (single letter or digit, e.g. "A", "B", "D")
 *  - periodo        (e.g. "2-2026")
 *  - rows[]         [{ cedula, nombre }]
 */
export function parsePdfText(text) {
  const raw = (text || '').replace(/\r/g, ' ');
  const normalized = raw.replace(/\s+/g, ' ').trim();
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const normalizeCedula = (value) => {
    if (!value) return null;
    const cleaned = value.replace(/\s+/g, '').toUpperCase();
    const digitsOnly = cleaned.replace(/[^0-9]/g, '');

    if (/^\d{6,9}$/.test(digitsOnly)) return digitsOnly;
    const vOrE = cleaned.replace(/[^VE0-9]/g, '');
    if (/^[VE]\d{7,9}$/.test(vOrE)) return `${vOrE[0]}-${vOrE.slice(1)}`;
    return null;
  };

  const cleanName = (value) => {
    if (!value) return null;
    let name = value
      .replace(/^[^A-ZÁÉÍÓÚÑa-záéíóúñ]+/, '')
      .replace(/\s*[|;:]+\s*$/, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[^\p{L}\p{N}\s,.'’\-]/gu, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    name = name.replace(/\s+(Carrera|Semestre|Materia|Asignatura|Secci[oó]n|Per[ií]odo|Periodo|Sede|Asistencia|Docente|Profesor|Prof\.?)(?:\s+|$)/gi, ' ');
    name = name.replace(/\s{2,}/g, ' ').trim();
    name = name.replace(/\s+(Carrera|Semestre|Materia|Asignatura|Secci[oó]n|Per[ií]odo|Periodo|Sede|Asistencia|Docente|Profesor|Prof\.?)(?:\s+|$)/gi, ' ');
    name = name.replace(/\s+$/g, '').trim();

    return name && /[\p{L}]/u.test(name) ? name : null;
  };

  // Metadata del documento
  let docenteNombre = null;
  let docenteCedula = null;
  const docenteRegex = /(?:Docente|Profesor[a]?|Prof\.?)\s*[:\-]?\s*(?:((?:[VE]-?\d{7,9}|\d{6,9}))\s*[-:]\s*)?([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ .'-]+)/i;
  const docenteMatch = normalized.match(docenteRegex);
  if (docenteMatch) {
    docenteCedula = normalizeCedula(docenteMatch[1]);
    docenteNombre = cleanName(docenteMatch[2]);
  }

  if (!docenteNombre) {
    const lineWithTeacher = lines.find(line => /Docente|Profesor|Prof\./i.test(line));
    if (lineWithTeacher) {
      const teacherMatch = lineWithTeacher.match(/(?:Docente|Profesor[a]?|Prof\.?)\s*[:\-]?\s*(?:((?:[VE]-?\d{7,9}|\d{6,9}))\s*[-:]\s*)?(.+)/i);
      if (teacherMatch) {
        docenteCedula = normalizeCedula(teacherMatch[1]);
        docenteNombre = cleanName(teacherMatch[2]);
      }
    }
  }

  let materiaNombre = null;
  const materiaMatch = normalized.match(/(?:Asignatura|Materia|Unidad\s+Curricular)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ0-9][A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s/\.-]+)/i);
  if (materiaMatch) {
    materiaNombre = cleanName(materiaMatch[1]);
  }

  let seccion = null;
  const seccionMatch = normalized.match(/Secci[oó]n\s*[:\-]?\s*([A-Z0-9])/i);
  if (seccionMatch) seccion = seccionMatch[1].toUpperCase();

  let periodo = '2-2026';
  const periodoMatch = normalized.match(/Per[ií]odo\s*[:\-]?\s*(\d{1,2}[\-/]\d{4})/i);
  if (periodoMatch) periodo = periodoMatch[1].replace('/', '-');

  // Estudiantes
  const rows = [];
  const seen = new Set();

  const addRow = (cedula, nombre) => {
    const cleanCedula = normalizeCedula(cedula);
    const cleanNombre = cleanName(nombre);
    if (!cleanCedula || !cleanNombre || seen.has(cleanCedula)) return;
    seen.add(cleanCedula);
    rows.push({ cedula: cleanCedula, nombre: cleanNombre });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.replace(/^\d+\s*/, '').trim();

    const rowMatch = trimmed.match(/(?:^|[\s#])([VE]\s*-?\s*\d{7,9}|\d{6,9})\s*(.+)$/i);
    if (rowMatch) {
      const cedula = rowMatch[1];
      const rest = rowMatch[2]?.trim();
      if (rest && /[A-ZÁÉÍÓÚÑ]/i.test(rest)) {
        addRow(cedula, rest);
        continue;
      }
    }

    const idOnly = line.match(/(?:^|[\s#])([VE]\s*-?\s*\d{7,9}|\d{6,9})\s*$/i);
    if (idOnly) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      if (nextLine) addRow(idOnly[1], nextLine);
      continue;
    }

    // Caso IUJO típico: "10V-32770545Gomez Medina, Moises Daniel"
    const gluedIdName = trimmed.match(/^([VE]\s*-?\s*\d{7,9}|\d{6,9})([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s,.'’\-]+)$/i);
    if (gluedIdName) {
      addRow(gluedIdName[1], gluedIdName[2]);
      continue;
    }

    const numberedGlued = trimmed.match(/^(?:\d+\s*)?([VE]\s*-?\s*\d{7,9}|\d{6,9})([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ\s,.'’\-]+)$/i);
    if (numberedGlued) {
      addRow(numberedGlued[1], numberedGlued[2]);
    }
  }

  return { docenteNombre, docenteCedula, materiaNombre, seccion, periodo, rows };
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/import/preview
// Receives: multipart/form-data with field "pdf"
// Returns:  parsed data for preview before confirming import
// ──────────────────────────────────────────────────────────────────────────────
export async function previewImport(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ningún archivo PDF.' });
    }

    const parsed = await pdfParse(req.file.buffer);
    const result = parsePdfText(parsed.text);

    // Try to match materia in DB
    let materiaEncontrada = null;
    if (result.materiaNombre) {
      materiaEncontrada = db.prepare(
        `SELECT codigo, nombre FROM materias WHERE UPPER(nombre) LIKE ?`
      ).get(`%${result.materiaNombre.toUpperCase()}%`);
    }

    const todasLasMaterias = db.prepare('SELECT codigo, nombre, semestre FROM materias ORDER BY semestre, nombre').all();

    return res.json({
      success: true,
      data: {
        rawText: parsed.text.substring(0, 500), // snippet for debugging
        docenteNombre: result.docenteNombre,
        docenteCedula: result.docenteCedula,
        materiaNombre: result.materiaNombre,
        materiaEncontrada,
        todasLasMaterias,
        seccion: result.seccion,
        periodo: result.periodo,
        estudiantes: result.rows,
        totalEstudiantes: result.rows.length,
      }
    });
  } catch (error) {
    console.error('Error al parsear PDF:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar el PDF.', error: error.message });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/import/confirm
// Body: { docenteNombre, docenteCedula, materiaCodigo, seccion, periodo, estudiantes[] }
// ──────────────────────────────────────────────────────────────────────────────
export function confirmImport(req, res) {
  try {
    const { docenteNombre, docenteCedula, materiaCodigo, seccion, periodo, estudiantes } = req.body;

    if (!docenteNombre || !docenteCedula || !materiaCodigo || !seccion || !periodo || !Array.isArray(estudiantes)) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos para confirmar la importación.' });
    }

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO usuarios (cedula, nombre, email, password, rol, carrera)
      VALUES (?, ?, ?, ?, ?, 'Informática')
    `);
    const updatePw = db.prepare(`UPDATE usuarios SET password = ? WHERE cedula = ?`);

    // 1. Crear/actualizar docente
    const docenteEmail = docenteCedula.toLowerCase().replace(/\s/g, '') + '@iujo.edu.ve';
    insertUser.run(docenteCedula, docenteNombre, docenteEmail, hashPw(docenteCedula), 'docente');
    const docente = db.prepare('SELECT id FROM usuarios WHERE cedula = ?').get(docenteCedula);

    // 2. Verificar que la materia existe
    const materia = db.prepare('SELECT codigo FROM materias WHERE codigo = ?').get(materiaCodigo);
    if (!materia) {
      return res.status(400).json({ success: false, message: `Materia con código '${materiaCodigo}' no encontrada.` });
    }

    // 3. Crear sección si no existe
    const existingSection = db.prepare(
      `SELECT id FROM secciones WHERE codigo_materia = ? AND docente_id = ? AND periodo = ? AND seccion = ?`
    ).get(materiaCodigo, docente.id, periodo, seccion);

    let seccionId;
    if (existingSection) {
      seccionId = existingSection.id;
    } else {
      const ins = db.prepare(
        `INSERT INTO secciones (codigo_materia, docente_id, periodo, seccion, aula) VALUES (?, ?, ?, ?, 'Aula Virtual / EVA IUJO')`
      ).run(materiaCodigo, docente.id, periodo, seccion);
      seccionId = ins.lastInsertRowid;
    }

    // 4. Insertar estudiantes e inscripciones
    let countNuevos = 0;
    let countExistentes = 0;

    const importTx = db.transaction(() => {
      for (const est of estudiantes) {
        const cedula = est.cedula.trim().toUpperCase();
        const nombre = est.nombre.trim();
        const email = cedula.toLowerCase() + '@estudiante.iujo.edu.ve';

        const wasNew = insertUser.run(cedula, nombre, email, hashPw(cedula), 'estudiante');
        // Update password to cedula in case they already existed with a different pw
        updatePw.run(hashPw(cedula), cedula);

        const user = db.prepare('SELECT id FROM usuarios WHERE cedula = ?').get(cedula);
        if (!user) continue;

        // Check if already enrolled in this section
        const existing = db.prepare(
          'SELECT id FROM inscripciones WHERE estudiante_id = ? AND seccion_id = ?'
        ).get(user.id, seccionId);

        if (!existing) {
          db.prepare(
            'INSERT INTO inscripciones (estudiante_id, seccion_id, evaluada, fecha_evaluacion) VALUES (?, ?, 0, null)'
          ).run(user.id, seccionId);
          countNuevos++;
        } else {
          countExistentes++;
        }

        if (wasNew.changes === 0) {
          // user already existed before this run
        }
      }
    });

    importTx();

    return res.json({
      success: true,
      message: `Importación completada exitosamente.`,
      data: {
        docente: docenteNombre,
        materia: materiaCodigo,
        seccion,
        periodo,
        alumnosInscritos: countNuevos,
        alumnosYaExistian: countExistentes,
        total: estudiantes.length,
      }
    });
  } catch (error) {
    console.error('Error al confirmar importación:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar la importación.', error: error.message });
  }
}
