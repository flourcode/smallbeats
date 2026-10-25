/* Small Beats · the music engine.
   Everything you hear is synthesized here with Web Audio while it plays: drums, bass, keys, the hook, and the
   tape hiss, rain or fire underneath. Nothing is a recording.
   band(audioContext, destination, recipe) returns {src, tick(until), bpm, ...}. Call tick() a few seconds ahead of
   the audio clock; it schedules bars up to that time.
   A recipe (see README, "Tape format"):
     s  starting sound   0 lo-fi, 1 house, 2 ambient, 3 8-bit, 4 dub (sets the groove, tempo and drum kit)
     d  drums            0 off, 1 tight (straight), 2 swing
     b  bass             0 off, 1 warm, 2 deep, 3 synth
     k  keys             0 off, 1 Rhodes, 2 guitar, 3 pad, 4 8-bit
     w  texture          0 off, 1 rain, 2 hiss, 3 fire
     p  speed            0 slow, 1 steady, 2 fast
     r  seed             picks the key, the mood, the chord changes and the hook */
(function(){
"use strict";
const SB=window.SBE={};
const clampInt=(v,lo,hi,d)=>{v=Math.round(+v);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):d;};
function normT(t){t=t||{};return {d:clampInt(t.d,0,2,1),b:clampInt(t.b,0,3,0),k:clampInt(t.k,0,4,1),w:clampInt(t.w,0,3,0),p:clampInt(t.p,0,2,1),s:clampInt(t.s,0,4,0),r:clampInt(t.r,1,2147483647,1)};}
function makeNoise(a,sec,kind){const n=Math.round(a.sampleRate*sec),b=a.createBuffer(2,n,a.sampleRate);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;if(kind==='brown'){last=(last+.02*w)/1.02;d[i]=last*3.5;}else d[i]=w;}
    if(kind==='brown'){const s=d[0],e=d[n-1];for(let i=0;i<n;i++)d[i]-=s+(e-s)*i/(n-1);}} /* ends meet, so the loop never clicks */
  return b;}
const rnd=(lo,hi)=>lo+Math.random()*(hi-lo);
function swayGain(a,gain,base,depth,until,state){while(state.t<until){const d=rnd(4,9);gain.gain.linearRampToValueAtTime(base*(1+rnd(-depth,depth)),state.t+d);state.t+=d;}} /* a slow drift in level, so a steady bed still feels alive */
const SOUNDS={
  /* rain: gentle pitter-patter on a window. A low, soft hush, small taps scattered (sometimes two close together),
     and now and then a single droplet's plink. Darker and sparser than a downpour, so it settles into the background. */
  rain:(a,dest)=>{const white=makeNoise(a,6,'white'),s=a.createBufferSource();s.buffer=white;s.loop=true;const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=300;
    const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2300;const bed=a.createGain();bed.gain.value=.11;s.connect(hp).connect(lp).connect(bed).connect(dest);s.start();
    let tn=a.currentTime+.1,pn=a.currentTime+rnd(2,5);const sway={t:a.currentTime};
    const tap=(at,lvl)=>{const d=a.createBufferSource();d.buffer=white;const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=rnd(700,2200);bp.Q.value=6;
      const dg=a.createGain(),len=rnd(.03,.07);dg.gain.setValueAtTime(0,at);dg.gain.linearRampToValueAtTime(lvl,at+.003);dg.gain.exponentialRampToValueAtTime(.0001,at+len);d.connect(bp).connect(dg).connect(dest);d.start(at,rnd(0,5),len+.03);};
    return {src:[s],tick(until){swayGain(a,bed,.11,.2,until,sway);
      while(tn<until){tap(tn,rnd(.02,.045));if(Math.random()<.25)tap(tn+rnd(.04,.09),rnd(.012,.03));tn+=-Math.log(1-Math.random())/3.6;}
      while(pn<until){const o=a.createOscillator(),g=a.createGain(),f=rnd(1500,2600);o.frequency.setValueAtTime(f,pn);o.frequency.exponentialRampToValueAtTime(f*.7,pn+.08); /* a droplet */
        g.gain.setValueAtTime(0,pn);g.gain.linearRampToValueAtTime(.006,pn+.004);g.gain.exponentialRampToValueAtTime(.0001,pn+.12);o.connect(g).connect(dest);o.start(pn);o.stop(pn+.14);pn+=rnd(3,8);}}};}, /* a few taps a second, at random */
  /* hiss: the cassette itself. A soft, slightly wavering bed of tape noise with the highs rolled off, a faint mains hum
     and, now and then, a tiny tick of dust on the heads */
  hiss:(a,dest)=>{const white=makeNoise(a,7,'white'),s=a.createBufferSource();s.buffer=white;s.loop=true;const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;
    const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=7000;lp.Q.value=.5;const bed=a.createGain();bed.gain.value=.06;s.connect(hp).connect(lp).connect(bed).connect(dest);s.start();
    const hum=a.createOscillator();hum.frequency.value=60;const hg=a.createGain();hg.gain.value=.0035;hum.connect(hg).connect(dest);hum.start();
    let tn=a.currentTime+rnd(.5,2);const sway={t:a.currentTime};
    return {src:[s,hum],tick(until){swayGain(a,bed,.06,.12,until,sway);
      while(tn<until){const c=a.createBufferSource();c.buffer=white;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=rnd(2500,5000);f.Q.value=1.5;const cg=a.createGain(),len=rnd(.004,.01);
        cg.gain.setValueAtTime(0,tn);cg.gain.linearRampToValueAtTime(rnd(.015,.035),tn+.001);cg.gain.exponentialRampToValueAtTime(.0001,tn+len);c.connect(f).connect(cg).connect(dest);c.start(tn,rnd(0,6),len+.02);tn+=-Math.log(1-Math.random())/.7;}}};},
  /* fireplace: a low, slowly flickering roar, a faint hiss and a sparse scatter of small, soft crackles; the odd pop is muffled */
  fire:(a,dest)=>{const white=makeNoise(a,6,'white');const s=a.createBufferSource();s.buffer=makeNoise(a,8,'brown');s.loop=true;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=360;const roar=a.createGain();roar.gain.value=.5;s.connect(lp).connect(roar).connect(dest);s.start();
    const w=a.createBufferSource();w.buffer=white;w.loop=true;const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2400;bp.Q.value=.6;const hiss=a.createGain();hiss.gain.value=.01;w.connect(bp).connect(hiss).connect(dest);w.start();
    let tn=a.currentTime+.2;const sway={t:a.currentTime};
    return {src:[s,w],tick(until){swayGain(a,roar,.5,.2,until,sway);
      while(tn<until){const at=tn,pop=Math.random()<.04,c=a.createBufferSource();c.buffer=white;const f=a.createBiquadFilter();f.type=pop?'lowpass':'bandpass';f.frequency.value=pop?rnd(700,1100):rnd(1800,3600);f.Q.value=pop?.7:1.2;
        const cg=a.createGain(),len=pop?rnd(.03,.05):rnd(.006,.016);cg.gain.setValueAtTime(0,at);cg.gain.linearRampToValueAtTime(pop?rnd(.07,.1):rnd(.02,.06),at+.002);cg.gain.exponentialRampToValueAtTime(.0001,at+len);
        c.connect(f).connect(cg).connect(dest);c.start(at,rnd(0,5),len+.03);tn+=Math.random()<.3?rnd(.03,.09):-Math.log(1-Math.random())/1.6;}}};}, /* sparse, sometimes in little clusters */};
