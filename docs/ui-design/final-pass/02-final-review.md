# 02 · 最终视觉验收与遗留问题

> 验收对象：`prototype/final/`（Final Pass）
> 基线：`prototype/round4/`（远端 `3f6a445`）
> 运行：`node prototype/tools/serve.mjs 4176` → `http://127.0.0.1:4176/final/index.html`
> 浏览器：Playwright headless Chromium；视口 375×667、390×844、414×896；**页面可用高度 603 / 780 / 832**（已扣除状态栏 + 胶囊 64px）
> 日期：2026-10-20

---

## 1. 结论摘要

这轮把四个页面从「四张各自精致的页面」收敛成了一条可执行的产品链：

- **发现页**：首屏从“刊头 + 海报”变成“最近一场 + 决策事实 + 下一步”；375 首屏 CTA 从被截断变为 423–471 可见；默认列表从过去活动开场变为未来活动开场。
- **详情页**：首屏不再用“查看山顶天气”抢夺主行动；唯一主 CTA 随报名状态变化；路线图、海拔剖面、关键点、上车点、装备与风险进入决策路径。
- **协作页**：从“4×4 座位网格 + 2585px 之后的下一步”变成“首屏任务队列 + 名单/车辆/现场”；审核、分车、签到、到家、阶段推进都可执行，阶段门槛会拦住不合法的推进。
- **天气页**：从“单点 48h 横滑 + 关键窗口卡”变成“活动窗口 × 三个路线点 × 云底/海拔 × 降水/风/温度”的路线天气工具；模拟数据常驻标注，限制不折叠。

同时，仍在推进中的部分：375 天气已把完整图表放进首屏，但选中时段详情仍需轻滚，紧凑图字号 8–9px；非主活动的路线/天气/协作只有占位或通用详情；报名/名单已本地事务化，但仍是内存状态，刷新重置，不是后端。详见第 8 节。

---

## 2. 工程与运行

| 项 | 结果 |
|---|---|
| 运行方式 | 零依赖静态服务器 `prototype/tools/serve.mjs 4176`，无构建步骤 |
| 模块语法 | 10 个 ES module 全部通过 `node --input-type=module --check` |
| 控制台错误 | 12 个页面/视口组合 + 事务/设备状态，全部 0 console error |
| 页面级横向溢出 | 12/12 组合 `scrollWidth <= clientWidth`（天气横向滚动属于图表内部，不是页面） |
| 图片 | 主活动新主图 1280×853 / 约 265KB；过去组两张 `loading=lazy` 在折叠内，展开后加载（HTTP 200） |
| 设备壳 | 状态栏/胶囊 64px 与页面内容严格分离；所有首屏断言按 603/780/832 计算 |
| 浏览器 | Chromium desktop headless + 4 个移动设备描述符（iPhone SE/13/11 Pro Max/Pixel 5）；**未做微信开发者工具/物理真机** |

---

## 3. 自动化验证结果

### 3.1 主回归（`tools/dom-check-final.mjs`）

**56 PASS / 0 FAIL**

覆盖：
- 发现：375 CTA 在 603 内（bottom 471）、筛选条首屏可见、搜索命中、搜索无结果、已结束筛选、过去组展开、发现→详情。
- 详情：报名入口、报名表、提交→待审核、待审核→我的报名、已确认→滚动到路线、详情→天气、8 种状态渲染。
- 协作：首屏任务优先、无统一 4×4 网格、3 人审核→待审核清零、分车后未分车减少、推进到集合、集合阶段签到、车长本车视角、车长确认上车、缺口发车、协作视角限制、异常处理、到家确认、归档只读。
- 天气：模拟标注、活动窗口、三点切换、趋势图、切点同步、云底/海拔关系、图表选时、24h、关键时段跳转、无数据不插值。

### 3.2 阶段推进、事务与跨页一致性（`tools/scenario-check-final.mjs`）

**39 PASS / 0 FAIL**

