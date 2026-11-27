'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
const moduleSource=await fs.readFile(path.join(__dirname,'worker.mjs'),'utf8');
const worker=(await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(moduleSource))).default;
const origin='https://shafielegacy.github.io';
const endpoint='https://bridge.example.test/api/checkin';
const upstream='https://script.google.com/macros/s/EXAMPLE_DEPLOYMENT1234567890/exec';
const env={GS_BACKEND_URL:upstream};
let count=0, captured=null;
const originalFetch=globalThis.fetch;
const originalTimeout=AbortSignal.timeout;
const okUpstream=()=>new Response(JSON.stringify({ok:true,data:{sessions:[],today:'2026-11-27'}}),{status:200});
async function invoke(method='POST',body={action:'gsPublicStatus',args:[]},headers={Origin:origin,'Content-Type':'application/json'}){
  return worker.fetch(new Request(endpoint,{method,headers,body:method==='POST'?JSON.stringify(body):undefined}),env);
}
function test(label,p){return Promise.resolve().then(p).then(()=>{count++;console.log('PASS',label);});}
await test('reject unknown Origin',async()=>{
 const r=await invoke('POST',undefined,{Origin:'https://other.example','Content-Type':'application/json'});
 assert.equal(r.status,403);
});
await test('reject missing Origin',async()=>{const r=await invoke('POST',undefined,{'Content-Type':'application/json'});assert.equal(r.status,403);});
await test('preflight only for GitHub origin',async()=>{const r=await invoke('OPTIONS');assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);});
await test('reject invalid action (no upstream call)',async()=>{
 const r=await invoke('POST',{action:'adminExecuteAll',args:[]});assert.equal(r.status,400);
});
await test('reject too many args',async()=>{
 const r=await invoke('POST',{action:'gsSelfCheckin',args:[{},{}]});assert.equal(r.status,400);
});
await test('reject GET',async()=>{const r=await invoke('GET');assert.equal(r.status,405);});
await test('reject wrong Content-Type',async()=>{
 const r=await invoke('POST',{action:'gsPublicStatus',args:[]},{Origin:origin,'Content-Type':'text/plain'});
 assert.equal(r.status,415);
});
globalThis.fetch=async(url,init)=>{
 captured={url,init};count+=0;
 return Object.assign(okUpstream(),{url:'https://script.googleusercontent.com/macros/echo?user_content_key=qa'});
};
await test('readable one-POST response',async()=>{
 const r=await invoke();assert.equal(r.status,200);
 assert.equal((await r.json()).ok,true);
 assert.equal(captured.url,upstream);
 assert.equal(captured.init.method,'POST');
 assert.equal(captured.init.redirect,'follow');
 assert(!captured.init.headers.Cookie);
 assert.deepEqual(JSON.parse(captured.init.body),{action:'gsPublicStatus',args:[]});
});
await test('preserve backend rejection without retry',async()=>{
 let calls=0;
 globalThis.fetch=async()=>{calls++;return Object.assign(new Response(JSON.stringify({ok:false,error:'Tarikh belum tiba'}),{status:200}),{url:'https://script.googleusercontent.com/macros/echo'});};
 const r=await invoke('POST',{action:'gsSelfCheckin',args:[{receipt:'GS26_R0144',last4:'6789'}]});
 assert.equal((await r.json()).error,'Tarikh belum tiba');assert.equal(calls,1);
});
await test('network timeout does NOT retry write',async()=>{
 let calls=0;
 globalThis.fetch=async()=>{calls++;throw new Error('timeout');};
 const r=await invoke('POST',{action:'gsSelfCheckin',args:[{receipt:'GS26_R0144',last4:'6789'}]});
 assert.equal(r.status,504);assert.equal(calls,1);
});
await test('redirect to untrusted host rejected',async()=>{
 globalThis.fetch=async()=>Object.assign(okUpstream(),{url:'https://evil.test/'});
 const r=await invoke();assert.equal(r.status,502);
});
await test('missing config blocked',async()=>{
 const saved=env.GS_BACKEND_URL;delete env.GS_BACKEND_URL;
 const r=await invoke();assert.equal(r.status,503);
 env.GS_BACKEND_URL=saved;
});
globalThis.fetch=originalFetch;
console.log(count+' offline bridge safety tests PASS; no Google request was sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
