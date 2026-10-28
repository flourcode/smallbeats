/* Small Beats · SB-1, a tiny music machine. The mixer, the tape and the shelf.
   One loop: pick a SOUND → tap the parts → NEW tune → play along (it joins the song) → SAVE TAPE → EJECT (label it, pick a buddy, send the link) → they play it → remix.
   The deck always plays one cassette: your draft, a tape off your shelf, or one somebody sent you. Touch any control while
   somebody else's tape (or a saved one) is in the deck and it quietly becomes a remix of it: nothing asks, nothing stops.
   No keyboard shortcuts, no dialogs, no accounts. Tapes live in this browser; a link carries the whole recipe. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const E=window.SBE,BUD=window.BUDDIES;
const STORE='smallBeats';
const Q=new URLSearchParams(location.search);
const BC=/^(video|live)$/.test(Q.get('broadcast')||'');

/* ---------- what you can pick ---------- */
const STARTS=[ /* s is the engine's start-sound number; rec is where it starts; c is its district's colour (the lit key, the route sign, thumbnails: one colour per district everywhere) */
  {name:'LO-FI',s:0,c:'#d8805e',rec:{d:2,b:1,k:1,w:0,p:1}},
  {name:'HOUSE',s:1,c:'#d1ac5a',rec:{d:1,b:3,k:3,w:0,p:1}},
  {name:'AMBIENT',s:2,c:'#8fb36a',rec:{d:0,b:0,k:3,w:0,p:0}},
  {name:'8-BIT',s:3,c:'#d97aa6',rec:{d:1,b:1,k:4,w:0,p:1}},
  {name:'DUB',s:4,c:'#5fa8c9',rec:{d:2,b:2,k:1,w:0,p:1}},
  {name:'TRANCE',s:5,c:'#a88fd6',rec:{d:1,b:1,k:1,w:0,p:1}}]; /* trance is written by the newer composer (composer.js): see tranceBand */
const TRANCE_LABELS={d:{2:'HARD'},b:{1:'OFFBEAT',2:'ROLLING',3:'SYNTH'},k:{1:'SAWS',2:'PLUCK',3:'PAD',4:'ARP'}}; /* the same settings, named for what they play in trance */
const startOf=s=>STARTS.find(x=>x.s===s)||STARTS[0];
const FEEL=[2,1,2,1,2,1]; /* how the drums come in, by start sound: swing for lo-fi, ambient and dub, tight for house and 8-bit */
/* the six tap-to-change keys: each tap steps to the next setting */
const DIALS=[
  {k:'d',name:'DRUMS',opts:[[0,'OFF'],[1,'TIGHT'],[2,'SWING']],c:'#9bbf7e',hits:['k','s']},
  {k:'b',name:'BASS',opts:[[0,'OFF'],[1,'WARM'],[2,'DEEP'],[3,'SYNTH'],[4,'WAVE']],c:'#e3955c',hits:['b']},
  {k:'k',name:'KEYS',opts:[[0,'OFF'],[1,'RHODES'],[2,'GUITAR'],[3,'PAD'],[4,'8-BIT']],c:'#e3c266',hits:['n']},
  {k:'w',name:'TEXTURE',opts:[[0,'OFF'],[2,'HISS'],[1,'RAIN'],[3,'FIRE']],c:'#8fb0cc'},
  {k:'p',name:'SPEED',opts:[[0,'SLOW'],[1,'STEADY'],[2,'FAST']],c:'#efe6d2'},
  {k:'vol',name:'VOLUME',opts:[[.45,'LOW'],[.7,'MID'],[1,'LOUD']],c:'#d4809f',ui:true}]; /* volume is this browser's, not the tape's */
const SHELLS=[{name:'GRAPHITE',sh:'#3b383f',hi:'#58545d',sd:'#26242a',lab:'#f3ead6',band:'#1d1b20'},{name:'TANGERINE',sh:'#f0883a',hi:'#ffb36b',sd:'#c2602a',lab:'#f6efdf',band:'#2a1d18'},
  {name:'CREME',sh:'#e6dcc4',hi:'#faf3e1',sd:'#bfb193',lab:'#fffaf0',band:'#3a2a24'},{name:'BUBBLEGUM',sh:'#f59ac0',hi:'#ffc8de',sd:'#d0709a',lab:'#fff4f8',band:'#3a1f2c'}].map(x=>Object.assign(x,{ink:'#1d1c21'}));
/* the label's three stripes: on brand, two sets, rainbow and sunset, taking turns by style */
const RAINBOW=['#ffb347','#e0457b','#3ec6e0'],SUNSET=['#e9b44c','#e2734a','#c23b4b'],STRIPES=[SUNSET,RAINBOW,SUNSET,RAINBOW,SUNSET,RAINBOW];
/* the LCD: one warm amber backlight for every style, so it's always the same machine. The style shows in small things: its key, the lights, the tape's stripes, the keys as they light */
/* the screen: Game Boy olive, four shades and nothing in between. 0 the backlight (lit windows, lamps, headlights), 1 the far city
   and the lawn, 2 the near blocks, 3 the ink: the crew, landmarks, edges and words. The rest of the site stays warm: only the screen is green */
const GB=['#d9e2a3','#a7b56d','#66733d','#28301e'],LCD=GB[0],INKC=GB[3];
const tapeNo=t=>String(((t.r>>>0)%997)+1).padStart(3,'0'); /* a tape's number: from its tune, so it's the same for everyone */
const NAMES=window.SBN.NAMES; /* night.js: the tape names, shared with the Studio */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const seed=()=>1+Math.floor(Math.random()*2147483646);
const budId=n=>Math.max(0,BUD.list.findIndex(b=>b.name===n)),DEFAULT_BUDDY=budId('DINO'); /* Dino, the mascot */

/* ---------- tapes ---------- */
const clampInt=(v,lo,hi,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d;};
const cleanName=v=>String(v||'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,24);
const cleanBy=v=>String(v||'').replace(/[^\w &'.,!?\/-]/g,'').replace(/\s+/g,' ').trim().slice(0,24)||undefined;
function cleanTape(t){if(!t||typeof t!=='object')return null;
  const s=clampInt(t.s,0,5,0),o={n:cleanName(t.n)||'MY TAPE',c:clampInt(t.c,0,99,0)%SHELLS.length,d:clampInt(t.d,0,2,FEEL[s]),b:clampInt(t.b,0,4,0),k:clampInt(t.k,0,4,0),
    w:clampInt(t.w,0,3,0),p:clampInt(t.p,0,2,1),s,r:clampInt(t.r,1,2147483647,1),t:BUD.norm(clampInt(t.t,0,9999,DEFAULT_BUDDY))};
  if(t.id&&/^[a-z0-9]{1,16}$/.test(t.id))o.id=t.id;const by=cleanBy(t.by),fr=cleanBy(t.from);if(by)o.by=by;if(fr)o.from=fr;
  if(typeof t.m==='string'&&/^([0-9a-v][0-9a-z][1-9a-g]){1,48}$/.test(t.m))o.m=t.m; /* notes played along on the keyboard: 3 characters a note (step, scale degree, length) */
  if(t.fav)o.fav=1;if(t.gift)o.gift=1; /* on your shelf only: starred, and sent to you by a friend */
  return o;}
const b64e=j=>btoa(unescape(encodeURIComponent(j))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
/* A tape link: ?tape= + base64url of [1, name, shell, drums, bass, keys, texture, speed, sound, seed, buddy, by?, from?, notes?] (notes: what was played along on the keyboard).
   Anything else is not a tape. See README, "Tape format". */
const TAPE_V=1;
function encodeTape(t){const a=[TAPE_V,t.n,t.c,t.d,t.b,t.k,t.w,t.p,t.s,t.r,t.t];if(t.by||t.from||t.m)a.push(t.by||'');if(t.from||t.m)a.push(t.from||'');if(t.m)a.push(t.m);return b64e(JSON.stringify(a));}
function decodeTape(code){try{const a=JSON.parse(decodeURIComponent(escape(atob(String(code).replace(/-/g,'+').replace(/_/g,'/')))));
    if(Array.isArray(a)&&a[0]===TAPE_V&&a.length>=11)return cleanTape({n:a[1],c:a[2],d:a[3],b:a[4],k:a[5],w:a[6],p:a[7],s:a[8],r:a[9],t:a[10],by:a[11],from:a[12],m:a[13]});
  }catch(e){}return null;}
/* where links point: this site, or smallbeats.com when the page was opened as a file (a file has no address to share) */
const siteURL=()=>/^https?:$/.test(location.protocol)?location.origin+location.pathname.replace(/[^/]*$/,''):'https://smallbeats.com/';
const tapeURL=t=>siteURL()+'?tape='+encodeTape(t);
const serial=t=>'SB-'+String(t.r%100000).padStart(5,'0');
const sameMusic=(a,b)=>a&&b&&['d','b','k','w','p','s','r'].every(k=>a[k]===b[k]);
const sameTape=(a,b)=>sameMusic(a,b)&&a.n===b.n&&a.t===b.t&&a.c===b.c&&(a.m||'')===(b.m||'');

/* ---------- saved state ---------- */
let S={vol:.7,by:'',tapes:[],draft:null};
try{const v=JSON.parse(localStorage.getItem(STORE)||'null');if(v&&typeof v==='object')Object.assign(S,v);}catch(e){}
const MAX_TAPES=300; /* yours and your friends' together; each one is a couple of hundred bytes */
S.tapes=(Array.isArray(S.tapes)?S.tapes:[]).map(cleanTape).filter(Boolean).slice(0,MAX_TAPES);
const STARTERS=[ /* three tapes already on the shelf on a first visit, so the shelf, PLAY, REMIX and COPY LINK explain themselves */
  {id:'grocery',n:'GROCERY RUN',c:0,d:1,b:1,k:3,w:0,p:1,s:1,r:1422687053,t:budId('DINO'),fav:1},
  {id:'sidequest',n:'SIDE QUEST',c:0,d:1,b:1,k:4,w:0,p:1,s:3,r:1469865583,t:budId('OINK')},
  {id:'sadurday',n:'SADURDAY BEATS',c:0,d:2,b:1,k:1,w:0,p:1,s:0,r:1186502331,t:budId('SHROOM')}];
/* The starter tapes. STARTER_V goes up whenever they change: then the old copies on a returning visitor's shelf are swapped for the
   new ones (and any missing come back, once). An empty shelf always gets them back, so nobody is left looking at nothing. */
const STARTER_V=8,starterIds=STARTERS.map(t=>t.id);let reseeded=false;
if(!BC&&(S.seeded!==STARTER_V||!S.tapes.length)){S.tapes=STARTERS.map(cleanTape).concat(S.tapes.filter(t=>!starterIds.includes(t.id))).slice(0,MAX_TAPES);S.seeded=STARTER_V;reseeded=true;}
const FIRST_TAPE=Object.assign({},STARTERS[0],{fav:undefined}); /* what a first visit opens on */
let draft=cleanTape(S.draft)||cleanTape(FIRST_TAPE);delete draft.id;
if(reseeded){const st=STARTERS.find(x=>x.n===draft.n);if(st&&!sameTape(draft,cleanTape(st))){draft=cleanTape(Object.assign({},st,{fav:undefined}));delete draft.id;}}
if(reseeded)try{localStorage.setItem(STORE,JSON.stringify(Object.assign({},S,{draft})));}catch(e){}
function save(){if(BC)return;S.draft=draft;try{localStorage.setItem(STORE,JSON.stringify(S));}catch(e){}}
let shared=null;{const c=Q.get('tape');if(c)shared=decodeTape(c);}
let cur=draft; /* what's in the deck */
let savedId=(S.tapes.find(t=>sameTape(t,draft))||{}).id||null; /* the shelf tape the draft was last saved as, while nothing's changed since */
const TRACKED=new Set();function track(ev,p,every){if(BC||(!every&&TRACKED.has(ev)))return;TRACKED.add(ev);try{if(window.gtag)window.gtag('event',ev,p||{});}catch(e){}}

/* ---------- sound ---------- */
let actx=null,master=null,an=null,gen=null,heard=0,runFrom=0; /* heard: ms listened, for the tape counter */
/* the style's colour, in small accents only (its key, the lit keys, the PLAY ALONG light); the screen itself stays amber */
let vfdS=-1;function paintVfd(s){if(s===vfdS)return;vfdS=s;const m=document.documentElement;m.style.setProperty('--lcd',LCD);m.style.setProperty('--acc',startOf(s).c);document.querySelector('.m-kb').style.setProperty('--glow',startOf(s).c);}
/* beats per minute, worked out as the engine does (trance comes from the composer) */
function bpmOf(t){if(t.s===5)return 138;const T=E.theory&&E.theory.TEMPO;if(!T)return '';
  const D=t.d?[2,3,1,2,4][t.s]:0,DT=D===0?[2,3,0,2,4][t.s]:D;return Math.round(T[DT][t.p]*(t.s===3&&D<3?1.22:1));}
function ensureAudio(){if(!actx){try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch(e){} /* iPhone: plays with the ring switch on silent */
    actx=new (window.AudioContext||window.webkitAudioContext)();master=actx.createGain();master.gain.value=S.vol;an=actx.createAnalyser();an.fftSize=512;an.smoothingTimeConstant=.55;/* a gentle glue compressor on the way out: no sudden loud bits, every tape at about the same level */
    const comp=actx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=10;comp.ratio.value=3;comp.attack.value=.012;comp.release.value=.3;master.connect(comp);comp.connect(an);an.connect(actx.destination);
    actx.addEventListener('statechange',paintPlay);}
  if(actx.state==='suspended')actx.resume();return actx;}
const isPlaying=()=>!!gen&&!!actx&&actx.state==='running';
const isPaused=()=>!!gen&&!!actx&&actx.state==='suspended';
function counterMs(){return heard+(isPlaying()&&runFrom?performance.now()-runFrom:0);}
function pause(){if(!isPlaying())return;track('pause',{},true);heard+=performance.now()-runFrom;runFrom=0;actx.suspend().then(paintPlay,paintPlay);}
function resume(){if(!isPaused())return;actx.resume().then(()=>{runFrom=performance.now();paintPlay();},paintPlay);}
/* flow: when a change comes in while the music plays, the new version doesn't start the song over. It picks up on the next beat
   of the one playing, at the same place in the song (same bar), and the old one hands over on that beat */
function start(t,xf,flow){const a=ensureAudio(),now=a.currentTime;if(!gen)playFrom=now;let at=0,opt={onHit:noteHit};
  const make=(o,g)=>t.s===5&&window.SBC?tranceBand(a,g,t,o):E.band(a,g,Object.assign({},t,o));
  let g=a.createGain();g.gain.value=0;g.connect(master);let b=null;
  if(flow&&gen&&isPlaying()&&gen.b.beat){const ob=gen.b;let nb=Math.max(0,Math.ceil((now+.08-ob.tStart)/ob.beat));if(flow==='bar')nb=Math.ceil(nb/4)*4; /* NEW lands on beat 1 */
    const bi=Math.floor(nb/4),bar=(gen.bar0||0)+bi;at=ob.tStart+nb*ob.beat;if(flow==='bar')landAt=at;
    /* same tempo: the new version starts on the bar already playing, notes before the hand-over beat left out, so the groove
       doesn't skip. A new tempo (another style): it starts a fresh bar on that beat */
    opt={onHit:noteHit,startAt:ob.tStart+bi*4*ob.beat,startBar:bar,cutBefore:at};b=make(opt,g);
    if(Math.abs(b.bpm-ob.bpm)>.01){b.src.forEach(s=>{try{s.stop();}catch(e){}});g.disconnect();g=a.createGain();g.gain.value=0;g.connect(master);opt={onHit:noteHit,startAt:at,startBar:bar};b=null;}}
  stopGen(at?.1:xf||.12,at); /* xf: a longer crossfade, between tapes on the shelf */
  VIS.hits=[];VIS.hops=[];VIS.bars=[];VIS.notes=[];if(!b)b=make(opt,g);VIS.step=b.step;g.gain.setValueAtTime(0,now);
  const trim=[.89,.99,1.13,1.06,.89,1][t.s]||1; /* each style evened out to the same loudness (measured) */
  if(at){g.gain.setValueAtTime(0,at-.012);g.gain.linearRampToValueAtTime(trim,at+.004);}else g.gain.linearRampToValueAtTime(trim,now+(xf||.25));
  b.tick(now+2.2);const timer=setInterval(()=>b.tick(a.currentTime+2.2),400);
  if(!runFrom)runFrom=performance.now();gen={b,g,timer,tape:t,bar0:opt.startBar||0,trim,ready:(at||now)+(at?.02:(xf||.25))+.05};ducked=false;kbFor(b);paintPlay();}
/* TRANCE: the tape's settings become a song for the newer composer (composer.js), which writes the notes; the same engine plays
   them. The tape's number seeds every part, so a trance tape plays the same for everyone, like any other tape */
function tranceBand(a,g,t,opt){const r=t.r>>>0,sd=k=>(Math.imul(r^0x9e3779b9,k*2654435761+1)>>>0)%1e9;
  const B=['off','off','roll','synth','wave'],CK=['gate','gate','saw','pad','gate'],MK=['lead','lead','pluck','glass','pluck'],W=['hiss','rain','hiss','fire'];
  const tr=(id,sound,k,vol,mute)=>({id,sound,seed:sd(k),vari:0,vol,mute,lock:false});
  const song={v:2,name:t.n,seed:r,genre:'trance',energy:[.4,.6,.8][t.p]||.6,feel:{tone:.5,space:.5,swing:.5,human:.5},
    tracks:[tr('drums',t.d===2?'hard':'trance',1,.8,!t.d),tr('bass',B[t.b]||'off',2,.8,!t.b),tr('chords',CK[t.k]||'gate',3,.7,!t.k),
      tr('melody',MK[t.k]||'lead',4,.75,!t.k),tr('perc','shaker',5,.6,!t.d),tr('texture',W[t.w]||'hiss',6,.5,!t.w)]};
  const comp=window.SBC.make(song),b=E.band(a,g,{s:comp.recipe.s,d:comp.recipe.d,b:1,k:1,w:0,p:1,r:r||1,bpm:comp.bpm,swing:comp.swing,events:bi=>comp.bar(bi),key:comp.key,minor:comp.minor,liveSound:'saw',quiet:opt&&opt.quiet,onHit:opt&&opt.onHit,startAt:opt&&opt.startAt,startBar:opt&&opt.startBar,cutBefore:opt&&opt.cutBefore});
  b.mix(song.tracks);return b;}
function stopGen(fade,at){if(!gen)return;const g=gen;gen=null;clearInterval(g.timer);try{const n=actx.currentTime,from=Math.max(n,at||0);g.g.gain.cancelScheduledValues(n);g.g.gain.setValueAtTime(g.g.gain.value,n);
    if(from>n)g.g.gain.setValueAtTime(g.g.gain.value,from); /* hold on until the hand-over beat */
    g.g.gain.linearRampToValueAtTime(0,from+(fade||.4));
    setTimeout(()=>{g.b.src.forEach(s=>{try{s.stop();}catch(e){}});g.g.disconnect();},(from-n+(fade||.4))*1000+150);}catch(e){}}
function stop(){if(runFrom){heard+=performance.now()-runFrom;runFrom=0;}stopGen(.4);paintPlay();}
function play(t){PL=null;start(t||cur);track('play');}
/* what the visuals know about the music: note hits (for the lights), bars (for the step lights and the buddies' hops), notes (for the player piano) */
const VIS={hits:[],hops:[],bars:[],notes:[],step:.125};
function noteHit(p,t,m){
  if(p==='bar'){VIS.hops.push(t,t+8*VIS.step);VIS.bars.push(t);if(VIS.bars.length>8)VIS.bars.shift();return;}
  if(m!=null&&(p==='n'||p==='c'))VIS.notes.push(t,m);
  if(p.length===1&&p!=='h'&&p!=='c')VIS.hits.push(t,p);}
const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* playing the whole shelf: each tape for a few minutes, then a slow crossfade into the next */
let PL=null;const PL_SEC=180;
let restartT=null;function restart(){if(!isPlaying())return;clearTimeout(restartT);restartT=setTimeout(()=>{start(cur,0,flowBar?'bar':true);flowBar=false;},40);} /* a burst of taps rebuilds once */

/* ---------- the Mini Tape ----------
   A pixel-art microcassette, 46 x 30 cells, drawn as SVG: a translucent shell with write-protect tabs, a label (tape number,
   title, style and tempo, the style's colour code, the buddy stamped a little crooked), a smoked window with two reels that
   turn and wind across as it plays, and a metal head plate. */
const CW=46,CH2=30,INK='#140b08';
function cassPix(t,phase){const cells=new Array(CW*CH2);const P=(x,y,v)=>{if(x>=0&&y>=0&&x<CW&&y<CH2)cells[y*CW+x]=v;};const R=(x,y,w,h,v)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,v);};
  const RB=(x,y,w,h,v,n)=>{for(let j=0;j<h;j++){const k=Math.max(0,n-j,n-(h-1-j));R(x+k,y+j,w-2*k,1,v);}};
  const disk=(cx,cy,r,v)=>{for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++)if((dx+.5)*(dx+.5)+(dy+.5)*(dy+.5)<=r*r)P(cx+dx,cy+dy,v);};
  const sh=SHELLS[t.c]||SHELLS[0],st=STRIPES[t.s]||STRIPES[0],lab=sh.lab;
  /* a microcassette, like an MC-60: a thin plastic shell, the label over almost all of it, two hub holes close together with a tiny window between */
  RB(0,0,CW,CH2,INK,2);RB(1,1,CW-2,CH2-2,sh.sh,2);
  R(3,1,CW-6,1,sh.hi);R(1,3,1,CH2-6,sh.hi);R(3,CH2-2,CW-6,1,sh.sd);R(CW-2,3,1,CH2-6,sh.sd);   /* lit top and left, shadowed bottom and right */
  R(21,1,4,2,INK);R(22,1,2,1,sh.sd);                                                         /* the notch on top */
  RB(3,3,CW-6,21,INK,1);RB(4,4,CW-8,19,lab,1);                                               /* the label */
  R(4,13,CW-8,1,st[0]);R(4,15,CW-8,1,st[1]);R(4,17,CW-8,1,st[2]);                             /* the style's colour stripes, right across */
              
  RB(4,19,CW-8,4,sh.band,1);                                                                  /* the dark band along the foot of the label */
  const pr=Math.max(0,Math.min(1,t._prog||0));
  const hub=(cx,pack)=>{disk(cx,15,4.3,INK);disk(cx,15,3.6,'#6b4630');disk(cx,15,pack,'#8a5a3c');disk(cx,15,2.1,'#f1e7cf');
    P(cx,15,INK);P(cx-1,15,INK);P(cx,14,INK);P(cx-1,14,INK);
    const k=[[-2,-2],[1,-2],[1,1],[-2,1]][phase%4];P(cx+k[0],15+k[1],'#c9b99a');};                /* hub teeth: a spoke steps round */
  hub(16,3.4-pr*1.0);hub(30,2.4+pr*1.0);
  R(21,14,4,5,INK);R(22,15,2,3,'#3a3140');R(22,17,2,1,'#6b4630');                           /* the little window between */
  R(5,24,CW-10,1,sh.sd);for(const x of [8,37])R(x,25,2,2,INK);R(19,25,8,2,INK);R(20,25,6,1,'#6b4630'); /* the foot: holes and the tape at the head */
  for(const [x,y] of [[3,CH2-4],[CW-4,CH2-4]])P(x,y,INK);                                     /* screws */
  return {cells,sh};}
/* what's printed on the label, shared by the cassette on screen and the picture card */
const labelText=t=>{const sh=SHELLS[t.c]||SHELLS[0],nm=t.n.toUpperCase();return [
  [5.2,6.1,1.25,'NO. '+tapeNo(t)+' · '+((window.SBN&&window.SBN.STOPS[t.s])||''),'#8a7a6c'] /* the stop it was made at: a ticket stub from the night */,[5.2,9.4,titleSize(nm),nm,sh.ink],
  [5.4,21.9,1.3,startOf(t.s).name+' · '+bpmOf(t),sh.lab],[32,21.9,1.3,'SB MC-'+bpmOf(t),sh.lab]];};
/* the buddy stamp: on the label's right, a little crooked; the tilt comes from the tape's number, never dead straight */
const STAMP={x:36.5,y:7.2,size:5.8};
const stampTilt=t=>{const r=((t&&t.r)>>>0)%23;return r-13+(r>=13?4:0);};
const escX=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const titleSize=n=>Math.min(2.3,27/(Math.max(1,n.length)*1.02));
function cassSVG(t,phase,noName){const {cells,sh}=cassPix(t,phase);let o='';
  for(let y=0;y<CH2;y++){let x=0;while(x<CW){const v=cells[y*CW+x];if(!v){x++;continue;}let w=1;while(x+w<CW&&cells[y*CW+x+w]===v)w++;o+=`<rect x="${x}" y="${y}" width="${w+.02}" height="1.02" fill="${v}"/>`;x+=w;}}
  if(noName)return `<svg viewBox="0 0 ${CW} ${CH2}" aria-hidden="true"><g shape-rendering="crispEdges">${o}</g></svg>`;
  const tx=(x,y,sz,v,fill)=>`<text x="${x}" y="${y}" font-family="Silk,monospace" font-size="${sz}" fill="${fill||sh.ink}">${v}</text>`;
  const b=BUD.list[BUD.norm(t.t)],k=STAMP.size/Math.max(b.w,b.h);
  const deco=labelText(t).map(([x,y,sz,v,f])=>tx(x,y,sz,escX(v),f)).join('')+`<rect x="40" y="3.6" width="2.6" height="2.8" fill="${sh.ink}"/>`+tx(40.45,5.95,2,t._side||'A',sh.lab)
    +`<g transform="translate(${STAMP.x} ${STAMP.y}) rotate(${stampTilt(t)}) scale(${k.toFixed(4)}) translate(${-b.w/2} ${-b.h/2})" opacity=".88">${BUD.svg(b,sh.ink)}</g>`;
  return `<svg viewBox="0 0 ${CW} ${CH2}" aria-hidden="true"><g shape-rendering="crispEdges">${o}</g>${deco}</svg>`;}
function cassette(t){const el=document.createElement('div');el.className='cass';el.innerHTML='<div class="cass-svg"></div>';fillCass(el,t);return el;}
function fillCass(el,t){el._t=t;el.querySelector('.cass-svg').innerHTML=cassSVG(t,el._ph||0);
  el.setAttribute('role','img');el.setAttribute('aria-label','Cassette: '+t.n+', with '+BUD.list[BUD.norm(t.t)].name.toLowerCase()+' on the label'+(t.by?', mixed by '+t.by:''));}
let reelN=0;setInterval(()=>{const fast=performance.now()/1000<fastReels;if(!fast&&(++reelN)%4)return;document.querySelectorAll(fast?'.door-win .cass':'.cass.playing').forEach(el=>{if(!el._t)return;el._ph=((el._ph||0)+1)%4;el.querySelector('.cass-svg').innerHTML=cassSVG(el._t,el._ph);});},42); /* the reels step round (fast during NEW) */
/* a buddy as a little canvas (for the picker and the shelf) */
function budCanvas(id,px,col){const b=BUD.list[BUD.norm(id)],c=document.createElement('canvas');c.width=b.w*px;c.height=b.h*px;const x=c.getContext('2d');x.fillStyle=col;BUD.draw(x,b,0,0,px);c.setAttribute('aria-hidden','true');return c;}

/* ---------- build the machine ---------- */
const deckCass=cassette(cur);$('cassWrap').appendChild(deckCass);
$('cassWrap').title='Tap to eject: label it and send it';
$('cassWrap').addEventListener('click',()=>$('sendBtn').click()); /* the tape door ejects, just like EJECT */

const startBtns=STARTS.map(st=>{const b=document.createElement('button');b.type='button';b.className='pb key';b.textContent=st.name;b.style.setProperty('--on',st.c);
  b.addEventListener('click',()=>{
    if(cur.s===st.s){SFX.genre(st.s);[1,1.26,1.5,2].forEach((m,i)=>blip(523*m*(1+st.s*.06),.07,{at:.1+i*.06}));jumpAll(6,false,true);say(st.name+' ✦');return;} /* already on: a little flourish, a wave down the line */
    track('genre_select',{sound:st.name},true);SFX.genre(st.s);edit(t=>{const w=t.w;t.s=st.s;Object.assign(t,st.rec);t.w=w;autoName(t);}); /* a new style keeps your weather (TEXTURE) */if(actx)tuneAt=actx.currentTime;jumpAll(6);
    if(st.s===2)react('lie',3.2);else if(st.s===3)react('glitch',.9);});$('mkeys').appendChild(b);return {b,st};});

const dialBtns=DIALS.map(D=>{const b=document.createElement('button');b.type='button';b.className='dial';
  b.innerHTML='<span class="dial-top"><span class="dial-name">'+D.name+'</span><span class="dial-leds">'+D.opts.map(()=>'<i></i>').join('')+'</span></span><span class="dial-val"></span>';
  b.addEventListener('click',()=>turnDial(D,b));$('dials').appendChild(b);return {D,b};});
const dialVal=D=>D.ui?D.opts.reduce((best,o)=>Math.abs(o[0]-S.vol)<Math.abs(best[0]-S.vol)?o:best,D.opts[0])[0]:cur[D.k];
const dialLabel=(D,v)=>{const o=D.opts.find(x=>x[0]===v)||D.opts[0];return cur.s===5&&TRANCE_LABELS[D.k]&&TRANCE_LABELS[D.k][v]||o[1];};
function turnDial(D,b){const i=D.opts.findIndex(o=>o[0]===dialVal(D)),prev=D.opts[Math.max(0,i)][0],nx=D.opts[(i+1)%D.opts.length][0];
  b.classList.remove('turn');void b.offsetWidth;b.classList.add('turn');
  if(!D.ui&&'dbk'.includes(D.k))SFX.part(nx>0);else SFX.tick();
  if(D.k==='b'&&nx>prev)react('shake',1.4);if(D.k==='d'&&nx===0)react('confused',1.8);if(D.ui)jumpAll(5);
  if(D.ui){S.vol=nx;save();if(master)master.gain.setTargetAtTime(nx,actx.currentTime,.05);paint();}
  else{track('part_toggle',{part:D.name.toLowerCase(),value:dialLabel(D,nx).toLowerCase()},true);edit(t=>{t[D.k]=nx;});}
  say(D.name+' · '+dialLabel(D,nx));}
/* the screen says what just changed, for a moment, then goes back to the tape's name */
let sayT=null,sayQ=[];function say(txt,ms){const el=$('vfdName');sayQ=[];el.textContent=txt;el.classList.add('flash');clearTimeout(sayT);sayT=setTimeout(()=>{el.classList.remove('flash');el.textContent=cur.n;},ms||1300);}
/* a little machine ceremony: a few lines on the screen, one after another, then the tape's name. Quick, never in the way */
function ceremony(lines){if(calm){say(lines[lines.length-1]);return;}const el=$('vfdName');clearTimeout(sayT);sayQ=lines.slice();
  const step=()=>{if(!sayQ.length){el.classList.remove('flash');el.textContent=cur.n;return;}el.textContent=sayQ.shift();el.classList.add('flash');sayT=setTimeout(step,420);};step();}
const insertTape=t=>ceremony(['INSERTING TAPE '+tapeNo(t)+'...',BUD.list[BUD.norm(t.t)].name+' ONLINE','SIDE '+(t._side||'A')+' READY']);

/* ---------- every press gets a little sound, and the buddies react ---------- */
/* blip: a tiny square-wave beep through the machine's own output. Never wakes a paused tape (that would start the music) */
function blip(f,dur,o){o=o||{};let a=actx;if(!a){a=ensureAudio();}if(a.state!=='running')return;const t=a.currentTime+(o.at||0),os=a.createOscillator(),g=a.createGain(),lp=a.createBiquadFilter();
  os.type=o.type||'square';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+dur);lp.type='lowpass';lp.frequency.value=o.lp||3200;
  const v=(o.v||.045);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);os.connect(lp).connect(g).connect(master);os.start(t);os.stop(t+dur+.03);}
