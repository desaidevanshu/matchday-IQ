import React, { useState, useEffect } from 'react';
import { fetchSimulate } from '../api';
import { formatMarkdown } from '../utils/markdown';
import { getTranslation } from '../utils/i18n';
import {
  playCrowdCheer,
  playCrowdGasp,
  playWicketSiren,
  playBoundaryCrack
} from '../utils/audio';

const QUICK_SCENARIOS = [
  { label: '💥 16-Run Blitz (2 Sixes)', runs: 16, wickets: 0, sound: 'cheer' },
  { label: '⚡ Crucial Wicket Falls!', runs: 4, wickets: 1, sound: 'wicket' },
  { label: '🔒 3-Run Lockdown Over', runs: 3, wickets: 0, sound: 'gasp' },
  { label: '🏏 9-Run Strike Rotation', runs: 9, wickets: 0, sound: 'boundary' },
];

export default function FanDugout({ context, language = 'en' }) {
  const t = (k) => getTranslation(language, k);

  const situation = context?.features?.currentSituation || {};
  const winProb = context?.winProbability || {};
  const matchData = context?.matchData || {};

  // Fan Prediction State
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pulseVotes, setPulseVotes] = useState({ big: 48, steady: 28, tight: 14, wicket: 10 });
  const [iqPoints, setIqPoints] = useState(() => {
    return parseInt(localStorage.getItem('matchday_iq_points') || '150', 10);
  });
  const [recentBonus, setRecentBonus] = useState(0);

  // What-If Simulation State
  const [simRuns, setSimRuns] = useState(12);
  const [simWickets, setSimWickets] = useState(0);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [viewMode, setViewMode] = useState('quick'); // 'quick' | 'deep'

  // Live Floating Reactions State
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({
    '🔥': 142,
    '🏏': 98,
    '😱': 64,
    '👏': 115,
    '💔': 37,
  });

  const handlePredict = (type) => {
    if (hasVoted) return;
    setSelectedPrediction(type);
    setHasVoted(true);

    // Audio & IQ
    if (type === 'big') playCrowdCheer();
    else if (type === 'wicket') playWicketSiren();
    else if (type === 'tight') playCrowdGasp();
    else playBoundaryCrack();

    const bonus = 50;
    const newPoints = iqPoints + bonus;
    setIqPoints(newPoints);
    setRecentBonus(bonus);
    localStorage.setItem('matchday_iq_points', newPoints.toString());

    // Update pulse percentages
    setPulseVotes(prev => {
      const copy = { ...prev, [type]: prev[type] + 5 };
      const total = Object.values(copy).reduce((a, b) => a + b, 0);
      return {
        big: Math.round((copy.big / total) * 100),
        steady: Math.round((copy.steady / total) * 100),
        tight: Math.round((copy.tight / total) * 100),
        wicket: Math.round((copy.wicket / total) * 100),
      };
    });

    setTimeout(() => setRecentBonus(0), 3000);
  };

  const runSimulation = async (runs = simRuns, wickets = simWickets, soundType = 'boundary') => {
    setSimulating(true);
    setSimRuns(runs);
    setSimWickets(wickets);

    if (soundType === 'cheer') playCrowdCheer();
    else if (soundType === 'wicket') playWicketSiren();
    else if (soundType === 'gasp') playCrowdGasp();
    else playBoundaryCrack();

    try {
      const data = await fetchSimulate({
        situation,
        matchData,
        runsInOver: runs,
        wicketsInOver: wickets,
        language,
      });
      setSimResult(data);
    } catch (err) {
      // Local fallback calculation if backend error
      const currentProb = winProb?.battingTeamWin || 0.45;
      const swingDelta = (runs - 8.5) * 2.8 - (wickets * 18.0);
      const newProb = Math.max(0.05, Math.min(0.95, currentProb + swingDelta / 100));
      setSimResult({
        currentProb: Math.round(currentProb * 100),
        newProb: Math.round(newProb * 100),
        delta: Math.round((newProb - currentProb) * 100 * 10) / 10,
        newRunsRequired: Math.max(0, (situation.runsRequired || 42) - runs),
        newBallsRemaining: Math.max(0, (situation.ballsRemaining || 24) - 6),
        newWicketsRemaining: Math.max(0, (situation.wicketsRemaining || 7) - wickets),
        tacticalVerdict: runs >= 12
          ? `💥 **Momentum Surge:** A ${runs}-run over shifts win probability decisively by +${Math.abs(Math.round((newProb - currentProb) * 100))}%. Bowling team is forced back on defense with boundary sweepers pushed back.`
          : wickets > 0
            ? `⚡ **Critical Blow:** Losing ${wickets} wicket(s) drops win probability by ${Math.abs(Math.round((newProb - currentProb) * 100))}%. Batting side is thrust into survival mode with dot ball pressure compounding.`
            : `🔒 **Defensive Strangle:** Restricting to ${runs} runs drives required rate up to ${(Math.max(0, (situation.runsRequired || 42) - runs) / ((situation.ballsRemaining || 24) - 6) * 6).toFixed(1)} rpo. Pressure tilts heavily to bowling unit.`,
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleReaction = (emoji) => {
    // Add floating emoji
    const id = Date.now() + Math.random();
    setFloatingEmojis(prev => [...prev, { id, emoji, left: Math.random() * 80 + 10 }]);
    setReactionCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));

    if (emoji === '🔥' || emoji === '👏') playCrowdCheer();
    else if (emoji === '😱') playCrowdGasp();
    else if (emoji === '💔') playWicketSiren();
    else playBoundaryCrack();

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 1800);
  };

  // Run initial simulation on mount
  useEffect(() => {
    runSimulation(12, 0, 'none');
  }, [situation.runsRequired, situation.ballsRemaining, language]);

  return (
    <div className="fade-in fan-dugout-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <div className="section-title">{t('dugout_title')}</div>
          <div className="section-subtitle">{t('dugout_subtitle')}</div>
        </div>
        <div className="iq-badge-box">
          <span className="iq-label">🧠 {t('dugout_iq_score')}:</span>
          <span className="iq-number">{iqPoints}</span>
          {recentBonus > 0 && <span className="iq-bonus">+{recentBonus} PTS!</span>}
        </div>
      </div>

      {/* Grid: Over Prediction + Stadium Atmosphere */}
      <div className="dugout-grid">
        {/* Over Predictor Card */}
        <div className="card card-elevated dugout-card">
          <div className="card-header">
            <span className="card-title">🏏 {t('dugout_fan_pulse')}</span>
            <span className="card-badge badge-live">OVER 17 LIVE</span>
          </div>
          <p className="dugout-prompt">{t('dugout_predict_prompt')}</p>

          <div className="prediction-buttons">
            <button
              className={`pred-btn ${selectedPrediction === 'big' ? 'selected' : ''}`}
              onClick={() => handlePredict('big')}
              disabled={hasVoted}
            >
              <span className="pred-icon">💥</span>
              <span className="pred-label">{t('dugout_pred_big')}</span>
              <span className="pred-pct">{pulseVotes.big}%</span>
            </button>

            <button
              className={`pred-btn ${selectedPrediction === 'steady' ? 'selected' : ''}`}
              onClick={() => handlePredict('steady')}
              disabled={hasVoted}
            >
              <span className="pred-icon">🏏</span>
              <span className="pred-label">{t('dugout_pred_steady')}</span>
              <span className="pred-pct">{pulseVotes.steady}%</span>
            </button>

            <button
              className={`pred-btn ${selectedPrediction === 'tight' ? 'selected' : ''}`}
              onClick={() => handlePredict('tight')}
              disabled={hasVoted}
            >
              <span className="pred-icon">🔒</span>
              <span className="pred-label">{t('dugout_pred_tight')}</span>
              <span className="pred-pct">{pulseVotes.tight}%</span>
            </button>

            <button
              className={`pred-btn ${selectedPrediction === 'wicket' ? 'selected' : ''}`}
              onClick={() => handlePredict('wicket')}
              disabled={hasVoted}
            >
              <span className="pred-icon">⚡</span>
              <span className="pred-label">{t('dugout_pred_wicket')}</span>
              <span className="pred-pct">{pulseVotes.wicket}%</span>
            </button>
          </div>

          {hasVoted && (
            <div className="voted-banner">
              <span>✓</span> {t('dugout_voted_msg')} (+50 IQ Points)
            </div>
          )}

          {/* Pulse Distribution Meter */}
          <div className="pulse-meter-container">
            <div className="pulse-meter-label">Live Community Prediction Distribution</div>
            <div className="pulse-bar">
              <div style={{ width: `${pulseVotes.big}%`, background: 'var(--accent-orange)' }} title={`Big Over: ${pulseVotes.big}%`} />
              <div style={{ width: `${pulseVotes.steady}%`, background: 'var(--accent-lime)' }} title={`Steady: ${pulseVotes.steady}%`} />
              <div style={{ width: `${pulseVotes.tight}%`, background: 'var(--accent-blue)' }} title={`Tight: ${pulseVotes.tight}%`} />
              <div style={{ width: `${pulseVotes.wicket}%`, background: 'var(--accent-red)' }} title={`Wicket: ${pulseVotes.wicket}%`} />
            </div>
          </div>
        </div>

        {/* Stadium Audio & Live Reactions */}
        <div className="card dugout-card">
          <div className="card-header">
            <span className="card-title">🔊 {t('dugout_stadium_sounds')}</span>
            <span className="card-badge badge-active">AUDIO FX</span>
          </div>
          <p className="dugout-prompt" style={{ fontSize: '0.8rem', marginBottom: 12 }}>
            Synthesized crowd atmosphere. Trigger instant stadium sound waves:
          </p>

          <div className="sound-buttons-grid">
            <button className="btn sound-btn" onClick={() => playCrowdCheer()}>
              {t('dugout_cheer_btn')}
            </button>
            <button className="btn sound-btn" onClick={() => playCrowdGasp()}>
              {t('dugout_gasp_btn')}
            </button>
            <button className="btn sound-btn sound-alert" onClick={() => playWicketSiren()}>
              {t('dugout_siren_btn')}
            </button>
            <button className="btn sound-btn" onClick={() => playBoundaryCrack()}>
              {t('dugout_four_btn')}
            </button>
          </div>

          <div className="reactions-container" style={{ position: 'relative', marginTop: 16 }}>
            <div className="reactions-title">{t('dugout_reactions')}</div>
            <div className="reaction-pills">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  key={emoji}
                  className="reaction-pill"
                  onClick={() => handleReaction(emoji)}
                  title={`Cheer with ${emoji}`}
                >
                  <span>{emoji}</span>
                  <span className="reaction-count">{count}</span>
                </button>
              ))}
            </div>

            {/* Floating Emojis Animation */}
            {floatingEmojis.map(item => (
              <span
                key={item.id}
                className="floating-emoji"
                style={{ left: `${item.left}%` }}
              >
                {item.emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI WHAT-IF LIVE OVER SIMULATOR */}
      <div className="card card-elevated" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <span className="card-title">{t('dugout_sim_title')}</span>
            <div className="card-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t('dugout_sim_subtitle')}
            </div>
          </div>
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

        {/* Quick Scenario Chips */}
        <div className="scenario-chips-row">
          {QUICK_SCENARIOS.map((sc, idx) => (
            <button
              key={idx}
              className="scenario-chip"
              onClick={() => runSimulation(sc.runs, sc.wickets, sc.sound)}
              disabled={simulating}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Custom Interactive Sliders */}
        <div className="sim-controls-grid">
          <div className="sim-control-box">
            <div className="slider-label-row">
              <span>{t('dugout_sim_runs')}</span>
              <span className="slider-val-badge">{simRuns} runs</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={simRuns}
              onChange={(e) => setSimRuns(parseInt(e.target.value, 10))}
              className="sim-slider"
            />
            <div className="slider-ticks">
              <span>0 (Maiden)</span>
              <span>6</span>
              <span>12</span>
              <span>18</span>
              <span>24 (4 Sixes)</span>
            </div>
          </div>

          <div className="sim-control-box">
            <div className="slider-label-row">
              <span>{t('dugout_sim_wickets')}</span>
              <span className="slider-val-badge">{simWickets} wickets</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              value={simWickets}
              onChange={(e) => setSimWickets(parseInt(e.target.value, 10))}
              className="sim-slider"
            />
            <div className="slider-ticks">
              <span>0 (No Wicket)</span>
              <span>1 Wicket</span>
              <span>2 Wickets</span>
              <span>3 (Collapse)</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={() => runSimulation(simRuns, simWickets, simWickets > 0 ? 'wicket' : 'boundary')}
            disabled={simulating}
          >
            {simulating ? '⏳ Simulating Physics & ML...' : t('dugout_sim_btn')}
          </button>
        </div>

        {/* Simulation Output */}
        {simResult && (
          <div className="sim-results-panel">
            <div className="sim-stats-strip">
              <div className="sim-stat-card">
                <span className="stat-label">Initial Win Prob</span>
                <span className="stat-value">{simResult.currentProb}%</span>
              </div>
              <div className="sim-stat-card">
                <span className="stat-label">Simulated Win Prob</span>
                <span className="stat-value">{simResult.newProb}%</span>
              </div>
              <div className="sim-stat-card">
                <span className="stat-label">{t('dugout_sim_swing')}</span>
                <span className={`stat-value ${simResult.delta >= 0 ? 'swing-positive' : 'swing-negative'}`}>
                  {simResult.delta >= 0 ? `+${simResult.delta}% 📈` : `${simResult.delta}% 📉`}
                </span>
              </div>
              <div className="sim-stat-card">
                <span className="stat-label">New Eqn</span>
                <span className="stat-value" style={{ fontSize: '1rem' }}>
                  {simResult.newRunsRequired} in {simResult.newBallsRemaining} balls
                </span>
              </div>
            </div>

            {/* Tactical Verdict */}
            <div className="sim-tactical-verdict">
              <div className="verdict-header">
                <span className="source-badge">DUGOUT TACTICAL ASSESSMENT</span>
                <span className="card-badge badge-ml">ML Pipeline Recalculated</span>
              </div>

              {viewMode === 'quick' ? (
                <div className="quick-take-box">
                  <div className="quick-take-bullet">
                    <span className="bullet-dot">⚡</span>
                    <div>
                      <strong>Equation Shift:</strong> Needs {simResult.newRunsRequired} off {simResult.newBallsRemaining} balls with {simResult.newWicketsRemaining} wickets left.
                    </div>
                  </div>
                  <div className="quick-take-bullet">
                    <span className="bullet-dot">🎯</span>
                    <div>
                      <strong>Tactical Advantage:</strong> {simResult.delta >= 0 ? 'Batting side seizes complete psychological momentum.' : 'Bowling unit exerts chokehold; boundary boundary risk diminished.'}
                    </div>
                  </div>
                  <div className="quick-take-bullet">
                    <span className="bullet-dot">📌</span>
                    <div>
                      <strong>Captain's Next Move:</strong> {simResult.newWicketsRemaining <= 4 ? 'Bring spearhead bowler to finish the tail.' : 'Protect outfield boundaries and force singles.'}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="ai-output md-content"
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(simResult.tacticalVerdict)
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

