/* Small Beats · the composer, used for TRANCE (app.js tranceBand).
   Turns a song, which is plain data (the tape's settings, made into tracks by tranceBand), into notes, one bar at a time. Every
   musical choice comes from a seed, so the same tape always plays the same notes. Nothing here makes a sound: engine.js plays what this writes.
   Each track has a pattern (made from its seed and variation) that loops, plus a few seeded choices per bar (fills, ghost
   notes, riffs) so it breathes. ENERGY works by rank: every optional hit has a level it needs, so turning Energy up adds hits
   on top of the same groove and turning it down takes them away in reverse.
   Trance is the genre in use; lo-fi stays as the base the trance writers build on (and the fallback). */
(function(){
"use strict";
const {CH,SCALE,HARMONY,seeded,makeHook,parseProg}=window.SBE.theory;
const SBC=window.SBC={};
const rngOf=(...k)=>seeded(k.join(':'));
const pk=(R,a)=>a[Math.floor(R()*a.length)];
const between=(R,lo,hi)=>lo+R()*(hi-lo);
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));

/* the sounds each track can use, per genre. The first is the usual one */
/* recipe: the engine settings for the genre's mix (s sound, d drums: the kit, the room, the pump, the cassette or not) */
const GENRES={lofi:{name:'LO-FI',bpm:70,swing:.14,recipe:{s:0,d:2},
    sounds:{drums:['boombap','soft'],bass:['warm','deep','synth','wave'],chords:['ep','nyl','pad'],melody:['ep','nyl','glass'],perc:['shaker','brush','rim'],texture:['hiss','rain','fire']}},
  trance:{name:'TRANCE',bpm:138,swing:0,recipe:{s:1,d:1},bpc:2,mute:['texture'],
    /* big plain minor triads, two bars each: i VI III VII and friends (roots in semitones above the key) */
    harm:{scale:'aeo',progs:['0min 8maj 3maj 10maj','0min 5min 8maj 10maj','8maj 10maj 0min 0min','0min 10maj 8maj 10maj','0min 3maj 10maj 8maj','5min 8maj 0min 10maj']},
    sounds:{drums:['trance','hard'],bass:['off','roll','wave'],chords:['gate','saw','pad'],melody:['lead','pluck','glass'],perc:['shaker','ride','rim'],texture:['rain','hiss','fire']}}};
SBC.GENRES=GENRES;

/* a hit is [step, velocity, energy it needs, chance per bar] */
const nudge=R=>n=>n?clamp(n+(R()-.5)*.12,.02,.95):0;
const dedupe=list=>{const seen=new Set();return list.filter(h=>!seen.has(h[0])&&seen.add(h[0]));};

/* ---- drums: kick, snare (or rim) and hats (or brushes) ---- */
const KICKS=[[[10,.7,.15]],[[7,.5,.45],[10,.7,.15]],[[3,.45,.55],[10,.65,.2]],[[8,.6,.3],[10,.55,.5]],[[10,.65,.2],[11,.45,.6]],[[6,.5,.5],[9,.6,.25]]];
function drumPattern(tr){const R=rngOf('drums',tr.seed,tr.vari),j=nudge(R);
  const k=dedupe([[0,.9,0,1],...pk(R,KICKS).map(([s,v,n])=>[s,v,j(n),1]),[pk(R,[13,14,15,2]),.4,j(.8),.6]]);
  const s=[[4,.8,.06,1],[12,.85,.06,1]];for(const g of pk(R,[[7],[15],[7,15],[9],[11,15],[14]]))s.push([g,.2+.1*R(),j(.55),.5]);
  const h=[],sixteen=R()<.5;for(let i=0;i<16;i+=2)h.push([i,(i%4===0?1:.6)*.8,i%4===0?0:j(.25),1]);
  for(let i=1;i<16;i+=2)if(sixteen||i%4===3)h.push([i,.35,j(.8),.8]);
  return {k,s:dedupe(s),h,open:pk(R,[-1,14,6,-1])};}
