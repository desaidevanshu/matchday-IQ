import React from 'react';

export default function SHAPChart({ shapData }) {
  if (!shapData || !shapData.shapValues) return null;

  const maxAbsValue = Math.max(
    ...shapData.shapValues.map(sv => Math.abs(sv.shapValue)),
    0.01
  );

  return (
    <div className="shap-chart">
      <div style={{ 
        fontFamily: 'var(--font-mono)', 
        fontSize: '0.65rem', 
        color: 'var(--text-muted)', 
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>← Decreases win prob</span>
        <span>Baseline: {(shapData.baseValue * 100).toFixed(0)}%</span>
        <span>Increases win prob →</span>
      </div>

      {shapData.shapValues.map((sv, i) => {
        const barWidth = Math.abs(sv.shapValue) / maxAbsValue * 40;
        const isPositive = sv.shapValue >= 0;

        return (
          <div key={i} className="shap-bar-row">
            <div className="shap-feature-name">
              {sv.feature}
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                = {sv.value}
              </div>
            </div>
            <div className="shap-bar-container">
              <div className="shap-bar-center" />
              <div 
                className={`shap-bar ${isPositive ? 'positive' : 'negative'}`}
                style={{ width: `${barWidth}%` }}
                title={sv.description}
              />
            </div>
            <div className="shap-value">
              {sv.shapValue > 0 ? '+' : ''}{(sv.shapValue * 100).toFixed(1)}%
            </div>
          </div>
        );
      })}

      <div style={{ 
        textAlign: 'right', 
        fontFamily: 'var(--font-mono)', 
        fontSize: '0.7rem', 
        marginTop: 8,
        color: 'var(--accent-lime)'
      }}>
        Output: {(shapData.outputValue * 100).toFixed(0)}% win probability
      </div>

      <div className="shap-disclaimer">
        {shapData.disclaimer}
      </div>
    </div>
  );
}
