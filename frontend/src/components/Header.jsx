import React, { useContext } from 'react';
import { LogOut, User, Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="top-header">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {dateStr} · {timeStr}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--primary-light)', border: '1.5px solid #bbf7d0',
          padding: '0.35rem 0.9rem 0.35rem 0.5rem',
          borderRadius: '999px',
          color: 'var(--primary-dark)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <User size={14} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
            {user?.name || 'Admin'}
          </span>
          {user?.role === 'admin' && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, background: 'var(--primary)',
              color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '999px',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Admin
            </span>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
