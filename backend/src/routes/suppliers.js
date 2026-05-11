const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/suppliers
router.get('/', authenticate, (req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
  res.json(suppliers);
});

// POST /api/suppliers
router.post('/', authenticate, (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier name is required' });
  const r = db.prepare('INSERT INTO suppliers (name, phone, address) VALUES (?,?,?)').run(name, phone || null, address || null);
  res.json({ id: r.lastInsertRowid, name, phone, address });
});

// PUT /api/suppliers/:id
router.put('/:id', authenticate, (req, res) => {
  const { name, phone, address } = req.body;
  db.prepare('UPDATE suppliers SET name=?, phone=?, address=? WHERE id=?').run(name, phone, address, req.params.id);
  res.json({ success: true });
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM suppliers WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
