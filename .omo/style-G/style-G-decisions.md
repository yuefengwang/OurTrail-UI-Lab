# Style G 决策记录（实施前定稿 · 零开放问题）

> 交付物：本文档 = 实施契约；`style-G-brief.md` = 作业单（file:line 级）。
> 规则：本文件所列 3 项决策**全部已决**，实施方不得重开；一切数值可溯源至 dossier（Strava 参考档案）或实验室既有令牌。
> 状态：`[RESOLVED]` 已决 × 3 ｜ 开放 0（2026-10-18）

---

## 1. 背景与范围

- **G = 实验室第 7 套视觉方向**（A–F 之外），方向为**忠实 Strava 橙白运动风**（"忠实" = 镜像 Strava 视觉语言，不自创新方向）。
- **交付规格（同 A–F，不可打折）**：4 页面（发现 / 详情 / 协作 / 天气）× 3 视口（375 / 390 / 414）× 截图 kind（fold / full）＋ 3 态（empty / error / disabled）＋ 截图证据链 ＋ 7 风格对照表。
- **数据不变量**：只读 `prototype/js/data.js`；不删任何字段（承 `js/styles/F/index.js:16` 注释口径）。
- **结构差异是硬要求**：G 不得与 A–F 共用同一 DOM 只换 CSS（`design-tokens.md` §4.4）。
- **证据链 = 已恢复的字节校验档案**（子代理 HTTP 504 中途死亡，输出自 SQLite 副本逐字节雕回，接缝零丢失，已与 `js/app.js` 源码交叉核对）：

| 档案路径 | 内容 |
|---|---|
| `C:\Users\thinkbook\AppData\Local\Temp\opencode\db-dump\retry-explore-final.md` | 穷尽式注册清单（Class a / b / c 三类改动点、README 计数表、8 步 patch 顺序） |
| `C:\Users\thinkbook\AppData\Local\Temp\opencode\db-dump\recon-final.md` | 7 步实施计划 + 集成契约（`next_steps` 段） |
| `C:\Users\thinkbook\AppData\Local\Temp\opencode\db-dump\recon-digest.md` | 同一 recon 会话的完整契约摘要（令牌约定 / 交互契约 / 各态 DOM 预期 / 实验室外壳） |
| `C:\Users\thinkbook\AppData\Local\Temp\opencode\db-dump\stravaOrig-final.md` | Strava 参考档案：调色板、字阶 |
| `C:\Users\thinkbook\AppData\Local\Temp\opencode\db-dump\stravaOrig-digest.md` | attempt-1 档案摘要（含 PDF 色值原始读数） |
| `C:\Users\thinkbook\AppData\Local\Temp\opencode\db-dump\retry-librarian-dossier.md` | **修正件**：`#FC5200` 为当前品牌橙，取代 `#FC4C02` |

> 注：`recon-final.md` 仅存 11 行（`next_steps` 尾段），完整契约在其 digest 中；两者同源同会，实施方须同读。

---

## 2. G 身份（已决，直接落地）

`prototype/js/app.js` 的 `STYLE_META`（L7–14）是**唯一注册表**：一条 `G` 即让 G 出现在切换器（L185–186 `Object.entries(STYLE_META)`）、使 `?style=G` 合法（L27）、进页眉（L154–155）、进激活标记（L202）。

**字段形状**：与 A–F 逐字段同构 —— `{ name: 'English Label', zh: '中文名', note: '三段 · 短语' }`。

| 位置 | 值 |
|---|---|
| `js/app.js:13` 之后新增 | `G: { name: 'Strava Athletic', zh: '橙白运动风', note: '忠实橙白 · 数据优先 · 短线反馈' },` |
| `compare.html:41` `STYLE_NAMES` | `G: '橙白运动风'` |

- `name` 走 A–F 的英文两词标签惯例（Alpine Editorial / Trail Works …）；`zh` 5 字，与"山野编辑部""瑞士功能主义"同量级。
- `note` 严格三段、`·` 分隔，与 A–F 全部 6 条同形。
- 缺 `STYLE_NAMES.G` 不会报错（`compare.html:55` 有 `|| style` 兜底），但必须补 —— 对照表表头不能出现裸字母。

