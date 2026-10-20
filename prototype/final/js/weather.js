// 路线天气 — 活动窗口 × 路线点 × 海拔 × 预报限制
// 模拟预报常驻标注；不写“会有云海/安全”这类绝对结论。
import {
  el, icon, appBar, iconBtn, sectionHead, btn, segmented, toast
} from './ui.js';
import { weatherChart } from './weather-chart.js';
import {
  FEATURED, ROUTE, WEATHER_WINDOWS, hoursForPoint, hhmm, md, dayLabel
} from './data.js';

const isoEta = (point) => `2026-10-24T${point.eta}:00+08:00`;

function nearestHour(hours, iso) {
  const target = new Date(iso).getTime();
  return hours.reduce((best, h) =>
    Math.abs(new Date(h.at) - target) < Math.abs(new Date(best.at) - target) ? h : best, hours[0]);
}
const hourLabel = (h) => `${md(h.at)} ${String(new Date(h.at).getHours()).padStart(2, '0')}:00`;
const windowEndLabel = (start, end) => {
  const d = new Date(end);
  d.setMinutes(d.getMinutes() + 1);
  const sameDay = new Date(start).toDateString() === d.toDateString();
  return sameDay ? hhmm(d) : `${md(d)} ${hhmm(d)}`;
};
const pointOf = (id) => ROUTE.find((p) => p.id === id) || ROUTE[1];

function rangeOf(state) {
  if (state.range === 24) {
    return { start: '2026-10-24T00:00:00+08:00', end: '2026-10-25T00:00:00+08:00', label: '活动日 24h' };
  }
  return { start: FEATURED.weather.range[0], end: FEATURED.weather.range[1], label: '前后 48h' };
}

function impactFor(point, h) {
  if (h.inCloud && h.precipProb >= 55) return '云底低于所选点，山脊段可能处于云中，且降水概率高；能见度与路面条件都会下降。建议缩短山脊停留，按领队判断通过。';
  if (h.inCloud) return '云底低于所选点，山脊段可能处于云中，能见度下降；石阶湿滑时放慢下坡。';
  if (h.precipProb >= 60) return '降水概率高，石阶与下坡会更滑；山脊风大时不在无遮挡处停留。';
  if (h.precipProb >= 30) return '有短时小雨可能，带好雨具；石阶和林下路段注意防滑。';
  return '降水概率相对较低，但山区天气变化快；仍按领队要求携带雨具与防风层。';
}

function metric(label, value, unit, { tone = '' } = {}) {
  return el('div.wx-metric' + (tone ? `.is-${tone}` : ''),
    el('div.wx-metric__k', { text: label }),
    el('div.wx-metric__v',
      el('span.num', { text: String(value) }),
      unit ? el('span.wx-metric__u', { text: unit }) : null));
}

/* ---------------- Identity ---------------- */
function hero(a) {
  return el('section.wx-hero.bleed',
    el('div.wx-hero__inner',
      el('div.wx-hero__top',
        el('span.wx-hero__kicker', { text: '活动日参考' }),
        el('span.wx-badge.wx-badge--sim', { text: '模拟预报 · 非真实气象服务' })),
      el('h1.wx-hero__title', { text: a.title }),
      el('p.wx-hero__meta', { text: `活动日 10/${new Date(a.startAt).getDate()} ${dayLabel(a.startAt).split(' ')[1]} 07:00–18:00 · 茶店子 07:00 集合` }),
      el('div.wx-hero__facts',
        el('span', { text: `${a.routeName}` }),
        el('span.wx-hero__dot', { text: '·' }),
        el('span', { text: `${a.distanceKm} km / ${a.ascentM} m` })),
      el('div.wx-summary',
        el('span.wx-summary__icon', icon('rain', { size: 18 })),
        el('div.wx-summary__body',
          el('div.wx-summary__t', { text: a.weather.summary }),
          el('div.wx-summary__d', { text: '这是基于模拟预报的判断，不替代领队或组织者的出发决定。' })),
        el('span.wx-summary__conf', { text: `判断置信 ${a.weather.confidence}` })),
      el('div.wx-scope',
        el('span', { text: '预报范围' }),
        el('span.num', { text: '10/23 20:00 – 10/25 20:00' }),
        el('span.wx-scope__dot', { text: '·' }),
        el('span', { text: '模拟生成 10/23 18:40' }))));
}

