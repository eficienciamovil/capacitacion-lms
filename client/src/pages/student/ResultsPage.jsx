import React from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { certificatesApi } from '../../services/api';

export default function ResultsPage() {
  const { id }     = useParams();
  const location   = useLocation();
  const navigate   = useNavigate();
  const result     = location.state?.result;

  if (!result) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto">
        <p className="text-slate-500 mb-4">No hay resultados para mostrar</p>
        <Link to="/dashboard" className="btn-primary">Ir al inicio</Link>
      </div>
    );
  }

  const { score, passed, correct, total, pass_percentage, certificate_id, details } = result;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Result hero */}
      <div className={`card text-center py-10 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="text-6xl mb-4">{passed ? '🏆' : '📚'}</div>
        <h2 className={`text-3xl font-bold mb-1 ${passed ? 'text-green-700' : 'text-red-700'}`}>
          {passed ? '¡Felicitaciones!' : 'No aprobaste esta vez'}
        </h2>
        <p className={`text-lg ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {passed ? 'Has superado el cuestionario exitosamente' : `Necesitas al menos ${pass_percentage}% para aprobar`}
        </p>

        <div className={`mt-6 inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-bold ${
          passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {score}%
        </div>

        <p className="mt-4 text-slate-600">
          Respondiste correctamente <strong>{correct}</strong> de <strong>{total}</strong> preguntas
        </p>
      </div>

      {/* Certificate download */}
      {passed && certificate_id && (
        <div className="card bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center py-6">
          <div className="text-3xl mb-2">📜</div>
          <h3 className="text-xl font-bold mb-1">Certificado generado</h3>
          <p className="text-blue-200 mb-4">Tu certificado de aprobación está listo para descargar</p>
          <a
            href={certificatesApi.download(certificate_id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            ⬇ Descargar Certificado PDF
          </a>
        </div>
      )}

      {/* Answer review */}
      {details && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Revisión de respuestas</h3>
          <div className="space-y-3">
            {details.map((d, i) => (
              <div
                key={d.question_id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  d.is_correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  d.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm font-medium ${d.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                  {d.is_correct ? '✓ Correcta' : '✗ Incorrecta'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link to="/dashboard" className="btn-secondary flex-1 justify-center">
          Volver al inicio
        </Link>
        <button
          onClick={() => navigate(`/dashboard/course/${id}/quiz`)}
          className="btn-primary flex-1"
        >
          {passed ? 'Intentar de nuevo' : 'Reintentar examen'}
        </button>
      </div>
    </div>
  );
}
