import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listAllUsers, setUserAdmin, removeUserAdmin, adminDeleteUser } from '../lib/amplifyClient';
import { Avatar, Badge, Button, Spinner, Alert, Confirm } from '../components/UI';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Calls adminResolver Lambda via AppSync → Cognito ListUsers
      const result = await listAllUsers();
      if (result?.success && result.users) {
        setUsers(JSON.parse(result.users));
      } else {
        setError(result?.message || 'Failed to load users.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const { type, user } = confirmAction;
      let result;
      if (type === 'delete') {
        result = await adminDeleteUser(user.id);
        if (result?.success) {
          setUsers(us => us.filter(u => u.id !== user.id));
          setSuccess(`User "${user.username}" deleted from Cognito.`);
        }
      } else if (type === 'setAdmin') {
        result = await setUserAdmin(user.id);
        if (result?.success) {
          setUsers(us => us.map(u => u.id === user.id ? { ...u, isAdmin: true } : u));
          setSuccess(result.message);
        }
      } else if (type === 'removeAdmin') {
        result = await removeUserAdmin(user.id);
        if (result?.success) {
          setUsers(us => us.map(u => u.id === user.id ? { ...u, isAdmin: false } : u));
          setSuccess(result.message);
        }
      }
      if (!result?.success) setError(result?.message || 'Operation failed.');
      setConfirmAction(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmMessages = {
    delete: u => ({ title: 'Delete User', msg: `Permanently delete "${u?.username}" from Cognito User Pool? This cannot be undone.` }),
    setAdmin: u => ({ title: 'Grant Admin', msg: `Add "${u?.username}" to the Cognito Admins group? They will gain full admin access.` }),
    removeAdmin: u => ({ title: 'Remove Admin', msg: `Remove "${u?.username}" from the Cognito Admins group?` }),
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', animation: 'fadeUp 0.35s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ background: '#f0e6ff', color: '#7c3aed', borderRadius: '10px', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}>
            ⚙️ ADMIN
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>User Management</h1>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Manage Cognito User Pool · {users.length} users
        </p>
        {/* AWS context badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px',
          padding: '5px 12px', borderRadius: '100px',
          background: 'linear-gradient(135deg, #fff8e6, #fff3d6)',
          border: '1px solid #f5d78e', fontSize: '12px', color: '#92650a',
        }}>
          ☁️ Backed by <strong>Amazon Cognito</strong> · Role changes are instant across all sessions
        </div>
      </div>

      {error && <Alert type="error" onClose={() => setError('')} style={{ marginBottom: 16 }}>{error}</Alert>}
      {success && <Alert type="success" onClose={() => setSuccess('')} style={{ marginBottom: 16 }}>{success}</Alert>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Users', value: users.length, icon: '👥' },
          { label: 'Admins (Cognito group)', value: users.filter(u => u.isAdmin).length, icon: '⚙️' },
          { label: 'Regular Users', value: users.filter(u => !u.isAdmin).length, icon: '👤' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--white)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', padding: '18px 22px',
            animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
          }}>
            <span style={{ fontSize: '22px' }}>{s.icon}</span>
            <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: 6 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search users by name or email..."
          style={{
            width: '100%', padding: '11px 16px', fontSize: '14px',
            border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--white)', color: 'var(--ink)', fontFamily: 'var(--font-body)',
            transition: 'border-color var(--transition)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--green)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Spinner size={36} /></div>
      ) : (
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', overflow: 'hidden',
          animation: 'fadeUp 0.4s ease 0.1s both',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--cream)', fontSize: '11px', fontWeight: 600,
            color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', gap: '16px',
          }}>
            <span>User</span><span>Email</span><span>Status</span><span>Role</span><span>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>No users found.</div>
          ) : (
            filtered.map((u, i) => (
              <UserRow
                key={u.id} user={u}
                isSelf={u.id === currentUser.id}
                isLast={i === filtered.length - 1}
                onSetAdmin={() => setConfirmAction({ type: 'setAdmin', user: u })}
                onRemoveAdmin={() => setConfirmAction({ type: 'removeAdmin', user: u })}
                onDelete={() => setConfirmAction({ type: 'delete', user: u })}
              />
            ))
          )}
        </div>
      )}

      {confirmAction && (
        <Confirm
          open={true} onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm} loading={actionLoading}
          title={confirmMessages[confirmAction.type]?.(confirmAction.user)?.title}
          message={confirmMessages[confirmAction.type]?.(confirmAction.user)?.msg}
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : 'Confirm'}
        />
      )}
    </div>
  );
};

const UserRow = ({ user, isSelf, isLast, onSetAdmin, onRemoveAdmin, onDelete }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
    padding: '14px 20px', gap: '16px',
    borderBottom: isLast ? 'none' : '1px solid var(--border)',
    alignItems: 'center', transition: 'background var(--transition)',
  }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <Avatar username={user.username} size={34} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          {user.username || 'Unknown'}
          {isSelf && <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 400 }}>(you)</span>}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>{user.id?.slice(0, 12)}…</div>
      </div>
    </div>
    <div style={{ fontSize: '13px', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
    <div>
      <span style={{
        fontSize: '11px', padding: '3px 8px', borderRadius: '100px', fontWeight: 600,
        background: user.enabled ? 'var(--green-muted)' : 'var(--cream-dark)',
        color: user.enabled ? 'var(--green-dark)' : 'var(--muted)',
      }}>
        {user.status || (user.enabled ? 'CONFIRMED' : 'DISABLED')}
      </span>
    </div>
    <div><Badge variant={user.isAdmin ? 'admin' : 'default'}>{user.isAdmin ? 'Admin' : 'User'}</Badge></div>
    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
      {!isSelf && (
        <>
          {user.isAdmin
            ? <Button variant="ghost" size="sm" onClick={onRemoveAdmin} style={{ fontSize: '12px', color: 'var(--amber)' }}>− Admin</Button>
            : <Button variant="ghost" size="sm" onClick={onSetAdmin} style={{ fontSize: '12px', color: '#7c3aed' }}>+ Admin</Button>
          }
          <Button variant="ghost" size="sm" onClick={onDelete} style={{ fontSize: '12px', color: 'var(--red)' }}>Delete</Button>
        </>
      )}
    </div>
  </div>
);

export default Admin;