/* ---------------- Point selector ---------------- */
function pointSelector(state, ctx) {
  return el('div.wx-points',
    ROUTE.map((p) => el('button.wx-point' + (state.point === p.id ? '.is-active' : ''), {
      type: 'button',
      onClick: () => ctx.ui.setState({ point: p.id, hour: '' }, { preserveScroll: true })
    },
      el('span.wx-point__name', { text: p.name }),
      el('span.wx-point__meta',
        el('span.num', { text: `${p.ele} m` }),
        el('span', { text: p.eta })))));
}

/* ---------------- Selected hour detail ---------------- */
function selectedDetail(point, h, { eta = '' } = {}) {
  return el('div.wx-selected',
    el('div.wx-selected__head',
      el('div',
        el('span.wx-selected__time.num', { text: `${hourLabel(h)} · ${point.name}` }),
        el('span.wx-selected__note', {
          text: eta && eta !== String(new Date(h.at).getHours()).padStart(2, '0') + ':00'
            ? `抵达 ${eta} · 取最近整点` : '逐时模拟预报'
        })),
      el('span.wx-selected__cloud' + (h.inCloud ? '.is-in' : ''),
        el('span.shape.shape--' + (h.inCloud ? 'dot' : 'check'), { 'aria-hidden': 'true' }),
        el('span', { text: h.inCloud ? '在云中' : '云上' }))),
    el('div.wx-selected__grid',
      metric('降水概率', h.precipProb, '%', { tone: h.precipProb >= 60 ? 'clay' : '' }),
      metric('降水量', h.precipMm.toFixed(1), 'mm'),
      metric('风 / 阵风', `${h.wind.toFixed(1)} / ${h.gust.toFixed(1)}`, 'm/s', { tone: h.gust >= 8 ? 'clay' : '' }),
      metric('气温', h.temp.toFixed(1), '°C'),
      metric('云底', h.cloudBase, 'm'),
      metric('能见度', h.visibility.toFixed(1), 'km', { tone: h.visibility < 3 ? 'clay' : '' })),
    el('div.wx-impact',
      icon('info', { size: 14 }),
      el('span', { text: impactFor(point, h) })));
}

/* ---------------- Key windows ---------------- */
function windowsSection(state, ctx) {
  const range = rangeOf(state);
  const rows = WEATHER_WINDOWS.filter((w) => new Date(w.end) >= new Date(range.start) && new Date(w.start) <= new Date(range.end));
  const sec = el('section.wx-windows',
    sectionHead('关键时段', `${rows.length} 个 · 点开查看`));
  if (!rows.length) {
    sec.appendChild(el('p.rule-note', { text: '所选范围内没有识别到需要特别关注的时段；逐时数据仍在趋势图中。' }));
    return sec;
  }
  for (const w of rows) {
    const p = pointOf(w.pointId);
    const hs = hoursForPoint(p).filter((h) => new Date(h.at) >= new Date(w.start) && new Date(h.at) <= new Date(w.end));
    const loP = Math.min(...hs.map((h) => h.precipProb));
    const hiP = Math.max(...hs.map((h) => h.precipProb));
    const loW = Math.min(...hs.map((h) => h.wind));
    const hiW = Math.max(...hs.map((h) => h.gust));
    const active = new Date(state.hour || isoEta(p)) >= new Date(w.start) && new Date(state.hour || isoEta(p)) <= new Date(w.end);
    sec.appendChild(el('button.wx-window' + (active ? '.is-active' : ''), {
      type: 'button',
      onClick: () => ctx.ui.setState({ point: w.pointId, hour: w.start }, { preserveScroll: true })
    },
      el('span.wx-window__top',
        el('span.wx-window__tag' + `.is-${w.tone}`, { text: w.label }),
        el('span.wx-window__time.num', { text: `${md(w.start)} ${hhmm(w.start)}–${windowEndLabel(w.start, w.end)}` })),
      el('span.wx-window__effect', { text: w.effect }),
      el('span.wx-window__stats',
        el('span', { text: `${p.name} · ${p.ele} m` }),
        el('span.num', { text: `降水 ${loP}–${hiP}%` }),
        el('span.num', { text: `阵风 ${Math.round(loW)}–${Math.round(hiW)} m/s` }))));
  }
  return sec;
}

