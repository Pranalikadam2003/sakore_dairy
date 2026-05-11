import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, TrendingUp, Package,
  Box, DollarSign, FileText
} from 'lucide-react';

// Cow SVG icon
const CowIcon = () => (
  <svg viewBox="0 0 64 64" width="22" height="22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M54 18c-1.1 0-2 .9-2 2v2h-4v-2c0-2.2-1.8-4-4-4H20c-2.2 0-4 1.8-4 4v2h-4v-2c0-1.1-.9-2-2-2s-2 .9-2 2v6c0 2.2 1.8 4 4 4h2.1c.5 2.4 1.7 4.6 3.4 6.3L16 46c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-3h20v3c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2l-1.5-9.7c1.7-1.7 2.9-3.9 3.4-6.3H52c2.2 0 4-1.8 4-4v-6c0-1.1-.9-2-2-2zM28 30c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const navItems = [
  { to: '/',           icon: <LayoutDashboard size={18}/>, label: 'Dashboard' },
  { to: '/purchases',  icon: <ShoppingCart size={18}/>,    label: 'Milk Purchases' },
  { to: '/sales',      icon: <TrendingUp size={18}/>,      label: 'Sales' },
  { to: '/production', icon: <Package size={18}/>,         label: 'Production' },
  { to: '/inventory',  icon: <Box size={18}/>,             label: 'Inventory' },
  { to: '/expenses',   icon: <DollarSign size={18}/>,      label: 'Expenses' },
  { to: '/reports',    icon: <FileText size={18}/>,        label: 'Reports' },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ color: '#fff' }}>
          <CowIcon />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">Sakore Dairy</span>
          <span className="sidebar-logo-sub">Farm Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom decoration */}
      <div style={{
        margin: '0 0.75rem 1.25rem',
        padding: '0.9rem',
        borderRadius: '0.75rem',
        background: 'rgba(22,163,74,0.1)',
        border: '1px solid rgba(22,163,74,0.2)',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem' }}>
          🐄 Sakore Farm
        </div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
          Fresh Milk &amp; Dairy Products
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
