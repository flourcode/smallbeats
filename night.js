/* Small Beats · the nights.
   The show ran late. The last train didn't. Every night Dino and the crew have six stops between them and home, and the
   city keeps rerouting them. Each stop is a district with its own station and its own little situation, and the way
   through is a tape: one that answers what the stop needs. Save it, and the crew rides on to the next stop.
   One night for everyone, from the date (no server), never numbered on screen: it only picks the route, the situations
   and the Studio's six tapes, so the site and every video agree on tonight while each night stands on its own. */
(function(){
"use strict";
const LAUNCH=[2026,10,27]; /* the first night: year, month (1 to 12), day. Set this to launch day */
const dayNo=(y,m,d)=>Math.floor(Date.UTC(y,m,d)/864e5);
const night=date=>{const d=date||new Date();return Math.max(1,dayNo(d.getFullYear(),d.getMonth(),d.getDate())-dayNo(LAUNCH[0],LAUNCH[1]-1,LAUNCH[2])+1);};
/* a steady number from 0 to 1 for (night, slot): the same everywhere */
const h=(a,b)=>{let x=Math.imul((a|0)^0x9e3779b9,2654435761)^Math.imul((b|0)+1,40503);x^=x>>>15;x=Math.imul(x,2246822507);x^=x>>>13;x=Math.imul(x,3266489909);x^=x>>>16;return (x>>>0)/4294967296;};
const DISTRICTS=['OLD TOWN','MIDTOWN','CENTRAL PARK','ARCADE ROW','THE HARBOR','THE BRIDGE'];
const STYLES=['LO-FI','HOUSE','AMBIENT','8-BIT','DUB','TRANCE']; /* the style that takes the crew to each district */
/* each district's station on the crew's (made-up) night line */
const STOPS=['HUSH ST.','42ND & STATIC','72ND NIGHT','TOKEN ST.','PIER 9','EAST SPAN'];
/* each district's line colour on the pocket route card (off the screen: the screen itself stays olive) */
const COLORS=['#d8805e','#d1ac5a','#8fb36a','#d97aa6','#5fa8c9','#a88fd6']; /* the same as each style key's colour in app.js */
const NAMES=['MIDNIGHT WALK','SUNDAY STATIC','BAD IDEA','RAIN AGAIN','TINY WIN','LATE BUS','ROOM 4B','SLOW LANE','LOOSE CHANGE','DIAL TONE','SIDE QUEST','PARKING LOT',
  'HOLD MUSIC','DESK FAN','STATIC CLING','BUS STOP','BLANK TAPE','LUNCH BREAK','GROCERY RUN','VELVET HOUR','PAPER PLANES','SMALL TALK','WARM TOAST','TV DINNER','ARCADE CARPET',
  'PHONE CORD','BACK SEAT','CORNER STORE','NIGHT BUS','GOOD ENOUGH','FRIDAY AGAIN','OFF THE CLOCK','FRONT STOOP','LAUNDRY DAY','SECOND WIND','PLAN B','SNACK RUN','STAY HOME',
  'SADURDAY BEATS','CAR WASH','PAPER ROUTE','RECESS','SLEEPOVER','BOOMBOX','NEON SIGN','ROLLER RINK','POOL PARTY','CEREAL','CABLE BOX',
  'MALL WALK','FIELD TRIP','SNOOZE BUTTON','PUDDLE JUMP','DOUBLE DUTCH','BACKYARD','PIZZA NIGHT','BIKE RIDE','STAY UP LATE','JUNK DRAWER','PEN PAL','PHOTO BOOTH','SODA POP','MINI GOLF','TREEHOUSE','LAST SLOW DANCE'];
/* the situations: one line of setup, one musical ask the machine can check on the tape (and set, for the Studio's tapes).
   The city is the only obstacle: weather, closed doors, sleepy benches, loud streets. Nobody is ever after the crew */
const S_=(set,ask,line,ok,fix)=>({set,ask,line,ok,fix});
const SITUATIONS=[
  [ /* OLD TOWN */
    S_('THE BAKERY LIGHTS ARE ON.','SOMETHING WARM AND SLOW','something warm and slow',t=>t.p===0,t=>{t.p=0;}),
    S_('RAIN ON THE COBBLES.','PUT THE RAIN IN IT','the rain in it',t=>t.w===1,t=>{t.w=1;}),
    S_('A PARTY ON A FIRE ESCAPE.','SWING THE DRUMS','swung drums',t=>t.d===2,t=>{t.d=2;})],
  [ /* MIDTOWN */
    S_('THE CITY IS TOO LOUD.','A DEEP BASS THAT CUTS THROUGH','a deep bass that cuts through',t=>t.b===2,t=>{t.b=2;}),
    S_('EVERY LIGHT ON, NOBODY HOME.','KEEP IT STEADY','something steady',t=>t.p===1,t=>{t.p=1;}),
    S_('THE ELEVATOR MUSIC IS STUCK.','THE RHODES, NICE AND WARM','a warm Rhodes',t=>t.k===1,t=>{t.k=1;})],
  [ /* CENTRAL PARK */
    S_('EVERYONE IS ASLEEP ON THE BENCHES.','NO DRUMS. DON\'T WAKE THEM','no drums',t=>t.d===0&&!!(t.b||t.k),t=>{t.d=0;if(!t.k)t.k=3;}),
    S_('THE PATH LAMPS ARE HUMMING.','A SOFT PAD','a soft pad',t=>t.k===3,t=>{t.k=3;}),
    S_('IT\'S COLD BY THE POND.','LIGHT A CAMPFIRE','a campfire',t=>t.w===3,t=>{t.w=3;})],
  [ /* ARCADE ROW */
    S_('THE ARCADE CLOSES IN FIVE.','ONE MORE GAME: MAKE IT FAST','something fast',t=>t.p===2,t=>{t.p=2;}),
    S_('THE CLAW MACHINE IS WATCHING.','8-BIT KEYS','8-bit keys',t=>t.k===4,t=>{t.k=4;}),
    S_('THE CHANGE MACHINE IS EMPTY.','TIGHT DRUMS, NO SWING','tight drums',t=>t.d===1,t=>{t.d=1;})],
  [ /* THE HARBOR */
    S_('THE NIGHT SHIFT IS ON THE PIER.','SOMETHING SLOW AND LOW','something slow and low',t=>t.p===0&&t.b===2,t=>{t.p=0;t.b=2;}),
    S_('FOG ROLLING IN OFF THE WATER.','PUT SOME HISS IN IT','some tape hiss',t=>t.w===2,t=>{t.w=2;}),
    S_('A FERRY HORN, SOMEWHERE.','A DEEP BASS','a deep bass',t=>t.b===2,t=>{t.b=2;})],
  [ /* THE BRIDGE */
    S_('EVERYONE IS TIRED. ONE MORE BRIDGE.','KEEP US MOVING: MAKE IT FAST','something fast to keep everyone moving',t=>t.p===2,t=>{t.p=2;}),
    S_('THE CABLES ARE SINGING IN THE WIND.','A WAVE BASS','a wave bass',t=>t.b===4,t=>{t.b=4;}),
    S_('HEADLIGHTS ALL THE WAY ACROSS.','A SYNTH BASS','a synth bass',t=>t.b===3,t=>{t.b=3;})]];
/* what the city throws at them between stops: a card on the screen while they ride */
const CHANGES=[['SERVICE CHANGE','WALK THE LAST FEW BLOCKS'],['TRAIN TERMINATES HERE','EVERYBODY OFF'],['LOCAL ONLY AFTER MIDNIGHT','EVERY STOP, SLOWLY'],['EXPRESS SKIPS OUR STOP','RIDE BACK ONE'],
  ['WRONG PLATFORM','UP THE STAIRS, DOWN THE STAIRS'],['NIGHT BUS INSTEAD','SAME DIRECTION, MORE OR LESS'],['ENTRANCE CLOSED','THE NEXT ONE IS UP THE BLOCK'],['DOORS OPEN ON THE OTHER SIDE','ALMOST THERE']];
/* hand-picked nights: the route (district by number) and the tape names, in order. Every other night is pressed from its number */
const PLANS={
  1:[[0,'RAIN AGAIN'],[3,'SIDE QUEST'],[4,'BACK SEAT'],[2,'PAPER PLANES'],[1,'MIDNIGHT WALK'],[5,'LAST SLOW DANCE']], /* opens in the rain, ends on the bridge */
  2:[[1,'FIELD TRIP'],[3,'PIZZA NIGHT'],[2,'LOOSE CHANGE'],[4,'TREEHOUSE'],[0,'STAY UP LATE'],[5,'BLANK TAPE']]}; /* starts playful, gets stranger, winds down */
const SIT_PICK={1:[1,0,0,0,0,0],2:[0,0,0,0,0,0]}; /* hand-picked nights choose their situations too (an index per stop) */
/* tonight's route: six stops, the Bridge always the last stretch home, the other five in a new order every night */
function route(n){let order;
  if(PLANS[n])order=PLANS[n].map(p=>p[0]);
  else{order=[0,1,2,3,4];for(let i=order.length-1;i>0;i--){const j=Math.floor(h(n,60+i)*(i+1));[order[i],order[j]]=[order[j],order[i]];}order.push(5);}
  return order.map((s,i)=>{const pick=SIT_PICK[n]?SIT_PICK[n][i]:Math.floor(h(n,20+i)*SITUATIONS[s].length);
    const sit=SITUATIONS[s][pick%SITUATIONS[s].length],ch=CHANGES[Math.floor(h(n,40+i)*CHANGES.length)];
    return {i,s,district:DISTRICTS[s],stop:STOPS[s],style:STYLES[s],set:sit.set,ask:sit.ask,line:sit.line,ok:t=>!!t&&t.s===s&&sit.ok(t),fix:sit.fix,change:ch};});}
/* the night's six tapes, by Small Beats, one for each stop, in order: minor keys, mostly slow, rain and hiss, each one answering its stop.
   minor(seed) says whether a tune is in a minor key (the engine's own answer); crew is the buddy numbers to host them */
const pk=(a,x)=>a[Math.floor(x*a.length)%a.length];
const KEYS=[[1,2],[1,3],[3],[4],[1,3],[3,2]],BASS=[[1,2],[2,1],[0,1],[1,3],[2],[3,4]],DRUMS=[[2],[1,2],[0],[1],[2,1],[1,2]];
function tapes(n,opt){const o=opt||{},minor=o.minor||(()=>true),crew=o.crew&&o.crew.length?o.crew:[0],used=new Set();
  return route(n).map((st,i)=>{const s=st.s,R=k=>h(n*7+i,k);
    let r=1+Math.floor(R(1)*2e9);for(let k=0;k<400&&s!==5&&!minor(r);k++)r=1+((r*48271+11)%2147483646);
    let name=PLANS[n]?PLANS[n][i][1]:null;if(!name)for(let k=0;k<NAMES.length;k++){name=NAMES[Math.floor(R(2+k)*NAMES.length)];if(!used.has(name))break;}used.add(name);
    const t={n:name,c:i%4,d:pk(DRUMS[s],R(3)),b:pk(BASS[s],R(4)),k:pk(KEYS[s],R(5)),w:pk(s===2?[2,1]:[1,1,2,0,3],R(6)),p:R(7)<.75?0:1,s,r,t:pk(crew,R(8)),by:'SMALL BEATS'};
    st.fix(t);return t;});}
/* the crew: the same three all night. And somewhere around the halfway stop, somebody new tags along */
const CREW=['DINO','BUNKER','HOOT']; /* Dino leads, Bunker is the wildcard, Hoot keeps them grounded */
const FRIENDS=['BUNBUN','PEACHES','PEPPER','MOCHI','PIP','TOFU','GUMDROP','VISOR','WOOL','SHROOM','SOCK','OINK','BOO','TWEET','BRUNO','SODA','WADDLE','BLIP','SNOOT','FEDORA','CRUMB','SPROUT','EGGBERT','PUDDING','QUACK','BOLT','BEAKER','MOOSH','FIZZ','PUDDLE','STARRY','TELLY'];
const friend=n=>FRIENDS[Math.floor(h(n,90)*FRIENDS.length)];
const JOIN=3; /* the friend joins once the third stop is made (in an episode: from the fourth tape) */
window.SBN={CREW,FRIENDS,friend,JOIN,LAUNCH,night,route,tapes,DISTRICTS,STOPS,COLORS,STYLES,NAMES,SITUATIONS,CHANGES};
})();
