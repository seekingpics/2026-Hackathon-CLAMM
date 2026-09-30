import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafety,selectedSite,safetyAction,tickSafety,safetyExport} from '../dist/safety-model.mjs';
import {DEFAULTS,snapshot} from '../dist/model.mjs';
import {supportingCard,supportingSnapshot,evidencePage} from '../dist/connected-context.mjs';
import {governmentPanel} from '../dist/government-data.mjs';
import {safetyPage,publicNoticePage,workerSafety} from '../dist/safety.mjs';

const st={plan:'A',assumptions:{...DEFAULTS},time:480,history:[],acknowledged:[]};
test('other worksites never inherit Cremorne model metrics in supporting summaries',()=>{
 const ws=createSafety(),s=snapshot(st);
 for(const site of ws.sites.slice(1))for(const tab of ['live','supervisor']){
  const html=supportingCard(tab,site,s,st);
  assert.match(html,/NOT YET MODELLED/);assert.match(html,new RegExp(site.name));
  assert.doesNotMatch(html,/140 m|60 km\/h|8,250|30\.0 \/ 48/);
 }
 assert.equal(supportingCard('worker',ws.sites[0],s,st),'');
 assert.equal(supportingCard('supervisor',ws.sites[0],s,st),'');
 assert.equal(supportingCard('layout',ws.sites[0],s,st),'','Work-zone planning is its own page, not a Worker safety card');
 assert.match(supportingCard('live',ws.sites[0],s,st),/140 m/);
});
test('supporting snapshots label their independent site and time without changing safety records',()=>{
 const ws=createSafety();safetyAction(ws,'case','approach');tickSafety(ws,12);
 const before=JSON.stringify(safetyExport(ws));
 const out=supportingSnapshot(snapshot({...st,plan:'B'}),{...st,plan:'B'});
 assert.equal(out.siteId,'CR');assert.equal(out.modelTime,'08:08');assert.equal(out.independentOfSafetyClock,true);
 assert.equal(JSON.stringify(safetyExport(ws)),before);
 assert.equal(out.workZonePlanning.comparisons.length,2);
});
test('report combines worker event audit and scoped supporting evidence using function names',()=>{
 const ws=createSafety();safetyAction(ws,'sos');const e=selectedSite(ws).events.find(e=>e.key==='sos');
 safetyAction(ws,'take',e.id);safetyAction(ws,'progress',e.id);safetyAction(ws,'complete-support');
 const s=snapshot(st),history=s.events.filter(e=>e.module!=='R1');
 const html=evidencePage(s,{...st,history},safetyExport(ws),{});
 assert.match(html,/Worker SOS/);assert.match(html,/Trigger &amp; history|Trigger & history/);
 assert.match(html,/Handover|handover/);assert.match(html,/Queue warnings/);assert.match(html,/Fleet &amp; charging|Fleet & charging/);
 assert.doesNotMatch(html,/\bR[1-4]\b/);
});
test('worker safety has four core areas and notices retain an independent planning surface',()=>{
 workerSafety.tab='live';const html=safetyPage();
 assert.equal((html.match(/data-ws="tab" data-value="(?:live|worker|layout|supervisor)" class="/g)||[]).length,4);
 assert.doesNotMatch(html,/data-ws="tab" data-value="public"/);
 assert.match(publicNoticePage(),/Works details & publication preview/);
 assert.doesNotMatch(governmentPanel(workerSafety.sites[0],'layout'),/<details[^>]*\sopen[\s>]/);
});
