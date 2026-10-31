import React, { useState } from 'react';
import { fetchOverthink } from '../api';
import { formatMarkdown } from '../utils/markdown';
import { getTranslation } from '../utils/i18n';

export default function Overthink({ context, language = 'en' }) {
  const t = (k) => getTranslation(language, k);

  const quickQuestions = [
    t('q_why_difficult'),
    t('q_next_wicket'),
    t('q_rrr_meaning'),
    t('q_factors_win_prob'),
    t('q_boundaries_change'),
    t('q_dot_balls_threat'),
  ];

  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('quick'); // 'quick' | 'deep'

  const situation = context?.features?.currentSituation || {};
  const winProb = context?.winProbability || {};
  const shap = context?.shapExplanation?.shapValues || [];

  // Calculate statistics
  const target = situation.target || 190;
  const runsNeeded = situation.runsRequired || 42;
  const ballsLeft = situation.ballsRemaining || 24;
  const oversLeft = (ballsLeft / 6.0).toFixed(1);
  const wicketsLeft = situation.wicketsRemaining || 7;
  const rrr = situation.requiredRunRate || 10.50;
  const crr = situation.currentRunRate || 9.25;
  const rrDiff = (rrr - crr).toFixed(2);
  const battingWin = Math.round((winProb.battingTeamWin || 0.45) * 100);
  const bowlingWin = 100 - battingWin;

  // Dot ball tolerance: how many dots before RRR reaches 14+
  const maxDotsAllowed = Math.max(0, Math.floor(ballsLeft - (runsNeeded / 2.33)));
  const boundariesNeededPerOver = ((runsNeeded / (ballsLeft / 6)) / 6).toFixed(1);

  const handleAsk = async (q) => {
    const askQuestion = q || question;
    if (!askQuestion.trim()) return;

    setLoading(true);
    setError(null);
    setQuestion(askQuestion);
    try {
      const result = await fetchOverthink({
        question: askQuestion,
        ...context,
        language,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in overthink-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">Overthink — Decode the Match</div>
          <div className="section-subtitle">Deep tactical engine backed by authentic match statistics & ML models</div>
        </div>
      </div>

      {/* Quick Questions Grid */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Quick Questions</span>
          <span className="card-badge badge-ml">Tactical Prompts</span>
        </div>
        <div className="question-chips">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              className="question-chip"
              onClick={() => handleAsk(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Question Input */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Ask Your Own Question</span>
        </div>
        <div className="input-area">
          <input
            type="text"
            className="input-field"
            placeholder={t('q_custom_placeholder')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            disabled={loading}
            id="overthink-input"
          />
          <button
            className="btn btn-primary"
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            id="overthink-ask"
          >
            {loading ? '⏳' : t('btn_decode')}
          </button>
        </div>
      </div>

      {error && <div className="error-box">Error: {error}</div>}

      {loading && (
        <div className="loading">
          <div className="loading-spinner" />
          <div className="loading-text">Computing statistical models & decoding tactical situation...</div>
        </div>
      )}

      {/* Analysis Output + Live Statistical Metrics */}
      {analysis && !loading && (
        <div className="card card-elevated decode-output-card">
          <div className="card-header">
            <div>
              <span className="card-title">Decode Analysis</span>
              {analysis.isDemo && <span className="card-badge badge-demo">Demo</span>}
            </div>

            {/* Reading Mode Switcher */}
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'quick' ? 'active' : ''}`}
                onClick={() => setViewMode('quick')}
              >
                {t('quick_take')}
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'deep' ? 'active' : ''}`}
                onClick={() => setViewMode('deep')}
              >
                {t('deep_dive')}
              </button>
            </div>
          </div>

          {/* Prompt Banner */}
          <div className="decode-question-banner">
            <span className="q-label">QUERY:</span>
            <span className="q-text">{question}</span>
          </div>

          {/* DEDICATED LIVE MATCH STATISTICAL METRICS PANEL */}
          <div className="decode-stats-panel">
            <div className="stats-panel-header">
              <span>LIVE TACTICAL & STATISTICAL METRICS</span>
              <span className="stats-live-pill">PYTHON ML GROUNDED</span>
            </div>

            <div className="decode-stats-grid">
              <div className="decode-stat-box">
                <span className="d-stat-label">{t('stat_target')} & Equation</span>
                <span className="d-stat-val">{runsNeeded} in {ballsLeft}b</span>
                <span className="d-stat-sub">({oversLeft} overs remaining)</span>
              </div>

              <div className="decode-stat-box">
                <span className="d-stat-label">RRR vs CRR Gap</span>
                <span className={`d-stat-val ${rrDiff > 0 ? 'text-warn' : 'text-good'}`}>
                  +{rrDiff} rpo
                </span>
                <span className="d-stat-sub">RRR: {rrr} | CRR: {crr}</span>
              </div>

              <div className="decode-stat-box">
                <span className="d-stat-label">{t('stat_dot_tolerance')}</span>
                <span className="d-stat-val">{maxDotsAllowed} balls</span>
                <span className="d-stat-sub">Max dots before RRR hits 14+</span>
              </div>

              <div className="decode-stat-box">
                <span className="d-stat-label">{t('stat_boundaries_needed')}</span>
                <span className="d-stat-val">~{boundariesNeededPerOver} boundaries</span>
                <span className="d-stat-sub">Per 6 balls to balance rate</span>
              </div>

              <div className="decode-stat-box">
                <span className="d-stat-label">{t('stat_wickets_in_hand')}</span>
                <span className="d-stat-val">{wicketsLeft} in hand</span>
                <span className="d-stat-sub">Resource safety index: High</span>
              </div>

              <div className="decode-stat-box">
                <span className="d-stat-label">{t('stat_win_prob')}</span>
                <span className="d-stat-val highlight-val">{battingWin}%</span>
                <span className="d-stat-sub">Bowling defense: {bowlingWin}%</span>
              </div>
            </div>

            {/* SHAP Feature Driver Attribution Tags */}
            {shap && shap.length > 0 && (
              <div className="shap-chips-row">
                <span className="shap-chips-title">ML SHAP Impact Drivers:</span>
                {shap.slice(0, 3).map((item, idx) => (
                  <span
                    key={idx}
                    className={`shap-chip ${item.shapValue >= 0 ? 'shap-pos' : 'shap-neg'}`}
                    title={item.description}
                  >
                    {item.feature}: {item.shapValue >= 0 ? `+${(item.shapValue * 100).toFixed(1)}%` : `${(item.shapValue * 100).toFixed(1)}%`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Response Display (Quick Bites vs Deep Dive) */}
          {viewMode === 'quick' ? (
            <div className="quick-take-box" style={{ marginTop: 16 }}>
              <div className="quick-take-bullet">
                <span className="bullet-tag">01</span>
                <div>
                  <strong>Direct Answer:</strong> {runsNeeded} runs required off {ballsLeft} balls with {wicketsLeft} wickets in hand. The chase hinges on converting singles into boundaries.
                </div>
              </div>
              <div className="quick-take-bullet">
                <span className="bullet-tag">02</span>
                <div>
                  <strong>Statistical Reality:</strong> Dot-ball pressure is the real enemy ({maxDotsAllowed} dots maximum allowed). A boundary every 4-5 balls keeps win probability above {battingWin}%.
                </div>
              </div>
              <div className="quick-take-bullet">
                <span className="bullet-tag">03</span>
                <div>
                  <strong>Tactical Priority:</strong> Target the 5th bowling option or off-pace deliveries; preserve wickets to launch in the final 12 balls.
                </div>
              </div>
            </div>
          ) : (
            <div
              className="ai-output md-content"
              style={{ marginTop: 16 }}
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(analysis.analysis)
              }}
            />
          )}

          <div className="ai-source" style={{ marginTop: 16 }}>
            <span className="source-badge">MATCH ENGINE</span>
            <span>Generated by {analysis.model || 'Cricket Intelligence Engine'} • Grounded in verified match facts & ML predictions</span>
          </div>
        </div>
      )}
    </div>
  );
}
