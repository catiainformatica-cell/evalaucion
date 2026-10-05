import db from '../config/database.js';

// Questions definitions matching user requirements exactly
export const EVALUATION_QUESTIONS = [
  { id: 1, key: 'p1', text: 'Al inicio del semestre el profesor dio a conocer los objetivos de la asignatura.', dimension: 'Planificación Inicial' },
  { id: 2, key: 'p2', text: 'Al inicio del semestre el profesor te solicitó tus posibilidades de conectividad.', dimension: 'Diagnóstico y Empatía' },
  { id: 3, key: 'p3', text: 'Al inicio del semestre dio a conocer el contrato de aprendizaje.', dimension: 'Planificación Inicial' },
  { id: 4, key: 'p4', text: 'El profesor establece normas a cumplir de manera consensuada con el grupo de estudiantes.', dimension: 'Convivencia y Normas' },
  { id: 5, key: 'p5', text: 'Informa a los estudiantes con anticipación la fecha de entrega de las asignaciones.', dimension: 'Organización y Tiempos' },
  { id: 6, key: 'p6', text: 'Propicia el intercambio comunicacional profesor-estudiante en su horario regular de clase (encuentro sincrónico).', dimension: 'Comunicación Sincrónica' },
  { id: 7, key: 'p7', text: 'El trato del profesor fue respetuoso y cortés con los estudiantes.', dimension: 'Relaciones Interpersonales' },
  { id: 8, key: 'p8', text: 'Devuelve las asignaciones corregidas y evaluadas en un tiempo ajustado al corte correspondiente.', dimension: 'Evaluación y Feedback' },
  { id: 9, key: 'p9', text: 'Relaciona los contenidos trabajados en la clase con el campo laboral y personal.', dimension: 'Pertinencia Práctica' },
  { id: 10, key: 'p10', text: 'Promueve el uso del aula virtual como una necesidad para las clases.', dimension: 'Entorno Virtual EVA' },
  { id: 11, key: 'p11', text: 'Se apoya en recursos virtuales para ofrecértelos de consulta a través del aula virtual EVA.', dimension: 'Entorno Virtual EVA' },
  { id: 12, key: 'p12', text: 'Realiza procesos de retroalimentación en foros.', dimension: 'Entorno Virtual EVA' },
  { id: 13, key: 'p13', text: 'Estimuló la participación activa de los estudiantes en cada encuentro sincrónico.', dimension: 'Estrategias Didácticas' },
  { id: 14, key: 'p14', text: 'Las estrategias didácticas empleadas en sus clases fueron apropiadas para el logro de los objetivos de aprendizaje.', dimension: 'Estrategias Didácticas' },
  { id: 15, key: 'p15', text: 'Redacta con claridad en forma escrita las instrucciones de las actividades que debes realizar en el Aula virtual.', dimension: 'Claridad Instruccional' }
];

export const LIKERT_OPTIONS = [
  { value: 5, label: 'Totalmente de acuerdo', shortLabel: 'T. de acuerdo', color: '#10B981', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-300' },
  { value: 4, label: 'Parcialmente de acuerdo', shortLabel: 'P. de acuerdo', color: '#3B82F6', badge: 'bg-blue-500/10 text-blue-600 border-blue-300' },
  { value: 3, label: 'De acuerdo', shortLabel: 'De acuerdo', color: '#F59E0B', badge: 'bg-amber-500/10 text-amber-600 border-amber-300' },
  { value: 2, label: 'Parcialmente en desacuerdo', shortLabel: 'P. desacuerdo', color: '#F97316', badge: 'bg-orange-500/10 text-orange-600 border-orange-300' },
  { value: 1, label: 'Totalmente en desacuerdo', shortLabel: 'T. desacuerdo', color: '#EF4444', badge: 'bg-rose-500/10 text-rose-600 border-rose-300' }
];

export function getStudentSubjects(req, res) {
  try {
    const estudianteId = req.user.id;
    const periodo = req.query.periodo || '2-2026';

    const query = `
      SELECT 
        i.id AS inscripcion_id,
        i.evaluada,
        i.fecha_evaluacion,
        s.id AS seccion_id,
        s.periodo,
        s.seccion,
        s.aula,
        m.codigo AS codigo_materia,
        m.nombre AS materia_nombre,
        m.semestre,
        m.creditos,
        u.id AS docente_id,
        u.nombre AS docente_nombre,
        u.email AS docente_email
      FROM inscripciones i
      INNER JOIN secciones s ON i.seccion_id = s.id
      INNER JOIN materias m ON s.codigo_materia = m.codigo
      INNER JOIN usuarios u ON s.docente_id = u.id
      WHERE i.estudiante_id = ? AND s.periodo = ?
      ORDER BY m.semestre ASC, m.nombre ASC
    `;

    const subjects = db.prepare(query).all(estudianteId, periodo);

    const total = subjects.length;
    const evaluadas = subjects.filter(s => s.evaluada === 1).length;
    const pendientes = total - evaluadas;
    const porcentajeProgreso = total > 0 ? Math.round((evaluadas / total) * 100) : 0;

    return res.json({
      success: true,
      data: {
        periodo,
        total,
        evaluadas,
        pendientes,
        porcentajeProgreso,
        materias: subjects
      }
    });
  } catch (error) {
    console.error('Error al obtener materias del estudiante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar las asignaturas inscritas.',
      error: error.message
    });
  }
}

export function getSectionForEvaluation(req, res) {
  try {
    const estudianteId = req.user.id;
    const seccionId = parseInt(req.params.seccionId, 10);

    const enrollment = db.prepare(`
      SELECT 
        i.id AS inscripcion_id,
        i.evaluada,
        i.fecha_evaluacion,
        s.id AS seccion_id,
        s.periodo,
        s.seccion,
        s.aula,
        m.codigo AS codigo_materia,
        m.nombre AS materia_nombre,
        m.semestre,
        m.creditos,
        u.id AS docente_id,
        u.nombre AS docente_nombre,
        u.email AS docente_email
      FROM inscripciones i
      INNER JOIN secciones s ON i.seccion_id = s.id
      INNER JOIN materias m ON s.codigo_materia = m.codigo
      INNER JOIN usuarios u ON s.docente_id = u.id
      WHERE i.estudiante_id = ? AND s.id = ?
    `).get(estudianteId, seccionId);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'No estás inscrito en esta sección o la asignatura no existe.'
      });
    }

    if (enrollment.evaluada === 1) {
      return res.status(400).json({
        success: false,
        evaluada: true,
        message: 'Ya has completado la evaluación para este docente en esta asignatura. El sistema garantiza una única respuesta por estudiante.'
      });
    }

    return res.json({
      success: true,
      data: {
        seccion: enrollment,
        preguntas: EVALUATION_QUESTIONS,
        escala: LIKERT_OPTIONS
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cargar formulario de evaluación.',
      error: error.message
    });
  }
}
