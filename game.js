'use strict';
/* ============================================================
   VOIDLINE — a monochrome descent
   2D action roguelite. Canvas + WebAudio, zero assets.
   ============================================================ */

// ---------- config ----------
const W = 480, H = 270, TS = 16, STEP = 1 / 60;
const COL = {
  bg0:'#07080b', bg1:'#0c0d12', ink:'#111218', spire:'#101118', arch:'#15161d',
  tile:'#21222b', tileD:'#191a21', edge:'#a7a9b6', side:'#4b4d59',
  dark:'#0d0e13', foe:'#4a4c59', foeD:'#35363f', white:'#f1f2f6', gray:'#9a9caa',
  dim:'#5c5e6a', red:'#ff4655', redD:'#8f2230', gold:'#ffc95e', pale:'#cdd0dd'
};

// ---------- canvas ----------
const cvs = document.getElementById('cv');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;
function fitCanvas(){
  const s = Math.max(1, Math.min(Math.floor(innerWidth / W), Math.floor(innerHeight / H)));
  cvs.style.width = (W * s) + 'px'; cvs.style.height = (H * s) + 'px';
}
addEventListener('resize', fitCanvas); fitCanvas();

// ---------- utils ----------
const clamp = (v,a,b)=> v<a?a:(v>b?b:v);
const lerp = (a,b,t)=> a+(b-a)*t;
const sgn = v => v<0?-1:(v>0?1:0);
const dist2 = (ax,ay,bx,by)=>{const dx=ax-bx,dy=ay-by;return dx*dx+dy*dy;};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let R = Math.random;
const FR = Math.random;
const rr = (a,b)=>a+FR()*(b-a);
function overlap(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}
const hash2=(x,y)=>{let h=(x*374761393+y*668265263)^(x<<5);h=(h^(h>>13))*1274126177;return ((h^(h>>16))>>>0)%1000/1000;};

// ---------- pixel font (3x5) ----------
const FONT = {
 'A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110',
 'E':'111100110100111','F':'111100110100100','G':'011100101101011','H':'101101111101101',
 'I':'111010010010111','J':'001001001101010','K':'101101110101101','L':'100100100100111',
 'M':'101111111101101','N':'110101101101101','O':'010101101101010','P':'110101110100100',
 'Q':'010101101011001','R':'110101110101101','S':'011100010001110','T':'111010010010010',
 'U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101',
 'Y':'101101010010010','Z':'111001010100111',
 '0':'010101101101010','1':'010110010010111','2':'110001010100111','3':'110001010001110',
 '4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010',
 '8':'010101010101010','9':'111101111001110',
 '.':'000000000000010',':':'000010000010000','!':'010010010000010','?':'110001010000010',
 '-':'000000111000000','+':'000010111010000','/':'001001010100100',"'":'010010000000000',
 ',':'000000000010100','·':'000000010000000','%':'101001010100101',
 '(':'001010010010001',')':'100010010010100','>':'100010001010100','<':'001010100010001',
 '\u00D7':'000101010101000',' ':'000000000000000'
};
// ---------- i18n ----------
const isCJK=c=>{const p=c.codePointAt(0);return (p>=0x2E80&&p<=0x9FFF)||(p>=0x3000&&p<=0x303F)||(p>=0xFF00&&p<=0xFFEF);};
let LANG='en';
try{
  const saved=localStorage.getItem('vl_lang');
  if(saved==='zh'||saved==='en')LANG=saved;
  else if((navigator.language||'').toLowerCase().indexOf('zh')===0)LANG='zh';
}catch(e){}
function toggleLang(){ LANG=LANG==='zh'?'en':'zh'; try{localStorage.setItem('vl_lang',LANG);}catch(e){} AU.sfx('ui'); }
const LANGS={
 en:{
  sub_title:'A MONOCHROME DESCENT', press:'PRESS J TO DESCEND',
  ctrl1:'MOVE A/D · JUMP SPACE(x2) · ROLL SHIFT · ATTACK J · BOW K(HOLD) · SKILL L',
  ctrl2:'P PAUSE · R RESTART · M MUTE · T LANGUAGE',
  best:'BEST RUN', wins:'CLEANSES', tagline:'FIND THE PALE COURT. END THE MONARCH.',
  wsel_t:'CHOOSE YOUR BLADE', wsel_s:'YOUR CRIT IS DEFINED BY IT',
  ssel_t:'CHOOSE YOUR DISCIPLINE', ssel_s:'A COOLDOWN ABILITY · L TO CAST',
  menu_hint:'A/D + J · OR J/K/L', rw_door:'THE GATE OPENS', rw_chest:'THE CHEST YIELDS',
  rw_pick:'CHOOSE ONE', syn:'SYNERGY: ', none:'NONE',
  god:'GOD', muted:'MUTED', boss:'THE ASHEN MONARCH',
  f_riposte:'RIPOSTE', f_riposte_r:'RIPOSTE READY', f_adren:'ADRENALINE', f_exec:'EXECUTE',
  f_block:'BLOCK', f_burst:'BURST', f_stun:'STUN', f_open:'OPENING', f_sweep:'SWEEP!',
  f_reset:'RESET', f_secret:'SECRET', f_cleared:'CLEARED', f_wind:'SECOND WIND',
  f_awaken:'THE ASHEN AWAKENS', f_ember:'FINAL EMBER', f_falls:'THE MONARCH FALLS',
  dead_t:'YOU DISSOLVE', dead_s:'INTO THE DUST OF THE COURT', dead_again:'R · RISE AGAIN',
  dead_sub:'SAME BLADE, NEW DEPTHS', st_time:'TIME', st_kills:'KILLS', st_gold:'GOLD',
  st_dmg:'DMG DEALT', st_level:'LEVEL',
  vic_t:'THE MONARCH FALLS', vic_s:'LIGHT RETURNS TO THE LINE', vic_best:'BEST!',
  vic_best2:'BEST', vic_again:'R · DESCEND AGAIN', vic_build:'BUILD',
  pause_t:'PAUSED', pause_w:'WEAPON', pause_crit:'CRIT', pause_d:'DISCIPLINE',
  pause_relics:'RELICS:', pause_norelics:'NO RELICS YET',
  pause_c1:'MOVE A/D · JUMP SPACE(x2) · ROLL SHIFT (IFRAMES)',
  pause_c2:'ATTACK J · BOW K (HOLD=PIERCE) · SKILL L',
  pause_end:'P RESUME · R RESTART · M ', mute:'MUTE', unmute:'UNMUTE',
  hint1:'A/D MOVE · SPACE JUMP x2', hint2:'SHIFT ROLL (INVINCIBLE)',
  hint3:'J ATTACK · K BOW(HOLD) · L SKILL', hint4:'RED = DANGER · GOLD = REWARD'
 },
 zh:{
  sub_title:'一段黑白单色的下潜', press:'按 J 开始下潜',
  ctrl1:'移动 A/D · 跳跃 SPACE(x2) · 翻滚 SHIFT · 攻击 J · 弓 K(长按) · 技能 L',
  ctrl2:'P 暂停 · R 重开 · M 静音 · T 切换语言',
  best:'最佳纪录', wins:'次通关', tagline:'找到苍白王庭，终结君主。',
  wsel_t:'选择你的武器', wsel_s:'它决定你的暴击方式',
  ssel_t:'选择你的流派', ssel_s:'冷却技能 · 按 L 释放',
  menu_hint:'A/D+J 选择 · 或直接按 J/K/L', rw_door:'大门开启', rw_chest:'宝箱开启',
  rw_pick:'选择其一', syn:'联动：', none:'无',
  god:'无敌', muted:'已静音', boss:'灰烬君主',
  f_riposte:'招架', f_riposte_r:'招架就绪', f_adren:'肾上腺素', f_exec:'处决',
  f_block:'格挡', f_burst:'爆裂', f_stun:'眩晕', f_open:'破绽', f_sweep:'横扫!',
  f_reset:'重置', f_secret:'秘密!', f_cleared:'清剿完毕', f_wind:'回光返照',
  f_awaken:'灰烬苏醒', f_ember:'余烬终燃', f_falls:'君主陨落',
  dead_t:'你已消散', dead_s:'化作王庭的尘埃', dead_again:'R · 再战',
  dead_sub:'同一把剑，全新的深渊', st_time:'时间', st_kills:'击杀', st_gold:'金币',
  st_dmg:'伤害', st_level:'关卡',
  vic_t:'君主陨落', vic_s:'光明重归虚线', vic_best:'新纪录!',
  vic_best2:'最佳', vic_again:'R · 再度下潜', vic_build:'构筑',
  pause_t:'已暂停', pause_w:'武器', pause_crit:'暴击', pause_d:'流派',
  pause_relics:'遗物：', pause_norelics:'暂无遗物',
  pause_c1:'移动 A/D · 跳跃 SPACE(x2) · 翻滚 SHIFT（无敌帧）',
  pause_c2:'攻击 J · 弓 K（长按即穿透） · 技能 L',
  pause_end:'P 继续 · R 重开 · M ', mute:'静音', unmute:'取消静音',
  hint1:'A/D 移动 · SPACE 二段跳', hint2:'SHIFT 翻滚（无敌帧）',
  hint3:'J 攻击 · K 弓(长按) · L 技能', hint4:'红＝危险 · 金＝奖励'
 }
};
const T=k=>(LANGS[LANG]&&LANGS[LANG][k])||LANGS.en[k]||k;
const tx=v=>(v&&typeof v==='object')?(v[LANG]||v.en):v;
const LVNAMES={en:['THE ASHEN GATE','HOLLOW SPIRE','DUST RELIQUARY','THE PALE COURT'],
               zh:['灰烬之门','空心尖塔','尘埃圣物库','苍白王庭']};
const lvName=i=>LVNAMES[LANG][i]||LVNAMES.en[i];

function textW(s,sc){
  s=(''+s).toUpperCase(); let w=0;
  for(const c of s)w+=isCJK(c)?8*sc:4*sc;
  return Math.max(0,w-sc);
}
function drawText(s,x,y,sc,col,align){
  s=(''+s).toUpperCase();
  if(align==='center')x-=textW(s,sc)/2; else if(align==='right')x-=textW(s,sc);
  x=Math.round(x); y=Math.round(y);
  ctx.fillStyle=col;
  let run='';
  const flush=()=>{
    if(!run)return;
    ctx.font='bold '+Math.round(8*sc)+'px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
    ctx.textBaseline='top';
    ctx.fillText(run,x,y-Math.round(1.5*sc));
    x+=run.length*8*sc; run='';
  };
  for(const ch of s){
    if(isCJK(ch)){ run+=ch; }
    else{
      flush();
      const g=FONT[ch]||FONT['?'];
      for(let b=0;b<15;b++) if(g[b]==='1') ctx.fillRect(x+(b%3)*sc, y+((b/3)|0)*sc, sc, sc);
      x+=4*sc;
    }
  }
  flush();
}

// ---------- input ----------
const K={h:{},p:{}};
addEventListener('keydown',e=>{
  if(!e.repeat){K.h[e.code]=1;K.p[e.code]=1;}
  AU.init();
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
});
addEventListener('keyup',e=>{K.h[e.code]=0;});
addEventListener('blur',()=>{K.h={}; if(G.state==='play')G.paused=true;});
const pr=(...c)=>c.some(k=>K.p[k]);
const hd=(...c)=>c.some(k=>K.h[k]);
const K_LEFT =()=>hd('ArrowLeft','KeyA'), K_RIGHT=()=>hd('ArrowRight','KeyD');
const K_JUMP =()=>pr('Space','KeyW','ArrowUp'), K_JUMP_H=()=>hd('Space','KeyW','ArrowUp');
const K_ATK  =()=>pr('KeyJ','KeyZ'), K_BOW=()=>hd('KeyK','KeyX'), K_BOW_P=()=>pr('KeyK','KeyX');
const K_SKILL=()=>pr('KeyL','KeyC'), K_ROLL=()=>pr('ShiftLeft','ShiftRight','KeyV');
const K_CONFIRM=()=>pr('KeyJ','KeyZ','Enter','Space');

// ---------- audio ----------
const AU={
  ctx:null,master:null,sg:null,mg:null,muted:false,int:0,intW:0,
  step:0,nextT:0,timer:null,noiseBuf:null,
  init(){
    if(this.ctx){ if(this.ctx.state==='suspended')this.ctx.resume(); return; }
    const C=window.AudioContext||window.webkitAudioContext; if(!C)return;
    const c=this.ctx=new C();
    this.master=c.createGain(); this.master.gain.value=0.85; this.master.connect(c.destination);
    this.sg=c.createGain(); this.sg.gain.value=0.9; this.sg.connect(this.master);
    this.mg=c.createGain(); this.mg.gain.value=0.42; this.mg.connect(this.master);
    const len=c.sampleRate|0, buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    this.noiseBuf=buf;
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=150; lp.Q.value=4;
    const dg=c.createGain(); dg.gain.value=0.05; lp.connect(dg); dg.connect(this.mg);
    [55,55.7,110.3].forEach(f=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(lp);o.start();});
    this.nextT=c.currentTime+0.1;
    this.timer=setInterval(()=>this.sched(),40);
  },
  tone(f0,f1,dur,type,vol,delay){
    if(!this.ctx||this.muted)return;
    const c=this.ctx,t=c.currentTime+(delay||0);
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(Math.max(20,f0),t);
    if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(this.sg); o.start(t); o.stop(t+dur+0.02);
  },
  nz(dur,ft,f0,f1,q,vol,delay){
    if(!this.ctx||this.muted)return;
    const c=this.ctx,t=c.currentTime+(delay||0);
    const s=c.createBufferSource(); s.buffer=this.noiseBuf; s.loop=true;
    const f=c.createBiquadFilter(); f.type=ft; f.frequency.setValueAtTime(f0,t); f.Q.value=q||1;
    if(f1&&f1!==f0)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(this.sg); s.start(t); s.stop(t+dur+0.02);
  },
  sfx(n,v){
    if(!this.ctx||this.muted)return; v=v||1;
    switch(n){
      case 'swing': this.nz(0.07,'bandpass',1100,500,1.2,0.22*v); break;
      case 'hit': this.nz(0.06,'bandpass',1800,900,1,0.4*v); this.tone(210,70,0.06,'square',0.22*v); break;
      case 'heavy': this.tone(105,36,0.17,'sine',0.6*v); this.nz(0.13,'lowpass',420,140,1,0.45*v); break;
      case 'crit': this.nz(0.06,'bandpass',2000,1000,1,0.4*v); this.tone(2400,1700,0.09,'triangle',0.22*v); break;
      case 'clang': this.tone(830,810,0.03,'square',0.16*v); this.tone(1250,880,0.1,'square',0.1*v); this.nz(0.05,'highpass',3200,3200,2,0.24*v); break;
      case 'hurt': this.tone(180,60,0.18,'sawtooth',0.3*v); this.nz(0.12,'lowpass',600,220,1,0.3*v); break;
      case 'edie': this.nz(0.18,'lowpass',900,180,1,0.34*v); this.tone(150,55,0.16,'triangle',0.24*v); break;
      case 'roll': this.nz(0.13,'bandpass',500,950,1,0.16*v); break;
      case 'jump': this.tone(165,330,0.08,'triangle',0.12*v); break;
      case 'djump': this.tone(215,430,0.08,'triangle',0.12*v); break;
      case 'land': this.nz(0.05,'lowpass',380,180,1,0.16*v); break;
      case 'bow': this.nz(0.05,'highpass',1300,1300,1,0.22*v); this.tone(420,90,0.07,'triangle',0.16*v); break;
      case 'bowfull': this.nz(0.08,'highpass',1500,700,1,0.3*v); this.tone(520,70,0.1,'triangle',0.24*v); break;
      case 'coin': this.tone(1320,1320,0.06,'sine',0.1*v); this.tone(1976,1976,0.09,'sine',0.08*v,0.05); break;
      case 'hp': this.tone(620,930,0.13,'sine',0.12*v); break;
      case 'chest': [1046,1318,1568].forEach((f,i)=>this.tone(f,f,0.12,'sine',0.09*v,i*0.07)); break;
      case 'door': this.tone(98,98,0.7,'sine',0.16*v); this.tone(147,147,0.7,'sine',0.12*v,0.02); this.nz(0.4,'lowpass',300,120,1,0.1*v); break;
      case 'tele': this.tone(1150,900,0.05,'square',0.05*v); break;
      case 'roar': this.tone(95,42,0.7,'sawtooth',0.4*v); this.nz(0.55,'lowpass',420,160,1,0.34*v); break;
      case 'slam': this.tone(110,30,0.22,'sine',0.6*v); this.nz(0.24,'lowpass',240,90,1,0.5*v); break;
      case 'shock': this.nz(0.16,'bandpass',320,160,1,0.24*v); break;
      case 'stun': this.tone(900,900,0.05,'sine',0.08*v); this.tone(1200,1200,0.07,'sine',0.07*v,0.06); break;
      case 'riposte': this.tone(1568,1568,0.09,'sine',0.1*v); this.tone(2093,2093,0.14,'sine',0.09*v,0.08); break;
      case 'skill': this.nz(0.15,'bandpass',800,1600,1,0.24*v); this.tone(240,520,0.14,'triangle',0.16*v); break;
      case 'ui': this.tone(700,700,0.04,'triangle',0.08*v); break;
      case 'ok': this.tone(880,1245,0.09,'triangle',0.1*v); break;
      case 'spike': this.nz(0.08,'highpass',2100,1200,1,0.3*v); this.tone(190,70,0.12,'sawtooth',0.2*v); break;
      case 'lvl': [392,494,587,784].forEach((f,i)=>this.tone(f,f,0.3,'sine',0.07*v,i*0.09)); break;
      case 'reveal': this.nz(0.3,'lowpass',900,200,1,0.2*v); this.tone(660,440,0.25,'sine',0.08*v); break;
      case 'gate': this.tone(70,70,0.5,'sawtooth',0.2*v); this.nz(0.3,'lowpass',500,200,1,0.2*v); break;
      case 'pdie': this.tone(220,40,0.8,'sawtooth',0.35*v); this.nz(0.7,'lowpass',800,100,1,0.35*v); break;
      case 'boom': this.tone(90,24,0.9,'sine',0.7*v); this.nz(0.8,'lowpass',500,60,1,0.5*v); break;
    }
  },
  sched(){
    if(!this.ctx||this.muted)return;
    if(this.nextT<this.ctx.currentTime-0.25)this.nextT=this.ctx.currentTime+0.05;
    const spb=60/92/2;
    while(this.nextT<this.ctx.currentTime+0.18){
      this.playStep(this.step,this.nextT);
      this.step=(this.step+1)%32; this.nextT+=spb;
    }
  },
  playStep(s,t){
    const d=t-this.ctx.currentTime, c=this.ctx, int=this.int, w=this.intW;
    const bassA=[73.4,0,0,0,55,0,73.4,0, 87.3,0,0,0,65.4,0,73.4,0, 73.4,0,0,0,55,0,65.4,0, 58.3,0,65.4,0,73.4,0,0,0];
    const bassB=[73.4,0,73.4,0,73.4,0,65.4,0, 58.3,0,58.3,0,65.4,0,65.4,0, 73.4,0,73.4,0,87.3,0,87.3,0, 98,0,87.3,0,65.4,0,58.3,0];
    const pat=int>=2?bassB:bassA;
    const f=pat[s];
    if(f){ const o=c.createOscillator(),g=c.createGain(); o.type='triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(0.14*(0.7+0.3*w),t); g.gain.exponentialRampToValueAtTime(0.001,t+0.22);
      o.connect(g);g.connect(this.mg); o.start(t);o.stop(t+0.24); }
    if(s%2===0){ const sn=c.createBufferSource(); sn.buffer=this.noiseBuf; const hf=c.createBiquadFilter(); hf.type='highpass'; hf.frequency.value=6000;
      const g=c.createGain(); const acc=s%8===0?0.045:0.02; g.gain.setValueAtTime(acc*(0.6+0.6*int/2),t); g.gain.exponentialRampToValueAtTime(0.001,t+0.035);
      sn.connect(hf);hf.connect(g);g.connect(this.mg); sn.start(t);sn.stop(t+0.05); }
    if(int>=1&&(s===4||s===12||s===20||s===28)){ const sn=c.createBufferSource(); sn.buffer=this.noiseBuf; const bf=c.createBiquadFilter(); bf.type='bandpass'; bf.frequency.value=1800;
      const g=c.createGain(); g.gain.setValueAtTime(0.09,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.09);
      sn.connect(bf);bf.connect(g);g.connect(this.mg); sn.start(t);sn.stop(t+0.1); }
    if(int>=1&&s%2===1){ const arp=[293.7,220,174.6,246.9]; const o=c.createOscillator(),g=c.createGain(); o.type='square'; o.frequency.value=arp[(s>>1)%4];
      g.gain.setValueAtTime(0.018,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1);
      o.connect(g);g.connect(this.mg); o.start(t);o.stop(t+0.12); }
    if(int>=2&&s%8===0){ const o=c.createOscillator(),g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(45,t+0.15);
      g.gain.setValueAtTime(0.22,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
      o.connect(g);g.connect(this.mg); o.start(t);o.stop(t+0.2); }
  },
  setInt(target){ this.intW=lerp(this.intW,target,0.06); if(Math.abs(this.intW-target)<0.05)this.intW=target; this.int=Math.round(this.intW); },
  toggleMute(){ this.muted=!this.muted; if(this.master)this.master.gain.value=this.muted?0:0.85; }
};

