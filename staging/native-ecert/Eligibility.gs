/**
 * Generasi Sunnah 2026 — Native eCERT eligibility (pure logic, QA staging).
 * No Google APIs, no writes, no network. Input arrays use spreadsheet header rows.
 * All times are checked in Malaysia (UTC+08, no DST).
 */
const EC_SESSIONS_ = Object.freeze({
  b1d1: {batch: 1, date: '2026-11-28'},
  b1d2: {batch: 1, date: '2026-11-29'},
  b2d1: {batch: 2, date: '2026-12-05'},
  b2d2: {batch: 2, date: '2026-12-06'}
});
const EC_METHODS_ = Object.freeze(['QR PESERTA', 'URUS SETIA']);

function ecText_(v) { return String(v === null || v === undefined ? '' : v).trim(); }
function ecKey_(v) { return ecText_(v).toUpperCase(); }
function ecHeaders_(row, required) {
  const map = {};
  row.forEach((x, i) => { map[ecText_(x).toLowerCase().replace(/\s+/g, ' ')] = i; });
  const out = {};
  required.forEach(h => {
    const k = h.toLowerCase().replace(/\s+/g, ' ');
    if (!Object.prototype.hasOwnProperty.call(map, k)) throw new Error('Header tiada: ' + h);
    out[h] = map[k];
  });
  return out;
}
function ecBatch_(value) {
  const match = ecText_(value).match(/\bBatch\s*([12])\b/i);
  return match ? Number(match[1]) : 0;
}
function ecMalaysiaDate_(value) {
  let d;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    d = value;
  } else if (typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    d = new Date(value);
  } else return '';
  if (!Number.isFinite(d.getTime())) return '';
  return new Date(d.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}
function ecValidEmail_(v) {
  const s = ecText_(v);
  return s.length <= 254 && /^[^\s,;@<>]+@[^\s,;@<>]+\.[^\s,;@<>]+$/.test(s);
}
function ecTrueFalse_(value) {
  if (value === true || ecKey_(value) === 'TRUE') return true;
  if (value === false || ecKey_(value) === 'FALSE') return false;
  return null;
}
/**
 * Returns {rows, orphans}. Never merges by name.
 * Correction rows are append-only; latest decision for (receipt, session) wins.
 * A correction does not fix missing/duplicate identities, invalid emails or prior output.
 */
