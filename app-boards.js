const TRAP_GRID = 12;
const TRAP_BOMBS = 3;
const TRAP_HEARTS = 3;
const TRAP_STREAK_FOR_POWERUP = 2; // safe picks needed for 1 powerup
const TRAP_MAX_POWERUPS = 3;
const TRAP_POWERUP_TYPES = ['scan', 'shield', 'strike'];
const TRAP_POWERUP_META = {
  scan:   { emoji:'🔍', name:'كشّاف', desc:'اكشف خلية عشوائية في لوحتك' },
  shield: { emoji:'🛡️', name:'درع',   desc:'يبطل أول قنبلة تصيبك' },
  strike: { emoji:'💥', name:'ضربة',  desc:'يجبر خصمك على كشف خلية عشوائية' }
};

let trap = {
  code:null, role:null, opponentRole:null,
  name:null, oppName:'الخصم', avatar:'💣',
  myPlants:[], confirmed:false,
  listeners:[],
  bot:false, localState:null, localPlayers:null, localBombs:null,
  powerupsEnabled:false,
  // Power-ups
  localPowerups:null, // { p0:{scan,shield,strike}, p1:{...} }
  localShield:null,   // { p0:bool, p1:bool }
  localStreak:null,   // { p0:int, p1:int }
  localScanned:null   // { p0:{idx:'safe'|'bomb'}, p1:{...} } — what each player has scanned on their own board
};
function trapPlayBoomEffect() {
  document.body.classList.add('trap-shake');
  setTimeout(() => document.body.classList.remove('trap-shake'), 500);
  const overlay = document.createElement('div');
  overlay.className = 'trap-boom-overlay';
  const flash = document.createElement('div'); flash.className = 'trap-boom-flash';
  const bomb = document.createElement('div'); bomb.className = 'trap-boom-bomb'; bomb.textContent = '💣';
  overlay.appendChild(flash); overlay.appendChild(bomb);
  document.body.appendChild(overlay);
  setTimeout(() => {
    bomb.className = 'trap-boom-explode'; bomb.textContent = '💥';
  }, 450);
  setTimeout(() => { try { overlay.remove(); } catch(e){} }, 1100);
}
function trapPlayHeartLossEffect(heartsElId) {
  const row = document.getElementById(heartsElId); if (!row) return;
  const liveHearts = [...row.querySelectorAll('span:not(.heart-lost)')];
  const losingHeart = liveHearts[liveHearts.length - 1];
  if (losingHeart) {
    losingHeart.classList.add('heart-just-lost');
    setTimeout(() => losingHeart.classList.remove('heart-just-lost'), 800);
  }
  const rect = row.getBoundingClientRect();
  const float = document.createElement('div'); float.className = 'trap-heart-float';
  float.innerHTML = '−1 ❤️';
  float.style.left = (rect.left + rect.width/2 - 30) + 'px';
  float.style.top = (rect.top - 8) + 'px';
  document.body.appendChild(float);
  setTimeout(() => { try { float.remove(); } catch(e){} }, 1300);
}

function trapShowStage(stage) {
  ['trapLobby','trapPlant','trapBattle','trapEnd'].forEach(id => {
    document.getElementById(id).style.display = (id===stage) ? 'block' : 'none';
  });
}

function trapOpenScreen() {
  ['landingScreen','setupScreen','gameScreen','onlineScreen','adminScreen'].forEach(id=>{
    const e = document.getElementById(id); if (e) e.style.display='none';
  });
  document.getElementById('trapScreen').style.display = 'block';
}

function copyTrapCode() {
  const code = trap.code || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  showToast('📋 تم نسخ الرمز: '+code, 'var(--gold)');
}

async function createTrapRoom() {
  const botEl = document.getElementById('trapBotMode');
  if (botEl && botEl.checked) { return startTrapBotGame(); }
  if (!ensureFirebase()) return;
  const name = (document.getElementById('trapHostName').value.trim()) || 'المضيف';
  const code = genCode();
  const puEl = document.getElementById('trapPowerupsMode');
  trap.powerupsEnabled = !!(puEl && puEl.checked);
  trap.code = code; trap.role = 'p0'; trap.opponentRole = 'p1';
  trap.name = name; trap.myPlants = []; trap.confirmed = false;
  trap.bot = false;
  try {
    await fb.db.ref('rooms/t'+code).set({
      meta:{ hostName:name, status:'lobby', createdAt: firebase.database.ServerValue.TIMESTAMP, powerupsEnabled: trap.powerupsEnabled },
      players:{ p0:{ name, hearts: TRAP_HEARTS, confirmed:false, joined:true } },
      state:{ phase:'lobby' }
    });
  } catch(e) {
    showToast('⚠️ تعذّر إنشاء الغرفة: ' + (e && e.message ? e.message : 'خطأ غير معروف'), 'var(--wrong)');
    trap.code = null; trap.role = null;
    return;
  }
  trapAttachListeners();
  trapOpenScreen();
  trapShowStage('trapLobby');
  document.getElementById('trapCodeDisplay').textContent = code;
  document.getElementById('trapLobbyHost').style.display = 'block';
}

