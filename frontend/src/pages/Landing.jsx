import React from 'react';
import { FiShield, FiZap, FiBarChart2, FiEye, FiArrowRight, FiLogIn, FiUserPlus } from 'react-icons/fi';

const FEATURES = [
  {
    icon: <FiZap size={28} color="#6366f1" />,
    title: 'ResNet50 Deep Learning',
    desc: 'State-of-the-art neural network trained on ImageNet extracts 2048-dimensional feature vectors from every submitted artwork.',
  },
  {
    icon: <FiEye size={28} color="#10b981" />,
    title: 'Grad-CAM Explainability',
    desc: 'Interactive heatmaps highlight the exact brushstrokes and compositional regions that influenced the AI\'s authenticity verdict.',
  },
  {
    icon: <FiBarChart2 size={28} color="#f59e0b" />,
    title: 'Style Similarity Matching',
    desc: 'Cosine similarity against 9+ seeded reference artworks from van Gogh, da Vinci, Monet, Rembrandt, Picasso, and Vermeer.',
  },
  {
    icon: <FiShield size={28} color="#ef4444" />,
    title: 'Risk Factor Detection',
    desc: 'Automatically identifies stylistic deviations, unusual compositional patterns, and provenance inconsistencies.',
  },
];

const SAMPLE_RESULT = {
  title: 'Sample: Sunflowers (Demo)',
  artist: 'Vincent van Gogh',
  confidence: 87.4,
  isAuthentic: true,
  styleMatch: 82.1,
};

function Landing({ onShowLogin }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
        padding: '80px 20px 100px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '12px' }}>🎨</div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-1px' }}>
          ArtGuard
        </h1>
        <p style={{ fontSize: '20px', opacity: 0.9, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          AI-Powered Art Forgery Detection using ResNet50 deep learning and Grad-CAM explainability heatmaps.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => onShowLogin('signin')}
            style={{ padding: '14px 32px', fontSize: '16px', background: '#fff', color: '#4f46e5', fontWeight: '700' }}
          >
            <FiLogIn size={20} /> Sign In
          </button>
          <button
            className="btn"
            onClick={() => onShowLogin('register')}
            style={{ padding: '14px 32px', fontSize: '16px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)', fontWeight: '700' }}
          >
            <FiUserPlus size={20} /> Create Free Account
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container" style={{ padding: '60px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          How ArtGuard Works
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '16px' }}>
          Four-layer AI pipeline for comprehensive forgery detection
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '12px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Sample Result Preview */}
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Sample Analysis Result
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
          Here's what a completed analysis looks like — sign in to run your own.
        </p>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{
            border: `2px solid ${SAMPLE_RESULT.isAuthentic ? '#10b981' : '#ef4444'}`,
            background: SAMPLE_RESULT.isAuthentic
              ? 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)'
              : 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
          }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#4b5563', fontSize: '13px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
                DEMO — {SAMPLE_RESULT.title}
              </p>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                Claimed Artist: <strong>{SAMPLE_RESULT.artist}</strong>
              </p>
              <div style={{ fontSize: '56px', fontWeight: '800', color: '#059669', marginBottom: '4px' }}>
                {SAMPLE_RESULT.confidence}%
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#047857', marginBottom: '20px' }}>
                ✓ Likely Authentic
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Style Match</p>
                  <p style={{ fontWeight: '700', color: '#6366f1', fontSize: '18px' }}>{SAMPLE_RESULT.styleMatch}%</p>
                </div>
                <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>AI Model</p>
                  <p style={{ fontWeight: '700', color: '#4f46e5', fontSize: '14px' }}>ResNet50-GradCAM</p>
                </div>
                <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Risk Factors</p>
                  <p style={{ fontWeight: '700', color: '#10b981', fontSize: '14px' }}>None Detected</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '15px' }}>
              Ready to analyze your artwork?
            </p>
            <button
              className="btn btn-primary"
              onClick={() => onShowLogin('register')}
              style={{ padding: '14px 36px', fontSize: '16px' }}
            >
              Get Started for Free <FiArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Role Info Section */}
      <div style={{ background: '#1f2937', padding: '60px 20px', color: '#fff' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '800', marginBottom: '36px' }}>
            Access Levels
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {[
              { role: 'Guest', icon: '👤', color: '#9ca3af', features: ['View landing page', 'Browse app features', 'See sample results', 'Create an account'] },
              { role: 'Collector / Analyst', icon: '🔍', color: '#818cf8', features: ['Upload artworks', 'View AI analysis', 'Grad-CAM heatmaps', 'My Submissions history'] },
              { role: 'Administrator', icon: '🛡️', color: '#fbbf24', features: ['All user features', 'System dashboard', 'Manage all artworks', 'User management'] },
            ].map((r) => (
              <div key={r.role} style={{
                background: '#374151',
                padding: '24px',
                borderRadius: '12px',
                borderTop: `4px solid ${r.color}`,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{r.icon}</div>
                <h3 style={{ fontWeight: '700', fontSize: '18px', marginBottom: '12px', color: r.color }}>{r.role}</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {r.features.map((f) => (
                    <li key={f} style={{ color: '#d1d5db', fontSize: '14px', padding: '4px 0', borderBottom: '1px solid #4b5563' }}>
                      ✓ {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px', background: '#111827' }}>
        ArtGuard — AI-Powered Art Authentication System &nbsp;|&nbsp; Built with Django + React + ResNet50
      </div>
    </div>
  );
}

export default Landing;
