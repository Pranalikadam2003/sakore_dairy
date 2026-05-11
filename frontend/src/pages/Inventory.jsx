import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Box, Search, AlertTriangle, Droplets, Package } from 'lucide-react';

const Inventory = () => {
  const [milkStock, setMilkStock] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/inventory');
      const data = response.data;
      setMilkStock(data.milk_stock ?? 0);
      setProducts(data.products ?? []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setError('Failed to load inventory. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = products.filter(
    p => parseFloat(p.quantity) <= parseFloat(p.low_stock_threshold)
  ).length;

  const milkLow = milkStock < 50;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <button className="btn btn-secondary" onClick={fetchInventory}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Milk Stock */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: milkLow ? '#fef2f2' : 'var(--primary-light)',
            color: milkLow ? '#dc2626' : 'var(--primary-color)',
            borderRadius: '50%', padding: '0.75rem', display: 'flex'
          }}>
            <Droplets size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Milk in Stock</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: milkLow ? '#dc2626' : 'inherit' }}>
              {Number(milkStock).toFixed(1)} L
            </p>
            {milkLow && (
              <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>⚠ Low Stock</span>
            )}
          </div>
        </div>

        {/* Total Products */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: 'var(--primary-light)', color: 'var(--primary-color)',
            borderRadius: '50%', padding: '0.75rem', display: 'flex'
          }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Products</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{products.length}</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: lowStockCount > 0 ? '#fef2f2' : 'var(--primary-light)',
            color: lowStockCount > 0 ? '#dc2626' : 'var(--primary-color)',
            borderRadius: '50%', padding: '0.75rem', display: 'flex'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Low Stock Alerts</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: lowStockCount > 0 ? '#dc2626' : 'inherit' }}>
              {lowStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card table-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Product Stock</h3>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Unit</th>
                <th>In Stock</th>
                <th>Reorder Level</th>
                <th>Selling Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    {searchQuery ? 'No products match your search.' : 'No products found.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = parseFloat(product.quantity) <= parseFloat(product.low_stock_threshold);
                  return (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 500 }}>{product.name}</td>
                      <td>{product.unit}</td>
                      <td style={{ fontWeight: 600, color: isLowStock ? '#dc2626' : 'inherit' }}>
                        {Number(product.quantity).toFixed(2)}
                      </td>
                      <td>{product.low_stock_threshold}</td>
                      <td>₹{Number(product.selling_price).toFixed(2)}</td>
                      <td>
                        {isLowStock ? (
                          <span style={{ background: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            Low Stock
                          </span>
                        ) : (
                          <span style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