async function joinTrapRoom() {
  if (!ensureFirebase()) return;
  const name = (document.getElementById('trapJoinName').value.trim()) || 'الخصم';
  const code = (document.getElementById('trapJoinCode').value.trim());
  if (!/^\d{6}$/.test(code)) { showToast('⚠️ رمز الغرفة يتكون من ٦ أرقام بالضبط.', 'var(--wrong)'); return; }
  let data;
  try {
    const snap = await fb.db.ref('rooms/t'+code).once('value');
    data = snap.val();
  } catch(e) {
    showToast('⚠️ تعذّر الوصول للغرفة: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
    return;
  }
  if (!data) { showToast('⚠️ الغرفة غير موجودة. تأكد من الرمز أو اطلب من المضيف رمزاً جديداً.', 'var(--wrong)'); return; }
  if (data.players && data.players.p1 && data.players.p1.joined) { showToast('⚠️ الغرفة ممتلئة. انتظر الجولة التالية أو اطلب غرفة جديدة.', 'var(--wrong)'); return; }
  trap.powerupsEnabled = !!(data.meta && data.meta.powerupsEnabled);
  trap.code = code; trap.role = 'p1'; trap.opponentRole = 'p0';
  trap.name = name; trap.myPlants = []; trap.confirmed = false;
  try {
    await fb.db.ref('rooms/t'+code+'/players/p1').set({ name, hearts: TRAP_HEARTS, confirmed:false, joined:true });
  } catch(e) {
    showToast('⚠️ تعذّر الانضمام: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
    trap.code = null; trap.role = null;
    return;
  }
  trapAttachListeners();
  trapOpenScreen();
  trapShowStage('trapLobby');
  document.getElementById('trapCodeDisplay').textContent = code;
  document.getElementById('trapLobbyHost').style.display = 'none';
}

function trapAttachListeners() {
  trapDetachListeners();
  if (trap.role !== 'spec') startRoomHeartbeat('t', trap.code);
  const playersRef = fb.db.ref('rooms/t'+trap.code+'/players');
  const stateRef = fb.db.ref('rooms/t'+trap.code+'/state');
  const onPlayers = playersRef.on('value', s => trapRenderPlayers(s.val()||{}));
  const onState = stateRef.on('value', s => trapOnState(s.val()||{}));
  trap.listeners = [
    () => playersRef.off('value', onPlayers),
    () => stateRef.off('value', onState)
  ];
}

function trapDetachListeners() {
  trap.listeners.forEach(off=>{ try{off();}catch(e){} });
  trap.listeners = [];
}

function trapRenderPlayers(players) {
  checkOpponentLeft(trap, players);
  const p0 = players.p0 || {};
  const p1 = players.p1 || {};
  // Cache powerup/shield/streak data for the powerup bar render
  trap._cachedPowerups = { p0: p0.powerups || { scan:0, shield:0, strike:0 }, p1: p1.powerups || { scan:0, shield:0, strike:0 } };
  trap._cachedShield = { p0: !!p0.shield, p1: !!p1.shield };
  trap._cachedStreak = { p0: p0.streak||0, p1: p1.streak||0 };
  document.getElementById('trapP0Name').textContent = p0.name || 'بانتظار...';
  document.getElementById('trapP1Name').textContent = p1.name || 'بانتظار...';
  document.getElementById('trapP0Avatar').textContent = p0.joined ? '🛡️' : '⏳';
  document.getElementById('trapP1Avatar').textContent = p1.joined ? '⚔️' : '⏳';
  trap.oppName = (trap.role==='p0' ? p1.name : p0.name) || 'الخصم';
  trapRenderHearts(p0, p1);
  if (trap.powerupsEnabled) trapRenderPowerupBar();
  if (trap.role==='p0') {
    const ready = p0.joined && p1.joined;
    document.getElementById('trapLobbyHost').style.display = ready ? 'block' : 'none';
    document.getElementById('trapLobbyWait').style.display = ready ? 'none' : 'block';
    document.getElementById('trapLobbyWait').textContent = ready ? '' : 'في انتظار الخصم…';
  } else {
    document.getElementById('trapLobbyWait').style.display = 'block';
    document.getElementById('trapLobbyWait').textContent = 'في انتظار المضيف ليبدأ اللعبة…';
  }
}

function trapRenderHearts(p0, p1) {
  const mine = (trap.role==='p0') ? p0 : p1;
  const opp  = (trap.role==='p0') ? p1 : p0;
  const html = (n) => {
    let s = '';
    for (let i=0;i<TRAP_HEARTS;i++) s += '<span class="' + (i<(n||0) ? '' : 'heart-lost') + '">❤️</span>';
    return s;
  };
  const myHel = document.getElementById('trapMyHearts');
  const opHel = document.getElementById('trapOppHearts');
  if (myHel) myHel.innerHTML = html(mine.hearts);
  if (opHel) opHel.innerHTML = html(opp.hearts);
  const myNel = document.getElementById('trapMyName'); if (myNel) myNel.textContent = mine.name || 'أنت';
  const opNel = document.getElementById('trapOppName'); if (opNel) opNel.textContent = opp.name || 'الخصم';
}

async function trapStart() {
  if (trap.role !== 'p0') return;
  await fb.db.ref('rooms/t'+trap.code+'/state').update({ phase:'plant' });
  await fb.db.ref('rooms/t'+trap.code+'/meta/status').set('planting');
}

function trapOnState(state) {
  const phase = state.phase;
  if (phase === 'lobby') trapShowStage('trapLobby');
  else if (phase === 'plant') trapEnterPlant();
  else if (phase === 'battle') trapEnterBattle(state);
  else if (phase === 'end') trapEnterEnd(state);
}

function trapEnterPlant() {
  trapShowStage('trapPlant');
  trap.myPlants = []; trap.confirmed = false;
  trap._lastOppRevealed = null;
  document.getElementById('trapPlantOppName').textContent = 'لوحة ' + (trap.oppName || 'الخصم');
  document.getElementById('trapPlantConfirm').style.display = 'none';
  document.getElementById('trapPlantWait').style.display = 'none';
  trapUpdatePlantCount();
  const board = document.getElementById('trapPlantBoard'); board.innerHTML = '';
  for (let i=0; i<TRAP_GRID; i++) {
    const c = document.createElement('div'); c.className = 'trap-cell'; c.dataset.idx = i;
    c.onclick = () => trapTogglePlant(i, c);
    board.appendChild(c);
  }
}

function trapTogglePlant(i, el) {
  if (trap.confirmed) return;
  const had = trap.myPlants.includes(i);
  if (had) { trap.myPlants = trap.myPlants.filter(x => x!==i); el.classList.remove('planted'); }
  else {
    if (trap.myPlants.length >= TRAP_BOMBS) { showToast('💣 وصلت الحد الأقصى (٣ قنابل)', 'var(--wrong)'); return; }
    trap.myPlants.push(i); el.classList.add('planted', 'just-planted');
    try { soundTrapPlant(); } catch(e){}
    setTimeout(()=>el.classList.remove('just-planted'), 500);
  }
  trapUpdatePlantCount();
}

function trapUpdatePlantCount() {
  const arDigits = ['٠','١','٢','٣'];
  document.getElementById('trapPlantCount').textContent = arDigits[trap.myPlants.length] + ' / ' + arDigits[TRAP_BOMBS];
  document.getElementById('trapPlantConfirm').style.display = (trap.myPlants.length===TRAP_BOMBS && !trap.confirmed) ? 'block' : 'none';
}

async function trapConfirmPlants() {
  if (trap.myPlants.length !== TRAP_BOMBS) return;
  trap.confirmed = true;
  try { soundTrapConfirm(); } catch(e){}
  if (trap.bot) { return trapBotConfirmPlants(); }
  await fb.db.ref('rooms/t'+trap.code+'/bombs/'+trap.opponentRole).set(trap.myPlants);
  await fb.db.ref('rooms/t'+trap.code+'/players/'+trap.role+'/confirmed').set(true);
  document.getElementById('trapPlantConfirm').style.display = 'none';
  document.getElementById('trapPlantWait').style.display = 'block';
  document.querySelectorAll('#trapPlantBoard .trap-cell').forEach(c => c.classList.add('disabled'));
  if (trap.role === 'p0') {
    const psnap = await fb.db.ref('rooms/t'+trap.code+'/players').once('value');
    const ps = psnap.val() || {};
    if (ps.p0 && ps.p0.confirmed && ps.p1 && ps.p1.confirmed) {
      const startTurn = Math.random() < 0.5 ? 'p0' : 'p1';
      await fb.db.ref('rooms/t'+trap.code+'/state').set({ phase:'battle', turn:startTurn, revealed_p0:{}, revealed_p1:{} });
      await fb.db.ref('rooms/t'+trap.code+'/meta/status').set('active');
    }
  } else {
    setTimeout(async () => {
      const ssnap = await fb.db.ref('rooms/t'+trap.code+'/state').once('value');
      const st = ssnap.val() || {};
      if (st.phase === 'plant') {
        const psnap = await fb.db.ref('rooms/t'+trap.code+'/players').once('value');
        const ps = psnap.val() || {};
        if (ps.p0 && ps.p0.confirmed && ps.p1 && ps.p1.confirmed) {
          const startTurn = Math.random() < 0.5 ? 'p0' : 'p1';
          await fb.db.ref('rooms/t'+trap.code+'/state').set({ phase:'battle', turn:startTurn, revealed_p0:{}, revealed_p1:{} });
        }
      }
    }, 600);
  }
}

async function trapEnterBattle(state) {
  trapShowStage('trapBattle');
  // Cache scanned info from state for board render
  trap._cachedScanned = { p0: state.scanned_p0 || {}, p1: state.scanned_p1 || {} };
  // Show/hide power-up bar based on whether power-ups are enabled this match
  const bar = document.getElementById('trapPowerupBar');
  if (bar) bar.style.display = trap.powerupsEnabled ? 'flex' : 'none';
  if (trap.powerupsEnabled) trapRenderPowerupBar();
  let bombs;
  if (trap.bot) {
    bombs = trap.localBombs || {};
  } else {
    const bsnap = await fb.db.ref('rooms/t'+trap.code+'/bombs').once('value');
    bombs = bsnap.val() || {};
  }
  trap._myBombsInMyBoard = bombs[trap.role] || [];                 // what opponent planted in MY board
  trap._myBombsInOppBoard = bombs[trap.opponentRole] || [];        // what I planted in OPPONENT's board
  if (!trap.bot) {
    const oppRevKey = 'revealed_' + trap.opponentRole;
    const cur = state[oppRevKey] || {};
    const prev = trap._lastOppRevealed || {};
    let newReveal = null;
    for (const k of Object.keys(cur)) {
      if (prev[k] == null) { newReveal = { idx:k, val:cur[k] }; break; }
    }
    if (newReveal) {
      if (newReveal.val === 'bomb') {
        try { soundTrapBoom(); } catch(e){}
        trapPlayBoomEffect();
        setTimeout(()=>{ try { soundTrapHeartLost(); } catch(e){} trapPlayHeartLossEffect('trapOppHearts'); }, 350);
      } else {
        try { soundTrapTick(); } catch(e){}
      }
    }
    trap._lastOppRevealed = { ...cur };
  }
  trapRenderBoard('trapMyBoard', state, /*isMine=*/true);
  trapRenderBoard('trapOppBoard', state, /*isMine=*/false);
  const banner = document.getElementById('trapTurnBanner');
  const myTurn = (state.turn === trap.role);
  banner.className = 'trap-turn-banner ' + (myTurn ? 'my-turn' : 'opp-turn');
  banner.textContent = myTurn ? '🎯 دورك! اختر مربعاً من لوحتك' : '⏳ دور ' + (trap.oppName || 'الخصم');
  if (trap.bot) {
    trapRenderHearts(trap.localPlayers.p0, trap.localPlayers.p1);
  } else {
    const psnap = await fb.db.ref('rooms/t'+trap.code+'/players').once('value');
    trapRenderHearts((psnap.val()||{}).p0||{}, (psnap.val()||{}).p1||{});
  }
}

function trapRenderBoard(boardId, state, isMine) {
  const el = document.getElementById(boardId); if (!el) return;
  el.innerHTML = '';
  const revealedMy = state.revealed_p0 || {}, revealedOp = state.revealed_p1 || {};
  let revealed;
  if (isMine) revealed = (trap.role==='p0') ? revealedMy : revealedOp;
  else        revealed = (trap.role==='p0') ? revealedOp : revealedMy;
  const myTurn = (state.turn === trap.role);
  for (let i=0; i<TRAP_GRID; i++) {
    const c = document.createElement('div'); c.className = 'trap-cell'; c.dataset.idx = i;
    const r = revealed[i];
    if (r === 'safe') c.classList.add('revealed-safe');
    else if (r === 'bomb') c.classList.add('revealed-bomb');
    else {
      if (!isMine && trap._myBombsInOppBoard && trap._myBombsInOppBoard.includes(i)) {
        c.classList.add('planted');
      }
      if (isMine && myTurn) c.onclick = () => trapPickCell(i);
      else c.classList.add('disabled');
    }
    el.appendChild(c);
  }
}

async function trapPickCell(i) {
  if (trap.bot) { return trapBotPlayerPick(i); }
  const code = trap.code; if (!code) return;
  const ssnap = await fb.db.ref('rooms/t'+code+'/state').once('value');
  const st = ssnap.val() || {};
  if (st.turn !== trap.role || st.phase !== 'battle') return;
  const myRevealedKey = 'revealed_' + trap.role;
  const myRevealed = st[myRevealedKey] || {};
  if (myRevealed[i] != null) return;
  const isBomb = (trap._myBombsInMyBoard || []).includes(i);
  // Shield check (only when powerups are enabled)
  let shielded = false;
  if (isBomb && trap.powerupsEnabled) {
    const psnap = await fb.db.ref('rooms/t'+code+'/players/'+trap.role).once('value');
    const me = psnap.val() || {};
    if (me.shield) shielded = true;
  }
  if (isBomb && !shielded) {
    try { soundTrapBoom(); } catch(e){}
    trapPlayBoomEffect();
    setTimeout(()=>{ try { soundTrapHeartLost(); } catch(e){} trapPlayHeartLossEffect('trapMyHearts'); }, 350);
  } else if (isBomb && shielded) {
    try { soundTrapConfirm(); } catch(e){}
    showToast('🛡️ صدّت قنبلة!', '#66bbff');
  } else {
    try { soundTrapSafe(); } catch(e){}
  }
  const updates = {};
  updates['state/' + myRevealedKey + '/' + i] = isBomb ? 'bomb' : 'safe';
  let newHearts = null;
  if (isBomb && !shielded) {
    const psnap = await fb.db.ref('rooms/t'+code+'/players/'+trap.role).once('value');
    const me = psnap.val() || {};
    newHearts = Math.max(0, (me.hearts||0) - 1);
    updates['players/' + trap.role + '/hearts'] = newHearts;
  }
  if (shielded) updates['players/' + trap.role + '/shield'] = false;
  if (trap.powerupsEnabled && isBomb && !shielded) updates['players/' + trap.role + '/streak'] = 0;
  const nextTurn = (trap.role === 'p0') ? 'p1' : 'p0';
  updates['state/turn'] = nextTurn;
  await fb.db.ref('rooms/t'+code).update(updates);
  if (trap.powerupsEnabled && !isBomb) trapResolveStreak(trap.role, false);
  if (isBomb && !shielded && newHearts === 0) {
    await fb.db.ref('rooms/t'+code+'/state').update({ phase:'end', winner: trap.opponentRole });
  }
}

async function trapEnterEnd(state) {
  trapShowStage('trapEnd');
  const won = (state.winner === trap.role);
  document.getElementById('trapEndEmoji').textContent = won ? '🏆' : '💥';
  document.getElementById('trapEndText').textContent = won
    ? (trap.bot ? '🎉 فزت على الكمبيوتر!' : '🎉 فزت! تجنبت القنابل بمهارة')
    : (trap.bot ? '🤖 فاز الكمبيوتر هذه المرة!' : '😵 خسرت! وقعت في الفخاخ');
  try { if (won) soundTrapWin(); else soundTrapLose(); } catch(e){}
  if (won) { try { if (typeof launchConfetti==='function') launchConfetti(); } catch(e){} }
  try { recordGameResult('trap', won ? { won:true } : { lost:true }); } catch(e){}
  const btn = document.getElementById('trapRematchBtn');
  const wait = document.getElementById('trapRematchWait');
  if (btn && wait) {
    const canTrigger = trap.bot || trap.role === 'p0';
    btn.style.display = canTrigger ? 'inline-block' : 'none';
    wait.style.display = canTrigger ? 'none' : 'inline-block';
  }
}

async function trapRematch() {
  if (trap.bot) {
    trap.myPlants = []; trap.confirmed = false;
    trap.localPlayers.p0.hearts = TRAP_HEARTS; trap.localPlayers.p0.confirmed = false;
    trap.localPlayers.p1.hearts = TRAP_HEARTS; trap.localPlayers.p1.confirmed = false;
    trap.localState = { phase:'plant' };
    trap.localBombs = {};
    trap.localPowerups = { p0:{scan:0,shield:0,strike:0}, p1:{scan:0,shield:0,strike:0} };
    trap.localShield = { p0:false, p1:false };
    trap.localStreak = { p0:0, p1:0 };
    trap.localScanned = { p0:{}, p1:{} };
    trapEnterPlant();
    document.getElementById('trapPlantOppName').textContent = '🤖 لوحة الكمبيوتر';
    return;
  }
  if (trap.role !== 'p0') return;
  const psnap = await fb.db.ref('rooms/t'+trap.code+'/players').once('value');
  const players = psnap.val() || {};
  const updates = {};
  Object.keys(players).forEach(pid => {
    updates['players/'+pid+'/hearts'] = TRAP_HEARTS;
    updates['players/'+pid+'/confirmed'] = false;
  });
  updates['bombs'] = null;
  updates['state'] = { phase:'plant' };
  updates['meta/status'] = 'planting';
  trap.myPlants = []; trap.confirmed = false;
  await fb.db.ref('rooms/t'+trap.code).update(updates);
  showToast('🔄 جولة جديدة! ازرع قنابلك من جديد', 'var(--gold)');
}

// === Trap Power-ups ===
async function trapGetSnap(){
  if (trap.bot) {
    return { players: trap.localPlayers, state: trap.localState, bombs: trap.localBombs, powerups: trap.localPowerups, shield: trap.localShield, scanned: trap.localScanned };
  }
  const snap = await fb.db.ref('rooms/t'+trap.code).once('value');
  return snap.val() || {};
}
function trapTotalPowerups(role){
  const pu = trap.bot
    ? trap.localPowerups[role]
    : (trap._cachedPowerups && trap._cachedPowerups[role]) || { scan:0, shield:0, strike:0 };
  return (pu.scan||0) + (pu.shield||0) + (pu.strike||0);
}
async function trapGrantPowerup(role) {
  // Pick a random type, respecting max cap
  const total = trap.bot ? trapTotalPowerups(role)
    : ((trap._cachedPowerups && trap._cachedPowerups[role]) ? trapTotalPowerups(role) : 0);
  if (total >= TRAP_MAX_POWERUPS) return null;
  const type = TRAP_POWERUP_TYPES[Math.floor(Math.random() * TRAP_POWERUP_TYPES.length)];
  if (trap.bot) {
    trap.localPowerups[role][type] = (trap.localPowerups[role][type]||0) + 1;
  } else {
    await fb.db.ref('rooms/t'+trap.code+'/players/'+role+'/powerups/'+type)
      .transaction(c => (c||0) + 1);
  }
  if (role === trap.role) {
    const meta = TRAP_POWERUP_META[type];
    showToast('✨ ربحت قدرة: ' + meta.emoji + ' ' + meta.name, 'var(--gold)');
    try { soundTrapSafe(); } catch(e){}
  }
  return type;
}
function trapRenderPowerupBar(){
  // Only for current player ('me') — read local + Firebase cache
  const pu = trap.bot ? trap.localPowerups[trap.role]
    : (trap._cachedPowerups && trap._cachedPowerups[trap.role]) || { scan:0, shield:0, strike:0 };
  const shield = trap.bot ? trap.localShield[trap.role]
    : (trap._cachedShield && trap._cachedShield[trap.role]) || false;
  const streak = trap.bot ? (trap.localStreak[trap.role] || 0)
    : ((trap._cachedStreak && trap._cachedStreak[trap.role]) || 0);
  ['scan','shield','strike'].forEach(t => {
    const btn = document.querySelector('.trap-pup-btn[data-pup="' + t + '"]');
    if (!btn) return;
    const n = pu[t] || 0;
    btn.classList.toggle('has', n > 0);
    const count = btn.querySelector('.trap-pup-count');
    if (count) count.textContent = n;
  });
  // Mark shield as active visually
  const shieldBtn = document.querySelector('.trap-pup-btn[data-pup="shield"]');
  if (shieldBtn) shieldBtn.classList.toggle('active', !!shield);
  // Streak pill
  const pill = document.getElementById('trapStreakPill');
  const num = document.getElementById('trapStreakNum');
  if (pill && num) {
    if (streak > 0) {
      pill.style.display = 'inline-block';
      pill.classList.toggle('hot', streak >= TRAP_STREAK_FOR_POWERUP - 1);
      const arDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
      num.textContent = String(streak).split('').map(d=>arDigits[+d]||d).join('');
    } else {
      pill.style.display = 'none';
    }
  }
}
async function trapApplyShield(role) {
  if (trap.bot) {
    trap.localShield[role] = true;
  } else {
    await fb.db.ref('rooms/t'+trap.code+'/players/'+role+'/shield').set(true);
  }
}
async function trapConsumeShield(role) {
  if (trap.bot) {
    trap.localShield[role] = false;
  } else {
    await fb.db.ref('rooms/t'+trap.code+'/players/'+role+'/shield').set(false);
  }
}
async function trapHasShield(role) {
  if (trap.bot) return !!trap.localShield[role];
  return !!(trap._cachedShield && trap._cachedShield[role]);
}
async function trapDeductPowerup(role, type) {
  if (trap.bot) {
    trap.localPowerups[role][type] = Math.max(0, (trap.localPowerups[role][type]||0) - 1);
  } else {
    await fb.db.ref('rooms/t'+trap.code+'/players/'+role+'/powerups/'+type)
      .transaction(c => Math.max(0, (c||0) - 1));
  }
}
window.useTrapPowerup = async function(type) {
  if (!trap.powerupsEnabled) return;
  const role = trap.role;
  if (!role) return;
  // Are we in battle?
  const inBattle = trap.bot ? (trap.localState && trap.localState.phase === 'battle')
    : (document.getElementById('trapBattle').style.display !== 'none');
  if (!inBattle) return;
  // Have at least one of this type?
  const pu = trap.bot ? trap.localPowerups[role]
    : (trap._cachedPowerups && trap._cachedPowerups[role]) || {};
  if ((pu[type]||0) <= 0) return;
  if (type === 'scan')   return useTrapScan(role);
  if (type === 'shield') return useTrapShield(role);
  if (type === 'strike') return useTrapStrike(role);
};
async function useTrapScan(role) {
  const snap = await trapGetSnap();
  const state = trap.bot ? snap.state : (snap.state || {});
  const myRevKey = 'revealed_' + role;
  const myRevealed = (trap.bot ? state[myRevKey] : state[myRevKey]) || {};
  const scanned = trap.bot ? trap.localScanned[role] : ((trap._cachedScanned && trap._cachedScanned[role]) || {});
  // Pick a random unrevealed + unscanned cell on MY board
  const candidates = [];
  for (let i = 0; i < TRAP_GRID; i++) {
    if (myRevealed[i] != null) continue;
    if (scanned[i] != null) continue;
    candidates.push(i);
  }
  if (candidates.length === 0) {
    showToast('🔍 لا توجد خلايا للكشف عنها', 'var(--wrong)');
    return;
  }
  const pickIdx = candidates[Math.floor(Math.random() * candidates.length)];
  const isBomb = (trap._myBombsInMyBoard || []).includes(pickIdx);
  const result = isBomb ? 'bomb' : 'safe';
  await trapDeductPowerup(role, 'scan');
  if (trap.bot) {
    trap.localScanned[role][pickIdx] = result;
    trapRenderBoard('trapMyBoard', trap.localState, true);
    trapRenderPowerupBar();
  } else {
    await fb.db.ref('rooms/t'+trap.code+'/state/scanned_'+role+'/'+pickIdx).set(result);
  }
  try { soundTrapSafe(); } catch(e){}
  showToast('🔍 ' + (isBomb ? 'تحذير! قنبلة في خلية مكشوفة' : 'آمنة! خلية يمكنك اختيارها بأمان'), isBomb ? 'var(--wrong)' : 'var(--correct)');
}
async function useTrapShield(role) {
  // Shield is passive — activate only when no shield is active
  const has = await trapHasShield(role);
  if (has) { showToast('🛡️ الدرع مفعّل بالفعل', 'var(--gold)'); return; }
  await trapDeductPowerup(role, 'shield');
  await trapApplyShield(role);
  if (trap.bot) trapRenderPowerupBar();
  try { soundTrapConfirm(); } catch(e){}
  showToast('🛡️ الدرع مفعّل — أول قنبلة لن تخصم قلباً', 'var(--gold)');
}
async function useTrapStrike(role) {
  const oppRole = trap.opponentRole;
  const snap = await trapGetSnap();
  const state = trap.bot ? snap.state : (snap.state || {});
  const oppRevKey = 'revealed_' + oppRole;
  const oppRevealed = (trap.bot ? state[oppRevKey] : state[oppRevKey]) || {};
  // Pick random unrevealed cell on opp board
  const candidates = [];
  for (let i = 0; i < TRAP_GRID; i++) if (oppRevealed[i] == null) candidates.push(i);
  if (candidates.length === 0) {
    showToast('💥 لوحة الخصم مكشوفة بالكامل', 'var(--wrong)');
    return;
  }
  const pickIdx = candidates[Math.floor(Math.random() * candidates.length)];
  const isBomb = (trap._myBombsInOppBoard || []).includes(pickIdx);
  await trapDeductPowerup(role, 'strike');
  if (trap.bot) {
    if (!trap.localState[oppRevKey]) trap.localState[oppRevKey] = {};
    trap.localState[oppRevKey][pickIdx] = isBomb ? 'bomb' : 'safe';
    if (isBomb) {
      // Opp shielded?
      if (trap.localShield[oppRole]) {
        trap.localShield[oppRole] = false;
        showToast('💥 ضربة! لكن خصمك صدّها بالدرع', 'var(--gold)');
        try { soundTrapSafe(); } catch(e){}
      } else {
        trap.localPlayers[oppRole].hearts = Math.max(0, trap.localPlayers[oppRole].hearts - 1);
        showToast('💥 ضربة! خصمك خسر قلباً', 'var(--correct)');
        try { soundTrapBoom(); } catch(e){}
        trapPlayBoomEffect();
        setTimeout(()=>trapPlayHeartLossEffect('trapOppHearts'), 350);
      }
    } else {
      showToast('💥 ضربة آمنة — لم تصب قنبلة', 'var(--muted)');
      try { soundTrapTick(); } catch(e){}
    }
    trapEnterBattle(trap.localState);
    if (trap.localPlayers[oppRole].hearts === 0) {
      trap.localState.phase = 'end'; trap.localState.winner = role;
      setTimeout(()=>trapEnterEnd(trap.localState), 900);
    }
  } else {
    const updates = {};
    updates['state/' + oppRevKey + '/' + pickIdx] = isBomb ? 'bomb' : 'safe';
    if (isBomb) {
      const psnap = await fb.db.ref('rooms/t'+trap.code+'/players/'+oppRole).once('value');
      const opp = psnap.val() || {};
      if (opp.shield) {
        updates['players/' + oppRole + '/shield'] = false;
        showToast('💥 ضربة! لكن خصمك صدّها بالدرع', 'var(--gold)');
      } else {
        updates['players/' + oppRole + '/hearts'] = Math.max(0, (opp.hearts||0) - 1);
        showToast('💥 ضربة! خصمك خسر قلباً', 'var(--correct)');
        try { soundTrapBoom(); } catch(e){}
        trapPlayBoomEffect();
        setTimeout(()=>trapPlayHeartLossEffect('trapOppHearts'), 350);
        if (((opp.hearts||0) - 1) === 0) {
          updates['state/phase'] = 'end';
          updates['state/winner'] = role;
        }
      }
    } else {
      showToast('💥 ضربة آمنة', 'var(--muted)');
      try { soundTrapTick(); } catch(e){}
    }
    await fb.db.ref('rooms/t'+trap.code).update(updates);
  }
}
function trapResolveStreak(role, wasBomb) {
  // Update streak counter; grant a powerup at threshold
  if (trap.bot) {
    if (wasBomb) {
      trap.localStreak[role] = 0;
    } else {
      trap.localStreak[role]++;
      if (trap.localStreak[role] >= TRAP_STREAK_FOR_POWERUP) {
        trap.localStreak[role] = 0;
        trapGrantPowerup(role);
      }
    }
    trapRenderPowerupBar();
  } else {
    // Online: streak handled by writer
    const ref = fb.db.ref('rooms/t'+trap.code+'/players/'+role+'/streak');
    if (wasBomb) {
      ref.set(0);
    } else {
      ref.transaction(c => (c||0) + 1).then(res => {
        const v = (res.snapshot && res.snapshot.val()) || 0;
        if (v >= TRAP_STREAK_FOR_POWERUP) {
          ref.set(0);
          trapGrantPowerup(role);
        }
      }).catch(()=>{});
    }
  }
}

function leaveTrap() {
  stopRoomHeartbeat();
  trapDetachListeners();
  if (!trap.bot) {
    try {
      if (trap.code && trap.role === 'p0') fb.db.ref('rooms/t'+trap.code).remove();
      else if (trap.code && trap.role === 'p1') fb.db.ref('rooms/t'+trap.code+'/players/p1').remove();
    } catch(e){}
  }
  trap.code = null; trap.role = null; trap.opponentRole = null;
  trap.myPlants = []; trap.confirmed = false;
  trap.bot = false; trap.localState = null; trap.localPlayers = null; trap.localBombs = null;
  document.getElementById('trapScreen').style.display = 'none';
  goToLanding();
}
function startTrapBotGame() {
  const name = (document.getElementById('trapHostName').value.trim()) || 'أنت';
  const puEl = document.getElementById('trapPowerupsMode');
  trap.powerupsEnabled = !!(puEl && puEl.checked);
  trap.bot = true;
  trap.code = null;
  trap.role = 'p0'; trap.opponentRole = 'p1';
  trap.name = name; trap.oppName = '🤖 الكمبيوتر';
  trap.myPlants = []; trap.confirmed = false;
  trap.localPlayers = {
    p0: { name, hearts: TRAP_HEARTS, confirmed:false, joined:true },
    p1: { name: '🤖 الكمبيوتر', hearts: TRAP_HEARTS, confirmed:false, joined:true }
  };
  trap.localState = { phase:'plant' };
  trap.localBombs = {};
  trap.localPowerups = { p0:{scan:0,shield:0,strike:0}, p1:{scan:0,shield:0,strike:0} };
  trap.localShield = { p0:false, p1:false };
  trap.localStreak = { p0:0, p1:0 };
  trap.localScanned = { p0:{}, p1:{} };
  trapOpenScreen();
  trapEnterPlant();
  document.getElementById('trapPlantOppName').textContent = '🤖 لوحة الكمبيوتر';
}

function trapBotConfirmPlants() {
  trap.localBombs.p1 = [...trap.myPlants];
  const cells = Array.from({length: TRAP_GRID}, (_,i) => i);
  for (let i = cells.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [cells[i],cells[j]] = [cells[j],cells[i]]; }
  trap.localBombs.p0 = cells.slice(0, TRAP_BOMBS);
  trap.localPlayers.p0.confirmed = true;
  trap.localPlayers.p1.confirmed = true;
  document.querySelectorAll('#trapPlantBoard .trap-cell').forEach(c => c.classList.add('disabled'));
  document.getElementById('trapPlantConfirm').style.display = 'none';
  const waitEl = document.getElementById('trapPlantWait');
  waitEl.style.display = 'block';
  waitEl.textContent = '🤖 الكمبيوتر يزرع قنابله…';
  setTimeout(() => {
    trap.localState = { phase:'battle', turn: Math.random()<0.5?'p0':'p1', revealed_p0:{}, revealed_p1:{} };
    trapEnterBattle(trap.localState);
    if (trap.localState.turn === 'p1') setTimeout(()=>trapBotTakeTurn(), 1200);
  }, 1300);
}

function trapBotPlayerPick(i) {
  const st = trap.localState; if (!st || st.phase !== 'battle') return;
  if (st.turn !== 'p0') return;
  const myRev = st.revealed_p0;
  if (myRev[i] != null) return;
  const isBomb = (trap._myBombsInMyBoard || []).includes(i);
  const shielded = isBomb && trap.powerupsEnabled && trap.localShield && trap.localShield.p0;
  myRev[i] = isBomb ? 'bomb' : 'safe';
  if (isBomb && !shielded) {
    try { soundTrapBoom(); } catch(e){}
    trapPlayBoomEffect();
    setTimeout(()=>{ try { soundTrapHeartLost(); } catch(e){} trapPlayHeartLossEffect('trapMyHearts'); }, 350);
    trap.localPlayers.p0.hearts = Math.max(0, trap.localPlayers.p0.hearts - 1);
    if (trap.powerupsEnabled) trapResolveStreak('p0', true);
    if (trap.localPlayers.p0.hearts === 0) {
      st.phase = 'end'; st.winner = 'p1';
      setTimeout(()=>trapEnterEnd(st), 900);
      return;
    }
  } else if (isBomb && shielded) {
    trap.localShield.p0 = false;
    try { soundTrapConfirm(); } catch(e){}
    showToast('🛡️ الدرع صدّ قنبلة!', '#66bbff');
    if (trap.powerupsEnabled) trapResolveStreak('p0', true);
  } else {
    try { soundTrapSafe(); } catch(e){}
    if (trap.powerupsEnabled) trapResolveStreak('p0', false);
  }
  st.turn = 'p1';
  trapEnterBattle(st);
  setTimeout(()=>trapBotTakeTurn(), isBomb ? 1500 : 1100);
}

function trapBotMaybeUsePowerup() {
  if (!trap.powerupsEnabled || !trap.localPowerups) return false;
  const pu = trap.localPowerups.p1;
  if (pu.shield > 0 && !trap.localShield.p1 && trap.localPlayers.p1.hearts <= 2) {
    trap.localPowerups.p1.shield--;
    trap.localShield.p1 = true;
    showToast('🤖 الكمبيوتر فعّل الدرع', '#66bbff');
    return true;
  }
  if (pu.strike > 0 && Math.random() < 0.4) {
    trap.localPowerups.p1.strike--;
    const rev = trap.localState.revealed_p0 || {};
    const cands = [];
    for (let i = 0; i < TRAP_GRID; i++) if (rev[i] == null) cands.push(i);
    if (cands.length > 0) {
      const idx = cands[Math.floor(Math.random() * cands.length)];
      const wasBomb = (trap._myBombsInMyBoard || []).includes(idx);
      if (!trap.localState.revealed_p0) trap.localState.revealed_p0 = {};
      trap.localState.revealed_p0[idx] = wasBomb ? 'bomb' : 'safe';
      if (wasBomb) {
        if (trap.localShield.p0) {
          trap.localShield.p0 = false;
          showToast('🤖💥 ضربة! لكن درعك صدّها', 'var(--gold)');
        } else {
          trap.localPlayers.p0.hearts = Math.max(0, trap.localPlayers.p0.hearts - 1);
          try { soundTrapBoom(); } catch(e){}
          trapPlayBoomEffect();
          setTimeout(()=>trapPlayHeartLossEffect('trapMyHearts'), 350);
          showToast('🤖💥 الكمبيوتر استخدم ضربة وأصاب قنبلة!', 'var(--wrong)');
        }
      } else {
        showToast('🤖💥 الكمبيوتر استخدم ضربة (آمنة)', 'var(--muted)');
      }
      return true;
    }
  }
  return false;
}
function trapBotTakeTurn() {
  const st = trap.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p1') return;
  // Bot may use a power-up first (free action; still takes a normal pick after)
  if (trapBotMaybeUsePowerup()) {
    if (trap.localPlayers.p0.hearts === 0) {
      st.phase = 'end'; st.winner = 'p1';
      setTimeout(()=>trapEnterEnd(st), 900);
      return;
    }
    trapEnterBattle(st);
    setTimeout(()=>trapBotTakeTurn(), 700);
    return;
  }
  const rev = st.revealed_p1;
  const choices = [];
  for (let i=0; i<TRAP_GRID; i++) if (rev[i] == null) choices.push(i);
  if (!choices.length) return;
  const pick = choices[Math.floor(Math.random()*choices.length)];
  const isBomb = (trap.localBombs.p1 || []).includes(pick);
  const shielded = isBomb && trap.powerupsEnabled && trap.localShield && trap.localShield.p1;
  rev[pick] = isBomb ? 'bomb' : 'safe';
  if (isBomb && !shielded) {
    try { soundTrapBoom(); } catch(e){}
    trapPlayBoomEffect();
    setTimeout(()=>{ try { soundTrapHeartLost(); } catch(e){} trapPlayHeartLossEffect('trapOppHearts'); }, 350);
    trap.localPlayers.p1.hearts = Math.max(0, trap.localPlayers.p1.hearts - 1);
    if (trap.powerupsEnabled) trapResolveStreak('p1', true);
    if (trap.localPlayers.p1.hearts === 0) {
      st.phase = 'end'; st.winner = 'p0';
      setTimeout(()=>trapEnterEnd(st), 900);
      return;
    }
  } else if (isBomb && shielded) {
    trap.localShield.p1 = false;
    try { soundTrapConfirm(); } catch(e){}
    showToast('🛡️ درع الكمبيوتر صدّ قنبلة!', '#66bbff');
    if (trap.powerupsEnabled) trapResolveStreak('p1', true);
  } else {
    try { soundTrapTick(); } catch(e){}
    if (trap.powerupsEnabled) trapResolveStreak('p1', false);
  }
  st.turn = 'p0';
  trapEnterBattle(st);
}
const XO_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let xo = {
  code:null, role:null, opponentRole:null, name:null, oppName:'الخصم',
  listeners:[],
  bot:false, localState:null, localPlayers:null,
  scoreX:0, scoreO:0, startingTurn:'p0'
};

function xoShowStage(stage) {
  ['xoLobby','xoBattle','xoEnd'].forEach(id => {
    document.getElementById(id).style.display = (id===stage) ? 'block' : 'none';
  });
}
function xoOpenScreen() {
  ['landingScreen','setupScreen','gameScreen','onlineScreen','adminScreen','trapScreen'].forEach(id=>{
    const e = document.getElementById(id); if (e) e.style.display='none';
  });
  document.getElementById('xoScreen').style.display = 'block';
}
function copyXoCode() {
  const code = xo.code || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  showToast('📋 تم نسخ الرمز: '+code, 'var(--gold)');
}

async function createXoRoom() {
  const botEl = document.getElementById('xoBotMode');
  const endlessEl = document.getElementById('xoEndlessMode');
  const endless = !!(endlessEl && endlessEl.checked);
  if (botEl && botEl.checked) { return startXoBotGame(endless); }
  if (!ensureFirebase()) return;
  const name = (document.getElementById('xoHostName').value.trim()) || 'المضيف';
  const code = genCode();
  xo.code = code; xo.role = 'p0'; xo.opponentRole = 'p1';
  xo.name = name; xo.bot = false; xo.scoreX = 0; xo.scoreO = 0;
  xo.endless = endless;
  try {
    await fb.db.ref('rooms/x'+code).set({
      meta:{ hostName:name, status:'lobby', createdAt: firebase.database.ServerValue.TIMESTAMP, endless },
      players:{ p0:{ name, score:0, joined:true } },
      state:{ phase:'lobby', endless }
    });
  } catch(e) {
    showToast('⚠️ تعذّر إنشاء الغرفة: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
    xo.code = null; xo.role = null; return;
  }
  xoAttachListeners();
  xoOpenScreen(); xoShowStage('xoLobby');
  document.getElementById('xoCodeDisplay').textContent = code;
  document.getElementById('xoLobbyHost').style.display = 'block';
}

async function joinXoRoom() {
  if (!ensureFirebase()) return;
  const name = (document.getElementById('xoJoinName').value.trim()) || 'الخصم';
  const code = (document.getElementById('xoJoinCode').value.trim());
  if (!/^\d{6}$/.test(code)) { showToast('⚠️ رمز الغرفة يتكون من ٦ أرقام بالضبط.', 'var(--wrong)'); return; }
  let data;
  try { const snap = await fb.db.ref('rooms/x'+code).once('value'); data = snap.val(); }
  catch(e) { showToast('⚠️ تعذّر الوصول للغرفة: ' + (e && e.message ? e.message : ''), 'var(--wrong)'); return; }
  if (!data) { showToast('⚠️ الغرفة غير موجودة. تأكد من الرمز أو اطلب من المضيف رمزاً جديداً.', 'var(--wrong)'); return; }
  if (data.players && data.players.p1 && data.players.p1.joined) { showToast('⚠️ الغرفة ممتلئة. انتظر الجولة التالية أو اطلب غرفة جديدة.', 'var(--wrong)'); return; }
  xo.code = code; xo.role = 'p1'; xo.opponentRole = 'p0';
  xo.name = name; xo.bot = false; xo.scoreX = 0; xo.scoreO = 0;
  try { await fb.db.ref('rooms/x'+code+'/players/p1').set({ name, score:0, joined:true }); }
  catch(e) { showToast('⚠️ تعذّر الانضمام: ' + (e && e.message ? e.message : ''), 'var(--wrong)'); xo.code=null; return; }
  xoAttachListeners();
  xoOpenScreen(); xoShowStage('xoLobby');
  document.getElementById('xoCodeDisplay').textContent = code;
  document.getElementById('xoLobbyHost').style.display = 'none';
}

function xoSpectate(code, sid) {
  xo.code = code; xo.role = 'spec'; xo.opponentRole = null; xo.bot = false;
  xo.name = (loadProfile().name) || 'متفرج'; xo.oppName = '';
  xo.scoreX = 0; xo.scoreO = 0; xo._specSid = sid;
  xoAttachListeners();
  attachSpectatorCounter('x', code, xo, 'xoSpectatorCount');
  xoOpenScreen(); xoShowStage('xoLobby');
  document.getElementById('xoCodeDisplay').textContent = code;
  document.getElementById('xoLobbyHost').style.display = 'none';
  document.getElementById('xoLobbyWait').style.display = 'block';
  document.getElementById('xoLobbyWait').textContent = '👁️ أنت تشاهد — انتظر بداية الجولة';
  showToast('👁️ دخلت كمتفرج', '#6495ed');
}
function xoAttachListeners() {
  xoDetachListeners();
  if (xo.role !== 'spec') startRoomHeartbeat('x', xo.code);
  const playersRef = fb.db.ref('rooms/x'+xo.code+'/players');
  const stateRef = fb.db.ref('rooms/x'+xo.code+'/state');
  const onPlayers = playersRef.on('value', s => xoRenderPlayers(s.val()||{}));
  const onState = stateRef.on('value', s => xoOnState(s.val()||{}));
  xo.listeners = [
    () => playersRef.off('value', onPlayers),
    () => stateRef.off('value', onState)
  ];
  attachSpectatorCounter('x', xo.code, xo, 'xoSpectatorCount');
}
function xoDetachListeners() {
  xo.listeners.forEach(off=>{ try{off();}catch(e){} });
  xo.listeners = [];
}

function xoRenderPlayers(players) {
  checkOpponentLeft(xo, players);
  const p0 = players.p0 || {}; const p1 = players.p1 || {};
  document.getElementById('xoP0Name').textContent = p0.name || 'بانتظار...';
  document.getElementById('xoP1Name').textContent = p1.name || 'بانتظار...';
  xo.oppName = (xo.role==='p0' ? p1.name : p0.name) || 'الخصم';
  xo.scoreX = p0.score || 0; xo.scoreO = p1.score || 0;
  const xn = document.getElementById('xoP0NameBattle');
  const on = document.getElementById('xoP1NameBattle');
  if (xn) xn.textContent = p0.name || 'X';
  if (on) on.textContent = p1.name || 'O';
  const sx = document.getElementById('xoP0Score'); if (sx) sx.textContent = xo.scoreX;
  const so = document.getElementById('xoP1Score'); if (so) so.textContent = xo.scoreO;
  if (xo.role==='spec') {
    document.getElementById('xoLobbyHost').style.display = 'none';
    document.getElementById('xoLobbyWait').style.display = 'block';
    document.getElementById('xoLobbyWait').textContent = '👁️ أنت تشاهد — انتظر بداية الجولة';
  } else if (xo.role==='p0') {
    const ready = p0.joined && p1.joined;
    document.getElementById('xoLobbyHost').style.display = ready ? 'block' : 'none';
    document.getElementById('xoLobbyWait').style.display = ready ? 'none' : 'block';
    document.getElementById('xoLobbyWait').textContent = ready ? '' : 'في انتظار الخصم…';
  } else {
    document.getElementById('xoLobbyWait').style.display = 'block';
    document.getElementById('xoLobbyWait').textContent = 'في انتظار المضيف ليبدأ اللعبة…';
  }
}

async function xoStart() {
  if (xo.role !== 'p0') return;
  const startTurn = xo.startingTurn || 'p0';
  // Preserve the room's endless rule when transitioning lobby → battle.
  // Without this, the .set() wipes state.endless and the round can end
  // in a draw even though the host originally enabled the no-draw mode.
  await fb.db.ref('rooms/x'+xo.code+'/state').set({
    phase:'battle', turn:startTurn, board:Array(9).fill(''), round:1,
    endless: !!xo.endless, lastErased: null
  });
  await fb.db.ref('rooms/x'+xo.code+'/meta/status').set('active');
}

function xoOnState(state) {
  const phase = state.phase;
  // Inherit the endless flag from the room so the joining player and any
  // spectators all see the same rule-set
  xo.endless = !!state.endless;
  // Lobby badge reflects the room's rule so the joiner knows what they
  // signed up for before the first move.
  const lbE = document.getElementById('xoLobbyEndless');
  if (lbE) lbE.style.display = xo.endless ? '' : 'none';
  if (phase === 'lobby') xoShowStage('xoLobby');
  else if (phase === 'battle') xoEnterBattle(state);
  else if (phase === 'roundEnd') xoEnterRoundEnd(state);
}

function xoEnterBattle(state) {
  xoShowStage('xoBattle');
  const board = state.board || Array(9).fill('');
  const isSpec = (xo.role === 'spec');
  const specBanner = document.getElementById('xoSpectatorBanner');
  if (specBanner) specBanner.style.display = isSpec ? 'block' : 'none';
  const prev = xo._lastBoard || Array(9).fill('');
  const myMarkLetter = (xo.role==='p0') ? 'X' : 'O';
  for (let k=0; k<9; k++) {
    if (!prev[k] && board[k] && board[k] !== myMarkLetter) {
      try { soundXoOppMove(); } catch(e){}
      break;
    }
  }
  xo._lastBoard = [...board];
  const myMark = (xo.role==='p0') ? 'X' : 'O';
  const oppMark = (xo.role==='p0') ? 'O' : 'X';
  const myCls  = (xo.role==='p0') ? 'x' : 'o';
  const oppCls = (xo.role==='p0') ? 'o' : 'x';
  const myTurn = !isSpec && (state.turn === xo.role);
  const banner = document.getElementById('xoTurnBanner');
  if (isSpec) {
    banner.className = 'trap-turn-banner opp-turn';
    const activeMark = state.turn === 'p0' ? 'X' : 'O';
    const activeCls  = state.turn === 'p0' ? 'x' : 'o';
    banner.innerHTML = '⏳ دور <span class="xo-score ' + activeCls + '" style="font-weight:900;font-size:1.15em">' + activeMark + '</span>';
  } else {
    banner.className = 'trap-turn-banner ' + (myTurn ? 'my-turn' : 'opp-turn');
    banner.innerHTML = myTurn
      ? '🎯 دورك! ضع <span class="xo-score ' + myCls + '" style="font-weight:900;font-size:1.15em">' + myMark + '</span>'
      : '⏳ دور ' + (xo.oppName || 'الخصم') + ' <span class="xo-score ' + oppCls + '" style="font-weight:900;font-size:1.15em">' + oppMark + '</span>';
  }
  // Endless-mode badge (appended after the turn banner)
  if (xo.endless){
    banner.innerHTML += ' <span style="display:inline-block;margin-inline-start:8px;padding:3px 9px;border-radius:50px;background:rgba(160,112,224,0.18);border:1px solid rgba(160,112,224,0.55);color:#c79bff;font-size:0.78em;font-weight:800">♾️ بدون تعادل</span>';
  }
  const boardEl = document.getElementById('xoBoard'); boardEl.innerHTML = '';
  const winLine = xoFindWin(board);
  // If cells were just erased by the endless rule, flash them so both
  // players can see what disappeared. lastErased may be a single index,
  // a comma list, or an array depending on writer; we handle all three.
  const lastErased = state.lastErased;
  const erasedSet = new Set(
    Array.isArray(lastErased) ? lastErased.map(Number)
      : (typeof lastErased === 'string' ? lastErased.split(',').filter(s=>s!=='').map(Number)
      : (typeof lastErased === 'number' && lastErased >= 0 ? [lastErased] : []))
  );
  for (let i=0; i<9; i++) {
    const c = document.createElement('div'); c.className = 'xo-cell'; c.dataset.idx = i;
    if (board[i] === 'X') { c.classList.add('x','filled'); c.textContent = 'X'; }
    else if (board[i] === 'O') { c.classList.add('o','filled'); c.textContent = 'O'; }
    else if (myTurn) { c.onclick = () => xoPickCell(i); }
    else { c.classList.add('disabled'); }
    if (winLine && winLine.includes(i)) c.classList.add('win');
    if (erasedSet.has(i) && !board[i]) c.classList.add('erased');
    boardEl.appendChild(c);
  }
  // Mid-game endless toast — the rule is symmetric (one mark from each side
  // gets wiped) so everyone sees the same neutral message.
  if (erasedSet.size && state.phase === 'battle' && xo._lastErasedKey !== (lastErased+'')){
    xo._lastErasedKey = (lastErased+'');
    try { showToast('⚖️ تعادل! مُسحت علامة من كل لاعب — اللعب يستمرّ.', 'var(--p3)'); } catch(e){}
  }
}

function xoFindWin(board) {
  for (const line of XO_LINES) {
    const [a,b,c] = line;
    if (board[a] && board[a]===board[b] && board[a]===board[c]) return line;
  }
  return null;
}
function xoBoardFull(board) { return board.every(c => c); }

async function xoPickCell(i) {
  if (xo.bot) { return xoBotPlayerPick(i); }
  const code = xo.code; if (!code) return;
  const ssnap = await fb.db.ref('rooms/x'+code+'/state').once('value');
  const st = ssnap.val() || {};
  if (st.phase !== 'battle' || st.turn !== xo.role) return;
  const board = st.board || Array(9).fill('');
  if (board[i]) return;
  const mark = (xo.role==='p0') ? 'X' : 'O';
  board[i] = mark;
  try { if (mark === 'X') soundXoPlaceX(); else soundXoPlaceO(); } catch(e){}
  const winLine = xoFindWin(board);
  const updates = { 'state/board': board, 'state/lastErased': null };
  if (winLine) {
    updates['state/phase'] = 'roundEnd';
    updates['state/winner'] = xo.role;
    updates['state/winLine'] = winLine;
    const psnap = await fb.db.ref('rooms/x'+code+'/players/'+xo.role).once('value');
    const me = psnap.val() || {};
    updates['players/'+xo.role+'/score'] = (me.score||0) + 1;
  } else if (xoBoardFull(board)) {
    if (st.endless || xo.endless){
      // Endless mode: erase ONE random mark from each side so the rule is
      // symmetric (the placer pays too) and the next player has 2 empty
      // cells to pick from. Turn always passes to the opponent.
      const erased = xoEraseRandomBoth(board);
      if (erased.length){
        updates['state/board'] = board;
        updates['state/lastErased'] = erased.join(',');
        updates['state/turn'] = (xo.role==='p0') ? 'p1' : 'p0';
      } else {
        // Edge case: nothing on the board to erase — fall back to draw
        updates['state/phase'] = 'roundEnd';
        updates['state/winner'] = 'draw';
      }
    } else {
      updates['state/phase'] = 'roundEnd';
      updates['state/winner'] = 'draw';
    }
  } else {
    updates['state/turn'] = (xo.role==='p0') ? 'p1' : 'p0';
  }
  await fb.db.ref('rooms/x'+code).update(updates);
}

function xoEnterRoundEnd(state) {
  xoEnterBattle({ ...state, phase:'battle', turn:null });
  setTimeout(() => {
    xoShowStage('xoEnd');
    const winner = state.winner;
    const isSpec = (xo.role === 'spec');
    let emoji, text;
    if (winner === 'draw') { emoji = '🤝'; text = 'تعادل!'; if (!isSpec) { try { soundXoDraw(); } catch(e){} try { recordGameResult('xo', { draw:true }); } catch(e){} } }
    else if (!isSpec && winner === xo.role) { emoji = '🏆'; text = '🎉 فزت بهذه الجولة!'; try { soundXoWin(); if (typeof launchConfetti==='function') launchConfetti(); } catch(e){} try { recordGameResult('xo', { won:true }); } catch(e){} }
    else if (isSpec) { emoji = '🏆'; text = '🎉 انتهت الجولة — ' + (winner === 'p0' ? 'X' : 'O') + ' فاز'; }
    else { emoji = '😔'; text = 'خسرت هذه الجولة. حظ أوفر!'; try { soundXoLose(); } catch(e){} try { recordGameResult('xo', { lost:true }); } catch(e){} }
    document.getElementById('xoEndEmoji').textContent = emoji;
    document.getElementById('xoEndText').textContent = text;
    const ea = document.querySelector('#xoEnd .start-btn');
    if (ea && isSpec) ea.style.display = 'none';
    else if (ea) ea.style.display = '';
    if (xo.role === 'p0' || xo.bot) {
      xo.startingTurn = (winner === 'draw') ? 'p0' : ((winner === 'p0') ? 'p1' : 'p0');
    }
  }, 1500);
}

async function xoPlayAgain() {
  if (xo.bot) { return xoBotPlayAgain(); }
  if (xo.role !== 'p0') {
    showToast('⏳ في انتظار المضيف ليبدأ جولة جديدة…', 'var(--gold)');
    return;
  }
  xo._lastBoard = null;
  await fb.db.ref('rooms/x'+xo.code+'/state').set({ phase:'battle', turn:xo.startingTurn||'p0', board:Array(9).fill(''), endless: !!xo.endless, lastErased: null });
}

function leaveXo() {
  stopRoomHeartbeat();
  xoDetachListeners();
  if (!xo.bot) {
    try {
      if (xo.code && xo.role === 'spec' && xo._specSid) fb.db.ref('rooms/x'+xo.code+'/spectators/'+xo._specSid).remove();
      else if (xo.code && xo.role === 'p0') fb.db.ref('rooms/x'+xo.code).remove();
      else if (xo.code && xo.role === 'p1') fb.db.ref('rooms/x'+xo.code+'/players/p1').remove();
    } catch(e){}
  }
  const sb = document.getElementById('xoSpectatorBanner'); if (sb) sb.style.display = 'none';
  const sc = document.getElementById('xoSpectatorCount'); if (sc) sc.style.display = 'none';
  xo.code = null; xo.role = null; xo.opponentRole = null;
  xo.bot = false; xo.localState = null; xo.localPlayers = null;
  xo.scoreX = 0; xo.scoreO = 0; xo.startingTurn = 'p0'; xo._specSid = null;
  document.getElementById('xoScreen').style.display = 'none';
  goToLanding();
}
function startXoBotGame(endless) {
  const name = (document.getElementById('xoHostName').value.trim()) || 'أنت';
  xo.bot = true; xo.code = null; xo.role = 'p0'; xo.opponentRole = 'p1';
  xo.name = name; xo.oppName = '🤖 الكمبيوتر';
  xo.scoreX = 0; xo.scoreO = 0; xo.startingTurn = 'p0';
  xo.endless = !!endless;
  xo.localPlayers = {
    p0: { name, score:0, joined:true },
    p1: { name:'🤖 الكمبيوتر', score:0, joined:true }
  };
  xo.localState = { phase:'battle', turn:'p0', board:Array(9).fill(''), endless: xo.endless };
  xoOpenScreen();
  xoRenderPlayers(xo.localPlayers);
  xoEnterBattle(xo.localState);
}

// Endless-mode helper: erases ONE random mark from each side (one X + one O)
// when the board fills without a winner. This keeps the rule symmetric — the
// player who just placed the 9th piece also pays a cost — and gives the next
// player two empty cells to pick from. Returns the list of erased indices
// (0–2 entries) for the visual flash on clients.
function xoEraseRandomBoth(board){
  const xCells = [], oCells = [];
  for (let k = 0; k < 9; k++){
    if (board[k] === 'X') xCells.push(k);
    else if (board[k] === 'O') oCells.push(k);
  }
  const erased = [];
  if (xCells.length){
    const idx = xCells[Math.floor(Math.random() * xCells.length)];
    board[idx] = ''; erased.push(idx);
  }
  if (oCells.length){
    const idx = oCells[Math.floor(Math.random() * oCells.length)];
    board[idx] = ''; erased.push(idx);
  }
  return erased;
}

function xoBotPlayerPick(i) {
  const st = xo.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p0') return;
  if (st.board[i]) return;
  st.lastErased = -1; // clear any previous flash
  st.board[i] = 'X';
  try { soundXoPlaceX(); } catch(e){}
  const winLine = xoFindWin(st.board);
  if (winLine) {
    st.phase = 'roundEnd'; st.winner = 'p0'; st.winLine = winLine;
    xo.localPlayers.p0.score = (xo.localPlayers.p0.score||0) + 1;
    xoRenderPlayers(xo.localPlayers);
    xoEnterRoundEnd(st);
    return;
  }
  if (xoBoardFull(st.board)) {
    if (xo.endless){
      const erased = xoEraseRandomBoth(st.board);
      if (erased.length){
        st.lastErased = erased.join(',');
        st.turn = 'p1';
        xoEnterBattle(st);
        setTimeout(()=>xoBotTakeTurn(), 700);
        return;
      }
    }
    st.phase = 'roundEnd'; st.winner = 'draw';
    xoEnterRoundEnd(st); return;
  }
  st.turn = 'p1';
  xoEnterBattle(st);
  setTimeout(()=>xoBotTakeTurn(), 600);
}

function xoBotTakeTurn() {
  const st = xo.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p1') return;
  const pick = xoBotChooseMove(st.board);
  if (pick == null) return;
  st.lastErased = -1;
  st.board[pick] = 'O';
  try { soundXoPlaceO(); } catch(e){}
  const winLine = xoFindWin(st.board);
  if (winLine) {
    st.phase = 'roundEnd'; st.winner = 'p1'; st.winLine = winLine;
    xo.localPlayers.p1.score = (xo.localPlayers.p1.score||0) + 1;
    xoRenderPlayers(xo.localPlayers);
    xoEnterRoundEnd(st);
    return;
  }
  if (xoBoardFull(st.board)) {
    if (xo.endless){
      const erased = xoEraseRandomBoth(st.board);
      if (erased.length){
        st.lastErased = erased.join(',');
        st.turn = 'p0';
        xoEnterBattle(st);
        return;
      }
    }
    st.phase = 'roundEnd'; st.winner = 'draw';
    xoEnterRoundEnd(st); return;
  }
  st.turn = 'p0';
  xoEnterBattle(st);
}
function xoBotChooseMove(board) {
  for (let i=0; i<9; i++) {
    if (!board[i]) {
      const t = [...board]; t[i] = 'O';
      if (xoFindWin(t)) return i;
    }
  }
  for (let i=0; i<9; i++) {
    if (!board[i]) {
      const t = [...board]; t[i] = 'X';
      if (xoFindWin(t)) return i;
    }
  }
  if (!board[4]) return 4;
  const corners = [0,2,6,8].filter(i => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  const edges = [1,3,5,7].filter(i => !board[i]);
  if (edges.length) return edges[Math.floor(Math.random()*edges.length)];
  return null;
}

function xoBotPlayAgain() {
  const next = (xo.localState && xo.localState.winner === 'p0') ? 'p1' : 'p0';
  xo.localState = { phase:'battle', turn:next, board:Array(9).fill(''), endless: !!xo.endless };
  xo._lastBoard = null;
  xoEnterBattle(xo.localState);
  if (next === 'p1') setTimeout(()=>xoBotTakeTurn(), 600);
}
const C4_COLS = 7, C4_ROWS = 6;
let c4 = {
  code:null, role:null, opponentRole:null, name:null, oppName:'الخصم',
  listeners:[],
  bot:false, localState:null, localPlayers:null,
  startingTurn:'p0', _lastBoard:null
};
function c4ShowStage(stage) {
  ['c4Lobby','c4Battle','c4End'].forEach(id => {
    document.getElementById(id).style.display = (id===stage) ? 'block' : 'none';
  });
}
function c4OpenScreen() {
  ['landingScreen','setupScreen','gameScreen','onlineScreen','adminScreen','trapScreen','xoScreen','memScreen'].forEach(id=>{
    const e = document.getElementById(id); if (e) e.style.display='none';
  });
  document.getElementById('c4Screen').style.display = 'block';
}
function copyC4Code() {
  const code = c4.code || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  showToast('📋 تم نسخ الرمز: '+code, 'var(--gold)');
}

async function createC4Room() {
  const botEl = document.getElementById('c4BotMode');
  if (botEl && botEl.checked) { return startC4BotGame(); }
  if (!ensureFirebase()) return;
  const name = (document.getElementById('c4HostName').value.trim()) || 'المضيف';
  const code = genCode();
  c4.code = code; c4.role = 'p0'; c4.opponentRole = 'p1';
  c4.name = name; c4.bot = false;
  try {
    await fb.db.ref('rooms/c'+code).set({
      meta:{ hostName:name, status:'lobby', createdAt: firebase.database.ServerValue.TIMESTAMP },
      players:{ p0:{ name, score:0, joined:true } },
      state:{ phase:'lobby' }
    });
  } catch(e) {
    showToast('⚠️ تعذّر إنشاء الغرفة: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
    c4.code = null; return;
  }
  c4AttachListeners();
  c4OpenScreen(); c4ShowStage('c4Lobby');
  document.getElementById('c4CodeDisplay').textContent = code;
  document.getElementById('c4LobbyHost').style.display = 'block';
}

async function joinC4Room() {
  if (!ensureFirebase()) return;
  const name = (document.getElementById('c4JoinName').value.trim()) || 'الخصم';
  const code = (document.getElementById('c4JoinCode').value.trim());
  if (!/^\d{6}$/.test(code)) { showToast('⚠️ رمز الغرفة يتكون من ٦ أرقام بالضبط.', 'var(--wrong)'); return; }
  let data;
  try { const snap = await fb.db.ref('rooms/c'+code).once('value'); data = snap.val(); }
  catch(e) { showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); return; }
  if (!data) { showToast('⚠️ الغرفة غير موجودة. تأكد من الرمز أو اطلب من المضيف رمزاً جديداً.', 'var(--wrong)'); return; }
  if (data.players && data.players.p1 && data.players.p1.joined) { showToast('⚠️ الغرفة ممتلئة. انتظر الجولة التالية أو اطلب غرفة جديدة.', 'var(--wrong)'); return; }
  c4.code = code; c4.role = 'p1'; c4.opponentRole = 'p0'; c4.name = name; c4.bot = false;
  try { await fb.db.ref('rooms/c'+code+'/players/p1').set({ name, score:0, joined:true }); }
  catch(e) { showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); c4.code=null; return; }
  c4AttachListeners();
  c4OpenScreen(); c4ShowStage('c4Lobby');
  document.getElementById('c4CodeDisplay').textContent = code;
  document.getElementById('c4LobbyHost').style.display = 'none';
}

function c4Spectate(code, sid) {
  c4.code = code; c4.role = 'spec'; c4.opponentRole = null; c4.bot = false;
  c4.name = (loadProfile().name) || 'متفرج'; c4.oppName = ''; c4._specSid = sid;
  c4AttachListeners();
  attachSpectatorCounter('c', code, c4, 'c4SpectatorCount');
  c4OpenScreen(); c4ShowStage('c4Lobby');
  document.getElementById('c4CodeDisplay').textContent = code;
  document.getElementById('c4LobbyHost').style.display = 'none';
  document.getElementById('c4LobbyWait').style.display = 'block';
  document.getElementById('c4LobbyWait').textContent = '👁️ أنت تشاهد — انتظر بداية الجولة';
  showToast('👁️ دخلت كمتفرج', '#6495ed');
}
function c4AttachListeners() {
  c4DetachListeners();
  if (c4.role !== 'spec') startRoomHeartbeat('c', c4.code);
  const playersRef = fb.db.ref('rooms/c'+c4.code+'/players');
  const stateRef = fb.db.ref('rooms/c'+c4.code+'/state');
  const onPlayers = playersRef.on('value', s => c4RenderPlayers(s.val()||{}));
  const onState = stateRef.on('value', s => c4OnState(s.val()||{}));
  c4.listeners = [ () => playersRef.off('value', onPlayers), () => stateRef.off('value', onState) ];
  attachSpectatorCounter('c', c4.code, c4, 'c4SpectatorCount');
}
function c4DetachListeners() {
  c4.listeners.forEach(off=>{ try{off();}catch(e){} });
  c4.listeners = [];
}

function c4RenderPlayers(players) {
  checkOpponentLeft(c4, players);
  const p0 = players.p0 || {}; const p1 = players.p1 || {};
  document.getElementById('c4P0Name').textContent = p0.name || 'بانتظار...';
  document.getElementById('c4P1Name').textContent = p1.name || 'بانتظار...';
  c4.oppName = (c4.role==='p0' ? p1.name : p0.name) || 'الخصم';
  const r0 = document.getElementById('c4P0NameBattle'); if (r0) r0.textContent = p0.name || 'أحمر';
  const r1 = document.getElementById('c4P1NameBattle'); if (r1) r1.textContent = p1.name || 'أصفر';
  const sr = document.getElementById('c4P0Score'); if (sr) sr.textContent = p0.score || 0;
  const sy = document.getElementById('c4P1Score'); if (sy) sy.textContent = p1.score || 0;
  if (c4.role==='spec') {
    document.getElementById('c4LobbyHost').style.display = 'none';
    document.getElementById('c4LobbyWait').style.display = 'block';
    document.getElementById('c4LobbyWait').textContent = '👁️ أنت تشاهد — انتظر بداية الجولة';
  } else if (c4.role==='p0') {
    const ready = p0.joined && p1.joined;
    document.getElementById('c4LobbyHost').style.display = ready ? 'block' : 'none';
    document.getElementById('c4LobbyWait').style.display = ready ? 'none' : 'block';
    document.getElementById('c4LobbyWait').textContent = ready ? '' : 'في انتظار الخصم…';
  } else {
    document.getElementById('c4LobbyWait').style.display = 'block';
    document.getElementById('c4LobbyWait').textContent = 'في انتظار المضيف ليبدأ اللعبة…';
  }
}

async function c4Start() {
  if (c4.role !== 'p0') return;
  c4._lastBoard = null;
  await fb.db.ref('rooms/c'+c4.code+'/state').set({ phase:'battle', turn: c4.startingTurn||'p0', board: Array(C4_COLS*C4_ROWS).fill('') });
  await fb.db.ref('rooms/c'+c4.code+'/meta/status').set('active');
}

function c4OnState(state) {
  const phase = state.phase;
  if (phase === 'lobby') c4ShowStage('c4Lobby');
  else if (phase === 'battle') c4EnterBattle(state);
  else if (phase === 'roundEnd') c4EnterRoundEnd(state);
}

function c4Idx(row, col) { return row * C4_COLS + col; }
function c4LowestEmptyRow(board, col) {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (!board[c4Idx(r, col)]) return r;
  }
  return -1;
}
function c4FindWin(board) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r=0; r<C4_ROWS; r++) {
    for (let c=0; c<C4_COLS; c++) {
      const v = board[c4Idx(r,c)]; if (!v) continue;
      for (const [dr,dc] of dirs) {
        const line = [c4Idx(r,c)];
        for (let k=1; k<4; k++) {
          const nr=r+dr*k, nc=c+dc*k;
          if (nr<0||nr>=C4_ROWS||nc<0||nc>=C4_COLS) break;
          if (board[c4Idx(nr,nc)] !== v) break;
          line.push(c4Idx(nr,nc));
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}
function c4BoardFull(board) { return board.every(c => c); }

function c4EnterBattle(state) {
  c4ShowStage('c4Battle');
  const isSpec = (c4.role === 'spec');
  const specBanner = document.getElementById('c4SpectatorBanner');
  if (specBanner) specBanner.style.display = isSpec ? 'block' : 'none';
  const board = state.board || Array(C4_COLS*C4_ROWS).fill('');
  const prev = c4._lastBoard || Array(C4_COLS*C4_ROWS).fill('');
  const myLetter = (c4.role==='p0') ? 'R' : 'Y';
  const newIndices = new Set();
  for (let k=0; k<board.length; k++) {
    if (!prev[k] && board[k]) {
      newIndices.add(k);
      if (board[k] !== myLetter) { try { soundXoOppMove(); } catch(e){} }
    }
  }
  c4._lastBoard = [...board];
  const myTurn = !isSpec && (state.turn === c4.role);
  const banner = document.getElementById('c4TurnBanner');
  if (isSpec) {
    banner.className = 'trap-turn-banner opp-turn';
    const color = state.turn === 'p0' ? '#e05c5c' : '#f0c040';
    banner.innerHTML = '⏳ الدور للـ<span style="color:' + color + ';font-weight:900">●</span>';
  } else {
    banner.className = 'trap-turn-banner ' + (myTurn ? 'my-turn' : 'opp-turn');
    banner.innerHTML = myTurn
      ? '🎯 دورك! أسقط <span style="color:#e05c5c;font-weight:900">●</span>'.replace('#e05c5c', c4.role==='p0'?'#e05c5c':'#f0c040')
      : '⏳ دور ' + (c4.oppName || 'الخصم');
  }
  const colsEl = document.getElementById('c4Cols'); colsEl.innerHTML = '';
  for (let c=0; c<C4_COLS; c++) {
    const btn = document.createElement('div'); btn.className = 'c4-col-btn';
    btn.textContent = '↓';
    const colFull = !!board[c4Idx(0, c)];
    if (colFull) btn.classList.add('full');
    else if (!myTurn) btn.classList.add('disabled');
    else btn.onclick = () => c4DropPiece(c);
    colsEl.appendChild(btn);
  }
  const winLine = c4FindWin(board);
  const boardEl = document.getElementById('c4Board'); boardEl.innerHTML = '';
  for (let r=0; r<C4_ROWS; r++) {
    for (let c=0; c<C4_COLS; c++) {
      const cell = document.createElement('div'); cell.className = 'c4-cell';
      const idx = c4Idx(r,c);
      const v = board[idx];
      if (v) {
        const disc = document.createElement('div'); disc.className = 'c4-disc-piece ' + (v==='R'?'r':'y');
        if (newIndices.has(idx)) disc.classList.add('dropping');
        if (winLine && winLine.includes(idx)) disc.classList.add('win');
        cell.appendChild(disc);
      }
      boardEl.appendChild(cell);
    }
  }
}

async function c4DropPiece(col) {
  if (c4.bot) { return c4BotPlayerDrop(col); }
  const code = c4.code; if (!code) return;
  const ssnap = await fb.db.ref('rooms/c'+code+'/state').once('value');
  const st = ssnap.val() || {};
  if (st.phase !== 'battle' || st.turn !== c4.role) return;
  const board = st.board || Array(C4_COLS*C4_ROWS).fill('');
  const row = c4LowestEmptyRow(board, col);
  if (row < 0) return;
  const mark = (c4.role==='p0') ? 'R' : 'Y';
  board[c4Idx(row, col)] = mark;
  try { if (mark === 'R') soundXoPlaceX(); else soundXoPlaceO(); } catch(e){}
  const winLine = c4FindWin(board);
  const updates = { 'state/board': board };
  if (winLine) {
    updates['state/phase'] = 'roundEnd';
    updates['state/winner'] = c4.role;
    const psnap = await fb.db.ref('rooms/c'+code+'/players/'+c4.role).once('value');
    const me = psnap.val() || {};
    updates['players/'+c4.role+'/score'] = (me.score||0) + 1;
  } else if (c4BoardFull(board)) {
    updates['state/phase'] = 'roundEnd';
    updates['state/winner'] = 'draw';
  } else {
    updates['state/turn'] = (c4.role==='p0') ? 'p1' : 'p0';
  }
  await fb.db.ref('rooms/c'+code).update(updates);
}

function c4EnterRoundEnd(state) {
  c4EnterBattle({ ...state, phase:'battle', turn:null });
  setTimeout(() => {
    c4ShowStage('c4End');
    const winner = state.winner;
    const isSpec = (c4.role === 'spec');
    let emoji, text;
    if (winner === 'draw') { emoji = '🤝'; text = 'تعادل! اللوحة امتلأت'; if (!isSpec) { try { soundXoDraw(); } catch(e){} try { recordGameResult('c4', { draw:true }); } catch(e){} } }
    else if (!isSpec && winner === c4.role) { emoji = '🏆'; text = '🎉 فزت! ٤ متتالية'; try { soundXoWin(); if (typeof launchConfetti==='function') launchConfetti(); } catch(e){} try { recordGameResult('c4', { won:true }); } catch(e){} }
    else if (isSpec) { emoji = '🏆'; text = '🎉 انتهت الجولة'; }
    else { emoji = '😔'; text = 'خسرت هذه الجولة'; try { soundXoLose(); } catch(e){} try { recordGameResult('c4', { lost:true }); } catch(e){} }
    document.getElementById('c4EndEmoji').textContent = emoji;
    document.getElementById('c4EndText').textContent = text;
    const ea = document.querySelector('#c4End .start-btn');
    if (ea) ea.style.display = isSpec ? 'none' : '';
    if (c4.role === 'p0' || c4.bot) {
      c4.startingTurn = (winner === 'draw') ? 'p0' : ((winner === 'p0') ? 'p1' : 'p0');
    }
  }, 1400);
}

async function c4PlayAgain() {
  if (c4.bot) { return c4BotPlayAgain(); }
  if (c4.role !== 'p0') { showToast('⏳ في انتظار المضيف ليبدأ جولة جديدة…', 'var(--gold)'); return; }
  c4._lastBoard = null;
  await fb.db.ref('rooms/c'+c4.code+'/state').set({ phase:'battle', turn: c4.startingTurn||'p0', board: Array(C4_COLS*C4_ROWS).fill('') });
}

function leaveC4() {
  stopRoomHeartbeat();
  c4DetachListeners();
  if (!c4.bot) {
    try {
      if (c4.code && c4.role === 'spec' && c4._specSid) fb.db.ref('rooms/c'+c4.code+'/spectators/'+c4._specSid).remove();
      else if (c4.code && c4.role === 'p0') fb.db.ref('rooms/c'+c4.code).remove();
      else if (c4.code && c4.role === 'p1') fb.db.ref('rooms/c'+c4.code+'/players/p1').remove();
    } catch(e){}
  }
  const sb = document.getElementById('c4SpectatorBanner'); if (sb) sb.style.display = 'none';
  const sc = document.getElementById('c4SpectatorCount'); if (sc) sc.style.display = 'none';
  c4.code = null; c4.role = null; c4.opponentRole = null;
  c4.bot = false; c4.localState = null; c4.localPlayers = null; c4.startingTurn = 'p0'; c4._specSid = null;
  document.getElementById('c4Screen').style.display = 'none';
  goToLanding();
}
function startC4BotGame() {
  const name = (document.getElementById('c4HostName').value.trim()) || 'أنت';
  c4.bot = true; c4.code = null; c4.role = 'p0'; c4.opponentRole = 'p1';
  c4.name = name; c4.oppName = '🤖 الكمبيوتر'; c4.startingTurn = 'p0';
  c4.localPlayers = {
    p0: { name, score:0, joined:true },
    p1: { name:'🤖 الكمبيوتر', score:0, joined:true }
  };
  c4.localState = { phase:'battle', turn:'p0', board: Array(C4_COLS*C4_ROWS).fill('') };
  c4OpenScreen();
  c4RenderPlayers(c4.localPlayers);
  c4EnterBattle(c4.localState);
}
function c4BotPlayerDrop(col) {
  const st = c4.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p0') return;
  const row = c4LowestEmptyRow(st.board, col); if (row < 0) return;
  st.board[c4Idx(row, col)] = 'R';
  try { soundXoPlaceX(); } catch(e){}
  const winLine = c4FindWin(st.board);
  if (winLine) {
    st.phase = 'roundEnd'; st.winner = 'p0';
    c4.localPlayers.p0.score = (c4.localPlayers.p0.score||0) + 1;
    c4RenderPlayers(c4.localPlayers);
    c4EnterRoundEnd(st);
    return;
  }
  if (c4BoardFull(st.board)) { st.phase='roundEnd'; st.winner='draw'; c4EnterRoundEnd(st); return; }
  st.turn = 'p1';
  c4EnterBattle(st);
  setTimeout(()=>c4BotTakeTurn(), 700);
}
function c4BotTakeTurn() {
  const st = c4.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p1') return;
  const pick = c4BotChooseColumn(st.board);
  if (pick == null) return;
  const row = c4LowestEmptyRow(st.board, pick); if (row < 0) return;
  st.board[c4Idx(row, pick)] = 'Y';
  try { soundXoPlaceO(); } catch(e){}
  const winLine = c4FindWin(st.board);
  if (winLine) {
    st.phase = 'roundEnd'; st.winner = 'p1';
    c4.localPlayers.p1.score = (c4.localPlayers.p1.score||0) + 1;
    c4RenderPlayers(c4.localPlayers);
    c4EnterRoundEnd(st);
    return;
  }
  if (c4BoardFull(st.board)) { st.phase='roundEnd'; st.winner='draw'; c4EnterRoundEnd(st); return; }
  st.turn = 'p0';
  c4EnterBattle(st);
}
function c4BotChooseColumn(board) {
  const cols = [];
  for (let c=0; c<C4_COLS; c++) if (!board[c4Idx(0, c)]) cols.push(c);
  if (!cols.length) return null;
  for (const c of cols) {
    const row = c4LowestEmptyRow(board, c);
    const t = [...board]; t[c4Idx(row, c)] = 'Y';
    if (c4FindWin(t)) return c;
  }
  for (const c of cols) {
    const row = c4LowestEmptyRow(board, c);
    const t = [...board]; t[c4Idx(row, c)] = 'R';
    if (c4FindWin(t)) return c;
  }
  const safe = cols.filter(c => {
    const row = c4LowestEmptyRow(board, c);
    if (row <= 0) return true;
    const t = [...board]; t[c4Idx(row, c)] = 'Y'; t[c4Idx(row-1, c)] = 'R';
    return !c4FindWin(t);
  });
  const pool = safe.length ? safe : cols;
  const order = [3,2,4,1,5,0,6];
  for (const c of order) if (pool.includes(c)) return c;
  return pool[Math.floor(Math.random()*pool.length)];
}
function c4BotPlayAgain() {
  const next = (c4.localState && c4.localState.winner === 'p0') ? 'p1' : 'p0';
  c4.localState = { phase:'battle', turn:next, board: Array(C4_COLS*C4_ROWS).fill('') };
  c4._lastBoard = null;
  c4EnterBattle(c4.localState);
  if (next === 'p1') setTimeout(()=>c4BotTakeTurn(), 700);
}
const MEM_EMOJIS = ['🍎','🍌','🍇','🍓','🍑','🍍','🥝','🥥'];
let mem = {
  code:null, role:null, opponentRole:null, name:null, oppName:'الخصم',
  listeners:[],
  bot:false, localState:null, localPlayers:null,
  startingTurn:'p0',
  _lastFlipped:null, _localFlip:null, _botSeen:{}
};
function memShowStage(stage) {
  ['memLobby','memBattle','memEnd'].forEach(id => {
    document.getElementById(id).style.display = (id===stage) ? 'block' : 'none';
  });
}
function memOpenScreen() {
  ['landingScreen','setupScreen','gameScreen','onlineScreen','adminScreen','trapScreen','xoScreen','c4Screen'].forEach(id=>{
    const e = document.getElementById(id); if (e) e.style.display='none';
  });
  document.getElementById('memScreen').style.display = 'block';
}
function copyMemCode() {
  const code = mem.code || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  showToast('📋 تم نسخ الرمز: '+code, 'var(--gold)');
}

function memBuildShuffledDeck() {
  const deck = [];
  MEM_EMOJIS.forEach(e => { deck.push(e); deck.push(e); });
  for (let i=deck.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]] = [deck[j],deck[i]];
  }
  return deck;
}

async function createMemRoom() {
  const botEl = document.getElementById('memBotMode');
  if (botEl && botEl.checked) { return startMemBotGame(); }
  if (!ensureFirebase()) return;
  const name = (document.getElementById('memHostName').value.trim()) || 'المضيف';
  const code = genCode();
  mem.code = code; mem.role = 'p0'; mem.opponentRole = 'p1';
  mem.name = name; mem.bot = false;
  try {
    await fb.db.ref('rooms/m'+code).set({
      meta:{ hostName:name, status:'lobby', createdAt: firebase.database.ServerValue.TIMESTAMP },
      players:{ p0:{ name, score:0, joined:true } },
      state:{ phase:'lobby' }
    });
  } catch(e) {
    showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); mem.code = null; return;
  }
  memAttachListeners();
  memOpenScreen(); memShowStage('memLobby');
  document.getElementById('memCodeDisplay').textContent = code;
  document.getElementById('memLobbyHost').style.display = 'block';
}

async function joinMemRoom() {
  if (!ensureFirebase()) return;
  const name = (document.getElementById('memJoinName').value.trim()) || 'الخصم';
  const code = (document.getElementById('memJoinCode').value.trim());
  if (!/^\d{6}$/.test(code)) { showToast('⚠️ رمز الغرفة يتكون من ٦ أرقام بالضبط.', 'var(--wrong)'); return; }
  let data;
  try { const snap = await fb.db.ref('rooms/m'+code).once('value'); data = snap.val(); }
  catch(e) { showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); return; }
  if (!data) { showToast('⚠️ الغرفة غير موجودة. تأكد من الرمز أو اطلب من المضيف رمزاً جديداً.', 'var(--wrong)'); return; }
  if (data.players && data.players.p1 && data.players.p1.joined) { showToast('⚠️ الغرفة ممتلئة. انتظر الجولة التالية أو اطلب غرفة جديدة.', 'var(--wrong)'); return; }
  mem.code = code; mem.role = 'p1'; mem.opponentRole = 'p0'; mem.name = name; mem.bot = false;
  try { await fb.db.ref('rooms/m'+code+'/players/p1').set({ name, score:0, joined:true }); }
  catch(e) { showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); mem.code=null; return; }
  memAttachListeners();
  memOpenScreen(); memShowStage('memLobby');
  document.getElementById('memCodeDisplay').textContent = code;
  document.getElementById('memLobbyHost').style.display = 'none';
}