关键链路：
- 集合阶段逐人签到 4 + 分车 3 + 补签到 1 → 门槛满足 → 勾选车长确认 → 进入同行。
- 返程阶段处理异常 → 逐人确认到家 8 人（每人填写依据 + 勾选代确认授权）→ 归档。
- 跨页事实：青城后山 / 12.8 km / 680 m / ¥168 / 18 已确认 / 3 待审核 / 3 个路线点 / 模拟天气，四页同源。
- 返回路径：详情→发现、天气→详情、协作→详情。
- 事务链：详情提交报名 → 协作名单出现沈岚 pending（待审核 4 / 余位 2）→ 组织者审核通过 → 详情 confirmed（19 已确认）→ 发现页同步（19/3/余位 2）→ 取消报名 → 名单移除、待审核回到 3、发现页回到 18/3/余位 3。

### 3.3 测量数据

完整 JSON：`prototype/final/evidence/final-measure.json`、`prototype/final/evidence/baseline-measure.json`。

| 页面 | 视口 | 页面可用高 | 页面 scrollHeight | 首屏关键位置 | 结果 |
|---|---:|---:|---:|---|---|
| 发现 | 375 | 603 | 1199 | CTA 423–471；首行 587–658 | CTA 可见；首行露出 16px |
| 发现 | 390 | 780 | 1235 | CTA 445–493；首行 620–691 | CTA + 首行可见 |
| 发现 | 414 | 832 | 1248 | CTA 458–506；首行 633–704 | CTA + 首行可见 |
| 详情 | 375 | 603 | 3016 | 底部行动条 509–603 | 唯一主 CTA 始终贴底可见 |
| 详情 | 390 | 780 | 3019 | 底部行动条 686–780 | 同上 |
| 详情 | 414 | 832 | 3018 | 底部行动条 738–832 | 同上 |
| 协作 | 375 | 603 | 2270 | 首条任务 329–387 | 首屏是任务，不是座位网格 |
| 协作 | 390 | 780 | 2272 | 首条任务 332–389；首名成员 736 | 首屏任务 + 名单头部 |
| 协作 | 414 | 832 | 2272 | 首条任务 332–389；首名成员 736 | 同上 |
| 天气 | 375 | 603 | 1857 | 图表 272–601；选中详情 613 起 | 完整图表进入首屏；选中详情需轻滚 |
| 天气 | 390 | 780 | 1964 | 图表 355–740 | 完整 |
| 天气 | 414 | 832 | 1937 | 图表 355–757 | 完整 |

---

## 4. 四页修改前后

对照图（390×844，同一页面可用高度 780px）：
- [发现页对照](../../../prototype/final/screenshots/compare/compare-discover-390.png)
- [详情页对照](../../../prototype/final/screenshots/compare/compare-detail-390.png)
- [协作页对照](../../../prototype/final/screenshots/compare/compare-collab-390.png)
- [天气页对照](../../../prototype/final/screenshots/compare/compare-weather-390.png)

### 4.1 发现页

**修改前**（Round 4）：刊头 123 + 主卡 461 + 接缝 134；390 列表 786 起；375 CTA 616–664（设备 667 内，但页面可用高度 603，实际被截断）；主卡整卡是 button，内部又有 span 按钮；过去组在末尾展开。

**修改后**：
- 顶栏 50；主推区 59–471；首条索引 587（375）/ 620（390）。
- 375 CTA 423–471，完整在 603 内；首行 587–658，露出 16px。
- 主推标题 21–24px 衬线；索引标题 13.5px 无衬线；长标题「四姑娘山 · 大峰攀登（2 日）」拆为标题 + `2 日` 小标签，不再截断成「（2...」。
- 默认列表排除主推；搜索/筛选才展示完整结果并标 `主推`；过去组折叠为一行。
- 主卡只有一个 `<button>` CTA；图片和标题是独立链接，键盘顺序可预期。
- 缩略图改为 4:3，按 `focus` 裁切；不再 1:1 中心裁切。
- 状态词 + 形状（点/对勾/横线/叉）+ 文字；不靠颜色单独承担语义。

