import {homePage,icon,areaBadge,flyCircle} from './home.mjs';
import {supportingCard,supportingSnapshot,evidencePage,FUNCTION_NAMES,functionName,SUPPORT_TOOLS} from './connected-context.mjs';
import {initialiseGovernmentData,refreshRoads,setGovernmentControl,governmentExport} from './government-data.mjs';
import {selectedSite,activeEvents,validity,stamp,STAGES} from './safety-model.mjs';
import {safetyPage,publicNoticePage,setSafetyExtension,workerSafety,handleSafetyAction,handleSafetyInput,handleSafetyFile,refreshSafety,exportSafety,paintSafety} from './safety.mjs';
import {DEFAULTS,PLANS,SCENARIOS,validateAssumptions,snapshot,comparePlans,formatTime} from './model.mjs';
import {esc,btn,metrics,road,events,signs,queueChart} from './visuals.mjs';
import {VIEWS,workerSummary,balance} from './views.mjs';

const app=document.querySelector('#app');
const NAV=[['home','Home','home'],['safety','Worker safety','shield'],['report','Evidence & report','report']];
const TABS={live:'On-site protection',nav:'Navigation map',worker:'Workers & support',layout:'Site layout',supervisor:'Multi-site supervision'};
const state={view:'home',plan:'A',scenario:'peak',assumptions:{...DEFAULTS},time:480,playing:false,speed:10,feed:true,injectAt:null,lastBreak:0,version:1,optimized:false,acknowledged:[],history:[],dialog:null,guide:null,planningTab:'plans',toolExample:false,returnTo:{site:'CR',tab:'live'}};
let exportPreview=null,versionCounter=1,cachedKey='',cachedSnapshot,enterNext=false;
const isTool=()=>Boolean(SUPPORT_TOOLS[state.view]);
const modelAvailable=()=>workerSafety.selected==='CR'||state.toolExample;
const clock=()=>formatTime(480+state.time/60);
function evidenceConfig(){return {plan:state.plan,assumptions:{...state.assumptions},time:state.time,feed:state.feed,injectAt:state.injectAt,lastBreak:state.lastBreak,version:state.version,optimized:state.optimized};}
function current(){
 const key=JSON.stringify([evidenceConfig(),state.acknowledged]);
 if(key!==cachedKey){cachedSnapshot=snapshot(state);cachedSnapshot.events=cachedSnapshot.events.filter(e=>e.module!=='R1');cachedKey=key;}
 const s=cachedSnapshot;
 const site=selectedSite(workerSafety),active=activeEvents(site).filter(e=>e.condition);
 s.worker={continuous:site.worker.duty,fatigue:false,ttc:null,status:validity(site)==='degraded'?'unknown':active.some(e=>e.severity==='high')?'high':active.length?'watch':'clear'};
 for(const e of s.events)if(!state.history.some(h=>h.id===e.id))state.history.push({...e,config:evidenceConfig()});
 if(state.history.length>150)state.history.splice(0,state.history.length-150);
 return s;
}
setSafetyExtension((tab,site)=>supportingCard(tab,site,current(),state));
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4500);}
function bump(){state.version=++versionCounter;state.playing=false;state.time=Math.min(state.time,state.assumptions.horizon);}
function scenario(id){const v=SCENARIOS[id];if(!v)return;Object.assign(state,{scenario:id,feed:v.feed,time:Math.min(v.time,state.assumptions.horizon),injectAt:null,lastBreak:0});state.assumptions.demand=v.demand;bump();}
function setPlan(plan){if(!PLANS[plan])throw Error('Unknown plan');state.plan=plan;bump();}
function routeHash(){return state.view==='safety'?`#safety/${workerSafety.tab}`:state.view==='planning'&&state.planningTab==='notices'?'#planning/notices':`#${state.view}`;}
function updateRoute(replace=false){const hash=routeHash();if(location.hash!==hash)history[replace?'replaceState':'pushState'](null,'',hash);}
function readRoute(){
 const [view,sub]=(location.hash.slice(1)||'home').split('/');
 state.view=['home','safety','report',...Object.keys(SUPPORT_TOOLS)].includes(view)?view:'home';
 if(state.view==='safety'&&TABS[sub])workerSafety.tab=sub;
 if(view==='safety'&&sub==='public'){state.view='planning';state.planningTab='notices';}
 else if(view==='planning')state.planningTab=sub==='notices'?'notices':'plans';
 state.playing=false;
}
function navigate(view){if(view!==state.view)enterNext=true;state.view=view;state.playing=false;state.toolExample=false;updateRoute();window.scrollTo({top:0,behavior:'instant'});}
function openArea(tab){if(!TABS[tab])return;if(tab!==workerSafety.tab||state.view!=='safety')enterNext=true;handleSafetyAction('tab',tab);navigate('safety');}
function openTool(tool){
 if(!SUPPORT_TOOLS[tool])return;
 if(!isTool())state.returnTo={site:workerSafety.selected,tab:state.view==='safety'?workerSafety.tab:SUPPORT_TOOLS[tool].tab};
 state.toolExample=false;state.planningTab='plans';navigate(tool);
}
function returnToSafety(){handleSafetyAction('site',state.returnTo.site);handleSafetyAction('tab',state.returnTo.tab);navigate('safety');}
function launchScenario(mode){
 if(!['vehicle','sos','long'].includes(mode))return;
 handleSafetyAction('tab',mode==='vehicle'?'live':'worker');
 handleSafetyAction(mode==='vehicle'?'case':'worker-case',mode==='vehicle'?'approach':mode);
 navigate('safety');
}
const GUIDE=[
 {title:'Watch the approach',tab:'live',text:'Play the vehicle approach. The watch receives an alert when the moving vehicle enters the trigger area. Acknowledge on the watch to record receipt.',action:'Play vehicle approach'},
 {title:'Support the person',tab:'worker',text:'Press SOS on the watch. Find the highlighted worker, assign a supervisor, arrange support and record the completed handover. Try Extended continuous work to demonstrate a duty reminder.'},
 {title:'Check the worksite',tab:'layout',text:'Review the warning-sign worker’s proposed position and any sight-line or escape-route conflicts. Open Work-zone planning below to compare pedestrian access, bus effects and equipment needs.'},
 {title:'Coordinate the response',tab:'supervisor',text:'Review requests by site and owner. Fleet & charging below provides a separate equipment-delivery model; it does not confirm that equipment has arrived.'},
 {title:'Keep the evidence',view:'report',text:'Review delivery, acknowledgement and response history. Export JSON or CSV, or print this report, to keep a copy after the session ends.'}
];
function guideStep(index){state.guide=index;const step=GUIDE[index];if(step.tab)handleSafetyAction('tab',step.tab);navigate(step.view||'safety');}
function guideMarkup(){
 if(state.guide===null)return '';
 const step=GUIDE[state.guide],atStep=state.view===(step.view||'safety')&&(!step.tab||workerSafety.tab===step.tab);
 return `<section class="guide-bar" aria-label="Guided demo"><div><span class="eyebrow">GUIDED DEMO · ${state.guide+1} OF ${GUIDE.length}</span><h2>${step.title}</h2><p>${step.text}</p><div class="guide-progress" aria-hidden="true">${GUIDE.map((_,i)=>`<i class="${i<=state.guide?'done':''}"></i>`).join('')}</div></div><div class="actions">${atStep&&step.action?btn(step.action,'guide-play','primary'):!atStep?btn('Return to this step','guide-return','primary'):''}${state.guide>0?btn('Previous','guide-prev','small'):''}${btn(state.guide===GUIDE.length-1?'Finish demo':'Next step','guide-next','dark')}${btn('Exit guide','guide-exit','small')}</div></section>`;
}
function controls(){return `<div class="controlbar"><label>MODEL SCENARIO <select id="scenario" aria-label="Model scenario">${Object.entries(SCENARIOS).map(([id,s])=>`<option value="${id}" ${state.scenario===id?'selected':''}>${s.name}</option>`).join('')}${state.scenario==='custom'?'<option selected value="custom">Custom scenario</option>':''}</select></label><div class="plan-switch" aria-label="Active plan">${['A','B'].map(p=>`<button data-action="plan-${p}" class="${p===state.plan?'selected':''}" aria-pressed="${p===state.plan}">Plan ${p}</button>`).join('')}</div>${state.view==='queue'?`<div class="actions">${btn(state.playing?'Pause':'Play model','play','small')}${btn('Reset model','reset','small')}<select id="speed" aria-label="Model playback speed">${[1,10,30].map(n=>`<option value="${n}" ${n===state.speed?'selected':''}>${n}×</option>`).join('')}</select></div><div class="clock" data-live="clock">${clock()}<small>Independent model time</small></div><label style="flex:1;min-width:160px">MODEL REPLAY <input id="scrubber" type="range" min="0" max="${state.assumptions.horizon}" step="1" value="${Math.floor(state.time)}" aria-label="Model replay time"></label>`:''}</div>`;}
function toolContent(s){
 const site=selectedSite(workerSafety),config=SUPPORT_TOOLS[state.view],isNotices=state.view==='planning'&&state.planningTab==='notices';
 const tabs=state.view==='planning'?`<nav class="tool-tabs" aria-label="Work-zone planning sections">${btn('Plan comparison','planning-plans',state.planningTab==='plans'?'selected':'')}${btn('Public works notices','planning-notices',isNotices?'selected':'')}</nav>`:'';
 const intro=`<div class="tool-back">${btn('Back to Worker safety','back-safety')}<p>Supporting tool / ${config.title}</p></div>${tabs}`;
 if(isNotices)return intro+`<div class="notice-wrapper">${publicNoticePage()}</div>`;
 if(!modelAvailable())return intro+`<section class="tool-empty"><span class="eyebrow">${esc(site.name).toUpperCase()}</span><h2>This worksite has not been modelled yet.</h2><p>${config.title} currently has a Cremorne demonstration model. Its results are not estimates for ${esc(site.name)}.</p>${btn('Explore Cremorne example','tool-example','primary')}</section>`;
 const description=state.view==='queue'?'This replay uses its own model clock. It does not follow the on-site animation, send watch alerts or use SCATS as a live queue detector.':state.view==='planning'?'Plan changes update the queue and equipment-delivery models. Review the worker position and safety configuration separately in Site layout.':'Dispatch feasibility checks jobs, payload and battery reserve. It does not confirm physical delivery, equipment availability on site or worksite readiness.';
 return intro+`<div class="tool-notice"><strong>Cremorne illustrative model</strong>${site.id!=='CR'?` · Opened from ${esc(site.name)}; selected worksite retained.`:''}<br>${description}</div>${controls()}${VIEWS[state.view](s,state)}`;
}
function render(){
 const s=current(),site=selectedSite(workerSafety),title=isTool()?SUPPORT_TOOLS[state.view].title:NAV.find(x=>x[0]===state.view)?.[1]||'Home';
 document.title=`${title} · RPM Roadworks Lab`;
 app.innerHTML=`<a class="skip-link" href="#main-content">Skip to content</a><div class="shell"><div class="page"><header class="topbar ${enterNext?'enter':''}"><div class="top-left">${state.view==='safety'?areaBadge(workerSafety.tab):`<button type="button" class="top-brand" data-action="nav-home" aria-label="RPM Roadworks Lab home"><img src="./assets/rpm-hire-logo.png" alt="RPM Hire — Keeping Traffic Moving" width="544" height="190"></button>`}</div><nav class="top-nav" aria-label="Main navigation">${NAV.map(([id,label])=>{const active=state.view===id||(id==='safety'&&isTool());return `<button data-action="nav-${id}" class="top-nav-item ${active?'active':''}" ${active?'aria-current="page"':''}>${label}</button>`;}).join('')}</nav><div class="top-site"><label for="worksite">Selected worksite</label><select id="worksite" aria-label="Selected worksite">${workerSafety.sites.map(s=>`<option value="${s.id}" ${s.id===site.id?'selected':''}>${s.name}</option>`).join('')}</select></div><div class="top-meta"><span class="badge">DEMONSTRATION</span></div></header><main class="content ${state.view==='home'?'is-home':''} ${enterNext?'enter':''}" id="main-content" tabindex="-1">${state.view==='home'?'':`<div class="heading-row"><div><h1>${title}</h1><p class="sub">${state.view==='safety'?'Protect people. Support the worksite.':isTool()?'Connected context for the worker safety workspace.':'Worker records and supporting model evidence.'}</p></div><div class="actions">${btn(state.guide===null?'Start guided demo':'Resume guided demo','tour','dark')}${['report','safety'].includes(state.view)?'':btn('Export scenario','export')}</div></div>`}${guideMarkup()}<div id="view">${state.view==='home'?homePage(site):state.view==='safety'?safetyPage():state.view==='report'?evidencePage(s,state,exportSafety(),governmentExport()):toolContent(s)}</div></main></div></div><div id="dialog-root">${dialogMarkup()}</div>`;
 enterNext=false;
}
function repaintWorkspace(){if(state.view==='safety')paintSafety();else render();}
function dynamic(){
 const s=current();
 for(const [key,html]of Object.entries({metrics:()=>metrics(s),eventcount:()=>`${s.events.length} ACTIVE`,road:()=>road(s),events:()=>events(s),worker:()=>workerSummary(s,state),queuechart:()=>queueChart(s,state.assumptions),balance:()=>balance(s),signs:()=>signs(s),clock:()=>`${clock()}<small>Independent model time</small>`}))document.querySelectorAll(`[data-live="${key}"]`).forEach(el=>el.innerHTML=html());
 const scrub=document.querySelector('#scrubber');if(scrub&&document.activeElement!==scrub)scrub.value=Math.floor(state.time);
 if(state.view==='queue'){const temp=document.createElement('div');temp.innerHTML=VIEWS.queue(s,state);const target=document.querySelector('#view>.metric-grid');if(target)target.innerHTML=temp.querySelector('.metric-grid').innerHTML;}
}
function download(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function exported(){const s=current();return {product:'RPM Roadworks Lab',exportedAt:new Date().toISOString(),source:'Official road context with simulated operations',selectedWorksite:workerSafety.selected,governmentData:governmentExport(),limitations:'Not field validated. No CV inference, fatigue diagnosis or physical sign control. Supporting models apply to the Cremorne illustrative example only.',configuration:evidenceConfig(),workerSafety:exportSafety(),supportingModels:supportingSnapshot(s,state),current:{...s,events:s.events.map(e=>({...e,functionName:functionName(e.module)}))},planComparisons:comparePlans(state.assumptions),events:state.history.map(e=>({...e,functionName:functionName(e.module),acknowledged:state.acknowledged.includes(e.id)})),legacyModuleNames:FUNCTION_NAMES,assumptionsVersion:'fluid-queue-v1 / fixed-roundtrip-fleet-v1 / undiscounted-tco-v1'};}
function showExport(csv=false){
 if(csv){const rows=[['time','site','function','event_id','worker','severity','event','detail','delivery','acknowledged','response','owner','source'],...exportSafety().sites.flatMap(site=>site.events.map(e=>[stamp(e.created),site.name,'Worker safety',e.id,e.recipient,e.severity,e.title,e.basis,e.delivery,e.acknowledged,STAGES[e.stage],e.owner,e.source])),...state.history.map(e=>[formatTime(480+e.time/60),'Cremorne illustrative model',functionName(e.module),e.id,'',e.severity,e.title,e.detail,'Virtual output',state.acknowledged.includes(e.id),'','','Analytical simulation'])];exportPreview={filename:'RPM-event-ledger.csv',text:'\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),type:'text/csv;charset=utf-8'};}
 else exportPreview={filename:`RPM-worker-safety-${current().runId}.json`,text:JSON.stringify(exported(),null,2),type:'application/json'};
 state.dialog='export';state.playing=false;download(exportPreview.filename,exportPreview.text,exportPreview.type);
}
function dialogMarkup(){
 if(!state.dialog)return '';let title,content;
 if(state.dialog==='export'){title='Export preview';content=`<p>Your file has been prepared. If this browser does not save downloads, copy the contents below.</p><label for="export-data">${esc(exportPreview.filename)}</label><textarea id="export-data" aria-label="Export file contents" readonly style="width:100%;height:290px;margin-top:12px;font:12px Consolas,monospace;border:1px solid #d9e2e6;border-radius:6px;padding:12px">${esc(exportPreview.text)}</textarea><div class="actions section-gap">${btn('Download file','download-preview','primary')}${btn('Close','close')}</div>`;}
 else{const e=state.history.find(x=>x.id===state.dialog);if(!e)return '';title='Supporting model evidence';content=`<span class="tag">${functionName(e.module)} · ${e.severity.toUpperCase()}</span><h2 class="section-gap">${esc(e.title)}</h2><p>${esc(e.detail)}</p><p>Cremorne illustrative model · ${formatTime(480+e.time/60)} · ${esc(e.runId)}</p><p>Receipt: ${state.acknowledged.includes(e.id)?'Acknowledged':'Not acknowledged'}</p><p class="note">Replay restores this model’s recorded inputs and time. It does not modify the worker’s layout or send a wearable notification.</p><div class="actions section-gap">${btn('Replay recorded model','replay-event','primary',`data-id="${e.id}"`)}${btn('Acknowledge','ack','',`data-id="${e.id}"`)}</div>`;}
 return `<div class="dialog-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1"><div class="card-head"><h2>${title}</h2>${btn('Close','close','small')}</div><div class="card-body">${content}</div></section></div>`;
}
function focusDialog(){document.querySelector('.dialog')?.focus();}

app.addEventListener('click',event=>{
 const target=event.target;
 if(target.closest('.skip-link')){event.preventDefault();document.querySelector('#main-content')?.focus();return;}
 const refresh=target.closest('[data-government-refresh]');if(refresh){refreshRoads(refresh.dataset.governmentRefresh);return;}
 const bar=target.closest('[data-government-bar]');if(bar){setGovernmentControl('interval',bar.dataset.governmentBar,bar.dataset.governmentSite);repaintWorkspace();return;}
 const ws=target.closest('[data-ws]');if(ws){if(ws.disabled)return;if(ws.dataset.ws==='tab'&&ws.dataset.value!==workerSafety.tab)enterNext=true;handleSafetyAction(ws.dataset.ws,ws.dataset.value);if(['tab','site','multi'].includes(ws.dataset.ws)){updateRoute(true);render();}else repaintWorkspace();return;}
 const button=target.closest('[data-action]');if(!button||button.disabled)return;event.preventDefault();const action=button.dataset.action;
 let fly=null;
 if(action.startsWith('area-')&&button.dataset.area)fly={rect:button.getBoundingClientRect(),tab:button.dataset.area,to:'[data-area-badge]'};
 else if(action==='nav-home'&&state.view==='safety'){const badge=document.querySelector('[data-area-badge]');if(badge)fly={rect:badge.getBoundingClientRect(),tab:workerSafety.tab,to:`.area-circle[data-area="${workerSafety.tab}"]`};}
 try{
  if(action.startsWith('nav-')){const view=action.slice(4);if(isTool()&&view==='safety')returnToSafety();else if(SUPPORT_TOOLS[view])openTool(view);else navigate(view);}
  else if(action.startsWith('area-'))openArea(action.slice(5));
  else if(action.startsWith('demo-'))launchScenario(action.slice(5));
  else if(action.startsWith('tool-')&&action!=='tool-example')openTool(action.slice(5));
  else if(action.startsWith('plan-')){setPlan(action.slice(5));toast(`Plan ${state.plan} applied to the Cremorne queue and delivery models. The worker safety layout is unchanged.`);}
  else switch(action){
   case 'back-safety':returnToSafety();break;
   case 'tool-example':state.toolExample=true;break;
   case 'planning-plans':state.planningTab='plans';updateRoute();break;
   case 'planning-notices':state.planningTab='notices';state.playing=false;updateRoute();break;
   case 'tour-start':guideStep(0);break;
   case 'tour':guideStep(state.guide??0);break;
   case 'guide-return':guideStep(state.guide);break;
   case 'guide-next':if(state.guide===GUIDE.length-1){state.guide=null;toast('Demo complete. Your session evidence is ready to export.');}else guideStep(state.guide+1);break;
   case 'guide-prev':guideStep(Math.max(0,state.guide-1));break;
   case 'guide-exit':state.guide=null;break;
   case 'guide-play':launchScenario('vehicle');break;
   case 'play':state.playing=!state.playing;if(state.time>=state.assumptions.horizon)state.time=0;break;
   case 'reset':state.time=0;state.injectAt=null;state.lastBreak=0;bump();break;
   case 'feed':state.feed=!state.feed;bump();toast(state.feed?'Synthetic queue feed restored.':'Queue feed unavailable. The worker safety feed is independent.');break;
   case 'surge':scenario('surge');break;
   case 'optimize':state.optimized=true;state.view='fleet';bump();updateRoute();toast(current().fleet.feasible?'Feasible dispatch found under the model assumptions.':'No feasible dispatch found within the search.');break;
   case 'unoptimize':state.optimized=false;bump();break;
   case 'charger':state.assumptions.chargerAvailable=!state.assumptions.chargerAvailable;bump();break;
   case 'ack':if(!state.acknowledged.includes(button.dataset.id))state.acknowledged.push(button.dataset.id);toast('Receipt recorded. The modelled risk is unchanged.');break;
   case 'inspect':state.playing=false;state.dialog=button.dataset.id;break;
   case 'replay-event':{const e=state.history.find(x=>x.id===button.dataset.id);if(e){state.returnTo={site:workerSafety.selected,tab:workerSafety.tab};Object.assign(state,e.config,{assumptions:{...e.config.assumptions},playing:false,dialog:null,view:e.module==='R4'?'fleet':e.module==='R3'?'planning':'queue',toolExample:true,planningTab:'plans'});updateRoute();}break;}
   case 'worker-event':handleSafetyAction('site',button.dataset.site);if(button.dataset.worker)handleSafetyAction('worker-select',button.dataset.worker);openArea(button.dataset.kind==='support'?'worker':'supervisor');break;
   case 'close':state.dialog=null;break;
   case 'export':showExport();break;
   case 'csv':showExport(true);break;
   case 'download-preview':download(exportPreview.filename,exportPreview.text,exportPreview.type);break;
   case 'print':window.print();return;
  }
  render();focusDialog();
  if(fly)flyCircle(fly.rect,document.querySelector(fly.to),fly.tab);
 }catch(error){toast(error.message);}
});
app.addEventListener('change',event=>{
 const el=event.target;
 if(el.id==='worksite'){handleSafetyAction('site',el.value);state.toolExample=false;state.playing=false;render();return;}
 if(el.dataset.governmentDetector){setGovernmentControl('detector',el.value,el.dataset.governmentDetector);repaintWorkspace();return;}
 if(el.dataset.governmentInterval){setGovernmentControl('interval',el.value,el.dataset.governmentInterval);repaintWorkspace();return;}
 if(el.hasAttribute('data-ws-file')){handleSafetyFile(el.files[0]);repaintWorkspace();return;}
 if(el.dataset.wsInput){handleSafetyInput(el.dataset.wsInput,el.type==='checkbox'?el.checked:el.value);if(el.dataset.wsInput==='site')render();else repaintWorkspace();return;}
 try{if(el.id==='scenario')scenario(el.value);else if(el.id==='speed')state.speed=Number(el.value);else if(el.id==='scrubber'){state.time=Number(el.value);state.playing=false;}else if(el.dataset.assumption){state.assumptions=validateAssumptions({...state.assumptions,[el.dataset.assumption]:el.type==='checkbox'?el.checked:Number(el.value)});state.scenario='custom';bump();}else return;render();}catch(error){toast(error.message);render();}
});
app.addEventListener('input',e=>{if(e.target.id==='scrubber'){state.time=Number(e.target.value);state.playing=false;dynamic();}});
app.addEventListener('toggle',e=>{if(e.target.dataset?.governmentDetails)setGovernmentControl('expanded',e.target.open,e.target.dataset.governmentDetails);},true);
window.addEventListener('popstate',()=>{readRoute();render();});
window.addEventListener('hashchange',()=>{readRoute();render();});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&state.dialog){state.dialog=null;render();}
 if(e.key==='Tab'&&state.dialog){const controls=[...document.querySelectorAll('.dialog button:not([disabled]), .dialog textarea, .dialog input')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
let last=performance.now();setInterval(()=>{
 const now=performance.now(),dt=Math.min(2,(now-last)/1000);last=now;
 if(state.view==='safety'&&!state.dialog&&!document.hidden){const needsPaint=refreshSafety(dt);if(needsPaint&&!document.activeElement?.matches('input,select,textarea,video')){const focus=document.activeElement?.closest('[data-ws]'),action=focus?.dataset.ws,value=focus?.dataset.value;paintSafety();if(action)Array.from(document.querySelectorAll('[data-ws]')).find(el=>el.dataset.ws===action&&el.dataset.value===value)?.focus({preventScroll:true});}return;}
 if(state.view!=='queue'||!modelAvailable()||!state.playing||state.dialog||document.hidden)return;
 state.time=Math.min(state.assumptions.horizon,state.time+dt*state.speed);if(state.time>=state.assumptions.horizon){state.playing=false;render();}else dynamic();
},250);

if(navigator.modelContext?.registerTool){
 const context=navigator.modelContext,result=value=>({content:[{type:'text',text:JSON.stringify(value)}]});
 try{
  context.registerTool({name:'read_rpm_scenario',description:'Read worker safety records and supporting queue, planning and fleet models. No real equipment is controlled.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:async()=>result(exported())});
  context.registerTool({name:'configure_rpm_scenario',description:'Configure the illustrative Cremorne work-zone model. Does not change the worker safety layout.',inputSchema:{type:'object',properties:{plan:{type:'string',enum:['A','B']},demand:{type:'number',minimum:0,maximum:2400}},additionalProperties:false},execute:async input=>{if(input.plan!==undefined&&!PLANS[input.plan])throw Error('Invalid plan');state.assumptions=validateAssumptions({...state.assumptions,...(input.demand!==undefined?{demand:input.demand}:{})});if(input.plan)state.plan=input.plan;state.scenario='custom';bump();render();return result({site:'Cremorne illustrative model',runId:current().runId,plan:state.plan,demand:state.assumptions.demand});}});
  context.registerTool({name:'optimize_rpm_dispatch',description:'Search up to two job reassignments in the illustrative Cremorne fleet model.',inputSchema:{type:'object',properties:{},additionalProperties:false},execute:async()=>{openTool('fleet');state.toolExample=true;state.optimized=true;bump();render();return result(current().fleet);}});
 }catch(error){console.warn('Optional WebMCP unavailable:',error.message);}
}
readRoute();if(isTool())state.returnTo={site:workerSafety.selected,tab:SUPPORT_TOOLS[state.view].tab};render();
initialiseGovernmentData(()=>{if(!state.dialog&&!document.activeElement?.matches('input,select,textarea')&&(state.view==='safety'||state.view==='planning'&&state.planningTab==='notices'))repaintWorkspace();});
