# Sistema de Evaluación del Desempeño Docente
## Instituto Universitario Jesús Obrero (IUJO) - Carrera de Informática
### Período Académico: 2-2026

Una aplicación web integral, moderna y segura diseñada para la recolección, procesamiento y análisis del desempeño docente en las cátedras de la carrera de Informática del **Instituto Universitario Jesús Obrero (IUJO)**.

---

## 🛡️ 1. Garantía Absoluta de Anonimato y Reglas de Negocio

El sistema implementa una arquitectura de **privacidad disociada**:

1. **Autenticación del Estudiante:** El alumno inicia sesión utilizando su Cédula y Contraseña para verificar su identidad y consultar únicamente las asignaturas y secciones que tiene legalmente inscritas en el período académico activo (ej. `2-2026`).
2. **Disociación Estricta de la Respuesta:**
   - La tabla de almacenamiento de evaluaciones (`respuestas_evaluacion`) **NO CONTIENE** `estudiante_id`, `cedula` ni marcas temporales correlacionadas con la identidad del estudiante.
   - En una transacción atómica (`BEGIN TRANSACTION`):
     - Se valida que el estudiante tenga la inscripción con estado `evaluada = 0`.
     - Se inserta la fila con las 15 calificaciones Likert y observaciones en `respuestas_evaluacion` vinculada únicamente al `seccion_id`.
     - Se actualiza el indicador booleano `evaluada = 1` en la tabla `inscripciones` del estudiante.
   - De este modo, **es matemáticamente y estructuralmente imposible correlacionar qué alumno emitió qué voto o comentario**, mientras se previene eficazmente el voto duplicado.

---

## 📊 2. Estructura del Instrumento de Evaluación (15 Ítemes)

La encuesta utiliza una **Escala Likert de 5 niveles**:
- **5 pts:** Totalmente de acuerdo
- **4 pts:** Parcialmente de acuerdo
- **3 pts:** De acuerdo
- **2 pts:** Parcialmente en desacuerdo
- **1 pt:** Totalmente en desacuerdo

### Preguntas Oficiales Evaluadas:
1. *Al inicio del semestre el profesor dio a conocer los objetivos de la asignatura.*
2. *Al inicio del semestre el profesor te solicitó tus posibilidades de conectividad.*
3. *Al inicio del semestre dio a conocer el contrato de aprendizaje.*
4. *El profesor establece normas a cumplir de manera consensuada con el grupo de estudiantes.*
5. *Informa a los estudiantes con anticipación la fecha de entrega de las asignaciones.*
6. *Propicia el intercambio comunicacional profesor-estudiante en su horario regular de clase (encuentro sincrónico).*
7. *El trato del profesor fue respetuoso y cortés con los estudiantes.*
8. *Devuelve las asignaciones corregidas y evaluadas en un tiempo ajustado al corte correspondiente.*
9. *Relaciona los contenidos trabajados en la clase con el campo laboral y personal.*
10. *Promueve el uso del aula virtual como una necesidad para las clases.*
11. *Se apoya en recursos virtuales para ofrecértelos de consulta a través del aula virtual EVA.*
12. *Realiza procesos de retroalimentación en foros.*
13. *Estimuló la participación activa de los estudiantes en cada encuentro sincrónico.*
14. *Las estrategias didácticas empleadas en sus clases fueron apropiadas para el logro de los objetivos de aprendizaje.*
15. *Redacta con claridad en forma escrita las instrucciones de las actividades que debes realizar en el Aula virtual.*
16. *Campo de texto constructivo:* Observaciones / Aclaratorias adicionales (opcional).

---

## 💻 3. Stack Tecnológico

- **Frontend:**
  - **React 19** con compilación ultra-rápida vía **Vite**.
  - **Tailwind CSS** con paleta institucional IUJO (`#0A2540`, `#0C87EB`, `#10B981`).
  - **Lucide Icons** para iconografía moderna.
  - **Chart.js** & **React-Chartjs-2** (Gráfico de Barras con tooltip de ítemes y Radar de Competencias Pedagógicas).
  - **jsPDF** y **jspdf-autotable** para generación y descarga de informes institucionales en PDF.
  - **Canvas-Confetti** para feedback visual al completar la evaluación.
