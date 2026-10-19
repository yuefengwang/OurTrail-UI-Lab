// Style D — Field Instrument（野外仪表）
// 数据即界面：标签-值-单位成对出现 · 同类数据同格式同精度同对齐 · 图形只在承载数据时出现
// DOM 组织与其它风格不同：仪表面板 / 读数瓦片栅格 / 标定量具 / 座位矩阵 / meteogram SVG。
// 只复用共享原语：el / append / icon / photo / fmt / pad2 / frag。
// 事件一律 el(..., {onclick})；不使用 inline on*、<script>、外部字体或外部资源。
//
// 用色纪律（与 css/styles/D.css §1 一致，两处必须同步）：
//   A. 瓦片强调只有三槽：key（品牌绿 + 定长量程记号，每屏 ≤1）/ alert（warning 色，≤1）/ tint（仅换底色）。
//      状态语义色只进 LED、提示条与状态块，绝不进入瓦片数字。
//   B. 功能色小词典只给「数据变量」：温度暖/冷、降水柱、风标、云量带、夜间阴影；
//      变量色只出现在图形与表格数值列里，瓦片数值不着色。

import { el, append, icon, photo, fmt, pad2, frag } from '../../render-common.js';

/* =========================================================
   0. 通用常量与仪表原语
   ========================================================= */

const SVG_NS = 'http://www.w3.org/2000/svg';
const DNOTE = '同一演示数据 · 七风格对照实验';
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/* 演示基准时刻：集合收尾 10/18 22:05（出发前 5 分钟，与协作场景同一时刻） */
const NOW = new Date(2025, 9, 18, 22, 5);
/* 倒计时量程：出发前 21 天记为「准备进度」满格 */
const HORIZON_H = 21 * 24;
/* 详情页 CTA 三态（演示 theater，不接后端） */
const THEATER = { idle: '加入行程', loading: '提交中…', done: '已报名 · 待审核' };

/* 业务状态 → 语义色（LED 颜色单义：正常 / 注意 / 中止） */
const STATUS_KIND = { open: 'success', hot: 'warning', formed: 'info', ended: 'neutral', cancelled: 'danger' };
const AUDIT_KIND = { 已通过: 'success', 待审核: 'warning', 候补: 'neutral' };

/** SVG 元素构建器（render-common 只提供 HTML 构建器） */
function s(tag, attrs, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.setAttribute('class', v);
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  append(node, children);
  return node;
}

/** MM/DD（从 dateText 解析，不丢原始字段） */
function md(dateText) {
  const m = /(\d{1,2})\s*月\s*(\d{1,2})/.exec(dateText || '');
  return m ? pad2(m[1]) + '/' + pad2(m[2]) : '—';
}

/** HH:MM（从 timeText 解析时刻） */
function hm(timeText) {
  const m = /(\d{1,2}):(\d{2})/.exec(timeText || '');
  return m ? pad2(m[1]) + ':' + m[2] : '—';
}

/** 出发时刻（多日活动取首日；解析失败返回 null） */
function depTime(a) {
  const d = /(\d{1,2})\s*月\s*(\d{1,2})/.exec(a.dateText || '');
  const t = /(\d{1,2}):(\d{2})/.exec(a.timeText || '');
  if (!d) return null;
  return new Date(2025, +d[1] - 1, +d[2], t ? +t[1] : 0, t ? +t[2] : 0);
}

/** 倒计时读数：距出发 X 天 Y 时 / 已结束 / 已取消（label 用于抬头，big 用于大读数） */
function countdown(a) {
  const over = a.statusKey === 'ended' || a.statusKey === 'cancelled';
  if (over) {
    return {
      label: a.statusKey === 'ended' ? '已结束' : '已取消',
      big: '无倒计时',
      text: a.statusKey === 'ended' ? '已结束 · 无倒计时' : '已取消 · 无倒计时',
      ratio: 1, over: true,
    };
  }
  const dep = depTime(a);
  if (!dep) return { label: '出发时间', big: '待定', text: '出发时间待定', ratio: 0, over: true };
  const mins = Math.round((dep - NOW) / 60000);
  if (mins > 0 && mins < 60) {
    const big = `${mins} 分钟`;
    return { label: '距出发', big, text: `距出发 ${big}`, ratio: 1, over: false };
  }
  const h = Math.floor((dep - NOW) / 3600000);
  if (h <= 0) return { label: '已出发', big: '—', text: '已出发', ratio: 1, over: true };
  const d = Math.floor(h / 24);
  const big = d > 0 ? `${d} 天 ${h % 24} 时` : `${h} 小时`;
  return {
    label: '距出发',
    big,
    text: `距出发 ${big}`,
    ratio: Math.min(1, Math.max(0.02, 1 - h / HORIZON_H)),
    over: false,
  };
}

/** 名额读数：已报 / 总数 / 余位 / 占用率 */
function seats(a) {
  return { left: a.seatsTotal - a.signedCount, ratio: a.seatsTotal ? a.signedCount / a.seatsTotal : 0 };
}

/** 仪表抬头：左侧眉题+标题，右侧本屏唯一主读数（大字 + 小一号单位 + 副标） */
function head(kicker, title, right) {
  return el('div.d-hd',
    el('div.d-hd__l',
      el('span.d-hd__k.t-kicker', { text: kicker }),
      el('h1.d-hd__t.t-title', { text: title })
    ),
    right
      ? el('div.d-hd__r',
        el('div.d-hd__n',
          right.label ? el('span.d-hd__u', { text: right.label }) : null,
          el('span.d-hd__num', { text: right.num }),
          right.unit ? el('span.d-hd__u', { text: right.unit }) : null
        ),
        el('div.d-hd__s', { text: right.sub })
      )
      : null
  );
}

/** 状态点 + 词（LED） */
function led(text, kind) {
  return el('span.d-led.d-led--' + (kind || 'neutral'), el('span.d-led__dot'), el('span', { text }));
}

/** 面板（统一面板头 = 标定刻痕 + 标签 + 右侧 meta；right 可为字符串或节点） */
function panel(label, right, cls, ...children) {
  const node = el('div.d-panel' + (cls ? '.' + cls : ''));
  node.appendChild(el('div.d-panel__hd',
    el('div.d-panel__l', { text: label }),
    right ? (typeof right === 'string' ? el('div.d-panel__r', { text: right }) : right) : null
  ));
  children.forEach((c) => c && node.appendChild(c));
  return node;
}

/** 读数瓦片栅格：items = [{label, value, unit, sub, key, alert}]（强调只有 key / alert 两槽） */
function tileGrid(items) {
  return el('div.d-tilegrid', ...items.map((it) =>
    el('div.d-tile' + (it.key ? '.d-tile--key' : '') + (it.alert ? '.d-tile--alert' : ''),
      el('div.d-tile__k', { text: it.label }),
      el('div.d-tile__v',
        el('span.d-tile__num', { text: String(it.value) }),
        it.unit ? el('span.d-tile__u', { text: it.unit }) : null
      ),
      it.sub ? el('div.d-tile__s', { text: it.sub }) : null
    )
  ));
}

/** 行内读数（标签在上 / 值+单位在下） */
function nvs(label, value, unit, cls) {
  return el('span.d-nvs' + (cls ? '.' + cls : ''),
    el('span.d-nk', { text: label }),
    el('span.d-nv', value, unit ? el('em', { text: unit }) : null)
  );
}

/** 计量条（占用率 / 准备进度；密集数据行内使用，量程尺留给 gauge） */
function meter(ratio, cls, fillCls) {
  return el('div.d-meter' + (cls ? '.' + cls : ''),
    el('div.d-meter__f' + (fillCls ? '.' + fillCls : ''), {
      style: { width: Math.round(Math.min(1, Math.max(0, ratio)) * 100) + '%' },
    })
  );
}

/** 标定量具：读数行 → 轨道（填充 + 指针）→ 刻度尺 → 量程数字 → 端点标注
    o = { label, value, unit, ratio, fillCls, left, right } */
function gauge(o) {
  const pct = Math.round(Math.min(1, Math.max(0, o.ratio)) * 100);
  const w = pct + '%';
  /* 指针在 0% / 100% 时贴边内收，不被轨道裁掉 */
  const pin = pct <= 0 ? ['0px', 'none'] : pct >= 100 ? ['100%', 'translateX(-100%)'] : [w, 'translateX(-50%)'];
  return el('div.d-gauge',
    el('div.d-gauge__rd',
      el('span.d-gauge__lb', { text: o.label }),
      el('span.d-gauge__vl',
        o.value ? el('span.d-gauge__v', { text: o.value }) : null,
        o.unit ? el('span.d-gauge__u', { text: o.unit }) : null,
        el('span.d-gauge__p', { text: w })
      )
    ),
    el('div.d-gauge__tr',
      el('div.d-gauge__f' + (o.fillCls ? '.' + o.fillCls : ''), { style: { width: w } }),
      el('div.d-gauge__pin', { style: { left: pin[0], transform: pin[1] } })
    ),
    el('div.d-gauge__rl'),
    el('div.d-gauge__l',
      el('span', { text: '0' }), el('span', { text: '25' }),
      el('span', { text: '50' }), el('span', { text: '75' }), el('span', { text: '100' })
    ),
    el('div.d-gauge__e',
      el('span', { text: o.left }),
      el('span', { text: o.right })
    )
  );
}

