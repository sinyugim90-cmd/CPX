/* CPX Study — 공용 저장소 · 유틸
   진행률은 localStorage에 저장된다. 실제 브라우저에서는 정상 동작하고,
   방문 기록을 지우거나 시크릿 모드에서 열면 사라진다. */

const KEY = 'cpx.progress.v1';
const SET_KEY = 'cpx.settings.v1';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── 진행률 ─────────────────────────────── */
let _p = null;
function load() {
  if (_p) return _p;
  try { _p = JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { _p = {}; }
  return _p;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(_p)); } catch {}
}

/** key = `${ccId}/${deckIndex}/${cardIndex}` → {seen:0|1, ok:true|false|null} */
export function getCard(cc, di, ci) {
  const p = load();
  return (p[cc] && p[cc][di] && p[cc][di][ci]) || { seen: 0, ok: null };
}
export function setCard(cc, di, ci, v) {
  const p = load();
  p[cc] = p[cc] || {};
  p[cc][di] = p[cc][di] || {};
  p[cc][di][ci] = v;
  save();
}
export function resetDeck(cc, di) {
  const p = load();
  if (p[cc]) { delete p[cc][di]; save(); }
}
export function resetAll() {
  _p = {}; save();
}
/** 덱 통계 */
export function deckStat(cc, di, total) {
  const p = load();
  const d = (p[cc] && p[cc][di]) || {};
  let seen = 0, ok = 0;
  for (const k in d) { if (d[k].seen) seen++; if (d[k].ok === true) ok++; }
  return { seen, ok, total, pct: total ? Math.round(ok / total * 100) : 0 };
}
/** CC 통계 — decks = [{cards:[…]}, …] 의 길이 배열 */
export function ccStat(cc, counts) {
  let seen = 0, ok = 0, total = 0;
  counts.forEach((n, di) => {
    const s = deckStat(cc, di, n);
    seen += s.seen; ok += s.ok; total += n;
  });
  return { seen, ok, total, pct: total ? Math.round(ok / total * 100) : 0 };
}

/* ── 내보내기 · 불러오기 ──────────────────── */
export function exportProgress() {
  const blob = new Blob([JSON.stringify(load(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cpx-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function importProgress(file, done) {
  const r = new FileReader();
  r.onload = () => {
    try { _p = JSON.parse(r.result); save(); done(true); }
    catch { done(false); }
  };
  r.readAsText(file);
}

/* ── 데이터 로딩 (메모리 캐시) ─────────────── */
const cache = {};
export async function loadIndex() {
  if (cache.index) return cache.index;
  const r = await fetch('data/index.json?v=8');
  cache.index = await r.json();
  return cache.index;
}
export async function loadCC(id) {
  if (cache[id]) return cache[id];
  const r = await fetch('data/' + id + '.json?v=8');
  cache[id] = await r.json();
  return cache[id];
}


/* ── 학습모드 진도 ─────────────────────────── */
const RKEY = 'cpx.read.v1';
let _r = null;
function rload(){ if(_r) return _r; try{_r=JSON.parse(localStorage.getItem(RKEY))||{}}catch{_r={}} return _r; }
function rsave(){ try{ localStorage.setItem(RKEY, JSON.stringify(_r)); }catch{} }
export function isRead(cc, pi, si){
  const r = rload(); return !!(r[cc] && r[cc][pi] && r[cc][pi][si]);
}
export function setRead(cc, pi, si, v){
  const r = rload(); r[cc] = r[cc] || {}; r[cc][pi] = r[cc][pi] || {};
  if(v) r[cc][pi][si] = 1; else delete r[cc][pi][si];
  rsave();
}
export function partStat(cc, pi, n){
  const r = rload(); const d = (r[cc] && r[cc][pi]) || {};
  const done = Object.keys(d).length;
  return { done, total: n, pct: n ? Math.round(done / n * 100) : 0 };
}
export function guideStat(cc, counts){
  let done = 0, total = 0;
  counts.forEach((n, pi) => { const s = partStat(cc, pi, n); done += s.done; total += n; });
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}
export async function loadRead(id){
  if (cache['r' + id]) return cache['r' + id];
  const r = await fetch('data/' + id + '.read.json?v=8');
  cache['r' + id] = await r.json();
  return cache['r' + id];
}

/* ── 서비스 워커 ──────────────────────────── */
export function registerSW() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

/* ── 설치 안내 ────────────────────────────── */
export function installPrompt() {
  const box = $('#install');
  if (!box) return;
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem(SET_KEY)) || {}; } catch {}
  if (settings.installDismissed) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (standalone) return;

  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    box.classList.add('show');
    $('#instGo').textContent = '홈 화면에 추가';
  });
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    $('#instMsg').innerHTML =
      '아래 <b>공유 버튼</b>을 누르고 <b>홈 화면에 추가</b>를 선택하면 앱처럼 열려요. 오프라인에서도 됩니다.';
    $('#instGo').textContent = '알겠어요';
    box.classList.add('show');
  }
  $('#instGo').addEventListener('click', async () => {
    if (deferred) { deferred.prompt(); deferred = null; }
    box.classList.remove('show');
  });
  $('#instNo').addEventListener('click', () => {
    box.classList.remove('show');
    settings.installDismissed = 1;
    try { localStorage.setItem(SET_KEY, JSON.stringify(settings)); } catch {}
  });
}

/* ── 기타 ────────────────────────────────── */
export const qs = k => new URLSearchParams(location.search).get(k);
export const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const strip = h => String(h).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
