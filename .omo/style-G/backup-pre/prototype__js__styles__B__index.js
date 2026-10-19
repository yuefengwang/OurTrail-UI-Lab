// Style B — Swiss Functional（瑞士功能主义）
// 网格即秩序 · 规则线取代容器 · 层级靠字重与位置 · 零圆角零阴影 · 表格化可扫描
// DOM 组织全部为表格 / 网格优先：列宽由 grid 模板锁死，数字右对齐 + tabular，状态词为 1px 边框矩形。
// 只复用共享原语：el / icon / photo / fmt / pad2 / frag。事件一律用 el(..., {onclick})。

import { el, icon, photo, fmt, pad2, frag } from '../../render-common.js';

/* =========================================================
   0. 通用：语义映射与小组件
   ========================================================= */

const BNOTE = '同一演示数据 · 六风格对照实验';
const PHOTO_DIR = 'assets/photos/';

/* 业务状态 → 三档色阶（'' = 墨档 / signal = 唯一信号色 / mute = 灰档）
   刻意不保留「绿黄蓝红」语义四色：瑞士语汇里颜色是稀缺资源，不是状态编码表。 */
const STATUS_KIND = { open: '', hot: 'signal', formed: '', ended: 'mute', cancelled: 'signal' };
const AUDIT_KIND = { 已通过: '', 待审核: 'signal', 候补: 'mute' };

const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 1px 边框矩形状态标签：墨档（无修饰）/ 灰档 / 信号档 / 实心信号档 */
function tag(text, kind) {
  return el('span.b-tag' + (kind ? '.b-tag--' + kind : ''), { text });
}

/** 头条/详情的状态标签：名额紧张用实心信号块，其余走三档 */
const statusTag = (a) => tag(a.status, (a.hot || a.statusKey === 'hot') ? 'fill' : STATUS_KIND[a.statusKey]);

/** 瑞士黑白照片：加载完成后淡入（与 B.css 的 .is-ready 配对） */
function shot(src, alt) {
  const box = photo(PHOTO_DIR + src, { alt });
  const img = box.querySelector('img');
  if (img) {
    if (img.complete && img.naturalWidth) img.classList.add('is-ready');
    else img.addEventListener('load', () => img.classList.add('is-ready'), { once: true });
  }
  return box;
}

/** PLATE：索引表的方形黑白缩略图（自建节点，硬裁切 + 角标活动编号） */
function plate(src, code, label) {
  const box = el('div.b-idx__ph', { title: label || '' });
  const img = el('img', { src: PHOTO_DIR + src, alt: label || '', loading: 'eager' });
  img.addEventListener('load', () => img.classList.add('is-ready'), { once: true });
  if (img.complete && img.naturalWidth) img.classList.add('is-ready');
  box.appendChild(img);
  box.appendChild(el('div.b-idx__ph-no', { text: code }));
  return box;
}

/** 图注：实底黑条 + 微号大写编号（标本册语言） */
function plateBar(no, note) {
  return el('div.b-plate',
    el('span.b-plate__no', { text: no }),
    el('span', { text: note })
  );
}

/** MM/DD（从 dateText 解析，不丢原始字段） */
function md(dateText) {
  const m = /(\d+)\s*月\s*(\d+)/.exec(dateText || '');
  return m ? pad2(m[1]) + '/' + pad2(m[2]) : '—';
}

/** 分区：2px 强规则线 + 标签（右侧可带计数） */
function sect(label, right, first) {
  return el('div.b-sect' + (first ? '.b-sect--first' : ''),
    el('div.b-sect__l', { text: label }),
    right ? el('div.b-sect__n', { text: right }) : null
  );
}

/** 脚注：固定收尾，声明演示数据 */
function foot(D) {
  return el('div.footnote',
    el('div', { text: D.credit }),
    el('div', { text: BNOTE })
  );
}

/** 状态块（空 / 错 / 缺失），外面套 2px 强规则 + 发丝规则 */
function framed(iconName, title, body, actionLabel, onAction) {
  return el('div.b-framed',
    el('div.state-block',
      icon(iconName),
      el('div.state-block__title', { text: title }),
      el('div.state-block__body', { text: body }),
      actionLabel
        ? el('button.btn.btn--primary.btn--sm.state-block__action', { type: 'button', text: actionLabel, onclick: onAction })
        : null
    )
  );
}

const emptyBlock = (title, body, label, fn) => framed('search', title, body, label, fn);
const errorBlock = (body, fn) => framed('alert', '加载失败', body, '重试', fn);

/** 提示条（本风格为 2px 黑左边线 + 无底色） */
const noteLine = (text) => el('div.note.note--line', { text });

/** 骨架块（高度全部来自令牌，不写字面量） */
const skel = (h, w) => el('div.skeleton.b-skel-' + h, w ? { style: { width: w } } : null);

/** 参数网格（2 列：标签左灰 / 值右 tabular）——详情与协作总览共用 */
function specGrid(pairs) {
  return el('div.b-spec', ...pairs.map(([k, v, big]) =>
    el('div.b-spec__cell',
      el('div.b-spec__k', { text: k }),
      el('div.b-spec__v' + (big ? '.b-spec__v--big' : ''), { text: v })
    )
  ));
}

