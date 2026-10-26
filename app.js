/* Small Beats · the mixer, the tape and the shelf.
   One loop: START HERE (a sound) → MIX IT → NEW TUNE → STICKER → NAME → SAVE → SHARE → (they) PLAY → REMIX → SHARE.
   The deck always plays one cassette: your draft, a tape off your shelf, or one somebody sent you. Touch any control while
   somebody else's tape (or a saved one) is in the deck and it quietly becomes a remix of it: nothing asks, nothing stops.
   No keyboard shortcuts, no dialogs, no accounts. Tapes live in this browser; a link carries the whole recipe. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const E=window.SBE,ST=window.STICKERS;
const STORE='smallBeats';
const Q=new URLSearchParams(location.search);
const BC=/^(video|live)$/.test(Q.get('broadcast')||'');

/* ---------- what you can pick ---------- */
const STARTS=[ /* s is the engine's start-sound number; rec is where it starts. The order on screen is the spec's */
  {name:'LO-FI',s:0,c:'var(--amber)',rec:{d:2,b:1,k:1,w:0,p:1}},
  {name:'AMBIENT',s:2,c:'var(--blue)',rec:{d:0,b:0,k:3,w:0,p:0}},
  {name:'HOUSE',s:1,c:'var(--red)',rec:{d:1,b:3,k:3,w:0,p:1}},
  {name:'8-BIT',s:3,c:'var(--teal)',rec:{d:1,b:1,k:4,w:0,p:1}},
  {name:'DUB',s:4,c:'var(--purple)',rec:{d:2,b:2,k:1,w:0,p:1}}];
const startOf=s=>STARTS.find(x=>x.s===s)||STARTS[0];
const FEEL=[2,1,2,1,2]; /* how the drums come in, by start sound: swing for lo-fi, ambient and dub, tight for house and 8-bit */
const LAYERS=[
  {k:'d',name:'DRUMS',opts:[[1,'TIGHT'],[2,'SWING']],c:'var(--green)'}, /* the kit comes with the sound; this is the feel */
  {k:'b',name:'BASS',opts:[[1,'WARM'],[2,'DEEP'],[3,'SYNTH']],c:'var(--orange)'},
  {k:'k',name:'KEYS',opts:[[1,'RHODES'],[2,'GUITAR'],[3,'PAD'],[4,'8-BIT']],c:'var(--yellow)'},
  {k:'w',name:'TEXTURE',opts:[[2,'HISS'],[1,'RAIN'],[3,'FIRE']],c:'var(--blue)'},
  {k:'p',name:'SPEED',opts:[[0,'SLOW'],[1,'STEADY'],[2,'FAST']],c:'var(--paper)',fixed:true}];
const SHELLS=[ /* fourteen 80s cassette shells (no real brands). A tape stores its shell's place in this list, so restyle freely but never reorder */
  {name:'70S TRIPLE',sh:'#e7dcc3',hi:'#f4ecd9',lab:'#fff7e6',strip:'#fff7e6',ink:'#3b2a1e',acc:'#c8571b',art:'triple',cols:['#c8571b','#e8902f','#f2c14e'],side:'A',len:'90'},
  {name:'MIAMI',sh:'#232227',hi:'#3a3940',lab:'#2e2c33',strip:'#2e2c33',ink:'#f2c94c',acc:'#ff5fa2',art:'neon',cols:['#ff5fa2','#3ee0e8'],side:'A',len:'60'},
  {name:'CLEAR BLUE',sh:'#6fa9de',hi:'#a3cbf0',lab:'#ffffff',strip:'#ffffff',ink:'#1d3557',acc:'#2f7fd6',clear:1,art:'lines',cols:['#58aaf5','#ff6f91'],len:'60'},
  {name:'MINT DIAGONAL',sh:'#b8e2cb',hi:'#d8f1e3',lab:'#f6f1e2',strip:'#f6f1e2',ink:'#1d1c21',acc:'#2f9e6d',art:'diag',cols:['#4fc48d','#f6f1e2','#2f9e6d'],side:'A',len:'90'},
  {name:'SUNSET',sh:'#26252b',hi:'#3c3b43',lab:'#fff1e6',strip:'#fff1e6',ink:'#1d1c21',acc:'#ff5f4a',art:'sunset',cols:['#ffd25a','#ffa646','#ff6f4a','#e2386a'],side:'A',len:'90'},
  {name:'LAVENDER',sh:'#c7b6ea',hi:'#e0d5f5',lab:'#f7f2ff',strip:'#f7f2ff',ink:'#3b2a66',acc:'#8a5fd8',art:'tracks',cols:['#9a72e0','#ff8ac2'],side:'B',len:'60'},
  {name:'SMOKED',sh:'#55545c',hi:'#7a7983',lab:'#efebe0',strip:'#efebe0',ink:'#1d1c21',acc:'#e0457b',clear:1,art:'triple',cols:['#3ec6e0','#e0457b','#f5d23e'],len:'90'},
  {name:'TROPIC',sh:'#f2efe8',hi:'#ffffff',lab:'#ffffff',strip:'#ffffff',ink:'#2a5a63',acc:'#ff5f8a',art:'sunset',cols:['#9be8dc','#3ec6c0','#ff8ac2','#ff5f8a'],side:'A',len:'90'},
  {name:'SWOOSH',sh:'#7cc6e4',hi:'#b4e1f2',lab:'#ffffff',strip:'#ffffff',ink:'#2a6f8c',acc:'#f6860b',art:'swoosh',side:'A',len:'90'},
  {name:'RAINBOW',sh:'#4b5662',hi:'#6b7682',lab:'#f6f1e2',strip:'#f6f1e2',ink:'#2b313a',acc:'#e8392b',art:'rainbow',len:'90'},
  {name:'TEAL SPLIT',sh:'#3fbcb8',hi:'#7fd9d5',lab:'#ffffff',strip:'#ffffff',ink:'#c8243f',acc:'#e8395a',art:'split',side:'A',len:'90'},
  {name:'SOUND',sh:'#f5d23e',hi:'#fbe68a',lab:'#fff8de',strip:'#fff8de',ink:'#3a3a48',acc:'#f6860b',art:'sound',side:'B'},
  {name:'PINK BAND',sh:'#a9a7d8',hi:'#cfcdf0',lab:'#ffffff',strip:'#ffffff',ink:'#3b3a6a',acc:'#7b78c8',art:'pinkband',side:'B',len:'60'},
  {name:'HOT PINK',sh:'#ee4f6c',hi:'#f58aa0',lab:'#bfe6f2',strip:'#bfe6f2',ink:'#1d1c21',acc:'#2a8fb0',art:'lines',cols:['#ffffff','#2a8fb0'],side:'A'}];