const SFX={
  tick:()=>blip(1400,.025,{type:'triangle',v:.05}),
  genre:i=>{const n=[523,587,659,784,880,988][i%6];blip(n,.06);blip(n*1.5,.09,{at:.06});},
  part:on=>on?(blip(660,.05),blip(990,.07,{at:.05})):blip(440,.06,{to:330}),
  newt:()=>{[523,659,784,1047].forEach((f,i)=>blip(f,.06,{at:i*.045}));},
  undo:()=>blip(700,.08,{to:420}),
  save:()=>{blip(110,.14,{type:'sine',v:.12,lp:800});blip(1800,.02,{type:'triangle',at:.02});blip(1568,.12,{at:.16});},
  eject:()=>{blip(1200,.03,{type:'triangle'});blip(784,.08,{at:.05});blip(523,.12,{at:.12});},
  loop:()=>blip(988,.07),
  ding:()=>{blip(659,.32,{type:'sine',v:.08});blip(523,.5,{type:'sine',v:.08,at:.34});}, /* the doors are closing */
  boot:()=>{blip(784,.07,{v:.06});blip(1568,.6,{v:.06,at:.08});},
  smack:()=>smack()};
/* smack: a sticker slapped on the label. A short burst of filtered noise (the slap) over a low thump (the hand on the case) */
let smackBuf=null;function smack(){const a=actx||ensureAudio();if(a.state!=='running')return;const t=a.currentTime+.005;
  if(!smackBuf){smackBuf=a.createBuffer(1,Math.round(a.sampleRate*.12),a.sampleRate);const d=smackBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);}
  const n=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain();n.buffer=smackBuf;bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.7;
  g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);n.connect(bp).connect(g).connect(master);n.start(t);
  const o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(55,t+.09);
  og.gain.setValueAtTime(.32,t);og.gain.exponentialRampToValueAtTime(.001,t+.11);o.connect(og).connect(master);o.start(t);o.stop(t+.13);}
/* the band reacts: a jump for everyone, or just the host; and a happy face for a moment */
let joyUntil=0;const pnow=()=>performance.now()/1000;
function jumpAll(h,onlyHost,wave){const t=pnow(),ord=[...WALK.entries()].sort((a,b)=>a[1].x-b[1].x);ord.forEach(([id,w],i)=>{if(onlyHost&&id!==BUD.norm(cur.t))return;w.jumpAt=t+(wave?i*.09:0);w.jumpH=h*excite();});}
const cheer=()=>{joyUntil=pnow()+1.6;jumpAll(5);};
/* ---------- the machine answers every touch ---------- */
let lastInput=pnow(),REACT=null,freezeUntil=0,fastReels=0,landAt=-1,flowBar=false;const HITS=[];
const buzz=ms=>{try{if(navigator.vibrate)navigator.vibrate(ms||8);}catch(e){}}; /* a tiny rumble, on phones that allow it */
const react=(k,dur)=>{if(!calm)REACT={k,t0:pnow(),dur:dur||1.4};};
const attract=()=>!booted&&!BC&&!isPlaying()&&!isPaused()&&pnow()-lastInput>2.5; /* nobody's pressed PLAY yet: the machine waves at you */
const excite=()=>S.vol>=.95?1.4:S.vol<=.5?.7:1; /* VOLUME: how excited everyone gets */
for(const k of Object.keys(SFX))if(k!=='boot'){const f=SFX[k];SFX[k]=(...a)=>{buzz(k==='save'?[10,40,16]:8);lastInput=pnow();return f(...a);};}
/* NEW is the "?" block: the step lights race, the reels spin, everyone freezes, and the new tune lands on beat 1 */
function chase(){if(calm)return;let i=0;const iv=setInterval(()=>{leds.forEach((l,k)=>l.classList.toggle('chase',k===i||k===i-1||k===i-2));if(++i>18){clearInterval(iv);leds.forEach(l=>l.classList.remove('chase'));}},20);}
/* ---------- editing: everything goes through here ---------- */
/* the name rolls with the music (a new sound or a new tune gets a new name) until you write your own */
function autoName(t){if(S.named)return;let n;do n=pick(NAMES);while(n===t.n);t.n=n;flashName();}
function flashName(){const el=$('tapeName');el.classList.remove('rolled');void el.offsetWidth;el.classList.add('rolled');}
const HIST=[];const HMAX=40; /* UNDO: what the draft was before each change */
function edit(fn){
  PL=null;
  if(cur!==draft){ /* a shelf tape or a shared one: changing it makes a remix */
    S.named=true; /* a remix keeps its name unless you change it */const from=cur.by&&cur.by!==cleanBy(S.by)?cur.by:cur.from;draft=cleanTape(Object.assign({},cur,{id:undefined,by:undefined,from,fav:undefined,gift:undefined}));delete draft.id;cur=draft;track('tape_remix');}
  const before=JSON.stringify(draft),prev=JSON.parse(before);fn(draft);draft=cleanTape(draft);cur=draft;
  if(JSON.stringify(draft)===before)return paint();
  if(prev.n===draft.n)HIST.push(before);if(HIST.length>HMAX)HIST.shift(); /* typing a name isn't undone a letter at a time */
  savedId=(S.tapes.find(t=>sameTape(t,draft))||{}).id||null;save();paint();
  if(sameMusic(prev,draft))return; /* a name, a buddy or a shell: the music carries on as it is */
  if(!isPlaying())play(cur);else restart();}
function undo(){if(!HIST.length)return;draft=cleanTape(JSON.parse(HIST.pop()));delete draft.id;cur=draft;savedId=(S.tapes.find(t=>sameTape(t,draft))||{}).id||null;save();paint();say('UNDO');track('undo',{},true);
  if(isPlaying())restart();}
function pickBuddy(id){if(cur.t===id&&cur===draft)return;edit(t=>{t.t=id;});track('buddy_select',{buddy:id},true);
  SFX.smack();buzz(18);const c=$('sheetCass')&&$('sheetCass').querySelector('.cass');if(c){c.classList.remove('slap');void c.offsetWidth;c.classList.add('slap');}} /* the sticker goes on: smack */
function pulse(){deckCass.classList.remove('pop');void deckCass.offsetWidth;deckCass.classList.add('pop');}

/* ---------- painting ---------- */
function paint(){
  fillCass(deckCass,cur);if(sheetCass)fillCass(sheetCass,cur);
  for(const {b,st} of startBtns)b.setAttribute('aria-pressed',String(cur.s===st.s));
  for(const {D,b} of dialBtns){const v=dialVal(D),i=D.opts.findIndex(o=>o[0]===v);b.querySelector('.dial-val').textContent=dialLabel(D,v);
    b.querySelectorAll('.dial-leds i').forEach((l,k)=>l.classList.toggle('on',k===i));b.classList.toggle('off',!D.ui&&v===0&&D.k!=='p');
    b.setAttribute('aria-label',D.name.toLowerCase()+': '+dialLabel(D,v).toLowerCase()+'. Tap to change.');}
  shellBtns.forEach((b,i)=>b.setAttribute('aria-pressed',String(cur.c===i)));$('shellName').textContent=(SHELLS[cur.c]||SHELLS[0]).name;
  budBtns.forEach((b,i)=>b.setAttribute('aria-pressed',String(BUD.norm(cur.t)===i)));$('budName').textContent=BUD.list[BUD.norm(cur.t)].name;
  if(document.activeElement!==$('tapeName'))$('tapeName').value=cur.n;
  if(document.activeElement!==$('fromName'))$('fromName').value=S.by||'';
  if(!$('vfdName').classList.contains('flash'))$('vfdName').textContent=cur.n;
  $('vfdSide').textContent=window.SBN.DISTRICTS[cur.s]+(PL?' · '+(PL.i+1)+'/'+PL.ids.length:'');paintRouteHud();paintVfd(cur.s);
  const onShelf=cur===draft?!!savedId:S.tapes.some(t=>t.id===cur.id);
  $('recBtn').setAttribute('aria-pressed',String(onShelf));$('recT').textContent=onShelf?'SAVED':'SAVE TAPE';
  $('recBtn').setAttribute('aria-label',onShelf?'Saved on your shelf':'Save this tape to your shelf');
  $('undoTune').disabled=!HIST.length;paintLoop();
  paintShelf();paintPlay();if(BC)paintCredits();}
function paintPlay(){const on=isPlaying();$('play').setAttribute('aria-pressed',String(on));$('playT').textContent=on?'PAUSE':'PLAY';
  deckCass.classList.toggle('playing',on);if(sheetCass)sheetCass.classList.toggle('playing',on);
  const playingId=on&&gen&&gen.tape&&cur===gen.tape?gen.tape.id:null;
  document.querySelectorAll('.shelf-item').forEach(el=>{const p=!!playingId&&playingId===el.dataset.id;el.querySelector('.cass').classList.toggle('playing',p);const b=el.querySelector('.sh-play');if(b)b.textContent=p?'❚❚ PAUSE':'▶ PLAY';});
  document.querySelectorAll('.rack-item').forEach(el=>{const p=!!playingId&&playingId===el.dataset.id;el.classList.toggle('playing',p);el.classList.toggle('open',el.dataset.id===openId);});
  $('playAll').textContent=PL&&on?'❚❚ PAUSE THE SHELF':'▶ PLAY THE SHELF';
  if(sharedCass){const p=on&&cur===shared;sharedCass.classList.toggle('playing',p);$('sharedPlay').textContent=p?'❚❚ PAUSE':'▶ PLAY';}}

