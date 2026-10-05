import bcrypt from 'bcryptjs';
import db from '../config/database.js';

function run() {
  console.log('--- Añadiendo estudiantes y docente de Estadística I ---');

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = (pw) => bcrypt.hashSync(pw, salt);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO usuarios (cedula, nombre, email, password, rol, carrera)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updatePassword = db.prepare(`
    UPDATE usuarios SET password = ? WHERE cedula = ?
  `);

  // Docente
  insertUser.run(
    'V-27792193',
    'Prof. Leonaly Alejandra Cote Sequeida',
    'lcote@iujo.edu.ve',
    hashPassword('docente123'),
    'docente',
    'Informática'
  );

  const docente = db.prepare("SELECT id FROM usuarios WHERE cedula = 'V-27792193'").get();
  if (!docente) {
    console.error("No se pudo obtener la docente insertada.");
    return;
  }

  // Insertar o obtener materia (Estadística I es ESA-343)
  const materiaCodigo = 'ESA-343';
  const materia = db.prepare("SELECT codigo FROM materias WHERE codigo = ?").get(materiaCodigo);
  if (!materia) {
    db.prepare(`INSERT INTO materias (codigo, nombre, semestre, creditos, carrera) VALUES (?, ?, ?, ?, 'Informática')`)
      .run(materiaCodigo, 'ESTADISTICA I', 3, 3);
  }

  // Crear secciones D y B
  const insertSeccion = db.prepare(`
    INSERT INTO secciones (codigo_materia, docente_id, periodo, seccion, aula)
    VALUES (?, ?, '2-2026', ?, ?)
  `);

  // Limpiar posibles secciones anteriores de esta profe/materia para evitar duplicados en este script temporal
  db.prepare("DELETE FROM secciones WHERE codigo_materia = ? AND docente_id = ? AND periodo = '2-2026'").run(materiaCodigo, docente.id);

  insertSeccion.run(materiaCodigo, docente.id, 'D', 'Aula Virtual / EVA IUJO');
  insertSeccion.run(materiaCodigo, docente.id, 'B', 'Aula Virtual / EVA IUJO');

  const secD = db.prepare("SELECT id FROM secciones WHERE codigo_materia = ? AND seccion = 'D'").get(materiaCodigo).id;
  const secB = db.prepare("SELECT id FROM secciones WHERE codigo_materia = ? AND seccion = 'B'").get(materiaCodigo).id;

  const estudiantesD = [
    { cedula: "V-26745362", nombre: "Alvarado Vargas, Juan Félix" },
    { cedula: "V-30519931", nombre: "Bermudez Pérez, Santiago Alberto" },
    { cedula: "V-17562841", nombre: "Betancourt Vargas, Mayerling Del Valle" },
    { cedula: "V-31549004", nombre: "Cardenas Moros, Mijael Alfonso" },
    { cedula: "V-30282476", nombre: "Carrillo Quintana, Daniel Alejandro" },
    { cedula: "V-32514638", nombre: "Contreras Hernández, Samuel David" },
    { cedula: "V-30712268", nombre: "Garcia Rodriguez, Allan Isnaldy" },
    { cedula: "V-29921805", nombre: "Garrido Rodriguez, César Augusto" },
    { cedula: "V-30908248", nombre: "Hernandez Ysaba, Paulina Alejandra" },
    { cedula: "V-31249605", nombre: "Jimenez Diaz, Ricardo Alejandro" },
    { cedula: "V-27377139", nombre: "Mendoza García, Alejandro Alberto" },
    { cedula: "V-33391704", nombre: "Moreno Ortíz, Víctor Manuel" },
    { cedula: "V-31777913", nombre: "Obregon Nieves, Leandro Javier" },
    { cedula: "V-30872044", nombre: "Ortiz Verdu, Steven Isacc" },
    { cedula: "V-31797987", nombre: "Oscechas Reyes, Serwin Daniel" },
    { cedula: "V-20630109", nombre: "Perez Herrera, Pedro Manuel" },
    { cedula: "V-31047561", nombre: "Rivas Perez, Johan Miguel" },
    { cedula: "V-31841301", nombre: "Rojas Briceño, Jhaili María" },
    { cedula: "V-31777402", nombre: "Rojas Gonzalez, Dionel Alejandro" },
    { cedula: "V-31126974", nombre: "Salas Lira, Alejandro Jose" },
    { cedula: "V-30831927", nombre: "Salazar Rivero, Angelo Saul" },
    { cedula: "V-30520571", nombre: "Santana Veliz, Wilderme David" },
    { cedula: "V-30991822", nombre: "Santiago Zambrano, Juan David" },
    { cedula: "V-31761541", nombre: "Sepulveda Gomez, Santiago Abrahan" },
    { cedula: "V-27569751", nombre: "Simancas Querales, Paola Susej" },
    { cedula: "V-30552111", nombre: "Solis Ramirez, Anyelo Dany" },
    { cedula: "V-30560962", nombre: "Soto Zambrano, Yoiber Andres" },
    { cedula: "V-31455057", nombre: "Toro Farfan, Ricardo Alejandro" },
    { cedula: "V-30552349", nombre: "Uranga Peraza, Aniel Antonio" },
    { cedula: "V-31939908", nombre: "Uzcategui Hernández , Wuiston David" },
    { cedula: "E-84611191", nombre: "Valdes Mirabal, Mauro Jesús" },
    { cedula: "V-30942665", nombre: "Valdes Martinez, Kenny Jose" },
    { cedula: "V-32448652", nombre: "Valle Monascal, Jeremy Omael" },
    { cedula: "V-32473326", nombre: "Valllenilla Bermudez, Jhonny Jesuan" },
    { cedula: "V-29666184", nombre: "Vergara Hurtado, Eduardo David" },
    { cedula: "V-32074493", nombre: "Zorrilla Rodriguez, Julio Cesar" }
  ];

  const estudiantesB = [
    { cedula: "V-32299805", nombre: "Gomes Mejia, Sebastian Jose" },
    { cedula: "V-31341476", nombre: "Gomez Perez, Eliecer Andres" },
    { cedula: "V-20220343", nombre: "Jara Angulo, Said Moises" },
    { cedula: "V-30170635", nombre: "Martínez Silva, Oscar Alexis" },
    { cedula: "V-31323558", nombre: "Moran Amas, Jeremy Alexander" },
    { cedula: "V-32514453", nombre: "Rocha Gallardo, Alejandro José" },
    { cedula: "V-32448132", nombre: "Rodriguez Galea, Deivi Johan" },
    { cedula: "V-32514699", nombre: "Rodríguez Ochoa, Johandry José" },
    { cedula: "V-32088668", nombre: "Rodríguez Vergara, Newman Ricardo" },
    { cedula: "V-32353465", nombre: "Rojas Gonzalez, Freimir Daniel" },
    { cedula: "V-31927124", nombre: "Romero Cabrera, Angelica Valentina" },
    { cedula: "V-30658535", nombre: "Rondón Carmona, María Fernanda" },
    { cedula: "V-32805734", nombre: "Salias Gomez, Carlos Abrahan" },
    { cedula: "V-32951163", nombre: "Sanchez Vegas, Aaron Andres" },
    { cedula: "V-32565294", nombre: "Sandoval Noya, Rainielys Andrea" },
    { cedula: "V-32554264", nombre: "Suarez Garcia, Natalia Aurora" },
    { cedula: "V-31807430", nombre: "Suarez Salcedo, Raysmary Yaileth" },
    { cedula: "V-32361679", nombre: "Teran Diaz, Solimar Nazareth" },
    { cedula: "V-32112128", nombre: "Tineo Duque, Jharomy Eduardo" },
    { cedula: "V-31777842", nombre: "Uranga Peraza, Alberth Daniel" },
    { cedula: "V-30942422", nombre: "Urquiola Diaz, Ana Paula" },
    { cedula: "V-24313043", nombre: "Valero Sanchez, Cesar José" },
    { cedula: "V-32865011", nombre: "Vanegas Montilla, Michael Jesús" },
    { cedula: "V-32353074", nombre: "Villamizar Betancourt, Andres Enrique" }
  ];

  const insertInscripcion = db.prepare(`
    INSERT INTO inscripciones (estudiante_id, seccion_id, evaluada, fecha_evaluacion)
    VALUES (?, ?, 0, null)
  `);

  let countInscritos = 0;

  const procesarEstudiantes = (estudiantes, seccionId) => {
    for (const est of estudiantes) {
      // Contraseña = su propia cédula
      const email = est.cedula.toLowerCase() + '@estudiante.iujo.edu.ve';
      insertUser.run(est.cedula, est.nombre, email, hashPassword(est.cedula), 'estudiante', 'Informática');
      // Si el usuario ya existía, actualizamos su contraseña a la cédula
      updatePassword.run(hashPassword(est.cedula), est.cedula);

      const user = db.prepare("SELECT id FROM usuarios WHERE cedula = ?").get(est.cedula);
      if (user) {
        // Limpiar inscripciones previas en esta seccion (por si se ejecuta el script 2 veces)
        db.prepare("DELETE FROM inscripciones WHERE estudiante_id = ? AND seccion_id = ?").run(user.id, seccionId);
        insertInscripcion.run(user.id, seccionId);
        countInscritos++;
      }
    }
  };

  procesarEstudiantes(estudiantesD, secD);
  procesarEstudiantes(estudiantesB, secB);

  console.log('--- Proceso exitoso ---');
  console.log(`- Docente insertada: Prof. Leonaly Alejandra Cote Sequeida (Cédula: V-27792193)`);
  console.log(`- Secciones creadas: D y B para ESTADISTICA I (ESA-343)`);
  console.log(`- Total de alumnos inscritos en las secciones: ${countInscritos}`);
}

run();
