// OurTrail Round 3 — 实验外壳
// URL: ?view=editorial|curated|hybrid|detail|collab|weather & vp=375|390|414
//      & state=empty|error|disabled|loading & bare=1
// bare=1: 只渲染设备内容（供截图）；否则带实验室控制面板。

import { DEMO } from '../../js/data.js';

export const VIEW_META = {
  editorial: { label: '方案一 · 编辑特写', note: '封面故事 · 编辑推荐 · 出发日历' },
  curated: { label: '方案二 · 策展索引', note: '统一栅格 · 日期主轴 · 数据优先' },
  hybrid: { label: '方案三 · 混合发现', note: '主卡 · 接缝筛选 · 密集比较' },
  detail: { label: '活动详情', note: '胜出设计语言 · 长内容代表页' },
  collab: { label: '活动协作', note: '胜出设计语言 · 高密度协作页' },
  weather: { label: '天气', note: '胜出设计语言 · 数据决策页' },
};

export const VP_META = { 375: '375 SE', 390: '390 标准', 414: '414 Plus' };
export const FLAG_META = { '': '正常', empty: '空态', error: '错误态', disabled: '禁用态', loading: '加载中' };

const params = new URLSearchParams(location.search);
const state = {
  view: params.get('view') || 'editorial',
  vp: Number(params.get('vp') || 390),
  flag: params.get('state') || '',
  bare: params.get('bare') === '1',
};
if (!VIEW_META[state.view]) state.view = 'editorial';
if (!VP_META[state.vp]) state.vp = 390;
if (!(state.flag in FLAG_META)) state.flag = '';

const $ = (sel) => document.querySelector(sel);
const moduleCache = new Map();

function loadView(view) {
  if (!moduleCache.has(view)) {
    moduleCache.set(view, import(`./${view}.js`).catch((err) => {
      console.error('[round3] 模块加载失败', view, err);
      moduleCache.delete(view);
      return null;
    }));
  }
  return moduleCache.get(view);
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
  void node.offsetWidth;
  node.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-show'), 2300);
}

/* ---------------- URL 同步 ---------------- */
function syncUrl() {
  const p = new URLSearchParams();
  p.set('view', state.view);
  p.set('vp', String(state.vp));
  if (state.flag) p.set('state', state.flag);
  if (state.bare) p.set('bare', '1');
  history.replaceState(null, '', '?' + p.toString());
}

/* ---------------- 导航 ---------------- */
export function go(view) {
  if (!VIEW_META[view]) { toast('演示：目标页面未就绪'); return; }
  if (view === state.view) return;
  state.view = view;
  syncControls();
  syncUrl();
  render();
}

export function setFlag(flag) {
  state.flag = flag || '';
  syncControls();
  syncUrl();
  render();
}

export function setVp(vp) {
  if (!VP_META[vp]) return;
  state.vp = Number(vp);
  syncControls();
  syncUrl();
  render();
}

/* ---------------- 渲染 ---------------- */
let renderSeq = 0;

async function render() {
  const seq = ++renderSeq;
  window.__LAB_READY__ = false;
  const app = $('#app');
  const mod = await loadView(state.view);
  if (seq !== renderSeq) return;
  app.innerHTML = '';
  let node = null;
  if (mod && typeof mod.render === 'function') {
    try {
      node = mod.render({
        D: DEMO,
        view: state.view,
        vp: state.vp,
        flag: state.flag,
        ui: { go, toast, setFlag, setVp },
      });
    } catch (err) {
      console.error('[round3] 渲染失败', state.view, err);
    }
  }
  app.appendChild(node || fallbackPage());
  syncChrome();
  await waitForAssets(app);
  if (seq !== renderSeq) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (seq === renderSeq) window.__LAB_READY__ = true;
  }));
}

function fallbackPage() {
  const div = document.createElement('div');
  div.className = 'page';
  div.innerHTML = `<div class="state-block">
    <div class="state-block__title">模块未就绪</div>
    <div class="state-block__body">view=${state.view} 的 render() 尚未实现（或模块加载失败）。</div>
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

/* ---------------- 设备壳同步 ---------------- */
function syncChrome() {
  const root = document.documentElement;
  root.dataset.view = state.view;
  root.dataset.vp = String(state.vp);
  root.dataset.bare = state.bare ? '1' : '0';
  const h = state.vp === 375 ? 667 : state.vp === 414 ? 896 : 844;
  root.style.setProperty('--frame-w', state.vp + 'px');
  root.style.setProperty('--frame-h', h + 'px');
  const time = $('#statusbar-time');
  if (time) time.textContent = '22:10';
  const name = $('#r3-view-name');
  if (name) {
    const m = VIEW_META[state.view];
    name.innerHTML = `<strong>${m.label}</strong><br>${m.note}`;
  }
}

/* ---------------- 控制面板 ---------------- */
function buildPanel() {
  const panel = $('#lab-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div>
      <div class="lab__title">OurTrail · Round 4</div>
      <div class="lab__subtitle">设计工艺审查 · 发现页深度打磨<br>真实渲染审计 → 三项对照实验 → 收敛定稿</div>
    </div>
    <div class="lab__styleName" id="r3-view-name"></div>
    <div class="lab__group"><div class="lab__label">版式方案</div><div class="lab__options" id="opt-layouts"></div></div>
    <div class="lab__group"><div class="lab__label">代表页面</div><div class="lab__options" id="opt-pages"></div></div>
    <div class="lab__group"><div class="lab__label">视口</div><div class="lab__options" id="opt-vps"></div></div>
    <div class="lab__group"><div class="lab__label">状态演示</div><div class="lab__options" id="opt-flags"></div></div>
    <div class="lab__footer">
      演示数据，非真实后端。图片来自 Unsplash（氛围图）。<br>
      设计简报：docs/ui-design/round-4/round-4-design-audit.md<br>
      生产仓库 D:\\OurTrail 只读，本实验室与之隔离。
    </div>`;

  const opt = (group, key, label, onClick) => {
    const b = document.createElement('button');
    b.className = 'lab__opt';
    b.dataset.group = group;
    b.dataset.key = String(key);
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };

  panel.querySelector('#opt-layouts').append(...['editorial', 'curated', 'hybrid'].map((k) =>
    opt('view', k, VIEW_META[k].label, () => go(k))));
  panel.querySelector('#opt-pages').append(...['detail', 'collab', 'weather'].map((k) =>
    opt('view', k, VIEW_META[k].label, () => go(k))));
  panel.querySelector('#opt-vps').append(...Object.entries(VP_META).map(([k, label]) =>
    opt('vp', Number(k), label, () => setVp(Number(k)))));
  panel.querySelector('#opt-flags').append(...Object.entries(FLAG_META).map(([k, label]) =>
    opt('flag', k, label, () => setFlag(k))));

  syncControls();
}

function syncControls() {
  if (state.bare) return;
  document.querySelectorAll('.lab__opt').forEach((btn) => {
    const group = btn.dataset.group;
    const key = btn.dataset.key;
    const active =
      group === 'view' ? key === state.view :
      group === 'vp' ? Number(key) === state.vp :
      group === 'flag' ? key === state.flag : false;
    btn.classList.toggle('is-active', active);
  });
}

/* ---------------- 启动 ---------------- */
buildPanel();
syncChrome();
render();

// 便于调试/截图脚本读取实验状态（只读）
window.__R3__ = { state, go, setFlag, setVp };
