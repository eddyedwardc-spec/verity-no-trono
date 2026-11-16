// i18n helper for the game source (../verity-no-trono/js).
//   node build/i18n-tool.js scan  <out.json>  → every string/template literal with letters that is not wrapped in _t() yet
//   node build/i18n-tool.js apply             → wraps the literals whose text is a key of EN (js/i18n.js) with _t(...)
// A template `a ${x} b` becomes _t("a {0} b",x). Object keys, `case` labels and literals already in _t() are left alone.
// Literals inside ${...} of templates are handled too.
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', '..', 'verity-no-trono', 'js');
const SKIP = new Set(['i18n.js', 'firebase-config.js']);

function lex(src) {
  const out = []; let i = 0, prev = '';
  const isRegexStart = () => /^$|[(,=:\[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|in|of)$/.test(src.slice(Math.max(0, i - 7), i));
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    if (c === '/' && isRegexStart()) { let j = i + 1, cls = false; while (j < src.length) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n') break; j++; } j++; while (/[a-z]/i.test(src[j])) j++; i = j; prev = '/'; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; } out.push({ type: 'str', start: i, end: j + 1, body: src.slice(i + 1, j), prev }); i = j + 1; prev = 'x'; continue; }
    if (c === '`') { const t = readTemplate(src, i); t.prev = prev; out.push(t); i = t.end; prev = 'x'; continue; }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}
function readTemplate(src, start) {
  let j = start + 1, parts = [''], exprs = [];
  while (j < src.length && src[j] !== '`') {
    if (src[j] === '\\') { parts[parts.length - 1] += src[j] + src[j + 1]; j += 2; continue; }
    if (src[j] === '$' && src[j + 1] === '{') {
      let depth = 1, k = j + 2;
      while (k < src.length && depth) {
        const d = src[k];
        if (d === '`') { k = readTemplate(src, k).end; continue; }
        if (d === '"' || d === "'") { let m = k + 1; while (src[m] !== d) { if (src[m] === '\\') m++; m++; } k = m + 1; continue; }
        if (d === '{') depth++; else if (d === '}') depth--;
        k++;
      }
      exprs.push(src.slice(j + 2, k - 1)); parts.push(''); j = k; continue;
    }
    parts[parts.length - 1] += src[j]; j++;
  }
  return { type: 'tpl', start, end: j + 1, parts, exprs };
}
const keyOf = t => t.type === 'str' ? t.body : t.parts.map((p, i) => p + (i < t.exprs.length ? `{${i}}` : '')).join('');
const unesc = s => s.replace(/\\(['"`\\])/g, '$1');
const wrapped = (src, t) => /_t\(\s*$/.test(src.slice(Math.max(0, t.start - 4), t.start));
const isKey = (src, t) => (/[{,]/.test(t.prev) && /^\s*:/.test(src.slice(t.end))) || /\bcase\s*$/.test(src.slice(Math.max(0, t.start - 6), t.start)) || /\[\s*$/.test(src.slice(Math.max(0, t.start - 2), t.start)) && /^\s*\]\s*[=(]/.test(src.slice(t.end));

// Rewrites src: wraps dictionary literals, recursing into template expressions. visit(key, token, src) is called for every literal.
function transform(src, dict, visit) {
  const toks = lex(src); let out = '', last = 0;
  for (const t of toks) {
    let exprs = t.type === 'tpl' ? t.exprs.map(e => transform(e, dict, visit)) : [];
    const k = unesc(keyOf(t));
    const skip = wrapped(src, t) || isKey(src, t);
    if (visit && !skip && /[A-Za-zÀ-ú]{2}/.test(k)) visit(k, t, src);
    let rep = src.slice(t.start, t.end);
    if (!skip && dict && dict[k] !== undefined) rep = t.type === 'str' || !exprs.length ? `_t(${JSON.stringify(k)})` : `_t(${JSON.stringify(k)},${exprs.join(',')})`;
    else if (t.type === 'tpl' && exprs.some((e, i) => e !== t.exprs[i])) rep = '`' + t.parts.map((p, i) => p + (i < exprs.length ? '${' + exprs[i] + '}' : '')).join('') + '`';
    out += src.slice(last, t.start) + rep; last = t.end;
  }
  return out + src.slice(last);
}
function loadEN() {
  const ctx = { SET: {}, localStorage: { getItem: () => null }, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(SRC, 'i18n.js'), 'utf8') + ';this.EN=EN;', ctx);
  return ctx.EN;
}

const [, , cmd, file] = process.argv;
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js') && !SKIP.has(f));
if (cmd === 'scan') {
  const keys = {};
  for (const f of files) {
    const src = fs.readFileSync(path.join(SRC, f), 'utf8');
    transform(src, null, (k, t, s) => { (keys[k] = keys[k] || []).push(f + ':' + s.slice(0, t.start).split('\n').length) });
  }
  fs.writeFileSync(file, JSON.stringify(keys, null, 1));
  console.log(Object.keys(keys).length + ' keys');
} else if (cmd === 'apply') {
  const dict = loadEN(); let n = 0;
  for (const f of files) {
    const p = path.join(SRC, f), src = fs.readFileSync(p, 'utf8');
    const res = transform(src, dict, null);
    n += (res.match(/_t\("/g) || []).length - (src.match(/_t\("/g) || []).length;
    if (res !== src) fs.writeFileSync(p, res);
  }
  console.log(n + ' literals wrapped');
}
