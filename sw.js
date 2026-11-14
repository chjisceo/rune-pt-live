// 룬PT 서비스 워커: 항상 최신 파일을 먼저 받고, 오프라인이면 저장해 둔 파일을 보여줘요
const V = 'rpt-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./')))
  );
});

// 푸시 알림: 앱 화면이 이미 보이는 중이면(앱 안 알림이 따로 떠요) 시스템 알림은 생략
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: '룬PT', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      if (cs.some(c => c.visibilityState === 'visible')) return;
      return self.registration.showNotification(d.title || '룬PT', {
        body: d.body || '', tag: d.tag || 'rune', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './' }
      });
    })
  );
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const c = cs[0];
      if (c) return c.focus();
      return self.clients.openWindow(u);
    })
  );
});
