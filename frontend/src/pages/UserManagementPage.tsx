import React, { useState, useEffect } from 'react';
import ListView, { ListColumn } from '../components/list/ListView';
import Badge, { BadgeTone } from '../components/list/Badge';
import { NameCell, Avatar, Sub, Muted, Num } from '../components/list/cells';
import { getUserList, UserListResponse, PageResponse } from '../api/list';
import MobileUserList from './MobileUserList';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * 사원 관리 페이지 (ADMIN 전용) — 데스크톱은 공통 `ListView`(컬럼형), 모바일은 전용 화면.
 */

const ROLE: Record<string, { label: string; tone: BadgeTone }> = {
  ADMIN: { label: '관리자', tone: 'red' },
  STAFF: { label: '일반', tone: 'blue' },
};
const roleOf = (r: string) => ROLE[r] ?? { label: r, tone: 'gray' as BadgeTone };

// 아바타 배경 — 이름 첫 글자로 팔레트에서 안정적으로 선택(같은 사람은 항상 같은 색).
const AVATAR_BG = ['bg-primary-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500', 'bg-primary-600'];
const avatarBg = (name: string) => AVATAR_BG[(name.charCodeAt(0) || 0) % AVATAR_BG.length];

const UserManagementPage: React.FC = () => {
  const isMobile = useIsMobile();

  const [data, setData] = useState<PageResponse<UserListResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isMobile) return;
    let alive = true;
    setLoading(true);
    getUserList(searchQuery, currentPage, pageSize)
      .then((res) => alive && setData(res))
      .catch((e) => console.error('사원 목록 로딩 실패:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [searchQuery, currentPage, isMobile]);

  if (isMobile) return <MobileUserList />;

  const columns: ListColumn<UserListResponse>[] = [
    {
      key: 'name',
      header: '이름',
      width: 'minmax(0,1.2fr)',
      render: (u) => <NameCell lead={<Avatar text={u.name.charAt(0)} className={avatarBg(u.name)} />}>{u.name}</NameCell>,
    },
    {
      key: 'username',
      header: '사용자명',
      width: 'minmax(0,1fr)',
      render: (u) => <Muted>{u.username}</Muted>,
    },
    {
      key: 'email',
      header: '이메일',
      width: 'minmax(0,1.4fr)',
      render: (u) => <Sub>{u.email || '-'}</Sub>,
    },
    {
      key: 'phone',
      header: '전화번호',
      width: '150px',
      render: (u) => <Num>{u.phone}</Num>,
    },
    {
      key: 'position',
      header: '직책',
      width: '128px',
      render: (u) => <Muted>{u.position || '-'}</Muted>,
    },
    {
      key: 'role',
      header: '권한',
      width: '116px',
      render: (u) => {
        const r = roleOf(u.role);
        return <Badge label={r.label} tone={r.tone} dot={false} />;
      },
    },
  ];

  return (
    <ListView<UserListResponse>
      columns={columns}
      items={data?.content ?? []}
      rowKey={(u) => u.id}
      loading={loading}
      searchPlaceholder="사원 이름으로 검색"
      searchInitial={searchQuery}
      onSearch={(q) => {
        setSearchQuery(q);
        setCurrentPage(0);
      }}
      totalLabel={data ? <><b className="font-extrabold text-gray-900">{data.totalElements}명</b> 사원</> : null}
      empty={{
        icon: (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M17 20h5v-1a4 4 0 00-3-3.9M9 20H2v-1a6 6 0 0112 0v1zm3-12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        title: searchQuery ? '검색 결과가 없어요' : '등록된 사원이 없어요',
        description: searchQuery ? '다른 검색어로 찾아보세요.' : undefined,
      }}
      currentPage={data?.currentPage ?? 0}
      totalPages={data?.totalPages ?? 0}
      totalElements={data?.totalElements ?? 0}
      onPageChange={setCurrentPage}
    />
  );
};

export default UserManagementPage;
