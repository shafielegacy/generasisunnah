/**
 * Generasi Sunnah 2026 — Mini Check-in (standalone Apps Script backend)
 * Source spreadsheet is READ-ONLY. Only KEHADIRAN_GS receives appended rows.
 * For use in the dedicated GenerasiSunnah Apps Script project only.
 * Deploy: execute as owner, access anyone; staff functions require separate key/session.
 * Never publish GS_STAFF_KEY or venue codes to GitHub.
 */
const GS_CFG_ = Object.freeze({
  spreadsheetId: '1YOlKCIfBd6FNJji6p4SjQtuBQOqr3zVFbtC2Nj1mwvc',
  rosterSheet: 'Daftar GS',
  attendanceSheet: 'KEHADIRAN_GS',
  timezone: 'Asia/Kuala_Lumpur',
  staffTtlSeconds: 1800,
  maxSearchResults: 100,
  headers: ['Checkin_ID','Sesi','No_Resit','Waktu_Checkin','Kaedah','Direkod_Oleh','Nota'],
  sessions: [
    {key:'b1d1',batch:1,day:1,date:'2026-11-28',label:'Batch 1 · Hari 1 · 28 November'},
    {key:'b1d2',batch:1,day:2,date:'2026-11-29',label:'Batch 1 · Hari 2 · 29 November'},
    {key:'b2d1',batch:2,day:1,date:'2026-12-05',label:'Batch 2 · Hari 1 · 5 Disember'},
    {key:'b2d2',batch:2,day:2,date:'2026-12-06',label:'Batch 2 · Hari 2 · 6 Disember'}
  ]
});

