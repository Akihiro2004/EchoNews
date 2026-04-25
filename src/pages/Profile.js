import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, updateProfilePicture } from '../services/firebaseService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { validateImageFile } from '../utils/imageUtils';
import { User, MapPin, Link as LinkIcon, Save, Camera, Check, BookOpen, Heart, Edit3 } from 'lucide-react';

const ALL_CATEGORIES = [
  'general', 'technology', 'business', 'entertainment',
  'health', 'science', 'sports', 'politics', 'world',
];

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 22px', marginBottom: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false }) {
  const sharedStyle = {
    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 14, outline: 'none',
    transition: 'border-color 0.15s',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{ ...sharedStyle, padding: '10px 12px', resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ ...sharedStyle, padding: '10px 12px' }}
          onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-strong)'} />
      )}
    </div>
  );
}

export default function Profile({ user, onMenuOpen }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState('');
  const fileInputRef = React.useRef(null);

  const [form, setForm] = useState({
    displayName: '', bio: '', location: '', website: '',
    social: { twitter: '', linkedin: '', github: '' },
    preferences: { categories: [] },
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await getUserProfile(user.uid);
        if (p) {
          setProfile(p);
          setForm({
            displayName: p.displayName || user.displayName || '',
            bio: p.bio || '',
            location: p.location || '',
            website: p.website || '',
            social: { twitter: p.social?.twitter || '', linkedin: p.social?.linkedin || '', github: p.social?.github || '' },
            preferences: { categories: p.preferences?.categories || [] },
          });
        }
      } catch { }
      setLoading(false);
    })();
  }, [user.uid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName,
        bio: form.bio,
        location: form.location,
        website: form.website,
        social: form.social,
        preferences: form.preferences,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { }
    setSaving(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateImageFile(file);
    if (!result.valid) { setImgError(result.error); return; }
    setImgError('');
    setImgLoading(true);
    try {
      const upload = await uploadImageToCloudinary(file, 'profile_pictures');
      if (!upload.success) throw new Error(upload.error || 'Upload failed');
      await updateProfilePicture(user.uid, upload.url);
      setProfile(prev => ({ ...prev, profileImageUrl: upload.url }));
    } catch (err) {
      setImgError('Upload failed. Please try again.');
    }
    setImgLoading(false);
    e.target.value = '';
  };

  const toggleCategory = (cat) => {
    setForm(prev => {
      const cats = prev.preferences.categories.includes(cat)
        ? prev.preferences.categories.filter(c => c !== cat)
        : [...prev.preferences.categories, cat];
      return { ...prev, preferences: { ...prev.preferences, categories: cats } };
    });
  };

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));
  const setSocial = (key) => (val) => setForm(prev => ({ ...prev, social: { ...prev.social, [key]: val } }));

  const avatar = profile?.profileImageUrl || user.photoURL;
  const initials = (form.displayName?.[0] || user.email?.[0] || '?').toUpperCase();
  const stats = profile?.stats || {};

  if (loading) {
    return (
      <div style={{ padding: '32px', maxWidth: 640, margin: '0 auto' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)', marginBottom: 16 }} />)}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '28px 32px 0', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--surface) 0%, transparent 100%)', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <User size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--primary)' }}>Account</span>
        </div>
        <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 34, fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.4px', marginBottom: 20 }}>Profile</h1>
      </div>

      <div style={{ padding: '0 32px 48px', maxWidth: 720, margin: '0 auto' }}>
        {/* Avatar + Stats */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2c2c2e, #3a3a3c)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: 'var(--text-2)',
              border: '2px solid var(--border-strong)',
            }}>
              {avatar
                ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={imgLoading}
              style={{
                position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
                borderRadius: '50%', background: 'var(--surface-3)', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
              {imgLoading
                ? <div style={{ width: 11, height: 11, border: '2px solid var(--text-3)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Camera size={12} color="var(--text-1)" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, flex: 1 }}>
            {[
              { icon: BookOpen, label: 'Articles read', value: stats.articlesRead || 0 },
              { icon: Heart, label: 'Saved', value: stats.favoriteCount || 0 },
              { icon: Edit3, label: 'Published', value: stats.customNewsCount || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                flex: 1, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', textAlign: 'center',
              }}>
                <Icon size={15} style={{ color: 'var(--primary)', marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {imgError && (
          <p style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{imgError}</p>
        )}

        {/* Basic Info */}
        <Section title="Basic Info">
          <Field label="Display Name" value={form.displayName} onChange={set('displayName')} placeholder="Your name" />
          <Field label="Bio" value={form.bio} onChange={set('bio')} placeholder="Tell us a bit about yourself" multiline />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Location" value={form.location} onChange={set('location')} placeholder="City, Country" />
            <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://..." type="url" />
          </div>
        </Section>

        {/* Social */}
        <Section title="Social Links">
          <Field label="Twitter / X" value={form.social.twitter} onChange={setSocial('twitter')} placeholder="@username" />
          <Field label="LinkedIn" value={form.social.linkedin} onChange={setSocial('linkedin')} placeholder="linkedin.com/in/..." />
          <Field label="GitHub" value={form.social.github} onChange={setSocial('github')} placeholder="github.com/..." />
        </Section>

        {/* Interests */}
        <Section title="News Interests">
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Select the topics you are most interested in.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALL_CATEGORIES.map(cat => {
              const active = form.preferences.categories.includes(cat);
              return (
                <button key={cat} onClick={() => toggleCategory(cat)}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--radius-full)',
                    border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: active ? 'var(--primary-subtle)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-2)', fontSize: 13, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  {active && <Check size={11} />}
                  {cat}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Account */}
        <Section title="Account">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2c2c2e, #3a3a3c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 14, fontWeight: 600 }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{user.displayName || form.displayName || 'User'}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{user.email}</p>
            </div>
          </div>
        </Section>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          style={{
            width: '100%', padding: '13px', borderRadius: 'var(--radius-lg)',
            background: saved ? 'rgba(48,209,88,0.12)' : 'var(--primary-gradient)',
            border: saved ? '1px solid rgba(48,209,88,0.35)' : 'none',
            color: saved ? 'var(--accent-green)' : '#fff',
            fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', boxShadow: saved ? 'none' : 'var(--shadow-primary)',
          }}>
          {saving ? (
            <><div style={{ width: 15, height: 15, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving</>
          ) : saved ? (
            <><Check size={16} /> Saved</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
