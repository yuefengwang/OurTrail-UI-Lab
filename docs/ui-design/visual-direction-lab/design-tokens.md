# Design Tokens 契约 — Visual Direction Lab

> 本文件定义原型的**令牌契约**：`prototype/css/tokens.css` 按此实现 A–E；第六风格 F、第七风格 G 的完整令牌层分别自含于 `prototype/css/styles/F.css` 与 `prototype/css/styles/G.css` 的 `[data-style="F"]`／`[data-style="G"]` 块（同契约、同令牌名，专属扩展 `--f-*` 见 §2.4、`--g-*` 见 §2.5）。
> 规则：组件样式只消费 `--lab-*` 令牌；**任何组件 CSS 不得出现硬编码颜色/字号/圆角**。
> 风格差异应优先通过令牌表达；令牌无法表达的（布局/结构）才写入各风格自己的 CSS 与渲染函数。
>
> 与生产对齐：令牌命名采用语义角色制（可一一映射回 `miniprogram/app.wxss` 的
> `--forest/--paper/--ink/...` 及将来重构后的设计系统）；值为**字面量**（WXSS 兼容，无 color-mix）。

---

## 1. 命名契约（所有风格共享同一套令牌名）

### 1.1 颜色（19 个）

| 令牌 | 角色 | 用在哪 |
|---|---|---|
| `--lab-bg` | 页面底色 | 页面根 |
| `--lab-surface` | 表面层 | 弹层、表单、需要与底色区分的块 |
| `--lab-surface-2` | 次级表面 / 色调带 | C 的色带、E 的深色块替代（深色块用 `--lab-dark-block`+`--lab-on-dark` 单列） |
| `--lab-text-1` | 一级文字 | 标题、正文强调 |
| `--lab-text-2` | 二级文字 | 说明、次要事实 |
| `--lab-text-3` | 三级文字 / 单位 / 禁用 | 单位后缀、脚注、禁用文字 |
| `--lab-border` | 常规分隔线 | 1px 发丝线、表格线 |
| `--lab-border-strong` | 强分隔线 | B 的 2px section rule、E 的分区条 |
| `--lab-brand` | 品牌色 | 品牌元素、品牌文字、次级动作 |
| `--lab-action` | 主操作底色 | 主按钮背景 |
| `--lab-action-text` | 主操作文字 | 主按钮文字 |
| `--lab-accent` | 限量强调色 | A 的陶土、D 的数据重点、E 的远征黄、F 的锈色（仅警示语义）、G 的浅橙（限量强调）；未使用该角色的风格允许置为与 brand 同值并备注 |
| `--lab-success` | 成功/正常 | 状态、LED、徽标 |
| `--lab-warning` | 注意 | 待审核、临近截止 |
| `--lab-danger` | 危险/错误 | 错误态、取消 |
| `--lab-info` | 信息 | 中性提示 |
| `--lab-dark-block` | 深色块底（E/B 用，其他风格置为 `--lab-brand`） | 页头、状态区 |
| `--lab-on-dark` | 深色块上文字 | |
| `--lab-overlay` | 遮罩 | 弹层 scrim |
| `--lab-photo-filter` | 图片处理（实验用） | C 的降饱和实验 `saturate(.82) sepia(.08)`；其他风格 `none` |

状态色的**使用方式**（填充/描边/文字+点/整行）是风格差异，令牌本身只定义色值。

### 1.2 字体（共享族 + 分级规格）

| 令牌 | 说明 |
|---|---|
| `--lab-font-family` | `-apple-system, "PingFang SC", "Helvetica Neue", Arial, sans-serif`（七风格共用，模拟小程序默认栈；F 另有 `--f-serif` 专属衬线，见 §2.4；G 展示层以 `--g-sans`（Inter 置首）另起一轨、正文沿用共享栈，见 §2.5） |
| `--lab-display-size/weight/lh/ls` | Display 级 |
| `--lab-title-size/weight/lh` | 页面标题级 |
| `--lab-section-size/weight/lh` | 区块标题级 |
| `--lab-kicker-size/weight/ls` | 眉题/标签级 |
| `--lab-body-size/weight/lh` | 正文级 |
| `--lab-caption-size/weight/lh` | 辅助级 |
| `--lab-data-size/weight` | 数据大数值级（D/E 重点用） |
| `--lab-num-spacing` | `tabular-nums`（全员强制） |

