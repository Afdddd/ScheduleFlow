import React, { useState, useEffect } from 'react';
import ListView, { ListColumn } from '../components/list/ListView';
import Badge, { BadgeTone, GLYPH_TONES } from '../components/list/Badge';
import { NameCell, Glyph, Sub, Muted, Num } from '../components/list/cells';
import { getFileList, FileListResponse, PageResponse } from '../api/list';
import { downloadFile } from '../api/file';
import MobileFileList from './MobileFileList';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * 파일 목록 페이지 — 데스크톱은 공통 `ListView`(컬럼형), 모바일은 전용 화면.
 *
 * 행 클릭 대신 각 행에 **다운로드 버튼**을 둔다(파일의 핵심 동작).
 */

// 파일 카테고리 enum → 라벨 · 배지 톤 · 색 띠(hex).
const CATEGORY: Record<string, { label: string; tone: BadgeTone; color: string }> = {
  QUOTATION: { label: '견적서', tone: 'blue', color: '#0B4EC4' },
  DRAWING: { label: '회로도', tone: 'purple', color: '#7C3AED' },
  PLC_PROGRAM: { label: 'PLC 프로그램', tone: 'green', color: '#0E9F6E' },
  BOM: { label: '자재표', tone: 'amber', color: '#D9861F' },
  HMI_DESIGN: { label: 'HMI 작화', tone: 'red', color: '#DC2626' },
  PHOTO: { label: '현장 사진', tone: 'gray', color: '#94A3B8' },
};
const categoryOf = (c: string) => CATEGORY[c] ?? { label: c, tone: 'gray' as BadgeTone, color: '#94A3B8' };

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const fmtDateTime = (s: string) => s.slice(0, 16).replace('T', ' ').replace(/-/g, '.');
const extOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 && dot < name.length - 1 ? name.slice(dot + 1, dot + 5).toUpperCase() : 'FILE';
};

const FileListPage: React.FC = () => {
  const isMobile = useIsMobile();

  const [data, setData] = useState<PageResponse<FileListResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (isMobile) return;
    let alive = true;
    setLoading(true);
    getFileList(searchQuery, currentPage, pageSize)
      .then((res) => alive && setData(res))
      .catch((e) => console.error('파일 목록 로딩 실패:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [searchQuery, currentPage, isMobile]);

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
    }
  };

  if (isMobile) return <MobileFileList />;

  const columns: ListColumn<FileListResponse>[] = [
    {
      key: 'name',
      header: '파일명',
      width: 'minmax(0,2fr)',
      render: (f) => (
        <NameCell lead={<Glyph text={extOf(f.originalFileName)} tone={GLYPH_TONES[categoryOf(f.category).tone]} />}>
          {f.originalFileName}
        </NameCell>
      ),
    },
    {
      key: 'project',
      header: '프로젝트',
      width: 'minmax(0,1fr)',
      render: (f) => <Sub>{f.projectName || '-'}</Sub>,
    },
    {
      key: 'uploader',
      header: '업로더',
      width: '116px',
      render: (f) => <Muted>{f.uploaderName}</Muted>,
    },
    {
      key: 'category',
      header: '카테고리',
      width: '132px',
      render: (f) => {
        const c = categoryOf(f.category);
        return <Badge label={c.label} tone={c.tone} dot={false} />;
      },
    },
    {
      key: 'size',
      header: '크기',
      width: '92px',
      align: 'right',
      render: (f) => <Num>{formatFileSize(f.fileSize)}</Num>,
    },
    {
      key: 'created',
      header: '업로드',
      width: '146px',
      render: (f) => <Num>{fmtDateTime(f.createdAt)}</Num>,
    },
    {
      key: 'download',
      header: '',
      width: '108px',
      align: 'right',
      render: (f) => (
        <button
          type="button"
          onClick={() => handleDownload(f.id, f.originalFileName)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-[13px] font-bold text-gray-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          받기
        </button>
      ),
    },
  ];

  return (
    <ListView<FileListResponse>
      columns={columns}
      items={data?.content ?? []}
      rowKey={(f) => f.id}
      loading={loading}
      searchPlaceholder="파일명으로 검색"
      searchInitial={searchQuery}
      onSearch={(q) => {
        setSearchQuery(q);
        setCurrentPage(0);
      }}
      totalLabel={data ? <><b className="font-extrabold text-gray-900">{data.totalElements}개</b> 파일</> : null}
      empty={{
        icon: (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M7 21h10a2 2 0 002-2V9.4a1 1 0 00-.3-.7l-5.4-5.4A1 1 0 0012.6 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
        title: searchQuery ? '검색 결과가 없어요' : '아직 올라온 파일이 없어요',
        description: searchQuery ? '다른 검색어로 찾아보세요.' : '프로젝트 상세 화면에서 견적서·회로도·현장 사진을 올릴 수 있어요.',
      }}
      currentPage={data?.currentPage ?? 0}
      totalPages={data?.totalPages ?? 0}
      totalElements={data?.totalElements ?? 0}
      onPageChange={setCurrentPage}
    />
  );
};

export default FileListPage;
