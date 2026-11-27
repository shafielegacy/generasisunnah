/* Generasi Sunnah 2026 — Premium UI V2 (LIVE).
 * Frontend sahaja. Semua data datang daripada GAS V7 sedia ada (deployment /exec yang sama).
 * Kontrak API TIDAK diubah: gsPublicStatus, gsSelfCheckin, gsSelfCheckinStatus, gsStaffLogin,
 * gsStaffLogout, gsStaffSnapshot, gsStaffSetOpen, gsStaffCheckin, dan GET ?view=quota / ?view=quota-page.
 * Pelayan (GAS V7) kekal penentu tarikh, sesi, resit/telefon, LockService dan dedupe.
 * Tiada kata laluan, token atau data peserta disimpan dalam kod atau storan pelayar.
 */
(() => {
'use strict';

/* ---------- 0. Konfigurasi ---------- */
// URL awam Apps Script yang SAMA seperti production sebelum V2. Bukan rahsia.
const GS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycby5gwUQ3r-MTpGE3SHJCD4EkcnYc6AFLK-dGaRQ6-lzQhu97A2MMSzSWUwENNDxvBF4hQ/exec';
window.GS_WEBAPP_URL = GS_WEBAPP_URL;
const BASE = GS_WEBAPP_URL;
if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(BASE)) return;

/* ---------- 1. Utiliti ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const TZ = 'Asia/Kuala_Lumpur';
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v; // HANYA untuk ikon SVG statik di bawah, tidak pernah data pelayan
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
  userCheck: svg('<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 12.5-4.3M16 18l2 2 4-4"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>'),
  eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>'),
  auto: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
};
const fmtTime = d => new Intl.DateTimeFormat('ms-MY', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
const fmtChip = d => new Intl.DateTimeFormat('ms-MY', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
// Tarikh kalendar Malaysia, bukan zon waktu peranti. Hanya untuk paparan; pelayan tetap penentu.
const mytDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const MONTHS = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const longDate = iso => { const p = String(iso || '').split('-').map(Number); return p.length === 3 && p[1] >= 1 && p[1] <= 12 ? `${p[2]} ${MONTHS[p[1] - 1]} ${p[0]}` : ''; };
function countUp(node, to) {
  const from = Number(node.dataset.v || 0); node.dataset.v = to;
  const sfx = node.dataset.suffix || '';
  if (reduceMotion || from === to) { node.textContent = to + sfx; return; }
  const t0 = performance.now(), dur = 700;
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.textContent = Math.round(from + (to - from) * e) + sfx; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- 2. Jadual program (sama seperti GS_CFG_.sessions dalam gas/Code.gs) ---------- */
// Label, tarikh dan status "open" sebenar dibaca daripada gsPublicStatus; ini hanya meta paparan.
const SESSIONS = [
  { key: 'b1d1', batch: 1, day: 1, date: '2026-11-28', label: 'Batch 1 · Hari 1', short: '28 Nov', dow: 'Sab' },
  { key: 'b1d2', batch: 1, day: 2, date: '2026-11-29', label: 'Batch 1 · Hari 2', short: '29 Nov', dow: 'Ahd' },
  { key: 'b2d1', batch: 2, day: 1, date: '2026-12-05', label: 'Batch 2 · Hari 1', short: '5 Dis', dow: 'Sab' },
  { key: 'b2d2', batch: 2, day: 2, date: '2026-12-06', label: 'Batch 2 · Hari 2', short: '6 Dis', dow: 'Ahd' },
];
const SESSION_START = '08:00'; // hanya untuk kiraan detik paparan

/* ---------- 3. Keadaan ---------- */
const S = {
  pub: null, publicLoaded: false,
  quota: null, quotaLoaded: false,
  token: '', staffSession: '', snapshot: null, filter: 'all', query: '', staffBusy: false,
  submitting: false, cooldownUntil: 0,
};
// "Hari ini" mengikut pelayan jika status sudah dibaca; jika tidak, tarikh Malaysia daripada jam peranti (paparan sahaja).
const today = () => (S.publicLoaded && S.pub && S.pub.today) || mytDay(new Date());
const pubSession = key => (S.pub && Array.isArray(S.pub.sessions) ? S.pub.sessions.find(s => s.key === key) : null) || null;
const isOpen = key => !!(pubSession(key) && pubSession(key).open === true);
const todaySession = () => SESSIONS.find(s => s.date === today()) || null;
const sessionState = s => s.date === today() ? 'today' : s.date < today() ? 'past' : 'future';

/* ---------- 4. Pengangkutan: SATU permintaan CORS setiap tindakan, TIADA cubaan semula automatik ---------- */
class GsUncertain extends Error {}
async function api(action, ...args) {
  const body = JSON.stringify({ action, args });
  if (body.length > 4096) throw new Error('Permintaan terlalu panjang.');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let response, result;
  try {
    response = await fetch(BASE, { method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
      redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body, signal: ctrl.signal });
    const raw = await response.text();
    result = JSON.parse(raw);
  } catch (_) {
    // Rangkaian terputus, tamat masa atau jawapan bukan JSON: pelayan MUNGKIN telah memprosesnya.
    throw new GsUncertain('Sambungan terputus sebelum pengesahan diterima.');
  } finally { clearTimeout(timer); }
  if (!response.ok || !result || typeof result.ok !== 'boolean') throw new GsUncertain('Jawapan pelayan tidak sah.');
  if (result.ok !== true) {
    // Pelayan menyatakan penulisan MUNGKIN berlaku (gagal selepas appendRow) -> TIDAK DIKETAHUI, bukan GAGAL.
    if (result.uncertain === true) throw new GsUncertain(String(result.error || 'Status penulisan tidak pasti.'));
    throw new Error(String(result.error || 'Permintaan ditolak.'));
  }
  return result.data;
}

/* ---------- 5. Sistem modal premium ---------- */
const M = { dlg: $('#gsModal'), resolve: null, opener: null };
function modal(o) {
  const d = M.dlg;
  if (d.open) closeModal('replaced', true);
  M.opener = document.activeElement;
  $('#mCard').className = 'modal-card m-tone-' + (o.tone || 'accent');
  const medal = $('#mMedal'); medal.className = 'm-medal' + (o.draw ? ' draw' : ''); medal.innerHTML = I[o.icon || 'info'];
  $('#mTag').textContent = o.tag || ''; $('#mTag').hidden = !o.tag;
  $('#mTitle').textContent = o.title || '';
  $('#mBody').replaceChildren(...[].concat(o.body || []).map(x => typeof x === 'string' ? el('p', { text: x }) : x));
  const extra = $('#mExtra'); extra.replaceChildren();
  if (o.details) extra.append(el('dl', { class: 'm-details' }, o.details.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])));
  if (o.note) extra.append(el('div', { class: 'm-note ' + (o.noteTone || '') }, o.note));
  const acts = $('#mActions'); acts.replaceChildren();
  const btns = o.actions || [{ label: 'Faham', value: 'ok', kind: 'primary' }];
  acts.className = 'modal-actions' + (btns.length === 1 ? ' single' : '');
  let focusBtn = null;
  for (const b of btns) {
    const btn = el('button', { type: 'button', class: 'btn btn-' + (b.kind || 'outline'), text: b.label, 'data-value': b.value, onclick: () => closeModal(b.value) });
    acts.append(btn);
    if (!focusBtn && o.safeFocus && b.value === 'cancel') focusBtn = btn;
  }
  d.dataset.dismiss = o.dismissible === false ? 'no' : 'yes';
  d.dataset.kind = o.kind || '';
  if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  (focusBtn || acts.lastElementChild).focus();
  return new Promise(r => { M.resolve = r; });
}
function closeModal(value, instant) {
  const d = M.dlg; if (!d.open) return;
  const done = () => { d.classList.remove('closing'); d.close(); const r = M.resolve; M.resolve = null; if (r) r(value); if (M.opener && document.contains(M.opener) && M.opener.focus) M.opener.focus({ preventScroll: true }); };
  if (instant || reduceMotion) return done();
  d.classList.add('closing'); setTimeout(done, 200);
}
M.dlg.addEventListener('cancel', e => { e.preventDefault(); if (M.dlg.dataset.dismiss !== 'no') closeModal('cancel'); });
M.dlg.addEventListener('click', e => { if (e.target === M.dlg && M.dlg.dataset.dismiss !== 'no') closeModal('cancel'); });

