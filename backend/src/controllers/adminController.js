import db from '../config/database.js';

export function getAdminSummary(req, res) {
  try {
    const totalEstudiantes = db.prepare("SELECT COUNT(*) AS c FROM usuarios WHERE rol = 'estudiante'").get().c;
    const totalDocentes = db.prepare("SELECT COUNT(*) AS c FROM usuarios WHERE rol = 'docente'").get().c;
    const totalMaterias = db.prepare("SELECT COUNT(*) AS c FROM materias").get().c;
    const totalSecciones = db.prepare("SELECT COUNT(*) AS c FROM secciones WHERE periodo = '2-2026'").get().c;
    const totalInscripciones = db.prepare("SELECT COUNT(*) AS c FROM inscripciones").get().c;
    const totalEvaluadas = db.prepare("SELECT COUNT(*) AS c FROM inscripciones WHERE evaluada = 1").get().c;
    const totalRespuestas = db.prepare("SELECT COUNT(*) AS c FROM respuestas_evaluacion").get().c;

    const rankingDocentes = db.prepare(`
      SELECT 
        u.id, u.nombre, u.email,
        COUNT(r.id) AS total_evaluaciones,
        ROUND(AVG((r.p1+r.p2+r.p3+r.p4+r.p5+r.p6+r.p7+r.p8+r.p9+r.p10+r.p11+r.p12+r.p13+r.p14+r.p15)/15.0), 2) AS promedio
      FROM usuarios u
      INNER JOIN secciones s ON u.id = s.docente_id
      LEFT JOIN respuestas_evaluacion r ON s.id = r.seccion_id
      WHERE u.rol = 'docente' AND s.periodo = '2-2026'
      GROUP BY u.id, u.nombre
      HAVING total_evaluaciones > 0
      ORDER BY promedio DESC
    `).all();

    return res.json({
      success: true,
      data: {
        totalEstudiantes,
        totalDocentes,
        totalMaterias,
        totalSecciones,
        totalInscripciones,
        totalEvaluadas,
        totalRespuestas,
        rankingDocentes
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener resumen de administración.', error: error.message });
  }
}

export function getAllSections(req, res) {
  try {
    const secciones = db.prepare(`
      SELECT 
        s.id, s.codigo_materia, s.periodo, s.seccion, s.aula,
        m.nombre AS materia_nombre, m.semestre,
        u.id AS docente_id, u.nombre AS docente_nombre,
        (SELECT COUNT(*) FROM inscripciones WHERE seccion_id = s.id) AS total_alumnos,
        (SELECT COUNT(*) FROM inscripciones WHERE seccion_id = s.id AND evaluada = 1) AS alumnos_evaluaron,
        (SELECT COUNT(*) FROM respuestas_evaluacion WHERE seccion_id = s.id) AS total_respuestas
      FROM secciones s
      INNER JOIN materias m ON s.codigo_materia = m.codigo
      INNER JOIN usuarios u ON s.docente_id = u.id
      ORDER BY m.semestre ASC, m.nombre ASC, s.seccion ASC
    `).all();

    return res.json({ success: true, data: secciones });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener secciones.', error: error.message });
  }
}
