const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const ExcelJS = require('exceljs');
const { authenticate } = require('../middleware/auth');

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', authenticate, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  
  const sales = db.prepare("SELECT * FROM sales WHERE date=? ORDER BY id DESC").all(date);
  const purchases = db.prepare("SELECT * FROM milk_purchases WHERE date=? ORDER BY id DESC").all(date);
  const production = db.prepare("SELECT * FROM production_records WHERE date=? ORDER BY id DESC").all(date);
  const expenses = db.prepare("SELECT * FROM expenses WHERE date=? ORDER BY id DESC").all(date);

  const totalSales = sales.reduce((s, r) => s + r.total, 0);
  const totalPurchases = purchases.reduce((s, r) => s + r.total_cost, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const profit = totalSales - totalPurchases - totalExpenses;

  res.json({ date, sales, purchases, production, expenses, summary: { totalSales, totalPurchases, totalExpenses, profit } });
});

// GET /api/reports/monthly?month=3&year=2026
router.get('/monthly', authenticate, (req, res) => {
  const now = new Date();
  const month = String(req.query.month || now.getMonth()+1).padStart(2,'0');
  const year = req.query.year || now.getFullYear();
  const prefix = `${year}-${month}`;

  const sales = db.prepare(`SELECT date, SUM(total) as total FROM sales WHERE date LIKE ? GROUP BY date ORDER BY date`).all(`${prefix}%`);
  const expenses = db.prepare(`SELECT date, SUM(amount) as total FROM expenses WHERE date LIKE ? GROUP BY date ORDER BY date`).all(`${prefix}%`);
  const purchases = db.prepare(`SELECT date, SUM(total_cost) as total FROM milk_purchases WHERE date LIKE ? GROUP BY date ORDER BY date`).all(`${prefix}%`);

  const totalSales = sales.reduce((s,r)=>s+r.total,0);
  const totalExpenses = expenses.reduce((s,r)=>s+r.total,0);
  const totalPurchases = purchases.reduce((s,r)=>s+r.total,0);

  const topProducts = db.prepare(`
    SELECT si.item_name, SUM(si.quantity) as total_qty, SUM(si.amount) as total_amount
    FROM sale_items si JOIN sales s ON s.id = si.sale_id
    WHERE s.date LIKE ? GROUP BY si.item_name ORDER BY total_amount DESC LIMIT 5
  `).all(`${prefix}%`);

  res.json({ month: `${year}-${month}`, sales, expenses, purchases, topProducts, summary: { totalSales, totalExpenses, totalPurchases, profit: totalSales - totalPurchases - totalExpenses } });
});

// GET /api/reports/profit?from=&to=
router.get('/profit', authenticate, (req, res) => {
  const from = req.query.from || new Date().toISOString().split('T')[0];
  const to = req.query.to || from;

  const totalSales = db.prepare("SELECT COALESCE(SUM(total),0) as t FROM sales WHERE date BETWEEN ? AND ?").get(from,to).t;
  const totalPurchases = db.prepare("SELECT COALESCE(SUM(total_cost),0) as t FROM milk_purchases WHERE date BETWEEN ? AND ?").get(from,to).t;
  const totalExpenses = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE date BETWEEN ? AND ?").get(from,to).t;
  const profit = totalSales - totalPurchases - totalExpenses;

  res.json({ from, to, totalSales, totalPurchases, totalExpenses, profit, profitMargin: totalSales > 0 ? ((profit/totalSales)*100).toFixed(2) : 0 });
});

// GET /api/reports/export?type=sales&format=xlsx&from=&to=
router.get('/export', authenticate, async (req, res) => {
  const { type = 'sales', format = 'xlsx', from, to } = req.query;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(type.toUpperCase());

  if (type === 'sales') {
    const rows = db.prepare("SELECT bill_number, date, customer_name, payment_method, subtotal, gst_amount, total FROM sales WHERE date BETWEEN ? AND ? ORDER BY date DESC").all(from, to);
    sheet.columns = [
      { header: 'Bill No', key: 'bill_number', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer_name', width: 25 },
      { header: 'Payment', key: 'payment_method', width: 12 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'GST', key: 'gst_amount', width: 12 },
      { header: 'Total', key: 'total', width: 14 },
    ];
    rows.forEach(r => sheet.addRow(r));
  } else if (type === 'expenses') {
    const rows = db.prepare("SELECT date, category, description, amount FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC").all(from, to);
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description', key: 'description', width: 35 },
      { header: 'Amount', key: 'amount', width: 14 },
    ];
    rows.forEach(r => sheet.addRow(r));
  } else if (type === 'purchases') {
    const rows = db.prepare("SELECT date, supplier_name, litres, rate_per_litre, total_cost FROM milk_purchases WHERE date BETWEEN ? AND ? ORDER BY date DESC").all(from, to);
    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Supplier', key: 'supplier_name', width: 25 },
      { header: 'Litres', key: 'litres', width: 12 },
      { header: 'Rate/L', key: 'rate_per_litre', width: 12 },
      { header: 'Total Cost', key: 'total_cost', width: 15 },
    ];
    rows.forEach(r => sheet.addRow(r));
  }

  // Style header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_report.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
