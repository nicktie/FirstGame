
(function(){
const SG = {
  W: 480, H: 800, ctx:null, canvas:null,
  state:'idle', stage:0, wave:0, totalWavesPerStage:5,
  score:0, lives:3, bombs:1, totalKills:0,
  killCombo:0, killMult:1, comboCool:0, comboFlash:0, // kill-streak chain
  grazeCount:0, grazeFlash:0, // bullet grazing
  player: { x:240, y:720, w:34, h:36, speed:6, fireCool:0, baseFireRate:11, invincible:0 },
  shield:0, triple:0, rapid:0, drones:0, // power-up timers in frames
  charge:0, // 0-100, auto-fills for charged shot
  nextEnemyId:1,
  bonusTimer:0, bonusNext:38, bonusActive:false,
  enemies: [], bullets: [], eBullets: [], particles: [], powerups: [], stars: [],
  boss:null, bossEntering:false, bossPending:false,
  spawnTimer:0, spawnNext:80, waveCooldown:0,
  raf:0, lastTime:0,
  inputs:{ left:false, right:false }, touchActive:false, touchX:null, lastDragX:null,
  best:0, bestStage:1,
  STAGES: [
    {
      id:'space', name:'الفضاء العميق', emoji:'🌌',
      bgTop:'#000010', bgBot:'#000020', starColor:'#fff', starDensity:90,
      enemies:['scout','fighter'], boss:'carrier'
    },
    {
      id:'asteroid', name:'حزام الكويكبات', emoji:'☄️',
      bgTop:'#0a0508', bgBot:'#180a05', starColor:'#ffaa66', starDensity:50,
      enemies:['scout','fighter','asteroid'], boss:'megaasteroid'
    },
    {
      id:'nebula', name:'السديم البنفسجي', emoji:'🌠',
      bgTop:'#100020', bgBot:'#280048', starColor:'#ff88ff', starDensity:70,
      enemies:['drone','sniper','fighter'], boss:'destroyer'
    }
  ],
  _bound:false
};
window.SPACE_GAME = SG;

// === Utilities ===
function rand(a,b){ return a + Math.random()*(b-a); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function cur(){ return SG.STAGES[SG.stage % SG.STAGES.length]; }

function spSnd(name){
  if (typeof isMuted !== 'undefined' && isMuted) return;
  if (typeof playTone !== 'function') return;
  switch(name){
    case 'shoot': playTone(880, 0.04, 'triangle', 0.10); break;
    case 'enemy_hit': playTone(330, 0.04, 'square', 0.12); break;
    case 'enemy_die':
      playTone(220, 0.08, 'sawtooth', 0.18);
      setTimeout(()=>playTone(110, 0.10, 'sawtooth', 0.14), 50);
      break;
    case 'hurt':
      playTone(165, 0.18, 'sawtooth', 0.32);
      setTimeout(()=>playTone(110, 0.22, 'sawtooth', 0.28), 120);
      break;
    case 'pup':
      playTone(784, 0.06, 'triangle', 0.18);
      setTimeout(()=>playTone(1175, 0.08, 'triangle', 0.18), 50);
      setTimeout(()=>playTone(1568, 0.10, 'triangle', 0.16), 110);
      break;
    case 'boss_in':
      playTone(98, 0.4, 'sawtooth', 0.32);
      setTimeout(()=>playTone(82, 0.5, 'sawtooth', 0.26), 280);
      break;
    case 'boss_die':
      [523,659,784,988,1175,1568].forEach((f,i)=>setTimeout(()=>playTone(f,0.18,'triangle',0.28),i*80));
      break;
    case 'stage':
      [392,523,659,784,1046].forEach((f,i)=>setTimeout(()=>playTone(f,0.16,'triangle',0.22),i*100));
      break;
    case 'bomb':
      playTone(60, 0.5, 'sawtooth', 0.45);
      setTimeout(()=>playTone(45, 0.6, 'sawtooth', 0.32), 200);
      break;
    case 'charge':
      [523, 659, 880, 1175, 1568].forEach((f, i) => setTimeout(() => playTone(f, 0.06, 'sawtooth', 0.22), i * 40));
      setTimeout(() => playTone(2000, 0.18, 'square', 0.18), 200);
      break;
    case 'death':
      [440,370,294,220,165,110].forEach((f,i)=>setTimeout(()=>playTone(f,0.28,'sawtooth',0.25),i*150));
      break;
  }
}

window.syncSpaceMuteIcon = function(){
  const b = document.getElementById('spMuteBtn');
  if (b) b.textContent = (typeof isMuted !== 'undefined' && isMuted) ? '🔇' : '🔊';
};

window.playSpace = function(){
  if (typeof hideAllScreens === 'function') hideAllScreens();
  const scr = document.getElementById('spaceScreen');
  if (!scr) return;
  scr.classList.add('active');
  scr.style.display = 'flex';
  document.body.classList.add('space-active');
  if (typeof _setNavShow === 'function') _setNavShow(false);
  initSpace();
};
window.exitSpace = function(){
  spaceStop();
  resetSpaceState();
  document.body.classList.remove('space-active');
  const scr = document.getElementById('spaceScreen');
  if (scr) { scr.classList.remove('active'); scr.style.display = 'none'; }
  document.getElementById('spaceStartOverlay').style.display = 'flex';
  document.getElementById('spaceOverOverlay').style.display = 'none';
  if (typeof returnFromGame === 'function') returnFromGame();
  else if (typeof goToLanding === 'function') goToLanding();
};

function initSpace(){
  SG.canvas = document.getElementById('spaceCanvas');
  SG.ctx = SG.canvas.getContext('2d');
  try {
    const p = (typeof loadProfile === 'function') ? loadProfile() : null;
    SG.best = (p && p.stats && p.stats.space && p.stats.space.bestScore) || 0;
    SG.bestStage = (p && p.stats && p.stats.space && p.stats.space.bestStage) || 1;
  } catch(e){ SG.best = 0; SG.bestStage = 1; }
  resetSpaceState();
  initStars();
  drawFrame();
  syncSpaceMuteIcon();
  if (!SG._bound) { bindSpaceControls(); SG._bound = true; }
  document.getElementById('spaceStartOverlay').style.display = 'flex';
  document.getElementById('spaceOverOverlay').style.display = 'none';
  document.getElementById('spBossBanner').style.display = 'none';
  document.getElementById('spBossHp').style.display = 'none';
}
function resetSpaceState(){
  SG.state = 'idle';
  SG.stage = 0; SG.wave = 0;
  SG.score = 0; SG.lives = 3; SG.bombs = 1; SG.totalKills = 0;
  SG.killCombo = 0; SG.killMult = 1; SG.comboCool = 0; SG.comboFlash = 0;
  SG.grazeCount = 0; SG.grazeFlash = 0;
  SG.player.x = SG.W/2; SG.player.y = SG.H - 80; SG.player.fireCool = 0; SG.player.invincible = 0;
  SG.shield = 0; SG.triple = 0; SG.rapid = 0; SG.drones = 0;
  SG.charge = 0;
  SG.nextEnemyId = 1;
  SG.bonusTimer = 0; SG.bonusNext = 38; SG.bonusActive = false;
  SG.enemies = []; SG.bullets = []; SG.eBullets = []; SG.particles = []; SG.powerups = [];
  SG.boss = null; SG.bossEntering = false; SG.bossPending = false;
  SG.spawnTimer = 0; SG.spawnNext = 80; SG.waveCooldown = 0;
  if (SG._gk){
    if (SG._gk.particles) SG._gk.particles.clear();
    if (SG._gk.shake) SG._gk.shake.trauma = 0;
    if (SG._gk.stop) SG._gk.stop.timer = 0;
  }
  SG._flash = 0;
  updateHud();
  updateBombBtn();
  updatePupChips();
}
function initStars(){
  const stage = cur();
  SG.stars = [];
  for (let i=0;i<stage.starDensity;i++){
    SG.stars.push({ x: rand(0, SG.W), y: rand(0, SG.H), r: rand(0.4, 2), vy: rand(0.4, 1.4) });
  }
}
window.spaceStart = function(){
  document.getElementById('spaceStartOverlay').style.display = 'none';
  document.getElementById('spaceOverOverlay').style.display = 'none';
  resetSpaceState();
  SG.state = 'running';
  SG.lastTime = performance.now();
  cancelAnimationFrame(SG.raf);
  SG.raf = requestAnimationFrame(spaceLoop);
  showStageBanner();
  spSnd('stage');
};
function spaceStop(){
  cancelAnimationFrame(SG.raf);
  SG.state = 'idle';
}
function spaceLoop(t){
  if (SG.state !== 'running') return;
  const rawDt = Math.min(40, t - SG.lastTime) / 16.667;
  SG.lastTime = t;
  // Hit-stop: freeze logic but keep drawing so impacts read
  let dt = rawDt;
  if (SG._gk && SG._gk.stop){
    const scale = SG._gk.stop.tick(rawDt);
    dt = rawDt * scale;
  }
  updateSpace(dt);
  if (SG._gk){
    if (SG._gk.particles) SG._gk.particles.update(rawDt);
    if (SG._gk.shake) SG._gk.shake.update(rawDt, { maxOffset: 12, maxRot: 0.025, decay: 0.05 });
    if (SG._flash > 0) SG._flash -= rawDt * 0.06;
  }
  if (SG.state !== 'running') return;
  drawFrame();
  SG.raf = requestAnimationFrame(spaceLoop);
}

// === Input bindings ===
function bindSpaceControls(){
  const strip = document.getElementById('spControlStrip');
  const indicator = document.getElementById('spControlIndicator');
  function isActive(){
    const scr = document.getElementById('spaceScreen');
    return scr && scr.classList.contains('active');
  }
  document.addEventListener('keydown', (e) => {
    if (!isActive()) return;
    if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft'){ SG.inputs.left = true; e.preventDefault(); }
    else if (e.code === 'ArrowRight' || e.key === 'ArrowRight'){ SG.inputs.right = true; e.preventDefault(); }
    else if (e.code === 'Space' || e.key === ' '){ spaceUseBomb(); e.preventDefault(); }
  });
  document.addEventListener('keyup', (e) => {
    if (!isActive()) return;
    if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft'){ SG.inputs.left = false; e.preventDefault(); }
    else if (e.code === 'ArrowRight' || e.key === 'ArrowRight'){ SG.inputs.right = false; e.preventDefault(); }
  });
  // Relative-drag control strip (so the finger never covers the ship)
  function stripStart(clientX){
    if (!isActive()) return;
    SG.touchActive = true;
    SG.touchStartClientX = clientX;
    SG.touchStartPlayerX = SG.player.x;
    SG.touchX = SG.player.x;
    strip.classList.add('touching');
    const rect = strip.getBoundingClientRect();
    indicator.style.left = clamp(clientX - rect.left, 0, rect.width) + 'px';
  }
  function stripMove(clientX){
    if (!SG.touchActive) return;
    const rect = strip.getBoundingClientRect();
    const dx = clientX - SG.touchStartClientX;
    const scale = (SG.W / Math.max(1, rect.width)) * 1.2;
    SG.touchX = SG.touchStartPlayerX + dx * scale;
    indicator.style.left = clamp(clientX - rect.left, 0, rect.width) + 'px';
  }
  function stripEnd(){
    if (!SG.touchActive) return;
    SG.touchActive = false;
    SG.touchX = null;
    strip.classList.remove('touching');
  }
  strip.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    stripStart(e.touches[0].clientX);
  }, { passive:false });
  strip.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    stripMove(e.touches[0].clientX);
  }, { passive:false });
  strip.addEventListener('touchend', (e) => { e.preventDefault(); stripEnd(); }, { passive:false });
  strip.addEventListener('touchcancel', stripEnd);
  strip.addEventListener('mousedown', (e) => { stripStart(e.clientX); });
  window.addEventListener('mousemove', (e) => { if (SG.touchActive) stripMove(e.clientX); });
  window.addEventListener('mouseup', () => { if (SG.touchActive) stripEnd(); });
}