截图：
- [375 fold](../../../prototype/final/screenshots/after/final-discover-375-fold.png) · [375 mid](../../../prototype/final/screenshots/after/final-discover-375-mid.png) · [375 full](../../../prototype/final/screenshots/after/final-discover-375-full.png)
- [390 fold](../../../prototype/final/screenshots/after/final-discover-390-fold.png) · [390 mid](../../../prototype/final/screenshots/after/final-discover-390-mid.png) · [390 full](../../../prototype/final/screenshots/after/final-discover-390-full.png)
- [414 fold](../../../prototype/final/screenshots/after/final-discover-414-fold.png) · [414 mid](../../../prototype/final/screenshots/after/final-discover-414-mid.png) · [414 full](../../../prototype/final/screenshots/after/final-discover-414-full.png)
- 搜索命中 / 无结果 / 已结束：[search-hit](../../../prototype/final/screenshots/after/final-discover-390-search-hit.png) · [search-none](../../../prototype/final/screenshots/after/final-discover-390-search-none.png) · [filter-ended](../../../prototype/final/screenshots/after/final-discover-390-filter-ended.png)

**仍未达到理想**：
- 375 首屏只露出第一行 25px，还没有完整一行；如果产品更强调“一屏内比较”，还可以把主推图再压 10–15px，但这会牺牲主图气场，本轮选择保留图片。
- 未在主推卡显示“活动日天气”的可点击入口；天气入口只放在详情和路线区，避免发现页出现第二个主行动。是否需要在发现页直接看天气，需要产品确认。

### 4.2 详情页

**修改前**：Hero 白卡叠压 516；首屏主按钮「查看山顶天气」443–491；底部「立即报名」720–768；没有报名状态机；领队卡展示电话尾号/座位/签到；「查看名单与分车」对所有人可见；路线画像只有 4 个事实。

**修改后**：
- 唯一主行动在底部行动条，随状态变化：填写报名资料 / 查看我的报名 / 查看集合与出行 / 重新报名 / 看看其他活动 / 进入协作工作台。
- 首屏：活动图 + 身份 + 4 个决策事实 + 适合谁 + 状态条 + 底部行动条；费用、余位、截止、待审核在同一视觉路径。
- 路线区：数据驱动 SVG 地图（3 点、方向、指北、等高线暗示）+ 海拔剖面 + 3 个节点行 + 2 个上车点 + 路线天气入口；节点名与天气页同名同序。
- 状态覆盖：未报名、待审核、已确认、候补、已取消报名、报名关闭、活动取消、已归档、组织者。
- 参与者不出现全量名单/电话/座位；只有已确认/待审核时显示“我的安排”。
- 装备清单可勾选并显示进度；风险按“需要留意”列出；费用/退出约定前移。
- 底部行动条在页面流末尾 sticky；375/390/414 始终可见；页面底部留白与行动条不互相遮挡（full 截图检查）。

截图：
- 三视口：[375 fold](../../../prototype/final/screenshots/after/final-detail-375-fold.png) · [375 full](../../../prototype/final/screenshots/after/final-detail-375-full.png) · [390 fold](../../../prototype/final/screenshots/after/final-detail-390-fold.png) · [390 full](../../../prototype/final/screenshots/after/final-detail-390-full.png) · [414 fold](../../../prototype/final/screenshots/after/final-detail-414-fold.png) · [414 full](../../../prototype/final/screenshots/after/final-detail-414-full.png)
- 状态：[pending](../../../prototype/final/screenshots/after/final-detail-pending-390.png) · [confirmed](../../../prototype/final/screenshots/after/final-detail-confirmed-390.png) · [waitlist](../../../prototype/final/screenshots/after/final-detail-waitlist-390.png) · [closed](../../../prototype/final/screenshots/after/final-detail-closed-390.png) · [cancelled](../../../prototype/final/screenshots/after/final-detail-cancelled-390.png) · [archived](../../../prototype/final/screenshots/after/final-detail-archived-390.png) · [organizer 375](../../../prototype/final/screenshots/after/final-detail-organizer-375.png) · [organizer 414](../../../prototype/final/screenshots/after/final-detail-organizer-414.png)
- 弹层：[报名表](../../../prototype/final/screenshots/states/detail-signup-sheet-390.png) · [我的报名](../../../prototype/final/screenshots/states/detail-my-signup-sheet-390.png)

