// 方案二 · Curated Activity Index（策展索引）「索引」
// 页面 = 一座可扫描的活动索引（没有封面故事，日期是第一主轴）：
//   索引头 → 检索区（强分段 + 框式搜索） → 下一场出发带(a1) → 月度索引(其余按月分组) → 脚注
// 排版纪律：衬线只给叙述主体（页面大标题 / 出发带标题）；日期、事实与元信息一律无衬线 + tabular。
import {
  el, icon, foot, fmt,
  searchField, filterTabs, filterCounts, filterActivities,
  groupByMonth, dateParts, timeShort, nextDeparture, departureLabel, demoDeparture,
  statusWord, seatsNode, photoOf, summaryLine,
  stateBlock, skeletonRows,
} from './shared.js';

/* 演示时钟与 shared.demoDeparture 同一时钟（10/17 周五 22:10）。只用于索引头当日日期。 */
const INDEX_DATE = '10 月 17 日';

/* 「距出发 N 天」全部由 demoDeparture 推导，不写死天数；≤36h 视为紧迫（陶土的唯一用途之一）。 */
function countdownNote(a) {
  const dep = demoDeparture(a);
  if (!dep || dep.diffH <= 0) return null;
  return {
    text: dep.diffH >= 24 ? `距出发 ${dep.diffD} 天` : '距出发不足 1 天',
    urgent: dep.diffH <= 36,
  };
}

const sortKey = (a) => {
  const { month, day } = dateParts(a);
  return month && day ? new Date(2025, month - 1, day).getTime() : Number.MAX_SAFE_INTEGER;
};
const byDate = (a, b) => sortKey(a) - sortKey(b);

/* 行内事实（无图标，12px tabular）——三处复用，保证同一份事实三种排版完全一致 */
const distFact = (a) => el('span.fact',
  el('span.fact__value.num', { text: String(a.distanceKm) }),
  el('span.fact__unit', { text: 'km' }));
const ascentFact = (a) => el('span.fact',
  el('span.fact__value.num', { text: fmt(a.ascentM) }),
  el('span.fact__unit', { text: 'm 爬升' }));
const quotaFact = (a) => el('span.fact',
  el('span.fact__label', { text: '名额' }),
  el('span.fact__value.num', { text: String(a.seatsTotal) }));
const leaderFact = (a) => el('span.fact',
  el('span.fact__label', { text: '领队' }),
  el('span.fact__value', { text: a.leader }));

/* 难度与路线名同处一行，但难度不参与省略：路线名可以被截断，难度不行。 */
const difficultyNode = (a) => el('span.cu-row__diff', { text: a.difficultyText });

/* 条目整体可点 + 键盘可达（热区：行 76px / 出发带 >120px，均 ≥44）。 */
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

/* ---------------- 1. 索引头 ---------------- */
function indexHead(D) {
  return el('header.cu-head',
    el('div.cu-head__cue',
      el('span.cu-head__kicker.t-kicker', { text: '发现 · 活动索引' }),
      el('span.cu-head__date.num', { text: INDEX_DATE })),
    el('h1.cu-head__title', { text: '发现' }),
    el('p.cu-head__lede', { text: summaryLine(D) })
  );
}

