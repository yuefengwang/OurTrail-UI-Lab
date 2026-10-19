# Style G — 后波审计预案（预登记 · 主会话）

> 基线与工具：`backup-pre\screenshots-MD5-pre.txt`（176 张，预波冻结）＋ `%TEMP%\opencode\md5-diff.mjs`（已自测：pre↔pre = 176 稳 / 0 变 / 0 增 / 0 删）
> 波内验证以 `style-G-brief.md` §5 为准；本预案 = **波后审计与代际修复**的预登记。

---

## 0. 截图层代际考古（mtime 实测，2026-10-18/19）

| 批次 | 数量 | 内容 | 代际判定 |
|---|---|---|---|
| 10-18 07:53–08:49 | 80 | A–E fold 60 ＋ A–E collab 三态 15 ＋ A–E 反馈 5 | **五**：状态图页脚显示「五风格对照实验」→ 陈旧 |
| 10-18 13:29–13:30 | 36 | F 矩阵 24 ＋ F 态 3 ＋ F 反馈 1 ＋ F 补充错误态 3 ＋ compare 5 | 六（F 轮） |
| 10-18 15:42–15:43 | 60 | A–E full 重出（F 轮扫尾） | 六 |
| 10-19 00:09+ | 16+ | G 波 `capture --style=G` 进行中 | 七（G） |

合计：80＋36＋60 = 176 基线；＋G 16（进行中）＝ 全量 192（截至首轮盘点）。

**结论**：A–E collab 状态图自 F 轮起未随 五→六 重出（F 轮仅重出 A–E full）；本波 footer 清扫（六→七）会使 F 侧状态图与 F-err trio 同步过期 → 需波后统一重出（§2）。

---

## 1. 预登记差异（波后 vs 基线：**+28 / 变 98 / 稳 78 / 删 0 ⇒ 204**）

- **ADDED 28** ＝ G 矩阵 24（4 页 × 3 视口 × fold/full）＋ G-collab-{empty,error,disabled}-390-fold（3）＋ G-detail-after-cta-390-fold（1）
- **CHANGED 98** ＝
  - 72 ＝ A–F full（页脚 六→七）
  - 18 ＝ A–F collab 三态（七；含 A–E 五→七 代际修复）
  - 3 ＝ F-{detail,discover,weather}-error-390-fold（重出，见 §2.2）
  - 5 ＝ compare-*（6→7 列，列宽随 STYLES.length 变化）
- **UNCHANGED 78** ＝ A–F fold 72（首屏无页脚；波内全矩阵会重拍，像素应稳定）＋ A–F 反馈 6（详情首屏无页脚；如变化 → 定时/动画噪声，抽 1 张查因）
- **REMOVED 0**（截图不删红线）

---

## 2. 波后主会话动作（brief 之外，登记在案）

1. **状态刷新**：`node tools/capture.mjs --states`（默认 A–G）→ collab 态 21 ＋ 反馈 7 统一七口径（修复 A–E 五/六代陈旧、F 六→七）。
2. **F-err trio 重出**：一次性 Playwright 脚本，复刻 `?style=F&page={detail,discover,weather}&vp=390&bare=1&state=error` 的 fold 截图（现役 capture.mjs 不产此组；F 轮产物）。
3. **manifest 重生成 → diff**：
   - `Get-ChildItem -LiteralPath 'D:\OurTrail-UI-Lab\prototype\screenshots' -Filter *.png | Sort-Object Name | ForEach-Object { "$((Get-FileHash -LiteralPath $_.FullName -Algorithm MD5).Hash)  $($_.Name)" } | Set-Content -LiteralPath 'D:\OurTrail-UI-Lab\.omo\style-G\audit-post\screenshots-MD5-post.txt' -Encoding ASCII`
   - `node "$env:TEMP\opencode\md5-diff.mjs" <pre> <post> --out 'D:\OurTrail-UI-Lab\.omo\style-G\audit-post\md5-diff-report.txt'`（工具脚本副本随报告落盘留档）
   - 逐条对表 §1；**表外条目必须给出解释方可放行**。
4. **复核**：六残留 grep（js/css/html）仅剩已知假阳性；计数 204（G-* = 28）；README 168/21/7 与实测一致。

---

## 3. 对审计有影响的事实（已实测）

- `capture.mjs`：fold＝视口截图；full＝展开滚动链后整页；状态组图＝collab 三态＠390 ＋ detail after-cta（L87–108）。
- `app.js:174` 副标题「六套」仅非 bare 面板可见 ⇒ 六→七 **不影响任何 PNG**（截图均带 `bare=1`）。
- `backup-pre` 未含 `base.css` / `data.js`（B9 两文件）——验证口径 = 单注释词变更（六→七）＋ 残留 grep。
- dom-check 判据顺延 brief §5：F 回归 24/24 ＋ G 新增 24/24 ＋ ALL-PASS；行漂移偏差表按波内报告复核。

---

## 4. 交付前收尾

- `final-report.md` §9 增补（七风格 + 本轮代际修复备案）；`design-tokens.md` §2 G 列补录（决策 3 延期项，G 过审后）。
- 交付汇报含 F 轮遗留发现（A–E 状态图）与修复说明。