**仍未达到理想**：
- 页面 3019px，比 Round 4 长 765px；增加的是路线图/剖面、风险、装备进度、我的安排与费用约定。首屏决策密度更高，但“长页”需要正式小程序验证滚动锚点与返回定位。
- 报名/名单已本地事务化：提交后进入协作名单（沈岚 pending），审核后详情变为 confirmed，取消释放名额，发现/详情/协作计数同步；但仍是内存事务，刷新重置，没有服务端并发/幂等/审计。正式实现必须映射到真实 `signup.submit/review`、`transport.assign`、`field.*`、`activity.advance` 命令。
- 参与者详情只显示“我的安排”，没有“同行人”列表（真实产品允许本人与代报名同行人）；本轮主活动没有同行组数据，留作生产实现。

### 4.3 协作页

**修改前**：刊头 142 + 阶段头 90 + 分车 515 + 名单 1590 + 下一步 2473；唯一操作「发起出发确认」在 2585–2633；4 台车 × 4 座统一格；没有审核/签到/分车操作；单阶段单角色；数字口径与详情不一致。

**修改后**：
- 深松绿指挥带：角色、阶段、活动、时间锚点、5 段阶段步进、3 个关键统计。
- 首屏「现在要做」任务队列：审核报名 3 / 安排车辆 1 / 报名今晚截止；每条有责任动作与阻塞说明；点击直接进入对应面板。
- 名单：搜索 + 筛选；“需要处理”在前，“已就绪”在后；每行主区可点开状态，侧边只保留当前该做的事（审核/安排/签到/确认到家/处理异常）；已就绪行不再重复“查看”。
- 车辆：真实核载口径（1 号中巴 18 乘客位、2 号车 6 乘客位、司机 2 人、自行前往 2 人、未分配 1 人）；未分配区 + 车辆行 + 可展开座位图；只在需要看座位时展开。
- 现场：签到 → 上车 → 发车 → 节点 → 到家 → 异常，每一步独立；发布阶段签到/上车关闭；阶段门槛检查在页面内可见。
- 阶段推进：集合门槛（pending=0）→ 同行门槛（签到/分车/异常 + 车长确认）→ 返程门槛（异常 + 原因）→ 归档门槛（到家/异常）。全部通过弹层执行，不可用按钮不给假操作。
- 角色：组织者全量；协作只看签到/节点/异常；车长只看本车 10 名乘客与两程，不看全量名单/敏感资料。

截图：
- 三视口：[375 fold](../../../prototype/final/screenshots/after/final-collab-375-fold.png) · [375 full](../../../prototype/final/screenshots/after/final-collab-375-full.png) · [390 fold](../../../prototype/final/screenshots/after/final-collab-390-fold.png) · [390 full](../../../prototype/final/screenshots/after/final-collab-390-full.png) · [414 fold](../../../prototype/final/screenshots/after/final-collab-414-fold.png) · [414 full](../../../prototype/final/screenshots/after/final-collab-414-full.png)
- 阶段：[gathering](../../../prototype/final/screenshots/after/final-collab-gathering-390.png) · [active](../../../prototype/final/screenshots/after/final-collab-active-390.png) · [closing](../../../prototype/final/screenshots/after/final-collab-closing-390.png) · [archived](../../../prototype/final/screenshots/after/final-collab-archived-390.png)
- 角色：[driver](../../../prototype/final/screenshots/after/final-collab-driver-390.png) · [staff](../../../prototype/final/screenshots/after/final-collab-staff-390.png)
- 车辆/弹层：[vehicles](../../../prototype/final/screenshots/after/final-collab-vehicles-390.png) · [audit sheet](../../../prototype/final/screenshots/states/collab-audit-sheet-390.png) · [assign sheet](../../../prototype/final/screenshots/states/collab-assign-sheet-390.png) · [depart gap](../../../prototype/final/screenshots/states/collab-depart-gap-390.png)
- 推进后：[active after advance](../../../prototype/final/screenshots/states/collab-active-after-advance-390.png) · [archived after advance](../../../prototype/final/screenshots/states/collab-archived-after-advance-390.png)

