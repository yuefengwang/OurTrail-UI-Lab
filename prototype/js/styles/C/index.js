// =============================================================
// Style C — Quiet Terrain 静野
// 低刺激 · 色调带分组 · 留白节奏 · 字重 ≤600 · 无投影无描边列表
// 全部消费 --lab-* 令牌；对比度派生量见 css/styles/C.css 顶部说明。
//
// 第二轮打磨（Round 2）的分工原则：
//   chip 里的计数回答"每个分类有多少条"，计数行只回答"现在列出几条"；
//   列表行把标题 / 状态 / 事实拉成三级层次，数字一律 tabular；
//   天气把每天的温度带提为独立一行，曲线补上换日发丝线与极值标注；
//   协作把 17 行成员的状态点与时间戳钉成一条右对齐的扫读线。
// =============================================================
import { el, icon, photo } from '../../render-common.js';

const TAIL = '同一演示数据 · 七风格对照实验';
const PHOTO_DIR = 'assets/photos/';
const COUNTDOWN = '距出发 5 分钟';   // 演示用静态倒计时（对齐演示时刻 22:05）
const SOON = '出发前 5 分钟';            // 集合收尾文案（演示静态）
const CTA = { idle: '立即报名', loading: '提交中…', done: '已报名 · 待审核' };
const COVER = (a) => PHOTO_DIR + a.cover;

/* ---------------- 通用零件 ---------------- */

// 页面左右内边距直接读令牌，让天气曲线 viewBox 与版心 1:1（不硬编码 22）
function pagePad() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--lab-page-x');
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 22;
}

function foot(D) { return el('div.footnote', { text: `${D.credit} · ${TAIL}` }); }

function kicker(text, side) {
  return el('div.c-kicker',
    el('span', { text }),
    side ? el('span.c-kicker__side', { text: side }) : null);
}

function head(title, sub) {
  return el('header.c-head',
    el('h1.c-head__title', { text: title }),
    el('p.c-head__sub', { text: sub }));
}

function dot(tone) { return el('i.c-dot' + (tone ? '.' + tone : '')); }

// 状态 = 文字 + 小圆点（不做彩底标签）
function statusWord(text, tone, quiet) {
  const cls = ['c-status', tone ? 'is-' + tone : '', quiet ? 'is-quiet' : ''].filter(Boolean).join('.');
  return el('span.' + cls, dot(tone), el('span', { text }));
}

function band(...kids) { return el('div.c-band', ...kids); }

function note(text) { return el('div.note.c-note', icon('info'), el('span', { text })); }

function stateBlock({ ico = 'info', tone = '', title, body, action }) {
  return el('div.c-state' + (tone ? '.is-' + tone : ''),
    icon(ico),
    el('div.c-state__title', { text: title }),
    body ? el('div.c-state__body', { text: body }) : null,
    action ? el('div.c-state__action', action) : null);
}

function errorState(ctx) {
  return stateBlock({
    ico: 'alert', tone: 'error',
    title: '加载失败，请检查网络',
    body: '演示环境不会真的发起请求，这里只演示出错时页面如何保持安静。',
    action: el('button.btn.btn--primary', { type: 'button', text: '重试', onclick: () => ctx.ui.toast('已重试（演示）') }),
  });
}

function skel(kind, width) {
  return el('div.skeleton.c-skel-' + kind, width ? { style: { width } } : null);
}

// 骨架按真实结构铺，避免"一排空卡片"
function skelItem() {
  return el('div.c-skel-row',
    skel('thumb'),
    el('div.c-skel-lines', skel('line', '70%'), skel('line', '44%')));
}
function skelMember() {
  return el('div.c-skel-member', skel('line', '38%'), skel('line', '22%'));
}
function skelPair() {
  return el('div.c-skel-pair', skel('line'), skel('line', '58%'));
}

function clickable(node, fn) {
  node.setAttribute('role', 'button');
  node.setAttribute('tabindex', '0');
  node.addEventListener('click', fn);
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  });
  return node;
}

/* ============================================================
   发现 — 平静清单
   ============================================================ */
