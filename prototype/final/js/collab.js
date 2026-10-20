// 活动协作 — 阶段优先、任务优先、角色受限
// 组织者：任务队列 + 名单/车辆/现场；协作：签到/节点/异常；车长：本车两程。
import {
  el, icon, appBar, iconBtn, sectionHead, btn, segmented,
  sheet, confirmSheet, toast, kv, emptyBlock
} from './ui.js';
import { FEATURED, VEHICLES, scenario, tasksFor } from './data.js';

const STEPS = [
  { key: 'published', label: '行前' },
  { key: 'gathering', label: '集合' },
  { key: 'active', label: '同行' },
  { key: 'closing', label: '返程' },
  { key: 'archived', label: '归档' }
];
const STAGE_INDEX = { published: 1, gathering: 2, active: 3, closing: 4, archived: 5 };

const pickName = (id) => (id === 'p2' ? '犀浦' : '茶店子');
const pickupTime = (id) => (id === 'p2' ? '07:20' : '07:00');

function vehicleData(sc) {
  return VEHICLES.map((v) => {
    const passengers = sc.roster.filter((m) => m.audit === 'confirmed' && m.vehicleId === v.id && m.seatNo !== 'driver');
    const used = new Set(passengers.map((m) => String(m.seatNo)));
    const allSeats = Array.from({ length: v.passengerSeats }, (_, i) => String(i + 1).padStart(2, '0'));
    return {
      ...v,
      passengers,
      freeSeats: allSeats.filter((s) => !used.has(s)),
      driverRec: sc.roster.find((m) => m.id === v.driverId)
    };
  });
}

function stageStats(sc, role) {
  if (role === 'driver') {
    const car = VEHICLES[0];
    const passengers = sc.roster.filter((m) => m.vehicleId === car.id && m.seatNo !== 'driver');
    const boarded = passengers.filter((m) => m.boarded).length;
    return [
      { k: '本车乘客', v: `${passengers.length}`, u: '人' },
      { k: '已上车', v: `${boarded}`, u: '人', tone: boarded === passengers.length ? 'go' : 'clay' },
      { k: '空余乘客位', v: `${car.passengerSeats - passengers.length}`, u: '位' }
    ];
  }
  if (role === 'staff') {
    return [
      { k: '已签到', v: `${sc.checked}`, u: `/ ${sc.confirmed}` },
      { k: '未签到', v: `${sc.unchecked}`, u: '人', tone: sc.unchecked ? 'clay' : '' },
      { k: '异常', v: `${sc.incident ? 1 : 0}`, u: '条', tone: sc.incident ? 'danger' : '' }
    ];
  }
  if (sc.stage.key === 'published') {
    return [
      { k: '已确认', v: `${sc.confirmed}`, u: `/ ${FEATURED.capacity}` },
      { k: '待审核', v: `${sc.pending}`, u: '人', tone: sc.pending ? 'clay' : '' },
      { k: '未分车', v: `${sc.unassigned}`, u: '人', tone: sc.unassigned ? 'clay' : '' }
    ];
  }
  if (sc.stage.key === 'gathering') {
    return [
      { k: '已签到', v: `${sc.checked}`, u: `/ ${sc.confirmed}` },
      { k: '未签到', v: `${sc.unchecked}`, u: '人', tone: sc.unchecked ? 'clay' : '' },
      { k: '未分车', v: `${sc.unassigned}`, u: '人', tone: sc.unassigned ? 'clay' : '' }
    ];
  }
  if (sc.stage.key === 'active') {
    const node = sc.roster.filter((m) => m.audit === 'confirmed' && m.node === 'r2').length;
    return [
      { k: '已出发', v: `${sc.confirmed - (sc.incident ? 1 : 0)}`, u: `/ ${sc.confirmed}` },
      { k: '到飞泉沟', v: `${node}`, u: '人' },
      { k: '异常', v: `${sc.incident ? 1 : 0}`, u: '条', tone: sc.incident ? 'danger' : '' }
    ];
  }
  if (sc.stage.key === 'closing') {
    return [
      { k: '已到家', v: `${sc.confirmed - sc.homePending}`, u: `/ ${sc.confirmed}` },
      { k: '未确认', v: `${sc.homePending}`, u: '人', tone: sc.homePending ? 'clay' : '' },
      { k: '异常', v: `${sc.incident ? 1 : 0}`, u: '条', tone: sc.incident ? 'danger' : '' }
    ];
  }
  return [
    { k: '活动人数', v: `${sc.confirmed}`, u: '人' },
    { k: '归档状态', v: '只读', u: '' },
    { k: '异常', v: '0', u: '条' }
  ];
}

function commandHeader(sc, role) {
  const step = STAGE_INDEX[sc.stage.key] || 1;
  const roleText = role === 'organizer' ? '组织者视角' : role === 'staff' ? '现场协作 · 许安' : '1 号中巴车长 · 许川';
  const stats = stageStats(sc, role);
  const anchor = sc.stage.key === 'closing' && sc.stage ? '返程原因：午后阵雨，提前下撤' : sc.stage.anchor;
  return el('section.col-command.bleed',
    el('div.col-command__top',
      el('span.col-role', { text: roleText }),
      el('span.col-stage', { text: sc.stage.label })),
    el('h1.col-command__title', { text: FEATURED.title }),
    el('div.col-command__meta',
      el('span', { text: `10/24 周六 · 07:00 茶店子集合` }),
      el('span.col-command__dot', { text: '·' }),
      el('span', { text: anchor })),
    el('div.col-steps', STEPS.map((s, i) => {
      const idx = i + 1;
      return el('div.col-step' + (idx < step ? '.is-done' : idx === step ? '.is-now' : ''),
        el('span.col-step__dot'),
        el('span.col-step__label', { text: s.label }),
        idx < STEPS.length ? el('span.col-step__line') : null);
    })),
    el('div.col-stats', stats.map((s) =>
      el('div.col-stat' + (s.tone ? `.is-${s.tone}` : ''),
        el('div.col-stat__v',
          el('span.num', { text: s.v }),
          s.u ? el('span.col-stat__u', { text: s.u }) : null),
        el('div.col-stat__k', { text: s.k })))));
}

