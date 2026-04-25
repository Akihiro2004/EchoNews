import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { auth } from '../Firebase';
import { createUserProfile } from '../services/firebaseService';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthModal({ mode, onClose, onModeChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSignIn = mode === 'signin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignIn) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(user, { displayName: name });
        await createUserProfile(user, { displayName: name }).catch(() => {});
      }
      onClose();
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account with that email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'Email already in use.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/invalid-credential': 'Invalid credentials.',
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await createUserProfile(user).catch(() => {});
      onClose();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)',
        width: '100%',
        maxWidth: 400,
        padding: '32px 28px',
        position: 'relative',
        animation: 'fadeUp 0.3s var(--ease) forwards',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            color: 'var(--text-3)', padding: 4,
            borderRadius: 6, display: 'flex',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
            fontSize: 16, fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.2px',
          }}>Echo <span style={{ fontWeight: 700 }}>News</span></span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
          {isSignIn ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
          {isSignIn
            ? 'Sign in to save articles and personalize your feed.'
            : 'Join to save articles, personalize your news, and more.'}
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '11px 16px', borderRadius: 'var(--radius)',
            background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
            color: 'var(--text-1)', fontSize: 14, fontWeight: 500,
            transition: 'all 0.15s ease', marginBottom: 16,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--surface-3)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isSignIn && (
            <Field
              icon={User} placeholder="Full name" value={name}
              onChange={e => setName(e.target.value)} type="text"
            />
          )}
          <Field
            icon={Mail} placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} type="email" required
          />
          <div style={{ position: 'relative' }}>
            <Field
              icon={Lock} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-3)', display: 'flex',
              }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <p style={{
              fontSize: 13, color: 'var(--accent)', background: 'var(--accent-subtle)',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,107,107,0.2)',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 'var(--radius)',
              background: 'var(--primary-gradient)', color: '#fff',
              fontSize: 14, fontWeight: 600, marginTop: 4,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s, transform 0.15s',
              boxShadow: 'var(--shadow-primary)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Please wait…' : isSignIn ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => onModeChange(isSignIn ? 'signup' : 'signin')}
            style={{ color: 'var(--primary)', fontWeight: 500, fontSize: 13 }}
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-3)', pointerEvents: 'none',
      }} />
      <input
        {...props}
        style={{
          width: '100%', padding: '11px 12px 11px 36px',
          background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius)', color: 'var(--text-1)', fontSize: 14,
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
      />
    </div>
  );
}
