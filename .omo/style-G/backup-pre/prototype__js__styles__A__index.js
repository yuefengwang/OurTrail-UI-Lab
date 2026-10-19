// Style A — Alpine Editorial（山野编辑部）
// 摄影是第一主角 · 排版建立层级 · 零卡片化内容面 · 指标是句子的一部分 · 操作低声但清楚 · 诚实
//
// DOM 组织按「刊物」而非「App」来搭：
//   发现 = 刊头 → 头条整版封面 → 专题条目 → 紧凑图文行 → 脚注
//   详情 = 整版特稿头图 → 导语（首字下沉）→ 事实条 → 编号叙事 → 清单 → 同行人 → 报尾操作
//   协作 = 状态句 + 计数行 + 事实带 + 文字游标分栏 → 名单/分车/现场 → 编者按 callout
//   天气 = 简报结论 → 站位事实 → 轻量曲线 + 逐时读数 → 数据行 → 窗口表 → 决策
// 与 B（表格/网格）、C（色调带分块）结构上完全不同。
//
// 只复用共享原语：el / icon / photo / fmt / frag；事件一律 el(..., {onclick})，无内联 on*。
// 数据只读 prototype/js/data.js；不删任何字段。

import { el, icon, photo, fmt, frag } from '../../render-common.js';

const NOTE = '同一演示数据 · 六风格对照实验';
const ASSETS = 'assets/photos/';

/* 状态词 → 语义色（A 的做法：文字 + 小点，不做彩底标签） */
const STATUS_KIND = { open: 'success', hot: 'warning', formed: 'info', ended: 'neutral', cancelled: 'danger' };
const AUDIT_KIND = { 已通过: 'success', 待审核: 'warning', 候补: 'neutral' };

/* =========================================================
   0. 通用小组件
   ========================================================= */

/** 脚注：每页最后一个节点。来源与实验标识分两级，不做成同权重的一坨灰 */
function foot(D) {
  return el('div.footnote',
    el('div.a-foot__credit', { text: D.credit }),
    el('div.a-foot__note', { text: NOTE })
  );
}

/** 眉题：本风格的签名元素，高频使用 */
const kick = (t, cls) => el('div.a-kicker' + (cls ? '.' + cls : ''), { text: t });

/** 从 dateText 取 MM/DD（原始日期同时保留在眉题里） */
function md(dateText) {
  const m = /(\d+)\s*月\s*(\d+)/.exec(dateText || '');
  return m ? String(m[1]).padStart(2, '0') + '/' + String(m[2]).padStart(2, '0') : '—';
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 取「日期 + 星期」印记；add 为 1 时取次日（跨零点的行程分组靠它） */
function stamp(dateText, add) {
  const m = /(\d+)\s*月\s*(\d+)/.exec(dateText || '');
  if (!m) return { md: '—', w: '' };
  const d = new Date(2025, Number(m[1]) - 1, Number(m[2]) + (add || 0));
  return {
    md: String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0'),
    w: WEEK[d.getDay()],
  };
}

/** 取 HH:MM（截止时间等「日期 + 时刻」字段里的时刻部分） */
function hhmm(dateText) {
  const m = /(\d{1,2}):(\d{2})/.exec(String(dateText || ''));
  return m ? m[1].padStart(2, '0') + ':' + m[2] : '';
}

/** 月份序号：分组与排序的第一键 */
const monthOf = (dateText) => {
  const m = /(\d+)\s*月/.exec(dateText || '');
  return m ? Number(m[1]) : 0;
};

/** 月内日序：排序的第二键 */
const dayOf = (dateText) => {
  const m = /月\s*(\d+)/.exec(dateText || '');
  return m ? Number(m[1]) : 0;
};

const orderOf = (a) => monthOf(a.dateText) * 100 + dayOf(a.dateText);

/** 是否仍可报名（与筛选口径一致） */
const isOpen = (a) => a.statusKey === 'open' || a.statusKey === 'hot';

/** 状态词 */
const word = (t, kind) => el('span.badge.badge--' + (kind || 'neutral'), { text: t });

/** 行内事实：用 · 连接；数字 tabular */
function facts(items) {
  const box = el('div.a-facts-inline');
  items.forEach((it, i) => {
    if (i) box.appendChild(el('span.a-facts-inline__sep', { text: '·' }));
    box.appendChild(el('span.a-facts-inline__item' + (it.hi ? '.is-hi' : ''), { text: it.t }));
  });
  return box;
}

/** 事实格：标签 + 大号数字 + 小一号单位（单位退到基线右侧，数字自成列） */
function factCell(k, v, u, cls) {
  return el('div.a-factstrip__cell',
    el('div.a-factstrip__k', { text: k }),
    el('div.a-factstrip__v.num' + (cls ? '.' + cls : ''),
      el('span', { text: v }),
      u ? el('span.a-factstrip__u', { text: u }) : null));
}

/** 行式事实格（天气页：标签左 / 数值右） */
function rowFact(k, v, u) {
  return el('div.a-factstrip__cell',
    el('div.a-factstrip__k', { text: k }),
    el('div.a-factstrip__v.num',
      el('span', { text: v }),
      u ? el('span.a-factstrip__u', { text: u }) : null));
}

/** 文本链（次要操作：低声但清楚） */
function link(label, fn, iconName) {
  return el('button.a-link', { type: 'button', onclick: fn },
    el('span', { text: label }),
    icon(iconName || 'arrow-right'));
}

/** 分区头：眉题 + 发丝线 + 右侧计数 */
function sect(label, right) {
  return el('div.a-sect',
    kick(label),
    right ? el('div.a-sect__n', { text: right }) : null);
}

/** 月份眉标：列表的时间轴（比普通分区重一档） */
function monthMark(month, items) {
  const days = items.map((a) => md(a.dateText));
  const span = days.length > 1 && days[0] !== days[days.length - 1]
    ? days[0] + '–' + days[days.length - 1]
    : days[0];
  return el('div.a-month',
    el('div.a-month__k', { text: month + ' 月' }),
    el('div.a-month__n', { text: fmt(items.length) + ' 项 · ' + span }));
}

/** 照片（A：直角 2px，必带来源脚注）；解码完成后再淡入 */
function cover(file, alt, cls) {
  const node = photo(ASSETS + file, { alt, credit: 'Unsplash', cls: cls || '' });
  const img = node.querySelector('img');
  if (img) {
    const reveal = () => node.classList.add('is-in');
    if (img.complete && img.naturalWidth) reveal();
    else {
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
      setTimeout(reveal, 1200);
    }
  }
  return node;
}

/** 点击可达性：鼠标 + 键盘；条目内的独立按钮（文字链）不重复触发整条跳转 */
function tap(node, fn) {
  node.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('button')) return;
    fn(e);
  });
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
  });
  return node;
}

