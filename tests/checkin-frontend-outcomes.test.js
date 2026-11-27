'use strict';
// Offline behavioural test of js/checkin.js with a minimal fake DOM and mocked fetch.
// Verifies the three outcomes (SUCCESS / FAILED / UNKNOWN), no automatic retry of the
// mutating request, read-only verification after an ambiguous result, and no double submit.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ui=fs.readFileSync(path.join(__dirname,'..','js/checkin.js'),'utf8');
function el(){
  const e={value:'',textContent:'',disabled:false,dataset:{},listeners:{},_cls:new Set(),
    classList:{toggle(c,on){on?e._cls.add(c):e._cls.delete(c);},add(c){e._cls.add(c);},remove(c){e._cls.delete(c);},contains(c){return e._cls.has(c);}},
    addEventListener(t,f){(e.listeners[t]=e.listeners[t]||[]).push(f);},append(){},replaceChildren(){},scrollIntoView(){},querySelectorAll(){return [];},
    set innerHTML(v){},get innerHTML(){return '';},set className(v){},set href(v){}};
  return e;
}
async function scenario(handler){
  const els={},calls=[];
  const document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el()};
  const fastTimeout=(f,ms)=>setTimeout(f,Math.min(5,(ms||0)/1000));
  const ctx={document,window:{GS_WEBAPP_URL:'https://script.google.com/macros/s/TEST_ID-123/exec'},location:{search:''},
    URLSearchParams,AbortController,JSON,Date,Promise,Error,String,Number,Array,Map,Set,console,
    setTimeout:fastTimeout,clearTimeout,setInterval:()=>0,requestAnimationFrame:()=>0,confirm:()=>true,
    fetch:async(url,opt)=>{const b=JSON.parse(opt.body);calls.push({b,opt});return handler(b,calls);}};
  ctx.window.document=document;
  vm.createContext(ctx);vm.runInContext(ui,ctx);if(!els.gsReceipt)throw new Error('ui did not render: '+Object.keys(els));
  await new Promise(r=>setTimeout(r,30));
  const submit=()=>{for(const f of els.gsPublicForm.listeners.submit)f({preventDefault(){}});};
  document.getElementById('gsReceipt').value='R0144';document.getElementById('gsPhone').value='6789';
  return {els,calls,submit,settle:()=>new Promise(r=>setTimeout(r,120))};
}
const status={ok:true,data:{sessions:[{key:'b1d1',label:'B1D1',date:'2026-11-28',open:true}],today:'2026-11-28'}};
const reply=o=>({ok:true,status:200,text:async()=>JSON.stringify(o)});
const count=(calls,a)=>calls.filter(c=>c.b.action===a).length;
let n=0;async function test(label,fn){await fn();console.log('PASS',label);n++;}
(async()=>{
await test('SUCCESS only on backend ok:true; one request; cors, no cookies',async()=>{
  const s=await scenario(b=>b.action==='gsPublicStatus'?reply(status):reply({ok:true,data:{ok:true,already:false,message:'x'}}));
  s.submit();await s.settle();
  assert.equal(s.els.gsPublicMessage.dataset.outcome,'SUCCESS');assert.equal(count(s.calls,'gsSelfCheckin'),1);
  const c=s.calls.find(c=>c.b.action==='gsSelfCheckin');assert.equal(c.opt.mode,'cors');assert.equal(c.opt.credentials,'omit');
  assert.deepEqual(Object.keys(c.b.args[0]).sort(),['last4','receipt']);assert.equal(c.b.args[0].receipt,'GS26_R0144');
});
await test('already recorded -> SUCCESS (SUDAH direkod)',async()=>{
  const s=await scenario(b=>b.action==='gsPublicStatus'?reply(status):reply({ok:true,data:{ok:true,already:true}}));
  s.submit();await s.settle();assert.equal(s.els.gsPublicMessage.dataset.outcome,'SUCCESS');assert.match(s.els.gsPublicMessage.textContent,/SUDAH/);
});
await test('backend ok:false -> FAILED, no retry, no verification call',async()=>{
  const s=await scenario(b=>b.action==='gsPublicStatus'?reply(status):reply({ok:false,error:'Check-in belum bermula.'}));
  s.submit();await s.settle();
  assert.equal(s.els.gsPublicMessage.dataset.outcome,'FAILED');assert.equal(count(s.calls,'gsSelfCheckin'),1);assert.equal(count(s.calls,'gsSelfCheckinStatus'),0);
});
await test('network lost after send, server says recorded -> SUCCESS; mutating POST NOT repeated',async()=>{
  const s=await scenario(b=>{if(b.action==='gsPublicStatus')return reply(status);if(b.action==='gsSelfCheckin')throw new TypeError('Failed to fetch');return reply({ok:true,data:{recorded:true,session:'b1d1'}});});
  s.submit();await s.settle();
  assert.equal(s.els.gsPublicMessage.dataset.outcome,'SUCCESS');assert.equal(count(s.calls,'gsSelfCheckin'),1);assert.equal(count(s.calls,'gsSelfCheckinStatus'),1);
});
await test('network lost, server says NOT recorded -> FAILED (confirmed), may press again',async()=>{
  const s=await scenario(b=>{if(b.action==='gsPublicStatus')return reply(status);if(b.action==='gsSelfCheckin')throw new TypeError('x');return reply({ok:true,data:{recorded:false}});});
  s.submit();await s.settle();assert.equal(s.els.gsPublicMessage.dataset.outcome,'FAILED');assert.equal(s.els.gsSubmit.disabled,false);
});
await test('server flags uncertain write -> verification, not FAILED',async()=>{
  const s=await scenario(b=>{if(b.action==='gsPublicStatus')return reply(status);if(b.action==='gsSelfCheckin')return reply({ok:false,uncertain:true,error:'tidak pasti'});return reply({ok:true,data:{recorded:true}});});
  s.submit();await s.settle();assert.equal(s.els.gsPublicMessage.dataset.outcome,'SUCCESS');assert.equal(count(s.calls,'gsSelfCheckin'),1);
});
await test('no answer at all -> UNKNOWN, button locked (cooldown), single mutating POST',async()=>{
  const s=await scenario(b=>{if(b.action==='gsPublicStatus')return reply(status);throw new TypeError('offline');});
  s.submit();await s.settle();
  assert.equal(s.els.gsPublicMessage.dataset.outcome,'UNKNOWN');assert.equal(s.els.gsSubmit.disabled,true);
  assert.equal(count(s.calls,'gsSelfCheckin'),1);assert.equal(count(s.calls,'gsSelfCheckinStatus'),2);
  s.submit();await s.settle();assert.equal(count(s.calls,'gsSelfCheckin'),1,'cooldown blocks resubmit');
});
await test('double tap -> exactly one mutating request',async()=>{
  let release;const gate=new Promise(r=>release=r);
  const s=await scenario(async b=>{if(b.action==='gsPublicStatus')return reply(status);await gate;return reply({ok:true,data:{ok:true,already:false}});});
  s.submit();s.submit();s.submit();assert.equal(s.els.gsSubmit.disabled,true);release();await s.settle();
  assert.equal(count(s.calls,'gsSelfCheckin'),1);assert.equal(s.els.gsPublicMessage.dataset.outcome,'SUCCESS');
});
await test('status refresh failure does not block submit or erase an outcome',async()=>{
  const s=await scenario(b=>{if(b.action==='gsPublicStatus')throw new TypeError('x');return reply({ok:true,data:{ok:true,already:false}});});
  assert.equal(s.els.gsSubmit.disabled,false);s.submit();await s.settle();assert.equal(s.els.gsPublicMessage.dataset.outcome,'SUCCESS');
});
console.log(n+' frontend outcome tests passed; NO NETWORK CALLS.');
})().catch(e=>{console.error(e);process.exit(1);});
