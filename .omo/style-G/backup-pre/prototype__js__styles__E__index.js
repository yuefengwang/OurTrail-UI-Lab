// Style E — Expedition Modern（远征现代）
// 色块分区 · 编号骨架 · 远征黄强调 · 高对比行动条。
// DOM 组织：满幅深色块（页头 / 海报 / masthead / 装备牌 / 读数）与浅底版心交替，
// 每个内容区块以「号牌 + 2px 强规则线」开头，CTA 为全宽深色条。
// 只复用共享原语：el / icon / photo / pad2 / frag；事件一律 el(..., {onclick})。

import { el, icon, photo, pad2, frag } from '../../render-common.js';

/* =========================================================
   0. 通用：语义映射与原语
   ========================================================= */

const NOTE_TAIL = '同一演示数据 · 六风格对照实验';
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 脚注：固定收尾，声明演示数据 */
function foot(D) {
  return el('div.footnote',
    el('div', { text: D.credit }),
    el('div', { text: NOTE_TAIL })
  );
}

/** 版心容器（浅底内容的左右内边距） */
const light = (...kids) => el('div.e-gutter', ...kids);

/** 满幅色块容器（不加左右边距，只给上间距） */
const flow = (...kids) => el('div.e-flow', ...kids);

/** 页面顶部的岩石深色块（位于设备壳之下，不延伸进状态栏 / 胶囊区） */
function head({ kick, title, action, extra }) {
  const kids = [el('div.e-head__kick', el('span.e-head__rule'), el('span', { text: kick }))];
  if (title) kids.push(el('div.e-head__title', { text: title }));
  if (action) kids.push(el('div.e-head__action', ...[].concat(action)));
  if (extra) kids.push(extra);
  return el('div.e-head', ...kids);
}

/** 章节头：编号牌 + 标题 + 计数（编号是本风格的版式骨架） */
function sect(no, title, count) {
  return el('div.e-sect',
    el('span.e-plate' + (no === '—' ? '.e-plate--mute' : ''), { text: no }),
    el('span.e-sect__t', { text: title }),
    count ? el('span.e-sect__n', { text: count }) : null
  );
}

/** 事实条（深底用 dark=true） */
function fact(k, v, dark) {
  return el('div.e-fact' + (dark ? '.e-fact--dark' : ''),
    el('div.e-fact__k', { text: k }),
    el('div.e-fact__v', { text: v })
  );
}

/** 提示条 */
const note = (text, key) =>
  el('div.e-note' + (key ? '.e-note--key' : ''), icon(key ? 'shield' : 'info'), el('span', { text }));

/** 状态块（空 / 错误），外面已有 2px 强规则线 */
function stateBlock({ ico = 'info', title, body, action }) {
  return el('div.state-block',
    icon(ico),
    el('div.state-block__title', { text: title }),
    el('div.state-block__body', { text: body }),
    action
      ? el('button.btn.btn--primary.btn--full.state-block__action', {
        type: 'button', text: action.label, onclick: action.onClick,
      })
      : null
  );
}

const emptyBlock = (title, body, label, onClick) =>
  stateBlock({ ico: 'search', title, body, action: label ? { label, onClick } : null });

const errorBlock = (onClick) =>
  stateBlock({ ico: 'alert', title: '加载失败', body: '加载失败，请检查网络后重试。', action: { label: '重试', onClick } });

/** 骨架条 */
const skel = (w, h, dark) => el('div.e-skel' + (dark ? '.e-skel--dark' : ''), { style: { width: w, height: h } });

/** MM/DD（从 dateText 解析，不丢原始字段） */
function md(dateText) {
  const m = /(\d+)\s*月\s*(\d+)/.exec(dateText || '');
  return m ? pad2(m[1]) + '/' + pad2(m[2]) : '—';
}

/** 「10 月 18 日 20:00」→ ['10 月 18 日', '20:00']（按最后一个空格切） */
function splitDeadline(dl) {
  const s = dl || '';
  const i = s.lastIndexOf(' ');
  if (i < 0) return [s || '—', ''];
  return [s.slice(0, i), s.slice(i + 1)];
}

const seatsLeft = (a) => a.seatsTotal - a.signedCount;

/** 发现行侧徽标：报名中 = 名额角标；其余 = 状态词 */
function seatsBadge(a) {
  if (a.statusKey === 'open' || a.statusKey === 'hot') {
    const left = seatsLeft(a);
    const mod = left <= 3 ? '.e-badge--tight' : left <= 7 ? '.e-badge--solid' : '';
    return el('span.e-badge' + mod, { text: `剩 ${left} 席` });
  }
  if (a.statusKey === 'cancelled' || a.statusKey === 'ended') return el('span.e-badge.e-badge--mute', { text: a.status });
  return el('span.e-badge.e-badge--info', { text: a.status });
}

/** 详情 / 海报的名额号牌（黄 = 紧张；白 / 深色实底 = 常规） */
function seatsSticker(a, onDark) {
  const left = seatsLeft(a);
  const mod = left <= 3
    ? '.e-badge--tight'
    : onDark ? '.e-badge--on-dark.e-badge--solid' : '.e-badge--solid';
  return el('span.e-badge' + mod, { text: `剩 ${left} 席` });
}

/** 审核状态词 */
function auditBadge(audit) {
  if (audit === '已通过') return el('span.e-badge.e-badge--solid', { text: '已通过' });
  if (audit === '待审核') return el('span.e-badge.e-badge--tight', { text: '待审核' });
  return el('span.e-badge.e-badge--mute', { text: '候补' });
}

const seatNoText = (m) => (m.seatNo === 'driver' ? '司机' : m.seatNo == null ? '待定' : `${m.seatNo} 号座`);

/* =========================================================
   1. 发现 — 海报流
   ========================================================= */