const MODALS = {
  outOfDate: () => {
    const next = SESSIONS.find(s => s.date > today());
    return modal({ kind: 'outOfDate', tone: 'warn', icon: 'cal', tag: 'Di luar tarikh program', title: 'Check-in belum dibenarkan hari ini',
      body: ['Kehadiran hanya boleh direkod pada tarikh sesi yang sebenar. Tiada maklumat dihantar.'],
      details: next ? [['Sesi seterusnya', next.label], ['Tarikh', longDate(next.date)]] : [['Status', 'Program telah tamat']] });
  },
  notOpen: s => modal({ kind: 'notOpen', tone: 'info', icon: 'door', tag: 'Kaunter belum dibuka', title: 'Sila tunggu sebentar',
    body: [`Urusetia belum membuka check-in untuk ${s ? s.label : 'sesi hari ini'}. Cuba semula selepas pengumuman di kaunter. Tiada maklumat dihantar.`],
    actions: [{ label: 'Baik', value: 'ok', kind: 'primary' }] }),
  success: (receipt, label, at, recovered) => modal({ kind: 'success', tone: 'ok', icon: 'check', draw: true, tag: 'Berjaya', title: recovered ? 'Disahkan tersimpan' : 'Kehadiran direkod',
    body: [recovered ? 'Sambungan sempat terganggu, tetapi semakan semula mengesahkan kehadiran sudah direkod.' : 'Terima kasih. Tunjukkan skrin ini kepada urusetia jika diminta.'],
    details: [['Resit', receipt], ['Sesi', label], ['Masa', fmtTime(at) + ' MYT']],
    actions: [{ label: 'Selesai', value: 'ok', kind: 'primary' }] }),
  already: (receipt, label) => modal({ kind: 'already', tone: 'ok', icon: 'userCheck', tag: 'Sudah direkod', title: 'Kehadiran sudah ada',
    body: ['Kehadiran ini sudah direkod untuk sesi hari ini. Tiada tindakan lanjut diperlukan, dan tiada rekod berganda dibuat.'],
    details: [['Resit', receipt], ['Sesi', label]],
    actions: [{ label: 'Selesai', value: 'ok', kind: 'primary' }] }),
  failed: msg => modal({ kind: 'failed', tone: 'bad', icon: 'x', tag: 'Gagal', title: 'Kehadiran belum direkod',
    body: [msg], note: 'Tiada rekod dibuat. Semak maklumat dan cuba sekali lagi, atau rujuk urusetia.', noteTone: 'bad',
    actions: [{ label: 'Betulkan maklumat', value: 'ok', kind: 'primary' }] }),
  unknown: () => modal({ kind: 'unknown', tone: 'warn', icon: 'q', tag: 'Status tidak diketahui', title: 'Kami tidak pasti sama ada ia tersimpan',
    body: ['Sambungan terputus dan semakan semula juga tidak berjaya. Kehadiran mungkin sudah, atau belum, direkod.'],
    note: el('span', {}, el('b', { text: 'Jangan hantar berulang kali. ' }), 'Tunjukkan skrin ini kepada urusetia di meja pendaftaran untuk semakan senarai.'),
    actions: [{ label: 'Faham, rujuk urusetia', value: 'ok', kind: 'primary' }], dismissible: false }),
  connection: () => modal({ kind: 'connection', tone: 'warn', icon: 'wifi', tag: 'Ralat sambungan', title: 'Status tindakan tidak pasti',
    body: ['Jawapan pelayan tidak diterima. Tindakan mungkin sudah berlaku. Sistem tidak akan mencuba semula secara automatik.'],
    note: 'Tekan Muat semula senarai dan semak status peserta dahulu sebelum mencuba lagi.',
    actions: [{ label: 'Tutup', value: 'cancel', kind: 'outline' }, { label: 'Muat semula senarai', value: 'refresh', kind: 'primary' }] }),
  expired: () => modal({ kind: 'expired', tone: 'info', icon: 'clock', tag: 'Sesi tamat', title: 'Sila log masuk semula',
    body: ['Sesi log masuk urusetia telah tamat untuk keselamatan. Log masuk semula dan semak senarai sebelum mengulangi tindakan terakhir.'],
    actions: [{ label: 'Log masuk semula', value: 'ok', kind: 'primary' }], dismissible: false }),
  rejected: msg => modal({ kind: 'rejected', tone: 'bad', icon: 'x', tag: 'Ditolak', title: 'Tindakan tidak dibenarkan', body: [msg],
    note: 'Pelayan menolak permintaan ini. Tiada perubahan dibuat.', noteTone: 'bad', actions: [{ label: 'Tutup', value: 'ok', kind: 'primary' }] }),
  confirmAttend: (p, s, op) => modal({ kind: 'confirmAttend', tone: 'accent', icon: 'userCheck', tag: 'Sahkan kehadiran', title: 'Tandakan HADIR?', safeFocus: true,
    body: ['Pastikan peserta berada di hadapan anda sebelum menekan Tanda hadir.'],
    details: [['Nama', p.name], ['Resit', p.receipt], ['Sesi', s.label], ['Petugas', op || '—']],
    actions: [{ label: 'Batal', value: 'cancel', kind: 'outline' }, { label: 'Tanda hadir', value: 'ok', kind: 'primary' }] }),
  confirmToggle: (s, next) => modal({ kind: 'confirmToggle', tone: next ? 'ok' : 'bad', icon: next ? 'unlock' : 'lock', tag: next ? 'Buka check-in' : 'Tutup check-in', safeFocus: true,
    title: next ? `Buka check-in ${s.short}?` : `Tutup check-in ${s.short}?`,
    body: [next ? 'Penjaga boleh mula mengesahkan kehadiran melalui QR poster sebaik sahaja dibuka.' : 'Penjaga tidak lagi boleh check-in sendiri. Rekod sedia ada tidak terjejas.'],
    details: [['Sesi', s.label], ['Tarikh', longDate(s.date)]],
    actions: [{ label: 'Batal', value: 'cancel', kind: 'outline' }, { label: next ? 'Ya, buka' : 'Ya, tutup', value: 'ok', kind: next ? 'primary' : 'danger' }] }),
  pastReadOnly: s => modal({ kind: 'pastReadOnly', tone: 'info', icon: 'eye', tag: 'Baca sahaja', title: 'Sesi lampau dikunci',
    body: [`${s.label} (${longDate(s.date)}) boleh disemak untuk rujukan sahaja.`],
    note: 'Rekod kehadiran baharu dan membuka check-in tidak dibenarkan untuk tarikh lampau. Pelayan GAS V7 juga menolak penulisan di luar tarikh.', noteTone: 'info' }),
};

