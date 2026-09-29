import {esc,btn,card} from './visuals.mjs';
import {icon} from './home.mjs';

// Plan & simulate: a front-end prototype. Every estimate here is mock data from simple
// demonstration rules — there is no traffic simulation engine behind it.

const svg=(d,cls='')=>`<svg class="ui-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const GLYPHS={
  signage:'M4 4h16v10H4zM8 14v6M16 14v6M8 8h8M8 11h5',
  electronic:'M9 3h6v14H9zM12 6.5h.01M12 10h.01M12 13.5h.01M12 17v4',
  lighting:'M8 3h8v5H8zM12 8v13M8 21h8M5 5.5h1M18 5.5h1',
  barriers:'M3 9h18v6H3zM7 9l-2 6M12 9l-2 6M17 9l-2 6M5 15v4M19 15v4',
  cushions:'M4 7h12l4 5-4 5H4zM8 7v10M12 7v10',
  other:'M12 3 6 20h12L12 3ZM9 12h6M4 20h16',
  queue:'M3 12h3M9 12h3M15 12h3M20 9l2 3-2 3',
  bus:'M6 4h12a2 2 0 0 1 2 2v10H4V6a2 2 0 0 1 2-2ZM4 11h16M7 19v-3M17 19v-3M7.5 13.5h.01M16.5 13.5h.01',
  congestion:'M3 17h18M5 17V9l2-3h10l2 3v8M7 13h.01M17 13h.01'
};

export const EQUIPMENT=[
  {id:'signage',name:'Electronic signage',items:[['vms','Variable Message Signs'],['smart-vms','Smart Variable Message Sign'],['advertising','Advertising Signs'],['video-board','Video Boards'],['vsl','Variable Speed Limit Signs'],['arrow-board','Arrow Boards'],['radar-sign','Radar Speed Signs']]},
  {id:'electronic',name:'Electronic equipment',items:[['traffic-lights','Portable Traffic Lights'],['ped-lights','Pedestrian Portable Traffic Lights'],['trilight','Trilight Portable Traffic Lights'],['cctv','CCTV Camera Trailers'],['portaboom','Portaboom']]},
  {id:'lighting',name:'Lighting',items:[['light-tower','Portable Light Towers'],['solar-street','Portable Solar Street Light Towers'],['light-360','360° Light Tower'],['x-solar','X-Solar Light Towers'],['x-pole','X-Pole Light Towers']]},
  {id:'barriers',name:'Road safety barriers',items:[['steel-barrier','Steel Barriers'],['highwayguard','Highwayguard Steel Barrier'],['water-barrier','Water Filled Barriers'],['jersey','Jersey Wall Barriers'],['klemmfix','Klemmfix'],['hvm','Hostile Vehicle Mitigation Barrier']]},
  {id:'cushions',name:'Crash cushions',items:[['absorb-m','Absorb-M Crash Cushion'],['absorb-350','Absorb 350 Crash Cushion'],['quadguard','Quadguard M10 Crash Cushion'],['raptor','Raptor Crash Cushion'],['smart-cushion','Smart Crash Cushion'],['sled','SLED Crash Cushion']]},
  {id:'other',name:'Other equipment',items:[['road-plates','Steel Road Plates'],['fleyg-ramp','Fleyg Ramp for Steel Road Plates'],['road-quakes','Road Quakes'],['track-mats','Track Mats / Ground Protection Units'],['cone-truck','Cone Trucks']]}
];
const TAB_LABEL={signage:'Signage',electronic:'Electronic',lighting:'Lighting',barriers:'Barriers',cushions:'Crash cushions',other:'Other'};
const CLOSURES={full:'Full closure',partial:'Partial closure',shoulder:'Shoulder closure'};

// Addresses near the three demo worksites use the real Vicmap road layer; anything else gets a mock map.
export const KNOWN_LOCATIONS=[
  {id:'CR',label:'Swan Street & Church Street, Cremorne VIC 3121',keys:['cremorne','swan st','church st']},
  {id:'SO',label:'City Road & Power Street, Southbank VIC 3006',keys:['southbank','city rd','city road','power st']},
  {id:'RI',label:'Bridge Road & Church Street, Richmond VIC 3121',keys:['richmond','bridge rd','bridge road']}
];
export function resolveLocation(text){
  const t=String(text||'').toLowerCase().replace(/street/g,'st').replace(/\s+/g,' ');
  if(!t.trim())return null;
  return KNOWN_LOCATIONS.find(l=>l.keys.some(k=>t.includes(k.replace('street','st'))))?.id||null;
}

const pad=n=>String(n).padStart(2,'0');
const localStamp=(d,h)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(h)}:00`;
function defaultForm(){const d=new Date();d.setDate(d.getDate()+1);return {location:'',start:localStamp(d,10),end:localStamp(d,15),closure:'partial',lanes:1,notes:''};}

