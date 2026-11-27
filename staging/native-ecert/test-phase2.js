/* Phase 2 offline regression tests. Google integration requires separate evidence. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const source = fs.readFileSync(path.join(root,'Engine.gs'),'utf8');
const properties = {};
const sandbox = {
  Date, console,
  PropertiesService: {getScriptProperties: () => ({getProperty: key => properties[key] || ''})}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'Eligibility.gs'),'utf8')+'\n'+source,sandbox);
let pass = 0;
function test(name, run) {
  run();
  pass += 1;
  console.log('PASS '+name);
}
test('day one blocks closure',() => assert.equal(sandbox.ecBatchEnded_('2026-11-28T12:00:00+08:00',1),false));
test('day two midnight blocks closure',() => assert.equal(sandbox.ecBatchEnded_('2026-11-29T00:00:00+08:00',1),false));
test('day two final second blocks closure',() => assert.equal(sandbox.ecBatchEnded_('2026-11-29T23:59:59+08:00',1),false));
test('next midnight allows batch one closure',() => assert.equal(sandbox.ecBatchEnded_('2026-11-30T00:00:00+08:00',1),true));
test('batch two final second blocks closure',() => assert.equal(sandbox.ecBatchEnded_('2026-12-06T23:59:59+08:00',2),false));
test('next midnight allows batch two closure',() => assert.equal(sandbox.ecBatchEnded_('2026-12-07T00:00:00+08:00',2),true));
test('UTC converts to Malaysia',() => assert.equal(sandbox.ecBatchEnded_('2026-11-29T16:00:00Z',1),true));
test('invalid clock blocks closure',() => assert.equal(sandbox.ecBatchEnded_('bad',1),false));
test('email execution always blocked',() => assert.throws(() => sandbox.ecSendQa('QA-A'),/email disabled/));
test('engine contains no MailApp invocation',() => assert.equal(source.includes('MailApp.'),false));
console.log(pass+' Phase 2 offline regression tests passed.');
