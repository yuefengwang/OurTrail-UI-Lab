// 方案三 · Hybrid Discovery（混合发现）「先看，再挑」
// 页面 = 刊头 → 主卡（16:9 图 + 负外边距信息板）→ 本周出发横滑轨 → 接缝带（石色通栏 · sticky）
//        → 比较列表（按月分组 · 页签/搜索实时过滤）→ 脚注
// 排版纪律：衬线只给叙述主体（刊头标题 / 主卡标题 / 横滑卡标题）；事实与元信息一律无衬线。
// 数据纪律：全部来自 DEMO，派生一律走 shared；不虚构后端能力。
import {
  el, icon, foot, fmt,
  searchField, filterTabs, filterCounts, filterActivities,
  groupByMonth, dateParts, timeShort, departureLabel, demoDeparture,
  statusWord, seatsNode, isOpen, photoOf,
  stateBlock, skeletonRows,
} from './shared.js';

/* 演示时钟 10 月 17 日（与 shared.DEMO_NOW 同源） */
const ISSUE_DATE = '10 月 17 日';
const MAST_KICKER = '发现 · 先看，再挑';
const RAIL_N = 3;                       // brief §4.3：横滑轨 3 张

/* ---------------- 排序与派生 ---------------- */
/* 演示历：按真实日期升序；缺月/日或已结束（无时刻）排到末尾。 */
const dateKey = (a) => {
  const { month, day } = dateParts(a);
  return month && day ? new Date(2025, month - 1, day).getTime() : Number.MAX_SAFE_INTEGER;
};
const byDate = (a, b) => dateKey(a) - dateKey(b);

/* 横滑轨 = 演示时钟下最近出发的 N 场可报名活动（名额紧张同样是可报名）。
   主卡 = 轨上最近的一场，避免两处各说各话。 */
function railOf(list, n) {
  return list
    .filter((a) => isOpen(a) && demoDeparture(a) && demoDeparture(a).diffH > 0)
    .sort((x, y) => demoDeparture(x).diffH - demoDeparture(y).diffH)
    .slice(0, n);
}

/* 「距出发 N 天 / 明晚 22:10 出发」：文字来自 shared.departureLabel，
   紧迫判定与 editorial 行（≤36h）同口径。 */
function urgency(a) {
  const dep = demoDeparture(a);
  return { dep, now: !!dep && dep.diffH > 0 && dep.diffH <= 36 };
}

/* 条目统一入口：卡片 / 行整体可点，键盘可达。 */
function tapAttrs(a, onOpen) {
  return {
    role: 'button',
    tabindex: '0',
    'aria-label': `${a.title}，${a.dateText} ${a.weekdayText}，查看安排`,
    onClick: () => onOpen(a),
    onKeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(a); }
    },
  };
}

/* ---------------- 事实微元（统一结构：标签 + 值 + 单位） ---------------- */
/* 行内事实不带图标：栅格主列只有 ~150px，图标会把它挤到第二行，行高就不再统一。 */
const distFact = (a) => el('span.fact',
  el('span.fact__value.num', { text: String(a.distanceKm) }),
  el('span.fact__unit', { text: 'km' }));
const ascentFact = (a) => el('span.fact',
  el('span.fact__value.num', { text: fmt(a.ascentM) }),
  el('span.fact__unit', { text: 'm 爬升' }));
const leaderFact = (a) => el('span.fact',
  el('span.fact__label', { text: '领队' }),
  el('span.fact__value', { text: a.leader }));
const quotaFact = (a) => el('span.fact',
  el('span.fact__label', { text: '名额' }),
  el('span.fact__value.num', { text: String(a.seatsTotal) }));
const diffFact = (a) => el('span.fact',
  el('span.fact__label', { text: '难度' }),
  el('span.fact__value', { text: a.difficultyText }));
const timeFact = (a) => (timeShort(a)
  ? el('span.fact',
      el('span.fact__label', { text: '集合' }),
      el('span.fact__value.num', { text: timeShort(a) }))
  : null);