// ---------- prerendered sprites ----------
const lightSpr=document.createElement('canvas'); lightSpr.width=lightSpr.height=128;
{ const g=lightSpr.getContext('2d'), gr=g.createRadialGradient(64,64,2,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.5,'rgba(255,255,255,0.4)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(0,0,128,128); }
const vinSpr=document.createElement('canvas'); vinSpr.width=W; vinSpr.height=H;
{ const g=vinSpr.getContext('2d'), gr=g.createRadialGradient(W/2,H/2,H*0.42,W/2,H/2,H*0.85);
  gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,0.5)');
  g.fillStyle=gr; g.fillRect(0,0,W,H); }
const redVinSpr=document.createElement('canvas'); redVinSpr.width=W; redVinSpr.height=H;
{ const g=redVinSpr.getContext('2d'), gr=g.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.8);
  gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(255,40,50,0.28)');
  g.fillStyle=gr; g.fillRect(0,0,W,H); }
const darkCvs=document.createElement('canvas'); darkCvs.width=W; darkCvs.height=H;
const dctx=darkCvs.getContext('2d');

// ---------- global state ----------
const G={state:'title',t:0,level:0,freeze:0,ts:1,tsT:1,slowT:0,slowS:1,flashW:0,
  run:null,paused:false,intro:null,sel:{wi:0,si:0},reward:null,pendLevel:0,
  deadT:0,victT:0,best:+(localStorage.getItem('vl_best')||0),
  wins:+(localStorage.getItem('vl_wins')||0),god:false,tut:1,newBest:false};
let P=null,lvl=null,boss=null;
let ents=[],projs=[],parts=[],floats=[],fx=[],ghosts=[],motes=[],pickups=[];
const timeQueue=[];
let camX=0,camY=0,trauma=0,swingCounter=0;

// ---------- fx ----------
function shake(a){trauma=Math.min(1,trauma+a);}
function hitstop(t){G.freeze=Math.max(G.freeze,t);}
function slowmo(scale,dur){G.slowS=scale;G.slowT=dur;}
function addFloat(x,y,txt,col,sc){floats.push({x,y,txt,col:col||COL.white,sc:sc||1,t:0,life:0.8,vy:-26});}
function burst(x,y,n,col,spd,life,grav){
  for(let i=0;i<n;i++){const a=FR()*Math.PI*2,s=rr(0.2,1)*(spd||60);
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rr(0,30),t:0,life:rr(0.5,1)*(life||0.5),col,g:grav===undefined?300:grav,sz:FR()<0.3?2:1});}
}
function dust(x,y,n,dir){
  for(let i=0;i<(n||4);i++)parts.push({x:x+rr(-4,4),y:y+rr(-2,0),vx:rr(-20,20)+(dir||0)*rr(10,40),vy:rr(-36,-6),t:0,life:rr(0.25,0.5),col:'#54565f',g:120,sz:1});
}
function slashFx(x,y,dir,r0,r1,life,col){fx.push({k:'slash',x,y,dir,r0,r1,t:0,life:life||0.14,col:col||COL.white});}
function ringFx(x,y,r,life,col,w){fx.push({k:'ring',x,y,r,t:0,life:life||0.3,col:col||COL.white,w:w||1});}
function telLine(x1,y1,x2,y2,life){fx.push({k:'line',x1,y1,x2,y2,t:0,life:life||0.4});}
function ghost(x,y,face,pose,life){ghosts.push({x,y,face,pose,t:0,life:life||0.25});}
function updateFx(dt){
  for(const p of parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g||0)*dt;p.vx*=(1-1.5*dt);}
  parts=parts.filter(p=>p.t<p.life);
  for(const f of floats){f.t+=dt;f.y+=f.vy*dt;f.vy*=1-2*dt;}
  floats=floats.filter(f=>f.t<f.life);
  for(const e of fx)e.t+=dt;
  fx=fx.filter(e=>e.t<e.life);
  for(const g of ghosts)g.t+=dt;
  ghosts=ghosts.filter(g=>g.t<g.life);
}
function setTimeoutGame(t,fn){timeQueue.push({t,fn});}
function updateTimers(dt){
  for(let i=timeQueue.length-1;i>=0;i--){timeQueue[i].t-=dt;if(timeQueue[i].t<=0){const f=timeQueue[i].fn;timeQueue.splice(i,1);f();}}
}

// ---------- tiles / physics ----------
const T_EMPTY=0,T_SOLID=1,T_SPIKE=2,T_FAKE=3;
function tileAt(tx,ty){ if(tx<0||tx>=lvl.w)return T_SOLID; if(ty<0||ty>=lvl.h)return T_EMPTY; return lvl.t[ty*lvl.w+tx]; }
function setTile(tx,ty,v){ if(tx>=0&&tx<lvl.w&&ty>=0&&ty<lvl.h)lvl.t[ty*lvl.w+tx]=v; }
const isSolid=(tx,ty)=>tileAt(tx,ty)===T_SOLID;
function bodySolid(e){
  const x0=Math.floor((e.x-e.w/2)/TS),x1=Math.floor((e.x+e.w/2-0.01)/TS);
  const y0=Math.floor((e.y-e.h)/TS),y1=Math.floor((e.y-0.01)/TS);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(isSolid(tx,ty))return true;
  return false;
}
function moveBody(e,dt){
  const r={g:false,wl:false,wr:false,h:false};
  e.x+=e.vx*dt;
  if(bodySolid(e)){const s=sgn(e.vx)||1;let n=0;while(bodySolid(e)&&n++<20)e.x-=s*0.5;e.vx=0;if(s>0)r.wr=true;else r.wl=true;}
  e.y+=e.vy*dt;
  if(bodySolid(e)){const s=sgn(e.vy)||1;let n=0;while(bodySolid(e)&&n++<24)e.y-=s*0.5;if(s>0)r.g=true;else r.h=true;e.vy=0;}
  return r;
}
function onSpikes(e){
  const x0=Math.floor((e.x-e.w/2+2)/TS),x1=Math.floor((e.x+e.w/2-2)/TS);
  const y0=Math.floor((e.y-e.h+3)/TS),y1=Math.floor((e.y-1)/TS);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(tileAt(tx,ty)===T_SPIKE)return true;
  return false;
}
function losClear(x1,y1,x2,y2){
  const d=Math.hypot(x2-x1,y2-y1),steps=Math.ceil(d/10);
  for(let i=1;i<steps;i++){const t=i/steps;
    if(isSolid(Math.floor(lerp(x1,x2,t)/TS),Math.floor(lerp(y1,y2,t)/TS)))return false;}
  return true;
}

// ---------- level generation ----------
function fillT(x0,y0,x1,y1,v){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)setTile(x,y,v);}
function genLevel(idx){
  const seed=(G.run.seed+(idx+1)*7919)>>>0;
  R=mulberry32(seed);
  const rows=46, cols=idx===0?150:(idx===1?170:180);
  lvl={w:cols,h:rows,t:new Uint8Array(cols*rows),idx,torches:[],chains:[],rubble:[],zones:[],chests:[],doors:[],hints:[],fakeMap:{},fakeRegions:[],pillars:[],bossRoom:false,exit:null,name:lvName(idx),spiresF:[],archF:[],gy:0,pillarUp:false,doorSealed:false};
  const gy0=rows-9;
  for(let i=0;i<cols;i+=6+((R()*8)|0))lvl.spiresF.push({x:i*16,w:16+R()*40,h:60+R()*130});
  for(let i=0;i<cols;i+=9+((R()*10)|0))lvl.archF.push({x:i*16,w:30+R()*50,h:26+R()*40});
  fillT(0,0,1,rows-1,T_SOLID); fillT(cols-2,0,cols-1,rows-1,T_SOLID);
  let gx=2,gy=gy0; const segs=[];
  while(gx<cols-26){
    const w=12+((R()*15)|0);
    gy=clamp(gy+(((R()*5)|0)-2),gy0-7,gy0+3);
    fillT(gx,gy,gx+w-1,rows-1,T_SOLID);
    segs.push({x0:gx,x1:gx+w-1,gy});
    if(R()<0.3&&gx>26&&w>13){
      const pw=3+((R()*2)|0),pt=gx+w;
      if(pt+pw<cols-30){
        fillT(pt,gy,pt+pw,gy+3,T_EMPTY);
        fillT(pt,gy+4,pt+pw,gy+4,T_SPIKE);
        fillT(pt,gy+5,pt+pw,rows-1,T_SOLID);
      }
    }
    if(R()<0.55&&w>14){
      const lw=4+((R()*4)|0),lx=gx+2+((R()*(w-lw-4))|0),ly=gy-4-((R()*3)|0);
      fillT(lx,ly,lx+lw,ly,T_SOLID);
      if(R()<0.5)lvl.torches.push({x:(lx+((lw/2)|0))*16+8,y:ly*16-4});
      if(R()<0.5)segs.push({x0:lx,x1:lx+lw,gy:ly,ledge:true,gold:(R()<0.4)?{x:(lx+((lw/2)|0))*16,y:ly*16-6}:null});
    }
    gx+=w+ (R()<0.3?3+((R()*3)|0):0);
  }
  const ex0=cols-24;
  fillT(ex0,gy0,cols-3,rows-1,T_SOLID);
  segs.push({x0:ex0,x1:cols-3,gy:gy0});
  lvl.exit={x:(cols-7)*16,y:gy0*16};
  lvl.doors.push({x:lvl.exit.x,y:lvl.exit.y,kind:'exit'});
  for(let i=0;i<segs.length;i++){const s=segs[i];if(!s.ledge&&R()<0.6)lvl.torches.push({x:(s.x0+2)*16,y:s.gy*16-22});}
  for(let i=0;i<10+idx*4;i++)lvl.chains.push({x:(4+R()*(cols-8))*16,y:0,len:30+R()*80});
  for(let i=0;i<26;i++)lvl.rubble.push({x:R()*cols*16,y:(segs[(R()*segs.length)|0].gy)*16,r:R()*2+1});
  // hidden room (behind fake wall)
  {
    const hx=ex0-14-((R()*8)|0);
    let seg=null,bestD=1e9;
    for(const s of segs){if(s.ledge)continue;const c2=clamp(hx,s.x0,s.x1);const dd=Math.abs(c2-hx);if(dd<bestD){bestD=dd;seg=s;}}
    if(seg&&seg.x1-seg.x0>=10){
      const rx0=clamp(hx,seg.x0+1,seg.x1-9),hgy=seg.gy;
      fillT(rx0,hgy-4,rx0+7,hgy-1,T_EMPTY);
      fillT(rx0,hgy-5,rx0+7,hgy-5,T_SOLID);
      fillT(rx0,hgy-4,rx0,hgy-1,T_FAKE);
      const reg={tiles:[],revealed:false};
      for(let y=hgy-4;y<=hgy-1;y++){reg.tiles.push(y*lvl.w+rx0);lvl.fakeMap[y*lvl.w+rx0]=lvl.fakeRegions.length;}
      lvl.fakeRegions.push(reg);
      lvl.chests.push({x:(rx0+4)*16,y:hgy*16,tier:'rare',opened:false});
      lvl.torches.push({x:(rx0+6)*16,y:(hgy-4)*16-2});
    }
  }
  // challenge zone (constructed flat arena, always placed)
  {
    const zx=Math.floor(cols*0.5)+((R()*8)|0);
    const z1=zx+2,z2=zx+24;
    if(z2<ex0-8){
      const zgy=clamp(gy,gy0-7,gy0+3);
      fillT(zx,zgy,z2+2,rows-1,T_SOLID);
      fillT(zx,0,z2+2,zgy-1,T_EMPTY);
      const waves=idx===0?[['husk','husk'],['husk','sentinel']]
        :idx===1?[['husk','stalker'],['sentinel','sentinel'],['husk','warden']]
        :[['stalker','stalker','husk'],['warden','sentinel'],['husk','husk','warden']];
      lvl.zones.push({x0:z1,x1:z2,gy:zgy,waves,state:'idle',wi:0,t:0,colL:z1,colR:z2});
      lvl.torches.push({x:(z1+1)*16+8,y:zgy*16-22});
      lvl.torches.push({x:(z2+1)*16+8,y:zgy*16-22});
    }
  }
  // enemies
  for(let i=2;i<segs.length;i++){
    const s=segs[i];
    if(s.ledge||s.x0>=ex0)continue;
    if(lvl.zones.length&&s.x1>=lvl.zones[0].x0-1&&s.x0<=lvl.zones[0].x1+1)continue;
    const roll=R();
    let n= idx===0? (roll<0.45?1:(roll<0.8?2:0)) : (roll<0.3?1:(roll<0.8?2:3));
    for(let k=0;k<n;k++){
      const ex=(s.x0+2+R()*(s.x1-s.x0-4))*16, ey=s.gy*16;
      const tw=R(); let type;
      if(s.ledge)type=tw<0.5?'sentinel':(tw<0.8?'husk':'stalker');
      else type=tw<0.5?'husk':(tw<0.68?'sentinel':(idx>0&&tw<0.86?'stalker':(idx>0?'warden':'husk')));
      const elite=idx>0&&R()<0.09;
      spawnEnemy(type,ex,ey,elite);
    }
  }
  for(const s of segs)if(s.gold)for(let i=0;i<3;i++)spawnPickup('gold',s.gold.x+(i-1)*8,s.gold.y-6);
  if(idx===0&&G.tut){
    lvl.hints.push({x:80,y:gy0*16-40,k:'hint1'});
    lvl.hints.push({x:280,y:gy0*16-52,k:'hint2'});
    lvl.hints.push({x:500,y:gy0*16-40,k:'hint3'});
    lvl.hints.push({x:720,y:gy0*16-52,k:'hint4'});
  }
  P.x=56;P.y=segs[0].gy*16;P.vx=0;P.vy=0;P.lastSafe={x:P.x,y:P.y};
  camX=clamp(P.x-W/2,0,cols*16-W); camY=clamp(P.y-H*0.6,0,rows*16-H);
}
function genBossArena(){
  const rows=40, cols=72;
  lvl={w:cols,h:rows,t:new Uint8Array(cols*rows),idx:3,torches:[],chains:[],rubble:[],zones:[],chests:[],doors:[],hints:[],fakeMap:{},fakeRegions:[],pillars:[],bossRoom:true,exit:null,name:lvName(3),spiresF:[],archF:[],gy:0,pillarUp:false,doorSealed:false};
  const gy=rows-9;
  for(let i=0;i<cols;i+=6+((R()*8)|0))lvl.spiresF.push({x:i*16,w:16+R()*40,h:60+R()*130});
  fillT(0,0,1,rows-1,T_SOLID); fillT(cols-2,0,cols-1,rows-1,T_SOLID);
  fillT(0,0,cols-1,2,T_SOLID);
  fillT(2,gy,cols-3,rows-1,T_SOLID);
  fillT(9,gy-5,15,gy-5,T_SOLID); fillT(56,gy-5,62,gy-5,T_SOLID);
  for(const pxx of [24,34,44,54])lvl.pillars.push({tx:pxx,ty:gy-3});
  for(let i=0;i<8;i++)lvl.chains.push({x:(6+i*8)*16,y:2*16,len:40+R()*60});
  for(let i=0;i<6;i++)lvl.torches.push({x:(4+i*13)*16,y:gy*16-22});
  lvl.doors.push({x:2.5*16,y:gy*16,kind:'boss'});
  P.x=4.5*16;P.y=gy*16;P.vx=0;P.vy=0;P.lastSafe={x:P.x,y:P.y};
  lvl.gy=gy; lvl.doorCol=3;
  camX=0;camY=clamp(gy*16-206,0,rows*16-H);
  boss=makeBoss(62*16,gy*16);
}

