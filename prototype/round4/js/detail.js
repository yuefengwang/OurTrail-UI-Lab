// 活动详情 — Hybrid 设计语言（Round 3 胜出方案）
// 页面 = Hero Panel（16:9 封面 + 24px 叠压信息板）→ 行程时间轴 → 石色接缝带（集合与出发）
//        → 路线画像 → 领队卡 → 装备要求 → 费用说明 → 底部 CTA 条（idle → loading → done）
// 排版纪律：衬线只给叙述主体（活动标题 / 路线名）；事实与元信息一律无衬线 + tabular。
// 两段节奏：上半「重内容」（封面 + 时间轴，疏）；下半「信息索引」（接缝带 + 规则网格，密）。
// 陶土纪律：--r3-accent 只给 ≤36h 的出发紧迫，不做装饰。
// 数据纪律：全部来自 DEMO；派生一律走 shared；不虚构后端能力（提交 / 拨号只给演示 toast）。
import { DETAIL_SIGNUP_STATE } from '../../js/data.js';
import {
  el, icon, foot, fmt,
  photoOf, statusWord, seatsNode, seatsText,
  departureLabel, demoDeparture,
  stateBlock, skeletonRows, baseFacts, metaLine,
} from './shared.js';

/* 报名状态机词表来自演示数据；registered=false 表示账号已在名单内，直接落在终态。 */
const THEATER = DETAIL_SIGNUP_STATE.ctaTheater;
const STAGE_START = THEATER.registered ? 'idle' : 'done';
const STAGE_DONE = THEATER.registered ? THEATER.done : '已报名';

/* 固定演示文案：与三方案一致，禁用/加载态的入口保留但解释原因。 */
const LOCKED_TOAST = '演示：禁用态下入口保留，但当前不可操作';
const BUSY_TOAST = '演示：加载中，操作暂不可用';

/* ---------------- 派生 ---------------- */
/* 紧迫判定与 Hybrid 主卡同口径：≤36h 才算「现在」，也只有那时才用陶土。 */
function urgency(a) {
  const dep = demoDeparture(a);
  return { dep, now: !!dep && dep.diffH > 0 && dep.diffH <= 36 };
}

/* 行程是否跨夜：时间点按 HH:MM 零填充，可直接字典序比较（00:10 < 23:40 即跨夜）。 */
function itineraryMeta(itin) {
  const times = itin.map(([t]) => String(t || '')).filter(Boolean);
  const wraps = times.some((t, i) => i > 0 && t < times[i - 1]);
  return { count: itin.length, wraps };
}

/* 集合点文案：数据里带「· 地铁 A 口」这类补充说明，不做拆分，原样呈现。 */
const whereText = (a) => a.meetingPoint || a.city || '—';

/* 行程骨架/加载态复用 shared 的骨架行，不另造一套。 */
const skLine = (width, marginTop = 8) =>
  el('div.skeleton.skeleton--line', { style: { width, marginTop: marginTop + 'px' } });

/* ---------------- 区块头（Hybrid 的 section head 语法） ---------------- */
function detHead(title, right) {
  return el('div.det-head',
    el('h2.det-head__k', { text: title }),
    right ? el('span.det-head__n.num', { text: right }) : null);
}

/* ---------------- 1. Hero Panel ---------------- */
function heroFacts(a) {
  return [
    el('span.fact', icon('seat', { size: 13 }),
      el('span.fact__label', { text: '名额' }),
      el('span.fact__value.num', { text: fmt(a.seatsTotal) })),
    el('span.fact', el('span.fact__label', { text: '难度' }),
      el('span.fact__value', { text: a.difficultyText })),
    seatsNode(a),
  ];
}

