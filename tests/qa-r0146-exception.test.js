'use strict';
// Isolation proof for the TEMPORARY one-dummy QA exception (GS26_R0146 / 6789 / b1d1, 27 Nov 2026 only).
// Offline: Google services mocked; NO GOOGLE CALLS. Run: node tests/qa-r0146-exception.test.js
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const gsA=fs.readFileSync(path.join(root,'gas/Code.gs'),'utf8');
const gsB=cp.execSync('git show origin/main:gas/Code.gs',{cwd:root,encoding:'utf8'}); // production V7 (version B)
let n=0;const test=(l,f)=>{f();console.log('PASS',l);n++;};
const mock=day=>"var rows=[];var rate=[];var opened={b1d1:true,b1d2:true,b2d1:true,b2d2:true};Utilities={getUuid:()=>'uuid'};"+
 "LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};SpreadsheetApp={flush(){},openById:()=>({})};"+
 "gsAttendance_=()=>({getLastRow:()=>rows.length+1,getRange:()=>({getDisplayValues:()=>rows.map(r=>['id',r[0],r[1]])}),appendRow(r){rows.push([r[1],r[2],r[4]]);}});"+
 "gsRoster_=()=>[{receipt:'GS26_R0146',batch:1,phoneDigits:'0120006789',name:'DUMMY'},{receipt:'GS26_R0144',batch:1,phoneDigits:'0130006789',name:'REAL'},"+
 "{receipt:'GS26_R0147',batch:1,phoneDigits:'0140001111',name:'B1'},{receipt:'GS26_R0900',batch:2,phoneDigits:'0150006789',name:'B2'}];"+
 "gsRateLimit_=id=>{rate.push(id);};gsOpen_=k=>opened[k]===true;gsStaff_=()=>{};gsDay_=()=>'"+day+"';";
function gas(src,day){const c={Date,console};vm.createContext(c);vm.runInContext(src,c);
  vm.runInContext("ContentService={createTextOutput:t=>({t,setMimeType(){return this;}}),MimeType:{JSON:'j',JAVASCRIPT:'js'}};"+mock(day),c);return c;}
const post=(c,action,args)=>JSON.parse(c.doPost({postData:{contents:JSON.stringify({action,args})}}).t);
const rows=c=>vm.runInContext('JSON.stringify(rows)',c);
const self=(c,receipt,last4,extra)=>post(c,'gsSelfCheckin',[Object.assign({receipt,last4},extra||{})]);

test('A, 27 Nov: dummy R0146/6789 writes ONE b1d1 row; repeat -> already, still one row',()=>{
  const c=gas(gsA,'2026-11-27');
  const a=self(c,'GS26_R0146','6789');assert.equal(a.ok,true);assert.equal(a.data.already,false);
  const b=self(c,'GS26_R0146','6789');assert.equal(b.ok,true);assert.equal(b.data.already,true);
  assert.equal(rows(c),JSON.stringify([['b1d1','GS26_R0146','QR PESERTA']]));
  assert.equal(vm.runInContext('JSON.stringify(rate)',c),JSON.stringify(['GS26_R0146','GS26_R0146']),'rate limit still applied');});
test('A, 27 Nov: real participant R0144 with matching phone is REJECTED, no row',()=>{
  const c=gas(gsA,'2026-11-27');const r=self(c,'GS26_R0144','6789');assert.equal(r.ok,false);assert.match(r.error,/belum bermula/);assert.equal(rows(c),'[]');});
test('A, 27 Nov: other receipts (R0147, R0900, R1460, R01460) REJECTED, no row',()=>{
  const c=gas(gsA,'2026-11-27');
  for(const [r,l] of [['GS26_R0147','1111'],['GS26_R0900','6789'],['GS26_R1460','6789'],['GS26_R01460','6789']]){const x=self(c,r,l);assert.equal(x.ok,false,r);}
  assert.equal(rows(c),'[]');});
test('A, 27 Nov: dummy with wrong last4 REJECTED, no row',()=>{
  const c=gas(gsA,'2026-11-27');for(const l of ['1111','0000','6788','']){assert.equal(self(c,'GS26_R0146',l).ok,false,l);}assert.equal(rows(c),'[]');});
test('A, 27 Nov: forged session/extra fields ignored — only b1d1 possible',()=>{
  const c=gas(gsA,'2026-11-27');const r=self(c,'GS26_R0146','6789',{session:'b1d2',batch:2,day:'2026-11-28'});
  assert.equal(r.ok,true);assert.equal(rows(c),JSON.stringify([['b1d1','GS26_R0146','QR PESERTA']]));});
test('A, 27 Nov: malformed requests rejected (extra args, wrong action)',()=>{
  const c=gas(gsA,'2026-11-27');
  assert.equal(post(c,'gsSelfCheckin',[{receipt:'GS26_R0146',last4:'6789'},'b1d1']).ok,false);
  assert.equal(post(c,'gsQaDummy_',['b1d1','GS26_R0146','6789']).ok,false);
  assert.equal(post(c,'gsWriteCheckin_',['b1d1','GS26_R0146','QR PESERTA','P']).ok,false);assert.equal(rows(c),'[]');});