**仍未达到理想**：
- 375 首屏只到“成员名单”标题，第一名成员 731（页面 603），需要滚动；但首屏的三个任务动作都在 329–387，点击动作会滚到对应面板，主任务不依赖手动滚动。
- 4 台车/座位是演示数据；正式产品的车辆核载、预留位、同行组、上车点覆盖需要从 `allocation.ts` / `transport.ts` 直接读取，不能沿用演示。
- 协作页没有实现“同行组整组同车”“司机换人”“车辆删除”等真实异常操作；本轮只验证主链路。
- 阶段控制台的“阶段”下拉可以直达任意阶段（实验控制），产品内必须只走门槛弹层。

### 4.4 天气页

**修改前**：位置头 118 + 关键窗口 399 + 48h 横滑 163 + 折叠详情 187；单点「顶线 2434m」；活动 10/18 22:10，天气从 10/17 22:00 开始，没有活动窗口；48 个 92px 单元横滑。

**修改后**：
- 页头：活动名 + 活动日 10/24 07:00–18:00 + 路线名 + 距离/爬升 + `模拟预报 · 非真实气象服务` 常驻徽标 + 判断置信。
- 3 个路线点（780/1060/1240m，08:30/10:40/12:40）可切换；每点用自己海拔的温度/云底/能见度。
- 一张 SVG 趋势图：云底 vs 点海拔、降水概率柱（2h 聚合）、气温线、风箭头、活动窗口、3 个关键时段、选中小时；图例与单位完整。
- 选中时段详情：降水概率/量、风/阵风、气温、云底、能见度、在云中/云上、影响句；不插值、不编造超出范围的数字。
- 关键时段：低云·石阶湿滑（06:00–10:00）、阵雨·风增大（12:00–17:00）、雨势减弱（17:00–19:00）；点开切换点到对应时段。
- 沿路线对比：3 点 × 气温/降水/风/能见度；点选一行切换图表。
- 数据说明常驻：数据性质、范围、海拔、限制、行动边界；模拟数据不是出发许可。

截图：
- 三视口：[375 fold](../../../prototype/final/screenshots/after/final-weather-375-fold.png) · [375 full](../../../prototype/final/screenshots/after/final-weather-375-full.png) · [390 fold](../../../prototype/final/screenshots/after/final-weather-390-fold.png) · [390 full](../../../prototype/final/screenshots/after/final-weather-390-full.png) · [414 fold](../../../prototype/final/screenshots/after/final-weather-414-fold.png) · [414 full](../../../prototype/final/screenshots/after/final-weather-414-full.png)
- 状态：[24h](../../../prototype/final/screenshots/after/final-weather-24h-390.png) · [r3 375](../../../prototype/final/screenshots/after/final-weather-r3-375.png) · [无数据](../../../prototype/final/screenshots/after/final-weather-nodata-390.png) · [选中时段 r3](../../../prototype/final/screenshots/states/weather-selected-r3-390.png)

**仍未达到理想**：
- 375 已把完整图表 + 图例放进首屏（272–601），但选中时段详情从 613 开始，仍需轻滚；这是本轮保留的取舍。
- 紧凑图字号 8–9px；在 390/414 可读；正式小程序应使用 canvas 按 DPR 绘制，或在 375 评估 24h 默认。
- 模拟天气没有真实观测/雷达/预警；生产必须接入 Open-Meteo，并保留数据源、更新时间、海拔来源、降级策略。
- 云底/能见度是模拟派生；正式产品需要 `sky.js` 阈值与 `cloudBase/top` 数据，不能沿用本页的线性估算。
- 天气页没有实现“生成天气提醒草稿”（真实产品组织者能力）；本轮不展示未完成的操作。

---

## 5. 状态覆盖矩阵

| 页面 | 已覆盖状态 | 证据 |
|---|---|---|
| 发现 | 默认、搜索命中、搜索无结果、已结束筛选、过去组展开、加载/错误/空态（代码） | 截图 + `dom-check-final` D1–D8 |
| 详情 | 未报名、待审核、已确认、候补、已取消报名、报名关闭、活动取消、已归档、组织者 | 8 张状态截图 + DT1–DT9 |
| 协作 | 行前、集合、同行、返程、归档；组织者、协作、车长；名单/车辆/现场；审核/分车/签到/到家/异常/发车 | 状态截图 + C1–C22 + S1–S11 |
| 天气 | 默认 r2、r3、24h、48h、选时、关键时段、无数据、加载/错误（代码） | 截图 + W1–W11 |

