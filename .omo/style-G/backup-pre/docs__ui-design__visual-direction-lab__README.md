# Visual Direction Lab — 运行与查看说明

> OurTrail 多风格 UI 探索实验室。六套视觉方向（A–F）× 四个代表页面（发现/详情/协作/天气）的可运行 Web 原型 + 统一演示数据 + 截图证据链。
> **与生产完全隔离**：本实验室位于独立目录 `D:\OurTrail-UI-Lab`（非 git 仓库），对生产仓库 `D:\OurTrail` 零写入。

---

## 1. 目录结构

```
D:\OurTrail-UI-Lab\
├─ docs\ui-design\visual-direction-lab\   # 文档（本目录）
│  ├─ README.md                           # 本文件
│  ├─ _audit-notes.md                     # 阶段 0 审计工作笔记（内部）
│  ├─ baseline.md                         # 现状审计
│  ├─ style-directions.md                 # 六套风格定义（方向契约）
│  ├─ design-tokens.md                    # 令牌契约与六风格令牌表
│  ├─ evaluation.md                       # 评审标准、评分与结果
│  ├─ production-migration-plan.md        # 生产迁移方案（只规划，不执行）
│  ├─ final-report.md                     # 最终报告（A–F 结论与 F 延伸节）
│  ├─ style-F-decisions.md                # F 融合决策记录（grill-me）
│  ├─ style-F-polish-list.md              # F 整改作业单与收口记录
│  └─ round-2-polish-spec.md              # A–E 二轮打磨规范
├─ prototype\                             # 可运行原型
│  ├─ index.html                          # 原型入口（设备壳 + 切换器）
│  ├─ compare.html                        # 六风格对照表 (contact sheet)
│  ├─ css\tokens.css                      # 共享令牌（A–E 字面量；F 自含于 F.css）
│  ├─ css\styles\{a..f}.css + css\components.css
│  ├─ js\data.js                          # 统一演示数据（六风格只读同一份）
│  ├─ js\styles\{A..F}\index.js           # 各风格页面渲染与交互（结构差异是硬要求）
│  ├─ assets\photos\                      # 9 张 Unsplash 授权实景（自生产仓库复制，含来源 README）
│  └─ tools\ { serve.mjs, capture.mjs, dom-check.mjs, test-browser.mjs }
└─ prototype\screenshots\                 # 截图证据（176 张，见 §4）
```

## 2. 快速开始

```powershell
# 在 D:\OurTrail-UI-Lab\prototype 下
node tools/serve.mjs 4173          # 零依赖静态服务器
# 打开 http://127.0.0.1:4173/index.html
```

浏览器**手机模拟视口**查看效果最佳（Chrome DevTools → 390×844）。

## 3. 原型查看与切换

### 3.1 入口参数（index.html）

| 参数 | 取值 | 说明 |
|---|---|---|
| `style` | `A`/`B`/`C`/`D`/`E`/`F` | 视觉方向 |
| `page` | `discover`/`detail`/`collab`/`weather` | 代表页面 |
| `vp` | `375`/`390`/`414` | 视口宽（高 667/844/896） |
| `bare` | `1` | 沉浸式：只渲染设备视口，隐藏实验室外框 |
| `state` | `empty`/`error`/`disabled` | 协作页状态演示（空态/错误态/禁用态） |

例：`http://127.0.0.1:4173/index.html?style=C&page=weather&vp=390&bare=1`

### 3.2 页内交互（每风格都必须实现，允许形态不同）

- 发现页：筛选 tabs、搜索。
- 详情页：主 CTA（报名/加入，点击后 → 加载中 → 「已报名 · 待审核」+ toast）。
- 协作页：签到交互（状态词/进度变化）、标签页（总览/名单/分车/现场）。
- 天气页：日卡/时段切换、窗口结论。

### 3.3 对照表（compare.html）

```powershell
# 浏览器打开（ec. ?pages=discover 单页对照）
http://127.0.0.1:4173/compare.html?vp=390&scale=0.62
http://127.0.0.1:4173/compare.html?pages=detail&styles=A,B,C,D,E,F&vp=390
```

同一演示数据、同一操作、同一 390 宽下，六风格 iframe 矩阵并排对照。参数：`styles`（默认 A,B,C,D,E,F）、`pages`（默认四页）、`vp`、`scale`。

## 4. 截图驱动（capture.mjs，Playwright headless）

```powershell
# 标准配方：起服务器 → 截图 → 关服务器（PowerShell）
$srv = Start-Process node -ArgumentList 'tools/serve.mjs','4173' -PassThru -WindowStyle Hidden; Start-Sleep 2
$env:LAB_BASE='http://127.0.0.1:4173/index.html'
node tools/capture.mjs                     # 全矩阵：6 风格 × 4 页面 × 3 视口 × fold/full = 144 张
node tools/capture.mjs --style=A,C --page=discover --vp=390 --kind=full   # 可任意过滤
node tools/capture.mjs --only=states       # 只重跑交互状态组图（24 张）
node tools/capture.mjs --compare           # 生成 5 张对照表整页截图（all + 四页单行）
Stop-Process -Id $srv.Id -Force
```

- `--kind=fold` 首屏 / `--kind=full` 整页（full 会展开滚动链并把 sticky/fixed 操作条临时置为流内静态，属截图工具行为，不改产品）。
- 等待条件：`window.__LAB_READY__ === true`；图片 decode 后截屏。
- `--compare` 结束后表体含 24 个 iframe，等待 1.5s 渲染再整页截图。

### 截图命名（`prototype\screenshots\`）

```
{style}-{page}-{vp}-{fold|full}.png                  # 矩阵 144 张
{style}-collab-{empty|error|disabled}-390-fold.png   # 状态 18 张
{style}-detail-after-cta-390-fold.png                # 按钮反馈终态 6 张（900ms 处捕获）
{style}-{discover|detail|weather}-error-390-fold.png # F 补充错误态 3 张
compare-{all|discover|detail|collab|weather}-390.png # 对照表 5 张
```

## 5. 语法检查配方

原型是零构建原生 JS（ESM）。改完 `.js` 后：

```powershell
Copy-Item js\styles\E\index.js "$env:TEMP\otcheck\E.mjs" -Force
node --check "$env:TEMP\otcheck\E.mjs"     # 通过即静默退出 0
```

## 6. 环境

- Node v24.19.0 / npm 11.17.0（仅原型工具链使用）。
- `prototype\node_modules` 内 **playwright@1.63.0**（headless chromium）。这是实验室内唯一 npm 依赖，**不属于生产项目**；生产小程序为原生 WXML/WXSS、零 npm 依赖。
- 截图素材：`assets\photos\` 系自 `D:\OurTrail\miniprogram\assets\photos\` **复制**（非移动），Unsplash 授权，来源登记见其 README。

## 7. 验证边界（务必知悉）

- Web 原型验证**不能替代**微信小程序真机验收（WXSS 渲染、容器能力、手势、安全区均有差异）。
- 自动化矩阵以 390×844 为主评审视口；375/414 为整页抽检，未逐张评审。
- 权威文档索引：六套风格定义 → `style-directions.md`；令牌 → `design-tokens.md`；评分与结论 → `evaluation.md`；迁移 → `production-migration-plan.md`；现状审计 → `baseline.md`；最终报告 → `final-report.md`。
