import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button, Alert } from '../components/UI';

/* ─── Shared layout shell ─────────────────────────────────────────────────── */
const AuthLayout = ({ children, title, subtitle }) => (
  <div style={{
    minHeight: '100vh', background: 'var(--cream)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
  }}>
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--ink)',
        }}>
          <span style={{
            background: 'var(--green)', color: 'white', borderRadius: '10px',
            width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>⛺</span>
          MyBaseCamp
        </Link>
      </div>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: '36px',
        boxShadow: 'var(--shadow)', animation: 'fadeUp 0.4s ease',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '6px' }}>{title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>{subtitle}</p>
        {children}
      </div>
      {/* AWS badge */}
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span>🔒</span> Authentication powered by <strong>AWS Cognito</strong>
      </div>
    </div>
  </div>
);

/* ─── Sign In ─────────────────────────────────────────────────────────────── */
export const SignIn = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Cognito error codes → friendly messages
      const msg = err.message || '';
      if (msg.includes('NotAuthorizedException') || msg.includes('Incorrect username or password')) {
        setError('Invalid email or password.');
      } else if (msg.includes('UserNotConfirmedException')) {
        setError('Please confirm your email first. Check your inbox.');
      } else if (msg.includes('UserNotFoundException')) {
        setError('No account found with that email.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your MyBaseCamp account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        <Input label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" placeholder="••••••••"
          value={password} onChange={e => setPassword(e.target.value)} required />
        <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Sign in
        </Button>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', marginTop: '8px' }}>
          New to MyBaseCamp?{' '}
          <Link to="/register" style={{ color: 'var(--green)', fontWeight: 500 }}>Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

/* ─── Register (Step 1: fill form) ───────────────────────────────────────── */
export const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pending confirmation state — passed via navigation state
  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const result = await signUp(form.username, form.email, form.password);
      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP' || !result.isSignUpComplete) {
        // Cognito requires email confirmation — go to OTP step
        navigate('/confirm-email', {
          state: {
            email: form.email,
            password: form.password,
            username: form.username,
          },
        });
      } else {
        // autoSignIn succeeded (rare)
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('UsernameExistsException') || msg.includes('already exists')) {
        setError('An account with this email already exists.');
      } else if (msg.includes('InvalidPasswordException')) {
        setError('Password must have uppercase, lowercase and numbers.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join MyBaseCamp — your AWS-powered workspace">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
        <Input label="Username" placeholder="yourname" value={form.username}
          onChange={update('username')} minLength={3} required hint="Displayed to teammates" />
        <Input label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={update('email')} required />
        <Input label="Password" type="password" placeholder="••••••••"
          value={form.password} onChange={update('password')} required hint="At least 8 characters, include a number" />
        <Input label="Confirm password" type="password" placeholder="••••••••"
          value={form.confirm} onChange={update('confirm')} required />
        <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
          Create account →
        </Button>
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', marginTop: '8px' }}>
          Already have an account?{' '}
          <Link to="/signin" style={{ color: 'var(--green)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

/* ─── Confirm Email (Step 2: OTP from Cognito) ────────────────────────────── */
export const ConfirmEmail = () => {
  const navigate = useNavigate();
  const { confirmAndSignIn } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read registration data passed from Register page
  const state = window.history.state?.usr || {};
  const { email, password, username } = state;

  if (!email) {
    // Direct navigation without state — redirect to register
    navigate('/register');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmAndSignIn(email, code.trim(), password, username);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('CodeMismatchException') || msg.includes('Invalid verification code')) {
        setError('Incorrect code. Please check your email and try again.');
      } else if (msg.includes('ExpiredCodeException')) {
        setError('Code has expired. Please register again to get a new code.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

        {/* Visual email indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px', borderRadius: 'var(--radius-sm)',
          background: 'var(--green-muted)', border: '1px solid #c4e8d8',
        }}>
          <span style={{ fontSize: '24px' }}>📧</span>
          <div>
            <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--green-dark)' }}>Confirmation email sent</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{email}</div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '8px' }}>
            Verification Code
          </label>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
            autoFocus
            style={{
              width: '100%', padding: '14px', fontSize: '28px', fontWeight: 700,
              letterSpacing: '0.3em', textAlign: 'center',
              border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--white)', color: 'var(--ink)', fontFamily: 'monospace',
              transition: 'border-color var(--transition)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--green)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <Button type="submit" size="lg" loading={loading} style={{ width: '100%' }}>
          Confirm & Sign in
        </Button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)' }}>
          Didn't receive it? Check your spam folder or{' '}
          <Link to="/register" style={{ color: 'var(--green)' }}>try again</Link>.
        </p>
      </form>
    </AuthLayout>
  );
};
