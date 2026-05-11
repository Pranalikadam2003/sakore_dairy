const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/products
router.get('/', authenticate, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, COALESCE(i.quantity,0) as stock
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY p.name
  `).all();
  res.json(products);
});

// POST /api/products
router.post('/', authenticate, (req, res) => {
  const { name, unit, selling_price, milk_per_unit, low_stock_threshold } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name required' });
  const r = db.prepare(
    'INSERT INTO products (name, unit, selling_price, milk_per_unit, low_stock_threshold) VALUES (?,?,?,?,?)'
  ).run(name, unit || 'kg', selling_price || 0, milk_per_unit || 0, low_stock_threshold || 1);
  db.prepare('INSERT OR IGNORE INTO inventory (product_id, quantity) VALUES (?,0)').run(r.lastInsertRowid);
  res.json({ id: r.lastInsertRowid });
});

// PUT /api/products/:id
router.put('/:id', authenticate, (req, res) => {
  const { name, unit, selling_price, milk_per_unit, low_stock_threshold } = req.body;
  db.prepare('UPDATE products SET name=?, unit=?, selling_price=?, milk_per_unit=?, low_stock_threshold=? WHERE id=?')
    .run(name, unit, selling_price, milk_per_unit, low_stock_threshold, req.params.id);
  res.json({ success: true });
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
