
(function(){
const DG = {
  W: 720, H: 280, GROUND_Y: 234, DINO_X: 60,
  DINO_W: 50, DINO_H: 56, DUCK_W: 68, DUCK_H: 34,
  GRAVITY: 0.62, JUMP_VEL: -13.6,
  START_SPEED: 6.5, MAX_SPEED: 14, SPEED_INC: 0.0012,
  SCORE_PER_FRAME: 0.1,
  BIRD_AFTER: 120, ROCK_AFTER: 60, PALM_AFTER: 200,
  HEART_PERIOD_MIN: 400, HEART_PERIOD_MAX: 700,
  MAX_HEARTS: 3, INVINCIBLE_FRAMES: 80,
  BOSS_EVERY: 500, BOSS_DURATION: 250, // score units boss round lasts
  MILESTONES: [50, 100, 250, 500, 1000, 2000, 5000],
  SKINS: [
    { id:'dino',  name:'ديناصور', emoji:'🦖', color:'#c9a84c', acc:'#8b6e1f' },
    { id:'camel', name:'جمل',     emoji:'🐪', color:'#c89368', acc:'#6e4a2a' },
    { id:'fox',   name:'ثعلب',    emoji:'🦊', color:'#d97706', acc:'#7a3d04' }
  ],
  DJUMP_DURATION: 720, // frames of double-jump ability (~12s)
  DJUMP_PERIOD_MIN: 650, DJUMP_PERIOD_MAX: 1100,
  COMBO_TIERS: [ {n:3,mult:2}, {n:7,mult:3}, {n:12,mult:4}, {n:20,mult:5} ],
  ctx: null, canvas: null,
  state: 'idle', speed: 6.5, score: 0, bestScore: 0,
  dinoY: 0, dinoVy: 0, isDucking: false,
  hearts: 3, invincible: 0, hitFlash: 0,
  combo: 0, multiplier: 1, comboFlash: 0,
  djumpTimer: 0, jumpsUsed: 0, djumpTimer2: 0, djumpFx: 0,
  magnetTimer: 0,
  panicSlow: 0,
  obstacles: [], collectibles: [],
  spawnTimer: 0, spawnNext: 80,
  heartTimer: 0, heartNext: 500,
  djumpSpawnTimer: 0, djumpSpawnNext: 700,
  ground: 0, clouds: [], cloudTimer: 0,
  isNight: false, lastTime: 0, raf: 0,
  legPhase: 0, birdPhase: 0,
  skin: 'dino',
  bossActive: false, bossDefeatedCount: 0,
  bossEndScore: 0, peacefulUntil: 0,
  realBoss: null, bossHpEl: null,
  reachedMilestones: new Set(),
  biomeIdx: 0, particles: [], particleTimer: 0,
  BIOMES: [
    {
      id:'desert', name:'الصحراء', emoji:'🏜️',
      bgTop:'#0e1014', bgMid:'#1a1d24', bgBot:'#0e1014',
      accent:'#c9a84c', accentDark:'#8b6e1f',
      ground:'#c9a84c', hill:'rgba(60,55,40,0.45)', cloud:'rgba(255,255,255,0.78)',
      obstacles:[
        {kind:'cactus_thin',  w:5}, {kind:'cactus_tall', w:5},
        {kind:'cactus_cluster',w:4}, {kind:'cactus_twisted',w:3},
        {kind:'cactus_flower',w:3}, {kind:'rock', w:3, after:60},
        {kind:'palm', w:2, after:200},
        {kind:'bird_low',w:3,after:120}, {kind:'bird_mid',w:3,after:120}, {kind:'bird_high',w:2,after:120}
      ],
      particle:null
    },
    {
      id:'winter', name:'الشتاء', emoji:'❄️',
      bgTop:'#1a3050', bgMid:'#2a4a70', bgBot:'#0e2040',
      accent:'#e8f0fa', accentDark:'#5a7090',
      ground:'#a8c8e8', hill:'rgba(180,200,230,0.45)', cloud:'rgba(230,235,245,0.78)',
      obstacles:[
        {kind:'snowpile',  w:5}, {kind:'snowpile_big', w:4},
        {kind:'snowman',w:4}, {kind:'icicle',w:4,after:60},
        {kind:'iceblock',w:3,after:100},
        {kind:'owl_low',w:3,after:120}, {kind:'owl_mid',w:3,after:120}, {kind:'owl_high',w:2,after:120}
      ],
      particle:'snow'
    },
    {
      id:'volcano', name:'البركان', emoji:'🌋',
      bgTop:'#2a0805', bgMid:'#4a1810', bgBot:'#1a0204',
      accent:'#ef6044', accentDark:'#7c1d1d',
      ground:'#b8442a', hill:'rgba(80,30,20,0.6)', cloud:'rgba(60,40,30,0.7)',
      obstacles:[
        {kind:'lavarock',  w:5}, {kind:'lavarock_big', w:4},
        {kind:'flame',w:4}, {kind:'flame_tall',w:3,after:60},
        {kind:'volcanobomb',w:3,after:100},
        {kind:'bat_low',w:3,after:120}, {kind:'bat_mid',w:3,after:120}, {kind:'bat_high',w:2,after:120}
      ],
      particle:'ember'
    }
  ],
  _bound: false, _btnBound: false
};
window.DINO_GAME = DG;

function dinoSound(name) {
  if (typeof isMuted !== 'undefined' && isMuted) return;
  if (typeof playTone !== 'function') return;
  switch (name) {
    case 'jump':
      playTone(523, 0.07, 'triangle', 0.18);
      setTimeout(() => playTone(880, 0.09, 'triangle', 0.14), 45);
      break;
    case 'hit':
      playTone(220, 0.12, 'sawtooth', 0.28);
      setTimeout(() => playTone(165, 0.18, 'sawtooth', 0.22), 90);
      break;
    case 'heart':
      playTone(784, 0.07, 'triangle', 0.22);
      setTimeout(() => playTone(1046, 0.09, 'triangle', 0.22), 55);
      setTimeout(() => playTone(1568, 0.14, 'triangle', 0.20), 120);
      break;
    case 'milestone':
      playTone(523, 0.1, 'triangle', 0.22);
      setTimeout(() => playTone(659, 0.1, 'triangle', 0.22), 80);
      setTimeout(() => playTone(784, 0.12, 'triangle', 0.22), 160);
      setTimeout(() => playTone(1046, 0.18, 'triangle', 0.20), 240);
      break;
    case 'bossStart':
      playTone(98, 0.32, 'sawtooth', 0.28);
      setTimeout(() => playTone(82, 0.4, 'sawtooth', 0.24), 220);
      setTimeout(() => playTone(110, 0.3, 'square', 0.18), 480);
      break;
    case 'bossWin':
      [523, 659, 784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 'triangle', 0.28), i * 80));
      break;
    case 'death':
      [440, 370, 294, 220, 165].forEach((f, i) => setTimeout(() => playTone(f, 0.26, 'sawtooth', 0.22), i * 150));
      break;
  }
}

function loadSkin() {
  try { const v = localStorage.getItem('dinoSkin'); if (v && DG.SKINS.find(s=>s.id===v)) DG.skin = v; } catch(e){}
}
function saveSkin() { try { localStorage.setItem('dinoSkin', DG.skin); } catch(e){} }
function getSkin() { return DG.SKINS.find(s=>s.id===DG.skin) || DG.SKINS[0]; }
function getBiome() { return DG.BIOMES[DG.biomeIdx % DG.BIOMES.length]; }
window.syncDinoMuteIcon = function() {
  const b = document.getElementById('dinoMuteBtn');
  if (b) b.textContent = (typeof isMuted !== 'undefined' && isMuted) ? '🔇' : '🔊';
};
function showBiomeBanner(biome) {
  const el = document.getElementById('dinoBiomeBanner');
  const em = document.getElementById('dbbEmoji');
  const nm = document.getElementById('dbbName');
  if (!el || !em || !nm) return;
  em.textContent = biome.emoji;
  nm.textContent = biome.name;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  const chip = document.getElementById('dinoBiomeChip');
  const cn = document.getElementById('dinoBiomeName');
  if (chip && cn) { chip.style.display = 'inline-flex'; cn.textContent = biome.emoji + ' ' + biome.name; }
}

function renderSkinPicker() {
  const wrap = document.getElementById('dinoSkinPicker');
  if (!wrap) return;
  wrap.innerHTML = DG.SKINS.map(s =>
    '<div class="do-skin' + (s.id===DG.skin?' active':'') + '" data-skin="'+s.id+'">' +
    '<div class="do-skin-icon">'+s.emoji+'</div>' +
    '<div class="do-skin-name">'+s.name+'</div>' +
    '</div>'
  ).join('');
  Array.from(wrap.children).forEach(el => {
    el.addEventListener('click', () => {
      DG.skin = el.dataset.skin;
      saveSkin();
      renderSkinPicker();
      document.getElementById('dinoStartEmoji').textContent = getSkin().emoji;
      drawDinoFrame(false);
    });
  });
  document.getElementById('dinoStartEmoji').textContent = getSkin().emoji;
}

