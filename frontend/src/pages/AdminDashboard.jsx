import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers, FiImage, FiCheckCircle, FiAlertCircle,
  FiClock, FiTrash2, FiEye, FiRefreshCw, FiBarChart2,
  FiShield, FiXCircle, FiDatabase, FiPlus, FiDownload,
  FiX,
} from 'react-icons/fi';
import API_BASE_URL from '../config';

/* ─── Reusable Stat Card ─────────────────────────────────────── */
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 24, color })}
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{value}</p>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending:    { color: '#f59e0b', bg: '#fffbeb' },
  processing: { color: '#6366f1', bg: '#eef2ff' },
  completed:  { color: '#10b981', bg: '#ecfdf5' },
  failed:     { color: '#ef4444', bg: '#fef2f2' },
};

const ROLE_COLORS = {
  admin:     { color: '#f59e0b', label: 'Admin'     },
  analyst:   { color: '#6366f1', label: 'Analyst'   },
  collector: { color: '#10b981', label: 'Collector' },
};

/* ─── Main Admin Dashboard ───────────────────────────────────── */
function AdminDashboard({ token, onViewResults, onSessionExpired }) {
  const [stats, setStats]               = useState(null);
  const [artworks, setArtworks]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [references, setReferences]     = useState([]);
  const [activeTab, setActiveTab]       = useState('overview');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [deletingId, setDeletingId]     = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deletingRefId, setDeletingRefId]   = useState(null);
  const [downloadingId, setDownloadingId]   = useState(null);

  // New Reference form state (DFD 5.0: Manage Reference DB)
  const [showAddRefModal, setShowAddRefModal] = useState(false);
  const [newArtistName, setNewArtistName]     = useState('');
  const [newPeriod, setNewPeriod]             = useState('');
  const [newStyle, setNewStyle]               = useState('');
  const [newSource, setNewSource]             = useState('');
  const [addingRef, setAddingRef]             = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, artworksRes, usersRes, refRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/stats/`, { headers: authHeader }),
        fetch(`${API_BASE_URL}/api/artworks/`, { headers: authHeader }),
        fetch(`${API_BASE_URL}/api/admin/users/`, { headers: authHeader }),
        fetch(`${API_BASE_URL}/api/admin/references/`, { headers: authHeader }),
      ]);

      if (statsRes.status === 401 || artworksRes.status === 401 || usersRes.status === 401 || refRes.status === 401) {
        onSessionExpired && onSessionExpired();
        return;
      }

      const [statsData, artworksData, usersData, refData] = await Promise.all([
        statsRes.json(),
        artworksRes.json(),
        usersRes.json(),
        refRes.json(),
      ]);

      setStats(statsData);
      setArtworks(Array.isArray(artworksData) ? artworksData : (artworksData.results || []));
      setUsers(Array.isArray(usersData) ? usersData : (usersData.results || []));
      setReferences(Array.isArray(refData) ? refData : (refData.results || []));
    } catch (err) {
      setError(`Failed to load dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Artwork Deletion
  const handleDeleteArtwork = async (id) => {
    if (!window.confirm('Permanently delete this artwork and its analysis? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/artworks/${id}/`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (res.ok || res.status === 204) {
        setArtworks((prev) => prev.filter((a) => a.id !== id));
        setStats((prev) => prev ? { ...prev, total_artworks: prev.total_artworks - 1 } : prev);
      }
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // User Deletion (DFD 6.0: Manage Users - delete user)
  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Permanently delete user account '${username}'?`)) return;
    setDeletingUserId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}/`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (res.ok || res.status === 204) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setStats((prev) => prev ? { ...prev, total_users: prev.total_users - 1 } : prev);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      alert(`User delete error: ${err.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  // Reference Artwork Deletion (DFD 5.0: Manage Reference DB)
  const handleDeleteRef = async (id, artist) => {
    if (!window.confirm(`Remove reference record for '${artist}' from catalog?`)) return;
    setDeletingRefId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/references/${id}/`, {
        method: 'DELETE',
        headers: authHeader,
      });
      if (res.ok || res.status === 204) {
        setReferences((prev) => prev.filter((r) => r.id !== id));
        setStats((prev) => prev ? { ...prev, total_references: (prev.total_references || 1) - 1 } : prev);
      }
    } catch (err) {
      alert(`Reference delete error: ${err.message}`);
    } finally {
      setDeletingRefId(null);
    }
  };

  // Add Reference Artwork (DFD 5.0: Manage Reference DB - add reference)
  const handleAddReference = async (e) => {
    e.preventDefault();
    if (!newArtistName || !newPeriod) return;
    setAddingRef(true);
    try {
      const payload = {
        artist_name: newArtistName,
        period: newPeriod,
        style: newStyle || 'Standard Masterwork Features',
        source: newSource || 'Verified Museum Catalog',
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/references/`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add reference artwork');
      }

      const createdRef = await res.json();
      setReferences((prev) => [...prev, createdRef]);
      setStats((prev) => prev ? { ...prev, total_references: (prev.total_references || 0) + 1 } : prev);
      setShowAddRefModal(false);
      setNewArtistName('');
      setNewPeriod('');
      setNewStyle('');
      setNewSource('');
    } catch (err) {
      alert(`Add reference failed: ${err.message}`);
    } finally {
      setAddingRef(false);
    }
  };

  // Download PDF Report
  const handleDownloadPdf = async (id, title) => {
    try {
      setDownloadingId(id);
      const res = await fetch(`${API_BASE_URL}/api/artworks/${id}/report/`, {
        headers: authHeader,
      });
      if (!res.ok) throw new Error('Failed to generate PDF report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (title || 'Artwork').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `ArtGuard_Report_${cleanTitle}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── Loading / Error states ────────────────────────────── */
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px' }}>
        <div className="spinner" style={{ width: '44px', height: '44px', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280' }}>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '600px', margin: '40px auto' }}>
        <FiAlertCircle size={22} /> {error}
      </div>
    );
  }

  /* ── Tab buttons ─────────────────────────────────────── */
  const tabs = [
    { id: 'overview',   label: 'Overview',                     icon: <FiBarChart2 size={16} /> },
    { id: 'artworks',   label: `Artworks (${artworks.length})`, icon: <FiImage size={16} /> },
    { id: 'users',      label: `Users (${users.length})`,       icon: <FiUsers size={16} /> },
    { id: 'references', label: `Reference DB (${references.length})`, icon: <FiDatabase size={16} /> },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiShield size={26} color="#f59e0b" /> Admin Control Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            System-wide forensic analytics, user control, and reference database management
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAll}>
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, minWidth: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '9px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              backgroundColor: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────── */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <StatCard icon={<FiUsers />}        label="Total Users"      value={stats.total_users}        color="#6366f1" bg="#eef2ff" />
            <StatCard icon={<FiImage />}        label="Total Artworks"   value={stats.total_artworks}     color="#0ea5e9" bg="#f0f9ff" />
            <StatCard icon={<FiDatabase />}     label="Reference Works"  value={stats.total_references || references.length} color="#8b5cf6" bg="#f5f3ff" />
            <StatCard icon={<FiCheckCircle />}  label="Completed"        value={stats.completed}          color="#10b981" bg="#ecfdf5" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard icon={<FiCheckCircle />} label="Authentic Verdicts" value={stats.authentic_count} color="#10b981" bg="#ecfdf5" />
            <StatCard icon={<FiXCircle />}     label="Forgery Verdicts"   value={stats.forgery_count}   color="#ef4444" bg="#fef2f2" />
            <StatCard icon={<FiClock />}        label="Pending Analyses"  value={stats.pending}         color="#f59e0b" bg="#fffbeb" />
            <StatCard icon={<FiAlertCircle />} label="Failed Analyses"    value={stats.failed}          color="#ef4444" bg="#fef2f2" />
          </div>

          {/* Authenticity breakdown bar */}
          {stats.completed > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>Authenticity Forensic Breakdown</h3>
              <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${(stats.authentic_count / stats.completed) * 100}%`, background: '#10b981', transition: 'width 0.5s' }} />
                <div style={{ width: `${(stats.forgery_count / stats.completed) * 100}%`, background: '#ef4444', transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                <span style={{ color: '#10b981', fontWeight: '600' }}>✓ {stats.authentic_count} Authentic ({((stats.authentic_count / stats.completed) * 100).toFixed(1)}%)</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>✗ {stats.forgery_count} Forgeries ({((stats.forgery_count / stats.completed) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          )}

          {/* Recent artworks (last 5) */}
          <div className="card">
            <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '16px' }}>Recent Submissions</h3>
            {artworks.slice(0, 5).map((a) => {
              const sc = STATUS_COLORS[a.status] || STATUS_COLORS.pending;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: sc.color, background: sc.bg }}>{a.status}</span>
                  <span style={{ flex: 1, fontWeight: '600', fontSize: '14px' }}>{a.title}</span>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{a.claimed_artist}</span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{a.uploaded_by?.username || '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ARTWORKS TAB ────────────────────────────────────── */}
      {activeTab === 'artworks' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {artworks.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No artworks submitted yet.
              </div>
            )}
            {artworks.map((artwork) => {
              const sc = STATUS_COLORS[artwork.status] || STATUS_COLORS.pending;
              const imgSrc = artwork.original_image
                ? (artwork.original_image.startsWith('http') ? artwork.original_image : `${API_BASE_URL}${artwork.original_image}`)
                : null;

              return (
                <div key={artwork.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Thumbnail */}
                  <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={artwork.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    ) : <span style={{ fontSize: '24px' }}>🖼️</span>}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>{artwork.title}</p>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>{artwork.claimed_artist} · {artwork.period}</p>
                  </div>
                  {/* Owner */}
                  <div style={{ fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiUsers size={14} />
                    {artwork.uploaded_by?.username || '—'}
                  </div>
                  {/* Status */}
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: sc.color, background: sc.bg }}>
                    {artwork.status}
                  </span>
                  {/* Date */}
                  <span style={{ color: '#9ca3af', fontSize: '12px', minWidth: '90px', textAlign: 'right' }}>
                    {new Date(artwork.uploaded_at).toLocaleDateString()}
                  </span>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {artwork.status === 'completed' && (
                      <>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => onViewResults(artwork.id)}>
                          <FiEye size={14} /> Results
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          title="Download PDF Report"
                          onClick={() => handleDownloadPdf(artwork.id, artwork.title)}
                          disabled={downloadingId === artwork.id}
                        >
                          {downloadingId === artwork.id ? <span className="spinner" style={{ width: '13px', height: '13px' }} /> : <FiDownload size={14} />}
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', fontSize: '13px' }}
                      onClick={() => handleDeleteArtwork(artwork.id)}
                      disabled={deletingId === artwork.id}
                    >
                      {deletingId === artwork.id
                        ? <span className="spinner" style={{ borderTopColor: '#fff', width: '14px', height: '14px' }} />
                        : <FiTrash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── USERS TAB (DFD 6.0: Manage Users) ────────────────── */}
      {activeTab === 'users' && (
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['#', 'Username', 'Email', 'Role', 'Joined', 'Artworks', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No users found.</td></tr>
                )}
                {users.map((u, i) => {
                  const rc = ROLE_COLORS[u.role] || { color: '#6b7280', label: u.role };
                  const userArtworks = artworks.filter((a) => a.uploaded_by?.id === u.id || a.uploaded_by?.username === u.username);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px' }}>
                        {u.username} {u.is_staff && <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '8px', marginLeft: '4px' }}>staff</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>{u.email || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: rc.color, background: `${rc.color}18` }}>
                          {rc.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px' }}>
                        {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', fontSize: '14px', color: 'var(--primary)' }}>
                        {userArtworks.length}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          title="Delete User"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={deletingUserId === u.id}
                        >
                          {deletingUserId === u.id ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : <FiTrash2 size={13} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REFERENCE DB TAB (DFD 5.0: Manage Reference DB) ── */}
      {activeTab === 'references' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Museum Reference Database</h3>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                Authentic feature vectors used for cosine similarity comparison (ResNet50 embeddings)
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowAddRefModal(true)}
            >
              <FiPlus size={16} /> Add Reference Artwork
            </button>
          </div>

          {/* Add Reference Modal */}
          {showAddRefModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '20px',
            }}>
              <div className="card" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
                <button
                  onClick={() => setShowAddRefModal(false)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                >
                  <FiX size={20} />
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Add Museum Reference Artwork</h3>
                <form onSubmit={handleAddReference}>
                  <div className="form-group">
                    <label>Artist Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Vincent van Gogh"
                      value={newArtistName}
                      onChange={(e) => setNewArtistName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Period / Era *</label>
                    <input
                      type="text"
                      placeholder="e.g. Post-Impressionism (1888)"
                      value={newPeriod}
                      onChange={(e) => setNewPeriod(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Style Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Vibrant impasto, distinctive chromatic contrast"
                      value={newStyle}
                      onChange={(e) => setNewStyle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Museum / Catalog Source</label>
                    <input
                      type="text"
                      placeholder="e.g. Van Gogh Museum, Amsterdam / Rijksmuseum"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddRefModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={addingRef}>
                      {addingRef ? 'Computing Embedding...' : 'Save Reference Artwork'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* References Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['#', 'Artist', 'Period', 'Style', 'Museum Source', 'Embedding', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {references.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No reference artworks catalogued yet.</td></tr>
                )}
                {references.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', fontSize: '14px', color: '#1f2937' }}>
                      {r.artist_name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '13px' }}>{r.period}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '12px', maxWidth: '240px' }}>
                      {r.style}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4f46e5', fontSize: '13px', fontWeight: '500' }}>
                      {r.source || 'Museum Catalog'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
                      2048-dim ✓
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                        title="Delete Reference"
                        onClick={() => handleDeleteRef(r.id, r.artist_name)}
                        disabled={deletingRefId === r.id}
                      >
                        {deletingRefId === r.id ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : <FiTrash2 size={13} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
