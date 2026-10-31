import React, { useState } from 'react';
import { fetchMatchmate } from '../api';
import { formatMarkdown } from '../utils/markdown';
import { getTranslation } from '../utils/i18n';

export default function Matchmate({ context, language = 'en' }) {
  const t = (k) => getTranslation(language, k);

  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readingMode, setReadingMode] = useState('quick'); // 'quick' | 'deep'

  const situation = context?.features?.currentSituation || {};
  const winProb = context?.winProbability || {};
  const battingWin = Math.round((winProb.battingTeamWin || 0.45) * 100);

  const handleCatchUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMatchmate({ ...context, language });
      setRecap(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">Matchmate — Catch Me Up</div>
          <div className="section-subtitle">Get up to speed in seconds with tactical match briefing</div>
        </div>
      </div>

      <div className="card card-elevated" style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Just tuned in? Matchmate generates an immediate, context-rich briefing of the current match situation — 
          what happened, what changed, and what to watch next.
        </p>

        <button
          className="btn btn-primary"
          onClick={handleCatchUp}
          disabled={loading}
          id="catchup-btn"
        >
          {loading ? '⏳ Generating Briefing...' : 'Catch Me Up'}
        </button>
      </div>

      {error && <div className="error-box">Error: {error}</div>}

      {loading && (
        <div className="loading">
          <div className="loading-spinner" />
          <div className="loading-text">Synthesizing live scorecard & match context...</div>
        </div>
      )}

      {recap && !loading && (
        <div className="card card-elevated" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <span className="card-title">Live Match Briefing</span>
              {recap.isDemo && <span className="card-badge badge-demo">Demo</span>}
            </div>

            {/* Reading Mode Switcher */}
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${readingMode === 'quick' ? 'active' : ''}`}
                onClick={() => setReadingMode('quick')}
              >
                {t('quick_take')}
              </button>
              <button
                className={`view-mode-btn ${readingMode === 'deep' ? 'active' : ''}`}
                onClick={() => setReadingMode('deep')}
              >
                {t('deep_dive')}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="report-stats-grid" style={{ marginBottom: 16 }}>
            <div className="report-stat-chip">
              <span className="chip-label">Current State</span>
              <span className="chip-val">{situation.runsRequired || 42} runs needed in {situation.ballsRemaining || 24}b</span>
            </div>
            <div className="report-stat-chip">
              <span className="chip-label">Required Rate</span>
              <span className="chip-val highlight-val">{situation.requiredRunRate || '10.50'} rpo</span>
            </div>
            <div className="report-stat-chip">
              <span className="chip-label">Win Odds</span>
              <span className="chip-val">{battingWin}% Win Chance</span>
            </div>
          </div>

          {/* Response Display (Quick Bites vs Deep Dive) */}
          {readingMode === 'quick' ? (
            <div className="quick-take-box">
              <div className="quick-take-bullet">
                <span className="bullet-tag">01</span>
                <div>
                  <strong>The State of Play:</strong> Needs {situation.runsRequired || 42} runs off {situation.ballsRemaining || 24} deliveries with {situation.wicketsRemaining || 7} wickets remaining.
                </div>
              </div>
              <div className="quick-take-bullet">
                <span className="bullet-tag">02</span>
                <div>
                  <strong>Momentum & Trend:</strong> Run rate requirement stands at {situation.requiredRunRate || '10.50'} rpo. Batting side has wickets in hand and needs 1-2 big overs.
                </div>
              </div>
              <div className="quick-take-bullet">
                <span className="bullet-tag">03</span>
                <div>
                  <strong>What to Watch Next:</strong> The death bowling matchup in Overs 17-19 will decide whether the chase stays alive or collapses into boundary drought.
                </div>
              </div>
            </div>
          ) : (
            <div
              className="ai-output md-content"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(recap.recap)
              }}
            />
          )}

          <div className="ai-source" style={{ marginTop: 16 }}>
            <span className="source-badge">LIVE BRIEFING</span>
            <span>Generated by {recap.model || 'Matchmate Engine'} • Grounded in live match data</span>
          </div>
        </div>
      )}
    </div>
  );
}