// === Update ===
function updateSpace(dt){
  // Stars scroll
  SG.stars.forEach(s => {
    s.y += s.vy * dt;
    if (s.y > SG.H){ s.y = -2; s.x = rand(0, SG.W); }
  });
  // Player movement
  let dx = 0;
  if (SG.touchActive && SG.touchX !== null){
    const targetX = SG.touchX;
    const diff = targetX - SG.player.x;
    dx = clamp(diff, -SG.player.speed * 1.4 * dt, SG.player.speed * 1.4 * dt);
  } else {
    if (SG.inputs.left) dx -= SG.player.speed * dt;
    if (SG.inputs.right) dx += SG.player.speed * dt;
  }
  SG.player.x += dx;
  SG.player.x = clamp(SG.player.x, SG.player.w/2 + 4, SG.W - SG.player.w/2 - 4);
  // Player fire
  SG.player.fireCool -= dt;
  if (SG.player.fireCool <= 0){
    firePlayer();
    SG.player.fireCool = (SG.rapid > 0) ? SG.player.baseFireRate * 0.5 : SG.player.baseFireRate;
  }
  // Player invincible tick
  if (SG.player.invincible > 0) SG.player.invincible -= dt;
  // Power-up timers
  if (SG.shield > 0) SG.shield -= dt;
  if (SG.triple > 0) SG.triple -= dt;
  if (SG.rapid > 0) SG.rapid -= dt;
  if (SG.drones > 0) SG.drones -= dt;
  // Charged-shot meter fills over ~7s
  if (SG.charge < 100) {
    SG.charge = Math.min(100, SG.charge + 0.24 * dt);
    updateChargeBtn();
  }
  // Kill-combo decay (resets if no kill for ~2.5s)
  if (SG.comboFlash > 0) SG.comboFlash -= dt;
  if (SG.grazeFlash > 0) SG.grazeFlash -= dt;
  if (SG.killCombo > 0){
    SG.comboCool -= dt;
    if (SG.comboCool <= 0){ SG.killCombo = 0; SG.killMult = 1; }
  }
  // Update bullets
  SG.bullets.forEach(b => { b.y += b.vy * dt; });
  SG.bullets = SG.bullets.filter(b => b.y > -20);
  SG.eBullets.forEach(b => { b.y += b.vy * dt; b.x += b.vx * dt; });
  // Bullet grazing — points for letting an enemy bullet pass very close
  if (SG.player.invincible <= 0){
    const px = SG.player.x, py = SG.player.y;
    for (const b of SG.eBullets){
      if (b.grazed) continue;
      const dx = b.x - px, dy = b.y - py;
      const dist2 = dx*dx + dy*dy;
      // graze ring ~14-30px (outside the hit box but close)
      if (dist2 < 30*30 && dist2 > 14*14){
        b.grazed = true;
        SG.grazeCount++;
        SG.score += 5;
        SG.grazeFlash = 12;
      }
    }
  }
  SG.eBullets = SG.eBullets.filter(b => b.y < SG.H + 20 && b.x > -30 && b.x < SG.W + 30);
  // Update enemies
  SG.enemies.forEach(e => updateEnemy(e, dt));
  SG.enemies = SG.enemies.filter(e => e.y < SG.H + 60 && !e.dead);
  // Power-ups
  SG.powerups.forEach(p => { p.y += p.vy * dt; p.bob += dt * 0.1; });
  SG.powerups = SG.powerups.filter(p => p.y < SG.H + 30);
  // Particles
  SG.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  SG.particles = SG.particles.filter(p => p.life > 0);
  // Bonus round: asteroid swarm with big points, no enemy fire
  if (!SG.boss && !SG.bossPending && !SG.bonusActive) {
    SG.bonusTimer += dt;
    if (SG.bonusTimer > SG.bonusNext) {
      SG.bonusTimer = 0;
      SG.bonusNext = 32 + Math.random() * 18;
      startBonusRound();
    }
  }
  // Spawn waves
  if (!SG.boss && !SG.bossPending && SG.wave < SG.totalWavesPerStage){
    SG.spawnTimer += dt;
    if (SG.spawnTimer > SG.spawnNext){
      spawnWave();
      SG.spawnTimer = 0;
      SG.spawnNext = 90 + Math.random() * 60;
    }
  }
  // Wave completion check
  if (!SG.boss && !SG.bossPending && SG.enemies.length === 0 && SG.spawnTimer > 30){
    SG.wave++;
    if (SG.wave >= SG.totalWavesPerStage){
      // queue boss
      SG.bossPending = true;
      setTimeout(spawnBoss, 1200);
      document.getElementById('spBossBanner').style.display = 'block';
      spSnd('boss_in');
    } else {
      SG.spawnTimer = 0; SG.spawnNext = 60;
    }
  }
  // Boss logic
  if (SG.boss) updateBoss(dt);
  // Collisions
  checkCollisions();
}

