# Style G — 波后审计报告（audit-post）

> 依据 `.omo/style-G/style-G-audit-plan.md`（预登记）；波内验证判据见 `style-G-brief.md` §5。
> 审计执行：2026-10-19（G 波后）｜结论：**PASS（放行）**。
> 证据目录：`.omo/style-G/audit-post/`；基线冻结：`.omo/style-G/backup-pre/`。

---

## 0. 结论摘要

G 波（第七风格交付 ＋ A–F 代际修复重拍）通过波后审计：截图证据链与预登记一致（3 项表外差异均有解释，亦可放行）；dom-check 双批 ALL-PASS；零删除、零生产写入；5 份 docs 已同步七风格口径。

| 审计项 | 结果 |
|---|---|
| 截图清单（MD5 对表） | pre 176 → post 204：**增 28（全 G）/ 变 94 / 稳 82 / 删 0** ✅ |
| 预登记对表（审计预案 §1） | 98/78 预登记 → 94/82 实获；差 −7/+2/+1 逐条解释（§2–§3）✅ |
| dom-check（G 新增 ＋ F 回归） | G 24/24 ＋ F 24/24 = ALL-PASS；pageerror 0 · 溢出 NONE · <11px NONE ✅ |
| 语法 | `node --check` 14/14（核心 10 ＋ 工具 4，审计期复跑）✅ |
| 计数 | PNG 204（G-* 28）· `screenshots/md5.csv` 205 行（1 表头 ＋ 204）✅ |
| 残留词 | prototype 侧「五套/五风格/六套/六风格」= 0；docs 侧仅存历史表述 ✅ |
| 红线 | `D:\OurTrail` 零写入；截图 0 删除；无 git；`evaluation.md` 未动 ✅ |

## 1. 范围与基线

- **对象**：第七风格 G（Strava Athletic）实装后的全库截图证据链 ＋ 原型代码 ＋ 文档口径。
- **基线**：`backup-pre/screenshots-MD5-pre.txt`（176 张，波前冻结）。构成 = 三代合成：10-18 上午五/六代 A–E 60＋15＋5、F 轮 36、F 扫尾 A–E full 60。
- **工具**：`%TEMP%\opencode\md5-diff.mjs`（自测 pre↔pre = 176 稳/0 变/0 增/0 删）；副本随报告落盘 `audit-post/md5-diff.mjs`（MD5 `2D77B62B7B114EE5058DC774B2211AB5`）。
- **backup-pre/（16 件）**：`screenshots-MD5-pre.txt`、`dom-check-pre.txt`、`MANIFEST.md5.txt`、`docs__…__README.md`、`prototype__{index,compare}.html`、`prototype__js__app.js`、`prototype__js__styles__{A..F}__index.js`（6）、`prototype__tools__{capture,dom-check}.mjs`。

## 2. 预登记对表（审计预案 §1）

| 类别 | 预登记 | 实获 | 差 |
|---|---|---|---|
| 变 | 98 | **94** | −4 |
| 稳 | 78 | **82** | +4 |
| 增 | 28 | 28 | 0 |
| 删 | 0 | 0 | 0 |
| 总量 | 204 | 204 | 0 |

差 −4 分解（全部可解释；表外条目逐条给出证据）：

1. **−7（预期变、实稳）**：collab 状态组预期 18 全变（A–E 五代 → 七代），实变 11。7 张重拍后**字节全同**：`D-collab-empty-390-fold` ＋ 6 张 `collab-disabled-390-fold`。原因：这些 fold 视口内**不含页脚**（页面高度超过首屏），五/六/七 页脚常量变更不影响像素。视觉抽验：`A-collab-disabled-390-fold` 首屏止于「成员 · 显示前 5 位」、`D-collab-empty-390-fold` 止于「名单为空」——均未到页脚。✅
2. **+2（表外变）**：`B-collab-390-fold` / `B-collab-414-fold`。原因：B 协作页体量最小，390/414（844/896 高）下**整页含页脚落入首屏**，页脚 六→七 即像素差；375（667 高）不含页脚故稳定。视觉抽验：`B-collab-390-fold` 底部可见「同一演示数据 · 七风格对照实验」。✅
3. **+1（表外变）**：`C-detail-after-cta-390-fold`。原因：900ms 捕获点恰落于反馈动画窗口（帧相位差）；重拍内容与功能一致，属**良性噪声**、不构成回归。✅

## 3. 94 变的分组归因（含 82 稳的构成）

| 组 | 张数 | 归因 |
|---|---|---|
| A–F full ×12 | **72** | 页脚常量 六→七（每风格 4 页 × 3 视口） |
| collab 状态组 | **11** | empty 5/6（A/B/C/E/F）＋ error 6/6 ＋ disabled 0/6（后两类见 §2.1 页脚可见性） |
| B-collab-390/414-fold | **2** | 页脚落入首屏（§2.2） |
| C-detail-after-cta-390-fold | **1** | 动画窗口（§2.3） |
| F err trio | **3** | `F-{detail,discover,weather}-error-390-fold` 重出（六→七） |
| compare ×5 | **5** | 6→7 列（列宽随 STYLES.length 变化） |
| **合计** | **94** | |