/* ---------------- 2. 下一场出发带（a1 · 石色信息带） ---------------- */
function nextBand(a, onOpen) {
  const { month, day, week } = dateParts(a);
  const cd = countdownNote(a);
  const when = departureLabel(a);
  const whenLine = when
    ? el('p.cu-band__when', el('span', { text: when }), icon('arrow-right', { size: 14 }))
    : null;

  return el('div.cu-band.bleed', {
    data: { activityId: a.id },
    'data-testid': 'r3-next',
    ...tapAttrs(a, onOpen),
  },
    el('div.cu-band__cue',
      el('span.cu-head__kicker.t-kicker', { text: '下一场出发' }),
      cd ? el('span.cu-band__count' + (cd.urgent ? '.is-urgent' : ''), { text: cd.text }) : null),

    el('div.cu-band__main',
      el('div.cu-band__date',
        el('span.cu-band__d.num', { text: month ? `${month} 月 ${day} 日` : '—' }),
        el('span.cu-band__w', { text: week }),
        el('span.cu-band__t.num', { text: timeShort(a) || '—' })),
      el('div.cu-band__body',
        el('h2.cu-band__title', { text: a.title }),
        el('p.cu-band__route', { text: a.routeName }),
        whenLine),
      el('div.cu-band__thumb', photoOf(a, { ratio: '4 / 3', alt: '' }))),

    el('div.cu-band__foot',
      /* 领队不在此重复：它在下方每一行的规格列里逐条给出。 */
      el('div.cu-band__facts.facts', distFact(a), ascentFact(a), quotaFact(a)),
      el('div.cu-band__right', statusWord(a), seatsNode(a)))
  );
}

/* 加载态：结构与真实出发带同形，避免布局跳动。 */
function nextBandSkeleton() {
  const line = (cls) => el('div.skeleton', { class: cls });
  return el('div.cu-band.bleed.is-loading', { 'data-testid': 'r3-next' },
    el('div.cu-band__cue', line('cu-sk--cue'), line('cu-sk--cue2')),
    el('div.cu-band__main',
      el('div.cu-band__date', line('cu-sk--date'), line('cu-sk--date-s'), line('cu-sk--date-s')),
      el('div.cu-band__body', line('cu-sk--title'), line('cu-sk--route'), line('cu-sk--when')),
      el('div.cu-band__thumb', el('div.skeleton'))),
    el('div.cu-band__foot', line('cu-sk--foot')));
}

/* ---------------- 3. 月度索引 ---------------- */
function monthHeader(g) {
  const mds = g.items.map((a) => dateParts(a).md).filter(Boolean).sort();
  const range = mds.length > 1 ? `${mds[0]}–${mds[mds.length - 1]}` : (mds[0] || '');
  return el('div.cu-month',
    el('div.cu-month__k', { text: `${g.label} · ${g.items.length} 场` }),
    el('div.cu-month__n.num', { text: range }));
}

function indexRow(a, onOpen) {
  const { md, week } = dateParts(a);
  return el('article.cu-row', {
    data: { activityId: a.id },
    ...tapAttrs(a, onOpen),
  },
    el('div.cu-row__date',
      el('span.cu-row__md.num', { text: md || '—' }),
      el('span.cu-row__w', { text: week })),
    el('div.cu-row__thumb', photoOf(a, { ratio: '1 / 1', alt: '' })),
    el('div.cu-row__main',
      el('h3.cu-row__title', { text: a.title }),
      el('p.cu-row__route',
        el('span.cu-row__routeName', { text: a.routeName }),
        difficultyNode(a)),
      el('div.cu-row__facts.facts', distFact(a), ascentFact(a))),
    /* 右列 = 规格列：状态词 / 剩余名额 / 领队（均来自真实字段） */
    el('div.cu-row__side', statusWord(a), seatsNode(a), leaderFact(a))
  );
}

/* 状态区（空 / 错 / 禁 / 加载）——列表区同一块位置，不清空已加载结构 */
function stateWrap(node) {
  return el('div.cu-state', { 'data-testid': 'r3-state' }, node);
}

