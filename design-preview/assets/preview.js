/* Generasi Sunnah 2026 — Pratonton reka bentuk V2.
 * PRATONTON SAHAJA: semua data rekaan, semua "pelayan" disimulasikan dalam memori.
 * Tiada fetch/XHR/WebSocket/beacon dibenarkan (CSP connect-src 'none' + pengawal di bawah).
 * Tiada URL Apps Script, Sheets atau QR production dalam fail ini.
 */
(() => {
'use strict';

/* ---------- 0. Pengawal rangkaian (lapisan kedua selepas CSP) ---------- */
const blocked = name => function () { console.warn('[PRATONTON] ' + name + ' disekat: pratonton tidak boleh menghubungi pelayan.'); throw new Error('Rangkaian disekat dalam pratonton'); };
try {
  window.fetch = () => Promise.reject(new Error('Rangkaian disekat dalam pratonton'));
  window.XMLHttpRequest = blocked('XMLHttpRequest');
  window.WebSocket = blocked('WebSocket');
  window.EventSource = blocked('EventSource');
  if (navigator.sendBeacon) navigator.sendBeacon = () => false;
} catch (_) { /* abaikan */ }

/* ---------- 1. Utiliti ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const TZ = 'Asia/Kuala_Lumpur';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v; // HANYA untuk ikon SVG statik di bawah
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  x: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  q: svg('<path d="M9.2 9a3 3 0 1 1 4.3 2.7c-.9.5-1.5 1.1-1.5 2.1v.7"/><path d="M12 18h.01"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  unlock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>'),
  wifi: svg('<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"/><path d="M3 3l18 18"/>'),
  door: svg('<path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M14 12h.01"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  userCheck: svg('<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 12.5-4.3M16 18l2 2 4-4"/>'),
  alert: svg('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>'),
  power: svg('<path d="M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
};
const fmtTime = d => new Intl.DateTimeFormat('ms-MY', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
const fmtDateLong = d => new Intl.DateTimeFormat('ms-MY', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
const fmtChip = d => new Intl.DateTimeFormat('ms-MY', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
// Tarikh kalendar Malaysia, bukan zon waktu peranti.
const mytDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const MONTHS = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const longDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
function countUp(node, to) {
  const from = Number(node.dataset.v || 0); node.dataset.v = to;
  const sfx = node.dataset.suffix || '';
  if (reduceMotion || from === to) { node.textContent = to + sfx; return; }
  const t0 = performance.now(), dur = 700;
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.textContent = Math.round(from + (to - from) * e) + sfx; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- 2. Data rekaan ---------- */
const SESSIONS = [
  { key: 'b1d1', batch: 1, day: 1, date: '2026-11-28', label: 'Batch 1 · Hari 1', short: '28 Nov', dow: 'Sab' },
  { key: 'b1d2', batch: 1, day: 2, date: '2026-11-29', label: 'Batch 1 · Hari 2', short: '29 Nov', dow: 'Ahd' },
  { key: 'b2d1', batch: 2, day: 1, date: '2026-12-05', label: 'Batch 2 · Hari 1', short: '5 Dis', dow: 'Sab' },
  { key: 'b2d2', batch: 2, day: 2, date: '2026-12-06', label: 'Batch 2 · Hari 2', short: '6 Dis', dow: 'Ahd' },
];
const SESSION_START = '08:00'; // anggaran untuk kiraan detik dalam pratonton
const SCENARIOS = [
  ['2026-11-27T20:30', '27 Nov, 8:30 mlm · sebelum program'],
  ['2026-11-28T08:15', '28 Nov, 8:15 pg · B1 Hari 1'],
  ['2026-11-29T08:40', '29 Nov, 8:40 pg · B1 Hari 2'],
  ['2026-12-01T10:00', '1 Dis · antara batch'],
  ['2026-12-05T08:20', '5 Dis, 8:20 pg · B2 Hari 1'],
  ['2026-12-06T09:05', '6 Dis, 9:05 pg · B2 Hari 2'],
  ['2026-12-07T10:00', '7 Dis · selepas program'],
];
const FIRST = ['Ahmad','Muhammad','Aisyah','Nur Iman','Umar','Hana','Yusuf','Safiya','Hafiz','Zara','Adam','Maryam','Imran','Alya','Danish','Khadijah','Haziq','Sofea','Irfan','Humaira','Rayyan','Damia','Firdaus','Insyirah','Luqman','Nadia','Hakimi','Qistina','Aqil','Wardah'];
const FATHER = ['Rahman','Hakim','Zulkifli','Azman','Fauzi','Ismail','Rosli','Kamal','Shukri','Nordin','Hamdan','Zainal','Jamil','Rashid','Halim'];
function makeRoster() {
  const list = [];
  for (let b = 1; b <= 2; b++) for (let i = 1; i <= 30; i++) {
    const n = (b - 1) * 30 + i, f = FIRST[(i * 7 + b * 3) % FIRST.length];
    const girl = /Aisyah|Nur|Hana|Safiya|Zara|Maryam|Alya|Khadijah|Sofea|Humaira|Damia|Insyirah|Nadia|Qistina|Wardah/.test(f);
    list.push({ receipt: 'GS26_R' + (9000 + n), short: 'R' + (9000 + n), batch: b,
      name: `${f} ${girl ? 'binti' : 'bin'} ${FATHER[(n * 7 + i) % FATHER.length]}`,
      last4: String(1000 + ((n * 7919) % 9000)).slice(-4) });
  }
  // Kod demo yang diketahui
  const fix = (r, p) => { const x = list.find(q => q.short === r); if (x) x.last4 = p; };
  for (const base of [9000, 9030]) { fix('R' + (base + 1), '1234'); fix('R' + (base + 2), '5678'); fix('R' + (base + 13), '1313'); fix('R' + (base + 14), '1414'); }
  return list;
}
const QUOTA = [{ batch: 1, registered: 68, quota: 80, status: 'DIBUKA' }, { batch: 2, registered: 80, quota: 80, status: 'PENUH' }];

/* ---------- 3. Keadaan aplikasi ---------- */
const S = {
  baseReal: Date.now(), baseSim: new Date('2026-11-28T08:15:00+08:00').getTime(),
  quotaMode: 'ok', publicMode: 'ok', outcomeMode: 'auto', staffMode: 'ok',
  roster: makeRoster(), att: {}, open: {}, events: {},
  token: '', staffSession: '', filter: 'all', query: '',
  submitting: false, cooldownUntil: 0, lastOutcome: null,
};
const now = () => new Date(S.baseSim + (Date.now() - S.baseReal));
const today = () => mytDay(now());
const todaySession = () => SESSIONS.find(s => s.date === today()) || null;
const sessionState = s => s.date === today() ? 'today' : s.date < today() ? 'past' : 'future';

function seed() {
  S.att = {}; S.open = {}; S.events = {};
  const t = today();
  for (const s of SESSIONS) {
    S.att[s.key] = new Map(); S.open[s.key] = false; S.events[s.key] = [];
    const people = S.roster.filter(p => p.batch === s.batch);
    if (s.date < t) {
      people.forEach((p, i) => { if ((i * 37) % 100 < 88) S.att[s.key].set(p.receipt, { at: new Date(s.date + 'T08:' + String(5 + (i % 50)).padStart(2, '0') + ':00+08:00'), method: i % 5 ? 'QR' : 'MANUAL', by: i % 5 ? 'Peserta' : 'Urusetia Meja 1' }); });
    } else if (s.date === t) {
      S.open[s.key] = true;
      S.events[s.key].push({ at: new Date(now().getTime() - 25 * 60000), kind: 'sys', text: 'Check-in dibuka', by: 'Urusetia Meja 1' });
      people.forEach((p, i) => {
        const base = s.batch === 1 ? 9000 : 9030, n = Number(p.short.slice(1)) - base;
        if (n === 2 || (n > 2 && n !== 13 && n !== 14 && (i * 53) % 100 < 38)) {
          const at = new Date(now().getTime() - (20 - (i % 20)) * 60000);
          S.att[s.key].set(p.receipt, { at, method: i % 4 ? 'QR' : 'MANUAL', by: i % 4 ? 'Peserta' : 'Urusetia Meja 2' });
        }
      });
    }
  }
}

/* ---------- 4. "Pelayan" simulasi: meniru peraturan GAS V7 ---------- */
class Uncertain extends Error {}
const SERVER = {
  publicStatus() {
    if (S.publicMode === 'error') throw new Uncertain('Status sesi tidak dapat disemak.');
    return { today: today(), sessions: SESSIONS.map(s => ({ ...s, open: S.open[s.key] })) };
  },
  // Sesi dipilih oleh pelayan berdasarkan tarikh Malaysia. Tiada sesi lampau boleh ditulis.
  selfCheckin(receipt, last4) {
    const s = todaySession();
    if (!s) throw new Error('Check-in belum bermula atau tarikh program sudah tamat. Sila hadir pada tarikh batch yang ditetapkan.');
    if (!S.open[s.key]) throw new Error('Check-in belum dibuka oleh urusetia.');
    const p = S.roster.find(x => x.receipt === receipt);
    if (!p || p.last4 !== last4) throw new Error('Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.');
    if (p.batch !== s.batch) throw new Error('Rekod peserta tidak sepadan dengan batch hari ini.');
    if (S.att[s.key].has(receipt)) return { already: true, session: s };
    const n = Number(p.short.slice(1)) - (p.batch === 1 ? 9000 : 9030);
    if (n === 13) { S.att[s.key].set(receipt, { at: now(), method: 'QR', by: 'Peserta' }); throw new Uncertain('Sambungan terputus selepas penulisan.'); }
    if (n === 14) throw new Uncertain('Sambungan terputus.');
    S.att[s.key].set(receipt, { at: now(), method: 'QR', by: 'Peserta' });
    return { already: false, session: s };
  },
  selfStatus(receipt) { // baca sahaja
    const s = todaySession(); if (!s) return false;
    const n = Number(receipt.slice(-4)) - (receipt.slice(-4) > '9030' ? 9030 : 9000);
    if (n === 14) return null; // pengesahan juga gagal → TIDAK DIKETAHUI
    return S.att[s.key].has(receipt);
  },
  staffCheck() {
    if (S.staffMode === 'expired') throw Object.assign(new Error('Sesi tamat. Sila login semula.'), { expired: true });
    if (S.staffMode === 'unknown') throw new Uncertain('Sambungan terputus sebelum pengesahan diterima.');
  },
  staffSetOpen(key, open) {
    this.staffCheck();
    const s = SESSIONS.find(x => x.key === key);
    if (open && s.date !== today()) throw new Error('Check-in hanya boleh dibuka pada tarikh sesi.');
    S.open[key] = open; return true;
  },
  staffCheckin(key, receipt, operator) {
    this.staffCheck();
    const s = SESSIONS.find(x => x.key === key);
    if (s.date !== today()) throw new Error('Rekod kehadiran tidak dibenarkan di luar tarikh sesi.');
    if (!S.open[key]) throw new Error('Check-in belum dibuka.');
    if (S.att[key].has(receipt)) return { already: true };
    S.att[key].set(receipt, { at: now(), method: 'MANUAL', by: operator || 'Urusetia' });
    return { already: false };
  },
};

/* ---------- 5. Sistem modal premium ---------- */
const M = { dlg: $('#gsModal'), resolve: null, opener: null };
function modal(o) {
  const d = M.dlg;
  if (d.open) closeModal('replaced', true);
  M.opener = document.activeElement;
  const card = $('#mCard');
  card.className = 'modal-card m-tone-' + (o.tone || 'accent');
  const medal = $('#mMedal'); medal.className = 'm-medal' + (o.draw ? ' draw' : ''); medal.innerHTML = I[o.icon || 'info'];
  $('#mTag').textContent = o.tag || ''; $('#mTag').hidden = !o.tag;
  $('#mTitle').textContent = o.title || '';
  const body = $('#mBody'); body.replaceChildren(...[].concat(o.body || []).map(x => typeof x === 'string' ? el('p', { text: x }) : x));
  const extra = $('#mExtra'); extra.replaceChildren();
  if (o.details) extra.append(el('dl', { class: 'm-details' }, o.details.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])));
  if (o.note) extra.append(el('div', { class: 'm-note ' + (o.noteTone || '') }, o.note));
  const acts = $('#mActions'); acts.replaceChildren();
  const btns = o.actions || [{ label: 'Faham', value: 'ok', kind: 'primary' }];
  acts.className = 'modal-actions' + (btns.length === 1 ? ' single' : '');
  let focusBtn = null;
  for (const b of btns) {
    const btn = el('button', { type: 'button', class: 'btn btn-' + (b.kind || 'outline'), text: b.label, onclick: () => closeModal(b.value) });
    acts.append(btn); if (b.autofocus || (!focusBtn && b.kind !== 'primary' && b.kind !== 'danger' && o.safeFocus)) focusBtn = btn;
  }
  d.dataset.dismiss = o.dismissible === false ? 'no' : 'yes';
  d.showModal();
  (focusBtn || acts.lastElementChild).focus();
  return new Promise(r => { M.resolve = r; });
}
function closeModal(value, instant) {
  const d = M.dlg; if (!d.open) return;
  const done = () => { d.classList.remove('closing'); d.close(); const r = M.resolve; M.resolve = null; if (r) r(value); if (M.opener && document.contains(M.opener)) M.opener.focus({ preventScroll: true }); };
  if (instant || reduceMotion) return done();
  d.classList.add('closing'); setTimeout(done, 200);
}
M.dlg.addEventListener('cancel', e => { e.preventDefault(); if (M.dlg.dataset.dismiss !== 'no') closeModal('cancel'); });
M.dlg.addEventListener('click', e => { if (e.target === M.dlg && M.dlg.dataset.dismiss !== 'no') closeModal('cancel'); });