/* ---------- 6. Routing ---------- */
const VIEWS = ['utama', 'kuota', 'checkin', 'urusetia', 'keadaan'];
let currentView = 'utama';
function route() {
  let v = (location.hash.match(/^#\/(\w+)/) || [])[1];
  if (!v && new URLSearchParams(location.search).get('mode') === 'urusetia') v = 'urusetia'; // pautan lama ?mode=urusetia
  const view = VIEWS.includes(v) ? v : 'utama';
  currentView = view;
  $$('.view').forEach(s => { const on = s.dataset.view === view; if (on && s.hidden) { s.hidden = false; s.style.animation = 'none'; void s.offsetHeight; s.style.animation = ''; } else if (!on) s.hidden = true; });
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (view === 'kuota') renderQuota();
  if (view === 'urusetia') { renderStaff(); if (S.token && S.snapshot) refreshStaff(); }
  if (view === 'keadaan') renderGallery();
  if (view === 'checkin') renderBanner();
  window.scrollTo(0, 0);
}

/* ---------- 7. Status awam (gsPublicStatus) ---------- */
async function refreshPublic() {
  try {
    const d = await api('gsPublicStatus');
    if (!d || !Array.isArray(d.sessions) || !/^\d{4}-\d{2}-\d{2}$/.test(d.today || '')) throw new Error('Status sesi tidak sah.');
    S.pub = d; S.publicLoaded = true;
  } catch (_) { S.publicLoaded = false; S.pub = null; }
  renderHome(); renderBanner();
  if (currentView === 'urusetia' && S.token && !S.snapshot) renderStaff();
}

/* ---------- 8. Utama ---------- */
function renderHome() {
  const s = todaySession(), t = today();
  const dot = $('#heroDot'), cd = $('#heroCountdown');
  dot.className = 'live-dot'; cd.hidden = true;
  let label, sub;
  if (!S.publicLoaded) { label = 'Status sesi belum dapat disemak'; sub = 'Anda masih boleh cuba check-in; pelayan akan menyemak tarikh dan maklumat.'; }
  else if (s && isOpen(s.key)) { dot.classList.add('on'); label = `Check-in dibuka · ${s.label}`; sub = `Hari ini, ${longDate(s.date)}. Imbas QR atau tekan Sahkan kehadiran.`; }
  else if (s) { dot.classList.add('wait'); label = `Hari ini: ${s.label}`; sub = 'Kaunter belum dibuka oleh urusetia. Sila tunggu pengumuman.'; }
  else {
    const next = SESSIONS.find(x => x.date > t);
    if (next) {
      dot.classList.add('wait'); label = `Seterusnya: ${next.label}`; sub = `${longDate(next.date)} · check-in dibuka pada hari program sahaja.`;
      const ms = new Date(next.date + 'T' + SESSION_START + ':00+08:00') - new Date();
      if (ms > 0) { cd.hidden = false; const m = Math.floor(ms / 60000); cd.querySelector('[data-cd="d"]').textContent = Math.floor(m / 1440); cd.querySelector('[data-cd="h"]').textContent = Math.floor(m % 1440 / 60); cd.querySelector('[data-cd="m"]').textContent = m % 60; }
    } else { label = 'Program 2026 telah tamat'; sub = 'Terima kasih atas penyertaan. Jumpa lagi, insya-Allah.'; }
  }
  $('#heroLabel').textContent = label; $('#heroSub').textContent = sub;

  const grid = $('#scheduleGrid'); grid.replaceChildren();
  for (const b of [1, 2]) {
    const q = S.quota && S.quota.batches.find(x => x.batch === b);
    grid.append(el('article', { class: 'batch' },
      el('div', { class: 'batch-top' }, el('div', {}, el('h3', { text: 'Batch ' + b }), el('span', { class: 'batch-range', text: b === 1 ? '28–29 November 2026' : '5–6 Disember 2026' })),
        q ? el('span', { class: 'badge ' + quotaTone(q.status), text: quotaLabel(q.status) }) : null),
      SESSIONS.filter(x => x.batch === b).map(x => {
        const st = sessionState(x), open = isOpen(x.key), dd = Number(x.date.slice(8));
        return el('div', { class: 'day' + (st === 'today' ? ' is-today' : st === 'past' ? ' is-past' : '') },
          el('div', { class: 'day-date' }, el('small', { text: x.dow }), el('b', { text: String(dd) })),
          el('div', { class: 'day-info' }, el('strong', { text: 'Hari ' + x.day }), el('span', { text: longDate(x.date) })),
          st === 'today' ? el('span', { class: 'badge ' + (open ? 'ok' : 'warn'), text: open ? 'Dibuka' : 'Hari ini' })
            : st === 'past' ? el('span', { class: 'badge mute', text: 'Selesai' }) : el('span', { class: 'badge', text: 'Akan datang' }));
      })));
  }
  const mq = $('#miniQuota'); mq.replaceChildren();
  if (!S.quotaLoaded) { mq.append(el('a', { class: 'mq', href: '#/kuota' }, el('div', {}, el('h3', { text: S.quotaFailed ? 'Data kuota tidak tersedia' : 'Memuat data kuota…' }), el('p', { text: 'Buka papan kuota untuk cuba lagi.' })))); return; }
  for (const q of S.quota.batches) mq.append(el('a', { class: 'mq', href: '#/kuota' }, ring(q.quota ? q.registered / q.quota : 0, 64, 7, pct(q) + '%', '', 'mq-ring'),
    el('div', {}, el('h3', { text: 'Batch ' + q.batch }), el('p', { text: `${q.registered} / ${q.quota} berdaftar · baki ${q.remaining}` })),
    el('span', { class: 'badge ' + quotaTone(q.status), style: 'margin-left:auto', text: quotaLabel(q.status) })));
}
const pct = q => q.quota ? Math.round(q.registered / q.quota * 100) : 0;
const quotaTone = s => s === 'DIBUKA' ? 'ok' : s === 'PENUH' ? 'gold' : s === 'DITUTUP' ? 'bad' : 'mute';
const quotaLabel = s => s === 'DIBUKA' ? 'Dibuka' : s === 'PENUH' ? 'Penuh' : s === 'DITUTUP' ? 'Ditutup' : 'Semakan';
let ringN = 0;
function ring(frac, size, stroke, big, small, cls) {
  const r = (100 - stroke) / 2, c = 2 * Math.PI * r, id = 'rg' + (++ringN);
  const wrap = el('div', { class: 'ring ' + (cls || '') });
  wrap.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#13775c"/><stop offset="1" stop-color="#cfae6a"/></linearGradient></defs><circle class="track" cx="50" cy="50" r="${r}" style="stroke-width:${stroke}"/><circle class="bar" cx="50" cy="50" r="${r}" style="stroke:url(#${id});stroke-width:${stroke};stroke-dasharray:${c};stroke-dashoffset:${c}"/></svg>`;
  wrap.append(el('div', { class: 'ring-label' }, el('div', {}, el('strong', { text: big, style: size && size < 100 ? 'font-size:16px;font-family:var(--f-ui);font-weight:800' : null }), small ? el('small', { text: small }) : null)));
  if (size) { wrap.style.width = size + 'px'; wrap.style.height = size + 'px'; }
  requestAnimationFrame(() => requestAnimationFrame(() => { wrap.querySelector('.bar').style.strokeDashoffset = String(c * (1 - Math.max(0, Math.min(1, frac)))); }));
  wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', `${Math.round(frac * 100)} peratus`);
  return wrap;
}

/* ---------- 9. Kuota LANGSUNG (GET ?view=quota, sama seperti production sebelum V2) ---------- */
let quotaReq = null, quotaRetryTimer = null, quotaRetryCount = 0, quotaLastAttempt = 0, quotaResponses = 0;
let fbFrame = null, fbTimer = null, fbNonce = '';
const quotaValid = x => Number.isInteger(x) && x >= 0 && x <= 100000;
function receiveQuota(data) {
  if (!data || !Array.isArray(data.batches) || data.batches.length !== 2) return;
  if (data.batches.some(r => !r || ![1, 2].includes(r.batch) || ![r.registered, r.quota, r.remaining].every(quotaValid))) return;
  if (new Set(data.batches.map(r => r.batch)).size !== 2) return;
  const batches = data.batches.map(r => ({ batch: r.batch, registered: r.registered, quota: r.quota, remaining: r.remaining,
    status: ['DIBUKA', 'PENUH', 'DITUTUP'].includes(r.status) ? r.status : 'SEMAKAN' })).sort((a, b) => a.batch - b.batch);
  const t = String(data.updatedAt || '');
  S.quota = { batches, updatedAt: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t) ? t : '' };
  S.quotaLoaded = true; S.quotaFailed = false; quotaResponses++; quotaRetryCount = 0;
  if (fbTimer) { clearTimeout(fbTimer); fbTimer = null; }
  if (fbFrame) { fbFrame.remove(); fbFrame = null; }
  if (quotaRetryTimer) { clearTimeout(quotaRetryTimer); quotaRetryTimer = null; }
  renderQuota(); renderHome();
}
window.GSQuotaReceive = receiveQuota;
// Saluran alternatif (telefon tertentu): GAS memaparkan agregat awam dalam iframe dan menghantar postMessage terikat nonce.
function quotaFallback() {
  if (S.quotaLoaded || fbFrame) return;
  try {
    fbNonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const f = document.createElement('iframe');
    f.title = 'Semakan status kuota alternatif'; f.setAttribute('aria-hidden', 'true'); f.style.display = 'none';
    f.src = BASE + '?view=quota-page&nonce=' + fbNonce + '&_=' + Date.now();
    fbFrame = f; document.body.appendChild(f);
    fbTimer = setTimeout(() => { if (fbFrame) { fbFrame.remove(); fbFrame = null; } fbTimer = null; if (!S.quotaLoaded) { S.quotaFailed = true; renderQuota(); renderHome(); } }, 14000);
  } catch (_) { S.quotaFailed = true; renderQuota(); }
}
window.addEventListener('message', e => {
  const allowed = e.origin === 'null' || e.origin === 'https://script.google.com' || /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com$/i.test(e.origin);
  if (!allowed || !fbNonce) return;
  const msg = e.data;
  if (!msg || msg.kind !== 'GS_QUOTA_PAGE_V1' || msg.nonce !== fbNonce) return;
  receiveQuota(msg.data);
});
function quotaFailure() {
  S.quotaStale = S.quotaLoaded;
  if (!S.quotaLoaded) quotaFallback();
  renderQuota();
  if (quotaRetryCount < 1 && !quotaRetryTimer) { quotaRetryCount++; quotaRetryTimer = setTimeout(() => { quotaRetryTimer = null; refreshQuota(); }, 3000); }
}
function refreshQuota() {
  if (quotaReq) return;
  if (quotaRetryTimer) { clearTimeout(quotaRetryTimer); quotaRetryTimer = null; }
  quotaLastAttempt = Date.now(); S.quotaStale = false;
  const before = quotaResponses, ctrl = new AbortController();
  quotaReq = ctrl; renderQuotaBusy(true);
  const timer = setTimeout(() => ctrl.abort(), 15000);
  // GET CORS biasa (tanpa kuki). Muatan JS ?view=quota dihuraikan sebagai DATA dan TIDAK PERNAH dilaksanakan.
  fetch(BASE + '?view=quota&_=' + Date.now(), { mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'follow', signal: ctrl.signal })
    .then(r => r.text())
    .then(t => { const m = /^window\.GSQuotaReceive\(([\s\S]*)\);?\s*$/.exec(t.trim()); if (m) receiveQuota(JSON.parse(m[1])); })
    .catch(() => {})
    .finally(() => { clearTimeout(timer); quotaReq = null; renderQuotaBusy(false); if (quotaResponses <= before) quotaFailure(); });
}
function renderQuotaBusy(on) { const b = $('#quotaRefresh'); if (b) { b.classList.toggle('is-busy', on); b.disabled = on; } }
function renderQuota() {
  const kp = $('#quotaKpis'), cards = $('#quotaCards'), up = $('#quotaUpdated');
  if (!S.quotaLoaded) {
    if (S.quotaFailed) {
      up.textContent = 'Data semasa tidak dapat dimuat pada peranti ini. Maklumat kehadiran tetap disemak oleh sistem.';
      kp.replaceChildren();
      cards.replaceChildren(el('div', { class: 'card', style: 'grid-column:1/-1' }, el('div', { class: 'empty-state' },
        el('div', { class: 'es-ic', html: I.wifi }), el('h3', { text: 'Data kuota tidak tersedia' }),
        el('p', { text: 'Sambungan ke papan kuota terganggu. Angka lama tidak dipaparkan supaya tiada maklumat yang mengelirukan.' }),
        el('button', { type: 'button', class: 'btn btn-primary', text: 'Cuba lagi', onclick: () => { quotaRetryCount = 0; refreshQuota(); } }))));
    } else {
      up.textContent = 'Sedang memuat data pendaftaran terkini…';
      kp.replaceChildren(...['Jumlah berdaftar', 'Jumlah kuota', 'Baki tempat', 'Kadar isian'].map(t => el('div', { class: 'kpi' }, el('small', { text: t }), el('strong', { class: 'skel', text: '000' }))));
      cards.replaceChildren(...[1, 2].map(() => el('div', { class: 'qcard' }, el('div', { class: 'qcard-head' }, el('div', { class: 'skel', style: 'width:140px;height:30px' })), el('div', { class: 'skel', style: 'width:150px;height:150px;border-radius:50%' }), el('div', { class: 'skel', style: 'height:80px' }))));
    }
    return;
  }
  const B = S.quota.batches;
  up.textContent = S.quotaStale ? 'Sambungan terganggu. Data terakhir mungkin tidak terkini — tekan Muat semula.'
    : S.quota.updatedAt ? `Dikemas kini: ${S.quota.updatedAt} (MYT)` : 'Dikemas kini daripada spreadsheet';
  const reg = B.reduce((a, q) => a + q.registered, 0), tot = B.reduce((a, q) => a + q.quota, 0), left = B.reduce((a, q) => a + q.remaining, 0);
  const vals = [['Jumlah berdaftar', reg, 'dua batch'], ['Jumlah kuota', tot, B.map(q => q.quota).join(' + ')], ['Baki tempat', left, left ? 'masih boleh didaftar' : 'tiada baki'], ['Kadar isian', tot ? Math.round(reg / tot * 100) : 0, 'daripada jumlah kuota', true]];
  if (kp.dataset.ready !== '1') {
    kp.dataset.ready = '1';
    kp.replaceChildren(...vals.map(([t, , f, acc]) => { const s = el('strong', { text: '0' }); if (acc) s.dataset.suffix = '%'; return el('div', { class: 'kpi' + (acc ? ' accent' : '') }, el('small', { text: t }), s, el('div', { class: 'kpi-foot', text: f })); }));
  }
  kp.querySelectorAll('.kpi').forEach((k, i) => { countUp(k.querySelector('strong'), vals[i][1]); k.querySelector('.kpi-foot').textContent = vals[i][2]; });
  cards.replaceChildren(...B.map(q => {
    const frac = q.quota ? q.registered / q.quota : 0;
    const bar = el('span'); const qb = el('div', { class: 'qbar', 'aria-hidden': 'true' }, bar);
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = Math.min(100, frac * 100) + '%'; }));
    const note = q.status === 'PENUH' ? 'Kuota batch ini penuh.' : q.status === 'DITUTUP' ? 'Pendaftaran batch ini ditutup.' : q.status === 'DIBUKA' ? `Masih ada ${q.remaining} tempat.` : 'Status sedang disemak oleh urusetia.';
    return el('article', { class: 'qcard' },
      el('div', { class: 'qcard-head' }, el('div', {}, el('h2', { text: 'Batch ' + q.batch }), el('p', { text: q.batch === 1 ? '28–29 November 2026' : '5–6 Disember 2026' })),
        el('span', { class: 'badge ' + quotaTone(q.status), text: q.status })),
      ring(frac, 0, 12, pct(q) + '%', 'terisi'),
      el('div', { class: 'qnums' }, [['Berdaftar', q.registered], ['Kuota', q.quota], ['Baki', q.remaining]].map(([a, b]) => el('div', {}, el('small', { text: a }), el('strong', { text: String(b) })))),
      qb, el('p', { class: 'qnote', text: note }));
  }));
}

