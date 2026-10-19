// OurTrail Round 3 — 共享渲染辅助
// 所有版式/页面共用：数据派生、状态词、名额、日期、筛选、搜索、状态块、脚注。
// 不包含任何版式私有排版（那是各方案 CSS 的职责）。

import { el, icon, photo, fmt } from '../../js/render-common.js';

export { el, icon, photo, fmt };

/* ---------------- 图片 ---------------- */
export const PHOTO_BASE = '../assets/photos/';
export const img = (name) => PHOTO_BASE + name;
export const photoOf = (a, opts = {}) => photo(img(a.cover), { alt: a.title, ...opts });

/* ---------------- 状态词 ---------------- */
export const STATUS = {
  open: { word: '报名中', tone: 'success' },
  hot: { word: '名额紧张', tone: 'warning' },
  formed: { word: '已成行', tone: 'info' },
  ended: { word: '已结束', tone: 'neutral' },
  cancelled: { word: '已取消', tone: 'danger' },
};

export function statusWord(a, { bare = false } = {}) {
  const s = STATUS[a.statusKey] || STATUS.open;
  return el('span.status-word', {
    class: `status-word--${s.tone}${bare ? ' status-word--bare' : ''}`,
    text: s.word,
  });
}

/* ---------------- 名额 ---------------- */
export const remaining = (a) => Math.max(0, a.seatsTotal - a.signedCount);
export const isOpen = (a) => a.statusKey === 'open' || a.statusKey === 'hot';

export function seatsText(a) {
  if (isOpen(a)) {
    const r = remaining(a);
    return r > 0 ? `剩 ${r} 位` : '满员';
  }
  if (a.statusKey === 'formed') return '满员';
  return '';
}

export const seatsUrgent = (a) => isOpen(a) && remaining(a) <= 3;

export function seatsNode(a, { cls = '' } = {}) {
  const text = seatsText(a);
  if (!text) return null;
  return el('span.seats' + (cls ? '.' + cls : ''), {
    class: seatsUrgent(a) ? 'is-urgent' : '',
    text,
  });
}

/* ---------------- 日期 ---------------- */
export const pad = (n) => String(n).padStart(2, '0');

export function dateParts(a) {
  const m = /(\d{1,2})\s*月\s*(\d{1,2})/.exec(a.dateText || '');
  const month = m ? Number(m[1]) : null;
  const day = m ? Number(m[2]) : null;
  return {
    month,
    day,
    md: m ? `${pad(month)}/${pad(day)}` : '',
    week: a.weekdayText || '',
  };
}

export const monthLabel = (a) => {
  const { month } = dateParts(a);
  return month ? `${month} 月` : '时间待定';
};

export function groupByMonth(list) {
  const out = [];
  for (const a of list) {
    const { month } = dateParts(a);
    const key = month || 0;
    let g = out.find((x) => x.month === key);
    if (!g) {
      g = { month: key, label: month ? `${month} 月` : '时间待定', items: [] };
      out.push(g);
    }
    g.items.push(a);
  }
  return out;
}

export function timeShort(a) {
  const m = /(\d{1,2}:\d{2})/.exec(a.timeText || '');
  return m ? m[1] : '';
}

/* 演示时钟：10/17（周五）22:10。仅用于"明晚/距出发"等演示文案。 */
const DEMO_NOW = new Date(2025, 9, 17, 22, 10);

export function demoDeparture(a) {
  const dm = /(\d{1,2})\s*月\s*(\d{1,2})/.exec(a.dateText || '');
  const tm = /(\d{1,2}):(\d{2})/.exec(a.timeText || '');
  if (!dm || !tm) return null;
  const date = new Date(2025, Number(dm[1]) - 1, Number(dm[2]), Number(tm[1]), Number(tm[2]));
  const diffH = Math.round((date.getTime() - DEMO_NOW.getTime()) / 36e5);
  return { date, diffH, diffD: Math.round(diffH / 24), hhmm: `${tm[1]}:${tm[2]}` };
}

export function departureLabel(a) {
  const dep = demoDeparture(a);
  if (!dep || dep.diffH <= 0) return '';
  if (dep.diffH <= 36) {
    const day = dep.date.getDate();
    if (day === 17) return `今晚 ${dep.hhmm} 出发`;
    if (day === 18) return `明晚 ${dep.hhmm} 出发`;
  }
  return `距出发 ${dep.diffD} 天`;
}

export function nextDeparture(list) {
  return list.find((a) => isOpen(a) && demoDeparture(a) && demoDeparture(a).diffH > 0) || null;
}

/* ---------------- 筛选与搜索 ---------------- */
export const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '可报名' },
  { key: 'formed', label: '已成行' },
  { key: 'ended', label: '已结束' },
];

export function matchFilter(a, key) {
  if (key === 'open') return a.statusKey === 'open' || a.statusKey === 'hot';
  if (key === 'formed') return a.statusKey === 'formed';
  if (key === 'ended') return a.statusKey === 'ended' || a.statusKey === 'cancelled';
  return true;
}

