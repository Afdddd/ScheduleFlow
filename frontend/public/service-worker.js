/*
 * ScheduleFlow 서비스워커 (workbox 없이 수작업).
 *
 * 목적: 설치형 PWA + 약한 현장 네트워크 대비 오프라인 앱셸.
 * 전략:
 *  - 페이지 이동(navigate): 네트워크 우선 → 실패 시 캐시된 앱셸(오프라인)
 *  - 정적 자원(/static, 아이콘 등): 캐시 우선 + 백그라운드 갱신(stale-while-revalidate)
 *  - API 등 그 외 요청: 건드리지 않음(항상 네트워크) — 실데이터가 낡지 않게
 *
 * 갱신 시 CACHE 버전을 올린다. activate에서 옛 캐시를 정리한다.
 */
const CACHE = 'sf-cache-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/logo192.png', '/logo512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부(백엔드 API 등) 패스

  // 페이지 이동: 네트워크 우선, 오프라인이면 캐시된 앱셸로
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // 정적 자원만 캐시(‑ API는 제외). stale-while-revalidate.
  const isStatic =
    !url.pathname.startsWith('/api') &&
    (url.pathname.startsWith('/static/') || /\.(?:png|ico|json|css|js|woff2?|svg)$/.test(url.pathname));

  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
