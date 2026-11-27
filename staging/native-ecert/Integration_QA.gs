/**
 * Phase 2 isolated Google integration. Fictional fixtures only.
 * No email service, deployment, triggers or official spreadsheet access.
 * Run phase2Prepare, then phase2Verify after reviewing the logged resources.
 */
function phase2Prepare() {
  const props = PropertiesService.getScriptProperties();
  const actor = Session.getActiveUser().getEmail().trim().toLowerCase();
  if (!actor || actor !== Session.getEffectiveUser().getEmail().trim().toLowerCase())
    throw new Error('Editor operator identity required.');
  if (props.getProperty('EC_PHASE2_READY')) { phase2Inspect(); return; }
  if (props.getProperty('EC_PHASE2_SETUP_STARTED')) throw new Error('Inspect partial QA setup before recovery.');
  props.setProperty('EC_PHASE2_SETUP_STARTED',new Date().toISOString());
  const root = DriveApp.createFolder('GS26_PHASE2_INTEGRATION_QA_20261127');
  props.setProperty('EC_PHASE2_ROOT',root.getId());
  const source = SpreadsheetApp.create('GS26 PHASE2 QA SOURCE — FICTIONAL');
  const ledger = SpreadsheetApp.create('GS26 PHASE2 QA LEDGER — NO EMAIL');
  source.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');
  ledger.setSpreadsheetTimeZone('Asia/Kuala_Lumpur');
  DriveApp.getFileById(source.getId()).moveTo(root);
  DriveApp.getFileById(ledger.getId()).moveTo(root);
  const template = DriveApp.getFileById(EC_OFFICIAL_TEMPLATE_ID_).makeCopy('GS26 PHASE2 QA TEMPLATE',root);
  const output = root.createFolder('QA PDF OUTPUT');
  const fixture = {"rh":["Email address","Nama penuh","Pilihan batch program","No_Resit","No_Sijil","Merged Doc ID - eCERT GS26","Document Merge Status - eCERT GS26"],"ah":["Checkin_ID","Sesi","No_Resit","Waktu_Checkin","Kaedah","Direkod_Oleh"],"people":[["a@example.invalid","PESERTA A","Batch 1","QA-A","QA-SA","",""],["b@example.invalid","PESERTA B","Batch 1","QA-B","QA-SB","",""],["c@example.invalid","PESERTA C","Batch 2","QA-C","QA-SC","",""],["d@example.invalid","PESERTA D","Batch 2","QA-D","QA-SD","",""],["e@example.invalid","PESERTA E","Batch 2","QA-E","QA-SD","",""]],"rows":[["A1","b1d1","QA-A","2026-11-28T09:00:00+08:00","QR PESERTA","OPERATOR QA"],["A2","b1d2","QA-A","2026-11-29T09:00:00+08:00","QR PESERTA","OPERATOR QA"],["B1","b1d1","QA-B","2026-11-28T09:00:00+08:00","QR PESERTA","OPERATOR QA"],["C1","b1d1","QA-C","2026-11-28T09:00:00+08:00","QR PESERTA","OPERATOR QA"]]};
  const roster = source.getSheets()[0].setName('Daftar GS');
  const attendance = source.insertSheet('KEHADIRAN_GS');
  roster.getRange(1,1,fixture.people.length+1,fixture.rh.length).setValues([fixture.rh].concat(fixture.people));
  const records = fixture.rows.map(row => {row[3] = new Date(row[3]);return row;});
  attendance.getRange(1,1,records.length+1,fixture.ah.length).setValues([fixture.ah].concat(records));
  roster.setFrozenRows(1);attendance.setFrozenRows(1);
  props.setProperties({
    EC_MODE:'QA', EC_QA_SOURCE_ID:source.getId(), EC_QA_LEDGER_ID:ledger.getId(),
    EC_QA_TEMPLATE_ID:template.getId(), EC_QA_OUTPUT_FOLDER_ID:output.getId(),
    EC_QA_ALLOWED_OPERATORS:actor,EC_QA_SEND_ENABLED:'false',EC_QA_NOW:'2026-11-30T00:00:00+08:00',
    EC_QA_TEST_BATCH:'1',EC_QA_TEST_RECEIPT:'QA-A'
  });
  ecSetupQa();
  props.setProperty('EC_PHASE2_READY','true');
  phase2Inspect();
}
function phase2Inspect() {
  const cfg = ecConfig_();ecOperator_(cfg);
  console.log(JSON.stringify({sourceId:cfg.sourceId,ledgerId:cfg.ledgerId,templateId:cfg.templateId,
    folderId:cfg.folderId,operatorVerified:true,emailEnabled:cfg.sendEnabled,
    clock:cfg.simulatedNow,preview:ecPreviewQa(),
    ledger:ecRows_(ecLedger_(cfg).issue),batch:ecRows_(ecLedger_(cfg).batch),
    auditEvents:ecRows_(ecLedger_(cfg).audit).map(row => row[2]),pdfCount:phase2PdfCount_(cfg)}));
}
function phase2Check_(condition,label) {
  if (!condition) throw new Error('FAIL '+label);
  console.log('PASS '+label);
}
function phase2Reject_(run,pattern,label) {
  let rejected=false;
  try {run();} catch(error) {if (!pattern.test(String(error.message))) throw error;rejected=true;}
  phase2Check_(rejected,label);
}
function phase2PdfCount_(cfg) {
  const files = DriveApp.getFolderById(cfg.folderId).getFilesByType(MimeType.PDF);
  let count=0;while(files.hasNext()){files.next();count++;}
  return count;
}
function phase2Verify() {
  const props=PropertiesService.getScriptProperties(),cfg=ecConfig_(),actor=ecOperator_(cfg);
  if (props.getProperty('EC_PHASE2_VERIFICATION_STARTED')) throw new Error('Verification already started; inspect ledger instead of rerunning.');
  props.setProperty('EC_PHASE2_VERIFICATION_STARTED',new Date().toISOString());
  const ledger=ecLedger_(cfg), before=ecRead_(cfg,ledger);
  const source=SpreadsheetApp.openById(cfg.sourceId);
  const beforeHash=ecDigest_(source.getSheets().map(tab => tab.getDataRange().getValues()));
  const expected={'QA-A':'ELIGIBLE','QA-B':'NOT_ELIGIBLE','QA-C':'REVIEW','QA-D':'REVIEW','QA-E':'REVIEW'};
  before.rows.forEach(row => phase2Check_(row.eligibility===expected[row.receipt],row.receipt+' '+row.eligibility));
  props.setProperty('EC_QA_NOW','2026-11-29T23:59:59+08:00');
  phase2Reject_(() => ecCloseBatchQa(1),/Hari kedua/,'Closure blocked before Day2 ends');
  props.setProperty('EC_QA_NOW','2026-11-30T00:00:00+08:00');
  ecCloseBatchQa(1);
  phase2Reject_(() => ecApproveQa('QA-B'),/tidak layak/,'One-day participant cannot be approved');
  ecApproveQa('QA-A');
  props.setProperty('EC_PHASE2_FAIL_AFTER_COPY','true');
  phase2Reject_(() => ecGenerateQa('QA-A'),/QA injected failure/,'Partial Slides failure surfaced');
  props.deleteProperty('EC_PHASE2_FAIL_AFTER_COPY');
  phase2Check_(ecIssue_(ledger.issue,'QA-A').row[3]==='REVIEW_REQUIRED','Failure ledger REVIEW_REQUIRED');
  phase2Reject_(() => ecGenerateQa('QA-A'),/APPROVED/,'Partial failure cannot auto-retry');
  phase2Check_(phase2PdfCount_(cfg)===0,'Zero PDF before explicit recovery');
  // Explicit QA recovery. The attempt produced only a Slides copy, recorded in audit.
  const partials=ecRows_(ledger.audit).filter(row => row[2]==='SLIDES_CREATED' && row[3]==='QA-A');
  phase2Check_(partials.length===1,'One partial Slides copy identified');
  const partialId=String(partials[0][4]);
  const partial=DriveApp.getFileById(partialId);
  phase2Check_(partial.getMimeType()===MimeType.GOOGLE_SLIDES,'Partial output is Slides');
  const quarantine=DriveApp.getFolderById(props.getProperty('EC_PHASE2_ROOT')).createFolder('QA PARTIAL QUARANTINE');
  partial.moveTo(quarantine);
  ecUpdateIssue_(ledger.issue,ecIssue_(ledger.issue,'QA-A'),actor,'APPROVED',null,'QA explicit recovery: no PDF, partial Slides quarantined');
  ecLog_(ledger.audit,actor,'QA_RECOVERY_APPROVED','QA-A',partialId);
  const result=ecGenerateQa('QA-A');
  phase2Check_(result.status==='GENERATED','One PDF generated');
  const record=ecIssue_(ledger.issue,'QA-A').row;
  phase2Check_(record[3]==='GENERATED' && record[4]===result.pdfId,'Ledger PDF ID matches output');
  phase2Check_(DriveApp.getFileById(result.pdfId).getName()==='QA-QA-SA.pdf','PDF filename matches contract');
  phase2Reject_(() => ecGenerateQa('QA-A'),/APPROVED/,'Repeat generation blocked');
  phase2Check_(phase2PdfCount_(cfg)===1,'Exactly one PDF after duplicate attempt');
  props.setProperty('EC_QA_ALLOWED_OPERATORS','denied@example.invalid');
  phase2Reject_(() => ecPreviewQa(),/Operator Google/,'Unauthorised operator rejected');
  props.setProperty('EC_QA_ALLOWED_OPERATORS',actor);
  props.setProperty('EC_QA_SEND_ENABLED','true');
  phase2Reject_(() => ecConfig_(),/email disabled/,'Configuration email escalation rejected');
  props.setProperty('EC_QA_SEND_ENABLED','false');
  phase2Reject_(() => ecSendQa('QA-A'),/email disabled/,'Execution email interlock rejected');
  // Fabricated uncertain state tests retry behaviour with zero transmission.
  ecUpdateIssue_(ledger.issue,ecIssue_(ledger.issue,'QA-A'),actor,'SEND_UNKNOWN',{6:1},'QA state simulation only; email transport absent');
  ecLog_(ledger.audit,actor,'QA_UNKNOWN_SIMULATION','QA-A','No send attempted');
  phase2Reject_(() => ecGenerateQa('QA-A'),/APPROVED/,'Unknown state blocks generation');
  phase2Reject_(() => ecSendQa('QA-A'),/email disabled/,'Unknown state cannot send');
  ecUpdateIssue_(ledger.issue,ecIssue_(ledger.issue,'QA-A'),actor,'GENERATED',{6:0},'QA simulation ended; transport never invoked');
  ecLog_(ledger.audit,actor,'QA_UNKNOWN_SIMULATION_ENDED','QA-A','Restored generated PDF without transmission');
  phase2Check_(beforeHash===ecDigest_(source.getSheets().map(tab => tab.getDataRange().getValues())),'QA source unchanged by engine');
  props.setProperty('EC_PHASE2_VERIFIED','true');
  console.log(JSON.stringify({result:'PASS',pdfId:result.pdfId,pdfUrl:result.pdfUrl,
    pdfCount:phase2PdfCount_(cfg),ledgerStatus:ecIssue_(ledger.issue,'QA-A').row[3],
    sentEmails:0,unknownTest:'SIMULATED_STATE_WITHOUT_TRANSPORT',sourceUnchanged:true}));
}