/* ---------- play, new tune, undo ---------- */
let booted=false,bootAt=-9;
/* NIGHT n: every day you come back is another night on the road with the crew */
/* the night's number is the same for everyone (night.js counts from launch day) but never shown: it only picks tonight's request and tapes, so every night (and every video) stands on its own. A broadcast names its night with &night= */
const BC_NIGHT=BC?Math.max(0,Math.round(+Q.get('night')||0)):0;
function nightNo(){return BC_NIGHT||window.SBN.night();}
/* ---------- TONIGHT'S ROUTE: the show ran late, the last train didn't. Six stops between the crew and home ----------
   Each stop is a district with its own station and its own little situation; the way through is a tape that answers it.
   Save that tape and the crew rides on: the subway, a service change, the next stop. The route is the same for everyone
   tonight (night.js), and your progress through it is kept on this browser for the night */
var RT={n:0,stops:[],k:0};
function routeLoad(){const n=nightNo();RT.n=n;RT.stops=window.SBN.route(n);if(BC){RT.k=0;return;}const r=S.route&&S.route.n===n?S.route:{n,k:0};S.route=r;RT.k=Math.min(6,r.k|0);}
function routeStop(){if(BC)return BC_NIGHT&&window.SB_BQ&&window.SB_BQ.tapes.length===6?RT.stops[window.SB_BQ.i]:null;return RT.k<6?RT.stops[RT.k]:null;}
function friendJoined(){if(BC)return !!(BC_NIGHT&&window.SB_BQ&&window.SB_BQ.tapes.length===6&&window.SB_BQ.i>=window.SBN.JOIN);return storyOn&&RT.k>=window.SBN.JOIN;}
function routeStep(){return BC?(window.SB_BQ?window.SB_BQ.i:0):RT.k;}
/* STOP 2/6 and six little route marks in the screen's top line (style and tempo when there's no route, as in plain broadcasts) */
/* the route sign: pixel art, no letters in the markers (each district has its own little icon) */
const SIGN_ICONS=[['.###.','#####','#####','.#.#.','#...#'],['..#..','.###.','.###.','#####','#####'],['.###.','#####','#####','..#..','..#..'],
  ['.##..','.##..','..#..','#####','#####'],['..#..','#####','..#..','#.#.#','.###.'],['#####','##.##','#...#','#...#','#...#']],SIGN_HOME=['..#..','.###.','#####','.#.#.','.###.'];
let signT=0;
function paintSign(){const c=$('routeSign');if(!c||!c.offsetWidth)return;if(!RT.stops.length)routeLoad();const d=devicePixelRatio||1,W=Math.round(c.offsetWidth*d),H=Math.round(c.offsetHeight*d);
  if(c.width!==W||c.height!==H){c.width=W;c.height=H;}const x=c.getContext('2d'),C=window.SBN.COLORS,p=Math.max(1,Math.floor(H/11)); /* one sign pixel */
  x.clearRect(0,0,W,H);x.imageSmoothingEnabled=false;
  const ep=BC&&BC_NIGHT&&window.SB_BQ&&window.SB_BQ.tapes.length===6,route=!BC||ep,k=routeStep(),done=!BC&&RT.k>=6,st=route?(done?null:RT.stops[Math.min(5,k)]):null;
  /* the line: right-aligned; marker = a 9 x 9 pixel circle */
  const R=11,gap=3,nM=route?7:0,lineW=nM?nM*R*p+(nM-1)*gap*p:0,x0=W-lineW,y0=Math.round((H-R*p)/2);
  const circ=(cx,cy,fill,ring,icon,ic)=>{for(let j=0;j<R;j++)for(let i=0;i<R;i++){const dx=i-5,dy=j-5,dd=dx*dx+dy*dy;if(dd>30)continue;x.fillStyle=dd>18?ring:fill;x.fillRect(cx+i*p,cy+j*p,p,p);}
    if(icon){x.fillStyle=ic;icon.forEach((r,j)=>[...r].forEach((v,i)=>{if(v==='#')x.fillRect(cx+(3+i)*p,cy+(3+j)*p,p,p);}));}};
  if(route){const blink=Math.floor(pnow()*2)%2===0;
    for(let i=0;i<6;i++){x.fillStyle=C[RT.stops[i].s];x.globalAlpha=i<k||done?1:.35;x.fillRect(x0+i*(R+gap)*p+R*p-p,y0+4*p,(gap+2)*p,p*3);}x.globalAlpha=1;
    RT.stops.forEach((s2,i)=>{const cx=x0+i*(R+gap)*p,col=C[s2.s],past=i<k||done,now=i===k&&!done;
      if(past)circ(cx,y0,col,col,SIGN_ICONS[s2.s],'#141216');else if(now)circ(cx,y0,blink?'#efe6d2':col,'#efe6d2',SIGN_ICONS[s2.s],blink?col:'#141216');else{x.globalAlpha=.45;circ(cx,y0,'#141216',col,SIGN_ICONS[s2.s],col);x.globalAlpha=1;}});
    circ(x0+6*(R+gap)*p,y0,done?'#efe6d2':'#141216','#efe6d2',SIGN_HOME,done?'#141216':'#efe6d2');}
  /* the words: the stop number small, the station big */
  const big=Math.round(H*.6),small=Math.round(H*.34),tx=0,maxw=x0-p*8;x.textBaseline='alphabetic';x.fillStyle='#efe6d2';
  const here=st&&(BC||cur.s===st.s),label=done?'HOME BY MORNING':st?(here?'':'NEXT: ')+st.stop:window.SBN.STOPS[cur.s],sub=done?'NEW ROUTE TOMORROW':st?(here?'STOP '+(k+1)+' OF 6 · '+st.district:'STOP '+(k+1)+' · MAKE IT '+st.style):window.SBN.DISTRICTS[cur.s];
  let fs=big;x.font='400 '+fs+'px Silk';while(x.measureText(label).width>maxw&&fs>small){fs--;x.font='400 '+fs+'px Silk';}
  const sw=(x.font='400 '+small+'px Silk',x.measureText(sub).width);
  if(W>520*d||!route){x.font='400 '+fs+'px Silk';x.fillText(label,tx,Math.round(H*.78));const lw=x.measureText(label).width;if(lw+sw+p*14<maxw){x.font='400 '+small+'px Silk';x.fillStyle='#a39a8b';x.fillText(sub,tx+lw+p*7,Math.round(H*.74));}}
  else{x.font='400 '+fs+'px Silk';x.fillText(label,tx,Math.round(H*.8));}}
function paintRouteHud(){const el=$('vfdStyle');if(!el)return;if(!RT.stops.length)routeLoad();
  if(BC&&!(BC_NIGHT&&window.SB_BQ&&window.SB_BQ.tapes.length===6)){el.textContent=startOf(cur.s).name+' · '+bpmOf(cur)+' BPM';return;}
  el.textContent=startOf(cur.s).name+' · '+bpmOf(cur)+' BPM';paintSign();}
/* the stop's card: where, the station, the situation, the ask (and which style takes you there) */
function stopLines(st,i){return ['STOP '+(i+1)+' · '+st.district,st.set,'NEEDS: '+st.ask+(BC?'':' · '+st.style)];}
/* a queue of message cards on the screen, one after another */
var CQ=[];function card(lines,dur){CQ.push({lines:lines.filter(l=>l!==''),dur:dur||3.6,t0:0});}
/* the scenes between the stops: the platform, a ride, the last train home. While one runs it's drawn instead of the city */
var SCN={mode:null};function scene(mode,dur,then){SCN={mode,t0:pnow(),dur,then,ding:false};}
/* the night begins: the platform, the doors close, the train leaves without them; then the first stop */
var storyOn=false;
function startStory(){if(storyOn)return;storyOn=true;routeLoad();paintRouteHud();
  if(BC){if(!BC_NIGHT)return;scene('platform',6,()=>{card(['LAST TRAIN: MISSED','THE SHOW RAN LATE','SIX STOPS. SIX TAPES. GET THE CREW HOME.'],3.8);const st=routeStop();if(st)card(stopLines(st,0),5.5);});return;}
  if(RT.k>=6){card(['HOME BY MORNING','NEW ROUTE TOMORROW'],3.6);return;}
  if(RT.k===0){scene('platform',6,()=>{card(['LAST TRAIN: MISSED','THE SHOW RAN LATE','SIX STOPS. SIX TAPES. GET THE CREW HOME.'],3.8);card(stopLines(routeStop(),0),6);});}
  else card(stopLines(routeStop(),RT.k),6);}
/* a saved tape that answers the stop: the crew cheers, rides on, the city reroutes them, the next stop */
function routeSaved(t){if(BC||!storyOn)return;const st=routeStop();if(!st)return;
  if(!st.ok(t)){setTimeout(()=>say(t.s!==st.s?'NEXT STOP: '+st.district+' · MAKE IT '+st.style:'THE CREW NEEDS: '+st.ask,6000),2600);return;}
  RT.k++;S.route={n:RT.n,k:RT.k};save();paintRouteHud();paintTonight();jumpAll(10,false,true);track('stop_made',{stop:RT.k,district:st.district});
  if(RT.k>=6){card(['STOP 6 · DONE','THE LAST TRAIN IS COMING'],3);setTimeout(()=>scene('outro',9,()=>{card(['HOME BY MORNING','SIX STOPS. SIX TAPES.','NEW ROUTE TOMORROW'],7);jumpAll(10,false,true);S.homes=(S.homes||0)+1;save();paintTonight();track('got_home',{homes:S.homes});}),3000);return;}
  const nx=RT.stops[RT.k];card(['STOP '+RT.k+' · DONE','THE CREW MOVES ON'],2.6);if(RT.k===window.SBN.JOIN)card(['SOMEBODY NEW',window.SBN.friend(RT.n)+' TAGS ALONG'],3.4);
  setTimeout(()=>{scene('ride',7,()=>card(stopLines(nx,RT.k),6));card([st.change[0],st.change[1]],4.2);},2600);}
/* in an episode, each new tape is the next stop: a ride, the city's reroute, the stop */
function routeNextTape(i){if(!BC||!BC_NIGHT||!storyOn)return;const prev=RT.stops[(i+5)%6],st=RT.stops[i];if(!st)return;paintRouteHud();
  if(i===0){scene('outro',9,()=>{card(['HOME BY MORNING','SIX STOPS. SIX TAPES.','NEW ROUTE TOMORROW'],6);setTimeout(()=>scene('platform',6,()=>{card(['LAST TRAIN: MISSED','THE SHOW RAN LATE','SIX STOPS. SIX TAPES. GET THE CREW HOME.'],3.8);card(stopLines(st,0),5.5);}),6500);});return;} /* round again: home by morning, then the whole night from the top on a new run */
  scene('ride',7,()=>{if(i===window.SBN.JOIN)card(['SOMEBODY NEW',window.SBN.friend(RT.n)+' TAGS ALONG'],3.4);card(stopLines(st,i),5.5);});card([prev.change[0],prev.change[1]],4.2);}
/* how many times you've got the crew home: the only number that ever shows. Nothing is lost by missing a day */
/* short phones: pressing PLAY brings the whole machine, keyboard and all, onto the screen (once, and only if you haven't scrolled yourself) */
let fitDone=false;function fitMachine(){if(fitDone||BC||innerWidth>760||scrollY>40)return;fitDone=true;const r=KB.getBoundingClientRect();if(r.bottom>innerHeight-4)scrollTo({top:Math.min(scrollY+r.bottom-innerHeight+12,scrollY+$('make').getBoundingClientRect().top),behavior:'smooth'});}
$('play').addEventListener('click',()=>{fitMachine();if(isPlaying()){SFX.tick();pause();return;}if(isPaused()&&gen.tape===cur){SFX.tick();resume();return;}
  if(!booted&&!calm){booted=true;ensureAudio();if(actx.state!=='running')actx.resume();bootAt=pnow();setTimeout(SFX.boot,700);setTimeout(()=>{play(cur);jumpAll(7);},1150);return;}
  booted=true;play(cur);});
let roulT=null,roulIv=null,roulName=null,roulDone=false;
$('newTune').addEventListener('pointerdown',()=>{clearTimeout(roulT);roulT=setTimeout(()=>{roulDone=true;roulIv=setInterval(()=>{roulName=pick(NAMES);$('vfdName').textContent=roulName;blip(900+Math.random()*500,.02,{type:'triangle',v:.04});},75);},450);});
['pointerup','pointerleave','pointercancel'].forEach(ev=>$('newTune').addEventListener(ev,()=>{clearTimeout(roulT);if(roulIv){clearInterval(roulIv);roulIv=null;const n=roulName;if(n){SFX.save();edit(t=>{t.n=n;});flashName();say(n);jumpAll(6,true);}}}));
$('newTune').addEventListener('click',()=>{if(roulDone){roulDone=false;return;}SFX.newt();freezeUntil=pnow()+.45;fastReels=pnow()+.8;chase();flowBar=isPlaying();if(!flowBar&&actx)landAt=actx.currentTime+.05;edit(t=>{t.r=seed();autoName(t);});track('new_tune',{},true);say('NEW TUNE');
  const b=$('newTune');b.disabled=true;setTimeout(()=>b.disabled=false,250);});
$('undoTune').addEventListener('click',()=>{SFX.undo();undo();});

/* ---------- SAVE TAPE and EJECT (the label sheet) ---------- */
function saveTape(){
  if(cur!==draft){if(!S.tapes.some(t=>t.id===cur.id)){const k=Object.assign({},cur,{id:Math.random().toString(36).slice(2,10)});S.tapes.unshift(k);cur=k;if(shared&&shared!==k)shared=k;save();paint();track('tape_save',{how:'keep'},true);}return cur;}
  if(savedId){const t=S.tapes.find(x=>x.id===savedId);if(t)return t;}
  const t=Object.assign({},draft,{id:Math.random().toString(36).slice(2,10)});const by=cleanBy(S.by);if(by&&!t.by)t.by=by;
  S.tapes.unshift(t);S.tapes=S.tapes.slice(0,MAX_TAPES);savedId=t.id;S.named=false;save();keepStorage();paint();pulse();track('tape_save',{sound:startOf(t.s).name},true);return t;}
