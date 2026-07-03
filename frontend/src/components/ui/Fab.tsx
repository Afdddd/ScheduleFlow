import React from 'react';

interface FabProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

/**
 * Fab — 우하단 플로팅 액션 버튼(생성 등).
 *
 * 설계 포인트: 아이콘만 두지 않고 **글자 라벨을 함께** 붙인다.
 * 아저씨 사용자가 "이게 무슨 버튼인지" 바로 알게 하기 위함.
 * 하단 탭바 위에 뜨도록 bottom 여백을 준다.
 */
const Fab: React.FC<FabProps> = ({ label, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className="fixed bottom-24 right-4 z-30 flex items-center gap-1.5 rounded-2xl bg-blue-500 px-5 py-4 text-base font-bold text-white shadow-lg transition-transform active:scale-95"
  >
    {icon ?? (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    )}
    {label}
  </button>
);

export default Fab;
