// Style F — Trail Works（山野工坊）
// A 的刊物骨架 + B 的台账纪律 + D 的工具件 + E 的分区组织 + C 的状态表达
//
// DOM 组织按「工坊台账」来搭（结构与 A 同规格可比，密度更高）：
//   发现 = 刊头 → 本期头条整版（工位 01 之前，首屏摄影）→ 工位 01 本月概览 → 工位 02 检索与筛选
//          → 月份时间轴 → 专题领图 → 工位行 → 脚注
//   详情 = 特稿头图 → 工位 01 概览（四联读数 + 出发倒计时）→ 工位 02 行程（海拔剖面 + 编号叙事）
//          → 工位 03 集合与时间（规格行）→ 工位 04 装备（两栏台账）→ 工位 05 费用与同行人 → 报尾操作
//   协作 = 抬头 + 倒计时 → 工位 01 现场计数（人先于数）→ 工位 02 名单/分车/现场（游标 + 台账）→ 工位 03 下一步
//   天气 = 简报 → 工位 01 站位规格 → 工位 02 48 小时曲线 + 逐时读数 → 工位 03 逐时判定表
//          → 工位 04 窗口判定表 → 工位 05 决策便笺 → 来源 → 脚注
// 与 A（刊物流）、B（网格表）、C（色带清单）、D（控制台）、E（深色分区）结构上均不同。
// 状态页（空 / 错）也走同一个「工位 0N」容器，结构与主页同构（E2）。
//
// 只复用共享原语：el / icon / photo / fmt / pad2 / frag；事件一律 el(..., {onclick})，无内联 on*。
// 数据只读 prototype/js/data.js；不删任何字段。

import { el, icon, photo, fmt, pad2, frag } from '../../render-common.js';

const NOTE = '同一演示数据 · 七风格对照实验';
const ASSETS = 'assets/photos/';

/* 状态词 → 语义色（与 A–E 同一套色义，保证跨风格可比） */
const STATUS_KIND = { open: 'success', hot: 'warning', formed: 'info', ended: 'off', cancelled: 'danger' };
const AUDIT_KIND = { 已通过: 'success', 待审核: 'warning', 候补: 'off' };

/* 演示时钟：由「天气更新 10 月 17 日 21:40」与设备状态栏 22:10 推得。
   倒计时与相对时间一律以它为基准，不读系统时钟 —— 否则每次刷新读数都变，截图不可复现。 */
const DEMO_NOW = new Date(2025, 9, 17, 22, 10);

/* =========================================================
   0. 通用小组件
   ========================================================= */

/** 脚注：来源与实验标识分两级 */
function foot(D) {
  return el('div.footnote',
    el('div.f-foot__credit', { text: D.credit }),
    el('div.f-foot__note', { text: NOTE })
  );
}

/** 眉题 */
const kick = (t, cls) => el('div.f-kicker' + (cls ? '.' + cls : ''), { text: t });

/** 序号：01 / 02 …（工位与台账的编号语言） */
const no2 = (n) => (n < 10 ? '0' : '') + n;

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

/** 取 HH:MM */
function hhmm(dateText) {
  const m = /(\d{1,2}):(\d{2})/.exec(String(dateText || ''));
  return m ? m[1].padStart(2, '0') + ':' + m[2] : '';
}

/** 「日期 + 时刻」合成绝对时刻（倒计时用） */
function at(dateText, timeText) {
  const m = /(\d+)\s*月\s*(\d+)/.exec(dateText || '');
  if (!m) return null;
  const t = /(\d{1,2}):(\d{2})/.exec(String(timeText || ''));
  return new Date(2025, Number(m[1]) - 1, Number(m[2]),
    t ? Number(t[1]) : 0, t ? Number(t[2]) : 0);
}

const monthOf = (dateText) => {
  const m = /(\d+)\s*月/.exec(dateText || '');
  return m ? Number(m[1]) : 0;
};
const dayOf = (dateText) => {
  const m = /月\s*(\d+)/.exec(dateText || '');
  return m ? Number(m[1]) : 0;
};
const orderOf = (a) => monthOf(a.dateText) * 100 + dayOf(a.dateText);

/** 是否仍可报名（与筛选口径一致） */
const isOpen = (a) => a.statusKey === 'open' || a.statusKey === 'hot';

/** 状态词：工牌式，实心方点；失效态挖空 */
const word = (t, kind) => el('span.f-word.f-word--' + (kind || 'off'), { text: t });

/** 行内事实 */
function facts(items) {
  const box = el('div.f-facts');
  items.forEach((it, i) => {
    if (i) box.appendChild(el('span.f-facts__sep', { text: '·' }));
    box.appendChild(el('span.f-facts__item' + (it.hi ? '.is-hi' : ''), { text: it.t }));
  });
  return box;
}

/** 规格行：标签定宽 · 值右对齐 · 单位常显 · 右侧备注（B 的纪律） */
function spec(k, v, u, n, cls) {
  return el('div.f-spec' + (cls ? '.' + cls : ''),
    el('div.f-spec__k', { text: k }),
    el('div.f-spec__v' + (cls === 'is-word' ? '.f-spec__v--word' : ''),
      el('span', { text: v }),
      u ? el('span.f-spec__u', { text: u }) : null),
    n ? el('div.f-spec__n', { text: n }) : null);
}

/** 四联读数格：一条横排 4 格，数字右对齐、单位退位 */
function quad(k, v, u, cls) {
  return el('div.f-quad__cell' + (cls ? '.' + cls : ''),
    el('div.f-quad__k', { text: k }),
    el('div.f-quad__v',
      el('span', { text: v }),
      u ? el('span.f-quad__u', { text: u }) : null));
}

/** 计数格：数字 + 标签 */
function countCell(v, k, cls) {
  return el('div.f-counts__cell' + (cls ? '.' + cls : ''),
    el('div.f-counts__v', { text: String(v) }),
    el('div.f-counts__k', { text: k }));
}

/** 倒计时：主读数 + 目标时刻（D 的工具件） */
function countdown(k, due, note) {
  const mins = due ? Math.max(0, Math.round((due - DEMO_NOW) / 60000)) : 0;
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const soon = mins <= 120;
  return el('div.f-countdown',
    el('div.f-countdown__k', { text: k }),
    el('div.f-countdown__v' + (soon ? '.is-soon' : ''), {
      text: d > 0 ? d + ' 天 ' + pad2(h) + ' 时' : pad2(h) + ' 时 ' + pad2(m) + ' 分',
    }),
    note ? el('div.f-countdown__n', { text: note }) : null);
}

/** 工位分区：编号 + 名称 + 右侧计数 */
function zone(no, name, meta, tone, body, current) {
  return el('section.f-zone' + (tone ? '.f-zone--' + tone : '') + (current ? '.is-current' : ''),
    el('div.f-zone__tab',
      el('div.f-zone__no', { text: '工位 ' + no2(no) }),
      el('div.f-zone__name', { text: name }),
      meta ? el('div.f-zone__meta', { text: meta }) : null),
    el('div.f-zone__body', ...[].concat(body)));
}

/** 内部分组头（分区内的二级切分） */
function subhead(label, right) {
  return el('div.f-subhead',
    kick(label),
    right ? el('div.f-subhead__n', { text: right }) : null);
}

/** 台账容器：列宽写进 --f-led-cols。
    注意必须走 setProperty —— el() 对 style 对象用 Object.assign，写不进 --* 自定义属性，
    那样每一张台账都会退回 4 列默认值，行内标签与表头因此错位。 */
function ledger(cols, cls) {
  const box = el('div.f-ledger' + (cls ? '.' + cls : ''));
  box.style.setProperty('--f-led-cols', cols);
  return box;
}

/** 分区操作条：主操作 + 次操作 + 一句说明（E 的页内操作语言） */
function actions(note, ...buttons) {
  return el('div.f-actions',
    note ? el('div.f-actions__note', { html: note }) : null,
    ...buttons.filter(Boolean));
}

function link(label, fn, sm) {
  return el('button.f-link' + (sm ? '.f-link--sm' : ''), { type: 'button', onclick: fn },
    el('span', { text: label }),
    icon('arrow-right'));
}

function monthMark(month, items) {
  const days = items.map((a) => md(a.dateText));
  const span = days.length > 1 && days[0] !== days[days.length - 1]
    ? days[0] + '–' + days[days.length - 1]
    : days[0];
  return el('div.f-month',
    el('div.f-month__k', { text: month + ' 月' }),
    el('div.f-month__n', { text: fmt(items.length) + ' 项 · ' + span }));
}

/** 照片（直角；解码完成后再淡入） */
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

/** 点击可达性：鼠标 + 键盘；条目内的独立按钮不重复触发整条跳转 */
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

/** 状态块（空 / 错误 / 缺失）：C 的表达 —— 文字色 + 留白，没有红色块。
    E3：错误态不挂通用三角图标，改由 F 同族的 2px 刻线 + 衬线标题承担（见 F.css）。 */
function stateBlock(iconName, title, body, label, fn, kind) {
  const k = kind || 'quiet';
  return el('div.state-block' + (k === 'error' ? '.state-block--error' : k === 'off' ? '.state-block--off' : ''),
    iconName ? icon(iconName) : null,
    el('div.state-block__title', { text: title }),
    el('div.state-block__body', { text: body }),
    label ? link(label, fn) : null);
}

const skel = (h, w) => el('div.skeleton.f-skel-' + h, w ? { style: { width: w } } : null);

const leftOf = (a) => Math.max(0, a.seatsTotal - a.signedCount);

/** 由名单实时推导计数（签到变化后重算） */
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

