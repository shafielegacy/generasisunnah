'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
let passed = 0;
function test(name,run) {run();passed++;console.log('PASS '+name);}
function fixture() {
  const properties = {EC_MODE:'QA',EC_RELIABILITY_VERSION:'3',EC_QA_PROJECT_ID:'qa-script',
    EC_QA_SOURCE_ID:'qa-source-123456789012345',EC_QA_LEDGER_ID:'qa-ledger-123456789012345',
    EC_QA_TEMPLATE_ID:'qa-template-123456789012345',EC_QA_OUTPUT_FOLDER_ID:'qa-folder-123456789012345',
    EC_QA_ALLOWED_OPERATORS:'owner@example.invalid',EC_QA_RECOVERY_OPERATORS:'owner@example.invalid'};
  const ledger = {issue:{rows:[['QA-P3-X','QA-P3-SX',2,'APPROVED','','',0,'','',
    'Attempt qa','11111111-1111-4111-8111-111111111111','','']]},audit:{rows:[]}};
  const person = {receipt:'QA-P3-X',certificate:'QA-P3-SX',batch:2,name:'QA PERSON',email:'qa@example.invalid',
    eligibility:'ELIGIBLE',days:['b2d1','b2d2'],reasons:[]};
  const files = [];
  let held=false, blocked=false, ledgerFails=false, pdfCreated=0, simulateCut=false;
  const iterator = values => {let index=0;return {hasNext:()=>index<values.length,next:()=>values[index++]};};
  const blob = data => ({getBytes:()=>Buffer.from(data),setName(name){this.name=name;return this;}});
  function file(id,name,mime,data='PDF QA') {
    const f = {id,name,mime,data,getId:()=>id,getName:()=>f.name,getMimeType:()=>mime,
      getUrl:()=> 'https://drive.google.com/file/d/'+id+'/view',getBlob:()=>blob(f.data),
      getAs:()=>blob('PDF QA'),makeCopy(copyName){const item=file('slides-'+files.length,copyName,'slides');files.push(item);return item;}};
    return f;
  }
  const folder = {getFiles:()=>iterator(files.slice()),createFile(b){
    pdfCreated++;const item=file('pdf-'+pdfCreated,b.name,'pdf');files.push(item);return item;
  }};
  const props = {getProperty:key=>properties[key] || null,setProperty:(key,value)=>{
    if (simulateCut && key.startsWith('EC3_ATTEMPT_') && JSON.parse(value).state==='PDF_CREATED')
      throw new Error('Simulated property write interruption');
    properties[key]=value;
  },getProperties:()=>({...properties})};
  const context = {Date,console,JSON,Session:{getActiveUser:()=>({getEmail:()=> 'owner@example.invalid'}),
    getEffectiveUser:()=>({getEmail:()=> 'owner@example.invalid'})},ScriptApp:{getScriptId:()=> 'qa-script'},
    PropertiesService:{getScriptProperties:()=>props},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},getUuid:()=>crypto.randomUUID(),sleep:()=>{},
      computeDigest:(algorithm,data)=>Array.from(crypto.createHash('sha256').update(typeof data==='string'?data:Buffer.from(data)).digest())},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(held||blocked)return false;held=true;return true;},releaseLock:()=>{held=false;}})},
    MimeType:{PDF:'pdf',GOOGLE_SLIDES:'slides'},
    DriveApp:{getFolderById:()=>folder,getFileById:id=>{
      if(id===properties.EC_QA_TEMPLATE_ID)return file('template','template','slides');
      const found=files.find(f=>f.id===id);if(!found)throw new Error('Missing file');return found;
    }},
    SlidesApp:{openById:()=>({replaceAllText:()=>1,getPageWidth:()=>800,saveAndClose:()=>{},
      getSlides:()=>[{getShapes:()=>[{getText:()=>({asString:()=> 'QA PERSON Batch 2 — QA QA-P3-SX'})}],
        insertTextBox:()=>({getFill:()=>({setSolidFill:()=>{}}),getText:()=>({getTextStyle:()=>({
          setForegroundColor(){return this;},setFontSize(){return this;},setBold(){return this;}})})})}]})}
  };
  vm.createContext(context);
  for(const name of ['Eligibility.gs','Engine.gs','Reliability.gs'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),context);
  context.ecLedger_=()=>ledger;
  context.ecRead_=()=>({rows:[person],orphans:[]});
  context.ecAssertClosed_=()=>{};
  context.ecRows_=tab=>tab.rows.map(row=>row.slice());
  context.ecIssue_=(tab,receipt)=>tab.rows[0][0]===receipt?{row:tab.rows[0].slice(),index:2}:null;
  context.ecUpdateIssue_=(tab,record,actor,status,patch,note)=>{
    if(ledgerFails && status==='GENERATED')throw new Error('Ledger finalisation unavailable');
    const row=record.row.slice();row[3]=status;row[9]=note;
    for(const key in patch || {})row[Number(key)]=patch[key];
    tab.rows[0]=row;return row;
  };
  context.ecLog_=(tab,actor,action,receipt,detail)=>tab.rows.push([new Date(),actor,action,receipt,detail]);
  return {c:context,properties,ledger,files,person,folder,
    blockLock:()=>{blocked=true;},failLedger:()=>{ledgerFails=true;},cutProperty:()=>{simulateCut=true;},
    pdfCount:()=>pdfCreated,setHeld:v=>{held=v;}};
}
test('reservation survives post-PDF failure',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/after PDF/);
  assert.equal(f.pdfCount(),1);assert.equal(f.ledger.issue.rows[0][3],'REVIEW_REQUIRED');
  const attempt=f.c.ecAttempt_(f.c.ecReliableConfig_(),'QA-P3-X');
  assert.equal(attempt.id,f.ledger.issue.rows[0][10]);assert.ok(attempt.pdfId);
});
test('retry never replaces existing PDF',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  delete f.properties.EC3_FAULT;assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/already reserved/);
  assert.equal(f.pdfCount(),1);
});
test('read-only reconciliation preserves all evidence',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  const before=JSON.stringify([f.properties,f.ledger,f.files.map(x=>[x.id,x.name,x.data])]);
  const report=f.c.ecReconcileQa('QA-P3-X');assert.equal(report.recoverable,true);
  assert.equal(JSON.stringify([f.properties,f.ledger,f.files.map(x=>[x.id,x.name,x.data])]),before);
});
test('separate authorised recovery links the same PDF',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  const report=f.c.ecReconcileQa('QA-P3-X');
  const result=f.c.ecRecoverExistingPdfQa('QA-P3-X',report.attempt.id,report.evidenceHash,
    'OWNER QA authorisation reviewed existing PDF','LINK_EXISTING_PDF_ONLY');
  assert.equal(result.pdfId,report.attempt.pdfId);assert.equal(f.pdfCount(),1);
  assert.equal(f.ledger.issue.rows[0][3],'GENERATED');
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/already reserved/);
});
test('missing recovery permission rejects',()=>{
  const f=fixture();f.properties.EC_QA_RECOVERY_OPERATORS='';
  assert.throws(()=>f.c.ecRecoverExistingPdfQa('QA-P3-X','id','hash','Reason sufficient length','LINK_EXISTING_PDF_ONLY'),/not authorised/);
});
test('stale recovery evidence rejects',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  const r=f.c.ecReconcileQa('QA-P3-X');
  assert.throws(()=>f.c.ecRecoverExistingPdfQa('QA-P3-X',r.attempt.id,'stale','QA explicit recovery reviewed','LINK_EXISTING_PDF_ONLY'),/evidence changed/);
});
test('ambiguous duplicate PDFs require review',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  const pdf=f.files.find(x=>x.mime==='pdf');f.folder.createFile({name:pdf.name});
  const r=f.c.ecReconcileQa('QA-P3-X');assert.equal(r.recoverable,false);assert.equal(r.reconciliationStatus,'REVIEW_REQUIRED');
  assert.equal(f.pdfCount(),2);
});
test('PDF hash conflict requires review',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  f.files.find(x=>x.mime==='pdf').data='Changed PDF';
  assert.equal(f.c.ecReconcileQa('QA-P3-X').recoverable,false);
});
test('held lock rejects before reservation or Drive',()=>{
  const f=fixture();f.blockLock();assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/Operasi lain/);
  assert.equal(f.pdfCount(),0);assert.equal(Object.keys(f.properties).some(k=>k.startsWith('EC3_ATTEMPT_')),false);
});
test('successful request and repeated request produce one identity',()=>{
  const f=fixture();const result=f.c.ecGenerateQa('QA-P3-X');assert.equal(result.status,'GENERATED');
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/already reserved/);assert.equal(f.pdfCount(),1);
  assert.equal(f.ledger.issue.rows.length,1);
});
test('ledger failure after PDF retains evidence',()=>{
  const f=fixture();f.failLedger();assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/Ledger finalisation/);
  assert.equal(f.pdfCount(),1);assert.equal(f.ledger.issue.rows[0][3],'REVIEW_REQUIRED');
  assert.equal(f.c.ecReconcileQa('QA-P3-X').recoverable,true);
});
test('lost PDF property write is discoverable by attempt filename',()=>{
  const f=fixture();f.cutProperty();assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/property write/);
  const r=f.c.ecReconcileQa('QA-P3-X');assert.equal(r.recoverable,true);assert.equal(f.pdfCount(),1);
});
test('abandoned reservation does not expire into a retry',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_RESERVATION';
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/after reservation/);
  f.ledger.issue.rows[0][3]='GENERATING';delete f.properties.EC3_FAULT;
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/already reserved/);assert.equal(f.pdfCount(),0);
});
test('project binding rejects copied configuration',()=>{
  const f=fixture();f.properties.EC_QA_PROJECT_ID='different-project';
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/bound QA project/);assert.equal(f.pdfCount(),0);
});
test('execution owner must match active operator',()=>{
  const f=fixture();f.c.Session.getEffectiveUser=()=>({getEmail:()=> 'other@example.invalid'});
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/ownership/);
});
test('resource configuration changes invalidate attempt',()=>{
  const f=fixture();f.c.ecGenerateQa('QA-P3-X');f.properties.EC_QA_OUTPUT_FOLDER_ID='different-folder-1234567890';
  assert.throws(()=>f.c.ecReconcileQa('QA-P3-X'),/binding mismatch/);
});
test('reservation exists before the first Drive write',()=>{
  const f=fixture();const original=f.c.DriveApp.getFileById;
  f.c.DriveApp.getFileById=id=>{
    if(id===f.properties.EC_QA_TEMPLATE_ID){
      const attempt=f.c.ecAttempt_(f.c.ecReliableConfig_(),'QA-P3-X');
      assert.ok(attempt.id);assert.equal(f.ledger.issue.rows[0][3],'GENERATING');
    }
    return original(id);
  };
  f.c.ecGenerateQa('QA-P3-X');
});
test('another reserved receipt cannot reuse the certificate identity',()=>{
  const f=fixture();
  f.properties[f.c.ecAttemptKey_('QA-OTHER')]=JSON.stringify({receipt:'QA-OTHER',certificate:'QA-P3-SX'});
  assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'),/Certificate already reserved/);assert.equal(f.pdfCount(),0);
});
test('conflicting ledger PDF identity holds review',()=>{
  const f=fixture();f.properties.EC3_FAULT='AFTER_PDF';assert.throws(()=>f.c.ecGenerateQa('QA-P3-X'));
  f.ledger.issue.rows[0][4]='another-pdf';
  const r=f.c.ecReconcileQa('QA-P3-X');assert.equal(r.recoverable,false);assert.equal(r.reconciliationStatus,'REVIEW_REQUIRED');
});
test('recovery requires an explicit operation confirmation',()=>{
  const f=fixture();assert.throws(()=>f.c.ecRecoverExistingPdfQa('QA-P3-X','id','hash','Reviewed evidence, QA only',''),/confirmation/);
});
test('completed issuance reconciles without requesting recovery',()=>{
  const f=fixture();f.c.ecGenerateQa('QA-P3-X');
  const r=f.c.ecReconcileQa('QA-P3-X');assert.equal(r.reconciliationStatus,'COMPLETE');
  assert.equal(r.action,'NO_ACTION');assert.equal(r.recoverable,false);
});
test('completed issuance with conflicting hash requires review',()=>{
  const f=fixture();f.c.ecGenerateQa('QA-P3-X');f.ledger.issue.rows[0][12]='conflict';
  assert.equal(f.c.ecReconcileQa('QA-P3-X').reconciliationStatus,'REVIEW_REQUIRED');
});
console.log(passed+' Phase 3 offline tests passed. Concurrency here is mocked.');