/** 状态块（空 / 错误 / 数据缺失） */
function stateBlock(iconName, title, body, label, fn) {
  return el('div.state-block',
    icon(iconName),
    el('div.state-block__title.a-serif', { text: title }),
    el('div.state-block__body', { text: body }),
    label ? link(label, fn) : null);
}

/** 事实行（标签 + 值），用于集合/费用/数据行 */
function line(k, v, note) {
  return el('div.a-line',
    el('div.a-line__k', { text: k }),
    el('div.a-line__v', { text: v }),
    note ? el('div.a-line__n', { text: note }) : null);
}

/** 骨架块（高度全部走类名，高度值在 CSS 里由令牌给出） */
const skel = (h, w) => el('div.skeleton.a-skel-' + h, w ? { style: { width: w } } : null);

/** 缺名额：已报名 / 名额 - 已报名 */
const leftOf = (a) => Math.max(0, a.seatsTotal - a.signedCount);

/* =========================================================
   1. 发现 — 刊物流
   ========================================================= */

const FILTERS = [
  { key: 'all', label: '全部', test: () => true },
  { key: 'open', label: '可报名', test: isOpen },
  { key: 'formed', label: '已成行', test: (a) => a.statusKey === 'formed' },
  { key: 'ended', label: '已结束', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
];

/** 头条：整版封面 + 提要 + 事实行 + 文字链 */
function featureEntry(a, onOpen) {
  const node = el('article.a-feature', { role: 'button', tabindex: '0' },
    el('div.a-bleed',
      el('div.a-feature__media',
        cover(a.cover, a.title + ' 氛围封面'),
        el('div.a-feature__stamp',
          el('span.a-feature__stamp-d', { text: a.dateText }),
          el('span.a-feature__stamp-w', { text: a.weekdayText })))),
    el('div.a-feature__body',
      kick('本期头条 · ' + a.city + ' · ' + a.difficultyText),
      el('h2.a-feature__title.a-serif', { text: a.title }),
      el('div.a-feature__route', { text: a.routeName }),
      el('p.a-quote', { text: a.lede }),
      facts([
        { t: a.distanceKm + ' km' }, { t: '↑ ' + fmt(a.ascentM) + ' m' },
        { t: '名额 ' + a.seatsTotal }, { t: '剩 ' + leftOf(a), hi: leftOf(a) <= 3 },
      ]),
      el('div.a-feature__foot',
        link('查看安排', onOpen),
        word(a.status, STATUS_KIND[a.statusKey]))));
  tap(node, onOpen);
  return node;
}

/** 专题条目：16:10 全宽封面 + kicker + 标题 + 一行事实 */
function pickEntry(a, onOpen) {
  const node = el('article.a-pick', { role: 'button', tabindex: '0' },
    el('div.a-bleed', cover(a.cover, a.title + ' 氛围封面')),
    el('div.a-pick__body',
      el('div.a-pick__kickerrow',
        kick(a.dateText + ' ' + a.weekdayText + ' · ' + a.timeText),
        word(a.status, STATUS_KIND[a.statusKey])),
      el('h3.a-pick__title.a-serif', { text: a.title }),
      el('div.a-pick__dek', { text: a.routeName + ' · ' + a.city + ' · ' + a.difficultyText }),
      facts([
        { t: a.distanceKm + ' km' }, { t: '↑ ' + fmt(a.ascentM) + ' m' },
        { t: '剩 ' + leftOf(a) + ' 位' },
      ])));
  tap(node, onOpen);
  return node;
}

/** 紧凑图文行：统一比例缩略图 + 标题 + 导语 + 左侧事实；右栏为状态 / 名额 / 日期三行等宽数字 */
function tightEntry(a, onOpen) {
  const left = leftOf(a);
  const open = isOpen(a);
  /* 可报名的看「还剩几席」，其余（已成行 / 已结束 / 已取消）改看报名人数；
     后者写成「16 / 16 席」而不是「报名 16 / 16」——右栏宽度必须固定，否则标题列会被挤到断行 */
  const seats = open
    ? { t: '剩 ' + left + ' 席', cls: left > 0 && left <= 3 ? 'is-tight' : '' }
    : { t: a.signedCount + ' / ' + a.seatsTotal + ' 席', cls: 'is-none' };
  const node = el('article.a-entry', { role: 'button', tabindex: '0' },
    el('div.a-entry__thumb', cover(a.cover, a.title + ' 氛围封面')),
    el('div.a-entry__main',
      el('h3.a-entry__title.a-serif', { text: a.title }),
      el('div.a-entry__dek', { text: a.lede }),
      facts([
        { t: a.difficultyText }, { t: a.distanceKm + ' km' },
        { t: '↑ ' + fmt(a.ascentM) + ' m' },
      ])),
    el('div.a-entry__side',
      word(a.status, STATUS_KIND[a.statusKey]),
      el('div.a-entry__left.num' + (seats.cls ? '.' + seats.cls : ''), { text: seats.t }),
      el('div.a-entry__when.num', { text: md(a.dateText) + ' ' + a.weekdayText })));
  tap(node, onOpen);
  return node;
}

function discoverSkeleton() {
  return frag(
    el('div.a-masthead',
      el('div.a-masthead__issue', skel(11, '38%'), skel(11, '20%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '46%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '100%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '72%'))),
    el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(28, '100%')),
    el('div.a-bleed', { style: { marginTop: 'var(--lab-space-5)' } }, skel(200, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(26, '84%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(14, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(14, '58%')),
    el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(28, '54%')),
    ...Array.from({ length: 4 }, () => el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(96, '100%'))));
}

export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.a-discover');
  const locked = flag === 'disabled';

  /* --- 刊头 --- */
  page.appendChild(el('header.a-masthead',
    el('div.a-masthead__issue',
      kick('发现 · 第 03 期'),
      el('div.a-caption.c3', { text: '10 月 17 日' })),
    el('h1.a-masthead__title.a-serif', { text: '发现' }),
    el('p.a-masthead__lede', {
      text: '按出发时间排序，报名中的路线排在最前。每期由领队与编辑共同挑选，没有广告位。',
    })));

  if (flag === 'error') {
    page.appendChild(el('div.a-state',
      stateBlock('alert', '加载失败，请检查网络', '活动列表没能取回来，网络恢复后可以重新加载。',
        '重试', () => ui.toast('已重试（演示）'))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'loading') {
    page.appendChild(discoverSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  /* --- 工具条：文字游标 tabs（带计数 + 滑动墨条）+ 编辑式搜索 --- */
  let key = 'all';
  let q = '';

  const tabs = el('div.a-tabs');
  const ink = el('i.a-tabs__ink');

  function moveInk() {
    const active = tabs.querySelector('.a-tabs__item.is-active');
    if (!active) return;
    ink.style.width = active.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  const paintTabs = () => {
    tabs.innerHTML = '';
    FILTERS.forEach((f) => {
      const count = D.activities.filter(f.test).length;
      tabs.appendChild(el('button.a-tabs__item'
        + (f.key === key ? '.is-active' : '')
        + (locked ? '.is-disabled' : ''),
      { type: 'button', disabled: locked, 'aria-pressed': String(f.key === key),
        onclick: () => {
          if (locked || f.key === key) return;
          key = f.key;
          paintTabs();
          paintList();
        } },
      el('span.a-tabs__label', { text: f.label }),
      el('span.a-tabs__n.num', { text: String(count) })));
    });
    tabs.appendChild(ink);
    moveInk();
  };

  const searchInput = el('input', {
    type: 'search', placeholder: '搜索活动名、路线或城市', disabled: locked,
    oninput: (e) => {
      q = e.target.value.trim();
      search.classList.toggle('has-q', !!q);
      paintList();
    },
  });
  const search = el('div.input.a-search' + (locked ? '.is-disabled' : ''),
    icon('search'),
    searchInput,
    el('button.a-search__clear', {
      type: 'button', text: '清空',
      onclick: () => {
        searchInput.value = '';
        q = '';
        search.classList.remove('has-q');
        paintList();
      },
    }));

  const listBox = el('div.a-list');

  function paintList() {
    listBox.innerHTML = '';
    const f = FILTERS.find((x) => x.key === key);
    let list = D.activities.filter(f.test).slice().sort((x, y) => orderOf(x) - orderOf(y));
    if (q) list = list.filter((a) => (a.title + a.routeName + a.city + a.lede).indexOf(q) >= 0);

    if (flag === 'empty' || !list.length) {
      listBox.appendChild(el('div.a-state',
        stateBlock('search', '没有匹配的路线',
          flag === 'empty'
            ? '当前的关键词与筛选条件没有任何交集，回到全部再挑一次。'
            : '换个关键词，或把筛选条件放宽一些。',
          '清空筛选', () => ui.setFlag(''))));
      return;
    }

    /* 头条只在「全部 + 无搜索」时出现：它是编辑挑选的一篇 */
    const feature = (!q && key === 'all') ? D.featured : null;
    if (feature) listBox.appendChild(featureEntry(feature, () => ui.go('detail')));

    const rest = feature ? list.filter((a) => a.id !== feature.id) : list;

    /* 按月份分组（月份单调递增），组内「报名中的在前、其次按日期」 */
    const byMonth = new Map();
    rest.forEach((a) => {
      const m = monthOf(a.dateText);
      if (!byMonth.has(m)) byMonth.set(m, []);
      byMonth.get(m).push(a);
    });
    Array.from(byMonth.keys()).sort((x, y) => x - y).forEach((m) => {
      const items = byMonth.get(m).slice().sort((x, y) => {
        const dx = isOpen(x) ? 0 : 1;
        const dy = isOpen(y) ? 0 : 1;
        return dx - dy || orderOf(x) - orderOf(y);
      });
      listBox.appendChild(monthMark(m, items.slice().sort((x, y) => orderOf(x) - orderOf(y))));
      items.forEach((a, i) => {
        listBox.appendChild(i === 0 ? pickEntry(a, () => ui.go('detail')) : tightEntry(a, () => ui.go('detail')));
      });
    });

    listBox.appendChild(foot(D));
    /* 切换筛选/搜索后整列内容淡入一次（动效基调与墨条一致） */
    listBox.classList.remove('a-list--in');
    void listBox.offsetWidth;
    listBox.classList.add('a-list--in');
  }

  paintTabs();
  page.appendChild(el('div.a-tools', tabs, search));
  if (locked) {
    page.appendChild(el('div.a-note-line',
      el('span.a-note-line__k', { text: '只读' }),
      el('span', { text: '筛选与搜索已暂停，当前展示的是编辑部的精选版本。' })));
  }
  page.appendChild(listBox);
  paintList();
  requestAnimationFrame(moveInk);
  return page;
}

/* =========================================================
   2. 详情 — 特稿式长文
   ========================================================= */

/** 头部：300px 照片 + 压字 scrim + 衬线标题 + 副题；已取消的活动退化为纸面底（不压字） */
function detailHero(a, opts) {
  const o = opts || {};
  if (o.void) {
    return el('div.a-bleed.a-hero.a-hero--void',
      el('div.a-hero__media',
        cover(a.cover, a.title + ' 氛围封面'),
        el('div.a-hero__veil'),
        el('div.a-hero__voidtag', kick(a.dateText + ' ' + a.weekdayText + ' · ' + a.status))));
  }
  return el('div.a-bleed.a-hero',
    el('div.a-hero__media',
      cover(a.cover, a.title + ' 氛围封面'),
      el('div.a-hero__body',
        kick(a.dateText + ' ' + a.weekdayText + ' · ' + a.timeText, 'a-hero__kicker'),
        el('h1.a-hero__title.a-serif', { text: a.title }),
        el('div.a-hero__meta', {
          text: a.difficultyText + ' · 领队 ' + a.leader,
        }))));
}

/** 行程按日分组：出发钟点之前的时刻归当日、之后归次日（夜爬即 10/18 夜段 + 10/19 日段） */
function narrGroups(a) {
  const depH = Number(hhmm(a.meetingTime).slice(0, 2));
  const groups = [];
  a.itinerary.forEach((it, i) => {
    const hh = Number(String(it[0]).slice(0, 2));
    const day = isNaN(hh) || !depH ? 0 : (hh >= depH ? 0 : 1);
    const last = groups[groups.length - 1];
    if (!last || last.day !== day) groups.push({ day, items: [] });
    groups[groups.length - 1].items.push({ no: i + 1, t: it[0], text: it[1] });
  });
  return groups.map((g) => frag(
    el('div.a-narr__day',
      el('div.a-narr__d', { text: stamp(a.dateText, g.day).md + ' · ' + stamp(a.dateText, g.day).w }),
      el('div.a-narr__dn', { text: g.day === 0 ? '夜段' : '日段' })),
    ...g.items.map((it) => el('div.a-narr__item',
      el('div.a-narr__no.a-serif', { text: (it.no < 10 ? '0' : '') + it.no }),
      el('div.a-narr__time.num', { text: it.t }),
      el('div.a-narr__text', { text: it.text })))));
}

function detailSkeleton() {
  return frag(
    el('div.a-bleed', skel(300, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-5)' } }, skel(24, '92%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '84%')),
    el('div.a-factstrip', { style: { marginTop: 'var(--lab-space-6)' } },
      el('div.a-factstrip__cell', skel(11, '40%'), skel(18, '66%')),
      el('div.a-factstrip__cell', skel(11, '40%'), skel(18, '66%')),
      el('div.a-factstrip__cell', skel(11, '40%'), skel(18, '66%')),
      el('div.a-factstrip__cell', skel(11, '40%'), skel(18, '66%'))),
    el('div', { style: { marginTop: 'var(--lab-space-7)' } }, skel(11, '24%')),
    ...Array.from({ length: 6 }, () => el('div', { style: { marginTop: 'var(--lab-space-4)' } },
      skel(13, '16%'), el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(14, '100%')))),
    el('div', { style: { marginTop: 'var(--lab-space-6)' } }, skel(48, '100%')));
}

export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.a-detail');
  const locked = flag === 'disabled';

  /* --- 空态：已取消的活动（取演示数据里真实存在的取消项） --- */
  if (flag === 'empty') {
    const gone = D.activities.find((a) => a.statusKey === 'cancelled') || D.featured;
    page.appendChild(detailHero(gone, { void: true }));
    page.appendChild(el('div.a-statusline',
      word(gone.status, STATUS_KIND[gone.statusKey]),
      el('div.a-statusline__t', { text: gone.dateText + ' ' + gone.weekdayText })));
    page.appendChild(el('h2.a-sheet__title.a-serif', { text: gone.title }));
    page.appendChild(el('div.a-sheet__sub', { text: gone.routeName + ' · ' + gone.city }));
    page.appendChild(el('p.a-lede', { text: gone.lede }));
    page.appendChild(sect('费用与约定'));
    page.appendChild(el('p.a-body', { text: gone.feeNote }));
    page.appendChild(el('div.a-state',
      stateBlock('info', '活动已取消', '这条路线不再接受报名，已报名的成员会收到通知。',
        '去看看其他活动', () => ui.go('discover'))));
    page.appendChild(el('div.a-bar',
      el('button.btn.btn--primary.a-bar__main', { type: 'button', text: '报名已关闭', disabled: true }),
      el('button.a-share', { type: 'button', text: '分享', onclick: () => ui.toast('已生成分享卡片（演示）') })));
    page.appendChild(foot(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(el('div.a-state',
      stateBlock('alert', '加载失败，请检查网络', '这条活动的安排没能取回来。', '重试', () => ui.toast('已重试（演示）'))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'loading') {
    page.appendChild(detailSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  const a = D.featured;
  const left = leftOf(a);
  const mates = D.roster;
  const approved = mates.filter((m) => m.audit === '已通过');
  const checked = mates.filter((m) => m.checked);
  const crews = mates.filter((m) => m.role !== '成员');

  page.appendChild(detailHero(a));

  /* --- 纸面区 --- */
  page.appendChild(el('div.a-sheet',
    el('div.a-statusline',
      word(a.status, STATUS_KIND[a.statusKey]),
      el('div.a-statusline__t',
        el('span.a-statusline__n', { text: '剩 ' + left + ' 位' }),
        el('span.a-statusline__d', { text: '截止 ' + a.deadlineText }))),
    el('h2.a-sheet__title.a-serif', { text: a.routeName }),
    el('div.a-sheet__sub', { text: a.city }),
    el('p.a-lede', { text: a.lede }),

    /* 事实条：距离 / 爬升 / 名额 / 截止；数字成列、单位退位，四格行高一致 */
    el('div.a-factstrip',
      factCell('距离', a.distanceKm + '', 'km'),
      factCell('爬升', '↑ ' + fmt(a.ascentM), 'm'),
      factCell('名额', a.signedCount + ' / ' + a.seatsTotal),
      factCell('截止', md(a.deadlineText), hhmm(a.deadlineText))),

    /* 行程：按日分段的编号叙事（10/18 夜段 / 10/19 日段） */
    sect('行程', fmt(a.itinerary.length) + ' 个节点'),
    el('div.a-narr', ...narrGroups(a)),

    /* 集合与时间 */
    sect('集合与时间'),
    el('div.a-lines',
      line('集合点', a.meetingPoint),
      line('集合时间', a.meetingTime, a.dateText + ' ' + a.weekdayText),
      line('出发时间', a.timeText),
      line('领队', a.leader),
      line('难度', a.difficultyText),
      line('城市', a.city)),

    /* 装备与提醒 */
    sect('装备与提醒', fmt(a.requirements.length) + ' 条'),
    el('div.a-gear',
      ...a.requirements.map((r) => el('div.a-gear__item', el('div.a-gear__text', { text: r })))),

    /* 费用与约定 */
    sect('费用与约定'),
    el('p.a-body', { text: a.feeNote }),

    /* 同行人：紧凑行 + 摘要句，无卡片 */
    sect('同行人', fmt(mates.length) + ' 位'),
    facts([
      { t: '已通过 ' + approved.length }, { t: '已签到 ' + checked.length },
      { t: '待审核 ' + mates.filter((m) => m.audit === '待审核').length },
      { t: '候补 ' + mates.filter((m) => m.audit === '候补').length },
    ]),
    el('div.a-mates',
      ...crews.map((m) => el('div.a-mate',
        el('div.a-mate__id', { text: m.name.slice(0, 1) }),
        el('div.a-mate__main',
          el('div.a-mate__name', { text: m.name }),
          el('div.a-mate__meta', {
            text: m.role + ' · ' + m.tripMode + (m.seatNo === 'driver' ? ' · 司机' : ' · ' + m.seatNo + ' 座'),
          })),
        el('span.a-mate__audit', word(m.audit, AUDIT_KIND[m.audit]))))),
    el('div.a-mates__more',
      link('查看全部 ' + fmt(mates.length) + ' 位成员', () => ui.go('collab')))));

  /* --- 报尾：唯一的主操作（分享为文字链）。链：加入活动 → 提交中… → 已报名 · 待审核 --- */
  const cta = el('button.btn.btn--primary.a-bar__main', {
    type: 'button', data: { testid: 'primary-cta' },
  });
  const STAGE_TEXT = { idle: '加入活动', loading: '提交中…', done: '已报名 · 待审核', closed: '报名已截止' };
  const STAGE_CLS = { loading: 'is-loading', done: 'is-done' };
  let stage = locked ? 'closed' : 'idle';
  function paintCta() {
    cta.textContent = STAGE_TEXT[stage];
    if (stage === 'done') cta.appendChild(icon('check'));
    cta.disabled = stage !== 'idle';
    cta.classList.remove('is-loading', 'is-done');
    if (STAGE_CLS[stage]) cta.classList.add(STAGE_CLS[stage]);
  }
  cta.addEventListener('click', () => {
    if (stage !== 'idle') return;
    stage = 'loading';
    paintCta();
    setTimeout(() => {
      stage = 'done';
      paintCta();
      ui.toast('报名成功，等待领队审核');
    }, 700);
  });
  paintCta();

  if (locked) {
    page.appendChild(el('div.a-note-line.a-note-line--accent',
      el('span.a-note-line__k', { text: '报名已截止' }),
      el('span', { text: '本次活动的报名通道已于 ' + a.deadlineText + ' 关闭。' })));
  }
  page.appendChild(el('div.a-bar',
    cta,
    el('button.a-share', {
      type: 'button', disabled: locked,
      onclick: () => ui.toast('已生成分享卡片（演示）'),
    }, icon('share'), el('span', { text: '分享' }))));
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   3. 协作 — 现场手册
   ========================================================= */

const TABS = [
  { key: 'over', label: '总览' },
  { key: 'list', label: '名单' },
  { key: 'car', label: '分车' },
  { key: 'site', label: '现场' },
];

/** 由名单实时推导计数（签到变化后要重算） */
function tally(roster) {
  const approved = roster.filter((m) => m.audit === '已通过');
  const checked = roster.filter((m) => m.checked);
  return {
    total: roster.length,
    approved: approved.length,
    checked: checked.length,
    unchecked: approved.length - checked.length,
    pendingAudit: roster.filter((m) => m.audit === '待审核').length,
    waitlist: roster.filter((m) => m.audit === '候补').length,
    noVehicle: approved.filter((m) => !m.vehicleId).length,
  };
}

const seatText = (m) => (m.seatNo === 'driver' ? '司机' : m.seatNo == null ? '待定' : m.seatNo + ' 座');

function collabSkeleton() {
  return frag(
    el('div', skel(11, '56%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '70%')),
    el('div.a-fact3', { style: { marginTop: 'var(--lab-space-5)' } },
      el('div.a-fact3__cell', skel(11, '50%'), skel(14, '86%')),
      el('div.a-fact3__cell', skel(11, '50%'), skel(14, '72%')),
      el('div.a-fact3__cell', skel(11, '50%'), skel(14, '60%'))),
    el('div', { style: { marginTop: 'var(--lab-space-6)' } }, skel(30, '100%')),
    ...Array.from({ length: 7 }, () => el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(44, '100%'))),
    el('div', { style: { marginTop: 'var(--lab-space-5)' } }, skel(72, '100%')));
}

export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.a-collab');
  const locked = flag === 'disabled';
  const a = D.featured;
  const base = D.collab;

  if (flag === 'empty') {
    page.appendChild(collabHead(a, '还没有人签到', '集合中 · 集合点 ' + a.meetingPoint + ' · 出发 ' + a.meetingTime));
    page.appendChild(el('div.a-state',
      stateBlock('users', '还没有成员', '这条活动发布后，通过审核的成员会出现在这里。',
        '去看看其他活动', () => ui.go('discover'))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(collabHead(a, '协作面板打不开', '集合中 · 出发 ' + a.meetingTime + ' · 数据需要重新加载'));
    page.appendChild(el('div.a-state',
      stateBlock('alert', '加载失败，请检查网络', '协作面板没能取回来。', '重试', () => ui.toast('已重试（演示）'))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'loading') {
    page.appendChild(collabSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  /* --- 本地可变副本：签到勾选会改写它 --- */
  const roster = D.roster.map((m) => Object.assign({}, m));
  let tab = 'over';
  let departureSent = false;
  const s0 = tally(roster);

  page.appendChild(collabHead(a,
    s0.unchecked ? s0.unchecked + ' 人未签到' : '全员已签到',
    base.phase + ' · 集合点 ' + a.meetingPoint + ' · 出发 ' + a.meetingTime));
  if (locked) {
    page.appendChild(el('div.a-note-line',
      el('span.a-note-line__k', { text: '只读' }),
      el('span', { text: '签到已由领队锁定，现场以纸面名单为准。' })));
  }

  /* --- 文字游标分栏 --- */
  const seg = el('div.seg.a-seg');
  const body = el('div.a-tabbody');
  const statRow = el('div.a-stats');

  function paintSeg() {
    seg.innerHTML = '';
    TABS.forEach((t) => {
      seg.appendChild(el('button.seg__item' + (t.key === tab ? '.is-active' : ''), {
        type: 'button', text: t.label,
        onclick: () => { tab = t.key; paintSeg(); paintTab(); },
      }));
    });
  }

  /** 计数行（签到变化后重画） */
  function paintStats() {
    const s = tally(roster);
    statRow.innerHTML = '';
    [
      ['成员', s.total], ['已通过', s.approved], ['已签到', s.checked],
      ['待审核', s.pendingAudit], ['候补', s.waitlist], ['待安排车辆', s.noVehicle],
    ].forEach(([k, v]) => {
      statRow.appendChild(el('div.a-stat',
        el('div.a-stat__v.num', { text: String(v) }),
        el('div.a-stat__k', { text: k })));
    });
    headline.textContent = s.unchecked ? s.unchecked + ' 人未签到' : '全员已签到';
    arrived.textContent = s.checked + ' / ' + s.approved;
    arrivedFill.style.width = (s.approved ? Math.round((s.checked / s.approved) * 100) : 0) + '%';
  }

  const headline = el('h1.a-headline.a-serif');
  const arrived = el('div.a-fact3__v.num');
  const arrivedFill = el('i.a-hairbar__fill');
  page.appendChild(el('div.a-facts-band', statRow,
    el('div.a-fact3',
      el('div.a-fact3__cell',
        el('div.a-fact3__k', { text: '集合点' }),
        el('div.a-fact3__v', { text: a.meetingPoint })),
      el('div.a-fact3__cell',
        el('div.a-fact3__k', { text: '出发时间' }),
        el('div.a-fact3__v.num', { text: a.meetingTime })),
      el('div.a-fact3__cell',
        el('div.a-fact3__k', { text: '到点人数' }),
        arrived,
        el('div.a-hairbar', arrivedFill)))));

  page.appendChild(seg);
  page.appendChild(body);

  /* ---- 成员行（名单 / 现场共用） ---- */
  const carLabel = (id) => (D.vehicles.find((v) => v.id === id) || {}).label || '待安排车辆';

  function memberRow(m, { checkable }) {
    const toggle = el('button.a-toggle' + (m.checked ? '.is-on' : '') + (locked ? '.is-disabled' : ''), {
      type: 'button', 'aria-label': m.name + ' 签到',
      onclick: () => {
        if (locked) return;
        m.checked = !m.checked;
        m.checkedAt = m.checked ? '22:10' : undefined;
        ui.toast(m.name + (m.checked ? ' 已签到 · 22:10' : ' 已撤销签到') + '（演示）');
        paintStats();
        paintTab();
      },
    }, icon(m.checked ? 'check-circle' : 'ring'));

    return el('div.a-mrow',
      el('div.a-mrow__id', { text: m.name.slice(0, 1) }),
      el('div.a-mrow__main',
        el('div.a-mrow__name', { text: m.name + ' · ' + m.role }),
        el('div.a-mrow__meta', {
          text: m.tripMode + ' · ' + (m.vehicleId ? carLabel(m.vehicleId) + ' ' + seatText(m) : '待安排车辆')
            + (m.checked && m.checkedAt ? ' · 已签到 ' + m.checkedAt : ''),
        })),
      checkable
        ? toggle
        : word(m.audit, AUDIT_KIND[m.audit]));
  }

  /* ---- 分栏内容 ---- */
  function paintTab() {
    body.innerHTML = '';

    if (tab === 'over') {
      body.appendChild(sect('集合点', a.weekdayText + ' ' + a.dateText));
      body.appendChild(el('div.a-lines',
        line('集合点', a.meetingPoint),
        line('集合时间', a.meetingTime),
        line('领队与车长', fmt(roster.filter((m) => m.role !== '成员').length) + ' 位', '领队 ' + a.leader)));

      body.appendChild(sect('成员', '显示前 5 位 · 共 ' + roster.length + ' 位'));
      body.appendChild(el('div.a-mlist',
        ...roster.slice(0, 5).map((m) => memberRow(m, { checkable: true }))));
      body.appendChild(el('div.a-mates__more',
        el('button.a-link', { type: 'button', onclick: () => { tab = 'list'; paintSeg(); paintTab(); } },
          el('span', { text: '查看全部 ' + roster.length + ' 位成员' }), icon('arrow-right'))));

      body.appendChild(sect('车辆', fmt(D.vehicles.length) + ' 台'));
      body.appendChild(el('div.a-lines',
        ...D.vehicles.map((v) => line(v.label, v.plate + ' · 司机 ' + v.driver,
          v.seats.filter(Boolean).length + ' / ' + v.capacity + ' 座 · '
          + (v.seats.filter(Boolean).length >= v.capacity ? '满员' : '有空位')))));
      body.appendChild(el('div.a-mates__more',
        el('button.a-link', { type: 'button', onclick: () => { tab = 'car'; paintSeg(); paintTab(); } },
          el('span', { text: '查看座位安排' }), icon('arrow-right'))));
    }

    if (tab === 'list') {
      body.appendChild(sect('名单', '领队与车长优先 · 共 ' + roster.length + ' 位'));
      body.appendChild(el('div.a-mlist',
        ...roster.map((m) => memberRow(m, { checkable: m.audit === '已通过' }))));
    }

    if (tab === 'car') {
      body.appendChild(sect('分车', '每车 4 座 + 司机'));
      body.appendChild(el('div.a-cars',
        ...D.vehicles.map((v) => {
          const taken = v.seats.filter(Boolean).length;
          return el('div.a-car',
            el('div.a-car__head',
              el('div.a-car__name', { text: v.label }),
              el('div.a-car__plate.num', { text: v.plate }),
              el('div.a-car__load', {
                text: taken + ' / ' + v.capacity + ' 座 · ' + (taken >= v.capacity ? '满员' : '有空位'),
              })),
            el('div.seat-grid.a-seats',
              el('div.seat.seat--driver.a-seat--driver',
                el('span', { text: '司机 ' + v.driver }),
                el('small', { text: v.plate })),
              ...v.seats.map((name, i) => {
                // 显式落列：2 座 + 过道 + 2 座（避免自动排布把第 3 座塞进过道列）
                const col = { style: { gridColumn: i < 2 ? String(i + 1) : String(i + 3) } };
                if (!name) return el('div.seat.seat--free', col, el('span', { text: '空位' }), el('small', { text: (i + 1) + ' 号' }));
                const m = roster.find((x) => x.name === name && x.vehicleId === v.id);
                const mine = name === D.viewer.name;
                return el('div.seat.seat--taken' + (mine ? '.seat--you' : ''), col,
                  el('span', { text: name }),
                  el('small', { text: (m ? seatText(m) : (i + 1) + ' 号') + (mine ? ' · 你' : '') }));
              })));
        })));
      body.appendChild(el('div.a-note-line',
        el('span.a-note-line__k', { text: '空位' }),
        el('span', { text: '2 号车与 4 号车仍可安排拼车，点成员行可在名单里调整。' })));
    }

    if (tab === 'site') {
      const arrivedList = roster.filter((m) => m.audit === '已通过' && m.checked);
      const waitList = roster.filter((m) => m.audit === '已通过' && !m.checked);
      body.appendChild(sect('现场签到', arrivedList.length + ' / ' + (arrivedList.length + waitList.length)));
      body.appendChild(el('div.a-mlist',
        ...waitList.map((m) => memberRow(m, { checkable: true })),
        ...arrivedList.map((m) => memberRow(m, { checkable: true }))));
      if (!waitList.length && !arrivedList.length) {
        body.appendChild(el('div.a-state',
          stateBlock('users', '现场还没有人', '成员签到后会在这里按名单顺序出现。')));
      }
    }

    /* 下一步：编者按式 callout + 唯一主操作 */
    const nextText = departureSent
      ? '出发确认已发出，等待 4 位车长回复（演示）'
      : base.nextStep;
    body.appendChild(el('div.a-callout',
      kick('下一步'),
      el('div.a-callout__text', { text: nextText }),
      el('button.btn.btn--primary.a-bar__main.a-callout__cta' + (departureSent ? '.is-sent' : ''), {
        type: 'button', disabled: locked,
        onclick: () => {
          if (locked) return;
          departureSent = true;
          ui.toast('出发确认已发起，等待 4 位车长回复（演示）');
          paintTab();
        },
      }, el('span', { text: departureSent ? '确认已发起' : '发起出发确认' }), icon('arrow-right'))));
  }

  paintSeg();
  paintStats();
  paintTab();
  page.appendChild(foot(D));
  return page;
}

/** 协作页顶部：状态句 + 阶段眉题 */
function collabHead(a, headline, sub) {
  return el('header.a-chead',
    kick(a.title + ' · ' + a.dateText + ' ' + a.weekdayText),
    el('h1.a-headline.a-serif', { text: headline }),
    el('div.a-chead__sub', { text: sub }));
}

/* =========================================================
   4. 天气 — 编辑式简报
   ========================================================= */

const SPARK = { w: 342, h: 108, right: 24, top: 12, bottom: 20 };

/** 从数据里取关键窗口（云海窗口 / 降雨）——不写死下标，跟着数据走 */
function keyBands(hours) {
  const bands = [];
  hours.forEach((d, i) => {
    const last = bands[bands.length - 1];
    if (!d.keyNote) return;
    if (last && last.note === d.keyNote) last.to = i;
    else bands.push({ note: d.keyNote, from: i, to: i });
  });
  return bands;
}

/** 轻量曲线 + 降水柱 + 窗口色带（纯数据，无装饰） */
function sparkSVG(hours, lo, hi, bands) {
  const W = SPARK.w, H = SPARK.h, R = SPARK.right, T = SPARK.top, B = SPARK.bottom;
  const n = hours.length;
  const plotW = W - R;
  const px = (i) => (plotW * i) / (n - 1);
  const py = (t) => T + (H - T - B) * (1 - (t - lo) / ((hi - lo) || 1));
  let s = '';

  /* 窗口色带：色带按窗口名取令牌色（云海=纸面色带，降雨=信息色低透明） */
  const fillOf = { 云海窗口: ['var(--lab-surface-2)', 1], 降雨: ['var(--lab-info)', '.12'] };
  bands.forEach((b) => {
    const c = fillOf[b.note] || ['var(--lab-border)', 1];
    const x = px(b.from) - plotW / (n - 1) / 2;
    const w = px(b.to) - px(b.from) + plotW / (n - 1);
    s += `<rect x="${x.toFixed(1)}" y="${T}" width="${w.toFixed(1)}" height="${(H - T - B).toFixed(1)}" fill="${c[0]}" fill-opacity="${c[1]}"/>`;
  });

  /* 网格线（低 / 中 / 高） */
  [lo, (lo + hi) / 2, hi].forEach((t) => {
    const y = py(t).toFixed(1);
    s += `<line x1="0" y1="${y}" x2="${plotW}" y2="${y}" stroke="var(--lab-border)" stroke-width="1"/>`;
  });

  /* 降水概率柱 */
  hours.forEach((d, i) => {
    const bh = Math.max(1, (d.precip / 100) * 24);
    s += `<rect x="${(px(i) - 1.6).toFixed(1)}" y="${(H - B - bh).toFixed(1)}" width="3.2" height="${bh.toFixed(1)}" fill="var(--lab-info)" fill-opacity=".34"/>`;
  });

  /* 温度曲线 */
  const path = hours.map((d, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(d.temp).toFixed(1)).join('');
  s += `<path d="${path}" fill="none" stroke="var(--lab-brand)" stroke-width="1.5" stroke-linejoin="round"/>`;

  /* 轴：右端上下值 + 6 小时刻度 */
  s += `<text x="${plotW + 4}" y="${(py(hi) + 3).toFixed(1)}" font-size="9" fill="var(--lab-text-3)" font-family="inherit">${hi.toFixed(1)}</text>`;
  s += `<text x="${plotW + 4}" y="${(py(lo) + 3).toFixed(1)}" font-size="9" fill="var(--lab-text-3)" font-family="inherit">${lo.toFixed(1)}</text>`;
  hours.forEach((d, i) => {
    if (d.t.getHours() % 6) return;
    const label = d.t.getHours() === 0
      ? (d.t.getMonth() + 1) + '/' + d.t.getDate()
      : ('0' + d.t.getHours()).slice(-2) + ':00';
    s += `<text x="${px(i).toFixed(1)}" y="${H - 6}" font-size="9" text-anchor="middle" fill="var(--lab-text-3)" font-family="inherit">${label}</text>`;
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" aria-hidden="true">' + s + '</svg>';
}

/** 窗口表数值格：「云海 55%」「风 3 m/s」拆成数字 + 单位，数字右对齐成一列 */
function measureCell(raw) {
  const m = /^(\D*?)([\d.]+)(\D*)$/.exec(String(raw).trim());
  if (!m) return el('div.a-wcell', { text: String(raw) });
  return el('div.a-wcell.a-wcell--n',
    el('span', { text: m[2] }),
    m[3] ? el('span.a-wcell__u', { text: m[3].trim() }) : null);
}

function weatherSkeleton() {
  return frag(
    el('div', skel(11, '72%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '68%')),
    el('div.a-factstrip', { style: { marginTop: 'var(--lab-space-5)' } },
      el('div.a-factstrip__cell', skel(11, '44%'), skel(16, '76%')),
      el('div.a-factstrip__cell', skel(11, '44%'), skel(16, '76%')),
      el('div.a-factstrip__cell', skel(11, '44%'), skel(16, '76%'))),
    el('div.a-spark', { style: { marginTop: 'var(--lab-space-6)' } }, skel(108, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(72, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-5)' } }, skel(28, '100%')),
    ...Array.from({ length: 4 }, () => el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(28, '100%'))));
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.a-weather');
  const { meta, hours } = D.weather;
  const locked = flag === 'disabled';

  if (flag === 'empty') {
    page.appendChild(el('div.a-state',
      stateBlock('cloud', '数据缺失', '这条路线暂时没有关联的气象站点，出发前请以现场实况为准。',
        '重试', () => ui.toast('已重试（演示）'))));
    page.appendChild(el('div.a-note-line',
      el('span.a-note-line__k', { text: '来源' }), el('span', { text: meta.source })));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(el('div.a-state',
      stateBlock('alert', '加载失败，请检查网络', '预报数据没能取回来。', '重试', () => ui.toast('已重试（演示）'))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'loading') {
    page.appendChild(weatherSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  const temps = hours.map((h) => h.temp);
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const winds = hours.map((h) => h.wind);
  const precip = hours.map((h) => h.precip);
  const clouds = hours.map((h) => h.cloud);
  const peak = (arr) => arr.indexOf(Math.max(...arr));
  const trough = (arr) => arr.indexOf(Math.min(...arr));
  const win = meta.window[0];
  const bands = keyBands(hours);
  const cloud = bands.find((b) => b.note === '云海窗口');
  let sel = cloud ? Math.min(cloud.from + 2, cloud.to) : 0; // 默认落在云海窗口中段

  page.appendChild(el('header.a-brief',
    el('div.a-brief__top',
      kick('天气简报 · ' + meta.location),
      el('div.a-caption.c3', { text: meta.updatedText })),
    el('h1.a-brief__headline.a-serif', { text: meta.verdict }),
    el('p.a-brief__stand', { text: meta.detail })));

  /* --- 站位事实条（数字右对齐、单位退位） --- */
  page.appendChild(el('div.a-factstrip.a-factstrip--rows',
    el('div.a-factstrip__cell',
      el('div.a-factstrip__k', { text: '出发窗口' }),
      el('div.a-factstrip__v.a-factstrip__v--sm', { text: win[0] })),
    rowFact('48h 温度', lo.toFixed(1) + '–' + hi.toFixed(1), '℃'),
    rowFact('48h 风', Math.min(...winds).toFixed(1) + '–' + Math.max(...winds).toFixed(1), 'm/s'),
    rowFact('站点海拔', fmt(meta.elevationM), 'm')));

  /* --- 曲线 + 48 小时点选 --- */
  const legend = el('div.a-legend',
    ...bands.map((b) => el('span.a-legend__item',
      el('i.a-legend__sw' + (b.note === '云海窗口' ? '.a-legend__sw--cloud' : '.a-legend__sw--rain')),
      el('span', {
        text: b.note + ' ' + hours[b.from].label.slice(0, 5) + ' ' + hours[b.from].label.slice(-5)
          + '–' + hours[b.to].label.slice(-5),
      }))));

  const marker = el('div.a-spark__marker');
  const dot = el('i.a-spark__dot');
  marker.appendChild(dot);
  const rail = el('div.a-spark__rail' + (locked ? '.is-locked' : ''));
  const readout = el('div.a-readout');

  hours.forEach((d, i) => {
    rail.appendChild(el('button.a-spark__hit' + (i === sel ? '.is-on' : ''), {
      type: 'button', 'aria-label': d.label + ' ' + d.temp + ' 摄氏度',
      onclick: () => { if (locked) return; sel = i; paint(); },
    }));
  });

  const frame = el('div.a-spark',
    el('div.a-spark__plot', { html: sparkSVG(hours, lo, hi, bands) }),
    marker,
    rail);
  page.appendChild(sect('48 小时简表', fmt(hours.length) + ' 条'));
  page.appendChild(legend);
  page.appendChild(frame);
  page.appendChild(el('div.a-units.c3', { text: '折线 温度 ℃ · 柱形 降水概率 % · 点选任意小时看读数' }));

  function paint() {
    const d = hours[sel];
    const xPct = (sel / (hours.length - 1)) * ((SPARK.w - SPARK.right) / SPARK.w) * 100;
    const yPct = ((SPARK.top + (SPARK.h - SPARK.top - SPARK.bottom)
      * (1 - (d.temp - lo) / ((hi - lo) || 1))) / SPARK.h) * 100;
    marker.style.left = xPct.toFixed(2) + '%';
    dot.style.top = yPct.toFixed(2) + '%';
    [...rail.children].forEach((n, i) => n.classList.toggle('is-on', i === sel));

    /* 判定：由该小时的真实数值推导；关键时段直接采用数据里的标注 */
    let verdict = '条件一般';
    if (d.precip >= 60) verdict = '不宜停留';
    else if (d.wind >= 5) verdict = '风偏大';
    else if (d.cloud <= 40 && d.precip < 30) verdict = '较通透';
    else if (d.cloud >= 80) verdict = '云厚';

    readout.innerHTML = '';
    readout.appendChild(el('div.a-readout__head',
      el('div.a-readout__time.a-serif', { text: d.label }),
      word(d.night ? '夜间' : '白天', d.night ? 'neutral' : 'info')));
    [
      ['温度', d.temp.toFixed(1), '℃'],
      ['降水概率', String(d.precip), '%'],
      ['风速', d.wind.toFixed(1), 'm/s'],
      ['云量', String(d.cloud), '%'],
      ['判定', verdict, ''],
      ['关键时段', d.keyNote || '—', ''],
    ].forEach(([k, v, u]) => {
      readout.appendChild(el('div.a-readout__cell',
        el('div.a-readout__k', { text: k }),
        el('div.a-readout__v' + (k === '判定' || k === '关键时段' ? '.a-readout__v--word' : '.num'),
          el('span', { text: v }), u ? el('span.a-readout__u', { text: u }) : null)));
    });
  }
  paint();
  page.appendChild(readout);

  /* --- 数据行（带单位） --- */
  page.appendChild(sect('数据行', '48 小时区间'));
  page.appendChild(el('div.a-lines',
    line('风速', Math.min(...winds).toFixed(1) + '–' + Math.max(...winds).toFixed(1) + ' m/s',
      '峰值 ' + hours[peak(winds)].label.slice(-5)),
    line('降水概率', '最高 ' + Math.max(...precip) + ' %',
      '峰值 ' + hours[peak(precip)].label.slice(-5)),
    line('云量', Math.min(...clouds) + '–' + Math.max(...clouds) + ' %',
      '最低 ' + hours[trough(clouds)].label.slice(-5))));

  /* --- 窗口表（行可点选，联动读数） --- */
  page.appendChild(sect('窗口判定', '点一行可跳到该时段'));
  const table = el('div.a-wtable');
  table.appendChild(el('div.a-wrow.a-wrow--head',
    el('div.a-wcell', { text: '时段' }),
    el('div.a-wcell', { text: '判定' }),
    el('div.a-wcell.a-wcell--n', { text: '云海' }),
    el('div.a-wcell.a-wcell--n', { text: '风' })));
  meta.window.forEach((w, i) => {
    const band = bands[i] || bands[0];
    const row = el('div.a-wrow' + (locked ? '.is-disabled' : ''),
      { role: 'button', tabindex: locked ? '-1' : '0' },
      el('div.a-wcell.a-wcell--t', { text: w[0] }),
      el('div.a-wcell', { text: w[1] }),
      measureCell(w[2]),
      measureCell(w[3]));
    tap(row, () => {
      if (locked || !band) return;
      sel = Math.min(band.from + 2, band.to);
      paint();
    });
    table.appendChild(row);
  });
  page.appendChild(table);

  /* --- 决策便笺：只讲这一段窗口的数字，不复述简报正文 --- */
  const winHours = cloud ? hours.slice(cloud.from, cloud.to + 1) : [];
  page.appendChild(el('div.a-decision',
    kick('编辑建议'),
    el('p.a-body', {
      text: '按「' + win[0] + '」安排山顶等候：'
        + (winHours.length
          ? '该时段云量 ' + Math.min(...winHours.map((h) => h.cloud)) + '–'
            + Math.max(...winHours.map((h) => h.cloud)) + ' %，降水概率 '
            + Math.min(...winHours.map((h) => h.precip)) + '–'
            + Math.max(...winHours.map((h) => h.precip)) + ' %，是 48 小时里最通透的一段。'
          : meta.detail),
    })));

  if (locked) {
    page.appendChild(el('div.a-note-line',
      el('span.a-note-line__k', { text: '只读快照' }),
      el('span', { text: '这是出发前的静态快照，逐时点选与窗口跳转已暂停。' })));
  }
  page.appendChild(el('div.a-note-line',
    el('span.a-note-line__k', { text: '来源' }),
    el('span', { text: meta.source })));
  page.appendChild(foot(D));
  return page;
}