---

## 3. 设计方向

### 3.1 调色板（Strava 参考 → CSS 自定义属性）

令牌名遵循 `css/styles/F.css` 的两层约定：**共享 `--lab-*` 同名同契约**（`design-tokens.md` §1，19 色 + 字体 + 空间 + 形态 + 图标动效）＋ **风格专属 `--g-*`**（F 先例：`F.css:80–99`、`design-tokens.md` §2.4）。

> **橙色修正（强制）**：当前品牌橙 = **`#FC5200`**（O50，Pantone 1655C/1655U），**不是 `#FC4C02`**。依据 `retry-librarian-dossier.md` §1.1 + developers.strava.com/guidelines（2025-09-29）+ strava.com `msapplication-TileColor` 实测。`stravaOrig-final.md:11` 表头把 `#FC4C02` 列为新版，属误标，已被修正件取代。

| Strava 参考 | Hex | dossier 角色 | lab 令牌 | 值 | 溯源 |
|---|---|---|---|---|---|
| O50 Strava Orange / Tangelo | `#FC5200` | 主品牌橙：CTA、激活 tab、路线折线、实心 kudos、PR 名次 chip | `--lab-brand` ＋ `--g-orange` | `#FC5200` | `retry-librarian-dossier.md` §1.1 |
| O60 Rust / Orange Dark | `#CC4200` | 深色橙；徽标深度 | `--lab-action` ＋ `--g-orange-dark` | `#CC4200` | 同上 |
| O40 Pumpkin / Orange Light | `#FC6100` | 浅色橙；亮底强调 | `--lab-accent` ＋ `--g-orange-light` | `#FC6100` | 同上 |
| White | `#FFFFFF` | 亮色画布 | `--lab-surface` | `#FFFFFF` | `stravaOrig-final.md:14` |
| White | `#FFFFFF` | CTA / 深色块上文字 | `--lab-action-text`、`--lab-on-dark` | `#FFFFFF` | 同上 |
| Fog | `#F7F7FA` | 极浅灰白：面层 / 卡片 | `--lab-bg` | `#F7F7FA` | `stravaOrig-final.md:21` |
| Icicle | `#F0F0F5` | 分隔浅灰 / 色调带 | `--lab-surface-2`、`--lab-border` | `#F0F0F5` | `stravaOrig-final.md:22` |
| Silver | `#DFDFE8` | 浅灰强调：chip 描边 / 分段轨道 | `--g-hairline` | `#DFDFE8` | `stravaOrig-final.md:23` |
| Coal | `#242428` | 一级墨色 | `--lab-text-1`、`--lab-border-strong` | `#242428` | `stravaOrig-final.md:19` |
| Gravel | `#494950` | 亮色表面灰：二级文字 | `--lab-text-2` | `#494950` | `stravaOrig-final.md:20` |
| Asphalt | `#6D6D78` | 中灰（PDF N80，R109 G109 B120）：三级文字 / 单位 / **功能性控件描边** | `--lab-text-3` | `#6D6D78` | `stravaOrig-digest.md:106–108` |
| Coal Black | `#0F0F0F` | 深色画布 | `--lab-dark-block` | `#0F0F0F` | `stravaOrig-final.md:15` |
| — | `rgba(36, 36, 40, .5)` | 遮罩 | `--lab-overlay` | `rgba(36, 36, 40, .5)` | Coal ＋ 实验室既有写法（`F.css:52`） |
| — | `none` | 图片不滤镜 | `--lab-photo-filter` | `none` | `design-tokens.md:37`「其他风格 `none`」 |

**语义状态色（dossier 无证据 → 取实验室既有令牌，禁自造）**：Strava 档案未提供 success / warning / danger / info 色板，而 `design-tokens.md` §1.1 要求 19 色齐备，且 §2.1 尾注规定「状态色的**使用方式**是风格差异，令牌本身只定义色值」。为保持 A–F 跨风格状态词可比，G 直接沿用 F/A/E 的既有字面量：