export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const acts = D.activities;
  const f = acts[0];
  const page = el('div.page');
  page.appendChild(head('发现', `共 ${acts.length} 项活动，按出发时间从近到远排列。`));

  if (flag === 'error') { page.appendChild(errorState(ctx)); page.appendChild(foot(D)); return page; }
  if (flag === 'empty') {
    page.appendChild(stateBlock({
      ico: 'search', title: '没有符合条件的活动',
      body: '换个关键词，或把筛选放宽一些。已报名与已结束的线路会一直保留。',
      action: el('button.btn.btn--primary', { type: 'button', text: '清空筛选', onclick: () => ui.setFlag('') }),
    }));
    page.appendChild(foot(D)); return page;
  }
  if (flag === 'loading') {
    page.appendChild(skel('head'));
    page.appendChild(el('div.c-skel-stack', skel('line', '58%'), skel('line', '40%')));
    page.appendChild(skel('band'));
    page.appendChild(el('div.c-skel-stack', skelItem(), skelItem(), skelItem()));
    page.appendChild(foot(D)); return page;
  }

  const lock = flag === 'disabled';

  // 「最近出发」色调带
  page.appendChild(band(
    kicker('最近出发', f.weekdayText),
    el('p.c-band__title', { text: f.title }),
    el('p.c-band__line', { text: `${f.dateText} · ${f.timeText} · ${f.city}` }),
    el('p.c-band__line', { text: `还剩 ${f.seatsTotal - f.signedCount} 个名额 · 报名截止 ${f.deadlineText}` }),
    clickable(el('button.c-link', { type: 'button' }, '查看安排', icon('arrow-right')), () => ui.go('detail')),
  ));

  if (lock) page.appendChild(note('报名已截止的活动不再变动，筛选与搜索暂时锁定（演示）。'));

  // 筛选：chip 内嵌各自分类的条目数
  const chips = [
    { k: 'all', label: '全部', hit: () => true },
    { k: 'open', label: '可报名', hit: (a) => a.statusKey === 'open' || a.statusKey === 'hot' },
    { k: 'formed', label: '已成行', hit: (a) => a.statusKey === 'formed' },
    { k: 'ended', label: '已结束', hit: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
  ];
  // chip 上的计数以"点下去会列出几条"为准：最近出发那条已在上面的带里，
  // 不计入清单，否则 chip 的 5 和计数行的 4 会互相打脸。
  const rest = acts.slice(1);
  const chipCount = chips.map((c) => rest.filter(c.hit).length);
  let filter = 'all';
  let query = '';

  const input = el('input', {
    type: 'search', placeholder: '搜索线路或城市', 'aria-label': '搜索活动',
    disabled: lock ? true : null,
  });
  const chipNodes = chips.map((c, i) => el('button.c-chip', {
    type: 'button', 'aria-pressed': 'false',
    disabled: lock ? true : null,
    onclick: () => { if (lock) return; filter = c.k; apply(); },
  },
    el('span.c-chip__label', { text: c.label }),
    el('span.c-chip__n', { text: String(chipCount[i]) })));
  const count = el('p.c-count');
  const list = el('div.c-list');
  let firstPaint = true;

  const controls = el('div.c-controls' + (lock ? '.is-off' : ''),
    el('div.c-search', icon('search'), input),
    el('div.c-chips', { role: 'group', 'aria-label': '按状态筛选' }, ...chipNodes));
  page.appendChild(controls);
  page.appendChild(count);
  page.appendChild(list);

  input.addEventListener('input', () => { query = input.value.trim(); apply(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });

  function matches(a) {
    if (!chips.find((c) => c.k === filter).hit(a)) return false;
    if (!query) return true;
    return (a.title + a.routeName + a.city + a.leader).toLowerCase().includes(query.toLowerCase());
  }

  function itemNode(a) {
    const left = a.seatsTotal - a.signedCount;
    const word = a.statusKey === 'open' ? '可报名'
      : a.statusKey === 'hot' ? '名额紧张'
        : a.statusKey === 'formed' ? '已成行'
          : a.statusKey === 'ended' ? '已结束' : '已取消';
    const tone = a.statusKey === 'open' ? 'ok'
      : a.statusKey === 'hot' ? 'warn'
        : a.statusKey === 'cancelled' ? 'bad' : 'off';
    // 名额单独成列：可报名看余量，成行看已成团的人数，已结束/取消不占位
    const seat = a.statusKey === 'open' || a.statusKey === 'hot'
      ? el('span.c-item__left', { text: `剩 ${left}` })
      : a.statusKey === 'formed'
        ? el('span.c-item__left', { text: `${a.signedCount}/${a.seatsTotal}` })
        : null;
    return clickable(el('div.c-item',
      photo(COVER(a), { alt: a.title, cls: 'c-thumb' }),
      el('div.c-item__body',
        el('span.c-item__title', { text: a.title }),
        el('span.c-item__fact', { text: `${a.dateText} · ${a.timeText} · ${a.city}` }),
        el('span.c-item__fact', { text: `${a.distanceKm} km · ↑${a.ascentM} m · ${a.difficulty} · 领队 ${a.leader}` }),
        el('span.c-item__state', dot(tone),
          el('span.c-item__word', { text: word, class: tone === 'bad' ? 'c-ink-bad' : '' }),
          seat ? el('span.c-item__sep', { text: '·' }) : null,
          seat)),
      ), () => ui.go('detail'));
  }

  function apply() {
    const rows = rest.filter(matches);
    list.innerHTML = '';
    if (rows.length) rows.forEach((a) => list.appendChild(itemNode(a)));
    else list.appendChild(el('p.c-list__none', { text: '没有匹配的线路。' }));
    // 计数行只讲"现在列出几条"，分类规模由 chip 里的数字承担
    count.textContent = query
      ? `匹配「${query}」${rows.length} 项`
      : filter === 'all'
        ? `其余 ${rows.length} 项`
        : `${chips.find((c) => c.k === filter).label} ${rows.length} 项`;
    chipNodes.forEach((node, i) => {
      const on = chips[i].k === filter;
      node.classList.toggle('is-on', on);
      node.setAttribute('aria-pressed', String(on));
    });
    // 首次渲染不做入场，避免首屏抖动；交互切换才淡入
    if (firstPaint) firstPaint = false;
    else {
      list.classList.remove('is-swap');
      void list.offsetWidth;
      list.classList.add('is-swap');
    }
  }
  apply();

  page.appendChild(foot(D));
  return page;
}

/* ============================================================
   详情 — 舒缓叙事
   ============================================================ */
export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const f = D.featured;
  const page = el('div.page');

  page.appendChild(el('div.c-hero',
    photo(COVER(f), { alt: f.title, credit: 'Unsplash', cls: 'c-hero__ph' }),
    el('div.c-hero__veil'),
    el('div.c-hero__meta',
      el('span', { text: `${f.dateText} ${f.weekdayText} · ${f.timeText}` }),
      el('span.c-hero__state', el('i.c-hero__dot'), el('span', { text: f.status }))),
  ));
  page.appendChild(el('h1.c-lede-title', { text: f.title }));
  page.appendChild(el('p.c-lede', { text: f.lede }));

  if (flag === 'error') { page.appendChild(errorState(ctx)); page.appendChild(foot(D)); return page; }
  if (flag === 'empty') {
    page.appendChild(stateBlock({
      ico: 'x', tone: 'error', title: '这次活动已取消',
      body: '取消原因会随通知发给已报名成员；线路记录仍保留在历史里。',
      action: el('button.btn.btn--primary', { type: 'button', text: '去看看其他活动', onclick: () => ui.go('discover') }),
    }));
    page.appendChild(foot(D)); return page;
  }
  if (flag === 'loading') {
    page.appendChild(el('div.c-skel-stack', skel('line', '96%'), skel('line', '88%'), skel('line', '70%')));
    page.appendChild(el('div.c-skel-stack', skelPair(), skelPair(), skelPair(), skelPair()));
    page.appendChild(el('div.c-skel-stack', skel('line', '92%'), skel('line', '64%')));
    page.appendChild(foot(D)); return page;
  }

  const lock = flag === 'disabled';
  const itin = f.itinerary || [];
  const weave = (nodes) => el('p.c-prose', nodes.flatMap((n, i) => [
    el('span.c-time.num', { text: n[0] }),
    document.createTextNode(' ' + n[1]),
    i < nodes.length - 1 ? el('span.c-sep', { text: '；' }) : null,
  ]));

  // 行程：2–3 段散文
  const chunks = [];
  for (let i = 0; i < itin.length; i += 3) chunks.push(itin.slice(i, i + 3));
  page.appendChild(el('section.c-sec',
    kicker('行程', `${itin.length} 个节点`),
    el('div.c-sec__body', chunks.map(weave)),
  ));

  // 集合与时间：标签定列 + 数字加粗 + 单位降一号
  const N = (t) => el('span.c-pair__n', { text: t });
  const U = (t) => el('span.c-pair__u', { text: t });
  const pairs = [
    ['集合', [f.meetingPoint]],
    ['集合时间', [N(f.meetingTime)]],
    ['出发', [N(f.timeText.slice(0, 5)), U(f.timeText.slice(5))]],
    ['报名截止', [f.deadlineText]],
    ['名额', [N(String(f.signedCount)), U(' / '), N(String(f.seatsTotal)), U(' 人已报名')]],
    ['领队', [f.leader]],
    ['难度', [f.difficulty]],
    ['里程', [N(one(f.distanceKm)), U(' km · ↑'), N(String(f.ascentM)), U(' m')]],
  ];
  page.appendChild(el('section.c-sec',
    kicker('集合与时间'),
    el('div.c-pairs', pairs.map(([k, v]) => el('div.c-pair',
      el('span.c-pair__k', { text: k }),
      el('span.c-pair__v', ...v)))),
  ));

  page.appendChild(el('section.c-sec',
    kicker('费用与约定'),
    el('p.c-quiet', { text: f.feeNote }),
  ));

  const people = D.roster.slice(0, 6);
  page.appendChild(el('section.c-sec',
    kicker('同行人', `共 ${D.roster.length} 人`),
    el('div.c-people', people.map((m) => el('div.c-person',
      el('span.c-person__name', { text: m.name }),
      el('span.c-person__meta', { text: `${m.role} · ${m.tripMode}` }),
      statusWord(m.audit,
        m.audit === '已通过' ? 'ok' : m.audit === '候补' ? 'warn' : m.audit === '待审核' ? 'warn' : 'off',
        m.audit === '已通过')))),
    el('p.c-quiet', { text: `另有 ${D.roster.length - people.length} 位成员已报名，完整名单在活动开始后于协作页可见。` }),
  ));

  page.appendChild(el('section.c-sec',
    kicker('装备与提醒'),
    el('div.c-soft', (f.requirements || []).map((r) => el('div.c-soft__item',
      el('i.c-soft__dot'), el('span', { text: r })))),
  ));

  if (lock) page.appendChild(note('报名已截止，本次不再接受新的申请。'));

  // 底部 sticky 主操作：默认 → 提交中 → 已报名 · 待审核（700ms 状态切换保持不变）
  const ctaLabel = el('span.c-cta__label', { text: CTA.idle });
  const cta = el('button.btn.btn--primary.btn--full', {
    type: 'button', 'data-testid': 'primary-cta',
  }, ctaLabel);
  if (lock) {
    cta.classList.add('is-disabled', 'is-quiet-btn');
    cta.setAttribute('disabled', '');
    cta.classList.remove('btn--primary');
  } else {
    let busy = false;
    cta.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      ctaLabel.textContent = CTA.loading;
      cta.classList.add('is-busy');
      cta.setAttribute('aria-busy', 'true');
      setTimeout(() => {
        busy = false;
        ctaLabel.textContent = CTA.done;
        cta.classList.remove('is-busy', 'btn--primary');
        cta.classList.add('is-quiet-btn');
        cta.removeAttribute('aria-busy');
        cta.setAttribute('disabled', '');
        cta.insertBefore(icon('check'), ctaLabel);
        ui.toast('报名成功，等待领队审核');
      }, 700);
    });
  }
  page.appendChild(el('div.c-dock',
    el('button.c-dock__share', { type: 'button', onclick: () => ui.toast('已生成分享卡片（演示）') },
      icon('share'), '分享'),
    cta,
  ));

  // 滚动后才亮出分隔线：静止时只有色调过渡，不留一条没有来由的孤线
  const syncDock = () => page.querySelector('.c-dock').classList.toggle('is-stuck', page.scrollTop > 6);
  page.addEventListener('scroll', syncDock, { passive: true });

  page.appendChild(foot(D));
  return page;
}

