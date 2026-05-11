import React, { useState } from 'react';
import { FileText, Download, Printer, TrendingUp, ShoppingCart, BarChart2, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

const BASE = 'http://localhost:5000/api';

const Reports = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo]     = useState(today);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  const token = localStorage.getItem('token');

  // Download via window.open with token in query
  const downloadExcel = (type) => {
    if (!from || !to) { setError('Please select a date range.'); return; }
    setError('');
    const url = `${BASE}/reports/export?type=${type}&format=xlsx&from=${from}&to=${to}&token=${token}`;
    window.open(url, '_blank');
  };

  // Fetch and show profit summary
  const [summary, setSummary] = useState(null);
  const fetchSummary = async () => {
    if (!from || !to) { setError('Please select a date range.'); return; }
    setError('');
    setLoading('summary');
    try {
      const res = await api.get(`/reports/profit?from=${from}&to=${to}`);
      setSummary(res.data);
    } catch (e) {
      setError('Failed to load P&L summary.');
    } finally {
      setLoading('');
    }
  };

  const cards = [
    {
      title: 'Sales Report',
      desc: 'All bills, customers, payment methods and totals',
      icon: <TrendingUp size={22} />,
      color: '#dcfce7', iconColor: '#16a34a',
      type: 'sales',
    },
    {
      title: 'Purchases Report',
      desc: 'Milk bought from farmers & suppliers',
      icon: <ShoppingCart size={22} />,
      color: '#dbeafe', iconColor: '#1d4ed8',
      type: 'purchases',
    },
    {
      title: 'Expenses Report',
      desc: 'All farm expenses by category',
      icon: <FileText size={22} />,
      color: '#fef9c3', iconColor: '#a16207',
      type: 'expenses',
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      {/* Date Range Picker */}
      <div className="card" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
          <label className="form-label">From Date</label>
          <input type="date" className="form-input" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
          <label className="form-label">To Date</label>
          <input type="date" className="form-input" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={fetchSummary} disabled={loading === 'summary'}>
          <BarChart2 size={16} />
          {loading === 'summary' ? 'Loading...' : 'View P&L Summary'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {/* P&L Summary */}
      {summary && (
        <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--primary-dark)' }}>
            📊 Profit & Loss — {summary.from} to {summary.to}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Total Sales', value: summary.totalSales, color: '#16a34a' },
              { label: 'Milk Purchases', value: summary.totalPurchases, color: '#1d4ed8' },
              { label: 'Expenses', value: summary.totalExpenses, color: '#d97706' },
              { label: 'Net Profit', value: summary.profit, color: summary.profit >= 0 ? '#16a34a' : '#dc2626' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>₹{Number(s.value).toFixed(2)}</div>
                {s.label === 'Net Profit' && summary.profitMargin !== undefined && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Margin: {summary.profitMargin}%</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {cards.map(card => (
          <div key={card.type} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: card.color, color: card.iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.2rem' }}>{card.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{card.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setError('');
                  const url = `${BASE}/reports/export?type=${card.type}&format=xlsx&from=${from}&to=${to}&token=${token}`;
                  window.open(url, '_blank');
                }}
              >
                <Download size={15} /> Excel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Selected period: {from} → {to}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
