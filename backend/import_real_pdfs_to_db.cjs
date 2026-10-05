const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const bcrypt = require('bcryptjs');

(async () => {
  const { default: db, initDatabase } = await import('./src/config/database.js');
  const { parsePdfText } = await import('./src/controllers/importController.js');

  const rootDir = path.resolve(__dirname, '..');
  const pdfDir = path.join(rootDir, 'pdf');
  const salt = bcrypt.genSaltSync(10);
  const hashPw = (value) => bcrypt.hashSync(value, salt);

  const normalizeName = (value = '') => String(value)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim();

  const normalizeCedula = (value = '') => {
    const text = String(value).trim().toUpperCase();
    if (!text) return '';
    const digits = text.replace(/[^0-9]/g, '');
    if (/^\d{6,9}$/.test(digits)) return digits;
    if (/^[VE]/.test(text) && /\d/.test(text)) return text.replace(/[^VE0-9]/g, '');
    return text.replace(/[^A-Z0-9]/g, '');
  };

  const listPdfFiles = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    let files = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(listPdfFiles(fullPath));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        files.push(fullPath);
      }
    }

    return files.sort();
  };

  const findMateriaByName = (materias, materiaName) => {
    const target = normalizeName(materiaName || '');
    if (!target) return null;

    return materias.find((m) => normalizeName(m.nombre) === target)
      || materias.find((m) => normalizeName(m.nombre).includes(target))
      || materias.find((m) => target.includes(normalizeName(m.nombre)));
  };

  const upsertUsuario = ({ cedula, nombre, rol, email }) => {
    if (!cedula || !nombre) return null;

    const existing = db.prepare('SELECT id FROM usuarios WHERE cedula = ?').get(cedula);
    if (existing) {
      db.prepare(`
        UPDATE usuarios
        SET nombre = ?, email = ?, password = ?, rol = ?
        WHERE id = ?
      `).run(nombre, email, hashPw(cedula), rol, existing.id);
      return existing.id;
    }

    const result = db.prepare(`
      INSERT INTO usuarios (cedula, nombre, email, password, rol, carrera)
      VALUES (?, ?, ?, ?, ?, 'Informática')
    `).run(cedula, nombre, email, hashPw(cedula), rol);

    return result.lastInsertRowid;
  };

  const cleanupDuplicateUsers = () => {
    const duplicatedUsers = db.prepare(`
      SELECT cedula, MIN(id) AS keep_id, GROUP_CONCAT(id) AS ids
      FROM usuarios
      GROUP BY cedula
      HAVING COUNT(*) > 1
    `).all();

    for (const item of duplicatedUsers) {
      const ids = String(item.ids).split(',').map(Number).filter((id) => id !== item.keep_id);
      for (const id of ids) {
        db.prepare('UPDATE inscripciones SET estudiante_id = ? WHERE estudiante_id = ?').run(item.keep_id, id);
        db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
      }
    }

    const duplicatedInscripciones = db.prepare(`
      SELECT estudiante_id, seccion_id, MIN(id) AS keep_id, GROUP_CONCAT(id) AS ids
      FROM inscripciones
      GROUP BY estudiante_id, seccion_id
      HAVING COUNT(*) > 1
    `).all();

    for (const item of duplicatedInscripciones) {
      const ids = String(item.ids).split(',').map(Number).filter((id) => id !== item.keep_id);
      for (const id of ids) {
        db.prepare('DELETE FROM inscripciones WHERE id = ?').run(id);
      }
    }
  };

  const resetNonPdfData = () => {
    db.exec(`
      DELETE FROM respuestas_evaluacion;
      DELETE FROM inscripciones;
      DELETE FROM secciones;
      DELETE FROM usuarios WHERE rol IN ('docente', 'estudiante');
    `);

    const admin = db.prepare("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1").get();
    const adminName = 'Gabriel Martinez';
    const adminEmail = 'coordinacion.informatica@iujo.edu.ve';

    if (admin) {
      db.prepare(`
        UPDATE usuarios
        SET nombre = ?, email = ?, password = ?, cedula = ?
        WHERE id = ?
      `).run(adminName, adminEmail, hashPw('admin123'), 'V-12345678', admin.id);
    } else {
      db.prepare(`
        INSERT INTO usuarios (cedula, nombre, email, password, rol, carrera)
        VALUES (?, ?, ?, ?, 'admin', 'Informática')
      `).run('V-12345678', adminName, adminEmail, hashPw('admin123'));
    }
  };

  initDatabase();
  resetNonPdfData();
  cleanupDuplicateUsers();

  const pdfFiles = listPdfFiles(pdfDir);
  console.log(`Se encontraron ${pdfFiles.length} archivos PDF en ${pdfDir}`);

  if (pdfFiles.length === 0) {
    console.log('No hay PDFs para importar.');
    return;
  }

  let processed = 0;
  let skipped = 0;
  let studentsImported = 0;

  for (const filePath of pdfFiles) {
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');

    try {
      const buffer = fs.readFileSync(filePath);
      const parsedPdf = await pdfParse(buffer);
      const parsed = parsePdfText(parsedPdf.text);

      const docenteCedula = normalizeCedula(parsed.docenteCedula || '');
      const docenteNombre = String(parsed.docenteNombre || 'Docente importado').trim() || 'Docente importado';
      const materiaName = String(parsed.materiaNombre || '').trim();
      const periodo = parsed.periodo || '2-2026';
      const seccion = String(parsed.seccion || '').trim().toUpperCase() || 'A';

      const materias = db.prepare('SELECT codigo, nombre FROM materias').all();
      const materia = findMateriaByName(materias, materiaName);
      if (!materia) {
        console.log(`OMITIDO ${relativePath} -> No se encontró materia: ${materiaName || 'sin nombre'}`);
        skipped += 1;
        continue;
      }

      const docenteEmail = `${String(docenteCedula || 'docente').replace(/[^A-Z0-9]/gi, '').toLowerCase()}@iujo.edu.ve`;
      const docenteId = upsertUsuario({
        cedula: docenteCedula || '00000000',
        nombre: docenteNombre,
        rol: 'docente',
        email: docenteEmail,
      });

      if (!docenteId) {
        console.log(`OMITIDO ${relativePath} -> No se pudo crear docente.`);
        skipped += 1;
        continue;
      }

      let seccionRow = db.prepare(`
        SELECT id FROM secciones
        WHERE codigo_materia = ? AND docente_id = ? AND periodo = ? AND seccion = ?
      `).get(materia.codigo, docenteId, periodo, seccion);

      if (!seccionRow) {
        const result = db.prepare(`
          INSERT INTO secciones (codigo_materia, docente_id, periodo, seccion, aula)
          VALUES (?, ?, ?, ?, 'Aula Virtual / EVA IUJO')
        `).run(materia.codigo, docenteId, periodo, seccion);
        seccionRow = { id: result.lastInsertRowid };
      }

      let sectionStudents = 0;
      for (const student of parsed.rows || []) {
        const studentCedula = normalizeCedula(student.cedula);
        const studentNombre = String(student.nombre || '').trim();

        if (!studentCedula || !studentNombre) continue;

        const studentEmail = `${studentCedula.replace(/[^A-Z0-9]/gi, '').toLowerCase()}@estudiante.iujo.edu.ve`;
        const studentId = upsertUsuario({
          cedula: studentCedula,
          nombre: studentNombre,
          rol: 'estudiante',
          email: studentEmail,
        });

        if (!studentId) continue;

        const existingInscripcion = db.prepare(`
          SELECT id FROM inscripciones WHERE estudiante_id = ? AND seccion_id = ?
        `).get(studentId, seccionRow.id);

        if (!existingInscripcion) {
          db.prepare(`
            INSERT INTO inscripciones (estudiante_id, seccion_id, evaluada, fecha_evaluacion)
            VALUES (?, ?, 0, NULL)
          `).run(studentId, seccionRow.id);
          sectionStudents += 1;
        }
      }

      processed += 1;
      studentsImported += sectionStudents;
      console.log(`OK ${relativePath} -> docente=${docenteCedula || '00000000'} materia=${materia.codigo} sección=${seccion} alumnos=${sectionStudents}`);
    } catch (error) {
      console.error(`ERROR ${relativePath}: ${error.message}`);
      skipped += 1;
    }
  }

  cleanupDuplicateUsers();

  const summary = db.prepare(`SELECT rol, COUNT(*) AS cnt FROM usuarios GROUP BY rol`).all();
  const totalInscripciones = db.prepare('SELECT COUNT(*) AS total FROM inscripciones').get().total;

  console.log('RESUMEN USUARIOS:', summary);
  console.log('TOTAL INSCRIPCIONES:', totalInscripciones);
  console.log(`IMPORTACION FINAL: procesados=${processed}, omitidos=${skipped}, estudiantes_agregados=${studentsImported}`);
})();
