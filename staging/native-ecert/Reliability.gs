/** Durable single-project QA issuance. Every reservation survives catchable failures. */
function ecReliableConfig_() {
  const cfg = ecConfig_();
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('EC_RELIABILITY_VERSION') !== '3' ||
      props.getProperty('EC_QA_PROJECT_ID') !== ScriptApp.getScriptId())
    throw new Error('Phase 3 requires its own bound QA project.');
  ecOperator_(cfg);
  const active = Session.getActiveUser().getEmail().trim().toLowerCase();
  const effective = Session.getEffectiveUser().getEmail().trim().toLowerCase();
  if (active !== effective) throw new Error('Execution ownership does not match operator.');
  return cfg;
}
function ecAttemptKey_(receipt) {
  return 'EC3_ATTEMPT_' + ecDigest_(ecKey_(receipt));
}
function ecResourceHash_(cfg) {
  return ecDigest_([ScriptApp.getScriptId(),cfg.sourceId,cfg.ledgerId,cfg.templateId,cfg.folderId]);
}
function ecAttempt_(cfg,receipt) {
  const raw = PropertiesService.getScriptProperties().getProperty(ecAttemptKey_(receipt));
  if (!raw) return null;
  const attempt = JSON.parse(raw);
  if (attempt.receipt !== ecKey_(receipt) || attempt.resources !== ecResourceHash_(cfg))
    throw new Error('Attempt identity or resource binding mismatch.');
  return attempt;
}
function ecSaveAttempt_(attempt) {
  PropertiesService.getScriptProperties().setProperty(ecAttemptKey_(attempt.receipt),JSON.stringify(attempt));
}
function ecGenerationPerson_(cfg,ledger,receipt) {
  const snapshot = ecRead_(cfg,ledger);
  const rows = snapshot.rows.filter(row => row.receipt === receipt);
  if (rows.length !== 1 || rows[0].eligibility !== 'ELIGIBLE')
    throw new Error('Kelayakan tidak sah.');
  const person = rows[0];
  ecAssertClosed_(ledger,snapshot,person.batch);
  const issue = ecIssue_(ledger.issue,receipt);
  if (!issue || ecKey_(issue.row[1]) !== person.certificate || Number(issue.row[2]) !== person.batch ||
      ecRows_(ledger.issue).filter(row => ecKey_(row[1]) === person.certificate).length !== 1)
    throw new Error('Identiti atau nombor sijil ledger bercanggah.');
  return {person,issue};
}
function ecReserveGeneration_(cfg,ledger,receipt,actor) {
  if (ecAttempt_(cfg,receipt)) throw new Error('Generation already reserved; reconcile manually.');
  const selected = ecGenerationPerson_(cfg,ledger,receipt);
  if (selected.issue.row[3] !== 'APPROVED') throw new Error('Status APPROVED diperlukan.');
  const props = PropertiesService.getScriptProperties();
  const records = props.getProperties();
  Object.keys(records).filter(key => key.startsWith('EC3_ATTEMPT_')).forEach(key => {
    if (JSON.parse(records[key]).certificate === selected.person.certificate)
      throw new Error('Certificate already reserved in this project.');
  });
  const attempt = {
    id:String(selected.issue.row[10] || ''),receipt,certificate:selected.person.certificate,batch:selected.person.batch,
    operator:actor,startedAt:new Date().toISOString(),resources:ecResourceHash_(cfg),
    state:'RESERVED',slidesId:'',pdfId:'',pdfHash:''
  };
  if (!/^[0-9a-f-]{36}$/i.test(attempt.id)) throw new Error('Approved Attempt_ID required.');
  // The property precedes ledger and Drive writes. Never remove it to permit a retry.
  ecSaveAttempt_(attempt);
  ecUpdateIssue_(ledger.issue,selected.issue,actor,'GENERATING',null,'Attempt '+attempt.id);
  ecLog_(ledger.audit,actor,'ATTEMPT_RESERVED',receipt,JSON.stringify({id:attempt.id}));
  return {person:selected.person,attempt};
}
function ecBuildAttemptPdf_(cfg,ledger,person,attempt,actor) {
  const folder = DriveApp.getFolderById(cfg.folderId);
  const stem = 'QA-' + person.certificate + '--' + attempt.id;
  const slides = DriveApp.getFileById(cfg.templateId).makeCopy(stem,folder);
  attempt.slidesId = slides.getId();
  attempt.state = 'SLIDES_CREATED';
  ecSaveAttempt_(attempt);
  ecUpdateIssue_(ledger.issue,ecIssue_(ledger.issue,person.receipt),actor,'GENERATING',
    {11:attempt.slidesId},'Attempt '+attempt.id);
  ecLog_(ledger.audit,actor,'SLIDES_CREATED',person.receipt,JSON.stringify({id:attempt.id,fileId:attempt.slidesId}));
  const presentation = SlidesApp.openById(attempt.slidesId);
  const tags = [['<<Nama_Peserta>>',person.name],['<<Batch>>','Batch '+person.batch+' — QA'],
    ['<<No_Sijil>>',person.certificate]];
  tags.forEach(([tag,value]) => {
    if (presentation.replaceAllText(tag,value) < 1) throw new Error('Missing template tag '+tag);
  });
  if (presentation.getSlides().length !== 1) throw new Error('Expected one certificate slide.');
  const text = presentation.getSlides().map(slide => slide.getShapes()
    .map(shape => shape.getText().asString()).join('\n')).join('\n');
  if (/<<[^>]+>>/.test(text) || tags.some(pair => !text.includes(pair[1])))
    throw new Error('Unfilled certificate data.');
  const mark = presentation.getSlides()[0].insertTextBox('UJIAN SAHAJA — TIDAK SAH',25,10,
    presentation.getPageWidth()-50,35);
  mark.getFill().setSolidFill('#FFFFFF');
  mark.getText().getTextStyle().setForegroundColor('#B00020').setFontSize(18).setBold(true);
  presentation.saveAndClose();
  const pdf = folder.createFile(slides.getAs(MimeType.PDF).setName(stem+'.pdf'));
  // Name includes the reserved attempt ID even if the following property write is interrupted.
  attempt.pdfId = pdf.getId();
  attempt.pdfHash = ecBlobHash_(pdf.getBlob());
  attempt.state = 'PDF_CREATED';
  ecSaveAttempt_(attempt);
  ecLog_(ledger.audit,actor,'PDF_CREATED',person.receipt,JSON.stringify({id:attempt.id,fileId:attempt.pdfId}));
  return pdf;
}
function ecBlobHash_(blob) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,blob.getBytes())
    .map(byte => ('0'+(byte&255).toString(16)).slice(-2)).join('');
}
function ecReliableGenerate_(receipt) {
  const cfg = ecReliableConfig_(), actor = ecOperator_(cfg), key = ecKey_(receipt);
  return ecLock_(() => {
    const ledger = ecLedger_(cfg);
    const reserved = ecReserveGeneration_(cfg,ledger,key,actor);
    const attempt = reserved.attempt;
    try {
      const props = PropertiesService.getScriptProperties();
      // Trusted editor-only QA fault controls. They never trigger an automatic retry.
      const hold = Number(props.getProperty('EC3_HOLD_AFTER_RESERVE_MS') || 0);
      if (hold > 0 && hold <= 45000) {
        console.log(JSON.stringify({event:'LOCK_HELD',attemptId:attempt.id,time:new Date().toISOString()}));
        Utilities.sleep(hold);
      }
      if (props.getProperty('EC3_FAULT') === 'AFTER_RESERVATION')
        throw new Error('QA fault after reservation.');
      const pdf = ecBuildAttemptPdf_(cfg,ledger,reserved.person,attempt,actor);
      if (props.getProperty('EC3_FAULT') === 'AFTER_PDF')
        throw new Error('QA fault after PDF creation, before ledger finalisation.');
      const selected = ecGenerationPerson_(cfg,ledger,key);
      if (selected.issue.row[3] !== 'GENERATING') throw new Error('Ledger state changed during generation.');
      ecUpdateIssue_(ledger.issue,selected.issue,actor,'GENERATED',
        {4:pdf.getId(),5:pdf.getUrl(),11:attempt.slidesId,12:attempt.pdfHash},'Attempt '+attempt.id);
      attempt.state = 'GENERATED';
      ecSaveAttempt_(attempt);
      ecLog_(ledger.audit,actor,'GENERATED',key,JSON.stringify({id:attempt.id,fileId:pdf.getId()}));
      return {status:'GENERATED',attemptId:attempt.id,pdfId:pdf.getId(),pdfUrl:pdf.getUrl()};
    } catch(error) {
      // Termination may skip catch entirely. The permanent reservation still blocks future writes.
      attempt.state = 'REVIEW_REQUIRED';
      try { ecSaveAttempt_(attempt); } catch(storageError) {console.error('Attempt state update unavailable; reservation retained.');}
      try {
        const latest = ecIssue_(ledger.issue,key);
        ecUpdateIssue_(ledger.issue,latest,actor,'REVIEW_REQUIRED',
          {4:attempt.pdfId,11:attempt.slidesId,12:attempt.pdfHash},'Reconcile attempt '+attempt.id);
        ecLog_(ledger.audit,actor,'GENERATION_REVIEW_REQUIRED',key,JSON.stringify({id:attempt.id,pdfId:attempt.pdfId}));
      } catch(ledgerError) {console.error('Ledger unavailable; reconcile permanent reservation.');}
      throw error;
    }
  });
}
/** Read-only evidence collection. Does not update properties, files, ledger or audit. */
function ecReconcileQa(receipt) {
  const cfg = ecReliableConfig_();
  return ecLock_(() => ecReconcileRead_(cfg,ecKey_(receipt)));
}
function ecReconcileRead_(cfg,key) {
  const ledger = ecLedger_(cfg), record = ecIssue_(ledger.issue,key), attempt = ecAttempt_(cfg,key);
  if (!record || !attempt) throw new Error('Ledger and permanent reservation required.');
  const selected = ecGenerationPerson_(cfg,ledger,key);
  if (attempt.certificate !== selected.person.certificate || attempt.batch !== selected.person.batch ||
      record.row[10] !== attempt.id)
    throw new Error('Attempt and approved identity mismatch.');
  const name = 'QA-'+attempt.certificate+'--'+attempt.id;
  const files = DriveApp.getFolderById(cfg.folderId).getFiles();
  const output = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName() === name || file.getName().startsWith('QA-'+attempt.certificate+'--') ||
        file.getId() === attempt.pdfId || file.getId() === attempt.slidesId) {
      output.push({id:file.getId(),name:file.getName(),mime:file.getMimeType(),
        hash:file.getMimeType() === MimeType.PDF ? ecBlobHash_(file.getBlob()) : ''});
    }
  }
  output.sort((a,b) => a.id.localeCompare(b.id));
  const audit = ecRows_(ledger.audit).filter(row => row[3] === key &&
    String(row[4]).includes(attempt.id)).map(row => [row[2],row[4]]);
  const pdfs = output.filter(file => file.mime === MimeType.PDF);
  const slides = output.filter(file => file.mime === MimeType.GOOGLE_SLIDES);
  const pdf = pdfs.length === 1 ? pdfs[0] : null;
  const recoverable = !!pdf && pdf.name === name+'.pdf' && slides.length === 1 &&
    (!attempt.slidesId || slides[0].id === attempt.slidesId) && audit.some(row => row[0] === 'ATTEMPT_RESERVED') &&
    ['GENERATING','REVIEW_REQUIRED'].includes(record.row[3]) &&
    (!attempt.pdfId || attempt.pdfId === pdf.id) && (!attempt.pdfHash || attempt.pdfHash === pdf.hash) &&
    (!record.row[4] || String(record.row[4]) === pdf.id) &&
    (!record.row[12] || String(record.row[12]) === pdf.hash);
  const report = {receipt:key,attempt,ledgerStatus:record.row[3],ledgerPdfId:record.row[4],
    output,audit,recoverable,reconciliationStatus:recoverable?'MANUAL_APPROVAL_REQUIRED':'REVIEW_REQUIRED',action:recoverable?'MANUAL_LINK_EXISTING_PDF':'HOLD_MANUAL_REVIEW'};
  report.evidenceHash = ecDigest_(report);
  return report;
}
/** Explicit recovery links an existing verified PDF. It never creates or removes Drive files. */
function ecRecoverExistingPdfQa(receipt,attemptId,evidenceHash,reason,confirmation) {
  const cfg = ecReliableConfig_(), actor = ecOperator_(cfg);
  const allowed = (PropertiesService.getScriptProperties().getProperty('EC_QA_RECOVERY_OPERATORS') || '')
    .toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
  if (!allowed.includes(actor)) throw new Error('Recovery operator not authorised.');
  if (confirmation !== 'LINK_EXISTING_PDF_ONLY' || ecText_(reason).length < 20)
    throw new Error('Explicit recovery confirmation and review reason required.');
  return ecLock_(() => {
    const report = ecReconcileRead_(cfg,ecKey_(receipt));
    if (!report.recoverable || report.attempt.id !== attemptId || report.evidenceHash !== evidenceHash)
      throw new Error('Recovery evidence changed or is not conclusive.');
    const ledger = ecLedger_(cfg), record = ecIssue_(ledger.issue,report.receipt);
    const pdf = report.output.find(file => file.mime === MimeType.PDF);
    ecLog_(ledger.audit,actor,'RECOVERY_AUTHORISED',report.receipt,
      JSON.stringify({id:attemptId,evidenceHash,reason:ecText_(reason).slice(0,90)}));
    ecUpdateIssue_(ledger.issue,record,actor,'GENERATED',
      {4:pdf.id,5:DriveApp.getFileById(pdf.id).getUrl(),11:report.attempt.slidesId,12:pdf.hash},'Manual link of existing PDF '+attemptId);
    report.attempt.pdfId = pdf.id;
    report.attempt.pdfHash = pdf.hash;
    report.attempt.state = 'GENERATED';
    ecSaveAttempt_(report.attempt);
    ecLog_(ledger.audit,actor,'RECOVERED_EXISTING_PDF',report.receipt,JSON.stringify({id:attemptId,fileId:pdf.id}));
    return {status:'GENERATED',pdfId:pdf.id,attemptId};
  });
}