`--lab-success: #2F6B4C` · `--lab-warning: #8A6A20` · `--lab-danger: #A0402F` · `--lab-info: #44647A`（溯源 `F.css:46–49` / `design-tokens.md` §2.1 F 列）。

**已核对比度（实现后必须实测复核，不达标即返工）**

| 配对 | 比值 | 判定 |
|---|---|---|
| `#242428` on `#FFFFFF` / `#F7F7FA` | 15.5:1 / 14.5:1 | ✅ 正文 |
| `#494950` on `#FFFFFF` / `#F0F0F5` | 8.9:1 / 7.9:1 | ✅ 次级文字 |
| `#6D6D78` on `#FFFFFF` / `#F7F7FA` / `#F0F0F5` | 5.1:1 / 4.8:1 / 4.5:1 | ✅ 三级文字 + 控件描边（≥3:1，WCAG 1.4.11） |
| `#FFFFFF` on `#CC4200`（`--lab-action-text` on `--lab-action`） | 4.8:1 | ✅ CTA 正文 ≥4.5:1 |
| `#FFFFFF` on `#FC5200` | 3.3:1 | ⚠️ **仅可用于图形 / 大字 / 激活指示（≥3:1 非文本口径）；禁止用于正文尺寸文字** |

**因此已决的角色分配**：`#FC5200` = 品牌**图形**色（kudos 实心、路线折线、激活指示条、数据重点、PR chip 底）；`#CC4200` = **主 CTA 实心底色**（白字 4.8:1 合规）兼品牌文字色；`#FC6100` = 限量强调（chip 底 / hover tint）。三者全部落地，无第四种橙。

**边框纪律（已决）**：`--lab-border`（Icicle 1.1:1）是**装饰性发丝线**（divider / 表格线），不承担控件识别；任何**功能性控件描边**（input / switch / 可选 tab）必须用 `--lab-text-3`（Asphalt 4.8:1）或 `--lab-border-strong`（Coal）。焦点环用 `var(--lab-rule-strong-w) solid var(--lab-border-strong)` + `outline-offset: 2px`（照 `F.css:119–120`）。

### 3.2 字体（dossier §2 结论 + 离线安全栈）

**结论**：产品字 = **Inter**（dossier §2 首行）；wordmark = Strava Sans Rounded（定制）；品牌级 = Maison Neue（仅 logo / 营销）。

**离线安全栈（镜像 A–F 的既有做法）**：`tokens.css:10` 共享 `--lab-font-family` 为纯系统栈、零网络请求；`F.css:81` 的 `--f-serif` 同样是纯系统衬线栈。G 对齐同一模式：

```
--g-sans: Inter, -apple-system, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
```

Inter 置于首位（本机装则忠实渲染），未装则逐级回落到实验室共享系统栈。**禁止 webfont / `@font-face` / 任何网络字体请求** —— 生产为原生 WXML/WXSS、零 npm 依赖（`README.md:116`），实验室也无字体管线；引入网络字会同时违反 WXSS 纪律与离线立场。

**wordmark 处理说明（已决）**：不引入 Strava Sans Rounded / Maison Neue（定制 + 离线不可得）。G 的"品牌锁定"角色（wordmark）沿用共享 `--lab-font-family`，只以 dossier 的 **micro 排版语言**（全大写 + 字距）承担，具体落在 `--lab-kicker-*`。

**字阶映射（dossier §2.1 → 390 带宽）**

