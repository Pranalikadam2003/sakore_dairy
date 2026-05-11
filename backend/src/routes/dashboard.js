const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/summary
router.get('/summary', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const milkPurchasedToday = db.prepare("SELECT COALESCE(SUM(litres),0) as v FROM milk_purchases WHERE date=?").get(today).v;
  const purchaseCostToday = db.prepare("SELECT COALESCE(SUM(total_cost),0) as v FROM milk_purchases WHERE date=?").get(today).v;

  const milkSoldToday = db.prepare("SELECT COALESCE(SUM(quantity),0) as v FROM sale_items si JOIN sales s ON s.id=si.sale_id WHERE si.item_type='milk' AND s.date=?").get(today).v;
  const milkUsedProduction = db.prepare("SELECT COALESCE(SUM(milk_used),0) as v FROM production_records WHERE date=?").get(today).v;

  const totalSalesToday = db.prepare("SELECT COALESCE(SUM(total),0) as v FROM sales WHERE date=?").get(today).v;
  const totalExpensesToday = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM expenses WHERE date=?").get(today).v;
  const profit = totalSalesToday - purchaseCostToday - totalExpensesToday;

  const milkStock = db.prepare("SELECT litres FROM milk_inventory WHERE id=1").get()?.litres || 0;

  // Sales last 7 days for chart
  const salesChart = db.prepare(`
    SELECT date, COALESCE(SUM(total),0) as total FROM sales
    WHERE date >= date('now','-6 days') GROUP BY date ORDER BY date
  `).all();

  // Low stock alerts
  const lowProducts = db.prepare(`
    SELECT p.name, COALESCE(i.quantity,0) as quantity, p.unit
    FROM products p LEFT JOIN inventory i ON i.product_id=p.id
    WHERE COALESCE(i.quantity,0) <= p.low_stock_threshold
  `).all();

  // Recent sales
  const recentSales = db.prepare("SELECT * FROM sales ORDER BY id DESC LIMIT 5").all();

  res.json({
    today,
    milkPurchasedToday,
    milkSoldToday,
    milkUsedProduction,
    milkStock,
    totalSalesToday,
    totalExpensesToday,
    purchaseCostToday,
    profit,
    salesChart,
    lowStockAlerts: lowProducts,
    lowMilk: milkStock < 50,
    recentSales,
  });
});

module.exports = router;
