import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../Firebase';
import { Home, Star, Bookmark, User, LogIn, LogOut, Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', icon: Home, label: 'Home', exact: true },
  { to: '/for-you', icon: Star, label: 'For You', auth: true },
  { to: '/favorites', icon: Bookmark, label: 'Saved', auth: true },
];

const BOTTOM_NAV = [
  { to: '/profile', icon: User, label: 'Profile', auth: true },
];

const logoTextStyle = {
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
  fontSize: 16,
  fontWeight: 400,
  color: 'var(--text-1)',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.2px',
};

function NavItem({ to, icon: Icon, label, isActive, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--radius)',
        color: isActive ? 'var(--primary)' : 'var(--text-2)',
        background: isActive ? 'var(--primary-subtle)' : 'transparent',
        transition: 'all 0.15s ease',
        fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        whiteSpace: 'nowrap',
        position: 'relative',
        textDecoration: 'none',
        border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--surface-hover)';
          e.currentTarget.style.color = 'var(--text-1)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-2)';
        }
      }}
    >
      {isActive && (
        <span style={{
          position: 'absolute',
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 16,
          background: 'var(--primary)',
          borderRadius: '0 3px 3px 0',
        }} />
      )}
      <Icon size={17} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </NavLink>
  );
}

function UserTile({ user, onSignOut }) {
  const initial = (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 'var(--radius)',
      marginTop: 4,
      borderTop: '1px solid var(--border)',
      paddingTop: 14,
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: 'var(--primary-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {user.photoURL
          ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.displayName || user.email?.split('@')[0] || 'User'}
        </p>
      </div>
      <button
        onClick={onSignOut}
        title="Sign out"
        style={{
          color: 'var(--text-3)',
          padding: 4,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

export default function Sidebar({ user, onOpenAuth, mobileOpen, onMobileClose, onMobileOpen }) {
  const location = useLocation();

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
  };

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const handleProtected = (e, authRequired) => {
    if (authRequired && !user) {
      e.preventDefault();
      onOpenAuth('signin');
    }
    onMobileClose();
  };

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 'var(--sidebar-w)',
    height: '100vh',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    overflow: 'hidden',
  };

  const navStyle = {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  };

  const bottomStyle = {
    padding: '12px 8px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={sidebarStyle} className="desktop-sidebar">
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          height: 64,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={logoTextStyle}>
            Echo <span style={{ fontWeight: 700 }}>News</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={navStyle}>
          {NAV.map(({ to, icon, label, exact, auth: authReq }) => (
            <NavItem
              key={to}
              to={to}
              icon={icon}
              label={label}
              isActive={isActive(to, exact)}
              onClick={e => handleProtected(e, authReq)}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div style={bottomStyle}>
          {BOTTOM_NAV.map(({ to, icon, label, auth: authReq }) => (
            user && (
              <NavItem
                key={to}
                to={to}
                icon={icon}
                label={label}
                isActive={isActive(to, false)}
                onClick={e => handleProtected(e, authReq)}
              />
            )
          ))}

          {user ? (
            <UserTile user={user} onSignOut={handleSignOut} />
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                width: '100%',
                borderRadius: 'var(--radius)',
                color: 'var(--primary)',
                background: 'var(--primary-subtle)',
                border: '1px solid var(--primary-border)',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,119,87,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-subtle)'}
            >
              <LogIn size={17} style={{ flexShrink: 0 }} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        zIndex: 100,
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }} className="mobile-topbar">
        <button
          onClick={mobileOpen ? onMobileClose : onMobileOpen}
          style={{ color: 'var(--text-2)', display: 'flex', padding: 4 }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ flex: 1 }}>
          <span style={logoTextStyle}>
            Echo <span style={{ fontWeight: 700 }}>News</span>
          </span>
        </div>
        {user ? (
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden',
          }}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
          </div>
        ) : (
          <button
            onClick={() => onOpenAuth('signin')}
            style={{
              fontSize: 13, fontWeight: 500, color: 'var(--primary)',
              padding: '6px 12px', borderRadius: 'var(--radius)',
              background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)',
            }}
          >
            Sign In
          </button>
        )}
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <aside style={{
          ...sidebarStyle,
          top: 56,
          height: 'calc(100vh - 56px)',
          animation: 'slideInLeft 0.25s ease',
        }}>
          <nav style={navStyle}>
            {NAV.map(({ to, icon, label, exact, auth: authReq }) => (
              <NavItem
                key={to}
                to={to}
                icon={icon}
                label={label}
                isActive={isActive(to, exact)}
                onClick={e => handleProtected(e, authReq)}
              />
            ))}
          </nav>
          <div style={bottomStyle}>
            {user && BOTTOM_NAV.map(({ to, icon, label }) => (
              <NavItem
                key={to}
                to={to}
                icon={icon}
                label={label}
                isActive={isActive(to, false)}
                onClick={onMobileClose}
              />
            ))}
            {user ? (
              <UserTile user={user} onSignOut={handleSignOut} />
            ) : (
              <button
                onClick={() => { onOpenAuth('signin'); onMobileClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', width: '100%', borderRadius: 'var(--radius)',
                  color: 'var(--primary)', background: 'var(--primary-subtle)',
                  border: '1px solid var(--primary-border)', fontSize: 14, fontWeight: 500,
                }}
              >
                <LogIn size={17} /><span>Sign In</span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 8px',
      }}>
        {[
          { to: '/', icon: Home, label: 'Home', exact: true },
          { to: '/for-you', icon: Star, label: 'For You', auth: true },
          { to: '/favorites', icon: Bookmark, label: 'Saved', auth: true },
          { to: '/profile', icon: User, label: 'Profile', auth: true },
        ].map(({ to, icon: Icon, label, exact, auth: authReq }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={e => {
                if (authReq && !user) { e.preventDefault(); onOpenAuth('signin'); }
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '6px 12px', borderRadius: 'var(--radius)',
                color: active ? 'var(--primary)' : 'var(--text-3)',
                fontSize: 10, fontWeight: active ? 600 : 400,
                transition: 'color 0.15s',
                textDecoration: 'none',
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}