| dossier 角色 | dossier 规格 | lab 令牌组 | G 取值 | 取法 |
|---|---|---|---|---|
| hero-display | 64 / 700 / 1.0 / −1.5px | `--lab-display-*` | 30px / 700 / 1.15 / −0.4px | 桌面 hero 档超 390 带；按比例承接（收紧 lh 与负字距） |
| page-title | 36 / 700 / 1.1 / −0.75px | `--lab-title-*` | 24px / 700 / 1.2 | 同上 |
| section-head | 28 / 700 / 1.15 / −0.5px | `--lab-section-*` | 18px / 700 / 1.3 | 同上 |
| micro（uppercase） | 11 / 600 / 1.27 / +0.04em | `--lab-kicker-size/weight/ls`（+lh） | 11px / 600 / 1.27 / **0.4px** | **照抄**（11×0.04em ≈ 0.44px → 0.4px） |
| body-md | 16 / 400 / 1.5 | `--lab-body-*` | 15px / 400 / 1.5 | 承接实验室 390 带 |
| caption | 13 / 500 / 1.38 | `--lab-caption-*` | 13px / 500 / 1.4 | **照抄** |
| metric-display | 32 / 700 / 1.0 / −0.5px `tnum` | `--lab-data-size/weight` | 32px / 700 | **照抄**（+ 共享 `--lab-num-spacing: tabular-nums` 承接 `tnum`，`tokens.css:11`） |

**下限红线**：kicker 11px 为硬底，任何可见文本 ≥ 11px（`dom-check.mjs:142`）。

**版心 / 形态 / 图标 / 动效（dossier 无证据 → 只取实验室既有档位，禁造新值）**

| 令牌 | G 取值 | 取值依据 |
|---|---|---|
| `--lab-page-x` | 16px | Strava feed 满幅贴边的密集感；取实验室既有最紧档（D=16） |
| `--lab-section-gap` | 20px | 既有档（B/D） |
| `--lab-row-h` | 56px | 既有档（E/F） |
| `--lab-touch` | 44px | 既有多数档 |
| `--lab-action-h` | 48px | 既有档（A/C/F） |
| `--lab-radius-img` | 10px | 既有档（C） |
| `--lab-radius-btn` | 4px | 既有档（F） |
| `--lab-radius-card` | 8px | 既有档（A） |
| `--lab-radius-chip` | 999px | Strava pill chip 语义；既有档（A/C/E） |
| `--lab-shadow-1` | `0 8px 24px rgba(36, 36, 40, .14)` | Coal 阴影 ＋ 实验室既有写法（`F.css:75` 同形） |
| `--lab-icon-size` / `--lab-icon-stroke` | 20px / 2 | 既有档（A/C/E ＋ D/E） |
| `--lab-motion` | 180ms | `design-tokens.md:80` 规定值 |
| `--g-move-fast` / `--g-move` | 120ms / 180ms | `design-tokens.md:80` 规定值（形态照 `F.css:97–98` 的快/常两档） |

**`--g-*` 专属扩展（照 `F.css:80–99` 的四类扩展：字体族 / 材质两级 / 图形高度 / 动效两档）**

| 令牌 | 值 | 用途 |
|---|---|---|
| `--g-sans` | `Inter, -apple-system, "PingFang SC", "Helvetica Neue", Arial, sans-serif;` | G 展示/标题字族（dossier 产品字） |
| `--g-hairline` | `#DFDFE8` | chip 描边 / 分段轨道（Silver） |
| `--g-orange` / `--g-orange-dark` / `--g-orange-light` | `#FC5200` / `#CC4200` / `#FC6100` | dossier 三档橙的**图形通道**（与 `--lab-*` 同值不同角色） |
| `--g-cover-h` | 200px | feed 卡头图高度 |
| `--g-avatar` | 40px | 成员行 / kudos 行圆形头像 |
| `--g-move-fast` / `--g-move` | 120ms / 180ms | 动效快 / 常两档 |

### 3.3 构图与动效原则（"忠实" = 镜像，不自创）

1. **橙是唯一动作色，且要省**：一屏内橙色实心块 ≤ 2；实心只给主 CTA、激活指示、实心 kudos、路线折线、PR 名次 chip（dossier L11 typical usage ＋ "use orange sparingly and for emphasis"）。
2. **白为画布、卡片是内容单元**：页面底 = Fog，面层/卡片 = White，色调带/分隔 = Icicle，chip 描边 = Silver；**不用深色重块分区**（与 F「分区只用纸色」同族纪律）。
3. **数据优先**：metric 32/700/`tabular-nums` 承接 dossier `metric-display`；左标签右读数、单位用 `--lab-caption`（13/500）+ `--lab-text-3` 小字 —— 即 dossier 的 stats block 解剖。
4. **照片满幅、不加滤镜**：`--lab-photo-filter: none`；feed 卡固定解剖 = 头图 + 三联读数 + kudos 行。
5. **反馈即时，动效只做功能**：主 CTA 走 `idle → loading →(700ms)→ done` ＋ `ui.toast(...)`；tab 激活是滑动指示条（`transform`/`width` 过渡 120ms）；不做入场 / 过场动画。
6. **状态克制**：空 / 错 / 禁用用文字 ＋ Asphalt 弱化，不用红色警报块；红只留给真实危险（取消 / 失败），与 A–F 同口径。