// ---------- projectiles ----------
function spawnProj(o){projs.push(Object.assign({t:0,dead:false,g:0,pierce:0,from:'enemy',sz:2},o));}
function updateProjs(dt){
  for(const p of projs){
    p.t+=dt; p.vy+=(p.g||0)*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    if(p.t>(p.life||2.5))p.dead=true;
    if(isSolid(Math.floor(p.x/TS),Math.floor(p.y/TS))){p.dead=true;burst(p.x,p.y,3,COL.dim,40,0.3);}
    else if(p.from==='enemy'){
      if(!P.dead&&overlap(p.x-p.sz,p.y-p.sz,p.sz*2,p.sz*2,P.x-P.w/2,P.y-P.h,P.w,P.h)){
        p.dead=true; damagePlayer(p.dmg,{isAttack:true,kx:sgn(p.vx)||1});}
    }else{
      for(const e of ents){
        if(e.dead||e.spawnT>0)continue;
        if(overlap(p.x-3,p.y-3,6,6,e.x-e.w/2,e.y-e.h,e.w,e.h)){
          applyHit(e,p.dmg,{crit:p.crit,kb:p.kb||90,dir:sgn(p.vx)||1,src:'bow'});
          if(p.pierce>0){p.pierce--;}else p.dead=true;
          break;
        }
      }
      if(!p.dead&&boss&&!boss.dead&&!boss.invuln&&overlap(p.x-3,p.y-3,6,6,boss.x-boss.w/2,boss.y-boss.h,boss.w,boss.h)){
        hitBossMelee(p.dmg,{crit:p.crit,src:'bow'});
        if(p.pierce>0)p.pierce--;else p.dead=true;
      }
    }
    if(p.dead&&p.k==='shock')burst(p.x,p.y,6,COL.gray,50,0.3);
  }
  projs=projs.filter(p=>!p.dead);
}

// ---------- pickups ----------
function spawnPickup(kind,x,y){pickups.push({kind,x,y,vx:rr(-40,40),vy:rr(-90,-30),t:0,cd:0,dead:false});}
function dropGold(x,y,n){for(let i=0;i<n;i++)spawnPickup('gold',x,y-4);}
function updatePickups(dt){
  for(const p of pickups){
    p.t+=dt;p.cd-=dt;
    p.vy+=420*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
    const ty=Math.floor(p.y/TS);
    if(isSolid(Math.floor(p.x/TS),ty)){p.y=ty*TS-0.01;p.vy=0;p.vx*=0.8;}
    if(p.x<8)p.x=8; if(p.x>lvl.w*16-8)p.x=lvl.w*16-8;
    const d2=dist2(p.x,p.y,P.x,P.y-6);
    if(p.t>0.3&&d2<48*48){const d=Math.sqrt(d2)||1;p.x+=(P.x-p.x)/d*260*dt;p.y+=(P.y-6-p.y)/d*260*dt;}
    if(p.cd<=0&&d2<10*10){
      p.dead=true;
      if(p.kind==='gold'){G.run.gold++;AU.sfx('coin');addFloat(p.x,p.y-6,'+1',COL.gold,1);}
      else{healP(6);AU.sfx('hp');addFloat(p.x,p.y-8,'+6',COL.white,1);}
    }
    if(p.t>25)p.dead=true;
  }
  pickups=pickups.filter(p=>!p.dead);
}

// ---------- chests / doors / zones / fake walls ----------
function updateInteract(dt){
  for(const c of lvl.chests){
    if(c.opened)continue;
    if(overlap(c.x-8,c.y-12,16,12,P.x-P.w/2,P.y-P.h,P.w,P.h)){
      c.opened=true;AU.sfx('chest');burst(c.x,c.y-8,16,COL.gold,90,0.6,200);
      if(c.tier==='rare'){openReward('chest');break;}
      else{dropGold(c.x,c.y,8);}
    }
  }
  for(const d of lvl.doors){
    if(d.kind==='boss')continue;
    if(P.onG&&Math.abs(P.x-d.x)<14&&Math.abs(P.y-d.y)<28){
      AU.sfx('door');G.flashW=0.8;
      G.pendLevel=lvl.idx+1; openReward('door');
      break;
    }
  }
  for(const z of lvl.zones){
    if(z.state==='idle'&&P.x>(z.x0+1)*16){
      z.state='active';z.t=0;AU.sfx('gate');shake(0.4);
      fillT(z.x0,z.gy-5,z.x0,z.gy-1,T_SOLID); fillT(z.x1,z.gy-5,z.x1,z.gy-1,T_SOLID);
      spawnWave(z);
    }else if(z.state==='active'){
      const alive=ents.some(e=>e.zone===z&&!e.dead);
      if(!alive){
        z.wi++;
        if(z.wi>=z.waves.length){
          z.state='done';AU.sfx('lvl');
          fillT(z.colL,z.gy-5,z.colL,z.gy-1,T_EMPTY); fillT(z.colR,z.gy-5,z.colR,z.gy-1,T_EMPTY);
          lvl.chests.push({x:((z.x0+z.x1)/2)*16,y:z.gy*16,tier:'rare',opened:false});
          burst(((z.x0+z.x1)/2)*16,z.gy*16-10,20,COL.gold,80,0.7,150);
          addFloat(P.x,P.y-24,T('f_cleared'),COL.gold,1);
        }else spawnWave(z);
      }
    }
  }
  const ptx=Math.floor(P.x/TS),pty=Math.floor((P.y-4)/TS);
  const fi=pty*lvl.w+ptx;
  if(lvl.fakeMap[fi]!==undefined){
    const reg=lvl.fakeRegions[lvl.fakeMap[fi]];
    if(!reg.revealed){
      reg.revealed=true;AU.sfx('reveal');shake(0.15);
      for(const ti of reg.tiles){setTile(ti%lvl.w,Math.floor(ti/lvl.w),T_EMPTY);burst((ti%lvl.w)*16+8,Math.floor(ti/lvl.w)*16+8,6,COL.foe,60,0.5);}
      addFloat(P.x,P.y-26,T('f_secret'),COL.gold,1);
    }
  }
}
function spawnWave(z){
  const list=z.waves[z.wi];AU.sfx('tele');shake(0.2);
  for(let i=0;i<list.length;i++){
    const side=i%2===0?z.x0+3:z.x1-3;
    const e=spawnEnemy(list[i],side*16,z.gy*16,z.wi===z.waves.length-1&&i===list.length-1&&lvl.idx>0);
    e.zone=z;e.spawnT=0.6;
    burst(side*16,z.gy*16-8,10,'#2a2b33',60,0.5);
  }
}

// ---------- player ----------
const WEAPONS={
  fangs:{name:{en:'TWIN FANGS',zh:'双牙'},sub:{en:'DAGGER PAIR',zh:'双匕'},critN:{en:'BACKSTAB X2.2',zh:'背刺 ×2.2'},
    d:{en:['3-HIT COMBO. FAST.','CRIT: STRIKE FROM BEHIND.'],zh:['三段连击，迅捷。','暴击：从背后攻击。']},
    combo:[{w:.055,a:.06,r:.085,dmg:6,reach:16,arcH:9,kb:70,lunge:30},
           {w:.05,a:.06,r:.085,dmg:6,reach:16,arcH:9,kb:70,lunge:30},
           {w:.07,a:.07,r:.15,dmg:10,reach:20,arcH:10,kb:150,lunge:40}],critM:2.2},
  spear:{name:{en:'ASH SPEAR',zh:'灰烬长枪'},sub:{en:'LONG REACH',zh:'超长距离'},critN:{en:'TIP HIT X2',zh:'枪尖 ×2'},
    d:{en:['METHODICAL THRUST. WIDE REACH.','CRIT: HIT AT MAX RANGE.'],zh:['沉稳突刺，范围宽广。','暴击：枪尖命中。']},
    combo:[{w:.11,a:.08,r:.13,dmg:12,reach:31,arcH:6,kb:130,lunge:16}],critM:2},
  grave:{name:{en:'GRAVELORD BLADE',zh:'坟主巨刃'},sub:{en:'GREATSWORD',zh:'巨剑'},critN:{en:'SWEEP X1.8',zh:'横扫 ×1.8'},
    d:{en:['SLOW. DEVASTATING ARCS.','CRIT: HIT 2+ ENEMIES AT ONCE.'],zh:['缓慢，横扫一切。','暴击：同时命中2+敌人。']},
    combo:[{w:.2,a:.09,r:.22,dmg:26,reach:27,arcH:13,kb:260,lunge:10}],critM:1.8}
};
const SKILLS={
  slam:{name:{en:'SKYFALL',zh:'天坠'},cd:6.5,d:{en:['LEAP AND CRASH DOWN.','AOE DMG + STUN.','UNBLOCKABLE.'],zh:['跃起后猛砸地面。','范围伤害+眩晕。','不可被格挡.']}},
  rift:{name:{en:'RIFT DASH',zh:'裂隙突进'},cd:5,d:{en:['DASH THROUGH FOES.','IFRAMES + 18 DMG TO ALL IN PATH.'],zh:['向前突进穿透敌人。','无敌帧+路径上18伤害.']}},
  nova:{name:{en:'PALE NOVA',zh:'苍白新星'},cd:7,d:{en:['BURST AROUND YOU.','20 DMG, HEAVY KNOCKBACK.'],zh:['以自身为中心爆发。','20伤害，强力击退.']}}
};
function makePlayer(weapon,skill){
  return {x:0,y:0,w:8,h:14,vx:0,vy:0,face:1,onG:false,coyote:0,jbuf:0,jumps:0,cut:true,
    hp:100,maxhp:100,inv:0,rollT:0,rollCd:0,adren:false,riposte:false,
    atk:null,bowDraw:-1,bowCd:0,skill,skillCd:0,weapon,mods:{},hurtFx:0,flash:0,
    scarf:[],deadGone:false,windUsed:false,lastSafe:{x:0,y:0},safeT:0,legP:0,
    lastAtkT:0,lastAtkI:0,slamT:0};
}
const hasMod=id=>!!P.mods[id];
function updatePlayer(dt){
  const p=P;
  if(bodySolid(p)){p.x=p.lastSafe.x;p.y=p.lastSafe.y-2;p.vx=0;p.vy=0;dust(p.x,p.y,6);}
  p.inv=Math.max(0,p.inv-dt);p.flash=Math.max(0,p.flash-dt);p.hurtFx=Math.max(0,p.hurtFx-dt);
  p.rollCd=Math.max(0,p.rollCd-dt);p.bowCd=Math.max(0,p.bowCd-dt);p.skillCd=Math.max(0,p.skillCd-dt);
  p.coyote-=dt;p.jbuf-=dt;
  const inpDir=(K_RIGHT()?1:0)-(K_LEFT()?1:0);
  if(inpDir!==0&&p.rollT<=0)p.face=inpDir;
  const spdMult=hasMod('swift')?1.14:1;
  const baseSpd=118*spdMult*(p.bowDraw>=0?0.55:1);
  if(p.rollT>0){
    p.rollT-=dt;
    if(p.rollT<=0&&hasMod('adren'))p.adren=true;
    if(p.rollT>0&&FR()<dt*40)ghost(p.x,p.y,p.face,'roll',0.22);
  }else{
    if(K_ROLL()&&p.rollCd<=0){
      p.atk=null;p.bowDraw=-1;
      p.rollT=0.19;p.rollCd=0.65*(hasMod('swift')?0.75:1);p.inv=Math.max(p.inv,0.26);
      p.vx=p.face*250;AU.sfx('roll');dust(p.x,p.y,4);
    }else{
      const acc=p.onG?1400:900;
      if(inpDir!==0)p.vx=clamp(p.vx+inpDir*acc*dt,-baseSpd,baseSpd);
      else{const f=p.onG?1600:220;p.vx-=clamp(p.vx,-f*dt,f*dt);if(p.onG&&Math.abs(p.vx)<8)p.vx=0;}
      if(K_ATK()&&!p.atk)startAttack();
      if(p.bowDraw>=0){p.bowDraw+=dt;if(!K_BOW())fireBow();}
      else if(K_BOW_P()&&p.bowCd<=0&&!p.atk)p.bowDraw=0;
      if(K_SKILL()&&p.skillCd<=0)useSkill();
      if(K_JUMP())p.jbuf=0.12;
      if(p.jbuf>0){
        if(p.onG||p.coyote>0){p.vy=-285;p.jumps=1;p.jbuf=0;p.coyote=0;p.onG=false;AU.sfx('jump');dust(p.x,p.y,3);}
        else if(p.jumps<2){p.vy=-262;p.jumps=2;p.jbuf=0;AU.sfx('djump');
          for(let i=0;i<6;i++)parts.push({x:p.x+rr(-5,5),y:p.y-4,vx:rr(-30,30),vy:rr(10,40),t:0,life:0.3,col:COL.gray,g:0,sz:1});}
      }
      if(!K_JUMP_H()&&p.vy<-60&&p.cut){p.vy*=0.45;p.cut=false;}
      if(p.vy>=0)p.cut=true;
    }
  }
  if(p.atk)updateAttack(dt);
  const wasAir=!p.onG;
  const res=moveBody(p,dt);
  p.onG=res.g;
  if(p.onG){
    p.coyote=0.09;p.jumps=0;p.cut=true;
    if(wasAir){AU.sfx('land');dust(p.x,p.y,5);}
    if(Math.abs(p.vx)>60){p.legP+=Math.abs(p.vx)*dt*0.12;if(FR()<dt*8)dust(p.x-p.face*3,p.y,1);}
    p.safeT-=dt;
    if(p.safeT<=0&&!onSpikes(p)){p.lastSafe={x:p.x,y:p.y};p.safeT=0.4;}
  }else p.legP=0;
  p.vy=Math.min(430,p.vy+950*dt);
  if(onSpikes(p)&&p.inv<=0){damagePlayer(12,{kx:-p.face,up:true});AU.sfx('spike');p.vy=-200;p.vx=-p.face*120;}
  if(p.y>lvl.h*TS+40){damagePlayer(15,{});p.x=p.lastSafe.x;p.y=p.lastSafe.y-2;p.vx=0;p.vy=0;}
  p.scarf.unshift({x:p.x-p.face*2,y:p.y-12});if(p.scarf.length>7)p.scarf.pop();
  if(!p.deadGone)updateInteract(dt);
}
function healP(n){P.hp=Math.min(P.maxhp,P.hp+n);}
function startAttack(){
  const w=WEAPONS[P.weapon];
  let i=0;
  if(P.lastAtkT&&G.t-P.lastAtkT<0.6)i=(P.lastAtkI+1)%w.combo.length;
  P.atk={i,stage:'wind',t:0,hits:[],queued:false,swing:++swingCounter,hitBoss:false};
  P.bowDraw=-1;
}
function updateAttack(dt){
  const p=P,st=p.atk,w=WEAPONS[p.weapon],c=w.combo[st.i];
  st.t+=dt;
  if(K_ATK()&&st.stage!=='wind')st.queued=true;
  if(st.stage==='wind'){
    if(st.t>=c.w){st.stage='act';st.t=0;
      p.vx+=p.face*c.lunge*2.2;
      slashFx(p.x+p.face*6,p.y-8,p.face,c.reach*0.7,c.reach,0.13);
      AU.sfx(p.weapon==='grave'?'heavy':'swing');
      if(p.weapon==='grave')shake(0.1);
    }
  }else if(st.stage==='act'){
    const hx=p.face>0?p.x+2:p.x-2-c.reach, hy=p.y-8-c.arcH/2;
    for(const e of ents){
      if(e.dead||e.spawnT>0||st.hits.includes(e))continue;
      if(overlap(hx,hy,c.reach,c.arcH,e.x-e.w/2,e.y-e.h,e.w,e.h)){
        st.hits.push(e);
        if(p.weapon==='grave')continue;
        const backstab=p.weapon==='fangs'&&sgn(e.x-p.x)===e.dir;
        const tip=p.weapon==='spear'&&Math.abs(e.x-p.x)>c.reach*0.68;
        applyHit(e,c.dmg,{crit:backstab||tip||p.riposte,kb:c.kb,dir:p.face,src:p.weapon});
        if(p.riposte){p.riposte=false;addFloat(e.x,e.y-e.h-8,T('f_riposte'),COL.gold,1);}
      }
    }
    if(boss&&!boss.dead&&!boss.invuln&&overlap(hx,hy,c.reach,c.arcH,boss.x-boss.w/2,boss.y-boss.h,boss.w,boss.h)&&!st.hitBoss){
      st.hitBoss=true;
      hitBossMelee(c.dmg,{src:p.weapon});
    }
    if(st.t>=c.a){
      if(p.weapon==='grave'&&st.hits.length>0){
        const sweep=st.hits.length>=2;
        for(const e of st.hits)applyHit(e,c.dmg,{crit:sweep||p.riposte,kb:c.kb,dir:p.face,src:'grave'});
        if(sweep)addFloat(p.x,p.y-26,T('f_sweep'),COL.gold,1);
        if(p.riposte)p.riposte=false;
      }
      st.stage='rec';st.t=0;
    }
  }else{
    if(st.queued&&w.combo.length>1&&st.t>=c.r*0.3){
      const ni=(st.i+1)%w.combo.length;
      p.lastAtkI=ni;p.lastAtkT=G.t;
      p.atk={i:ni,stage:'wind',t:0,hits:[],queued:false,swing:++swingCounter,hitBoss:false};
      return;
    }
    if(st.t>=c.r*0.5&&K_JUMP())p.jbuf=0.12;
    if(st.t>=c.r){p.lastAtkI=st.i;p.lastAtkT=G.t;p.atk=null;}
  }
}
function fireBow(){
  const p=P,full=p.bowDraw>=bowFullT();
  p.bowDraw=-1;p.bowCd=full?0.5:0.34;
  const dmg=(full?15:8)+(hasMod('shot')?3:0);
  spawnProj({k:'arrow',x:p.x+p.face*5,y:p.y-9,vx:p.face*(full?430:330),vy:full?0:-30,
    g:full?0:260,dmg,crit:full,from:'player',pierce:full?3:0,kb:full?140:70,life:1.4,sz:3});
  AU.sfx(full?'bowfull':'bow');
  if(full)shake(0.08);
}
function bowFullT(){return hasMod('shot')?0.29:0.45;}
function useSkill(){
  const p=P;
  p.skillCd=SKILLS[p.skill].cd*(hasMod('clock')?0.7:1);
  AU.sfx('skill');
  if(p.skill==='slam'){p.slamT=0.001;p.vy=-230;p.inv=Math.max(p.inv,0.3);}
  else if(p.skill==='rift'){
    p.inv=Math.max(p.inv,0.22);
    const dir=p.face;
    for(let i=0;i<9;i++)ghost(p.x+dir*i*15,p.y,p.face,'dash',0.25+i*0.02);
    p.x+=dir*130;
    let n=0;while(bodySolid(p)&&n++<30)p.x-=dir*4;
    for(const e of ents){if(!e.dead&&e.spawnT<=0&&Math.abs(e.x-p.x)<80&&e.y>p.y-40&&e.y<p.y+20)
      applyHit(e,18,{crit:false,kb:120,dir,unblock:true,src:'rift'});}
    if(boss&&!boss.dead&&!boss.invuln&&Math.abs(boss.x-p.x)<80)hitBossMelee(18);
    burst(p.x,p.y-8,10,COL.white,80,0.3,0);
  }else if(p.skill==='nova'){
    ringFx(p.x,p.y-8,54,0.35,COL.white,2);shake(0.3);slowmo(0.4,0.12);
    for(const e of ents){if(!e.dead&&e.spawnT<=0&&dist2(e.x,e.y-7,p.x,p.y-8)<60*60)
      applyHit(e,20,{crit:false,kb:300,dir:sgn(e.x-p.x)||1,unblock:true,src:'nova'});}
    if(boss&&!boss.dead&&!boss.invuln&&dist2(boss.x,boss.y-16,p.x,p.y-8)<70*70)hitBossMelee(20);
    burst(p.x,p.y-8,24,COL.white,140,0.5,0);
  }
}
function updateSlam(dt){
  const p=P;if(!p.slamT)return;
  p.slamT+=dt;
  if(p.slamT>0.05)p.vy=430;
  if(p.onG&&p.slamT>0.1){
    p.slamT=0;AU.sfx('slam');shake(0.5);hitstop(0.05);dust(p.x,p.y,12);
    ringFx(p.x,p.y-4,44,0.3,COL.white,2);
    for(const e of ents){if(!e.dead&&e.spawnT<=0&&dist2(e.x,e.y-6,p.x,p.y-4)<80*80){
      applyHit(e,26,{crit:false,kb:200,dir:sgn(e.x-p.x)||1,unblock:true,src:'slam'});
      if(!e.dead){e.stun=Math.max(e.stun||0,1.4);AU.sfx('stun');addFloat(e.x,e.y-e.h-6,T('f_stun'),COL.pale,1);}}}
    if(boss&&!boss.dead&&!boss.invuln&&dist2(boss.x,boss.y-16,p.x,p.y-4)<90*90)hitBossMelee(26);
  }
}
function damagePlayer(amt,opts){
  const p=P;
  if(G.god)return;
  opts=opts||{};
  if(p.inv>0||p.rollT>0){
    if(p.rollT>0&&opts.isAttack&&hasMod('riposte')&&!p.riposte){
      p.riposte=true;AU.sfx('riposte');addFloat(p.x,p.y-24,T('f_riposte_r'),COL.gold,1);
      ringFx(p.x,p.y-8,14,0.25,COL.gold,1);
    }
    return;
  }
  p.hp-=amt;p.inv=0.9;p.flash=0.12;p.hurtFx=0.5;shake(0.45);hitstop(0.03);
  p.vx=(opts.kx!==undefined?opts.kx:-p.face)*140;p.vy=opts.up?p.vy:-140;
  AU.sfx('hurt');burst(p.x,p.y-8,8,COL.red,90,0.4);
  addFloat(p.x,p.y-24,'-'+amt,COL.red,1);
  if(p.hp<=0){
    if(hasMod('wind')&&!p.windUsed){
      p.windUsed=true;p.hp=Math.round(p.maxhp*0.4);p.inv=2;G.flashW=0.6;
      AU.sfx('lvl');addFloat(p.x,p.y-30,T('f_wind'),COL.gold,2);
      burst(p.x,p.y-8,30,COL.gold,120,0.8);
      for(const e of ents)if(!e.dead&&dist2(e.x,e.y,p.x,p.y)<70*70){e.vx=sgn(e.x-p.x)*220;e.vy=-120;}
      return;
    }
    p.hp=0;p.deadGone=true;AU.sfx('pdie');slowmo(0.2,1.4);shake(0.8);AU.setInt(0);
    burst(p.x,p.y-8,40,COL.white,140,1.2);burst(p.x,p.y-8,20,COL.red,100,1);
    G.state='dead';G.deadT=0;
  }
}

