// Worker Safety v2: deterministic demonstration, independent of physical equipment.
export const CASES={normal:'Normal vehicle passing',approach:'Vehicle approaching workers',speed:'Simulated speeding',vehicle:'Vehicle entering restricted zone',pedestrian:'Pedestrian entering restricted zone'};
export const STAGES=['Awaiting action','Assigned','In progress','Closed'];
export const stamp=n=>`${String(Math.floor((8*3600+12*60+n)/3600)%24).padStart(2,'0')}:${String(Math.floor((12*60+n)/60)%60).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
const copy=x=>JSON.parse(JSON.stringify(x));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
// Rendering and detection share these coordinates. Scenario selection never injects an event.
export function observeScene(site){
  const t=site.replay,north=site.layout.workerZone==='north',x=55+t*(site.case==='speed'?68:50);
  const turn=Math.max(0,Math.min(1,(x-260)/230));
  const y=175+(['approach','vehicle'].includes(site.case)?(north?-85:65)*turn:0);
  const vehicle={x,y,w:64,h:24},person={x:550,y:north?175-t*8:140+t*8};
  const restricted={x:478,y:north?70:220,w:252,h:50};
  const warning={x:400,y:north?40:190,w:360,h:100};
  const speedZone={x:300,y:142,w:430,h:66};
  const box={x:x-32,y:y-12,w:64,h:24};
  const triggered=site.case==='approach'?overlaps(box,warning):site.case==='vehicle'?overlaps(box,restricted):site.case==='speed'?overlaps(box,speedZone):site.case==='pedestrian'?overlaps({x:person.x-8,y:person.y-8,w:16,h:32},restricted):false;
  return{vehicle,person,restricted,warning,speedZone,triggered,activeType:triggered?site.case:null};
}
export function wearableAlert(site){
  if(delivery(site)!=='delivered')return null;
  return activeEvents(site).filter(e=>e.recipient===site.worker.id&&e.type!=='data'&&e.delivery==='delivered'&&(e.condition||(!e.acknowledged&&e.type==='hazard'&&e.playbackRun===site.playbackRun))).sort((a,b)=>Number(b.condition)-Number(a.condition)||(a.type==='hazard'?-1:0)-(b.type==='hazard'?-1:0)||(a.severity==='high'?-1:0)-(b.severity==='high'?-1:0)||Number(a.acknowledged)-Number(b.acknowledged)||b.updated-a.updated)[0]||null;
}
function makeSite(id,name,road,workers,template){return{id,name,road,workers,clock:0,online:true,edge:true,occluded:false,lastSync:0,sequence:0,events:[],cloud:[],pending:[],synced:0,case:'normal',replay:0,playing:false,weather:{heat:false,rain:false,fog:false,wind:false,humidity:65,sun:'High',workload:'High',ppe:'Full'},worker:{id:`${id}-W01`,duty:105,total:240,heart:'missing',motion:'moving',connected:true,worn:true,battery:78,breaks:[],support:'none'},layout:{template,obstacle:template==='corner',extra:false,range:60,lead:5,separation:3,entry:'west',workerZone:'south',escape:'south',cameraPosition:40,localLink:true,power:true,revision:1,confirmed:null,validUntil:'2026-09-29T17:00'}};}
export const WORKER_CASES={normal:'Normal shift',heart:'High heart rate',long:'Extended continuous work',sos:'SOS / urgent help',rest:'Break requested'};
export function roster(site){return site.roster||[site.worker];}
export function workerRequests(site,w=site.worker){return activeEvents(site).filter(e=>e.type==='support'&&e.recipient===w.id);}
export function workerStatus(site,w=site.worker){const requests=workerRequests(site,w),sos=requests.some(e=>e.key==='sos');return{tone:sos?'urgent':requests.length?'attention':'normal',label:sos?'SOS — urgent help':requests.some(e=>e.key==='heart'&&e.condition)?'High heart rate':requests.some(e=>e.key==='long-duty'&&e.condition)?'Extended work':requests.length?(requests.some(e=>e.condition)?'Support requested':'Review pending'):w.support==='completed'?'Support completed':'On duty',sos,requests};}
function initialiseRoster(site){const names=['Jordan Lee','Sam Taylor','Casey Morgan','Riley Wilson','Jamie Patel','Morgan Brown','Alex Nguyen','Charlie Evans'];site.roster=Array.from({length:site.workers},(_,i)=>({...copy(site.worker),id:site.id+'-W'+String(i+1).padStart(2,'0'),name:names[i],heart:'valid',bpm:78+i*2,duty:i===0?105:45+i*8,scenario:'normal'}));site.worker=site.roster[0];return site;}
export function createSafety(){return{tab:'live',selected:'CR',clock:0,sites:[makeSite('CR','Cremorne','Swan Street / Church Street',6,'corner'),makeSite('RI','Richmond','Bridge Road / Church Street',4,'straight'),makeSite('SO','Southbank','City Road / Power Street',8,'straight')].map(initialiseRoster),message:''};}
export function selectedSite(state){return state.sites.find(s=>s.id===state.selected);}
export function activeEvents(site){return site.events.filter(e=>e.stage!==3);}
export function delivery(site){return!site.edge||!site.layout.power||!site.layout.localLink||!site.worker.connected?'failed':!site.worker.worn||site.worker.battery<20?'unknown':'delivered';}
export function validity(site){return !site.edge||!site.layout.power||!site.layout.localLink||site.occluded||!site.worker.connected||!site.worker.worn||site.worker.battery<20?'degraded':'available';}
export function coverage(layout){const directions=layout.template==='corner'?3:2;const required=directions+(layout.obstacle?1:0);const cameras=2+(layout.extra?2:0);const gaps=[];if(cameras<required)gaps.push(`${required-cameras} approach or obstructed directions lack coverage`);if(layout.range<50)gaps.push('Illustrative detection range does not cover the far entry');if(layout.cameraPosition>70)gaps.push('Device is too far from the entry; the entry section is not covered');if(!layout.localLink)gaps.push('Local communications are unavailable');if(!layout.power)gaps.push('Device power is unavailable');if(layout.escape==='road')gaps.push('Escape route crosses traffic; select another location');return{directions,cameras,radars:layout.extra?2:1,gaps,covered:gaps.length===0};}
function sync(site){if(!site.online)return;site.synced+=site.pending.length;site.cloud=copy(site.events);site.cloudHealth=validity(site);site.cloudDuty=site.worker.duty;site.cloudWorkers=site.workers;site.lastSync=site.clock;site.pending=[];}
function changed(site,event){event.updated=site.clock;event.revision++;event.audit.push({at:site.clock,stage:event.stage,delivery:event.delivery,acknowledged:event.acknowledged,owner:event.owner,condition:event.condition,basis:event.basis,result:event.result});if(!site.pending.includes(event.id))site.pending.push(event.id);sync(site);}
function ensureEvent(site,key,type,title,severity,basis,active=true,target=site.worker){let event=site.events.find(e=>e.key===key&&e.stage!==3&&(type!=='support'||e.recipient===target.id));if(!event){event={id:`${site.id}-E${String(++site.sequence).padStart(3,'0')}`,key,type,title,severity,basis,created:site.clock,updated:site.clock,configVersion:site.layout.revision,configConfirmed:site.layout.confirmed===site.layout.revision,stage:0,owner:'',originalBasis:basis,recipient:target.id,channels:['vibration','buzzer','visual'],audit:[],condition:active,delivery:type==='data'?'unknown':delivery({...site,worker:target}),acknowledged:false,playbackRun:site.playbackRun,lastNotifiedAt:site.clock,notificationCount:type==='data'?0:1,result:'',revision:0,source:'Simulated observation / demonstration rule',observedAt:site.clock};site.events.unshift(event);changed(site,event);}else if(event.condition!==active||event.basis!==basis){if(active&&!event.condition&&event.type!=='data'){event.playbackRun=site.playbackRun;event.delivery=delivery({...site,worker:target});event.acknowledged=false;event.lastNotifiedAt=site.clock;event.notificationCount=(event.notificationCount||0)+1;}event.condition=active;event.basis=basis;event.observedAt=site.clock;changed(site,event);}return event;}
function updateCondition(site,key,condition,recipient){const event=site.events.find(e=>e.key===key&&e.stage!==3&&(!recipient||e.recipient===recipient));if(event&&event.condition!==condition){event.condition=condition;changed(site,event);}}
export function evaluateSafety(site){
  const observed=site.edge&&site.layout.power&&!site.occluded;
  const activeType=observeScene(site).activeType;
  for(const key of ['approach','speed','vehicle','pedestrian']){
    if(observed&&key===activeType){const title={approach:'Vehicle approaching the worker zone',speed:'Vehicle exceeds the demo alert speed',vehicle:'Vehicle entering restricted zone',pedestrian:'Pedestrian entering restricted zone'}[key];const basis={approach:'Synthetic track V-01 is approaching the worker zone. Alert lead time is illustrative.',speed:'Simulated speed: 52 km/h > demo trigger: 40 km/h. Speed is not measured from video.',vehicle:'Synthetic vehicle V-01 overlaps the restricted zone.',pedestrian:'Synthetic pedestrian P-01 crosses the restricted boundary. This is an intrusion advisory, distinct from a high-speed vehicle alert.'}[key];ensureEvent(site,key,'hazard',title,key==='pedestrian'?'watch':'high',basis);}
    else if(observed)updateCondition(site,key,false);
  }
  const degraded=validity(site)==='degraded';
  if(degraded)ensureEvent(site,'data','data','Protection degraded','watch','Site equipment, visibility or wearable data is unavailable or unreliable. Activate backup alerts and follow the site procedure.');else updateCondition(site,'data',false);
  for(const w of roster(site)){
    const signals=[['heat-duty',site.weather.heat&&w.duty>=90,'Heat and extended duty: arrange support','Heat scenario with extended duty. Arrange an on-site check and relief.'],['heart',w.scenario==='heart'&&w.heart==='valid','High heart rate: check on worker','Simulated elevated reading. Check on the worker; this is not a diagnosis.'],['long-duty',w.duty>=180,'Extended continuous work: arrange a break','Demo reminder at 180 minutes. This is an illustrative trigger, not an approved rest interval.']];
    for(const [key,on,title,basis] of signals){if(on)ensureEvent(site,key,'support',title,'watch',basis,true,w);else updateCondition(site,key,false,w.id);}
  }
  if(site.weather.rain||site.weather.fog||site.weather.wind)ensureEvent(site,'weather','weather','Environmental conditions need on-site assessment','watch',`${site.weather.rain?'Rain / slippery surfaces; ':''}${site.weather.fog?'Low visibility / reduced detection capability; ':''}${site.weather.wind?'Strong winds / check equipment mounting; ':''}Demonstration scenario, not an approved site policy.`);else updateCondition(site,'weather',false);
  sync(site);
}
export function tickSafety(state,seconds=1){if(!Number.isFinite(seconds)||seconds<0)return;let remaining=seconds;do{const step=Math.min(remaining,.1);state.clock+=step;for(const site of state.sites){site.clock=state.clock;if(site.playing){site.replay=Math.min(18,site.replay+step);if(site.replay>=18)site.playing=false;}for(const w of roster(site)){w.duty+=step/60;w.total+=step/60;}evaluateSafety(site);}remaining-=step;}while(remaining>1e-8);}
export function safetyAction(state,action,value){const site=selectedSite(state);state.message='';
  if(action==='tab'){state.tab=value;return;}
  if(action==='site'){if(!state.sites.some(s=>s.id===value))throw Error('Site not found');state.selected=value;return;}
  if(action==='worker-select'){const w=roster(site).find(w=>w.id===value);if(!w)throw Error('Worker not found');site.worker=w;return;}
  if(action==='worker-case'){
    if(!(value in WORKER_CASES))throw Error('Invalid worker scenario');
    const w=site.worker;w.scenario=value;w.heart='valid';w.bpm=value==='heart'?148:78;w.duty=value==='long'?180:60;w.total=Math.max(w.total,w.duty);w.motion='moving';
    if(value==='sos'||value==='rest')safetyAction(state,value);
    state.message='Simulated worker condition updated. Existing support requests remain open until reviewed or completed.';
  }
  else if(action==='weather-case'){if(!['clear','heat','rain','fog','wind'].includes(value))throw Error('Invalid weather scenario');for(const key of ['heat','rain','fog','wind'])site.weather[key]=key===value;}
  else if(action==='case'){if(!(value in CASES))throw Error('Invalid scenario');site.case=value;site.playbackRun=(site.playbackRun||0)+1;site.replay=0;site.playing=true;state.message='Replay started. Alerts are sent automatically when the moving object reaches the marked trigger area.';}
  else if(action==='play'){if(site.replay>=18){site.playbackRun=(site.playbackRun||0)+1;site.replay=0;}site.playing=!site.playing;}
  else if(action==='rewind'){site.playbackRun=(site.playbackRun||0)+1;site.replay=0;site.playing=true;}
  else if(action==='clear'){if(!site.edge||!site.layout.power||site.occluded)throw Error('Observation is unavailable. Restore equipment or visibility before confirming that the hazard has cleared.');site.case='normal';site.replay=0;state.message='Hazard condition marked as cleared. The event remains open until its owner reviews and closes it.';}
  else if(action==='online'){site.online=!site.online;state.message=site.online?'Sync restored. Existing event IDs updated without creating duplicates.':'Internet disconnected. Local processing continues in the simulation; the supervisor sees the last synced data.';}
  else if(action==='edge')site.edge=!site.edge;
  else if(action==='occlusion')site.occluded=!site.occluded;
  else if(action==='wearable')site.worker.connected=!site.worker.connected;
  else if(action==='sos'||action==='rest'){site.worker.support='requested';ensureEvent(site,action,'support',action==='sos'?'Worker SOS: urgent support required':'Worker requested a break',action==='sos'?'high':'watch',action==='sos'?'Worker pressed SOS. Awaiting assignment and support from the site supervisor.':'Worker requested a break. Awaiting relief arrangements.');}
  else if(action==='ack'||action==='take'||action==='progress'||action==='close'||action==='retry'){const event=site.events.find(e=>e.id===value);if(!event)throw Error('Event not found');if(event.stage===3)throw Error('Event is already closed');if(action==='ack'){if(event.delivery!=='delivered'||delivery(site)!=='delivered')throw Error('Delivery to the worker is not confirmed. Acknowledgement cannot be recorded.');event.acknowledged=true;state.message='Worker acknowledgement recorded. The hazard status is unchanged.';}if(action==='retry'){event.delivery=delivery(site);event.lastNotifiedAt=site.clock;event.notificationCount=(event.notificationCount||0)+1;state.message='Simulated notification result updated.';}if(action==='take'){event.owner='Alex Chen · Site supervisor';event.stage=Math.max(1,event.stage);}if(action==='progress'){if(!event.owner)throw Error('Assign a supervisor first.');event.stage=2;}if(action==='close'){if(!event.owner)throw Error('Assign a supervisor first.');if(event.condition)throw Error('The trigger condition is still active. This event cannot be closed.');event.stage=3;event.result='The event owner confirmed that the trigger had cleared and completed an on-site review (simulated).';}changed(site,event);}
  else if(action==='complete-support'){const targets=workerRequests(site);if(!targets.length||targets.some(e=>e.stage!==2))throw Error('Assign each support request and arrange relief or assistance first.');site.worker.breaks.push({time:site.clock,dutyBefore:site.worker.duty,owner:'Alex Chen',result:'Handover and break completed (simulated)'});site.worker.duty=0;site.worker.scenario='normal';site.worker.bpm=78;site.worker.support='completed';for(const event of targets){event.condition=false;event.stage=3;event.result='Worker handover, break or support confirmed as complete (simulated).';changed(site,event);}state.message='Support completed. Handover and break recorded; continuous duty reset.';}
  else if(action==='confirm-layout'){if(!site.layout.validUntil||!Number.isFinite(Date.parse(site.layout.validUntil)))throw Error('Enter a valid configuration expiry date and time.');if(coverage(site.layout).gaps.length)throw Error('Resolve the coverage or escape-route gaps before confirming this configuration.');site.layout.confirmed=site.layout.revision;state.message='Demo configuration confirmed. This does not certify the site layout as safe.';}
  else if(action==='multi'){for(const other of state.sites.filter(s=>s.id!==site.id)){ensureEvent(other,'rest','support','Worker requested relief','watch','Simulated worker request from another site.');sync(other);}state.tab='supervisor';}
  evaluateSafety(site);
}
export function safetyInput(state,key,value){const site=selectedSite(state);if(key==='replay'){site.replay=Math.max(0,Math.min(18,Number(value)));site.playing=false;}
  else if(key.startsWith('weather.')){site.weather[key.slice(8)]=value;}
  else if(key.startsWith('worker.')){const field=key.slice(7);if(['battery','duty'].includes(field)){value=Number(value);if(!Number.isFinite(value)||value<0||value>(field==='battery'?100:480))throw Error('Value is outside the demo range.');}site.worker[field]=value;}
  else if(key.startsWith('layout.')){const field=key.slice(7);if(['range','lead','separation','cameraPosition'].includes(field)){value=Number(value);const bounds={range:[10,120],lead:[1,15],separation:[1,10],cameraPosition:[0,100]}[field];if(!Number.isFinite(value)||value<bounds[0]||value>bounds[1])throw Error('Configuration value is outside the demo range.');}site.layout[field]=value;if(field==='template'){site.layout.obstacle=value==='corner';site.layout.extra=false;}site.layout.revision++;site.layout.confirmed=null;}
  evaluateSafety(site);
}
export function safetyExport(state){return{version:'worker-safety-v2',source:'simulation',region:'Melbourne, Victoria',clock:state.clock,sites:copy(state.sites),limitations:['No live CCTV, AI inference or calibrated video speed','No physical device or real offline reliability validation','No health diagnosis','Session-only state; export to retain evidence']};}
