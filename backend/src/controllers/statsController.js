import db from '../config/database.js';
import { EVALUATION_QUESTIONS, LIKERT_OPTIONS } from './studentController.js';

export function getFilterOptions(req, res) {
  try {
    const isDocente = req.user.rol === 'docente';

    let docentesQuery = `
      SELECT DISTINCT u.id, u.nombre, u.email, u.cedula
      FROM usuarios u
      INNER JOIN secciones s ON u.id = s.docente_id
      WHERE u.rol = 'docente'
    `;
    const docentesParams = [];

    if (isDocente) {
      docentesQuery += ' AND u.id = ?';
      docentesParams.push(req.user.id);
    }

    docentesQuery += ' ORDER BY u.nombre ASC';
    const docentes = db.prepare(docentesQuery).all(...docentesParams);

    // Get subjects list
    let materiasQuery = `
      SELECT DISTINCT m.codigo, m.nombre, m.semestre, m.creditos
      FROM materias m
    `;
    const materiasParams = [];

    if (isDocente) {
      materiasQuery += `
        INNER JOIN secciones s ON m.codigo = s.codigo_materia
        WHERE s.docente_id = ?
      `;
      materiasParams.push(req.user.id);
    }
    materiasQuery += ' ORDER BY m.semestre ASC, m.nombre ASC';
    const materias = db.prepare(materiasQuery).all(...materiasParams);

    // Get periods
    const periodos = db.prepare('SELECT DISTINCT periodo FROM secciones ORDER BY periodo DESC').all().map(r => r.periodo);

    // Get sections list
    let seccionesQuery = `
      SELECT s.id, s.codigo_materia, s.seccion, s.periodo, s.docente_id,
             m.nombre AS materia_nombre, u.nombre AS docente_nombre
      FROM secciones s
      INNER JOIN materias m ON s.codigo_materia = m.codigo
      INNER JOIN usuarios u ON s.docente_id = u.id
    `;
    const seccionesParams = [];
    if (isDocente) {
      seccionesQuery += ' WHERE s.docente_id = ?';
      seccionesParams.push(req.user.id);
    }
    seccionesQuery += ' ORDER BY s.periodo DESC, m.nombre ASC, s.seccion ASC';
    const secciones = db.prepare(seccionesQuery).all(...seccionesParams);

    return res.json({
      success: true,
      data: {
        docentes,
        materias,
        periodos,
        secciones
      }
    });
  } catch (error) {
    console.error('Error al obtener opciones de filtro:', error);
    return res.status(500).json({ success: false, message: 'Error al cargar filtros.', error: error.message });
  }
}