/* ============================================================
   协作 — 待办清单
   ============================================================ */
export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const f = D.featured;
  const page = el('div.page');
  const roster = D.roster.map((m) => ({ ...m }));
  const lock = flag === 'disabled';

  const tally = () => {
    const approved = roster.filter((m) => m.audit === '已通过');
    return { approved: approved.length, checked: approved.filter((m) => m.checked).length, noVehicle: approved.filter((m) => !m.vehicleId).length };
  };

  // 空态 / 错误态仍保留页面身份，避免整屏只剩一个方块
  if (flag === 'error' || flag === 'empty') {
    page.appendChild(head('集合清单', `${D.collab.phase} · ${f.title} · ${f.dateText} ${f.timeText}`));
  }

  if (flag === 'error') { page.appendChild(errorState(ctx)); page.appendChild(foot(D)); return page; }
  if (flag === 'empty') {
    page.appendChild(stateBlock({
      ico: 'users', title: '还没有成员加入',
      body: '把活动分享出去，有人报名后会出现在这份清单里。',
      action: el('button.btn.btn--primary', { type: 'button', text: '分享活动', onclick: () => ui.toast('已生成分享卡片（演示）') }),
    }));
    page.appendChild(foot(D)); return page;
  }
  if (flag === 'loading') {
    page.appendChild(skel('head'));
    page.appendChild(el('div.c-skel-stack', skel('line', '52%'), skel('line', '38%')));
    page.appendChild(skel('band'));
    page.appendChild(el('div.c-skel-stack', skelMember(), skelMember(), skelMember(), skelMember()));
    page.appendChild(foot(D)); return page;
  }

  const headline = el('h1.c-reassure');
  // 身份行：与空态/错误态 head() 同一套词汇（集合清单 · 活动名 · 日期），让整屏始终认得出这是哪一趟
  page.appendChild(el('header.c-head',
    el('p.c-identity',
      el('span.c-identity__label', { text: '集合清单' }),
      el('span', { text: f.title }),
      el('span.c-identity__meta', { text: `${f.dateText} ${f.weekdayText}` })),
    headline,
    el('div.c-subline',
      el('span.c-subline__phase', { text: D.collab.phase }),
      el('span.c-subline__eta', { text: COUNTDOWN }),
      el('span', { text: `${f.meetingTime} ${f.meetingPoint}` })),
  ));

  const bands = el('div.c-bands');

  // 集合点带
  const pointRatio = el('p.c-band__line');
  const meterFill = el('i.c-meter__fill');
  bands.appendChild(band(
    kicker('集合点'),
    el('p.c-band__title', { text: f.meetingPoint }),
    el('p.c-band__line', { text: `${f.meetingTime} 出发 · ${f.city} · ${COUNTDOWN}` }),
    pointRatio,
    el('div.c-meter', meterFill),
  ));

  // 成员清单
  const memberList = el('div.c-members');
  bands.appendChild(band(
    kicker('成员清单', `${roster.length} 人`),
    lock ? note('签到已关闭 · 有变动请联系领队') : null,
    memberList,
  ));

  // 车辆
  bands.appendChild(band(
    kicker('车辆', `${D.vehicles.length} 台`),
    el('div.c-veh', D.vehicles.map((v) => {
      const used = v.seats.filter(Boolean).length;
      return el('p.c-veh__line', { text: `${v.label} · ${v.plate} · 司机 ${v.driver} · ` },
        el('span', { text: `${used}/${v.capacity} 座 · ${used >= v.capacity ? '满员' : '有空位'}` }));
    })),
  ));

  // 下一步
  const nextText = el('p.c-band__line');
  bands.appendChild(band(
    kicker('下一步'),
    nextText,
    el('button.btn.btn--primary', {
      type: 'button', text: D.collab.nextAction,
      onclick: () => ui.toast('已发起出发确认（演示），等待成员确认'),
    }),
  ));

  page.appendChild(bands);

  const vehLabel = (id) => (D.vehicles.find((v) => v.id === id) || {}).label || '';
  let seq = 0;

  function seatText(m) {
    if (m.seatNo === 'driver') return '驾驶位';
    if (m.seatNo) return `${m.seatNo} 号座`;
    return '未安排车辆';
  }

  // 状态点语义：ok=已签到（实心）/ off=未签到（空心环）/ warn=未通过审核
  function stateOf(m) {
    if (m.audit !== '已通过') return { word: m.audit, tone: 'warn' };
    if (m.checked) return { word: `已签到 · ${m.checkedAt}`, tone: 'ok', quiet: true };
    return { word: '未签到', tone: 'off' };
  }

  function renderMember(m) {
    const tappable = m.audit === '已通过';
    const node = tappable
      ? el('button.c-member', { type: 'button', disabled: lock ? true : null })
      : el('div.c-member.is-static');
    const stateSlot = el('span.c-member__state');
    node.appendChild(el('span.c-member__main',
      el('span.c-member__name', { text: m.name }),
      el('span.c-member__meta', { text: `${m.role} · ${m.tripMode}${tappable ? ` · ${vehLabel(m.vehicleId)} ${seatText(m)}` : ''}` })));
    node.appendChild(stateSlot);
    if (tappable) {
      node.addEventListener('click', () => {
        if (lock) return;
        m.checked = !m.checked;
        if (m.checked) m.checkedAt = `22:4${1 + (seq % 9)}`;
        seq++;
        paint();
        ui.toast(m.checked ? `${m.name} 已签到 · ${m.checkedAt}` : `${m.name} 取消了签到`);
      });
    }
    memberList.appendChild(node);
    return node;
  }

  function paint() {
    const t = tally();
    headline.textContent = `${SOON} · ${t.approved - t.checked} 人未签到`;
    pointRatio.textContent = `已到 ${t.checked} 人 / 应到 ${t.approved} 人`;
    meterFill.style.width = `${Math.round((t.checked / Math.max(1, t.approved)) * 100)}%`;
    nextText.textContent = `还有 ${t.approved - t.checked} 人未到集合点，其中 ${t.noVehicle} 人未安排车辆。`;
    [...memberList.children].forEach((node, i) => {
      const m = roster[i];
      const s = stateOf(m);
      node.classList.toggle('is-done', !!m.checked);
      const slot = node.querySelector('.c-member__state');
      slot.textContent = '';
      slot.className = 'c-member__state';
      slot.appendChild(dot(s.tone));
      slot.appendChild(el('span', { text: s.word }));
      if (s.quiet) slot.classList.add('is-quiet');
    });
  }

  roster.forEach(renderMember);
  paint();

  page.appendChild(foot(D));
  return page;
}

