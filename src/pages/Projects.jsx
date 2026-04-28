import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listMyProjects, deleteProject } from '../lib/amplifyClient';
import { Button, Badge, Avatar, Spinner, Empty, Confirm, Alert } from '../components/UI';

export const EMOJIS = ['📋','🚀','💡','🎯','🛠️','🌱','⚡','🎨','📊','🔬','💼','🏆'];
export const COLORS = ['#1a7f5a','#2563eb','#7c3aed','#c97b1a','#d94040','#0891b2','#059669','#dc2626'];

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    // AppSync query — auth rules ensure only owned/member projects are returned
    listMyProjects()
      .then(setProjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // AppSync mutation → DynamoDB delete
      await deleteProject(confirmDelete.id);
      setProjects(ps => ps.filter(p => p.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '4px' }}>Projects</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>＋ New Project</Button>
      </div>

      {error && <Alert type="error" onClose={() => setError('')} style={{ marginBottom: 20 }}>{error}</Alert>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'active', 'completed', 'archived'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: '100px', fontSize: '13px',
            fontWeight: filter === f ? 600 : 400, cursor: 'pointer',
            border: `1.5px solid ${filter === f ? 'var(--green)' : 'var(--border)'}`,
            background: filter === f ? 'var(--green-muted)' : 'var(--white)',
            color: filter === f ? 'var(--green-dark)' : 'var(--ink-soft)',
            transition: 'all var(--transition)', textTransform: 'capitalize',
          }}>
            {f === 'all' ? `All (${projects.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${projects.filter(p=>p.status===f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Spinner size={36} /></div>
      ) : filtered.length === 0 ? (
        <Empty
          icon="📭"
          title={filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          description={filter === 'all' ? 'Create your first project to start organising your work.' : `You have no ${filter} projects right now.`}
          action={filter === 'all' && <Button onClick={() => navigate('/projects/new')}>Create your first project</Button>}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filtered.map((project, i) => (
            <ProjectCard
              key={project.id} project={project} index={i}
              isOwner={project.owner === user.id || user.isAdmin}
              onView={() => navigate(`/projects/${project.id}`)}
              onEdit={() => navigate(`/projects/${project.id}/edit`)}
              onDelete={() => setConfirmDelete(project)}
            />
          ))}
        </div>
      )}

      <Confirm
        open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

const ProjectCard = ({ project, index, isOwner, onView, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--white)', borderRadius: 'var(--radius)',
      border: '1px solid var(--border)', overflow: 'hidden',
      animation: `fadeUp 0.4s ease ${index * 0.07}s both`,
      transition: 'all var(--transition)', position: 'relative',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ height: 6, background: project.color || 'var(--green)' }} />
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>{project.emoji || '📋'}</span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, lineHeight: 1.3 }}>{project.name}</h3>
              <Badge variant={project.status}>{project.status}</Badge>
            </div>
          </div>
          {isOwner && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: '6px', color: 'var(--muted)', fontSize: '18px',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cream-dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >⋯</button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, width: 160,
                  background: 'var(--white)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                  zIndex: 50, animation: 'slideDown 0.15s ease', overflow: 'hidden',
                }} onMouseLeave={() => setMenuOpen(false)}>
                  {[
                    { label: '👁️ View', action: onView },
                    { label: '✏️ Edit', action: onEdit },
                    { label: '🗑️ Delete', action: onDelete, danger: true },
                  ].map(item => (
                    <button key={item.label} onClick={() => { item.action(); setMenuOpen(false); }} style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '14px', textAlign: 'left', color: item.danger ? 'var(--red)' : 'var(--ink-soft)',
                      transition: 'background var(--transition)',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'var(--red-muted)' : 'var(--cream-dark)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >{item.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {project.description && (
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
            {project.description.length > 100 ? project.description.slice(0, 100) + '…' : project.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onView} style={{
            padding: '6px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--green-muted)', color: 'var(--green-dark)',
            border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            transition: 'all var(--transition)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#c4e8d8'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--green-muted)'}
          >Open →</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Project Form shared between New and Edit ─────────────────────────────── */
export const ProjectForm = ({ existing, onSave }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    color: existing?.color || COLORS[0],
    emoji: existing?.emoji || '📋',
    status: existing?.status || 'active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required.');
    setError(''); setLoading(true);
    try { await onSave(form); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '6px' }}>Project Name *</label>
        <input value={form.name} onChange={update('name')} placeholder="Give your project a name..." required
          style={{ width: '100%', padding: '11px 14px', fontSize: '15px', fontWeight: 500, border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--ink)', transition: 'border-color var(--transition)', fontFamily: 'var(--font-body)' }}
          onFocus={e => e.target.style.borderColor = 'var(--green)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '6px' }}>Description</label>
        <textarea value={form.description} onChange={update('description')} placeholder="What's this project about?" rows={3}
          style={{ width: '100%', padding: '11px 14px', fontSize: '14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--ink)', resize: 'vertical', lineHeight: 1.5, transition: 'border-color var(--transition)', fontFamily: 'var(--font-body)' }}
          onFocus={e => e.target.style.borderColor = 'var(--green)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '8px' }}>Project Icon</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EMOJIS.map(em => (
            <button key={em} type="button" onClick={() => setForm(f => ({ ...f, emoji: em }))} style={{
              width: 42, height: 42, borderRadius: 'var(--radius-sm)',
              border: `2px solid ${form.emoji === em ? 'var(--green)' : 'var(--border)'}`,
              background: form.emoji === em ? 'var(--green-muted)' : 'var(--white)',
              fontSize: '22px', cursor: 'pointer', transition: 'all var(--transition)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{em}</button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '8px' }}>Color</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} style={{
              width: 34, height: 34, borderRadius: '50%', background: c,
              border: `3px solid ${form.color === c ? 'var(--ink)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all var(--transition)',
              boxShadow: form.color === c ? '0 0 0 2px white inset' : 'none',
            }} />
          ))}
        </div>
      </div>

      {existing && (
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '6px' }}>Status</label>
          <select value={form.status} onChange={update('status')} style={{ padding: '10px 14px', fontSize: '14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--white)', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {/* Live preview */}
      <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--cream-dark)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px', fontWeight: 500 }}>PREVIEW</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>{form.emoji}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px', fontFamily: 'var(--font-display)' }}>{form.name || 'Untitled Project'}</div>
            <div style={{ width: 60, height: 4, background: form.color, borderRadius: 2, marginTop: 6 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
        <Button type="submit" loading={loading} size="lg">{existing ? 'Save Changes' : 'Create Project'}</Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
      </div>
    </form>
  );
};

export default Projects;