function memSpectate(code, sid) {
  mem.code = code; mem.role = 'spec'; mem.opponentRole = null; mem.bot = false;
  mem.name = (loadProfile().name) || 'متفرج'; mem.oppName = ''; mem._specSid = sid;
  memAttachListeners();
  attachSpectatorCounter('m', code, mem, 'memSpectatorCount');
  memOpenScreen(); memShowStage('memLobby');
  document.getElementById('memCodeDisplay').textContent = code;
  document.getElementById('memLobbyHost').style.display = 'none';
  document.getElementById('memLobbyWait').style.display = 'block';
  document.getElementById('memLobbyWait').textContent = '👁️ أنت تشاهد — انتظر بداية الجولة';
  showToast('👁️ دخلت كمتفرج', '#6495ed');
}
function memAttachListeners() {
  memDetachListeners();
  if (mem.role !== 'spec') startRoomHeartbeat('m', mem.code);
  const playersRef = fb.db.ref('rooms/m'+mem.code+'/players');
  const stateRef = fb.db.ref('rooms/m'+mem.code+'/state');
  const onPlayers = playersRef.on('value', s => memRenderPlayers(s.val()||{}));
  const onState = stateRef.on('value', s => memOnState(s.val()||{}));
  mem.listeners = [ () => playersRef.off('value', onPlayers), () => stateRef.off('value', onState) ];
  attachSpectatorCounter('m', mem.code, mem, 'memSpectatorCount');
}
function memDetachListeners() {
  mem.listeners.forEach(off=>{ try{off();}catch(e){} });
  mem.listeners = [];
}