/** 表格：表头与数据行共用同一个列模板修饰符，保证纵向对齐 */
function tableHead(cols, mod) {
  return el('div.b-tbl.b-tbl--head' + (mod ? '.' + mod : ''),
    ...cols.map((c) => el('div.b-cell' + (c.n ? '.b-cell--n' : ''), { text: c.t }))
  );
}
function tableRow(mod, nodes, state) {
  return el('div.b-tbl.b-trow' + (mod ? '.' + mod : '') + (state ? '.' + state : ''), ...nodes);
}

/** 大方格复选框：on=已勾选 / locked=禁用态（灰、不可点） */
function box(on, locked, onclick) {
  const node = el('span.b-chk', { class: on ? 'is-on' : locked ? 'is-locked' : 'is-off' }, on ? icon('check') : null);
  if (!locked && onclick) node.addEventListener('click', onclick);
  return node;
}

/* =========================================================
   1. 发现 — 活动索引表
   ========================================================= */

const OPENISH = (a) => a.statusKey === 'open' || a.statusKey === 'hot';

const FILTERS = [
  { key: 'all', label: '全部', test: () => true, count: (as) => as.length },
  { key: 'open', label: '可报名', test: OPENISH, count: (as) => as.filter(OPENISH).length },
  { key: 'formed', label: '已成行', test: (a) => a.statusKey === 'formed', count: (as) => as.filter((x) => x.statusKey === 'formed').length },
  { key: 'ended', label: '已结束', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled', count: (as) => as.filter((x) => x.statusKey === 'ended' || x.statusKey === 'cancelled').length },
];

function discoverSkeleton(D) {
  return frag(
    el('div.b-toolbar', { style: { marginTop: 'var(--lab-space-3)' } }, skel(44, '100%')),
    sect('正在载入', null, true),
    skel('lead', '100%'),
    el('div.b-idx.b-idx--head',
      el('div.b-cell'), el('div.b-cell'), el('div.b-cell'),
      el('div.b-cell.b-cell--n'), el('div.b-cell'), el('div.b-cell')),
    ...Array.from({ length: 6 }, () =>
      el('div.b-idx.b-idx-row',
        el('div.b-cell', skel(28, '32px')),
        el('div.b-cell', skel(44, '100%')),
        el('div.b-idx__main', skel(12, '80%'), el('div', { style: { marginTop: 'var(--lab-space-1)' } }, skel(12, '52%'))),
        el('div.b-cell', skel(20, '100%')),
        el('div.b-cell', skel(20, '100%')),
        el('div.b-cell')
      )
    ),
    el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, foot(D))
  );
}

