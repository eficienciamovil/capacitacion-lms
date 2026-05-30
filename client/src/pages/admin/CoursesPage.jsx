import React, { useEffect, useState, useRef } from 'react';
import { coursesApi, questionsApi } from '../../services/api';

const EMPTY_COURSE = { title: '', description: '', pass_percentage: 70 };

export default function CoursesPage() {
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [courseModal, setCourseModal] = useState(null);
  const [form, setForm]               = useState(EMPTY_COURSE);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [deleteId, setDeleteId]       = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const videoRef = useRef();
  const presentationRef = useRef();

  function load() {
    setLoading(true);
    coursesApi.list()
      .then(r => setCourses(r.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // ── Course CRUD ──────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_COURSE);
    setError('');
    setCourseModal({ mode: 'create' });
  }

  function openEdit(course) {
    setForm({ title: course.title, description: course.description, pass_percentage: course.pass_percentage });
    setError('');
    setCourseModal({ mode: 'edit', course });
  }

  async function handleSaveCourse(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (courseModal.mode === 'create') {
        await coursesApi.create(form);
      } else {
        await coursesApi.update(courseModal.course.id, form);
      }
      setCourseModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await coursesApi.remove(id);
      setDeleteId(null);
      if (selectedCourse?.id === id) setSelectedCourse(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  // ── File uploads ─────────────────────────────────────────
  async function handleVideoUpload(courseId) {
    const file = videoRef.current?.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('video', file);
    try {
      await coursesApi.uploadVideo(courseId, fd, e => {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(p => ({ ...p, [`video_${courseId}`]: pct }));
      });
      setUploadProgress(p => { const n = { ...p }; delete n[`video_${courseId}`]; return n; });
      if (videoRef.current) videoRef.current.value = '';
      load();
      if (selectedCourse?.id === courseId) {
        coursesApi.get(courseId).then(r => setSelectedCourse(r.data));
      }
      alert('Video subido correctamente');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir video');
      setUploadProgress(p => { const n = { ...p }; delete n[`video_${courseId}`]; return n; });
    }
  }

  async function handlePresentationUpload(courseId) {
    const file = presentationRef.current?.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('presentation', file);
    try {
      await coursesApi.uploadPresentation(courseId, fd, e => {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(p => ({ ...p, [`ppt_${courseId}`]: pct }));
      });
      setUploadProgress(p => { const n = { ...p }; delete n[`ppt_${courseId}`]; return n; });
      if (presentationRef.current) presentationRef.current.value = '';
      load();
      if (selectedCourse?.id === courseId) {
        coursesApi.get(courseId).then(r => setSelectedCourse(r.data));
      }
      alert('Presentación subida correctamente');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir presentación');
      setUploadProgress(p => { const n = { ...p }; delete n[`ppt_${courseId}`]; return n; });
    }
  }

  // ── Questions ─────────────────────────────────────────────
  const [qModal, setQModal] = useState(false);
  const [qForm, setQForm]   = useState({ question_text: '', options: [
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false }
  ]});
  const [qError, setQError] = useState('');

  function openAddQuestion() {
    setQForm({
      question_text: '',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
    setQError('');
    setQModal(true);
  }

  async function handleSaveQuestion(e) {
    e.preventDefault();
    const filledOptions = qForm.options.filter(o => o.option_text.trim());
    if (filledOptions.length < 2) { setQError('Completa al menos 2 opciones'); return; }
    if (!filledOptions.some(o => o.is_correct)) { setQError('Marca al menos una opción correcta'); return; }
    setSaving(true);
    setQError('');
    try {
      await questionsApi.add(selectedCourse.id, {
        question_text: qForm.question_text,
        options: filledOptions
      });
      setQModal(false);
      const r = await coursesApi.get(selectedCourse.id);
      setSelectedCourse(r.data);
    } catch (err) {
      setQError(err.response?.data?.error || 'Error al guardar pregunta');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(qId) {
    if (!window.confirm('¿Eliminar esta pregunta?')) return;
    await questionsApi.remove(qId);
    const r = await coursesApi.get(selectedCourse.id);
    setSelectedCourse(r.data);
  }

  function setCorrectOption(idx) {
    setQForm(f => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === idx }))
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Capacitaciones</h2>
          <p className="text-slate-500 mt-1">{courses.length} capacitaciones registradas</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Nueva Capacitación</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Course list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : courses.length === 0 ? (
            <div className="card text-center text-slate-500 py-12">
              <div className="text-4xl mb-3">📚</div>
              <p>No hay capacitaciones aún.</p>
              <button onClick={openCreate} className="btn-primary mt-4">Crear primera capacitación</button>
            </div>
          ) : courses.map(c => (
            <div
              key={c.id}
              onClick={() => coursesApi.get(c.id).then(r => setSelectedCourse(r.data))}
              className={`card cursor-pointer transition-all hover:shadow-md ${selectedCourse?.id === c.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{c.title}</h3>
                  {c.description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{c.description}</p>}
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <span className={c.video_filename ? 'badge-green' : 'badge-red'}>
                      {c.video_filename ? '✓ Video' : '✗ Sin video'}
                    </span>
                    <span className={c.presentation_filename ? 'badge-green' : 'badge-red'}>
                      {c.presentation_filename ? '✓ Presentación' : '✗ Sin presentación'}
                    </span>
                    <span className="badge-blue">{c.question_count} preguntas</span>
                    <span className="badge-yellow">Aprobación: {c.pass_percentage}%</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); openEdit(c); }} className="btn-secondary text-xs px-3 py-1.5">Editar</button>
                  <button onClick={e => { e.stopPropagation(); setDeleteId(c.id); }} className="btn-danger text-xs px-3 py-1.5">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course detail panel */}
        {selectedCourse ? (
          <div className="card space-y-6">
            <h3 className="font-bold text-slate-900 text-lg border-b border-slate-200 pb-3">{selectedCourse.title}</h3>

            {/* Upload video */}
            <div>
              <p className="label">Video MP4</p>
              {selectedCourse.video_filename && (
                <p className="text-xs text-green-600 mb-1">✓ Archivo actual: {selectedCourse.video_filename}</p>
              )}
              <div className="flex gap-2 items-center">
                <input ref={videoRef} type="file" accept=".mp4" className="text-sm text-slate-600 flex-1 border border-slate-300 rounded-lg px-3 py-2" />
                <button
                  onClick={() => handleVideoUpload(selectedCourse.id)}
                  className="btn-primary text-xs px-3 py-2 whitespace-nowrap"
                >
                  Subir
                </button>
              </div>
              {uploadProgress[`video_${selectedCourse.id}`] !== undefined && (
                <div className="mt-1">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress[`video_${selectedCourse.id}`]}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{uploadProgress[`video_${selectedCourse.id}`]}%</p>
                </div>
              )}
            </div>

            {/* Upload presentation */}
            <div>
              <p className="label">Presentación (PPT/PPTX/PDF)</p>
              {selectedCourse.presentation_filename && (
                <p className="text-xs text-green-600 mb-1">✓ Archivo actual: {selectedCourse.presentation_filename}</p>
              )}
              <div className="flex gap-2 items-center">
                <input ref={presentationRef} type="file" accept=".ppt,.pptx,.pdf" className="text-sm text-slate-600 flex-1 border border-slate-300 rounded-lg px-3 py-2" />
                <button
                  onClick={() => handlePresentationUpload(selectedCourse.id)}
                  className="btn-primary text-xs px-3 py-2 whitespace-nowrap"
                >
                  Subir
                </button>
              </div>
              {uploadProgress[`ppt_${selectedCourse.id}`] !== undefined && (
                <div className="mt-1">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress[`ppt_${selectedCourse.id}`]}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{uploadProgress[`ppt_${selectedCourse.id}`]}%</p>
                </div>
              )}
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-slate-900">Banco de Preguntas ({selectedCourse.questions?.length || 0})</p>
                <button onClick={openAddQuestion} className="btn-primary text-xs px-3 py-1.5">+ Agregar</button>
              </div>

              {selectedCourse.questions?.length === 0 ? (
                <p className="text-slate-500 text-sm">Sin preguntas. Agrega al menos una para habilitar el examen.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {selectedCourse.questions.map((q, qi) => (
                    <div key={q.id} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          <span className="text-slate-400 mr-2">{qi + 1}.</span>{q.question_text}
                        </p>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs flex-shrink-0">✕</button>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {q.options?.map(o => (
                          <li key={o.id} className={`text-xs px-2 py-1 rounded ${o.is_correct ? 'bg-green-100 text-green-800 font-medium' : 'text-slate-500'}`}>
                            {o.is_correct ? '✓' : '○'} {o.option_text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center text-center text-slate-400 min-h-48">
            <div>
              <div className="text-4xl mb-2">👈</div>
              <p>Selecciona una capacitación para gestionar sus archivos y preguntas</p>
            </div>
          </div>
        )}
      </div>

      {/* Course create/edit modal */}
      {courseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold">{courseModal.mode === 'create' ? 'Nueva Capacitación' : 'Editar Capacitación'}</h3>
            </div>
            <form onSubmit={handleSaveCourse} className="px-6 py-4 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              <div>
                <label className="label">Título</label>
                <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Porcentaje mínimo de aprobación (%)</label>
                <input className="input" type="number" min="1" max="100" value={form.pass_percentage}
                  onChange={e => setForm(f => ({ ...f, pass_percentage: Number(e.target.value) }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCourseModal(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Confirmar eliminación</h3>
            <p className="text-slate-600 mb-6">¿Eliminar esta capacitación? Se borrarán todos los archivos y registros asociados.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add question modal */}
      {qModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Agregar Pregunta</h3>
            </div>
            <form onSubmit={handleSaveQuestion} className="px-6 py-4 space-y-4">
              {qError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{qError}</div>}
              <div>
                <label className="label">Pregunta</label>
                <textarea className="input" rows={2} required value={qForm.question_text}
                  onChange={e => setQForm(f => ({ ...f, question_text: e.target.value }))} />
              </div>
              <div>
                <label className="label">Opciones de respuesta <span className="text-slate-400 font-normal">(selecciona la correcta)</span></label>
                <div className="space-y-2">
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.is_correct}
                        onChange={() => setCorrectOption(i)}
                        className="text-blue-600 flex-shrink-0"
                      />
                      <input
                        className="input"
                        placeholder={`Opción ${i + 1}`}
                        value={opt.option_text}
                        onChange={e => setQForm(f => ({
                          ...f,
                          options: f.options.map((o, j) => j === i ? { ...o, option_text: e.target.value } : o)
                        }))}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">Selecciona el círculo para marcar la respuesta correcta</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setQModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
