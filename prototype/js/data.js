// OurTrail Visual Direction Lab — 演示数据集 (共享，七风格只读)
// 语义对齐真实产品: Activity / Signup(报名) / Member(成员) / Vehicle(分车) / 天气
// 所有数据为**固定演示数据**，非真实后端；实验室外壳需注明。
// 参考真实术语: 集合、签到、待审核、候补、分车、名额、领队、拼车、自驾、待定。

export const VIEWER = {
  name: '林溪',
  role: '领队',
  avatarText: '溪',
  isLeader: true,
};

/* ---------------- 活动列表 (发现页) ---------------- */
export const ACTIVITIES = [
  {
    id: 'a1', title: '赵公山 · 东线穿越', routeName: '九龙沟上 · 环线下',
    status: '报名中', statusKey: 'open', hot: true,
    dateText: '10 月 18 日', weekdayText: '周六', timeText: '22:10 出发',
    city: '都江堰', distanceKm: 18.6, ascentM: 1180, difficulty: '进阶', difficultyText: '进阶',
    seatsTotal: 24, signedCount: 17,
    deadlineText: '10 月 18 日 20:00', meetingPoint: '茶店子客运站 · 地铁 A 口', meetingTime: '22:10',
    leader: '林溪', cover: 'cover-ridge.jpg',
    lede: '夜爬成都最近的 2400 米级山峰，山顶看日出，下撤后早餐收队。',
    feeNote: '包车费用 AA，人均约 ¥60，结束后群内结算；平台不收取任何费用。',
    itinerary: [
      ['22:10', '茶店子地铁 A 口集合出发，车上讲解路线与安全事项'],
      ['23:40', '抵达九龙沟起点，整理装备、集体热身'],
      ['00:10', '开始夜爬，前段缓坡保持节奏'],
      ['03:30', '登顶前最后一段陡坡，注意手拉点，结伴通过'],
      ['04:50', '登顶 2434 米，休整等待日出，注意保暖'],
      ['06:20', '日出结束，拍照后原路下撤'],
      ['09:00', '回到停车点，农家早餐后返程'],
      ['11:30', '抵达成都茶店子，活动结束'],
    ],
    requirements: [
      '头灯或手电（必备，夜爬核心装备）',
      '防滑鞋（下坡碎石路段多）',
      '饮水 1.5L 以上，高热量路餐 2 份',
      '冲锋衣：山顶清晨 4–6℃，注意防风保温',
      '登山杖建议携带（下坡护膝）',
    ],
  },
  {
    id: 'a2', title: '青城后山 · 万佛洞环线', routeName: '泰安古镇 · 五龙沟 · 又一村',
    status: '报名中', statusKey: 'open',
    dateText: '10 月 25 日', weekdayText: '周六', timeText: '08:00 出发',
    city: '都江堰', distanceKm: 12.4, ascentM: 640, difficulty: '入门', difficultyText: '入门',
    seatsTotal: 16, signedCount: 7,
    deadlineText: '10 月 24 日 20:00', meetingPoint: '牛市口地铁站 B 口', meetingTime: '08:00',
    leader: '王屿', cover: 'cover-valley.jpg',
    lede: '溪谷与栈道交错的经典入门线，秋色正当时。',
    feeNote: '包车费用 AA，人均约 ¥50；景区门票需自理。',
  },
  {
    id: 'a3', title: '巴郎山 · 草甸徒步', routeName: '熊猫王国之巅 · 下撤草甸线',
    status: '报名中', statusKey: 'open',
    dateText: '10 月 26 日', weekdayText: '周日', timeText: '06:30 出发',
    city: '小金县', distanceKm: 9.8, ascentM: 520, difficulty: '入门', difficultyText: '入门',
    seatsTotal: 20, signedCount: 5,
    deadlineText: '10 月 25 日 18:00', meetingPoint: '太平园地铁站 E 口', meetingTime: '06:30',
    leader: '阿川', cover: 'cover-dawn.jpg',
    lede: '海拔 3800 米的高山草甸，一天看遍雪山与秋牧。',
    feeNote: '包车费用 AA，人均约 ¥110（往返远）。',
  },
  {
    id: 'a4', title: '四姑娘山 · 大峰攀登（2 日）', routeName: '海子沟 · 大峰大本营',
    status: '名额紧张', statusKey: 'hot',
    dateText: '11 月 1–2 日', weekdayText: '周六日', timeText: '周五 20:00 出发',
    city: '小金县', distanceKm: 32, ascentM: 2100, difficulty: '挑战', difficultyText: '挑战',
    seatsTotal: 12, signedCount: 9,
    deadlineText: '10 月 26 日 20:00', meetingPoint: '火车南站西广场', meetingTime: '20:00',
    leader: '阿川', cover: 'cover-snow.jpg',
    lede: '人生第一座 5000 米级雪山，大本营住一晚，凌晨冲顶。',
    feeNote: '含向导与马匹分摊，费用说明见活动详情；平台不收取费用。',
  },
  {
    id: 'a5', title: '龙泉山 · 夜途拉练', routeName: '仰天窝 · 丹景台环线',
    status: '已成行', statusKey: 'formed',
    dateText: '11 月 8 日', weekdayText: '周六', timeText: '19:00 出发',
    city: '成都', distanceKm: 22, ascentM: 420, difficulty: '进阶', difficultyText: '进阶',
    seatsTotal: 30, signedCount: 30,
    deadlineText: '已截止', meetingPoint: '牛市口地铁站 B 口', meetingTime: '19:00',
    leader: '郑南', cover: 'cover-coast.jpg',
    lede: '城市绿心夜徒，为长线活动做体能储备。',
    feeNote: '自行到达集合点，无包车费用。',
  },
  {
    id: 'a6', title: '峨眉山 · 万佛顶穿线', routeName: '报国寺 · 清音阁 · 雷洞坪',
    status: '已成行', statusKey: 'formed',
    dateText: '11 月 15 日', weekdayText: '周六', timeText: '05:30 出发',
    city: '峨眉山', distanceKm: 26, ascentM: 1560, difficulty: '挑战', difficultyText: '挑战',
    seatsTotal: 20, signedCount: 20,
    deadlineText: '已截止', meetingPoint: '犀浦地铁站 A1 口', meetingTime: '05:30',
    leader: '郑南', cover: 'cover-gorge.jpg',
    lede: '从山脚一路爬到金顶区的完整穿线，刷爆体力的经典。',
    feeNote: '包车费用 AA，人均约 ¥90。',
  },
  {
    id: 'a7', title: '牛背山 · 云海日出', routeName: '冷碛镇 · 山顶营地线',
    status: '报名中', statusKey: 'open',
    dateText: '11 月 22 日', weekdayText: '周六', timeText: '周五 21:00 出发',
    city: '泸定县', distanceKm: 8.6, ascentM: 520, difficulty: '入门', difficultyText: '入门',
    seatsTotal: 40, signedCount: 22,
    deadlineText: '11 月 20 日 20:00', meetingPoint: '太平园地铁站 E 口', meetingTime: '21:00',
    leader: '陈暮', cover: 'cover-fjord.jpg',
    lede: '亚洲最大观景平台，赌一场云海日出。',
    feeNote: '含营地费用分摊，人均约 ¥260；平台不收取费用。',
  },
  {
    id: 'a8', title: '铁瓦殿 · 夜爬小分队', routeName: '园觉寺 · 铁瓦殿折返',
    status: '已结束', statusKey: 'ended',
    dateText: '10 月 11 日', weekdayText: '周六', timeText: '已结束',
    city: '蒲江', distanceKm: 11, ascentM: 900, difficulty: '进阶', difficultyText: '进阶',
    seatsTotal: 16, signedCount: 16,
    deadlineText: '已截止', meetingPoint: '太平园地铁站 E 口', meetingTime: '21:30',
    leader: '林溪', cover: 'sky-storm.jpg',
    lede: '小而野的夜爬线，山谷夜景很好。',
    feeNote: '包车费用 AA，人均约 ¥45。',
  },
  {
    id: 'a9', title: '小鱼洞 · 溯溪轻徒步', routeName: '中坝村 · 白鹿镇',
    status: '已取消', statusKey: 'cancelled',
    dateText: '10 月 12 日', weekdayText: '周日', timeText: '已取消',
    city: '彭州', distanceKm: 6.2, ascentM: 280, difficulty: '入门', difficultyText: '入门',
    seatsTotal: 15, signedCount: 9,
    deadlineText: '已取消', meetingPoint: '彭州客运中心', meetingTime: '08:30',
    leader: '王屿', cover: 'cover-falls.jpg',
    lede: '因上游降雨水量过大，活动取消，已报名成员将收到通知。',
    feeNote: '活动取消，无费用。',
  },
];

