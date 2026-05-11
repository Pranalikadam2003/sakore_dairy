import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, DollarSign } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    category: 'Maintenance',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Maintenance', 'Labour', 'Transportation', 'Cattle Feed', 'Veterinary', 'Electricity', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setShowForm(false);
      fetchExpenses();
      setFormData({
        description: '', category: 'Maintenance', amount: '', date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expenses Tracking</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: '#ffe4e6', color: '#e11d48' }}>
          <DollarSign size={24} />
        </div>
        <div>
          <p style={{ color: '#9f1239', fontSize: '0.875rem', fontWeight: 500 }}>Total Expenses (This Period)</p>
          <h3 style={{ color: '#be123c', fontSize: '1.5rem', fontWeight: 600 }}>₹{totalExpenses.toFixed(2)}</h3>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log New Expense</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Description</label>
                <input type="text" className="form-input" required placeholder="e.g. Tractor repair, Monthly electricity bill" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" style={{ backgroundColor: 'white' }} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input type="number" step="0.5" className="form-input" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#e11d48' }}>Save Expense</button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Recent Expenses</h3>
        </div>
        {loading ? <p style={{ padding: '1rem' }}>Loading expenses...</p> : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No expenses logged.</td></tr>
              ) : (
                expenses.map((e, idx) => (
                  <tr key={e.id || idx}>
                    <td>{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                    <td><span style={{ background: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8125rem' }}>{e.category}</span></td>
                    <td style={{ fontWeight: 600, color: '#e11d48' }}>₹{e.amount}</td>
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

export default Expenses;