export const workZone={form:defaultForm(),category:'signage',qty:{},result:null,resultKey:'',plans:[],activePlan:null,configured:false,deployed:null};
const configKey=()=>{const {notes,...form}=workZone.form;return JSON.stringify([form,workZone.qty]);};
const count=(qty,...ids)=>ids.reduce((sum,id)=>sum+(qty[id]||0),0);
export const totalItems=(qty=workZone.qty)=>Object.values(qty).reduce((a,b)=>a+b,0);

const LEVEL3=['Low','Moderate','High'],RISK=['Low','Medium','High'],TRANSPORT=['None','Minor','Moderate','Major'];
export function simulate(form,qty){
  const hours=(Date.parse(form.end)-Date.parse(form.start))/36e5;
  const duration=Number.isFinite(hours)&&hours>0?hours:6;
  const startHour=Number(String(form.start).slice(11,13))||9,endHour=startHour+duration;
  const overlaps=(a,b)=>startHour<b&&endHour>a;
  const night=startHour>=20||startHour<5;
  const peak=night?.6:overlaps(7,9.5)||overlaps(16,19)?1.3:1;
  const lanes=Math.min(4,Math.max(1,Number(form.lanes)||1));
  const closure={full:1,partial:.55,shoulder:.2}[form.closure]??.55;
  const managed=count(qty,'vms','smart-vms','vsl','arrow-board','radar-sign','traffic-lights','trilight','portaboom','cone-truck');
  const load=closure*(.6+.25*lanes)*peak*(1-Math.min(.35,managed*.05));
  const pedestrian=Math.max(0,({full:1,partial:1,shoulder:0}[form.closure]??1)+(lanes>=3?1:0)+(count(qty,'road-plates')&&!count(qty,'fleyg-ramp')?1:0)-(count(qty,'ped-lights')?1:0));
  const lit=count(qty,'light-tower','solar-street','light-360','x-solar','x-pole');
  const protection=Math.min(2,count(qty,'steel-barrier','highwayguard','water-barrier','jersey','klemmfix','hvm')*.25+count(qty,'absorb-m','absorb-350','quadguard','raptor','smart-cushion','sled')*.5);
  const risk=3+(form.closure==='full'?0:1)+(night&&!lit?1:0)+(duration>10?.5:0)-protection-(count(qty,'vsl','radar-sign')?.5:0)-(count(qty,'cctv')?.25:0);
  return {
    congestion:LEVEL3[load<.5?0:load<1.2?1:2],
    queueKm:Math.round(load*22.5)/10,
    delayMin:Math.max(1,Math.round(load*13)),
    transport:TRANSPORT[load<.3?0:load<1?1:load<1.5?2:3],
    pedestrian:RISK[Math.min(2,Math.max(0,pedestrian-1))],
    safety:RISK[risk<2?0:risk<3.2?1:2]
  };
}

