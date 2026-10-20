# 07 · 375 天气布局、报名事务化与触控设备验收

> 本轮在 Final Pass 基础上继续推进的三件事：
> 1. 375 天气专用布局：完整图表进入首屏。
> 2. 报名/名单本地事务化：报名进入名单、审核回详情、取消释放名额。
> 3. 移动设备仿真与触控验收：iPhone SE / 13 / 11 Pro Max / Pixel 5。
>
> 分支：`final-pass`；改动未提交、未 push。
> 复验：主回归 **56/56**、事务/一致性 **39/39**、触控 **49/49**。

---

## 1. 375 天气：图表完整进入首屏

### 1.1 问题

上一版 375 天气页：hero 213 + points 44 + chart 375，图表底 704 > 页面可用高 603；用户只能看到云底/降水/气温上半段，关键时段与图例被截。

### 1.2 改动

- 新增 `weather-chart.js`，支持 `compact` 布局：
  - viewBox 高 286 → 246；三车道（云底/降水/气温）压缩；字号提升到 8.8 / 8（标准 8.5 / 7.5）。
  - 375 不画第四层风箭头；风改由选中详情与路线对比承载，图例显示“风见选中详情”。
  - 活动窗口、关键时段、选中小时、x 轴 6h 标签保留。
- 375 首屏：隐藏 hero 的路线/距离 facts 行（详情页仍有完整距离/爬升）与 summary 的第二行说明（顶部仍有“模拟预报”徽标，底部数据说明仍常驻）；压缩 summary/point/chart 间距。
- 标准 390/414 保持原图表（含风箭头与完整 hero）。

### 1.3 实测

| 视口 | 页面可用高 | 图表 top–bottom | 结果 |
|---|---:|---|---|
| 375 | 603 | **272–601** | 完整图表 + 图例进入首屏 |
| 390 | 780 | 355–740 | 完整 |
| 414 | 832 | 355–757 | 完整 |

375 选中时段从 613 开始，需轻滚；这是本轮保留的取舍：优先保证“整张趋势图可读”，而不是塞进详情。

### 1.4 取舍

- 375 隐藏 hero facts（12.8 km / 680 m）与 summary 说明第二行；活动身份、路线点、活动窗口、模拟徽标仍在首屏。距离/爬升在详情页和图表副标题的上下文里可查。
- 375 图表不含风箭头；风在选中详情（风/阵风）与路线对比中出现。
- 图表仍为模拟数据，未接入真实 Open-Meteo。

证据：
- [375 fold](../../../prototype/final/screenshots/after/final-weather-375-fold.png)
- [375 mid](../../../prototype/final/screenshots/after/final-weather-375-mid.png)
- [375 full](../../../prototype/final/screenshots/after/final-weather-375-full.png)
- `prototype/final/evidence/final-measure.json`

---

## 2. 报名/名单本地事务化

### 2.1 之前的问题

报名提交只切换了详情页视觉状态，没有把“你”写回协作名单；待审核计数仍是快照口径。审核/分车/签到等动作直接改 Set，没有统一不变量。

### 2.2 现在的事务层

`prototype/final/js/store.js` 维护会话状态；`data.js scenario()` 把 `viewerSignup` 合并进名单；详情/协作/发现共用同一份状态。

**动作与不变量**

| 动作 | 校验 | 结果 |
|---|---|---|
| `signup.submit` | 行前准备、未截止、未重复、有名额 | 写入 viewer pending（manual）或 confirmed（automatic）；名单 +1、余位 −1 |
| `signup.update` | 报名存在且 pending/confirmed、仍在行前 | 更新姓名/出行；改上车点清空座位 |
| `signup.cancel` | pending/confirmed/waitlisted、published/gathering、无签到/上车/到家事实 | viewer cancelled；释放名额 |
| `signup.audit` | 仅 published、仅 pending | viewer/base：confirmed 或 rejected；待审核 −1 |
| `transport.assign` | confirmed、shared、车辆覆盖上车点、空位、未发车 | 写入车辆/座位；司机不占乘客座 |
| `attendance.checkin` | gathering、confirmed、未签 | 写签到；不碰上车 |
| `transport.board` | gathering、已签到、本车、未发车 | 写上车；未签到不能上车 |
| `transport.depart` | gathering、未发车 | 记录发车；允许点清缺口但返回缺口数 |
| `attendance.home` | closing、confirmed、joined、依据+授权 | 写到家；协调中不能代确认 |
| `incident.resolve` | active/closing、未解决、有依据 | 解决异常；协调中成员恢复 joined |
| `activity.advance` | 只能下一阶段；pending/签到/分车/异常/到家门槛 | 通过才允许 UI 推进 |

**关键修复**：异常解决后，`m15 罗壹` 从 `coordinating` 恢复 `joined`；在此之前不能代确认到家。这个规则由 `scenario` 和 `store.home` 双重校验。

### 2.3 跨页事务证据（自动化）

| 编号 | 断言 | 结果 |
|---|---|---|
| S12/S13 | 详情提交后：待审核 4、余位 2、会话 pending | PASS |
| S14/S15 | 协作名单出现“沈岚”、统计为 4 待审核 | PASS |
| S16/S17 | 组织者审核通过：会话 confirmed、待审核 3 | PASS |
| S18/S19 | 回详情：名额已确认、19 人已确认 | PASS |
| S19b | 发现页主推：19 已确认 / 3 待审核 / 余位 2 | PASS |
| S20/S21 | 取消报名：详情只读、会话 cancelled | PASS |
| S22/S23 | 协作名单移除、待审核回到 3 | PASS |
| S24 | 发现页回到 18 已确认 / 3 待审核 / 余位 3 | PASS |

