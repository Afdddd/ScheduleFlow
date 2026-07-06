import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListView, { ListColumn } from '../components/list/ListView';
import Badge from '../components/list/Badge';
import { NameCell, Sub, Num, Muted } from '../components/list/cells';
import MobileScheduleList from './MobileScheduleList';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAuthStore } from '../stores/authStore';
import { getScheduleList, ScheduleListResponse, PageResponse } from '../api/list';

/**
 * 일정 목록 페이지 — 데스크톱은 공통 `ListView`(컬럼형), 모바일은 전용 화면.
 */

const TYPE_LABEL: Record<string, string> = {
  PROJECT: '프로젝트 일정',
  TEST_RUN: '시운전',
  WIRING: '전기 배선',
  DESIGN: '설계',
  MEETING: '미팅',
};
const typeLabelOf = (t: string) => TYPE_LABEL[t] ?? t;
const fmtDate = (s: string) => s.replace(/-/g, '.');
// memberNames는 백엔드 목록 응답에 아직 없어 undefined일 수 있다(이슈 #101에서 채울 예정). 방어적으로 처리.
const membersLabel = (names?: string[]) =>
  !names || names.length === 0 ? '-' : names.length === 1 ? names[0] : `${names[0]} 외 ${names.length - 1}`;

const ScheduleListPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');

  const [data, setData] = useState<PageResponse<ScheduleListResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isMobile) return;
    let alive = true;
    setLoading(true);
    getScheduleList(searchQuery, currentPage, pageSize)
      .then((res) => alive && setData(res))
      .catch((e) => console.error('일정 목록 로딩 실패:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [searchQuery, currentPage, isMobile]);

  if (isMobile) return <MobileScheduleList />;

  const columns: ListColumn<ScheduleListResponse>[] = [
    {
      key: 'title',
      header: '일정 제목',
      width: 'minmax(0,2fr)',
      render: (s) => <NameCell>{s.title}</NameCell>,
    },
    {
      key: 'project',
      header: '프로젝트',
      width: 'minmax(0,1.3fr)',
      render: (s) => <Sub>{s.projectName || '-'}</Sub>,
    },
    {
      key: 'type',
      header: '유형',
      width: '118px',
      render: (s) => <Badge label={typeLabelOf(s.type)} tone="gray" dot={false} />,
    },
    {
      key: 'period',
      header: '기간',
      width: '190px',
      render: (s) => (
        <Num>
          {fmtDate(s.startDate)} ~ {fmtDate(s.endDate)}
        </Num>
      ),
    },
    {
      key: 'members',
      header: '참여자',
      width: '130px',
      render: (s) => <Muted>{membersLabel(s.memberNames)}</Muted>,
    },
  ];

  return (
    <ListView<ScheduleListResponse>
      columns={columns}
      items={data?.content ?? []}
      rowKey={(s) => s.id}
      loading={loading}
      onRowClick={(s) => navigate(`/schedules/${s.id}`)}
      searchPlaceholder="일정 제목으로 검색"
      searchInitial={searchQuery}
      onSearch={(q) => {
        setSearchQuery(q);
        setCurrentPage(0);
      }}
      createButton={isAdmin ? { label: '새 일정', onClick: () => navigate('/schedules/new') } : undefined}
      totalLabel={data ? <><b className="font-extrabold text-gray-900">{data.totalElements}개</b> 일정</> : null}
      empty={{
        icon: (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        title: searchQuery ? '검색 결과가 없어요' : '아직 일정이 없어요',
        description: searchQuery ? '다른 검색어로 찾아보세요.' : '새 일정을 만들어 팀원에게 배정해 보세요.',
        action: isAdmin && !searchQuery ? { label: '새 일정', onClick: () => navigate('/schedules/new') } : undefined,
      }}
      currentPage={data?.currentPage ?? 0}
      totalPages={data?.totalPages ?? 0}
      totalElements={data?.totalElements ?? 0}
      onPageChange={setCurrentPage}
    />
  );
};

export default ScheduleListPage;