const NAMES=['MIDNIGHT WALK','SUNDAY STATIC','BAD IDEA','RAIN AGAIN','TINY WIN','LATE BUS','ROOM 4B','NO SIGNAL','SLOW LANE','LOOSE CHANGE','DIAL TONE','SIDE QUEST','PARKING LOT',
  'HOLD MUSIC','DESK FAN','STATIC CLING','BUS STOP','BLANK TAPE','LUNCH BREAK','GROCERY RUN','VELVET HOUR','PAPER PLANES','SMALL TALK','WARM TOAST','TV DINNER','ARCADE CARPET',
  'PHONE CORD','BACK SEAT','CORNER STORE','NIGHT BUS','GOOD ENOUGH','FRIDAY AGAIN','OFF THE CLOCK','FRONT STOOP','LAUNDRY DAY','SECOND WIND','TAPE HISS','PLAN B','SNACK RUN','STAY HOME',
  'SADURDAY BEATS','SIDE QUEST','GROCERY RUN','CAR WASH','PAPER ROUTE','RECESS','SLEEPOVER','BOOMBOX','NEON SIGN','ROLLER RINK','POOL PARTY','CEREAL','CABLE BOX',
  'MALL WALK','FIELD TRIP','SNOOZE BUTTON','PUDDLE JUMP','LOW BATTERY','DOUBLE DUTCH','BACKYARD','PIZZA NIGHT','BIKE RIDE','STAY UP LATE','JUNK DRAWER','PEN PAL','PHOTO BOOTH','SODA POP','MINI GOLF','TREEHOUSE','LAST SLOW DANCE'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
const seed=()=>1+Math.floor(Math.random()*2147483646);

/* ---------- tapes ---------- */
const clampInt=(v,lo,hi,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d;};
const cleanName=v=>String(v||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,24);
const cleanBy=v=>String(v||'').replace(/[^\w &'.,!?\/-]/g,'').replace(/\s+/g,' ').trim().slice(0,24)||undefined;
function cleanTape(t){if(!t||typeof t!=='object')return null;
  const s=clampInt(t.s,0,4,0),o={n:cleanName(t.n)||'MY TAPE',c:clampInt(t.c,0,SHELLS.length-1,0),d:clampInt(t.d,0,2,FEEL[s]),b:clampInt(t.b,0,3,0),k:clampInt(t.k,0,4,0),
    w:clampInt(t.w,0,3,0),p:clampInt(t.p,0,2,1),s,r:clampInt(t.r,1,2147483647,1),t:clampInt(t.t,0,ST.list.length-1,ST.quick[0])};
  if(t.id&&/^[a-z0-9]{1,16}$/.test(t.id))o.id=t.id;const by=cleanBy(t.by),fr=cleanBy(t.from);if(by)o.by=by;if(fr)o.from=fr;
  if(t.fav)o.fav=1;if(t.gift)o.gift=1; /* on your shelf only: starred, and sent to you by a friend */
  return o;}
const b64e=j=>btoa(unescape(encodeURIComponent(j))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
/* A tape link: ?tape= + base64url of [1, name, shell, drums, bass, keys, atmosphere, speed, sound, seed, sticker, by?, from?].
   Anything else is not a tape. See README, "Tape format". */
const TAPE_V=1;
function encodeTape(t){const a=[TAPE_V,t.n,t.c,t.d,t.b,t.k,t.w,t.p,t.s,t.r,t.t];if(t.by||t.from)a.push(t.by||'');if(t.from)a.push(t.from);return b64e(JSON.stringify(a));}
function decodeTape(code){try{const a=JSON.parse(decodeURIComponent(escape(atob(String(code).replace(/-/g,'+').replace(/_/g,'/')))));
    if(Array.isArray(a)&&a[0]===TAPE_V&&a.length>=11)return cleanTape({n:a[1],c:a[2],d:a[3],b:a[4],k:a[5],w:a[6],p:a[7],s:a[8],r:a[9],t:a[10],by:a[11],from:a[12]});
  }catch(e){}return null;}
/* where links point: this site, or smallbeats.com when the page was opened as a file (a file has no address to share) */
const siteURL=()=>/^https?:$/.test(location.protocol)?location.origin+location.pathname.replace(/[^/]*$/,''):'https://smallbeats.com/';
const tapeURL=t=>siteURL()+'?tape='+encodeTape(t);
const serial=t=>'SB-'+String(t.r%100000).padStart(5,'0');
const sameMusic=(a,b)=>a&&b&&['d','b','k','w','p','s','r'].every(k=>a[k]===b[k]);
const sameTape=(a,b)=>sameMusic(a,b)&&a.n===b.n&&a.t===b.t&&a.c===b.c;

/* ---------- saved state ---------- */
let S={vol:.8,by:'',tapes:[],draft:null};
try{const v=JSON.parse(localStorage.getItem(STORE)||'null');if(v&&typeof v==='object')Object.assign(S,v);}catch(e){}
const MAX_TAPES=300; /* yours and your friends' together; each one is a couple of hundred bytes */
S.tapes=(Array.isArray(S.tapes)?S.tapes:[]).map(cleanTape).filter(Boolean).slice(0,MAX_TAPES);
const STARTERS=[ /* three tapes already on the shelf on a first visit, so the shelf, PLAY, REMIX and COPY LINK explain themselves */
  {id:'grocery',n:'GROCERY RUN',c:6,d:1,b:1,k:3,w:0,p:1,s:1,r:1422687053,t:254,fav:1},
  {id:'sidequest',n:'SIDE QUEST',c:5,d:1,b:1,k:4,w:0,p:1,s:3,r:1469865583,t:196},
  {id:'sadurday',n:'SADURDAY BEATS',c:4,d:2,b:1,k:1,w:0,p:1,s:0,r:1469865583,t:56}];
/* The starter tapes. STARTER_V goes up whenever they change: then the old copies on a returning visitor's shelf are swapped for the
   new ones (and any missing come back, once). An empty shelf always gets them back, so nobody is left looking at nothing. */
const STARTER_V=2,starterIds=STARTERS.map(t=>t.id);let reseeded=false;
if(!BC&&(S.seeded!==STARTER_V||!S.tapes.length)){S.tapes=STARTERS.map(cleanTape).concat(S.tapes.filter(t=>!starterIds.includes(t.id))).slice(0,MAX_TAPES);S.seeded=STARTER_V;reseeded=true;}
const FIRST_TAPE=Object.assign({},STARTERS[0],{fav:undefined}); /* what a first visit opens on: house, warm bass, pad, the smoked tape, the happy calico */
let draft=cleanTape(S.draft)||cleanTape(FIRST_TAPE);delete draft.id;
/* a draft that's an old copy of a starter (same name, nothing of yours in it) becomes the new one */
if(reseeded){const st=STARTERS.find(x=>x.n===draft.n);if(st&&!sameTape(draft,cleanTape(st))){draft=cleanTape(Object.assign({},st,{fav:undefined}));delete draft.id;}}
if(reseeded)try{localStorage.setItem(STORE,JSON.stringify(Object.assign({},S,{draft})));}catch(e){}
function save(){if(BC)return;S.draft=draft;try{localStorage.setItem(STORE,JSON.stringify(S));}catch(e){}}
let shared=null;{const c=Q.get('tape');if(c)shared=decodeTape(c);}
let cur=draft; /* what's in the deck */
let savedId=(S.tapes.find(t=>sameTape(t,draft))||{}).id||null; /* the shelf tape the draft was last saved as, while nothing's changed since */
const TRACKED=new Set();function track(ev,p,every){if(BC||(!every&&TRACKED.has(ev)))return;TRACKED.add(ev);try{if(window.gtag)window.gtag('event',ev,p||{});}catch(e){}}

/* ---------- sound ---------- */
let actx=null,master=null,an=null,gen=null,heard=0,runFrom=0; /* heard: ms listened, for the tape counter */
function ensureAudio(){if(!actx){try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){} /* iPhone: plays with the ring switch on silent */
    actx=new (window.AudioContext||window.webkitAudioContext)();master=actx.createGain();master.gain.value=S.vol;an=actx.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=.6;master.connect(an);an.connect(actx.destination);
    actx.addEventListener('statechange',paintPlay);}
  if(actx.state==='suspended')actx.resume();return actx;}
const isPlaying=()=>!!gen&&!!actx&&actx.state==='running';
const isPaused=()=>!!gen&&!!actx&&actx.state==='suspended';
function counterMs(){return heard+(isPlaying()&&runFrom?performance.now()-runFrom:0);}
function pause(){if(!isPlaying())return;track('pause',{},true);heard+=performance.now()-runFrom;runFrom=0;actx.suspend().then(paintPlay,paintPlay);}
function resume(){if(!isPaused())return;actx.resume().then(()=>{runFrom=performance.now();paintPlay();},paintPlay);}
function start(t,xf){const a=ensureAudio();stopGen(xf||.12);const g=a.createGain();g.gain.value=0;g.connect(master); /* xf: a longer crossfade, between tapes on the shelf */
  VIS.hits=[];VIS.hops=[];VIS.bars=[];const b=E.band(a,g,Object.assign({},t,{onHit:noteHit}));VIS.step=b.step;const now=a.currentTime;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(1,now+(xf||.25));
  b.tick(now+2.2);const timer=setInterval(()=>b.tick(a.currentTime+2.2),400);
  if(!runFrom)runFrom=performance.now();gen={b,g,timer,tape:t};paintPlay();}
function stopGen(fade){if(!gen)return;const g=gen;gen=null;clearInterval(g.timer);try{const n=actx.currentTime;g.g.gain.cancelScheduledValues(n);g.g.gain.setValueAtTime(g.g.gain.value,n);g.g.gain.linearRampToValueAtTime(0,n+(fade||.4));
    setTimeout(()=>{g.b.src.forEach(s=>{try{s.stop();}catch(e){}});g.g.disconnect();},(fade||.4)*1000+150);}catch(e){}}
function stop(){if(runFrom){heard+=performance.now()-runFrom;runFrom=0;}stopGen(.4);paintPlay();}
function play(t){PL=null;start(t||cur);track('play');}
/* what the visuals know about the music: note hits (for the step lights), and beats 1 and 3 (for the sticker hop) */
const VIS={hits:[],hops:[],bars:[],step:.125};
function noteHit(p,t){if(p==='bar')VIS.hops.push(t,t+8*VIS.step);}
const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* playing the whole shelf: each tape for a few minutes, then a slow crossfade into the next */
let PL=null;const PL_SEC=180;
let restartT=null;function restart(){if(!isPlaying())return;clearTimeout(restartT);restartT=setTimeout(()=>start(cur),40);} /* a burst of taps rebuilds once */

/* ---------- stickers ---------- */
function stk(id,scale,cls){const el=document.createElement('i');el.className='stk'+(cls?' '+cls:'');paintStk(el,id,scale);el.setAttribute('aria-hidden','true');return el;}
function paintStk(el,id,scale){const s=scale||1,r=Math.floor(id/25),c=id%25;el.style.width=el.style.height=32*s+'px';el.style.backgroundSize=800*s+'px '+352*s+'px';el.style.backgroundPosition=(-c*32*s)+'px '+(-r*32*s)+'px';}

/* ---------- the cassette ----------
   A flat pixel-art cassette, 56 x 33 cells, drawn as SVG. The sticker is stuck straight onto the label in the middle, at a whole-number
   scale worked out from how big the cassette is on screen (so its pixels stay square). The reels step round while it plays. */
const CW=56,CH2=33,INK='#1d1c21';
function cassPix(t,phase){const cells=new Array(CW*CH2);const P=(x,y,v)=>{if(x>=0&&y>=0&&x<CW&&y<CH2)cells[y*CW+x]=v;};const R=(x,y,w,h,v)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,v);};
  /* a box with its corners knocked off, n pixels deep, the way 8-bit art rounds things */
  const RB=(x,y,w,h,v,n)=>{for(let j=0;j<h;j++){const k=Math.max(0,n-j,n-(h-1-j));R(x+k,y+j,w-2*k,1,v);}};
  const sh=SHELLS[t.c]||SHELLS[0],K=INK,S1=sh.sh,S2=sh.hi,LP=sh.strip,SC=sh.clear?sh.hi:'#a8a49a',lab=sh.lab;
  RB(0,0,CW,CH2,K,2);RB(1,1,CW-2,CH2-2,S1,2);R(3,1,CW-6,1,S2);R(2,2,1,1,S2);R(CW-3,2,1,1,S2);       /* the shell, a lit top edge */
  if(sh.clear)for(let y=3;y<31;y+=3)for(let x=2;x<54;x+=7)if((x+y)%2)P(x,y,S2);
  RB(4,3,48,21,K,1);RB(5,4,46,19,lab,1);R(6,4,44,6,LP);R(5,5,1,5,LP);R(50,5,1,5,LP);              /* the label, a strip for the name */
  const art=sh.art,C=sh.cols||[];
  if(art==='triple')C.forEach((c,k)=>R(5,12+k*3,46,2,c));
  if(art==='neon'){R(5,12,46,1,C[0]);R(5,14,46,2,C[1]);R(5,17,46,2,C[0]);R(5,20,46,1,C[1]);}
  if(art==='lines')for(let k=0;k<5;k++)R(5,12+k*2,46,1,C[k%2]);
  if(art==='diag')for(let y=11;y<22;y++)for(let x=5;x<51;x++){const m=((x+y)%7+7)%7;if(m<2)P(x,y,C[0]);else if(m===2)P(x,y,C[2]);}
  if(art==='sunset')C.forEach((c,k)=>R(5,12+k*3-(k?1:0),46,k?3:2,c));
  if(art==='tracks'){R(5,13,46,2,C[0]);R(5,16,46,1,C[1]);R(5,18,46,2,C[0]);}
  if(art==='swoosh'){const Cs=['#ef4f6c','#f6860b','#f5d23e'];for(let k=0;k<3;k++){const lo=20+k,hi=13+k;for(let x=5;x<51;x++){const y=x<=13?lo:x>=17?hi:Math.round(lo+(hi-lo)*(x-13)/4);P(x,y,Cs[k]);if(x>13&&x<17)for(let yy=Math.min(y,lo);yy<=lo&&yy<23;yy++)if(yy>=y)P(x,yy,Cs[k]);}}}
  if(art==='rainbow'){['#e8392b','#f6860b','#f5d23e','#4fc48d','#3b9ad9','#8a6ad8'].forEach((c,k)=>R(5,12+k*1.5|0,46,2,c));}
  if(art==='split'){R(5,16,46,7,sh.acc);for(let x=7;x<50;x+=2)P(x,14,sh.acc);}
  if(art==='sound'){R(5,21,46,1,sh.acc);R(5,12,46,1,'#3a3a48');}
  if(art==='pinkband'){R(5,13,46,8,'#f2a3c4');}
  /* the window: smoky plastic with the two tape packs and their hubs, closer in, the way a real cassette's are */
  const WX=12,WY=13,WW=32,WH=9;RB(WX,WY,WW,WH,K,1);RB(WX+1,WY+1,WW-2,WH-2,'#4a4550',1);R(WX+2,WY+1,WW-4,1,'#5c5763');
  const disk=(cx,cy,r,v)=>{const n=Math.ceil(r);for(let dy=-n;dy<=n;dy++)for(let dx=-n;dx<=n;dx++)if(dx*dx+dy*dy<=r*r+r*.6)P(cx+dx,cy+dy,v);};
  const HY=WY+4,HL=WX+6,HR=WX+WW-7;
  const pr=Math.max(0,Math.min(1,t._prog||0));disk(HL,HY,3-pr,'#6b4630');disk(HR,HY,2+pr,'#6b4630'); /* as it plays the tape winds from left to right */R(HL,HY+3,HR-HL,1,'#6b4630');               /* the tape: more wound on the left */
  const hub=cx=>{disk(cx,HY,2,'#f1e7cf');P(cx,HY,K);const a=phase*Math.PI/6;
    for(let k=0;k<3;k++){const th=a+k*2*Math.PI/3;P(cx+Math.round(Math.cos(th)*1.6),HY+Math.round(Math.sin(th)*1.6),K);}}; /* three teeth that step round while it plays */
  hub(HL);hub(HR);
  /* the bottom: a trapezoid with the capstan holes */
  for(let j=0;j<7;j++){const k=Math.max(0,3-j);R(12+k,26+j,32-2*k,1,K);if(j>0)R(13+k,26+j,30-2*k,1,S2);}
  R(17,29,2,2,K);R(37,29,2,2,K);R(24,28,2,2,K);R(30,28,2,2,K);
  [[3,3],[52,3],[3,29],[52,29],[28,31]].forEach(([x,y])=>P(x,y,SC));
  return {cells,sh};}
const escX=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function cassSVG(t,phase,noName){const {cells,sh}=cassPix(t,phase);let o='';
  for(let y=0;y<CH2;y++){let x=0;while(x<CW){const v=cells[y*CW+x];if(!v){x++;continue;}let w=1;while(x+w<CW&&cells[y*CW+x+w]===v)w++;o+=`<rect x="${x}" y="${y}" width="${w+.02}" height="1.02" fill="${v}"/>`;x+=w;}} /* runs, not single cells */
  const nm=escX(t.n.toUpperCase()),K=sh.ink,tx=(x,y,sz,v,anc,fill)=>`<text x="${x}" y="${y}" text-anchor="${anc||'middle'}" font-family="Doto,monospace" font-weight="900" font-size="${sz}" fill="${fill||K}">${v}</text>`;let deco='';
  if(nm.length<=14){if(sh.side)deco+=`<rect x="6.3" y="5.2" width="3.4" height="3.6" fill="none" stroke="${sh.acc}" stroke-width=".45"/>`+tx(8,8.2,2.9,t._side||sh.side,'middle',sh.acc);if(sh.len&&!t.brand)deco+=tx(49.6,8.4,3.4,sh.len,'end',sh.acc);}
  deco+=tx(10,22.6,1.45,sh.art==='sound'?'SOUND':'SIDE '+(t._side||sh.side||'A'),'middle',sh.art==='split'?'#ffffff':K)+tx(45.5,22.6,1.45,'STEREO','middle',sh.art==='split'?'#ffffff':K);
  deco+=tx(4.4,32.3,1.3,serial(t),'start',sh.clear?sh.hi:'#a8a49a');
  return `<svg viewBox="0 0 ${CW} ${CH2}" aria-hidden="true"><g shape-rendering="crispEdges">${o}</g>${noName?'':tx(28,8.6,nm.length>16?3.1:3.8,nm)}${deco}</svg>`;}
const cassRO=window.ResizeObserver?new ResizeObserver(es=>{for(const e of es)sizeStk(e.target);}):null;
const stkScale=w=>Math.max(1,Math.floor(w*.215/32)); /* as big as fits between the hubs at a whole-number scale: 96 px on a computer, 64 on a phone */
function sizeStk(el){const w=el.clientWidth;if(!w)return;const cell=w/CW,fixed=el.dataset.scale?+el.dataset.scale:0,s=fixed||stkScale(w); /* a sticker, not cover art */
  const k=el.querySelector('.stk');if(!k)return;if(+k.dataset.s!==s){k.dataset.s=s;paintStk(k,+k.dataset.id,s);k.style.setProperty('--s',s);}k.style.left=Math.round(28*cell-16*s)+'px';k.style.top=Math.round(17*cell-16*s)+'px';}
function cassette(t){const el=document.createElement('div');el.className='cass';el.innerHTML='<div class="cass-svg"></div><i class="stk stuck" aria-hidden="true"></i>';fillCass(el,t);if(cassRO)cassRO.observe(el);return el;}
function fillCass(el,t){el._t=t;el.querySelector('.cass-svg').innerHTML=cassSVG(t,el._ph||0,!!el._edit);if(el._edit){const sh=SHELLS[t.c]||SHELLS[0],inp=el._edit;inp.style.color=sh.ink;inp.style.fontSize=(t.n.length>16?5.5:6.79)+'cqw';if(document.activeElement!==inp)inp.value=t.n;}const k=el.querySelector('.stk');k.dataset.id=t.t;k.dataset.s='';sizeStk(el);if(!k.dataset.s)paintStk(k,t.t,2);
  el.setAttribute('role','img');el.setAttribute('aria-label','Cassette: '+t.n+', with a '+ST.list[t.t].name.toLowerCase()+' sticker'+(t.by?', mixed by '+t.by:''));}
setInterval(()=>{document.querySelectorAll('.cass.playing').forEach(el=>{if(!el._t)return;el._ph=((el._ph||0)+1)%4;el.querySelector('.cass-svg').innerHTML=cassSVG(el._t,el._ph,!!el._edit);});},170); /* the reels step round */

/* ---------- build the page ---------- */
const deckCass=cassette(cur);$('cassWrap').appendChild(deckCass);
deckCass.title='Tap for another cassette';
deckCass.addEventListener('click',()=>{edit(t=>{t.c=(t.c+1)%SHELLS.length;});});

const startBtns=STARTS.map(st=>{const b=document.createElement('button');b.type='button';b.className='pb key';b.textContent=st.name;b.style.setProperty('--on',st.c);
  b.addEventListener('click',()=>{if(cur.s!==st.s)track('genre_select',{sound:st.name},true);edit(t=>{if(t.s!==st.s){t.s=st.s;Object.assign(t,st.rec);autoName(t);}});});$('starts').appendChild(b);return {b,st};});

const layerBtns=[];
for(const L of LAYERS){const row=document.createElement('div');row.className='layer';row.innerHTML='<span class="layer-name">'+L.name+'</span><div class="layer-keys" role="group" aria-label="'+L.name+'"></div>';
  const keys=row.querySelector('.layer-keys');
  for(const [v,label] of L.opts){const b=document.createElement('button');b.type='button';b.className='pb key';b.textContent=label;b.style.setProperty('--on',L.c);
    b.addEventListener('click',()=>{track('part_toggle',{part:L.name.toLowerCase(),value:label.toLowerCase()},true);edit(t=>{t[L.k]=L.fixed?v:(t[L.k]===v?0:v);});});keys.appendChild(b);layerBtns.push({L,b,v});}
  $('layers').appendChild(row);}

const shellBtns=SHELLS.map((L,i)=>{const b=document.createElement('button');b.type='button';b.className='shell';b.setAttribute('aria-label',L.name.toLowerCase()+' cassette');b.title=L.name;
  b.innerHTML=cassSVG({n:'',c:i,r:1},0,true);b.addEventListener('click',()=>edit(t=>{t.c=i;}));$('shellRow').appendChild(b);return b;}); /* every shell, small, to pick from */
const quickBtns=ST.quick.map(id=>{const b=document.createElement('button');b.type='button';b.className='sbtn';b.appendChild(stk(id,2));b.setAttribute('aria-label',ST.list[id].name);b.title=ST.list[id].name;
  b.addEventListener('click',()=>pickSticker(id));$('quick').appendChild(b);return {b,id};});
{const b=document.createElement('button');b.type='button';b.className='sbtn sbtn-more';b.id='moreBtn';b.innerHTML='<span>MORE</span>';b.setAttribute('aria-label','More stickers');$('quick').appendChild(b);} /* all 250 live behind this */

/* ---------- editing: everything goes through here ---------- */
/* the name rolls with the music (a new sound or a new tune gets a new name) until you write your own */
function autoName(t){if(S.named)return;let n;do n=pick(NAMES);while(n===t.n);t.n=n;flashName();}
function flashName(){const el=$('tapeName');el.classList.remove('rolled');void el.offsetWidth;el.classList.add('rolled');}
function edit(fn,newStart){
  PL=null;
  if(cur!==draft){ /* a shelf tape or a shared one: changing it makes a remix */
    S.named=true; /* a remix keeps its name unless you change it */const from=cur.by&&cur.by!==cleanBy(S.by)?cur.by:cur.from;draft=cleanTape(Object.assign({},cur,{id:undefined,by:undefined,from,fav:undefined,gift:undefined}));delete draft.id;cur=draft;track('tape_remix');}
  const before=JSON.stringify(draft);fn(draft);draft=cleanTape(draft);cur=draft;
  if(JSON.stringify(draft)===before)return paint();
  savedId=null;save();paint();
  if(!isPlaying())play(cur);else restart();}
function pickSticker(id){if(cur.t===id&&cur===draft)return;edit(t=>{t.t=id;});track('sticker_select',{sticker:ST.list[id].slug},true);slap();}
function slap(){const k=deckCass.querySelector('.stk');k.classList.remove('slap');void k.offsetWidth;k.classList.add('slap');} /* the sticker lands on the label */
function pulse(){deckCass.classList.remove('pop');void deckCass.offsetWidth;deckCass.classList.add('pop');}

/* ---------- painting ---------- */
function paint(){
  fillCass(deckCass,cur);
  for(const {b,st} of startBtns)b.setAttribute('aria-pressed',String(cur.s===st.s));
  for(const x of layerBtns)x.b.setAttribute('aria-pressed',String(cur[x.L.k]===x.v));
  for(const {b,id} of quickBtns)b.setAttribute('aria-pressed',String(cur.t===id));
  shellBtns.forEach((b,i)=>b.setAttribute('aria-pressed',String(cur.c===i)));$('shellName').textContent=(SHELLS[cur.c]||SHELLS[0]).name;
  if(document.activeElement!==$('tapeName'))$('tapeName').value=cur.n;
  if(document.activeElement!==$('fromName'))$('fromName').value=S.by||'';
  $('vfdName').textContent=cur.n;$('vfdSide').textContent=(PL?'SHELF '+(PL.i+1)+'/'+PL.ids.length:'SIDE A')+' · '+startOf(cur.s).name;
  const onShelf=cur===draft?!!savedId:S.tapes.some(t=>t.id===cur.id);
  $('saveRow').hidden=onShelf;$('shareRow').hidden=!onShelf;$('savePic').hidden=!onShelf;$('shareBtn').hidden=!navigator.share;
  $('saveBtn').lastChild.textContent=cur===draft?'SAVE TAPE':'KEEP THIS TAPE';$('saveBtn').classList.add('dirty');
  if(!onShelf){$('sentNote').textContent='';$('sentLink').hidden=true;}
  paintGrid();paintShelf();paintPlay();}
function paintPlay(){const on=isPlaying();$('play').setAttribute('aria-pressed',String(on));$('playT').textContent=on?'PAUSE':'PLAY';
  deckCass.classList.toggle('playing',on);
  const playingId=on&&gen&&gen.tape&&cur===gen.tape?gen.tape.id:null;
  document.querySelectorAll('.shelf-item').forEach(el=>{const p=!!playingId&&playingId===el.dataset.id;el.querySelector('.cass').classList.toggle('playing',p);const b=el.querySelector('.sh-play');if(b)b.textContent=p?'❚❚ PAUSE':'▶ PLAY';});
  document.querySelectorAll('.rack-item').forEach(el=>{const p=!!playingId&&playingId===el.dataset.id;el.classList.toggle('playing',p);el.classList.toggle('open',el.dataset.id===openId);});
  $('playAll').textContent=PL&&on?'❚❚ PAUSE THE SHELF':'▶ PLAY THE SHELF';
  if(sharedCass){const p=on&&cur===shared;sharedCass.classList.toggle('playing',p);$('sharedPlay').textContent=p?'❚❚ PAUSE':'▶ PLAY';}}

/* ---------- name, from ---------- */
$('tapeName').addEventListener('input',e=>{const v=e.target.value.toUpperCase();const pos=e.target.selectionStart;e.target.value=v;try{e.target.setSelectionRange(pos,pos);}catch(x){}
  const n=cleanName(v);if(!n)return;S.named=true;track('tape_name',{},false);if(cur===draft){if(draft.n===n)return;draft.n=n;savedId=null;save();paint();}else edit(t=>{t.n=n;});});
$('tapeName').addEventListener('keydown',e=>{if(e.key==='Enter')e.target.blur();});
$('tapeName').addEventListener('blur',()=>{if(!cleanName($('tapeName').value))$('tapeName').value=cur.n;});
$('rollName').addEventListener('click',()=>{S.named=false;edit(t=>{autoName(t);});}); /* ↻ hands naming back to the machine */
$('fromName').addEventListener('input',e=>{S.by=cleanBy(e.target.value)||'';save();});

/* ---------- play, new tune ---------- */
$('play').addEventListener('click',()=>{if(isPlaying())pause();else if(isPaused()&&gen.tape===cur)resume();else play(cur);});
$('newTune').addEventListener('click',()=>{edit(t=>{t.r=seed();autoName(t);});track('new_tune',{},true);
  const b=$('newTune');b.disabled=true;setTimeout(()=>b.disabled=false,250);});

/* ---------- save, share ---------- */
function saveTape(){
  if(cur!==draft){if(!S.tapes.some(t=>t.id===cur.id)){const k=Object.assign({},cur,{id:Math.random().toString(36).slice(2,10)});S.tapes.unshift(k);cur=k;if(shared&&shared!==k)shared=k;save();paint();track('tape_save',{how:'keep'},true);}return cur;}
  if(savedId){const t=S.tapes.find(x=>x.id===savedId);if(t)return t;}
  const t=Object.assign({},draft,{id:Math.random().toString(36).slice(2,10)});const by=cleanBy(S.by);if(by&&!t.by)t.by=by;
  S.tapes.unshift(t);S.tapes=S.tapes.slice(0,MAX_TAPES);savedId=t.id;S.named=false;save();keepStorage();paint();pulse();track('tape_save',{sound:startOf(t.s).name},true);return t;}
/* ask the browser not to clear this site's storage when space runs low (quietly: Firefox would ask the visitor, so not there) */
function keepStorage(){try{if(navigator.storage&&navigator.storage.persist&&!/Firefox/.test(navigator.userAgent))navigator.storage.persisted().then(p=>{if(!p)navigator.storage.persist();});}catch(e){}}
$('saveBtn').addEventListener('click',()=>{saveTape();$('copyLink').textContent='COPY LINK';});
async function copyText(v){try{await navigator.clipboard.writeText(v);return true;}catch(e){}try{const ta=document.createElement('textarea');ta.value=v;ta.style.cssText='position:fixed;opacity:0;top:0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;}catch(e){return false;}}
async function copyLinkFor(t,btn){const url=tapeURL(t);const ok=await copyText(url);track('tape_share',{how:'copy'},true);
  if(btn){const was=btn.textContent;btn.textContent=ok?'COPIED':'COPY FAILED';setTimeout(()=>btn.textContent=was,1800);}return {ok,url};}
const deckTape=()=>cur===draft?S.tapes.find(x=>x.id===savedId)||cur:cur;
$('copyLink').addEventListener('click',async()=>{const {ok,url}=await copyLinkFor(deckTape(),$('copyLink'));
  $('sentNote').textContent=ok?'Link copied. Whoever opens it hears your tape.':'Copy this link and send it:';$('sentLink').hidden=ok;$('sentLink').value=url;if(!ok)$('sentLink').select();});
$('shareBtn').addEventListener('click',async()=>{const t=deckTape();try{await navigator.share({title:t.n+' · Small Beats',text:'I made you a tape: '+t.n,url:tapeURL(t)});track('tape_share',{how:'share'},true);}catch(e){}});
$('sentLink').addEventListener('focus',e=>e.target.select());
$('savePic').addEventListener('click',()=>{const t=deckTape();shareCard(t).then(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(t.n.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'tape')+'-small-beats.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);});});

/* ---------- the shelf ----------
   Up front: your three newest tapes (starred ones first) as full cassettes. Behind them, the rack: the rest of yours as spines.
   Then FROM FRIENDS: tapes people sent you. Tap a spine to play it and pull it out; tap again to pause. */
const favFirst=a=>a.filter(t=>t.fav).concat(a.filter(t=>!t.fav));
const mine=()=>favFirst(S.tapes.filter(t=>!t.gift)),friends=()=>favFirst(S.tapes.filter(t=>t.gift));
let openId=null;
const findTape=id=>S.tapes.find(x=>x.id===id);
function playShelfTape(id){const tt=findTape(id);if(!tt)return;openId=id;if(isPlaying()&&cur===tt){pause();return;}cur=tt;paint();if(isPaused()&&gen.tape===tt)resume();else play(tt);}
function remixTape(id){const tt=findTape(id);if(!tt)return;cur=tt;edit(()=>{});if(!isPlaying())play(cur);$('make').scrollIntoView({behavior:'smooth'});}
function favTape(id){const tt=findTape(id);if(!tt)return;tt.fav=tt.fav?undefined:1;if(!tt.fav)delete tt.fav;save();paint();track('tape_fav',{on:!!tt.fav},true);}
let undoT=null;
function throwOut(id){const k=S.tapes.findIndex(x=>x.id===id);if(k<0)return;const t=S.tapes[k];
  if(gen&&gen.tape&&gen.tape.id===id)stop();S.tapes.splice(k,1);if(savedId===id)savedId=null;if(cur.id===id)cur=draft;if(PL)PL.ids=PL.ids.filter(x=>x!==id);save();paint();
  $('undoT').textContent='Threw out '+t.n+'.';$('undo').hidden=false;clearTimeout(undoT);undoT=setTimeout(()=>{$('undo').hidden=true;},7000);
  $('undoBtn').onclick=()=>{if(!findTape(t.id)){S.tapes.splice(Math.min(k,S.tapes.length),0,t);save();paint();}$('undo').hidden=true;clearTimeout(undoT);};}
function btn(label,c,fn,cls,aria){const b=document.createElement('button');b.type='button';b.className='pb'+(cls?' '+cls:'');b.style.setProperty('--c',c);b.textContent=label;if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
function starBtn(t){const b=btn(t.fav?'★':'☆',t.fav?'var(--amber)':'var(--key)',()=>favTape(t.id),'star',t.fav?'Unstar '+t.n:'Star '+t.n);b.setAttribute('aria-pressed',String(!!t.fav));if(!t.fav)b.style.setProperty('--t','var(--cream)');return b;}
function delBtn(t){const b=btn('✕','var(--key)',()=>throwOut(t.id),'',`Throw out ${t.n}`);b.style.setProperty('--t','var(--cream)');return b;}
/* a cassette seen from the side, as it sits in a rack: the shell, a label with the name, the sticker on the end */
function spine(t,still){const sh=SHELLS[t.c]||SHELLS[0],el=document.createElement(still?'div':'button');if(!still)el.type='button';el.className='spine';
  el.style.cssText=`--sh:${sh.sh};--hi:${sh.hi};--lab:${sh.lab};--ink:${sh.ink};--acc:${sh.acc}`;
  const cols=sh.art==='rainbow'?['#e8392b','#f6860b','#f5d23e','#4fc48d','#3b9ad9']:sh.art==='swoosh'?['#ef4f6c','#f6860b','#f5d23e']:(sh.cols&&sh.cols.length?sh.cols:[sh.acc]).slice(0,4);
  el.innerHTML=`<span class="spine-state" aria-hidden="true"></span><span class="spine-lab"><span class="spine-art" aria-hidden="true">${cols.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span class="spine-name">${escX(t.n)}</span>${t.gift?`<span class="spine-from">${escX(t.by?'from '+t.by:'from a friend')}</span>`:''}</span>`;
  el.appendChild(stk(t.t,1));if(!still)el.setAttribute('aria-label',(t.gift?'From '+(t.by||'a friend')+': ':'')+t.n+', play');return el;}
function rackItem(t){const it=document.createElement('div');it.className='rack-item';it.dataset.id=t.id;
  const sp=spine(t);sp.addEventListener('click',()=>playShelfTape(t.id));it.appendChild(sp);it.appendChild(starBtn(t));
  const acts=document.createElement('div');acts.className='spine-acts row-btns';
  acts.appendChild(btn('REMIX','var(--amber)',()=>remixTape(t.id),'pb-sm'));
  const cp=btn('COPY LINK','var(--blue)',()=>{const tt=findTape(t.id);if(tt)copyLinkFor(tt,cp);},'pb-sm');acts.appendChild(cp);acts.appendChild(delBtn(t));
  it.appendChild(acts);return it;}
function paintShelf(){const row=$('shelf');const sig=S.tapes.map(t=>t.id+(t.fav?'*':'')+(t.gift?'g':'')).join(',');
  $('tapes').hidden=!S.tapes.length;$('navTapes').hidden=!S.tapes.length;$('navCount').textContent=S.tapes.length;
  if(row.dataset.sig===sig){row.querySelectorAll('.shelf-item').forEach(el=>{const t=findTape(el.dataset.id);if(t)fillCass(el.querySelector('.cass'),t);});return;}
  row.dataset.sig=sig;row.textContent='';$('rack').textContent='';$('friends').textContent='';
  const m=mine(),front=m.slice(0,3),f=friends();
  for(const t of front){const it=document.createElement('div');it.className='shelf-item';it.dataset.id=t.id;it.appendChild(cassette(t));
    const bs=document.createElement('div');bs.className='row-btns';
    bs.appendChild(btn('▶ PLAY','var(--green)',()=>playShelfTape(t.id),'sh-play'));bs.appendChild(btn('REMIX','var(--amber)',()=>remixTape(t.id)));
    const cp=btn('COPY LINK','var(--blue)',()=>{const tt=findTape(t.id);if(tt)copyLinkFor(tt,cp);});bs.appendChild(cp);bs.appendChild(delBtn(t));
    const sb=starBtn(t);sb.classList.add('star-badge');it.appendChild(sb); /* the star sits on the cassette's corner */
    it.appendChild(bs);row.appendChild(it);}
  for(const t of m.slice(3))$('rack').appendChild(rackItem(t));
  for(const t of f)$('friends').appendChild(rackItem(t));
  $('rackEmpty').hidden=m.length>3;$('friendsEmpty').hidden=f.length>0;
  paintPlay();}

/* play the shelf: yours (starred first), then your friends', a few minutes each, round and round */
function nextOnShelf(){if(!PL||!PL.ids.length){PL=null;return;}PL.i=(PL.i+1)%PL.ids.length;const t=findTape(PL.ids[PL.i]);if(!t){PL.ids.splice(PL.i,1);PL.i--;return nextOnShelf();}
  cur=t;openId=t.id;start(t,2.5);PL.until=actx.currentTime+PL_SEC;paint();}
$('playAll').addEventListener('click',()=>{if(PL){if(isPlaying())pause();else if(isPaused())resume();return;}
  const ids=mine().concat(friends()).map(t=>t.id);if(!ids.length)return;ensureAudio();PL={ids,i:-1,until:0};nextOnShelf();track('play_all',{tapes:ids.length},true);});

/* ---------- the shelf link: every tape in one link, so a shelf can move browsers without an account ----------
   ?shelf= + "z" and base64url of the deflated JSON [1, [[name, shell, drums, bass, keys, texture, speed, sound, seed, sticker, by, from, flags], ...]]
   (flags: 1 starred, 2 from a friend). Browsers that can't deflate use "j" and plain JSON. */
const b64u=bytes=>{let b='';for(let i=0;i<bytes.length;i+=8192)b+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=v=>{const b=atob(String(v).replace(/-/g,'+').replace(/_/g,'/'));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
async function shelfCode(tapes){const json=JSON.stringify([1,tapes.map(t=>[t.n,t.c,t.d,t.b,t.k,t.w,t.p,t.s,t.r,t.t,t.by||'',t.from||'',(t.fav?1:0)|(t.gift?2:0)])]);
  if(window.CompressionStream){try{const st=new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));return 'z'+b64u(new Uint8Array(await new Response(st).arrayBuffer()));}catch(e){}}
  return 'j'+b64u(new TextEncoder().encode(json));}
async function decodeShelf(code){try{code=String(code);let json;
    if(code[0]==='z'){const st=new Blob([unb64u(code.slice(1))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));json=await new Response(st).text();}
    else if(code[0]==='j')json=new TextDecoder().decode(unb64u(code.slice(1)));else return null;
    const a=JSON.parse(json);if(!Array.isArray(a)||a[0]!==1||!Array.isArray(a[1]))return null;
    return a[1].slice(0,MAX_TAPES).map(x=>Array.isArray(x)?cleanTape({n:x[0],c:x[1],d:x[2],b:x[3],k:x[4],w:x[5],p:x[6],s:x[7],r:x[8],t:x[9],by:x[10],from:x[11],fav:x[12]&1,gift:x[12]&2}):null).filter(Boolean);
  }catch(e){return null;}}
let qrLoad=null;const loadQR=()=>qrLoad||(qrLoad=new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='qr.js';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc);}));
function drawQR(url){const cv=$('qr'),x=cv.getContext('2d');loadQR().then(()=>{let q;try{q=qrcode(0,'L');q.addData(url);q.make();}catch(e){cv.hidden=true;$('qrHint').textContent='Too many tapes for one QR code. Use the link instead.';return;}
  const n=q.getModuleCount(),u=Math.max(2,Math.floor(232/(n+8))),S2=(n+8)*u;cv.width=cv.height=S2;cv.hidden=false;x.fillStyle='#f2e7d0';x.fillRect(0,0,S2,S2);x.fillStyle='#1d1c21';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))x.fillRect((c+4)*u,(r+4)*u,u,u);
  $('qrHint').textContent="Point your phone's camera here to take your tapes with you.";}).catch(()=>{cv.hidden=true;});}
async function refreshShelfLink(){const url=siteURL()+'?shelf='+await shelfCode(S.tapes);$('shelfLink').value=url;drawQR(url);return url;}
$('shelfLinkBtn').addEventListener('click',async()=>{const open=$('backup').hidden;$('backup').hidden=!open;$('shelfLinkBtn').setAttribute('aria-expanded',String(open));
  if(open){$('shelfNote').textContent='';await refreshShelfLink();track('shelf_link',{tapes:S.tapes.length},true);}});
$('copyShelf').addEventListener('click',async()=>{const url=await refreshShelfLink();const ok=await copyText(url);
  $('shelfNote').textContent=ok?'Copied. Paste it somewhere safe, like a note to yourself.':'Copy the link above and keep it somewhere safe.';if(!ok)$('shelfLink').select();});
$('shelfLink').addEventListener('focus',e=>e.target.select());
/* opening a shelf link: show what's in it, and add it on a tap */
{const code=Q.get('shelf');if(code&&!BC)decodeShelf(code).then(list=>{if(!list||!list.length)return;
  $('shelfIn').hidden=false;$('hero').hidden=true;$('shelfInKick').textContent=list.length===1?'A SHELF WITH ONE TAPE':'A SHELF OF '+list.length+' TAPES';
  for(const t of list.slice(0,6))$('shelfInRack').appendChild(spine(t,true));$('shelfInMore').textContent=list.length>6?'and '+(list.length-6)+' more':'';
  $('shelfInAdd').addEventListener('click',()=>{for(const t of list){const x=S.tapes.find(y=>sameTape(y,t));if(x&&t.fav)x.fav=1;} /* stars carry over onto tapes already here */
    const fresh=list.filter(t=>!S.tapes.some(x=>sameTape(x,t)));
    const added=fresh.map(t=>Object.assign({},t,{id:Math.random().toString(36).slice(2,10)}));S.tapes=added.concat(S.tapes).slice(0,MAX_TAPES);save();keepStorage();paint();
    const dup=list.length-fresh.length;$('shelfInNote').textContent=(added.length?'Added '+added.length+(added.length===1?' tape':' tapes'):'Nothing new')+(dup?'. '+dup+(dup===1?' was':' were')+' already here.':'.');
    $('shelfInAdd').disabled=true;track('shelf_restore',{tapes:added.length},true);$('tapes').scrollIntoView({behavior:'smooth'});});});}

/* ---------- all stickers ---------- */
let stickerCategory=0;
ST.categories.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='sticker-tab';b.textContent=c.name;b.setAttribute('role','tab');b.addEventListener('click',()=>{stickerCategory=i;paintGrid(true);});$('stickerTabs').appendChild(b);});
function paintGrid(rebuild){if($('drawer').hidden)return;const g=$('grid');
  [...$('stickerTabs').children].forEach((b,i)=>b.setAttribute('aria-selected',String(i===stickerCategory)));
  if(rebuild||g.dataset.category!==String(stickerCategory)){g.dataset.category=stickerCategory;g.textContent='';const cat=ST.categories[stickerCategory];g.dataset.cat=cat.id;for(const i of cat.ids||ST.list.filter(x=>x.category===cat.id).map(x=>x.id)){const b=document.createElement('button');b.type='button';b.className='sbtn';b.dataset.id=i;b.appendChild(stk(i,2));b.setAttribute('aria-label',ST.list[i].name);b.title=ST.list[i].name;b.addEventListener('click',()=>pickSticker(i));g.appendChild(b);}}
  g.querySelectorAll('.sbtn').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.id===cur.t)));
  if(rebuild){const tab=$('stickerTabs').children[stickerCategory];if(tab)$('stickerTabs').scrollLeft=Math.max(0,tab.offsetLeft-$('stickerTabs').offsetLeft-16);}}
