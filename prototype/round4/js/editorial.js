// 方案一 · Editorial Feature（编辑特写）「本期」
// 页面 = 一期周刊：刊头 → 工具行 → 封面故事(a1) → 编辑推荐(a2/a4) → 出发日历(其余，按月分组)
// 页签与搜索作用于全页：离开「全部」或输入关键词 → 列表模式（隐藏封面与推荐，只留日历行）。
// 排版纪律：衬线只给叙述主体（封面标题 / 编辑推荐标题 / 日历大日数字）；事实与元信息一律无衬线。
import {
  el, icon, foot, fmt,
  searchField, filterTabs, filterCounts, filterActivities, FILTERS,
  groupByMonth, dateParts, departureLabel, demoDeparture,
  statusWord, seatsNode, timeShort, photoOf,
  stateBlock, skeletonRows,
} from './shared.js';

/* 本期固定编排：封面故事与两条编辑推荐是「编辑位」，其余按月进入出发日历。 */
const ISSUE_KICKER = '发现 · 第 04 期';
const ISSUE_DATE = '10 月 17 日';   // 演示时钟 10/17
const FEATURED_ID = 'a1';
const PICK_IDS = ['a2', 'a4'];

const frag = (...kids) => {
  const f = document.createDocumentFragment();
  for (const k of kids) if (k) f.appendChild(k);
  return f;
};

/* 演示历按真实日期升序；缺月/日的条目排到末尾。 */
const sortKey = (a) => {
  const { month, day } = dateParts(a);
  return month && day ? new Date(2025, month - 1, day).getTime() : Number.MAX_SAFE_INTEGER;
};
const byDate = (a, b) => sortKey(a) - sortKey(b);

/* 「明晚 22:10 出发」→「明晚 出发」：日历日期栏只有 60px，紧凑写法不丢事实。
   文字全部来自 shared.departureLabel（演示时钟推导），此处只做排版裁剪。 */
