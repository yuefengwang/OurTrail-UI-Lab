// 活动详情 — 决策事实 → 适合/风险 → 路线与集合 → 行程 → 准备 → 领队 → 费用
// 主行动唯一且随报名状态/角色变化；参与者不看全量名单。
import {
  el, icon, cover, statusChip, appBar, iconBtn, sectionHead, btn,
  sheet, confirmSheet, copyText, toast, kv
} from './ui.js';
import { routeMap, elevationProfile } from './charts.js';
import {
  NOW, FEATURED, isPast, statusOf, hhmm, md, dayLabel, scenario
} from './data.js';

const isMain = (a) => a.id === FEATURED.id;

function findActivity(D, id) {
  return D.activities.find((x) => x.id === id) || D.featured;
}

function effectiveState(a, requested) {
  if (a.statusKey === 'cancelled') return 'cancelled';
  if (isPast(a)) return 'archived';
  return requested || 'new';
}

function countsFor(a, eff) {
  if (eff === 'waitlist') {
    return { confirmed: a.capacity, pending: 0, waitlisted: 2, remaining: 0 };
  }
  if (eff === 'archived') {
    return { confirmed: Math.min(a.capacity, a.confirmed + a.pending), pending: 0, waitlisted: 0, remaining: 0 };
  }
  if (eff === 'cancelled') {
    return { confirmed: a.confirmed, pending: 0, waitlisted: 0, remaining: 0 };
  }
  return {
    confirmed: a.confirmed,
    pending: a.pending,
    waitlisted: 0,
    remaining: Math.max(0, a.capacity - a.confirmed - a.pending)
  };
}

function deadline(a) {
  const d = new Date(a.deadlineAt);
  if (d <= NOW) return '已截止';
  const diff = d - NOW;
  if (d.getDate() === NOW.getDate() && diff < 24 * 36e5) return `今晚 ${hhmm(d)}`;
  if (diff < 48 * 36e5) return `${md(d)} ${hhmm(d)}`;
  return `${md(d)} ${hhmm(d)}`;
}

function meetingInfo(a) {
  if (Array.isArray(a.meetingPoints) && a.meetingPoints.length) {
    const p = a.meetingPoints[0];
    return { text: `${p.time} ${p.name}`, detail: p.detail };
  }
  return { text: `${a.meetingTime || '—'} ${a.meeting || '集合点待定'}`, detail: '' };
}

function meetingCountdown(a) {
  if (a.statusKey === 'cancelled') return '活动已取消';
  if (isPast(a)) return '活动已结束';
  const m = meetingInfo(a);
  const tm = /^(\d{1,2}):(\d{2})/.exec(m.text || '');
  if (!tm) return `距出发 ${Math.max(0, Math.round((new Date(a.startAt) - NOW) / 36e5))} 小时`;
  const d = new Date(a.startAt);
  const meeting = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(tm[1]), Number(tm[2]));
  const diff = meeting - NOW;
  if (diff < 0) return '已过集合时间';
  if (diff < 24 * 36e5) return `距集合 ${Math.max(1, Math.floor(diff / 36e5))} 小时`;
  return `距集合 ${Math.round(diff / 864e5)} 天`;
}

function viewerFor(eff) {
  if (eff === 'organizer') return { name: '陈屿', role: '组织者', pickup: 'p1', vehicle: '1 号中巴', seat: '01', submitted: '10/22 18:40' };
  if (eff === 'confirmed') return { name: '林溪', role: '成员', pickup: 'p1', vehicle: '1 号中巴', seat: '03', submitted: '10/21 09:12' };
  if (eff === 'pending') return { name: '白露', role: '成员', pickup: 'p2', vehicle: null, seat: null, submitted: '今天 20:06' };
  if (eff === 'waitlist') return { name: '林溪', role: '成员', pickup: 'p1', vehicle: null, seat: null, position: 2 };
  if (eff === 'withdrawn') return { name: '林溪', role: '成员', pickup: 'p1', vehicle: null, seat: null };
  return { name: '林溪', role: '访客', pickup: 'p1', vehicle: null, seat: null };
}

function stateChip(a, eff) {
  if (eff === 'organizer') return { word: '组织者', tone: 'calm', shape: 'check' };
  if (eff === 'pending') return { word: '待审核', tone: 'clay', shape: 'dot' };
  if (eff === 'confirmed') return { word: '已确认', tone: 'go', shape: 'check' };
  if (eff === 'waitlist') return { word: '候补中', tone: 'clay', shape: 'dot' };
  if (eff === 'withdrawn') return { word: '已取消报名', tone: 'mute', shape: 'minus' };
  if (eff === 'rejected') return { word: '未通过', tone: 'danger', shape: 'x' };
  if (eff === 'closed') return { word: '报名关闭', tone: 'mute', shape: 'minus' };
  if (eff === 'cancelled') return { word: '已取消', tone: 'danger', shape: 'x' };
  if (eff === 'archived') return { word: '已归档', tone: 'mute', shape: 'minus' };
  return statusOf(a);
}

