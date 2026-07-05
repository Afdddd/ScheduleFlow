import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useSmartBack — 일반 앱과 동일한 "진짜 뒤로가기".
 *
 * 앱 안에서 이동해 온 이력이 있으면 실제 직전 화면으로 되돌아가고(`navigate(-1)`),
 * 외부 링크·북마크·새로고침으로 그 화면에 바로 들어와 되돌아갈 곳이 없으면
 * 지정한 fallback 경로로 간다(그 경우엔 히스토리를 늘리지 않게 replace).
 *
 * react-router v6는 히스토리 state에 `idx`(0부터 증가)를 넣는다. idx가 0이면
 * 이 세션의 첫 화면이라 되돌아갈 앱 내 화면이 없다는 뜻이다.
 *
 * @param fallback 되돌아갈 곳이 없을 때 이동할 경로 (보통 상위 목록/홈)
 */
export function useSmartBack(fallback: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const idx = (window.history.state && (window.history.state as { idx?: number }).idx) ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
}