function memRenderPlayers(players) {
  checkOpponentLeft(mem, players);
  const p0 = players.p0 || {}; const p1 = players.p1 || {};
  document.getElementById('memP0Name').textContent = p0.name || 'بانتظار...';
  document.getElementById('memP1Name').textContent = p1.name || 'بانتظار...';
  mem.oppName = (mem.role==='p0' ? p1.name : p0.name) || 'الخصم';
  const r0 = document.getElementById('memP0NameBattle'); if (r0) r0.textContent = p0.name || 'أنت';
  const r1 = document.getElementById('memP1NameBattle'); if (r1) r1.textContent = p1.name || 'الخصم';
  const s0 = document.getElementById('memP0Score'); if (s0) s0.textContent = p0.score || 0;
  const s1 = document.getElementById('memP1Score'); if (s1) s1.textContent = p1.score || 0;
  if (mem.role==='spec') {
    document.getElementById('memLobbyHost').style.display = 'none';
    document.getElementById('memLobbyWait').style.display = 'block';
    document.getElementById('memLobbyWait').textContent = '👁️ أنت تشاهد — انتظر بداية الجولة';
  } else if (mem.role==='p0') {
    const ready = p0.joined && p1.joined;
    document.getElementById('memLobbyHost').style.display = ready ? 'block' : 'none';
    document.getElementById('memLobbyWait').style.display = ready ? 'none' : 'block';
    document.getElementById('memLobbyWait').textContent = ready ? '' : 'في انتظار الخصم…';
  } else {
    document.getElementById('memLobbyWait').style.display = 'block';
    document.getElementById('memLobbyWait').textContent = 'في انتظار المضيف ليبدأ اللعبة…';
  }
}