/* 主卡事实带图标（宽度充足）：距离 / 爬升 / 难度 / 领队 / 名额 / 集合 / 余位 */
const heroFacts = (a) => [
  el('span.fact', icon('route', { size: 13 }),
    el('span.fact__value.num', { text: String(a.distanceKm) }),
    el('span.fact__unit', { text: 'km' })),
  el('span.fact', icon('mountain', { size: 13 }),
    el('span.fact__value.num', { text: fmt(a.ascentM) }),
    el('span.fact__unit', { text: 'm 爬升' })),
  diffFact(a), leaderFact(a), quotaFact(a), timeFact(a), seatsNode(a),
];

/* ---------------- 1. 刊头 ---------------- */
function masthead(D, rail) {
  return el('header.hy-mast',
    el('div.hy-mast__row',
      el('span.hy-mast__kicker.t-kicker', { text: MAST_KICKER }),
      el('span.hy-mast__date.num', { text: ISSUE_DATE })),
    el('h1.hy-mast__title.t-display.serif', { text: '发现' }),
    el('p.hy-mast__lede', {
      text: `成都周边 · ${D.activities.length} 场 · 先看 ${rail.length} 场即将出发`,
    })
  );
}

/* ---------------- 2. 主卡（签名：信息板向上叠压图片 24px） ---------------- */
function heroCard(a, onOpen) {
  const { dep, now } = urgency(a);
  const when = departureLabel(a);
  return el('article.hy-hero', {
    data: { activityId: a.id },
    'data-testid': 'r3-hero',
    ...tapAttrs(a, onOpen),
  },
    el('div.hy-hero__media',
      photoOf(a, { ratio: '16 / 9', alt: '' }),
      el('div.hy-hero__scrim'),
      el('div.hy-hero__stamp',
        el('span.hy-hero__stamp-now' + (now ? '.is-now' : ''), { text: when || a.timeText }),
        el('span.dot-sep', { text: '·' }),
        el('span.num', { text: `${a.dateText} ${a.weekdayText}` }),
        el('span.dot-sep', { text: '·' }),
        el('span.num', { text: a.city }))),
    el('div.hy-hero__panel',
      el('div.hy-hero__kick',
        el('span.hy-hero__kicker.t-kicker', { text: '最近出发' }),
        dep && dep.diffH > 0
          ? el('span.hy-hero__count' + (now ? '.is-now' : ''), { text: `距出发 ${dep.diffD} 天` })
          : null),
      el('h2.hy-hero__title', { text: a.title }),
      el('p.hy-hero__route', { text: `${a.routeName} · ${a.difficultyText}` }),
      el('p.hy-hero__lede.clamp-2', { text: a.lede }),
      el('div.hy-hero__facts.facts', heroFacts(a)),
      el('div.hy-hero__actions',
        el('span.btn.btn--primary.hy-hero__cta', '查看安排', icon('arrow-right')),
        statusWord(a))
    )
  );
}

