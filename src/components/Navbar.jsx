import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './UI';

const NavLink = ({ to, children, icon }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--green-muted)' : 'transparent',
        color: active ? 'var(--green-dark)' : 'var(--ink-soft)',
        fontWeight: active ? 600 : 400, fontSize: '14px',
        border: 'none', cursor: 'pointer', transition: 'all var(--transition)',
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--cream-dark)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {children}
    </button>
  );
};

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 60,
    }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700,
          color: 'var(--ink)', letterSpacing: '-0.02em',
        }}
      >
        <span style={{
          background: 'var(--green)', color: 'white', borderRadius: '8px',
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>⛺</span>
        MyBaseCamp
      </button>

      <div style={{ display: 'flex', gap: '4px' }}>
        <NavLink to="/dashboard" icon="🏠">Home</NavLink>
        <NavLink to="/projects" icon="📁">Projects</NavLink>
        {user.isAdmin && <NavLink to="/admin" icon="⚙️">Admin</NavLink>}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: menuOpen ? 'var(--cream-dark)' : 'transparent',
            border: '1px solid transparent', borderRadius: 'var(--radius-sm)',
            padding: '6px 10px', cursor: 'pointer', transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-dark)'; }}
          onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          <Avatar username={user.username} size={30} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{user.username}</span>
          {user.isAdmin && (
            <span style={{
              fontSize: '10px', padding: '2px 6px', borderRadius: '100px',
              background: '#f0e6ff', color: '#7c3aed', fontWeight: 600,
            }}>ADMIN</span>
          )}
          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>▾</span>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute', top: '110%', right: 0, width: 220,
              background: 'var(--white)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
              animation: 'slideDown 0.15s ease', zIndex: 200, overflow: 'hidden',
            }}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>{user.username}</div>
              <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 2 }}>{user.email}</div>
              {/* Cognito identity indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px',
                fontSize: '11px', color: 'var(--green-dark)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--green)', display: 'inline-block',
                }} />
                Secured by AWS Cognito
              </div>
            </div>
            <div style={{ padding: '8px' }}>
              <MenuButton onClick={() => { navigate('/profile'); setMenuOpen(false); }} icon="👤">
                My Profile
              </MenuButton>
              <MenuButton
                onClick={async () => { await signOut(); navigate('/'); }}
                icon="🚪" color="var(--red)"
              >
                Sign out
              </MenuButton>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const MenuButton = ({ children, onClick, icon, color }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: '14px', color: color || 'var(--ink-soft)',
      transition: 'background var(--transition)', textAlign: 'left',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream-dark)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
  >
    <span>{icon}</span>{children}
  </button>
);

export default Navbar;