---

## 4. 三个决策点（全部已决）

### ✅ 决策 1 — 令牌策略：G.css 自含（承 F 先例）

- **决定**：`--g-*` 与全套 `--lab-*` 实例值**全部写在 `css/styles/G.css` 的 `[data-style="G"]` 块内**（镜像 `F.css:26–99` 的结构）；**不向 `css/tokens.css` 增加 G 块**；共享基元按需 `var(--lab-*)` 消费。
- **理由（已核实，非转述）**：`css/tokens.css` 只有 A–E 块（L31 / 80 / 129 / 178 / 236，全文 280 行，**无 F 块**）；`README.md:27` 明写「共享令牌（A–E 字面量；F 自含于 F.css）」；`design-tokens.md:3` 明写 F 的完整令牌层自含于 `F.css` 的 `[data-style="F"]` 块（同契约、同令牌名，专属扩展 `--f-*`）；`F.css:15–16` 给出在文件理由（"共享 tokens.css 为二轮冻结文件，零改动"）。向冻结文件追加 G 块会同时破坏冻结纪律与 README 的字面表述。
- **须消费的共享基元**：`--lab-font-family`(tokens.css:10)、`--lab-num-spacing`(:11)、`--lab-space-1..8`(:14–21)、`--lab-border-width`(:23)、`--lab-rule-strong-w`(:24)、`--lab-ease`(:25)。
- **影响面**：`prototype/css/styles/G.css`（新建）；`prototype/css/tokens.css` **零改动**。

### ✅ 决策 2 — dom-check 默认：`['F','G']`

- **决定**：`tools/dom-check.mjs:30` 的默认 `STYLES` 由 `['F']` 改为 `['F','G']`。
- **理由**：G 处于评审期，需与上一轮 F 同口径并行回归；两者都可通过 `--style=` 参数化覆盖（`:30` 本身即参数化），显式运行与 CI 不受影响。代价仅是默认无参运行格数翻倍（F 24 格 → 48 格）；dom-check 不在截图证据链内，代价可接受。
- **影响面**：`tools/dom-check.mjs:30`（代码）、`:3`（用法注释 `# 默认全矩阵 (F × 4 页 × 3 视口 + 三态)` → `(F,G × 4 页 × 3 视口 + 三态)`）。

### ✅ 决策 3 — 页脚 / 计数清扫：**是**，同一变更波内完成

