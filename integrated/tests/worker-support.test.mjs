import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafety,selectedSite,safetyAction,tickSafety,workerStatus,workerRequests,wearableAlert} from '../dist/safety-model.mjs';
import {renderWorkerSupport} from '../dist/worker-support.mjs';
test('each worker keeps their own scenario, SOS and notification',()=>{const s=createSafety(),site=selectedSite(s),first=site.worker;safetyAction(s,'worker-case','heart');assert.equal(first.bpm,148);assert.equal(wearableAlert(site).key,'heart');safetyAction(s,'worker-select','CR-W02');assert.equal(wearableAlert(site),null);safetyAction(s,'worker-case','long');assert.equal(wearableAlert(site).key,'long-duty');safetyAction(s,'sos');assert.equal(workerStatus(site).tone,'urgent');assert.equal(wearableAlert(site).key,'sos');assert.equal(workerStatus(site,first).label,'High heart rate');assert.equal(workerRequests(site,first).length,1);assert.equal(workerRequests(site).length,2);const html=renderWorkerSupport(site);assert.match(html,/worker-row urgent selected/);assert.doesNotMatch(html,/Wearable battery \(%\)|Heart-rate data quality/);});
test('completion updates only the selected worker and preserves other pending support',()=>{const s=createSafety(),site=selectedSite(s),first=site.worker;safetyAction(s,'worker-case','heart');safetyAction(s,'worker-select','CR-W02');safetyAction(s,'worker-case','sos');const e=workerRequests(site)[0];assert.throws(()=>safetyAction(s,'complete-support'));safetyAction(s,'take',e.id);safetyAction(s,'progress',e.id);safetyAction(s,'complete-support');assert.equal(site.worker.duty,0);assert.equal(workerStatus(site).label,'Support completed');assert.equal(first.bpm,148);assert.equal(workerRequests(site,first).length,1);assert.equal(first.breaks.length,0);});
test('scenario changes preserve review history but show the current active condition',()=>{const s=createSafety(),site=selectedSite(s);safetyAction(s,'worker-case','heart');safetyAction(s,'worker-case','long');assert.equal(workerStatus(site).label,'Extended work');safetyAction(s,'worker-case','normal');assert.equal(workerStatus(site).label,'Review pending');assert.equal(workerRequests(site).length,2);});
test('simplified weather is exclusive and all roster duty clocks advance',()=>{const s=createSafety(),site=selectedSite(s),before=site.roster.map(w=>w.duty);safetyAction(s,'weather-case','heat');assert.equal(site.weather.heat,true);safetyAction(s,'weather-case','rain');assert.equal(site.weather.heat,false);assert.equal(site.weather.rain,true);tickSafety(s,60);site.roster.forEach((w,i)=>assert.ok(Math.abs(w.duty-before[i]-1)<.00001));safetyAction(s,'weather-case','clear');assert.equal(site.weather.rain,false);});
import {safetyInput,safetyExport} from '../dist/safety-model.mjs';
test('two-step support handles new requests and isolates other workers and sites',()=>{
 const state=createSafety(),site=selectedSite(state),otherSite=JSON.stringify(state.sites[1]);
 safetyAction(state,'worker-case','heart');const first=site.worker;
 safetyAction(state,'worker-select','CR-W02');safetyAction(state,'worker-case','long');
 safetyAction(state,'arrange-support');assert.ok(workerRequests(site).every(e=>e.stage===2&&e.owner));
 safetyAction(state,'sos');assert.equal(workerStatus(site).tone,'urgent');assert.throws(()=>safetyAction(state,'complete-support'));
 safetyAction(state,'arrange-support');safetyAction(state,'complete-support');
 assert.equal(site.worker.duty,0);assert.equal(workerRequests(site).length,0);assert.equal(workerRequests(site,first).length,1);
 assert.equal(JSON.stringify(state.sites[1]),otherSite);assert.ok(safetyExport(state).sites[0].events.some(e=>e.stage===3));
});
test('fine tuning and heat cross thresholds without duplicates or premature closure',()=>{
 const state=createSafety(),site=selectedSite(state);
 safetyInput(state,'support-duty',75);safetyInput(state,'weather.heat',true);assert.equal(workerRequests(site).length,0);
 safetyInput(state,'support-duty',90);assert.equal(workerRequests(site).length,1);
 safetyInput(state,'support-duty',105);assert.equal(workerRequests(site).length,1);
 safetyInput(state,'support-duty',180);assert.equal(workerRequests(site).length,2);
 safetyAction(state,'ack',workerRequests(site)[0].id);assert.equal(workerRequests(site).length,2);
 safetyAction(state,'worker-case','normal');assert.equal(workerRequests(site).length,2);assert.ok(workerRequests(site).every(e=>!e.condition));
 for(const invalid of [-15,16,255,NaN])assert.throws(()=>safetyInput(state,'support-duty',invalid));
});