// Katalog modal, digunakan oleh aliran sebenar dan galeri keadaan.
const MODALS = {
  outOfDate: () => {
    const next = SESSIONS.find(s => s.date > today());
    return modal({ tone: 'warn', icon: 'cal', tag: 'Di luar tarikh program', title: 'Check-in belum dibenarkan hari ini',
      body: ['Kehadiran hanya boleh direkod pada tarikh sesi yang sebenar. Tiada maklumat dihantar.'],
      details: next ? [['Sesi seterusnya', next.label], ['Tarikh', longDate(next.date)]] : [['Status', 'Program telah tamat']],
      actions: [{ label: 'Faham', value: 'ok', kind: 'primary' }] });
  },
  notOpen: s => modal({ tone: 'info', icon: 'door', tag: 'Kaunter belum dibuka', title: 'Sila tunggu sebentar',
    body: [`Urusetia belum membuka check-in untuk ${s ? s.label : 'sesi hari ini'}. Cuba semula selepas pengumuman di kaunter.`],
    actions: [{ label: 'Baik', value: 'ok', kind: 'primary' }] }),
  success: (receipt, s, at) => modal({ tone: 'ok', icon: 'check', draw: true, tag: 'Berjaya', title: 'Kehadiran direkod',
    body: ['Terima kasih. Tunjukkan skrin ini kepada urusetia jika diminta.'],
    details: [['Resit', receipt], ['Sesi', s.label], ['Masa', fmtTime(at) + ' MYT']],
    actions: [{ label: 'Selesai', value: 'ok', kind: 'primary' }] }),
  already: (receipt, s) => modal({ tone: 'ok', icon: 'userCheck', tag: 'Sudah direkod', title: 'Kehadiran sudah ada',
    body: ['Kehadiran ini sudah direkod untuk sesi hari ini. Tiada tindakan lanjut diperlukan, dan tiada rekod berganda dibuat.'],
    details: [['Resit', receipt], ['Sesi', s.label]],
    actions: [{ label: 'Selesai', value: 'ok', kind: 'primary' }] }),
  failed: msg => modal({ tone: 'bad', icon: 'x', tag: 'Gagal', title: 'Kehadiran belum direkod',
    body: [msg], note: 'Tiada rekod dibuat. Anda boleh semak maklumat dan cuba sekali lagi.', noteTone: 'bad',
    actions: [{ label: 'Betulkan maklumat', value: 'ok', kind: 'primary' }] }),
  unknown: () => modal({ tone: 'warn', icon: 'q', tag: 'Status tidak diketahui', title: 'Kami tidak pasti sama ada ia tersimpan',
    body: ['Sambungan terputus dan semakan semula juga tidak berjaya. Kehadiran mungkin sudah, atau belum, direkod.'],
    note: el('span', {}, el('b', { text: 'Jangan hantar berulang kali. ' }), 'Tunjukkan skrin ini kepada urusetia di meja pendaftaran untuk semakan senarai.'),
    actions: [{ label: 'Faham, rujuk urusetia', value: 'ok', kind: 'primary' }], dismissible: false }),
  connection: () => modal({ tone: 'warn', icon: 'wifi', tag: 'Ralat sambungan', title: 'Status tindakan tidak pasti',
    body: ['Jawapan pelayan tidak diterima. Tindakan mungkin sudah berlaku. Sistem tidak akan mencuba semula secara automatik.'],
    note: 'Tekan Muat semula senarai dan semak status peserta dahulu sebelum mencuba lagi.',
    actions: [{ label: 'Tutup', value: 'cancel', kind: 'outline' }, { label: 'Muat semula senarai', value: 'refresh', kind: 'primary' }] }),
  expired: () => modal({ tone: 'info', icon: 'clock', tag: 'Sesi tamat', title: 'Sila log masuk semula',
    body: ['Sesi log masuk urusetia telah tamat untuk keselamatan. Tiada perubahan dibuat pada tindakan terakhir.'],
    actions: [{ label: 'Log masuk semula', value: 'ok', kind: 'primary' }], dismissible: false }),
  confirmAttend: (p, s, op) => modal({ tone: 'accent', icon: 'userCheck', tag: 'Sahkan kehadiran', title: 'Tandakan HADIR?', safeFocus: true,
    body: ['Pastikan peserta berada di hadapan anda sebelum menekan Tanda hadir.'],
    details: [['Nama', p.name], ['Resit', p.short], ['Sesi', s.label], ['Petugas', op || '—']],
    actions: [{ label: 'Batal', value: 'cancel', kind: 'outline' }, { label: 'Tanda hadir', value: 'ok', kind: 'primary' }] }),
  confirmToggle: (s, next) => modal({ tone: next ? 'ok' : 'bad', icon: next ? 'unlock' : 'lock', tag: next ? 'Buka check-in' : 'Tutup check-in', safeFocus: true,
    title: next ? `Buka check-in ${s.short}?` : `Tutup check-in ${s.short}?`,
    body: [next ? 'Penjaga boleh mula mengesahkan kehadiran melalui QR poster sebaik sahaja dibuka.' : 'Penjaga tidak lagi boleh check-in sendiri. Rekod sedia ada tidak terjejas.'],
    details: [['Sesi', s.label], ['Tarikh', longDate(s.date)]],
    actions: [{ label: 'Batal', value: 'cancel', kind: 'outline' }, { label: next ? 'Ya, buka' : 'Ya, tutup', value: 'ok', kind: next ? 'primary' : 'danger' }] }),
  pastReadOnly: s => modal({ tone: 'info', icon: 'eye', tag: 'Baca sahaja', title: 'Sesi lampau dikunci',
    body: [`${s.label} (${longDate(s.date)}) boleh disemak untuk rujukan sahaja.`],
    note: 'Rekod kehadiran baharu dan buka/tutup check-in tidak dibenarkan untuk tarikh lampau. Pelayan GAS V7 juga menolak penulisan di luar tarikh.', noteTone: 'info',
    actions: [{ label: 'Faham', value: 'ok', kind: 'primary' }] }),
};

