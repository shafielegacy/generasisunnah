'use strict';
// Semakan statik pelepasan Premium UI V2 (LIVE). Tiada rangkaian.
// Jalankan: node tests/v2-release-static.test.js
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const html = read('index.html'), js = read('assets/gs-v2.js'), css = read('assets/gs-v2.css'), gs = read('gas/Code.gs');
const PROD_URL = 'https://script.google.com/macros/s/AKfycby5gwUQ3r-MTpGE3SHJCD4EkcnYc6AFLK-dGaRQ6-lzQhu97A2MMSzSWUwENNDxvBF4hQ/exec';
let n = 0; const test = (l, f) => { f(); console.log('PASS', l); n++; };
const code = js.replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');

test('JavaScript syntax valid', () => { new vm.Script(js); });
test('uses the SAME production /exec endpoint and no other Apps Script URL', () => {
  const urls = [...new Set((html + js).match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g) || [])];
  assert.deepEqual(urls, [PROD_URL]);
});
test('every api() action exists in GAS V7 doPost (no invented actions)', () => {
  const gasActions = new Set([...gs.matchAll(/case '(\w+)':/g)].map(m => m[1]));
  const used = new Set([...js.matchAll(/api\('(\w+)'/g)].map(m => m[1]));
  assert.ok(used.size >= 8);
  for (const a of used) assert.ok(gasActions.has(a), 'unknown action ' + a);
});
test('argument arity matches doPost checks', () => {
  const arity = { gsPublicStatus: 0, gsSelfCheckin: 1, gsSelfCheckinStatus: 1, gsStaffLogin: 1, gsStaffLogout: 1, gsStaffSnapshot: 3, gsStaffSetOpen: 3, gsStaffCheckin: 4 };
  let seen = 0;
  for (const m of js.matchAll(/api\('(\w+)'((?:, [^;]*?)?)\)(?=[;)\s])/g)) {
    seen++;
    const a = m[1], rest = m[2].trim();
    const count = rest ? rest.slice(1).split(/,(?![^{]*})/).length : 0;
    assert.equal(count, arity[a], a + ' args: ' + rest);
  }
  assert.equal(seen, 8, 'all eight api() call sites checked');
});
test('exactly one fetch() for POST actions; CORS, no cookies, no no-cors / JSONP', () => {
  assert.equal((code.match(/await fetch\(/g) || []).length, 1);
  assert.ok(js.includes("mode: 'cors', credentials: 'omit'"));
  assert.ok(!js.includes('no-cors')); assert.ok(!js.includes('view=rpc')); assert.ok(!/createElement\('script'\)/.test(js));
});
test('no native confirm()/alert()/prompt()', () => { assert.doesNotMatch(code, /(^|[^.\w])(confirm|alert|prompt)\s*\(/m); });
test('no mock data, demo panel or preview wording left in production files', () => {
  for (const [f, s] of [['index.html', html], ['gs-v2.js', js]]) {
    assert.doesNotMatch(s, /R90\d\d|rekaan|Pratonton|Panel demo|demoDrawer|SERVER\s*=|makeRoster|connect-src 'none'/i, f);
  }
});
test('no credentials, tokens or personal data persisted in the browser', () => {
  assert.doesNotMatch(js, /localStorage\.setItem\((?!'gs26-theme')/);
  assert.doesNotMatch(js, /sessionStorage|document\.cookie|indexedDB/);
  assert.doesNotMatch(html + js, /GS_STAFF_KEY\s*[:=]|spreadsheetId|1YOlKCIfBd6FNJji6p4SjQtuBQOqr3zVFbtC2Nj1mwvc/);
});
test('session date gate and read-only reconciliation preserved', () => {
  assert.ok(js.includes("api('gsSelfCheckin', { receipt, last4 })"));
  assert.ok(js.includes("api('gsSelfCheckinStatus', { receipt, last4 })"));
  assert.ok(js.includes('if (!d || d.ok !== true) throw new GsUncertain'));
  assert.ok(js.includes('S.cooldownUntil = Date.now() + 30000'));
  assert.ok(js.includes("if (next && st !== 'today')"), 'open only on session date');
  assert.ok(js.includes("const TZ = 'Asia/Kuala_Lumpur'"));
});
test('index.html loads only the V2 assets (legacy js/checkin.js not loaded)', () => {
  assert.ok(html.includes('./assets/gs-v2.js')); assert.ok(html.includes('./assets/gs-v2.css'));
  assert.ok(!html.includes('js/checkin.js')); assert.ok(!html.includes('qrcode'));
});
test('all five screens and the modal host exist', () => {
  for (const v of ['utama', 'kuota', 'checkin', 'urusetia', 'keadaan']) assert.ok(html.includes(`data-view="${v}"`), v);
  assert.ok(html.includes('id="gsModal"')); assert.ok(html.includes('class="tabbar"'));
  assert.ok(css.includes('prefers-color-scheme:dark')); assert.ok(css.includes('prefers-reduced-motion'));
});
console.log(`${n} V2 release static checks passed`);