### 1.3 空间与尺寸（8 个）

| 令牌 | 说明 |
|---|---|
| `--lab-space-1..8` | 间距标尺：4 / 8 / 12 / 16 / 20 / 24 / 32 / 40（各风格可改变**使用方式**，标尺本身保持一致以便对照） |
| `--lab-page-x` | 页面左右边距 |
| `--lab-section-gap` | 区块间距 |
| `--lab-row-h` | 列表行基准高 |
| `--lab-touch` | 触控目标：44 / 48 |
| `--lab-action-h` | 操作高度：44 / 48 / 52 |

### 1.4 形态与深度（6 个）

| 令牌 | 说明 |
|---|---|
| `--lab-radius-img` / `--lab-radius-btn` / `--lab-radius-card` / `--lab-radius-chip` | 圆角 |
| `--lab-shadow-1` | 浮层（toast/弹层） |
| `--lab-shadow-2` | 模态（可选，默认同 1） |
| `--lab-border-width` | 1（全员 1px；B 另有 `--lab-rule-strong-w: 2px`） |

### 1.5 图标与动效（5 个）

| 令牌 | 说明 |
|---|---|
| `--lab-icon-size` / `--lab-icon-stroke` | 18–20 / 1.5–2 |
| `--lab-motion-fast` / `--lab-motion` | 120ms / 180ms |
| `--lab-ease` | `cubic-bezier(.2,.65,.3,1)` |

---

## 2. 七风格令牌实例表

同一套令牌名，七套值。**这是七风格的"最小差异面"，先保证令牌层差异真实存在。**

> 注：F、G 列数值分别取自 `css/styles/F.css` 与 `css/styles/G.css` 的 `[data-style="F"]`／`[data-style="G"]` 令牌块（F、G 自含令牌层，不依赖 `tokens.css`）；未在各自样式表重写的属性沿用共享默认。

### 2.1 颜色

