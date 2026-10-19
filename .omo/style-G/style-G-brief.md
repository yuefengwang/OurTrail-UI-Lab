# Style G 实施作业单（runbook）

> 契约来源：`style-G-decisions.md`（同一目录，已定稿 · 3 项决策全决 · 零开放问题）
> 清单来源：`db-dump\retry-explore-final.md`（Class a / b / c）＋ `db-dump\recon-final.md` / `recon-digest.md`（集成契约）
> 纪律：本单所列 file:line **全部经本轮对原型源码逐条实测复核**，与清单零漂移（见 §6）。
> 执行顺序：严格按 §4 的 8 步，**资产层必须先于注册层**。

---

## 1. 目标与前置

**目标**：把 G（忠实 Strava 橙白运动风，第 7 套方向）接入实验室，做到 `?style=G` 可用、可进对照表、可进全矩阵证据链，且 A–F 零回归。

**硬前置（未满足则后续步骤无意义）**

| 前置 | 说明 |
|---|---|
| G 文件已存在 | `css/styles/G.css` ＋ `js/styles/G/index.js` **必须先建好**。`js/app.js:35` 是动态 `import('./styles/${style}/index.js')`，缺文件 → 模块加载失败 → `app.js:106–114` 回退"模块未就绪"页，`window.__LAB_READY__` 停在 `false` |
| **A1 + A2 是 G 可用的唯一硬阻塞** | A1 = `STYLE_META` 增 G（否则 `:27` 把 `style=G` 打回 `'A'`）；A2 = `index.html` 追加 G.css `<link>`（否则模块渲染但零样式） |
| 其余（A3–A7 / B1–B8）皆非阻塞 | 缺任一项只是对照表 / 工具 / 文档口径不一致，功能仍可用；但本波要求全做（决策 3） |

**顺序铁律**：资产层 → `index.html` → `app.js` → `compare.html` → `capture.mjs` → `dom-check.mjs` → 验证 → README + 页脚清扫。

---

## 2. 新建文件规格（2 个）

### 2.1 `prototype/css/styles/G.css`

**作用域**：全部规则限定在 `[data-style="G"]` 内（照 `F.css:19` 纪律；`app.js:143` `documentElement.dataset.style = state.style` 会自动激活）。

**令牌层（文件顶部第一个块，结构照 `F.css:26–99`）**

- `--lab-*` 全套实例值 = `style-G-decisions.md` §3.1 / §3.2 表格逐格照抄，**不得改值**。
- `--g-*` 扩展：`--g-sans` · `--g-hairline` · `--g-orange` / `--g-orange-dark` / `--g-orange-light` · `--g-cover-h` · `--g-avatar` · `--g-move-fast` / `--g-move`。
- **禁止**向 `css/tokens.css` 加 G 块（决策 1）。
- **须消费**共享基元：`var(--lab-space-*)` · `var(--lab-font-family)` · `var(--lab-num-spacing)` · `var(--lab-border-width)` · `var(--lab-rule-strong-w)` · `var(--lab-ease)`（均来自 `tokens.css:9–26`，不在 G 里重定义）。
- 文件头注释体例照 `F.css:1–24`（方向声明 + 排除红线 + 令牌层自含说明 + 纪律清单）。

**WXSS 纪律（`recon-final.md` step 2 / `design-tokens.md` §4.2）**

- 禁 `color-mix()` · 禁 `:has()` · 禁 `backdrop-filter` · 禁 `dvh`。
- **全部字面量**（含阴影、圆角、位移、时长），不得依赖运行时计算。
- 组件层禁硬编码颜色 / 字号 / 圆角；只消费令牌。
- 禁渐变背景（scrim 压字除外，且须实测对比度）。
- 无网络字体 / 无 `@font-face` / 无 `@import`。

**类名约定**：BEM 化 `[data-style="G"] .g-<block>__<element>`，修饰用 `.g-<block>--<mod>`、状态用 `.is-*`（照 `F.css:257/264/275/278/287` 的 `.f-zone / --oat / is-current / __no / __name` 形态）。

### 2.2 `prototype/js/styles/G/index.js`

