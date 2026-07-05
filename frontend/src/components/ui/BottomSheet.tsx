import React from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 우측 상단 확정 버튼 핸들러. 없으면 버튼 숨김. */
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * BottomSheet — 아래에서 올라오는 시트.
 *
 * 일정 생성·현장 선택 등 "맥락 유지한 채 빠른 입력"에 재사용한다.
 * 페이지 이동 없이 아래에서 올라오므로 흐름이 끊기지 않는다.
 *
 * 설계 포인트:
 * - 항상 마운트해두고 transform으로 열고 닫아 부드럽게 슬라이드.
 * - 스크림 클릭 또는 취소로 닫힘. 열리면 body 스크롤 잠금.
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = '저장',
  cancelLabel = '취소',
}) => {
  useScrollLock(open);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* 스크림 */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* 시트 */}
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-3xl bg-gray-50 transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(.32,.72,0,1)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-300" />
        {(title || onConfirm) && (
          <div className="flex items-center px-4 py-3">
            <button type="button" onClick={onClose} className="w-16 text-left text-base font-semibold text-gray-500">
              {cancelLabel}
            </button>
            <b className="flex-1 text-center text-base font-bold">{title}</b>
            {onConfirm ? (
              <button type="button" onClick={onConfirm} className="w-16 text-right text-base font-bold text-primary-500">
                {confirmLabel}
              </button>
            ) : (
              <span className="w-16" />
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
