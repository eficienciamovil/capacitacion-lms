import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../../services/api';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-slate-900 text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.stats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const passRate = stats?.totalAttempts > 0
    ? Math.round((stats.totalPassed / stats.totalAttempts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Panel de Control</h2>
        <p className="text-slate-500 mt-1">Resumen general del sistema de capacitación</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Alumnos activos"    value={stats?.totalStudents ?? 0} color="bg-blue-50" />
        <StatCard icon="📚" label="Capacitaciones"     value={stats?.totalCourses ?? 0}  color="bg-purple-50" />
        <StatCard icon="📝" label="Evaluaciones"       value={stats?.totalAttempts ?? 0} color="bg-amber-50" />
        <StatCard icon="🏆" label="Certificados emitidos" value={stats?.totalCerts ?? 0} color="bg-green-50" />
      </div>

      {/* Pass rate card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Tasa de aprobación global</h3>
          <span className="text-2xl font-bold text-blue-600">{passRate}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${passRate}%` }}
          />
        </div>
        <p className="text-slate-500 text-sm mt-2">
          {stats?.totalPassed ?? 0} aprobados de {stats?.totalAttempts ?? 0} intentos totales
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/courses" className="card hover:shadow-md transition-shadow text-center cursor-pointer">
          <div className="text-3xl mb-2">📚</div>
          <p className="font-semibold text-slate-900">Gestionar Cursos</p>
          <p className="text-slate-500 text-sm mt-1">Subir videos y presentaciones</p>
        </Link>
        <Link to="/admin/users" className="card hover:shadow-md transition-shadow text-center cursor-pointer">
          <div className="text-3xl mb-2">👤</div>
          <p className="font-semibold text-slate-900">Gestionar Usuarios</p>
          <p className="text-slate-500 text-sm mt-1">Crear y administrar alumnos</p>
        </Link>
        <Link to="/admin/reports" className="card hover:shadow-md transition-shadow text-center cursor-pointer">
          <div className="text-3xl mb-2">📊</div>
          <p className="font-semibold text-slate-900">Ver Reportes</p>
          <p className="text-slate-500 text-sm mt-1">Calificaciones y progreso</p>
        </Link>
      </div>

      {/* Recent activity */}
      {stats?.recentActivity?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Actividad reciente</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={a.passed ? 'badge-green' : 'badge-red'}>
                    {a.passed ? '✓ Aprobó' : '✗ Reprobó'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.user_name}</p>
                    <p className="text-xs text-slate-500">{a.course_title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{a.score}%</p>
                  <p className="text-xs text-slate-400">
                    {new Date(a.completed_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