/* ask the browser not to clear this site's storage when space runs low (quietly: Firefox would ask the visitor, so not there) */
function keepStorage(){try{if(navigator.storage&&navigator.storage.persist&&!/Firefox/.test(navigator.userAgent))navigator.storage.persisted().then(p=>{if(!p)navigator.storage.persist();});}catch(e){}}
$('recBtn').addEventListener('click',()=>{const was=$('recBtn').getAttribute('aria-pressed')==='true';const t=saveTape();SFX.save();cheer();routeSaved(t);if(was)say('TAPE '+tapeNo(t)+' ON YOUR SHELF');else ceremony(['RECORDING...','PRINTING LABEL...','TAPE '+tapeNo(t)+' SAVED']);});
async function copyText(v){try{await navigator.clipboard.writeText(v);return true;}catch(e){}try{const ta=document.createElement('textarea');ta.value=v;ta.style.cssText='position:fixed;opacity:0;top:0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;}catch(e){return false;}}
async function copyLinkFor(t,btn){const url=tapeURL(t);const ok=await copyText(url);track('tape_share',{how:'copy'},true);
  if(btn){const was=btn.textContent;btn.textContent=ok?'COPIED':'COPY FAILED';setTimeout(()=>btn.textContent=was,1800);}return {ok,url};}
const deckTape=()=>cur===draft?S.tapes.find(x=>x.id===savedId)||cur:cur;
/* the sheet: name, mixed by, buddy, shell, and the ways to send it. The music keeps playing underneath */
let sheetCass=null;
function openSheet(){if(!sheetCass){sheetCass=cassette(cur);$('sheetCass').appendChild(sheetCass);}fillCass(sheetCass,cur);$('sheet').hidden=false;$('sendBtn').setAttribute('aria-expanded','true');paintPlay();track('sheet_open',{},true);}
function closeSheet(){$('sheet').hidden=true;$('sendBtn').setAttribute('aria-expanded','false');$('tapeQrWrap').hidden=true;$('qrBtn').setAttribute('aria-expanded','false');}
$('sendBtn').addEventListener('click',()=>{if($('sheet').hidden){SFX.eject();deckCass.classList.remove('eject');void deckCass.offsetWidth;deckCass.classList.add('eject');setTimeout(openSheet,260);say('▲ EJECT');}else closeSheet();});
$('sheetDone').addEventListener('click',closeSheet);$('sheetScrim').addEventListener('click',closeSheet);
$('sendTape').addEventListener('click',async()=>{const t=saveTape();if(navigator.share){try{await navigator.share({title:t.n+' · Small Beats',text:'I made you a Mini Tape: '+t.n,url:tapeURL(t)});track('tape_share',{how:'share'},true);return;}catch(e){if(e&&e.name==='AbortError')return;}}
  const {ok,url}=await copyLinkFor(t,null);$('sentNote').textContent=ok?'Link copied. Whoever opens it hears your tape.':'Copy this link and send it:';$('sentLink').hidden=ok;$('sentLink').value=url;if(!ok)$('sentLink').select();});
$('copyLink').addEventListener('click',async()=>{const t=saveTape(),{ok,url}=await copyLinkFor(t,$('copyLink'));
  $('sentNote').textContent=ok?'Link copied. Whoever opens it hears your tape.':'Copy this link and send it:';$('sentLink').hidden=ok;$('sentLink').value=url;if(!ok)$('sentLink').select();});
$('qrBtn').addEventListener('click',()=>{const open=$('tapeQrWrap').hidden;$('tapeQrWrap').hidden=!open;$('qrBtn').setAttribute('aria-expanded',String(open));if(open){const t=saveTape();drawQR($('tapeQr'),tapeURL(t),160,null);track('tape_share',{how:'qr'},true);}});
$('sentLink').addEventListener('focus',e=>e.target.select());
$('savePic').addEventListener('click',()=>{const t=deckTape();shareCard(t).then(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(t.n.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'tape')+'-small-beats.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);});});
$('tapeName').addEventListener('input',e=>{const v=e.target.value.toUpperCase();const pos=e.target.selectionStart;e.target.value=v;try{e.target.setSelectionRange(pos,pos);}catch(x){}
  const n=cleanName(v);if(!n)return;S.named=true;track('tape_name',{},false);edit(t=>{t.n=n;});});
$('tapeName').addEventListener('blur',()=>{if(!cleanName($('tapeName').value))$('tapeName').value=cur.n;});
$('rollName').addEventListener('click',()=>{S.named=false;edit(t=>{autoName(t);});});
$('fromName').addEventListener('input',e=>{S.by=cleanBy(e.target.value)||'';save();});
const shellBtns=SHELLS.map((L,i)=>{const b=document.createElement('button');b.type='button';b.className='shell';b.setAttribute('aria-label',L.name.toLowerCase()+' cassette');b.title=L.name;
  b.innerHTML=cassSVG({n:'',c:i,r:1,t:0,s:1},0,true);b.addEventListener('click',()=>edit(t=>{t.c=i;}));$('shellRow').appendChild(b);return b;});
const budBtns=BUD.list.map((B,i)=>{const b=document.createElement('button');b.type='button';b.className='bud';b.setAttribute('aria-label','buddy '+B.name.toLowerCase());b.title=B.name;
  b.appendChild(budCanvas(i,Math.max(2,Math.floor(40/Math.max(B.w,B.h))),INKC));const nm=document.createElement('span');nm.textContent=B.name;b.appendChild(nm);b.addEventListener('click',()=>pickBuddy(i));$('buddyGrid').appendChild(b);return b;});

/* ---------- the shelf ----------
   Up front: your three newest tapes (starred ones first) as full cassettes. Behind them, the rack: the rest of yours as spines.
   Then SMALL MAIL: tapes people sent you. Tap a spine to play it and pull it out; tap again to pause. */
const favFirst=a=>a.filter(t=>t.fav).concat(a.filter(t=>!t.fav));
const mine=()=>favFirst(S.tapes.filter(t=>!t.gift)),friends=()=>favFirst(S.tapes.filter(t=>t.gift));
let openId=null;
const findTape=id=>S.tapes.find(x=>x.id===id);
function playShelfTape(id){const tt=findTape(id);if(!tt)return;openId=id;if(isPlaying()&&cur===tt){pause();return;}cur=tt;paint();insertTape(tt);if(isPaused()&&gen.tape===tt)resume();else play(tt);}
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
/* a cassette seen from the side, as it sits in a rack: the shell, a label with the name, the buddy on the end */
function spine(t,still){const sh=SHELLS[t.c]||SHELLS[0],el=document.createElement(still?'div':'button');if(!still)el.type='button';el.className='spine';
  el.style.cssText=`--sh:${sh.sh};--hi:${sh.hi};--lab:${sh.lab};--ink:${sh.ink};--acc:#8a5a3c`;
  const cols=STRIPES[t.s]||STRIPES[0];
  el.innerHTML=`<span class="spine-state" aria-hidden="true"></span><span class="spine-lab"><span class="spine-art" aria-hidden="true">${cols.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span class="spine-name">${escX(t.n)}</span>${t.gift?`<span class="spine-from">${escX(t.by?'from '+t.by:'from a friend')}</span>`:''}</span>`;
  el.appendChild(budCanvas(t.t,2,'#1d1c21'));if(!still)el.setAttribute('aria-label',(t.gift?'From '+(t.by||'a friend')+': ':'')+t.n+', play');return el;}
function rackItem(t){const it=document.createElement('div');it.className='rack-item';it.dataset.id=t.id;
  const sp=spine(t);sp.addEventListener('click',()=>playShelfTape(t.id));it.appendChild(sp);it.appendChild(starBtn(t));
  const acts=document.createElement('div');acts.className='spine-acts row-btns';
  acts.appendChild(btn('REMIX','var(--amber)',()=>remixTape(t.id),'pb-sm'));
  const cp=btn('COPY LINK','var(--blue)',()=>{const tt=findTape(t.id);if(tt)copyLinkFor(tt,cp);},'pb-sm');acts.appendChild(cp);acts.appendChild(delBtn(t));
  it.appendChild(acts);return it;}
function paintShelf(){if(BC)return;paintTonight();const row=$('shelf');const sig=S.tapes.map(t=>t.id+(t.fav?'*':'')+(t.gift?'g':'')).join(',');
  $('tapes').hidden=!S.tapes.length;$('navTapes').hidden=!S.tapes.length;$('navCount').textContent=S.tapes.length;
  if(row.dataset.sig===sig){row.querySelectorAll('.shelf-item').forEach(el=>{const t=findTape(el.dataset.id);if(t)fillCass(el.querySelector('.cass'),t);});return;}
  row.dataset.sig=sig;row.textContent='';$('rack').textContent='';$('friends').textContent='';
  const m=mine(),front=m.slice(0,3),f=friends();
  for(const t of front){const it=document.createElement('div');it.className='shelf-item';it.dataset.id=t.id;it.appendChild(cassette(t));
    const bs=document.createElement('div');bs.className='row-btns';
    bs.appendChild(btn('▶ PLAY','var(--green)',()=>playShelfTape(t.id),'sh-play'));bs.appendChild(btn('REMIX','var(--amber)',()=>remixTape(t.id)));
    const cp=btn('COPY LINK','var(--blue)',()=>{const tt=findTape(t.id);if(tt)copyLinkFor(tt,cp);});bs.appendChild(cp);bs.appendChild(delBtn(t));
    const sb=starBtn(t);sb.classList.add('star-badge');it.appendChild(sb);
    it.appendChild(bs);row.appendChild(it);}
  for(const t of m.slice(3))$('rack').appendChild(rackItem(t));
  for(const t of f)$('friends').appendChild(rackItem(t));
  $('rackEmpty').hidden=m.length>3;$('friendsEmpty').hidden=f.length>0;
  paintPlay();}

/* play the shelf: yours (starred first), then your friends', a few minutes each, round and round */
function nextOnShelf(){if(!PL||!PL.ids.length){PL=null;return;}PL.i=(PL.i+1)%PL.ids.length;const t=findTape(PL.ids[PL.i]);if(!t){PL.ids.splice(PL.i,1);PL.i--;return nextOnShelf();}
  cur=t;openId=t.id;start(t,2.5);PL.until=actx.currentTime+PL_SEC;paint();}
$('playAll').addEventListener('click',()=>{if(PL){if(isPlaying())pause();else if(isPaused())resume();return;}
  const ids=mine().concat(friends()).map(t=>t.id);if(!ids.length)return;ensureAudio();PL={ids,i:-1,until:0};nextOnShelf();track('play_all',{tapes:ids.length},true);$('make').scrollIntoView({behavior:'smooth'});});

/* ---------- the shelf link: every tape in one link, so a shelf can move browsers without an account ----------
   ?shelf= + "z" and base64url of the deflated JSON [1, [[name, shell, drums, bass, keys, texture, speed, sound, seed, buddy, by, from, flags, notes], ...]]
   (flags: 1 starred, 2 from a friend). Browsers that can't deflate use "j" and plain JSON. */
const b64u=bytes=>{let b='';for(let i=0;i<bytes.length;i+=8192)b+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const unb64u=v=>{const b=atob(String(v).replace(/-/g,'+').replace(/_/g,'/'));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
async function shelfCode(tapes){const json=JSON.stringify([1,tapes.map(t=>[t.n,t.c,t.d,t.b,t.k,t.w,t.p,t.s,t.r,t.t,t.by||'',t.from||'',(t.fav?1:0)|(t.gift?2:0),t.m||''])]);
  if(window.CompressionStream){try{const st=new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));return 'z'+b64u(new Uint8Array(await new Response(st).arrayBuffer()));}catch(e){}}
  return 'j'+b64u(new TextEncoder().encode(json));}
async function decodeShelf(code){try{code=String(code);let json;
    if(code[0]==='z'){const st=new Blob([unb64u(code.slice(1))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));json=await new Response(st).text();}
    else if(code[0]==='j')json=new TextDecoder().decode(unb64u(code.slice(1)));else return null;
    const a=JSON.parse(json);if(!Array.isArray(a)||a[0]!==1||!Array.isArray(a[1]))return null;
    return a[1].slice(0,MAX_TAPES).map(x=>Array.isArray(x)?cleanTape({n:x[0],c:x[1],d:x[2],b:x[3],k:x[4],w:x[5],p:x[6],s:x[7],r:x[8],t:x[9],by:x[10],from:x[11],fav:x[12]&1,gift:x[12]&2,m:x[13]||undefined}):null).filter(Boolean);
  }catch(e){return null;}}
let qrLoad=null;const loadQR=()=>qrLoad||(qrLoad=new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='qr.js';sc.onload=ok;sc.onerror=no;document.head.appendChild(sc);}));
function drawQR(cv,url,size,hint){const x=cv.getContext('2d');loadQR().then(()=>{let q;try{q=qrcode(0,'L');q.addData(url);q.make();}catch(e){cv.hidden=true;if(hint)hint.textContent='Too many tapes for one QR code. Use the link instead.';return;}
  const n=q.getModuleCount(),u=Math.max(2,Math.floor(size/(n+8))),S2=(n+8)*u;cv.width=cv.height=S2;cv.hidden=false;x.fillStyle='#f2e7d0';x.fillRect(0,0,S2,S2);x.fillStyle='#1d1c21';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))x.fillRect((c+4)*u,(r+4)*u,u,u);
  if(hint)hint.textContent="Point your phone's camera here to take your tapes with you.";}).catch(()=>{cv.hidden=true;});}
async function refreshShelfLink(){const url=siteURL()+'?shelf='+await shelfCode(S.tapes);$('shelfLink').value=url;drawQR($('qr'),url,232,$('qrHint'));return url;}
$('shelfLinkBtn').addEventListener('click',async()=>{const open=$('backup').hidden;$('backup').hidden=!open;$('shelfLinkBtn').setAttribute('aria-expanded',String(open));
  if(open){$('shelfNote').textContent='';await refreshShelfLink();track('shelf_link',{tapes:S.tapes.length},true);}});
$('copyShelf').addEventListener('click',async()=>{const url=await refreshShelfLink();const ok=await copyText(url);
  $('shelfNote').textContent=ok?'Copied. Paste it somewhere safe, like a note to yourself.':'Copy the link above and keep it somewhere safe.';if(!ok)$('shelfLink').select();});
$('shelfLink').addEventListener('focus',e=>e.target.select());
/* opening a shelf link: show what's in it, and add it on a tap */
{const code=Q.get('shelf');if(code&&!BC)decodeShelf(code).then(list=>{if(!list||!list.length)return;
  $('shelfIn').hidden=false;$('shelfInKick').textContent=list.length===1?'SOMEBODY SENT YOU A TAPE':'SOMEBODY SENT YOU '+list.length+' TAPES';
  for(const t of list.slice(0,6))$('shelfInRack').appendChild(spine(t,true));$('shelfInMore').textContent=list.length>6?'and '+(list.length-6)+' more':'';
  $('shelfInAdd').addEventListener('click',()=>{for(const t of list){const x=S.tapes.find(y=>sameTape(y,t));if(x&&t.fav)x.fav=1;}
    const fresh=list.filter(t=>!S.tapes.some(x=>sameTape(x,t)));
    const added=fresh.map(t=>Object.assign({},t,{id:Math.random().toString(36).slice(2,10)}));S.tapes=added.concat(S.tapes).slice(0,MAX_TAPES);save();keepStorage();paint();
    const dup=list.length-fresh.length;$('shelfInNote').textContent=(added.length?'Added '+added.length+(added.length===1?' tape':' tapes'):'Nothing new')+(dup?'. '+dup+(dup===1?' was':' were')+' already here.':'.');
    $('shelfInAdd').disabled=true;track('shelf_restore',{tapes:added.length},true);$('tapes').scrollIntoView({behavior:'smooth'});});});}

/* ---------- a shared tape (opened from a link) ---------- */
let sharedCass=null;
if(shared&&!BC){$('shared').hidden=false;sharedCass=cassette(shared);$('sharedWrap').appendChild(sharedCass);
  $('sharedBy').textContent=shared.by?'Mixed by '+shared.by+(shared.from?', remixed from '+shared.from:''):(shared.from?'Remixed from '+shared.from:'Somebody made this for you.');
  $('sharedPlay').addEventListener('click',()=>{if(isPlaying()&&cur===shared){pause();return;}cur=shared;paint();if(isPaused()&&gen.tape===shared)resume();else{play(shared);track('tape_open');}});
  $('sharedRemix').addEventListener('click',()=>{cur=shared;edit(()=>{});if(!isPlaying())play(cur);$('make').scrollIntoView({behavior:'smooth'});});
  /* a tape somebody else made goes straight onto your shelf, under SMALL MAIL; one of your own just gets a KEEP button */
  const have=S.tapes.find(t=>sameTape(t,shared)),me=cleanBy(S.by);
  if(have)shared=have;else if(!(shared.by&&me&&shared.by===me)){const k=Object.assign({},shared,{id:Math.random().toString(36).slice(2,10),gift:1});S.tapes.unshift(k);S.tapes=S.tapes.slice(0,MAX_TAPES);shared=k;save();keepStorage();}
  const kept=()=>{const g=findTape(shared.id);$('sharedKeep').textContent=g&&g.gift?'Saved on your shelf, under SMALL MAIL':'On your shelf';};
  $('sharedKeep').addEventListener('click',()=>{if(!findTape(shared.id||'')){const k=Object.assign({},shared,{id:Math.random().toString(36).slice(2,10)});S.tapes.unshift(k);shared=k;save();paint();}
    kept();$('tapes').scrollIntoView({behavior:'smooth'});});
  if(findTape(shared.id||''))kept();
  cur=shared;setTimeout(()=>insertTape(shared),300);}

/* ---------- the screen: an LCD. A dot EQ, and the band standing on it ----------
   The tape's buddy hosts. Each part that's on (drums, bass, keys) brings a buddy of its own: switch a part off and its buddy leaves.
   They stand on the EQ dots under them, so the music lifts them, and wander like pets (see walkers). The host has moods (see moodOf),
   shown only in the status strip: Dino himself always looks the same. */
const stage=$('stage'),sx=stage.getContext('2d');let SW=0,SH=0,SP=14,SCOLS=40,SROWS=7,SBPX=5;
function sizeStage(){const d=(window.devicePixelRatio||1)*(window.BCS||1);SW=Math.max(1,stage.clientWidth);SH=Math.max(1,stage.clientHeight);
  stage.width=Math.round(SW*d);stage.height=Math.round(SH*d);sx.setTransform(d,0,0,d,0,0);
  SP=SW<420?11:13;SCOLS=Math.max(12,Math.floor(SW/SP));SBPX=SW<420?3:(SW<700?4:5);SROWS=Math.max(2,Math.min(8,Math.floor((SH-22*SBPX)/SP)));}
sizeStage();if(window.ResizeObserver)new ResizeObserver(sizeStage).observe(stage);else addEventListener('resize',sizeStage);
const eqLvl=new Float32Array(64),eqPk=new Float32Array(64);let fbuf=null;
const buddyPos=new Float32Array(4);let hopUntil=0,tuneAt=-9,playFrom=0,energy=0;
const WALK=new Map();let walkBeat=-1;
/* like a Tamagotchi: each buddy picks a spot somewhere along the screen, walks there a dot per beat, waits a beat or two, picks another.
   Anyone in the way gets leapt over (or it turns round and picks a spot behind it); and nobody ever overlaps (they're nudged apart every frame) */
function walkers(band,slots,W,live,mood,now){const b=gen&&gen.b,M=.02;
  const half=m=>BUD.list[m.id].w*(m.host?SBPX:Math.max(2,SBPX-1))/2/W;
  band.forEach((m,i)=>{if(WALK.has(m.id))return;
    /* a buddy who joins lands in the widest free gap, and bounces in */
    const xs=[...WALK.entries()].filter(([id])=>band.some(n=>n.id===id)).map(([,w])=>w.x).sort((a,b)=>a-b),edges=[M,...xs,1-M];let best=slots[i]||.5,gap=-1;
    for(let k=0;k<edges.length-1;k++){const g=edges[k+1]-edges[k];if(g>gap){gap=g;best=(edges[k]+edges[k+1])/2;}}
    WALK.set(m.id,{x:WALK.size?best:(slots[i]||.5),dir:1,target:null,wait:0,step:0,jumpAt:WALK.size?pnow():-9,jumpH:9});});
  for(const id of [...WALK.keys()])if(!band.some(m=>m.id===id))WALK.delete(id);
  const ws=band.map(m=>({m,w:WALK.get(m.id),h:half(m)})).sort((a,b)=>a.w.x-b.w.x);
  /* never overlap: nudge neighbours apart, and keep everyone on the screen */
  for(let pass=0;pass<3;pass++)for(let k=0;k<ws.length;k++){const o=ws[k];o.w.x=Math.max(M+o.h,Math.min(1-M-o.h,o.w.x));
    if(k){const p=ws[k-1],need=p.h+o.h+.012,d=o.w.x-p.w.x;if(d<need){const push=(need-d)/2;p.w.x-=push;o.w.x+=push;}}}
  if(attract()&&!calm){const h=ws.find(o=>o.m.host);if(h&&pnow()-(h.w.at||0)>.35&&h.w.x>.18+h.h*.2){h.w.dir=-1;h.w.x-=SP/W;h.w.at=pnow();}return;} /* attract: Dino walks over to PLAY */
  if(!live||!b||calm||pnow()<freezeUntil)return;const beat=Math.floor((now-b.tStart)/b.beat);if(beat===walkBeat)return;walkBeat=beat;
  if(cur.p===0&&beat%2)return; /* SPEED: slow strolls, fast hurries */
  const dx=SP/W*(cur.p===2?2:1);
  for(const o of ws){const w=o.w,lo=M+o.h,hi=1-M-o.h;
    /* Dino settling down (an activity, or dozing) first wanders back off the walls, so he never sits stuck against a side (or with his campfire off the screen) */
    if(o.m.host&&(mood==='SLEEPY'||(REACT_busy()&&ACTS.includes(REACT.k)))){if(Math.abs(w.x-.42)>.22){w.dir=Math.sign(.42-w.x);w.x+=w.dir*dx;w.step=now;}continue;}
    if(o.m.host&&mood==='LOCKED IN'&&beat%2)continue; /* locked in: he still strolls, just slower */
    if(w.wait>0){w.wait--;continue;}
    if(w.target==null||Math.abs(w.target-w.x)<dx){w.target=lo+(hi-lo)*(.08+Math.random()*.84);w.wait=w.target==null?0:Math.floor(Math.random()*3);continue;}
    w.dir=Math.sign(w.target-w.x)||1;const nx=w.x+w.dir*dx;
    const p=ws.find(p=>p!==o&&Math.sign(p.w.x-w.x)===w.dir&&Math.abs(nx-p.w.x)<p.h+o.h+.015);
    if(p){const land=p.w.x+w.dir*(p.h+o.h+.02); /* someone's in the way: leap right over them, or turn round */
      if(land>lo&&land<hi&&Math.random()<.6){w.x=land;w.step=now;w.jumpAt=pnow();w.jumpH=12;}
      else{w.target=w.dir>0?lo+Math.random()*Math.max(0,w.x-lo):w.x+Math.random()*Math.max(0,hi-w.x);w.wait=1;w.dir=-w.dir;}}
    else{w.x=nx;w.step=now;}}}
const GLYPH={book:['##.##','#####','#####','#####'],fire0:['..#..','.##..','.###.','#####'],fire1:['.#...','.##..','.###.','#####'],bird0:['#...#','.#.#.','..#..'],bird1:['.....','##.##','..#..'],
  ufo:['...###...','..#####..','#########','.#.#.#.#.'],wave:['#.#','#.#','###']};
function friendsOf(t){const r=(t.r>>>0),a=BUD.norm(t.t),n=BUD.count,out=[];for(let k=0;k<3;k++){let f=((r>>>(k*7))+k*17)%n;while(f===a||out.includes(f))f=(f+1)%n;out.push(f);}return out;}
/* the host's mood, from what the music is doing */
function moodOf(live,now){if(pnow()<joyUntil)return 'BOUNCING';if(attract())return 'VIBING';if(!live)return 'SLEEPY';if(now-tuneAt<2.5)return 'SURPRISED';if(energy>.62)return 'BOUNCING';if(cur.w===1||cur.w===3)return 'COZY';if(now-playFrom>90)return 'LOCKED IN';return 'VIBING';}
/* a sprite's inside: every empty pixel the outside can't reach (a flood fill from the border), so the crew can be filled solid with the backlight */
const INSIDE=new WeakMap();
function insideOf(rows){let m=INSIDE.get(rows);if(m)return m;const h=rows.length,w=rows[0].length,ink=(i,j)=>{if(i<0||j<0||i>=w||j>=h)return false;const r=rows[j];return typeof r==='string'?r[i]==='#':!!r[i];};
  /* flood the outside in from the border; wall = the ink, or (for line drawings with open gaps, like Dino's mouth) the ink grown by a pixel */
  const fill=grow=>{const wall=(i,j)=>{if(ink(i,j))return true;if(!grow)return false;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(ink(i+a,j+b))return true;return false;};
    const at=(i,j)=>(j+1)*(w+2)+(i+1),out=new Uint8Array((w+2)*(h+2)),st=[[-1,-1]];out[at(-1,-1)]=1;
    while(st.length){const [i,j]=st.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const I=i+a,J=j+b;if(I<-1||J<-1||I>w||J>h)continue;const k=at(I,J);if(out[k])continue;if(I>=0&&J>=0&&I<w&&J<h&&wall(I,J))continue;out[k]=1;st.push([I,J]);}}
    let n=0;const r=rows.map((_,j)=>{const row=[];for(let i=0;i<w;i++){const v=!ink(i,j)&&!out[at(i,j)]?1:0;n+=v;row.push(v);}return row;});return {r,n};};
  let f=fill(false);if(f.n<w*h*.12)f=fill(true);INSIDE.set(rows,f.r);return f.r;}
function drawSprite(x,rows,X,Y,px,flip){const w=rows[0].length;for(let j=0;j<rows.length;j++){const r=rows[j];for(let i=0;i<w;i++){const c=typeof r==='string'?r[flip?w-1-i:i]==='#':r[flip?w-1-i:i];if(c)x.fillRect(Math.round(X+i*px),Math.round(Y+j*px),Math.ceil(px),Math.ceil(px));}}}
/* ---------- the scene: a place behind the band, drawn in "ghost ink" (like an LCD's unlit segments), so it never competes with them.
   Each style has its own: lo-fi a city at night, house a skyline blinking on the beat, ambient mountains and drifting clouds,
   8-bit rolling hills and blocky clouds, dub the sea, trance a starfield over a running grid. It scrolls slowly with the tempo
   and stops when you pause. The sky keeps time: a sun crosses it, then a moon. The texture key is the weather: rain, hiss (static), fire (embers) */
let sceneX=0,sceneT=0,rainT=0,lastScene=-1,travelUntil=0,districtAt=-9;
let touched=false;