$('moreBtn').addEventListener('click',()=>{stickerCategory=ST.categories.findIndex(c=>c.id===ST.list[cur.t].category);$('drawer').hidden=false;paintGrid(true);});
$('drawerDone').addEventListener('click',()=>{$('drawer').hidden=true;});
$('drawerScrim').addEventListener('click',()=>{$('drawer').hidden=true;});

/* ---------- a shared tape (opened from a link) ---------- */
let sharedCass=null;
if(shared&&!BC){$('shared').hidden=false;sharedCass=cassette(shared);$('sharedWrap').appendChild(sharedCass);
  $('sharedBy').textContent=shared.by?'Mixed by '+shared.by+(shared.from?', remixed from '+shared.from:''):(shared.from?'Remixed from '+shared.from:'Somebody made this for you.');
  $('sharedPlay').addEventListener('click',()=>{if(isPlaying()&&cur===shared){pause();return;}cur=shared;paint();if(isPaused()&&gen.tape===shared)resume();else{play(shared);track('tape_open');}});
  $('sharedRemix').addEventListener('click',()=>{cur=shared;edit(()=>{});if(!isPlaying())play(cur);$('make').scrollIntoView({behavior:'smooth'});});
  /* a tape somebody else made goes straight onto your shelf, under FROM FRIENDS; one of your own just gets a KEEP button */
  const have=S.tapes.find(t=>sameTape(t,shared)),me=cleanBy(S.by);
  if(have)shared=have;else if(!(shared.by&&me&&shared.by===me)){const k=Object.assign({},shared,{id:Math.random().toString(36).slice(2,10),gift:1});S.tapes.unshift(k);S.tapes=S.tapes.slice(0,MAX_TAPES);shared=k;save();keepStorage();}
  const kept=()=>{const g=findTape(shared.id);$('sharedKeep').textContent=g&&g.gift?'Saved on your shelf, under FROM FRIENDS':'On your shelf';};
  $('sharedKeep').addEventListener('click',()=>{if(!findTape(shared.id||'')){const k=Object.assign({},shared,{id:Math.random().toString(36).slice(2,10)});S.tapes.unshift(k);shared=k;save();paint();}
    kept();$('tapes').scrollIntoView({behavior:'smooth'});});
  if(findTape(shared.id||''))kept();
  cur=shared;$('hero').hidden=true;}