/* ---------------- Point comparison ---------------- */
function compareSection(state, ctx) {
  const sec = el('section.wx-compare',
    sectionHead('沿路线对比', '抵达时点 · 最近整点'));
  const head = el('div.wx-compare__head',
    el('span', { text: '路线点' }),
    el('span', { text: '气温' }),
    el('span', { text: '降水' }),
    el('span', { text: '风' }),
    el('span', { text: '能见' }));
  sec.appendChild(head);
  for (const p of ROUTE) {
    const hs = hoursForPoint(p);
    const h = nearestHour(hs, isoEta(p));
    sec.appendChild(el('button.wx-compare__row' + (state.point === p.id ? '.is-active' : ''), {
      type: 'button',
      onClick: () => ctx.ui.setState({ point: p.id, hour: '' }, { preserveScroll: true })
    },
      el('span.wx-compare__name',
        el('span', { text: p.name }),
        el('span.wx-compare__ele.num', { text: `${p.ele} m · ${p.eta}` })),
      el('span.num', { text: `${Math.round(h.temp)}°` }),
      el('span.num', { text: `${h.precipProb}%` }),
      el('span.num', { text: h.wind.toFixed(1) }),
      el('span.num', { text: h.inCloud ? `云中 ${h.visibility.toFixed(1)} km` : `${h.visibility.toFixed(0)} km` })));
  }
  sec.appendChild(el('p.rule-note', { text: '温度按点海拔递减估算；云底与能见度为模拟派生值。点选一行会切换上方图表与选中时段。' }));
  return sec;
}

/* ---------------- Data notes ---------------- */
function notes(a) {
  const items = [
    ['数据性质', '模拟预报，不是真实气象服务；用于验证界面与决策表达。'],
    ['范围', '10/23 20:00 – 10/25 20:00；活动窗口 10/24 07:00–18:00。'],
    ['海拔', '路线点海拔为演示标注；温度按海拔递减估算，未做真实地形订正。'],
    ['限制', a.weather.limitation],
    ['行动边界', '天气页给出参考与建议，不替代领队或组织者的出发判断；没有任何“保证安全”的结论。']
  ];
  const sec = el('section.wx-notes', sectionHead('怎么看这份预报', ''));
  const list = el('div.wx-notes__list');
  for (const [k, v] of items) {
    list.appendChild(el('div.wx-notes__row',
      el('span.wx-notes__k', { text: k }),
      el('span.wx-notes__v', { text: v })));
  }
  sec.appendChild(list);
  sec.appendChild(el('div.provenance',
    icon('info', { size: 13 }),
    el('span', { text: '模拟数据 · 非真实气象服务 · 更新时间 10/23 18:40 · UI Lab Final Pass' })));
  return sec;
}

