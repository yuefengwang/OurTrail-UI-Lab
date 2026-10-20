// 路线天气图 — 标准 / 375 紧凑两种布局
// 云底、降水概率、气温；标准视口额外绘制风箭头，375 把风放到选中详情。
import { s } from './charts.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function weatherChart(hours, point, { selectedAt, rangeStart, rangeEnd, onPick, compact = false } = {}) {
  const W = 327;
  const padL = 26, padR = 10;
  const plotW = W - padL - padR;
  const H = compact ? 246 : 286;
  const top = compact ? 20 : 22;
  const cloudTop = compact ? 32 : 30;
  const cloudBottom = compact ? 78 : 80;
  const rainTop = compact ? 90 : 104;
  const rainBottom = compact ? 140 : 158;
  const tempTop = compact ? 152 : 176;
  const tempBottom = compact ? 202 : 236;
  const bandHeight = tempBottom - top + 2;
  const keyLabelY = compact ? 13 : 18;
  const activityLabelY = compact ? 27 : 31;
  const xTickTop = tempBottom;
  const xLabelY = compact ? 236 : 270;
  const xTimeY = compact ? 244 : 279;
  const selectedRectY = compact ? 206 : 237;
  const selectedTextY = compact ? 215 : 246;
  const laneFont = compact ? 8.8 : 8.5;
  const smallFont = compact ? 8 : 7.5;

  const t0 = new Date(rangeStart).getTime();
  const t1 = new Date(rangeEnd).getTime();
  const x = (date) => padL + ((new Date(date).getTime() - t0) / (t1 - t0)) * plotW;

  const yCloud = (v) => cloudBottom - ((clamp(v, 600, 2400) - 600) / 1800) * (cloudBottom - cloudTop);
  const yRain = (v) => rainBottom - (clamp(v, 0, 100) / 100) * (rainBottom - rainTop);
  const temps = hours.map((h) => h.temp);
  const minT = Math.floor(Math.min(...temps) - 1);
  const maxT = Math.ceil(Math.max(...temps) + 1);
  const yTemp = (v) => tempBottom - ((v - minT) / (maxT - minT || 1)) * (tempBottom - tempTop);

  const svg = s('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'wx-chart__svg' + (compact ? ' is-compact' : ''),
    role: 'img',
    'aria-label': '路线天气趋势图：云底、降水概率、气温' + (compact ? '' : '与风')
  });

  /* 关键窗口背景 */
  const windows = [
    ['2026-10-24T06:00:00+08:00', '2026-10-24T10:00:00+08:00', '#A45A36', 0.09, '低云'],
    ['2026-10-24T12:00:00+08:00', '2026-10-24T17:00:00+08:00', '#8F3F35', 0.09, '阵雨'],
    ['2026-10-24T17:00:00+08:00', '2026-10-24T19:00:00+08:00', '#2F6B4C', 0.08, '减弱']
  ];
  for (const [a, b, color, op, label] of windows) {
    if (new Date(b) < new Date(rangeStart) || new Date(a) > new Date(rangeEnd)) continue;
    const xa = x(a), xb = x(b);
    svg.appendChild(s('rect', { x: xa, y: top, width: Math.max(2, xb - xa), height: bandHeight, fill: color, opacity: op }));
    svg.appendChild(s('text', { x: (xa + xb) / 2, y: keyLabelY, 'text-anchor': 'middle', 'font-size': laneFont, fill: color, 'font-weight': 700 }, label));
  }

  /* 活动窗口 */
  const ax = x('2026-10-24T07:00:00+08:00');
  const bx = x('2026-10-24T18:00:00+08:00');
  if (bx > padL && ax < W - padR) {
    svg.appendChild(s('rect', { x: ax, y: top, width: Math.max(2, bx - ax), height: bandHeight, fill: '#234B3C', opacity: 0.06 }));
    svg.appendChild(s('line', { x1: ax, x2: bx, y1: top + 2, y2: top + 2, stroke: '#234B3C', 'stroke-width': 1.4 }));
    svg.appendChild(s('text', { x: (ax + bx) / 2, y: activityLabelY, 'text-anchor': 'middle', 'font-size': compact ? 8.5 : 8, fill: '#234B3C', 'font-weight': 700 }, '活动日 10/24 07:00–18:00'));
  }

  /* lane labels */
  const lane = (y, label) => {
    svg.appendChild(s('line', { x1: padL, x2: W - padR, y1: y, y2: y, stroke: '#E1DCCD', 'stroke-width': 0.8 }));
    svg.appendChild(s('text', { x: 2, y: y - 3, 'font-size': laneFont, fill: '#8A917F', 'font-weight': 600 }, label));
  };
  lane(cloudBottom, '云底');
  lane(rainBottom, '降水');
  lane(tempBottom, '气温');

  /* 云底：面积 + 线 + 点海拔 */
  const cloudPts = hours.map((h) => `${x(h.at).toFixed(1)},${yCloud(h.cloudBase).toFixed(1)}`);
  const cloudArea = `M${padL},${cloudTop} L${cloudPts[0]} L${cloudPts.join(' L')} L${x(hours[hours.length - 1].at).toFixed(1)},${cloudTop} Z`;
  svg.appendChild(s('path', { d: cloudArea, fill: '#C9D3C2', opacity: 0.55 }));
  svg.appendChild(s('path', { d: `M${cloudPts.join(' L')}`, fill: 'none', stroke: '#5F6F57', 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }));
  const ey = yCloud(point.ele);
  svg.appendChild(s('line', { x1: padL, x2: W - padR, y1: ey, y2: ey, stroke: '#A45A36', 'stroke-width': 1, 'stroke-dasharray': '4 3' }));
  svg.appendChild(s('text', { x: W - padR - 2, y: ey - 3, 'text-anchor': 'end', 'font-size': compact ? 8.5 : 8, fill: '#A45A36', 'font-weight': 700 }, `${point.ele}m 海拔`));

  /* 降水：2h 聚合柱 */
  const buckets = [];
  for (let i = 0; i < hours.length; i += 2) {
    const chunk = hours.slice(i, i + 2);
    const at = chunk[0].at;
    const prob = Math.round(chunk.reduce((sum, h) => sum + h.precipProb, 0) / chunk.length);
    const mm = Math.round(chunk.reduce((sum, h) => sum + h.precipMm, 0) * 10) / 10;
    buckets.push({ at, prob, mm });
  }
  const bw = Math.max(4, (plotW / buckets.length) - 2);
  for (const b of buckets) {
    const bx0 = x(b.at) - bw / 2 + 1;
    const by = yRain(b.prob);
    svg.appendChild(s('rect', {
      x: bx0, y: by, width: bw, height: rainBottom - by,
      fill: b.prob >= 60 ? '#4C6E7A' : '#8FA6AA',
      opacity: b.prob >= 60 ? 0.95 : 0.55,
      rx: 1
    }));
    if (b.mm >= 0.8) {
      svg.appendChild(s('circle', { cx: bx0 + bw / 2, cy: by - 3, r: 1.4, fill: '#8F3F35' }));
    }
  }

  /* 气温：线 + 面积 */
  const tempPts = hours.map((h) => `${x(h.at).toFixed(1)},${yTemp(h.temp).toFixed(1)}`);
  const tempArea = `M${padL},${tempBottom} L${tempPts[0]} L${tempPts.join(' L')} L${x(hours[hours.length - 1].at).toFixed(1)},${tempBottom} Z`;
  svg.appendChild(s('path', { d: tempArea, fill: '#8F3F35', opacity: 0.06 }));
  svg.appendChild(s('path', { d: `M${tempPts.join(' L')}`, fill: 'none', stroke: '#8F3F35', 'stroke-width': 1.7, 'stroke-linejoin': 'round' }));

  /* 风：标准视口绘制；375 紧凑视口把风交给选中详情，避免第四层挤压 */
  if (!compact) {
    for (let i = 0; i < hours.length; i += 6) {
      const h = hours[i];
      const wx = x(h.at);
      const wy = 252;
      const len = 3 + Math.min(7, h.wind);
      svg.appendChild(s('line', { x1: wx - len / 2, x2: wx + len / 2, y1: wy, y2: wy, stroke: '#46657A', 'stroke-width': 1.2, 'stroke-linecap': 'round' }));
      svg.appendChild(s('path', { d: `M${wx + len / 2 - 2},${wy - 2} L${wx + len / 2},${wy} L${wx + len / 2 - 2},${wy + 2}`, fill: 'none', stroke: '#46657A', 'stroke-width': 1.1, 'stroke-linecap': 'round' }));
      svg.appendChild(s('text', { x: wx, y: wy + 9, 'text-anchor': 'middle', 'font-size': 7.2, fill: '#46657A' }, `${Math.round(h.wind)}`));
    }
  }

  /* x 轴：每 6 小时一个标签 */
  for (let i = 0; i < hours.length; i += 6) {
    const h = hours[i];
    const wx = x(h.at);
    const d = new Date(h.at);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    const time = `${String(d.getHours()).padStart(2, '0')}:00`;
    svg.appendChild(s('line', { x1: wx, x2: wx, y1: xTickTop, y2: xTickTop + 4, stroke: '#D6D0C0', 'stroke-width': 0.8 }));
    svg.appendChild(s('text', { x: wx, y: xLabelY, 'text-anchor': 'middle', 'font-size': smallFont, fill: '#8A917F' }, label));
    svg.appendChild(s('text', { x: wx, y: xTimeY, 'text-anchor': 'middle', 'font-size': smallFont, fill: '#8A917F' }, time));
  }

  /* 选中小时 */
  const selected = hours.find((h) => Math.abs(new Date(h.at) - new Date(selectedAt)) < 1) ||
    hours.reduce((best, h) => Math.abs(new Date(h.at) - new Date(selectedAt)) < Math.abs(new Date(best.at) - new Date(selectedAt)) ? h : best, hours[0]);
  if (selected) {
    const sx = x(selected.at);
    svg.appendChild(s('line', { x1: sx, x2: sx, y1: top, y2: tempBottom, stroke: '#173D32', 'stroke-width': 1.3, 'stroke-dasharray': '2 3' }));
    svg.appendChild(s('circle', { cx: sx, cy: yRain(selected.precipProb), r: 3.2, fill: '#F7F4EC', stroke: '#173D32', 'stroke-width': 1.4 }));
    svg.appendChild(s('circle', { cx: sx, cy: yTemp(selected.temp), r: 3.2, fill: '#F7F4EC', stroke: '#8F3F35', 'stroke-width': 1.4 }));
    const label = `${new Date(selected.at).getMonth() + 1}/${new Date(selected.at).getDate()} ${String(new Date(selected.at).getHours()).padStart(2, '0')}:00`;
    const lx = clamp(sx, 44, W - 44);
    svg.appendChild(s('rect', { x: lx - 36, y: selectedRectY, width: 72, height: 12, rx: 3, fill: '#173D32' }));
    svg.appendChild(s('text', { x: lx, y: selectedTextY, 'text-anchor': 'middle', 'font-size': compact ? 8 : 7.5, fill: '#F7F4EC', 'font-weight': 700 }, label));
  }

  /* 交互：点击整张图选择最近小时 */
  if (onPick) {
    const hit = s('rect', { x: padL, y: top, width: plotW, height: tempBottom - top, fill: 'transparent', style: { cursor: 'crosshair' } });
    hit.addEventListener('click', (e) => {
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const ratio = clamp((px - padL) / plotW, 0, 1);
      const target = t0 + ratio * (t1 - t0);
      const closest = hours.reduce((best, h) => Math.abs(new Date(h.at) - target) < Math.abs(new Date(best.at) - target) ? h : best, hours[0]);
      onPick(closest.at);
    });
    svg.appendChild(hit);
  }

  return svg;
}
