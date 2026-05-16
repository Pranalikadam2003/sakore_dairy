require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/purchases',  require('./routes/purchases'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/production', require('./routes/production'));
app.use('/api/inventory',  require('./routes/inventory'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/users',      require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🥛 Sakore Dairy API running on http://localhost:${PORT}`));