/* the districts of the city: each style is a different part of town. Dino and the crew walk through it all night */
const DISTRICTS=window.SBN.DISTRICTS; /* night.js */
/* &mood=journey: every eight minutes the crew walks on to the next district, whatever is playing */
const JOURNEY=[0,3,4,2,1,5];
/* &mood=night (the Studio's NIGHT CITY): one lonely city, always night, the moon crossing every forty minutes, rain drifting in and out */
const NIGHT=BC&&Q.get('mood')!=='journey'; /* the default: the crew is wherever the tape's style takes them */
const sceneStyle=()=>BC&&!NIGHT?JOURNEY[Math.floor(counterMs()/480000)%JOURNEY.length]:cur.s;
/* the sky keeps time. Playing here, it's the real time of day where you are (the moon's out at 11pm); in the videos, a forty-minute day */
function skyPhase(){if(BC)return {day:false,sp:(counterMs()/1000%2400)/2400}; /* it's always night in the city; the moon keeps time */
  const d=new Date(),h=d.getHours()+d.getMinutes()/60;return {day:false,sp:h/24};}
const hsh=(a,b)=>{const v=Math.sin(a*127.1+(b||0)*311.7)*43758.5453;return v-Math.floor(v);};
/* LANDMARKS: little pixel versions of the city's famous skyline, drawn as the crew walks past. Segments are [half-width, rows, fill]:
   '#' wall (with windows), 'c' an art-deco crown, 's' stacked screens, '*' a light. Scaled to the stage, so they read the same on a phone or a TV */
const seg=(W,ss)=>{const out=[];for(const [hw,h,ch] of ss)for(let k=0;k<h;k++){let row='';for(let i=0;i<W;i++)row+=Math.abs(i-(W>>1))<=hw?(ch||'#'):'.';out.push(row);}return out;};
const LMD={
  esb:{h:.96,al:.5,a:seg(11,[[0,1,'*'],[0,3],[1,2],[2,2],[3,13],[4,2],[5,2]])},                     /* the Empire State */
  chry:{h:.86,al:.5,a:seg(9,[[0,1,'*'],[0,3],[1,2,'c'],[2,2,'c'],[3,2,'c'],[3,10],[4,3]])},  /* the Chrysler, its crown lit */
  rock:{h:.76,al:.5,a:seg(13,[[3,1],[4,14],[5,2],[6,3]])},                                    /* 30 Rock */
  ots:{h:.8,al:.46,a:seg(9,[[3,2],[4,18,'s'],[4,6]])},                                               /* the tower of screens at the top of Arcade Row */
  lib:{h:.92,al:.5,a:[                                                                       /* the Statue of Liberty, across the water */
    '...*.........','..###........','...#.........','...#.........','...#.........','...##.#.#....','....#.###....',
    '.....#####...','......###....','.....#####...','....#######..','....#######..','....#######..','....#######..',
    '.....#####...','.....#####...','....#######..','....#######..','...#########.','...#########.',
    '..###########','...#########.','...#.#.#.#.#.','...#########.','...#########.','..###########','#############']},
  brg:{h:.86,al:.46,a:[                                                                       /* a Brooklyn Bridge tower, two pointed arches */
    '..#######..','.#########.','.#########.','.##.###.##.','.#...#...#.','.#...#...#.','.#...#...#.','.#...#...#.',
    '.#...#...#.','.#########.','.#########.','.#########.','.#########.','.#########.']}};
const LMK={};const LM_SH={esb:3,chry:3,rock:3,ots:3,lib:3,brg:3};
let LMTOP=0;
function lmSprite(n,G,f){const key=n+':'+G+':'+LMTOP+':'+(f||1);if(LMK[key])return LMK[key];const d=LMD[n],src=d.a,sh=src.length,sw=src[0].length,th=Math.max(8,Math.min(G-LMTOP,Math.round(G*d.h*1.25*(f||1)))),k=th/sh,tw=Math.max(1,Math.round(sw*k)),cols=[];
  for(let i=0;i<tw;i++){let col='';for(let r=0;r<th;r++)col+=src[Math.min(sh-1,Math.floor(r/k))][Math.min(sw-1,Math.floor(i/k))];cols.push(col);}return LMK[key]={w:tw,h:th,cols,sh:LM_SH[n]==null?3:LM_SH[n]};}
/* which landmarks stand in each district, repeating every P columns: [sprite, column] */
const LMS={1:{P:160,l:[['esb',10],['chry',62],['rock',112]]},3:{P:120,l:[['ots',40]]},4:{P:150,l:[['lib',50]]},5:{P:90,l:[['brg',0]]}};
function lmAt(st,wc,G){const L=LMS[st];if(!L)return null;const m=((wc%L.P)+L.P)%L.P;for(const [n,o] of L.l){const S=lmSprite(n,G);if(m>=o&&m<o+S.w)return {S,i:m-o,n};}return null;}
/* the screen, bottom up: a thin equalizer strip, the road, the curb and sidewalk; the crew walks on the sidewalk (row G), the city stands behind */
function streetOf(H){const Q=Math.max(3,SBPX),rows=Math.ceil(H/Q),eq=Math.max(5,Math.round(rows*.1)),road=Math.max(4,Math.round(rows*.07));return {Q,rows,eq,road,G:rows-eq-road-4};}
function drawScene(x,W,H,live,now,dt){
  const L0=streetOf(H),Q=L0.Q,cols=Math.ceil(W/Q)+2,rows=L0.rows,G=L0.G /* the sidewalk, where the crew walks */,TOP=Math.ceil(rows*.21) /* nothing taller than the title line */,cap=v=>Math.max(2,Math.floor((G-TOP)*Math.tanh(1.5*v/Math.max(1,G-TOP)))) /* soft: tall stays taller than short, nothing above the title */,GB2=G /* the buildings stand on the street */,st=sceneStyle(),b=gen&&gen.b,bpm=b?b.bpm:100;
  if(st!==lastScene){if(lastScene>=0&&live){travelUntil=pnow()+3;districtAt=pnow();}lastScene=st;}
  if(live&&!calm)rainT+=dt*([.45,1,1.8][cur.p]||1);
  if(live&&!calm){sceneX+=dt*(bpm/120)*[1.2,1.6,.5,1.4,.8,3][st]*(pnow()<travelUntil?6:1);sceneT+=dt;}
  LMTOP=TOP;const sx=Math.floor(sceneX),fx=(sceneX-sx)*Q,thump=cur.b&&lastHit.b!=null&&now-lastHit.b<.09&&!calm?Q:0; /* BASS: the ground thumps */
  /* one cell of the scene in one of the four shades (solid, no see-through: later layers simply cover earlier ones) */
  const cell=(c,r,sh,par)=>{x.fillStyle=GB[sh];x.fillRect(Math.round(c*Q-(par!=null?par:fx)),r*Q+(r>G*.35&&r<G?thump:0),Q,Q);}; /* solid pixels, no gaps: a handheld screen */
  x.globalAlpha=1;
  /* a story scene, instead of the city: the platform, a ride, the last train home */
  if(SCN.mode){const t=pnow()-SCN.t0;if(t<SCN.dur){subway(SCN.mode,t);x.fillStyle=INKC;return;}const th=SCN.then;SCN={mode:null};if(th)th();}
  function subway(mode,t){const fl=G+4+L0.road; /* the floor runs down to the equalizer strip */
    if(mode==='platform'){
      /* the station wall: tiles, a name band, the platform with its dotted edge */
      for(let r=0;r<G;r++)for(let c=0;c<cols;c++){if(r%4===3||((c+(Math.floor(r/4)%2)*4)%8===0))cell(c,r,2,0);}
      const nb=Math.max(2,TOP-2);for(let r=nb;r<nb+4;r++)for(let c=0;c<cols;c++)cell(c,r,3,0);
      x.fillStyle=LCD;x.font='400 '+Math.round(Q*2.6)+'px Silk';x.textAlign='center';x.textBaseline='middle';x.fillText('SHOWTIME ST.',W/2,(nb+2)*Q);x.textAlign='start';x.textBaseline='alphabetic';
      /* the train: in with doors open, the doors close (ding-dong), and it pulls away without them */
      const th=Math.max(10,G-nb-6),ty=G-th,leave=t>2.4?Math.pow((t-2.4)/2.6,2)*(cols+40):0,tx=Math.round(-4+leave),tw=cols+8,shut=t>1.6;
      if(t>1.2&&!SCN.ding){SCN.ding=true;SFX.ding();}
      for(let i=0;i<tw;i++){const c=tx+i;if(c<0||c>=cols)continue;for(let j=0;j<th;j++){const r=ty+j,edge=j===0||j===th-1,win=j>=Math.round(th*.25)&&j<Math.round(th*.55),car=(i%44),door=car>=8&&car<16||car>=28&&car<36,seam=car===0;
        let v=0;if(edge||seam)v=3;else if(door)v=shut?(car===12||car===32?3:1):(j>2?3:1);else if(win)v=(car%6===0)?3:2;else if(j===th-3)v=3;else v=0;cell(c,r,v,0);}}
      /* the platform */
      for(let c=0;c<cols;c++){cell(c,G,3,0);for(let r=G+1;r<fl;r++)cell(c,r,r===G+1?((c%2)?0:1):((c+r)%2?2:1),0);}
      return;}
    /* inside a car: the windows (the tunnel, its lights streaking by, now and then a station), poles, the bench */
    const wt=TOP+(mode==='outro'?8:2),wb=Math.max(wt+6,G-9),sp=t*(mode==='outro'?9:30);
    for(let r=0;r<G;r++)for(let c=0;c<cols;c++)cell(c,r,r<TOP?(c%10<6?0:1):1,0); /* the ceiling lights, the car wall */
    for(let c=0;c<cols;c++){const pane=(c%26)>1&&(c%26)<24;for(let r=wt;r<wb;r++){if(!pane){cell(c,r,2,0);continue;}
      if(mode==='outro'){ /* the last train comes up out of the tunnel: the city going by in the dark */
        const wc=Math.floor(c+sp),id=Math.floor(wc/6),hh=Math.round((wb-wt)*(.3+.6*hsh(id,77)));const inB=r>=wb-hh;cell(c,r,inB?((wc%3===1&&r%3===1&&hsh(wc,r)>.6)?0:2):1,0);}
      else{const stn=(t%5)>3.2&&(t%5)<3.9; /* a station flashing by */cell(c,r,stn?((c+Math.floor(sp))%7<2?3:1):3,0);
        if(!stn&&(r===wt+2||r===wb-3)&&((c+Math.floor(sp*(r===wt+2?1:1.6)))%17)<3)cell(c,r,r===wt+2?0:1,0);}}}
    /* the frames around the windows, the ads above them, the poles */
    for(let c=0;c<cols;c++){cell(c,wt-1,3,0);cell(c,wb,3,0);if((c%26)===0||(c%26)===25)for(let r=wt-1;r<=wb;r++)cell(c,r,3,0);}
    for(let c=0;c<cols;c++)if((c%26)>3&&(c%26)<22)for(let r=TOP-1;r<wt-2;r++)cell(c,r,(c%26)===4||(c%26)===21||r===TOP-1||r===wt-3?3:0,0);
    if(mode==='outro'){ /* the night's six tapes, on the ad strip: the souvenirs */
      for(let r=TOP;r<wt-1;r++)for(let c=0;c<cols;c++)cell(c,r,r===TOP||r===wt-2?3:0,0);for(let k=0;k<6;k++){const cx=Math.round(cols*.5+(k-3)*11+2),cy=TOP+1;for(let i=0;i<7;i++)for(let j=0;j<4;j++){const e=i===0||i===6||j===0||j===3;cell(cx+i,cy+j,e?3:(j===1&&(i===2||i===4))?3:0,0);}}}
    for(let c=0;c<cols;c++)if((c%38)===19)for(let r=0;r<fl;r++)cell(c,r,3,0);
    for(let c=0;c<cols;c++){for(let r=G-7;r<G-2;r++)cell(c,r,r===G-7?3:2,0);for(let r=G-2;r<G;r++)cell(c,r,(c%9===0)?3:1,0);} /* the bench */
    for(let c=0;c<cols;c++){cell(c,G,3,0);for(let r=G+1;r<fl;r++)cell(c,r,(c+r)%3?2:1,0);}}
  /* the moon keeps time, by your own clock (a forty-minute night on a broadcast) */
  {const {day,sp}=skyPhase(),cx=Math.round((W*(.08+.84*sp))/Q),cy=Math.round((H*.42-Math.sin(Math.PI*sp)*H*.3)/Q),r=Math.max(2,Math.round(14/Q));
    for(let j=-r-2;j<=r+2;j++)for(let i=-r-2;i<=r+2;i++){const d=i*i+j*j;if(d>r*r+r){if(d<(r+2)*(r+2)&&(i+j)%2===0)cell(cx+i,cy+j,0,0);continue;}if(!day&&(i+1.3)*(i+1.3)+(j-.6)*(j-.6)<r*r*.8)continue;cell(cx+i,cy+j,0,0);}}
  const beat=b?Math.floor((now-b.tStart)/b.beat):0;
  /* THE CITY AT NIGHT. Dino and the crew are always walking through it; each style is a different district, with its own buildings,
     heights and goings-on: lo-fi OLD TOWN, house MIDTOWN, ambient CENTRAL PARK, 8-bit ARCADE ROW, dub THE HARBOR, trance THE BRIDGE */
  {const tw=Math.floor(sceneT*2); /* stars, slowly drifting, a few twinkling */
    for(let i=0;i<46;i++){const c=Math.floor(((hsh(i,11)*cols*3-sceneX*.08)%cols+cols)%cols),r=1+Math.floor(hsh(i,12)*G*.45);if(hsh(i,tw%7)>.86)continue;cell(c,r,hsh(i,13)>.5?0:2,0);}}
  /* the sky is the light-mid shade (the screen's background); low down, the city's glow, dotted in the backlight */
  {const gh=Math.max(4,Math.round(G*.35));for(let r=G-gh;r<G;r++){const t=(r-(G-gh))/gh,lv=t<.34?1:t<.67?2:3;for(let c=0;c<cols;c++){const k=((c+sx)&1)*2+(r&1);if([0,2,3,1][k]<lv)cell(c,r,0);}}}
  /* the far skyline: a dotted dark-mid, moving slower (every district has the city behind it) */
  {const fx2=sceneX*.35,fs=Math.floor(fx2),ff=(fx2-fs)*Q;const E=lmSprite('esb',G,.85);for(let c=0;c<cols;c++){const wc=fs+c,m=((wc%150)+150)%150;if(st!==1&&m<E.w){const col=E.cols[m];for(let r=0;r<E.h;r++)if(col[r]!=='.')cell(c,G-E.h+r,(wc+r)&1?2:1,ff);continue;}const id=Math.floor(wc/5),h=cap(G*1.3*(.18+hsh(id,21)*.3));for(let r=G-h;r<GB2;r++)cell(c,r,(wc+r)&1?2:1,ff);}}
  const blk=(wc,wmin,wmax,seed)=>{let k=0;const base=Math.floor(wc/40)*40;let p=base;while(true){const w=wmin+Math.floor(hsh(Math.floor(p),seed+k)*(wmax-wmin+1));if(wc<p+w)return {id:Math.floor(p)*7+seed,o:wc-p,w};p+=w;k++;if(k>40)return {id:p,o:0,w:1};}};
  /* landmarks in ink, lit windows in the backlight; the crown and the spire light blink on the beat */
  const lmCol=(c,L,beat)=>{const {S,i}=L,col=S.cols[i];if(col[S.h-1]!=='.')for(let r=G;r<GB2;r++)cell(c,r,S.sh);for(let r=0;r<S.h;r++){const ch=col[r];if(ch==='.')continue;const y=G-S.h+r;
      if(ch==='*')cell(c,y,beat%2?0:3);
      else if(ch==='c')cell(c,y,(i+r)%3===0?0:3);
      else if(ch==='s')cell(c,y,((Math.floor(r/3)+beat+i%2)%3)?0:3);
      else{const win=i%2===1&&r%2===1&&r>2&&col[r-1]!=='.'&&S.cols[i-1]&&S.cols[i-1][r]!=='.'&&S.cols[i+1]&&S.cols[i+1][r]!=='.';cell(c,y,win&&hsh(i*13+r,S.h)>.72?0:S.sh);}}};
  for(let c=0;c<cols;c++){const wc=sx+c;
    const L=lmAt(st,wc,G);if(L){lmCol(c,L,beat);if(st===5){const ry=Math.floor(G*.72);cell(c,ry,3);cell(c,ry+1,3);}continue;}
    if(st===0){ /* OLD TOWN: low brick rows, warm windows, chimneys, water towers, a street lamp now and then */
      const B=blk(wc,5,9,1);if(B.o===B.w-1)continue;const h=cap(G*1.3*(.22+hsh(B.id,2)*.26));
      for(let r=G-h;r<GB2;r++){const win=B.o%2===1&&(r-(G-h))%3===2;cell(c,r,win&&hsh(B.id*5+B.o,r)>.62?0:r===G-h?3:2);}
      if(B.o===1&&hsh(B.id,3)>.5){cell(c,G-h-1,3);cell(c,G-h-2,3);}
      if(B.w>=7&&hsh(B.id,40)>.45&&B.o>=2&&B.o<=4){const t=G-h; /* a wooden water tower on the roof */ if(B.o!==3)cell(c,t-1,3);for(let r=t-5;r<t-1;r++)cell(c,r,3);if(B.o===3)cell(c,t-6,3);}
      if(((wc%23)+23)%23===0){for(let r=G-6;r<G;r++)cell(c,r,3);cell(c+1,G-6,0);cell(c+1,G-7,3);}}
    else if(st===1){ /* MIDTOWN: tall towers, windows blinking to the beat */
      const B=blk(wc,6,10,4);if(B.o===B.w-1)continue;const h=cap(G*1.3*(.26+hsh(B.id,5)*.26));
      for(let r=G-h;r<GB2;r++){const win=B.o%2===1&&r%2===1&&r>G-h+1;cell(c,r,win&&hsh(B.id*9+B.o,r+beat*7)>.6?0:r===G-h?3:2);}
      if(B.o===Math.floor(B.w/2)&&hsh(B.id,6)>.6)for(let r=G-h-4;r<G-h;r++)cell(c,r,3);}
    else if(st===2){ /* CENTRAL PARK at 3am: a dark line of round treetops, the wall of towers along the far side rising behind, lamps along the path, now and then a little stone bridge */
      const T=blk(wc,4,7,30),d=Math.abs(T.o-(T.w-1)/2),top=G-cap(G*1.3*(.1+hsh(T.id,31)*.07))+Math.floor(d*d*.45);
      const B=blk(wc,4,7,7);if(B.o<B.w-1){const h=cap(G*1.3*(.3+hsh(B.id,8)*.45));for(let r=G-h;r<top;r++){const win=B.o%2===1&&r%2===0&&hsh(B.id*3+B.o,r)>.78;cell(c,r,win?0:2);}}
      {const band=Math.max(3,Math.round((G-top)*.55)),trunk=T.o===Math.floor((T.w-1)/2);for(let r=top;r<GB2;r++)cell(c,r,r<top+band?(hsh(wc*7+r,33)>.85?2:3):(trunk&&r<G?3:(wc+r)&1?2:1));} /* leafy crowns on trunks, the lawn below */
      if(((wc%19)+19)%19===0){for(let r=G-5;r<G;r++)cell(c,r,3);cell(c,G-6,0);cell(c,G-7,3);}
      {const m=((wc%97)+97)%97;if(m>=40&&m<52){const k=m-40,ay=G-1-Math.round(3*Math.sin(Math.PI*k/11));for(let r=G-5;r<=ay;r++)cell(c,r,3);}}}
    else if(st===3){ /* ARCADE ROW: mid-height blocks, each with a sign that flickers on the beat */
      const B=blk(wc,6,9,10);if(B.o===B.w-1)continue;const h=cap(G*1.3*(.28+hsh(B.id,11)*.22));
      for(let r=G-h;r<GB2;r++)cell(c,r,r===G-h?3:2);
      if(B.o>0&&B.o<B.w-2){const sy=G-h+2,on=(beat+Math.floor(hsh(B.id,12)*4))%4!==0;cell(c,sy,on?0:3);cell(c,sy+1,on?0:3);}
      if(B.o===1||B.o===B.w-3)cell(c,G-2,0);}
    else if(st===4){ /* THE HARBOR: long warehouses, cranes over the water, a light on the end of each pier */
      const B=blk(wc,12,16,13);const h=cap(G*1.3*(.16+hsh(B.id,14)*.08));
      if(B.o<B.w-2)for(let r=G-h-(B.o>2&&B.o<B.w-5?1:0);r<GB2;r++)cell(c,r,r<G-h+1?3:2);
      if(((wc%37)+37)%37===0){const ch=cap(G*.9);for(let r=G-ch;r<GB2;r++)cell(c,r,3);for(let k=-3;k<9;k++)cell(c+k,G-ch,3);cell(c+7,G-ch+1,3);cell(c+7,G-ch+2,3);cell(c,G-ch-1,beat%2?0:3);}}
    else{ /* THE BRIDGE: towers behind, an elevated road across the front with headlights streaming past */
      const B=blk(wc,5,8,16);if(B.o<B.w-1){const h=cap(G*1.3*(.24+hsh(B.id,17)*.28));for(let r=G-h;r<GB2;r++)cell(c,r,(B.o%2&&r%3===0&&hsh(B.id+B.o,r)>.7)?0:(wc+r)&1?2:1);}
      const ry=Math.floor(G*.72);cell(c,ry,3);cell(c,ry+1,3);
      {const S=lmSprite('brg',G),P=90,m=((wc%P)+P)%P,u=(m-S.w/2)/P,yt=G-S.h+1,cy=Math.round(yt+(ry-2-yt)*(1-Math.pow(2*u-1,2))); /* the cables, sagging tower to tower */
        cell(c,cy,3);if(m%3===0)for(let r=cy+1;r<ry;r++)cell(c,r,2);}}}
  if(st===5){const ry=Math.floor(G*.72);x.fillStyle=GB[0];for(let i=0;i<9;i++){const cxp=((hsh(i,31)*cols*Q+sceneT*(40+hsh(i,32)*60)*Q)%(cols*Q));x.fillRect(Math.round(cxp),ry*Q,Q*2-1,Q-1);}} /* headlights */
  /* the street: an ink curb, a pale sidewalk, the road with lane dashes (water at the Harbor), down to the equalizer strip */
  {const ro=G+4,re=G+4+L0.road;for(let c=0;c<cols;c++){const wc=sx+c;cell(c,G,3);cell(c,G+1,1);cell(c,G+2,(c+wc)%2?1:0);cell(c,G+3,3);
      for(let r=ro;r<re;r++)cell(c,r,st===4?(((wc+r*3)%11<2)?1:((wc+r)%2&&r>ro+1?3:2)):2);
      if(st!==4&&(((wc%10)+10)%10)<5)cell(c,ro+Math.floor(L0.road/2),1);}
    /* street lamps every few blocks: an ink post, a lit head, a dithered pool of light on the sidewalk */
    for(let c=0;c<cols;c++){const wc=sx+c;if(((wc%31)+31)%31!==0||st===0||st===2)continue;for(let r=G-12;r<G;r++)cell(c,r,3);cell(c+1,G-12,3);cell(c+2,G-12,3);cell(c+2,G-11,0);
      for(let r=G-10;r<G;r++){const sp=Math.floor((r-(G-10))*.35);for(let k=-sp;k<=sp;k++)if((c+k+r)%2===0&&k!==-2)cell(c+2+k,r,1);}}
    /* now and then the night bus goes by, windows lit, headlight on */
    if(st!==4){const period=46,ph=(sceneT%period)/period;if(ph<.4){const bw=22,bxp=Math.round(cols-(ph/.4)*(cols+bw+20)),by=ro-2;
      for(let i=0;i<bw;i++)for(let j=0;j<7;j++){const edge=i===0||i===bw-1||j===0||j===6,win=j>=1&&j<=2&&i>1&&i<bw-2&&i%3!==0;cell(bxp+i,by+j,edge?3:win?0:j>=5?3:1,0);}
      cell(bxp-1,by+4,0,0);for(let i=1;i<6;i++)if(i%2)cell(bxp-1-i,by+4,0,0);}}}
  /* the weather, from the texture key */
  const w=cur.w||(NIGHT&&Math.floor(counterMs()/300000)%3===1?1:0); /* night city: a passing shower every quarter hour, seen not heard */
  if(w===1){ /* the rain falls at the tape's SPEED (rainT runs faster or slower) */
    for(let i=0;i<46;i++){const xx=Math.floor(hsh(i,5)*cols),yy=Math.floor((hsh(i,6)*rows+rainT*rows*.9*(1+hsh(i,7)))%rows);cell(xx-Math.floor(yy/4),yy,3,0);cell(xx-Math.floor(yy/4),yy+1,2,0);}}
  else if(w===2){if(live||calm)for(let i=0;i<14;i++)cell(Math.floor(Math.random()*cols),Math.floor(Math.random()*rows),2,0);}
  else if(w===3){for(let i=0;i<22;i++){const life=(sceneT*.35+hsh(i,8))%1,xx=Math.floor(cols*(.2+hsh(i,9)*.6)+Math.sin((sceneT+i)*2)*1.5),yy=Math.floor(rows*(1-life*.85));cell(xx,yy,life<.35?3:life<.7?2:1,0);}}
  x.globalAlpha=1;x.fillStyle=INKC;}