function heroPanel(a, { ui, flag, busy }) {
  if (busy) {
    return el('article.det-hero.det-hero--sk', { 'data-testid': 'r3-hero' },
      el('div.det-hero__media', el('div.skeleton')),
      el('div.det-hero__panel',
        skLine('30%', 0),
        skLine('76%', 16),
        skLine('52%', 12),
        skLine('92%', 24),
        skLine('64%', 20)));
  }
  const { dep, now } = urgency(a);
  const onWeather = () => {
    if (flag === 'disabled') { ui.toast(LOCKED_TOAST); return; }
    if (flag === 'loading') { ui.toast(BUSY_TOAST); return; }
    ui.go('weather');
  };
  return el('article.det-hero', { data: { activityId: a.id, testid: 'r3-hero' } },
    el('div.det-hero__media',
      photoOf(a, { ratio: '16 / 9', alt: '' }),
      el('div.det-hero__scrim'),
      el('div.det-hero__stamp',
        el('span.num', { text: `${a.dateText} ${a.weekdayText}` }),
        el('span.dot-sep', { text: '·' }),
        el('span.num', { text: a.timeText }),
        el('span.dot-sep', { text: '·' }),
        el('span.num', { text: a.city }))),
    el('div.det-hero__panel',
      el('div.det-hero__kick',
        el('span.det-hero__kicker.t-kicker', { text: '活动详情' }),
        dep && dep.diffH > 0
          ? el('span.det-hero__count' + (now ? '.is-now' : ''), { text: `距出发 ${dep.diffD} 天` })
          : null),
      el('h1.det-hero__title', { text: a.title }),
      el('p.det-hero__route', { text: a.routeName }),
      el('p.det-hero__lede', { text: a.lede }),
      el('div.det-hero__facts.facts', heroFacts(a)),
      el('div.det-hero__actions',
        el('button.btn.btn--primary.det-hero__cta', { type: 'button', onClick: onWeather },
          '查看山顶天气', icon('arrow-right')),
        statusWord(a))));
}

/* ---------------- 2. 行程（时间轴） ---------------- */
/* 一个 tl-item = 时间点 + 圆点连线 + 文案。连线由元素承载（不是伪元素画线），
   末条不带连线，避免「最后一条拖一条线到空气」。
   实心点只给真正的登顶节点 = 文案里报出高度的那一条（「登顶 2434 米」）。
   只匹配「登顶」两字会同时命中「登顶前最后一段陡坡」，时间轴会出现两枚实心点。 */
const isSummit = (text) => /登顶/.test(text) && /\d+\s*米/.test(text);

function tlItem(step, index, last) {
  const [time, text] = step;
  return el('li.tl-item' + (isSummit(String(text || '')) ? '.is-peak' : ''),
      { data: { step: String(index + 1) } },
    el('span.tl-item__time.num', { text: time || '—' }),
    el('span.tl-item__mark', { 'aria-hidden': 'true' },
      el('span.tl-item__dot'),
      last ? null : el('span.tl-item__line')),
    el('p.tl-item__text', { text: text || '' }));
}

function scheduleSection(a, { busy }) {
  const itin = Array.isArray(a.itinerary) ? a.itinerary : [];
  if (!itin.length) return null;
  const { count, wraps } = itineraryMeta(itin);
  const sec = el('section.det-sec', { 'data-testid': 'r3-schedule' },
    detHead('行程', `${count} 站${wraps ? ' · 跨夜' : ''}`));
  if (busy) {
    sec.appendChild(skeletonRows(3, { thumb: false }));
    return sec;
  }
  sec.appendChild(el('ol.det-tl', { 'aria-label': `行程，共 ${count} 站` },
    itin.map((s, i) => tlItem(s, i, i === itin.length - 1))));
  return sec;
}

/* ---------------- 3. 接缝带（石色通栏 · 双发丝线） ---------------- */
/* 全页唯一一处石色通栏：上半叙事与下半信息索引之间的接缝，承载「到哪里、几点集合」。 */
function seamBand(a, { flag, busy }) {
  const { now } = urgency(a);
  const band = el('section.det-seam',
    el('div.det-seam__top',
      el('h2.det-seam__k',
        el('span', { text: '集合与出发' }),
        el('span.det-seam__k-sub', { text: '出发前请核对' })),
      el('span.det-seam__now' + (now ? '.is-now' : ''), { text: departureLabel(a) })));
  if (flag === 'disabled') {
    band.classList.add('det-seam--note');
    const block = stateBlock('disabled');
    block.setAttribute('data-testid', 'r3-state');
    band.appendChild(block);
    return band;
  }
  if (busy) {
    band.classList.add('det-seam--sk');
    band.appendChild(el('div.det-seam__facts', skLine('72%', 0), skLine('54%', 10)));
    return band;
  }
  band.appendChild(el('div.det-seam__facts',
    el('span.det-seam__item',
      icon('pin', { size: 13 }),
      el('span.det-seam__label', { text: '集合点' }),
      el('span.det-seam__value', { text: whereText(a) }))));
  return band;
}