| 契约项 | 要求 |
|---|---|
| **必需导出** | `renderDiscover(ctx)` · `renderDetail(ctx)` · `renderCollab(ctx)` · `renderWeather(ctx)`。`app.js:81` 用 `'render' + page 首字母大写` 取函数名；缺任一导出 → `app.js:106–114` 回退"模块未就绪"，`__LAB_READY__` 永不置 `true`（`app.js:101–103`） |
| **共享原语** | 只 `import { el, icon, photo, fmt, pad2, frag } from '../../render-common.js'`（`render-common.js` 的 6 个导出：`el`:5 / `append`:26 / `frag`:35 / `icon`:84 / `fmt`:97 / `pad2`:98 / `photo`:108） |
| **入参 ctx** | `{ D, flag, vp, ui }`，其中 `ui = { toast, go, setFlag }`（`app.js:84–89`）。`ctx.D` = `DEMO` |
| **`__LAB_READY__` 握手** | 模块内**不设置**该标志 —— 由 `app.js` 在两次 `requestAnimationFrame` 后统一置 `true`。模块只要**不抛异常**且返回 DOM 节点即可 |
| **不得抛异常** | 抛异常被 `app.js:90–92` 吞掉 → 落回退页 → 握手失败 |
| **数据只读** | 只读 `prototype/js/data.js`；不删任何字段（承 `F/index.js:16`） |
| **事件写法** | 一律 `el(..., { onclick })`，**禁内联 `on*`**（承 `F/index.js:15`） |
| **`?state=` 语义** | `flag ∈ { '', 'empty', 'error', 'disabled', 'loading' }`（`app.js:17` `FLAG_META`）。至少覆盖 `''` / `empty` / `error` / `disabled` 四态 |
| **页脚常量** | `const NOTE = '同一演示数据 · 七风格对照实验';`（决策 3 已改口径，G 不得再用"六风格"） |

**各页必备结构（`recon-digest.md` §4「Required elements per page」＋ F 实际实现）**

| 页 | 必须有 | 身份串 `赵公山` |
|---|---|---|
| Discover | 刊头（`ctx.D.featured` / city）· 筛选 tabs ＋ 计数 ＋ 滑动指示条 · 搜索 · feed 卡（头图 + 三联读数 + kudos 行）· 脚注 | 非强制（`dom-check.mjs:37` 只对 detail/collab/weather） |
| Detail | hero（`a.title`）· 状态行 · factstrip · 行程叙述 · 装备 · 底部操作条 · 脚注 | **强制（正常态 + 禁用态）** |
| Collab | 抬头（`kick(a.title + ' · ' + a.dateText)`）· 分段 tabs（总览/名单/分车/现场）· 现场计数 · 成员行 · 分车格 · 操作条 · 脚注 | **强制（正常态 + 禁用态）** |
| Weather | 简报抬头 · 日卡 · 时段/窗口行 · 逐时读数 · 决策条 · 脚注；地点字段带 `赵公山` | **强制（正常态 + 禁用态）** |

**各态 DOM 预期（`recon-digest.md` §4「State variant DOM expectations」）**

- **Discover**：`error` → 刊头 + 错误区 + 脚注；`loading` → 骨架屏 + 脚注；`empty` → "无匹配"区 + stateBlock + 脚注；`disabled` → 加"只读"说明并禁用控件。
- **Detail**：`error` → 错误区 + 脚注；`empty` → hero 标记为已取消 ＋ 状态行 ＋ 路线说明区 ＋ 报名状态区（**CTA 禁用** ＋ 分享按钮）+ 脚注；`loading` → 详情骨架 + 脚注。
- **Collab**：`error` → 抬头错误态 + stateBlock（`重试` CTA，点击 `ui.toast(...)` 后 `ui.setFlag('')`）+ 脚注；`empty` → "还没有人签到" + stateBlock(users) + "去看看其他活动" CTA → `ui.go('discover')` + 脚注；`disabled` → "签到已锁定"说明。
- **Weather**：`error` → stateBlock（`alert` 图标）+ 重试 CTA。