function drums(c,tr,bi,E,ctx){const P=c.pat.drums,R=rngOf('drums-bar',tr.seed,tr.vari,bi),out=[],soft=tr.sound==='soft';
  if(ctx.bd){for(const i of [2,6,10,14])out.push({i:soft?'brush':'hat',s:i,v:.35});return out;} /* the breakdown: just a hat */
  if(tr.steps){const G=tr.steps; /* drawn on the grid: played as drawn, whatever the Energy */
    for(let i=0;i<16;i++){if(G.k[i])out.push({i:'kick',s:i,v:(i%4===0?.9:.65)*(soft?.7:1)});if(G.s[i])out.push({i:soft?'rim':'snare',s:i,v:(i%4===0?.82:.35)*(soft?.65:1)});
      if(G.h[i])out.push(soft?{i:'brush',s:i,v:i%8===4?.7:.45,long:i%8===4}:{i:'hat',s:i,v:(i%4===0?1:.6)*.8});}
    if(ctx.fill){if(soft)for(const i of [13,14,15])out.push({i:'rim',s:i,v:.35+.1*(i-13)});else out.push({i:'snare',s:14,v:.45},{i:'snare',s:15,v:.6});}
    return out;}
  for(const [s,v,n,p] of P.k)if(E>=n&&R()<p)out.push({i:'kick',s,v:soft?v*.7:v});
  for(const [s,v,n,p] of P.s)if(E>=n&&R()<p)out.push({i:soft?'rim':'snare',s,v:soft?v*.65:v});
  for(const [s,v,n,p] of P.h){if(E<n||R()>=p)continue;
    if(soft){if(s%2===0)out.push({i:'brush',s,v:s%8===4?.7:.45,long:s%8===4});}
    else out.push({i:'hat',s,v,open:s===P.open&&E>=.7});}
  if(ctx.fill){if(soft)for(const i of [13,14,15])out.push({i:'rim',s:i,v:.35+.1*(i-13)});else{out.push({i:'snare',s:14,v:.45},{i:'snare',s:15,v:.6});}}
  return out;}

/* ---- bass: a rhythm of root (R), fifth (F), octave (O) and a note leading into the next chord (A) ---- */
const BASSES=[[[0,'R',6,0],[10,'R',4,.3],[14,'A',2,.7]],
  [[0,'R',3,0],[3,'R',1,.6],[6,'F',2,.35],[10,'R',4,.2],[14,'A',2,.75]],
  [[0,'R',8,0],[8,'O',4,.4],[12,'F',2,.65],[14,'A',2,.8]],
  [[0,'R',10,0],[10,'F',4,.3],[13,'R',1,.7],[14,'A',2,.85]],
  [[0,'R',6,0],[7,'R',2,.45],[10,'O',3,.3],[14,'A',2,.8]]];
function bassPattern(tr){const R=rngOf('bass',tr.seed,tr.vari),j=nudge(R);return {t:pk(R,BASSES).map(([s,d,l,n])=>[s,d,l,j(n)]),lead:pk(R,[-1,2,0,-1])};}
/* synthwave: straight rolling notes (quarters, eighths or sixteenths with Energy), the octave on the 7 and the 15, into the next chord */
function waveBass(c,tr,bi,E){const lo=33,r=c.rootOf(c.chordAt(bi),lo,lo+11),nr=c.rootOf(c.chordAt(bi+1),lo,lo+11),roll=E<.25?4:E<.55?2:1,out=[];
  for(let i=0;i<16;i+=roll){const m=i===16-roll&&nr!==r?nr:(i===6||i===14)&&roll<4?r+12:r;out.push({i:'wave',s:i,st:1,l:roll*.82,n:m,v:i%4===0?1:.78});}
  return out;}
function bass(c,tr,bi,E,ctx){if(ctx.bd)return [];if(tr.sound==='wave')return waveBass(c,tr,bi,E);const P=c.pat.bass,lo=tr.sound==='deep'?33:36,up=tr.sound==='synth'?12:0;
  const r=c.rootOf(c.chordAt(bi),lo,lo+11),f=r+7>lo+16?r-5:r+7,nr=c.rootOf(c.chordAt(bi+1),lo,lo+11);
  const ns=P.t.filter(x=>E>=x[3]);
  return ns.map(([s,d,l],k)=>{const nxt=k+1<ns.length?ns[k+1][0]:16,m=d==='R'?r:d==='F'?f:d==='O'?r+12:nr+P.lead;
    return {i:tr.sound,s,l:Math.min(l,nxt-s),n:m+up,v:s===0?1:.85};});}

