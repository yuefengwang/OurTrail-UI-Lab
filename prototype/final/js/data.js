// OurTrail Final Pass — 单一演示数据源
// 真实产品口径：青城后山 · 飞泉沟轻徒步（12.8 km / 680 m / 容量 24 / ¥168）
// 日期平移到 2026-10-24 以形成“可报名、即将出发”的完整场景。
// 天气为确定性模拟预报，页面常驻标注“非真实气象服务”。

export const NOW = new Date('2026-10-23T20:30:00+08:00');
export const NOW_TEXT = '10/23 周五 20:30';

const TZ = '+08:00';
const at = (iso) => new Date(iso);
const pad = (n) => String(n).padStart(2, '0');
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const fmt = (n) => Number(n).toLocaleString('zh-CN');
export const hhmm = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const md = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};
export const dateTime = (value) => `${md(value)} ${WEEK[(value instanceof Date ? value : new Date(value)).getDay()]} ${hhmm(value)}`;
export const dayLabel = (value) => `${md(value)} ${WEEK[(value instanceof Date ? value : new Date(value)).getDay()]}`;
export const daysBetween = (a, b) => Math.round((at(b) - at(a)) / 864e5);
export const hoursBetween = (a, b) => Math.round((at(b) - at(a)) / 36e5);

