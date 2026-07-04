import React from 'react';

interface CalendarProps {
  year: number;
  month: number; // 1-12
  /** 선택된 날짜(일). 이 달 기준. */
  selectedDate?: number;
  onSelectDate?: (day: number) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  /** 일(1-31) → dot 색 배열. 그 날 일정 유무/색 표시. */
  markers?: Record<number, string[]>;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Cell {
  day: number;
  current: boolean; // 이번 달 날짜인지 (아니면 앞뒤 채움)
}

/** 월 그리드 셀 배열 생성 (앞뒤 달로 주 단위를 채운다). */
function buildCells(year: number, month: number): Cell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevLast = new Date(year, month - 1, 0).getDate();

  const cells: Cell[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: prevLast - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  // 항상 6주(42칸)로 채워 높이를 고정한다. 달마다 5줄/6줄로 바뀌며
  // 아래 콘텐츠가 튀는(레이아웃 점프) 걸 방지.
  let next = 1;
  while (cells.length < 42) cells.push({ day: next++, current: false });
  return cells;
}

/**
 * Calendar — 월간 캘린더 (조회용).
 *
 * 설계 포인트: 모바일에서 월간 편집은 답답하므로, 이 컴포넌트는 **조회 전용**.
 * 날짜에 일정이 있으면 **dot(최대 3개)** 로 밀도만 보여주고, 날짜를 탭하면
 * 부모가 그 날 일정 목록을 아래에 펼치는 식으로 쓴다. (생성/수정은 시트로 분리)
 */
const Calendar: React.FC<CalendarProps> = ({
  year,
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  markers,
}) => {
  const cells = buildCells(year, month);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="이전 달"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 active:scale-95"
        >
          ‹
        </button>
        <b className="text-base font-bold tracking-tight">
          {year}년 {month}월
        </b>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="다음 달"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 active:scale-95"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`py-1.5 text-center text-xs font-semibold ${
              i === 0 ? 'text-red-400' : i === 6 ? "text-blue-400" : 'text-gray-400'
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((c, idx) => {
          const selected = c.current && c.day === selectedDate;
          const dots = c.current && markers ? markers[c.day] ?? [] : [];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => c.current && onSelectDate?.(c.day)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm tabular-nums ${
                selected
                  ? 'bg-primary-500 font-bold text-white'
                  : c.current
                    ? 'text-gray-900 active:bg-gray-100'
                    : 'text-gray-300'
              }`}
            >
              {c.day}
              {dots.length > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {dots.slice(0, 3).map((color, i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: selected ? '#fff' : color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
