
/* GitHub-native check-in, using the existing Apps Script deployment (no extra hosting). Direct CORS transport. */
(() => {
'use strict';
const BASE=String(window.GS_WEBAPP_URL||'');
if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(BASE))return;
const root=document.getElementById('gsNativeApp');
if(!root)return;
const $=id=>document.getElementById(id);
const qs=new URLSearchParams(location.search);
const sessions=[['b1d1','Batch 1 · Hari 1 · 28 Nov'],['b1d2','Batch 1 · Hari 2 · 29 Nov'],['b2d1','Batch 2 · Hari 1 · 5 Dis'],['b2d2','Batch 2 · Hari 2 · 6 Dis']];
let token='',today='',current='',currentTab='peserta',pub=[],snapshot=null,submitting=false,publicStatusLoaded=false,cooldownUntil=0;
// ONE standard CORS request per action. Apps Script ContentService answers
// via script.googleusercontent.com with Access-Control-Allow-Origin:*, so the
// browser can read the JSON directly. text/plain keeps it a "simple" request
// (no preflight). No cookies, no JSONP, no CacheService polling, NO auto-retry.
class GsUncertain extends Error{}
async function api(action,...args){
  const body=JSON.stringify({action,args});
  if(body.length>4096)throw new Error('Permintaan terlalu panjang.');
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),30000);
  let response,result;
  try{
    response=await fetch(BASE,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
      redirect:'follow',headers:{'Content-Type':'text/plain;charset=UTF-8'},body,signal:ctrl.signal});
    const raw=await response.text();
    result=JSON.parse(raw);
  }catch(_){
    // Network drop, timeout, or a non-JSON page: the server MAY have processed it.
    throw new GsUncertain('Sambungan terputus sebelum pengesahan diterima.');
  }finally{clearTimeout(timer);}
  if(!response.ok||!result||typeof result.ok!=='boolean')throw new GsUncertain('Jawapan pelayan tidak sah.');
  if(result.ok!==true){
    // Server says the write MAY have happened (failure after appendRow) -> UNKNOWN, not FAILED.
    if(result.uncertain===true)throw new GsUncertain(String(result.error||'Status penulisan tidak pasti.'));
    throw new Error(String(result.error||'Permintaan ditolak.'));
  }
  return result.data;
}
function message(id,text,isError=false,isOk=false){const e=$(id);e.textContent=text||'';e.classList.toggle('error',isError);e.classList.toggle('ok',isOk);}
function make(tag,value,cssClass){const e=document.createElement(tag);e.textContent=value||'';if(cssClass)e.className=cssClass;return e;}
function setTab(v){currentTab=v;$('gsParticipant').classList.toggle('gs-hidden',v!=='peserta');$('gsStaff').classList.toggle('gs-hidden',v!=='urusetia');root.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===v));if(v==='urusetia'&&token)refreshStaff();}
function render(){
 root.innerHTML="<div class='gs-header'><h2>Mini Check-in</h2><span class='gs-head-note' id='gsState'>Check-in ditutup</span></div>"+
 "<div class='gs-tabs'><button data-tab='peserta' class='active'>◈ Peserta</button><button data-tab='urusetia'>▤ Urusetia</button></div>"+
 "<section id='gsParticipant' class='gs-container'><h3>Daftar kehadiran</h3><div id='gsNotice' class='gs-notice' role='status' aria-live='polite'>Kehadiran belum boleh disahkan. Sesi perlu dibuka oleh urusetia terlebih dahulu.</div><p id='gsInstruction' class='gs-help'>Masukkan nombor resit dan 4 digit terakhir telefon penjaga.</p>"+
 "<form id='gsPublicForm' autocomplete='off'><label class='gs-field' for='gsReceipt'>5 aksara terakhir nombor resit</label><input class='gs-input' required id='gsReceipt' maxlength='5' minlength='5' pattern='[Rr][0-9]{4}' autocapitalize='characters' autocomplete='off' placeholder='Contoh: R0049'><p class='gs-help'>Taip R0049 sahaja, tak perlu GS26_.</p>"+
 "<label class='gs-field' for='gsPhone'>4 digit terakhir telefon penjaga</label><input class='gs-input' required id='gsPhone' maxlength='4' pattern='[0-9]{4}' inputmode='numeric' autocomplete='off' placeholder='••••'>"+
 "<button class='gs-button wide' id='gsSubmit' disabled>Sahkan kehadiran</button></form><div id='gsPublicMessage' class='gs-msg'></div><p class='gs-help'>Kalau tiada resit, minta urusetia bantu check-in.</p></section>"+
 "<section id='gsStaff' class='gs-container gs-hidden'><div id='gsLogin'><h3>Log masuk urusetia</h3><form id='gsLoginForm'><label class='gs-field' for='gsKey'>Kunci urusetia</label><input class='gs-input' required minlength='8' type='password' id='gsKey' autocomplete='off'><button class='gs-button wide' id='gsLoginButton'>Log masuk</button></form></div>"+
 "<div id='gsDashboard' class='gs-hidden'><div class='gs-actions'><h3>Dashboard urusetia</h3><button id='gsLogout' class='gs-button alt'>Log keluar</button></div>"+
 "<label class='gs-field' for='gsSession'>Sesi program</label><select class='gs-input' id='gsSession'></select>"+
 "<div class='gs-grid'><div class='gs-stat'><small>Berdaftar</small><strong id='gsTotal'>–</strong></div><div class='gs-stat'><small>Hadir</small><strong id='gsPresent'>–</strong></div><div class='gs-stat'><small>Belum hadir</small><strong id='gsAbsent'>–</strong></div></div>"+
 "<div class='gs-actions'><span id='gsStatus'>Ditutup</span><span><button id='gsToggle' class='gs-button' disabled>Buka check-in</button> <button id='gsRefresh' class='gs-button alt'>Refresh</button></span></div>"+
 "<p id='gsOpenNotice' class='gs-help' aria-live='polite'></p>"+
 "<div id='gsQRBlock' class='gs-qr gs-hidden'><div id='gsQR'></div><div><p>QR poster QR Monkey digunakan untuk membuka portal GitHub.</p><a id='gsQRLink' href='#' target='_blank' rel='noopener'>Buka pautan QR</a><p><button id='gsPrint' class='gs-button alt'>Cetak QR</button></p></div></div>"+
 "<label class='gs-field' for='gsSearch'>Cari nama / nombor resit</label><input class='gs-input' id='gsSearch' type='search' autocomplete='off' placeholder='Taip nama peserta'>"+
 "<label class='gs-field' for='gsOperator'>Nama petugas</label><input class='gs-input' id='gsOperator' maxlength='60' placeholder='Urusetia Meja 1' autocomplete='off'><div id='gsPeople'></div></div><div id='gsStaffMessage' class='gs-msg'></div></section>";
 const sel=$('gsSession');for(const [k,v] of sessions){const o=make('option',v);o.value=k;sel.append(o);}sel.value=current||sessions[0][0];
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
 const eventToday=!!s&&s.date===today;
 $('gsState').textContent=!publicStatusLoaded?'Status belum dapat disemak':!eventToday?'Di luar tarikh program':open?'✓ Check-in dibuka':'Check-in belum dibuka';
 const notice=$('gsNotice');
 notice.textContent=!publicStatusLoaded
  ?'Status sesi belum dapat disemak. Anda masih boleh tekan Sahkan Kehadiran; pelayan akan menyemak tarikh dan maklumat.'
  :!eventToday?'Check-in belum dibenarkan hari ini. Sila hadir pada tarikh program.'
  :!open?'Sesi hari ini belum dibuka oleh urusetia.'
  :'Sesi check-in dibuka. Masukkan resit dan 4 digit telefon penjaga.';
 $('gsInstruction').textContent=eventToday&&s?'Sesi hari ini: '+s.label:'Sesi akan dipilih secara automatik pada hari program.';
 notice.classList.toggle('gs-notice-open',publicStatusLoaded&&eventToday&&open);
 $('gsSubmit').disabled=submitting||Date.now()<cooldownUntil||(publicStatusLoaded&&(!eventToday||!open));
}
async function refreshPublic(){
 try{
  const d=await api('gsPublicStatus');
  if(!d||!Array.isArray(d.sessions)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d.today||''))throw new Error('Status sesi tidak sah.');
  pub=d.sessions;today=d.today;const active=pub.find(s=>s.date===today);
  current=active?active.key:'';publicStatusLoaded=true;
  if(!$('gsPublicMessage').dataset.outcome)message('gsPublicMessage','');updatePublic();
 }catch(err){
  publicStatusLoaded=false;current='';pub=[];
  if(!$('gsPublicMessage').dataset.outcome)message('gsPublicMessage','Status sesi belum dapat disemak. Anda masih boleh tekan Sahkan Kehadiran.',true);updatePublic();
 }
}
// Three outcomes only. SUCCESS needs backend ok:true (write or already-recorded).
// FAILED = backend answered ok:false: nothing was written. UNKNOWN = no trustworthy answer.
function showOutcome(kind,text){
 const e=$('gsPublicMessage');
 e.textContent=(kind==='SUCCESS'?'\u2713 BERJAYA \u2014 ':kind==='FAILED'?'\u2717 GAGAL \u2014 ':kind==='UNKNOWN'?'? STATUS TIDAK DIKETAHUI \u2014 ':'')+text;
 e.dataset.outcome=kind||'PENDING'; // refreshPublic() must not overwrite this
 e.classList.toggle('ok',kind==='SUCCESS');
 e.classList.toggle('error',kind==='FAILED'||kind==='UNKNOWN');
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// READ-ONLY confirmation after an UNKNOWN outcome. Safe to repeat: it never writes.
async function verifyRecorded(receipt,last4){
 for(let i=0;i<2;i++){
  await sleep(i?5000:6000); // let an in-flight write finish first
  try{const r=await api('gsSelfCheckinStatus',{receipt,last4});if(r&&typeof r.recorded==='boolean')return r.recorded;}
  catch(err){if(!(err instanceof GsUncertain))return null;}
 }
 return null;
}
async function selfCheckin(e){
 e.preventDefault();if(submitting||Date.now()<cooldownUntil)return;
 const shortReceipt=$('gsReceipt').value.trim().toUpperCase(),last4=$('gsPhone').value.trim();
 if(!/^R\d{4}$/.test(shortReceipt)){showOutcome('FAILED','Masukkan kod resit seperti R0049.');return;}
 if(!/^\d{4}$/.test(last4)){showOutcome('FAILED','Masukkan 4 digit terakhir telefon penjaga.');return;}
 const receipt='GS26_'+shortReceipt;
 submitting=true;updatePublic(); // button disabled for the whole request + verification
 showOutcome('','Menyemak dan menyimpan kehadiran\u2026 jangan tutup atau tekan semula.');
 try{
  // Session is chosen by the SERVER from Malaysia's date. ONE mutating request, never auto-retried.
  const d=await api('gsSelfCheckin',{receipt,last4});
  if(!d||d.ok!==true)throw new GsUncertain('Jawapan pelayan tidak lengkap.');
  showOutcome('SUCCESS',d.already?'Kehadiran anda SUDAH direkod untuk sesi hari ini. Tiada tindakan lanjut diperlukan.':'Kehadiran direkod untuk sesi hari ini. Tunjukkan skrin ini kepada urusetia jika diminta.');
  $('gsReceipt').value='';$('gsPhone').value='';
 }catch(err){
  if(!(err instanceof GsUncertain)){showOutcome('FAILED',err.message+' Tiada rekod dibuat.');}
  else{
   showOutcome('','Sambungan terganggu. Menyemak sama ada kehadiran sudah tersimpan\u2026 jangan tekan semula.');
   const recorded=await verifyRecorded(receipt,last4);
   if(recorded===true){showOutcome('SUCCESS','Kehadiran disahkan tersimpan selepas semakan semula.');$('gsReceipt').value='';$('gsPhone').value='';}
   else if(recorded===false){showOutcome('FAILED','Kehadiran BELUM direkod (disahkan oleh pelayan). Anda boleh tekan Sahkan Kehadiran sekali lagi.');}
   else{cooldownUntil=Date.now()+30000;setTimeout(updatePublic,30500);
    showOutcome('UNKNOWN','Kami tidak dapat mengesahkan sama ada kehadiran tersimpan. Jangan hantar berulang kali. Sila rujuk urusetia di meja pendaftaran.');}
  }
 }finally{submitting=false;updatePublic();}
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
  const manualReady=d.manualControl===true;
  $('gsToggle').textContent=isOpen?'Tutup check-in':'Buka check-in';
  $('gsToggle').disabled=!manualReady||(!isOpen&&d.session.date!==today);
  const dateParts=String(d.session.date||'').split('-');
  const dateLabel=dateParts.length===3?`${Number(dateParts[2])} ${['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'][Number(dateParts[1])-1]||''} ${dateParts[0]}`.trim():'';
  $('gsOpenNotice').textContent=manualReady
   ?'Check-in hanya dibenarkan pada tarikh sesi program. QR poster kekal dan membuka portal.'
   :d.session.date!==today&&dateLabel
     ?`Kawalan tarikh lama masih aktif. Check-in hanya boleh dibuka pada ${dateLabel} sehingga GAS dikemas kini.`
     :'Kawalan tarikh lama masih aktif. Kemas kini GAS untuk kawalan manual sepenuhnya.';
  $('gsQRBlock').classList.add('gs-hidden');

  $('gsPeople').replaceChildren();
  for(const p of d.people||[]){const row=make('div','','gs-row'),details=make('div');details.append(make('strong',p.name),make('small',p.receipt));const b=make('button',p.present?'✓ HADIR':'Tanda hadir','gs-button');b.disabled=p.present||!isOpen;b.type='button';
    b.addEventListener('click',async()=>{if(!confirm('Tandakan HADIR untuk '+p.name+'?'))return;b.disabled=true;try{const result=await api('gsStaffCheckin',token,k,p.receipt,$('gsOperator').value);message('gsStaffMessage',result.message);await refreshStaff();}catch(err){message('gsStaffMessage',err.message,true);b.disabled=false;}});row.append(details,b);$('gsPeople').append(row);}
  if(!d.people?.length)$('gsPeople').append(make('p','Tiada peserta sepadan.','gs-help'));
 }catch(err){message('gsStaffMessage',err.message,true);if(/Sesi tamat|Sila login/.test(err.message)){token='';$('gsLogin').classList.remove('gs-hidden');$('gsDashboard').classList.add('gs-hidden');}}
}
async function toggle(){
 if(!token||!snapshot)return;
 const s=snapshot.session,sessionKey=$('gsSession').value;
 if(sessionKey!==s.key)return;
 const next=!s.open,outsideDate=s.date!==today,manualReady=snapshot.manualControl===true;
 if(next&&outsideDate)return;
 const question=next
  ?`Buka check-in untuk ${s.label}?`
  :`Tutup check-in untuk ${s.label}?`;
 if(!confirm(question))return;
 $('gsToggle').disabled=true;
 try{
  await api('gsStaffSetOpen',token,sessionKey,next);
  await refreshStaff();await refreshPublic();
 }catch(err){message('gsStaffMessage',err.message,true);}
 finally{if(token&&$('gsSession').value===sessionKey)$('gsToggle').disabled=!manualReady||(outsideDate&&!snapshot.session.open);}
}
async function logout(){const t=token;token='';snapshot=null;$('gsDashboard').classList.add('gs-hidden');$('gsLogin').classList.remove('gs-hidden');try{await api('gsStaffLogout',t);}catch(_){}}
function printQR(){const e=$('gsQR').querySelector('canvas,img');if(!e)return;const url=e.tagName==='CANVAS'?e.toDataURL('image/png'):e.src;const w=window.open('','_blank');if(!w)return;const h=w.document.createElement('h1');h.textContent='Generasi Sunnah 2026';const image=w.document.createElement('img');image.src=url;image.style.width='360px';w.document.body.append(h,image);image.onload=()=>w.print();}
// Always keep the participant and staff forms on GitHub Pages. Never redirect to /exec.
render();
if(qs.get('mode')!=='urusetia')requestAnimationFrame(()=>root.scrollIntoView({block:'start'}));
refreshPublic();
setInterval(()=>{if(currentTab==='urusetia'&&token)refreshStaff();else refreshPublic();},60000);
})();