function firePlayer(){
  const px = SG.player.x, py = SG.player.y - SG.player.h/2;
  if (SG.triple > 0){
    SG.bullets.push({ x:px, y:py, vy:-9, w:4, h:14 });
    SG.bullets.push({ x:px-10, y:py+6, vy:-8.5, w:4, h:14 });
    SG.bullets.push({ x:px+10, y:py+6, vy:-8.5, w:4, h:14 });
  } else {
    SG.bullets.push({ x:px, y:py, vy:-9, w:4, h:14 });
  }
  // Drone wingmen add side shots
  if (SG.drones > 0){
    SG.bullets.push({ x:px - 26, y:py + 14, vy:-8.6, w:3, h:11 });
    SG.bullets.push({ x:px + 26, y:py + 14, vy:-8.6, w:3, h:11 });
  }
  spSnd('shoot');
}

function spawnWave(){
  const stage = cur();
  const count = 3 + Math.floor(SG.wave * 1.5) + SG.stage;
  const pattern = ['straight','wavy','dive'][Math.floor(Math.random() * 3)];
  const typesAvailable = stage.enemies;
  for (let i = 0; i < count; i++){
    const type = typesAvailable[Math.floor(Math.random() * typesAvailable.length)];
    const e = makeEnemy(type, pattern, i, count);
    SG.enemies.push(e);
  }
}

function makeEnemy(type, pattern, idx, total){
  const baseX = (SG.W / (total + 1)) * (idx + 1) + (Math.random() - 0.5) * 30;
  const e = {
    id: SG.nextEnemyId++,
    type, pattern, x: baseX, y: -40 - idx * 18,
    vx: 0, vy: 1.4, hp: 1, kill: 30, w: 28, h: 24,
    fireCool: 60 + Math.random() * 80,
    t: 0, baseX, dead: false
  };
  if (type === 'scout'){ e.vy = 2.0; e.kill = 25; }
  else if (type === 'fighter'){ e.vy = 1.3; e.hp = 2; e.kill = 45; e.w = 32; e.h = 28; }
  else if (type === 'asteroid'){ e.vy = 1.6; e.hp = 3; e.kill = 60; e.w = 36; e.h = 36; e.fireCool = 99999; e.rot = 0; e.rotV = rand(-0.04,0.04); }
  else if (type === 'drone'){ e.vy = 1.7; e.kill = 20; e.w = 22; e.h = 22; e.hp = 1; e.fireCool = 200 + Math.random() * 100; }
  else if (type === 'sniper'){ e.vy = 1.1; e.hp = 2; e.kill = 55; e.fireCool = 80 + Math.random() * 60; }
  return e;
}

function updateEnemy(e, dt){
  e.t += dt;
  e.y += e.vy * dt;
  if (e.pattern === 'wavy'){
    e.x = e.baseX + Math.sin(e.t * 0.05) * 50;
  } else if (e.pattern === 'dive'){
    if (e.y > SG.H * 0.3 && SG.player){
      const dx = SG.player.x - e.x;
      e.vx = clamp(dx * 0.02, -1.5, 1.5);
      e.x += e.vx * dt;
    }
  }
  if (e.type === 'asteroid') e.rot += e.rotV * dt;
  e.fireCool -= dt;
  if (e.fireCool <= 0 && e.y > 0 && e.y < SG.H * 0.75){
    fireEnemyBullet(e);
    if (e.type === 'sniper') e.fireCool = 90 + Math.random() * 60;
    else e.fireCool = 140 + Math.random() * 100;
  }
}

function fireEnemyBullet(e){
  if (e.type === 'sniper'){
    // aimed
    const dx = SG.player.x - e.x;
    const dy = SG.player.y - e.y;
    const m = Math.sqrt(dx*dx + dy*dy) || 1;
    const speed = 3.5;
    SG.eBullets.push({ x:e.x, y:e.y+e.h/2, vx: (dx/m)*speed, vy: (dy/m)*speed, w:5, h:5, color:'#ff66ff' });
  } else {
    SG.eBullets.push({ x:e.x, y:e.y+e.h/2, vx:0, vy:3, w:4, h:9, color:e.type==='fighter'?'#ff4444':'#ffaa00' });
  }
}

