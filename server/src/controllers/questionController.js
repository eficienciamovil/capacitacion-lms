const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

function addQuestion(req, res) {
  const { courseId } = req.params;
  const { question_text, options = [] } = req.body;
  if (!question_text) return res.status(400).json({ error: 'El texto de la pregunta es requerido' });
  if (options.length < 2) return res.status(400).json({ error: 'Se requieren al menos 2 opciones' });
  const hasCorrect = options.some(o => o.is_correct);
  if (!hasCorrect) return res.status(400).json({ error: 'Debe haber al menos una opción correcta' });

  const db = getDb();
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
  if (!course) return res.status(404).json({ error: 'Capacitación no encontrada' });

  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM questions WHERE course_id = ?').get(courseId);
  const order = (maxOrder?.m ?? -1) + 1;

  const questionId = uuidv4();
  db.prepare(
    'INSERT INTO questions (id, course_id, question_text, order_index) VALUES (?, ?, ?, ?)'
  ).run(questionId, courseId, question_text.trim(), order);

  options.forEach((opt, i) => {
    db.prepare(
      'INSERT INTO options (id, question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), questionId, opt.option_text.trim(), opt.is_correct ? 1 : 0, i);
  });

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
  const savedOptions = db.prepare('SELECT * FROM options WHERE question_id = ? ORDER BY order_index').all(questionId);

  res.status(201).json({ ...question, options: savedOptions });
}

function updateQuestion(req, res) {
  const { id } = req.params;
  const { question_text } = req.body;
  if (!question_text) return res.status(400).json({ error: 'El texto es requerido' });

  const db = getDb();
  const q = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
  if (!q) return res.status(404).json({ error: 'Pregunta no encontrada' });

  db.prepare('UPDATE questions SET question_text = ? WHERE id = ?').run(question_text.trim(), id);
  res.json(db.prepare('SELECT * FROM questions WHERE id = ?').get(id));
}

function deleteQuestion(req, res) {
  const db = getDb();
  const q = db.prepare('SELECT id FROM questions WHERE id = ?').get(req.params.id);
  if (!q) return res.status(404).json({ error: 'Pregunta no encontrada' });
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Pregunta eliminada' });
}

function addOption(req, res) {
  const { questionId } = req.params;
  const { option_text, is_correct = false } = req.body;
  if (!option_text) return res.status(400).json({ error: 'El texto de la opción es requerido' });

  const db = getDb();
  const q = db.prepare('SELECT id FROM questions WHERE id = ?').get(questionId);
  if (!q) return res.status(404).json({ error: 'Pregunta no encontrada' });

  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM options WHERE question_id = ?').get(questionId);
  const order = (maxOrder?.m ?? -1) + 1;
  const id = uuidv4();

  db.prepare(
    'INSERT INTO options (id, question_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)'
  ).run(id, questionId, option_text.trim(), is_correct ? 1 : 0, order);

  res.status(201).json(db.prepare('SELECT * FROM options WHERE id = ?').get(id));
}

function updateOption(req, res) {
  const { id } = req.params;
  const { option_text, is_correct } = req.body;
  const db = getDb();
  const opt = db.prepare('SELECT * FROM options WHERE id = ?').get(id);
  if (!opt) return res.status(404).json({ error: 'Opción no encontrada' });

  db.prepare('UPDATE options SET option_text = ?, is_correct = ? WHERE id = ?').run(
    option_text ?? opt.option_text,
    is_correct !== undefined ? (is_correct ? 1 : 0) : opt.is_correct,
    id
  );
  res.json(db.prepare('SELECT * FROM options WHERE id = ?').get(id));
}

function deleteOption(req, res) {
  const db = getDb();
  const opt = db.prepare('SELECT id FROM options WHERE id = ?').get(req.params.id);
  if (!opt) return res.status(404).json({ error: 'Opción no encontrada' });
  db.prepare('DELETE FROM options WHERE id = ?').run(req.params.id);
  res.json({ message: 'Opción eliminada' });
}

module.exports = { addQuestion, updateQuestion, deleteQuestion, addOption, updateOption, deleteOption };
