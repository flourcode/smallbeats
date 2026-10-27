/* Small Beats · the nights.
   One count for everyone: NIGHT 1 is launch day and every day after is the next night, the same on the site and on
   Small Beats FM. Each night the crew asks for one thing (TONIGHT'S REQUEST), and the Studio can press that night's own
   six tapes. There's no server: it all comes from the date, so every visitor and every video agrees on what night it is. */
(function(){
"use strict";
const LAUNCH=[2026,10,27]; /* NIGHT 1: year, month (1 to 12), day. Set this to launch day */
const dayNo=(y,m,d)=>Math.floor(Date.UTC(y,m,d)/864e5);
const night=date=>{const d=date||new Date();return Math.max(1,dayNo(d.getFullYear(),d.getMonth(),d.getDate())-dayNo(LAUNCH[0],LAUNCH[1]-1,LAUNCH[2])+1);};
/* a steady number from 0 to 1 for (night, slot): the same everywhere */
const h=(a,b)=>{let x=Math.imul((a|0)^0x9e3779b9,2654435761)^Math.imul((b|0)+1,40503);x^=x>>>15;x=Math.imul(x,2246822507);x^=x>>>13;x=Math.imul(x,3266489909);x^=x>>>16;return (x>>>0)/4294967296;};
const DISTRICTS=['OLD TOWN','MIDTOWN','CENTRAL PARK','ARCADE ROW','THE HARBOR','THE BRIDGE'];
const WALK=[0,3,4,2,1,5]; /* the order the crew walks the city in a night's six tapes */
const NAMES=['MIDNIGHT WALK','SUNDAY STATIC','BAD IDEA','RAIN AGAIN','TINY WIN','LATE BUS','ROOM 4B','SLOW LANE','LOOSE CHANGE','DIAL TONE','SIDE QUEST','PARKING LOT',
  'HOLD MUSIC','DESK FAN','STATIC CLING','BUS STOP','BLANK TAPE','LUNCH BREAK','GROCERY RUN','VELVET HOUR','PAPER PLANES','SMALL TALK','WARM TOAST','TV DINNER','ARCADE CARPET',
  'PHONE CORD','BACK SEAT','CORNER STORE','NIGHT BUS','GOOD ENOUGH','FRIDAY AGAIN','OFF THE CLOCK','FRONT STOOP','LAUNDRY DAY','SECOND WIND','PLAN B','SNACK RUN','STAY HOME',
  'SADURDAY BEATS','CAR WASH','PAPER ROUTE','RECESS','SLEEPOVER','BOOMBOX','NEON SIGN','ROLLER RINK','POOL PARTY','CEREAL','CABLE BOX',
  'MALL WALK','FIELD TRIP','SNOOZE BUTTON','PUDDLE JUMP','DOUBLE DUTCH','BACKYARD','PIZZA NIGHT','BIKE RIDE','STAY UP LATE','JUNK DRAWER','PEN PAL','PHOTO BOOTH','SODA POP','MINI GOLF','TREEHOUSE','LAST SLOW DANCE'];
/* what the crew can ask for: words for the screen, words for a description, whether a tape answers it, and how to make one that does */
const title=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/^The /,'the ');
const REQUESTS=[
  ...DISTRICTS.map((d,s)=>({id:'s'+s,txt:'SOMETHING FOR '+d,line:'something for '+title(d),ok:t=>t.s===s,fix:()=>{}})),
  {id:'rain',txt:'RAIN',line:'rain',ok:t=>t.w===1,fix:t=>{t.w=1;}},
  {id:'fire',txt:'A CAMPFIRE',line:'a campfire',ok:t=>t.w===3,fix:t=>{t.w=3;}},
  {id:'slow',txt:'SOMETHING SLOW',line:'something slow',ok:t=>t.p===0,fix:t=>{t.p=0;}},
  {id:'quiet',txt:'NO DRUMS',line:'no drums, just the music',ok:t=>t.d===0&&!!(t.b||t.k),fix:t=>{t.d=0;if(!t.k)t.k=3;}},
  {id:'guitar',txt:'THE GUITAR',line:'the guitar',ok:t=>t.k===2,fix:t=>{t.k=2;}},
  {id:'deep',txt:'A DEEP BASS',line:'a deep bass',ok:t=>t.b===2,fix:t=>{t.b=2;}},
  {id:'along',txt:'YOU TO PLAY ALONG',line:'someone to play along on the keys',ok:t=>!!t.m,fix:()=>{}}];
/* tonight's request: never the same two nights running */
const reqIndex=n=>Math.floor(h(n,7)*REQUESTS.length);
const request=n=>{let i=reqIndex(n);if(n>1&&i===reqIndex(n-1))i=(i+1)%REQUESTS.length;return REQUESTS[i];};
/* the night's six tapes, by Small Beats, one in each district in walking order: slow, minor keys, mostly rain and hiss.
   minor(seed) says whether a tune is in a minor key (the engine's own answer); crew is the buddy numbers to host them */
const pk=(a,x)=>a[Math.floor(x*a.length)%a.length];
const KEYS=[[1,2],[1,3],[3],[4],[1,3],[3,2]],BASS=[[1,2],[2,1],[0,1],[1,3],[2],[3,4]],DRUMS=[[2],[1,2],[0],[1],[2,1],[1,2]];
function tapes(n,opt){const o=opt||{},minor=o.minor||(()=>true),crew=o.crew&&o.crew.length?o.crew:[0],used=new Set(),out=[],req=request(n);
  WALK.forEach((s,i)=>{const R=k=>h(n*7+i,k);
    let r=1+Math.floor(R(1)*2e9);for(let k=0;k<400&&s!==5&&!minor(r);k++)r=1+((r*48271+11)%2147483646);
    let name;for(let k=0;k<NAMES.length;k++){name=NAMES[Math.floor(R(2+k)*NAMES.length)];if(!used.has(name))break;}used.add(name);
    const t={n:name,c:i%4,d:pk(DRUMS[s],R(3)),b:pk(BASS[s],R(4)),k:pk(KEYS[s],R(5)),w:pk(s===2?[2,1]:[1,1,2,0,3],R(6)),p:R(7)<.75?0:1,s,r,t:pk(crew,R(8)),by:'SMALL BEATS'};
    out.push(t);});
  /* the first tape always answers tonight's request, so the episode can open on it */
  const first=req.id[0]==='s'?out.find(t=>'s'+t.s===req.id):out[0];if(first){req.fix(first);if(first!==out[0]){out.splice(out.indexOf(first),1);out.unshift(first);}}
  return out;}
window.SBN={LAUNCH,night,request,tapes,DISTRICTS,NAMES,REQUESTS};
})();
