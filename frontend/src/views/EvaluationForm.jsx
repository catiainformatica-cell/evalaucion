import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { studentApi, evaluationApi } from '../services/api';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Info,
  HelpCircle
} from 'lucide-react';

export default function EvaluationForm({ selectedMateria, onCancel, onEvaluationCompleted }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [completedSuccess, setCompletedSuccess] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        setError(null);
        const res = await studentApi.getSectionForEvaluation(selectedMateria.seccion_id);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'Error al cargar el formulario.');
        }
      } catch (err) {
        setError(err.message || 'No se pudo conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    }

    if (selectedMateria) {
      loadForm();
    }
  }, [selectedMateria]);

  const handleSelectOption = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data?.preguntas?.length || 15;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  const handleValidateAndOpenConfirm = (e) => {
    e.preventDefault();
    if (answeredCount < totalQuestions) {
      // Find first unanswered question
      const firstUnanswered = data.preguntas.find(q => !answers[q.key]);
      setError(`Debes responder todas las preguntas. Te falta responder el ítem #${firstUnanswered?.id}.`);
      const element = document.getElementById(`question-card-${firstUnanswered?.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const res = await evaluationApi.submit(
        selectedMateria.seccion_id,
        answers,
        observaciones
      );

      if (res.success) {
        setShowConfirmModal(false);
        setCompletedSuccess(true);
        
        // Fire celebration confetti
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // Ignore confetti errors if not supported
        }
      } else {
        setError(res.message || 'Error al enviar evaluación.');
        setShowConfirmModal(false);
      }
    } catch (err) {
      setError(err.message || 'Error al registrar la evaluación.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-iujo-200 border-t-iujo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Cargando cuestionario oficial de evaluación...</p>
      </div>
    );
  }

  if (completedSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">¡Evaluación Registrada con Éxito!</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto">
            Tu opinión ha sido guardada en la base de datos de manera <strong className="text-slate-900">100% anónima y confidencial</strong>. No existe relación entre tus respuestas y tu usuario.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-md mx-auto space-y-1">
          <p><span className="font-semibold text-slate-800">Asignatura:</span> {selectedMateria.materia_nombre}</p>
          <p><span className="font-semibold text-slate-800">Docente Evaluado:</span> {selectedMateria.docente_nombre}</p>
          <p><span className="font-semibold text-slate-800">Estado de la Inscripción:</span> Actualizada a Evaluada ✓</p>
        </div>

        <div className="pt-4">
          <button
            onClick={onEvaluationCompleted}
            className="px-6 py-3 rounded-xl bg-iujo-700 hover:bg-iujo-800 text-white font-semibold text-sm shadow-md transition-all inline-flex items-center space-x-2"
          >
            <span>Volver a Mis Asignaturas</span>
          </button>
        </div>
      </div>
    );
  }

  const { seccion, preguntas, escala } = data || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </button>

        <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Modo Anónimo Activo</span>
        </div>
      </div>

      {/* Course & Teacher Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-iujo-700 bg-iujo-50 px-2 py-0.5 rounded border border-iujo-200/50">
              {seccion?.codigo_materia} • Sección {seccion?.seccion}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {seccion?.materia_nombre}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Semestre {seccion?.semestre} • Período {seccion?.periodo} • {seccion?.aula}
            </p>
          </div>

          <div className="flex items-center space-x-3 sm:border-l sm:border-slate-100 sm:pl-6">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-iujo-700 to-iujo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {seccion?.docente_nombre ? seccion.docente_nombre.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Profesor(a) a evaluar</span>
              <p className="text-sm font-bold text-slate-900">{seccion?.docente_nombre}</p>
              <p className="text-xs text-slate-500">{seccion?.docente_email}</p>
            </div>
          </div>
        </div>

        {/* Anonymity Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Garantía de Anonimato Institucional:</strong> Al presionar enviar, tus respuestas se guardan en un registro disociado de tu usuario y cédula. La plataforma solo actualiza el estado de tu inscripción para certificar tu participación sin relevar qué opciones marcaste.
          </p>
        </div>
      </div>

      {/* Sticky Progress Bar */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-700 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-iujo-600" />
            <span>Progreso del Cuestionario</span>
          </span>
          <span className={`${answeredCount === totalQuestions ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>
            {answeredCount} de {totalQuestions} respondidas ({progressPercentage}%)
          </span>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              answeredCount === totalQuestions ? 'bg-emerald-500' : 'bg-iujo-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Error alert if validation fails */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Evaluation Form Questions List */}
      <form onSubmit={handleValidateAndOpenConfirm} className="space-y-6">
        
        <div className="space-y-4">
          {preguntas?.map((pregunta, index) => {
            const currentValue = answers[pregunta.key];
            const isAnswered = currentValue !== undefined;

            return (
              <div
                key={pregunta.key}
                id={`question-card-${pregunta.id}`}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 ${
                  isAnswered
                    ? 'border-slate-200 shadow-xs'
                    : 'border-slate-200 shadow-xs hover:border-iujo-300'
                }`}
              >
                {/* Question Header & Dimension Tag */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start space-x-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isAnswered
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {pregunta.id}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {pregunta.text}
                      </h4>
                      <span className="inline-block text-[11px] font-medium text-slate-400 mt-1">
                        Área: {pregunta.dimension}
                      </span>
                    </div>
                  </div>

                  {isAnswered && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Respondida ✓
                    </span>
                  )}
                </div>

                {/* 5-point Likert Options */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
                  {escala?.map((opcion) => {
                    const isSelected = currentValue === opcion.value;

                    // Option styling colors
                    const colorStyles = {
                      5: isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'hover:border-emerald-300 hover:bg-emerald-50/50',
                      4: isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'hover:border-blue-300 hover:bg-blue-50/50',
                      3: isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'hover:border-amber-300 hover:bg-amber-50/50',
                      2: isSelected ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'hover:border-orange-300 hover:bg-orange-50/50',
                      1: isSelected ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'hover:border-rose-300 hover:bg-rose-50/50',
                    };

                    return (
                      <button
                        key={opcion.value}
                        type="button"
                        onClick={() => handleSelectOption(pregunta.key, opcion.value)}
                        className={`flex sm:flex-col items-center justify-between sm:justify-center p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          colorStyles[opcion.value] || ''
                        } ${!isSelected ? 'border-slate-200 bg-slate-50/60 text-slate-700' : ''}`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-0 sm:flex-col">
                          <span className={`text-base font-extrabold sm:mb-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {opcion.value}
                          </span>
                          <span className="text-left sm:text-center text-[11px] font-medium leading-tight">
                            {opcion.label}
                          </span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full border sm:hidden flex items-center justify-center ${
                          isSelected ? 'border-white bg-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-iujo-700" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* Optional Comments Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Observaciones / Aclaratorias adicionales</span>
              <span className="text-xs font-normal text-slate-400">(Opcional)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {observaciones.length} / 500 caracteres
            </span>
          </div>
          
          <p className="text-xs text-slate-500">
            Puedes redactar comentarios formativos, resaltar fortalezas del docente o sugerir mejoras en la dinámica de las clases y del aula virtual EVA.
          </p>

          <textarea
            rows={4}
            maxLength={500}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Escribe tus observaciones constructivas aquí..."
            className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-iujo-500/20 focus:border-iujo-500 resize-none"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Cancelar y Volver
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-iujo-700 to-iujo-600 hover:from-iujo-800 hover:to-iujo-700 text-white font-bold text-sm shadow-md shadow-iujo-700/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Evaluación Anónima ({answeredCount}/15)</span>
          </button>
        </div>

      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">¿Confirmar envío anónimo?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estás a punto de registrar tu evaluación para <strong className="text-slate-800">{seccion?.materia_nombre}</strong> impartida por <strong className="text-slate-800">{seccion?.docente_nombre}</strong>.
              </p>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 text-left space-y-1">
                <p className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tu identidad está disociada de las respuestas.</span>
                </p>
                <p>Una vez enviada, no podrás modificar tu respuesta para esta asignatura.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Revisar Respuestas
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 px-4 rounded-xl bg-iujo-700 hover:bg-iujo-800 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <span>Sí, Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
