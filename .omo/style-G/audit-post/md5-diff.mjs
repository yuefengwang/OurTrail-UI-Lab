#!/usr/bin/env node
// md5-diff.mjs — compare two "HASH  relpath" screenshot manifests.
// usage: node md5-diff.mjs <pre.txt> <post.txt> [--out report.txt]
import { readFileSync, writeFileSync } from 'node:fs';

const [prePath, postPath] = process.argv.slice(2);
if (!prePath || !postPath) {
  console.error('usage: node md5-diff.mjs <pre.txt> <post.txt> [--out report.txt]');
  process.exit(2);
}

function load(p) {
  const map = new Map();
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    const m = s.match(/^([0-9a-fA-F]{32})\s+(.+)$/);
    if (!m) continue;
    map.set(m[2], m[1].toUpperCase());
  }
  return map;
}

const pre = load(prePath);
const post = load(postPath);
const added = [];
const removed = [];
const changed = [];
for (const [k, v] of post) {
  if (!pre.has(k)) added.push(k);
  else if (pre.get(k) !== v) changed.push(k);
}
for (const k of pre.keys()) if (!post.has(k)) removed.push(k);

const unchanged = post.size - added.length - changed.length;
const tally = (arr) => {
  const t = {};
  for (const k of arr) {
    const p = k.split('-')[0] || '?';
    t[p] = (t[p] || 0) + 1;
  }
  return JSON.stringify(t);
};

const lines = [];
lines.push(`pre:       ${prePath}  (${pre.size} files)`);
lines.push(`post:      ${postPath}  (${post.size} files)`);
lines.push(`unchanged: ${unchanged}`);
lines.push(`changed:   ${changed.length}${changed.length ? '  by prefix: ' + tally(changed) : ''}`);
lines.push(`added:     ${added.length}${added.length ? '  by prefix: ' + tally(added) : ''}`);
lines.push(`removed:   ${removed.length}`);
lines.push('');
lines.push('[changed]');
changed.sort().forEach((k) => lines.push('  ' + k));
lines.push('[added]');
added.sort().forEach((k) => lines.push('  ' + k));
lines.push('[removed]');
removed.sort().forEach((k) => lines.push('  ' + k));

const report = lines.join('\n');
console.log(lines.slice(0, 6).join('\n'));
if (added.length || removed.length || changed.length) {
  console.log(`\n(full lists: ${changed.length} changed, ${added.length} added, ${removed.length} removed — see --out report or rerun)`);
}
const outIdx = process.argv.indexOf('--out');
if (outIdx > -1 && process.argv[outIdx + 1]) {
  writeFileSync(process.argv[outIdx + 1], report + '\n', 'utf8');
  console.log(`\n[report written] ${process.argv[outIdx + 1]}`);
}
