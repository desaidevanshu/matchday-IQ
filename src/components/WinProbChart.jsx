import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * Simple horizontal bar chart showing batting vs bowling win probability.
 * Uses CSS variables for colors so it adapts automatically to light/dark themes.
 */
export default function WinProbChart({ winProb }) {
  const data = [
    { name: 'Batting', value: winProb },
    { name: 'Bowling', value: 100 - winProb },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar
          dataKey="value"
          fill="var(--accent-lime)"
          radius={[0, 5, 5, 0]}
          background={{ fill: 'var(--accent-red)' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

