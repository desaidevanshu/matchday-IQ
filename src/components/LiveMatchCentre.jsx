import React, { useState } from 'react';
import SHAPChart from './SHAPChart';
import WinProbBar from './WinProbBar';

export default function LiveMatchCentre({ match, detail, analysis, loading, onRefresh, lastRefresh }) {
  const [activeInning, setActiveInning] = useState(0);
  const features = analysis?.features;
  const sit = features?.currentSituation;

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🏏 Live Match Centre</div>
          <div className="section-subtitle">
            {match.name}
            {lastRefresh && ` • ${lastRefresh.toLocaleTimeString()}`}
          </div>
        </div>
        <button className={`refresh-btn ${loading ? 'spinning' : ''}`} onClick={onRefresh} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Score Display */}
      <div className="card card-elevated" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          {match.score?.map((s, i) => (
            <div key={i} style={{ flex: '1 1 200px' }}>
              <div className="score-label">{s.inning}</div>
              <div className="score-big">{s.r}/{s.w}</div>
              <div className="score-overs">({s.o} overs)</div>
            </div>
          ))}
        </div>
        <div className="match-status" style={{ marginTop: 12, fontSize: '1rem' }}>
          {match.status}
        </div>
        {match.venue && <div className="match-venue" style={{ marginTop: 4 }}>📍 {match.venue}</div>}
      </div>

      {/* Chase Situation */}
      {sit && sit.isChasing && !sit.hasWon && (
        <div className="card card-accent" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Chase Analysis</span>
            <span className={`difficulty-indicator difficulty-${sit.chaseDifficulty}`}>
              {sit.chaseDifficulty.replace('_', ' ')}
            </span>
          </div>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{sit.target}</div>
              <div className="stat-label">Target</div>
            </div>
            <div className="stat-box">
              <div className={`stat-value ${sit.runsRequired > 60 ? 'warning' : ''}`}>{sit.runsRequired}</div>
              <div className="stat-label">Runs Needed</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{sit.ballsRemaining}</div>
              <div className="stat-label">Balls Left</div>
            </div>
            <div className="stat-box">
              <div className={`stat-value ${sit.wicketsRemaining <= 3 ? 'danger' : ''}`}>{sit.wicketsRemaining}</div>
              <div className="stat-label">Wickets Left</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{sit.currentRunRate}</div>
              <div className="stat-label">Current RR</div>
            </div>
            <div className="stat-box">
              <div className={`stat-value ${sit.requiredRunRate > 12 ? 'danger' : sit.requiredRunRate > 8 ? 'warning' : ''}`}>
                {sit.requiredRunRate}
              </div>
              <div className="stat-label">Required RR</div>
            </div>
          </div>
        </div>
      )}

      {/* Win Probability */}
      {analysis?.winProbability && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Win Probability</span>
            <span className="card-badge badge-model">{analysis.winProbability.method}</span>
          </div>
          <WinProbBar
            winProb={analysis.winProbability}
            teams={match.teams}
          />
          {analysis.winProbability.note && (
            <div className="shap-disclaimer">⚠ {analysis.winProbability.note}</div>
          )}
        </div>
      )}

      {/* SHAP Explanation */}
      {analysis?.shapExplanation && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Feature Attribution</span>
            <span className="card-badge badge-model">{analysis.shapExplanation.method}</span>
          </div>
          <SHAPChart shapData={analysis.shapExplanation} />
        </div>
      )}

      {/* Scorecard */}
      {detail?.scorecard && detail.scorecard.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Scorecard</span>
          </div>

          <div className="innings-toggle">
            {detail.scorecard.map((inn, i) => (
              <button
                key={i}
                className={`innings-btn ${activeInning === i ? 'active' : ''}`}
                onClick={() => setActiveInning(i)}
              >
                {inn.inning}
              </button>
            ))}
          </div>

          {detail.scorecard[activeInning] && (
            <>
              {/* Batting */}
              {detail.scorecard[activeInning].batting && (
                <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>Batter</th>
                        <th>R</th>
                        <th>B</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>SR</th>
                        <th>Dismissal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.scorecard[activeInning].batting.map((b, i) => (
                        <tr key={i}>
                          <td className="player-name">{b.batsman?.name || b.batsman}</td>
                          <td className={b.r >= 50 ? 'highlight' : ''}>{b.r}</td>
                          <td>{b.b}</td>
                          <td>{b['4s']}</td>
                          <td>{b['6s']}</td>
                          <td>{b.sr ? b.sr.toFixed(1) : '-'}</td>
                          <td className="dismissal">{b.dismissal || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bowling */}
              {detail.scorecard[activeInning].bowling && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="scorecard-table">
                    <thead>
                      <tr>
                        <th>Bowler</th>
                        <th>O</th>
                        <th>M</th>
                        <th>R</th>
                        <th>W</th>
                        <th>Eco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.scorecard[activeInning].bowling.map((b, i) => (
                        <tr key={i}>
                          <td className="player-name">{b.bowler?.name || b.bowler}</td>
                          <td>{b.o}</td>
                          <td>{b.m}</td>
                          <td>{b.r}</td>
                          <td className={b.w > 0 ? 'highlight' : ''}>{b.w}</td>
                          <td>{b.eco ? b.eco.toFixed(1) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detail.scorecard[activeInning].extras !== undefined && (
                <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Extras: {detail.scorecard[activeInning].extras} &nbsp;|&nbsp; 
                  Total: <strong style={{ color: 'var(--accent-lime)' }}>
                    {detail.scorecard[activeInning].total}/{detail.scorecard[activeInning].wickets}
                  </strong> ({detail.scorecard[activeInning].overs} ov)
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