**交互链（`recon-digest.md` §4「CTA feedback chain」/「Toast」/「Filter-switch」）**

- 主 CTA：`stage='idle'` → 点击 → `loading` → `paintCta()` → `setTimeout(700ms)` → `done` → `paintCta()` → `ui.toast('报名成功，等待领队审核')`。按钮须带 `data-testid="primary-cta"`（`capture.mjs:101` 据此定位）；`paintCta()` 清 `is-loading`/`is-done`、写文案、追加对勾图标、非 idle 时禁用。
- toast：`ui.toast(msg)` 在 `#toast-root`（`index.html:47`）显示 2300ms（`app.js:44–58`）。
- tabs：`.is-active` 类切换 ＋ 计数 ＋ 指示条 `transform`/`width` 过渡；`disabled` 时加 `.is-disabled`。

---

## 3. 修改清单

### 3.1 Class (a) — 必须改（G 才能被切换器显示并加载）

| # | File:Line | 现状 | 动作 |
|---|---|---|---|
| **A1** | `prototype/js/app.js:7-14`（条目插在 **L13 之后**） | `export const STYLE_META = { A:{...} … F:{...} };` | 追加 `G: { name: 'Strava Athletic', zh: '橙白运动风', note: '忠实橙白 · 数据优先 · 短线反馈' },`。唯一注册表 —— 一条即让 G 进切换器（`:185-186` `Object.entries(STYLE_META)`）、使 `?style=G` 合法（`:27`）、进页眉（`:154-155`）、进激活标记（`:202`） |
| **A2** | `prototype/index.html:15` 之后 | 6 个 `<link>`，末位是 `<link rel="stylesheet" href="css/styles/F.css">`（L15） | 追加 `<link rel="stylesheet" href="css/styles/G.css">`。**不加则 G 渲染但零样式** |
| **A3** | `prototype/compare.html:36` | `const styles = (q.get('styles') \|\| 'A,B,C,D,E,F').split(',')` | 默认 CSV 改 `'A,B,C,D,E,F,G'`。（capture 路径由 B1 供 `styles=`，此处只管直接打开 compare.html） |
| **A4** | `prototype/compare.html:41` | `const STYLE_NAMES = { A: '山野编辑部', …, F: '山野工坊' }` | 增 `G: '橙白运动风'`。缺省虽由 `:55` 的 `|| style` 兜底，但会出现裸字母，须补 |
| **A5** | `prototype/compare.html:5` | `<title>OurTrail · 六风格对照表 (Contact Sheet)</title>` | 「六风格」→「七风格」 |
| **A6** | `prototype/js/app.js:174` | 面板副标题含 `六套视觉方向 × 四个代表页面` | 「六套」→「七套」。先例：同一字符串在 F 轮已修过一次（`final-report.md` §9.3） |
| **A7** | `prototype/js/app.js:2` | `// URL 参数: ?style=A-E & ...` | 改 `A-G` 或改写成通用措辞（该注释在 F 轮已过期） |

### 3.2 Class (b) — 工具默认值 / 注释（本波一并改）