/* ---------------- 发现页索引 ---------------- */
const OTHER_ACTIVITIES = [
  {
    id: 'zgs', title: '赵公山 · 东线穿越', routeName: '九龙沟上 · 环线下',
    statusKey: 'open', dateISO: '2026-10-25', startAt: `2026-10-25T06:30:00${TZ}`, endAt: `2026-10-25T18:00:00${TZ}`,
    deadlineAt: `2026-10-24T20:00:00${TZ}`, city: '都江堰', distanceKm: 18.6, ascentM: 1180,
    difficulty: '进阶', capacity: 24, confirmed: 17, pending: 0, waitlisted: 0, fee: '¥60 / 人',
    leader: '林溪', cover: 'cover-ridge.jpg', focus: '50% 42%',
    meeting: '茶店子客运站 · 地铁 A 口', meetingTime: '06:30',
    lede: '夜爬成都最近的 2400 米级山峰，山顶看日出，下撤后早餐收队。'
  },
  {
    id: 'bls', title: '巴郎山 · 草甸徒步', routeName: '熊猫王国之巅 · 下撤草甸线',
    statusKey: 'open', dateISO: '2026-10-31', startAt: `2026-10-31T06:30:00${TZ}`, endAt: `2026-10-31T19:30:00${TZ}`,
    deadlineAt: `2026-10-30T18:00:00${TZ}`, city: '小金县', distanceKm: 9.8, ascentM: 520,
    difficulty: '入门', capacity: 20, confirmed: 5, pending: 0, waitlisted: 0, fee: '¥110 / 人',
    leader: '阿川', cover: 'cover-dawn.jpg', focus: '50% 45%',
    meeting: '太平园地铁站 · E 口', meetingTime: '06:30',
    lede: '海拔 3800 米的高山草甸，一天看遍雪山与秋牧。'
  },
  {
    id: 'sgs', title: '四姑娘山 · 大峰攀登（2 日）', routeName: '海子沟 · 大峰大本营',
    statusKey: 'hot', dateISO: '2026-11-01', startAt: `2026-11-01T20:00:00${TZ}`, endAt: `2026-11-02T18:00:00${TZ}`,
    deadlineAt: `2026-10-26T20:00:00${TZ}`, city: '小金县', distanceKm: 32, ascentM: 2100,
    difficulty: '挑战', capacity: 12, confirmed: 9, pending: 0, waitlisted: 0, fee: '待说明',
    leader: '阿川', cover: 'cover-snow.jpg', focus: '50% 40%',
    meeting: '火车南站 · 西广场', meetingTime: '20:00',
    lede: '人生第一座 5000 米级雪山，大本营住一晚，凌晨冲顶。'
  },
  {
    id: 'lqs', title: '龙泉山 · 夜途拉练', routeName: '仰天窝 · 丹景台环线',
    statusKey: 'formed', dateISO: '2026-11-08', startAt: `2026-11-08T19:00:00${TZ}`, endAt: `2026-11-09T00:30:00${TZ}`,
    deadlineAt: `2026-11-07T20:00:00${TZ}`, city: '成都', distanceKm: 22, ascentM: 420,
    difficulty: '进阶', capacity: 30, confirmed: 30, pending: 0, waitlisted: 0, fee: '无包车费',
    leader: '郑南', cover: 'cover-coast.jpg', focus: '50% 50%',
    meeting: '牛市口地铁站 · B 口', meetingTime: '19:00',
    lede: '城市绿心夜徒，为长线活动做体能储备。'
  },
  {
    id: 'ems', title: '峨眉山 · 万佛顶穿线', routeName: '报国寺 · 清音阁 · 雷洞坪',
    statusKey: 'formed', dateISO: '2026-11-15', startAt: `2026-11-15T05:30:00${TZ}`, endAt: `2026-11-15T20:00:00${TZ}`,
    deadlineAt: `2026-11-13T20:00:00${TZ}`, city: '峨眉山', distanceKm: 26, ascentM: 1560,
    difficulty: '挑战', capacity: 20, confirmed: 20, pending: 0, waitlisted: 0, fee: '¥90 / 人',
    leader: '郑南', cover: 'cover-gorge.jpg', focus: '50% 45%',
    meeting: '犀浦地铁站 · A1 口', meetingTime: '05:30',
    lede: '从山脚一路爬到金顶区的完整穿线，刷爆体力的经典。'
  },
  {
    id: 'nbs', title: '牛背山 · 云海日出', routeName: '冷碛镇 · 山顶营地线',
    statusKey: 'open', dateISO: '2026-11-22', startAt: `2026-11-22T21:00:00${TZ}`, endAt: `2026-11-23T16:00:00${TZ}`,
    deadlineAt: `2026-11-20T20:00:00${TZ}`, city: '泸定县', distanceKm: 8.6, ascentM: 520,
    difficulty: '入门', capacity: 40, confirmed: 22, pending: 0, waitlisted: 0, fee: '¥260 / 人',
    leader: '陈暮', cover: 'cover-fjord.jpg', focus: '50% 45%',
    meeting: '太平园地铁站 · E 口', meetingTime: '21:00',
    lede: '亚洲最大观景平台，赌一场云海日出。'
  },
  {
    id: 'tws', title: '铁瓦殿 · 夜爬小分队', routeName: '园觉寺 · 铁瓦殿折返',
    statusKey: 'ended', dateISO: '2026-10-11', startAt: `2026-10-11T21:30:00${TZ}`, endAt: `2026-10-12T09:00:00${TZ}`,
    deadlineAt: `2026-10-10T20:00:00${TZ}`, city: '蒲江', distanceKm: 11, ascentM: 900,
    difficulty: '进阶', capacity: 16, confirmed: 16, pending: 0, waitlisted: 0, fee: '¥45 / 人',
    leader: '林溪', cover: 'sky-storm.jpg', focus: '50% 50%',
    meeting: '太平园地铁站 · E 口', meetingTime: '21:30',
    lede: '小而野的夜爬线，山谷夜景很好。'
  },
  {
    id: 'xyd', title: '小鱼洞 · 溯溪轻徒步', routeName: '中坝村 · 白鹿镇',
    statusKey: 'cancelled', dateISO: '2026-10-12', startAt: `2026-10-12T08:30:00${TZ}`, endAt: `2026-10-12T17:30:00${TZ}`,
    deadlineAt: `2026-10-11T20:00:00${TZ}`, city: '彭州', distanceKm: 6.2, ascentM: 280,
    difficulty: '入门', capacity: 15, confirmed: 9, pending: 0, waitlisted: 0, fee: '无费用',
    leader: '王屿', cover: 'cover-falls.jpg', focus: '50% 55%',
    meeting: '彭州客运中心', meetingTime: '08:30',
    lede: '因上游降雨水量过大，活动取消，已报名成员将收到通知。'
  }
];