const nextName=()=>`Plan ${'ABCD'.split('').find(l=>!workZone.plans.some(p=>p.name===`Plan ${l}`))}`;
const snapshotConfig=()=>({form:{...workZone.form},qty:{...workZone.qty}});
function run(){workZone.configured=true;workZone.result=simulate(workZone.form,workZone.qty);workZone.resultKey=configKey();}

export function workZoneAction(action,data={}){
  const wz=workZone;
  switch(action){
    case 'set':{
      if(!(data.field in wz.form))throw Error('Unknown work-zone field');
      wz.form[data.field]=data.field==='lanes'?Math.min(4,Math.max(1,Number(data.value)||1)):String(data.value);
      if(data.field!=='location')wz.configured=true;break;
    }
    case 'closure':if(CLOSURES[data.value]){wz.form.closure=data.value;wz.configured=true;}break;
    case 'lanes':wz.form.lanes=Math.min(4,Math.max(1,wz.form.lanes+Number(data.step||0)));wz.configured=true;break;
    case 'category':if(EQUIPMENT.some(c=>c.id===data.value))wz.category=data.value;break;
    case 'inc':wz.qty[data.id]=(wz.qty[data.id]||0)+1;break;
    case 'dec':if(wz.qty[data.id]>1)wz.qty[data.id]--;else delete wz.qty[data.id];break;
    case 'simulate':run();break;
    case 'save':{
      if(wz.resultKey!==configKey())run();
      const existing=wz.plans.find(p=>p.name===wz.activePlan);
      if(existing){Object.assign(existing,snapshotConfig(),{result:wz.result});return `${existing.name} updated.`;}
      if(wz.plans.length>=4)throw Error('Up to four plans can be compared. Delete one first.');
      const plan={name:nextName(),...snapshotConfig(),result:wz.result};
      wz.plans.push(plan);wz.activePlan=plan.name;return `Saved as ${plan.name}.`;
    }
    case 'new-plan':wz.activePlan=null;return 'Alternative started from the current settings. Change anything, then save it as a new plan.';
    case 'load':{
      const plan=wz.plans.find(p=>p.name===data.name);if(!plan)break;
      wz.form={...plan.form};wz.qty={...plan.qty};wz.result=plan.result;wz.resultKey=configKey();wz.activePlan=plan.name;wz.configured=true;break;
    }
    case 'select-deploy':{
      const plan=wz.plans.find(p=>p.name===data.name);if(!plan)throw Error('Save the plan before selecting it.');
      wz.deployed={name:plan.name,form:{...plan.form},qty:{...plan.qty},result:{...plan.result},selectedAt:new Date().toISOString(),
        others:wz.plans.filter(p=>p!==plan).map(p=>({name:p.name,congestion:p.result.congestion,delayMin:p.result.delayMin,safety:p.result.safety}))};
      return `${plan.name} selected for deployment. Its summary is in Evidence & report.`;
    }
    case 'clear-deploy':wz.deployed=null;return 'Deployment selection cleared.';
    case 'delete-plan':wz.plans=wz.plans.filter(p=>p.name!==data.name);if(wz.activePlan===data.name)wz.activePlan=null;break;
    default:throw Error('Unknown work-zone action');
  }
}

// ---------- rendering ----------
const act=(action,label,cls='',extra='')=>btn(label,`wz-${action}`,cls,extra);
const levelClass=v=>['Low','None'].includes(v)?'good':['Moderate','Medium','Minor'].includes(v)?'warn':'bad';

function stepper(){
  const f=workZone.form,stale=workZone.result&&workZone.resultKey!==configKey();
  const hasLocation=Boolean(f.location.trim());
  // Start/end are pre-filled, so step 2 only counts once the user has actually set up the zone.
  const done=[hasLocation,hasLocation&&workZone.configured&&Boolean(f.start&&f.end),totalItems()>0,Boolean(workZone.result)&&!stale,Boolean(workZone.result)&&!stale];
  const current=done.indexOf(false);
  return `<ol class="wz-stepper" aria-label="Planning steps">${['Choose location','Configure work zone','Choose equipment','Run simulation','View impact'].map((label,i)=>`<li class="${done[i]?'done':''} ${i===current?'current':''}"><span>${done[i]?'✓':i+1}</span>${label}</li>`).join('')}</ol>`;
}