/* ---- chords: how the keys comp. hold = most of the bar, long = half, stab = a short top-three, push = next bar's chord, early ---- */
const COMPS=[[[0,'hold',0]],[[0,'hold',0],[10,'stab',.45]],[[0,'long',0],[6,'stab',.55],[10,'stab',.35]],[[0,'hold',0],[14,'push',.5]],[[0,'long',0],[7,'stab',.5],[14,'push',.7]]];
function chordPattern(tr){const R=rngOf('comp',tr.seed,tr.vari),j=nudge(R);
  return {t:pk(R,COMPS).map(([s,k,n])=>[s,k,j(n)]),hold:between(R,9.6,14.4),roll:between(R,.012,.03),every:R()<.5?2:4,strum:R()<.6};}
function chords(c,tr,bi,E,ctx){const P=c.pat.chords,ch=c.chordAt(bi),R=rngOf('chords-bar',tr.seed,tr.vari,bi),out=[],v=between(R,.5,.7);
  if(tr.sound==='pad'){out.push({i:'pad',s:0,l:16,ns:c.voice('pd',ch,48,67),v:.7,att:.6,wave:c.mood===0?'triangle':'sawtooth'});
    if(E>=.45&&!ctx.bd){const ns=c.voice('gl',ch,67,84,false,true),n=E>=.75?2:1;for(let k=0;k<n;k++)if(R()<.4)out.push({i:'glass',s:pk(R,[0,4,8,12])+k*2,n:pk(R,ns),v:between(R,.35,.6)});}
    return out;}
  if(tr.sound==='nyl'){const ns=c.voice('g',ch,48,72),seq=ns.concat(ns.slice(1,-1).reverse()),every=E<.35||(P.every===4&&E<.7)?4:2;
    for(let i=0,k=0;i<16;i+=every,k++)out.push({i:'nyl',s:i,n:seq[k%seq.length],v:.26+.06*R(),l:every*2}); /* fingerpicking */
    if(P.strum&&E>=.3)c.voice('gs',ch,52,69,true).forEach((m,jj)=>out.push({i:'nyl',s:0,o:jj*between(R,.008,.014),n:m,v:(.22+.08*R())*.6*(jj?.9:1),l:3}));
    return out;}
  const ns=c.voice('ep',ch,53,72); /* Rhodes */
  for(const [s,k,n] of P.t){if(E<n)continue;
    if(k==='push'){c.voice('ep',c.chordAt(bi+1),53,72,false,true).slice(-3).forEach((m,jj)=>out.push({i:'ep',s,o:jj*P.roll,n:m,l:4,v:v*.5}));continue;}
    const use=k==='stab'?ns.slice(-3):ns,l=k==='hold'?P.hold:k==='long'?8:3;
    use.forEach((m,jj)=>out.push({i:'ep',s,o:jj*P.roll,n:m,l,v:(k==='stab'?v*.55:v)*(jj&&k!=='stab'?.85:1)}));}
  return out;}

/* ---- melody: the hook every eight bars (as written, a new ending, a rest or a riff, then up a step), little riffs between ---- */
const LEAD_C={ep:74,nyl:72,glass:76,pulse:76,square:76,mallet:72};
function melody(c,tr,bi,E){const R=rngOf('melody-bar',tr.seed,tr.vari,bi),center=LEAD_C[tr.sound]||74,out=[];
  const cur=Math.floor(bi/32)%2?c.hookB(Math.floor(bi/64)):c.pat.melody,improv=.08+.45*E;
  const play=(notes,vel)=>{for(const h of notes){const off=Math.floor(h.p/16),pp=h.p%16,m=c.fit(c.degNote(h.d,center),c.chordAt(bi+off),pp%4===0),s=off*16+pp,v=vel*between(R,.88,1.05);
      if(tr.sound==='nyl')out.push({i:'nyl',s,n:m,l:Math.max(2,h.du),v:.42*v});else out.push({i:tr.sound,lead:1,s,n:m,l:h.du,v});
      if(tr.sound==='ep'&&h.du>=4&&R()<.2)out.push({i:'ep',lead:1,s:s-.5,n:m-1,l:.4,v:v*.5});}}; /* now and then a grace note from below */
  const riff=()=>{const k=1+Math.floor(R()*Math.min(3,cur.length-1)),s0=Math.floor(R()*(cur.length-k)),tp=pk(R,[-2,-1,0,1,2,3]),sh=pk(R,[0,0,2,-2,4]);
    play(cur.slice(s0,s0+k).map(h=>({p:((h.p%16)-(cur[s0].p%16)+pk(R,[0,4,8])+sh+16)%16,d:h.d+tp,du:Math.min(h.du,4)})).filter(h=>h.p<15).sort((x,y)=>x.p-y.p),.8);};
  if(bi%8===2){const v=Math.floor(bi/8)%4;
    if(v===0)play(cur,1);
    else if(v===1)play(cur.map((h,i)=>i===cur.length-1?Object.assign({},h,{d:h.d+pk(R,[-3,-1,2])}):h),.95);
    else if(v===2){if(R()<improv*1.5)riff();}
    else play(cur.map(h=>Object.assign({},h,{d:h.d+2})),.9);}
  else if(bi%8!==3&&bi>=1&&E>=.15&&R()<improv)riff();
  return out;}

