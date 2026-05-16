import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Trash2, AlertTriangle, FileText } from 'lucide-react';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card'];

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    gst_percent: '0',
    items: [{ item_type: 'milk', product_id: '', quantity: '', rate: '' }]
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load sales. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/inventory');
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_type: 'milk', product_id: '', quantity: '', rate: '' }]
    }));
  };

  const removeItem = (idx) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      // Auto-fill rate when product is selected
      if (field === 'item_type' && value === 'milk') {
        items[idx].product_id = '';
        items[idx].rate = '55'; // default milk rate
      }
      if (field === 'product_id' && value) {
        const prod = products.find(p => String(p.id) === String(value));
        if (prod) items[idx].rate = String(prod.selling_price);
      }
      return { ...prev, items };
    });
  };

  const calcSubtotal = () =>
    formData.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + qty * rate;
    }, 0);

  const gst = parseFloat(formData.gst_percent) || 0;
  const subtotal = calcSubtotal();
  const gstAmt = (subtotal * gst) / 100;
  const total = subtotal + gstAmt;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = formData.items.filter(i => i.quantity && i.rate);
    if (validItems.length === 0) {
      setError('Please add at least one item with quantity and rate.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/sales', {
        customer_name: formData.customer_name || 'Walk-in Customer',
        customer_phone: formData.customer_phone || null,
        date: formData.date,
        payment_method: formData.payment_method,
        gst_percent: gst,
        items: validItems.map(item => ({
          item_type: item.item_type,
          product_id: item.item_type === 'product' ? parseInt(item.product_id) : null,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate)
        }))
      });
      setShowForm(false);
      fetchSales();
      setFormData({
        customer_name: '', customer_phone: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash', gst_percent: '0',
        items: [{ item_type: 'milk', product_id: '', quantity: '', rate: '' }]
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save sale.');
      console.error('Error saving sale:', err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = sales.filter(s =>
    (s.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.bill_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sales</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'New Sale'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>New Sale / Bill</h2>
          <form onSubmit={handleSubmit}>
            {/* Customer & Date Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" className="form-input" placeholder="Walk-in Customer"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" placeholder="Optional"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input" style={{ backgroundColor: 'white' }}
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">GST %</label>
                <input type="number" className="form-input" min="0" max="100" step="0.5"
                  value={formData.gst_percent}
                  onChange={(e) => setFormData({ ...formData, gst_percent: e.target.value })} />
              </div>
            </div>

            {/* Sale Items */}
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Items</h3>
            {formData.items.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Type</label>
                  <select className="form-input" style={{ backgroundColor: 'white' }}
                    value={item.item_type}
                    onChange={(e) => updateItem(idx, 'item_type', e.target.value)}>
                    <option value="milk">Milk</option>
                    <option value="product">Product</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{item.item_type === 'product' ? 'Product' : 'Item'}</label>
                  {item.item_type === 'product' ? (
                    <select className="form-input" style={{ backgroundColor: 'white' }} required
                      value={item.product_id}
                      onChange={(e) => updateItem(idx, 'product_id', e.target.value)}>
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.unit}) — Stock: {Number(p.quantity).toFixed(1)}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="form-input" value="Milk (Litre)" readOnly style={{ background: 'var(--bg-color)' }} />
                  )}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Qty *</label>
                  <input type="number" step="0.1" min="0.1" className="form-input" required
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Rate (₹) *</label>
                  <input type="number" step="0.5" min="0" className="form-input" required
                    value={item.rate}
                    onChange={(e) => updateItem(idx, 'rate', e.target.value)} />
                </div>
                <button type="button" onClick={() => removeItem(idx)} disabled={formData.items.length === 1}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.5rem', alignSelf: 'flex-end' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="btn btn-secondary" onClick={addItem} style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <Plus size={14} /> Add Item
            </button>

            {/* Totals Summary */}
            <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', maxWidth: '300px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {gst > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST ({gst}%)</span>
                  <span>₹{gstAmt.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Sale'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Recent Sales</h3>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
            <input type="text" placeholder="Search customer or bill..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }} />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading sales...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Subtotal (₹)</th>
                <th>GST (₹)</th>
                <th>Total (₹)</th>
                <th>Bill</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    {searchQuery ? 'No sales match your search.' : 'No sales found. Add your first sale!'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.bill_number}</td>
                    <td>{new Date(s.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 500 }}>{s.customer_name}</td>
                    <td>
                      <span style={{ background: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                        {s.payment_method}
                      </span>
                    </td>
                    <td>₹{Number(s.subtotal).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.gst_amount > 0 ? `₹${Number(s.gst_amount).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{Number(s.total).toFixed(2)}</td>
                    <td>
                      <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sales/${s.id}/pdf?token=${localStorage.getItem('token')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        <FileText size={14} /> PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Sales;
