/* CPX Study — 공용 UI 조각 (아이콘 · 진행 링 · 바텀시트) */

const I = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
        stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const ICON = {
  back:  I('<path d="M15 5l-7 7 7 7"/>'),
  next:  I('<path d="M9 5l7 7-7 7"/>'),
  prev:  I('<path d="M15 5l-7 7 7 7"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7"/>'),
  more:  I('<circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/>'),
  search:I('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
  close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  flip:  I('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),
  shuffle:I('<path d="M4 7h3l6 10h7M4 17h3l2.3-3.8M13.7 10.8L16 7h4M18 5l2 2-2 2M18 15l2 2-2 2"/>'),
  filter:I('<path d="M5 7h14M8 12h8M10 17h4"/>'),
  reset: I('<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/>'),
  sun:   I('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'),
  moon:  I('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  aa:    I('<path d="M3 17l4.5-11 4.5 11M4.6 13h5.8M14 17l3-7.5 3 7.5M15.1 14.6h3.8"/>'),
  pdf:   I('<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6"/>'),
  book:  I('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5V5.5M20 18v3H6.5"/>'),
  cards: I('<rect x="4" y="6" width="12" height="15" rx="2"/><path d="M8 3h12v15"/>'),
};

/** 진행 링 (SVG). pct 0~100, size px */
export function ring(pct, size = 36, stroke = 2.5, label = true) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" class="rg-t"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" class="rg-v"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}"
      data-off="${off.toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})"/>
    ${label ? `<text x="50%" y="50%" dy=".36em" text-anchor="middle" class="rg-l">${Math.round(pct)}</text>` : ''}
  </svg>`;
}
/** 화면에 링이 그려진 뒤 채워지는 애니메이션 */
export function animateRings(root = document) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll('.rg-v[data-off]').forEach(el => {
      el.setAttribute('stroke-dashoffset', el.dataset.off);
    });
  }));
}

/** 바텀시트: items = [{icon, label, on, danger}] */
export function sheet(title, items) {
  let el = document.getElementById('sheet');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sheet'; el.className = 'sheet';
    el.innerHTML = `<div class="sh-bg"></div><div class="sh-panel">
      <div class="sh-grab"></div><div class="sh-t"></div><div class="sh-list"></div></div>`;
    document.body.append(el);
    el.querySelector('.sh-bg').onclick = () => el.classList.remove('show');
  }
  el.querySelector('.sh-t').textContent = title || '';
  el.querySelector('.sh-list').innerHTML = items.map((it, i) =>
    `<button class="sh-i${it.danger ? ' danger' : ''}" data-i="${i}">
       <span class="sh-ic">${it.icon || ''}</span><span>${it.label}</span></button>`).join('');
  el.querySelectorAll('.sh-i').forEach(b => b.onclick = () => {
    el.classList.remove('show'); items[+b.dataset.i].on();
  });
  requestAnimationFrame(() => el.classList.add('show'));
}

/** 가벼운 토스트 */
export function toast(msg, ms = 1600) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}