function stateCopy(a, eff, c, viewer) {
  const left = c.remaining;
  const base = {
    new: {
      tone: 'clay', iconName: 'clock',
      title: `报名${deadline(a)} 截止`,
      text: `余位 ${left} / ${a.capacity} · ${c.confirmed} 人已确认${c.pending ? ` · ${c.pending} 人待审核` : ''}`,
      meta: '报名截止后不再接受新报名；待审核名额已占位。'
    },
    pending: {
      tone: '', iconName: 'clock',
      title: '报名已收到，等待领队审核',
      text: `提交于 ${viewer.submitted} · ${a.approvalMode === 'automatic' ? '自动通过' : '领队逐人审核'}`,
      meta: `待审核已占名额 · ${c.pending} 人待审核 · 余位 ${left} / ${a.capacity} · ${c.confirmed} 人已确认`
    },
    confirmed: {
      tone: '', iconName: 'check-circle',
      title: '名额已确认',
      text: `${viewer.vehicle || '车辆待安排'}${viewer.seat ? ` · ${viewer.seat} 座` : ''} · ${viewer.pickup === 'p2' ? '犀浦 07:20' : '茶店子 07:00'} 上车`,
      meta: '拼车安排由领队在工作台确认；出发前会再次通知。'
    },
    waitlist: {
      tone: 'clay', iconName: 'users',
      title: '你在候补队列中',
      text: `候补第 ${viewer.position || 2} 位 · 有空位时按顺序递补`,
      meta: '候补不占正式名额；递补后仍需审核。'
    },
    withdrawn: {
      tone: 'mute', iconName: 'minus',
      title: '你已取消本次报名',
      text: '名额已释放 · 如需参加可以重新报名',
      meta: '出发后不可取消；费用与退改请线下与领队协商。'
    },
    rejected: {
      tone: 'danger', iconName: 'x',
      title: '报名未通过',
      text: '领队未通过本次报名，名额已释放',
      meta: '可以联系领队了解原因，或重新选择其他活动。'
    },
    closed: {
      tone: 'mute', iconName: 'minus',
      title: '报名已关闭',
      text: `报名于 ${deadline(a)} 截止 · 活动安排仍可查看`,
      meta: '已报名者仍可查看集合与出行安排。'
    },
    cancelled: {
      tone: 'danger', iconName: 'x',
      title: '活动已取消',
      text: '不再执行行程；费用与退改请在线下向组织者确认',
      meta: '页面只读，不再显示现场操作。'
    },
    archived: {
      tone: 'mute', iconName: 'check-circle',
      title: '活动已归档',
      text: '安排、名单与现场记录仅供回看',
      meta: '页面只读。'
    },
    organizer: {
      tone: '', iconName: 'users',
      title: `你发起的活动 · ${isMain(a) ? '行前准备' : '只读演示'}`,
      text: isMain(a) ? `${c.pending} 人待审核 · 1 人未分车 · ${deadline(a)} 报名截止` : '该活动未提供协作演示数据',
      meta: isMain(a) ? '进入协作工作台处理待办，再推进到集合阶段。' : '可打开青城后山的协作页查看完整演示。'
    }
  };
  return base[eff] || base.new;
}

/* ---------------- Hero ---------------- */
function heroSection(a, c, eff, viewer) {
  const m = meetingInfo(a);
  const st = stateChip(a, eff);
  const fee = a.fee.replace(/\s*\/\s*人$/, '');
  const copy = stateCopy(a, eff, c, viewer);
  return el('section.det-hero',
    el('div.det-hero__media.bleed',
      cover(a, { ratio: '16 / 9', alt: `${a.title} 氛围图`, eager: true }),
      el('div.det-hero__scrim'),
      el('span.det-hero__date', { text: `${dayLabel(a.startAt)} · ${m.text}` }),
      el('span.det-hero__count.num', { text: meetingCountdown(a) })),
    el('div.det-hero__body',
      el('div.det-hero__statusline',
        statusChip({ __status: st }),
        el('span.det-hero__dot', { text: '·' }),
        el('span', { text: `${c.confirmed} 人已确认` }),
        eff === 'new' || eff === 'organizer'
          ? el('span.det-hero__dot', { text: '·' })
          : null,
        eff === 'new' || eff === 'organizer'
          ? el('span.det-hero__seats', { text: `余位 ${c.remaining} / ${a.capacity}` })
          : null),
      el('h1.det-hero__title', { text: a.title }),
      el('p.det-hero__route', { text: `${a.routeName} · ${a.city}` }),
      el('div.det-hero__facts',
        heroFact('距离', a.distanceKm, 'km'),
        heroFact('爬升', Number(a.ascentM).toLocaleString('zh-CN'), 'm'),
        heroFact('难度', a.difficulty),
        heroFact('人均', fee)),
      el('p.det-hero__suitable', { text: `适合 ${a.suitableFor || `能完成 ${a.distanceKm} km、爬升 ${a.ascentM} m 的徒步者；请按自身体能判断。`}` }),
      el('div.state-strip' + (copy.tone ? `.state-strip--${copy.tone}` : ''),
        el('span.state-strip__icon', icon(copy.iconName, { size: 17 })),
        el('div.state-strip__body',
          el('div.state-strip__title', { text: copy.title }),
          el('div.state-strip__text', { text: copy.text }),
          el('div.state-strip__meta', { text: copy.meta })))));
}

