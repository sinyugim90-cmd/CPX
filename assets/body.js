/* 몸 지도 — 뒷모습. CC 4개가 부위로 매핑된다. */
export function bodyMap(p) {
  // p = {j:pct, n:pct, b:pct, s:pct}
  const a = k => Math.max(.08, (p[k] || 0) / 100);
  const S = 'var(--bfill,#D6D9DE)', E = 'var(--bstroke,#C4C8CE)';
  return `
<svg class="body" viewBox="0 0 320 560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bskin" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="var(--bfill2,#E4E6EA)"/><stop offset="1" stop-color="${S}"/></radialGradient>
    <filter id="bsoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <!-- 그림자 -->
  <ellipse cx="160" cy="548" rx="70" ry="7" fill="#000" opacity="var(--bshadow,.08)" filter="url(#bsoft)"/>
  <!-- 실루엣 (뒷모습) -->
  <g fill="url(#bskin)" stroke="${E}" stroke-width="var(--bsw,1)" stroke-linejoin="round">
    <circle cx="160" cy="58" r="30"/>
    <path d="M147 86 h26 v18 h-26z"/>
    <path d="M110 108 Q160 96 210 108 L214 190 Q206 230 200 300 L120 300 Q114 230 106 190 Z"/>
    <path d="M110 110 L88 176 L84 262 Q88 274 100 270 L108 196 Z"/>
    <path d="M210 110 L232 176 L236 262 Q232 274 220 270 L212 196 Z"/>
    <path d="M122 300 L116 420 L120 528 Q140 536 152 526 L156 420 L160 330 L164 420 L168 526 Q180 536 200 528 L204 420 L198 300 Z"/>
  </g>
  <!-- 척추 -->
  <path d="M160 104 V300" stroke="${E}" stroke-width="var(--bsw,1)" stroke-dasharray="3 5" opacity=".9"/>
  <!-- 26-1 목 -->
  <g class="hs" data-cc="n">
    <rect x="120" y="76" width="80" height="42" fill="transparent"/>
    <rect x="140" y="86" width="40" height="22" rx="6" fill="var(--ac)" opacity="${a('n')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <path d="M182 97 H236" stroke="var(--ink)" stroke-width="1"/>
  </g>
  <!-- 25 관절: 어깨 · 무릎 -->
  <g class="hs" data-cc="j">
    <circle cx="112" cy="116" r="24" fill="transparent"/><circle cx="208" cy="116" r="24" fill="transparent"/>
    <circle cx="138" cy="420" r="24" fill="transparent"/><circle cx="182" cy="420" r="24" fill="transparent"/>
    <circle cx="112" cy="116" r="12" fill="var(--ac)" opacity="${a('j')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <circle cx="208" cy="116" r="12" fill="var(--ac)" opacity="${a('j')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <circle cx="138" cy="420" r="12" fill="var(--ac)" opacity="${a('j')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <circle cx="182" cy="420" r="12" fill="var(--ac)" opacity="${a('j')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <path d="M124 116 H78" stroke="var(--ink)" stroke-width="1"/>
  </g>
  <!-- 26-2 허리 -->
  <g class="hs" data-cc="b">
    <rect x="112" y="226" width="96" height="58" fill="transparent"/>
    <rect x="128" y="240" width="64" height="30" rx="8" fill="var(--ac)" opacity="${a('b')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <path d="M194 255 H236" stroke="var(--ink)" stroke-width="1"/>
  </g>
  <!-- 27 피부: 팔뚝 -->
  <g class="hs" data-cc="s">
    <rect x="70" y="186" width="52" height="86" fill="transparent"/>
    <rect x="86" y="200" width="20" height="58" rx="10" fill="var(--ac)" opacity="${a('s')}" stroke="var(--hsstroke,none)" stroke-width="2"/>
    <circle cx="93" cy="214" r="1.6" fill="var(--ink)"/><circle cx="99" cy="228" r="1.6" fill="var(--ink)"/><circle cx="92" cy="244" r="1.6" fill="var(--ink)"/>
    <path d="M84 230 H60" stroke="var(--ink)" stroke-width="1"/>
  </g>
  <!-- 라벨 -->
  <g class="lbl" font-family="var(--sn)" font-weight="700" fill="var(--ink)">
    <text x="240" y="92" font-size="11">26-1</text><text x="240" y="106" font-size="9" font-weight="500" fill="var(--ink2)">목 통증</text>
    <text x="56" y="112" font-size="11" text-anchor="end">25</text><text x="56" y="126" font-size="9" font-weight="500" fill="var(--ink2)" text-anchor="end">관절 통증</text>
    <text x="240" y="250" font-size="11">26-2</text><text x="240" y="264" font-size="9" font-weight="500" fill="var(--ink2)">허리 통증</text>
    <text x="56" y="226" font-size="11" text-anchor="end">27</text><text x="56" y="240" font-size="9" font-weight="500" fill="var(--ink2)" text-anchor="end">피부 발진</text>
  </g>
</svg>`;
}

/** 인주 도장 SVG — 원형, 살짝 기울고 번짐 */
export function stamp(text, size = 64) {
  return `<svg class="stampsvg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs><filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter></defs>
    <g transform="rotate(-9 50 50)">
      <circle cx="50" cy="50" r="45" fill="var(--stampfill,var(--ac))" stroke="var(--stampstroke,var(--ac))" stroke-width="3"/>
      <circle cx="50" cy="50" r="37" fill="none" stroke="var(--stampstroke,var(--ac))" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="50" y="50" dy=".36em" text-anchor="middle" font-family="var(--mono,monospace)" font-weight="700" font-size="17" letter-spacing="1"
        fill="var(--stamptext,#fff)">${text}</text>
    </g>
  </svg>`;
}
