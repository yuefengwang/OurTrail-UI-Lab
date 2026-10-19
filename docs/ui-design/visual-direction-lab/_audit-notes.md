# 审计工作笔记（临时）— Phase 0 in progress

> 本文件是 Visual Direction Lab 的内部工作笔记，最终会被提炼进 `baseline.md`。
> 审计对象为只读：`D:\OurTrail`（任何写入均被禁止）。

## 1. 源仓库基线与并发状态（实测 2026-10-17）

| 项 | 实测值 |
|---|---|
| 仓库路径 | `D:\OurTrail`（非工作目录，只读访问） |
| 分支 | `master`，ahead of origin/master by 1 |
| HEAD | `04b6ad9` test(gates): 修 E-05 变异仪的锚点匹配 |
| **合并冲突（进行中）** | `MERGE_HEAD = e0d3c9f7`；`UU` 文件：`.agents/skills/ourtrail-ui/references/design-system.md`、`SYNC.md`（**未完成合并，不可触碰**） |
| 已 staged | skill uplift 一批（SKILL.md、audit-verification.md、ui-methodology.md、AGENTS.md、miniprogram/AGENTS.md、docs/skill-uplift/* 等） |
| 未 staged | `miniprogram/pages/route/route.wxml`、`tools/b4-e05-checklabel-test.js`（他人在途） |
| 未跟踪 | `.idea/` |
| 并发痕迹 | `.agents/`、`.omo/`、`.superpowers/`、`.zcode/`；历史报告提到 worktree `d:/OurTrail-ui`、`d:/OurTrail-skill-uplift` |
| 结论 | **工作区不可用于实验**：活跃合并 + 多个 agent 在途。实验完全隔离在 `D:\OurTrail-UI-Lab`（本目录）。 |

## 2. 项目结构（来自 AGENTS.md + 实测）

- 客户端：原生微信小程序（WXML/WXSS/CommonJS），**20 页**，**13 组件目录**（12 在用 + privacy-popup 死代码）+ `custom-tab-bar/`；零 npm 依赖。
- 后端：单一云函数 `cloudfunctions/trailApi`（14 action × 42 命令）；16 个 `ot_*` 集合。
- 设计系统唯一源头：`miniprogram/app.wxss`（40 CSS 自定义属性 = 29 色 + 11 数值）+ `.agents/skills/ourtrail-ui/`。
- 测试：`node tools/check.js`、`node tools/check-handlers.js` + 90+ 套 `tools/*-test.js`（AGENTS.md 记载 4498 断言快照；1 条天气线常驻非确定性红）。
- 真机验证：微信开发者工具 CLI（本机可用，服务端口 33278、自动化端口 9420）。

## 3. 页面清单（LOC 实测自 miniprogram/AGENTS.md，2026-10-13 复点）

| 页面 | LOC | 角色/任务 | tab |
|---|---|---|---|
| home | 157 | 活动入口：我的活动/协作任务/筛选搜索 | ✓ 活动 |
| weather-hub | 279 | 天气模块入口（V2.0） | ✓ 天气 |
| notices | 7（工厂） | 通知 | ✓ 通知 |
| me | 221 | 我的：资料/最近活动/路线库/协作码/授权 | ✓ 我的 |
| activity | 548 | 活动详情（视觉标杆：hero-cover + 分区体系） | |
| discover | 95 | 发现已发布活动 + 搜索 | |
| signup | 352 | 报名（分步 + sticky 提交） | |
| editor | 798 | 创建/编辑活动（分步 + sticky 操作） | |
| workspace | 159 | 领队工作台（总览/名单/分车/现场） | |
| staff | 10 | 零事件薄壳 → field-panel perspective=staff | |
| vehicle | 156 | 车长任务（本车名单/座位） | |
| weather | 465 | 山地天气详情（meteogram/space-time） | |
| weather-chart | 120 | 横屏图表（chart-store 单例） | |
| route | 349 | 单条路线详情（hero-cover） | |
| routes | 61 | 路线库列表 | |
| route-edit | 393 | 路线编辑 | |
| anotices | 7（工厂） | 活动通知 | |
| privacy | 1 | 隐私政策 | |
| lab | 142 | 开发者预演页（DEV_ONLY） | |
| cloud-field-poc | 192 | POC（DEV_ONLY，非业务页） | |

## 4. 组件（13 目录）

- 自取数据型业务面板（attached + observer + sync-key 失效机制）：`roster-panel`(385) 名单、`transport-panel`(461) 分车+座位图、`field-panel`(245) 现场/签到。
- 展示型：`icon`(121 SVG data-URI 唯一叶子)、`overlay`、`status-panel`（denied/loading/empty/error 四态）、`form-field`、`person-row`、`activity-card`。
- 图表：`meteogram`(719+132)、`space-time`(492+466)、`roam-scrubber`(129)。
- `custom-tab-bar/`（与 components/ 同级，样式自包含）。
- 座位图硬规则：每排 4 座 + 1 过道（16px 固定），座位宽 `calc((100% - 48px)/4)`。

## 5. 当前设计系统（2026-10-16 户外编辑式重构后）

- 方向：户外编辑式（品牌）× Strava 式活动表达 × AllTrails 式户外信息 × 高效协作交互。
- Token（app.wxss）：`--forest #163E35`（品牌锚，只做品牌动作与 hero 压底）、`--forest-deep #122E28`、`--leaf #D6EA8A`、`--paper #F6F3EC`（暖纸面，由 #F5F5F0 转暖）、`--stone #EDE9DE`、`--stone-line #DCD5C4`、`--line #DEE3DB`、`--ink #202A26`、`--muted #5F6E66`、语义色 danger #B43D3B / warning #8C5A12 / info #346583 / success #276145 + -soft 浅底；`--scrim-hero/--scrim-top` 渐变压底。
- 字号：`.display` 30/1.28/700/-0.4px、`.page-title` 28、`.section-title` 16/24/600、`.lede` 15/24、`.kicker` 11/16/600/+1.2px、正文 14/22、`.small` 12/18；指标 `.metric-value` 26px 封顶一屏一组。
- 尺寸：圆角 tag 5 / button 8 / card 14 / sheet 20；触控 44 / 操作 48；区块间距 28（`.stack-sections`）；阴影只留给浮层，内容面零阴影；分隔一律 1px 发丝线。
- 图片：9 张 Unsplash 授权实景（`assets/photos/`，520KB，720×450），按活动 id 稳定散列（`utils/covers.js`）；**是场景氛围图不是活动实拍**（活动模型无图片字段），页脚诚实性脚注；失败回退森林绿 hero。
- 已回顾限制：小屏（≤375px）真机未验证（自动化通道无法改视口，CDP 无效）；weather/weather-chart 只做 token 对齐（表达升级未做）；真活动封面需 schema 变更（须 ADR）。
- 两轮完成矩阵：19/20 业务页已完成编辑式重构（编辑器/报名/路线库也做了）；留下一处待裁决分歧（weather-hub 分区头 vs 卡片头）。

## 6. 视觉现状证据（可直接引用）

- `docs/ui-ux-redesign/screens/before|after|phase2/` — 390×844 真机截图（home/activity/discover/workspace/vehicle/staff/weather/me/notices/signup/editor/routes/route/privacy/lab 等）。
- `docs/ui-ux-redesign/2026-10-16-redesign-report.md` + `phase-2-implementation-report.md` + `design-system.md` — 本轮重构全过程与规范。
- `docs/weather-ux/qa/**` — 天气线大量真机 QA 截图（390px）。
- `docs/prototypes/ourtrail-app/tests/evidence/01-10*.png` — v1 原始设计交付截图（React 冻结规格）。
- v1 原始 token（`docs/prototypes/ourtrail-app/src/styles/tokens.css`）：与本轮演进一致（forest/leaf/paper/ink/muted/line + 4 语义色；space 4-32；radius 5/8/14/20；motion 180ms）。

## 7. 实验环境（已建）

- 实验室目录：`D:\OurTrail-UI-Lab`（用户指定；与生产仓库完全隔离，不共享任何文件）。
- 工具链：Node v24.19.0 / npm 11.17.0；`prototype/` 内已装 `playwright@1.63.0`（headless chromium shell 1243 命中本机缓存，`node tools/test-browser.mjs` 通过并产出截图）。
- 照片素材：已从 `D:\OurTrail\miniprogram\assets\photos\` **复制**（非移动）到 `prototype/assets/photos/`（Unsplash 授权，含来源 README）。
- 静态服务器：`prototype/tools/serve.mjs`（零依赖，端口 4173）。截图驱动：`prototype/tools/capture.mjs`。

## 8. 待补充（等待 4 个探索代理）

1. 页面逐页语义明细（字段/交互/共享组件/视觉问题/重构风险）— agent bg_0438ab5f
2. 组件与样式架构（token 全表、硬编码颜色普查、重复样式）— agent bg_b1c1cdc8
3. Demo 化问题取证（12 项候选逐一确认/证伪）— agent bg_30fc0c9b
4. 业务保护清单 + 三页语义 + SKILL.md 规则 — agent bg_167b2f0d
