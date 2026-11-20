/* Generasi Sunnah 2026 - one-file Cloudflare Worker API bridge.
 * Configure env.GS_WEBAPP_URL in Cloudflare. No secret or participant data here.
 */
const ALLOWED_ORIGIN='https://shafielegacy.github.io';
const ACTIONS=new Set(['gsPublicStatus','gsSelfCheckin','gsStaffLogin','gsStaffLogout','gsStaffSnapshot','gsStaffSetOpen','gsStaffCheckin']);
export default {
  async fetch(request,env) {
    const cors={
      'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Cache-Control':'no-store','Vary':'Origin'
    };
    const send=(obj,status=200)=>new Response(JSON.stringify(obj),{
      status,headers:{...cors,'Content-Type':'application/json; charset=utf-8'}
    });
    const origin=request.headers.get('Origin');
    if(origin!==ALLOWED_ORIGIN)return send({ok:false,error:'Origin tidak dibenarkan.'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(new URL(request.url).pathname!=='/api'||request.method!=='POST')
      return send({ok:false,error:'Laluan tidak tersedia.'},404);
    if(!String(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))
      return send({ok:false,error:'Content-Type tidak sah.'},415);
    const body=await request.text();
    if(body.length>4096)return send({ok:false,error:'Permintaan terlalu panjang.'},413);
    let input;
    try{input=JSON.parse(body);}catch(_){return send({ok:false,error:'JSON tidak sah.'},400);}
    if(!input||!ACTIONS.has(input.action)||!Array.isArray(input.args)||input.args.length>4)
      return send({ok:false,error:'Tindakan tidak sah.'},400);
    const url=String(env.GS_WEBAPP_URL||'');
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))
      return send({ok:false,error:'Backend belum dikonfigurasi.'},503);
    try{
      const r=await fetch(url,{method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({action:input.action,args:input.args}),redirect:'follow'});
      const raw=await r.text();
      if(!r.ok||raw.length>200000)throw new Error('Backend unavailable');
      const out=JSON.parse(raw);
      if(!out||typeof out.ok!=='boolean')throw new Error('Invalid GAS response');
      return send(out);
    }catch(_){
      return send({ok:false,error:'Sambungan GAS gagal. Semak deployment Web App.'},502);
    }
  }
};
