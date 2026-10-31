import React from 'react';
import { getTranslation } from '../utils/i18n';

/**
 * MATCHDAY IQ - Video Demo / Walkthrough Page
 * Shows a silent screen-recording that walks through every UI tab.
 * Video file lives in public/matchday iq demo.mp4 and is served by Vite as a static asset.
 */
export default function VideoDemo({ language = 'en' }) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="fade-in video-demo-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">HOW MATCHDAY IQ WORKS</div>
          <div className="section-subtitle">
            A silent walkthrough of every feature - watch, learn, explore.
          </div>
        </div>
      </div>

      {/* Video Card */}
      <div className="card card-elevated video-demo-card">
        <div className="card-header">
          <span className="card-title">Product Demo</span>
          <span className="card-badge" style={{
            background: 'var(--accent-lime)',
            color: '#000',
            fontWeight: 700,
            fontSize: '0.7rem',
            padding: '2px 10px',
            borderRadius: '4px',
          }}>
            VIDEO
          </span>
        </div>

        <div className="video-player-wrap">
          <video
            controls
            width="100%"
            playsInline
            preload="metadata"
            poster=""
            style={{
              borderRadius: 'var(--radius-md)',
              background: '#000',
              display: 'block',
            }}
          >
            <source src="/matchday iq demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Feature Quick-Reference */}
        <div className="video-features-grid">
          <div className="video-feature-chip">
            <span className="vf-num">01</span>
            <div>
              <strong>Match Centre</strong>
              <p>Live scorecard, innings breakdown, and team line-ups at a glance.</p>
            </div>
          </div>
          <div className="video-feature-chip">
            <span className="vf-num">02</span>
            <div>
              <strong>Fan Dugout</strong>
              <p>Predict the next over, run what-if simulations, and earn Cricket IQ points.</p>
            </div>
          </div>
          <div className="video-feature-chip">
            <span className="vf-num">03</span>
            <div>
              <strong>Decode &amp; Captain's Call</strong>
              <p>Ask tactical questions - powered by SHAP explainability and ML win-probability.</p>
            </div>
          </div>
          <div className="video-feature-chip">
            <span className="vf-num">04</span>
            <div>
              <strong>AI Report</strong>
              <p>One-click executive intelligence dossier - quick take or deep-dive mode.</p>
            </div>
          </div>
        </div>

        <p style={{
          marginTop: 16,
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          No narration - just a silent screen-capture so you can focus on the interface.
          Select any tab above to jump straight into a feature.
        </p>
      </div>
    </div>
  );
}

