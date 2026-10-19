# Round 3 设计复盘 — 胜出方案与设计语言

## 胜出方案：Hybrid Discovery（混合发现）「先看，再挑」

### 选型依据（四问证据）

| 维度 | Hybrid 混合发现 | Editorial 编辑特写 | Curated 策展索引 | 判断 |
|---|---|---|---|---|
| **首屏** | 刊头 + 主卡（全幅图 + 叠压信息板）可见，Hero CTA 在屏内；横滑轨落在第二屏 | 刊头 + 封面故事大图完整可见；工具行可用；但“编辑推荐/日历”需滚动 | 索引头 + 检索区 + 下一场带 + 2–3 行可见；密度最高、最可扫描 | **Hybrid** 胜：情感（全幅图）+ 功能（CTA）同屏完成 |
| **密度** | 两段节奏：发现区（疏朗）+ 接缝带 + 比较区（80px 行） | 三段节奏：封面（疏）> 推荐（中）> 日历（密，纯文字） | 全程统一 76px 栅格行；月份分组头；信息最密 | **Curated** 胜密度，**Hybrid** 次之（比较区同构） |
| **区分度** | 签名机制：24px 叠压信息板 + 真实 scroll-snap 横滑轨 + 石色 sticky 接缝带 | 叙事权重（封面>推荐>日历）；衬线大标题驱动层级 | 日期主轴索引；下一场出发带；无视觉叙事 | **Hybrid** 胜：三个新机制（叠压/横滑/接缝）都在本轮首现 |
| **迁移风险** | 构件可复用：Hero Panel、Seam Band、Section Head、Row Grid、Status/Seats 系统 | 封面故事结构对详情页有迁移性，但索引/列表模式弱 | 栅格行、日期轴、右列最适合协作页名单，但缺“重内容页”模式 | **Hybrid** 胜：四页面（发现/详情/协作/天气）均有对应模式 |

> **结论**：Hybrid 作为主方向。它在首屏同时解决“激发兴趣”（全幅图+叙述）与“可操作”（CTA+紧迫文案），接缝带把筛选/搜索锚定在手指可及处，比较区提供完整可扫描索引。三个新机制（叠压/横滑/吸顶）经实测（24px 叠压、rail 溢出 162px@390、边缘露边 22px、seam 吸顶触发阈值 0.5px）均在 WXSS 允许范围内。Editorial 的“默认去重/活跃查询完整集”过滤语义与 Curated 的“日期主轴 + 统一栅格”已吸收为设计语言规则。

---

## 设计语言规范（从 Hybrid 提炼，供 4 页共用）

### 1. 排版与节奏

| 概念 | 规则 | 来源 |
|---|---|---|
| **两段节奏** | 上半“发现/重内容”（疏朗、大图、叙述）；下半“比较/索引/协作”（密集、栅格、可扫描）。中间一次 **石色接缝带**（`var(--r3-surface-2)` + 双发丝线），含页内导航/筛选/搜索。 | Hybrid §结构 |
| **刊头** | kicker + 衬线 display + 日期（右） + 一行导语。底部发丝线。 | Hybrid `.hy-mast` |
| **区块标题** | `section-size` (16–17) + `section-weight` (600) + `section-lh` (1.4) + `kicker-ls` (1.4)；副计数用 caption/ink-2。 | Hybrid `.hy-week__k`、`.hy-month__k`、`.hy-seam__k` |
| **行高** | 重内容区：Hero Panel 内由内容撑开；索引/协作/天气行：**80px**（`min-height: 80px`，内边距 8px）。 | Hybrid `.hy-row` |
| **日期轴** | 宽 34px；大号日数字（section-size/weight/tabular）+ 星期（micro/ink-2）。≤36h 时补一行“距出发/明晚”陶土文案。 | Hybrid `.hy-row__date`、`.hy-row__now` |
| **缩略图** | 角色固定比例：Hero 16:9、组件/轨 4:3、行内 1:1。`var(--r3-radius-img)` 2px。 | Hybrid `:root` tokens、brief §3.4 |
| **右列** | 宽 60px；状态词（语义色点+词）+ 名额（tabular、陶土=紧张≤3）+ 领队/车长名（micro/ink-2）。 | Hybrid `.hy-row__side` |

