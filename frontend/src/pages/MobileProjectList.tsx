import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getProjectList, ProjectListResponse } from '../api/list';

/**
 * MobileProjectList — 모바일 '프로젝트' 탭.
 *
 * 데스크톱 표(ProjectListPage) 대신 카드 리스트로. 데이터는 같은 `getProjectList` 사용.
 * 상단 필터 칩(상태별) + 프로젝트 카드(색 띠·기간·상태). 우하단 FAB로 새 프로젝트.
 */

const STATUS: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: '진행중', cls: 'text-green-700 bg-green-50' },
  ON_HOLD: { label: '보류', cls: 'text-amber-700 bg-amber-50' },
  COMPLETE: { label: '완료', cls: 'text-gray-500 bg-gray-100' },
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'IN_PROGRESS', label: '진행중' },
  { key: 'ON_HOLD', label: '보류' },
  { key: 'COMPLETE', label: '완료' },
];

const DEFAULT_COLOR = '#0B4EC4';

const MobileProjectList: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [projects, setProjects] = useState<ProjectListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getProjectList('', 0, 100);
        if (alive) setProjects(res.content);
      } catch (e) {
        console.error('프로젝트 목록 로딩 실패:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: projects.length };
    for (const p of projects) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [projects]);

  const shown = filter === 'ALL' ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      {/* 앱바 */}
      <div className="flex items-center px-[18px] pb-3 pt-3">
        <h1 className="flex-1 text-[25px] font-extrabold tracking-tight text-gray-900">프로젝트</h1>
      </div>

      {/* 필터 칩 */}
      <div className="flex gap-2 overflow-x-auto px-[18px] pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          const n = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-none whitespace-nowrap rounded-full border px-4 py-2 text-[14.5px] font-bold transition-colors ${
                on
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {f.label} {n}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 px-[18px] pt-1">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm font-semibold text-gray-400 shadow-sm">
            불러오는 중…
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm font-semibold text-gray-400">
            프로젝트가 없어요
          </div>
        ) : (
          shown.map((p) => {
            const color = p.colorCode ?? DEFAULT_COLOR;
            const st = STATUS[p.status] ?? { label: p.status, cls: 'text-gray-500 bg-gray-100' };
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 pl-[18px] text-left shadow-sm transition-transform active:scale-[0.99]"
              >
                <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: color }} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-bold text-gray-900">{p.name}</div>
                    <div className="mt-1 truncate text-[13.5px] font-medium text-gray-500">{p.clientName}</div>
                  </div>
                  <span className={`flex-none rounded-full px-2.5 py-1 text-[12.5px] font-bold ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <div className="mt-2.5 text-[13px] font-semibold text-gray-400 tabular-nums">
                  {p.startDate} – {p.endDate}
                </div>
              </button>
            );
          })
        )}
      </div>

      {isAdmin && (
        <button
          onClick={() => navigate('/projects/new')}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 py-[15px] pl-[18px] pr-[22px] text-[16px] font-extrabold text-white shadow-xl shadow-primary-500/40 transition-transform active:scale-95"
        >
          <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 프로젝트
        </button>
      )}
    </div>
  );
};

export default MobileProjectList;