function taskSection(ctx, sc, role, tasks, goTab) {
  const sec = el('section.col-tasks');
  sec.appendChild(sectionHead('现在要做', tasks.length ? `${tasks.length} 项` : '已处理完'));
  if (!tasks.length) {
    const next = nextStage(sc.stage.key);
    sec.appendChild(el('div.col-ready',
      el('span.col-ready__icon', icon('check-circle', { size: 22 })),
      el('div.col-ready__body',
        el('div.col-ready__t', { text: sc.stage.key === 'archived' ? '活动已归档，记录只读' : '当前阶段没有未处理事项' }),
        el('div.col-ready__d', { text: next ? '可以推进到下一阶段，系统会再次校验门槛。' : '名单、车辆与现场记录保持只读。' })),
      next && role === 'organizer'
        ? btn(stageActionLabel(next), { variant: 'primary', cls: 'col-ready__cta', onClick: () => openStageSheet(ctx, sc, next) })
        : null));
    return sec;
  }
  for (const t of tasks) {
    const tone = t.tone || 'prepare';
    sec.appendChild(el('div.col-task' + `.is-${tone}`,
      el('span.col-task__bar', { 'aria-hidden': 'true' }),
      el('div.col-task__body',
        el('div.col-task__titleline',
          el('span.col-task__title', { text: t.title }),
          t.count ? el('span.col-task__count.num', { text: String(t.count) }) : null),
        el('div.col-task__meta', { text: t.meta })),
      el('button.col-task__action', {
        type: 'button',
        onClick: () => {
          if (t.id === 'incident') { openIncidentSheet(ctx, sc); return; }
          if (t.id === 'readonly') { goTab('roster'); return; }
          const map = { audit: 'roster', deadline: 'roster', assign: 'vehicles', checkin: 'field', home: 'field', node: 'field' };
          goTab(map[t.id] || 'roster', true);
        }
      }, el('span', { text: t.action }), icon('chevron-right', { size: 13 }))));
  }
  return sec;
}

function nextStage(key) {
  return { published: 'gathering', gathering: 'active', active: 'closing', closing: 'archived', archived: null }[key] || null;
}
function stageActionLabel(key) {
  return { gathering: '进入集合阶段', active: '确认出发 · 进入同行', closing: '进入返程收尾', archived: '归档活动' }[key] || '推进阶段';
}

/* ---------------- 名单 ---------------- */
function needsFor(sc, m) {
  if (sc.stage.key === 'published') return m.audit === 'pending' || (m.audit === 'confirmed' && m.trip === 'shared' && !m.vehicleId);
  if (sc.stage.key === 'gathering') return m.audit === 'confirmed' && (!m.checked || (m.trip === 'shared' && !m.vehicleId));
  if (sc.stage.key === 'active') return m.audit === 'confirmed' && m.id === 'm15';
  if (sc.stage.key === 'closing') return m.audit === 'confirmed' && !m.home;
  return false;
}

function personStatus(sc, m) {
  const bits = [];
  if (m.audit === 'pending') bits.push(['待审核', 'clay', 'dot']);
  else if (m.audit === 'rejected') bits.push(['未通过', 'danger', 'x']);
  else bits.push(['已确认', 'go', 'check']);
  if (m.audit === 'confirmed' && sc.stage.key === 'gathering') bits.push(m.checked ? ['已签到', 'go', 'check'] : ['未签到', 'clay', 'dot']);
  if (m.audit === 'confirmed' && (sc.stage.key === 'active' || sc.stage.key === 'closing' || sc.stage.key === 'archived')) {
    bits.push(['已签到', 'mute', 'check']);
    if (m.id === 'm15' && sc.incident) bits.push(['协调中', 'danger', 'dot']);
    else if (m.departed === 'joined') bits.push(['已出发', 'mute', 'check']);
  }
  if (sc.stage.key === 'closing') bits.push(m.home ? ['已到家', 'go', 'check'] : ['未到家', 'clay', 'dot']);
  if (m.audit === 'confirmed' && m.trip === 'self') bits.push(['自行前往', 'mute', 'minus']);
  if (m.audit === 'confirmed' && m.trip === 'shared' && !m.vehicleId) bits.push(['未分车', 'clay', 'dot']);
  return bits;
}

function actionFor(ctx, sc, role, m) {
  if (role === 'organizer' && sc.stage.key === 'published' && m.audit === 'pending') {
    return { label: '审核', onClick: () => openAuditSheet(ctx, sc, m) };
  }
  if (role === 'organizer' && (sc.stage.key === 'published' || sc.stage.key === 'gathering')
    && m.audit === 'confirmed' && m.trip === 'shared' && !m.vehicleId) {
    return { label: '安排', onClick: () => openAssignSheet(ctx, sc, m) };
  }
  if ((role === 'organizer' || role === 'staff') && sc.stage.key === 'gathering' && m.audit === 'confirmed' && !m.checked) {
    return {
      label: '签到', onClick: () => {
        const res = ctx.store.actions.checkin(m.id, sc.stage.key);
        if (!res.ok) { toast(res.error); return; }
        ctx.ui.rerender();
        toast(`${m.name} 已签到（本地事务）`);
      }
    };
  }
  if ((role === 'organizer' || role === 'staff') && (sc.stage.key === 'active' || sc.stage.key === 'closing') && m.id === 'm15' && sc.incident) {
    return { label: '处理异常', onClick: () => openIncidentSheet(ctx, sc) };
  }
  if (role === 'organizer' && sc.stage.key === 'closing' && m.audit === 'confirmed' && !m.home && m.departed === 'joined') {
    return { label: '确认到家', onClick: () => openHomeSheet(ctx, sc, m) };
  }
  return null;
}

function personRow(ctx, sc, role, m) {
  const bits = personStatus(sc, m);
  const act = actionFor(ctx, sc, role, m);
  const seat = m.vehicleId
    ? `${m.vehicleId === 'v1' ? '1 号中巴' : '2 号车'}${m.seatNo === 'driver' ? ' · 司机' : ` · ${m.seatNo} 座`}`
    : m.trip === 'self' ? '自行前往' : '未分车';
  return el('div.col-person',
    el('span.col-person__avatar', { 'aria-hidden': 'true', text: m.name.slice(0, 1) }),
    el('button.col-person__main.col-person__open', {
      type: 'button',
      'aria-label': `查看 ${m.name} 的同行状态`,
      onClick: () => openMemberSheet(m)
    },
      el('span.col-person__name',
        el('span', { text: m.name }),
        el('span.col-person__role', { text: m.role })),
      el('span.col-person__meta',
        el('span', { text: `${pickupTime(m.pickup)} ${pickName(m.pickup)}` }),
        el('span.col-person__sep', { text: '·' }),
        el('span', { text: seat })),
      el('span.col-person__status',
        bits.map(([text, tone, shape]) =>
          el('span.col-status' + `.is-${tone}`,
            el('span.shape.shape--' + shape, { 'aria-hidden': 'true' }),
            el('span', { text }))))),
    el('div.col-person__side',
      m.audit === 'pending' ? el('span.col-person__time', { text: `申请 ${m.requestedAt || '—'}` }) : null,
      act ? el('button.col-mini', {
        type: 'button',
        'aria-label': `${m.name} · ${act.label}`,
        onClick: act.onClick
      }, el('span', { text: act.label }), icon('chevron-right', { size: 12 })) : el('span.col-person__chev', icon('chevron-right', { size: 14 }))));
}