function heroFact(k, v, u = '') {
  return el('div.det-fact',
    el('span.det-fact__k', { text: k }),
    el('span.det-fact__v',
      el('span.num', { text: String(v) }),
      u ? el('span.det-fact__u', { text: u }) : null));
}

/* ---------------- Brief ---------------- */
function briefSection(a) {
  const risk = (a.risks || [])[0];
  return el('section.det-brief',
    el('div.det-brief__col',
      el('span.det-brief__k', { text: '适合谁' }),
      el('p.det-brief__t', { text: a.suitableFor || '按路线强度与自身体能判断；第一次参加建议先联系领队。' })),
    el('div.det-brief__col',
      el('span.det-brief__k', { text: '需要留意' }),
      el('p.det-brief__t',
        risk ? `${risk.title}；${risk.advice}` : '组织者尚未补充具体风险；户外活动存在天气与路况变化。')));
}

/* ---------------- Route ---------------- */
function routeSection(a, ctx, viewer, eff) {
  const points = a.routePoints || [];
  const pickups = a.meetingPoints || [{ id: 'p1', name: a.meeting || '集合点待定', detail: '', time: a.meetingTime || '—', role: '集合点' }];
  const sec = el('section.det-sec', { id: 'route', 'data-section': 'route' });
  sec.appendChild(sectionHead('路线与集合', points.length ? `${points.length} 个节点 · ${pickups.length} 个上车点` : `${pickups.length} 个上车点`));

  if (points.length) {
    let selected = points[1]?.id || points[0].id;
    const slot = el('div.det-route');
    const paint = () => {
      slot.replaceChildren(
        el('div.det-map',
          routeMap(points, { selectedId: selected, onSelect: (id) => { selected = id; paint(); } }),
          el('span.det-map__badge', { text: '路线示意 · 非导航地图' })),
        el('div.det-profile',
          el('div.det-profile__head',
            el('span', { text: '海拔剖面' }),
            el('span.num', { text: `${Number(a.ascentM).toLocaleString('zh-CN')} m 累计爬升` })),
          elevationProfile(points, { selectedId: selected, onSelect: (id) => { selected = id; paint(); } })),
        el('div.det-points',
          points.map((p, i) => el('button.det-point' + (p.id === selected ? '.is-selected' : ''), {
            type: 'button',
            onClick: () => { selected = p.id; paint(); }
          },
            el('span.det-point__n.num', { text: String(i + 1) }),
            el('span.det-point__main',
              el('span.det-point__name', { text: p.name }),
              el('span.det-point__note', { text: p.note || (p.kind === 'start' ? '起点' : p.kind === 'finish' ? '终点' : '途中节点') })),
            el('span.det-point__meta',
              el('span.num', { text: `${p.ele} m` }),
              el('span', { text: p.eta }))))));
    };
    paint();
    sec.appendChild(slot);
  } else {
    sec.appendChild(el('div.det-route-empty',
      el('span.det-route-empty__t', { text: '路线节点由组织者补充' }),
      el('span.det-route-empty__d', { text: '当前可以先确认集合点与出发时间；完整路线图只在主活动演示中提供。' })));
  }

  sec.appendChild(el('div.det-pickup-head', { text: '集合与上车' }));
  sec.appendChild(el('div.det-pickups',
    pickups.map((p) => {
      const mine = (eff === 'confirmed' || eff === 'pending') && viewer.pickup === p.id;
      return el('div.det-pickup' + (mine ? '.is-mine' : ''),
        el('span.det-pickup__time.num', { text: p.time }),
        el('span.det-pickup__main',
          el('span.det-pickup__name', { text: p.name }),
          el('span.det-pickup__detail', { text: p.detail || '集合点' })),
        mine ? el('span.tag.tag--brand', { text: '我的上车点' }) :
          el('span.det-pickup__role', { text: p.role }));
    })));

  if (isMain(a)) {
    sec.appendChild(el('button.det-weather', {
      type: 'button',
      onClick: () => ctx.ui.go('weather', { activityId: a.id, point: points[1]?.id || 'r2', hour: '' })
    },
      el('span.det-weather__icon', icon('rain', { size: 18 })),
      el('span.det-weather__main',
        el('span.det-weather__t', { text: '活动日午后有阵雨，山脊风大' }),
        el('span.det-weather__d', { text: '12:00–16:00 降水 58–82% · 建议 12:30 前通过白云索道段' })),
      el('span.det-weather__go', { text: '路线天气', icon: icon('chevron-right', { size: 14 }) })));
  } else {
    sec.appendChild(el('p.rule-note', { text: '该活动尚未提供路线天气演示。' }));
  }

  return sec;
}