/* a card on the screen: one big line, any small ones under it, on a patch of backlight so they read over the city */
/* words on the screen with a pixel outline in the backlight, so ink letters read over the city (the step is one font pixel) */
function inkText(x,str,X,Y){const sz=parseFloat(x.font.split(' ')[1])||16,k=Math.max(2,Math.round(sz/8));x.fillStyle=LCD;
  for(let j=-k;j<=k;j+=k)for(let i=-k;i<=k;i+=k)if(i||j)x.fillText(str,X+i,Y+j);x.fillStyle=INKC;x.fillText(str,X,Y);}
function titleCard(x,W,H,a,lines){const n=lines.length,fs=Math.round(Math.min(n>3?22:26,W/(n>3?19:16))),sm=Math.round(fs*(n>3?.58:.55)),lh=sm*1.6,y0=H*(n>3?.06:.16);x.save();x.globalAlpha=Math.max(0,Math.min(1,a));x.textAlign='center';
  /* small lines wider than the screen wrap */
  x.font='400 '+sm+'px Silk';const maxw=W*.84,rows=[];for(const l of lines.slice(1)){let cur='';for(const w of l.split(' ')){const t=cur?cur+' '+w:w;if(x.measureText(t).width>maxw&&cur){rows.push(cur);cur=w;}else cur=t;}rows.push(cur);}
  x.font='400 '+fs+'px Silk';let w=x.measureText(lines[0]).width;x.font='400 '+sm+'px Silk';for(const l of rows)w=Math.max(w,x.measureText(l).width);
  const hgt=Math.round(fs*1.45+rows.length*lh+fs*.35),bx=Math.round(W/2-w/2-fs*1.1),bw=Math.round(w+fs*2.2),by=Math.round(y0-fs*.15),q=Math.max(2,SBPX-2); /* a Game Boy message box: backlight, a double ink border */
  x.fillStyle=INKC;x.fillRect(bx,by,bw,hgt);x.fillStyle=LCD;x.fillRect(bx+q,by+q,bw-2*q,hgt-2*q);x.fillStyle=INKC;x.fillRect(bx+2*q,by+2*q,bw-4*q,hgt-4*q);x.fillStyle=LCD;x.fillRect(bx+3*q,by+3*q,bw-6*q,hgt-6*q);
  x.fillStyle=INKC;x.font='400 '+fs+'px Silk';x.fillText(lines[0],W/2,y0+fs);x.font='400 '+sm+'px Silk';rows.forEach((l,k)=>x.fillText(l,W/2,y0+fs*1.45+lh*(k+.75)));x.restore();}
function drawStage(live,now,dt){
  if(live&&an){fbuf=fbuf||new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(fbuf);}
  const n=fbuf?fbuf.length:0,W=SW,H=SH,P=SP,COLS=SCOLS,ROWS=SROWS,x=sx,dot=P-3,x0=Math.round((W-COLS*P+3)/2);
  x.clearRect(0,0,W,H);let sum=0;
  drawScene(x,W,H,live,now,dt);
  const bt=pnow()-bootAt;if(bt>=1.5&&bt<9&&!storyOn&&(!BC||BC_NIGHT)&&bootAt>0)startStory();
  if(bt<1.5){x.fillStyle=INKC;x.textAlign='center';x.textBaseline='middle';x.font='400 '+Math.round(Math.min(46,W/9))+'px Silk';
    /* the opening: a title card in a Game Boy message box drops in, SMALL BEATS, then DINO AND THE CREW under it */
    const big=Math.round(Math.min(44,W/10)),small=Math.round(Math.min(14,W/30)),q=Math.max(2,SBPX-2);x.font='400 '+big+'px Silk';const tw=x.measureText('SMALL BEATS').width;
    const bw=Math.round(tw+big*1.2),bh=Math.round(big*1.25+small*2.2),bx=Math.round(W/2-bw/2),cy=H*.4,yy=Math.min(1,bt/.6),by=Math.round(-bh+(cy-bh/2+bh)*(1-Math.pow(1-yy,3)));
    x.fillStyle=INKC;x.fillRect(bx,by,bw,bh);x.fillStyle=LCD;x.fillRect(bx+q,by+q,bw-2*q,bh-2*q);x.fillStyle=INKC;x.fillRect(bx+2*q,by+2*q,bw-4*q,bh-4*q);x.fillStyle=LCD;x.fillRect(bx+3*q,by+3*q,bw-6*q,bh-6*q);
    x.fillStyle=INKC;x.textBaseline='alphabetic';x.fillText('SMALL BEATS',W/2,by+big*1.05);if(bt>.7){x.font='400 '+small+'px Silk';x.fillText('DINO AND THE CREW',W/2,by+big*1.05+small*1.7);}
    x.textAlign='start';x.textBaseline='alphabetic';return 'VIBING';}
  for(let c=0;c<COLS;c++){let v=0;
    if(live&&n){const cc=c-(c%2),lo=Math.floor(2*Math.pow(n*.7/2,cc/COLS)),hi=Math.max(lo+1,Math.floor(2*Math.pow(n*.7/2,(cc+2)/COLS)));for(let b=lo;b<hi&&b<n;b++)v=Math.max(v,fbuf[b]); /* bars two dots wide */
      v=Math.pow(v/255,1.35)*ROWS*(.72+.55*c/COLS);}
    eqLvl[c]=v>eqLvl[c]?v:Math.max(0,eqLvl[c]-.35);eqPk[c]=eqLvl[c]>eqPk[c]?eqLvl[c]:Math.max(0,eqPk[c]-.06);sum+=eqLvl[c]/ROWS;
    {const L=streetOf(H),hh=Math.round(Math.min(1,eqLvl[c]/ROWS)*(L.eq-1)),pk=Math.round(Math.min(1,eqPk[c]/ROWS)*(L.eq-1)),bw=Math.max(L.Q,Math.round(P*.62)),bx=x0+c*P; /* the equalizer: a thin strip of ink bars along the bottom, a dark-mid peak above each */
      if(hh>0){x.fillStyle=INKC;x.fillRect(bx,H-hh*L.Q-L.Q,bw,hh*L.Q);}if(pk>hh){x.fillStyle=GB[2];x.fillRect(bx,H-pk*L.Q-L.Q,bw,L.Q);}}}
  x.globalAlpha=1;energy+=(sum/COLS-energy)*Math.min(1,dt*3);
  /* the band: the host, then a buddy for each part that's on */
  /* the crew: Dino, Bunker and Hoot, all night; the run's new friend tags along from the halfway stop */
  const t=cur,narrow=W<420,bid=nm=>{const i=BUD.list.findIndex(b=>b.name===nm);return i<0?0:i;},N0=window.SBN;
  const band=N0.CREW.map((nm,i)=>i?{id:bid(nm)}:{id:bid(nm),host:1});if(friendJoined())band.push({id:bid(N0.friend(nightNo()))});
  const shown=band,slots=band.map((m,i)=>.1+.8*(i+.5)/band.length),mood=moodOf(live,now),hop=live&&!calm&&now<hopUntil;
  walkers(shown,slots,W,live,mood,now);
  drawVisitors(x,W,H,P,ROWS,live,now,shown);
  x.fillStyle=INKC;HITS.length=0;
  shown.forEach((m,i)=>{const b=BUD.list[m.id],px=m.host?SBPX:Math.max(2,SBPX-1),w=b.w*px,wk=WALK.get(m.id),cx=Math.round(W*(wk?wk.x:slots[i]));
    const RA=m.host&&REACT&&pnow()-REACT.t0<REACT.dur?REACT:null,re=RA?pnow()-RA.t0:0;
    const h=b.h*px,c0=Math.max(0,Math.floor((cx-w/2-x0)/P)),c1=Math.min(COLS-1,Math.floor((cx+w/2-x0)/P));
    let top=0;for(let c=c0;c<=c1;c++)top=Math.max(top,Math.min(ROWS,Math.ceil(eqLvl[c])));
    buddyPos[i]+=((live?top:0)-buddyPos[i])*Math.min(1,dt*10);
    const lift=hop?(m.host?(mood==='BOUNCING'?px*4:px*2):px):0,jump=m.host&&mood==='SURPRISED'?px*4:0;
    const jt=wk?pnow()-wk.jumpAt:9,jp=jt<.42&&!calm?Math.sin(Math.PI*jt/.42)*wk.jumpH*px:0; /* a jump, when something's pressed */
    const bob=(wk&&now-wk.step<.09?px:0)+jp; /* a little bob with each step */
    const frozen=pnow()<freezeUntil,dance=RA&&RA.k==='dance'?Math.abs(Math.sin(re*9))*px*3:0;
    const street=streetOf(H),y=Math.max(2,Math.round(street.G*street.Q-h-(frozen?0:lift+jump+bob+dance))); /* standing on the sidewalk; never above the top of the screen: his head always shows */
    let flip=!!wk&&wk.dir<0,rx=0,face=mood;
    if(RA){if(RA.k==='shake')rx=Math.round(Math.sin(re*70))*px;else if(RA.k==='confused'||RA.k==='look')flip=Math.floor(re/(RA.k==='look'?.5:.3))%2===0;else if(RA.k==='spin')flip=Math.floor(re/.07)%2===0;
      if(RA.k==='lie'||RA.k==='yawn'||RA.k==='camp')face='SLEEPY';if(RA.k==='confused'||RA.k==='spin')face='SURPRISED';if(RA.k==='read'||RA.k==='fish'||RA.k==='stars'){flip=false;face=RA.k==='read'?'COZY':'VIBING';}}
    const rows=b.rows;
    if(RA&&RA.k==='glitch'){const g=Math.floor(re*24);rows.forEach((r,j)=>{const off=((j+g)%5===0)?(g%2?2:-2)*px:0;drawSprite(x,[r],cx-w/2+off,y+j*px,px,flip);});}
    else{const hp=Math.max(1,Math.round(px*.5));x.fillStyle=LCD;for(const [dx,dy] of [[hp,0],[-hp,0],[0,hp],[0,-hp]])drawSprite(x,rows,cx-w/2+rx+dx,y+dy,px,flip);drawSprite(x,insideOf(rows),cx-w/2+rx,y,px,flip);x.fillStyle=INKC;drawSprite(x,rows,cx-w/2+rx,y,px,flip);} /* Dino always looks like Dino: sunglasses and headphones, never squashed. A backlight halo, and solid insides, keep the crew clear of the city */
    HITS.push({id:m.id,host:!!m.host,x:cx-w/2,y,w,h,px});
    if(RA&&ACTS.includes(RA.k)){const gp=Math.max(2,px-1);
      if(RA.k==='read')drawSprite(x,GLYPH.book,cx+w/2-2*gp,y+h-6*gp,gp);
      else if(RA.k==='camp'){drawSprite(x,Math.floor(pnow()*5)%2?GLYPH.fire0:GLYPH.fire1,cx+w/2+3*gp,y+h-4*gp,gp);}
      else if(RA.k==='fish'){const rx0=cx+w/2,ry0=y+3*px;for(let k=0;k<8;k++)x.fillRect(Math.round(rx0+k*gp),Math.round(ry0-k*gp*.6),gp,gp);const lx=rx0+8*gp;const sY=streetOf(H);for(let yy=ry0-5*gp;yy<(sY.G+5)*sY.Q;yy+=gp*2)x.fillRect(Math.round(lx),Math.round(yy),1,gp);
        x.fillRect(Math.round(lx-gp),Math.round((sY.G+5)*sY.Q-gp+Math.sin(pnow()*3)*gp),gp*2,gp*2);}}
  });
  /* a title card: the queue (the story's cards) first; otherwise the district's name whenever the crew walks into a new one (the stop's card, if it's tonight's next stop) */
  if(CQ.length){const c=CQ[0],tn=pnow();if(!c.t0)c.t0=tn;const t=tn-c.t0;if(t>=c.dur)CQ.shift();else titleCard(x,W,H,t<.3?t/.3:t>c.dur-.6?(c.dur-t)/.6:1,c.lines);}
  else if(!SCN.mode){const since=pnow()-districtAt;if(since>=0&&since<3.2){const st=routeStop(),stp=st&&st.s===sceneStyle()&&!BC;titleCard(x,W,H,since<.3?since/.3:since>2.6?(3.2-since)/.6:1,stp?stopLines(st,routeStep()):[DISTRICTS[sceneStyle()]||'',window.SBN.STOPS[sceneStyle()]||'']);}}
  /* attract: PRESS PLAY, blinking, and Dino points down at it */
  if(attract()&&!calm){const on=Math.floor(pnow()*1.6)%2===0,host=HITS.find(o=>o.host);x.fillStyle=INKC;x.textAlign='center';x.font='400 '+Math.round(Math.min(18,W/26))+'px Silk';
    const gift=shared&&cur===shared;if(gift){inkText(x,shared.by?'A TAPE FROM '+shared.by.toUpperCase():'SOMEBODY SENT YOU A TAPE',W/2,H*.24);}
    if(on)inkText(x,'PRESS ▶ PLAY',W/2,H*(gift?.34:.32));x.textAlign='start';}
  return REACT_busy()?({lie:'CHILLING',read:'READING',fish:'FISHING',camp:'BY THE FIRE',stars:'STARGAZING',glitch:'GLITCHING',shake:'HEADBANGING',confused:'CONFUSED',spin:'DIZZY',look:'LOOKING AROUND',dance:'DANCING',yawn:'ZONING OUT'}[REACT.k]||mood):mood;}
/* ---------- visitors: birds by day, shooting stars by night, a UFO on trance, and now and then a buddy just passing through ---------- */
let VIS2=null,visitCheck=0,lastRare=0;
function met(kind,id){S.met=S.met||{b:[],v:{}};let ch=false;if(kind==='b'){if(!S.met.b.includes(id)){S.met.b.push(id);ch=true;}}else if(!S.met.v[kind]){S.met.v[kind]=1;ch=true;}
  if(ch){save();paintMet();if(kind!=='b'&&kind!=='poke')say('YOU SAW '+({bird:'A BAT',star:'A SHOOTING STAR',ufo:'A UFO',visitor:'A VISITOR'}[kind]||kind)+'!');}}
function drawVisitors(x,W,H,P,ROWS,live,now,shown){
  shown.forEach(m=>{if(!(S.met&&S.met.b.includes(m.id)))met('b',m.id);});
  const t=pnow(),sec=counterMs()/1000,day=skyPhase().day;
  if(live&&!calm&&!VIS2&&t-visitCheck>1){visitCheck=t;const r=Math.random();
    if(sceneStyle()===5&&r<.003)VIS2={k:'ufo',t0:t,dur:7};
    else if(!day&&r<.007)VIS2={k:'star',t0:t,dur:.9,y:.1+Math.random()*.25,x:.2+Math.random()*.6};
    else if(r<.011)VIS2={k:'bird',t0:t,dur:6,y:.1+Math.random()*.22}; /* a bat crossing the moon */
    else if(sec>600&&sec-lastRare>600){lastRare=sec;const inBand=shown.map(m=>m.id);let id;do id=Math.floor(Math.random()*BUD.count);while(inBand.includes(id));VIS2={k:'visitor',t0:t,dur:11,id};}}
  if(!VIS2)return;const V=VIS2,a=(t-V.t0)/V.dur;if(a>1){VIS2=null;return;}x.fillStyle=INKC;const px=Math.max(2,SBPX-1);
  if(V.k==='bird'){const g=Math.floor(t*6)%2?GLYPH.bird0:GLYPH.bird1;drawSprite(x,g,-30+a*(W+60),H*V.y+Math.sin(a*12)*6,px);if(a>.5)met('bird');}
  else if(V.k==='star'){const sx0=W*V.x,sy0=H*V.y;for(let k=0;k<6;k++){x.globalAlpha=(1-a)*(1-k/6);x.fillRect(Math.round(sx0+a*W*.25-k*px*1.6),Math.round(sy0+a*H*.12-k*px*.8),px,px);}x.globalAlpha=1;if(a>.3)met('star');}
  else if(V.k==='ufo'){const ux=-60+a*(W+120),uy=H*.18+Math.sin(a*20)*4;drawSprite(x,GLYPH.ufo,ux,uy,px);if(a>.3&&a<.7){x.globalAlpha=.18;for(let k=0;k<12;k++)x.fillRect(Math.round(ux+px*2-k*.5),Math.round(uy+px*4+k*px*1.4),px*5+k,px);x.globalAlpha=1;}if(a>.5)met('ufo');}
  else if(V.k==='visitor'){const b=BUD.list[V.id],bx=W+20-a*(W+40+b.w*px),by=H-ROWS*P-b.h*px-4-Math.abs(Math.sin(a*30))*px*2;drawSprite(x,b.rows,bx,by,px);
    if(Math.floor(t*2)%2)drawSprite(x,GLYPH.wave,bx-4*px,by-2*px,Math.max(2,px-1));if(a>.4){met('visitor');met('b',V.id);}}}