function formCard(){
  const f=workZone.form;
  const field=(label,input)=>`<label class="wz-field"><span>${label}</span>${input}</label>`;
  const seg=`<div class="wz-seg" role="group" aria-label="Road closure type">${Object.entries(CLOSURES).map(([id,label])=>act('closure',label,f.closure===id?'selected':'',`data-value="${id}" aria-pressed="${f.closure===id}"`)).join('')}</div>`;
  const body=`<div class="card-body wz-form">
    ${field('Location / address',`<input type="text" data-wz="location" list="wz-locations" placeholder="e.g. Swan Street, Cremorne" value="${esc(f.location)}" autocomplete="off"><datalist id="wz-locations">${KNOWN_LOCATIONS.map(l=>`<option value="${esc(l.label)}">`).join('')}</datalist>`)}
    <div class="wz-two">${field('Start',`<input type="datetime-local" data-wz="start" value="${esc(f.start)}">`)}${field('End',`<input type="datetime-local" data-wz="end" value="${esc(f.end)}">`)}</div>
    <div class="wz-field"><span>Road closure type</span>${seg}</div>
    <div class="wz-field"><span>Lanes affected</span><div class="wz-qty large">${act('lanes','−','',`data-step="-1" aria-label="Fewer lanes" ${f.lanes<=1?'disabled':''}`)}<strong aria-live="polite">${f.lanes}</strong>${act('lanes','+','',`data-step="1" aria-label="More lanes" ${f.lanes>=4?'disabled':''}`)}</div></div>
    ${field('Notes <em>(optional)</em>',`<textarea data-wz="notes" rows="2" placeholder="Access, special events, night works…">${esc(f.notes)}</textarea>`)}
  </div>`;
  return card('Planned work zone','Where and when the works will happen',body);
}

function mockMap(road){
  const name=esc((road||'Main Road').toUpperCase().slice(0,28));
  const length={full:110,partial:90,shoulder:70}[workZone.form.closure]||90;
  const locals=[70,150,230,390,470].map(x=>`<path d="M${x} 0V460" class="gov-road-local"/>`).join('')+[60,140,330,410].map(y=>`<path d="M0 ${y}H540" class="gov-road-local"/>`).join('');
  const zone=`M${300-length} 230H300`;
  return `<svg class="gov-map" viewBox="0 0 540 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mock street map with the planned work zone on ${name}"><rect width="540" height="460" fill="#edf3f5"/>${locals}<path d="M0 230H540" class="gov-road-main"/><path d="M310 0V460" class="gov-road-main"/><path d="${zone}" class="wz-zone-glow"/><path d="${zone}" class="wz-zone"/><path d="${zone}" class="wz-zone-dash"/><g class="gov-map-label"><text x="50" y="220">${name}</text><text x="318" y="110">CROSS STREET</text></g><text x="486" y="55" fill="#264c60" font-size="14">N ↑</text><path d="M44 397h58m-58 -4v8m58 -8v8" stroke="#264c60" stroke-width="2"/><text x="44" y="417" fill="#264c60" font-size="12">100 m</text></svg>`;
}

