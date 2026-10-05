import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  ShieldCheck, 
  BarChart3, 
  BookOpen, 
  Layers, 
  LogOut, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleBadgeConfig = {
    admin: { label: 'Coordinador / Admin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    docente: { label: 'Profesor Docente', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    estudiante: { label: 'Estudiante', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
  };

  const currentRoleBadge = roleBadgeConfig[user.rol] || roleBadgeConfig.estudiante;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Institution Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView(user.rol === 'estudiante' ? 'student-dashboard' : 'stats-dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-iujo-800 to-iujo-600 flex items-center justify-center text-white shadow-md shadow-iujo-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-iujo-900">IUJO</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-iujo-50 text-iujo-700 border border-iujo-200/60">
                  Informática
                </span>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
                  Período 2-2026
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Evaluación del Desempeño Docente
              </p>
            </div>
          </div>

          {/* Center Navigation according to role */}
          <nav className="hidden md:flex items-center space-x-1">
            {user.rol === 'estudiante' && (
              <button
                onClick={() => setCurrentView('student-dashboard')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'student-dashboard' || currentView === 'evaluation-form'
                    ? 'bg-iujo-50 text-iujo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Mis Asignaturas</span>
              </button>
            )}

            {(user.rol === 'admin' || user.rol === 'docente') && (
              <button
                onClick={() => setCurrentView('stats-dashboard')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'stats-dashboard'
                    ? 'bg-iujo-50 text-iujo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{user.rol === 'admin' ? 'Métricas & Estadísticas' : 'Mis Evaluaciones'}</span>
              </button>
            )}

            {user.rol === 'admin' && (
              <button
                onClick={() => setCurrentView('admin-sections')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'admin-sections'
                    ? 'bg-iujo-50 text-iujo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Cátedras & Secciones</span>
              </button>
            )}
          </nav>

          {/* Right: Security Badge & User profile / Logout */}
          <div className="flex items-center space-x-3">
            {/* Privacy Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anonimato 100% Blindado</span>
            </div>

            {/* User Pill */}
            <div className="flex items-center space-x-2 pl-2 sm:border-l sm:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs">
                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[130px]">
                  {user.nombre}
                </p>
                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded border ${currentRoleBadge.bg}`}>
                  {currentRoleBadge.label}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
