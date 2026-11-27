/** Editor-run Phase 3 fixtures. Bootstrap never reads any official registration workbook. */
function phase3Prepare() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('EC3_READY')) {phase3Inspect();return;}
  const lock = LockService.getScriptLock();lock.waitLock(15000);
  try {
    if (props.getProperty('EC3_SETUP_STARTED')) throw new Error('Inspect partial setup before recovery.');
    const actor = Session.getActiveUser().getEmail().trim().toLowerCase();
    if (!actor || actor !== Session.getEffectiveUser().getEmail().trim().toLowerCase())
      throw new Error('Explicit editor identity required.');
    props.setProperty('EC3_SETUP_STARTED',new Date().toISOString());
    const root = DriveApp.createFolder('GS26_PHASE3_RELIABILITY_QA_20261127');
    const source = SpreadsheetApp.create('GS26 PHASE3 QA SOURCE — FICTIONAL');
    const ledger = SpreadsheetApp.create('GS26 PHASE3 QA LEDGER — NO EMAIL');
    source.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');ledger.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');
    DriveApp.getFileById(source.getId()).moveTo(root);DriveApp.getFileById(ledger.getId()).moveTo(root);
    // This existing template is the verified Phase 2 QA copy, not the official template.
    const templateSource = DriveApp.getFileById('1mQhWLQOM9FDLIjJ6QH_3dekIg6khbA7TVJiUf-q7UF4');
    if (templateSource.getName() !== 'GS26 PHASE2 QA TEMPLATE') throw new Error('QA template name mismatch.');
    const template = templateSource.makeCopy('GS26 PHASE3 QA TEMPLATE',root);
    const folder = root.createFolder('PHASE3 QA OUTPUT');
    const rh = ['Email address','Nama penuh','Pilihan batch program','No_Resit','No_Sijil',
      'Merged Doc ID - eCERT GS26','Document Merge Status - eCERT GS26'];
    const ah = ['Checkin_ID','Sesi','No_Resit','Waktu_Checkin','Kaedah','Direkod_Oleh','Nota'];
    const participants = [
      ['concurrent@example.invalid','PESERTA QA CONCURRENT','Batch 1','QA-P3-CONCURRENT','QA-P3-SCONCURRENT','',''],
      ['crash@example.invalid','PESERTA QA POST PDF','Batch 1','QA-P3-CRASH','QA-P3-SCRASH','',''],
      ['batchtwo@example.invalid','PESERTA QA BATCH DUA','Batch 2','QA-P3-B2','QA-P3-SB2','',''],
      ['interrupt@example.invalid','PESERTA QA INTERRUPT','Batch 1','QA-P3-INTERRUPT','QA-P3-SINTERRUPT','',''],
      ['oneday@example.invalid','PESERTA QA SATU HARI','Batch 2','QA-P3-ONE','QA-P3-SONE','','']
    ];
    const attendance = [];
    participants.forEach(person => {
      const batch = person[2] === 'Batch 1' ? 1 : 2;
      [1,2].forEach(day => {
        if (person[3] === 'QA-P3-ONE' && day === 2) return;
        const session = 'b'+batch+'d'+day;
        attendance.push([person[3]+'-'+day,session,person[3],
          new Date(EC_SESSIONS_[session].date+'T09:00:00+08:00'),day===1?'QR PESERTA':'URUS SETIA','QA OPERATOR','REKAAN']);
      });
    });
    const roster = source.getSheets()[0].setName('Daftar GS');
    roster.getRange(1,1,participants.length+1,rh.length).setValues([rh].concat(participants));
    source.insertSheet('KEHADIRAN_GS').getRange(1,1,attendance.length+1,ah.length).setValues([ah].concat(attendance));
    props.setProperties({EC_MODE:'QA',EC_RELIABILITY_VERSION:'3',EC_QA_PROJECT_ID:ScriptApp.getScriptId(),
      EC_QA_SOURCE_ID:source.getId(),EC_QA_LEDGER_ID:ledger.getId(),EC_QA_TEMPLATE_ID:template.getId(),
      EC_QA_OUTPUT_FOLDER_ID:folder.getId(),EC_QA_ALLOWED_OPERATORS:actor,EC_QA_SEND_ENABLED:'false',
      EC_QA_RECOVERY_OPERATORS:actor,EC_QA_NOW:'2026-12-07T00:00:00+08:00',EC3_ROOT_ID:root.getId()});
  } finally {lock.releaseLock();}
  ecSetupQa();
  ecCloseBatchQa(1);
  const propsAgain = PropertiesService.getScriptProperties();
  propsAgain.setProperty('EC_QA_NOW','2026-12-06T23:59:59+08:00');
  phase3Reject_(() => ecCloseBatchQa(2),/Hari kedua/,'BATCH2_DAY_END_BLOCK');
  propsAgain.setProperty('EC_QA_NOW','2026-12-07T00:00:00+08:00');
  ecCloseBatchQa(2);
  ecApproveQa('QA-P3-CONCURRENT');ecApproveQa('QA-P3-CRASH');ecApproveQa('QA-P3-B2');ecApproveQa('QA-P3-INTERRUPT');
  phase3Reject_(() => ecApproveQa('QA-P3-ONE'),/tidak layak/,'BATCH2_ONE_DAY_BLOCK');
  const cfg = ecReliableConfig_(),source = SpreadsheetApp.openById(cfg.sourceId);
  propsAgain.setProperty('EC3_SOURCE_HASH',ecDigest_(source.getSheets().map(tab => tab.getDataRange().getValues())));
  propsAgain.setProperty('EC3_READY','true');
  phase3Inspect();
}
function phase3Reject_(operation,pattern,label) {
  let rejected = false;
  try {operation();} catch(error) {
    if (!pattern.test(String(error.message))) throw error;
    rejected = true;
  }
  if (!rejected) throw new Error('FAIL '+label);
  console.log('PASS '+label);
}
function phase3ConcurrentA() {
  ecReliableConfig_();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('EC3_HOLD_AFTER_RESERVE_MS','30000');
  console.log(JSON.stringify({request:'A',entered:new Date().toISOString()}));
  try {console.log(JSON.stringify(ecGenerateQa('QA-P3-CONCURRENT')));}
  finally {props.deleteProperty('EC3_HOLD_AFTER_RESERVE_MS');}
}
function phase3ConcurrentB() {
  console.log(JSON.stringify({request:'B',entered:new Date().toISOString()}));
  phase3Reject_(() => ecGenerateQa('QA-P3-CONCURRENT'),/Operasi lain|already reserved/,'OVERLAPPING_OR_REPEATED_REQUEST_BLOCKED');
  console.log(JSON.stringify({request:'B',exited:new Date().toISOString()}));
}
function phase3PostPdfFailure() {
  ecReliableConfig_();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('EC3_FAULT','AFTER_PDF');
  try {phase3Reject_(() => ecGenerateQa('QA-P3-CRASH'),/QA fault after PDF/,'POST_PDF_FAILURE');}
  finally {props.deleteProperty('EC3_FAULT');}
  phase3Reject_(() => ecGenerateQa('QA-P3-CRASH'),/already reserved/,'POST_PDF_RETRY_BLOCKED');
  console.log(JSON.stringify(ecReconcileQa('QA-P3-CRASH')));
}
function phase3BatchTwo() {
  console.log(JSON.stringify(ecGenerateQa('QA-P3-B2')));
  phase3Reject_(() => ecGenerateQa('QA-P3-B2'),/already reserved/,'BATCH2_DUPLICATE_BLOCKED');
  phase3Inspect();
}
function phase3Inspect() {
  const cfg = ecReliableConfig_(), ledger = ecLedger_(cfg), props = PropertiesService.getScriptProperties();
  const source = SpreadsheetApp.openById(cfg.sourceId);
  console.log(JSON.stringify({sourceId:cfg.sourceId,ledgerId:cfg.ledgerId,templateId:cfg.templateId,
    folderId:cfg.folderId,projectId:ScriptApp.getScriptId(),emailEnabled:cfg.sendEnabled,
    preview:ecPreviewQa(),ledger:ecRows_(ledger.issue),batch:ecRows_(ledger.batch),
    audit:ecRows_(ledger.audit),sourceUnchanged:props.getProperty('EC3_SOURCE_HASH') ===
      ecDigest_(source.getSheets().map(tab => tab.getDataRange().getValues()))}));
}
function phase3ReconcileCrash() {
  console.log(JSON.stringify(ecReconcileQa('QA-P3-CRASH')));
}

