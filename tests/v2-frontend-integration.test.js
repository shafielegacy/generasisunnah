'use strict';
// Premium UI V2 (LIVE) — ujian integrasi pelayar dengan GAS V7 DIMOCK.
// Tiada panggilan Google sebenar: semua permintaan ke script.google.com dipintas oleh page.route.
// Mengesahkan format permintaan/jawapan sebenar GAS V7, keputusan SUCCESS/FAILED/UNKNOWN,
// tiada cubaan semula automatik, kunci sesi progresif, modal (tiada confirm()), dan susun atur mudah alih.
// Jalankan: node tests/v2-frontend-integration.test.js   (perlukan Playwright + Chromium)
const assert = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const GAS = 'https://script.google.com/macros/s/AKfycby5gwUQ3r-MTpGE3SHJCD4EkcnYc6AFLK-dGaRQ6-lzQhu97A2MMSzSWUwENNDxvBF4hQ/exec';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { const i = path.join(p, 'index.html'); if (fs.existsSync(i)) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(fs.readFileSync(i)); } res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(fs.readFileSync(p));
});
const SESS = (today, open = {}) => ({ ok: true, data: { sessions: [
  { key: 'b1d1', label: 'Batch 1 · Hari 1 · 28 November', date: '2026-11-28', open: !!open.b1d1 },
  { key: 'b1d2', label: 'Batch 1 · Hari 2 · 29 November', date: '2026-11-29', open: !!open.b1d2 },
  { key: 'b2d1', label: 'Batch 2 · Hari 1 · 5 Disember', date: '2026-12-05', open: !!open.b2d1 },
  { key: 'b2d2', label: 'Batch 2 · Hari 2 · 6 Disember', date: '2026-12-06', open: !!open.b2d2 }], today, manualControl: true, simpleCheckin: true } });
const QUOTA = 'window.GSQuotaReceive({"batches":[{"batch":1,"registered":61,"quota":70,"remaining":9,"status":"DIBUKA"},{"batch":2,"registered":70,"quota":70,"remaining":0,"status":"PENUH"}],"updatedAt":"2026-11-28 08:00"});';
const TOKEN = 'a'.repeat(72);
const snapshot = (key, open, people) => ({ ok: true, data: { session: { key, label: key, date: { b1d1: '2026-11-28', b1d2: '2026-11-29', b2d1: '2026-12-05', b2d2: '2026-12-06' }[key], open },
  total: 3, present: people.filter(p => p.present).length, people, venueCode: '', manualControl: true, simpleCheckin: true, webAppUrl: '' } });
const PEOPLE = () => [{ name: 'Peserta Ujian Satu', receipt: 'GS26_R0001', present: false }, { name: 'Peserta Ujian Dua', receipt: 'GS26_R0002', present: true }, { name: 'Peserta Ujian Tiga', receipt: 'GS26_R0003', present: false }];