function rosterPanel(ctx, sc, role) {
  const all = role === 'staff'
    ? sc.roster.filter((m) => m.audit === 'confirmed')
    : sc.roster;
  const baseFilter = role === 'staff' ? 'all' : 'all';
  let filter = ['all', 'needs', 'pending', 'confirmed'].includes(ctx.state.collabFilter) ? ctx.state.collabFilter : baseFilter;
  if (role === 'staff' && filter === 'pending') filter = 'all';
  const query = ctx.state.collabQuery || '';
  const sec = el('section.col-panel__inner');
  const head = el('div.col-panel__head',
    el('div',
      el('h2.col-panel__title', { text: '成员名单' }),
      el('div.col-panel__sub', {
        text: role === 'staff'
          ? '你只能看到已确认成员；签到、节点与异常在你的授权范围内。'
          : `${all.length} 人 · ${sc.confirmed} 已确认 · ${sc.pending} 待审核 · ${sc.unassigned} 未分车`
      })),
    el('span.col-panel__count.num', { text: `${all.length} 人` }));
  sec.appendChild(head);

  const search = el('input.col-search__input', {
    type: 'search',
    placeholder: '搜索姓名、车辆或上车点',
    'aria-label': '搜索成员',
    value: query,
    onInput: (e) => { ctx.state.collabQuery = e.target.value; paintList(); }
  });
  const searchWrap = el('label.col-search',
    el('span.col-search__icon', icon('search', { size: 15 })),
    search);

  const filterDefs = role === 'staff'
    ? [{ key: 'all', label: '全部' }, { key: 'needs', label: '未签到' }, { key: 'confirmed', label: '已签到' }]
    : [{ key: 'all', label: '全部' }, { key: 'needs', label: '需要处理' }, { key: 'pending', label: '待审核' }, { key: 'confirmed', label: '已确认' }];
  const chips = el('div.col-filters', filterDefs.map((f) =>
    el('button.col-filter' + (filter === f.key ? '.is-active' : ''), {
      type: 'button',
      onClick: (e) => {
        filter = f.key;
        ctx.state.collabFilter = f.key;
        chips.querySelectorAll('.col-filter').forEach((b) => b.classList.toggle('is-active', b === e.currentTarget));
        paintList();
      }
    }, f.label)));
  sec.appendChild(el('div.col-toolbar', searchWrap, chips));

  const listSlot = el('div.col-list');
  sec.appendChild(listSlot);

  const matches = (m) => {
    const s = query.trim().toLowerCase();
    if (!s) return true;
    return [m.name, m.vehicleId === 'v1' ? '1 号中巴' : m.vehicleId === 'v2' ? '2 号车' : '', pickName(m.pickup), m.role]
      .join(' ').toLowerCase().includes(s);
  };
  const passFilter = (m) => {
    if (filter === 'needs') return needsFor(sc, m);
    if (filter === 'pending') return m.audit === 'pending';
    if (filter === 'confirmed') return m.audit === 'confirmed' && (role !== 'staff' || m.checked);
    return true;
  };

  function paintList() {
    const list = all.filter((m) => matches(m) && passFilter(m));
    listSlot.replaceChildren();
    if (!list.length) {
      listSlot.appendChild(el('p.rule-note', { text: filter === 'needs' ? '这个筛选下没有待处理事项。' : '没有匹配的成员。' }));
      return;
    }
    if (filter !== 'all') {
      listSlot.appendChild(el('div.col-group-head',
        el('span', { text: filter === 'needs' ? '需要处理' : filter === 'pending' ? '待审核' : '已确认' }),
        el('span.col-group-count.num', { text: `${list.length} 人` })));
      list.forEach((m) => listSlot.appendChild(personRow(ctx, sc, role, m)));
      return;
    }
    const needs = list.filter((m) => needsFor(sc, m));
    const rejected = list.filter((m) => m.audit === 'rejected');
    const ready = list.filter((m) => !needsFor(sc, m) && m.audit !== 'rejected');
    const group = (title, items, tone = '') => {
      if (!items.length) return;
      listSlot.appendChild(el('div.col-group-head' + (tone ? `.is-${tone}` : ''),
        el('span', { text: title }),
        el('span.col-group-count.num', { text: `${items.length} 人` })));
      items.forEach((m) => listSlot.appendChild(personRow(ctx, sc, role, m)));
    };
    group('需要处理', needs, 'clay');
    group('已就绪', ready);
    group('已处理', rejected, 'mute');
  }
  paintList();
  return sec;
}

/* ---------------- 车辆 ---------------- */
function vehiclePanel(ctx, sc, role) {
  const vds = vehicleData(sc);
  const allocated = vds.reduce((sum, v) => sum + v.passengers.length, 0);
  const unassigned = sc.roster.filter((m) => m.audit === 'confirmed' && m.trip === 'shared' && !m.vehicleId);
  const sec = el('section.col-panel__inner');
  sec.appendChild(el('div.col-panel__head',
    el('div',
      el('h2.col-panel__title', { text: '车辆与分车' }),
      el('div.col-panel__sub', { text: `${vds.length} 台 · 已确认 ${sc.confirmed} 人 · 车上乘客 ${allocated} · 司机 ${VEHICLES.length} · 自行前往 ${sc.selfArrive} · 未分配 ${unassigned.length}` })),
    el('span.col-panel__count.num', { text: `${vds.reduce((s, v) => s + v.passengerSeats, 0)} 乘客位` })));

  if (unassigned.length) {
    const block = el('div.col-unassigned');
    block.appendChild(el('div.col-unassigned__head',
      el('span', { text: '未安排车辆' }),
      el('span.num', { text: `${unassigned.length} 人` })));
    unassigned.forEach((m) => {
      block.appendChild(el('div.col-unassigned__row',
        el('span.col-unassigned__name', { text: m.name }),
        el('span.col-unassigned__meta', { text: `${pickupTime(m.pickup)} ${pickName(m.pickup)} · ${m.role}` }),
        el('button.col-mini', {
          type: 'button',
          onClick: () => openAssignSheet(ctx, sc, m)
        }, el('span', { text: '安排' }), icon('chevron-right', { size: 12 }))));
    });
    sec.appendChild(block);
  } else {
    sec.appendChild(el('div.col-ok', icon('check-circle', { size: 16 }), el('span', { text: '已分配完成：没有待安排的拼车成员。' })));
  }

  const openId = ctx.state.vehicleOpen || vds[0].id;
  for (const v of vds) {
    const block = el('div.col-vehicle');
    block.appendChild(el('div.col-vehicle__head',
      el('div.col-vehicle__id',
        el('span.col-vehicle__label', { text: v.label }),
        el('span.col-vehicle__plate.num', { text: v.plate })),
      el('div.col-vehicle__driver',
        icon('car', { size: 14 }),
        el('span', { text: `司机 ${v.driver}` })),
      el('div.col-vehicle__load',
        el('span.num', { text: `${v.passengers.length} / ${v.passengerSeats}` }),
        el('span', { text: ' 乘客位' }))));
    block.appendChild(el('div.col-vehicle__bar',
      el('i', { style: { width: `${Math.round((v.passengers.length / v.passengerSeats) * 100)}%` } })));
    block.appendChild(el('button.col-vehicle__toggle', {
      type: 'button',
      'aria-expanded': openId === v.id ? 'true' : 'false',
      onClick: () => {
        ctx.state.vehicleOpen = openId === v.id ? '' : v.id;
        ctx.ui.rerender();
      }
    }, el('span', { text: openId === v.id ? '收起座位图' : '展开座位图' }), icon('chevron-down', { size: 14, cls: openId === v.id ? 'is-flip' : '' })));
    if (openId === v.id) {
      const seatMap = el('div.col-seatmap');
      const bySeat = new Map(v.passengers.map((m) => [String(m.seatNo), m]));
      for (let i = 1; i <= v.passengerSeats; i++) {
        const no = String(i).padStart(2, '0');
        const m = bySeat.get(no);
        seatMap.appendChild(el('div.col-seat-chip' + (m ? '.is-filled' : ''),
          el('span.col-seat-chip__no.num', { text: no }),
          el('span.col-seat-chip__name', { text: m ? m.name : '空位' })));
      }
      block.appendChild(seatMap);
      block.appendChild(el('p.rule-note', { text: '司机不占乘客座；乘车成员的补位按空余座位号分配。' }));
    }
    sec.appendChild(block);
  }
  sec.appendChild(el('div.col-role-note',
    icon('users', { size: 14 }),
    el('div',
      el('div.col-role-note__t', { text: '上车由车长确认，不等于已到家' }),
      el('div.col-role-note__d', { text: '组织者可以安排座位；发车与逐人上车由 1 号/2 号车长在自己的任务里确认。' }),
      el('button.link-btn', {
        type: 'button',
        onClick: () => ctx.ui.setState({ role: 'driver', collabTab: null }, { preserveScroll: false })
      }, el('span', { text: '切换到 1 号车长视角' }), icon('chevron-right', { size: 14 })))));
  return sec;
}

