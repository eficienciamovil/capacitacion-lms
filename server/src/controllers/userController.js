const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

function listUsers(req, res) {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
}

function createUser(req, res) {
  const { name, email, password, role = 'student' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  }
  if (!['admin', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'El email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name.trim(), email.toLowerCase().trim(), hash, role);

  res.status(201).json({ id, name, email: email.toLowerCase().trim(), role, is_active: 1 });
}

function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password, is_active } = req.body;

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Prevent disabling the only admin
  if (user.role === 'admin' && is_active === 0) {
    const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND is_active = 1").get();
    if (adminCount.c <= 1) {
      return res.status(400).json({ error: 'No se puede desactivar el único administrador' });
    }
  }

  const newName      = name      ?? user.name;
  const newEmail     = email     ? email.toLowerCase().trim() : user.email;
  const newActive    = is_active ?? user.is_active;
  const newHash      = password  ? bcrypt.hashSync(password, 10) : user.password_hash;

  if (newEmail !== user.email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail, id);
    if (conflict) return res.status(409).json({ error: 'El email ya está en uso' });
  }

  db.prepare(
    'UPDATE users SET name = ?, email = ?, password_hash = ?, is_active = ? WHERE id = ?'
  ).run(newName, newEmail, newHash, newActive, id);

  res.json({ id, name: newName, email: newEmail, role: user.role, is_active: newActive });
}

function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'No se pueden eliminar administradores' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: 'Usuario eliminado correctamente' });
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