// ---------- combat ----------
function applyHit(e,base,opts){
  if(e.dead||e.spawnT>0)return;
  opts=opts||{};
  if(e.type==='warden'&&!opts.unblock&&e.vuln<=0&&sgn(P.x-e.x)===e.dir){
    AU.sfx('clang');burst(P.x+P.face*8,P.y-9,5,COL.pale,90,0.25,0);
    addFloat(e.x+e.dir*8,e.y-e.h-4,T('f_block'),COL.dim,1);
    P.vx=-P.face*90;hitstop(0.02);
    if(hasMod('bleed'))applyBleed(e);
    return;
  }
  let dmg=base,crit=opts.crit;
  if(P.adren){dmg*=2.2;P.adren=false;addFloat(P.x,P.y-24,T('f_adren'),COL.gold,1);}
  if(crit)dmg*=opts.src==='bow'?2:WEAPONS[P.weapon].critM;
  if(hasMod('exec')&&e.hp<e.maxhp*0.3){dmg*=2;addFloat(e.x,e.y-e.h-4,T('f_exec'),COL.gold,1);}
  if(e.stun>0)dmg*=1.5;
  dmg=Math.max(1,Math.round(dmg));
  e.hp-=dmg;e.flash=0.1;e.aggro=true;
  e.vx=(opts.dir||1)*(opts.kb||80);e.vy=-40;
  G.run.dmg+=dmg;
  addFloat(e.x+rr(-3,3),e.y-e.h-2,''+dmg+(crit?'!':''),crit?COL.gold:COL.white,crit?2:1);
  burst(e.x,e.y-e.h*0.5,crit?8:4,crit?COL.gold:COL.white,crit?110:70,0.3);
  hitstop(crit?0.06:(opts.src==='grave'?0.05:0.035));shake(crit?0.22:0.12);
  AU.sfx(crit?'crit':'hit');
  if(hasMod('bleed'))applyBleed(e);
  if(crit&&hasMod('vamp')){healP(3);addFloat(P.x,P.y-20,'+3',COL.gold,1);}
  if(e.hp<=0)killEnemy(e);
}
function applyBleed(e){
  e.bleedS=(e.bleedS||0)+1;e.bleedLife=4;e.bleedT=0.5;
  if(e.bleedS>=4){
    e.bleedS=0;const d=10+lvl.idx*5;
    e.hp-=d;addFloat(e.x,e.y-e.h-8,T('f_burst')+' '+d,COL.red,1);
    burst(e.x,e.y-e.h*0.5,12,COL.red,110,0.5);AU.sfx('crit');shake(0.2);hitstop(0.04);
    if(e.hp<=0)killEnemy(e);
  }
}
function killEnemy(e){
  if(e.dead)return;e.dead=true;
  G.run.kills++;
  AU.sfx('edie');hitstop(0.05);shake(0.2);
  burst(e.x,e.y-e.h*0.5,14,e.elite?COL.gold:COL.foe,100,0.6);
  burst(e.x,e.y-e.h*0.5,6,COL.white,60,0.4);
  dropGold(e.x,e.y,e.elite?6:(e.type==='warden'?4:2));
  if(FR()<(e.elite?1:0.16))spawnPickup('hp',e.x,e.y-6);
  if(hasMod('inst')){P.rollCd=0;addFloat(P.x,P.y-24,T('f_reset'),COL.pale,1);}
  if(hasMod('clock'))P.skillCd=Math.max(0,P.skillCd-1);
}

// ---------- enemies ----------
const EDEF={
  husk:{hp:30,w:9,h:13,contact:7},
  stalker:{hp:24,w:7,h:14,contact:6},
  sentinel:{hp:26,w:9,h:14,contact:5},
  warden:{hp:75,w:12,h:15,contact:9}
};
function spawnEnemy(type,x,y,elite){
  const d=EDEF[type];
  const e={type,x,y,w:d.w,h:d.h,vx:0,vy:0,dir:FR()<0.5?-1:1,
    hp:Math.round(d.hp*(elite?1.9:1)),maxhp:Math.round(d.hp*(elite?1.9:1)),
    contact:Math.round(d.contact*(elite?1.3:1)),t:0,st:'idle',stT:0,cd:rr(0.3,1),
    aggro:false,flash:0,stun:0,vuln:0,dead:false,spawnT:0,elite:!!elite,contactCd:0,onG:false,zone:null,bleedS:0,bleedLife:0,bleedT:0,legP:0};
  ents.push(e);return e;
}
function alertNear(e){
  for(const o of ents)if(o!==e&&!o.dead&&dist2(o.x,o.y,e.x,e.y)<110*110)o.aggro=true;
}
function updateEnemy(e,dt){
  e.t+=dt;e.flash=Math.max(0,e.flash-dt);e.vuln=Math.max(0,e.vuln-dt);e.cd-=dt;e.stT+=dt;
  if(e.spawnT>0){e.spawnT-=dt;return;}
  if(e.bleedS>0){
    e.bleedLife-=dt;e.bleedT-=dt;
    if(e.bleedT<=0){e.bleedT=0.5;e.hp-=1;addFloat(e.x,e.y-e.h,'1',COL.red,1);
      if(e.hp<=0){killEnemy(e);return;}}
    if(e.bleedLife<=0)e.bleedS=0;
  }
  if(e.stun>0){
    e.stun-=dt;e.vx=0;e.vy=Math.min(430,e.vy+950*dt);moveBody(e,dt);
    if(FR()<dt*10)parts.push({x:e.x+rr(-6,6),y:e.y-e.h-4,vx:0,vy:-14,t:0,life:0.4,col:COL.pale,g:0,sz:1});
    return;
  }
  const dx=P.x-e.x,dy=(P.y-7)-(e.y-7),d=Math.hypot(dx,dy);
  if(!e.aggro){
    const range=e.type==='sentinel'?230:(e.type==='stalker'?90:170);
    if(d<range&&losClear(e.x,e.y-8,P.x,P.y-8)&&!P.deadGone){e.aggro=true;alertNear(e);}
  }
  if(!e.aggro||P.deadGone){e.vx*=1-8*dt;}
  else{
    switch(e.type){
      case 'husk':updateHusk(e,dt,dx,dy,d);break;
      case 'stalker':updateStalker(e,dt,dx,dy,d);break;
      case 'sentinel':updateSentinel(e,dt,dx,dy,d);break;
      case 'warden':updateWarden(e,dt,dx,dy,d);break;
    }
  }
  e.vy=Math.min(430,e.vy+950*dt);
  const res=moveBody(e,dt);e.onG=res.g;
  if(res.wl||res.wr)e.vx=0;
  e.contactCd-=dt;
  if(!P.deadGone&&e.contactCd<=0&&e.st!=='tel'&&overlap(e.x-e.w/2,e.y-e.h,e.w,e.h,P.x-P.w/2,P.y-P.h,P.w,P.h)){
    damagePlayer(e.contact,{isAttack:true,kx:sgn(P.x-e.x)||1});e.contactCd=0.8;
  }
  if(e.onG&&(e.type==='husk'||e.type==='warden')&&e.st!=='lunge'&&e.st!=='bash'){
    const ahead=Math.floor((e.x+e.dir*(e.w/2+2))/TS),below=Math.floor((e.y+2)/TS);
    if(!isSolid(ahead,below)&&!isSolid(ahead,below+1))e.vx=0;
  }
  if(e.y>lvl.h*TS+60)e.dead=true;
}
function updateHusk(e,dt,dx,dy,d){
  e.dir=sgn(dx)||e.dir;
  if(e.st==='idle'||e.st==='chase'){
    e.st='chase';
    if(Math.abs(dx)<52&&Math.abs(dy)<20&&e.cd<=0&&losClear(e.x,e.y-8,P.x,P.y-8)){e.st='tel';e.stT=0;AU.sfx('tele');}
    else e.vx=lerp(e.vx,e.dir*42,10*dt);
  }else if(e.st==='tel'){
    e.vx*=1-12*dt;
    if(e.stT>0.42){e.st='lunge';e.stT=0;e.vx=e.dir*300;AU.sfx('swing');
      fx.push({k:'arc',x:e.x,y:e.y-8,dir:e.dir,t:0,life:0.2,r:18});}
  }else if(e.st==='lunge'){
    if(e.stT>0.22){e.st='rec';e.stT=0;e.vx*=0.3;}
  }else if(e.st==='rec'){
    e.vx*=1-10*dt;
    if(e.stT>0.55){e.st='chase';e.stT=0;e.cd=1.1;}
  }
}
function updateStalker(e,dt,dx,dy,d){
  e.dir=sgn(dx)||e.dir;
  if(e.st==='idle')e.st='cloak';
  if(e.st==='cloak'){
    e.vx*=1-6*dt;
    if(e.aggro&&(d<86||e.flash>0)){e.st='tel';e.stT=0;AU.sfx('tele');}
  }else if(e.st==='tel'){
    e.vx*=1-12*dt;
    if(e.stT>0.42){e.st='dash';e.stT=0;e.vx=e.dir*380;e.vy=sgn(dy)*-60;AU.sfx('roll');}
  }else if(e.st==='dash'){
    if(FR()<dt*50)ghost(e.x,e.y,e.dir,'stalk',0.2);
    if(e.stT>0.26){e.st='rec';e.stT=0;e.vx*=0.2;}
  }else if(e.st==='rec'){
    e.vx*=1-10*dt;
    if(e.stT>0.7){e.st=d>200?'cloak':'chase';e.stT=0;e.cd=0.5;}
  }else if(e.st==='chase'){
    e.vx=lerp(e.vx,e.dir*80,8*dt);
    if(e.cd<=0&&d<120){e.st='tel';e.stT=0;AU.sfx('tele');}
    else if(d>230){e.st='cloak';e.stT=0;}
  }
}
function updateSentinel(e,dt,dx,dy,d){
  e.dir=sgn(dx)||e.dir;
  if(e.st==='idle'||e.st==='pos'){
    e.st='pos';
    if(d<110)e.vx=lerp(e.vx,-e.dir*55,8*dt);
    else if(d>240)e.vx=lerp(e.vx,e.dir*38,8*dt);
    else e.vx*=1-8*dt;
    if(e.cd<=0&&d<280&&losClear(e.x,e.y-9,P.x,P.y-9)){e.st='tel';e.stT=0;
      e.aimX=P.x;e.aimY=P.y-8;AU.sfx('tele');}
  }else if(e.st==='tel'){
    e.vx*=1-10*dt;
    if(e.stT<0.3){e.aimX=lerp(e.aimX,P.x,10*dt);e.aimY=lerp(e.aimY,P.y-8,10*dt);}
    if(e.stT>0.55){
      e.st='pos';e.stT=0;e.cd=2.3+FR()*0.6;
      const a=Math.atan2(e.aimY-(e.y-9),e.aimX-e.x);
      spawnProj({k:'bolt',x:e.x+Math.cos(a)*8,y:e.y-9+Math.sin(a)*8,vx:Math.cos(a)*235,vy:Math.sin(a)*235,dmg:10,life:2.2,sz:2});
      AU.sfx('bow');
    }
  }
  if(e.st==='tel'&&e.stT<0.5)fx.push({k:'aimline',x1:e.x,y1:e.y-9,x2:e.aimX,y2:e.aimY,t:0,life:0.05});
}
function updateWarden(e,dt,dx,dy,d){
  e.dir=sgn(dx)||e.dir;
  if(e.st==='idle'||e.st==='chase'){
    e.st='chase';
    if(Math.abs(dx)<44&&Math.abs(dy)<18&&e.cd<=0){e.st='tel';e.stT=0;AU.sfx('tele');}
    else e.vx=lerp(e.vx,e.dir*26,8*dt);
  }else if(e.st==='tel'){
    e.vx*=1-12*dt;
    if(e.stT>0.65){e.st='bash';e.stT=0;e.vx=e.dir*230;AU.sfx('heavy');}
  }else if(e.st==='bash'){
    if(!P.deadGone&&e.bashHit!==true&&overlap(e.x+e.dir*4,e.y-16,14,16,P.x-P.w/2,P.y-P.h,P.w,P.h)){
      e.bashHit=true;damagePlayer(20,{isAttack:true,kx:e.dir});P.vy=-160;
    }
    if(e.stT>0.24){e.st='rec';e.stT=0;e.vx*=0.1;e.bashHit=false;e.vuln=0.9;}
  }else if(e.st==='rec'){
    e.vx*=1-10*dt;
    if(e.stT>0.85){e.st='chase';e.stT=0;e.cd=2.4;}
  }
}

