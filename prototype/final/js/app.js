// OurTrail Final Pass — 实验外壳
// ?page=discover|detail|collab|weather & vp=375|390|414 & bare=1
// &state=new|pending|confirmed|waitlist|closed|cancelled|archived|organizer
// &stage=published|gathering|active|closing|archived & role=organizer|staff|driver
// &point=r1|r2|r3 & range=24|48 & hour=<ISO> & data=normal|loading|error|empty & wdata=normal|no-data
import { DEMO } from './data.js';
import { createStore } from './store.js';
import { el, toast, icon } from './ui.js';

const PAGES = {
  discover: { label: '发现', note: '活动发现与比较' },
  detail: { label: '活动详情', note: '参加决策与报名' },
  collab: { label: '活动协作', note: '任务、名单、车辆与现场' },
  weather: { label: '路线天气', note: '路线点 × 时间 × 风险' }
};
const VPS = { 375: '375 SE', 390: '390 标准', 414: '414 Plus' };
const SIGNUP_STATES = {
  new: '未报名', pending: '待审核', confirmed: '已确认', waitlist: '候补',
  withdrawn: '已取消报名', closed: '报名关闭', cancelled: '活动取消', archived: '已归档', organizer: '组织者'
};
const STAGES = { published: '行前准备', gathering: '正在集合', active: '正在同行', closing: '返程报平安', archived: '已归档' };
const ROLES = { organizer: '组织者', staff: '现场协作', driver: '车长' };
const DATA_STATES = { normal: '正常', loading: '加载中', error: '错误', empty: '空态' };

const params = new URLSearchParams(location.search);
const state = {
  page: PAGES[params.get('page')] ? params.get('page') : 'discover',
  vp: VPS[params.get('vp')] ? Number(params.get('vp')) : 390,
  bare: params.get('bare') === '1',
  data: DATA_STATES[params.get('data')] ? params.get('data') : 'normal',
  signup: SIGNUP_STATES[params.get('state')] ? params.get('state') : 'new',
  stage: STAGES[params.get('stage')] ? params.get('stage') : 'published',
  role: ROLES[params.get('role')] ? params.get('role') : 'organizer',
  point: ['r1', 'r2', 'r3'].includes(params.get('point')) ? params.get('point') : 'r2',
  range: params.get('range') === '24' ? 24 : 48,
  hour: params.get('hour') || '',
  wdata: params.get('wdata') === 'no-data' ? 'no-data' : 'normal',
  filter: ['all', 'open', 'formed', 'ended'].includes(params.get('filter')) ? params.get('filter') : 'all',
  q: params.get('q') || '',
  activityId: params.get('id') || 'qcs',
  collabTab: null,
  collabQuery: '',
  collabFilter: 'all'
};

const store = createStore();

const scrollPositions = new Map();
const navStack = [];
const $ = (sel) => document.querySelector(sel);
const moduleCache = new Map();
let renderSeq = 0;

function snapshot() {
  return { ...state, q: state.q };
}

function restore(snap) {
  for (const key of Object.keys(state)) state[key] = snap[key];
}

function syncUrl() {
  const p = new URLSearchParams();
  p.set('page', state.page);
  p.set('vp', String(state.vp));
  if (state.bare) p.set('bare', '1');
  if (state.data !== 'normal') p.set('data', state.data);
  if (state.page === 'detail') {
    if (state.activityId !== 'qcs') p.set('id', state.activityId);
    if (state.signup !== 'new') p.set('state', state.signup);
  }
  if (state.page === 'collab') {
    if (state.stage !== 'published') p.set('stage', state.stage);
    if (state.role !== 'organizer') p.set('role', state.role);
  }
  if (state.page === 'weather') {
    if (state.point !== 'r2') p.set('point', state.point);
    if (state.range !== 48) p.set('range', String(state.range));
    if (state.hour) p.set('hour', state.hour);
    if (state.wdata !== 'normal') p.set('wdata', state.wdata);
  }
  if (state.page === 'discover') {
    if (state.filter !== 'all') p.set('filter', state.filter);
    if (state.q) p.set('q', state.q);
  }
  history.replaceState(null, '', '?' + p.toString());
}

function syncChrome() {
  const root = document.documentElement;
  root.dataset.page = state.page;
  root.dataset.vp = String(state.vp);
  root.dataset.bare = state.bare ? '1' : '0';
  const h = state.vp === 375 ? 667 : state.vp === 414 ? 896 : 844;
  root.style.setProperty('--frame-w', state.vp + 'px');
  root.style.setProperty('--frame-h', h + 'px');
  const time = $('#statusbar-time');
  if (time) time.textContent = '20:30';
  document.title = `OurTrail · ${PAGES[state.page].label} — Final Pass`;
}

export function go(page, patch = {}, { replace = false, restoreScroll = true } = {}) {
  if (!PAGES[page]) return;
  const current = document.querySelector('.page');
  if (current) scrollPositions.set(state.page, current.scrollTop);
  if (!replace) navStack.push(snapshot());
  Object.assign(state, patch, { page });
  syncUrl();
  render(restoreScroll ? (scrollPositions.get(page) || 0) : 0);
}

export function back() {
  const prev = navStack.pop();
  if (prev) {
    restore(prev);
    syncUrl();
    render(scrollPositions.get(prev.page) || 0);
  } else {
    go('discover', { filter: 'all', q: '' }, { replace: true });
  }
}

export function setState(patch = {}, { preserveScroll = true } = {}) {
  const current = document.querySelector('.page');
  const scroll = preserveScroll && current ? current.scrollTop : 0;
  Object.assign(state, patch);
  syncUrl();
  render(scroll);
}

export function rerender() {
  setState({});
}