/* ---------- 10. Check-in peserta (logik sama seperti PR #3) ---------- */
function renderBanner() {
  const b = $('#sessionBanner'), s = todaySession(); let cls, icon, title, text;
  if (!S.publicLoaded) { cls = 'unknown'; icon = I.info; title = 'Status sesi belum dapat disemak'; text = 'Anda masih boleh tekan Sahkan kehadiran; pelayan akan menyemak tarikh dan maklumat.'; }
  else if (!s) { cls = 'off'; icon = I.cal; const n = SESSIONS.find(x => x.date > today()); title = 'Di luar tarikh program'; text = n ? `Check-in dibuka pada ${longDate(n.date)} (${n.label}).` : 'Program telah tamat. Terima kasih.'; }
  else if (!isOpen(s.key)) { cls = 'wait'; icon = I.door; title = `Hari ini: ${s.label}`; text = 'Kaunter belum dibuka oleh urusetia.'; }
  else { cls = 'open'; icon = I.check; title = `Check-in dibuka · ${s.label}`; text = 'Sesi dipilih secara automatik oleh sistem mengikut tarikh hari ini.'; }
  b.className = 'session-banner ' + cls;
  b.replaceChildren(el('span', { class: 'sb-ic', html: icon }), el('div', {}, el('strong', { text: title }), el('span', { text })));
  $('#ciSubmit').disabled = S.submitting || Date.now() < S.cooldownUntil;
}
const pin = $('[data-pin]'), pinIn = $('#ciPhone'), cells = $$('.pin-cell');
function drawPin() { const v = pinIn.value; cells.forEach((c, i) => { c.textContent = v[i] ? '•' : ''; c.classList.toggle('filled', !!v[i]); c.classList.toggle('next', i === v.length); }); }
pinIn.addEventListener('input', () => { pinIn.value = pinIn.value.replace(/\D/g, '').slice(0, 4); pin.classList.remove('invalid'); setErr('ciPhoneErr', ''); drawPin(); });
pinIn.addEventListener('focus', () => pin.classList.add('focus'));
pinIn.addEventListener('blur', () => pin.classList.remove('focus'));
$('#ciReceipt').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^R0-9]/g, '').slice(0, 5); e.target.removeAttribute('aria-invalid'); setErr('ciReceiptErr', ''); if (/^R\d{4}$/.test(e.target.value)) pinIn.focus(); });
function setErr(id, msg) { const e = $('#' + id); e.textContent = msg; e.hidden = !msg; }

