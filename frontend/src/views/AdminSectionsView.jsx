import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { 
  Layers, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search,
  ExternalLink
} from 'lucide-react';

export default function AdminSectionsView({ onSelectSectionToInspect }) {
  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sumRes, secRes] = await Promise.all([
          adminApi.getSummary(),
          adminApi.getSections()
        ]);
        if (sumRes.success) setSummary(sumRes.data);
        if (secRes.success) setSections(secRes.data);
      } catch (err) {
        console.error('Error al cargar datos administrativos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSections = sections.filter(s => 
    s.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.codigo_materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.docente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Gestión de Cátedras e Inscripciones</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cátedras y Secciones de Informática
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Supervisión de la participación y tasa de respuesta estudiantil por materia.
        </p>
      </div>

      {/* Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Estudiantes Inscritos</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalEstudiantes}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Docentes Activos</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalDocentes}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Total Secciones</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalSecciones}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500">Evaluaciones Anónimas</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.totalRespuestas}</p>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-900">
            Listado de Secciones - Período 2-2026
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar materia o docente..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-iujo-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Cargando secciones...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Asignatura</th>
                  <th className="py-3 px-3">Semestre</th>
                  <th className="py-3 px-3">Secc.</th>
                  <th className="py-3 px-3">Docente a Cargo</th>
                  <th className="py-3 px-3 text-center">Inscritos</th>
                  <th className="py-3 px-3 text-center">Evaluaron</th>
                  <th className="py-3 px-3 text-center">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSections.map(s => {
                  const percent = s.total_alumnos > 0 ? Math.round((s.alumnos_evaluaron / s.total_alumnos) * 100) : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono font-bold text-iujo-700">{s.codigo_materia}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{s.materia_nombre}</td>
                      <td className="py-3 px-3 text-slate-500">Sem. {s.semestre}</td>
                      <td className="py-3 px-3 font-bold text-slate-700">{s.seccion}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{s.docente_nombre}</td>
                      <td className="py-3 px-3 text-center text-slate-600 font-bold">{s.total_alumnos}</td>
                      <td className="py-3 px-3 text-center text-emerald-600 font-bold">{s.alumnos_evaluaron}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center space-x-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
