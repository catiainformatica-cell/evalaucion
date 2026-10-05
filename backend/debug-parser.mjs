import { parsePdfText } from './src/controllers/importController.js';

const text = `
Período:2-2026 Docente: 28443176 - Castañeda Estupiñan Lisandro Andrés
Carrera:Informática Materia: ALGORITMO Y PROGRAMACION I
Semestre:Segundo semestre Sección: A
# Cédula Apellidos y Nombres
1 V-31945912Albuja Álvarez, Jesse Ned
2 V-27995073Beltran Molina, Yonaiker Jhosel
3 V-32503368Bravo Lopez, Kember Alexander
10V-32770545Gomez Medina, Moises Daniel
40
V-30098862
Zambrano Guzman, Paola Valentina`;

console.log(JSON.stringify(parsePdfText(text), null, 2));
