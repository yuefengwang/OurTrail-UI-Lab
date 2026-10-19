# Baseline 现状审计 — OurTrail Visual Direction Lab

> Phase 0 交付物。审计对象：生产仓库 `D:\OurTrail`（**只读**）。审计时间：2026-10-17。
> 本文件由 `_audit-notes.md`（工作笔记）提炼并扩展；结论均有实测/文档证据，来源逐节标注。

---

## 0. 实验隔离决策（先于一切结论）

生产仓库工作区**不可用于实验**：存在**进行中的合并**（`MERGE_HEAD = e0d3c9f7`，两处 `UU` 冲突文件未解决）且**多个 Agent 在途**（储存库多处并发痕迹、两个历史 worktree）。
按任务 §1.2 的隔离要求：**不覆盖、不清理、不重置**；实验完全隔离在独立目录 `D:\OurTrail-UI-Lab`，与生产仓库**不共享任何文件**，全程**零写入**。

## 1. 仓库与 Git 基线（实测 2026-10-17）

| 项 | 实测值 |
|---|---|
| 仓库路径 | `D:\OurTrail`（只读；非当前工作目录） |
| 分支 | `master`，ahead of origin/master by 1 |
| HEAD | `04b6ad9` test(gates): 修 E-05 变异仪的锚点匹配 |
| **未完成合并** | `MERGE_HEAD = e0d3c9f7`；`UU` 文件：`.agents/skills/ourtrail-ui/references/design-system.md`、`SYNC.md` — **不可触碰** |
| 已 staged | skill uplift 一批（`SKILL.md`、`audit-verification.md`、`ui-methodology.md`、`AGENTS.md`、`miniprogram/AGENTS.md`、`docs/skill-uplift/*` 等） |
| 未 staged | `miniprogram/pages/route/route.wxml`、`tools/b4-e05-checklabel-test.js`（他人在途） |
| 未跟踪 | `.idea/` |
| 并发痕迹 | `.agents/`、`.omo/`、`.superpowers/`、`.zcode/`；历史 worktree `d:/OurTrail-ui`、`d:/OurTrail-skill-uplift` |
| 处置 | 不 fetch / 不 push / 不建分支（实验室非 git 仓库）；隔离实施 |

**既有工具链**（本轮直接复用的验证能力，任务 §7 要求先识别现有测试体系）：
`node tools/check.js`、`node tools/check-handlers.js` + 90+ 套 `tools/*-test.js`；
微信开发者工具 CLI（服务端口 33278、自动化端口 9420，miniprogram-automator 驱动）。

## 2. 项目结构与页面清单

### 2.1 技术形态

- 客户端：原生微信小程序（WXML/WXSS/CommonJS），**20 页**、**13 组件目录**（12 在用 + `privacy-popup` 死代码）+ `custom-tab-bar/`；**零 npm 依赖**。
- 后端：单一云函数 `cloudfunctions/trailApi`（14 action × 42 命令）；16 个 `ot_*` 集合。
- 设计系统唯一源头：`miniprogram/app.wxss`（40 个 CSS 自定义属性 = 29 色 + 11 数值）+ `.agents/skills/ourtrail-ui/`。

### 2.2 页面清单（LOC 实测自 `miniprogram/AGENTS.md`）

| 页面 | LOC | 角色/任务 | tab | 与实验室页面的映射 |
|---|---|---|---|---|
| home | 157 | 活动入口：我的活动/协作任务/筛选搜索 | ✓ 活动 | （后续批次） |
| weather-hub | 279 | 天气模块入口（V2.0） | ✓ 天气 | 天气（辅助） |
| notices | 7（工厂） | 通知 | ✓ 通知 | — |
| me | 221 | 我的：资料/最近活动/路线库/协作码/授权 | ✓ 我的 | （后续批次） |
| activity | 548 | 活动详情（视觉标杆：hero-cover + 分区体系） | | **详情** |
| discover | 95 | 发现已发布活动 + 搜索 | | **发现** |
| signup | 352 | 报名（分步 + sticky 提交） | | （未逐页重构） |
| editor | 798 | 创建/编辑活动（分步 + sticky 操作） | | （未逐页重构） |
| workspace | 159 | 领队工作台（总览/名单/分车/现场） | | **协作** |
| staff | 10 | 零事件薄壳 → field-panel perspective=staff | | 协作（现场视角） |
| vehicle | 156 | 车长任务（本车名单/座位） | | 协作（分车视角） |
| weather | 465 | 山地天气详情（meteogram/space-time） | | **天气** |
| weather-chart | 120 | 横屏图表（chart-store 单例） | | 天气（图表） |
| route | 349 | 单条路线详情（hero-cover） | | （未逐页重构） |
| routes | 61 | 路线库列表 | | （未逐页重构） |
| route-edit | 393 | 路线编辑 | | （未逐页重构） |
| anotices | 7（工厂） | 活动通知 | | — |
| privacy | 1 | 隐私政策 | | — |
| lab | 142 | 开发者预演页（DEV_ONLY） | | — |
| cloud-field-poc | 192 | POC（DEV_ONLY，非业务页） | | — |

