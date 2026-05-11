import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, AlertTriangle } from 'lucide-react';

const Production = () => {
  const [production, setProduction] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    product_id: '',
    quantity_produced: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchProduction();
    fetchProducts();
  }, []);

  const fetchProduction = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/production');
      setProduction(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load production logs. Please make sure the server is running.');
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

  // Get selected product details for preview
  const selectedProduct = products.find(p => String(p.id) === String(formData.product_id));
  const milkNeeded = selectedProduct && formData.quantity_produced
    ? (parseFloat(formData.quantity_produced) * parseFloat(selectedProduct.milk_per_unit || 0)).toFixed(2)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity_produced || !formData.date) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/production', {
        product_id: parseInt(formData.product_id),
        quantity_produced: parseFloat(formData.quantity_produced),
        date: formData.date,
        notes: formData.notes || null
      });
      setShowForm(false);
      fetchProduction();
      setFormData({ product_id: '', quantity_produced: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save production record.');
      console.error('Error saving production:', err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = production.filter(p =>
    (p.product_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Production</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'New Batch'}
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
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log Production Batch</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select
                  className="form-input"
                  style={{ backgroundColor: 'white' }}
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) — In Stock: {Number(p.quantity).toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Produced ({selectedProduct?.unit || 'unit'}) *</label>
                <input
                  type="number" step="0.1" min="0.1" className="form-input" required
                  value={formData.quantity_produced}
                  onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date" className="form-input" required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text" className="form-input" placeholder="Optional"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Milk usage preview */}
              {milkNeeded !== null && (
                <div className="form-group">
                  <label className="form-label">Milk Required</label>
                  <input
                    type="text" className="form-input" readOnly
                    style={{ background: 'var(--bg-color)', fontWeight: 600, color: 'var(--primary-color)' }}
                    value={`${milkNeeded} Litres`}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Log Production'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Production History</h3>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading production logs...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Milk Used (L)</th>
                <th>Qty Produced</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    {searchQuery ? 'No production records match your search.' : 'No production logs found. Log your first batch!'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                    <td>{Number(p.milk_used).toFixed(2)} L</td>
                    <td style={{ fontWeight: 600 }}>{Number(p.quantity_produced).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.notes || '—'}</td>
                    <td>
                      <span style={{
                        background: '#e0e7ff', color: '#4f46e5',
                        padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 500
                      }}>Stocked</span>
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

export default Production;