// === Bonus Round (asteroid swarm) ===
function startBonusRound() {
  SG.bonusActive = true;
  // Show banner
  const banner = document.getElementById('spStageBanner');
  document.getElementById('spsbEmoji').textContent = '⭐';
  document.getElementById('spsbName').textContent = 'جولة المكافأة!';
  banner.classList.remove('show');
  void banner.offsetWidth;
  banner.classList.add('show');
  spSnd('pup');
  // Spawn 7 asteroids in a staggered V formation
  const total = 7;
  for (let i = 0; i < total; i++) {
    const e = makeEnemy('asteroid', 'straight', i, total);
    e.x = (SG.W / (total + 1)) * (i + 1);
    e.y = -50 - i * 22;
    e.vy = 2.4;
    e.kill = 80; // bigger reward than normal
    e.bonusRound = true;
    SG.enemies.push(e);
  }
  // End after ~12s safety net
  setTimeout(() => {
    if (SG.state !== 'running') return;
    // Mark end if all bonus asteroids gone
    const remaining = SG.enemies.filter(e => e.bonusRound).length;
    if (remaining === 0) SG.bonusActive = false;
  }, 8000);
  // Also poll for end (when last bonus asteroid leaves screen)
  const checkEnd = setInterval(() => {
    if (SG.state !== 'running' || !SG.bonusActive) { clearInterval(checkEnd); return; }
    const rem = SG.enemies.filter(e => e.bonusRound).length;
    if (rem === 0) {
      SG.bonusActive = false;
      clearInterval(checkEnd);
    }
  }, 250);
}

// === Boss ===
function spawnBoss(){
  if (!SG.bossPending) return;
  SG.bossPending = false;
  const stage = cur();
  const id = stage.boss;
  const b = { id, x: SG.W/2, y: -90, w:120, h:80, hp:30, maxHp:30, vx:1.2, fireCool:60, t:0, phase:'enter', enterTargetY: 80, attacks:[], rage:0, flash:0, spinFire:0 };
  if (id === 'carrier'){ b.hp = 36; b.maxHp = 36; }
  else if (id === 'megaasteroid'){ b.hp = 48; b.maxHp = 48; b.w = 130; b.h = 110; b.rot = 0; }
  else if (id === 'destroyer'){ b.hp = 66; b.maxHp = 66; b.w = 160; b.h = 70; }
  b.baseVx = b.vx;
  SG.boss = b;
  document.getElementById('spBossBanner').style.display = 'block';
  document.getElementById('spBossHp').style.display = 'block';
  updateBossHp();
}

// HP fraction → rage level (0 = >66%, 1 = 33-66%, 2 = <33%)
function bossRageForHp(b){
  const pct = b.hp / b.maxHp;
  if (pct <= 0.34) return 2;
  if (pct <= 0.67) return 1;
  return 0;
}
function advanceBossPhase(b, newRage){
  b.rage = newRage;
  b.flash = 30;
  b.vx = b.baseVx * (1 + newRage * 0.45) * (b.vx < 0 ? -1 : 1);
  b.fireCool = 20; // brief pause before unleashing
  // Phase banner
  const banner = document.getElementById('spBossBanner');
  banner.textContent = newRage === 2 ? '🔥🔥 الزعيم في غضب! 🔥🔥' : '⚠ الزعيم يشتدّ! ⚠';
  banner.style.display = 'block';
  setTimeout(()=>{ if (SG.boss && SG.boss.phase === 'fight') document.getElementById('spBossBanner').style.display='none'; }, 1100);
  spSnd('boss_in');
  // Ring of bullets as a "shockwave" warning at rage 2
  if (newRage === 2){
    for (let i = 0; i < 12; i++){
      const a = (i / 12) * Math.PI * 2;
      SG.eBullets.push({ x:b.x, y:b.y, vx: Math.cos(a)*2.4, vy: Math.sin(a)*2.4 + 1, w:5, h:5, color:'#ffaa00' });
    }
  }
  spawnExplosion(b.x, b.y, 1.4);
}

function updateBoss(dt){
  const b = SG.boss;
  b.t += dt;
  if (b.flash > 0) b.flash -= dt;
  if (b.phase === 'enter'){
    b.y += 1.3 * dt;
    if (b.y >= b.enterTargetY){ b.y = b.enterTargetY; b.phase = 'fight'; setTimeout(()=>{document.getElementById('spBossBanner').style.display='none';}, 800); }
    return;
  }
  if (b.phase === 'dying'){
    b.t2 = (b.t2 || 0) + dt;
    // explosions while dying
    if (Math.random() < 0.4) spawnExplosion(b.x + rand(-b.w/2, b.w/2), b.y + rand(-b.h/2, b.h/2), 1.6);
    if (b.t2 > 60){ onBossDefeated(); }
    return;
  }
  // Phase escalation based on HP
  const targetRage = bossRageForHp(b);
  if (targetRage > b.rage){ advanceBossPhase(b, targetRage); }
  // Fight phase movement (rage 2 bosses also bob vertically)
  b.x += b.vx * dt;
  if (b.x < b.w/2 + 8){ b.x = b.w/2 + 8; b.vx = Math.abs(b.vx); }
  if (b.x > SG.W - b.w/2 - 8){ b.x = SG.W - b.w/2 - 8; b.vx = -Math.abs(b.vx); }
  if (b.rage >= 2){ b.y = b.enterTargetY + Math.sin(b.t * 0.06) * 18; }
  // Fire rate scales with rage
  b.fireCool -= dt;
  if (b.fireCool <= 0){
    bossFire(b);
    const base = [42, 30, 20][b.rage];
    b.fireCool = base + Math.random() * (base * 0.4);
  }
}

