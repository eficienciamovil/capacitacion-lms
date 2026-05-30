import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesApi, reportsApi } from '../../services/api';

export default function QuizPage() {
  const { id }                        = useParams();
  const navigate                      = useNavigate();
  const [course, setCourse]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [answers, setAnswers]         = useState({});  // { questionId: optionId }
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [currentQ, setCurrentQ]       = useState(0);

  useEffect(() => {
    coursesApi.get(id)
      .then(r => setCourse(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  function selectAnswer(questionId, optionId) {
    setAnswers(a => ({ ...a, [questionId]: optionId }));
  }

  function canSubmit() {
    if (!course) return false;
    return course.questions.every(q => answers[q.id]);
  }

  async function handleSubmit() {
    if (!canSubmit()) { setError('Por favor responde todas las preguntas'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await reportsApi.submitQuiz(id, answers);
      navigate(`/dashboard/course/${id}/result`, { state: { result: data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el cuestionario');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!course || course.questions?.length === 0) {
    return (
      <div className="card text-center py-12 max-w-2xl mx-auto">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-slate-600">No hay preguntas configuradas para este cuestionario.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Volver</button>
      </div>
    );
  }

  const questions = course.questions;
  const question  = questions[currentQ];
  const answered  = Object.keys(answers).length;
  const total     = questions.length;
  const progress  = (answered / total) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate(`/dashboard/course/${id}`)} className="text-blue-600 hover:text-blue-800 text-sm mb-3 flex items-center gap-1">
          ← Volver al curso
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Cuestionario</h2>
        <p className="text-slate-500 mt-1">{course.title}</p>
      </div>

      {/* Progress bar */}
      <div className="card py-3">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Progreso: {answered}/{total} respondidas</span>
          <span>Mínimo para aprobar: {course.pass_percentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question navigation dots */}
      <div className="flex gap-2 flex-wrap">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentQ(i)}
            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
              i === currentQ
                ? 'bg-blue-600 text-white'
                : answers[q.id]
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {currentQ + 1}
          </span>
          <h3 className="text-slate-900 font-medium text-lg">{question.question_text}</h3>
        </div>

        <div className="space-y-3">
          {question.options.map(opt => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                answers[question.id] === opt.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                answers[question.id] === opt.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {answers[question.id] === opt.id && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-slate-700">{opt.option_text}</span>
              <input
                type="radio"
                className="sr-only"
                name={`q_${question.id}`}
                value={opt.id}
                checked={answers[question.id] === opt.id}
                onChange={() => selectAnswer(question.id, opt.id)}
              />
            </label>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 gap-3">
          <button
            onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="btn-secondary"
          >
            ← Anterior
          </button>

          {currentQ < total - 1 ? (
            <button
              onClick={() => setCurrentQ(q => Math.min(total - 1, q + 1))}
              className="btn-primary"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={() => {}} // handled by submit button below
              disabled
              className="btn-secondary opacity-0"
            >
              placeholder
            </button>
          )}
        </div>
      </div>

      {/* Submit */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !canSubmit()}
        className={`btn-primary w-full py-3 text-base ${!canSubmit() ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {submitting ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Enviando...
          </span>
        ) : (
          `${canSubmit() ? '✓ ' : ''}Enviar cuestionario (${answered}/${total})`
        )}
      </button>
    </div>
  );
}
