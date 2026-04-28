import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getThreadById, createMessage, listMessagesByThread, subscribeToMessagesByThread, 
  deleteMessage, updateMessage, updateThread, deleteThread 
} from '../lib/amplifyClient';
import { Button, Spinner, Alert, Avatar, Card, Textarea, Confirm, Modal, Input } from '../components/UI';

const ThreadDetail = () => {
  const { projectId, threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Thread edit/delete state
  const [showEditThread, setShowEditThread] = useState(false);
  const [editThreadTitle, setEditThreadTitle] = useState('');
  const [updatingThread, setUpdatingThread] = useState(false);
  const [confirmDeleteThread, setConfirmDeleteThread] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const threadData = await getThreadById(threadId);
        setThread(threadData);
        setEditThreadTitle(threadData.title);
        
        const msgData = await listMessagesByThread(threadId);
        setMessages(msgData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to new messages
    const sub = subscribeToMessagesByThread(threadId, (newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    });

    return () => sub.unsubscribe();
  }, [threadId]);

  useEffect(scrollToBottom, [messages]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSending(true);
    try {
      await createMessage({
        content,
        threadId,
        senderProfileId: user.id,
      });
      setContent('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    setUpdating(true);
    try {
      const updated = await updateMessage(editingMessage.id, editContent);
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
      setEditingMessage(null);
      setEditContent('');
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage(confirmDelete.id);
      setMessages(prev => prev.filter(m => m.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpdateThread = async (e) => {
    e.preventDefault();
    if (!editThreadTitle.trim()) return;

    setUpdatingThread(true);
    try {
      const updated = await updateThread(threadId, editThreadTitle);
      setThread(prev => ({ ...prev, title: updated.title }));
      setShowEditThread(false);
    } catch (e) {
      alert('Update failed: ' + e.message);
    } finally {
      setUpdatingThread(false);
    }
  };

  const handleDeleteThread = async () => {
    setDeletingThread(true);
    try {
      await deleteThread(threadId);
      navigate(`/projects/${projectId}`);
    } catch (e) {
      alert('Delete failed: ' + e.message);
      setDeletingThread(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size={40} /></div>;
  if (error && !thread) return <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}><Alert type="error">{error}</Alert></div>;
  if (!thread) return null;

  const isProjectAdmin = thread.project?.ownerProfileId === user.id || user.isAdmin;
  const isMember = thread.project?.memberIds?.includes(user.id) || isProjectAdmin;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={() => navigate(`/projects/${projectId}`)} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: '14px', padding: '4px 0',
        }}>← Back to Project</button>
        
        {isProjectAdmin && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" size="sm" onClick={() => setShowEditThread(true)}>✏️ Edit Thread</Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDeleteThread(true)}>🗑️ Delete Thread</Button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '8px' }}>{thread.title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Started on {new Date(thread.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex', gap: '16px', 
            animation: 'fadeUp 0.3s ease'
          }}>
            <Avatar username={msg.senderProfile?.username || msg.owner} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{msg.senderProfile?.username || msg.owner?.slice(0, 8)}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {new Date(msg.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
                {(msg.owner === user.id || isProjectAdmin) && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {msg.owner === user.id && (
                      <button 
                        onClick={() => {
                          setEditingMessage(msg);
                          setEditContent(msg.content);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--ink)', fontSize: '11px', cursor: 'pointer', opacity: 0.6 }}
                      >Edit</button>
                    )}
                    <button 
                      onClick={() => setConfirmDelete(msg)}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer', opacity: 0.6 }}
                    >Delete</button>
                  </div>
                )}
              </div>
              
              {editingMessage?.id === msg.id ? (
                <div style={{ background: 'var(--white)', padding: '12px', borderRadius: '12px', border: '1px solid var(--green)' }}>
                  <Textarea 
                    value={editContent} 
                    onChange={e => setEditContent(e.target.value)}
                    style={{ marginBottom: '8px', minHeight: '60px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button size="sm" onClick={handleUpdate} loading={updating}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMessage(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'var(--white)', padding: '12px 16px', borderRadius: '0 12px 12px 12px',
                  border: '1px solid var(--border)', fontSize: '14px', lineHeight: 1.5, color: 'var(--ink-soft)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isMember ? (
        <Card style={{ position: 'sticky', bottom: 24, zIndex: 10 }}>
          <form onSubmit={handlePost}>
            <Textarea 
              placeholder="Write a message..." 
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={sending}
              style={{ marginBottom: '12px', minHeight: '80px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" loading={sending} disabled={!content.trim()}>Post Message</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Alert type="info">Only project members can post messages in this thread.</Alert>
      )}

      <Confirm 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
      />

      <Modal
        open={showEditThread}
        onClose={() => setShowEditThread(false)}
        title="Edit Thread"
      >
        <form onSubmit={handleUpdateThread}>
          <Input 
            label="Thread Title" 
            value={editThreadTitle}
            onChange={e => setEditThreadTitle(e.target.value)}
            required
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" loading={updatingThread} style={{ flex: 1 }}>Save Changes</Button>
            <Button variant="ghost" onClick={() => setShowEditThread(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={confirmDeleteThread}
        onClose={() => setConfirmDeleteThread(false)}
        onConfirm={handleDeleteThread}
        loading={deletingThread}
        title="Delete Thread"
        message="Permanently delete this thread and all its messages?"
      />
    </div>
  );
};

export default ThreadDetail;