/* ---------- cats blink ---------- */
if(!calm&&ST.blink)setInterval(()=>{const now=performance.now();document.querySelectorAll('.cass .stk.stuck,.bc-brand .stk').forEach(k=>{const id=+k.dataset.id,b=ST.blink[id];if(b===undefined||+k.dataset.vibe)return;
  if(!k._blink)k._blink=now+3000+Math.random()*5000;if(now<k._blink)return;k._blink=now+5000+Math.random()*3000;
  const sc=+k.dataset.s||2;paintStk(k,b,sc);setTimeout(()=>{if(+k.dataset.id===id)paintStk(k,id,+k.dataset.s||sc);},150);});},250);
/* a sticker squashes when you pick it */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.sbtn');if(!b||calm)return;const k=b.querySelector('.stk');if(!k)return;k.classList.remove('squish');void k.offsetWidth;k.classList.add('squish');});

/* ---------- the display: a tape counter and a little level meter, in dots ---------- */
const vu=$('vu'),vx=vu.getContext('2d');let fbuf=null;
function frame(){requestAnimationFrame(frame);
  if(actx){const now=actx.currentTime;let hop=false;while(VIS.hops.length&&VIS.hops[0]<=now){VIS.hops.shift();hop=true;}
    if(hop&&isPlaying()&&!calm)document.querySelectorAll('.cass.playing .stk.stuck,.bc-brand .stk').forEach(k=>{k.classList.remove('hop');void k.offsetWidth;k.classList.add('hop');});} /* the sticker hops on beats 1 and 3 */
  if(BC)bcFrame();
  if(PL&&isPlaying()&&actx.currentTime>=PL.until)nextOnShelf();
  const on=isPlaying();$('vfdCount').textContent=String(Math.floor(counterMs()/1000)%1000).padStart(3,'0');
  const W=vu.width,H=vu.height,n=20;vx.clearRect(0,0,W,H);
  if(an&&on){fbuf=fbuf||new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(fbuf);}
  for(let i=0;i<n;i++){const v=on&&fbuf?fbuf[Math.min(fbuf.length-1,Math.floor(Math.pow(i/n,1.6)*60)+1)]/255:0,lit=Math.round(v*3.2);
    for(let j=0;j<lit&&j<3;j++){vx.fillStyle=j===2?'#e8a33a':'#55d6c2';vx.beginPath();vx.arc(i*8+4,H-4-j*5.5,2.1,0,7);vx.fill();}}}
