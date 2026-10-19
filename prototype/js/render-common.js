// OurTrail Visual Direction Lab — 渲染基础库
// el(): 极简 DOM 构建器; icon(): 内联 SVG 图标集 (stroke 消费 --lab-icon-stroke)
// 所有风格模块共用；不得引入外部依赖。

export function el(tag, attrs = {}, ...children) {
  const parts = tag.split('.');
  const node = document.createElement(parts[0] || 'div');
  const classes = parts.slice(1);
  if (attrs && typeof attrs === 'object' && !(attrs instanceof Node) && !Array.isArray(attrs)) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') { classes.push(v); }
      else if (k === 'text') { node.textContent = v; }
      else if (k === 'html') { node.innerHTML = v; }
      else if (k === 'style' && typeof v === 'object') { Object.assign(node.style, v); }
      else if (k === 'data' && typeof v === 'object') { for (const [dk, dv] of Object.entries(v)) node.dataset[dk] = dv; }
      else if (k.startsWith('on') && typeof v === 'function') { node.addEventListener(k.slice(2).toLowerCase(), v); }
      else { node.setAttribute(k, v); }
    }
  } else if (attrs !== undefined && attrs !== null) { children.unshift(attrs); }
  if (classes.length) node.className = classes.filter(Boolean).join(' ');
  append(node, children);
  return node;
}

export function append(node, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false || c === true) continue;
    if (Array.isArray(c)) append(node, c);
    else if (c instanceof Node) node.appendChild(c);
    else node.appendChild(document.createTextNode(String(c)));
  }
}

export function frag(...children) { const f = document.createDocumentFragment(); append(f, children); return f; }