function mapCard(roadMapFor){
  const f=workZone.form,siteId=resolveLocation(f.location);
  let map,road='',source='';
  if(!f.location.trim()){
    map=`<div class="wz-map-empty">${icon('pin')}<strong>Enter a location to see nearby roads</strong><p>Try a Cremorne, Richmond or Southbank address for real Vicmap road data, or any other address for a mock map.</p></div>`;
  }else{
    const real=siteId&&roadMapFor?roadMapFor(siteId,{full:110,partial:90,shoulder:70}[f.closure]):null;
    if(real){map=real.svg;road=real.road;source='Official Vicmap road centrelines · work zone position is illustrative';}
    else{road=f.location.split(',')[0].replace(/^\d+[a-z]?\s+/i,'');map=mockMap(road);source=siteId?'Loading official road data… showing a mock map for now':'Mock street map · no road data for this address';}
  }
  const chip=f.location.trim()?`<span class="wz-map-chip"><i class="wz-swatch"></i>${esc(CLOSURES[f.closure])} · ${f.lanes} lane${f.lanes>1?'s':''}${road?` · ${esc(road)}`:''}</span>`:'';
  return card('Work zone map',f.location.trim()?esc(f.location):'Nearby roads and the planned work zone',`<div class="card-body wz-map">${map}<div class="wz-map-foot">${chip}<small>${source}</small></div></div>`);
}

function equipmentCard(){
  const cat=EQUIPMENT.find(c=>c.id===workZone.category)||EQUIPMENT[0];
  const inCat=c=>c.items.reduce((sum,[id])=>sum+(workZone.qty[id]||0),0);
  const tabs=`<div class="wz-tabs" role="tablist" aria-label="Equipment categories">${EQUIPMENT.map(c=>{const n=inCat(c);return act('category',`${TAB_LABEL[c.id]}${n?` <b>${n}</b>`:''}`,c.id===cat.id?'selected':'',`role="tab" aria-selected="${c.id===cat.id}" data-value="${c.id}"`);}).join('')}</div>`;
  const rows=cat.items.map(([id,name])=>{const q=workZone.qty[id]||0;return `<li class="${q?'has-qty':''}"><span class="wz-item-icon">${svg(GLYPHS[cat.id])}</span><span class="wz-item-name">${esc(name)}</span><span class="wz-qty">${act('dec','−','',`data-id="${id}" aria-label="Remove one ${esc(name)}" ${q?'':'disabled'}`)}<strong>${q}</strong>${act('inc','+','',`data-id="${id}" aria-label="Add one ${esc(name)}"`)}</span></li>`;}).join('');
  const total=totalItems();
  const body=`<div class="card-body wz-equipment">${tabs}<h3>${esc(cat.name)}</h3><ul class="wz-items">${rows}</ul></div><div class="wz-run"><span>${total?`<strong>${total}</strong> item${total>1?'s':''} selected`:'No equipment selected yet'}</span>${act('simulate',`${icon('clock')} Run simulation`,'primary wz-run-btn')}</div>`;
  return card('Deployable equipment','Choose what will be deployed on site',body);
}

function impactCards(){
  const r=workZone.result,stale=r&&workZone.resultKey!==configKey();
  if(!r)return card('Predicted impacts','Run the simulation to see what is likely to happen',`<div class="card-body wz-impact-empty">${svg(GLYPHS.congestion)}<p>Set up the work zone, choose equipment, then press <strong>Run simulation</strong>.</p></div>`);
  const cards=[
    ['Expected congestion',r.congestion,svg(GLYPHS.congestion),'Traffic flow past the work zone'],
    ['Estimated queue length',`${r.queueKm.toFixed(1)} <small>km</small>`,svg(GLYPHS.queue),'Longest expected queue',r.queueKm<1?'Low':r.queueKm<2.5?'Moderate':'High'],
    ['Estimated travel delay',`+${r.delayMin} <small>min</small>`,icon('clock'),'Extra time per vehicle',r.delayMin<5?'Low':r.delayMin<15?'Moderate':'High'],
    ['Public transport impact',r.transport,svg(GLYPHS.bus),'Buses and trams nearby'],
    ['Pedestrian impact',r.pedestrian,icon('people'),'Footpath access and crossings'],
    ['Safety risk level',r.safety,icon('shield'),'Exposure of workers to traffic']
  ].map(([label,value,ico,detail,level=value])=>`<article class="wz-impact ${levelClass(level)}"><div class="wz-impact-top"><span class="wz-impact-icon">${ico}</span><span class="wz-level">${esc(level)}</span></div><div class="wz-impact-label">${label}</div><div class="wz-impact-value">${value}</div><small>${detail}</small></article>`).join('');
  const note=stale?`<span class="wz-stale">Settings changed · ${btn('Run again','wz-simulate','small')}</span>`:`<span class="wz-note">Illustrative estimate · mock data</span>`;
  return card('Predicted impacts',workZone.activePlan?`${esc(workZone.activePlan)} · ${esc(CLOSURES[workZone.form.closure])}`:'Current setup',`<div class="card-body"><div class="wz-impact-grid ${stale?'is-stale':''}">${cards}</div></div>`,note);
}