requestAnimationFrame(frame);

/* ---------- share picture: the cassette on a card, 1200 x 630 ---------- */
function loadImg(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});}
async function shareCard(t){await document.fonts.ready;const sheet=await loadImg('stickers.png?v=6');const c=document.createElement('canvas');c.width=1200;c.height=630;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  drawCard(x,t,sheet);return new Promise(r=>c.toBlob(r,'image/png'));}
function dieCut(x,sheet,id,dx,dy,s,edge){ /* the sticker with a white die-cut edge, as on the cassette */
  const sx=(id%25)*32,sy=Math.floor(id/25)*32,o=document.createElement('canvas');o.width=o.height=32*s+2*edge;const ox=o.getContext('2d');ox.imageSmoothingEnabled=false;
  for(const [ex,ey] of [[0,edge],[2*edge,edge],[edge,0],[edge,2*edge],[0,0],[2*edge,0],[0,2*edge],[2*edge,2*edge]])ox.drawImage(sheet,sx,sy,32,32,ex,ey,32*s,32*s);
  ox.globalCompositeOperation='source-in';ox.fillStyle='#fbf6ea';ox.fillRect(0,0,o.width,o.height);ox.globalCompositeOperation='source-over';ox.drawImage(sheet,sx,sy,32,32,edge,edge,32*s,32*s);
  x.drawImage(o,dx-edge,dy-edge);}
