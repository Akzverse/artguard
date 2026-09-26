import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';
import API_BASE_URL from '../config';

const PRESET_ARTISTS = [
  { name: 'Vincent van Gogh', period: 'Post-Impressionism (1888-1890)' },
  { name: 'Leonardo da Vinci', period: 'High Renaissance (1503-1519)' },
  { name: 'Claude Monet', period: 'Impressionism (1872-1899)' },
  { name: 'Rembrandt van Rijn', period: 'Dutch Golden Age (1642)' },
  { name: 'Pablo Picasso', period: 'Cubism (1907-1937)' },
  { name: 'Johannes Vermeer', period: 'Dutch Golden Age (1665)' },
];

function Upload({ token, onUploadSuccess, onSessionExpired }) {
  const [title, setTitle] = useState('');
  const [claimed_artist, setClaimedArtist] = useState('');
  const [period, setPeriod] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG and PNG image files are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Artwork file size must be less than 10MB.');
      return;
    }

    setError('');
    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const clearSelectedImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (artist) => {
    setClaimedArtist(artist.name);
    setPeriod(artist.period);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError('Please select an artwork image file.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('claimed_artist', claimed_artist);
      formData.append('period', period);
      formData.append('description', description);
      formData.append('original_image', image);

      const response = await fetch(`${API_BASE_URL}/api/artworks/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        onUploadSuccess(data.id);
      } else if (response.status === 401 || data.code === 'token_not_valid') {
        if (onSessionExpired) {
          onSessionExpired();
        } else {
          setError('Your login session has expired. Please sign in again.');
        }
      } else {
        let errorMsg = data.error || data.detail;
        if (!errorMsg && typeof data === 'object') {
          errorMsg = Object.entries(data)
            .map(([field, errs]) => `${field.replace('_', ' ')}: ${Array.isArray(errs) ? errs.join(' ') : errs}`)
            .join(' | ');
        }
        if (!errorMsg) errorMsg = 'Upload failed. Please check submitted data.';
        setError(errorMsg);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Submit Artwork for Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Our neural network (ResNet50) extracts structural deep features and generates Grad-CAM heatmaps to detect forgery anomalies.
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiAlertCircle size={22} />
              <span>{error}</span>
            </div>
            {onSessionExpired && (error.toLowerCase().includes('token') || error.toLowerCase().includes('session')) && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
                onClick={onSessionExpired}
              >
                Sign In Again
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Artwork Title */}
          <div className="form-group">
            <label>Artwork Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Starry Night"
              required
              disabled={loading}
            />
          </div>

          {/* Quick Artist Presets */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Quick Select Known Artist
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {PRESET_ARTISTS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    backgroundColor: claimed_artist === preset.name ? '#e0e7ff' : '#f3f4f6',
                    color: claimed_artist === preset.name ? 'var(--primary-dark)' : 'var(--text-primary)',
                    fontWeight: claimed_artist === preset.name ? '600' : '500',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid: Claimed Artist & Period */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label>Claimed Artist *</label>
              <input
                type="text"
                value={claimed_artist}
                onChange={(e) => setClaimedArtist(e.target.value)}
                placeholder="e.g. Vincent van Gogh"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Period / Era *</label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. Post-Impressionism (1889)"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Provenance & Description */}
          <div className="form-group">
            <label>Provenance & Artwork Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include known provenance, medium (oil on canvas, tempera), acquisition history..."
              disabled={loading}
            />
          </div>

          {/* File Upload Drop Zone */}
          <div className="form-group">
            <label>Artwork Image File (JPG / PNG, max 10MB) *</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: `2px dashed ${isDragOver ? 'var(--primary)' : '#d1d5db'}`,
                backgroundColor: isDragOver ? '#eef2ff' : '#f9fafb',
                borderRadius: '12px',
                padding: '32px 20px',
                textAlign: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <FiUploadCloud size={44} color={isDragOver ? 'var(--primary)' : '#9ca3af'} />
              <p style={{ marginTop: '12px', fontSize: '15px', fontWeight: '600', color: '#374151' }}>
                Drag and drop your artwork image here, or <span style={{ color: 'var(--primary)' }}>browse</span>
              </p>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                Supports high-resolution JPG or PNG (up to 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Selected File & Preview */}
          {preview && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={preview}
                  alt="Artwork preview"
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{image.name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{(image.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelectedImage}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FiX size={20} />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !image}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#fff' }}></span>
                Uploading & Analyzing with ResNet50...
              </>
            ) : (
              <>
                <FiCheck size={20} />
                Upload & Begin Authenticity Verification
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;