| 令牌 | A 山野编辑 | B 瑞士功能 | C 静野 | D 野外仪表 | E 远征现代 | F 山野工坊 | G 橙白运动 |
|---|---|---|---|---|---|---|---|
| `--lab-bg` | `#F7F4EC` | `#F4F5F3` | `#F1EFE8` | `#F2F3EF` | `#EFEDE7` | `#F5F1E5` | `#F7F7FA` |
| `--lab-surface` | `#FFFFFF` | `#FFFFFF` | `#F8F6F0` | `#FBFBF9` | `#FFFFFF` | `#FFFDF6` | `#FFFFFF` |
| `--lab-surface-2` | `#EFEBDD` | `#ECEEEB` | `#E8E5DB` | `#E9ECE5` | `#E4E1D8` | `#EBE4D1` | `#F0F0F5` |
| `--lab-text-1` | `#1B241F` | `#101413` | `#303630` | `#1E241F` | `#1C201B` | `#1E2A23` | `#242428` |
| `--lab-text-2` | `#66705F` | `#5A615D` | `#707668` | `#5C645C` | `#666D63` | `#5E6A5B` | `#494950` |
| `--lab-text-3` | `#8A917F` | `#8A908C` | `#93998C` | `#8B928A` | `#8D938A` | `#87907F` | `#6D6D78` |
| `--lab-border` | `#E4DDCB` | `#D7DAD6` | `#DFDCD0` | `#D3D7CF` | `#D9D5C9` | `#DBD3BC` | `#F0F0F5` |
| `--lab-border-strong` | `#233029` | `#1E2321` | `#C9C6BA` | `#A9B0A4` | `#20241F` | `#1E2A23` | `#242428` |
| `--lab-brand` | `#234B3C` | `#16201C` | `#4C5F49` | `#274C3F` | `#1F5C43` | `#27503F` | `#FC5200` |
| `--lab-action` | `#234B3C` | `#16201C` | `#4C5F49` | `#274C3F` | `#20241F` | `#1C4433` | `#CC4200` |
| `--lab-action-text` | `#F7F4EC` | `#FFFFFF` | `#F4F2EA` | `#F6F7F4` | `#F2F0E9` | `#F5F1E5` | `#FFFFFF` |
| `--lab-accent` | `#A8562E` | `#16201C`（无强调色，跟随主色） | `#7A8B6F`（苔点） | `#A06A12`（警示琥珀） | `#D9A227` | `#A9542B`（锈色，仅警示语义） | `#FC6100`（浅橙，限量强调） |
| `--lab-success` | `#2F6B4C` | `#1F7A4D` | `#55755A` | `#2C6B4A` | `#2E7D4F` | `#2F6B4C` | `#2F6B4C` |
| `--lab-warning` | `#8F6A1F` | `#A96B00` | `#8F7345` | `#A06A12` | `#B07C12` | `#8A6A20` | `#8A6A20` |
| `--lab-danger` | `#A93F33` | `#B3372B` | `#9C5A50` | `#A63B2E` | `#B23B2E` | `#A0402F` | `#A0402F` |
| `--lab-info` | `#46657A` | `#2C5F7C` | `#5B7080` | `#34586E` | `#47687C` | `#44647A` | `#44647A` |
| `--lab-dark-block` | `#182019` | `#16201C` | `#3E4A3C` | `#24322A` | `#20241F` | `#1E2A23` | `#0F0F0F` |
| `--lab-on-dark` | `#F6F3EA` | `#FFFFFF` | `#F1EFE8` | `#EFF2EC` | `#F2F0E9` | `#F6F3EA` | `#FFFFFF` |
| `--lab-overlay` | `rgba(24,32,25,.5)` | `rgba(16,20,19,.5)` | `rgba(62,74,60,.42)` | `rgba(30,36,31,.5)` | `rgba(32,36,31,.55)` | `rgba(30,42,35,.5)` | `rgba(36,36,40,.5)` |
| `--lab-photo-filter` | `none` | `none`（图片功能化，可 `grayscale(.2)`） | `saturate(.82) sepia(.08)` | `none` | `brightness(.86) contrast(1.02)` | `saturate(.94)` | `none`（照片满幅不加滤镜） |

### 2.2 字体规格（px，390 基准）

| 令牌组 | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| display | 30/700/1.25/-0.3 | 28/700/1.2/-0.4 | 26/600/1.35/0 | 24/700/1.25/0 | 32/800/1.15/-0.5 | 30/700/1.25/-0.3 | 30/700/1.15/-0.4 |
| title | 26/700/1.3 | 20/700/1.3 | 22/600/1.4 | 20/700/1.3 | 24/800/1.2 | 25/700/1.3 | 24/700/1.2 |
| section | 17/600/1.4 | 16/700/1.4 | 16/600/1.45 | 15/700/1.35 | 18/700/1.3 | 17/600/1.4 | 18/700/1.3 |
| kicker | 11/600/1.6/+1.4 | 12/700/1.5/+1.0 | 12/500/1.5/+0.6 | 11/600/1.5/+0.8 | 11/700/1.5/+1.5 | 11/600/1.6/+1.4 | 11/600/1.5/+0.4 |
| body | 15/400/1.6 | 14/400/1.55 | 15/400/1.65 | 13.5/400/1.5 | 14.5/400/1.6 | 15/400/1.6 | 15/400/1.5 |
| caption | 12/400/1.5 | 11/500/1.5 | 12/400/1.6 | 11/400/1.5 | 12/400/1.55 | 12/400/1.5 | 13/500/1.4 |
| data 大数值 | 20/700 | 22/700 | 18/600 | 28/700 | 32/800 | 20/700 | 32/700 |