/* ---------------- 现场 ---------------- */
function fieldPanel(ctx, sc, role) {
  const sec = el('section.col-panel__inner');
  const stats = fieldStats(sc, role);
  sec.appendChild(el('div.col-panel__head',
    el('div',
      el('h2.col-panel__title', { text: '现场执行' }),
      el('div.col-panel__sub', { text: fieldSub(sc, role) })),
    el('span.col-panel__count.num', { text: sc.stage.label })));
  sec.appendChild(el('div.col-fieldstats', stats.map((s) =>
    el('div.col-fieldstat' + (s.tone ? `.is-${s.tone}` : ''),
      el('span.col-fieldstat__v.num', { text: s.v }),
      el('span.col-fieldstat__k', { text: s.k })))));

  const gate = stageGate(sc, nextStage(sc.stage.key));
  if (role === 'organizer') {
    const checkBlock = el('div.col-gate');
    checkBlock.appendChild(el('div.col-gate__head', { text: '阶段检查' }));
    const checks = gate.checks.length ? gate.checks : [{ ok: true, text: '当前阶段没有阻断事项', meta: '' }];
    checks.forEach((c) => checkBlock.appendChild(el('div.col-check' + (c.ok ? '.is-ok' : '.is-bad'),
      el('span.col-check__icon', icon(c.ok ? 'check' : 'alert', { size: 13 })),
      el('span.col-check__text', { text: c.text }),
      c.meta ? el('span.col-check__meta.num', { text: c.meta }) : null)));
    sec.appendChild(checkBlock);
  }

  if (sc.stage.key === 'published') {
    sec.appendChild(el('div.col-field-closed',
      el('span.col-field-closed__icon', icon('clock', { size: 18 })),
      el('div',
        el('div.col-field-closed__t', { text: '签到与上车将在集合阶段开放' }),
        el('div.col-field-closed__d', { text: '当前先完成报名审核与分车；待审核归零后即可推进到集合阶段。' }))));
  } else if (sc.stage.key === 'archived') {
    sec.appendChild(el('div.col-ok', icon('check-circle', { size: 16 }), el('span', { text: '活动已归档：名单、车辆与现场记录只读。' })));
  } else {
    const list = sc.roster.filter((m) => m.audit === 'confirmed')
      .sort((a, b) => Number(needsFor(sc, b)) - Number(needsFor(sc, a)));
    const target = sc.stage.key === 'gathering' ? list.filter((m) => needsFor(sc, m) || m.checked)
      : sc.stage.key === 'closing' ? list.filter((m) => needsFor(sc, m) || m.home)
      : list.filter((m) => needsFor(sc, m) || m.id === 'm15');
    const show = target.slice(0, 12);
    const listBlock = el('div.col-fieldlist');
    listBlock.appendChild(el('div.col-fieldlist__head',
      el('span', { text: sc.stage.key === 'gathering' ? '逐人签到与上车' : sc.stage.key === 'closing' ? '逐人确认到家' : '同行与节点' }),
      el('span.num', { text: `${target.length} 人` })));
    show.forEach((m) => {
      const act = actionFor(ctx, sc, role, m);
      listBlock.appendChild(el('div.col-fieldrow',
        el('span.col-fieldrow__name', { text: m.name }),
        el('span.col-fieldrow__seat', { text: m.vehicleId ? `${m.vehicleId === 'v1' ? '1 号' : '2 号'} ${m.seatNo === 'driver' ? '司机' : m.seatNo + ' 座'}` : m.trip === 'self' ? '自行前往' : '未分车' }),
        el('span.col-fieldrow__state',
          sc.stage.key === 'gathering'
            ? (m.checked ? '已签到' : '未签到')
            : sc.stage.key === 'closing'
              ? (m.home ? '已到家' : '未到家')
              : (m.id === 'm15' && sc.incident ? '协调中' : '已出发 · 飞泉沟')),
        act ? el('button.col-mini', { type: 'button', onClick: act.onClick }, el('span', { text: act.label }), icon('chevron-right', { size: 12 })) : null));
    });
    if (!show.length) listBlock.appendChild(el('p.rule-note', { text: '没有需要处理的成员。' }));
    sec.appendChild(listBlock);
    sec.appendChild(el('p.rule-note', { text: sc.stage.key === 'gathering' ? '签到 ≠ 上车；上车由车长逐人确认，车长看不到全量名单与敏感资料。' : sc.stage.key === 'closing' ? '代同行人确认到家需要独立授权与依据；不能批量代签。' : '节点确认由成员或现场协作者逐人完成；异常未解决会阻断归档。' }));
  }

  if (role === 'organizer' && nextStage(sc.stage.key) && sc.stage.key !== 'archived') {
    const target = nextStage(sc.stage.key);
    const gateNow = stageGate(sc, target);
    const blocked = gateNow.blockers.length > 0;
    const cta = btn(blocked ? `仍有 ${gateNow.blockers.length} 项未完成` : stageActionLabel(target), {
      variant: 'primary',
      cls: 'col-stage-cta',
      disabled: blocked,
      onClick: () => {
        if (blocked) { toast('先处理上方阻断事项，再推进阶段'); return; }
        openStageSheet(ctx, sc, target);
      }
    });
    sec.appendChild(el('div.col-stage-action', cta, el('p.rule-note', {
      text: blocked ? gateNow.blockers.map((b) => b.text).join('；') : '系统会再次校验阶段门槛；推进后不可回退。'
    })));
  } else if (role === 'staff') {
    sec.appendChild(el('p.rule-note', { text: '你不能推进阶段、审核报名、改分车或代确认到家；这些由组织者完成。' }));
  }
  return sec;
}