// ---------- boss ----------
function makeBoss(x,y){
  return {x,y,w:24,h:34,vx:0,vy:0,face:-1,hp:850,maxhp:850,phase:1,st:'intro',stT:0,
    t:0,cd:1.2,flash:0,invuln:true,dead:false,deadT:0,stagger:0,combo:0,active:false,
    roared:false,lastPick:'',rushHit:false,slamHit:false,invis:false,contactCd:0,mx:0,novaW:0};
}
function hitBossMelee(base,opts){
  const b=boss;
  if(!b||b.invuln||b.dead)return;
  opts=opts||{};
  let dmg=base,crit=!!opts.crit;
  const w=WEAPONS[P.weapon];
  if(P.riposte){crit=true;P.riposte=false;addFloat(b.x,b.y-b.h-8,T('f_riposte'),COL.gold,1);}
  if(P.adren){dmg*=2.2;P.adren=false;addFloat(P.x,P.y-24,T('f_adren'),COL.gold,1);}
  if(!opts.src){
    if(P.weapon==='fangs'&&sgn(P.x-b.x)===b.face)crit=true;
    if(P.weapon==='grave'&&b.stagger>0)crit=true;
  }
  if(crit)dmg*=opts.src==='bow'?2:w.critM;
  if(b.stagger>0)dmg*=1.5;
  dmg=Math.max(1,Math.round(dmg));
  b.hp-=dmg;b.flash=0.1;G.run.dmg+=dmg;
  addFloat(b.x+rr(-6,6),b.y-b.h-4,''+dmg+(crit?'!':''),crit?COL.gold:COL.white,crit?2:1);
  burst(b.x,b.y-b.h*0.6,crit?8:5,crit?COL.gold:COL.white,90,0.35);
  hitstop(crit?0.055:0.035);shake(crit?0.2:0.12);
  AU.sfx(crit?'crit':'hit');
  if(hasMod('bleed')){b.bleedS=(b.bleedS||0)+1;b.bleedLife=4;
    if(b.bleedS>=4){b.bleedS=0;const d=18;b.hp-=d;addFloat(b.x,b.y-b.h-10,T('f_burst')+' '+d,COL.red,1);burst(b.x,b.y-b.h*0.5,14,COL.red,120,0.5);}}
  if(crit&&hasMod('vamp')){healP(3);addFloat(P.x,P.y-20,'+3',COL.gold,1);}
  if(b.hp<=0){bossDie();return;}
  if(b.phase===1&&b.hp<=b.maxhp*0.6)bossRage(2);
  else if(b.phase===2&&b.hp<=b.maxhp*0.25)bossRage(3);
}
function bossRage(ph){
  const b=boss;b.phase=ph;b.st='rage';b.stT=0;b.invuln=true;b.combo=0;
  AU.sfx('roar');shake(0.7);slowmo(0.35,0.5);G.flashW=0.3;
  burst(b.x,b.y-b.h*0.5,30,COL.red,150,0.8);
  if(ph===2)risePillars();
  addFloat(b.x,b.y-b.h-14,ph===2?T('f_awaken'):T('f_ember'),COL.red,1);
}
function risePillars(){
  lvl.pillarUp=true;
  for(let i=0;i<lvl.pillars.length;i++){
    const p=lvl.pillars[i];
    setTimeoutGame(0.2+i*0.18,()=>{
      fillT(p.tx,p.ty,p.tx+1,p.ty+2,T_SOLID);
      dust(p.tx*16+16,p.ty*16+48,8);dust(p.tx*16+16,p.ty*16+16,8);
      AU.sfx('slam');shake(0.25);
    });
  }
}
function destroyPillarAt(px2,py,r){
  for(const p of lvl.pillars){
    if(Math.abs(p.tx*16+16-px2)<r&&p.ty*16<py){
      let any=false;
      for(let y=p.ty;y<=p.ty+2;y++)for(let x=p.tx;x<=p.tx+1;x++)
        if(isSolid(x,y)){setTile(x,y,T_EMPTY);any=true;}
      if(any){burst(p.tx*16+16,p.ty*16+24,14,COL.foe,120,0.6);AU.sfx('slam');}
    }
  }
}
function updateBoss(dt){
  const b=boss;if(!b)return;
  b.t+=dt;b.stT+=dt;b.cd-=dt;b.flash=Math.max(0,b.flash-dt);b.stagger=Math.max(0,b.stagger-dt);
  if(b.dead){
    b.deadT+=dt;
    if(b.deadT<1.2&&FR()<dt*30)burst(b.x+rr(-16,16),b.y-rr(0,34),4,FR()<0.5?COL.white:COL.red,80,0.5);
    if(b.deadT>2.4&&G.state==='play')winGame();
    return;
  }
  // contact damage
  if(b.active&&!b.invis&&b.st!=='rush'){
    b.contactCd-=dt;
    if(!P.deadGone&&b.contactCd<=0&&overlap(b.x-b.w/2,b.y-b.h,b.w,b.h,P.x-P.w/2,P.y-P.h,P.w,P.h)){
      b.contactCd=0.8;damagePlayer(8,{isAttack:true,kx:sgn(P.x-b.x)||1});
    }
  }
  if(b.st==='intro'){
    if(b.stT>0.9&&!b.roared){b.roared=true;AU.sfx('roar');shake(0.6);burst(b.x,b.y-20,20,COL.red,120,0.7);
      telLine(0,b.y-16,lvl.w*16,b.y-16,0.8);}
    if(b.stT>1.9){b.st='idle';b.stT=0;b.invuln=false;b.active=true;
      lvl.doorSealed=true;fillT(3,lvl.gy-6,3,lvl.gy-1,T_SOLID);
      AU.sfx('gate');
      addFloat(b.x,b.y-b.h-16,T('boss'),COL.red,1);
    }
    return;
  }
  if(b.st==='rage'){
    b.vx=0;
    if(b.stT>1.4){b.st='idle';b.stT=0;b.invuln=false;b.cd=0.4;}
    if(FR()<dt*20)burst(b.x+rr(-14,14),b.y-rr(4,32),2,COL.red,60,0.4);
    return;
  }
  const spd=b.phase===3?1.3:1;
  const dx=P.x-b.x;
  b.face=sgn(dx)||b.face;
  switch(b.st){
    case 'idle':{
      b.vx=lerp(b.vx,b.face*34*spd,4*dt);
      if(b.cd<=0&&b.stT>0.4){
        const opts=['slam','rush'];
        if(b.phase>=2)opts.push('ink','slam');
        if(b.phase>=3)opts.push('nova','rush');
        if(b.phase>=2&&Math.abs(dx)>150)opts.push('rush','rush');
        let pick=opts[(FR()*opts.length)|0];
        if(pick===b.lastPick&&FR()<0.6)pick=opts[(FR()*opts.length)|0];
        b.lastPick=pick;
        b.st=pick+'T';b.stT=0;b.combo=0;b.slamHit=false;
        if(pick==='slam')AU.sfx('tele');
        if(pick==='rush'){AU.sfx('tele');telLine(b.x,b.y-14,b.face>0?lvl.w*16:0,b.y-14,0.55);}
        if(pick==='nova')AU.sfx('tele');
        if(pick==='ink')AU.sfx('roar');
      }
      break;}
    case 'slamT':{
      b.vx*=1-10*dt;
      if(b.stT>0.5){
        b.st='slamRec';b.stT=0;b.vy=0;AU.sfx('slam');shake(0.45);hitstop(0.03);
        const fx0=b.x+b.face*16;
        burst(fx0,b.y,12,COL.gray,110,0.5);
        ringFx(fx0,b.y-2,30,0.25,COL.pale,2);
        spawnProj({k:'shock',x:fx0,y:b.y-6,vx:170*spd*b.face,vy:0,dmg:14,life:2.2,sz:5});
        spawnProj({k:'shock',x:fx0,y:b.y-6,vx:-170*spd*b.face,vy:0,dmg:14,life:2.2,sz:5});
        if(!P.deadGone&&b.slamHit!==true&&overlap(b.x+b.face*4,b.y-30,30,30,P.x-P.w/2,P.y-P.h,P.w,P.h)){
          b.slamHit=true;damagePlayer(20,{isAttack:true,kx:b.face});}
        destroyPillarAt(b.x+b.face*20,b.y,40);
        b.combo++;
        if(b.combo<(b.phase>=3?3:2)){b.st='slamRec';b.stT=0;b.nextSlam=true;}
        else{b.st='stagger';b.stT=0;b.stagger=0.95;addFloat(b.x,b.y-b.h-10,T('f_open'),COL.white,1);}
      }
      break;}
    case 'slamRec':{b.vx*=1-8*dt;if(b.stT>0.34){if(b.nextSlam){b.nextSlam=false;b.st='slamT';b.stT=0;AU.sfx('tele');}else{b.st='idle';b.stT=0;b.cd=0.8;}}break;}
    case 'stagger':{b.vx=0;if(b.stT>0.95){b.st='idle';b.stT=0;b.cd=0.8;}break;}
    case 'rushT':{
      b.vx*=1-12*dt;
      if(b.stT>0.55){b.st='rush';b.stT=0;b.vx=b.face*470*spd;b.rushHit=false;AU.sfx('roll');AU.sfx('roar');}
      break;}
    case 'rush':{
      if(FR()<dt*40)ghost(b.x,b.y,b.face,'boss',0.25);
      if(!P.deadGone&&!b.rushHit&&overlap(b.x-b.w/2,b.y-b.h,b.w,b.h,P.x-P.w/2,P.y-P.h,P.w,P.h)){
        b.rushHit=true;damagePlayer(18,{isAttack:true,kx:b.face});}
      if(FR()<dt*20)dust(b.x-b.face*10,b.y,2,-b.face);
      destroyPillarAt(b.x,b.y,26);
      const aheadX=b.x+b.face*(b.w/2+4);
      if(isSolid(Math.floor(aheadX/TS),Math.floor((b.y-10)/TS))||b.stT>0.9){
        b.st='wallstag';b.stT=0;b.vx=0;AU.sfx('slam');shake(0.5);
        burst(aheadX,b.y-12,16,COL.foe,130,0.6);
        b.stagger=0.85;addFloat(b.x,b.y-b.h-10,T('f_open'),COL.white,1);
      }
      break;}
    case 'wallstag':{if(b.stT>0.85){b.st='idle';b.stT=0;b.cd=0.7;}break;}
    case 'inkT':{
      b.vx=0;
      if(b.stT>0.4){b.st='inkUp';b.stT=0;b.vy=-560;AU.sfx('djump');}
      break;}
    case 'inkUp':{
      b.y+=b.vy*dt;b.vy+=1200*dt;
      if(b.stT>0.7){b.st='inkMark';b.stT=0;b.mx=P.x;b.invis=true;}
      break;}
    case 'inkMark':{
      if(b.stT<0.85)b.mx=lerp(b.mx,P.x,6*dt);
      b.x=b.mx;b.y=-40;
      if(FR()<dt*30)fx.push({k:'mark',x:b.mx,y:lvl.gy*16,t:0,life:0.06,r:44});
      if(b.stT>1.1){
        b.invis=false;b.x=b.mx;b.y=lvl.gy*16;b.vy=0;
        b.st='inkLand';b.stT=0;
        AU.sfx('slam');shake(0.6);hitstop(0.04);
        ringFx(b.x,b.y-2,46,0.3,COL.red,2);
        burst(b.x,b.y,20,COL.foe,150,0.6);
        destroyPillarAt(b.x,b.y,50);
        if(!P.deadGone&&dist2(P.x,P.y-8,b.x,b.y-8)<52*52)damagePlayer(22,{isAttack:true,kx:sgn(P.x-b.x)||1});
        for(let i=0;i<4;i++)spawnProj({k:'debris',x:b.x,y:b.y-10,vx:rr(-150,150),vy:rr(-260,-160),g:700,dmg:10,life:2,sz:3});
      }
      break;}
    case 'inkLand':{if(b.stT>0.6){b.st='idle';b.stT=0;b.cd=0.9;}break;}
    case 'novaT':{
      b.vx*=1-10*dt;
      if(b.stT>0.6){b.st='nova';b.stT=0;b.novaW=0;}
      break;}
    case 'nova':{
      b.vx=0;
      if(b.novaW<2&&b.stT>0.15+b.novaW*0.45){
        b.novaW++;AU.sfx('shock');shake(0.2);
        const n=11,off=b.novaW*(Math.PI/n);
        for(let i=0;i<n;i++){const a=off+i*Math.PI*2/n;
          spawnProj({k:'orb',x:b.x,y:b.y-16,vx:Math.cos(a)*125,vy:Math.sin(a)*125,dmg:12,life:3,sz:2});}
        ringFx(b.x,b.y-16,20,0.3,COL.red,1);
      }
      if(b.stT>1.2){b.st='idle';b.stT=0;b.cd=1.1;}
      break;}
  }
  if(b.st!=='inkUp'&&b.st!=='inkMark'){
    b.x+=b.vx*dt;
    if(b.st!=='rush'){
      b.vy=Math.min(500,b.vy+1100*dt);b.y+=b.vy*dt;
      const gy=lvl.gy*16; if(b.y>gy){b.y=gy;b.vy=0;}
    }
  }
  b.x=clamp(b.x,40,lvl.w*16-40);
}
function bossDie(){
  const b=boss;b.dead=true;b.st='dead';b.deadT=0;b.invuln=true;
  AU.sfx('boom');slowmo(0.15,2.2);shake(1);hitstop(0.3);
  G.flashW=1;
  burst(b.x,b.y-17,60,COL.white,180,1.4);burst(b.x,b.y-17,30,COL.red,140,1.2);
  addFloat(b.x,b.y-44,T('f_falls'),COL.gold,2);
  projs=projs.filter(p=>p.from==='player');
}

// ---------- mods & rewards ----------
const MODS=[
 {id:'mend',n:{en:'MEND',zh:'治愈'},t:0,d:{en:['RESTORE 45 HP.'],zh:['恢复45点生命。']},f:()=>healP(45)},
 {id:'stone',n:{en:'STONE HEART',zh:'石之心'},t:0,d:{en:['+25 MAX HP.','RESTORE 25 HP.'],zh:['+25最大生命。','恢复25点生命。']},f:()=>{P.maxhp+=25;healP(25);}},
 {id:'swift',n:{en:'SWIFT SOLES',zh:'疾风之靴'},t:0,d:{en:['+14% MOVE SPEED.','ROLL COOLDOWN -25%.'],zh:['+14%移动速度。','翻滚冷却-25%.']},f:()=>{}},
 {id:'bleed',n:{en:'HEMORRHAGE',zh:'放血'},t:0,d:{en:['HITS INFLICT BLEED.','4 STACKS BURST.'],zh:['攻击附加流血。','4层触发爆裂。']},f:()=>{}},
 {id:'exec',n:{en:'EXECUTIONER',zh:'处决者'},t:0,d:{en:['+100% DMG TO FOES','BELOW 30% HP.'],zh:['低于30%生命的敌人','受到伤害+100%.']},f:()=>{}},
 {id:'clock',n:{en:'OVERCLOCK',zh:'超频'},t:0,d:{en:['SKILL COOLDOWN -30%.','KILLS REFUND 1S.'],zh:['技能冷却-30%.','击杀返还1秒。']},f:()=>{}},
 {id:'shot',n:{en:'LONGSHOT',zh:'远射'},t:0,d:{en:['BOW DRAWS 35% FASTER.','+3 BOW DMG.'],zh:['弓蓄力加快35%.','弓伤害+3。']},f:()=>{}},
 {id:'adren',n:{en:'ADRENALINE',zh:'肾上腺素'},t:1,d:{en:['AFTER A ROLL:','NEXT HIT DEALS X2.2.'],zh:['翻滚后：','下一击伤害×2.2。']},syn:['inst','riposte']},
 {id:'inst',n:{en:'KILLER INSTINCT',zh:'杀戮本能'},t:1,d:{en:['KILLS RESET YOUR ROLL.'],zh:['击杀重置翻滚。']},syn:['adren']},
 {id:'riposte',n:{en:'RIPOSTE',zh:'招架'},t:1,d:{en:['ROLL THROUGH AN ATTACK:','NEXT HIT IS A CRIT.'],zh:['用翻滚躲过攻击：','下一击必定暴击。']},syn:['adren','inst']},
 {id:'vamp',n:{en:'VAMPIRIC FANGS',zh:'吸血獠牙'},t:1,d:{en:['CRITS RESTORE 3 HP.'],zh:['暴击恢复3点生命。']},f:()=>{}},
 {id:'wind',n:{en:'SECOND WIND',zh:'回光返照'},t:1,d:{en:['CHEAT DEATH ONCE.','REVIVE AT 40% HP.'],zh:['可免死一次。','以40%生命复活。']},f:()=>{}}
];
function openReward(src){
  const owned=Object.keys(P.mods);
  let pool=MODS.filter(m=>{
    if(m.id==='wind'&&(P.windUsed||P.mods.wind))return false;
    if(owned.includes(m.id)&&m.id!=='mend'&&m.id!=='stone')return false;
    return true;
  });
  const rareBias=src==='door'?0.42:0.62;
  const picks=[];
  const weightOf=m=>m.t===1?rareBias:1;
  while(picks.length<3&&pool.length){
    let tot=0;for(const m of pool)tot+=weightOf(m);
    let r=FR()*tot,chosen=pool[0];
    for(const m of pool){r-=weightOf(m);if(r<=0){chosen=m;break;}}
    picks.push(chosen);pool=pool.filter(m=>m!==chosen);
  }
  G.reward={cards:picks,sel:0,src,t:0};
  G.state='reward';
  AU.sfx('lvl');
}
function pickReward(i){
  const m=G.reward.cards[i];if(!m)return;
  P.mods[m.id]=(P.mods[m.id]||0)+1;
  if(m.f)m.f();
  AU.sfx('ok');
  G.reward=null;
  if(G.pendLevel){
    const nl=G.pendLevel;G.pendLevel=0;
    if(nl>=3)toBoss();else startLevel(nl);
  }else G.state='play';
}

