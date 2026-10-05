import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePdfText } from '../src/controllers/importController.js';

test('parsePdfText detects students from IUJO PDF rows using spaced ID format', () => {
  const text = `
    Docente: Prof. María Elena Rodríguez
    Asignatura: Programación I
    Sección: A
    Período: 2-2026
    V 12345678  PÉREZ, JUAN CARLOS
    E 23456789  GÓMEZ, ANA MABEL
    V-34567890  RIVERO, CARLOS ANDRÉS
  `;

  const result = parsePdfText(text);

  assert.equal(result.docenteNombre, 'Prof. María Elena Rodríguez');
  assert.equal(result.materiaNombre, 'Programación I');
  assert.equal(result.seccion, 'A');
  assert.equal(result.periodo, '2-2026');
  assert.deepEqual(result.rows, [
    { cedula: '12345678', nombre: 'PÉREZ, JUAN CARLOS' },
    { cedula: '23456789', nombre: 'GÓMEZ, ANA MABEL' },
    { cedula: '34567890', nombre: 'RIVERO, CARLOS ANDRÉS' },
  ]);
});

test('parsePdfText supports split rows where the student name is in the following line', () => {
  const text = `
    Docente: Prof. Carlos Mendoza
    Asignatura: Matemática I
    Sección: B
    Período: 2-2026
    V-22876543
    PÉREZ, LUIS DAVID
    E 30988765
    GARCÍA, ANA BEATRIZ
  `;

  const result = parsePdfText(text);

  assert.deepEqual(result.rows, [
    { cedula: '22876543', nombre: 'PÉREZ, LUIS DAVID' },
    { cedula: '30988765', nombre: 'GARCÍA, ANA BEATRIZ' },
  ]);
});

test('parsePdfText handles the real IUJO list format with numbered rows and glued ID-name text', () => {
  const text = `
    Período:2-2026 Docente: 28443176 - Castañeda Estupiñan Lisandro Andrés
    Carrera:Informática Materia: ALGORITMO Y PROGRAMACION I
    Semestre:Segundo semestre Sección: A
    # Cédula Apellidos y Nombres
    1 V-31945912Albuja Álvarez, Jesse Ned
    2 V-27995073Beltran Molina, Yonaiker Jhosel
    10V-32770545Gomez Medina, Moises Daniel
    40
    V-30098862
    Zambrano Guzman, Paola Valentina
  `;

  const result = parsePdfText(text);

  assert.equal(result.docenteNombre, 'Castañeda Estupiñan Lisandro Andrés');
  assert.equal(result.docenteCedula, '28443176');
  assert.equal(result.materiaNombre, 'ALGORITMO Y PROGRAMACION I');
  assert.equal(result.seccion, 'A');

  assert.deepEqual(result.rows.slice(0, 3), [
    { cedula: '31945912', nombre: 'Albuja Álvarez, Jesse Ned' },
    { cedula: '27995073', nombre: 'Beltran Molina, Yonaiker Jhosel' },
    { cedula: '32770545', nombre: 'Gomez Medina, Moises Daniel' },
  ]);
  assert.ok(result.rows.length >= 3);
});

test('parsePdfText strips trailing metadata labels from real IUJO headers', () => {
  const text = `
    Asistencia
    Sede Caracas
    Período:
    2-2026
    Docente: 28443176 - Castañeda Estupiñan Lisandro Andrés Carrera
    Carrera:
    Informática
    Materia: ALGORITMO Y PROGRAMACION I Semestre
    Semestre:
    Segundo semestre
    Sección: B
    #CédulaApellidos y Nombres
    1V-32473190Acevedo Olivares, Carlos Guillermo
  `;

  const result = parsePdfText(text);

  assert.equal(result.docenteNombre, 'Castañeda Estupiñan Lisandro Andrés');
  assert.equal(result.docenteCedula, '28443176');
  assert.equal(result.materiaNombre, 'ALGORITMO Y PROGRAMACION I');
  assert.equal(result.seccion, 'B');
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].cedula, '32473190');
});
