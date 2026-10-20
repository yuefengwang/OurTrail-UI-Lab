# 05 · 迁移到正式 OurTrail 微信小程序

> 目标：把 `prototype/final/` 的设计、信息架构与交互规格迁移到 `D:\OurTrail` 的微信小程序，而不是把 HTML 原型直接塞进小程序。
> 原则：真实产品仓库是规则来源；原型只提供设计基准；不改业务规则迁就 UI。
> 本轮没有修改 `D:\OurTrail`；所有改动限定在 UI Lab。

---

## 1. 先明确：哪些可以复用，哪些必须重做

### 1.1 可以直接复用（设计与规格层）

- 四页信息顺序、内容优先级、状态矩阵、角色边界、阶段门槛（00/04 文档）。
- Token：纸面/松林/陶土/雨蓝、字号/间距/圆角/发丝线、状态语义（03 文档、`tokens.css`）。
- 页面骨架：发现“主推 + 索引”、详情“决策事实 + 路线 + 状态化 CTA”、协作“任务队列 + 名单/车辆/现场”、天气“活动窗口 + 路线点 + 趋势图 + 限制”。
- 组件解剖：状态词、事实条、状态条、任务行、名单行、车辆块、座位图、路线图、海拔剖面、天气图、弹层、表单。
- 文案规则：中文优先、数字单位、无绝对安全结论、无平台未具备能力。
- 验收脚本与截图方法：`tools/dom-check-final.mjs`、`scenario-check-final.mjs`、`measure-final.mjs`、`shot-final.mjs`。

### 1.2 必须重做（平台层）

- 小程序导航/胶囊/safe-area/sticky/滚动容器（原型是浏览器 + 设备壳）。
- 弹层（半屏 sheet、键盘避让、防穿透、授权）。
- 表单（原生 input/picker、手机号校验、提交幂等、重试）。
- 列表虚拟化/长名单性能（正式活动可能 > 100 人）。
- 路线地图（真实地图组件/瓦片/坐标系 GCJ-02；原型是 SVG 示意）。
- 天气图表（canvas 2D with DPR；原型是 SVG）。
- 图片资产（真实路线照片；去掉 AI/氛围图）。
- 真实数据、缓存、降级、权限、审计、通知。

### 1.3 不可以复用（实验专用）

- 页面顶部“数据状态/阶段/角色”实验控制面板。
- 本地 `store` 事务状态与“演示” toast。
- 模拟天气数据、AI 生成主图、演示名单/车辆/车牌/人名。
- 直接跳阶段的实验下拉；产品内只能走门槛弹层。

---

## 2. 页面到真实代码的映射

### 2.1 发现

| 原型 | 真实产品 |
|---|---|
| `prototype/final/js/discover.js` | `miniprogram/pages/discover/` + `src/screens/ActivityHome.tsx` + `src/components/ActivityCard.tsx` |
| 主推/索引/过去折叠 | `discover.js` 的“未来在前、过去置底”、`ADR-0003` 发现只读 |
| 事实条/余位/状态 | `selectors` 的 confirmed/pending/remaining；`format.js` 状态词 |
| 搜索/筛选 | 现有 discover 搜索；筛选按状态派生 |

迁移注意：
- 发现页只返回“已发布/可发现”的活动；不要引入集合点、名单、敏感字段。
- 主推不重复进入默认索引；搜索/筛选返回完整结果。
- 费用是说明，不是支付；不在发现页写“立即支付”。

### 2.2 详情

| 原型 | 真实产品 |
|---|---|
| `prototype/final/js/detail.js` | `miniprogram/pages/activity/` + `src/screens/ActivityDetail.tsx` |
| 状态条/CTA | `journey.participantNext` + `getDetailState` + `permittedActions` |
| 路线图/剖面 | `routeSnapshot.points[]`、`track[]`、`路线地图可视化-活动详情页设计.md` |
| 集合点 | `pickupPoints[]`（地址/时间） |
| 报名 sheet | `pages/signup` + `signup.submit`（manual/automatic、候补显式同意） |
| 我的安排 | `view.rows` 仅本人/代报名同行人；车辆/座位来自 `transport` |
| 领队/同行 | `ownerId` 推导组织者；活动内 `staff/vehicle_contact` |
| 费用/退出 | `feeNote/cancellationNote`；平台不收款 |

