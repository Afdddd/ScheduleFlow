import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListView, { ListColumn } from '../components/list/ListView';
import { GLYPH_TONES } from '../components/list/Badge';
import { NameCell, Glyph, Num, Muted } from '../components/list/cells';
import MobilePartnerList from './MobilePartnerList';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAuthStore } from '../stores/authStore';
import { getPartnerList, PartnerListResponse, PageResponse } from '../api/list';

/**
 * 거래처 목록 페이지 — 데스크톱은 공통 `ListView`(컬럼형), 모바일은 전용 화면.
 */
const PartnerListPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');

  const [data, setData] = useState<PageResponse<PartnerListResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isMobile) return;
    let alive = true;
    setLoading(true);
    getPartnerList(searchQuery, currentPage, pageSize)
      .then((res) => alive && setData(res))
      .catch((e) => console.error('거래처 목록 로딩 실패:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [searchQuery, currentPage, isMobile]);

  if (isMobile) return <MobilePartnerList />;

  const columns: ListColumn<PartnerListResponse>[] = [
    {
      key: 'company',
      header: '회사명',
      width: 'minmax(0,1.6fr)',
      render: (p) => (
        <NameCell lead={<Glyph text={p.companyName.charAt(0)} tone={GLYPH_TONES.blue} />}>{p.companyName}</NameCell>
      ),
    },
    {
      key: 'phone',
      header: '대표 전화',
      width: '190px',
      render: (p) => <Num>{p.mainPhone || '-'}</Num>,
    },
    {
      key: 'address',
      header: '주소',
      width: 'minmax(0,1.8fr)',
      render: (p) => <Muted>{p.address || '-'}</Muted>,
    },
  ];

  return (
    <ListView<PartnerListResponse>
      columns={columns}
      items={data?.content ?? []}
      rowKey={(p) => p.id}
      loading={loading}
      onRowClick={(p) => navigate(`/partners/${p.id}`)}
      searchPlaceholder="회사명으로 검색"
      searchInitial={searchQuery}
      onSearch={(q) => {
        setSearchQuery(q);
        setCurrentPage(0);
      }}
      createButton={isAdmin ? { label: '새 거래처', onClick: () => navigate('/partners/new') } : undefined}
      totalLabel={data ? <><b className="font-extrabold text-gray-900">{data.totalElements}개</b> 거래처</> : null}
      empty={{
        icon: (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
          </svg>
        ),
        title: searchQuery ? '검색 결과가 없어요' : '아직 거래처가 없어요',
        description: searchQuery ? '다른 검색어로 찾아보세요.' : '거래처를 등록하면 프로젝트에 연결할 수 있어요.',
        action: isAdmin && !searchQuery ? { label: '새 거래처', onClick: () => navigate('/partners/new') } : undefined,
      }}
      currentPage={data?.currentPage ?? 0}
      totalPages={data?.totalPages ?? 0}
      totalElements={data?.totalElements ?? 0}
      onPageChange={setCurrentPage}
    />
  );
};

export default PartnerListPage;
