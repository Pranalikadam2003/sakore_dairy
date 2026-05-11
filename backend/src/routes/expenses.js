const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/expenses
router.get('/', authenticate, (req, res) => {
  const { from, to, month, year } = req.query;
  let query = 'SELECT * FROM expenses';
  const params = [];
  if (from && to) {
    query += ' WHERE date BETWEEN ? AND ?'; params.push(from, to);
  } else if (month && year) {
    query += " WHERE strftime('%Y-%m', date) = ?";
    params.push(`${year}-${String(month).padStart(2,'0')}`);
  }
  query += ' ORDER BY date DESC, id DESC';
  res.json(db.prepare(query).all(...params));
});

// POST /api/expenses
router.post('/', authenticate, (req, res) => {
  const { date, category, description, amount } = req.body;
  if (!date || !category || !amount) return res.status(400).json({ error: 'date, category, amount required' });
  const r = db.prepare('INSERT INTO expenses (date, category, description, amount) VALUES (?,?,?,?)').run(date, category, description || null, amount);
  res.json({ id: r.lastInsertRowid });
});

// PUT /api/expenses/:id
router.put('/:id', authenticate, (req, res) => {
  const { date, category, description, amount } = req.body;
  db.prepare('UPDATE expenses SET date=?, category=?, description=?, amount=? WHERE id=?').run(date, category, description, amount, req.params.id);
  res.json({ success: true });
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
