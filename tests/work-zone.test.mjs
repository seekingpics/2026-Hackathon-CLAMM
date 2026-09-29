import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,workZone,workZoneAction,workZonePage,resolveLocation,EQUIPMENT,deploymentSummary} from '../dist/work-zone.mjs';

const form={location:'Swan Street, Cremorne',start:'2026-10-01T10:00',end:'2026-10-01T15:00',closure:'full',lanes:2,notes:''};
const rank=v=>['Low','Moderate','High'].indexOf(v);
function reset(){Object.assign(workZone,{form:{...form},category:'signage',qty:{},result:null,resultKey:'',plans:[],activePlan:null,configured:false,deployed:null});}

test('mock simulation matches the demo example for a full two-lane closure with three VMS',()=>{
 const r=simulate(form,{vms:3});
 assert.deepEqual(r,{congestion:'Moderate',queueKm:2.1,delayMin:12,transport:'Minor',pedestrian:'Low',safety:'Medium'});
});
test('full closure congests more than a shoulder closure',()=>{
 assert.ok(rank(simulate(form,{}).congestion)>rank(simulate({...form,closure:'shoulder'},{}).congestion));
 assert.ok(simulate(form,{}).queueKm>simulate({...form,closure:'shoulder'},{}).queueKm);
});
test('barriers and crash cushions lower the safety risk',()=>{
 const partial={...form,closure:'partial'};
 assert.equal(simulate(partial,{}).safety,'High');
 assert.equal(simulate(partial,{'water-barrier':4,'absorb-m':2}).safety,'Medium');
 assert.equal(simulate(partial,{'water-barrier':4,'absorb-m':2,'radar-sign':1}).safety,'Low');
});
test('quantities never go below zero',()=>{
 reset();workZoneAction('dec',{id:'vms'});assert.equal(workZone.qty.vms,undefined);
 workZoneAction('inc',{id:'vms'});workZoneAction('inc',{id:'vms'});workZoneAction('dec',{id:'vms'});assert.equal(workZone.qty.vms,1);
});
test('plans save as A then B and load restores their settings',()=>{
 reset();workZoneAction('inc',{id:'vms'});
 assert.match(workZoneAction('save'),/Plan A/);
 workZoneAction('new-plan');workZoneAction('closure',{value:'shoulder'});workZoneAction('inc',{id:'arrow-board'});
 assert.match(workZoneAction('save'),/Plan B/);
 assert.deepEqual(workZone.plans.map(p=>p.name),['Plan A','Plan B']);
 workZoneAction('load',{name:'Plan A'});
 assert.equal(workZone.form.closure,'full');assert.deepEqual(workZone.qty,{vms:1});assert.ok(workZone.result);
 assert.match(workZonePage(),/<th>Plan A<\/th><th>Plan B<\/th>/);
});
test('known addresses resolve to real road data and others fall back to a mock map',()=>{
 assert.equal(resolveLocation('Church St, Cremorne'),'CR');
 assert.equal(resolveLocation('City Road, Southbank'),'SO');
 assert.equal(resolveLocation('Bridge Road, Richmond'),'RI');
 assert.equal(resolveLocation('123 Test Rd, Geelong'),null);
 reset();workZone.form.location='123 Test Rd, Geelong';
 assert.match(workZonePage(),/Mock street map/);
});
test('equipment shows every category tab but only the active category items',()=>{
 reset();const html=workZonePage();
 assert.equal((html.match(/data-action="wz-category"/g)||[]).length,EQUIPMENT.length);
 assert.match(html,/Variable Message Signs/);assert.doesNotMatch(html,/Jersey Wall Barriers/);
 workZoneAction('category',{value:'barriers'});
 assert.match(workZonePage(),/Jersey Wall Barriers/);
});
test('configure step is not ticked by the pre-filled times alone',()=>{
 const ticked=()=>/<li class="done[^"]*"><span>✓<\/span>Configure work zone/.test(workZonePage());
 reset();workZone.form.location='';assert.equal(ticked(),false);
 workZoneAction('set',{field:'location',value:'Swan Street, Cremorne'});assert.equal(ticked(),false);
 workZoneAction('closure',{value:'full'});assert.equal(ticked(),true);
 reset();workZoneAction('simulate');assert.equal(ticked(),true);
});
test('selecting a plan for deployment records a snapshot and a plain summary',()=>{
 reset();workZoneAction('inc',{id:'vms'});workZoneAction('save');
 workZoneAction('new-plan');workZoneAction('closure',{value:'partial'});workZoneAction('inc',{id:'water-barrier'});workZoneAction('save');
 assert.equal(deploymentSummary(),null);
 assert.match(workZoneAction('select-deploy',{name:'Plan B'}),/Plan B selected/);
 const d=deploymentSummary();
 assert.equal(d.plan,'Plan B');assert.match(d.text,/partial closure/);assert.match(d.text,/1 × Water Filled Barriers/);assert.match(d.text,/Chosen over Plan A/);
 assert.equal(d.changedSinceSelection,false);assert.match(workZonePage(),/Selected for deployment<\/span>/);
 workZoneAction('inc',{id:'jersey'});workZoneAction('save');
 assert.equal(deploymentSummary().changedSinceSelection,true);assert.doesNotMatch(deploymentSummary().text,/Jersey/);
 workZoneAction('clear-deploy');assert.equal(deploymentSummary(),null);
});