/* ---- percussion: shaker, brushes or rim clicks on top of the kit ---- */
const PERCS={shaker:[[[2,.55,.3],[6,.55,.3],[10,.55,.3],[14,.55,.3],[4,.4,.7],[8,.35,.75],[12,.4,.7],[15,.3,.85]],
    [[3,.5,.3],[7,.5,.3],[11,.5,.3],[15,.5,.3],[2,.35,.65],[10,.35,.65],[6,.3,.85],[14,.3,.85]],
    [[2,.5,.3],[3,.3,.6],[6,.5,.3],[7,.3,.6],[10,.5,.3],[11,.3,.6],[14,.5,.3],[15,.3,.6]]],
  brush:[[[4,.7,.3],[12,.7,.3],[0,.45,.35],[8,.45,.35],[2,.4,.65],[6,.4,.65],[10,.4,.65],[14,.4,.65]]],
  rim:[[[7,.4,.3],[14,.45,.4],[3,.3,.65],[10,.3,.75]],[[6,.4,.3],[11,.35,.45],[15,.3,.6],[2,.3,.8]],[[3,.35,.3],[10,.4,.35],[13,.3,.6],[7,.3,.8]]]};
function percPattern(tr){const R=rngOf('perc',tr.seed,tr.vari),j=nudge(R),o={};for(const k in PERCS)o[k]=pk(R,PERCS[k]).map(([s,v,n])=>[s,v,j(n)]);return o;}
function perc(c,tr,bi,E,ctx){const R=rngOf('perc-bar',tr.seed,tr.vari,bi),out=[],cap=ctx.bd?.45:1;
  for(const [s,v,n] of c.pat.perc[tr.sound]||[])if(E>=n&&n<cap&&R()<.92)out.push({i:tr.sound,s,v,long:tr.sound==='brush'&&s%8===4});
  return out;}

/* the texture track has no notes: the engine just plays the room */
GENRES.lofi.write={drums,bass,chords,melody,perc};
/* lo-fi form: 32 bars, a four-bar breakdown (just a hat) from bar 24, fills into each section */
GENRES.lofi.form=(bi,E,seed)=>{const p32=bi%32,bd=bi>=24&&p32>=24&&p32<28,Rb=rngOf('form',seed,bi);
  return {bd,fill:!bd&&(p32===15||p32===31||(E>=.6&&(p32===7||p32===23)))&&Rb()<.8};};

/* ================= TRANCE =================
   64 bars, starting straight in with the hook: main 16, breakdown 8 (no drums or bass, the chords held wide), build 8 (a snare
   roll that speeds up and a riser), drop 16 (a crash, everything in, the lead doubled an octave up), then a 16-bar groove with
   no lead (filters closing down and opening again, a riser at the end) back into the main section */
