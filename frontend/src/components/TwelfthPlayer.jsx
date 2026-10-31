import React, { useState } from 'react';
import { fetchTactical } from '../api';
import { formatMarkdown } from '../utils/markdown';
import { getTranslation } from '../utils/i18n';

const SCENARIOS = [
  {
    id: 'yorker_death',
    title: 'Bowl Yorkers vs Slower Balls',
    desc: 'Target wide blockhole yorkers instead of off-pace cutters in the death overs.',
    icon: '🎯'
  },
  {
    id: 'attacking_field',
    title: 'Attacking vs Defensive Field',
    desc: 'Bring fielders inside the circle to create wicket-taking pressure vs setting boundary protection.',
    icon: '🛡️'
  },
  {
    id: 'preserve_bowler',
    title: 'Hold Premium Bowler for 19th/20th',
    desc: 'Bowl out the spinner now or reserve your strike seamer for the penultimate over.',
    icon: '⏱️'
  },
  {
    id: 'target_batter',
    title: 'Target Batter Weakness vs Contain',
    desc: 'Test the set batter with short-pitched bodyline bowling or stick to containment lines.',
    icon: '⚔️'
  },
  {
    id: 'accelerate_chase',
    title: 'Pinch-Hitter / High Risk Over',
    desc: 'Target the 5th bowler for a 15+ run over immediately vs taking the chase deep.',
    icon: '💥'
  }
];

export default function TwelfthPlayer({ context, language = 'en' }) {
  const t = (k) => getTranslation(language, k);

  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].title);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readingMode, setReadingMode] = useState('quick'); // 'quick' | 'deep'

  const handleSimulate = async (scenarioTitle) => {
    const sc = scenarioTitle || selectedScenario;
    setSelectedScenario(sc);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTactical({
        scenario: sc,
        ...context,
        language
      });
      setResult(data);
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
          <div className="section-title">12th Player - Captain's Challenge</div>
          <div className="section-subtitle">Qualitative Scenario Analysis & Tactical Trade-offs</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Select Tactical Dilemma</span>
          <span className="card-badge badge-ml">Fielding & Bowling Strategy</span>
        </div>
        <div className="scenario-grid">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`scenario-btn ${selectedScenario === s.title ? 'active' : ''}`}
              onClick={() => handleSimulate(s.title)}
              disabled={loading}
            >
              <div className="scenario-icon">{s.icon}</div>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div className="scenario-label">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-box">Error: {error}</div>}

      {loading && (
        <div className="loading">
          <div className="loading-spinner" />
          <div className="loading-text">Simulating tactical implications in {language.toUpperCase()}...</div>
        </div>
      )}

      {result && !loading && (
        <div className="card card-elevated" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <span className="card-title">Captain's Tactical Analysis</span>
              {result.isDemo && <span className="card-badge badge-demo">Demo</span>}
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

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--accent-lime)',
            marginBottom: 16,
            padding: '10px 14px',
            background: 'var(--bg-elevated)',
            border: 'var(--border-thin)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>DILEMMA:</span>
            <strong>{selectedScenario}</strong>
          </div>

          {readingMode === 'quick' ? (
            <div className="quick-take-box">
              <div className="quick-take-bullet">
                <span className="bullet-tag">01</span>
                <div>
                  <strong>Primary Benefit:</strong> Maximizes dot-ball pressure and denies the batter's preferred hitting arc through precise execution.
                </div>
              </div>
              <div className="quick-take-bullet">
                <span className="bullet-tag">02</span>
                <div>
                  <strong>Key Vulnerability:</strong> Slight error in length translates into easy boundary slot balls or full-toss punishment.
                </div>
              </div>
              <div className="quick-take-bullet">
                <span className="bullet-tag">03</span>
                <div>
                  <strong>Captain's Verdict:</strong> Execute with boundary sweepers set at deep backward point and long-on; bowl wide outside off to take leg side out of equation.
                </div>
              </div>
            </div>
          ) : (
            <div
              className="ai-output md-content"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(result.analysis)
              }}
            />
          )}

          <div className="ai-source" style={{ marginTop: 16 }}>
            <span className="source-badge">TACTICAL ADVISOR</span>
            <span>Generated by {result.model || 'Match Strategy Engine'} • {result.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
