'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const gs=fs.readFileSync(path.join(root,'gas/Code.gs'),'utf8');
const ui=fs.readFileSync(path.join(root,'js/checkin.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
new vm.Script(gs);new vm.Script(ui);
const ctx={Date,console,qaDay:'2026-11-27',qaOpened:true,qaReceived:''};
vm.createContext(ctx);
vm.runInContext(gs,ctx);
vm.runInContext("gsDay_=()=>globalThis.qaDay;gsOpen_=()=>globalThis.qaOpened;gsRateLimit_=()=>{};gsRoster_=()=>[{receipt:'GS26_R0144',batch:1,phoneDigits:'0000006789'},{receipt:'GS26_R0900',batch:2,phoneDigits:'0000006789'}];gsWriteCheckin_=(s,r)=>{globalThis.qaReceived=s+':'+r;return {ok:true};};",ctx);
let n=0;function test(label,fn){fn();console.log('PASS',label);n++;}
const set=(d,o=true)=>{ctx.qaDay=d;ctx.qaOpened=o;};
const check=(receipt='GS26_R0144',last4='6789')=>ctx.gsSelfCheckin({receipt,last4});
test('Nov 27 check-in FAIL regardless of open flag',()=>{set('2026-11-27');assert.throws(()=>check(),/belum bermula/);});
test('Nov 28 Batch 1 Day 1',()=>{set('2026-11-28');assert.equal(check().ok,true);assert.equal(ctx.qaReceived,'b1d1:GS26_R0144');});
test('Nov 29 Batch 1 Day 2',()=>{set('2026-11-29');assert.equal(check().ok,true);assert.equal(ctx.qaReceived,'b1d2:GS26_R0144');});
test('Dec 5 Batch 2 Day 1',()=>{set('2026-12-05');assert.equal(check('GS26_R0900').ok,true);assert.equal(ctx.qaReceived,'b2d1:GS26_R0900');});
test('Dec 6 Batch 2 Day 2',()=>{set('2026-12-06');assert.equal(check('GS26_R0900').ok,true);assert.equal(ctx.qaReceived,'b2d2:GS26_R0900');});
test('Nov 30 FAIL',()=>{set('2026-11-30');assert.throws(()=>check(),/belum bermula/);});
test('wrong batch FAIL',()=>{set('2026-12-05');assert.throws(()=>check(),/tidak dapat disahkan/);});
test('closed session FAIL',()=>{set('2026-11-28',false);assert.throws(()=>check(),/belum dibuka/);});
test('wrong phone FAIL',()=>{set('2026-11-28');assert.throws(()=>check('GS26_R0144','1111'),/tidak dapat disahkan/);});
test('invalid receipt FAIL',()=>{set('2026-11-28');assert.throws(()=>check('GS26_X0144'),/tidak sah/);});
test('staff write date guard',()=>{set('2026-11-27');assert.throws(()=>ctx.gsRequireEvent_('b1d1'),/luar tarikh/);});
test('frontend no QR code dependence',()=>{assert(!ui.includes('hasQR'));assert(!ui.includes('qrCode'));assert(ui.includes("api('gsSelfCheckin',{receipt,last4})"));});
test('GitHub homepage retained',()=>{assert(!index.includes('location.replace(dest.href)'));assert(index.includes('id="gsNativeApp"'));});
test('direct CORS transport: no no-cors, no JSONP polling, no cookies',()=>{assert(!ui.includes("no-cors"));assert(!ui.includes('view=rpc'));assert(!ui.includes("createElement('script')"));assert(ui.includes("mode:'cors'"));assert(ui.includes("credentials:'omit'"));});
test('no automatic retry loop around POST',()=>{assert.equal((ui.match(/await fetch\(/g)||[]).length,1);assert(!/for\s*\(let n=0;n<16/.test(ui));});
test('success shown only on backend ok===true',()=>{assert(ui.includes("if(!d||d.ok!==true)throw new GsUncertain"));assert(ui.includes("showOutcome('SUCCESS'"));});
test('quota uses CORS fetch, never executes remote script',()=>{assert(index.includes("?view=quota&_='+Date.now(),{mode:'cors',credentials:'omit'"));assert(!index.includes("el.src=GS_WEBAPP_URL+'?view=quota"));});
test('write path re-checks date INSIDE the lock (forged request, flag open, 27 Nov)',()=>{
  const c2={Date,console,released:0,opened:0};vm.createContext(c2);vm.runInContext(gs,c2);
  vm.runInContext("LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{globalThis.released++;}})};SpreadsheetApp={openById:()=>{globalThis.opened++;throw new Error('MUST NOT OPEN SHEET');}};gsDay_=()=>'2026-11-27';gsOpen_=()=>true;",c2);
  assert.throws(()=>c2.gsWriteCheckin_('b1d1','GS26_R0144','QR PESERTA','PESERTA'),/luar tarikh/);
  assert.equal(c2.opened,0);assert.equal(c2.released,1);
});

function freshGas(setup){const c={Date,console,log:[]};vm.createContext(c);vm.runInContext(gs,c);
  vm.runInContext("ContentService={createTextOutput:t=>({t,setMimeType(){return this;}}),MimeType:{JSON:'j',JAVASCRIPT:'js'}};"+setup,c);return c;}
const post=(c,action,args)=>JSON.parse(c.doPost({postData:{contents:JSON.stringify({action,args})}}).t);
const sheetMock="var rows=[];Utilities={getUuid:()=>'uuid'};var appendFails=false;LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};"+
 "SpreadsheetApp={flush(){},openById:()=>({})};gsAttendance_=()=>({getLastRow:()=>rows.length+1,getRange:()=>({getDisplayValues:()=>rows.map(r=>['id',r[0],r[1]])}),appendRow(r){if(appendFails){rows.push([r[1],r[2]]);throw new Error('Service error');}rows.push([r[1],r[2]]);}});"+
 "gsRoster_=()=>[{receipt:'GS26_R0144',batch:1,phoneDigits:'0123456789',name:'QA'}];gsRateLimit_=()=>{};gsOpen_=()=>true;gsStaff_=()=>{};";
test('STAFF manual check-in on 27 Nov rejected (valid staff, session flagged open)',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-27';");
  const r=post(c,'gsStaffCheckin',['t','b1d1','GS26_R0144','Meja 1']);assert.equal(r.ok,false);assert.match(r.error,/luar tarikh/);
  assert.equal(vm.runInContext('rows.length',c),0);});
test('STAFF cannot OPEN a session outside its date (no override flag)',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-27';");
  assert.equal(post(c,'gsStaffSetOpen',['t','b1d1',true,true]).ok,false);});
test('STAFF manual check-in on 28 Nov for b1d2 rejected (wrong session date)',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-28';");
  assert.equal(post(c,'gsStaffCheckin',['t','b1d2','GS26_R0144','']).ok,false);assert.equal(vm.runInContext('rows.length',c),0);});
test('self check-in 28 Nov writes ONE row; second call -> already, still one row',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-28';");
  const a=post(c,'gsSelfCheckin',[{receipt:'GS26_R0144',last4:'6789'}]);const b=post(c,'gsSelfCheckin',[{receipt:'GS26_R0144',last4:'6789'}]);
  assert.equal(a.data.already,false);assert.equal(b.data.already,true);assert.equal(vm.runInContext('rows.length',c),1);});