/* ---------- 6. Routing ---------- */
const VIEWS = ['utama', 'kuota', 'checkin', 'urusetia', 'keadaan'];
function route() {
  const v = (location.hash.match(/^#\/(\w+)/) || [])[1];
  const view = VIEWS.includes(v) ? v : 'utama';
  $$('.view').forEach(s => { const on = s.dataset.view === view; if (on && s.hidden) { s.hidden = false; s.style.animation = 'none'; s.offsetHeight; s.style.animation = ''; } else if (!on) s.hidden = true; });
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (view === 'kuota') loadQuota();
  if (view === 'urusetia') renderStaff();
  if (view === 'keadaan') renderGallery();
  if (view === 'checkin') renderBanner();
  window.scrollTo(0, 0);
}

/* ---------- 7. Utama ---------- */
function renderHome() {
  const s = todaySession(), t = today();
  const dot = $('#heroDot'), cd = $('#heroCountdown');
  dot.className = 'live-dot';
  cd.hidden = true;
  let label, sub;
  let pub = null; try { pub = SERVER.publicStatus(); } catch (_) {}
  if (!pub) { label = 'Status sesi belum dapat disemak'; sub = 'Anda masih boleh cuba check-in; pelayan akan menyemak tarikh dan maklumat.'; }
  else if (s && S.open[s.key]) { dot.classList.add('on'); label = `Check-in dibuka · ${s.label}`; sub = `Hari ini, ${longDate(s.date)}. Imbas QR atau tekan Sahkan kehadiran.`; }
  else if (s) { dot.classList.add('wait'); label = `Hari ini: ${s.label}`; sub = 'Kaunter belum dibuka oleh urusetia. Sila tunggu pengumuman.'; }
  else {
    const next = SESSIONS.find(x => x.date > t);
    if (next) {
      dot.classList.add('wait'); label = `Seterusnya: ${next.label}`; sub = `${longDate(next.date)} · check-in dibuka pada hari program sahaja.`;
      const ms = new Date(next.date + 'T' + SESSION_START + ':00+08:00') - now();
      if (ms > 0) { cd.hidden = false; const m = Math.floor(ms / 60000); cd.querySelector('[data-cd="d"]').textContent = Math.floor(m / 1440); cd.querySelector('[data-cd="h"]').textContent = Math.floor(m % 1440 / 60); cd.querySelector('[data-cd="m"]').textContent = m % 60; }
    } else { label = 'Program 2026 telah tamat'; sub = 'Terima kasih atas penyertaan. Jumpa lagi, insya-Allah.'; }
  }
  $('#heroLabel').textContent = label; $('#heroSub').textContent = sub;

  const grid = $('#scheduleGrid'); grid.replaceChildren();
  for (const b of [1, 2]) {
    const ss = SESSIONS.filter(x => x.batch === b);
    const q = QUOTA.find(x => x.batch === b);
    grid.append(el('article', { class: 'batch' },
      el('div', { class: 'batch-top' }, el('div', {}, el('h3', { text: 'Batch ' + b }), el('span', { class: 'batch-range', text: b === 1 ? '28–29 November 2026' : '5–6 Disember 2026' })),
        el('span', { class: 'badge ' + (q.status === 'DIBUKA' ? 'ok' : 'gold'), text: q.status === 'DIBUKA' ? 'Pendaftaran dibuka' : 'Penuh' })),
      ss.map(x => {
        const st = sessionState(x), open = S.open[x.key];
        const [, , dd] = x.date.split('-');
        return el('div', { class: 'day' + (st === 'today' ? ' is-today' : st === 'past' ? ' is-past' : '') },
          el('div', { class: 'day-date' }, el('small', { text: x.dow }), el('b', { text: String(Number(dd)) })),
          el('div', { class: 'day-info' }, el('strong', { text: 'Hari ' + x.day }), el('span', { text: longDate(x.date) })),
          st === 'today' ? el('span', { class: 'badge ' + (open ? 'ok' : 'warn'), text: open ? 'Dibuka' : 'Hari ini' })
            : st === 'past' ? el('span', { class: 'badge mute', text: 'Selesai' }) : el('span', { class: 'badge', text: 'Akan datang' }));
      })));
  }
  const mq = $('#miniQuota'); mq.replaceChildren();
  for (const q of QUOTA) mq.append(el('a', { class: 'mq', href: '#/kuota' }, ring(q.registered / q.quota, 64, 7, `${Math.round(q.registered / q.quota * 100)}%`, '', 'mq-ring'),
    el('div', {}, el('h3', { text: 'Batch ' + q.batch }), el('p', { text: `${q.registered} / ${q.quota} berdaftar · baki ${q.quota - q.registered}` })),
    el('span', { class: 'badge ' + (q.status === 'DIBUKA' ? 'ok' : 'gold'), style: 'margin-left:auto', text: q.status })));
}
let ringN = 0;
function ring(frac, size, stroke, big, small, cls) {
  const r = (100 - stroke) / 2, c = 2 * Math.PI * r, id = 'rg' + (++ringN);
  const wrap = el('div', { class: 'ring ' + (cls || '') });
  wrap.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#13775c"/><stop offset="1" stop-color="#cfae6a"/></linearGradient></defs><circle class="track" cx="50" cy="50" r="${r}" style="stroke-width:${stroke}"/><circle class="bar" cx="50" cy="50" r="${r}" style="stroke:url(#${id});stroke-width:${stroke};stroke-dasharray:${c};stroke-dashoffset:${c}"/></svg>`;
  const lab = el('div', { class: 'ring-label' }, el('div', {}, el('strong', { text: big, style: size && size < 100 ? 'font-size:16px;font-family:var(--f-ui);font-weight:800' : null }), small ? el('small', { text: small }) : null));
  wrap.append(lab);
  if (size) { wrap.style.width = size + 'px'; wrap.style.height = size + 'px'; }
  requestAnimationFrame(() => requestAnimationFrame(() => { const bar = wrap.querySelector('.bar'); bar.style.strokeDashoffset = String(c * (1 - Math.min(1, frac))); }));
  wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', `${Math.round(frac * 100)} peratus`);
  return wrap;
}

/* ---------- 8. Kuota ---------- */
let quotaTimer = null;
function loadQuota() {
  clearTimeout(quotaTimer);
  const kp = $('#quotaKpis'), cards = $('#quotaCards'), up = $('#quotaUpdated');
  $('#quotaRefresh').classList.add('is-busy');
  kp.replaceChildren(...['Jumlah berdaftar', 'Jumlah kuota', 'Baki tempat', 'Kadar isian'].map(t => el('div', { class: 'kpi' }, el('small', { text: t }), el('strong', { class: 'skel', text: '000' }))));
  cards.replaceChildren(...[1, 2].map(() => el('div', { class: 'qcard' }, el('div', { class: 'qcard-head' }, el('div', { class: 'skel', style: 'width:140px;height:30px' })), el('div', { class: 'skel', style: 'width:150px;height:150px;border-radius:50%' }), el('div', { class: 'skel', style: 'height:80px' }))));
  up.textContent = 'Sedang memuat data pendaftaran terkini…';
  const wait = S.quotaMode === 'loading' ? 1e9 : 900;
  quotaTimer = setTimeout(() => {
    $('#quotaRefresh').classList.remove('is-busy');
    if (S.quotaMode === 'error') {
      up.textContent = 'Data semasa tidak dapat dimuat. Maklumat kehadiran tetap disemak oleh sistem.';
      kp.replaceChildren(); cards.replaceChildren(el('div', { class: 'card', style: 'grid-column:1/-1' }, el('div', { class: 'empty-state' },
        el('div', { class: 'es-ic', html: I.wifi }), el('h3', { text: 'Data kuota tidak tersedia' }),
        el('p', { text: 'Sambungan ke papan kuota terganggu. Angka lama tidak dipaparkan supaya tiada maklumat yang mengelirukan.' }),
        el('button', { type: 'button', class: 'btn btn-primary', text: 'Cuba lagi', onclick: loadQuota }))));
      return;
    }
    const reg = QUOTA.reduce((a, q) => a + q.registered, 0), tot = QUOTA.reduce((a, q) => a + q.quota, 0);
    const vals = [[`Jumlah berdaftar`, reg, 'dua batch'], ['Jumlah kuota', tot, '80 setiap batch'], ['Baki tempat', tot - reg, 'Batch 1 sahaja'], ['Kadar isian', Math.round(reg / tot * 100), 'peratus', true]];
    kp.replaceChildren(...vals.map(([t, v, f, acc]) => { const s = el('strong', { text: '0' }); if (acc) s.dataset.suffix = '%'; const k = el('div', { class: 'kpi' + (acc ? ' accent' : '') }, el('small', { text: t }), s, el('div', { class: 'kpi-foot', text: acc ? 'daripada jumlah kuota' : f })); countUp(s, v); return k; }));
    cards.replaceChildren(...QUOTA.map(q => {
      const left = q.quota - q.registered, frac = q.registered / q.quota;
      const bar = el('span'); const qb = el('div', { class: 'qbar', 'aria-hidden': 'true' }, bar);
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = Math.min(100, frac * 100) + '%'; }));
      return el('article', { class: 'qcard' },
        el('div', { class: 'qcard-head' }, el('div', {}, el('h2', { text: 'Batch ' + q.batch }), el('p', { text: q.batch === 1 ? '28–29 November 2026' : '5–6 Disember 2026' })),
          el('span', { class: 'badge ' + (q.status === 'DIBUKA' ? 'ok' : q.status === 'PENUH' ? 'gold' : 'bad'), text: q.status })),
        ring(frac, 0, 12, Math.round(frac * 100) + '%', 'terisi'),
        el('div', { class: 'qnums' }, [['Berdaftar', q.registered], ['Kuota', q.quota], ['Baki', left]].map(([a, b]) => el('div', {}, el('small', { text: a }), el('strong', { text: String(b) })))),
        qb, el('p', { class: 'qnote', text: q.status === 'PENUH' ? 'Kuota penuh. Hubungi urusetia untuk senarai menunggu.' : `Masih ada ${left} tempat. Daftar melalui borang rasmi.` }));
    }));
    up.textContent = 'Dikemas kini: ' + fmtChip(now()) + ' (MYT) · data rekaan';
  }, wait);
}

