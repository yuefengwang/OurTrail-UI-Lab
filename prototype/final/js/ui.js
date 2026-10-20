// Final Pass — 共享 UI 原语
import { el, icon, fmt } from '../../js/render-common.js';

export { el, icon, fmt };
export const PHOTO = '../../assets/photos/';

export const cover = (a, { ratio = '16 / 9', alt = '', eager = false, cls = '' } = {}) => {
  const wrap = el('div.photo' + (cls ? '.' + cls : ''));
  if (ratio) wrap.style.aspectRatio = ratio;
  const img = el('img', {
    src: PHOTO + a.cover,
    alt,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async'
  });
  img.style.objectPosition = a.focus || '50% 50%';
  img.addEventListener('error', () => {
    wrap.classList.add('photo--fallback');
    img.remove();
  }, { once: true });
  wrap.appendChild(img);
  return wrap;
};

export function statusChip(a, { compact = false } = {}) {
  const s = a.__status || null;
  const word = s ? s.word : a.statusWord || '可报名';
  const tone = s ? s.tone : a.statusTone || 'go';
  const shape = s ? s.shape : 'dot';
  return el('span.status-chip' + (compact ? '.status-chip--sm' : '') + `.status-chip--${tone}`,
    el('span.status-chip__shape', { 'aria-hidden': 'true', class: `shape shape--${shape}` }),
    el('span', { text: word }));
}

export function iconBtn(name, label, onClick, { cls = '', size = 20 } = {}) {
  return el('button.icon-btn' + (cls ? '.' + cls : ''), {
    type: 'button',
    'aria-label': label,
    title: label,
    onClick
  }, icon(name, { size }));
}

export function appBar({ title = '', subtitle = '', back = null, actions = [], left = null } = {}) {
  return el('header.appbar',
    el('div.appbar__lead',
      back ? el('button.appbar__back', {
        type: 'button', 'aria-label': '返回', onClick: back
      }, icon('chevron-right', { size: 21, cls: 'icon-back' })) : null,
      left),
    el('div.appbar__id',
      subtitle ? el('span.appbar__sub', { text: subtitle }) : null,
      title ? el('span.appbar__title', { text: title }) : null),
    el('div.appbar__actions', actions));
}

export function sectionHead(title, meta = null, { action = null, iconName = null } = {}) {
  return el('div.sec-head',
    el('div.sec-head__lead',
      iconName ? icon(iconName, { size: 15, cls: 'sec-head__icon' }) : null,
      el('h2.sec-head__title', { text: title })),
    el('div.sec-head__meta',
      meta ? el('span.sec-head__count.num', { text: meta }) : null,
      action || null));
}

export function btn(label, { variant = 'primary', onClick = null, iconName = null, cls = '', type = 'button', disabled = false, ariaLabel = null } = {}) {
  const node = el('button.btn.btn--' + variant + (cls ? '.' + cls : ''), {
    type,
    onClick,
    disabled: disabled || undefined,
    'aria-label': ariaLabel || undefined
  }, el('span', { text: label }), iconName ? icon(iconName, { size: 17 }) : null);
  return node;
}

export function linkBtn(label, onClick, { iconName = 'chevron-right', cls = '' } = {}) {
  return el('button.link-btn' + (cls ? '.' + cls : ''), { type: 'button', onClick },
    el('span', { text: label }), icon(iconName, { size: 15 }));
}

export function segmented(items, active, onPick, { ariaLabel = '', cls = '' } = {}) {
  return el('div.seg' + (cls ? '.' + cls : ''), { role: 'tablist', 'aria-label': ariaLabel || undefined },
    items.map((item) => el('button.seg__item' + (item.key === active ? '.is-active' : ''), {
      type: 'button',
      role: 'tab',
      'aria-selected': item.key === active ? 'true' : 'false',
      onClick: () => onPick(item.key)
    },
      el('span', { text: item.label }),
      item.count !== undefined ? el('span.seg__count.num', { text: String(item.count) }) : null)));
}

export function stat(value, unit, label, { tone = '' } = {}) {
  return el('div.stat' + (tone ? `.stat--${tone}` : ''),
    el('div.stat__v',
      el('span.stat__num.num', { text: value }),
      unit ? el('span.stat__unit', { text: unit }) : null),
    el('div.stat__k', { text: label }));
}

export function kv(label, value, { tone = '', cls = '' } = {}) {
  return el('div.kv' + (cls ? '.' + cls : ''),
    el('span.kv__k', { text: label }),
    el('span.kv__v' + (tone ? `.is-${tone}` : ''), { text: value }));
}

let timer = null;
export function toast(message) {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = el('div', { id: 'toast-root' });
    document.body.appendChild(root);
  }
  let node = root.querySelector('.toast');
  if (!node) {
    node = el('div.toast', { role: 'status', 'aria-live': 'polite' });
    root.appendChild(node);
  }
  node.textContent = message;
  node.classList.remove('is-show');
  void node.offsetWidth;
  node.classList.add('is-show');
  clearTimeout(timer);
  timer = setTimeout(() => node.classList.remove('is-show'), 2600);
}

export function sheet({ title, subtitle = '', body, actions = [], onClose, wide = false }) {
  const root = el('div.sheet-root', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  const close = () => {
    root.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => root.remove(), 220);
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const panel = el('div.sheet' + (wide ? '.sheet--wide' : ''),
    el('div.sheet__grip', { 'aria-hidden': 'true' }),
    el('div.sheet__head',
      el('div',
        el('h3.sheet__title', { text: title }),
        subtitle ? el('p.sheet__sub', { text: subtitle }) : null),
      el('button.sheet__close', { type: 'button', 'aria-label': '关闭', onClick: close }, icon('x', { size: 18 }))),
    el('div.sheet__body', body),
    actions.length ? el('div.sheet__actions', actions) : null);
  root.appendChild(el('div.sheet__scrim', { onClick: close }));
  root.appendChild(panel);
  (document.getElementById('app') || document.body).appendChild(root);
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => root.classList.add('is-open'));
  const focusable = panel.querySelector('button, input, select, textarea');
  if (focusable) setTimeout(() => focusable.focus(), 60);
  return { root, close };
}

export function confirmSheet({ title, body, confirmText = '确认', cancelText = '取消', tone = 'primary', onConfirm }) {
  const s = sheet({
    title,
    body,
    actions: [
      btn(cancelText, { variant: 'ghost', onClick: () => s.close() }),
      btn(confirmText, { variant: tone, onClick: () => { s.close(); onConfirm(); } })
    ]
  });
  return s;
}

export async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

export function emptyBlock({ title, body, action, onAction, iconName = 'info' }) {
  return el('div.empty',
    el('span.empty__icon', icon(iconName, { size: 26 })),
    el('h3.empty__title', { text: title }),
    el('p.empty__body', { text: body }),
    action ? btn(action, { variant: 'secondary', onClick: onAction }) : null);
}

export function loadingBlock(label = '正在加载…') {
  return el('div.loading-block', { role: 'status', 'aria-label': label },
    el('span.loading-block__bar'),
    el('span.loading-block__text', { text: label }));
}

export function lines(n, widths = [70, 90, 55]) {
  return el('div.lines', Array.from({ length: n }, (_, i) =>
    el('span.lines__line', { style: { width: widths[i % widths.length] + '%' } })));
}