### 2. 图片与压暗

| 规则 | 细节 |
|---|---|
| 比例锁定 | 同一角色三页面必须同比例；CSS 用 `aspect-ratio: var(--hy-hero-ratio)` / `4 / 3` / `1 / 1`。 |
| 压暗梯 | Hero 全幅图：`var(--r3-scrim)` + 底部 44%→76%→100% 线性渐变（`rgba(20,26,21,.52)`），保证白字 AA。 |
| Scrim 复用 | 详情页 Hero、天气页顶部图、协作页若有大图均复用同一梯度 token。 |

### 3. 组件与交互状态

| 组件 | 规范 | WXSS 纪律 |
|---|---|---|
| **Hero Panel** | 白底 + 发丝线，`margin-top: -24px` 叠压图片。内含：kicker、紧迫计数、衬线标题、路线、导语、事实带（icon+值+单位）、动作行（主按钮+状态词）。 | 无阴影、无 `backdrop-filter`、无嵌套。 |
| **横滑轨** | `display:flex; overflow-x:auto; scroll-snap-type:x mandatory; scroll-padding: 0 page-x`；卡片 160px、scroll-snap-align:start；右侧露边暗示；scroll 事件驱动“向左滑”→“N/M”切换。 | `scroll-snap`、`-webkit-overflow-scrolling:touch` 允许；无 `dvh`。 |
| **接缝带** | 石色通栏（`surface-2` + 双发丝线）；`position:sticky; top:0; z-index:20`；吸顶后下框线加重为 `ink-3`（无阴影）。内含：区块标题+副标题、计数、搜索框（touch 48）、下划线式页签（gap 16）。 | `sticky` 允许；无嵌套。 |
| **搜索框** | `height: var(--r3-touch)` (48px)；`surface` 底；`line-strong` 框；focus `brand` 框。 |  |
| **页签** | 下划线式；active = `ink` 色 + 底线 `ink` + weight 600；计数 micro/ink-2。 |  |
| **主按钮** | `brand` 底、白字、高 48px、圆角 6、icon-right；次按钮 `surface` + `line-strong` 框。 |  |
| **状态词** | 点(5px)+词；tone: success/warning/info/neutral/danger → 语义色。`bare` 变体仅文字。 |  |
| **名额** | 开放态：`剩 N 位`（tabular）；≤3 → `is-urgent` 陶土加粗；成行/结束：`满员`/`—`。 |  |
| **加载骨架** | `skeleton` + `sk-row`（thumb/body/3 线）；首行补 `space-4` 顶距。 |  |
| **空/错/禁用/加载** | 统一 `stateBlock`：icon + title + body + action；空态 action=清除筛选；错态 action=重载；禁用/加载无 action。 |  |
| **Toast** | 底部浮层 2300ms；单例。 |  |

### 4. 颜色语义（冻结）

| Token | 值 | 仅用于 |
|---|---|---|
| `--r3-bg` | #F7F4EC | 页面底 |
| `--r3-surface` | #FFFFFF | 面板/卡片/搜索框底 |
| `--r3-surface-2` | #EFEBDD | 接缝带/月份分组/下一场带 |
| `--r3-ink` | #1B241F | 标题/正文/active 页签 |
| `--r3-ink-2` | #66705F | 元信息/副标题/页签计数 |
| `--r3-ink-3` | #8A917F | 脚注/水印/吸顶后下框线 |
| `--r3-line` | #E4DDCB | 所有分隔/卡片框 |
| `--r3-line-strong` | #D5CEBB | 搜索框框/输入框框 |
| `--r3-brand` | #234B3C | 主按钮/focus 环/active 页签底线 |
| `--r3-accent` | #A8562E | **仅**紧迫（≤36h 倒计时/名额≤3） |
| 语义色 | success #2F6B4C / warning #8F6A1F / danger #A93F33 / info #46657A | 状态词 |

### 5. 字体（冻结）

| 角色 | 栈 | 用途 |
|---|---|---|
| UI/正文/事实 | `-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif` | 所有非叙述性文字 |
| 叙述性标题 | `Georgia, "Songti SC", "Noto Serif SC", SimSun, serif` | 页面大标题、活动标题、Hero Panel 标题、横滑卡标题、刊头标题——**凡被当作“叙述主体”的文字** |
| 数字 | `font-variant-numeric: tabular-nums` | 所有数值（距离/爬升/名额/计数/时间） |

