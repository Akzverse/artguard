import React, { useState } from 'react';
import { FiLogIn, FiUserPlus, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import API_BASE_URL from '../config';

function Login({ onLoginSuccess, sessionNotice, defaultTab = 'signin', onBack }) {
  const [isRegister, setIsRegister] = useState(defaultTab === 'register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('collector');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister
        ? `${API_BASE_URL}/api/auth/register/`
        : `${API_BASE_URL}/api/auth/login/`;

      const payload = isRegister
        ? { username, email, password, role, bio }
        : { username, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.access) {
        onLoginSuccess(data.access, data.user || null);
      } else {
        const errorMsg = data.error || (data.detail ? data.detail : (data.username ? `Username: ${data.username}` : 'Authentication failed'));
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', borderRadius: '16px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '16px', padding: '4px 0' }}
          >
            <FiArrowLeft size={16} /> Back to Home
          </button>
        )}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎨</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            ArtGuard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            AI-Powered Art Forgery Detection System
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#f3f4f6',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: !isRegister ? '#fff' : 'transparent',
              color: !isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: isRegister ? '#fff' : 'transparent',
              color: isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {sessionNotice && (
          <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FiAlertCircle size={20} />
            <span>{sessionNotice}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. curator_art"
              required
              disabled={loading}
            />
          </div>

          {isRegister && (
            <>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. curator@museum.org"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="collector">Collector</option>
                  <option value="analyst">Art Analyst</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bio (Optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Specialization, institution, or collection focus..."
                  style={{ minHeight: '60px' }}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Minimum 8 characters' : 'Enter your password'}
              required
              minLength={isRegister ? 8 : undefined}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#fff' }}></span>
                {isRegister ? 'Creating Account...' : 'Logging in...'}
              </>
            ) : isRegister ? (
              <>
                <FiUserPlus size={18} />
                Register & Sign In
              </>
            ) : (
              <>
                <FiLogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '14px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#0369a1',
          borderLeft: '4px solid #0ea5e9',
        }}>
          <strong>Default Demo Credentials:</strong>
          <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>
            Username: <strong>admin</strong> | Password: <strong>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;