const mtof=m=>440*Math.pow(2,(m-69)/12);
const choose=a=>a[Math.floor(Math.random()*a.length)];
const CH={maj7:[0,4,7,11],m7:[0,3,7,10],dom7:[0,4,7,10],maj9:[0,4,7,11,14],m9:[0,3,7,10,14],dom9:[0,4,7,10,14],sus:[0,5,7,10],m11:[0,3,7,10,17],add9:[0,4,7,14]};
function makeVerb(a,sec){const n=Math.round(a.sampleRate*sec),b=a.createBuffer(2,n,a.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;for(let i=0;i<n;i++){lp=lp*.7+(Math.random()*2-1)*.3;d[i]=lp*Math.pow(1-i/n,2.6);}}const v=a.createConvolver();v.buffer=b;return v;}
const TAPE_LEVEL=.33; /* the atmosphere layers are set relative to this */
const TEMPO=[[60,70,82],[68,78,88],[72,82,92],[112,120,126],[66,74,82]],SWING=[[.1,.08,.06],[.12,.1,.08],[.16,.13,.09],[.1,.07,.04],[.12,.1,.08]]; /* the fifth row is dub */ /* by drums (off, soft, lo-fi, house), then pace */
Object.assign(CH,{maj:[0,4,7],min:[0,3,7],m7b5:[0,3,6,10],dim7:[0,3,6,9],dom7b9:[0,4,7,10,13],dom13:[0,4,10,14,21],six9:[0,4,7,9,14],m6:[0,3,7,9,14],maj7s11:[0,4,7,11,18],madd9:[0,3,7,14]});
const SCALE={ion:[0,2,4,5,7,9,11],aeo:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],lyd:[0,2,4,6,7,9,11]};
/* the name picks one of three moods; each has a scale and a few progressions that suit every part ("root+chord" per bar) */
const HARMONY=[
  ['ion',['2m9 7dom9 0maj9 9m7','0maj7 9m9 2m7 7sus','5maj9 4m7 2m9 0maj7','5maj9 7dom9 4m7 9m9','0six9 9m7 2m9 7dom13']],
  ['aeo',['0m9 8maj7 3maj7 10sus','0m9 5m7 8maj9 7dom7b9','0m11 0m11 8maj9 10add9','0m9 3maj7 8maj7 7m7']],
  ['ion',['2m9 7dom7b9 0maj9 9dom7b9','4m7 3dim7 2m9 7dom13','0maj9 1dim7 2m9 7dom7b9','5maj9 5m6 0maj9 9dom7b9']]];
/* the recording: lo-fi drums get a cassette; everything else is clean */
const RECORDING=[
  {dr:.8,hp:25,l1:18000,l2:18000,sh:0,hi:0,wo:0,fl:0},
  {dr:2,hp:75,l1:6000,l2:8500,sh:3,hi:.008,wo:6,fl:2}]; /* the cassette, turned down: half the hiss, a gentler wobble */
