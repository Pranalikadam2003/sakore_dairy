const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'sakore.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin','staff')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS milk_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER REFERENCES suppliers(id),
    supplier_name TEXT,
    date TEXT NOT NULL,
    litres REAL NOT NULL,
    rate_per_litre REAL NOT NULL,
    total_cost REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    selling_price REAL NOT NULL DEFAULT 0,
    milk_per_unit REAL NOT NULL DEFAULT 0,
    low_stock_threshold REAL NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER UNIQUE REFERENCES products(id),
    quantity REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS milk_inventory (
    id INTEGER PRIMARY KEY DEFAULT 1,
    litres REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS production_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    product_name TEXT,
    date TEXT NOT NULL,
    quantity_produced REAL NOT NULL,
    milk_used REAL NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone TEXT,
    date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK(payment_method IN ('Cash','UPI','Card')),
    subtotal REAL NOT NULL,
    gst_percent REAL NOT NULL DEFAULT 0,
    gst_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL DEFAULT 'product' CHECK(item_type IN ('milk','product')),
    product_id INTEGER REFERENCES products(id),
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// Seed milk inventory row
const milkRow = db.prepare('SELECT id FROM milk_inventory WHERE id = 1').get();
if (!milkRow) {
  db.prepare('INSERT INTO milk_inventory (id, litres) VALUES (1, 0)').run();
}

// Seed default admin
const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@sakoredairy.com'").get();
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES ('Administrator','admin@sakoredairy.com',?,'admin')").run(hash);
  console.log('✅ Default admin created: admin@sakoredairy.com / admin123');
}

// Seed default products
const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (productCount.c === 0) {
  const insertProd = db.prepare('INSERT INTO products (name, unit, selling_price, milk_per_unit, low_stock_threshold) VALUES (?,?,?,?,?)');
  const insertInv = db.prepare('INSERT OR IGNORE INTO inventory (product_id, quantity) VALUES (?,?)');
  const prods = [
    ['Curd', 'kg', 60, 8, 2],
    ['Paneer', 'kg', 320, 8, 1],
    ['Butter', 'kg', 480, 20, 0.5],
    ['Ghee', 'kg', 600, 25, 0.5],
    ['Milk (Packet)', 'litre', 55, 1, 5],
  ];
  prods.forEach(p => {
    const r = insertProd.run(...p);
    insertInv.run(r.lastInsertRowid, 0);
  });
}

module.exports = db;