function loadPage(page) {
  if (!moduleCache.has(page)) {
    moduleCache.set(page, import(`./${page}.js`).catch((err) => {
      console.error('[final] 模块加载失败', page, err);
      moduleCache.delete(page);
      return null;
    }));
  }
  return moduleCache.get(page);
}

async function render(scroll = 0) {
  const seq = ++renderSeq;
  window.__FINAL_READY__ = false;
  const app = $('#app');
  syncChrome();
  buildPanel();
  const mod = await loadPage(state.page);
  if (seq !== renderSeq) return;
  app.innerHTML = '';
  let node = null;
  if (mod && typeof mod.render === 'function') {
    try {
      node = mod.render({
        D: DEMO,
        state,
        store,
        ui: { go, back, setState, rerender, toast, icon }
      });
    } catch (err) {
      console.error('[final] 渲染失败', state.page, err);
    }
  }
  app.appendChild(node || fallback());
  const pageEl = app.querySelector('.page');
  if (pageEl && scroll) pageEl.scrollTop = scroll;
  await waitForAssets(app);
  if (seq !== renderSeq) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (seq === renderSeq) window.__FINAL_READY__ = true;
  }));
}

function fallback() {
  return el('div.page',
    el('div.empty',
      el('h3.empty__title', { text: '模块未就绪' }),
      el('p.empty__body', { text: `page=${state.page} 的 render() 尚未实现或模块加载失败。` })));
}

async function waitForAssets(root) {
  const imgs = [...root.querySelectorAll('img')];
  const jobs = imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  await Promise.race([Promise.allSettled(jobs), new Promise((r) => setTimeout(r, 2500))]);
}

/* ---------------- 控制面板 ---------------- */
function buildPanel() {
  const panel = $('#lab-panel');
  if (!panel) return;
  if (state.bare) { panel.innerHTML = ''; return; }
  panel.innerHTML = '';

  const group = (label, children) => el('div.lab__group',
    el('div.lab__label', { text: label }),
    el('div.lab__options', children));

  const chip = (label, active, onClick, key = '') => el('button.lab__opt' + (active ? '.is-active' : ''), {
    type: 'button',
    'data-key': key,
    onClick
  }, label);

  const select = (value, options, onChange, label) => {
    const sel = el('select.lab__select', { 'aria-label': label, onChange: (e) => onChange(e.target.value) },
      Object.entries(options).map(([k, v]) => el('option', { value: k, selected: k === value ? true : undefined }, v)));
    return sel;
  };

  panel.appendChild(el('div',
    el('div.lab__title', { text: 'OurTrail · Final Pass' }),
    el('div.lab__subtitle', { text: '四页产品体验定稿 · 真实产品业务模型 · 单一演示数据源' })));

  panel.appendChild(el('div.lab__meta',
    el('span.lab__meta-k', { text: '当前' }),
    el('span.lab__meta-v', { text: `${PAGES[state.page].label} · ${PAGES[state.page].note}` })));

  panel.appendChild(group('页面', Object.entries(PAGES).map(([k, m]) =>
    chip(m.label, state.page === k, () => go(k), k))));

  panel.appendChild(group('视口', Object.entries(VPS).map(([k, label]) =>
    chip(label, state.vp === Number(k), () => setState({ vp: Number(k) }, { preserveScroll: false }), k))));

  panel.appendChild(group('数据状态', Object.entries(DATA_STATES).map(([k, label]) =>
    chip(label, state.data === k, () => setState({ data: k }), k))));

  if (state.page === 'detail') {
    panel.appendChild(group('报名状态', [
      select(state.signup, SIGNUP_STATES, (v) => { store.actions.clearViewer(); setState({ signup: v }, { preserveScroll: false }); }, '报名状态')
    ]));
  }

  if (state.page === 'collab') {
    panel.appendChild(group('活动阶段', [
      select(state.stage, STAGES, (v) => setState({ stage: v }, { preserveScroll: false }), '活动阶段')
    ]));
    panel.appendChild(group('视角', [
      select(state.role, ROLES, (v) => setState({ role: v }, { preserveScroll: false }), '视角')
    ]));
  }

  if (state.page === 'weather') {
    panel.appendChild(group('路线点', [
      select(state.point, { r1: '泰安古镇 780m', r2: '飞泉沟 1060m', r3: '白云索道下站 1240m' }, (v) => setState({ point: v, hour: '' }, { preserveScroll: false }), '路线点')
    ]));
    panel.appendChild(group('范围', [
      select(String(state.range), { 24: '活动日 24h', 48: '前后 48h' }, (v) => setState({ range: Number(v), hour: '' }, { preserveScroll: false }), '范围')
    ]));
    panel.appendChild(group('天气数据', [
      select(state.wdata, { normal: '正常模拟', 'no-data': '无数据' }, (v) => setState({ wdata: v }, { preserveScroll: false }), '天气数据')
    ]));
  }

  panel.appendChild(el('div.lab__spacer'));
  panel.appendChild(el('button.lab__reset', {
    type: 'button',
    onClick: () => {
      store.actions.reset();
      setState({ signup: 'new', stage: 'published', role: 'organizer', data: 'normal', wdata: 'normal', filter: 'all', q: '', point: 'r2', range: 48, hour: '', activityId: 'qcs', collabTab: null, collabQuery: '', collabFilter: 'all' }, { preserveScroll: false });
    }
  }, '重置演示状态'));

  panel.appendChild(el('div.lab__footer',
    el('div', { text: '演示数据：活动/名单来自真实产品口径；天气为模拟预报。' }),
    el('div', { text: '生产仓库 D:\\OurTrail 只读；本实验与之隔离。' }),
    el('div', { text: '文档：docs/ui-design/final-pass/' })));
}

/* 启动 */
syncChrome();
buildPanel();
render(0);

window.__FINAL__ = { state, store, go, back, setState };
