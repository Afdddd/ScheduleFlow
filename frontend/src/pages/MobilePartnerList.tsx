import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getPartnerList, PartnerListResponse } from '../api/list';
import MobileSearchInput from '../components/mobile/MobileSearchInput';

/**
 * MobilePartnerList — 모바일 '거래처' (더보기 → 거래처).
 * 데스크톱 표 대신 카드 리스트. 검색 + FAB(관리자). 카드 탭 → 상세.
 */
const MobilePartnerList: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [items, setItems] = useState<PartnerListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getPartnerList(keyword, 0, 100);
        if (alive) setItems(res.content);
      } catch (e) {
        console.error('거래처 목록 로딩 실패:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [keyword]);

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      <div className="flex items-center px-[18px] pb-2 pt-3">
        <h1 className="flex-1 text-[25px] font-extrabold tracking-tight text-gray-900">거래처</h1>
      </div>
      <div className="px-[18px] pb-3">
        <MobileSearchInput onSearch={setKeyword} placeholder="회사명으로 검색" />
      </div>

      <div className="flex flex-col gap-2.5 px-[18px] pt-1">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm font-semibold text-gray-400 shadow-sm">
            불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm font-semibold text-gray-400">
            거래처가 없어요
          </div>
        ) : (
          items.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/partners/${p.id}`)}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="text-[16px] font-extrabold text-gray-900">{p.companyName}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-gray-500">
                {p.mainPhone && <span>📞 {p.mainPhone}</span>}
                {p.address && <span className="truncate">· {p.address}</span>}
              </div>
            </button>
          ))
        )}
      </div>

      {isAdmin && (
        <button
          onClick={() => navigate('/partners/new')}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 py-[15px] pl-[18px] pr-[22px] text-[16px] font-extrabold text-white shadow-xl shadow-primary-500/40 transition-transform active:scale-95"
        >
          <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 거래처
        </button>
      )}
    </div>
  );
};

export default MobilePartnerList;
