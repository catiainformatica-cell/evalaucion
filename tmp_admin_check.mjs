import db, { initDatabase } from './backend/src/config/database.js';

initDatabase();
const row = db.prepare('SELECT id, cedula, nombre, email, rol FROM usuarios WHERE rol = ? LIMIT 1').get('admin');
console.log(JSON.stringify(row, null, 2));