const FILTERS = [
  { key: 'all', label: '全部', test: () => true },
  { key: 'open', label: '可报名', test: (a) => a.statusKey === 'open' || a.statusKey === 'hot' },
  { key: 'formed', label: '已成行', test: (a) => a.statusKey === 'formed' },
  { key: 'ended', label: '已结束', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
];

/** 真实分组：计数全部来自当前筛选后的数据 */
const GROUPS = [
  { title: '正在接受报名', test: (a) => a.statusKey === 'open' || a.statusKey === 'hot' },
  { title: '已成行 · 出发准备中', test: (a) => a.statusKey === 'formed' },
  { title: '已归档', test: (a) => a.statusKey === 'ended' || a.statusKey === 'cancelled' },
];

function discoverBodySkeleton() {
  return frag(
    el('div.e-skelrow',
      skel('100%', '132px', true),
      skel('68%', '16px'),
      skel('54%', '30px')
    ),
    el('div.e-skelrow', { style: { marginTop: 'var(--lab-space-6)' } },
      ...Array.from({ length: 4 }, () => el('div.e-skelrow.e-skelrow--row', { style: { paddingBottom: 'var(--lab-space-3)' } },
        skel('72px', '72px'),
        el('div.e-skelrow', { style: { flex: '1' } }, skel('88%', '16px'), skel('64%', '12px'), skel('46%', '12px'))
      ))
    )
  );
}

export function renderDiscover(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.e-page');
  const feat = D.featured;
  const openCount = D.activities.filter((a) => a.statusKey === 'open' || a.statusKey === 'hot').length;

  page.appendChild(head({
    kick: '发现远征',
    title: '十月，向山里去',
    action: [el('b', { text: String(D.activities.length) }), ' 场活动已发布 · ', el('b', { text: String(openCount) }), ' 场仍可报名'],
  }));

  if (flag === 'loading') {
    page.appendChild(light(el('div.e-skelrow', { style: { paddingTop: 'var(--lab-space-4)' } },
      skel('100%', '40px'), skel('100%', '42px')), discoverBodySkeleton()));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 白底工具条：粗体筛选 + 实时搜索（夹在深色块与海报之间形成色块交替） ---- */
  const off = flag === 'disabled';
  const tabs = el('div.e-tabs');
  const input = el('input', { type: 'search', placeholder: '搜索路线、城市或领队', disabled: off || undefined });
  const search = el('label.e-search' + (off ? '.is-off' : ''), icon('search'), input);
  page.appendChild(el('div.e-toolbar', tabs, search));

  const posterBox = flow();
  const listBox = light();
  page.appendChild(posterBox);
  page.appendChild(listBox);

  let filter = 'all';
  let kw = '';

  const hits = () => {
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    const k = kw.trim().toLowerCase();
    return D.activities.filter(f.test)
      .filter((a) => !k || (a.title + a.routeName + a.city + a.leader).toLowerCase().includes(k));
  };

  function rowNode(a, no) {
    const lite = a.difficulty === '入门' ? '.e-plate--lite' : '';
    return el('button.e-row' + (a.statusKey === 'ended' || a.statusKey === 'cancelled' ? '.e-row--mute' : ''), {
      type: 'button',
      onclick: () => ui.go('detail'),
    },
      el('div.e-row__thumb',
        photo('assets/photos/' + a.cover, { alt: a.title }),
        el('span.e-row__no.e-plate' + lite, { text: no })
      ),
      el('div.e-row__main',
        rowTitle(a.title),
        el('div.e-row__route', { text: a.routeName }),
        el('div.e-row__facts',
          el('span', { text: `${a.distanceKm} km` }),
          el('span', { text: `↑${a.ascentM} m` }),
          el('span', { text: `${md(a.dateText)} ${a.weekdayText}` }),
          el('span', { text: `${a.difficultyText} · ${a.city}` })
        )
      ),
      el('div.e-row__side', seatsBadge(a), icon('chevron-right'))
    );
  }

  function paint() {
    tabs.innerHTML = '';
    FILTERS.forEach((f) => {
      const n = D.activities.filter(f.test).length;
      tabs.appendChild(el('button.e-tab' + (f.key === filter ? '.is-on' : '') + (off ? '.is-off' : ''), {
        type: 'button',
        onclick: () => { filter = f.key; paint(); },
      }, el('span', { text: f.label }), el('span.e-tab__n', { text: pad2(n) })));
    });

    const shown = hits();
    posterBox.innerHTML = '';
    if (shown.some((a) => a.id === feat.id)) posterBox.appendChild(poster(D, ui));

    listBox.innerHTML = '';
    if (flag === 'error') { listBox.appendChild(errorBlock(() => ui.toast('已重试（演示）'))); return; }
    if (flag === 'empty' || shown.length === 0) {
      listBox.appendChild(el('div.e-flow-lead',
        emptyBlock('没有符合条件的远征', '当前筛选与搜索没有结果。换个筛选，或清空关键词重新查找。', '清空筛选', () => ui.setFlag(''))));
      return;
    }

    const rest = shown.filter((a) => a.id !== feat.id);
    let seq = 0;
    GROUPS.forEach((g, gi) => {
      const items = rest.filter(g.test);
      if (!items.length) return;
      listBox.appendChild(sect(pad2(gi + 1), g.title, `${pad2(items.length)} 项`));
      const wrap = el('div.e-list');
      items.forEach((a) => { seq += 1; wrap.appendChild(rowNode(a, pad2(seq))); });
      listBox.appendChild(wrap);
    });
  }

  input.addEventListener('input', () => { kw = input.value; paint(); });
  paint();
  page.appendChild(foot(D));
  return page;
}

/** 海报卡：照片压暗 + 大字叠底 + 黄号牌 + 名额贴纸 + 实色信息带 */
/** 标题：尾部括注（如「（2 日）」）作为不可拆整体，避免中文断行把括注劈成孤字 */
function rowTitle(t) {
  const m = /^(.+?)（(.+?)）$/.exec(t || '');
  return m
    ? el('div.e-row__title', el('span', { text: m[1] }), el('span.e-row__nb', { text: `（${m[2]}）` }))
    : el('div.e-row__title', { text: t });
}

function poster(D, ui) {
  const a = D.featured;
  return el('button.e-poster', { type: 'button', onclick: () => ui.go('detail') },
    el('div.e-poster__media',
      photo('assets/photos/' + a.cover, { alt: a.title }),
      el('div.e-poster__scrim'),
      el('div.e-poster__top',
        el('span.e-plate', { text: 'R-018' }),
        el('span.e-badge.e-badge--on-dark.e-badge--solid', { text: `剩 ${pad2(seatsLeft(a))} 席` })
      ),
      el('div.e-poster__foot',
        el('div.e-poster__kick', { text: `${a.city} · ${a.difficultyText} · 领队 ${a.leader}` }),
        el('div.e-poster__title', { text: a.title }),
        el('div.e-poster__facts', { text: `${a.distanceKm} km · ↑${a.ascentM} m · ${a.routeName}` })
      )
    ),
    el('div.e-poster__band',
      el('div.e-poster__lede', { text: a.lede }),
      el('div.e-poster__go',
        el('span', { text: `${a.dateText} ${a.weekdayText} · ${a.timeText}` }),
        icon('arrow-right')
      )
    )
  );
}

/* =========================================================
   2. 详情 — 远征档案
   ========================================================= */

function detailBodySkeleton() {
  return el('div.e-skelrow',
    skel('100%', '110px'),
    skel('100%', '170px'),
    skel('100%', '120px'),
    skel('100%', '120px')
  );
}

export function renderDetail(ctx) {
  const { D, flag, ui } = ctx;
  const a = D.featured;
  const page = el('div.page.e-page');
  const dl = splitDeadline(a.deadlineText);

  /* ---- 深色 masthead：封面色块 + 大标题 + 黄编号 + 状态 + 日期 ---- */
  page.appendChild(el('div.e-mast',
    el('div.e-mast__media',
      photo('assets/photos/' + a.cover, { alt: a.title }),
      el('div.e-mast__scrim'),
      el('div.e-mast__top',
        el('span.e-plate', { text: 'R-018' }),
        seatsSticker(a, true)
      ),
      el('div.e-mast__foot',
        el('div.e-mast__title', { text: a.title }),
        el('div.e-mast__route', { text: `${a.routeName} · ${a.city} · 领队 ${a.leader}` })
      )
    ),
    el('div.e-mast__band',
      el('div.e-mast__banddate',
        el('span.e-mast__bandno', { text: md(a.dateText) }),
        el('span.e-mast__bandwd', { text: a.weekdayText })
      ),
      el('div.e-mast__bandoff',
        el('span.e-badge.e-badge--on-dark.e-badge--solid', { text: a.status }),
        el('div.e-mast__bandtime',
          el('span.e-mast__bandtl', { text: '出发时间' }),
          el('span.e-mast__bandtv', { text: a.meetingTime })
        )
      )
    )
  ));

  if (flag === 'loading') {
    page.appendChild(light(el('div.e-flow-lead', detailBodySkeleton())));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(light(el('div.e-flow-lead', errorBlock(() => ui.toast('已重试（演示）')))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'empty') {
    page.appendChild(light(el('div.e-flow-lead', stateBlock({
      ico: 'x',
      title: '本次远征已取消',
      body: '因上游降雨，活动取消，已报名成员会收到通知，费用全退。',
      action: { label: '去看看其他活动', onClick: () => ui.go('discover') },
    }))));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 事实砖：2 列大数字（距离 / 爬升 / 名额 / 截止）；顶部黄轨由样式统一承担 ---- */
  page.appendChild(light(
    el('div.e-tiles',
      el('div.e-tile',
        el('div.e-fact__k', { text: '距离' }),
        el('div.e-tile__v', el('span', { text: String(a.distanceKm) }), el('span.e-unit', { text: 'km' }))
      ),
      el('div.e-tile',
        el('div.e-fact__k', { text: '累计爬升' }),
        el('div.e-tile__v', el('span', { text: '↑' + String(a.ascentM) }), el('span.e-unit', { text: 'm' }))
      ),
      el('div.e-tile',
        el('div.e-fact__k', { text: `名额 · 共 ${a.seatsTotal}` }),
        el('div.e-tile__v', el('span', { text: String(seatsLeft(a)) }), el('span.e-unit', { text: '席可报' }))
      ),
      el('div.e-tile',
        el('div.e-fact__k', { text: '报名截止' }),
        el('div.e-tile__v', el('span', { text: md(a.deadlineText) }), el('span.e-unit', { text: dl[1] }))
      )
    )
  ));

  /* ---- 01 行程 ---- */
  page.appendChild(light(sect('01', '行程', `${pad2(a.itinerary.length)} 个节点`)));
  const itin = el('div.e-itin');
  a.itinerary.forEach(([t, x]) => {
    itin.appendChild(el('div.e-itin__row',
      el('div.e-itin__t', { text: t }),
      el('div.e-itin__x', { text: x })
    ));
  });
  page.appendChild(light(itin));

  /* ---- 02 集合与时间（满幅深色装备牌：形成色块交替） ---- */
  page.appendChild(light(sect('02', '集合与时间')));
  page.appendChild(el('div.e-gear',
    el('div.e-gear__place',
      el('div.e-gear__pk', { text: '集合点' }),
      el('div.e-gear__p', { text: a.meetingPoint })
    ),
    el('div.e-gear__rule'),
    el('div.e-gear__clock',
      el('div.e-gear__pk', { text: '集合时间' }),
      el('div.e-gear__t', { text: a.meetingTime })
    ),
    el('div.e-gear__rule'),
    el('div.e-gear__grid',
      fact('出发', `${md(a.dateText)} ${a.weekdayText}`, true),
      fact('报名截止', `${md(a.deadlineText)} ${dl[1]}`, true),
      fact('难度', a.difficultyText, true)
    )
  ));

  /* ---- 03 装备与要求 ---- */
  page.appendChild(light(sect('03', '装备与要求', `${pad2(a.requirements.length)} 项`)));
  const req = el('div.e-req');
  a.requirements.forEach((r) => {
    const must = r.indexOf('必备') >= 0;
    req.appendChild(el('div.e-req__row',
      el('span.e-chk.is-sm' + (must ? '.is-key' : ''), must ? icon('check') : null),
      el('div.e-req__x', { text: r }),
      must ? el('span.e-req__k.e-plate', { text: '必备' }) : null
    ));
  });
  page.appendChild(light(req));

  /* ---- 04 费用与约定 ---- */
  page.appendChild(light(sect('04', '费用与约定', '平台不抽成')));
  page.appendChild(light(el('div.e-fee',
    el('div.e-fee__row', el('span.e-fee__k', { text: '包车与装备' }), el('span.e-fee__v', { text: '活动内 AA' })),
    el('div.e-fee__row', el('span.e-fee__k', { text: '平台服务费' }), el('span.e-fee__v', { text: '¥0' })),
    el('div.e-fee__row', el('span.e-fee__k', { text: '结算方式' }), el('span.e-fee__v', { text: '结束后群内结算' })),
    note(a.feeNote, true)
  )));

  /* ---- 05 同行人：头像圆点 + 编号行 ---- */
  const mates = D.roster.filter((m) => m.audit === '已通过');
  const shownMates = mates.slice(0, 6);
  page.appendChild(light(sect('05', '同行人', `${pad2(mates.length)} 人已通过`)));
  const matesBox = el('div.e-mates');
  shownMates.forEach((m, i) => {
    matesBox.appendChild(el('div.e-mate',
      el('span.e-mate__no', { text: pad2(i + 1) }),
      el('span.avatar' + (m.id === 'm01' ? '.avatar--brand' : ''), { text: m.name.slice(0, 1) }),
      el('span.e-mate__name', { text: m.name }),
      el('span.e-mate__role', { text: m.role === '成员' ? m.tripMode : m.role }),
      el('span.e-mate__st', el('span.e-badge' + (m.checked ? '.e-badge--solid' : ''), {
        text: m.checked ? `已签到 ${m.checkedAt}` : '未到',
      }))
    ));
  });
  matesBox.appendChild(el('div.e-mate',
    el('span.e-mate__no', { text: pad2(shownMates.length + 1) }),
    el('span.avatar', { text: '+' }),
    el('span.e-mate__name', { text: `另外 ${mates.length - shownMates.length} 人` }),
    el('span.e-mate__role', { text: '等待出发' })
  ));
  page.appendChild(light(matesBox));

  /* ---- 底部全宽 CTA：近黑块（步骤标签 + 次操作 + 信息行）+ 远征黄主按钮 ---- */
  const kick = el('div.e-cta__kick', icon('flag'), el('span', { text: 'STEP 05 · 报名通道' }));
  const why = el('div.e-cta__note');
  const bar = el('button.e-cta__bar', { type: 'button', 'data-testid': 'primary-cta' });
  let state = flag === 'disabled' ? 'off' : 'idle';

  function paintBar() {
    bar.className = 'e-cta__bar';
    bar.innerHTML = '';
    if (state === 'idle') {
      bar.appendChild(el('span', { text: '加入本次远征' }));
      bar.appendChild(icon('arrow-right'));
      why.textContent = `${seatsLeft(a)} 席可报 · 报名截止 ${a.deadlineText}`;
    } else if (state === 'loading') {
      bar.appendChild(el('span', { text: '提交中…' }));
      bar.appendChild(icon('timer'));
      bar.classList.add('is-off');
      why.textContent = '正在提交报名信息，请稍候';
    } else if (state === 'done') {
      bar.appendChild(el('span', { text: '已报名 · 待审核' }));
      bar.appendChild(icon('check-circle'));
      bar.classList.add('is-done');
      why.textContent = `领队 ${a.leader} 会审核申请，通过后进入分车`;
    } else {
      bar.appendChild(el('span', { text: '报名已截止' }));
      bar.appendChild(icon('x'));
      bar.classList.add('is-off');
      why.textContent = `报名通道已于 ${a.deadlineText} 关闭，可关注同类活动`;
    }
  }
  bar.addEventListener('click', () => {
    if (state !== 'idle') return;
    state = 'loading';
    paintBar();
    setTimeout(() => {
      state = 'done';
      paintBar();
      ui.toast('报名成功，等待领队审核');
    }, 700);
  });
  paintBar();

  page.appendChild(el('div.e-cta',
    el('div.e-cta__top',
      kick,
      el('button.e-cta__share', {
        type: 'button', onclick: () => ui.toast('已生成分享卡片（演示）'),
      }, icon('share'), el('span', { text: '分享给同行伙伴' }))
    ),
    why,
    bar
  ));
  /* 脚注为最后一个节点；滚到底时 CTA 条正好停在它上方 */
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   3. 协作 — 指挥舱
   ========================================================= */

const TABS = [
  { key: 'over', label: '总览' },
  { key: 'list', label: '名单' },
  { key: 'car', label: '分车' },
  { key: 'site', label: '现场' },
];

const STEPS = ['集合', '分车', '出发'];

function collabSkeleton() {
  return frag(
    el('div.e-head', el('div.e-skelrow',
      skel('34%', '14px', true),
      skel('60%', '34px', true),
      skel('100%', '10px', true),
      skel('100%', '6px', true))),
    el('div.e-seg', skel('100%', '40px')),
    light(el('div.e-skelrow', { style: { marginTop: 'var(--lab-space-4)' } },
      skel('100%', '120px'),
      ...Array.from({ length: 5 }, () => el('div.e-skelrow.e-skelrow--row', { style: { paddingBottom: 'var(--lab-space-3)' } },
        skel('72px', '72px'),
        el('div.e-skelrow', { style: { flex: '1' } }, skel('82%', '14px'), skel('54%', '12px'))))
    ))
  );
}

export function renderCollab(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.e-page');
  const roster = D.roster;
  const a = D.featured;
  const off = flag === 'disabled';

  if (flag === 'loading') {
    page.appendChild(collabSkeleton());
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'error') {
    page.appendChild(head({ kick: `活动协作 · ${a.title}`, title: '指挥舱', action: '成员、车辆与签到数据未能加载。' }));
    page.appendChild(light(el('div.e-flow-lead', errorBlock(() => ui.toast('已重试（演示）')))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'empty') {
    page.appendChild(head({ kick: `活动协作 · ${a.title}`, title: '待报名', action: '本次远征还没有成员，签到与分车暂不可用。' }));
    page.appendChild(light(el('div.e-flow-lead', stateBlock({
      ico: 'users',
      title: '成员列表为空',
      body: '还没有人报名。可以分享活动链接，或先回到发现页看看其他远征。',
      action: { label: '回到发现页', onClick: () => ui.go('discover') },
    }))));
    page.appendChild(foot(D));
    return page;
  }

  const st = {
    tab: 'over',
    checked: new Set(roster.filter((m) => m.checked).map((m) => m.id)),
    launched: false,
  };

  function calc() {
    const approved = roster.filter((m) => m.audit === '已通过');
    const pending = roster.filter((m) => m.audit === '待审核');
    const wait = roster.filter((m) => m.audit === '候补');
    const checked = roster.filter((m) => st.checked.has(m.id));
    const noVehicle = approved.filter((m) => !m.vehicleId);
    const unchecked = approved.filter((m) => !st.checked.has(m.id));
    const step = unchecked.length === 0 ? (noVehicle.length === 0 ? 2 : 1) : (noVehicle.length === 0 ? 1 : 0);
    return { approved, pending, wait, checked, noVehicle, unchecked, step };
  }

  const vehicleLabel = (vid) => {
    const v = D.vehicles.find((x) => x.id === vid);
    return v ? v.label : '';
  };

  /* ---------------- 深色状态头：阶段 + 超大数字 + 编排进度带 ---------------- */
  const headBox = el('div.e-head');
  const phaseEl = el('div.e-cab__phase');
  const hugeEl = el('span.e-num.e-num--xl.e-num--accent');
  const lblEl = el('span.e-cab__countlbl');
  const ribbon = el('div.progress-line');
  const stepsRow = el('div.e-cab__steps');
  const factsRow = el('div.e-cab__facts');
  STEPS.forEach(() => ribbon.appendChild(el('div.progress-line__seg')));
  STEPS.forEach((s) => stepsRow.appendChild(el('span.e-cab__step', { text: s })));
  headBox.appendChild(el('div.e-head__kick', el('span.e-head__rule'), el('span', { text: `活动协作 · ${a.title}` })));
  headBox.appendChild(el('div.e-cab__top', phaseEl, el('div.e-cab__count', hugeEl, lblEl)));
  headBox.appendChild(el('div.e-cab__ribbon', ribbon, stepsRow));
  headBox.appendChild(factsRow);

  function paintHead(c) {
    phaseEl.textContent = st.launched ? '出发确认中' : STEPS[c.step];
    const showUnchecked = !st.launched;
    hugeEl.textContent = String(showUnchecked ? c.unchecked.length : c.approved.length);
    lblEl.textContent = showUnchecked ? '未签到' : '人确认出发';
    [...ribbon.children].forEach((seg, i) => {
      seg.classList.toggle('is-done', st.launched ? true : i < c.step);
      seg.classList.toggle('is-current', !st.launched && i === c.step);
    });
    [...stepsRow.children].forEach((n, i) => {
      n.classList.toggle('is-done', st.launched ? true : i < c.step);
      n.classList.toggle('is-current', !st.launched && i === c.step);
    });
    factsRow.innerHTML = '';
    factsRow.appendChild(fact('集合点', a.meetingPoint, true));
    factsRow.appendChild(fact('出发', a.meetingTime, true));
    factsRow.appendChild(fact('待审核', `${c.pending.length} 人`, true));
    factsRow.appendChild(fact('候补', `${c.wait.length} 人`, true));
  }

  /* ---------------- 粗体光面条 ---------------- */
  const segBox = el('div.e-seg');
  TABS.forEach((t) => {
    segBox.appendChild(el('button.e-seg__i', {
      type: 'button', onclick: () => { st.tab = t.key; paint(); },
    }, el('span', { text: t.label })));
  });

  /* ---------------- 签到开关（仅 audit=已通过 可点） ---------------- */
  function toggle(m) {
    if (off || m.audit !== '已通过') return;
    if (st.checked.has(m.id)) st.checked.delete(m.id);
    else st.checked.add(m.id);
    ui.toast(st.checked.has(m.id) ? `${m.name} 已签到集合点` : `已撤销 ${m.name} 的签到`);
    paint();
  }
  function chkBox(m) {
    const on = st.checked.has(m.id);
    return el('button.e-chk' + (on ? '.is-on' : '') + (m.audit !== '已通过' || off ? '.is-off' : ''), {
      type: 'button',
      'aria-label': on ? `撤销 ${m.name} 的签到` : `将 ${m.name} 标记为已签到`,
      onclick: () => toggle(m),
    }, on ? icon('check') : null);
  }

  /* ---------------- 分页内容 ---------------- */
  function paintOver(c) {
    const box = el('div');
    box.appendChild(sect('01', '编排总览', `${pad2(roster.length)} 人`));
    if (off) box.appendChild(el('div.e-lead', note('签到已锁定：本次集合已封存，成员端与分车调整均为只读。', true)));
    box.appendChild(el('div.e-stats',
      el('div.e-stat', el('div.e-fact__k', { text: '已签到' }),
        el('div.e-stat__v', el('span', { text: String(c.checked.length) }), el('span.e-unit', { text: `/ ${c.approved.length}` }))),
      el('div.e-stat', el('div.e-fact__k', { text: '未签到' }),
        el('div.e-stat__v', el('span', { text: String(c.unchecked.length) }), el('span.e-unit', { text: '人' }))),
      el('div.e-stat', el('div.e-fact__k', { text: '待审核' }),
        el('div.e-stat__v', el('span', { text: String(c.pending.length) }), el('span.e-unit', { text: '人' }))),
      el('div.e-stat', el('div.e-fact__k', { text: '未安排车辆' }),
        el('div.e-stat__v', el('span', { text: String(c.noVehicle.length) }), el('span.e-unit', { text: '人' })))
    ));

    box.appendChild(sect('02', '车辆概览', `${pad2(D.vehicles.length)} 台车`));
    D.vehicles.forEach((v) => {
      const taken = v.seats.filter(Boolean).length;
      box.appendChild(el('div.e-vehicle',
        el('div.e-vehicle__h',
          el('span.e-vehicle__name', { text: v.label }),
          el('span.e-vehicle__plate', { text: v.plate }),
          el('span.e-vehicle__load', el('span.e-badge' + (taken >= v.capacity ? '.e-badge--solid' : ''), { text: `${taken}/${v.capacity} 座` }))
        ),
        el('div.e-driver', icon('car'), el('span', { text: `司机 ${v.driver}` }), el('span.e-driver__k', { text: 'DRIVER' }))
      ));
    });

    box.appendChild(sect('03', '待处理', `${pad2(c.pending.length + c.noVehicle.length + c.wait.length)} 项`));
    const todo = el('div.e-member');
    let n = 0;
    const addRow = (m, metaText, badge) => {
      n += 1;
      todo.appendChild(el('div.e-member__row',
        el('span.e-member__no', { text: pad2(n) }),
        el('div.e-member__id',
          el('div.e-member__name', { text: `${m.name} · ${m.role}` }),
          el('div.e-member__meta', { text: metaText })
        ),
        el('span.e-member__side', badge)
      ));
    };
    c.pending.forEach((m) => addRow(m, '提交了报名申请，待审核', auditBadge(m.audit)));
    c.noVehicle.forEach((m) => addRow(m, '出行方式待定，需分车', el('span.e-badge.e-badge--tight', { text: '待分车' })));
    c.wait.forEach((m) => addRow(m, '在候补队列', auditBadge(m.audit)));
    box.appendChild(todo);
    return box;
  }

  function paintList(c) {
    const box = el('div');
    box.appendChild(sect('01', '成员名单', `${pad2(roster.length)} 人`));
    if (off) box.appendChild(el('div.e-lead', note('签到已锁定：出发前的现场点名由领队统一记录，成员端只读。', true)));
    const list = el('div.e-member');
    roster.forEach((m, i) => {
      const approved = m.audit === '已通过';
      const on = st.checked.has(m.id);
      list.appendChild(el('div.e-member__row',
        el('span.e-member__no', { text: pad2(i + 1) }),
        el('div.e-member__id',
          el('div.e-member__name', { text: `${m.name} · ${m.role}` }),
          el('div.e-member__meta', {
            text: `${m.tripMode}${approved && m.vehicleId ? ` · ${vehicleLabel(m.vehicleId)} ${seatNoText(m)}` : ''}`,
          })
        ),
        el('span.e-member__side',
          approved
            ? el('span.e-badge' + (on ? '.e-badge--solid' : '.e-badge--mute'), { text: on ? '已签到' : '未签到' })
            : auditBadge(m.audit),
          approved ? chkBox(m) : null
        )
      ));
    });
    box.appendChild(list);
    return box;
  }

  function paintCar(c) {
    const box = el('div');
    box.appendChild(sect('01', '分车与座位', `${pad2(D.vehicles.length)} 台车`));
    if (c.noVehicle.length) {
      box.appendChild(el('div.e-lead', note(`${c.noVehicle.length} 人尚未安排车辆：${c.noVehicle.map((m) => m.name).join('、')}。`, true)));
    } else if (off) {
      box.appendChild(el('div.e-lead', note('分车已锁定：座位矩阵为出发时版本，不再接受调整。', true)));
    }
    D.vehicles.forEach((v) => {
      const taken = v.seats.filter(Boolean).length;
      const grid = el('div.seat-grid');
      v.seats.forEach((name, si) => {
        if (si === 2) grid.appendChild(el('div.seat.seat--aisle'));
        grid.appendChild(name
          ? el('div.seat.seat--taken', el('span', { text: name }), el('small', { text: `${si + 1} 号座` }))
          : el('div.seat.seat--free', el('span', { text: '空位' }), el('small', { text: `${si + 1} 号座` })));
      });
      box.appendChild(el('div.e-vehicle',
        el('div.e-vehicle__h',
          el('span.e-vehicle__name', { text: v.label }),
          el('span.e-vehicle__plate', { text: v.plate }),
          el('span.e-vehicle__load', el('span.e-badge' + (taken >= v.capacity ? '.e-badge--solid' : ''), { text: `${taken}/${v.capacity} 座` }))
        ),
        el('div.e-driver', icon('car'), el('span', { text: `司机 ${v.driver}` }), el('span.e-driver__k', { text: 'DRIVER' })),
        grid
      ));
    });
    return box;
  }

  function paintSite(c) {
    const box = el('div');
    box.appendChild(sect('01', '现场签到', `${c.checked.length}/${c.approved.length} 已到`));
    if (off) box.appendChild(el('div.e-lead', note('签到已锁定：本次集合已封存，如需更正请联系领队。', true)));
    const list = el('div.e-site');
    c.approved.forEach((m, i) => {
      const on = st.checked.has(m.id);
      list.appendChild(el('div.e-site__row',
        el('span.e-member__no', { text: pad2(i + 1) }),
        el('span.avatar', { text: m.name.slice(0, 1) }),
        el('span.e-member__name', { text: m.name }),
        el('span.e-site__time', { text: on ? m.checkedAt : '未到' }),
        chkBox(m)
      ));
    });
    box.appendChild(list);
    return box;
  }

  /* ---------------- 下一步：全宽深色条 CTA ---------------- */
  const nextBtn = el('button.e-next__btn', { type: 'button' });
  nextBtn.addEventListener('click', () => {
    if (off || st.launched) return;
    st.launched = true;
    ui.toast('已发起出发确认，等待全员回复（演示）');
    paint();
  });

  const nextBox = light();
  function paintNext(c) {
    nextBox.innerHTML = '';
    const why = st.launched
      ? `已向 ${c.approved.length} 名成员发起出发确认，等待全员回复。`
      : (c.unchecked.length
        ? `${c.unchecked.length} 人未到集合点${c.noVehicle.length ? `，${c.noVehicle.length} 人未安排车辆` : ''}。`
        : (c.noVehicle.length ? `${c.noVehicle.length} 人未安排车辆，补齐后即可出发。` : '全员已到，车辆已排定，可以发起出发确认。'));
    nextBtn.innerHTML = '';
    if (st.launched) {
      nextBtn.className = 'e-next__btn is-done';
      nextBtn.appendChild(el('span', { text: '已发起 · 等待确认' }));
      nextBtn.appendChild(icon('check'));
    } else if (off) {
      nextBtn.className = 'e-next__btn is-off';
      nextBtn.appendChild(el('span', { text: '发起出发确认' }));
      nextBtn.appendChild(icon('arrow-right'));
    } else {
      nextBtn.className = 'e-next__btn';
      nextBtn.appendChild(el('span', { text: D.collab.nextAction }));
      nextBtn.appendChild(icon('arrow-right'));
    }
    nextBox.appendChild(el('div.e-next',
      el('div.e-next__k', { text: '下一步' }),
      el('div.e-next__t', { text: st.launched ? '出发确认已发起' : why }),
      nextBtn,
      st.launched ? el('div.e-next__why', { text: '可继续在大群同步位置与天气' }) : null
    ));
  }

  /* ---------------- 组装 ---------------- */
  const bodyBox = light();
  page.appendChild(headBox);
  page.appendChild(segBox);
  page.appendChild(bodyBox);
  page.appendChild(nextBox);

  function paint() {
    const c = calc();
    paintHead(c);
    [...segBox.children].forEach((n, i) => n.classList.toggle('is-on', TABS[i].key === st.tab));
    bodyBox.innerHTML = '';
    bodyBox.appendChild(
      st.tab === 'list' ? paintList(c)
        : st.tab === 'car' ? paintCar(c)
          : st.tab === 'site' ? paintSite(c)
            : paintOver(c)
    );
    paintNext(c);
  }

  paint();
  page.appendChild(foot(D));
  return page;
}

/* =========================================================
   4. 天气 — 窗口决策
   ========================================================= */

const WIND_SCALE = 8; // m/s 满刻度（演示数据峰值约 6 m/s）

function dayBlocks(hours) {
  const map = new Map();
  for (const h of hours) {
    const key = h.label.slice(0, 5);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(h);
  }
  return [...map.entries()].map(([key, list]) => {
    const temps = list.map((h) => h.temp);
    return {
      key,
      list,
      low: Math.round(Math.min(...temps)),
      high: Math.round(Math.max(...temps)),
      windMax: Math.max(...list.map((h) => h.wind)),
      precipMax: Math.max(...list.map((h) => h.precip)),
      cloudMin: Math.min(...list.map((h) => h.cloud)),
      cloudMax: Math.max(...list.map((h) => h.cloud)),
      from: list[0].label.slice(6),
      to: list[list.length - 1].label.slice(6),
      hours: list.length,
      wd: WD[list[0].t.getDay()],
    };
  });
}

/** 窗口行：官方窗口（meta.window）+ 逐时关键时段（按 keyNote 归并） */
function windowRows(D) {
  const rows = [];
  const w = D.weather.meta.window[0] || [];
  rows.push({ id: 'w0', time: w[0] || '—', verdict: w[1] || '窗口', basis: [w[2], w[3]].filter(Boolean), hours: [] });
  const groups = new Map();
  for (const h of D.weather.hours) {
    if (!h.key) continue;
    const k = h.keyNote || '关键时段';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(h);
  }
  for (const [k, list] of groups) {
    rows.push({
      id: 'k' + k,
      time: `${list[0].label} – ${list[list.length - 1].label.slice(6)}`,
      verdict: k,
      basis: [
        `${list.length} 个逐时点`,
        `降水峰值 ${Math.max(...list.map((h) => h.precip))} %`,
        `风峰值 ${Math.max(...list.map((h) => h.wind)).toFixed(1)} m/s`,
      ],
      hours: list,
    });
  }
  return rows;
}

function meter(label, ratio, valueText, mod) {
  return el('div.e-meter' + (mod ? '.' + mod : ''),
    el('span.e-meter__k', { text: label }),
    el('span.e-meter__track', el('span.e-meter__fill', { style: { width: Math.round(Math.min(1, Math.max(0, ratio)) * 100) + '%' } })),
    el('span.e-meter__v', { text: valueText })
  );
}

function weatherSkeleton() {
  return frag(
    el('div.e-head', el('div.e-skelrow',
      skel('32%', '14px', true),
      skel('66%', '36px', true),
      skel('96%', '12px', true),
      skel('100%', '6px', true))),
    light(el('div.e-skelrow', { style: { marginTop: 'var(--lab-space-4)' } },
      skel('100%', '118px'), skel('100%', '118px'), skel('100%', '84px'), skel('100%', '84px')))
  );
}

export function renderWeather(ctx) {
  const { D, flag, ui } = ctx;
  const page = el('div.page.e-page');
  const meta = D.weather.meta;
  const hours = D.weather.hours;
  const off = flag === 'disabled';

  /* 从 verdict 原文解析「判定对象 + 等级」，不臆造等级 */
  const parsed = /(云海机会)(.+)$/.exec(meta.verdict || '');
  const vLabel = parsed ? parsed[1] : '窗口判定';
  const vLevel = (parsed ? parsed[2] : meta.verdict || '').trim();
  const days = dayBlocks(hours);
  const rows = windowRows(D);

  if (flag === 'loading') {
    page.appendChild(weatherSkeleton());
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 顶部大判决条（满幅深色） ---- */
  page.appendChild(head({
    kick: '窗口判定 · 出发决策',
    extra: el('div.e-verdict',
      el('div.e-verdict__v',
        el('span.e-verdict__lbl', { text: vLabel }),
        el('span.e-verdict__lvl', { text: vLevel })
      ),
      el('div.e-verdict__d', { text: meta.detail }),
      el('div.e-verdict__facts',
        fact('点位', meta.location, true),
        fact('海拔', `${meta.elevationM} m`, true),
        fact('更新', meta.updatedText.replace(' 更新', ''), true),
        fact('数据源', meta.source, true)
      )
    ),
  }));

  if (flag === 'error') {
    page.appendChild(light(el('div.e-flow-lead', errorBlock(() => ui.toast('已重试（演示）')))));
    page.appendChild(foot(D));
    return page;
  }
  if (flag === 'empty') {
    page.appendChild(light(el('div.e-flow-lead', stateBlock({
      ico: 'cloud',
      title: '数据缺失',
      body: '该点位 48 小时预报暂不可用，无法给出窗口判定。请稍后重试，或回到协作面板改用线下决策。',
      action: { label: '回到协作面板', onClick: () => ui.go('collab') },
    }))));
    page.appendChild(foot(D));
    return page;
  }

  /* ---- 选中态：日块与窗口行共享一个读数块 ---- */
  /* 默认落在推荐窗口所在日（与其他风格的「默认选中窗口」一致） */
  const winWord = (/^(周[一二三四五六日])/.exec((meta.window[0] || [])[0] || '') || [])[1];
  const winDayIdx = winWord ? days.findIndex((d) => d.wd === winWord) : -1;
  let sel = { type: 'day', i: winDayIdx >= 0 ? winDayIdx : Math.min(1, days.length - 1) };

  const dayBox = light();
  const rowBox = light();
  const readBox = el('div');
  page.appendChild(dayBox);
  page.appendChild(rowBox);
  page.appendChild(readBox);

  function paintDays() {
    dayBox.innerHTML = '';
    dayBox.appendChild(sect('01', '48 小时 · 按日', `${pad2(days.length)} 个时段`));
    if (off) {
      dayBox.appendChild(el('div.e-lead', note('只读快照：预报已锁定为出发时的版本，实时刷新在演示中不可用。', true)));
    }
    days.forEach((d, i) => {
      const on = sel.type === 'day' && sel.i === i;
      dayBox.appendChild(el('button.e-day' + (on ? '.is-on' : '') + (off ? '.is-off' : ''), {
        type: 'button',
        'aria-pressed': on ? 'true' : 'false',
        onclick: () => { sel = { type: 'day', i }; paint(); },
      },
        el('div.e-day__h',
          el('span.e-plate', { text: pad2(i + 1) }),
          el('span.e-day__d', { text: `${d.key} ${d.wd}` }),
          el('span.e-day__cov', { text: `${d.hours} h · ${d.from}–${d.to}${d.hours < 24 ? ' 起' : ''}` }),
          el('span.e-mark' + (on ? '.is-on' : ''), on ? icon('check') : null)
        ),
        el('div.e-day__t',
          el('span.e-day__lo', { text: d.low + '°' }),
          el('span.e-day__sep', { text: '/' }),
          el('span.e-day__hi', { text: d.high + '°' }),
          el('span.e-day__cap', { text: '最低 / 最高 ℃' })
        ),
        meter('风', d.windMax / WIND_SCALE, `峰值 ${d.windMax.toFixed(1)} m/s`),
        meter('降水', d.precipMax / 100, `峰值 ${d.precipMax} %`, 'e-meter--precip')
      ));
    });
  }

  function paintRows() {
    rowBox.innerHTML = '';
    rowBox.appendChild(sect('02', '关键窗口判定', `${pad2(rows.length)} 个时段`));
    const table = el('div.e-wtable');
    rows.forEach((r, i) => {
      const on = sel.type === 'row' && sel.i === i;
      const positive = r.verdict.indexOf('云海') >= 0 || r.verdict.indexOf('晴') >= 0;
      table.appendChild(el('button.e-wrow' + (on ? '.is-on' : '') + (off ? '.is-off' : ''), {
        type: 'button',
        'aria-pressed': on ? 'true' : 'false',
        onclick: () => { sel = { type: 'row', i }; paint(); },
      },
        el('div.e-wrow__top',
          el('span.e-wrow__time', { text: r.time }),
          el('span.e-plate' + (positive ? '' : '.e-plate--mute'), { text: r.verdict })
        ),
        el('div.e-wrow__b', { text: '依据：' + r.basis.join(' · ') })
      ));
    });
    rowBox.appendChild(table);
  }

  function paintReadout() {
    readBox.innerHTML = '';
    let title, sub, list;
    if (sel.type === 'day') {
      const d = days[sel.i];
      if (!d) return;
      list = d.list;
      title = `${d.key} ${d.wd}`;
      sub = `${d.hours} 个逐时 · ${d.from} – ${d.to}`;
    } else {
      const r = rows[sel.i];
      if (!r) return;
      list = r.hours || [];
      title = r.time;
      sub = r.verdict;
    }
    const temps = list.map((h) => h.temp);
    const box = el('div.e-gear');
    box.appendChild(el('div.e-head__kick', el('span.e-head__rule'), el('span', { text: '逐时读数 · 当前选择' })));
    box.appendChild(el('div.e-read__t',
      el('span.e-gear__p', { text: title }),
      el('span.e-read__range', {
        text: list.length ? `${Math.round(Math.min(...temps))} – ${Math.round(Math.max(...temps))} ℃` : '无逐时数据',
      })
    ));
    box.appendChild(el('div.e-read__sub', { text: sub }));
    if (list.length) {
      box.appendChild(el('div.e-gear__rule'));
      box.appendChild(el('div.e-read__grid',
        fact('降水峰值', `${Math.max(...list.map((h) => h.precip))} %`, true),
        fact('风速峰值', `${Math.max(...list.map((h) => h.wind)).toFixed(1)} m/s`, true),
        fact('云量区间', `${Math.min(...list.map((h) => h.cloud))} – ${Math.max(...list.map((h) => h.cloud))} %`, true),
        fact('夜间时段', `${list.filter((h) => h.night).length} h`, true)
      ));
    }
    readBox.appendChild(box);
  }

  /* ---- 决策块（浅底收口 + 全宽深色行动条，避免连续两块深色糊成一片） ---- */
  const w = meta.window[0] || [];
  const hhNum = Number((/(\d{2}):00/.exec(w[0] || '') || [])[1] || 12);
  const period = hhNum < 9 ? '清晨' : hhNum < 15 ? '上午' : '下午';
  const dayWord = (/^(周[一二三四五六日])/.exec(w[0] || '') || [])[1] || '出发';
  const rainRow = rows.find((r) => r.id.indexOf('k降雨') === 0);
  const rainHours = (rainRow && rainRow.hours) || [];
  const rainPeak = rainHours.length ? Math.max(...rainHours.map((h) => h.precip)) : null;
  const rainWhen = rainHours.length ? `${rainHours[0].label} 起` : '周日下午';

  page.appendChild(light(
    sect('03', '行动建议'),
    el('div.e-dec__go', icon('flag'), el('span.e-dec__t', { text: `建议：${dayWord}${period}出发窗口` })),
    el('div.e-dec__d', { text: `依据：${w[1] || '—'} · ${w[2] || '—'} · ${w[3] || '—'}。` }),
    el('div.e-dec__d', {
      text: rainPeak != null
        ? `风险：${rainWhen}降水峰值 ${rainPeak} %，建议上午完成下撤。`
        : '风险：演示数据未给出降雨时段。',
    }),
    el('button.e-next__btn', { type: 'button', onclick: () => ui.go('collab') },
      el('span', { text: '按此窗口通知队员' }),
      icon('arrow-right'))
  ));

  function paint() { paintDays(); paintRows(); paintReadout(); }
  paint();
  page.appendChild(foot(D));
  return page;
}