迁移注意：
- 不把 `ActivityDetail.tsx` 的“所有信息堆在一页”原样搬；按本规格的决策顺序重组。
- 参与者不显示全量名单/电话/座位；组织者入口只在 owner 时出现。
- 报名状态必须由 `getDetailState` 派生，不在 UI 新造 `approved/closed` 状态。
- 无路线点/无坐标时，地图区块不渲染；显示“路线节点由组织者补充”，不要画假路线。
- 原型的本地报名事务（提交→审核→取消）映射真实 `signup.submit/review/cancel`；详情/工作台同源回写。

### 2.3 协作

| 原型 | 真实产品 |
|---|---|
| `prototype/final/js/collab.js` | `miniprogram/pages/workspace/` + `src/screens/Workspace.tsx` + `Roster`/`Transport`/`Field`/`StaffTask`/`VehicleTask` |
| 任务队列 | `leaderQueue`（待审核/待分车/待签到/异常/待到家人/路线不完整）+ 拦路标记 |
| 名单 | `Roster.tsx`/`roster-panel.wxml`；搜索/筛选/批量；同行组 |
| 车辆 | `allocation.ts`/`transport.ts`/`invariants.ts`；核载/司机/预留/上车点覆盖 |
| 现场 | `field.ts`；签到/出发/上车/节点/到家/异常 |
| 角色 | `permissions.ts` 的 staff/vehicle_contact capability/scope/expiry |
| 阶段 | `activity.ts` 的 7 阶段门槛 |

迁移注意：
- 任务是派生的 `leaderQueue`，不是新建任务表；不要为了 UI 增加“任务记录/截止时间”模型。
- 车辆必须以真实核载与座位为准；不要复用原型的 18/6 演示；司机不占乘客座。
- 同行组整组同车、司机换人、车辆删除、预留位必须在真实规则内实现；本轮未覆盖。
- 车长只显示本车两程；协作只显示授权范围；敏感资料按用途查看并审计。
- 阶段推进必须走服务端校验；客户端只做门槛提示，不把“已发车/已到家”当成本地布尔。
- 原型的 `store.actions` 只是本地不变量演示；生产逐条映射真实 command（见 3.5）。

### 2.4 天气

| 原型 | 真实产品 |
|---|---|
| `prototype/final/js/weather.js` | `pages/weather-hub` + `pages/weather` + `src/screens/Weather.tsx` |
| 活动窗口/路线点 | `activity.routeSnapshot.points[]` + `point.ele/time`；P1/P2 的点位选择 |
| 24/48/72h | `getWeather` 的 days/detail/series；P2/P3 |
| 云底/海拔 | `weather-model`/`sky.js`；`eleSrc=gpx|picked|manual|model` |
| 关键时段 | `sky.js` 阈值 + `MARK_STYLE`；本原型窗口是演示 |
| 数据来源/限制 | `updatedAt`、Open-Meteo、缓存降级；P1 的 70–80% 说明 |
| 无数据 | 超出 14 天/无坐标/取数失败：不插值；给范围与重试 |

迁移注意：
- 真实产品没有观测/雷达；不要写“实况”。
- 云海/光染只能用概率语言；不写“会有云海”。
- 海拔必须标来源；模型海拔误差 ±300–600m；云底/能见度是派生。
- 活动窗口、关键点名称必须与 routeSnapshot 同源；不能把 GPX 历史日期当活动日期。
- 天气页不判断活动能否出发；不替代领队。
- 375 使用 compact 三车道 + 图例；风/距离/爬升移到选中详情或详情页；生产 canvas 保持同等刻度与标签密度。

---

## 3. 数据契约（建议）

### 3.1 发现

```ts
type DiscoverItem = {
  id: string;
  title: string;
  routeName: string;
  startAt: string;       // ISO +08:00
  meetingAt?: string;
  city: string;
  distanceKm: number | null;
  ascentM: number | null;
  difficulty?: '入门' | '进阶' | '挑战'; // UI Lab 补充，真实模型可空
  feeNote: string;
  capacity: number;
  confirmed: number;
  pending: number;
  waitlisted: number;
  remaining: number;     // capacity - confirmed - pending（不夹 0）
  phase: 'published' | 'gathering' | 'active' | 'closing' | 'archived' | 'cancelled';
  isOwner: boolean;
  cover?: { url: string; focus?: string };
  weatherSummary?: string; // 仅当有可信数据；否则不展示
};
```

### 3.2 详情

