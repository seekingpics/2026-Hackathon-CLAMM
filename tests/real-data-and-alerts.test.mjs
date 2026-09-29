import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSafety,selectedSite,safetyAction,safetyInput,tickSafety,observeScene,wearableAlert} from '../dist/safety-model.mjs';
import {trafficStats,validRoads,initialiseGovernmentData,governmentExport,refreshRoads} from '../dist/government-data.mjs';
const load=name=>JSON.parse(readFileSync(new URL('../dist/data/'+name,import.meta.url),'utf8'));
const firstTrigger=site=>{for(let t=0;t<18;t+=.05){if(observeScene({...site,replay:t}).triggered)return t;}throw Error('No trajectory trigger');};
test('all hazard scenarios wait for position, then deliver to the watch before acknowledgement',()=>{
  for(const name of ['approach','speed','vehicle','pedestrian']){
    const state=createSafety(),site=selectedSite(state);
    safetyAction(state,'case',name);
    assert.equal(site.replay,0);assert.equal(site.playing,true);assert.equal(site.events.length,0);assert.equal(wearableAlert(site),null);
    const t=firstTrigger(site);tickSafety(state,t-.2);assert.equal(site.events.length,0);assert.equal(wearableAlert(site),null);
    tickSafety(state,.3);const event=site.events.find(e=>e.key===name);
    assert.ok(event);assert.equal(event.delivery,'delivered');assert.equal(event.acknowledged,false);assert.equal(wearableAlert(site).id,event.id);
    safetyAction(state,'ack',event.id);assert.equal(event.condition,true);assert.equal(event.acknowledged,true);
  }
});
test('normal traffic passes without an alert and large frame steps cannot skip an intrusion',()=>{
  const s=createSafety(),site=selectedSite(s);safetyAction(s,'case','normal');tickSafety(s,20);assert.equal(site.events.length,0);
  safetyAction(s,'case','vehicle');tickSafety(s,20);assert.equal(site.events.length,1);assert.equal(site.events[0].condition,false);assert.equal(site.events[0].notificationCount,1);
});
test('replaying a hazard sends a new notification and resets receipt without duplicating the event',()=>{
  const s=createSafety(),site=selectedSite(s);safetyAction(s,'case','vehicle');tickSafety(s,9);const e=site.events[0];safetyAction(s,'ack',e.id);
  safetyAction(s,'rewind');assert.equal(site.replay,0);assert.equal(e.condition,false);tickSafety(s,9);
  assert.equal(site.events.length,1);assert.equal(e.acknowledged,false);assert.equal(e.notificationCount,2);assert.equal(wearableAlert(site).id,e.id);
});
test('failed wearable delivery cannot appear as a received watch alert',()=>{
  const s=createSafety(),site=selectedSite(s);safetyAction(s,'wearable');safetyAction(s,'case','vehicle');tickSafety(s,9);
  const e=site.events.find(e=>e.key==='vehicle');assert.equal(e.delivery,'failed');assert.equal(wearableAlert(site),null);
  safetyAction(s,'wearable');assert.equal(wearableAlert(site),null);safetyAction(s,'retry',e.id);assert.equal(wearableAlert(site).id,e.id);
});
test('an unread notification stays after passage but is not reused by a new replay',()=>{
  const s=createSafety(),site=selectedSite(s);safetyAction(s,'case','vehicle');tickSafety(s,20);
  const event=site.events[0];assert.equal(event.condition,false);assert.equal(wearableAlert(site).id,event.id);
  safetyAction(s,'ack',event.id);assert.equal(wearableAlert(site),null);
  safetyAction(s,'case','vehicle');tickSafety(s,1);assert.equal(wearableAlert(site),null);
});
test('north-side worker placement uses the same geometry for display and trigger',()=>{
  const s=createSafety(),site=selectedSite(s);safetyInput(s,'layout.workerZone','north');safetyAction(s,'case','vehicle');
  const t=firstTrigger(site);tickSafety(s,t+.1);const o=observeScene(site);
  assert.equal(o.restricted.y,70);assert.equal(o.triggered,true);assert.equal(site.events[0].delivery,'delivered');
});
test('official SCATS records preserve known gaps, per-detector totals, identities and attribution',()=>{
  const data=load('scats.json');assert.equal(data.dataDate,'2026-09-27');assert.equal(data.sourceTimezone,'AEST');
  assert.deepEqual(data.sites.map(s=>s.scatsSiteId),[4808,4801,4881]);let complete=0;
  for(const s of data.sites)for(const d of s.detectors){const stats=trafficStats(d.counts);assert.equal(stats.missing,d.missingIntervalCount);if(stats.valid===96){assert.equal(stats.total,d.reportedDailyTotal);complete++;}}
  assert.equal(complete,71);const gap=data.sites[0].detectors.find(d=>d.detectorId===12);
  assert.equal(gap.counts[32],null);assert.equal(trafficStats(gap.counts).missing,4);
  assert.throws(()=>trafficStats(Array(96).fill(-1)));assert.throws(()=>trafficStats(Array(96).fill('0')));
  assert.match(data.attribution,/CC BY 4.0/);
});
test('all three saved road layers contain real validated WGS84 geometry',()=>{
  for(const name of ['cremorne','richmond','southbank'])assert.ok(validRoads(load(name+'.geojson')).features.length>100);
  assert.throws(()=>validRoads({type:'FeatureCollection',features:[]}));assert.throws(()=>validRoads({...load('cremorne.geojson'),exceededTransferLimit:true}));
});
test('road refresh failure retains the saved layer with stale status, and a successful retry recovers',async()=>{
  const originalFetch=globalThis.fetch;let fail=true;
  globalThis.fetch=async url=>{
    const str=String(url);
    if(str.startsWith('./data/'))return{ok:true,json:async()=>load(str.slice(7))};
    if(fail)throw Error('offline');
    return{ok:true,json:async()=>load('cremorne.geojson')};
  };
  try{
    await initialiseGovernmentData(()=>{});let exported=governmentExport();assert.equal(exported.roadLayers.CR.status,'stale');assert.equal(exported.roadLayers.CR.features.length,202);assert.equal(exported.scats.dataDate,'2026-09-27');
    fail=false;await refreshRoads('CR');exported=governmentExport();assert.equal(exported.roadLayers.CR.status,'refreshed');assert.ok(exported.roadLayers.CR.fetchedAt);
  }finally{globalThis.fetch=originalFetch;}
});