function phase3InterruptA() {
  ecReliableConfig_();
  const props = PropertiesService.getScriptProperties();
  props.setProperty('EC3_HOLD_AFTER_RESERVE_MS','45000');
  try {console.log(JSON.stringify(ecGenerateQa('QA-P3-INTERRUPT')));}
  finally {props.deleteProperty('EC3_HOLD_AFTER_RESERVE_MS');}
}
function phase3InspectInterrupted() {
  ecReliableConfig_();
  PropertiesService.getScriptProperties().deleteProperty('EC3_HOLD_AFTER_RESERVE_MS');
  phase3Reject_(() => ecGenerateQa('QA-P3-INTERRUPT'),/already reserved/,'INTERRUPTED_ATTEMPT_CANNOT_RETRY');
  console.log(JSON.stringify(ecReconcileQa('QA-P3-INTERRUPT')));
}
function phase3ConflictEvidence() {
  const cfg=ecReliableConfig_(),actor=ecOperator_(cfg),ledger=ecLedger_(cfg);
  const original=ecIssue_(ledger.issue,'QA-P3-CRASH');
  const attempt=ecAttempt_(cfg,'QA-P3-CRASH');
  if (!original || original.row[3]!=='REVIEW_REQUIRED') throw new Error('Post-PDF test must be reviewed first.');
  const other=ecIssue_(ledger.issue,'QA-P3-CONCURRENT');
  if (!other || other.row[3]!=='GENERATED') throw new Error('Concurrent test PDF required.');
  ecLock_(() => {
    ecUpdateIssue_(ledger.issue,original,actor,'REVIEW_REQUIRED',{4:other.row[4]},'QA conflict injection '+attempt.id);
    ecLog_(ledger.audit,actor,'QA_CONFLICT_INJECTED',attempt.receipt,attempt.id);
  });
  try {
    const report=ecReconcileQa(attempt.receipt);
    if (report.recoverable || report.reconciliationStatus!=='REVIEW_REQUIRED') throw new Error('Conflict accepted.');
    console.log('PASS CONFLICTING_EVIDENCE_REVIEW_REQUIRED');
    phase3Reject_(() => ecRecoverExistingPdfQa(attempt.receipt,attempt.id,report.evidenceHash,
      'OWNER authorised isolated QA conflict rejection test','LINK_EXISTING_PDF_ONLY'),/not conclusive/,'CONFLICTING_RECOVERY_REJECTED');
  } finally {
    ecLock_(() => {
      ecUpdateIssue_(ledger.issue,ecIssue_(ledger.issue,attempt.receipt),actor,'REVIEW_REQUIRED',
        {4:original.row[4]},'QA conflict removed after test '+attempt.id);
      ecLog_(ledger.audit,actor,'QA_CONFLICT_TEST_ENDED',attempt.receipt,attempt.id);
    });
  }
  console.log(JSON.stringify(ecReconcileQa(attempt.receipt)));
}

