import React from 'react';

// Button
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading, disabled, onClick, type = 'button', style, className = ''
}) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontFamily: 'var(--font-body)', fontWeight: 500,
    borderRadius: 'var(--radius-sm)', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition)', border: 'none', whiteSpace: 'nowrap',
    opacity: disabled || loading ? 0.65 : 1,
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: '13px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '13px 28px', fontSize: '15px' },
  };
  const variants = {
    primary: {
      background: 'var(--green)', color: 'white',
      boxShadow: '0 1px 3px rgba(26,127,90,0.3)',
    },
    secondary: {
      background: 'var(--cream-dark)', color: 'var(--ink)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--red)', color: 'white',
    },
    ghost: {
      background: 'transparent', color: 'var(--ink-soft)',
    },
    outline: {
      background: 'transparent', color: 'var(--green)',
      border: '1.5px solid var(--green)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          if (variant === 'primary') e.target.style.background = 'var(--green-light)';
          if (variant === 'secondary') e.target.style.background = 'var(--border)';
          if (variant === 'danger') e.target.style.filter = 'brightness(1.1)';
          if (variant === 'ghost') e.target.style.background = 'var(--cream-dark)';
        }
      }}
      onMouseLeave={e => {
        if (variant === 'primary') e.target.style.background = 'var(--green)';
        if (variant === 'secondary') e.target.style.background = 'var(--cream-dark)';
        if (variant === 'danger') e.target.style.filter = 'none';
        if (variant === 'ghost') e.target.style.background = 'transparent';
      }}
    >
      {loading ? <Spinner size={14} color={variant === 'primary' || variant === 'danger' ? 'white' : 'var(--green)'} /> : null}
      {children}
    </button>
  );
};

// Input
export const Input = ({ label, error, hint, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && (
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)' }}>
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        padding: '11px 14px', fontSize: '14px', color: 'var(--ink)',
        background: 'var(--white)', border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', transition: 'border-color var(--transition)',
        width: '100%', ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--green)'; }}
      onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'; }}
    />
    {error && <p style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</p>}
    {hint && !error && <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{hint}</p>}
  </div>
);

// Textarea
export const Textarea = ({ label, error, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && (
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)' }}>
        {label}
      </label>
    )}
    <textarea
      {...props}
      rows={props.rows || 3}
      style={{
        padding: '11px 14px', fontSize: '14px', color: 'var(--ink)',
        background: 'var(--white)', border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', resize: 'vertical', lineHeight: 1.5,
        width: '100%', transition: 'border-color var(--transition)', ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--green)'; }}
      onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'; }}
    />
    {error && <p style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</p>}
  </div>
);

// Card
export const Card = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--white)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      padding: '24px', cursor: onClick ? 'pointer' : 'default',
      transition: 'all var(--transition)',
      ...style,
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
  >
    {children}
  </div>
);

// Alert
export const Alert = ({ type = 'error', children, onClose }) => {
  const styles = {
    error: { bg: 'var(--red-muted)', color: 'var(--red)', border: '#fad5d5' },
    success: { bg: 'var(--green-muted)', color: 'var(--green-dark)', border: '#c4e8d8' },
    warning: { bg: 'var(--amber-muted)', color: 'var(--amber)', border: '#f5ddb5' },
  };
  const s = styles[type];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: '14px', color: s.color, animation: 'slideDown 0.2s ease',
    }}>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && (
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: s.color,
          cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 0 0 4px',
        }}>×</button>
      )}
    </div>
  );
};

// Spinner
export const Spinner = ({ size = 20, color = 'var(--green)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `2px solid transparent`,
    borderTopColor: color, borderRightColor: color,
    animation: 'spin 0.6s linear infinite', flexShrink: 0,
  }} />
);

// Avatar
export const Avatar = ({ username, size = 36, style }) => {
  const colors = ['#1a7f5a','#2563eb','#7c3aed','#c97b1a','#d94040','#0891b2'];
  const color = colors[(username?.charCodeAt(0) || 0) % colors.length];
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, flexShrink: 0,
      fontFamily: 'var(--font-body)', ...style,
    }}>
      {initials}
    </div>
  );
};

// Badge
export const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: { bg: 'var(--cream-dark)', color: 'var(--ink-soft)' },
    admin: { bg: '#f0e6ff', color: '#7c3aed' },
    active: { bg: 'var(--green-muted)', color: 'var(--green-dark)' },
    archived: { bg: 'var(--cream-dark)', color: 'var(--muted)' },
    completed: { bg: '#e6f0ff', color: '#2563eb' },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '100px',
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em',
      background: v.bg, color: v.color, textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
};

// Modal
export const Modal = ({ open, onClose, title, children, width = 480 }) => {
  React.useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px', animation: 'fadeIn 0.15s ease',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: width, boxShadow: 'var(--shadow-lg)',
          animation: 'fadeUp 0.25s ease', overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'var(--cream-dark)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, fontSize: '18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted)',
          }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
};

// Empty state
export const Empty = ({ icon, title, description, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
    gap: '12px',
  }}>
    <div style={{ fontSize: '48px', marginBottom: '8px' }}>{icon || '📭'}</div>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>{title}</h3>
    {description && <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: 320 }}>{description}</p>}
    {action && <div style={{ marginTop: '8px' }}>{action}</div>}
  </div>
);

// Confirm dialog
export const Confirm = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) => (
  <Modal open={open} onClose={onClose} title={title} width={400}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6, fontSize: '14px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
);
