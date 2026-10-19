// Style G — Strava Athletic（橙白运动风）
// 忠实镜像 Strava 视觉语言，不自创新方向：白画布 + Fog 面层 + 三档橙（#FC5200 图形 /
// #CC4200 CTA 实底与品牌文字 / #FC6100 限量强调）+ pill chip + metric-display 数据优先。
//
// DOM 组织按「Feed」来搭（结构与 A 刊物 / B 网格表 / C 色调带 / D 控制台 / E 深色分区 /
// F 工位纸带均不同）：
//   发现 = 满幅刊头（wordmark + 城市 + 三联读数）→ 满幅筛选 tab（滑动橙指示条）→ 满幅搜索
//          → feed 卡流（头图 → 三联读数 → kudos 行）→ 脚注
//   详情 = 满幅 hero（照片 + 品牌旗）→ 白底标题区 → 状态行 → factstrip（32/700 大读数 + 三联）
//          → 路线折线 → 行程叙事 → 装备清单 → 费用 → 同行人 → 报尾主操作
//   协作 = 满幅抬头 → 只读说明 → 分段 tab（总览 / 名单 / 分车 / 现场）→ 现场六格 + 进度条
//          → 名单与分车（成员行 / 分车格 / 座位矩阵）→ 下一步
//   天气 = 满幅简报（地点 + 结论）→ 出发窗口规格行 + 决策条 → 48 小时曲线 + 读数面板
//          → 日卡（按日分组）→ 窗口判定 → 来源 → 脚注
//
// 状态页（空 / 错 / 禁用）沿用同一套块（白卡 + Asphalt 弱化文字），不落红色警报块；
// 红只留给真实危险（取消 / 失败）。
//
// 只复用共享原语：el / icon / photo / fmt / pad2 / frag；事件一律 el(..., {onclick})，无内联 on*。
// 数据只读 prototype/js/data.js；不删任何字段。

import { el, icon, photo, fmt, pad2, frag } from '../../render-common.js';

const NOTE = '同一演示数据 · 七风格对照实验';
const ASSETS = 'assets/photos/';

/* 状态词 → 语义色（与 A–F 同一套色义，保证跨风格可比） */
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
    el('div.g-foot__credit', { text: D.credit }),
    el('div.g-foot__note', { text: NOTE }));
}

/** 眉题：全大写 + 字距的 micro 语言（dossier micro 11/600/1.27/+0.04em） */
const kick = (t, cls) => el('div.g-kicker' + (cls ? '.' + cls : ''), { text: t });

/** 序号：01 / 02 … */
const no2 = (n) => (n < 10 ? '0' : '') + n;

function md(dateText) {
  const m = /(\d+)\s*月\s*(\d+)/.exec(dateText || '');
  return m ? String(m[1]).padStart(2, '0') + '/' + String(m[2]).padStart(2, '0') : '—';
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const wkOf = (t) => WEEK[t.getDay()];

/** 取「日期 + 星期」印记；add 为 1 时取次日 */
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
  return m ? pad2(Number(m[1])) + ':' + m[2] : '';
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

/** 状态词：实心圆点 + 文字；失效态圆点挖空（形状也是信号） */
const tag = (t, kind) => el('span.g-tag.g-tag--' + (kind || 'off'), { text: t });

/** 三联 / 四联读数格：数字 + 单位（单位退到 13/500 + Asphalt） */
function metric(k, v, u, cls) {
  return el('div.g-metric' + (cls ? '.' + cls : ''),
    el('div.g-metric__k', { text: k }),
    el('div.g-metric__v',
      el('span', { text: v }),
      u ? el('span.g-metric__u', { text: u }) : null));
}

function metrics(list, cls) {
  return el('div.g-metrics' + (cls ? '.' + cls : ''),
    ...list.map((m) => metric(m.k, m.v, m.u, m.hi ? 'is-hi' : '')));
}

/** 规格行：标签左 · 读数右 · 单位常显 · 注记更弱 */
function row(k, v, u, n, cls) {
  return el('div.g-row' + (cls ? '.' + cls : ''),
    el('div.g-row__k', { text: k }),
    el('div.g-row__v',
      el('span', { text: v }),
      u ? el('span.g-row__u', { text: u }) : null),
    n ? el('div.g-row__n', { text: n }) : null);
}

/** 内容块：编号 + 名称 + 右侧 meta；白卡 + 卡头下沿发丝线（不用深色重块分区） */
function zone(no, name, meta, body, current) {
  return el('section.g-zone' + (current ? '.is-current' : ''),
    el('div.g-zone__tab',
      el('div.g-zone__no', { text: no2(no) }),
      el('div.g-zone__name', { text: name }),
      meta ? el('div.g-zone__meta', { text: meta }) : null),
    el('div.g-zone__body', ...[].concat(body)));
}

/** 块内二级切分头 */
function sub(label, right) {
  return el('div.g-subhead',
    el('span.g-kicker', { text: label }),
    right ? el('div.g-subhead__n', { text: right }) : null);
}

/** 操作条：说明句占满剩余宽度，按钮不折行 */
function actions(note, ...buttons) {
  return el('div.g-actions',
    note ? el('div.g-actions__note', { html: note }) : null,
    ...buttons.filter(Boolean));
}

function link(label, fn, sm) {
  return el('button.g-link' + (sm ? '.g-link--sm' : ''), { type: 'button', onclick: fn },
    el('span', { text: label }),
    icon('arrow-right'));
}

/** 只读 / 来源说明行：Asphalt 弱化 + 图标，不是红色警报块 */
function lockLine(k, text, iconName) {
  return el('div.g-lock',
    iconName ? icon(iconName) : null,
    el('span.g-lock__k', { text: k }),
    el('span', { text: text }));
}

/** 照片（满幅、无滤镜；解码完成后再淡入，纸面上不闪） */
function cover(file, alt, cls) {
  const node = photo(ASSETS + file, { alt, cls: cls || '' });
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
  if (typeof fn !== 'function') return node;
  node.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('button')) return;
    fn(e);
  });
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); }
  });
  return node;
}

/** 状态块（空 / 错误 / 缺失）：文字 + Asphalt 弱化，没有红色块 */
function stateBlock(iconName, title, body, label, fn, kind) {
  const k = kind || 'quiet';
  return el('div.state-block'
    + (k === 'error' ? '.state-block--error' : k === 'off' ? '.state-block--off' : ''),
    iconName ? icon(iconName) : null,
    el('div.state-block__title', { text: title }),
    el('div.state-block__body', { text: body }),
    label ? link(label, fn) : null);
}

const skel = (h, w) => el('div.skeleton.g-skel-' + h, w ? { style: { width: w } } : null);

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

const carLabel = (D, id) => (D.vehicles.find((v) => v.id === id) || {}).label || '待安排车辆';

/* =========================================================
   1. 发现 — Feed
   ========================================================= */

