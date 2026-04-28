import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, Badge, Button, Alert, Confirm } from '../components/UI';

const Profile = () => {
  const { user, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Amplify deleteUser() revokes all Cognito tokens globally
      await deleteAccount();
      navigate('/');
    } catch (e) {
      setError(e.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px', animation: 'fadeUp 0.35s ease' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>My Profile</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 4 }}>Manage your account settings</p>
      </div>

      {error && <Alert type="error" onClose={() => setError('')} style={{ marginBottom: 20 }}>{error}</Alert>}

      {/* Profile card */}
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: '32px',
        marginBottom: '20px', animation: 'fadeUp 0.4s ease 0.05s both',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid var(--border)' }}>
          <Avatar username={user.username} size={72} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px' }}>{user.username}</h2>
              {user.isAdmin && <Badge variant="admin">Admin</Badge>}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{user.email}</p>
            {/* Cognito verification status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: user.emailVerified ? 'var(--green)' : 'var(--amber)', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {user.emailVerified ? 'Email verified' : 'Email not verified'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoRow label="Username" value={user.username} icon="👤" />
          <InfoRow label="Email" value={user.email} icon="📧" />
          <InfoRow label="Role" value={user.isAdmin ? 'Administrator' : 'Member'} icon="🔑" />
          <InfoRow label="Cognito Groups" value={user.groups?.join(', ') || 'Users'} icon="👥" />
          <InfoRow label="Cognito Sub (ID)" value={user.id} icon="🆔" mono />
        </div>
      </div>

      {/* AWS info card */}
      <div style={{
        background: 'linear-gradient(135deg, #fff8e6, #fffbf0)',
        borderRadius: 'var(--radius)', border: '1px solid #f5d78e',
        padding: '16px 20px', marginBottom: '16px',
        animation: 'fadeUp 0.4s ease 0.08s both',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px' }}>☁️</span>
          <div>
            <div style={{ fontWeight: 500, fontSize: '14px', color: '#92650a', marginBottom: '4px' }}>AWS Cognito Account</div>
            <div style={{ fontSize: '13px', color: '#7a5510', lineHeight: 1.5 }}>
              Your identity is managed by Amazon Cognito. Sessions use JWT tokens with automatic refresh — no server session required.
              Role changes (admin/user) update your Cognito group and take effect immediately.
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', padding: '20px 24px',
        marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        animation: 'fadeUp 0.4s ease 0.1s both',
      }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: '15px', marginBottom: '2px' }}>Sign out</div>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Revoke tokens and end your session globally</div>
        </div>
        <Button variant="secondary" onClick={async () => { await signOut(); navigate('/'); }}>
          🚪 Sign out
        </Button>
      </div>

      {/* Danger zone */}
      <div style={{
        background: 'var(--red-muted)', borderRadius: 'var(--radius)',
        border: '1px solid #fad5d5', padding: '20px 24px',
        animation: 'fadeUp 0.4s ease 0.15s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: '15px', color: 'var(--red)', marginBottom: '2px' }}>Delete Account</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Remove your Cognito identity and all associated data</div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>Delete Account</Button>
        </div>
      </div>

      <Confirm
        open={confirmDelete} onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteAccount} loading={deleting}
        title="Delete Your Account"
        message="This will permanently delete your Cognito account, revoke all tokens, and remove your data from DynamoDB. This cannot be undone."
        confirmLabel="Yes, Delete My Account"
      />
    </div>
  );
};

const InfoRow = ({ label, value, icon, mono }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    background: 'var(--cream)', justifyContent: 'space-between',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)', fontSize: '13px', fontWeight: 500, flexShrink: 0 }}>
      <span>{icon}</span>{label}
    </div>
    <span style={{
      fontSize: mono ? '11px' : '14px', fontWeight: mono ? 400 : 500,
      color: mono ? 'var(--muted)' : 'var(--ink)',
      fontFamily: mono ? 'monospace' : 'inherit',
      wordBreak: 'break-all', textAlign: 'right',
    }}>{value}</span>
  </div>
);

export default Profile;