| # | File:Line | 现状 | 动作 |
|---|---|---|---|
| **B1** | `prototype/tools/capture.mjs:23` | `const STYLES = (args.style ? … : ['A','B','C','D','E','F'])` | 数组加 `'G'`。无参时全矩阵含 G → 7×4×3×2 = **168 张**。对照表列宽按 `STYLES.length` 自动加宽（`:118`） |
| **B2** | `prototype/tools/capture.mjs:3` | `# 全矩阵: 6 风格 × 4 页面 × 3 视口 (fold + full)` | 「6 风格」→「7 风格」 |
| **B3** | `prototype/tools/dom-check.mjs:30` | `const STYLES = args.style ? … : ['F']` | **已决（决策 2）** → `['F', 'G']`：F 保回归、G 进评审 |
| **B4** | `prototype/tools/dom-check.mjs:3` | `# 默认全矩阵 (F × 4 页 × 3 视口 + 三态)` | → `(F,G × 4 页 × 3 视口 + 三态)` |
| **B5** | `prototype/tools/dom-check.mjs:33-36` | `// 身份检查口径与 A–E 保持一致:` | → `A–F`（过期注释，无代码影响） |
| **B6** | `prototype/tools/dom-check.mjs:144` | `root.querySelectorAll('.f-zone, .a-sect, .e-zone')` | **若 G 定义 zone 类（如 `.g-zone`）则追加**，否则 G 的分区不进 `--audit` 报告（不是失败，只是审计报告里不列出） |
| **B7** | `js/styles/A/index.js:16`、`B/index.js:12`、`C/index.js:14`、`D/index.js:20`、`E/index.js:13`、`F/index.js:20` | 6 个模块各有一条 `'同一演示数据 · 六风格对照实验'`（常量名各不相同：`NOTE` / `BNOTE` / `TAIL` / `DNOTE` / `NOTE_TAIL` / `NOTE`） | **已决（决策 3）**：全部改 `'同一演示数据 · 七风格对照实验'`；G 模块用同一常量 |
| **B8** | `docs/ui-design/visual-direction-lab/README.md` | 见 §3.4 计数表 | **已决（决策 3）**：本波全改 |
| **B9** | `prototype/css/base.css:175`；`prototype/js/data.js:1`、`:234` | 3 处注释含「六风格」（base.css「排版工具 (消费令牌; 六风格共享语义)」；data.js L1「演示数据集 (共享，六风格只读)」、L234「详情页参与者视图 (供六风格共用字段)」） | **主会话评审修正（2026-10-18）**：改「七风格」。仅注释一词；F 轮 §9.4 同址先例（原型侧计数残留清零）；与红线 #4 不冲突（冻结的是数据与逻辑） |

### 3.3 Class (c) — 已参数化 / 无需改动（只做确认，禁止动）

| File:Line | 为何安全 |
|---|---|
| `compare.html:45, 47, 50, 55, 61` | 网格列数、计数文案、单元格循环、标签兜底、`iframe.src = index.html?style=${style}…` 全部由 `styles` 数组派生 |
| `capture.mjs:76, 89, 95, 116-118, 129` | 循环均遍历 `STYLES`；`gridW` 按 `STYLES.length` 计算；`styles=${cols}` 显式传给 compare.html（`:117` 注释即为此），两侧同步 |
| `dom-check.mjs:49, 61, 116, 121` | 循环与 URL 构造按 `STYLES` 参数化 |
| `tools/test-browser.mjs`（全文） | Playwright 可用性冒烟测试，零风格引用（仅内联 `style=` 属性） |
| `tools/serve.mjs`（全文） | 静态文件服务器，无风格知识 |
| `js/app.js:21, 27` | `q.get('style') \|\| 'A'` 与非法回退 `'A'`。A1 完成后 `?style=G` 自然生效。**默认保持 `'A'`（红线）** |
| `js/app.js:35` | `import(\`./styles/${style}/index.js\`)` 动态；只要求 `js/styles/G/index.js` 存在（属前置，不是补丁） |
| `js/app.js:143` | `documentElement.dataset.style = state.style` 通用，自动激活 `[data-style="G"]` |
| `js/data.js`、`js/render-common.js` | 无风格枚举（grep 验证）；`data.js` 注释计数 → **并入 B9**（仅注释一词，评审修正）；`render-common.js` 零改动（红线：只读） |
| `css/base.css:175`、`css/components.css` | `base.css:175` 注释计数 → **并入 B9**（评审修正）；`components.css` 经 grep 复核无「六」命中，零改动 |
| `css/tokens.css` | 只有 A–E 块（L31/80/129/178/236），无 F 块 —— **G 不加块**（决策 1） |
| `package.json` | 无引用风格的 scripts |
| `screenshots/*` | 输出产物；`{style}-…` 命名已参数化，下一轮 capture 自动出现 G 截图 |

### 3.4 README 计数表（`docs/ui-design/visual-direction-lab/README.md`，B8 明细）