export const FEATURED = ACTIVITIES[0]; // 详情页与协作页的主活动

/* ---------------- 成员名单 (a1 活动) ----------------
   audit: 已通过 / 待审核 / 候补
   checked: 是否已到集合点签到
   tripMode: 自驾(司机) / 拼车 / 待定 */
export const ROSTER = [
  { id: 'm01', name: '林溪', role: '领队', tripMode: '拼车', vehicleId: 'v1', seatNo: 1, audit: '已通过', checked: true, checkedAt: '21:48', phoneTail: '0831' },
  { id: 'm02', name: '王屿', role: '车长', tripMode: '自驾', vehicleId: 'v1', seatNo: 'driver', audit: '已通过', checked: true, checkedAt: '21:32', phoneTail: '2210' },
  { id: 'm03', name: '陈暮', role: '车长', tripMode: '自驾', vehicleId: 'v2', seatNo: 'driver', audit: '已通过', checked: true, checkedAt: '21:35', phoneTail: '7789' },
  { id: 'm04', name: '赵拾', role: '车长', tripMode: '自驾', vehicleId: 'v3', seatNo: 'driver', audit: '已通过', checked: true, checkedAt: '21:40', phoneTail: '4532' },
  { id: 'm05', name: '周迟', role: '车长', tripMode: '自驾', vehicleId: 'v4', seatNo: 'driver', audit: '已通过', checked: true, checkedAt: '21:44', phoneTail: '9012' },
  { id: 'm06', name: '苏喧', role: '成员', tripMode: '拼车', vehicleId: 'v1', seatNo: 2, audit: '已通过', checked: true, checkedAt: '21:50', phoneTail: '3345' },
  { id: 'm07', name: '何隅', role: '成员', tripMode: '拼车', vehicleId: 'v1', seatNo: 3, audit: '已通过', checked: true, checkedAt: '21:52', phoneTail: '6678' },
  { id: 'm08', name: '郑南', role: '成员', tripMode: '拼车', vehicleId: 'v1', seatNo: 4, audit: '已通过', checked: true, checkedAt: '21:55', phoneTail: '1193' },
  { id: 'm09', name: '黄栗', role: '成员', tripMode: '拼车', vehicleId: 'v2', seatNo: 1, audit: '已通过', checked: true, checkedAt: '21:58', phoneTail: '5520' },
  { id: 'm10', name: '秦朗', role: '成员', tripMode: '拼车', vehicleId: 'v2', seatNo: 2, audit: '已通过', checked: true, checkedAt: '22:01', phoneTail: '8407' },
  { id: 'm11', name: '石青', role: '成员', tripMode: '拼车', vehicleId: 'v2', seatNo: 3, audit: '已通过', checked: false, phoneTail: '2864' },
  { id: 'm12', name: '唐夏', role: '成员', tripMode: '拼车', vehicleId: 'v3', seatNo: 1, audit: '已通过', checked: true, checkedAt: '21:57', phoneTail: '7051' },
  { id: 'm13', name: '魏莱', role: '成员', tripMode: '拼车', vehicleId: 'v3', seatNo: 2, audit: '已通过', checked: true, checkedAt: '22:03', phoneTail: '6129' },
  { id: 'm14', name: '谢原', role: '成员', tripMode: '拼车', vehicleId: 'v3', seatNo: 3, audit: '已通过', checked: false, phoneTail: '9382' },
  { id: 'm15', name: '罗壹', role: '成员', tripMode: '待定', vehicleId: null, seatNo: null, audit: '已通过', checked: false, phoneTail: '4476' },
  { id: 'm16', name: '高眠', role: '成员', tripMode: '待定', vehicleId: null, seatNo: null, audit: '待审核', checked: false, phoneTail: '3958' },
  { id: 'm17', name: '顾知', role: '成员', tripMode: '待定', vehicleId: null, seatNo: null, audit: '候补', checked: false, phoneTail: '0164' },
];

