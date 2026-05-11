const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/inventory
router.get('/', authenticate, (req, res) => {
  const products = db.prepare(`
    SELECT p.id, p.name, p.unit, p.selling_price, p.low_stock_threshold,
           COALESCE(i.quantity,0) as quantity
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY p.name
  `).all();
  const milk = db.prepare('SELECT litres FROM milk_inventory WHERE id=1').get();
  res.json({ milk_stock: milk?.litres || 0, products });
});

// GET /api/inventory/alerts
router.get('/alerts', authenticate, (req, res) => {
  const lowProducts = db.prepare(`
    SELECT p.name, p.unit, p.low_stock_threshold, COALESCE(i.quantity,0) as quantity
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE COALESCE(i.quantity,0) <= p.low_stock_threshold
  `).all();
  const milk = db.prepare('SELECT litres FROM milk_inventory WHERE id=1').get();
  res.json({ low_milk: milk?.litres < 50, milk_stock: milk?.litres || 0, low_products: lowProducts });
});

module.exports = router;