const FILTERS = [
  { key: 'all', label: '全部', test: () => true },
  { key: 'open', label: '可报名', test: isOpen },
  { key: 'formed', label: '已成行', test: (a) => a.statusKey === 'formed' },
  { key: 'ended', label: '已结束', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
];

/** kudos 行：重叠头像 + 实心橙计数（Strava feed 的固定收尾） */
function kudosRow(faces, faceMeta, count) {
  const box = el('div.g-kudos__faces');
  faces.forEach((f) => box.appendChild(
    el('span.g-kudos__face' + (f.isMe ? '.is-me' : ''), { text: f.ch })));
  return el('div.g-kudos',
    box,
    el('div.g-kudos__meta', { text: faceMeta }),
    el('div.g-kudos__n', icon('users'), el('span', { text: fmt(count) })));
}

/** Feed 卡：头图 → 标题 → 三联读数 → kudos 行（lead 卡多一段导语与 32/700 大读数） */
function feedCard(a, o) {
  const opt = o || {};
  const lead = !!opt.lead;
  const node = el('article.g-card'
    + (lead ? '.g-card--lead' : '')
    + (opt.locked ? '.is-locked' : ''),
  { role: 'button', tabindex: '0' },
  el('div.g-card__media',
    cover(a.cover, a.title + ' 氛围封面', 'g-card__shot')),
  el('div.g-card__body',
    el('div.g-card__top',
      tag(a.status, STATUS_KIND[a.statusKey]),
      el('span.g-card__when', { text: md(a.dateText) + ' ' + a.weekdayText })),
    el('h3.g-card__title', { text: a.title }),
    el('div.g-card__sub', { text: a.routeName + ' · ' + a.city + ' · ' + a.difficultyText }),
    lead ? el('p.g-card__note', { text: a.lede }) : null,
    lead ? el('div.g-card__big',
      el('div.g-big',
        el('span', { text: a.distanceKm.toFixed(1) }),
        el('span.g-big__u', { text: 'km' })),
      el('div.g-caption', { text: '全程 · ' + a.timeText })) : null,
    el('div' + (lead ? '.g-card__lead-line' : ''),
      lead
        ? metrics([
          { k: '名额', v: a.seatsTotal + '', u: '席' },
          { k: '爬升', v: fmt(a.ascentM), u: 'm' },
          { k: '签满', v: a.signedCount + '/' + a.seatsTotal, u: '', hi: !isOpen(a) },
        ])
        : metrics([
          { k: '距离', v: a.distanceKm.toFixed(1), u: 'km' },
          { k: '爬升', v: fmt(a.ascentM), u: 'm' },
          isOpen(a)
            ? { k: '剩余', v: String(leftOf(a)), u: '席', hi: leftOf(a) > 0 && leftOf(a) <= 3 }
            : { k: '名额', v: a.signedCount + '/' + a.seatsTotal, u: '' },
        ])),
    kudosRow(opt.faces || [{ ch: (a.leader || '·').slice(0, 1) }],
      opt.faceMeta || ('领队 ' + a.leader), a.signedCount)));
  tap(node, opt.onOpen);
  return node;
}

function masthead(D) {
  const nMonth = D.activities.filter((a) => monthOf(a.dateText) === 10);
  const km = nMonth.reduce((s, a) => s + a.distanceKm, 0);
  return el('header.g-mast',
    el('div.g-mast__bar',
      el('span.g-mark', { text: 'OurTrail' }),
      el('span.g-mast__date', { text: '10 月 17 日' })),
    el('h1.g-mast__title', { text: '发现' }),
    el('p.g-mast__sub', { text: D.featured.city + ' · 今日首发 ' + D.featured.title }),
    el('div.g-mast__stats',
      metrics([
        { k: '本月路线', v: String(nMonth.length), u: '条' },
        { k: '合计里程', v: km.toFixed(1), u: 'km' },
        { k: '可报名', v: String(D.activities.filter(isOpen).length), u: '条', hi: true },
      ])));
}

function discoverSkeleton() {
  return frag(
    el('div.g-mast',
      el('div.g-mast__bar', skel(11, '32%'), skel(11, '18%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '44%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '82%')),
      el('div.g-mast__stats', { style: { marginTop: 'var(--lab-space-4)' } },
        el('div.g-metrics',
          ...Array.from({ length: 3 }, () => el('div.g-metric', skel(11, '70%'), skel(18, '54%')))))),
    el('div.g-tabs', { style: { marginTop: 'var(--lab-space-4)' } },
      skel(15, '28%'), skel(15, '34%'), skel(15, '34%')),
    el('div.g-search', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '62%')),
    ...Array.from({ length: 3 }, () => el('div.g-card', { style: { marginTop: 'var(--lab-space-4)' } },
      skel(140, '100%'),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(18, '76%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(13, '58%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '100%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(48, '100%')))));
}

export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.g-discover');
  const locked = flag === 'disabled';

  if (flag === 'error') {
    page.appendChild(masthead(D));
    page.appendChild(el('div.g-state.g-state--fill',
      sub('路线流', '未载入'),
      stateBlock('alert', '加载失败，请检查网络', '活动流没能取回来，网络恢复后可以重新加载。',
        '重试', () => ui.toast('已重试（演示）'), 'error')));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'loading') {
    page.appendChild(discoverSkeleton());
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'empty') {
    page.appendChild(masthead(D));
    page.appendChild(el('div.g-state.g-state--fill',
      sub('检索结果', '无匹配'),
      stateBlock('search', '没有匹配的路线',
        '当前的关键词与筛选条件没有任何交集，回到全部再挑一次。',
        '清空筛选', () => ui.setFlag(''), 'off')));
    page.appendChild(foot(D));
    return page;
  }

  page.appendChild(masthead(D));

  /* --- 筛选 tab：文字游标 + 计数 + 单条滑动橙指示条 --- */
  let key = 'all';
  let q = '';
  const tabs = el('div.g-tabs' + (locked ? '.is-disabled' : ''));
  const ink = el('i.g-tabs__ink');

  function moveInk() {
    const active = tabs.querySelector('.g-tabs__item.is-active');
    if (!active) return;
    ink.style.width = active.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  function paintTabs() {
    tabs.innerHTML = '';
    FILTERS.forEach((f) => {
      const count = D.activities.filter(f.test).length;
      tabs.appendChild(el('button.g-tabs__item'
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
      el('span.g-tabs__n', { text: String(count) })));
    });
    tabs.appendChild(ink);
    moveInk();
  }

  /* --- 搜索：功能性控件描边走 --lab-text-3（G.css） --- */
  const searchInput = el('input', {
    type: 'search', placeholder: '搜索活动名、路线或城市', disabled: locked,
    oninput: (e) => {
      q = e.target.value.trim();
      search.classList.toggle('has-q', !!q);
      paintList();
    },
  });
  const search = el('div.input.g-search' + (locked ? '.is-disabled' : ''),
    icon('search'),
    searchInput,
    el('button.g-search__clear', {
      type: 'button', text: '清空',
      onclick: () => {
        searchInput.value = '';
        q = '';
        search.classList.remove('has-q');
        paintList();
      },
    }));

  paintTabs();
  page.appendChild(tabs);
  page.appendChild(search);
  if (locked) {
    page.appendChild(lockLine('只读', '筛选与搜索已暂停，当前展示的是 10 月 17 日的精选流。', 'info'));
  }

  /* --- Feed 卡流 --- */
  const feed = el('div.g-feed');
  page.appendChild(feed);

  function paintList() {
    feed.innerHTML = '';
    const f = FILTERS.find((x) => x.key === key);
    let list = D.activities.filter(f.test).slice().sort((x, y) => orderOf(x) - orderOf(y));
    if (q) list = list.filter((a) => (a.title + a.routeName + a.city + a.lede).indexOf(q) >= 0);

    if (!list.length) {
      feed.appendChild(el('div.g-state',
        sub('检索结果', '无匹配'),
        stateBlock('search', '没有匹配的路线', '换个关键词，或把筛选条件放宽一些。',
          '清空筛选', () => ui.setFlag(''), 'off')));
      return;
    }

    /* lead 卡只在「全部 + 无关键词」时置顶：Strava 的 feed 首条是当日首发 */
    const featured = (!q && key === 'all') ? D.featured : null;
    if (featured) {
      const here = D.roster.filter((m) => m.checked);
      feed.appendChild(feedCard(featured, {
        lead: true,
        locked: locked,
        onOpen: () => ui.go('detail'),
        faces: here.slice(0, 4).map((m) => ({
          ch: m.name.slice(0, 1), isMe: m.name === D.viewer.name,
        })),
        faceMeta: '已到场 ' + here.length + ' 人 · 领队 ' + featured.leader,
      }));
    }
    (featured ? list.filter((x) => x.id !== featured.id) : list).forEach((a) => {
      feed.appendChild(feedCard(a, { locked: locked, onOpen: () => ui.go('detail') }));
    });
  }

  paintList();
  requestAnimationFrame(moveInk);
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   2. 详情 — 活动页
   ========================================================= */

/** 海拔剖面（示意）：横轴 = 行程节点，纵轴 = 示意海拔；登顶值取正文「登顶 2434 米」。
    路线折线是品牌橙唯一允许的折线；面积用同色低透明度。 */
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

function routeSVG(model) {
  const W = 342, H = 96, T = 20, B = 12, R = 2;
  const n = model.pts.length;
  const lo = Math.min(...model.pts.map((p) => p.m)) - 160;
  const hi = model.summit + 90;
  const plotW = W - R;
  const px = (i) => (plotW * i) / (n - 1);
  const py = (m) => T + (H - T - B) * (1 - (m - lo) / ((hi - lo) || 1));
  let s = '';

  [lo + 160, (lo + hi) / 2, hi].forEach((m) => {
    s += '<line x1="0" y1="' + py(m).toFixed(1) + '" x2="' + plotW + '" y2="' + py(m).toFixed(1)
      + '" stroke="var(--lab-border)" stroke-width="1"/>';
  });

  const line = model.pts.map((p, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.m).toFixed(1)).join('');
  s += '<path d="' + line + 'L' + plotW + ' ' + (H - B) + 'L0 ' + (H - B) + 'Z"'
    + ' fill="var(--g-orange)" fill-opacity=".12"/>';
  s += '<line x1="0" y1="' + (H - B) + '" x2="' + plotW + '" y2="' + (H - B)
    + '" stroke="var(--lab-border)" stroke-width="1"/>';
  s += '<path d="' + line + '" fill="none" stroke="var(--g-orange)"'
    + ' stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';

  model.pts.forEach((p, i) => {
    s += '<circle cx="' + px(i).toFixed(1) + '" cy="' + py(p.m).toFixed(1)
      + '" r="2" fill="var(--lab-surface)" stroke="var(--g-orange)" stroke-width="2"/>';
  });

  /* 登顶锚点：2px 墨色刻线 + 海拔 + 时刻（读数不是异常 → 墨色） */
  const si = model.summitAt;
  const sx = px(si), sy = py(model.pts[si].m);
  s += '<line x1="' + sx.toFixed(1) + '" y1="' + (T - 9) + '" x2="' + sx.toFixed(1) + '" y2="' + sy.toFixed(1)
    + '" stroke="var(--lab-border-strong)" stroke-width="2"/>';
  s += '<text x="' + (sx - 3).toFixed(1) + '" y="' + (T - 2) + '" font-size="11" text-anchor="end"'
    + ' fill="var(--lab-text-1)" font-weight="700" font-family="inherit">'
    + model.pts[si].m + ' m · ' + model.pts[si].t + '</text>';

  /* YOU 锚点：起点实心橙方块；文字压在点的上方，避开底缘的纵轴刻度 */
  s += '<rect x="' + (px(0) - 3.5).toFixed(1) + '" y="' + (py(model.pts[0].m) - 3.5).toFixed(1)
    + '" width="7" height="7" fill="var(--g-orange)"/>';
  s += '<text x="' + (px(0) + 7).toFixed(1) + '" y="' + (py(model.pts[0].m) - 8).toFixed(1)
    + '" font-size="11" fill="var(--lab-text-2)" font-family="inherit">你 · ' + model.pts[0].t + ' 出发</text>';

  s += '<text x="0" y="' + (H - 1) + '" font-size="11" fill="var(--lab-text-3)" font-family="inherit">'
    + lo.toFixed(0) + '</text>';
  s += '<text x="' + plotW + '" y="' + (H - 1) + '" font-size="11" text-anchor="end"'
    + ' fill="var(--lab-text-3)" font-family="inherit">' + hi.toFixed(0) + ' m</text>';

  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" aria-hidden="true">' + s + '</svg>';
}

/** 行程叙事：关键节点（集合 / 登顶 / 日出）点实心橙 */
const KEY_RE = /集合|登顶|日出/;
function narrSteps(a) {
  return a.itinerary.map((it, i) => el('div.g-step' + (KEY_RE.test(it[1]) ? '.is-key' : ''),
    el('div.g-step__t', { text: it[0] }),
    el('i.g-step__x'),
    el('div.g-step__b',
      el('div', { text: it[1] }),
      el('div.g-step__d', { text: '节点 ' + no2(i + 1) + ' / ' + no2(a.itinerary.length) }))));
}

function detailHero(a, isVoid) {
  return frag(
    el('div.g-bleed',
      el('div.g-hero' + (isVoid ? '.g-hero--void' : ''),
        el('div.g-hero__media',
          cover(a.cover, a.title + ' 氛围封面', 'g-hero__shot'),
          el('div.g-hero__flag', { text: a.status })))),
    el('div.g-hero__body',
      el('h1.g-hero__title', { text: a.title }),
      el('div.g-hero__sub', {
        text: a.dateText + ' ' + a.weekdayText + ' · ' + a.timeText
          + ' · 领队 ' + a.leader,
      })));
}

function detailSkeleton() {
  return frag(
    el('div.g-bleed', skel(200, '100%')),
    el('div', { style: { marginTop: 'var(--lab-space-4)' } }, skel(30, '82%')),
    el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(13, '58%')),
    el('div.g-facts',
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(32, '40%')),
      el('div.g-metrics', { style: { marginTop: 'var(--lab-space-4)' } },
        ...Array.from({ length: 3 }, () => el('div.g-metric', skel(11, '70%'), skel(18, '56%'))))),
    zone(1, '路线', '示意剖面', [
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(96, '100%')),
    ]),
    zone(2, '行程', '8 个节点', [
      ...Array.from({ length: 6 }, (_, i) => el('div.g-step',
        skel(13, '18%'), el('i.g-step__x'),
        el('div.g-step__b', skel(15, '92%'), el('div', { style: { marginTop: 'var(--lab-space-1)' } }, skel(11, '30%'))))),
    ]),
    zone(3, '装备', '5 条', [
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '100%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '86%')),
    ]));
}

export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.g-detail');
  const locked = flag === 'disabled';

  /* --- 空态：退化为「已取消活动」（小鱼洞），CTA 关闭 --- */
  if (flag === 'empty') {
    const gone = D.activities.find((x) => x.statusKey === 'cancelled') || D.featured;
    page.appendChild(detailHero(gone, true));
    page.appendChild(el('div.g-statusline',
      tag(gone.status, STATUS_KIND[gone.statusKey]),
      el('span.g-statusline__r', { text: gone.dateText + ' ' + gone.weekdayText })));
    page.appendChild(zone(1, '路线说明', gone.city, [
      el('h2.g-h2', { text: gone.title }),
      el('div.g-caption', { text: gone.routeName + ' · ' + gone.difficultyText }),
      el('p.g-body', { style: { marginTop: 'var(--lab-space-3)' }, text: gone.lede }),
      sub('费用与约定'),
      el('div.g-rows', row('费用口径', '包车 AA', '元', gone.feeNote)),
    ]));
    page.appendChild(zone(2, '报名状态', gone.status, [
      stateBlock('info', '活动已取消', '这条路线不再接受报名，已报名的成员会收到通知。',
        '去看看其他活动', () => ui.go('discover'), 'off'),
    ]));
    page.appendChild(el('div.g-bar',
      el('button.btn.btn--primary.g-bar__cta.is-closed',
        { type: 'button', text: '报名已关闭', disabled: true }),
      el('button.g-share', {
        type: 'button', disabled: true,
        onclick: () => ui.toast('已生成分享卡片（演示）'),
      }, icon('share'), el('span', { text: '分享' }))));
    page.appendChild(foot(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(el('div.g-state.g-state--fill',
      sub('概览', '未载入'),
      stateBlock('alert', '加载失败，请检查网络', '这条活动的安排没能取回来。',
        '重试', () => ui.toast('已重试（演示）'), 'error')));
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
  const checked = mates.filter((m) => m.checked);
  const approved = mates.filter((m) => m.audit === '已通过');
  const crews = mates.filter((m) => m.role !== '成员');
  const model = profileModel(a);

  page.appendChild(detailHero(a, false));

  /* --- 状态行 --- */
  page.appendChild(el('div.g-statusline',
    tag(a.status, STATUS_KIND[a.statusKey]),
    el('span.g-statusline__r', {
      text: '剩 ' + left + ' 位 · 截止 ' + md(a.deadlineText) + ' ' + hhmm(a.deadlineText),
    })));

  /* --- factstrip：一屏一次的 32/700 大读数 + 三联读数 --- */
  page.appendChild(el('div.g-facts',
    el('div.g-big',
      el('span', { text: a.distanceKm.toFixed(1) }),
      el('span.g-big__u', { text: 'km' })),
    el('div.g-caption', { text: '全程 · ' + a.city + ' · ' + a.routeName }),
    el('div.g-facts__lead',
      metrics([
        { k: '累计爬升', v: fmt(a.ascentM), u: 'm' },
        { k: '名额', v: a.signedCount + '/' + a.seatsTotal, u: '' },
        { k: '已签到', v: String(checked.length), u: '人', hi: true },
      ]))));

  /* --- 01 路线：海拔剖面（路线折线） --- */
  page.appendChild(zone(1, '路线', '示意剖面 · ' + no2(model.pts.length) + ' 节点', [
    el('div.g-route',
      el('div.g-route__plot', { html: routeSVG(model) }),
      el('div.g-route__axis',
        ...model.pts.map((p, i) => el('div.g-route__node'
          + (i === model.summitAt ? '.is-summit' : '')
          + (i === 0 ? '.is-you' : ''),
        { text: no2(p.no) })))),
    el('div.g-route__note', {
      text: '登顶 ' + fmt(model.summit) + ' m 与节点 ' + no2(model.summitAt + 1)
        + '（' + model.pts[model.summitAt].t + '）一致。示意剖面，非实测轨迹。',
    }),
  ], true));

  /* --- 02 行程：时刻 + 节点点 + 文字 --- */
  page.appendChild(zone(2, '行程', fmt(a.itinerary.length) + ' 个节点', [
    el('div.g-narr', ...narrSteps(a)),
  ]));

  /* --- 03 集合与时间 --- */
  page.appendChild(zone(3, '集合与时间', a.city, [
    el('div.g-rows',
      row('集合点', a.meetingPoint),
      row('集合时间', a.meetingTime, '', a.dateText + ' ' + a.weekdayText),
      row('出发', a.timeText, '', '演示时钟 10/17 22:10'),
      row('报名截止', a.deadlineText),
      row('领队', a.leader),
      row('难度', a.difficultyText),
      row('城市', a.city)),
  ]));

  /* --- 04 装备与提醒 --- */
  page.appendChild(zone(4, '装备与提醒', fmt(a.requirements.length) + ' 条', [
    el('div.g-gear',
      ...a.requirements.map((r) => el('div.g-gear__item',
        el('i.g-gear__x'),
        el('div.g-gear__text', { text: r })))),
  ]));

  /* --- 05 费用与同行人 --- */
  page.appendChild(zone(5, '费用与约定', '包车 AA', [
    el('p.g-body', { text: a.feeNote }),
    sub('同行人', fmt(crews.length) + ' 位 · 领队与车长'),
    el('div.g-mates',
      ...crews.map((m) => {
        const isMe = m.name === D.viewer.name;
        return el('div.g-mate' + (isMe ? '.is-me' : ''),
          el('div.g-mate__face', { text: m.name.slice(0, 1) }),
          el('div.g-mate__main',
            el('div.g-mate__name', {
              html: m.name + (isMe ? '<span class="g-you">你</span>' : ''),
            }),
            el('div.g-mate__meta', {
              text: m.role + ' · ' + (m.vehicleId ? carLabel(D, m.vehicleId) : '待安排车辆')
                + ' · ' + seatText(m),
            })),
          el('div.g-mate__side',
            m.checked ? tag('已签到', 'success') : tag(m.audit, AUDIT_KIND[m.audit])));
      })),
    actions('成员共 <span class="num">' + fmt(mates.length) + '</span> 位，签到明细在协作页逐人可点。',
      link('查看全部 ' + fmt(mates.length) + ' 位成员', () => ui.go('collab'))),
  ]));

  if (locked) {
    page.appendChild(lockLine('报名已截止',
      '本次活动的报名通道已于 ' + a.deadlineText + ' 关闭，页面为只读快照。', 'clock'));
  }

  /* --- 报尾：唯一的主操作（分享为描边次级按钮）。
         反馈链：idle → loading →(700ms)→ done + ui.toast('报名成功，等待领队审核') --- */
  const cta = el('button.btn.btn--primary.g-bar__cta', {
    type: 'button', data: { testid: 'primary-cta' },
  });
  const STAGE_TEXT = { idle: '立即报名', loading: '提交中…', done: '已报名 · 待审核', closed: '报名已截止' };
  const STAGE_CLS = { loading: 'is-loading', done: 'is-done', closed: 'is-closed' };
  let stage = locked ? 'closed' : 'idle';
  function paintCta() {
    cta.textContent = STAGE_TEXT[stage];
    if (stage === 'done') cta.appendChild(icon('check'));
    cta.disabled = stage !== 'idle';
    cta.classList.remove('is-loading', 'is-done', 'is-closed');
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

  page.appendChild(el('div.g-bar',
    cta,
    el('button.g-share', {
      type: 'button', disabled: locked,
      onclick: () => ui.toast('已生成分享卡片（演示）'),
    }, icon('share'), el('span', { text: '分享' }))));
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   3. 协作 — 现场台
   ========================================================= */

const TABS = [
  { key: 'over', label: '总览' },
  { key: 'list', label: '名单' },
  { key: 'car', label: '分车' },
  { key: 'site', label: '现场' },
];

function chead(a, headline, sub) {
  return el('header.g-chead',
    el('div.g-chead__kick',
      kick(a.title + ' · ' + a.dateText),
      kick(a.weekdayText)),
    el('h1.g-chead__title', { text: headline }),
    el('div.g-chead__sub', { text: sub }));
}

function collabSkeleton() {
  return frag(
    el('div.g-chead',
      el('div.g-chead__kick', skel(11, '62%'), skel(11, '14%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(30, '72%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(13, '80%'))),
    el('div.g-seg', { style: { marginTop: 'var(--lab-space-4)' } },
      ...Array.from({ length: 4 }, () => el('div.seg__item', skel(11, '40%'), skel(11, '24%')))),
    zone(1, '现场', '未载入', [
      el('div.g-metrics',
        ...Array.from({ length: 6 }, () => el('div.g-metric', skel(18, '52%'), skel(11, '72%')))),
    ]),
    zone(2, '名单与分车', '未载入', [
      ...Array.from({ length: 6 }, () => el('div.g-mrow',
        skel(56, '40px'), el('div.g-mrow__main', skel(15, '46%'), skel(11, '64%')))),
    ]));
}

export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.g-collab');
  const locked = flag === 'disabled';
  const a = D.featured;
  const base = D.collab;

  if (flag === 'empty') {
    page.appendChild(chead(a, '还没有人签到',
      '集合中 · 集合点 ' + a.meetingPoint + ' · 出发 ' + a.meetingTime));
    page.appendChild(el('div.g-state.g-state--fill',
      stateBlock('users', '还没有成员', '这条活动发布后，通过审核的成员会出现在这里。',
        '去看看其他活动', () => ui.go('discover'), 'off')));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(chead(a, '协作面板打不开', '集合中 · 出发 ' + a.meetingTime));
    page.appendChild(el('div.g-state.g-state--fill',
      stateBlock('alert', '加载失败，请检查网络', '协作面板没能取回来，页面上的数据需要重新加载。',
        '重试', () => { ui.toast('已重试（演示）'); ui.setFlag(''); }, 'error')));
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

  page.appendChild(chead(a,
    s0.unchecked ? s0.unchecked + ' 人未签到' : '全员已签到',
    base.phase + ' · 集合点 ' + a.meetingPoint + ' · 出发 ' + a.meetingTime));
  if (locked) {
    page.appendChild(lockLine('只读', '签到已由领队锁定，现场以纸面名单为准。', 'info'));
  }

  const seg = el('div.seg.g-seg');
  const body = el('div.g-tabbody');
  const meterFill = el('i.g-meter__fill');
  const arrivedCell = el('div.g-metric__v');
  const countsRow = el('div.g-metrics.g-metrics--stack');
  const headline = page.querySelector('.g-chead__title');
  const needNote = el('div.g-actions__note', { text: '勾选成员即完成签到。' });
  const zone2Meta = el('div.g-zone__meta', {
    text: roster.length + ' 位 · ' + D.vehicles.length + ' 台车 · 现场 ' + s0.checked,
  });

  function paintSeg() {
    seg.innerHTML = '';
    const s = tally(roster);
    const n = { over: s.total, list: s.total, car: D.vehicles.length, site: s.checked };
    TABS.forEach((t) => {
      seg.appendChild(el('button.seg__item' + (t.key === tab ? '.is-active' : ''), {
        type: 'button', 'aria-pressed': String(t.key === tab),
        onclick: () => { tab = t.key; paintSeg(); paintTab(); },
      }, el('span', { text: t.label }), el('span.n', { text: String(n[t.key]) })));
    });
  }

  function paintCounts() {
    const s = tally(roster);
    countsRow.innerHTML = '';
    [
      ['成员', s.total],
      ['已通过', s.approved],
      ['已签到', s.checked],
      ['待审核', s.pendingAudit],
      ['候补', s.waitlist],
      ['待安排车辆', s.noVehicle],
    ].forEach(([k, v]) => {
      countsRow.appendChild(el('div.g-metric',
        el('div.g-metric__k', { text: k }),
        el('div.g-metric__v', el('span', { text: String(v) }))));
    });
    if (headline) headline.textContent = s.unchecked ? s.unchecked + ' 人未签到' : '全员已签到';
    zone2Meta.textContent = roster.length + ' 位 · ' + D.vehicles.length + ' 台车 · 现场 ' + s.checked;
    arrivedCell.innerHTML = '';
    arrivedCell.appendChild(el('span', { text: s.checked + ' / ' + s.approved }));
    meterFill.style.width = (s.approved ? Math.round((s.checked / s.approved) * 100) : 0) + '%';
  }

  /* --- 01 现场：人先于数（先露领队与车长的到点情况），再给六格计数 --- */
  const whoBox = el('div.g-who');
  page.appendChild(zone(1, '现场', base.phase, [
    whoBox,
    el('div.g-metrics.g-metrics--lead', { style: { marginTop: 'var(--lab-space-3)' } },
      el('div.g-metric',
        el('div.g-metric__k', { text: '集合点' }),
        el('div.g-metric__v', { text: a.meetingPoint })),
      el('div.g-metric',
        el('div.g-metric__k', { text: '出发' }),
        el('div.g-metric__v', el('span', { text: a.meetingTime }))),
      el('div.g-metric',
        el('div.g-metric__k', { text: '到点' }),
        arrivedCell,
        el('div.g-meter', meterFill))),
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
          paintWho();
          paintSeg();
          paintTab();
        },
      })),
  ], true));

  /* --- 02 名单与分车（分段 tab 的容器） --- */
  const zone2 = el('section.g-zone.is-current',
    el('div.g-zone__tab',
      el('div.g-zone__no', { text: no2(2) }),
      el('div.g-zone__name', { text: '名单与分车' }),
      zone2Meta),
    el('div.g-zone__body', seg, body));
  page.appendChild(zone2);

  function paintWho() {
    whoBox.innerHTML = '';
    const crews = roster.filter((m) => m.role !== '成员');
    const box = el('div.g-kudos');
    const faces = el('div.g-kudos__faces');
    crews.forEach((m) => faces.appendChild(
      el('span.g-kudos__face' + (m.checked ? '' : '.is-off'), {
        text: m.name.slice(0, 1),
      })));
    box.appendChild(faces);
    box.appendChild(el('div.g-kudos__meta', {
      text: '已到 ' + crews.filter((m) => m.checked).length + ' / ' + crews.length + ' 位',
    }));
    whoBox.appendChild(box);
  }

  /* ---- 成员行（总览 / 名单 / 现场共用） ---- */
  function toggleFor(m, cell) {
    return el('button.g-toggle' + (cell ? '.g-toggle--cell' : '')
      + (m.checked ? '.is-on' : '')
      + (locked ? '.is-disabled' : ''),
    { type: 'button', 'aria-label': m.name + ' 签到',
      onclick: () => {
        if (locked) return;
        m.checked = !m.checked;
        m.checkedAt = m.checked ? '22:10' : undefined;
        ui.toast(m.name + (m.checked ? ' 已签到 · 22:10' : ' 已撤销签到') + '（演示）');
        paintCounts();
        paintWho();
        paintSeg();
        paintTab();
      } },
    icon(m.checked ? 'check-circle' : 'ring'));
  }

  function memberRow(m, idx) {
    const isMe = m.name === D.viewer.name;
    return el('div.g-mrow'
      + (isMe ? '.is-me' : '')
      + (m.checked ? '.is-arrived' : ''),
      el('div.g-mrow__face', { text: m.name.slice(0, 1) }),
      el('div.g-mrow__main',
        el('div.g-mrow__name', {
          html: m.name + ' · ' + m.role + (isMe ? '<span class="g-you">你</span>' : ''),
        }),
        el('div.g-mrow__meta', {
          text: m.tripMode + ' · ' + (m.vehicleId ? carLabel(D, m.vehicleId) + ' ' + seatText(m) : '待安排车辆')
            + (m.checked && m.checkedAt ? ' · 已签到 ' + m.checkedAt : ''),
        })),
      el('div.g-mrow__side',
        m.audit === '已通过' ? toggleFor(m, false) : tag(m.audit, AUDIT_KIND[m.audit])));
  }

  /* ---- 分车格：一张车卡 + 座位矩阵 ---- */
  function vehicleCard(v) {
    const taken = v.seats.filter(Boolean).length;
    const driver = roster.find((m) => m.name === v.driver);
    const seats = el('div.g-seats',
      el('div.g-seat.g-seat--driver.g-seat--full',
        el('span', { text: '司机 ' + v.driver }),
        el('small', { text: v.plate })));
    v.seats.forEach((name, i) => {
      if (!name) {
        seats.appendChild(el('div.g-seat.g-seat--free',
          el('span', { text: '空位' }),
          el('small', { text: (i + 1) + ' 号' })));
        return;
      }
      const m = roster.find((x) => x.name === name && x.vehicleId === v.id);
      const mine = name === D.viewer.name;
      seats.appendChild(el('div.g-seat' + (mine ? '.g-seat--you' : ''),
        el('span', { text: name }),
        el('small', { text: (m ? seatText(m) : (i + 1) + ' 号') })));
    });
    return el('div.g-veh',
      el('div.g-veh__head',
        el('div.g-veh__name', { text: v.label }),
        el('div.g-veh__plate', { text: v.plate }),
        el('div.g-veh__load' + (taken >= v.capacity ? '.is-full' : ''), {
          text: taken + '/' + v.capacity + ' 座 · ' + (taken >= v.capacity ? '满员' : '有空位'),
        })),
      seats,
      el('div.g-step__d', {
        text: driver && driver.checked ? '司机已到集合点' : '司机尚未签到',
      }));
  }

  /* ---- 分栏内容 ---- */
  function paintTab() {
    body.innerHTML = '';
    const s = tally(roster);

    if (tab === 'over') {
      body.appendChild(sub('集合安排', a.weekdayText + ' ' + a.dateText));
      body.appendChild(el('div.g-rows',
        row('集合点', a.meetingPoint, '', '地铁口'),
        row('集合时间', a.meetingTime, '', '演示时钟 10/17 22:10'),
        row('领队车长', fmt(roster.filter((m) => m.role !== '成员').length) + ' 位', '', '领队 ' + a.leader)));

      body.appendChild(sub('成员', '显示前 5 位 · 共 ' + roster.length + ' 位'));
      body.appendChild(el('div.g-mates',
        ...roster.slice(0, 5).map((m, i) => memberRow(m, i))));
      body.appendChild(actions(null,
        link('查看全部 ' + roster.length + ' 位成员', () => { tab = 'list'; paintSeg(); paintTab(); })));

      body.appendChild(sub('车辆', fmt(D.vehicles.length) + ' 台 · 每车 4 座'));
      body.appendChild(el('div.g-rows',
        ...D.vehicles.map((v) => {
          const taken = v.seats.filter(Boolean).length;
          return row(v.label, v.plate, '',
            '司机 ' + v.driver + ' · ' + taken + '/' + v.capacity + ' 座'
            + (taken >= v.capacity ? ' · 满员' : ' · 有空位'));
        })));
      body.appendChild(actions(null,
        link('查看座位安排', () => { tab = 'car'; paintSeg(); paintTab(); })));
    }

    if (tab === 'list') {
      body.appendChild(sub('名单', '领队与车长优先 · 共 ' + roster.length + ' 位'));
      body.appendChild(el('div.g-dt.g-dt--head',
        el('div.g-dt__k', { text: '成员' }),
        el('div.g-dt__k', { text: '方式' }),
        el('div.g-dt__k', { text: '分车' }),
        el('div.g-dt__k', { text: '座位' }),
        el('div.g-dt__k', { text: '状态' })));
      roster.slice()
        .sort((x, y) => (x.role === '成员') - (y.role === '成员'))
        .forEach((m) => {
          const isMe = m.name === D.viewer.name;
          body.appendChild(el('div.g-dt',
            el('div.g-dt__t', {
              html: m.name + (isMe ? '<span class="g-you">你</span>' : ''),
            }),
            el('div.g-dt__w.is-off', { text: m.role }),
            el('div.g-dt__w' + (m.vehicleId ? '' : '.is-off'), { text: m.vehicleId ? carLabel(D, m.vehicleId) : '待定' }),
            el('div.g-dt__v', { text: m.seatNo === 'driver' ? '司机' : m.seatNo == null ? '—' : String(m.seatNo) }),
            m.audit === '已通过'
              ? el('div.g-dt__v', toggleFor(m, true))
              : el('div.g-dt__w.is-off', { text: m.audit })));
        });
      body.appendChild(lockLine('口径',
        '「座位」列司机标「司机」，未分配车辆标「—」；待审核与候补不给签到开关。', null));
    }

    if (tab === 'car') {
      body.appendChild(sub('分车', '每车 4 座 + 司机'));
      body.appendChild(el('div.g-cars', ...D.vehicles.map(vehicleCard)));
      body.appendChild(actions('演示操作，不会真实调整座位。',
        el('button.btn.btn--sm', {
          type: 'button', text: '自动排座', disabled: locked,
          onclick: () => ui.toast('已按待定成员重排座位（演示）'),
        })));
    }

    if (tab === 'site') {
      const here = roster.filter((m) => m.audit === '已通过' && m.checked);
      const wait = roster.filter((m) => m.audit === '已通过' && !m.checked);
      body.appendChild(sub('现场签到',
        here.length + ' / ' + (here.length + wait.length) + ' · 待到 ' + wait.length));
      if (!here.length && !wait.length) {
        body.appendChild(stateBlock('users', '现场还没有人', '成员签到后会在这里按名单顺序出现。'));
      } else {
        body.appendChild(el('div.g-mates',
          ...wait.map((m, i) => memberRow(m, i)),
          ...here.map((m, i) => memberRow(m, wait.length + i))));
        body.appendChild(actions(null,
          el('button.btn.btn--sm', {
            type: 'button', text: '撤销全部', disabled: locked || !here.length,
            onclick: () => {
              if (locked) return;
              roster.forEach((m) => { if (m.checked) { m.checked = false; m.checkedAt = undefined; } });
              ui.toast('已撤销全部签到（演示）');
              paintCounts();
              paintWho();
              paintSeg();
              paintTab();
            },
          })));
      }
    }

    paintNext(s);
  }

  /* --- 03 下一步：原位重建，保证页面里永远只有一个下一步块 --- */
  function paintNext(s) {
    const next = el('div.g-zone',
      el('div.g-zone__tab',
        el('div.g-zone__no', { text: no2(3) }),
        el('div.g-zone__name', { text: '下一步' }),
        el('div.g-zone__meta', { text: departureSent ? '已发起' : '待发起' })),
      el('div.g-zone__body',
        el('div.g-next',
          kick(base.phase + ' · 现场'),
          el('div.g-next__text', {
            text: departureSent
              ? '出发确认已发出，等待 4 位车长回复（演示）'
              : base.nextStep,
          }),
          el('div.g-rows',
            row('待到', String(s.unchecked), '人', '占通过人数 '
              + Math.round((s.unchecked / Math.max(1, s.approved)) * 100) + '%'),
            row('未排车', String(s.noVehicle), '人'),
            row('已签到', String(s.checked), '人', '更新于 22:10')),
          el('button.btn.btn--primary.g-next__cta' + (departureSent ? '.is-sent' : ''), {
            type: 'button', disabled: locked || departureSent,
            onclick: () => {
              if (locked || departureSent) return;
              departureSent = true;
              ui.toast('出发确认已发起，等待 4 位车长回复（演示）');
              paintNext(tally(roster));
            },
          }, el('span', { text: departureSent ? '确认已发起' : '发起出发确认' }), icon('arrow-right'))),
        actions('演示数据，不会真的发通知。',
          link('回到发现页', () => ui.go('discover')))));
    const old = page.querySelector('.g-zone--next');
    next.classList.add('g-zone--next');
    if (old) page.replaceChild(next, old);
    else page.appendChild(next);
  }

  paintSeg();
  paintCounts();
  paintWho();
  paintTab();
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   4. 天气 — 气象卡
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

/** 由该小时的真实数值推导判定（与读数、窗口共用同一套口径） */
function verdictOf(d) {
  if (d.precip >= 60) return '不宜停留';
  if (d.wind >= 5) return '风偏大';
  if (d.cloud <= 40 && d.precip < 30) return '较通透';
  if (d.cloud >= 80) return '云厚';
  return '条件一般';
}

/** 关键窗口上缘短条：云海 = 品牌橙（图形通道），降雨 = 信息色 */
const bandInk = (note) => (note === '云海窗口' ? 'var(--g-orange)' : 'var(--lab-info)');
const bandSw = (note) => 'g-legend__sw--' + (note === '云海窗口' ? 'cloud' : 'rain');

/** 曲线 + 降水柱 + 夜间底纹 + 关键窗口顶条 + 逐日分隔（温度线用墨色：橙留给折线与指示） */
function sparkSVG(hours, lo, hi, bands) {
  const W = SPARK.w, H = SPARK.h, R = SPARK.right, T = SPARK.top, B = SPARK.bottom;
  const n = hours.length;
  const plotW = W - R;
  const px = (i) => (plotW * i) / (n - 1);
  const py = (t) => T + (H - T - B) * (1 - (t - lo) / ((hi - lo) || 1));
  let s = '';

  let run = null;
  hours.forEach((d, i) => {
    if (d.night && run === null) run = i;
    if ((!d.night || i === n - 1) && run !== null) {
      const to = d.night ? i : i - 1;
      if (to > run) {
        const x = px(run) - plotW / (n - 1) / 2;
        const w = px(to) - px(run) + plotW / (n - 1);
        s += '<rect x="' + x.toFixed(1) + '" y="' + T + '" width="' + w.toFixed(1) + '" height="'
          + (H - T - B).toFixed(1) + '" fill="var(--lab-surface-2)"/>';
      }
      run = null;
    }
  });

  [lo, (lo + hi) / 2, hi].forEach((t) => {
    s += '<line x1="0" y1="' + py(t).toFixed(1) + '" x2="' + plotW + '" y2="' + py(t).toFixed(1)
      + '" stroke="var(--lab-border)" stroke-width="1"/>';
  });

  hours.forEach((d, i) => {
    if (d.t.getHours() !== 0) return;
    s += '<line x1="' + px(i).toFixed(1) + '" y1="' + T + '" x2="' + px(i).toFixed(1) + '" y2="'
      + (H - B) + '" stroke="var(--lab-border)" stroke-width="1"/>';
  });

  hours.forEach((d, i) => {
    const bh = Math.max(1, (d.precip / 100) * 24);
    s += '<rect x="' + (px(i) - 1.6).toFixed(1) + '" y="' + (H - B - bh).toFixed(1)
      + '" width="3.2" height="' + bh.toFixed(1) + '" fill="var(--lab-info)" fill-opacity=".34"/>';
  });

  const path = hours.map((d, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(d.temp).toFixed(1)).join('');
  s += '<path d="' + path + '" fill="none" stroke="var(--lab-border-strong)"'
    + ' stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';

  bands.forEach((b) => {
    const x = px(b.from) - plotW / (n - 1) / 2;
    const w = px(b.to) - px(b.from) + plotW / (n - 1);
    s += '<rect x="' + x.toFixed(1) + '" y="' + T + '" width="' + w.toFixed(1) + '" height="3" fill="'
      + bandInk(b.note) + '"/>';
  });

  s += '<text x="' + (plotW + 4) + '" y="' + (py(hi) + 4).toFixed(1) + '" font-size="11"'
    + ' fill="var(--lab-text-3)" font-family="inherit">' + hi.toFixed(1) + '</text>';
  s += '<text x="' + (plotW + 4) + '" y="' + (py((lo + hi) / 2) + 4).toFixed(1) + '" font-size="11"'
    + ' fill="var(--lab-text-3)" font-family="inherit">' + ((lo + hi) / 2).toFixed(1) + '</text>';
  s += '<text x="' + (plotW + 4) + '" y="' + (py(lo) + 4).toFixed(1) + '" font-size="11"'
    + ' fill="var(--lab-text-3)" font-family="inherit">' + lo.toFixed(1) + '</text>';
  hours.forEach((d, i) => {
    if (d.t.getHours() % 6) return;
    const isDay = d.t.getHours() === 0;
    const label = isDay ? (d.t.getMonth() + 1) + '/' + d.t.getDate() : pad2(d.t.getHours()) + ':00';
    /* 首尾刻度贴边对齐，避免居中锚点把「10/18」切掉一半 */
    const anchor = i === 0 ? 'start' : (px(i) > plotW - 24 ? 'end' : 'middle');
    s += '<text x="' + px(i).toFixed(1) + '" y="' + (H - 6) + '" font-size="11" text-anchor="' + anchor
      + '" fill="var(--lab-text-3)" font-family="inherit">' + label + '</text>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" aria-hidden="true">' + s + '</svg>';
}

/** 读数格：「云海 55%」拆成数字 + 单位，数字右对齐成一列 */
function measureCell(raw) {
  const m = /^(\D*?)([\d.]+)(\D*)$/.exec(String(raw).trim());
  if (!m) return el('div.g-dt__w.is-off', { text: String(raw) });
  return el('div.g-dt__v',
    el('span', { text: m[2] }),
    m[3] ? el('span.g-dt__u', { text: m[3].trim() }) : null);
}

/** 数据表行：时段 + 四项读数（单位退位） */
function dtRow(t, cells, cls) {
  return el('div.g-dt' + (cls ? '.' + cls : ''),
    el('div.g-dt__t', { text: t }),
    ...cells);
}

function weatherSkeleton() {
  return frag(
    el('div.g-brief',
      el('div.g-brief__top', skel(11, '68%'), skel(11, '26%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(24, '86%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(15, '96%')),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(15, '64%'))),
    zone(1, '出发窗口', '48 小时读数', [
      ...Array.from({ length: 5 }, () => el('div.g-row',
        skel(13, '30%'), el('div', { style: { marginLeft: 'auto' } }, skel(13, '38%')))),
    ]),
    zone(2, '48 小时曲线', '未载入', [
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(112, '100%')),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } },
        ...Array.from({ length: 6 }, () => el('div.g-dt.g-dt--read',
          skel(11, '36%'), el('div', { style: { marginLeft: 'auto' } }, skel(13, '28%'))))),
    ]));
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.g-weather');
  const { meta, hours } = D.weather;
  const locked = flag === 'disabled';
  /* 脚注首词已是「演示数据」，来源行再起一次就是同一句话说两遍；去掉重复前缀 */
  const weatherSource = String(meta.source).replace(/^演示数据\s*·\s*/, '');

  if (flag === 'empty') {
    page.appendChild(el('div.g-brief',
      el('div.g-brief__top',
        kick('天气简报 · ' + meta.location),
        kick(meta.updatedText))));
    page.appendChild(el('div.g-state.g-state--fill',
      sub('出发窗口', '未载入'),
      stateBlock('cloud', '数据缺失', '这条路线暂时没有关联的气象站点，出发前请以现场实况为准。',
        '重试', () => ui.toast('已重试（演示）'), 'quiet')));
    page.appendChild(lockLine('来源', weatherSource, null));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(el('div.g-brief',
      el('div.g-brief__top',
        kick('天气简报 · ' + meta.location),
        kick(meta.updatedText))));
    page.appendChild(el('div.g-state.g-state--fill',
      sub('出发窗口', '未载入'),
      stateBlock('alert', '加载失败，请检查网络', '预报数据没能取回来。',
        '重试', () => ui.toast('已重试（演示）'), 'error')));
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

  page.appendChild(el('header.g-brief',
    el('div.g-brief__top',
      kick('天气简报 · ' + meta.location),
      kick(meta.updatedText)),
    el('h1.g-brief__title', { text: meta.verdict }),
    el('p.g-brief__stand', { text: meta.detail })));

  /* --- 01 出发窗口：规格行 + 决策条（一屏一次的 32/700 大读数） --- */
  const winStart = /(\d{1,2}):(\d{2})/.exec(win[0] || '');
  const winAt = winStart
    ? new Date(2025, 9, 19, Number(winStart[1]), Number(winStart[2]))
    : null;
  const toWindow = winAt ? Math.max(0, Math.round((winAt - DEMO_NOW) / 60000)) : 0;
  const winClock = toWindow >= 1440
    ? Math.floor(toWindow / 1440) + ' 天 ' + pad2(Math.floor((toWindow % 1440) / 60)) + ' 时'
    : pad2(Math.floor(toWindow / 60)) + ' 时 ' + pad2(toWindow % 60) + ' 分';

  page.appendChild(zone(1, '出发窗口', fmt(hours.length) + ' 条读数', [
    el('div.g-rows',
      row('出发窗口', win[0], '', meta.location),
      row('站点海拔', fmt(meta.elevationM), 'm'),
      row('48h 温度', lo.toFixed(1) + '–' + hi.toFixed(1), '℃',
        '最低 ' + hours[trough(temps)].label.slice(-5)),
      row('48h 风', Math.min(...winds).toFixed(1) + '–' + Math.max(...winds).toFixed(1), 'm/s',
        '峰值 ' + hours[peak(winds)].label.slice(-5)),
      row('48h 云量', Math.min(...clouds) + '–' + Math.max(...clouds), '%',
        '最低 ' + hours[trough(clouds)].label.slice(-5)),
      row('48h 降水', Math.min(...precip) + '–' + Math.max(...precip), '%',
        '峰值 ' + hours[peak(precip)].label.slice(-5))),
    el('div.g-decide',
      el('div.g-decide__k', { text: '距出发窗口' }),
      el('div.g-decide__row',
        el('div.g-big',
          el('span', { text: winClock.split(' ')[0] }),
          el('span.g-big__u', { text: winClock.split(' ').slice(1).join(' ') })),
        el('div.g-dt__w.is-off', { text: win[1] })),
      el('div.g-decide__text', {
        text: '按「' + win[0] + '」在山顶等候 —— 这是 48 小时里最通透的一段；'
          + '周日下午转小到中雨，建议上午完成下撤。',
      })),
  ], true));

  /* --- 02 48 小时曲线 + 读数面板 --- */
  const legend = el('div.g-legend',
    el('span.g-legend__item', el('i.g-legend__sw.g-legend__sw--temp'), el('span', { text: '折线 温度 ℃' })),
    el('span.g-legend__item', el('i.g-legend__sw.g-legend__sw--precip'), el('span', { text: '柱形 降水 %' })),
    el('span.g-legend__item', el('i.g-legend__sw.g-legend__sw--night'), el('span', { text: '底纹 夜间' })));
  const bandNote = el('div.g-legend__note',
    el('span', { text: '上缘短条 ' }),
    ...bands.map((b) => el('span',
      el('i.g-legend__sw.' + bandSw(b.note)),
      el('span', {
        text: b.note + ' ' + hours[b.from].label.slice(0, 5) + ' ' + hours[b.from].label.slice(-5)
          + '–' + hours[b.to].label.slice(-5) + '  ',
      }))));

  const cursor = el('div.g-spark__cursor');
  const dot = el('i.g-spark__dot');
  const tagNode = el('div.g-spark__tag');
  cursor.appendChild(dot);
  cursor.appendChild(tagNode);
  const rail = el('div.g-spark__rail' + (locked ? '.is-locked' : ''));
  const readout = el('div.g-readout');

  hours.forEach((d, i) => {
    rail.appendChild(el('button.g-spark__hit' + (i === sel ? '.is-on' : ''), {
      type: 'button', 'aria-label': d.label + ' ' + d.temp + ' 摄氏度',
      onclick: () => { if (locked) return; sel = i; paint(); paintDayRows(); },
    }));
  });

  page.appendChild(zone(2, '48 小时曲线', fmt(hours.length) + ' 条 · 点选读数', [
    legend,
    el('div.g-spark',
      el('div.g-spark__plot', { html: sparkSVG(hours, lo, hi, bands) }),
      cursor,
      rail),
    bandNote,
    readout,
  ]));

  function paint() {
    const d = hours[sel];
    const xPct = (sel / (hours.length - 1)) * ((SPARK.w - SPARK.right) / SPARK.w) * 100;
    const yPct = ((SPARK.top + (SPARK.h - SPARK.top - SPARK.bottom)
      * (1 - (d.temp - lo) / ((hi - lo) || 1))) / SPARK.h) * 100;
    cursor.style.left = xPct.toFixed(2) + '%';
    dot.style.top = yPct.toFixed(2) + '%';
    /* 读数贴在游标上，「点」与「数」从此不可能不一致 */
    tagNode.textContent = d.temp.toFixed(1) + '℃';
    tagNode.classList.toggle('is-left', xPct > 55);
    [...rail.children].forEach((n, i) => n.classList.toggle('is-on', i === sel));

    readout.innerHTML = '';
    [
      ['温度', d.temp.toFixed(1), '℃'],
      ['降水概率', String(d.precip), '%'],
      ['风速', d.wind.toFixed(1), 'm/s'],
      ['云量', String(d.cloud), '%'],
      ['判定', verdictOf(d), ''],
      ['关键时段', d.keyNote || '—', ''],
    ].forEach(([k, v, u]) => {
      readout.appendChild(el('div.g-dt.g-dt--read',
        el('div.g-dt__t', { text: k }),
        u
          ? el('div.g-dt__v', el('span', { text: v }), el('span.g-dt__u', { text: u }))
          : el('div.g-dt__w', { text: v })));
    });
  }

  /* --- 03 日卡：48 条读数按自然日分组 --- */
  const days = [];
  hours.forEach((d) => {
    const key = (d.t.getMonth() + 1) + '/' + d.t.getDate();
    let g = days.find((x) => x.key === key);
    if (!g) { g = { key: key, w: wkOf(d.t), list: [] }; days.push(g); }
    g.list.push(d);
  });
  const dayCards = el('div.g-days');
  days.forEach((g) => {
    const t = g.list.map((d) => d.temp);
    /* 每 6 小时取一条；首日若不足一格（22:00 起只有两小时），退回逐小时列全 */
    let marks = g.list.filter((d) => d.t.getHours() % 6 === 0);
    if (!marks.length) marks = g.list.slice();
    dayCards.appendChild(el('div.g-day',
      el('div.g-day__head',
        el('div.g-day__date', { text: g.key }),
        el('div.g-day__w', { text: g.w }),
        el('div.g-day__meta', {
          text: Math.min(...t).toFixed(1) + '–' + Math.max(...t).toFixed(1) + '℃ · '
            + g.list.length + ' 条',
        })),
      el('div.g-dt.g-dt--head',
        el('div.g-dt__k', { text: '时段' }),
        el('div.g-dt__k', { text: '温度' }),
        el('div.g-dt__k', { text: '降水' }),
        el('div.g-dt__k', { text: '风速' }),
        el('div.g-dt__k', { text: '云量' })),
      el('div.g-day__rows',
        ...marks.map((d) => {
          const row = dtRow(pad2(d.t.getHours()) + ':00', [
            el('div.g-dt__v', el('span', { text: d.temp.toFixed(1) }), el('span.g-dt__u', { text: '℃' })),
            el('div.g-dt__v', el('span', { text: String(d.precip) }), el('span.g-dt__u', { text: '%' })),
            el('div.g-dt__v', el('span', { text: d.wind.toFixed(1) }), el('span.g-dt__u', { text: 'm/s' })),
            el('div.g-dt__v', el('span', { text: String(d.cloud) }), el('span.g-dt__u', { text: '%' })),
          ]);
          row.dataset.hour = String(hours.indexOf(d));
          return row;
        }))));
  });
  function paintDayRows() {
    dayCards.querySelectorAll('.g-day__rows .g-dt').forEach((r) => {
      r.classList.toggle('is-on', Number(r.dataset.hour) === sel);
    });
  }

  page.appendChild(zone(3, '日卡', fmt(days.length) + ' 天 · 每 6 小时一行', [
    dayCards,
  ]));

  /* --- 04 窗口判定：编辑部给的窗口 + 由 keyNote 推出的其余窗口 --- */
  const bandOf = (i) => bands.find((b) => i >= b.from && i <= b.to) || bands[0];
  const avg = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;

  function winRow(label, judge, cells, band) {
    const node = el('div.g-dt.g-dt--win' + (locked ? '.is-locked' : ''),
      { role: 'button', tabindex: locked ? '-1' : '0' },
      el('div.g-dt__t', { text: label }),
      el('div.g-dt__w', { text: judge }),
      ...cells);
    tap(node, () => {
      if (locked || !band) return;
      sel = Math.min(band.from + 2, band.to);
      paint();
      paintDayRows();
    });
    return node;
  }

  const winWrap = el('div.g-wins',
    el('div.g-dt.g-dt--win.g-dt--head',
      el('div.g-dt__k', { text: '时段' }),
      el('div.g-dt__k', { text: '判定' }),
      el('div.g-dt__k', { text: '云海' }),
      el('div.g-dt__k', { text: '风' }),
      el('div.g-dt__k', { text: '降水' })));

  meta.window.forEach((w, i) => {
    const band = bandOf(i);
    winWrap.appendChild(winRow(w[0], w[1], [
      measureCell(w[2]),
      measureCell(w[3]),
      band
        ? el('div.g-dt__v', {
          html: Math.round(avg(hours.slice(band.from, band.to + 1).map((h) => h.precip)))
            + '<span class="g-dt__u">%</span>',
        })
        : el('div.g-dt__w.is-off', { text: '—' }),
    ], band));
  });

  bands.forEach((b) => {
    if (b.note === '云海窗口') return;
    const slice = hours.slice(b.from, b.to + 1);
    winWrap.appendChild(winRow(
      hours[b.from].label.slice(0, 5) + ' ' + hours[b.from].label.slice(-5)
      + '–' + hours[b.to].label.slice(-5),
      b.note,
      [
        el('div.g-dt__v', { html: Math.round(avg(slice.map((h) => h.cloud))) + '<span class="g-dt__u">%</span>' }),
        el('div.g-dt__v', { html: avg(slice.map((h) => h.wind)).toFixed(1) + '<span class="g-dt__u">m/s</span>' }),
        el('div.g-dt__v', { html: Math.round(avg(slice.map((h) => h.precip))) + '<span class="g-dt__u">%</span>' }),
      ],
      b));
  });

  page.appendChild(zone(4, '窗口判定',
    meta.window.length + ' 条编辑部 + ' + Math.max(0, bands.length - 1) + ' 条数据推出', [
      winWrap,
      el('div.g-zone__caption', { text: '点一行可跳到该时段的曲线读数；数值由 48 小时数据逐时算出。' }),
    ]));

  paint();
  paintDayRows();

  if (locked) {
    page.appendChild(lockLine('只读快照', '这是出发前的静态快照，逐时点选与窗口跳转已暂停。', 'info'));
  }
  page.appendChild(lockLine('来源', weatherSource, null));
  page.appendChild(foot(D));
  return page;
}