/* ---------- 9. Check-in peserta ---------- */
function renderBanner() {
  const b = $('#sessionBanner'); let pub = null; try { pub = SERVER.publicStatus(); } catch (_) {}
  const s = todaySession(); let cls, icon, title, text;
  if (!pub) { cls = 'unknown'; icon = I.info; title = 'Status sesi belum dapat disemak'; text = 'Anda masih boleh tekan Sahkan kehadiran; pelayan akan menyemak tarikh dan maklumat.'; }
  else if (!s) { cls = 'off'; icon = I.cal; const n = SESSIONS.find(x => x.date > today()); title = 'Di luar tarikh program'; text = n ? `Check-in dibuka pada ${longDate(n.date)} (${n.label}).` : 'Program telah tamat. Terima kasih.'; }
  else if (!S.open[s.key]) { cls = 'wait'; icon = I.door; title = `Hari ini: ${s.label}`; text = 'Kaunter belum dibuka oleh urusetia.'; }
  else { cls = 'open'; icon = I.check; title = `Check-in dibuka · ${s.label}`; text = 'Sesi dipilih secara automatik mengikut tarikh hari ini.'; }
  b.className = 'session-banner ' + cls;
  b.replaceChildren(el('span', { class: 'sb-ic', html: icon }), el('div', {}, el('strong', { text: title }), el('span', { text: text })));
  $('#ciSubmit').disabled = S.submitting || Date.now() < S.cooldownUntil;
  renderDemoCodes();
}
const pin = $('[data-pin]'), pinIn = $('#ciPhone'), cells = $$('.pin-cell');
function drawPin() {
  const v = pinIn.value;
  cells.forEach((c, i) => { c.textContent = v[i] ? '•' : ''; c.classList.toggle('filled', !!v[i]); c.classList.toggle('next', i === v.length); });
}
pinIn.addEventListener('input', () => { pinIn.value = pinIn.value.replace(/\D/g, '').slice(0, 4); pin.classList.remove('invalid'); setErr('ciPhoneErr', ''); drawPin(); });
pinIn.addEventListener('focus', () => pin.classList.add('focus'));
pinIn.addEventListener('blur', () => pin.classList.remove('focus'));
$('#ciReceipt').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^R0-9]/g, '').slice(0, 5); e.target.removeAttribute('aria-invalid'); setErr('ciReceiptErr', ''); if (/^R\d{4}$/.test(e.target.value)) pinIn.focus(); });
function setErr(id, msg) { const e = $('#' + id); e.textContent = msg; e.hidden = !msg; }