function drawCard(x,t,sheet){
  x.fillStyle='#2a1915';x.fillRect(0,0,1200,630);
  for(let yy=10;yy<630;yy+=20)for(let xx=10;xx<1200;xx+=20){x.fillStyle='#35211b';x.fillRect(xx,yy,4,4);} /* dot texture */
  drawCassette(x,70,130,620,t,sheet);
  if(sheet)dieCut(x,sheet,t.t,770,90,5,6);
  x.fillStyle='#efe6d2';x.font='400 40px Silk';const words=t.n.split(' ');let line='',y=320;const lines=[];for(const w of words){const c=line?line+' '+w:w;if(x.measureText(c).width>390&&line){lines.push(line);line=w;}else line=c;}lines.push(line);
  for(const l of lines.slice(0,3)){x.fillText(l,770,y);y+=50;}
  if(t.by||t.from){x.fillStyle='#a39a8b';x.font='400 26px Plex';x.fillText(t.by?'mixed by '+t.by:'remixed from '+t.from,772,y+2);}
  x.fillStyle='#efe6d2';x.font='400 22px Silk';x.fillText('MADE ON SMALL BEATS',770,540);
  x.fillStyle='#e8a33a';x.fillText('SMALLBEATS.COM',770,578);}
function drawCassette(x,X,Y,W,t,sheet){const u=Math.max(1,Math.floor(W/CW)),{cells,sh}=cassPix(t,0); /* whole-pixel cells, so no seams */
  for(let y=0;y<CH2;y++)for(let i=0;i<CW;i++){const v=cells[y*CW+i];if(v){x.fillStyle=v;x.fillRect(X+i*u,Y+y*u,u,u);}}
  x.fillStyle=sh.ink;x.font='900 '+(t.n.length>16?3.1:3.8)*u+'px Doto';x.textAlign='center';x.fillText(t.n.toUpperCase(),X+28*u,Y+8.6*u);
  x.font='900 '+1.3*u+'px Doto';x.textAlign='left';x.fillStyle=sh.clear?sh.hi:'#a8a49a';x.fillText(serial(t),X+4.4*u,Y+32.3*u);x.textAlign='start';
  const nm=t.n.toUpperCase(),T=(tx,ty,sz,v,al,f)=>{x.font='900 '+sz*u+'px Doto';x.textAlign=al;x.fillStyle=f;x.fillText(v,X+tx*u,Y+ty*u);};
  if(nm.length<=14){if(sh.side){x.strokeStyle=sh.acc;x.lineWidth=.45*u;x.strokeRect(X+6.3*u,Y+5.2*u,3.4*u,3.6*u);T(8,8.2,2.9,sh.side,'center',sh.acc);}if(sh.len&&!t.brand)T(49.6,8.4,3.4,sh.len,'right',sh.acc);}
  const lf=sh.art==='split'?'#ffffff':sh.ink;T(10,22.6,1.45,sh.art==='sound'?'SOUND':'SIDE '+(sh.side||'A'),'center',lf);T(45.5,22.6,1.45,'STEREO','center',lf);x.textAlign='start';
  if(sheet){const s=Math.max(1,Math.floor(W*.215/32));dieCut(x,sheet,t.t,Math.round(X+28*u-16*s),Math.round(Y+17*u-16*s),s,Math.max(2,Math.round(s*.75)));}}
