import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { generateToken } from '../config/jwt.js';

export async function login(req, res) {
  try {
    const { cedula, password } = req.body;

    if (!cedula || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar su cédula y contraseña.'
      });
    }

    const cleanCedula = String(cedula).trim().toUpperCase();
    const cedulaDigits = cleanCedula.replace(/^[VE]\s*-?\s*/i, '').replace(/[^0-9]/g, '');
    const normalizedVariants = Array.from(new Set([
      cleanCedula,
      `V-${cedulaDigits}`,
      `E-${cedulaDigits}`,
      cedulaDigits,
      cleanCedula.replace(/\s+/g, '')
    ])).filter(Boolean);

    const placeholders = normalizedVariants.map(() => '?').join(', ');
    const user = db.prepare(`
      SELECT id, cedula, nombre, email, password, rol, carrera 
      FROM usuarios 
      WHERE UPPER(email) = ?
         OR UPPER(cedula) IN (${placeholders})
         OR REPLACE(UPPER(cedula), 'V-', '') IN (${placeholders})
         OR REPLACE(UPPER(cedula), 'E-', '') IN (${placeholders})
    `).get(
      cleanCedula,
      ...normalizedVariants,
      ...normalizedVariants,
      ...normalizedVariants
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Cédula o credenciales incorrectas. Verifique e intente nuevamente.'
      });
    }

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta. Verifique sus datos.'
      });
    }

    // Remove password from payload
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT
    const token = generateToken({
      id: user.id,
      cedula: user.cedula,
      rol: user.rol,
      nombre: user.nombre
    });

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el inicio de sesión.',
      error: error.message
    });
  }
}

export function me(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del usuario.',
      error: error.message
    });
  }
}

// Quick demo login helper to easily switch and test between roles
export function demoLogin(req, res) {
  try {
    const { role } = req.params; // 'estudiante', 'docente', 'admin'
    let user;

    if (role === 'admin') {
      user = db.prepare("SELECT * FROM usuarios WHERE rol = 'admin' LIMIT 1").get();
    } else if (role === 'docente') {
      user = db.prepare("SELECT * FROM usuarios WHERE rol = 'docente' LIMIT 1").get();
    } else {
      user = db.prepare("SELECT * FROM usuarios WHERE rol = 'estudiante' LIMIT 1").get();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario de demostración no encontrado.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken({
      id: user.id,
      cedula: user.cedula,
      rol: user.rol,
      nombre: user.nombre
    });

    return res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error en acceso demo.', error: error.message });
  }
}
