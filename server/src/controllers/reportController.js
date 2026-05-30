const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { generateCertificate } = require('../utils/pdfGenerator');

async function submitQuiz(req, res) {
  const { courseId } = req.params;
  const { answers } = req.body; // { [questionId]: optionId }

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Respuestas inválidas' });
  }

  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  // Verify material was completed
  const completion = db.prepare(
    'SELECT id FROM material_completions WHERE user_id = ? AND course_id = ?'
  ).get(req.user.id, courseId);
  if (!completion) {
    return res.status(403).json({ error: 'Debes completar el material antes de realizar el examen' });
  }

  const questions = db.prepare(
    'SELECT id FROM questions WHERE course_id = ?'
  ).all(courseId);

  if (questions.length === 0) {
    return res.status(400).json({ error: 'Esta capacitación no tiene preguntas configuradas' });
  }

  // Score calculation
  let correct = 0;
  const details = questions.map(q => {
    const correctOption = db.prepare(
      'SELECT id FROM options WHERE question_id = ? AND is_correct = 1'
    ).get(q.id);
    const selectedOptionId = answers[q.id];
    const isCorrect = correctOption && selectedOptionId === correctOption.id;
    if (isCorrect) correct++;
    return {
      question_id: q.id,
      selected: selectedOptionId ?? null,
      correct_option: correctOption?.id ?? null,
      is_correct: isCorrect
    };
  });

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= course.pass_percentage ? 1 : 0;

  const attemptId = uuidv4();
  db.prepare(`
    INSERT INTO quiz_attempts (id, user_id, course_id, score, passed)
    VALUES (?, ?, ?, ?, ?)
  `).run(attemptId, req.user.id, courseId, score, passed);

  let certificateId = null;
  if (passed) {
    try {
      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
      const filename = await generateCertificate({
        userName: user.name,
        courseName: course.title,
        score,
        date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
        attemptId
      });

      certificateId = uuidv4();
      db.prepare(`
        INSERT INTO certificates (id, user_id, course_id, attempt_id, pdf_filename)
        VALUES (?, ?, ?, ?, ?)
      `).run(certificateId, req.user.id, courseId, attemptId, filename);
    } catch (err) {
      console.error('Error generating certificate:', err.message);
    }
  }

  res.json({
    attempt_id: attemptId,
    score,
    passed: !!passed,
    correct,
    total: questions.length,
    pass_percentage: course.pass_percentage,
    certificate_id: certificateId,
    details
  });
}

function getCourseAttempts(req, res) {
  const db = getDb();
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;
  const attempts = db.prepare(`
    SELECT qa.*, c.title as course_title,
      cert.id as certificate_id
    FROM quiz_attempts qa
    JOIN courses c ON c.id = qa.course_id
    LEFT JOIN certificates cert ON cert.attempt_id = qa.id
    WHERE qa.user_id = ? AND qa.course_id = ?
    ORDER BY qa.completed_at DESC
  `).all(userId, req.params.courseId);
  res.json(attempts);
}

function myGrades(req, res) {
  const db = getDb();
  const grades = db.prepare(`
    SELECT qa.id, qa.score, qa.passed, qa.completed_at,
      c.id as course_id, c.title as course_title,
      cert.id as certificate_id
    FROM quiz_attempts qa
    JOIN courses c ON c.id = qa.course_id
    LEFT JOIN certificates cert ON cert.attempt_id = qa.id
    WHERE qa.user_id = ?
    ORDER BY qa.completed_at DESC
  `).all(req.user.id);
  res.json(grades);
}

function allGrades(req, res) {
  const db = getDb();
  const grades = db.prepare(`
    SELECT qa.id, qa.score, qa.passed, qa.completed_at,
      u.id as user_id, u.name as user_name, u.email as user_email,
      c.id as course_id, c.title as course_title,
      cert.id as certificate_id
    FROM quiz_attempts qa
    JOIN users u ON u.id = qa.user_id
    JOIN courses c ON c.id = qa.course_id
    LEFT JOIN certificates cert ON cert.attempt_id = qa.id
    ORDER BY qa.completed_at DESC
  `).all();
  res.json(grades);
}

function dashboardStats(req, res) {
  const db = getDb();

  const totalStudents = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get().c;
  const totalCourses  = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  const totalAttempts = db.prepare('SELECT COUNT(*) as c FROM quiz_attempts').get().c;
  const totalPassed   = db.prepare('SELECT COUNT(*) as c FROM quiz_attempts WHERE passed = 1').get().c;
  const totalCerts    = db.prepare('SELECT COUNT(*) as c FROM certificates').get().c;

  const recentActivity = db.prepare(`
    SELECT qa.completed_at, qa.score, qa.passed,
      u.name as user_name, c.title as course_title
    FROM quiz_attempts qa
    JOIN users u ON u.id = qa.user_id
    JOIN courses c ON c.id = qa.course_id
    ORDER BY qa.completed_at DESC
    LIMIT 10
  `).all();

  res.json({ totalStudents, totalCourses, totalAttempts, totalPassed, totalCerts, recentActivity });
}

module.exports = { submitQuiz, getCourseAttempts, myGrades, allGrades, dashboardStats };
