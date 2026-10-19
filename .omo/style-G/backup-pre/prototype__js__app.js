// OurTrail Visual Direction Lab — 外壳逻辑
// URL 参数: ?style=A-E & page=discover|detail|collab|weather & vp=375|390|414 & state=empty|error|disabled|loading & bare=1
// bare=1: 只渲染设备内容（供截图）；否则带实验室控制面板。

import { DEMO } from './data.js';

export const STYLE_META = {
  A: { name: 'Alpine Editorial', zh: '山野编辑部', note: '杂志排版 · 摄影驱动 · 眉题与事实行' },
  B: { name: 'Swiss Functional', zh: '瑞士功能主义', note: '网格与规则线 · 表格化 · 零圆角' },
  C: { name: 'Quiet Terrain', zh: '静野', note: '低刺激 · 色调带分组 · 长文舒适' },
  D: { name: 'Field Instrument', zh: '野外仪表', note: '数据密度 · 单位常显 · 剖面与矩阵' },
  E: { name: 'Expedition Modern', zh: '远征现代', note: '深色块 · 编号体系 · 强对比行动' },
  F: { name: 'Trail Works', zh: '山野工坊', note: '纸面工位分区 · 台账式规格 · 工具件入册' },
};
export const PAGE_META = { discover: '发现', detail: '详情', collab: '协作', weather: '天气' };
export const VP_META = { 375: '375 SE', 390: '390 标准', 414: '414 Plus' };
export const FLAG_META = { '': '正常', empty: '空态', error: '错误态', disabled: '禁用态', loading: '加载中' };

const q = new URLSearchParams(location.search);
const state = {
  style: (q.get('style') || 'A').toUpperCase(),
  page: q.get('page') || 'discover',
  vp: Number(q.get('vp') || 390),
  flag: q.get('state') || '',
  bare: q.get('bare') === '1',
};
if (!STYLE_META[state.style]) state.style = 'A';
if (!PAGE_META[state.page]) state.page = 'discover';

const moduleCache = new Map();
const $ = (sel) => document.querySelector(sel);

async function loadStyleModule(style) {
  if (!moduleCache.has(style)) {
    moduleCache.set(style, import(`./styles/${style}/index.js`).catch((err) => {
      console.error('[lab] 风格模块加载失败', style, err);
      return null;
    }));
  }
  return moduleCache.get(style);
}

/* ---------------- toast ---------------- */
let toastTimer = null;
export function toast(msg) {
  let node = $('#toast-root .toast');
  if (!node) {
    node = document.createElement('div');
    node.className = 'toast';
    document.getElementById('toast-root').appendChild(node);
  }
  node.textContent = msg;
  // 强制重排以重启动画
  void node.offsetWidth;
  node.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-show'), 2300);
}

/* ---------------- URL 同步 (可分享状态) ---------------- */
function syncUrl() {
  const p = new URLSearchParams();
  p.set('style', state.style);
  p.set('page', state.page);
  p.set('vp', String(state.vp));
  if (state.flag) p.set('state', state.flag);
  if (state.bare) p.set('bare', '1');
  history.replaceState(null, '', '?' + p.toString());
}

/* ---------------- 页面渲染 ---------------- */
let renderSeq = 0;
export async function renderPage() {
  const seq = ++renderSeq;
  window.__LAB_READY__ = false;
  const app = $('#app');
  const mod = await loadStyleModule(state.style);
  if (seq !== renderSeq) return;
  app.innerHTML = '';
  let node = null;
  const fnName = 'render' + state.page[0].toUpperCase() + state.page.slice(1);
  if (mod && typeof mod[fnName] === 'function') {
    try {
      node = mod[fnName]({
        D: DEMO,
        flag: state.flag,
        vp: state.vp,
        ui: { toast, go, setFlag },
      });
    } catch (err) {
      console.error('[lab] 渲染失败', state.style, state.page, err);
    }
  }
  if (!node) {
    node = fallbackPage(mod, fnName);
  }
  app.appendChild(node);
  syncChrome();
  await waitForAssets(app);
  if (seq !== renderSeq) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (seq === renderSeq) window.__LAB_READY__ = true;
  }));
}