function seeded(str){let h=2166136261;for(const ch of String(str))h=Math.imul(h^ch.charCodeAt(0),16777619);
  return ()=>{h=h+0x6D2B79F5|0;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const parseProg=s=>s.split(' ').map(x=>{const m=x.match(/^(\d+)(\w+)$/);return [+m[1],m[2]];});
/* the hook: a little cell, the same cell moved a step, and a long note to land on, over two bars */
function makeHook(R){const pick=a=>a[Math.floor(R()*a.length)],cell=[];let p=pick([0,0,2,4]),d=pick([0,2,4,4,7]);const n=pick([2,3,3]);
  for(let i=0;i<n&&p<13;i++){const du=pick([2,2,2,3,4,4,6]);cell.push({p,d,du});p+=du;d=Math.max(-2,Math.min(9,d+pick([-2,-1,-1,1,1,2,3])));}
  const sh=pick([-1,1,2,-2]),hook=cell.slice();cell.forEach((c,i)=>{if(i<cell.length-1||R()<.5)hook.push({p:c.p+16,d:c.d+sh,du:c.du});});
  const last=hook[hook.length-1];hook.push({p:Math.min(last.p+last.du,28),d:pick([0,2,4,7]),du:6});return hook;}
const KSC=new Map(); /* plucked strings (Karplus-Strong), made once per note and kept */
function ksBuf(a,m,kind){const k=a.sampleRate+'|'+m+'|'+kind+'|'+Math.floor(Math.random()*3);let e=KSC.get(k);if(e)return e;if(KSC.size>160)KSC.clear(); /* three takes per note, so repeated strums aren't identical */
  const sr=a.sampleRate,f=mtof(m),N=Math.max(2,Math.floor(sr/f+.5)),thumb=kind==='thumb',len=Math.round(sr*(thumb?2.2:1.7)),T60=thumb?1.7:(m>64?1.1:1.5);
  const b=a.createBuffer(1,len,sr),d=b.getChannelData(0),buf=new Float32Array(N);let lp=0;const br=thumb?.22:.5;
  for(let i=0;i<N;i++){lp+=br*((Math.random()*2-1)-lp);buf[i]=lp;}
  const pp=Math.max(1,Math.round(N*(thumb?.22:.13))),ex=buf.slice();for(let i=0;i<N;i++)buf[i]=ex[i]-.7*ex[(i+N-pp)%N]; /* where the string is plucked */
  const g=Math.pow(10,-3/(T60*f));let idx=0,pk=0;
  for(let i=0;i<len;i++){const y=buf[idx],y2=buf[(idx+1)%N];d[i]=y;buf[idx]=g*.5*(y+y2);idx=(idx+1)%N;if(i<N*6)pk=Math.max(pk,Math.abs(y));}
  if(pk>0)for(let i=0;i<len;i++)d[i]*=.8/pk;
  e={b,rate:f*(N-.5)/sr};KSC.set(k,e);return e;} /* the averaging loop's period is N-0.5 samples */
function pulseWave(a,duty){a.__pw=a.__pw||{};if(a.__pw[duty])return a.__pw[duty];const n=40,re=new Float32Array(n),im=new Float32Array(n);
  for(let i=1;i<n;i++)re[i]=2/(i*Math.PI)*Math.sin(i*Math.PI*duty);return a.__pw[duty]=a.createPeriodicWave(re,im);}
let SATC=null;
function band(a,dest,tp0){const tp=normT(tp0);
  const D=tp.d?[2,3,1,2,4][tp.s]:0,FEEL=tp.d,BS=tp.b,KO=tp.k===0,K=tp.k-1,G=tp.p,chip=tp.s===3,DT=D===0?[2,3,0,2,4][tp.s]:D,ambient=DT===0; /* DT: the groove the start sound sets. Take the drums out and the tempo and feel stay */
  /* K: 0 Rhodes, 1 guitar, 2 pad, 3 8-bit. The starting sound alone sets the groove, the tempo and (for 8-bit) the chip
     drum kit. DT is that groove: take the drums out and the tempo and feel stay. */
  /* the feel every part plays in: 0 free (no drums), 2 lo-fi (soft drums too), 3 house */
  const feel=DT===0?0:DT===3?3:DT===4?4:2;
  /* the name picks the key, the mood, the changes and the hook */
  const SEEDSTR='seed:'+tp.r,RN=seeded(SEEDSTR); /* the tape's seed */const kpc=Math.floor(RN()*12),hook=makeHook(RN),M=Math.floor(RN()*3),pa=Math.floor(RN()*1e6),pb=Math.floor(RN()*1e6);
  const [scName,progStr]=HARMONY[M],SC=SCALE[scName],progs=progStr.map(parseProg),progA=progs[pa%progs.length],progB=progs.length>1?progs[(pa%progs.length+1+pb%(progs.length-1))%progs.length]:progA;
  const bpm=TEMPO[DT][G]*(chip&&D<3?1.22:1),beat=60/bpm,step=beat/4,barDur=16*step,swing=D?(FEEL===1?0:Math.max(SWING[DT][G]*(chip?.4:1),.14)):SWING[DT][G]*(chip?.4:1), /* D: the sound's own kit (1 soft, 2 lo-fi, 3 house, 4 dub). TIGHT plays dead straight; SWING leans on the offbeats */bpc=ambient&&G<2?2:1,bright=[1,.85,.72][M],low=0;
  const white=makeNoise(a,3,'white'),srcs=[];
  /* signal chain: parts -> (pump) -> drive -> recording filters -> out; room and echo are recorded with the parts */
  const bq=(type,f,q)=>{const b=a.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;};
  const inG=a.createGain(),pump=a.createGain(),drumG=a.createGain(),drive=a.createGain(),sat=a.createWaveShaper(),post=a.createGain();
  if(!SATC){SATC=new Float32Array(2048);for(let i=0;i<2048;i++){const x=i/1023.5-1;SATC[i]=Math.tanh(1.4*x)/Math.tanh(1.4);}}sat.curve=SATC;
  const hp=bq('highpass',25,.7),lp1=bq('lowpass',18000,.5),lp2=bq('lowpass',18000,.6),shelf=bq('lowshelf',160);
  const comp=a.createDynamicsCompressor();comp.threshold.value=-22;comp.knee.value=10;comp.ratio.value=3;comp.attack.value=.02;comp.release.value=.3;
  const recOut=a.createGain(),wowD=a.createDelay(.1);wowD.delayTime.value=.008;inG.connect(pump).connect(drive);drumG.connect(drive);drive.connect(sat).connect(post).connect(wowD).connect(hp).connect(lp1).connect(lp2).connect(shelf).connect(comp).connect(recOut).connect(dest);
  const verb=makeVerb(a,ambient?5:2.6),wet=a.createGain(),send=a.createGain();send.connect(verb).connect(wet).connect(drive);wet.gain.value=ambient?.7:chip?.06:.22;
  const dly=a.createDelay(2),dfb=a.createGain(),dlp=bq('lowpass',2600),dsend=a.createGain(),dwet=a.createGain();dly.delayTime.value=ambient?beat*1.5:step*3;dfb.gain.value=ambient?.45:D===4?.56:.32;
  dsend.connect(dly);dly.connect(dlp).connect(dfb).connect(dly);dlp.connect(dwet).connect(drive);dwet.gain.value=1;
  const hs=a.createBufferSource();hs.buffer=white;hs.loop=true;const hbp=bq('bandpass',4800,.6),hiss=a.createGain();hs.connect(hbp).connect(hiss).connect(recOut);hs.start();srcs.push(hs);
  const wowO=a.createOscillator(),wowG=a.createGain(),flO=a.createOscillator(),flG=a.createGain();wowO.frequency.value=.48;flO.frequency.value=6.3;
  wowO.connect(wowG).connect(wowD.delayTime);flO.connect(flG).connect(wowD.delayTime);wowO.start();flO.start();srcs.push(wowO,flO);
  const cents2s=(c,f)=>c/1731/(2*Math.PI*f);
  { const r=RECORDING[D===2&&!chip?1:0];drive.gain.value=r.dr;post.gain.value=1/Math.pow(r.dr,.85);hp.frequency.value=r.hp;lp1.frequency.value=r.l1;lp2.frequency.value=r.l2;shelf.gain.value=r.sh;hiss.gain.value=r.hi;wowG.gain.value=cents2s(r.wo,.48);flG.gain.value=cents2s(r.fl,6.3);
    recOut.gain.value=Math.pow(10,((D===0?(DT===0?2.5:-1):0)+(BS===0?3.5:0)+(KO?3:0)-(ambient?3:0))/20);
    } /* fewer parts, a little make-up gain, so taking the drums out doesn't make it vanish */
  const trem=a.createOscillator();trem.frequency.value=2.3;const tremG=a.createGain();tremG.gain.value=.07;trem.connect(tremG);trem.start();srcs.push(trem);
  const epBus=a.createGain();epBus.gain.value=1;tremG.connect(epBus.gain);epBus.connect(inG); /* the electric piano's tremolo, once for all its notes */
  /* atmosphere happens in your room, not on the tape */
  const layers=[];const lay=(id,g)=>{const lg=a.createGain();lg.gain.value=g*.63/TAPE_LEVEL;lg.connect(dest);const l=SOUNDS[id](a,lg);srcs.push(...l.src);layers.push(l);};
  if(tp.w===1)lay('rain',.5);if(tp.w===2)lay('hiss',.5);if(tp.w===3)lay('fire',.35);
  /* helpers */
  const now0=()=>a.currentTime;const loose=(t,lo,hi)=>Math.max(now0(),t+rnd(lo,hi));
  const out=(node,pan,rv,dl,to)=>{let n=node;if(a.createStereoPanner&&pan){const p=a.createStereoPanner();p.pan.value=pan;n.connect(p);n=p;}n.connect(to||inG);
    if(rv){const s=a.createGain();s.gain.value=rv;n.connect(s).connect(send);}if(dl){const s=a.createGain();s.gain.value=dl;n.connect(s).connect(dsend);}};
  const osc=(type,f,t)=>{const o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);return o;};
  const noise=(t,type,fq,q,att,dec,lvl,pan,rv,to)=>{const s=a.createBufferSource();s.buffer=white;const f=bq(type,fq,q);const g=a.createGain();
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lvl,t+att);g.gain.exponentialRampToValueAtTime(.0004,t+att+dec);s.connect(f).connect(g);out(g,pan,rv,0,to);s.start(t,Math.random()*2,att+dec+.05);};
  /* ---- instruments ---- */
  const ep=(t,m,dur,vel,pan,rv,dl)=>{const f=mtof(m),c=osc('sine',f,t),md=osc('sine',f,t),mg=a.createGain(),g=a.createGain(),tg=a.createGain();
    mg.gain.setValueAtTime(f*1.05*vel*bright,t);mg.gain.exponentialRampToValueAtTime(f*.08,t+.9);md.connect(mg).connect(c.frequency);const c2=osc('sine',f,t);c2.detune.setValueAtTime(rnd(5,9),t);const g2=a.createGain();g2.gain.value=.35;c2.connect(g2);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09*vel,t+.006);g.gain.setTargetAtTime(.035*vel,t+.01,.5);g.gain.setTargetAtTime(0,t+dur,.35);
    c.connect(g).connect(tg);g2.connect(g);out(tg,pan!=null?pan:(m-62)/30,rv!=null?rv:.6,dl||0,epBus);const e=t+dur+2;c.start(t);md.start(t);c2.start(t);c.stop(e);md.stop(e);c2.stop(e);};
  const pad=(t,ms,dur,lvl,att,wave)=>{const g=a.createGain(),f=bq('lowpass',400*bright,.4);att=att||Math.min(2.5,dur*.4);
    f.frequency.setValueAtTime(380*bright,t);f.frequency.linearRampToValueAtTime(1100*bright,t+dur*.5);f.frequency.linearRampToValueAtTime(600*bright,t+dur+att);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022*lvl,t+att);g.gain.setValueAtTime(.022*lvl,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+att);f.connect(g);out(g,0,.9);
    for(const m of ms){for(const d of [-7,7]){const o=osc(wave||'sawtooth',mtof(m),t);o.detune.setValueAtTime(d,t);o.connect(f);o.start(t);o.stop(t+dur+att+.1);}}};
  const bassLo=(t,m,dur,lvl)=>{const o=osc('sine',mtof(m),t),o2=osc('triangle',mtof(m),t),g=a.createGain(),g2=a.createGain();g2.gain.value=.25;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*lvl,t+.02);g.gain.setTargetAtTime(.09*lvl,t+.05,.4);g.gain.setTargetAtTime(0,t+dur,.12);o.connect(g);o2.connect(g2).connect(g);out(g,0,0);o.start(t);o2.start(t);o.stop(t+dur+1);o2.stop(t+dur+1);};
  const sub=(t,m,dur,lvl)=>{const o=osc('sine',mtof(m),t),o2=osc('triangle',mtof(m),t),g=a.createGain(),g2=a.createGain();g2.gain.value=.18;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2*lvl,t+.008);g.gain.setTargetAtTime(.15*lvl,t+.02,.15);g.gain.setTargetAtTime(0,t+dur,.03);o.connect(g);o2.connect(g2).connect(g);out(g,0,0);o.start(t);o2.start(t);o.stop(t+dur+.4);o2.stop(t+dur+.4);};
  const sbass=(t,m,dur,lvl)=>{const f=bq('lowpass',900,4),g=a.createGain(); /* a little analog synth bass: saw and square through a plucky filter */
    f.frequency.setValueAtTime(1400*bright,t);f.frequency.exponentialRampToValueAtTime(260,t+Math.min(.25,dur));g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.11*lvl,t+.005);g.gain.setTargetAtTime(.07*lvl,t+.02,.12);g.gain.setTargetAtTime(0,t+dur,.03);f.connect(g);out(g,0,.05);
    for(const [ty,dt] of [['sawtooth',-6],['square',6]]){const o=osc(ty,mtof(m),t);o.detune.setValueAtTime(dt,t);o.connect(f);o.start(t);o.stop(t+dur+.3);}};
  const gtrBus=a.createGain(),gtrF=bq('lowpass',3600*bright,.5),gtrB=bq('peaking',220,1);gtrB.gain.value=3;gtrBus.connect(gtrB).connect(gtrF);out(gtrF,-.18,.35);
  const thumbBus=a.createGain(),thumbF=bq('lowpass',1100,.5);thumbBus.connect(thumbF);out(thumbF,0,.05);
  const string=(t,m,v,dur,kind)=>{const k=ksBuf(a,m,kind),s=a.createBufferSource();s.buffer=k.b;s.playbackRate.value=k.rate;const g=a.createGain();
    g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0,t+dur,kind==='thumb'?.06:.04);s.connect(g).connect(kind==='thumb'?thumbBus:gtrBus);s.start(t);s.stop(t+Math.min(dur+.5,k.b.duration));};
  const mallet=(t,m,v,len,rv,dl)=>{const f=mtof(m),c=osc('sine',f,t),md=osc('sine',f*2,t),mg=a.createGain(),g=a.createGain();len=len||1.4;
    mg.gain.setValueAtTime(f*1.3*v*bright,t);mg.gain.exponentialRampToValueAtTime(f*.05,t+.35);md.connect(mg).connect(c.frequency);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*v,t+.005);g.gain.exponentialRampToValueAtTime(.0004,t+len);c.connect(g);out(g,rnd(-.3,.3),rv!=null?rv:.5,dl!=null?dl:.35);c.start(t);md.start(t);c.stop(t+len+.1);md.stop(t+len+.1);};
  const glass=(t,m,v)=>{const f=mtof(m),c=osc('sine',f,t),c2=osc('sine',f*2.01,t),g=a.createGain(),g2=a.createGain();g2.gain.value=.15;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045*v,t+.012);g.gain.exponentialRampToValueAtTime(.0004,t+5);c.connect(g);c2.connect(g2).connect(g);out(g,rnd(-.45,.45),1.1,.2);c.start(t);c2.start(t);c.stop(t+5.1);c2.stop(t+5.1);};
  const drone=(t,m,dur,lvl)=>{const g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03*lvl,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur+1.5);out(g,0,.5);
    for(const [mm,k] of [[m,1],[m+7,.4],[m+12,.25]]){const o=osc('sine',mtof(mm),t),gg=a.createGain();gg.gain.value=k;o.connect(gg).connect(g);o.start(t);o.stop(t+dur+1.6);}};
  const pulse=(t,m,dur,v,duty,vibr,pan)=>{const o=osc('sine',mtof(m),t);o.setPeriodicWave(pulseWave(a,duty));const g=a.createGain();
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*v,t+.003);g.gain.setValueAtTime(.05*v,t+Math.max(.004,dur*.3));g.gain.linearRampToValueAtTime(.038*v,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.015);
    if(vibr&&dur>.25){const lf=a.createOscillator(),lg=a.createGain();lf.frequency.value=6;lg.gain.setValueAtTime(0,t);lg.gain.setValueAtTime(0,t+.15);lg.gain.linearRampToValueAtTime(18,t+.3);lf.connect(lg).connect(o.detune);lf.start(t);lf.stop(t+dur+.05);}
    o.connect(g);out(g,pan||0,.05);o.start(t);o.stop(t+dur+.05);};
  const tri=(t,m,dur,v)=>{const o=osc('triangle',mtof(m),t),g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*v,t+.003);g.gain.setValueAtTime(.16*v,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.01);o.connect(g);out(g,0,0);o.start(t);o.stop(t+dur+.03);};
  /* drums (to the drum bus, which the house pump leaves alone); with 8-bit keys the same patterns play on chip drums */
  const crunch=(()=>{const n=Math.round(a.sampleRate*.5),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);let h=0;for(let i=0;i<n;i++){if(i%6===0)h=Math.random()<.5?-1:1;d[i]=h;}return b;})(); /* stepped noise, like an old sound chip */
  const cnoise=(t,fq,dec,lvl)=>{const s=a.createBufferSource();s.buffer=crunch;const f=bq('highpass',fq,.5),g=a.createGain();g.gain.setValueAtTime(lvl,t);g.gain.exponentialRampToValueAtTime(.0004,t+dec);s.connect(f).connect(g);out(g,0,.03,0,drumG);s.start(t,Math.random()*.4,dec+.02);};
  const ckick=(t,v)=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(190,t);o.frequency.exponentialRampToValueAtTime(40,t+.07);g.gain.setValueAtTime(.3*v,t);g.gain.linearRampToValueAtTime(0,t+.11);o.connect(g);out(g,0,0,0,drumG);o.start(t);o.stop(t+.12);};
  const kick=(t,v)=>{if(chip)return ckick(t,v);t=loose(t,-.006,.008);v*=rnd(.88,1.04);const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.26*v,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+.38);o.connect(g);out(g,0,0,0,drumG);o.start(t);o.stop(t+.45);};
  const hkick=(t,v)=>{if(pumpDepth){pump.gain.setValueAtTime(1,t);pump.gain.linearRampToValueAtTime(1-pumpDepth,t+.012);pump.gain.linearRampToValueAtTime(1,t+beat*.8);}if(chip)return ckick(t,v);
    const o=a.createOscillator(),g=a.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(48,t+.09);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.34*v,t+.003);g.gain.exponentialRampToValueAtTime(.12*v,t+.12);g.gain.exponentialRampToValueAtTime(.001,t+.42);o.connect(g);out(g,0,0,0,drumG);o.start(t);o.stop(t+.45);};
  const snare=(t,v)=>{if(chip)return cnoise(t,1200,.11,.05*v);t=loose(t,.006,.022);v*=rnd(.82,1.04);noise(t,'bandpass',1400,.8,.005,.16,.05*v,.05,.25,drumG);const o=a.createOscillator(),g=a.createGain();o.frequency.value=190;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.04*v,t+.003);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g);out(g,.05,.2,0,drumG);o.start(t);o.stop(t+.12);};
  const hat=(t,v,open)=>{if(chip)return cnoise(t,7000,open?.09:.03,.02*v);noise(loose(t,-.008,.008),'highpass',open?7000:7600,.7,.003,open?.2:.035,(open?.02:.016)*v*rnd(.7,1.1),.22,open?.15:0,drumG);};
  const shaker=(t,v)=>{if(chip)return cnoise(t,6000,.025,.012*v);noise(loose(t,-.006,.006),'bandpass',5600,1.1,.012,.05,.012*v*rnd(.7,1.1),-.25,.1,drumG);};
  const rim=(t,v)=>{if(chip)return cnoise(t,2500,.02,.035*v);t=loose(t,-.004,.006);noise(t,'bandpass',2100,3,.001,.03,.05*v,.18,.15,drumG);const o=a.createOscillator(),g=a.createGain();o.frequency.value=440;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03*v,t+.001);g.gain.exponentialRampToValueAtTime(.001,t+.045);o.connect(g);out(g,.18,.1,0,drumG);o.start(t);o.stop(t+.06);};
  const clap=(t,v)=>{if(chip)return cnoise(t,1500,.09,.045*v);for(let i=0;i<3;i++)noise(t+i*.011,'bandpass',1150,1,.002,i<2?.012:.16,.045*v,-.05,.35,drumG);};
  const brush=(t,v,long)=>{if(chip)return cnoise(t,3000,long?.12:.04,.02*v);noise(loose(t,-.01,.012),'bandpass',2800,.9,long?.07:.025,long?.32:.12,.026*v*rnd(.75,1.1),-.15,.3,drumG);};
  /* ---- harmony and melody ---- */
  const tonicNear=c=>kpc+12*Math.round((c-kpc)/12);
  const chordAt=bi=>{const p=((bi%32)+32)%32,pr=p>=16?progB:progA;return pr[Math.floor((p%16)/bpc)%pr.length];};
  const pcsOf=ch=>CH[ch[1]].map(i=>(kpc+ch[0]+i)%12);
  const prevV={};
  const tight=ns=>ns.some((n,i)=>i&&n-ns[i-1]<2); /* a minor second inside a voicing sounds like a wrong note */
  const voice=(id,ch,lo,hi,rootless)=>{lo+=low;hi+=low;let iv=CH[ch[1]];if(rootless&&iv.length>=4)iv=iv.slice(1);
    let b=kpc+ch[0]+iv[0];while(b<lo)b+=12;while(b-12>=lo&&b+iv[iv.length-1]-iv[0]>hi)b-=12;
    let ns=iv.map(i=>b-iv[0]+i);const pv=prevV[id];
    if(pv){const mean=x=>x.reduce((s,y)=>s+y,0)/x.length,av=mean(pv);for(let k=0;k<2;k++){const a2=mean(ns);let c=null;
        if(a2-av>4)c=[ns[ns.length-1]-12,...ns.slice(0,-1)];else if(av-a2>4)c=[...ns.slice(1),ns[0]+12];
        if(!c)break;c.sort((x,y)=>x-y);if(tight(c)||c[0]<lo-2||c[c.length-1]>hi+4)break;ns=c;}}
    prevV[id]=ns;return ns;};
  const rootOf=(ch,lo,hi)=>{let n=kpc+ch[0];while(n<lo)n+=12;while(n>hi)n-=12;return n;};
  const degNote=(d,center)=>{const T=tonicNear(center+low),o=Math.floor(d/7);return T+SC[((d%7)+7)%7]+12*o;};
  const fit=(m,ch,strong)=>{const pcs=pcsOf(ch),pc=((m%12)+12)%12;if(pcs.includes(pc))return m;
    const clash=pcs.some(c=>(pc-c+12)%12===1||(c-pc+12)%12===1);if(!strong&&!clash&&SC.map(s=>(s+kpc)%12).includes(pc))return m;
    for(const dd of [-1,1,-2,2,-3,3])if(pcs.includes((((m+dd)%12)+12)%12))return m+dd;return m;};
  const st=(b0,i)=>b0+i*step+(i%2?swing*beat/2:0);
  /* the hook, played by the keys, and little phrases made from it in between */
  const LEAD=KO?null:[{c:74,play:(t,m,d,v)=>ep(t+.025,m,d,v*.62,.15,.6,.08)},{c:72,play:(t,m,d,v)=>string(t,m,.42*v,Math.max(d,step*2),'nyl')},{c:76,play:(t,m,d,v)=>glass(t,m,v)},{c:76,play:(t,m,d,v)=>{pulse(t,m,d*.92,v,.25,true,.1);pulse(t+3*step,m,d*.8,v*.32,.25,false,-.3);}}][K];
  const playNotes=(b0,bi,notes,vel)=>{for(const h of notes){const off=Math.floor(h.p/16),pp=h.p%16;let t=st(b0+off*barDur,pp);
      const ch=chordAt(bi+off),m=fit(degNote(h.d,LEAD.c),ch,pp%4===0);LEAD.play(t,m,Math.max(step,h.du*step*(chip?.9:1)),vel*rnd(.88,1.05));
      if(K===0&&h.du>=4&&Math.random()<.2)LEAD.play(t-step*.5,m-1,step*.4,vel*.5);}}; /* now and then a grace note from below */
  const riff=(b0,bi,hook)=>{const k=1+Math.floor(Math.random()*Math.min(3,hook.length-1)),s0=Math.floor(Math.random()*(hook.length-k)),tr=choose([-2,-1,0,1,2,3]),sh=choose([0,0,2,-2,4]);
    const ns=hook.slice(s0,s0+k).map(h=>({p:((h.p%16)-(hook[s0].p%16)+choose([0,4,8])+sh+16)%16,d:h.d+tr,du:Math.min(h.du,4)})).filter(h=>h.p<15).sort((x,y)=>x.p-y.p);
    playNotes(b0,bi,ns,.8);};
  const improv=[.2,.35,.5][G]*(ambient?.35:1);let hookB=null,hookN=0;
  const tStart=a.currentTime+.25;let bar=0,t=tStart,pumpDepth=D===3&&!chip?[.12,.18,.25][G]:0;
  function barSlot(b0){const bi=bar,p32=bi%32,ch=chordAt(bi),nx=chordAt(bi+1),bd=D>0&&bi>=24&&p32>=24&&p32<28,full=barDur;
    const fill=D>0&&!bd&&(p32===15||p32===31||p32===23)&&Math.random()<.8; /* a little fill going into the next section */
    /* ---- DRUMS ---- */
    if(D>0&&!bd){
      if(D===1){ /* soft: a gentle kick, a rim click on 2 and 4, brushes and a shaker */
        kick(st(b0,0),.6);if(G>=1&&Math.random()<.7)kick(st(b0,10),.42);rim(st(b0,4),.5);rim(st(b0,12),.55);
        for(let i=0;i<16;i+=(G===2?2:4))brush(st(b0,i),i%8===4?.7:.45,i%8===4);if(G>=1)for(let i=2;i<16;i+=(G===2?2:4))shaker(st(b0,i),.55);
        if(fill)for(const i of [13,14,15])rim(st(b0,i),.35+.1*(i-13));}
      else if(D===2){ /* lo-fi: lazy boom-bap with a cassette on it */
        kick(st(b0,0),.85);if(G===0){if(Math.random()<.6)kick(st(b0,10),.5);}else{kick(st(b0,10),.6);if(G===2||Math.random()<.3)kick(st(b0,7),.45);}
        snare(st(b0,4),G===0?.55:.8);snare(st(b0,12),G===0?.6:.85);if(G>0&&Math.random()<.3)snare(st(b0,choose([7,15])),.2);
        const hs=G===0?4:G===1?2:1;for(let i=0;i<16;i+=hs)hat(st(b0,i),(i%4===0?1:.6)*(G===0?.5:.8));
        if(fill){snare(st(b0,14),.45);snare(st(b0,15),.6);}}
      else if(D===4){ /* dub: the one drop. Nothing on one; kick and rim land together on three, hats skip on the offbeats */
        kick(st(b0,8),.95);rim(st(b0,8),.7);if(G>=1&&Math.random()<.35)kick(st(b0,14),.45);
        for(const i of [2,6,10,14])hat(st(b0,i),i===10?.55:.4,G===2&&i===14);if(G>=1)for(const i of [3,7,11,15])if(Math.random()<.5)shaker(st(b0,i),.4);
        if(fill||Math.random()<.18){const tt=st(b0,choose([12,14,15]));snare(tt,.5);noise(tt,'bandpass',1500,.8,.004,.18,.06,.1,.3,dsend);}} /* a snare thrown into the echo */
      else{ /* house: four on the floor, claps, offbeat open hats, a shaker */
        for(const i of [0,4,8,12])hkick(st(b0,i),G===0?.85:1);if(G===0){rim(st(b0,4),.55);rim(st(b0,12),.6);}else{clap(st(b0,4),[.4,.55,.65][G]);clap(st(b0,12),[.45,.6,.7][G]);}
        for(const i of [2,6,10,14])hat(st(b0,i),[.25,.35,.4][G],true);if(G>=1)for(let i=0;i<16;i++)if(G===2?i%4!==2:true)(G===2?hat:shaker)(st(b0,i),i%2?.4:.65);
        if(fill)clap(st(b0,15),.4);}}
    else if(bd)for(let i=2;i<16;i+=4)hat(st(b0,i),.35,D===3);
    /* ---- BASS: follows the chords, in the drums' feel ---- */
    if(BS>0&&!bd){const lo=BS===2?33:36,r=rootOf(ch,lo,lo+11),r5=r+7>lo+16?r-5:r+7,nr=rootOf(nx,lo,lo+11);
      const play=(i,m,len,v)=>{const tt=st(b0,i),dur=len*step;if(BS===1)bassLo(tt,m,dur,v);else if(BS===2)sub(tt,m,dur,v);else if(chip)tri(tt,m+12,dur*.9,v*.9);else sbass(tt,m+12,dur,v);};
      let pat;
      if(feel===0)pat=G===2?[[0,r,7],[8,r5,7]]:[[0,r,15*bpc]];
      else if(feel===2){pat=[[0,r,G===0?10:6]];if(G>=1&&Math.random()<.75)pat.push([10,choose([r,r5,r+12]),4]);if(G===2){if(Math.random()<.5)pat.push([7,r,2]);pat.push([14,nr+choose([-1,2,0]),2]);}}
      else if(feel===4)pat=[[[0,r,3.5],[6,r5,1.5],[8,r,3],[14,nr,1.5]],[[0,r,2.5],[3,r,1],[6,r5,1.5],[8,r,2.5],[11,r+12,1],[14,nr,1.5]],[[0,r,2],[3,r,1],[4,r5,1],[6,r5,1.5],[8,r,2],[11,r+12,1],[12,r5,1],[14,nr,1.5]]][G];
      else pat=[[[2,r,5],[10,r,5]],[[2,r,2.2],[6,r+12,1.5],[10,r,2.2],[13,r,1.5]],[[2,r,1],[3,r+12,.9],[6,r,1.5],[10,r,1],[11,r+12,.9],[14,choose([r+7,r+10]),1.5]]][G];
      if(feel===0&&bpc===2&&bi%2)pat=[];
      for(const [i,m,len] of pat)play(i,m,len,1);}
    /* ---- KEYS: chords in the drums' feel (and the hook, below) ---- */
    if(KO){}
    else if(K===0){ /* Rhodes */
      const ns=voice('ep',ch,53,72),v=rnd(.5,.7);
      if(feel===4){for(const i of [4,12])ns.forEach((m,j)=>ep(st(b0,i)+j*.008,m,step*1.1,rnd(.5,.6),null,.35,.5));if(G>=1&&Math.random()<.5)ns.slice(-3).forEach((m,j)=>ep(st(b0,14)+j*.008,m,step*.8,.4,null,.3,.55));} /* dub: short skanks on two and four, into the echo */
      else if(feel===3){ns.forEach((m,i)=>ep(b0+i*.012,m,full*(G===0?.95:.45),rnd(.5,.62),null,.5,.1));if(G>=1)ns.slice(-3).forEach((m,i)=>ep(st(b0,10)+i*.01,m,beat*.8,.45,null,.4,.2));if(G===2)ns.slice(-3).forEach((m,i)=>ep(st(b0,14)+i*.01,m,beat*.5,.4,null,.4,.2));}
      else{if(bi%bpc===0)ns.forEach((m,i)=>ep(b0+i*rnd(.012,.03),m,full*bpc*rnd(.6,.9),v*(i?.85:1)));
        if(feel===2&&G===1&&Math.random()<.45)ns.slice(-3).forEach((m,i)=>ep(st(b0,10)+i*.02,m,beat*1.2,v*.55));
        if(feel===2&&G===2)for(const i of [6,10,14])if(Math.random()<.55)ns.slice(-3).forEach((m,j)=>ep(st(b0,i)+j*.015,m,beat*.6,v*.5));
        if(feel===0&&bi%bpc===0)pad(b0,voice('pd',ch,48,67),full*bpc,.45);}}
    else if(K===1){ /* nylon guitar */
      const strum=(i,c,len,acc)=>{const ns=voice('g',c,52,69,true);ns.forEach((m,j)=>string(st(b0,i)+j*rnd(.008,.014),m,(.22+.08*Math.random())*acc*(j?.9:1),len,'nyl'));};
      if(feel===4){for(const i of [4,12])strum(i,ch,step*.9,.85);}else if(feel===3){for(const i of [2,6,10,14])strum(i,ch,step*1.2,.85);if(G===2)for(const i of [3,11])strum(i,ch,step*.8,.5);} /* offbeat chops */
      else{const ns=voice('g',ch,48,72,false),seq=ns.concat(ns.slice(1,-1).reverse());const every=G===0?4:2;for(let i=0,k=0;i<16;i+=every,k++)string(st(b0,i),seq[k%seq.length],.26+.06*Math.random(),step*every*2,'nyl');if(feel===2)strum(0,ch,step*3,.6);}} /* fingerpicking */
    else if(K===2){ /* pad */
      if(bi%bpc===0){pad(b0,voice('pd',ch,48,67),full*bpc,D>0?.7:1,D>0?.6:3.5,M===0?'triangle':'sawtooth');if(ambient)drone(b0,rootOf(ch,31,43),full*bpc,1);}
      const ns=voice('gl',ch,67,84),n=ambient?[1,1,2][G]:G;for(let k=0;k<n;k++)if(Math.random()<(ambient?.6:.35))glass(st(b0,choose([0,4,8,12])+k*2),choose(ns),rnd(.35,.6));
      if(ambient&&Math.random()<.1)mallet(st(b0,choose([2,6,10])),choose(ns)+12,.35,3,1.2,.4);}
    else{ /* 8-bit arpeggios */
      const tr=voice('ar',ch,60,76),seq=tr.concat([tr[0]+12]);const ar=G===0||feel===0?2:1;
      for(let i=0;i<16;i+=ar){const k=G===2?[0,1,2,3,2,1][i%6]:i/ar;pulse(st(b0,i),seq[k%seq.length],step*ar*.85,ar===2?.4:.32,.125,false,-.25);}}
    /* the tune */
    const hookOn=bi%8===2&&!(ambient&&bi%16!==2);
    if(bi%64===32||!hookB)hookB=makeHook(seeded(SEEDSTR+':b'+Math.floor(bi/64))); /* the B half gets its own hook, and a new one every 64 bars */
    const cur=Math.floor(bi/32)%2?hookB:hook;
    if(LEAD){if(hookOn){const v=(hookN++)%4; /* the hook develops: as written, a new ending, a rest, then moved up a step */
        if(v===0)playNotes(b0,bi,cur,1);
        else if(v===1)playNotes(b0,bi,cur.map((h,i)=>i===cur.length-1?Object.assign({},h,{d:h.d+choose([-3,-1,2])}):h),.95);
        else if(v===2){if(Math.random()<improv*1.5)riff(b0,bi,cur);}
        else playNotes(b0,bi,cur.map(h=>Object.assign({},h,{d:h.d+2})),.9);}
      else if(bi%8!==3&&bi>=1&&Math.random()<improv)riff(b0,bi,cur);} /* the tune lives in the keys */
    bar++;}
  return {src:srcs,ahead:2.2,bpm,beat,step,barDur,tStart,tick(until){for(const l of layers)l.tick&&l.tick(until);if(t<a.currentTime)t=a.currentTime+.05; /* after a stall, pick up from now rather than playing the missed bars at once */while(t<until){barSlot(t);t+=barDur;}}};}
SB.band=band;
})();
