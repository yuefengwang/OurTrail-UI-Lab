// OurTrail Round 3 — 活动协作（?view=collab）
// 迁移动作：协作页第一次真正消费 Hybrid 设计语言。
//
// 结构 = 刊头 → 阶段头（石色接缝带变体 · sticky 吸顶）
//        → 分车网格（4 车 × 司机 + 4 座）
//        → 成员名单（统一 80px 行栅格，按「已到 / 未到 / 待审核 / 候补」分组）
//        → 下一步（唯一主操作）→ 脚注
//
// 共享原语（./shared.js）消费口径：
//   直接调用 —— el / icon / foot / fmt / metaLine / stateBlock / skeletonRows / departureLabel；
//   形制复用 —— status-word（点 + 词 + 语义色）与 seats（余量 + 陶土紧迫）两套共享类。
//               这两个函数签名的输入是「活动」；协作页里的语义对象是「成员审核态」与「车位余量」，
//               强行套用会把 报名中/已成行 与 已通过/候补 说串。所以这里复用同一套类与同一套
//               语义色纪律（success / warning / neutral，≤3 用陶土），词面一律取自 DEMO：
//               审核态 = roster.audit，车位余量 = vehicles[].seats vs capacity。
//   未使用 —— photoOf / seatsNode / statusWord()：协作页没有封面图，也不需要活动名额与
//               活动报名状态词；引入只会让数据说两套话。
//
// 排版纪律：衬线只给叙述主体（刊头标题）。阶段头 / 分车 / 名单是索引区，一律无衬线 + 发丝线。
// 数据纪律：人名、车牌、座位、计数全部来自 DEMO，不虚构人、不虚构后端能力。

import {
  el, icon, foot, fmt, metaLine,
  stateBlock, skeletonRows, departureLabel,
} from './shared.js';

/* ---------------- 语义映射（成员审核态 / 签到态） ---------------- */
/* 与 shared.STATUS 同源的语义色纪律，只是词面换了对象。 */
const AUDIT_TONE = { 已通过: 'success', 待审核: 'warning', 候补: 'neutral' };

/** 审核态：复用共享 .status-word 的点 + 词形制（成员一律带点，列表里没有需要藏点的场合） */
function auditWord(audit) {
  return el('span.status-word.status-word--' + (AUDIT_TONE[audit] || 'neutral'), { text: audit });
}

/** 签到态：形状 + 词双通道，不靠颜色单独承担信息 */
function checkWord(m) {
  if (m.audit !== '已通过') {
    return el('span.col-check.is-none', { text: '—' });
  }
  return m.checked
    ? el('span.col-check.is-in', icon('check', { size: 12 }), el('span', { text: '已到' }))
    : el('span.col-check.is-late', icon('clock', { size: 12 }), el('span', { text: '未到' }));
}

/** 座位文案：司机 / N 座 / 待定 */
const seatText = (m) => (m.seatNo === 'driver' ? '司机' : m.seatNo == null ? '待定' : m.seatNo + ' 座');

/* ---------------- 计数（全部由当前 roster 派生） ---------------- */
/* 阶段头、名单分组、未安排区共用同一份派生，避免三处各说各话。 */
function tally(roster) {
  const approved = roster.filter((m) => m.audit === '已通过');
  const arrived = approved.filter((m) => m.checked);
  return {
    arrived,
    late: approved.filter((m) => !m.checked),
    audit: roster.filter((m) => m.audit === '待审核'),
    wait: roster.filter((m) => m.audit === '候补'),
    unseated: approved.filter((m) => !m.vehicleId),
    expected: approved.length,
    got: arrived.length,
  };
}

/* ---------------- 1. 刊头 ---------------- */
/* kicker 只放角色标签与日期：这一行右侧留给出发倒计时，塞集合点必然截断。
   集合点是集合语境，落在阶段头（接缝带变体）里；活动事实留给导语一行。 */
function masthead(a) {
  const when = departureLabel(a);
  return el('header.col-mast',
    el('div.col-mast__row',
      el('span.col-mast__kicker.t-kicker', { text: '活动协作 · ' + a.dateText + ' ' + a.weekdayText }),
      el('span.col-mast__when' + (when ? '.is-now' : ''), { text: when || a.timeText })),
    el('h1.col-mast__title.t-display.serif', { text: '集合与分车' }),
    metaLine(a.title, a.city, '领队 ' + a.leader)
  );
}

/* ---------------- 2. 阶段头（接缝带变体 · 无筛选无搜索） ---------------- */
function phaseBand(a, c, t) {
  const pct = t.expected ? Math.round((t.got / t.expected) * 100) : 0;
  return el('section.col-phase', {
    'data-testid': 'r3-phase',
    data: { activityId: a.id },
  },
    el('div.col-phase__top',
      el('h2.col-phase__k',
        el('span', { text: c.phase }),
        el('span.col-phase__k-sub', { text: '集合点 ' + a.meetingPoint })),
      el('span.col-phase__n.num',
        el('span.col-phase__n-got', { text: String(t.got) }),
        el('span.col-phase__n-of', { text: ' / ' + t.expected + ' 已到' }))),
    el('div.col-phase__meter',
      el('i.col-phase__fill', { style: { width: pct + '%' } })),
    el('p.col-phase__next', { text: c.nextStep })
  );
}

