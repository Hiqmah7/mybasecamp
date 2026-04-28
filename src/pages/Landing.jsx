import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 68, borderBottom: '1px solid var(--border)',
        background: 'var(--white)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700,
        }}>
          <span style={{
            background: 'var(--green)', color: 'white', borderRadius: '10px',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>⛺</span>
          MyBaseCamp
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/signin')}
            style={{
              padding: '9px 20px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1.5px solid var(--border)',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              color: 'var(--ink-soft)', transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '9px 20px', borderRadius: 'var(--radius-sm)',
              background: 'var(--green)', color: 'white', border: 'none',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(26,127,90,0.4)', transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--green)'; }}
          >
            Get started free
          </button>
        </div>
      </header>

      {/* Hero */}
      <main style={{
        maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px',
        textAlign: 'center', animation: 'fadeUp 0.6s ease',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px', borderRadius: '100px',
          background: 'var(--green-muted)', color: 'var(--green-dark)',
          fontSize: '13px', fontWeight: 500, marginBottom: '28px',
          border: '1px solid #c4e8d8',
        }}>
          🎉 Project management, simplified
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 700, lineHeight: 1.1, marginBottom: '24px',
          letterSpacing: '-0.03em',
        }}>
          Your team's home base for{' '}
          <span style={{
            color: 'var(--green)',
            fontStyle: 'italic',
          }}>getting things done</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--ink-soft)',
          maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7,
        }}>
          MyBaseCamp brings your projects, teams, and work together in one beautifully
          organized place. No chaos. No missed deadlines. Just calm, clear progress.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '15px 36px', borderRadius: 'var(--radius-sm)',
              background: 'var(--green)', color: 'white', border: 'none',
              fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(26,127,90,0.35)', transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,127,90,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,127,90,0.35)'; }}
          >
            Start for free →
          </button>
          <button
            onClick={() => navigate('/signin')}
            style={{
              padding: '15px 36px', borderRadius: 'var(--radius-sm)',
              background: 'var(--white)', color: 'var(--ink)',
              border: '1.5px solid var(--border)', fontSize: '16px',
              fontWeight: 500, cursor: 'pointer', transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Sign in
          </button>
        </div>
      </main>

      {/* Features */}
      <section style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {[
          { icon: '📁', title: 'Project Management', desc: 'Create, edit and organize projects with a beautiful visual interface that keeps everything at a glance.' },
          { icon: '👥', title: 'Team Roles', desc: 'Fine-grained permissions with user and admin roles. Control who can do what across your workspace.' },
          { icon: '🔐', title: 'Secure Auth', desc: 'Session-based authentication with encrypted passwords. Your data stays safe and private.' },
          { icon: '⚡', title: 'Instant Access', desc: 'Get up and running in seconds. Sign up, create your first project, and start shipping.' },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              background: 'var(--white)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', padding: '28px',
              animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '8px' }}>{f.title}</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer style={{
        textAlign: 'center', padding: '32px', borderTop: '1px solid var(--border)',
        color: 'var(--muted)', fontSize: '13px',
      }}>
        MyBaseCamp © {new Date().getFullYear()} — Built with ❤️ and React + MongoDB
      </footer>
    </div>
  );
};

export default Landing;
