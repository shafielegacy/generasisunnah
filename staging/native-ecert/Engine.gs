/**
 * Generasi Sunnah 2026 — Native eCERT Engine (QA-ONLY, NOT FOR PRODUCTION).
 *
 * Standalone, editor-run Apps Script. Do not deploy as web app or install triggers.
 * Source roster and check-in sheets are strictly READ-ONLY.
 * All writes go to a DIFFERENT QA ledger workbook and QA Drive folder.
 * The official AutoCrat job, original Slides template and GAS V7 are untouched.
 *
 * Requires Eligibility.gs in the SAME standalone Apps Script project.
 */
const EC_OFFICIAL_SOURCE_ID_ = '1YOlKCIfBd6FNJji6p4SjQtuBQOqr3zVFbtC2Nj1mwvc';
const EC_OFFICIAL_TEMPLATE_ID_ = '1tFY8IqyXKdUloW8bSnp1Z1TNmvN6ojHFyqMmgvY_6gU';
const EC_OFFICIAL_FOLDER_ID_ = '17IuUvq4NkLAM7f78Lg6L6JaXh44KCNjj';
const EC_LEDGER_HEADERS_ = ['No_Resit','No_Sijil','Batch','Status','PDF_ID','PDF_URL',
  'Attempts','Updated_At','Updated_By','Note'];
const EC_AUDIT_HEADERS_ = ['Waktu','Operator','Tindakan','No_Resit','Butiran'];
const EC_CORRECTION_HEADERS_ = ['No_Resit','Sesi','Hadir','Alasan','Operator','Waktu'];
const EC_BATCH_HEADERS_ = ['Batch','Status','Closed_At','Closed_By','Snapshot_Hash'];