function ecEvaluate_(roster, attendance, corrections) {
  if (!roster.length || !attendance.length) throw new Error('Header sumber tidak tersedia');
  const rh = ecHeaders_(roster[0], [
    'No_Resit', 'No_Sijil', 'Nama penuh', 'Pilihan batch program', 'Email address',
    'Merged Doc ID - eCERT GS26', 'Document Merge Status - eCERT GS26'
  ]);
  const ah = ecHeaders_(attendance[0], [
    'Checkin_ID', 'Sesi', 'No_Resit', 'Waktu_Checkin', 'Kaedah', 'Direkod_Oleh'
  ]);
  const ch = corrections && corrections.length ? ecHeaders_(corrections[0], [
    'No_Resit', 'Sesi', 'Hadir', 'Alasan', 'Operator', 'Waktu'
  ]) : null;
  const people = roster.slice(1).filter(r => r.some(v => ecText_(v))).map(r => ({
    receipt: ecKey_(r[rh['No_Resit']]),
    certificate: ecKey_(r[rh['No_Sijil']]),
    name: ecText_(r[rh['Nama penuh']]),
    batch: ecBatch_(r[rh['Pilihan batch program']]),
    email: ecText_(r[rh['Email address']]),
    priorOutput: ecText_(r[rh['Merged Doc ID - eCERT GS26']]) ||
                 ecText_(r[rh['Document Merge Status - eCERT GS26']])
  }));
  const receiptCount = {}, certCount = {};
  people.forEach(p => {
    if (p.receipt) receiptCount[p.receipt] = (receiptCount[p.receipt] || 0) + 1;
    if (p.certificate) certCount[p.certificate] = (certCount[p.certificate] || 0) + 1;
  });
  const correctionMap = {};
  (corrections || []).slice(1).forEach(r => {
    const receipt = ecKey_(r[ch['No_Resit']]);
    const session = ecKey_(r[ch['Sesi']]).toLowerCase();
    if (!receipt || !session) return;
    const present = ecTrueFalse_(r[ch['Hadir']]);
    const valid = present !== null && ecText_(r[ch['Alasan']]).length >= 5 &&
                  !!ecText_(r[ch['Operator']]) && !!ecMalaysiaDate_(r[ch['Waktu']]);
    correctionMap[receipt + '|' + session] = {valid, present};
  });
  const eventMap = {}, orphans = [];
  const eventIdCount = {};
  const events = attendance.slice(1).filter(r => r.some(v => ecText_(v))).map(r => ({
    id: ecKey_(r[ah['Checkin_ID']]),
    session: ecText_(r[ah['Sesi']]).toLowerCase(),
    receipt: ecKey_(r[ah['No_Resit']]),
    when: r[ah['Waktu_Checkin']],
    method: ecKey_(r[ah['Kaedah']]),
    actor: ecText_(r[ah['Direkod_Oleh']])
  }));
  events.forEach(e => {
    if (e.id) eventIdCount[e.id] = (eventIdCount[e.id] || 0) + 1;
    if (!e.receipt || !receiptCount[e.receipt] || !EC_SESSIONS_[e.session]) {
      orphans.push({receipt: e.receipt, session: e.session, reason: 'CHECKIN_TANPA_PADANAN'});
    } else {
      const k = e.receipt + '|' + e.session;
      (eventMap[k] || (eventMap[k] = [])).push(e);
    }
  });
  const rows = people.map(p => {
    const reasons = [], days = [];
    if (!p.receipt || receiptCount[p.receipt] !== 1) reasons.push('NO_RESIT_TIDAK_UNIK');
    if (!p.certificate || certCount[p.certificate] !== 1) reasons.push('NO_SIJIL_TIDAK_UNIK');
    if (!p.name) reasons.push('NAMA_KOSONG');
    if (!p.batch) reasons.push('BATCH_TIDAK_SAH');
    if (!ecValidEmail_(p.email)) reasons.push('EMEL_TIDAK_SAH');
    if (p.priorOutput) reasons.push('OUTPUT_AUTOCRAT_SEDIA_ADA');
    if (p.batch) {
      Object.keys(EC_SESSIONS_).filter(s => EC_SESSIONS_[s].batch === p.batch).forEach(session => {
        const key = p.receipt + '|' + session;
        const correction = correctionMap[key];
        if (correction) {
          if (!correction.valid) reasons.push('PEMBETULAN_TIDAK_SAH_' + session);
          else if (correction.present) days.push(session);
          return;
        }
        const eventsForDay = eventMap[key] || [];
        if (!eventsForDay.length) return;
        if (eventsForDay.length !== 1) { reasons.push('CHECKIN_BERGANDA_' + session); return; }
        const e = eventsForDay[0];
        if (!e.id || eventIdCount[e.id] !== 1 || !EC_METHODS_.includes(e.method) ||
            !e.actor || ecMalaysiaDate_(e.when) !== EC_SESSIONS_[session].date) {
          reasons.push('CHECKIN_PERLU_SEMAKAN_' + session);
        } else days.push(session);
      });
      events.filter(e => e.receipt === p.receipt &&
        EC_SESSIONS_[e.session] && EC_SESSIONS_[e.session].batch !== p.batch)
        .forEach(() => reasons.push('CHECKIN_BATCH_LAIN'));
    }
    return {
      receipt: p.receipt, certificate: p.certificate, name: p.name, email: p.email,
      batch: p.batch, days, reasons: [...new Set(reasons)],
      eligibility: reasons.length ? 'REVIEW' : (days.length === 2 ? 'ELIGIBLE' : 'NOT_ELIGIBLE')
    };
  });
  return {rows, orphans};
}
