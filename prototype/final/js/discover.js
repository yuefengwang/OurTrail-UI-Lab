// 发现页 — 先回答“下一场是什么”，再给可比较的索引
import { el, icon, cover, statusChip, segmented } from './ui.js';
import {
  NOW, FEATURED, ACTIVITIES, isPast, isOpen, remaining, statusOf, hhmm, md, scenario
} from './data.js';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '可报名' },
  { key: 'formed', label: '已成行' },
  { key: 'ended', label: '已结束' }
];

const byDate = (a, b) => new Date(a.startAt) - new Date(b.startAt);
const dateParts = (a) => {
  const d = new Date(a.startAt);
  return { day: String(d.getDate()), week: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()] };
};
const monthOf = (a) => new Date(a.startAt).getMonth() + 1;

function deadlineText(a) {
  const d = new Date(a.deadlineAt);
  const diff = d - NOW;
  if (diff <= 0) return '报名已截止';
  const sameDay = d.getDate() === NOW.getDate();
  if (sameDay) return `今晚 ${hhmm(d)} 截止`;
  if (diff < 48 * 36e5) return `${md(d)} ${hhmm(d)} 截止`;
  return `${md(d)} ${hhmm(d)} 截止`;
}

function seatsText(a) {
  if (a.statusKey === 'formed') return '满员';
  if (!isOpen(a)) return '—';
  const left = remaining(a);
  return left > 0 ? `余位 ${left}` : '满员';
}

function seatFraction(a) {
  const left = remaining(a);
  return `${left} / ${a.capacity}`;
}

function matchFilter(a, key) {
  if (key === 'open') return isOpen(a);
  if (key === 'formed') return a.statusKey === 'formed';
  if (key === 'ended') return isPast(a);
  return true;
}
function matchQuery(a, q) {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return true;
  return [a.title, a.routeName, a.city, a.leader, a.difficulty].join(' ').toLowerCase().includes(s);
}
const countFor = (list, key) => list.filter((a) => matchFilter(a, key)).length;

function syncQuery(filter, q) {
  const p = new URLSearchParams(location.search);
  p.set('page', 'discover');
  if (filter !== 'all') p.set('filter', filter); else p.delete('filter');
  if (q) p.set('q', q); else p.delete('q');
  history.replaceState(null, '', '?' + p.toString());
}

/* ---------------- top ---------------- */
function topBar() {
  return el('header.disc-top',
    el('div.disc-top__id',
      el('div.disc-top__kicker',
        icon('pin', { size: 12 }),
        el('span', { text: '成都周边' })),
      el('h1.disc-top__title', { text: '发现' })),
    el('div.disc-top__actions',
      el('span.disc-top__date.num', { text: '10/23 周五' }),
      el('span.disc-top__avatar', { role: 'img', 'aria-label': '当前账号头像' }, '林')));
}

