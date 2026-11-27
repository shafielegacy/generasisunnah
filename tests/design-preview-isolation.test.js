'use strict';
// Memastikan pratonton reka bentuk V2 kekal terasing daripada sistem production.
// Jalankan: node tests/design-preview-isolation.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const dir = path.resolve(__dirname, '..', 'design-preview');
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');
const html = read('index.html'), js = read('assets/preview.js'), css = read('assets/preview.css');
let n = 0; const test = (label, fn) => { fn(); console.log('PASS', label); n++; };

test('preview.js is valid JavaScript', () => { new vm.Script(js); });
test('no Apps Script, Sheets, Drive or googleusercontent URLs in preview', () => {
  for (const [name, src] of [['index.html', html], ['preview.js', js], ['preview.css', css]])
    assert.doesNotMatch(src, /script\.google\.com|googleusercontent\.com|docs\.google\.com|drive\.google\.com|\/macros\/s\//i, name);
});
test('no production check-in script or GS_WEBAPP_URL referenced', () => {
  assert.doesNotMatch(html, /checkin\.js|GS_WEBAPP_URL/);
  assert.doesNotMatch(js, /GS_WEBAPP_URL/);
});
test('CSP blocks all network connections from the page', () => {
  const m = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
  assert.ok(m, 'CSP meta missing');
  assert.match(m[1], /connect-src 'none'/);
  assert.match(m[1], /frame-src 'none'/);
  assert.match(m[1], /form-action 'none'/);
  assert.match(m[1], /script-src 'self'(;|$)/);
});
test('runtime network guard replaces fetch/XHR/WebSocket/beacon', () => {
  for (const k of ['window.fetch =', 'window.XMLHttpRequest =', 'window.WebSocket =', 'navigator.sendBeacon ='])
    assert.ok(js.includes(k), k);
});
test('no browser confirm()/alert()/prompt() dialogs', () => {
  const code = js.replace(/'(?:[^'\\\n]|\\.)*'/g, "''"); // abaikan teks dalam rentetan
  assert.doesNotMatch(code, /(^|[^.\w])(confirm|alert|prompt)\s*\(/m);
});
test('fictional receipts only (R9xxx range), none of the documented real/QA receipts', () => {
  assert.doesNotMatch(js + html, /R0144|R0146/);
});
test('preview page is marked as non-production and noindex', () => {
  assert.match(html, /noindex/);
  assert.match(html, /Pratonton V2/);
});
test('progressive unlock uses Asia/Kuala_Lumpur calendar dates', () => {
  assert.match(js, /const TZ = 'Asia\/Kuala_Lumpur'/);
  assert.match(js, /disabled: st === 'future'/);
});
console.log(`${n} design-preview isolation tests passed`);