未覆盖（明确）：
- 详情拒绝态已在事务链中出现，但没有独立 lab 快照；`removed` 未实现。
- 协作同行组拆组、司机换人、车辆删除、敏感资料按用途查看。
- 天气 7 日/72h、实况/雷达/预警、组织者天气提醒草稿。
- 微信开发者工具/物理真机、弱网、字体回落、safe-area；移动设备仿真不能替代真机。

---

## 6. 视觉工艺逐项检查

### 6.1 字体与排版
- 衬线只用于活动/主推标题（24px / 21px）；页面标题、区块标题、数据、按钮全部无衬线；数字 tabular。
- 发现索引标题 13.5px；长标题拆 `2 日` 标签；路线/事实 10–10.5px；不再出现「明晚 出发」第三行。
- 详情正文 11–15px；行程时间 11.5px；状态条 13px 标题 + 11.5px 正文；对比度足够。
- 天气图表文字：标准 8.5/7.5px，375 紧凑 8.8/8px；正文 9–12px；已修 09:59 → 10:00、`云中 0.9` → `云中 0.9 km`。

### 6.2 间距与对齐
- 4px 基元；页边距 20/18/22；区块 28；事实格 4 等分；名单行 9px 上下；车辆/座位只在需要时展开。
- 底部行动条与页面内容：full 截图确认最后内容在行动条之前；375 行动条 509–603，内容可滚动。
- 协作首屏任务 329–387；名单头 736；没有“任务在 2585px”的断层。

### 6.3 图像
- 主活动使用 AI 生成青城后山石阶林径（明确标注，非活动实拍）；其余 Unsplash 氛围图；缩略图 4:3 + focus。
- 同一张图不在短距离内重复；主推只在主卡出现。
- Hero 16:9 通栏；详情图下纸面；不再白卡叠压。

### 6.4 颜色与状态
- 纸白/松绿/陶土：陶土只给紧迫、风险、未处理；天气用雨蓝。
- 状态词 + 形状；已结束/已取消/已归档用弱化色；没有多种高饱和色竞争。
- 名额：`余位 N / capacity`；pending 占位；候补不占正式名额；跨页同源。

### 6.5 组件与容器
- 页面主体只使用通栏图、纸面文字、发丝线、名单行；没有把每个区块做成卡片。
- 容器只在弹层、车辆块、座位图、表单、搜索框；没有阴影（弹层除外）。
- 点击元素都有结果：审核通过/拒绝、分车、签到、到家、异常处理、发车、阶段推进、报名提交、搜索/筛选、节点切换、图表选时、返回。
- 已删除“整卡按钮包按钮”“每行查看”等假动作。

### 6.6 图表与复杂信息
- 路线图：坐标来自 `routePoints`，标注“路线示意 · 非导航”；点选节点联动剖面；无 track 不画导航。
- 天气图：云底/海拔、降水、气温、风四层；单位、图例、活动窗口、关键时段、选中标注完整；48h 标签每 6h，不拥挤。
- 无数据：不插值；显示范围与回退入口。
- 375：图表需滚动、字号偏小；已登记为遗留问题。

---

## 7. 跨页一致性证据

| 事实 | 发现 | 详情 | 协作 | 天气 | 来源 |
|---|---|---|---|---|---|
| 活动名 | 青城后山 · 飞泉沟轻徒步 | 同 | 同 | 同 | `data.js FEATURED` |
| 路线 | 泰安古镇 · 飞泉沟 · 白云索道下站 | 同 | 同 | 同 | 同 |
| 距离/爬升 | 12.8 km / 680 m | 同 | 同 | 12.8 km / 680 m | 同 |
| 出发/集合 | 明天 07:00 茶店子 | 10/24 07:00 茶店子 | 10/24 07:00 茶店子 | 活动日 07:00–18:00 | 同 |
| 费用 | ¥168 | ¥168 / 人 | 不展示 | 不展示 | 同 |
| 名额 | 18 已确认 · 3 待审核 · 余位 3/24 | 同 | 18/24 · 3 待审核 · 1 未分车 | 不展示 | 同 |
| 领队 | 陈屿 | 陈屿 | 陈屿 | 不展示 | 同 |
| 路线点 | 不展示 | 3 点 | 现场节点 | 3 点同名同序 | 同 |
| 天气 | 一句话风险摘要 | 活动日天气入口 | 不展示 | 完整模拟预报 | 同 |