/* ---------------- Render ---------------- */
export function render(ctx) {
  const { D, state, ui } = ctx;
  const a = D.activities.find((x) => x.id === state.activityId) || D.featured;
  const page = el('div.page.wx-page');
  const appbar = appBar({
    back: () => ui.go('detail', { activityId: a.id }),
    subtitle: '活动天气',
    title: '路线天气',
    actions: [iconBtn('calendar', '活动详情', () => ui.go('detail', { activityId: a.id }))]
  });
  page.appendChild(appbar);

  if (a.id !== FEATURED.id) {
    page.appendChild(el('div.empty',
      el('span.empty__icon', icon('cloud', { size: 26 })),
      el('h2.empty__title', { text: '该活动暂无路线天气演示' }),
      el('p.empty__body', { text: '路线天气需要活动路线点与活动时间；本轮只在主活动上提供完整演示。' }),
      btn('打开青城后山天气', { variant: 'secondary', onClick: () => ui.go('weather', { activityId: FEATURED.id, point: 'r2', range: 48, hour: '', wdata: 'normal' }) })));
    return page;
  }

  if (state.data === 'loading') {
    page.appendChild(hero(a));
    page.appendChild(el('div.loading-block', { text: '正在加载路线天气…' }));
    return page;
  }
  if (state.data === 'error') {
    page.appendChild(hero(a));
    page.appendChild(el('div.empty',
      el('span.empty__icon', icon('alert', { size: 26 })),
      el('h2.empty__title', { text: '路线天气加载失败' }),
      el('p.empty__body', { text: '网络或服务暂时不可用。不会展示过期或伪造的逐时数字。' }),
      btn('重新加载', { variant: 'secondary', onClick: () => ui.toast('演示：重新加载只还原本地演示数据') })));
    return page;
  }

  const point = pointOf(state.point);
  const range = rangeOf(state);
  const allHours = hoursForPoint(point);
  const hours = allHours.filter((h) => new Date(h.at) >= new Date(range.start) && new Date(h.at) < new Date(range.end));
  const eta = point.eta;
  const defaultAt = isoEta(point);
  let selectedAt = state.hour || defaultAt;
  if (new Date(selectedAt) < new Date(range.start) || new Date(selectedAt) >= new Date(range.end)) selectedAt = defaultAt;
  let selected = nearestHour(hours, selectedAt);

  page.appendChild(hero(a));

  if (state.wdata === 'no-data') {
    page.appendChild(el('div.wx-nodata',
      el('span.wx-nodata__icon', icon('cloud', { size: 26 })),
      el('h2.wx-nodata__t', { text: '当前范围没有可展示的逐时数据' }),
      el('p.wx-nodata__d', { text: '当前模拟预报只覆盖 10/23 20:00–10/25 20:00。活动日 10/24 在范围内；超出范围时不插值、不编造数字。' }),
      btn('回到活动日', { variant: 'secondary', onClick: () => ui.setState({ wdata: 'normal', hour: '' }, { preserveScroll: true }) })));
    page.appendChild(notes(a));
    return page;
  }

  page.appendChild(el('div.wx-points-wrap', pointSelector(state, ctx)));

  const chartSlot = el('div.wx-chart');
  const selectedSlot = el('div');
  const paintSelected = (iso) => {
    state.hour = iso;
    selected = nearestHour(hours, iso);
    chartSlot.replaceChildren(
      el('div.wx-chart__head',
        el('div',
          el('h2.wx-chart__title', { text: '活动日趋势' }),
          el('span.wx-chart__sub', { text: `${point.name} ${point.ele} m · 活动窗口 07:00–18:00` })),
        segmented([
          { key: 48, label: '48h' },
          { key: 24, label: '24h' }
        ], state.range, (key) => ctx.ui.setState({ range: Number(key), hour: '' }, { preserveScroll: true }), { ariaLabel: '预报范围' })),
      weatherChart(hours, point, { selectedAt: selected.at, rangeStart: range.start, rangeEnd: range.end, onPick: paintSelected, compact: state.vp === 375 }),
      el('div.wx-legend',
        el('span.wx-legend__i', el('i.wx-legend__dot.is-cloud'), el('span', { text: '云底' })),
        el('span.wx-legend__i', el('i.wx-legend__dot.is-rain'), el('span', { text: '降水概率' })),
        el('span.wx-legend__i', el('i.wx-legend__dot.is-temp'), el('span', { text: '气温' })),
        state.vp === 375
          ? el('span.wx-legend__i', el('span', { text: '风见选中详情' }))
          : el('span.wx-legend__i', el('i.wx-legend__dot.is-wind'), el('span', { text: '风（m/s）' })),
        el('span.wx-legend__hint', { text: '点击图选小时' })));
    selectedSlot.replaceChildren(selectedDetail(point, selected, { eta }));
  };
  paintSelected(selectedAt);

  page.appendChild(chartSlot);
  page.appendChild(selectedSlot);
  page.appendChild(windowsSection({ ...state, hour: selected.at.toISOString() }, ctx));
  page.appendChild(compareSection(state, ctx));
  page.appendChild(notes(a));
  page.appendChild(el('div.wx-return',
    btn('返回活动详情', { variant: 'secondary', onClick: () => ui.go('detail', { activityId: a.id }) })));

  page.addEventListener('scroll', () => {
    const top = appbar.getBoundingClientRect().top - page.getBoundingClientRect().top;
    appbar.classList.toggle('is-scrolled', page.scrollTop > 6);
  }, { passive: true });

  return page;
}
