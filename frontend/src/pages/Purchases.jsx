import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Trash2, AlertTriangle } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    supplier_name: '',
    litres: '',
    rate_per_litre: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/purchases');
      setPurchases(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load purchases. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.litres || !formData.rate_per_litre || !formData.date) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/purchases', {
        supplier_name: formData.supplier_name || 'Unknown',
        litres: parseFloat(formData.litres),
        rate_per_litre: parseFloat(formData.rate_per_litre),
        date: formData.date,
        notes: formData.notes || null
      });
      setShowForm(false);
      fetchPurchases();
      setFormData({ supplier_name: '', litres: '', rate_per_litre: '', notes: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save purchase.');
      console.error('Error saving purchase:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      fetchPurchases();
    } catch (err) {
      setError('Failed to delete purchase.');
    }
  };

  const filtered = purchases.filter(p =>
    (p.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Milk Purchases</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'New Purchase'}
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
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Add New Purchase</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramu Farmer"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (Litres) *</label>
                <input
                  type="number" step="0.1" min="0.1" className="form-input" required
                  value={formData.litres}
                  onChange={(e) => setFormData({ ...formData, litres: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rate (₹/Litre) *</label>
                <input
                  type="number" step="0.5" min="0" className="form-input" required
                  value={formData.rate_per_litre}
                  onChange={(e) => setFormData({ ...formData, rate_per_litre: e.target.value })}
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
              {formData.litres && formData.rate_per_litre && (
                <div className="form-group">
                  <label className="form-label">Total Cost</label>
                  <input
                    type="text" className="form-input" readOnly
                    style={{ background: 'var(--bg-color)', fontWeight: 600 }}
                    value={`₹${(parseFloat(formData.litres) * parseFloat(formData.rate_per_litre)).toFixed(2)}`}
                  />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Purchase'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Recent Purchases</h3>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading purchases...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Quantity (L)</th>
                <th>Rate (₹/L)</th>
                <th>Total (₹)</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    {searchQuery ? 'No purchases match your search.' : 'No purchases found. Add your first purchase!'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontWeight: 500 }}>{p.supplier_name || p.supplier_name_ref || '—'}</td>
                    <td>{Number(p.litres).toFixed(1)} L</td>
                    <td>₹{Number(p.rate_per_litre).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(p.total_cost).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.notes || '—'}</td>
                    <td>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 500 }}>
                        Completed
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.25rem' }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
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

export default Purchases;
