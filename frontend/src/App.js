import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Results from './pages/Results';
import Submissions from './pages/Submissions';
import AdminDashboard from './pages/AdminDashboard';
import { FiLogOut, FiUploadCloud, FiList, FiShield, FiUser } from 'react-icons/fi';
import API_BASE_URL from './config';

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_info');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [sessionNotice, setSessionNotice] = useState('');
  const [artworkId, setArtworkId] = useState(null);
  const [loginDefaultTab, setLoginDefaultTab] = useState('signin'); // 'signin' | 'register'
  const [showLogin, setShowLogin] = useState(false); // guest -> shows login modal over landing

  /* ─── Helpers ────────────────────────────────────────────── */
  const isAdmin = Boolean(
    user && (user.is_staff || user.is_superuser || user.role === 'admin' || user.username === 'admin')
  );

  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const stored = localStorage.getItem('user_info');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.is_staff || u?.is_superuser || u?.role === 'admin' || u?.username === 'admin') {
          return 'admin';
        }
      }
    } catch {}
    return 'upload';
  });

  const handleLogout = useCallback((notice = '') => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
    setSessionNotice(notice);
    setShowLogin(false);
  }, []);

  /* ─── Validate stored token on mount ─────────────────────── */
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          handleLogout('Your session has expired. Please sign in again.');
        } else if (res.ok) {
          const data = await res.json();
          setUser(data);
          localStorage.setItem('user_info', JSON.stringify(data));
          // If admin, ensure on admin page
          if (data.is_staff || data.is_superuser || data.role === 'admin' || data.username === 'admin') {
            setCurrentPage((prev) => (prev === 'upload' ? 'admin' : prev));
          }
        }
      })
      .catch(() => {
        // Server unreachable — allow offline navigation
      });
  }, [token, handleLogout]);

  /* ─── Auth callbacks ─────────────────────────────────────── */
  const handleLoginSuccess = (accessToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    if (userData) {
      localStorage.setItem('user_info', JSON.stringify(userData));
    }
    setToken(accessToken);
    setUser(userData);
    setSessionNotice('');
    setShowLogin(false);
    // Route by role
    if (userData?.is_staff || userData?.is_superuser || userData?.role === 'admin' || userData?.username === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('upload');
    }
  };

  const handleUploadSuccess = (id) => {
    setArtworkId(id);
    setCurrentPage('results');
  };

  const handleViewResults = (id) => {
    setArtworkId(id);
    setCurrentPage('results');
  };

  /* ─── Guest flow ─────────────────────────────────────────── */
  // Not logged in → show Landing (+ optional Login overlay)
  if (!token) {
    if (showLogin) {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          sessionNotice={sessionNotice}
          defaultTab={loginDefaultTab}
          onBack={() => setShowLogin(false)}
        />
      );
    }
    return (
      <Landing
        onShowLogin={(tab) => {
          setLoginDefaultTab(tab || 'signin');
          setShowLogin(true);
        }}
      />
    );
  }

  /* ─── Authenticated layout ───────────────────────────────── */
  const navItems = [
    { id: 'upload',      label: 'Upload',       icon: <FiUploadCloud size={16} /> },
    { id: 'submissions', label: 'My Submissions', icon: <FiList size={16} />       },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: <FiShield size={16} /> }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="header">
        <div className="header-content">
          <div className="logo">
            <span>🎨</span> ArtGuard
          </div>

          {/* Nav tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className="btn"
                style={{
                  padding: '7px 14px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: currentPage === item.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: '#fff',
                  fontWeight: currentPage === item.id ? '700' : '500',
                  border: currentPage === item.id ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                  borderRadius: '8px',
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* User info + logout */}
          <div className="header-actions">
            {user && (
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiUser size={15} />
                <strong>{user.username}</strong>
                <span style={{
                  padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
                  backgroundColor: isAdmin ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                  color: isAdmin ? '#78350f' : '#fff',
                }}>
                  {isAdmin ? '🛡️ Admin' : (user.role === 'analyst' ? 'Analyst' : 'Collector')}
                </span>
              </span>
            )}
            <button className="btn btn-danger" onClick={() => handleLogout()}>
              <FiLogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Content ─────────────────────────────────────── */}
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
        {currentPage === 'upload' && (
          <Upload
            token={token}
            onUploadSuccess={handleUploadSuccess}
            onSessionExpired={() => handleLogout('Your session has expired. Please sign in again.')}
          />
        )}

        {currentPage === 'submissions' && (
          <Submissions
            token={token}
            onViewResults={handleViewResults}
            onGoUpload={() => setCurrentPage('upload')}
            onSessionExpired={() => handleLogout('Your session has expired. Please sign in again.')}
          />
        )}

        {currentPage === 'results' && (
          <Results
            token={token}
            artworkId={artworkId}
            onBackToUpload={() => setCurrentPage('upload')}
            onSessionExpired={() => handleLogout('Your session has expired. Please sign in again.')}
          />
        )}

        {currentPage === 'admin' && isAdmin && (
          <AdminDashboard
            token={token}
            onViewResults={handleViewResults}
            onSessionExpired={() => handleLogout('Your session has expired. Please sign in again.')}
          />
        )}

        {/* Fallback if non-admin tries to access admin */}
        {currentPage === 'admin' && !isAdmin && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '500px', margin: '40px auto' }}>
            <FiShield size={22} /> You don't have admin privileges.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;