export function getStats(req, res) {
  try {
    const isDocente = req.user.rol === 'docente';
    const docenteIdFilter = isDocente ? req.user.id : (req.query.docenteId ? parseInt(req.query.docenteId, 10) : null);
    const materiaCodigoFilter = req.query.materiaCodigo || null;
    const seccionIdFilter = req.query.seccionId ? parseInt(req.query.seccionId, 10) : null;
    const periodoFilter = req.query.periodo || '2-2026';

    // Build conditions for matching sections
    let whereClauses = ['s.periodo = ?'];
    let params = [periodoFilter];

    if (docenteIdFilter) {
      whereClauses.push('s.docente_id = ?');
      params.push(docenteIdFilter);
    }

    if (materiaCodigoFilter && materiaCodigoFilter !== 'all') {
      whereClauses.push('s.codigo_materia = ?');
      params.push(materiaCodigoFilter);
    }

    if (seccionIdFilter && seccionIdFilter !== 'all') {
      whereClauses.push('s.id = ?');
      params.push(seccionIdFilter);
    }

    const whereSql = whereClauses.join(' AND ');

    // 1. Total Enrolled Students in matched sections
    const enrollmentStats = db.prepare(`
      SELECT 
        COUNT(i.id) AS total_inscritos,
        SUM(CASE WHEN i.evaluada = 1 THEN 1 ELSE 0 END) AS total_evaluadas_inscripcion
      FROM inscripciones i
      INNER JOIN secciones s ON i.seccion_id = s.id
      WHERE ${whereSql}
    `).get(...params);

    const totalInscritos = enrollmentStats ? (enrollmentStats.total_inscritos || 0) : 0;

    // 2. Fetch all matching evaluation responses
    const responsesQuery = `
      SELECT 
        r.id,
        r.seccion_id,
        r.fecha,
        r.p1, r.p2, r.p3, r.p4, r.p5,
        r.p6, r.p7, r.p8, r.p9, r.p10,
        r.p11, r.p12, r.p13, r.p14, r.p15,
        r.observaciones,
        s.seccion,
        s.codigo_materia,
        m.nombre AS materia_nombre,
        u.nombre AS docente_nombre
      FROM respuestas_evaluacion r
      INNER JOIN secciones s ON r.seccion_id = s.id
      INNER JOIN materias m ON s.codigo_materia = m.codigo
      INNER JOIN usuarios u ON s.docente_id = u.id
      WHERE ${whereSql}
      ORDER BY r.fecha DESC
    `;

    const responses = db.prepare(responsesQuery).all(...params);
    const totalRespuestas = responses.length;

    // 3. Calculate per-item averages and Likert frequency distribution
    const itemStats = EVALUATION_QUESTIONS.map(q => {
      const key = q.key;
      const values = responses.map(r => r[key]);

      let sum = 0;
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      values.forEach(v => {
        sum += v;
        if (distribution[v] !== undefined) {
          distribution[v]++;
        }
      });

      const avg = totalRespuestas > 0 ? parseFloat((sum / totalRespuestas).toFixed(2)) : 0;

      const distributionPercent = {};
      Object.keys(distribution).forEach(star => {
        const count = distribution[star];
        distributionPercent[star] = totalRespuestas > 0 ? Math.round((count / totalRespuestas) * 100) : 0;
      });

      return {
        ...q,
        average: avg,
        totalVotes: totalRespuestas,
        distribution,
        distributionPercent
      };
    });

    // 4. Global Average Calculation
    let globalSum = 0;
    itemStats.forEach(item => {
      globalSum += item.average;
    });
    const promedioGlobal = itemStats.length > 0 && totalRespuestas > 0
      ? parseFloat((globalSum / itemStats.length).toFixed(2))
      : 0;

    const porcentajeSatisfaccion = parseFloat(((promedioGlobal / 5) * 100).toFixed(1));
    const tasaParticipacion = totalInscritos > 0
      ? parseFloat(((totalRespuestas / totalInscritos) * 100).toFixed(1))
      : 0;

    let calificacionCualitativa = 'Sin datos';
    let calificacionColor = 'text-slate-400';
    if (totalRespuestas > 0) {
      if (promedioGlobal >= 4.5) {
        calificacionCualitativa = 'Excelente / Sobresaliente';
        calificacionColor = 'text-emerald-600';
      } else if (promedioGlobal >= 4.0) {
        calificacionCualitativa = 'Muy Bueno';
        calificacionColor = 'text-blue-600';
      } else if (promedioGlobal >= 3.0) {
        calificacionCualitativa = 'Satisfactorio / Aceptable';
        calificacionColor = 'text-amber-600';
      } else if (promedioGlobal >= 2.0) {
        calificacionCualitativa = 'Regular / Requiere Plan de Mejora';
        calificacionColor = 'text-orange-600';
      } else {
        calificacionCualitativa = 'Deficiente / Crítico';
        calificacionColor = 'text-rose-600';
      }
    }

    // 5. Pedagogical Dimensions Analysis for Radar Chart
    const dimensionMapping = {
      'Planificación y Normas': ['p1', 'p3', 'p4'],
      'Comunicación y Trato': ['p2', 'p6', 'p7'],
      'Evaluación y Devolución': ['p5', 'p8'],
      'Entorno Virtual EVA': ['p10', 'p11', 'p12', 'p15'],
      'Estrategias Didácticas': ['p9', 'p13', 'p14']
    };

    const dimensionStats = Object.keys(dimensionMapping).map(dimName => {
      const keys = dimensionMapping[dimName];
      const relatedItems = itemStats.filter(item => keys.includes(item.key));
      const dimSum = relatedItems.reduce((acc, curr) => acc + curr.average, 0);
      const dimAvg = relatedItems.length > 0 ? parseFloat((dimSum / relatedItems.length).toFixed(2)) : 0;
      return {
        dimension: dimName,
        promedio: dimAvg,
        porcentaje: parseFloat(((dimAvg / 5) * 100).toFixed(1)),
        preguntasAsociadas: keys
      };
    });

    // 6. Anonymous Comments list
    const comentarios = responses
      .filter(r => r.observaciones && r.observaciones.trim().length > 0)
      .map(r => ({
        id: r.id,
        fecha: r.fecha,
        texto: r.observaciones,
        materia: `${r.codigo_materia} - ${r.materia_nombre}`,
        seccion: r.seccion,
        docente: r.docente_nombre
      }));

    return res.json({
      success: true,
      data: {
        filtrosAplicados: {
          periodo: periodoFilter,
          docenteId: docenteIdFilter,
          materiaCodigo: materiaCodigoFilter,
          seccionId: seccionIdFilter
        },
        metricasGenerales: {
          promedioGlobal,
          porcentajeSatisfaccion,
          totalRespuestas,
          totalInscritos,
          tasaParticipacion,
          calificacionCualitativa,
          calificacionColor
        },
        itemStats,
        dimensionStats,
        comentarios,
        escala: LIKERT_OPTIONS
      }
    });
  } catch (error) {
    console.error('Error al generar estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al compilar las estadísticas de evaluación docente.',
      error: error.message
    });
  }
}
