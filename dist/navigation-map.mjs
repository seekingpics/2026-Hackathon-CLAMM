// Static driver navigation view: a heading-up map of a two-way, one-lane-each road. The car is
// in the left lane at the bottom, and roadworks close the left lane ahead. Illustration only.
import {esc,card,kv} from './visuals.mjs';

const W=400,H=600,ROAD_X=200,LANE=18,CAR_Y=495,PIN_Y=240,METRES_PER_PX=1.4,SPEED=58,LIMIT=40;
const LX=ROAD_X-LANE,RX=ROAD_X+LANE,WORKS_TOP=PIN_Y-40,WORKS_END=PIN_Y+40,TAPER_END=PIN_Y+85;
const body=html=>`<div class="card-body">${html}</div>`;

function roadNames(site){const [main,cross]=String(site.road||'').split('/').map(s=>s.trim());return {main:main||'Main road',cross:cross||'Cross street'};}

// Cones along the closed lane: a taper from the kerb to the centre line, then a line beside the works.
function cones(){
 const out=[];
 for(let i=0;i<=4;i++){const t=i/4;out.push([ROAD_X-34+t*31,TAPER_END-t*(TAPER_END-WORKS_END)]);}
 for(let y=WORKS_END-16;y>=WORKS_TOP;y-=16)out.push([ROAD_X-3,y]);
 return out.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#f28c28" stroke="#fff" stroke-width="1.4"/>`).join('');
}

function mapSvg(site,distance){
 const {main,cross}=roadNames(site);
 // Road centre line runs straight up from the car, then bends right beyond the work zone.
 const road=`M${ROAD_X} ${H+20}V150C${ROAD_X} 90 235 55 290 10L330 -30`;
 const blocks=[[24,20,116,82],[24,150,116,105],[24,275,116,108],[24,418,116,200],[260,150,116,105],[260,275,116,108],[260,418,116,200]];
 // Route: left lane up to the taper, merge right past the works, back to the left lane, then onward.
 const route=`M${LX} ${CAR_Y-30}V${TAPER_END+30}`;
 const detour=`M${LX} ${TAPER_END+30}C${LX} ${TAPER_END} ${RX} ${TAPER_END} ${RX} ${WORKS_END-10}V${WORKS_TOP}C${RX} ${WORKS_TOP-30} ${LX} ${WORKS_TOP-25} ${LX} 150C${LX} 95 220 50 275 0`;
 return `<svg class="nav-map-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Static navigation map heading north on ${esc(main)}, a two-way road with one lane each way. The car is in the left lane at the bottom. About ${distance} metres ahead, roadworks at ${esc(site.name)} close the left lane, and the route merges into the right lane to pass them.">
 <defs>
  <linearGradient id="nav-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1ec" stop-opacity=".95"/><stop offset=".2" stop-color="#eef1ec" stop-opacity="0"/></linearGradient>
  <pattern id="nav-works" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#f28c28"/><rect x="5" width="5" height="10" fill="#fff4e0"/></pattern>
 </defs>
 <rect width="${W}" height="${H}" fill="#eef1ec"/>
 ${blocks.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#dfe4de"/>`).join('')}
 <path d="M300 40h100v75c-40 8-80 0-100-15Z" fill="#cfe3c6"/><path d="M34 170h60v40H34Z" fill="#cfe3c6"/>
 <g stroke="#c9d0cb" stroke-width="30" fill="none"><path d="M-10 125H${W+10}"/><path d="M-10 400H${W+10}"/></g>
 <g stroke="#fff" stroke-width="26" fill="none"><path d="M-10 125H${W+10}"/><path d="M-10 400H${W+10}"/></g>
 <path d="${road}" stroke="#c3cbc6" stroke-width="${LANE*4+6}" fill="none" stroke-linecap="round"/>
 <path d="${road}" stroke="#fff" stroke-width="${LANE*4}" fill="none" stroke-linecap="round"/>
 <path d="${road}" stroke="#aab4ba" stroke-width="2" fill="none" stroke-dasharray="12 10"/>
 <rect x="${ROAD_X-LANE*2}" y="${WORKS_TOP}" width="${LANE*2-4}" height="${WORKS_END-WORKS_TOP}" rx="3" fill="url(#nav-works)" opacity=".65"/>
 <path d="M${ROAD_X-LANE*2} ${TAPER_END}L${ROAD_X-4} ${WORKS_END}V${WORKS_TOP}" fill="none" stroke="#f28c28" stroke-width="1.5" stroke-dasharray="3 3" opacity=".6"/>
 ${cones()}
 <path d="${route}" stroke="#1a73e8" stroke-width="12" stroke-linecap="round"/>
 <path d="${detour}" stroke="#8ab4f8" stroke-width="9" fill="none" stroke-dasharray="2 13" stroke-linecap="round"/>
 <text x="${ROAD_X+52}" y="520" class="nav-street" transform="rotate(-90 ${ROAD_X+52} 520)">${esc(main)}</text>
 <text x="285" y="394" class="nav-street">${esc(cross)}</text>
 <path d="M${RX} 540v-26m-5 7 5-7 5 7" stroke="#aab4ba" stroke-width="2" fill="none" transform="rotate(180 ${RX} 527)"/>
 <path d="M${LX} 575v-26m-5 7 5-7 5 7" stroke="#aab4ba" stroke-width="2" fill="none"/>
 <rect width="${W}" height="${H}" fill="url(#nav-fade)"/>
 <g class="nav-pin" transform="translate(${LX} ${PIN_Y})">
  <circle class="nav-pin-pulse" r="20" fill="#f28c28" opacity=".35"/>
  <circle r="7" fill="#f28c28" stroke="#fff" stroke-width="3"/>
  <path d="M0 -12C-18 -12 -24 -30 -24 -40a24 24 0 0 1 48 0C24 -30 18 -12 0 -12Z" transform="translate(0 -6)" fill="#e8710a" stroke="#fff" stroke-width="2.5"/>
  <path d="M0 -64 -9 -38H9Z" fill="#fff"/><path d="M-5 -50H5M-7 -44H7" stroke="#e8710a" stroke-width="2.4"/>
  <g transform="translate(-162 -54)"><rect width="134" height="40" rx="9" fill="#fff" stroke="#e3e7ea"/><text x="11" y="17" class="nav-pin-title">Roadworks · left lane</text><text x="11" y="32" class="nav-pin-sub">${esc(site.name)} · ${distance} m</text></g>
 </g>
 <g transform="translate(${LX} ${CAR_Y})" aria-hidden="true">
  <circle r="34" fill="#1a73e8" opacity=".12"/>
  <rect x="-12" y="-24" width="24" height="48" rx="9" fill="#1a73e8" stroke="#fff" stroke-width="3"/>
  <path d="M-8 -10Q0 -15 8 -10L7 -3H-7Z" fill="#cfe2ff"/><path d="M-7 11H7L8 16Q0 19 -8 16Z" fill="#cfe2ff"/>
  <rect x="-15" y="-14" width="3.5" height="8" rx="1.7" fill="#0b3d91"/><rect x="11.5" y="-14" width="3.5" height="8" rx="1.7" fill="#0b3d91"/>
  <rect x="-15" y="7" width="3.5" height="8" rx="1.7" fill="#0b3d91"/><rect x="11.5" y="7" width="3.5" height="8" rx="1.7" fill="#0b3d91"/>
 </g>