### 2.3 空间 / 形态 / 图标 / 动效

| 令牌 | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| `--lab-page-x` | 24 | 20 | 22 | 16 | 20 | 20 | 16 |
| `--lab-section-gap` | 32 | 20 | 28 | 20 | 24 | 24 | 20 |
| `--lab-row-h` | 64 | 48 | 60 | 44 | 56 | 56 | 56 |
| `--lab-touch` | 44 | 44 | 48 | 44 | 44 | 44 | 44 |
| `--lab-action-h` | 48 | 44 | 48 | 44 | 52 | 48 | 48 |
| `--lab-radius-img` | 2 | 0 | 10 | 2 | 2 | 2 | 10 |
| `--lab-radius-btn` | 6 | 0 | 10 | 3 | 2 | 4 | 4 |
| `--lab-radius-card` | 8 | 0 | 12 | 3 | 2 | 2 | 8 |
| `--lab-radius-chip` | 999 | 2 | 999 | 2 | 999 | 2 | 999 |
| `--lab-shadow-1` | `0 8px 24px rgba(27,36,31,.14)` | `0 8px 24px rgba(16,20,19,.16)` | `0 8px 24px rgba(48,54,48,.12)` | `0 8px 24px rgba(30,36,31,.14)` | `0 8px 24px rgba(32,36,31,.18)` | `0 8px 24px rgba(30,42,35,.14)` | `0 8px 24px rgba(36,36,40,.14)` |
| `--lab-icon-size` | 20 | 16 | 20 | 18 | 20 | 18 | 20 |
| `--lab-icon-stroke` | 1.5 | 1.5 | 1.5 | 2 | 2 | 1.5 | 2 |
| `--lab-motion` | 180ms | 140ms | 220ms | 140ms | 160ms | 160ms | 180ms |
| `--lab-ease` | 全员 `cubic-bezier(.2,.65,.3,1)` | 同 | 同 | 同 | 同 | 同 | 同 |

### 2.4 F 专属令牌（`--f-*`，F.css 自含层）

F 的质感部分来自共享令牌无法表达的扩展（衬线族、纸张两级、图形高度），在 `[data-style="F"]` 内单列（其余全部沿用共享令牌名）：

| 令牌 | 值 | 用途 |
|---|---|---|
| `--f-serif` | `Georgia, "Songti SC", "Noto Serif SC", "SimSun", serif` | 展示/标题衬线族（F 签名元素） |
| `--f-cover-h` / `--f-lead-h` / `--f-thumb` | 244px / 156px / 72px | 头条 / 专题领图 / 工位缩略图高度 |
| `--f-profile-h` / `--f-spark-h` | 96px / 112px | 海拔剖面 / 48 小时曲线高度 |
| `--f-paper-sheet` / `--f-paper-oat` | `#FFFDF6` / `#EBE4D1` | 纸张两级（sheet / oat） |
| `--f-ledger-size` / `--f-ledger-weight` | 18px / 700 | 账本数字规格 |
| `--f-state-quiet` / `--f-state-error` | `#8A8375` / `#A9542B` | 空态 / 错误态（错误=锈色） |
| `--f-move-fast` / `--f-move` | 150ms / 210ms | 动效快/常两档 |

### 2.5 G 专属令牌（`--g-*`，G.css 自含层；2026-10-19 增补）

G 照 F 的四类扩展（字族 / 线色 / 图形高度 / 动效两档）在 `[data-style="G"]` 内单列（其余全部沿用共享令牌名）：