/** 标签-值行（值右对齐 tabular；单位/限定语独立成列并留出间隙，长值换行不粘连） */
function kv(k, v, unit, top, key) {
  return el('div.d-kv' + (top ? '.d-kv--top' : '') + (key ? '.d-kv--key' : ''),
    el('div.d-kv__k', { text: k }),
    el('div.d-kv__v',
      el('span.d-kv__n', { text: v }),
      unit ? el('em.d-kv__u', { text: unit }) : null
    )
  );
}

/** 分区标记（标定刻痕 + 眉题 + 右侧计数） */
function sect(label, right) {
  return el('div.d-sect',
    el('div.d-sect__l', { text: label }),
    right ? el('div.d-sect__n', { text: right }) : null
  );
}

/** 提示条（底色分层 + LED；不用彩色边框；冒号前的引导语自动加粗） */
function note(text, kind) {
  const i = text.indexOf('：');
  const lead = i > 0 ? text.slice(0, i + 1) : null;
  const box = el('div.d-note__x');
  if (lead) box.appendChild(el('b', { text: lead }));
  box.appendChild(document.createTextNode(lead ? text.slice(i + 1) : text));
  return el('div.d-note' + (kind ? '.d-note--' + kind : ''), el('span.d-note__led'), box);
}

/** 元信息行（两列栅格：左侧说明可换行，右侧读数定宽右对齐） */
function metaRow(left, right) {
  const node = el('div.d-meta');
  [left, right].forEach((c) => {
    if (c === null || c === undefined || c === false) return;
    node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return node;
}

/** 简报行（天气页的长段落 + 右侧来源定宽） */
function brief(text, source) {
  return el('div.d-brief',
    el('div.d-brief__x', { text }),
    el('div.d-brief__s', { text: source })
  );
}

/** 脚注：固定收尾，声明演示数据 */
function foot(D) {
  return el('div.footnote', el('div', { text: D.credit }), el('div', { text: DNOTE }));
}

/** 状态块（空 / 错 / 缺失）：本语言是「读数缺失」公告——上下规则线 + 左对齐；
    嵌在面板内部时规则线由 CSS 收起，避免与面板边框叠成双线。 */
function framed(iconName, title, body, actionLabel, onAction) {
  return el('div.d-framed',
    el('div.d-framed__r'),
    el('div.state-block',
      icon(iconName),
      el('div.state-block__title', { text: title }),
      el('div.state-block__body', { text: body }),
      actionLabel ? el('button.btn.btn--primary.btn--sm.state-block__action', { type: 'button', text: actionLabel, onclick: onAction }) : null
    )
  );
}
const emptyBlock = (t, b, l, f) => framed('search', t, b, l, f);
const errorBlock = (b, f) => framed('alert', '加载失败', b, '重试', f);

/** 骨架块（高度全部来自令牌） */
const skel = (kind, w) => el('div.skeleton.d-skel--' + kind, w ? { style: { width: w } } : null);

/* =========================================================
   1. 发现 — 出征表（仪表式发现）
   ========================================================= */

const FILTERS = [
  { key: 'all', label: '全部', test: () => true },
  { key: 'open', label: '可报名', test: (a) => a.statusKey === 'open' || a.statusKey === 'hot' },
  { key: 'formed', label: '已成行', test: (a) => a.statusKey === 'formed' },
  { key: 'ended', label: '已结束', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
];

export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const acts = D.activities;
  const page = el('div.page');
  const locked = flag === 'disabled';

  /* ---- 抬头 ---- */
  page.appendChild(head('即将出发 · 按出发时刻升序', '活动索引',
    { num: String(acts.length), unit: '项', sub: '线路在库' }));

  if (flag === 'loading') {
    page.appendChild(frag(
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, tileGrid([
        { label: '开放名额', value: '··', unit: '位' },
        { label: '待报名', value: '·', unit: '场' },
        { label: '最近出发', value: '··/··', unit: '' },
        { label: '已收官', value: '·', unit: '场' },
      ])),
      el('div.d-tools', skel('row', '100%'), skel('row', '100%')),
      ...Array.from({ length: 5 }, () => el('div.d-row.d-row--flat',
        el('div.d-date', skel('m', '32px'), skel('s', '24px')),
        el('div', skel('m', '86%'), el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel('s', '54%'))),
        el('div.d-row__s', skel('s', '40px'), skel('s', '100%'))
      )),
      foot(D)
    ));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(errorBlock('活动索引未能读取，请检查网络后重试；筛选条件将保留。', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 数据带：开放名额 / 待报名 / 最近出发 / 已收官（本屏主读数在抬头，故此处全部无强调色） ---- */
  const open = acts.filter((a) => a.statusKey === 'open' || a.statusKey === 'hot');
  const closed = acts.filter((a) => a.statusKey === 'ended' || a.statusKey === 'cancelled');
  const openSeats = open.reduce((sum, a) => sum + (a.seatsTotal - a.signedCount), 0);
  const soonest = open.slice().sort((x, y) => (depTime(x) || 0) - (depTime(y) || 0))[0] || acts[0];

  page.appendChild(el('div', { style: { marginTop: 'var(--lab-space-3)' } }, tileGrid([
    { label: '开放名额', value: fmt(openSeats), unit: '位', sub: `来自 ${open.length} 场` },
    { label: '待报名', value: String(open.length), unit: '场', sub: '含名额紧张' },
    { label: '最近出发', value: md(soonest.dateText), unit: '', sub: `${soonest.weekdayText} ${hm(soonest.timeText)}` },
    { label: '已收官', value: String(closed.length), unit: '场', sub: '结束 / 取消' },
  ])));

  /* ---- 工具条：分段控制 + 仪表输入 ---- */
  const st = { tab: 'all', q: '' };
  const segWrap = el('div.d-seg');
  const input = el('input', {
    type: 'text',
    placeholder: '活动名 / 路线 / 城市 / 难度',
    disabled: locked,
    oninput: (e) => { st.q = (e.target.value || '').trim(); paint(); },
  });
  page.appendChild(el('div.d-tools',
    segWrap,
    el('div.d-field' + (locked ? '.is-off' : ''), icon('search'), input, el('span.d-field__k', { text: '检索' }))
  ));
  if (locked) page.appendChild(note('归档状态：筛选与检索已锁定，页面仅保留只读读数。', 'warn'));

  function paintSeg() {
    segWrap.innerHTML = '';
    FILTERS.forEach((f) => segWrap.appendChild(el('button.d-seg__i' + (st.tab === f.key ? '.is-on' : '') + (locked ? '.is-off' : ''), {
      type: 'button',
      text: f.label,
      onclick: () => { st.tab = f.key; paintSeg(); paint(); },
    })));
  }

  /* ---- 重点线路面板（a1：封面 + 读数瓦片 + 出发倒计时量具） ---- */
  function leadPanel(a) {
    const sk = seats(a);
    const cd = countdown(a);
    const p = panel('重点线路 · ' + a.id.toUpperCase(), led(a.status, STATUS_KIND[a.statusKey]), 'd-panel--cal d-panel--tap',
      el('div.d-lead',
        photo('assets/photos/' + a.cover, { alt: a.title + ' 氛围图（Unsplash）' }),
        el('div',
          el('div.d-lead__t', { text: a.title }),
          el('div.d-lead__r', { text: a.routeName }),
          el('div.d-lead__x', { text: `${a.dateText} ${a.weekdayText} · ${a.timeText} · ${a.city}` })
        ),
        el('div.d-lead__go', icon('arrow-right'))
      ),
      tileGrid([
        { label: '距离', value: a.distanceKm, unit: 'km', sub: '环线' },
        { label: '累计爬升', value: fmt(a.ascentM), unit: 'm', sub: '下降同量' },
        { label: '已报名', value: a.signedCount, unit: '人', sub: '名额 ' + a.seatsTotal + ' 人' },
        { label: '余位', value: sk.left, unit: '位', sub: '截止 ' + hm(a.deadlineText), key: sk.left > 0 },
      ]),
      el('div.d-lead__foot',
        gauge({
          label: '出发倒计时',
          value: cd.big,
          ratio: cd.ratio,
          fillCls: cd.over ? 'is-idle' : '',
          left: '出发前 21 天',
          right: '出发时刻',
        })
      )
    );
    p.addEventListener('click', () => ui.go('detail'));
    return p;
  }

  /* ---- 密集数据行 ---- */
  function actRow(a) {
    const sk = seats(a);
    const cd = countdown(a);
    const mute = a.statusKey === 'ended' || a.statusKey === 'cancelled';
    return el('button.d-row' + (mute ? '.d-row--mute' : ''), {
      type: 'button',
      title: a.title + ' · ' + a.routeName,
      onclick: () => ui.go('detail'),
    },
      el('div.d-date' + (mute ? '.d-date--mute' : ''),
        el('div.d-date__d', { text: md(a.dateText) }),
        el('div.d-date__w', { text: a.weekdayText })
      ),
      el('div',
        el('div.d-row__t', { text: a.title }),
        el('div.d-row__r', { text: a.routeName + ' · ' + a.city + ' · ' + a.difficultyText }),
        el('div.d-row__n',
          nvs('距离', a.distanceKm, 'km'),
          nvs('爬升', fmt(a.ascentM), 'm'),
          nvs('名额', a.signedCount + '/' + a.seatsTotal, '人')
        )
      ),
      el('div.d-row__s',
        led(a.status, STATUS_KIND[a.statusKey]),
        el('div.d-row__seat',
          el('span.d-row__seatv', { text: String(sk.left) }),
          el('span.d-row__seatu', { text: '位余' })
        ),
        el('div.d-row__meter', meter(sk.ratio, '', sk.ratio >= 1 ? 'is-full' : ''))
      ),
      el('div.d-row__cd',
        el('span.d-row__cdt', { text: cd.text }),
        meter(cd.ratio, '', cd.over ? 'is-idle' : '')
      )
    );
  }

  /* ---- 列表区 ---- */
  const listWrap = el('div');
  page.appendChild(listWrap);

  function paint() {
    const f = FILTERS.find((x) => x.key === st.tab) || FILTERS[0];
    const q = st.q;
    const rows = acts.filter((a) => f.test(a) && (
      !q || a.title.includes(q) || a.routeName.includes(q) || a.city.includes(q) || a.difficultyText.includes(q)
    ));
    listWrap.innerHTML = '';

    if (flag === 'empty') {
      listWrap.appendChild(emptyBlock(
        '无匹配结果',
        '当前筛选与检索条件下没有可读的线路记录，可清空条件后重新读取。',
        '清空筛选',
        () => ui.setFlag('')
      ));
      listWrap.appendChild(foot(D));
      return;
    }

    if (!rows.length) {
      listWrap.appendChild(emptyBlock(
        '检索无结果',
        '没有线路命中「' + q + '」，可清空检索词或切换筛选档位。',
        '清空筛选条件',
        () => { st.tab = 'all'; st.q = ''; input.value = ''; paintSeg(); paint(); }
      ));
      listWrap.appendChild(foot(D));
      return;
    }

    const lead = rows.find((a) => a.hot) || rows[0];
    listWrap.appendChild(leadPanel(lead));
    rows.filter((a) => a.id !== lead.id).forEach((a) => listWrap.appendChild(actRow(a)));
    listWrap.appendChild(metaRow(
      el('span', '结果 ', el('b', { text: String(rows.length) }), ' 场 · 按出发时刻排序'),
      el('span', '余位合计 ', el('b', { text: fmt(rows.reduce((n, a) => n + (a.seatsTotal - a.signedCount), 0)) }), ' 位')
    ));
    listWrap.appendChild(foot(D));
  }

  paintSeg();
  paint();
  return page;
}

/* =========================================================
   2. 详情 — 行程档案
   ========================================================= */

/** 从 feeNote 推导费用明细（不硬编业务字段） */
function feeItems(feeNote) {
  const per = /人均约\s*¥\s*(\d+)/.exec(feeNote || '');
  return {
    per: per ? per[1] : null,
    split: /AA/.test(feeNote || '') ? '包车 AA 分摊' : '按实际发生',
    settle: /群内结算/.test(feeNote || '') ? '活动结束后群内结算' : '现场结算',
  };
}

/* 剖面高差比例（0=起点 1=顶点）：按行程节点语义推算的形态示意 */
const PROFILE = [0, 0.03, 0.1, 0.46, 1, 0.94, 0.28, 0];

/** 路线剖面：面积 + 基线（强） + 半程网格（浅） + 主曲线 1.75 + 顶点基准线（虚）+ 节点刻痕 */
function profileSVG(a, peakIdx) {
  const W = 380, H = 98, l = 30, r = 8, top = 16, base = 74;
  const n = (a.itinerary || []).length || 1;
  const px = (i) => l + (i / (n - 1)) * (W - l - r);
  const py = (f) => (base - f * (base - top)).toFixed(1);

  const pts = PROFILE.map((f, i) => [px(i).toFixed(1), py(f)]);
  const line = pts.map(([x, y]) => x + ',' + y).join(' ');
  const g = [];

  /* 面积 + 基线：0 高差线只画一次（基线），不再叠一条 0% 网格 */
  g.push(s('polygon', { class: 'd-pf__a', points: `${l},${base} ${line} ${W - r},${base}` }));
  g.push(s('line', { class: 'd-pf__base', x1: l, y1: base, x2: W - r, y2: base }));
  /* 半程网格：全图唯一一条浅网格线 */
  g.push(s('line', { class: 'd-pf__g', x1: l, y1: py(0.5), x2: W - r, y2: py(0.5) }));
  g.push(s('text', { class: 'is-k', x: l - 4, y: (+py(0.5) + 3).toFixed(1), 'text-anchor': 'end', text: fmt(Math.round(a.ascentM * 0.5)) }));
  g.push(s('text', { class: 'is-k', x: l - 4, y: (+base + 3), 'text-anchor': 'end', text: '0' }));
  g.push(s('text', { class: 'is-sc', x: l - 4, y: 10, 'text-anchor': 'end', text: 'm' }));
  g.push(s('polyline', { class: 'd-pf__l', points: line }));

  /* 关键节点刻痕 + 旗标 + 节点序号 */
  [0, peakIdx, n - 1].filter((v, i, arr) => v >= 0 && v < n && arr.indexOf(v) === i).forEach((i) => {
    g.push(s('line', { class: 'd-pf__tick', x1: px(i).toFixed(1), y1: base, x2: px(i).toFixed(1), y2: base + 4 }));
    g.push(s('circle', { class: i === peakIdx ? 'd-pf__pk' : 'd-pf__n', cx: px(i).toFixed(1), cy: py(PROFILE[i]), r: i === peakIdx ? 2.5 : 2 }));
    g.push(s('text', {
      x: px(i).toFixed(1), y: base + 15,
      'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle',
      text: pad2(i + 1),
    }));
  });

  /* 顶点基准线 + 读数（压在基准线上方 5px，不与虚线相撞） */
  g.push(s('line', { class: 'd-pf__pkline', x1: l, y1: py(1), x2: W - r, y2: py(1) }));
  g.push(s('text', { class: 'is-v', x: W - r, y: (+py(1) - 5).toFixed(1), 'text-anchor': 'end', text: `顶点 +${fmt(a.ascentM)} m` }));

  return s('svg', { class: 'd-pf', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': a.title + ' 路线剖面示意' }, ...g);
}

export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const a = D.featured;
  const meta = D.weather.meta;
  const win = (meta.window && meta.window[0]) || [];
  const page = el('div.page');
  const locked = flag === 'disabled';
  const fee = feeItems(a.feeNote);
  const sk = seats(a);
  const itin = a.itinerary || [];
  const last = itin[itin.length - 1] || [];
  let peakIdx = itin.findIndex(([, x]) => /登顶 \d/.test(x));
  if (peakIdx < 0) peakIdx = 0;

  /* ---- 抬头：本屏主读数 = 距出发倒计时 ---- */
  const cdA = countdown(a);
  page.appendChild(head(`行程档案 · ${a.city} · 领队 ${a.leader}`, '任务简报',
    { label: cdA.label, num: cdA.big, sub: `出发 ${md(a.dateText)} ${hm(a.meetingTime)}` }));

  if (flag === 'loading') {
    page.appendChild(frag(
      el('div.d-mast',
        skel('fig', '64px'),
        el('div', skel('m', '84%'), el('div', { style: { marginTop: 'var(--lab-space-1)' } }, skel('s', '60%'))),
        skel('m', '52px')
      ),
      el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, tileGrid([
        { label: '距离', value: '·', unit: 'km' }, { label: '累计爬升', value: '·', unit: 'm' },
        { label: '余位', value: '·', unit: '位' }, { label: '报名截止', value: '··/··', unit: '' },
      ])),
      skel('fig', '100%'),
      ...Array.from({ length: 6 }, () => el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel('row', '100%'))),
      foot(D)
    ));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(errorBlock('行程档案未能读取，请检查网络后重试。', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 紧凑 masthead：编号 / 封面 / 标题 / 状态 ---- */
  page.appendChild(el('div.d-mast',
    photo('assets/photos/' + a.cover, { alt: a.title + ' 氛围图（Unsplash）' }),
    el('div',
      el('div.d-mast__id', '编号 ', el('span.d-mast__idv', { text: a.id.toUpperCase() }), '·', a.difficultyText),
      el('div.d-mast__t', { text: a.title }),
      el('div.d-mast__r', { text: a.routeName }),
      el('div.d-mast__x', { text: `${a.dateText} ${a.weekdayText} · ${a.timeText} · ${a.city}` })
    ),
    el('div.d-mast__s',
      led(locked ? '已截止' : a.status, locked ? 'neutral' : STATUS_KIND[a.statusKey]),
      el('span.d-nk', { text: '顶线 ' + fmt(meta.elevationM) + ' m' })
    )
  ));

  if (flag === 'empty') {
    page.appendChild(el('div', { style: { marginTop: 'var(--lab-section-gap)' } },
      framed('info', '活动已取消', a.lede + ' 行程节点、分车与签到读数均已失效。', '去看看其他活动', () => ui.go('discover'))));
    page.appendChild(el('div.divider'));
    page.appendChild(metaRow(el('span', a.dateText + ' ' + a.weekdayText + ' · 原定 ' + a.timeText), el('span', '状态：已取消')));
    page.appendChild(foot(D));
    return page;
  }

  if (locked) page.appendChild(note(`报名已截止：名额 ${a.signedCount}/${a.seatsTotal} 已满，报名入口关闭，仍可查看行程、集合与装备要求。`, 'warn'));

  /* ---- 数据栅格：余位为本屏主数据（key 槽，唯一带品牌绿量程记号的瓦片） ---- */
  page.appendChild(el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, tileGrid([
    { label: '距离', value: a.distanceKm, unit: 'km', sub: '环线' },
    { label: '累计爬升', value: fmt(a.ascentM), unit: 'm', sub: '下降同量' },
    { label: '余位', value: sk.left, unit: '位', sub: `名额 ${a.signedCount}/${a.seatsTotal}`, key: sk.left > 0, alert: sk.left <= 0 },
    { label: '报名截止', value: md(a.deadlineText), unit: '', sub: hm(a.deadlineText) + (locked ? ' 已截止' : ' 截止') },
  ])));

  /* ---- 路线剖面（替代美术 hero 的功能性图形） ---- */
  page.appendChild(panel('路线剖面 · 相对高差', `${a.distanceKm} km · 顶点 +${fmt(a.ascentM)} m`, null,
    el('div.d-panel__bd',
      profileSVG(a, peakIdx),
      metaRow(
        el('span', '高差按行程节点推算（顶点取爬升值，节点 ' + pad2(peakIdx + 1) + ' 登顶）'),
        el('span', '水平距离 ' + a.distanceKm + ' km')
      )
    )
  ));

  /* ---- 参数表（标签左 / 值右） ---- */
  page.appendChild(sect('参数', '8 项 · 单位常显'));
  page.appendChild(el('div',
    kv('出发', md(a.dateText) + ' ' + hm(a.meetingTime), a.weekdayText),
    kv('集合', a.meetingPoint, a.meetingTime),
    kv('结束', last[0] || '—', '返回 ' + a.city),
    kv('难度', a.difficultyText, '领队 ' + a.leader),
    kv('费用', fee.per ? '¥' + fee.per : '—', fee.per ? '/ 人 · ' + fee.split : fee.split),
    kv('顶线海拔', fmt(meta.elevationM), 'm', true)
  ));

  /* ---- 天气窗口行（值本身已带单位，不再追加单位列） ---- */
  page.appendChild(sect('天气窗口', meta.updatedText.replace(' 更新', '')));
  page.appendChild(el('div',
    kv('出发窗口', win[0] || '—'),
    kv('天空状况', win[1] || '—'),
    kv('云海概率', (win[2] || '').replace('云海 ', '')),
    kv('风速', (win[3] || '').replace('风 ', '')),
    kv('判定', meta.verdict, null, true)
  ));

  /* ---- 行程时间轴 ---- */
  page.appendChild(sect('行程节点', `${itin.length} 段 · ${itin[0][0]} → ${last[0] || '—'}`));
  itin.forEach(([t, x], i) => {
    page.appendChild(el('div.d-tl__row',
      el('div.d-tl' + (i === peakIdx ? '.d-tl--peak' : ''),
        el('div.d-tl__n', { text: pad2(i + 1) }),
        el('div.d-tl__t', { text: t }),
        el('div.d-tl__i', el('div.d-tl__d')),
        el('div.d-tl__x', { text: x })
      )
    ));
  });

  /* ---- 装备与要求清单 ---- */
  page.appendChild(sect('装备与要求', `${(a.requirements || []).length} 项 · 出发前逐项确认`));
  (a.requirements || []).forEach((r, i) => {
    page.appendChild(el('div.d-req',
      el('div.d-req__b'),
      el('div',
        el('div.d-req__n', { text: pad2(i + 1) }),
        el('div.d-req__x', { text: r })
      )
    ));
  });

  /* ---- 费用与约定 ---- */
  page.appendChild(sect('费用与约定', '平台不抽成'));
  page.appendChild(el('div',
    kv('分摊方式', fee.split),
    kv('人均预算', fee.per ? '¥' + fee.per : '—', fee.per ? '/ 人' : ''),
    kv('平台服务费', '¥0'),
    kv('结算', fee.settle, null, true)
  ));
  page.appendChild(note(a.feeNote));

  /* ---- 同行人计数摘要：已通过 = key 槽，待审核 = alert 槽 ---- */
  const mates = D.roster;
  const passed = mates.filter((m) => m.audit === '已通过');
  const pend = mates.filter((m) => m.audit === '待审核').length;
  const wait = mates.filter((m) => m.audit === '候补').length;
  page.appendChild(sect('同行人', `${mates.length} 人 · 领队与车长优先`));
  page.appendChild(el('div', tileGrid([
    { label: '已通过', value: passed.length, unit: '人', sub: '可编队', key: true },
    { label: '待审核', value: pend, unit: '人', sub: '领队处理', alert: pend > 0 },
    { label: '候补', value: wait, unit: '人', sub: '排队中' },
    { label: '未定车', value: passed.filter((m) => !m.vehicleId).length, unit: '人', sub: '待编排' },
  ])));
  page.appendChild(el('div.d-row__n', { style: { marginTop: 'var(--lab-space-3)', gap: 'var(--lab-space-1)', flexWrap: 'wrap' } },
    ...passed.slice(0, 8).map((m) => el('span.chip.chip--outline', { text: m.name + ' · ' + (m.tripMode === '待定' ? '未定车' : m.tripMode) })),
    pend ? el('span.chip.chip--outline', { text: `待审核 ${pend}` }) : null,
    wait ? el('span.chip.chip--outline', { text: `候补 ${wait}` }) : null
  ));
  page.appendChild(metaRow(
    el('span', '显示前 ', el('b', { text: '8' }), ' 位已通过成员'),
    el('span', '余 ', el('b', { text: String(sk.left) }), ' 位')
  ));

  /* ---- 底部 sticky 操作条：主操作 theater（idle → busy → done 三态各有一套读法） ---- */
  let ctaState = locked ? 'off' : 'idle';
  let cta = null;
  if (!locked) {
    cta = el('button.btn.btn--primary', { type: 'button', 'data-testid': 'primary-cta' });
    const paintCta = () => {
      cta.className = 'btn btn--primary';
      if (ctaState === 'idle') { cta.textContent = THEATER.idle; cta.disabled = false; }
      else if (ctaState === 'loading') { cta.textContent = THEATER.loading; cta.disabled = true; cta.classList.add('is-busy'); }
      else { cta.textContent = THEATER.done; cta.disabled = true; cta.classList.add('is-done'); }
    };
    cta.addEventListener('click', () => {
      if (ctaState !== 'idle') return;
      ctaState = 'loading';
      paintCta();
      setTimeout(() => {
        ctaState = 'done';
        paintCta();
        ui.toast('报名成功，等待领队审核');
      }, 700);
    });
    paintCta();
  }

  page.appendChild(el('div.d-bar',
    locked
      ? el('div.d-bar__hint', el('b', { text: '报名已截止' }), a.deadlineText + ' · 仅可查看行程')
      : cta,
    el('button.btn.btn--secondary', { type: 'button', text: '分享', onclick: () => ui.toast('已生成分享卡片（演示）') })
  ));
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   3. 协作 — 野外控制台
   ========================================================= */

const TABS = [
  { key: 'over', label: '总览' },
  { key: 'list', label: '名单' },
  { key: 'car', label: '分车' },
  { key: 'site', label: '现场' },
];

function seatText(m) {
  if (m.seatNo === 'driver') return '司机';
  if (m.seatNo == null) return '待定';
  return String(m.seatNo);
}

/** 审核 / 签到复选（方格 LED） */
function checkBox(on, isLock, onToggle) {
  const node = el('span.d-chk' + (on ? '.is-on' : isLock ? '.is-lock' : ''), on ? icon('check') : null);
  if (!isLock && onToggle) node.addEventListener('click', onToggle);
  return node;
}

export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const a = D.featured;
  const wmeta = D.weather.meta;
  const page = el('div.page');
  const locked = flag === 'disabled';

  /* 本地可变状态（演示用，不回写共享数据源） */
  const members = flag === 'empty' ? [] : D.roster.map((m) => Object.assign({}, m));
  let clockTick = 11;
  let departSent = false;
  const SITE_HOUR = 0; /* 现场天气参考固定取「现在」这一列，读数不随操作漂移 */

  function sum() {
    const approved = members.filter((m) => m.audit === '已通过');
    const checked = members.filter((m) => m.checked && m.audit === '已通过');
    return {
      total: members.length,
      approved: approved.length,
      checked: checked.length,
      unchecked: approved.length - checked.length,
      pendingAudit: members.filter((m) => m.audit === '待审核').length,
      waitlist: members.filter((m) => m.audit === '候补').length,
      noVehicle: approved.filter((m) => !m.vehicleId).length,
      seated: approved.filter((m) => !!m.vehicleId).length,
    };
  }

  /* ---- 抬头：编号/阶段条件条 + 活动名 + 未签到大读数（所有状态共用，保证页面结构一致）
         层级对齐详情页 masthead：编号/阶段属条件（小字眉题），活动名是大字主体，用户一眼确认是哪趟行程 ---- */
  const s0 = sum();
  const phaseText = flag === 'error' ? '协作面板' : flag === 'empty' ? '暂无成员' : D.collab.phase;
  page.appendChild(head(`协作 · 野外控制台 · 编号 ${a.id.toUpperCase()} · ${phaseText}`,
    a.title,
    { num: String(s0.unchecked), unit: '人未签到', sub: countdown(a).text }));

  if (flag === 'loading') {
    page.appendChild(frag(
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, tileGrid([
        { label: '已通过', value: '·', unit: '人' }, { label: '未签到', value: '·', unit: '人' },
        { label: '已定车', value: '·', unit: '人' }, { label: '候补', value: '·', unit: '人' },
      ])),
      ...Array.from({ length: 8 }, () => el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel('row', '100%'))),
      foot(D)
    ));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(errorBlock('协作面板未能读取，请检查网络后重试；名单、分车与签到读数暂不可用。', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 读数栅格 + 集合点读数面板 ---- */
  const gridWrap = el('div', { style: { marginTop: 'var(--lab-section-gap)' } });
  page.appendChild(gridWrap);

  function paintGrid() {
    const s = sum();
    gridWrap.innerHTML = '';
    /* 未签到 = 本屏主数据（key 槽，与抬头大读数同源） */
    gridWrap.appendChild(tileGrid([
      { label: '已通过', value: s.approved, unit: '/ ' + s.total + ' 人', sub: '审核通过' },
      { label: '未签到', value: s.unchecked, unit: '人', sub: '已到 ' + s.checked + ' 人', key: s.unchecked > 0 },
      { label: '已定车', value: s.seated, unit: '/ ' + s.approved + ' 人', sub: '未定车 ' + s.noVehicle + ' 人' },
      { label: '候补', value: s.waitlist, unit: '人', sub: '待审核 ' + s.pendingAudit + ' 人' },
    ]));
    gridWrap.appendChild(panel('集合点读数', a.meetingTime + ' 出发', null,
      el('div.d-panel__bd',
        kv('集合点', a.meetingPoint),
        kv('集合时间', a.meetingTime),
        kv('出发时间', hm(a.timeText)),
        kv('天气参考', wmeta.verdict, null, true),
        gauge({
          label: '到点进度',
          value: s.checked + ' / ' + s.approved,
          unit: '人',
          ratio: s.approved ? s.checked / s.approved : 0,
          fillCls: s.approved && s.checked === s.approved ? 'is-full' : '',
          left: '到点 · 0%',
          right: '到点 · 全员到齐',
        })
      )
    ));
  }
  paintGrid();

  if (locked) page.appendChild(note('签到已关闭：领队已在群内点名确认，现场签到控件停用，读数保持归档值。', 'warn'));

  /* ---- 分段控制 + 四页签 ---- */
  let tab = flag === 'empty' ? 'list' : 'over';
  const segWrap = el('div.d-seg.d-seg--sticky', { style: { marginTop: 'var(--lab-space-4)' } });
  const panels = {};
  const repaint = {};
  page.appendChild(segWrap);

  function paintSeg() {
    segWrap.innerHTML = '';
    TABS.forEach((t) => segWrap.appendChild(el('button.d-seg__i' + (tab === t.key ? '.is-on' : ''), {
      type: 'button', text: t.label,
      onclick: () => { tab = t.key; paintSeg(); show(); },
    })));
  }
  function show() { TABS.forEach((t) => panels[t.key].classList.toggle('is-hidden', t.key !== tab)); }
  function refresh() { paintGrid(); Object.keys(repaint).forEach((k) => repaint[k]()); }

  /* 表格表头：与数据行共用同一列模板修饰符 */
  const thRow = (mod, cells) => el('div.d-trow.d-trow--h.' + mod, ...cells.map((c) => el('div.d-cell' + (c.n ? '.d-cell--n' : ''), { text: c.t })));

  /* ---- 总览：车辆编组表（占用随审核状态变化） ---- */
  {
    const wrap = el('div');
    const p = panel('车辆编组', `${D.vehicles.length} 台 · 每车 4 座 + 司机 1 座`, null, el('div.d-panel__bd', wrap));
    repaint.over = () => {
      wrap.innerHTML = '';
      wrap.appendChild(thRow('d-tbl--veh', [{ t: '车辆' }, { t: '司机' }, { t: '车牌' }, { t: '占用', n: true }]));
      D.vehicles.forEach((v) => {
        const load = vehLoad(v);
        wrap.appendChild(el('div.d-trow.d-tbl--veh',
          el('div.d-cell.d-cell--name', { text: v.label }),
          el('div.d-cell.d-cell--txt', { text: v.driver }),
          el('div.d-cell.d-cell--num', { text: v.plate }),
          el('div.d-cell.d-cell--n.d-cell--num', { text: load.taken + '/' + v.capacity })
        ));
      });
      const s = sum();
      wrap.appendChild(metaRow(
        el('span', '空位 ', el('b', { text: String(D.vehicles.reduce((n, v) => n + v.seats.filter((x) => !x).length, 0)) }), ' 个 · 暂离座 ', el('b', { text: String(D.vehicles.reduce((n, v) => n + vehLoad(v).hold, 0)) }), ' 人'),
        el('span', '未定车 ', el('b', { text: String(s.noVehicle) }), ' 人')
      ));
    };
    repaint.over();
    panels.over = p;
  }

  /* 车辆实际乘员（与审核状态联动：待审核成员不计入占用） */
  function vehLoad(v) {
    let taken = 0, hold = 0;
    v.seats.forEach((name, i) => {
      if (!name) return;
      const m = members.find((x) => x.vehicleId === v.id && x.seatNo === i + 1);
      if (m && m.audit !== '已通过') hold += 1;
      else taken += 1;
    });
    return { taken, hold };
  }

  /* ---- 名单：扫描表 + 审核切换 ---- */
  {
    const wrap = el('div');
    const p = panel('成员名单', `${members.length} 人 · 点复选框撤销通过`, null, el('div.d-panel__bd', wrap));
    repaint.list = () => {
      wrap.innerHTML = '';
      if (!members.length) {
        wrap.appendChild(emptyBlock('名单为空', '当前活动还没有成员报名记录，审核计数、分车与签到读数全部归零。', '去发现页看看', () => ui.go('discover')));
        return;
      }
      wrap.appendChild(thRow('d-tbl--roster', [{ t: '姓名' }, { t: '出行' }, { t: '车' }, { t: '座', n: true }, { t: '审核' }, { t: '' }]));
      members.forEach((m) => {
        const ok = m.audit === '已通过';
        const v = D.vehicles.find((x) => x.id === m.vehicleId);
        wrap.appendChild(el('div.d-trow.d-tbl--roster' + (ok ? '' : '.is-locked'),
          el('div.d-cell.d-cell--name', { text: m.name + ' · ' + m.role }),
          el('div.d-cell.d-cell--txt', { text: m.tripMode }),
          el('div.d-cell.d-cell--txt', { text: v ? v.label : '—' }),
          el('div.d-cell.d-cell--n.d-cell--num', { text: seatText(m) }),
          el('div.d-cell', led(m.audit, AUDIT_KIND[m.audit])),
          el('div.d-chkwrap' + (ok ? '' : '.is-lock'), {
            title: ok ? '点击撤销通过（已通过计数 -1）' : '仅已通过成员可撤销',
          }, checkBox(ok, !ok, () => {
            m.audit = '待审核';
            refresh();
            ui.toast(m.name + ' 已转为待审核 · 已通过计数 -1');
          }))
        ));
      });
      const s = sum();
      wrap.appendChild(metaRow(
        el('span', '已通过 ', el('b', { text: String(s.approved) }), ' · 待审核 ', el('b', { text: String(s.pendingAudit) })),
        el('span', '候补 ', el('b', { text: String(s.waitlist) }))
      ));
    };
    repaint.list();
    panels.list = p;
  }

  /* ---- 分车：每车座位矩阵（座位状态与审核联动） ---- */
  {
    const wrap = el('div');
    const p = panel('分车矩阵', `${D.vehicles.length} 台 · 4 座 + 司机`, null, el('div.d-panel__bd', wrap));
    repaint.car = () => {
      wrap.innerHTML = '';
      D.vehicles.forEach((v) => {
        const load = vehLoad(v);
        const cells = [];
        cells.push(el('div.d-mxc.d-mxc--driver',
          el('small', { text: '司机' }),
          el('span', { text: v.driver }),
          el('small', { text: v.plate })
        ));
        v.seats.forEach((name, i) => {
          if (i === 2) cells.push(el('div.d-mxc.d-mxc--aisle'));
          if (!name) {
            cells.push(el('div.d-mxc.d-mxc--free', { title: `${v.label} 座位 ${i + 1} · 空位` },
              el('small', { text: String(i + 1) }), el('span', { text: '空位' })));
            return;
          }
          const m = members.find((x) => x.vehicleId === v.id && x.seatNo === i + 1);
          const hold = m && m.audit !== '已通过';
          cells.push(el('div.d-mxc.' + (hold ? 'd-mxc--hold' : 'd-mxc--taken'),
            { title: `${v.label} 座位 ${i + 1} · ${name}${hold ? ' · 暂离座（待审核）' : ''}` },
            el('small', { text: String(i + 1) }),
            el('span', { text: name })
          ));
        });
        wrap.appendChild(el('div.d-veh',
          el('div.rowflex.between',
            el('span.d-nk', { text: v.label + ' · ' + v.plate + ' · 司机 ' + v.driver }),
            nvs('乘员', load.taken + '/' + v.capacity)
          ),
          el('div', { style: { marginTop: 'var(--lab-space-2)' } }, el('div.d-mx', ...cells))
        ));
      });
      const s = sum();
      wrap.appendChild(metaRow(
        el('span', '实到乘员 ', el('b', { text: String(D.vehicles.reduce((n, v) => n + vehLoad(v).taken, 0)) }), ' 人 · 空位 ', el('b', { text: String(D.vehicles.reduce((n, v) => n + v.seats.filter((x) => !x).length, 0)) }), ' 个'),
        el('span', `未定车 ${s.noVehicle} 人 · 暂离座 ${D.vehicles.reduce((n, v) => n + vehLoad(v).hold, 0)} 人`)
      ));
    };
    repaint.car();
    panels.car = p;
  }

  /* ---- 现场：签到清单 + 顶线天气读数（面板头的 meta 随签到数实时刷新） ---- */
  {
    const wrap = el('div');
    const siteMeta = el('div.d-panel__r');
    const p = panel('现场签到', siteMeta, null, el('div.d-panel__bd', wrap));
    repaint.site = () => {
      wrap.innerHTML = '';
      const s = sum();
      siteMeta.innerHTML = '';
      siteMeta.appendChild(el('span', { text: '已签到 ' }));
      siteMeta.appendChild(el('span', { text: s.checked + ' / ' + s.approved }));
      if (!members.length) {
        wrap.appendChild(emptyBlock('现场无成员', '名单为空，签到清单与到点比例同步归零。', '去发现页看看', () => ui.go('discover')));
        return;
      }
      const h = D.weather.hours[SITE_HOUR];
      const rank = (m) => (m.audit === '已通过' ? (m.checked ? 1 : 0) : m.audit === '待审核' ? 2 : 3);
      wrap.appendChild(thRow('d-tbl--site', [
        { t: '签到' }, { t: '成员 / 安排' }, { t: '时间', n: true },
        { t: '温度', n: true }, { t: '降水', n: true }, { t: '风', n: true }, { t: '判定' },
      ]));
      members.slice().sort((x, y) => rank(x) - rank(y)).forEach((m) => {
        const can = m.audit === '已通过' && !locked;
        const v = D.vehicles.find((x) => x.id === m.vehicleId);
        const seat = seatText(m);
        const plan = m.audit !== '已通过'
          ? m.audit
          : seat === '司机'
            ? `${m.tripMode} ${v ? v.label : ''} · 司机`
            : `${m.tripMode} ${v ? v.label : ''} ${seat} 座`;
        const r = el('div.d-trow.d-tbl--site' + (can ? '.is-tap' : '.is-locked'), {
          role: 'button',
          title: can ? '点击切换签到状态' : '该成员不可签到',
          onclick: () => {
            if (!can) { ui.toast('签到已关闭，或该成员未通过审核'); return; }
            m.checked = !m.checked;
            if (m.checked) { clockTick += 1; m.checkedAt = `${a.meetingTime.slice(0, 2)}:${pad2(clockTick % 60)}`; }
            else { m.checkedAt = undefined; }
            refresh();
            ui.toast(m.checked ? `${m.name} 已签到 ${m.checkedAt}` : `${m.name} 已取消签到`);
          },
        },
          el('div.d-cell', checkBox(!!m.checked, !can)),
          el('div.d-cell',
            el('div.d-cell--name', { text: m.name }),
            el('div.d-cell--txt', { text: plan })
          ),
          el('div.d-cell.d-cell--n.d-cell--num', { text: m.checked && m.checkedAt ? m.checkedAt : '—' }),
          el('div.d-cell.d-cell--n.d-cell--num' + (h.temp <= COLD_AT ? '.d-cell--cool' : '.d-cell--warm'), { text: h.temp.toFixed(1) + '℃' }),
          el('div.d-cell.d-cell--n.d-cell--num' + (h.precip >= 60 ? '.d-cell--rain' : ''), { text: h.precip + '%' }),
          el('div.d-cell.d-cell--n.d-cell--num.d-cell--wind', { text: h.wind.toFixed(1) }),
          el('div.d-cell.d-cell--n', led(verdictOf(h), h.precip >= 60 ? 'info' : h.keyNote ? 'warning' : 'success'))
        );
        wrap.appendChild(r);
      });
      wrap.appendChild(metaRow(
        el('span', '已签到 ', el('b', { text: String(s.checked) }), ' / ' + String(s.approved)),
        el('span', '未签到 ', el('b', { text: String(s.unchecked) }))
      ));
      wrap.appendChild(note(`温度 / 降水 / 风 / 判定取顶线「现在」（${h.label}）实况读数（演示数据），用于现场判断装备与保暖。`));
    };
    repaint.site();
    panels.site = p;
  }

  TABS.forEach((t) => page.appendChild(panels[t.key]));
  paintSeg();
  show();

  /* ---- 下一步行动条 ---- */
  const nextV = el('div.d-next__v');
  const nextALabel = el('span', { text: '发起出发确认' });
  const nextBar = el('div.d-next', {
    role: 'button',
    onclick: () => {
      const s = sum();
      if (s.unchecked > 0) { ui.toast(`还有 ${s.unchecked} 人未到集合点，先催到齐再发起`); return; }
      departSent = true;
      paintNext();
      ui.toast('已发起出发确认，等待全员确认（演示）');
    },
  }, nextV, el('div.d-next__a', nextALabel, icon('arrow-right')));

  function paintNext() {
    const s = sum();
    nextV.innerHTML = '';
    nextV.appendChild(el('div', {
      text: s.unchecked > 0
        ? `还有 ${s.unchecked} 人未到集合点，其中 ${s.noVehicle} 人未安排车辆`
        : '全员已到齐，车辆安排完成，可直接发起出发确认',
    }));
    nextV.appendChild(el('div.d-next__k', { text: departSent ? '已发起 · 等待全员确认' : '下一步 · ' + D.collab.nextAction }));
    nextBar.classList.toggle('d-next--done', departSent);
    nextALabel.textContent = departSent ? '已发起出发确认' : '发起出发确认';
  }

  page.appendChild(sect('下一步', departSent ? '已发起' : '待执行'));
  page.appendChild(nextBar);
  paintNext();
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   4. 天气 — 决策仪表（数据主场）
   ========================================================= */

/* meteogram 画布几何：48 列 × 7px，画布 380 宽。
   左槽 26px = 变量名；绘图区 26→362；右槽 18px = 量程数字。
   自上而下分层：窗口标带(0–3) → 注释行(≤17) → 云带(27–45) → 降水柱(49–91)
   → 温度线(105–141) → 风标(149–159) → 时间轴(166) */
const MG = { w: 384, h: 180, l: 26, r: 22, col: 7 };
MG.bandY = 0; MG.bandH = 3;
MG.noteY = 17;
MG.cloudTop = 27; MG.cloudH = 18;
MG.precipTop = 49; MG.precipBase = 91; MG.precipH = 42;
MG.tempTop = 105; MG.tempBot = 141;
MG.windTop = 149; MG.windBase = 159; MG.windH = 10;
MG.axisY = 166;
MG.plotR = MG.l + 48 * MG.col;

const T_MIN = 5, T_MAX = 15;
const COLD_AT = 6; /* ℃ 阈值：低于此值温度线切冷色 */

const gx = (i) => MG.l + i * MG.col;
const ty = (t) => (MG.tempBot - (t - T_MIN) / (T_MAX - T_MIN) * (MG.tempBot - MG.tempTop)).toFixed(1);
const py = (p) => (MG.precipBase - p / 100 * MG.precipH).toFixed(1);

/** 逐时判定（保守口径） */
function verdictOf(h) {
  if (h.keyNote === '云海窗口') return '宜等候';
  if (h.precip >= 60) return '降雨';
  if (h.cloud <= 45 && h.wind <= 4) return '放晴';
  if (h.night) return '夜间';
  return '常规';
}

/** 关键窗口连续段（从数据推导，不写死索引；标签即数据里的 keyNote） */
function keyRuns(hours) {
  const runs = [];
  let cur = null;
  hours.forEach((h, i) => {
    if (!h.keyNote) { cur = null; return; }
    if (cur && cur.note === h.keyNote && cur.to === i - 1) cur.to = i;
    else { cur = { note: h.keyNote, from: i, to: i }; runs.push(cur); }
  });
  return runs;
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

/** 连续夜间段（合并成竖带，避免逐列 24 个矩形） */
function nightRuns(hours) {
  const runs = [];
  let cur = null;
  hours.forEach((h, i) => {
    if (h.night) { if (!cur) { cur = { from: i, to: i }; runs.push(cur); } else cur.to = i; }
    else cur = null;
  });
  return runs;
}

function meteogram(hours, runs, sel, onPick, isLock) {
  const n = hours.length;
  const R = MG.plotR;
  const g = [];

  /* 1. 夜间阴影（背景量，最浅的一层，压在所有图元之下） */
  nightRuns(hours).forEach((r) => {
    g.push(s('rect', {
      class: 'd-mg__night',
      x: gx(r.from).toFixed(1), y: 0,
      width: ((r.to - r.from + 1) * MG.col).toFixed(1),
      height: MG.axisY - 6,
    }));
  });

  /* 2. 云量阶梯带：填充与顶缘线共用同一条阶梯路径，填与描不再错位 */
  const cloudY = (h) => (MG.cloudTop + MG.cloudH - h.cloud / 100 * MG.cloudH).toFixed(1);
  let fill = `M ${gx(0)} ${MG.cloudTop + MG.cloudH}`;
  let edge = '';
  for (let i = 0; i < n; i++) {
    const y = cloudY(hours[i]);
    fill += ` L ${gx(i)} ${y} L ${gx(i) + MG.col} ${y}`;
    edge += `${i ? 'L' : 'M'} ${gx(i)} ${y} L ${gx(i) + MG.col} ${y} `;
  }
  fill += ` L ${R} ${MG.cloudTop + MG.cloudH} Z`;
  g.push(s('path', { class: 'd-mg__cloud', d: fill }));
  g.push(s('path', { class: 'd-mg__cloudline', d: edge.trim() }));

  /* 3. 结构线：降水基线（强）+ 三条带分隔线（浅）—— 全图只有这四条 */
  [MG.cloudTop + MG.cloudH, MG.tempBot, MG.windBase].forEach((y) => {
    g.push(s('line', { class: 'd-mg__sep', x1: MG.l, y1: y, x2: R, y2: y }));
  });
  g.push(s('line', { class: 'd-mg__base', x1: MG.l, y1: MG.precipBase, x2: R, y2: MG.precipBase }));

  /* 4. 降水柱：定宽 3px（列距 7px，留 4px 空当）；≥60% 越过降雨阈值 → 满色，其余压暗为背景量 */
  hours.forEach((h, i) => {
    if (!h.precip) return;
    const top = +py(h.precip);
    g.push(s('rect', {
      class: 'd-mg__p' + (h.precip >= 60 ? ' is-hi' : ''),
      x: (gx(i) + 2).toFixed(1), y: top.toFixed(1),
      width: 3, height: (MG.precipBase - top).toFixed(1),
    }));
  });

  /* 5. 温度线：6℃ 阈值切冷暖两段；阈值只用一种虚线，并在绘图区内左端注记 */
  let run = [];
  const flush = () => {
    if (run.length > 1) {
      g.push(s('polyline', {
        class: 'd-mg__' + (run[0].t < COLD_AT ? 'tcold' : 'twarm'),
        points: run.map((p) => p.x + ',' + p.y).join(' '),
      }));
    }
    run = [];
  };
  hours.forEach((h, i) => {
    const cold = h.temp < COLD_AT;
    if (run.length && ((run[0].t < COLD_AT) !== cold)) flush();
    run.push({ x: (gx(i) + MG.col / 2).toFixed(1), y: ty(h.temp), t: h.temp });
  });
  flush();
  g.push(s('line', { class: 'd-mg__th', x1: MG.l, y1: ty(COLD_AT), x2: R, y2: ty(COLD_AT) }));
  g.push(s('text', { class: 'is-th', x: MG.l + 2, y: (+ty(COLD_AT) - 4).toFixed(1), text: COLD_AT + '℃' }));

  /* 6. 风标：1px 竖标，高度 ∝ 风速（满格 6 m/s）；与温度冷段同色系，靠带位与形态分离 */
  hours.forEach((h, i) => {
    const hh = (h.wind / 6 * MG.windH).toFixed(1);
    g.push(s('rect', {
      class: 'd-mg__tw',
      x: (gx(i) + MG.col / 2 - 0.5).toFixed(1), y: (MG.windBase - hh).toFixed(1),
      width: 1, height: hh,
    }));
  });

  /* 7. 游标：列底色 + 虚线探针 + 标带块 + 轴上刻块 + 温度线上的实心游标点 */
  const sx = (gx(sel) + MG.col / 2).toFixed(1);
  g.push(s('rect', { class: 'd-mg__cursor', x: gx(sel).toFixed(1), y: 0, width: MG.col, height: MG.tempBot }));
  g.push(s('line', { class: 'd-mg__cpline', x1: sx, y1: MG.noteY + 4, x2: sx, y2: MG.axisY - 4 }));
  g.push(s('rect', { class: 'd-mg__cp', x: gx(sel).toFixed(1), y: MG.bandY, width: MG.col - 1, height: MG.bandH }));
  g.push(s('rect', { class: 'd-mg__cp', x: gx(sel).toFixed(1), y: MG.axisY - 5, width: MG.col - 1, height: 4 }));
  g.push(s('circle', { class: 'd-mg__cpdot', cx: sx, cy: ty(hours[sel].temp), r: 2.5 }));

  /* 8. 关键窗口注释：标带 + 垂直引线 + 文字（云海窗口 / 降雨 —— 仪器注释，不是调试文案） */
  runs.forEach((r) => {
    const isRain = r.note === '降雨';
    const x0 = gx(r.from);
    const x1 = gx(r.to) + MG.col;
    const half = r.note.length * 5; /* 中文在 10px 下按 5px/字估半宽，用于贴边避让 */
    const lx = Math.min(Math.max((x0 + x1) / 2, MG.l + half), R - half);
    g.push(s('rect', {
      class: isRain ? 'd-mg__rain' : 'd-mg__sun',
      x: x0.toFixed(1), y: MG.bandY, width: (x1 - x0).toFixed(1), height: MG.bandH,
    }));
    g.push(s('line', { class: 'd-mg__lead', x1: lx, y1: MG.bandY + MG.bandH, x2: lx, y2: MG.noteY - 9 }));
    g.push(s('text', { class: isRain ? 'is-r' : 'is-a', x: lx.toFixed(1), y: MG.noteY, 'text-anchor': 'middle', text: r.note }));
  });

  /* 9. 时间轴：每 6 小时一刻；跨日换日期标；第 0 列用品牌色标出「现在」 */
  let day = hours[0].label.slice(0, 5);
  hours.forEach((h, i) => {
    if (i % 6) return;
    const d = h.label.slice(0, 5);
    const isDay = i > 0 && d !== day;
    const now = i === 0;
    if (isDay) day = d;
    const x = (gx(i) + MG.col / 2).toFixed(1);
    g.push(s('line', {
      class: now ? 'd-mg__nowtick' : isDay ? 'd-mg__daytick' : 'd-mg__tick',
      x1: x, y1: MG.axisY - (now || isDay ? 9 : 5), x2: x, y2: MG.axisY,
    }));
    g.push(s('text', {
      class: now ? 'is-now' : isDay ? 'is-d' : '',
      x, y: MG.axisY + 11, 'text-anchor': 'middle',
      text: isDay ? d : h.label.slice(6, 8),
    }));
  });

  /* 10. 量程读数：左槽变量名 / 右槽端点刻度 —— 轴不再是散落的数字堆 */
  [['云量', MG.cloudTop + 9], ['降水', MG.precipTop + 9], ['温度', MG.tempTop + 9], ['风速', MG.windTop + 9]].forEach(([t, y]) => {
    g.push(s('text', { class: 'is-bd', x: MG.l - 4, y, 'text-anchor': 'end', text: t }));
  });
  [[MG.cloudTop + 3, '100'], [MG.precipTop + 3, '100'], [MG.precipBase + 3, '0'],
   [MG.tempTop + 3, String(T_MAX)], [MG.tempBot + 3, String(T_MIN)], [MG.windTop + 3, '6']].forEach(([y, t]) => {
    g.push(s('text', { class: 'is-sc', x: R + 3, y, text: t }));
  });

  /* 11. 命中区：逐列点选（禁用态不加命中区） */
  if (!isLock) {
    hours.forEach((h, i) => {
      g.push(s('rect', { class: 'd-mg__hit', x: gx(i).toFixed(1), y: 0, width: MG.col, height: MG.h, onclick: () => onPick(i) }));
    });
  }

  return s('svg', { class: 'd-mg', viewBox: `0 0 ${MG.w} ${MG.h}`, role: 'img', 'aria-label': '顶线 48 小时 meteogram' }, ...g);
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const a = D.featured;
  const meta = D.weather.meta;
  const hours = D.weather.hours;
  const page = el('div.page');
  const locked = flag === 'disabled';

  /* ---- 抬头：本屏主读数 = 预报跨度（判定句在标题位，作为结论） ---- */
  page.appendChild(head(`决策仪表 · ${meta.location} · 海拔 ${fmt(meta.elevationM)} m`, meta.verdict,
    { num: String(hours.length), unit: '小时', sub: meta.updatedText.replace(' 更新', '') }));

  if (flag === 'loading') {
    page.appendChild(frag(
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, tileGrid([
        { label: '温度', value: '·', unit: '℃' }, { label: '降水概率', value: '·', unit: '%' },
        { label: '风速', value: '·', unit: 'm/s' }, { label: '云量', value: '·', unit: '%' },
      ])),
      el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel('fig', '100%')),
      ...Array.from({ length: 6 }, () => el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel('row', '100%'))),
      foot(D)
    ));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(errorBlock('气象数据未能读取，请检查网络后重试；出发窗口判定暂不可用。', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  if (flag === 'empty') {
    page.appendChild(emptyBlock(
      '数据缺失',
      `${meta.location} 未来 ${hours.length} 小时没有可用观测记录：温度 / 降水 / 风 / 云量全部不可用，出发窗口无法判定。`,
      '重试读取',
      () => ui.toast('已重试（演示）')
    ));
    page.appendChild(note(meta.source + ' · 数据缺失本身也是决策依据：不具备条件时不出发。', 'warn'));
    page.appendChild(foot(D));
    return page;
  }

  page.appendChild(brief(meta.detail, meta.source));
  if (locked) page.appendChild(note(`只读快照：以下读数为 ${meta.updatedText.replace(' 更新', '')} 的存档数据，逐列不可点选。`, 'warn'));

  /* ---- 选中时段读数面板（随游标联动） ---- */
  const runs = keyRuns(hours);
  const seaRun = runs.find((r) => r.note === '云海窗口');
  const rainRun = runs.find((r) => r.note === '降雨');
  let sel = seaRun ? seaRun.from : 0; /* 默认落在云海窗口首列 */
  const sumLabel = el('div.d-panel__r');
  const sumBody = el('div');
  const sumPanel = el('div.d-panel',
    el('div.d-panel__hd', el('div.d-panel__l', { text: '选中时段读数' }), sumLabel),
    sumBody
  );
  page.appendChild(el('div', { style: { marginTop: 'var(--lab-space-3)' } }, sumPanel));

  let chart = null;
  let chartSlot = null;
  let tbl = null;

  /* 图例（一次构建，挂在读数面板里图表正下方；变量色即 §1-B 的功能色小词典） */
  const legend = el('div.d-mg__legend',
    el('span.d-mg__key', el('i.d-mg__sw.d-mg__sw--temp'), '温度 ≥ ' + COLD_AT + '℃'),
    el('span.d-mg__key', el('i.d-mg__sw.d-mg__sw--cold'), '温度 < ' + COLD_AT + '℃'),
    el('span.d-mg__key', el('i.d-mg__sw.d-mg__sw--p'), '降水概率 %'),
    el('span.d-mg__key', el('i.d-mg__sw.d-mg__sw--cloud'), '云带 = 云量 %'),
    el('span.d-mg__key', el('i.d-mg__sw.d-mg__sw--wind'), '风速 m/s'),
    el('span.d-mg__key', el('i.d-mg__sw.d-mg__sw--night'), '夜间阴影')
  );

  function paintSum() {
    const h = hours[sel];
    sumLabel.textContent = h.label + ' ' + WD[h.t.getDay()];
    sumBody.innerHTML = '';
    /* 数值不带随机强调色；变量身份由标签与下方图表图例承担 */
    sumBody.appendChild(tileGrid([
      { label: '温度', value: h.temp.toFixed(1), unit: '℃', sub: h.night ? '夜间低温' : '日间' },
      { label: '降水概率', value: h.precip, unit: '%', sub: h.precip >= 60 ? '需防雨' : '低', alert: h.precip >= 60 },
      { label: '风速', value: h.wind.toFixed(1), unit: 'm/s', sub: h.wind >= 5 ? '风偏大' : '可接受' },
      { label: '云量', value: h.cloud, unit: '%', sub: h.cloud <= 45 ? '云海机会' : '云厚' },
    ]));
    /* 图表整幅贴边读出（仪表 LCD 条），其余内容回到 12px 标准内边距 */
    chartSlot = el('div.d-chart');
    sumBody.appendChild(chartSlot);
    sumBody.appendChild(el('div.d-panel__bd',
      legend,
      el('div.d-verdict',
        el('div.d-verdict__t', { text: `${h.label} 判定：${verdictOf(h)}${h.keyNote ? ' · ' + h.keyNote : ''}` }),
        el('div.d-verdict__l', led(h.precip >= 60 ? '注意' : h.keyNote ? '关注' : '正常', h.precip >= 60 || h.keyNote ? 'warning' : 'success'))
      ),
      metaRow(
        el('span', '海拔 ', el('b', { text: fmt(meta.elevationM) }), ' m'),
        el('span', locked ? '游标锁定 · 快照不可点选' : `游标 ${sel + 1} / ${hours.length} 列 · 点选换读数`)
      )
    ));
    chart = null;
    paintChart();
  }

  function paintChart() {
    const next = meteogram(hours, runs, sel, pick, locked);
    if (chart) chart.replaceWith(next);
    else chartSlot.appendChild(next);
    chart = next;
  }

  function paintTable() {
    if (!tbl) return;
    tbl.innerHTML = '';
    tbl.appendChild(el('div.d-trow.d-trow--h.d-tbl--hr',
      el('div.d-cell', { text: '时刻' }),
      el('div.d-cell.d-cell--n', { text: '温度 ℃' }),
      el('div.d-cell.d-cell--n', { text: '降水 %' }),
      el('div.d-cell.d-cell--n', { text: '风 m/s' }),
      el('div.d-cell.d-cell--n', { text: '云量 %' }),
      el('div.d-cell', { text: '标记' }),
      el('div.d-cell.d-cell--n', { text: '判定' })
    ));
    let day = '';
    [0].concat(runs.flatMap((r) => range(r.from, r.to))).forEach((i) => {
      const h = hours[i];
      const d = h.label.slice(0, 5);
      if (d !== day) {
        day = d;
        tbl.appendChild(el('div.d-trow.d-trow--span',
          el('span', { text: `${Number(h.label.slice(0, 2))} 月 ${Number(h.label.slice(3, 5))} 日 ${WD[h.t.getDay()]}` }),
          el('span', { text: i === 0 ? '现在 · 集合与出发时段' : (h.keyNote ? h.keyNote + ' 逐时' : '关键窗口列') })
        ));
      }
      tbl.appendChild(el('div.d-trow.d-tbl--hr' + (i === sel ? '.is-sel' : '') + (locked ? '.is-locked' : '.is-tap'), {
        role: 'button',
        title: locked ? '快照不可点选' : '点击把该时段提到读数面板',
        onclick: () => pick(i),
      },
        el('div.d-cell.d-cell--day' + (i === 0 ? '.d-cell--now' : ''), { text: i === 0 ? '现在' : h.label.slice(6, 8) + ' 时' }),
        el('div.d-cell.d-cell--n.d-cell--num' + (h.temp <= COLD_AT ? '.d-cell--cool' : '.d-cell--warm'), { text: h.temp.toFixed(1) }),
        el('div.d-cell.d-cell--n.d-cell--num' + (h.precip >= 60 ? '.d-cell--rain' : ''), { text: String(h.precip) }),
        el('div.d-cell.d-cell--n.d-cell--num.d-cell--wind', { text: h.wind.toFixed(1) }),
        el('div.d-cell.d-cell--n.d-cell--num', { text: String(h.cloud) }),
        el('div.d-cell.d-cell--txt', { text: h.keyNote || (h.night ? '夜间' : '—') }),
        el('div.d-cell.d-cell--n', led(verdictOf(h), h.precip >= 60 ? 'info' : h.keyNote ? 'warning' : 'success'))
      ));
    });
  }

  function pick(i) {
    if (locked) return;
    sel = i;
    paintSum();
    paintChart();
    paintTable();
  }

  paintSum();   /* paintSum 内部会建好图表槽并首次绘制 */

  /* ---- 关键窗口表（来自 meta.window；单位写在表头，值列只放数字） ---- */
  const win = meta.window || [];
  const winRow = win[0] || [];
  page.appendChild(sect('关键窗口', `${win.length} 段 · 来自预报结论`));
  page.appendChild(el('div.d-tbl.d-tbl--win',
    el('div.d-trow.d-trow--h.d-tbl--win',
      el('div.d-cell', { text: '时段' }),
      el('div.d-cell.d-cell--n', { text: '云海 %' }),
      el('div.d-cell.d-cell--n', { text: '风 m/s' }),
      el('div.d-cell.d-cell--n', { text: '判定' })
    ),
    ...win.map((w) => el('div.d-trow.d-tbl--win',
      el('div.d-cell.d-cell--name', { text: w[0] }),
      el('div.d-cell.d-cell--n.d-cell--num', { text: (w[2] || '').replace('云海 ', '') }),
      el('div.d-cell.d-cell--n.d-cell--num', { text: (w[3] || '').replace('风 ', '') }),
      el('div.d-cell.d-cell--n', led('宜等候', 'success'))
    )),
    metaRow(el('span', '云层高度 2100–2500 m · 降水与云量见下方逐时表'), el('span', winRow[1] || '—'))
  ));

  /* ---- 窗口逐时表（关键列，点选联动读数） ---- */
  page.appendChild(sect('窗口逐时', '关键 9 列 + 现在'));
  tbl = el('div.d-tbl.d-tbl--hr');
  page.appendChild(tbl);
  paintTable();

  /* ---- 决策行 ---- */
  const peakNode = (a.itinerary || []).find(([, x]) => /登顶 \d/.test(x)) || [];
  page.appendChild(sect('决策', '保守口径 · 数据不足即不下结论'));
  page.appendChild(el('div',
    kv('建议', `山顶等候 ${winRow[0] || '待定'}：${winRow[1] || '—'} · ${winRow[2] || '云海未知'} · ${winRow[3] || '风未知'}`, null, true),
    kv('云海窗口', seaRun ? hours[seaRun.from].label + ' – ' + hours[seaRun.to].label.slice(6) + ' 时' : '本轮无窗口', null),
    kv('转雨时点', rainRun ? hours[rainRun.from].label : '本轮无雨', '下撤须在此前完成'),
    kv('登顶时刻', peakNode[0] || '—', '行程节点'),
    kv('保暖下限', String(T_MIN) + ' ℃', '装备按此下限准备'),
    kv('数据来源', meta.source)
  ));

  page.appendChild(foot(D));
  return page;
}