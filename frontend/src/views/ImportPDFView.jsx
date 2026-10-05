import { useState, useCallback, useRef } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowLeft,
  User, BookOpen, Users, RefreshCw, ChevronDown, Info
} from 'lucide-react';

const API = '/api/admin';

export default function ImportPDFView({ token, onBack }) {
  const [step, setStep] = useState('upload'); // upload | preview | success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Editable fields (user can correct what the parser detected)
  const [docenteNombre, setDocenteNombre] = useState('');
  const [docenteCedula, setDocenteCedula] = useState('');
  const [materiaCodigo, setMateriaCodigo] = useState('');
  const [seccion, setSeccion] = useState('');
  const [periodo, setPeriodo] = useState('2-2026');
  const [estudiantes, setEstudiantes] = useState([]);

  const [resultado, setResultado] = useState(null);
  const fileInputRef = useRef();

  // ─── Drag & Drop ───────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Solo se aceptan archivos PDF.');
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setError(''); }
  };

  // ─── Step 1: Upload & Preview ──────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) { setError('Selecciona un archivo PDF primero.'); return; }
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('pdf', selectedFile);
      const res = await fetch(`${API}/import/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const d = json.data;
      setPreviewData(d);
      setDocenteNombre(d.docenteNombre || '');
      setDocenteCedula(d.docenteCedula || '');
      setMateriaCodigo(d.materiaEncontrada?.codigo || '');
      setSeccion(d.seccion || '');
      setPeriodo(d.periodo || '2-2026');
      setEstudiantes(d.estudiantes || []);
      setStep('preview');
    } catch (e) {
      setError(e.message || 'Error al procesar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Confirm ───────────────────────────────────────────
  const handleConfirm = async () => {
    if (!docenteNombre.trim()) { setError('Ingresa el nombre del docente.'); return; }
    if (!docenteCedula.trim()) { setError('Ingresa la cédula del docente.'); return; }
    if (!materiaCodigo) { setError('Selecciona la materia.'); return; }
    if (!seccion.trim()) { setError('Ingresa la sección.'); return; }
    if (estudiantes.length === 0) { setError('No hay estudiantes para importar.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ docenteNombre, docenteCedula, materiaCodigo, seccion, periodo, estudiantes }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setResultado(json.data);
      setStep('success');
    } catch (e) {
      setError(e.message || 'Error al confirmar importación.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewData(null);
    setResultado(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeEstudiante = (idx) => {
    setEstudiantes(prev => prev.filter((_, i) => i !== idx));
  };

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Importar Listado desde PDF</h1>
            <p className="text-slate-400 text-sm">Carga los alumnos y docente de una sección directamente desde el PDF de asistencia</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { key: 'upload', label: '1. Subir PDF' },
            { key: 'preview', label: '2. Revisar datos' },
            { key: 'success', label: '3. Completado' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                step === s.key
                  ? 'bg-indigo-500 text-white'
                  : ['preview', 'success'].includes(step) && i < ['upload', 'preview', 'success'].indexOf(step)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 text-slate-400'
              }`}>
                {s.label}
              </div>
              {i < 2 && <div className="w-6 h-px bg-white/20" />}
            </div>
          ))}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-3 items-start">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        {/* ── STEP 1: Upload ───────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : selectedFile
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-white/20 hover:border-indigo-400 hover:bg-indigo-500/5'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <>
                  <FileText className="mx-auto mb-4 text-emerald-400" size={48} />
                  <p className="text-white font-semibold text-lg">{selectedFile.name}</p>
                  <p className="text-emerald-400 text-sm mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB — listo para procesar
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto mb-4 text-indigo-400" size={48} />
                  <p className="text-white font-semibold text-lg mb-2">Arrastra el PDF aquí</p>
                  <p className="text-slate-400 text-sm">o haz clic para seleccionar el archivo</p>
                  <p className="text-slate-500 text-xs mt-4">Acepta listas de asistencia IUJO en formato PDF</p>
                </>
              )}
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
              <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
              <p className="text-blue-300 text-sm">
                El sistema intentará detectar automáticamente el <strong>docente</strong>, <strong>asignatura</strong>, <strong>sección</strong> y <strong>lista de alumnos</strong> con sus cédulas. Podrás revisar y corregir cualquier dato antes de confirmar.
              </p>
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin" /> Procesando PDF...
                </span>
              ) : 'Procesar PDF →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Preview & Edit ───────────────────────────────── */}
        {step === 'preview' && previewData && (
          <div className="space-y-6">

            {/* Docente */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
                <User size={18} className="text-indigo-400" /> Datos del Docente
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Nombre completo *</label>
                  <input
                    value={docenteNombre}
                    onChange={e => setDocenteNombre(e.target.value)}
                    placeholder="Prof. Nombre Apellido"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Cédula del docente * <span className="text-amber-400">(requerida)</span></label>
                  <input
                    value={docenteCedula}
                    onChange={e => setDocenteCedula(e.target.value)}
                    placeholder="V-12345678"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Materia y Sección */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-indigo-400" /> Asignatura y Sección
              </h2>
              {previewData.materiaNombre && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-300 text-sm">
                    📄 El PDF indica: <strong>"{previewData.materiaNombre}"</strong>
                    {previewData.materiaEncontrada
                      ? ` → coincide con <strong>${previewData.materiaEncontrada.codigo} - ${previewData.materiaEncontrada.nombre}</strong>`
                      : ' → no encontrada automáticamente. Por favor selecciónala manualmente.'
                    }
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 relative">
                  <label className="text-slate-400 text-xs mb-1 block">Asignatura *</label>
                  <div className="relative">
                    <select
                      value={materiaCodigo}
                      onChange={e => setMateriaCodigo(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-400 pr-8"
                    >
                      <option value="">-- Selecciona --</option>
                      {previewData.todasLasMaterias.map(m => (
                        <option key={m.codigo} value={m.codigo} className="bg-slate-800">
                          {m.codigo} — {m.nombre} (Sem. {m.semestre})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Sección *</label>
                  <input
                    value={seccion}
                    onChange={e => setSeccion(e.target.value.toUpperCase())}
                    placeholder="A"
                    maxLength={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Período *</label>
                  <input
                    value={periodo}
                    onChange={e => setPeriodo(e.target.value)}
                    placeholder="2-2026"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Estudiantes */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
                <Users size={18} className="text-indigo-400" /> Estudiantes detectados
                <span className="ml-auto text-indigo-400 font-bold text-lg">{estudiantes.length}</span>
              </h2>
              <p className="text-slate-400 text-xs mb-4">Puedes eliminar filas incorrectas antes de confirmar.</p>

              {estudiantes.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Users size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No se detectaron estudiantes. Verifica el formato del PDF.</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                  {estudiantes.map((est, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 group">
                      <span className="text-slate-500 text-xs w-6 text-right shrink-0">{idx + 1}</span>
                      <span className="text-indigo-300 font-mono text-sm w-32 shrink-0">{est.cedula}</span>
                      <span className="text-white text-sm flex-1 truncate">{est.nombre}</span>
                      <button
                        onClick={() => removeEstudiante(idx)}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded-lg bg-rose-500/10 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
              >
                ← Subir otro PDF
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || estudiantes.length === 0}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-lg transition-all shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin" /> Importando...
                  </span>
                ) : `✓ Confirmar e Importar ${estudiantes.length} alumnos`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ──────────────────────────────────────── */}
        {step === 'success' && resultado && (
          <div className="bg-white/5 backdrop-blur border border-emerald-500/30 rounded-3xl p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-emerald-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Importación Exitosa!</h2>
            <p className="text-slate-400 mb-8">Los alumnos ya pueden iniciar sesión y evaluar al docente.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Docente', value: resultado.docente, sub: '' },
                { label: 'Materia', value: resultado.materia, sub: `Sección ${resultado.seccion}` },
                { label: 'Alumnos nuevos', value: resultado.alumnosInscritos, sub: 'inscritos' },
                { label: 'Ya existían', value: resultado.alumnosYaExistian, sub: 'omitidos' },
              ].map(card => (
                <div key={card.label} className="bg-white/5 rounded-2xl p-4">
                  <p className="text-slate-400 text-xs mb-1">{card.label}</p>
                  <p className="text-white font-bold text-lg truncate">{card.value}</p>
                  {card.sub && <p className="text-slate-500 text-xs">{card.sub}</p>}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left mb-8">
              <p className="text-blue-300 text-sm">
                🔑 <strong>Credenciales de acceso para los alumnos:</strong><br/>
                Usuario: <code className="text-blue-200">su cédula</code> · Contraseña: <code className="text-blue-200">su cédula</code>
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all"
              >
                Importar otro listado
              </button>
              <button
                onClick={onBack}
                className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
              >
                Volver al panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