window.SB_drawCard=drawCard;window.SB_drawCassette=drawCassette; /* used to make the site's preview image */


/* ---------- the stripe across the top ---------- */
const STRIPE=['#f2e7d0','#e9b44c','#e2734a','#c23b4b','#8a5a3c']; /* cream, gold, orange, red, brown */
function drawStripe(){const cv=$('stripe');if(!cv||BC)return;
  const P=4,ST=2,GAP=1,BAND=5*ST+4*GAP,W=document.documentElement.clientWidth,phone=W<=620; /* in 4px cells */
  const top=document.querySelector('.top').getBoundingClientRect(),sy=window.scrollY,logo=document.querySelector('.brand-logo').getBoundingClientRect(),nav=document.querySelector('.nav').getBoundingClientRect();
  const word=document.querySelector('.brand-word').getBoundingClientRect(),cw=Math.ceil(W/P),y0=phone?Math.round((top.bottom+sy+4)/P):Math.ceil((word.bottom+sy+12)/P),ch=y0+BAND+1; /* computers: under the name, behind the cat's chin */
  const xc=phone?cw+99:Math.round((nav.left-28)/P)-BAND-6,rin=6,cy=y0-rin; /* and up before the links */
  cv.width=cw;cv.height=ch;cv.style.width=cw*P+'px';cv.style.height=ch*P+'px';const x=cv.getContext('2d');
  const col=d=>{const k=Math.floor(d);if(k<0||k>=BAND)return null;const o=k%(ST+GAP);return o<ST?STRIPE[Math.floor(k/(ST+GAP))]:null;};
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){let c;
    if(i<xc)c=j>=y0?col(j-y0):null;                         /* the straight run */
    else if(j>=cy)c=col(Math.hypot(i-xc+.5,j-cy+.5)-rin);   /* the bend */
    else c=col(i-xc-rin);                                    /* up and off the top */
    if(c){x.fillStyle=c;x.fillRect(i,j,1,1);}}}
let stripeT;addEventListener('resize',()=>{clearTimeout(stripeT);stripeT=setTimeout(drawStripe,120);});
const logoImg=document.querySelector('.brand-logo');if(logoImg.complete)drawStripe();else logoImg.addEventListener('load',drawStripe);
if(document.fonts)document.fonts.ready.then(drawStripe);

/* ---------- broadcast: just the tape, playing, for recordings ---------- */
/* Broadcast mode, for long-play videos and streams (the Studio, /studio.html, builds these addresses):
   ?broadcast=video&tape=…[&tape=…] plays one tape, or several in turn, EACH minutes apiece (default 10) with a slow
   crossfade, round and round; &shuffle=1 mixes up the order; &vol=0.8 sets the volume; &ask=0 never asks for tape links.
   One tape, one equalizer, one cat: the cassette big in the middle (its tape winding across, turning over to the other side
   each time it comes round), a dot-matrix equalizer under it in the stripe's colours, the Small Beats cat in the bottom-left
   nodding to the beat, now playing and NEXT in the top corners, the tape's texture (rain, embers, hiss) drifting softly
   behind, a vignette and a little grain. Over two hours the light warms and dims and comes back, and every four minutes
   everything shifts a few pixels so nothing burns into a screen. */