const tSec=bi=>{const p=((bi%64)+64)%64;return p<16?{n:'main',p}:p<24?{n:'break',p:p-16}:p<32?{n:'build',p:p-24}:p<48?{n:'drop',p:p-32}:{n:'intro',p:p-48};};
GENRES.trance.form=bi=>({sec:tSec(bi)});
const GATES=['1010101010101010','1011101110111011','1101101101101101','1110111011101110','1001101110011011'].map(g=>[...g].map(Number));
const ARPS=[[0,1,2,3,2,1],[0,2,1,3],[0,1,2,1],[3,2,1,0],[0,2,3,1,2,0]];
function tDrums(c,tr,bi,E,ctx){const s=ctx.sec,R=rngOf('tdrums',tr.seed,tr.vari),hard=tr.sound==='hard',out=[];
  const sixteen=R()<.5,ghost=pk(R,[7,15,11,13]),snr=hard?'snare':'clap';
  if(s.n==='break')return [];
  if(s.n==='build'){const rate=s.p<4?4:s.p<6?2:1;for(let i=0;i<16;i+=rate)out.push({i:snr,s:i,v:.2+.6*((s.p*16+i)/128)});
    if(s.p===0)out.push({i:'riser',s:0,l:128,v:1});return out;}
  if(s.p===0&&(s.n==='drop'||s.n==='main'))out.push({i:'crash',s:0,v:1});
  if(s.n==='intro'&&s.p===12)out.push({i:'riser',s:0,l:64,v:.6});
  if(tr.steps){const G=tr.steps;for(let i=0;i<16;i++){if(G.k[i])out.push({i:'hkick',s:i,v:i%4===0?1:.7});if(G.s[i])out.push({i:hard?'rim':'clap',s:i,v:i%4===0?.82:.35});
      if(G.h[i])out.push({i:'hat',s:i,v:i%4===2?.5:.35,open:i%4===2});}
    if(s.p===15)for(const i of [13,14,15])out.push({i:'snare',s:i,v:.4+.1*(i-13)});return out;}
  for(const i of [0,4,8,12])out.push({i:'hkick',s:i,v:1});
  if(!(s.n==='intro'&&s.p<8)&&E>=.08)out.push({i:hard?'rim':'clap',s:4,v:.8},{i:hard?'rim':'clap',s:12,v:.85});
  if(E>=.15)for(const i of [2,6,10,14])out.push({i:'hat',s:i,v:.5,open:true});
  for(let i=1;i<16;i+=2)if(E>=(hard?.3:.6)&&(sixteen||i%4===3))out.push({i:'hat',s:i,v:.35});
  if(hard&&E>=.45)for(const i of [0,4,8,12])out.push({i:'hat',s:i,v:.3});
  if(E>=.7)out.push({i:snr,s:ghost,v:.25});
  if(s.p===15)for(const i of [13,14,15])out.push({i:'snare',s:i,v:.4+.1*(i-13)}); /* a fill into the next section */
  return out;}
function tBass(c,tr,bi,E,ctx){const s=ctx.sec;if(s.n==='break'||s.n==='build'||(s.n==='intro'&&s.p<4))return [];
  if(tr.sound==='wave')return waveBass(c,tr,bi,E);
  const R=rngOf('tbass',tr.seed,tr.vari),oct=pk(R,[[],[14],[6,14],[10],[]]),lo=33,r=c.rootOf(c.chordAt(bi),lo,lo+11);
  const steps=tr.sound==='roll'&&E>=.35?[1,2,3,5,6,7,9,10,11,13,14,15]:tr.sound==='off'&&E>=.75?[2,3,6,7,10,11,14,15]:[2,6,10,14];
  const syn=tr.sound==='synth';return steps.map(i=>({i:syn?'synth':'wave',s:i,st:1,l:steps.length>4?.8:1.6,n:(oct.includes(i)?r+12:r)+(syn?12:0),v:i%4===2?1:.75}));}