function showInline(kind, opts = {}) {
  const host = $('#outcomeHost'), form = $('#checkinForm');
  host.dataset.outcome = kind || '';
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
    n.append(el('div', { class: 'oc-ticket' }, el('dl', {}, el('dt', { text: 'Resit' }), el('dd', { class: 'mono', text: o.receipt }), el('dt', { text: 'Sesi' }), el('dd', { text: o.label || 'Sesi hari ini' }), el('dt', { text: 'Masa' }), el('dd', { text: o.at ? fmtTime(o.at) + ' MYT' : '—' })),
      el('div', { class: 'oc-stamp' }, el('span', { text: kind === 'ALREADY' ? '✓ SUDAH DIREKOD' : '✓ DIREKOD' }), el('span', { text: o.at ? mytDay(o.at) : '' }))));
  }
  let again = null;
  if (kind === 'UNKNOWN' && o.cooldown) {
    const C = 2 * Math.PI * 11;
    const cd = el('div', { class: 'cooldown' }); cd.innerHTML = `<svg viewBox="0 0 28 28" aria-hidden="true"><circle class="cd-track" cx="14" cy="14" r="11" fill="none"/><circle class="cd-bar" cx="14" cy="14" r="11" fill="none" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>`;
    const txt = el('span', {}); cd.append(txt); n.append(cd);
    const tick = () => { const left = Math.max(0, Math.ceil((S.cooldownUntil - Date.now()) / 1000)); txt.textContent = left ? `Butang dikunci ${left} saat untuk elak hantaran berganda` : 'Anda boleh cuba sekali lagi selepas urusetia menyemak.'; cd.querySelector('.cd-bar').style.strokeDashoffset = String(C * (1 - left / 30)); if (left && document.contains(cd)) setTimeout(tick, 1000); else { renderBanner(); if (again) again.disabled = false; } };
    setTimeout(tick, 0);
  }
  if (o.actions !== false && ['SUCCESS', 'RECOVERED', 'ALREADY', 'FAILED', 'UNKNOWN'].includes(kind)) {
    const acts = el('div', { class: 'oc-actions' });
    if (kind === 'FAILED') acts.append(el('button', { type: 'button', class: 'btn btn-primary btn-lg btn-block', text: 'Betulkan maklumat', onclick: () => { showInline(null); $('#ciReceipt').focus(); } }));
    else if (kind === 'UNKNOWN') { again = el('button', { type: 'button', class: 'btn btn-outline btn-lg btn-block', text: 'Kembali ke borang', disabled: Date.now() < S.cooldownUntil, onclick: () => showInline(null) }); acts.append(again); }
    else acts.append(el('button', { type: 'button', class: 'btn btn-outline btn-lg btn-block', text: 'Check-in peserta lain', onclick: () => { showInline(null); $('#ciReceipt').focus(); } }));
    n.append(acts);
  }
  if ((kind === 'SUCCESS' || kind === 'RECOVERED') && !reduceMotion && o.confetti) {
    const cf = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (let i = 0; i < 26; i++) { const c = el('i'); c.style.left = (i * 37 % 100) + '%'; c.style.background = ['#cfae6a', '#13775c', '#e3c98f', '#1c9070'][i % 4]; c.style.animationDelay = (i % 9) * 60 + 'ms'; cf.append(c); }
    n.append(cf);
  }
  return n;
}
// Pengesahan BACA SAHAJA selepas keputusan tidak pasti. Selamat diulang: tidak pernah menulis.
async function verifyRecorded(receipt, last4) {
  for (let i = 0; i < 2; i++) {
    await sleep(i ? 5000 : 6000); // beri masa penulisan yang sedang berjalan selesai
    try { const r = await api('gsSelfCheckinStatus', { receipt, last4 }); if (r && typeof r.recorded === 'boolean') return r.recorded; }
    catch (err) { if (!(err instanceof GsUncertain)) return null; }
  }
  return null;
}
$('#checkinForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (S.submitting || Date.now() < S.cooldownUntil) return;
  const rIn = $('#ciReceipt'), short = rIn.value.trim().toUpperCase(), last4 = pinIn.value.trim();
  let bad = false;
  if (!/^R\d{4}$/.test(short)) { rIn.setAttribute('aria-invalid', 'true'); setErr('ciReceiptErr', 'Masukkan kod resit seperti R0049.'); bad = true; }
  if (!/^\d{4}$/.test(last4)) { pin.classList.add('invalid'); setErr('ciPhoneErr', 'Masukkan 4 digit terakhir telefon penjaga.'); bad = true; }
  if (bad) { const c = $('#checkinCard'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); (rIn.getAttribute('aria-invalid') ? rIn : pinIn).focus(); return; }
  // Jika status awam diketahui, amaran ditunjukkan dan TIADA permintaan dihantar (sama seperti butang dinyahaktif dahulu).
  const s = todaySession();
  if (S.publicLoaded) {
    if (!s) { await MODALS.outOfDate(); return; }
    if (!isOpen(s.key)) { await MODALS.notOpen(s); return; }
  }
  const label = s ? s.label : 'Sesi hari ini';
  const receipt = 'GS26_' + short;
  S.submitting = true; renderBanner(); showInline('PENDING');
  let kind, msg = '';
  try {
    // Sesi dipilih oleh PELAYAN berdasarkan tarikh Malaysia. SATU permintaan menulis, tidak pernah diulang automatik.
    const d = await api('gsSelfCheckin', { receipt, last4 });
    if (!d || d.ok !== true) throw new GsUncertain('Jawapan pelayan tidak lengkap.');
    kind = d.already ? 'ALREADY' : 'SUCCESS';
  } catch (err) {
    if (!(err instanceof GsUncertain)) { kind = 'FAILED'; msg = err.message; }
    else {
      showInline('VERIFY');
      const rec = await verifyRecorded(receipt, last4);
      if (rec === true) kind = 'RECOVERED';
      else if (rec === false) { kind = 'FAILED'; msg = 'Kehadiran BELUM direkod (disahkan oleh pelayan). Anda boleh tekan Sahkan kehadiran sekali lagi.'; }
      else { kind = 'UNKNOWN'; S.cooldownUntil = Date.now() + 30000; setTimeout(renderBanner, 30500); }
    }
  } finally { S.submitting = false; }
  const at = new Date();
  showInline(kind, { receipt: short, label, at, msg, cooldown: kind === 'UNKNOWN', confetti: true });
  if (kind === 'SUCCESS' || kind === 'RECOVERED' || kind === 'ALREADY') { rIn.value = ''; pinIn.value = ''; drawPin(); }
  renderBanner();
  if (kind === 'SUCCESS' || kind === 'RECOVERED') MODALS.success(short, label, at, kind === 'RECOVERED');
  else if (kind === 'ALREADY') MODALS.already(short, label);
  else if (kind === 'FAILED') MODALS.failed(msg);
  else MODALS.unknown();
});

