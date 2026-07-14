import React, { useEffect, useState } from 'react';
import { getUserList, UserListResponse } from '../api/list';
import MobileSearchInput from '../components/mobile/MobileSearchInput';
import UserCreateDialog from '../components/UserCreateDialog';
import UserEditDialog from '../components/UserEditDialog';

/**
 * MobileUserList — 모바일 '사원 관리' (더보기 → 사원 관리, ADMIN).
 * 검색 + 사원 행(아바타·이름·권한 배지·직급/전화).
 */

const COLORS = ['#0B4EC4', '#1B9E5A', '#8B5CF6', '#C6771A', '#E5484D'];

const MobileUserList: React.FC = () => {
  const [items, setItems] = useState<UserListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListResponse | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getUserList(keyword, 0, 100);
        if (alive) setItems(res.content);
      } catch (e) {
        console.error('사원 목록 로딩 실패:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [keyword, reload]);

  return (
    <div className="min-h-full bg-gray-50 pb-24">
      <div className="flex items-center px-[18px] pb-2 pt-3">
        <h1 className="flex-1 text-[25px] font-extrabold tracking-tight text-gray-900">사원 관리</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1 rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-bold text-white shadow-sm shadow-primary-500/25 active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          사원 등록
        </button>
      </div>
      <div className="px-[18px] pb-3">
        <MobileSearchInput onSearch={setKeyword} placeholder="사원 이름으로 검색" />
      </div>

      <div className="px-[18px]">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm font-semibold text-gray-400 shadow-sm">
            불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm font-semibold text-gray-400">
            사원이 없어요
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {items.map((u, i) => {
              const isAdmin = u.role === 'ADMIN';
              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setEditUser(u)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <span
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {u.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15.5px] font-bold text-gray-900">{u.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                          isAdmin ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isAdmin ? '관리자' : '사원'}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] font-medium text-gray-500">
                      {[u.position, u.phone].filter(Boolean).join(' · ') || u.username}
                    </div>
                  </div>
                  <svg className="h-4 w-4 flex-none text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <UserCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => setReload((n) => n + 1)} />
      <UserEditDialog open={editUser !== null} user={editUser} onClose={() => setEditUser(null)} onSaved={() => setReload((n) => n + 1)} />
    </div>
  );
};

export default MobileUserList;
