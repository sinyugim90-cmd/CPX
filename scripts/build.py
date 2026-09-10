# -*- coding: utf-8 -*-
"""CPX 사이트 빌드 — data/*.json · 아이콘 · manifest · sw.js"""
import sys, os, json, shutil, subprocess
sys.path.insert(0, "/home/claude/work")
from app_cc25 import CC25
from app_cc26 import CC26A, CC26B
from app_cc27 import CC27

SITE = "/home/claude/site"
OUT = "/mnt/user-data/outputs"

CCS = [
 (CC25,  "CPX25_JointPain_Guide"),
 (CC26A, "CPX26-1_NeckPain_Guide"),
 (CC26B, "CPX26-2_LowBackPain_Guide"),
 (CC27,  "CPX27_SkinRash_Guide"),
]

# ── 1. CC별 JSON ──────────────────────────────────────
for cc, guide in CCS:
    p = f"{SITE}/data/{cc['id']}.json"
    json.dump({"num": cc["num"], "title": cc["title"], "en": cc["en"],
               "decks": cc["decks"]}, open(p, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))

# ── 2. index.json ────────────────────────────────────
index = {
 "version": 1,
 "updated": "2026-09-09",
 "parts": [
   {"tag": "PART", "name": "관절 · 근골격 · 피부",
    "ccs": [{"id": cc["id"], "num": cc["num"], "title": cc["title"],
             "en": cc["en"], "guide": guide, "status": "ready"}
            for cc, guide in CCS]},
 ],
}
json.dump(index, open(f"{SITE}/data/index.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

# ── 3. 가이드 복사 ────────────────────────────────────
for cc, guide in CCS:
    for ext in ("html", "pdf"):
        src = f"{OUT}/{guide}.{ext}"
        if os.path.exists(src):
            shutil.copy(src, f"{SITE}/guides/{guide}.{ext}")

# ── 4. 아이콘 ────────────────────────────────────────
from PIL import Image, ImageDraw, ImageFont
FONT = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
if not os.path.exists(FONT):
    cand = subprocess.run(["bash", "-lc",
        "fc-list | grep -i 'NotoSerifCJK' | head -1 | cut -d: -f1"],
        capture_output=True, text=True).stdout.strip()
    FONT = cand or None

for size in (192, 512, 1024):
    img = Image.new("RGB", (size, size), "#4E1A28")
    d = ImageDraw.Draw(img)
    pad = size * 0.13
    d.rounded_rectangle([pad, pad, size - pad, size - pad],
                        radius=size * 0.06, outline="#E8D6DB", width=max(2, int(size * 0.012)))
    if FONT:
        f = ImageFont.truetype(FONT, int(size * 0.30))
        t = "CPX"
        bb = d.textbbox((0, 0), t, font=f)
        d.text(((size - (bb[2] - bb[0])) / 2 - bb[0], (size - (bb[3] - bb[1])) / 2 - bb[1] - size * 0.02),
               t, font=f, fill="#FFFFFF")
    img.save(f"{SITE}/icons/icon-{size}.png")
# maskable (여백 더 크게)
img = Image.new("RGB", (512, 512), "#4E1A28")
d = ImageDraw.Draw(img)
if FONT:
    f = ImageFont.truetype(FONT, 120)
    bb = d.textbbox((0, 0), "CPX", font=f)
    d.text(((512 - (bb[2] - bb[0])) / 2 - bb[0], (512 - (bb[3] - bb[1])) / 2 - bb[1]),
           "CPX", font=f, fill="#FFFFFF")
img.save(f"{SITE}/icons/maskable-512.png")

# ── 5. manifest ──────────────────────────────────────
manifest = {
 "name": "CPX Study", "short_name": "CPX",
 "description": "CPX 실기 스터디 — CC별 가이드와 인출 카드",
 "start_url": "./index.html", "scope": "./",
 "display": "standalone", "orientation": "portrait",
 "background_color": "#F7F4F4", "theme_color": "#F7F4F4",
 "lang": "ko",
 "icons": [
   {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
   {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
   {"src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
 ],
}
json.dump(manifest, open(f"{SITE}/manifest.webmanifest", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

# ── 6. service worker (precache 목록 자동 생성) ────────
files = []
for root, dirs, fs in os.walk(SITE):
    dirs[:] = [d for d in dirs if d not in ("scripts", "__pycache__")]
    for f in fs:
        if f.endswith((".py", ".zip")):
            continue
        rel = os.path.relpath(os.path.join(root, f), SITE).replace(os.sep, "/")
        files.append("./" + rel)
files = sorted(set(files + ["./"]))

sw = """/* CPX Study — 오프라인 캐시
   온라인이면 항상 서버의 새 파일을 먼저 쓰고, 오프라인일 때만 저장본을 쓴다.
   (폰트·아이콘·PDF처럼 크고 안 바뀌는 것만 저장본 우선)
   파일을 바꾸면 CACHE 값을 올려야 옛 저장본이 정리된다. */
const CACHE = 'cpx-v7';
const ASSETS = %s;
const STATIC = /\\/(assets\\/fonts\\/|icons\\/|guides\\/.*\\.pdf$)/;

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
""" % json.dumps(files, ensure_ascii=False, indent=1)
open(f"{SITE}/sw.js", "w", encoding="utf-8").write(sw)

print("data:", len(os.listdir(f"{SITE}/data")), "files")
print("guides:", len(os.listdir(f"{SITE}/guides")), "files")
print("precache:", len(files), "entries")
tot = sum(len(d["cards"]) for cc, _ in CCS for d in cc["decks"])
print("cards:", tot)