自动化校验：`scenario-check-final.mjs` X1–X10 + S12–S24 全部通过；主回归 56/56、事务链 39/39、触控 49/49；12 个页面/视口组合 0 横向溢出、0 console error。报名/审核/取消后，发现、详情、协作的计数同步变化，不再停留在快照口径。

---

## 8. 仍未达到理想完成度（必须保留）

1. **375 天气图表已完整进入首屏**（272–601），但选中时段详情从 613 开始仍需轻滚；紧凑图字号 8–9px。下一轮应评估 canvas DPR 或 24h 默认，而不是继续压首页。
2. **本地事务层不是后端**。状态在内存中，刷新页面回到初始快照；没有并发、幂等、审计、服务端权限。生产必须映射到真实命令并由服务端事务/门槛最终裁决。
3. **非主活动只有索引/通用详情**；路线、天气、协作的完整演示只对青城后山。设计规范要求所有活动具备 routeSnapshot/pickup/point ele/weather 数据，否则这些模块应显式降级，而不是复用主活动数据。
4. **天气是模拟数据**：没有真实观测/雷达/预警；生产接入 Open-Meteo 后，必须保留数据源、更新时间、海拔来源、缓存降级、限制说明。
5. **主图是 AI 生成氛围图**（1280×853 / 约 265KB），不是活动实拍；生产替换为真实路线照片并压到主包预算。
6. **已做 Chromium 移动设备仿真（iPhone SE/13/11 Pro Max/Pixel 5，49/49）**：触控路径、键盘焦点、触控目标审计通过（无 <24px）；但未做微信开发者工具/物理真机，safe-area、字体回落、软键盘、长名单性能仍需真机验证。次要目标 30–34px，生产建议放大到 40–44px 或扩大热区。
7. **没有自动化无障碍审计**：已做焦点可见、标签、结构与手动对比度检查；没有 axe/读屏测试。
8. **阶段控制台的下拉可直达任意阶段**：这是实验控制，产品内只能通过门槛弹层推进；验收时已用门槛链路覆盖。
9. **地图是数据驱动的示意 SVG，不是真实地图瓦片/导航**；生产使用真实地图组件，路线点与集合点仍需保持同名同序。
10. **详情页 3019px 较长**：首屏决策密度已提升，但正式小程序需要验证返回滚动定位、锚点导航与长页性能。

---

## 9. 证据索引

| 内容 | 路径 |
|---|---|
| 产品信息架构审计 | [00-product-information-audit.md](./00-product-information-audit.md) |
| 四页设计审计 | [01-design-audit.md](./01-design-audit.md) |
| 设计系统 | [03-design-system.md](./03-design-system.md) |
| 最终报告 | [06-final-report.md](./06-final-report.md) |
| 页面规格 | [04-page-specifications.md](./04-page-specifications.md) |
| 生产交接 | [05-production-handoff.md](./05-production-handoff.md) |
| Round 4 基线测量 | `prototype/final/evidence/baseline-measure.json` |
| Final 测量 | `prototype/final/evidence/final-measure.json` |
| 修改前截图 | `prototype/final/screenshots/before/` |
| 修改后截图 | `prototype/final/screenshots/after/` |
| 设备仿真截图 | `prototype/final/screenshots/device/` |
| 关键交互截图 | `prototype/final/screenshots/states/` |
| 前后对照图 | `prototype/final/screenshots/compare/` |
| 主回归 | `prototype/tools/dom-check-final.mjs`（56/56） |
| 阶段/一致性回归 | `prototype/tools/scenario-check-final.mjs`（39/39） |
| 测量脚本 | `prototype/tools/measure-final.mjs` |
| 触控验收 | `prototype/tools/touch-check-final.mjs`（49/49） |
| 375 天气/事务/设备补充 | [07-transaction-and-device-validation.md](./07-transaction-and-device-validation.md) |
| 截图脚本 | `prototype/tools/shot-final.mjs` |
| 对照图脚本 | `prototype/tools/compare-final.mjs` |
