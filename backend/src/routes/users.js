const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/schema');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/users (admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id').all();
  res.json(users);
});

// POST /api/users (admin only)
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)').run(name, email, hash, role || 'staff');
  res.json({ id: r.lastInsertRowid });
});

// PUT /api/users/:id (admin only)
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, role, password } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, role=?, password_hash=? WHERE id=?').run(name, role, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET name=?, role=? WHERE id=?').run(name, role, req.params.id);
  }
  res.json({ success: true });
});

// DELETE /api/users/:id (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