/* ---------------- Itinerary ---------------- */
function itinerarySection(a) {
  const items = a.itinerary || [
    [a.meetingTime || '—', `${a.meeting || '集合点'} 集合出发`],
    ['—', '详细行程由组织者补充']
  ];
  const groups = items.length >= 6
    ? [
        { label: '集合与去程', items: items.slice(0, 3) },
        { label: '上山', items: items.slice(3, 5) },
        { label: '下撤与返程', items: items.slice(5) }
      ]
    : [{ label: '安排', items }];
  const sec = el('section.det-sec',
    sectionHead('行程安排', items.length ? `${items.length} 个时间点` : '待补充'));
  for (const g of groups) {
    sec.appendChild(el('div.itin__group', { text: g.label }));
    const list = el('div.itin');
    for (const [time, text] of g.items) {
      const key = /12:40/.test(time);
      list.appendChild(el('div.itin__row' + (key ? '.is-key' : ''),
        el('span.itin__time.num', { text: time }),
        el('span.itin__rail', { 'aria-hidden': 'true' }, el('span.itin__dot')),
        el('span.itin__text', { text }),
        key ? el('span.itin__tag', { text: '折返判断' }) : null));
    }
    sec.appendChild(list);
  }
  return sec;
}

/* ---------------- Gear + risk ---------------- */
function prepSection(a) {
  const reqs = a.requirements || [];
  const risks = a.risks || [];
  const prepared = new Set();
  const sec = el('section.det-sec',
    sectionHead('出发前准备', reqs.length ? `${reqs.length} 项装备` : '领队建议'));

  if (reqs.length) {
    const count = el('span.det-gear__count.num', { text: `0 / ${reqs.length} 已准备` });
    const barFill = el('i.det-gear__fill');
    const list = el('div.det-gear');
    const paintCount = () => {
      count.textContent = `${prepared.size} / ${reqs.length} 已准备`;
      barFill.style.width = `${Math.round((prepared.size / reqs.length) * 100)}%`;
    };
    for (const item of reqs) {
      const row = el('button.det-gear__row', {
        type: 'button', role: 'checkbox', 'aria-checked': 'false',
        onClick: () => {
          const next = !prepared.has(item);
          if (next) prepared.add(item); else prepared.delete(item);
          row.classList.toggle('is-done', next);
          row.setAttribute('aria-checked', next ? 'true' : 'false');
          paintCount();
        }
      },
        el('span.det-gear__box', { 'aria-hidden': 'true' }, icon('check', { size: 12 })),
        el('span.det-gear__label', { text: item }));
      list.appendChild(row);
    }
    paintCount();
    sec.appendChild(el('div.det-gear__head',
      el('span.det-gear__hint', { text: '这是领队的建议清单，不是平台强制。' }),
      count));
    sec.appendChild(el('div.det-gear__bar', barFill));
    sec.appendChild(list);
    sec.appendChild(el('p.note', { text: '雨具和防滑鞋是这条线的硬要求；山顶与山脊温差明显。' }));
  } else {
    sec.appendChild(el('p.rule-note', { text: '装备清单由组织者补充；请至少准备饮水、雨具与防滑鞋。' }));
  }

  if (risks.length) {
    sec.appendChild(el('div.det-risk-head', { text: '风险与应对' }));
    sec.appendChild(el('div.det-risks', risks.map((r) =>
      el('div.det-risk',
        el('span.det-risk__dot', { 'aria-hidden': 'true' }),
        el('div.det-risk__body',
          el('div.det-risk__title',
            el('span', { text: r.title }),
            el('span.tag.tag--clay', { text: '需要留意' })),
          el('div.det-risk__advice', { text: r.advice }))))));
  } else {
    sec.appendChild(el('p.rule-note', { text: '组织者尚未补充具体风险；户外活动存在天气与路况变化。' }));
  }
  return sec;
}

/* ---------------- Leader ---------------- */
function leaderSection(a, viewer, eff) {
  const sec = el('section.det-sec',
    sectionHead('发起人与同行', `${a.confirmed} 人已确认`));
  sec.appendChild(el('div.det-leader',
    el('span.det-leader__avatar', { 'aria-hidden': 'true', text: String(a.leader || '领').slice(0, 1) }),
    el('div.det-leader__body',
      el('div.det-leader__name',
        el('span', { text: a.leader }),
        el('span.tag.tag--brand', { text: '发起人 · 领队' })),
      el('p.det-leader__intro', { text: a.organizerIntro || '活动说明与集合安排由发起人补充。' }),
      el('div.det-leader__meta',
        el('span', { text: `${a.confirmed} 人已确认` }),
        a.staff ? el('span', { text: ` · 协作 ${a.staff}` }) : null))));

  if (eff === 'confirmed') {
    sec.appendChild(el('div.det-mine',
      el('div.det-mine__k', { text: '我的安排' }),
      kv('上车点', viewer.pickup === 'p2' ? '犀浦 07:20' : '茶店子 07:00'),
      kv('车辆与座位', `${viewer.vehicle || '待安排'}${viewer.seat ? ` · ${viewer.seat} 座` : ''}`),
      kv('签到', '集合时由领队或协作确认')));
  } else if (eff === 'pending') {
    sec.appendChild(el('div.det-mine',
      el('div.det-mine__k', { text: '我的安排' }),
      kv('报名状态', '待领队审核'),
      kv('上车点', '犀浦 07:20'),
      kv('车辆与座位', '审核通过后安排', { tone: 'clay' })));
  } else if (eff === 'waitlist') {
    sec.appendChild(el('div.det-mine',
      el('div.det-mine__k', { text: '我的安排' }),
      kv('候补顺位', `第 ${viewer.position || 2} 位`),
      kv('正式名额', '未占用', { tone: 'clay' })));
  } else if (eff === 'organizer') {
    sec.appendChild(el('div.det-mine',
      el('div.det-mine__k', { text: '组织者视角' }),
      kv('待审核', '3 人', { tone: 'clay' }),
      kv('未分车', '1 人'),
      kv('完整名单与车辆', '仅在协作工作台')));
  } else if (!isMain(a) || eff === 'new') {
    sec.appendChild(el('p.rule-note', { text: '同行人名单只显示我本人与由我代报名的同行人；全量名单在组织者工作台。' }));
  }
  return sec;
}

