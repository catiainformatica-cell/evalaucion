import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginView from './views/LoginView';
import StudentDashboard from './views/StudentDashboard';
import EvaluationForm from './views/EvaluationForm';
import StatsDashboard from './views/StatsDashboard';
import AdminSectionsView from './views/AdminSectionsView';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('default');
  const [selectedMateria, setSelectedMateria] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 border-4 border-iujo-400 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-300">Iniciando Sistema de Evaluación IUJO...</p>
      </div>
    );
  }

  // Not logged in -> Show Login View
  if (!user) {
    return <LoginView />;
  }

  // If student
  if (user.rol === 'estudiante') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />
        
        <main className="flex-1">
          {currentView === 'evaluation-form' && selectedMateria ? (
            <EvaluationForm
              selectedMateria={selectedMateria}
              onCancel={() => {
                setSelectedMateria(null);
                setCurrentView('student-dashboard');
              }}
              onEvaluationCompleted={() => {
                setSelectedMateria(null);
                setCurrentView('student-dashboard');
              }}
            />
          ) : (
            <StudentDashboard
              onStartEvaluation={(materia) => {
                setSelectedMateria(materia);
                setCurrentView('evaluation-form');
              }}
            />
          )}
        </main>

        <Footer />
      </div>
    );
  }

  // If Docente or Admin
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1">
        {currentView === 'admin-sections' && user.rol === 'admin' ? (
          <AdminSectionsView />
        ) : (
          <StatsDashboard />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
