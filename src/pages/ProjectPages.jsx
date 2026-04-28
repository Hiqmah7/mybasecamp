import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { useAuth } from '../contexts/AuthContext';
import { 
  createProject, getProjectById, updateProject, deleteProject,
  createAttachment, deleteAttachment,
  createThread, deleteThread
} from '../lib/amplifyClient';
import { ProjectForm } from './Projects';
import { Button, Badge, Spinner, Alert, Confirm, Modal, Input, Textarea, Card, Avatar } from '../components/UI';

/* ─── Page shell ─────────────────────────────────────────────────────────── */
const PageShell = ({ title, subtitle, children }) => (
  <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
    <div style={{ marginBottom: '32px', animation: 'fadeUp 0.35s ease' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '4px' }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{subtitle}</p>}
    </div>
    <div style={{ animation: 'fadeUp 0.4s ease 0.05s both' }}>{children}</div>
  </div>
);

const FormCard = ({ children }) => (
  <div style={{
    background: 'var(--white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)', padding: '32px', boxShadow: 'var(--shadow-sm)',
  }}>{children}</div>
);

/* ─── New Project ─────────────────────────────────────────────────────────── */
export const NewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSave = async (data) => {
    // AppSync creates item in DynamoDB, owner set via Cognito identity
    const project = await createProject({ ...data, ownerProfileId: user.id });
    navigate(`/projects/${project.id}`);
  };

  return (
    <PageShell title="New Project" subtitle="Set up a new workspace for your team">
      <FormCard><ProjectForm onSave={handleSave} /></FormCard>
    </PageShell>
  );
};

/* ─── Edit Project ────────────────────────────────────────────────────────── */
export const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProjectById(id)
      .then(setProject)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (data) => {
    await updateProject(id, data);
    navigate(`/projects/${id}`);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size={40} /></div>;
  if (error) return <PageShell title="Error"><Alert type="error">{error}</Alert></PageShell>;

  return (
    <PageShell title="Edit Project" subtitle={`Editing "${project?.name}"`}>
      <FormCard><ProjectForm existing={project} onSave={handleSave} /></FormCard>
    </PageShell>
  );
};

/* ─── Project Detail ──────────────────────────────────────────────────────── */
export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  // Attachments state
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Threads state
  const [threads, setThreads] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const data = await getProjectById(id);
      setProject(data);
      setAttachments(data.attachments || []);
      setThreads(data.threads || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = `attachments/${id}/${Date.now()}-${file.name}`;
      await uploadData({
        path,
        data: file,
        options: { contentType: file.type }
      }).result;

      const newAttachment = await createAttachment({
        name: file.name,
        format: file.type.split('/')[1] || 'file',
        storagePath: path,
        projectId: id,
        ownerProfileId: user.id,
      });

      setAttachments(prev => [...prev, newAttachment]);
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId, path) => {
    try {
      await remove({ path });
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;

    setCreatingThread(true);
    try {
      const thread = await createThread({
        title: newThreadTitle,
        projectId: id,
      });
      setThreads(prev => [...prev, thread]);
      setNewThreadTitle('');
      setShowThreadModal(false);
    } catch (e) {
      alert('Failed to create thread: ' + e.message);
    } finally {
      setCreatingThread(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size={40} /></div>;
  if (error) return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 24px' }}>
      <Alert type="error">{error}</Alert>
      <Button variant="ghost" onClick={() => navigate('/projects')} style={{ marginTop: 16 }}>← Back</Button>
    </div>
  );
  if (!project) return null;

  // Owner check: AppSync owner field vs Cognito user ID
  const isOwner = project.ownerProfileId === user.id || user.isAdmin;
  const isMember = project.memberIds?.includes(user.id) || isOwner;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
      <button onClick={() => navigate('/projects')} style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted)', fontSize: '14px', marginBottom: '24px', padding: '4px 0',
        transition: 'color var(--transition)',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
      >← All Projects</button>

      {/* Header card */}
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', overflow: 'hidden',
        marginBottom: '24px', animation: 'fadeUp 0.4s ease', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ height: 10, background: project.color || 'var(--green)' }} />
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '52px', lineHeight: 1 }}>{project.emoji || '📋'}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>{project.name}</h1>
                  <Badge variant={project.status}>{project.status}</Badge>
                </div>
                {project.description && (
                  <p style={{ color: 'var(--ink-soft)', fontSize: '15px', lineHeight: 1.6, maxWidth: 560 }}>{project.description}</p>
                )}
              </div>
            </div>
            {isOwner && (
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${id}/edit`)}>✏️ Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>🗑️ Delete</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* Message Board */}
        <Card title="💬 Message Board">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {threads.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No discussions yet.</p>
            ) : (
              threads.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => navigate(`/projects/${id}/threads/${t.id}`)}
                  style={{ 
                    padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', 
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{t.title}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>→</span>
                </div>
              ))
            )}
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={() => setShowThreadModal(true)}>+ New Thread</Button>
            )}
            {!isMember && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>Only members can participate.</p>
            )}
          </div>
        </Card>

        {/* Docs & Files */}
        <Card title="📄 Docs & Files">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attachments.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>No files uploaded.</p>
            ) : (
              attachments.map(a => (
                <div 
                  key={a.id} 
                  style={{ 
                    padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{getFileIcon(a.format)}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{a.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>{a.format}</span>
                    </div>
                  </div>
                  {isMember && (
                    <button 
                      onClick={() => handleDeleteAttachment(a.id, a.storagePath)}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '12px' }}
                    >🗑️</button>
                  )}
                </div>
              ))
            )}
            {isMember && (
              <div style={{ marginTop: '4px' }}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  style={{ width: '100%' }}
                >
                  {uploading ? 'Uploading...' : '📁 Upload File'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Confirm
        open={confirmDelete} onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Project"
        message={`Permanently delete "${project.name}"? All DynamoDB data will be removed.`}
      />

      <Modal
        open={showThreadModal}
        onClose={() => setShowThreadModal(false)}
        title="Create New Thread"
      >
        <form onSubmit={handleCreateThread}>
          <Input 
            label="Thread Title" 
            placeholder="What's on your mind?" 
            value={newThreadTitle}
            onChange={e => setNewThreadTitle(e.target.value)}
            required
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" loading={creatingThread} style={{ flex: 1 }}>Create Thread</Button>
            <Button variant="ghost" onClick={() => setShowThreadModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const getFileIcon = (format) => {
  switch (format?.toLowerCase()) {
    case 'pdf': return '📕';
    case 'png':
    case 'jpg':
    case 'jpeg': return '🖼️';
    case 'txt': return '📄';
    default: return '📁';
  }
};


const MetaCard = ({ icon, label, children }) => (
  <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px 20px' }}>
    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
      {icon} {label}
    </div>
    {children}
  </div>
);