test('failure AFTER appendRow is reported uncertain:true, never as a clean failure',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-28';appendFails=true;");
  const r=post(c,'gsSelfCheckin',[{receipt:'GS26_R0144',last4:'6789'}]);assert.equal(r.ok,false);assert.equal(r.uncertain,true);});
test('CacheService failure cannot flip a successful write into ok:false',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-28';CacheService={getScriptCache:()=>({put(){throw new Error('cache down');}})};");
  const r=JSON.parse(c.doPost({postData:{contents:JSON.stringify({rpcId:'a'.repeat(32),action:'gsSelfCheckin',args:[{receipt:'GS26_R0144',last4:'6789'}]})}}).t);
  assert.equal(r.ok,true);assert.equal(vm.runInContext('rows.length',c),1);});
test('gsSelfCheckinStatus is read-only and requires matching phone',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-28';");
  assert.equal(post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0144',last4:'6789'}]).data.recorded,false);
  assert.equal(vm.runInContext('rows.length',c),0);
  post(c,'gsSelfCheckin',[{receipt:'GS26_R0144',last4:'6789'}]);
  assert.equal(post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0144',last4:'6789'}]).data.recorded,true);
  assert.equal(post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0144',last4:'0000'}]).ok,false);
  assert.equal(vm.runInContext('rows.length',c),1);});
test('gsSelfCheckinStatus rejects outside event dates',()=>{
  const c=freshGas(sheetMock+"gsDay_=()=>'2026-11-27';");assert.equal(post(c,'gsSelfCheckinStatus',[{receipt:'GS26_R0144',last4:'6789'}]).ok,false);});
console.log(n+' offline QA tests passed; NO GOOGLE CALLS.');
