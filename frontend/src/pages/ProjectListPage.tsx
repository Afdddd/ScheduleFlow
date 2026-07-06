import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListView, { ListColumn } from '../components/list/ListView';
import Badge, { BadgeTone } from '../components/list/Badge';
import { NameCell, Dot, Sub, Num } from '../components/list/cells';
import MobileProjectList from './MobileProjectList';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAuthStore } from '../stores/authStore';
import { getProjectList, ProjectListResponse, PageResponse } from '../api/list';

/**
 * 프로젝트 목록 페이지 — 데스크톱은 공통 `ListView`(컬럼형), 모바일은 전용 화면.
 */

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  IN_PROGRESS: { label: '진행 중', tone: 'blue' },
  ON_HOLD: { label: '보류', tone: 'amber' },
  COMPLETE: { label: '완료', tone: 'green' },
};
const statusOf = (s: string) => STATUS[s] ?? { label: s, tone: 'gray' as BadgeTone };
const fmtDate = (s: string) => s.replace(/-/g, '.');

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');

  const [data, setData] = useState<PageResponse<ProjectListResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isMobile) return;
    let alive = true;
    setLoading(true);
    getProjectList(searchQuery, currentPage, pageSize)
      .then((res) => alive && setData(res))
      .catch((e) => console.error('프로젝트 목록 로딩 실패:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [searchQuery, currentPage, isMobile]);

  if (isMobile) return <MobileProjectList />;

  const columns: ListColumn<ProjectListResponse>[] = [
    {
      key: 'name',
      header: '프로젝트',
      width: 'minmax(0,2.2fr)',
      render: (p) => <NameCell lead={<Dot color={p.colorCode} />}>{p.name}</NameCell>,
    },
    {
      key: 'client',
      header: '거래처',
      width: 'minmax(0,1.2fr)',
      render: (p) => <Sub>{p.clientName}</Sub>,
    },
    {
      key: 'period',
      header: '기간',
      width: '210px',
      render: (p) => (
        <Num>
          {fmtDate(p.startDate)} ~ {fmtDate(p.endDate)}
        </Num>
      ),
    },
    {
      key: 'status',
      header: '상태',
      width: '128px',
      render: (p) => {
        const s = statusOf(p.status);
        return <Badge label={s.label} tone={s.tone} />;
      },
    },
  ];

  return (
    <ListView<ProjectListResponse>
      columns={columns}
      items={data?.content ?? []}
      rowKey={(p) => p.id}
      loading={loading}
      onRowClick={(p) => navigate(`/projects/${p.id}`)}
      searchPlaceholder="프로젝트명 · 거래처로 검색"
      searchInitial={searchQuery}
      onSearch={(q) => {
        setSearchQuery(q);
        setCurrentPage(0);
      }}
      createButton={isAdmin ? { label: '새 프로젝트', onClick: () => navigate('/projects/new') } : undefined}
      totalLabel={data ? <><b className="font-extrabold text-gray-900">{data.totalElements}개</b> 프로젝트</> : null}
      empty={{
        icon: (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6M7 3h6l6 6v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        ),
        title: searchQuery ? '검색 결과가 없어요' : '아직 프로젝트가 없어요',
        description: searchQuery ? '다른 검색어로 찾아보세요.' : '첫 프로젝트를 등록해 일정과 파일을 한곳에서 관리해 보세요.',
        action: isAdmin && !searchQuery ? { label: '새 프로젝트', onClick: () => navigate('/projects/new') } : undefined,
      }}
      currentPage={data?.currentPage ?? 0}
      totalPages={data?.totalPages ?? 0}
      totalElements={data?.totalElements ?? 0}
      onPageChange={setCurrentPage}
    />
  );
};

export default ProjectListPage;