/** Read-only negative tests against configured resource IDs and frozen snapshot. */
function phase2SecurityChecks() {
  const cfg=ecConfig_(),actor=ecOperator_(cfg),props=PropertiesService.getScriptProperties();
  const ledger=ecLedger_(cfg),snapshot=ecRead_(cfg,ledger);
  snapshot.rows.find(row => row.receipt==='QA-A').name='QA CHANGED AFTER APPROVAL';
  phase2Reject_(() => ecAssertClosed_(ledger,snapshot,1),/Data selepas penutupan berubah/,'Frozen snapshot mismatch blocked');
  const keys=['EC_QA_SOURCE_ID','EC_QA_LEDGER_ID','EC_QA_TEMPLATE_ID','EC_QA_OUTPUT_FOLDER_ID'];
  keys.forEach(key => {
    const prior=props.getProperty(key);
    try {
      props.setProperty(key,EC_OFFICIAL_SOURCE_ID_);
      phase2Reject_(() => ecConfig_(),/terasing/,'Official source ID blocked in '+key);
    } finally {props.setProperty(key,prior);}
  });
  const previous=props.getProperty('EC_QA_OUTPUT_FOLDER_ID');
  try {
    props.setProperty('EC_QA_OUTPUT_FOLDER_ID',EC_OFFICIAL_FOLDER_ID_);
    phase2Reject_(() => ecConfig_(),/terasing/,'Official output folder denied');
  } finally {props.setProperty('EC_QA_OUTPUT_FOLDER_ID',previous);}
  phase2Check_(ecRows_(ledger.issue).length===1,'Exactly one issuance ledger row');
  phase2Check_(phase2PdfCount_(cfg)===1,'Exactly one final PDF retained');
  phase2Inspect();
}
