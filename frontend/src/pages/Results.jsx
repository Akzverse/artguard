import React, { useState, useEffect, useRef } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiArrowLeft, FiEye, FiLayers, FiImage, FiDownload, FiAward } from 'react-icons/fi';
import API_BASE_URL from '../config';

/**
 * Maps a normalized float (0.0 to 1.0) to an RGB color using the Jet/Turbo thermal colormap
 */
function getJetColor(val) {
  const clamped = Math.max(0, Math.min(1, val));
  let r = 0, g = 0, b = 0;

  if (clamped < 0.125) {
    r = 0;
    g = 0;
    b = 0.5 + 4 * clamped; // 0.5 to 1.0
  } else if (clamped < 0.375) {
    r = 0;
    g = 4 * (clamped - 0.125); // 0 to 1.0
    b = 1.0;
  } else if (clamped < 0.625) {
    r = 4 * (clamped - 0.375); // 0 to 1.0
    g = 1.0;
    b = 1.0 - 4 * (clamped - 0.375); // 1.0 to 0
  } else if (clamped < 0.875) {
    r = 1.0;
    g = 1.0 - 4 * (clamped - 0.625); // 1.0 to 0
    b = 0;
  } else {
    r = 1.0 - 2 * (clamped - 0.875); // 1.0 to 0.75
    g = 0;
    b = 0;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * HeatmapCanvas Component
 * Renders the uploaded artwork with an interactive Grad-CAM heatmap overlay.
 */
function HeatmapCanvas({ heatmapData, imageUrl }) {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('overlay'); // 'overlay', 'heatmap', 'original'
  const [opacity, setOpacity] = useState(0.55);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw original image if available
    if (imgRef.current && (mode === 'original' || mode === 'overlay')) {
      ctx.drawImage(imgRef.current, 0, 0, width, height);
    }

    // 2. Draw Grad-CAM heatmap if in overlay or heatmap-only mode
    if (heatmapData && heatmapData.length > 0 && (mode === 'heatmap' || mode === 'overlay')) {
      const rows = heatmapData.length;
      const cols = heatmapData[0].length;

      // Offscreen canvas for bilinear smoothing
      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext('2d');
      const imgData = offCtx.createImageData(cols, rows);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = heatmapData[r][c];
          const [red, green, blue] = getJetColor(val);
          const idx = (r * cols + c) * 4;
          imgData.data[idx] = red;
          imgData.data[idx + 1] = green;
          imgData.data[idx + 2] = blue;
          imgData.data[idx + 3] = 255;
        }
      }
      offCtx.putImageData(imgData, 0, 0);

      // Save state and apply opacity
      ctx.save();
      if (mode === 'overlay') {
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalAlpha = 1.0;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreen, 0, 0, width, height);
      ctx.restore();
    }
  }, [heatmapData, mode, opacity, imageLoaded]);

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Canvas Viewport */}
      <div style={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundColor: '#1f2937',
        maxWidth: '100%',
      }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          style={{ width: '100%', maxWidth: '480px', height: 'auto', display: 'block' }}
        />
      </div>

      {/* Control Toolbar */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: 0,
              backgroundColor: mode === 'overlay' ? 'var(--primary)' : '#fff',
              color: mode === 'overlay' ? '#fff' : '#4b5563',
            }}
            onClick={() => setMode('overlay')}
          >
            <FiLayers size={14} /> Overlay
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: 0,
              backgroundColor: mode === 'heatmap' ? 'var(--primary)' : '#fff',
              color: mode === 'heatmap' ? '#fff' : '#4b5563',
            }}
            onClick={() => setMode('heatmap')}
          >
            <FiEye size={14} /> Heatmap Only
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              borderRadius: 0,
              backgroundColor: mode === 'original' ? 'var(--primary)' : '#fff',
              color: mode === 'original' ? '#fff' : '#4b5563',
            }}
            onClick={() => setMode('original')}
          >
            <FiImage size={14} /> Artwork Only
          </button>
        </div>

        {mode === 'overlay' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4b5563' }}>
            <span>Heatmap Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: '100px', cursor: 'pointer' }}
            />
            <span style={{ minWidth: '32px' }}>{Math.round(opacity * 100)}%</span>
          </div>
        )}
      </div>

      {/* Heatmap Colormap Legend */}
      <div style={{
        marginTop: '16px',
        maxWidth: '480px',
        margin: '16px auto 0',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{
          height: '12px',
          borderRadius: '6px',
          background: 'linear-gradient(to right, rgb(0,0,128), rgb(0,255,255), rgb(0,255,0), rgb(255,255,0), rgb(255,0,0))',
          marginBottom: '6px',
        }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
          <span>Low AI Attention (Neutral)</span>
          <span style={{ fontWeight: '600', color: '#1f2937' }}>Grad-CAM Visual Attention</span>
          <span>High AI Attention (Key Region)</span>
        </div>
      </div>
    </div>
  );
}