/* ---------------- Fee ---------------- */
function feeSection(a) {
  const sec = el('section.det-sec',
    sectionHead('费用与退出', a.fee));
  const box = el('div.det-fee');
  box.appendChild(kv('人均费用', a.fee || '待说明'));
  box.appendChild(kv('结算方式', '活动结束后群内结算', { tone: 'brand' }));
  box.appendChild(kv('退出约定', a.cancellationNote || '出发前可与领队协商；出发后不支持退款。'));
  sec.appendChild(box);
  sec.appendChild(el('p.note', { text: 'OurTrail 不收款、不处理支付或退款；费用由组织者线下结算。' }));
  return sec;
}

/* ---------------- Sheets ---------------- */
function formField(label, input, { hint = '', required = false } = {}) {
  return el('label.form-field',
    el('span.form-field__label', { text: label }, required ? el('span.form-field__req', { text: '必填' }) : null),
    input,
    hint ? el('span.form-field__hint', { text: hint }) : null);
}

function openSignup(ctx, a, { edit = false, eff = 'new', viewer = null } = {}) {
  const name = el('input.form-input', { type: 'text', value: edit && viewer ? viewer.name : (ctx.store?.viewerSignup?.name || '沈岚'), placeholder: '填写真实姓名', autocomplete: 'name' });
  const phone = el('input.form-input', { type: 'tel', inputmode: 'numeric', placeholder: '11 位手机号', maxlength: '11' });
  const emergencyName = el('input.form-input', { type: 'text', placeholder: '紧急联系人姓名' });
  const emergencyPhone = el('input.form-input', { type: 'tel', inputmode: 'numeric', placeholder: '紧急联系人手机号', maxlength: '11' });
  const transport = { value: 'shared' };
  const pickup = el('select.form-input',
    (a.meetingPoints || [{ id: 'p1', name: a.meeting || '集合点', time: a.meetingTime || '—' }]).map((p) =>
      el('option', { value: p.id }, `${p.time} ${p.name}`)));
  const consent = el('input.checkbox', { type: 'checkbox' });
  const homeConsent = el('input.checkbox', { type: 'checkbox' });
  const error = el('p.form-error', { role: 'alert' });
  const seg = el('div.seg.form-seg',
    ['shared', 'self'].map((k) => el('button.seg__item' + (k === 'shared' ? '.is-active' : ''), {
      type: 'button',
      'aria-pressed': k === 'shared' ? 'true' : 'false',
      onClick: (e) => {
        transport.value = k;
        seg.querySelectorAll('.seg__item').forEach((b) => {
          const on = b.textContent === (k === 'shared' ? '搭乘车辆' : '自行前往');
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        pickupWrap.classList.toggle('hide', k === 'self');
      }
    }, k === 'shared' ? '搭乘车辆' : '自行前往')));
  const pickupWrap = el('div', formField('上车点', pickup, { required: true }));
  const submit = btn(edit ? '保存修改' : '提交报名', { variant: 'primary' });
  const cancel = btn('取消', { variant: 'ghost', onClick: () => s.close() });
  const body = el('div.signup-form',
    el('div.signup-form__note',
      el('span.tag.tag--brand', { text: '报名说明' }),
      el('span', { text: '提交后由领队审核；待审核会占名额，候补不占正式名额。' })),
    formField('姓名', name, { required: true }),
    formField('手机号', phone, { required: true, hint: '仅用于本次活动联络，不展示给其他参与者。' }),
    formField('紧急联系人', emergencyName, { required: true }),
    formField('紧急联系人手机', emergencyPhone, { required: true }),
    el('div.form-field',
      el('span.form-field__label', { text: '出行方式' }, el('span.form-field__req', { text: '必选' })),
      seg),
    pickupWrap,
    el('label.check-row',
      consent,
      el('span', { text: '我同意为本次活动使用报名与紧急联系信息；活动结束后不再用于其他用途。' })),
    el('label.check-row',
      homeConsent,
      el('span', { text: '如与同行人一起报名，我确认已获得其代办授权（选填）。' })),
    error);
  const s = sheet({
    title: edit ? '修改报名资料' : '填写报名资料',
    subtitle: `${a.title} · ${deadline(a)} 截止`,
    body,
    actions: [cancel, submit],
    wide: true
  });
  submit.addEventListener('click', () => {
    error.textContent = '';
    if (name.value.trim().length < 2) { error.textContent = '请填写真实姓名（至少 2 个字）。'; name.focus(); return; }
    if (!/^1\d{10}$/.test(phone.value.trim())) { error.textContent = '请填写 11 位手机号。'; phone.focus(); return; }
    if (!emergencyName.value.trim()) { error.textContent = '请填写紧急联系人姓名。'; emergencyName.focus(); return; }
    if (!/^1\d{10}$/.test(emergencyPhone.value.trim())) { error.textContent = '请填写紧急联系人手机号。'; emergencyPhone.focus(); return; }
    if (transport.value === 'shared' && !pickup.value) { error.textContent = '请选择上车点。'; pickup.focus(); return; }
    if (!consent.checked) { error.textContent = '请先同意报名信息使用说明。'; consent.focus(); return; }
    const payload = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      emergencyName: emergencyName.value.trim(),
      emergencyPhone: emergencyPhone.value.trim(),
      transport: transport.value,
      pickup: pickup.value
    };
    const useTransaction = isMain(a) && (!edit || !!ctx.store?.viewerSignup);
    const result = useTransaction
      ? (edit ? ctx.store.actions.signupUpdate(payload, 'published') : ctx.store.actions.signupSubmit(payload, 'published'))
      : { ok: true, status: edit ? eff : 'pending' };
    if (!result.ok) {
      submit.disabled = false;
      submit.querySelector('span').textContent = edit ? '保存修改' : '提交报名';
      error.textContent = result.error;
      return;
    }
    submit.disabled = true;
    submit.querySelector('span').textContent = '提交中…';
    setTimeout(() => {
      s.close();
      ctx.ui.setState({ signup: result.status || (edit ? eff : 'pending') }, { preserveScroll: true });
      ctx.ui.toast(useTransaction
        ? (edit ? '报名资料已保存并写回名单（本地事务）' : `报名已提交，当前状态：${result.status === 'confirmed' ? '已确认' : '待审核'}（本地事务）`)
        : (edit ? '演示快照：资料修改不写回名单' : '报名已提交（演示快照）'));
    }, 480);
  });
}

function openSummary(ctx, a, eff, c, viewer) {
  const rows = el('div');
  rows.appendChild(kv('姓名', viewer.name));
  rows.appendChild(kv('报名状态', eff === 'confirmed' ? '已确认' : eff === 'pending' ? '待审核' : '候补中'));
  rows.appendChild(kv('上车点', viewer.pickup === 'p2' ? '犀浦 07:20' : '茶店子 07:00'));
  rows.appendChild(kv('车辆与座位', viewer.vehicle ? `${viewer.vehicle} · ${viewer.seat} 座` : eff === 'waitlist' ? '递补后安排' : '审核通过后安排'));
  rows.appendChild(kv('提交时间', viewer.submitted || '—'));
  const edit = (eff === 'pending' || eff === 'confirmed') && !!ctx.store?.viewerSignup;
  const cancel = eff === 'pending' || eff === 'confirmed' || eff === 'waitlist';
  const actions = [btn('关闭', { variant: 'ghost', onClick: () => s.close() })];
  if (edit) actions.push(btn('修改资料', { variant: 'secondary', onClick: () => { s.close(); setTimeout(() => openSignup(ctx, a, { edit: true, eff, viewer }), 220); } }));
  if (cancel) actions.push(btn(eff === 'waitlist' ? '退出候补' : '取消报名', {
    variant: 'danger',
    onClick: () => {
      s.close();
      setTimeout(() => confirmSheet({
        title: eff === 'waitlist' ? '退出候补？' : '取消报名？',
        body: '取消后名额会释放；出发后不可取消，费用与退改请线下与领队协商。',
        confirmText: eff === 'waitlist' ? '确认退出' : '确认取消',
        tone: 'danger',
        onConfirm: () => {
          const res = ctx.store?.viewerSignup ? ctx.store.actions.signupCancel('published') : { ok: true };
          if (!res.ok) { ctx.ui.toast(res.error); return; }
          ctx.ui.setState({ signup: 'withdrawn' }, { preserveScroll: true });
          ctx.ui.toast(eff === 'waitlist' ? '已退出候补，名额已释放（本地事务）' : '报名已取消，名额已释放（本地事务）');
        }
      }), 240);
    }
  }));
  const s = sheet({
    title: '我的报名',
    subtitle: `${a.title} · ${deadline(a)} 截止`,
    body: el('div',
      rows,
      el('p.note.mt-3', { text: '资料中的手机号与紧急联系人不会展示给其他参与者；只有组织者在必要场景下按用途查看。' })),
    actions
  });
}

async function shareActivity(a) {
  const ok = await copyText(`${a.title} · ${dayLabel(a.startAt)} ${meetingInfo(a).text}\n${location.href}`);
  toast(ok ? '活动链接已复制，请自行选择发送对象' : '未能复制链接，请复制地址栏');
}

function openMore(ctx, a, eff, viewer) {
  const actions = [];
  actions.push(el('button.menu-row', {
    type: 'button', onClick: async () => {
      const ok = await copyText(`${a.title} · ${dayLabel(a.startAt)} ${meetingInfo(a).text}\n${location.href}`);
      s.close();
      toast(ok ? '活动链接已复制，请自行选择发送对象' : '未能复制链接，请复制地址栏');
    }
  }, el('span', { text: '分享活动' }), icon('share', { size: 17 })));
  if (isMain(a)) actions.push(el('button.menu-row', {
    type: 'button', onClick: () => { s.close(); ctx.ui.go('weather', { activityId: a.id, point: 'r2', hour: '' }); }
  }, el('span', { text: '查看路线天气' }), icon('cloud', { size: 17 })));
  if (eff === 'organizer') actions.push(el('button.menu-row', {
    type: 'button', onClick: () => { s.close(); ctx.ui.setState({ signup: 'new' }, { preserveScroll: true }); toast('已切换到参与者视角（演示）'); }
  }, el('span', { text: '以参与者视角查看' }), icon('users', { size: 17 })));
  actions.push(el('button.menu-row', {
    type: 'button', onClick: () => { s.close(); ctx.ui.go('discover'); }
  }, el('span', { text: '返回发现' }), icon('arrow-right', { size: 17 })));
  const s = sheet({ title: '更多', subtitle: a.title, body: el('div.menu', actions) });
}

/* ---------------- Bottom action ---------------- */
function actionBar(ctx, a, eff, c, viewer) {
  let note = '';
  let label = '';
  let onPrimary = null;
  let aside = null;

  if (eff === 'new') {
    note = `${deadline(a)} 截止 · 余位 ${c.remaining} / ${a.capacity}`;
    label = '填写报名资料';
    onPrimary = () => openSignup(ctx, a);
    aside = iconBtn('share', '分享活动', () => shareActivity(a));
  } else if (eff === 'pending') {
    note = `待审核已占名额 · 余位 ${c.remaining} / ${a.capacity}`;
    label = '查看我的报名';
    onPrimary = () => openSummary(ctx, a, eff, c, viewer);
    aside = btn('取消报名', {
      variant: 'ghost',
      onClick: () => confirmSheet({
        title: '取消报名？',
        body: '取消后名额会释放；出发后不可取消，费用与退改请线下与领队协商。',
        confirmText: '确认取消',
        tone: 'danger',
        onConfirm: () => {
          ctx.ui.setState({ signup: 'withdrawn' }, { preserveScroll: true });
          ctx.ui.toast('报名已取消，名额已释放（演示）');
        }
      })
    });
  } else if (eff === 'confirmed') {
    note = '集合 07:00 · 茶店子客运站';
    label = '查看集合与出行安排';
    onPrimary = () => {
      const pageEl = document.querySelector('.page');
      const target = document.querySelector('#route');
      if (pageEl && target) pageEl.scrollTo({ top: target.offsetTop - 58, behavior: 'smooth' });
    };
    aside = btn('路线天气', { variant: 'ghost', onClick: () => ctx.ui.go('weather', { activityId: a.id, point: 'r2', hour: '' }) });
  } else if (eff === 'waitlist') {
    note = '候补不占正式名额 · 有空位时按顺序递补';
    label = '查看我的报名';
    onPrimary = () => openSummary(ctx, a, eff, c, viewer);
    aside = btn('退出候补', { variant: 'ghost', onClick: () => openSummary(ctx, a, eff, c, viewer) });
  } else if (eff === 'rejected') {
    note = '名额已释放 · 可重新选择活动';
    label = '看看其他活动';
    onPrimary = () => ctx.ui.go('discover');
    aside = iconBtn('share', '分享活动', () => shareActivity(a));
  } else if (eff === 'withdrawn') {
    note = '名额已释放 · 出发后不可取消';
    label = '重新报名';
    onPrimary = () => openSignup(ctx, a);
    aside = iconBtn('share', '分享活动', () => shareActivity(a));
  } else if (eff === 'organizer') {
    note = isMain(a) ? '进入后可审核、分车与推进阶段' : '协作演示仅主活动';
    label = isMain(a) ? '进入协作工作台' : '打开主活动协作';
    onPrimary = () => ctx.ui.go('collab', { activityId: isMain(a) ? a.id : 'qcs', stage: 'published', role: 'organizer' });
    aside = isMain(a) ? btn('参与者视角', { variant: 'ghost', onClick: () => { ctx.ui.setState({ signup: 'new' }, { preserveScroll: true }); toast('已切换到参与者视角（演示）'); } }) : null;
  } else if (eff === 'closed') {
    note = `报名已于 ${deadline(a)} 截止`;
    label = '看看其他活动';
    onPrimary = () => ctx.ui.go('discover');
    aside = iconBtn('share', '分享活动', () => shareActivity(a));
  } else if (eff === 'cancelled' || eff === 'archived') {
    note = eff === 'cancelled' ? '活动已取消 · 页面只读' : '活动已归档 · 页面只读';
    label = '看看其他活动';
    onPrimary = () => ctx.ui.go('discover');
    aside = iconBtn('share', '分享活动', () => shareActivity(a));
  } else {
    note = '';
    label = '返回发现';
    onPrimary = () => ctx.ui.go('discover');
  }

  return el('div.actionbar',
    el('div.actionbar__note',
      el('span', { text: note }),
      el('span', { text: eff === 'organizer' ? '组织者' : eff === 'confirmed' ? '已确认' : ['closed', 'cancelled', 'archived', 'withdrawn'].includes(eff) ? '只读' : (a.approvalMode === 'automatic' ? '自动通过' : '领队审核') })),
    el('div.actionbar__row',
      aside,
      btn(label, { variant: 'primary', onClick: onPrimary, cls: 'actionbar__main' })));
}

function sessionView(ctx, a) {
  const v = ctx.store?.viewerSignup;
  if (!isMain(a) || !v) return null;
  const sc = scenario('published', ctx.store);
  const eff = v.audit === 'pending' ? 'pending'
    : v.audit === 'confirmed' ? 'confirmed'
    : v.audit === 'waitlisted' ? 'waitlist'
    : v.audit === 'rejected' ? 'rejected'
    : v.audit === 'cancelled' ? 'withdrawn' : 'new';
  const vehicle = v.vehicleId ? (v.vehicleId === 'v1' ? '1 号中巴' : '2 号车') : null;
  const queue = sc.roster.filter((m) => m.audit === 'waitlisted');
  return {
    eff,
    c: { confirmed: sc.confirmed, pending: sc.pending, waitlisted: sc.waitlisted, remaining: sc.remaining },
    viewer: {
      name: v.name,
      role: '成员',
      pickup: v.pickup,
      vehicle,
      seat: v.seatNo,
      submitted: v.submittedAt || '刚刚',
      position: Math.max(1, queue.findIndex((m) => m.id === 'viewer') + 1)
    }
  };
}

/* ---------------- render ---------------- */
export function render(ctx) {
  const { D, state, ui } = ctx;
  const a = findActivity(D, state.activityId);
  const session = sessionView(ctx, a);
  const eff = session ? session.eff : effectiveState(a, state.signup);
  const c = session ? session.c : countsFor(a, eff);
  const viewer = session ? session.viewer : viewerFor(eff);

  const page = el('div.page.det-page', { data: { activity: a.id, state: eff } });

  const appbar = appBar({
    back: () => ui.back(),
    subtitle: isMain(a) ? '活动详情' : '活动索引',
    title: a.title,
    actions: [
      iconBtn('share', '分享活动', () => shareActivity(a)),
      iconBtn('more', '更多', () => openMore(ctx, a, eff, viewer))
    ]
  });
  page.appendChild(appbar);

  if (state.data === 'loading') {
    page.appendChild(loadingDetail());
    return page;
  }
  if (state.data === 'error') {
    page.appendChild(el('div.empty',
      el('span.empty__icon', icon('alert', { size: 26 })),
      el('h2.empty__title', { text: '活动加载失败' }),
      el('p.empty__body', { text: '网络或服务暂时不可用。详情与报名入口一并收起，不展示过期数据。' }),
      btn('重新加载', { variant: 'secondary', onClick: () => ui.toast('演示：重新加载只还原本地演示数据') })));
    return page;
  }
  if (state.data === 'empty') {
    page.appendChild(el('div.empty',
      el('span.empty__icon', icon('calendar', { size: 26 })),
      el('h2.empty__title', { text: '活动不可见' }),
      el('p.empty__body', { text: '该活动可能已下架或从演示列表中移除；详情与报名入口不再展示。' }),
      btn('返回发现', { variant: 'secondary', onClick: () => ui.go('discover') })));
    return page;
  }

  page.appendChild(heroSection(a, c, eff, viewer));
  page.appendChild(briefSection(a));
  page.appendChild(routeSection(a, ctx, viewer, eff));
  page.appendChild(itinerarySection(a));
  page.appendChild(prepSection(a));
  page.appendChild(leaderSection(a, viewer, eff));
  page.appendChild(feeSection(a));
  page.appendChild(el('div.provenance',
    icon('info', { size: 13 }),
    el('span', {
      text: isMain(a)
        ? '演示数据：活动/名单来自真实产品口径；照片来自 Unsplash / AI 生成氛围图；天气为模拟预报，非真实气象服务。'
        : '演示数据：活动索引信息；照片来自 Unsplash / AI 生成氛围图；路线与协作详情仅主活动提供完整演示。'
    })));
  page.appendChild(actionBar(ctx, a, eff, c, viewer));

  page.addEventListener('scroll', () => {
    const top = appbar.getBoundingClientRect().top - page.getBoundingClientRect().top;
    appbar.classList.toggle('is-scrolled', page.scrollTop > 6);
  }, { passive: true });

  return page;
}

function loadingDetail() {
  return el('div',
    el('div.photo.det-hero__sk.bleed'),
    el('div.lines', { style: { padding: '18px 0' } },
      el('span.lines__line', { style: { width: '34%' } }),
      el('span.lines__line', { style: { width: '82%', height: '20px' } }),
      el('span.lines__line', { style: { width: '58%' } })),
    el('div.det-loading__grid',
      Array.from({ length: 4 }, () => el('div', el('span.lines__line', { style: { width: '60%' } }), el('span.lines__line', { style: { width: '80%', marginTop: '7px' } })))),
    el('div.loading-block', { text: '正在加载活动信息…' }));
}
