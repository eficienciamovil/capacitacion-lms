const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { DB_PATH } = require('./paths');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('admin', 'student')),
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id                      TEXT PRIMARY KEY,
      title                   TEXT NOT NULL,
      description             TEXT DEFAULT '',
      video_filename          TEXT,
      presentation_filename   TEXT,
      pass_percentage         INTEGER NOT NULL DEFAULT 70,
      created_at              TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id            TEXT PRIMARY KEY,
      course_id     TEXT NOT NULL,
      question_text TEXT NOT NULL,
      order_index   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS options (
      id           TEXT PRIMARY KEY,
      question_id  TEXT NOT NULL,
      option_text  TEXT NOT NULL,
      is_correct   INTEGER NOT NULL DEFAULT 0,
      order_index  INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS material_completions (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      course_id    TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL,
      course_id    TEXT NOT NULL,
      score        REAL,
      passed       INTEGER DEFAULT 0,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      course_id     TEXT NOT NULL,
      attempt_id    TEXT NOT NULL UNIQUE,
      pdf_filename  TEXT NOT NULL,
      issued_at     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
    );
  `);

  // Seed default admin
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@lms.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName     = process.env.ADMIN_NAME     || 'Administrador';

  const existingAdmin = database.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(adminPassword, 10);
    database.prepare(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), adminName, adminEmail, hash, 'admin');
    console.log(`Admin seeded: ${adminEmail}`);
  }

  return database;
}

module.exports = { getDb, initializeDatabase };
