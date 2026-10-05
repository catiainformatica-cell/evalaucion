import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CircleCheck,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { login } = useAuth();

  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizedCedula = (value) => value.replace(/^[VvEe]\s*-?\s*/i, '').replace(/[^0-9]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!cedula.trim() || !password.trim()) {
      setError('Por favor ingresa tu cédula y contraseña.');
      return;
    }

    try {
      setLoading(true);
      await login(cedula, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b2340] px-5 py-10 text-white sm:px-8 lg:flex lg:items-center lg:justify-center">
      <div className="mx-auto grid w-full max-w-[880px] items-center gap-10 lg:grid-cols-2 lg:gap-8">
        <section className="mx-auto w-full max-w-[432px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-400/30 bg-slate-400/15 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sistema Oficial IUJO • Período 2-2026</span>
          </div>

          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-lg shadow-cyan-500/20">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-[32px]">IUJO Informática</h1>
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-[25px]">
            Evaluación del Desempeño Docente
          </h2>
          <p className="text-sm leading-[1.65] text-blue-100">
            Tu opinión sincera y constructiva impulsa la excelencia académica de la carrera.
            Ayúdanos a evaluar las estrategias pedagógicas, el uso del aula virtual EVA y la
            interacción formativa.
          </p>

          <div className="mt-6 rounded-xl border border-emerald-500/35 bg-slate-700/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              <span>Garantía Absoluta de Anonimato</span>
            </div>
            <p className="text-xs leading-[1.7] text-slate-200">
              Inicias sesión únicamente para verificar qué asignaturas tienes inscritas.{' '}
              <strong className="font-semibold text-white">
                Al enviar tus respuestas, no se registra tu nombre, cédula ni identificador.
              </strong>{' '}
              La base de datos disocia tu identidad de tus calificaciones.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-300">
              <CircleCheck className="h-3.5 w-3.5" />
              <span>1 respuesta anónima por estudiante por asignatura</span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[432px] rounded-2xl bg-white p-7 text-slate-900 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">Iniciar Sesión</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ingresa con tu Cédula de Identidad y contraseña institucional
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cedula" className="mb-1 block text-xs font-semibold text-slate-800">
                Cédula de Identidad
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="cedula"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(normalizedCedula(e.target.value))}
                  placeholder="Ej. 27793142"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-800">
                Contraseña
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-800/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{loading ? 'Validando...' : 'Acceder al Sistema'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
