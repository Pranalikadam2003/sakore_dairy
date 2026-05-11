const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const PDFDocument = require('pdfkit');
const { authenticate } = require('../middleware/auth');

function generateBillNumber() {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(-2) +
    String(now.getMonth()+1).padStart(2,'0') +
    String(now.getDate()).padStart(2,'0') +
    String(now.getHours()).padStart(2,'0') +
    String(now.getMinutes()).padStart(2,'0') +
    String(now.getSeconds()).padStart(2,'0');
  return `SD-${ts}`;
}

// GET /api/sales
router.get('/', authenticate, (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM sales';
  const params = [];
  if (from && to) { query += ' WHERE date BETWEEN ? AND ?'; params.push(from, to); }
  query += ' ORDER BY date DESC, id DESC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/sales/:id
router.get('/:id', authenticate, (req, res) => {
  if (req.params.id === 'pdf') return res.status(400).json({ error: 'Invalid id' });
  const sale = db.prepare('SELECT * FROM sales WHERE id=?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id=?').all(sale.id);
  res.json({ ...sale, items });
});

// POST /api/sales
router.post('/', authenticate, (req, res) => {
  const { customer_name, customer_phone, date, payment_method, items, gst_percent } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'No items in sale' });

  const gst = parseFloat(gst_percent) || 0;
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const qty = parseFloat(item.quantity);
    const rate = parseFloat(item.rate);
    const amount = qty * rate;
    subtotal += amount;

    if (item.item_type === 'milk') {
      const milkStock = db.prepare('SELECT litres FROM milk_inventory WHERE id=1').get();
      if (milkStock.litres < qty) {
        return res.status(400).json({ error: `Insufficient milk. Available: ${milkStock.litres.toFixed(2)}L` });
      }
      processedItems.push({ ...item, qty, rate, amount, item_name: 'Milk', unit: 'litre' });
    } else {
      const product = db.prepare('SELECT * FROM products WHERE id=?').get(item.product_id);
      if (!product) return res.status(400).json({ error: `Product not found: ${item.product_id}` });
      const invRow = db.prepare('SELECT quantity FROM inventory WHERE product_id=?').get(item.product_id);
      if (!invRow || invRow.quantity < qty) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}. Available: ${invRow?.quantity || 0} ${product.unit}` });
      }
      processedItems.push({ ...item, qty, rate, amount, item_name: product.name, unit: product.unit });
    }
  }

  const gst_amount = (subtotal * gst) / 100;
  const total = subtotal + gst_amount;
  const bill_number = generateBillNumber();

  const createSale = db.transaction(() => {
    const saleResult = db.prepare(`
      INSERT INTO sales (bill_number, customer_name, customer_phone, date, payment_method, subtotal, gst_percent, gst_amount, total)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(bill_number, customer_name || 'Walk-in Customer', customer_phone || null, date, payment_method || 'Cash', subtotal, gst, gst_amount, total);

    const saleId = saleResult.lastInsertRowid;
    const insertItem = db.prepare('INSERT INTO sale_items (sale_id, item_type, product_id, item_name, quantity, unit, rate, amount) VALUES (?,?,?,?,?,?,?,?)');

    for (const item of processedItems) {
      insertItem.run(saleId, item.item_type, item.product_id || null, item.item_name, item.qty, item.unit, item.rate, item.amount);
      if (item.item_type === 'milk') {
        db.prepare('UPDATE milk_inventory SET litres = litres - ? WHERE id=1').run(item.qty);
      } else {
        db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE product_id=?').run(item.qty, item.product_id);
      }
    }
    return saleId;
  });

  const saleId = createSale();
  const sale = db.prepare('SELECT * FROM sales WHERE id=?').get(saleId);
  const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id=?').all(saleId);
  res.json({ ...sale, items: saleItems });
});