function whenNote(a) {
  const label = departureLabel(a);
  if (!label) return null;
  const dep = demoDeparture(a);
  return {
    text: label.replace(/\d{1,2}:\d{2}/, '').replace(/\s+/g, ' ').trim(),
    urgent: !!dep && dep.diffH > 0 && dep.diffH <= 36,
  };
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
const distFact = (a) => el('span.fact',
  el('span.fact__value.num', { text: String(a.distanceKm) }),
  el('span.fact__unit', { text: 'km' }));
const ascentFact = (a) => el('span.fact',
  icon('mountain', { size: 12 }),
  el('span.fact__value.num', { text: fmt(a.ascentM) }),
  el('span.fact__unit', { text: 'm 爬升' }));
const leaderFact = (a) => el('span.fact',
  el('span.fact__label', { text: '领队' }),
  el('span.fact__value', { text: a.leader }));
const timeFact = (a) => (timeShort(a)
  ? el('span.fact',
      el('span.fact__label', { text: '出发' }),
      el('span.fact__value.num', { text: timeShort(a) }))
  : null);
const quotaFact = (a) => el('span.fact',
  el('span.fact__label', { text: '名额' }),
  el('span.fact__value.num', { text: String(a.seatsTotal) }));

/* ---------------- 1. 刊头 ---------------- */
function masthead(D) {
  return el('header.ed-mast',
    el('div.ed-mast__issue',
      el('span.ed-mast__kicker.t-kicker', { text: ISSUE_KICKER }),
      el('span.ed-mast__date.num', { text: ISSUE_DATE })),
    el('h1.ed-mast__title.t-display.serif', { text: '发现' }),
    el('p.ed-mast__lede', { text: `成都周边 · ${D.activities.length} 场 · 按出发时间排序` })
  );
}

/* ---------------- 2. 工具行 ---------------- */
function buildTabs(D, state, onPick) {
  const tabs = filterTabs({
    counts: filterCounts(D.activities),
    active: state.filter,
    onPick,
  });
  tabs.classList.add('ed-tabs');
  tabs.setAttribute('data-testid', 'r3-tabs');
  return tabs;
}

/* ---------------- 3. 封面故事（a1） ---------------- */
function coverStory(a, onOpen) {
  const when = departureLabel(a);
  return el('article.ed-cover', {
    data: { activityId: a.id },
    'data-testid': 'r3-cover-story',
    ...tapAttrs(a, onOpen),
  },
    el('div.ed-cover__media.bleed',
      photoOf(a, { ratio: '16 / 10', alt: '' }),
      el('div.ed-cover__veil'),
      el('div.ed-cover__stamp',
        el('span', { text: when || a.timeText }),
        el('span.dot-sep', { text: '·' }),
        el('span.num', { text: `${a.dateText} ${a.weekdayText}` }))),
    el('div.ed-cover__body',
      el('div.ed-cover__kicker.t-kicker', { text: `本期头条 · ${a.city} · ${a.difficultyText}` }),
      el('h2.ed-cover__title', { text: a.title }),
      el('p.ed-cover__route', { text: a.routeName }),
      el('p.ed-cover__lede.clamp-2', { text: a.lede }),
      el('div.ed-cover__facts.facts', distFact(a), ascentFact(a), quotaFact(a), seatsNode(a)),
      el('div.ed-cover__actions',
        el('span.ed-cover__link', { text: '查看安排' }, icon('arrow-right')),
        statusWord(a)))
  );
}

/* ---------------- 4. 编辑推荐（2 条，横向 4:3） ----------------
   日期 / 城市 / 难度挂在图下的图注（编辑部惯例），正文列只留标题 + 编辑按 + 事实微行：
   标题长短不一也不会把正文列撑出三种高度。 */
function pickEntry(a, onOpen) {
  return el('article.ed-pick', {
    data: { activityId: a.id },
    ...tapAttrs(a, onOpen),
  },
    el('div.ed-pick__media',
      photoOf(a, { ratio: '4 / 3', alt: '' }),
      el('div.ed-pick__caption',
        el('div.ed-pick__date.num', { text: `${a.dateText} ${a.weekdayText}` }),
        el('div.ed-pick__where', { text: `${a.city} · ${a.difficultyText}` }))),
    el('div.ed-pick__body',
      el('h3.ed-pick__title', { text: a.title }),
      el('p.ed-pick__note', { text: a.lede }),
      el('div.ed-pick__facts.facts', distFact(a), ascentFact(a), leaderFact(a), seatsNode(a), statusWord(a)))
  );
}

function picksSection(items, onOpen) {
  return el('section.ed-sec',
    el('div.ed-sect',
      el('h2.ed-sect__k', { text: '编辑推荐' }),
      el('div.ed-sect__n.num', { text: `${items.length} 条` })),
    el('div.ed-picks', items.map((a) => pickEntry(a, onOpen)))
  );
}

/* ---------------- 5. 出发日历（纯文字行，按月分组） ---------------- */
function monthHeader(g) {
  const mds = g.items.map((a) => dateParts(a).md).filter(Boolean).sort();
  const range = mds.length > 1 ? `${mds[0]}–${mds[mds.length - 1]}` : mds[0] || '';
  return el('div.ed-month',
    el('div.ed-month__k', { text: `${g.label} · ${g.items.length} 场` }),
    el('div.ed-month__n.num', { text: range }));
}

function calRow(a, onOpen) {
  const { day, week } = dateParts(a);
  const when = whenNote(a);
  return el('div.ed-row', {
    data: { activityId: a.id },
    ...tapAttrs(a, onOpen),
  },
    el('div.ed-row__day',
      el('div.ed-row__d.num', { text: day ? String(day) : '—' }),
      el('div.ed-row__w', { text: week }),
      when ? el('div.ed-row__now' + (when.urgent ? '.is-now' : ''), { text: when.text }) : null),
    el('div.ed-row__main',
      el('div.ed-row__title', { text: a.title }),
      el('div.ed-row__route', { text: `${a.routeName} · ${a.difficultyText}` }),
      el('div.ed-row__facts.facts', distFact(a), ascentFact(a), leaderFact(a), timeFact(a))),
    el('div.ed-row__side', statusWord(a), seatsNode(a))
  );
}

function modeBar(where, onClear) {
  return el('div.ed-cal__bar',
    el('div.ed-cal__mode', { text: where }),
    el('button.ed-cal__clear', { type: 'button', onClick: onClear }, '清除筛选'));
}

function calendarBox(items, opts, onOpen) {
  const box = el(opts.listMode ? 'div.ed-cal' : 'section.ed-sec.ed-sec--cal', {
    'data-testid': 'r3-list',
  });
  if (opts.listMode) {
    box.appendChild(modeBar(opts.where, opts.onClear));
  } else {
    box.appendChild(el('div.ed-sect',
      el('h2.ed-sect__k', { text: '出发日历' }),
      el('div.ed-sect__n.num', { text: `${items.length} 场 · 按出发时间` })));
  }
  if (!items.length) {
    box.appendChild(stateWrap(stateBlock('empty', { onAction: opts.onClear })));
    return box;
  }
  for (const g of groupByMonth(items.slice().sort(byDate))) {
    box.appendChild(monthHeader(g));
    for (const a of g.items) box.appendChild(calRow(a, onOpen));
  }
  return box;
}

/* ---------------- 状态区（空 / 错 / 禁 / 加载） ---------------- */
function stateWrap(node) {
  return el('div.ed-state', { 'data-testid': 'r3-state' }, node);
}

function loadingBlock() {
  return el('div.ed-load',
    el('div.ed-load__cover.bleed', el('div.skeleton')),
    el('div.ed-load__body',
      el('div.ed-load__lines',
        el('div.skeleton.skeleton--line', { style: { width: '38%' } }),
        el('div.skeleton.skeleton--line', { style: { width: '92%', marginTop: '10px' } }),
        el('div.skeleton.skeleton--line', { style: { width: '64%', marginTop: '10px' } }),
        el('div.skeleton.skeleton--line', { style: { width: '82%', marginTop: '10px' } })),
      skeletonRows(4, { thumb: false })));
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const flag = ctx.flag || '';
  const ui = ctx.ui || {};
  const state = { filter: 'all', q: '' };

  const featured = D.activities.find((a) => a.id === FEATURED_ID) || D.activities[0];
  const picks = PICK_IDS.map((id) => D.activities.find((a) => a.id === id)).filter(Boolean);

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
  const paint = () => { content.replaceChildren(build()); };

  const search = searchField({
    value: state.q,
    placeholder: '搜索活动、路线或城市',
    variant: 'search--line',
    onInput: (v) => { state.q = v; paint(); },
  });
  search.setAttribute('data-testid', 'r3-search');
  const searchInput = search.__input;

  const tabsSlot = el('div.ed-tabs-slot');
  function rebuildTabs() {
    tabsSlot.replaceChildren(buildTabs(D, state, (key) => {
      state.filter = key;
      rebuildTabs();
      paint();
    }));
  }
  rebuildTabs();

  const content = el('div.ed-content');

  function build() {
    if (flag === 'loading') return loadingBlock();
    const list = filterActivities(D.activities, state);
    /* ?state=empty 等价于「筛选已生效但没有命中」：直接进入列表模式且结果为空 */
    const listMode = flag === 'empty' || state.filter !== 'all' || state.q.trim() !== '';
    const items = flag === 'empty' ? [] : (listMode
      ? list
      : list.filter((a) => a.id !== FEATURED_ID && PICK_IDS.indexOf(a.id) < 0));

    let head = null;
    if (flag === 'error') {
      head = stateWrap(stateBlock('error', {
        onAction: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端'),
      }));
    } else if (flag === 'disabled') {
      head = stateWrap(stateBlock('disabled'));
    } else if (!listMode) {
      head = frag(coverStory(featured, onOpen), picksSection(picks, onOpen));
    }

    const filterLabel = (FILTERS.find((f) => f.key === state.filter) || {}).label;
    const where = [
      '按出发时间',
      `${items.length} 场`,
      state.filter !== 'all' && `筛选：${filterLabel}`,
      state.q.trim() && `搜索「${state.q.trim()}」`,
    ].filter(Boolean).join(' · ');

    return frag(head, calendarBox(items, { listMode, where, onClear }, onOpen));
  }

  paint();

  return el('div.page.ed-page', { data: { layout: 'editorial' } },
    masthead(D),
    el('div.ed-tools', search, tabsSlot),
    content,
    foot(D)
  );
}