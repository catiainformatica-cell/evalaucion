import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDatabase } from './config/database.js';
import { runSeeds } from './seeds/seedData.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database schema
initDatabase();

// Auto-seed if database is empty
try {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM usuarios').get().c;
  if (userCount === 0) {
    console.log('[IUJO] Base de datos vacía. Ejecutando semillas iniciales automáticas...');
    runSeeds();
  }
} catch (e) {
  console.log('[IUJO] Inicializando datos iniciales...');
  runSeeds();
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/estudiante', studentRoutes);
app.use('/api/evaluacion', evaluationRoutes);
app.use('/api/estadisticas', statsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Evaluación de Desempeño Docente - IUJO Informática',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if exists
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// For Single Page App client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>IUJO - Evaluación Docente</title><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
          <h2>Servidor Backend de Evaluación Docente IUJO Activo</h2>
          <p>Para visualizar la interfaz de usuario, inicie el frontend de desarrollo con: <code>cd frontend &amp;&amp; npm run dev</code></p>
          <p>Endpoints API disponibles en: <code>/api/...</code></p>
        </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor IUJO Backend activo en http://localhost:${PORT}`);
  console.log(`📚 Carrera: Informática - Periodo: 2-2026`);
  console.log(`🔒 Garantía de Anonimato: ACTIVA`);
  console.log(`=======================================================`);
});
