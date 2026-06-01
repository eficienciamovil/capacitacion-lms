const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { UPLOADS_DIR: UPLOADS } = require('../config/paths');

// In-memory short-lived tokens for public presentation access (Office Online viewer)
const _viewTokens = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [t, d] of _viewTokens) if (d.expiresAt < now) _viewTokens.delete(t);
}, 60_000);

function listCourses(req, res) {
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM questions q WHERE q.course_id = c.id) AS question_count
    FROM courses c
    ORDER BY c.created_at DESC
  `).all();

  if (req.user.role === 'student') {
    const enriched = courses.map(c => {
      const completion = db.prepare(
        'SELECT id FROM material_completions WHERE user_id = ? AND course_id = ?'
      ).get(req.user.id, c.id);
      const bestAttempt = db.prepare(`
        SELECT score, passed FROM quiz_attempts
        WHERE user_id = ? AND course_id = ?
        ORDER BY score DESC LIMIT 1
      `).get(req.user.id, c.id);
      return {
        ...c,
        material_completed: !!completion,
        best_score: bestAttempt?.score ?? null,
        passed: bestAttempt?.passed ?? 0
      };
    });
    return res.json(enriched);
  }

  res.json(courses);
}

function getCourse(req, res) {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  const questions = db.prepare(
    'SELECT * FROM questions WHERE course_id = ? ORDER BY order_index ASC'
  ).all(course.id);

  const questionsWithOptions = questions.map(q => {
    const options = db.prepare(
      'SELECT * FROM options WHERE question_id = ? ORDER BY order_index ASC'
    ).all(q.id);
    // Only expose correct answer to admin
    return {
      ...q,
      options: options.map(o => ({
        id: o.id,
        option_text: o.option_text,
        order_index: o.order_index,
        ...(req.user.role === 'admin' ? { is_correct: o.is_correct } : {})
      }))
    };
  });

  res.json({ ...course, questions: questionsWithOptions });
}

function createCourse(req, res) {
  const { title, description = '', pass_percentage } = req.body;
  if (!title) return res.status(400).json({ error: 'El título es requerido' });

  const db = getDb();
  const id = uuidv4();
  const pct = parseInt(pass_percentage) || parseInt(process.env.DEFAULT_PASS_PERCENTAGE) || 70;

  // Handle files from separate upload fields (if using single combined upload route)
  const videoFile        = req.files?.video?.[0];
  const presentationFile = req.files?.presentation?.[0];

  db.prepare(`
    INSERT INTO courses (id, title, description, video_filename, presentation_filename, pass_percentage)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, title.trim(), description.trim(), videoFile?.filename ?? null, presentationFile?.filename ?? null, pct);

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.status(201).json(course);
}

function uploadVideo(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo de video' });
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  // Delete old file
  if (course.video_filename) {
    const oldPath = path.join(UPLOADS, 'videos', course.video_filename);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare('UPDATE courses SET video_filename = ? WHERE id = ?').run(req.file.filename, req.params.id);
  res.json({ video_filename: req.file.filename });
}

function uploadPresentation(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo de presentación' });
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  if (course.presentation_filename) {
    const oldPath = path.join(UPLOADS, 'presentations', course.presentation_filename);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare('UPDATE courses SET presentation_filename = ? WHERE id = ?').run(req.file.filename, req.params.id);
  res.json({ presentation_filename: req.file.filename });
}

function updateCourse(req, res) {
  const { id } = req.params;
  const { title, description, pass_percentage } = req.body;
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  db.prepare(`
    UPDATE courses SET
      title = ?,
      description = ?,
      pass_percentage = ?
    WHERE id = ?
  `).run(
    title ?? course.title,
    description ?? course.description,
    parseInt(pass_percentage) || course.pass_percentage,
    id
  );

  res.json(db.prepare('SELECT * FROM courses WHERE id = ?').get(id));
}

function deleteCourse(req, res) {
  const { id } = req.params;
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  // Delete associated files
  if (course.video_filename) {
    const p = path.join(UPLOADS, 'videos', course.video_filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (course.presentation_filename) {
    const p = path.join(UPLOADS, 'presentations', course.presentation_filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  // Delete associated certificates
  const certs = db.prepare('SELECT pdf_filename FROM certificates WHERE course_id = ?').all(id);
  certs.forEach(c => {
    const p = path.join(__dirname, '../../certificates', c.pdf_filename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  res.json({ message: 'Capacitación eliminada correctamente' });
}

function streamVideo(req, res) {
  const db = getDb();
  const course = db.prepare('SELECT video_filename FROM courses WHERE id = ?').get(req.params.id);
  if (!course?.video_filename) return res.status(404).json({ error: 'Video no disponible' });

  const videoPath = path.join(UPLOADS, 'videos', course.video_filename);
  if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Archivo no encontrado' });

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4'
    });
    fs.createReadStream(videoPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    });
    fs.createReadStream(videoPath).pipe(res);
  }
}

function servePresentation(req, res) {
  const db = getDb();
  const course = db.prepare('SELECT presentation_filename FROM courses WHERE id = ?').get(req.params.id);
  if (!course?.presentation_filename) return res.status(404).json({ error: 'Presentación no disponible' });

  const filePath = path.join(UPLOADS, 'presentations', course.presentation_filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });

  res.sendFile(filePath);
}

function getPresentationToken(req, res) {
  const db = getDb();
  const course = db.prepare('SELECT presentation_filename FROM courses WHERE id = ?').get(req.params.id);
  if (!course?.presentation_filename) return res.status(404).json({ error: 'No hay presentación disponible' });
  const token = uuidv4();
  _viewTokens.set(token, { courseId: req.params.id, expiresAt: Date.now() + 10 * 60 * 1000 });
  res.json({ token });
}

function servePresentationPublic(req, res) {
  const { t } = req.query;
  if (!t) return res.status(401).json({ error: 'Token requerido' });
  const entry = _viewTokens.get(t);
  if (!entry || entry.courseId !== req.params.id || entry.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  const db = getDb();
  const course = db.prepare('SELECT presentation_filename FROM courses WHERE id = ?').get(req.params.id);
  if (!course?.presentation_filename) return res.status(404).json({ error: 'Presentación no disponible' });
  const filePath = path.join(UPLOADS, 'presentations', course.presentation_filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.sendFile(filePath);
}

function completeMaterial(req, res) {
  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  db.prepare(`
    INSERT OR IGNORE INTO material_completions (id, user_id, course_id)
    VALUES (?, ?, ?)
  `).run(uuidv4(), req.user.id, req.params.id);

  res.json({ message: 'Material marcado como completado' });
}

module.exports = {
  listCourses, getCourse, createCourse, uploadVideo, uploadPresentation,
  updateCourse, deleteCourse, streamVideo, servePresentation, completeMaterial,
  getPresentationToken, servePresentationPublic,
};