```ts
type DetailView = {
  activity: {
    id; title; startAt; endAt; deadlineAt; capacity; approvalMode;
    phase; feeNote; cancellationNote; organizerIntro;
    routeSnapshot: { title; distanceKm; ascentM; points: RoutePoint[]; risks: Risk[]; track?: LngLat[] };
    pickupPoints: PickupPoint[];
  };
  counters: { confirmed; pending; waitlisted; remaining; occupied };
  detailState: 'new'|'pending'|'confirmed'|'ready'|'gathering'|'checked'|'active'|'closing'|'finished'|'waitlist'|'closed'|'cancelled';
  primarySignupId?: string;
  rows: PersonRowView[];        // 仅本人/代报名同行人
  permittedActions: string[];    // signup.submit / attendance.checkin / ...
};
```

### 3.3 协作

```ts
type WorkspaceView = {
  activity: ActivityView;
  phase: ActivityPhase;
  role: 'owner'|'staff'|'vehicle_contact';
  leaderQueue: { key; count; blocking; target; label }[];
  roster: { groups; pending; confirmed; waitlisted; unassigned; selfArrive; sensitive? };
  transport: { vehicles; assignments; unassigned; constraints };
  field: { checkins; departures; boardings; nodes; homes; incidents };
  capabilities: { canAudit; canAssign; canCheckin; canNode; canIncident; canHome; canSensitive };
};
```

### 3.4 天气

```ts
type WeatherView = {
  activityId; activityTitle; activityStartAt; activityEndAt;
  point: { id; name; ele; eleSrc; coordinates; eta? };
  range: '7d'|'24h'|'48h'|'72h';
  updatedAt; source;
  days: DaySummary[];
  series: HourSeries[];       // 温度/降水概率/量/风/阵风/云量/云底/能见度
  windows: { label; start; end; tone; effect; evidence }[];
  limitations: string[];
};
```

数据来源以真实产品的 `selectors`/`journey`/`allocation`/`field`/`getWeather` 为准；本文是 UI 消费契约，不是新后端模型。

---

## 3.5 本地事务层 → 生产命令

原型 `prototype/final/js/store.js` 的 `actions` 是界面契约与不变量清单，不是后端。迁移时按下表落到真实 command；服务端必须再次校验并写审计。

| 原型 action | 生产 command/路径 | 服务端必须复核 |
|---|---|---|
| `signupSubmit` | `signup.submit` | published/截止/容量/重复/审批模式/同行组 |
| `signupUpdate` | `signup.update` | 阶段/本人或有授权/出发后不可改 |
| `signupCancel` | `signup.cancel` | 阶段/无出行事实/司机限制 |
| `audit` | `signup.review` | 仅 owner、仅 pending、幂等 |
| `assign` | `transport.assign` | 核载/司机/预留/上车点覆盖/同行组/未发车 |
| `checkin` | `attendance.checkin` | 阶段/范围/capability/证据 |
| `board` | `transport.board` | 已签到/本车/未发车/一程 |
| `depart` | `transport.depart` | 车长/缺口/服务端最终裁决 |
| `home` | `attendance.home` | closing/joined/代理授权/依据 |
| `resolveIncident` | `incident.resolve` | 依据/权限/未解决 |
| `advance` | `activity.advance` | 7 阶段门槛/不可跳步 |

禁止：把本地已确认当作事实、客户端跳过阶段、用 UI 计数替代服务端计数。

---

## 4. 迁移顺序与验收

### Phase 0 — 资产与 token 冻结（1–2 天）

- 把 03 的 token 落到 WXSS `page` 变量；确认中文字体在 iOS/Android 的回落。
- 用真实路线照片替换 `cover-qingcheng.jpg`（AI 氛围图）；压缩到主包预算。
- 建立页面状态清单和截图基线。

验收：token 在所有页面生效；无硬编码颜色；图片体积/授权合规。

### Phase 1 — 全局组件（2–3 天）

- AppBar / ActionBar / Sheet / Button / StatusChip / Segmented / Empty / Toast。
- sticky + safe-area + 键盘避让。
- 统一焦点/触控（主 48px，次 ≥40px 热区）。

验收：组件在 375/390/414 真机可用；无遮挡；弹层不穿透。

### Phase 2 — 发现页（2–3 天）

- 主推 + 索引 + 搜索/筛选 + 过去折叠。
- 数据窄投影；不返回名单/集合点/敏感字段。

验收：375 首屏主 CTA 可见；搜索/筛选完整；主推不重复；0 console error。

### Phase 3 — 详情页（4–6 天）