async function memStart() {
  if (mem.role !== 'p0') return;
  const deck = memBuildShuffledDeck();
  mem._lastFlipped = null; mem._localFlip = null;
  await fb.db.ref('rooms/m'+mem.code+'/state').set({ phase:'battle', turn: mem.startingTurn||'p0', deck, flipped:{}, matched:{} });
  await fb.db.ref('rooms/m'+mem.code+'/meta/status').set('active');
}

function memOnState(state) {
  const phase = state.phase;
  if (phase === 'lobby') memShowStage('memLobby');
  else if (phase === 'battle') memEnterBattle(state);
  else if (phase === 'roundEnd') memEnterRoundEnd(state);
}

function memEnterBattle(state) {
  memShowStage('memBattle');
  const isSpec = (mem.role === 'spec');
  const specBanner = document.getElementById('memSpectatorBanner');
  if (specBanner) specBanner.style.display = isSpec ? 'block' : 'none';
  const deck = state.deck || [];
  const flipped = state.flipped || {};
  const matched = state.matched || {};
  const myTurn = !isSpec && (state.turn === mem.role);
  const banner = document.getElementById('memTurnBanner');
  banner.className = 'trap-turn-banner ' + (myTurn ? 'my-turn' : 'opp-turn');
  banner.textContent = isSpec
    ? ('⏳ دور اللاعب ' + (state.turn === 'p0' ? '١' : '٢'))
    : (myTurn ? '🎯 دورك! اقلب بطاقتين' : '⏳ دور ' + (mem.oppName || 'الخصم'));
  const board = document.getElementById('memBoard'); board.innerHTML = '';
  for (let i=0; i<deck.length; i++) {
    const card = document.createElement('div'); card.className = 'mem-card'; card.dataset.idx = i;
    const inner = document.createElement('div'); inner.className = 'mem-card-inner';
    const back = document.createElement('div'); back.className = 'mem-card-back'; back.textContent = '🎴';
    const face = document.createElement('div'); face.className = 'mem-card-face'; face.textContent = deck[i];
    inner.appendChild(back); inner.appendChild(face);
    card.appendChild(inner);
    if (matched[i]) card.classList.add('matched','flipped','disabled');
    else if (flipped[i]) card.classList.add('flipped','disabled');
    else if (myTurn) card.onclick = () => memPickCard(i);
    else card.classList.add('disabled');
    board.appendChild(card);
  }
}