- **决定**：六处风格页脚、工具注释、README 全部计数/措辞在本波内一并更正，保持计数诚实。
- **理由**：F 轮先例（`final-report.md` §9.3）正是为同目的清扫；7 风格实验室若页脚仍写"六风格"，则**每一张 G 截图都带事实错误**。
- **影响面（行号已逐一实测复核，无漂移）**
  - 页脚 6 处：`js/styles/A/index.js:16`、`B/index.js:12`、`C/index.js:14`、`D/index.js:20`、`E/index.js:13`、`F/index.js:20` —— `'同一演示数据 · 六风格对照实验'` → `'同一演示数据 · 七风格对照实验'`。G 自身模块用同一常量。
  - 工具注释：`tools/capture.mjs:3`（`# 全矩阵: 6 风格 × 4 页面 × 3 视口` → `7 风格`）；`tools/dom-check.mjs:3`（见决策 2）；`tools/dom-check.mjs:33–36`（`// 身份检查口径与 A–E 保持一致:` → `A–F`）。
  - README（`docs/ui-design/visual-direction-lab/README.md`）：L3 `六套视觉方向（A–F）`→`七套视觉方向（A–G）`；L26–30 六风格对照表 / `{a..f}.css` → `{a..g}.css` / `{A..F}\index.js` → `{A..G}\index.js` / `tokens.css（A–E 字面量；F 自含于 F.css）` 补注 G 同 F 自含；L52 参数表加 `G`；L72 `styles=A,B,C,D,E,F&vp=390` → `...,F,G`；L75 `styles（默认 A,B,C,D,E,F）` → 含 `G`，`六风格 iframe 矩阵` → `七风格`；L83 `= 144 张` → `= 168 张`（7×4×3×2）；L85 `--only=states（24 张）` → `28 张`（21 状态 + 7 反馈）；L92 `24 个 iframe` → `28 个 iframe`（7×4）；L97 `矩阵 144 张` → `168`；L98 `状态 18 张` → `21`；L99 `按钮反馈终态 6 张` → `7`；L33 总数按 §4 清单实测重算（基线 `168 + 21 + 7 + 3 + 5 = 204`；G 若另产 3 张补充错误态则 207）。
  - **共享注释 3 处**（主会话评审修正 2026-10-18；F 轮收官 `final-report.md` §9.4 同址先例）：`css/base.css:175`、`js/data.js:1`、`js/data.js:234` 中的"六风格"字样 → 「七风格」（仅注释一词，逻辑/数据零触碰；红线「data.js 只读」冻结的是数据与逻辑；`components.css` 经 grep 复核无「六」命中，无需处理）；`design-tokens.md` §2 实例表的 G 列 —— 列为**明确延期项**，等 G 通过 dom-check + 对照表评审后再补，不在本波。

---

## 5. 验收标准

| # | 项 | 判据 |
|---|---|---|
| 1 | 语法 | `node --check` 覆盖全部改动 JS（`js/app.js`、`js/styles/G/index.js`、`js/styles/{A..F}/index.js`、两工具）；配方见 `README.md` §5（复制为 `.mjs` 后 `--check`） |
| 2 | DOM 自检 | `node tools/dom-check.mjs --style=G --audit` 全绿。身份串 **`赵公山`** 必须在 **detail / collab / weather** 三页的**正常态 + 禁用态**可见（`dom-check.mjs:37–39` 口径；空/错态按 A 同款不要求）。覆盖 **4 页 × 3 视口 ＋ 3 态 × 4 页 @390 ＝ 24 格** |
| 3 | 全矩阵截图 | `node tools/capture.mjs` 产出 **168** 张（7 风格 × 4 页 × 3 视口 × fold/full） |
| 4 | 对照表 | `node tools/capture.mjs --compare` 产出 5 张；表体 **28 个 iframe**（7 × 4），列宽自动加宽由 `capture.mjs:116–118` 保证 |
| 5 | 证据 MD5 | `prototype/screenshots/` 全量清单 + MD5 落盘（`G-*.png` 逐张核对存在且非 0 字节） |
| 6 | 计数一致 | README §4 与截图实测数一致；六处页脚均为"七风格"；工具注释无残留"6 风格" |
| 7 | 回归 | `node tools/dom-check.mjs --style=F` 仍全绿（F 未被本波破坏） |
| 8 | 视觉闸 | `--audit` 输出：无横向溢出、无 PAST-EDGE、无 <11px 文本；G 分区若用 zone 类，须加进 `dom-check.mjs:144` 审计选择器 |

---

## 6. 证据链与红线

**证据文件（可复核路径）**

- 决策来源：`retry-explore-final.md`（改动点全集）· `recon-final.md` + `recon-digest.md`（集成契约）· `stravaOrig-final.md` + `stravaOrig-digest.md`（调色/字体）· `retry-librarian-dossier.md`（`#FC5200` 修正）
- 仓库内契约：`docs/ui-design/visual-direction-lab/design-tokens.md` · `style-F-decisions.md` · `README.md` · `final-report.md`（§9.3 计数清扫先例）
- 实现读点：`prototype/css/styles/F.css:1–99`（纪律 + 令牌块）· `prototype/js/styles/F/index.js:1–41`（模块头 + 页脚常量）· `prototype/js/app.js:7–14 / 27 / 35 / 75–103 / 154–155 / 174 / 185–186 / 202` · `prototype/css/tokens.css:9–26` · `prototype/tools/dom-check.mjs:1–41 / 142 / 144` · `prototype/tools/capture.mjs:3 / 23 / 116–118 / 129`