window.playDino = function() {
  if (typeof hideAllScreens === 'function') hideAllScreens();
  const scr = document.getElementById('dinoScreen');
  if (!scr) return;
  scr.style.display = 'flex';
  document.body.classList.add('dino-active');
  if (typeof _setNavShow === 'function') _setNavShow(false);
  initDino();
};
window.exitDino = function() {
  dinoStop();
  resetDinoState();
  document.body.classList.remove('dino-active');
  document.getElementById('dinoStartOverlay').style.display = 'flex';
  document.getElementById('dinoGameOverOverlay').style.display = 'none';
  if (typeof returnFromGame === 'function') returnFromGame();
  else if (typeof goToLanding === 'function') goToLanding();
};
function initDino() {
  DG.canvas = document.getElementById('dinoCanvas');
  DG.ctx = DG.canvas.getContext('2d');
  loadSkin();
  renderSkinPicker();
  try {
    const p = (typeof loadProfile === 'function') ? loadProfile() : null;
    DG.bestScore = (p && p.stats && p.stats.dino && p.stats.dino.bestScore) || 0;
  } catch(e) { DG.bestScore = 0; }
  document.getElementById('dinoBestDisplay').textContent = DG.bestScore;
  document.getElementById('dinoScoreDisplay').textContent = 0;
  resetDinoState();
  updateHeartsUI();
  drawDinoFrame(false);
  if (!DG._bound) { bindDinoControls(); DG._bound = true; }
  if (!DG._btnBound) { bindButtonControls(); DG._btnBound = true; }
  document.getElementById('dinoStartOverlay').style.display = 'flex';
  document.getElementById('dinoGameOverOverlay').style.display = 'none';
  document.getElementById('dinoBossBanner').style.display = 'none';
  DG.canvas.classList.remove('boss-mode');
  if (typeof window.syncDinoMuteIcon === 'function') window.syncDinoMuteIcon();
}
function resetDinoState() {
  DG.state = 'idle';
  DG.speed = DG.START_SPEED;
  DG.score = 0;
  DG.dinoY = 0; DG.dinoVy = 0; DG.isDucking = false;
  DG.hearts = DG.MAX_HEARTS;
  DG.invincible = 0; DG.hitFlash = 0;
  DG.combo = 0; DG.multiplier = 1; DG.comboFlash = 0;
  DG.djumpTimer = 0; DG.jumpsUsed = 0; DG.djumpFx = 0;
  DG.magnetTimer = 0;
  DG.panicSlow = 0;
  DG.obstacles = []; DG.collectibles = [];
  DG.spawnTimer = 0; DG.spawnNext = 90;
  DG.heartTimer = 0; DG.heartNext = 400 + Math.random()*300;
  DG.djumpSpawnTimer = 0; DG.djumpSpawnNext = 600 + Math.random()*400;
  DG.ground = 0;
  DG.clouds = [{x:200,y:38},{x:440,y:60},{x:640,y:28}];
  DG.cloudTimer = 0;
  DG.isNight = false;
  DG.legPhase = 0; DG.birdPhase = 0;
  DG.bossActive = false;
  DG.bossEndScore = 0;
  DG.peacefulUntil = 0;
  DG.bossDefeatedCount = 0;
  DG.realBoss = null;
  DG.reachedMilestones = new Set();
  DG.biomeIdx = 0;
  DG.particles = []; DG.particleTimer = 0;
  const chip = document.getElementById('dinoBiomeChip');
  if (chip) { chip.style.display = 'none'; }
}
window.dinoStart = function() {
  document.getElementById('dinoStartOverlay').style.display = 'none';
  document.getElementById('dinoGameOverOverlay').style.display = 'none';
  resetDinoState();
  updateHeartsUI();
  DG.state = 'running';
  DG.lastTime = performance.now();
  cancelAnimationFrame(DG.raf);
  if (DG._gk){
    if (DG._gk.particles) DG._gk.particles.clear();
    if (DG._gk.shake) DG._gk.shake.trauma = 0;
    if (DG._gk.stop) DG._gk.stop.timer = 0;
  }
  DG.raf = requestAnimationFrame(dinoLoop);
};
function dinoStop() {
  cancelAnimationFrame(DG.raf);
  DG.state = 'idle';
}
function dinoLoop(t) {
  if (DG.state !== 'running') return;
  const rawDt = Math.min(40, t - DG.lastTime) / 16.667;
  DG.lastTime = t;
  let dt = rawDt;
  if (DG._gk && DG._gk.stop){
    const scale = DG._gk.stop.tick(rawDt);
    dt = rawDt * scale;
  }
  updateDino(dt);
  if (DG._gk){
    if (DG._gk.particles) DG._gk.particles.update(rawDt);
    if (DG._gk.shake) DG._gk.shake.update(rawDt, { maxOffset: 7, maxRot: 0.018, decay: 0.06 });
  }
  if (DG.state !== 'running') return;
  drawDinoFrame(false);
  DG.raf = requestAnimationFrame(dinoLoop);
}
function updateDino(dt) {
  DG.speed = Math.min(DG.MAX_SPEED, DG.speed + DG.SPEED_INC * dt);
  const prevScore = Math.floor(DG.score);
  DG.score += DG.SCORE_PER_FRAME * dt * DG.multiplier;
  const curScore = Math.floor(DG.score);
  if (DG.comboFlash > 0) DG.comboFlash -= dt;
  if (DG.djumpFx > 0) DG.djumpFx -= dt;
  // Panic slow-mo when on last heart — world moves slower, scoring unchanged
  const targetSlow = (DG.hearts === 1 && !DG.realBoss) ? 1 : 0;
  if (DG.panicSlow < targetSlow) DG.panicSlow = Math.min(1, DG.panicSlow + dt * 0.06);
  else if (DG.panicSlow > targetSlow) DG.panicSlow = Math.max(0, DG.panicSlow - dt * 0.08);
  const slowMult = 1 - DG.panicSlow * 0.4; // up to 40% slower world
  const worldDt = dt * slowMult;
  // Double-jump ability countdown
  if (DG.djumpTimer > 0) {
    DG.djumpTimer -= dt;
    if (DG.djumpTimer <= 0) { DG.djumpTimer = 0; showMilestone('🪽 انتهى القفز المزدوج'); }
  }
  const scoreEl = document.getElementById('dinoScoreDisplay');
  scoreEl.textContent = curScore;
  // Milestones
  for (const m of DG.MILESTONES) {
    if (curScore >= m && !DG.reachedMilestones.has(m)) {
      DG.reachedMilestones.add(m);
      showMilestone('🎯 ' + m + ' نقطة!');
      pulseScore();
      dinoSound('milestone');
    }
  }
  // Boss spawn trigger
  if (!DG.bossActive && curScore > 0 && curScore % DG.BOSS_EVERY === 0 && curScore !== prevScore) {
    startRealBoss();
  }
  if (DG.realBoss) updateRealBoss(dt);
  // Day/night based on score
  const nightPhase = Math.floor(DG.score / 700);
  DG.isNight = (nightPhase % 2 === 1);
  // Invincibility tick
  if (DG.invincible > 0) DG.invincible -= dt;
  if (DG.hitFlash > 0) DG.hitFlash -= dt;
  // Physics
  if (DG.dinoY < 0 || DG.dinoVy < 0) {
    DG.dinoVy += DG.GRAVITY * dt;
    DG.dinoY += DG.dinoVy * dt;
    if (DG.dinoY >= 0) { DG.dinoY = 0; DG.dinoVy = 0; DG.jumpsUsed = 0; }
  }
  if (DG.dinoY === 0) DG.legPhase += dt * 0.35;
  DG.birdPhase += dt * 0.22;
  DG.ground = (DG.ground - DG.speed * worldDt) % 24;
  DG.clouds.forEach(c => { c.x -= DG.speed * 0.3 * worldDt; });
  DG.clouds = DG.clouds.filter(c => c.x > -50);
  DG.cloudTimer += dt;
  if (DG.cloudTimer > 220) {
    DG.cloudTimer = 0;
    DG.clouds.push({ x: DG.W + 40, y: 18 + Math.random() * 80 });
  }
  // Spawn obstacles (skip during peaceful or while real boss is alive — boss spawns its own)
  if (curScore >= DG.peacefulUntil && !DG.realBoss) {
    DG.spawnTimer += dt;
    if (DG.spawnTimer > DG.spawnNext) {
      spawnObstacle();
      DG.spawnTimer = 0;
      const speedFactor = (DG.speed - DG.START_SPEED) * 5;
      let base = 75 + Math.random() * 75 - speedFactor;
      DG.spawnNext = Math.max(42, base);
    }
  } else {
    DG.spawnTimer = 0;
    DG.spawnNext = 70;
  }
  // Spawn collectible heart (only when hearts < max)
  if (DG.hearts < DG.MAX_HEARTS) {
    DG.heartTimer += dt;
    if (DG.heartTimer > DG.heartNext) {
      spawnHeart();
      DG.heartTimer = 0;
      DG.heartNext = (DG.HEART_PERIOD_MIN + Math.random() * (DG.HEART_PERIOD_MAX - DG.HEART_PERIOD_MIN));
    }
  } else {
    DG.heartTimer = 0;
  }
  // Spawn a power-up (double-jump or magnet) when none active, after score 100
  if (curScore > 100 && DG.djumpTimer <= 0 && DG.magnetTimer <= 0 && !DG.bossActive) {
    DG.djumpSpawnTimer += dt;
    if (DG.djumpSpawnTimer > DG.djumpSpawnNext) {
      spawnDinoPowerup();
      DG.djumpSpawnTimer = 0;
      DG.djumpSpawnNext = DG.DJUMP_PERIOD_MIN + Math.random() * (DG.DJUMP_PERIOD_MAX - DG.DJUMP_PERIOD_MIN);
    }
  }
  // Magnet timer + pull collectibles toward dino
  if (DG.magnetTimer > 0) {
    DG.magnetTimer -= dt;
    if (DG.magnetTimer <= 0) { DG.magnetTimer = 0; showMilestone('🧲 انتهى المغناطيس'); }
    const dcx = DG.DINO_X + DG.DINO_W/2, dcy = DG.GROUND_Y - DG.DINO_H/2 + DG.dinoY;
    DG.collectibles.forEach(c => {
      if (c.kind === 'djump' || c.kind === 'magnet') return; // don't pull power-ups
      const ccx = c.x + c.w/2, ccy = c.y + c.h/2;
      const dx = dcx - ccx, dy = dcy - ccy;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 280) {
        const pull = 4.2 * dt;
        c.x += (dx / dist) * pull * 1.4;
        c.y += (dy / dist) * pull;
      }
    });
  }
  // Move obstacles & collectibles + combo tracking on pass
  DG.obstacles.forEach(o => {
    o.x -= DG.speed * worldDt;
    if (o.bob) o.bobPhase += dt * 0.18;
    if (!o.passed && o.x + o.w < DG.DINO_X) {
      o.passed = true;
      onObstacleCleared();
      if (o.fromBoss && DG.realBoss) damageRealBoss();
    }
  });
  DG.obstacles = DG.obstacles.filter(o => o.x + o.w > -30);
  DG.collectibles.forEach(c => { c.x -= DG.speed * worldDt; c.bobPhase += dt * 0.2; });
  DG.collectibles = DG.collectibles.filter(c => c.x + c.w > -30);
  // Collision (skip if invincible)
  const dinoBox = getDinoBox();
  if (DG.invincible <= 0) {
    for (const o of DG.obstacles) {
      if (boxesIntersect(dinoBox, getObstacleBox(o))) {
        onHit();
        if (DG.state !== 'running') return;
        break;
      }
    }
  }
  // Collect heart / power-up
  for (let i = DG.collectibles.length - 1; i >= 0; i--) {
    const c = DG.collectibles[i];
    if (boxesIntersect(dinoBox, { x:c.x, y:c.y, w:c.w, h:c.h })) {
      DG.collectibles.splice(i, 1);
      if (c.kind === 'djump') {
        DG.djumpTimer = DG.DJUMP_DURATION;
        DG.djumpFx = 18;
        showMilestone('🪽 قفز مزدوج!');
        dinoSound('heart');
      } else if (c.kind === 'magnet') {
        DG.magnetTimer = 360;
        showMilestone('🧲 مغناطيس القلوب!');
        dinoSound('heart');
      } else if (DG.hearts < DG.MAX_HEARTS) {
        DG.hearts++;
        updateHeartsUI(true);
        showMilestone('💖 +1');
        dinoSound('heart');
      } else {
        DG.score += 25;
        showMilestone('+25');
        dinoSound('heart');
      }
    }
  }
}
function onObstacleCleared() {
  DG.combo++;
  let mult = 1;
  for (const tier of DG.COMBO_TIERS) { if (DG.combo >= tier.n) mult = tier.mult; }
  if (mult !== DG.multiplier) {
    DG.multiplier = mult;
    DG.comboFlash = 30;
    if (mult > 1) { showMilestone('🔥 ×' + mult + ' كومبو!'); dinoSound('milestone'); }
  }
}
function spawnDinoPowerup() {
  const w = 28, h = 28;
  const y = DG.GROUND_Y - 95 - Math.random() * 45;
  // Magnet only meaningfully helps when hearts are missing; otherwise favour djump
  const kind = (DG.hearts < DG.MAX_HEARTS && Math.random() < 0.5) ? 'magnet' : 'djump';
  DG.collectibles.push({ x: DG.W + 10, y, w, h, bobPhase: 0, kind });
}
function pulseScore() {
  const el = document.getElementById('dinoScoreDisplay');
  el.classList.add('milestone');
  clearTimeout(el._pt);
  el._pt = setTimeout(() => el.classList.remove('milestone'), 480);
}
function showMilestone(text) {
  const el = document.getElementById('dinoMilestone');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth; // restart animation
  el.classList.add('show');
}
function startRealBoss() {
  DG.bossActive = true;
  DG.obstacles = []; // clear ahead
  DG.realBoss = {
    x: DG.W - 90, y: 56,
    vx: -0.55,
    hp: 3, maxHp: 3,
    fireCool: 70,
    invuln: 0,
    t: 0,
    deathT: 0
  };
  document.getElementById('dinoBossBanner').style.display = 'block';
  DG.canvas.classList.add('boss-mode');
  showMilestone('🐉 الزعيم يهاجم!');
  dinoSound('bossStart');
}
function updateRealBoss(dt) {
  const b = DG.realBoss;
  b.t += dt;
  // Death animation
  if (b.hp <= 0) {
    b.deathT += dt;
    b.x -= 2.2 * dt;
    b.y += 0.4 * dt;
    if (b.deathT > 50 || b.x < -100) finishRealBoss();
    return;
  }
  // Phase escalation: announce when HP first drops to 2 or 1
  if (b.lastHp === undefined) b.lastHp = b.hp;
  if (b.hp < b.lastHp) {
    if (b.hp === 1) {
      showMilestone('🔥🔥 الزعيم في غضب! 🔥🔥');
      dinoSound('bossStart');
      b.swoopCool = 90;
    } else if (b.hp === 2) {
      showMilestone('⚠ الزعيم يشتدّ!');
    }
    b.lastHp = b.hp;
  }
  // Swoop attack (only at rage phase, hp 1) — boss dives forward at dino
  if (b.swooping) {
    b.x += b.swoopVx * dt;
    b.y += b.swoopVy * dt;
    b.swoopVy += 0.35 * dt;
    b.swoopT += dt;
    if (b.swoopT > 38) {
      b.swooping = false;
      b.swoopCool = 110;
    }
  } else {
    // Normal movement + bob
    const speedMult = (b.hp === 1) ? 1.5 : (b.hp === 2 ? 1.2 : 1);
    b.x += b.vx * dt * speedMult;
    if (b.x < 80) { b.vx = Math.abs(b.vx); }
    if (b.x > DG.W - 60) { b.vx = -Math.abs(b.vx); }
    b.y = 56 + Math.sin(b.t * 0.045) * 16;
    // Schedule swoop at rage
    if (b.hp === 1) {
      b.swoopCool -= dt;
      if (b.swoopCool <= 0 && Math.abs(b.x - (DG.DINO_X + 50)) < 60) {
        b.swooping = true;
        b.swoopT = 0;
        b.swoopVx = -1.8;
        b.swoopVy = 2.6;
        dinoSound('hit');
      }
    }
    // Recover from swoop low point — boss returns up
    if (!b.swooping && b.y > 130) {
      b.y -= Math.min(2.5, (b.y - 56) * 0.05) * dt;
    }
  }
  if (b.invuln > 0) b.invuln -= dt;
  // Boss collision (when swooping) damages dino
  if (b.swooping) {
    const bb = { x: b.x - 24, y: b.y - 16, w: 48, h: 40 };
    const dinoBox = getDinoBox();
    if (boxesIntersect(bb, dinoBox) && DG.invincible <= 0) {
      onHit();
    }
  }
  // Fire projectile patterns; faster + denser as HP drops
  b.fireCool -= dt;
  if (b.fireCool <= 0) {
    spawnBossProjectile(b);
    const baseDelay = [55, 42, 28][3 - b.hp] || 55;
    b.fireCool = baseDelay + Math.random() * 22;
  }
}
function spawnBossProjectile(b) {
  const G = DG.GROUND_Y;
  // Calm phase (hp 3): single low or mid
  // Angry phase (hp 2): occasionally double (low + mid simultaneously)
  // Rage phase (hp 1): mostly doubles, faster cadence (handled by fireCool)
  const phase = 3 - b.hp; // 0 calm, 1 angry, 2 rage
  const goDouble = (phase === 2 && Math.random() < 0.55) || (phase === 1 && Math.random() < 0.30);
  const isMid = Math.random() < 0.5;
  if (isMid) {
    DG.obstacles.push({ type:'fireball', kind:'mid', x: b.x + 20, y: G - 76, w: 30, h: 28, fromBoss: true });
  } else {
    DG.obstacles.push({ type:'fireball', kind:'low', x: b.x + 20, y: G - 30, w: 28, h: 28, fromBoss: true });
  }
  if (goDouble) {
    // Sister fireball at the OTHER level, with horizontal offset for spacing
    if (isMid) {
      DG.obstacles.push({ type:'fireball', kind:'low', x: b.x + 50, y: G - 30, w: 28, h: 28, fromBoss: true });
    } else {
      DG.obstacles.push({ type:'fireball', kind:'mid', x: b.x + 50, y: G - 76, w: 30, h: 28, fromBoss: true });
    }
  }
}
function damageRealBoss() {
  const b = DG.realBoss;
  if (!b || b.invuln > 0 || b.hp <= 0) return;
  b.hp--;
  b.invuln = 28;
  if (b.hp <= 0) {
    b.deathT = 0;
    dinoSound('bossWin');
    showMilestone('💥 ضربة قاضية!');
  } else {
    showMilestone('🎯 -١ من الزعيم!');
    dinoSound('heart');
  }
}
function finishRealBoss() {
  DG.realBoss = null;
  DG.bossActive = false;
  DG.bossDefeatedCount++;
  DG.score += 200;
  DG.peacefulUntil = Math.floor(DG.score) + 40;
  if (DG.hearts < DG.MAX_HEARTS) {
    DG.hearts++;
    updateHeartsUI(true);
  }
  document.getElementById('dinoBossBanner').style.display = 'none';
  DG.canvas.classList.remove('boss-mode');
  showMilestone('✅ هزمت الزعيم! +٢٠٠');
  pulseScore();
  // Advance biome
  DG.biomeIdx = (DG.biomeIdx + 1) % DG.BIOMES.length;
  DG.particles = []; DG.particleTimer = 0;
  setTimeout(() => showBiomeBanner(getBiome()), 700);
}
function getDinoBox() {
  if (DG.isDucking && DG.dinoY === 0) {
    return { x: DG.DINO_X + 2, y: DG.GROUND_Y - DG.DUCK_H + 4, w: DG.DUCK_W - 8, h: DG.DUCK_H - 8 };
  }
  return { x: DG.DINO_X + 6, y: DG.GROUND_Y - DG.DINO_H + DG.dinoY + 4, w: DG.DINO_W - 14, h: DG.DINO_H - 8 };
}
function getObstacleBox(o) {
  return { x: o.x + 3, y: o.y + 3, w: o.w - 6, h: o.h - 6 };
}
function boxesIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function spawnObstacle() {
  const biome = getBiome();
  const s = DG.score;
  const valid = biome.obstacles.filter(o => !o.after || s > o.after);
  // boss mode: double weight of any flying obstacles (bird/owl/bat)
  const choices = valid.map(o => ({
    kind: o.kind,
    w: o.w * (DG.bossActive && /^(bird|owl|bat)_/.test(o.kind) ? 2 : 1)
  }));
  const total = choices.reduce((a,c) => a + c.w, 0);
  let r = Math.random() * total;
  for (const c of choices) {
    r -= c.w;
    if (r <= 0) { DG.obstacles.push(makeObstacle(c.kind)); return; }
  }
  DG.obstacles.push(makeObstacle(choices[0].kind));
}
function makeObstacle(kind) {
  const X = DG.W + 10;
  const G = DG.GROUND_Y;
  const TBL = {
    cactus_thin:    { w:18, h:38, type:'cactus', variant:'thin' },
    cactus_tall:    { w:22, h:56, type:'cactus', variant:'tall' },
    cactus_cluster: { w:42, h:38, type:'cactus', variant:'cluster' },
    cactus_twisted: { w:24, h:50, type:'cactus', variant:'twisted' },
    cactus_flower:  { w:22, h:48, type:'cactus', variant:'flower' },
    rock:           { w:38, h:22, type:'rock' },
    palm:           { w:26, h:64, type:'palm' },
    bird_low:       { w:50, h:32, type:'bird', level:'low' },
    bird_mid:       { w:50, h:32, type:'bird', level:'mid' },
    bird_high:      { w:50, h:32, type:'bird', level:'high' },
    snowpile:       { w:32, h:22, type:'snowpile' },
    snowpile_big:   { w:50, h:30, type:'snowpile', big:true },
    snowman:        { w:26, h:54, type:'snowman' },
    icicle:         { w:20, h:32, type:'icicle', level:'mid' },
    iceblock:       { w:36, h:38, type:'iceblock' },
    owl_low:        { w:46, h:32, type:'owl', level:'low' },
    owl_mid:        { w:46, h:32, type:'owl', level:'mid' },
    owl_high:       { w:46, h:32, type:'owl', level:'high' },
    lavarock:       { w:36, h:24, type:'lavarock' },
    lavarock_big:   { w:50, h:34, type:'lavarock', big:true },
    flame:          { w:22, h:42, type:'flame' },
    flame_tall:     { w:22, h:58, type:'flame', tall:true },
    volcanobomb:    { w:30, h:28, type:'volcanobomb' },
    bat_low:        { w:46, h:30, type:'bat', level:'low' },
    bat_mid:        { w:46, h:30, type:'bat', level:'mid' },
    bat_high:       { w:46, h:30, type:'bat', level:'high' }
  };
  const def = TBL[kind] || TBL.cactus_thin;
  let y;
  // Heights tuned for hitbox semantics:
  //   low  → forces JUMP (overlaps both standing and ducking dino)
  //   mid  → forces DUCK (overlaps standing, ducking clears)
  //   high → decorative (clears both)
  if (def.level === 'low')        y = G - 58;
  else if (def.level === 'mid')   y = G - 76;
  else if (def.level === 'high')  y = G - 130;
  else y = G - def.h;
  return { x:X, y, w:def.w, h:def.h, type:def.type, variant:def.variant, big:def.big, tall:def.tall, level:def.level, flicker:0 };
}
function spawnHeart() {
  const w = 24, h = 24;
  // mid-air, jumpable height
  const y = DG.GROUND_Y - 80 - Math.random() * 50;
  DG.collectibles.push({ x: DG.W + 10, y, w, h, bobPhase: 0 });
}
function onHit() {
  DG.hearts--;
  DG.invincible = DG.INVINCIBLE_FRAMES;
  DG.hitFlash = 12;
  // Game feel: trauma-based shake + brief hit-stop
  if (!DG._gk){
    DG._gk = { shake: new GameKit.Shake(), stop: new GameKit.HitStop(), particles: new GameKit.ParticleSystem(128) };
  }
  DG._gk.shake.kick(0.6);
  DG._gk.stop.hit(3);
  DG._gk.particles.burst(DG.dinoX + 22, DG.dinoY + 18, {
    count: 16, palette:['#fff','#ffe066','#ff7a2a','#c92020'],
    speedMin: 1.4, speedMax: 4.5, size: 2, life: 22, lifeJitter: 10, shape:'circle'
  });
  // Reset combo on hit
  if (DG.multiplier > 1) DG.comboFlash = 30;
  DG.combo = 0; DG.multiplier = 1;
  if (DG.canvas) {
    DG.canvas.classList.add('hit-flash');
    setTimeout(()=>DG.canvas.classList.remove('hit-flash'), 380);
  }
  updateHeartsUI();
  if (DG.hearts <= 0) {
    onDinoDeath();
  } else {
    dinoSound('hit');
    if (DG.hearts === 1 && !DG.realBoss) {
      showMilestone('🐢 بطء حماية!');
    }
  }
}
function updateHeartsUI(gained) {
  const hearts = document.querySelectorAll('#dinoHearts .dino-heart');
  hearts.forEach((el, i) => {
    const lost = i >= DG.hearts;
    el.classList.toggle('lost', lost);
    if (gained && !lost && i === DG.hearts - 1) {
      el.classList.remove('gained');
      void el.offsetWidth;
      el.classList.add('gained');
    }
  });
}
function onDinoDeath() {
  DG.state = 'dead';
  cancelAnimationFrame(DG.raf);
  dinoSound('death');
  const finalScore = Math.floor(DG.score);
  const isRecord = finalScore > DG.bestScore;
  if (isRecord) DG.bestScore = finalScore;
  try {
    if (typeof updateProfileStat === 'function') {
      updateProfileStat('dino', (s) => {
        s.games = (s.games || 0) + 1;
        s.totalDistance = (s.totalDistance || 0) + finalScore;
        if (finalScore > (s.bestScore || 0)) s.bestScore = finalScore;
      });
    }
  } catch(e){}
  try { if (typeof renderBadges === 'function') renderBadges(); } catch(e){}
  try { if (typeof dinoLeaderboardSubmit === 'function') dinoLeaderboardSubmit(finalScore); } catch(e){}
  document.getElementById('dinoFinalScore').textContent = finalScore;
  document.getElementById('dinoFinalBest').textContent = DG.bestScore;
  document.getElementById('dinoBestDisplay').textContent = DG.bestScore;
  document.getElementById('dinoNewRec').style.display = isRecord ? 'block' : 'none';
  document.getElementById('dinoGameOverOverlay').style.display = 'flex';
  document.getElementById('dinoBossBanner').style.display = 'none';
  DG.canvas.classList.remove('boss-mode');
  drawDinoFrame(true);
}
function drawDinoFrame(dead) {
  const ctx = DG.ctx;
  if (!ctx) return;
  // Apply screen shake for the whole frame
  ctx.save();
  if (DG._gk && DG._gk.shake) DG._gk.shake.apply(ctx);
  const biome = getBiome();
  // Biome background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, DG.H);
  grad.addColorStop(0, biome.bgTop);
  grad.addColorStop(0.55, biome.bgMid);
  grad.addColorStop(1, biome.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, DG.W, DG.H);
  // Night overlay
  if (DG.isNight) {
    ctx.fillStyle = 'rgba(8,10,16,0.45)';
    ctx.fillRect(0, 0, DG.W, DG.H);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const off = Math.floor(-DG.ground * 0.3);
    [[80,28],[180,60],[260,18],[360,48],[460,30],[560,55],[640,25]].forEach(([x,y]) => {
      const xx = ((x + off) % DG.W + DG.W) % DG.W;
      ctx.fillRect(xx, y, 2, 2);
    });
    ctx.fillStyle = 'rgba(255,255,200,0.85)';
    ctx.beginPath();
    ctx.arc(DG.W - 90, 40, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = biome.bgMid;
    ctx.beginPath();
    ctx.arc(DG.W - 84, 36, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  // Boss mode tint
  if (DG.bossActive) {
    ctx.fillStyle = 'rgba(239,68,68,0.10)';
    ctx.fillRect(0, 0, DG.W, DG.H);
  }
  // Panic slow-mo vignette
  if (DG.panicSlow > 0) {
    const pg = ctx.createRadialGradient(DG.W/2, DG.H/2, DG.W*0.18, DG.W/2, DG.H/2, DG.W*0.7);
    pg.addColorStop(0, 'rgba(100,180,255,0)');
    pg.addColorStop(1, 'rgba(80,160,255,' + (0.32 * DG.panicSlow) + ')');
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, DG.W, DG.H);
  }
  // Clouds
  ctx.fillStyle = biome.cloud;
  DG.clouds.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.arc(c.x + 12, c.y - 3, 7, 0, Math.PI * 2);
    ctx.arc(c.x + 22, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  // Distant hills
  ctx.fillStyle = biome.hill;
  const hOff = -DG.ground * 0.15;
  for (let i = -1; i < 6; i++) {
    const cx = ((i * 180 + hOff) % (DG.W + 360) + DG.W + 360) % (DG.W + 360) - 180;
    ctx.beginPath();
    ctx.moveTo(cx, DG.GROUND_Y);
    ctx.quadraticCurveTo(cx + 60, DG.GROUND_Y - 38, cx + 120, DG.GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
  // Particles (snow/embers)
  drawDinoParticles(ctx, biome);
  // Ground line
  ctx.strokeStyle = biome.ground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, DG.GROUND_Y + 1);
  ctx.lineTo(DG.W, DG.GROUND_Y + 1);
  ctx.stroke();
  ctx.fillStyle = biome.ground;
  ctx.globalAlpha = 0.55;
  for (let x = DG.ground; x < DG.W; x += 24) {
    ctx.fillRect(x, DG.GROUND_Y + 6, 10, 2);
    ctx.fillRect(x + 14, DG.GROUND_Y + 11, 4, 1);
  }
  ctx.globalAlpha = 1;
  // Collectibles
  DG.collectibles.forEach(c => { if (c.kind === 'djump') drawDjumpCollectible(ctx, c); else if (c.kind === 'magnet') drawMagnetCollectible(ctx, c); else drawHeartCollectible(ctx, c); });
  // Obstacles
  DG.obstacles.forEach(o => drawObstacle(ctx, o));
  if (DG.realBoss) drawRealBoss(ctx, DG.realBoss);
  // Dino (blink if invincible)
  const showDino = !(DG.invincible > 0 && Math.floor(DG.invincible / 4) % 2 === 0);
  if (showDino || dead) drawDinoSprite(ctx, dead);
  // HUD overlay on canvas
  drawDinoHud(ctx);
}
function drawDinoHud(ctx) {
  const pad = 16;
  // Hearts top-left
  for (let i = 0; i < DG.MAX_HEARTS; i++) {
    const hx = pad + 10 + i * 28;
    const hy = pad + 6;
    drawHudHeart(ctx, hx, hy, i < DG.hearts);
  }
  // Score top-right
  ctx.save();
  ctx.font = 'bold 26px "Tajawal", "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const score = Math.floor(DG.score).toString().padStart(5, '0');
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(score, DG.W - pad + 1, pad + 12);
  ctx.fillStyle = '#c9a84c';
  ctx.fillText(score, DG.W - pad, pad + 12);
  // HI score below
  ctx.font = 'bold 13px "Tajawal", "Courier New", monospace';
  const hi = 'HI  ' + DG.bestScore.toString().padStart(5, '0');
  ctx.fillStyle = 'rgba(201,168,76,0.65)';
  ctx.fillText(hi, DG.W - pad, pad + 32);
  // Multiplier (center top) when active
  if (DG.multiplier > 1) {
    const grow = DG.comboFlash > 0 ? 1 + (DG.comboFlash / 30) * 0.5 : 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold ' + Math.round(30 * grow) + 'px "Tajawal", "Courier New", monospace';
    const mc = DG.multiplier >= 5 ? '#ff4444' : DG.multiplier >= 4 ? '#ff8800' : DG.multiplier >= 3 ? '#ffcc00' : '#c9a84c';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText('×' + DG.multiplier, DG.W/2 + 1, pad + 14);
    ctx.fillStyle = mc;
    ctx.fillText('×' + DG.multiplier, DG.W/2, pad + 13);
    ctx.font = 'bold 11px "Tajawal", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('كومبو ' + DG.combo, DG.W/2, pad + 30);
  }
  // Power-up indicators
  ctx.textAlign = 'left';
  let iy = pad + 52;
  if (DG.djumpTimer > 0) {
    const secs = Math.ceil(DG.djumpTimer / 60);
    const pulse = 0.6 + 0.4 * Math.sin(DG.djumpTimer * 0.2);
    ctx.font = 'bold 15px "Tajawal", sans-serif';
    ctx.fillStyle = 'rgba(120,200,255,' + pulse + ')';
    ctx.fillText('🪽 ' + secs + 'ث', pad, iy);
    iy += 20;
  }
  if (DG.magnetTimer > 0) {
    const secs = Math.ceil(DG.magnetTimer / 60);
    const pulse = 0.6 + 0.4 * Math.sin(DG.magnetTimer * 0.2);
    ctx.font = 'bold 15px "Tajawal", sans-serif';
    ctx.fillStyle = 'rgba(220,120,255,' + pulse + ')';
    ctx.fillText('🧲 ' + secs + 'ث', pad, iy);
    iy += 20;
  }
  if (DG.panicSlow > 0.5) {
    const pulse = 0.55 + 0.35 * Math.sin(performance.now() * 0.012);
    ctx.font = 'bold 15px "Tajawal", sans-serif';
    ctx.fillStyle = 'rgba(120,200,255,' + pulse + ')';
    ctx.fillText('🐢 بطء حماية', pad, iy);
  }
  ctx.restore();
  // Pooled hit particles
  if (DG._gk && DG._gk.particles) DG._gk.particles.draw(ctx, { additive: true });
  // End screen-shake transform
  ctx.restore();
}
function drawHudHeart(ctx, cx, cy, alive) {
  ctx.save();
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.moveTo(cx + 1, cy + 9);
  ctx.bezierCurveTo(cx + 12, cy + 1, cx + 12, cy - 8, cx + 1, cy - 3);
  ctx.bezierCurveTo(cx - 10, cy - 8, cx - 10, cy + 1, cx + 1, cy + 9);
  ctx.fill();
  // Main
  ctx.fillStyle = alive ? '#ef4444' : 'rgba(80,18,18,0.55)';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.bezierCurveTo(cx + 11, cy, cx + 11, cy - 9, cx, cy - 4);
  ctx.bezierCurveTo(cx - 11, cy - 9, cx - 11, cy, cx, cy + 8);
  ctx.fill();
  if (alive) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - 3, cy - 3, 2.5, 1.6, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(239,68,68,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.bezierCurveTo(cx + 11, cy, cx + 11, cy - 9, cx, cy - 4);
    ctx.bezierCurveTo(cx - 11, cy - 9, cx - 11, cy, cx, cy + 8);
    ctx.stroke();
  }
  ctx.restore();
}
function drawHeartCollectible(ctx, c) {
  const bob = Math.sin(c.bobPhase) * 3;
  const x = c.x + c.w / 2;
  const y = c.y + c.h / 2 + bob;
  // Glow
  const g = ctx.createRadialGradient(x, y, 2, x, y, 18);
  g.addColorStop(0, 'rgba(239,68,68,0.45)');
  g.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 18, y - 18, 36, 36);
  // Heart shape
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.bezierCurveTo(x + 11, y, x + 11, y - 9, x, y - 4);
  ctx.bezierCurveTo(x - 11, y - 9, x - 11, y, x, y + 8);
  ctx.fill();
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 3, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
}
function drawDjumpCollectible(ctx, c) {
  const bob = Math.sin(c.bobPhase) * 3;
  const x = c.x + c.w / 2;
  const y = c.y + c.h / 2 + bob;
  // Glow (blue/cyan)
  const g = ctx.createRadialGradient(x, y, 2, x, y, 20);
  g.addColorStop(0, 'rgba(120,200,255,0.5)');
  g.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 20, y - 20, 40, 40);
  // Wing pair
  ctx.fillStyle = '#cce6ff';
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.quadraticCurveTo(x - 13, y - 9, x - 12, y + 3);
  ctx.quadraticCurveTo(x - 8, y + 1, x, y + 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 2);
  ctx.quadraticCurveTo(x + 13, y - 9, x + 12, y + 3);
  ctx.quadraticCurveTo(x + 8, y + 1, x, y + 4);
  ctx.fill();
  // Up-arrows core
  ctx.fillStyle = '#66bbff';
  ctx.beginPath();
  ctx.moveTo(x, y - 7); ctx.lineTo(x - 4, y - 1); ctx.lineTo(x + 4, y - 1);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 2); ctx.lineTo(x - 4, y + 4); ctx.lineTo(x + 4, y + 4);
  ctx.closePath(); ctx.fill();
}
function drawMagnetCollectible(ctx, c) {
  const bob = Math.sin(c.bobPhase) * 3;
  const x = c.x + c.w / 2;
  const y = c.y + c.h / 2 + bob;
  // Glow (purple/magenta)
  const g = ctx.createRadialGradient(x, y, 2, x, y, 20);
  g.addColorStop(0, 'rgba(200,80,255,0.5)');
  g.addColorStop(1, 'rgba(200,80,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 20, y - 20, 40, 40);
  // Horseshoe magnet body (red U)
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#e0352b';
  ctx.beginPath();
  ctx.arc(x, y - 1, 7, Math.PI, 0, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 1); ctx.lineTo(x - 7, y + 8);
  ctx.moveTo(x + 7, y - 1); ctx.lineTo(x + 7, y + 8);
  ctx.stroke();
  // Pole tips (silver/grey)
  ctx.fillStyle = '#cfd4dc';
  ctx.fillRect(x - 9.5, y + 7, 5, 4);
  ctx.fillRect(x + 4.5, y + 7, 5, 4);
}
function drawObstacle(ctx, o) {
  if (o.type === 'cactus') drawCactus(ctx, o);
  else if (o.type === 'rock') drawRock(ctx, o);
  else if (o.type === 'palm') drawPalm(ctx, o);
  else if (o.type === 'bird') drawBird(ctx, o);
  else if (o.type === 'snowpile') drawSnowpile(ctx, o);
  else if (o.type === 'snowman') drawSnowman(ctx, o);
  else if (o.type === 'icicle') drawIcicle(ctx, o);
  else if (o.type === 'iceblock') drawIceBlock(ctx, o);
  else if (o.type === 'owl') drawOwl(ctx, o);
  else if (o.type === 'lavarock') drawLavaRock(ctx, o);
  else if (o.type === 'flame') drawFlame(ctx, o);
  else if (o.type === 'volcanobomb') drawVolcanoBomb(ctx, o);
  else if (o.type === 'bat') drawBat(ctx, o);
  else if (o.type === 'fireball') drawFireball(ctx, o);
}
function drawFireball(ctx, o) {
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const r = o.w / 2;
  // Outer halo
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 1.8);
  g.addColorStop(0, 'rgba(255,220,80,0.8)');
  g.addColorStop(0.5, 'rgba(255,120,30,0.5)');
  g.addColorStop(1, 'rgba(255,40,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
  // Core
  ctx.fillStyle = '#ff5020';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd040';
  ctx.beginPath(); ctx.arc(cx - 2, cy - 2, r * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 3, cy - 3, r * 0.18, 0, Math.PI * 2); ctx.fill();
}
function drawRealBoss(ctx, b) {
  const blink = (b.invuln > 0 && Math.floor(b.invuln / 3) % 2 === 0);
  if (blink) return;
  const x = b.x, y = b.y;
  const dying = b.hp <= 0;
  ctx.save();
  if (dying) ctx.globalAlpha = Math.max(0.2, 1 - b.deathT / 50);
  // Wings (flap from phase)
  const wing = Math.sin(b.t * 0.2) * 8;
  ctx.fillStyle = '#7a1818';
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 38, y - 18 + wing, x - 30, y + 14);
  ctx.quadraticCurveTo(x - 18, y + 8, x - 8, y + 10);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.quadraticCurveTo(x + 38, y - 18 + wing, x + 30, y + 14);
  ctx.quadraticCurveTo(x + 18, y + 8, x + 8, y + 10);
  ctx.fill();
  // Body
  ctx.fillStyle = '#b8231a';
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(x + 22, y, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail
  ctx.beginPath();
  ctx.moveTo(x - 20, y + 4);
  ctx.lineTo(x - 38, y - 4);
  ctx.lineTo(x - 38, y + 6);
  ctx.closePath();
  ctx.fill();
  // Horns
  ctx.fillStyle = '#3a0808';
  ctx.beginPath(); ctx.moveTo(x + 26, y - 7); ctx.lineTo(x + 30, y - 14); ctx.lineTo(x + 24, y - 9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 30, y - 5); ctx.lineTo(x + 36, y - 12); ctx.lineTo(x + 32, y - 4); ctx.closePath(); ctx.fill();
  // Eye (glowing)
  ctx.fillStyle = '#ffd000';
  ctx.beginPath(); ctx.arc(x + 28, y - 1, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 27, y - 2, 1.5, 1.5);
  // Mouth glow
  ctx.fillStyle = '#ff8030';
  ctx.beginPath(); ctx.arc(x + 36, y + 3, 2.5, 0, Math.PI * 2); ctx.fill();
  // HP bar above
  if (!dying) {
    const bw = 56, bh = 6, bx = x - bw / 2, by = y - 26;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#400000';
    ctx.fillRect(bx, by, bw, bh);
    const fillW = (b.hp / b.maxHp) * bw;
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#ff4040');
    grad.addColorStop(1, '#ff8040');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, fillW, bh);
    // pips
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    for (let i = 1; i < b.maxHp; i++) {
      ctx.fillRect(bx + (bw / b.maxHp) * i - 0.5, by, 1, bh);
    }
  }
  ctx.restore();
}
function drawDinoParticles(ctx, biome) {
  if (!biome.particle) { DG.particles = []; return; }
  // Spawn
  DG.particleTimer = (DG.particleTimer || 0) + 1;
  if (DG.particleTimer > (biome.particle === 'snow' ? 2 : 3)) {
    DG.particleTimer = 0;
    if (biome.particle === 'snow') {
      DG.particles.push({ x: Math.random() * (DG.W + 80) - 40, y: -4, vy: 0.6 + Math.random() * 0.9, vx: -0.4 - Math.random() * 0.6, r: 1 + Math.random() * 2, kind:'snow' });
    } else if (biome.particle === 'ember') {
      DG.particles.push({ x: Math.random() * DG.W, y: DG.GROUND_Y - 2, vy: -0.6 - Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.6, r: 1 + Math.random() * 1.8, kind:'ember', life: 60 + Math.random() * 60 });
    }
  }
  // Update + draw
  for (let i = DG.particles.length - 1; i >= 0; i--) {
    const p = DG.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.kind === 'snow') {
      if (p.y > DG.GROUND_Y) { DG.particles.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(p.x, p.y, p.r, p.r);
    } else if (p.kind === 'ember') {
      p.life--;
      if (p.life <= 0 || p.y < 20) { DG.particles.splice(i, 1); continue; }
      const a = Math.max(0, Math.min(1, p.life / 80));
      ctx.fillStyle = 'rgba(255,' + Math.floor(120 + a * 100) + ',40,' + a + ')';
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
  }
  // Cap particle count for perf
  if (DG.particles.length > 220) DG.particles.splice(0, DG.particles.length - 220);
}
function drawCactus(ctx, o) {
  const { x, y, w, h, variant } = o;
  ctx.fillStyle = '#c9a84c';
  const dark = '#8b6e1f';
  if (variant === 'thin') {
    const sw = 7;
    const sx = x + (w - sw) / 2;
    ctx.fillRect(sx, y, sw, h);
    ctx.fillRect(x, y + h*0.3, sw - 1, 3);
    ctx.fillRect(x, y + h*0.18, 3, h*0.15);
    ctx.fillRect(x + w - 3, y + h*0.5, 3, 3);
    ctx.fillRect(x + w - 3, y + h*0.35, 3, h*0.18);
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 1, y + 4, 1, h - 8);
  } else if (variant === 'tall') {
    const sw = 9;
    const sx = x + (w - sw) / 2;
    ctx.fillRect(sx, y, sw, h);
    ctx.fillRect(x, y + h*0.25, sx - x, 3);
    ctx.fillRect(x, y + h*0.12, 3, h*0.18);
    ctx.fillRect(sx + sw, y + h*0.45, w - (sx + sw - x), 3);
    ctx.fillRect(x + w - 3, y + h*0.32, 3, h*0.18);
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 2, y + 4, 1, h - 8);
    ctx.fillRect(sx + 5, y + 4, 1, h - 8);
  } else if (variant === 'cluster') {
    // three cacti of varying heights
    const ch = [h, h - 8, h - 4];
    const cw = 12;
    for (let i = 0; i < 3; i++) {
      const cx = x + i * 15;
      const cy = DG.GROUND_Y - ch[i];
      ctx.fillRect(cx + 3, cy, cw - 4, ch[i]);
      ctx.fillRect(cx, cy + ch[i]*0.35, 3, 3);
      ctx.fillRect(cx, cy + ch[i]*0.2, 3, ch[i]*0.18);
    }
  } else if (variant === 'twisted') {
    // S-shape twisted cactus
    const sw = 8;
    const sx = x + (w - sw) / 2;
    ctx.fillRect(sx, y, sw, h*0.4);
    ctx.fillRect(sx - 5, y + h*0.4, sw + 5, sw);
    ctx.fillRect(sx - 5, y + h*0.4, sw, h*0.3);
    ctx.fillRect(sx, y + h*0.65, sw + 5, sw);
    ctx.fillRect(sx + 5, y + h*0.65, sw, h*0.35);
    ctx.fillStyle = dark;
    ctx.fillRect(sx + 2, y + 3, 1, h*0.3);
  } else if (variant === 'flower') {
    const sw = 9;
    const sx = x + (w - sw) / 2;
    ctx.fillRect(sx, y + 8, sw, h - 8);
    ctx.fillRect(x, y + h*0.4, sx - x, 3);
    ctx.fillRect(x + w - 3, y + h*0.55, 3, 3);
    ctx.fillRect(x + w - 3, y + h*0.4, 3, h*0.18);
    // flower top (red)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(sx - 2, y + 2, sw + 4, 6);
    ctx.fillRect(sx + 1, y, sw - 2, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx + 3, y + 3, 2, 2);
  }
}
function drawRock(ctx, o) {
  const { x, y, w, h } = o;
  ctx.fillStyle = '#7a6b4e';
  // Polygonal rock shape
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h);
  ctx.lineTo(x + 6, y + h*0.4);
  ctx.lineTo(x + 14, y + 2);
  ctx.lineTo(x + 24, y + 4);
  ctx.lineTo(x + 32, y + h*0.5);
  ctx.lineTo(x + w - 2, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 8);
  ctx.lineTo(x + 26, y + h*0.55);
  ctx.lineTo(x + w - 3, y + h - 1);
  ctx.lineTo(x + w - 8, y + h*0.7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 8, y + 6, 4, 2);
  ctx.fillRect(x + 16, y + 4, 3, 2);
}
function drawPalm(ctx, o) {
  const { x, y, w, h } = o;
  // Trunk
  ctx.fillStyle = '#7c5a2e';
  const trunkW = 8;
  const tx = x + (w - trunkW) / 2;
  ctx.fillRect(tx, y + 18, trunkW, h - 18);
  // Trunk segments
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 5; i++) ctx.fillRect(tx, y + 24 + i * 9, trunkW, 1);
  // Leaves
  ctx.fillStyle = '#4ade80';
  const cx = tx + trunkW / 2;
  const cy = y + 14;
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2 - Math.PI / 2;
    const ex = cx + Math.cos(ang) * 16;
    const ey = cy + Math.sin(ang) * 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo((cx + ex) / 2 + Math.cos(ang + Math.PI/2) * 4, (cy + ey) / 2 + Math.sin(ang + Math.PI/2) * 3, ex, ey);
    ctx.lineTo(ex + Math.cos(ang) * 4, ey + Math.sin(ang) * 2);
    ctx.quadraticCurveTo((cx + ex) / 2 - Math.cos(ang + Math.PI/2) * 4, (cy + ey) / 2 - Math.sin(ang + Math.PI/2) * 3, cx + 2, cy + 1);
    ctx.fill();
  }
  // Coconuts
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath(); ctx.arc(cx - 3, cy + 5, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy + 6, 2.5, 0, Math.PI*2); ctx.fill();
}
function drawBird(ctx, o) {
  const { x, y, w, h } = o;
  const phase = DG.birdPhase;
  const flap = Math.floor(phase) % 2;
  const bossy = DG.bossActive;
  ctx.fillStyle = bossy ? '#ef4444' : '#c9a84c';
  // Body
  ctx.fillRect(x + 15, y + 14, 28, 12);
  // Head
  ctx.fillRect(x + 38, y + 12, 12, 12);
  // Beak
  ctx.fillRect(x + 48, y + 16, 8, 4);
  // Eye
  ctx.fillStyle = '#0e1014';
  ctx.fillRect(x + 44, y + 14, 3, 3);
  // Wing
  ctx.fillStyle = bossy ? '#ef4444' : '#c9a84c';
  if (flap === 0) {
    ctx.fillRect(x + 18, y + 2, 22, 12);
    ctx.fillRect(x + 22, y - 4, 10, 6);
  } else {
    ctx.fillRect(x + 18, y + 22, 22, 12);
    ctx.fillRect(x + 22, y + 30, 10, 4);
  }
  // Tail feathers
  ctx.fillStyle = bossy ? '#dc2626' : '#a8720c';
  ctx.fillRect(x + 10, y + 16, 6, 8);
  ctx.fillRect(x + 6, y + 18, 4, 4);
}
function drawSnowpile(ctx, o) {
  const { x, y, w, h } = o;
  // White rounded mound with shadow
  ctx.fillStyle = '#dde8f4';
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h, w/2, h, 0, Math.PI, 0);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(x + w*0.4, y + h - 3, w*0.3, h*0.6, 0, Math.PI, 0);
  ctx.fill();
  // Snowflake sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(x + w*0.55, y + h*0.4, 2, 2);
  ctx.fillRect(x + w*0.3, y + h*0.6, 1, 1);
  if (o.big) {
    ctx.fillStyle = '#a8c8e8';
    ctx.fillRect(x + w*0.2, y + h - 4, 3, 3);
  }
}
function drawSnowman(ctx, o) {
  const { x, y, w, h } = o;
  // Bottom snowball
  ctx.fillStyle = '#f0f6fc';
  ctx.beginPath(); ctx.arc(x + w/2, y + h - 12, 13, 0, Math.PI * 2); ctx.fill();
  // Top snowball
  ctx.beginPath(); ctx.arc(x + w/2, y + 18, 9, 0, Math.PI * 2); ctx.fill();
  // Hat
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x + w/2 - 9, y + 6, 18, 3);
  ctx.fillRect(x + w/2 - 6, y - 4, 12, 10);
  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x + w/2 - 4, y + 14, 2, 2);
  ctx.fillRect(x + w/2 + 2, y + 14, 2, 2);
  // Nose (carrot)
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + w/2 - 1, y + 18, 4, 2);
  // Buttons
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x + w/2 - 1, y + h - 16, 2, 2);
  ctx.fillRect(x + w/2 - 1, y + h - 10, 2, 2);
  // Arms
  ctx.strokeStyle = '#7c5a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w/2 - 5, y + 28); ctx.lineTo(x - 4, y + 22);
  ctx.moveTo(x + w/2 + 5, y + 28); ctx.lineTo(x + w + 4, y + 22);
  ctx.stroke();
}
function drawIcicle(ctx, o) {
  const { x, y, w, h } = o;
  // Triangle hanging down from y=0
  ctx.fillStyle = '#c8e0f4';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w/2, y + h);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 2);
  ctx.lineTo(x + w/2 - 1, y + h - 4);
  ctx.lineTo(x + w/2 + 2, y + h*0.5);
  ctx.closePath();
  ctx.fill();
  // Top cap (cloud-ish)
  ctx.fillStyle = 'rgba(220,235,250,0.9)';
  ctx.beginPath();
  ctx.arc(x + w/2, y - 2, 6, 0, Math.PI * 2);
  ctx.arc(x + w/2 - 5, y - 4, 4, 0, Math.PI * 2);
  ctx.arc(x + w/2 + 5, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
}
function drawIceBlock(ctx, o) {
  const { x, y, w, h } = o;
  // Solid ice rect
  ctx.fillStyle = '#a8c8e8';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(x + 2, y + 2, w - 12, 4);
  ctx.fillRect(x + 2, y + 2, 3, h - 6);
  // Cracks
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w*0.4, y + 4); ctx.lineTo(x + w*0.55, y + h*0.5); ctx.lineTo(x + w*0.35, y + h - 4);
  ctx.moveTo(x + w*0.7, y + h*0.3); ctx.lineTo(x + w*0.85, y + h*0.6);
  ctx.stroke();
  // Frost edges
  ctx.fillStyle = '#e0eef8';
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y, 2, h);
}
function drawOwl(ctx, o) {
  const { x, y, w, h } = o;
  const phase = DG.birdPhase;
  const flap = Math.floor(phase) % 2;
  const bossy = DG.bossActive;
  ctx.fillStyle = bossy ? '#ef4444' : '#6b4423';
  // Body (rounder than bird)
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h/2 + 2, 16, 13, 0, 0, Math.PI*2);
  ctx.fill();
  // Head (big round)
  ctx.beginPath();
  ctx.arc(x + w/2 + 8, y + 10, 11, 0, Math.PI*2);
  ctx.fill();
  // Eye discs
  ctx.fillStyle = '#f0e8d8';
  ctx.beginPath(); ctx.arc(x + w/2 + 4, y + 8, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w/2 + 13, y + 8, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(x + w/2 + 4, y + 8, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + w/2 + 13, y + 8, 2, 0, Math.PI*2); ctx.fill();
  // Beak
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(x + w/2 + 8, y + 12); ctx.lineTo(x + w/2 + 11, y + 16); ctx.lineTo(x + w/2 + 5, y + 16);
  ctx.closePath();
  ctx.fill();
  // Ear tufts
  ctx.fillStyle = bossy ? '#ef4444' : '#6b4423';
  ctx.beginPath(); ctx.moveTo(x + w/2 + 2, y + 2); ctx.lineTo(x + w/2 + 5, y - 4); ctx.lineTo(x + w/2 + 6, y + 4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w/2 + 12, y + 2); ctx.lineTo(x + w/2 + 15, y - 4); ctx.lineTo(x + w/2 + 14, y + 4); ctx.closePath(); ctx.fill();
  // Wings (flapping)
  ctx.fillStyle = bossy ? '#dc2626' : '#4a2e15';
  if (flap === 0) {
    ctx.beginPath(); ctx.ellipse(x + w/2 - 8, y + h/2 - 4, 10, 6, -0.4, 0, Math.PI*2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(x + w/2 - 8, y + h/2 + 4, 10, 6, 0.4, 0, Math.PI*2); ctx.fill();
  }
}
function drawLavaRock(ctx, o) {
  const { x, y, w, h } = o;
  // Dark rock
  ctx.fillStyle = '#1a0805';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h);
  ctx.lineTo(x + 5, y + h*0.3);
  ctx.lineTo(x + w*0.35, y + 2);
  ctx.lineTo(x + w*0.7, y + 4);
  ctx.lineTo(x + w - 5, y + h*0.4);
  ctx.lineTo(x + w - 2, y + h);
  ctx.closePath();
  ctx.fill();
  // Lava cracks (glowing)
  ctx.strokeStyle = '#ff8c1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w*0.3, y + 6); ctx.lineTo(x + w*0.5, y + h*0.5); ctx.lineTo(x + w*0.4, y + h - 4);
  ctx.stroke();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x + w*0.6, y + h*0.3); ctx.lineTo(x + w*0.75, y + h*0.6);
  ctx.stroke();
  // Glow dots
  ctx.fillStyle = '#ff8c1a';
  ctx.fillRect(x + w*0.45, y + h*0.55, 2, 2);
  if (o.big) {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + w*0.7, y + h*0.5, 3, 2);
  }
}
function drawFlame(ctx, o) {
  const { x, y, w, h } = o;
  o.flicker = (o.flicker || 0) + 0.4;
  const wob = Math.sin(o.flicker) * 1.5;
  const wob2 = Math.cos(o.flicker * 1.3) * 1.2;
  // Base (dark)
  ctx.fillStyle = '#5a2010';
  ctx.fillRect(x + 4, y + h - 6, w - 8, 6);
  // Outer flame (red)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h - 4);
  ctx.quadraticCurveTo(x - 1 + wob, y + h*0.4, x + w/2 + wob*0.5, y + 2);
  ctx.quadraticCurveTo(x + w + 1 - wob, y + h*0.4, x + w - 2, y + h - 4);
  ctx.closePath();
  ctx.fill();
  // Middle flame (orange)
  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + h - 4);
  ctx.quadraticCurveTo(x + 3 + wob2, y + h*0.5, x + w/2 + wob2*0.5, y + h*0.2);
  ctx.quadraticCurveTo(x + w - 3 - wob2, y + h*0.5, x + w - 6, y + h - 4);
  ctx.closePath();
  ctx.fill();
  // Inner flame (yellow)
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(x + w*0.35, y + h - 6);
  ctx.quadraticCurveTo(x + w*0.4 + wob*0.3, y + h*0.55, x + w/2, y + h*0.35);
  ctx.quadraticCurveTo(x + w*0.6 - wob*0.3, y + h*0.55, x + w*0.65, y + h - 6);
  ctx.closePath();
  ctx.fill();
}
function drawVolcanoBomb(ctx, o) {
  const { x, y, w, h } = o;
  // Dark sphere with red glow
  const cx = x + w/2, cy = y + h/2;
  // Glow halo
  const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, w);
  g.addColorStop(0, 'rgba(239,68,68,0.5)');
  g.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
  // Bomb body
  ctx.fillStyle = '#2a0805';
  ctx.beginPath(); ctx.arc(cx, cy, w/2 - 2, 0, Math.PI*2); ctx.fill();
  // Cracks
  ctx.strokeStyle = '#ff8c1a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - w*0.3, cy - 2); ctx.lineTo(cx + w*0.2, cy + w*0.15);
  ctx.moveTo(cx + 2, cy - w*0.3); ctx.lineTo(cx + w*0.25, cy + w*0.1);
  ctx.stroke();
  // Highlight
  ctx.fillStyle = 'rgba(255,140,26,0.4)';
  ctx.beginPath(); ctx.arc(cx - w*0.2, cy - w*0.2, w*0.15, 0, Math.PI*2); ctx.fill();
}
function drawBat(ctx, o) {
  const { x, y, w, h } = o;
  const phase = DG.birdPhase;
  const flap = Math.floor(phase) % 2;
  const bossy = DG.bossActive;
  ctx.fillStyle = bossy ? '#ef4444' : '#1a0a1a';
  // Body
  ctx.beginPath();
  ctx.ellipse(x + w/2, y + h/2 + 2, 6, 10, 0, 0, Math.PI*2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(x + w/2, y + 8, 6, 0, Math.PI*2);
  ctx.fill();
  // Ears (pointy)
  ctx.beginPath(); ctx.moveTo(x + w/2 - 4, y + 4); ctx.lineTo(x + w/2 - 7, y - 2); ctx.lineTo(x + w/2 - 1, y + 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w/2 + 4, y + 4); ctx.lineTo(x + w/2 + 7, y - 2); ctx.lineTo(x + w/2 + 1, y + 3); ctx.closePath(); ctx.fill();
  // Eyes (red)
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + w/2 - 3, y + 7, 2, 2);
  ctx.fillRect(x + w/2 + 1, y + 7, 2, 2);
  // Wings (membranous, scalloped)
  ctx.fillStyle = bossy ? '#dc2626' : '#1a0a1a';
  if (flap === 0) {
    // Wings up
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 14);
    ctx.quadraticCurveTo(x + w/2 - 14, y, x - 4, y + 6);
    ctx.quadraticCurveTo(x + w/2 - 12, y + 6, x + w/2 - 6, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 14);
    ctx.quadraticCurveTo(x + w/2 + 14, y, x + w + 4, y + 6);
    ctx.quadraticCurveTo(x + w/2 + 12, y + 6, x + w/2 + 6, y + 16);
    ctx.closePath();
    ctx.fill();
  } else {
    // Wings down
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 14);
    ctx.quadraticCurveTo(x + w/2 - 16, y + 18, x - 2, y + 26);
    ctx.quadraticCurveTo(x + w/2 - 10, y + 16, x + w/2 - 6, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 14);
    ctx.quadraticCurveTo(x + w/2 + 16, y + 18, x + w + 2, y + 26);
    ctx.quadraticCurveTo(x + w/2 + 10, y + 16, x + w/2 + 6, y + 16);
    ctx.closePath();
    ctx.fill();
  }
}
function drawDinoSprite(ctx, dead) {
  const skin = getSkin();
  const ducking = DG.isDucking && DG.dinoY === 0;
  const x = DG.DINO_X;
  const color = skin.color;
  const acc = skin.acc;
  if (ducking) {
    const y = DG.GROUND_Y - DG.DUCK_H;
    // Body horizontal
    ctx.fillStyle = color;
    ctx.fillRect(x, y + 12, 54, 16);
    // Tail
    ctx.fillRect(x - 8, y + 16, 10, 9);
    // Head
    ctx.fillRect(x + 44, y + 4, 24, 20);
    // Beak/mouth
    ctx.fillRect(x + 64, y + 14, 4, 7);
    ctx.fillStyle = '#0e1014';
    ctx.fillRect(x + 59, y + 8, 3, 3);
    ctx.fillRect(x + 64, y + 17, 3, 2);
    // Legs (running)
    ctx.fillStyle = color;
    const lp = Math.floor(DG.legPhase) % 2;
    if (lp === 0) {
      ctx.fillRect(x + 12, y + 28, 7, 6);
      ctx.fillRect(x + 32, y + 28, 7, 4);
    } else {
      ctx.fillRect(x + 12, y + 28, 7, 4);
      ctx.fillRect(x + 32, y + 28, 7, 6);
    }
    // Skin accent (hump for camel, ear for fox)
    if (skin.id === 'camel') {
      ctx.fillStyle = acc;
      ctx.fillRect(x + 22, y + 8, 18, 6);
    } else if (skin.id === 'fox') {
      ctx.fillStyle = acc;
      ctx.fillRect(x + 50, y, 5, 8);
      ctx.fillRect(x + 60, y, 5, 8);
    }
    return;
  }
  // Standing
  const y = DG.GROUND_Y - DG.DINO_H + DG.dinoY;
  ctx.fillStyle = color;
  // Tail
  ctx.fillRect(x, y + 22, 10, 7);
  ctx.fillRect(x + 4, y + 18, 6, 5);
  // Body
  ctx.fillRect(x + 8, y + 16, 24, 26);
  // Neck
  ctx.fillRect(x + 28, y + 6, 10, 16);
  // Head
  ctx.fillRect(x + 30, y, 22, 22);
  // Mouth
  ctx.fillRect(x + 46, y + 14, 6, 5);
  // Eye
  ctx.fillStyle = '#0e1014';
  ctx.fillRect(x + 41, y + 5, 3, 3);
  if (dead) {
    ctx.strokeStyle = '#0e1014';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x + 38, y + 3); ctx.lineTo(x + 46, y + 11);
    ctx.moveTo(x + 46, y + 3); ctx.lineTo(x + 38, y + 11);
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x + 50, y + 14, 2, 2);
    ctx.fillStyle = '#0e1014';
    ctx.fillRect(x + 47, y + 16, 5, 1);
  }
  // Arms
  ctx.fillStyle = color;
  ctx.fillRect(x + 24, y + 28, 6, 6);
  // Legs
  const inAir = DG.dinoY < 0;
  const lp = Math.floor(DG.legPhase) % 2;
  if (inAir || dead) {
    ctx.fillRect(x + 12, y + 42, 7, 10);
    ctx.fillRect(x + 22, y + 42, 7, 10);
    ctx.fillRect(x + 10, y + 50, 10, 4);
    ctx.fillRect(x + 22, y + 50, 10, 4);
  } else if (lp === 0) {
    ctx.fillRect(x + 12, y + 42, 7, 11);
    ctx.fillRect(x + 10, y + 51, 10, 4);
    ctx.fillRect(x + 22, y + 42, 7, 7);
    ctx.fillRect(x + 22, y + 48, 10, 4);
  } else {
    ctx.fillRect(x + 12, y + 42, 7, 7);
    ctx.fillRect(x + 10, y + 48, 10, 4);
    ctx.fillRect(x + 22, y + 42, 7, 11);
    ctx.fillRect(x + 22, y + 51, 10, 4);
  }
  // Skin-specific accents
  if (skin.id === 'camel') {
    // Hump on back
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 16);
    ctx.quadraticCurveTo(x + 18, y + 4, x + 28, y + 16);
    ctx.closePath();
    ctx.fill();
  } else if (skin.id === 'fox') {
    // Pointed ears
    ctx.fillStyle = acc;
    ctx.beginPath();
    ctx.moveTo(x + 32, y); ctx.lineTo(x + 30, y - 8); ctx.lineTo(x + 38, y + 2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 44, y); ctx.lineTo(x + 50, y - 8); ctx.lineTo(x + 48, y + 2);
    ctx.closePath(); ctx.fill();
    // Bushy tail extra
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x - 2, y + 24, 6, 4);
  }
}
function bindDinoControls() {
  function isScreenActive() {
    const scr = document.getElementById('dinoScreen');
    return scr && scr.style.display !== 'none';
  }
  document.addEventListener('keydown', (e) => {
    if (!isScreenActive()) return;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'ArrowUp') { e.preventDefault(); doJump(); }
    else if (e.code === 'ArrowDown' || e.key === 'ArrowDown') { e.preventDefault(); doDuckStart(); }
  });
  document.addEventListener('keyup', (e) => {
    if (!isScreenActive()) return;
    if (e.code === 'ArrowDown' || e.key === 'ArrowDown') { e.preventDefault(); doDuckEnd(); }
  });
  const wrap = document.getElementById('dinoCanvasWrap');
  wrap.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.do-skin')) return;
    e.preventDefault();
    const t = e.touches[0];
    const rect = wrap.getBoundingClientRect();
    const localY = t.clientY - rect.top;
    if (localY > rect.height * 0.6) doDuckStart();
    else doJump();
  }, { passive: false });
  wrap.addEventListener('touchend', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.do-skin')) return;
    e.preventDefault();
    doDuckEnd();
  }, { passive: false });
  wrap.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.do-skin')) return;
    const rect = wrap.getBoundingClientRect();
    if (e.clientY - rect.top > rect.height * 0.6) doDuckStart();
    else doJump();
  });
  wrap.addEventListener('mouseup', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('.do-skin')) return;
    doDuckEnd();
  });
  window.addEventListener('blur', () => { if (isScreenActive()) doDuckEnd(); });
}
function bindButtonControls() {
  const jBtn = document.getElementById('dinoJumpBtn');
  const dBtn = document.getElementById('dinoDuckBtn');
  function press(btn, on) { btn.classList.toggle('pressed', !!on); }
  // Jump button
  ['touchstart','mousedown'].forEach(ev => {
    jBtn.addEventListener(ev, (e) => { e.preventDefault(); press(jBtn, true); doJump(); }, { passive:false });
  });
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev => {
    jBtn.addEventListener(ev, () => press(jBtn, false));
  });
  // Duck button (hold)
  ['touchstart','mousedown'].forEach(ev => {
    dBtn.addEventListener(ev, (e) => { e.preventDefault(); press(dBtn, true); doDuckStart(); }, { passive:false });
  });
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev => {
    dBtn.addEventListener(ev, () => { press(dBtn, false); doDuckEnd(); });
  });
}
function doJump() {
  const startOv = document.getElementById('dinoStartOverlay');
  const overOv = document.getElementById('dinoGameOverOverlay');
  if (DG.state === 'idle' && startOv.style.display !== 'none') { window.dinoStart(); return; }
  if (DG.state === 'dead' && overOv.style.display !== 'none') { window.dinoStart(); return; }
  if (DG.state !== 'running') return;
  if (DG.dinoY === 0) {
    // Ground jump
    DG.dinoVy = DG.JUMP_VEL;
    DG.isDucking = false;
    DG.jumpsUsed = 1;
    dinoSound('jump');
  } else if (DG.djumpTimer > 0 && DG.jumpsUsed < 2) {
    // Air double-jump (only with active power-up)
    DG.dinoVy = DG.JUMP_VEL * 0.92;
    DG.isDucking = false;
    DG.jumpsUsed = 2;
    DG.djumpFx = 14;
    dinoSound('jump');
  }
}
function doDuckStart() {
  if (DG.state !== 'running') return;
  DG.isDucking = true;
  if (DG.dinoY < 0) DG.dinoVy = Math.max(DG.dinoVy, 8);
}
function doDuckEnd() { DG.isDucking = false; }
})();
(function(){
  const GAME_SCREENS = ['gameScreen','trapScreen','xoScreen','c4Screen','memScreen','defuseScreen','dinoScreen','brotScreen','spaceScreen','waneesScreen'];
  function update() {
    const any = GAME_SCREENS.some(id => {
      const el = document.getElementById(id);
      if (!el) return false;
      const d = el.style.display;
      return d && d !== 'none';
    });
    document.body.classList.toggle('in-game', any);
  }
  function init() {
    GAME_SCREENS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(update).observe(el, { attributes:true, attributeFilter:['style'] });
    });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // iOS Safari: block pinch-zoom and double-tap zoom while a game is open
  function inGame(){
    return document.body.classList.contains('in-game') ||
           document.body.classList.contains('dino-active') ||
           document.body.classList.contains('wanees-active');
  }
  ['gesturestart','gesturechange','gestureend'].forEach(ev => {
    document.addEventListener(ev, e => { if (inGame()) e.preventDefault(); }, { passive:false });
  });
})();