function bossFire(b){
  const rage = b.rage;
  if (b.id === 'carrier'){
    // spread widens with rage: 3 → 5 → 7 way
    const n = [1, 2, 3][rage]; // half-count each side
    for (let i = -n; i <= n; i++){
      SG.eBullets.push({ x:b.x, y:b.y+b.h/2, vx: i * 1.1, vy: 3.4 - Math.abs(i)*0.15, w:6, h:10, color: rage>=2?'#ff7733':'#ff4444' });
    }
    // rage 2: also drop a fighter occasionally
    if (rage >= 2 && Math.random() < 0.25){
      SG.enemies.push(makeEnemy('fighter','dive', 0, 1));
      const e = SG.enemies[SG.enemies.length-1]; e.x = b.x; e.y = b.y + b.h/2;
    }
  } else if (b.id === 'megaasteroid'){
    // spawn 1 → 2 → 3 asteroids
    const count = rage + 1;
    for (let k = 0; k < count; k++){
      SG.enemies.push(makeEnemy('asteroid','straight', 0, 1));
      const e = SG.enemies[SG.enemies.length-1];
      e.x = b.x + rand(-40, 40); e.y = b.y + b.h/2; e.vy = 2.0 + rage*0.4;
    }
    // rage >=1: also fire straight rocks-bullets
    if (rage >= 1){
      SG.eBullets.push({ x:b.x, y:b.y+b.h/2, vx:0, vy:3.4, w:7, h:10, color:'#ffaa66' });
    }
  } else if (b.id === 'destroyer'){
    // 5-way aimed, widens to 7, plus a spinning spiral at rage 2
    const spread = rage + 2; // 2,3,4 half-count
    const dx = SG.player.x - b.x;
    const dy = SG.player.y - b.y;
    const m = Math.sqrt(dx*dx + dy*dy) || 1;
    const aim = { x: dx/m, y: dy/m };
    for (let i = -spread; i <= spread; i++){
      const angle = i * 0.16;
      const ax = aim.x * Math.cos(angle) - aim.y * Math.sin(angle);
      const ay = aim.x * Math.sin(angle) + aim.y * Math.cos(angle);
      SG.eBullets.push({ x:b.x, y:b.y+b.h/2, vx:ax*3.6, vy:ay*3.6, w:5, h:9, color:'#ff66ff' });
    }
    if (rage >= 2){
      b.spinFire = (b.spinFire || 0) + 0.6;
      for (let k = 0; k < 2; k++){
        const a = b.spinFire + k * Math.PI;
        SG.eBullets.push({ x:b.x, y:b.y, vx: Math.cos(a)*2.8, vy: Math.sin(a)*2.8, w:5, h:5, color:'#ff99ff' });
      }
    }
  }
}

function updateBossHp(){
  const b = SG.boss;
  if (!b) return;
  const pct = Math.max(0, b.hp / b.maxHp);
  const fill = document.getElementById('spBossHpFill');
  fill.style.width = (pct * 100) + '%';
  const rage = bossRageForHp(b);
  fill.style.background = rage >= 2
    ? 'linear-gradient(90deg,#ff2020,#ff5500)'
    : rage >= 1 ? 'linear-gradient(90deg,#ff5020,#ffaa30)'
    : 'linear-gradient(90deg,#ff3030,#ff8030)';
}

function onBossDefeated(){
  const b = SG.boss;
  if (!b) return;
  SG.boss = null;
  document.getElementById('spBossHp').style.display = 'none';
  document.getElementById('spBossBanner').style.display = 'none';
  spSnd('boss_die');
  SG.score += 200 + SG.stage * 100;
  updateHud();
  // Advance stage
  SG.stage++;
  if (SG.stage >= SG.STAGES.length){
    // Loop with harder difficulty after final stage
    SG.stage = 0; // for now restart from first with harder waves
    SG.player.baseFireRate = Math.max(7, SG.player.baseFireRate - 1);
  }
  if ((SG.stage + 1) > SG.bestStage) SG.bestStage = SG.stage + 1;
  SG.wave = 0;
  SG.spawnTimer = 0; SG.spawnNext = 120;
  SG.enemies = []; SG.eBullets = [];
  initStars();
  showStageBanner();
  spSnd('stage');
  updateHud();
}

function showStageBanner(){
  const stage = cur();
  document.getElementById('spsbEmoji').textContent = stage.emoji;
  document.getElementById('spsbName').textContent = stage.name;
  const banner = document.getElementById('spStageBanner');
  banner.classList.remove('show');
  void banner.offsetWidth;
  banner.classList.add('show');
}

// === Power-ups ===
function maybeDropPowerup(x, y, baseChance){
  if (Math.random() > baseChance) return;
  // Weight: bomb + drones are rarer
  let pool = ['shield','shield','triple','triple','heart','drones','bomb'];
  const t = pool[Math.floor(Math.random() * pool.length)];
  SG.powerups.push({ x, y, vy:1.4, w:22, h:22, kind:t, bob:0 });
}

function checkPowerupPickup(){
  const p = SG.player;
  const pb = { x:p.x-p.w/2, y:p.y-p.h/2, w:p.w, h:p.h };
  for (let i = SG.powerups.length-1; i >= 0; i--){
    const pu = SG.powerups[i];
    if (rectOverlap(pb, { x:pu.x-pu.w/2, y:pu.y-pu.h/2, w:pu.w, h:pu.h })){
      applyPowerup(pu.kind);
      SG.powerups.splice(i, 1);
    }
  }
}

function applyPowerup(kind){
  spSnd('pup');
  if (kind === 'shield'){
    SG.shield = Math.max(SG.shield, 300); // 5 sec
  } else if (kind === 'triple'){
    SG.triple = Math.max(SG.triple, 600); // 10 sec
  } else if (kind === 'heart'){
    SG.lives = Math.min(5, SG.lives + 1);
  } else if (kind === 'bomb'){
    SG.bombs = Math.min(3, SG.bombs + 1);
    updateBombBtn();
  } else if (kind === 'rapid'){
    SG.rapid = Math.max(SG.rapid, 480);
  } else if (kind === 'drones'){
    SG.drones = Math.max(SG.drones, 720); // 12 sec
  }
  updateHud();
  updatePupChips();
}

window.spaceUseBomb = function(){
  if (SG.state !== 'running' || SG.bombs <= 0) return;
  SG.bombs--;
  spSnd('bomb');
  // Kill all on-screen enemies + e-bullets
  SG.enemies.forEach(e => {
    spawnExplosion(e.x, e.y, 1.0);
    SG.score += e.kill;
    SG.totalKills++;
  });
  SG.enemies = [];
  SG.eBullets = [];
  // Boss takes damage
  if (SG.boss && SG.boss.phase === 'fight'){
    SG.boss.hp = Math.max(0, SG.boss.hp - 6);
    updateBossHp();
    if (SG.boss.hp <= 0){ SG.boss.phase = 'dying'; SG.boss.t2 = 0; }
  }
  // Bomb shockwave: kit shake + flash + sparkle burst
  if (SG._gk){
    SG._gk.shake.kick(0.85);
    SG._gk.stop.hit(5);
    SG._flash = Math.min(0.7, (SG._flash || 0) + 0.55);
    SG._gk.particles.burst(SG.W/2, SG.H/2, {
      count: 40, palette: ['#ffe600','#ff8800','#fff'],
      speedMin: 2.5, speedMax: 7.5, size: 2, life: 36, lifeJitter: 12, shape: 'star'
    });
  }
  updateHud();
  updateBombBtn();
};
window.spaceFireCharged = function(){
  if (SG.state !== 'running' || SG.charge < 100) return;
  SG.charge = 0;
  updateChargeBtn();
  const px = SG.player.x, py = SG.player.y - SG.player.h/2;
  // Piercing laser beam — passes through everything, damage 5
  SG.bullets.push({
    x: px, y: py, vy: -14, w: 16, h: 30,
    piercing: true, damage: 5,
    hitIds: new Set(),
    color: '#fff',
    _laser: true
  });
  // Side beams (smaller, also piercing but damage 2)
  SG.bullets.push({ x: px - 18, y: py + 8, vy: -13, w: 8, h: 22, piercing: true, damage: 2, hitIds: new Set(), color:'#ddccff', _laser:true });
  SG.bullets.push({ x: px + 18, y: py + 8, vy: -13, w: 8, h: 22, piercing: true, damage: 2, hitIds: new Set(), color:'#ddccff', _laser:true });
  spSnd('charge');
};