// ---------- flow ----------
function startRun(weapon,skill){
  G.run={time:0,gold:0,kills:0,dmg:0,seed:(Math.random()*4294967295)>>>0};
  P=makePlayer(weapon,skill);
  ents=[];projs=[];parts=[];floats=[];fx=[];ghosts=[];timeQueue.length=0;pickups=[];
  boss=null;trauma=0;
  startLevel(0);
}
function startLevel(i){
  G.level=i;ents=[];projs=[];parts=[];floats=[];fx=[];ghosts=[];timeQueue.length=0;boss=null;pickups=[];
  healP(15);
  genLevel(i);
  G.intro={t:2.4,name:lvName(i),num:['I','II','III','IV'][i]};
  G.state='play';G.paused=false;
}
function toBoss(){
  G.level=3;ents=[];projs=[];parts=[];floats=[];fx=[];ghosts=[];timeQueue.length=0;pickups=[];
  healP(25);
  genBossArena();
  G.intro={t:2.4,name:lvName(3),num:'IV'};
  G.state='play';G.paused=false;
}
function winGame(){
  G.state='victory';G.victT=0;
  G.wins++;localStorage.setItem('vl_wins',G.wins);
  const t=G.run.time;
  if(!G.best||t<G.best){G.best=t;localStorage.setItem('vl_best',t);G.newBest=true;}
  else G.newBest=false;
  AU.sfx('lvl');AU.setInt(0);
}

// ---------- camera ----------
function updateCam(dt){
  let tx,ty;
  if(lvl.bossRoom){tx=P.x;ty=lvl.gy*16-206;}
  else{tx=P.x+P.face*26+P.vx*0.14;ty=P.y-52-H*0.55;}
  const maxX=lvl.w*16-W,maxY=lvl.h*16-H;
  camX=lerp(camX,clamp(tx-W/2,0,Math.max(0,maxX)),1-Math.pow(0.0018,dt));
  camY=lerp(camY,clamp(ty,0,Math.max(0,maxY)),1-Math.pow(0.003,dt));
  trauma=Math.max(0,trauma-1.5*dt);
}

// ---------- motes ----------
for(let i=0;i<36;i++)motes.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()*0.5+0.2,p:Math.random()*7});

// ---------- update ----------
function update(dt){
  G.t+=dt;
  if(pr('KeyT'))toggleLang();
  if(G.slowT>0){G.slowT-=dt;G.tsT=G.slowS;}else G.tsT=1;
  G.flashW=Math.max(0,G.flashW-dt*1.8);
  updateFx(dt);
  updateTimers(dt);
  for(const m of motes){m.y+=m.s*8*dt;m.x+=Math.sin(G.t+m.p)*4*dt;if(m.y>H){m.y=-2;m.x=Math.random()*W;}}
  const st=G.state;
  if(st==='title'||st==='wsel'||st==='ssel'){
    if(st==='title'){
      if(K_CONFIRM()){G.state='wsel';G.sel.wi=0;AU.sfx('ok');}
    }else if(st==='wsel'){
      if(pr('ArrowLeft','KeyA')){G.sel.wi=(G.sel.wi+2)%3;AU.sfx('ui');}
      if(pr('ArrowRight','KeyD')){G.sel.wi=(G.sel.wi+1)%3;AU.sfx('ui');}
      if(pr('Digit1','KeyJ'))selectWeapon(0);
      if(pr('Digit2','KeyK'))selectWeapon(1);
      if(pr('Digit3','KeyL'))selectWeapon(2);
    }else if(st==='ssel'){
      if(pr('ArrowLeft','KeyA')){G.sel.si=(G.sel.si+2)%3;AU.sfx('ui');}
      if(pr('ArrowRight','KeyD')){G.sel.si=(G.sel.si+1)%3;AU.sfx('ui');}
      if(pr('Digit1','KeyJ'))selectSkill(0);
      if(pr('Digit2','KeyK'))selectSkill(1);
      if(pr('Digit3','KeyL'))selectSkill(2);
    }
    if(pr('KeyM'))AU.toggleMute();
    return;
  }
  if(st==='reward'){
    G.reward.t+=dt;
    if(pr('ArrowLeft','KeyA')){G.reward.sel=(G.reward.sel+2)%3;AU.sfx('ui');}
    if(pr('ArrowRight','KeyD')){G.reward.sel=(G.reward.sel+1)%3;AU.sfx('ui');}
    if(pr('KeyJ','KeyZ','Digit1'))pickReward(0);
    if(pr('KeyK','KeyX','Digit2'))pickReward(1);
    if(pr('KeyL','KeyC','Digit3'))pickReward(2);
    if(pr('KeyM'))AU.toggleMute();
    return;
  }
  if(st==='dead'){
    G.deadT+=dt;
    if(G.deadT>0.8&&(pr('KeyR','Enter')||K_CONFIRM()))startRun(P.weapon,P.skill);
    if(pr('KeyM'))AU.toggleMute();
    return;
  }
  if(st==='victory'){
    G.victT+=dt;
    if(G.victT>1.2&&pr('KeyR','Enter'))startRun(P.weapon,P.skill);
    if(pr('KeyM'))AU.toggleMute();
    return;
  }
  if(st==='play'){
    if(pr('KeyP','Escape')){G.paused=!G.paused;AU.sfx('ui');}
    if(pr('KeyM'))AU.toggleMute();
    if(pr('KeyR')){startRun(P.weapon,P.skill);return;}
    if(G.paused)return;
    G.run.time+=dt;
    updatePlayer(dt);
    updateSlam(dt);
    for(const e of ents)if(!e.dead)updateEnemy(e,dt);
    ents=ents.filter(e=>!e.dead);
    updateBoss(dt);
    updateProjs(dt);
    updatePickups(dt);
    updateCam(dt);
    let target=0;
    if(boss&&boss.active&&!boss.dead)target=2;
    else{for(const e of ents)if(e.aggro&&dist2(e.x,e.y,P.x,P.y)<300*300){target=1;break;}}
    AU.setInt(target);
    if(G.intro){G.intro.t-=dt;if(G.intro.t<=0)G.intro=null;}
  }
}
function selectWeapon(i){G.sel.wi=i;AU.sfx('ok');G.state='ssel';G.sel.si=0;}
function selectSkill(i){
  G.sel.si=i;AU.sfx('ok');
  const wkeys=['fangs','spear','grave'],skeys=['slam','rift','nova'];
  startRun(wkeys[G.sel.wi],skeys[G.sel.si]);
}