async function memPickCard(i) {
  if (mem.bot) { return memBotPlayerPick(i); }
  const code = mem.code; if (!code) return;
  const ssnap = await fb.db.ref('rooms/m'+code+'/state').once('value');
  const st = ssnap.val() || {};
  if (st.phase !== 'battle' || st.turn !== mem.role) return;
  const flipped = st.flipped || {}, matched = st.matched || {};
  if (flipped[i] || matched[i]) return;
  const flipKeys = Object.keys(flipped);
  if (flipKeys.length >= 2) return;
  try { soundXoPlaceX(); } catch(e){}
  await fb.db.ref('rooms/m'+code+'/state/flipped/'+i).set(true);
  if (flipKeys.length === 1) {
    const firstIdx = parseInt(flipKeys[0]);
    const isMatch = (st.deck[firstIdx] === st.deck[i]);
    setTimeout(async () => {
      const updates = {};
      if (isMatch) {
        try { soundXoWin(); } catch(e){}
        updates['state/matched/'+firstIdx] = true;
        updates['state/matched/'+i] = true;
        updates['state/flipped'] = null;
        const psnap = await fb.db.ref('rooms/m'+code+'/players/'+mem.role).once('value');
        const me = psnap.val() || {};
        updates['players/'+mem.role+'/score'] = (me.score||0) + 1;
        await fb.db.ref('rooms/m'+code).update(updates);
        const matchedAfter = (Object.keys(matched).length / 2) + 1;
        if (matchedAfter >= MEM_EMOJIS.length) {
          const pss = await fb.db.ref('rooms/m'+code+'/players').once('value');
          const ps = pss.val() || {};
          const s0 = (ps.p0||{}).score||0, s1 = (ps.p1||{}).score||0;
          const winner = s0>s1 ? 'p0' : s1>s0 ? 'p1' : 'draw';
          await fb.db.ref('rooms/m'+code+'/state').update({ phase:'roundEnd', winner });
        }
      } else {
        try { soundXoLose(); } catch(e){}
        updates['state/flipped'] = null;
        updates['state/turn'] = (mem.role==='p0') ? 'p1' : 'p0';
        await fb.db.ref('rooms/m'+code).update(updates);
      }
    }, 850);
  }
}

function memEnterRoundEnd(state) {
  memShowStage('memEnd');
  const winner = state.winner;
  let emoji, text;
  let myPairs = 0;
  try {
    const isHostRole = (mem.role === 'p0');
    myPairs = isHostRole ? ((mem.localPlayers && mem.localPlayers.p0 && mem.localPlayers.p0.score) || 0) : 0;
    if (!mem.bot) {
      const el = document.getElementById(isHostRole ? 'memP0Score' : 'memP1Score');
      if (el) myPairs = parseInt(el.textContent) || 0;
    }
  } catch(e){}
  const isSpec = (mem.role === 'spec');
  if (winner === 'draw') { emoji = '🤝'; text = 'تعادل!'; if (!isSpec) { try { soundXoDraw(); } catch(e){} try { recordGameResult('mem', { draw:true, pairs:myPairs }); } catch(e){} } }
  else if (!isSpec && winner === mem.role) { emoji = '🏆'; text = '🎉 فزت! ذاكرتك ممتازة'; try { soundXoWin(); if (typeof launchConfetti==='function') launchConfetti(); } catch(e){} try { recordGameResult('mem', { won:true, pairs:myPairs }); } catch(e){} }
  else if (isSpec) { emoji = '🏆'; text = '🎉 انتهت الجولة'; }
  else { emoji = '😔'; text = 'خسرت هذه الجولة. حظ أوفر!'; try { soundXoLose(); } catch(e){} try { recordGameResult('mem', { lost:true, pairs:myPairs }); } catch(e){} }
  document.getElementById('memEndEmoji').textContent = emoji;
  document.getElementById('memEndText').textContent = text;
  const ea = document.querySelector('#memEnd .start-btn');
  if (ea) ea.style.display = isSpec ? 'none' : '';
  if (mem.role === 'p0' || mem.bot) {
    mem.startingTurn = (winner === 'draw') ? 'p0' : ((winner === 'p0') ? 'p1' : 'p0');
  }
}

async function memPlayAgain() {
  if (mem.bot) { return memBotPlayAgain(); }
  if (mem.role !== 'p0') { showToast('⏳ في انتظار المضيف ليبدأ جولة جديدة…', 'var(--gold)'); return; }
  const psnap = await fb.db.ref('rooms/m'+mem.code+'/players').once('value');
  const players = psnap.val() || {};
  const updates = {};
  Object.keys(players).forEach(pid => { updates['players/'+pid+'/score'] = 0; });
  const deck = memBuildShuffledDeck();
  mem._lastFlipped = null;
  updates['state'] = { phase:'battle', turn: mem.startingTurn||'p0', deck, flipped:{}, matched:{} };
  await fb.db.ref('rooms/m'+mem.code).update(updates);
}