function fieldStats(sc, role) {
  if (sc.stage.key === 'published') return [
    { v: sc.confirmed, k: '已确认' }, { v: sc.pending, k: '待审核', tone: sc.pending ? 'clay' : '' }, { v: sc.unassigned, k: '未分车', tone: sc.unassigned ? 'clay' : '' }
  ];
  if (sc.stage.key === 'gathering') return [
    { v: sc.checked, k: '已签到' }, { v: sc.unchecked, k: '未签到', tone: sc.unchecked ? 'clay' : '' }, { v: sc.unassigned, k: '未分车', tone: sc.unassigned ? 'clay' : '' }
  ];
  if (sc.stage.key === 'active') return [
    { v: sc.confirmed - (sc.incident ? 1 : 0), k: '已出发' }, { v: sc.roster.filter((m) => m.node === 'r2').length, k: '到飞泉沟' }, { v: sc.incident ? 1 : 0, k: '异常', tone: sc.incident ? 'danger' : '' }
  ];
  if (sc.stage.key === 'closing') return [
    { v: sc.confirmed - sc.homePending, k: '已到家' }, { v: sc.homePending, k: '未确认', tone: sc.homePending ? 'clay' : '' }, { v: sc.incident ? 1 : 0, k: '异常', tone: sc.incident ? 'danger' : '' }
  ];
  return [{ v: sc.confirmed, k: '活动人数' }, { v: '只读', k: '状态' }, { v: 0, k: '异常' }];
}
function fieldSub(sc, role) {
  if (role === 'staff') return '你负责签到、节点与异常；不发车、不改分车、不代确认到家。';
  if (sc.stage.key === 'published') return '报名审核与分车完成后，才能进入集合阶段。';
  if (sc.stage.key === 'gathering') return '集合阶段按“签到 → 去程上车 → 发车”推进；每一步独立。';
  if (sc.stage.key === 'active') return '同行阶段关注节点进度、迟到协调与异常；异常未解决会阻断归档。';
  if (sc.stage.key === 'closing') return '返程阶段逐人确认到家；代确认需授权与依据。';
  return '活动已归档，记录只读。';
}

/* ---------------- 车长 ---------------- */
function driverPanel(ctx, sc) {
  const car = VEHICLES[0];
  const passengers = sc.roster.filter((m) => m.vehicleId === car.id && m.seatNo !== 'driver');
  const boarded = passengers.filter((m) => m.boarded).length;
  const departed = ctx.store.departed.has(car.id);
  const sec = el('section.col-panel__inner');
  sec.appendChild(el('div.col-panel__head',
    el('div',
      el('h2.col-panel__title', { text: `${car.label} · 本车任务` }),
      el('div.col-panel__sub', { text: `${car.plate} · 司机 许川 · 只显示本车乘客，不含全量名单与敏感资料` })),
    el('span.col-panel__count.num', { text: `${boarded} / ${passengers.length} 已上车` })));

  if (sc.stage.key === 'published') {
    sec.appendChild(el('div.col-field-closed',
      el('span.col-field-closed__icon', icon('clock', { size: 18 })),
      el('div',
        el('div.col-field-closed__t', { text: '尚未到集合阶段' }),
        el('div.col-field-closed__d', { text: '发车任务在组织者推进到集合阶段后开放；现在只能查看本车乘客。' }))));
  }

  const list = el('div.col-driver-list');
  list.appendChild(el('div.col-fieldlist__head',
    el('span', { text: '本车乘客' }),
    el('span.num', { text: `${passengers.length} 人` })));
  for (const m of passengers) {
    const canBoard = sc.stage.key === 'gathering' && m.checked && !m.boarded && !departed;
    list.appendChild(el('div.col-driver-row' + (m.boarded ? '.is-on' : ''),
      el('span.col-driver-row__seat.num', { text: m.seatNo }),
      el('div.col-driver-row__main',
        el('span.col-driver-row__name', { text: m.name }),
        el('span.col-driver-row__meta', { text: `${pickupTime(m.pickup)} ${pickName(m.pickup)} · ${m.checked ? '已签到' : '未签到'}` })),
      m.boarded
        ? el('span.col-driver-row__done', icon('check', { size: 13 }), el('span', { text: '已上车' }))
        : el('button.col-mini', {
            type: 'button',
            disabled: !canBoard || undefined,
            'aria-label': `${m.name} 确认上车`,
            onClick: () => {
              const res = ctx.store.actions.board(m.id, car.id, sc.stage.key);
              if (!res.ok) { toast(res.error); return; }
              ctx.ui.rerender();
              toast(`${m.name} 已上车（本地事务）`);
            }
          }, el('span', { text: m.checked ? (departed ? '已发车' : '确认上车') : '未签到' }), m.checked && !departed ? icon('chevron-right', { size: 12 }) : null)));
  }
  sec.appendChild(list);
  sec.appendChild(el('p.rule-note', { text: '未签到的乘客不能确认上车；签到 ≠ 上车，发车完成 ≠ 安全到家。' }));

  if (sc.stage.key === 'gathering') {
    const gaps = passengers.filter((m) => !m.boarded);
    const action = departed
      ? el('div.col-ok', icon('check-circle', { size: 16 }), el('span', { text: '本程已发车，等待组织者推进到同行阶段。' }))
      : el('div.col-driver-action',
          el('div.col-driver-action__note',
            el('strong', { text: gaps.length ? `还有 ${gaps.length} 人未上车` : '全员已上车' }),
            el('span', { text: gaps.length ? `其中未签到 ${gaps.filter((m) => !m.checked).length} 人；发车前请点清。` : '可以确认发车。' })),
          btn(gaps.length ? '检查缺口并发车' : '确认发车', {
            variant: gaps.length ? 'secondary' : 'primary',
            onClick: () => openDepartSheet(ctx, sc, car, passengers)
          }));
    sec.appendChild(action);
  } else if (sc.stage.key === 'active' || sc.stage.key === 'closing' || sc.stage.key === 'archived') {
    sec.appendChild(el('div.col-ok', icon('check-circle', { size: 16 }),
      el('span', { text: departed || sc.stage.key !== 'gathering' ? '本程已完成；返程与到家由组织者/参与者确认。' : '本程已完成。' })));
  }
  return sec;
}

/* ---------------- 阶段门槛 ---------------- */
function stageGate(sc, target) {
  if (!target) return { blockers: [], warnings: [], checks: [] };
  const blockers = [];
  const warnings = [];
  const checks = [];
  const add = (arr, text, meta, fixTab) => { arr.push({ text, meta, fixTab }); checks.push({ ok: false, text, meta }); };
  if (target === 'gathering') {
    if (sc.pending) add(blockers, `${sc.pending} 人待审核`, '进入集合前必须清零', 'roster');
    if (sc.unassigned) { warnings.push({ text: `${sc.unassigned} 人未分车`, meta: '不影响进入集合，但出发前必须解决' }); checks.push({ ok: false, text: `${sc.unassigned} 人未分车`, meta: '出发阻断，不阻断集合' }); }
    checks.push({ ok: true, text: '报名截止时间已核对', meta: '今晚 21:00' });
  }
  if (target === 'active') {
    if (sc.unchecked) add(blockers, `${sc.unchecked} 人未签到`, '逐人签到后才能出发', 'field');
    if (sc.unassigned) add(blockers, `${sc.unassigned} 人未分车`, '拼车成员必须有座位或改为自行前往', 'vehicles');
    if (sc.incident) add(blockers, '1 条异常未解决', '先处理协调中的成员', 'field');
    const shared = sc.roster.filter((m) => m.audit === 'confirmed' && m.trip === 'shared').length;
    checks.push({ ok: true, text: `${shared} 位拼车成员`, meta: '上车由车长确认' });
  }
  if (target === 'closing') {
    if (sc.incident) add(blockers, '1 条异常未解决', '异常未解决不能进入返程收尾', 'field');
    checks.push({ ok: true, text: '需要填写进入返程的原因', meta: '理由会记录' });
  }
  if (target === 'archived') {
    if (sc.homePending) add(blockers, `${sc.homePending} 人未确认到家`, '逐人确认到家后才能归档', 'field');
    if (sc.incident) add(blockers, '1 条异常未解决', '异常未解决不能归档', 'field');
    checks.push({ ok: true, text: '所有已出发成员', meta: '需有到家记录' });
  }
  return { blockers, warnings, checks };
}