// GET /api/sales/:id/pdf  — token accepted via ?token= query param (see auth middleware)
router.get('/:id/pdf', authenticate, (req, res) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id=?').get(req.params.id);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  const items = db.prepare('SELECT * FROM sale_items WHERE sale_id=?').all(sale.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="Bill-${sale.bill_number}.pdf"`);

  // A5 = 419.53 x 595.28 pts. margin=30, content width = 359
  const doc = new PDFDocument({ size: 'A5', margin: 30 });
  const W  = 419;
  const M  = 30;
  const CW = W - M * 2; // 359

  doc.pipe(res);

  // ── Header
  doc.fontSize(15).font('Helvetica-Bold')
     .text('SAKORE DAIRY FARM', M, 32, { width: CW, align: 'center' });
  doc.fontSize(8).font('Helvetica')
     .text('Fresh Milk & Dairy Products', M, doc.y + 3, { width: CW, align: 'center' });
  doc.moveDown(0.6);
  doc.moveTo(M, doc.y).lineTo(W - M, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.5);

  // ── Bill Meta (two-column layout)
  doc.fontSize(8).font('Helvetica').fillColor('#000');
  const metaY = doc.y;
  doc.text(`Bill No: ${sale.bill_number}`,    M,           metaY, { width: CW / 2 });
  doc.text(`Date: ${sale.date}`,              M + CW / 2,  metaY, { width: CW / 2, align: 'right' });
  doc.moveDown(0.3);
  const m2Y = doc.y;
  doc.text(`Customer: ${sale.customer_name}`, M,           m2Y, { width: CW / 2 });
  doc.text(`Payment: ${sale.payment_method}`, M + CW / 2,  m2Y, { width: CW / 2, align: 'right' });
  if (sale.customer_phone) {
    doc.moveDown(0.25);
    doc.text(`Phone: ${sale.customer_phone}`, M);
  }
  doc.moveDown(0.6);

  // ── Table columns (fit within 359px content width)
  // Item(0-154) | Qty(165-219) | Rate(230-284) | Amount(295-359)
  const cItem = M;
  const cQty  = M + 165;
  const cRate = M + 235;
  const cAmt  = M + 295;

  doc.moveTo(M, doc.y).lineTo(W - M, doc.y).strokeColor('#999').stroke();
  doc.moveDown(0.35);

  const hY = doc.y;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#555');
  doc.text('ITEM',    cItem, hY, { width: 155 });
  doc.text('QTY',     cQty,  hY, { width: 55, align: 'right' });
  doc.text('RATE',    cRate, hY, { width: 55, align: 'right' });
  doc.text('AMOUNT',  cAmt,  hY, { width: 64, align: 'right' });

  doc.moveDown(0.4);
  doc.moveTo(M, doc.y).lineTo(W - M, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.35);

  // ── Items
  doc.font('Helvetica').fontSize(8).fillColor('#000');
  items.forEach(item => {
    const y = doc.y;
    doc.text(item.item_name,                              cItem, y, { width: 155 });
    doc.text(`${item.quantity} ${item.unit}`,             cQty,  y, { width: 55, align: 'right' });
    doc.text(`Rs.${Number(item.rate).toFixed(2)}`,        cRate, y, { width: 55, align: 'right' });
    doc.text(`Rs.${Number(item.amount).toFixed(2)}`,      cAmt,  y, { width: 64, align: 'right' });
    doc.moveDown(0.65);
  });

  // ── Totals
  doc.moveTo(M, doc.y).lineTo(W - M, doc.y).strokeColor('#999').stroke();
  doc.moveDown(0.4);

  const addRow = (label, val, bold) => {
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 9 : 8);
    doc.text(label,                                      cRate, y, { width: 55, align: 'right' });
    doc.text(`Rs.${Number(val).toFixed(2)}`,             cAmt,  y, { width: 64, align: 'right' });
    doc.moveDown(0.5);
  };

  addRow('Subtotal:', sale.subtotal, false);
  if (sale.gst_percent > 0) addRow(`GST (${sale.gst_percent}%):`, sale.gst_amount, false);
  addRow('TOTAL:', sale.total, true);

  doc.moveDown(1.2);
  doc.fontSize(8).font('Helvetica').fillColor('#555')
     .text('Thank you for your purchase!', M, doc.y, { width: CW, align: 'center' });

  doc.end();
});

module.exports = router;