// ---------- rendering (world fns use WORLD coords; caller translates) ----------
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function drawBG(){
  ctx.fillStyle=COL.bg0;ctx.fillRect(0,0,W,H);
  const mx=W-90-camX*0.04,my=44-camY*0.03;
  ctx.globalAlpha=0.12;ctx.fillStyle=COL.pale;ctx.beginPath();ctx.arc(mx,my,34,0,7);ctx.fill();
  ctx.globalAlpha=0.85;ctx.beginPath();ctx.arc(mx,my,15,0,7);ctx.fill();
  ctx.globalAlpha=0.35;px(mx-5,my-3,3,3,COL.bg0);px(mx+3,my+4,2,2,COL.bg0);
  ctx.globalAlpha=1;
  ctx.fillStyle=COL.spire;
  for(const s of lvl.spiresF){
    const sx=s.x-camX*0.25;
    if(sx<-70||sx>W+70)continue;
    ctx.beginPath();ctx.moveTo(sx,H);ctx.lineTo(sx+s.w/2,H-s.h*0.8-camY*0.1);ctx.lineTo(sx+s.w,H);ctx.fill();
  }
  ctx.globalAlpha=0.05;ctx.fillStyle=COL.pale;
  ctx.fillRect(0,150+Math.sin(G.t*0.3)*6,W,26);
  ctx.fillRect(0,210+Math.cos(G.t*0.23)*8,W,20);
  ctx.globalAlpha=1;
}
function drawBGPart2(){
  ctx.fillStyle=COL.arch;
  for(const a of lvl.archF){
    const sx=a.x-camX*0.6;
    if(sx<-90||sx>W+90)continue;
    let base=null;
    if(lvl.bossRoom)base=lvl.gy*16-camY;
    else base=findGroundScreenY(Math.floor(a.x/TS));
    if(base===null)continue;
    ctx.fillRect(sx,base-a.h,a.w,a.h);
    ctx.beginPath();ctx.arc(sx+a.w/2,base-a.h,a.w/2.6,Math.PI,0);ctx.fill();
  }
}
function findGroundScreenY(tx){
  for(let ty=20;ty<lvl.h;ty++){if(isSolid(tx,ty)){const sy=ty*TS-camY;if(sy>-40&&sy<H+40)return sy;}}
  return null;
}
function drawTiles(){
  const x0=Math.max(0,Math.floor(camX/TS)-1),x1=Math.min(lvl.w-1,Math.ceil((camX+W)/TS));
  const y0=Math.max(0,Math.floor(camY/TS)-1),y1=Math.min(lvl.h-1,Math.ceil((camY+H)/TS));
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const t=lvl.t[ty*lvl.w+tx];
    if(t===T_SOLID||t===T_FAKE){
      px(tx*TS,ty*TS,TS,TS,COL.tile);
      const h=hash2(tx,ty);
      if(h<0.3)px(tx*TS+((h*40)|0)%12,ty*TS+4+((h*90)|0)%9,2,1,COL.tileD);
      if(t===T_FAKE&&hash2(tx*3,ty*7)<0.06+0.05*Math.sin(G.t*3+tx))px(tx*TS+7,ty*TS+7,1,1,COL.pale);
      if(!isSolid(tx,ty-1)&&tileAt(tx,ty-1)!==T_FAKE){
        px(tx*TS,ty*TS,TS,2,COL.edge);
        if(h>0.72)px(tx*TS+((h*60)|0)%13,ty*TS+2,2,1,COL.edge);
      }
      if(!isSolid(tx-1,ty))px(tx*TS,ty*TS,1,TS,COL.side);
      if(!isSolid(tx+1,ty))px(tx*TS+TS-1,ty*TS,1,TS,COL.side);
      if(!isSolid(tx,ty+1)&&ty<lvl.h-1)px(tx*TS,ty*TS+TS-1,TS,1,'#0a0b0f');
    }else if(t===T_SPIKE){
      px(tx*TS,ty*TS+TS-4,TS,4,COL.tileD);
      ctx.fillStyle=COL.gray;
      for(let i=0;i<2;i++){
        const bx=tx*TS+2+i*8;
        ctx.beginPath();ctx.moveTo(bx,ty*TS+TS-3);ctx.lineTo(bx+4,ty*TS+1);ctx.lineTo(bx+8,ty*TS+TS-3);ctx.fill();
      }
      px(tx*TS+5,ty*TS+2,2,1,COL.red);px(tx*TS+13,ty*TS+2,2,1,COL.red);
    }
  }
  if(lvl.bossRoom&&lvl.pillarUp){
    for(const p of lvl.pillars)if(isSolid(p.tx,p.ty))px(p.tx*TS+7,p.ty*TS+6,2,40,'rgba(255,70,85,'+(0.25+0.15*Math.sin(G.t*5))+')');
  }
  for(const c of lvl.chains){
    if(c.x<camX-10||c.x>camX+W+10)continue;
    ctx.strokeStyle='#2c2d36';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(c.x,c.y+c.len);ctx.stroke();
    px(c.x-1,c.y+c.len,3,3,'#2c2d36');
  }
  for(const r of lvl.rubble){if(r.x<camX-8||r.x>camX+W+8)continue;px(r.x-r.r,r.y-r.r,r.r*2,r.r,'#191a20');}
  for(const t of lvl.torches){
    if(t.x<camX-10||t.x>camX+W+10)continue;
    px(t.x-1,t.y,2,7,'#3a3b44');
    const fl=Math.sin(G.t*9+t.x)>0?2:1;
    px(t.x-1,t.y-fl-1,3,3,COL.gold);px(t.x,t.y-fl-2,1,1,COL.white);
    if(FR()<0.06)parts.push({x:t.x+rr(-1,1),y:t.y-3,vx:rr(-4,4),vy:-rr(8,18),t:0,life:rr(0.4,0.8),col:FR()<0.5?COL.gold:COL.dim,g:-20,sz:1});
  }
  for(const z of lvl.zones){
    if(z.state!=='done'){
      const rx0=z.x0*16;
      if(rx0>camX-40&&rx0<camX+W+40){
        const a=0.4+0.3*Math.sin(G.t*3);
        ctx.fillStyle='rgba(255,70,85,'+a+')';
        ctx.fillRect(z.x0*16+4,z.gy*16-3,8,2);ctx.fillRect(z.x1*16+4,z.gy*16-3,8,2);
      }
    }
    if(z.state==='active'){
      for(const gc of [z.colL,z.colR]){
        const gx=gc*16;
        if(gx>camX-20&&gx<camX+W+20){
          ctx.fillStyle='rgba(255,70,85,'+(0.35+0.2*Math.sin(G.t*8))+')';
          ctx.fillRect(gx+2,(z.gy-5)*16,12,5*16);
        }
      }
    }
  }
}
function drawDoors(){
  for(const d of lvl.doors){
    if(d.x<camX-30||d.x>camX+W+30)continue;
    px(d.x-9,d.y-30,18,30,'#101116');
    px(d.x-7,d.y-28,14,28,'#08090c');
    const gl=0.5+0.3*Math.sin(G.t*2.4);
    px(d.x-5,d.y-24,10,22,'rgba(255,201,94,'+gl*0.5+')');
    px(d.x-2,d.y-18,4,4,COL.gold);
    px(d.x-10,d.y-32,20,3,COL.edge);
  }
  if(lvl.bossRoom&&lvl.doorSealed){
    px(3*16,lvl.gy*16-96,16,96,'rgba(255,70,85,0.12)');
  }
}
function drawChests(){
  for(const c of lvl.chests){
    if(c.x<camX-20||c.x>camX+W+20)continue;
    px(c.x-7,c.y-9,14,9,c.opened?'#2a2b33':COL.foeD);
    px(c.x-7,c.y-11,14,3,c.opened?'#191a20':COL.foe);
    if(!c.opened){
      const gl=0.6+0.3*Math.sin(G.t*3);
      px(c.x-1,c.y-7,2,2,'rgba(255,201,94,'+gl+')');
      if(c.tier==='rare'&&FR()<0.05)parts.push({x:c.x+rr(-6,6),y:c.y-rr(2,10),vx:0,vy:-14,t:0,life:0.5,col:COL.gold,g:0,sz:1});
    }else px(c.x-5,c.y-7,10,5,'#0a0b0f');
  }
}
function drawPickups(){
  for(const p of pickups){
    if(p.x<camX-8||p.x>camX+W+8)continue;
    const sy=p.y+Math.sin(G.t*4+p.x)*1.5;
    if(p.kind==='gold'){px(p.x-1,sy-2,3,3,COL.gold);px(p.x,sy-1,1,1,COL.white);}
    else{px(p.x-2,sy-1,5,3,COL.white);px(p.x-1,sy-2,3,5,COL.white);px(p.x-1,sy-1,1,1,'#3a3b44');}
  }
}
function drawScarf(){
  const p=P;
  ctx.lineCap='round';
  for(let i=0;i<p.scarf.length-1;i++){
    const a=1-i/p.scarf.length;
    ctx.strokeStyle='rgba(241,242,246,'+(a*0.8)+')';
    ctx.lineWidth=Math.max(1,2-i*0.25);
    ctx.beginPath();
    ctx.moveTo(p.scarf[i].x,p.scarf[i].y);
    ctx.lineTo(p.scarf[i+1].x,p.scarf[i+1].y+Math.sin(G.t*6+i)*0.8);
    ctx.stroke();
  }
}
function drawPlayer(){
  const p=P;
  if(!p||p.deadGone)return;
  if(p.inv>0&&p.rollT<=0&&Math.floor(G.t*24)%2===0)return;
  const x=p.x,y=p.y;
  const c=p.flash>0?'#ffffff':COL.white;
  drawScarf();
  if(p.rollT>0){
    ctx.save();ctx.translate(x,y-6);ctx.rotate((0.19-p.rollT)*34*p.face);
    px(-4,-5,8,7,c);px(-5,-3,10,4,c);px(-2,-6,5,2,c);
    ctx.restore();
  }else{
    const bob=p.onG&&Math.abs(p.vx)>10?Math.sin(p.legP)*0.9:Math.sin(G.t*2.2)*0.5;
    const run=p.onG&&Math.abs(p.vx)>10;
    const air=!p.onG;
    if(air){
      px(x-3,y-5,2,4,c);px(x+1,y-6,2,3,c);
    }else if(run){
      const l=Math.sin(p.legP*6),l2=Math.sin(p.legP*6+Math.PI);
      px(x-3+l*2,y-6,2,6+Math.abs(l),c);
      px(x+1+l2*2,y-6,2,6+Math.abs(l2),c);
    }else{
      px(x-3,y-6,2,6,c);px(x+1,y-6,2,6,c);
    }
    px(x-2,y-12+bob,5,7,c);
    const hx=x-2+p.face;
    px(hx,y-17+bob,5,5,c);
    px(hx+(p.face>0?3:0),y-15+bob,2,1,COL.dark);
    const w=WEAPONS[p.weapon];
    if(p.atk){
      const st=p.atk,cc=w.combo[st.i];
      let prog=0;
      if(st.stage==='wind')prog=-0.25*(st.t/cc.w);
      else if(st.stage==='act')prog=st.t/cc.a;
      else prog=1+0.3*(st.t/cc.r);
      if(p.weapon==='fangs'){
        const up=st.i%2===0?-1:1;
        const ang=lerp(-2.2*up,0.7*up,clamp(prog,-1,1.3));
        const wx=x+2*p.face,wy=y-10+bob;
        ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();
        ctx.moveTo(wx,wy);ctx.lineTo(wx+Math.cos(ang)*9*p.face,wy+Math.sin(ang)*9);ctx.stroke();
      }else if(p.weapon==='spear'){
        const ext=clamp(prog,-0.2,1.2);
        const len=8+Math.max(0,ext)*24;
        const wx=x+2*p.face,wy=y-9+bob;
        ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();
        ctx.moveTo(wx-p.face*4,wy);ctx.lineTo(wx+p.face*len,wy);ctx.stroke();
        if(prog>0.9)px(wx+p.face*(len+1),wy-1,2,2,COL.gold);
      }else{
        const ang=lerp(-2.6,0.9,clamp(prog,-0.3,1.3));
        const wx=x+2*p.face,wy=y-11+bob;
        ctx.save();ctx.translate(wx,wy);ctx.rotate(ang*p.face);
        px(0,-1,14,3,c);px(8,-2,4,5,c);px(-1,-2,3,5,c);
        ctx.restore();
        if(st.stage==='act'){
          ctx.strokeStyle='rgba(241,242,246,'+(0.5*(1-st.t/cc.a))+')';
          ctx.lineWidth=3;ctx.beginPath();
          ctx.arc(x,y-8,cc.reach,ang-0.8*p.face,ang+0.15*p.face,p.face<0);ctx.stroke();
        }
      }
    }else if(p.bowDraw>=0){
      const full=p.bowDraw>=bowFullT();
      const bx=x+3*p.face,by=y-10+bob;
      const a0=p.face>0?-1.2:Math.PI-1.2, a1=p.face>0?1.2:Math.PI+1.2;
      ctx.strokeStyle=full?COL.gold:c;ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(bx,by,5,a0,a1);ctx.stroke();
      const pull=Math.min(1,p.bowDraw/bowFullT())*3;
      ctx.beginPath();ctx.moveTo(bx+Math.cos(a0)*5,by+Math.sin(a0)*5);
      ctx.lineTo(bx-p.face*pull,by);
      ctx.lineTo(bx+Math.cos(a1)*5,by+Math.sin(a1)*5);ctx.stroke();
      if(full)px(bx-p.face*2,by-1,2,2,COL.gold);
    }else{
      px(x+(p.face>0?2:-3),y-10+bob,2,4,c);
    }
    if(p.adren)px(x+3*p.face,y-19+bob,2,2,COL.gold);
    if(p.riposte){px(x-1+p.face*4,y-20+bob,2,2,COL.white);if(Math.floor(G.t*8)%2)px(x-2+p.face*5,y-19+bob,1,1,COL.gold);}
  }
  if(p.slamT)px(p.x-10,p.y-2,20,2,'rgba(241,242,246,0.3)');
}
function drawEnemy(e){
  if(e.x<camX-30||e.x>camX+W+30)return;
  const x=e.x,y=e.y;
  if(e.spawnT>0){
    ctx.globalAlpha=0.4+0.3*Math.sin(G.t*20);
    px(x-4,y-10,8,10,COL.foe);ctx.globalAlpha=1;return;
  }
  const c=e.flash>0?'#ffffff':(e.stun>0?COL.dim:COL.foe);
  const cd=e.flash>0?'#ffffff':COL.foeD;
  if(e.elite){ctx.strokeStyle='rgba(255,201,94,'+(0.5+0.3*Math.sin(G.t*5))+')';ctx.lineWidth=1;
    ctx.strokeRect(x-e.w/2-1.5,y-e.h-1.5,e.w+3,e.h+3);}
  const eye=e.st==='tel'||e.st==='lunge'||e.st==='bash'?COL.red:COL.white;
  if(e.type==='husk'){
    const lean=e.st==='tel'?-e.dir*2:(e.st==='lunge'?e.dir*3:0);
    const bob=Math.sin(e.t*6)*0.8;
    px(x-4+lean,y-12+bob,8,9,c);
    px(x-3+lean+e.dir,y-15+bob,6,5,c);
    px(x-1+lean+e.dir*2,y-13+bob,2,2,eye);
    px(x-4+lean,y-4+bob,2,4,cd);px(x+2+lean,y-4+bob,2,4,cd);
    px(x+(e.dir>0?4:-5),y-10+bob,1,5,cd);
    if(e.st==='tel'&&Math.floor(G.t*20)%2)px(x-1,y-1,2,2,COL.red);
  }else if(e.type==='stalker'){
    const a=e.st==='cloak'?0.14:(e.st==='tel'?0.6:1);
    ctx.globalAlpha=a;
    px(x-3,y-13,6,10,c);
    px(x-2,y-16,5,4,c);
    px(x-1,y-14,1,1,eye);px(x+1,y-14,1,1,eye);
    for(let i=0;i<3;i++)px(x-3+i*2,y-4+(((e.t*10+i)|0)%2),2,4,cd);
    ctx.globalAlpha=1;
  }else if(e.type==='sentinel'){
    const bob=Math.sin(e.t*3)*0.7;
    ctx.fillStyle=c;ctx.beginPath();
    ctx.moveTo(x,y-16+bob);ctx.lineTo(x-5,y+bob);ctx.lineTo(x+5,y+bob);ctx.fill();
    px(x-1,y-13+bob,2,2,eye);
    ctx.strokeStyle=e.st==='tel'?COL.red:cd;ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(x+e.dir*4,y-9+bob,5,e.dir>0?-1.1:Math.PI-1.1,e.dir>0?1.1:Math.PI+1.1);ctx.stroke();
    if(e.st==='tel')px(x+e.dir*6,y-10+bob,2,2,COL.red);
  }else if(e.type==='warden'){
    const bob=Math.sin(e.t*4)*0.5;
    px(x-6,y-14+bob,12,11,c);
    px(x-2+e.dir*2,y-17+bob,5,4,c);
    px(x-1+e.dir*3,y-15+bob,2,2,eye);
    px(x-5,y-3+bob,3,3,cd);px(x+2,y-3+bob,3,3,cd);
    if(e.vuln<=0){
      const sx2=x+e.dir*(e.st==='bash'?9:6);
      px(sx2,y-16+bob,3,15,e.st==='tel'?COL.red:'#8b8d99');
      px(sx2,y-16+bob,1,15,'#b9bbc6');
    }else{px(x+e.dir*7,y-8,3,5,'#5a5c68');}
  }
  if(e.hp<e.maxhp){
    const w2=Math.max(10,e.w+2);
    px(x-w2/2,y-e.h-6,w2,2,'#0a0b0f');
    px(x-w2/2,y-e.h-6,w2*clamp(e.hp/e.maxhp,0,1),1,e.elite?COL.gold:COL.gray);
  }
  if(e.stun>0&&Math.floor(G.t*6)%2)px(x-1,y-e.h-10,3,3,COL.pale);
}
function drawBoss(){
  const b=boss;if(!b)return;
  const x=b.x,y=b.y;
  if(b.st==='inkMark'){
    const a=0.3+0.25*Math.sin(G.t*14);
    ctx.fillStyle='rgba(255,70,85,'+a+')';
    ctx.beginPath();ctx.arc(b.mx,lvl.gy*16,44,Math.PI,0);ctx.fill();
  }
  if(b.st==='rushT'){
    const a=0.25+0.2*Math.sin(G.t*16);
    ctx.fillStyle='rgba(255,70,85,'+a+')';
    ctx.fillRect(camX,y-22,W,14);
  }
  if(b.st==='slamT'){
    const a=0.2+0.2*Math.sin(G.t*18);
    ctx.fillStyle='rgba(255,70,85,'+a+')';
    ctx.fillRect(x+b.face*6-22,y-26,44,26);
  }
  if(b.invis)return;
  const c=b.flash>0?'#ffffff':(b.stagger>0?COL.pale:COL.foe);
  const cd=b.flash>0?'#ffffff':COL.foeD;
  ctx.fillStyle=cd;
  const sway=Math.sin(b.t*3)*2-b.vx*0.03;
  ctx.beginPath();ctx.moveTo(x-8,y-30);ctx.lineTo(x-14-sway,y-8);ctx.lineTo(x-6-sway*0.5,y);ctx.lineTo(x+8,y);ctx.lineTo(x+8,y-30);ctx.fill();
  px(x-8,y-32,16,20,c);
  px(x-10,y-30,4,8,c);px(x+6,y-30,4,8,c);
  px(x-4,y-40,9,8,c);
  const ec=b.phase>=2?COL.red:COL.white;
  px(x-2,y-37,2,2,ec);px(x+3,y-37,2,2,ec);
  px(x-5,y-43,3,3,'#b9bbc8');px(x-1,y-44,3,4,'#b9bbc8');px(x+3,y-43,3,3,'#b9bbc8');
  let ang=-2.2;
  if(b.st==='slamT')ang=-2.7+Math.sin(b.stT*30)*0.06;
  else if(b.st==='slamRec')ang=0.8;
  else if(b.st==='rush'||b.st==='rushT')ang=0;
  else if(b.stagger>0)ang=1.4;
  else if(b.st==='novaT'||b.st==='nova')ang=-1.6;
  ctx.save();ctx.translate(x+b.face*6,y-24);ctx.rotate(ang*b.face);
  px(0,-2,30,4,c);px(24,-3,6,6,c);px(-4,-3,5,6,cd);
  ctx.restore();
  if(b.stagger>0){ctx.strokeStyle='rgba(241,242,246,'+(0.5+0.3*Math.sin(G.t*10))+')';ctx.lineWidth=1;
    ctx.strokeRect(x-14,y-44,28,44);}
  if(b.phase>=3&&FR()<0.1)parts.push({x:b.x+rr(-10,10),y:b.y-rr(10,36),vx:rr(-6,6),vy:-rr(6,16),t:0,life:0.5,col:COL.red,g:0,sz:1});
}
function drawProjs(){
  for(const p of projs){
    if(p.x<camX-20||p.x>camX+W+20)continue;
    const x=p.x,y=p.y;
    if(p.k==='arrow'){
      ctx.strokeStyle=COL.white;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x-p.vx*0.012,y-p.vy*0.012);ctx.lineTo(x,y);ctx.stroke();
      px(x,y-1,2,2,COL.white);
    }else if(p.k==='bolt'){
      px(x-2,y-1,4,2,COL.red);px(x-1,y-2,2,4,'rgba(255,70,85,0.5)');
    }else if(p.k==='shock'){
      const h=8+Math.sin(G.t*30+p.x)*2;
      ctx.fillStyle=COL.gray;
      ctx.beginPath();ctx.moveTo(x-6,y);ctx.lineTo(x,y-h-4);ctx.lineTo(x+6,y);ctx.fill();
      px(x-1,y-h-4,2,2,COL.red);
    }else if(p.k==='orb'){
      px(x-2,y-2,4,4,COL.red);px(x-1,y-1,2,2,COL.white);
    }else if(p.k==='debris'){
      px(x-2,y-2,4,4,COL.foe);px(x-1,y-3,2,1,COL.gray);
    }
  }
}
function drawFxAll(){
  for(const g of ghosts){
    const a=1-g.t/g.life;
    ctx.globalAlpha=a*0.35;
    if(g.pose==='roll')px(g.x-4,g.y-10,8,10,COL.white);
    else if(g.pose==='dash'||g.pose==='stalk')px(g.x-4,g.y-14,8,14,COL.white);
    else if(g.pose==='boss'){px(g.x-8,g.y-40,16,40,COL.white);px(g.x-4,g.y-44,9,8,COL.white);}
    ctx.globalAlpha=1;
  }
  for(const e of fx){
    const q=e.t/e.life;
    if(e.k==='slash'){
      ctx.strokeStyle=e.col;ctx.globalAlpha=1-q;ctx.lineWidth=2;
      ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.dir,1);
      ctx.beginPath();ctx.arc(0,0,lerp(e.r0,e.r1,q),-1.9+q*0.4,0.9);ctx.stroke();
      ctx.restore();ctx.globalAlpha=1;
    }else if(e.k==='ring'){
      ctx.strokeStyle=e.col;ctx.globalAlpha=1-q;ctx.lineWidth=e.w;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r*(0.3+q*0.7),0,7);ctx.stroke();ctx.globalAlpha=1;
    }else if(e.k==='line'){
      const a=(1-q)*0.7;
      ctx.strokeStyle='rgba(255,70,85,'+a+')';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(e.x1,e.y1);ctx.lineTo(e.x2,e.y2);ctx.stroke();
      ctx.lineWidth=3;ctx.globalAlpha=a*0.3;ctx.stroke();ctx.globalAlpha=1;
    }else if(e.k==='arc'){
      ctx.strokeStyle='rgba(255,70,85,'+(1-q)*0.8+')';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r,e.dir>0?-0.9:Math.PI-0.9,e.dir>0?0.9:Math.PI+0.9);ctx.stroke();
    }else if(e.k==='aimline'){
      ctx.strokeStyle='rgba(255,70,85,0.5)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(e.x1,e.y1);ctx.lineTo(e.x2,e.y2);ctx.stroke();
    }else if(e.k==='mark'){
      ctx.strokeStyle='rgba(255,70,85,0.6)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.stroke();
    }
  }
  for(const p of parts){
    ctx.globalAlpha=1-p.t/p.life;
    px(p.x,p.y,p.sz,p.sz,p.col);
  }
  ctx.globalAlpha=1;
  for(const f of floats){
    ctx.globalAlpha=1-Math.max(0,(f.t/f.life-0.5)*2);
    drawText(f.txt,f.x,f.y,f.sc,f.col,'center');
    ctx.globalAlpha=1;
  }
}
function drawLighting(){
  dctx.globalCompositeOperation='source-over';
  dctx.clearRect(0,0,W,H);
  dctx.fillStyle=lvl.bossRoom?'rgba(5,6,10,0.5)':'rgba(5,6,10,0.58)';
  dctx.fillRect(0,0,W,H);
  dctx.globalCompositeOperation='destination-out';
  const hole=(wx,wy,r,a)=>{
    dctx.globalAlpha=a;
    dctx.drawImage(lightSpr,Math.round(wx-camX-r),Math.round(wy-camY-r),r*2,r*2);
  };
  if(P&&!P.deadGone)hole(P.x,P.y-8,120+Math.sin(G.t*7)*4,0.95);
  for(const t of lvl.torches)hole(t.x,t.y-2,48,0.8);
  for(const d of lvl.doors)hole(d.x,d.y-14,58,0.9);
  for(const c of lvl.chests)if(!c.opened)hole(c.x,c.y-6,36,0.7);
  for(const z of lvl.zones)if(z.state!=='done'){hole(z.x0*16+8,z.gy*16-8,30,0.5);hole(z.x1*16+8,z.gy*16-8,30,0.5);}
  if(boss&&!boss.dead&&!boss.invis)hole(boss.x,boss.y-20,90,0.85);
  dctx.globalAlpha=1;
  dctx.globalCompositeOperation='source-over';
  ctx.drawImage(darkCvs,0,0);
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=0.08;
  for(const d of lvl.doors)ctx.drawImage(lightSpr,Math.round(d.x-camX-50),Math.round(d.y-14-camY-50),100,100);
  ctx.globalAlpha=0.06;
  for(const t of lvl.torches)ctx.drawImage(lightSpr,Math.round(t.x-camX-36),Math.round(t.y-2-camY-36),72,72);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawMotes(){
  ctx.fillStyle='rgba(241,242,246,0.22)';
  for(const m of motes)ctx.fillRect(Math.round(m.x),Math.round(m.y),1,1);
}

// ---------- HUD & screens ----------
function drawHUD(){
  px(8,8,64,6,'#0a0b0f');
  const hw=62*clamp(P.hp/P.maxhp,0,1);
  px(9,9,hw,4,P.hp<P.maxhp*0.3?COL.red:COL.white);
  drawText(Math.max(0,Math.ceil(P.hp))+'',76,8,1,P.hp<P.maxhp*0.3?COL.red:COL.white);
  const sk=SKILLS[P.skill];
  px(8,18,14,14,'#0a0b0f');
  if(P.skillCd<=0){px(9,19,12,12,COL.white);}
  else{
    const q=P.skillCd/(sk.cd*(hasMod('clock')?0.7:1));
    px(9,19,12,12,'#26272f');
    px(9,19+12*(1-q),12,12*q,COL.gray);
  }
  drawText('L',15,23,1,P.skillCd<=0?COL.dark:COL.dim,'center');
  drawText(tx(sk.name),26,20,1,P.skillCd<=0?COL.pale:COL.dim);
  if(P.skillCd>0)drawText(P.skillCd.toFixed(1),26,27,1,COL.dim);
  const rq=1-clamp(P.rollCd/(0.65*(hasMod('swift')?0.75:1)),0,1);
  px(8,34,20,2,'#0a0b0f');px(8,34,20*rq,2,rq>=1?COL.pale:COL.dim);
  px(8,40,3,3,COL.gold);drawText(''+G.run.gold,15,39,1,COL.gold);
  const w=WEAPONS[P.weapon];
  drawText(tx(w.name),8,H-10,1,COL.pale);
  let mx=8+textW(tx(w.name),1)+8,count=0;
  for(const id in P.mods){
    if(count>=9){drawText('+',mx,H-10,1,COL.dim);break;}
    const m=MODS.find(mm=>mm.id===id);
    px(mx-2,H-13,9,9,m.t===1?'#3a3013':'#1c1d24');
    drawText(tx(m.n)[0],mx+2.5,H-11,1,m.t===1?COL.gold:COL.gray,'center');
    mx+=11;count++;
  }
  drawText(lvName(G.level),W-8,8,1,COL.dim,'right');
  drawText(fmtT(G.run.time),W-8,15,1,COL.gray,'right');
  if(boss&&boss.active&&!boss.dead){
    const bw=200;
    px(W/2-bw/2-1,H-22,bw+2,7,'#0a0b0f');
    px(W/2-bw/2,H-21,bw*clamp(boss.hp/boss.maxhp,0,1),5,boss.phase>=3?COL.red:COL.pale);
    drawText(T('boss'),W/2,H-30,1,COL.pale,'center');
    for(let i=0;i<3;i++)px(W/2-bw/2+i*8,H-13,4,4,i<(boss.phase-1)?COL.red:'#26272f');
  }
  if(G.god)drawText(T('god'),W-8,H-10,1,COL.gold,'right');
  if(AU.muted)drawText(T('muted'),W-8,H-18,1,COL.dim,'right');
}
function drawHints(){
  for(const h of lvl.hints){
    const sx=h.x-camX;
    if(sx<-100||sx>W+100)continue;
    const a=clamp(1-Math.abs(P.x-h.x)/260,0,1);
    ctx.globalAlpha=a*0.85;
    drawText(T(h.k),h.x-camX,h.y-camY+Math.sin(G.t*2)*1.5,1,COL.pale,'center');
    ctx.globalAlpha=1;
  }
}
function drawIntroCard(){
  if(!G.intro)return;
  const q=1-G.intro.t/2.4;
  const a=q<0.2?q/0.2:(q>0.8?(1-q)/0.2:1);
  ctx.globalAlpha=a*0.9;
  drawText(G.intro.num,W/2-70,H/2-30,4,COL.dim);
  drawText(G.intro.name,W/2,H/2-20,2,COL.white,'center');
  ctx.globalAlpha=a*0.5;
  px(W/2-80,H/2-6,160,1,COL.dim);
  ctx.globalAlpha=1;
}
function fmtT(s){s|=0;return ((s/60)|0)+':'+('0'+(s%60)).slice(-2);}
function drawTitle(){
  ctx.fillStyle=COL.bg0;ctx.fillRect(0,0,W,H);
  const mx=W/2;
  ctx.globalAlpha=0.1;ctx.fillStyle=COL.pale;ctx.beginPath();ctx.arc(mx,110,60,0,7);ctx.fill();
  ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(mx,110,26,0,7);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=COL.spire;
  for(let i=0;i<9;i++){const bx=i*62-((G.t*6)%62);ctx.beginPath();ctx.moveTo(bx,H);ctx.lineTo(bx+30,90+((i*37)%60));ctx.lineTo(bx+60,H);ctx.fill();}
  ctx.fillStyle=COL.bg1;ctx.fillRect(0,H-40,W,40);
  const flick=Math.sin(G.t*1.7)>0.97?0.7:1;
  const ty=52+Math.sin(G.t*1.4)*2;
  drawText('VOIDLINE',W/2+2,ty+2,5,'#1a1b22','center');
  drawText('VOIDLINE',W/2,ty,5,'rgba(241,242,246,'+flick+')','center');
  drawText(T('sub_title'),W/2,ty+34,1,COL.dim,'center');
  px(W/2-90,ty+44,180,1,'#26272f');
  if(Math.floor(G.t*1.6)%2===0)drawText(T('press'),W/2,168,1.5,COL.white,'center');
  drawText(T('ctrl1'),W/2,196,1,COL.dim,'center');
  drawText(T('ctrl2'),W/2,206,1,COL.dim,'center');
  if(G.best)drawText(T('best')+' '+fmtT(G.best)+(G.wins?' · '+G.wins+' '+T('wins'):''),W/2,224,1,COL.gold,'center');
  drawText(T('tagline'),W/2,H-12,1,COL.dim,'center');
}
function drawCard(x,y,w,h,sel,title,lines,tier){
  const lift=sel?-3:0;
  y+=lift;
  px(x,y,w,h,sel?'#16171e':'#101116');
  if(tier===1){
    ctx.strokeStyle='rgba(255,201,94,'+(sel?0.9:0.4)+')';ctx.lineWidth=1;
    ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
    if(sel&&Math.floor(G.t*4)%2){ctx.strokeStyle='rgba(255,201,94,0.25)';ctx.strokeRect(x-1.5,y-1.5,w+3,h+3);}
  }else{
    ctx.strokeStyle=sel?COL.white:'#2c2d36';ctx.lineWidth=1;
    ctx.strokeRect(x+0.5,y+0.5,w-1,h-1);
  }
  drawText(title,x+w/2,y+10,1,tier===1?COL.gold:COL.white,'center');
  px(x+8,y+20,w-16,1,tier===1?'#3a3013':'#26272f');
  lines.forEach((l,i)=>drawText(l,x+w/2,y+28+i*8,1,COL.gray,'center'));
  if(sel)drawText('> J <',x+w/2,y+h-12,1,COL.white,'center');
}
function drawWeaponSelect(){
  ctx.fillStyle=COL.bg0;ctx.fillRect(0,0,W,H);
  drawText(T('wsel_t'),W/2,36,2,COL.white,'center');
  drawText(T('wsel_s'),W/2,54,1,COL.dim,'center');
  const ws=[WEAPONS.fangs,WEAPONS.spear,WEAPONS.grave];
  for(let i=0;i<3;i++){
    const x=40+i*140,y=80,w=120,h=120;
    const sel=G.sel.wi===i;
    drawCard(x,y,w,h,sel,tx(ws[i].name),[tx(ws[i].sub),'',...tx(ws[i].d),'',tx(ws[i].critN)],0);
    const cx=x+w/2,cy=y+h-26;
    ctx.strokeStyle=sel?COL.white:COL.dim;ctx.lineWidth=2;
    if(i===0){ctx.beginPath();ctx.moveTo(cx-6,cy+6);ctx.lineTo(cx+4,cy-6);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy+8);ctx.lineTo(cx+8,cy-2);ctx.stroke();}
    else if(i===1){ctx.beginPath();ctx.moveTo(cx-10,cy+4);ctx.lineTo(cx+10,cy-4);ctx.stroke();px(cx+10,cy-6,3,3,sel?COL.white:COL.dim);}
    else{px(cx-10,cy-5,20,5,sel?COL.white:COL.dim);px(cx-12,cy-7,4,9,sel?COL.white:COL.dim);}
  }
  drawText(T('menu_hint'),W/2,H-24,1,COL.dim,'center');
}
function drawSkillSelect(){
  ctx.fillStyle=COL.bg0;ctx.fillRect(0,0,W,H);
  drawText(T('ssel_t'),W/2,36,2,COL.white,'center');
  drawText(T('ssel_s'),W/2,54,1,COL.dim,'center');
  const ss=[SKILLS.slam,SKILLS.rift,SKILLS.nova];
    for(let i=0;i<3;i++){
    const x=40+i*140,y=80,w=120,h=120;
    const sel=G.sel.si===i;
    drawCard(x,y,w,h,sel,tx(ss[i].name),[...tx(ss[i].d),'','CD '+ss[i].cd+'S'],0);
    const cx=x+w/2,cy=y+h-42;
    ctx.strokeStyle=sel?COL.white:COL.dim;ctx.lineWidth=2;
    if(i===0){ctx.beginPath();ctx.moveTo(cx,cy-8);ctx.lineTo(cx,cy+6);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-7,cy+6);ctx.lineTo(cx+7,cy+6);ctx.stroke();}
    else if(i===1){ctx.beginPath();ctx.moveTo(cx-9,cy);ctx.lineTo(cx+9,cy);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+4,cy-5);ctx.lineTo(cx+9,cy);ctx.lineTo(cx+4,cy+5);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(cx,cy,7,0,7);ctx.stroke();px(cx-1,cy-1,2,2,sel?COL.white:COL.dim);}
  }
  drawText(T('menu_hint'),W/2,H-24,1,COL.dim,'center');
}
function drawRewardScreen(){
  ctx.fillStyle='rgba(5,6,10,0.78)';ctx.fillRect(0,0,W,H);
  const src=G.reward.src;
  drawText(T(src==='chest'?'rw_chest':'rw_door'),W/2,40,2,COL.white,'center');
  drawText(T('rw_pick'),W/2,58,1,COL.gold,'center');
  const owned=Object.keys(P.mods);
  for(let i=0;i<3;i++){
    const m=G.reward.cards[i];if(!m)continue;
    const x=40+i*140,y=86,w=120,h=110;
    let synTxt=null;
    if(m.syn)for(const s of m.syn)if(owned.includes(s)){synTxt=T('syn')+tx(MODS.find(mm=>mm.id===s).n);break;}
    const lines=[...tx(m.d)];
    if(synTxt)lines.push('',synTxt);
    drawCard(x,y,w,h,G.reward.sel===i,tx(m.n),lines,m.t);
  }
  drawText(T('menu_hint'),W/2,H-20,1,COL.dim,'center');
}
function drawDeadScreen(){
  const q=Math.min(1,G.deadT/0.8);
  ctx.fillStyle='rgba(5,6,10,'+(0.72*q)+')';ctx.fillRect(0,0,W,H);
  if(q>=1){
    drawText(T('dead_t'),W/2,84,3,COL.red,'center');
    drawText(T('dead_s'),W/2,112,1,COL.dim,'center');
    px(W/2-70,128,140,1,'#26272f');
    drawText(T('st_time')+' '+fmtT(G.run.time)+'   '+T('st_kills')+' '+G.run.kills+'   '+T('st_gold')+' '+G.run.gold,W/2,140,1,COL.gray,'center');
    drawText(T('st_dmg')+' '+G.run.dmg+'   '+T('st_level')+': '+lvName(G.level),W/2,152,1,COL.gray,'center');
    if(Math.floor(G.t*2)%2===0)drawText(T('dead_again'),W/2,186,2,COL.white,'center');
    drawText(T('dead_sub'),W/2,210,1,COL.dim,'center');
  }
}
function drawVictoryScreen(){
  const q=Math.min(1,G.victT/1.2);
  ctx.fillStyle='rgba(241,242,246,'+(0.9*q)+')';ctx.fillRect(0,0,W,H);
  if(q>=1){
    drawText(T('vic_t'),W/2,74,3,COL.bg0,'center');
    drawText(T('vic_s'),W/2,102,1,'#4a4c59','center');
    px(W/2-70,118,140,1,'#b9bbc8');
    const t=G.run.time;
    drawText(T('st_time')+' '+fmtT(t)+(G.newBest?'  · '+T('vic_best'):'  · '+T('vic_best2')+' '+fmtT(G.best)),W/2,132,1,G.newBest?'#8a6a1e':'#4a4c59','center');
    drawText(T('st_kills')+' '+G.run.kills+'   '+T('st_gold')+' '+G.run.gold+'   '+T('st_dmg')+' '+G.run.dmg,W/2,144,1,'#4a4c59','center');
    drawText(T('vic_build')+': '+tx(WEAPONS[P.weapon].name)+' + '+tx(SKILLS[P.skill].name),W/2,162,1,'#22232b','center');
    const mods=Object.keys(P.mods).map(id=>tx(MODS.find(m=>m.id===id).n)).join(' · ')||T('none');
    drawText(mods,W/2,174,1,'#22232b','center');
    if(Math.floor(G.t*2)%2===0)drawText(T('vic_again'),W/2,204,2,COL.bg0,'center');
  }
}
function drawPause(){
  ctx.fillStyle='rgba(5,6,10,0.8)';ctx.fillRect(0,0,W,H);
  drawText(T('pause_t'),W/2,52,3,COL.white,'center');
  drawText(T('pause_c1'),W/2,92,1,COL.gray,'center');
  drawText(T('pause_c2'),W/2,104,1,COL.gray,'center');
  drawText(T('pause_w')+': '+tx(WEAPONS[P.weapon].name)+'  ·  '+T('pause_crit')+': '+tx(WEAPONS[P.weapon].critN),W/2,126,1,COL.pale,'center');
  drawText(T('pause_d')+': '+tx(SKILLS[P.skill].name),W/2,138,1,COL.pale,'center');
  const mods=Object.keys(P.mods);
  if(mods.length){
    drawText(T('pause_relics'),W/2,158,1,COL.gold,'center');
    mods.forEach((id,i)=>{
      const m=MODS.find(mm=>mm.id===id);
      const row=Math.floor(i/2),colI=i%2;
      drawText(tx(m.n)+(P.mods[id]>1?' x'+P.mods[id]:''),W/2+(colI?8:-8),170+row*11,1,m.t===1?COL.gold:COL.gray,colI?'left':'right');
    });
  }else drawText(T('pause_norelics'),W/2,158,1,COL.dim,'center');
  drawText(T('pause_end')+(AU.muted?T('unmute'):T('mute')),W/2,H-28,1,COL.dim,'center');
}

