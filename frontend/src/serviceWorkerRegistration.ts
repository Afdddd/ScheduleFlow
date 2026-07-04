/**
 * 서비스워커 등록.
 *
 * 프로덕션 빌드에서만 등록한다. 개발 중(npm start)에는 서비스워커 캐싱이
 * 핫리로드를 방해할 수 있어 비활성화한다.
 */
export function registerSW(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
    navigator.serviceWorker.register(swUrl).catch((err) => {
      // 등록 실패해도 앱은 정상 동작(오프라인만 미지원)
      console.error('서비스워커 등록 실패:', err);
    });
  });
}
