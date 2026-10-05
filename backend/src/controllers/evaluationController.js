import db from '../config/database.js';

export function submitEvaluation(req, res) {
  try {
    const estudianteId = req.user.id;
    const { seccionId, answers, observaciones } = req.body;

    if (!seccionId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de sección requerido.'
      });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Debe responder las 15 preguntas de la evaluación.'
      });
    }

    // Validate that all 15 questions have an integer between 1 and 5
    const parsedAnswers = {};
    for (let i = 1; i <= 15; i++) {
      const key = `p${i}`;
      const val = parseInt(answers[key], 10);
      if (isNaN(val) || val < 1 || val > 5) {
        return res.status(400).json({
          success: false,
          message: `La pregunta número ${i} no tiene una puntuación válida (debe ser del 1 al 5).`
        });
      }
      parsedAnswers[key] = val;
    }

    const obsText = (observaciones && typeof observaciones === 'string') ? observaciones.trim() : null;

    // Use better-sqlite3 atomic transaction
    const executeAnonymousEvaluation = db.transaction(() => {
      // 1. Verify student enrollment and that it hasn't been evaluated yet
      const enrollment = db.prepare(`
        SELECT id, evaluada 
        FROM inscripciones 
        WHERE estudiante_id = ? AND seccion_id = ?
      `).get(estudianteId, seccionId);

      if (!enrollment) {
        throw new Error('NOT_ENROLLED');
      }

      if (enrollment.evaluada === 1) {
        throw new Error('ALREADY_EVALUATED');
      }

      // 2. Insert ANONYMOUS record into respuestas_evaluacion
      // NOTICE: NO estudiante_id is stored anywhere in this table!
      const insertStmt = db.prepare(`
        INSERT INTO respuestas_evaluacion (
          seccion_id, fecha,
          p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15,
          observaciones
        ) VALUES (
          @seccion_id, CURRENT_TIMESTAMP,
          @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15,
          @observaciones
        )
      `);

      insertStmt.run({
        seccion_id: seccionId,
        ...parsedAnswers,
        observaciones: obsText
      });

      // 3. Update student enrollment indicator to prevent double submissions
      const updateStmt = db.prepare(`
        UPDATE inscripciones 
        SET evaluada = 1, fecha_evaluacion = CURRENT_TIMESTAMP 
        WHERE estudiante_id = ? AND seccion_id = ?
      `);

      updateStmt.run(estudianteId, seccionId);

      return true;
    });

    try {
      executeAnonymousEvaluation();
    } catch (err) {
      if (err.message === 'NOT_ENROLLED') {
        return res.status(403).json({
          success: false,
          message: 'No se encuentra registrado en esta materia y sección.'
        });
      }
      if (err.message === 'ALREADY_EVALUATED') {
        return res.status(400).json({
          success: false,
          message: 'Esta materia ya fue evaluada previamente por su usuario. Gracias por su participación.'
        });
      }
      throw err;
    }

    return res.status(201).json({
      success: true,
      message: '¡Evaluación registrada con éxito! Tu respuesta ha sido almacenada de forma completamente anónima para garantizar tu privacidad y libre opinión.'
    });

  } catch (error) {
    console.error('Error al procesar la evaluación:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al guardar la evaluación. Por favor intente nuevamente.',
      error: error.message
    });
  }
}
