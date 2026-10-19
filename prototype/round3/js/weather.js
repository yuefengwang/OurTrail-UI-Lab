// OurTrail · Round 3 — 天气页（胜出设计语言 · Hybrid 的数据决策变体）
// 结构：位置头（接缝带变体 · 石色通栏 · 吸顶）
//        → 关键窗口卡（Hero Panel 变体 · 白面发丝线 · 无负外边距）
//        → 48h 时间轴（横向轨 · scroll-snap）
//        → 详情折叠（预报详情 + 演示数据声明）
//        → 脚注
// 排版纪律：衬线只给叙述主体（位置名 / 窗口标题）；事实与元信息一律无衬线 + tabular。
// 色彩纪律：陶土（--r3-accent）不用于气象——它只属于「紧迫」。好/坏窗口走语义色
//          （success / danger），且只以「状态词同构的 点 + 词」形式出现，不靠色块单独承载信息。
// 数据纪律：全部来自 DEMO（WEATHER_META / WEATHER_HOURS），派生一律走本地纯函数；
//          不虚构后端能力（交互只做 toast / 已有页面跳转）。
import { el, icon, foot, fmt, metaLine, stateBlock, skeletonRows } from './shared.js';

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/* 关键窗口语义：好窗口 = success，坏窗口 = danger（气象窗口与活动状态同构） */
const WINDOW_TONE = { 云海窗口: 'good', 降雨: 'bad' };

/* ---------------- 数据派生（纯函数） ---------------- */
/* label 形如「10/19 06:00」 */
const hhmm = (label) => String(label || '').split(' ')[1] || '';
const md = (label) => String(label || '').split(' ')[0] || '';

/* 温度取整：山顶 0.1° 无决策价值；风保留 1 位：阵风量级判断有意义 */
const tempT = (n) => String(Math.round(n));
const windT = (n) => String(Math.round(n * 10) / 10);