| Line | 现状 | 改为 |
|---|---|---|
| 3 | `六套视觉方向（A–F）` | `七套视觉方向（A–G）` |
| 26–30 | `六风格对照表`；`css\styles\{a..f}.css`；`js\styles\{A..F}\index.js`；`tokens.css（A–E 字面量；F 自含于 F.css）` | `{a..g}.css`；`{A..G}\index.js`；补注「F、G 均自含于各自 F.css / G.css」 |
| 52 | 参数表 `style` = `A`/`B`/`C`/`D`/`E`/`F` | 加 `G` |
| 72 | `compare.html?pages=detail&styles=A,B,C,D,E,F&vp=390` | `...,F,G` |
| 75 | `styles（默认 A,B,C,D,E,F）`；`六风格 iframe 矩阵` | 含 `G`；`七风格` |
| 83 | `# 全矩阵：6 风格 × 4 页面 × 3 视口 × fold/full = 144 张` | `7 风格`；`= 168 张` |
| 85 | `node tools/capture.mjs --only=states  # 只重跑交互状态组图（24 张）` | `（28 张）`＝21 状态 ＋ 7 反馈 |
| 92 | `# --compare 结束后表体含 24 个 iframe` | `28 个 iframe`（7×4） |
| 97 | `{style}-{page}-{vp}-{fold\|full}.png  # 矩阵 144 张` | `168` |
| 98 | `{style}-collab-{empty\|error\|disabled}-390-fold.png  # 状态 18 张` | `21` |
| 99 | `{style}-detail-after-cta-390-fold.png  # 按钮反馈终态 6 张` | `7` |
| 33 | `prototype\screenshots\  # 截图证据（176 张，见 §4）` | 按 §4 清单实测重算：基线 `168+21+7+3+5 = 204`；G 若另产 3 张补充错误态则 207 |
| 16 / 17 / 26 / 29 | `六套风格定义` / `六风格令牌表` / `六风格对照表` / `六风格只读同一份` | 改为「七」口径（目录树与说明文字一致性；清单未列，本波一并扫） |

> **本波明确不动的文档**：`design-tokens.md` §2 实例表的 G 列 —— **明确延期**（决策 3 末条），等 G 通过 dom-check 与对照表评审后再补。

---

## 4. Patch 顺序（8 步，严格照此）

| 步 | 动作 | 覆盖清单项 |
|---|---|---|
| **1** | 建 `css/styles/G.css` ＋ `js/styles/G/index.js`（**资产层**） | §2 两个新文件规格 |
| **2** | `index.html`：追加 G.css `<link>` | A2 |
| **3** | `js/app.js`：`STYLE_META` 增 G；修面板副标题「六套→七套」；修 L2 注释 | A1 / A6 / A7 |
| **4** | `compare.html`：默认 CSV、STYLE_NAMES、title | A3 / A4 / A5 |
| **5** | `tools/capture.mjs`：`STYLES` 默认 ＋ 用法注释 | B1 / B2 |
| **6** | `tools/dom-check.mjs`：默认 `['F','G']` ＋ 注释 ＋（按需）审计选择器加 `.g-zone` | B3 / B4 / B5 / B6 |
| **7** | 验证：起服务器 → 看 `?style=G` → `dom-check --style=G --audit` → `capture --style=G` → `capture --compare --style=A,B,C,D,E,F,G` | 见 §5 |
| **8** | README 更新 ＋ 六处页脚清扫 ＋ 共享注释 3 处 | B7 / B8 / B9 |

---

## 5. 验证命令

全部命令在 `D:\OurTrail-UI-Lab\prototype` 下执行（PowerShell）。

