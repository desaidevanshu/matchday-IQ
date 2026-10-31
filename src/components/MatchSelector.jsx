import React, { useState, useMemo } from 'react';

export default function MatchSelector({ matches, selectedMatch, onSelect, onRefresh, loading, lastRefresh }) {
  const [filter, setFilter] = useState('all'); // 'all', 'live', 'upcoming', 'completed'

  const counts = useMemo(() => {
    let live = 0, upcoming = 0, completed = 0;
    matches.forEach(m => {
      if (m.matchStarted && !m.matchEnded) live++;
      else if (!m.matchStarted && !m.matchEnded) upcoming++;
      else completed++;
    });
    return { all: matches.length, live, upcoming, completed };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (filter === 'live') {
      return matches.filter(m => m.matchStarted && !m.matchEnded);
    }
    if (filter === 'upcoming') {
      return matches.filter(m => !m.matchStarted && !m.matchEnded);
    }
    if (filter === 'completed') {
      return matches.filter(m => m.matchEnded);
    }
    return matches;
  }, [matches, filter]);

  return (
    <div>
      <div className="section-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="section-title">🏏 Match Intelligence Hub</div>
          <div className="section-subtitle">
            {matches.length} matches tracked • Prioritizing Live & Upcoming encounters
            {lastRefresh && ` • Updated ${lastRefresh.toLocaleTimeString()}`}
          </div>
        </div>
        <button 
          className={`refresh-btn ${loading ? 'spinning' : ''}`} 
          onClick={onRefresh}
          disabled={loading}
          id="refresh-matches-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
          Refresh Feed
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-dark'}`}
          onClick={() => setFilter('all')}
          id="filter-all"
        >
          ALL ({counts.all})
        </button>
        <button
          className={`btn btn-sm ${filter === 'live' ? 'btn-primary' : 'btn-dark'}`}
          onClick={() => setFilter('live')}
          style={filter === 'live' ? {} : { borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
          id="filter-live"
        >
          🔴 LIVE NOW ({counts.live})
        </button>
        <button
          className={`btn btn-sm ${filter === 'upcoming' ? 'btn-primary' : 'btn-dark'}`}
          onClick={() => setFilter('upcoming')}
          id="filter-upcoming"
        >
          ⏳ UPCOMING ({counts.upcoming})
        </button>
        <button
          className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-dark'}`}
          onClick={() => setFilter('completed')}
          id="filter-completed"
        >
          🏁 RECENT RESULTS ({counts.completed})
        </button>
      </div>

      {loading && matches.length === 0 && (
        <div className="loading">
          <div className="loading-spinner" />
          <div className="loading-text">Fetching match fixtures & intelligence...</div>
        </div>
      )}

      <div className="match-grid stagger">
        {filteredMatches.map((match) => {
          const isLive = match.matchStarted && !match.matchEnded;
          const isUpcoming = !match.matchStarted && !match.matchEnded;

          return (
            <div
              key={match.id}
              className={`match-card ${selectedMatch?.id === match.id ? 'selected' : ''}`}
              style={isLive ? { borderColor: 'var(--accent-red)', boxShadow: '4px 4px 0 var(--accent-red)' } : {}}
              onClick={() => onSelect(match)}
              id={`match-${match.id}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div className="match-type">
                  {match.matchType?.toUpperCase()} • {match.date || 'TODAY'}
                </div>
                <span className={`card-badge ${isLive ? 'badge-live' : isUpcoming ? 'badge-model' : 'badge-completed'}`}>
                  {isLive ? '🔴 LIVE' : isUpcoming ? '⏳ UPCOMING' : 'COMPLETED'}
                </span>
              </div>
              
              <div className="match-teams">{match.name}</div>
              
              {match.score && match.score.length > 0 && (
                <div style={{ margin: '8px 0', padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid #333' }}>
                  {match.score.map((s, i) => (
                    <div key={i} className="match-score" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.inning}:</span>
                      <span>
                        <strong style={{ color: 'var(--accent-lime)' }}>{s.r}/{s.w}</strong> ({s.o} ov)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="match-status" style={isLive ? { color: 'var(--accent-lime)' } : {}}>
                {match.status}
              </div>

              {match.venue && (
                <div className="match-venue">
                  📍 {match.venue}
                </div>
              )}

              {isLive && (
                <div style={{ 
                  marginTop: 10, 
                  fontSize: '0.65rem', 
                  fontFamily: 'var(--font-mono)', 
                  color: 'var(--accent-lime)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span>⚡</span> Live ML Chase Prediction & SHAP Analysis Ready
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMatches.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">🏏</div>
          <div className="empty-state-text">No matches found in this category</div>
        </div>
      )}
    </div>
  );
}