function showInline(kind, opts = {}) {
  const host = $('#outcomeHost'), form = $('#checkinForm');
  if (!kind) { host.hidden = true; host.replaceChildren(); form.hidden = false; return; }
  form.hidden = true; host.hidden = false;
  host.replaceChildren(outcomeNode(kind, opts));
}
function outcomeNode(kind, o = {}) {
  const T = {
    PENDING: ['oc-pending', I.clock, 'Sedang diproses', 'Menyemak dan menyimpan…', 'Jangan tutup halaman atau tekan semula.'],
    VERIFY: ['oc-pending', I.refresh, 'Menyemak semula', 'Sambungan terganggu', 'Menyemak sama ada kehadiran sudah tersimpan. Semakan ini baca sahaja dan tidak menulis rekod baharu.'],
    SUCCESS: ['oc-success', I.check, 'Berjaya', 'Kehadiran direkod', 'Tunjukkan skrin ini kepada urusetia jika diminta.'],
    RECOVERED: ['oc-success', I.check, 'Berjaya', 'Disahkan tersimpan', 'Sambungan sempat terganggu, tetapi semakan semula mengesahkan kehadiran sudah direkod.'],
    ALREADY: ['oc-success', I.check, 'Sudah direkod', 'Kehadiran sudah ada', 'Tiada tindakan lanjut diperlukan. Tiada rekod berganda dibuat.'],
    FAILED: ['oc-failed', I.x, 'Gagal', 'Kehadiran belum direkod', o.msg || 'Maklumat tidak dapat disahkan.'],
    UNKNOWN: ['oc-unknown', I.q, 'Status tidak diketahui', 'Tidak dapat disahkan', 'Jangan hantar berulang kali. Sila rujuk urusetia di meja pendaftaran.'],
  }[kind];
  const n = el('div', { class: 'outcome ' + T[0] },
    el('div', { class: 'oc-icon', html: T[1] }), el('span', { class: 'oc-tag', text: T[2] }), el('h2', { text: T[3] }), el('p', { text: T[4] }));
  if (kind === 'PENDING' || kind === 'VERIFY') {
    const steps = kind === 'PENDING' ? [['Menghantar maklumat', 'active'], ['Pelayan mengesahkan tarikh & resit', ''], ['Menyimpan kehadiran', '']] : [['Permintaan asal dihantar sekali', 'done'], ['Semakan baca sahaja', 'active'], ['Keputusan muktamad', '']];
    n.append(el('ul', { class: 'oc-steps' }, steps.map(([t, c]) => el('li', { class: c, text: t }))));
  }
  if (['SUCCESS', 'RECOVERED', 'ALREADY'].includes(kind) && o.receipt) {
    n.append(el('div', { class: 'oc-ticket' }, el('dl', {}, el('dt', { text: 'Resit' }), el('dd', { class: 'mono', text: o.receipt }), el('dt', { text: 'Sesi' }), el('dd', { text: o.session ? o.session.label : '—' }), el('dt', { text: 'Masa' }), el('dd', { text: o.at ? fmtTime(o.at) + ' MYT' : '—' })),
      el('div', { class: 'oc-stamp' }, el('span', { text: kind === 'ALREADY' ? '✓ SUDAH DIREKOD' : '✓ DIREKOD' }), el('span', { text: o.at ? mytDay(o.at) : '' }))));
  }
  if (kind === 'UNKNOWN' && o.cooldown) {
    const C = 2 * Math.PI * 11;
    const cd = el('div', { class: 'cooldown' }); cd.innerHTML = `<svg viewBox="0 0 28 28" aria-hidden="true"><circle class="cd-track" cx="14" cy="14" r="11" fill="none"/><circle class="cd-bar" cx="14" cy="14" r="11" fill="none" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>`;
    const txt = el('span', {}); cd.append(txt); n.append(cd);
    const tick = () => { const left = Math.max(0, Math.ceil((S.cooldownUntil - Date.now()) / 1000)); txt.textContent = left ? `Butang dikunci ${left} saat untuk elak hantaran berganda` : 'Anda boleh cuba sekali lagi selepas urusetia menyemak.'; cd.querySelector('.cd-bar').style.strokeDashoffset = String(C * (1 - left / 30)); if (left && document.contains(cd)) setTimeout(tick, 1000); else { renderBanner(); if (again) again.disabled = false; } };
    var again; setTimeout(tick, 0);
  }
  if (o.actions !== false && ['SUCCESS', 'RECOVERED', 'ALREADY', 'FAILED', 'UNKNOWN'].includes(kind)) {
    const acts = el('div', { class: 'oc-actions' });
    if (kind === 'FAILED') acts.append(el('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block', text: 'Betulkan maklumat', onclick: () => { showInline(null); $('#ciReceipt').focus(); } }));
    else if (kind === 'UNKNOWN') { again = el('button', { type: 'button', class: 'btn btn-outline btn-lg btn-block', text: 'Kembali ke borang', disabled: Date.now() < S.cooldownUntil, onclick: () => { showInline(null); } }); acts.append(again); }
    else acts.append(el('button', { type: 'button', class: 'btn btn-outline btn-lg btn-block', text: 'Check-in peserta lain', onclick: () => { showInline(null); $('#ciReceipt').focus(); } }));
    n.append(acts);
  }
  if (kind === 'SUCCESS' && !reduceMotion && o.confetti) {
    const cf = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (let i = 0; i < 26; i++) { const c = el('i'); c.style.left = (i * 37 % 100) + '%'; c.style.background = ['#cfae6a', '#13775c', '#e3c98f', '#1c9070'][i % 4]; c.style.animationDelay = (i % 9) * 60 + 'ms'; cf.append(c); }
    n.append(cf);
  }
  return n;
}

$('#checkinForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (S.submitting || Date.now() < S.cooldownUntil) return;
  const rIn = $('#ciReceipt'), short = rIn.value.trim().toUpperCase(), last4 = pinIn.value;
  let bad = false;
  if (!/^R\d{4}$/.test(short)) { rIn.setAttribute('aria-invalid', 'true'); setErr('ciReceiptErr', 'Masukkan kod resit seperti R0049.'); bad = true; }
  if (!/^\d{4}$/.test(last4)) { pin.classList.add('invalid'); setErr('ciPhoneErr', 'Masukkan 4 digit terakhir telefon penjaga.'); bad = true; }
  if (bad) { const c = $('#checkinCard'); c.classList.remove('shake'); c.offsetWidth; c.classList.add('shake'); (rIn.getAttribute('aria-invalid') ? rIn : pinIn).focus(); return; }

  // Semakan awal pihak klien (status awam diketahui): amaran modal, TIADA permintaan dihantar.
  let pub = null; try { pub = SERVER.publicStatus(); } catch (_) {}
  const s = todaySession();
  if (pub && S.outcomeMode === 'auto') {
    if (!s) { await MODALS.outOfDate(); return; }
    if (!S.open[s.key]) { await MODALS.notOpen(s); return; }
  }
  const receipt = 'GS26_' + short;
  S.submitting = true; renderBanner(); showInline('PENDING');
  await sleep(1300);
  let result = null, kind = null, msg = '';
  const forced = S.outcomeMode;
  try {
    if (forced === 'SUCCESS') result = { already: false, session: s || SESSIONS[0] };
    else if (forced === 'ALREADY') result = { already: true, session: s || SESSIONS[0] };
    else if (forced === 'FAILED') throw new Error('Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.');
    else if (forced === 'RECOVERED' || forced === 'UNKNOWN') throw new Uncertain('forced');
    else result = SERVER.selfCheckin(receipt, last4); // SATU permintaan menulis, tidak pernah diulang automatik
    kind = result.already ? 'ALREADY' : 'SUCCESS';
  } catch (err) {
    if (!(err instanceof Uncertain)) { kind = 'FAILED'; msg = err.message; }
    else {
      showInline('VERIFY');
      await sleep(2600); // dalam production: 6 s + 5 s
      let rec = forced === 'RECOVERED' ? true : forced === 'UNKNOWN' ? null : SERVER.selfStatus(receipt);
      if (rec === true) { kind = 'RECOVERED'; result = { session: s || SESSIONS[0] }; }
      else if (rec === false) { kind = 'FAILED'; msg = 'Kehadiran BELUM direkod (disahkan oleh pelayan). Anda boleh tekan Sahkan kehadiran sekali lagi.'; }
      else { kind = 'UNKNOWN'; S.cooldownUntil = Date.now() + 30000; }
    }
  }
  S.submitting = false;
  const at = now(), sess = result && result.session;
  S.lastOutcome = { kind, receipt: short, session: sess, at };
  showInline(kind, { receipt: short, session: sess, at, msg, cooldown: kind === 'UNKNOWN', confetti: true });
  if (kind === 'SUCCESS' || kind === 'RECOVERED') { rIn.value = ''; pinIn.value = ''; drawPin(); }
  renderBanner(); renderHome();
  // Keputusan penting juga dipaparkan sebagai modal berpusat
  if (kind === 'SUCCESS' || kind === 'RECOVERED') MODALS.success(short, sess, at);
  else if (kind === 'ALREADY') MODALS.already(short, sess);
  else if (kind === 'FAILED') MODALS.failed(msg);
  else if (kind === 'UNKNOWN') MODALS.unknown();
});