// ---------- render ----------
function render(){
  const st=G.state;
  if(st==='title'){drawTitle();ctx.drawImage(vinSpr,0,0);return;}
  if(st==='wsel'){drawWeaponSelect();ctx.drawImage(vinSpr,0,0);return;}
  if(st==='ssel'){drawSkillSelect();ctx.drawImage(vinSpr,0,0);return;}
  if(!lvl||!P)return;
  drawBG();
  drawBGPart2();
  let sx=0,sy=0;
  if(trauma>0){const s=trauma*trauma*5;sx=(Math.random()-0.5)*2*s;sy=(Math.random()-0.5)*2*s;}
  ctx.save();
  ctx.translate(Math.round(-camX+sx),Math.round(-camY+sy));
  drawTiles();
  drawDoors();
  drawChests();
  drawPickups();
  for(const e of ents)drawEnemy(e);
  drawBoss();
  drawPlayer();
  drawProjs();
  drawFxAll();
  ctx.restore();
  drawMotes();
  drawLighting();
  if(boss&&boss.phase>=3&&!boss.dead){ctx.globalAlpha=0.5+0.2*Math.sin(G.t*2);ctx.drawImage(redVinSpr,0,0);ctx.globalAlpha=1;}
  ctx.drawImage(vinSpr,0,0);
  drawHints();
  drawHUD();
  drawIntroCard();
  if(st==='reward')drawRewardScreen();
  if(st==='dead')drawDeadScreen();
  if(st==='victory')drawVictoryScreen();
  if(st==='play'&&G.paused)drawPause();
  if(G.flashW>0){ctx.fillStyle='rgba(241,242,246,'+G.flashW+')';ctx.fillRect(0,0,W,H);}
  if(P.hurtFx>0){
    ctx.strokeStyle='rgba(255,70,85,'+(P.hurtFx*0.8)+')';ctx.lineWidth=3;
    ctx.strokeRect(1.5,1.5,W-3,H-3);
  }
}

// ---------- main loop ----------
let last=0,acc=0;
function loop(t){
  requestAnimationFrame(loop);
  const now=t/1000;
  const rdt=Math.min(0.05,now-(last||now-0.016));
  last=now;
  if(G.freeze>0){G.freeze-=rdt;render();return;}
  G.ts+=(G.tsT-G.ts)*Math.min(1,rdt*10);
  acc+=rdt*G.ts;
  let n=0;
  while(acc>=STEP&&n<4){update(STEP);acc-=STEP;n++;K.p={};}
  render();
}

// ---------- boot ----------
const QP=new URLSearchParams(location.search);
function boot(){
  const ql=QP.get('lang'); if(ql==='zh'||ql==='en')LANG=ql;
  if(QP.has('god'))G.god=true;
  if(QP.has('boss')){
    startRun('fangs','nova');
    P.mods.adren=1;P.mods.inst=1;P.mods.bleed=1;
    toBoss();
  }else if(QP.get('lvl')){
    startRun('fangs','slam');
    const n=clamp(+QP.get('lvl')||1,1,3);
    startLevel(n-1);
  }
  requestAnimationFrame(loop);
}
boot();