function ecConfig_() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('EC_MODE') !== 'QA') throw new Error('EC_MODE bukan QA; semua operasi disekat.');
  const cfg = {
    sourceId: p.getProperty('EC_QA_SOURCE_ID') || '',
    ledgerId: p.getProperty('EC_QA_LEDGER_ID') || '',
    templateId: p.getProperty('EC_QA_TEMPLATE_ID') || '',
    folderId: p.getProperty('EC_QA_OUTPUT_FOLDER_ID') || '',
    operators: (p.getProperty('EC_QA_ALLOWED_OPERATORS') || '').toLowerCase().split(',')
      .map(x => x.trim()).filter(Boolean),
    recipient: (p.getProperty('EC_QA_EMAIL') || '').trim().toLowerCase(),
    sendEnabled: false,
    simulatedNow: p.getProperty('EC_QA_NOW') || ''
  };
  if (p.getProperty('EC_QA_SEND_ENABLED') === 'true')
    throw new Error('Phase 2 email disabled; set EC_QA_SEND_ENABLED=false.');
  const idPattern = /^[a-zA-Z0-9_-]{20,}$/;
  if (![cfg.sourceId,cfg.ledgerId,cfg.templateId,cfg.folderId].every(x => idPattern.test(x)))
    throw new Error('Konfigurasi ID QA tidak lengkap.');
  const resources = [cfg.sourceId,cfg.ledgerId,cfg.templateId,cfg.folderId];
  const official = [EC_OFFICIAL_SOURCE_ID_,EC_OFFICIAL_TEMPLATE_ID_,EC_OFFICIAL_FOLDER_ID_];
  if (new Set(resources).size !== 4 || resources.some(id => official.includes(id)))
    throw new Error('QA mesti menggunakan sumber, ledger, template dan folder terasing.');
  if (!cfg.operators.length) throw new Error('Senarai operator QA kosong.');
  return cfg;
}
function ecOperator_(cfg) {
  // Editor-run only. Empty active-user identity is NOT accepted.
  const email = (Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email || !cfg.operators.includes(email)) throw new Error('Operator Google tidak dibenarkan.');
  return email;
}
function ecNow_(cfg) {
  if (!cfg.simulatedNow) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(cfg.simulatedNow))
    throw new Error('EC_QA_NOW mesti ISO 8601 dengan zon masa.');
  const d = new Date(cfg.simulatedNow);
  if (!Number.isFinite(d.getTime())) throw new Error('Jam QA tidak sah.');
  return d;
}
function ecLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw new Error('Operasi lain sedang berjalan.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function ecTab_(ss, title, headers) {
  const tab = ss.getSheetByName(title);
  if (!tab) throw new Error('Tab QA tiada: ' + title + '. Jalankan ecSetupQa() dahulu.');
  const actual = tab.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if (headers.some((h,i) => actual[i] !== h)) throw new Error('Header QA berubah: ' + title);
  return tab;
}
function ecLedger_(cfg) {
  const ss = SpreadsheetApp.openById(cfg.ledgerId);
  return {
    ss,
    issue: ecTab_(ss,'SIJIL_GS',EC_LEDGER_HEADERS_),
    audit: ecTab_(ss,'SIJIL_AUDIT',EC_AUDIT_HEADERS_),
    correction: ecTab_(ss,'SIJIL_CORRECTIONS',EC_CORRECTION_HEADERS_),
    batch: ecTab_(ss,'SIJIL_BATCH',EC_BATCH_HEADERS_)
  };
}
function ecLog_(tab, actor, action, receipt, detail) {
  tab.appendRow([new Date(),actor,action,receipt || '',String(detail || '').slice(0,300)]);
}
function ecRows_(tab) {
  return tab.getLastRow() > 1 ?
    tab.getRange(2,1,tab.getLastRow()-1,tab.getLastColumn()).getValues() : [];
}
function ecRead_(cfg, ledger) {
  const ss = SpreadsheetApp.openById(cfg.sourceId);
  const roster = ss.getSheetByName('Daftar GS');
  const attendance = ss.getSheetByName('KEHADIRAN_GS');
  if (!roster || !attendance) throw new Error('Tab sumber QA tidak lengkap.');
  const people = roster.getDataRange().getDisplayValues();
  const checkins = attendance.getDataRange().getValues();
  const corrections = ledger.correction.getDataRange().getValues();
  const snapshot = ecEvaluate_(people,checkins,corrections);
  if (snapshot.rows.some(row => !/^QA-[A-Z0-9_-]+$/.test(row.receipt) ||
      !/^QA-[A-Z0-9_-]+$/.test(row.certificate) ||
      !/^[^\\s,;@<>]+@[^\\s,;@<>]+\\.invalid$/i.test(row.email)))
    throw new Error('Phase 2 memerlukan resit/sijil QA dan e-mel domain .invalid.');
  return snapshot;
}
function ecDigest_(obj) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(obj));
  return bytes.map(x => ('0'+(x&255).toString(16)).slice(-2)).join('');
}
function ecBatchHash_(snapshot,batch) {
  const relevant = snapshot.rows.filter(r => r.batch === batch).map(r => ({
    receipt:r.receipt, certificate:r.certificate, name:r.name, email:r.email,
    days:r.days, reasons:r.reasons, eligibility:r.eligibility
  })).sort((a,b) => a.receipt.localeCompare(b.receipt));
  const sessions = Object.keys(EC_SESSIONS_).filter(s => EC_SESSIONS_[s].batch === batch);
  const orphans = snapshot.orphans.filter(o => sessions.includes(o.session) || !EC_SESSIONS_[o.session])
    .sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return ecDigest_({relevant,orphans});
}
function ecBatchRecord_(tab,batch) {
  const matches = ecRows_(tab).filter(r => Number(r[0]) === batch);
  if (matches.length > 1) throw new Error('Rekod batch QA berganda.');
  return matches.length ? matches[0] : null;
}
function ecAssertClosed_(ledger,snapshot,batch) {
  const row = ecBatchRecord_(ledger.batch,batch);
  if (!row || row[1] !== 'CLOSED') throw new Error('Batch belum disahkan.');
  if (row[4] !== ecBatchHash_(snapshot,batch))
    throw new Error('Data selepas penutupan berubah. Semakan manual diperlukan.');
}
function ecIssue_(tab,receipt) {
  const rows = ecRows_(tab);
  const matches = rows.map((r,i) => ({row:r,index:i+2}))
    .filter(x => ecKey_(x.row[0]) === receipt);
  if (matches.length > 1) throw new Error('Ledger mengandungi No_Resit pendua.');
  return matches.length ? matches[0] : null;
}
function ecUpdateIssue_(tab,record,actor,status,patch,note) {
  const row = record.row.slice(0,EC_LEDGER_HEADERS_.length);
  row[3] = status;
  if (patch) Object.keys(patch).forEach(k => { row[Number(k)] = patch[k]; });
  row[7] = new Date();
  row[8] = actor;
  row[9] = String(note || '').slice(0,180);
  tab.getRange(record.index,1,1,EC_LEDGER_HEADERS_.length).setValues([row]);
  SpreadsheetApp.flush();
  return row;
}
/** Setup only in the SEPARATE QA ledger workbook. Never writes source. */
function ecSetupQa() {
  const cfg=ecConfig_(), actor=ecOperator_(cfg);
  return ecLock_(() => {
    const ss=SpreadsheetApp.openById(cfg.ledgerId);
    const specs = [
      ['SIJIL_GS',EC_LEDGER_HEADERS_],['SIJIL_AUDIT',EC_AUDIT_HEADERS_],
      ['SIJIL_CORRECTIONS',EC_CORRECTION_HEADERS_],['SIJIL_BATCH',EC_BATCH_HEADERS_]
    ];
    specs.forEach(([name,head]) => {
      let tab=ss.getSheetByName(name);
      if (!tab) {
        tab=ss.insertSheet(name);
        tab.getRange(1,1,1,head.length).setValues([head]);
        tab.setFrozenRows(1);
      } else ecTab_(ss,name,head);
    });
    ecLog_(ss.getSheetByName('SIJIL_AUDIT'),actor,'QA_SETUP','','No production changes');
    return 'QA ledger ready';
  });
}
/** Read-only eligibility preview. Invoke from editor, never a public endpoint. */
function ecPreviewQa() {
  const cfg=ecConfig_(); ecOperator_(cfg);
  const ledger=ecLedger_(cfg), snapshot=ecRead_(cfg,ledger);
  return {
    counts: snapshot.rows.reduce((a,r) => (a[r.eligibility]=(a[r.eligibility]||0)+1,a),{}),
    orphans: snapshot.orphans.length,
    rows: snapshot.rows.map(r => ({receipt:r.receipt,batch:r.batch,
      days:r.days,eligibility:r.eligibility,reasons:r.reasons}))
  };
}
/** Append-only correction. Allowed only before batch closure. */
function ecCorrectQa(receipt,session,present,reason) {
  const cfg=ecConfig_(),actor=ecOperator_(cfg);
  return ecLock_(() => {
    const ledger=ecLedger_(cfg), snapshot=ecRead_(cfg,ledger);
    const key=ecKey_(receipt),matches=snapshot.rows.filter(r => r.receipt===key);
    if (matches.length!==1) throw new Error('No_Resit tidak unik.');
    const p=matches[0],s=EC_SESSIONS_[String(session||'').toLowerCase()];
    if (!s || s.batch!==p.batch) throw new Error('Sesi bukan batch peserta.');
    if (ecBatchRecord_(ledger.batch,p.batch)) throw new Error('Batch telah ditutup.');
    if (typeof present!=='boolean' || ecText_(reason).length<10)
      throw new Error('Keputusan boolean dan alasan sekurang-kurangnya 10 aksara diperlukan.');
    ledger.correction.appendRow([key,String(session).toLowerCase(),present,
      ecText_(reason).slice(0,250),actor,new Date()]);
    ecLog_(ledger.audit,actor,'CORRECTION',key,String(session)+'='+present);
    return 'Pembetulan QA direkod';
  });
}
/** Close only after Day 2, with no review or orphan check-in for that batch. */
function ecBatchEnded_(now,batch) {
  if (![1,2].includes(batch)) throw new Error('Batch tidak sah.');
  const lastDay = batch === 1 ? '2026-11-29' : '2026-12-06';
  const today = ecMalaysiaDate_(now);
  return !!today && today > lastDay;
}
function ecCloseBatchQa(batch) {
  const cfg=ecConfig_(),actor=ecOperator_(cfg);
  return ecLock_(() => {
    batch=Number(batch);
    if (![1,2].includes(batch)) throw new Error('Batch tidak sah.');
    if (!ecBatchEnded_(ecNow_(cfg),batch)) throw new Error('Hari kedua belum selesai.');
    const ledger=ecLedger_(cfg),snapshot=ecRead_(cfg,ledger);
    if (ecBatchRecord_(ledger.batch,batch)) throw new Error('Batch sudah ditutup.');
    if (!snapshot.rows.some(r => r.batch===batch)) throw new Error('Tiada peserta dalam batch QA.');
    if (snapshot.rows.some(r => r.batch===batch && r.eligibility==='REVIEW'))
      throw new Error('Ada peserta memerlukan semakan.');
    const sessions=Object.keys(EC_SESSIONS_).filter(s=>EC_SESSIONS_[s].batch===batch);
    if (snapshot.orphans.some(o => sessions.includes(o.session) || !EC_SESSIONS_[o.session]))
      throw new Error('Ada check-in tanpa padanan.');
    ledger.batch.appendRow([batch,'CLOSED',new Date(),actor,ecBatchHash_(snapshot,batch)]);
    ecLog_(ledger.audit,actor,'BATCH_CLOSED','',String(batch));
    return 'Batch '+batch+' ditutup untuk QA';
  });
}
/** Approve ONE eligible receipt only; no bulk operation. */
function ecApproveQa(receipt) {
  const cfg=ecConfig_(),actor=ecOperator_(cfg);
  return ecLock_(() => {
    const ledger=ecLedger_(cfg),snapshot=ecRead_(cfg,ledger),key=ecKey_(receipt);
    const matches=snapshot.rows.filter(r => r.receipt===key);
    if (matches.length!==1 || matches[0].eligibility!=='ELIGIBLE')
      throw new Error('Peserta tidak layak atau memerlukan semakan.');
    const p=matches[0];
    ecAssertClosed_(ledger,snapshot,p.batch);
    if (ecIssue_(ledger.issue,key)) throw new Error('No_Resit sudah mempunyai rekod sijil.');
    if (ecRows_(ledger.issue).some(r => ecKey_(r[1])===p.certificate))
      throw new Error('No_Sijil sudah digunakan.');
    ledger.issue.appendRow([key,p.certificate,p.batch,'APPROVED','','',0,new Date(),actor,'']);
    ecLog_(ledger.audit,actor,'APPROVED',key,'QA');
    return 'Diluluskan: '+key;
  });
}
/** Generate one QA PDF. Persist GENERATING before any Drive operation; no automatic retry. */
function ecGenerateQa(receipt) {
  const cfg=ecConfig_(),actor=ecOperator_(cfg);
  return ecLock_(() => {
    const ledger=ecLedger_(cfg),snapshot=ecRead_(cfg,ledger),key=ecKey_(receipt);
    const match=snapshot.rows.filter(r => r.receipt===key);
    if (match.length!==1 || match[0].eligibility!=='ELIGIBLE')
      throw new Error('Kelayakan tidak sah.');
    const p=match[0];
    ecAssertClosed_(ledger,snapshot,p.batch);
    const record=ecIssue_(ledger.issue,key);
    if (!record || record.row[3]!=='APPROVED') throw new Error('Status APPROVED diperlukan.');
    if (ecKey_(record.row[1]) !== p.certificate || Number(record.row[2]) !== p.batch ||
        ecRows_(ledger.issue).filter(row => ecKey_(row[1]) === p.certificate).length !== 1)
      throw new Error('Identiti atau nombor sijil ledger bercanggah.');
    ecUpdateIssue_(ledger.issue,record,actor,'GENERATING',null,'QA Drive operation reserved');
    ecLog_(ledger.audit,actor,'GENERATING',key,'QA');
    try {
      const folder=DriveApp.getFolderById(cfg.folderId);
      const slideFile=DriveApp.getFileById(cfg.templateId)
        .makeCopy('QA-SLIDES-'+p.certificate,folder);
      const presentation=SlidesApp.openById(slideFile.getId());
      const tags=[
        ['<<Nama_Peserta>>',p.name],
        ['<<Batch>>','Batch '+p.batch+' — QA'],
        ['<<No_Sijil>>',p.certificate]
      ];
      tags.forEach(([tag,value]) => {
        if (presentation.replaceAllText(tag,value)<1)
          throw new Error('Tag template tiada: '+tag);
      });
      const first=presentation.getSlides()[0];
      if (!first) throw new Error('Template tiada slide.');
      const mark=first.insertTextBox('UJIAN SAHAJA — TIDAK SAH',25,10,650,35);
      mark.getText().getTextStyle().setForegroundColor('#B00020')
        .setFontSize(18).setBold(true);
      presentation.saveAndClose();
      const blob=DriveApp.getFileById(slideFile.getId()).getAs(MimeType.PDF)
        .setName('QA-'+p.certificate+'.pdf');
      const pdf=folder.createFile(blob);
      const latest=ecIssue_(ledger.issue,key);
      ecUpdateIssue_(ledger.issue,latest,actor,'GENERATED',
        {4:pdf.getId(),5:pdf.getUrl()},'PDF generated; no email');
      ecLog_(ledger.audit,actor,'GENERATED',key,'QA PDF '+pdf.getId());
      return {status:'GENERATED',pdfId:pdf.getId(),pdfUrl:pdf.getUrl()};
    } catch(err) {
      // Partial Drive writes may exist. No retry until a human reconciles.
      const latest=ecIssue_(ledger.issue,key);
      ecUpdateIssue_(ledger.issue,latest,actor,'REVIEW_REQUIRED',null,'Partial Drive output possible');
      ecLog_(ledger.audit,actor,'GENERATION_REVIEW_REQUIRED',key,'Manual reconciliation required');
      throw err;
    }
  });
}
/** Phase 2 execution-level interlock. No MailApp invocation is present. */
function ecSendQa(receipt) {
  throw new Error('Phase 2 email disabled. Tiada penghantaran dibenarkan.');
}
/** Reconcile a confirmed delivery; does not send any email. */
function ecConfirmReceivedQa(receipt,evidence) {
  const cfg=ecConfig_(),actor=ecOperator_(cfg);
  return ecLock_(() => {
    if (ecText_(evidence).length<10) throw new Error('Bukti penerimaan diperlukan.');
    const ledger=ecLedger_(cfg),key=ecKey_(receipt),record=ecIssue_(ledger.issue,key);
    if (!record || !['SEND_UNKNOWN','SENT'].includes(record.row[3]))
      throw new Error('Tiada penghantaran untuk disahkan.');
    ecUpdateIssue_(ledger.issue,record,actor,'SENT',null,'Receipt confirmed by owner');
    ecLog_(ledger.audit,actor,'INBOX_CONFIRMED',key,'Owner evidence recorded');
    return 'Inbox confirmation recorded';
  });
}
