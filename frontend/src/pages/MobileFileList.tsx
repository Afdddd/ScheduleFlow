import React, { useEffect, useMemo, useState } from 'react';
import { getFileList, FileListResponse } from '../api/list';
import { downloadFile } from '../api/file';
import MobileSearchInput from '../components/mobile/MobileSearchInput';

/**
 * MobileFileList — 모바일 '파일함' (더보기 → 파일함).
 * 카테고리 필터칩 + 파일 행(아이콘·이름·프로젝트·크기·다운로드). 검색.
 */

const CAT_LABEL: Record<string, string> = {
  QUOTATION: '견적서',
  DRAWING: '도면',
  PLC_PROGRAM: 'PLC',
  BOM: 'BOM',
  HMI_DESIGN: 'HMI',
  PHOTO: '사진',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

async function download(id: number, name: string) {
  try {
    const blob = await downloadFile(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('다운로드 실패:', e);
  }
}

const MobileFileList: React.FC = () => {
  const [items, setItems] = useState<FileListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [cat, setCat] = useState('ALL');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getFileList(keyword, 0, 100);
        if (alive) setItems(res.content);
      } catch (e) {
        console.error('파일 목록 로딩 실패:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [keyword]);

  // 데이터에 존재하는 카테고리만 칩으로
  const cats = useMemo(() => {
    const set = new Set(items.map((f) => f.category));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const shown = cat === 'ALL' ? items : items.filter((f) => f.category === cat);

  return (
    <div className="min-h-full bg-gray-50 pb-24">
      <div className="flex items-center px-[18px] pb-2 pt-3">
        <h1 className="flex-1 text-[25px] font-extrabold tracking-tight text-gray-900">파일함</h1>
      </div>
      <div className="px-[18px] pb-3">
        <MobileSearchInput onSearch={setKeyword} placeholder="파일명으로 검색" />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto px-[18px] pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cats.map((c) => {
          const on = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-none whitespace-nowrap rounded-full border px-3.5 py-2 text-[14px] font-bold transition-colors ${
                on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {c === 'ALL' ? '전체' : CAT_LABEL[c] ?? c}
            </button>
          );
        })}
      </div>

      <div className="px-[18px]">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm font-semibold text-gray-400 shadow-sm">
            불러오는 중…
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm font-semibold text-gray-400">
            파일이 없어요
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {shown.map((f, i) => {
              const isPhoto = f.category === 'PHOTO' || f.contentType?.startsWith('image');
              return (
                <button
                  key={f.id}
                  onClick={() => download(f.id, f.originalFileName)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i > 0 ? 'border-t border-gray-100' : ''} active:bg-gray-50`}
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primary-50 text-primary-600">
                    {isPhoto ? (
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
                        <circle cx="12" cy="13" r="3.2" />
                      </svg>
                    ) : (
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold text-gray-900">{f.originalFileName}</span>
                    <span className="block truncate text-[12px] font-semibold text-gray-400">
                      {f.projectName ?? '프로젝트 없음'} · {formatSize(f.fileSize)} · {CAT_LABEL[f.category] ?? f.category}
                    </span>
                  </span>
                  <svg className="h-5 w-5 flex-none text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileFileList;
