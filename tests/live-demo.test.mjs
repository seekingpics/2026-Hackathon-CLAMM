import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafety,selectedSite,safetyAction,tickSafety,CASES} from '../dist/safety-model.mjs';
import {LIVE_SCENARIOS,responses,scenarioForCase,createDemo,syncDemo,hazardEvent,livePhase,holdAtDetection,workerDistance,RESPONSE_SECONDS} from '../dist/live-demo.mjs';

// Runs the replay like the page does: small ticks, stopping where the hazard is detected.
function run(key){
 const s=createSafety(),site=selectedSite(s),demo=createDemo();
 safetyAction(s,'case',LIVE_SCENARIOS[key].case);syncDemo(demo,site);
 for(let i=0;i<200&&site.playing;i++){tickSafety(s,.1);holdAtDetection(site,demo);}
 return {s,site,demo};
}
test('live demo offers four plain-language scenarios mapped to existing model cases',()=>{
 assert.deepEqual(Object.values(LIVE_SCENARIOS).map(x=>x.case),['normal','approach','vehicle','pedestrian']);
 for(const x of Object.values(LIVE_SCENARIOS))assert.ok(x.case in CASES);
 assert.equal(scenarioForCase('approach'),'speeding');
 assert.deepEqual(responses('pedestrian').map(r=>r.label),['Sound site alarm','Dispatch supervisor']);
});
test('hazard scenarios pause at detection with an alert delivered and a measured distance',()=>{
 for(const key of ['speeding','zone','pedestrian']){
  const {site,demo}=run(key);
  assert.equal(livePhase(site,demo),'detected',key);assert.equal(site.playing,false);
  assert.ok(site.replay<18,key);assert.equal(hazardEvent(site).delivery,'delivered');
  assert.ok(workerDistance(site)>0);
 }
});
test('a chosen response moves through responding to resolved on the simulation clock',()=>{
 const {s,site,demo}=run('speeding');
 demo.response='sign';demo.respondedAt=site.clock;
 assert.equal(livePhase(site,demo),'responding');
 tickSafety(s,RESPONSE_SECONDS+.1);
 assert.equal(livePhase(site,demo),'resolved');
});
test('normal traffic finishes without a hazard and a new replay resets the demo',()=>{
 const {s,site,demo}=run('normal');
 assert.equal(livePhase(site,demo),'clear');assert.equal(hazardEvent(site),null);
 demo.response='sign';safetyAction(s,'case','approach');syncDemo(demo,site);
 assert.equal(demo.response,null);assert.equal(livePhase(site,demo),'moving');
});