function Results({ token, artworkId, onBackToUpload, onSessionExpired }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadReport = async () => {
    if (!artworkId) return;
    try {
      setDownloadingPdf(true);
      const response = await fetch(
        `${API_BASE_URL}/api/artworks/${artworkId}/report/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate report from server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (data?.artwork?.title || 'Artwork').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `ArtGuard_Report_${cleanTitle}_${artworkId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Report download error: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/artworks/${artworkId}/results/`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setData(result);
        } else if (response.status === 401 && onSessionExpired) {
          onSessionExpired();
        } else {
          setError(result.error || 'Failed to load results');
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (artworkId) {
      fetchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId, token]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 24px' }}></div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Analyzing Artwork with ResNet50...</h2>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Extracting deep feature vectors and generating Grad-CAM explainability heatmaps...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '700px', margin: '40px auto' }}>
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FiAlertCircle size={28} />
          <div>
            <strong style={{ fontSize: '16px' }}>Analysis Error</strong>
            <p style={{ marginTop: '4px' }}>{error}</p>
          </div>
        </div>
        {onBackToUpload && (
          <button className="btn btn-secondary" onClick={onBackToUpload} style={{ marginTop: '16px' }}>
            <FiArrowLeft size={18} /> Back to Upload
          </button>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>No results found for this artwork.</p>
        {onBackToUpload && (
          <button className="btn btn-secondary" onClick={onBackToUpload} style={{ marginTop: '16px' }}>
            <FiArrowLeft size={18} /> Back to Upload
          </button>
        )}
      </div>
    );
  }

  const { artwork, analysis } = data;
  const confidencePercent = (analysis.confidence_score * 100).toFixed(1);
  const isAuthentic = analysis.is_likely_authentic;
  const imageUrl = artwork.original_image.startsWith('http')
    ? artwork.original_image
    : `${API_BASE_URL}${artwork.original_image}`;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>{artwork.title}</h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Claimed Artist: <strong>{artwork.claimed_artist}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            onClick={handleDownloadReport}
            disabled={downloadingPdf}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {downloadingPdf ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#fff' }}></span>
                Generating PDF...
              </>
            ) : (
              <>
                <FiDownload size={17} /> Download PDF Report
              </>
            )}
          </button>
          {onBackToUpload && (
            <button className="btn btn-secondary" onClick={onBackToUpload}>
              <FiArrowLeft size={18} /> Analyze Another Artwork
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Heatmap & Authenticity Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)', gap: '24px', marginBottom: '24px' }}>
        {/* Left: Interactive Grad-CAM Heatmap Canvas */}
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiEye size={20} color="var(--primary)" />
            AI Attention Map (Grad-CAM)
          </h2>
          <HeatmapCanvas heatmapData={analysis.heatmap_data} imageUrl={imageUrl} />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', textAlign: 'center', lineHeight: '1.4' }}>
            Grad-CAM highlights the exact spatial brushstrokes and compositional regions that influenced the ResNet50 neural network's decision.
          </p>
        </div>

        {/* Right: Scores & Verdict */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Confidence Score Card */}
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '32px 24px',
              background: isAuthentic
                ? 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)'
                : 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
              border: `2px solid ${isAuthentic ? '#10b981' : '#ef4444'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              {isAuthentic ? (
                <FiCheckCircle size={52} color="#10b981" />
              ) : (
                <FiAlertCircle size={52} color="#ef4444" />
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
              Authenticity Score
            </div>
            <div style={{
              fontSize: '52px',
              fontWeight: '800',
              color: isAuthentic ? '#059669' : '#dc2626',
              marginBottom: '6px',
            }}>
              {confidencePercent}%
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: isAuthentic ? '#047857' : '#b91c1c',
            }}>
              {isAuthentic ? '✓ Likely Authentic' : '✗ Potential Forgery Detected'}
            </div>
          </div>

          {/* Style Match Score Card */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiClock size={18} color="var(--primary)" />
              Style Consistency Match
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: '8px', height: '20px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, analysis.style_match_score * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
                  transition: 'width 0.4s ease',
                }}></div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1', minWidth: '60px', textAlign: 'right' }}>
                {(analysis.style_match_score * 100).toFixed(1)}%
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '10px' }}>
              Cosine similarity against authentic catalogued works by <strong>{artwork.claimed_artist}</strong>.
            </p>
          </div>

          {/* Risk Factors Detected */}
          {analysis.risk_factors && Object.keys(analysis.risk_factors).length > 0 ? (
            <div className="card" style={{ backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e' }}>
                <FiAlertCircle size={20} color="#f59e0b" />
                Risk Factors Detected
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Object.entries(analysis.risk_factors).map(([key, value]) => (
                  <li
                    key={key}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      fontSize: '13px',
                      color: '#78350f',
                    }}
                  >
                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontSize: '14px' }}>
                <FiCheckCircle size={20} color="#10b981" />
                <span>No anomalous stylistic or brushstroke deviations detected.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Museum Reference Comparisons (DFD Level 2: Top 3 Matches & Swimlane Comparisons) */}
      {analysis.top_matches && analysis.top_matches.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAward size={20} color="var(--primary)" />
              Museum Catalog Reference Comparisons
            </h3>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Top {analysis.top_matches.length} Closest Catalog Artworks
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {analysis.top_matches.map((match, idx) => {
              const simPct = (match.similarity_percent || match.similarity_score * 100).toFixed(1);
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '16px',
                    backgroundColor: idx === 0 ? '#f8fafc' : '#fff',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: idx === 0 ? '#4f46e5' : '#64748b',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      Rank #{idx + 1}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#4f46e5' }}>
                      {simPct}% Match
                    </span>
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: '#1f2937' }}>
                    {match.artist_name}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                    <strong>Period:</strong> {match.period}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    <strong>Museum Source:</strong> {match.source}
                  </p>
                  {match.style && (
                    <p style={{ fontSize: '11px', color: '#4b5563', backgroundColor: '#f1f5f9', padding: '6px 8px', borderRadius: '6px' }}>
                      {match.style}
                    </p>
                  )}
                  {/* Similarity Progress Bar */}
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, simPct))}%`,
                        height: '100%',
                        backgroundColor: idx === 0 ? '#4f46e5' : '#0ea5e9',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Artwork Metadata & Details */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Artwork Metadata</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '2px' }}>Claimed Artist</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{artwork.claimed_artist}</p>
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '2px' }}>Historical Period / Era</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{artwork.period}</p>
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '2px' }}>AI Neural Model</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>{analysis.model_version}</p>
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '2px' }}>Analysis Timestamp</p>
            <p style={{ fontSize: '16px', fontWeight: '600' }}>{new Date(analysis.analysis_timestamp).toLocaleString()}</p>
          </div>
        </div>
        {artwork.description && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Provenance & History</p>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>{artwork.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;