- **Backend:**
  - **Node.js** con **Express**.
  - **Better-SQLite3** (con WAL mode y transacciones atómicas seguras).
  - **JSON Web Tokens (JWT)** y hashing con **Bcryptjs**.
  - Auto-seeding inteligente: Si la base de datos se encuentra vacía, se auto-puebla de inmediato al arrancar.
- **Base de Datos:**
  - SQLite integrada por defecto (`database.sqlite`) para ejecución instantánea sin configuración externa.
  - Script SQL listo para MySQL / MariaDB (`database.sql`) para importación directa en **phpMyAdmin / XAMPP**.

---

## 👥 4. Cuentas de Acceso Preconfiguradas (Datos de Prueba)

La pantalla de inicio de sesión incluye botones de **Acceso Rápido (1-Clic)** para probar cada rol:

| Rol | Usuario / Nombre | Cédula | Contraseña | Funcionalidad |
| :--- | :--- | :--- | :--- | :--- |
| **Estudiante** | Andrés Gil | `V-28123456` | `estudiante123` | Materias inscritas, asignaturas pendientes vs evaluadas, formulario de 15 preguntas Likert. |
| **Docente** | Prof. María Elena Rodríguez | `V-14567890` | `docente123` | Estadísticas individuales de sus cátedras asignadas, promedio por ítem, comentarios anónimos. |
| **Coordinador / Admin** | Gabriel Martinez | `V-12345678` | `admin123` | Métricas globales, filtros por profesor/materia, radar de competencias, exportación PDF/CSV. |

---

## 🚀 5. Instrucciones de Ejecución

### Opción A: Modo Producción Integrado (Recomendado)
El servidor Express sirve tanto la API REST como la aplicación Frontend compilada:
```bash
# Iniciar servidor backend y frontend unificado
npm start
```
Abre en tu navegador: **`http://localhost:5000`**

### Opción B: Modo Desarrollo con Hot-Reload (Vite + Express)
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```
- Frontend de desarrollo: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Reinicializar Datos de Muestra:
```bash
npm run seed
```

---

## 📁 6. Estructura del Proyecto

```
c:/xampp/htdocs/Evaluacion/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Inicialización SQLite y DDL de tablas
│   │   │   └── jwt.js               # Tokens JWT
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login por cédula y acceso demo
│   │   │   ├── studentController.js  # Filtro de asignaturas por período 2-2026
│   │   │   ├── evaluationController.js # Registro 100% anónimo con transacción
│   │   │   ├── statsController.js    # Métricas Likert, promedios, radar y comentarios
│   │   │   └── adminController.js    # Resumen de cátedras y supervisión
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # Guardia de sesión y roles
│   │   ├── routes/                  # Enrutadores Express
│   │   ├── seeds/
│   │   │   └── seedData.js          # Semillas con datos reales de IUJO Informática
│   │   └── server.js                # Servidor Express y despacho estático
│   ├── database.sqlite              # Archivo de base de datos local
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navegación y badge de anonimato
│   │   │   └── Footer.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Estado de sesión y autenticación
│   │   ├── services/
│   │   │   └── api.js               # Cliente HTTP centralizado
│   │   ├── utils/
│   │   │   └── exportPdf.js         # Generador de informes institucionales en PDF y CSV
│   │   ├── views/
│   │   │   ├── LoginView.jsx        # Pantalla de acceso institucional
│   │   │   ├── StudentDashboard.jsx # Tarjetas de asignaturas pendientes/evaluadas
│   │   │   ├── EvaluationForm.jsx   # Cuestionario Likert de 15 preguntas
│   │   │   ├── StatsDashboard.jsx   # Gráfico de barras, radar y distribución
│   │   │   └── AdminSectionsView.jsx # Supervisión de secciones y participación
│   │   ├── App.jsx
│   │   └── index.css
│   ├── dist/                        # Bundle de producción generado
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── database.sql                     # Script SQL para MySQL / phpMyAdmin en XAMPP
├── test_flow.js                     # Suite de pruebas automatizadas
├── package.json                     # Scripts unificados de la raíz
└── README.md
```

---

© Instituto Universitario Jesús Obrero (IUJO) - Coordinación de la Carrera de Informática.