截图：
- [沈岚待审核 · 协作首屏](../../../prototype/final/screenshots/states/collab-session-pending-390.png)
- [沈岚待审核 · 名单行](../../../prototype/final/screenshots/states/collab-session-pending-row-390.png)
- [审核通过 · 协作](../../../prototype/final/screenshots/states/collab-session-approved-390.png)
- [审核通过 · 名单行](../../../prototype/final/screenshots/states/collab-session-approved-row-390.png)
- [审核通过 · 详情](../../../prototype/final/screenshots/states/detail-session-confirmed-390.png)
- [审核通过 · 发现页](../../../prototype/final/screenshots/states/discover-session-approved-390.png)
- [提交后 · 详情](../../../prototype/final/screenshots/states/detail-session-pending-390.png)

### 2.4 仍然是“本地事务”，不是后端

- 状态在内存中，刷新页面回到初始快照。
- 没有服务端并发、幂等、审计日志、权限校验；真实产品必须映射到 `signup.submit/review/promote/cancel`、`transport.assign`、`field.*`、`activity.advance` 等命令，并由服务端事务/门槛最终裁决。
- 本地 `log` 只是演示证据，不是审计日志。
- 生产不能把“客户端已确认”当作事实；所有写操作必须服务端复核。

---

## 3. 触控设备仿真验收

### 3.1 矩阵

| 设备 | 视口 | 结果 |
|---|---|---|
| iPhone SE | 375×667 | 加载/触控/键盘焦点通过 |
| iPhone 13 | 390×844 | 加载/触控通过 |
| iPhone 11 Pro Max | 414×896 | 加载/触控通过 |
| Pixel 5 | 393×851（vp=390） | 加载/触控通过 |

- 使用 Playwright `devices` 描述符（`isMobile: true`、`hasTouch: true`、DPR/UA），不是物理真机。
- 触控路径：发现→详情、协作任务、天气切点；全部通过。
- 键盘焦点：iPhone SE 发现页 Tab 后焦点在 hero 媒体按钮，2px 实线焦点可见。

### 3.2 触控目标审计

- 4 个设备 × 4 页：**无任何可见交互元素 < 24px**。
- 主操作 48px；appbar 图标 40px；sheet 关闭 36px；协作行操作 32px；筛选项 30px；任务动作 34px；天气 48h/24h 32px；地图点命中区 28–36px（另有 44px 节点行作为等价入口）。
- 仍低于 40px 的紧凑目标：发现标题链接（36px 高）、搜索按钮 38px、页签 32px、协作搜索输入 34px、协作筛选项 30px、天气范围切换 32px。它们都是宽目标或补充入口，未出现 <24px；生产建议进一步放大到 40–44px 或扩大热区。
- 设备截图：`prototype/final/screenshots/device/`（4 个设备 × 发现/详情/协作/天气）。

### 3.3 未完成的真机项

- 未运行微信开发者工具/物理 iOS/Android；Chromium 设备仿真不能替代真机。
- `env(safe-area-inset-*)`、微信胶囊避让、字体回落、软键盘避让、长名单滚动性能仍需真机验证。
- 触控审计基于 DOM 尺寸，不包含系统级手势/滚动冲突。

---

## 4. 本轮验证汇总

| 脚本 | 结果 | 覆盖 |
|---|---|---|
| `dom-check-final.mjs` | **56 / 56** | 四页、状态、搜索/筛选、报名提交计数、审核/分车/签到/到家/发车、天气 |
| `scenario-check-final.mjs` | **39 / 39** | 阶段推进、事务链、取消释放、发现/详情/协作/天气一致性、返回路径 |
| `touch-check-final.mjs` | **49 / 49** | 4 设备、触控路径、键盘焦点、触控目标审计 |
| `measure-final.mjs` | 12/12 无横向溢出、0 console error | 375/390/414 |

关键测量（当前）：
- 发现 375 CTA 423–471；首行 587–658（页面 603，露出 16px）。
- 天气 375 图表 272–601（完整）；选中详情 613 起。
- 协作 375 首任务 329–387；首名成员 733（需滚动，任务动作可直达面板）。
- 详情 375 底部行动条 509–603；页面 3016。

---

## 5. 仍需保留的风险

1. 本地事务不是后端：刷新重置，无并发/幂等/审计；生产必须接真实命令。
2. 375 天气选中详情仍在首屏下方；图表字号 8–9px；生产建议 canvas DPR 或 24h 默认再评估。
3. 非主活动只有索引/通用详情；路线/天气/协作完整演示仍只对青城后山。
4. 天气是模拟；主图是 AI 占位；真实数据/图片需替换。
5. 未做微信开发者工具/物理真机；safe-area/字体/键盘未验证。
6. 协作只做主链路：同行组整组同车、司机换人、车辆删除、预留位、敏感资料按用途查看仍未实现。
7. 无障碍只做手动焦点/标签/对比度；无 axe/读屏自动化。

---

## 6. 复现

```powershell
cd prototype
node tools/serve.mjs 4176
node tools/dom-check-final.mjs        # 56/56
node tools/scenario-check-final.mjs   # 39/39
node tools/touch-check-final.mjs      # 49/49
node tools/measure-final.mjs
node tools/shot-final.mjs
node tools/compare-final.mjs
```

> 本文件是 02/06 的补充证据；最终判定仍以 06 的六问报告为准。