/* ---------------- 4. 路线画像 ---------------- */
/* 2×2 规则网格（发丝线分格），与上方时间轴的无分隔线叙事形成密度对比。 */
function routeSection(a, { busy }) {
  const cityFact = el('span.fact', icon('pin', { size: 13 }),
    el('span.fact__value', { text: a.city }));
  const sec = el('section.det-sec', { 'data-testid': 'r3-route' },
    detHead('路线画像', a.city),
    el('p.det-route__name.serif', { text: a.routeName }));
  if (busy) {
    sec.appendChild(el('div.det-facts', skLine('80%', 20), skLine('60%', 12)));
    return sec;
  }
  sec.appendChild(el('div.det-facts', baseFacts(a), cityFact));
  return sec;
}

/* ---------------- 5. 领队卡 ---------------- */
/* 名单事实一律从 roster 里取，不虚构人名 / 车牌；找不到记录就只显示活动上的领队名。 */
function leaderCard(a, D, { ui, flag, busy }) {
  const sec = el('section.det-sec', { 'data-testid': 'r3-leader' },
    detHead('领队', `${a.signedCount} / ${a.seatsTotal} 已报名`));
  if (busy) {
    sec.appendChild(el('div.det-leader',
      el('div.skeleton.det-leader__slot'),
      el('div.det-leader__body', skLine('52%', 0), skLine('76%', 10))));
    return sec;
  }
  const rec = (D.roster || []).find((m) => m.name === a.leader) || null;
  const viewer = D.viewer || {};
  const avatarText = viewer.name === a.leader ? viewer.avatarText : String(a.leader || '').slice(0, 1);
  const role = rec ? rec.role : (viewer.name === a.leader ? viewer.role : '');
  const car = rec && rec.vehicleId
    ? ((D.vehicles || []).find((v) => v.id === rec.vehicleId) || {}).label
    : '';

  const bits = [
    rec && rec.tripMode,
    rec && rec.phoneTail ? `电话尾号 ${rec.phoneTail}` : '',
    rec && car && rec.seatNo ? `${car} ${rec.seatNo} 座` : '',
    rec && rec.checked && rec.checkedAt ? `${rec.checkedAt} 已签到` : '',
  ].filter(Boolean);

  const onRoster = () => {
    if (flag === 'disabled') { ui.toast(LOCKED_TOAST); return; }
    if (flag === 'loading') { ui.toast(BUSY_TOAST); return; }
    ui.go('collab');
  };

  sec.appendChild(el('div.det-leader',
    el('span.det-leader__avatar', { 'aria-hidden': 'true', text: avatarText }),
    el('div.det-leader__body',
      el('div.det-leader__id',
        el('span.det-leader__name', { text: a.leader }),
        role ? el('span.det-leader__role', { text: role }) : null),
      bits.length ? metaLine(...bits) : null,
      el('button.btn.btn--ghost.det-leader__more', { type: 'button', onClick: onRoster },
        '查看名单与分车', icon('chevron-right')))));
  return sec;
}

/* ---------------- 6. 装备要求 ---------------- */
function gearSection(a, { busy }) {
  const reqs = Array.isArray(a.requirements) ? a.requirements : [];
  if (!reqs.length) return null;
  const sec = el('section.det-sec', { 'data-testid': 'r3-gear' },
    detHead('装备要求', `${reqs.length} 项`));
  const list = busy
    ? skeletonRows(2, { thumb: false })
    : el('ul.det-gear', reqs.map((r) =>
        el('li.det-gear__row',
          el('span.det-gear__box', { 'aria-hidden': 'true' }),
          el('span.det-gear__text', { text: r }))));
  sec.appendChild(list);
  return sec;
}

