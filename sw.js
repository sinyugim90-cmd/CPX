/* CPX Study — 오프라인 캐시
   온라인이면 항상 서버의 새 파일을 먼저 쓰고, 오프라인일 때만 저장본을 쓴다.
   (폰트·아이콘·PDF처럼 크고 안 바뀌는 것만 저장본 우선)
   파일을 바꾸면 CACHE 값을 올려야 옛 저장본이 정리된다. */
const CACHE = 'cpx-v16';
const ASSETS = [
 "./",
 "./README.md",
 "./assets/body.js",
 "./assets/enhance.js",
 "./assets/fonts/NotoSerifKR-500.woff2",
 "./assets/fonts/NotoSerifKR-700.woff2",
 "./assets/fonts/Pretendard-300.woff2",
 "./assets/fonts/Pretendard-400.woff2",
 "./assets/fonts/Pretendard-500.woff2",
 "./assets/fonts/Pretendard-700.woff2",
 "./assets/fonts/Pretendard-800.woff2",
 "./assets/store.js",
 "./assets/style.css",
 "./assets/ui.js",
 "./cards.html",
 "./data/b.json",
 "./data/b.read.json",
 "./data/index.json",
 "./data/j.json",
 "./data/j.read.json",
 "./data/n.json",
 "./data/n.read.json",
 "./data/s.json",
 "./data/s.read.json",
 "./decks.html",
 "./deploy.sh",
 "./guide.html",
 "./guides/CPX25_JointPain_Guide.html",
 "./guides/CPX25_JointPain_Guide.pdf",
 "./guides/CPX26-1_NeckPain_Guide.html",
 "./guides/CPX26-1_NeckPain_Guide.pdf",
 "./guides/CPX26-2_LowBackPain_Guide.html",
 "./guides/CPX26-2_LowBackPain_Guide.pdf",
 "./guides/CPX27_SkinRash_Guide.html",
 "./guides/CPX27_SkinRash_Guide.pdf",
 "./icons/icon-1024.png",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./icons/maskable-512.png",
 "./index.html",
 "./manifest.webmanifest",
 "./read.html",
 "./sw.js"
];
const STATIC = /\/(assets\/fonts\/|icons\/|guides\/.*\.pdf$)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(ASSETS.map(u => c.add(u))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const url = req.url;
  if (STATIC.test(url)) {
    // 저장본 우선
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit ||
      fetch(req).then(r => { if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone())); return r; })));
    return;
  }
  // 네트워크 우선, 실패하면 저장본
  e.respondWith(
    fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
