import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiLoader, FiTrash2, FiEye, FiUploadCloud, FiRefreshCw, FiDownload } from 'react-icons/fi';
import API_BASE_URL from '../config';

const STATUS_CONFIG = {
  pending:    { icon: <FiClock size={16} />,        color: '#f59e0b', bg: '#fffbeb', label: 'Pending'    },
  processing: { icon: <FiLoader size={16} />,       color: '#6366f1', bg: '#eef2ff', label: 'Processing' },
  completed:  { icon: <FiCheckCircle size={16} />,  color: '#10b981', bg: '#ecfdf5', label: 'Completed'  },
  failed:     { icon: <FiAlertCircle size={16} />,  color: '#ef4444', bg: '#fef2f2', label: 'Failed'     },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      color: cfg.color, backgroundColor: cfg.bg,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Submissions({ token, onViewResults, onSessionExpired, onGoUpload }) {
  const [artworks, setArtworks] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadPdf = async (id, title) => {
    try {
      setDownloadingId(id);
      const res = await fetch(`${API_BASE_URL}/api/artworks/${id}/report/`, {
        headers: { Authorization: `Bearer ${token}` },
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchArtworks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/artworks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onSessionExpired && onSessionExpired(); return; }
      const data = await res.json();
      setArtworks(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this artwork submission? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/artworks/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onSessionExpired && onSessionExpired(); return; }
      if (res.ok || res.status === 204) {
        setArtworks((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280' }}>Loading your submissions...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            My Submissions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {artworks.length} artwork{artworks.length !== 1 ? 's' : ''} submitted for analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchArtworks}>
            <FiRefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={onGoUpload}>
            <FiUploadCloud size={16} /> New Artwork
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FiAlertCircle size={20} /> {error}
        </div>
      )}

      {artworks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🖼️</div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>No submissions yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Upload your first artwork to get started with AI-powered authenticity analysis.
          </p>
          <button className="btn btn-primary" onClick={onGoUpload} style={{ padding: '12px 28px' }}>
            <FiUploadCloud size={18} /> Upload Your First Artwork
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="card"
              style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden',
                flexShrink: 0, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {artwork.original_image ? (
                  <img
                    src={artwork.original_image.startsWith('http') ? artwork.original_image : `${API_BASE_URL}${artwork.original_image}`}
                    alt={artwork.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '28px' }}>🖼️</span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {artwork.title}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '6px' }}>
                  {artwork.claimed_artist} &nbsp;·&nbsp; {artwork.period}
                </p>
                <StatusBadge status={artwork.status} />
              </div>

              {/* Date */}
              <div style={{ fontSize: '13px', color: '#9ca3af', minWidth: '100px', textAlign: 'right' }}>
                {new Date(artwork.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {artwork.status === 'completed' && (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '7px 14px', fontSize: '13px' }}
                      onClick={() => onViewResults(artwork.id)}
                    >
                      <FiEye size={15} /> View Results
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '13px' }}
                      title="Download PDF Report"
                      onClick={() => handleDownloadPdf(artwork.id, artwork.title)}
                      disabled={downloadingId === artwork.id}
                    >
                      {downloadingId === artwork.id ? (
                        <span className="spinner" style={{ width: '13px', height: '13px' }} />
                      ) : (
                        <>
                          <FiDownload size={14} /> Report
                        </>
                      )}
                    </button>
                  </>
                )}
                {(artwork.status === 'pending' || artwork.status === 'failed') && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '7px 14px', fontSize: '13px' }}
                    onClick={() => onViewResults(artwork.id)}
                  >
                    <FiEye size={15} /> Analyze Now
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  style={{ padding: '7px 12px', fontSize: '13px' }}
                  onClick={() => handleDelete(artwork.id)}
                  disabled={deletingId === artwork.id}
                >
                  {deletingId === artwork.id
                    ? <span className="spinner" style={{ borderTopColor: '#fff', width: '14px', height: '14px' }} />
                    : <FiTrash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Submissions;
