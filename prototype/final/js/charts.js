// Final Pass — 数据驱动 SVG：路线示意图、海拔剖面、路线天气图
const NS = 'http://www.w3.org/2000/svg';

export function s(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmtNum = (n) => Number(n).toLocaleString('zh-CN');

/* ---------------- 路线示意图 ----------------
   坐标来自 routeSnapshot.points；等高线是装饰性的地形暗示，
   页面必须标注“路线示意 · 非导航地图”。 */
export function routeMap(points, { selectedId = null, onSelect = null } = {}) {
  const W = 327, H = 184;
  const padX = 34, padY = 26;
  const lngs = points.map((p) => p.coord.lng);
  const lats = points.map((p) => p.coord.lat);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const sx = (lng) => padX + ((lng - minLng) / (maxLng - minLng || 1)) * (W - padX * 2);
  const sy = (lat) => H - padY - ((lat - minLat) / (maxLat - minLat || 1)) * (H - padY * 2);
  const pos = points.map((p) => ({ ...p, x: sx(p.coord.lng), y: sy(p.coord.lat) }));

  const svg = s('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'route-map__svg',
    role: 'img',
    'aria-label': `路线示意图：${points.map((p) => p.name).join('、')}`
  });

  const defs = s('defs');
  const clip = s('clipPath', { id: 'map-clip' }, s('rect', { x: 0, y: 0, width: W, height: H, rx: 10 }));
  defs.appendChild(clip);
  const grad = s('linearGradient', { id: 'map-paper', x1: '0', y1: '0', x2: '0', y2: '1' },
    s('stop', { offset: '0%', 'stop-color': '#F0EDE2' }),
    s('stop', { offset: '100%', 'stop-color': '#E8E4D6' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  svg.appendChild(s('rect', { x: 0, y: 0, width: W, height: H, rx: 10, fill: 'url(#map-paper)' }));

  const contours = s('g', { class: 'route-map__contours', 'clip-path': 'url(#map-clip)' });
  const centers = [
    [70, 64, 74, 36, 1.4], [170, 108, 92, 44, 2.1], [262, 52, 60, 30, 0.8],
    [238, 148, 74, 33, 2.8], [106, 152, 56, 28, 1.9], [300, 112, 48, 24, 2.4]
  ];
  for (const [cx, cy, rx, ry, phase] of centers) {
    for (let ring = 0; ring < 5; ring++) {
      const k = 1 + ring * 0.28;
      const pts = [];
      for (let a = 0; a < 96; a++) {
        const ang = (a / 96) * Math.PI * 2;
        const wobble = 1 + 0.08 * Math.sin(ang * 3 + phase) + 0.04 * Math.cos(ang * 5 - phase);
        pts.push(`${(cx + Math.cos(ang) * rx * k * wobble).toFixed(1)},${(cy + Math.sin(ang) * ry * k * wobble).toFixed(1)}`);
      }
      contours.appendChild(s('path', {
        d: `M${pts.join('L')}Z`,
        fill: 'none',
        stroke: ring === 0 ? '#D2CCBB' : '#DBD6C8',
        'stroke-width': ring === 0 ? 0.9 : 0.7,
        opacity: 0.9
      }));
    }
  }
  svg.appendChild(contours);

  const pathD = pos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  svg.appendChild(s('path', { d: pathD, fill: 'none', stroke: '#F7F4EC', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  svg.appendChild(s('path', { d: pathD, fill: 'none', stroke: '#234B3C', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

  /* 每段中点放方向点，帮助看出行进方向 */
  for (let i = 1; i < pos.length; i++) {
    const a = pos[i - 1], b = pos[i];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    svg.appendChild(s('path', {
      d: 'M-4,-3 L0,0 L-4,3',
      transform: `translate(${mx},${my}) rotate(${ang})`,
      fill: 'none', stroke: '#234B3C', 'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
  }

  for (const p of pos) {
    const selected = selectedId === p.id;
    if (selected) {
      svg.appendChild(s('circle', { cx: p.x, cy: p.y, r: 13, fill: 'none', stroke: '#A45A36', 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }));
    }
    const g = s('g', {
      class: 'route-map__point' + (selected ? ' is-selected' : ''),
      'data-point-id': p.id,
      tabindex: '0',
      role: 'button',
      'aria-label': `${p.name}，海拔 ${p.ele} 米，${p.eta}`,
      style: { cursor: 'pointer' }
    });
    g.appendChild(s('circle', { cx: p.x, cy: p.y, r: 16, fill: 'transparent' }));
    g.appendChild(s('circle', { cx: p.x, cy: p.y, r: 10, fill: '#F7F4EC', opacity: 0.92 }));
    const fill = p.kind === 'start' ? '#234B3C' : p.kind === 'finish' ? '#173D32' : '#F7F4EC';
    const stroke = p.kind === 'checkpoint' ? '#234B3C' : '#F7F4EC';
    g.appendChild(s('circle', { cx: p.x, cy: p.y, r: 5.5, fill, stroke, 'stroke-width': 2 }));
    g.appendChild(s('text', {
      x: p.x, y: p.y + 3.2, 'text-anchor': 'middle',
      fill: p.kind === 'checkpoint' ? '#234B3C' : '#F7F4EC',
      'font-size': 8, 'font-weight': 700
    }, String(points.indexOf(p) + 1)));
    if (onSelect) {
      const pick = () => onSelect(p.id);
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    }
    svg.appendChild(g);
  }

  /* 指北针（真实方向：图为北向上） */
  const north = s('g', { transform: `translate(${W - 26},18)`, opacity: 0.6 });
  north.appendChild(s('path', { d: 'M0,-8 L4,5 L0,2 L-4,5 Z', fill: '#234B3C' }));
  north.appendChild(s('text', { x: 0, y: 14, 'text-anchor': 'middle', 'font-size': 7, fill: '#234B3C', 'font-weight': 700 }, 'N'));
  svg.appendChild(north);

  return svg;
}

/* ---------------- 海拔剖面 ---------------- */
export function elevationProfile(points, { selectedId = null, onSelect = null } = {}) {
  const W = 327, H = 94;
  const padL = 10, padR = 36, padT = 12, padB = 20;
  const maxKm = Math.max(...points.map((p) => p.km)) || 1;
  const minEle = Math.min(...points.map((p) => p.ele)) - 40;
  const maxEle = Math.max(...points.map((p) => p.ele)) + 40;
  const x = (km) => padL + (km / maxKm) * (W - padL - padR);
  const y = (ele) => H - padB - ((ele - minEle) / (maxEle - minEle)) * (H - padT - padB);

  const svg = s('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'elev__svg',
    role: 'img',
    'aria-label': `海拔剖面：${points.map((p) => `${p.name} ${p.ele} 米`).join('，')}`
  });

  for (const ele of [800, 1000, 1200]) {
    if (ele < minEle || ele > maxEle) continue;
    svg.appendChild(s('line', {
      x1: padL, x2: W - padR, y1: y(ele), y2: y(ele),
      stroke: '#DDD7C7', 'stroke-width': 0.8, 'stroke-dasharray': '2 4'
    }));
    svg.appendChild(s('text', { x: W - padR + 4, y: y(ele) + 3, 'font-size': 7.5, fill: '#8A917F' }, `${ele}m`));
  }

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.km).toFixed(1)},${y(p.ele).toFixed(1)}`).join(' ');
  const area = `${line} L${x(maxKm).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  svg.appendChild(s('path', { d: area, fill: '#DCE3D3', opacity: 0.8 }));
  svg.appendChild(s('path', { d: line, fill: 'none', stroke: '#234B3C', 'stroke-width': 2, 'stroke-linejoin': 'round' }));

  for (const p of points) {
    const selected = selectedId === p.id;
    const g = s('g', { class: 'elev__point' + (selected ? ' is-selected' : ''), 'data-point-id': p.id, style: { cursor: onSelect ? 'pointer' : 'default' } });
    g.appendChild(s('circle', { cx: x(p.km), cy: y(p.ele), r: selected ? 4.5 : 3.2, fill: selected ? '#A45A36' : '#234B3C', stroke: '#F7F4EC', 'stroke-width': 1.5 }));
    g.appendChild(s('text', { x: x(p.km), y: H - 6, 'text-anchor': 'middle', 'font-size': 7.5, fill: '#66705F' }, p.name.slice(0, 6)));
    if (onSelect) g.addEventListener('click', () => onSelect(p.id));
    svg.appendChild(g);
  }

  return svg;
}