/* ---------- 10. Urusetia ---------- */
$('#toggleKey').addEventListener('click', e => { const k = $('#staffKey'), show = k.type === 'password'; k.type = show ? 'text' : 'password'; e.currentTarget.setAttribute('aria-pressed', String(show)); e.currentTarget.setAttribute('aria-label', show ? 'Sembunyikan kunci' : 'Tunjukkan kunci'); });
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const k = $('#staffKey'), btn = $('#loginBtn');
  if (k.value.length < 8) { k.setAttribute('aria-invalid', 'true'); setErr('staffKeyErr', 'Kunci urusetia perlu sekurang-kurangnya 8 aksara.'); k.focus(); return; }
  k.removeAttribute('aria-invalid'); setErr('staffKeyErr', '');
  btn.classList.add('is-busy'); btn.disabled = true; await sleep(800); btn.classList.remove('is-busy'); btn.disabled = false;
  k.value = ''; S.token = 'demo-' + Math.random().toString(36).slice(2); S.staffSession = '';
  renderStaff(); toast('Log masuk berjaya. Selamat bertugas.');
});
$('#logoutBtn').addEventListener('click', () => { S.token = ''; renderStaff(); toast('Anda telah log keluar.'); });

// Kunci progresif: sesi masa depan kelihatan tetapi dikunci; sesi lampau baca sahaja.
function defaultStaffSession() {
  const t = todaySession(); if (t) return t.key;
  const past = SESSIONS.filter(s => s.date < today()); return past.length ? past[past.length - 1].key : '';
}
function renderStaff() {
  const logged = !!S.token;
  $('#staffLogin').hidden = logged; $('#staffDash').hidden = !logged;
  if (!logged) return;
  const avail = SESSIONS.filter(s => sessionState(s) !== 'future').map(s => s.key);
  if (!avail.includes(S.staffSession)) S.staffSession = defaultStaffSession();
  const seg = $('#sessionSeg'); seg.replaceChildren();
  for (const s of SESSIONS) {
    const st = sessionState(s), sel = s.key === S.staffSession;
    const b = el('button', { type: 'button', role: 'tab', 'aria-selected': String(sel), disabled: st === 'future',
      'aria-label': `${s.label}, ${longDate(s.date)}${st === 'future' ? ', dikunci sehingga tarikh sesi' : st === 'past' ? ', selesai, baca sahaja' : ', hari ini'}`,
      title: st === 'future' ? `Dikunci sehingga ${longDate(s.date)}` : null,
      onclick: () => { S.staffSession = s.key; renderStaff(); } },
      el('strong', { text: s.label }), el('span', { text: `${s.dow}, ${s.short}` }),
      st === 'future' ? el('span', { class: 'seg-lock', html: I.lock }) : st === 'today' ? el('span', { class: 'today-dot', text: 'HARI INI' }) : el('span', { class: 'past-dot', text: 'SELESAI' }));
    seg.append(b);
  }
  const s = SESSIONS.find(x => x.key === S.staffSession);
  const cc = $('#controlCard'); cc.replaceChildren();
  if (!s) {
    const first = SESSIONS[0];
    cc.append(el('div', { class: 'empty-state', style: 'width:100%' }, el('div', { class: 'es-ic', html: I.lock }), el('h3', { text: 'Belum ada sesi tersedia' }),
      el('p', { text: `Semua sesi masih dikunci. Sesi pertama, ${first.label}, dibuka secara automatik pada ${longDate(first.date)} (waktu Malaysia).` })));
    $('#staffKpis').replaceChildren(); $('#rosterList').replaceChildren(); $('#activityFeed').replaceChildren(el('li', { class: 'help', text: 'Tiada aktiviti.' }));
    $('#rosterSearch').disabled = true; return;
  }
  $('#rosterSearch').disabled = false;
  const st = sessionState(s), open = S.open[s.key];
  if (st === 'today') {
    const sw = el('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(open), onclick: toggleOpen },
      el('span', { class: 'knob' }), el('span', { text: open ? 'Check-in dibuka' : 'Check-in ditutup' }));
    cc.append(el('div', { class: 'cc-state' }, el('div', { class: 'cc-orb ' + (open ? 'on' : 'off'), html: open ? I.unlock : I.lock }),
      el('div', {}, el('h2', { text: open ? 'Kaunter dibuka' : 'Kaunter ditutup' }), el('p', { text: `${s.label} · ${longDate(s.date)} · hari ini` }))), sw);
  } else {
    cc.append(el('div', { class: 'cc-state' }, el('div', { class: 'cc-orb lock', html: I.eye }),
      el('div', {}, el('h2', { text: 'Sesi lampau · baca sahaja' }), el('p', {}, `${s.label} · ${longDate(s.date)}. `, el('button', { type: 'button', class: 'link-btn', text: 'Kenapa dikunci?', onclick: () => MODALS.pastReadOnly(s) })))),
      el('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': 'false', disabled: true, 'aria-label': 'Buka check-in, dikunci untuk sesi lampau' }, el('span', { class: 'knob' }), el('span', { text: 'Dikunci' })));
  }
  const people = S.roster.filter(p => p.batch === s.batch), att = S.att[s.key];
  const present = people.filter(p => att.has(p.receipt)).length, total = people.length, pct = total ? Math.round(present / total * 100) : 0;
  const kp = $('#staffKpis');
  if (!kp.children.length || kp.dataset.key !== s.key) {
    kp.dataset.key = s.key;
    kp.replaceChildren(...[['Berdaftar', 'batch ' + s.batch], ['Hadir', ''], ['Belum hadir', ''], ['Kadar kehadiran', '']].map(([t, f], i) => el('div', { class: 'kpi' + (i === 3 ? ' accent' : '') }, el('small', { text: t }), el('strong', { text: '0' }), i === 3 ? el('div', { class: 'progress' }, el('span')) : el('div', { class: 'kpi-foot', text: f }))));
  }
  const ks = kp.querySelectorAll('strong'); countUp(ks[0], total); countUp(ks[1], present); countUp(ks[2], total - present); ks[3].textContent = pct + '%';
  kp.querySelector('.progress span').style.width = pct + '%';
  kp.children[1].querySelector('.kpi-foot').textContent = st === 'today' ? 'dikemas kini langsung' : 'rekod akhir';
  $$('#filterChips .chip').forEach(c => {
    const n = c.dataset.filter === 'all' ? total : c.dataset.filter === 'present' ? present : total - present;
    c.replaceChildren(c.dataset.filter === 'all' ? 'Semua' : c.dataset.filter === 'present' ? 'Hadir' : 'Belum hadir', el('span', { class: 'n', text: String(n) }));
    c.setAttribute('aria-checked', String(c.dataset.filter === S.filter));
  });
  renderRoster(); renderFeed();
}
function renderRoster(flashReceipt) {
  const s = SESSIONS.find(x => x.key === S.staffSession); if (!s) return;
  const st = sessionState(s), open = S.open[s.key], att = S.att[s.key], q = S.query.trim().toLowerCase();
  let list = S.roster.filter(p => p.batch === s.batch).filter(p => (p.name + ' ' + p.short).toLowerCase().includes(q));
  if (S.filter === 'present') list = list.filter(p => att.has(p.receipt)); else if (S.filter === 'absent') list = list.filter(p => !att.has(p.receipt));
  list.sort((a, b) => (att.has(a.receipt) - att.has(b.receipt)) || a.short.localeCompare(b.short));
  const ul = $('#rosterList'); ul.replaceChildren();
  if (st === 'past') ul.append(el('li', { class: 'readonly-bar', html: I.eye + '<span>Sesi lampau: senarai untuk semakan sahaja. Penandaan hadir dikunci.</span>' }));
  else if (!open) ul.append(el('li', { class: 'readonly-bar', html: I.lock + '<span>Buka check-in dahulu untuk menanda kehadiran secara manual.</span>' }));
  if (!list.length) { ul.append(el('li', { class: 'empty-state' }, el('div', { class: 'es-ic', html: I.search }), el('h3', { text: 'Tiada peserta sepadan' }), el('p', { text: q ? `Tiada nama atau resit yang mengandungi “${S.query}”. Semak ejaan atau cuba nombor resit.` : 'Tiada peserta dalam tapisan ini.' }))); return; }
  for (const p of list) {
    const a = att.get(p.receipt), initials = p.name.split(' ').filter(w => !/^(bin|binti)$/.test(w)).slice(0, 2).map(w => w[0]).join('');
    let right;
    if (a) right = el('span', { class: 'badge ok', text: `Hadir · ${fmtTime(a.at)} · ${a.method === 'QR' ? 'QR' : 'Manual'}` });
    else if (st === 'past') right = el('span', { class: 'badge mute', text: 'Tidak hadir' });
    else right = el('button', { type: 'button', class: 'btn btn-soft btn-sm', disabled: !open, text: 'Tanda hadir', onclick: e => markPresent(p, e.currentTarget) });
    ul.append(el('li', { class: 'person' + (a ? ' is-present' : '') + (p.receipt === flashReceipt ? ' flash' : '') },
      el('span', { class: 'avatar', 'aria-hidden': 'true', text: initials }),
      el('div', { class: 'person-info' }, el('strong', { text: p.name }), el('small', { class: 'mono', text: p.receipt })), right));
  }
}
function renderFeed() {
  const s = SESSIONS.find(x => x.key === S.staffSession), f = $('#activityFeed'); f.replaceChildren(); if (!s) return;
  const items = [...S.events[s.key].map(e => ({ ...e })), ...[...S.att[s.key]].map(([r, a]) => ({ at: a.at, kind: a.method === 'QR' ? 'qr' : 'manual', text: (S.roster.find(p => p.receipt === r) || {}).name, by: a.method === 'QR' ? 'Imbasan QR' : a.by }))]
    .sort((a, b) => b.at - a.at).slice(0, 7);
  if (!items.length) { f.append(el('li', { class: 'help', text: 'Tiada aktiviti lagi untuk sesi ini.' })); return; }
  for (const it of items) f.append(el('li', {}, el('span', { class: 'fdot ' + (it.kind === 'manual' ? 'manual' : it.kind === 'sys' ? 'sys' : '') }),
    el('div', {}, el('b', { text: it.text }), el('span', { class: 'fmeta', text: it.kind === 'sys' ? 'oleh ' + it.by : it.by })), el('time', { text: fmtTime(it.at) })));
}
async function staffCall(fn) {
  try { return { ok: true, v: fn() }; }
  catch (err) {
    if (err.expired) { await MODALS.expired(); S.token = ''; renderStaff(); return { ok: false }; }
    if (err instanceof Uncertain) { const r = await MODALS.connection(); if (r === 'refresh') { renderStaff(); toast('Senarai dimuat semula. Semak status sebelum cuba lagi.'); } return { ok: false }; }
    await modal({ tone: 'bad', icon: 'x', tag: 'Ditolak', title: 'Tindakan tidak dibenarkan', body: [err.message], actions: [{ label: 'Tutup', value: 'ok', kind: 'primary' }] });
    return { ok: false };
  }
}
async function toggleOpen() {
  const s = SESSIONS.find(x => x.key === S.staffSession); if (!s) return;
  if (sessionState(s) !== 'today') { MODALS.pastReadOnly(s); return; }
  const next = !S.open[s.key];
  if (await MODALS.confirmToggle(s, next) !== 'ok') return;
  await sleep(500);
  const r = await staffCall(() => SERVER.staffSetOpen(s.key, next));
  if (!r.ok) return;
  S.events[s.key].push({ at: now(), kind: 'sys', text: next ? 'Check-in dibuka' : 'Check-in ditutup', by: $('#operatorName').value || 'Urusetia' });
  renderStaff(); renderHome(); toast(next ? 'Check-in dibuka untuk ' + s.short : 'Check-in ditutup untuk ' + s.short);
}
async function markPresent(p, btn) {
  const s = SESSIONS.find(x => x.key === S.staffSession);
  if (sessionState(s) !== 'today') { MODALS.pastReadOnly(s); return; }
  const op = $('#operatorName').value.trim();
  if (await MODALS.confirmAttend(p, s, op) !== 'ok') return;
  btn.classList.add('is-busy'); btn.disabled = true;
  await sleep(700);
  const r = await staffCall(() => SERVER.staffCheckin(s.key, p.receipt, op)); // satu permintaan; tiada cubaan semula automatik
  if (!r.ok) { if (document.contains(btn)) { btn.classList.remove('is-busy'); btn.disabled = false; } return; }
  renderStaff(); renderRoster(p.receipt);
  toast(r.v.already ? `${p.name} sudah direkod.` : `${p.name} ditanda HADIR.`);
}
$$('#filterChips .chip').forEach(c => c.addEventListener('click', () => { S.filter = c.dataset.filter; renderStaff(); }));
let deb; $('#rosterSearch').addEventListener('input', e => { clearTimeout(deb); deb = setTimeout(() => { S.query = e.target.value; renderRoster(); }, 180); });