/* ---------------- 分车 (a1 活动) — 每排 4 座 + 1 过道 ---------------- */
export const VEHICLES = [
  { id: 'v1', label: '1 号车', plate: '川A·7X29K', driver: '王屿', capacity: 4, seats: ['林溪', '苏喧', '何隅', '郑南'] },
  { id: 'v2', label: '2 号车', plate: '川A·3M06T', driver: '陈暮', capacity: 4, seats: ['黄栗', '秦朗', '石青', null] },
  { id: 'v3', label: '3 号车', plate: '川A·9B15Q', driver: '赵拾', capacity: 4, seats: ['唐夏', '魏莱', '谢原', null] },
  { id: 'v4', label: '4 号车', plate: '川A·6H82D', driver: '周迟', capacity: 4, seats: [null, null, null, null] }, // 罗壹 未安排车辆（与 nextStep 文案一致）
];

/* ---------------- 协作面板派生数据 ---------------- */
export function collabSummary(roster = ROSTER) {
  const approved = roster.filter((m) => m.audit === '已通过');
  const checked = roster.filter((m) => m.checked);
  return {
    phase: '集合中',
    total: roster.length,
    approved: approved.length,
    checked: checked.length,
    unchecked: approved.length - checked.length,
    pendingAudit: roster.filter((m) => m.audit === '待审核').length,
    waitlist: roster.filter((m) => m.audit === '候补').length,
    noVehicle: approved.filter((m) => !m.vehicleId).length,
    arrived: checked.length,
    expected: approved.length,
    nextStep: '还有 3 人未到集合点，其中 1 人未安排车辆',
    nextAction: '发起出发确认',
  };
}