/* poke the buddies: each one squeaks and hops. Poke Dino five times quickly and something odd happens */
let pokes=[];
stage.addEventListener('pointerdown',e=>{const r=stage.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  const hit=[...HITS].reverse().find(o=>px>=o.x-6&&px<=o.x+o.w+6&&py>=o.y-8&&py<=o.y+o.h+6);if(hit)pokeBuddy(hit);});
function pokeBuddy(hit){
  ensureAudio();lastInput=pnow();buzz(10);const w=WALK.get(hit.id);if(w){w.jumpAt=pnow();w.jumpH=6*excite();}
  try{const bb=liveBand();if(actx.state!=='running')actx.resume();bb.live(degNote(bb,8+((hit.id*3)%9)),.7,{len:.35});}catch(err){const f=hit.host?880:520+((hit.id*97)%7)*90;blip(f,.11,{to:f*1.7,v:.05});} /* each buddy sings its own note */
  if(hit.host){pokes=pokes.filter(t=>pnow()-t<2.5);pokes.push(pnow());
    if(pokes.length>=5){pokes=[];react('spin',1.6);jumpAll(10,false,true);[784,988,1175,1568,1976].forEach((n,i)=>blip(n,.08,{at:i*.07}));
      $('screen').classList.remove('invert');void $('screen').offsetWidth;$('screen').classList.add('invert');say(BUD.list[hit.id].name+' SAYS HI!');met('poke');}}}
/* the buddies you've met: a gentle record on your shelf. Nothing is locked; it just remembers */
function paintMet(){const box=$('met');if(!box)return;const m=S.met||{b:[],v:{}},n=(m.b||[]).length;
  $('metCount').textContent=n+' / '+BUD.count;
  if(box.childElementCount!==BUD.count){box.textContent='';BUD.list.forEach((B,i)=>{const d=document.createElement('span');d.className='met-b';d.title=B.name;d.appendChild(budCanvas(i,2,INKC));box.appendChild(d);});}
  [...box.children].forEach((d,i)=>{const seen=(m.b||[]).includes(i);d.classList.toggle('seen',seen);d.title=seen?BUD.list[i].name:'not met yet';});
  $('metSeen').innerHTML=[['bird','BAT'],['star','SHOOTING STAR'],['ufo','UFO'],['visitor','A VISITOR'],['poke','DINO SAYS HI']].map(([k,l])=>'<span class="'+(m.v&&m.v[k]?'got':'')+'">'+(m.v&&m.v[k]?'✓ ':'? ')+l+'</span>').join('');}
paintMet();
/* under the machine: how many times you've got the crew home (the route itself is on the screen's sign) */
function paintTonight(){if(BC||!$('homes'))return;const n=S.homes||0;$('homesH').hidden=!n;$('homes').textContent=n===1?'ONCE':n+' TIMES';}
if(!BC)$('sb1').addEventListener('pointerdown',()=>{touched=true;},{passive:true});
/* when the music's been playing a while with nobody touching it (and all through the long videos), Dino settles into
   something: reading, fishing at the sea, a campfire at night, stargazing. Touch anything and he's back */
const ACTS=['read','fish','camp','stars'];let lastAct=0,lastIdle=0;
function startActivity(){const sea=sceneStyle()===4,night=!skyPhase().day;const opts=['read'];if(sea)opts.push('fish','fish');if(night)opts.push('camp','stars');react(pick(opts),24);lastAct=pnow();}
const REACT_busy=()=>REACT&&pnow()-REACT.t0<REACT.dur;
let lastMood='';
function paintStrip(mood,on){if(pnow()-signT>.25){signT=pnow();paintSign();}const m=BC&&Math.floor(pnow()/7)%3===2?'PLAY IT LIVE · SMALLBEATS.COM':'DINO · '+mood;if(m!==lastMood){lastMood=m;$('lcdMood').textContent=m;}
  const sec=Math.floor(counterMs()/1000),tm=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
  $('lcdTime').textContent=(on?'▶ ':isPaused()?'❚❚ ':'■ ')+(cur._side||'A')+' '+tm;}

/* ---------- the lights: step lights on the keyboard's rail, parts that light on their own notes, the player piano ---------- */
const leds=[];for(let i=0;i<16;i++){const l=document.createElement('i');$('beat').appendChild(l);leds.push(l);}
let ledOn=-1,lastFrame=0;const lastHit={};
function frame(){requestAnimationFrame(frame);
  const on=isPlaying(),pms=performance.now(),dt=Math.min(.1,(pms-(lastFrame||pms))/1000);lastFrame=pms;
  let now=0;
  if(actx){now=actx.currentTime;let hop=false;while(VIS.hops.length&&VIS.hops[0]<=now){VIS.hops.shift();hop=true;}
    if(hop&&on){hopUntil=now+.12;}}
  if(BC)bcFrame();
  if(PL&&on&&actx.currentTime>=PL.until)nextOnShelf();
  
  let step=-1;
  if(actx&&on){const h=VIS.hits;let w=0;
    for(let i=0;i<h.length;i+=2){if(h[i]<=now)lastHit[h[i+1]]=h[i];else{h[w++]=h[i];h[w++]=h[i+1];}}h.length=w;
    let b0=null,bi=0;VIS.bars.forEach((b,i)=>{if(b<=now){b0=b;bi=i;}});
    if(b0!=null){step=Math.min(15,Math.floor((now-b0)/VIS.step));}
    if(!calm){const fresh=ps=>ps.some(p=>lastHit[p]!=null&&now-lastHit[p]<.1);
      for(const {D,b} of dialBtns)b.classList.toggle('hit',!!D.hits&&cur[D.k]>0&&fresh(D.hits));
      for(const x of startBtns)x.b.classList.toggle('hit',cur.s===x.st.s&&fresh(['k']));}
    /* the player piano: the tune lights the keys as it plays (softer than the keys you press yourself) */
    const nt=VIS.notes;let m=0;for(let i=0;i<nt.length;i+=2){if(nt[i]<=now){lightNote(nt[i+1]);}else{nt[m++]=nt[i];nt[m++]=nt[i+1];}}nt.length=m;}
  else{for(const {b} of dialBtns)b.classList.remove('hit');for(const x of startBtns)x.b.classList.remove('hit');}
  if(step!==ledOn){if(ledOn>=0)leds[ledOn].classList.remove('on');if(step>=0)leds[step].classList.add('on');ledOn=step;}
  fadeKeys(dt);loopTick();
  if(landAt>0&&actx&&actx.currentTime>=landAt){landAt=-1;tuneAt=actx.currentTime;jumpAll(8);blip(1568,.14,{v:.04});} /* the new tune lands */
  if(on&&!calm&&!REACT_busy()){const quiet=pnow()-lastInput;
    if((BC||quiet>90)&&pnow()-lastAct>(BC?60:75))startActivity();
    else if(quiet>22&&pnow()-lastIdle>(BC?45:14)){lastIdle=pnow();react(pick(['spin','look','dance','yawn']),2.2);}} /* left alone: idle nonsense */
  if(REACT_busy()&&ACTS.includes(REACT.k)&&pnow()-lastInput<.3)REACT=null; /* touch anything and he's back */
  $('play').classList.toggle('attract',attract());
  paintStrip(drawStage(on,now,dt),on);}
requestAnimationFrame(frame);

/* ---------- PLAY ALONG: the keyboard. Every key is a note of the song's pentatonic scale, so there's no wrong note.
   It's a little synth voiced for the style (trance: a supersaw pluck), played into the track through its echo. With the music stopped it still plays.
   PLAYER PIANO: the keys light up with the notes the tape plays, like a player piano's */
let keysBand=null,keysFor='';
function liveBand(){if(gen&&gen.b&&isPlaying())return gen.b;return keysVoice();}
/* the keyboard's own voice: the tape's sound, played through its own channel a little louder than the band, so what you play
   always sits on top. While you play, the band dips (a gentle duck) and comes back when you stop */
const KEYS_GAIN=1.2,DUCK=.6;let ducked=false,lastKeyAt=0;
function keysVoice(){const a=ensureAudio();
  const t=Object.assign({},cur,{w:0}),id=[t.s,t.k,t.r,t.d,t.b,t.p].join();
  if(!keysBand||keysFor!==id){if(keysBand){keysBand.b.src.forEach(x=>{try{x.stop();}catch(e){}});keysBand.g.disconnect();}
    const g=a.createGain();g.gain.value=KEYS_GAIN;g.connect(master);const b=t.s===5&&window.SBC?tranceBand(a,g,t,{quiet:1}):E.band(a,g,Object.assign({},t,{quiet:1}));keysBand={b,g};keysFor=id;}
  return keysBand.b;}
function duck(on){if(!gen||!gen.g||!actx||on===ducked)return;const n=actx.currentTime;if(n<(gen.ready||0))return; /* never in the middle of a fade or a hand-over */
  ducked=on;const p=gen.g.gain;p.cancelScheduledValues(n);p.setValueAtTime(p.value,n);p.setTargetAtTime((gen.trim||1)*(on?DUCK:1),n,on?.03:.3);}
const KB=$('kb');let kbKeys=[],kbNotes=[],kbLv=[],kbWide=null;
const KEYS_WIDE={whites:12,blacks:[0,1,3,4,5,7,8,10]},KEYS_NARROW={whites:8,blacks:[0,1,3,4,5]}; /* a black key after these white keys, like a piano */
function buildKeys(){const wide=!matchMedia('(max-width:760px)').matches&&!document.documentElement.classList.contains('bc-tall');if(wide===kbWide)return;kbWide=wide;const L=wide?KEYS_WIDE:KEYS_NARROW;
  KB.textContent='';kbKeys=[];const bset=new Set(L.blacks);let n=0;
  for(let w=0;w<L.whites;w++){const k=document.createElement('button');k.type='button';k.className='kk kk-w';kbKeys.push(k);KB.appendChild(k);
    if(bset.has(w)&&w<L.whites-1){const b=document.createElement('button');b.type='button';b.className='kk kk-b';b.style.left=`calc(${(w+1)/L.whites*100}% - ${Math.round(wide?15:12)}px)`;b.style.width=(wide?30:24)+'px';kbKeys.push(b);KB.appendChild(b);}}
  kbKeys.forEach((k,i)=>{k.dataset.i=i;k.setAttribute('aria-label','Note '+(i+1));});kbLv=kbKeys.map(()=>0);kbNotes=[];kbFor(gen&&gen.b||null);}
/* the notes under the keys: the pentatonic scale of the song, rising left to right from around the C below middle C */
function kbFor(b){const sc=b&&b.scale||[0,2,3,5,7,8,10],minor=sc[2]===3,pent=minor?[0,3,5,7,10]:[0,2,4,7,9],key=b&&b.key!=null?b.key:0,n=kbKeys.length;
  let root=36+((key%12)+12)%12;if(n<=13)root+=12;const out=[];for(let o=0;out.length<n;o++)for(const d of pent){if(out.length<n)out.push(root+12*o+d);}kbNotes=out;}
function lightKey(i,v){if(i<0||i>=kbKeys.length)return;kbLv[i]=Math.max(kbLv[i],v);kbKeys[i].style.setProperty('--lv',kbLv[i].toFixed(2));}
function lightNote(m){if(!kbNotes.length)return;const lo=kbNotes[0],hi=kbNotes[kbNotes.length-1];while(m<lo)m+=12;while(m>hi)m-=12;
  let best=0,bd=99;kbNotes.forEach((x,i)=>{const d=Math.abs(x-m);if(d<bd){bd=d;best=i;}});lightKey(best,.6);}
function fadeKeys(dt){for(let i=0;i<kbLv.length;i++)if(kbLv[i]>0){kbLv[i]=Math.max(0,kbLv[i]-dt*1.8);kbKeys[i].style.setProperty('--lv',kbLv[i].toFixed(2));}}
/* a key held down holds its note; let go and it fades. While the music plays, what you play joins the song (PLAY ALONG) */
function hitKey(i){const k=kbKeys[i];if(!k)return null;let h=null;try{const b=keysVoice();if(actx.state!=='running')actx.resume();if(!kbNotes.length)kbFor(gen&&gen.b||b);h=b.live(kbNotes[i],.9);}catch(e){}
  lastKeyAt=pnow();if(isPlaying())duck(true);
  lightKey(i,1);k.classList.add('down');jumpAll(2,true);lastInput=pnow();const note={i,at:actx?actx.currentTime:0,h,k};loopDown(note);return note;}
function releaseKey(note){if(!note)return;try{note.h&&note.h.off();}catch(e){}note.k.classList.remove('down');loopUp(note);}
/* ---------- the keyboard's notes, kept as part of the tape (see PLAY ALONG below).
   Notes snap to the nearest sixteenth and are stored as scale steps, so a NEW tune or a new sound keeps them in tune. CLEAR MY NOTES takes them out (UNDO brings them back) */
const PENT=sc=>(sc&&sc[2]===3)?[0,3,5,7,10]:[0,2,4,7,9];
const degNote=(b,d)=>{const p=PENT(b&&b.scale),k=((b&&b.key!=null?b.key:0)%12+12)%12;return 36+k+12*Math.floor(d/5)+p[d%5];};
const noteDeg=(b,m)=>{for(let d=0;d<40;d++)if(degNote(b,d)===m)return d;return 0;};
const B36='0123456789abcdefghijklmnopqrstuvwxyz';
const loopNotes=m=>{const o=[];for(let i=0;i+2<(m||'').length;i+=3)o.push({s:B36.indexOf(m[i]),d:B36.indexOf(m[i+1]),l:B36.indexOf(m[i+2])});return o;};
const loopCode=ns=>ns.slice(0,48).map(n=>B36[n.s&31]+B36[Math.min(35,n.d)]+B36[Math.max(1,Math.min(16,n.l))]).join('');
/* PLAY ALONG: while the music plays, whatever you play on the keys joins the song. Play, stop for a moment, and your last two bars
   become part of the tape (they repeat, and go with the link). Play again and the new notes take their place. CLEAR MY NOTES takes them out; UNDO brings them back */
const HEARD=[];let heardAt=0,heardBand=null,added=0,saidAlong=0;
const stepAt=(b,t)=>(t-b.tStart)/b.step;
const playingAlong=()=>HEARD.length&&pnow()-heardAt<1.6;
function loopDown(note){const b=gen&&gen.b;if(BC||!b||!isPlaying())return; /* a broadcast's demo riffs never change the tape */note.st=Math.round(stepAt(b,note.at));note.d=noteDeg(b,kbNotes[note.i]);note.b=b;
  if(!playingAlong()&&pnow()-saidAlong>8){saidAlong=pnow();say('PLAYING ALONG · STOP WHEN YOU LIKE IT');}heardAt=pnow();paintLoop();}
function loopUp(note){const b=gen&&gen.b;if(!b||note.st==null||note.b!==b)return;if(b!==heardBand){heardBand=b;HEARD.length=0;}
  HEARD.push({st:note.st,d:note.d,l:Math.max(1,Math.min(16,Math.round((actx.currentTime-note.at)/b.step)))});while(HEARD.length>1&&HEARD[0].st<note.st-48)HEARD.shift();heardAt=pnow();}
/* the last two bars you played, snapped to the bar; one bar's worth fills both */
function phrase(){const last=Math.max(...HEARD.map(n=>n.st)),end=Math.ceil((last+1)/16)*16,from=end-32,ns=[];
  const inn=HEARD.filter(n=>n.st>=from),one=inn.every(n=>n.st>=end-16);
  for(const n of inn){const s=((n.st%32)+32)%32;ns.push({s,d:n.d,l:n.l});if(one)ns.push({s:(s+16)%32,d:n.d,l:n.l});}
  return ns.sort((p,q)=>p.s-q.s).slice(0,48);}
function paintLoop(){const el=$('loopBtn'),st=playingAlong()&&isPlaying()?'rec':cur.m?'on':'off';if(el.dataset.state===st)return;el.dataset.state=st;
  $('loopT').textContent=st==='on'?'CLEAR MY NOTES':'PLAY ALONG';el.setAttribute('aria-label',st==='on'?'Take your notes out of the song':'Play along: what you play on the keys joins the song');}
$('loopBtn').addEventListener('click',()=>{SFX.loop();showParts(false);
  if(cur.m&&!playingAlong()){edit(t=>{delete t.m;});HEARD.length=0;paintLoop();say('YOUR NOTES ARE OUT · UNDO PUTS THEM BACK');return;}
  if(!isPlaying())play(cur);say('PLAY THE KEYS · WHAT YOU PLAY JOINS THE SONG');});
/* your notes' own scheduler: a quarter second ahead, through the band's keyboard voice. While you're playing along they hush, so you're in charge */
let loopNext=-1,loopBand=null;
function loopTick(){if(ducked&&!KB.querySelector('.down')&&pnow()-lastKeyAt>.8)duck(false);const b=gen&&gen.b;if(!b||!isPlaying()){loopNext=-1;paintLoop();return;}
  if(HEARD.length&&heardBand===b&&heardAt!==added&&!KB.querySelector('.down')&&pnow()-heardAt>Math.max(1.2,b.step*10)){added=heardAt;
    if(HEARD.length>=3){const ns=phrase();HEARD.length=0;edit(t=>{t.m=loopCode(ns);});say('ADDED TO THE SONG · UNDO TAKES IT OUT');cheer();track('loop_rec',{},true);}
    else HEARD.length=0;}
  paintLoop();
  if(!cur.m||playingAlong()){loopNext=-1;return;}
  if(b!==loopBand){loopBand=b;loopNext=-1;}
  const ns=loopNotes(cur.m),end=Math.floor(stepAt(b,actx.currentTime+.25));if(loopNext<0)loopNext=Math.max(0,Math.ceil(stepAt(b,actx.currentTime)));
  for(;loopNext<=end;loopNext++){const s=((loopNext%32)+32)%32;for(const n of ns)if(n.s===s){try{b.live(degNote(b,n.d),.7,{t:b.tStart+loopNext*b.step,len:n.l*b.step*.92});}catch(e){}}}}
buildKeys();matchMedia('(max-width:760px)').addEventListener('change',buildKeys);
/* phones: the keyboard and the six part keys share the bottom of the machine, so the keys always fit on the screen. KEYBOARD / PARTS swaps them */
function showParts(on){$('sb1').classList.toggle('parts',on);$('tabKeys').setAttribute('aria-pressed',String(!on));$('tabParts').setAttribute('aria-pressed',String(on));}
$('tabKeys').addEventListener('click',()=>{SFX.part&&SFX.part(1);showParts(false);});$('tabParts').addEventListener('click',()=>{SFX.part&&SFX.part(1);showParts(true);});
const held=new Map(); /* finger -> key, so you can slide along the keys and play with more than one finger */
KB.addEventListener('pointerdown',e=>{const k=e.target.closest('.kk');if(!k)return;e.preventDefault();try{KB.releasePointerCapture(e.pointerId);}catch(x){}held.set(e.pointerId,{k,note:hitKey(+k.dataset.i)});});
addEventListener('pointermove',e=>{const h=held.get(e.pointerId);if(!h)return;const el=document.elementFromPoint(e.clientX,e.clientY),k=el&&el.closest&&el.closest('.kk');if(k&&k!==h.k){releaseKey(h.note);held.set(e.pointerId,{k,note:hitKey(+k.dataset.i)});}});
['pointerup','pointercancel'].forEach(n=>addEventListener(n,e=>{const h=held.get(e.pointerId);if(h){releaseKey(h.note);held.delete(e.pointerId);}}));
KB.addEventListener('click',e=>{const k=e.target.closest('.kk');if(k&&e.detail===0){const n=hitKey(+k.dataset.i);setTimeout(()=>releaseKey(n),250);}}); /* Enter or Space on a focused key */