/* ---------------- 7. 费用说明 ---------------- */
function feeSection(a, { busy }) {
  if (!a.feeNote) return null;
  const sec = el('section.det-sec', { 'data-testid': 'r3-fee' },
    detHead('费用说明'));
  if (busy) {
    sec.appendChild(el('div.det-fee', skLine('88%', 0), skLine('62%', 10)));
    return sec;
  }
  sec.appendChild(el('div.det-fee',
    el('div.det-fee__head',
      icon('ticket', { size: 13 }),
      el('span', { text: '费用与结算' })),
    el('p.det-fee__body', { text: a.feeNote })));
  return sec;
}

/* ---------------- 8. 底部 CTA 条 ---------------- */
/* 状态机：idle → loading → done，三段词表全部来自 DETAIL_SIGNUP_STATE.ctaTheater。
   禁用 / 加载态保留入口但不可提交，点按给出原因（演示 toast，不接后端）。 */
function ctaBar(a, { ui, flag }) {
  const locked = flag === 'disabled' || flag === 'loading';
  let stage = STAGE_START;
  let timer = null;

  const label = el('span.det-cta__label');
  const spin = icon('refresh', { cls: 'det-cta__spin', size: 15 });
  const btn = el('button.btn.btn--primary.det-cta__btn', {
    type: 'button',
    'data-testid': 'r3-cta',
    'aria-disabled': locked ? 'true' : 'false',
  }, label, spin);
  const note = el('p.det-cta__note');

  function paint() {
    label.textContent = stage === 'done' ? STAGE_DONE : THEATER[stage];
    spin.classList.toggle('is-off', stage !== 'loading');
    btn.classList.toggle('is-loading', stage === 'loading');
    btn.classList.toggle('is-locked', locked);
    if (flag === 'loading') note.textContent = '正在加载活动信息…';
    else if (flag === 'disabled') note.textContent = '权限不足或活动已截止，入口保留';
    else if (stage === 'done') note.textContent = `已提交 · ${seatsText(a)}`;
    else note.textContent = `报名截止 ${a.deadlineText || '—'}`;
  }

  btn.addEventListener('click', () => {
    if (flag === 'disabled') { ui.toast(LOCKED_TOAST); return; }
    if (flag === 'loading') { ui.toast(BUSY_TOAST); return; }
    if (stage === 'done') { ui.toast(`演示：${STAGE_DONE}，名单可在协作页查看`); return; }
    if (stage === 'loading') return;
    stage = 'loading';
    paint();
    timer = setTimeout(() => {
      stage = 'done';
      paint();
      ui.toast('演示：报名已提交，等待领队审核（未接后端）');
    }, 720);
  });

  paint();
  return { node: el('div.det-cta', note, btn), dispose: () => clearTimeout(timer) };
}

/* ---------------- 空 / 错：整页不可用 ---------------- */
/* 单对象页没有「已加载内容」可保留：活动本身拿不到，就不画任何区块，
   只留状态块 + 脚注，底部不留报名入口（没有活动可报）。 */
function blockedPage(kind, { D, ui }) {
  const copy = kind === 'error'
    ? {
        title: '活动加载失败',
        body: '演示错误态：网络或服务暂时不可用。详情与报名入口一并收起，保留重试入口。',
        actionText: '重新加载',
        onAction: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端'),
      }
    : {
        title: '活动不可见',
        body: '演示空态：该活动已下架或从演示列表中移除，详情与行程不再展示。',
        actionText: '返回发现',
        onAction: () => ui.go('hybrid'),
      };
  const block = stateBlock(kind, copy);
  block.setAttribute('data-testid', 'r3-state');
  return el('div.page.det-page', { data: { page: 'detail' } },
    el('div.det-blocked', block),
    foot(D));
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const flag = ctx.flag || '';
  const ui = ctx.ui || {};
  const a = D.featured;

  if (flag === 'error' || flag === 'empty') return blockedPage(flag, { D, ui });

  const busy = flag === 'loading';
  const cta = ctaBar(a, { ui, flag });
  const opts = { ui, flag, busy };

  const page = el('div.page.det-page', { data: { page: 'detail' } },
    heroPanel(a, opts),
    scheduleSection(a, opts),
    seamBand(a, opts),
    routeSection(a, opts),
    leaderCard(a, D, opts),
    gearSection(a, opts),
    feeSection(a, opts),
    foot(D),
    cta.node);

  page.__dispose = cta.dispose;
  return page;
}