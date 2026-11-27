/**
 * GS26 API bridge, isolated staging. Deploy manually after security review.
 * Does not store user details, answer includes no identifying data beyond backend response.
 * DO NOT set a production API endpoint until QA passes.
 */
const ORIGIN = 'https://shafielegacy.github.io';
const MAX_BYTES = 4096;
const ACTION_ARGS = {
  gsPublicStatus:0, gsSelfCheckin:1, gsStaffLogin:1, gsStaffLogout:1,
  gsStaffSnapshot:3, gsStaffSetOpen:[3,4], gsStaffCheckin:4
};
const json = (obj,status=200) => new Response(JSON.stringify(obj),{
  status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'Access-Control-Allow-Origin':ORIGIN,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Vary':'Origin',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }
});
const error=(message,status)=>json({ok:false,error:message},status);
function validArgs(action,args){
  const expected=ACTION_ARGS[action];
  return expected!==undefined && Array.isArray(args) &&
    (Array.isArray(expected)?expected.includes(args.length):args.length===expected);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname!=='/api/checkin')return new Response('Not found',{status:404});
    const origin=request.headers.get('Origin');
    if(origin!==ORIGIN)return new Response('Origin not allowed',{status:403});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
      'Access-Control-Allow-Origin':ORIGIN,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Max-Age':'600',
      'Vary':'Origin'
    }});
    if(request.method!=='POST')return error('Kaedah tidak dibenarkan.',405);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))
      return error('Content-Type tidak sah.',415);
    if(Number(request.headers.get('Content-Length')||0)>MAX_BYTES)
      return error('Permintaan terlalu besar.',413);
    let body;
    try{
      const str=await request.text();
      if(str.length>MAX_BYTES)return error('Permintaan terlalu besar.',413);
      body=JSON.parse(str);
    }catch(_){return error('JSON tidak sah.',400);}
    if(!body||typeof body!=='object'||!validArgs(body.action,body.args))
      return error('Tindakan atau parameter tidak sah.',400);
    if(!env.GS_BACKEND_URL || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(env.GS_BACKEND_URL))
      return error('Backend belum dikonfigurasi.',503);
    // Browser is NOT allowed to influence the upstream URL. Do not forward cookies.
    let upstream;
    try{
      upstream=await fetch(env.GS_BACKEND_URL,{
        method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'},
        body:JSON.stringify({action:body.action,args:body.args}),
        redirect:'follow',signal:AbortSignal.timeout(20000)
      });
      if(!upstream.ok)return error('Sambungan backend terganggu. Status penghantaran mungkin tidak pasti.',502);
      const finalUrl=new URL(upstream.url);
      if(!['script.google.com','script.googleusercontent.com'].includes(finalUrl.hostname)
        && !finalUrl.hostname.endsWith('.googleusercontent.com'))
        return error('Jawapan backend tidak dipercayai.',502);
      const raw=await upstream.text();
      if(raw.length>100000)return error('Jawapan backend terlalu besar.',502);
      const data=JSON.parse(raw);
      if(!data||typeof data.ok!=='boolean')throw new Error('Invalid GAS response');
      // Any business failure is still represented as {ok:false,error} with HTTP 200
      // to preserve the current client contract.
      return json(data);
    }catch(_){
      // NEVER automatically retry a mutating POST: it might already have reached Sheets.
      return error('Tiada pengesahan backend. Jangan cuba hantar semula sebelum urusetia semak.',504);
    }
  }
};