/* 区间文案：单一值不写区间 */
const band = (lo, hi, f) => (lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`);

const rangeOf = (list) => {
  const a = list[0];
  const b = list[list.length - 1];
  return `${md(a.label)} – ${md(b.label)}`;
};

/* 按 keyNote 把 48 小时里的关键小时收敛成窗口（云海窗口 / 降雨）。
   指标取窗口内逐时值的极值区间，不取平均——决策看的是这段最差/最好，不是均值。 */
function windowsOf(hours) {
  const groups = new Map();
  for (const h of hours) {
    if (!h.keyNote) continue;
    if (!groups.has(h.keyNote)) groups.set(h.keyNote, []);
    groups.get(h.keyNote).push(h);
  }
  const span = (list, key) => {
    const v = list.map((h) => h[key]);
    return [Math.min(...v), Math.max(...v)];
  };
  return [...groups.entries()].map(([key, list]) => ({
    key,
    tone: WINDOW_TONE[key] || 'neutral',
    hours: list,
    span: list.length,
    title: `${WEEK[list[0].t.getDay()]} ${hhmm(list[0].label)}–${hhmm(list[list.length - 1].label)}`,
    temp: span(list, 'temp'),
    precip: span(list, 'precip'),
    wind: span(list, 'wind'),
    cloud: span(list, 'cloud'),
  }));
}

/* meta.window 是作者写好的窗口摘要。末位「风 3 m/s」与卡片上按小时算出的风速区间
   重复且量级不同，同屏出现会互相矛盾 —— 保留条件与云海描述，风统一由事实带承载。 */
const extraOf = (meta, w) => {
  const row = (meta.window || []).find((r) => r && r[0] === w.title);
  return row ? row.slice(1, -1).join(' · ') : '';
};

/* ---------------- 共用小件 ---------------- */
/* 紧凑状态词：与 base 的 .status-word 同构（点 + 词 + 语义色），但为逐时格缩到 11px。 */
function chip(text, tone) {
  return el('span.wth-chip' + (tone && tone !== 'neutral' ? `.wth-chip--${tone}` : ''), { text });
}

/* 事实微元：标签 + 区间值 + 单位（标签弱、单位更弱，值最重 —— 行内栅格的扫描顺序） */
const metric = (label, value, unit) => el('span.wth-metric',
  el('span.wth-metric__k', { text: label }),
  el('span.wth-metric__v.num', { text: value }),
  el('span.wth-metric__u', { text: unit }));

/* ---------------- 1. 位置头（石色带变体 · 吸顶） ---------------- */
function locationBand(meta, ctx) {
  const a = ctx.D.featured;
  const onOpen = () => {
    if (ctx.flag === 'disabled') { ctx.ui.toast('演示：禁用态下入口保留，但当前不可操作'); return; }
    ctx.ui.go('detail');
  };
  return el('header.wth-location', { 'data-testid': 'r3-location' },
    el('div.wth-location__row',
      el('h1.wth-location__name.serif', { text: meta.location }),
      el('span.wth-location__elev.num',
        icon('mountain', { size: 13 }),
        el('span', { text: fmt(meta.elevationM) }),
        el('span.wth-location__elev-u', { text: 'm' }))),
    el('p.wth-location__verdict', { text: meta.verdict }),
    el('div.wth-location__foot',
      metaLine(
        el('span.wth-location__updated', { text: meta.updatedText }),
        el('button.wth-location__trip', {
          type: 'button',
          data: { activityId: a.id },
          'aria-label': `查看活动：${a.title}`,
          onClick: onOpen,
        },
          el('span.wth-location__trip-t', { text: a.title }),
          icon('arrow-right', { size: 13 }))
      )));
}

/* ---------------- 2. 关键窗口卡（Hero Panel 变体） ---------------- */
function windowCard(w, extra, onTap) {
  return el('article.wth-window-card', {
    class: `wth-window-card--${w.tone}`,
    role: 'button',
    tabindex: '0',
    'aria-label': `${w.key}，${w.title}，持续 ${w.span} 小时，点开看逐时数值`,
    onClick: () => onTap(w),
    onKeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(w); }
    },
  },
    el('div.wth-window-card__kick',
      chip(w.key, w.tone),
      el('span.wth-window-card__span.num', { text: `${w.span} 小时` })),
    el('h2.wth-window-card__title.serif', { text: w.title }),
    extra ? el('p.wth-window-card__sub', { text: extra }) : null,
    el('div.wth-window-card__facts',
      metric('气温', band(w.temp[0], w.temp[1], tempT), '°'),
      metric('降水', band(w.precip[0], w.precip[1], String), '%'),
      metric('风速', band(w.wind[0], w.wind[1], windT), 'm/s'),
      metric('云量', band(w.cloud[0], w.cloud[1], String), '%'))
  );
}

function windowsSkeleton(n = 2) {
  return Array.from({ length: n }, () =>
    el('article.wth-window-card.wth-window-card--sk', { 'aria-hidden': 'true' },
      el('div.skeleton.skeleton--line', { style: { width: '38%' } }),
      el('div.skeleton.skeleton--line', { style: { width: '72%', height: '20px', marginTop: '14px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '54%', marginTop: '12px' } }),
      el('div.skeleton.wth-window-card__sk-facts')));
}

/* ---------------- 3. 48h 时间轴（横向轨 · scroll-snap） ---------------- */
function hourCell(h, isDayStart, isNow) {
  const cell = el('button.wth-hour', {
    type: 'button',
    class: [
      h.night ? 'is-night' : '',
      h.key ? 'is-key' : '',
      isDayStart ? 'is-day' : '',
      isNow ? 'is-now' : '',
    ].filter(Boolean).join(' '),
    'aria-label': [
      h.label,
      `气温 ${tempT(h.temp)} 度`,
      `降水 ${h.precip}%`,
      `风 ${windT(h.wind)} 米每秒`,
      `云量 ${h.cloud}%`,
      h.keyNote ? h.keyNote : '',
    ].filter(Boolean).join('，'),
  },
    el('span.wth-hour__t.num', { text: h.label }),
    el('span.wth-hour__tmp.num', { text: `${tempT(h.temp)}°` }),
    el('span.wth-hour__kv',
      el('span.wth-hour__pair', {}, el('span.wth-hour__k', { text: '雨' }), el('span.num', { text: `${h.precip}%` })),
      el('span.wth-hour__pair', {}, el('span.wth-hour__k', { text: '云' }), el('span.num', { text: `${h.cloud}%` }))),
    el('span.wth-hour__pair.wth-hour__wind', {},
      el('span.wth-hour__k', { text: '风' }),
      el('span.num', { text: windT(h.wind) })),
    /* 关键格保留芯片位：非关键时为空，行高不会被芯片顶高一格。
       首格是「现在」——整条时间轴的读数原点，比任何关键窗口更需要被看见。 */
    el('span.wth-hour__chip',
      h.keyNote ? chip(h.keyNote, WINDOW_TONE[h.keyNote])
                : (isNow ? chip('现在', 'now') : null)));
  return cell;
}

function hoursSkeleton(n = 8) {
  return Array.from({ length: n }, () =>
    el('div.wth-hour.wth-hour--sk', { 'aria-hidden': 'true' },
      el('div.skeleton.wth-hour__sk')));
}

function timeline(hours, onTap, busy) {
  const cue = el('span.wth-timeline__cue', { 'aria-hidden': 'true' },
    icon('chevron-right'), el('span', { text: '向左滑' }));

  const cells = busy
    ? hoursSkeleton()
    : hours.map((h, i) => {
        const cell = hourCell(h, i > 0 && md(hours[i - 1].label) !== md(h.label), i === 0);
        cell.addEventListener('click', () => onTap(h));
        return cell;
      });

  const rail = el('div.wth-hours', {
    tabindex: '0',
    role: 'group',
    'aria-label': busy ? '48 小时预报加载中' : `逐时预报共 ${hours.length} 小时，可横向滑动`,
  }, cells);

  const sec = el('section.wth-timeline', { 'data-testid': 'r3-timeline' },
    el('div.wth-timeline__head',
      el('h2.wth-timeline__k', { text: '48 小时预报' }),
      el('span.wth-timeline__range.num', { text: hours.length ? rangeOf(hours) : '' }),
      cue),
    rail);

  if (busy) return sec;

  /* 真的滑过才换成位置计数：提示由真实滚动位置驱动，不预演。
     步长必须等布局完成后再量 —— 此刻本节点尚未挂进文档。 */
  let step = 0;
  const sync = () => {
    if (!step && cells.length > 1) {
      step = Math.round(cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().left) || 92;
    }
    const i = step > 0 ? Math.min(cells.length, Math.max(0, Math.round(rail.scrollLeft / step))) : 0;
    sec.classList.toggle('is-scrolled', rail.scrollLeft > 4);
    cue.textContent = '';
    if (i > 0) {
      cue.appendChild(el('span.num', { text: `${i + 1} / ${cells.length}` }));
    } else {
      cue.appendChild(icon('chevron-right'));
      cue.appendChild(el('span', { text: '向左滑' }));
    }
  };
  rail.addEventListener('scroll', sync, { passive: true });
  return sec;
}

/* ---------------- 4. 详情折叠（预报详情 + 演示数据声明） ---------------- */
/* 默认展开：演示数据声明必须一眼可见，不能藏在需要点开的折层里。 */
function detailFold(meta, busy) {
  return el('section.wth-detail', { 'data-testid': 'r3-detail' },
    el('details.wth-detail__box', { open: true },
      el('summary.wth-detail__summary',
        el('span.wth-detail__k',
          icon('info', { size: 14 }),
          el('span', { text: '预报详情' })),
        el('span.wth-detail__chev', { 'aria-hidden': 'true' }, icon('chevron-down'))),
      busy
        ? el('div.wth-detail__body', skeletonRows(1, { thumb: false }))
        : el('div.wth-detail__body',
            el('p.wth-detail__text', { text: meta.detail }),
            el('p.wth-detail__source',
              icon('shield', { size: 12 }),
              el('span', { text: meta.source })))));
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const meta = D.weather.meta;
  const hours = D.weather.hours || [];
  const flag = ctx.flag || '';
  const busy = flag === 'loading';
  const ui = ctx.ui || {};

  const onTapHour = (h) => {
    if (flag === 'disabled') { ui.toast('演示：禁用态下入口保留，但当前不可操作'); return; }
    ui.toast(`${h.label} · 气温 ${tempT(h.temp)}° · 降水 ${h.precip}% · 风 ${windT(h.wind)} m/s · 云量 ${h.cloud}%`);
  };
  const onTapWindow = (w) => {
    if (flag === 'disabled') { ui.toast('演示：禁用态下入口保留，但当前不可操作'); return; }
    ui.toast(`${w.key} ${w.title} · 气温 ${band(w.temp[0], w.temp[1], tempT)}° · 降水 ${band(w.precip[0], w.precip[1], String)}% · 风 ${band(w.wind[0], w.wind[1], windT)} m/s`);
  };

  /* empty 演示态：制造「48 小时内无关键窗口」，走统一空态而不是硬渲染 0 张卡 */
  const windows = flag === 'empty' ? [] : windowsOf(hours);

  /* 状态块：首个 r3-state，其余 r3-state-more（与 hybrid 同构） */
  let marked = false;
  const mark = (node) => {
    node.setAttribute('data-testid', marked ? 'r3-state-more' : 'r3-state');
    marked = true;
    return el('div.wth-state', node);
  };

  const windowsSlot = el('section.wth-windows', { 'data-testid': 'r3-windows' },
    el('div.wth-windows__head',
      el('h2.wth-windows__k', { text: '关键窗口' }),
      /* 加载中不报计数（还没数出来），用骨架占位保住行高，不制造布局跳动 */
      busy
        ? el('div.skeleton.skeleton--line', { style: { width: '52px', marginTop: '3px' } })
        : el('span.wth-windows__n.num', {
            text: windows.length ? `${windows.length} 个窗口` : '0 个窗口',
          })));

  if (busy) {
    windowsSlot.appendChild(el('div.wth-windows__grid', windowsSkeleton()));
  } else {
    /* 错误/禁用：状态块与已加载内容并存（保留重试入口 / 保留入口），与 hybrid 同策略。
       文案改写：shared 的默认文案是「活动」语境的，天气页不能照搬。 */
    if (flag === 'error') {
      windowsSlot.appendChild(mark(stateBlock('error', {
        title: '预报加载失败',
        body: '演示错误态：保留重试入口与已加载的逐时读数，不清空本地演示数据。',
        onAction: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端'),
      })));
    } else if (flag === 'disabled') {
      windowsSlot.appendChild(mark(stateBlock('disabled', {
        body: '演示禁用态：未授权查看该目的地的逐时预报，窗口入口保留但不可操作。',
      })));
    }
    if (!windows.length) {
      windowsSlot.appendChild(mark(stateBlock('empty', {
        iconName: 'cloud',
        title: '48 小时内没有关键窗口',
        body: '演示空态：既未识别到云海窗口，也未预报转雨。逐时数值仍在下方时间轴里。',
        actionText: '重新获取',
        onAction: () => ui.toast('演示：重新获取只还原本地演示数据，未接气象服务'),
      })));
    } else {
      windowsSlot.appendChild(el('div.wth-windows__grid',
        windows.map((w) => windowCard(w, extraOf(meta, w), onTapWindow))));
    }
  }

  const band_ = locationBand(meta, ctx);

  const page = el('div.page.wth-page', {
    data: { page: 'weather' },
    class: flag === 'disabled' ? 'is-disabled' : '',
  },
    band_,
    windowsSlot,
    timeline(hours, onTapHour, busy),
    detailFold(meta, busy),
    foot(D)
  );

  /* 吸顶状态：真的滚到带子上沿才记为 pinned（吸顶后下框线加重，本页不用阴影做层级） */
  page.addEventListener('scroll', () => {
    const top = band_.getBoundingClientRect().top - page.getBoundingClientRect().top;
    band_.classList.toggle('is-pinned', top <= 0.5);
  }, { passive: true });

  return page;
}
