import {esc,num,btn} from './visuals.mjs';
import {PLANS,formatTime,comparePlans} from './model.mjs';
export {evidencePage} from './evidence-report.mjs';

export const FUNCTION_NAMES={R1:'Worker safety',R2:'Queue warnings',R3:'Work-zone planning',R4:'Fleet & charging',SYSTEM:'Model data'};
export const functionName=id=>FUNCTION_NAMES[id]||id;
export const SUPPORT_TOOLS={queue:{title:'Queue warnings',tab:'live'},planning:{title:'Work-zone planning',tab:'layout'},fleet:{title:'Fleet & charging',tab:'supervisor'}};
const values=items=>`<div class="support-values">${items.map(([v,l])=>`<div><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('')}</div>`;
export function supportingCard(tab,site,s,st){
  const tool=Object.keys(SUPPORT_TOOLS).find(k=>SUPPORT_TOOLS[k].tab===tab);if(!tool)return '';
  const config=SUPPORT_TOOLS[tool],modelled=site.id==='CR';let detail='',foot='';
  if(!modelled){detail=`<p>No ${config.title.toLowerCase()} model has been configured for ${esc(site.name)}.</p>`;foot='The Cremorne example is available inside the supporting tool. Its results do not describe this worksite.';}
  else if(tool==='queue'){
    detail=values([[s.feed?`${num(s.queue.length)} m`:'Unknown','Modelled queue'],[s.queue.speed==null?'No command':`${s.queue.speed} km/h`,'Virtual speed sign']])+`<p>VMS: <strong>${esc(s.queue.vms.replace('\n',' / '))}</strong></p>`;
    foot=`Cremorne illustrative model · ${formatTime(480+s.time/60)} model time (${num(s.time/60,1)} min elapsed). Independent of the on-site replay. SCATS historical counts are context, not live queue detection.`;
  }else if(tool==='planning'){
    detail=values([[`Plan ${s.plan}`,PLANS[s.plan].name],[s.traffic.pedestrian.reachable?`+${num(s.traffic.pedestrian.extraMeters)} m`:'No route','Pedestrian diversion'],[s.traffic.bus.reachable?`+${num(s.traffic.bus.extraSeconds/60,1)} min`:'No route','Modelled bus delay']])+`<p>${s.fleet.equipment.items.map(e=>`${e.quantity} ${e.type.toLowerCase()}`).join(' · ')}</p>`;
    foot='Cremorne illustrative planning assumptions. Comparing plans changes queue and equipment models; the controller position and safety configuration remain subject to their own checks.';
  }else{
    const ev=s.fleet.vehicles.find(v=>v.id==='EV-01');
    detail=values([[s.fleet.feasible?'Model feasible':'Review required','Delivery plan'],[`${num(ev.finalKwh,1)} / ${num(st.assumptions.reserveSoc*st.assumptions.battery)} kWh`,'EV finish / required reserve']])+`<p>${esc(s.fleet.issues[0]||'All modelled job, payload and reserve constraints pass.')}</p>`;
    foot='Cremorne illustrative dispatch · 08:00–13:00. A feasible delivery plan does not confirm equipment has arrived or that a site is ready.';
  }
  return `<section class="support-link" aria-label="${config.title} supporting context"><div><span class="eyebrow">SUPPORTING TOOL · ${modelled?'CREMORNE EXAMPLE':'NOT YET MODELLED'}</span><h3>${config.title}</h3>${detail}<small>${foot}</small></div>${btn(`Open ${config.title.toLowerCase()}`,`tool-${tool}`)}</section>`;
}
export function supportingSnapshot(s,st){return {siteId:'CR',siteName:'Cremorne',source:'Illustrative analytical models; not live or calibrated for this worksite',modelTime:formatTime(480+s.time/60),elapsedSeconds:s.time,analysisWindowSeconds:st.assumptions.horizon,independentOfSafetyClock:true,queueWarnings:s.queue,workZonePlanning:{plan:s.plan,traffic:s.traffic,equipment:s.fleet.equipment,comparisons:comparePlans(st.assumptions)},fleetAndCharging:{dispatch:s.fleet,cost:s.cost},boundaries:['No queue notifications are sent to the wearable','Planning changes do not alter the worker safety layout','Fleet feasibility does not confirm arrival or site readiness','No model is configured for Richmond or Southbank']};}