function leaveMem() {
  stopRoomHeartbeat();
  memDetachListeners();
  if (!mem.bot) {
    try {
      if (mem.code && mem.role === 'spec' && mem._specSid) fb.db.ref('rooms/m'+mem.code+'/spectators/'+mem._specSid).remove();
      else if (mem.code && mem.role === 'p0') fb.db.ref('rooms/m'+mem.code).remove();
      else if (mem.code && mem.role === 'p1') fb.db.ref('rooms/m'+mem.code+'/players/p1').remove();
    } catch(e){}
  }
  const sb = document.getElementById('memSpectatorBanner'); if (sb) sb.style.display = 'none';
  const sc = document.getElementById('memSpectatorCount'); if (sc) sc.style.display = 'none';
  mem.code = null; mem.role = null; mem.opponentRole = null;
  mem.bot = false; mem.localState = null; mem.localPlayers = null;
  mem._botSeen = {}; mem.startingTurn = 'p0'; mem._specSid = null;
  document.getElementById('memScreen').style.display = 'none';
  goToLanding();
}
function startMemBotGame() {
  const name = (document.getElementById('memHostName').value.trim()) || 'أنت';
  mem.bot = true; mem.code = null; mem.role = 'p0'; mem.opponentRole = 'p1';
  mem.name = name; mem.oppName = '🤖 الكمبيوتر'; mem.startingTurn = 'p0';
  mem._botSeen = {};
  mem.localPlayers = {
    p0: { name, score:0, joined:true },
    p1: { name:'🤖 الكمبيوتر', score:0, joined:true }
  };
  mem.localState = { phase:'battle', turn:'p0', deck: memBuildShuffledDeck(), flipped:{}, matched:{} };
  memOpenScreen();
  memRenderPlayers(mem.localPlayers);
  memEnterBattle(mem.localState);
}

function memBotPlayerPick(i) {
  const st = mem.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p0') return;
  if (st.flipped[i] || st.matched[i]) return;
  const flipKeys = Object.keys(st.flipped);
  if (flipKeys.length >= 2) return;
  st.flipped[i] = true;
  try { soundXoPlaceX(); } catch(e){}
  mem._botSeen[i] = st.deck[i];
  memEnterBattle(st);
  if (flipKeys.length === 0) return; // wait for second card
  const firstIdx = parseInt(flipKeys[0]);
  const isMatch = (st.deck[firstIdx] === st.deck[i]);
  setTimeout(() => {
    if (isMatch) {
      try { soundXoWin(); } catch(e){}
      st.matched[firstIdx] = true; st.matched[i] = true;
      st.flipped = {};
      mem.localPlayers.p0.score++;
      memRenderPlayers(mem.localPlayers);
      memEnterBattle(st);
      if (Object.keys(st.matched).length >= st.deck.length) {
        const s0 = mem.localPlayers.p0.score, s1 = mem.localPlayers.p1.score;
        st.phase='roundEnd'; st.winner = s0>s1?'p0':s1>s0?'p1':'draw';
        memEnterRoundEnd(st);
      }
    } else {
      try { soundXoLose(); } catch(e){}
      st.flipped = {};
      st.turn = 'p1';
      memEnterBattle(st);
      setTimeout(()=>memBotTakeTurn(), 800);
    }
  }, 850);
}

function memBotTakeTurn() {
  const st = mem.localState; if (!st || st.phase !== 'battle' || st.turn !== 'p1') return;
  const available = [];
  for (let i=0; i<st.deck.length; i++) if (!st.matched[i] && !st.flipped[i]) available.push(i);
  if (!available.length) return;
  const seen = mem._botSeen;
  let first = null, second = null;
  for (const i of available) {
    if (seen[i] != null) {
      for (const j of available) {
        if (j !== i && seen[j] === seen[i]) { first = i; second = j; break; }
      }
      if (first != null) break;
    }
  }
  if (first == null) {
    const unseen = available.filter(i => seen[i] == null);
    first = unseen.length ? unseen[Math.floor(Math.random()*unseen.length)] : available[Math.floor(Math.random()*available.length)];
  }
  st.flipped[first] = true;
  mem._botSeen[first] = st.deck[first];
  try { soundXoPlaceO(); } catch(e){}
  memEnterBattle(st);
  setTimeout(() => {
    if (second == null) {
      const avail2 = available.filter(i => i !== first);
      const matchKnown = avail2.find(i => mem._botSeen[i] === st.deck[first]);
      if (matchKnown != null) second = matchKnown;
      else {
        const unseen2 = avail2.filter(i => mem._botSeen[i] == null);
        second = unseen2.length ? unseen2[Math.floor(Math.random()*unseen2.length)] : avail2[Math.floor(Math.random()*avail2.length)];
      }
    }
    st.flipped[second] = true;
    mem._botSeen[second] = st.deck[second];
    try { soundXoPlaceO(); } catch(e){}
    memEnterBattle(st);
    const isMatch = st.deck[first] === st.deck[second];
    setTimeout(() => {
      if (isMatch) {
        try { soundXoWin(); } catch(e){}
        st.matched[first] = true; st.matched[second] = true;
        st.flipped = {};
        mem.localPlayers.p1.score++;
        memRenderPlayers(mem.localPlayers);
        memEnterBattle(st);
        if (Object.keys(st.matched).length >= st.deck.length) {
          const s0 = mem.localPlayers.p0.score, s1 = mem.localPlayers.p1.score;
          st.phase='roundEnd'; st.winner = s0>s1?'p0':s1>s0?'p1':'draw';
          memEnterRoundEnd(st);
          return;
        }
        setTimeout(()=>memBotTakeTurn(), 800);
      } else {
        try { soundXoLose(); } catch(e){}
        st.flipped = {};
        st.turn = 'p0';
        memEnterBattle(st);
      }
    }, 900);
  }, 700);
}

function memBotPlayAgain() {
  const next = (mem.localState && mem.localState.winner === 'p0') ? 'p1' : 'p0';
  mem.localPlayers.p0.score = 0; mem.localPlayers.p1.score = 0;
  mem._botSeen = {};
  mem.localState = { phase:'battle', turn:next, deck: memBuildShuffledDeck(), flipped:{}, matched:{} };
  memRenderPlayers(mem.localPlayers);
  memEnterBattle(mem.localState);
  if (next === 'p1') setTimeout(()=>memBotTakeTurn(), 700);
}
const DEFUSE_TIMER_SECS = 90;
const DEFUSE_WIRE_COLORS = ['red','blue','yellow','white','black'];
const DEFUSE_WIRE_NAMES = { red:'أحمر', blue:'أزرق', yellow:'أصفر', white:'أبيض', black:'أسود' };
const DEFUSE_SERIAL_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
let defuse = {
  code:null, role:null, opponentRole:null, name:null, oppName:'الخصم',
  listeners:[], localTimerInt:null,
  bot:false, localState:null, localPlayers:null,
  scoreOK:0, scoreBoom:0,
  _lastRound:-1
};

function defuseShowStage(stage) {
  ['defuseLobby','defuseBattle','defuseEnd'].forEach(id => {
    document.getElementById(id).style.display = (id===stage) ? 'block' : 'none';
  });
}
function defuseOpenScreen() {
  ['landingScreen','setupScreen','gameScreen','onlineScreen','adminScreen','trapScreen','xoScreen','c4Screen','memScreen'].forEach(id=>{
    const e = document.getElementById(id); if (e) e.style.display='none';
  });
  document.getElementById('defuseScreen').style.display = 'block';
}
function copyDefuseCode() {
  const code = defuse.code || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  showToast('📋 تم نسخ الرمز: '+code, 'var(--gold)');
}
function defuseGenerateBomb() {
  const n = 4 + Math.floor(Math.random() * 3); // 4-6 wires
  const wires = [];
  for (let i = 0; i < n; i++) {
    wires.push(DEFUSE_WIRE_COLORS[Math.floor(Math.random()*DEFUSE_WIRE_COLORS.length)]);
  }
  const L = DEFUSE_SERIAL_LETTERS;
  const serial = L[Math.floor(Math.random()*L.length)]
               + L[Math.floor(Math.random()*L.length)]
               + Math.floor(Math.random()*10)
               + Math.floor(Math.random()*10);
  const batteries = 1 + Math.floor(Math.random() * 4); // 1-4
  return { wires, serial, batteries };
}
function defuseFindCorrectWire(bomb) {
  const wires = bomb.wires;
  const n = wires.length;
  const reds = []; const blues = []; const yellows = []; const blacks = []; const whites = [];
  wires.forEach((c, i) => {
    if (c === 'red') reds.push(i);
    else if (c === 'blue') blues.push(i);
    else if (c === 'yellow') yellows.push(i);
    else if (c === 'black') blacks.push(i);
    else if (c === 'white') whites.push(i);
  });
  const lastDigit = parseInt(bomb.serial[bomb.serial.length-1]);
  if (reds.length === 0) return 1;
  if (wires[n-1] === 'white' && whites.length > 0) return whites[whites.length-1];
  if (blues.length > 1) return blues[blues.length-1];
  if (lastDigit % 2 === 0 && blacks.length > 0) return blacks[0];
  if (bomb.batteries > 2) return 0;
  return n - 1;
}

async function createDefuseRoom() {
  const botEl = document.getElementById('defuseBotMode');
  if (botEl && botEl.checked) { return startDefuseBotGame(); }
  if (!ensureFirebase()) return;
  const name = (document.getElementById('defuseHostName').value.trim()) || 'المضيف';
  const code = genCode();
  defuse.code = code; defuse.role = 'p0'; defuse.opponentRole = 'p1';
  defuse.name = name; defuse.bot = false; defuse.scoreOK = 0; defuse.scoreBoom = 0; defuse._lastRound = -1;
  try {
    await fb.db.ref('rooms/d'+code).set({
      meta:{ hostName:name, status:'lobby', createdAt: firebase.database.ServerValue.TIMESTAMP },
      players:{ p0:{ name, joined:true } },
      state:{ phase:'lobby', scoreOK:0, scoreBoom:0 }
    });
  } catch(e) {
    showToast('⚠️ تعذّر إنشاء الغرفة: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
    defuse.code = null; return;
  }
  defuseAttachListeners();
  defuseOpenScreen(); defuseShowStage('defuseLobby');
  document.getElementById('defuseCodeDisplay').textContent = code;
  document.getElementById('defuseLobbyHost').style.display = 'block';
}

async function joinDefuseRoom() {
  if (!ensureFirebase()) return;
  const name = (document.getElementById('defuseJoinName').value.trim()) || 'الخصم';
  const code = (document.getElementById('defuseJoinCode').value.trim());
  if (!/^\d{6}$/.test(code)) { showToast('⚠️ رمز الغرفة يتكون من ٦ أرقام بالضبط.', 'var(--wrong)'); return; }
  let data;
  try { const snap = await fb.db.ref('rooms/d'+code).once('value'); data = snap.val(); }
  catch(e) { showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); return; }
  if (!data) { showToast('⚠️ الغرفة غير موجودة. تأكد من الرمز أو اطلب من المضيف رمزاً جديداً.', 'var(--wrong)'); return; }
  if (data.players && data.players.p1 && data.players.p1.joined) { showToast('⚠️ الغرفة ممتلئة. انتظر الجولة التالية أو اطلب غرفة جديدة.', 'var(--wrong)'); return; }
  defuse.code = code; defuse.role = 'p1'; defuse.opponentRole = 'p0'; defuse.name = name; defuse.bot = false;
  defuse.scoreOK = 0; defuse.scoreBoom = 0; defuse._lastRound = -1;
  try { await fb.db.ref('rooms/d'+code+'/players/p1').set({ name, joined:true }); }
  catch(e) { showToast('⚠️ مشكلة في الاتصال — تحقق من الإنترنت ثم أعد المحاولة', 'var(--wrong)'); defuse.code=null; return; }
  defuseAttachListeners();
  defuseOpenScreen(); defuseShowStage('defuseLobby');
  document.getElementById('defuseCodeDisplay').textContent = code;
  document.getElementById('defuseLobbyHost').style.display = 'none';
}

function defuseAttachListeners() {
  defuseDetachListeners();
  startRoomHeartbeat('d', defuse.code);
  const playersRef = fb.db.ref('rooms/d'+defuse.code+'/players');
  const stateRef = fb.db.ref('rooms/d'+defuse.code+'/state');
  const onPlayers = playersRef.on('value', s => defuseRenderPlayers(s.val()||{}));
  const onState = stateRef.on('value', s => defuseOnState(s.val()||{}));
  defuse.listeners = [ () => playersRef.off('value', onPlayers), () => stateRef.off('value', onState) ];
}
function defuseDetachListeners() {
  defuse.listeners.forEach(off=>{ try{off();}catch(e){} });
  defuse.listeners = [];
  clearInterval(defuse.localTimerInt);
}

function defuseRenderPlayers(players) {
  checkOpponentLeft(defuse, players);
  const p0 = players.p0 || {}; const p1 = players.p1 || {};
  document.getElementById('defuseP0Name').textContent = p0.name || 'بانتظار...';
  document.getElementById('defuseP1Name').textContent = p1.name || 'بانتظار...';
  defuse.oppName = (defuse.role==='p0' ? p1.name : p0.name) || 'الخصم';
  if (defuse.role==='p0') {
    const ready = p0.joined && p1.joined;
    document.getElementById('defuseLobbyHost').style.display = ready ? 'block' : 'none';
    document.getElementById('defuseLobbyWait').style.display = ready ? 'none' : 'block';
    document.getElementById('defuseLobbyWait').textContent = ready ? '' : 'في انتظار الخصم…';
  } else {
    document.getElementById('defuseLobbyWait').style.display = 'block';
    document.getElementById('defuseLobbyWait').textContent = 'في انتظار المضيف ليبدأ اللعبة…';
  }
}

async function defuseStart() {
  if (defuse.role !== 'p0') return;
  const bomb = defuseGenerateBomb();
  const correct = defuseFindCorrectWire(bomb);
  const defuserRole = Math.random() < 0.5 ? 'p0' : 'p1';
  await fb.db.ref('rooms/d'+defuse.code+'/state').set({
    phase:'battle', round:1,
    bomb, correct,
    defuserRole,
    startedAt: firebase.database.ServerValue.TIMESTAMP,
    scoreOK:0, scoreBoom:0
  });
  await fb.db.ref('rooms/d'+defuse.code+'/meta/status').set('active');
}

function defuseOnState(state) {
  const phase = state.phase;
  if (phase === 'lobby') { defuseShowStage('defuseLobby'); clearInterval(defuse.localTimerInt); }
  else if (phase === 'battle') defuseEnterBattle(state);
  else if (phase === 'roundEnd') defuseEnterRoundEnd(state);
}

function defuseRenderBomb(bomb, amDefuser) {
  document.getElementById('defuseSerial').textContent = bomb.serial;
  let batt = '';
  for (let i=0; i<bomb.batteries; i++) batt += '⚡';
  document.getElementById('defuseBatteries').textContent = batt;
  const wiresEl = document.getElementById('defuseWires'); wiresEl.innerHTML = '';
  bomb.wires.forEach((color, idx) => {
    const w = document.createElement('div'); w.className = 'defuse-wire';
    const num = document.createElement('span'); num.className = 'defuse-wire-num'; num.textContent = (idx+1);
    const line = document.createElement('div'); line.className = 'defuse-wire-line dw-' + color;
    const btn = document.createElement('button'); btn.className = 'defuse-cut-btn'; btn.textContent = '✂️ اقطع';
    if (amDefuser) btn.onclick = () => defuseCutWire(idx);
    else btn.disabled = true;
    w.appendChild(num); w.appendChild(line); w.appendChild(btn);
    wiresEl.appendChild(w);
  });
}

function defuseStartCountdown(startedAt, durationSecs) {
  clearInterval(defuse.localTimerInt);
  const tEl = document.getElementById('defuseTime');
  const box = tEl.parentElement;
  const tick = () => {
    const now = Date.now();
    const elapsed = Math.floor((now - startedAt) / 1000);
    const left = Math.max(0, durationSecs - elapsed);
    tEl.textContent = left;
    if (left <= 10) box.classList.add('low'); else box.classList.remove('low');
    if (left <= 0) {
      clearInterval(defuse.localTimerInt);
      defuseTimeOut();
    }
  };
  tick();
  defuse.localTimerInt = setInterval(tick, 250);
}