/* ---------------- 3. 分车网格 ---------------- */
/** 车头：车号 + 车牌 + 司机 + 余量 */
function vehicleHead(v) {
  const taken = v.seats.filter(Boolean).length;
  const left = v.capacity - taken;
  return el('div.col-car__head',
    el('div.col-car__id',
      el('span.col-car__label', { text: v.label }),
      el('span.col-car__plate.num', { text: v.plate })),
    el('span.col-car__crew',
      icon('car', { size: 14 }),
      el('span', { text: '司机 ' + v.driver })),
    /* 余量沿用共享 .seats 纪律：满员 / 剩 N 位，≤3 用陶土（席位紧张） */
    el('span.seats.col-car__load'
      + (left > 0 && left <= 3 ? '.is-urgent' : ''),
      { text: taken >= v.capacity ? '满员' : '剩 ' + left + ' 位' }));
}

/** 座位格：有人 = 姓名 + 座位号 + 签到形状；无人 = 空位 */
function seatSlot(m, no) {
  if (!m) {
    return el('div.col-seat.is-free',
      el('span.col-seat__name', { text: '空位' }),
      el('span.col-seat__no.num', { text: no + ' 号' }));
  }
  return el('div.col-seat' + (m.checked ? '.is-in' : ''),
    el('div.col-seat__top',
      el('span.col-seat__name', { text: m.name }),
      m.checked ? icon('check', { size: 11, cls: 'col-seat__mark' })
                : icon('clock', { size: 11, cls: 'col-seat__mark' })),
    el('span.col-seat__no.num', { text: seatText(m) }));
}

function vehicleCard(v, seatOf) {
  const taken = v.seats.filter(Boolean).length;
  return el('article.col-car', {
    data: { vehicleId: v.id },
    'aria-label': v.label + ' ' + v.plate + ' 司机 ' + v.driver + '，已坐 ' + taken + ' / ' + v.capacity + ' 人',
  },
    vehicleHead(v),
    el('div.col-seats', v.seats.map((name, i) => seatSlot(name ? seatOf.get(v.id + ':' + (i + 1)) : null, i + 1))));
}

function vehiclesSection(D, seatOf, t) {
  const box = el('section.col-cars', { 'data-testid': 'r3-vehicles' },
    el('div.col-sect',
      el('h2.col-sect__k', { text: '分车' }),
      el('span.col-sect__n.num', { text: fmt(D.vehicles.length) + ' 台 · ' + fmt(D.vehicles.length * 4) + ' 座' })),
    el('div.col-cars__list', D.vehicles.map((v) => vehicleCard(v, seatOf))));
  if (t.unseated.length) {
    box.appendChild(el('div.col-unseated',
      el('span.col-unseated__k.t-kicker', { text: '未安排车辆' }),
      el('div.col-unseated__list',
        t.unseated.map((m) => el('span.col-pill', { text: m.name }))),
      el('span.col-unseated__n.num', { text: fmt(t.unseated.length) + ' 人' })));
  }
  return box;
}

/* ---------------- 4. 成员名单 ---------------- */
function memberRow(m, vm) {
  const v = m.vehicleId ? vm.get(m.vehicleId) : null;
  return el('div.col-row', { data: { memberId: m.id } },
    el('div.col-row__avatar' + (m.role === '成员' ? '' : '.is-crew'),
      { text: m.name.slice(0, 1), 'aria-hidden': 'true' }),
    el('div.col-row__main',
      el('div.col-row__line1',
        el('span.col-row__name', { text: m.name }),
        el('span.col-row__role', { text: m.role })),
      el('div.col-row__line2',
        el('span.col-pill', { text: m.tripMode }),
        el('span.col-row__seat.num', { text: v ? v.label + ' · ' + seatText(m) : '待安排车辆' }))),
    el('div.col-row__side',
      auditWord(m.audit),
      checkWord(m)));
}

const GROUPS = [
  { key: 'arrived', title: '已到' },
  { key: 'late', title: '未到' },
  { key: 'audit', title: '待审核' },
  { key: 'wait', title: '候补' },
];

function rosterSection(roster, vm, t) {
  return el('section.col-roster', { 'data-testid': 'r3-roster' },
    el('div.col-sect',
      el('h2.col-sect__k', { text: '成员名单' }),
      el('span.col-sect__n.num', { text: fmt(roster.length) + ' 人 · 已通过 ' + fmt(t.expected) })),
    GROUPS.map((g) => {
      const list = t[g.key];
      if (!list.length) return null;
      return el('div.col-group',
        el('div.col-group__head',
          el('div.col-group__k', { text: g.title }),
          el('div.col-group__n.num', { text: fmt(list.length) + ' 人' })),
        list.map((m) => memberRow(m, vm)));
    }));
}

/* ---------------- 5. 下一步（唯一主操作） ---------------- */
/* 这里不复述阶段头已给的 nextStep —— 同一句话出现两次就是排版事故。
   这一段只回答"点了会发生什么"，数字全部来自当前派生：车长数 / 未到人数 / 未安排人数。 */