/* ---------------- 主活动（真实产品口径 + 演示平移） ---------------- */
export const FEATURED = {
  id: 'qcs',
  title: '青城后山 · 飞泉沟轻徒步',
  routeName: '泰安古镇 · 飞泉沟 · 白云索道下站',
  statusKey: 'hot',
  approvalMode: 'manual',
  dateISO: '2026-10-24',
  startAt: `2026-10-24T08:30:00${TZ}`,
  endAt: `2026-10-24T18:00:00${TZ}`,
  deadlineAt: `2026-10-23T21:00:00${TZ}`,
  city: '都江堰',
  distanceKm: 12.8,
  ascentM: 680,
  difficulty: '入门',
  suitableFor: '能连续行走 4–5 小时、第一次参加集体徒步的人；膝伤未愈者不建议。',
  capacity: 24,
  confirmed: 18,
  pending: 3,
  waitlisted: 0,
  fee: '¥168 / 人',
  feeNote: '含往返包车与保险分摊，景区门票自理；活动结束后群内结算。OurTrail 不收款、不退款。',
  cancellationNote: '10 月 23 日 21:00 前可免费退出；之后退出需与领队协商分摊已发生的包车费用。',
  leader: '陈屿',
  staff: '许安',
  cover: 'cover-qingcheng.jpg',
  focus: '50% 45%',
  lede: '沿飞泉沟上行，过泰安古镇后进入林下石阶，终点白云索道下站。雨后石阶湿滑，但秋色和水声是这条线最好的部分。',
  organizerIntro: '走过 12 次青城后山，习惯把节奏放慢一点。这条线不追速度，留时间给溪谷和午餐。',
  meetingPoints: [
    { id: 'p1', name: '茶店子客运站', detail: '地铁 A 口外指定集合点', time: '07:00', role: '主集合点' },
    { id: 'p2', name: '犀浦地铁站', detail: 'A1 口', time: '07:20', role: '第二上车点' }
  ],
  routePoints: [
    { id: 'r1', name: '泰安古镇', kind: 'start', ele: 780, km: 0, eta: '08:30', coord: { lat: 30.9343, lng: 103.4852 }, note: '起点 · 补水与热身' },
    { id: 'r2', name: '飞泉沟', kind: 'checkpoint', ele: 1060, km: 5.6, eta: '10:40', coord: { lat: 30.9508, lng: 103.4712 }, note: '途中 · 石阶与溪谷' },
    { id: 'r3', name: '白云索道下站', kind: 'finish', ele: 1240, km: 12.8, eta: '12:40', coord: { lat: 30.9402, lng: 103.4786 }, note: '终点 · 午餐与下撤' }
  ],
  risks: [
    { title: '雨后石阶湿滑', severity: 'mid', advice: '穿防滑鞋，雨天放慢下坡；沟谷水大时不涉水。' },
    { title: '山脊风大', severity: 'mid', advice: '白云索道段无遮挡，带防风层；雷雨时不在山脊停留。' }
  ],
  requirements: [
    '防滑徒步鞋（雨后石阶必需）',
    '登山杖（下坡护膝）',
    '雨衣与防水袋',
    '饮用水 ≥ 1.5L',
    '午餐与路餐',
    '个人常用药品'
  ],
  itinerary: [
    ['06:40', '茶店子集合，核对名单与装备'],
    ['07:00', '发车前往泰安古镇'],
    ['08:30', '到达起点，热身，讲解路线与风险'],
    ['10:40', '飞泉沟休整，补水'],
    ['12:40', '白云索道下站午餐，视天气决定下撤'],
    ['15:00', '沿原路下撤，清点人数'],
    ['16:30', '返程发车'],
    ['18:00', '到达茶店子，活动结束']
  ],
  weather: {
    summary: '活动日午后有阵雨，山脊风大；建议 12:30 前通过白云索道段。',
    confidence: '中等',
    range: ['2026-10-23T20:00:00+08:00', '2026-10-25T20:00:00+08:00'],
    generatedAt: '2026-10-23T18:40:00+08:00',
    source: '模拟预报 · 非真实气象服务',
    limitation: '预报由演示数据生成，只用于验证界面。真实出行请以当地气象与领队判断为准；预报不是出发许可。'
  }
};

