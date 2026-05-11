const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/production
router.get('/', authenticate, (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM production_records';
  const params = [];
  if (from && to) { query += ' WHERE date BETWEEN ? AND ?'; params.push(from, to); }
  query += ' ORDER BY date DESC, id DESC';
  res.json(db.prepare(query).all(...params));
});

// POST /api/production
router.post('/', authenticate, (req, res) => {
  const { product_id, date, quantity_produced, notes } = req.body;
  if (!product_id || !date || !quantity_produced) {
    return res.status(400).json({ error: 'product_id, date, quantity_produced required' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id=?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const milk_used = parseFloat(quantity_produced) * parseFloat(product.milk_per_unit);
  const milkStock = db.prepare('SELECT litres FROM milk_inventory WHERE id=1').get();

  if (milkStock.litres < milk_used) {
    return res.status(400).json({ error: `Insufficient milk. Available: ${milkStock.litres.toFixed(2)}L, Required: ${milk_used.toFixed(2)}L` });
  }

  const runProduction = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO production_records (product_id, product_name, date, quantity_produced, milk_used, notes) VALUES (?,?,?,?,?,?)'
    ).run(product_id, product.name, date, quantity_produced, milk_used, notes || null);

    db.prepare('UPDATE milk_inventory SET litres = litres - ? WHERE id=1').run(milk_used);
    db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE product_id=?').run(quantity_produced, product_id);

    return r.lastInsertRowid;
  });

  const id = runProduction();
  res.json({
    id,
    milk_used,
    new_milk_stock: db.prepare('SELECT litres FROM milk_inventory WHERE id=1').get().litres,
    new_product_stock: db.prepare('SELECT quantity FROM inventory WHERE product_id=?').get(product_id).quantity
  });
});

module.exports = router;
