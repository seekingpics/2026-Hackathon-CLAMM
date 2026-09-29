import {esc} from './visuals.mjs';
export const DATA_SITES={CR:'cremorne',RI:'richmond',SO:'southbank'};
const state={scats:null,manifest:[],roads:{},detectors:{},intervals:{},expanded:{},error:'',ready:false};
let changed=()=>{};
const fmt=new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short',timeZone:'Australia/Melbourne'});
const when=value=>value&&Number.isFinite(Date.parse(value))?fmt.format(new Date(value))+' Melbourne time':'Unavailable';
const link=(url,label)=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';
const date=value=>new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
export function trafficStats(counts){
  if(!Array.isArray(counts)||counts.length!==96)throw Error('Expected 96 intervals');
  if(counts.some(v=>v!==null&&(!Number.isInteger(v)||v<0)))throw Error('Invalid detector count');
  const valid=counts.filter(v=>Number.isInteger(v)&&v>=0);
  return{valid:valid.length,missing:96-valid.length,total:valid.reduce((a,b)=>a+b,0),peak:valid.length?Math.max(...valid):null,allZero:valid.length===96&&valid.every(v=>v===0)};
}
export function validRoads(data){
  if(data?.type!=='FeatureCollection'||!Array.isArray(data.features)||data.exceededTransferLimit||data.properties?.exceededTransferLimit)throw Error('Incomplete road response');
  if(!data.features.length)throw Error('No road geometry returned');
  for(const f of data.features){
    const lines=f.geometry?.type==='LineString'?[f.geometry.coordinates]:f.geometry?.type==='MultiLineString'?f.geometry.coordinates:null;
    if(!lines||!lines.every(line=>line.length>=2&&line.every(p=>p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>=140&&p[0]<=150&&p[1]>=-40&&p[1]<=-30)))throw Error('Invalid Victorian road geometry');
  }
  return data;
}
async function json(url,timeout=10000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error('Source returned '+response.status);return await response.json();}finally{clearTimeout(timer);}
}
export async function initialiseGovernmentData(onChange){
  changed=onChange;
  const [scats,manifest]=await Promise.allSettled([json('./data/scats.json'),json('./data/vicmap-manifest.json')]);
  if(scats.status==='fulfilled'){
    try{for(const s of scats.value.sites){for(const d of s.detectors)trafficStats(d.counts);}state.scats=scats.value;}catch{state.error='Traffic records could not be validated.';}
  }else state.error='The saved traffic records could not be loaded.';
  if(manifest.status==='fulfilled')state.manifest=manifest.value;
  await Promise.all(Object.entries(DATA_SITES).map(async([id,key])=>{
    const meta=state.manifest.find(m=>m.siteId===key);
    state.roads[id]={data:null,status:'unavailable',error:'',meta,busy:false};
    try{state.roads[id].data=validRoads(await json('./data/'+key+'.geojson'));state.roads[id].status='snapshot';}catch{state.roads[id].error='Saved road geometry is unavailable.';}
  }));
  state.ready=true;changed();
  await Promise.all(Object.keys(DATA_SITES).map(refreshRoads));
}
export async function refreshRoads(id){
  const road=state.roads[id];if(!road||road.busy||!road.meta)return;
  // Requests go only to the verified public ArcGIS service, with no credentials.
  const url=new URL(road.meta.sourceDownloadUrl);
  if(url.origin!=='https://services-ap1.arcgis.com'||!url.pathname.endsWith('/FeatureServer/1/query'))return;
  road.busy=true;road.error='';changed();
  try{road.data=validRoads(await json(url.href));road.fetchedAt=new Date().toISOString();road.status='refreshed';}
  catch{road.status=road.data?'stale':'unavailable';road.error='Vicmap could not be reached. '+(road.data?'Showing the last available road layer.':'Road geometry is unavailable.');}
  finally{road.busy=false;changed();}
}
export function setGovernmentControl(kind,value,id){
  if(!DATA_SITES[id])return;
  if(kind==='detector'){const site=state.scats?.sites.find(s=>s.appSiteId===id);if(site?.detectors.some(d=>d.detectorId===Number(value)))state.detectors[id]=Number(value);}
  if(kind==='interval')state.intervals[id]=Math.max(0,Math.min(95,Math.round(Number(value)||0)));
  if(kind==='expanded')state.expanded[id]=Boolean(value);
}
function station(id){return state.scats?.sites.find(s=>s.appSiteId===id);}
function selectedDetector(id){const site=station(id);return site?.detectors.find(d=>d.detectorId===(state.detectors[id]||site.defaultDetectorId));}
export function governmentExport(){
  return{source:'Official public data; separate from simulated safety events',scats:state.scats,roadLayers:Object.fromEntries(Object.entries(state.roads).map(([id,r])=>[id,{status:r.status,fetchedAt:r.fetchedAt||r.meta?.fetchedAt,source:r.meta,features:r.data?.features||[]}]))};
}
function roadLayer(id){
  const r=state.roads[id],s=station(id);
  if(!r?.data||!s)return null;
  const centre=[s.longitude,s.latitude],scale=.58,cos=Math.cos(centre[1]*Math.PI/180);
  const project=p=>[270+(p[0]-centre[0])*111320*cos*scale,160-(p[1]-centre[1])*111320*scale];
  const path=line=>line.map((p,i)=>{const q=project(p);return(i?'L':'M')+q[0].toFixed(2)+' '+q[1].toFixed(2);}).join(' ');
  const names=new Set(),labels=[],roads=[];
  const paths=r.data.features.map(f=>{
    const p=f.properties||{},name=p.ezi_road_name||p.road_name||'Unnamed road',lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates;
    const priority=Number(p.class_code)<=3;
    for(const line of lines){roads.push({name,priority,points:line.map(project)});const point=project(line[Math.floor(line.length/2)]);if(priority&&!names.has(name)&&point[0]>45&&point[0]<430&&point[1]>38&&point[1]<278&&labels.length<5&&Math.abs(point[1]-160)>24){names.add(name);labels.push('<text x="'+point[0].toFixed(1)+'" y="'+(point[1]-8).toFixed(1)+'">'+esc(name)+'</text>');}}
    return lines.map(line=>'<path d="'+path(line)+'" class="'+(priority?'gov-road-main':'gov-road-local')+'"><title>'+esc(name)+'</title></path>').join('');
  }).join('');
  return {s,paths,labels,roads};
}
// height>320 widens the view above and below the site centre and lets the SVG fill a taller box (slice),
// keeping the north arrow and scale bar clear of the edges that slice may crop.
const mapFrame=(id,label,body,overlay,height=320)=>{
  const top=160-height/2,bottom=top+height,tall=height>320,left=tall?44:24,right=tall?486:510,inset=tall?28:0;
  return '<svg class="gov-map" viewBox="0 '+top+' 540 '+height+'"'+(tall?' preserveAspectRatio="xMidYMid slice"':'')+' role="img" aria-label="'+label+'"><defs><clipPath id="road-clip-'+id+'"><rect y="'+top+'" width="540" height="'+height+'"/></clipPath></defs><rect y="'+top+'" width="540" height="'+height+'" fill="#edf3f5"/><g clip-path="url(#road-clip-'+id+')">'+body+'</g>'+overlay+'<text x="'+right+'" y="'+(top+27+inset)+'" fill="#264c60" font-size="14">N ↑</text><path d="M'+left+' '+(bottom-35-inset)+'h58m-58 -4v8m58 -8v8" stroke="#264c60" stroke-width="2"/><text x="'+left+'" y="'+(bottom-15-inset)+'" fill="#264c60" font-size="12">100 m</text></svg>';
};
export function roadMap(id,notice=false){
  const layer=roadLayer(id);
  if(!layer)return '<div class="gov-empty">'+(state.ready?'Road geometry unavailable.':'Loading official road geometry…')+'</div>';
  const {s,paths,labels}=layer;
  return mapFrame(id,'Official Vicmap road centrelines near '+esc(s.name),paths+'<g class="gov-map-label">'+labels.join('')+'</g>','<circle cx="270" cy="160" r="17" fill="'+(notice?'#efbb42':'#166788')+'" stroke="white" stroke-width="4"/><text x="270" y="165" fill="white" text-anchor="middle" font-size="13" font-weight="700">'+(notice?'W':'S')+'</text><rect x="16" y="16" width="190" height="27" rx="4" fill="white"/><text x="26" y="34" fill="#264c60" font-size="13">SCATS '+s.scatsSiteId+' · '+(notice?'Notice preview':'Reference junction')+'</text>');
}
// Real roads with the planned work zone drawn on the main road nearest the site centre.
// Returns null until road data has loaded so the caller can show a fallback.
export function workZoneMap(id,lengthPx=90){
  const layer=roadLayer(id);if(!layer)return null;
  const {s,paths,labels,roads}=layer,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  let best=null;
  for(const road of roads)if(road.priority)road.points.forEach(q=>{const d=dist(q,[270,160]);if(!best||d<best.d)best={road,d};});
  let zone='',name=s.name;
  if(best){
    name=best.road.name;
    // Road centrelines are split at every junction, so densify every piece of the chosen road,
    // centre the zone a short way along it from the reference junction, and clip to lengthPx.
    const lines=roads.filter(r=>r.name===name).map(r=>r.points.flatMap((q,i)=>{if(!i)return [q];const prev=r.points[i-1],n=Math.max(1,Math.ceil(dist(prev,q)/2));return Array.from({length:n},(_,k)=>[prev[0]+(q[0]-prev[0])*(k+1)/n,prev[1]+(q[1]-prev[1])*(k+1)/n]);}));
    let centre=best.road.points[0],gap=Infinity;
    for(const line of lines)for(const q of line){const g=Math.abs(dist(q,[270,160])-lengthPx*.65);if(g<gap){gap=g;centre=q;}}
    const runs=[];
    for(const line of lines){let run=[];for(const q of line){if(dist(q,centre)<=lengthPx/2)run.push(q);else if(run.length){runs.push(run);run=[];}}if(run.length)runs.push(run);}
    const d=runs.filter(r=>r.length>1).map(r=>r.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ')).join(' ');
    if(d)zone='<path d="'+d+'" class="wz-zone-glow"/><path d="'+d+'" class="wz-zone"/><path d="'+d+'" class="wz-zone-dash"/>';
  }
  return {svg:mapFrame('wz-'+id,'Planned work zone on '+esc(name)+' near '+esc(s.name),paths+zone+'<g class="gov-map-label">'+labels.join('')+'</g>','',460),road:name};
}
export function roadCaption(id){
  const r=state.roads[id];
  if(!r)return '';
  const status=r.status==='refreshed'?'Fetched from Vicmap':r.status==='stale'?'Connection unavailable · saved layer':r.status==='snapshot'?'Saved official layer':'Unavailable';
  return '<div class="gov-map-caption"><span class="gov-tag '+(r.status==='stale'?'warning':'')+'">'+status+'</span> '+(r.busy?'<span role="status">Refreshing…</span>':'<button class="btn small" data-government-refresh="'+id+'">Refresh roads</button>')+'<p>'+esc(when(r.fetchedAt||r.meta?.fetchedAt))+'</p>'+(r.error?'<p class="gov-warning">'+esc(r.error)+'</p>':'')+'<p>'+link('https://discover.data.vic.gov.au/dataset/vicmap-transport-road-line','Vicmap Transport')+' · State of Victoria (DTP) · CC BY 4.0. Road centrelines only; no lane widths or surveyed work-zone boundaries. The junction is a reference for this demonstration, not a verified roadworks location.</p></div>';
}
function trafficChart(id){
  const s=station(id),d=selectedDetector(id);
  if(!s||!d)return '<div class="gov-empty">'+esc(state.error||'Loading official SCATS records…')+'</div>';
  const stats=trafficStats(d.counts),index=state.intervals[id]??32,max=Math.max(stats.peak||0,1),labels=state.scats.intervalLabels;
  const bars=d.counts.map((v,i)=>{const x=28+i*5.6,y=v===null?139:139-v/max*103;return '<rect data-government-bar="'+i+'" data-government-site="'+id+'" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="4.4" height="'+(v===null?5:Math.max(1,139-y)).toFixed(1)+'" fill="'+(v===null?'#c75439':i===index?'#e1a83e':'#247a91')+'"><title>'+labels[i]+' AEST: '+(v===null?'unavailable':v+' detector activations')+'</title></rect>';}).join('');
  const end=index===95?'24:00':labels[index+1],value=d.counts[index];
  return '<div class="gov-chart-head"><div><span class="gov-kicker">SCATS '+s.scatsSiteId+'</span><h3>Recorded traffic volume</h3></div><span class="gov-tag">Historical · '+date(s.dataDate)+'</span></div><label class="gov-field">Loop detector<select aria-label="SCATS loop detector" data-government-detector="'+id+'">'+s.detectors.map(v=>'<option value="'+v.detectorId+'" '+(v.detectorId===d.detectorId?'selected':'')+'>Detector '+v.detectorId+(v.missingIntervalCount?' · '+v.missingIntervalCount+' gaps':v.quality.allZero?' · all zero':'')+'</option>').join('')+'</select></label><svg class="gov-chart" viewBox="0 0 600 170" role="img" aria-label="96 quarter-hour detector counts; red marks show missing intervals"><path d="M28 140H570" stroke="#cadbe1"/><text x="28" y="18">'+max+' activations / 15 min</text>'+bars+'<g><text x="28" y="161">00:00</text><text x="159" y="161">06:00</text><text x="293" y="161">12:00</text><text x="427" y="161">18:00</text><text x="541" y="161">24:00</text></g></svg><label class="gov-field">Inspect a 15-minute interval<input type="range" min="0" max="95" step="1" value="'+index+'" aria-label="SCATS time interval" data-government-interval="'+id+'"></label><div class="gov-reading"><strong>'+(value===null?'Unavailable':value.toLocaleString('en-AU'))+'</strong><span>detector activations<br>'+labels[index]+'–'+end+' AEST</span></div><p class="'+(stats.missing||stats.allZero?'gov-warning':'gov-note')+'">'+stats.valid+'/96 valid intervals · '+stats.total.toLocaleString('en-AU')+' '+(stats.missing?'available counts (incomplete day)':'daily detector activations')+(stats.allZero?' · Published zeros do not prove an empty road or healthy detector.':'')+'</p><p class="gov-note">One detector, not a count of unique vehicles across this junction. Lane and direction mapping is unverified. Missing intervals stay unavailable.</p>';
}
export function governmentPanel(site,tab){
  const id=site.id,s=station(id),expanded=state.expanded[id]??false;
  return '<details class="gov-context" data-government-details="'+id+'" '+(expanded?'open':'')+'><summary><span><span class="gov-kicker">OFFICIAL ROAD CONTEXT</span><strong>'+esc(s?s.name:'Connecting public data…')+'</strong></span><span class="gov-summary-meta">'+(s?'SCATS '+s.scatsSiteId+' · '+date(s.dataDate):'SCATS + Vicmap')+'<small>Real road data · safety scenarios remain simulated</small></span></summary><div class="gov-grid"><section class="gov-traffic">'+trafficChart(id)+'</section><section class="gov-geography"><h3>Reference road network</h3>'+roadMap(id)+roadCaption(id)+'</section></div><div class="gov-sources"><p>'+link('https://opendata.transport.vic.gov.au/dataset/traffic-signal-volume-data','SCATS volume source')+' · '+link('https://opendata.transport.vic.gov.au/dataset/victorian-traffic-signals','Official signal locations')+' · State of Victoria (DTP), CC BY 4.0. '+(state.scats?'Downloaded '+esc(when(state.scats.fetchedAtUTC))+'. ':'')+'Published historical snapshot; 15-minute counts, daily source updates. New traffic dates require a data import; Refresh roads updates the road layer only.</p><p><strong>Not connected:</strong> planned works / road incidents (Transport Victoria API key required), BOM weather (client data licence required), on-site sensors and Apple Watch hardware. '+link('https://opendata.transport.vic.gov.au/dataset/planned-disruptions-road','Roadworks data access')+'</p></div></details>';
}
