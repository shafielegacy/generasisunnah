/* GS26 Native eCERT: local deterministic tests, no Google access and no email. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = __dirname;
const context = {
  Date, console,
  PropertiesService: {getScriptProperties: () => ({
    getProperty: key => context.properties[key] || '',
    setProperty: (key, value) => {context.properties[key] = value;}
  })},
  Session: {getActiveUser: () => ({getEmail: () => 'qa.owner@example.invalid'})},
  LockService: {getScriptLock: () => ({tryLock: () => true,releaseLock: () => {}})},
  MailApp: {getRemainingDailyQuota: () => 100,sendEmail: () => {throw new Error('UNEXPECTED SEND');}},
  properties: {}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'Eligibility.gs'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'Engine.gs'),'utf8'),context);
const E = context.ecEvaluate_;
const rosterHeader = ['Email address','Nama penuh','Pilihan batch program','No_Resit','No_Sijil',
  'Merged Doc ID - eCERT GS26','Document Merge Status - eCERT GS26'];
const checkinHeader = ['Checkin_ID','Sesi','No_Resit','Waktu_Checkin','Kaedah','Direkod_Oleh'];
const correctionHeader = ['No_Resit','Sesi','Hadir','Alasan','Operator','Waktu'];
const person = (receipt='QA-R1',certificate='QA-S1',batch=1,email='parent@example.com') =>
  [email,'Peserta Ujian','Batch '+batch,receipt,certificate,'',''];
const event = (id,session,receipt='QA-R1',when,method='QR PESERTA') =>
  [id,session,receipt,when || (session==='b1d2'?'2026-11-29T09:00:00+08:00':
    '2026-11-28T09:00:00+08:00'),method,'QA Operator'];
const two = [event('E1','b1d1'),event('E2','b1d2')];
const run = (people=[person()],events=two,corrections=[]) =>
  E([rosterHeader,...people],[checkinHeader,...events],[correctionHeader,...corrections]);
const status = r => r.rows[0].eligibility;
let passed = 0;
function test(label,fn) {
  try {fn();passed++;process.stdout.write('PASS '+label+'\n');}
  catch(err) {process.stderr.write('FAIL '+label+'\n');throw err;}
}
test('two distinct valid days eligible',() => assert.equal(status(run()),'ELIGIBLE'));
test('single day not eligible',() => assert.equal(status(run([person()],[two[0]])),'NOT_ELIGIBLE'));
test('no check-in not eligible',() => assert.equal(status(run([person()],[])),'NOT_ELIGIBLE'));
test('different batch day not eligible',() => assert.equal(status(run([person('QA-R1','QA-S1',2)],[])),'NOT_ELIGIBLE'));
test('duplicate receipt forces review',() => {
  const x=run([person(),person('QA-R1','QA-S2')]);
  assert.equal(x.rows[0].eligibility,'REVIEW');assert.equal(x.rows[1].eligibility,'REVIEW');
});
test('duplicate certificate forces review',() => {
  const x=run([person(),person('QA-R2','QA-S1')]);
  assert.equal(x.rows[0].eligibility,'REVIEW');assert.equal(x.rows[1].eligibility,'REVIEW');
});
test('invalid email forces review',() =>
  assert.equal(status(run([person('QA-R1','QA-S1',1,'bad-email')])),'REVIEW'));
test('prior AutoCrat output forces review',() => {
  const p=person();p[5]='already-merged';assert.equal(status(run([p])),'REVIEW');
});
test('wrong batch attendance forces review',() =>
  assert.equal(status(run([person()],[...two,event('E3','b2d1')])),'REVIEW'));
test('check-in on wrong date forces review',() =>
  assert.equal(status(run([person()],[two[0],event('E2','b1d2','QA-R1','2026-11-30T09:00:00+08:00')])),'REVIEW'));
test('invalid method forces review',() =>
  assert.equal(status(run([person()],[event('E1','b1d1','QA-R1',null,'UNKNOWN'),two[1]])),'REVIEW'));
test('duplicate session forces review',() =>
  assert.equal(status(run([person()],[...two,event('E3','b1d1')])),'REVIEW'));
test('duplicate event ID forces review',() =>
  assert.equal(status(run([person()],[event('E1','b1d1'),event('E1','b1d2')])),'REVIEW'));
test('orphan check-in surfaced',() => assert.equal(run([person()],[...two,event('E3','b1d1','QA-MISSING')]).orphans.length,1));
test('valid correction adds second day',() => {
  const fix=['QA-R1','b1d2',true,'Manual attendance reviewed','qa.owner@example.invalid',
    '2026-11-29T10:00:00+08:00'];
  assert.equal(status(run([person()],[two[0]],[fix])),'ELIGIBLE');
});
test('negative correction removes attendance',() => {
  const fix=['QA-R1','b1d2',false,'Verified absent by staff','qa.owner@example.invalid',
    '2026-11-29T10:00:00+08:00'];
  assert.equal(status(run([person()],two,[fix])),'NOT_ELIGIBLE');
});
test('invalid correction requires review',() => {
  const fix=['QA-R1','b1d2',true,'x','qa.owner@example.invalid','2026-11-29T10:00:00+08:00'];
  assert.equal(status(run([person()],[two[0]],[fix])),'REVIEW');
});
test('ambiguous local date requires review',() =>
  assert.equal(status(run([person()],[event('E1','b1d1','QA-R1','28/11/2026 09:00'),two[1]])),'REVIEW'));
test('real Date objects accepted',() =>
  assert.equal(status(run([person()],[event('E1','b1d1','QA-R1',new Date('2026-11-28T09:00:00+08:00')),two[1]])),'ELIGIBLE'));
test('missing source header fails closed',() =>
  assert.throws(() => E([['No_Resit'],['QA-R1']],[checkinHeader],[]),/Header tiada/));
const ids = ['qaSource123456789012345','qaLedger123456789012345',
  'qaTemplate1234567890123','qaFolder123456789012345'];
const validProps = () => ({
  EC_MODE:'QA',EC_QA_SOURCE_ID:ids[0],EC_QA_LEDGER_ID:ids[1],
  EC_QA_TEMPLATE_ID:ids[2],EC_QA_OUTPUT_FOLDER_ID:ids[3],
  EC_QA_ALLOWED_OPERATORS:'qa.owner@example.invalid',EC_QA_EMAIL:'qa.recipient@example.com'
});
test('QA config accepted',() => {
  context.properties=validProps();assert.equal(context.ecConfig_().sourceId,ids[0]);
});
test('production mode blocked',() => {
  context.properties={...validProps(),EC_MODE:'PRODUCTION'};
  assert.throws(() => context.ecConfig_(),/bukan QA/);
});
test('official roster blocked in QA',() => {
  context.properties={...validProps(),EC_QA_SOURCE_ID:'1YOlKCIfBd6FNJji6p4SjQtuBQOqr3zVFbtC2Nj1mwvc'};
  assert.throws(() => context.ecConfig_(),/terasing/);
});
test('official template blocked in QA',() => {
  context.properties={...validProps(),EC_QA_TEMPLATE_ID:'1tFY8IqyXKdUloW8bSnp1Z1TNmvN6ojHFyqMmgvY_6gU'};
  assert.throws(() => context.ecConfig_(),/terasing/);
});
test('send disabled by default',() => {
  context.properties=validProps();
  assert.throws(() => context.ecSendQa('QA-R1'),/email disabled/);
});
process.stdout.write('\n'+passed+' tests passed. No Google writes, PDF or emails.\n');