/* ============================================================
   天气 — 温柔简报
   ============================================================ */
function svgEl(tag, attrs) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

const one = (n) => (Math.round(n * 10) / 10).toFixed(1);

// 48h 温度曲线：单色细线、无填充；补上换日发丝线、极值刻度与分层的时刻标注
function tempCurve(hours, width) {
  const W = width, H = 132, top = 24, bottom = 38;
  const temps = hours.map((h) => h.temp);
  const lo = Math.min(...temps), hi = Math.max(...temps);
  const span = Math.max(1, hi - lo);
  const x = (i) => 2 + (i * (W - 4)) / (hours.length - 1);
  const y = (t) => top + (1 - (t - lo) / span) * (H - top - bottom);
  const pts = hours.map((h, i) => [x(i), y(h.temp)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': '48 小时气温曲线' });

  // 换日发丝线：给时间轴一个"跨天"的读法
  hours.forEach((h, i) => {
    if (i === 0 || h.label.slice(0, 5) === hours[i - 1].label.slice(0, 5)) return;
    svg.appendChild(svgEl('line', {
      x1: pts[i][0].toFixed(1), x2: pts[i][0].toFixed(1),
      y1: top, y2: H - bottom, class: 'c-chart__grid',
    }));
  });

  svg.appendChild(svgEl('path', { d, class: 'c-chart__line' }));

  // 关键窗口：与小时条同一套空心环语言
  hours.forEach((h, i) => {
    if (!h.key) return;
    svg.appendChild(svgEl('circle', { cx: pts[i][0].toFixed(1), cy: pts[i][1].toFixed(1), r: 2.4, class: 'c-chart__dot' }));
  });

  // 极值：一小段竖刻 + 数值，不铺色块
  const mark = (i, label, dy) => {
    const px = pts[i][0], py = pts[i][1];
    svg.appendChild(svgEl('line', { x1: px.toFixed(1), x2: px.toFixed(1), y1: py - 5, y2: py + 5, class: 'c-chart__tick' }));
    const right = px < W - 46;
    const t = svgEl('text', {
      x: (px + (right ? 6 : -6)).toFixed(1), y: py + dy,
      class: 'c-chart__mark', 'text-anchor': right ? 'start' : 'end',
    });
    t.textContent = label;
    svg.appendChild(t);
  };
  mark(temps.indexOf(hi), `${one(hi)}°`, -8);
  mark(temps.indexOf(lo), `${one(lo)}°`, 15);

  // 时刻标注：四个锚点分得很开，日期与钟点分两级灰度
  [0, 14, 26, hours.length - 1].forEach((i, k) => {
    const anchor = k === 0 ? 'start' : k === 3 ? 'end' : 'middle';
    const [date, time] = hours[i].label.split(' ');
    const t = svgEl('text', { x: pts[i][0].toFixed(1), y: H - 8, class: 'c-chart__axis', 'text-anchor': anchor });
    const d1 = svgEl('tspan', {}); d1.textContent = date;
    const d2 = svgEl('tspan', { class: 'c-chart__axis-t' }); d2.textContent = time;
    t.appendChild(d1); t.appendChild(d2);
    svg.appendChild(t);
  });

  return { svg, lo, hi };
}

// 从 48 小时样本合成一天的自然语言（明天 / 后天 / 大后天）
// 返回结构化结果：lead 当天温度带（强调级），seg 逐句简报（次级）
function daySentence(hours, name, lastLabel) {
  if (!hours.length) {
    return {
      lead: null,
      seg: [{ text: `${name}在 48 小时预报之外；演示数据只覆盖到 ${lastLabel}，之后请以山顶实况与领队通知为准。` }],
    };
  }
  const hourOf = (h) => h.t.getHours();
  const clear = hours.reduce((a, b) => (b.cloud < a.cloud ? b : a));
  const windy = hours.reduce((a, b) => (b.wind > a.wind ? b : a));
  // 下撤建议只依据白天（06–18 时）的降水，避免在夜里谈"雨来之前"
  const daytime = hours.filter((h) => hourOf(h) >= 6 && hourOf(h) <= 18);
  const wetDay = (daytime.length ? daytime : hours).reduce((a, b) => (b.precip > a.precip ? b : a));
  const lo = Math.min(...hours.map((h) => h.temp));
  const hi = Math.max(...hours.map((h) => h.temp));
  const notes = [...new Set(hours.map((h) => h.keyNote).filter(Boolean))];
  const seg = [
    { time: clear.label.slice(6), text: `云量最低 ${clear.cloud}%` },
    // 下撤建议只出现在含「降雨」时段的下撤日（出发日白天按计划推进即可）
    wetDay.precip >= 50 && notes.includes('降雨')
      ? { time: wetDay.label.slice(6), text: `前后白天降水概率升到 ${wetDay.precip}%，建议中午前完成下撤` }
      : { text: `白天降水概率最高 ${wetDay.precip}%，可以按计划推进` },
  ];
  if (windy.wind >= 5) seg.push({ time: windy.label.slice(6), text: `风力最大 ${one(windy.wind)} m/s，脊线上风偏大` });
  if (notes.length) seg.push({ text: `窗口记为「${notes.join('、')}」` });
  return { lead: { lo: Math.round(lo), hi: Math.round(hi) }, seg };
}

function dayTextNode(seg) {
  const kids = [];
  seg.forEach((s, i) => {
    if (i) kids.push(el('span.c-sep', { text: '；' }));
    if (s.time) kids.push(el('span.c-time', { text: s.time }));
    kids.push(document.createTextNode((s.time ? ' ' : '') + s.text));
  });
  kids.push(document.createTextNode('。'));
  return el('p.c-prose.c-day__text', kids);
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const w = D.weather;
  const hours = w.hours;
  const page = el('div.page');

  page.appendChild(head(w.meta.verdict, `${w.meta.location} · 海拔 ${w.meta.elevationM} m`));
  page.appendChild(el('p.c-prose.c-lede', { text: w.meta.detail }));

  if (flag === 'error') { page.appendChild(errorState(ctx)); page.appendChild(foot(D)); return page; }
  if (flag === 'empty') {
    page.appendChild(stateBlock({
      ico: 'cloud', title: '暂时没有山顶天气数据',
      body: `${w.meta.elevationM} 米的点位数据依赖气象服务；演示数据集只提供了 48 小时样本。`,
      action: el('button.btn.btn--primary', { type: 'button', text: '刷新', onclick: () => ui.toast('已刷新（演示）') }),
    }));
    page.appendChild(foot(D)); return page;
  }
  if (flag === 'loading') {
    page.appendChild(skel('head'));
    page.appendChild(el('div.c-skel-stack', skel('line', '96%'), skel('line', '88%')));
    page.appendChild(el('div.c-skel-stack', skel('line', '42%'), skelPair(), skelPair()));
    page.appendChild(el('div.c-skel-stack', skelItem()));
    page.appendChild(foot(D)); return page;
  }

  if (flag === 'disabled') page.appendChild(note('只读快照：演示环境不提供实时刷新，页面内容为 48 小时样本。'));

  // 三段自然语言（明天 / 后天 / 大后天）
  const byDate = (d) => hours.filter((h) => h.label.slice(0, 5) === d);
  const days = [
    ['明天', '10/18', '10 月 18 日 周六 · 出发当天'],
    ['后天', '10/19', '10 月 19 日 周日 · 下撤当天'],
    ['大后天', '10/20', '10 月 20 日 · 预报范围之外'],
  ];
  page.appendChild(el('section.c-sec',
    kicker('接下来三天', w.meta.updatedText),
    el('div.c-days', days.map(([name, key, sub]) => {
      const s = daySentence(byDate(key), name, hours[hours.length - 1].label);
      return el('div.c-day',
        el('div.c-day__head',
          el('span.c-day__name', { text: name }),
          el('span.c-day__date', { text: sub })),
        s.lead ? el('p.c-day__lead', { text: `${s.lead.lo}–${s.lead.hi}°` }) : null,
        dayTextNode(s.seg));
    })),
  ));

  // 细线温度曲线
  const { svg, lo, hi } = tempCurve(hours, Math.round(ctx.vp - pagePad() * 2));
  page.appendChild(el('section.c-sec',
    kicker('48 小时气温', `最低 ${one(lo)}° · 最高 ${one(hi)}°`),
    el('div.c-chart', svg,
      el('div.c-chart__cap',
        el('span', { text: `○ 关键窗口 ${hours.filter((h) => h.key).length} 小时` }),
        el('span', { text: `${hours.length} 条逐小时样本` }))),
  ));

  // 小时条：点选任意一小时，下方安静详情行随之更新
  let current = hours.findIndex((h) => h.keyNote === '云海窗口');
  if (current < 0) current = 8;
  const detail = el('p.c-quiet');
  const strip = el('div.c-strip');
  const hourNodes = hours.map((h, i) => el('button.c-hour' + (h.key ? '.is-key' : ''), {
    type: 'button', 'aria-label': h.label, 'aria-pressed': 'false',
    onclick: () => { current = i; paintHour(true); },
  },
    el('span.c-hour__t', { text: String(h.t.getHours()).padStart(2, '0') }),
    el('span.c-hour__v', { text: `${Math.round(h.temp)}°` }),
    el('span.c-hour__dot'),
  ));
  strip.append(...hourNodes);

  function paintHour(scroll) {
    const h = hours[current];
    hourNodes.forEach((n, i) => {
      n.classList.toggle('is-on', i === current);
      n.setAttribute('aria-pressed', String(i === current));
    });
    detail.textContent = `${h.label} · 气温 ${one(h.temp)}° · 降水概率 ${h.precip}% · 风 ${one(h.wind)} m/s · 云量 ${h.cloud}%`
      + (h.keyNote ? ` · ${h.keyNote}` : '');
    // 只横向滚动小时条本身，不带动页面纵向滚动
    const on = hourNodes[current];
    if (scroll && strip.clientWidth) {
      strip.scrollLeft = Math.max(0, on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2);
    }
  }

  page.appendChild(el('section.c-sec',
    kicker('逐小时', '可点选'),
    strip,
    detail,
  ));

  // 窗口：安静文字行
  page.appendChild(el('section.c-sec',
    kicker('出发窗口', w.meta.source),
    el('div.c-windows', w.meta.window.map((row) => el('div.c-window',
      el('span.c-window__t', { text: row[0] }),
      el('span.c-window__v', { text: `${row[1]} · ${row[2]} · ${row[3]}` }),
    ))),
  ));

  paintHour(false);
  // 挂载后宽度才可用：把默认选中的那一小时滚到可见位置
  requestAnimationFrame(() => requestAnimationFrame(() => paintHour(true)));
  page.appendChild(foot(D));
  return page;
}