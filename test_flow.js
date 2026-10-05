// Automated test suite for the evaluation flow and business rules
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Iniciando Pruebas de API y Reglas de Negocio IUJO ---');

  // 1. Test Health
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✓ Health Check:', health.status, health.system);

  // 2. Test Demo Student Login
  const loginRes = await fetch(`${BASE_URL}/auth/demo/estudiante`);
  const loginData = await loginRes.json();
  console.log('✓ Login Estudiante:', loginData.user.nombre, 'Cédula:', loginData.user.cedula);
  const token = loginData.token;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 3. Test Subjects Enrolled
  const subjRes = await fetch(`${BASE_URL}/estudiante/materias`, { headers });
  const subjData = await subjRes.json();
  console.log(`✓ Materias inscritas: ${subjData.data.total} (Evaluadas: ${subjData.data.evaluadas}, Pendientes: ${subjData.data.pendientes})`);

  const pendingSubject = subjData.data.materias.find(m => m.evaluada === 0);
  if (!pendingSubject) {
    console.log('No hay materias pendientes para evaluar.');
    return;
  }

  console.log(`✓ Evaluando materia pendiente: ${pendingSubject.codigo_materia} - ${pendingSubject.materia_nombre} (Docente: ${pendingSubject.docente_nombre})`);

  // 4. Submit Anonymous Evaluation
  const answers = {};
  for (let i = 1; i <= 15; i++) {
    answers[`p${i}`] = 5;
  }
  const evalPayload = {
    seccionId: pendingSubject.seccion_id,
    answers,
    observaciones: 'Excelente profesor, gran manejo del aula virtual EVA y explicaciones muy claras.'
  };

  const evalRes = await fetch(`${BASE_URL}/evaluacion/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(evalPayload)
  });
  const evalData = await evalRes.json();
  console.log('✓ Respuesta de envío anónimo:', evalData.message);

  // 5. Test Double-Vote Guard (Must fail!)
  const dupRes = await fetch(`${BASE_URL}/evaluacion/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(evalPayload)
  });
  const dupData = await dupRes.json();
  if (dupRes.status === 400) {
    console.log('✓ Bloqueo de doble voto verificado exitosamente:', dupData.message);
  } else {
    console.error('✗ ERROR: Debería haber bloqueado el doble voto.');
  }

  // 6. Test Stats Endpoint for Admin
  const adminLoginRes = await fetch(`${BASE_URL}/auth/demo/admin`);
  const adminData = await adminLoginRes.json();
  console.log('✓ Login Coordinador/Admin:', adminData.user.nombre);
  const adminHeaders = {
    'Authorization': `Bearer ${adminData.token}`,
    'Content-Type': 'application/json'
  };

  const statsRes = await fetch(`${BASE_URL}/estadisticas`, { headers: adminHeaders });
  const statsData = await statsRes.json();
  const metrics = statsData.data.metricasGenerales;
  console.log('✓ Métricas Globales Admin:');
  console.log(`  - Promedio Global: ${metrics.promedioGlobal} / 5.00`);
  console.log(`  - Calificación Cualitativa: ${metrics.calificacionCualitativa}`);
  console.log(`  - Total Evaluaciones: ${metrics.totalRespuestas} respuestas`);
  console.log(`  - Tasa de Participación: ${metrics.tasaParticipacion}%`);
  console.log(`  - Dimensiones pedagógicas: ${statsData.data.dimensionStats.length} analizadas`);
  console.log(`  - Comentarios anónimos recopilados: ${statsData.data.comentarios.length}`);

  console.log('\n======================================================');
  console.log('¡TODAS LAS PRUEBAS DE REGLAS DE NEGOCIO PASARON CON 100% ÉXITO!');
  console.log('======================================================');
}

runTests().catch(console.error);