export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const acts = D.activities;
  const page = el('div.page');
  const locked = flag === 'disabled';

  /* ---- 页头 ---- */
  page.appendChild(el('div.b-head',
    el('div.b-head__kick.t-kicker', { text: '全部线路 · 按出发时间升序' }),
    el('h1.b-head__title.t-display', { text: '活动索引' })
  ));

  if (flag === 'loading') {
    page.appendChild(discoverSkeleton(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(errorBlock('请检查网络后重试，筛选条件已保留。', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 工具栏：下划线 tabs + 下划线搜索框（同一行） ---- */
  const state = { tab: 'all', q: '' };
  const tabsWrap = el('div.b-tabs');
  const searchInput = el('input', {
    type: 'text',
    placeholder: '搜索活动',
    disabled: locked,
    oninput: (e) => { state.q = (e.target.value || '').trim(); paint(); },
  });
  page.appendChild(el('div.b-toolbar',
    tabsWrap,
    el('div.input.b-search' + (locked ? '.is-off' : ''), icon('search'), searchInput)
  ));

  if (locked) {
    page.appendChild(noteLine('当前为活动归档状态，筛选与搜索暂不可用。'));
  }

  function paintTabs() {
    tabsWrap.innerHTML = '';
    FILTERS.forEach((f) => tabsWrap.appendChild(el('button.b-tab' + (state.tab === f.key ? '.is-active' : '') + (locked ? '.is-off' : ''), {
      type: 'button',
      title: f.label + ' ' + f.count(acts) + ' 场',
      onclick: () => { state.tab = f.key; paintTabs(); paint(); },
    },
      el('span.b-tab__l', { text: f.label }),
      el('span.b-tab__n', { text: String(f.count(acts)) })
    )));
  }

  /* ---- 头条：整幅黑白大图 + 海报标题 + 完整事实格 ---- */
  function leadBlock(a) {
    const cells = [
      ['出发', `${a.dateText} ${a.timeText.replace(' 出发', '')}`],
      ['距离', `${a.distanceKm} km`],
      ['爬升', `${fmt(a.ascentM)} m`],
      ['名额', `${a.signedCount} / ${a.seatsTotal}`],
      ['集合', a.meetingPoint],
      ['截止', a.deadlineText],
      ['难度', a.difficultyText],
      ['领队', a.leader],
    ];
    const fig = el('div.b-lead__fig', shot(a.cover, a.title + ' 氛围图'));
    fig.appendChild(plateBar('PLATE 01 · ' + a.id.toUpperCase(), a.city + ' · UNSPLASH'));
    return el('div.b-lead', { onclick: () => ui.go('detail') },
      fig,
      el('div.b-lead__top',
        el('div.b-lead__kick', '头条 · 领队推荐'),
        statusTag(a)
      ),
      el('div.b-lead__t', { text: a.title }),
      el('div.b-lead__l', { text: a.routeName + ' · ' + a.city }),
      el('div.b-lead__l.b-lead__l--dim', { text: a.lede }),
      el('div.b-lead__f', ...cells.map(([k, v]) =>
        el('div.b-lead__cell',
          el('div.b-lead__k', { text: k }),
          el('div.b-lead__v', { text: v })
        )
      )),
      el('div.b-lead__go',
        el('div.b-lead__cta', '进入活动详情', icon('arrow-right')),
        el('div.b-lead__meta', { text: `${a.weekdayText} ${a.timeText.replace(' 出发', '')} · 领队 ${a.leader}` })
      )
    );
  }

  /* ---- 索引表头：日期 / PLATE / 活动 / KM·M / 状态 / →（单位提到表头做微号大写） ---- */
  const idxHead = el('div.b-idx.b-idx--head',
    el('div.b-cell', { text: '日期' }),
    el('div.b-cell', { text: 'PLATE' }),
    el('div.b-cell', { text: '活动 / 路线' }),
    el('div.b-cell.b-cell--n', { text: 'KM / M' }),
    el('div.b-cell.b-cell--n', { text: '状态' }),
    el('div.b-cell')
  );

  function idxRow(a) {
    return el('button.b-idx.b-idx-row', {
      type: 'button',
      title: a.title + ' · ' + a.routeName,
      onclick: () => ui.go('detail'),
    },
      el('div.b-cell',
        el('div.b-date',
          el('div.b-date__d', { text: md(a.dateText) }),
          el('div.b-date__w', { text: a.weekdayText })
        )
      ),
      el('div.b-cell', plate(a.cover, a.id.toUpperCase(), a.title)),
      el('div.b-cell',
        el('div.b-idx__main',
          el('div.b-idx__t', { text: a.title }),
          el('div.b-idx__r', { text: a.routeName })
        )
      ),
      el('div.b-cell',
        el('div.b-num',
          el('div.b-num__r', el('span.b-num__v', { text: String(a.distanceKm) })),
          el('div.b-num__r', el('span.b-num__v.b-num__v--sub', { text: '↑' + a.ascentM }))
        )
      ),
      el('div.b-cell', el('div.tr.b-idx__rowtag', statusTag(a))),
      el('div.b-cell.b-idx__go', icon('arrow-right'))
    );
  }

  /* ---- 列表区：随筛选 / 搜索实时重绘 ---- */
  const listWrap = el('div');

  function filtered() {
    const f = FILTERS.find((x) => x.key === state.tab) || FILTERS[0];
    const q = state.q;
    return acts.filter((a) => f.test(a) && (
      !q || a.title.includes(q) || a.city.includes(q) || a.routeName.includes(q)
    ));
  }

  function paint() {
    const rows = filtered();
    listWrap.innerHTML = '';

    if (flag === 'empty') {
      listWrap.appendChild(emptyBlock(
        '无筛选结果',
        '当前筛选条件下没有可展示的活动，可清空条件后重新检索。',
        '清空筛选',
        () => ui.setFlag('')
      ));
      listWrap.appendChild(foot(D));
      return;
    }

    if (!rows.length) {
      listWrap.appendChild(el('div.b-inline',
        el('span', { text: '无匹配结果' }),
        el('button.btn.btn--ghost', {
          type: 'button',
          text: '清空筛选条件',
          onclick: () => { state.tab = 'all'; state.q = ''; searchInput.value = ''; paintTabs(); paint(); },
        })
      ));
      listWrap.appendChild(foot(D));
      return;
    }

    const lead = rows.find((a) => a.hot) || rows[0];
    listWrap.appendChild(leadBlock(lead));
    listWrap.appendChild(idxHead);
    rows.filter((a) => a.id !== lead.id).forEach((a) => listWrap.appendChild(idxRow(a)));

    const openN = acts.filter(OPENISH).length;
    const formedN = acts.filter((a) => a.statusKey === 'formed').length;
    const endedN = acts.filter((a) => a.statusKey === 'ended' || a.statusKey === 'cancelled').length;
    listWrap.appendChild(el('div.b-meta',
      el('span', '结果 ', el('b', { text: String(rows.length) }), ' 场'),
      el('span', '可报名 ', el('b', { text: String(openN) }), ' · 已成行 ', el('b', { text: String(formedN) }), ' · 已结束 ', el('b', { text: String(endedN) }))
    ));
    listWrap.appendChild(foot(D));
  }

  paintTabs();
  paint();
  page.appendChild(listWrap);
  return page;
}

/* =========================================================
   2. 详情 — 规格表
   ========================================================= */

function detailSkeleton(D) {
  return frag(
    skel('hero', '100%'),
    el('div', { style: { marginTop: 'var(--lab-section-gap)' } },
      skel(56, '100%'), skel(56, '100%'), skel(56, '100%'), skel(56, '100%')),
    ...Array.from({ length: 5 }, () => el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(44, '100%'))),
    el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, foot(D))
  );
}

/** 从 feeNote 推导费用明细（不硬编业务字段） */
function feeItems(feeNote) {
  const per = /人均约\s*¥\s*(\d+)/.exec(feeNote || '');
  return {
    per: per ? per[1] : null,
    rows: [
      ['包车费用 · ' + (/AA/.test(feeNote || '') ? 'AA 分摊' : '按实际发生'), per ? `¥${per[1]} / 人` : '—'],
      ['平台服务费', /不收取/.test(feeNote || '') ? '¥0' : '—'],
      ['结算方式', /群内结算/.test(feeNote || '') ? '活动结束后群内结算' : '现场结算'],
    ],
  };
}

export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const a = D.featured;
  const page = el('div.page');

  if (flag === 'loading') {
    page.appendChild(el('div.b-head',
      skel(12, '40%'),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(28, '80%')),
      el('div', { style: { marginTop: 'var(--lab-space-1)' } }, skel(12, '50%'))
    ));
    page.appendChild(detailSkeleton(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(framed('alert', '加载失败', '活动详情未能读取，请检查网络后重试。', '重试', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  if (flag === 'empty') {
    page.appendChild(el('div.b-head',
      el('div.b-head__kick.t-kicker', { text: `活动详情 · 编号 ${a.id.toUpperCase()} · ${a.city}` }),
      el('h1.b-head__title.t-display', { text: a.title })
    ));
    page.appendChild(framed('info', '活动已取消', '因上游降雨水量过大，本次活动取消；已报名成员将收到通知。', '去看看其他活动', () => ui.go('discover')));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 标题块：海报级大标题整行占位，状态矩形落到副信息行右侧 ---- */
  page.appendChild(el('div.b-head',
    el('div.b-head__kick.t-kicker', { text: `活动详情 · 编号 ${a.id.toUpperCase()} · ${a.weekdayText}` }),
    el('h1.b-head__title.t-display', { text: a.title }),
    el('div.b-head__row',
      el('div.b-head__lead',
        el('div.b-head__sub', { text: a.routeName + ' · ' + a.city })
      ),
      el('div.b-head__tag', statusTag(a))
    )
  ));

  if (flag === 'disabled') {
    page.appendChild(noteLine('本活动报名已截止，仅可查看行程与集合安排。'));
  } else {
    /* 海报尺度黑白 hero：硬裁切、实底图注，不叠字不压图 */
    const fig = shot(a.cover, a.title + ' 氛围图');
    fig.classList.add('b-fig');
    fig.appendChild(plateBar('PLATE ' + a.id.toUpperCase(), a.city + ' · UNSPLASH'));
    page.appendChild(fig);
  }

  /* ---- 参数网格（2 列 × 4 行；时间用紧凑 tabular 形式，避免值在窄格里断行） ---- */
  const fee = feeItems(a.feeNote);
  const lastNode = (a.itinerary && a.itinerary[a.itinerary.length - 1]) || [];
  page.appendChild(specGrid([
    ['出发', `${md(a.dateText)} ${a.meetingTime}`, true],
    ['结束', lastNode[0] || '-'],
    ['报名截止', flag === 'disabled' ? '已截止' : md(a.deadlineText) + ' ' + a.deadlineText.slice(-5)],
    ['集合', a.meetingPoint],
    ['集合时间', a.meetingTime, true],
    ['名额', `${a.signedCount} / ${a.seatsTotal}`, true],
    ['费用', fee.per ? `¥${fee.per} / 人` : '-'],
    ['领队', a.leader],
  ]));

  /* ---- 行程：编号节点行 ---- */
  page.appendChild(sect('行程', `${(a.itinerary || []).length} 个节点`));
  (a.itinerary || []).forEach(([t, x], i) => {
    page.appendChild(el('div.b-node',
      el('div.b-node__no', { text: pad2(i + 1) }),
      el('div.b-node__t', { text: t }),
      el('div.b-node__x', { text: x })
    ));
  });

  /* ---- 要求：复选框式清单（纯展示行） ---- */
  page.appendChild(sect('要求', `${(a.requirements || []).length} 项`));
  (a.requirements || []).forEach((r) => {
    page.appendChild(el('div.b-req', el('div.b-req__box'), el('div.b-req__x', { text: r })));
  });

  /* ---- 同行人：表格（姓名 / 身份 / 出行 / 座位 / 状态），前 8 位 ---- */
  const mates = D.roster.slice(0, 8);
  page.appendChild(sect('同行人', `${D.roster.length} 人`));
  page.appendChild(tableHead([{ t: '姓名' }, { t: '身份' }, { t: '出行' }, { t: '座位', n: true }, { t: '状态', n: true }], 'b-tbl--mates'));
  mates.forEach((m) => {
    page.appendChild(tableRow('b-tbl--mates', [
      el('div.b-cell.b-cell--name', { text: m.name }),
      el('div.b-cell.b-cell--txt', { text: m.role }),
      el('div.b-cell.b-cell--txt', { text: m.tripMode }),
      el('div.b-cell.b-cell--num.tr', { text: seatText(m) }),
      el('div.b-cell', el('div.tr', tag(m.audit, AUDIT_KIND[m.audit]))),
    ]));
  });
  page.appendChild(el('div.b-meta',
    el('span', '共 ', el('b', { text: String(D.roster.length) }), ' 人 · 领队与车长优先'),
    el('span', '显示前 ', el('b', { text: String(mates.length) }), ' 位')
  ));

  /* ---- 费用：明细行 + 合计行 + 说明 ---- */
  page.appendChild(sect('费用', '平台不抽成'));
  const feeWrap = el('div.b-fee');
  fee.rows.forEach(([k, v]) => feeWrap.appendChild(el('div.b-fee__row',
    el('div.b-fee__k', { text: k }),
    el('div.b-fee__v', { text: v })
  )));
  feeWrap.appendChild(el('div.b-fee__total',
    el('div.b-fee__k', { text: '预计人均合计' }),
    el('div.b-fee__v', { text: fee.per ? `¥${fee.per}` : '—' })
  ));
  page.appendChild(feeWrap);
  page.appendChild(el('div', { style: { marginTop: 'var(--lab-space-3)' } }, noteLine(a.feeNote)));

  /* ---- 底部方角操作条：主操作黑底 / 次操作线框 ---- */
  const cta = el('button.btn.btn--primary', { type: 'button', 'data-testid': 'primary-cta' });
  let ctaState = flag === 'disabled' ? 'off' : 'idle';

  function paintCta() {
    cta.className = 'btn btn--primary';
    if (ctaState === 'idle') { cta.textContent = '立即报名'; cta.disabled = false; }
    else if (ctaState === 'loading') { cta.textContent = '提交中…'; cta.disabled = true; }
    else if (ctaState === 'done') { cta.textContent = '已报名 · 待审核'; cta.disabled = true; }
    else { cta.textContent = '报名已截止'; cta.disabled = true; }
  }
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

  page.appendChild(el('div.b-bar',
    cta,
    el('button.btn.btn--secondary', { type: 'button', text: '分享', onclick: () => ui.toast('已生成分享卡片（演示）') })
  ));
  /* 脚注是最后一个节点；操作条为 sticky，滚到底时正好停在脚注上方 */
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   3. 协作 — 运营控制台
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

function collabSkeleton(D) {
  return frag(
    skel(12, '46%'),
    el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(28, '52%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(56, '100%')),
    el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, skel(44, '100%')),
    ...Array.from({ length: 6 }, () => el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(44, '100%'))),
    el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, foot(D))
  );
}

export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const a = D.featured;
  const page = el('div.page');
  const locked = flag === 'disabled';

  /* 本地可变状态（演示用，不回写共享数据源） */
  const members = D.roster.map((m) => Object.assign({}, m));
  let clockTick = 10;

  function summary() {
    /* 空态演示：名单为空，计数格必须同时归零，不能出现「名单空 · 已到 12/15」的矛盾 */
    if (flag === 'empty') {
      return { total: 0, approved: 0, checked: 0, unchecked: 0, pendingAudit: 0, waitlist: 0, noVehicle: 0 };
    }
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
    };
  }

  if (flag === 'loading') {
    page.appendChild(el('div.b-head',
      skel(12, '46%'),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(28, '52%'))
    ));
    page.appendChild(collabSkeleton(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(framed('alert', '加载失败', '协作面板未能读取，请检查网络后重试。', '重试', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 页头：阶段 ---- */
  page.appendChild(el('div.b-head',
    el('div.b-head__kick.t-kicker', { text: `协作 · 现场控制台 · ${a.title}` }),
    el('h1.b-head__title.t-display', { text: D.collab.phase }),
    el('div.b-head__sub', { text: `出发 ${a.dateText} ${a.timeText.replace(' 出发', '')}` }),
    el('div.b-head__sub', { text: `集合点 ${a.meetingPoint}` })
  ));

  /* ---- 报头图版：72px 宽幅黑白带，给纯表格的现场控制台一个视觉锚点 ---- */
  const band = el('div.b-band', shot(a.cover, a.title + ' 现场氛围图'));
  band.appendChild(plateBar('PLATE ' + a.id.toUpperCase(), '现场控制台 · UNSPLASH'));
  page.appendChild(band);

  /* ---- 三格计数（线分格，tabular 大数） ---- */
  const counts = el('div.b-counts');
  page.appendChild(counts);

  function paintCounts() {
    const s = summary();
    counts.innerHTML = '';
    [
      { k: '待审核', v: String(s.pendingAudit), s: '候补 ' + s.waitlist, hot: s.pendingAudit > 0 },
      { k: '未安排', v: String(s.noVehicle), s: '已通过 ' + s.approved },
      { k: '已到', v: s.checked + '/' + s.approved, s: '未到 ' + s.unchecked },
    ].forEach((c) => counts.appendChild(el('div.b-count' + (c.hot ? '.is-hot' : ''),
      el('div.b-count__k', { text: c.k }),
      el('div.b-count__v', { text: c.v }),
      el('div.b-count__s', { text: c.s })
    )));
  }
  paintCounts();

  if (locked) {
    page.appendChild(el('div', { style: { marginTop: 'var(--lab-space-3)' } },
      noteLine('签到已关闭：领队需在群内点名确认，系统不再接受现场打卡。')));
  }

  /* ---- 下划线 segmented ---- */
  let tab = flag === 'empty' ? 'list' : 'over';
  const segWrap = el('div.seg');
  const panels = {};
  const repaint = {};

  function paintSeg() {
    segWrap.innerHTML = '';
    TABS.forEach((t) => segWrap.appendChild(el('button.seg__item' + (tab === t.key ? '.is-active' : ''), {
      type: 'button',
      text: t.label,
      onclick: () => { tab = t.key; paintSeg(); showPanel(); },
    })));
  }
  function showPanel() {
    TABS.forEach((t) => panels[t.key].classList.toggle('is-hidden', t.key !== tab));
  }
  function refresh() {
    paintCounts();
    if (repaint.over) repaint.over();
    if (repaint.list) repaint.list();
    if (repaint.site) repaint.site();
  }

  page.appendChild(segWrap);
  page.appendChild(sect('控制台', `${summary().total} 人 · ${D.vehicles.length} 台车`, true));

  /* ---- 总览：集合点事实 + 下一步单行 ---- */
  {
    const p = el('div.b-panel');
    p.appendChild(specGrid([
      ['集合点', a.meetingPoint],
      ['集合时间', a.meetingTime, true],
      ['出发时间', a.timeText.replace(' 出发', '')],
      ['报名截止', md(a.deadlineText) + ' ' + a.deadlineText.slice(-5)],
      ['领队', a.leader],
      ['车辆', `${D.vehicles.length} 台 · ${D.vehicles.length * 5} 座`],
      ['已通过', '0 / 0'],
      ['候补', '0 / 0'],
    ]));
    p.appendChild(sect('下一步', null));
    p.appendChild(el('div.b-next', { onclick: () => ui.toast('已发起出发确认（演示）') },
      el('div.b-next__v', { text: '' }),
      el('div.b-next__a', '发起出发确认', icon('arrow-right'))
    ));

    const statCells = p.querySelectorAll('.b-spec__v');
    repaint.over = () => {
      const s = summary();
      statCells[6].textContent = `${s.approved} / ${s.total}`;
      statCells[7].textContent = String(s.waitlist);
      p.querySelector('.b-next__v').textContent = s.unchecked > 0
        ? `还有 ${s.unchecked} 人未到集合点，其中 ${s.noVehicle} 人未安排车辆`
        : '全员已到齐，车辆安排完成，可直接出发';
    };
    repaint.over();
    panels.over = p;
  }

  /* ---- 名单：表格（姓名 / 出行 / 座位 / 状态 / 审核勾选） ---- */
  {
    const p = el('div.b-panel');
    const wrap = el('div');
    p.appendChild(wrap);

    repaint.list = () => {
      wrap.innerHTML = '';
      if (flag === 'empty') {
        wrap.appendChild(framed('users', '名单为空', '当前活动还没有成员报名记录，可先在发现页发起邀请。', '查看可报名活动', () => ui.go('discover')));
        return;
      }
      wrap.appendChild(tableHead([{ t: '姓名' }, { t: '出行' }, { t: '座位', n: true }, { t: '状态', n: true }, { t: '审核', n: true }], 'b-tbl--roster'));
      members.forEach((m) => {
        const approved = m.audit === '已通过';
        wrap.appendChild(tableRow('b-tbl--roster', [
          el('div.b-cell.b-cell--name', { text: m.name }),
          el('div.b-cell.b-cell--txt', { text: m.tripMode }),
          el('div.b-cell.b-cell--num.tr', { text: seatText(m) }),
          el('div.b-cell', el('div.tr', tag(m.audit, AUDIT_KIND[m.audit]))),
          el('div.b-cell.tr', el('div.b-chkwrap' + (approved ? '' : '.is-locked'), {
            title: approved ? '点击切换为待审核' : '仅已通过成员可审核',
          }, box(approved, !approved, () => {
            m.audit = approved ? '待审核' : '已通过';
            refresh();
            ui.toast(`${m.name} 已转为${m.audit}`);
          }))),
        ], approved ? '' : 'is-locked'));
      });
      const s = summary();
      wrap.appendChild(el('div.b-meta',
        el('span', '共 ', el('b', { text: String(s.total) }), ' 人 · 已通过 ', el('b', { text: String(s.approved) })),
        el('span', '未安排车辆 ', el('b', { text: String(s.noVehicle) }))
      ));
    };
    repaint.list();
    panels.list = p;
  }

  /* ---- 分车：车辆块 + 座位矩阵 ---- */
  {
    const p = el('div.b-panel');
    D.vehicles.forEach((v) => {
      const used = v.seats.filter(Boolean).length;
      const cells = [];
      v.seats.forEach((name, i) => {
        if (i === 2) cells.push(el('div.seat.seat--aisle'));
        cells.push(name
          ? el('div.seat.seat--taken', { title: `座位 ${i + 1} · ${name}` }, el('small', { text: String(i + 1) }), el('span', { text: name }))
          : el('div.seat.seat--free', { title: `座位 ${i + 1} · 空位` }, el('small', { text: String(i + 1) }), el('span', { text: '空位' })));
      });
      p.appendChild(el('div.b-veh',
        el('div.b-veh__head',
          el('div.b-veh__l', { text: v.label }),
          el('div.b-veh__m', { text: `${v.plate} · 司机 ${v.driver}` }),
          el('div.b-veh__c', { text: used + '/', }, el('em', { text: String(v.capacity + 1) }))
        ),
        el('div.b-driver', el('div.seat.seat--driver', el('small', { text: '司机' }), el('span', { text: v.driver }))),
        el('div.seat-grid', ...cells)
      ));
    });
    p.appendChild(el('div.b-meta',
      el('span', '车辆 ', el('b', { text: String(D.vehicles.length) }), ' 台 · 每车 4 座 + 司机 1 座'),
      el('span', '未安排 ', el('b', { text: String(summary().noVehicle) }), ' 人')
    ));
    panels.car = p;
  }

  /* ---- 现场：签到清单（大方格 checkbox + 姓名 + 时间；未签到的已通过成员在前） ---- */
  {
    const p = el('div.b-panel');
    const wrap = el('div');
    p.appendChild(wrap);

    function vehText(m) {
      if (m.audit !== '已通过') return `成员 · ${m.audit}`;
      if (!m.vehicleId) return '已通过 · 出行待定';
      const v = D.vehicles.find((x) => x.id === m.vehicleId);
      return `已通过 · ${m.tripMode} ${v ? v.label : ''} ${seatText(m)} 座`;
    }

    repaint.site = () => {
      wrap.innerHTML = '';
      if (flag === 'empty') {
        wrap.appendChild(framed('users', '现场无成员', '名单为空，现场签到清单同步为空。', '查看可报名活动', () => ui.go('discover')));
        return;
      }
      const rank = (m) => (m.audit === '已通过' ? (m.checked ? 1 : 0) : m.audit === '待审核' ? 2 : 3);
      wrap.appendChild(tableHead([{ t: '签到' }, { t: '成员 / 安排' }, { t: '时间', n: true }], 'b-tbl--site'));
      members.slice().sort((x, y) => rank(x) - rank(y)).forEach((m) => {
        const canCheck = m.audit === '已通过' && !locked;
        wrap.appendChild(el('div.b-chkin' + (canCheck ? '' : '.is-locked') + (m.checked ? '.is-now' : ''), {
          onclick: () => {
            if (!canCheck) return;
            m.checked = !m.checked;
            if (m.checked) { clockTick += 1; m.checkedAt = `22:${pad2(Math.min(clockTick, 59))}`; }
            else { m.checkedAt = undefined; }
            refresh();
            ui.toast(m.checked ? `${m.name} 已签到 ${m.checkedAt}` : `${m.name} 已取消签到`);
          },
        },
          box(!!m.checked, !canCheck),
          el('div.b-chkin__m',
            el('div.b-chkin__n', { text: m.name }),
            el('div.b-chkin__d', { text: vehText(m) })
          ),
          el('div.b-chkin__t', { text: m.checked && m.checkedAt ? m.checkedAt : '—' })
        ));
      });
      const s = summary();
      wrap.appendChild(el('div.b-meta',
        el('span', '已签到 ', el('b', { text: String(s.checked) }), ' / ', el('b', { text: String(s.approved) })),
        el('span', '未签到 ', el('b', { text: String(s.unchecked) }))
      ));
    };
    repaint.site();
    panels.site = p;
  }

  TABS.forEach((t) => page.appendChild(panels[t.key]));
  paintSeg();
  showPanel();
  page.appendChild(el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, foot(D)));
  return page;
}

/* =========================================================
   4. 天气 — 预报矩阵
   ========================================================= */

function weatherSkeleton(D) {
  return frag(
    skel(12, '52%'),
    el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(28, '86%')),
    el('div', { style: { marginTop: 'var(--lab-space-3)' } }, skel(44, '100%')),
    ...Array.from({ length: 8 }, () => el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(44, '100%'))),
    el('div', { style: { marginTop: 'var(--lab-section-gap)' } }, foot(D))
  );
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const meta = D.weather.meta;
  const hours = D.weather.hours;
  const page = el('div.page');
  const locked = flag === 'disabled';

  if (flag === 'loading') {
    page.appendChild(el('div.b-head',
      skel(12, '52%'),
      el('div', { style: { marginTop: 'var(--lab-space-2)' } }, skel(28, '86%'))
    ));
    page.appendChild(weatherSkeleton(D));
    return page;
  }

  if (flag === 'error') {
    page.appendChild(framed('alert', '加载失败', '气象数据未能读取，请检查网络后重试。', '重试', () => ui.toast('已重试（演示）')));
    page.appendChild(foot(D));
    return page;
  }

  if (flag === 'empty') {
    page.appendChild(el('div.b-head',
      el('div.b-head__kick.t-kicker', { text: `天气预报 · ${meta.location} · 海拔 ${fmt(meta.elevationM)} m` }),
      el('h1.b-head__title.t-display', { text: meta.verdict })
    ));
    page.appendChild(framed('cloud', '数据缺失', `${meta.location} 未来 48 小时没有可用观测记录，出发窗口无法判定。`, '重试', () => ui.toast('已重试（演示）')));
    page.appendChild(el('div', { style: { marginTop: 'var(--lab-space-3)' } }, noteLine(meta.source)));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 页头：结论 + 站点事实 ---- */
  page.appendChild(el('div.b-head',
    el('div.b-head__kick.t-kicker', { text: `天气预报 · ${meta.location} · 海拔 ${fmt(meta.elevationM)} m` }),
    el('h1.b-head__title.t-display', { text: meta.verdict }),
    el('div.b-head__sub', { text: meta.detail })
  ));
  page.appendChild(el('div.b-meta', el('span', meta.updatedText), el('span', meta.source)));

  if (locked) {
    page.appendChild(noteLine(`只读快照：矩阵为 ${meta.updatedText.replace(' 更新', '')} 的存档数据，不可点选时段。`));
  }

  /* ---- 窗口结论：一条强线总结 ---- */
  const win = (meta.window && meta.window[0]) || [];
  page.appendChild(el('div.b-window',
    el('div.b-window__k', { text: '出发窗口' }),
    el('div.b-window__v', { text: win.join(' · ') || '—' })
  ));

  /* ---- 选中时段汇总行（点选表格行时更新） ---- */
  let sel = Math.max(0, hours.findIndex((h) => h.keyNote === '云海窗口')); // 默认落在「云海窗口」首行
  const sum = el('div.b-sum');
  page.appendChild(sum);

  function paintSum() {
    const h = hours[sel];
    sum.innerHTML = '';
    sum.appendChild(el('span.b-sum__sel', '选中 ', el('b', { text: h.label })));
    sum.appendChild(el('span', '温度 ', el('b', { text: h.temp.toFixed(1) }), ' ℃'));
    sum.appendChild(el('span', '降水 ', el('b', { text: String(h.precip) }), ' %'));
    sum.appendChild(el('span', '风 ', el('b', { text: h.wind.toFixed(1) }), ' m/s'));
    sum.appendChild(el('span', '云量 ', el('b', { text: String(h.cloud) }), ' %'));
    if (h.keyNote) sum.appendChild(tag(h.keyNote, 'signal'));
  }

  /* ---- 矩阵：时间行 × 温度 / 降水 / 风 / 云量（表头带单位，右对齐 tabular） ---- */
  page.appendChild(sect('48 小时预报', `逐小时 · ${hours.length} 条`, true));
  page.appendChild(el('div.b-mx__head',
    el('div.b-cell', { text: '时间' }),
    el('div.b-cell', { text: '标记' }),
    el('div.b-cell.b-cell--n', { text: '温度 ℃' }),
    el('div.b-cell.b-cell--n', { text: '降水 %' }),
    el('div.b-cell.b-cell--n', { text: '风 m/s' }),
    el('div.b-cell.b-cell--n', { text: '云量 %' })
  ));

  const mx = el('div.b-mx');
  const rowRefs = [];
  let prevDay = '';
  hours.forEach((h, i) => {
    const d = h.label.slice(0, 5);
    if (d !== prevDay) {
      prevDay = d;
      mx.appendChild(el('div.b-mx__day' + (i === 0 ? '.is-now' : ''),
        el('div', { text: `${Number(h.label.slice(0, 2))} 月 ${Number(h.label.slice(3, 5))} 日 ${WD[h.t.getDay()]}` }),
        el('span', { text: i === 0 ? '现在' : `${i} 小时后` })
      ));
    }
    const row = el('button.b-mx__row' + (h.key ? '.is-key' : '') + (locked ? '.is-off' : ''), {
      type: 'button',
      onclick: () => {
        if (locked) return;
        sel = i;
        rowRefs.forEach((r) => r.classList.remove('is-sel'));
        row.classList.add('is-sel');
        paintSum();
      },
    },
      el('div.b-mx__cell' + (h.night ? '.b-mx__cell--dim' : ''), { text: h.label }),
      el('div.b-mx__note', { text: h.keyNote || '' }),
      el('div.b-mx__cell.b-mx__cell--n', { text: h.temp.toFixed(1) }),
      el('div.b-mx__cell.b-mx__cell--n', { text: String(h.precip) }),
      el('div.b-mx__cell.b-mx__cell--n', { text: h.wind.toFixed(1) }),
      el('div.b-mx__cell.b-mx__cell--n', { text: String(h.cloud) })
    );
    if (i === sel) row.classList.add('is-sel');
    rowRefs.push(row);
    mx.appendChild(row);
  });
  page.appendChild(mx);

  paintSum();
  page.appendChild(el('div', { style: { marginTop: 'var(--lab-space-3)' } },
    noteLine('标记列：带信号色竖线的时段为关键窗口；点选任意行可把该时段读数提到上方汇总行。')));
  page.appendChild(foot(D));
  return page;
}