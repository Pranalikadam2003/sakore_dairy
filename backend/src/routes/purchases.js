const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/purchases
router.get('/', authenticate, (req, res) => {
  const { from, to, limit } = req.query;
  let query = `SELECT mp.*, s.name as supplier_name_ref FROM milk_purchases mp
               LEFT JOIN suppliers s ON mp.supplier_id = s.id`;
  const params = [];
  if (from && to) {
    query += ' WHERE mp.date BETWEEN ? AND ?';
    params.push(from, to);
  } else if (from) {
    query += ' WHERE mp.date >= ?';
    params.push(from);
  }
  query += ' ORDER BY mp.date DESC, mp.id DESC';
  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
  res.json(db.prepare(query).all(...params));
});

// POST /api/purchases
router.post('/', authenticate, (req, res) => {
  const { supplier_id, supplier_name, date, litres, rate_per_litre, notes } = req.body;
  if (!date || !litres || !rate_per_litre) return res.status(400).json({ error: 'Date, litres, and rate required' });

  const total_cost = parseFloat(litres) * parseFloat(rate_per_litre);
  const r = db.prepare(
    'INSERT INTO milk_purchases (supplier_id, supplier_name, date, litres, rate_per_litre, total_cost, notes) VALUES (?,?,?,?,?,?,?)'
  ).run(supplier_id || null, supplier_name || 'Unknown', date, litres, rate_per_litre, total_cost, notes || null);

  // Add to milk inventory
  db.prepare('UPDATE milk_inventory SET litres = litres + ? WHERE id = 1').run(litres);

  res.json({ id: r.lastInsertRowid, total_cost, milk_stock: db.prepare('SELECT litres FROM milk_inventory WHERE id=1').get().litres });
});

// DELETE /api/purchases/:id
router.delete('/:id', authenticate, (req, res) => {
  const purchase = db.prepare('SELECT litres FROM milk_purchases WHERE id=?').get(req.params.id);
  if (!purchase) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM milk_purchases WHERE id=?').run(req.params.id);
  // Reduce milk inventory
  db.prepare('UPDATE milk_inventory SET litres = MAX(0, litres - ?) WHERE id = 1').run(purchase.litres);
  res.json({ success: true });
});

module.exports = router;