/* ---------------- Sheets ---------------- */
function openAuditSheet(ctx, sc, m) {
  const body = el('div',
    el('div.col-sheet-person',
      el('span.col-sheet-person__avatar', { text: m.name.slice(0, 1) }),
      el('div',
        el('div.col-sheet-person__name', { text: m.name }),
        el('div.col-sheet-person__meta', { text: `申请于 ${m.requestedAt || '—'} · ${pickupTime(m.pickup)} ${pickName(m.pickup)} · ${m.trip === 'self' ? '自行前往' : '搭乘车辆'}` }))),
    el('div.mt-3',
      kv('报名状态', '待审核'),
      kv('名额占用', '已占 1 个名额', { tone: 'clay' }),
      kv('审核动作', '通过后转为已确认；拒绝会释放名额')),
    el('p.note.mt-3', { text: '通过后仍可在出发前取消；出发后不可取消。审核只改变报名状态，不改变分车。' }));
  const s = sheet({
    title: `${m.name} · 报名审核`,
    subtitle: '逐人审核，不能批量通过',
    body,
    actions: [
      btn('拒绝', {
        variant: 'danger',
        onClick: () => {
          const res = ctx.store.actions.audit(m.id, 'reject', sc.stage.key);
          if (!res.ok) { toast(res.error); return; }
          s.close();
          ctx.ui.rerender();
          toast(`${m.name} 未通过，名额已释放（本地事务）`);
        }
      }),
      btn('通过', {
        variant: 'primary',
        onClick: () => {
          const res = ctx.store.actions.audit(m.id, 'approve', sc.stage.key);
          if (!res.ok) { toast(res.error); return; }
          s.close();
          ctx.ui.rerender();
          const left = Math.max(0, sc.pending - 1);
          toast(`已通过 ${m.name} · 还剩 ${left} 人待审核（本地事务）`);
        }
      })
    ]
  });
}

function openAssignSheet(ctx, sc, m) {
  const vds = vehicleData(sc).filter((v) => v.pickup.includes(m.pickup) && v.freeSeats.length);
  let selected = vds.length ? { vehicleId: vds[0].id, seatNo: vds[0].freeSeats[0] } : null;
  const body = el('div');
  body.appendChild(el('div.col-sheet-person',
    el('span.col-sheet-person__avatar', { text: m.name.slice(0, 1) }),
    el('div',
      el('div.col-sheet-person__name', { text: m.name }),
      el('div.col-sheet-person__meta', { text: `${pickupTime(m.pickup)} ${pickName(m.pickup)} · ${m.trip === 'self' ? '自行前往' : '搭乘车辆'}` }))));
  body.appendChild(el('p.note.mt-3', { text: '车辆必须覆盖上车点；司机不占乘客座；同一人只占一个座位。' }));
  if (!vds.length) {
    body.appendChild(el('p.rule-note.mt-3', { text: '没有覆盖该上车点且有空位的车辆。可以先调整车辆或改为自行前往。' }));
  } else {
    const choiceSlot = el('div.mt-3');
    const paint = () => {
      choiceSlot.replaceChildren();
      for (const v of vds) {
        const isSel = selected?.vehicleId === v.id;
        const row = el('div.col-assign-vehicle' + (isSel ? '.is-selected' : ''),
          el('button.col-assign-vehicle__head', {
            type: 'button',
            onClick: () => { selected = { vehicleId: v.id, seatNo: v.freeSeats[0] }; paint(); }
          },
            el('span.col-assign-vehicle__label', { text: `${v.label} · ${v.plate}` }),
            el('span.col-assign-vehicle__meta', { text: `司机 ${v.driver} · 空余 ${v.freeSeats.length} 位` })),
          isSel ? el('div.col-assign-seats',
            el('div.col-assign-seats__k', { text: '选择座位号' }),
            el('div.col-assign-seats__grid', v.freeSeats.map((seat) =>
              el('button.col-assign-seat' + (selected.seatNo === seat ? '.is-selected' : ''), {
                type: 'button',
                onClick: () => { selected.seatNo = seat; paint(); }
              }, seat)))) : null);
        choiceSlot.appendChild(row);
      }
    };
    paint();
    body.appendChild(choiceSlot);
  }
  const confirmBtn = btn('确认安排', {
    variant: 'primary',
    disabled: !selected,
    onClick: () => {
      if (!selected) return;
      const res = ctx.store.actions.assign(m.id, selected.vehicleId, selected.seatNo, sc.stage.key);
      if (!res.ok) { toast(res.error); return; }
      s.close();
      ctx.ui.rerender();
      toast(`${m.name} 已安排到 ${selected.vehicleId === 'v1' ? '1 号中巴' : '2 号车'} ${selected.seatNo} 座（本地事务）`);
    }
  });
  const s = sheet({
    title: `${m.name} · 安排车辆`,
    subtitle: `${m.role} · ${pickName(m.pickup)}上车`,
    body,
    actions: [btn('取消', { variant: 'ghost', onClick: () => s.close() }), confirmBtn]
  });
}

function openHomeSheet(ctx, sc, m) {
  const note = el('textarea.form-input.form-textarea', { rows: 3, placeholder: '写明与本人确认的时间、方式与结果' });
  const auth = el('input.checkbox', { type: 'checkbox' });
  const confirm = btn('确认到家', { variant: 'primary', disabled: true });
  const sync = () => { confirm.disabled = !note.value.trim() || !auth.checked; };
  note.addEventListener('input', sync);
  auth.addEventListener('change', sync);
  const body = el('div',
    el('div.col-sheet-person',
      el('span.col-sheet-person__avatar', { text: m.name.slice(0, 1) }),
      el('div',
        el('div.col-sheet-person__name', { text: m.name }),
        el('div.col-sheet-person__meta', { text: `${m.vehicleId ? `${m.vehicleId === 'v1' ? '1 号中巴' : '2 号车'} ${m.seatNo} 座` : '自行前往'} · ${m.checked ? '已签到' : '未签到'}` }))),
    el('p.note.mt-3', { text: '代同行人确认到家需要独立授权与依据，不能批量代签。' }),
    formField('确认依据', note, { required: true }),
    el('label.check-row', auth, el('span', { text: '我已获得本人授权，确认其已安全到家。' })));
  confirm.addEventListener('click', () => {
    const res = ctx.store.actions.home(m.id, note.value, auth.checked, sc.stage.key);
    if (!res.ok) { toast(res.error); return; }
    s.close();
    ctx.ui.rerender();
    toast(`${m.name} 已确认到家（本地事务）`);
  });
  const s = sheet({ title: `${m.name} · 确认到家`, subtitle: '返程报平安', body, actions: [btn('取消', { variant: 'ghost', onClick: () => s.close() }), confirm] });
}

