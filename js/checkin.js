
/* GitHub-native check-in, using the existing Apps Script deployment (no extra hosting). */
(() => {
'use strict';
const BASE=String(window.GS_WEBAPP_URL||'');
if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(BASE))return;
const root=document.getElementById('gsNativeApp');
if(!root)return;
const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search), qrSession=qs.get('session')||'',qrCode=qs.get('code')||'';
const hasQR=/^b[12]d[12]$/.test(qrSession)&&/^[a-fA-F0-9]{12}$/.test(qrCode);
const sessions=[['b1d1','Batch 1 · Hari 1 · 28 Nov'],['b1d2','Batch 1 · Hari 2 · 29 Nov'],['b2d1','Batch 2 · Hari 1 · 5 Dis'],['b2d2','Batch 2 · Hari 2 · 6 Dis']];
let token='',today='',current=hasQR?qrSession:'b1d1',currentTab='peserta',pub=[],snapshot=null,submitting=false;
// GAS does not expose CORS response headers. POST the private payload without
// exposing a response, then read the short-lived result by an unguessable ID.
const callbacks=new Map();
window.GS_PORTAL_RPC_RESULT=function(id,result){
  const done=callbacks.get(id);
  if(done)done(result);
};
function pollOnce(id){
  return new Promise(resolve=>{
    let finished=false;
    const el=document.createElement('script');
    const timeout=setTimeout(()=>done({ready:false}),6500);
    function done(value){
      if(finished)return;
      finished=true;clearTimeout(timeout);callbacks.delete(id);el.remove();resolve(value);
    }
    callbacks.set(id,done);
    el.onerror=()=>done({ready:false});
    el.onload=()=>setTimeout(()=>done({ready:false}),70);
    el.referrerPolicy='no-referrer';
    el.src=BASE+'?view=rpc&rid='+encodeURIComponent(id)+'&_='+Date.now();
    document.head.appendChild(el);
  });
}
async function api(action,...args){
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  const id=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const body=JSON.stringify({rpcId:id,action,args});
  if(body.length>4096)throw new Error('Permintaan terlalu panjang.');
  await fetch(BASE,{method:'POST',mode:'no-cors',credentials:'omit',
    headers:{'Content-Type':'text/plain;charset=UTF-8'},body,cache:'no-store'});
  for(let n=0;n<16;n++){
    const reply=await pollOnce(id);
    if(reply&&reply.ready){
      const result=reply.result;
      if(!result||result.ok!==true)throw new Error(result?.error||'Permintaan gagal.');
      return result.data;
    }
    await new Promise(resolve=>setTimeout(resolve,700));
  }
  throw new Error('Tiada jawapan daripada GAS. Semak sambungan, kemudian cuba lagi.');
}
function message(id,text,isError=false){const e=$(id);e.textContent=text||'';e.classList.toggle('error',isError);}
function make(tag,value,cssClass){const e=document.createElement(tag);e.textContent=value||'';if(cssClass)e.className=cssClass;return e;}
function setTab(v){currentTab=v;$('gsParticipant').classList.toggle('gs-hidden',v!=='peserta');$('gsStaff').classList.toggle('gs-hidden',v!=='urusetia');root.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===v));if(v==='urusetia'&&token)refreshStaff();}
function render(){
 root.innerHTML="<div class='gs-header'><h2>Mini Check-in</h2><span class='gs-head-note' id='gsState'>Check-in ditutup</span></div>"+
 "<div class='gs-tabs'><button data-tab='peserta' class='active'>◈ Peserta</button><button data-tab='urusetia'>▤ Urusetia</button></div>"+
 "<section id='gsParticipant' class='gs-container'><h3>Daftar kehadiran</h3><div id='gsNotice' class='gs-notice' role='status' aria-live='polite'>Kehadiran belum boleh disahkan. Check-in hanya dibuka pada hari program selepas urusetia membuka sesi.</div><p id='gsInstruction' class='gs-help'>Imbas QR rasmi di lokasi terlebih dahulu.</p>"+
 "<form id='gsPublicForm' autocomplete='off'><label class='gs-field' for='gsReceipt'>5 aksara terakhir nombor resit</label><input class='gs-input' required id='gsReceipt' maxlength='5' minlength='5' pattern='[Rr][0-9]{4}' autocapitalize='characters' autocomplete='off' placeholder='Contoh: R0049'><p class='gs-help'>Taip R0049 sahaja, tak perlu GS26_.</p>"+
 "<label class='gs-field' for='gsPhone'>4 digit terakhir telefon penjaga</label><input class='gs-input' required id='gsPhone' maxlength='4' pattern='[0-9]{4}' inputmode='numeric' autocomplete='off' placeholder='••••'>"+
 "<button class='gs-button wide' id='gsSubmit' disabled>Sahkan kehadiran</button></form><div id='gsPublicMessage' class='gs-msg'></div><p class='gs-help'>Kalau tiada resit, minta urusetia bantu check-in.</p></section>"+
 "<section id='gsStaff' class='gs-container gs-hidden'><div id='gsLogin'><h3>Log masuk urusetia</h3><form id='gsLoginForm'><label class='gs-field' for='gsKey'>Kunci urusetia</label><input class='gs-input' required minlength='8' type='password' id='gsKey' autocomplete='off'><button class='gs-button wide' id='gsLoginButton'>Log masuk</button></form></div>"+
 "<div id='gsDashboard' class='gs-hidden'><div class='gs-actions'><h3>Dashboard urusetia</h3><button id='gsLogout' class='gs-button alt'>Log keluar</button></div>"+
 "<label class='gs-field' for='gsSession'>Sesi program</label><select class='gs-input' id='gsSession'></select>"+
 "<div class='gs-grid'><div class='gs-stat'><small>Berdaftar</small><strong id='gsTotal'>–</strong></div><div class='gs-stat'><small>Hadir</small><strong id='gsPresent'>–</strong></div><div class='gs-stat'><small>Belum hadir</small><strong id='gsAbsent'>–</strong></div></div>"+
 "<div class='gs-actions'><span id='gsStatus'>Ditutup</span><span><button id='gsToggle' class='gs-button' disabled>Buka check-in</button> <button id='gsRefresh' class='gs-button alt'>Refresh</button></span></div>"+
 "<div id='gsQRBlock' class='gs-qr gs-hidden'><div id='gsQR'></div><div><p>QR lokasi — scan untuk check-in pada GitHub Pages.</p><a id='gsQRLink' href='#' target='_blank' rel='noopener'>Buka pautan QR</a><p><button id='gsPrint' class='gs-button alt'>Cetak QR</button></p></div></div>"+
 "<label class='gs-field' for='gsSearch'>Cari nama / nombor resit</label><input class='gs-input' id='gsSearch' type='search' autocomplete='off' placeholder='Taip nama peserta'>"+
 "<label class='gs-field' for='gsOperator'>Nama petugas</label><input class='gs-input' id='gsOperator' maxlength='60' placeholder='Urusetia Meja 1' autocomplete='off'><div id='gsPeople'></div></div><div id='gsStaffMessage' class='gs-msg'></div></section>";
 const sel=$('gsSession');for(const [k,v] of sessions){const o=make('option',v);o.value=k;sel.append(o);}sel.value=current;
 root.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
 $('gsReceipt').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase();});
 $('gsPublicForm').addEventListener('submit',selfCheckin);$('gsLoginForm').addEventListener('submit',login);
 $('gsLogout').addEventListener('click',logout);$('gsSession').addEventListener('change',refreshStaff);
 $('gsRefresh').addEventListener('click',refreshStaff);$('gsToggle').addEventListener('click',toggle);
 let debounce; $('gsSearch').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(refreshStaff,300);});
 $('gsPrint').addEventListener('click',printQR);
 if(qs.get('mode')==='urusetia')setTab('urusetia');
 updatePublic();
}
function updatePublic(){
 const s=pub.find(x=>x.key===current),open=!!s?.open;
 const anyOpen=pub.some(s=>s.open);
 $('gsState').textContent=anyOpen?'✓ Sesi check-in tersedia':'Check-in belum dibuka';
 $('gsInstruction').textContent=hasQR?'QR: '+(sessions.find(x=>x[0]===current)?.[1]||'Sesi'):'Imbas QR rasmi di lokasi program supaya sesi dipilih automatik.';
 const notice=$('gsNotice');
 notice.textContent=!anyOpen
  ?'Kehadiran belum boleh disahkan. Check-in hanya dibuka pada 28–29 November atau 5–6 Disember 2026 selepas urusetia mengaktifkan sesi. Status DIBUKA di atas merujuk pendaftaran.'
  : !hasQR?'Sesi check-in tersedia. Sila imbas QR rasmi di lokasi program untuk mengesahkan kehadiran.'
  : !open?'QR ini tidak aktif atau sesi sudah ditutup. Minta QR terkini daripada urusetia.'
  :'Sesi check-in dibuka. Masukkan kod resit pendek dan 4 digit telefon penjaga.';
 notice.classList.toggle('gs-notice-open',anyOpen&&open&&hasQR);
 $('gsSubmit').disabled=submitting||!hasQR||!open;
}
async function refreshPublic(){try{const d=await api('gsPublicStatus');pub=d.sessions||[];today=d.today||'';updatePublic();}catch(err){message('gsPublicMessage',err.message,true);$('gsSubmit').disabled=true;}}
async function selfCheckin(e){
 e.preventDefault();if(submitting||!hasQR)return;submitting=true;updatePublic();
 message('gsPublicMessage','Menyimpan kehadiran…');
 try{
  const shortReceipt=$('gsReceipt').value.trim().toUpperCase();
  if(!/^R\d{4}$/.test(shortReceipt))throw new Error('Masukkan kod resit seperti R0049.');
  // All official 2026 receipts are GS26_R####, validated against the current roster.
  const fullReceipt='GS26_'+shortReceipt;
  const d=await api('gsSelfCheckin',{session:current,code:qrCode.toUpperCase(),receipt:fullReceipt,last4:$('gsPhone').value});
  message('gsPublicMessage',d.message||'Kehadiran direkod.');$('gsReceipt').value='';$('gsPhone').value='';
 }
 catch(err){message('gsPublicMessage',err.message,true);}finally{submitting=false;updatePublic();}
}
async function login(e){
 e.preventDefault();const key=$('gsKey').value;$('gsKey').value='';$('gsLoginButton').disabled=true;
 try{const d=await api('gsStaffLogin',key);token=d.token;$('gsLogin').classList.add('gs-hidden');$('gsDashboard').classList.remove('gs-hidden');message('gsStaffMessage','');await refreshStaff();}
 catch(err){message('gsStaffMessage',err.message,true);}finally{$('gsLoginButton').disabled=false;}
}
async function refreshStaff(){
 if(!token)return;
 const k=$('gsSession').value;
 try{const d=await api('gsStaffSnapshot',token,k,$('gsSearch').value);
  if(k!==$('gsSession').value)return;snapshot=d;
  $('gsTotal').textContent=d.total;$('gsPresent').textContent=d.present;$('gsAbsent').textContent=d.total-d.present;
  const isOpen=!!d.session.open;$('gsStatus').textContent=isOpen?'Check-in dibuka':'Check-in ditutup';
  $('gsToggle').textContent=isOpen?'Tutup check-in':'Buka check-in';$('gsToggle').disabled=d.session.date!==today;
  const url='https://shafielegacy.github.io/generasisunnah/?mode=peserta&session='+encodeURIComponent(k)+'&code='+encodeURIComponent(d.venueCode||'')+'#gsNativeApp';
  $('gsQRBlock').classList.toggle('gs-hidden',!isOpen||!d.venueCode);
  if(isOpen&&d.venueCode){$('gsQRLink').href=url;const box=$('gsQR');box.replaceChildren();if(typeof QRCode==='function')new QRCode(box,{text:url,width:170,height:170,correctLevel:QRCode.CorrectLevel.M});else box.textContent='QR library tak dapat dimuatkan';}
  $('gsPeople').replaceChildren();
  for(const p of d.people||[]){const row=make('div','','gs-row'),details=make('div');details.append(make('strong',p.name),make('small',p.receipt));const b=make('button',p.present?'✓ HADIR':'Tanda hadir','gs-button');b.disabled=p.present||!isOpen;b.type='button';
    b.addEventListener('click',async()=>{if(!confirm('Tandakan HADIR untuk '+p.name+'?'))return;b.disabled=true;try{const result=await api('gsStaffCheckin',token,k,p.receipt,$('gsOperator').value);message('gsStaffMessage',result.message);await refreshStaff();}catch(err){message('gsStaffMessage',err.message,true);b.disabled=false;}});row.append(details,b);$('gsPeople').append(row);}
  if(!d.people?.length)$('gsPeople').append(make('p','Tiada peserta sepadan.','gs-help'));
 }catch(err){message('gsStaffMessage',err.message,true);if(/Sesi tamat|Sila login/.test(err.message)){token='';$('gsLogin').classList.remove('gs-hidden');$('gsDashboard').classList.add('gs-hidden');}}
}
async function toggle(){
 if(!token||!snapshot)return;const next=!snapshot.session.open;
 if(!confirm(next?'Buka check-in sesi ini?':'Tutup check-in dan batalkan QR semasa?'))return;
 $('gsToggle').disabled=true;
 try{await api('gsStaffSetOpen',token,$('gsSession').value,next);await refreshStaff();await refreshPublic();}
 catch(err){message('gsStaffMessage',err.message,true);}
}
async function logout(){const t=token;token='';snapshot=null;$('gsDashboard').classList.add('gs-hidden');$('gsLogin').classList.remove('gs-hidden');try{await api('gsStaffLogout',t);}catch(_){}}
function printQR(){const e=$('gsQR').querySelector('canvas,img');if(!e)return;const url=e.tagName==='CANVAS'?e.toDataURL('image/png'):e.src;const w=window.open('','_blank');if(!w)return;const h=w.document.createElement('h1');h.textContent='Generasi Sunnah 2026';const image=w.document.createElement('img');image.src=url;image.style.width='360px';w.document.body.append(h,image);image.onload=()=>w.print();}
// Always keep the participant and staff forms on GitHub Pages. Never redirect to /exec.
render();
if(hasQR)location.hash='gsNativeApp';
refreshPublic();
setInterval(()=>{if(currentTab==='urusetia'&&token)refreshStaff();else refreshPublic();},60000);
})();