/* ---------- 11. Urusetia ---------- */
$('#toggleKey').addEventListener('click', e => { const k = $('#staffKey'), show = k.type === 'password'; k.type = show ? 'text' : 'password'; e.currentTarget.setAttribute('aria-pressed', String(show)); e.currentTarget.setAttribute('aria-label', show ? 'Sembunyikan kunci' : 'Tunjukkan kunci'); });
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const k = $('#staffKey'), btn = $('#loginBtn');
  if (k.value.length < 8) { k.setAttribute('aria-invalid', 'true'); setErr('staffKeyErr', 'Kunci urusetia perlu sekurang-kurangnya 8 aksara.'); k.focus(); return; }
  k.removeAttribute('aria-invalid'); setErr('staffKeyErr', '');
  const key = k.value; k.value = '';
  btn.classList.add('is-busy'); btn.disabled = true;
  try {
    const d = await api('gsStaffLogin', key);
    if (!d || typeof d.token !== 'string') throw new Error('Jawapan log masuk tidak sah.');
    S.token = d.token; S.staffSession = ''; S.snapshot = null; S.query = ''; $('#rosterSearch').value = '';
    renderStaff(); toast('Log masuk berjaya. Selamat bertugas.');
  } catch (err) {
    k.setAttribute('aria-invalid', 'true');
    setErr('staffKeyErr', err instanceof GsUncertain ? 'Sambungan terganggu. Cuba log masuk sekali lagi.' : err.message);
  } finally { btn.classList.remove('is-busy'); btn.disabled = false; }
});
$('#logoutBtn').addEventListener('click', async () => {
  const t = S.token; S.token = ''; S.snapshot = null; renderStaff(); toast('Anda telah log keluar.');
  try { await api('gsStaffLogout', t); } catch (_) { /* token tamat dengan sendirinya */ }
});

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
  if (!avail.includes(S.staffSession)) { S.staffSession = defaultStaffSession(); S.snapshot = null; }
  const seg = $('#sessionSeg'); seg.replaceChildren();
  for (const s of SESSIONS) {
    const st = sessionState(s), sel = s.key === S.staffSession;
    seg.append(el('button', { type: 'button', role: 'tab', 'aria-selected': String(sel), disabled: st === 'future', 'data-session': s.key,
      'aria-label': `${s.label}, ${longDate(s.date)}${st === 'future' ? ', dikunci sehingga tarikh sesi' : st === 'past' ? ', selesai, baca sahaja' : ', hari ini'}`,
      title: st === 'future' ? `Dikunci sehingga ${longDate(s.date)}` : null,
      onclick: () => { if (S.staffSession !== s.key) { S.staffSession = s.key; S.snapshot = null; renderStaff(); } } },
      el('strong', { text: s.label }), el('span', { text: `${s.dow}, ${s.short}` }),
      st === 'future' ? el('span', { class: 'seg-lock', html: I.lock }) : st === 'today' ? el('span', { class: 'today-dot', text: 'HARI INI' }) : el('span', { class: 'past-dot', text: 'SELESAI' })));
  }
  const s = SESSIONS.find(x => x.key === S.staffSession);
  const cc = $('#controlCard');
  if (!s) {
    const first = SESSIONS[0];
    cc.replaceChildren(el('div', { class: 'empty-state', style: 'width:100%' }, el('div', { class: 'es-ic', html: I.lock }), el('h3', { text: 'Belum ada sesi tersedia' }),
      el('p', { text: `Semua sesi masih dikunci. Sesi pertama, ${first.label}, dibuka secara automatik pada ${longDate(first.date)} (waktu Malaysia).` })));
    $('#staffKpis').replaceChildren(); $('#rosterList').replaceChildren(); $('#rosterSearch').disabled = true; $('#rosterRefresh').disabled = true;
    return;
  }
  $('#rosterSearch').disabled = false; $('#rosterRefresh').disabled = false;
  renderControl(); renderKpis(); renderRoster();
  if (!S.snapshot || S.snapshot.session.key !== s.key) refreshStaff();
}
function renderControl() {
  const s = SESSIONS.find(x => x.key === S.staffSession), cc = $('#controlCard'); cc.replaceChildren();
  const snap = S.snapshot && S.snapshot.session.key === s.key ? S.snapshot : null;
  const st = sessionState(s), open = snap ? snap.session.open === true : isOpen(s.key);
  if (!snap) { cc.append(el('div', { class: 'cc-state' }, el('div', { class: 'cc-orb off', html: I.refresh }), el('div', {}, el('h2', { text: 'Memuat status sesi…' }), el('p', { text: `${s.label} · ${longDate(s.date)}` })))); return; }
  if (st === 'today') {
    cc.append(el('div', { class: 'cc-state' }, el('div', { class: 'cc-orb ' + (open ? 'on' : 'off'), html: open ? I.unlock : I.lock }),
      el('div', {}, el('h2', { text: open ? 'Kaunter dibuka' : 'Kaunter ditutup' }), el('p', { text: `${s.label} · ${longDate(s.date)} · hari ini` }))),
      el('button', { type: 'button', class: 'switch', role: 'switch', id: 'gsToggle', 'aria-checked': String(open), disabled: S.staffBusy, onclick: toggleOpen },
        el('span', { class: 'knob' }), el('span', { text: open ? 'Check-in dibuka' : 'Check-in ditutup' })));
  } else {
    // Sesi lampau: baca sahaja. Jika masih bertanda dibuka, urusetia boleh MENUTUP sahaja (GAS V7 membenarkan tutup bila-bila).
    cc.append(el('div', { class: 'cc-state' }, el('div', { class: 'cc-orb lock', html: I.eye }),
      el('div', {}, el('h2', { text: 'Sesi lampau · baca sahaja' }), el('p', {}, `${s.label} · ${longDate(s.date)}. `, el('button', { type: 'button', class: 'link-btn', text: 'Kenapa dikunci?', onclick: () => MODALS.pastReadOnly(s) })))),
      open ? el('button', { type: 'button', class: 'switch', role: 'switch', id: 'gsToggle', 'aria-checked': 'true', disabled: S.staffBusy, onclick: toggleOpen, 'aria-label': 'Tutup check-in sesi lampau yang masih bertanda dibuka' }, el('span', { class: 'knob' }), el('span', { text: 'Tutup check-in' }))
        : el('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': 'false', disabled: true, 'aria-label': 'Buka check-in, dikunci untuk sesi lampau' }, el('span', { class: 'knob' }), el('span', { text: 'Dikunci' })));
  }
}
function renderKpis() {
  const snap = S.snapshot, kp = $('#staffKpis');
  if (!snap) { kp.replaceChildren(...['Berdaftar', 'Hadir', 'Belum hadir', 'Kadar kehadiran'].map(t => el('div', { class: 'kpi' }, el('small', { text: t }), el('strong', { class: 'skel', text: '00' })))); kp.dataset.key = ''; return; }
  const total = Number(snap.total) || 0, present = Number(snap.present) || 0, p = total ? Math.round(present / total * 100) : 0;
  if (kp.dataset.key !== snap.session.key) {
    kp.dataset.key = snap.session.key;
    kp.replaceChildren(...['Berdaftar', 'Hadir', 'Belum hadir', 'Kadar kehadiran'].map((t, i) => el('div', { class: 'kpi' + (i === 3 ? ' accent' : '') }, el('small', { text: t }), el('strong', { text: '0' }), i === 3 ? el('div', { class: 'progress' }, el('span')) : el('div', { class: 'kpi-foot', text: i === 0 ? 'peserta batch ini' : sessionState(SESSIONS.find(x => x.key === snap.session.key)) === 'today' ? 'daripada Sheets' : 'rekod akhir' }))));
  }
  const ks = kp.querySelectorAll('strong'); countUp(ks[0], total); countUp(ks[1], present); countUp(ks[2], Math.max(0, total - present)); ks[3].textContent = p + '%';
  kp.querySelector('.progress span').style.width = Math.min(100, p) + '%';
  const people = snap.people || [];
  $$('#filterChips .chip').forEach(c => {
    const f = c.dataset.filter, n = f === 'all' ? people.length : people.filter(x => f === 'present' ? x.present : !x.present).length;
    c.replaceChildren(f === 'all' ? 'Semua' : f === 'present' ? 'Hadir' : 'Belum hadir', el('span', { class: 'n', text: String(n) }));
    c.setAttribute('aria-checked', String(f === S.filter));
  });
}
function renderRoster() {
  const s = SESSIONS.find(x => x.key === S.staffSession), ul = $('#rosterList'); ul.replaceChildren(); if (!s) return;
  const snap = S.snapshot && S.snapshot.session.key === s.key ? S.snapshot : null;
  if (!snap) { for (let i = 0; i < 4; i++) ul.append(el('li', { class: 'person' }, el('span', { class: 'avatar skel', text: '··' }), el('div', { class: 'person-info' }, el('strong', { class: 'skel', text: 'Memuat senarai peserta' }), el('small', { class: 'skel', text: 'GS26_R0000' })))); return; }
  const st = sessionState(s), open = snap.session.open === true, writable = st === 'today' && open;
  let list = (snap.people || []).slice();
  if (S.filter === 'present') list = list.filter(p => p.present); else if (S.filter === 'absent') list = list.filter(p => !p.present);
  if (st === 'past') ul.append(el('li', { class: 'readonly-bar', html: I.eye + '<span>Sesi lampau: senarai untuk semakan sahaja. Penandaan hadir dikunci.</span>' }));
  else if (!open) ul.append(el('li', { class: 'readonly-bar', html: I.lock + '<span>Buka check-in dahulu untuk menanda kehadiran secara manual.</span>' }));
  if (!list.length) { ul.append(el('li', { class: 'empty-state' }, el('div', { class: 'es-ic', html: I.search }), el('h3', { text: 'Tiada peserta sepadan' }), el('p', { text: S.query ? `Tiada nama atau resit yang mengandungi “${S.query}”. Semak ejaan atau cuba nombor resit.` : 'Tiada peserta dalam tapisan ini.' }))); return; }
  for (const p of list) {
    const initials = String(p.name || '').split(/\s+/).filter(w => w && !/^(bin|binti|bt|b\.?)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '·';
    let right;
    if (p.present) right = el('span', { class: 'badge ok', text: 'Hadir' });
    else if (st === 'past') right = el('span', { class: 'badge mute', text: 'Tidak hadir' });
    else right = el('button', { type: 'button', class: 'btn btn-soft btn-sm', disabled: !writable || S.staffBusy, text: 'Tanda hadir', 'data-receipt': p.receipt, onclick: e => markPresent(p, e.currentTarget) });
    ul.append(el('li', { class: 'person' + (p.present ? ' is-present' : '') + (p.receipt === S.flash ? ' flash' : '') },
      el('span', { class: 'avatar', 'aria-hidden': 'true', text: initials }),
      el('div', { class: 'person-info' }, el('strong', { text: p.name }), el('small', { class: 'mono', text: p.receipt })), right));
  }
  if ((snap.people || []).length >= 100) ul.append(el('li', { class: 'help', style: 'padding:10px 12px', text: 'Paparan dihadkan kepada 100 padanan pertama. Gunakan carian untuk mencari peserta lain.' }));
  S.flash = '';
}
let staffReqId = 0;
async function refreshStaff() {
  if (!S.token) return;
  const key = S.staffSession; if (!key) return;
  const id = ++staffReqId, q = S.query;
  const btn = $('#rosterRefresh'); btn.classList.add('is-busy');
  try {
    const d = await api('gsStaffSnapshot', S.token, key, q);
    if (id !== staffReqId || key !== S.staffSession) return;
    if (!d || !d.session || d.session.key !== key || !Array.isArray(d.people)) throw new Error('Jawapan senarai tidak sah.');
    S.snapshot = d;
    // kemas kini status awam setempat untuk sesi ini supaya Utama/Check-in selaras
    if (S.pub && Array.isArray(S.pub.sessions)) { const ps = S.pub.sessions.find(x => x.key === key); if (ps) ps.open = d.session.open === true; }
    renderControl(); renderKpis(); renderRoster();
  } catch (err) {
    if (id !== staffReqId) return;
    if (/Sesi tamat|Sila login/.test(err.message)) { await MODALS.expired(); S.token = ''; S.snapshot = null; renderStaff(); return; }
    toast(err instanceof GsUncertain ? 'Senarai tidak dapat dimuat. Semak sambungan dan tekan Muat semula.' : err.message);
  } finally { if (id === staffReqId) btn.classList.remove('is-busy'); }
}
async function staffWrite(fn) {
  S.staffBusy = true; renderControl(); renderRoster();
  try { return { ok: true, v: await fn() }; }
  catch (err) {
    if (/Sesi tamat|Sila login/.test(err.message)) { await MODALS.expired(); S.token = ''; S.snapshot = null; renderStaff(); return { ok: false }; }
    if (err instanceof GsUncertain) { const r = await MODALS.connection(); if (r === 'refresh') await refreshStaff(); return { ok: false }; }
    await MODALS.rejected(err.message); return { ok: false };
  } finally { S.staffBusy = false; if (S.token) { renderControl(); renderRoster(); } }
}
async function toggleOpen() {
  const s = SESSIONS.find(x => x.key === S.staffSession), snap = S.snapshot; if (!s || !snap || S.staffBusy) return;
  const st = sessionState(s), next = !(snap.session.open === true);
  if (next && st !== 'today') { MODALS.pastReadOnly(s); return; } // buka hanya pada tarikh sesi (pelayan juga menolak)
  if (await MODALS.confirmToggle(s, next) !== 'ok') return;
  const r = await staffWrite(() => api('gsStaffSetOpen', S.token, s.key, next)); // satu permintaan; tiada cubaan semula automatik
  if (!r.ok) return;
  toast(next ? 'Check-in dibuka untuk ' + s.short : 'Check-in ditutup untuk ' + s.short);
  await refreshStaff(); refreshPublic();
}
async function markPresent(p, btn) {
  const s = SESSIONS.find(x => x.key === S.staffSession);
  if (sessionState(s) !== 'today') { MODALS.pastReadOnly(s); return; }
  const op = $('#operatorName').value.trim().slice(0, 60);
  if (await MODALS.confirmAttend(p, s, op) !== 'ok') return;
  if (btn && document.contains(btn)) btn.classList.add('is-busy');
  const r = await staffWrite(() => api('gsStaffCheckin', S.token, s.key, p.receipt, op)); // satu permintaan; tiada cubaan semula automatik
  if (!r.ok) return;
  S.flash = p.receipt;
  toast(r.v && r.v.already ? `${p.name} sudah direkod.` : `${p.name} ditanda HADIR.`);
  await refreshStaff();
}
$$('#filterChips .chip').forEach(c => c.addEventListener('click', () => { S.filter = c.dataset.filter; renderKpis(); renderRoster(); }));
let deb; $('#rosterSearch').addEventListener('input', e => { clearTimeout(deb); deb = setTimeout(() => { S.query = e.target.value.slice(0, 100); refreshStaff(); }, 300); });
$('#rosterRefresh').addEventListener('click', () => refreshStaff());

/* ---------- 12. Panduan status (contoh paparan sahaja) ---------- */
function renderGallery() {
  const g = $('#stateGallery'); g.replaceChildren();
  const s = SESSIONS[0], at = new Date(), ex = { name: 'Nama Peserta (contoh)', receipt: 'GS26_R0049' };
  const spec = (node, title, when) => el('div', { class: 'specimen' }, el('div', { class: 'specimen-body' }, node), el('div', { class: 'specimen-foot' }, el('b', { text: title }), when));
  const group = (title, desc, items) => el('section', { class: 'gallery-group' }, el('h2', { text: title }), el('p', { text: desc }), el('div', { class: 'gallery' }, items));
  g.append(group('Tetingkap pengesahan', 'Tekan untuk melihat contoh. Contoh ini tidak menghantar apa-apa ke sistem.',
    [el('div', { class: 'modal-launchers', style: 'grid-column:1/-1' }, [
      ['Di luar tarikh program', 'm-tone-warn', () => MODALS.outOfDate()],
      ['Sahkan kehadiran peserta', 'm-tone-accent', () => MODALS.confirmAttend(ex, s, 'Urusetia Meja 1')],
      ['Buka check-in', 'm-tone-ok', () => MODALS.confirmToggle(s, true)],
      ['Tutup check-in', 'm-tone-bad', () => MODALS.confirmToggle(s, false)],
      ['Check-in berjaya', 'm-tone-ok', () => MODALS.success('R0049', s.label, at)],
      ['Sudah direkod', 'm-tone-ok', () => MODALS.already('R0049', s.label)],
      ['Gagal', 'm-tone-bad', () => MODALS.failed('Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.')],
      ['Status tidak diketahui', 'm-tone-warn', () => MODALS.unknown()],
      ['Ralat sambungan (urusetia)', 'm-tone-warn', () => MODALS.connection()],
      ['Sesi log masuk tamat', 'm-tone-info', () => MODALS.expired()],
      ['Sesi lampau baca sahaja', 'm-tone-info', () => MODALS.pastReadOnly(s)],
    ].map(([t, tone, fn]) => el('button', { type: 'button', class: 'btn btn-outline ' + tone, onclick: fn }, el('span', { class: 'ml-dot' }), 'Contoh: ' + t)))]));
  g.append(group('Check-in peserta', 'Tiga keputusan muktamad sahaja: BERJAYA (pelayan sahkan), GAGAL (pelayan tolak, tiada rekod), TIDAK DIKETAHUI (tiada jawapan yang boleh dipercayai).', [
    spec(outcomeNode('PENDING', { actions: false }), 'Memuat', 'Satu permintaan dihantar; butang dikunci sepanjang proses.'),
    spec(outcomeNode('VERIFY', { actions: false }), 'Menyemak semula', 'Sambungan terputus. Semakan baca sahaja, tiada tulis semula.'),
    spec(outcomeNode('SUCCESS', { actions: false, receipt: 'R0049', label: s.label, at }), 'Berjaya', 'Pelayan mengesahkan rekod baharu ditulis.'),
    spec(outcomeNode('ALREADY', { actions: false, receipt: 'R0049', label: s.label, at }), 'Sudah direkod', 'Pelayan mengesahkan rekod sedia ada. Tiada baris tambahan.'),
    spec(outcomeNode('FAILED', { actions: false, msg: 'Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.' }), 'Gagal', 'Pelayan menolak. Tiada rekod dibuat.'),
    spec(outcomeNode('UNKNOWN', { actions: false }), 'Tidak diketahui', 'Tiada jawapan sah selepas semakan semula. Butang dikunci 30 saat; rujuk urusetia.'),
  ]));
  const banner = (cls, icon, t, x) => el('div', { class: 'session-banner ' + cls, style: 'margin:0' }, el('span', { class: 'sb-ic', html: icon }), el('div', {}, el('strong', { text: t }), el('span', { text: x })));
  g.append(group('Status sesi', 'Sepanduk di atas borang check-in. Sesi dipilih oleh pelayan mengikut tarikh Malaysia.', [
    spec(banner('open', I.check, 'Check-in dibuka', 'Sesi dipilih secara automatik mengikut tarikh hari ini.'), 'Dibuka', 'Hari program dan urusetia telah membuka kaunter.'),
    spec(banner('wait', I.door, 'Hari ini: sesi program', 'Kaunter belum dibuka oleh urusetia.'), 'Belum dibuka', 'Hari program, kaunter masih ditutup.'),
    spec(banner('off', I.cal, 'Di luar tarikh program', 'Check-in dibuka pada tarikh sesi sahaja.'), 'Di luar tarikh', 'Tekan Sahkan memaparkan amaran; tiada permintaan dihantar.'),
    spec(banner('unknown', I.info, 'Status sesi belum dapat disemak', 'Anda masih boleh tekan Sahkan kehadiran; pelayan akan menyemak.'), 'Status tidak dapat disemak', 'Rangkaian gagal membaca status. Pelayan tetap menjadi penentu.'),
  ]));
}

/* ---------- 13. Tema, toast, jam ---------- */
const THEMES = ['auto', 'light', 'dark'];
function applyTheme(v) {
  if (v === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', v);
  const b = $('#themeBtn'); if (b) { b.innerHTML = v === 'dark' ? I.moon : v === 'light' ? I.sun : I.auto; b.setAttribute('aria-label', 'Tema: ' + (v === 'dark' ? 'gelap' : v === 'light' ? 'cerah' : 'ikut peranti') + '. Tekan untuk tukar.'); b.dataset.theme = v; }
}
let theme = 'auto'; try { theme = localStorage.getItem('gs26-theme') || 'auto'; } catch (_) {}
if (!THEMES.includes(theme)) theme = 'auto';
applyTheme(theme);
$('#themeBtn').addEventListener('click', () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; applyTheme(theme); try { localStorage.setItem('gs26-theme', theme); } catch (_) {} toast('Tema: ' + (theme === 'dark' ? 'gelap' : theme === 'light' ? 'cerah' : 'ikut peranti')); });
function toast(msg) {
  const t = el('div', { class: 'toast', role: 'status', html: I.sparkle }); t.append(el('span', { text: msg }));
  $('#toasts').append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2800);
}
function tickClock() { $('#clockText').textContent = fmtChip(new Date()) + ' MYT'; }
$('#quotaRefresh').addEventListener('click', () => { quotaRetryCount = 0; refreshQuota(); });

/* ---------- 14. Mula ---------- */
drawPin(); tickClock(); renderHome(); renderBanner(); route();
window.addEventListener('hashchange', route);
refreshQuota(); refreshPublic();
setInterval(refreshQuota, 120000);
setInterval(() => { tickClock(); if (currentView === 'urusetia' && S.token) refreshStaff(); else refreshPublic(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - quotaLastAttempt > 30000) refreshQuota(); });
window.addEventListener('pageshow', e => { if (e.persisted) { refreshQuota(); refreshPublic(); } });
window.__GS_V2_READY__ = true;
})();