let BQ=null,bcFrame=()=>{};
if(BC){document.documentElement.classList.add('broadcast');
  const list=Q.getAll('tape').map(decodeTape).filter(Boolean),tapes=(list.length?list:[draft]).map(t=>Object.assign({},t,{_side:'A',_prog:0,_plays:0}));
  if(Q.get('shuffle')==='1')for(let i=tapes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tapes[i],tapes[j]]=[tapes[j],tapes[i]];}
  const each=60*Math.max(1,Math.min(240,+Q.get('each')||10)),ask=Q.get('ask')!=='0';
  const el=(tag,cls,parent)=>{const e=document.createElement(tag);e.className=cls;(parent||document.body).appendChild(e);return e;};
  const sky=el('canvas','bc-sky');document.body.prepend(sky);
  const grain=el('div','bc-grain');{const g=document.createElement('canvas');g.width=g.height=128;const gx=g.getContext('2d'); /* a tile of faint grain */
    for(let i=0;i<700;i++){gx.fillStyle=Math.random()<.5?'rgba(255,240,220,.05)':'rgba(0,0,0,.09)';gx.fillRect(Math.floor(Math.random()*128),Math.floor(Math.random()*128),1,1);}
    grain.style.backgroundImage=`url(${g.toDataURL()})`;grain.style.backgroundSize=(4*128)+'px';}
  el('div','bc-vig');
  const side=document.querySelector('.tapeside'),eq=el('canvas','bc-eq',side);
  const tag=el('p','bc-tag'),askEl=el('p','bc-ask'),next=el('p','bc-next');askEl.textContent='DROP YOUR TAPE LINK IN THE COMMENTS';
  const brand=el('div','bc-brand'),cat=stk(250,4,'');brand.appendChild(cat);brand.insertAdjacentHTML('beforeend','<span><b>SMALL BEATS</b><small>SMALLBEATS.COM</small></span>');
  const catScale=()=>{const s=matchMedia('(orientation:portrait)').matches?Math.max(3,Math.round(innerWidth/150)):Math.max(2,Math.round(innerHeight/270));if(+cat.dataset.s!==s){cat.dataset.s=s;cat.dataset.id=250;paintStk(cat,+cat.dataset.vibe?261:250,s);cat.style.setProperty('--s',s);}};
  catScale();addEventListener('resize',catScale);cat.dataset.id=250;
  if(Q.get('vol'))S.vol=Math.max(0,Math.min(1,+Q.get('vol')));
  const say=(e,txt)=>{e.classList.remove('in','out');void e.offsetWidth;if(txt!==undefined)e.textContent=txt;e.classList.add('in');};
  const fade=e=>{if(e.classList.contains('in')){e.classList.remove('in');e.classList.add('out');}};
  let segStart=0,segN=0,asked=0;
  const show=t=>{cur=t;paint();say(tag,'♪ '+t.n+' · '+startOf(t.s).name+(t.by?' · MIXED BY '+t.by.toUpperCase():'')+(t.from?' · REMIXED FROM '+t.from.toUpperCase():''));fade(next);fade(askEl);asked=0;};
  tapes[0]._plays=1;show(tapes[0]);BQ={tapes,i:0,each,until:0};
  const go=()=>{play(tapes[0]);segStart=actx.currentTime;BQ.until=segStart+each;
    if(actx.state!=='running'){const b=document.createElement('button');b.className='pb pb-big';b.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);--c:var(--green);z-index:9';b.textContent='▶ START';b.onclick=()=>{actx.resume();b.remove();};document.body.appendChild(b);}};
  go();
  /* the turn: the next tape (or, with one tape, the same one turned over); each time a tape comes round again it plays its other side */
  window.SB_bcNext=()=>{segN++;const old=BQ.tapes[BQ.i];
    if(BQ.tapes.length>1){BQ.i=(BQ.i+1)%BQ.tapes.length;const t=BQ.tapes[BQ.i];t._plays=(t._plays||0)+1;t._side=t._plays%2?'A':'B';t._prog=0;start(t,3);show(t);}
    else{old._side=old._side==='A'?'B':'A';old._prog=0;show(old);}
    segStart=actx.currentTime;BQ.until=segStart+BQ.each;};
  const fit=c=>{const r=c.getBoundingClientRect(),d=window.devicePixelRatio||1,w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return c.getContext('2d');};
  /* the equalizer: square dots, brown at the bottom up through red, orange and gold to a cream tip; lows on the left */
  const EQC=['#8a5a3c','#8a5a3c','#c23b4b','#c23b4b','#e2734a','#e2734a','#e9b44c','#e9b44c','#f2e7d0','#f2e7d0'],DIM='rgba(242,231,208,.06)';
  const lev=new Float32Array(32),peak=new Float32Array(32),hold=new Float32Array(32);let fb=null,lastT=0;
  const drops=[],embers=[];let skyT=0,driftT=0,shiftT=0,shiftK=0,vibeAt=0,vibeEnd=0;
  bcFrame=()=>{if(!actx)return;const now=actx.currentTime,on=isPlaying(),dt=Math.min(.1,Math.max(0,now-lastT));lastT=now;
    const t=BQ.tapes[BQ.i],into=now-segStart;
    if(on&&now>=BQ.until)window.SB_bcNext();
    const pr=Math.max(0,Math.min(1,into/BQ.each));if(Math.abs((t._prog||0)-pr)>.01){t._prog=pr;fillCass(deckCass,t);}
    if(on){if(BQ.tapes.length>1&&BQ.until-now<30&&!next.classList.contains('in'))say(next,'NEXT · '+BQ.tapes[(BQ.i+1)%BQ.tapes.length].n);
      const askNow=ask&&(BQ.tapes.length>1?segN%3===2:segN%2===1);
      if(askNow&&asked===0&&into>120){say(askEl);asked=1;}if(asked===1&&into>150){fade(askEl);asked=2;}}
    /* now and then the cat closes its eyes for a couple of beats, really into it */
    if(on&&!calm){if(!vibeAt)vibeAt=now+40+Math.random()*30;
      if(now>=vibeAt&&!vibeEnd){vibeEnd=now+4*(VIS.step*4);cat.dataset.vibe=1;paintStk(cat,261,+cat.dataset.s);}
      if(vibeEnd&&now>=vibeEnd){vibeEnd=0;vibeAt=now+40+Math.random()*30;cat.dataset.vibe=0;paintStk(cat,250,+cat.dataset.s);}}
    {const tall=innerHeight>innerWidth,NB=tall?24:32,NR=tall?10:9,x=fit(eq),W=eq.width,H=eq.height;x.clearRect(0,0,W,H);
      if(an&&on){fb=fb||new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(fb);}
      const bw=W/NB,bh=H/NR,sq=Math.max(2,Math.floor(Math.min(bw,bh)*.62));
      for(let i=0;i<NB;i++){const v=on&&fb?Math.pow(fb[Math.min(fb.length-1,1+Math.floor(Math.pow(i/NB,1.7)*70))]/255,1.6)*(1+i/NB*.9):0;lev[i]=Math.max(lev[i]*Math.pow(.03,dt),v);
        const n=Math.min(NR,Math.round(lev[i]*NR));if(n>=peak[i]){peak[i]=n;hold[i]=.8;}else if((hold[i]-=dt)<0)peak[i]=Math.max(0,peak[i]-dt*6);
        const pk=Math.ceil(peak[i]);
        for(let j=0;j<NR;j++){const X=Math.round(i*bw+(bw-sq)/2),Y=Math.round(H-(j+1)*bh+(bh-sq)/2);const c=EQC[Math.min(EQC.length-1,Math.round(j*(EQC.length-1)/(NR-1)))];
          x.fillStyle=j<n||(pk>n&&j===pk)?c:DIM;x.fillRect(X,Y,sq,sq);}}}
    /* the weather of the tape's texture, very soft, in big pixels */
    if((skyT+=dt)>.05){skyT=0;const x=fit(sky),P=Math.max(4,Math.round(sky.width/320)),W=Math.ceil(sky.width/P),H=Math.ceil(sky.height/P);x.clearRect(0,0,sky.width,sky.height);
      if(!calm){if(t.w===1){while(drops.length<70)drops.push({x:Math.random()*W,y:Math.random()*H,v:30+Math.random()*30});
          x.fillStyle='rgba(170,185,220,.22)';for(const d of drops){d.y+=d.v*.05;d.x-=d.v*.01;if(d.y>H){d.y=-3;d.x=Math.random()*W*1.1;}x.fillRect(Math.round(d.x)*P,Math.round(d.y)*P,P,P*3);}}
        else drops.length=0;
        if(t.w===3){for(let i=0;i<W;i++){const h=4+3*Math.sin(now*1.7+i*.45)+2*Math.sin(now*.9-i*.21)+Math.random()*1.5;
            for(let j=0;j<h;j++){x.fillStyle=`rgba(${j<2?233:226},${j<2?150:115},${j<2?70:74},${.2*(1-j/h)})`;x.fillRect(i*P,(H-1-j)*P,P,P);}}
          if(Math.random()<.25)embers.push({x:Math.random()*W,y:H-2,l:1});for(const e of embers){e.y-=.5;e.x+=Math.sin(e.y*.3)*.3;e.l-=.012;}
          for(let i=embers.length-1;i>=0;i--){const e=embers[i];if(e.l<=0){embers.splice(i,1);continue;}x.fillStyle=`rgba(233,180,76,${e.l*.5})`;x.fillRect(Math.round(e.x)*P,Math.round(e.y)*P,P,P);}}
        else embers.length=0;
        if(t.w===2){x.fillStyle='rgba(242,231,208,.06)';for(let i=0;i<W*H*.004;i++)x.fillRect(Math.floor(Math.random()*W)*P,Math.floor(Math.random()*H)*P,P,P);}}}
    if((driftT+=dt)>5){driftT=0;const f=(1-Math.cos(2*Math.PI*(now/7200)))/2,mix=(a,b)=>Math.round(a+(b-a)*f);document.body.style.background=`rgb(${mix(36,22)},${mix(21,12)},${mix(15,9)})`;}
    if((shiftT+=dt)>240){shiftT=0;shiftK=(shiftK+1)%4;const o=[[0,0],[4,-3],[-3,4],[3,3]][shiftK];document.documentElement.style.setProperty('--bx',o[0]+'px');document.documentElement.style.setProperty('--by',o[1]+'px');}};}

paint();
if(!BC)try{console.log('%cSMALL BEATS','font:700 14px monospace;color:#e8a33a');console.log('%cEverything you hear is made in this tab, a bar at a time. No recordings.','color:#a39a8b');}catch(e){}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
