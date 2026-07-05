import React from 'react';

interface Stat {
  value: React.ReactNode;
  label: string;
  /** 강조(주의) — 숫자를 앰버색으로. 예: 지연 건수 */
  highlight?: boolean;
}

interface StatTilesProps {
  stats: Stat[];
}

/**
 * StatTiles — 요약 통계 카드 줄 (예: 오늘 일정 3 · 진행중 1 · 지연 1).
 * 홈 상단에서 "지금 상황"을 한눈에. 요약을 먼저 보여주는 대시보드 원칙.
 */
const StatTiles: React.FC<StatTilesProps> = ({ stats }) => (
  <div className="flex gap-2">
    {stats.map((s, i) => (
      <div key={i} className="flex-1 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className={`text-2xl font-extrabold tabular-nums tracking-tight ${s.highlight ? 'text-amber-600' : 'text-gray-900'}`}>
          {s.value}
        </div>
        <div className="mt-0.5 text-xs font-semibold text-gray-400">{s.label}</div>
      </div>
    ))}
  </div>
);

export default StatTiles;
