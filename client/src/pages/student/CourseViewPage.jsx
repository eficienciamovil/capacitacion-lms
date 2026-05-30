import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi } from '../../services/api';

export default function CourseViewPage() {
  const { id }                                  = useParams();
  const navigate                                = useNavigate();
  const [course, setCourse]                     = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [activeTab, setActiveTab]               = useState('video'); // 'video' | 'presentation'
  const [materialCompleted, setMaterialCompleted] = useState(false);
  const [marking, setMarking]                   = useState(false);
  const videoRef                                = useRef(null);

  useEffect(() => {
    coursesApi.get(id)
      .then(r => {
        setCourse(r.data);
        // Determine default tab
        if (!r.data.video_filename && r.data.presentation_filename) setActiveTab('presentation');
      })
      .finally(() => setLoading(false));

    // Check if material was already completed
    coursesApi.list().then(r => {
      const found = r.data.find(c => c.id === id);
      if (found?.material_completed) setMaterialCompleted(true);
    });
  }, [id]);

  async function handleMarkComplete() {
    setMarking(true);
    try {
      await coursesApi.completeMaterial(id);
      setMaterialCompleted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  }

  function handleVideoEnded() {
    if (!materialCompleted) handleMarkComplete();
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!course) return (
    <div className="card text-center py-12 text-slate-500">Capacitación no encontrada</div>
  );

  const hasBothFiles = course.video_filename && course.presentation_filename;
  const hasNoFiles   = !course.video_filename && !course.presentation_filename;
  const pptUrl       = coursesApi.presentationUrl(id);
  const pptExt       = course.presentation_filename?.split('.').pop()?.toLowerCase();
  const isPdf        = pptExt === 'pdf';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 text-sm mb-3 flex items-center gap-1">
          ← Volver al inicio
        </button>
        <h2 className="text-2xl font-bold text-slate-900">{course.title}</h2>
        {course.description && <p className="text-slate-500 mt-1">{course.description}</p>}
      </div>

      {/* Tab switcher */}
      {hasBothFiles && (
        <div className="flex gap-2 border-b border-slate-200">
          {course.video_filename && (
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'video' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              🎬 Video
            </button>
          )}
          {course.presentation_filename && (
            <button
              onClick={() => setActiveTab('presentation')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'presentation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📊 Presentación
            </button>
          )}
        </div>
      )}

      {/* Media content */}
      {hasNoFiles ? (
        <div className="card text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">📭</div>
          <p>El administrador aún no ha subido archivos para esta capacitación.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Video player */}
          {(activeTab === 'video' || !hasBothFiles) && course.video_filename && (
            <div className="bg-black">
              <video
                ref={videoRef}
                controls
                controlsList="nodownload"
                className="w-full max-h-[70vh]"
                onEnded={handleVideoEnded}
                src={`/api/courses/${id}/video`}
              >
                Tu navegador no soporta la reproducción de video.
              </video>
            </div>
          )}

          {/* Presentation viewer */}
          {(activeTab === 'presentation' || !hasBothFiles) && course.presentation_filename && (
            <div>
              {isPdf ? (
                <iframe
                  src={`${pptUrl}#view=FitH`}
                  className="w-full"
                  style={{ height: '70vh' }}
                  title="Presentación"
                />
              ) : (
                <div className="p-6 text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-slate-700 font-medium mb-2">{course.presentation_filename}</p>
                  <p className="text-slate-500 text-sm mb-4">
                    Para ver la presentación PowerPoint, descárgala y ábrela con Microsoft Office o Google Slides.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <a href={pptUrl} download className="btn-primary">
                      ⬇ Descargar presentación
                    </a>
                    {/* Office Online Viewer (requires public URL - only works with internet) */}
                    <a
                      href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + pptUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                    >
                      Abrir en Office Online
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Completion & Quiz area */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">Estado del progreso</h3>

        {!materialCompleted ? (
          <div className="space-y-3">
            <p className="text-slate-600 text-sm">
              {course.video_filename
                ? 'Termina de ver el video para habilitar el cuestionario. También puedes marcarlo manualmente si ya lo revisaste.'
                : 'Descarga y revisa la presentación, luego marca el material como revisado para habilitar el cuestionario.'}
            </p>
            <button onClick={handleMarkComplete} disabled={marking} className="btn-secondary">
              {marking ? 'Marcando...' : '✓ Marcar material como revisado'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</span>
              <span className="font-medium">Material revisado</span>
            </div>

            {course.questions?.length === 0 ? (
              <p className="text-slate-500 text-sm">Esta capacitación aún no tiene cuestionario configurado.</p>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium mb-1">¡Cuestionario disponible!</p>
                <p className="text-blue-700 text-sm mb-3">
                  {course.questions.length} preguntas · Mínimo para aprobar: {course.pass_percentage}%
                </p>
                <button
                  onClick={() => navigate(`/dashboard/course/${id}/quiz`)}
                  className="btn-primary"
                >
                  Iniciar cuestionario →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
