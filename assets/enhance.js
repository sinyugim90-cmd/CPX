/* 읽기 화면 강화
   1) 본문 <b> 를 마커펜처럼 칠한다
   2) 수치와 단위를 눈에 띄게 칩으로
   3) 그림을 탭하면 전체화면으로 확대 (핀치 · 더블탭 줌)
   4) 다크모드 · 글자 크기 3단계 (기억됨) */

const PREF = 'cpx.view.v1';
const NUM = /(\d+(?:~\d+)?\s?(?:주|일|시간|분|초|개월|년|cm|mm|도|점|회|번|세|kg|g|mL|%)|\d+세\s?이상|\d+세\s?미만)/g;

function pref() { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch { return {}; } }
function savePref(p) { try { localStorage.setItem(PREF, JSON.stringify(p)); } catch {} }

/* ── 1·2. 텍스트 강조 ─────────────────────── */
export function highlight(root) {
  if (!root) return;
  const skip = new Set(['SCRIPT', 'STYLE', 'SVG', 'TEXT', 'MARK', 'CODE', 'TH']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      let p = n.parentElement;
      while (p && p !== root) {
        if (skip.has(p.tagName) || p.closest('svg')) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NUM.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const hits = [];
  let n;
  while ((n = walker.nextNode())) hits.push(n);
  hits.forEach(t => {
    NUM.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = NUM.exec(t.nodeValue))) {
      frag.append(t.nodeValue.slice(last, m.index));
      const el = document.createElement('span');
      el.className = 'num';
      el.textContent = m[0];
      frag.append(el);
      last = m.index + m[0].length;
    }
    frag.append(t.nodeValue.slice(last));
    t.replaceWith(frag);
  });
}

/* ── 3. 그림 확대 ─────────────────────────── */
let zoomBox = null;
function ensureZoom() {
  if (zoomBox) return zoomBox;
  zoomBox = document.createElement('div');
  zoomBox.className = 'zoom';
  zoomBox.innerHTML = `<div class="zt"><span id="zcap"></span><button id="zx">닫기</button></div>
    <div class="zs" id="zs"></div>
    <div class="zc"><button data-z="-">&minus;</button><button data-z="0">맞춤</button><button data-z="+">&plus;</button></div>`;
  document.body.append(zoomBox);
  zoomBox.querySelector('#zx').onclick = () => zoomBox.classList.remove('show');
  zoomBox.addEventListener('click', e => { if (e.target === zoomBox) zoomBox.classList.remove('show'); });
  let k = 1;
  const apply = () => {
    const svg = zoomBox.querySelector('#zs svg');
    if (svg) svg.style.width = (k * 100) + '%';
  };
  zoomBox.querySelectorAll('.zc button').forEach(b => b.onclick = () => {
    const d = b.dataset.z;
    k = d === '0' ? 1 : Math.min(4, Math.max(0.6, k + (d === '+' ? 0.4 : -0.4)));
    apply();
  });
  zoomBox._reset = () => { k = 1; apply(); };
  return zoomBox;
}
export function zoomable(root) {
  if (!root) return;
  root.querySelectorAll('figure').forEach(f => {
    if (f.dataset.z) return;
    f.dataset.z = '1';
    f.insertAdjacentHTML('beforeend', '<span class="zhint">탭하면 크게</span>');
    f.onclick = () => {
      const svg = f.querySelector('svg');
      if (!svg) return;
      const box = ensureZoom();
      box.querySelector('#zs').innerHTML = svg.outerHTML;
      const cap = f.querySelector('figcaption');
      box.querySelector('#zcap').textContent = cap ? cap.textContent : '';
      box._reset();
      box.classList.add('show');
    };
  });
}

/* ── 4. 보기 설정 ─────────────────────────── */
const SIZES = ['s', 'm', 'l'];
export function viewSettings(mountSel) {
  const p = pref();
  const apply = () => {
    document.documentElement.dataset.theme = p.dark ? 'dark' : 'light';
    document.documentElement.dataset.size = p.size || 'm';
  };
  apply();
  const mount = document.querySelector(mountSel);
  if (!mount) return;
  mount.insertAdjacentHTML('afterbegin',
    `<div class="vset">
       <button data-v="dark">${p.dark ? '밝게' : '어둡게'}</button>
       <button data-v="size">글자 ${{ s: '작게', m: '보통', l: '크게' }[p.size || 'm']}</button>
     </div>`);
  mount.querySelector('[data-v="dark"]').onclick = e => {
    p.dark = !p.dark; savePref(p); apply();
    e.target.textContent = p.dark ? '밝게' : '어둡게';
  };
  mount.querySelector('[data-v="size"]').onclick = e => {
    const i = SIZES.indexOf(p.size || 'm');
    p.size = SIZES[(i + 1) % 3]; savePref(p); apply();
    e.target.textContent = '글자 ' + { s: '작게', m: '보통', l: '크게' }[p.size];
  };
}
export function applyPrefOnly() {
  const p = pref();
  document.documentElement.dataset.theme = p.dark ? 'dark' : 'light';
  document.documentElement.dataset.size = p.size || 'm';
}
