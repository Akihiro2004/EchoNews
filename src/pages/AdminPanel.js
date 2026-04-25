import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCustomNews, getCustomNews, updateCustomNews, deleteCustomNews } from '../services/firebaseService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { validateImageFile } from '../utils/imageUtils';
import { Settings, Plus, FileText, BarChart3, Key, Edit3, Trash2, Check, Eye, EyeOff, Info, Camera, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_EMAIL = 'darrienwijaya@gmail.com';
const CATEGORIES = ['general', 'technology', 'business', 'entertainment', 'health', 'science', 'sports', 'politics', 'world'];
const TABS = [
  { id: 'create', label: 'Create', icon: Plus },
  { id: 'manage', label: 'Manage', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'api', label: 'API Keys', icon: Key },
];

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, rows = 3 }) {
  const shared = {
    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 14, outline: 'none',
    padding: '10px 12px', transition: 'border-color 0.15s',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            style={{ ...shared, resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={shared}
            onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
      }
    </div>
  );
}

function ImageUploader({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = validateImageFile(file);
    if (!valid.valid) { setError(valid.error); return; }
    setError('');
    setUploading(true);
    try {
      const result = await uploadImageToCloudinary(file, 'article_images');
      if (!result.success) throw new Error(result.error || 'Upload failed');
      onChange(result.url);
    } catch {
      setError('Upload failed. Try again or paste a URL.');
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Article Image</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste image URL or upload below"
          style={{
            flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 14, outline: 'none', padding: '10px 12px',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
            background: 'var(--surface-3)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
          {uploading
            ? <div style={{ width: 13, height: 13, border: '2px solid var(--text-3)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <Camera size={14} />}
          {uploading ? 'Uploading' : 'Upload'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5 }}>{error}</p>}
      {value && value.startsWith('http') && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="preview" style={{ height: 80, borderRadius: 'var(--radius)', objectFit: 'cover', border: '1px solid var(--border)' }}
            onError={e => e.currentTarget.style.display = 'none'} />
          <button type="button" onClick={() => onChange('')}
            style={{
              position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
              background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)',
            }}>
            <X size={10} />
          </button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}

function CreateArticle({ user, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', content: '', imageUrl: '', category: 'general', tags: '', isPublished: true });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = k => v => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await createCustomNews(user.uid, {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setSuccess(true);
      setForm({ title: '', description: '', content: '', imageUrl: '', category: 'general', tags: '', isPublished: true });
      onCreated?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to create article: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Title *" value={form.title} onChange={set('title')} placeholder="Article headline" />
      <Field label="Description / Excerpt" value={form.description} onChange={set('description')} placeholder="Brief summary shown in cards" multiline rows={2} />
      <Field label="Content" value={form.content} onChange={set('content')} placeholder="Full article content" multiline rows={8} />
      <ImageUploader value={form.imageUrl} onChange={set('imageUrl')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Category</label>
          <select value={form.category} onChange={e => set('category')(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 14, outline: 'none' }}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: 'var(--surface-2)' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <Field label="Tags (comma-separated)" value={form.tags} onChange={set('tags')} placeholder="ai, tech, future" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => set('isPublished')(!form.isPublished)}
          style={{
            width: 40, height: 22, borderRadius: 'var(--radius-full)', position: 'relative', cursor: 'pointer',
            background: form.isPublished ? 'var(--primary)' : 'var(--surface-3)', border: 'none', transition: 'background 0.2s',
          }}>
          <span style={{
            position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff',
            left: form.isPublished ? 20 : 2, transition: 'left 0.2s',
          }} />
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Publish immediately</span>
      </div>

      <button type="submit" disabled={loading || !form.title.trim()}
        style={{
          width: '100%', padding: '12px', borderRadius: 'var(--radius)',
          background: success ? 'rgba(48,209,88,0.12)' : 'var(--primary-gradient)',
          border: success ? '1px solid rgba(48,209,88,0.35)' : 'none',
          color: success ? 'var(--accent-green)' : '#fff',
          fontSize: 14, fontWeight: 600, cursor: loading || !form.title.trim() ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: !form.title.trim() ? 0.5 : 1,
        }}>
        {loading ? (
          <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Publishing</>
        ) : success ? (
          <><Check size={15} /> Article Published</>
        ) : (
          <><Plus size={15} /> Publish Article</>
        )}
      </button>
    </form>
  );
}

function ManageArticles({ user }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const arts = await getCustomNews({ authorId: user.uid, limit: 50 });
      setArticles(arts);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}"?`)) return;
    try {
      await deleteCustomNews(article.id, user.uid);
      setArticles(prev => prev.filter(a => a.id !== article.id));
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleSaveEdit = async () => {
    try {
      await updateCustomNews(editId, editForm);
      setArticles(prev => prev.map(a => a.id === editId ? { ...a, ...editForm } : a));
      setEditId(null);
    } catch (err) { alert('Update failed: ' + err.message); }
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius)' }} />)}</div>;
  if (!articles.length) return <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '40px 0' }}>No articles yet. Create one first.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {articles.map(a => (
        <div key={a.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {editId === a.id ? (
            <div style={{ padding: 16 }}>
              <input value={editForm.title || ''} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 14, padding: '8px 12px', outline: 'none', marginBottom: 10 }} />
              <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2}
                style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 13, padding: '8px 12px', outline: 'none', resize: 'vertical', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveEdit} style={{ padding: '7px 16px', borderRadius: 'var(--radius)', background: 'var(--primary-gradient)', color: '#fff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={13} /> Save
                </button>
                <button onClick={() => setEditId(null)} style={{ padding: '7px 14px', borderRadius: 'var(--radius)', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: a.isPublished ? 'var(--accent-green)' : 'var(--text-3)',
                    background: a.isPublished ? 'rgba(48,209,88,0.12)' : 'var(--surface-3)',
                    padding: '2px 7px', borderRadius: 'var(--radius-full)',
                  }}>
                    {a.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {a.category} · {a.createdAt?.toDate ? formatDistanceToNow(a.createdAt.toDate(), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title}
                </p>
                {a.description && <p style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => { setEditId(a.id); setEditForm({ title: a.title, description: a.description }); }}
                  style={{ padding: 7, borderRadius: 'var(--radius-sm)', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'flex', cursor: 'pointer' }}>
                  <Edit3 size={13} />
                </button>
                <button onClick={() => handleDelete(a)}
                  style={{ padding: 7, borderRadius: 'var(--radius-sm)', background: 'rgba(255,69,58,0.06)', border: '1px solid rgba(255,69,58,0.2)', color: 'var(--accent)', display: 'flex', cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Analytics({ user }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const arts = await getCustomNews({ authorId: user.uid, limit: 100 });
        setArticles(arts);
      } catch { }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />;

  const published = articles.filter(a => a.isPublished).length;
  const drafts = articles.length - published;
  const totalViews = articles.reduce((s, a) => s + (a.views || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Articles', value: articles.length, color: 'var(--primary)' },
          { label: 'Published', value: published, color: 'var(--accent-green)' },
          { label: 'Drafts', value: drafts, color: 'var(--accent-warm)' },
          { label: 'Total Views', value: totalViews, color: 'var(--accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>{value}</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</p>
          </div>
        ))}
      </div>

      {articles.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 10 }}>Recent Articles</p>
          {articles.slice(0, 5).map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-1)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{a.title}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{a.views || 0} views</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function APIKeys() {
  const [showKeys, setShowKeys] = useState({});
  const keys = Array.from({ length: 5 }, (_, i) => process.env[`REACT_APP_GOOGLE_GEMINI_API_KEY_${i + 1}`]).filter(Boolean);

  return (
    <div>
      <div style={{ padding: '12px 14px', background: 'rgba(255,214,10,0.07)', border: '1px solid rgba(255,214,10,0.2)', borderRadius: 'var(--radius)', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={14} style={{ color: 'var(--accent-warm)', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
          {keys.length} Gemini API {keys.length !== 1 ? 'keys' : 'key'} configured. Keys rotate automatically on rate limit errors.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {keys.map((key, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>Key {i + 1}</span>
            <code style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {showKeys[i] ? key : key.slice(0, 8) + '............' + key.slice(-4)}
            </code>
            <button onClick={() => setShowKeys(p => ({ ...p, [i]: !p[i] }))}
              style={{ color: 'var(--text-3)', display: 'flex', padding: 4 }}>
              {showKeys[i] ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 10 }}>Other Services</p>
        {[
          { label: 'Guardian API', key: process.env.REACT_APP_GUARDIAN_API_KEY },
          { label: 'NewsAPI', key: process.env.REACT_APP_NEWS_API_KEY },
          { label: 'Cloudinary', key: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET },
        ].map(({ label, key }) => key && (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, minWidth: 100 }}>{label}</span>
            <code style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{key.slice(0, 6)}...{key.slice(-4)}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel({ user, onMenuOpen }) {
  const [tab, setTab] = useState('create');
  const navigate = useNavigate();

  if (user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Settings size={22} style={{ color: 'var(--text-3)' }} />
          </div>
          <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 24, fontWeight: 400, color: 'var(--text-1)', marginBottom: 10 }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>This area is only available to administrators.</p>
          <button onClick={() => navigate('/')}
            style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', background: 'var(--primary-gradient)', color: '#fff', fontSize: 14, fontWeight: 500 }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '28px 32px 0', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--surface) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Settings size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--primary)' }}>Admin</span>
        </div>
        <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 34, fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.4px', marginBottom: 20 }}>Content Studio</h1>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: -1 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
                color: tab === id ? 'var(--primary)' : 'var(--text-2)',
                borderBottom: tab === id ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent', fontSize: 13.5, fontWeight: tab === id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 32px 48px', maxWidth: 720, margin: '0 auto' }}>
        {tab === 'create' && <CreateArticle user={user} onCreated={() => {}} />}
        {tab === 'manage' && <ManageArticles user={user} />}
        {tab === 'analytics' && <Analytics user={user} />}
        {tab === 'api' && <APIKeys />}
      </div>
    </div>
  );
}