function tChords(c,tr,bi,E,ctx){const s=ctx.sec,ch=c.chordAt(bi),R=rngOf('tchords',tr.seed,tr.vari);
  const gate=pk(R,GATES),stabs=pk(R,[[2,6,10,14],[0,3,6,10,12],[2,5,8,10,14],[0,6,8,14]]);
  const cut=s.n==='intro'?.25+.4*s.p/16:s.n==='main'?.7:s.n==='break'?.45:s.n==='build'?.4+.6*(s.p/8):1;
  if(tr.sound==='pad')return bi%2===0?[{i:'pad',s:0,l:32,ns:c.voice('pd',ch,48,67),v:.8,att:1.2,wave:'sawtooth'}]:[];
  let ns=c.voice('ss',ch,55,72);if(ns.length<4)ns=ns.concat(ns[0]+12);
  if(s.n==='break'||(tr.sound==='gate'&&E<.2))return bi%2===0?[{i:'ssaw',s:0,l:32,ns,v:.9,cut,att:1,rel:1.2,voices:5,spread:24,rv:.6,dl:.05,lvl:.11}]:[];
  if(tr.sound==='gate')return [{i:'ssaw',s:0,l:16,ns,v:1,cut,gate,voices:5,spread:22,rv:.4,dl:.08,lvl:.13}];
  return stabs.filter((x,k)=>k<2||E>=.2+k*.12).map(i=>({i:'ssaw',s:i,l:1.5,ns,v:1.1,cut:Math.min(1,cut+.15),pluck:1,voices:5,spread:18,rv:.35,dl:.3,lvl:.16}));}
function tMelody(c,tr,bi,E,ctx){const s=ctx.sec,out=[],R=rngOf('tmelody',tr.seed,tr.vari,bi);
  if(tr.sound==='pluck'){if((s.n==='intro'&&s.p<8)||(s.n==='build'&&s.p>=6))return out; /* the arp: chord tones in a seeded shape */
    const shape=pk(rngOf('tarp',tr.seed,tr.vari),ARPS),ns=c.voice('ar',c.chordAt(bi),62,76,false,true),tones=ns.concat(ns.map(m=>m+12)).slice(0,4).sort((x,y)=>x-y),every=E>=.5?1:2;
    const cut=s.n==='intro'?.4:s.n==='break'?.6:.85;
    for(let i=0,k=0;i<16;i+=every,k++)out.push({i:'ssaw',s:i,l:every*.9,ns:[tones[shape[k%shape.length]%tones.length]],v:.9,pluck:1,voices:3,spread:12,cut,rv:.35,dl:.4,lvl:.1});
    return out;}
  /* the lead (or bells): the anthem, every two bars from the main section on, developing as it goes */
  if(s.n==='intro'||bi%2||E<.12||(s.n==='build'&&s.p>=6))return out;
  const hook=c.pat.melody,v=Math.floor(bi/2)%4;
  const notes=v===1?hook.map((h,i)=>i===hook.length-1?Object.assign({},h,{d:h.d+pk(R,[-3,-1,2])}):h):v===3?hook.map(h=>Object.assign({},h,{d:h.d+2})):hook;
  for(const h of notes){const off=Math.floor(h.p/16),pp=h.p%16,m=c.fit(c.degNote(h.d,72),c.chordAt(bi+off),pp%4===0),at=off*16+pp;
    if(tr.sound==='glass')out.push({i:'glass',s:at,n:m+12,v:.8});
    else out.push({i:'ssaw',s:at,l:Math.max(1,h.du*.95),ns:s.n==='drop'?[m,m+12]:[m],v:1,voices:7,spread:26,cut:s.n==='break'?.6:.9,rv:.55,dl:.25,att:.01,rel:.3,lvl:.13});}
  return out;}
function tPerc(c,tr,bi,E,ctx){const s=ctx.sec;if(s.n==='break'||s.n==='build'||(s.n==='intro'&&s.p<4))return [];
  const R=rngOf('tperc',tr.seed,tr.vari),out=[];
  if(tr.sound==='shaker'){for(let i=0;i<16;i++)if(E>=(i%2?.55:.3))out.push({i:'shaker',s:i,v:i%4===2?.6:.4});}
  else if(tr.sound==='ride'){if(E>=.3)for(const i of [0,4,8,12])out.push({i:'hat',s:i,v:.25,open:true});}
  else{const pat=pk(R,[[3,7,11,14],[3,6,11,15],[5,10,13],[7,10,15]]);if(E>=.3)for(const i of pat)out.push({i:'rim',s:i,v:.4});}
  return out;}
GENRES.trance.write={drums:tDrums,bass:tBass,chords:tChords,melody:tMelody,perc:tPerc};

