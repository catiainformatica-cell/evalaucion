import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { statsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportStatsToPdf, exportStatsToCsv } from '../utils/exportPdf';
import ImportPDFView from './ImportPDFView';
import { 
  BarChart3, 
  Users, 
  Award, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  TrendingUp,
  Layers,
  ChevronDown,
  Upload
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StatsDashboard() {
  const { user, token } = useAuth();
  const isDocente = user.rol === 'docente';
  const isAdmin = user.rol === 'admin';
  const [showImport, setShowImport] = useState(false);

  const [filterOptions, setFilterOptions] = useState({
    docentes: [],
    materias: [],
    periodos: ['2-2026'],
    secciones: []
  });

  const [selectedDocente, setSelectedDocente] = useState(isDocente ? user.id : '');
  const [selectedMateria, setSelectedMateria] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('2-2026');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentSearch, setCommentSearch] = useState('');

  // 1. Load Filter Options
  useEffect(() => {
    async function loadFilters() {
      try {
        const res = await statsApi.getFilters();
        if (res.success && res.data) {
          setFilterOptions(res.data);
          if (isDocente) {
            setSelectedDocente(user.id);
          }
        }
      } catch (err) {
        console.error('Error al cargar filtros:', err);
      }
    }
    loadFilters();
  }, [isDocente, user.id]);

  // 2. Fetch Stats based on active filters
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        periodo: selectedPeriodo,
        ...(selectedDocente ? { docenteId: selectedDocente } : {}),
        ...(selectedMateria ? { materiaCodigo: selectedMateria } : {})
      };

      const res = await statsApi.getStats(params);
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Error al obtener datos estadísticos');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedDocente, selectedMateria, selectedPeriodo]);

  const handleResetFilters = () => {
    if (!isDocente) setSelectedDocente('');
    setSelectedMateria('');
    setSelectedPeriodo('2-2026');
  };

  // 3. Prepare Bar Chart Data (Puntuación por ítem del 1 al 15)
  const barChartData = {
    labels: (stats?.itemStats || []).map(it => `Ítem ${it.id}`),
    datasets: [
      {
        label: 'Promedio Obtenido (1 a 5)',
        data: (stats?.itemStats || []).map(it => it.average),
        backgroundColor: (stats?.itemStats || []).map(it => {
          if (it.average >= 4.5) return 'rgba(16, 185, 129, 0.85)';
          if (it.average >= 4.0) return 'rgba(59, 130, 246, 0.85)';
          if (it.average >= 3.0) return 'rgba(245, 158, 11, 0.85)';
          return 'rgba(239, 68, 68, 0.85)';
        }),
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const item = stats?.itemStats?.[index];
            return `Ítem ${item?.id}: ${item?.dimension}`;
          },
          label: (context) => {
            const index = context.dataIndex;
            const item = stats?.itemStats?.[index];
            return [
              `Puntuación: ${item?.average} / 5.00`,
              `Pregunta: ${item?.text}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, font: { size: 11 } },
        grid: { color: 'rgba(226, 232, 240, 0.6)' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' } }
      }
    }
  };

  // 4. Prepare Radar Chart Data (Dimensiones Pedagógicas)
  const radarChartData = {
    labels: (stats?.dimensionStats || []).map(d => d.dimension),
    datasets: [
      {
        label: 'Desempeño Pedagógico',
        data: (stats?.dimensionStats || []).map(d => d.promedio),
        backgroundColor: 'rgba(12, 135, 235, 0.2)',
        borderColor: '#0c87eb',
        pointBackgroundColor: '#064785',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0c87eb',
        borderWidth: 2,
      }
    ]
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        pointLabels: { font: { size: 11, weight: '600' }, color: '#334155' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  const metrics = stats?.metricasGenerales || {};

  // Filter comments
  const filteredComments = (stats?.comentarios || []).filter(c => 
    c.texto.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.materia.toLowerCase().includes(commentSearch.toLowerCase())
  );

  if (showImport) {
    return <ImportPDFView token={token} onBack={() => setShowImport(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-iujo-50 border border-iujo-200 text-xs font-semibold text-iujo-700 mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Panel de Coordinación y Evaluación Docente</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isDocente ? 'Evaluación de Mis Cátedras' : 'Módulo de Estadísticas y Analítica Docente'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Carrera: Informática • Período {selectedPeriodo} • Instituto Universitario Jesús Obrero
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={() => setShowImport(true)}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Importar PDF</span>
            </button>
          )}
          <button
            onClick={() => exportStatsToCsv(stats)}
            disabled={!stats || metrics.totalRespuestas === 0}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => exportStatsToPdf(stats, { selectedDocente, selectedMateria, selectedPeriodo })}
            disabled={!stats || metrics.totalRespuestas === 0}
            className="px-4 py-2 rounded-xl bg-iujo-700 hover:bg-iujo-800 text-white text-xs font-bold shadow-md shadow-iujo-700/20 hover:shadow-lg flex items-center space-x-2 transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Informe PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-iujo-600" />
            <span>Filtros Dinámicos de Consulta</span>
          </span>

          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-iujo-600 flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar Filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Docente Filter (Disabled if logged-in user is a Teacher) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Docente
            </label>
            <select
              disabled={isDocente}
              value={selectedDocente}
              onChange={(e) => setSelectedDocente(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-iujo-500/20 focus:border-iujo-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {!isDocente && <option value="">Todos los Docentes de Informática</option>}
              {filterOptions.docentes.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Materia Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Asignatura
            </label>
            <select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-iujo-500/20 focus:border-iujo-500"
            >
              <option value="">Todas las Asignaturas</option>
              {filterOptions.materias.map(m => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo} - {m.nombre} (Sem. {m.semestre})
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Período Académico
            </label>
            <select
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-iujo-500/20 focus:border-iujo-500"
            >
              {filterOptions.periodos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-iujo-200 border-t-iujo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-500">Compilando estadísticas de desempeño...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
          <p className="text-xs font-bold text-rose-700">{error}</p>
        </div>
      ) : (
        <>
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* KPI 1: Satisfaction Score */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Índice General Docente</span>
                <Award className="w-5 h-5 text-iujo-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.promedioGlobal || '0.00'}
                </span>
                <span className="text-xs text-slate-400 font-bold">/ 5.00 pts</span>
              </div>
              <p className={`text-xs font-bold mt-2 ${metrics.calificacionColor}`}>
                {metrics.calificacionCualitativa}
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div 
                  className="bg-iujo-600 h-1.5 rounded-full" 
                  style={{ width: `${metrics.porcentajeSatisfaccion || 0}%` }}
                />
              </div>
            </div>

            {/* KPI 2: Total Evaluations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Evaluaciones Registradas</span>
                <BarChart3 className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.totalRespuestas || 0}
                </span>
                <span className="text-xs text-slate-400">encuestas</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Respuestas 100% anónimas
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 font-semibold mt-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacidad Validada</span>
              </div>
            </div>

            {/* KPI 3: Participation Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Tasa de Participación</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {metrics.tasaParticipacion || '0'}%
                </span>
                <span className="text-xs text-slate-400">del total</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {metrics.totalRespuestas} de {metrics.totalInscritos} inscripciones
              </p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(metrics.tasaParticipacion || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* KPI 4: Top Pedagogical Dimension */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Dimensión Más Alta</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              {stats?.dimensionStats?.length > 0 ? (
                <>
                  <p className="text-base font-bold text-slate-900 truncate mt-1">
                    {[...stats.dimensionStats].sort((a,b) => b.promedio - a.promedio)[0]?.dimension}
                  </p>
                  <p className="text-xs text-amber-600 font-extrabold mt-1">
                    {[...stats.dimensionStats].sort((a,b) => b.promedio - a.promedio)[0]?.promedio} / 5.00 pts
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-2">Sin datos suficientes</p>
              )}
              <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-3">
                <span>Evaluación por áreas didácticas</span>
              </div>
            </div>

          </div>

          {/* Interactive Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Bar Chart: Items 1 to 15 (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Puntuación Promedio por Ítem (Preguntas 1 al 15)
                  </h3>
                  <span className="text-[11px] text-slate-400">Escala de 1 a 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Coloca el cursor sobre cada barra para leer la formulación exacta de la pregunta.
                </p>
              </div>

              <div className="h-72 w-full">
                <Bar data={barChartData} options={barChartOptions} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Excelente (≥ 4.5)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Muy Bueno (4.0 - 4.4)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Aceptable (3.0 - 3.9)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Por mejorar (&lt; 3.0)</span>
                </div>
              </div>
            </div>

            {/* Radar Chart: Pedagogical Dimensions (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Radar de Competencias Pedagógicas
                </h3>
                <p className="text-xs text-slate-500 mb-2">
                  Consolidado multidimensional de la práctica docente en Informática.
                </p>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <Radar data={radarChartData} options={radarChartOptions} />
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                {(stats?.dimensionStats || []).map(dim => (
                  <div key={dim.dimension} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                    <span className="truncate max-w-[120px] font-medium">{dim.dimension}:</span>
                    <span className="font-bold text-iujo-700">{dim.promedio}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Detailed Likert Distribution Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Distribución de Frecuencias de la Escala Likert por Pregunta
                </h3>
                <p className="text-xs text-slate-500">
                  Desglose porcentual y absoluto de votos para cada uno de los 15 ítemes evaluados.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Pregunta del Instrumento</th>
                    <th className="py-2.5 px-3">Área Didáctica</th>
                    <th className="py-2.5 px-3 text-center">Promedio</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700 bg-emerald-50/50">5 pts</th>
                    <th className="py-2.5 px-3 text-center text-blue-700 bg-blue-50/50">4 pts</th>
                    <th className="py-2.5 px-3 text-center text-amber-700 bg-amber-50/50">3 pts</th>
                    <th className="py-2.5 px-3 text-center text-orange-700 bg-orange-50/50">2 pts</th>
                    <th className="py-2.5 px-3 text-center text-rose-700 bg-rose-50/50">1 pt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(stats?.itemStats || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{item.id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 max-w-sm">
                        {item.text}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic text-[11px] whitespace-nowrap">
                        {item.dimension}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          item.average >= 4.5 ? 'bg-emerald-100 text-emerald-800' :
                          item.average >= 4.0 ? 'bg-blue-100 text-blue-800' :
                          item.average >= 3.0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.average}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-emerald-700 bg-emerald-50/20">
                        {item.distributionPercent?.[5]}%
                        <span className="block text-[10px] text-slate-400 font-normal">({item.distribution?.[5]})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-blue-700 bg-blue-50/20">
                        {item.distributionPercent?.[4]}%
                        <span className="block text-[10px] text-slate-400 font-normal">({item.distribution?.[4]})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-amber-700 bg-amber-50/20">
                        {item.distributionPercent?.[3]}%
                        <span className="block text-[10px] text-slate-400 font-normal">({item.distribution?.[3]})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-orange-700 bg-orange-50/20">
                        {item.distributionPercent?.[2]}%
                        <span className="block text-[10px] text-slate-400 font-normal">({item.distribution?.[2]})</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-rose-700 bg-rose-50/20">
                        {item.distributionPercent?.[1]}%
                        <span className="block text-[10px] text-slate-400 font-normal">({item.distribution?.[1]})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anonymous Student Comments Feed */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-iujo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Observaciones y Comentarios Formativos Anónimos
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aportes libres redactados por los estudiantes para enriquecer la labor académica.
                </p>
              </div>

              {/* Search in comments */}
              <input
                type="text"
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                placeholder="Filtrar comentarios..."
                className="text-xs py-1.5 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-iujo-500/20 w-full sm:w-60"
              />
            </div>

            {filteredComments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl">
                No se encontraron comentarios para los criterios seleccionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredComments.map((com) => (
                  <div
                    key={com.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3"
                  >
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      "{com.texto}"
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-iujo-800">
                        {com.materia} (Sec. {com.seccion})
                      </span>
                      <span className="text-slate-400">
                        {new Date(com.fecha).toLocaleDateString('es-VE')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </>
      )}

    </div>
  );
}