function heroSkeleton() {
  return el('div.hy-hero.hy-hero--sk', { 'data-testid': 'r3-hero' },
    el('div.hy-hero__media', el('div.skeleton')),
    el('div.hy-hero__panel',
      el('div.skeleton.skeleton--line', { style: { width: '28%' } }),
      el('div.skeleton.skeleton--line', { style: { width: '74%', height: '20px', marginTop: '14px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '56%', marginTop: '14px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '90%', marginTop: '22px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '42%', marginTop: '18px', height: '44px' } }))
  );
}

/* ---------------- 3. 本周出发 · 横滑轨 ---------------- */
function railCard(a, onOpen) {
  const { md, week } = dateParts(a);
  return el('article.hy-card', {
    data: { activityId: a.id },
    ...tapAttrs(a, onOpen),
  },
    el('div.hy-card__media', photoOf(a, { ratio: '4 / 3', alt: '' })),
    el('div.hy-card__body',
      el('div.hy-card__date.num', { text: `${md} · ${week}` }),
      el('h3.hy-card__title', { text: a.title }),
      el('div.hy-card__meta', statusWord(a), seatsNode(a)))
  );
}

function cardSkeleton() {
  return el('div.hy-card.hy-card--sk',
    el('div.hy-card__media.skeleton'),
    el('div.hy-card__body',
      el('div.skeleton.skeleton--line', { style: { width: '62%' } }),
      el('div.skeleton.skeleton--line', { style: { width: '94%', marginTop: '10px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '54%', marginTop: '14px' } }))
  );
}

function weekSection(items, onOpen, busy) {
  const mds = items.map((a) => dateParts(a).md).filter(Boolean).sort();
  const range = mds.length > 1 ? `${mds[0]}–${mds[mds.length - 1]}` : (mds[0] || '');
  const cue = el('span.hy-week__cue', { 'aria-hidden': 'true' },
    icon('chevron-right'), el('span', { text: '向左滑' }));
  const sec = el('section.hy-week',
    el('div.hy-week__head',
      el('h2.hy-week__k', { text: '本周出发' }),
      el('span.hy-week__n.num', { text: range ? `${range} · ${items.length} 场` : `${items.length} 场` }),
      cue),
    el('div.hy-rail', {
      'data-testid': 'r3-rail',
      tabindex: '0',
      role: 'group',
      'aria-label': `本周出发，${items.length} 场，可横向滑动`,
    }, (busy ? Array.from({ length: RAIL_N }, cardSkeleton)
             : items.map((a) => railCard(a, onOpen))))
  );
  if (busy) return sec;
  /* 真实滚动才更新提示：位置 >0 显示第几张，否则提示滑动。
     步长必须等布局完成后再量——此刻本节点尚未挂进文档。 */
  const rail = sec.querySelector('.hy-rail');
  const cards = [...rail.children];
  let step = 0;
  const sync = () => {
    if (!step && cards.length > 1) {
      step = Math.round(cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left) || 172;
    }
    const i = step > 0 ? Math.min(cards.length, Math.max(0, Math.round(rail.scrollLeft / step))) : 0;
    sec.classList.toggle('is-scrolled', rail.scrollLeft > 4);
    cue.textContent = '';
    if (i > 0) {
      cue.appendChild(el('span', { text: `${i + 1} / ${cards.length}` }));
    } else {
      cue.appendChild(icon('chevron-right'));
      cue.appendChild(el('span', { text: '向左滑' }));
    }
  };
  rail.addEventListener('scroll', sync, { passive: true });
  return sec;
}

/* ---------------- 4. 接缝带（石色通栏 · sticky 吸顶） ---------------- */
/* 接缝带在本文件 render() 内组装：需要实时更新的筛选状态与计数节点。 */

/* ---------------- 5. 比较列表（与索引同栅格 · 按月分组） ---------------- */
function monthHead(g) {
  const mds = g.items.map((a) => dateParts(a).md).filter(Boolean).sort();
  const range = mds.length > 1 ? `${mds[0]}–${mds[mds.length - 1]}` : (mds[0] || '');
  return el('div.hy-month',
    el('div.hy-month__k', { text: `${g.label} · ${g.items.length} 场` }),
    el('div.hy-month__n.num', { text: range }));
}

function compareRow(a, onOpen) {
  const { day, week } = dateParts(a);
  const { now } = urgency(a);
  const label = departureLabel(a);
  /* 只在「≤36h 即将出发」时补一行倒计时：日期轴只有 34px，
     「距出发 N 天」会撞到缩略图；而出发远近已由按时间排序的日期列承载。 */
  const when = now ? label.replace(/\d{1,2}:\d{2}/, '').replace(/\s+/g, ' ').trim() : '';
  return el('article.hy-row', {
    data: { activityId: a.id },
    ...tapAttrs(a, onOpen),
  },
    el('div.hy-row__date',
      el('div.hy-row__d.num', { text: day ? String(day) : '—' }),
      el('div.hy-row__w', { text: week }),
      when ? el('div.hy-row__now.is-now', { text: when }) : null),
    el('div.hy-row__thumb', photoOf(a, { ratio: '1 / 1', alt: '' })),
    el('div.hy-row__main',
      el('div.hy-row__title', { text: a.title }),
      el('div.hy-row__route', { text: `${a.routeName} · ${a.city}` }),
      el('div.hy-row__facts.facts', distFact(a), ascentFact(a))),
    el('div.hy-row__side',
      statusWord(a),
      seatsNode(a),
      el('span.hy-row__leader', { text: `领队 ${a.leader}` }))
  );
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const flag = ctx.flag || '';
  const ui = ctx.ui || {};
  const busy = flag === 'loading';

  const sorted = D.activities.slice().sort(byDate);
  const rail = railOf(D.activities, RAIL_N);
  const hero = rail[0] || sorted[0];
  const counts = filterCounts(D.activities);
  const state = { filter: 'all', q: '' };

  const onOpen = (a) => {
    if (flag === 'disabled') { ui.toast('演示：禁用态下入口保留，但当前不可操作'); return; }
    ui.go('detail');
  };

  /* --- 比较区（页签/搜索只作用于此，计数联动） --- */
  const searchInput = { node: null };
  const onClear = () => {
    state.filter = 'all';
    state.q = '';
    if (searchInput.node) searchInput.node.__input.value = '';
    syncTabs();
    paint();
  };

  const countNode = el('span.hy-seam__n.num');
  const tabsSlot = el('div.hy-seam__tabs-slot');
  function syncTabs() {
    const t = filterTabs({ counts, active: state.filter, onPick: (key) => {
      state.filter = key;
      syncTabs();
      paint();
    } });
    t.classList.add('hy-tabs');
    t.setAttribute('data-testid', 'r3-tabs');
    tabsSlot.replaceChildren(t);
  }

  const search = searchField({
    placeholder: '搜索活动、路线或城市',
    onInput: (v) => { state.q = v; paint(); },
  });
  searchInput.node = search;

  const seam = el('section.hy-seam', { 'data-testid': 'r3-seam' },
    el('div.hy-seam__top',
      el('h2.hy-seam__k',
        el('span', { text: '全部活动' }),
        el('span.hy-seam__k-sub', { text: '按出发时间' })),
      countNode),
    search,
    tabsSlot
  );
  search.classList.add('hy-seam__field');
  search.setAttribute('data-testid', 'r3-search');

  const listSlot = el('div.hy-list-slot');

  function buildList(items) {
    const box = el('section.hy-compare', { 'data-testid': 'r3-list' });
    let stateMarked = false;
    const mark = (node) => {
      if (stateMarked) node.setAttribute('data-testid', 'r3-state-more');
      else { node.setAttribute('data-testid', 'r3-state'); stateMarked = true; }
      return el('div.hy-state', node);
    };

    if (busy) {
      box.appendChild(el('div.hy-load', skeletonRows(5)));
      return box;
    }
    if (flag === 'error') {
      box.appendChild(mark(stateBlock('error', {
        onAction: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端'),
      })));
    } else if (flag === 'disabled') {
      box.appendChild(mark(stateBlock('disabled')));
    }
    if (!items.length) {
      box.appendChild(mark(stateBlock('empty', { onAction: onClear })));
      return box;
    }
    for (const g of groupByMonth(items)) {
      box.appendChild(monthHead(g));
      for (const a of g.items) box.appendChild(compareRow(a, onOpen));
    }
    return box;
  }

  function paint() {
    const items = flag === 'empty' ? [] : filterActivities(sorted, state);
    listSlot.replaceChildren(buildList(items));
    countNode.textContent = `${items.length} 场`;
  }

  syncTabs();
  paint();

  const page = el('div.page.hy-page', { data: { layout: 'hybrid' } },
    masthead(D, rail),
    busy ? heroSkeleton() : heroCard(hero, onOpen),
    weekSection(rail, onOpen, busy),
    seam,
    el('div.hy-below', listSlot, foot(D))
  );

  /* 接缝带吸顶状态：真的滚到带子上沿才记为 pinned（吸顶后下框线加重，不加阴影） */
  page.addEventListener('scroll', () => {
    const top = seam.getBoundingClientRect().top - page.getBoundingClientRect().top;
    seam.classList.toggle('is-pinned', top <= 0.5);
  }, { passive: true });

  return page;
}