82 稳的构成：A–F fold 70（除 B×2：重拍字节全同）＋ collab 状态 7（D-empty ＋ disabled ×6）＋ 反馈 5（A/B/D/E/F after-cta）。

## 4. 回归与确定性证据

1. **dom-check**（`audit-post/dom-check-post.txt`，2026-10-19 01:25）：G `24 pass / 0 fail · ALL-PASS`；F 回归 `24 pass / 0 fail · ALL-PASS`。分区 0/5/3/4；pageerror 全 0；溢出 NONE；<11px 文本 NONE。（日志中文为 GBK 落盘乱码，数字与结构可读。）
2. **语法**：审计期复跑 `node --check` **14/14**——`app.js`、`data.js`、`render-common.js`、`styles/{A..G}/index.js`×7、`tools/{serve,capture,dom-check,test-browser}.mjs`×4（转存 .mjs 后按 ESM 检查）。
3. **计数**：`prototype/screenshots` PNG **204**（G-* **28**）；`md5.csv` **205 行**（表头 ＋ 204 行 name/Hash，与 `screenshots-MD5-post.txt` 同源）。
4. **重拍可复现性**：波内全矩阵/状态组重拍后 **82 张与基线逐字节相同**（含 70 张 A–F fold、5 张反馈、7 张状态）——截图管线确定性成立；94 张变化逐条有责（§3），无未归因项。
5. **残留词审计**：prototype（js/css/html）「五套｜五风格｜六套｜六风格｜六个候选」= **0**；docs 侧残留仅为有意保留的历史表述（style-F-*.md、round-2-polish-spec、evaluation、final-report §9、baseline）或计数性表述（「第六风格 F／第七风格 G」）。

## 5. 行数口径定论

- 真实行数（node LF 口径，UTF8/ReadAllLines 三方一致）：`G.css` **1751** ／ `js/styles/G/index.js` **1588** ／ `js/app.js` **212**。
- PowerShell 默认 `Get-Content` 对无 BOM UTF-8 中文按 GBK 解码、行数误判（伪迹）——本文档及一切计数均以 node LF 口径为准。

## 6. 偏差备案（3 项）

1. **审计工具**：`tools/dom-check.mjs` 判定选择器追加 `.g-zone`（G 页面分区采样）；仅审计工具、不进产品；判据沿用 brief §5。
2. **字族两轨**：G 展示层 `--g-sans`（Inter 置首、零网络字体、逐级回落共享栈）＋正文共享 `--lab-font-family`；`G.css` L112–122 注释在案；已在 `design-tokens.md` §2.5 与 `style-directions.md` G.1/G.3 备案。
3. **kicker 行高**：绑定共享 `var(--lab-body-lh)`（1.5），不设独立令牌（与 F 同型，`G.css` L182）；G.4 表述采「与 D 并列最紧」（D 为 16–20 区间含 16，不作「七套最紧」断言）。

## 7. 红线核对

- `D:\OurTrail`：8521 文件实测、**0 写入**（生产完全隔离）。
- **无 git 操作**（实验室非仓库目录）；截图 **0 删除**（removed=0；backup-pre 与 pre 清单留档）。
- `evaluation.md`、`_audit-notes.md`、`tokens.css`、`render-common.js` 未动；docs 保持 11 份（G 档案留 `.omo/style-G/`）。
- 禁项扫描（波内＋审计）：无 `color-mix()` / `:has()` / `backdrop-filter` / `dvh` / 渐变背景 / `@font-face` / 网络字体 / `inline on*`。

## 8. 档案索引

```
.omo/style-G/
├─ style-G-decisions.md      # 决策与白名单（grill-me 记录）
├─ style-G-brief.md          # G 波任务书（实现规格 ＋ §5 验证判据）
├─ style-G-audit-plan.md     # 本审计预登记
├─ backup-pre/               # 波前冻结（16 件，见 §1）
└─ audit-post/
    ├─ audit-report.md           # 本报告
    ├─ screenshots-MD5-post.txt  # post 清单（204 行）
    ├─ md5-diff-report.txt       # 对表明细（94 变 / 28 增逐条）
    ├─ dom-check-post.txt        # G 24/24 ＋ F 24/24
    └─ md5-diff.mjs              # 对表工具副本（MD5 2D77B62B7B114EE5058DC774B2211AB5）
```

---

**复核路径**：md5-diff-report.txt（§2/§3 逐条）→ dom-check-post.txt（§4.1）→ screenshots-MD5-post.txt 与 `screenshots/` 实例（§4.3）→ backup-pre/（§1 基线）。
**文档同步**：`final-report.md` §10、`design-tokens.md` §2.5、`style-directions.md` G 章＋§4、`README.md`、`production-migration-plan.md` 已同步七风格口径（evaluation.md 保持六风格评分历史不动）。
