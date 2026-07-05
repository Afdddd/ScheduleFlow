import React, { useState } from 'react';
import StatusPill from '../components/ui/StatusPill';
import Chip from '../components/ui/Chip';
import ScheduleCard from '../components/ui/ScheduleCard';
import BottomSheet from '../components/ui/BottomSheet';
import Fab from '../components/ui/Fab';
import AppBar from '../components/ui/AppBar';
import SectionHeader from '../components/ui/SectionHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import TextField from '../components/ui/TextField';
import Avatar from '../components/ui/Avatar';
import ListRow from '../components/ui/ListRow';
import StatTiles from '../components/ui/StatTiles';
import Thumbnail from '../components/ui/Thumbnail';
import EmptyState from '../components/ui/EmptyState';
import Calendar from '../components/ui/Calendar';

/**
 * UiPreviewPage — 공통 컴포넌트 개발용 갤러리.
 *
 * 인증 없이 /ui-preview 로 접근해 컴포넌트 상태/변형을 눈으로 확인한다.
 * 실제 서비스 화면이 아니라 개발 확인용. (정식 출시 전 제거하거나 개발 전용으로 분리)
 */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-xs font-bold tracking-wide text-gray-400">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const UiPreviewPage: React.FC = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seg, setSeg] = useState<'list' | 'calendar'>('list');
  const [text, setText] = useState('현장 실측 미팅');
  const [memo, setMemo] = useState('');
  const [cal, setCal] = useState({ year: 2026, month: 7, day: 3 });

  const calMarkers: Record<number, string[]> = {
    2: ['#1B9E5A'],
    3: ['#3457D5', '#1B9E5A', '#D9822B'],
    4: ['#8B5CF6', '#3457D5'],
    7: ['#3457D5'],
    9: ['#D9822B'],
    14: ['#1B9E5A'],
    17: ['#3457D5'],
  };
  const stepMonth = (delta: number) =>
    setCal((c) => {
      const m0 = c.month - 1 + delta;
      return { year: c.year + Math.floor(m0 / 12), month: ((m0 % 12) + 12) % 12 + 1, day: 0 };
    });

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 p-4">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">공통 컴포넌트 미리보기</h1>
      <p className="mb-6 text-sm text-gray-500">모바일·웹이 공유하는 UI 조각들 (개발 확인용)</p>

      <Section title="APP BAR — 상단 바 (목록형 / 상세형)">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <AppBar title="일정" subtitle="7월 3일 목요일" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <AppBar
            title="일정 상세"
            onBack={() => {}}
            right={
              <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            }
          />
        </div>
      </Section>

      <Section title="SECTION HEADER — 구획 머리말">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <SectionHeader title="오늘 내 일정" action={{ label: '전체 보기' }} />
          <SectionHeader title="내 할 일" className="mb-0" />
        </div>
      </Section>

      <Section title="SEGMENTED CONTROL — 토글 (리스트/캘린더)">
        <SegmentedControl
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'list', label: '리스트' },
            { value: 'calendar', label: '캘린더' },
          ]}
        />
        <p className="text-sm text-gray-400">선택: {seg}</p>
      </Section>

      <Section title="TEXT FIELD — 입력 필드">
        <TextField label="제목" value={text} onChange={setText} placeholder="일정 제목" />
        <TextField
          label="메모"
          hint="(안 써도 돼요)"
          value={memo}
          onChange={setMemo}
          placeholder="예: 외벽 균열 부분"
          multiline
          rows={3}
        />
      </Section>

      <Section title="STATUS PILL — 상태 배지 (색 + 글자)">
        <div className="flex flex-wrap gap-2">
          <StatusPill status="planned" />
          <StatusPill status="ongoing" />
          <StatusPill status="delayed" />
          <StatusPill status="done" />
        </div>
      </Section>

      <Section title="CHIP — 프로젝트/라벨 칩">
        <div className="flex flex-wrap gap-2">
          <Chip label="판교 리모델링" color="#3457D5" />
          <Chip label="A동 신축" color="#1B9E5A" />
          <Chip label="3분기 납품" color="#D9822B" />
          <Chip label="색점 없음" />
        </div>
      </Section>

      <Section title="SCHEDULE CARD — 일정 카드">
        <ScheduleCard
          time="09:30"
          duration="1시간"
          title="현장 실측 미팅"
          status="planned"
          projectName="판교 리모델링"
          projectColor="#3457D5"
          onClick={() => {}}
        />
        <ScheduleCard
          time="14:00"
          duration="30분"
          title="협력사 정기 회의"
          status="ongoing"
          projectName="A동 신축"
          projectColor="#1B9E5A"
        />
        <ScheduleCard
          time="11:00"
          duration="지연"
          title="자재 발주서 확인 — 대한건설"
          status="delayed"
          projectName="3분기 납품"
          projectColor="#D9822B"
        />
      </Section>

      <Section title="CALENDAR — 월간 캘린더 (조회용, dot 밀도)">
        <Calendar
          year={cal.year}
          month={cal.month}
          selectedDate={cal.day}
          markers={cal.month === 7 && cal.year === 2026 ? calMarkers : undefined}
          onSelectDate={(day) => setCal((c) => ({ ...c, day }))}
          onPrevMonth={() => stepMonth(-1)}
          onNextMonth={() => stepMonth(1)}
        />
        <p className="text-sm text-gray-400">선택: {cal.year}.{cal.month}.{cal.day || '-'} · 날짜/화살표 눌러보세요</p>
      </Section>

      <Section title="STAT TILES — 요약 통계 (홈 상단)">
        <StatTiles
          stats={[
            { value: 3, label: '오늘 일정' },
            { value: 1, label: '진행 중' },
            { value: 1, label: '지연', highlight: true },
          ]}
        />
      </Section>

      <Section title="AVATAR — 이니셜 아바타">
        <div className="flex items-center gap-3">
          <Avatar name="박지훈" color="#8B5CF6" size="sm" />
          <Avatar name="이서연" color="#1B9E5A" size="md" />
          <Avatar name="최동욱" color="#D9822B" size="lg" />
        </div>
      </Section>

      <Section title="LIST ROW — 목록 줄 (더보기/설정)">
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <ListRow
            label="거래처"
            iconBg="#3457D5"
            icon={<span className="text-xs font-bold">거</span>}
            trailing={<Chip label="42" />}
            showChevron
            onClick={() => {}}
          />
          <ListRow
            label="파일함"
            iconBg="#1B9E5A"
            icon={<span className="text-xs font-bold">파</span>}
            trailing={<Chip label="128" />}
            showChevron
            onClick={() => {}}
          />
          <ListRow label="로그아웃" danger onClick={() => {}} />
        </div>
      </Section>

      <Section title="THUMBNAIL — 현장 사진/영상 썸네일">
        <div className="grid grid-cols-3 gap-1.5">
          <Thumbnail color="#c8a06a" badge="방금" who="나" />
          <Thumbnail color="#3a4a6b" video duration="0:18" who="박지훈" />
          <Thumbnail color="#7fa88a" who="이서연" />
          <Thumbnail color="#b0837f" />
          <Thumbnail color="#8b8fa0" video duration="0:31" />
          <Thumbnail color="#a0956a" />
        </div>
      </Section>

      <Section title="EMPTY STATE — 빈 목록">
        <div className="rounded-2xl border border-gray-200 bg-white">
          <EmptyState
            title="아직 등록된 일정이 없어요"
            description="오늘 할 일을 추가해보세요"
            icon={
              <svg className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            }
            action={{ label: '＋ 일정 추가' }}
          />
        </div>
      </Section>

      <Section title="BOTTOM SHEET — 아래에서 올라오는 시트">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full rounded-2xl bg-blue-500 py-4 text-base font-bold text-white transition-transform active:scale-[0.99]"
        >
          시트 열기
        </button>
      </Section>

      <Section title="FAB — 플로팅 액션 버튼 (우하단 고정)">
        <p className="text-sm text-gray-400">→ 화면 오른쪽 아래를 보세요</p>
      </Section>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="새 일정" onConfirm={() => setSheetOpen(false)}>
        <div className="space-y-4 pt-2">
          <TextField label="제목" value={text} onChange={setText} placeholder="일정 제목" />
          <TextField label="메모" hint="(선택)" value={memo} onChange={setMemo} placeholder="상세 내용" multiline rows={2} />
          <p className="text-center text-xs text-gray-400">← 컴포넌트를 조합하면 이렇게 생성 폼이 됩니다</p>
        </div>
      </BottomSheet>

      <Fab label="새 일정" onClick={() => setSheetOpen(true)} />
    </div>
  );
};

export default UiPreviewPage;