// === Collisions ===
function rectOverlap(a, b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkCollisions(){
  // Player bullets vs enemies
  for (let i = SG.bullets.length-1; i >= 0; i--){
    const b = SG.bullets[i];
    const bb = { x:b.x - b.w/2, y:b.y - b.h/2, w:b.w, h:b.h };
    let hit = false;
    const dmg = b.damage || 1;
    for (let j = SG.enemies.length-1; j >= 0; j--){
      const e = SG.enemies[j];
      // Piercing bullets don't re-hit the same enemy
      if (b.hitIds && b.hitIds.has(e.id)) continue;
      const eb = { x:e.x - e.w/2, y:e.y - e.h/2, w:e.w, h:e.h };
      if (rectOverlap(bb, eb)){
        e.hp -= dmg;
        spSnd('enemy_hit');
        if (e.hp <= 0){
          spawnExplosion(e.x, e.y, 1.0);
          registerKill(e.kill);
          maybeDropPowerup(e.x, e.y, 0.16);
          e.dead = true;
        }
        if (b.hitIds) { b.hitIds.add(e.id); /* piercing continues */ }
        else { hit = true; break; }
      }
    }
    // Bullet vs boss (piercing still hits boss but only once)
    if (!hit && SG.boss && SG.boss.phase === 'fight' && !(b._hitBoss)){
      const bossBox = { x: SG.boss.x - SG.boss.w/2, y: SG.boss.y - SG.boss.h/2, w: SG.boss.w, h: SG.boss.h };
      if (rectOverlap(bb, bossBox)){
        SG.boss.hp = Math.max(0, SG.boss.hp - dmg);
        updateBossHp();
        spawnExplosion(b.x, b.y, 0.4);
        spSnd('enemy_hit');
        if (SG.boss.hp <= 0){ SG.boss.phase = 'dying'; SG.boss.t2 = 0; }
        if (b.piercing){ b._hitBoss = true; /* continues */ }
        else { hit = true; }
      }
    }
    if (hit){ SG.bullets.splice(i,1); }
  }
  // Enemy bullets vs player (skip if invincible/shield)
  if (SG.player.invincible <= 0 && SG.shield <= 0){
    const pb = { x: SG.player.x - SG.player.w/2 + 4, y: SG.player.y - SG.player.h/2 + 4, w: SG.player.w - 8, h: SG.player.h - 8 };
    for (let i = SG.eBullets.length-1; i >= 0; i--){
      const b = SG.eBullets[i];
      const bb = { x: b.x - b.w/2, y: b.y - b.h/2, w: b.w, h: b.h };
      if (rectOverlap(pb, bb)){
        playerHurt();
        SG.eBullets.splice(i, 1);
        return;
      }
    }
    // Player vs enemy collision
    for (const e of SG.enemies){
      const eb = { x: e.x - e.w/2, y: e.y - e.h/2, w: e.w, h: e.h };
      if (rectOverlap(pb, eb)){
        playerHurt();
        e.hp = 0; e.dead = true;
        spawnExplosion(e.x, e.y, 0.8);
        return;
      }
    }
  } else if (SG.shield > 0){
    // Shield absorbs e-bullets but doesn't drop
    const pb = { x: SG.player.x - 28, y: SG.player.y - 28, w: 56, h: 56 };
    for (let i = SG.eBullets.length-1; i >= 0; i--){
      const b = SG.eBullets[i];
      const bb = { x: b.x - b.w/2, y: b.y - b.h/2, w: b.w, h: b.h };
      if (rectOverlap(pb, bb)){
        spawnExplosion(b.x, b.y, 0.3);
        SG.eBullets.splice(i, 1);
      }
    }
  }
  // Powerup pickup
  checkPowerupPickup();
}

function registerKill(baseScore){
  SG.totalKills++;
  SG.killCombo++;
  SG.comboCool = 150; // ~2.5s window to keep the chain alive
  // Multiplier tiers: x2 after 5, x3 after 10, x4 after 18, x5 after 30
  let mult = 1;
  if (SG.killCombo >= 30) mult = 5;
  else if (SG.killCombo >= 18) mult = 4;
  else if (SG.killCombo >= 10) mult = 3;
  else if (SG.killCombo >= 5) mult = 2;
  if (mult !== SG.killMult){
    SG.killMult = mult;
    SG.comboFlash = 24;
    if (mult > 1) spSnd('pup');
  }
  SG.score += baseScore * SG.killMult;
}
function playerHurt(){
  SG.lives--;
  SG.player.invincible = 100; // ~1.6s
  // Getting hit breaks the kill chain
  SG.killCombo = 0; SG.killMult = 1;
  spSnd('hurt');
  spawnExplosion(SG.player.x, SG.player.y, 1.2);
  updateHud();
  if (SG.lives <= 0){ onSpaceDeath(); }
}

function spawnExplosion(x, y, scale){
  scale = scale || 1;
  // Boot kit lazily (so we don't add init coupling)
  if (!SG._gk){
    SG._gk = {
      particles: new GameKit.ParticleSystem(512),
      shake: new GameKit.Shake(),
      stop: new GameKit.HitStop()
    };
    SG._flash = 0;
  }
  const ps = SG._gk.particles;
  // Outer hot fireball
  ps.burst(x, y, {
    count: Math.floor(18 * scale),
    palette: ['#fff8c8','#ffe066','#ff9b2a','#ff4a18','#a01010'],
    speedMin: 1.4 * scale,
    speedMax: 4.5 * scale,
    size: 2 + scale,
    life: 26 + scale * 8,
    lifeJitter: 14,
    shape: 'circle'
  });
  // Spark trails
  ps.burst(x, y, {
    count: Math.floor(8 * scale),
    palette: ['#ffffff','#fff0b0','#ffd66a'],
    speedMin: 2.5 * scale,
    speedMax: 5.5 * scale,
    size: 1.2,
    life: 18,
    lifeJitter: 8,
    shape: 'rect'
  });
  // Smoke fade
  ps.burst(x, y, {
    count: Math.floor(6 * scale),
    palette: ['rgba(120,90,80,1)','rgba(80,60,55,1)'],
    speedMin: 0.3,
    speedMax: 0.9,
    size: 3 + scale,
    life: 50,
    lifeJitter: 20,
    shape: 'circle',
    gravity: -0.04
  });
  // Game-feel: kick the camera + flash + brief freeze proportional to magnitude
  SG._gk.shake.kick(0.18 * scale);
  SG._flash = Math.min(0.55, (SG._flash || 0) + 0.18 * scale);
  if (scale >= 1.0) SG._gk.stop.hit(scale >= 1.4 ? 4 : 2);
}

// === HUD ===
function updateHud(){
  document.getElementById('spLives').textContent = SG.lives;
  document.getElementById('spStageLbl').textContent = (SG.stage + 1) + '/3';
  document.getElementById('spScore').textContent = String(Math.floor(SG.score)).padStart(5, '0');
}
function updateBombBtn(){
  const btn = document.getElementById('spBombBtn');
  if (!btn) return;
  if (SG.bombs > 0){
    btn.classList.add('has');
    document.getElementById('spBombCount').textContent = SG.bombs;
  } else {
    btn.classList.remove('has');
  }
}
function updateChargeBtn(){
  const btn = document.getElementById('spChargeBtn');
  if (!btn) return;
  const fill = document.getElementById('spChargeFill');
  if (fill) fill.style.height = SG.charge + '%';
  btn.classList.toggle('ready', SG.charge >= 100);
}
function updatePupChips(){
  const wrap = document.getElementById('spPupActive');
  if (!wrap) return;
  const chips = [];
  if (SG.shield > 0) chips.push('<div class="sp-pup-chip">🛡️ <span>'+Math.ceil(SG.shield/60)+'</span></div>');
  if (SG.triple > 0) chips.push('<div class="sp-pup-chip">🔫 <span>'+Math.ceil(SG.triple/60)+'</span></div>');
  if (SG.rapid > 0) chips.push('<div class="sp-pup-chip">⚡ <span>'+Math.ceil(SG.rapid/60)+'</span></div>');
  if (SG.drones > 0) chips.push('<div class="sp-pup-chip">🛸 <span>'+Math.ceil(SG.drones/60)+'</span></div>');
  wrap.innerHTML = chips.join('');
}

// === Draw ===
function drawFrame(){
  const ctx = SG.ctx;
  if (!ctx) return;
  const stage = cur();
  // Apply camera shake at the top of the frame, restore at the end
  ctx.save();
  if (SG._gk && SG._gk.shake) SG._gk.shake.apply(ctx);
  // Background gradient
  const g = ctx.createLinearGradient(0, 0, 0, SG.H);
  g.addColorStop(0, stage.bgTop);
  g.addColorStop(1, stage.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SG.W, SG.H);
  // Stars
  ctx.fillStyle = stage.starColor;
  SG.stars.forEach(s => {
    ctx.globalAlpha = clamp(s.r / 2, 0.3, 1);
    ctx.fillRect(s.x, s.y, s.r, s.r);
  });
  ctx.globalAlpha = 1;
  // Powerups
  SG.powerups.forEach(p => drawPowerup(ctx, p));
  // Enemies
  SG.enemies.forEach(e => drawEnemy(ctx, e));
  // Bullets
  SG.bullets.forEach(b => drawBullet(ctx, b, '#00ff88'));
  SG.eBullets.forEach(b => drawBullet(ctx, b, b.color || '#ff4444'));
  // Boss
  if (SG.boss) drawBoss(ctx, SG.boss);
  // Particles
  SG.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  });
  // Player
  drawPlayer(ctx);
  // Kill-combo multiplier (canvas, top-center)
  if (SG.killMult > 1){
    const grow = SG.comboFlash > 0 ? 1 + (SG.comboFlash / 24) * 0.5 : 1;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold ' + Math.round(24 * grow) + 'px "Courier New", monospace';
    const mc = SG.killMult >= 5 ? '#ff3030' : SG.killMult >= 4 ? '#ff8800' : SG.killMult >= 3 ? '#ffe600' : '#00ff88';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('x' + SG.killMult, SG.W/2 + 1, 9);
    ctx.fillStyle = mc;
    ctx.fillText('x' + SG.killMult, SG.W/2, 8);
    ctx.font = 'bold 11px "Tajawal", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('سلسلة ' + SG.killCombo, SG.W/2, 34);
    ctx.restore();
  }
  // Graze flash indicator near the ship
  if (SG.grazeFlash > 0){
    ctx.save();
    ctx.globalAlpha = SG.grazeFlash / 12;
    ctx.fillStyle = '#66ccff';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+5 مراوغة', SG.player.x, SG.player.y - 34);
    ctx.restore();
  }
  // Boss UI is in DOM
  // Pooled GameKit particles drawn additively for explosion glow
  if (SG._gk && SG._gk.particles) SG._gk.particles.draw(ctx, { additive: true });
  // Release camera shake transform before drawing the flash overlay
  ctx.restore();
  // Screen flash on big impacts (stays in screen-space, no shake)
  if (SG._flash > 0){
    GameKit.flashRect(ctx, SG.W, SG.H, '#fff6c8', Math.min(0.55, SG._flash));
  }
  // Update HUD
  updateHud();
  updatePupChips();
}