/* ---------- 11. Galeri keadaan ---------- */
function renderGallery() {
  const g = $('#stateGallery'); g.replaceChildren();
  const s = todaySession() || SESSIONS[0], at = now();
  const spec = (node, title, when) => el('div', { class: 'specimen' }, el('div', { class: 'specimen-body' }, node), el('div', { class: 'specimen-foot' }, el('b', { text: title }), when));
  const group = (title, desc, items) => el('section', { class: 'gallery-group' }, el('h2', { text: title }), el('p', { text: desc }), el('div', { class: 'gallery' }, items));
  g.append(group('Modal premium', 'Menggantikan semua confirm() pelayar dan amaran di bawah halaman. Tekan untuk melihat animasi 3D, kawalan papan kekunci (Tab, Esc) dan paparan mudah alih.',
    [el('div', { class: 'modal-launchers', style: 'grid-column:1/-1' }, [
      ['Di luar tarikh program', 'm-tone-warn', () => MODALS.outOfDate()],
      ['Sahkan kehadiran peserta', 'm-tone-accent', () => MODALS.confirmAttend(S.roster[0], s, 'Urusetia Meja 1')],
      ['Buka check-in', 'm-tone-ok', () => MODALS.confirmToggle(s, true)],
      ['Tutup check-in', 'm-tone-bad', () => MODALS.confirmToggle(s, false)],
      ['Check-in berjaya', 'm-tone-ok', () => MODALS.success('R9001', s, at)],
      ['Sudah direkod', 'm-tone-ok', () => MODALS.already('R9002', s)],
      ['Gagal', 'm-tone-bad', () => MODALS.failed('Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.')],
      ['Status tidak diketahui', 'm-tone-warn', () => MODALS.unknown()],
      ['Ralat sambungan (urusetia)', 'm-tone-warn', () => MODALS.connection()],
      ['Sesi log masuk tamat', 'm-tone-info', () => MODALS.expired()],
      ['Sesi lampau baca sahaja', 'm-tone-info', () => MODALS.pastReadOnly(SESSIONS[0])],
    ].map(([t, tone, fn]) => el('button', { type: 'button', class: 'btn btn-outline ' + tone, onclick: fn }, el('span', { class: 'ml-dot' }), t)))]));
  g.append(group('Check-in peserta', 'Tiga keputusan muktamad sahaja: BERJAYA (pelayan sahkan), GAGAL (pelayan tolak, tiada rekod), TIDAK DIKETAHUI (tiada jawapan yang boleh dipercayai).', [
    spec(outcomeNode('PENDING', { actions: false }), 'Memuat', 'Satu permintaan dihantar; butang dikunci sepanjang proses.'),
    spec(outcomeNode('VERIFY', { actions: false }), 'Menyemak semula', 'Sambungan terputus. Semakan baca sahaja, tiada tulis semula.'),
    spec(outcomeNode('SUCCESS', { actions: false, receipt: 'R9001', session: s, at }), 'Berjaya', 'Pelayan membalas ok:true dan rekod baharu ditulis.'),
    spec(outcomeNode('ALREADY', { actions: false, receipt: 'R9002', session: s, at }), 'Sudah direkod', 'Pelayan membalas ok:true, already:true. Tiada baris tambahan.'),
    spec(outcomeNode('FAILED', { actions: false, msg: 'Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.' }), 'Gagal', 'Pelayan membalas ok:false. Tiada rekod dibuat.'),
    spec(outcomeNode('UNKNOWN', { actions: false }), 'Tidak diketahui', 'Tiada jawapan sah selepas semakan semula. Butang dikunci 30 saat.'),
  ]));
  const banner = (cls, icon, t, x) => el('div', { class: 'session-banner ' + cls, style: 'margin:0' }, el('span', { class: 'sb-ic', html: icon }), el('div', {}, el('strong', { text: t }), el('span', { text: x })));
  g.append(group('Status sesi awam', 'Sepanduk di atas borang check-in. Sesi dipilih oleh pelayan mengikut tarikh Malaysia.', [
    spec(banner('open', I.check, 'Check-in dibuka · Batch 1 · Hari 1', 'Sesi dipilih secara automatik mengikut tarikh hari ini.'), 'Dibuka', 'Hari program dan urusetia telah membuka kaunter.'),
    spec(banner('wait', I.door, 'Hari ini: Batch 1 · Hari 1', 'Kaunter belum dibuka oleh urusetia.'), 'Belum dibuka', 'Hari program, kaunter masih ditutup.'),
    spec(banner('off', I.cal, 'Di luar tarikh program', 'Check-in dibuka pada 28 November 2026 (Batch 1 · Hari 1).'), 'Di luar tarikh', 'Bukan tarikh sesi. Tekan Sahkan memaparkan modal amaran, tiada permintaan dihantar.'),
    spec(banner('unknown', I.info, 'Status sesi belum dapat disemak', 'Anda masih boleh tekan Sahkan kehadiran; pelayan akan menyemak.'), 'Status tidak dapat disemak', 'Rangkaian gagal membaca status. Pelayan tetap menjadi penentu.'),
  ]));
  const segDemo = el('div', { class: 'seg', style: 'grid-template-columns:1fr;box-shadow:none' },
    el('button', { type: 'button', role: 'tab', 'aria-selected': 'false' }, el('strong', { text: 'Batch 1 · Hari 1' }), el('span', { text: 'Sab, 28 Nov' }), el('span', { class: 'past-dot', text: 'SELESAI' })),
    el('button', { type: 'button', role: 'tab', 'aria-selected': 'true' }, el('strong', { text: 'Batch 1 · Hari 2' }), el('span', { text: 'Ahd, 29 Nov' }), el('span', { class: 'today-dot', text: 'HARI INI' })),
    el('button', { type: 'button', role: 'tab', 'aria-selected': 'false', disabled: true }, el('strong', { text: 'Batch 2 · Hari 1' }), el('span', { text: 'Sab, 5 Dis' }), el('span', { class: 'seg-lock', html: I.lock })));
  g.append(group('Urusetia', 'Kunci progresif mengikut tarikh Malaysia, keadaan kosong dan kawalan dikunci.', [
    spec(segDemo, 'Pemilih sesi progresif', 'Contoh pada 29 Nov: b1d1 baca sahaja, b1d2 hari ini (dipilih automatik), b2d1/b2d2 kelabu dengan ikon kunci.'),
    spec(el('div', { class: 'empty-state' }, el('div', { class: 'es-ic', html: I.search }), el('h3', { text: 'Tiada peserta sepadan' }), el('p', { text: 'Semak ejaan atau cuba nombor resit.' })), 'Carian kosong', 'Carian tidak menjumpai nama atau resit.'),
    spec(el('div', { class: 'empty-state' }, el('div', { class: 'es-ic', html: I.lock }), el('h3', { text: 'Belum ada sesi tersedia' }), el('p', { text: 'Sesi pertama dibuka secara automatik pada 28 November 2026.' })), 'Sebelum program', 'Semua sesi masih dikunci (contoh: 27 Nov).'),
  ]));
  g.append(group('Papan kuota', 'Memuat dengan rangka (skeleton) dan ralat tanpa memaparkan angka lama.', [
    spec(el('div', { class: 'stack-md' }, el('div', { class: 'skel', style: 'height:28px;width:60%' }), el('div', { class: 'skel', style: 'height:110px;border-radius:50%;width:110px;margin:auto' }), el('div', { class: 'skel', style: 'height:60px' })), 'Memuat', 'Rangka bergerak sementara menunggu data.'),
    spec(el('div', { class: 'empty-state' }, el('div', { class: 'es-ic', html: I.wifi }), el('h3', { text: 'Data kuota tidak tersedia' }), el('p', { text: 'Angka lama tidak dipaparkan supaya tidak mengelirukan.' })), 'Ralat', 'Sambungan papan kuota gagal; butang Cuba lagi tersedia.'),
  ]));
}

