
(function(){
const BR = {
  state:'idle', rot:0, score:0, best:0, t:0,
  rotRate:0.6, baseRotRate:0.6,
  arenaEl:null, fillEl:null, pctEl:null, cellsEl:null,
  qBox:null, qTextEl:null, qOptsEl:null, currentAnswer:null,
  questionTimer:null, lastTick:0, loopRaf:0,
  popups:[], cookie:null, captcha:null,
  spawnPopupTimer:0, spawnCookieTimer:0, spawnCaptchaTimer:0,
  doomTimer:0, doom:null,
  notifTimer:0, notifNext:24, notif:null,
  detoxCount:1, detoxEarnTimer:0, freezeTimer:0,
  trapWeights:{ popup:1, cookie:1, captcha:1, notif:1 }, learnedShown:false,
  answerStreak:0,
  widgetsSpawned:false,
  bgCtx:null, bgCanvas:null,
  subCanvas:null, soapCanvas:null,
  subState:{ y:0, obstacles:[], color:'#00ff66' },
  soapState:{ x:0, slices:[] },
  roast:{ correctAnswers:0, wrongAnswers:0, timedOut:0, popupClosed:0, popupCtaFell:0, cookieAccept:0, cookieReject:0, captchaPerfect:0, captchaWrong:0 },
  RANKS: [
    { min:0,    name:'NPC تعفّن أساسي' },
    { min:300,  name:'GigaChad مبتدئ' },
    { min:700,  name:'Skibidi Apprentice' },
    { min:1200, name:'Sigma متمكّن' },
    { min:2000, name:'Ultimate Sigma 🔥' },
    { min:3500, name:'المتعفّن الأكبر 👑' }
  ],
  POPUP_TEMPLATES: [
    { t:'⚠️ تنبيه!', b:'تم اكتشاف ٢٣٤ خلية مخ زائدة. هل تريد إزالتها الآن؟', cta:'نعم احذف ✓' },
    { t:'🎉 مبروك!', b:'لقد ربحت لقب Alpha Male! اضغط هنا للمطالبة بجائزتك الآن.', cta:'استلم لقب ALPHA' },
    { t:'🚨 خطر!', b:'دماغك يعمل بشكل طبيعي. يجب إيقاف هذا فوراً.', cta:'أوقف التفكير' },
    { t:'💎 عرض حصري!', b:'كورس "كيف تصبح Sigma في ٣ أيام" بسعر ٠ ريال!', cta:'احجز مكانك 🔥' },
    { t:'🦷 OHIO ALERT', b:'أنت في Ohio الآن. الهروب يتطلب موافقتك.', cta:'وافق فوراً' },
    { t:'📢 اكتشف!', b:'هذا الميم سيغير حياتك للأبد. اضغط الآن!', cta:'غيّر حياتي' },
    { t:'⏰ آخر فرصة!', b:'إذا لم تضغط الآن، دماغك سيعود طبيعياً!', cta:'لا تتركني!' },
    { t:'🤖 لست روبوت؟', b:'أثبت إنسانيتك بالضغط على الزر الذهبي.', cta:'أنا إنسان (؟)' },
    { t:'🎮 Skibidi Toilet', b:'موسم جديد متاح! ٤٢ حلقة بدون قصة.', cta:'شاهد الآن' },
    { t:'💀 تحديث مطلوب', b:'دماغك يحتاج تحديث لإصدار البراين روت ٢.٠', cta:'حدّث الآن' }
  ],
  CAPTCHA_PROMPTS: [
    { word:'Sigma',      good:['🦍','💪','🗿','😎'], bad:['🐱','🌸','🧸','📚','🌈'] },
    { word:'Skibidi',    good:['🚽','🎵','💩','🚿'], bad:['📖','🌳','🍞','💐','🌷'] },
    { word:'Ohio',       good:['🌽','🦷','👁️','🧟'], bad:['☕','🌹','📰','🏛️','🎻'] },
    { word:'GigaChad',   good:['💪','🗿','🦍','😎'], bad:['🍰','🧶','🍵','🪻','📚'] },
    { word:'Brain Rot',  good:['🧠','💀','🤯','📱'], bad:['🌳','📖','☕','🌷','🧘'] }
  ],
  QUESTION_GENS: [
    () => { const a = 2+Math.floor(Math.random()*8), b = 2+Math.floor(Math.random()*8); return { q: ar(a)+' + '+ar(b)+' = ؟', ans:a+b }; },
    () => { const a = 5+Math.floor(Math.random()*10), b = 1+Math.floor(Math.random()*4); return { q: ar(a)+' − '+ar(b)+' = ؟', ans:a-b }; },
    () => { const a = 2+Math.floor(Math.random()*5), b = 2+Math.floor(Math.random()*5); return { q: ar(a)+' × '+ar(b)+' = ؟', ans:a*b }; },
    () => { const a = 6+Math.floor(Math.random()*15); const even = a%2===0; return { q: ar(a)+' زوجي أم فردي؟', ans: even?'زوجي':'فردي', textChoices:['زوجي','فردي'] }; },
    () => { const a = 2+Math.floor(Math.random()*15), b = 2+Math.floor(Math.random()*15); if(a===b)return { q: ar(a)+' أكبر أم أصغر من '+ar(b+1)+'؟', ans:'أصغر', textChoices:['أكبر','أصغر'] }; return { q: ar(a)+' أكبر أم أصغر من '+ar(b)+'؟', ans: a>b?'أكبر':'أصغر', textChoices:['أكبر','أصغر'] }; },
    // متتالية رقمية — أكمل النمط
    () => { const start=2+Math.floor(Math.random()*5); const step=1+Math.floor(Math.random()*3); const seq=[start,start+step,start+step*2]; return { q: seq.map(ar).join(' ، ')+' ، ؟', ans: start+step*3 }; },
    // عُدّ الإيموجي
    () => { const n=2+Math.floor(Math.random()*5); return { q:'كم نار؟ '+'🔥'.repeat(n), ans:n }; },
    // الدخيل — ليس فاكهة
    () => { const fruits=['🍎','🍌','🍇','🍊','🍓','🍉']; const others=['🚗','⚽','📱','🚀','🎸','🔑','🧦']; const f=fruits.slice().sort(()=>Math.random()-0.5).slice(0,3); const odd=others[Math.floor(Math.random()*others.length)]; return { q:'أيها ليس فاكهة؟', ans:odd, textChoices:[...f,odd] }; },
    // التصنيف — أيهم حيوان
    () => { const animals=['🐶','🐱','🦁','🐘','🦊','🐸','🐼']; const non=['🍕','🌳','🚗','⭐','🎈','📚','☂️']; const a=animals[Math.floor(Math.random()*animals.length)]; const n=non.slice().sort(()=>Math.random()-0.5).slice(0,3); return { q:'أيهم حيوان؟', ans:a, textChoices:[a,...n] }; }
  ]
};
window.BRAIN_ROT = BR;

function ar(n) {
  const d = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).split('').map(c => d[+c] || c).join('');
}
function brot(name) {
  if (typeof isMuted !== 'undefined' && isMuted) return;
  if (typeof playTone !== 'function') return;
  switch(name) {
    case 'correct':
      playTone(659, 0.08, 'square', 0.22);
      setTimeout(() => playTone(988, 0.10, 'square', 0.22), 60);
      setTimeout(() => playTone(1318, 0.15, 'triangle', 0.18), 130);
      break;
    case 'wrong':
      playTone(165, 0.18, 'sawtooth', 0.32);
      setTimeout(() => playTone(110, 0.25, 'sawtooth', 0.28), 120);
      break;
    case 'popup':
      playTone(880, 0.04, 'square', 0.18);
      setTimeout(() => playTone(1320, 0.04, 'square', 0.16), 40);
      break;
    case 'popup_close':
      playTone(440, 0.04, 'triangle', 0.16);
      break;
    case 'cookie_trap':
      playTone(90, 0.4, 'sawtooth', 0.4);
      setTimeout(() => playTone(70, 0.5, 'sawtooth', 0.32), 220);
      break;
    case 'captcha_in':
      playTone(523, 0.06, 'sine', 0.14);
      setTimeout(() => playTone(659, 0.08, 'sine', 0.14), 80);
      break;
    case 'death':
      [440, 370, 294, 220, 165, 110].forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'sawtooth', 0.28), i*160));
      break;
    case 'vine':
      // mini Vine Boom
      playTone(80, 0.25, 'sine', 0.45);
      setTimeout(() => playTone(60, 0.3, 'sine', 0.32), 80);
      break;
  }
}
window.syncBrotMuteIcon = function() {
  const b = document.getElementById('brotMuteBtn');
  if (b) b.textContent = (typeof isMuted !== 'undefined' && isMuted) ? '🔇' : '🔊';
};
window.playBrainRot = function() {
  if (typeof hideAllScreens === 'function') hideAllScreens();
  const scr = document.getElementById('brotScreen');
  if (!scr) return;
  scr.classList.add('active');
  scr.style.display = 'flex';
  document.body.classList.add('brot-active');
  if (typeof _setNavShow === 'function') _setNavShow(false);
  initBrainRot();
};
window.exitBrainRot = function() {
  stopBrainRot();
  resetBrainRotState();
  document.body.classList.remove('brot-active');
  const scr = document.getElementById('brotScreen');
  if (scr) { scr.classList.remove('active'); scr.style.display = 'none'; }
  document.getElementById('brotStartOverlay').style.display = 'flex';
  document.getElementById('brotOverOverlay').style.display = 'none';
  if (typeof returnFromGame === 'function') returnFromGame();
  else if (typeof goToLanding === 'function') goToLanding();
};
function initBrainRot() {
  BR.arenaEl = document.getElementById('brotArena');
  BR.fillEl = document.getElementById('brotMeterFill');
  BR.pctEl = document.getElementById('brotMeterPct');
  BR.cellsEl = document.getElementById('brotCellsVal');
  BR.qBox = document.getElementById('brotQuestionBox');
  BR.qTextEl = document.getElementById('brotQText');
  BR.qOptsEl = document.getElementById('brotQOpts');
  BR.bgCanvas = document.getElementById('brotBgCanvas');
  BR.bgCtx = BR.bgCanvas.getContext('2d');
  BR.subCanvas = document.getElementById('brotSubCanvas');
  BR.soapCanvas = document.getElementById('brotSoapCanvas');
  resizeBrotBg();
  window.addEventListener('resize', resizeBrotBg);
  try {
    const p = (typeof loadProfile === 'function') ? loadProfile() : null;
    BR.best = (p && p.stats && p.stats.brainrot && p.stats.brainrot.bestScore) || 0;
  } catch(e) { BR.best = 0; }
  resetBrainRotState();
  syncBrotMuteIcon();
  document.getElementById('brotStartOverlay').style.display = 'flex';
  document.getElementById('brotOverOverlay').style.display = 'none';
}
function resizeBrotBg() {
  if (!BR.bgCanvas) return;
  const r = BR.bgCanvas.getBoundingClientRect();
  BR.bgCanvas.width = Math.max(320, r.width);
  BR.bgCanvas.height = Math.max(240, r.height);
}
function resetBrainRotState() {
  BR.state = 'idle';
  BR.rot = 0; BR.score = 0; BR.t = 0;
  if (BR._gkParticles) BR._gkParticles.clear();
  BR._gkLast = null;
  BR.rotRate = BR.baseRotRate;
  BR.spawnPopupTimer = 0; BR.spawnCookieTimer = 0; BR.spawnCaptchaTimer = 0;
  BR.doomTimer = 0; BR.doom = null;
  BR.notifTimer = 0; BR.notifNext = 24; BR.notif = null;
  BR.detoxCount = 1; BR.detoxEarnTimer = 0; BR.freezeTimer = 0;
  BR.trapWeights = { popup:1, cookie:1, captcha:1, notif:1 }; BR.learnedShown = false;
  BR.answerStreak = 0;
  BR.widgetsSpawned = false;
  BR.roast = { correctAnswers:0, wrongAnswers:0, timedOut:0, popupClosed:0, popupCtaFell:0, cookieAccept:0, cookieReject:0, captchaPerfect:0, captchaWrong:0 };
  clearTimeout(BR.questionTimer);
  // clear DOM distractions
  document.querySelectorAll('.brot-popup, .brot-cookie, .brot-captcha, .brot-doom, .brot-notification').forEach(el => { if (el._doomTimer) clearInterval(el._doomTimer); if (el._notifTimer) clearTimeout(el._notifTimer); if (el._rotTick) clearInterval(el._rotTick); el.remove(); });
  BR.popups = []; BR.cookie = null; BR.captcha = null; BR.doom = null; BR.notif = null;
  const sub = document.getElementById('brotWidgetSub');
  const soap = document.getElementById('brotWidgetSoap');
  if (sub) sub.style.display = 'none';
  if (soap) soap.style.display = 'none';
  if (BR.qBox) BR.qBox.style.display = 'none';
  updateMeterUI();
  updateCellsUI();
  if (BR.fillEl && BR.fillEl.parentNode) BR.fillEl.parentNode.classList.remove('frozen');
  updateDetoxBtn();
}
window.brainrotStart = function() {
  document.getElementById('brotStartOverlay').style.display = 'none';
  document.getElementById('brotOverOverlay').style.display = 'none';
  resetBrainRotState();
  updateDetoxBtn();
  BR.state = 'running';
  BR.lastTick = performance.now();
  cancelAnimationFrame(BR.loopRaf);
  BR.loopRaf = requestAnimationFrame(brotLoop);
  // first question immediately
  setTimeout(spawnQuestion, 500);
};
function stopBrainRot() {
  cancelAnimationFrame(BR.loopRaf);
  clearTimeout(BR.questionTimer);
  BR.state = 'idle';
}
function brotLoop(t) {
  if (BR.state !== 'running') return;
  const dt = Math.min(40, t - BR.lastTick) / 1000; // seconds
  BR.lastTick = t;
  updateBR(dt);
  if (BR.state !== 'running') return;
  drawBg();
  drawSub();
  drawSoap();
  BR.loopRaf = requestAnimationFrame(brotLoop);
}
// Central rot-damage hit: shakes the screen and bursts glitch particles
// proportional to how hard the algorithm got you.
function rotHit(amount) {
  BR.rot = Math.min(100, BR.rot + amount);
  const scr = document.getElementById('brotScreen');
  if (scr) {
    scr.classList.remove('brot-shake-sm', 'brot-shake-lg');
    void scr.offsetWidth; // restart animation
    scr.classList.add(amount >= 12 ? 'brot-shake-lg' : 'brot-shake-sm');
  }
  if (window.GameKit && BR.bgCanvas) {
    if (!BR._gkParticles) BR._gkParticles = new GameKit.ParticleSystem(128);
    BR._gkParticles.burst(BR.bgCanvas.width / 2, BR.bgCanvas.height / 2, {
      count: Math.min(30, 6 + amount * 1.2),
      palette: ['#ff0099', '#00f0ff', '#ffe600', '#00ff66'],
      speedMin: 1.5, speedMax: 4 + amount * 0.15,
      size: 2.5, life: 28, lifeJitter: 14, shape: 'star'
    });
  }
}
function learnTrap(kind, fell) {
  // The "algorithm" adapts: traps you fall for show up more; ones you resist back off
  const w = BR.trapWeights;
  if (fell) {
    w[kind] = Math.min(3, w[kind] + 0.5);
    // First time the algorithm clearly locks onto a weakness
    if (!BR.learnedShown && w[kind] >= 2) {
      BR.learnedShown = true;
      const names = { popup:'الإعلانات', cookie:'الكوكيز', captcha:'الكابتشا' };
      try { if (typeof showToast === 'function') showToast('👁️ الخوارزمية تعرف ضعفك: ' + (names[kind] || ''), '#ff0099'); } catch(e){}
      brot('vine');
    }
  } else {
    w[kind] = Math.max(0.6, w[kind] - 0.25);
  }
}
function updateBR(dt) {
  BR.t += dt;
  // Difficulty ramp
  BR.rotRate = BR.baseRotRate + Math.min(2.4, BR.t * 0.02);
  // Freeze tick: meter doesn't rise while frozen (from Detox)
  if (BR.freezeTimer > 0) {
    BR.freezeTimer -= dt;
    if (BR.freezeTimer <= 0) {
      BR.freezeTimer = 0;
      BR.fillEl && BR.fillEl.parentNode && BR.fillEl.parentNode.classList.remove('frozen');
    }
  } else {
    BR.rot += BR.rotRate * dt;
  }
  BR.rot = Math.max(0, BR.rot);
  BR.score += dt * 10; // 10 cells per second baseline
  // Detox: earn one every 70 seconds, cap at 3
  BR.detoxEarnTimer += dt;
  if (BR.detoxEarnTimer > 70) {
    BR.detoxEarnTimer = 0;
    if (BR.detoxCount < 3) {
      BR.detoxCount++;
      updateDetoxBtn();
      try { if (typeof showToast === 'function') showToast('💊 حصلت على Digital Detox!', '#00ff66'); } catch(e){}
    }
  }
  updateMeterUI();
  updateCellsUI();
  if (BR.rot >= 100) { onBrotDeath(); return; }
  // Spawn distractions — frequency adapts to the player's weaknesses (learning algorithm)
  BR.spawnPopupTimer += dt;
  BR.spawnCookieTimer += dt;
  BR.spawnCaptchaTimer += dt;
  // Higher weight (trap you keep falling for) = shorter delay = appears more often
  const popupDelay = Math.max(2, (8 - BR.t * 0.05) / BR.trapWeights.popup);
  const maxPopups = BR.trapWeights.popup >= 2 ? 6 : 4;
  if (BR.t > 10 && BR.spawnPopupTimer > popupDelay && BR.popups.length < maxPopups) {
    BR.spawnPopupTimer = 0;
    spawnPopup();
  }
  const cookieDelay = Math.max(8, 22 / BR.trapWeights.cookie);
  if (BR.t > 25 && BR.spawnCookieTimer > cookieDelay && !BR.cookie) {
    BR.spawnCookieTimer = 0;
    spawnCookie();
  }
  const captchaDelay = Math.max(14, 35 / BR.trapWeights.captcha);
  if (BR.t > 45 && BR.spawnCaptchaTimer > captchaDelay && !BR.captcha) {
    BR.spawnCaptchaTimer = 0;
    spawnCaptcha();
  }
  // Doom-Scrolling phase: every ~80s, an irresistible feed appears
  BR.doomTimer += dt;
  if (BR.t > 60 && BR.doomTimer > 80 && !BR.doom && !BR.captcha) {
    BR.doomTimer = 0;
    spawnDoomScroll();
  }
  // Fake push notifications — appear from the top, must ignore
  BR.notifTimer += dt;
  const notifDelay = Math.max(10, BR.notifNext / BR.trapWeights.notif);
  if (BR.t > 15 && BR.notifTimer > notifDelay && !BR.notif && !BR.doom) {
    BR.notifTimer = 0;
    BR.notifNext = 22 + Math.random() * 16;
    spawnNotification();
  }
  // Spawn corner widgets once after a while
  if (!BR.widgetsSpawned && BR.t > 18) {
    BR.widgetsSpawned = true;
    document.getElementById('brotWidgetSub').style.display = 'block';
    setTimeout(() => { document.getElementById('brotWidgetSoap').style.display = 'block'; }, 4000);
  }
  // Random vine boom
  if (Math.random() < 0.003 * Math.min(1, BR.t / 30)) brot('vine');
}
function updateMeterUI() {
  if (!BR.fillEl) return;
  const pct = Math.min(100, BR.rot);
  BR.fillEl.style.width = pct + '%';
  BR.pctEl.textContent = Math.floor(pct) + '%';
  // Screen shake when high
  if (BR.arenaEl) {
    if (pct > 70) {
      const intensity = (pct - 70) / 30;
      const dx = (Math.random() - 0.5) * intensity * 6;
      const dy = (Math.random() - 0.5) * intensity * 6;
      BR.arenaEl.style.transform = 'translate('+dx+'px,'+dy+'px)';
    } else {
      BR.arenaEl.style.transform = '';
    }
  }
}
function updateCellsUI() {
  if (BR.cellsEl) BR.cellsEl.textContent = ar(Math.floor(BR.score));
}
function spawnQuestion() {
  if (BR.state !== 'running') return;
  const gen = BR.QUESTION_GENS[Math.floor(Math.random() * BR.QUESTION_GENS.length)];
  const q = gen();
  BR.currentAnswer = q.ans;
  BR.qTextEl.textContent = q.q;
  BR.qOptsEl.innerHTML = '';
  let options;
  if (q.textChoices) {
    options = q.textChoices.slice().sort(() => Math.random() - 0.5);
  } else {
    options = [q.ans];
    while (options.length < 4) {
      const delta = (Math.floor(Math.random() * 6) - 3) || 1;
      const candidate = q.ans + delta;
      if (candidate >= 0 && !options.includes(candidate)) options.push(candidate);
    }
    options.sort(() => Math.random() - 0.5);
  }
  options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'brot-q-opt';
    b.textContent = (typeof o === 'number') ? ar(o) : o;
    b.onclick = () => answerQuestion(o, b);
    BR.qOptsEl.appendChild(b);
  });
  BR.qBox.style.display = 'block';
  // Auto-rot if no answer in 10s (penalty)
  clearTimeout(BR.questionTimer);
  BR.questionTimer = setTimeout(() => {
    if (BR.state === 'running' && BR.qBox.style.display !== 'none') {
      rotHit(8);
      BR.roast.timedOut++;
      BR.answerStreak = 0;
      updateMeterUI();
      BR.qBox.style.display = 'none';
      setTimeout(spawnQuestion, 1200 + Math.random() * 1500);
    }
  }, 12000);
}
function answerQuestion(picked, btn) {
  if (BR.state !== 'running') return;
  const correct = (picked === BR.currentAnswer);
  clearTimeout(BR.questionTimer);
  if (correct) {
    btn.classList.add('correct');
    BR.rot = Math.max(0, BR.rot - 8);
    BR.score += 30;
    BR.roast.correctAnswers++;
    brot('correct');
    // Awakening combo: 3 correct in a row = big rot drop
    BR.answerStreak++;
    if (BR.answerStreak > 0 && BR.answerStreak % 3 === 0) {
      BR.rot = Math.max(0, BR.rot - 25);
      BR.score += 50;
      try { if (typeof showToast === 'function') showToast('🧠 عقلك يقاوم! صحوة −٢٥٪', '#00ff66'); } catch(e){}
      brot('correct');
    }
  } else {
    btn.classList.add('wrong');
    rotHit(6);
    BR.roast.wrongAnswers++;
    BR.answerStreak = 0;
    brot('wrong');
  }
  updateMeterUI();
  updateCellsUI();
  setTimeout(() => {
    BR.qBox.style.display = 'none';
    setTimeout(spawnQuestion, 800 + Math.random() * 1400);
  }, 500);
}
function spawnPopup() {
  if (BR.state !== 'running') return;
  const tpl = BR.POPUP_TEMPLATES[Math.floor(Math.random() * BR.POPUP_TEMPLATES.length)];
  const el = document.createElement('div');
  el.className = 'brot-popup';
  const W = BR.arenaEl.clientWidth, H = BR.arenaEl.clientHeight;
  const pw = Math.min(260, W * 0.7);
  const ph = 140;
  const left = Math.random() * (W - pw - 20) + 10;
  const top  = Math.random() * (H - ph - 100) + 60;
  el.style.left = left + 'px';
  el.style.top  = top + 'px';
  el.style.transform = 'rotate(' + (Math.random() * 6 - 3) + 'deg)';
  el.innerHTML = '<button class="brot-popup-x" type="button">×</button>' +
    '<div class="brot-popup-title">' + tpl.t + '</div>' +
    '<div class="brot-popup-body">' + tpl.b + '</div>' +
    '<div class="brot-popup-cta">' + tpl.cta + '</div>';
  BR.arenaEl.appendChild(el);
  BR.popups.push(el);
  brot('popup');
  // X button: makes it run away on hover/touch
  const xBtn = el.querySelector('.brot-popup-x');
  const trySolve = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    closePopup(el);
  };
  const runAway = () => {
    xBtn.classList.add('runaway');
    const popupRect = el.getBoundingClientRect();
    const newX = Math.random() * (popupRect.width - 40);
    const newY = Math.random() * Math.max(20, popupRect.height - 40);
    xBtn.style.top = newY + 'px';
    xBtn.style.left = newX + 'px';
    xBtn.style.right = 'auto';
  };
  let escapeCount = 0;
  xBtn.addEventListener('mouseenter', () => {
    if (escapeCount < 3 && Math.random() < 0.85) { escapeCount++; runAway(); }
  });
  xBtn.addEventListener('touchstart', (e) => {
    if (escapeCount < 2 && Math.random() < 0.65) {
      e.preventDefault(); escapeCount++; runAway();
    } else { trySolve(e); }
  }, { passive:false });
  xBtn.addEventListener('click', trySolve);
  // CTA button (trap)
  const cta = el.querySelector('.brot-popup-cta');
  const trapHit = () => {
    rotHit(10);
    BR.roast.popupCtaFell++;
    learnTrap('popup', true);
    updateMeterUI();
    brot('cookie_trap');
    closePopup(el);
  };
  cta.addEventListener('click', (e) => { e.stopPropagation(); trapHit(); });
  cta.addEventListener('touchstart', (e) => { e.preventDefault(); trapHit(); }, { passive:false });
  // Auto-rot penalty for uncl losed popups
  el._rotTick = setInterval(() => {
    if (BR.state === 'running' && el.parentNode) {
      BR.rot = Math.min(100, BR.rot + 0.3);
    }
  }, 1000);
}
function closePopup(el) {
  if (el._rotTick) clearInterval(el._rotTick);
  el.style.animation = 'brotPopupIn 0.18s reverse';
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    BR.popups = BR.popups.filter(p => p !== el);
  }, 180);
  brot('popup_close');
  BR.score += 8;
  BR.roast.popupClosed++;
  learnTrap('popup', false);
  updateCellsUI();
}
function spawnCookie() {
  if (BR.state !== 'running' || BR.cookie) return;
  const el = document.createElement('div');
  el.className = 'brot-cookie';
  el.innerHTML = '<div class="brot-cookie-title">🍪 نستخدم ملفات تعريف الارتباط</div>' +
    '<div class="brot-cookie-body">لتحسين تجربة تعفّن دماغك. بالضغط على "موافق" أنت تقبل تحويل ٢٣٪ من خلايا مخك إلى محتوى عشوائي.</div>' +
    '<div class="brot-cookie-row">' +
    '<button class="brot-cookie-accept" type="button">موافق على الكل ✓</button>' +
    '<button class="brot-cookie-reject" type="button">رفض</button>' +
    '</div>';
  BR.arenaEl.appendChild(el);
  BR.cookie = el;
  brot('popup');
  const accept = el.querySelector('.brot-cookie-accept');
  const reject = el.querySelector('.brot-cookie-reject');
  accept.addEventListener('click', () => {
    rotHit(15);
    BR.roast.cookieAccept++;
    learnTrap('cookie', true);
    updateMeterUI();
    brot('cookie_trap');
    removeCookie();
  });
  reject.addEventListener('click', () => {
    BR.rot = Math.max(0, BR.rot - 4);
    BR.score += 60;
    BR.roast.cookieReject++;
    learnTrap('cookie', false);
    updateMeterUI(); updateCellsUI();
    brot('correct');
    removeCookie();
  });
}
function removeCookie() {
  if (!BR.cookie) return;
  const el = BR.cookie;
  el.style.animation = 'brotPopupIn 0.2s reverse';
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
  BR.cookie = null;
}
function spawnCaptcha() {
  if (BR.state !== 'running' || BR.captcha) return;
  const tpl = BR.CAPTCHA_PROMPTS[Math.floor(Math.random() * BR.CAPTCHA_PROMPTS.length)];
  const goodCount = 3 + Math.floor(Math.random() * 2);
  // build 9 cells: pick goodCount good + fill with bad
  const cells = [];
  const goods = tpl.good.slice().sort(() => Math.random() - 0.5).slice(0, goodCount);
  goods.forEach(e => cells.push({ emoji:e, good:true }));
  while (cells.length < 9) {
    cells.push({ emoji: tpl.bad[Math.floor(Math.random() * tpl.bad.length)], good:false });
  }
  cells.sort(() => Math.random() - 0.5);
  const el = document.createElement('div');
  el.className = 'brot-captcha';
  el.innerHTML = '<div class="brot-captcha-hdr"><span>🤖 reCAPTCHA</span><span>v3</span></div>' +
    '<div class="brot-captcha-q">اختر كل الصور التي تحتوي على <b>'+tpl.word+'</b></div>' +
    '<div class="brot-captcha-grid">' + cells.map((c, i) =>
      '<div class="brot-captcha-cell" data-i="'+i+'" data-good="'+(c.good?1:0)+'">' + c.emoji + '</div>'
    ).join('') + '</div>' +
    '<button class="brot-captcha-submit" type="button">تحقّق</button>';
  BR.arenaEl.appendChild(el);
  BR.captcha = el;
  brot('captcha_in');
  const cellsEls = el.querySelectorAll('.brot-captcha-cell');
  cellsEls.forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('selected'));
  });
  el.querySelector('.brot-captcha-submit').addEventListener('click', () => {
    let pickedGood = 0, pickedBad = 0, totalGood = goods.length;
    cellsEls.forEach(c => {
      if (c.classList.contains('selected')) {
        if (c.dataset.good === '1') pickedGood++;
        else pickedBad++;
      }
    });
    const perfect = (pickedGood === totalGood && pickedBad === 0);
    if (perfect) {
      BR.rot = Math.max(0, BR.rot - 10);
      BR.score += 80;
      BR.roast.captchaPerfect++;
      learnTrap('captcha', false);
      brot('correct');
    } else {
      rotHit(8);
      BR.roast.captchaWrong++;
      learnTrap('captcha', true);
      brot('wrong');
    }
    updateMeterUI(); updateCellsUI();
    el.style.animation = 'brotPopupIn 0.2s reverse';
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); BR.captcha = null; }, 200);
  });
}
const DOOM_POSTS = [
  { name:'sigma_brain', body:'هذا الفيديو سيغيّر حياتك! اضغط الآن ↓<span class="em">🔥💀</span>' },
  { name:'skibidi_news', body:'٩٩٪ من الناس لا يعرفون هذا السرّ <span class="em">🚽🦷</span>' },
  { name:'ohio_alpha', body:'لو ضغطت ستصبح Sigma خلال ٣ ثوانٍ <span class="em">🗿💪</span>' },
  { name:'rizz_master', body:'كيف اكتسبت ١٠٠٠ متابع في يوم واحد… <span class="em">📈✨</span>' },
  { name:'meme_lord', body:'لا تُكمل قراءة هذا المنشور <span class="em">👁️🧠</span>' },
  { name:'gigachad_99', body:'الناس الذين تجاهلوا هذا الفيديو ندموا <span class="em">😤</span>' },
  { name:'brain_rot', body:'هذا الـPOV سيجعلك تبكي <span class="em">😭🎬</span>' },
  { name:'aesthetic_x', body:'صورة ✨جمالية✨ ستغير مزاجك للأبد <span class="em">🌸💫</span>' }
];
function spawnDoomScroll(){
  if (BR.state !== 'running' || BR.doom) return;
  const el = document.createElement('div');
  el.className = 'brot-doom';
  const cards = [];
  for (let i = 0; i < 5; i++){
    const p = DOOM_POSTS[Math.floor(Math.random() * DOOM_POSTS.length)];
    cards.push(
      '<div class="bd-card">' +
      '<div class="bd-card-head"><div class="bd-card-avatar"></div><div class="bd-card-name">@' + p.name + '</div></div>' +
      '<div class="bd-card-body">' + p.body + '</div>' +
      '<div class="bd-card-actions">❤️ ' + Math.floor(Math.random()*99+10) + 'K  💬 ' + Math.floor(Math.random()*5+1) + 'K  ↗ شارك</div>' +
      '</div>'
    );
  }
  el.innerHTML = '<div class="bd-banner">' +
    '<div class="bd-warning">⚠ DOOM SCROLL ALERT ⚠</div>' +
    '<div class="bd-instruction">لا تلمس الـfeed! اصمد <b id="bdTime">١٠</b> ث</div>' +
    '<div class="bd-progress"><div class="bd-progress-fill" id="bdFill"></div></div>' +
    '</div>' +
    '<div class="brot-doom-feed" id="brotDoomFeed">' + cards.join('') + '</div>' +
    '<button class="brot-doom-claim" id="bdClaim">✅ ابتعدت! استلم المكافأة</button>';
  BR.arenaEl.appendChild(el);
  BR.doom = el;
  brot('captcha_in');
  const feedEl = el.querySelector('#brotDoomFeed');
  const fillEl = el.querySelector('#bdFill');
  const timeEl = el.querySelector('#bdTime');
  const claimEl = el.querySelector('#bdClaim');
  let remaining = 10000; // ms
  let failed = false;
  // Track touches on the feed area — that means "scrolling"
  const onFail = (e) => {
    if (failed || !el.parentNode) return;
    failed = true;
    if (e){ e.preventDefault(); e.stopPropagation(); }
    rotHit(25);
    BR.answerStreak = 0;
    updateMeterUI();
    brot('cookie_trap');
    try { if (typeof showToast === 'function') showToast('💀 لمست الـfeed! +٢٥٪ تعفّن', '#ff3030'); } catch(e){}
    closeDoom(el);
  };
  feedEl.addEventListener('touchstart', onFail, { passive:false });
  feedEl.addEventListener('mousedown', onFail);
  feedEl.addEventListener('wheel', onFail, { passive:false });
  claimEl.addEventListener('click', () => {
    if (failed) return;
    BR.rot = Math.max(0, BR.rot - 15);
    BR.score += 120;
    updateMeterUI(); updateCellsUI();
    brot('correct');
    try { if (typeof showToast === 'function') showToast('🧠 صمدت ضد التمرير! +١٢٠ خلية', '#00ff66'); } catch(e){}
    closeDoom(el);
  });
  // Countdown
  el._doomTimer = setInterval(() => {
    if (BR.state !== 'running' || !el.parentNode || failed){ clearInterval(el._doomTimer); return; }
    remaining -= 100;
    const pct = Math.max(0, remaining / 10000);
    fillEl.style.width = (pct * 100) + '%';
    timeEl.textContent = ar(Math.max(0, Math.ceil(remaining / 1000)));
    if (remaining <= 0){
      clearInterval(el._doomTimer);
      claimEl.classList.add('show');
      timeEl.textContent = ar(0);
    }
  }, 100);
}
function closeDoom(el){
  if (el._doomTimer) clearInterval(el._doomTimer);
  el.style.animation = 'brotPopupIn 0.2s reverse';
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); BR.doom = null; }, 200);
}
const NOTIFICATIONS = [
  { app:'whatsapp',  icon:'💬', name:'WhatsApp', sender:'سهى ❤️',     msg:'وين راحت لو ما رديت بحذفك جدياً' },
  { app:'whatsapp',  icon:'💬', name:'WhatsApp', sender:'الشلة',        msg:'علي: شفتوا الفيديو اللي شاركته؟' },
  { app:'whatsapp',  icon:'💬', name:'WhatsApp', sender:'الوالد',       msg:'تعال الأكل بدونك' },
  { app:'instagram', icon:'📷', name:'Instagram', sender:'@meme_lord',  msg:'أعجب بصورتك' },
  { app:'instagram', icon:'📷', name:'Instagram', sender:'النشاط',      msg:'٣ أشخاص جدد بدأوا متابعتك' },
  { app:'tiktok',    icon:'🎵', name:'TikTok',    sender:'TikTok',     msg:'فيديو جديد لـ@sigma_brain — ٢.١م إعجاب' },
  { app:'tiktok',    icon:'🎵', name:'TikTok',    sender:'TikTok',     msg:'🔥 فيديو ترند سيختفي خلال ٣ ثوانٍ' },
  { app:'twitter',   icon:'𝕏',  name:'Twitter / X', sender:'@gigachad_99', msg:'ذكرك في تغريدة' },
  { app:'snap',      icon:'👻', name:'Snapchat',  sender:'سعد',         msg:'أرسل لك سناب جديد' },
  { app:'tiktok',    icon:'🎵', name:'TikTok',    sender:'TikTok',     msg:'٢٣ تعليق جديد على فيديوك' }
];
function spawnNotification() {
  if (BR.state !== 'running' || BR.notif) return;
  const n = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
  const el = document.createElement('div');
  el.className = 'brot-notification';
  el.innerHTML =
    '<div class="bn-icon ' + n.app + '">' + n.icon + '</div>' +
    '<div class="bn-body">' +
      '<div class="bn-app">' + n.name + ' · الآن</div>' +
      '<div class="bn-title">' + n.sender + '</div>' +
      '<div class="bn-msg">' + n.msg + '</div>' +
    '</div>';
  BR.arenaEl.appendChild(el);
  BR.notif = el;
  brot('popup');
  let resolved = false;
  const onTap = (e) => {
    if (resolved) return;
    resolved = true;
    if (e) { e.preventDefault(); e.stopPropagation(); }
    rotHit(15);
    BR.answerStreak = 0;
    learnTrap('notif', true);
    updateMeterUI();
    brot('cookie_trap');
    try { if (typeof showToast === 'function') showToast('📱 لمحت الإشعار! +١٥٪ تعفّن', '#ff3030'); } catch(e){}
    closeNotif(el);
  };
  el.addEventListener('click', onTap);
  el.addEventListener('touchstart', onTap, { passive:false });
  // Auto-dismiss after 4s = success (resisted)
  el._notifTimer = setTimeout(() => {
    if (resolved) return;
    resolved = true;
    BR.score += 15;
    learnTrap('notif', false);
    updateCellsUI();
    brot('popup_close');
    closeNotif(el);
  }, 4000);
}
function closeNotif(el) {
  if (el._notifTimer) clearTimeout(el._notifTimer);
  el.classList.add('dismissing');
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); BR.notif = null; }, 320);
}
function updateDetoxBtn() {
  const btn = document.getElementById('brotDetoxBtn');
  if (!btn) return;
  if (BR.detoxCount > 0) {
    btn.classList.add('has');
    const c = document.getElementById('brotDetoxCount');
    if (c) c.textContent = BR.detoxCount;
  } else {
    btn.classList.remove('has');
  }
}
window.useDetox = function() {
  if (BR.state !== 'running' || BR.detoxCount <= 0) return;
  BR.detoxCount--;
  updateDetoxBtn();
  // Clear all popups + cookies + notifs (but not captcha/doom — those are deliberate tests)
  document.querySelectorAll('.brot-popup, .brot-cookie, .brot-notification').forEach(el => {
    if (el._rotTick) clearInterval(el._rotTick);
    if (el._notifTimer) clearTimeout(el._notifTimer);
    el.remove();
  });
  BR.popups = [];
  BR.cookie = null;
  BR.notif = null;
  // Freeze meter for 5s
  BR.freezeTimer = 5;
  if (BR.fillEl && BR.fillEl.parentNode) BR.fillEl.parentNode.classList.add('frozen');
  brot('correct');
  try { if (typeof showToast === 'function') showToast('💊 Detox مفعّل! ٥ ثوان حماية', '#00ff66'); } catch(e){}
};
// Background chaos drawing
function drawBg() {
  const ctx = BR.bgCtx;
  if (!ctx) return;
  const W = BR.bgCanvas.width, H = BR.bgCanvas.height;
  ctx.fillStyle = 'rgba(10,0,20,0.18)';
  ctx.fillRect(0, 0, W, H);
  // Glitch lines based on rot
  const intensity = BR.rot / 100;
  // Scan line shifts
  for (let i = 0; i < 4; i++) {
    if (Math.random() < intensity * 0.4) {
      const y = Math.random() * H;
      const h = 2 + Math.random() * 8;
      ctx.fillStyle = ['rgba(255,0,153,0.18)','rgba(0,240,255,0.18)','rgba(255,230,0,0.14)'][i % 3];
      ctx.fillRect(0, y, W, h);
    }
  }
  // Floating chaos shapes
  const shapeCount = 3 + Math.floor(intensity * 8);
  for (let i = 0; i < shapeCount; i++) {
    const x = (Math.sin(BR.t * 0.6 + i * 1.3) * 0.5 + 0.5) * W;
    const y = (Math.cos(BR.t * 0.4 + i * 1.7) * 0.5 + 0.5) * H;
    const r = 8 + Math.sin(BR.t * 2 + i) * 4;
    ctx.fillStyle = ['rgba(255,0,153,0.18)','rgba(0,240,255,0.16)','rgba(0,255,102,0.12)','rgba(255,230,0,0.14)'][i % 4];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Edge vignette
  const g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(255,0,153,'+(0.15 + intensity*0.25)+')');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Glitch hit particles (BR.t runs in seconds; GameKit expects frame units)
  if (BR._gkParticles) {
    const fdt = Math.min(3, (BR.t - (BR._gkLast == null ? BR.t : BR._gkLast)) * 60) || 1;
    BR._gkLast = BR.t;
    BR._gkParticles.update(fdt);
    BR._gkParticles.draw(ctx, { additive: true });
  }
}
function drawSub() {
  const c = BR.subCanvas;
  if (!c || c.style && c.parentElement && c.parentElement.style.display === 'none') return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  // Track
  ctx.fillStyle = '#1a3050';
  ctx.fillRect(0, 0, W, H);
  // 3 lanes
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * W / 3, 0);
    ctx.lineTo(i * W / 3, H);
    ctx.stroke();
  }
  // Obstacles moving down
  BR.subState.y += 3;
  if (BR.subState.y > 20) {
    BR.subState.y = 0;
    BR.subState.obstacles.push({ x: Math.floor(Math.random() * 3) * (W/3) + 6, y: -20, c: ['#ff0099','#ffe600','#00ff66','#00f0ff'][Math.floor(Math.random()*4)] });
  }
  BR.subState.obstacles = BR.subState.obstacles.filter(o => { o.y += 4; return o.y < H + 20; });
  BR.subState.obstacles.forEach(o => {
    ctx.fillStyle = o.c;
    ctx.fillRect(o.x, o.y, W/3 - 12, 18);
  });
  // Player (fixed bottom)
  ctx.fillStyle = '#ffe600';
  ctx.fillRect(W/2 - 12, H - 28, 24, 22);
  ctx.fillStyle = '#000';
  ctx.fillRect(W/2 - 8, H - 22, 4, 4);
  ctx.fillRect(W/2 + 4, H - 22, 4, 4);
}
function drawSoap() {
  const c = BR.soapCanvas;
  if (!c || c.style && c.parentElement && c.parentElement.style.display === 'none') return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#2a3a50';
  ctx.fillRect(0, 0, W, H);
  // Soap bar
  BR.soapState.x = (BR.soapState.x + 1.2) % (W + 60);
  const sx = -30 + BR.soapState.x;
  ctx.fillStyle = '#ff66cc';
  ctx.fillRect(sx, H/2 - 14, 60, 28);
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx + 6, H/2 - 14, 8, 28);
  // Knife
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(W/2 - 1, 8, 2, H - 28);
  ctx.fillStyle = '#552200';
  ctx.fillRect(W/2 - 5, H - 22, 10, 16);
  // Slices flying off
  if (Math.abs(sx + 30 - W/2) < 4) {
    BR.soapState.slices.push({ x: W/2, y: H/2 - 10, vx: 1.5, vy: -2 - Math.random()*2 });
  }
  BR.soapState.slices = BR.soapState.slices.filter(s => {
    s.x += s.vx; s.y += s.vy; s.vy += 0.18;
    ctx.fillStyle = '#ff66cc';
    ctx.fillRect(s.x, s.y, 8, 6);
    return s.y < H && s.x < W;
  });
}
function generateRoast(r) {
  const lines = [];
  if (r.cookieAccept >= 2) {
    lines.push('🍪 وافقت على <b>' + ar(r.cookieAccept) + '</b> ملفات كوكيز بدون قراءة. مخك مدرّب على الضغط بدون تفكير — تماماً مثل كل تطبيق تستخدمه.');
  } else if (r.cookieAccept >= 1) {
    lines.push('🍪 وافقت على شريط الكوكيز. هذي عادة سيئة تعلّمتها من الإنترنت.');
  }
  if (r.popupCtaFell >= 2) {
    lines.push('👆 ضغطت <b>' + ar(r.popupCtaFell) + '</b> إعلانات مغرية. خوارزميات السوشيل ميديا تعرف ضعفك أكثر منك.');
  } else if (r.popupCtaFell >= 1) {
    lines.push('👆 ضغطت إعلان مغري واحد. كم Pop-up شفت اليوم بدون ما تفكر؟');
  }
  if (r.wrongAnswers >= 3) {
    lines.push('❌ أخطأت في <b>' + ar(r.wrongAnswers) + '</b> أسئلة حسابية بسيطة. ساعات Scroll اللانهائي تركت أثرها على تركيزك.');
  }
  if (r.timedOut >= 2) {
    lines.push('⏰ تجمّدت في <b>' + ar(r.timedOut) + '</b> سؤال بدون إجابة. قدرة تركيزك = ٨ ثوانٍ، أقل من سمكة الذهب. شكراً تيك توك.');
  }
  if (r.captchaWrong >= 1 && r.captchaPerfect === 0) {
    lines.push('🤖 فشلت في تمييز الميمز. عشت كثير داخل Meme Culture حتى ضاعت معاييرك.');
  }
  if (lines.length === 0) {
    if (r.correctAnswers >= 5 && r.cookieReject >= 1) {
      lines.push('💪 لاحظنا مقاومتك للفخاخ. مخك صامد ضد طوفان السوشيل ميديا — حافظ على هذي العادة.');
    } else {
      lines.push('📱 ساعات السوشيل ميديا تركت بصمتها. الإدمان الرقمي يقلّل قدرة التركيز بـ٢٣٪ خلال شهر فقط.');
    }
  }
  lines.push('<br>💡 <b>الحل:</b> ٣٠ دقيقة بدون شاشة كل يوم. خلّي مخك يتنفّس.');
  return lines.map(l => '<p>' + l + '</p>').join('');
}
function onBrotDeath() {
  BR.state = 'dead';
  cancelAnimationFrame(BR.loopRaf);
  clearTimeout(BR.questionTimer);
  brot('death');
  const final = Math.floor(BR.score);
  const isRecord = final > BR.best;
  if (isRecord) BR.best = final;
  try {
    if (typeof updateProfileStat === 'function') {
      updateProfileStat('brainrot', (s) => {
        s.games = (s.games || 0) + 1;
        s.totalSurvived = (s.totalSurvived || 0) + Math.floor(BR.t);
        if (final > (s.bestScore || 0)) s.bestScore = final;
      });
    }
  } catch(e){}
  try { if (typeof renderBadges === 'function') renderBadges(); } catch(e){}
  try { if (typeof brainrotLeaderboardSubmit === 'function') brainrotLeaderboardSubmit(final); } catch(e){}
  let rank = BR.RANKS[0].name;
  for (const r of BR.RANKS) if (final >= r.min) rank = r.name;
  // Populate diagnostic stats
  const r = BR.roast;
  const setN = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = ar(v); };
  setN('bsCookies', r.cookieAccept);
  setN('bsTraps', r.popupCtaFell);
  setN('bsWrong', r.wrongAnswers);
  setN('bsCorrect', r.correctAnswers);
  const roastEl = document.getElementById('bsRoast');
  if (roastEl) roastEl.innerHTML = generateRoast(r);
  document.getElementById('brotOverScore').textContent = ar(final);
  document.getElementById('brotOverBest').textContent = ar(BR.best);
  document.getElementById('brotOverRank').textContent = '🏆 ' + rank;
  document.getElementById('brotOverNewRec').style.display = isRecord ? 'block' : 'none';
  document.getElementById('brotOverOverlay').style.display = 'flex';
  // Clear distractions
  document.querySelectorAll('.brot-popup, .brot-cookie, .brot-captcha').forEach(el => {
    if (el._rotTick) clearInterval(el._rotTick);
    el.remove();
  });
  BR.popups = []; BR.cookie = null; BR.captcha = null;
  if (BR.qBox) BR.qBox.style.display = 'none';
  if (BR.arenaEl) BR.arenaEl.style.transform = '';
}
})();