- 状态机/CTA/状态条；报名 sheet；路线图/剖面/节点/上车点；装备/风险/费用；我的安排。
- 组织者入口；分享；返回定位。

验收：8 状态 + 组织者；主 CTA 唯一；路线点与天气同源；参与者无全量名单；提交→协作名单→审核→详情→取消事务链通过。

### Phase 4 — 协作页（6–8 天）

- 指挥带/任务队列；名单（搜索/筛选/审核/分车/签到/到家）；车辆（真实核载/座位）；现场门槛。
- 角色：组织者/协作/车长；权限门；敏感资料按用途。

验收：任务队列首屏；审核/分车/签到/到家/阶段推进；车长只本车；门槛不可绕过；每个动作有服务端复核与失败反馈。

### Phase 5 — 天气页（4–6 天）

- 活动窗口/路线点/24-48-72h/趋势图/选中/关键时段/对比/限制/无数据。
- 接入真实 Open-Meteo；缓存/降级；海拔来源；模拟标注移除（改为真实数据来源）。

验收：数据真实、单位完整、选中联动、375 compact 图表完整进入首屏；不出现“实况/安全”绝对表述。

### Phase 6 — 跨页与真机（3–5 天）

- 同一活动事实、返回路径、滚动定位、角色切换、跨页计数。
- iOS/Android/微信开发者工具；弱网；字体；长名单；性能。

验收：00/02 的状态矩阵和跨页一致性通过；视觉回归截图通过；无 P0/P1 缺陷。

---

## 5. 依赖与前置条件

| 依赖 | 现状 | 迁移要求 |
|---|---|---|
| `routeSnapshot.points[].coordinates/ele/time` | 真实模型可选 | 主活动必须有坐标/海拔/时间；缺失则路线/天气显式降级 |
| `pickupPoints[]` | 真实模型有 | 详情/分车/车长共用；覆盖校验 |
| `allocation/transport/field` | 真实规则已有 | 直接消费；不在 UI 重写规则 |
| 权限 `staff/vehicle_contact` | 真实模型有 | capability/scope/expiry；UI 按权限隐藏 |
| Open-Meteo / weather-model | 真实产品已有 | 保留缓存/降级/数据源/更新时间；海拔来源 |
| 地图 | 真实产品有地图设计文档 | 用真实地图组件；GCJ-02；无坐标不渲染 |
| 通知/导出 | 真实产品有 | 本轮未做 UI；生产按现有能力接 |
| 支付/退款 | **不存在** | 不设计支付；费用只说明 |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 演示数据被误当真实 | 产品/合规风险 | 页头常驻“模拟预报/演示数据”；生产移除模拟；不写实况 |
| 路线点/海拔缺失 | 详情/天气空或误导 | 无坐标不渲染地图/天气；明确“路线节点待补充” |
| 车辆核载/座位与真实不符 | 超卖/分车错误 | 直接读 allocation/transport；司机不占乘客座；覆盖上车点 |
| 同行组被静默拆开 | 履约风险 | 整组同车；冲突提示；不自动拆组 |
| 阶段门槛被客户端绕过 | 现场风险 | 服务端再次校验；客户端只提示；不可回退 |
| 本地事务被误当后端 | 数据一致性风险 | 明确“内存事务、刷新重置”；生产映射真实 command + DB 事务 + 幂等 + 审计 |
| 全量名单/敏感资料泄露 | 隐私/权限 | 详情不展示；工作台按权限/用途/审计；车长只本车 |
| 375 图表可读性 | 决策质量 | 已用 compact 三车道 + 图例进入首屏；生产用 canvas DPR；真机测试；必要时改为 24h 默认或分时表 |
| sticky/safe-area/键盘 | 操作被遮挡 | 真机验证；底部 fixed + padding；键盘避让 |
| 图片包体 | 主包 2MB 限制 | 替换 AI 图；压缩/裁剪/按需加载 |
| 字体回落 | 品牌感/可读性 | iOS/Android 真机；必要时统一无衬线 |
| 长页滚动 | 找不到区块 | 锚点/返回定位；首屏决策已前置；真机验证 |


---

## 7. 测试计划

### 7.1 单元/选择器

- `getDetailState` / `participantNext` / `leaderQueue` / `allocation` / `field` 的现有测试通过。
- 新增 UI 数据映射测试：confirmed/pending/remaining、stage gate、role capabilities。

### 7.2 集成/UI

