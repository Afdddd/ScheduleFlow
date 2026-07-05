import { useEffect, useState } from 'react';

/** Chrome의 beforeinstallprompt 이벤트 타입 (표준 lib에 없어 직접 선언). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPrompt {
  /** 안드로이드/데스크톱 Chrome에서 설치 가능(프롬프트 확보됨) */
  canInstall: boolean;
  /** 설치 프롬프트 띄우기 */
  promptInstall: () => Promise<void>;
  /** iOS Safari 여부 (beforeinstallprompt 미지원 → 수동 안내 필요) */
  isIOS: boolean;
  /** 이미 홈 화면 앱(standalone)으로 실행 중 */
  isStandalone: boolean;
}

/**
 * PWA 설치 상태/동작을 다루는 훅.
 *
 * - 안드로이드·데스크톱 Chrome: beforeinstallprompt를 가로채 설치 버튼 노출.
 * - iOS Safari: 이벤트가 없으므로 isIOS로 "공유 → 홈 화면에 추가" 수동 안내.
 */
export function useInstallPrompt(): InstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 미니바 억제, 우리 UI로 대체
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari 전용 플래그
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  const promptInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return { canInstall: !!deferred, promptInstall, isIOS, isStandalone };
}