/* make(song[, last]): a composer for this song. last = the composer it replaces, so the chord voicings carry on smoothly */
SBC.make=(song,last)=>{const G=GENRES[song.genre]||GENRES.lofi,t=id=>song.tracks.find(x=>x.id===id)||{seed:0,vari:0};
  /* the song seed sets the key and the mood; the chords track picks the changes */
  const Rk=rngOf('key',song.seed),kpc=Math.floor(Rk()*12),M=G.harm?1:Math.floor(Rk()*3),ct=t('chords'),Rp=rngOf('changes',ct.seed);
  const [scName,progStr]=G.harm?[G.harm.scale,G.harm.progs]:HARMONY[M],SC=SCALE[scName],progs=progStr.map(parseProg),pa=Math.floor(Rp()*progs.length),
    pb=progs.length>1?(pa+1+Math.floor(Rp()*(progs.length-1)))%progs.length:pa,A=progs[pa],B=progs[pb];
  const c={key:kpc,mood:M,minor:scName==='aeo'};
  const bpc=G.bpc||1;c.chordAt=bi=>{const p=((bi%32)+32)%32,pr=p>=16?B:A;return pr[Math.floor((p%16)/bpc)%pr.length];};
  const pcsOf=ch=>CH[ch[1]].map(i=>(kpc+ch[0]+i)%12),tight=ns=>ns.some((n,i)=>i&&n-ns[i-1]<2);
  const prevV=c.prevV=last&&last.prevV?Object.assign({},last.prevV):{};
  c.voice=(id,ch,lo,hi,rootless,peek)=>{let iv=CH[ch[1]];if(rootless&&iv.length>=4)iv=iv.slice(1);
    let b=kpc+ch[0]+iv[0];while(b<lo)b+=12;while(b-12>=lo&&b+iv[iv.length-1]-iv[0]>hi)b-=12;
    let ns=iv.map(i=>b-iv[0]+i);const pv=prevV[id];
    if(pv){const mean=x=>x.reduce((s,y)=>s+y,0)/x.length,av=mean(pv);for(let k=0;k<2;k++){const a2=mean(ns);let cc=null;
        if(a2-av>4)cc=[ns[ns.length-1]-12,...ns.slice(0,-1)];else if(av-a2>4)cc=[...ns.slice(1),ns[0]+12];
        if(!cc)break;cc.sort((x,y)=>x-y);if(tight(cc)||cc[0]<lo-2||cc[cc.length-1]>hi+4)break;ns=cc;}}
    if(!peek)prevV[id]=ns;return ns;};
  c.rootOf=(ch,lo,hi)=>{let n=kpc+ch[0];while(n<lo)n+=12;while(n>hi)n-=12;return n;};
  c.degNote=(d,center)=>{const T=kpc+12*Math.round((center-kpc)/12),o=Math.floor(d/7);return T+SC[((d%7)+7)%7]+12*o;};
  c.fit=(m,ch,strong)=>{const pcs=pcsOf(ch),pc=((m%12)+12)%12;if(pcs.includes(pc))return m;
    const clash=pcs.some(x=>(pc-x+12)%12===1||(x-pc+12)%12===1);if(!strong&&!clash&&SC.map(s=>(s+kpc)%12).includes(pc))return m;
    for(const dd of [-1,1,-2,2,-3,3])if(pcs.includes((((m+dd)%12)+12)%12))return m+dd;return m;};
  const mel=t('melody'),hb={};
  c.pat={drums:drumPattern(t('drums')),bass:bassPattern(t('bass')),chords:chordPattern(ct),melody:makeHook(rngOf('hook',mel.seed)),perc:percPattern(t('perc'))};
  c.hookB=n=>hb[n]||(hb[n]=makeHook(rngOf('hook-b',mel.seed,mel.vari,n))); /* the second half of the form gets its own hook */
  const swing=G.swing*2*(song.feel&&song.feel.swing!=null?song.feel.swing:.5);
  return {bpm:G.bpm,swing,key:kpc,minor:c.minor,genre:G.name,recipe:G.recipe,prevV,energy:song.energy,
    /* the notes for bar bi (counting from 0). Muted tracks still play, at level 0, so unmuting is instant */
    bar(bi){const E=clamp(this.energy,0,1),ctx=G.form(bi,E,song.seed),out=[];
      for(const tr of song.tracks){const w=G.write[tr.id];if(!w)continue;for(const e of w(c,tr,bi,E,ctx)){e.tr=tr.id;out.push(e);}}
      return out;}};};
})();