function doGet(e) {
  if(e && e.parameter && e.parameter.view==='quota'){
    const publicData=gsPublicQuota_();
    return ContentService.createTextOutput('window.GSQuotaReceive('+JSON.stringify(publicData)+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return HtmlService.createHtmlOutputFromFile('Checkin')
    .setTitle('Generasi Sunnah 2026 — Check-in')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * PUBLIC AGGREGATE ONLY: Source 'DASHBOARD KUOTA' A3:E4.
 * Never return participant names, receipts, contact details or access codes.
 */
function gsPublicQuota_(){
  const tab=SpreadsheetApp.openById(GS_CFG_.spreadsheetId).getSheetByName('DASHBOARD KUOTA');
  if(!tab)throw new Error('Dashboard kuota tidak tersedia.');
  const rows=tab.getRange(3,1,2,5).getDisplayValues();
  const batches=rows.map((r,i)=>{
    if(!/^Batch\s*[12]/i.test(String(r[0]||'')))throw new Error('Format batch tidak dijangka.');
    const toInt=x=>{const n=Number(String(x).replace(/,/g,''));if(!Number.isInteger(n)||n<0)return null;return n;};
    const registered=toInt(r[1]),quota=toInt(r[2]),remaining=toInt(r[3]);
    if([registered,quota,remaining].some(v=>v===null))throw new Error('Data kuota tidak sah.');
    const raw=String(r[4]||'').toUpperCase();
    const status=raw.includes('DITUTUP')?'DITUTUP':raw.includes('PENUH')?'PENUH':raw.includes('DIBUKA')?'DIBUKA':'SEMAKAN';
    return {batch:i+1,registered,quota,remaining,status};
  });
  return {batches,updatedAt:Utilities.formatDate(new Date(),GS_CFG_.timezone,'yyyy-MM-dd HH:mm')};
}

/**
 * Safe JSON API for a same-origin-approved server-side bridge.
 * Client credentials are always POSTed, never placed in a URL.
 * Only the listed existing functions may be called.
 */
function doPost(e) {
  const output = obj => ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  try {
    const raw = e && e.postData && String(e.postData.contents || '');
    if (!raw || raw.length > 4096) throw new Error('Permintaan tidak sah.');
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || !Array.isArray(input.args) || input.args.length > 4)
      throw new Error('Format permintaan tidak sah.');
    let result;
    switch (String(input.action || '')) {
      case 'gsPublicStatus':
        if (input.args.length) throw new Error('Parameter tidak sah.');
        result=gsPublicStatus(); break;
      case 'gsSelfCheckin':
        if (input.args.length!==1) throw new Error('Parameter tidak sah.');
        result=gsSelfCheckin(input.args[0]); break;
      case 'gsStaffLogin':
        if (input.args.length!==1) throw new Error('Parameter tidak sah.');
        result=gsStaffLogin(input.args[0]); break;
      case 'gsStaffLogout':
        if (input.args.length!==1) throw new Error('Parameter tidak sah.');
        result=gsStaffLogout(input.args[0]); break;
      case 'gsStaffSnapshot':
        if (input.args.length!==3) throw new Error('Parameter tidak sah.');
        result=gsStaffSnapshot(input.args[0],input.args[1],input.args[2]); break;
      case 'gsStaffSetOpen':
        if (input.args.length!==3) throw new Error('Parameter tidak sah.');
        result=gsStaffSetOpen(input.args[0],input.args[1],input.args[2]); break;
      case 'gsStaffCheckin':
        if (input.args.length!==4) throw new Error('Parameter tidak sah.');
        result=gsStaffCheckin(input.args[0],input.args[1],input.args[2],input.args[3]); break;
      default: throw new Error('Tindakan tidak sah.');
    }
    return output({ok:true,data:result});
  } catch (err) {
    const message=err && err.message ? String(err.message).slice(0,160) : 'Ralat sistem.';
    return output({ok:false,error:message});
  }
}

/** Run once from the Apps Script editor, not from the public web application. */
function gsSetupOnce_() {
  const ss = SpreadsheetApp.openById(GS_CFG_.spreadsheetId);
  const roster = ss.getSheetByName(GS_CFG_.rosterSheet);
  if (!roster) throw new Error('Tab Daftar GS tidak dijumpai. Tiada perubahan dibuat.');
  const cols = gsColumns_(roster.getRange(1,1,1,roster.getLastColumn()).getDisplayValues()[0]);
  for (const k of ['receipt','name','batch','phone']) if (cols[k] < 0) throw new Error('Header data pendaftaran tiada: '+k);
  let attendance = ss.getSheetByName(GS_CFG_.attendanceSheet);
  if (!attendance) {
    attendance = ss.insertSheet(GS_CFG_.attendanceSheet);
    attendance.getRange(1,1,1,7).setValues([GS_CFG_.headers]);
    attendance.setFrozenRows(1);
    attendance.getRange(1,1,1,7).setFontWeight('bold').setBackground('#12513e').setFontColor('#ffffff');
    attendance.setColumnWidths(1,7,160);
    attendance.setColumnWidth(4,195);
  } else gsAttendance_(ss); // validate existing header, do not alter records
  return 'Setup selesai. Tiada rekod peserta atau AutoCrat diubah.';
}

function gsDay_(){ return Utilities.formatDate(new Date(), GS_CFG_.timezone, 'yyyy-MM-dd'); }
function gsSession_(key) {
  const result = GS_CFG_.sessions.find(s=>s.key===String(key||''));
  if (!result) throw new Error('Sesi tidak sah.');
  return result;
}
function gsProperties_(){return PropertiesService.getScriptProperties();}
function gsOpen_(key){return gsProperties_().getProperty('GS_OPEN_'+key)==='true';}
function gsCode_(key){return gsProperties_().getProperty('GS_CODE_'+key)||'';}
function gsHash_(str){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(str)).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function gsSafeEqual_(a,b){
  const x=gsHash_(String(a||'')),y=gsHash_(String(b||'')); let diff=0;
  for(let i=0;i<x.length;i++) diff|=x.charCodeAt(i)^y.charCodeAt(i);
  return diff===0;
}
function gsPublicSession_(s){return {key:s.key,label:s.label,date:s.date,open:gsOpen_(s.key)&&gsDay_()===s.date};}
function gsPublicStatus(){return {sessions:GS_CFG_.sessions.map(gsPublicSession_),today:gsDay_()};}
function gsRequireEvent_(session){
  const s=gsSession_(session);
  if(gsDay_()!==s.date || !gsOpen_(s.key)) throw new Error('Check-in untuk sesi ini belum dibuka atau sudah ditutup.');
  return s;
}
function gsColumns_(head){
  const names=head.map(h=>String(h||'').trim().toLowerCase().replace(/\s+/g,' '));
  const col=(...opts)=>names.findIndex(h=>opts.some(o=>h===o));
  return {receipt:col('no_resit'),name:col('nama penuh'),batch:col('pilihan batch program'),phone:col('nombor telefon whatsapp')};
}
function gsRoster_(){
  const sheet=SpreadsheetApp.openById(GS_CFG_.spreadsheetId).getSheetByName(GS_CFG_.rosterSheet);
  if(!sheet) throw new Error('Tab pendaftaran tidak dijumpai.');
  const values=sheet.getDataRange().getDisplayValues();
  if(!values.length) throw new Error('Tiada header pendaftaran.');
  const c=gsColumns_(values[0]);
  if(Object.keys(c).some(k=>c[k]<0)) throw new Error('Header pendaftaran telah berubah; sistem ditutup untuk keselamatan.');
  const seen={};
  const rows=values.slice(1).filter(x=>String(x[c.receipt]||'').trim()).map(x=>{
    const receipt=String(x[c.receipt]).trim().toUpperCase();
    if(seen[receipt]) throw new Error('No_Resit berganda dalam rekod pendaftaran.');
    seen[receipt]=true;
    const b=String(x[c.batch]||''); const match=b.match(/\bBatch\s*([12])\b/i);
    if(!match) throw new Error('Batch tidak dikenal pasti dalam rekod pendaftaran.');
    return {receipt,name:String(x[c.name]||'').trim(),batch:Number(match[1]),phoneDigits:String(x[c.phone]||'').replace(/\D/g,'')};
  });
  return rows;
}
function gsAttendance_(ss){
  const tab=ss.getSheetByName(GS_CFG_.attendanceSheet);
  if(!tab) throw new Error('Tab KEHADIRAN_GS belum wujud. Jalankan gsSetupOnce_ dahulu.');
  const header=tab.getRange(1,1,1,7).getDisplayValues()[0];
  if(header.some((v,i)=>v!==GS_CFG_.headers[i])) throw new Error('Header KEHADIRAN_GS telah berubah. Tiada rekod ditulis.');
  return tab;
}
function gsRecords_(tab,session){
  if(tab.getLastRow()<2)return new Set();
  // A:G / Checkin_ID,Sesi,No_Resit,...
  const values=tab.getRange(2,1,tab.getLastRow()-1,3).getDisplayValues();
  return new Set(values.filter(r=>r[1]===session).map(r=>String(r[2]||'').trim().toUpperCase()));
}
function gsWriteCheckin_(session,receipt,method,actor){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000)) throw new Error('Sistem sedang sibuk. Cuba lagi sebentar.');
  try{
    gsRequireEvent_(session);
    const ss=SpreadsheetApp.openById(GS_CFG_.spreadsheetId);
    const tab=gsAttendance_(ss);
    const people=gsRoster_();
    const p=people.find(x=>x.receipt===receipt);
    if(!p || p.batch!==gsSession_(session).batch) throw new Error('Rekod peserta tidak sepadan dengan batch.');
    const existing=gsRecords_(tab,session);
    if(existing.has(receipt)) return {ok:true,already:true,message:'Kehadiran peserta sudah direkod untuk sesi ini.'};
    tab.appendRow([Utilities.getUuid(),session,receipt,new Date(),method,actor,'']);
    SpreadsheetApp.flush();
    return {ok:true,already:false,message:'Kehadiran berjaya direkod.'};
  }finally{lock.releaseLock();}
}
function gsRateLimit_(id){
  const cache=CacheService.getScriptCache();
  const key='GS_PUBLIC_RATE_'+gsHash_(id).slice(0,32);
  const count=Number(cache.get(key)||0)+1;
  cache.put(key,String(count),900);
  if(count>8) throw new Error('Terlalu banyak percubaan. Sila dapatkan bantuan urusetia.');
}
/** Public self-check-in; no names, contact details or roster are returned. */
function gsSelfCheckin(data){
  if(!data || typeof data!=='object') throw new Error('Maklumat tidak lengkap.');
  const s=gsRequireEvent_(data.session);
  const receipt=String(data.receipt||'').trim().toUpperCase();
  const last4=String(data.last4||'').trim();
  const code=String(data.code||'').trim().toUpperCase();
  if(!/^[A-Z0-9_-]{5,24}$/.test(receipt) || !/^\d{4}$/.test(last4) || !/^[A-F0-9]{12}$/.test(code))throw new Error('Maklumat tidak lengkap atau tidak sah.');
  gsRateLimit_(receipt);
  if(!gsSafeEqual_(code,gsCode_(s.key))) throw new Error('Kod lokasi tidak sah. Sila imbas QR terkini di tempat program.');
  const person=gsRoster_().find(x=>x.receipt===receipt&&x.batch===s.batch);
  if(!person || !person.phoneDigits.endsWith(last4))throw new Error('Maklumat tidak dapat disahkan. Semak nombor resit dan 4 digit terakhir telefon penjaga.');
  return gsWriteCheckin_(s.key,receipt,'QR PESERTA','PESERTA');
}
function gsCheckKey_(key){
  const saved=String(gsProperties_().getProperty('GS_STAFF_KEY')||'');
  if(saved.length<8)throw new Error('Kunci urusetia belum dikonfigurasi (minimum 8 aksara).');
  const cache=CacheService.getScriptCache();
  const attempts=Number(cache.get('GS_STAFF_FAILED')||0);
  if(attempts>=15)throw new Error('Login dikunci sementara. Cuba selepas 15 minit.');
  if(!gsSafeEqual_(key,saved)){
    cache.put('GS_STAFF_FAILED',String(attempts+1),900);
    throw new Error('Kunci urusetia tidak sah.');
  }
  cache.remove('GS_STAFF_FAILED');
}
function gsStaffLogin(key){
  gsCheckKey_(String(key||''));
  const session=Utilities.getUuid()+Utilities.getUuid();
  CacheService.getScriptCache().put('GS_STAFF_SESSION_'+gsHash_(session), '1', GS_CFG_.staffTtlSeconds);
  return {token:session,expiresInSeconds:GS_CFG_.staffTtlSeconds};
}
function gsStaff_(token){
  if(typeof token!=='string' || !/^[0-9a-fA-F-]{72}$/.test(token)) throw new Error('Sila login sebagai urusetia.');
  const key='GS_STAFF_SESSION_'+gsHash_(token);
  const cache=CacheService.getScriptCache();
  if(cache.get(key)!=='1') throw new Error('Sesi tamat. Sila login semula.');
  cache.put(key,'1',GS_CFG_.staffTtlSeconds);
}
function gsStaffLogout(token){gsStaff_(token);CacheService.getScriptCache().remove('GS_STAFF_SESSION_'+gsHash_(token));return true;}
function gsStaffSnapshot(token,session,query){
  gsStaff_(token);
  const s=gsSession_(session),q=String(query||'').trim().toLowerCase().slice(0,100);
  const roster=gsRoster_().filter(x=>x.batch===s.batch);
  const tab=gsAttendance_(SpreadsheetApp.openById(GS_CFG_.spreadsheetId));
  const present=gsRecords_(tab,s.key);
  const matches=roster.filter(p=>(p.name+' '+p.receipt).toLowerCase().includes(q)).slice(0,GS_CFG_.maxSearchResults);
  return {session:gsPublicSession_(s),total:roster.length,present:present.size,people:matches.map(p=>({name:p.name,receipt:p.receipt,present:present.has(p.receipt)})),venueCode:gsOpen_(s.key)&&gsDay_()===s.date?gsCode_(s.key):'',webAppUrl:ScriptApp.getService().getUrl()||''};
}
function gsStaffSetOpen(token,session,open){
  gsStaff_(token);
  const s=gsSession_(session);
  if(gsDay_()!==s.date)throw new Error('Sesi hanya boleh dibuka pada tarikh program '+s.date+'.');
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw new Error('Sistem sedang sibuk.');
  try{
    const props=gsProperties_();
    if(open===true){
      // Rotate the code each time a session goes from closed to open.
      if(!gsOpen_(s.key))props.setProperty('GS_CODE_'+s.key,Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase());
      props.setProperty('GS_OPEN_'+s.key,'true');
    }else if(open===false){props.setProperty('GS_OPEN_'+s.key,'false');props.deleteProperty('GS_CODE_'+s.key);}
    else throw new Error('Status tidak sah.');
    return gsPublicSession_(s);
  }finally{lock.releaseLock();}
}
function gsStaffCheckin(token,session,receipt,operator){
  gsStaff_(token);
  const s=gsRequireEvent_(session);
  const id=String(receipt||'').trim().toUpperCase();
  if(!/^[A-Z0-9_-]{5,24}$/.test(id))throw new Error('Nombor resit tidak sah.');
  const name=String(operator||'').trim().replace(/[\r\n\t]/g,' ').slice(0,60);
  return gsWriteCheckin_(s.key,id,'URUS SETIA','URUS SETIA'+(name?' · '+name:''));
}