/* ---------- SVG 图标集 (viewBox 24, stroke=currentColor) ---------- */
const PATHS = {
  'arrow-right': 'M4 12H19M13.5 6L19.5 12L13.5 18',
  'chevron-right': 'M9.5 5.5L16 12L9.5 18.5',
  'chevron-down': 'M5.5 9.5L12 16L18.5 9.5',
  check: 'M4.5 12.5L10 18L19.5 6.5',
  'check-circle': 'M12 3.5A8.5 8.5 0 1 1 12 20.5A8.5 8.5 0 1 1 12 3.5ZM8.5 12.2L11 14.7L15.8 9.4',
  pin: 'M12 21C12 21 5.5 14.6 5.5 10A6.5 6.5 0 0 1 18.5 10C18.5 14.6 12 21 12 21ZM12 12.4A2.4 2.4 0 1 0 12 7.6A2.4 2.4 0 0 0 12 12.4Z',
  clock: 'M12 3.5A8.5 8.5 0 1 1 12 20.5A8.5 8.5 0 1 1 12 3.5ZM12 7.5V12L15.5 14',
  calendar: 'M4 6.5A1.5 1.5 0 0 1 5.5 5H18.5A1.5 1.5 0 0 1 20 6.5V18.5A1.5 1.5 0 0 1 18.5 20H5.5A1.5 1.5 0 0 1 4 18.5ZM4 10H20M8.5 3.5V7M15.5 3.5V7',
  users: 'M9 11.5A3.5 3.5 0 1 0 9 4.5A3.5 3.5 0 0 0 9 11.5ZM3.5 19.5C3.5 15.9 5.9 13.5 9 13.5C12.1 13.5 14.5 15.9 14.5 19.5M16 4.9A3.5 3.5 0 0 1 16 11.6M16.5 13.7C18.9 14.2 20.5 16.1 20.5 19.5',
  car: 'M6.2 8.8L7.4 5.9C7.6 5.4 8.1 5 8.7 5H15.3C15.9 5 16.4 5.4 16.6 5.9L17.8 8.8M6.2 8.8H17.8C18.8 8.8 19.6 9.6 19.6 10.6V15H4.4V10.6C4.4 9.6 5.2 8.8 6.2 8.8ZM7 15V17.5M17 15V17.5M7.5 11.5H9M15 11.5H16.5',
  seat: 'M6.5 4H17.5V13H6.5ZM6.5 16H17.5M7.5 16V20M16.5 16V20M8 20H16',
  sun: 'M12 8A4 4 0 1 1 12 16A4 4 0 1 1 12 8ZM12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.3 5.3L7 7M17 17L18.7 18.7M18.7 5.3L17 7M7 17L5.3 18.7',
  cloud: 'M6.8 18A4.2 4.2 0 0 1 7.1 9.7A5.6 5.6 0 0 1 17.6 11.2A3.4 3.4 0 0 1 17 18Z',
  rain: 'M6.8 15A4.2 4.2 0 0 1 7.1 6.7A5.6 5.6 0 0 1 17.6 8.2A3.4 3.4 0 0 1 17 15ZM8.5 17.5L7.8 20M12 17.5L11.3 20M15.5 17.5L14.8 20',
  wind: 'M3 8.5H14A2.6 2.6 0 1 0 11.4 5.9M3 12.5H18A2.6 2.6 0 1 1 15.4 15.1M3 16.5H10.5',
  temp: 'M9.8 4.8A2.2 2.2 0 0 1 14.2 4.8V13.1A4.6 4.6 0 1 1 9.8 13.1ZM12 8.5V16.2',
  search: 'M10.8 17.1A6.3 6.3 0 1 0 10.8 4.5A6.3 6.3 0 0 0 10.8 17.1ZM15.5 15.5L20.5 20.5',
  filter: 'M4 7H20M7 12.5H17M10 18H14',
  share: 'M6 13.9A2 2 0 1 0 6 10A2 2 0 0 0 6 13.9ZM17 8.5A2 2 0 1 0 17 4.5A2 2 0 0 0 17 8.5ZM17 19.5A2 2 0 1 0 17 15.5A2 2 0 0 0 17 19.5ZM7.8 10.9L15.2 7.1M7.8 13.1L15.2 16.9',
  alert: 'M12 3.5L22 20.5H2ZM12 10V14.6M12 17.5V17.6',
  info: 'M12 3.5A8.5 8.5 0 1 1 12 20.5A8.5 8.5 0 1 1 12 3.5ZM12 10.8V16.4M12 7.4V7.5',
  route: 'M5.5 20.5A2 2 0 1 0 5.5 16.5A2 2 0 0 0 5.5 20.5ZM18.5 7.5A2 2 0 1 0 18.5 3.5A2 2 0 0 0 18.5 7.5ZM7.5 18.5H13A3.5 3.5 0 0 0 13 11.5H11A3.5 3.5 0 0 1 11 4.5H16.5',
  flag: 'M6 21V4.5M6 5.2C9 3.7 12 6.7 15 5.2V13C12 14.5 9 11.5 6 13',
  mountain: 'M3 19.5L9.5 8L14 15L16.5 11L21 19.5ZM9.5 8L11.3 11',
  phone: 'M7.5 3.5H16.5A1.5 1.5 0 0 1 18 5V19A1.5 1.5 0 0 1 16.5 20.5H7.5A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5ZM10.5 17.8H13.5',
  refresh: 'M18.8 12A6.8 6.8 0 1 1 16.6 7M16.6 3.2V7.2H20.6',
  moon: 'M20 14.6A8.6 8.6 0 1 1 9.4 4A7 7 0 0 0 20 14.6Z',
  snow: 'M12 4V20M5 8L19 16M19 8L5 16',
  edit: 'M4 19.8L8 18.9L19.2 7.7L16.3 4.8L5.1 16ZM14.9 6.2L17.8 9.1',
  plus: 'M12 5V19M5 12H19',
  x: 'M6 6L18 18M18 6L6 18',
  more: 'M5.5 12A1.5 1.5 0 1 0 5.5 12.01M12 12A1.5 1.5 0 1 0 12 12.01M18.5 12A1.5 1.5 0 1 0 18.5 12.01',
  building: 'M5.5 9.5L12 4L18.5 9.5M6.5 9.5V19H17.5V9.5M10 19V14H14V19',
  walk: 'M13.5 5.4A1.9 1.9 0 1 0 13.5 5.39M13.2 7.6L11.6 12.2L8.4 13.6L9.8 17.8M11.6 12.2L14.4 17.6M13.2 7.6L16.4 10.2',
  ticket: 'M4 7.5A1.5 1.5 0 0 1 5.5 6H18.5A1.5 1.5 0 0 1 20 7.5V10A2 2 0 0 0 20 14V16.5A1.5 1.5 0 0 1 18.5 18H5.5A1.5 1.5 0 0 1 4 16.5V14A2 2 0 0 0 4 10ZM14.5 7V17',
  shield: 'M12 3.5L19.5 6.3V11.8C19.5 16.4 16.5 19.6 12 20.5C7.5 19.6 4.5 16.4 4.5 11.8V6.3Z',
  bookmark: 'M7 4.5H17V20L12 16.4L7 20Z',
  'door-exit': 'M13.5 4.5H6.5A1.5 1.5 0 0 0 5 6V18A1.5 1.5 0 0 0 6.5 19.5H13.5M10 12H21M21 12L17.5 8.5M21 12L17.5 15.5',
  layers: 'M12 3.5L21 8.5L12 13.5L3 8.5ZM4.5 12.5L12 16.8L19.5 12.5M4.5 16L12 20.3L19.5 16',
  timer: 'M12 5.5V3M9 3H15M12 5.5A7.5 7.5 0 1 1 4.5 13A7.5 7.5 0 0 1 12 5.5ZM12 9.5V13L14.8 14.6',
  battery: 'M3 8.5H17.5V15.5H3ZM19.5 11V13M5.5 11H13V13H5.5Z',
  signal: 'M4 18V14M9 18V10.5M14 18V7M19 18V4',
  ring: 'M12 3.5A8.5 8.5 0 1 1 12 20.5A8.5 8.5 0 1 1 12 3.5ZM12 8A4 4 0 1 1 12 16A4 4 0 1 1 12 8Z',
};

export function icon(name, { cls = '', size = null } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', ('lab-icon ' + cls).trim());
  svg.setAttribute('aria-hidden', 'true');
  if (size) { svg.style.width = size + 'px'; svg.style.height = size + 'px'; }
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', PATHS[name] || PATHS.info);
  svg.appendChild(path);
  return svg;
}

/* ---------- 数值与文本小工具 ---------- */
export const fmt = (n) => Number(n).toLocaleString('zh-CN');
export const pad2 = (n) => String(n).padStart(2, '0');

export function timeText(hhmm) { return hhmm; }

export function countdownText(hours) {
  const d = Math.floor(hours / 24), h = hours % 24;
  return d > 0 ? `${d} 天 ${h} 时` : `${h} 小时`;
}

/* ---------- 图片: 带加载失败的优雅回退 ---------- */
export function photo(src, { alt = '', credit = '', cls = '', ratio = null } = {}) {
  const wrap = el('div.photo' + (cls ? '.' + cls : ''));
  if (ratio) wrap.style.aspectRatio = ratio;
  const img = el('img', { src, alt, loading: 'lazy' });
  img.addEventListener('error', () => {
    wrap.classList.add('photo--fallback');
    img.remove();
  }, { once: true });
  wrap.appendChild(img);
  if (credit) wrap.appendChild(el('span.photo__credit', { text: credit }));
  return wrap;
}
