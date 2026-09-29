import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafety,selectedSite,safetyAction,safetyExport,tickSafety} from '../dist/safety-model.mjs';
import {reportData,notificationStatus,evidencePage} from '../dist/evidence-report.mjs';
import {DEFAULTS,snapshot} from '../dist/model.mjs';
const model={plan:'A',assumptions:{...DEFAULTS},time:480,history:[],acknowledged:[]};
test('site scope, visible selection and summary remain consistent across filters',()=>{
 const ws=createSafety();safetyAction(ws,'sos');safetyAction(ws,'multi');
 const opts={scope:'selected',siteId:'RI'},data=reportData(safetyExport(ws),opts);
 assert.equal(data.events.length,1);assert.equal(data.metrics.support,1);assert.equal(data.selected.site.id,'RI');assert.equal(data.selected.workerName,'Jordan Lee');
 assert.equal(reportData(safetyExport(ws),{scope:'all'}).events.length,3);
 const filtered=reportData(safetyExport(ws),{...opts,response:'closed',selectedId:data.selected.id});
 assert.equal(filtered.selected,null);assert.equal(filtered.metrics.events,1);assert.equal(filtered.rows.length,0);
 assert.equal(reportData(safetyExport(ws),{...opts,selectedId:'CR-E001'}).selected.site.id,'RI');
});
test('failed or unconfirmed delivery never counts as awaiting acknowledgement',()=>{
 const ws=createSafety();safetyAction(ws,'wearable');safetyAction(ws,'sos');
 const site=selectedSite(ws),event=site.events.find(e=>e.key==='sos'),before=JSON.stringify(ws);
 assert.equal(notificationStatus(event).label,'Delivery failed');
 assert.equal(reportData(safetyExport(ws)).metrics.awaiting,0);
 assert.equal(reportData(safetyExport(ws)).unconfirmed,1);
 assert.equal(reportData(safetyExport(ws)).rows.find(e=>e.type==='data')!==undefined,true);
 assert.equal(JSON.stringify(ws),before);
 assert.equal(notificationStatus({...event,delivery:'unknown',acknowledged:true}).label,'Delivery unconfirmed');
});
test('handover count counts one relief action rather than each closed support event',()=>{
 const ws=createSafety();safetyAction(ws,'sos');safetyAction(ws,'rest');
 const site=selectedSite(ws);for(const e of site.events){safetyAction(ws,'take',e.id);safetyAction(ws,'progress',e.id);}
 safetyAction(ws,'complete-support');const data=reportData(safetyExport(ws));
 assert.equal(data.metrics.events,2);assert.equal(data.metrics.relief,1);assert.equal(data.metrics.support,0);assert.equal(data.metrics.awaiting,0);
 assert.equal(notificationStatus(data.events[0]).label,'No receipt recorded');
});
test('report selection and rendering preserve operational audit records',()=>{
 const ws=createSafety();safetyAction(ws,'case','approach');tickSafety(ws,12);
 const e=selectedSite(ws).events.find(e=>e.type==='hazard'),before=JSON.stringify(ws);
 const html=evidencePage(snapshot(model),model,safetyExport(ws),{}, {selectedId:e.id});
 assert.match(html,/Watch alert delivered/);assert.match(html,/Acknowledgement pending/);assert.match(html,/Trigger: <strong>Active/);
 assert.match(html,/data-action="worker-event" data-site="CR"/);
 assert.equal(JSON.stringify(ws),before);
 safetyAction(ws,'ack',e.id);const ackHtml=evidencePage(snapshot(model),model,safetyExport(ws),{});
 assert.match(ackHtml,/Acknowledgement received/);assert.equal(reportData(safetyExport(ws)).metrics.awaiting,0);assert.equal(e.stage,0);assert.equal(e.condition,true);
});
test('empty report offers real scenarios instead of displaying sample records',()=>{
 const html=evidencePage(snapshot(model),model,safetyExport(createSafety()),{});
 assert.match(html,/No worker events recorded yet/);assert.match(html,/data-action="demo-sos"/);
 assert.doesNotMatch(html,/Alex Morgan|09:42|data-action="report-select"/);
 assert.match(html,/JSON \/ CSV include all worksites/);assert.match(html,/Illustrative Cremorne model/);
});
test('record text is escaped in both event rows and details',()=>{
 const ws=createSafety();safetyAction(ws,'sos');const site=selectedSite(ws);site.roster[0].name='<img src=x onerror=alert(1)>';site.events[0].owner='<script>bad()</script>';
 const html=evidencePage(snapshot(model),model,safetyExport(ws),{});
 assert.doesNotMatch(html,/<script>|<img src=x/);assert.match(html,/&lt;img/);assert.match(html,/&lt;script/);
});