export function matchQuery(a, q) {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return true;
  return [a.title, a.routeName, a.city, a.leader, a.difficultyText]
    .join(' ').toLowerCase().includes(s);
}

export function filterActivities(list, { filter = 'all', q = '' } = {}) {
  return list.filter((a) => matchFilter(a, filter) && matchQuery(a, q));
}

export function filterCounts(list) {
  return {
    all: list.length,
    open: list.filter((a) => matchFilter(a, 'open')).length,
    formed: list.filter((a) => matchFilter(a, 'formed')).length,
    ended: list.filter((a) => matchFilter(a, 'ended')).length,
  };
}

/* ---------------- 共享组件 ---------------- */
export function searchField({ value = '', placeholder = '搜索活动、路线或城市', onInput, variant = '' } = {}) {
  const input = el('input', { type: 'search', value, placeholder, 'aria-label': placeholder });
  input.addEventListener('input', () => { if (onInput) onInput(input.value); });
  const wrap = el('label.search' + (variant ? '.' + variant : ''), icon('search'), input);
  wrap.__input = input;
  return wrap;
}

export function filterTabs({ counts, active = 'all', onPick, showCount = true } = {}) {
  return el('div.seg', { role: 'tablist', 'aria-label': '活动筛选' },
    FILTERS.map((f) => {
      const btn = el('button.seg__item', {
        type: 'button',
        role: 'tab',
        'aria-selected': active === f.key ? 'true' : 'false',
        class: active === f.key ? 'is-active' : '',
        onClick: () => { if (onPick) onPick(f.key); },
      }, f.label);
      if (showCount) btn.appendChild(el('span.seg__count.num', { text: String(counts[f.key] ?? 0) }));
      return btn;
    })
  );
}

const STATE_COPY = {
  empty: {
    icon: 'search',
    title: '没有匹配的活动',
    body: '试试清除筛选，或换一个关键词。',
    action: '清除筛选',
  },
  error: {
    icon: 'alert',
    title: '活动加载失败',
    body: '网络或服务暂时不可用。演示错误态：保留重试入口，不清空已加载内容。',
    action: '重新加载',
  },
  disabled: {
    icon: 'shield',
    title: '当前不可操作',
    body: '演示禁用态：权限不足或活动已截止时，入口保留但不可用。',
    action: '',
  },
  loading: {
    icon: 'refresh',
    title: '正在加载',
    body: '演示加载态：保留页面结构与操作位置，避免布局跳动。',
    action: '',
  },
};

export function stateBlock(kind, { title, body, actionText, onAction, iconName } = {}) {
  const copy = STATE_COPY[kind] || STATE_COPY.empty;
  const wrap = el('div.state-block', { role: 'status' },
    icon(iconName || copy.icon),
    el('div.state-block__title', { text: title || copy.title }),
    el('div.state-block__body', { text: body || copy.body })
  );
  const label = actionText || copy.action;
  if (label) {
    wrap.appendChild(el('button.btn.btn--secondary.btn--sm.state-block__action', {
      type: 'button',
      onClick: onAction || (() => {}),
    }, label));
  }
  return wrap;
}

export function skeletonRows(n = 3, { thumb = true } = {}) {
  return el('div', Array.from({ length: n }, () =>
    el('div.sk-row',
      thumb ? el('div.skeleton.sk-row__thumb') : null,
      el('div.sk-row__body',
        el('div.skeleton.skeleton--line', { style: { width: '62%' } }),
        el('div.skeleton.skeleton--line', { style: { width: '88%', marginTop: '8px' } }),
        el('div.skeleton.skeleton--line', { style: { width: '40%', marginTop: '8px' } })
      )
    )
  ));
}

export function foot(D, note = 'Round 3 设计实验 · 同一演示数据 · 非真实后端') {
  return el('footer.foot',
    el('div.foot__credit', { text: D.credit }),
    el('div.foot__note', { text: note })
  );
}

export function metaLine(...parts) {
  const out = [];
  parts.filter(Boolean).forEach((p, i) => {
    if (i) out.push(el('span.dot-sep', { text: '·' }));
    out.push(typeof p === 'string' ? el('span', { text: p }) : p);
  });
  return el('div.meta-line', out);
}

export function baseFacts(a, { showDifficulty = true } = {}) {
  const items = [
    el('span.fact', icon('route', { size: 13 }),
      el('span.fact__value.num', { text: String(a.distanceKm) }),
      el('span.fact__unit', { text: 'km' })),
    el('span.fact', icon('mountain', { size: 13 }),
      el('span.fact__value.num', { text: String(a.ascentM) }),
      el('span.fact__unit', { text: 'm 爬升' })),
  ];
  if (showDifficulty) {
    items.push(el('span.fact',
      el('span.fact__label', { text: '难度' }),
      el('span.fact__value', { text: a.difficultyText })));
  }
  return items;
}

export function summaryLine(D) {
  return `成都周边 · ${D.activities.length} 场 · 按出发时间排序`;
}
