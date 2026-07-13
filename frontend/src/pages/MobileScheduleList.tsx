import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfMonth,
  startOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import SegmentedControl from '../components/ui/SegmentedControl';
import MobileScheduleCreateSheet from './MobileScheduleCreateSheet';
import { scheduleTypeLabel } from '../constants/scheduleTypes';
import { useAuthStore } from '../stores/authStore';
import { getScheduleList, ScheduleListResponse } from '../api/list';

/**
 * MobileScheduleList — 모바일 '일정' 탭. 리스트 / 캘린더 두 뷰.
 *
 * 데이터는 데스크톱과 같은 `getScheduleList`(카드로 렌더). 일정은 날짜 구간 기반이라
 * 캘린더는 구간이 걸친 날에 점을 찍고, 날짜를 누르면 그 날 진행 일정을 보여준다.
 * ISO 날짜 문자열(yyyy-MM-dd) 비교로 구간 판정.
 */


const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const MobileScheduleList: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  const [items, setItems] = useState<ScheduleListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState<'list' | 'cal'>('cal');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getScheduleList(keyword, 0, 100);
        if (alive) setItems(res.content);
      } catch (e) {
        console.error('일정 목록 로딩 실패:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [keyword, reload]);

  const renderCard = (s: ScheduleListResponse) => (
    <button
      key={s.id}
      onClick={() => navigate(`/schedules/${s.id}`)}
      className="flex w-full items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-transform active:scale-[0.99]"
    >
      <span className="w-1.5 flex-none bg-primary-500" />
      <span className="min-w-0 flex-1 px-4 py-3.5">
        <span className="block truncate text-[16px] font-bold text-gray-900">{s.title}</span>
        <span className="mt-2 flex flex-wrap items-center gap-2">
          {s.projectName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[13px] font-bold text-gray-700">
              <span className="h-2 w-2 rounded-full bg-primary-500" />
              {s.projectName}
            </span>
          )}
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[12.5px] font-bold text-primary-700">
            {scheduleTypeLabel(s.type)}
          </span>
        </span>
        <span className="mt-2 block text-[13px] font-semibold text-gray-400 tabular-nums">
          {s.startDate} – {s.endDate}
        </span>
      </span>
    </button>
  );

  return (
    <div className="min-h-full bg-gray-50 pb-28">
      <div className="flex items-center px-[18px] pb-3 pt-3">
        <h1 className="flex-1 text-[25px] font-extrabold tracking-tight text-gray-900">일정</h1>
      </div>

      <div className="px-[18px] pb-3">
        <SegmentedControl
          options={[
            { value: 'cal', label: '캘린더' },
            { value: 'list', label: '리스트' },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'list' ? (
        <>
          <div className="px-[18px] pb-3">
            <SearchInput onSearch={setKeyword} placeholder="일정 제목으로 검색" />
          </div>
          <div className="flex flex-col gap-2.5 px-[18px] pt-1">
            {loading ? (
              <CenterBox>불러오는 중…</CenterBox>
            ) : items.length === 0 ? (
              <EmptyBox>일정이 없어요</EmptyBox>
            ) : (
              items.map(renderCard)
            )}
          </div>
        </>
      ) : (
        <CalendarView items={items} loading={loading} renderCard={renderCard} />
      )}

      {isAdmin && (
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 py-[15px] pl-[18px] pr-[22px] text-[16px] font-extrabold text-white shadow-xl shadow-primary-500/40 transition-transform active:scale-95"
        >
          <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          새 일정
        </button>
      )}

      <MobileScheduleCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={() => setReload((r) => r + 1)}
      />
    </div>
  );
};

/* ---- 캘린더 뷰 ---- */
const CalendarView: React.FC<{
  items: ScheduleListResponse[];
  loading: boolean;
  renderCard: (s: ScheduleListResponse) => React.ReactNode;
}> = ({ items, loading, renderCard }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(todayStr);

  const days = useMemo(() => {
    // 달마다 주 수가 5/6으로 달라지면 캘린더 높이가 바뀌어 아래 목록이 위아래로 밀린다.
    // 항상 6주(42칸)를 그려 높이를 고정한다. (마지막 주가 비면 다음 달 날짜로 채움)
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const out: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [month]);

  const spans = (s: ScheduleListResponse, dayStr: string) => s.startDate <= dayStr && dayStr <= s.endDate;
  const selectedItems = items.filter((s) => spans(s, selected));

  return (
    <div className="px-[18px]">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* 월 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setMonth(subMonths(month, 1))} aria-label="이전 달" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            ‹
          </button>
          <b className="text-[15px] font-extrabold tracking-tight text-gray-900">{format(month, 'yyyy년 M월')}</b>
          <button onClick={() => setMonth(addMonths(month, 1))} aria-label="다음 달" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            ›
          </button>
        </div>

        {/* 요일 */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-1 text-center text-[11px] font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-primary-500' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, month);
            const isSel = dayStr === selected;
            const has = items.some((s) => spans(s, dayStr));
            return (
              <button
                key={dayStr}
                onClick={() => setSelected(dayStr)}
                className="relative flex aspect-square flex-col items-center justify-center"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold tabular-nums ${
                    isSel
                      ? 'bg-primary-500 text-white'
                      : isToday(day)
                      ? 'text-primary-600'
                      : inMonth
                      ? 'text-gray-800'
                      : 'text-gray-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {has && !isSel && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택 날짜 일정 */}
      <div className="mt-4 flex items-center gap-2 px-0.5">
        <span className="h-2 w-2 rounded-full bg-primary-500" />
        <span className="text-[14.5px] font-extrabold text-gray-800">{format(new Date(selected), 'M월 d일')} 일정 {selectedItems.length}건</span>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {loading ? (
          <CenterBox>불러오는 중…</CenterBox>
        ) : selectedItems.length === 0 ? (
          <EmptyBox>이 날 일정이 없어요</EmptyBox>
        ) : (
          selectedItems.map(renderCard)
        )}
      </div>
    </div>
  );
};

/* ---- 공용 작은 컴포넌트 ---- */
const CenterBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm font-semibold text-gray-400 shadow-sm">
    {children}
  </div>
);
const EmptyBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm font-semibold text-gray-400">
    {children}
  </div>
);

/** 모바일용 인라인 검색 입력. */
const SearchInput: React.FC<{ onSearch: (q: string) => void; placeholder?: string }> = ({ onSearch, placeholder }) => {
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(q.trim());
      }}
      className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:border-primary-500"
    >
      <svg className="h-5 w-5 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
      />
      {q && (
        <button type="button" onClick={() => { setQ(''); onSearch(''); }} aria-label="지우기" className="flex-none text-gray-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
};

export default MobileScheduleList;