### 6. 尺度（冻结）

| Token | 值 | 用途 |
|---|---|---|
| `--r3-space-1..8` | 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48px | 4px 基元 |
| `--r3-page-x` | 24px (375→20) | 页边距 |
| `--r3-touch` | 48px | 触控热区/按钮高/搜索框高 |
| `--r3-radius-img` | 2px | 图片圆角 |
| `--r3-radius-btn` | 6px | 按钮/输入框圆角 |
| `--r3-radius-pill` | 999px | 状态词点/胶囊 |

### 7. 过滤语义（Editorial/Curated 既定，四页共用）

- **默认视图**（filter='all' 且 query=''）：置顶/重点项（Hero/a1）在索引中**去重**；索引显示 `总数-1`，注释 `N 场 · 置顶已在上方`。
- **任一活跃筛选/搜索**：索引显示**完整结果集**（含置顶项，命中即入列）；注释简化为 `N 场`。
- **空结果**：状态块 `empty` + 清除筛选 action。
- **加载/错误/禁用**：各自状态块，不显示计数/页签/搜索。

---

## 四页迁移规格（Hybrid 设计语言）

### 详情页 `?view=detail` —— 活动详情（a1 赵公山）
| 区块 | 内容 | 组件复用 |
|---|---|---|
| 1. Hero Panel | 16:9 cover + 叠压信息板（同 Hybrid 主卡，含标题/路线/导语/事实带/CTA） | `.hy-hero` 完整复用 |
| 2. 行程 | 时间轴：时间 + 文案（来自 `a1.itinerary`） | 新：`tl-item`（时间点+圆点+文案） |
| 3. 路线画像 | 路线名 + 距离/爬升/难度 + 城市 | 事实带（icon+值+单位） |
| 4. 领队卡 | 领队名/角色/头像文本 + 电话后四位 | `leaderFact` + avatar 徽标 |
| 5. 装备要求 | `a1.requirements` 列表 | 新：checklist 行（icon+文案） |
| 6. 费用说明 | `a1.feeNote` | `state-block` 风格信息带 |
| 7. 底部 CTA | 主按钮（报名/已报名/待审核）+ toast 反馈 | `DETAIL_SIGNUP_STATE.ctaTheater` 状态机演示 |

> 数据：`D.featured` (a1) + `D.activities` 同源。

### 协作页 `?view=collab` —— 活动协作（a1 名单/分车/签到）
| 区块 | 内容 | 组件复用 |
|---|---|---|
| 1. 阶段头 | 石色带：`phase` (集合中) + `arrived/expected` + `nextStep` 文案 | 接缝带变体（无筛选/搜索） |
| 2. 分车网格 | 4 车 × 4 座；每车：车牌/司机/座位名（null=空位）；已到/未到态 | 新：`vehicle-card`（grid 4×1） |
| 3. 成员名单 | 17 人（已通过）分组：已到 / 未到 / 待审核 / 候补 | 统一行栅格：avatar/姓名/角色/出行方式/车位/审核态/签到态 |
| 4. 下一步 | 主按钮 `nextAction` (发起出发确认) + toast | 主按钮复用 |

> 数据：`D.collab` (phase/total/approved/checked/pendingAudit/waitlist/noVehicle/nextStep/nextAction) + `D.roster` + `D.vehicles`。**不虚构人名/车牌** —— 全部来自 demo data。

### 天气页 `?view=weather` —— 天气决策（a1 目的地赵公山顶线 2434m）
| 区块 | 内容 | 组件复用 |
|---|---|---|
| 1. 位置头 | 石色带：`location` + `elevationM` + `updatedText` + `verdict` | 接缝带变体 |
| 2. 关键窗口卡 | 48h 中的 `key` 小时（云海窗口 32–36、降雨 42–45）提取为 2 张强调卡 | Hero Panel 变体：小图/无叠压、标题+verdict+关键指标 |
| 3. 48h 时间轴 | 每小时：时间/温度/降水/风速/云量/夜间态；`key` 小时高亮（云海窗口/降雨标签） | 新：`wx-hour` 行（紧凑、横向可滑或分段） |
| 4. 详情折叠 | `detail` 文案 + `source` 声明 | `state-block` 变体（无 action） |