/* ---------------- hero ---------------- */
function hero(a, ctx) {
  const st = statusOf(a);
  const open = () => ctx.ui.go('detail', { activityId: a.id });
  const seatNow = remaining(a);
  return el('article.disc-hero', { data: { activityId: a.id } },
    el('button.disc-hero__media', {
      type: 'button',
      'aria-label': `查看 ${a.title} 的安排`,
      onClick: open
    },
      cover(a, { ratio: '16 / 9', alt: `${a.title} 氛围图`, eager: true }),
      el('span.disc-hero__scrim'),
      el('span.disc-hero__tag', { text: '最近出发' }),
      el('span.disc-hero__when',
        el('span', { text: '明天 07:00 集合' }),
        el('span.disc-hero__when-dot', { text: '·' }),
        el('span', { text: '茶店子' })),
      el('span.disc-hero__count',
        el('span', { text: '距集合' }),
        el('span.num', { text: ' 10 ' }),
        el('span', { text: '小时' })),
      el('span.disc-hero__gradient', { 'aria-hidden': 'true' })),
    el('div.disc-hero__body',
      el('div.disc-hero__statusline',
        statusChip({ __status: st }),
        el('span.disc-hero__dot', { text: '·' }),
        el('span.disc-hero__seats',
          el('span', { text: '余位' }),
          el('span.num', { text: ` ${seatNow} / ${a.capacity}` })),
        el('span.disc-hero__dot', { text: '·' }),
        el('span.disc-hero__deadline', { text: deadlineText(a) })),
      el('h2.disc-hero__title',
        el('button.disc-hero__title-btn', { type: 'button', onClick: open, text: a.title })),
      el('p.disc-hero__route', { text: `${a.routeName} · ${a.city}` }),
      el('div.disc-hero__grid',
        factCell('距离', a.distanceKm, 'km'),
        factCell('爬升', Number(a.ascentM).toLocaleString('zh-CN'), 'm'),
        factCell('难度', a.difficulty),
        factCell('人均', a.fee.replace(/\s*\/\s*人$/, ''))),
      el('p.disc-hero__meta',
        el('span', { text: `领队 ${a.leader}` }),
        el('span.disc-hero__dot', { text: '·' }),
        el('span', { text: `${a.confirmed} 人已确认` }),
        el('span.disc-hero__dot', { text: '·' }),
        el('span', { text: `${a.pending} 人待审核` }),
        el('span.disc-hero__dot', { text: '·' }),
        el('span.disc-hero__weather', { text: '活动日午后有阵雨' })),
      el('button.btn.btn--primary.disc-hero__cta', { type: 'button', onClick: open },
        el('span', { text: '查看安排' }), icon('arrow-right', { size: 17 }))));
}

function factCell(label, value, unit = '') {
  return el('div.disc-fact',
    el('span.disc-fact__k', { text: label }),
    el('span.disc-fact__v',
      el('span.num', { text: String(value) }),
      unit ? el('span.disc-fact__u', { text: unit }) : null));
}

/* ---------------- filter ---------------- */
function filterBar(state, onChange, onSearch, list) {
  const searchOpen = { value: false };
  const searchWrap = el('div.disc-search');
  const input = el('input.disc-search__input', {
    type: 'search',
    placeholder: '搜索活动、路线或城市',
    'aria-label': '搜索活动、路线或城市',
    value: state.q,
    onInput: (e) => onSearch(e.target.value)
  });
  const close = el('button.disc-search__close', {
    type: 'button', 'aria-label': '收起搜索',
    onClick: () => {
      searchOpen.value = false;
      searchWrap.classList.remove('is-open');
      input.value = '';
      onSearch('');
    }
  }, icon('x', { size: 16 }));
  searchWrap.append(el('span.disc-search__icon', icon('search', { size: 16 })), input, close);

  const searchBtn = el('button.disc-filter__search', {
    type: 'button', 'aria-label': '搜索',
    onClick: () => {
      searchOpen.value = !searchOpen.value;
      searchWrap.classList.toggle('is-open', searchOpen.value);
      if (searchOpen.value) setTimeout(() => input.focus(), 30);
    }
  }, icon('search', { size: 18 }));

  const counts = {
    all: list.length,
    open: countFor(list, 'open'),
    formed: countFor(list, 'formed'),
    ended: countFor(list, 'ended')
  };
  const seg = segmented(
    FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] })),
    state.filter,
    onChange,
    { ariaLabel: '活动筛选' }
  );
  seg.classList.add('disc-filter__seg');
  if (state.q) searchWrap.classList.add('is-open');

  return el('div.disc-filter',
    el('div.disc-filter__row',
      searchBtn,
      seg),
    searchWrap);
}

/* ---------------- rows ---------------- */
function titleParts(title) {
  const m = /（([^）]+)）\s*$/.exec(title);
  return m ? { main: title.slice(0, m.index), tag: m[1] } : { main: title, tag: '' };
}