/* =========================================================
   1. 发现 — 工坊目录
   ========================================================= */

const FILTERS = [
  { key: 'all', label: '全部', test: () => true },
  { key: 'open', label: '可报名', test: isOpen },
  { key: 'formed', label: '已成行', test: (a) => a.statusKey === 'formed' },
  { key: 'ended', label: '已结束', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
];

/** 头条：整版封面（16:10）+ 提要 + 四联读数 + 操作行 */
function featureEntry(a, onOpen) {
  const node = el('article.f-feature', { role: 'button', tabindex: '0' },
    el('div.f-bleed',
      el('div.f-feature__media',
        cover(a.cover, a.title + ' 氛围封面'),
        el('div.f-feature__stamp',
          el('span.f-feature__stamp-d', { text: a.dateText }),
          el('span.f-feature__stamp-w', { text: a.weekdayText })))),
    el('div.f-feature__body',
      kick('本期头条 · ' + a.city + ' · ' + a.difficultyText),
      el('h2.f-feature__title', { text: a.title }),
      el('div.f-feature__route', { text: a.routeName }),
      el('p.f-quote', { text: a.lede }),
      el('div.f-quad',
        quad('距离', a.distanceKm + '', 'km'),
        quad('爬升', '↑ ' + fmt(a.ascentM), 'm'),
        quad('名额', a.signedCount + ' / ' + a.seatsTotal),
        quad('剩余', String(leftOf(a)), '席', leftOf(a) <= 3 ? 'is-hi' : '')),
      el('div.f-feature__foot',
        link('查看安排', onOpen),
        word(a.status, STATUS_KIND[a.statusKey]))));
  tap(node, onOpen);
  return node;
}

/** 专题条目：3:2 满幅领图 + 四联读数（B 的数字纪律） */
function pickEntry(a, onOpen, idx) {
  const node = el('article.f-pick', { role: 'button', tabindex: '0' },
    el('div.f-bleed', cover(a.cover, a.title + ' 氛围封面')),
    el('div.f-pick__body',
      el('div.f-pick__kickerrow',
        kick(no2(idx) + ' · ' + a.dateText + ' ' + a.weekdayText + ' · ' + a.timeText),
        word(a.status, STATUS_KIND[a.statusKey])),
      el('h3.f-pick__title', { text: a.title }),
      el('div.f-pick__dek', { text: a.routeName + ' · ' + a.city + ' · ' + a.difficultyText }),
      el('div.f-quad',
        quad('距离', a.distanceKm + '', 'km'),
        quad('爬升', '↑ ' + fmt(a.ascentM), 'm'),
        quad('名额', a.seatsTotal + '', '席'),
        quad('剩余', String(leftOf(a)), '位', leftOf(a) <= 3 ? 'is-hi' : ''))));
  tap(node, onOpen);
  return node;
}

/** 工位行：序号 + 缩略图 + 主栏 + 右对齐数字栏 */
function workRow(a, onOpen, idx) {
  const left = leftOf(a);
  const open = isOpen(a);
  const seats = open
    ? { t: '剩 ' + left + ' 席', cls: left > 0 && left <= 3 ? 'is-tight' : '' }
    : { t: a.signedCount + ' / ' + a.seatsTotal + ' 席', cls: 'is-none' };
  const node = el('article.f-wrow', { role: 'button', tabindex: '0' },
    el('div.f-wrow__idx', { text: no2(idx) }),
    el('div.f-wrow__thumb', cover(a.cover, a.title + ' 氛围封面')),
    el('div.f-wrow__main',
      el('h3.f-wrow__title', { text: a.title }),
      el('div.f-wrow__meta', {
        html: a.difficultyText + ' · <span class="num">' + a.distanceKm + ' km</span> · ↑ '
          + '<span class="num">' + fmt(a.ascentM) + ' m</span> · 领队 ' + a.leader,
      }),
      el('div.f-wrow__meta', {
        text: a.meetingPoint + ' · 集合 ' + a.meetingTime + ' · 截止 ' + a.deadlineText,
      })),
    el('div.f-wrow__nums',
      word(a.status, STATUS_KIND[a.statusKey]),
      el('div.f-wrow__seats' + (seats.cls ? '.' + seats.cls : ''), { text: seats.t }),
      el('div.f-wrow__when', { text: md(a.dateText) + ' ' + a.weekdayText })));
  tap(node, onOpen);
  return node;
}

function discoverSkeleton() {
  return frag(
    el('div.f-masthead',
      el('div.f-masthead__issue', skel(11, '38%'), skel(11, '20%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '46%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '100%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '72%'))),
    el('div.f-zone.f-zone--oat', { style: { marginTop: 'var(--lab-space-4)' } },
      skel(14, '70%'), el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(14, '100%'))),
    el('div.f-bleed', { style: { marginTop: 'var(--lab-space-5)' } }, skel(244, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '84%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(18, '52%')),
    el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(30, '54%')),
    ...Array.from({ length: 4 }, () => el('div', { style: { marginTop: 'var(--lab-space-3)' } },
      skel(72, '100%'))));
}

export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.f-discover');
  const locked = flag === 'disabled';

  const nMonth = D.activities.filter((a) => monthOf(a.dateText) === 10);
  const monthKm = nMonth.reduce((s, a) => s + a.distanceKm, 0);
  const monthUpSum = nMonth.reduce((s, a) => s + a.ascentM, 0);
  const monthLong = Math.max(...nMonth.map((a) => a.distanceKm));
  /* V2-2：「最近一场」＝当月最近的**未来**场。升序取 [0] 会命中已结束的铁瓦殿（10/11）；
     口径 = orderOf > DEMO_NOW 的 orderOf（10/17 → 1017），本月无未来场时回退最后一场。 */
  const nowOrder = (DEMO_NOW.getMonth() + 1) * 100 + DEMO_NOW.getDate();
  const monthAsc = nMonth.slice().sort((x, y) => orderOf(x) - orderOf(y));
  const monthSoon = monthAsc.find((a) => orderOf(a) > nowOrder) || monthAsc[monthAsc.length - 1];

  const masthead = el('header.f-masthead',
    el('div.f-masthead__issue',
      kick('发现 · 第 03 期'),
      el('div.f-caption.c3', { text: '10 月 17 日' })),
    el('h1.f-masthead__title', { text: '发现' }),
    el('p.f-masthead__lede', {
      text: '按出发时间排序，报名中的路线排在最前。每期由领队与编辑共同挑选，没有广告位。',
    }));

  /* V2-5②：三个分支结构互斥 —— 错误态＝真实刊头 + 错误区；加载态＝纯 skeleton
     （discoverSkeleton 自带刊头占位）；正常态才叠刊头 → 头条位 → 工位 01。
     先前错误态把「本月概览」正常区与错误区各渲染一次，工位 01 在同一页出现两次。 */
  if (flag === 'error') {
    page.appendChild(masthead);
    page.appendChild(zone(1, '本月概览', '未载入', null, [
      el('div.f-state.f-state--fill',
        stateBlock(null, '加载失败，请检查网络', '活动列表没能取回来，网络恢复后可以重新加载。',
          '重试', () => ui.toast('已重试（演示）'), 'error')),
    ]));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'loading') {
    page.appendChild(discoverSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  page.appendChild(masthead);

  /* --- 头条位（B2：把目录区的头条上移到工位 01 之前，首屏先见摄影） --- */
  const leadBox = el('div.f-lead');
  page.appendChild(leadBox);

  /* --- 工位 01：本月概览（全部由活动列表聚合而来，不引入新数据） --- */
  page.appendChild(zone(1, '本月概览', '10 月', null, [
    el('div.f-quad',
      quad('本月项数', String(nMonth.length), '项'),
      quad('合计里程', monthKm.toFixed(1), 'km'),
      quad('爬升合计', fmt(monthUpSum), 'm'),
      quad('最长单场', monthLong.toFixed(1), 'km', 'is-hi')),
    el('div.f-specs',
      spec('最近一场', monthSoon.dateText + ' ' + monthSoon.weekdayText, '',
        monthSoon.title),
      /* V2-2：删去「本月 N 场」注记 —— 四联读数的「本月项数 N 项」与 tab 挂数已经承担了段内计数，
         这一行是把同一个「5」第三次说出来 */
      spec('本月难度', Array.from(new Set(nMonth.map((a) => a.difficultyText))).join(' / '))),
  ]));

  /* --- 工位 01：检索与筛选 --- */
  let key = 'all';
  let q = '';

  const tabs = el('div.f-tabs');
  const ink = el('i.f-tabs__ink');

  function moveInk() {
    const active = tabs.querySelector('.f-tabs__item.is-active');
    if (!active) return;
    ink.style.width = active.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  const paintTabs = () => {
    tabs.innerHTML = '';
    FILTERS.forEach((f) => {
      const count = D.activities.filter(f.test).length;
      tabs.appendChild(el('button.f-tabs__item'
        + (f.key === key ? '.is-active' : '')
        + (locked ? '.is-disabled' : ''),
      { type: 'button', disabled: locked, 'aria-pressed': String(f.key === key),
        onclick: () => {
          if (locked || f.key === key) return;
          key = f.key;
          paintTabs();
          paintList();
        } },
      el('span', { text: f.label }),
      el('span.f-tabs__n', { text: String(count) })));
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
  const search = el('div.input.f-search' + (locked ? '.is-disabled' : ''),
    icon('search'),
    searchInput,
    el('button.f-search__clear', {
      type: 'button', text: '清空',
      onclick: () => {
        searchInput.value = '';
        q = '';
        search.classList.remove('has-q');
        paintList();
      },
    }));

  paintTabs();
  page.appendChild(zone(2, '检索与筛选', '', 'oat',
    [tabs, search],
    false));
  if (locked) {
    page.appendChild(el('div.f-note-line',
      el('div.f-note-line__k', { text: '只读' }),
      el('span', { text: '筛选与搜索已暂停，当前展示的是编辑部的精选版本。' })));
  }

  /* --- 目录正文 --- */
  const listBox = el('div.f-list');
  page.appendChild(listBox);

  function paintList() {
    listBox.innerHTML = '';
    leadBox.innerHTML = '';
    const f = FILTERS.find((x) => x.key === key);
    let list = D.activities.filter(f.test).slice().sort((x, y) => orderOf(x) - orderOf(y));
    if (q) list = list.filter((a) => (a.title + a.routeName + a.city + a.lede).indexOf(q) >= 0);

    if (flag === 'empty' || !list.length) {
      listBox.appendChild(zone(3, '检索结果', '无匹配', null, [
        el('div.f-state',
          stateBlock('search', '没有匹配的路线',
            flag === 'empty'
              ? '当前的关键词与筛选条件没有任何交集，回到全部再挑一次。'
              : '换个关键词，或把筛选条件放宽一些。',
            '清空筛选', () => ui.setFlag(''), 'off')),
      ]));
      listBox.appendChild(foot(D));
      return;
    }

    /* 头条：默认全量视图下上移到工位 01 之前（首屏摄影）；筛选 / 搜索时回到目录里的常规位置 */
    const feature = (!q && key === 'all') ? D.featured : null;
    if (feature) leadBox.appendChild(featureEntry(feature, () => ui.go('detail')));

    const rest = feature ? list.filter((a) => a.id !== feature.id) : list;

    const byMonth = new Map();
    rest.forEach((a) => {
      const m = monthOf(a.dateText);
      if (!byMonth.has(m)) byMonth.set(m, []);
      byMonth.get(m).push(a);
    });
    let idx = 0;
    Array.from(byMonth.keys()).sort((x, y) => x - y).forEach((m) => {
      const items = byMonth.get(m).slice().sort((x, y) => {
        const dx = isOpen(x) ? 0 : 1;
        const dy = isOpen(y) ? 0 : 1;
        return dx - dy || orderOf(x) - orderOf(y);
      });
      listBox.appendChild(monthMark(m, items.slice().sort((x, y) => orderOf(x) - orderOf(y))));
      items.forEach((a, i) => {
        idx++;
        listBox.appendChild(i === 0
          ? pickEntry(a, () => ui.go('detail'), idx)
          : workRow(a, () => ui.go('detail'), idx));
      });
    });

    listBox.appendChild(foot(D));
    listBox.classList.remove('f-list--in');
    void listBox.offsetWidth;
    listBox.classList.add('f-list--in');
  }

  paintList();
  requestAnimationFrame(moveInk);
  return page;
}

/* =========================================================
   2. 详情 — 规格单
   ========================================================= */

/** 头图：整版照片 + 压字 scrim + 衬线标题 + 副题；已取消的活动退化为纸面底 */
function detailHero(a, opts) {
  const o = opts || {};
  if (o.void) {
    return el('div.f-bleed.f-hero.f-hero--void',
      el('div.f-hero__media',
        cover(a.cover, a.title + ' 氛围封面'),
        el('div.f-hero__veil'),
        el('div.f-hero__voidtag', kick(a.dateText + ' ' + a.weekdayText + ' · ' + a.status))));
  }
  return el('div.f-bleed.f-hero',
    el('div.f-hero__media',
      cover(a.cover, a.title + ' 氛围封面'),
      el('div.f-hero__body',
        kick(a.dateText + ' ' + a.weekdayText + ' · ' + a.timeText, 'f-hero__kicker'),
        el('h1.f-hero__title', { text: a.title }),
        el('div.f-hero__meta', { text: a.difficultyText + ' · 领队 ' + a.leader }))));
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
    el('div.f-narr__day',
      el('div.f-narr__d', { text: stamp(a.dateText, g.day).md + ' · ' + stamp(a.dateText, g.day).w }),
      el('div.f-narr__dn', { text: g.day === 0 ? '夜段' : '日段' })),
    ...g.items.map((it) => el('div.f-narr__item',
      el('div.f-narr__no', { text: no2(it.no) }),
      el('div.f-narr__time', { text: it.t }),
      el('div.f-narr__text', { text: it.text })))));
}

/* ---- 海拔剖面（D 的工具件 × 纸滤）----
   横轴 = 行程节点（8 个），纵轴 = 示意海拔。登顶值取行程正文的「登顶 2434 米」；
   其余节点按「起点 → 陡坡 → 登顶 → 原路下撤」的单调形状铺开。
   这是示意剖面，不是实测轨迹 —— 页面脚注明说，勿当里程数据用。 */
const PROFILE_RATIO = [0.31, 0.42, 0.47, 0.81, 1, 0.99, 0.42, 0.31];

function profileModel(a) {
  const hit = a.itinerary.map((i) => /登顶\s*([\d,]+)\s*米/.exec(i[1])).find(Boolean);
  const summit = hit ? Number(hit[1].replace(/,/g, '')) : a.ascentM;
  const pts = PROFILE_RATIO.map((k, i) => ({
    no: i + 1,
    m: Math.round(summit * k),
    t: a.itinerary[i] ? a.itinerary[i][0] : '',
    text: a.itinerary[i] ? a.itinerary[i][1] : '',
  }));
  const summitAt = pts.reduce((best, p, i) => (p.m > pts[best].m ? i : best), 0);
  return { pts, summit, summitAt };
}

function profileSVG(model) {
  const W = 342, H = 96, T = 16, B = 10, R = 6;
  const n = model.pts.length;
  const lo = Math.min(...model.pts.map((p) => p.m)) - 160;
  const hi = model.summit + 90;
  const plotW = W - R;
  const px = (i) => (plotW * i) / (n - 1);
  const py = (m) => T + (H - T - B) * (1 - (m - lo) / (hi - lo || 1));
  let s = '';

  /* 网格：低 / 中 / 高三条发丝线 */
  [lo + 160, (lo + hi) / 2, hi].forEach((m) => {
    s += '<line x1="0" y1="' + py(m).toFixed(1) + '" x2="' + plotW + '" y2="' + py(m).toFixed(1)
      + '" stroke="var(--lab-border)" stroke-width="1"/>';
  });

  const line = model.pts.map((p, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.m).toFixed(1)).join('');
  s += '<path d="' + line + 'L' + plotW + ' ' + (H - B) + 'L0 ' + (H - B) + 'Z" fill="var(--lab-brand)" fill-opacity=".08"/>';
  s += '<line x1="0" y1="' + (H - B) + '" x2="' + plotW + '" y2="' + (H - B) + '" stroke="var(--lab-border-strong)" stroke-width="1"/>';
  s += '<path d="' + line + '" fill="none" stroke="var(--lab-brand)" stroke-width="1.5" stroke-linejoin="round"/>';

  /* 节点刻度 */
  model.pts.forEach((p, i) => {
    s += '<line x1="' + px(i).toFixed(1) + '" y1="' + py(p.m).toFixed(1) + '" x2="' + px(i).toFixed(1)
      + '" y2="' + (H - B) + '" stroke="var(--lab-border)" stroke-width="1"/>';
    s += '<circle cx="' + px(i).toFixed(1) + '" cy="' + py(p.m).toFixed(1) + '" r="2" fill="var(--lab-brand)"/>';
  });

  /* 登顶锚点：2px 墨色刻线 + 海拔 + 时刻（D 的数据勾稽：与 04:50 登顶节点一致）
     C1/V2-1：它是「读数」不是「异常」—— 与游标、YOU 锚点同归墨色系，锈色不再进入剖面图 */
  const si = model.summitAt;
  const sx = px(si), sy = py(model.pts[si].m);
  s += '<line x1="' + sx.toFixed(1) + '" y1="' + (T - 8) + '" x2="' + sx.toFixed(1) + '" y2="' + sy.toFixed(1)
    + '" stroke="var(--lab-border-strong)" stroke-width="2"/>';
  s += '<text x="' + (sx - 3).toFixed(1) + '" y="' + (T - 1) + '" font-size="10" text-anchor="end" fill="var(--lab-text-1)" font-family="inherit">'
    + model.pts[si].m + ' m · ' + model.pts[si].t + '</text>';

  /* YOU 锚点：出发节点（D 的锚点方法，纸滤成品牌实方块 + 文字） */
  s += '<rect x="' + (px(0) - 3.5).toFixed(1) + '" y="' + (py(model.pts[0].m) - 3.5).toFixed(1)
    + '" width="7" height="7" fill="var(--lab-brand)"/>';
  s += '<text x="' + (px(0) + 7).toFixed(1) + '" y="' + (py(model.pts[0].m) + 4).toFixed(1)
    + '" font-size="10" fill="var(--lab-brand)" font-family="inherit">你 · ' + model.pts[0].t + ' 出发</text>';

  /* 纵轴刻度（底 / 顶） */
  s += '<text x="0" y="' + (H - 1) + '" font-size="10" fill="var(--lab-text-3)" font-family="inherit">'
    + lo.toFixed(0) + '</text>';
  s += '<text x="' + plotW + '" y="' + (H - 1) + '" font-size="10" text-anchor="end" fill="var(--lab-text-3)" font-family="inherit">'
    + hi.toFixed(0) + ' m</text>';

  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" aria-hidden="true">' + s + '</svg>';
}

/** 同行人台账列宽：序号 / 成员 / 角色 / 分车 / 座位 */
const MATE_COLS = '2.1rem 1fr .78fr .9fr 2.6rem';

function detailSkeleton() {
  return frag(
    el('div.f-bleed', skel(244, '100%')),
    el('div.f-zone.f-zone--oat', { style: { marginTop: 'var(--lab-space-4)' } },
      skel(11, '40%'), el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(25, '88%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '72%')),
      el('div.f-quad', { style: { marginTop: 'var(--lab-space-4)' } },
        el('div.f-quad__cell', skel(11, '40%'), skel(18, '70%')),
        el('div.f-quad__cell', skel(11, '40%'), skel(18, '70%')),
        el('div.f-quad__cell', skel(11, '40%'), skel(18, '70%')),
        el('div.f-quad__cell', skel(11, '40%'), skel(18, '70%')))),
    el('div.f-zone.f-zone--oat', { style: { marginTop: 'var(--lab-space-5)' } },
      skel(96, '100%'),
      ...Array.from({ length: 5 }, () => el('div', { style: { marginTop: 'var(--lab-space-3)' } },
        skel(13, '16%'), el('div', { style: { marginTop: 'var(--lab-space-1)' } }, skel(15, '96%'))))),
    el('div.f-zone', { style: { marginTop: 'var(--lab-space-5)' } },
      ...Array.from({ length: 6 }, () => el('div.f-spec', { style: { marginTop: 'var(--lab-space-3)' } },
        skel(11, '40%'), skel(18, '50%')))));
}

export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.f-detail');
  const locked = flag === 'disabled';

  if (flag === 'empty') {
    const gone = D.activities.find((a) => a.statusKey === 'cancelled') || D.featured;
    page.appendChild(detailHero(gone, { void: true }));
    page.appendChild(el('div.f-statusline',
      word(gone.status, STATUS_KIND[gone.statusKey]),
      el('div.f-statusline__t', { text: gone.dateText + ' ' + gone.weekdayText })));
    page.appendChild(zone(1, '路线说明', gone.city, 'oat', [
      el('h2.f-sheet__title', { text: gone.title }),
      el('div.f-sheet__sub', { text: gone.routeName + ' · ' + gone.city }),
      el('p.f-lede', { text: gone.lede }),
      subhead('费用与约定'),
      el('p.f-body', { text: gone.feeNote }),
    ]));
    page.appendChild(zone(2, '报名状态', gone.status, 'oat', [
      el('div.f-state.f-state--fill',
        stateBlock('info', '活动已取消', '这条路线不再接受报名，已报名的成员会收到通知。',
          '去看看其他活动', () => ui.go('discover'), 'off')),
    ]));
    page.appendChild(el('div.f-bar',
      el('button.btn.btn--primary.f-bar__main', { type: 'button', text: '报名已关闭', disabled: true }),
      el('button.f-share', { type: 'button', text: '分享', onclick: () => ui.toast('已生成分享卡片（演示）') })));
    page.appendChild(foot(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(zone(1, '概览', '未载入', null, [
      el('div.f-state.f-state--fill',
        stateBlock(null, '加载失败，请检查网络', '这条活动的安排没能取回来。',
          '重试', () => ui.toast('已重试（演示）'), 'error')),
    ]));
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
  const model = profileModel(a);

  page.appendChild(detailHero(a));

  /* --- 工位 01 概览 --- */
  page.appendChild(zone(1, '概览', a.difficultyText + ' · 领队 ' + a.leader, null, [
    el('div.f-statusline',
      word(a.status, STATUS_KIND[a.statusKey]),
      el('div.f-statusline__t',
        el('span.f-statusline__n', { text: '剩 ' + left + ' 位' }))),
    el('h2.f-sheet__title', { text: a.routeName }),
    el('div.f-sheet__sub', { text: a.city }),
    el('p.f-lede', { text: a.lede }),
    el('div.f-quad',
      quad('距离', a.distanceKm + '', 'km'),
      quad('爬升', '↑ ' + fmt(a.ascentM), 'm'),
      quad('名额', a.signedCount + ' / ' + a.seatsTotal),
      quad('截止', md(a.deadlineText), hhmm(a.deadlineText), 'is-narrow')),
    countdown('距报名截止', at(a.deadlineText, hhmm(a.deadlineText)),
      '报名通道关闭时刻'),
  ]));

  /* --- 工位 02 行程：剖面 + 编号叙事 --- */
  page.appendChild(zone(2, '行程', fmt(a.itinerary.length) + ' 个节点 · 示意剖面', 'oat', [
    el('div.f-profile',
      el('div.f-profile__plot', { html: profileSVG(model) }),
      el('div.f-profile__nodes',
        ...model.pts.map((p, i) => el('div.f-profile__node'
          + (i === model.summitAt ? '.is-summit' : '')
          + (i === 0 ? '.is-you' : ''),
        { text: no2(p.no) })))),
    el('div.f-zone__caption', {
      text: '横轴为行程节点；纵轴为示意海拔，登顶 ' + fmt(model.summit) + ' m 与节点 ' + no2(model.summitAt + 1)
        + '（' + model.pts[model.summitAt].t + ' 登顶）一致。示意剖面，非实测轨迹。',
    }),
    el('div.f-narr', ...narrGroups(a)),
  ], true));

  /* --- 工位 03 集合与时间 --- */
  page.appendChild(zone(3, '集合与时间', a.city, null, [
    el('div.f-specs',
      spec('集合点', a.meetingPoint),
      spec('集合时间', a.meetingTime, '', a.dateText + ' ' + a.weekdayText),
      spec('出发时间', a.timeText),
      spec('领队', a.leader),
      spec('难度', a.difficultyText),
      spec('城市', a.city)),
  ]));

  /* --- 工位 04 装备与提醒 --- */
  page.appendChild(zone(4, '装备与提醒', fmt(a.requirements.length) + ' 条', 'oat', [
    el('div.f-gear',
      ...a.requirements.map((r, i) => el('div.f-gear__item',
        el('div.f-gear__no', { text: no2(i + 1) }),
        el('div.f-gear__text', { text: r })))),
  ]));

  /* --- 工位 05 费用与约定 --- */
  page.appendChild(zone(5, '费用与约定', '包车 AA', null, [
    el('p.f-body', { text: a.feeNote }),
  ]));

  const mateLedger = ledger(MATE_COLS);
  mateLedger.appendChild(el('div.f-ledger__head',
    el('div.f-cell', { text: '序' }),
    el('div.f-cell', { text: '成员' }),
    el('div.f-cell', { text: '角色' }),
    el('div.f-cell', { text: '分车' }),
    el('div.f-cell.f-cell--r', { text: '座位' })));
  crews.forEach((m, i) => mateLedger.appendChild(el('div.f-ledger__row'
    + (m.name === D.viewer.name ? '.is-you' : ''), null,
  el('div.f-cell.f-cell--no', { text: no2(i + 1) }),
    el('div.f-cell.f-cell--name', {
      html: m.name + (m.name === D.viewer.name ? '<span class="f-you">你</span>' : ''),
    }),
    el('div.f-cell', { text: m.role }),
    el('div.f-cell.f-cell--ellipsis', { text: m.vehicleId ? (D.vehicles.find((v) => v.id === m.vehicleId) || {}).label : '待定' }),
    el('div.f-cell.f-cell--n', {
      html: (m.seatNo === 'driver' ? '司机' : m.seatNo == null ? '—' : String(m.seatNo)),
    }))));

  /* --- 工位 06 同行人 --- */
  page.appendChild(zone(6, '同行人', fmt(mates.length) + ' 位 · 领队与车长 ' + fmt(crews.length), 'oat', [
    el('div.f-counts',
      countCell(mates.length, '成员'),
      countCell(approved.length, '已通过'),
      countCell(checked.length, '已签到'),
      countCell(mates.filter((m) => m.audit === '待审核').length, '待审核'),
      countCell(mates.filter((m) => m.audit === '候补').length, '候补'),
      countCell(approved.filter((m) => !m.vehicleId).length, '待安排车辆')),
    mateLedger,
    actions('明细与签到在协作页逐人可点，这里只列领队与车长。',
      link('查看全部 ' + fmt(mates.length) + ' 位成员', () => ui.go('collab'))),
  ]));

  /* --- 报尾：唯一的主操作（分享为文字链）。链：加入活动 → 提交中… → 已报名 · 待审核 --- */
  const cta = el('button.btn.btn--primary.f-bar__main', {
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
    page.appendChild(el('div.f-note-line.f-note-line--accent',
      el('div.f-note-line__k', { text: '报名已截止' }),
      el('span', { text: '本次活动的报名通道已于 ' + a.deadlineText + ' 关闭。' })));
  }
  page.appendChild(el('div.f-bar',
    cta,
    el('button.f-share', {
      type: 'button', disabled: locked,
      onclick: () => ui.toast('已生成分享卡片（演示）'),
    }, icon('share'), el('span', { text: '分享' }))));
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   3. 协作 — 工位调度台
   ========================================================= */

const TABS = [
  { key: 'over', label: '总览' },
  { key: 'list', label: '名单' },
  { key: 'car', label: '分车' },
  { key: 'site', label: '现场' },
];

/** 名单台账列宽：序 / 成员 / 角色 / 分车 / 座位 / 签到 */
const ROSTER_COLS = '2.1rem 1fr .78fr .9fr 2.6rem 3rem';

function collabSkeleton() {
  return frag(
    el('div', skel(11, '56%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '70%')),
    el('div.f-counts', { style: { marginTop: 'var(--lab-space-5)' } },
      ...Array.from({ length: 6 }, () => el('div.f-counts__cell', skel(18, '50%'), skel(11, '70%')))),
    el('div.f-zone.f-zone--oat', { style: { marginTop: 'var(--lab-space-5)' } },
      skel(14, '40%'),
      ...Array.from({ length: 7 }, () => el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(56, '100%'))),
      el('div', { style: { marginTop: 'var(--lab-space-5)' } }, skel(72, '100%'))));
}

export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.f-collab');
  const locked = flag === 'disabled';
  const a = D.featured;
  const base = D.collab;

  if (flag === 'empty') {
    page.appendChild(collabHead(a, '还没有人签到', '集合中 · 集合点 ' + a.meetingPoint + ' · 出发 ' + a.meetingTime));
    page.appendChild(zone(1, '现场计数', '未载入', null, [
      el('div.f-state.f-state--fill',
        stateBlock('users', '还没有成员', '这条活动发布后，通过审核的成员会出现在这里。',
          '去看看其他活动', () => ui.go('discover'), 'off')),
    ]));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    /* E5：状态句与错误句拆开 —— 抬头只讲阶段，故障交给状态块 */
    page.appendChild(collabHead(a, '协作面板打不开', '集合中 · 出发 ' + a.meetingTime));
    page.appendChild(zone(1, '现场计数', '未载入', null, [
      el('div.f-state.f-state--fill',
        stateBlock(null, '加载失败，请检查网络', '协作面板没能取回来，页面上的数据需要重新加载。',
          '重试', () => ui.toast('已重试（演示）'), 'error')),
    ]));
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
    page.appendChild(el('div.f-note-line',
      el('div.f-note-line__k', { text: '只读' }),
      el('span', { text: '签到已由领队锁定，现场以纸面名单为准。' })));
  }

  const seg = el('div.seg.f-seg');
  const body = el('div.f-tabbody');
  const countsRow = el('div.f-counts');
  const arrived = el('div.f-tri__v.num');
  const arrivedFill = el('i.f-meter__fill');
  const headline = page.querySelector('.f-headline');
  const needNote = el('span.f-actions__note');
  const tri = el('div.f-tri');
  const whoBox = el('div.f-who');

  function paintSeg() {
    seg.innerHTML = '';
    const s = tally(roster);
    const n = {
      over: s.total,
      list: s.total,
      car: D.vehicles.length,
      site: s.checked,
    };
    TABS.forEach((t) => {
      seg.appendChild(el('button.seg__item' + (t.key === tab ? '.is-active' : ''), {
        type: 'button', onclick: () => { tab = t.key; paintSeg(); paintTab(); },
      }, el('span', { text: t.label }), el('span.n', { text: String(n[t.key]) })));
    });
  }

  function paintCounts() {
    const s = tally(roster);
    countsRow.innerHTML = '';
    [
      ['成员', s.total, ''],
      ['已通过', s.approved, ''],
      ['已签到', s.checked, ''],
      ['待审核', s.pendingAudit, ''],
      ['候补', s.waitlist, ''],
      ['待安排车辆', s.noVehicle, s.noVehicle ? 'is-hi' : ''],
    ].forEach(([k, v, cls]) => countsRow.appendChild(countCell(v, k, cls)));
    if (headline) headline.textContent = s.unchecked ? s.unchecked + ' 人未签到' : '全员已签到';
    needNote.textContent = '勾选成员即完成签到。';
    /* E1：人先于数 —— 工位 01 首行先露领队与车长（头像 + 姓名 + 签到态） */
    whoBox.innerHTML = '';
    roster.filter((m) => m.role !== '成员').forEach((m) => {
      whoBox.appendChild(el('div.f-who__item',
        el('div.f-who__id', { text: m.name.slice(0, 1) }),
        el('div.f-who__name', { text: m.name }),
        icon(m.checked ? 'check-circle' : 'ring', { cls: 'f-who__mark' + (m.checked ? '' : ' is-off') })));
    });
    whoBox.appendChild(el('div.f-who__more', { text: '共 ' + roster.length + ' 位' }));
    if (zone2Meta) {
      zone2Meta.textContent = roster.length + ' 位 · ' + D.vehicles.length + ' 台车 · 现场 ' + s.checked;
    }
    if (arrived) {
      arrived.textContent = s.checked + ' / ' + s.approved;
      arrivedFill.style.width = (s.approved ? Math.round((s.checked / s.approved) * 100) : 0) + '%';
    }
  }

  /* E7：集合点独占整行，折行不再撑高另外两格 */
  tri.appendChild(el('div.f-tri__cell.f-tri__cell--wide',
    el('div.f-tri__k', { text: '集合点' }),
    el('div.f-tri__v.f-tri__v--wide', { text: a.meetingPoint })));
  tri.appendChild(el('div.f-tri__cell',
    el('div.f-tri__k', { text: '出发时间' }),
    el('div.f-tri__v.num', { text: a.meetingTime })));
  tri.appendChild(el('div.f-tri__cell',
    el('div.f-tri__k', { text: '到点人数' }),
    arrived,
    el('div.f-meter', arrivedFill)));

  page.appendChild(zone(1, '现场计数', base.phase, null, [
    whoBox,
    countdown('距出发集合', at(a.dateText, a.meetingTime), a.meetingTime + ' 出发 · 演示时钟 10/17 22:10'),
    tri,
    countsRow,
    actions(null,
      needNote,
      el('button.btn.btn--sm', {
        type: 'button', text: '一键全到', disabled: locked,
        onclick: () => {
          if (locked) return;
          roster.forEach((m) => {
            if (m.audit === '已通过' && !m.checked) { m.checked = true; m.checkedAt = '22:10'; }
          });
          ui.toast('已把通过审核的成员全部标记到场（演示）');
          paintCounts();
          paintSeg();
          paintTab();
        },
      })),
  ]));

  /* ---- 成员行（总览 / 现场共用） ---- */
  const carLabel = (id) => (D.vehicles.find((v) => v.id === id) || {}).label || '待安排车辆';

  function memberRow(m, checkable, idx) {
    const toggle = el('button.f-toggle' + (m.checked ? '.is-on' : '') + (locked ? '.is-disabled' : ''), {
      type: 'button', 'aria-label': m.name + ' 签到',
      onclick: () => {
        if (locked) return;
        m.checked = !m.checked;
        m.checkedAt = m.checked ? '22:10' : undefined;
        ui.toast(m.name + (m.checked ? ' 已签到 · 22:10' : ' 已撤销签到') + '（演示）');
        paintCounts();
        paintSeg();
        paintTab();
      },
    }, icon(m.checked ? 'check-circle' : 'ring'));

    return el('div.f-mrow',
      el('div.f-cell.f-cell--no', { text: no2(idx + 1) }),
      el('div.f-mrow__id', { text: m.name.slice(0, 1) }),
      el('div.f-mrow__main',
        el('div.f-mrow__name', {
          html: m.name + ' · ' + m.role
            + (m.name === D.viewer.name ? '<span class="you">你</span>' : ''),
        }),
        el('div.f-mrow__meta', {
          text: m.tripMode + ' · ' + (m.vehicleId ? carLabel(m.vehicleId) + ' ' + seatText(m) : '待安排车辆')
            + (m.checked && m.checkedAt ? ' · 已签到 ' + m.checkedAt : ''),
        })),
      checkable
        ? toggle
        : word(m.audit, AUDIT_KIND[m.audit]));
  }

  /* ---- 名单台账（可扫读：列头 + 右对齐数字列） ---- */
  function rosterLedger(list) {
    const box = ledger(ROSTER_COLS);
    box.appendChild(el('div.f-ledger__head',
      el('div.f-cell', { text: '序' }),
      el('div.f-cell', { text: '成员' }),
      el('div.f-cell', { text: '角色' }),
      el('div.f-cell', { text: '分车' }),
      el('div.f-cell.f-cell--r', { text: '座位' }),
      el('div.f-cell.f-cell--r', { text: '签到' })));
    list.forEach((m, i) => {
      const canCheck = m.audit === '已通过';
      const checkCell = canCheck
        ? el('div.f-cell.f-cell--r', toggleFor(m))
        : el('div.f-cell.f-cell--r', word(m.audit, AUDIT_KIND[m.audit]));
      box.appendChild(el('div.f-ledger__row'
        + (m.name === D.viewer.name ? '.is-you' : '')
        + (locked && canCheck ? '.is-locked' : ''), null,
        el('div.f-cell.f-cell--no', { text: no2(i + 1) }),
        el('div.f-cell.f-cell--name', {
          html: m.name + (m.name === D.viewer.name ? '<span class="f-you">你</span>' : ''),
        }),
        el('div.f-cell', { text: m.role }),
        el('div.f-cell.f-cell--ellipsis', { text: m.vehicleId ? carLabel(m.vehicleId) : '待定' }),
        el('div.f-cell.f-cell--n', {
          text: m.seatNo === 'driver' ? '司机' : m.seatNo == null ? '—' : String(m.seatNo),
        }),
        checkCell));
    });
    return box;
  }

  /** 名单台账里的签到格：一个 32px 的方形勾选按钮（不撑行高） */
  function toggleFor(m) {
    return el('button.f-toggle.f-toggle--cell' + (m.checked ? '.is-on' : '') + (locked ? '.is-disabled' : ''), {
      type: 'button', 'aria-label': m.name + ' 签到',
      onclick: () => {
        if (locked) return;
        m.checked = !m.checked;
        m.checkedAt = m.checked ? '22:10' : undefined;
        ui.toast(m.name + (m.checked ? ' 已签到 · 22:10' : ' 已撤销签到') + '（演示）');
        paintCounts();
        paintSeg();
        paintTab();
      },
    }, icon(m.checked ? 'check-circle' : 'ring'));
  }

  /* ---- 分栏内容 ---- */
  function paintTab() {
    body.innerHTML = '';
    const s = tally(roster);

    if (tab === 'over') {
      body.appendChild(subhead('集合点', a.weekdayText + ' ' + a.dateText));
      body.appendChild(el('div.f-specs',
        spec('集合点', a.meetingPoint),
        spec('集合时间', a.meetingTime),
        spec('领队车长', fmt(roster.filter((m) => m.role !== '成员').length) + ' 位', '', '领队 ' + a.leader)));

      body.appendChild(subhead('成员', '显示前 5 位 · 共 ' + roster.length + ' 位'));
      body.appendChild(el('div.f-mlist',
        ...roster.slice(0, 5).map((m, i) => memberRow(m, true, i))));
      body.appendChild(actions(null,
        link('查看全部 ' + roster.length + ' 位成员', () => { tab = 'list'; paintSeg(); paintTab(); })));

      body.appendChild(subhead('车辆', fmt(D.vehicles.length) + ' 台 · 每车 4 座'));
      body.appendChild(el('div.f-specs',
        ...D.vehicles.map((v) => {
          const taken = v.seats.filter(Boolean).length;
          return spec(v.label, v.plate, '',
            '司机 ' + v.driver + ' · ' + taken + '/' + v.capacity + ' 座 · '
              + (taken >= v.capacity ? '满员' : '有空位'));
        })));
      body.appendChild(actions(null,
        link('查看座位安排', () => { tab = 'car'; paintSeg(); paintTab(); })));
    }

    if (tab === 'list') {
      body.appendChild(subhead('名单', '领队与车长优先 · 共 ' + roster.length + ' 位'));
      body.appendChild(rosterLedger(roster.slice().sort((x, y) => (x.role === '成员') - (y.role === '成员'))));
      body.appendChild(el('div.f-note-line',
        el('div.f-note-line__k', { text: '口径' }),
        el('span', { text: '座位列为右对齐数字；司机标「司机」，未分配车辆标「—」。' })));
    }

    if (tab === 'car') {
      body.appendChild(subhead('分车', '每车 4 座 + 司机'));
      body.appendChild(el('div.f-cars',
        ...D.vehicles.map((v) => {
          const taken = v.seats.filter(Boolean).length;
          return el('div.f-car',
            el('div.f-car__head',
              el('div.f-car__name', { text: v.label }),
              el('div.f-car__plate', { text: v.plate }),
              el('div.f-car__load' + (taken >= v.capacity ? '.is-full' : ''), {
                html: taken + ' / ' + v.capacity + ' <span class="u">座</span> · ' + (taken >= v.capacity ? '满员' : '有空位'),
              })),
            el('div.seat-grid.f-seats',
              el('div.seat.seat--driver.f-seat--driver',
                el('span', { text: '司机 ' + v.driver }),
                el('small', { text: v.plate })),
              ...v.seats.map((name, i) => {
                const col = { style: { gridColumn: i < 2 ? String(i + 1) : String(i + 3) } };
                if (!name) return el('div.seat.seat--free', col, el('span', { text: '空位' }), el('small', { text: (i + 1) + ' 号' }));
                const m = roster.find((x) => x.name === name && x.vehicleId === v.id);
                const mine = name === D.viewer.name;
                return el('div.seat.seat--taken' + (mine ? '.seat--you' : ''), col,
                  el('span', { text: name }),
                  el('small', { text: (m ? seatText(m) : (i + 1) + ' 号') + (mine ? ' · 你' : '') }));
              })));
        })));
      body.appendChild(el('div.f-note-line',
        el('div.f-note-line__k', { text: '空位' }),
        el('span', { text: '2 号车与 4 号车仍可安排拼车，点成员行可在名单里调整。' })));
      body.appendChild(actions('演示操作，不会真实调整座位。',
        el('button.btn.btn--sm', {
          type: 'button', text: '自动排座', disabled: locked,
          onclick: () => ui.toast('已按待定成员重排座位（演示）'),
        })));
    }

    if (tab === 'site') {
      const arrivedList = roster.filter((m) => m.audit === '已通过' && m.checked);
      const waitList = roster.filter((m) => m.audit === '已通过' && !m.checked);
      body.appendChild(subhead('现场签到',
        arrivedList.length + ' / ' + (arrivedList.length + waitList.length) + ' · 待到 ' + waitList.length));
      if (!waitList.length && !arrivedList.length) {
        body.appendChild(el('div.f-state',
          stateBlock('users', '现场还没有人', '成员签到后会在这里按名单顺序出现。', null, null, 'off')));
      } else {
        body.appendChild(el('div.f-mlist',
          ...waitList.map((m, i) => memberRow(m, true, i)),
          ...arrivedList.map((m, i) => memberRow(m, true, waitList.length + i))));
        body.appendChild(actions(null,
          el('button.btn.btn--sm', {
            type: 'button', text: '撤销全部', disabled: locked || !arrivedList.length,
            onclick: () => {
              if (locked) return;
              roster.forEach((m) => { if (m.checked) { m.checked = false; m.checkedAt = undefined; } });
              ui.toast('已撤销全部签到（演示）');
              paintCounts();
              paintSeg();
              paintTab();
            },
          })));
      }
    }

    /* 工位 03：下一步 —— 编者按式 callout + 唯一主操作（原位重绘，不重复堆叠） */
    paintNext();
  }

  /** 下一步工位：每次签到 / 切栏都原位重建，保证页面里永远只有一个工位 03 */
  function paintNext() {
    const s = tally(roster);
    const nextText = departureSent
      ? '出发确认已发出，等待 4 位车长回复（演示）'
      : base.nextStep;
    const node = zone(3, '下一步', departureSent ? '已发起' : '待发起', null, [
      el('div.f-callout',
        kick(base.phase + ' · 现场'),
        el('div.f-callout__text', { text: nextText }),
        el('div.f-callout__specs',
          spec('待到', String(s.unchecked), '人',
            '占通过人数 ' + Math.round((s.unchecked / Math.max(1, s.approved)) * 100) + '%'),
          spec('未排车', String(s.noVehicle), '人'),
          spec('已签到', String(s.checked), '人', '更新于 22:10')),
        el('button.btn.btn--primary.f-bar__main.f-callout__cta' + (departureSent ? '.is-sent' : ''), {
          type: 'button', disabled: locked || departureSent,
          onclick: () => {
            if (locked || departureSent) return;
            departureSent = true;
            ui.toast('出发确认已发起，等待 4 位车长回复（演示）');
            paintNext();
          },
        }, el('span', { text: departureSent ? '确认已发起' : '发起出发确认' }), icon('arrow-right'))),
      actions('演示数据，不会真的发通知。',
        link('回到发现页', () => ui.go('discover'))),
    ]);
    node.classList.add('f-zone--next');
    const old = page.querySelector('.f-zone--next');
    if (old) page.replaceChild(node, old);
    else page.appendChild(node);
  }

  paintSeg();
  /* C3：卡头 meta 由首次 tally 播种、此后随签到刷新（原先恒为空串，死代码把渲染挡死） */
  const zone2 = zone(2, '名单与分车',
    roster.length + ' 位 · ' + D.vehicles.length + ' 台车 · 现场 ' + s0.checked, 'oat', [seg, body], true);
  const zone2Meta = zone2.querySelector('.f-zone__meta');
  page.appendChild(zone2);
  paintCounts();
  paintTab();
  page.appendChild(foot(D));
  return page;
}

/** 协作页顶部：状态句（大标题）+ 阶段眉题 */
function collabHead(a, headlineText, sub) {
  return el('header.f-chead',
    kick(a.title + ' · ' + a.dateText + ' ' + a.weekdayText),
    el('h1.f-headline', { text: headlineText }),
    el('div.f-chead__sub', { text: sub }));
}

/* =========================================================
   4. 天气 — 气象单
   ========================================================= */

const SPARK = { w: 342, h: 112, right: 26, top: 12, bottom: 22 };

/** 从数据里取关键窗口（云海窗口 / 降雨）——不写死下标 */
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

/** 由该小时的真实数值推导判定（与台账、读数共用同一套口径） */
function verdictOf(d) {
  if (d.precip >= 60) return '不宜停留';
  if (d.wind >= 5) return '风偏大';
  if (d.cloud <= 40 && d.precip < 30) return '较通透';
  if (d.cloud >= 80) return '云厚';
  return '条件一般';
}

/** 关键窗口上缘短条的墨色（C1）：云海是机会 → 品牌绿；降雨是警示 → 锈色 */
const bandInk = (note) => (note === '云海窗口' ? 'var(--lab-brand)' : 'var(--lab-accent)');

/** V2-4③：注记色样沿用图例 sw 语汇，但形状贴着图上真实编码 —— 一条 3px 的上缘短条 */
const bandSw = (note) => 'f-legend__sw--band ' + (note === '云海窗口' ? 'is-cloud' : 'is-rain');

/** 曲线 + 降水柱 + 夜间底纹 + 关键窗口顶条 + 逐日分隔（D 的图形纪律，纸滤） */
function sparkSVG(hours, lo, hi, bands) {
  const W = SPARK.w, H = SPARK.h, R = SPARK.right, T = SPARK.top, B = SPARK.bottom;
  const n = hours.length;
  const plotW = W - R;
  const px = (i) => (plotW * i) / (n - 1);
  const py = (t) => T + (H - T - B) * (1 - (t - lo) / ((hi - lo) || 1));
  let s = '';

  /* 夜间底纹：连续的夜间小时合并成一段，纸色调 */
  let run = null;
  hours.forEach((d, i) => {
    if (d.night && run === null) run = i;
    if ((!d.night || i === n - 1) && run !== null) {
      const to = d.night ? i : i - 1;
      if (to > run) {
        const x = px(run) - plotW / (n - 1) / 2;
        const w = px(to) - px(run) + plotW / (n - 1);
        s += '<rect x="' + x.toFixed(1) + '" y="' + T + '" width="' + w.toFixed(1) + '" height="'
          + (H - T - B).toFixed(1) + '" fill="var(--lab-surface-2)" fill-opacity=".55"/>';
      }
      run = null;
    }
  });

  /* 网格线（低 / 中 / 高） */
  [lo, (lo + hi) / 2, hi].forEach((t) => {
    s += '<line x1="0" y1="' + py(t).toFixed(1) + '" x2="' + plotW + '" y2="' + py(t).toFixed(1)
      + '" stroke="var(--lab-border)" stroke-width="1"/>';
  });

  /* 逐日分隔（每 00:00 一条） */
  hours.forEach((d, i) => {
    if (d.t.getHours() !== 0) return;
    s += '<line x1="' + px(i).toFixed(1) + '" y1="' + T + '" x2="' + px(i).toFixed(1) + '" y2="'
      + (H - B) + '" stroke="var(--lab-border)" stroke-width="1"/>';
  });

  /* 降水概率柱 */
  hours.forEach((d, i) => {
    const bh = Math.max(1, (d.precip / 100) * 24);
    s += '<rect x="' + (px(i) - 1.6).toFixed(1) + '" y="' + (H - B - bh).toFixed(1)
      + '" width="3.2" height="' + bh.toFixed(1) + '" fill="var(--lab-info)" fill-opacity=".34"/>';
  });

  /* 温度曲线 */
  const path = hours.map((d, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(d.temp).toFixed(1)).join('');
  s += '<path d="' + path + '" fill="none" stroke="var(--lab-brand)" stroke-width="1.5" stroke-linejoin="round"/>';

  /* 关键窗口：顶条（陶土）——比半透明色带更容易在手机上分辨 */
  bands.forEach((b) => {
    const x = px(b.from) - plotW / (n - 1) / 2;
    const w = px(b.to) - px(b.from) + plotW / (n - 1);
    s += '<rect x="' + x.toFixed(1) + '" y="' + T + '" width="' + w.toFixed(1) + '" height="3" fill="' + bandInk(b.note) + '"/>';
  });

  /* 轴：右端上下值 + 6 小时刻度 */
  s += '<text x="' + (plotW + 4) + '" y="' + (py(hi) + 3).toFixed(1) + '" font-size="10" fill="var(--lab-text-3)" font-family="inherit">'
    + hi.toFixed(1) + '</text>';
  s += '<text x="' + (plotW + 4) + '" y="' + (py((lo + hi) / 2) + 3).toFixed(1) + '" font-size="10" fill="var(--lab-text-3)" font-family="inherit">'
    + ((lo + hi) / 2).toFixed(1) + '</text>';
  s += '<text x="' + (plotW + 4) + '" y="' + (py(lo) + 3).toFixed(1) + '" font-size="10" fill="var(--lab-text-3)" font-family="inherit">'
    + lo.toFixed(1) + '</text>';
  hours.forEach((d, i) => {
    if (d.t.getHours() % 6) return;
    const label = d.t.getHours() === 0
      ? (d.t.getMonth() + 1) + '/' + d.t.getDate()
      : ('0' + d.t.getHours()).slice(-2) + ':00';
    s += '<text x="' + px(i).toFixed(1) + '" y="' + (H - 6) + '" font-size="10" text-anchor="middle" fill="var(--lab-text-3)" font-family="inherit">'
      + label + '</text>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" aria-hidden="true">' + s + '</svg>';
}

/** 数值格：「云海 55%」「风 3 m/s」拆成数字 + 单位，数字右对齐成一列 */
function measureCell(raw) {
  const m = /^(\D*?)([\d.]+)(\D*)$/.exec(String(raw).trim());
  if (!m) return el('div.f-cell', { text: String(raw) });
  return el('div.f-cell.f-cell--n',
    el('span', { text: m[2] }),
    m[3] ? el('span.f-cell__u', { text: m[3].trim() }) : null);
}

/** 站点规格网格已并回单列台账（A1）：两列会把三段式规格行压成逐字折行 */

function weatherSkeleton() {
  return frag(
    el('div', skel(11, '72%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '100%')),
    el('div.f-zone.f-zone--oat', { style: { marginTop: 'var(--lab-space-5)' } },
      skel(112, '100%'),
      el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(56, '100%'))),
    el('div.f-zone', { style: { marginTop: 'var(--lab-space-5)' } },
      ...Array.from({ length: 8 }, () => el('div.f-ledger__row', skel(13, '90%')))));
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.f-weather');
  const { meta, hours } = D.weather;
  const locked = flag === 'disabled';
  /* V2-7：脚注首词已是「演示数据」，来源行再起一次「演示数据」就是同一句话说两遍；
     去掉这个重复前缀，只留气象口径本身（非真实气象服务），信息不丢。 */
  const weatherSource = String(meta.source).replace(/^演示数据\s*·\s*/, '');

  if (flag === 'empty') {
    page.appendChild(zone(1, '站位规格', '未载入', null, [
      el('div.f-state.f-state--fill',
        stateBlock('cloud', '数据缺失', '这条路线暂时没有关联的气象站点，出发前请以现场实况为准。',
          '重试', () => ui.toast('已重试（演示）'), 'quiet')),
    ]));
    page.appendChild(el('div.f-note-line',
      el('div.f-note-line__k', { text: '来源' }), el('span', { text: weatherSource })));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(zone(1, '站位规格', '未载入', null, [
      el('div.f-state.f-state--fill',
        stateBlock(null, '加载失败，请检查网络', '预报数据没能取回来。',
          '重试', () => ui.toast('已重试（演示）'), 'error')),
    ]));
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
  let sel = cloud ? Math.min(cloud.from + 2, cloud.to) : 0;

  page.appendChild(el('header.f-brief',
    el('div.f-brief__top',
      kick('天气简报 · ' + meta.location),
      el('div.f-caption.c3', { text: meta.updatedText })),
    el('h1.f-brief__headline', { text: meta.verdict }),
    el('p.f-brief__stand', { text: meta.detail })));

/* --- 工位 01：站位规格 --- */
  /* 出发窗口的绝对时刻：窗口文案形如「周日 06:00–10:00」，取其起点钟点挂在 10/19（演示历的周日） */
  const winStart = /(\d{1,2}):(\d{2})/.exec(win[0] || '');
  const winAt = winStart ? new Date(2025, 9, 19, Number(winStart[1]), Number(winStart[2])) : null;
  page.appendChild(zone(1, '站位规格', '48 小时读数', null, [
    el('div.f-specs',
      spec('出发窗口', win[0]),
      spec('站点海拔', fmt(meta.elevationM), 'm'),
      spec('48h 温度', lo.toFixed(1) + '–' + hi.toFixed(1), '℃', '最低 ' + hours[trough(temps)].label.slice(-5)),
      spec('48h 风', Math.min(...winds).toFixed(1) + '–' + Math.max(...winds).toFixed(1), 'm/s',
        '峰值 ' + hours[peak(winds)].label.slice(-5)),
      spec('48h 云量', Math.min(...clouds) + '–' + Math.max(...clouds), '%',
        '最低 ' + hours[trough(clouds)].label.slice(-5)),
      spec('48h 降水', Math.min(...precip) + '–' + Math.max(...precip), '%',
        '峰值 ' + hours[peak(precip)].label.slice(-5))),
    countdown('距出发窗口', winAt, winAt ? '10/19 ' + pad2(winAt.getHours()) + ':' + pad2(winAt.getMinutes()) + ' 起 · 登顶等候' : ''),
  ]));

  /* --- 工位 02：48 小时曲线 + 逐时读数 --- */
  /* D2：图例只留三条编码（折线 / 柱形 / 底纹），关键窗口降为图下一行注记，不再与图例同级 */
  const legend = el('div.f-legend',
    el('span.f-legend__item', el('i.f-legend__sw.f-legend__sw--temp'), el('span', { text: '折线 温度 ℃' })),
    el('span.f-legend__item', el('i.f-legend__sw.f-legend__sw--precip'), el('span', { text: '柱形 降水 %' })),
    el('span.f-legend__item', el('i.f-legend__sw.f-legend__sw--cloud'), el('span', { text: '底纹 夜间' })));

  const bandNote = el('div.f-legend__bands',
    ...bands.map((b) => el('span',
      el('i.f-legend__sw.' + bandSw(b.note)),
      el('span', {
        text: '上缘短条 ' + b.note + ' ' + hours[b.from].label.slice(0, 5) + ' ' + hours[b.from].label.slice(-5)
          + '–' + hours[b.to].label.slice(-5),
      }))));

  const marker = el('div.f-spark__marker');
  const dot = el('i.f-spark__dot');
  const tag = el('div.f-spark__tag');
  marker.appendChild(dot);
  marker.appendChild(tag);
  const rail = el('div.f-spark__rail' + (locked ? '.is-locked' : ''));
  const readout = el('div.f-readout');

  hours.forEach((d, i) => {
    rail.appendChild(el('button.f-spark__hit' + (i === sel ? '.is-on' : ''), {
      type: 'button', 'aria-label': d.label + ' ' + d.temp + ' 摄氏度',
      onclick: () => { if (locked) return; sel = i; paint(); },
    }));
  });

  page.appendChild(zone(2, '48 小时曲线', fmt(hours.length) + ' 条 · 点选任意小时', 'oat', [
    legend,
    el('div.f-spark',
      el('div.f-spark__plot', { html: sparkSVG(hours, lo, hi, bands) }),
      marker,
      rail),
    bandNote,
    /* V2-4②：术语与上方注记同步（顶条 → 上缘短条）。
       起句从「点选任意小时看读数」收成「点选读数」：换词后整行会多出 2 个汉字，
       375 / 390 上就折成两行、末字「日」单独挂一行（v1 为单行）；
       「任意小时」已由工位头 meta「48 条 · 点选任意小时」承担，这里不重复说。 */
    el('div.f-units', { text: '点选读数 · 上缘短条为关键窗口 · 竖线为 00:00 分日' }),
    readout,
  ], true));

  function paint() {
    const d = hours[sel];
    const xPct = (sel / (hours.length - 1)) * ((SPARK.w - SPARK.right) / SPARK.w) * 100;
    const yPct = ((SPARK.top + (SPARK.h - SPARK.top - SPARK.bottom)
      * (1 - (d.temp - lo) / ((hi - lo) || 1))) / SPARK.h) * 100;
    marker.style.left = xPct.toFixed(2) + '%';
    dot.style.top = yPct.toFixed(2) + '%';
    /* D3：读数贴在游标上，"点"与"数"从此不可能不一致 */
    tag.textContent = d.temp.toFixed(1) + '℃';
    tag.classList.toggle('is-left', xPct > 55);
    [...rail.children].forEach((n, i) => n.classList.toggle('is-on', i === sel));

    readout.innerHTML = '';
    readout.appendChild(el('div.f-readout__head',
      el('div.f-readout__time', { text: d.label }),
      el('div.f-readout__idx', { text: '第 ' + no2(sel + 1) + ' 时 / ' + no2(hours.length) })));
    const grid = el('div.f-readout__grid');
    [
      ['温度', d.temp.toFixed(1), '℃'],
      ['降水概率', String(d.precip), '%'],
      ['风速', d.wind.toFixed(1), 'm/s'],
      ['云量', String(d.cloud), '%'],
      ['判定', verdictOf(d), ''],
      ['关键时段', d.keyNote || '—', ''],
    ].forEach(([k, v, u]) => {
      grid.appendChild(el('div.f-readout__cell',
        el('div.f-readout__k', { text: k }),
        el('div.f-readout__v' + (k === '判定' || k === '关键时段' ? '.f-readout__v--word' : ''),
          el('span', { text: v }),
          u ? el('span.f-readout__u', { text: u }) : null)));
    });
    readout.appendChild(grid);
  }
  paint();

  /* --- 工位 03：逐时判定表（每 6 小时一行，全部来自 48h 数据） ---
   V2-6：六列在 375（最紧评审宽度）上的真实读数宽度是 64.1 / 48 / 31.8 / 44.8 / 31.8 / 48px
   （合计 268.5），旧的 1.28fr… 把温度/降水/风速/云量四列都压到内容宽以下 → 数字向左溢进槽位、
   相邻两列互相咬。列宽改为按「各列最长读数 + 余量」重新分配，配合 --hourly 的 4px 槽位，
   375 / 390 两档都不再溢出；风速、云量的列宽同时满足 ≥38 / ≥31 的验收目标。 */
  const hourly = hours.filter((d, i) => d.t.getHours() % 6 === 0);
  const hourlyBox = ledger('1.02fr .77fr .51fr .7fr .51fr .76fr', 'f-ledger--tight f-ledger--hourly');
  hourlyBox.appendChild(el('div.f-ledger__head',
    el('div.f-cell', { text: '时段' }),
    el('div.f-cell.f-cell--r', { text: '温度' }),
    el('div.f-cell.f-cell--r', { text: '降水' }),
    el('div.f-cell.f-cell--r', { text: '风速' }),
    el('div.f-cell.f-cell--r', { text: '云量' }),
    el('div.f-cell.f-cell--r', { text: '判定' })));
  hourly.forEach((d) => {
    const idx = hours.indexOf(d);
    const row = el('div.f-ledger__row' + (idx === sel ? '.is-you' : ''), { role: 'button', tabindex: locked ? '-1' : '0' },
      el('div.f-cell.f-cell--time', { text: d.label }),
      el('div.f-cell.f-cell--n', { html: d.temp.toFixed(1) + '<span class="f-cell__u">℃</span>' }),
      el('div.f-cell.f-cell--n', { html: d.precip + '<span class="f-cell__u">%</span>' }),
      el('div.f-cell.f-cell--n', { html: d.wind.toFixed(1) + '<span class="f-cell__u">m/s</span>' }),
      el('div.f-cell.f-cell--n', { html: d.cloud + '<span class="f-cell__u">%</span>' }),
      el('div.f-cell.f-cell--word.f-cell--r', { text: verdictOf(d) }));
    tap(row, () => { if (locked) return; sel = idx; paint(); });
    hourlyBox.appendChild(row);
  });
  page.appendChild(zone(3, '逐时判定', fmt(hourly.length) + ' 行 · 每 6 小时', null, [
    hourlyBox,
    el('div.f-zone__caption', { text: '点一行即可把上方曲线与读数跳到该小时（高亮行为当前选中）。' }),
  ]));

  /* --- 工位 04：窗口判定表（编辑部判定 + 由数据推出的其余窗口） --- */
  const winBox = ledger('1.6fr .8fr .45fr .55fr .45fr', 'f-ledger--tight');
  winBox.appendChild(el('div.f-ledger__head',
    el('div.f-cell', { text: '时段' }),
    el('div.f-cell', { text: '判定' }),
    el('div.f-cell.f-cell--r', { text: '云海' }),
    el('div.f-cell.f-cell--r', { text: '风' }),
    el('div.f-cell.f-cell--r', { text: '降水' })));

  const bandOf = (i) => bands.find((b) => i >= b.from && i <= b.to) || bands[0];
  const avg = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;

  meta.window.forEach((w, i) => {
    const band = bandOf(i);
    const row = el('div.f-ledger__row' + (locked ? '.is-locked' : ''), { role: 'button', tabindex: locked ? '-1' : '0' },
      el('div.f-cell.f-cell--time', { text: w[0] }),
      el('div.f-cell.f-cell--word', { text: w[1] }),
      measureCell(w[2]),
      measureCell(w[3]),
      band ? el('div.f-cell.f-cell--n', {
        html: Math.round(avg(band && hours.slice(band.from, band.to + 1).map((h) => h.precip))) + '<span class="f-cell__u">%</span>',
      }) : el('div.f-cell'));
    tap(row, () => {
      if (locked || !band) return;
      sel = Math.min(band.from + 2, band.to);
      paint();
    });
    winBox.appendChild(row);
  });

  /* 由 keyNote 推出的其余窗口（编者按已给的窗口之外，补全数据里真实存在的窗口） */
  bands.forEach((b) => {
    if (b.note === '云海窗口') return;
    const slice = hours.slice(b.from, b.to + 1);
    const row = el('div.f-ledger__row' + (locked ? '.is-locked' : ''), { role: 'button', tabindex: locked ? '-1' : '0' },
      el('div.f-cell.f-cell--time', { text: hours[b.from].label.slice(0, 5) + ' ' + hours[b.from].label.slice(-5) + '–' + hours[b.to].label.slice(-5) }),
      el('div.f-cell.f-cell--word', { text: b.note }),
      el('div.f-cell.f-cell--n', { html: Math.round(avg(slice.map((h) => h.cloud))) + '<span class="f-cell__u">%</span>' }),
      el('div.f-cell.f-cell--n', { html: avg(slice.map((h) => h.wind)).toFixed(1) + '<span class="f-cell__u">m/s</span>' }),
      el('div.f-cell.f-cell--n', { html: Math.round(avg(slice.map((h) => h.precip))) + '<span class="f-cell__u">%</span>' }));
    tap(row, () => {
      if (locked) return;
      sel = Math.min(b.from + 2, b.to);
      paint();
    });
    winBox.appendChild(row);
  });
  page.appendChild(zone(4, '窗口判定', meta.window.length + ' 条编辑部 + ' + Math.max(0, bands.length - 1) + ' 条数据推出', 'oat', [
    winBox,
    el('div.f-zone__caption', { text: '点一行可跳到该时段的曲线读数；数值由 48 小时数据逐时算出。' }),
  ]));

  /* --- 工位 05：决策便笺 --- */
  const winHours = cloud ? hours.slice(cloud.from, cloud.to + 1) : [];
  /* D4：删掉与工位 03/04 重复的云量、降水复述，只留可执行结论（何时等、何时下撤） */
  page.appendChild(zone(5, '编辑建议', '按窗口排程', null, [
    el('div.f-memo',
      kick('编辑部便笺'),
      el('p.f-body', {
        text: '按「' + win[0] + '」安排山顶等候 —— '
          + (winHours.length
            ? '这是 48 小时里最通透的一段。'
            : meta.detail)
          + '周日下午转小到中雨，建议上午完成下撤。',
      })),
  ]));

  if (locked) {
    page.appendChild(el('div.f-note-line',
      el('div.f-note-line__k', { text: '只读快照' }),
      el('span', { text: '这是出发前的静态快照，逐时点选与窗口跳转已暂停。' })));
  }
  page.appendChild(el('div.f-note-line',
    el('div.f-note-line__k', { text: '来源' }),
    el('span', { text: weatherSource })));
  page.appendChild(foot(D));
  return page;
}