function defuseEnterBattle(state) {
  defuseShowStage('defuseBattle');
  defuse.scoreOK = state.scoreOK || 0; defuse.scoreBoom = state.scoreBoom || 0;
  document.getElementById('defuseScoreOK').textContent = defuse.scoreOK;
  document.getElementById('defuseScoreBoom').textContent = defuse.scoreBoom;
  const amDefuser = (state.defuserRole === defuse.role);
  const banner = document.getElementById('defuseRoleBanner');
  banner.className = 'defuse-role-banner' + (amDefuser ? '' : ' expert');
  banner.textContent = amDefuser ? '🧨 أنت المُفكِّك — افحص الأسلاك' : '📖 أنت الخبير — اقرأ الدليل';
  document.getElementById('defuseDefuserView').style.display = amDefuser ? 'block' : 'none';
  document.getElementById('defuseExpertView').style.display = amDefuser ? 'none' : 'block';
  document.getElementById('defuseSoloView').style.display = 'none';
  if (amDefuser) defuseRenderBomb(state.bomb, true);
  const startedAt = (typeof state.startedAt === 'number') ? state.startedAt : Date.now();
  defuseStartCountdown(startedAt, DEFUSE_TIMER_SECS);
}

async function defuseCutWire(idx) {
  if (defuse.bot) { return defuseBotCutWire(idx); }
  const code = defuse.code; if (!code) return;
  const ssnap = await fb.db.ref('rooms/d'+code+'/state').once('value');
  const st = ssnap.val() || {};
  if (st.phase !== 'battle' || st.defuserRole !== defuse.role) return;
  const correct = (idx === st.correct);
  const updates = {};
  updates['state/phase'] = 'roundEnd';
  updates['state/result'] = correct ? 'defused' : 'boom';
  updates['state/cutIdx'] = idx;
  if (correct) updates['state/scoreOK'] = (st.scoreOK||0) + 1;
  else updates['state/scoreBoom'] = (st.scoreBoom||0) + 1;
  await fb.db.ref('rooms/d'+code).update(updates);
}

async function defuseTimeOut() {
  if (defuse.bot) { return defuseBotTimeout(); }
  if (defuse.role !== 'p0') return; // only host pushes timeout
  const code = defuse.code; if (!code) return;
  const ssnap = await fb.db.ref('rooms/d'+code+'/state').once('value');
  const st = ssnap.val() || {};
  if (st.phase !== 'battle') return; // already ended
  await fb.db.ref('rooms/d'+code).update({
    'state/phase':'roundEnd',
    'state/result':'timeout',
    'state/scoreBoom': (st.scoreBoom||0) + 1
  });
}

function defuseEnterRoundEnd(state) {
  clearInterval(defuse.localTimerInt);
  defuseShowStage('defuseEnd');
  const result = state.result;
  let emoji, text, reveal = '';
  if (result === 'defused') {
    emoji = '🎉'; text = '✅ تم تفكيك القنبلة بنجاح!';
    try { soundTrapWin(); if (typeof launchConfetti==='function') launchConfetti(); } catch(e){}
    try { recordGameResult('defuse', { defused:true }); } catch(e){}
  } else if (result === 'boom') {
    emoji = '💥'; text = '💣 انفجرت! قطعتم السلك الخاطئ';
    try { soundTrapBoom(); if (typeof trapPlayBoomEffect === 'function') trapPlayBoomEffect(); } catch(e){}
    try { recordGameResult('defuse', { exploded:true }); } catch(e){}
    if (state.bomb && typeof state.correct === 'number') {
      reveal = 'السلك الصحيح كان: ' + (state.correct+1) + ' (' + (DEFUSE_WIRE_NAMES[state.bomb.wires[state.correct]] || '') + ')';
    }
  } else if (result === 'timeout') {
    emoji = '⏰'; text = '💥 انتهى الوقت! القنبلة انفجرت';
    try { soundTrapLose(); if (typeof trapPlayBoomEffect === 'function') trapPlayBoomEffect(); } catch(e){}
    try { recordGameResult('defuse', { exploded:true }); } catch(e){}
    if (state.bomb && typeof state.correct === 'number') {
      reveal = 'السلك الصحيح كان: ' + (state.correct+1) + ' (' + (DEFUSE_WIRE_NAMES[state.bomb.wires[state.correct]] || '') + ')';
    }
  }
  document.getElementById('defuseEndEmoji').textContent = emoji;
  document.getElementById('defuseEndText').textContent = text;
  document.getElementById('defuseEndReveal').textContent = reveal;
  const btn = document.getElementById('defuseRematchBtn');
  const wait = document.getElementById('defuseRematchWait');
  const canTrigger = defuse.bot || defuse.role === 'p0';
  btn.style.display = canTrigger ? 'inline-block' : 'none';
  wait.style.display = canTrigger ? 'none' : 'inline-block';
}

async function defusePlayAgain() {
  if (defuse.bot) { return defuseBotPlayAgain(); }
  if (defuse.role !== 'p0') { showToast('⏳ في انتظار المضيف…', 'var(--gold)'); return; }
  const ssnap = await fb.db.ref('rooms/d'+defuse.code+'/state').once('value');
  const st = ssnap.val() || {};
  const bomb = defuseGenerateBomb();
  const correct = defuseFindCorrectWire(bomb);
  const newDefuser = (st.defuserRole === 'p0') ? 'p1' : 'p0';
  await fb.db.ref('rooms/d'+defuse.code+'/state').set({
    phase:'battle', round:(st.round||1)+1,
    bomb, correct,
    defuserRole: newDefuser,
    startedAt: firebase.database.ServerValue.TIMESTAMP,
    scoreOK: st.scoreOK||0,
    scoreBoom: st.scoreBoom||0
  });
}

function leaveDefuse() {
  stopRoomHeartbeat();
  defuseDetachListeners();
  if (!defuse.bot) {
    try {
      if (defuse.code && defuse.role === 'p0') fb.db.ref('rooms/d'+defuse.code).remove();
      else if (defuse.code && defuse.role === 'p1') fb.db.ref('rooms/d'+defuse.code+'/players/p1').remove();
    } catch(e){}
  }
  defuse.code = null; defuse.role = null; defuse.opponentRole = null;
  defuse.bot = false; defuse.localState = null; defuse.localPlayers = null;
  defuse.scoreOK = 0; defuse.scoreBoom = 0;
  document.getElementById('defuseScreen').style.display = 'none';
  goToLanding();
}
function startDefuseBotGame() {
  const name = (document.getElementById('defuseHostName').value.trim()) || 'أنت';
  defuse.bot = true; defuse.code = null; defuse.role = 'p0'; defuse.opponentRole = 'p1';
  defuse.name = name; defuse.oppName = '🧠 الحل';
  defuse.scoreOK = 0; defuse.scoreBoom = 0;
  const bomb = defuseGenerateBomb();
  defuse.localState = { bomb, correct: defuseFindCorrectWire(bomb), startedAt: Date.now() };
  defuseOpenScreen();
  defuseShowStage('defuseBattle');
  defuseSoloRender();
}

function defuseSoloRender() {
  document.getElementById('defuseScoreOK').textContent = defuse.scoreOK;
  document.getElementById('defuseScoreBoom').textContent = defuse.scoreBoom;
  const banner = document.getElementById('defuseRoleBanner');
  banner.className = 'defuse-role-banner';
  banner.textContent = '🧠 حل اللغز بنفسك';
  document.getElementById('defuseDefuserView').style.display = 'block';
  document.getElementById('defuseExpertView').style.display = 'block';
  document.getElementById('defuseSoloView').style.display = 'block';
  defuseRenderBomb(defuse.localState.bomb, true);
  defuseStartCountdown(defuse.localState.startedAt, DEFUSE_TIMER_SECS);
}

function defuseBotCutWire(idx) {
  const st = defuse.localState; if (!st) return;
  const correct = (idx === st.correct);
  clearInterval(defuse.localTimerInt);
  st.result = correct ? 'defused' : 'boom';
  if (correct) defuse.scoreOK++;
  else defuse.scoreBoom++;
  defuseEnterRoundEnd(st);
}

function defuseBotTimeout() {
  const st = defuse.localState; if (!st) return;
  clearInterval(defuse.localTimerInt);
  if (st.result) return; // already ended
  st.result = 'timeout';
  defuse.scoreBoom++;
  defuseEnterRoundEnd(st);
}

function defuseBotPlayAgain() {
  const bomb = defuseGenerateBomb();
  defuse.localState = { bomb, correct: defuseFindCorrectWire(bomb), startedAt: Date.now() };
  defuseShowStage('defuseBattle');
  defuseSoloRender();
}
const ONLINE_SESSION_KEY = 'quizOnlineSession';

function saveOnlineSession() {
  try {
    const s = { code:online.code, playerId:online.playerId, name:online.name, avatar:online.avatar, isHost:online.isHost, count:online.count, timer:online.timer, subMode:online.subMode, teamNames:online.teamNames, team:online.team, startingTeam:online.startingTeam, ts:Date.now() };
    if (online.isHost) { s.questions = online.questions; s.qIndex = online.qIndex; }
    localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify(s));
  } catch(e){}
}
function clearOnlineSession() { try { localStorage.removeItem(ONLINE_SESSION_KEY); } catch(e){} }
function getOnlineSession() {
  try {
    const s = JSON.parse(localStorage.getItem(ONLINE_SESSION_KEY)||'null');
    if (!s || !s.code || !s.playerId) return null;
    if (Date.now() - (s.ts||0) > 3*3600*1000) return null;
    return s;
  } catch(e){ return null; }
}
function dismissOnlineRejoin() {
  clearOnlineSession();
  const b = document.getElementById('onlineRejoinBanner'); if (b) b.style.display='none';
}

async function rejoinRoom() {
  const s = getOnlineSession(); if (!s) { dismissOnlineRejoin(); return; }
  if (!ensureFirebase()) return;
  let metaSnap;
  try { metaSnap = await fb.db.ref('rooms/'+s.code+'/meta').once('value'); } catch(e){ showToast('⚠️ تعذّر الاتصال', 'var(--wrong)'); return; }
  if (!metaSnap.exists()) { showToast('⚠️ الغرفة لم تعد موجودة', 'var(--wrong)'); dismissOnlineRejoin(); return; }
  const meta = metaSnap.val();
  const sub = s.subMode || meta.mode || 'classic';
  Object.assign(online, { code:s.code, playerId:s.playerId, name:s.name, avatar:s.avatar||'🦁', isHost:!!s.isHost, count:s.count||meta.count||0, timer:s.timer||meta.timer||15, subMode:sub, teamNames: s.teamNames || meta.teamNames || online.teamNames, team: s.team!=null?s.team:null, startingTeam: s.startingTeam||0, myLifelines:{l50:false,llucky:false,lfriend:false,jdouble:false}, jokerActive:false });
  if (s.isHost) { online.questions = s.questions||[]; online.qIndex = s.qIndex||0; }
  const pRef = fb.db.ref('rooms/'+s.code+'/players/'+s.playerId);
  const pSnap = await pRef.once('value');
  if (!pSnap.exists()) await pRef.set({ name:online.name, avatar:online.avatar, score:0, joinedAt:firebase.database.ServerValue.TIMESTAMP });
  attachRoomListeners(s.code);
  enterOnlineScreen();
  document.getElementById('roomCodeDisplay').textContent = s.code;
  document.getElementById('lobbyHostControls').style.display = s.isHost ? 'block' : 'none';
  document.getElementById('lobbyWaitNote').style.display = s.isHost ? 'none' : 'block';
  const b = document.getElementById('onlineRejoinBanner'); if (b) b.style.display='none';
  showToast('🔁 عُدت إلى غرفتك', 'var(--correct)');
  if (s.isHost && meta.status==='active' && online.questions.length) hostBroadcastQuestion(online.qIndex||0);
}
let aqAns = 0;

function loadRemoteQuestions() {
  if (!fbReady()) return;
  fb.db.ref('questions').once('value').then(snap=>{
    const v = snap.val() || {}; let added = 0;
    Object.keys(v).forEach(id=>{
      const q = v[id];
      if (q && q.q && Array.isArray(q.opts) && q.opts.length===3 && typeof q.ans==='number' && q.ans>=0 && q.ans<3 && catLabels[q.cat]) {
        allQuestions.push({ cat:q.cat, q:q.q, opts:q.opts.slice(0,3), ans:q.ans, exp:q.exp||'سؤال مُضاف.', diff:q.diff||'medium', img:q.img||'' });
        added++;
      }
    });
    if (added) { try { updateAvailNote(); } catch(e){} }
  }).catch(()=>{});
}
const INFO_MODAL_CONTENT = {
  about: `
    <h2>ℹ️ عن ونيس</h2>
    <p>منصة ألعاب عربية تفاعلية تجمع <strong>ست ألعاب مختلفة</strong> في موقع واحد، تشتغل من المتصفح بدون تنزيل أي تطبيق.</p>
    <hr class="info-divider">
    <p><strong>الألعاب المتوفرة:</strong></p>
    <ul>
      <li>🧠 <strong>لعبة الأسئلة</strong> — ١١٩٠ سؤال في ١٢ فئة بمستويات صعوبة متعددة (سهل، متوسط، صعب، صعب جداً)</li>
      <li>💣 <strong>لعبة الفخ</strong> — خبّئ ٣ قنابل في لوحة خصمك، وتجنّب قنابله!</li>
      <li>🎮 <strong>XO</strong> — الكلاسيكية ٣×٣ مع بوت ذكي</li>
      <li>🔴🟡 <strong>أربعة في صف</strong> — أسقط ٤ متتاليات قبل خصمك — أفقياً أو رأسياً أو قطرياً</li>
      <li>🃏 <strong>الذاكرة</strong> — اعثر على ٨ أزواج قبل خصمك</li>
      <li>🧨 <strong>إبطال القنبلة</strong> — تعاون أنت وخصمك لإبطال القنبلة قبل انفجارها (لعبة معلومات غير متماثلة)</li>
    </ul>
    <hr class="info-divider">
    <p><strong>المميزات:</strong></p>
    <div>
      <span class="info-pill">٧ مظاهر</span>
      <span class="info-pill">دعم RTL كامل</span>
      <span class="info-pill">PWA - يثبّت كتطبيق</span>
      <span class="info-pill">يعمل أوفلاين</span>
      <span class="info-pill">ملف لاعب وإحصائيات</span>
      <span class="info-pill">١٢ إنجاز</span>
      <span class="info-pill">لوحات صدارة أسبوعية</span>
      <span class="info-pill">روابط دعوة</span>
      <span class="info-pill">أصوات ومؤثرات</span>
    </div>
    <div class="info-credit">
      صُنع بـ ❤️ من <strong style="color:var(--gold)">DALMOO3 DIGITAL PRODUCTS</strong>
    </div>
  `,
  privacy: `
    <h2>🔒 سياسة الخصوصية</h2>
    <p><strong>نحترم خصوصيتك تماماً.</strong> هذي اللعبة لا تجمع أي بيانات شخصية ولا تستخدم أي خدمات إعلانات أو تتبّع.</p>
    <hr class="info-divider">
    <p><strong>ما يُحفظ في جوالك:</strong></p>
    <ul>
      <li>اسمك، أفاتارك، إحصائياتك الشخصية، والإنجازات</li>
      <li>تفضيل المظهر (داكن، فاتح، إلخ)</li>
      <li>إعداد كتم الصوت</li>
      <li>آخر لعبة لم تكتمل (للاستئناف)</li>
    </ul>
    <p>كل هذي البيانات محفوظة <strong>على جهازك فقط</strong> ولا ترسل لأي جهة. تقدر تمسحها بزر "مسح الإحصائيات" في الملف الشخصي.</p>
    <hr class="info-divider">
    <p><strong>ما يُرسل عند اللعب الأونلاين فقط:</strong></p>
    <ul>
      <li>اسمك المعروض (اللي اخترته)، رمز الغرفة، حالة اللعبة (نقاط، أدوار)</li>
      <li>الغرف تحذف تلقائياً عند خروج اللاعبين</li>
      <li>لوحات الصدارة تتجدد كل أسبوع</li>
      <li><strong>لا توجد بيانات حقيقية</strong> (لا إيميل، لا رقم جوال، لا موقع جغرافي)</li>
    </ul>
    <hr class="info-divider">
    <p><strong>لا نستخدم أي أدوات تتبّع أو تحليلات.</strong> لا إعلانات. لا cookies تتبّعيّة.</p>
    <div class="info-credit">آخر تحديث: ٢٠٢٦</div>
  `
};
function showInfoModal(which) {
  const content = INFO_MODAL_CONTENT[which]; if (!content) return;
  document.getElementById('infoModalContent').innerHTML = content;
  document.getElementById('infoModalOverlay').style.display = 'flex';
}
function closeInfoModal() {
  document.getElementById('infoModalOverlay').style.display = 'none';
}