**弹层**：overlay sheet/dialog（activity 同行人操作、workspace 阶段确认、me 编辑面）

### 2.3 组件清单（13 目录）

| 组件 | LOC | 类型 | 关键机制 |
|---|---|---|---|
| roster-panel | 385 | 业务面板 | 自取数据（attached + observer + sync-key 失效） |
| transport-panel | 461 | 业务面板 | 分车 + 座位图 |
| field-panel | 245 | 业务面板 | 现场/签到 |
| icon | 121 | 基础 | SVG data-URI（唯一叶子） |
| overlay | — | 基础 | sheet/dialog |
| status-panel | — | 基础 | denied/loading/empty/error **四态** |
| form-field | — | 基础 | 表单 |
| person-row | — | 展示 | 人员行 |
| activity-card | — | 展示 | 活动卡（`.activity-card__title` + `<article bindtap>` 为 e2e 钉点） |
| meteogram | 719+132 | 图表 | 山地气象图 |
| space-time | 492+466 | 图表 | 时空图 |
| roam-scrubber | 129 | 图表 | 时间拖动器 |
| custom-tab-bar | — | 导航 | 与 components/ 同级，样式自包含 |

**座位图硬规则**：每排 4 座 + 1 过道（16px 固定），座位宽 `calc((100% - 48px)/4)`。

## 3. 当前设计系统（2026-10-16「户外编辑式」重构后）

- **方向**：户外编辑式（品牌）× Strava 式活动表达 × AllTrails 式户外信息 × 高效协作交互。
- **Token 锚**：`--forest #163E35`（品牌锚，只做品牌动作与 hero 压底）、`--paper #F6F3EC`（暖纸面）、`--stone #EDE9DE`、`--leaf #D6EA8A`、语义色 danger/warning/info/success + `-soft`；`--scrim-hero/--scrim-top` 压字渐变。
- **字号体系**：`.display 30`、`.page-title 28`、`.section-title 16`、`.lede 15`、`.kicker 11/+1.2px`、正文 `14`、`.small 12`；指标 `.metric-value 26px` 封顶。
- **尺寸纪律**：圆角 tag 5 / button 8 / card 14 / sheet 20；触控 44 / 操作 48；区块间距 28；**阴影只留浮层，内容面零阴影**；分隔一律 1px 发丝线。
- **图片策略**：9 张 Unsplash 授权实景（`assets/photos/`，520KB，720×450），按活动 id 稳定散列（`utils/covers.js`）；**是场景氛围图不是活动实拍**（活动模型无图片字段），页脚诚实性脚注；失败回退森林绿 hero。

## 4. 当前 UI 问题清单（Demo 化诊断与残余问题）

> 任务 §2.3 要求逐项检查但不预设。以下按「已解决 / 仍存在 / 待验证」三态如实记录，来源：上轮重构报告（`docs/ui-ux-redesign/2026-10-16-redesign-report.md` §B.3/A.4/G）+ 本实验室审计笔记。

### 4.1 已在上一轮修复（历史 Demo 化问题，供追溯）

1. 活动详情首屏「深绿纯色块 + SVG 等高线装饰」——Demo 感主要来源（已替换为实景封面 + 编辑式层级）。
2. 列表是同质化「文字卡墙」（已改为照片引导的编辑式列表）。
3. 长页无章节感、区块 16px 等距堆叠（已引入眉题体系与 28px 区块节奏）。
4. 靠卡片背景分组而非发丝线分隔；阴影/圆角偏「管理后台」感（已收敛）。
5. 工作台指标裸露、与正文无分组（已收进石色带 + 发丝线三格）。
6. 「我的」页高频/低频功能视觉权重相同（已调整）。

### 4.2 仍存在 / 未覆盖（上轮明确遗留）

1. **逐页重构未全覆盖**：`signup`、`editor`、`routes`、`route`、`route-edit` 仅继承 token，未逐页重构（报名与编辑是转化关键路径）。
2. **天气页只做 token 级对齐**：算法/图表/数据零改动；信息层级编辑化未做（须先冻结 weather-page-test 189 条读数）。
3. **staff / vehicle 未深度对齐**：结构被 trip2/golden-path 门禁钉死，要改需先补测试（建议单独一轮）。
4. **真活动封面缺 schema**：活动模型无图片字段，「氛围图 + 脚注」是诚实下限；升级需服务端加字段（须走 ADR）。
5. **小屏（≤375px）未验证**：自动化通道无法切换模拟器机型。
6. **一处待裁决分歧**：weather-hub「分区头 vs 卡片头」表达未定。

