import { useEffect, useState } from 'react';

/**
 * 미디어 쿼리 매칭 여부를 반환하는 훅.
 *
 * 모바일/데스크톱 레이아웃을 분기하는 데 사용한다.
 * 화면 크기가 바뀌면(회전, 창 크기 조절) 자동으로 갱신된다.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // 마운트 시점의 값으로 한 번 동기화 (SSR/초기값 안전장치)
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * 모바일 뷰포트(<= 768px) 여부.
 * 이 프로젝트의 모바일/데스크톱 분기 기준점.
 */
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 768px)');