/* ---------------- 4. 脚注统计 ---------------- */
function footBlock(D, state) {
  const q = state.q.trim();
  const active = state.filter !== 'all' || !!q;
  const hit = filterActivities(D.activities, state).length;
  return el('div.cu-foot',
    el('div.cu-foot__stat',
      el('span', { text: `共 ${D.activities.length} 场 · 演示数据` }),
      active ? el('span.cu-foot__hit', { text: `当前筛选 ${hit} 场` }) : null),
    foot(D));
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const flag = ctx.flag || '';
  const ui = ctx.ui || {};
  const state = { filter: 'all', q: '' };

  /* 下一场出发是全页唯一的功能性重点：来自完整数据集，不随检索条件变化。 */
  const band = nextDeparture(D.activities) || D.activities[0];
  const all = D.activities.slice().sort(byDate);
  /* 默认视图：出发带已完整展示该活动，索引不再重复它（10 月 4 场 / 11 月 4 场）。
     一旦筛选或搜索生效，索引必须给出完整命中集（含 a1）——否则会出现
     「出发带显示赵公山、列表却搜不到」的死角，也与 editorial 日历口径不一致。 */
  const pinnedOut = all.filter((a) => !band || a.id !== band.id);

  const onOpen = (a) => {
    if (flag === 'disabled') { ui.toast('演示：禁用态下入口保留，但当前不可操作'); return; }
    ui.go('detail');
  };
  const onClear = () => {
    state.filter = 'all';
    state.q = '';
    if (searchInput) searchInput.value = '';
    rebuildTabs();
    paint();
  };
  const paint = () => {
    listSlot.replaceChildren(buildIndex());
    footSlot.replaceChildren(footBlock(D, state));
  };

  const search = searchField({
    value: state.q,
    placeholder: '搜索活动、路线或城市',
    onInput: (v) => { state.q = v; paint(); },
  });
  search.setAttribute('data-testid', 'r3-search');
  const searchInput = search.__input;

  const tabsSlot = el('div');
  function buildTabs() {
    const tabs = filterTabs({
      counts: filterCounts(D.activities),
      active: state.filter,
      onPick: (key) => { state.filter = key; rebuildTabs(); paint(); },
    });
    tabs.classList.add('cu-tabs');
    tabs.setAttribute('data-testid', 'r3-tabs');
    return tabs;
  }
  function rebuildTabs() { tabsSlot.replaceChildren(buildTabs()); }
  rebuildTabs();

  function buildIndex() {
    const active = flag !== 'empty' && (state.filter !== 'all' || state.q.trim() !== '');
    const visible = flag === 'empty' ? [] : filterActivities(active ? all : pinnedOut, state);
    const idx = el('div.cu-index', { 'data-testid': 'r3-list' });
    /* 注记随状态变化：
       默认视图报索引行数并说明「下一场出发已在上方」，解释行数与分段计数的差值；
       筛选/搜索生效时直接报命中数（此时行数 === 页签计数）；
       加载中尚未拿到结果不报数；错误 / 禁用态同理。 */
    const noCount = flag === 'loading' || flag === 'error' || flag === 'disabled';
    const plainCount = active || flag === 'empty';
    const note = noCount ? null : el('span.cu-index__note', {
      text: plainCount ? `${visible.length} 场` : `${visible.length} 场 · 下一场出发已在上方`,
    });
    idx.appendChild(el('div.cu-index__head',
      el('span.cu-head__kicker.t-kicker', { text: '月度索引' }), note));

    if (flag === 'loading') { idx.appendChild(stateWrap(skeletonRows(5))); return idx; }
    if (flag === 'error') {
      idx.appendChild(stateWrap(stateBlock('error', {
        onAction: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端'),
      })));
      return idx;
    }
    if (flag === 'disabled') { idx.appendChild(stateWrap(stateBlock('disabled'))); return idx; }
    if (!visible.length) {
      idx.appendChild(stateWrap(stateBlock('empty', { onAction: onClear })));
      return idx;
    }
    for (const g of groupByMonth(visible)) {
      idx.appendChild(monthHeader(g));
      for (const a of g.items) idx.appendChild(indexRow(a, onOpen));
    }
    return idx;
  }

  const bandSlot = el('div');
  bandSlot.appendChild(flag === 'loading' ? nextBandSkeleton() : nextBand(band, onOpen));

  const listSlot = el('div');
  const footSlot = el('div');
  paint();

  return el('div.page.cu-page', { data: { layout: 'curated' } },
    indexHead(D),
    el('section.cu-tools', tabsSlot, el('div.cu-tools__search', search)),
    bandSlot,
    listSlot,
    footSlot
  );
}