let browser, base, n = 0;
async function open(handler, { clock, mobile, quota = 'ok' } = {}) {
  const ctx = await browser.newContext(mobile ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const calls = [], external = [], errors = [];
  page.on('dialog', d => { errors.push('NATIVE DIALOG: ' + d.message()); d.dismiss(); });
  page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  await page.route('**/*', async route => {
    const req = route.request(), u = req.url();
    if (u.startsWith(base)) return route.continue();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return route.abort();
    if (u.startsWith(GAS)) {
      const cors = { 'access-control-allow-origin': '*' };
      if (req.method() === 'GET') {
        calls.push({ action: 'GET ' + new URL(u).searchParams.get('view'), headers: req.headers() });
        if (quota === 'fail') return route.abort();
        return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'text/javascript' }, body: QUOTA });
      }
      const body = JSON.parse(req.postData()); calls.push({ ...body, headers: req.headers() });
      const r = await handler(body, calls);
      if (r === 'ABORT') return route.abort();
      return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(r) });
    }
    external.push(u); return route.abort();
  });
  if (clock) await page.clock.install({ time: new Date(clock) });
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => window.__GS_V2_READY__ === true);
  const count = a => calls.filter(c => c.action === a).length;
  // Dengan jam palsu: maju sedikit demi sedikit supaya jawapan rangkaian (masa sebenar) sempat tiba.
  const settle = async (ms = 600) => { if (!clock) return page.waitForTimeout(ms); for (let t = 0; t < ms; t += 250) { await page.clock.runFor(250); await page.waitForTimeout(25); } };
  const modalKind = () => page.evaluate(() => { const d = document.getElementById('gsModal'); return d.open ? d.dataset.kind : ''; });
  const closeModal = async () => { await page.click('#mActions button:last-child'); await settle(400); };
  return { page, ctx, calls, count, external, errors, settle, modalKind, closeModal };
}
async function test(label, fn) { await fn(); console.log('PASS', label); n++; }
async function fillCheckin(t, r = 'R0049', p = '6789') { await t.page.goto(base + '/index.html#/checkin'); await t.settle(300); await t.page.fill('#ciReceipt', r); await t.page.fill('#ciPhone', p); }
const status28 = SESS('2026-11-28', { b1d1: true });

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
  try {
    await test('load: gsPublicStatus POST uses exact V7 contract (text/plain, args:[]) and quota GET; no other hosts', async () => {
      const t = await open(() => SESS('2026-11-27', { b1d1: true }));
      await t.settle(1500);
      const ps = t.calls.find(c => c.action === 'gsPublicStatus');
      assert.ok(ps); assert.deepEqual(ps.args, []); assert.match(ps.headers['content-type'], /^text\/plain/); assert.equal(ps.headers.cookie, undefined);
      assert.ok(t.count('GET quota') >= 1);
      await t.page.goto(base + '/index.html#/kuota'); await t.settle(1500);
      const txt = await t.page.textContent('#quotaCards');
      assert.match(txt, /61/); assert.match(txt, /PENUH/); assert.match(await t.page.textContent('#quotaUpdated'), /2026-11-28 08:00/);
      assert.deepEqual(t.external, []); assert.deepEqual(t.errors, []); await t.ctx.close();
    });
    await test('27 Nov (outside programme date): Sahkan shows out-of-date modal, NO gsSelfCheckin request', async () => {
      const t = await open(() => SESS('2026-11-27', { b1d1: true }));
      await t.settle(1200); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(500);
      assert.equal(await t.modalKind(), 'outOfDate'); assert.equal(t.count('gsSelfCheckin'), 0); assert.deepEqual(t.errors, []); await t.ctx.close();
    });
    await test('event day, session closed: not-open modal, NO request', async () => {
      const t = await open(() => SESS('2026-11-28', {}));
      await t.settle(1200); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(500);
      assert.equal(await t.modalKind(), 'notOpen'); assert.equal(t.count('gsSelfCheckin'), 0); await t.ctx.close();
    });
    await test('SUCCESS only on backend ok:true; single write with args [{receipt:"GS26_R0049", last4}]', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? status28 : { ok: true, data: { ok: true, already: false, message: 'Kehadiran berjaya direkod.' } });
      await t.settle(1200); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(1500);
      const w = t.calls.filter(c => c.action === 'gsSelfCheckin'); assert.equal(w.length, 1);
      assert.deepEqual(w[0].args, [{ receipt: 'GS26_R0049', last4: '6789' }]);
      assert.equal(await t.modalKind(), 'success'); assert.equal(await t.page.getAttribute('#outcomeHost', 'data-outcome'), 'SUCCESS');
      assert.equal(await t.page.inputValue('#ciReceipt'), ''); await t.ctx.close();
    });
    await test('already:true -> SUDAH DIREKOD (success tone)', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? status28 : { ok: true, data: { ok: true, already: true } });
      await t.settle(1200); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(1500);
      assert.equal(await t.modalKind(), 'already'); assert.equal(await t.page.getAttribute('#outcomeHost', 'data-outcome'), 'ALREADY'); await t.ctx.close();
    });
    await test('ok:false -> GAGAL with server message, no retry, no verification', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? status28 : { ok: false, error: 'Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.' });
      await t.settle(1200); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(1500);
      assert.equal(await t.modalKind(), 'failed'); assert.match(await t.page.textContent('#mBody'), /tidak dapat disahkan/);
      assert.equal(t.count('gsSelfCheckin'), 1); assert.equal(t.count('gsSelfCheckinStatus'), 0); await t.ctx.close();
    });
    await test('network lost on write, read-only status says recorded -> BERJAYA; write NOT repeated', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? status28 : b.action === 'gsSelfCheckin' ? 'ABORT' : { ok: true, data: { recorded: true, session: 'b1d1' } }, { clock: '2026-11-28T08:00:00+08:00' });
      await t.settle(1500); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(8000);
      assert.equal(t.count('gsSelfCheckin'), 1); assert.equal(t.count('gsSelfCheckinStatus'), 1);
      assert.deepEqual(t.calls.find(c => c.action === 'gsSelfCheckinStatus').args, [{ receipt: 'GS26_R0049', last4: '6789' }]);
      assert.equal(await t.page.getAttribute('#outcomeHost', 'data-outcome'), 'RECOVERED'); assert.equal(await t.modalKind(), 'success'); await t.ctx.close();
    });
    await test('server uncertain:true -> verification -> recorded:false -> GAGAL (confirmed), may resubmit', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? status28 : b.action === 'gsSelfCheckin' ? { ok: false, uncertain: true, error: 'Status penulisan tidak pasti.' } : { ok: true, data: { recorded: false } }, { clock: '2026-11-28T08:00:00+08:00' });
      await t.settle(1500); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(8000);
      assert.equal(await t.page.getAttribute('#outcomeHost', 'data-outcome'), 'FAILED'); assert.match(await t.page.textContent('#mBody'), /BELUM direkod/);
      assert.equal(t.count('gsSelfCheckin'), 1); assert.equal(await t.page.isDisabled('#ciSubmit'), false); await t.ctx.close();
    });
    await test('no answer at all -> TIDAK DIKETAHUI, 2 read-only checks, 30 s lock, still ONE write', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? status28 : 'ABORT', { clock: '2026-11-28T08:00:00+08:00' });
      await t.settle(1500); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(14000);
      assert.equal(await t.page.getAttribute('#outcomeHost', 'data-outcome'), 'UNKNOWN'); assert.equal(await t.modalKind(), 'unknown');
      assert.equal(t.count('gsSelfCheckin'), 1); assert.equal(t.count('gsSelfCheckinStatus'), 2);
      assert.equal(await t.page.isDisabled('#ciSubmit'), true, 'button locked during cooldown');
      await t.page.evaluate(() => document.getElementById('checkinForm').requestSubmit()); await t.settle(1000);
      assert.equal(t.count('gsSelfCheckin'), 1, 'cooldown blocks resubmit'); await t.ctx.close();
    });
    await test('double / triple tap -> exactly one write', async () => {
      let release; const gate = new Promise(r => release = r);
      const t = await open(async b => { if (b.action === 'gsPublicStatus') return status28; await gate; return { ok: true, data: { ok: true, already: false } }; });
      await t.settle(1200); await fillCheckin(t);
      await t.page.evaluate(() => { const f = document.getElementById('checkinForm'); f.requestSubmit(); f.requestSubmit(); f.requestSubmit(); });
      await t.settle(300); release(); await t.settle(1500); assert.equal(t.count('gsSelfCheckin'), 1); await t.ctx.close();
    });
    await test('public status unavailable does not block submit (server decides)', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? 'ABORT' : { ok: true, data: { ok: true, already: false } });
      await t.settle(1500); await fillCheckin(t); await t.page.click('#ciSubmit'); await t.settle(1500);
      assert.equal(t.count('gsSelfCheckin'), 1); assert.equal(await t.modalKind(), 'success'); await t.ctx.close();
    });
    await test('urusetia 27 Nov: all four sessions visible, all locked, no snapshot request', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? SESS('2026-11-27', { b1d1: true }) : b.action === 'gsStaffLogin' ? { ok: true, data: { token: TOKEN, expiresInSeconds: 1800 } } : { ok: false, error: 'x' });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1200);
      assert.deepEqual(t.calls.find(c => c.action === 'gsStaffLogin').args, ['kunci-ujian-xyz']);
      const st = await t.page.$$eval('#sessionSeg button', bs => bs.map(b => [b.dataset.session, b.disabled]));
      assert.deepEqual(st, [['b1d1', true], ['b1d2', true], ['b2d1', true], ['b2d2', true]]);
      assert.equal(t.count('gsStaffSnapshot'), 0); assert.match(await t.page.textContent('#controlCard'), /Belum ada sesi tersedia/); await t.ctx.close();
    });
    await test('urusetia 29 Nov: progressive unlock (b1d1 past read-only, b1d2 today auto-selected, b2d* locked)', async () => {
      const t = await open(b => {
        if (b.action === 'gsPublicStatus') return SESS('2026-11-29', { b1d2: true });
        if (b.action === 'gsStaffLogin') return { ok: true, data: { token: TOKEN } };
        if (b.action === 'gsStaffSnapshot') return snapshot(b.args[1], b.args[1] === 'b1d2', PEOPLE());
        return { ok: false, error: 'unexpected' };
      });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      const st = await t.page.$$eval('#sessionSeg button', bs => bs.map(b => [b.dataset.session, b.disabled, b.getAttribute('aria-selected')]));
      assert.deepEqual(st, [['b1d1', false, 'false'], ['b1d2', false, 'true'], ['b2d1', true, 'false'], ['b2d2', true, 'false']]);
      assert.deepEqual(t.calls.find(c => c.action === 'gsStaffSnapshot').args, [TOKEN, 'b1d2', '']);
      assert.equal(await t.page.locator('#rosterList button:has-text("Tanda hadir")').count(), 2);
      await t.page.click('#sessionSeg [data-session="b1d1"]'); await t.settle(1200);
      assert.equal(await t.page.locator('#rosterList button:has-text("Tanda hadir")').count(), 0, 'past session has no write buttons');
      assert.match(await t.page.textContent('#controlCard'), /baca sahaja/);
      assert.equal(t.count('gsStaffCheckin'), 0); assert.equal(t.count('gsStaffSetOpen'), 0); await t.ctx.close();
    });
    await test('manual attendance: premium confirm modal (Batal focused), ONE gsStaffCheckin with exact 4 args; cancel sends nothing', async () => {
      const people = PEOPLE();
      const t = await open(b => {
        if (b.action === 'gsPublicStatus') return SESS('2026-11-28', { b1d1: true });
        if (b.action === 'gsStaffLogin') return { ok: true, data: { token: TOKEN } };
        if (b.action === 'gsStaffSnapshot') return snapshot('b1d1', true, people);
        if (b.action === 'gsStaffCheckin') { people[0].present = true; return { ok: true, data: { ok: true, already: false, message: 'Kehadiran berjaya direkod.' } }; }
        return { ok: false, error: 'unexpected' };
      });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      await t.page.fill('#operatorName', 'Meja 1');
      await t.page.click('#rosterList button[data-receipt="GS26_R0001"]'); await t.settle(400);
      assert.equal(await t.modalKind(), 'confirmAttend');
      assert.equal(await t.page.evaluate(() => document.activeElement.dataset.value), 'cancel');
      await t.page.keyboard.press('Escape'); await t.settle(400); assert.equal(t.count('gsStaffCheckin'), 0);
      await t.page.click('#rosterList button[data-receipt="GS26_R0001"]'); await t.settle(400);
      await t.page.click('#mActions button[data-value="ok"]'); await t.settle(1500);
      const w = t.calls.filter(c => c.action === 'gsStaffCheckin'); assert.equal(w.length, 1);
      assert.deepEqual(w[0].args, [TOKEN, 'b1d1', 'GS26_R0001', 'Meja 1']);
      assert.equal(await t.page.locator('#rosterList button[data-receipt="GS26_R0001"]').count(), 0); await t.ctx.close();
    });
    await test('open/close: confirm modal then ONE gsStaffSetOpen [token, key, bool]', async () => {
      let open1 = true;
      const t = await open(b => {
        if (b.action === 'gsPublicStatus') return SESS('2026-11-28', { b1d1: open1 });
        if (b.action === 'gsStaffLogin') return { ok: true, data: { token: TOKEN } };
        if (b.action === 'gsStaffSnapshot') return snapshot('b1d1', open1, PEOPLE());
        if (b.action === 'gsStaffSetOpen') { open1 = b.args[2]; return { ok: true, data: { key: 'b1d1', open: open1 } }; }
        return { ok: false, error: 'unexpected' };
      });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      await t.page.click('#gsToggle'); await t.settle(400); assert.equal(await t.modalKind(), 'confirmToggle');
      await t.page.click('#mActions button[data-value="ok"]'); await t.settle(1500);
      const w = t.calls.filter(c => c.action === 'gsStaffSetOpen'); assert.equal(w.length, 1); assert.deepEqual(w[0].args, [TOKEN, 'b1d1', false]);
      assert.equal(await t.page.getAttribute('#gsToggle', 'aria-checked'), 'false'); await t.ctx.close();
    });
    await test('staff write with no answer -> connection modal, NO automatic retry', async () => {
      const t = await open(b => {
        if (b.action === 'gsPublicStatus') return SESS('2026-11-28', { b1d1: true });
        if (b.action === 'gsStaffLogin') return { ok: true, data: { token: TOKEN } };
        if (b.action === 'gsStaffSnapshot') return snapshot('b1d1', true, PEOPLE());
        if (b.action === 'gsStaffCheckin') return 'ABORT';
        return { ok: false, error: 'unexpected' };
      });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      await t.page.click('#rosterList button[data-receipt="GS26_R0001"]'); await t.settle(400); await t.page.click('#mActions button[data-value="ok"]'); await t.settle(1500);
      assert.equal(await t.modalKind(), 'connection'); assert.equal(t.count('gsStaffCheckin'), 1);
      await t.page.waitForTimeout(1500); assert.equal(t.count('gsStaffCheckin'), 1); await t.ctx.close();
    });
    await test('expired staff session -> session-expired modal and back to login; wrong key shows server error', async () => {
      let first = true;
      const t = await open(b => {
        if (b.action === 'gsPublicStatus') return SESS('2026-11-28', { b1d1: true });
        if (b.action === 'gsStaffLogin') { if (first) { first = false; return { ok: false, error: 'Kunci urusetia tidak sah.' }; } return { ok: true, data: { token: TOKEN } }; }
        if (b.action === 'gsStaffSnapshot') return { ok: false, error: 'Sesi tamat. Sila login semula.' };
        return { ok: false, error: 'unexpected' };
      });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia');
      await t.page.fill('#staffKey', 'salah-kunci-1'); await t.page.click('#loginBtn'); await t.settle(800);
      assert.match(await t.page.textContent('#staffKeyErr'), /tidak sah/); assert.equal(await t.page.isVisible('#staffDash'), false);
      await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      assert.equal(await t.modalKind(), 'expired'); await t.closeModal(); assert.equal(await t.page.isVisible('#staffLogin'), true); await t.ctx.close();
    });
    await test('logout sends gsStaffLogout [token]', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? SESS('2026-11-28', { b1d1: true }) : b.action === 'gsStaffLogin' ? { ok: true, data: { token: TOKEN } } : b.action === 'gsStaffSnapshot' ? snapshot('b1d1', true, PEOPLE()) : { ok: true, data: true });
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      await t.page.click('#logoutBtn'); await t.settle(800);
      assert.deepEqual(t.calls.find(c => c.action === 'gsStaffLogout').args, [TOKEN]); assert.equal(await t.page.isVisible('#staffLogin'), true); await t.ctx.close();
    });
    await test('search is sent to gsStaffSnapshot as the 3rd arg (debounced)', async () => {
      const t = await open(b => b.action === 'gsPublicStatus' ? SESS('2026-11-28', { b1d1: true }) : b.action === 'gsStaffLogin' ? { ok: true, data: { token: TOKEN } } : snapshot('b1d1', true, PEOPLE().filter(p => p.name.toLowerCase().includes(String(b.args[2]).toLowerCase()))));
      await t.settle(1200); await t.page.goto(base + '/index.html#/urusetia'); await t.page.fill('#staffKey', 'kunci-ujian-xyz'); await t.page.click('#loginBtn'); await t.settle(1500);
      await t.page.fill('#rosterSearch', 'Dua'); await t.settle(1200);
      assert.deepEqual(t.calls.filter(c => c.action === 'gsStaffSnapshot').pop().args, [TOKEN, 'b1d1', 'Dua']);
      assert.equal(await t.page.locator('#rosterList .person').count(), 1); await t.ctx.close();
    });
    await test('quota unavailable -> error state, no stale or invented numbers', async () => {
      const t = await open(() => SESS('2026-11-28', { b1d1: true }), { quota: 'fail', clock: '2026-11-28T08:00:00+08:00' });
      await t.page.goto(base + '/index.html#/kuota'); await t.settle(20000);
      assert.match(await t.page.textContent('#quotaCards'), /Data kuota tidak tersedia/); assert.equal(await t.page.locator('#quotaKpis .kpi').count(), 0); await t.ctx.close();
    });
    await test('theme toggle cycles auto -> light -> dark; mobile: tab bar visible, no horizontal overflow on all 5 screens', async () => {
      const t = await open(() => SESS('2026-11-28', { b1d1: true }), { mobile: true });
      await t.settle(1200);
      await t.page.click('#themeBtn'); assert.equal(await t.page.getAttribute('html', 'data-theme'), 'light');
      await t.page.click('#themeBtn'); assert.equal(await t.page.getAttribute('html', 'data-theme'), 'dark');
      assert.equal(await t.page.isVisible('.tabbar'), true);
      for (const v of ['utama', 'kuota', 'checkin', 'urusetia', 'keadaan']) {
        await t.page.click(`.tabbar a[data-nav="${v}"]`); await t.settle(700);
        assert.equal(await t.page.getAttribute(`.tabbar a[data-nav="${v}"]`, 'aria-current'), 'page');
        const ov = await t.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(ov <= 1, `${v} overflows by ${ov}px`);
      }
      assert.deepEqual(t.errors, []); await t.ctx.close();
    });
  } finally { await browser.close(); server.close(); }
  console.log(`${n} V2 browser integration tests passed; GAS MOCKED, NO GOOGLE CALLS.`);
})().catch(e => { console.error(e); process.exit(1); });
