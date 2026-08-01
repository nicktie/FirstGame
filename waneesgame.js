
(function(){
const TILE = 16;
const LEVELS = [
// Level 1 — Grass meadow (the original starter)
[
'                                                                                          ',
'                                                                                          ',
'                                                                                          ',
'                                                                                  cc      ',
'             c                                                  c                 cc      ',
'                  ccc                  s                       ===                       f',
'                M                      ?bNb?b                  ===                   ====f',
'                                                       cccc                          ====f',
'                  =====                                                              ====f',
'   p                          g     k    g                g       k g   g                F',
'#######   ###############   ##########   #######   ##########  ##########################F',
'#######   ###############   ##########   #######   ##########  ##########################F',
'#######   ###############   ##########   #######   ##########  ##########################F',
],
// Level 2 — Stairs and air time
[
'                                                                                                ',
'                                                                                                ',
'                                                                                                ',
'                                                            cccc                                ',
'                                                     ====                                       ',
'                              cccc                                       ?bNb?                  ',
'                  cccc                          ====                                            ',
'                          ====                            cc                            ====   f',
'             ?bMb?                    s                              k                     =====f',
'   p                g       g                     g  g            k             g  k  g  g     F',
'#######   #############   ################   ###############   ############  ###################F',
'#######   #############   ################   ###############   ############  ###################F',
'#######   #############   ################   ###############   ############  ###################F',
],
// Level 3 — Pit gauntlet
[
'                                                                                                ',
'                                                                                                ',
'                                                                                                ',
'                                                                       cc                       ',
'                                                              =====   cccc                      ',
'                                            cc                       ======                     ',
'                       cccc                                  cc                                 ',
'                 s                ======                                ?bNb?                   ',
'             ?b?b?              cccc                                                            f',
'   p              g                  k       g              k             g  g  k              F',
'#######   ############   #############   ############   ###########   ############   ##########F',
'#######   ############   #############   ############   ###########   ############   ##########F',
'#######   ############   #############   ############   ###########   ############   ##########F',
],
// Level 4 — Castle finale
[
'                                                                                                  ',
'                                                                                                  ',
'                                                                                                  ',
'                                                  cccc                                            ',
'                              ccc            ====                                                 ',
'                       ====           cccc                          s                             ',
'                M                cc                        cc                              cc    ',
'             ?Nb??b              ===                                  ?bbbM?                      ',
'                        cccc                                                                     f',
'   p     g  k    g  g           k  g  k  g     g  k  g  g  k  g  g  k  g    g  k  g   k  g  g   F',
'#################################################################################################F',
'#################################################################################################F',
'#################################################################################################F',
],
// Level 5 — Forest of Echoes
[
'                                                                                                 ',
'                                                                                                 ',
'                                                                                                 ',
'                                  cccc                                                           ',
'                ====                                                                             ',
'                                                                                cccc             ',
'                            cccc                                 ?bNb?                           ',
'                                            s     ====                                           ',
'              ?bMb?                                                                     ====     ',
'   p           g              g  k             g                 g              k         g     F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
],
// Level 6 — Ice Cave
[
'                                                                                                 ',
'                                                                                                 ',
'                                                                                                 ',
'                                                      cccc                                       ',
'                         ====                                                                    ',
'                                        cccc                     ?bNb?                           ',
'            ====                                                           cccc                  ',
'                                 s                ===                                            ',
'              ?bMb?                                                                   ====       ',
'   p          g     k         g    g           k  g              g    k          g   g    k     F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
],
// Level 7 — Underwater Reef
[
'                                                                                                 ',
'                                                                                                 ',
'                                                                                                 ',
'                            cccc                                      cc                         ',
'                  ====                                 ====                                      ',
'                                                                  cccc                           ',
'                              cccc                                              ?bNb?            ',
'                                            s  ===                                               ',
'             ?bMb?                                                                      ===      ',
'   p           g  g           k   g          g    g              k  g           g   g   k       F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
],
// Level 8 — Cloud Kingdom (final showdown)
[
'                                                                                                 ',
'                                                                                                 ',
'                                                                                                 ',
'                                        cccc                                                     ',
'                ====                                                  ====                       ',
'                            cccc                                                ?bNb?            ',
'                                                            cccc                                 ',
'                                  s               ====                                           ',
'              ?Mb??                                                                     ====     ',
'   p          g  k  g         g  k  g        g  k  g             g  k   g       g   g k   g     F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
'#######   #############   ##############   ##############   ##############   ###################F',
],
];
let LEVEL = LEVELS[0];
let LEVEL_W = Math.max.apply(null, LEVEL.map(r => r.length));
let LEVEL_H = LEVEL.length;
const TOTAL_LEVELS = LEVELS.length;
const WG = {
  W: 320, H: 180, TILE: TILE,
  ctx:null, canvas:null,
  state:'idle',
  level: null,
  player: null,
  enemies: [],
  coins: [],
  items: [],
  popBlocks: [],
  flag: null,
  particles: [],
  camera: { x:0 },
  score:0, coinsCollected:0, lives:3, timeLeft:300,
  best:0, stompCombo:0, stompComboTimer:0,
  inputs: { left:false, right:false, jump:false, jumpHeld:false, jumpJustPressed:false, analogX:0, fireTap:false },
  inputs2:{ left:false, right:false, jump:false, jumpHeld:false, jumpJustPressed:false, analogX:0, fireTap:false },
  coopMode:false, player2:null, reviveStars:[],
  raf:0, lastTime:0, timeAccum:0,
  _bound:false, _btnBound:false,
  GRAV:0.34, JUMP_VEL:-6.4, MAX_FALL:6.5, PLAYER_SPEED:2.0,
  ENEMY_SPEED:0.5
};
window.WANEES_GAME = WG;
function wnSnd(name){
  if (typeof isMuted !== 'undefined' && isMuted) return;
  if (typeof playTone !== 'function') return;
  switch(name){
    case 'jump': playTone(660, 0.05, 'square', 0.18); setTimeout(()=>playTone(880,0.06,'square',0.16),35); break;
    case 'coin':
      playTone(988, 0.05, 'triangle', 0.20);
      setTimeout(()=>playTone(1568, 0.10, 'triangle', 0.20), 55);
      break;
    case 'stomp':
      playTone(220, 0.05, 'square', 0.20);
      setTimeout(()=>playTone(165, 0.08, 'sawtooth', 0.18), 50);
      break;
    case 'hurt':
      playTone(165, 0.12, 'sawtooth', 0.28);
      setTimeout(()=>playTone(110, 0.15, 'sawtooth', 0.22), 100);
      break;
    case 'win':
      [523,659,784,988,1175,1568].forEach((f,i)=>setTimeout(()=>playTone(f,0.16,'triangle',0.26),i*80));
      break;
    case 'death':
      [440,370,294,220,165].forEach((f,i)=>setTimeout(()=>playTone(f,0.24,'sawtooth',0.22),i*150));
      break;
    case 'block': playTone(330, 0.05, 'square', 0.16); break;
  }
}
window.syncWaneesMuteIcon = function(){
  const b = document.getElementById('wnMuteBtn');
  if (b) b.textContent = (typeof isMuted !== 'undefined' && isMuted) ? '🔇' : '🔊';
};
window.playWanees = function(){
  if (typeof hideAllScreens === 'function') hideAllScreens();
  const scr = document.getElementById('waneesScreen');
  if (!scr) return;
  scr.classList.add('active');
  scr.style.display = 'flex';
  document.body.classList.add('wanees-active');
  if (typeof _setNavShow === 'function') _setNavShow(false);
  initWanees();
};
window.exitWanees = function(){
  if (SPEC.mode==='broadcast') stopBroadcast();
  else if (SPEC.mode==='view') stopWatching();
  // Drop fullscreen + wake-lock on leaving the game
  if (_wnLocked){ try { toggleLockScreen(); } catch(e){} }
  waneesStop();
  resetWaneesState();
  document.body.classList.remove('wanees-active');
  const scr = document.getElementById('waneesScreen');
  if (scr) { scr.classList.remove('active'); scr.style.display = 'none'; }
  document.getElementById('waneesStartOverlay').style.display = 'flex';
  document.getElementById('waneesOverOverlay').style.display = 'none';
  if (typeof returnFromGame === 'function') returnFromGame();
  else if (typeof goToLanding === 'function') goToLanding();
};
function initWanees(){
  WG.canvas = document.getElementById('waneesCanvas');
  WG.ctx = WG.canvas.getContext('2d');
  WG.ctx.imageSmoothingEnabled = false;
  try {
    const p = (typeof loadProfile === 'function') ? loadProfile() : null;
    WG.best = (p && p.stats && p.stats.wanees && p.stats.wanees.bestScore) || 0;
  } catch(e) { WG.best = 0; }
  loadWaneesCharacter();
  resetWaneesState();
  syncWaneesMuteIcon();
  if (!WG._bound) { bindWaneesControls(); WG._bound = true; }
  if (!WG._btnBound) { bindWaneesButtons(); WG._btnBound = true; }
  syncCharPicker();
  document.getElementById('waneesStartOverlay').style.display = 'flex';
  document.getElementById('waneesOverOverlay').style.display = 'none';
  loadLevel();
  drawFrame();
  updateHud();
}
function loadLevel(){
  LEVEL = LEVELS[Math.min(WG.currentLevel || 0, LEVELS.length - 1)];
  LEVEL_W = Math.max.apply(null, LEVEL.map(r => r.length));
  LEVEL_H = LEVEL.length;
  WG.level = [];
  WG.enemies = [];
  WG.coins = [];
  WG.items = [];
  WG.popBlocks = [];
  WG.stompCombo = 0; WG.stompComboTimer = 0;
  WG.flag = null;
  // Clear any stuck input state from a finger still on the jump button
  // when the previous stage cleared (caused level 2 jump to seem dead).
  WG.inputs.jumpHeld = false;
  WG.inputs.jumpJustPressed = false;
  const jBtn = document.getElementById('wnJumpBtn');
  if (jBtn) jBtn.classList.remove('pressed');
  let playerStart = { x: 32, y: 100 };
  for (let y = 0; y < LEVEL_H; y++){
    const row = LEVEL[y].padEnd(LEVEL_W, ' ');
    const tileRow = new Array(LEVEL_W).fill(' ');
    for (let x = 0; x < LEVEL_W; x++){
      const c = row[x];
      if (c === '#' || c === 'b' || c === '?' || c === '=' || c === 'M' || c === 'N' || c === 'u') tileRow[x] = c;
      else if (c === 'g') WG.enemies.push({ x: x*TILE, y: y*TILE, vx: -WG.ENEMY_SPEED, vy:0, w: 14, h: 14, alive:true, walkPhase:0, dir:-1, kind:'goomba' });
      else if (c === 'k') WG.enemies.push({ x: x*TILE, y: y*TILE-2, vx: -WG.ENEMY_SPEED*0.85, vy:0, w: 14, h: 16, alive:true, walkPhase:0, dir:-1, kind:'koopa', shell:false, shellVx:0 });
      else if (c === 'c') WG.coins.push({ x: x*TILE+4, y: y*TILE+4, w:8, h:8, collected:false, phase: Math.random()*Math.PI*2 });
      else if (c === 'm') WG.items.push({ x: x*TILE+2, y: y*TILE+2, w:12, h:14, vx:0.9, vy:0, kind:'mushroom', alive:true, onGround:false });
      else if (c === 's') WG.items.push({ x: x*TILE+2, y: y*TILE+2, w:12, h:14, vx:1.4, vy:-2.5, kind:'star', alive:true, onGround:false });
      else if (c === 'n') WG.items.push({ x: x*TILE+2, y: y*TILE+2, w:12, h:14, vx:0, vy:0, kind:'fire', alive:true, onGround:false, bob:0 });
      else if (c === 'p') { playerStart = { x: x*TILE, y: y*TILE - 4 }; }
      else if (c === 'f' || c === 'F') {
        tileRow[x] = c;
        if (!WG.flag) WG.flag = { x: x*TILE, y: y*TILE };
      }
    }
    WG.level.push(tileRow);
  }
  // Pick kinds for both player slots. Profile name "سهى" → 'suha',
  // "أسامة" → 'osama'; otherwise default to wanees (P1) / lulu (P2).
  const p1Kind = WG._p1Kind || getPlayerKind('host');
  const p2Kind = WG._p2Kind || getPlayerKind('guest');
  WG.player = {
    id: 1, kind: p1Kind,
    x: playerStart.x, y: playerStart.y,
    vx:0, vy:0, w:12, h:14,
    onGround:false, dir:1, invincible:0,
    walkPhase:0, alive:true, starTimer:0,
    jumpBuffer:0, coyote:0, jumpCut:false,
    // Fire-Flower power: persists across levels until player dies/resets.
    fireCharges: (WG.player && WG.player.fireCharges) || 0, fireCd:0,
    // Coop-only: per-player hearts and ghost state. Single-player ignores
    // these and keeps using WG.lives instead.
    lives: (WG.player && typeof WG.player.lives === 'number') ? WG.player.lives : 3,
    ghost: false
  };
  if (WG.coopMode){
    // P2 spawns next to P1, 16px to the right, looking left toward them.
    const prev2 = WG.player2;
    WG.player2 = {
      id: 2, kind: p2Kind,
      x: playerStart.x + 18, y: playerStart.y,
      vx:0, vy:0, w:12, h:14,
      onGround:false, dir:-1, invincible:0,
      walkPhase:0, alive:true, starTimer:0,
      jumpBuffer:0, coyote:0, jumpCut:false,
      fireCharges: (prev2 && prev2.fireCharges) || 0, fireCd:0,
      lives: (prev2 && typeof prev2.lives === 'number') ? prev2.lives : 3,
      ghost: false
    };
  } else {
    WG.player2 = null;
  }
  WG.reviveStars = []; // cleared each level; respawned on death
  WG.fireballs = WG.fireballs || [];
  syncFireBtn();
}
// Iterate active players (P1 always, P2 only in coop). Ghosts included so
// their position can still update (they float in place).
function allPlayers(){
  return WG.player2 ? [WG.player, WG.player2] : [WG.player];
}
function alivePlayers(){
  return allPlayers().filter(p => !p.ghost);
}
function isSuhaPlayer(){
  // Suha mode is gated entirely on the profile name — only the player whose
  // profile is named "سهى" can ever enter Suha mode. Stored character pref
  // is honored only within that profile.
  let nameIsSuha = false;
  try {
    const p = (typeof loadProfile === 'function') ? loadProfile() : null;
    const name = (p && p.name ? String(p.name) : '').trim();
    nameIsSuha = (name === 'سهى');
  } catch(e){}
  if (!nameIsSuha) return false;
  if (WG.character === 'wanees') return false; // Suha-named user picked Wanees
  return true; // 'suha' or no explicit pick yet
}
// ===== Spectate: broadcast / watch via Firebase Realtime DB =====
const SPEC = { mode:null, code:null, ref:null, snapAcc:0, snapEveryFrames:6,
  off:null, dcRef:null, broadcaster:null, lastSnapAt:0, watchTimer:0 };
function _wnFb(){ try { return (typeof fb !== 'undefined' && fb && fb.db) ? fb.db : null; } catch(e){ return null; } }
function _wnEnsureFb(){
  try { if (typeof ensureFirebase === 'function') ensureFirebase(); } catch(e){}
  return _wnFb();
}
function _wnCode(){ const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)]; return s; }
function _wnProfileName(){
  try { const p = (typeof loadProfile === 'function') ? loadProfile() : null;
        return (p && p.name) ? String(p.name).trim().slice(0,18) : 'لاعب'; } catch(e){ return 'لاعب'; }
}
function showSpecBanner(kind, text){
  const b=document.getElementById('wnSpecBanner'); if(!b) return;
  b.classList.remove('broadcasting','watching'); b.classList.add(kind);
  document.getElementById('wnSpecText').innerHTML=text;
  b.style.display='flex';
}
function hideSpecBanner(){ const b=document.getElementById('wnSpecBanner'); if(b) b.style.display='none'; }
window.waneesStartBroadcast = function(){
  const db = _wnEnsureFb();
  if (!db){ try { showToast && showToast('البث يتطلب اتصال إنترنت','#ff6a6a'); } catch(e){} return; }
  const code = _wnCode();
  const meta = { name:_wnProfileName(), char: WG.character==='suha'?'suha':'wanees',
    startedAt: firebase.database.ServerValue.TIMESTAMP };
  try {
    // Use the existing rooms/ namespace so Firebase write rules apply
    const ref = db.ref('rooms/wnSpec_'+code);
    ref.child('meta').set(meta).then(()=>{
      try { ref.onDisconnect().remove(); } catch(e){}
      SPEC.mode='broadcast'; SPEC.code=code; SPEC.ref=ref; SPEC.snapAcc=0; SPEC.dcRef=ref;
      showSpecBanner('broadcasting', '🔴 بث مباشر • الكود <b>'+code+'</b> • <span style="opacity:0.7">انسخ الكود لمن يرغب بالمشاهدة</span>');
      try { navigator.clipboard && navigator.clipboard.writeText(code).catch(()=>{}); } catch(e){}
      try { showToast && showToast('📡 البث بدأ! الكود: '+code+' (تم نسخه)', '#3dba7a'); } catch(e){}
      waneesStart();
    }).catch(err=>{
      const msg = (err && err.code === 'PERMISSION_DENIED')
        ? 'البث محجوب من القواعد — يحتاج تحديث صلاحيات قاعدة البيانات'
        : ('تعذّر بدء البث: ' + (err && err.message ? err.message : 'خطأ غير معروف'));
      try { showToast && showToast(msg, '#ff6a6a'); } catch(e){}
    });
  } catch(e){ try { showToast && showToast('تعذّر بدء البث: '+(e&&e.message||''),'#ff6a6a'); } catch(ee){} }
};
function publishSnapshot(frames){
  if (SPEC.mode!=='broadcast' || !SPEC.ref || !WG.player) return;
  SPEC.snapAcc += frames;
  if (SPEC.snapAcc < SPEC.snapEveryFrames) return;
  SPEC.snapAcc = 0;
  const p = WG.player;
  const snap = {
    t: Date.now(),
    lv: WG.currentLevel|0,
    cm: WG.camera.x|0,
    p: {x:Math.round(p.x*10)/10, y:Math.round(p.y*10)/10,
        vx:Math.round(p.vx*100)/100, vy:Math.round(p.vy*100)/100,
        d:p.dir, w:p.walkPhase|0, og:p.onGround?1:0,
        iv:p.invincible|0, st:p.starTimer|0, sh:WG.suhaMode?1:0},
    e: (WG.enemies||[]).filter(e=>e.alive).map(e=>[e.x|0,e.y|0,e.kind==='koopa'?(e.shell?2:1):0,e.dir||-1]),
    c: (WG.coins||[]).filter(c=>!c.collected).map(c=>[c.x|0,c.y|0]),
    i: (WG.items||[]).filter(it=>it.alive).map(it=>[it.x|0,it.y|0,it.kind==='star'?1:0]),
    f: WG.flag ? [WG.flag.x|0,WG.flag.y|0] : null,
    h: {l:WG.lives, c:WG.coinsCollected, s:WG.score|0, tm:WG.timeLeft|0, cb:WG.stompCombo|0},
    s: WG.state
  };
  try { SPEC.ref.child('snap').set(snap); } catch(e){}
}
function stopBroadcast(){
  if (SPEC.mode!=='broadcast') return;
  try { if (SPEC.ref) SPEC.ref.remove(); } catch(e){}
  try { if (SPEC.dcRef) SPEC.dcRef.onDisconnect().cancel(); } catch(e){}
  SPEC.mode=null; SPEC.code=null; SPEC.ref=null; SPEC.dcRef=null; SPEC.snapAcc=0;
  hideSpecBanner();
}
window.openWatchPrompt = function(){
  const inp=document.getElementById('wnWatchCode');
  if (inp){ inp.value=''; inp.focus(); }
  const err=document.getElementById('wnWatchErr'); if(err){ err.style.display='none'; }
  document.getElementById('waneesWatchPrompt').style.display='flex';
};
window.closeWatchPrompt = function(){ document.getElementById('waneesWatchPrompt').style.display='none'; };
window.confirmWatch = function(){
  const inp=document.getElementById('wnWatchCode'); const err=document.getElementById('wnWatchErr');
  const code=(inp.value||'').trim().toUpperCase();
  function fail(m){ if(err){err.textContent=m;err.style.display='block';} }
  if (!/^[A-Z0-9]{4,8}$/.test(code)) return fail('الكود غير صالح');
  const db=_wnEnsureFb();
  if (!db) return fail('المشاهدة تتطلب اتصال إنترنت');
  const ref=db.ref('rooms/wnSpec_'+code);
  ref.child('meta').once('value').then(s=>{
    if (!s.exists()) return fail('الكود غير صالح أو الجلسة انتهت');
    const meta=s.val();
    SPEC.mode='view'; SPEC.code=code; SPEC.ref=ref; SPEC.broadcaster=meta.name||'لاعب'; SPEC.lastSnapAt=Date.now();
    closeWatchPrompt();
    document.getElementById('waneesStartOverlay').style.display='none';
    document.getElementById('waneesOverOverlay').style.display='none';
    // Prepare viewer state: load level so the world is rendered while waiting
    WG.character = meta.char==='suha'?'suha':'wanees';
    WG.suhaMode = false; // viewer perks should not be visual on Wanees default
    WG.currentLevel = 0; WG.lives=3; WG.coinsCollected=0; WG.score=0; WG.timeLeft=300;
    WG.PLAYER_SPEED = 2.0; WG.JUMP_VEL = -6.4;
    WG.particles=[]; WG.camera.x=0;
    loadLevel();
    showSpecBanner('watching', '👁️ تشاهد <b>'+escapeHtml(SPEC.broadcaster)+'</b>');
    updateHud();
    // Subscribe to snapshots
    SPEC.off = ref.child('snap').on('value', snapSnap=>{
      const snap=snapSnap.val(); if (snap) applySnapshot(snap);
    });
    // Heartbeat: if the broadcaster goes away, show a hint
    if (SPEC.watchTimer) clearInterval(SPEC.watchTimer);
    SPEC.watchTimer = setInterval(()=>{
      if (SPEC.mode!=='view') return;
      const stale = Date.now() - SPEC.lastSnapAt;
      const el=document.getElementById('wnSpecText');
      if (el && stale>4000) el.innerHTML='👁️ بانتظار <b>'+escapeHtml(SPEC.broadcaster)+'</b>… (لا توجد بيانات منذ '+Math.floor(stale/1000)+'ث)';
      else if (el) el.innerHTML='👁️ تشاهد <b>'+escapeHtml(SPEC.broadcaster)+'</b>';
    }, 800);
    // Disable game loop on viewer side
    WG.state='spectating';
    cancelAnimationFrame(WG.raf);
    WG.raf = requestAnimationFrame(spectateFrame);
  }).catch(err=>{
    const msg = (err && err.code === 'PERMISSION_DENIED')
      ? 'الوصول محجوب من قواعد قاعدة البيانات'
      : ('تعذّر الاتصال: ' + (err && err.message ? err.message : 'خطأ غير معروف'));
    fail(msg);
  });
};
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function applySnapshot(snap){
  if (!snap || SPEC.mode!=='view') return;
  SPEC.lastSnapAt = Date.now();
  if ((snap.lv|0) !== WG.currentLevel){
    WG.currentLevel = snap.lv|0;
    loadLevel();
  }
  WG.camera.x = snap.cm|0;
  if (!WG.player){ WG.player = { x:0,y:0,vx:0,vy:0,w:12,h:14,onGround:false,dir:1,invincible:0,walkPhase:0,alive:true,starTimer:0 }; }
  const p=WG.player, sp=snap.p||{};
  p.x=sp.x||0; p.y=sp.y||0; p.vx=sp.vx||0; p.vy=sp.vy||0;
  p.dir=sp.d||1; p.walkPhase=sp.w||0;
  p.onGround=!!sp.og; p.invincible=sp.iv|0; p.starTimer=sp.st|0;
  WG.suhaMode = !!sp.sh;
  WG.enemies = (snap.e||[]).map(e=>{
    const koopa=e[2]>0; return { x:e[0], y:e[1], vx:0, vy:0,
      w:koopa?14:14, h:koopa?16:14, alive:true, walkPhase:0,
      dir:e[3]||-1, kind:koopa?'koopa':'goomba', shell:e[2]===2, shellVx:0 };
  });
  const coinKeys = new Set((snap.c||[]).map(c=>c[0]+','+c[1]));
  WG.coins = (snap.c||[]).map(c=>({ x:c[0], y:c[1], w:8, h:8, collected:false, phase:0 }));
  WG.items = (snap.i||[]).map(it=>({ x:it[0], y:it[1], w:12, h:14, vx:0, vy:0,
    kind:it[2]===1?'star':'mushroom', alive:true, onGround:false }));
  if (snap.f){ WG.flag = { x:snap.f[0], y:snap.f[1] }; }
  const h=snap.h||{};
  WG.lives=h.l|0; WG.coinsCollected=h.c|0; WG.score=h.s|0; WG.timeLeft=h.tm|0;
  WG.stompCombo=h.cb|0;
  updateHud();
}
function spectateFrame(){
  if (SPEC.mode !== 'view'){ return; }
  try { drawFrame(); } catch(e){}
  WG.raf = requestAnimationFrame(spectateFrame);
}
function stopWatching(){
  if (SPEC.mode!=='view') return;
  try { if (SPEC.ref && SPEC.off) SPEC.ref.child('snap').off('value', SPEC.off); } catch(e){}
  if (SPEC.watchTimer){ clearInterval(SPEC.watchTimer); SPEC.watchTimer=0; }
  SPEC.mode=null; SPEC.code=null; SPEC.ref=null; SPEC.off=null; SPEC.broadcaster=null;
  cancelAnimationFrame(WG.raf);
  WG.state='idle';
  hideSpecBanner();
  document.getElementById('waneesStartOverlay').style.display='flex';
}
window.stopSpectate = function(){
  if (SPEC.mode==='broadcast') stopBroadcast();
  else if (SPEC.mode==='view') stopWatching();
};
// ===== Online 2-player coop =====
// Host runs authoritative simulation and broadcasts world snapshots to the
// guest at 10 Hz; guest sends only their P2 inputs (left/right/jump/fire)
// at 30 Hz. Both sides use the same Firebase realtime DB namespace as
// spectate to inherit its write rules.
const COOP = {
  mode: null, // 'host' | 'guest'
  code: null,
  ref: null,
  hostName: null, hostKind: null,
  guestName: null, guestKind: null,
  off: null, offInput: null, offGuest: null,
  snapAcc: 0, snapEveryFrames: 4,    // host writes ~15/sec (was 10)
  inputAcc: 0, inputEveryFrames: 1,  // guest writes ~60/sec on change
  lastSnapAt: 0, lastInputAt: 0,
  watchTimer: 0,
  dcRef: null,
  pendingInputs: null,
  prevInputSig: '',
  // Guest-side local prediction: when the guest moves their joystick we
  // slide P2 visually right away and gently reconcile toward the
  // authoritative position from each snapshot. Cuts perceived input lag
  // from a 250 ms round-trip down to a single frame.
  predictGain: 1.8,     // tiles/sec of visual prediction per joystick unit
  reconcilePull: 0.35,  // fraction of position diff applied each snap
};
// Profile-based identity. Profile name "سهى" plays as Suha, "أسامة" plays as
// Osama (a recolor/name swap for Wanees), everyone else gets the default
// kind for their role (host=ونيس, guest=لُولُو).
function getProfileName(){
  try { const p = (typeof loadProfile === 'function') ? loadProfile() : null;
        return (p && p.name) ? String(p.name).trim() : ''; } catch(e){ return ''; }
}
function getPlayerKind(roleHint){
  const name = getProfileName();
  if (name === 'سهى') return 'suha';
  if (name === 'أسامة') return 'osama';
  return roleHint === 'guest' ? 'lulu' : 'wanees';
}
function kindDisplayName(kind){
  return { wanees:'ونيس', suha:'سهى', osama:'أسامة', lulu:'لُولُو' }[kind] || 'لاعب';
}
window.wnCoopCreate = function(){
  const db = _wnEnsureFb();
  if (!db){ try { showToast && showToast('يلزم اتصال إنترنت لإنشاء غرفة','#ff6a6a'); } catch(e){} return; }
  const code = _wnCode();
  const hostKind = getPlayerKind('host');
  const hostName = _wnProfileName();
  COOP.hostKind = hostKind; COOP.hostName = hostName;
  COOP.code = code;
  const ref = db.ref('rooms/wnCoop_'+code);
  COOP.ref = ref;
  const meta = { hostName, hostKind, startedAt: firebase.database.ServerValue.TIMESTAMP };
  ref.child('meta').set(meta).then(() => {
    try { ref.onDisconnect().remove(); COOP.dcRef = ref; } catch(e){}
    document.getElementById('waneesStartOverlay').style.display = 'none';
    document.getElementById('wnCoopCode').textContent = code;
    document.getElementById('wnCoopStatus').textContent = '⏳ بانتظار اللاعب الثاني…';
    document.getElementById('waneesCoopWait').style.display = 'flex';
    try { navigator.clipboard && navigator.clipboard.writeText(code).catch(()=>{}); } catch(e){}
    // Listen for guest to join
    COOP.offGuest = ref.child('guest').on('value', g => {
      const v = g.val();
      if (!v) return;
      COOP.guestName = v.name || 'لاعب';
      COOP.guestKind = v.kind || 'lulu';
      ref.child('guest').off('value', COOP.offGuest); COOP.offGuest = null;
      _wnCoopHostStart();
    });
  }).catch(err => {
    const msg = (err && err.code === 'PERMISSION_DENIED')
      ? 'الإنشاء محجوب من قواعد قاعدة البيانات'
      : ('تعذّر الإنشاء: ' + (err && err.message ? err.message : 'خطأ غير معروف'));
    try { showToast && showToast(msg, '#ff6a6a'); } catch(e){}
  });
};
window.wnCoopCopy = function(){
  if (!COOP.code) return;
  try { navigator.clipboard && navigator.clipboard.writeText(COOP.code).then(() => {
    try { showToast && showToast('📋 تم نسخ الكود','#3dba7a'); } catch(e){}
  }); } catch(e){}
};
window.wnCoopCancel = function(){
  if (COOP.offGuest && COOP.ref) try { COOP.ref.child('guest').off('value', COOP.offGuest); } catch(e){}
  if (COOP.ref) try { COOP.ref.remove(); } catch(e){}
  if (COOP.dcRef) try { COOP.dcRef.onDisconnect().cancel(); } catch(e){}
  COOP.mode=null; COOP.code=null; COOP.ref=null; COOP.dcRef=null; COOP.offGuest=null;
  document.getElementById('waneesCoopWait').style.display = 'none';
  document.getElementById('waneesStartOverlay').style.display = 'flex';
};
function _wnCoopHostStart(){
  COOP.mode = 'host';
  document.getElementById('waneesCoopWait').style.display = 'none';
  try { showToast && showToast('✨ '+COOP.guestName+' انضم — هيا!', '#3dba7a'); } catch(e){}
  // iOS Safari throttles background JS hard; grab a wake lock so the screen
  // stays on and the loop keeps its 60 Hz rhythm during play.
  try { _wnAcquireWake && _wnAcquireWake(); } catch(e){}
  // Mark the room as started so the guest knows we're going
  COOP.ref.child('started').set(true).catch(()=>{});
  // Subscribe to guest's inputs
  COOP.offInput = COOP.ref.child('p2input').on('value', s => {
    const v = s.val(); if (!v) return;
    applyCoopInput(v);
  });
  WG.coopMode = true;
  WG.coopRole = 'host';
  // Stamp kinds onto the player slots so sprite + names follow profiles
  WG._p1Kind = COOP.hostKind;
  WG._p2Kind = COOP.guestKind;
  waneesStart(); // existing flow; loadLevel inside will read WG._p1Kind/_p2Kind
}
window.openCoopJoinPrompt = function(){
  const inp = document.getElementById('wnCoopJoinCode');
  if (inp){ inp.value=''; inp.focus(); }
  const err = document.getElementById('wnCoopJoinErr'); if (err) err.style.display='none';
  document.getElementById('waneesCoopJoin').style.display='flex';
};
window.closeCoopJoinPrompt = function(){
  document.getElementById('waneesCoopJoin').style.display='none';
};
window.confirmCoopJoin = function(){
  const inp = document.getElementById('wnCoopJoinCode');
  const errEl = document.getElementById('wnCoopJoinErr');
  function fail(m){ if (errEl){ errEl.textContent=m; errEl.style.display='block'; } }
  const code = (inp.value||'').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,8}$/.test(code)) return fail('الكود غير صالح');
  const db = _wnEnsureFb();
  if (!db) return fail('يلزم اتصال إنترنت');
  const ref = db.ref('rooms/wnCoop_'+code);
  ref.child('meta').once('value').then(s => {
    if (!s.exists()) return fail('الكود غير صالح أو الغرفة انتهت');
    const meta = s.val();
    COOP.code = code; COOP.ref = ref;
    COOP.hostName = meta.hostName || 'ونيس'; COOP.hostKind = meta.hostKind || 'wanees';
    COOP.guestKind = getPlayerKind('guest');
    COOP.guestName = _wnProfileName();
    // Write our presence so the host starts
    ref.child('guest').set({ name: COOP.guestName, kind: COOP.guestKind }).then(() => {
      try { ref.child('guest').onDisconnect().remove(); } catch(e){}
      closeCoopJoinPrompt();
      document.getElementById('waneesStartOverlay').style.display='none';
      _wnCoopGuestStart();
    }).catch(err => fail('تعذّر الانضمام: '+(err && err.message ? err.message : 'خطأ')));
  }).catch(err => {
    const msg = (err && err.code === 'PERMISSION_DENIED')
      ? 'محجوب من قواعد قاعدة البيانات'
      : ('تعذّر الوصول: ' + (err && err.message ? err.message : ''));
    fail(msg);
  });
};
function _wnCoopGuestStart(){
  COOP.mode = 'guest';
  WG.coopMode = true;
  WG.coopRole = 'guest';
  try { _wnAcquireWake && _wnAcquireWake(); } catch(e){}
  WG._p1Kind = COOP.hostKind;
  WG._p2Kind = COOP.guestKind;
  // Prepare world placeholders; the snapshot will fill them in
  WG.character = 'wanees'; WG.suhaMode = false;
  WG.currentLevel = 0; WG.lives = 3; WG.coinsCollected = 0; WG.score = 0; WG.timeLeft = 300;
  WG.particles = []; WG.camera.x = 0;
  loadLevel();
  showSpecBanner('watching', '🌐 شريك مع <b>'+escapeHtml(COOP.hostName)+'</b> — أنت لُولُو');
  // Subscribe to host snapshots
  COOP.lastSnapAt = Date.now();
  COOP.off = COOP.ref.child('snap').on('value', snapSnap => {
    const snap = snapSnap.val(); if (snap) applyCoopSnap(snap);
  });
  // Heartbeat
  if (COOP.watchTimer) clearInterval(COOP.watchTimer);
  COOP.watchTimer = setInterval(() => {
    if (COOP.mode !== 'guest') return;
    const stale = Date.now() - COOP.lastSnapAt;
    const el = document.getElementById('wnSpecText');
    if (el && stale > 4000) el.innerHTML='🌐 بانتظار <b>'+escapeHtml(COOP.hostName)+'</b>… (منذ '+Math.floor(stale/1000)+'ث)';
  }, 800);
  WG.state = 'spectating';
  cancelAnimationFrame(WG.raf);
  WG.raf = requestAnimationFrame(coopGuestFrame);
}
function coopGuestFrame(t){
  if (COOP.mode !== 'guest') return;
  // Lightweight visual prediction so the partner's character starts moving
  // the instant the joystick is touched — without simulating physics. The
  // authoritative position then pulls the prediction back in applyCoopSnap.
  const now = (typeof t === 'number') ? t : performance.now();
  const dt = Math.min(2.5, (now - (COOP._prevT || now)) / 16.67); // frames
  COOP._prevT = now;
  if (WG.player2 && !WG.player2.ghost){
    const ix = WG.inputs.analogX || (WG.inputs.left ? -1 : WG.inputs.right ? 1 : 0);
    if (Math.abs(ix) > 0.05){
      WG.player2.x += ix * COOP.predictGain * dt * WG.PLAYER_SPEED * 0.5;
      WG.player2.walkPhase = (WG.player2.walkPhase || 0) + dt * 0.25;
      WG.player2.dir = ix > 0 ? 1 : -1;
    }
  }
  try { drawFrame(); } catch(e){}
  flushCoopInput();
  WG.raf = requestAnimationFrame(coopGuestFrame);
}
function flushCoopInput(force){
  if (COOP.mode !== 'guest' || !COOP.ref) return;
  if (!force){
    COOP.inputAcc = (COOP.inputAcc || 0) + 1;
    if (COOP.inputAcc < COOP.inputEveryFrames) return;
    COOP.inputAcc = 0;
  }
  // The guest's local touch/keyboard binds to WG.inputs (the only input they
  // have on their device). Forward it as the partner's P2 input.
  const i = WG.inputs;
  const sig = [i.left?1:0, i.right?1:0, i.jumpHeld?1:0, i.jumpJustPressed?1:0,
                Math.round((i.analogX||0)*100), i.fireTap?1:0].join('|');
  if (!force && sig === COOP.prevInputSig) return;
  COOP.prevInputSig = sig;
  const payload = {
    l: i.left?1:0, r: i.right?1:0,
    j: i.jumpJustPressed?1:0, jh: i.jumpHeld?1:0,
    ax: Math.round((i.analogX||0)*100)/100,
    f: i.fireTap?1:0,
    t: Date.now()
  };
  try { COOP.ref.child('p2input').set(payload); } catch(e){}
  // jumpJustPressed is a one-shot — consume locally too so we don't resend
  WG.inputs.jumpJustPressed = false;
  WG.inputs.fireTap = false;
}
// Tiny shim so input handlers can immediately push to the network on edges
// (touchstart, keydown, jump tap) instead of waiting for the next frame.
function coopFlushNow(){
  if (COOP.mode === 'guest') flushCoopInput(true);
}
function applyCoopInput(v){
  // Host receives guest's input → apply to WG.inputs2 so P2 physics drive
  if (!v) return;
  COOP.lastInputAt = Date.now();
  WG.inputs2.left = !!v.l;
  WG.inputs2.right = !!v.r;
  if (v.j) WG.inputs2.jumpJustPressed = true;
  WG.inputs2.jumpHeld = !!v.jh;
  WG.inputs2.analogX = typeof v.ax === 'number' ? v.ax : 0;
  if (v.f) WG.inputs2.fireTap = true;
}
function publishCoopSnap(frames){
  if (COOP.mode !== 'host' || !COOP.ref || !WG.player) return;
  COOP.snapAcc += frames;
  if (COOP.snapAcc < COOP.snapEveryFrames) return;
  COOP.snapAcc = 0;
  const p = WG.player, q = WG.player2;
  function dumpP(pp){
    if (!pp) return null;
    return { x: Math.round(pp.x*10)/10, y: Math.round(pp.y*10)/10,
             d: pp.dir, w: pp.walkPhase|0, og: pp.onGround?1:0,
             iv: pp.invincible|0, st: pp.starTimer|0,
             gh: pp.ghost?1:0, lv: pp.lives|0, fc: pp.fireCharges|0,
             k: pp.kind || 'wanees' };
  }
  const snap = {
    t: Date.now(),
    lv: WG.currentLevel|0,
    cm: WG.camera.x|0,
    p1: dumpP(p), p2: dumpP(q),
    e: (WG.enemies||[]).filter(e=>e.alive).map(e=>[e.x|0,e.y|0,e.kind==='koopa'?(e.shell?2:1):0,e.dir||-1]),
    c: (WG.coins||[]).filter(c=>!c.collected).map(c=>[c.x|0,c.y|0]),
    i: (WG.items||[]).filter(it=>it.alive).map(it=>[it.x|0,it.y|0,
        it.kind==='star'?1:(it.kind==='fire'?2:0)]),
    rs:(WG.reviveStars||[]).filter(s=>!s.taken).map(s=>[s.x|0,s.y|0,s.forId|0]),
    fb:(WG.fireballs||[]).map(b=>[b.x|0,b.y|0]),
    f: WG.flag ? [WG.flag.x|0, WG.flag.y|0] : null,
    h: { c: WG.coinsCollected, s: WG.score|0, tm: WG.timeLeft|0, cb: WG.stompCombo|0 },
    s: WG.state
  };
  try { COOP.ref.child('snap').set(snap); } catch(e){}
}
function applyCoopSnap(snap){
  if (!snap || COOP.mode !== 'guest') return;
  COOP.lastSnapAt = Date.now();
  if ((snap.lv|0) !== WG.currentLevel){
    WG.currentLevel = snap.lv|0;
    loadLevel();
  }
  WG.camera.x = snap.cm|0;
  function applyP(pp, src){
    if (!pp || !src) return;
    const sx = src.x||0, sy = src.y||0;
    // Guest's own slot (P2): smooth reconciliation against local prediction
    // so the joystick feels instant. Big drifts (level transitions, deaths)
    // still snap. P1 (the host) just hard-snaps — server is canonical.
    const isOwnSlot = (COOP.mode === 'guest' && pp === WG.player2);
    if (isOwnSlot && pp.x !== undefined){
      const dx = sx - pp.x, dy = sy - pp.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 32){ pp.x = sx; pp.y = sy; }
      else { pp.x += dx * COOP.reconcilePull; pp.y += dy * (dy < 0 ? 0.7 : COOP.reconcilePull); }
    } else {
      pp.x = sx; pp.y = sy;
    }
    pp.dir = src.d||1; pp.walkPhase = src.w||0;
    pp.onGround = !!src.og; pp.invincible = src.iv|0; pp.starTimer = src.st|0;
    pp.ghost = !!src.gh; pp.lives = src.lv|0; pp.fireCharges = src.fc|0;
    pp.kind = src.k || pp.kind;
  }
  if (!WG.player) WG.player  = { w:12, h:14, vx:0, vy:0, alive:true, jumpBuffer:0, coyote:0 };
  if (!WG.player2) WG.player2 = { w:12, h:14, vx:0, vy:0, alive:true, jumpBuffer:0, coyote:0 };
  applyP(WG.player,  snap.p1);
  applyP(WG.player2, snap.p2);
  WG.enemies = (snap.e||[]).map(e=>{
    const koopa = e[2] > 0;
    return { x:e[0], y:e[1], vx:0, vy:0, w:14, h:koopa?16:14, alive:true,
             walkPhase:0, dir:e[3]||-1, kind:koopa?'koopa':'goomba',
             shell:e[2]===2, shellVx:0 };
  });
  WG.coins = (snap.c||[]).map(c=>({ x:c[0], y:c[1], w:8, h:8, collected:false, phase:0 }));
  WG.items = (snap.i||[]).map(it=>({ x:it[0], y:it[1], w:12, h:14, vx:0, vy:0,
    kind: it[2]===1?'star':(it[2]===2?'fire':'mushroom'), alive:true, onGround:false }));
  WG.reviveStars = (snap.rs||[]).map(s=>({ x:s[0], y:s[1], w:12, h:12, taken:false, forId:s[2]||1, phase:0 }));
  WG.fireballs = (snap.fb||[]).map(b=>({ x:b[0], y:b[1], vx:0, vy:0, w:6, h:6, bounces:0, dir:1 }));
  if (snap.f){ WG.flag = { x:snap.f[0], y:snap.f[1] }; }
  const h = snap.h || {};
  WG.coinsCollected = h.c|0; WG.score = h.s|0; WG.timeLeft = h.tm|0;
  WG.stompCombo = h.cb|0;
  // Reflect the host's game state so the guest sees over/win overlays too
  if (snap.s && snap.s !== WG.state){
    const prev = WG.state;
    WG.state = snap.s;
    if (snap.s === 'dead' && prev !== 'dead'){ try { showOverOverlay('lose'); } catch(e){} stopCoop(); }
    else if (snap.s === 'win' && prev !== 'win'){ try { showOverOverlay('win'); } catch(e){} stopCoop(); }
  }
  updateHud();
}
function stopCoop(){
  if (!COOP.mode) return;
  try { if (COOP.ref){
    if (COOP.off) COOP.ref.child('snap').off('value', COOP.off);
    if (COOP.offInput) COOP.ref.child('p2input').off('value', COOP.offInput);
    if (COOP.mode === 'host') COOP.ref.remove();
    else COOP.ref.child('guest').remove();
  }} catch(e){}
  if (COOP.watchTimer){ clearInterval(COOP.watchTimer); COOP.watchTimer = 0; }
  if (COOP.dcRef) try { COOP.dcRef.onDisconnect().cancel(); } catch(e){}
  COOP.mode = null; COOP.code = null; COOP.ref = null; COOP.dcRef = null;
  COOP.off = null; COOP.offInput = null; COOP.offGuest = null;
  WG.coopMode = false; WG.coopRole = null;
  hideSpecBanner();
}
function loadWaneesCharacter(){
  try { const v = localStorage.getItem('waneesCharacter'); if (v === 'wanees' || v === 'suha') WG.character = v; } catch(e){}
}
function setWaneesCharacter(c){
  WG.character = c;
  try { localStorage.setItem('waneesCharacter', c); } catch(e){}
  syncCharPicker();
}
function isProfileSuha(){
  try {
    const p = (typeof loadProfile === 'function') ? loadProfile() : null;
    const name = (p && p.name ? String(p.name) : '').trim();
    return name === 'سهى';
  } catch(e){ return false; }
}
function syncCharPicker(){
  const pick = document.getElementById('wnCharPicker'); if (!pick) return;
  const label = document.getElementById('wnCharLabel');
  // Only the player whose profile name is "سهى" sees the picker.
  const show = isProfileSuha();
  pick.style.display = show ? 'flex' : 'none';
  if (label) label.style.display = show ? 'block' : 'none';
  if (!show) return; // isSuhaPlayer() already gates Suha mode on the profile name
  const cur = (WG.character === 'suha') ? 'suha' : 'wanees';
  pick.querySelectorAll('.wn-char-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.char === cur);
  });
}
function resetWaneesState(){
  WG.state = 'idle';
  const suha = isSuhaPlayer();
  WG.suhaMode = suha;
  WG.currentLevel = 0;
  WG.score = 0; WG.coinsCollected = 0;
  WG.lives = suha ? 5 : 3;
  WG.timeLeft = suha ? 420 : 300;
  // Easier physics for Suha: a bit faster + a bit higher jump
  WG.PLAYER_SPEED = suha ? 2.4 : 2.0;
  WG.JUMP_VEL = suha ? -7.2 : -6.4;
  WG.timeAccum = 0;
  WG.camera.x = 0;
  WG.particles = [];
  WG.fireballs = [];
  // Forget the old player so the next loadLevel rebuilds with 0 fire charges
  WG.player = null;
  WG.player2 = null;
  WG.reviveStars = [];
  WG.inputs = { left:false, right:false, jump:false, jumpHeld:false, jumpJustPressed:false, analogX:0, fireTap:false };
  // Second input set — only consumed when WG.coopMode is true. Mirrors WG.inputs.
  WG.inputs2 = { left:false, right:false, jump:false, jumpHeld:false, jumpJustPressed:false, analogX:0, fireTap:false };
  updateHud();
  syncFireBtn();
}
// Two-player coop state — toggled from the start overlay.
WG.coopMode = false;
window.setCoopMode = function(v){
  WG.coopMode = !!v;
  document.querySelectorAll('.wn-coop-btn').forEach(b => {
    b.classList.toggle('active', String(b.dataset.coop|0) === String(v|0));
  });
  const arena = document.getElementById('waneesArena');
  if (arena) arena.classList.toggle('coop', WG.coopMode);
};
// ===== Story dialogues =====
// Wanees is on a quest to find his little sister "Lulu". After each level
// he gets a little closer; a short, encouraging line keeps the player
// invested. Suha mode swaps names but keeps the same beats.
const WN_STORY = {
  coopIntro: [
    {who:'hero', text:'لُولُو، اليوم رح نلعب مع بعض! 🍄💕\nخلّينا نلحق كعبول قبل ما يهرب…'},
    {who:'lulu', text:'يلا أخوي {hero}! 🌟\nأنا أقفز عالي وأنت تكسّر الأعداء — معاً ما أحد يوقفنا! 💪'},
    {who:'hero', text:'لو طاحت قلوبك، تجمع لي ٣ نجوم وترجّعني للحياة 😉\nويمين الشاشة لك، يسار الشاشة لي!'},
  ],
  intro: [
    {who:'hero', text:'مرحباً! أنا {hero} 👋\nأعيش في وادي الفطر السحري مع أختي الصغيرة لُولُو 💕'},
    {who:'hero', text:'هالصبح صحيت ولُولُو مو في غرفتها… لقيت ورقة مكتوب فيها:\n"خذها كعبول لقلعة الظلام" 😱'},
    {who:'hero', text:'ثمانية عوالم سحرية تفصلني عنها 🌍\nمرج، صحراء، ليل نجوم، قلعة، غابة، جليد، بحر، وسحاب 🏰❄️🌊☁️'},
    {who:'hero', text:'هل بتساعدني أرجّع لُولُو لبيتها؟ 💪✨'},
  ],
  // Said before loading level N+1 (after clearing N)
  after1: [
    {who:'hero', text:'في طرف المرج… لقيت طوقها الذهبي 🌟\nهي مرّت من هنا فعلاً!'},
    {who:'hero', text:'يلا للصحراء — ما راح أعيا قبل ما ألاقيها! 🏜️'},
  ],
  after2: [
    {who:'hero', text:'في الرمل لقيت شالها الوردي الصغير 🧣💗\nقلبي يقول إنها قريبة…'},
    {who:'hero', text:'الليل اقترب — لازم أوصل قبل الفجر! 🌙'},
  ],
  after3: [
    {who:'hero', text:'مع نسمة الليل سمعت صوتها:\n"أخوي {hero}… أنا هنا، تعال!" 🥺'},
    {who:'hero', text:'القلعة قدامي… دخّلوها فيها يبدو 🏰\nيلا أكسر الباب!'},
  ],
  after4: [
    {who:'villain', text:'هههه… توقّعتُ إنك بتجي يا صغير الوادي 😈\nالقلعة كانت فخّ… ومشيت فيه!'},
    {who:'villain', text:'أختك؟ يا سلام 🌑\nخبّأتها وراء سبع غابات وسبعة بحور وسبع سحابات!\nاستسلم يا صبي الوادي…'},
    {who:'hero', text:'أنتَ يا كعبول…! تجرّأت على أختي؟! 😤\nما تعرفني — قلبي أكبر من قلعتك كلها!'},
    {who:'villain', text:'جرّب إن استطعتَ 👻\nالغابة، الجليد، البحر، السحاب… كلهم ينتظرونك\nهل ستصمد؟'},
    {who:'hero', text:'أختي فوق كل شيء… 💪\nيلا — المشوار ما انتهى!'},
  ],
  after5: [
    {who:'hero', text:'في الغابة سمعت أرواح الأشجار تهمس:\n"بنتك في كهف الجليد… أسرعْ" 🌳✨'},
    {who:'hero', text:'بس أنا فطر، البرد ما يخوّفني!\nبرد مين أمام نار قلبي؟ 🔥❄️'},
  ],
  after6: [
    {who:'hero', text:'الجليد بدا يذوب وانفتح بحر تحته 🌊\nلازم أغوص!'},
    {who:'hero', text:'لُولُو، لو تسمعيني — هذي فقاعات قلبي ترسلها لك 💗🫧'},
  ],
  after7: [
    {who:'hero', text:'بحر ينتهي بشلاّل صاعد للسحاب! ☁️\nطلعت مع المياه وأنا أبتسم — العالم سحري فعلاً 🌈'},
    {who:'hero', text:'فوق السحاب أحس بنبضها… مملكة السماء، بس أنتِ ولا فاصل! 💪✨'},
  ],
  final: [
    {who:'hero', text:'فوق سحابة ذهبية… لقيتها! 🥹'},
    {who:'lulu', text:'{hero}يييي! ثمانية عوالم كاملة عبرتها عشاني؟ 😭'},
    {who:'hero', text:'أنتِ أختي يا لُولُو، حتى لو كانوا ألف عالم 💪\nيلا نرجع البيت!'},
    {who:'lulu', text:'أمي بتعمل لنا فطر مشوي ولقمة عسل 🍯✨'},
    {who:'lulu', text:'شكراً للي ساعد {hero} يوصلني 💞\nأنت البطل الحقيقي!'},
  ]
};
// Hero name + face follow the profile-driven kind in coop, the suhaMode flag
// in single (legacy). Used by the story-dialogue interpolation ({hero}).
function _heroName(){
  if (WG.coopMode){
    const k = (WG.player && WG.player.kind) || WG._p1Kind || 'wanees';
    return kindDisplayName(k);
  }
  return WG.suhaMode ? 'سهى' : 'ونيس';
}
function _heroFace(){
  if (WG.coopMode){
    const k = (WG.player && WG.player.kind) || WG._p1Kind || 'wanees';
    return k === 'suha' || k === 'lulu' ? '👧🏻' : '👦';
  }
  return WG.suhaMode ? '👧🏻' : '👦';
}
function _luluFace(){ return '🧒🏻'; }
// ===== Hand-drawn character portraits (inline SVG) =====
// Designs based on user reference art: ونيس the cap-wearing boy in overalls,
// لُولُو the pigtailed girl with a star wand, كعبول the green-skinned ogre.
const CHAR_SVG = {
  // Wanees — boy with red cap, orange shirt, blue overalls
  wanees: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="50" cy="95" rx="22" ry="2.5" fill="rgba(0,0,0,0.3)"/>'
    // boots
    + '<path d="M36 86 L34 94 L46 94 L46 86 Z" fill="#5a3010" stroke="#1a0a00" stroke-width="1.5"/>'
    + '<path d="M54 86 L54 94 L66 94 L64 86 Z" fill="#5a3010" stroke="#1a0a00" stroke-width="1.5"/>'
    // overalls (blue jeans)
    + '<path d="M30 60 L26 90 L46 90 L46 78 L54 78 L54 90 L74 90 L70 60 Z" fill="#2a66bb" stroke="#0a2a55" stroke-width="2"/>'
    // overall straps
    + '<path d="M38 48 L36 64 L42 64 L42 48 Z" fill="#2a66bb" stroke="#0a2a55" stroke-width="1.5"/>'
    + '<path d="M58 48 L58 64 L64 64 L62 48 Z" fill="#2a66bb" stroke="#0a2a55" stroke-width="1.5"/>'
    // overall buttons
    + '<circle cx="39" cy="52" r="1.6" fill="#ffd200" stroke="#7a5500" stroke-width="0.6"/>'
    + '<circle cx="61" cy="52" r="1.6" fill="#ffd200" stroke="#7a5500" stroke-width="0.6"/>'
    // overall pocket
    + '<path d="M42 64 L42 76 L58 76 L58 64 Z" fill="#1a4488" stroke="#0a2a55" stroke-width="1"/>'
    + '<path d="M46 70 L54 70" stroke="#0a2a55" stroke-width="0.8"/>'
    // orange shirt
    + '<path d="M28 48 L26 64 L74 64 L72 48 Z" fill="#ee7820" stroke="#a04408" stroke-width="2"/>'
    // shirt collar
    + '<path d="M44 46 L50 52 L56 46 Z" fill="#cc5510" stroke="#7a3000" stroke-width="1"/>'
    // arms (orange sleeves)
    + '<ellipse cx="22" cy="56" rx="5.5" ry="9" fill="#ee7820" stroke="#a04408" stroke-width="1.5"/>'
    + '<ellipse cx="78" cy="56" rx="5.5" ry="9" fill="#ee7820" stroke="#a04408" stroke-width="1.5"/>'
    // hands
    + '<circle cx="22" cy="66" r="4" fill="#ffd2a8" stroke="#aa7040" stroke-width="1.2"/>'
    + '<circle cx="78" cy="66" r="4" fill="#ffd2a8" stroke="#aa7040" stroke-width="1.2"/>'
    // thumbs up on right hand
    + '<rect x="76.5" y="60" width="2" height="4" rx="1" fill="#ffd2a8" stroke="#aa7040" stroke-width="0.8"/>'
    // head
    + '<ellipse cx="50" cy="32" rx="18" ry="17" fill="#ffd2a8" stroke="#7a4020" stroke-width="2"/>'
    // brown hair (peeking under cap)
    + '<path d="M33 36 Q34 28 38 30 M62 30 Q66 28 67 36" stroke="#5a2810" stroke-width="3" fill="none" stroke-linecap="round"/>'
    + '<path d="M36 22 Q40 16 50 16 Q60 16 64 22 L60 26 Q50 22 40 26 Z" fill="#5a2810"/>'
    // red cap
    + '<path d="M32 24 Q34 14 50 12 Q66 14 68 24 L68 28 L32 28 Z" fill="#e02828" stroke="#8a0a0a" stroke-width="2"/>'
    // cap brim
    + '<path d="M28 28 Q50 24 72 28 L72 32 Q50 30 28 32 Z" fill="#cc1818" stroke="#8a0a0a" stroke-width="1.5"/>'
    // cap button
    + '<circle cx="50" cy="14" r="1.5" fill="#fff" stroke="#aa1010" stroke-width="0.5"/>'
    // eyes
    + '<ellipse cx="43" cy="34" rx="2.6" ry="3.2" fill="#1a1010"/>'
    + '<ellipse cx="57" cy="34" rx="2.6" ry="3.2" fill="#1a1010"/>'
    + '<circle cx="43.7" cy="33" r="1" fill="#fff"/>'
    + '<circle cx="57.7" cy="33" r="1" fill="#fff"/>'
    // eyebrows
    + '<path d="M40 30 L46 29.5 M54 29.5 L60 30" stroke="#3a1808" stroke-width="1.4" stroke-linecap="round"/>'
    // smile
    + '<path d="M45 40 Q50 44 55 40" stroke="#7a3010" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    // cheeks
    + '<circle cx="37" cy="40" r="2.3" fill="#ff8888" opacity="0.6"/>'
    + '<circle cx="63" cy="40" r="2.3" fill="#ff8888" opacity="0.6"/>'
    + '</svg>',
  // Suha — pink-dress version of the same girl style (for سهى mode)
  suha: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="50" cy="95" rx="22" ry="2.5" fill="rgba(0,0,0,0.3)"/>'
    // shoes
    + '<ellipse cx="42" cy="92" rx="5" ry="2.5" fill="#cc1166" stroke="#5a0028" stroke-width="1"/>'
    + '<ellipse cx="58" cy="92" rx="5" ry="2.5" fill="#cc1166" stroke="#5a0028" stroke-width="1"/>'
    // legs
    + '<rect x="40" y="82" width="6" height="10" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    + '<rect x="54" y="82" width="6" height="10" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    // long hair behind body
    + '<path d="M22 42 Q16 65 22 90 L34 90 Q30 64 32 46 Z" fill="#3a1810" stroke="#1a0808" stroke-width="1.5"/>'
    + '<path d="M78 42 Q84 65 78 90 L66 90 Q70 64 68 46 Z" fill="#3a1810" stroke="#1a0808" stroke-width="1.5"/>'
    // pink dress
    + '<path d="M30 52 L24 82 L76 82 L70 52 Z" fill="#ff5599" stroke="#aa1166" stroke-width="2"/>'
    // dress sparkles
    + '<path d="M36 64 L37 66 L39 67 L37 68 L36 70 L35 68 L33 67 L35 66 Z" fill="#fff8a0"/>'
    + '<path d="M52 72 L53 74 L55 75 L53 76 L52 78 L51 76 L49 75 L51 74 Z" fill="#fff8a0"/>'
    + '<path d="M62 60 L63 62 L65 63 L63 64 L62 66 L61 64 L59 63 L61 62 Z" fill="#fff8a0"/>'
    // arms
    + '<ellipse cx="22" cy="56" rx="5" ry="9" fill="#ffd2a8" stroke="#aa7040" stroke-width="1.4"/>'
    + '<ellipse cx="78" cy="56" rx="5" ry="9" fill="#ffd2a8" stroke="#aa7040" stroke-width="1.4"/>'
    // hands
    + '<circle cx="22" cy="66" r="3.5" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    + '<circle cx="78" cy="66" r="3.5" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    // head
    + '<ellipse cx="50" cy="32" rx="18" ry="17" fill="#ffd2a8" stroke="#7a4020" stroke-width="2"/>'
    // hair top
    + '<path d="M30 28 Q32 14 50 12 Q68 14 70 28 Q66 20 50 20 Q34 20 30 28 Z" fill="#3a1810"/>'
    // crown / tiara
    + '<path d="M38 14 L42 10 L46 14 L50 8 L54 14 L58 10 L62 14 L60 18 L40 18 Z" fill="#ffd200" stroke="#a07000" stroke-width="1.4"/>'
    + '<circle cx="50" cy="12" r="1.6" fill="#ff3377" stroke="#7a0033" stroke-width="0.5"/>'
    + '<circle cx="42" cy="14" r="1" fill="#33ccff"/>'
    + '<circle cx="58" cy="14" r="1" fill="#33ccff"/>'
    // big sparkly eyes
    + '<ellipse cx="43" cy="34" rx="3.2" ry="4" fill="#2a1010"/>'
    + '<ellipse cx="57" cy="34" rx="3.2" ry="4" fill="#2a1010"/>'
    + '<circle cx="44" cy="32.5" r="1.4" fill="#fff"/>'
    + '<circle cx="58" cy="32.5" r="1.4" fill="#fff"/>'
    + '<circle cx="41.5" cy="36" r="0.6" fill="#fff"/>'
    + '<circle cx="55.5" cy="36" r="0.6" fill="#fff"/>'
    // eyebrows
    + '<path d="M40 29 L46 29 M54 29 L60 29" stroke="#3a1808" stroke-width="1.2" stroke-linecap="round"/>'
    // smile
    + '<path d="M45 41 Q50 45 55 41" stroke="#7a3010" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
    // cheeks
    + '<circle cx="37" cy="40" r="2.5" fill="#ff7799" opacity="0.7"/>'
    + '<circle cx="63" cy="40" r="2.5" fill="#ff7799" opacity="0.7"/>'
    + '</svg>',
  // Lulu — pigtailed girl with striped pink dress and star wand
  lulu: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<ellipse cx="50" cy="95" rx="22" ry="2.5" fill="rgba(0,0,0,0.3)"/>'
    // shoes
    + '<ellipse cx="42" cy="92" rx="5" ry="2.5" fill="#ff2266" stroke="#7a0030" stroke-width="1"/>'
    + '<ellipse cx="58" cy="92" rx="5" ry="2.5" fill="#ff2266" stroke="#7a0030" stroke-width="1"/>'
    // legs
    + '<rect x="40" y="82" width="6" height="10" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    + '<rect x="54" y="82" width="6" height="10" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    // pink striped dress
    + '<path d="M30 52 L24 82 L76 82 L70 52 Z" fill="#ff66aa" stroke="#aa1166" stroke-width="2"/>'
    // white stripes
    + '<path d="M27 62 L73 62" stroke="#fff" stroke-width="3.5" opacity="0.95"/>'
    + '<path d="M26 72 L74 72" stroke="#fff" stroke-width="3.5" opacity="0.95"/>'
    // arms
    + '<ellipse cx="22" cy="56" rx="5" ry="9" fill="#ffd2a8" stroke="#aa7040" stroke-width="1.4"/>'
    + '<ellipse cx="78" cy="56" rx="5" ry="9" fill="#ffd2a8" stroke="#aa7040" stroke-width="1.4"/>'
    + '<circle cx="22" cy="66" r="3.5" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    + '<circle cx="78" cy="66" r="3.5" fill="#ffd2a8" stroke="#aa7040" stroke-width="1"/>'
    // wand stick
    + '<line x1="78" y1="64" x2="92" y2="38" stroke="#aa6010" stroke-width="2.5" stroke-linecap="round"/>'
    // wand star
    + '<path d="M92 32 L94 38 L100 38 L95 42 L97 48 L92 44 L87 48 L89 42 L84 38 L90 38 Z" fill="#ffd200" stroke="#a07000" stroke-width="1.5"/>'
    // sparkles around wand
    + '<circle cx="98" cy="28" r="1.3" fill="#fff8a0"/>'
    + '<circle cx="85" cy="30" r="1" fill="#fff8a0"/>'
    + '<circle cx="96" cy="50" r="1" fill="#fff8a0"/>'
    // head
    + '<ellipse cx="50" cy="32" rx="18" ry="17" fill="#ffd2a8" stroke="#7a4020" stroke-width="2"/>'
    // dark hair bangs
    + '<path d="M30 26 Q32 12 50 10 Q68 12 70 26 Q66 18 50 18 Q34 18 30 26 Z" fill="#1a0808"/>'
    + '<path d="M34 28 L36 22 L40 28 M44 26 L46 20 L50 28 L54 20 L56 26 M60 28 L64 22 L66 28" stroke="#1a0808" stroke-width="2" fill="#1a0808" stroke-linejoin="round"/>'
    // pigtails
    + '<ellipse cx="18" cy="36" rx="7" ry="11" fill="#1a0808" stroke="#000" stroke-width="1.2"/>'
    + '<ellipse cx="82" cy="36" rx="7" ry="11" fill="#1a0808" stroke="#000" stroke-width="1.2"/>'
    // pigtail tips
    + '<circle cx="18" cy="46" r="3" fill="#1a0808"/>'
    + '<circle cx="82" cy="46" r="3" fill="#1a0808"/>'
    // pink bows
    + '<path d="M14 24 L18 26 L22 24 L20 28 L16 28 Z" fill="#ff3377" stroke="#7a0033" stroke-width="0.8"/>'
    + '<path d="M86 24 L82 26 L78 24 L80 28 L84 28 Z" fill="#ff3377" stroke="#7a0033" stroke-width="0.8"/>'
    + '<circle cx="18" cy="26" r="1.2" fill="#aa0044"/>'
    + '<circle cx="82" cy="26" r="1.2" fill="#aa0044"/>'
    // big eyes
    + '<ellipse cx="43" cy="34" rx="3" ry="3.8" fill="#1a1010"/>'
    + '<ellipse cx="57" cy="34" rx="3" ry="3.8" fill="#1a1010"/>'
    + '<circle cx="44" cy="32.5" r="1.3" fill="#fff"/>'
    + '<circle cx="58" cy="32.5" r="1.3" fill="#fff"/>'
    // smile
    + '<path d="M45 41 Q50 44 55 41" stroke="#7a3010" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
    // cheeks
    + '<circle cx="37" cy="40" r="2.5" fill="#ff8899" opacity="0.7"/>'
    + '<circle cx="63" cy="40" r="2.5" fill="#ff8899" opacity="0.7"/>'
    + '</svg>',
  // Kaaboul (كعبول) — green-skinned ogre with horns, dark armor, battle axe
  villain: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<defs><radialGradient id="vAura" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#660022" stop-opacity="0.55"/>'
    + '<stop offset="100%" stop-color="#660022" stop-opacity="0"/></radialGradient></defs>'
    + '<circle cx="50" cy="50" r="48" fill="url(#vAura)"/>'
    + '<ellipse cx="50" cy="95" rx="28" ry="3" fill="rgba(0,0,0,0.45)"/>'
    // body / dark armor torso
    + '<path d="M22 56 L16 92 L84 92 L78 56 Z" fill="#2a3320" stroke="#0a1a08" stroke-width="2"/>'
    // armor belt
    + '<rect x="18" y="78" width="64" height="6" fill="#3a2a10" stroke="#1a0a00" stroke-width="1.5"/>'
    + '<rect x="46" y="76" width="8" height="10" fill="#cc8822" stroke="#5a3010" stroke-width="1"/>'
    // skull insignia
    + '<ellipse cx="50" cy="68" rx="6.5" ry="7.5" fill="#e8e0c8" stroke="#1a1010" stroke-width="1.2"/>'
    + '<ellipse cx="47" cy="68" rx="1.5" ry="2" fill="#1a1010"/>'
    + '<ellipse cx="53" cy="68" rx="1.5" ry="2" fill="#1a1010"/>'
    + '<path d="M47 73 L48 75 M50 73 L50 75 M53 73 L52 75" stroke="#1a1010" stroke-width="1" fill="none"/>'
    // spiked shoulders
    + '<path d="M18 56 L10 46 L22 50 Z" fill="#0a1a08" stroke="#000" stroke-width="1.5"/>'
    + '<path d="M16 60 L8 56 L20 58 Z" fill="#0a1a08" stroke="#000" stroke-width="1.2"/>'
    + '<path d="M82 56 L90 46 L78 50 Z" fill="#0a1a08" stroke="#000" stroke-width="1.5"/>'
    + '<path d="M84 60 L92 56 L80 58 Z" fill="#0a1a08" stroke="#000" stroke-width="1.2"/>'
    // green arms
    + '<ellipse cx="14" cy="68" rx="6" ry="10" fill="#4a8030" stroke="#1a4010" stroke-width="1.5"/>'
    + '<ellipse cx="86" cy="68" rx="6" ry="10" fill="#4a8030" stroke="#1a4010" stroke-width="1.5"/>'
    // big green hands / fists
    + '<circle cx="14" cy="80" r="5" fill="#4a8030" stroke="#1a4010" stroke-width="1.5"/>'
    + '<circle cx="86" cy="80" r="5" fill="#4a8030" stroke="#1a4010" stroke-width="1.5"/>'
    // axe handle
    + '<line x1="12" y1="82" x2="4" y2="46" stroke="#5a3010" stroke-width="3" stroke-linecap="round"/>'
    // axe blade
    + '<path d="M4 46 L14 36 L16 48 L8 54 Z" fill="#aaaaaa" stroke="#1a1a1a" stroke-width="1.5"/>'
    + '<path d="M4 46 L-2 36 L-4 48 L4 54 Z" fill="#888888" stroke="#1a1a1a" stroke-width="1.5"/>'
    + '<path d="M4 38 L4 54" stroke="#444" stroke-width="0.8"/>'
    // green head
    + '<ellipse cx="50" cy="38" rx="22" ry="20" fill="#4a8030" stroke="#1a4010" stroke-width="2.5"/>'
    // head shading
    + '<ellipse cx="50" cy="44" rx="20" ry="4" fill="#3a6024" opacity="0.5"/>'
    // horns
    + '<path d="M28 22 L20 2 L34 16 Z" fill="#1a0a08" stroke="#000" stroke-width="1.5"/>'
    + '<path d="M72 22 L80 2 L66 16 Z" fill="#1a0a08" stroke="#000" stroke-width="1.5"/>'
    // angry brows
    + '<path d="M30 28 L46 34" stroke="#0a0a04" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M70 28 L54 34" stroke="#0a0a04" stroke-width="3" stroke-linecap="round"/>'
    // glowing red eyes
    + '<ellipse cx="40" cy="38" rx="5" ry="3.5" fill="#ff0022"/>'
    + '<ellipse cx="60" cy="38" rx="5" ry="3.5" fill="#ff0022"/>'
    + '<ellipse cx="40" cy="38" rx="2.5" ry="1.7" fill="#ffaa00"/>'
    + '<ellipse cx="60" cy="38" rx="2.5" ry="1.7" fill="#ffaa00"/>'
    // evil grin
    + '<path d="M34 48 Q50 58 66 48 L62 52 L58 49 L54 53 L50 49 L46 53 L42 49 L38 52 Z" fill="#1a0a08" stroke="#000" stroke-width="1.5"/>'
    // fangs
    + '<path d="M42 50 L44 56 L46 50 Z" fill="#fff" stroke="#aa0a0a" stroke-width="0.4"/>'
    + '<path d="M54 50 L56 56 L58 50 Z" fill="#fff" stroke="#aa0a0a" stroke-width="0.4"/>'
    // aura wisps
    + '<circle cx="14" cy="20" r="2" fill="#cc1144" opacity="0.7"/>'
    + '<circle cx="86" cy="22" r="2" fill="#cc1144" opacity="0.7"/>'
    + '<circle cx="6" cy="30" r="1.4" fill="#cc1144" opacity="0.6"/>'
    + '<circle cx="94" cy="30" r="1.4" fill="#cc1144" opacity="0.6"/>'
    + '</svg>',
};
// Polished cartoon PNG sprites (rendered by an artist) for the three
// main characters. Suha mode still uses her SVG since no PNG was
// commissioned for that variant.
const CHAR_PNG = {
  wanees:  'char-wanees.png',
  lulu:    'char-lulu.png',
  villain: 'char-kaaboul.png',
};
function _imgTag(src, alt){ return '<img src="' + src + '" alt="' + alt + '" draggable="false">'; }
function _heroSvg(){
  if (WG.suhaMode) return CHAR_SVG.suha;
  return _imgTag(CHAR_PNG.wanees, 'ونيس');
}
function _luluSvg(){ return _imgTag(CHAR_PNG.lulu, 'لُولُو'); }
function _villainSvg(){ return _imgTag(CHAR_PNG.villain, 'كعبول'); }
function _fmt(s){ return s.replace(/\{hero\}/g, _heroName()); }
let _dlgQ = null, _dlgIdx = 0, _dlgDone = null, _dlgTypeT = 0, _dlgTyping = false;
function showDialogue(key, onDone){
  const seq = WN_STORY[key]; if (!seq){ if (onDone) onDone(); return; }
  _dlgQ = seq.slice(); _dlgIdx = 0; _dlgDone = onDone;
  document.getElementById('wnDialogue').style.display = 'flex';
  _renderDlg();
}
function _renderDlg(){
  const e = _dlgQ[_dlgIdx];
  const isHero = e.who === 'hero';
  const isVillain = e.who === 'villain';
  const portrait = document.getElementById('wnDlgPortrait');
  const body = document.getElementById('wnDlgBody');
  const nameEl = document.getElementById('wnDlgName');
  const textEl = document.getElementById('wnDlgText');
  portrait.innerHTML = isVillain ? _villainSvg() : (isHero ? _heroSvg() : _luluSvg());
  portrait.className = 'wn-dlg-portrait' + (isVillain ? ' villain-face' : '');
  if (body) body.className = 'wn-dlg-body' + (isVillain ? ' villain-body' : '');
  // In coop, the "lulu" speaker is actually the partner — show the partner's
  // kind-driven name (سهى if their profile maps that way, otherwise لُولُو).
  const partnerName = (WG.coopMode && (WG._p2Kind || (WG.player2 && WG.player2.kind)))
    ? kindDisplayName(WG._p2Kind || WG.player2.kind) : 'لُولُو';
  nameEl.textContent = isVillain ? 'كعبول' : (isHero ? _heroName() : partnerName);
  nameEl.className = 'wn-dlg-name' + (isVillain ? ' villain-name' : '');
  if (textEl) textEl.className = 'wn-dlg-text' + (isVillain ? ' villain-text' : '');
  document.getElementById('wnDlgStep').textContent = (_dlgIdx+1) + '/' + _dlgQ.length;
  const out = document.getElementById('wnDlgText');
  out.textContent = '';
  const full = _fmt(e.text);
  let i = 0;
  _dlgTyping = true;
  clearInterval(_dlgTypeT);
  _dlgTypeT = setInterval(() => {
    i += 2; out.textContent = full.slice(0, i);
    if (i >= full.length){ clearInterval(_dlgTypeT); _dlgTyping = false; }
  }, 28);
}
window.dlgNext = function(){
  if (!_dlgQ) return;
  // First click finishes the typewriter; next click advances
  if (_dlgTyping){
    clearInterval(_dlgTypeT); _dlgTyping = false;
    document.getElementById('wnDlgText').textContent = _fmt(_dlgQ[_dlgIdx].text);
    return;
  }
  if (_dlgIdx < _dlgQ.length - 1){ _dlgIdx++; _renderDlg(); return; }
  _dlgFinish();
};
window.dlgSkip = function(){ _dlgFinish(); };
function _dlgFinish(){
  clearInterval(_dlgTypeT); _dlgTyping = false;
  document.getElementById('wnDialogue').style.display = 'none';
  const done = _dlgDone; _dlgQ = null; _dlgIdx = 0; _dlgDone = null;
  if (done) done();
}
// ===== Cinematic reunion scene (shown after final dialogue) =====
let _cinStep = 0, _cinDone = null;
function _buildCinStars(){
  const c = document.getElementById('wnCinStars'); if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < 40; i++){
    const s = document.createElement('span');
    s.className = 'wn-cin-star';
    const sz = 1 + Math.random() * 3;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;` +
      `animation-delay:${(Math.random()*2).toFixed(2)}s;animation-duration:${(1.2+Math.random()*1.8).toFixed(2)}s`;
    c.appendChild(s);
  }
}
function showCinema(onDone){
  _cinStep = 0; _cinDone = onDone;
  document.getElementById('wnCinHero').innerHTML = _heroSvg();
  document.getElementById('wnCinLulu').innerHTML = _luluSvg();
  document.getElementById('wnCinTitle').textContent = 'لقاء الأبطال! 🌟';
  document.getElementById('wnCinSub').textContent = 'أخيراً… وجدتها بعد ثمانية عوالم! 💫';
  document.getElementById('wnCinBtn').textContent = 'متابعة ✨';
  const walk = document.getElementById('wnCinWalk');
  if (walk) walk.style.display = 'none';
  _buildCinStars();
  document.getElementById('wnReunion').style.display = 'flex';
}
window.wnCinemaNext = function(){
  _cinStep++;
  const sub = document.getElementById('wnCinSub');
  const title = document.getElementById('wnCinTitle');
  const btn = document.getElementById('wnCinBtn');
  const walk = document.getElementById('wnCinWalk');
  if (_cinStep === 1){
    if (title) title.textContent = 'الحضن الأكبر في العالم 🥹';
    if (sub) sub.textContent = 'لُولُو طارت من الفرح وحضنت ' + _heroName() + '…\nدموع الفرح سبقت الكلام! 😭💕';
  } else if (_cinStep === 2){
    if (title) title.textContent = 'يلا نرجع البيت! 🏠';
    if (sub) sub.textContent = 'معًا… {hero} ولُولُو يمشون للبيت\nوالأمّ عاملة فطر مشوي وعسل! 🍯✨'.replace('{hero}', _heroName());
    if (walk){
      walk.style.display = 'flex';
      walk.innerHTML = '<span class="wn-cin-walk-char">' + _heroSvg() + '</span>'
        + '<span style="font-size:2.2rem">🛤️ 🏠</span>'
        + '<span class="wn-cin-walk-char">' + _luluSvg() + '</span>';
    }
    if (btn) btn.textContent = 'أهلاً بالبيت! 🎉';
  } else {
    document.getElementById('wnReunion').style.display = 'none';
    if (_cinDone) _cinDone();
  }
};
function _startGameplayLoop(){
  WG.state = 'running';
  WG.lastTime = performance.now();
  cancelAnimationFrame(WG.raf);
  WG.raf = requestAnimationFrame(waneesLoop);
}
window.waneesStart = function(){
  document.getElementById('waneesStartOverlay').style.display = 'none';
  document.getElementById('waneesOverOverlay').style.display = 'none';
  // Online coop keeps WG.coopMode + role + kind hints set by the lobby; in
  // single-player resetWaneesState() flips coopMode back to false.
  const preserve = WG.coopMode ? { coopMode: WG.coopMode, coopRole: WG.coopRole,
                                    _p1Kind: WG._p1Kind, _p2Kind: WG._p2Kind } : null;
  resetWaneesState();
  if (preserve){
    WG.coopMode = preserve.coopMode; WG.coopRole = preserve.coopRole;
    WG._p1Kind = preserve._p1Kind;   WG._p2Kind = preserve._p2Kind;
  }
  loadLevel();
  const ctrls = document.querySelector('#waneesScreen .wn-controls');
  if (ctrls) ctrls.classList.toggle('suha-layout', !!WG.suhaMode);
  if (WG.suhaMode && WG.player){
    WG.player.invincible = 180;
    WG.player.starTimer = 180;
    try { if (typeof showToast === 'function') showToast('❤️ وضع سهى مفعّل: قلوب أكثر، سرعة أعلى، وحماية في البداية', '#ff5577'); } catch(e){}
  }
  // Pause the game while the intro story plays, then start the loop.
  WG.state = 'paused';
  // Coop has its own shorter intro since Lulu is already with us.
  showDialogue(WG.coopMode ? 'coopIntro' : 'intro', _startGameplayLoop);
};
function waneesStop(){
  cancelAnimationFrame(WG.raf);
  WG.state = 'idle';
}
function waneesLoop(t){
  if (WG.state !== 'running') return;
  const rawDt = Math.min(40, t - WG.lastTime) / 16.667;
  WG.lastTime = t;
  let dt = rawDt;
  if (WG._gk && WG._gk.stop){
    const scale = WG._gk.stop.tick(rawDt);
    dt = rawDt * scale;
  }
  updateWanees(dt);
  if (WG._gk && WG._gk.shake) WG._gk.shake.update(rawDt, { maxOffset: 4, maxRot: 0.012, decay: 0.07 });
  if (WG.state !== 'running') return;
  drawFrame();
  publishSnapshot(rawDt);
  WG.inputs.jumpJustPressed = false;
  if (WG.inputs2) WG.inputs2.jumpJustPressed = false;
  // Host: broadcast world snapshot
  if (COOP.mode === 'host') publishCoopSnap(rawDt);
  WG.raf = requestAnimationFrame(waneesLoop);
}
function isSolid(ch){ return ch === '#' || ch === 'b' || ch === '?' || ch === '=' || ch === 'M' || ch === 'u'; }
function getTileAt(px, py){
  const gx = Math.floor(px / TILE), gy = Math.floor(py / TILE);
  if (gx < 0 || gx >= LEVEL_W || gy < 0 || gy >= LEVEL_H) return null;
  return WG.level[gy][gx];
}
function tileAtPixel(px, py){
  const ch = getTileAt(px, py);
  return ch !== null && isSolid(ch);
}
function moveAxis(obj, ax, delta){
  if (delta === 0) return { hit: false };
  let hit = false;
  const sign = delta > 0 ? 1 : -1;
  const remaining = Math.abs(delta);
  const STEP = 1;
  let moved = 0;
  while (moved < remaining){
    const step = Math.min(STEP, remaining - moved);
    obj[ax] += step * sign;
    moved += step;
    if (collidesWithTiles(obj)) {
      obj[ax] -= step * sign;
      hit = true;
      break;
    }
  }
  return { hit };
}
function collidesWithTiles(obj){
  const left = obj.x;
  const right = obj.x + obj.w - 1;
  const top = obj.y;
  const bot = obj.y + obj.h - 1;
  const gxL = Math.floor(left / TILE), gxR = Math.floor(right / TILE);
  const gyT = Math.floor(top / TILE), gyB = Math.floor(bot / TILE);
  for (let gy = gyT; gy <= gyB; gy++){
    for (let gx = gxL; gx <= gxR; gx++){
      if (gx < 0 || gx >= LEVEL_W || gy < 0 || gy >= LEVEL_H) continue;
      const ch = WG.level[gy][gx];
      if (isSolid(ch)) return true;
    }
  }
  return false;
}
function poke(gx, gy){
  if (gx < 0 || gx >= LEVEL_W || gy < 0 || gy >= LEVEL_H) return null;
  return WG.level[gy][gx];
}
function setTile(gx, gy, ch){
  if (gx < 0 || gx >= LEVEL_W || gy < 0 || gy >= LEVEL_H) return;
  WG.level[gy][gx] = ch;
}
function updateWanees(dt){
  WG.timeAccum += dt / 60;
  if (WG.timeAccum >= 1){
    WG.timeAccum = 0;
    WG.timeLeft = Math.max(0, WG.timeLeft - 1);
    if (WG.timeLeft === 0){ loseLife('time'); return; }
  }
  // Player updates — loop both players in coop, each with its own inputs.
  updatePlayer(dt, WG.player, WG.inputs);
  if (WG.player2) updatePlayer(dt, WG.player2, WG.inputs2);
  if (WG.state !== 'running') return;
  WG.enemies.forEach(e => updateEnemy(e, dt));
  // Enemy collisions per player
  const livePlayers = alivePlayers();
  for (const e of WG.enemies){
    if (!e.alive) continue;
    for (const pp of livePlayers){
      if (!e.alive) break;
      if (!rectsOverlap(pp, e)) continue;
      const fromAbove = pp.vy > 0 && (pp.y + pp.h - pp.vy * dt) <= e.y + 4;
      if (fromAbove || pp.starTimer > 0){
        e.alive = false;
        if (fromAbove) {
          pp.vy = -3.6;
          WG.stompCombo++;
          WG.stompComboTimer = 36;
        }
        const bonus = WG.stompCombo > 1 ? Math.min(800, 100 * WG.stompCombo) : 100;
        WG.score += bonus;
        wnSnd('stomp');
        spawnPoof(e.x + e.w/2, e.y);
        if (WG.stompCombo >= 3) spawnSparkle(e.x + e.w/2, e.y - 4);
        if (!WG._gk) WG._gk = { shake: new GameKit.Shake(), stop: new GameKit.HitStop() };
        WG._gk.shake.kick(0.15 + Math.min(0.35, WG.stompCombo * 0.08));
        WG._gk.stop.hit(Math.min(5, 2 + WG.stompCombo));
      } else if (pp.invincible <= 0){
        loseLife('enemy', pp);
        return;
      }
    }
  }
  WG.items.forEach(it => updateItem(it, dt));
  for (const it of WG.items){
    if (!it.alive) continue;
    for (const pp of livePlayers){
      if (!it.alive) break;
      if (!rectsOverlap(pp, it)) continue;
      it.alive = false;
      if (it.kind === 'mushroom'){
        // Extra heart goes to the picking player in coop; in single it
        // falls back to the shared lives pool.
        if (WG.coopMode){ pp.lives = Math.min(WG.suhaMode ? 6 : 5, pp.lives + 1); }
        else { WG.lives += WG.suhaMode ? 2 : 1; }
        WG.score += 200;
        spawnSparkle(it.x + it.w/2, it.y + it.h/2);
        wnSnd('coin');
        updateHud();
      } else if (it.kind === 'star'){
        pp.starTimer = WG.suhaMode ? 600 : 360;
        WG.score += 300;
        spawnSparkle(it.x + it.w/2, it.y + it.h/2);
        wnSnd('coin');
        updateHud();
      } else if (it.kind === 'fire'){
        // In coop only P1 has the fire button, so route Lulu's pickup to him.
        const owner = (WG.coopMode && pp.kind === 'lulu') ? WG.player : pp;
        owner.fireCharges = Math.min(99, (owner.fireCharges||0) + 8);
        WG.score += 400;
        spawnSparkle(it.x + it.w/2, it.y + it.h/2);
        spawnSparkle(it.x + it.w/2 - 4, it.y + it.h/2 + 2);
        spawnSparkle(it.x + it.w/2 + 4, it.y + it.h/2 + 2);
        wnSnd('coin');
        try { showToast && showToast('🔥 فطر النار! +٨ قذائف لونيس', '#ff8838'); } catch(e){}
        syncFireBtn();
        updateHud();
      }
    }
  }
  WG.items = WG.items.filter(it => it.alive);
  // ===== Fireballs =====
  updateFireballs(dt);
  WG.popBlocks.forEach(b => { b.t -= dt; });
  WG.popBlocks = WG.popBlocks.filter(b => b.t > 0);
  for (const c of WG.coins){
    if (c.collected) continue;
    c.phase += dt * 0.18;
    for (const pp of livePlayers){
      if (rectsOverlap(pp, c)){
        c.collected = true;
        WG.coinsCollected++;
        WG.score += 50;
        wnSnd('coin');
        spawnSparkle(c.x + c.w/2, c.y + c.h/2);
        break;
      }
    }
  }
  // ===== Revive stars (coop): alive player collects 3 → ghost respawns =====
  if (WG.coopMode && WG.reviveStars && WG.reviveStars.length){
    for (const rs of WG.reviveStars){
      if (rs.taken) continue;
      rs.phase = (rs.phase || 0) + dt * 0.15;
      for (const pp of livePlayers){
        if (rectsOverlap(pp, rs)){
          rs.taken = true;
          spawnSparkle(rs.x + rs.w/2, rs.y + rs.h/2);
          spawnSparkle(rs.x + rs.w/2 - 4, rs.y + rs.h/2 - 4);
          spawnSparkle(rs.x + rs.w/2 + 4, rs.y + rs.h/2 - 4);
          wnSnd('coin');
          // If all stars for this ghost are taken → respawn
          const ghost = allPlayers().find(q => q.ghost && q.id === rs.forId);
          const remaining = WG.reviveStars.filter(s => s.forId === rs.forId && !s.taken).length;
          if (ghost && remaining === 0){
            respawnGhost(ghost, pp);
          }
          break;
        }
      }
    }
    WG.reviveStars = WG.reviveStars.filter(s => !s.taken);
  }
  WG.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.18 * dt; p.life -= dt; });
  WG.particles = WG.particles.filter(p => p.life > 0);
  // Flag — any alive player reaching it wins
  if (WG.flag){
    for (const pp of livePlayers){
      if (pp.x + pp.w >= WG.flag.x){ onWin(); return; }
    }
  }
  // Pit checks per player (each falls independently)
  for (const pp of livePlayers){
    if (pp.y > LEVEL_H * TILE + 32){ loseLife('pit', pp); return; }
  }
  for (const pp of allPlayers()){
    if (pp.invincible > 0) pp.invincible -= dt;
  }
  // Camera — midpoint of alive players, with tether (catch-up when too far)
  let camAnchor;
  if (WG.coopMode && WG.player2){
    const a = WG.player, b = WG.player2;
    // Tether: if more than 7 tiles apart, drag the trailing player forward
    const TETHER = 7 * TILE;
    const dx = b.x - a.x;
    if (Math.abs(dx) > TETHER){
      const over = Math.abs(dx) - TETHER;
      const pull = Math.min(over * 0.04, 1.5);
      if (dx > 0){ a.x += pull; } else { b.x += pull; }
    }
    camAnchor = (a.x + b.x) / 2;
  } else {
    camAnchor = WG.player.x;
  }
  const targetCam = camAnchor - WG.W * 0.4;
  WG.camera.x += (targetCam - WG.camera.x) * 0.12 * dt;
  const camMax = LEVEL_W * TILE - WG.W;
  WG.camera.x = Math.max(0, Math.min(camMax, WG.camera.x));
}
// ===== Ghost / revive helpers =====
function makeGhost(pp){
  pp.ghost = true;
  pp.vx = 0; pp.vy = 0;
  pp.bob = 0;
  // Spawn 3 revive stars near the alive partner
  const alive = allPlayers().find(q => !q.ghost && q !== pp);
  if (!alive) return; // no one to collect — handled in loseLife
  const base = alive.x;
  for (let i = 0; i < 3; i++){
    const ox = (i - 1) * 32 + (Math.random()*8 - 4);
    WG.reviveStars.push({
      x: base + ox, y: alive.y - 24 - i*4,
      w: 12, h: 12, taken: false, forId: pp.id, phase: i * 0.7
    });
  }
  try { showToast && showToast('⭐ اجمع ٣ نجوم لإحياء ' + (pp.kind==='lulu'?'لُولُو':'ونيس'), '#ffd200'); } catch(e){}
}
function respawnGhost(ghost, near){
  ghost.ghost = false;
  ghost.lives = 3;
  ghost.x = near.x + (near.dir > 0 ? -18 : 18);
  ghost.y = near.y - 8;
  ghost.vx = 0; ghost.vy = 0;
  ghost.invincible = 120;
  spawnSparkle(ghost.x + ghost.w/2, ghost.y + ghost.h/2);
  spawnSparkle(ghost.x + ghost.w/2 - 6, ghost.y + ghost.h/2 + 2);
  spawnSparkle(ghost.x + ghost.w/2 + 6, ghost.y + ghost.h/2 + 2);
  wnSnd('coin');
  try { showToast && showToast('💕 ' + (ghost.kind==='lulu'?'لُولُو':'ونيس') + ' عادت للحياة!', '#ff66aa'); } catch(e){}
  updateHud();
}
function rectsOverlap(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function updatePlayer(dt, p, inputs){
  p = p || WG.player;
  inputs = inputs || WG.inputs;
  if (p.ghost){ // ghost floats with a gentle bob; no input
    p.bob = (p.bob || 0) + dt * 0.08;
    p.y += Math.sin(p.bob) * 0.2;
    return;
  }
  let targetVx = 0;
  // Keyboard arrows give discrete max-speed input; touch joystick gives
  // analog 0..1 magnitude (dead-zoned in the input handler).
  if (inputs.left) targetVx = -WG.PLAYER_SPEED;
  else if (inputs.right) targetVx = WG.PLAYER_SPEED;
  else if (Math.abs(inputs.analogX) > 0.0001) targetVx = inputs.analogX * WG.PLAYER_SPEED;
  p.vx += (targetVx - p.vx) * 0.25 * dt;
  if (Math.abs(p.vx) < 0.05 && targetVx === 0) p.vx = 0;
  if (p.vx > 0.1) p.dir = 1;
  else if (p.vx < -0.1) p.dir = -1;
  // ===== Jump feel: buffer + coyote + soft variable cut =====
  if (p.onGround) p.coyote = 6; else p.coyote = Math.max(0, p.coyote - dt);
  if (inputs.jumpJustPressed) p.jumpBuffer = 7;
  p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  const wantsJump = p.jumpBuffer > 0 || inputs.jumpHeld;
  if (wantsJump && (p.onGround || p.coyote > 0)){
    p.vy = WG.JUMP_VEL;
    p.onGround = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    p.jumpCut = false;
    wnSnd('jump');
  }
  if (!inputs.jumpHeld && p.vy < -2.8 && !p.jumpCut){
    p.vy *= 0.55;
    p.jumpCut = true;
  }
  p.vy = Math.min(WG.MAX_FALL, p.vy + WG.GRAV * dt);
  const hX = moveAxis(p, 'x', p.vx * dt);
  if (hX.hit) p.vx = 0;
  const wasAirborne = !p.onGround;
  const fallSpeed = p.vy;
  p.onGround = false;
  const hY = moveAxis(p, 'y', p.vy * dt);
  if (hY.hit){
    if (p.vy > 0) { p.onGround = true; if (WG.stompCombo > 0 && WG.stompComboTimer <= 0) WG.stompCombo = 0; }
    else if (p.vy < 0){
      const headGx = Math.floor((p.x + p.w/2) / TILE);
      const headGy = Math.floor((p.y - 1) / TILE);
      const ch = poke(headGx, headGy);
      if (ch === '?'){
        setTile(headGx, headGy, 'u');
        spawnCoinPop(headGx * TILE + TILE/2, headGy * TILE);
        WG.popBlocks.push({ gx: headGx, gy: headGy, t: 14, ch: 'u' });
        WG.score += 50;
        WG.coinsCollected++;
        wnSnd('coin');
        updateHud();
      } else if (ch === 'M'){
        setTile(headGx, headGy, 'u');
        WG.popBlocks.push({ gx: headGx, gy: headGy, t: 14, ch: 'u' });
        WG.items.push({ x: headGx*TILE+2, y: headGy*TILE - 14, w:12, h:14, vx:0.9, vy:-1.5, kind:'mushroom', alive:true, onGround:false, emerging:18 });
        wnSnd('block');
      } else if (ch === 'N'){
        setTile(headGx, headGy, 'u');
        WG.popBlocks.push({ gx: headGx, gy: headGy, t: 14, ch: 'u' });
        WG.items.push({ x: headGx*TILE+2, y: headGy*TILE - 14, w:12, h:14, vx:0, vy:-1.5, kind:'fire', alive:true, onGround:false, emerging:18, bob:0 });
        wnSnd('block');
      } else if (ch === 'b'){
        if (p.starTimer > 0){
          setTile(headGx, headGy, ' ');
          spawnBrickShards(headGx * TILE + TILE/2, headGy * TILE + TILE/2);
          WG.score += 30;
          wnSnd('block');
        } else {
          WG.popBlocks.push({ gx: headGx, gy: headGy, t: 10, ch: 'b' });
          wnSnd('block');
        }
      }
    }
    p.vy = 0;
  }
  if (p.onGround && Math.abs(p.vx) > 0.1) p.walkPhase += dt * 0.25;
  // Landing dust puff after a real fall
  if (wasAirborne && p.onGround && fallSpeed > 3){
    for (let i = 0; i < 6; i++){
      WG.particles.push({
        x: p.x + p.w/2 + (Math.random()*10 - 5), y: p.y + p.h - 1,
        vx: (Math.random() - 0.5) * 1.6, vy: -Math.random() * 0.8,
        life: 14 + Math.random() * 8, color: 'rgba(220,210,190,0.8)'
      });
    }
  }
  // Star power rainbow trail
  if (p.starTimer > 0 && Math.abs(p.vx) > 0.3){
    const hue = (performance.now() / 4) % 360;
    WG.particles.push({
      x: p.x + p.w/2 + (Math.random()*4 - 2), y: p.y + p.h/2 + (Math.random()*8 - 4),
      vx: -p.vx * 0.15, vy: (Math.random() - 0.5) * 0.5,
      life: 16, color: 'hsl(' + Math.floor(hue) + ',95%,65%)'
    });
  }
  if (p.starTimer > 0) p.starTimer -= dt;
  if (WG.stompComboTimer > 0) WG.stompComboTimer -= dt;
  // Fire shot
  if (p.fireCd > 0) p.fireCd -= dt;
  if (inputs.fireTap){
    inputs.fireTap = false;
    if (p.fireCharges > 0 && p.fireCd <= 0){
      shootFireball(p);
      p.fireCharges--;
      p.fireCd = 9; // ~150ms cooldown
      syncFireBtn();
    }
  }
}
function shootFireball(p){
  const dir = p.dir || 1;
  WG.fireballs.push({
    x: p.x + p.w/2 + dir*8, y: p.y + 3,
    vx: dir * 3.4, vy: -1.6,
    r: 4, life: 110, bounces: 0
  });
  // muzzle flash
  for (let i = 0; i < 5; i++){
    WG.particles.push({
      x: p.x + p.w/2 + dir*10, y: p.y + 4,
      vx: dir * (0.5 + Math.random()) + (Math.random()-0.5)*0.6,
      vy: -0.4 - Math.random()*0.6,
      life: 14, color: i%2 ? '#ffd24a' : '#ff8838'
    });
  }
  wnSnd('jump');
}
function updateFireballs(dt){
  if (!WG.fireballs || !WG.fireballs.length) return;
  for (const fb of WG.fireballs){
    fb.life -= dt;
    if (fb.life <= 0){ fb.dead = true; continue; }
    // gravity + integrate x
    fb.vy = Math.min(WG.MAX_FALL, fb.vy + WG.GRAV * 0.8 * dt);
    // X axis: collide with walls
    let nx = fb.x + fb.vx * dt;
    let hitWall = false;
    const probe = { x: nx - fb.r, y: fb.y - fb.r, w: fb.r*2, h: fb.r*2, vx: fb.vx };
    if (solidAt(nx + (fb.vx > 0 ? fb.r : -fb.r), fb.y)){ hitWall = true; }
    if (hitWall){ fb.dead = true; continue; }
    fb.x = nx;
    // Y axis: bounce on ground
    let ny = fb.y + fb.vy * dt;
    if (fb.vy > 0 && solidAt(fb.x, ny + fb.r)){
      // snap to top of that tile
      ny = Math.floor((ny + fb.r) / TILE) * TILE - fb.r - 0.01;
      fb.y = ny;
      fb.vy = -3.2;
      fb.bounces++;
      if (fb.bounces >= 3){ fb.dead = true; continue; }
    } else {
      fb.y = ny;
    }
    // Trail particle
    if (Math.random() < 0.6){
      WG.particles.push({
        x: fb.x + (Math.random()-0.5)*2, y: fb.y + (Math.random()-0.5)*2,
        vx: -fb.vx*0.15, vy: -0.2 - Math.random()*0.3,
        life: 18, color: Math.random() < 0.5 ? '#ffd24a' : '#ff8838'
      });
    }
    // Enemy collision
    for (const e of WG.enemies){
      if (!e.alive) continue;
      if (fb.x + fb.r > e.x && fb.x - fb.r < e.x + e.w &&
          fb.y + fb.r > e.y && fb.y - fb.r < e.y + e.h){
        e.alive = false;
        WG.score += 100;
        spawnPoof(e.x + e.w/2, e.y + e.h/2);
        for (let i=0;i<8;i++) WG.particles.push({
          x: e.x+e.w/2, y: e.y+e.h/2,
          vx:(Math.random()-0.5)*3, vy:-Math.random()*3-0.5,
          life:24, color: i%2?'#ffd24a':'#ff5028'
        });
        wnSnd('stomp');
        fb.dead = true;
        break;
      }
    }
  }
  WG.fireballs = WG.fireballs.filter(fb => !fb.dead);
}
function solidAt(px, py){
  const gx = Math.floor(px / TILE);
  const gy = Math.floor(py / TILE);
  if (gx < 0 || gy < 0 || gy >= LEVEL_H || gx >= LEVEL_W) return false;
  const row = WG.level[gy]; if (!row) return false;
  const c = row[gx];
  return c === '#' || c === 'b' || c === '?' || c === 'M' || c === 'N' || c === 'u' || c === '=';
}
function spawnBrickShards(x, y){
  for (let i = 0; i < 8; i++){
    const a = Math.random() * Math.PI * 2;
    const sp = 1.2 + Math.random() * 1.5;
    WG.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 2, life: 30, color:'#c84a1a' });
  }
}
function updateItem(it, dt){
  if (!it.alive) return;
  if (it.emerging > 0){ it.emerging -= dt; it.y += -0.4 * dt; if (it.emerging <= 0) it.vy = 0; return; }
  it.vy = Math.min(WG.MAX_FALL, it.vy + WG.GRAV * dt);
  const hX = moveAxis(it, 'x', it.vx * dt);
  if (hX.hit) it.vx *= -1;
  const hY = moveAxis(it, 'y', it.vy * dt);
  if (hY.hit){
    if (it.vy > 0){ it.onGround = true; if (it.kind === 'star') it.vy = -3.6; else it.vy = 0; }
    else it.vy = 0;
  }
  if (it.y > LEVEL_H * TILE + 32) it.alive = false;
}
function drawItem(ctx, it){
  if (!it.alive) return;
  const x = Math.round(it.x), y = Math.round(it.y);
  if (it.kind === 'mushroom'){
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(x, y, 12, 8);
    ctx.fillRect(x+1, y-2, 10, 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x+2, y+2, 3, 3);
    ctx.fillRect(x+7, y+2, 3, 3);
    ctx.fillStyle = '#f0c090';
    ctx.fillRect(x+2, y+8, 8, 6);
    ctx.fillStyle = '#222';
    ctx.fillRect(x+4, y+10, 1, 2);
    ctx.fillRect(x+7, y+10, 1, 2);
  } else if (it.kind === 'star'){
    const t = (Date.now() / 80) % 6;
    const colors = ['#ffd200','#fff','#ff8800','#ffd200','#fff','#ff8800'];
    ctx.fillStyle = colors[Math.floor(t)];
    ctx.fillRect(x+5, y, 2, 14);
    ctx.fillRect(x, y+5, 12, 4);
    ctx.fillRect(x+2, y+2, 8, 10);
    ctx.fillStyle = '#000';
    ctx.fillRect(x+3, y+5, 2, 2);
    ctx.fillRect(x+7, y+5, 2, 2);
  } else if (it.kind === 'fire'){
    // Fire Flower mushroom: orange-red dome over a yellow stem, eyes,
    // flicker on the cap to hint at its power.
    it.bob = (it.bob || 0) + 0.2;
    const flick = Math.floor(Date.now() / 120) % 2;
    // cap
    ctx.fillStyle = '#ff5028';
    ctx.fillRect(x, y, 12, 8);
    ctx.fillRect(x+1, y-2, 10, 2);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(x+2, y+2, 3, 3);
    ctx.fillRect(x+7, y+2, 3, 3);
    ctx.fillRect(x+5, y+5, 2, 2);
    // flame flicker on the cap
    ctx.fillStyle = flick ? '#fff0a0' : '#ffe066';
    ctx.fillRect(x+5, y-3, 2, 2);
    ctx.fillRect(x+4, y-2, 4, 1);
    // stem + face
    ctx.fillStyle = '#fff0a0';
    ctx.fillRect(x+2, y+8, 8, 6);
    ctx.fillStyle = '#222';
    ctx.fillRect(x+4, y+10, 1, 2);
    ctx.fillRect(x+7, y+10, 1, 2);
  }
}
function drawFireballs(ctx){
  if (!WG.fireballs || !WG.fireballs.length) return;
  for (const fb of WG.fireballs){
    const x = Math.round(fb.x), y = Math.round(fb.y);
    const flick = Math.floor(Date.now() / 50) % 2;
    // outer glow
    ctx.fillStyle = flick ? '#ffb420' : '#ff8038';
    ctx.fillRect(x-4, y-3, 8, 6);
    ctx.fillRect(x-3, y-4, 6, 8);
    // hot core
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(x-2, y-2, 4, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x-1, y-1, 2, 2);
  }
}
function updateEnemy(e, dt){
  e.walkPhase += dt * 0.12;
  e.vy = Math.min(WG.MAX_FALL, e.vy + WG.GRAV * dt);
  const hX = moveAxis(e, 'x', e.vx * dt);
  if (hX.hit) { e.vx *= -1; e.dir *= -1; }
  const aheadX = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
  const belowY = e.y + e.h + 2;
  if (!tileAtPixel(aheadX, belowY) && e.vy === 0){
    e.vx *= -1; e.dir *= -1;
  }
  const hY = moveAxis(e, 'y', e.vy * dt);
  if (hY.hit) e.vy = 0;
}
function loseLife(reason, who){
  WG.stompCombo = 0; WG.stompComboTimer = 0;
  wnSnd(reason === 'enemy' ? 'hurt' : 'death');
  // ===== Coop branch: each player has own hearts; ghost on zero =====
  if (WG.coopMode && who){
    who.lives = Math.max(0, who.lives - 1);
    if (who.lives > 0){
      // Pit damage in coop: respawn at partner instead of reloading the level
      const partner = allPlayers().find(q => q !== who && !q.ghost);
      if (reason === 'pit' && partner){
        who.x = partner.x + (partner.dir > 0 ? -18 : 18);
        who.y = partner.y - 8;
        who.vx = 0; who.vy = 0;
      }
      who.invincible = WG.suhaMode ? 160 : 80;
      who.starTimer = 0;
      updateHud();
      return;
    }
    // Hearts ran out → become a ghost. Other player can revive via stars.
    makeGhost(who);
    // If both ghosts (no one to collect stars) → game over
    if (allPlayers().every(q => q.ghost)){
      onGameOver();
      return;
    }
    updateHud();
    return;
  }
  // ===== Single-player branch (original behavior) =====
  WG.lives--;
  updateHud();
  if (WG.lives <= 0){
    onGameOver();
  } else {
    WG.player.invincible = WG.suhaMode ? 160 : 80;
    WG.player.starTimer = 0;
    const collectedCoins = WG.coinsCollected;
    const collectedScore = WG.score;
    const collected = WG.coins.filter(c => c.collected);
    loadLevel();
    WG.coinsCollected = collectedCoins;
    WG.score = collectedScore;
    WG.coins.forEach(c => {
      const wasCollected = collected.some(cc => Math.abs(cc.x - c.x) < 2 && Math.abs(cc.y - c.y) < 2);
      if (wasCollected) c.collected = true;
    });
    WG.timeLeft = Math.max(WG.timeLeft, WG.suhaMode ? 90 : 60);
  }
}
function onWin(){
  WG.state = 'win';
  cancelAnimationFrame(WG.raf);
  WG.score += WG.timeLeft * 10;
  wnSnd('win');
  const clearedIdx = WG.currentLevel;          // 0..TOTAL-1 — the level just cleared
  const isLast = clearedIdx >= TOTAL_LEVELS - 1;
  if (!isLast){
    WG.currentLevel++;
    // Award a small breather for clearing
    if (WG.coopMode && WG.player2){
      // Top up both players a bit instead of touching the shared pool
      WG.player.lives  = Math.min(5, WG.player.lives  + 1);
      WG.player2.lives = Math.min(5, WG.player2.lives + 1);
    } else {
      WG.lives = Math.min(WG.lives + 1, WG.suhaMode ? 9 : 6);
    }
    WG.timeLeft = WG.suhaMode ? 420 : 300;
    try { if (typeof showToast === 'function') showToast('🎉 المرحلة ' + (WG.currentLevel) + ' خلصت! المرحلة ' + (WG.currentLevel + 1) + '/' + TOTAL_LEVELS, '#ffd200'); } catch(e){}
    loadLevel();
    if (WG.suhaMode && WG.player){ WG.player.invincible = 120; WG.player.starTimer = 120; }
    updateHud();
    // The find-Lulu after-level dialogues don't fit when she's already playing
    // — skip straight to the next level in coop. The cinema scene at the end
    // still plays as the journey's payoff.
    if (WG.coopMode) { _startGameplayLoop(); return; }
    showDialogue('after' + (clearedIdx + 1), _startGameplayLoop);
    return;
  }
  saveProgress(true);
  // Final dialogue → cinematic reunion → win screen.
  showDialogue('final', () => showCinema(() => { showOverOverlay('win'); if (COOP.mode) stopCoop(); }));
}
function onGameOver(){
  WG.state = 'dead';
  cancelAnimationFrame(WG.raf);
  saveProgress(false);
  showOverOverlay('lose');
  if (COOP.mode) stopCoop();
}
function saveProgress(won){
  const final = Math.floor(WG.score);
  const isRecord = final > WG.best;
  if (isRecord) WG.best = final;
  try {
    if (typeof updateProfileStat === 'function'){
      updateProfileStat('wanees', (s) => {
        s.games = (s.games || 0) + 1;
        s.coinsCollected = (s.coinsCollected || 0) + WG.coinsCollected;
        if (won) s.levelsCleared = (s.levelsCleared || 0) + 1;
        const reached = (WG.currentLevel || 0) + 1;
        if (reached > (s.bestLevel || 0)) s.bestLevel = reached;
        if (final > (s.bestScore || 0)) s.bestScore = final;
      });
    }
  } catch(e){}
  try { if (typeof renderBadges === 'function') renderBadges(); } catch(e){}
  try { if (typeof waneesLeaderboardSubmit === 'function') waneesLeaderboardSubmit(final); } catch(e){}
}
function showOverOverlay(kind){
  const emoji = kind === 'win' ? '👑' : '💀';
  const title = kind === 'win' ? ('🎉 أنهيت كل ' + TOTAL_LEVELS + ' مراحل!') : '💀 انتهت اللعبة';
  document.getElementById('wnOverEmoji').textContent = emoji;
  document.getElementById('wnOverTitle').textContent = title;
  document.getElementById('wnFinalScore').textContent = Math.floor(WG.score);
  document.getElementById('wnFinalCoins').textContent = WG.coinsCollected;
  document.getElementById('wnFinalBest').textContent = WG.best;
  const isRec = Math.floor(WG.score) >= WG.best && WG.score > 0;
  document.getElementById('wnNewRec').style.display = isRec ? 'block' : 'none';
  document.getElementById('waneesOverOverlay').style.display = 'flex';
  updateHud();
}
function spawnPoof(x, y){
  for (let i = 0; i < 10; i++){
    const a = Math.random() * Math.PI * 2;
    const sp = 0.8 + Math.random() * 1.2;
    WG.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 1, life: 28, color:'#a07050' });
  }
}
function spawnSparkle(x, y){
  for (let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    WG.particles.push({ x, y, vx: Math.cos(a)*1.5, vy: Math.sin(a)*1.5, life: 22, color:'#ffd200' });
  }
}
function spawnCoinPop(x, y){
  for (let i = 0; i < 4; i++){
    WG.particles.push({ x, y, vx:(Math.random()-0.5)*1.2, vy:-2 - Math.random()*1.5, life:35, color:'#ffd200' });
  }
}
function bindWaneesControls(){
  function isActive(){
    const scr = document.getElementById('waneesScreen');
    return scr && scr.classList.contains('active');
  }
  document.addEventListener('keydown', (e) => {
    if (!isActive()) return;
    let pushed = false;
    if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft'){ if (!WG.inputs.left) pushed = true; WG.inputs.left = true; e.preventDefault(); }
    else if (e.code === 'ArrowRight' || e.key === 'ArrowRight'){ if (!WG.inputs.right) pushed = true; WG.inputs.right = true; e.preventDefault(); }
    else if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.key === ' '){
      if (!WG.inputs.jumpHeld){ WG.inputs.jumpJustPressed = true; pushed = true; }
      WG.inputs.jumpHeld = true; WG.inputs.jump = true; e.preventDefault();
    }
    // P2 keyboard (coop, local only — online guest uses arrows/space)
    else if (WG.coopMode && WG.coopRole !== 'guest'){
      if (e.code === 'KeyA'){ WG.inputs2.left = true; e.preventDefault(); }
      else if (e.code === 'KeyD'){ WG.inputs2.right = true; e.preventDefault(); }
      else if (e.code === 'KeyW' || e.code === 'ShiftLeft'){
        if (!WG.inputs2.jumpHeld) WG.inputs2.jumpJustPressed = true;
        WG.inputs2.jumpHeld = true; e.preventDefault();
      }
    }
    if (pushed) coopFlushNow();
  });
  document.addEventListener('keyup', (e) => {
    if (!isActive()) return;
    let pushed = false;
    if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft'){ WG.inputs.left = false; e.preventDefault(); pushed = true; }
    else if (e.code === 'ArrowRight' || e.key === 'ArrowRight'){ WG.inputs.right = false; e.preventDefault(); pushed = true; }
    else if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.key === ' '){
      WG.inputs.jumpHeld = false; WG.inputs.jump = false; e.preventDefault(); pushed = true;
    }
    else if (WG.coopMode && WG.coopRole !== 'guest'){
      if (e.code === 'KeyA'){ WG.inputs2.left = false; e.preventDefault(); }
      else if (e.code === 'KeyD'){ WG.inputs2.right = false; e.preventDefault(); }
      else if (e.code === 'KeyW' || e.code === 'ShiftLeft'){ WG.inputs2.jumpHeld = false; e.preventDefault(); }
    }
    if (pushed) coopFlushNow();
  });
  window.addEventListener('blur', () => {
    if (isActive()){ WG.inputs.left = false; WG.inputs.right = false; WG.inputs.jumpHeld = false; WG.inputs.analogX = 0;
      const ja = document.getElementById('wnJoyArea'); const jb = document.getElementById('wnJoyBase');
      const jt = document.getElementById('wnJoyThumb');
      if (ja) ja.classList.remove('active'); if (jb) jb.classList.remove('on');
      if (jt) jt.style.transform = 'translate(-50%,-50%)'; }
  });
}
function bindWaneesButtons(){
  // ===== Full-arena floating analog joystick (left half of the screen) =====
  // The joystick base + thumb appear wherever the player's left thumb first
  // touches in the left tap zone; the right tap zone is the jump button —
  // anywhere on that whole half of the screen.
  const tapL  = document.getElementById('wnTapLeft');
  const tapR  = document.getElementById('wnTapRight');
  const base  = document.getElementById('wnJoyBase');
  const thumb = document.getElementById('wnJoyThumb');
  const joyHint = document.getElementById('wnJoyHintFloating');
  if (!tapL || !tapR || !base || !thumb) return;
  const RADIUS = 56, DEAD = 0.12;
  // Joystick state
  let joyId = null, joyCx = 0, joyCy = 0;
  // Jump state — supports multi-touch (multiple jump taps tracked independently)
  const jumpIds = new Set();
  function setThumbAt(dx, dy){
    const dist = Math.hypot(dx, dy);
    const clamped = dist > RADIUS ? RADIUS / dist : 1;
    const tx = dx * clamped, ty = dy * clamped;
    thumb.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
    const nx = tx / RADIUS;
    const ax = Math.abs(nx);
    if (ax < DEAD){ WG.inputs.analogX = 0; return; }
    WG.inputs.analogX = (nx < 0 ? -1 : 1) * Math.min(1, (ax - DEAD) / (1 - DEAD));
  }
  function placeBaseAt(clientX, clientY){
    base.style.left = clientX + 'px';
    base.style.top  = clientY + 'px';
  }
  // ---- Joystick (left tap zone) ----
  function joyStart(p, ev){
    if (joyId !== null) return false;
    joyId = p.identifier != null ? p.identifier : (p.pointerId != null ? p.pointerId : 1);
    joyCx = p.clientX; joyCy = p.clientY;
    placeBaseAt(joyCx, joyCy);
    base.classList.add('on');
    tapL.classList.add('active');
    if (joyHint) joyHint.classList.add('hidden');
    thumb.style.transform = 'translate(-50%,-50%)';
    if (ev) ev.preventDefault();
    return true;
  }
  function joyMove(p, ev){
    if (joyId === null) return;
    setThumbAt(p.clientX - joyCx, p.clientY - joyCy);
    if (ev) ev.preventDefault();
  }
  function joyEnd(){
    joyId = null;
    WG.inputs.analogX = 0;
    base.classList.remove('on');
    tapL.classList.remove('active');
    thumb.style.transform = 'translate(-50%,-50%)';
  }
  // ---- Jump (right tap zone) ----
  function jumpPress(id, ev){
    const fresh = jumpIds.size === 0;
    jumpIds.add(id);
    if (fresh) WG.inputs.jumpJustPressed = true;
    WG.inputs.jumpHeld = true;
    WG.inputs.jump = true;
    tapR.classList.add('held');
    if (ev) ev.preventDefault();
    coopFlushNow(); // push press edge to network immediately if guest
  }
  function jumpRelease(id){
    jumpIds.delete(id);
    if (jumpIds.size === 0){
      WG.inputs.jumpHeld = false;
      WG.inputs.jump = false;
      tapR.classList.remove('held');
      coopFlushNow();
    }
  }
  // ===== Wire up touch + pointer events on both zones =====
  // Joystick — touch
  tapL.addEventListener('touchstart', ev => {
    for (const t of ev.changedTouches){ if (joyStart(t, ev)) break; }
  }, { passive:false });
  tapL.addEventListener('touchmove', ev => {
    if (joyId === null) return;
    for (const t of ev.changedTouches){ if (t.identifier === joyId){ joyMove(t, ev); break; } }
  }, { passive:false });
  function tapLEnd(ev){
    if (joyId === null) return;
    for (const t of ev.changedTouches){ if (t.identifier === joyId){ joyEnd(); break; } }
  }
  tapL.addEventListener('touchend',    tapLEnd);
  tapL.addEventListener('touchcancel', tapLEnd);
  // Joystick — pointer (desktop / pen)
  tapL.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'touch') return;
    joyStart({ identifier:ev.pointerId, clientX:ev.clientX, clientY:ev.clientY, pointerId:ev.pointerId }, ev);
    try { tapL.setPointerCapture(ev.pointerId); } catch(e){}
  });
  tapL.addEventListener('pointermove', ev => {
    if (ev.pointerType === 'touch') return;
    if (joyId !== ev.pointerId) return;
    joyMove({ clientX:ev.clientX, clientY:ev.clientY }, ev);
  });
  function tapLPtrEnd(ev){ if (ev.pointerType === 'touch') return; if (joyId === ev.pointerId) joyEnd(); }
  tapL.addEventListener('pointerup',     tapLPtrEnd);
  tapL.addEventListener('pointercancel', tapLPtrEnd);

  // Jump — touch (independent tracking per finger so the joystick on the
  // other half keeps working)
  tapR.addEventListener('touchstart', ev => {
    for (const t of ev.changedTouches) jumpPress(t.identifier, ev);
  }, { passive:false });
  function tapREnd(ev){
    for (const t of ev.changedTouches) jumpRelease(t.identifier);
  }
  tapR.addEventListener('touchend',    tapREnd);
  tapR.addEventListener('touchcancel', tapREnd);
  // Jump — pointer
  tapR.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'touch') return;
    jumpPress(ev.pointerId, ev);
    try { tapR.setPointerCapture(ev.pointerId); } catch(e){}
  });
  function tapRPtrEnd(ev){ if (ev.pointerType === 'touch') return; jumpRelease(ev.pointerId); }
  tapR.addEventListener('pointerup',     tapRPtrEnd);
  tapR.addEventListener('pointercancel', tapRPtrEnd);

  // ===== Player 2 (لُولُو) joystick + jump — mirrors P1 logic with its own
  // tap zones, joystick visuals, and input object. Active only when the
  // arena has the .coop class; the elements themselves are hidden via CSS
  // outside coop mode so events naturally never fire.
  const tapJ2 = document.getElementById('wnTapP2Joy');
  const tapU2 = document.getElementById('wnTapP2Jump');
  const base2 = document.getElementById('wnJoyBase2');
  const thumb2= document.getElementById('wnJoyThumb2');
  if (tapJ2 && tapU2 && base2 && thumb2){
    let joy2Id = null, joy2Cx = 0, joy2Cy = 0;
    const jump2Ids = new Set();
    function setThumb2At(dx, dy){
      const dist = Math.hypot(dx, dy);
      const clamped = dist > RADIUS ? RADIUS / dist : 1;
      const tx = dx * clamped, ty = dy * clamped;
      thumb2.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`;
      const nx = tx / RADIUS;
      const ax = Math.abs(nx);
      if (ax < DEAD){ WG.inputs2.analogX = 0; return; }
      WG.inputs2.analogX = (nx < 0 ? -1 : 1) * Math.min(1, (ax - DEAD) / (1 - DEAD));
    }
    function joy2Start(p, ev){
      if (joy2Id !== null) return false;
      joy2Id = p.identifier != null ? p.identifier : p.pointerId;
      joy2Cx = p.clientX; joy2Cy = p.clientY;
      base2.style.left = joy2Cx + 'px'; base2.style.top = joy2Cy + 'px';
      base2.classList.add('on');
      thumb2.style.transform = 'translate(-50%,-50%)';
      if (ev) ev.preventDefault();
      return true;
    }
    function joy2Move(p, ev){
      if (joy2Id === null) return;
      setThumb2At(p.clientX - joy2Cx, p.clientY - joy2Cy);
      if (ev) ev.preventDefault();
    }
    function joy2End(){
      joy2Id = null;
      WG.inputs2.analogX = 0;
      base2.classList.remove('on');
      thumb2.style.transform = 'translate(-50%,-50%)';
    }
    function jump2Press(id, ev){
      const fresh = jump2Ids.size === 0;
      jump2Ids.add(id);
      if (fresh) WG.inputs2.jumpJustPressed = true;
      WG.inputs2.jumpHeld = true;
      tapU2.classList.add('held');
      if (ev) ev.preventDefault();
    }
    function jump2Release(id){
      jump2Ids.delete(id);
      if (jump2Ids.size === 0){
        WG.inputs2.jumpHeld = false;
        tapU2.classList.remove('held');
      }
    }
    // Joystick — touch
    tapJ2.addEventListener('touchstart', ev => {
      for (const t of ev.changedTouches){ if (joy2Start(t, ev)) break; }
    }, { passive:false });
    tapJ2.addEventListener('touchmove', ev => {
      if (joy2Id === null) return;
      for (const t of ev.changedTouches){ if (t.identifier === joy2Id){ joy2Move(t, ev); break; } }
    }, { passive:false });
    function tapJ2End(ev){
      if (joy2Id === null) return;
      for (const t of ev.changedTouches){ if (t.identifier === joy2Id){ joy2End(); break; } }
    }
    tapJ2.addEventListener('touchend',    tapJ2End);
    tapJ2.addEventListener('touchcancel', tapJ2End);
    // Joystick — pointer (desktop / pen)
    tapJ2.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'touch') return;
      joy2Start({ identifier:ev.pointerId, clientX:ev.clientX, clientY:ev.clientY, pointerId:ev.pointerId }, ev);
      try { tapJ2.setPointerCapture(ev.pointerId); } catch(e){}
    });
    tapJ2.addEventListener('pointermove', ev => {
      if (ev.pointerType === 'touch') return;
      if (joy2Id !== ev.pointerId) return;
      joy2Move({ clientX:ev.clientX, clientY:ev.clientY }, ev);
    });
    function tapJ2PtrEnd(ev){ if (ev.pointerType === 'touch') return; if (joy2Id === ev.pointerId) joy2End(); }
    tapJ2.addEventListener('pointerup',     tapJ2PtrEnd);
    tapJ2.addEventListener('pointercancel', tapJ2PtrEnd);
    // Jump — touch
    tapU2.addEventListener('touchstart', ev => {
      for (const t of ev.changedTouches) jump2Press(t.identifier, ev);
    }, { passive:false });
    function tapU2End(ev){
      for (const t of ev.changedTouches) jump2Release(t.identifier);
    }
    tapU2.addEventListener('touchend',    tapU2End);
    tapU2.addEventListener('touchcancel', tapU2End);
    // Jump — pointer
    tapU2.addEventListener('pointerdown', ev => {
      if (ev.pointerType === 'touch') return;
      jump2Press(ev.pointerId, ev);
      try { tapU2.setPointerCapture(ev.pointerId); } catch(e){}
    });
    function tapU2PtrEnd(ev){ if (ev.pointerType === 'touch') return; jump2Release(ev.pointerId); }
    tapU2.addEventListener('pointerup',     tapU2PtrEnd);
    tapU2.addEventListener('pointercancel', tapU2PtrEnd);
    // Expose so the blur reset can clear P2 state too
    bindWaneesButtons._joy2End = joy2End;
    bindWaneesButtons._jump2Clear = () => {
      jump2Ids.clear();
      WG.inputs2.jumpHeld = false;
      tapU2.classList.remove('held');
    };
  }

  // Safety: lose all tracking if the window loses focus
  window.addEventListener('blur', () => {
    joyEnd();
    jumpIds.clear();
    WG.inputs.jumpHeld = false; WG.inputs.jump = false;
    tapR.classList.remove('held');
    if (bindWaneesButtons._joy2End) bindWaneesButtons._joy2End();
    if (bindWaneesButtons._jump2Clear) bindWaneesButtons._jump2Clear();
  });
  // ===== Fire Flower trigger =====
  const fireBtn = document.getElementById('wnFireBtn');
  if (fireBtn){
    const fireDown = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      fireBtn.classList.add('pressed');
      WG.inputs.fireTap = true;
      coopFlushNow();
    };
    const fireUp = () => fireBtn.classList.remove('pressed');
    fireBtn.addEventListener('touchstart', fireDown, { passive:false });
    fireBtn.addEventListener('touchend', fireUp);
    fireBtn.addEventListener('touchcancel', fireUp);
    fireBtn.addEventListener('mousedown', fireDown);
    fireBtn.addEventListener('mouseup', fireUp);
    fireBtn.addEventListener('mouseleave', fireUp);
  }
}
// ===== Lock screen / fullscreen =====
// Hides the browser chrome so horizontal joystick drags don't trigger
// the back-swipe gesture or address-bar reveal. Falls back to a
// "soft lock" (overscroll/touch-action) when the Fullscreen API
// isn't available (e.g. iOS Safari outside PWA mode).
let _wnLocked = false, _wnWakeLock = null;
function _wnFsElement(){
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}
async function _wnRequestFs(){
  const el = document.getElementById('waneesScreen') || document.documentElement;
  try {
    if (el.requestFullscreen)            return await el.requestFullscreen({ navigationUI: 'hide' });
    if (el.webkitRequestFullscreen)      return el.webkitRequestFullscreen();
    if (el.webkitRequestFullScreen)      return el.webkitRequestFullScreen();
    if (el.msRequestFullscreen)          return el.msRequestFullscreen();
    throw new Error('no fullscreen api');
  } catch(e){ throw e; }
}
async function _wnExitFs(){
  try {
    if (document.exitFullscreen)         return await document.exitFullscreen();
    if (document.webkitExitFullscreen)   return document.webkitExitFullscreen();
    if (document.msExitFullscreen)       return document.msExitFullscreen();
  } catch(e){}
}
async function _wnAcquireWake(){
  if (!('wakeLock' in navigator)) return;
  try { _wnWakeLock = await navigator.wakeLock.request('screen'); }
  catch(e){ _wnWakeLock = null; }
}
async function _wnReleaseWake(){
  if (_wnWakeLock){ try { await _wnWakeLock.release(); } catch(e){} _wnWakeLock = null; }
}
function syncLockBtn(){
  const btn = document.getElementById('wnLockBtn');
  if (!btn) return;
  btn.textContent = _wnLocked ? '🔓' : '🔒';
  btn.classList.toggle('active', _wnLocked);
  btn.title = _wnLocked ? 'فك القفل' : 'قفل الشاشة';
  document.documentElement.classList.toggle('wn-locked', _wnLocked);
  document.body.classList.toggle('wn-locked', _wnLocked);
}
window.toggleLockScreen = async function(){
  if (_wnLocked){
    if (_wnFsElement()) await _wnExitFs();
    await _wnReleaseWake();
    _wnLocked = false;
  } else {
    let gotFs = false;
    try { await _wnRequestFs(); gotFs = true; } catch(e){
      // Fallback: just toggle the "soft-lock" classes. Still kills
      // overscroll/pull-to-refresh; just doesn't hide browser chrome.
      try { showToast && showToast('قُفلت اللمسات (المتصفح لا يدعم ملء الشاشة)', '#ffb420'); } catch(e2){}
    }
    await _wnAcquireWake();
    _wnLocked = true;
    if (gotFs) { try { showToast && showToast('🔒 الشاشة مقفلة — لمسات الجهاز لن تخرجك من اللعبة', '#3dba7a'); } catch(e){} }
  }
  syncLockBtn();
};
// Keep the button in sync if the user exits fullscreen with the system gesture
document.addEventListener('fullscreenchange', () => {
  // Only react when we're the ones managing lock state
  if (_wnLocked && !_wnFsElement()){
    _wnLocked = false;
    _wnReleaseWake();
    syncLockBtn();
  }
});
document.addEventListener('webkitfullscreenchange', () => {
  if (_wnLocked && !_wnFsElement()){
    _wnLocked = false; _wnReleaseWake(); syncLockBtn();
  }
});
// When the page hides (tab switch), re-acquire the wake lock on return
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _wnLocked && !_wnWakeLock) _wnAcquireWake();
});

