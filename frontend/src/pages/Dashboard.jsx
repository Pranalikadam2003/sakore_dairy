import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Droplet, ShoppingCart, TrendingUp, AlertTriangle, Package, IndianRupee } from 'lucide-react';

const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div style={{
      padding: '0.875rem',
      borderRadius: '50%',
      backgroundColor: color + '20',
      color: color,
      flexShrink: 0
    }}>
      <Icon size={26} />
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.2rem' }}>{title}</p>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700 }}>{value}</h3>
      {sub && <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.15rem' }}>{sub}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Correct endpoint: /dashboard/summary
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (err) {
        setError('Failed to load dashboard. Is the backend running?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🥛</div>
        <p>Loading dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-content">
      <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <strong>⚠️ Error:</strong> {error}
      </div>
    </div>
  );

  // Map backend field names correctly
  const milkStock         = data?.milkStock ?? 0;
  const milkPurchased     = data?.milkPurchasedToday ?? 0;
  const totalSales        = data?.totalSalesToday ?? 0;
  const profit            = data?.profit ?? 0;
  const salesChart        = data?.salesChart ?? [];      // [{date, total}]
  const lowStockAlerts    = data?.lowStockAlerts ?? [];
  const recentSales       = data?.recentSales ?? [];
  const milkUsed          = data?.milkUsedProduction ?? 0;
  const milkSold          = data?.milkSoldToday ?? 0;

  const profitColor = profit >= 0 ? '#16a34a' : '#dc2626';

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {data?.today ? new Date(data.today).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <StatCard
          title="Milk Stock"
          value={`${milkStock.toFixed(1)} L`}
          sub={`${milkPurchased}L purchased today`}
          icon={Droplet}
          color="#3b82f6"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${totalSales.toFixed(0)}`}
          sub={`${milkSold}L milk sold today`}
          icon={ShoppingCart}
          color="#8b5cf6"
        />
        <StatCard
          title="Today's Profit / Loss"
          value={`₹${profit.toFixed(0)}`}
          sub={profit >= 0 ? 'Profitable day 🎉' : 'Loss day ⚠️'}
          icon={IndianRupee}
          color={profitColor}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockAlerts.length}
          sub={lowStockAlerts.length === 0 ? 'All stock healthy ✅' : 'Items need restocking'}
          icon={AlertTriangle}
          color={lowStockAlerts.length > 0 ? '#f59e0b' : '#16a34a'}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Sales Revenue Chart - last 7 days */}
        <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            📈 Sales Revenue – Last 7 Days
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d ? d.slice(5) : ''}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [`₹${v}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock + Milk Usage summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>📦 Stock & Production Summary</h3>

          {/* Milk stats */}
          <div style={{ background: 'var(--bg-color)', borderRadius: '10px', padding: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>🥛 Milk Today</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
              {[
                { label: 'Purchased', val: `${milkPurchased}L`, color: '#3b82f6' },
                { label: 'Used (Prod)', val: `${milkUsed}L`, color: '#f59e0b' },
                { label: 'Sold', val: `${milkSold}L`, color: '#8b5cf6' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: color + '15', borderRadius: '8px', padding: '0.6rem' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{val}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>⚠️ Low Stock Items</p>
            {lowStockAlerts.length === 0 ? (
              <p style={{ color: '#16a34a', fontSize: '0.875rem', background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px' }}>
                ✅ All products are well stocked!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lowStockAlerts.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.6rem 0.875rem', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 500, color: '#92400e', fontSize: '0.875rem' }}>{item.name}</span>
                    <span style={{ color: '#b45309', fontSize: '0.875rem', fontWeight: 600 }}>{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>🧾 Recent Sales</h3>
        {recentSales.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No sales yet. Add your first sale!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  {['Bill No', 'Customer', 'Date', 'Payment', 'Total'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, i) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-color)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary-color)' }}>{sale.bill_number}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{sale.customer_name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{sale.date}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        background: sale.payment_method === 'Cash' ? '#f0fdf4' : sale.payment_method === 'UPI' ? '#eff6ff' : '#fdf4ff',
                        color:      sale.payment_method === 'Cash' ? '#16a34a' : sale.payment_method === 'UPI' ? '#2563eb' : '#7c3aed'
                      }}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{sale.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