function openIncidentSheet(ctx, sc) {
  const inc = sc.incident;
  if (!inc) { toast('当前没有未解决异常'); return; }
  const result = el('textarea.form-input.form-textarea', { rows: 3, placeholder: '写明协调方式与当前结果，例如：已从犀浦上车，预计 09:10 到达起点' });
  const confirm = btn('标记已协调', { variant: 'primary', disabled: true });
  result.addEventListener('input', () => { confirm.disabled = !result.value.trim(); });
  confirm.addEventListener('click', () => {
    const res = ctx.store.actions.resolveIncident(result.value, sc.stage.key);
    if (!res.ok) { toast(res.error); return; }
    s.close();
    ctx.ui.rerender();
    toast('异常已处理；还需所有成员到家后才能归档（本地事务）');
  });
  const body = el('div',
    el('div.col-sheet-person',
      el('span.col-sheet-person__avatar', { text: inc.name.slice(0, 1) }),
      el('div',
        el('div.col-sheet-person__name', { text: inc.name }),
        el('div.col-sheet-person__meta', { text: '迟到 · 协调中 · 未解决' }))),
    el('div.mt-3',
      kv('异常类型', '迟到'),
      kv('现场记录', inc.text),
      kv('当前状态', '未解决', { tone: 'clay' })),
    formField('处理结果', result, { required: true }),
    el('p.note', { text: '未解决异常会阻断归档；处理结果只记录本次操作，不替代现场安全确认。' }));
  const s = sheet({ title: '处理异常', subtitle: `${inc.name} · 迟到协调`, body, actions: [btn('关闭', { variant: 'ghost', onClick: () => s.close() }), confirm] });
}

function openMemberSheet(m) {
  const rows = el('div');
  rows.appendChild(kv('报名状态', m.audit === 'confirmed' ? '已确认' : m.audit === 'pending' ? '待审核' : m.audit === 'rejected' ? '未通过' : m.audit));
  rows.appendChild(kv('上车点', `${pickupTime(m.pickup)} ${pickName(m.pickup)}`));
  rows.appendChild(kv('车辆与座位', m.vehicleId ? `${m.vehicleId === 'v1' ? '1 号中巴' : '2 号车'} · ${m.seatNo === 'driver' ? '司机' : m.seatNo + ' 座'}` : m.trip === 'self' ? '自行前往' : '未分车'));
  rows.appendChild(kv('签到', m.checked ? '已签到' : '未签到'));
  rows.appendChild(kv('去程上车', m.boarded === true ? '已上车' : m.boarded === false ? '未上车' : '—'));
  rows.appendChild(kv('节点', m.node === 'r2' ? '飞泉沟' : m.node === 'r1' ? '泰安古镇' : '—'));
  if (m.home) rows.appendChild(kv('到家', '已确认'));
  const s = sheet({
    title: `${m.name} · 同行状态`,
    subtitle: m.role,
    body: el('div', rows, el('p.note.mt-3', { text: '电话、健康备注与紧急联系人属于敏感资料；工作台不在此处展示，需按用途另行查看。' })),
    actions: [btn('关闭', { variant: 'ghost', onClick: () => s.close() })]
  });
}

function openStageSheet(ctx, sc, target) {
  const gate = stageGate(sc, target);
  const attest = el('input.checkbox', { type: 'checkbox' });
  const reason = el('textarea.form-input.form-textarea', { rows: 3, placeholder: '写明提前进入返程的原因，例如：午后阵雨，山脊风大，决定提前下撤' });
  const warningText = gate.warnings.map((w) => `${w.text}（${w.meta}）`).join('；');
  const body = el('div');
  const checkRows = el('div.col-gate-sheet');
  const checks = gate.checks.length ? gate.checks : [{ ok: true, text: '没有阻断事项', meta: '' }];
  checks.forEach((c) => checkRows.appendChild(el('div.col-check' + (c.ok ? '.is-ok' : '.is-bad'),
    el('span.col-check__icon', icon(c.ok ? 'check' : 'alert', { size: 13 })),
    el('span.col-check__text', { text: c.text }),
    c.meta ? el('span.col-check__meta', { text: c.meta }) : null)));
  body.appendChild(checkRows);
  if (warningText) body.appendChild(el('p.col-warn-note', { text: `提醒：${warningText}` }));
  if (target === 'active') {
    body.appendChild(el('label.check-row.mt-3', attest,
      el('span', { text: '我已与车长确认：拼车成员已完成去程上车，签到与分车缺口已处理。' })));
  }
  if (target === 'closing') {
    body.appendChild(formField('进入返程的原因', reason, { required: true }));
  }
  body.appendChild(el('p.note.mt-3', { text: '阶段推进不可回退；系统会再次校验门槛。未完成的事项不会被隐藏。' }));
  const actionError = el('p.form-error', { role: 'alert' });
  body.appendChild(actionError);

  const primary = btn(stageActionLabel(target), { variant: 'primary', disabled: gate.blockers.length > 0 });
  const sync = () => {
    let disabled = gate.blockers.length > 0;
    if (target === 'active' && !attest.checked) disabled = true;
    if (target === 'closing' && !reason.value.trim()) disabled = true;
    primary.disabled = disabled;
  };
  attest.addEventListener('change', sync);
  reason.addEventListener('input', sync);
  sync();
  primary.addEventListener('click', () => {
    if (primary.disabled) return;
    actionError.textContent = '';
    const res = ctx.store.actions.advance(target, sc.stage.key);
    if (!res.ok) { actionError.textContent = res.error; return; }
    if (target === 'closing') ctx.store.closingReason = reason.value.trim();
    s.close();
    ctx.ui.setState({ stage: target, collabTab: null }, { preserveScroll: false });
    toast(`已推进到「${target === 'gathering' ? '正在集合' : target === 'active' ? '正在同行' : target === 'closing' ? '返程报平安' : '已归档'}」（本地事务）`);
  });
  const actions = [btn('取消', { variant: 'ghost', onClick: () => s.close() })];
  if (gate.blockers.length) {
    const fixTab = gate.blockers[0].fixTab || 'roster';
    actions.push(btn('去处理', {
      variant: 'secondary',
      onClick: () => {
        s.close();
        ctx.ui.setState({ collabTab: fixTab }, { preserveScroll: false });
      }
    }));
  }
  actions.push(primary);
  const s = sheet({ title: `推进到${target === 'gathering' ? '集合' : target === 'active' ? '同行' : target === 'closing' ? '返程' : '归档'}阶段`, subtitle: gate.blockers.length ? '还有阻断事项' : gate.warnings.length ? '门槛已满足 · 有出发提醒' : '门槛已满足', body, actions, wide: true });
}

