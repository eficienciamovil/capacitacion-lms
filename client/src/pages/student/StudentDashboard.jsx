import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi, certificatesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { user }                      = useAuth();
  const [courses, setCourses]         = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([coursesApi.list(), certificatesApi.list()])
      .then(([c, cert]) => {
        setCourses(c.data);
        setCertificates(cert.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const completed = courses.filter(c => c.passed);
  const inProgress = courses.filter(c => c.material_completed && !c.passed);
  const notStarted = courses.filter(c => !c.material_completed);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bienvenido, {user?.name}</h2>
        <p className="text-slate-500 mt-1">Tus capacitaciones disponibles</p>
      </div>

      {/* Progress summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
          <p className="text-slate-500 text-sm mt-1">Cursos disponibles</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{completed.length}</p>
          <p className="text-slate-500 text-sm mt-1">Completados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{certificates.length}</p>
          <p className="text-slate-500 text-sm mt-1">Certificados obtenidos</p>
        </div>
      </div>

      {/* Courses grid */}
      {courses.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-slate-700 font-semibold text-lg">No hay capacitaciones disponibles</h3>
          <p className="text-slate-500 mt-2">El administrador aún no ha publicado capacitaciones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => {
            const status = course.passed
              ? { label: 'Completado', color: 'badge-green', icon: '🏆' }
              : course.material_completed
              ? { label: 'Pendiente evaluación', color: 'badge-yellow', icon: '📝' }
              : { label: 'Sin iniciar', color: 'badge-blue', icon: '▶' };

            return (
              <div key={course.id} className="card flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 flex-1">{course.title}</h3>
                  <span className={status.color}>{status.icon} {status.label}</span>
                </div>

                {course.description && (
                  <p className="text-slate-500 text-sm line-clamp-2">{course.description}</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {course.video_filename && <span className="badge-blue text-xs">🎬 Video</span>}
                  {course.presentation_filename && <span className="badge-blue text-xs">📊 Presentación</span>}
                  <span className="badge-yellow text-xs">Aprobación: {course.pass_percentage}%</span>
                </div>

                {course.best_score !== null && (
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Mejor calificación</p>
                    <p className={`text-lg font-bold ${course.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {course.best_score}%
                    </p>
                  </div>
                )}

                <Link
                  to={`/dashboard/course/${course.id}`}
                  className={`btn-primary w-full mt-auto justify-center ${
                    !course.video_filename && !course.presentation_filename ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {course.passed ? 'Ver nuevamente' : course.material_completed ? 'Ir al examen' : 'Comenzar curso'}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Mis Certificados</h3>
          <div className="space-y-2">
            {certificates.map(cert => (
              <div key={cert.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{cert.course_title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(cert.issued_at).toLocaleDateString('es-MX')} · Nota: {cert.score}%
                  </p>
                </div>
                <a
                  href={certificatesApi.download(cert.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  ⬇ Descargar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
