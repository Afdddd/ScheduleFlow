import React, { useState } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

const DISMISS_KEY = 'sf-install-dismissed';

/**
 * InstallBanner — "앱 설치" 안내 배너.
 *
 * - 안드로이드/데스크톱: 「설치」 버튼(네이티브 프롬프트).
 * - iOS: 프롬프트가 없으니 "공유 → 홈 화면에 추가" 수동 안내.
 * - 이미 설치(standalone)됐거나 사용자가 닫으면 숨김.
 *
 * 아저씨 사용자는 아이폰 설치가 관문이라, 문구로 방법을 직접 알려준다.
 */
const InstallBanner: React.FC = () => {
  const { canInstall, promptInstall, isIOS, isStandalone } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  const showAndroid = canInstall;
  const showIOS = isIOS && !canInstall;

  if (isStandalone || dismissed || (!showAndroid && !showIOS)) return null;

  const close = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  return (
    <div className="flex flex-none items-center gap-3 border-b border-primary-100 bg-primary-50 px-4 py-2.5">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-500 text-white">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16" />
        </svg>
      </span>
      <p className="min-w-0 flex-1 text-sm font-bold text-primary-900">
        {showAndroid ? (
          '앱으로 설치하면 더 빠르게 열려요'
        ) : (
          <>
            공유 <span aria-hidden>→</span> "홈 화면에 추가"로 설치하세요
          </>
        )}
      </p>
      {showAndroid && (
        <button
          type="button"
          onClick={promptInstall}
          className="flex-none rounded-lg bg-primary-500 px-3.5 py-1.5 text-sm font-bold text-white active:scale-95"
        >
          설치
        </button>
      )}
      <button type="button" onClick={close} aria-label="닫기" className="flex-none px-1 text-lg text-primary-400">
        ✕
      </button>
    </div>
  );
};

export default InstallBanner;