function row(a, ctx, { past = false, featured = false } = {}) {
  const st = statusOf(a);
  const { day, week } = dateParts(a);
  const { main: rowTitle, tag: durationTag } = titleParts(a.title);
  const open = () => ctx.ui.go('detail', { activityId: a.id });
  return el('button.disc-row' + (past ? '.is-past' : ''), {
    type: 'button',
    'aria-label': `${a.title}，${md(a.startAt)} ${week}，${st.word}，${seatsText(a)}，查看安排`,
    onClick: open
  },
    el('span.disc-row__date',
      el('span.disc-row__d.num', { text: day }),
      el('span.disc-row__w', { text: week })),
    el('span.disc-row__thumb', cover(a, { ratio: '4 / 3', alt: '' })),
    el('span.disc-row__main',
      el('span.disc-row__titleline',
        featured ? el('span.tag.tag--brand', { text: '主推' }) : null,
        el('span.disc-row__title', { text: rowTitle }),
        durationTag ? el('span.tag', { text: durationTag }) : null),
      el('span.disc-row__route', { text: `${a.routeName} · ${a.city}` }),
      el('span.disc-row__facts',
        el('span.num', { text: `${a.distanceKm} km` }),
        el('span.disc-row__sep', { text: '·' }),
        el('span.num', { text: `${Number(a.ascentM).toLocaleString('zh-CN')} m` }),
        el('span.disc-row__sep', { text: '·' }),
        el('span', { text: a.difficulty }),
        el('span.disc-row__sep', { text: '·' }),
        el('span', { text: a.fee.replace(/\s*\/\s*人$/, '') }))),
    el('span.disc-row__side',
      statusChip({ __status: st }, { compact: true }),
      el('span.disc-row__seats' + (isOpen(a) && remaining(a) <= 3 ? '.is-clay' : ''),
        { text: seatsText(a) })),
    el('span.disc-row__go', icon('chevron-right', { size: 15 })));
}

function monthLabel(month) {
  return el('div.disc-month', el('span', { text: `${month} 月` }));
}

function groupByMonth(list) {
  const groups = [];
  for (const a of list) {
    const m = monthOf(a);
    let g = groups.find((x) => x.month === m);
    if (!g) { g = { month: m, items: [] }; groups.push(g); }
    g.items.push(a);
  }
  return groups;
}

function listMode(list, ctx, { includePast = false } = {}) {
  const wrap = el('div.disc-list');
  const past = list.filter(isPast).sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
  const future = list.filter((a) => !isPast(a)).sort(byDate);
  const groups = groupByMonth(future);
  for (const g of groups) {
    wrap.appendChild(monthLabel(g.month));
    for (const a of g.items) wrap.appendChild(row(a, ctx, { featured: a.id === FEATURED.id }));
  }
  if (includePast && past.length) {
    if (future.length) wrap.appendChild(el('div.disc-past-head', { text: '已结束与已取消' }));
    for (const a of past) wrap.appendChild(row(a, ctx, { past: true }));
  }
  return wrap;
}

function pastFold(past, ctx) {
  if (!past.length) return null;
  const box = el('details.disc-past');
  box.appendChild(el('summary.disc-past__summary',
    el('span.disc-past__k', { text: '已结束与已取消' }),
    el('span.disc-past__n.num', { text: `${past.length} 场` }),
    el('span.disc-past__chev', icon('chevron-down', { size: 15 }))));
  const body = el('div.disc-past__body');
  for (const a of past.sort((x, y) => new Date(y.startAt) - new Date(x.startAt))) {
    body.appendChild(row(a, ctx, { past: true }));
  }
  box.appendChild(body);
  box.addEventListener('toggle', () => box.classList.toggle('is-open', box.open));
  return box;
}

