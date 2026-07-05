import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileListResponse } from '../../api/list';
import { downloadFile } from '../../api/file';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * MediaViewer — 사진/영상 전체화면 뷰어(라이트박스).
 *
 * 홈·파일 목록의 썸네일을 눌렀을 때 인증된 파일을 blob으로 받아 전체화면으로 본다.
 * 좌우 스와이프 / 화살표로 이웃 미디어로 이동하고, 배경·X·Esc로 닫는다.
 *
 * 영상은 `controls playsInline`을 준다. playsInline이 없으면 iOS Safari가
 * 자체 네이티브 전체화면 플레이어를 강제로 띄워 OS마다 동작이 달라지는데,
 * 이 속성으로 iOS/안드로이드/데스크톱 모두 인라인 재생으로 통일된다.
 */

interface Props {
  items: FileListResponse[];
  index: number;
  onClose: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

const MediaViewer: React.FC<Props> = ({ items, index, onClose }) => {
  const [cur, setCur] = useState(index);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const cache = useRef<Record<number, string>>({});
  const touchStartX = useRef<number | null>(null);

  useScrollLock(true);

  const count = items.length;
  const item = items[cur];

  const go = useCallback(
    (dir: number) => {
      setCur((c) => {
        const next = c + dir;
        if (next < 0 || next >= count) return c;
        return next;
      });
    },
    [count]
  );

  // 현재(및 이웃) 미디어 blob 로딩
  useEffect(() => {
    let alive = true;
    const load = async (i: number) => {
      const f = items[i];
      if (!f || cache.current[f.id]) return;
      try {
        const blob = await downloadFile(f.id);
        if (!alive) return;
        const obj = URL.createObjectURL(blob);
        cache.current[f.id] = obj;
        setUrls((prev) => ({ ...prev, [f.id]: obj }));
      } catch {
        /* 무시 — 스피너 유지 */
      }
    };
    load(cur);
    load(cur + 1);
    load(cur - 1);
    return () => {
      alive = false;
    };
  }, [cur, items]);

  // 언마운트 시 objectURL 정리
  useEffect(() => {
    const created = cache.current;
    return () => {
      Object.values(created).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // 키보드 이동/닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (!item) return null;

  const url = urls[item.id];
  const isVideo = item.contentType?.startsWith('video');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-modal="true">
      {/* 상단 바 */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-white">{item.originalFileName}</div>
          <div className="mt-0.5 truncate text-[12px] font-medium text-white/60">
            {[item.projectName, item.uploaderName, relativeTime(item.createdAt)].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span className="flex-none text-[13px] font-bold text-white/60 tabular-nums">
          {cur + 1} / {count}
        </span>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M6 6l12 12M6 18 18 6" />
          </svg>
        </button>
      </div>

      {/* 미디어 영역 */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        {!url ? (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V1a11 11 0 0 0-11 11h3z" />
            </svg>
            <span className="text-[13px] font-semibold">불러오는 중…</span>
          </div>
        ) : isVideo ? (
          <video
            key={item.id}
            src={url}
            controls
            playsInline
            autoPlay
            className="max-h-full max-w-full"
          />
        ) : (
          <img key={item.id} src={url} alt={item.originalFileName} className="max-h-full max-w-full object-contain" />
        )}

        {/* 이전/다음 (터치·데스크톱 공용) */}
        {cur > 0 && (
          <button
            onClick={() => go(-1)}
            aria-label="이전"
            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white active:bg-black/60"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        {cur < count - 1 && (
          <button
            onClick={() => go(1)}
            aria-label="다음"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white active:bg-black/60"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaViewer;
