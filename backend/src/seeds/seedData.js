import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../config/database.js';

export function runSeeds() {
  console.log('--- Iniciando Semillas de Base de Datos IUJO Informática ---');
  initDatabase();

  // Clear existing data in correct order
  db.exec(`
    DELETE FROM respuestas_evaluacion;
    DELETE FROM inscripciones;
    DELETE FROM secciones;
    DELETE FROM materias;
    DELETE FROM usuarios;
  `);

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = (pw) => bcrypt.hashSync(pw, salt);

  // 1. Usuarios
  const insertUser = db.prepare(`
    INSERT INTO usuarios (cedula, nombre, email, password, rol, carrera)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Administrador / Coordinación
  insertUser.run('V-12345678', 'Gabriel Martinez', 'coordinacion.informatica@iujo.edu.ve', hashPassword('admin123'), 'admin', 'Informática');

  // Docentes
  insertUser.run('V-14567890', 'Prof. María Elena Rodríguez', 'mrodriguez@iujo.edu.ve', hashPassword('docente123'), 'docente', 'Informática');
  insertUser.run('V-15678901', 'Prof. Roberto Alarcón', 'ralarcon@iujo.edu.ve', hashPassword('docente123'), 'docente', 'Informática');
  insertUser.run('V-16789012', 'Prof. Gabriel Colmenarez', 'gcolmenarez@iujo.edu.ve', hashPassword('docente123'), 'docente', 'Informática');
  insertUser.run('V-17890123', 'Prof. Carmen Luisa Pérez', 'cperez@iujo.edu.ve', hashPassword('docente123'), 'docente', 'Informática');
  insertUser.run('V-18901234', 'Prof. David Zambrano', 'dzambrano@iujo.edu.ve', hashPassword('docente123'), 'docente', 'Informática');

  // Estudiantes principales
  insertUser.run('V-28123456', 'Andrés Gil', 'agil@estudiante.iujo.edu.ve', hashPassword('estudiante123'), 'estudiante', 'Informática');
  insertUser.run('V-29456789', 'Valeria Morales', 'vmorales@estudiante.iujo.edu.ve', hashPassword('estudiante123'), 'estudiante', 'Informática');
  insertUser.run('V-27987654', 'Jesús Santana', 'jsantana@estudiante.iujo.edu.ve', hashPassword('estudiante123'), 'estudiante', 'Informática');
  insertUser.run('V-30112233', 'Mariana Castillo', 'mcastillo@estudiante.iujo.edu.ve', hashPassword('estudiante123'), 'estudiante', 'Informática');
  insertUser.run('V-28998877', 'Diego Rivas', 'drivas@estudiante.iujo.edu.ve', hashPassword('estudiante123'), 'estudiante', 'Informática');

  // Estudiantes adicionales para alimentar estadísticas de muestra
  for (let i = 1; i <= 25; i++) {
    const ced = `V-29000${100 + i}`;
    insertUser.run(ced, `Estudiante de Prueba ${i}`, `estudiante${i}@estudiante.iujo.edu.ve`, hashPassword('estudiante123'), 'estudiante', 'Informática');
  }

  // 2. Materias de Informática IUJO
  const insertMateria = db.prepare(`
    INSERT INTO materias (codigo, nombre, semestre, creditos, carrera)
    VALUES (?, ?, ?, ?, 'Informática')
  `);

  // 1er semestre
  insertMateria.run('FOC-100', 'FORMACION COMPLEMENTARIA I', 1, 0);
  insertMateria.run('ING-143', 'INGLES I', 1, 3);
  insertMateria.run('INI-154', 'INTRODUCCION A LA INFORMATICA', 1, 4);
  insertMateria.run('LEC-143', 'LENGUAJE Y COMUNICACION I', 1, 3);
  insertMateria.run('LOC-154', 'LOGICA COMPUTACIONAL', 1, 4);
  insertMateria.run('MAT-165', 'MATEMATICA I', 1, 5);
  insertMateria.run('RSP-133', 'REALIDAD SOCIAL Y POLITICA DE VENEZUELA', 1, 3);
  insertMateria.run('TID-122', 'TECNICAS DE INVESTIGACION DOCUMENTAL', 1, 2);

  // 2do semestre
  insertMateria.run('ACC-220', 'ACTIVIDADES COMPLEMENTARIAS (Ed.Física)', 2, 0);
  insertMateria.run('ALP-265', 'ALGORITMO Y PROGRAMACION I', 2, 5);
  insertMateria.run('ANF-233', 'ANTROPOLOGIA FILOSOFICA', 2, 3);
  insertMateria.run('ARC-265', 'ARQUITECTURA Y ESTRUCTURA DEL COMPUTADOR', 2, 5);
  insertMateria.run('CAL-265', 'CALCULO I', 2, 5);
  insertMateria.run('FOC-200', 'FORMACION COMPLEMENTARIA II', 2, 0);
  insertMateria.run('ING-243', 'INGLES II', 2, 3);

  // 3er semestre
  insertMateria.run('ALP-365', 'ALGORITMO Y PROGRAMACION II', 3, 5);
  insertMateria.run('CAL-365', 'CALCULO II', 3, 5);
  insertMateria.run('ESA-343', 'ESTADISTICA I', 3, 3);
  insertMateria.run('FOC-300', 'FORMACION COMPLEMENTARIA III', 3, 0);
  insertMateria.run('INS-354', 'INGENIERIA DEL SOFTWARE', 3, 4);
  insertMateria.run('IGL-332', 'INGLES III', 3, 2);

  // 4to semestre
  insertMateria.run('ADE-433', 'ADMINISTRACION DE EMPRESAS', 4, 3);
  insertMateria.run('ADS-433', 'ANALISIS Y DISEÑO DE SISTEMAS', 4, 3);
  insertMateria.run('ARC-454', 'ARQUITECTURA DE REDES DE COMPUTADORES', 4, 4);
  insertMateria.run('ESA-444', 'ESTADISTICA APLICADA', 4, 4);
  insertMateria.run('FOC-400', 'FORMACION COMPLEMENTARIA IV', 4, 0);
  insertMateria.run('SBD-454', 'SISTEMA DE BASE DE DATOS', 4, 4);
  insertMateria.run('SIO-454', 'SISTEMA DE OPERACION I', 4, 4);

  // 5to semestre
  insertMateria.run('CON-544', 'CONTABILIDAD COMPUTARIZADA', 5, 4);
  insertMateria.run('ETF-522', 'ETICA FUNDAMENTAL', 5, 2);
  insertMateria.run('FOC-500', 'FORMACION COMPLEMENTARIA V', 5, 0);
  insertMateria.run('INU-554', 'INTERFACES WEB CON EL USUARIO', 5, 4);
  insertMateria.run('INO-544', 'INVESTIGACION DE OPERACIONES', 5, 4);
  insertMateria.run('MEI-522', 'METODOLOGIA DE LA INVESTIGACION', 5, 2);
  insertMateria.run('SDI-554', 'SISTEMAS DE INFORMACION GERENCIAL', 5, 4);
  insertMateria.run('SIO-554', 'SISTEMAS OPERATIVOS II', 5, 4);

  // 6to semestre
  insertMateria.run('ELT-622', 'ELECTIVA:', 6, 2);
  insertMateria.run('FOC-600', 'FORMACION COMPLEMENTARIA VI', 6, 0);
  insertMateria.run('PAP-604', 'PASANTIA PROFESIONAL', 6, 4);
  insertMateria.run('TEG-606', 'TRABAJO ESPECIAL DE GRADO', 6, 6);

  // 3. Secciones Periodo 2-2026
  const insertSeccion = db.prepare(`
    INSERT INTO secciones (codigo_materia, docente_id, periodo, seccion, aula)
    VALUES (?, ?, '2-2026', ?, ?)
  `);

  const docentesList = db.prepare("SELECT id, nombre FROM usuarios WHERE rol = 'docente' ORDER BY id ASC").all();
  const dRod = docentesList[0].id; // María Elena Rodríguez (DWE / BDD)
  const dAla = docentesList[1].id; // Roberto Alarcón (RED / SEG)
  const dCol = docentesList[2].id; // Gabriel Colmenarez (ALP / POO)
  const dPer = docentesList[3].id; // Carmen Luisa Pérez (SOP / ARC)
  const dZam = docentesList[4].id; // David Zambrano (ISO / TED)

  insertSeccion.run('INU-554', dRod, 'A', 'Lab 3 / EVA IUJO');
  insertSeccion.run('SBD-454', dRod, 'A', 'Lab 2 / EVA IUJO');
  insertSeccion.run('ARC-454', dAla, 'A', 'Lab Redes / EVA IUJO');
  insertSeccion.run('SIO-454', dPer, 'A', 'Lab 4 / EVA IUJO');
  insertSeccion.run('ALP-265', dCol, 'A', 'Lab 2 / EVA IUJO');
  insertSeccion.run('INI-154', dZam, 'A', 'Lab 1 / EVA IUJO');
  insertSeccion.run('INS-354', dCol, 'A', 'Aula 12 / EVA IUJO');
  insertSeccion.run('ADS-433', dZam, 'A', 'Aula 10 / EVA IUJO');
  insertSeccion.run('MAT-165', dZam, 'A', 'Aula 11 / EVA IUJO');
  insertSeccion.run('SIO-554', dPer, 'B', 'Lab 4 / EVA IUJO');

  // 4. Inscripciones para Andrés Gil (Cédula: V-28123456)
  // Inscrito en: INU-554 (Sección A), SBD-454 (Sección A), ARC-454 (Sección A), SIO-454 (Sección A)
  const andres = db.prepare("SELECT id FROM usuarios WHERE cedula = 'V-28123456'").get();
  const secINU = db.prepare("SELECT id FROM secciones WHERE codigo_materia = 'INU-554' AND seccion = 'A'").get().id;
  const secSBD = db.prepare("SELECT id FROM secciones WHERE codigo_materia = 'SBD-454' AND seccion = 'A'").get().id;
  const secARC = db.prepare("SELECT id FROM secciones WHERE codigo_materia = 'ARC-454' AND seccion = 'A'").get().id;
  const secSIO = db.prepare("SELECT id FROM secciones WHERE codigo_materia = 'SIO-454' AND seccion = 'A'").get().id;

  const insertInscripcion = db.prepare(`
    INSERT INTO inscripciones (estudiante_id, seccion_id, evaluada, fecha_evaluacion)
    VALUES (?, ?, ?, ?)
  `);

  // Andrés tiene INU evaluada, y las otras 3 pendientes para probar
  insertInscripcion.run(andres.id, secINU, 1, '2026-09-20 10:15:00');
  insertInscripcion.run(andres.id, secSBD, 0, null);
  insertInscripcion.run(andres.id, secARC, 0, null);
  insertInscripcion.run(andres.id, secSIO, 0, null);

  // Inscribir a los demás alumnos en las secciones para tener estadísticas realistas
  const allStudents = db.prepare("SELECT id FROM usuarios WHERE rol = 'estudiante' AND id != ?").all(andres.id);
  const allSections = db.prepare("SELECT id FROM secciones").all();

  const insertAnonEvaluation = db.prepare(`
    INSERT INTO respuestas_evaluacion (
      seccion_id, fecha,
      p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15,
      observaciones
    ) VALUES (
      ?, datetime('now', ?),
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?
    )
  `);

  const sampleComments = [
    'Excelente docente, siempre puntual en las sesiones sincrónicas y con materiales actualizados en el aula EVA.',
    'Explica con mucha paciencia los temas complejos de programación. Muy recomendable.',
    'Las evaluaciones se ajustaron al contrato de aprendizaje. Buen acompañamiento en las dudas por el foro.',
    'Sería ideal que las devoluciones de las asignaciones se entreguen un poco más rápido para poder corregir a tiempo.',
    'Gran profesionalismo y respeto hacia todos los compañeros de clase.',
    'Sus ejemplos prácticos orientados a problemas reales de la industria facilitaron mucho la comprensión.',
    'El contrato de aprendizaje se discutió desde la primera semana de manera consensuada.',
    'Excelente dinamismo en los foros de debate del aula virtual. Siempre atento.',
    'Muy buena disposición para resolver dudas fuera del horario sincrónico.',
    null,
    null
  ];

  let evalCounter = 0;

  allStudents.forEach((student, sIdx) => {
    // Inscribe a cada estudiante en 3 o 4 secciones aleatorias
    const mySections = allSections.filter((_, idx) => (idx + sIdx) % 3 === 0 || (idx + sIdx) % 2 === 0);

    mySections.forEach((sec, idxSec) => {
      // 70% de probabilidad de que ya haya evaluado
      const alreadyEvaluated = (sIdx + idxSec) % 4 !== 0;

      insertInscripcion.run(
        student.id,
        sec.id,
        alreadyEvaluated ? 1 : 0,
        alreadyEvaluated ? '2026-09-22 14:30:00' : null
      );

      if (alreadyEvaluated) {
        evalCounter++;
        // Generate realistic high-scoring Likert ratings with healthy variety
        const randomScore = () => {
          const r = Math.random();
          if (r < 0.65) return 5;
          if (r < 0.85) return 4;
          if (r < 0.95) return 3;
          if (r < 0.98) return 2;
          return 1;
        };

        const comment = sampleComments[evalCounter % sampleComments.length];
        const daysAgo = `-${Math.floor(Math.random() * 15)} days`;

        insertAnonEvaluation.run(
          sec.id,
          daysAgo,
          randomScore(), randomScore(), randomScore(), randomScore(), randomScore(),
          randomScore(), randomScore(), randomScore(), randomScore(), randomScore(),
          randomScore(), randomScore(), randomScore(), randomScore(), randomScore(),
          comment
        );
      }
    });
  });

  // Also insert the evaluation corresponding to Andrés Gil's already evaluated course (anonymous)
  insertAnonEvaluation.run(
    secINU,
    '-9 days',
    5, 5, 5, 4, 5,
    5, 5, 4, 5, 5,
    5, 4, 5, 5, 5,
    'La profesora María Elena Rodríguez es excelente explicando Interfaces Web. El proyecto final fue muy formativo.'
  );

  console.log('--- Semillas creadas con éxito! ---');
  console.log(`Usuarios creados: ${db.prepare('SELECT COUNT(*) AS c FROM usuarios').get().c}`);
  console.log(`Materias creadas: ${db.prepare('SELECT COUNT(*) AS c FROM materias').get().c}`);
  console.log(`Secciones creadas: ${db.prepare('SELECT COUNT(*) AS c FROM secciones').get().c}`);
  console.log(`Inscripciones creadas: ${db.prepare('SELECT COUNT(*) AS c FROM inscripciones').get().c}`);
  console.log(`Evaluaciones anónimas registradas: ${db.prepare('SELECT COUNT(*) AS c FROM respuestas_evaluacion').get().c}`);
}

// If run directly via node
if (process.argv[1].endsWith('seedData.js')) {
  runSeeds();
}