| 令牌 | 值 | 用途 |
|---|---|---|
| `--g-sans` | `Inter, -apple-system, "PingFang SC", "Helvetica Neue", Arial, sans-serif` | 展示/标题字族（Inter 置首；未装逐级回落，零网络字体） |
| `--g-hairline` | `#DFDFE8`（Silver） | chip 描边 / 分段轨道 / 卡内浅分隔 |
| `--g-orange` | `#FC5200`（O50） | 品牌橙：实心 kudos / 路线折线 / 激活指示条 / PR chip 底（仅图形通道） |
| `--g-orange-dark` | `#CC4200`（O60） | CTA 橙：白底文字 / 白字实心按钮底（4.83:1） |
| `--g-orange-light` | `#FC6100`（O40） | 浅橙：featured 卡顶规 / tab 悬停指示（限量强调） |
| `--g-cover-h` | `200px` | feed 卡头图高度（hero 同档，满幅） |
| `--g-avatar` | `40px` | 成员行 / kudos 行圆形头像 |
| `--g-move-fast` / `--g-move` | `120ms` / `180ms` | 动效快/常两档 |

> 注：G 的 kicker 行高绑定共享 `--lab-body-lh`（1.5，不设独立令牌，与 F 同型）；展示层字族经 `--g-sans` 另起一轨、正文消费共享 `--lab-font-family`（G.css L112–122 注释在案，审计报告已备案）。

---

## 3. 令牌 → 组件消费规则（通用）

| 组件 | 消费令牌 | 风格差异点（在组件 CSS 允许，在组件结构不允许随意换） |
|---|---|---|
| 按钮（主） | `--lab-action` / `--lab-action-text` / `--lab-radius-btn` / `--lab-action-h` | B 方角、E 全宽条 |
| 按钮（次） | `--lab-brand`（文字/描边）/ `--lab-border` | A 文字链、B 线框方角、C 软描边 |
| 状态徽标 | 语义色 | A 小字+色字、B 1px 边框矩形、C 文字+圆点、D 状态点+词、E 色块+编号 |
| 列表行 | `--lab-row-h` / `--lab-border` / 文字级 | D 左日期块 + 右事实栈；B 表格化；C 留白分隔（无线） |
| 事实行 | `--lab-text-2` / 数字 tabular | A 行内 `¸` 连接、B 标签值两列、D 单位常显 |
| 标签 chip | `--lab-radius-chip` / `--lab-surface-2` | B/E 方角 vs A/C pill |
| 弹层/toast | `--lab-surface` / `--lab-shadow-1` / `--lab-overlay` | 七风格一致（弹层不参与大差异） |
| 图片 | `--lab-radius-img` / `--lab-photo-filter` | C 统一滤镜、E 统一压暗 |

## 4. 禁止项（原型实现红线）

1. 组件 CSS 硬编码颜色/字号/圆角（例外：图表数据色可以用具名常量集中在各风格 CSS 顶部注释中）。
2. 使用 `color-mix()`、`:has()`、`backdrop-filter`、`dvh`（WXSS 迁移红线，任务 §10 要求原型可迁移）。
3. 为「好看」引入渐变背景（scrim 压字渐变除外，且必须实测文字对比度）。
4. 七风格共用同一 DOM 仅换 CSS（结构差异是硬要求）。
5. 删除/隐藏任何演示数据字段造成的"密度差异"。

## 5. 迁移含义（写进最终迁移方案时引用）

- 本令牌表验证了一件事：**内容面可以不依赖阴影/渐变/Houdini 效果，仅靠色板 + 排版 + 分隔 + 留白撑起七种气质**——这与 WXSS 的渲染能力边界一致。
- 七风格令牌实例表可直接作为「新设计系统的 token 候选池」：中选风格的令牌会被映射回
  `app.wxss` 的全局变量（例如 `--lab-bg` → `--paper`），并保留 40 变量体系的扩展方式。
- 必须被打包进迁移清单的实验期产物：`--lab-photo-filter`（生产需改为图片预处理）、
  `--lab-num-spacing`（check 需确认 WXSS 支持）、深色块对比度审计（E）。