> 数据：`D.weather.meta` + `D.weather.hours`。**演示数据声明**：`WEATHER_META.source = '演示数据 · 非真实气象服务'` 必须在页脚/折叠内保留。

---

## 未验证项清单（真机/微信开发者工具）

| 项目 | 风险 | 备注 |
|---|---|---|
| `position:sticky` 接缝带在微信 WebView/真机上的吸顶表现 | 中 | iOS WKWebView 与安卓 X5 内核 sticky 表现可能不同 |
| `scroll-snap-type: x mandatory` 横滑轨在真机触感/惯性 | 中 | 需实测 `-webkit-overflow-scrolling: touch` 是否足够 |
| 24px 负外边距叠压在真机字体渲染/图层合成 | 低 | 已验证无阴影/无 backdrop-filter |
| 48px 触控热区在 375/390/414 真机可点性 | 低 | 已按规范 |
| 陶土 `#A8562E` 在深色模式/户外强光下对比度 | 低 | 仅用于纸面/石色底，非深色模式 |
| 真机字体回落（Songti SC / Noto Serif SC / SimSun）衬线渲染差异 | 中 | 需真机截图对比 |
| 真机图片加载/解码性能（9 张 720×450 cover） | 低 | `img.decode()` 已在 shell 等待 |

---

## 渲染证据索引（关键截图）

| 证据 | 文件 | 说明 |
|---|---|---|
| Hybrid 首屏 390 | `hybrid-390-fold.png` | 刊头+主卡图上半+信息板起始可见 |
| Hybrid 横滑轨滚动态 390 | `hybrid-390-rail-scrolled.png` / `hybrid-rail-scrolled-390-fold.png` | 边缘露边 22px、cue 翻至 2/3、scrollWidth 552>390 |
| Hybrid 接缝带吸顶 | `hybrid-390-seam-pinned.png` / `hybrid-seam-sticky-390-fold.png` | scrollTop 1300 触发、下框线加重 |
| Hybrid 比较区 390 | `hybrid-390-full.png` | 月份分组、80px 行、右列状态/名额/领队 |
| 详情页 Hero 390 | `detail-390-fold.png` | 16:9 封面+叠压面板+行程起始可见 |
| 详情页 CTA 390 | `detail-390-full.png` | 底部报名条（idle/loading/done） |
| 协作页 阶段+分车 390 | `collab-390-fold.png` | 石色带+4×4 车位网格+成员名单起始 |
| 协作页 完整 390 | `collab-390-full.png` | 17 人名单（4 组）+ 下一步按钮 |
| 天气页 位置+窗口 390 | `weather-390-fold.png` | 目的地+云海/降雨窗口卡+48h 轨起始 |
| 天气页 完整 390 | `weather-390-full.png` | 完整时间轴+详情折叠+演示声明 |
| 过滤态（三页共用语义） | `*-390-filter-formed.png` / `*-390-search-a7.png` / `*-390-search-empty.png` | 默认去重/活跃完整集/空态 action |
| 对照表 | `compare-round3-layouts-390.png` | 三方案 390 fold 侧对侧 |

> 所有 dom-check：editorial/curated/hybrid 均 **PASS 34 · FAIL 0**（含空/错/禁用/加载态）；详情/协作/天气结构完整、0 console errors。

---

## 交付核对

- [x] 三方案原型：`prototype/round3/`（可切换、真实数据、真实交互）
- [x] 对照证据：`screenshots/` 三方案 × 3VP × fold/full + 交互态 + `compare-round3-390.png`
- [x] 决策说明：本文档 §胜出方案 + §设计语言
- [x] 设计语言规则：本文档 §设计语言规范（排版/节奏/图片/分隔/颜色/交互/组件状态）
- [x] 四页精修：发现（Hybrid）+ 详情 + 协作 + 天气（**全部完成**）
- [x] 数据完整性：dom-check 三方案 34/34；详情/协作/天气结构完整
- [x] 未验证记录：本文档 §未验证项清单

---

> 纪律核对：无第八套风格、无业务信息删减、无虚构后端能力、不改生产仓库、全量改动限于 `prototype/round3/` 与 `docs/ui-design/round-3/`、四问可答。