function fallbackPage(mod, fnName) {
  const div = document.createElement('div');
  div.className = 'page';
  div.innerHTML = `<div class="state-block">
    <div class="state-block__title">模块未就绪</div>
    <div class="state-block__body">风格 ${state.style} 的 ${fnName}() 尚未实现（或模块加载失败）。</div>
  </div>`;
  return div;
}

async function waitForAssets(root) {
  const imgs = [...root.querySelectorAll('img')];
  const jobs = imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
  await Promise.race([
    Promise.allSettled(jobs),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
}

/* ---------------- 导航 ---------------- */
export function go(page, params = {}) {
  if (PAGE_META[page]) state.page = page;
  if (params.style) state.style = params.style;
  syncControls();
  syncUrl();
  renderPage();
}

export function setFlag(flag) {
  state.flag = flag || '';
  syncControls();
  syncUrl();
  renderPage();
}

/* ---------------- 设备壳同步 ---------------- */
function syncChrome() {
  document.documentElement.dataset.style = state.style;
  document.documentElement.dataset.bare = state.bare ? '1' : '0';
  const stage = $('.lab__stage') || document.body;
  const h = state.vp === 375 ? 667 : state.vp === 414 ? 896 : 844;
  document.documentElement.style.setProperty('--frame-w', state.vp + 'px');
  document.documentElement.style.setProperty('--frame-h', h + 'px');
  void stage;
  const sb = $('#statusbar-time');
  if (sb) sb.textContent = '22:10';
  const name = $('#lab-style-name');
  if (name) {
    const m = STYLE_META[state.style];
    name.innerHTML = `<strong>${state.style} · ${m.zh}</strong><br>${m.note}`;
  }
}

/* ---------------- 控制面板 (仅在非 bare 模式构建) ---------------- */
function opt(label, active, onClick) {
  const b = document.createElement('button');
  b.className = 'lab__opt' + (active ? ' is-active' : '');
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function buildPanel() {
  const panel = $('#lab-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div>
      <div class="lab__title">OurTrail · 视觉方向实验室</div>
      <div class="lab__subtitle">六套视觉方向 × 四个代表页面 × 同一演示数据<br>只改方向，不改业务</div>
    </div>
    <div class="lab__styleName" id="lab-style-name"></div>
    <div class="lab__group"><div class="lab__label">视觉方向</div><div class="lab__options" id="opt-styles"></div></div>
    <div class="lab__group"><div class="lab__label">页面</div><div class="lab__options" id="opt-pages"></div></div>
    <div class="lab__group"><div class="lab__label">视口</div><div class="lab__options" id="opt-vps"></div></div>
    <div class="lab__group"><div class="lab__label">状态演示</div><div class="lab__options" id="opt-flags"></div></div>
    <div class="lab__footer">
      演示数据，非真实后端。图片来自 Unsplash（氛围图）。<br>
      对应生产仓库 D:\\OurTrail（只读），本实验室与之隔离。
    </div>`;
  panel.querySelector('#opt-styles').append(...Object.entries(STYLE_META).map(([k, v]) =>
    opt(`${k} · ${v.zh}`, state.style === k, () => { state.style = k; syncControls(); syncUrl(); renderPage(); })));
  panel.querySelector('#opt-pages').append(...Object.entries(PAGE_META).map(([k, v]) =>
    opt(v, state.page === k, () => go(k))));
  panel.querySelector('#opt-vps').append(...Object.entries(VP_META).map(([k, v]) =>
    opt(v, state.vp === Number(k), () => { state.vp = Number(k); syncControls(); syncUrl(); syncChrome(); })));
  panel.querySelector('#opt-flags').append(...Object.entries(FLAG_META).map(([k, v]) =>
    opt(v, state.flag === k, () => setFlag(k))));
}

function syncControls() {
  if (state.bare) return;
  const mark = (id, list, active) => {
    const box = document.querySelector(id);
    if (!box) return;
    [...box.children].forEach((b, i) => b.classList.toggle('is-active', list[i] === active));
  };
  mark('#opt-styles', Object.keys(STYLE_META), state.style);
  mark('#opt-pages', Object.keys(PAGE_META), state.page);
  mark('#opt-vps', Object.keys(VP_META).map(Number), state.vp);
  mark('#opt-flags', Object.keys(FLAG_META), state.flag);
}

/* ---------------- 启动 ---------------- */
buildPanel();
syncChrome();
renderPage();
