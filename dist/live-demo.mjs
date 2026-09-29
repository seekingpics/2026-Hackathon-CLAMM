// Live demo flow for On-site protection. The safety model stays the source of truth for
// movement, detection and watch delivery; this module only adds the presentation stages
// (choose → moving → detected → responding → resolved) and the user's chosen response.
import {observeScene} from './safety-model.mjs';

export const LIVE_SCENARIOS={
 normal:{case:'normal',title:'Normal traffic',line:'A car passes the worksite as usual.',icon:'car',speed:'50 km/h',risk:0},
 speeding:{case:'approach',title:'Speeding vehicle approaching workers',line:'A fast car heads toward the work crew.',icon:'bolt',speed:'82 km/h',risk:3,watch:'Fast vehicle approaching',outcome:'Vehicle slowing'},
 zone:{case:'vehicle',title:'Vehicle entering restricted work zone',line:'A car drifts into the closed lane.',icon:'sos',speed:'35 km/h',risk:3,watch:'Vehicle entering zone',outcome:'Vehicle slowing'},
 pedestrian:{case:'pedestrian',title:'Pedestrian entering restricted zone',line:'Someone walks into the work area.',icon:'walk',speed:null,risk:2,watch:'Person in work zone',outcome:'Pedestrian left the zone',pedestrian:true}
};
export const RESPONSE_SECONDS=1.6;
const PX_PER_METRE=10;

export function responses(key){
 const s=LIVE_SCENARIOS[key]||LIVE_SCENARIOS.speeding;
 return [
  {id:'sign',label:s.pedestrian?'Sound site alarm':'Activate warning sign',target:s.pedestrian?'Site alarm':'Roadside sign',done:s.pedestrian?'Site alarm sounded':'Warning sign activated'},
  {id:'supervisor',label:'Dispatch supervisor',target:'Supervisor app',done:'Supervisor dispatched'}
 ];
}
export function scenarioForCase(caseId){return Object.keys(LIVE_SCENARIOS).find(k=>LIVE_SCENARIOS[k].case===caseId)||'speeding';}
export function createDemo(){return {run:null,response:null,respondedAt:null,ackAt:null};}
// A new replay (from this page, the home cards or the guide) starts a fresh demo.
export function syncDemo(demo,site){if(demo.run!==site.playbackRun)Object.assign(demo,createDemo(),{run:site.playbackRun});return demo;}
export function hazardEvent(site){return site.events.find(e=>e.type==='hazard'&&e.playbackRun===site.playbackRun)||null;}
export function livePhase(site,demo){
 const event=hazardEvent(site);
 if(event){if(!demo.response)return 'detected';return site.clock-demo.respondedAt<RESPONSE_SECONDS?'responding':'resolved';}
 if(site.case==='normal'&&site.replay===0&&!site.playing)return 'idle';
 if(!site.playing&&site.replay>=18)return 'clear';
 return 'moving';
}
// The scene stops where the hazard was detected, so the user can choose a response.
export function holdAtDetection(site,demo){if(site.playing&&hazardEvent(site)&&!demo.response){site.playing=false;return true;}return false;}
export function workerDistance(site){
 const o=observeScene(site),north=site.layout.workerZone==='north',worker={x:520,y:north?43:314};
 const obj=site.case==='pedestrian'?o.person:o.vehicle;
 return Math.max(1,Math.round(Math.hypot(worker.x-obj.x,worker.y-obj.y)/PX_PER_METRE));
}