### 4.3 方向性未决问题（本实验室存在的理由）

- 现行「户外编辑式」是否为终局？五套方向实验（A 是现行方向的更彻底推进，B/C/D/E 是实质替代组织哲学）就是为回答此问题而建。
- 现有结构性问题（如组件重复、样式覆盖、硬编码残留）已由「app.wxss 单一源头 + token 纪律 + UI skill 登记制」治理，实验室不再重复普查。

## 5. 业务逻辑与生产代码保护清单（任务 §7 修订版）

后续任何视觉实施（含本实验的迁移规划）必须保护：

| 保护面 | 具体对象 |
|---|---|
| 页面路由与注册 | `app.json` 20 页 + `custom-tab-bar`；e2e 钉点（`activity-card__title`、`<article bindtap>`） |
| 身份与授权 | 授权流程、`privacy-popup`（死代码但不动） |
| 活动流程 | 创建/报名/加入/退出（signup/editor 命令链） |
| 成员/领队/状态 | 成员与领队模型、活动阶段（journey 词表、gathering 等） |
| 车辆与座位 | 座位图硬规则（4 座 + 16px 过道；`calc((100%-48px)/4)`）、transport-panel 契约 |
| 位置/天气契约 | 天气算法、图表色板、数据流、切窗/日卡交互 |
| 表单与状态反馈 | 校验、权限限制、错误反馈、禁用态、status-panel 四态 |
| 测试与并发 | 现有门禁读数、他人在途文件（route.wxml / b4-e05 等）零触碰 |
| 后端 | `cloudfunctions/trailApi` 零改动；16 个 `ot_*` 集合契约不变 |

## 6. 实验环境与运行方式

| 项 | 值 |
|---|---|
| 实验室目录 | `D:\OurTrail-UI-Lab`（独立目录，非 git 仓库，与生产零共享） |
| 工具链 | Node v24.19.0 / npm 11.17.0；`prototype/` 内 `playwright@1.63.0`（headless chromium）——实验室内唯一 npm 依赖 |
| 照片素材 | 自 `D:\OurTrail\miniprogram\assets\photos\` **复制**（非移动）到 `prototype/assets/photos/`（Unsplash 授权，含来源 README） |
| 静态服务器 | `prototype/tools/serve.mjs`（零依赖，默认端口 4173） |
| 截图驱动 | `prototype/tools/capture.mjs`（矩阵/过滤/状态/对照表；见 README.md §4） |
| 运行与查看 | 见 `README.md`（入口参数、切换、对照表、截图配方） |

## 7. 当前测试基线及其已知限制（任务 §2.4 要求）

以下为生产仓库基线（2026-10-16 全量重跑实测，`docs/ui-ux-redesign/evidence/`）：

- **无头套件**：77 套 `*-test.js` 逐套跑 → **73 套 exit 0 / 4 套非绿** = 3 套设备套件无会话（exit 2，INCONCLUSIVE）+ 1 套天气线常驻非确定性红 `outdoor-intelligence-ui`（46/1，AGENTS.md 登记在册）。
- **check.js / check-handlers.js**：exit 0（含新 handler 与相对 require 全解析）。
- **e2e-golden-path**：`passed=12 failed=2 unverified=2`，与 AGENTS.md 登记的存量 **GP-01（NO_REVISION）** 一致（先于本轮存在，未擅动）。
- **已知限制**：
  1. 自动化通道**无法切换模拟器机型** ⇒ 小屏（≤375px）渲染记 UNVERIFIED。
  2. 驱动会话可能 Wedged（假红形态：控制组正常 + 其余页 `data()` 空 + 空白截图）⇒ playbook §3 重启处置，**不改产品**。
  3. **绝对定位 + 百分比高的 `<image>` 在部分基础库不绘制** ⇒ 封面一律「定高媒体盒 + 文档流 image」。
  4. 本实验室的 Web 原型验证**不能替代**微信小程序真机验收。

## 8. 审计结论

- 生产代码当前处于「编辑式方向 + 严格 token 纪律」的健康状态；本轮实验的问题不是「修 Demo 化」，而是回答「**哪个视觉方向值得作为下一阶段的统一语言**」。
- 实验隔离完整（零写入、零依赖泄漏、零门禁触碰）；原型与证据链就绪，评审见 `evaluation.md`。