function drawPlayer(ctx){
  if (SG.player.invincible > 0 && Math.floor(SG.player.invincible / 4) % 2 === 0) return;
  const x = SG.player.x, y = SG.player.y;
  // Drone wingmen (drawn behind ship so they look like escorts)
  if (SG.drones > 0){
    const bob = Math.sin(performance.now() * 0.012) * 2;
    drawDrone(ctx, x - 28, y + 12 + bob);
    drawDrone(ctx, x + 28, y + 12 - bob);
  }
  // Ship body
  ctx.fillStyle = '#00ff88';
  // Triangle nose
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x - 14, y + 12);
  ctx.lineTo(x + 14, y + 12);
  ctx.closePath();
  ctx.fill();
  // Wings
  ctx.fillRect(x - 18, y + 4, 6, 12);
  ctx.fillRect(x + 12, y + 4, 6, 12);
  // Cockpit
  ctx.fillStyle = '#cce6ff';
  ctx.fillRect(x - 3, y - 8, 6, 6);
  // Engine trail
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(x - 4, y + 12, 3, 6);
  ctx.fillRect(x + 1, y + 12, 3, 6);
  // Shield ring
  if (SG.shield > 0){
    ctx.strokeStyle = 'rgba(120,200,255,' + (0.5 + 0.4 * Math.sin(SG.shield * 0.2)) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI*2);
    ctx.stroke();
  }
}
function drawDrone(ctx, x, y){
  ctx.save();
  // Halo
  ctx.fillStyle = 'rgba(160,216,255,0.25)';
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI*2);
  ctx.fill();
  // Body (smaller triangle ship)
  ctx.fillStyle = '#a0d8ff';
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x - 7, y + 6);
  ctx.lineTo(x + 7, y + 6);
  ctx.closePath();
  ctx.fill();
  // Wing tips
  ctx.fillRect(x - 9, y + 2, 3, 6);
  ctx.fillRect(x + 6, y + 2, 3, 6);
  // Glow dot
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 1, y - 4, 2, 3);
  // Engine
  ctx.fillStyle = '#66bbff';
  ctx.fillRect(x - 2, y + 6, 4, 3);
  ctx.restore();
}