function nextSection(t, crews, cta) {
  const detail = '向 ' + fmt(crews) + ' 位车长推送集合结果；'
    + (t.late.length ? '未到 ' + fmt(t.late.length) + ' 人、' : '')
    + (t.unseated.length ? '未安排车辆 ' + fmt(t.unseated.length) + ' 人' : '')
    + '需在出发前确认。';
  return el('section.col-next', { 'data-testid': 'r3-next-action' },
    el('div.col-next__k.t-kicker', { text: '下一步' }),
    el('p.col-next__t', { text: t.late.length || t.unseated.length ? detail : '全员已到、车位已排定，可以发起出发确认。' }),
    cta);
}

/* ---------------- 加载骨架 ---------------- */
const skLine = (w, h) => el('div.skeleton.skeleton--line', { style: { width: w, height: h || '12px' } });

function collabSkeleton() {
  return el('div.col-skel',
    el('section.col-phase.col-phase--sk',
      el('div.col-phase__top', skLine('32%', '17px'), skLine('20%')),
      el('div.col-skel__bar'),
      skLine('88%')),
    el('div.col-sect', { style: { marginTop: 'var(--r3-space-7)' } }, skLine('26%')),
    el('div.col-cars__list',
      Array.from({ length: 2 }, () => el('div.col-skel__card',
        skLine('58%'),
        el('div.col-seats',
          Array.from({ length: 4 }, () => el('div.col-seat.col-skel__seat', skLine('76%')))))),
    el('div.col-sect', { style: { marginTop: 'var(--r3-space-7)' } }, skLine('30%')),
    skeletonRows(4)));
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const D = ctx.D;
  const flag = ctx.flag || '';
  const ui = ctx.ui || {};
  const busy = flag === 'loading';
  const a = D.featured;
  const c = D.collab;

  /* 空态 = 这条活动还没有成员；其余状态一律保留 DEMO 全量名单 */
  const roster = flag === 'empty' ? [] : D.roster;
  const t = tally(roster);
  const vm = new Map(D.vehicles.map((v) => [v.id, v]));
  const seatOf = new Map(roster.filter((m) => m.vehicleId).map((m) => [m.vehicleId + ':' + m.seatNo, m]));

  const page = el('div.page.col-page', {
    data: { page: 'collab', activityId: a.id },
  }, masthead(a));

  if (busy) {
    page.appendChild(collabSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  /* 阶段头始终在场：它是本页的"我处在哪个阶段"锚点 */
  const band = phaseBand(a, flag === 'empty'
    ? { phase: c.phase, nextStep: '还没有成员通过审核，暂无待出发安排。' }
    : c, t);

  let stateMarked = false;
  const mark = (node) => {
    if (stateMarked) { node.setAttribute('data-testid', 'r3-state-more'); }
    else { node.setAttribute('data-testid', 'r3-state'); stateMarked = true; }
    return el('div.col-state', node);
  };

  page.appendChild(band);

  /* 错误 / 禁用：保留已加载的名单与分车（不把现场清空），只在上方给出状态与出口 */
  if (flag === 'error') {
    page.appendChild(mark(stateBlock('error', {
      onAction: () => ui.toast('演示：重新加载只还原本地演示数据，未接后端'),
    })));
  } else if (flag === 'disabled') {
    page.appendChild(mark(stateBlock('disabled')));
  }

  if (flag === 'empty') {
    page.appendChild(mark(stateBlock('empty', {
      iconName: 'users',
      title: '还没有成员',
      body: '这条活动发布后，通过审核的成员会出现在这里；候补与待审核分开统计。',
      actionText: '查看活动',
      onAction: () => ui.go('detail'),
    })));
    page.appendChild(foot(D));
    return page;
  }

  page.appendChild(vehiclesSection(D, seatOf, t));
  page.appendChild(rosterSection(roster, vm, t));

  /* 主操作：发起后按钮自身进入已发起态，避免重复触发（演示，不接后端） */
  let sent = false;
  const cta = el('button.btn.btn--primary.btn--full.col-next__cta', {
    type: 'button',
    disabled: flag === 'disabled' ? true : undefined,
    onClick: () => {
      if (flag === 'disabled') {
        ui.toast('演示：禁用态下入口保留，但当前不可操作');
        return;
      }
      if (sent) return;
      sent = true;
      cta.replaceChildren(el('span', { text: '确认已发起' }), icon('check'));
      ui.toast('出发确认已发起，等待 ' + fmt(D.vehicles.length) + ' 位车长回复（演示）');
    },
  }, el('span', { text: c.nextAction }), icon('arrow-right'));

  page.appendChild(nextSection(t, D.vehicles.length, cta));
  page.appendChild(foot(D));

  /* 阶段头吸顶：真的滚到带子上沿才记为 pinned（吸顶后下框线加重，不加阴影） */
  page.addEventListener('scroll', () => {
    const top = band.getBoundingClientRect().top - page.getBoundingClientRect().top;
    band.classList.toggle('is-pinned', top <= 0.5);
  }, { passive: true });

  return page;
}