/* ---------- 12. Panel demo, toast, jam ---------- */
function openDemo() { $('#demoDrawer').hidden = false; $('#demoScrim').hidden = false; $('#demoClose').focus(); }
function closeDemo() { $('#demoDrawer').hidden = true; $('#demoScrim').hidden = true; }
$$('[data-open-demo]').forEach(b => b.addEventListener('click', openDemo));
$('#demoClose').addEventListener('click', closeDemo); $('#demoScrim').addEventListener('click', closeDemo);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#demoDrawer').hidden && !M.dlg.open) closeDemo(); });
const dSel = $('#demoDate'); SCENARIOS.forEach(([v, t]) => dSel.append(el('option', { value: v, text: t }))); dSel.value = SCENARIOS[1][0];
function applyScenario() { S.baseSim = new Date(dSel.value + ':00+08:00').getTime(); S.baseReal = Date.now(); S.staffSession = ''; S.cooldownUntil = 0; seed(); showInline(null); refreshAll(); }
dSel.addEventListener('change', () => { applyScenario(); toast('Tarikh simulasi: ' + dSel.selectedOptions[0].text); });
$('#demoQuota').addEventListener('change', e => { S.quotaMode = e.target.value; if (!$('[data-view="kuota"]').hidden) loadQuota(); });
$('#demoPublic').addEventListener('change', e => { S.publicMode = e.target.value; refreshAll(); });
$('#demoOutcome').addEventListener('change', e => { S.outcomeMode = e.target.value; });
$('#demoStaff').addEventListener('change', e => { S.staffMode = e.target.value; });
$('#demoTheme').addEventListener('change', e => { const v = e.target.value; if (v === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', v); try { localStorage.setItem('gs26v2-theme', v); } catch (_) {} });
try { const t = localStorage.getItem('gs26v2-theme'); if (t && t !== 'auto') { document.documentElement.setAttribute('data-theme', t); $('#demoTheme').value = t; } } catch (_) {}
$('#demoReset').addEventListener('click', () => { S.roster = makeRoster(); applyScenario(); toast('Data rekaan diset semula.'); });
function renderDemoCodes() {
  const s = todaySession(), b = s ? s.batch : 1, base = b === 1 ? 9000 : 9030, other = b === 1 ? 9031 : 9001;
  $('#demoCodesNote').textContent = `(untuk Batch ${b})`;
  $('#hintCode').textContent = 'R' + (base + 1);
  const rows = [['R' + (base + 1), '1234', 'Berjaya'], ['R' + (base + 2), '5678', 'Sudah direkod'], ['R' + (base + 1), '0000', 'Gagal (tidak sepadan)'], ['R' + (base + 13), '1313', 'Terputus → disahkan'], ['R' + (base + 14), '1414', 'Tidak diketahui'], ['R' + other, '1234', `Gagal (Batch ${3 - b})`]];
  $('#demoCodes').replaceChildren(...rows.map(r => el('tr', {}, el('td', { class: 'mono', text: r[0] }), el('td', { class: 'mono', text: r[1] }), el('td', { text: r[2] }))));
}
function toast(msg) {
  const t = el('div', { class: 'toast', role: 'status', html: I.sparkle }); t.append(el('span', { text: msg }));
  $('#toasts').append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
}
function tickClock() { $('#clockText').textContent = fmtChip(now()) + ' MYT'; }
function refreshAll() { tickClock(); renderHome(); renderBanner(); if (!$('[data-view="urusetia"]').hidden) renderStaff(); if (!$('[data-view="keadaan"]').hidden) renderGallery(); }
$('#quotaRefresh').addEventListener('click', loadQuota);

/* ---------- 13. Mula ---------- */
seed(); drawPin(); refreshAll(); route();
window.addEventListener('hashchange', route);
setInterval(() => { tickClock(); renderHome(); }, 30000);
})();