function drawEnemy(ctx, e){
  if (e.type === 'asteroid'){
    drawAsteroid(ctx, e);
    return;
  }
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.type === 'scout'){
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-12, -10);
    ctx.lineTo(12, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-3, -4, 6, 4);
  } else if (e.type === 'fighter'){
    ctx.fillStyle = '#ff8833';
    ctx.fillRect(-14, -10, 28, 18);
    ctx.fillStyle = '#aa5500';
    ctx.fillRect(-16, -2, 32, 6);
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-3, -7, 6, 6);
  } else if (e.type === 'drone'){
    ctx.fillStyle = '#ff66ff';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-2, -2, 4, 4);
  } else if (e.type === 'sniper'){
    ctx.fillStyle = '#cc44ff';
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-6, -12);
    ctx.lineTo(6, -12);
    ctx.lineTo(14, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(-4, -6, 8, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-1, -4, 2, 2);
  }
  ctx.restore();
}

function drawAsteroid(ctx, e){
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rot || 0);
  ctx.fillStyle = '#7a5a30';
  ctx.beginPath();
  ctx.moveTo(-18, -4);
  ctx.lineTo(-14, -16);
  ctx.lineTo(-2, -18);
  ctx.lineTo(12, -14);
  ctx.lineTo(18, -2);
  ctx.lineTo(14, 12);
  ctx.lineTo(0, 18);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-6, -8, 6, 4);
  ctx.fillRect(2, 2, 5, 4);
  ctx.restore();
}

function drawBullet(ctx, b, color){
  if (b._laser) {
    // Charged laser — outer glow, white core, purple highlight
    ctx.fillStyle = 'rgba(170,120,255,0.4)';
    ctx.fillRect(b.x - b.w/2 - 4, b.y - b.h/2 - 6, b.w + 8, b.h + 12);
    ctx.fillStyle = 'rgba(170,120,255,0.7)';
    ctx.fillRect(b.x - b.w/2 - 2, b.y - b.h/2 - 3, b.w + 4, b.h + 6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
    ctx.fillStyle = 'rgba(200,180,255,0.9)';
    ctx.fillRect(b.x - 1, b.y - b.h/2, 2, b.h);
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);
}

function drawPowerup(ctx, p){
  const bob = Math.sin(p.bob) * 3;
  const x = p.x, y = p.y + bob;
  const colors = { shield:'#66bbff', triple:'#ff8800', heart:'#ff3344', bomb:'#ff6600', rapid:'#ffe600', drones:'#a0d8ff' };
  const icon = { shield:'🛡', triple:'🔫', heart:'❤', bomb:'💣', rapid:'⚡', drones:'🛸' };
  ctx.save();
  // Halo
  const g = ctx.createRadialGradient(x, y, 2, x, y, 18);
  g.addColorStop(0, (colors[p.kind] || '#fff') + 'cc');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 18, y - 18, 36, 36);
  // Box
  ctx.fillStyle = colors[p.kind] || '#fff';
  ctx.fillRect(x - 10, y - 10, 20, 20);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 10, y - 10, 20, 20);
  // Icon (text)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Tajawal", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon[p.kind] || '?', x, y + 1);
  ctx.restore();
}

function drawBoss(ctx, b){
  ctx.save();
  ctx.translate(b.x, b.y);
  // Rage aura glow
  if (b.rage >= 1 && b.phase === 'fight'){
    const auraR = Math.max(b.w, b.h) * 0.7;
    const aura = ctx.createRadialGradient(0, 0, auraR*0.5, 0, 0, auraR);
    const ac = b.rage >= 2 ? '255,60,30' : '255,150,30';
    aura.addColorStop(0, 'rgba('+ac+',0)');
    aura.addColorStop(1, 'rgba('+ac+',' + (0.18 + 0.12*Math.sin(b.t*0.15)) + ')');
    ctx.fillStyle = aura;
    ctx.fillRect(-auraR, -auraR, auraR*2, auraR*2);
  }
  // Phase-transition flash
  if (b.flash > 0 && Math.floor(b.flash/3) % 2 === 0){
    ctx.globalAlpha = 0.85;
  }
  if (b.id === 'carrier'){
    ctx.fillStyle = '#cc3344';
    ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
    ctx.fillStyle = '#882233';
    ctx.fillRect(-b.w/2 + 8, -b.h/2 + 8, b.w - 16, b.h - 16);
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-b.w/2 + 16, b.h/2 - 14, 12, 8);
    ctx.fillRect(b.w/2 - 28, b.h/2 - 14, 12, 8);
    ctx.fillRect(-6, b.h/2 - 14, 12, 8);
  } else if (b.id === 'megaasteroid'){
    ctx.rotate((b.rot || 0));
    ctx.fillStyle = '#8a6a40';
    ctx.beginPath();
    const r = b.w/2;
    for (let i = 0; i < 10; i++){
      const a = (i / 10) * Math.PI * 2;
      const rr = r * (0.85 + Math.sin(i * 1.3) * 0.15);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(-15, -12, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, 14, 12, 0, Math.PI*2); ctx.fill();
  } else if (b.id === 'destroyer'){
    ctx.fillStyle = '#aa44cc';
    ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
    ctx.fillStyle = '#7722aa';
    ctx.fillRect(-b.w/2 + 4, -b.h/2 + 4, b.w - 8, b.h - 8);
    ctx.fillStyle = '#ff44ff';
    // Turrets
    for (let i = -1; i <= 1; i++){
      ctx.fillRect(i * 50 - 8, b.h/2 - 12, 16, 8);
    }
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(-6, -8, 12, 6);
  }
  ctx.restore();
}

function onSpaceDeath(){
  SG.state = 'dead';
  cancelAnimationFrame(SG.raf);
  spSnd('death');
  const final = Math.floor(SG.score);
  const isRecord = final > SG.best;
  if (isRecord) SG.best = final;
  try {
    if (typeof updateProfileStat === 'function'){
      updateProfileStat('space', (s) => {
        s.games = (s.games || 0) + 1;
        s.totalKills = (s.totalKills || 0) + SG.totalKills;
        if (final > (s.bestScore || 0)) s.bestScore = final;
        if (SG.bestStage > (s.bestStage || 1)) s.bestStage = SG.bestStage;
      });
    }
  } catch(e){}
  try { if (typeof renderBadges === 'function') renderBadges(); } catch(e){}
  try { if (typeof spaceLeaderboardSubmit === 'function') spaceLeaderboardSubmit(final); } catch(e){}
  document.getElementById('spFinalScore').textContent = String(final).padStart(5, '0');
  document.getElementById('spFinalBest').textContent = SG.best;
  document.getElementById('spFinalNewRec').style.display = isRecord ? 'block' : 'none';
  document.getElementById('spaceOverOverlay').style.display = 'flex';
  document.getElementById('spBossHp').style.display = 'none';
  document.getElementById('spBossBanner').style.display = 'none';
}
})();