```powershell
# --- 0) 语法检查（改完 .js 后必做；原型是零构建原生 ESM）---
New-Item -ItemType Directory -Force -Path "$env:TEMP\otcheck" | Out-Null
Copy-Item js\app.js                 "$env:TEMP\otcheck\app.mjs"  -Force
Copy-Item js\styles\G\index.js      "$env:TEMP\otcheck\g.mjs"    -Force
Copy-Item js\styles\F\index.js      "$env:TEMP\otcheck\f.mjs"    -Force
node --check "$env:TEMP\otcheck\app.mjs"
node --check "$env:TEMP\otcheck\g.mjs"
node --check "$env:TEMP\otcheck\f.mjs"
Copy-Item tools\capture.mjs  "$env:TEMP\otcheck\capture.mjs"  -Force; node --check "$env:TEMP\otcheck\capture.mjs"
Copy-Item tools\dom-check.mjs "$env:TEMP\otcheck\domcheck.mjs" -Force; node --check "$env:TEMP\otcheck\domcheck.mjs"
# 通过即静默退出 0（A–E 六处 index.js 同法逐个 --check）

# --- 1) 起静态服务器 ---
$srv = Start-Process node -ArgumentList 'tools/serve.mjs','4173' -PassThru -WindowStyle Hidden
Start-Sleep 2
$env:LAB_BASE = 'http://127.0.0.1:4173/index.html'

# --- 2) 人工首 look：四个 URL 逐个打开 ---
# http://127.0.0.1:4173/index.html?style=G&page=discover&vp=390
# http://127.0.0.1:4173/index.html?style=G&page=detail&vp=390
# http://127.0.0.1:4173/index.html?style=G&page=collab&vp=390&state=disabled
# http://127.0.0.1:4173/index.html?style=G&page=weather&vp=390&state=empty

# --- 3) DOM 自检（G 单风格 + 审计）---
node tools/dom-check.mjs --style=G --audit

# --- 4) 回归（F 不得被本波破坏）---
node tools/dom-check.mjs --style=F

# --- 5) G 单风格截图 ---
node tools/capture.mjs --style=G
node tools/capture.mjs --style=G --states        # 交互状态组图 + 按钮反馈终态

# --- 6) 7 风格对照表（28 个 iframe：7 风格 × 4 页）---
node tools/capture.mjs --compare --style=A,B,C,D,E,F,G

# --- 7) 全矩阵 = 168 张（7 风格 × 4 页 × 3 视口 × fold/full）---
node tools/capture.mjs

# --- 8) 证据 MD5 ---
Get-ChildItem screenshots -Filter *.png | Get-FileHash -Algorithm MD5 |
  Select-Object @{n='name';e={Split-Path $_.Path -Leaf}}, Hash | Export-Csv screenshots\md5.csv -NoTypeInformation -Encoding UTF8
(Get-ChildItem screenshots -Filter *.png).Count      # 应为 204（见 README L33 口径）；G-*.png 共 28 张（矩阵 24 ＋ 状态 3 ＋ 反馈 1）

# --- 9) 收尾 ---
Stop-Process -Id $srv.Id -Force
```

**判据（`dom-check --style=G --audit` 全绿才算过）**

- `window.__LAB_READY__ === true`（每格）。
- 身份串 `赵公山` 在 **detail / collab / weather** 三页的**正常态 + 禁用态**可见（`dom-check.mjs:37–39`；空/错态按 A 同款口径不要求）。
- 无横向溢出（`.page` 与 document 均 ≤ +1px）、无 console error / pageerror。
- 非空渲染（`.page` 高度 > 200px、可见文本 ≥ 40 字符）。
- 覆盖格数：**4 页 × 3 视口 ＋ 3 态 × 4 页 @390 ＝ 24 格**（`dom-check.mjs:49–54`）。
- `--audit` 输出：无 `PAST-EDGE`、无 `<11px` 文本、G 分区已列入（若 B6 已加 `.g-zone`）。
- 尾部 `ALL-PASS`。

---

## 6. 行漂移复核记录（本轮实测 vs 清单声明）