function openDepartSheet(ctx, sc, car, passengers) {
  const gaps = passengers.filter((m) => !m.boarded);
  const unChecked = gaps.filter((m) => !m.checked);
  const body = el('div');
  if (gaps.length) {
    body.appendChild(el('p.col-warn-note', { text: `还有 ${gaps.length} 人未上车，其中 ${unChecked.length} 人未签到。发车前请点清；系统会记录本次发车。` }));
    body.appendChild(el('div.col-gap-list', gaps.map((m) =>
      el('div.col-gap-row',
        el('span', { text: m.name }),
        el('span', { text: m.checked ? '已签到 · 未上车' : '未签到' }),
        el('span', { text: `${m.seatNo} 座` })))));
  } else {
    body.appendChild(el('p.col-ok', icon('check-circle', { size: 16 }), el('span', { text: '全员已上车，可以发车。' })));
  }
  const s = sheet({
    title: '确认发车',
    subtitle: `${car.label} · ${car.plate}`,
    body,
    actions: [
      btn('返回', { variant: 'ghost', onClick: () => s.close() }),
      btn(gaps.length ? '仍然发车' : '确认发车', {
        variant: gaps.length ? 'danger' : 'primary',
        onClick: () => {
          const res = ctx.store.actions.depart(car.id, sc.stage.key);
          if (!res.ok) { toast(res.error); return; }
          s.close();
          ctx.ui.rerender();
          toast(gaps.length ? `已发车，仍有 ${gaps.length} 人未上车（本地事务）` : '已确认发车（本地事务）');
        }
      })
    ]
  });
}

/* ---------------- 组装 ---------------- */
export function render(ctx) {
  const { D, state, ui } = ctx;
  const a = D.activities.find((x) => x.id === state.activityId) || D.featured;
  const page = el('div.page.col-page', { data: { page: 'collab' } });
  const appbar = appBar({
    back: () => ui.go('detail', { activityId: a.id, signup: 'organizer' }),
    subtitle: '活动协作',
    title: a.title,
    actions: [iconBtn('users', '查看活动详情', () => ui.go('detail', { activityId: a.id, signup: 'organizer' }))]
  });
  page.appendChild(appbar);

  if (a.id !== FEATURED.id) {
    page.appendChild(emptyBlock({
      iconName: 'users',
      title: '协作演示仅主活动',
      body: '本轮的四页联动与角色/阶段演示以“青城后山 · 飞泉沟轻徒步”为主活动；其他活动仅提供发现索引与通用详情。',
      action: '打开青城后山协作',
      onAction: () => ui.go('collab', { activityId: FEATURED.id, stage: 'published', role: 'organizer' })
    }));
    return page;
  }

  if (state.data === 'loading') {
    page.appendChild(el('div.loading-block', { text: '正在加载协作数据…' }));
    return page;
  }
  if (state.data === 'error') {
    page.appendChild(el('div.empty',
      el('span.empty__icon', icon('alert', { size: 26 })),
      el('h2.empty__title', { text: '协作数据加载失败' }),
      el('p.empty__body', { text: '网络或服务暂时不可用。名单、车辆与现场数据不会展示过期版本。' }),
      btn('重新加载', { variant: 'secondary', onClick: () => ui.toast('演示：重新加载只还原本地演示数据') })));
    return page;
  }
  if (state.data === 'empty') {
    page.appendChild(el('div.empty',
      el('span.empty__icon', icon('users', { size: 26 })),
      el('h2.empty__title', { text: '还没有可协作的成员' }),
      el('p.empty__body', { text: '活动发布并通过报名后，名单、车辆与现场任务会出现在这里。' }),
      btn('返回活动', { variant: 'secondary', onClick: () => ui.go('detail', { activityId: a.id, signup: 'organizer' }) })));
    return page;
  }

  const sc = scenario(state.stage, ctx.store);
  const role = state.role;
  const tasks = tasksFor(sc, role);

  page.appendChild(commandHeader(sc, role));

  const tabsSlot = el('div.col-tabs-slot');
  const panelSlot = el('div.col-panel');

  const defaultTab = role === 'staff' || role === 'driver'
    ? 'field'
    : sc.stage.key === 'gathering' || sc.stage.key === 'active' || sc.stage.key === 'closing' ? 'field' : 'roster';
  let tab = state.collabTab || defaultTab;
  if (role === 'staff' || role === 'driver') tab = 'field';
  if (!['roster', 'vehicles', 'field'].includes(tab)) tab = defaultTab;
  if (role !== 'organizer' && tab === 'vehicles') tab = 'field';

  const setTab = (key, scroll = false) => {
    if (key === 'vehicles' && role !== 'organizer') key = 'field';
    tab = key;
    state.collabTab = key;
    paintTabs();
    paintPanel();
    if (scroll) {
      requestAnimationFrame(() => {
        const panel = page.querySelector('.col-panel');
        if (panel) page.scrollTo({ top: panel.offsetTop - 56, behavior: 'smooth' });
      });
    }
  };

  function paintTabs() {
    if (role !== 'organizer') { tabsSlot.replaceChildren(); return; }
    const counts = {
      roster: sc.roster.length,
      vehicles: sc.unassigned,
      field: sc.stage.key === 'gathering' ? sc.unchecked : sc.stage.key === 'closing' ? sc.homePending : sc.incident ? 1 : 0
    };
    const seg = segmented([
      { key: 'roster', label: '名单', count: counts.roster },
      { key: 'vehicles', label: '车辆', count: counts.vehicles },
      { key: 'field', label: '现场', count: counts.field }
    ], tab, (key) => setTab(key), { ariaLabel: '协作面板' });
    seg.classList.add('col-tabs');
    tabsSlot.replaceChildren(seg);
  }

  function paintPanel() {
    let node;
    if (role === 'driver') node = driverPanel(ctx, sc);
    else if (role === 'staff') node = fieldPanel(ctx, sc, role);
    else if (tab === 'vehicles') node = vehiclePanel(ctx, sc, role);
    else if (tab === 'field') node = fieldPanel(ctx, sc, role);
    else node = rosterPanel(ctx, sc, role);
    panelSlot.replaceChildren(node);
  }

  page.appendChild(taskSection(ctx, sc, role, tasks, setTab));
  page.appendChild(tabsSlot);
  page.appendChild(panelSlot);
  page.appendChild(el('div.provenance',
    icon('info', { size: 13 }),
    el('span', { text: '演示数据：名单/车辆来自真实产品口径；全量名单仅工作台；车长仅见本车乘客。' })));

  paintTabs();
  paintPanel();

  page.addEventListener('scroll', () => {
    const top = appbar.getBoundingClientRect().top - page.getBoundingClientRect().top;
    appbar.classList.toggle('is-scrolled', page.scrollTop > 6);
  }, { passive: true });

  return page;
}

function formField(label, input, { required = false } = {}) {
  return el('label.form-field',
    el('span.form-field__label', { text: label }, required ? el('span.form-field__req', { text: '必填' }) : null),
    input);
}