export const ACTIVITIES = [FEATURED, ...OTHER_ACTIVITIES].sort((a, b) => at(a.startAt) - at(b.startAt));

export const isPast = (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled';
export const remaining = (a) => Math.max(0, a.capacity - a.confirmed - a.pending);
export const isOpen = (a) => a.statusKey === 'open' || a.statusKey === 'hot';
export const departureIn = (a) => {
  const diff = at(a.startAt) - NOW;
  const h = Math.round(diff / 36e5);
  if (h < 0) return '已出发';
  if (h < 1) return '即将出发';
  if (h < 24) return `${h} 小时后`;
  return `${Math.round(h / 24)} 天后`;
};

/* 状态词：词 + 形状；tone 仅辅助 */
export const STATUS = {
  open: { word: '可报名', tone: 'go', shape: 'dot' },
  hot: { word: '名额紧张', tone: 'clay', shape: 'dot' },
  formed: { word: '已成行', tone: 'calm', shape: 'check' },
  ended: { word: '已结束', tone: 'mute', shape: 'minus' },
  cancelled: { word: '已取消', tone: 'danger', shape: 'x' }
};

export function statusOf(a) {
  if (a.statusKey === 'cancelled') return STATUS.cancelled;
  if (a.statusKey === 'ended') return STATUS.ended;
  if (a.statusKey === 'formed') return STATUS.formed;
  if (a.statusKey === 'hot') return STATUS.hot;
  return STATUS.open;
}

/* ---------------- 主活动 roster（18 confirmed + 3 pending） ---------------- */
const M = (id, name, role, audit, trip, pickup, vehicleId, seatNo, extra = {}) => ({
  id, name, role, audit, trip, pickup, vehicleId, seatNo, ...extra
});

export const ROSTER = [
  M('m01', '陈屿', '领队', 'confirmed', 'shared', 'p1', 'v1', '01', { isLeader: true }),
  M('m02', '许安', '协作', 'confirmed', 'shared', 'p1', 'v1', '02', { isStaff: true }),
  M('m03', '许川', '车长', 'confirmed', 'shared', 'p1', 'v1', 'driver', { isDriver: true }),
  M('m04', '周野', '车长', 'confirmed', 'shared', 'p2', 'v2', 'driver', { isDriver: true }),
  M('m05', '林溪', '成员', 'confirmed', 'shared', 'p1', 'v1', '03'),
  M('m06', '苏喧', '成员', 'confirmed', 'shared', 'p1', 'v1', '04'),
  M('m07', '何隅', '成员', 'confirmed', 'shared', 'p1', 'v1', '05'),
  M('m08', '郑南', '成员', 'confirmed', 'shared', 'p1', 'v1', '06'),
  M('m09', '黄栗', '成员', 'confirmed', 'shared', 'p1', 'v1', '07'),
  M('m10', '秦朗', '成员', 'confirmed', 'shared', 'p1', 'v1', '08'),
  M('m11', '石青', '成员', 'confirmed', 'shared', 'p1', 'v1', '09'),
  M('m12', '唐夏', '成员', 'confirmed', 'shared', 'p1', 'v1', '10'),
  M('m13', '魏莱', '成员', 'confirmed', 'shared', 'p2', 'v2', '01'),
  M('m14', '谢原', '成员', 'confirmed', 'shared', 'p2', 'v2', '02'),
  M('m15', '罗壹', '成员', 'confirmed', 'shared', 'p2', 'v2', '03'),
  M('m16', '高眠', '成员', 'confirmed', 'shared', 'p1', null, null),
  M('m17', '顾知', '成员', 'confirmed', 'self', 'p1', null, null),
  M('m18', '江迟', '成员', 'confirmed', 'self', 'p2', null, null),
  M('m19', '宋禾', '成员', 'pending', 'shared', 'p1', null, null, { requestedAt: '19:42' }),
  M('m20', '白露', '成员', 'pending', 'shared', 'p2', null, null, { requestedAt: '20:06' }),
  M('m21', '程野', '成员', 'pending', 'self', 'p1', null, null, { requestedAt: '20:21' })
];

export const VEHICLES = [
  {
    id: 'v1', label: '1 号中巴', plate: '川A·演示01', driver: '许川', driverId: 'm03',
    passengerSeats: 18, seats: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
    pickup: ['p1', 'p2']
  },
  {
    id: 'v2', label: '2 号车', plate: '川A·演示02', driver: '周野', driverId: 'm04',
    passengerSeats: 6, seats: ['01', '02', '03'],
    pickup: ['p1', 'p2']
  }
];

export const ROUTE = FEATURED.routePoints;

/* ---------------- 阶段场景 ---------------- */
const CHECKED_IN_GATHERING = new Set(['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm12', 'm13', 'm14', 'm19', 'm20', 'm21']);
const CHECKED_IN_ACTIVE = new Set(ROSTER.map((m) => m.id));
const HOME_DONE = new Set(['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13']);

const STAGE_META = {
  published: {
    key: 'published', label: '行前准备', step: 2,
    anchor: '今晚 21:00 报名截止',
    tone: 'prepare'
  },
  gathering: {
    key: 'gathering', label: '正在集合', step: 3,
    anchor: '明早 07:00 茶店子集合',
    tone: 'gather'
  },
  active: {
    key: 'active', label: '正在同行', step: 4,
    anchor: '预计 12:40 抵达白云索道下站',
    tone: 'active'
  },
  closing: {
    key: 'closing', label: '返程报平安', step: 5,
    anchor: '预计 18:00 回到茶店子',
    tone: 'closing'
  },
  archived: {
    key: 'archived', label: '已归档', step: 6,
    anchor: '活动已归档，只读',
    tone: 'archived'
  }
};

export function scenario(stageKey = 'published', store = {}) {
  const stage = STAGE_META[stageKey] || STAGE_META.published;
  const approvedIds = store.approved || new Set();
  const assigned = store.assigned || new Map();
  const checkedNow = store.checked || new Set();
  const boardedNow = store.boarded || new Set();
  const homeNow = store.home || new Set();
  const rejectedNow = store.rejected || new Set();
  const viewer = store.viewerSignup || null;
  const baseRoster = viewer && viewer.audit !== 'cancelled'
    ? [...ROSTER, { ...viewer, id: 'viewer', role: '成员' }]
    : ROSTER;
  const roster = baseRoster.map((m) => {
    const wasPending = m.audit === 'pending';
    const autoApproved = stageKey !== 'published' && wasPending;
    const audit = rejectedNow.has(m.id) ? 'rejected' : (approvedIds.has(m.id) || autoApproved) ? 'confirmed' : m.audit;
    const confirmed = audit === 'confirmed';
    const assign = assigned.get(m.id);
    const vehicleId = assign ? assign.vehicleId : m.vehicleId;
    const seatNo = assign ? assign.seatNo : m.seatNo;
    const checked = checkedNow.has(m.id) || (stageKey === 'gathering' ? CHECKED_IN_GATHERING.has(m.id)
      : stageKey === 'active' || stageKey === 'closing' || stageKey === 'archived');
    const departed = stageKey === 'active' || stageKey === 'closing' || stageKey === 'archived'
      ? (m.id === 'm15' && !store.incidentResolved ? 'coordinating' : 'joined')
      : null;
    const boarded = stageKey === 'active' || stageKey === 'closing' || stageKey === 'archived'
      ? (m.trip === 'shared' && vehicleId ? true : null)
      : (m.trip === 'shared' && vehicleId ? boardedNow.has(m.id) : null);
    const node = stageKey === 'active' || stageKey === 'closing' || stageKey === 'archived'
      ? (m.id === 'm15' ? 'r1' : 'r2')
      : null;
    const home = stageKey === 'closing'
      ? (HOME_DONE.has(m.id) || homeNow.has(m.id))
      : stageKey === 'archived' ? true : false;
    return {
      ...m,
      audit,
      vehicleId,
      seatNo,
      checked: confirmed && checked,
      departed,
      boarded,
      node,
      home
    };
  });
  const confirmed = roster.filter((m) => m.audit === 'confirmed').length;
  const pending = roster.filter((m) => m.audit === 'pending').length;
  const incidentOpen = (stageKey === 'active' || stageKey === 'closing') && !store.incidentResolved;
  return {
    stage,
    roster,
    confirmed,
    pending,
    waitlisted: roster.filter((m) => m.audit === 'waitlisted').length,
    remaining: Math.max(0, FEATURED.capacity - confirmed - pending),
    unchecked: stageKey === 'published' ? 0 : roster.filter((m) => m.audit === 'confirmed' && !m.checked).length,
    checked: roster.filter((m) => m.audit === 'confirmed' && m.checked).length,
    unassigned: roster.filter((m) => m.audit === 'confirmed' && m.trip === 'shared' && !m.vehicleId).length,
    selfArrive: roster.filter((m) => m.audit === 'confirmed' && m.trip === 'self').length,
    homePending: stageKey === 'closing' ? roster.filter((m) => m.audit === 'confirmed' && !m.home).length : 0,
    incident: incidentOpen
      ? { id: 'i1', name: '罗壹', kind: 'late', text: '迟到 8 分钟，已协调从犀浦上车', status: 'open' }
      : null
  };
}

/* ---------------- 协作任务（派生，不写死） ---------------- */
export function tasksFor(sc, role = 'organizer') {
  const t = [];
  const pending = sc.roster.filter((m) => m.audit === 'pending');
  const unassigned = sc.roster.filter((m) => m.audit === 'confirmed' && m.trip === 'shared' && !m.vehicleId);
  const unchecked = sc.roster.filter((m) => m.audit === 'confirmed' && !m.checked);
  const homePending = sc.stage.key === 'closing' ? sc.roster.filter((m) => m.audit === 'confirmed' && !m.home) : [];
  const incident = sc.incident;

  if (role === 'driver') {
    const car = VEHICLES[0];
    if (sc.stage.key === 'published') {
      return [{
        id: 'vehicle', title: `准备 ${car.label} 本车乘客`,
        meta: '集合阶段开放上车；现在只能查看本车',
        count: 0, tone: 'prepare', action: '查看本车'
      }];
    }
    if (sc.stage.key !== 'gathering') {
      return [{
        id: 'vehicle', title: `${car.label} 本程已完成`,
        meta: '返程与到家由组织者/参与者确认',
        count: 0, tone: 'prepare', action: '查看本车'
      }];
    }
    const passengers = sc.roster.filter((m) => m.vehicleId === car.id && m.seatNo !== 'driver');
    const boarded = passengers.filter((m) => m.boarded).length;
    return [{
      id: 'vehicle', title: `确认 ${car.label} 上车`,
      meta: `${boarded} / ${passengers.length} 已上车 · 未签到不能上车`,
      count: Math.max(0, passengers.length - boarded), tone: 'clay', action: '打开车辆任务'
    }];
  }
  if (role === 'staff') {
    if (sc.stage.key === 'gathering' && unchecked.length) t.push({
      id: 'checkin', title: '未签到人员', meta: `${unchecked.length} 人未到集合点 · 你负责签到`, count: unchecked.length, tone: 'clay', action: '去签到'
    });
    if (incident) t.push({
      id: 'incident', title: '待处理异常', meta: `${incident.name} · ${incident.text}`, count: 1, tone: 'danger', action: '去处理'
    });
    return t;
  }

  if (sc.stage.key === 'published') {
    if (pending.length) t.push({ id: 'audit', title: '审核报名', meta: '未审核不能进入集合阶段', count: pending.length, tone: 'clay', action: '去审核' });
    if (unassigned.length) t.push({ id: 'assign', title: '安排车辆', meta: '已确认但还没有座位', count: unassigned.length, tone: 'watch', action: '去分车' });
    t.push({ id: 'deadline', title: '报名今晚截止', meta: '21:00 后不再接受新报名', count: 0, tone: 'prepare', action: '查看名单' });
  } else if (sc.stage.key === 'gathering') {
    if (unchecked.length) t.push({ id: 'checkin', title: '未签到人员', meta: '出发前必须逐人确认', count: unchecked.length, tone: 'clay', action: '去签到' });
    if (unassigned.length) t.push({ id: 'assign', title: '未安排车辆', meta: '拼车成员还没有座位', count: unassigned.length, tone: 'watch', action: '去分车' });
    if (incident) t.push({ id: 'incident', title: '待处理异常', meta: `${incident.name} · ${incident.text}`, count: 1, tone: 'danger', action: '去处理' });
  } else if (sc.stage.key === 'active') {
    if (incident) t.push({ id: 'incident', title: '协调中的异常', meta: `${incident.name} · ${incident.text}`, count: 1, tone: 'danger', action: '去处理' });
    t.push({ id: 'node', title: '确认下一节点', meta: '白云索道下站 · 预计 12:40', count: 1, tone: 'prepare', action: '去确认' });
  } else if (sc.stage.key === 'closing') {
    if (homePending.length) t.push({ id: 'home', title: '待到家人数', meta: '逐人确认到家，不能批量代签', count: homePending.length, tone: 'clay', action: '去确认' });
    if (incident) t.push({ id: 'incident', title: '未解决异常', meta: '异常未解决不能归档', count: 1, tone: 'danger', action: '去处理' });
  } else if (sc.stage.key === 'archived') {
    t.push({ id: 'readonly', title: '活动已归档', meta: '名单、车辆与现场记录只读', count: 0, tone: 'prepare', action: '查看记录' });
  }
  return t;
}

/* ---------------- 天气：确定性模拟 ---------------- */
const WEATHER_START = at('2026-10-23T20:00:00+08:00');
const WEATHER_HOURS = 48;

function simulatedHour(i) {
  const t = new Date(WEATHER_START.getTime() + i * 36e5);
  const day = t.getDate();
  const h = t.getHours();
  const isActivityDay = day === 24;
  const isNextDay = day === 25;
  const activityMorning = isActivityDay && h >= 6 && h < 10;
  const activityNoon = isActivityDay && h >= 12 && h < 17;
  const activityEvening = isActivityDay && h >= 17 && h < 19;

  const diurnal = Math.sin(((h - 9) / 24) * Math.PI * 2);
  let temp = 12.4 + diurnal * 3.1;
  let precipProb = 22 + Math.max(0, Math.sin(i / 5.5)) * 18;
  let precipMm = 0.1 + Math.max(0, Math.sin(i / 7)) * 0.2;
  let wind = 2.2 + Math.max(0, Math.sin(i / 6)) * 1.4;
  let gust = wind + 1.2;
  let cloud = 55 + Math.max(0, Math.sin((i + 3) / 5)) * 30;
  let cloudBase = 1250 + Math.max(0, Math.sin(i / 8)) * 250;
  let humidity = 72 + Math.max(0, Math.sin(i / 9)) * 16;
  let code = 'cloud';

  if (isActivityDay && h < 6) {
    cloudBase = 980 + Math.max(0, Math.sin(i / 4)) * 80;
    precipProb = 28 + Math.max(0, Math.sin(i / 4)) * 10;
    code = 'drizzle';
  }
  if (activityMorning) {
    precipProb = 36 + (h - 6) * 5;
    precipMm = 0.2 + (h - 6) * 0.12;
    cloudBase = 880 + (h - 6) * 18;
    cloud = 72 + (h - 6) * 3;
    humidity = 88;
    code = 'drizzle';
  }
  if (activityNoon) {
    const p = (h - 12) / 4;
    precipProb = 58 + p * 24;
    precipMm = 1.1 + p * 1.5;
    wind = 5.2 + p * 1.4;
    gust = wind + 2.4;
    cloudBase = 820 - p * 70;
    cloud = 88;
    humidity = 94;
    code = 'rain';
  }
  if (activityEvening) {
    precipProb = 34 - (h - 17) * 12;
    precipMm = 0.5 - (h - 17) * 0.18;
    wind = 3.8 - (h - 17) * 0.5;
    gust = wind + 1.5;
    cloudBase = 1350 + (h - 17) * 180;
    cloud = 64 - (h - 17) * 8;
    code = 'cloud';
  }
  if (isNextDay) {
    precipProb = Math.max(4, 18 - (i - 24) * 0.6);
    precipMm = Math.max(0, 0.15 - (i - 24) * 0.01);
    wind = 2.4 - Math.min(0.8, (i - 24) * 0.04);
    gust = wind + 1.1;
    cloudBase = 1900 + Math.min(700, (i - 24) * 50);
    cloud = Math.max(18, 52 - (i - 24) * 2.2);
    humidity = Math.max(58, 82 - (i - 24) * 1.5);
    code = 'clear';
  }

  return {
    at: t,
    hour: h,
    temp: Math.round(temp * 10) / 10,
    precipProb: Math.round(precipProb),
    precipMm: Math.round(precipMm * 10) / 10,
    wind: Math.round(wind * 10) / 10,
    gust: Math.round(gust * 10) / 10,
    cloud: Math.round(Math.min(100, cloud)),
    cloudBase: Math.round(cloudBase),
    humidity: Math.round(humidity),
    code
  };
}

export const WEATHER_HOURS_DATA = Array.from({ length: WEATHER_HOURS }, (_, i) => simulatedHour(i));

export const WEATHER_WINDOWS = [
  {
    id: 'lowcloud',
    label: '低云 · 石阶湿滑',
    tone: 'watch',
    start: '2026-10-24T06:00:00+08:00',
    end: '2026-10-24T09:59:00+08:00',
    pointId: 'r2',
    effect: '云底低于飞泉沟，林下能见度下降；石阶湿滑，建议降低速度、使用登山杖。'
  },
  {
    id: 'shower',
    label: '阵雨 · 风增大',
    tone: 'risk',
    start: '2026-10-24T12:00:00+08:00',
    end: '2026-10-24T16:59:00+08:00',
    pointId: 'r3',
    effect: '降水概率 58–82%，山脊阵风约 8–9 m/s；白云索道段无遮挡，建议 12:30 前通过。'
  },
  {
    id: 'clearing',
    label: '雨势减弱',
    tone: 'good',
    start: '2026-10-24T17:00:00+08:00',
    end: '2026-10-24T18:59:00+08:00',
    pointId: 'r3',
    effect: '降水回落到 30% 以下，风速下降；适合下撤与返程，但石阶仍然湿滑。'
  }
];

export function weatherAt(point, hour) {
  const lapse = (point.ele - 780) * 0.006;
  const temp = Math.round((hour.temp - lapse) * 10) / 10;
  const inCloud = hour.cloudBase <= point.ele;
  const visibility = inCloud ? Math.max(0.6, 2.4 - (point.ele - hour.cloudBase) / 300) : Math.min(18, 8 + (hour.cloudBase - point.ele) / 250);
  return {
    temp,
    precipProb: hour.precipProb,
    precipMm: hour.precipMm,
    wind: hour.wind,
    gust: hour.gust,
    cloud: hour.cloud,
    cloudBase: hour.cloudBase,
    humidity: hour.humidity,
    visibility: Math.round(visibility * 10) / 10,
    inCloud,
    code: hour.code
  };
}

export function hoursForPoint(point) {
  return WEATHER_HOURS_DATA.map((h) => ({ ...h, ...weatherAt(point, h) }));
}

export const DEMO = {
  now: NOW,
  featured: FEATURED,
  activities: ACTIVITIES,
  roster: ROSTER,
  vehicles: VEHICLES,
  route: ROUTE,
  stages: STAGE_META,
  weatherHours: WEATHER_HOURS_DATA,
  weatherWindows: WEATHER_WINDOWS,
  credit: '演示数据 · 照片：Unsplash / AI 生成氛围图（非活动实拍）',
  note: 'UI Lab Final Pass · 非真实后端 · 天气为模拟预报'
};