test('A, 27 Nov: STAFF manual check-in still REJECTED for dummy and others',()=>{
  const c=gas(gsA,'2026-11-27');
  for(const r of ['GS26_R0146','GS26_R0144']){const x=post(c,'gsStaffCheckin',['t','b1d1',r,'Meja 1']);assert.equal(x.ok,false);assert.match(x.error,/luar tarikh/);}
  assert.equal(rows(c),'[]');});
test('A, 27 Nov: STAFF cannot open any session outside its date',()=>{
  const c=gas(gsA,'2026-11-27');for(const k of ['b1d1','b1d2','b2d1','b2d2'])assert.equal(post(c,'gsStaffSetOpen',['t',k,true,true]).ok,false,k);});
test('A, 27 Nov: write path only exempts QR PESERTA + exact dummy + b1d1 (direct internal calls)',()=>{
  const c=gas(gsA,'2026-11-27');
  assert.throws(()=>c.gsWriteCheckin_('b1d1','GS26_R0146','URUS SETIA','x','6789'),/luar tarikh/);
  assert.throws(()=>c.gsWriteCheckin_('b1d1','GS26_R0144','QR PESERTA','P','6789'),/luar tarikh/);
  assert.throws(()=>c.gsWriteCheckin_('b1d2','GS26_R0146','QR PESERTA','P','6789'),/luar tarikh/);
  assert.throws(()=>c.gsWriteCheckin_('b1d1','GS26_R0146','QR PESERTA','P'),/luar tarikh/);
  assert.throws(()=>c.gsRequireEvent_('b1d1'),/luar tarikh/);assert.equal(rows(c),'[]');});
test('A, 27 Nov: dummy REJECTED when b1d1 is closed (open flag still enforced)',()=>{
  const c=gas(gsA,'2026-11-27');vm.runInContext('opened.b1d1=false',c);
  const r=self(c,'GS26_R0146','6789');assert.equal(r.ok,false);assert.match(r.error,/belum dibuka/);assert.equal(rows(c),'[]');});
test('A, 27 Nov: dummy REJECTED if roster no longer matches (batch changed)',()=>{
  const c=gas(gsA,'2026-11-27');vm.runInContext("const _r=gsRoster_;gsRoster_=()=>_r().map(p=>p.receipt==='GS26_R0146'?Object.assign({},p,{batch:2}):p);",c);
  assert.equal(self(c,'GS26_R0146','6789').ok,false);assert.equal(rows(c),'[]');});
test('A: exception self-expires — dummy REJECTED on 26 Nov, 30 Nov; normal date rules on 28/29 Nov',()=>{
  for(const d of ['2026-11-26','2026-11-30','2026-12-04']){const c=gas(gsA,d);assert.equal(self(c,'GS26_R0146','6789').ok,false,d);assert.equal(rows(c),'[]');}
  let c=gas(gsA,'2026-11-28');assert.equal(self(c,'GS26_R0146','6789').ok,true);assert.equal(rows(c),JSON.stringify([['b1d1','GS26_R0146','QR PESERTA']]));
  c=gas(gsA,'2026-11-29');assert.equal(self(c,'GS26_R0146','6789').ok,true);assert.equal(rows(c),JSON.stringify([['b1d2','GS26_R0146','QR PESERTA']]));
  c=gas(gsA,'2026-11-28');assert.equal(self(c,'GS26_R0900','6789').ok,false,'batch 2 on 28 Nov');});
test('A, 27 Nov: read-only status works for dummy (b1d1) only; never writes',()=>{
  const c=gas(gsA,'2026-11-27');
  let s=post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0146',last4:'6789'}]);assert.equal(s.ok,true);assert.equal(s.data.recorded,false);assert.equal(s.data.session,'b1d1');
  self(c,'GS26_R0146','6789');s=post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0146',last4:'6789'}]);assert.equal(s.data.recorded,true);
  assert.equal(post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0144',last4:'6789'}]).ok,false);
  assert.equal(JSON.parse(rows(c)).length,1);});
test('B (production V7 / rollback): dummy on 27 Nov REJECTED, no row — restoration test',()=>{
  const c=gas(gsB,'2026-11-27');const r=self(c,'GS26_R0146','6789');assert.equal(r.ok,false);assert.match(r.error,/belum bermula/);assert.equal(rows(c),'[]');});
test('Diff scope: version A differs from V7 only in date-guard / self check-in lines; one QA constant',()=>{
  assert.equal((gsA.match(/'GS26_R0146'/g)||[]).length,1);assert.equal((gsA.match(/'2026-11-27'/g)||[]).length,1);assert.equal((gsA.match(/'6789'/g)||[]).length,1);
  const fnB=gsB.match(/function gsStaffCheckin[\s\S]*?\n}/)[0],fnA=gsA.match(/function gsStaffCheckin[\s\S]*?\n}/)[0];assert.equal(fnA,fnB);
  for(const f of ['gsStaffSetOpen','gsRoster_','gsRecords_','gsAttendance_','gsRateLimit_','gsTodaySession_','doGet','gsPublicStatus'])
    assert.equal((gsA.match(new RegExp('function '+f+'\\b[\\s\\S]*?\\n}'))||[])[0],(gsB.match(new RegExp('function '+f+'\\b[\\s\\S]*?\\n}'))||[])[0],f);});
console.log(n+' QA-exception isolation tests passed; NO GOOGLE CALLS.');