/* ---------------- 天气 (a1 目的地: 赵公山 · 顶线 2434m) ----------------
   确定性生成的 48 小时数据: 从 10/17 22:00 起，每小时一条 */
export const WEATHER_META = {
  location: '赵公山 · 顶线',
  elevationM: 2434,
  updatedText: '10 月 17 日 21:40 更新',
  verdict: '周日清晨云海机会中等',
  detail: '云层高度 2100–2500 米，日出前后短暂放晴，适合山顶等候；周日下午转小到中雨，建议上午完成下撤。',
  window: [['周日 06:00–10:00', '晴间多云', '云海 55%', '风 3 m/s']],
  source: '演示数据 · 非真实气象服务',
};

export const WEATHER_HOURS = (() => {
  const hours = [];
  const start = new Date(2025, 9, 17, 22, 0); // 10/17 周五 22:00（演示历，与正文星期一致）
  for (let i = 0; i < 48; i++) {
    const t = new Date(start.getTime() + i * 3600 * 1000);
    const h = t.getHours();
    const diurnal = Math.sin(((h - 6) / 24) * Math.PI * 2); // 06 时最低, 18 时最高
    let temp = 10 + diurnal * 5;
    let precip = 10 + Math.max(0, Math.sin((i / 48) * Math.PI * 2 + 1)) * 45;
    let wind = 2 + Math.max(0, Math.sin(i / 7)) * 4;
    let cloud = 40 + Math.max(0, Math.sin((i + 9) / 5)) * 45;
    if (i >= 40 && i <= 47) { precip = 65 + Math.min(30, (i - 40) * 6); } // 周日（10/19）下午起转雨
    if (i >= 31 && i <= 36) { cloud = 35 - (i - 31) * 4; precip = Math.max(5, 25 - (i - 31) * 4); } // 周日（10/19）登顶清晨放晴
    hours.push({
      t,
      label: `${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`,
      temp: Math.round(temp * 10) / 10,
      precip: Math.round(precip),
      wind: Math.round(wind * 10) / 10,
      cloud: Math.min(100, Math.round(cloud)),
      night: h < 6 || h >= 19,
      key: (i >= 32 && i <= 36) || (i >= 42 && i <= 45),
      keyNote: (i >= 32 && i <= 36) ? '云海窗口' : (i >= 42 && i <= 45 ? '降雨' : ''),
    });
  }
  return hours;
})();

/* ---------------- 通知 (占位, 供导航感一致性) ---------------- */
export const NOTICES = [
  { id: 'n1', title: '赵公山 · 东线穿越 已确认成行', meta: '今晚 22:10 出发 · 请准时到达集合点', time: '21:20', unread: true, kind: 'activity' },
  { id: 'n2', title: '高眠 申请加入 赵公山 · 东线穿越', meta: '等待你的审核', time: '20:40', unread: true, kind: 'audit' },
  { id: 'n3', title: '石青 提交了「无法参加」申请', meta: '赵公山 · 东线穿越', time: '18:12', unread: false, kind: 'signup' },
];

/* ---------------- 详情页参与者视图 (供七风格共用字段) ---------------- */
export const DETAIL_SIGNUP_STATE = {
  // 详情页 CTA 的初始业务状态（演示用，不接后端）
  ctaTheater: {
    idle: '立即报名',
    loading: '提交中…',
    done: '已报名 · 待审核',
    registered: true,
  },
};

export const DEMO = {
  viewer: VIEWER,
  activities: ACTIVITIES,
  featured: FEATURED,
  roster: ROSTER,
  vehicles: VEHICLES,
  collab: collabSummary(),
  weather: { meta: WEATHER_META, hours: WEATHER_HOURS },
  notices: NOTICES,
  credit: '演示数据 · 图片来自 Unsplash（氛围图，非活动实拍）',
};
