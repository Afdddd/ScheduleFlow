import React from 'react';

interface ThumbnailProps {
  /** 실제 이미지 URL. 없으면 color 로 placeholder. */
  src?: string;
  /** placeholder 배경색 (hex) — 실제 이미지 붙기 전 용도 */
  color?: string;
  /** 동영상이면 ▶ + 길이 표시 */
  video?: boolean;
  duration?: string; // "0:18"
  /** 좌상단 배지 (예: "방금") */
  badge?: string;
  /** 좌하단 업로더 라벨 */
  who?: string;
  onClick?: () => void;
}

/**
 * Thumbnail — 현장 사진/영상 썸네일 (정사각).
 * 동영상은 ▶ 아이콘 + 길이, 좌상단 배지, 좌하단 업로더를 겹쳐 표시.
 * 그리드로 묶으면 현장 사진첩이 된다.
 */
const Thumbnail: React.FC<ThumbnailProps> = ({ src, color = '#7089b8', video, duration, badge, who, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative aspect-square overflow-hidden rounded-xl"
    style={src ? undefined : { backgroundColor: color }}
  >
    {src && <img src={src} alt="" className="h-full w-full object-cover" />}

    {video && (
      <>
        <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
            {duration}
          </span>
        )}
      </>
    )}

    {badge && (
      <span className="absolute left-1.5 top-1.5 rounded bg-green-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
        {badge}
      </span>
    )}
    {who && (
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {who}
      </span>
    )}
  </button>
);

export default Thumbnail;