| 场景 | 验收 |
|---|---|
| 发现搜索/筛选/过去折叠 | 完整结果、空态、返回恢复 |
| 详情 8 状态 + 组织者 | CTA/状态条/权限正确 |
| 报名提交 | manual→pending；automatic→confirmed；容量/候补/重复/授权 |
| 协作主链路 | 审核→分车→签到→出发→异常→到家→归档 |
| 报名事务链 | 提交→名单→审核→详情→取消→发现/协作计数同步 |
| 车长/协作 | 只本车/授权范围；无越权 |
| 天气 | 切点/选时/24-72h/无数据/真实数据源；375 compact 图表可读 |
| 跨页 | 活动名/时间/费用/名额/路线点/天气窗口一致 |

### 7.3 设备/视觉

- iOS/Android 微信开发者工具 + 真机；375/390/414。
- 字体回落、sticky、safe-area、键盘、长名单、弱网。
- 视觉回归：四页 fold/mid/full + 关键状态；对照本仓库截图。
- 触控设备仿真：iPhone SE/13/11 Pro Max/Pixel 5；触控路径、键盘焦点、目标尺寸；物理真机仍需补。
- 无障碍：焦点/标签/对比度/触控；建议引入 axe 或微信无障碍检查。

### 7.4 性能

- 发现列表首屏 < 1.5s（弱网可接受范围）；图片懒加载。
- 天气图表 canvas 帧率/内存；长名单虚拟化；协作页 rerender 成本。
- 主包/分包体积；AI 图替换后重新计算。

---

## 8. 需要产品/工程确认的问题

1. 发现页是否需要在主推卡直接显示“活动日天气”入口？本轮只放在详情/路线区，避免第二个主行动。
2. 375 天气已用 compact 48h（完整图表进首屏）；是否还要默认 24h，需产品确认。
3. 详情是否展示“待审核人数”？本轮展示，便于解释余位；若产品认为参与者不需要，可移除。
4. 报名是否允许代同行人？本轮表单只有“同行代办授权（选填）”，名单只显示本人；正式产品需要同行组数据。
5. 协作审核是否需要批量？本轮逐人审核；真实产品有批量，但设计上应保留逐人确认的防误操作。
6. 车长“完成本程”是否自动推进阶段？本轮不自动；阶段由组织者推进，车长只记录事实。
7. 敏感资料查看的用途/审计 UI 是否进入本轮工作台？本轮只提示“按用途另行查看”，未做完整流程。
8. 非主活动的路线/天气/协作数据由谁补全？没有数据时采用什么降级文案？
9. 真实地图供应商/坐标系/路线 track 来源；是否需要离线地图。
10. 图片资产替换与授权；AI 主图是否可接受为设计阶段占位。

---

## 9. 文件地图

| 内容 | 路径 |
|---|---|
| 可运行原型 | `prototype/final/index.html` |
| Token/壳/共享组件 | `prototype/final/css/{tokens,base,app}.css` |
| 页面样式 | `prototype/final/css/{discover,detail,collab,weather}.css` |
| 数据源 | `prototype/final/js/data.js` |
| 本地事务 | `prototype/final/js/store.js` |
| 紧凑天气图 | `prototype/final/js/weather-chart.js` |
| 壳/导航/状态 | `prototype/final/js/app.js` |
| 共享 UI | `prototype/final/js/ui.js` |
| SVG 图表 | `prototype/final/js/charts.js` |
| 四页 | `prototype/final/js/{discover,detail,collab,weather}.js` |
| 主图 | `prototype/assets/photos/cover-qingcheng.jpg`（AI 占位，生产替换） |
| 测量 | `prototype/final/evidence/*.json` |
| 回归 | `prototype/tools/dom-check-final.mjs`（56/56）、`scenario-check-final.mjs`（39/39） |
| 触控验收 | `prototype/tools/touch-check-final.mjs`（49/49） |
| 截图 | `prototype/final/screenshots/{before,after,states,compare}/` |
| 设计文档 | `docs/ui-design/final-pass/00–05` |

---

## 10. 迁移完成的定义

- 真实数据下四页均能打开、返回、操作；无假按钮、无空壳入口。
- 详情/协作的状态与权限来自真实 selector，不由 UI 自造。
- 天气数据真实、来源/范围/限制可见；不出现绝对安全结论。
- 跨页同一事实一致；375/390/414 真机通过。
- 0 console error；关键回归通过；视觉验收有截图证据。
- 设计系统 token/组件在正式小程序落地，而不是把 HTML 原型嵌进 web-view。
