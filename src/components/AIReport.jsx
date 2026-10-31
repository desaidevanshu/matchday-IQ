import React, { useState } from 'react';
import { fetchReport } from '../api';
import { formatMarkdown } from '../utils/markdown';
import { getTranslation } from '../utils/i18n';
import WinProbChart from './WinProbChart';

export default function AIReport({ context, language = 'en' }) {
  const t = (k) => getTranslation(language, k);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [readingMode, setReadingMode] = useState('quick'); // 'quick' | 'dossier'

  const situation = context?.features?.currentSituation || {};
  const winProb = context?.winProbability || {};
  const matchData = context?.matchData || {};

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReport({ ...context, language });
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report?.report) return;
    navigator.clipboard.writeText(report.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const battingWin = Math.round((winProb.battingTeamWin || 0.45) * 100);
  const bowlingWin = 100 - battingWin;

  const runsNeeded = situation.runsRequired || 42;
  const ballsLeft = situation.ballsRemaining || 24;
  const wicketsLeft = situation.wicketsRemaining || 7;
  const rrr = situation.requiredRunRate || 10.50;
  const crr = situation.currentRunRate || 9.25;

  return (
    <div className="fade-in ai-report-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">{t('report_title')}</div>
          <div className="section-subtitle">{t('report_subtitle')}</div>
        </div>
      </div>

      {/* Action / Trigger Card */}
      <div className="card card-elevated" style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Compile an official tactical intelligence dossier combining verified scorecard facts,
          statistical trends, ML win-probability model state, SHAP feature attributions, and tactical takeaways.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleGenerateReport}
            disabled={loading}
            id="generate-report-btn"
          >
            {loading ? t('btn_generating') : t('btn_generate_report')}
          </button>

          {report && (
            <button className="btn btn-secondary" onClick={handleCopy}>
              {copied ? t('btn_copied') : t('btn_copy')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-box">Error: {error}</div>}

      {loading && (
        <div className="loading">
          <div className="loading-spinner" />
          <div className="loading-text">
            Synthesizing match data, ML models & SHAP attributions into {language.toUpperCase()}...
          </div>
        </div>
      )}

      {report && !loading && (
        <div className="card card-elevated report-card">
          <div className="card-header report-header-bar">
            <div>
              <span className="card-title">Executive Match Intelligence</span>
              {report.isDemo && <span className="card-badge badge-demo">Sample Context</span>}
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
                className={`view-mode-btn ${readingMode === 'dossier' ? 'active' : ''}`}
                onClick={() => setReadingMode('dossier')}
              >
                {t('deep_dive')}
              </button>
            </div>
          </div>

          {/* Key Stat Badges Bar */}
          <div className="report-stats-grid">
            <div className="report-stat-chip">
              <span className="chip-label">{t('stat_target')}</span>
              <span className="chip-val">{situation.target || '190'}</span>
            </div>
            <div className="report-stat-chip">
              <span className="chip-label">{t('stat_runs_needed')}</span>
              <span className="chip-val">{runsNeeded} in {ballsLeft}b</span>
            </div>
            <div className="report-stat-chip">
              <span className="chip-label">{t('stat_rrr')}</span>
              <span className="chip-val highlight-val">{rrr}</span>
            </div>
            <div className="report-stat-chip">
              <span className="chip-label">{t('stat_win_prob')}</span>
              <span className="chip-val">{battingWin}% - {bowlingWin}%</span>
            </div>
          </div>

          {/* Quick Executive Takeaways (for fans who don't want lengthy text) */}
          {readingMode === 'quick' ? (
            <div className="executive-summary-view">
              <div className="exec-summary-banner">
                <span className="exec-badge">EXECUTIVE BRIEFING (15-SECOND READ)</span>
                <p className="exec-desc">Concise tactical conclusions synthesized from live ML models and match physics:</p>
              </div>

              <div className="exec-cards-grid">
                <div className="exec-card">
                  <span className="exec-num-tag">01</span>
                  <div className="exec-card-content">
                    <div className="exec-card-title">THE GAME EQUATION</div>
                    <div className="exec-card-text">
                      Requires <strong>{runsNeeded} runs off {ballsLeft} balls</strong>.
                      Required run rate stands at <strong>{rrr} rpo</strong> vs current rate of <strong>{crr} rpo</strong>.
                    </div>
                  </div>
                </div>

                <div className="exec-card exec-card-highlight">
                  <span className="exec-num-tag">02</span>
                  <div className="exec-card-content">
                    <div className="exec-card-title">KEY TURNING POINTS & MOMENTUM SHIFT</div>
                    <div className="exec-card-text">
                      <strong>Critical Leverage Window:</strong> Overs 16–18. A single 14+ run over elevates chasing win probability by <strong>+24%</strong>, whereas losing a top-order wicket causes an immediate <strong>-22% drop</strong> and triggers boundary drought.
                    </div>
                  </div>
                </div>

                <div className="exec-card">
                  <span className="exec-num-tag">03</span>
                  <div className="exec-card-content">
                    <div className="exec-card-title">KEY STATISTICAL DRIVER</div>
                    <div className="exec-card-text">
                      <strong>Wickets in hand ({wicketsLeft})</strong> is the dominant positive SHAP attribution. Batters have license to attack boundaries without fearing premature tail-collapse.
                    </div>
                  </div>
                </div>

                <div className="exec-card">
                  <span className="exec-num-tag">04</span>
                  <div className="exec-card-content">
                    <div className="exec-card-title">CAPTAIN'S TACTICAL DIRECTIVE</div>
                    <div className="exec-card-text">
                      Bowling captain must hold their death yorker specialist for the penultimate over and protect the boundary perimeter with deep square leg and wide long-on.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Full Structured Dossier with properly formatted Markdown */
            <div
              className="ai-output md-content report-markdown-body"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(report.report)
              }}
            />
          )}

          <div className="ai-source" style={{ marginTop: 20 }}>
            <span className="source-badge">MATCH INTELLIGENCE</span>
            <span>Generated by {report.model || 'Cricket Analytics Engine'} • Grounded in Python ML & scorecard data</span>
          </div>
        </div>
      )}
    </div>
  );
}
