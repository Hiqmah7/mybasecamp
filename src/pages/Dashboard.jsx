import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listMyProjects } from '../lib/amplifyClient';
import { Card, Button, Badge, Avatar, Spinner, Empty } from '../components/UI';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recent = projects.slice(0, 4);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <Avatar username={user.username} size={52} />
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700 }}>
              {greeting}, {user.username} 👋
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        {/* AWS infrastructure badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px',
          padding: '5px 12px', borderRadius: '100px',
          background: 'linear-gradient(135deg, #fff8e6, #fff3d6)',
          border: '1px solid #f5d78e', fontSize: '12px', color: '#92650a',
        }}>
          <span>☁️</span>
          <span>Running on <strong>AWS Amplify Gen 2</strong> · AppSync · DynamoDB · Cognito</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px', marginBottom: '40px',
      }}>
        {[
          { label: 'Total Projects', value: projects.length, icon: '📁', color: 'var(--green)' },
          { label: 'Active', value: projects.filter(p => p.status === 'active').length, icon: '🟢', color: '#22a372' },
          { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: '✅', color: '#2563eb' },
          { label: 'Archived', value: projects.filter(p => p.status === 'archived').length, icon: '📦', color: 'var(--muted)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--white)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', padding: '20px',
            animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-display)', color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>Recent Projects</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>View all →</Button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner size={32} />
          </div>
        ) : recent.length === 0 ? (
          <Empty
            icon="📋" title="No projects yet"
            description="Create your first project to get started with MyBaseCamp"
            action={<Button onClick={() => navigate('/projects/new')}>Create a project</Button>}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {recent.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i}
                onClick={() => navigate(`/projects/${project.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <QuickAction icon="➕" label="New Project" onClick={() => navigate('/projects/new')} />
          <QuickAction icon="📁" label="All Projects" onClick={() => navigate('/projects')} />
          {user.isAdmin && <QuickAction icon="⚙️" label="Admin Panel" onClick={() => navigate('/admin')} />}
          <QuickAction icon="👤" label="My Profile" onClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onClick, index }) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--white)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', padding: '20px', cursor: 'pointer',
      transition: 'all var(--transition)', animation: `fadeUp 0.4s ease ${index * 0.1}s both`,
      borderLeft: `4px solid ${project.color || 'var(--green)'}`,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
      <span style={{ fontSize: '28px' }}>{project.emoji || '📋'}</span>
      <Badge variant={project.status}>{project.status}</Badge>
    </div>
    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', marginBottom: '6px', fontWeight: 600 }}>
      {project.name}
    </h3>
    {project.description && (
      <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '14px' }}>
        {project.description.length > 80 ? project.description.slice(0, 80) + '…' : project.description}
      </p>
    )}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 'auto' }}>
      <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>
        {new Date(project.updatedAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const QuickAction = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 20px', borderRadius: 'var(--radius-sm)',
      background: 'var(--white)', border: '1px solid var(--border)',
      fontSize: '14px', fontWeight: 500, cursor: 'pointer',
      transition: 'all var(--transition)', color: 'var(--ink-soft)',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.background = 'var(--green-muted)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.background = 'var(--white)'; }}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>{label}
  </button>
);

export default Dashboard;
