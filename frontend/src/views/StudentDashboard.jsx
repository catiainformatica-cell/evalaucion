import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function StudentDashboard({ onStartEvaluation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed'
  const [searchTerm, setSearchTerm] = useState('');

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getSubjects('2-2026');
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message || 'Error al obtener materias');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-iujo-200 border-t-iujo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Cargando tus asignaturas inscritas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-800">Error al consultar asignaturas</h3>
          <p className="text-sm text-rose-600">{error}</p>
          <button
            onClick={loadSubjects}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { materias = [], total = 0, evaluadas = 0, pendientes = 0, porcentajeProgreso = 0, periodo = '2-2026' } = data || {};

  // Filtered list
  const filteredMaterias = materias.filter((item) => {
    const matchesSearch = 
      item.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo_materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.docente_nombre.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'pending') return item.evaluada === 0;
    if (filterStatus === 'completed') return item.evaluada === 1;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner & Progress Overview */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-iujo-900 via-iujo-800 to-iujo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-cyan-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>Período Académico {periodo}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hola, {user.nombre}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Carrera: <strong className="text-white">Informática</strong> • Cédula: <strong className="text-white">{user.cedula}</strong>
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantía de Privacidad: Tu evaluación no se asocia a tu cédula ni a tu usuario.</span>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-5 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Tu Progreso de Evaluación</span>
              <span className="text-xs font-bold text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
                {porcentajeProgreso}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-700/60 rounded-full h-2.5 mb-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2.5 rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${porcentajeProgreso}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                <span className="text-slate-400 block text-[10px]">Evaluadas</span>
                <span className="text-base font-extrabold text-emerald-300">{evaluadas} / {total}</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                <span className="text-slate-400 block text-[10px]">Pendientes</span>
                <span className="text-base font-extrabold text-amber-300">{pendientes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status Tab Filters */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({total})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              filterStatus === 'pending'
                ? 'bg-white text-amber-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pendientes ({pendientes})</span>
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              filterStatus === 'completed'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Evaluadas ({evaluadas})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por materia o profesor..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-iujo-500/20 focus:border-iujo-500 bg-white"
          />
        </div>

      </div>

      {/* Subject Cards Grid */}
      {filteredMaterias.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-semibold text-slate-700">No se encontraron asignaturas</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm 
              ? 'No hay asignaturas que coincidan con el término de búsqueda ingresado.'
              : 'No tienes asignaturas registradas con el filtro seleccionado para este período.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterias.map((materia) => {
            const isEvaluated = materia.evaluada === 1;

            return (
              <div
                key={materia.inscripcion_id}
                className={`flex flex-col justify-between bg-white rounded-2xl border transition-all duration-200 shadow-card hover:shadow-lg ${
                  isEvaluated
                    ? 'border-slate-200 bg-gradient-to-b from-white to-slate-50/50'
                    : 'border-iujo-200 hover:border-iujo-400 ring-1 ring-iujo-50'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  
                  {/* Status Badge & Semester tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Semestre {materia.semestre} • {materia.creditos} UC
                    </span>

                    {isEvaluated ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Evaluada</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pendiente</span>
                      </span>
                    )}
                  </div>

                  {/* Subject Name and Code */}
                  <div>
                    <span className="text-xs font-mono font-bold text-iujo-700 bg-iujo-50 px-2 py-0.5 rounded border border-iujo-200/50">
                      {materia.codigo_materia}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-2 leading-snug">
                      {materia.materia_nombre}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Sección {materia.seccion} • {materia.aula || 'Lab Informática'}
                    </p>
                  </div>

                  {/* Teacher Info */}
                  <div className="pt-3 border-t border-slate-100 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-iujo-700 to-iujo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {materia.docente_nombre ? materia.docente_nombre.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {materia.docente_nombre}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {materia.docente_email}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Card Action Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
                  {isEvaluated ? (
                    <button
                      disabled
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center space-x-2 cursor-not-allowed border border-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Evaluación Completada</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartEvaluation(materia)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-iujo-700 to-iujo-600 hover:from-iujo-800 hover:to-iujo-700 text-white text-xs font-bold shadow-md shadow-iujo-700/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2 group"
                    >
                      <span>Evaluar Docente</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