const RANK={Low:0,None:0,Minor:1,Moderate:1,Medium:1,High:2,Major:3};
function plansCard(){
  const wz=workZone,active=wz.plans.find(p=>p.name===wz.activePlan);
  const saveLabel=active?`Update ${active.name}`:wz.plans.length>=4?'Plan limit reached':`Save as ${nextName()}`;
  const actions=`<div class="wz-plan-actions">${act('save',saveLabel,'dark small',!active&&wz.plans.length>=4?'disabled':'')}${active?act('new-plan','Create alternative plan','small'):''}</div>`;
  const dep=wz.deployed,depCurrent=dep&&!deploymentChanged()?dep.name:null;
  const banner=dep?`<div class="wz-deploy-banner ${depCurrent?'':'changed'}"><div><strong>${depCurrent?'✓ ':''}${esc(dep.name)} selected for deployment</strong><small>${depCurrent?`Selected ${esc(formatStamp(dep.selectedAt))}`:`${esc(dep.name)} changed after it was selected. Select it again to update the record.`}</small></div><div class="wz-deploy-actions">${btn('View in Evidence & report','nav-report','small')}${act('clear-deploy','Clear selection','small')}</div></div>`:'';
  const chips=wz.plans.length?`<div class="wz-plan-chips">${wz.plans.map(p=>`<span class="wz-plan-chip ${p.name===wz.activePlan?'active':''} ${p.name===depCurrent?'deployed':''}">${btn(`<strong>${esc(p.name)}</strong> ${esc(CLOSURES[p.form.closure])} · ${totalItems(p.qty)} items`,'wz-load','wz-plan-load',`data-name="${esc(p.name)}" aria-pressed="${p.name===wz.activePlan}"`)}${p.name===depCurrent?'<span class="wz-badge-deploy">Selected for deployment</span>':act('select-deploy','Select for deployment','small wz-select',`data-name="${esc(p.name)}"`)}<button class="wz-remove" data-action="wz-delete-plan" data-name="${esc(p.name)}" aria-label="Delete ${esc(p.name)}">×</button></span>`).join('')}</div>`:'<p class="wz-muted">Save the current setup as a plan, then create an alternative to compare different closures or equipment.</p>';
  let table='';
  if(wz.plans.length>=2){
    const rows=[
      ['Congestion',p=>p.result.congestion,p=>RANK[p.result.congestion]],
      ['Queue length',p=>`${p.result.queueKm.toFixed(1)} km`,p=>p.result.queueKm],
      ['Travel delay',p=>`+${p.result.delayMin} min`,p=>p.result.delayMin],
      ['Public transport',p=>p.result.transport,p=>RANK[p.result.transport]],
      ['Pedestrian impact',p=>p.result.pedestrian,p=>RANK[p.result.pedestrian]],
      ['Safety risk',p=>p.result.safety,p=>RANK[p.result.safety]],
      ['Closure',p=>`${CLOSURES[p.form.closure]} · ${p.form.lanes} lane${p.form.lanes>1?'s':''}`],
      ['Equipment',p=>`${totalItems(p.qty)} items`]
    ].map(([label,show,score])=>{const best=score?Math.min(...wz.plans.map(score)):null,tie=score&&wz.plans.every(p=>score(p)===best);return `<tr><th scope="row">${label}</th>${wz.plans.map(p=>`<td class="${score&&!tie&&score(p)===best?'best':''}">${esc(show(p))}</td>`).join('')}</tr>`;}).join('');
    table=`<div class="table-scroll wz-compare"><table><thead><tr><th>Metric</th>${wz.plans.map(p=>`<th>${esc(p.name)}${p.name===depCurrent?' <span class="wz-th-deploy">✓ Deploy</span>':''}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="wz-muted">Highlighted cells show the lowest estimated impact.</p>`;
  }
  return card('Saved plans & comparison','Compare different closures or equipment',`<div class="card-body">${banner}${chips}${table}</div>`,actions);
}

// roadMapFor(siteId, lengthPx) → {svg, road} | null — injected so this module stays testable without road data.
export function workZonePage(roadMapFor=null){
  return `<div class="wz">${stepper()}<div class="wz-grid">${formCard()}${mapCard(roadMapFor)}${equipmentCard()}</div><div class="wz-bottom">${impactCards()}${plansCard()}</div></div>`;
}
const stampFmt=new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short',timeZone:'Australia/Melbourne'});
const formatStamp=iso=>Number.isFinite(Date.parse(iso))?stampFmt.format(new Date(iso)):'—';
function formatWindow(start,end){
  const d=v=>new Date(v),ok=v=>Number.isFinite(Date.parse(v));
  if(!ok(start)||!ok(end))return 'time not set';
  const day=new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric'}),time=new Intl.DateTimeFormat('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});
  return day.format(d(start))===day.format(d(end))?`${day.format(d(start))}, ${time.format(d(start))}–${time.format(d(end))}`:`${day.format(d(start))} ${time.format(d(start))} – ${day.format(d(end))} ${time.format(d(end))}`;
}
const ITEM_NAMES=Object.fromEntries(EQUIPMENT.flatMap(c=>c.items));
export function deploymentChanged(){
  const dep=workZone.deployed;if(!dep)return false;
  const plan=workZone.plans.find(p=>p.name===dep.name);
  return !plan||JSON.stringify([plan.form,plan.qty])!==JSON.stringify([dep.form,dep.qty]);
}
// Plain-English record of the plan chosen for deployment, used by Evidence & report and the exports.
export function deploymentSummary(){
  const dep=workZone.deployed;if(!dep)return null;
  const f=dep.form,r=dep.result,lanes=`${f.lanes} lane${f.lanes>1?'s':''}`,window=formatWindow(f.start,f.end);
  const equipment=Object.entries(dep.qty).filter(([,q])=>q>0).map(([id,quantity])=>({name:ITEM_NAMES[id]||id,quantity}));
  const others=dep.others.map(o=>`${o.name} (${o.congestion} congestion, +${o.delayMin} min)`);
  const sentences=[
    `${dep.name} selected for deployment at ${f.location.trim()||'an unspecified location'} — ${CLOSURES[f.closure].toLowerCase()}, ${lanes}, ${window}.`,
    equipment.length?`Equipment: ${equipment.map(e=>`${e.quantity} × ${e.name}`).join(', ')}.`:'No equipment selected.',
    `Expected impact: ${r.congestion} congestion, ${r.queueKm.toFixed(1)} km queue, +${r.delayMin} min delay, ${r.safety} safety risk.${others.length?` Chosen over ${others.length>1?others.slice(0,-1).join(', ')+' and '+others.at(-1):others[0]}.`:''}`
  ];
  return {plan:dep.name,sentences,text:sentences.join(' '),changedSinceSelection:deploymentChanged(),details:{location:f.location,window,closure:CLOSURES[f.closure],lanes:f.lanes,notes:f.notes,equipment,equipmentCount:equipment.reduce((n,e)=>n+e.quantity,0),impacts:r,alternatives:dep.others,selectedAt:dep.selectedAt,selectedAtDisplay:formatStamp(dep.selectedAt),source:'Mock planning estimate · not a traffic simulation'}};
}