| 抽查点 | 清单声明 | 实测 | 结论 |
|---|---|---|---|
| A1 `app.js:7-14` | `STYLE_META` 块，新增插在 L13 后 | 块占 L7–14；L13 = F 条目，L14 = `};` | **无漂移**（另：L185–186 / L27 / L154–155 / L202 四处下游消费点亦已逐条实测确认） |
| A2 `index.html:10-15` | 6 个 `<link>`，F 在末位 | L10–15 = A–F，F 在 L15 | **无漂移** |
| A3 / A4 `compare.html:36 / 41` | 默认 CSV / STYLE_NAMES | L36 / L41 精确命中 | **无漂移** |
| B1 `capture.mjs:23` | `STYLES` 默认数组 | L23 精确命中 | **无漂移** |
| B7 `js/styles/F/index.js:20` | 页脚常量 | `F/index.js:20`；另 5 处实测 `A:16 / B:12 / C:14 / D:20 / E:13` | **无漂移**（6/6 全中） |
| B3 / B4 / B5 `dom-check.mjs:30 / 3 / 33-36` | 默认 `['F']` / 用法注释 / 过期注释 | L30 / L3 / L33-36 精确命中 | **无漂移** |
| B6 `dom-check.mjs:144` | `--audit` zone 选择器 | L144 精确命中 | **无漂移** |
| `capture.mjs:116-118 / 129` | 对照表自动加宽 + 显式传 `styles=` | L116-118 / L129 精确命中 | **无漂移** |
| `app.js:174` | 面板副标题「六套」 | L174 精确命中 | **无漂移** |

**清单未收录、本轮补入的站点**（非漂移，是清单覆盖缺口）

| 站点 | 内容 | 处置 |
|---|---|---|
| `README.md:85` | `--only=states`（**24 张**） | 纳入 B8 → 28 张 |
| `README.md:33` | 总数 **176 张** | 纳入 B8 → 按 §4 清单实测重算 |
| `README.md:16 / 17 / 26 / 29` | 「六套风格定义」「六风格令牌表」「六风格对照表」「六风格只读同一份」 | 纳入 B8 → 「七」口径 |
| `css/base.css:175`、`js/data.js:1`、`:234` | 「六风格」注释 ×3（grep 实测命中） | 主会话评审修正 → **B9**（F 轮 §9.4 收官先例同址） |

---

## 7. 实现红线

**仓库边界**

1. **`D:\OurTrail` 生产仓库零写入** —— 不改、不提交、不推送、不发布。G 只存在于 `D:\OurTrail-UI-Lab\`。
2. **实验室目录不是 git 仓库** —— 禁 `git add / commit / push`，禁初始化仓库。
3. **禁编辑 `docs/ui-design/visual-direction-lab/_audit-notes.md`**（阶段 0 内部笔记，冻结）。

**不得改动的代码**

4. `js/data.js` 与 `js/render-common.js` **只读不改**（指数据与逻辑；`data.js` L1／L234 的注释计数清扫见 **B9**，F §9.4 先例口径）—— `render-common.js` 的 6 个共享原语是全部风格的依赖。
5. `js/app.js:21` 与 `:27` 的默认风格 `'A'` **保持不变**。
6. `css/tokens.css` **零改动**（决策 1：G 自含于 G.css）。

**实现纪律（继承 lab 全局红线）**

7. **WXSS 迁移**：禁 `color-mix()` / `:has()` / `backdrop-filter` / `dvh`；全部字面量。
8. **组件 CSS 禁硬编码**颜色 / 字号 / 圆角 —— 只消费 `--lab-*` / `--g-*` 令牌。
9. **禁渐变背景**（scrim 压字除外且须实测对比度）。
10. **禁结构同构**：G 不得与 A–F 共用同一 DOM 只换 CSS。
11. **可见文本 ≥ 11px**（`dom-check.mjs:142` 硬底线）。
12. **禁网络字体**：不得 `@font-face` / Google Fonts / `@import`；`--g-sans` 是纯系统栈。
13. **禁网络请求 / 外部资源**：素材仅用 `prototype\assets\photos\`（现 10 个文件）。
14. **不得删除演示数据字段**换"密度差异"。
15. **事件只走 `el(..., { onclick })`**，禁内联 `on*` 属性。
16. **模块不得抛异常**：抛异常 → `app.js:90–92` 吞掉 → 落回退页 → `__LAB_READY__` 永假。

**文档纪律**

17. README 计数必须与实测一致（决策 3：宁可改文档也不留假数）。
18. 三个已决决策（令牌策略 / dom-check 默认 / 计数清扫）**不得重开** —— 如需变更，先改 `style-G-decisions.md` 再动代码。