function syncFireBtn(){
  const btn = document.getElementById('wnFireBtn');
  if (!btn) return;
  const charges = (WG.player && WG.player.fireCharges) || 0;
  btn.style.display = charges > 0 ? 'flex' : 'none';
  const cnt = document.getElementById('wnFireCount');
  if (cnt) cnt.textContent = charges;
}
const WN_THEMES = [
  // 1: Sunny meadow
  { skyTop:'#5b9bd5', skyBot:'#a0d0f0', hill:'#3b8a4f', cloud:'rgba(255,255,255,0.7)',
    grass:'#2a8a3a', grassHi:'#3b8a4f', dirt:'#7a4b1a', sun:'#fff3b0', night:false },
  // 2: Desert sunset
  { skyTop:'#d4683a', skyBot:'#f5c46a', hill:'#a06038', cloud:'rgba(255,235,205,0.55)',
    grass:'#c89040', grassHi:'#e0ac58', dirt:'#8a5a26', sun:'#ff8c42', night:false },
  // 3: Starry night
  { skyTop:'#0d1033', skyBot:'#2a3268', hill:'#1d2448', cloud:'rgba(205,215,255,0.22)',
    grass:'#46559a', grassHi:'#5a6ab2', dirt:'#272c58', sun:'#e8e8ff', night:true },
  // 4: Castle inferno
  { skyTop:'#1c0a0a', skyBot:'#56221a', hill:'#371410', cloud:'rgba(255,120,60,0.18)',
    grass:'#7a3220', grassHi:'#96412a', dirt:'#3c1812', sun:'#ff5a2a', night:true, lava:true },
  // 5: Forest of Echoes (deep mossy woods)
  { skyTop:'#0a2010', skyBot:'#1a4a2a', hill:'#0e3a1c', cloud:'rgba(180,255,200,0.18)',
    grass:'#2e6a32', grassHi:'#4a9a4e', dirt:'#3a2810', sun:'#88e89a', night:true },
  // 6: Ice Cave (frosty blue)
  { skyTop:'#1a3a5e', skyBot:'#5a7aaa', hill:'#5a8aba', cloud:'rgba(220,240,255,0.55)',
    grass:'#a0d8e8', grassHi:'#cfe8f5', dirt:'#4a6a7a', sun:'#fff0e0', night:false },
  // 7: Underwater Reef (deep blue, coral hints)
  { skyTop:'#08284a', skyBot:'#1a5078', hill:'#0e3a5a', cloud:'rgba(120,200,240,0.3)',
    grass:'#3a7aaa', grassHi:'#6aa0d0', dirt:'#1a3a5a', sun:'#80c0ff', night:false },
  // 8: Cloud Kingdom (sunset, golden)
  { skyTop:'#ff8a5a', skyBot:'#ffd28a', hill:'#ffaa70', cloud:'rgba(255,255,255,0.7)',
    grass:'#ffb0d0', grassHi:'#ffd0e8', dirt:'#a85a8a', sun:'#fff0a0', night:false },
];
function wnTheme(){
  return WN_THEMES[Math.min(WG.currentLevel || 0, WN_THEMES.length - 1)];
}
function drawFrame(){
  const ctx = WG.ctx;
  if (!ctx) return;
  ctx.save();
  if (WG._gk && WG._gk.shake) WG._gk.shake.apply(ctx);
  const th = wnTheme();
  WG._th = th;
  const sky = ctx.createLinearGradient(0, 0, 0, WG.H);
  sky.addColorStop(0, th.skyTop);
  sky.addColorStop(1, th.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WG.W, WG.H);
  // Sun / moon with soft halo
  const sunX = WG.W - 50 - ((WG.camera.x * 0.05) % 30);
  ctx.fillStyle = th.sun;
  ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.arc(sunX, 28, 16, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(sunX, 28, th.night ? 8 : 10, 0, Math.PI*2); ctx.fill();
  if (th.night){
    // Twinkling parallax stars (deterministic per index)
    const t = performance.now() / 1000;
    const starOff = -(WG.camera.x * 0.12);
    for (let i = 0; i < 34; i++){
      const sx = ((i * 53.7 + starOff) % (WG.W + 20) + WG.W + 20) % (WG.W + 20) - 10;
      const sy = 6 + ((i * 37) % 90);
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + (i % 5) * 0.4) + i));
      ctx.fillStyle = 'rgba(255,255,255,' + (tw * 0.85).toFixed(2) + ')';
      ctx.fillRect(sx, sy, (i % 7 === 0) ? 2 : 1, (i % 7 === 0) ? 2 : 1);
    }
  }
  ctx.fillStyle = th.cloud;
  const cloudOff = -(WG.camera.x * 0.3);
  for (let i = 0; i < 8; i++){
    const cx = ((i * 90 + cloudOff) % (WG.W + 120) + WG.W + 120) % (WG.W + 120) - 60;
    const cy = 18 + (i % 3) * 12;
    drawCloud(ctx, cx, cy);
  }
  ctx.fillStyle = th.hill;
  const hillOff = -(WG.camera.x * 0.5);
  for (let i = -1; i < 8; i++){
    const cx = ((i * 110 + hillOff) % (WG.W + 220) + WG.W + 220) % (WG.W + 220) - 110;
    drawHill(ctx, cx, WG.H - 36);
  }
  if (th.lava){
    // Rising embers
    const t = performance.now() / 1000;
    for (let i = 0; i < 16; i++){
      const ex = ((i * 71 - WG.camera.x * 0.25) % (WG.W + 16) + WG.W + 16) % (WG.W + 16) - 8;
      const ey = WG.H - ((t * (14 + (i % 4) * 7) + i * 31) % (WG.H + 10));
      const a = 0.25 + 0.5 * Math.abs(Math.sin(t * 2 + i));
      ctx.fillStyle = 'rgba(255,' + (110 + (i % 3) * 40) + ',40,' + a.toFixed(2) + ')';
      ctx.fillRect(ex, ey, 2, 2);
    }
  }
  ctx.save();
  ctx.translate(-Math.floor(WG.camera.x), 0);
  const startCol = Math.max(0, Math.floor(WG.camera.x / TILE) - 1);
  const endCol = Math.min(LEVEL_W, Math.ceil((WG.camera.x + WG.W) / TILE) + 1);
  for (let y = 0; y < LEVEL_H; y++){
    for (let x = startCol; x < endCol; x++){
      const ch = WG.level[y][x];
      if (ch !== ' ') drawTile(ctx, x, y, ch);
    }
  }
  WG.coins.forEach(c => { if (!c.collected) drawCoin(ctx, c); });
  WG.items.forEach(it => drawItem(ctx, it));
  WG.enemies.forEach(e => { if (e.alive) drawEnemy(ctx, e); });
  WG.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
  });
  drawFireballs(ctx);
  // Revive stars (coop): glowing yellow stars hovering with a bob
  if (WG.coopMode && WG.reviveStars){
    for (const rs of WG.reviveStars){
      if (rs.taken) continue;
      const bob = Math.sin((rs.phase || 0) * 2 + 0) * 2;
      const cx = rs.x + rs.w/2, cy = rs.y + rs.h/2 + bob;
      const r = 6 + Math.sin((rs.phase || 0) * 3) * 1;
      ctx.fillStyle = 'rgba(255,210,0,0.25)';
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffd200';
      ctx.beginPath();
      for (let k = 0; k < 5; k++){
        const a = -Math.PI/2 + k * (Math.PI*2/5);
        const a2 = a + Math.PI/5;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.lineTo(cx + Math.cos(a2) * r*0.42, cy + Math.sin(a2) * r*0.42);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  // Draw players — non-ghost first, ghost last so it overlays.
  for (const pp of allPlayers()){
    if (!pp.ghost) drawPlayer(ctx, pp);
  }
  for (const pp of allPlayers()){
    if (pp.ghost) drawGhost(ctx, pp);
  }
  ctx.restore();
  // Cinematic vignette
  const vg = ctx.createRadialGradient(WG.W/2, WG.H/2, WG.H*0.55, WG.W/2, WG.H/2, WG.H*1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, th.night ? 'rgba(0,0,8,0.42)' : 'rgba(10,5,0,0.25)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, WG.W, WG.H);
  if (WG.stompCombo >= 2 && WG.stompComboTimer > 0){
    ctx.fillStyle = '#ffd200';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COMBO x' + WG.stompCombo + '!', WG.W/2, 40);
  }
  ctx.restore();
}
function drawCloud(ctx, cx, cy){
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI*2);
  ctx.arc(cx + 8, cy - 3, 9, 0, Math.PI*2);
  ctx.arc(cx + 17, cy, 7, 0, Math.PI*2);
  ctx.fill();
}
function drawHill(ctx, cx, baseY){
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.quadraticCurveTo(cx + 55, baseY - 40, cx + 110, baseY);
  ctx.closePath();
  ctx.fill();
}
function drawTile(ctx, gx, gy, ch){
  let px = gx * TILE, py = gy * TILE;
  const pop = WG.popBlocks && WG.popBlocks.find(b => b.gx === gx && b.gy === gy);
  if (pop){
    const k = pop.t / 14;
    py -= Math.sin((1-k) * Math.PI) * 4;
  }
  if (ch === 'u'){
    ctx.fillStyle = '#8a6028';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#503818';
    ctx.fillRect(px, py + TILE - 2, TILE, 2);
    ctx.fillRect(px, py, 2, TILE);
    ctx.fillRect(px + TILE - 2, py, 2, TILE);
    return;
  }
  if (ch === 'M'){
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#c87700';
    ctx.fillRect(px, py + TILE - 2, TILE, 2);
    ctx.fillRect(px, py, 2, TILE);
    ctx.fillRect(px + TILE - 2, py, 2, TILE);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', px + TILE/2, py + TILE/2 + 1);
    return;
  }
  const th = WG._th || WN_THEMES[0];
  if (ch === '#'){
    ctx.fillStyle = th.dirt;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = th.grass;
    ctx.fillRect(px, py, TILE, 4);
    ctx.fillStyle = th.grassHi;
    ctx.fillRect(px+2, py, 2, 3);
    ctx.fillRect(px+10, py, 2, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(px+2, py+8, 3, 2);
    ctx.fillRect(px+11, py+12, 3, 2);
  } else if (ch === 'b'){
    ctx.fillStyle = '#c84a1a';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#7a2810';
    ctx.fillRect(px, py+7, TILE, 1);
    ctx.fillRect(px, py+15, TILE, 1);
    ctx.fillRect(px+5, py, 1, 8);
    ctx.fillRect(px+11, py+8, 1, 8);
    ctx.fillRect(px+5, py+8, 1, 8);
    ctx.fillStyle = '#ffaa66';
    ctx.fillRect(px, py, TILE, 1);
  } else if (ch === '?'){
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = '#c87700';
    ctx.fillRect(px, py + TILE - 2, TILE, 2);
    ctx.fillRect(px, py, 2, TILE);
    ctx.fillRect(px + TILE - 2, py, 2, TILE);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', px + TILE/2, py + TILE/2 + 1);
  } else if (ch === '='){
    ctx.fillStyle = th.dirt;
    ctx.fillRect(px, py, TILE, TILE - 4);
    ctx.fillStyle = th.grass;
    ctx.fillRect(px, py, TILE, 3);
  } else if (ch === 'f' || ch === 'F'){
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(px + TILE/2 - 1, py, 2, TILE);
    if (ch === 'F'){
      ctx.fillStyle = '#888';
      ctx.fillRect(px + 4, py + TILE - 4, 8, 4);
    }
  }
  if (ch === 'f' && (gy === 0 || WG.level[gy-1][gx] !== 'f')){
    ctx.fillStyle = '#dd2222';
    ctx.beginPath();
    ctx.moveTo(px + TILE/2 + 1, py + 2);
    ctx.lineTo(px + TILE - 1, py + 6);
    ctx.lineTo(px + TILE/2 + 1, py + 10);
    ctx.closePath();
    ctx.fill();
  }
}
function drawCoin(ctx, c){
  const cx = c.x + c.w/2;
  const cy = c.y + c.h/2 + Math.sin(c.phase) * 1.2;
  const wob = Math.abs(Math.sin(c.phase * 0.6));
  const w = 4 + wob * 4;
  ctx.fillStyle = '#cc9900';
  ctx.fillRect(Math.round(cx - w/2), Math.round(cy - 4), Math.ceil(w), 8);
  ctx.fillStyle = '#ffd200';
  ctx.fillRect(Math.round(cx - w/2 + 1), Math.round(cy - 3), Math.max(1, Math.ceil(w) - 2), 6);
  ctx.fillStyle = '#fff';
  if (w > 3) ctx.fillRect(Math.round(cx - 1), Math.round(cy - 2), 1, 4);
}
function drawEnemy(ctx, e){
  const x = e.x, y = e.y;
  if (e.kind === 'koopa'){
    ctx.fillStyle = '#3aaa44';
    ctx.fillRect(x + 1, y + 4, 12, 9);
    ctx.fillStyle = '#226a2a';
    ctx.fillRect(x + 1, y + 4, 12, 2);
    ctx.fillStyle = '#7adb84';
    ctx.fillRect(x + 3, y + 6, 2, 1);
    ctx.fillRect(x + 9, y + 6, 2, 1);
    ctx.fillStyle = '#f5d878';
    ctx.fillRect(x + 4, y, 6, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 5, y + 1, 1, 1);
    ctx.fillRect(x + 8, y + 1, 1, 1);
    ctx.fillStyle = '#f5d878';
    ctx.fillRect(x + 2, y + 13, 3, 3);
    ctx.fillRect(x + 9, y + 13, 3, 3);
    return;
  }
  ctx.fillStyle = '#7a4a1a';
  ctx.fillRect(x + 1, y + 4, 12, 10);
  ctx.fillRect(x, y + 2, 14, 6);
  ctx.fillStyle = '#3a1a0a';
  const ph = Math.floor(e.walkPhase) % 2;
  if (ph === 0){
    ctx.fillRect(x + 1, y + 13, 4, 2);
    ctx.fillRect(x + 9, y + 14, 4, 1);
  } else {
    ctx.fillRect(x + 1, y + 14, 4, 1);
    ctx.fillRect(x + 9, y + 13, 4, 2);
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 3, y + 5, 2, 3);
  ctx.fillRect(x + 9, y + 5, 2, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 3, y + 6, 2, 2);
  ctx.fillRect(x + 9, y + 6, 2, 2);
  ctx.fillRect(x + 5, y + 10, 4, 1);
}
function drawPlayer(ctx, p){
  if (p.invincible > 0 && Math.floor(p.invincible / 3) % 2 === 0) return;
  const x = Math.round(p.x), y = Math.round(p.y);
  const ph = Math.floor(p.walkPhase) % 2;
  const facingR = p.dir > 0;
  if (p.starTimer > 0){
    const cycle = Math.floor(Date.now() / 70) % 4;
    const glow = ['rgba(255,210,0,0.35)','rgba(255,255,255,0.35)','rgba(100,200,255,0.35)','rgba(255,80,80,0.35)'][cycle];
    ctx.fillStyle = glow;
    ctx.fillRect(x - 2, y - 2, p.w + 4, p.h + 4);
  }
  if (p.kind === 'lulu') { drawLuluSprite(ctx, x, y, ph, facingR, p); return; }
  if (p.kind === 'suha') { drawSuhaSprite(ctx, x, y, ph, facingR, p); return; }
  // 'osama' falls through to the Wanees sprite (same visual, different name
  // in dialogues/HUD). Legacy Suha-mode flag still routes to her sprite.
  if (WG.suhaMode && p.kind !== 'lulu' && p.kind !== 'wanees' && p.kind !== 'osama') {
    drawSuhaSprite(ctx, x, y, ph, facingR, p); return;
  }
  ctx.fillStyle = '#dd2222';
  ctx.fillRect(x + 1, y, 10, 3);
  ctx.fillRect(facingR ? x + 6 : x, y + 2, 6, 2);
  ctx.fillStyle = '#aa0a0a';
  ctx.fillRect(x + 1, y + 2, 10, 1);
  ctx.fillStyle = '#f0c090';
  ctx.fillRect(x + 2, y + 3, 8, 4);
  ctx.fillStyle = '#222';
  ctx.fillRect(facingR ? x + 8 : x + 3, y + 4, 1, 2);
  ctx.fillStyle = '#3a1a0a';
  ctx.fillRect(facingR ? x + 1 : x + 9, y + 4, 2, 2);
  ctx.fillStyle = '#2a5ea8';
  ctx.fillRect(x + 1, y + 7, 10, 4);
  ctx.fillStyle = '#ffd200';
  ctx.fillRect(x + 5, y + 8, 2, 2);
  ctx.fillStyle = '#dd2222';
  ctx.fillRect(x, y + 7, 1, 3);
  ctx.fillRect(x + 11, y + 7, 1, 3);
  ctx.fillStyle = '#3a1a0a';
  if (!p.onGround){
    ctx.fillRect(x + 2, y + 11, 3, 3);
    ctx.fillRect(x + 7, y + 11, 3, 3);
  } else if (Math.abs(p.vx) > 0.1){
    if (ph === 0){
      ctx.fillRect(x + 2, y + 11, 3, 3);
      ctx.fillRect(x + 7, y + 11, 3, 2);
    } else {
      ctx.fillRect(x + 2, y + 11, 3, 2);
      ctx.fillRect(x + 7, y + 11, 3, 3);
    }
  } else {
    ctx.fillRect(x + 2, y + 11, 3, 3);
    ctx.fillRect(x + 7, y + 11, 3, 3);
  }
}
function drawSuhaSprite(ctx, x, y, ph, facingR, p){
  const PINK   = '#ff7eb3';   // dress
  const PINK_D = '#ff4585';   // dress trim / shoes
  const BOW    = '#ff5e9c';   // hair bow
  const HAIR   = '#5a2a18';   // chestnut hair
  const HAIR_HL= '#7a3a22';
  const SKIN   = '#f0c090';
  const HEART  = '#ffd200';
  // Hair bow (top) — two pink puffs with a yellow center bead
  ctx.fillStyle = BOW;
  ctx.fillRect(x + 2, y, 2, 2);
  ctx.fillRect(x + 8, y, 2, 2);
  ctx.fillStyle = HEART;
  ctx.fillRect(x + 5, y, 2, 1);
  // Hair top + bangs
  ctx.fillStyle = HAIR;
  ctx.fillRect(x + 1, y + 1, 10, 2);
  ctx.fillStyle = HAIR_HL;
  ctx.fillRect(x + 4, y + 1, 4, 1);
  // Side hair framing face (longer on one side, swept by facing)
  ctx.fillStyle = HAIR;
  ctx.fillRect(x, y + 3, 1, 5);
  ctx.fillRect(x + 11, y + 3, 1, 5);
  // Face
  ctx.fillStyle = SKIN;
  ctx.fillRect(x + 1, y + 3, 10, 4);
  // Bangs over forehead
  ctx.fillStyle = HAIR;
  ctx.fillRect(x + 2, y + 3, 2, 1);
  ctx.fillRect(x + 8, y + 3, 2, 1);
  // Eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(x + 3, y + 4, 1, 2);
  ctx.fillRect(x + 8, y + 4, 1, 2);
  // Tiny blush
  ctx.fillStyle = '#ff9bb8';
  ctx.fillRect(x + 2, y + 5, 1, 1);
  ctx.fillRect(x + 9, y + 5, 1, 1);
  // Smile
  ctx.fillStyle = '#a83056';
  ctx.fillRect(x + 5, y + 6, 2, 1);
  // Dress: top yoke
  ctx.fillStyle = PINK;
  ctx.fillRect(x + 1, y + 7, 10, 2);
  // Sleeves
  ctx.fillStyle = PINK_D;
  ctx.fillRect(x, y + 7, 1, 2);
  ctx.fillRect(x + 11, y + 7, 1, 2);
  // Heart on chest
  ctx.fillStyle = HEART;
  ctx.fillRect(x + 5, y + 7, 2, 2);
  ctx.fillStyle = '#ffeb70';
  ctx.fillRect(x + 5, y + 7, 1, 1);
  // Dress flare row + skirt bottom
  ctx.fillStyle = PINK;
  ctx.fillRect(x, y + 9, 12, 2);
  ctx.fillStyle = PINK_D;
  ctx.fillRect(x, y + 10, 12, 1);
  // Legs (skin) and pink shoes — with walk cycle
  if (!p.onGround){
    ctx.fillStyle = SKIN;
    ctx.fillRect(x + 3, y + 11, 2, 1);
    ctx.fillRect(x + 7, y + 11, 2, 1);
    ctx.fillStyle = PINK_D;
    ctx.fillRect(x + 2, y + 12, 3, 2);
    ctx.fillRect(x + 7, y + 12, 3, 2);
  } else if (Math.abs(p.vx) > 0.1){
    ctx.fillStyle = SKIN;
    if (ph === 0){
      ctx.fillRect(x + 3, y + 11, 2, 2);
      ctx.fillRect(x + 7, y + 11, 2, 1);
      ctx.fillStyle = PINK_D;
      ctx.fillRect(x + 2, y + 13, 3, 1);
      ctx.fillRect(x + 7, y + 12, 3, 2);
    } else {
      ctx.fillRect(x + 3, y + 11, 2, 1);
      ctx.fillRect(x + 7, y + 11, 2, 2);
      ctx.fillStyle = PINK_D;
      ctx.fillRect(x + 2, y + 12, 3, 2);
      ctx.fillRect(x + 7, y + 13, 3, 1);
    }
  } else {
    ctx.fillStyle = SKIN;
    ctx.fillRect(x + 3, y + 11, 2, 1);
    ctx.fillRect(x + 7, y + 11, 2, 1);
    ctx.fillStyle = PINK_D;
    ctx.fillRect(x + 2, y + 12, 3, 2);
    ctx.fillRect(x + 7, y + 12, 3, 2);
  }
  // Ponytail trailing in wind based on facing
  ctx.fillStyle = HAIR;
  if (facingR){
    ctx.fillRect(x - 1, y + 2, 1, 3);
    ctx.fillRect(x - 2, y + 3, 1, 3);
  } else {
    ctx.fillRect(x + 12, y + 2, 1, 3);
    ctx.fillRect(x + 13, y + 3, 1, 3);
  }
}
// Lulu sprite — dark-haired girl with two pigtails, pink-bow accents, and
// a purple-and-white striped dress. Drawn at the same 12×14 grid as Wanees
// so the world geometry / collision boxes don't change.
function drawLuluSprite(ctx, x, y, ph, facingR, p){
  const DRESS  = '#b070cc';   // purple base
  const STRIPE = '#f6e8ff';   // light stripe / belt
  const SHOES  = '#ff3366';   // pink shoes
  const BOW    = '#ff5e9c';   // pink bows
  const HAIR   = '#1a0a08';   // dark hair
  const HAIR_HL= '#3a1a18';
  const SKIN   = '#f4cba0';
  // Pigtails (two side puffs) — drawn first so the head sits on top
  ctx.fillStyle = HAIR;
  ctx.fillRect(x - 1, y + 2, 2, 4); ctx.fillRect(x + 11, y + 2, 2, 4);
  // Pink bows on pigtail tips
  ctx.fillStyle = BOW;
  ctx.fillRect(x - 1, y + 1, 2, 2); ctx.fillRect(x + 11, y + 1, 2, 2);
  // Hair top + bangs
  ctx.fillStyle = HAIR;
  ctx.fillRect(x + 1, y, 10, 3);
  ctx.fillStyle = HAIR_HL;
  ctx.fillRect(x + 4, y + 1, 4, 1);
  // Face
  ctx.fillStyle = SKIN;
  ctx.fillRect(x + 1, y + 3, 10, 4);
  ctx.fillStyle = HAIR;
  ctx.fillRect(x + 2, y + 3, 2, 1); ctx.fillRect(x + 8, y + 3, 2, 1);
  // Eyes
  ctx.fillStyle = '#1a1010';
  ctx.fillRect(x + 3, y + 4, 1, 2); ctx.fillRect(x + 8, y + 4, 1, 2);
  // Blush
  ctx.fillStyle = '#ff9bb8';
  ctx.fillRect(x + 2, y + 5, 1, 1); ctx.fillRect(x + 9, y + 5, 1, 1);
  // Smile
  ctx.fillStyle = '#a83056';
  ctx.fillRect(x + 5, y + 6, 2, 1);
  // Striped dress
  ctx.fillStyle = DRESS;
  ctx.fillRect(x + 1, y + 7, 10, 4);
  ctx.fillStyle = STRIPE;
  ctx.fillRect(x + 1, y + 8, 10, 1);
  ctx.fillRect(x + 1, y + 10, 10, 1);
  // Sleeves
  ctx.fillStyle = DRESS;
  ctx.fillRect(x, y + 7, 1, 2); ctx.fillRect(x + 11, y + 7, 1, 2);
  // Legs + pink shoes with walk cycle
  if (!p.onGround){
    ctx.fillStyle = SKIN;
    ctx.fillRect(x + 3, y + 11, 2, 1); ctx.fillRect(x + 7, y + 11, 2, 1);
    ctx.fillStyle = SHOES;
    ctx.fillRect(x + 2, y + 12, 3, 2); ctx.fillRect(x + 7, y + 12, 3, 2);
  } else if (Math.abs(p.vx) > 0.1){
    ctx.fillStyle = SKIN;
    if (ph === 0){
      ctx.fillRect(x + 3, y + 11, 2, 2); ctx.fillRect(x + 7, y + 11, 2, 1);
      ctx.fillStyle = SHOES;
      ctx.fillRect(x + 2, y + 13, 3, 1); ctx.fillRect(x + 7, y + 12, 3, 2);
    } else {
      ctx.fillRect(x + 3, y + 11, 2, 1); ctx.fillRect(x + 7, y + 11, 2, 2);
      ctx.fillStyle = SHOES;
      ctx.fillRect(x + 2, y + 12, 3, 2); ctx.fillRect(x + 7, y + 13, 3, 1);
    }
  } else {
    ctx.fillStyle = SKIN;
    ctx.fillRect(x + 3, y + 11, 2, 1); ctx.fillRect(x + 7, y + 11, 2, 1);
    ctx.fillStyle = SHOES;
    ctx.fillRect(x + 2, y + 12, 3, 2); ctx.fillRect(x + 7, y + 12, 3, 2);
  }
}
// Ghost form — translucent bobbing silhouette in the player's tint color.
// Marks where a downed coop teammate is waiting to be revived.
function drawGhost(ctx, p){
  const x = Math.round(p.x), y = Math.round(p.y);
  const t = (WG._tick || 0);
  WG._tick = t + 1;
  const sway = Math.sin(t * 0.06) * 1.5;
  const isLulu = p.kind === 'lulu';
  const tint   = isLulu ? 'rgba(255,140,200,0.85)' : 'rgba(255,210,80,0.85)';
  const inner  = isLulu ? 'rgba(255,230,240,0.95)' : 'rgba(255,250,200,0.95)';
  ctx.save();
  ctx.globalAlpha = 0.85;
  // Body (rounded teardrop)
  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.arc(x + 6 + sway, y + 6, 7, Math.PI, 0);
  ctx.lineTo(x + 13 + sway, y + 13);
  ctx.lineTo(x + 11 + sway, y + 11);
  ctx.lineTo(x + 9 + sway,  y + 13);
  ctx.lineTo(x + 7 + sway,  y + 11);
  ctx.lineTo(x + 5 + sway,  y + 13);
  ctx.lineTo(x + 3 + sway,  y + 11);
  ctx.lineTo(x + 1 + sway,  y + 13);
  ctx.lineTo(x - 1 + sway,  y + 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = inner;
  // Eyes
  ctx.fillRect(x + 3 + sway, y + 5, 2, 3);
  ctx.fillRect(x + 8 + sway, y + 5, 2, 3);
  ctx.restore();
}
function updateHud(){
  const livesEl = document.getElementById('wnLives');
  if (WG.coopMode && WG.player2){
    // Coop shows two hearts: "P1ـ❤️3 + P2ـ💗3" (or 💀 for ghost). The icon
    // color follows the player's gender-ish kind: gold heart for the
    // wanees/osama slot, pink heart for lulu/suha.
    const a = WG.player, b = WG.player2;
    const isGirl = k => (k === 'lulu' || k === 'suha');
    const ic1 = a.ghost ? '💀' : (isGirl(a.kind) ? '💗' : '❤️');
    const ic2 = b.ghost ? '💀' : (isGirl(b.kind) ? '💗' : '❤️');
    livesEl.innerHTML = ic1 + (a.ghost ? '' : a.lives) + ' <span style="opacity:0.5">+</span> ' + ic2 + (b.ghost ? '' : b.lives);
  } else {
    livesEl.textContent = WG.lives;
  }
  document.getElementById('wnCoins').textContent = WG.coinsCollected;
  document.getElementById('wnScore').textContent = String(Math.floor(WG.score)).padStart(5, '0');
  document.getElementById('wnTime').textContent = WG.timeLeft;
  const stageEl = document.getElementById('wnStage');
  if (stageEl) stageEl.textContent = ((WG.currentLevel || 0) + 1) + '/' + TOTAL_LEVELS;
}
})();