/* ---------------- render ---------------- */
export function render(ctx) {
  const { state, ui } = ctx;
  const data = state.data;

  const local = {
    filter: state.filter || 'all',
    q: state.q || ''
  };

  const page = el('div.page.disc-page');

  if (data === 'loading') {
    page.append(topBar(), loadingShell());
    return page;
  }
  if (data === 'error') {
    page.append(topBar(), el('div.disc-error',
      el('div.empty',
        el('span.empty__icon', icon('alert', { size: 26 })),
        el('h2.empty__title', { text: '活动加载失败' }),
        el('p.empty__body', { text: '网络或服务暂时不可用。已保留筛选与搜索入口，不会展示过期或伪造的数据。' }),
        el('button.btn.btn--secondary', { type: 'button', onClick: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端') }, '重新加载'))));
    return page;
  }
  if (data === 'empty') {
    page.append(topBar(), el('div.disc-error',
      el('div.empty',
        el('span.empty__icon', icon('calendar', { size: 26 })),
        el('h2.empty__title', { text: '还没有已发布的活动' }),
        el('p.empty__body', { text: '这里会显示未来可报名、已成行和已结束的活动。现在还没有可展示的索引。' }))));
    return page;
  }

  const sc = scenario('published', ctx.store);
  const activities = ACTIVITIES.map((a) => a.id === FEATURED.id
    ? { ...a, confirmed: sc.confirmed, pending: sc.pending, waitlisted: sc.waitlisted }
    : a);
  const featured = activities.find((a) => a.id === FEATURED.id) || FEATURED;
  const heroNode = hero(featured, ctx);
  const filterSlot = el('div.disc-filter-slot');
  const indexSlot = el('div.disc-index-slot');

  const active = () => local.filter !== 'all' || !!local.q.trim();
  const filtered = () => activities
    .filter((a) => matchFilter(a, local.filter) && matchQuery(a, local.q))
    .sort(byDate);

  function paint() {
    const items = filtered();
    filterSlot.replaceChildren(filterBar(local, (key) => {
      local.filter = key;
      state.filter = key;
      syncQuery(local.filter, local.q);
      paint();
    }, (q) => {
      local.q = q;
      state.q = q;
      syncQuery(local.filter, local.q);
      paint();
    }, activities));

    indexSlot.replaceChildren();
    if (active()) {
      indexSlot.appendChild(el('div.disc-result-head',
        el('h2.disc-result-head__title', { text: local.q.trim() ? '搜索结果' : (FILTERS.find((f) => f.key === local.filter)?.label || '全部') }),
        el('span.disc-result-head__count.num', { text: `${items.length} 场` })));
      if (!items.length) {
        indexSlot.appendChild(el('div.empty',
          el('span.empty__icon', icon('search', { size: 26 })),
          el('h2.empty__title', { text: '没有匹配的活动' }),
          el('p.empty__body', { text: '试试清除筛选，或换一个关键词。搜索会覆盖活动名、路线、城市和领队。' }),
          el('button.btn.btn--secondary', {
            type: 'button',
            onClick: () => {
              local.filter = 'all';
              local.q = '';
              state.filter = 'all';
              state.q = '';
              syncQuery('all', '');
              paint();
            }
          }, '清除筛选')));
      } else {
        indexSlot.appendChild(listMode(items, ctx, { includePast: true }));
      }
    } else {
      const upcoming = activities.filter((a) => !isPast(a) && a.id !== FEATURED.id).sort(byDate);
      indexSlot.appendChild(el('div.disc-index-head',
        el('h2.disc-index-head__title', { text: '接下来' }),
        el('span.disc-index-head__count.num', { text: `${upcoming.length} 场` })));
      indexSlot.appendChild(listMode(upcoming, ctx, { includePast: false }));
      const past = pastFold(activities.filter(isPast), ctx);
      if (past) indexSlot.appendChild(past);
    }
  }

  paint();

  page.append(
    topBar(),
    heroNode,
    filterSlot,
    indexSlot,
    el('footer.disc-foot',
      el('span', { text: '演示数据 · 照片：Unsplash / AI 生成氛围图（非活动实拍）' }),
      el('span', { text: '名额与时间会随活动状态更新' }))
  );

  const bar = page.querySelector('.disc-filter');
  page.addEventListener('scroll', () => {
    const b = page.querySelector('.disc-filter');
    if (b) b.classList.toggle('is-pinned', page.scrollTop > 8);
  }, { passive: true });

  return page;
}

function loadingShell() {
  return el('div.disc-loading',
    el('div.photo.disc-hero__sk'),
    el('div.lines', { style: { padding: '16px 0' } },
      el('span.lines__line', { style: { width: '42%' } }),
      el('span.lines__line', { style: { width: '86%', height: '18px' } }),
      el('span.lines__line', { style: { width: '64%' } })),
    el('div.disc-filter__sk'),
    el('div.disc-loading__rows',
      Array.from({ length: 4 }, () => el('div.disc-row__sk',
        el('span.lines__line', { style: { width: '12%' } }),
        el('span.lines__line', { style: { width: '18%', height: '42px' } }),
        el('span.lines__line', { style: { width: '44%' } })))));
}