**硬红线**

1. **`D:\OurTrail` 生产仓库零写入** —— 不读改写、不提交、不推送、不发布。G 只存在于 `D:\OurTrail-UI-Lab\`。
2. **实验室目录不是 git 仓库** —— 禁止 `git add/commit/push`，禁止初始化仓库。
3. **禁止编辑 `docs/ui-design/visual-direction-lab/_audit-notes.md`**（阶段 0 内部工作笔记，冻结）。
4. `js/data.js` 与 `js/render-common.js` **只读不改**（render-common 的 6 个共享原语 `el / icon / photo / fmt / pad2 / frag` 是所有风格的依赖）。
5. **默认风格保持 `'A'`** —— `app.js:21`（`q.get('style') || 'A'`）与 `:27`（非法回退 `'A'`）不动。
6. **WXSS 迁移纪律**：禁 `color-mix()` / `:has()` / `backdrop-filter` / `dvh`，全部字面量（`tokens.css:5`、`design-tokens.md` §4.2）。
7. **组件 CSS 禁硬编码**颜色 / 字号 / 圆角 —— 只消费令牌（`tokens.css:4`、`design-tokens.md` §4.1）。
8. **禁渐变背景**（scrim 压字渐变除外且须实测对比度）—— `design-tokens.md` §4.3。
9. **禁结构同构**：不得与 A–F 共用同一 DOM 只换 CSS —— `design-tokens.md` §4.4。
10. **可见文本 ≥ 11px** —— `dom-check.mjs:142`。
11. **禁网络字体**：不得引入 `@font-face` / Google Fonts。
12. **不得删除演示数据字段**换"密度差异" —— `design-tokens.md` §4.5。

---

## 7. 已知差异与裁定（供复核，不构成开放问题）

| # | 差异 | 裁定 |
|---|---|---|
| 1 | `stravaOrig-final.md:11` 把 `#FC4C02` 列为 2025–2026 新版橙；`retry-librarian-dossier.md` 判定 `#FC5200` 才是当前值 | 采**后者**。attempt-1 档案该行为误标，已被修正件显式取代 |
| 2 | `recon-final.md` 仅 11 行（`next_steps`），`recon-digest.md` 才是完整契约 | 同源同会，两份同读；digest 为实施契约的完整载体 |
| 3 | 清单 A2 写 `index.html:10-15`，`style-F-decisions.md` 附录 B 写 `:10-14` | 两者都对（后者是 F 轮当时的 A–E 区间）。现文件 A–F 位于 **L10–15**，**无行漂移** |
| 4 | 清单 A1 写 `app.js:7-14`，`style-F-decisions.md` 写 `:7-13` | 后者未计闭合行 `};`。现块为 **L7–14**，新增条目插在 **L13 之后**，**无行漂移** |
| 5 | 清单 README 表只列 L3 / L26–30 / L52 / L72 / L75 / L83 / L92 / L97–101；实际 README 另有"六/六"措辞在 L16、L17、L26、L29、L33，且 **L85 `（24 张）`** 未被清单收录 | 一并纳入决策 3 的清扫范围（L85 → 28 张；L33 按实测重算） |
| 6 | 六个页脚行号（A16/B12/C14/D20/E13/F20）逐一 grep 实测 | 与清单 B7 **完全一致，零漂移** |
| 7 | `recon-digest.md` 中文段落为 GBK 误解码（mojibake） | 该档案的英文/ASCII 段为字节校验可读内容；所有中文行级主张**已改由原型源码逐条复核**（本文所引 file:line 均为实测值） |
| 8 | `retry-librarian-dossier.md` 仅恢复出 §1.1 即中断 | 其余一律以 `stravaOrig-final.md` 为底、套用本档案的橙色修正；修正件文末亦如此声明 |