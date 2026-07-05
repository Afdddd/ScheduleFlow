import { useEffect } from 'react';

/**
 * useScrollLock — 오버레이(바텀시트·라이트박스)가 열려 있는 동안 배경 스크롤을 잠근다.
 *
 * 이 앱의 실제 스크롤 컨테이너는 `document.body`가 아니라 레이아웃의
 * `<main className="overflow-y-auto">`다. 그래서 body만 잠그면 시트 위를
 * 스와이프할 때 뒤 페이지가 같이 스크롤되는 현상(scroll bleed)이 남는다.
 * body와 함께 `<main>`도 잠가야 완전히 막힌다.
 *
 * @param active true인 동안 잠금, false가 되거나 언마운트되면 원복.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const targets: HTMLElement[] = [document.body];
    const main = document.querySelector('main');
    if (main instanceof HTMLElement) targets.push(main);

    const prev = targets.map((el) => el.style.overflow);
    targets.forEach((el) => {
      el.style.overflow = 'hidden';
    });

    return () => {
      targets.forEach((el, i) => {
        el.style.overflow = prev[i];
      });
    };
  }, [active]);
}