/** Separate execution; review data must be entered explicitly in Script Properties. */
function phase3RecoverReviewedCrash() {
  const cfg=ecReliableConfig_();
  const review=JSON.parse(PropertiesService.getScriptProperties().getProperty('EC3_RECOVERY_REVIEW') || '{}');
  const before=ecReconcileQa('QA-P3-CRASH');
  const result=ecRecoverExistingPdfQa('QA-P3-CRASH',review.attemptId,review.evidenceHash,
    review.reason,review.confirmation);
  const after=ecReconcileQa('QA-P3-CRASH');
  const pdfsBefore=before.output.filter(file => file.mime===MimeType.PDF);
  const pdfsAfter=after.output.filter(file => file.mime===MimeType.PDF);
  if (pdfsBefore.length!==1 || pdfsAfter.length!==1 || pdfsBefore[0].id!==pdfsAfter[0].id ||
      pdfsBefore[0].hash!==pdfsAfter[0].hash || after.ledgerStatus!=='GENERATED')
    throw new Error('Recovery evidence mismatch.');
  phase3Reject_(() => ecGenerateQa('QA-P3-CRASH'),/already reserved/,'RECOVERED_PDF_CANNOT_REGENERATE');
  console.log(JSON.stringify({event:'RECOVERY_VERIFIED',result,pdfHash:pdfsAfter[0].hash,
    pdfCount:pdfsAfter.length,ledgerStatus:after.ledgerStatus}));
}

/** Final read-only assertions. No generation, recovery or state repair. */
function phase3FinalVerification() {
  const cfg=ecReliableConfig_(), ledger=ecLedger_(cfg), props=PropertiesService.getScriptProperties();
  function snapshot() {
    const files=[], iterator=DriveApp.getFolderById(cfg.folderId).getFiles();
    while(iterator.hasNext()) {const f=iterator.next();files.push([f.getId(),f.getName(),f.getMimeType()]);}
    files.sort((a,b)=>a[0].localeCompare(b[0]));
    return {issues:ecRows_(ledger.issue),audit:ecRows_(ledger.audit),properties:Object.entries(props.getProperties()).sort((a,b)=>a[0].localeCompare(b[0])),files};
  }
  const before=snapshot(), reports=['QA-P3-CONCURRENT','QA-P3-CRASH','QA-P3-B2','QA-P3-INTERRUPT'].map(ecReconcileQa);
  const after=snapshot();
  if (ecDigest_(before)!==ecDigest_(after)) throw new Error('Reconciliation changed state.');
  if (reports.slice(0,3).some(r=>r.reconciliationStatus!=='COMPLETE' || r.output.filter(f=>f.mime===MimeType.PDF).length!==1))
    throw new Error('Completed issuance inconsistency.');
  if (reports[3].reconciliationStatus!=='REVIEW_REQUIRED' || reports[3].output.length!==0) throw new Error('Abandoned attempt guard.');
  if (before.files.filter(f=>f[2]===MimeType.PDF).length!==3 || before.files.filter(f=>f[2]===MimeType.GOOGLE_SLIDES).length!==3)
    throw new Error('Unexpected output count.');
  if (new Set(before.issues.map(r=>r[10])).size!==4) throw new Error('Attempt identities not unique.');
  console.log(JSON.stringify({event:'FINAL_READ_ONLY_VERIFIED',pdfCount:3,slidesCount:3,attemptCount:4,
    reconciliationUnchanged:true,emailEnabled:false,reports:reports.map(r=>({receipt:r.receipt,
    attemptId:r.attempt.id,status:r.reconciliationStatus,pdfId:r.ledgerPdfId}))}));
  phase3Inspect();
}
