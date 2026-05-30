import React, { useEffect, useState } from 'react';
import { reportsApi, certificatesApi } from '../../services/api';

export default function ReportsPage() {
  const [grades, setGrades]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all'); // all | passed | failed

  useEffect(() => {
    reportsApi.allGrades()
      .then(r => setGrades(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = grades.filter(g => {
    const matchesSearch = !search ||
      g.user_name.toLowerCase().includes(search.toLowerCase()) ||
      g.course_title.toLowerCase().includes(search.toLowerCase()) ||
      g.user_email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'passed' ? g.passed : !g.passed);
    return matchesSearch && matchesFilter;
  });

  function exportCSV() {
    const headers = ['Alumno', 'Email', 'Capacitación', 'Nota (%)', 'Estado', 'Fecha'];
    const rows = filtered.map(g => [
      g.user_name, g.user_email, g.course_title, g.score,
      g.passed ? 'Aprobado' : 'Reprobado',
      new Date(g.completed_at).toLocaleDateString('es-MX')
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_calificaciones_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalAprobados = grades.filter(g => g.passed).length;
  const avgScore = grades.length > 0
    ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reportes de Calificaciones</h2>
          <p className="text-slate-500 mt-1">{grades.length} evaluaciones en total</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary">
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{grades.length}</p>
          <p className="text-slate-500 text-sm mt-1">Total evaluaciones</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{totalAprobados}</p>
          <p className="text-slate-500 text-sm mt-1">Aprobados</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-slate-700">{avgScore}%</p>
          <p className="text-slate-500 text-sm mt-1">Promedio general</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          className="input max-w-xs"
          placeholder="Buscar por alumno, email o curso..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="passed">Solo aprobados</option>
          <option value="failed">Solo reprobados</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">Alumno</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">Capacitación</th>
                  <th className="text-center px-4 py-3 text-slate-600 font-medium">Nota</th>
                  <th className="text-center px-4 py-3 text-slate-600 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-slate-600 font-medium">Cert.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{g.user_name}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{g.user_email}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{g.course_title}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${g.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {g.score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={g.passed ? 'badge-green' : 'badge-red'}>
                        {g.passed ? 'Aprobado' : 'Reprobado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                      {new Date(g.completed_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.certificate_id ? (
                        <a
                          href={certificatesApi.download(g.certificate_id)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          ⬇ PDF
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-slate-500 py-12">
                {grades.length === 0 ? 'No hay evaluaciones registradas aún' : 'Sin resultados para los filtros aplicados'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
