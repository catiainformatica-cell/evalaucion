import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/70 py-6 text-slate-500 text-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700">IUJO</span>
          <span>•</span>
          <span>Instituto Universitario Jesús Obrero</span>
          <span>•</span>
          <span className="text-slate-400">Coordinación de Informática</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Respuestas Disociadas de la Identidad</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400">Período Académico 2-2026</span>
        </div>

      </div>
    </footer>
  );
}
