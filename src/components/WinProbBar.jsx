import React from 'react';

export default function WinProbBar({ winProb, teams }) {
  if (!winProb) return null;
  
  const battingPct = Math.round(winProb.battingTeam * 100);
  const bowlingPct = Math.round(winProb.bowlingTeam * 100);
  const team1 = teams?.[1] || 'Batting';
  const team2 = teams?.[0] || 'Bowling';

  return (
    <div className="winprob-container">
      <div className="winprob-bar">
        <div 
          className="winprob-fill batting" 
          style={{ width: `${battingPct}%` }}
        >
          {battingPct}%
        </div>
        <div 
          className="winprob-fill bowling" 
          style={{ width: `${bowlingPct}%` }}
        >
          {bowlingPct}%
        </div>
      </div>
      <div className="winprob-labels">
        <span className="winprob-label">{team1}</span>
        <span className="winprob-label">{team2}</span>
      </div>
      <div className="winprob-method">
        Model: {winProb.method}
      </div>
    </div>
  );
}