</svg>`;
}

export function renderNavigationMap(site){
 const distance=Math.round((CAR_Y-PIN_Y)*METRES_PER_PX/10)*10,{main}=roadNames(site);
 const warn=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z" fill="#fff"/><path d="M12 10v5m0 3v.5" stroke="#b91c1c" stroke-width="2.4" stroke-linecap="round"/></svg>`;
 const alert=`<div class="nav-alert" role="alert"><span class="nav-alert-icon">${warn}</span><div><strong>Slow down</strong><span>Roadworks in ${distance} m. Reduce speed to ${LIMIT} km/h.</span></div></div>`;
 const bottom=`<div class="nav-bottom"><div class="nav-speed ${SPEED>LIMIT?'over':''}" aria-label="Current speed ${SPEED} km/h"><strong>${SPEED}</strong><small>km/h</small></div><div class="nav-limit" aria-label="Work zone speed limit ${LIMIT} km/h">${LIMIT}</div><div class="nav-bottom-text"><strong>Approaching work zone</strong><span>${distance} m · left lane closed</span></div></div>`;
 const map=`<div class="nav-map"><div class="nav-top"><div class="nav-guidance"><span class="nav-arrow" aria-hidden="true">↑</span><div><strong>${distance} m</strong><span>Continue on ${esc(main)} · left lane closed ahead, merge right</span></div></div>${alert}</div>${mapSvg(site,distance)}${bottom}</div>`;
 const info=body(`${kv('Worksite',esc(site.name))}${kv('Road',`${esc(site.road)}`)}${kv('Road type','Two-way, one lane each way')}${kv('Distance to works',`${distance} m`)}${kv('Speed (simulated)',`${SPEED} km/h · limit ${LIMIT} km/h`)}<p class="nav-note">The car is in the left lane at the bottom of the road, as in a navigation app. The orange pin ahead marks the construction site, which closes the left lane. Cones taper traffic into the right lane, and the dotted route shows the car passing the works and returning to its lane. Because the simulated speed is above the work-zone limit, the driver sees a Slow down alert.</p><p class="nav-note">This is a static illustration. It has no live GPS, speed sensing or routing, and nothing is sent to Google Maps or Waze.</p>`);
 return `<div class="ws-main"><div>${card('Driver navigation view','Two-way road in navigation mode with a left-lane work zone ahead',body(map))}</div><aside>${card('About this view','',info)}</aside></div>`;
}