/* ---------- share picture: the cassette on a card, 1200 x 630, with the buddy glowing beside it ---------- */
async function shareCard(t){await document.fonts.ready;const c=document.createElement('canvas');c.width=1200;c.height=630;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  drawCard(x,t);return new Promise(r=>c.toBlob(r,'image/png'));}
function drawCard(x,t){
  x.fillStyle='#2a1915';x.fillRect(0,0,1200,630);
  for(let yy=10;yy<630;yy+=20)for(let xx=10;xx<1200;xx+=20){x.fillStyle='#35211b';x.fillRect(xx,yy,4,4);} /* dot texture */
  drawCassette(x,70,110,640,t);
  const b=BUD.list[BUD.norm(t.t)],px=Math.floor(150/Math.max(b.w,b.h));
  x.fillStyle='#140b08';x.fillRect(766,66,198,198);x.fillStyle=LCD;x.fillRect(770,70,190,190);x.fillStyle=INKC;BUD.draw(x,b,770+(190-b.w*px)/2,70+(190-b.h*px)/2,px);
  x.fillStyle='#efe6d2';x.font='400 40px Silk';const words=t.n.split(' ');let line='',y=330;const lines=[];for(const w of words){const c=line?line+' '+w:w;if(x.measureText(c).width>390&&line){lines.push(line);line=w;}else line=c;}lines.push(line);
  for(const l of lines.slice(0,3)){x.fillText(l,770,y);y+=50;}
  if(t.by||t.from){x.fillStyle='#a39a8b';x.font='400 26px Plex';x.fillText(t.by?'mixed by '+t.by:'remixed from '+t.from,772,y+2);}
  x.fillStyle='#efe6d2';x.font='400 22px Silk';x.fillText('MADE ON SMALL BEATS',770,540);
  x.fillStyle='#e8a33a';x.fillText('SMALLBEATS.COM',770,578);}
function drawCassette(x,X,Y,W,t){const u=Math.max(1,Math.floor(W/CW)),{cells,sh}=cassPix(t,0); /* whole-pixel cells, so no seams */
  for(let y=0;y<CH2;y++)for(let i=0;i<CW;i++){const v=cells[y*CW+i];if(v){x.fillStyle=v;x.fillRect(X+i*u,Y+y*u,u,u);}}
  const T=(tx,ty,sz,v,f)=>{x.font='400 '+sz*u+'px Silk';x.textAlign='left';x.fillStyle=f||sh.ink;x.fillText(v,X+tx*u,Y+ty*u);};
  labelText(t).forEach(a=>T(...a));x.fillStyle=sh.ink;x.fillRect(X+40*u,Y+3.6*u,2.6*u,2.8*u);T(40.45,5.95,2,'A',sh.lab);
  const b=BUD.list[BUD.norm(t.t)],k=STAMP.size*u/Math.max(b.w,b.h);x.save();x.translate(X+STAMP.x*u,Y+STAMP.y*u);x.rotate(stampTilt(t)*Math.PI/180);x.globalAlpha=.88;x.fillStyle=sh.ink;BUD.draw(x,b,-b.w*k/2,-b.h*k/2,k);x.restore();}
window.SB_drawCard=drawCard;window.SB_drawCassette=drawCassette; /* used to make the site's preview image */

/* ---------- the stripe across the top ---------- */
const STRIPE=['#f2e7d0','#e9b44c','#e2734a','#c23b4b','#8a5a3c']; /* cream, gold, orange, red, brown */
function drawStripe(){const cv=$('stripe');if(!cv||BC)return;
  const W=document.documentElement.clientWidth,phone=W<=900,P=4,ST=W<=760?2:3,GAP=1,BAND=5*ST+4*GAP; /* phones: a slimmer stripe, so the machine fits */ /* in 4px cells: chunky, like the band behind the machine */
  const top=document.querySelector('.top').getBoundingClientRect(),sy=window.scrollY,nav=document.querySelector('.nav').getBoundingClientRect();
  const logo=document.querySelector('.brand-logo').getBoundingClientRect(),cw=Math.ceil(W/P),y0=phone?Math.round((top.bottom+sy+4)/P):Math.ceil((logo.bottom+14+sy)/P),ch=y0+BAND+1; /* computers: just under the logo */
  const xc=phone?cw+99:Math.round((nav.left-28)/P)-BAND-6,rin=8,cy=y0-rin; /* and up before the links */
  cv.width=cw;cv.height=ch;cv.style.width=cw*P+'px';cv.style.height=ch*P+'px';const x=cv.getContext('2d');
  const col=d=>{const k=Math.floor(d);if(k<0||k>=BAND)return null;const o=k%(ST+GAP);return o<ST?STRIPE[Math.floor(k/(ST+GAP))]:null;};
  for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){let c;
    if(i<xc)c=j>=y0?col(j-y0):null;
    else if(j>=cy)c=col(Math.hypot(i-xc+.5,j-cy+.5)-rin); /* the bend: a round corner, drawn in the same chunky cells */
    else c=col(i-xc-rin);
    if(c){x.fillStyle=c;x.fillRect(i,j,1,1);}}}
let stripeT;addEventListener('resize',()=>{clearTimeout(stripeT);stripeT=setTimeout(drawStripe,120);});
/* the same five colours, bold, as a pixel band running up behind the machine, on a 2:1 pixel diagonal, like an 80s poster */
function drawBand(){if(BC)return;const deck=$('make');let cv=$('deckBand');if(!cv){cv=document.createElement('canvas');cv.id='deckBand';cv.className='deck-band';cv.setAttribute('aria-hidden','true');deck.prepend(cv);}
  const P=4,ST=4,GAP=1,BAND=5*ST+4*GAP,W=document.documentElement.clientWidth,r=deck.getBoundingClientRect(),cw=Math.ceil(W/P),ch=Math.ceil(r.height/P);
  cv.width=cw;cv.height=ch;cv.style.width=cw*P+'px';cv.style.height=ch*P+'px';cv.style.left=(-r.left)+'px';const x=cv.getContext('2d');
  const mid=ch*.52;for(let i=0;i<cw;i++){const top=Math.floor(mid-BAND/2-(i-cw/2)/2);for(let k=0;k<BAND;k++){const o=k%(ST+GAP);if(o>=ST)continue;x.fillStyle=STRIPE[Math.floor(k/(ST+GAP))];x.fillRect(i,top+k,1,1);}}}
if(!BC){drawBand();addEventListener('resize',()=>{clearTimeout(drawBand._t);drawBand._t=setTimeout(drawBand,120);});if(window.ResizeObserver)new ResizeObserver(()=>{clearTimeout(drawBand._t);drawBand._t=setTimeout(drawBand,60);}).observe($('make'));}
const logoImg=document.querySelector('.brand-logo');if(logoImg.complete)drawStripe();else logoImg.addEventListener('load',drawStripe);
if(document.fonts)document.fonts.ready.then(drawStripe);

/* ---------- broadcast: the whole machine plays the tapes, for long-play videos and Shorts ---------- */
let bcFrame=()=>{},paintCredits=()=>{};
/* Broadcast mode, for long-play videos and Shorts (the Studio, /studio.html, builds these addresses):
   ?broadcast=video&tape=…[&tape=…] plays one tape, or several in turn, EACH minutes apiece (default 10) with a slow crossfade,
   round and round; &shuffle=1 mixes up the order; &vol=0.8 sets the volume; &ask=0 never asks for tape links.
   What's on screen is the machine itself, playing: the screen and its buddies, the tape turning in the door (it winds across,
   and turns over to the other side each time it comes round), the six parts lighting on their notes, the player piano, and a
   credits strip along the bottom: NOW PLAYING, MIXED BY, NEXT, and now and then a call for tape links. Landscape is laid out
   for YouTube (16:9); portrait stacks it for Shorts (9:16). The tape's texture drifts softly behind; every four minutes the
   machine shifts a few pixels so nothing burns into a screen. */
if(BC){const root=document.documentElement;root.classList.add('broadcast');
  const list=Q.getAll('tape').map(decodeTape).filter(Boolean),tapes=(list.length?list:[draft]).map(t=>Object.assign({},t,{_side:'A',_prog:0,_plays:0}));
  if(Q.get('shuffle')==='1')for(let i=tapes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tapes[i],tapes[j]]=[tapes[j],tapes[i]];}
  const each=60*Math.max(1,Math.min(240,+Q.get('each')||10)),ask=Q.get('ask')!=='0';
  if(Q.get('vol'))S.vol=Math.max(0,Math.min(1,+Q.get('vol')));
  const el=(tag,cls,parent)=>{const e=document.createElement(tag);e.className=cls;(parent||document.body).appendChild(e);return e;};
  const sky=el('canvas','bc-sky');document.body.prepend(sky);
  const grain=el('div','bc-grain');{const g=document.createElement('canvas');g.width=g.height=128;const gx=g.getContext('2d'); /* a tile of faint grain */
    for(let i=0;i<700;i++){gx.fillStyle=Math.random()<.5?'rgba(255,240,220,.05)':'rgba(0,0,0,.09)';gx.fillRect(Math.floor(Math.random()*128),Math.floor(Math.random()*128),1,1);}
    grain.style.backgroundImage=`url(${g.toDataURL()})`;grain.style.backgroundSize=(4*128)+'px';}
  $('credits').hidden=false;
  {const q=el('div','cr-qr',$('credits'));q.innerHTML='<span>SCAN TO PLAY<br>THIS TAPE<br>YOURSELF</span><canvas id="crQRc" width="96" height="96"></canvas>';
    const lg=el('img','cr-logo',$('credits'));lg.src='icons/stamp-4.png';lg.alt='Small Beats';} /* the logo, stamped on the machine: lower right, under the keys */
  const prog=el('div','bc-prog',$('door'));prog.innerHTML='<span class="bc-prog-t"><b id="bcSide">SIDE A</b><b id="bcLeft"></b></span><span class="bc-prog-bar"><i id="bcBar"></i></span>';
  /* fit the machine to the frame: laid out at a fixed size, then scaled to fill it */
  /* the brand, as on the site: the bold diagonal stripe running behind the machine (the logo is stamped on the machine, in the credits) */
  const band=el('canvas','bc-band',$('make'));$('make').prepend(band);
  const drawBand2=()=>{const P=8,ST=4,GAP=1,BAND=5*ST+4*GAP,cw=Math.ceil(innerWidth/P)+2,ch=Math.ceil(innerHeight/P)+2;band.width=cw;band.height=ch;band.style.width=cw*P+'px';band.style.height=ch*P+'px';
    const x=band.getContext('2d'),tall=innerHeight>innerWidth,mid=ch*(tall?.6:.55),slope=tall?1:.5;
    for(let i=0;i<cw;i++){const top=Math.floor(mid-BAND/2-(i-cw/2)*slope);for(let k=0;k<BAND;k++){const o=k%(ST+GAP);if(o>=ST)continue;x.fillStyle=STRIPE[Math.floor(k/(ST+GAP))];x.fillRect(i,top+k,1,1);}}};
  const fitMachine=()=>{const tall=innerHeight>innerWidth;root.classList.toggle('bc-tall',tall);buildKeys();const m=$('sb1');m.style.transform='none';
    const top=0;
    const w=m.offsetWidth,h=m.offsetHeight,s=Math.min(innerWidth*.95/w,(innerHeight-top)*.95/h);window.BCS=s;
    m.style.transform=`translate(${Math.round((innerWidth-w*s)/2)}px,${Math.round(top+(innerHeight-top-h*s)/2)}px) scale(${s})`;sizeStage();
    drawBand2();};
  addEventListener('resize',fitMachine);
  const fade=(e,txt)=>{e.classList.remove('in','out');void e.offsetWidth;if(txt!==undefined)e.textContent=txt;e.classList.add('in');};
  let segStart=0,segN=0,asked=0;
  paintCredits=()=>{const t=BQ.tapes[BQ.i]||cur;$('crName').textContent=t.n;$('crBy').textContent=(t.by||'SMALL BEATS').toUpperCase()+(t.from?' · REMIX OF '+t.from.toUpperCase():'');};
  const show=t=>{cur=t;paint();fade($('crName'));fade($('crBy'));if(t.by&&!/^small beats$/i.test(t.by))setTimeout(()=>say('SMALL MAIL FROM '+t.by.toUpperCase(),7000),1800); /* a viewer's tape on air */if(!root.classList.contains('bc-tall'))drawQR($('crQRc'),'https://smallbeats.com/?tape='+encodeTape(t),96);
    $('crNext').textContent=BQ.tapes.length>1?'NEXT ▸ '+BQ.tapes[(BQ.i+1)%BQ.tapes.length].n+(BQ.tapes[(BQ.i+1)%BQ.tapes.length].by?' · MIXED BY '+BQ.tapes[(BQ.i+1)%BQ.tapes.length].by.toUpperCase():''):'SIDE '+(t._side||'A');asked=0;};
  var BQ={tapes,i:0,each,until:0};window.SB_BQ=BQ;
  tapes[0]._plays=1;show(tapes[0]);fitMachine();if(document.fonts)document.fonts.ready.then(fitMachine);
  const go=()=>{play(tapes[0]);segStart=actx.currentTime;if(BC_NIGHT)bootAt=pnow(); /* an episode opens like the site: SMALL BEATS, DINO & THE CREW, then the NIGHT card */BQ.until=segStart+each;
    if(actx.state!=='running'){const b=document.createElement('button');b.className='pb pb-big';b.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);--c:var(--green);z-index:9';b.textContent='▶ START';b.onclick=()=>{actx.resume();b.remove();};document.body.appendChild(b);}};
  go();
  /* the turn: the next tape (or, with one tape, the same one turned over); each time a tape comes round again it plays its other side */
  window.SB_bcNext=()=>{segN++;const old=BQ.tapes[BQ.i];
    if(BQ.tapes.length>1){BQ.i=(BQ.i+1)%BQ.tapes.length;const t=BQ.tapes[BQ.i];t._plays=(t._plays||0)+1;t._side=t._plays%2?'A':'B';t._prog=0;start(t,3);show(t);routeNextTape(BQ.i);}
    else{old._side=old._side==='A'?'B':'A';old._prog=0;show(old);}
    segStart=actx.currentTime;BQ.until=segStart+BQ.each;};
  const fit=c=>{const r=c.getBoundingClientRect(),d=window.devicePixelRatio||1,w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}return c.getContext('2d');};
  const drops=[],embers=[];let skyT=0,driftT=0,shiftT=0,shiftK=0,lastT=0,crT=0;
  bcFrame=()=>{if(!actx)return;const now=actx.currentTime,on=isPlaying(),dt=Math.min(.1,Math.max(0,now-lastT));lastT=now;
    const t=BQ.tapes[BQ.i],into=now-segStart;
    if(on&&now>=BQ.until)window.SB_bcNext();
    const pr=Math.max(0,Math.min(1,into/BQ.each));if(Math.abs((t._prog||0)-pr)>.01){t._prog=pr;fillCass(deckCass,t);}
    if((crT+=dt)>.25){crT=0;const left=Math.max(0,BQ.until-now);$('bcSide').textContent='SIDE '+(t._side||'A');$('bcLeft').textContent=Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0')+' LEFT';$('bcBar').style.width=(pr*100).toFixed(1)+'%';}
    if(on){const askNow=ask&&(BQ.tapes.length>1?segN%3===2:segN%2===1)||ask&&into>BQ.each*.5&&asked===0&&segN===0&&BQ.each>240;
      if(askNow&&asked===0&&into>120){root.classList.add('bc-asking');asked=1;}if(asked===1&&into>150){root.classList.remove('bc-asking');asked=2;}}
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
    if((shiftT+=dt)>240){shiftT=0;shiftK=(shiftK+1)%4;const o=[[0,0],[4,-3],[-3,4],[3,3]][shiftK];root.style.setProperty('--bx',o[0]+'px');root.style.setProperty('--by',o[1]+'px');}};
  /* DEMO HANDS (&demo=0 turns them off): now and then a little pixel hand plays the machine, so it's plain this is an instrument
     you can play, not a video. Long videos: a riff on the keys every few minutes, or five pokes for Dino; the tape itself never changes.
     Shorts: a quick tour every minute: a riff, a new bass, rain, Dino, new keys */
  if(Q.get('demo')!=='0'){
    const HAND=['....##......','...#oo#.....','...#oo#.....','...#oo#.....','...#oo###...','...#oo#oo##.','.###oo#oo#o#','#oo#ooooooo#','#oooooooooo#','#oooooooooo#','.#ooooooooo#','.#oooooooo#.','..#ooooooo#.','..#########.'];
    const hand=el('div','bc-hand',$('sb1'));hand.setAttribute('aria-hidden','true');
    hand.innerHTML='<svg viewBox="0 0 12 14" shape-rendering="crispEdges">'+HAND.map((row,y)=>[...row].map((c,x)=>c==='.'?'':`<rect x="${x}" y="${y}" width="1" height="1" fill="${c==='#'?'#1d1c21':'#f2e7d0'}"/>`).join('')).join('')+'</svg>';
    const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
    const at=e=>{const a=e.getBoundingClientRect(),m=$('sb1').getBoundingClientRect(),k=window.BCS||1;return {x:(a.left-m.left)/k,y:(a.top-m.top)/k,w:a.width/k,h:a.height/k};};
    const moveTo=async(x,y,ms)=>{if(!hand.classList.contains('on')){hand.style.transitionDuration='0ms';hand.style.transform=`translate(${Math.round(x+40)}px,${Math.round(y+160)}px)`;void hand.offsetWidth;} /* comes in from below, never flies across the screen */
      hand.style.transitionDuration=(ms||450)+'ms';hand.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;hand.classList.add('on');await wait(ms||450);};
    const away=async()=>{const m=$('sb1');await moveTo(m.offsetWidth*.62,m.offsetHeight+40,600);hand.classList.remove('on');};
    const RIFFS=[[[4,.5],[6,.5],[7,.5],[6,.5],[4,1],[3,.5],[4,1.5]],[[7,.5],[6,.5],[4,.5],[6,.5],[7,1],[9,.5],[7,1.5]],[[2,.5],[4,.5],[6,1],[7,.5],[6,.5],[4,1],[2,1]],[[6,1],[7,.5],[9,.5],[7,1],[6,.5],[4,.5],[6,1]]];let rk=0;
    const riff=async()=>{const b=gen&&gen.b;if(!b||!kbKeys.length)return;const R=RIFFS[rk++%RIFFS.length],base=Math.max(0,Math.floor(kbKeys.length/2)-5);
      let k0=at(kbKeys[Math.min(kbKeys.length-1,base+R[0][0])]);await moveTo(k0.x+k0.w/2,k0.y+k0.h*.45,700);
      const nb=b.tStart+Math.ceil((actx.currentTime+.15-b.tStart)/b.beat)*b.beat;await wait(Math.max(0,(nb-actx.currentTime)*1000)); /* in time: from the next beat */
      say('♪ PLAYING ALONG, LIVE',4200);
      for(const [d,len] of R){const i=Math.min(kbKeys.length-1,base+d),p=at(kbKeys[i]);await moveTo(p.x+p.w/2,p.y+p.h*.45,70);
        const n=hitKey(i);hand.classList.add('press');await wait(Math.max(60,len*b.beat*1000-70));releaseKey(n);hand.classList.remove('press');}
      await away();say('YOU CAN TOO · SMALLBEATS.COM',3200);};
    const pokeDino=async()=>{for(let k=0;k<5;k++){const h=HITS.find(o=>o.host);if(!h)return;const s=at(stage);
        await moveTo(s.x+h.x+h.w*.55,s.y+h.y+h.h*.35,k?160:800);hand.classList.add('press');pokeBuddy(h);await wait(110);hand.classList.remove('press');await wait(120);}
      await away();};
    const tapDial=async(key,want)=>{const d=dialBtns.find(x=>x.D.k===key);if(!d)return;const p=at(d.b);await moveTo(p.x+p.w*.5,p.y+p.h*.55,800);
      for(let n=0;n<4;n++){const i=d.D.opts.findIndex(o=>o[0]===cur[key]),nx=d.D.opts[(i+1)%d.D.opts.length][0];
        hand.classList.add('press');d.b.classList.add('pressed');SFX.part(nx>0);await wait(120);hand.classList.remove('press');d.b.classList.remove('pressed');
        const was=cur[key],t2=Object.assign({},cur,{[key]:nx});BQ.tapes[BQ.i]=t2;cur=t2;paint();restart();say(d.D.name+' · '+dialLabel(d.D,nx));
        if(key==='d'&&nx===0)react('confused',3);else if(key==='d'&&was===0)jumpAll(10,false,true);else jumpAll(5);
        if(want==null||nx===want)break;await wait(380);}
      await wait(300);await away();};
    const tall=()=>root.classList.contains('bc-tall');
    (async()=>{while(!isPlaying())await wait(500);
      if(tall()){const SCRIPT=[[4,riff],[13,()=>tapDial('d',0)],[19,()=>tapDial('d',1)],[26,()=>tapDial('w',1)],[35,riff],[46,pokeDino],[54,()=>tapDial('b')]];let t0=pnow();
        for(;;){for(const [sec,fn] of SCRIPT){while(pnow()-t0<sec)await wait(200);if(isPlaying())await fn();}while(pnow()-t0<62)await wait(200);t0=pnow();}}
      else{await wait(40000);for(let k=0;;k++){if(isPlaying())await [riff,pokeDino,riff][k%3]();await wait(200000);}}})();}
}

paint();
if(!BC)try{console.log('%cSMALL BEATS','font:700 14px monospace;color:#e8a33a');console.log('%cEverything you hear is made in this tab, a bar at a time. No recordings.','color:#a39a8b');}catch(e){}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
