// 方案三 · Hybrid Discovery（混合发现）「先看，再挑」
// 页面 = 刊头 → 主卡（通栏 16:9 图 + 图下纸面文字）→ 接缝带（石色通栏 · sticky）
//        → 比较列表（按月分组 · 页签/搜索实时过滤）→ 脚注
// 排版纪律：衬线只给叙述主体（刊头标题 / 主卡标题）；事实与元信息一律无衬线。
// 数据纪律：全部来自 DEMO，派生一律走 shared；不虚构后端能力。
import {
  el, icon, foot, fmt,
  searchField, filterTabs, filterCounts, filterActivities,
  groupByMonth, dateParts, departureLabel, demoDeparture,
  statusWord, seatsNode, isOpen, remaining, photoOf,
  stateBlock, skeletonRows,
} from './shared.js';

/* 演示时钟 10 月 17 日（与 shared.DEMO_NOW 同源） */
const ISSUE_DATE = '10 月 17 日';
const MAST_KICKER = '先看，再挑';

/* ---------------- 排序与派生 ---------------- */
/* 演示历：按真实日期升序；缺月/日或已结束（无时刻）排到末尾。 */
const dateKey = (a) => {
  const { month, day } = dateParts(a);
  return month && day ? new Date(2025, month - 1, day).getTime() : Number.MAX_SAFE_INTEGER;
};
const byDate = (a, b) => dateKey(a) - dateKey(b);
const isPast = (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled';

/* 主卡 = 演示时钟下最近出发的可报名活动（名额紧张同样是可报名）。 */
function nextUpcoming(list) {
  return list
    .filter((a) => isOpen(a) && demoDeparture(a) && demoDeparture(a).diffH > 0)
    .sort((x, y) => demoDeparture(x).diffH - demoDeparture(y).diffH)[0] || null;
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
const feeFact = (a) => {
  const m = /¥\s*(\d+)/.exec(a.feeNote || '');
  return m
    ? el('span.fact',
        el('span.fact__label', { text: 'AA' }),
        el('span.fact__value.num', { text: `¥${m[1]}` }))
    : null;
};
/* 主卡事实带图标（宽度充足）：距离 / 爬升 / 领队 / 人均费用。
   余位与出发倒计时合并在 kicker 行（见 heroCard）；难度已在路线行；
   集合时刻已由图上 stamp 表达——黄金信息位不重复同一事实。 */
const heroFacts = (a) => [
  el('span.fact', icon('route', { size: 13 }),
    el('span.fact__value.num', { text: String(a.distanceKm) }),
    el('span.fact__unit', { text: 'km' })),
  el('span.fact', icon('mountain', { size: 13 }),
    el('span.fact__value.num', { text: fmt(a.ascentM) }),
    el('span.fact__unit', { text: 'm 爬升' })),
  leaderFact(a), feeFact(a),
].filter(Boolean);

/* 余位 7 / 24：总名额与剩余合并成一个事实；≤3 时用陶土。 */
function seatsFraction(a) {
  if (!isOpen(a)) return null;
  return el('span.fact',
    el('span.fact__label', { text: '余位' }),
    el('span.fact__value.num' + (remaining(a) <= 3 ? '.is-urgent' : ''),
      { text: `${remaining(a)} / ${a.seatsTotal}` }));
}

/* ---------------- 1. 刊头 ---------------- */
function masthead(D) {
  return el('header.hy-mast',
    el('div.hy-mast__row',
      el('span.hy-mast__kicker.t-kicker', { text: MAST_KICKER }),
      el('span.hy-mast__date.num', { text: ISSUE_DATE })),
    el('h1.hy-mast__title.t-display.serif', { text: '发现' }),
    el('p.hy-mast__meta', {
      text: `成都周边 · ${D.activities.length} 场活动 · 按出发时间`,
    })
  );
}

/* ---------------- 2. 主卡（通栏图 + 图下纸面文字；无卡片、无叠压） ---------------- */
function heroCard(a, onOpen) {
  const { dep, now } = urgency(a);
  const when = departureLabel(a);
  const seats = seatsFraction(a);
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
    el('div.hy-hero__body',
      el('div.hy-hero__kick',
        el('span.hy-hero__kicker.t-kicker', { text: '最近出发' }),
        el('span.hy-hero__meta',
          dep && dep.diffH > 0
            ? el('span.hy-hero__count' + (now ? '.is-now' : ''), { text: `距出发 ${dep.diffD} 天` })
            : null,
          seats ? el('span.dot-sep', { text: '·' }) : null,
          seats)),
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
    el('div.hy-hero__body',
      el('div.skeleton.skeleton--line', { style: { width: '28%' } }),
      el('div.skeleton.skeleton--line', { style: { width: '74%', height: '20px', marginTop: '14px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '56%', marginTop: '14px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '90%', marginTop: '22px' } }),
      el('div.skeleton.skeleton--line', { style: { width: '42%', marginTop: '18px', height: '44px' } }))
  );
}

/* ---------------- 3. 接缝带（石色通栏 · sticky 吸顶） ---------------- */
/* 接缝带在本文件 render() 内组装：需要实时更新的筛选状态与计数节点。 */

/* ---------------- 4. 比较列表（与索引同栅格 · 按月分组） ---------------- */
function monthHead(g) {
  const mds = g.items.map((a) => dateParts(a).md).filter(Boolean).sort();
  const range = mds.length > 1 ? `${mds[0]}–${mds[mds.length - 1]}` : (mds[0] || '');
  return el('div.hy-month' + (g.isPast ? '.hy-month--past' : ''),
    el('div.hy-month__k', { text: `${g.label} · ${g.items.length} 场` }),
    el('div.hy-month__n.num', { text: range }));
}

function compareRow(a, onOpen, past = false) {
  const { day, week } = dateParts(a);
  return el('article.hy-row' + (past ? '.hy-row--past' : ''), {
    data: { activityId: a.id },
    ...tapAttrs(a, onOpen),
  },
    el('div.hy-row__date',
      el('div.hy-row__d.num', { text: day ? String(day) : '—' }),
      el('div.hy-row__w', { text: week })),
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

/* 默认视图：未来在前、过去归入末尾独立分组；已结束/已取消按最近发生排序。 */
function defaultGroups(list) {
  const upcoming = list.filter((a) => !isPast(a));
  const past = list.filter(isPast).sort((a, b) => dateKey(b) - dateKey(a));
  const groups = groupByMonth(upcoming);
  if (past.length) {
    groups.push({ month: -1, label: '已结束与已取消', items: past, isPast: true });
  }
  return groups;
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const flag = ctx.flag || '';
  const ui = ctx.ui || {};
  const busy = flag === 'loading';

  const sorted = D.activities.slice().sort(byDate);
  const hero = nextUpcoming(D.activities) || sorted[0];
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

  const seamTitle = el('span', { 'data-testid': 'r3-seam-title', text: '全部活动' });
  const seam = el('section.hy-seam', { 'data-testid': 'r3-seam' },
    el('div.hy-seam__top',
      el('h2.hy-seam__k',
        seamTitle,
        el('span.hy-seam__k-sub', { text: '按出发时间' })),
      countNode),
    search,
    tabsSlot
  );
  search.classList.add('hy-seam__field');
  search.setAttribute('data-testid', 'r3-search');

  const listSlot = el('div.hy-list-slot');

  function buildList(items, shown, isDefault) {
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
    const groups = isDefault ? defaultGroups(shown) : groupByMonth(shown);
    for (const g of groups) {
      box.appendChild(monthHead(g));
      for (const a of g.items) box.appendChild(compareRow(a, onOpen, !!g.isPast));
    }
    return box;
  }

  function paint() {
    const items = flag === 'empty' ? [] : filterActivities(sorted, state);
    const defaultView = state.filter === 'all' && !state.q;
    const shown = defaultView && hero ? items.filter((a) => a.id !== hero.id) : items;
    listSlot.replaceChildren(buildList(items, shown, defaultView));
    seamTitle.textContent = state.q
      ? '搜索结果'
      : state.filter === 'all'
        ? '全部活动'
        : { open: '可报名', formed: '已成行', ended: '已结束' }[state.filter] || '全部活动';
    countNode.textContent = defaultView && items.length
      ? `${shown.length} 场 · 置顶已在上方`
      : `${items.length} 场`;
  }

  syncTabs();
  paint();

  const page = el('div.page.hy-page', { data: { layout: 'hybrid' } },
    masthead(D),
    busy ? heroSkeleton() : heroCard(hero, onOpen),
    seam,
    el('div.hy-below', listSlot, foot(D, 'Round 4 设计工艺实验 · 演示数据 · 非真实后端'))
  );

  /* 接缝带吸顶状态：真的滚到带子上沿才记为 pinned（吸顶后下框线加重，不加阴影） */
  page.addEventListener('scroll', () => {
    const top = seam.getBoundingClientRect().top - page.getBoundingClientRect().top;
    seam.classList.toggle('is-pinned', top <= 0.5);
  }, { passive: true });

  return page;
}