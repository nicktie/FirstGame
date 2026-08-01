const PLAYER_TEMPLATES = [
  {cls:'p0', color:'#6495ed', name:'اللاعب ١', avatar:'🦁', defaultName:'اللاعب ١'},
  {cls:'p1', color:'#e07050', name:'اللاعب ٢', avatar:'🦊', defaultName:'اللاعب ٢'},
  {cls:'p2', color:'#a070e0', name:'اللاعب ٣', avatar:'🦅', defaultName:'اللاعب ٣'},
  {cls:'p3', color:'#3dba7a', name:'اللاعب ٤', avatar:'🐯', defaultName:'اللاعب ٤'},
  {cls:'p4', color:'#d4b800', name:'اللاعب ٥', avatar:'🦁', defaultName:'اللاعب ٥'},
  {cls:'p5', color:'#e060a0', name:'اللاعب ٦', avatar:'🦋', defaultName:'اللاعب ٦'},
];
const AVATARS = ['🦁','🦊','🦅','🐯','🦄','🦋'];

let playerCount = 3;   // current number of players (1-6)
let PLAYERS = [];       // built dynamically at game start
const catLabels = {
  general:  {label:'💡 معلومات عامة', cls:'cat-general'},
  religion: {label:'☪️ دينية',        cls:'cat-religion'},
  geography:{label:'🗺️ جغرافيا',     cls:'cat-geography'},
  science:  {label:'🔬 علوم وتقنية', cls:'cat-science'},
  history:  {label:'📜 تاريخ',        cls:'cat-history'},
  sports:   {label:'⚽ رياضة',        cls:'cat-sports'},
  arts:     {label:'🎨 ثقافة وفنون', cls:'cat-arts'},
  saudi:    {label:'🇸🇦 السعودية',    cls:'cat-saudi'},
  movies:    {label:'🎬 أفلام ومسلسلات', cls:'cat-movies'},
  health:    {label:'🩺 صحة وطب',       cls:'cat-health'},
  physio:    {label:'🦴 العلاج الطبيعي', cls:'cat-physio'},
  nutrition: {label:'🥗 التغذية الصحية', cls:'cat-nutrition'},
  gaming:    {label:'🎮 ألعاب إلكترونية', cls:'cat-gaming'},
};
let allQuestions = [];
let _questionsLoaded = false;
let _questionsLoadPromise = null;
async function ensureQuestions() {
  if (_questionsLoaded) return allQuestions;
  if (_questionsLoadPromise) return _questionsLoadPromise;
  _questionsLoadPromise = (async () => {
    try {
      const res = await fetch('questions.json', { cache:'force-cache' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      allQuestions = data;
      _questionsLoaded = true;
      assignDifficulties();
      return allQuestions;
    } catch(e) {
      console.error('Failed to load questions.json:', e);
      try { showToast('⚠️ تعذّر تحميل بنك الأسئلة', 'var(--wrong)'); } catch(_){}
      _questionsLoadPromise = null;
      return [];
    }
  })();
  return _questionsLoadPromise;
}
window.addEventListener('load', () => setTimeout(() => { ensureQuestions(); }, 1500));
function assignDifficulties() {
const TARGET = { easy: 0.10, medium: 0.30, hard: 0.40, veryhard: 0.20 };
  const easyHints=['كم عدد ألوان','كم عدد أركان','ما هو أطول نهر','ما هي عاصمة المملكة','ما هو أكبر كوكب','ما هو العنصر الكيميائي الذي رمزه "O"','كم عدد لاعبي كرة القدم','كم عدد سور القرآن','في أي شهر نزل','كم عدد الصلوات','ما هي عاصمة فرنسا','ما هي عاصمة اليابان','كم عدد أيام السنة','من رسم لوحة الموناليزا','ما هو الجهاز الذي يضخ','كم عدد ساعات اليوم','ما هي أكبر قارات','ما هو أعلى جبل','ما هي أصغر دولة','كم عدد اللاعبين في فريق كرة السلة','ما هو أكبر محيطات','من هو مخترع الهاتف','ما هو أسرع حيوان','كم عدد أضلاع'];
  const hardHints=['ما هو اسم أول هاتف','في أي سنة هجرية','ما هي الشبكة التي ربطت','كم مرة وردت كلمة','ما هو اسم والد النبي إبراهيم','كم طول ملعب التنس','أي مدينة كانت عاصمة الخلافة','ما هو اسم أول دستور','في أي سنة أُسّست دار الأوبرا','من ألّف سيمفونية','ما هي أطول حدود','ما هو أعمق بحيرة','ما هي الدولة التي تضم أكبر عدد','ما هو اسم أشهر مسرح أوبرا','كم استغرق نزول القرآن الكريم','ما هو اسم قبلة المسلمين الأولى','في أي عام سقطت الخلافة'];
  allQuestions.forEach(q=>{
    if (q.diff) return;
    if (easyHints.some(e=>q.q.startsWith(e))) q.diff='easy';
    else if (hardHints.some(h=>q.q.startsWith(h))) q.diff='hard';
  });
  const byCat = {};
  allQuestions.forEach(q => { if (q.cat !== 'custom') (byCat[q.cat] = byCat[q.cat]||[]).push(q); });
  Object.keys(byCat).forEach(cat => {
    const cqs = byCat[cat];
    const total = cqs.length;
    const tg = {
      easy:     Math.round(total * TARGET.easy),
      medium:   Math.round(total * TARGET.medium),
      hard:     Math.round(total * TARGET.hard),
      veryhard: Math.round(total * TARGET.veryhard)
    };
    const sumT = tg.easy + tg.medium + tg.hard + tg.veryhard;
    if (sumT !== total) tg.medium += (total - sumT);
    const have = { easy:0, medium:0, hard:0, veryhard:0 };
    cqs.forEach(q => { if (q.diff) have[q.diff] = (have[q.diff]||0) + 1; });
    const need = {
      easy:     Math.max(0, tg.easy - have.easy),
      medium:   Math.max(0, tg.medium - have.medium),
      hard:     Math.max(0, tg.hard - have.hard),
      veryhard: Math.max(0, tg.veryhard - have.veryhard)
    };
    const unmarked = cqs.filter(q => !q.diff);
    const queue = [];
    ['easy','medium','hard','veryhard'].forEach(d => { for (let i=0;i<need[d];i++) queue.push(d); });
    while (queue.length < unmarked.length) queue.push('medium');
    while (queue.length > unmarked.length) queue.pop(); // trim from end (drops veryhard slots first if over-allocated)
    const interleaved = [];
    const buckets = { easy:[], medium:[], hard:[], veryhard:[] };
    queue.forEach(d => buckets[d].push(d));
    const order = ['hard','medium','veryhard','easy','medium','hard','medium','veryhard'];
    let oi = 0;
    while (interleaved.length < queue.length) {
      const d = order[oi % order.length]; oi++;
      if (buckets[d].length) interleaved.push(buckets[d].pop());
      else for (const dd of ['hard','medium','veryhard','easy']) {
        if (buckets[dd].length) { interleaved.push(buckets[dd].pop()); break; }
      }
    }
    unmarked.forEach((q, i) => { q.diff = interleaved[i] || 'medium'; });
  });
}
let selectedCats = new Set(['all']);   // 'all' is exclusive; otherwise one or more category keys
let selectedCount = 5;

function getCatPool() {
  return selectedCats.has('all') ? allQuestions : allQuestions.filter(q => selectedCats.has(q.cat));
}
function selectedCatLabel() {
  if (selectedCats.has('all')) return 'الكل';
  if (selectedCats.size === 1) { const [c] = selectedCats; return (catLabels[c] && catLabels[c].label) || c; }
  return selectedCats.size + ' فئات مختارة';
}
function selectedCatKey() {
  if (selectedCats.has('all')) return 'all';
  if (selectedCats.size === 1) { const [c] = selectedCats; return c; }
  return 'mixed';
}
function refreshCatTabs() {
  document.querySelectorAll('.cat-tab').forEach(t => {
    const m = (t.getAttribute('onclick')||'').match(/setCat\('(\w+)'/);
    const key = m ? m[1] : '';
    t.classList.toggle('active', selectedCats.has(key));
  });
}
let gameMode = 'solo';   // 'solo' = individual players, 'teams' = two teams
let useRandomOrder = false;
let allowSkip = false;
let questions = [];
let qIndex = 0;
let answeredCount = 0;
let turnIndex = 0;
let turnOrder = [];
let soloQueue = [];
let answers = [];
let scores = [];
const POINTS = 10;

function changePlayerCount(delta) {
  playerCount = Math.max(1, Math.min(6, playerCount + delta));
  document.getElementById('pcDisplay').textContent = playerCount;
  document.getElementById('pcMinus').disabled = playerCount <= 1;
  document.getElementById('pcPlus').disabled = playerCount >= 6;
  renderPlayerSetup();
  updatePointsNote();
}

function renderPlayerSetup() {
  const container = document.getElementById('playersSetup');
  container.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const t = PLAYER_TEMPLATES[i];

    const card = document.createElement('div');
    card.className = 'player-setup-card ' + t.cls;
    card.style.borderColor = t.color + '55';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'player-avatar-big';
    avatarDiv.style.background = t.color + '18';
    avatarDiv.textContent = AVATARS[i];
    avatarDiv.title = 'اضغط لتغيير الرمز';
    avatarDiv.style.cursor = 'pointer';
    avatarDiv.dataset.idx = i;
    avatarDiv.addEventListener('click', () => openEmojiPicker(parseInt(avatarDiv.dataset.idx)));

    const input = document.createElement('input');
    input.className = 'player-name-input';
    input.id = 'name' + i;
    input.type = 'text';
    input.placeholder = t.defaultName;
    input.value = t.defaultName;
    input.maxLength = 16;
    input.style.borderColor = t.color + '33';
    input.addEventListener('focus', () => { input.style.borderColor = t.color; });
    input.addEventListener('blur',  () => { input.style.borderColor = t.color + '33'; });
    input.addEventListener('input', () => {
      const idx = parseInt(avatarDiv.dataset.idx);
      if (input.value.trim() === 'سهى') avatarDiv.textContent = '❤️';
      else if (avatarDiv.textContent === '❤️') avatarDiv.textContent = AVATARS[idx];
    });

    card.appendChild(avatarDiv);
    card.appendChild(input);
    container.appendChild(card);
  }
}

function buildScoreboard() {
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = '';
  sb.className = 'scoreboard' + (PLAYERS.length > 3 ? ' many' : '');
  PLAYERS.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'score-card';
    card.id = 'sc' + i;
    card.style.cssText = `border-color:${p.color}44; flex:1; min-width:${PLAYERS.length > 4 ? '70px' : '80px'}`;
    card.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${p.color};border-radius:16px 16px 0 0"></div>
      <div class="sc-avatar">${p.avatar}</div>
      <div class="sc-name" id="scName${i}" style="color:${p.color}">${p.name}</div>
      <div class="sc-points" id="scPts${i}" style="color:${p.color}">0</div>
      <div class="sc-lbl">نقطة</div>
    `;
    sb.appendChild(card);
  });
}

function updatePointsNote() {
  const n = playerCount;
  let txt = `كل إجابة صحيحة = <strong>10 نقاط</strong>`;
  if (n > 1) {
    const split = parseFloat((10/n).toFixed(1));
    txt += ` &nbsp;|&nbsp; إذا اتفق الجميع (${n}) → <strong>${split} لكل</strong>`;
    if (n > 2) txt += ` &nbsp;|&nbsp; إذا أجاب واحد فقط → <strong>10 كاملة</strong>`;
  }
  document.getElementById('pointsNote').innerHTML = txt;
}

function setGameMode(mode) {
  gameMode = mode;
  document.getElementById('modeSoloCard').classList.toggle('active', mode === 'solo');
  document.getElementById('modeTeamsCard').classList.toggle('active', mode === 'teams');
  document.getElementById('modeOnlineCard').classList.toggle('active', mode === 'online');
  document.getElementById('soloSetup').style.display = mode === 'solo' ? 'block' : 'none';
  document.getElementById('teamSetup').style.display = mode === 'teams' ? 'block' : 'none';
  document.getElementById('onlineSetup').style.display = mode === 'online' ? 'block' : 'none';
  document.getElementById('localExtras').style.display = mode === 'online' ? 'none' : 'block';
  const oc = document.getElementById('offlineCatCount'); if (oc) oc.style.display = mode === 'online' ? 'none' : 'block';
  if (mode === 'online') renderOnlineEmojiPicker();
}
function hideAllScreens() {
  ['landingScreen','gamesScreen','setupScreen','gameScreen','onlineScreen','profileScreen','trapScreen','xoScreen','c4Screen','memScreen','defuseScreen','gameLbScreen','dinoScreen','brotScreen','spaceScreen'].forEach(id=>{
    const e = document.getElementById(id); if (e) e.style.display = 'none';
  });
  ['finalScreen','lbScreen','adminScreen'].forEach(id=>{ const e=document.getElementById(id); if(e){ e.classList.remove('show'); e.style.display=''; } });
  document.body.classList.remove('on-home');
}
function goToLanding() {
  hideAllScreens();
  document.getElementById('landingScreen').style.display = 'block';
  if (typeof detachOpenRoomsListener === 'function') detachOpenRoomsListener();
  document.body.classList.add('on-home');
  _setNavShow(true);
}
function goToGames() {
  hideAllScreens();
  const el = document.getElementById('gamesScreen');
  if (el) el.style.display = 'block';
  _setNavShow(true);
}
function returnFromGame() {
  const hash = (location.hash || '#/').slice(1).split('/').filter(Boolean)[0] || '';
  if (hash === 'games') { goToGames(); return; }
  if (hash === 'profile') {
    if (typeof openProfile === 'function') { hideAllScreens(); openProfile(); _setNavShow(true); return; }
  }
  if (hash === 'leaderboard') {
    if (typeof openGlobalLb === 'function') { hideAllScreens(); openGlobalLb(); _setNavShow(true); return; }
  }
  goToLanding();
}
window.returnFromGame = returnFromGame;
function playGame(kind) {
  _setNavShow(false);
  if (kind === 'dino') { playDino(); return; }
  if (kind === 'brainrot') { playBrainRot(); return; }
  if (kind === 'space') { playSpace(); return; }
  if (kind === 'wanees') { playWanees(); return; }
  try { goToOnline(); } catch(e){}
  setTimeout(() => {
    try { if (typeof pickOnlineGameType === 'function') pickOnlineGameType(kind); } catch(e){}
    const picker = document.getElementById('onlineGameTypePicker');
    if (picker) picker.style.display = 'none';
    const title = document.getElementById('setupTitle');
    if (title) {
      const labels = { quiz:'🧠 الأسئلة', trap:'💣 الفخ', xo:'🎮 XO', c4:'🔴 أربعة في صف', mem:'🃏 الذاكرة', defuse:'🧨 إبطال القنبلة' };
      title.textContent = labels[kind] || title.textContent;
    }
  }, 60);
}
function _setNavShow(show) {
  document.body.classList.toggle('nav-show', !!show);
}
function navigateRoute(ev, route) {
  if (ev) ev.preventDefault();
  if (location.hash === '#' + route) { handleRouteChange(); return; }
  location.hash = '#' + route;
}
const _ROUTE_HANDLERS = {
  '/':            () => { try { goToLanding(); } catch(e){} },
  '/games':       () => { try { goToGames(); } catch(e){} },
  '/profile':     () => { try { hideAllScreens(); openProfile(); _setNavShow(true); } catch(e){} },
  '/leaderboard': () => { try { hideAllScreens(); openGlobalLb(); _setNavShow(true); } catch(e){} },
};
function handleRouteChange() {
  const raw = (location.hash || '#/').slice(1) || '/';
  const segs = raw.split('/').filter(Boolean);
  const route = segs.length ? '/' + segs[0] : '/';
  const handler = _ROUTE_HANDLERS[route] || _ROUTE_HANDLERS['/'];
  if (handler) handler();
  document.querySelectorAll('.top-nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-route') === route);
  });
}
window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash || location.hash === '#') {
    handleRouteChange();
  } else {
    handleRouteChange();
  }
});
function goToOffline() {
  try { ensureQuestions().then(() => updateAvailNote && updateAvailNote()); } catch(e){}
  hideAllScreens();
  _setNavShow(false);
  const set = document.getElementById('setupScreen'); set.style.display='block';
  document.getElementById('modeOnlineCard').style.display = 'none'; // online has its own entry from landing
  document.getElementById('modeRow').style.display = 'flex';
  document.getElementById('modeRowTitle').style.display = 'block';
  document.getElementById('setupTitle').textContent = '🎮 إعداد اللعب الأوفلاين';
  document.getElementById('guideOffline').style.display='block';
  document.getElementById('guideOnline').style.display='none';
  if (gameMode==='online' || !gameMode) setGameMode('solo'); else setGameMode(gameMode);
}
function goToOnline() {
  try { ensureQuestions().then(() => updateAvailNote && updateAvailNote()); } catch(e){}
  hideAllScreens();
  _setNavShow(false);
  const set = document.getElementById('setupScreen'); set.style.display='block';
  document.getElementById('modeRow').style.display = 'none';
  document.getElementById('modeRowTitle').style.display = 'none';
  document.getElementById('setupTitle').textContent = '🌐 إعداد اللعب الأونلاين';
  document.getElementById('guideOffline').style.display='none';
  document.getElementById('guideOnline').style.display='block';
  const picker = document.getElementById('onlineGameTypePicker'); if (picker) picker.style.display = '';
  setGameMode('online');
  if (typeof restoreOnlineAccState === 'function') restoreOnlineAccState();
  if (typeof updateOnlineAccSummaries === 'function') updateOnlineAccSummaries();
  if (typeof attachOpenRoomsListener === 'function') attachOpenRoomsListener();
}
function toggleGuide() {
  const body = document.getElementById('guideBody');
  const arr = document.getElementById('guideArrow');
  const open = body.style.display==='none';
  body.style.display = open ? 'block' : 'none';
  if (arr) arr.textContent = open ? '▲' : '▼';
}

function toggleRandom() {
  useRandomOrder = !useRandomOrder;
  document.getElementById('randomToggleCard').classList.toggle('on', useRandomOrder);
}
function toggleSkip() {
  allowSkip = !allowSkip;
  document.getElementById('skipToggleCard').classList.toggle('on', allowSkip);
}
function nextSoloPlayer() {
  if (soloQueue.length === 0) soloQueue = shuffle(PLAYERS.map(p => p.id));
  return soloQueue.shift();
}

function setCat(cat, btn) {
  if (cat === 'all') {
    selectedCats.clear(); selectedCats.add('all');
  } else {
    if (selectedCats.has('all')) selectedCats.delete('all');
    if (selectedCats.has(cat)) {
      selectedCats.delete(cat);
      if (selectedCats.size === 0) selectedCats.add('all');
    } else {
      selectedCats.add(cat);
    }
  }
  refreshCatTabs();
  updateAvailNote();
  if (typeof updateOnlineAccSummaries === 'function') updateOnlineAccSummaries();
}

function updateAvailNote() {
  const pool = getCatPool();
  const avail = pool.length;
  document.getElementById('availNum').textContent = avail;
  document.querySelectorAll('.qcount-btn').forEach(btn => {
    const n = parseInt(btn.querySelector('.qn').textContent);
    if (n > avail) {
      btn.style.opacity = '0.35';
      btn.style.pointerEvents = 'none';
      if (btn.classList.contains('active')) {
        const maxBtn = [...document.querySelectorAll('.qcount-btn')].reverse().find(b => parseInt(b.querySelector('.qn').textContent) <= avail);
        if (maxBtn) { btn.classList.remove('active'); maxBtn.classList.add('active'); selectedCount = parseInt(maxBtn.querySelector('.qn').textContent); }
      }
    } else {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  });
}

function setCount(n, el) {
  selectedCount = n;
  document.querySelectorAll('.qcount-btn').forEach(b => {
    const v = parseInt(b.querySelector('.qn') && b.querySelector('.qn').textContent);
    b.classList.toggle('active', v === n);
  });
  const _qLabel = document.getElementById('roundQLabel');
  const _tLabel = document.getElementById('totalQLabel');
  if (_qLabel) _qLabel.textContent = n;
  if (_tLabel) _tLabel.textContent = n * (typeof totalRounds !== 'undefined' ? totalRounds : 1);
  if (typeof updateOnlineAccSummaries === 'function') updateOnlineAccSummaries();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
const RECENT_KEY = 'quizRecentQuestions';
const RECENT_MAX = 150;
function _recentList() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); } catch(e){ return []; } }
function pushRecentQuestion(qText) {
  if (!qText) return;
  try {
    const arr = _recentList();
    arr.push(qText);
    while (arr.length > RECENT_MAX) arr.shift();
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
  } catch(e){}
}
function deprioritizeRecent(arr) {
  const recent = new Set(_recentList());
  if (!recent.size) return arr;
  const fresh = [], seen = [];
  arr.forEach(q => (recent.has(q.q) ? seen : fresh).push(q));
  return fresh.concat(seen);
}

async function startGame() {
  if (!_questionsLoaded) { showToast('⏳ جاري تحميل الأسئلة…', 'var(--gold)'); await ensureQuestions(); }
  PLAYERS = [];
  if (gameMode === 'teams') {
    const n0 = (document.getElementById('teamName0').value.trim()) || 'الفريق الأزرق';
    const n1 = (document.getElementById('teamName1').value.trim()) || 'الفريق الأحمر';
    PLAYERS.push({ id: 0, cls: 'p0', color: '#6495ed', avatar: '🔵', name: n0 });
    PLAYERS.push({ id: 1, cls: 'p1', color: '#e07050', avatar: '🔴', name: n1 });
  } else {
    for (let i = 0; i < playerCount; i++) {
      const t = PLAYER_TEMPLATES[i];
      const nameEl = document.getElementById('name' + i);
      const name = (nameEl ? nameEl.value.trim() : '') || t.defaultName;
      const avatar = (name === 'سهى') ? '❤️' : AVATARS[i];
      PLAYERS.push({ id: i, cls: t.cls, color: t.color, avatar, name });
    }
  }
  buildScoreboard();

  let pool = getCatPool();
  questions = shuffle(pool);
  qIndex = 0;
  answeredCount = 0;
  soloQueue = [];
  scores = new Array(PLAYERS.length).fill(0);

  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('landingScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  let _pool = getCatPool();
  _pool = applyDiffFilter(_pool);
  if (customQuestions.length > 0) _pool = [...customQuestions, ...shuffle(_pool)];
  questions = deprioritizeRecent(shuffle(_pool));

  updateScoreboard();
  startGameAdv();   // init joker, stats, rounds, special modes
  loadQuestion();
}
function updateScoreboard(deltas) {
  PLAYERS.forEach((p,i) => {
    const el = document.getElementById('scPts'+i);
    if (!el) return;
    el.textContent = parseFloat(scores[i].toFixed(1));
    const old = document.getElementById('delta'+i);
    if (old) old.remove();
    if (deltas && deltas[i] > 0) {
      const badge = document.createElement('div');
      badge.className = 'delta-badge'; badge.id = 'delta'+i;
      badge.textContent = '+'+parseFloat(deltas[i].toFixed(1));
      document.getElementById('sc'+i).appendChild(badge);
      setTimeout(() => badge.remove(), 2200);
      el.classList.add('score-anim');
      setTimeout(() => el.classList.remove('score-anim'), 600);
    }
  });
  updateTeamScores();
}
function loadQuestion() {
  turnIndex = 0;
  answers = [null,null,null];
  if (qIndex >= questions.length) { showFinal(); return; }

  snapshotGame();
  const q = questions[qIndex];
  pushRecentQuestion(q && q.q);
  document.getElementById('progressBar').style.width = ((answeredCount / selectedCount) * 100) + '%';
  document.getElementById('qNum').textContent = `السؤال ${answeredCount + 1} من ${selectedCount}`;

  const badge = document.getElementById('catBadge');
  badge.textContent = catLabels[q.cat].label;
  badge.className = 'cat-badge ' + catLabels[q.cat].cls;

  document.getElementById('questionText').textContent = q.q;
  const qImg = document.getElementById('qImage');
  if (q.img) { qImg.src = q.img; qImg.style.display = 'block'; } else { qImg.style.display = 'none'; qImg.src=''; }
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('feedback').innerHTML = '';
  const nextBtn = document.getElementById('nextBtn');
  nextBtn.className = 'next-btn';
  nextBtn.dataset.skipped = '';
  nextBtn.textContent = (answeredCount + 1) < selectedCount ? 'السؤال التالي ←' : 'عرض النتيجة النهائية 🏆';
  const skipBtn = document.getElementById('skipBtn');
  if (allowSkip) skipBtn.classList.add('show');
  else skipBtn.classList.remove('show');
  if (useRandomOrder) {
    const solo = nextSoloPlayer();
    turnOrder = [solo];
  } else {
    turnOrder = PLAYERS.map(p => p.id);
  }

  renderOptions(false);
  updateTurnIndicator();
  updateActiveCard();

  if (useRandomOrder) showSpinOverlay(turnOrder[0]);
  const _q = questions[qIndex];
  if (_q && _q.diff) {
    const _meta = document.getElementById('catBadge').parentElement;
    let _db = document.getElementById('diffBadge');
    if (!_db) { _db = document.createElement('span'); _db.id='diffBadge'; _db.className='diff-badge'; _meta.insertBefore(_db, _meta.children[1]); }
    const _dmap = {easy:['سهل','diff-easy'], medium:['متوسط','diff-medium'], hard:['صعب','diff-hard']};
    const [_dl, _dc] = _dmap[_q.diff] || ['',''];
    _db.textContent = _dl; _db.className = 'diff-badge ' + _dc;
  }

  loadQuestionAdv();  // init joker row, start timer
}

function renderOptions(revealed) {
  const q = questions[qIndex];
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  const letters = ['أ','ب','ج'];

  q.opts.forEach((opt,i) => {
    const div = document.createElement('div');
    let cls = 'option';

    if (revealed) {
      cls += ' disabled';
      if (i === q.ans) {
        const choosers = turnOrder.filter(pid => answers[pid] === i);
        cls += choosers.length > 0 ? ' correct' : ' reveal-correct';
      } else if (turnOrder.some(pid => answers[pid] === i)) {
        cls += ' wrong';
      }
    }

    let voterHtml = '<div class="opt-voters">';
    turnOrder.forEach(pid => {
      if (answers[pid] === i) voterHtml += `<div class="voter-chip ${PLAYERS[pid].ccls}">${PLAYERS[pid].avatar}</div>`;
    });
    voterHtml += '</div>';

    div.className = cls;
    div.innerHTML = `<span class="opt-letter">${letters[i]}</span><span>${opt}</span>${voterHtml}`;
    if (!revealed) div.onclick = () => selectOption(i);
    container.appendChild(div);
  });
}

function selectOption(optIdx) {
  const currentPlayer = turnOrder[turnIndex];
  if (answers[currentPlayer] !== null) return;
  answers[currentPlayer] = optIdx;
  renderOptions(false);
  if (turnIndex < turnOrder.length - 1) {
    turnIndex++;
    updateTurnIndicator();
    updateActiveCard();
  } else {
    revealAnswers();
  }
}

function updateTurnIndicator() {
  const p = PLAYERS[turnOrder[turnIndex]];
  document.getElementById('turnAvatar').textContent = p.avatar;
  const tn = document.getElementById('turnName');
  tn.textContent = p.name;
  tn.className = 'turn-text ' + p.ccls;
  tn.style.color = '';
  document.getElementById('turnSub').textContent = useRandomOrder
    ? `السؤال ${answeredCount + 1} من ${selectedCount} — دوره`
    : 'دورك للإجابة';

  const dotsRow = document.getElementById('dotsRow');
  dotsRow.innerHTML = '';
  if (!useRandomOrder) {
    turnOrder.forEach((pid, i) => {
      const dot = document.createElement('div');
      let dcls = 'dot';
      if (answers[pid] !== null) dcls += ' answered';
      else if (i === turnIndex) dcls += ' pending';
      dot.className = dcls;
      dotsRow.appendChild(dot);
    });
  }
}

function updateActiveCard() {
  const activeId = turnOrder[turnIndex];
  PLAYERS.forEach((p,i) => {
    const card = document.getElementById('sc'+i);
    if (!card) return;
    if (i === activeId) {
      card.classList.add('active-turn');
      card.style.boxShadow = `0 8px 24px ${p.color}33`;
    } else {
      card.classList.remove('active-turn');
      card.style.boxShadow = '';
    }
  });
}

function revealAnswers() {
  PLAYERS.forEach(p => document.getElementById('sc'+p.id).classList.remove('active-turn'));
  const q = questions[qIndex];
  const activePlayers = useRandomOrder ? [PLAYERS[turnOrder[0]]] : PLAYERS;
  const winners = activePlayers.filter(p => answers[p.id] === q.ans);
  const deltas = [0,0,0];

  if (winners.length > 0) {
    const share = POINTS / winners.length;
    winners.forEach(p => { scores[p.id] += share; deltas[p.id] = share; });
  }

  renderOptions(true);
  updateScoreboard(deltas);
  const dotsRow = document.getElementById('dotsRow');
  dotsRow.innerHTML = '';
  if (!useRandomOrder) {
    turnOrder.forEach(pid => {
      const dot = document.createElement('div');
      dot.className = 'dot ' + (answers[pid] === q.ans ? 'answered' : 'wrong-dot');
      dotsRow.appendChild(dot);
    });
  }

  const turnName = document.getElementById('turnName');
  document.getElementById('turnAvatar').textContent = '📊';
  turnName.textContent = 'نتيجة السؤال';
  turnName.className = 'turn-text';
  turnName.style.color = 'var(--gold)';
  document.getElementById('turnSub').textContent = '';

  const fb = document.getElementById('feedback');
  let fbCls, headerIcon, headerText;

  if (useRandomOrder) {
    const soloP = PLAYERS[turnOrder[0]];
    const correct = answers[turnOrder[0]] === q.ans;
    fbCls = correct ? 'feedback correct-fb show' : 'feedback wrong-fb show';
    headerIcon = correct ? '✅' : '❌';
    headerText = correct
      ? `${soloP.name} أجاب صحيح! +${POINTS} نقاط 🎉`
      : `${soloP.name} أخطأ في الإجابة!`;
  } else {
    const total = PLAYERS.length;
    if (winners.length === total && total > 1) {
      const share = parseFloat((POINTS/total).toFixed(1));
      fbCls = 'feedback split-fb show'; headerIcon = '⚡';
      headerText = `اتفق الجميع (${total}) على الصح! النقاط تتقسم (${share} لكل لاعب)`;
    } else if (winners.length > 1) {
      const share = parseFloat((POINTS/winners.length).toFixed(1));
      fbCls = 'feedback split-fb show'; headerIcon = '🤝';
      headerText = `${winners.length} لاعبين أجابوا صحيح! كل منهم يأخذ ${share} نقطة`;
    } else if (winners.length === 1) {
      fbCls = 'feedback correct-fb show'; headerIcon = '✅';
      headerText = `${winners[0].name} أجاب صحيح ويحصل على ${POINTS} نقاط كاملة!`;
    } else {
      fbCls = 'feedback wrong-fb show'; headerIcon = '❌';
      headerText = `لا أحد أجاب صحيح!`;
    }
  }

  let chipsHtml = '<div class="pts-summary">';
  activePlayers.forEach(p => {
    const got = deltas[p.id];
    chipsHtml += `<div class="pts-chip ${p.ccls}">${p.avatar} ${p.name}: ${got>0?'+'+parseFloat(got.toFixed(1)):'0'}</div>`;
  });
  chipsHtml += '</div>';

  fb.className = fbCls;
  fb.innerHTML = `
    <div class="fb-header">${headerIcon} ${headerText}</div>
    <div class="fb-exp">
      <div class="fb-exp-icon">💡</div>
      <div class="fb-exp-text">
        <div class="fb-exp-label">فائدة</div>
        ${q.exp}
      </div>
    </div>
    ${chipsHtml}
  `;
  document.getElementById('nextBtn').classList.add('show');
  document.getElementById('skipBtn').classList.remove('show');
  revealAnswersAdv();  // sound, speed pts, stats
}

function skipQuestion() {
  if (document.getElementById('nextBtn').classList.contains('show')) return;
  const q = questions[qIndex];
  const fb = document.getElementById('feedback');
  fb.className = 'feedback wrong-fb show';
  fb.innerHTML = `
    <div class="fb-header">⏭️ تم تخطي السؤال — لا يُحسب من العدد</div>
    <div class="fb-exp">
      <div class="fb-exp-icon">💡</div>
      <div class="fb-exp-text">
        <div class="fb-exp-label">الإجابة الصحيحة: ${q.opts[q.ans]}</div>
        ${q.exp}
      </div>
    </div>
  `;
  document.querySelectorAll('.option').forEach(o => o.classList.add('disabled'));
  document.querySelectorAll('.option')[q.ans].classList.add('reveal-correct');
  PLAYERS.forEach(p => document.getElementById('sc'+p.id).classList.remove('active-turn'));
  document.getElementById('skipBtn').classList.remove('show');
  if (useRandomOrder) soloQueue.unshift(turnOrder[0]);
  const nextBtn = document.getElementById('nextBtn');
  nextBtn.dataset.skipped = '1';
  nextBtn.textContent = '⏭️ انتقل للسؤال التالي (بدون حساب)';
  nextBtn.classList.add('show');
}

function showSpinOverlay(playerIdx) {
  const p = PLAYERS[playerIdx];
  document.getElementById('spinAvatar').textContent = p.avatar;
  document.getElementById('spinName').textContent = p.name;
  const overlay = document.getElementById('spinOverlay');
  overlay.classList.add('show');
  let ticks = 0;
  const totalTicks = 14;
  const interval = setInterval(() => {
    const rnd = PLAYERS[Math.floor(Math.random()*3)];
    document.getElementById('spinAvatar').textContent = rnd.avatar;
    document.getElementById('spinName').textContent = rnd.name;
    ticks++;
    if (ticks >= totalTicks) {
      clearInterval(interval);
      document.getElementById('spinAvatar').textContent = p.avatar;
      document.getElementById('spinName').textContent = p.name;
      setTimeout(() => overlay.classList.remove('show'), 1200);
    }
  }, 75);
}

function nextQuestion() {
  const nextBtn = document.getElementById('nextBtn');
  const wasSkipped = nextBtn.dataset.skipped === '1';
  nextBtn.dataset.skipped = '';
  qIndex++; // always move to next question in pool

  if (wasSkipped) {
    if (qIndex >= questions.length) { showFinal(); return; }
    loadQuestion();
  } else {
    answeredCount++;
    checkElimination();  // check if a player gets eliminated
    if (answeredCount >= selectedCount || qIndex >= questions.length) {
      showFinal();
    } else {
      loadQuestion();
    }
  }
}
function showFinal() {
  clearActiveGame();
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('finalScreen').classList.add('show');

  const sorted = [...PLAYERS].sort((a,b) => scores[b.id] - scores[a.id]);
  const medals = ['🥇','🥈','🥉','🏅','🏅','🏅'];
  const medalBg = ['rgba(255,215,0,0.15)','rgba(192,192,192,0.1)','rgba(205,127,50,0.1)'];
  const medalColor = ['#ffd700','#c0c0c0','#cd7f32'];
  const podium = document.getElementById('podium');
  podium.innerHTML = '';
  const topCount = Math.min(sorted.length, 3);
  const dispOrder = topCount === 1 ? [sorted[0]]
    : topCount === 2 ? [sorted[1], sorted[0]]
    : [sorted[1], sorted[0], sorted[2]];
  const heights = topCount === 1 ? [160] : topCount === 2 ? [120,160] : [120,160,90];
  const rankMap = topCount === 1 ? [0] : topCount === 2 ? [1,0] : [1,0,2];

  dispOrder.forEach((p, pos) => {
    if (!p) return;
    const rank = rankMap[pos];
    const isTop = rank === 0;
    const item = document.createElement('div');
    item.className = 'podium-item';
    item.innerHTML = `
      <div class="podium-block" style="height:${heights[pos]}px;background:${p.color}14;border:1px solid ${p.color}30">
        <div class="podium-emoji">${p.avatar}</div>
        <div class="podium-rank ${['gold','silver','bronze'][rank]||''}">${medals[rank]}</div>
      </div>
      <div class="podium-name" style="color:${isTop?'var(--gold)':'var(--text)'}">${p.name}</div>
      <div class="podium-score" style="color:${isTop?'var(--gold)':'var(--muted)'}">${parseFloat(scores[p.id].toFixed(1))}</div>
      <div class="podium-score-lbl">نقطة</div>`;
    podium.appendChild(item);
  });
  const finalRows = document.getElementById('finalRows');
  finalRows.innerHTML = '';
  sorted.forEach((p, rank) => {
    const row = document.createElement('div');
    row.className = 'final-row';
    row.style.borderColor = p.color + '44';
    row.innerHTML = `
      <div class="final-rank-badge" style="background:${medalBg[rank]||p.color+'18'};color:${medalColor[rank]||p.color}">${medals[rank]||'🏅'}</div>
      <div class="fr-avatar">${p.avatar}</div>
      <div class="fr-name" style="color:${p.color};flex:1;font-weight:700;font-size:0.88rem">${p.name}</div>
      <div><div class="fr-score" style="color:${p.color};font-family:'Tajawal',sans-serif;font-size:1.25rem;font-weight:900">${parseFloat(scores[p.id].toFixed(1))}</div><div class="fr-pts-lbl">نقطة</div></div>`;
    finalRows.appendChild(row);
  });
  showFinalAdv();  // confetti, share, leaderboard, stats
}
function backToSetup() {
  clearActiveGame();
  document.getElementById('teamScoreboard').style.display = 'none';
  scores = []; answeredCount = 0; soloQueue = [];
  renderPlayerSetup();
  updateAvailNote();
  goToLanding();
}
let _pendingExit = null;
function showConfirmExit(opts){
  _pendingExit = opts && opts.onAccept || null;
  const m = document.getElementById('confirmExitModal'); if (!m) return;
  const t = document.getElementById('confirmExitTitle');
  const msg = document.getElementById('confirmExitMsg');
  if (t)   t.textContent   = (opts && opts.title)   || 'تأكيد الخروج';
  if (msg) msg.innerHTML   = (opts && opts.message) || 'هل تريد الخروج من اللعبة الحالية؟<br><span style="color:#e07050;font-weight:800">سيتم فقدان التقدم.</span>';
  m.classList.add('show');
}
function hideConfirmExit(){
  const m = document.getElementById('confirmExitModal'); if (m) m.classList.remove('show');
  _pendingExit = null;
}
function confirmExitAccept(){
  const cb = _pendingExit; _pendingExit = null;
  const m = document.getElementById('confirmExitModal'); if (m) m.classList.remove('show');
  if (typeof cb === 'function') cb();
}
window.hideConfirmExit = hideConfirmExit;
window.confirmExitAccept = confirmExitAccept;

function exitQuickPlay() {
  showConfirmExit({ onAccept: function(){
    try { clearActiveGame(); } catch(e){}
    try { document.getElementById('teamScoreboard').style.display = 'none'; } catch(e){}
    try { scores = []; answeredCount = 0; soloQueue = []; } catch(e){}
    goToLanding();
  }});
}
renderPlayerSetup();
updatePointsNote();
updateAvailNote();
document.getElementById('pcMinus').disabled = playerCount <= 1;
document.getElementById('pcPlus').disabled = playerCount >= 6;
let advTimer = false, advSpeed = false, advJoker = false, advStats = false;
let timerSecs = 20, totalRounds = 1, currentRound = 1;
let timerInterval = null, timerRemaining = 0, questionStartTime = 0;
let jokerUsed = [];     // per player: true/false
let playerStats = [];   // per player: { correct, wrong, skipped, streak, maxStreak, speedPts }
let pendingJoker = -1;  // playerIdx who activated joker this question
let emojiTarget = -1;   // which player slot is picking emoji
function toggleAdvanced() {
  const btn = document.getElementById('advToggleBtn');
  const body = document.getElementById('advBody');
  btn.classList.toggle('open');
  body.classList.toggle('open');
}

function toggleAdv(key) {
  const map = {timer:'timerCard', speed:'speedCard', joker:'jokerCard', stats:'statsCard'};
  const card = document.getElementById(map[key]);
  if (!card) return;
  const isOn = card.classList.toggle('on');
  if (key==='timer') { advTimer=isOn; document.getElementById('timerSub').style.display=isOn?'block':'none'; }
  if (key==='speed') advSpeed=isOn;
  if (key==='joker') advJoker=isOn;
  if (key==='stats') advStats=isOn;
}

function setTimerSecs(s, el) {
  timerSecs = s;
  document.querySelectorAll('.timer-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
}

function changeRounds(delta) {
  totalRounds = Math.max(1, Math.min(5, totalRounds + delta));
  document.getElementById('roundsDisplay').textContent = totalRounds;
  const qLabel = document.getElementById('roundQLabel');
  const totalLabel = document.getElementById('totalQLabel');
  if (qLabel) qLabel.textContent = selectedCount;
  if (totalLabel) totalLabel.textContent = selectedCount * totalRounds;
}
let audioCtx = null;
let isMuted = false;
try { isMuted = localStorage.getItem('quizMuted') === '1'; } catch(e){}
function applyMuteUI() {
  const b = document.getElementById('muteBtn'); if (!b) return;
  b.textContent = isMuted ? '🔇' : '🔊';
  b.classList.toggle('muted', isMuted);
  b.title = isMuted ? 'تفعيل الأصوات' : 'كتم الأصوات';
}
function toggleMute() {
  isMuted = !isMuted;
  try { localStorage.setItem('quizMuted', isMuted ? '1' : '0'); } catch(e){}
  applyMuteUI();
  if (!isMuted) { try { playTone(700, 0.06, 'sine', 0.18); } catch(e){} }
}
window.addEventListener('DOMContentLoaded', applyMuteUI);
function waneesLogoTap(el) {
  if (!el) return;
  el.classList.remove('pressed');
  void el.offsetWidth;
  el.classList.add('pressed');
  setTimeout(() => el.classList.remove('pressed'), 600);
  try {
    playTone(660, 0.05, 'square', 0.18);
    setTimeout(() => playTone(990, 0.06, 'square', 0.14), 50);
    setTimeout(() => playTone(1320, 0.08, 'triangle', 0.10), 110);
  } catch(e){}
  try { if (navigator.vibrate) navigator.vibrate(20); } catch(e){}
}
async function withBtnLoading(btn, fn) {
  if (!btn) return fn();
  btn.classList.add('is-loading');
  try { return await fn(); }
  finally { btn.classList.remove('is-loading'); }
}
function checkOpponentLeft(stateObj, players) {
  if (!stateObj || !stateObj.opponentRole || !stateObj.role) return;
  const opp = players[stateObj.opponentRole] || {};
  const oppHere = !!opp.joined;
  if (stateObj._oppWasJoined && !oppHere) {
    showToast('🚪 خرج خصمك من الغرفة', 'var(--wrong)');
  }
  stateObj._oppWasJoined = oppHere;
}
async function sendNudge(prefix, code) {
  if (!code) return;
  try {
    await fb.db.ref('rooms/'+prefix+code+'/nudge').set({ ts:firebase.database.ServerValue.TIMESTAMP });
  } catch(e) {}
}
function showNudge() {
  const banner = document.createElement('div');
  banner.className = 'nudge-banner';
  banner.textContent = '📳 خصمك يستعجلك!';
  document.body.appendChild(banner);
  try { playTone(880, 0.06, 'triangle', 0.22); setTimeout(()=>playTone(1180, 0.07, 'triangle', 0.18), 70); } catch(e){}
  setTimeout(()=>{ try { banner.remove(); } catch(e){} }, 3200);
}
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type='sine', vol=0.3) {
  if (isMuted) return;
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}
function soundCorrect() {
  playTone(523, 0.1); setTimeout(()=>playTone(659,0.1),100); setTimeout(()=>playTone(784,0.2),200);
}
function soundWrong() {
  playTone(220,0.15,'sawtooth',0.2); setTimeout(()=>playTone(180,0.2,'sawtooth',0.15),150);
}
function soundTick() { playTone(880,0.05,'square',0.08); }
function soundTimeUp() {
  playTone(440,0.1); setTimeout(()=>playTone(350,0.15),100); setTimeout(()=>playTone(280,0.3),220);
}
function soundJoker() {
  [523,659,784,1046].forEach((f,i)=>setTimeout(()=>playTone(f,0.15,'triangle',0.25),i*80));
}
function soundRoundEnd() {
  [392,440,494,523,587,659,784].forEach((f,i)=>setTimeout(()=>playTone(f,0.12),i*60));
}
function soundXoPlaceX() {
  playTone(880, 0.06, 'triangle', 0.25);
  setTimeout(()=>playTone(1320, 0.07, 'triangle', 0.22), 50);
}
function soundXoPlaceO() {
  playTone(520, 0.07, 'sine', 0.28);
  setTimeout(()=>playTone(390, 0.09, 'sine', 0.22), 55);
}
function soundXoOppMove() {
  playTone(660, 0.05, 'sine', 0.18);
}
function soundXoWin() {
  [523, 659, 784, 988, 1175].forEach((f,i)=>setTimeout(()=>playTone(f, 0.18, 'triangle', 0.28), i*90));
  setTimeout(()=>playTone(1568, 0.35, 'triangle', 0.3), 5*90);
}
function soundXoLose() {
  [440, 370, 294].forEach((f,i)=>setTimeout(()=>playTone(f, 0.22, 'sawtooth', 0.18), i*150));
}
function soundXoDraw() {
  playTone(523, 0.15, 'sine', 0.2);
  setTimeout(()=>playTone(523, 0.18, 'sine', 0.18), 180);
}
function soundTrapPlant() {
  playTone(440, 0.04, 'square', 0.18);
  setTimeout(()=>playTone(330, 0.05, 'square', 0.14), 35);
}
function soundTrapConfirm() {
  playTone(523, 0.08, 'triangle', 0.22);
  setTimeout(()=>playTone(784, 0.12, 'triangle', 0.22), 70);
}
function soundTrapSafe() {
  playTone(660, 0.07, 'sine', 0.18);
  setTimeout(()=>playTone(880, 0.09, 'sine', 0.15), 60);
}
function soundTrapBoom() {
  if (isMuted) return;
  try {
    const ctx = getAudio();
    const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
    osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(220, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
    g1.gain.setValueAtTime(0.45, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.start(); osc1.stop(ctx.currentTime + 0.5);
    const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
    osc2.type = 'square'; osc2.frequency.setValueAtTime(80, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
    g2.gain.setValueAtTime(0.35, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.start(); osc2.stop(ctx.currentTime + 0.35);
  } catch(e){}
}
function soundTrapHeartLost() {
  playTone(330, 0.18, 'triangle', 0.22);
  setTimeout(()=>playTone(247, 0.25, 'triangle', 0.18), 160);
}
function soundTrapTick() {
  playTone(700, 0.05, 'sine', 0.16);
}
function soundTrapWin() {
  [523, 659, 784, 988, 1175].forEach((f,i)=>setTimeout(()=>playTone(f, 0.18, 'triangle', 0.28), i*90));
  setTimeout(()=>playTone(1568, 0.4, 'triangle', 0.3), 5*90);
}
function soundTrapLose() {
  [392, 330, 277, 220].forEach((f,i)=>setTimeout(()=>playTone(f, 0.25, 'sawtooth', 0.22), i*180));
}
function startTimer(onExpire) {
  stopTimer();
  if (!advTimer) return;
  timerRemaining = timerSecs;
  questionStartTime = Date.now();
  const circ = 2 * Math.PI * 20; // 125.66
  const fg = document.getElementById('timerFg');
  const num = document.getElementById('timerNum');
  document.getElementById('timerRingWrap').classList.add('show');

  function tick() {
    num.textContent = timerRemaining;
    const pct = timerRemaining / timerSecs;
    fg.style.strokeDashoffset = circ * (1 - pct);
    const urgent = timerRemaining <= 5;
    fg.classList.toggle('urgent', urgent);
    num.classList.toggle('urgent', urgent);
    if (urgent) soundTick();
    if (timerRemaining <= 0) { stopTimer(); soundTimeUp(); onExpire(); return; }
    timerRemaining--;
    timerInterval = setTimeout(tick, 1000);
  }
  tick();
}

function stopTimer() {
  clearTimeout(timerInterval);
  timerInterval = null;
  document.getElementById('timerRingWrap').classList.remove('show');
}

function getSpeedBonus(totalSecs) {
  const elapsed = (Date.now() - questionStartTime) / 1000;
  const ratio = Math.max(0, 1 - elapsed / totalSecs);
  return Math.round(ratio * 9) + 1; // 1-10
}
function renderJokerRow() {
  const row = document.getElementById('jokerRow');
  row.innerHTML = '';
  if (!advJoker) return;
  PLAYERS.forEach((p, i) => {
    if (answers[p.id] !== null) return; // already answered
    const btn = document.createElement('button');
    btn.className = 'joker-btn show' + (jokerUsed[i] ? ' used' : '');
    btn.innerHTML = `🃏 جوكر ${p.name}`;
    btn.style.borderColor = p.color + '66';
    btn.style.color = jokerUsed[i] ? '' : p.color;
    btn.onclick = () => activateJoker(i);
    row.appendChild(btn);
  });
}

function activateJoker(pidx) {
  if (jokerUsed[pidx]) return;
  jokerUsed[pidx] = true;
  pendingJoker = pidx;
  soundJoker();
  const sc = document.getElementById('sc'+pidx);
  if (sc) { sc.style.boxShadow=`0 0 24px ${PLAYERS[pidx].color}`; setTimeout(()=>sc.style.boxShadow='',800); }
  renderJokerRow();
  showToast(`🃏 ${PLAYERS[pidx].name} فعّل الجوكر! نقاطه ستتضاعف!`, PLAYERS[pidx].color);
}
function showToast(msg, color='var(--gold)') {
  let t = document.getElementById('gameToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'gameToast';
    t.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#13131a;border:1.5px solid;border-radius:50px;padding:8px 20px;font-family:Cairo,sans-serif;font-size:0.82rem;z-index:9999;transition:opacity 0.4s;pointer-events:none;max-width:90vw;text-align:center;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.borderColor = color;
  t.style.color = color;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.style.opacity='0', 2000);
}
const ALL_EMOJIS = ['🦁','🦊','🦅','🐯','🦄','🦋','🐺','🦈','🦅','🐉','🦁','🦀','🐸','🦉','🦒','🐬','🦓','🦏','🐘','🦛','🐧','🦜','🐙','🦑','🦕'];
function openEmojiPicker(playerIdx) {
  emojiTarget = playerIdx;
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  const unique = [...new Set(ALL_EMOJIS)];
  unique.forEach(e => {
    const div = document.createElement('div');
    div.className = 'emoji-opt' + (AVATARS[playerIdx]===e?' selected':'');
    div.textContent = e;
    div.onclick = () => { AVATARS[playerIdx]=e; document.getElementById('emojiOverlay').classList.remove('show'); renderPlayerSetup(); };
    grid.appendChild(div);
  });
  document.getElementById('emojiOverlay').classList.add('show');
}
function closeEmojiPicker(e) { if(e.target.id==='emojiOverlay') document.getElementById('emojiOverlay').classList.remove('show'); }
let _confettiRaf = 0;
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  // Cancel any running celebration so repeat wins don't stack RAF loops
  if (_confettiRaf) { cancelAnimationFrame(_confettiRaf); _confettiRaf = 0; }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = innerWidth, H = innerHeight;
  const COLORS = ['#f0d080','#c9a84c','#ff6b9d','#5ec8f0','#7ee08a','#c792ea','#ffd166'];
  const SHAPES = ['rect','strip','circle'];
  const parts = [];
  // Two cannons firing up-and-inward from the bottom corners, plus a center pop
  function cannon(x, y, angleCenter, spread, count, power) {
    for (let i = 0; i < count; i++) {
      const a = angleCenter + (Math.random() - 0.5) * spread;
      const v = power * (0.5 + Math.random() * 0.7);
      parts.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: 4 + Math.random() * 6, h: 3 + Math.random() * 9,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        shape: SHAPES[(Math.random() * SHAPES.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.35,
        flutter: Math.random() * Math.PI * 2,
        life: 1
      });
    }
  }
  cannon(W * 0.08, H * 0.95, -Math.PI / 2 - 0.45, 0.7, 55, 17);
  cannon(W * 0.92, H * 0.95, -Math.PI / 2 + 0.45, 0.7, 55, 17);
  cannon(W * 0.5,  H * 0.7,  -Math.PI / 2, 1.4, 40, 12);
  let last = performance.now();
  const start = last;
  function draw(now) {
    const dt = Math.min(2.5, (now - last) / 16.667);
    last = now;
    const elapsed = now - start;
    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.life <= 0) continue;
      p.vy += 0.32 * dt;              // gravity
      p.vx *= Math.pow(0.985, dt);    // drag
      p.vy *= Math.pow(0.99, dt);
      p.flutter += 0.18 * dt;
      p.x += (p.vx + Math.sin(p.flutter) * 1.2) * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      if (elapsed > 1800) p.life -= 0.02 * dt; // gentle fade-out
      if (p.y > H + 30) p.life = 0;
      if (p.life <= 0) continue;
      alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // fake 3D tumble: scale width with flutter phase
      ctx.scale(Math.abs(Math.cos(p.flutter)) * 0.7 + 0.3, 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === 'strip') {
        ctx.fillRect(-p.w / 2, -p.h, p.w / 2.5, p.h * 2);
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (alive > 0 && elapsed < 5000) {
      _confettiRaf = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, W, H);
      _confettiRaf = 0;
    }
  }
  _confettiRaf = requestAnimationFrame(draw);
}
function initStats() {
  playerStats = PLAYERS.map(()=>({correct:0, wrong:0, skipped:0, streak:0, maxStreak:0, speedPts:0}));
}

function recordStat(playerIdx, result, pts) {
  if (!playerStats[playerIdx]) return;
  const s = playerStats[playerIdx];
  if (result==='correct') {
    s.correct++; s.streak++; s.maxStreak=Math.max(s.maxStreak,s.streak);
    s.speedPts += pts || 0;
  } else if (result==='wrong') {
    s.wrong++; s.streak=0;
  } else {
    s.skipped++; s.streak=0;
  }
}

function renderStatsTable(container) {
  if (!advStats || !playerStats.length) return;
  const sorted = [...PLAYERS].sort((a,b)=>scores[b.id]-scores[a.id]);
  let html = `<table class="stats-table"><thead><tr>
    <th class="stat-player-name">اللاعب</th>
    <th>✅</th><th>❌</th><th>⏭️</th><th>🔥 سلسلة</th>
    ${advSpeed?'<th>⚡ تسارع</th>':''}
  </tr></thead><tbody>`;
  sorted.forEach(p => {
    const s = playerStats[p.id]||{correct:0,wrong:0,skipped:0,maxStreak:0,speedPts:0};
    html += `<tr>
      <td class="stat-player-name" style="color:${p.color}">${p.avatar} ${p.name}</td>
      <td style="color:var(--correct)">${s.correct}</td>
      <td style="color:var(--wrong)">${s.wrong}</td>
      <td style="color:var(--muted)">${s.skipped}</td>
      <td style="color:var(--gold)">${s.maxStreak}</td>
      ${advSpeed?`<td style="color:#50c8dc">${s.speedPts}</td>`:''}
    </tr>`;
  });
  html += '</tbody></table>';
  const div = document.createElement('div');
  div.innerHTML = html;
  container.insertBefore(div, container.querySelector('.play-again-btn'));
}
function startRound(round) {
  currentRound = round;
  const badge = document.getElementById('roundBadge');
  if (totalRounds > 1) { badge.textContent=`جولة ${round} من ${totalRounds}`; badge.classList.add('show'); }
  else badge.classList.remove('show');
}

function handleRoundEnd() {
  if (currentRound < totalRounds) {
    soundRoundEnd();
    showToast(`🏁 انتهت الجولة ${currentRound}! استعدوا للجولة ${currentRound+1}`, 'var(--gold)');
    setTimeout(()=>{
      let pool = getCatPool();
      questions = shuffle(pool);
      qIndex = 0; answeredCount = 0; soloQueue = [];
      jokerUsed = new Array(PLAYERS.length).fill(false);
      pendingJoker = -1;
      startRound(currentRound+1);
      loadQuestion();
    }, 1800);
  } else {
    showFinal();
  }
}
const _origStartGame = startGame;
function startGameAdv() {
  jokerUsed = new Array(PLAYERS.length).fill(false);
  pendingJoker = -1;
  lifelinesUsed = PLAYERS.map(()=>({l50:false, lswap:false, llucky:false, lfriend:false}));
  initStats();
  startRound(1);
  const qLabel = document.getElementById('roundQLabel');
  const totalLabel = document.getElementById('totalQLabel');
  if (qLabel) qLabel.textContent = selectedCount;
  if (totalLabel) totalLabel.textContent = selectedCount * totalRounds;
  document.getElementById('teamScoreboard').style.display = 'none';
  initSpecialModes();   // team / elimination / music
}
const _origLoadQuestion = loadQuestion;
function loadQuestionAdv() {
  pendingJoker = -1;
  renderJokerRow();
  renderLifelines();
  startTimer(() => {
    turnOrder.forEach(pid => { if(answers[pid]===null) answers[pid]=-1; });
    revealAnswers();
  });
}
function revealAnswersAdv() {
  stopTimer();

  const q = questions[qIndex];
  const activePlayers = useRandomOrder ? [PLAYERS[turnOrder[0]]] : PLAYERS;
  const winners = activePlayers.filter(p => answers[p.id] === q.ans);
  if (winners.length > 0) soundCorrect(); else soundWrong();
  activePlayers.forEach(p => {
    const pid = p.id;
    const ans = answers[pid];
    if (ans === q.ans) {
      let pts = POINTS / winners.length;
      if (pid === pendingJoker) {
        pts *= 2;
        scores[pid] += pts - (POINTS / winners.length); // add the extra
        document.getElementById('scPts'+pid).textContent = parseFloat(scores[pid].toFixed(1));
      }
      const bonus = advSpeed ? getSpeedBonus(timerSecs||30) : 0;
      recordStat(pid, 'correct', bonus);
    } else if (ans === undefined || ans === null || ans === -1) {
      recordStat(pid, 'skipped', 0);
    } else {
      recordStat(pid, 'wrong', 0);
    }
  });
}
const _origNextQuestion = nextQuestion;
const _origShowFinal = showFinal;
function showFinalAdv() {
  try { saveToLeaderboard(); } catch(e){}
  try {
    let myScore = 0;
    if (typeof players !== 'undefined' && players && players.length) {
      myScore = Math.max.apply(null, players.map(p => p.score || 0));
    }
    recordGameResult('quiz', { score: myScore });
  } catch(e){}
  launchConfetti();
  soundRoundEnd();
  if (advStats) {
    const fc = document.querySelector('.final-card');
    if (fc) renderStatsTable(fc);
  }
  if (advSpeed) {
    const best = [...PLAYERS].sort((a,b)=>(playerStats[b.id]?.speedPts||0)-(playerStats[a.id]?.speedPts||0))[0];
    if (best) showToast(`⚡ الأسرع: ${best.name} بـ ${playerStats[best.id].speedPts} نقطة تسارع`, best.color);
  }
  if (advTeam) showTeamResult();
  stopMusic();
}
let currentTheme = 'dark';
function setTheme(t, el) {
  currentTheme = t;
  Array.from(document.body.classList).forEach(c => {
    if (c.indexOf('theme-') === 0) document.body.classList.remove(c);
  });
  if (t !== 'dark') document.body.classList.add('theme-' + t);
  document.querySelectorAll('.theme-chip').forEach(c => {
    c.classList.remove('active');
    const a = c.getAttribute('onclick') || '';
    if (!el && a.includes("setTheme('" + t + "'")) c.classList.add('active');
  });
  if (el) el.classList.add('active');
  localStorage.setItem('quizTheme', t);
}
(function(){ const saved = localStorage.getItem('quizTheme'); setTheme(saved || 'light', null); })();
let selectedDiffs = new Set(['all']);  // 'all' exclusive; otherwise any subset of easy/medium/hard/veryhard
function applyDiffFilter(pool) {
  if (selectedDiffs.has('all')) return pool;
  return pool.filter(q => selectedDiffs.has(q.diff));
}
function selectedDiffKey() {
  if (selectedDiffs.has('all')) return 'all';
  if (selectedDiffs.size === 1) { const [d] = selectedDiffs; return d; }
  return 'mixed';
}
function refreshDiffTabs() {
  document.querySelectorAll('.diff-filter').forEach(f => {
    const m = (f.getAttribute('onclick')||'').match(/setDiff\('(\w+)'/);
    const key = m ? m[1] : '';
    f.classList.toggle('active', selectedDiffs.has(key));
  });
}
function setDiff(d, el) {
  if (d === 'all') {
    selectedDiffs.clear(); selectedDiffs.add('all');
  } else {
    if (selectedDiffs.has('all')) selectedDiffs.delete('all');
    if (selectedDiffs.has(d)) {
      selectedDiffs.delete(d);
      if (selectedDiffs.size === 0) selectedDiffs.add('all');
    } else {
      selectedDiffs.add(d);
    }
  }
  refreshDiffTabs();
  if (typeof updateOnlineAccSummaries === 'function') updateOnlineAccSummaries();
}
const __origBuildPool = function() {
  let pool = getCatPool();
  pool = applyDiffFilter(pool);
  if (customQuestions.length > 0) pool = [...customQuestions, ...pool];
  questions = shuffle(pool);
};
let advTeam = false, advElim = false, advMusic = false;
let advLifelines = false;
let lifelinesUsed = []; // per-player: {l50, lswap, llucky, lfriend}
let teams = [[],[]];   // array of player IDs per team
let teamScores = [0,0];

function initSpecialModes() {
  if (advTeam) initTeamMode();
  if (advElim) initElimMode();
  if (advMusic) startMusic();
}

function initTeamMode() {
  teams = [[], []];
  PLAYERS.forEach((p,i) => teams[i%2].push(p.id));
  teamScores = [0,0];
  document.getElementById('teamScoreboard').style.display = 'flex';
  document.getElementById('team0Members').textContent = teams[0].map(id=>PLAYERS[id].avatar+PLAYERS[id].name).join(' ');
  document.getElementById('team1Members').textContent = teams[1].map(id=>PLAYERS[id].avatar+PLAYERS[id].name).join(' ');
  updateTeamScores();
}

function updateTeamScores() {
  if (!advTeam) return;
  teamScores = [0,1].map(t => teams[t].reduce((s,id) => s + (scores[id]||0), 0));
  document.getElementById('team0Score').textContent = parseFloat(teamScores[0].toFixed(1));
  document.getElementById('team1Score').textContent = parseFloat(teamScores[1].toFixed(1));
}
let elimActive = [], elimRound = 0;
function initElimMode() {
  elimActive = PLAYERS.map(p => p.id);
  elimRound = 0;
}

function checkElimination() {
  if (!advElim || elimActive.length <= 1) return;
  const qPerElim = Math.max(3, Math.floor(selectedCount / (PLAYERS.length - 1)));
  if (answeredCount > 0 && answeredCount % qPerElim === 0) {
    const loser = elimActive.reduce((a,b) => (scores[a]||0) < (scores[b]||0) ? a : b);
    elimActive = elimActive.filter(id => id !== loser);
    const p = PLAYERS[loser];
    const card = document.getElementById('sc'+loser);
    if(card) {
      card.classList.add('eliminated');
      const badge = document.createElement('div');
      badge.className = 'elim-badge';
      badge.textContent = '❌ مُقصى';
      card.appendChild(badge);
    }
    showToast(`❌ ${p.avatar} ${p.name} خرج من البطولة!`, p.color);
    if (!useRandomOrder) turnOrder = elimActive.slice();
  }
}
let musicInterval = null, musicNodes = [];
function toggleAdv(key) {
  const map = {timer:'timerCard', speed:'speedCard', joker:'jokerCard', stats:'statsCard',
               team:'teamCard', elim:'elimCard', music:'musicCard', lifelines:'lifelinesCard'};
  const card = document.getElementById(map[key]);
  if (!card) return;
  const isOn = card.classList.toggle('on');
  if (key==='timer') { advTimer=isOn; document.getElementById('timerSub').style.display=isOn?'block':'none'; }
  if (key==='speed') advSpeed=isOn;
  if (key==='joker') advJoker=isOn;
  if (key==='stats') advStats=isOn;
  if (key==='team')  { advTeam=isOn; }
  if (key==='elim')  { advElim=isOn; }
  if (key==='lifelines') { advLifelines=isOn; }
  if (key==='music') { advMusic=isOn; document.getElementById('musicBtn').classList.toggle('show',isOn); }
}

let musicPlaying = true;
function startMusic() {
  document.getElementById('musicBtn').classList.add('show');
  playBgMusic();
}
function playBgMusic() {
  if (!musicPlaying || isMuted) return;
  try {
    const ctx = getAudio();
    const notes = [261,294,329,349,392,440,494,523];
    let i = 0;
    musicInterval = setInterval(()=>{
      if(!musicPlaying) return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = notes[i%notes.length] * (Math.random()>0.7?2:1);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.4);
      osc.start(); osc.stop(ctx.currentTime+0.4);
      i++;
    }, 600);
  } catch(e){}
}
function toggleMusic() {
  musicPlaying = !musicPlaying;
  document.getElementById('musicBtn').textContent = musicPlaying ? '🎵' : '🔇';
  if (musicPlaying) playBgMusic();
  else { clearInterval(musicInterval); }
}
function stopMusic() { clearInterval(musicInterval); document.getElementById('musicBtn').classList.remove('show'); }

function showTeamResult() {
  const winner = teamScores[0] > teamScores[1] ? 0 : teamScores[1] > teamScores[0] ? 1 : -1;
  const names = [document.getElementById('team0Name').textContent, document.getElementById('team1Name').textContent];
  const msg = winner === -1 ? '🤝 تعادل الفريقين!' : `🏆 فاز ${names[winner]}!`;
  showToast(msg, winner===0?'#6495ed':'#e07050');
}
let customQuestions = [];
function openCustomQModal() {
  renderCustomQList();
  document.getElementById('customQModal').classList.add('show');
}
function closeCustomQModal() { document.getElementById('customQModal').classList.remove('show'); }
function addCustomQ() {
  const q = document.getElementById('cqText').value.trim();
  const a = document.getElementById('cqA').value.trim();
  const b = document.getElementById('cqB').value.trim();
  const c = document.getElementById('cqC').value.trim();
  const exp = document.getElementById('cqExp').value.trim();
  if (!q || !a || !b || !c) { showToast('⚠️ أكمل السؤال والخيارات الثلاثة', 'var(--wrong)'); return; }
  customQuestions.push({ cat:'custom', q, opts:[a,b,c], ans:0, exp:exp||'سؤال مخصص.', diff:'medium' });
  ['cqText','cqA','cqB','cqC','cqExp'].forEach(id => document.getElementById(id).value='');
  renderCustomQList();
  document.getElementById('customQCount').textContent = `${customQuestions.length} سؤال مضاف`;
}
function removeCustomQ(i) {
  customQuestions.splice(i,1);
  renderCustomQList();
  document.getElementById('customQCount').textContent = customQuestions.length ? `${customQuestions.length} سؤال مضاف` : 'أضف أسئلتك الخاصة';
}
function renderCustomQList() {
  const list = document.getElementById('customQList');
  list.innerHTML = '';
  customQuestions.forEach((q,i) => {
    const div = document.createElement('div');
    div.className = 'custom-q-item';
    div.innerHTML = `<span style="flex:1;font-size:0.8rem">${q.q}</span><span class="custom-q-del" onclick="removeCustomQ(${i})">✕</span>`;
    list.appendChild(div);
  });
}
function saveToLeaderboard() {
  if (!PLAYERS.length || !scores.length) return;
  const sorted = [...PLAYERS].sort((a,b)=>scores[b.id]-scores[a.id]);
  const winner = sorted[0];
  const score = parseFloat(scores[winner.id].toFixed(1));
  const entry = {
    name: winner.name, avatar: winner.avatar, score,
    players: PLAYERS.length, cat: selectedCatKey(), count: selectedCount,
    date: new Date().toLocaleDateString('ar-SA')
  };
  let lb = JSON.parse(localStorage.getItem('quizLeaderboard')||'[]');
  lb.unshift(entry);
  lb = lb.slice(0,20);
  localStorage.setItem('quizLeaderboard', JSON.stringify(lb));
  if (score > 0 && fbReady()) {
    try {
      fb.db.ref('leaderboard/'+isoWeekId()).push({
        name: String(winner.name).slice(0,16), avatar: winner.avatar || '🦁',
        score, cat: selectedCatKey(), count: selectedCount, players: PLAYERS.length,
        ts: firebase.database.ServerValue.TIMESTAMP
      });
    } catch(e){}
  }
}
function isoWeekId(dt) {
  const d = dt ? new Date(dt) : new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return date.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}
function cleanupOldLeaderboards() {
  if (!fbReady()) return;
  const wk = isoWeekId();
  try {
    fb.db.ref('leaderboard').orderByKey().endBefore(wk).once('value').then(snap=>{
      const updates = {}; let any = false;
      snap.forEach(c => { updates[c.key] = null; any = true; });
      if (any) fb.db.ref('leaderboard').update(updates).catch(()=>{});
    }).catch(()=>{});
  } catch(e){}
}

let lbReturnTo = 'finalScreen';
let lbMode = 'local';

function openGlobalLb() { lbReturnTo = 'setupScreen'; document.getElementById('setupScreen').style.display='none'; document.getElementById('landingScreen').style.display='none'; showLb('global'); _setNavShow(true); }

function showLb(mode) {
  document.getElementById('finalScreen').classList.remove('show');
  document.getElementById('lbScreen').classList.add('show');
  setLbMode(mode || 'local');
}

function setLbMode(mode) {
  lbMode = mode;
  document.getElementById('lbTabLocal').classList.toggle('active', mode==='local');
  document.getElementById('lbTabGlobal').classList.toggle('active', mode==='global');
  if (mode === 'local') renderLocalLb();
  else renderGlobalLb();
}

function lbRowHtml(e, i) {
  const catLbl = (catLabels[e.cat] ? catLabels[e.cat].label : 'الكل');
  return `<div class="lb-row">
      <div class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
      <div style="font-size:1.4rem">${e.avatar||'🦁'}</div>
      <div class="lb-info">
        <div class="lb-name">${e.name}</div>
        <div class="lb-detail">${catLbl} • ${e.count} سؤال</div>
        ${e.date?`<div class="lb-date">${e.date}</div>`:''}
      </div>
      <div class="lb-pts">${e.score}</div>
    </div>`;
}

function renderLocalLb() {
  const rows = document.getElementById('lbRows');
  const lb = JSON.parse(localStorage.getItem('quizLeaderboard')||'[]');
  if (!lb.length) { rows.innerHTML='<p style="text-align:center;color:var(--muted);padding:20px">لا توجد سجلات على هذا الجهاز بعد</p>'; return; }
  rows.innerHTML = lb.map((e,i)=>lbRowHtml(e,i)).join('');
}

function renderGlobalLb() {
  const rows = document.getElementById('lbRows');
  if (!fbReady()) { rows.innerHTML='<p style="text-align:center;color:var(--muted);padding:20px">⚠️ يتطلب اتصال Firebase</p>'; return; }
  rows.innerHTML='<p style="text-align:center;color:var(--muted);padding:20px">جارٍ التحميل…</p>';
  const note = '<div style="text-align:center;color:var(--muted);font-size:0.78rem;margin-bottom:10px">🗓️ ترتيب هذا الأسبوع — يتجدّد كل أسبوع</div>';
  fb.db.ref('leaderboard/'+isoWeekId()).orderByChild('score').limitToLast(50).once('value').then(snap=>{
    const arr=[]; snap.forEach(c=>{ arr.push(c.val()); });
    arr.sort((a,b)=>(b.score||0)-(a.score||0));
    if (!arr.length) { rows.innerHTML=note+'<p style="text-align:center;color:var(--muted);padding:20px">لا توجد نتائج هذا الأسبوع بعد — كن أول من يسجّل!</p>'; return; }
    rows.innerHTML = note + arr.map((e,i)=>lbRowHtml(e,i)).join('');
  }).catch(()=>{ rows.innerHTML='<p style="text-align:center;color:var(--wrong);padding:20px">تعذّر تحميل اللوحة العالمية</p>'; });
}

function closeLb() {
  document.getElementById('lbScreen').classList.remove('show');
  if (lbReturnTo === 'setupScreen') goToLanding();
  else document.getElementById('finalScreen').classList.add('show');
  lbReturnTo = 'finalScreen';
}
let shareVisible = false;
function buildShareText() {
  const sorted = [...PLAYERS].sort((a,b)=>scores[b.id]-scores[a.id]);
  const winner = sorted[0];
  const catName = selectedCatLabel();
  let txt = `🏆 ونيس — نتيجة اللعبة

`;
  txt += `🎯 الفئة: ${catName} | ${selectedCount} سؤال

`;
  sorted.forEach((p,i) => {
    const medals = ['🥇','🥈','🥉'];
    txt += `${medals[i]||'•'} ${p.avatar} ${p.name}: ${parseFloat(scores[p.id].toFixed(1))} نقطة
`;
  });
  txt += `
🎮 جرّب اللعبة أنت الآن!`;
  document.getElementById('shareText').innerText = txt;
}
function toggleShare() {
  shareVisible = !shareVisible;
  document.getElementById('shareSection').style.display = shareVisible ? 'block' : 'none';
}
function shareWhatsApp() {
  const txt = document.getElementById('shareText').innerText;
  window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}
function copyResult() {
  const txt = document.getElementById('shareText').innerText;
  navigator.clipboard.writeText(txt).then(()=>showToast('✅ تم النسخ!','var(--correct)')).catch(()=>showToast('⚠️ لم يتم النسخ','var(--wrong)'));
}
async function quickPlay() {
  if (!_questionsLoaded) { showToast('⏳ جاري تحميل الأسئلة…', 'var(--gold)'); await ensureQuestions(); }
  selectedCats = new Set(['all']);
  selectedDiffs = new Set(['all']);
  selectedCount = 5;
  playerCount = 1;
  gameMode = 'solo';
  const nameInput = document.getElementById('name0');
  if (nameInput && !nameInput.value.trim()) nameInput.value = 'أنت';
  goToOffline();
  setGameMode('solo');
  startGame();
  showToast('⚡ لعبة سريعة!', 'var(--gold)');
}
async function shareResultCard() {
  const sorted = [...PLAYERS].sort((a,b)=>scores[b.id]-scores[a.id]);
  const w = 720, h = 720;
  const cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#0f0f17'); g.addColorStop(1,'#1a1a26');
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 6;
  ctx.strokeRect(20,20,w-40,h-40);
  ctx.fillStyle = '#c9a84c'; ctx.textAlign = 'center'; ctx.direction = 'rtl';
  ctx.font = 'bold 56px "Tajawal","Cairo",sans-serif';
  ctx.fillText('🏆 ونيس', w/2, 110);
  ctx.font = '600 24px "Cairo",sans-serif'; ctx.fillStyle = '#777';
  ctx.fillText('نتيجة اللعبة', w/2, 150);
  const winner = sorted[0];
  ctx.font = 'bold 80px "Cairo",sans-serif'; ctx.fillStyle = '#e8e0d0';
  ctx.fillText(winner.avatar || '🏆', w/2, 250);
  ctx.font = 'bold 44px "Tajawal","Cairo",sans-serif'; ctx.fillStyle = winner.color || '#c9a84c';
  ctx.fillText(winner.name || 'الفائز', w/2, 320);
  ctx.font = 'bold 110px "Tajawal","Cairo",sans-serif'; ctx.fillStyle = '#c9a84c';
  ctx.fillText(String(parseFloat(scores[winner.id].toFixed(1))), w/2, 450);
  ctx.font = '600 28px "Cairo",sans-serif'; ctx.fillStyle = '#888';
  ctx.fillText('نقطة', w/2, 488);
  ctx.font = '600 24px "Cairo",sans-serif'; ctx.fillStyle = '#bbb';
  const catName = (typeof selectedCatLabel==='function'? selectedCatLabel() : 'الكل');
  ctx.fillText(catName + ' • ' + selectedCount + ' سؤال • ' + PLAYERS.length + ' لاعبين', w/2, 540);
  ctx.font = '600 22px "Cairo",sans-serif';
  const others = sorted.slice(1,4);
  others.forEach((p,i)=>{
    ctx.fillStyle = p.color || '#777';
    const line = (i+2) + '. ' + (p.avatar||'') + ' ' + p.name + '  —  ' + parseFloat(scores[p.id].toFixed(1));
    ctx.fillText(line, w/2, 590 + i*32);
  });
  ctx.font = 'bold 22px "Cairo",sans-serif'; ctx.fillStyle = '#c9a84c';
  ctx.fillText('nicktie.github.io/FirstGame', w/2, h-50);
  ctx.font = '600 16px "Cairo",sans-serif'; ctx.fillStyle = '#666';
  ctx.fillText('DALMOO3 DIGITAL PRODUCTS', w/2, h-26);
  cvs.toBlob(async (blob)=>{
    if (!blob) { showToast('⚠️ تعذّر توليد الصورة', 'var(--wrong)'); return; }
    try {
      const file = new File([blob], 'tahadi-result.png', { type:'image/png' });
      if (navigator.canShare && navigator.canShare({ files:[file] })) {
        await navigator.share({ files:[file], title:'نتيجتي في ونيس', text:'🏆 ونيس' });
        return;
      }
    } catch(e){}
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tahadi-result.png'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
    showToast('📸 تم تحميل الصورة', 'var(--correct)');
  }, 'image/png');
}
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB340BwmpiUKALuEAeYPn2IVJOeWRfBqb0",
  authDomain: "questionsgame-18d1a.firebaseapp.com",
  databaseURL: "https://questionsgame-18d1a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "questionsgame-18d1a",
  storageBucket: "questionsgame-18d1a.firebasestorage.app",
  messagingSenderId: "987065082442",
  appId: "1:987065082442:web:c10204ac327b1bfb447cb3"
};

let fb = { app:null, db:null };
let online = {
  code:null, isHost:false, playerId:null, name:null, timer:15, avatar:'🦁',
  questions:[], qIndex:0, count:0,
  playersRef:null, stateRef:null, listeners:[],
  qStartAt:0, answered:false, localTimerInt:null, hostTickTimeout:null,
  subMode:'classic',         // 'classic' | 'teams'
  teamNames:['الفريق الأزرق','الفريق الأحمر'],
  team:null,                 // my team idx (0|1) when teams mode
  startingTeam:0,            // who starts (revealed by spin)
  myLifelines:{l50:false,llucky:false,lfriend:false,jdouble:false},
  jokerActive:false          // double-points active for this question
};
let onlineSubMode = 'classic'; // host's create-panel choice
const ONLINE_BASE_PTS = 1000;
const ONLINE_REVEAL_MS = 5000;
const ONLINE_EMOJIS = ['🦁','🦊','🦅','🐯','🦄','🐼','🐸','🐵','🐲','🦖','😎','🤖','👻','🐱','🐶','🦉','🐺','🦝'];

function renderOnlineEmojiPicker() {
  const row = document.getElementById('onlineEmojiRow');
  if (!row) return;
  if (!ONLINE_EMOJIS.includes(online.avatar)) online.avatar = ONLINE_EMOJIS[Math.floor(Math.random()*ONLINE_EMOJIS.length)];
  row.innerHTML = '';
  ONLINE_EMOJIS.forEach(e => {
    const d = document.createElement('div');
    d.className = 'online-emoji' + (e===online.avatar ? ' sel' : '');
    d.textContent = e;
    d.onclick = () => { online.avatar = e; renderOnlineEmojiPicker(); };
    row.appendChild(d);
  });
}
let _adminSDKsPromise = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}
function loadAdminSDKs() {
  if (_adminSDKsPromise) return _adminSDKsPromise;
  _adminSDKsPromise = Promise.all([
    loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'),
    loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js')
  ]).catch(e => { _adminSDKsPromise = null; throw e; });
  return _adminSDKsPromise;
}

function fbReady() {
  if (!FIREBASE_CONFIG.databaseURL) return false;
  if (!fb.app) {
    try { fb.app = firebase.initializeApp(FIREBASE_CONFIG); fb.db = firebase.database(); }
    catch(e) { return false; }
  }
  if (!fb.auth && firebase.auth) { try { fb.auth = firebase.auth(); } catch(e){} }
  if (!fb.storage && firebase.storage) { try { fb.storage = firebase.storage(); } catch(e){} }
  return !!fb.db;
}

function ensureFirebase() {
  if (!FIREBASE_CONFIG.databaseURL) {
    showToast('⚠️ لم يتم ضبط إعدادات Firebase بعد', 'var(--wrong)');
    return false;
  }
  if (!fbReady()) { showToast('⚠️ فشل الاتصال بـ Firebase', 'var(--wrong)'); return false; }
  return true;
}
let presenceId = null;
let _presenceAttached = false;
function getPresenceId() {
  if (presenceId) return presenceId;
  try { presenceId = sessionStorage.getItem('quizPresenceId'); } catch(e){}
  if (!presenceId) {
    presenceId = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try { sessionStorage.setItem('quizPresenceId', presenceId); } catch(e){}
  }
  return presenceId;
}
function setupPresence() {
  if (_presenceAttached) return;
  if (!fbReady()) return;
  _presenceAttached = true;
  const id = getPresenceId();
  const myRef = fb.db.ref('rooms/_p/'+id);
  const allRef = fb.db.ref('rooms/_p');
  const TWO_MIN = 2 * 60 * 1000;
  try {
    fb.db.ref('.info/connected').on('value', snap => {
      if (snap.val() === true) {
        try { myRef.onDisconnect().remove(); } catch(e){}
        try { myRef.set(firebase.database.ServerValue.TIMESTAMP); } catch(e){}
      }
    });
    setInterval(() => { try { myRef.set(firebase.database.ServerValue.TIMESTAMP); } catch(e){} }, 45000);
    allRef.on('value', snap => {
      const all = snap.val() || {};
      const now = Date.now();
      let count = 0;
      Object.keys(all).forEach(k => {
        const ts = all[k];
        if (typeof ts === 'number' && (now - ts) < TWO_MIN) count++;
      });
      const el = document.getElementById('presenceCounter');
      const numEl = document.getElementById('presenceCount');
      if (numEl) numEl.textContent = count;
      if (el) el.style.display = count > 0 ? 'inline-block' : 'none';
    });
  } catch(e){}
}
function tryAttachPresence(retries) {
  if (fbReady()) { setupPresence(); return; }
  if (retries <= 0) return;
  setTimeout(()=>tryAttachPresence(retries-1), 500);
}
window.addEventListener('DOMContentLoaded', () => tryAttachPresence(20));

function setOnlineTimer(secs, el) {
  online.timer = secs;
  document.querySelectorAll('#onlineTimerOpts .timer-opt').forEach(o=>o.classList.remove('active'));
  if (el) el.classList.add('active');
  updateOnlineAccSummaries();
}

function toggleOnlineAcc(key) {
  const map = { timer:'accTimer', cats:'accCats', diff:'accDiff', count:'accCount' };
  const el = document.getElementById(map[key]); if (!el) return;
  el.classList.toggle('open');
  try {
    const open = {};
    Object.entries(map).forEach(([k,id])=>{ open[k] = document.getElementById(id).classList.contains('open'); });
    localStorage.setItem('tahadi_acc_open', JSON.stringify(open));
  } catch(e){}
}

function restoreOnlineAccState() {
  try {
    const raw = localStorage.getItem('tahadi_acc_open');
    if (!raw) return;
    const open = JSON.parse(raw);
    const map = { timer:'accTimer', cats:'accCats', diff:'accDiff', count:'accCount' };
    Object.entries(map).forEach(([k,id])=>{
      const el = document.getElementById(id);
      if (el) el.classList.toggle('open', !!open[k]);
    });
  } catch(e){}
}

function updateOnlineAccSummaries() {
  const tEl = document.getElementById('accSumTimer');
  if (tEl) tEl.textContent = (online.timer || 15) + ' ث';
  const cEl = document.getElementById('accSumCats');
  if (cEl && typeof selectedCats !== 'undefined') {
    let txt;
    if (selectedCats.has('all')) {
      const all = (typeof allQuestions !== 'undefined') ? allQuestions.filter(q=>q.cat!=='custom').length : 0;
      txt = 'الكل' + (all ? ' (' + all + ')' : '');
    } else {
      const keys = [...selectedCats];
      const total = (typeof getCatPool === 'function') ? getCatPool().length : 0;
      if (keys.length === 1) {
        const k = keys[0];
        const lbl = (catLabels && catLabels[k]) ? catLabels[k].label : k;
        txt = lbl + (total ? ' (' + total + ')' : '');
      } else {
        txt = keys.length + ' فئات' + (total ? ' (' + total + ')' : '');
      }
    }
    cEl.textContent = txt;
  }
  const dEl = document.getElementById('accSumDiff');
  if (dEl && typeof selectedDiffs !== 'undefined') {
    const lbls = { easy:'🟢 سهل', medium:'🟡 متوسط', hard:'🔴 صعب', veryhard:'💎 صعب جداً' };
    if (selectedDiffs.has('all')) dEl.textContent = 'الكل';
    else {
      const keys = [...selectedDiffs];
      dEl.textContent = keys.length===1 ? (lbls[keys[0]]||keys[0]) : (keys.length + ' مستويات');
    }
  }
  const nEl = document.getElementById('accSumCount');
  if (nEl) nEl.textContent = (selectedCount || 5) + ' أسئلة';
}
function genCode() { return String(Math.floor(100000 + Math.random()*900000)); }
function uid() { return 'p' + Math.random().toString(36).slice(2,9); }

function showOnlineStage(which) {
  ['onlineLobby','onlineQuestion','onlineReveal','onlineFinal'].forEach(id=>{
    document.getElementById(id).style.display = (id===which) ? 'block' : 'none';
  });
}
function enterOnlineScreen() {
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('landingScreen').style.display='none';
  document.getElementById('gameScreen').style.display='none';
  document.getElementById('finalScreen').classList.remove('show');
  document.getElementById('onlineScreen').style.display='block';
}

function setOnlineSubMode(m) {
  onlineSubMode = m;
  document.getElementById('submodeClassicCard').classList.toggle('active', m==='classic');
  document.getElementById('submodeTeamsCard').classList.toggle('active', m==='teams');
  document.getElementById('onlineTeamNames').style.display = m==='teams' ? 'block' : 'none';
}

async function createRoom() {
  if (!ensureFirebase()) return;
  if (!_questionsLoaded) { showToast('⏳ جاري تحميل الأسئلة…', 'var(--gold)'); await ensureQuestions(); }
  const name = (document.getElementById('hostName').value.trim()) || 'المضيف';
  let pool = getCatPool();
  pool = applyDiffFilter(pool);
  pool = deprioritizeRecent(shuffle(pool)).slice(0, selectedCount);
  if (!pool.length) { showToast('⚠️ لا توجد أسئلة كافية', 'var(--wrong)'); return; }

  const code = genCode();
  const isTeams = onlineSubMode === 'teams';
  const teamNames = isTeams ? [
    (document.getElementById('onlineTeam0Name').value.trim() || 'الفريق الأزرق'),
    (document.getElementById('onlineTeam1Name').value.trim() || 'الفريق الأحمر')
  ] : ['الفريق الأزرق','الفريق الأحمر'];
  Object.assign(online, { code, isHost:true, playerId:uid(), name, questions:pool, count:pool.length, qIndex:0, subMode: isTeams?'teams':'classic', teamNames, team: isTeams?0:null, jokerActive:false, myLifelines:{l50:false,llucky:false,lfriend:false,jdouble:false} });
  const roomRef = fb.db.ref('rooms/'+code);
  await roomRef.set({
    meta:{ status:'lobby', mode: isTeams?'teams':'classic', teamNames, timer:online.timer, count:pool.length, createdAt:firebase.database.ServerValue.TIMESTAMP },
    state:{ phase:'lobby', qIndex:0 }
  });
  const playerRec = { name, avatar:online.avatar, score:0, joinedAt:firebase.database.ServerValue.TIMESTAMP };
  if (isTeams) playerRec.team = 0;
  await roomRef.child('players/'+online.playerId).set(playerRec);
  attachRoomListeners(code);
  saveOnlineSession();
  enterOnlineScreen(); showOnlineStage('onlineLobby');
  document.getElementById('roomCodeDisplay').textContent = code;
  document.getElementById('lobbyHostControls').style.display = 'block';
  document.getElementById('lobbyWaitNote').style.display = 'none';
}

async function joinRoom() {
  if (!ensureFirebase()) return;
  const name = document.getElementById('joinName').value.trim();
  const code = document.getElementById('joinCode').value.trim();
  if (!name) { showToast('⚠️ اكتب اسمك', 'var(--wrong)'); return; }
  if (!/^\d{6}$/.test(code)) { showToast('⚠️ الرمز 6 أرقام', 'var(--wrong)'); return; }
  const roomRef = fb.db.ref('rooms/'+code);
  const snap = await roomRef.child('meta').once('value');
  if (!snap.exists()) { showToast('⚠️ غرفة غير موجودة', 'var(--wrong)'); return; }
  const meta = snap.val();
  if (meta.status!=='lobby') { showToast('⚠️ اللعبة بدأت بالفعل', 'var(--wrong)'); return; }
  const isTeams = meta.mode === 'teams';
  // Joiners now pick their own team after entering the lobby (team:null = unpicked)
  Object.assign(online, { code, isHost:false, playerId:uid(), name, timer:meta.timer||15, count:meta.count||0, subMode: isTeams?'teams':'classic', teamNames: meta.teamNames || online.teamNames, team: null, jokerActive:false, myLifelines:{l50:false,llucky:false,lfriend:false,jdouble:false} });
  const pRef = roomRef.child('players/'+online.playerId);
  const rec = { name, avatar:online.avatar, score:0, joinedAt:firebase.database.ServerValue.TIMESTAMP };
  if (isTeams) rec.team = null;
  await pRef.set(rec);
  attachRoomListeners(code);
  saveOnlineSession();
  enterOnlineScreen(); showOnlineStage('onlineLobby');
  document.getElementById('roomCodeDisplay').textContent = code;
  document.getElementById('lobbyHostControls').style.display = 'none';
  document.getElementById('lobbyWaitNote').style.display = 'block';
}

function attachRoomListeners(code) {
  startRoomHeartbeat('', code);
  const roomRef = fb.db.ref('rooms/'+code);
  online.playersRef = roomRef.child('players');
  online.stateRef = roomRef.child('state');
  const pl = online.playersRef.on('value', snap=>{
    const players = snap.val() || {};
    renderLobbyPlayers(players);
    renderLeaderboard(players);
  });
  const st = online.stateRef.on('value', snap=>{
    const s = snap.val(); if (s) onStateChange(s);
  });
  online.listeners.push(()=>online.playersRef.off('value', pl));
  online.listeners.push(()=>online.stateRef.off('value', st));
  const reactionsRef = roomRef.child('reactions');
  const joinedAt = Date.now();
  const rxHandler = reactionsRef.limitToLast(20).on('child_added', snap=>{
    const r = snap.val(); if (!r || !r.emoji) return;
    if (r.from === online.playerId) return; // skip my own (I see it locally on tap)
    if (r.ts && r.ts < joinedAt - 1500) return; // skip old ones from before join
    spawnReaction(r.emoji);
  });
  online.listeners.push(()=>reactionsRef.off('child_added', rxHandler));
}

function sendReaction(emoji) {
  spawnReaction(emoji); // immediate local feedback
  if (!fbReady() || !online.code) return;
  try {
    fb.db.ref('rooms/'+online.code+'/reactions').push({ emoji, from: online.playerId||'?', ts: firebase.database.ServerValue.TIMESTAMP });
  } catch(e){}
}

function spawnReaction(emoji) {
  const layer = document.getElementById('reactionsLayer'); if (!layer) return;
  const el = document.createElement('div');
  el.className = 'float-reaction';
  el.textContent = emoji;
  el.style.left = (10 + Math.random()*80) + '%';
  layer.appendChild(el);
  setTimeout(()=>{ try{ el.remove(); }catch(e){} }, 2800);
}

async function setMyTeam(team) {
  if (!online.code || !online.playerId) return;
  if (team !== 0 && team !== 1) return;
  online.team = team;
  try {
    await fb.db.ref('rooms/' + online.code + '/players/' + online.playerId + '/team').set(team);
  } catch(e) {
    showToast('⚠️ تعذّر تحديث الفريق', 'var(--wrong)');
  }
}
async function hostMovePlayer(playerId, toTeam) {
  if (!online.isHost) return;
  if (toTeam !== 0 && toTeam !== 1) return;
  try {
    await fb.db.ref('rooms/' + online.code + '/players/' + playerId + '/team').set(toTeam);
  } catch(e) {
    showToast('⚠️ تعذّر تبديل الفريق', 'var(--wrong)');
  }
}
async function hostBalanceTeams() {
  if (!online.isHost) return;
  const snap = await fb.db.ref('rooms/' + online.code + '/players').once('value');
  const players = snap.val() || {};
  // Shuffle player ids and re-deal alternately so teams come out balanced
  const ids = Object.keys(players);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const updates = {};
  ids.forEach((id, i) => { updates['rooms/' + online.code + '/players/' + id + '/team'] = i % 2; });
  try { await fb.db.ref().update(updates); showToast('🔀 تم خلط الفرق', 'var(--gold)'); }
  catch(e) { showToast('⚠️ تعذّر خلط الفرق', 'var(--wrong)'); }
}
function renderLobbyPlayers(players) {
  const ids = Object.keys(players);
  document.getElementById('lobbyCount').textContent = ids.length;
  const flat = document.getElementById('lobbyPlayers');
  const teamsBox = document.getElementById('lobbyTeams');
  const teamPicker = document.getElementById('lobbyTeamPicker');
  const hostTools = document.getElementById('lobbyHostTeamTools');
  if (online.subMode === 'teams') {
    flat.style.display = 'none';
    teamsBox.style.display = 'flex';
    const tn0 = (online.teamNames && online.teamNames[0]) || 'الفريق الأزرق';
    const tn1 = (online.teamNames && online.teamNames[1]) || 'الفريق الأحمر';
    document.getElementById('lobbyT0Name').textContent = tn0;
    document.getElementById('lobbyT1Name').textContent = tn1;
    const c0 = document.getElementById('lobbyT0Players'); c0.innerHTML = '';
    const c1 = document.getElementById('lobbyT1Players'); c1.innerHTML = '';
    const unassigned = document.getElementById('lobbyUnassigned');
    if (unassigned) { unassigned.innerHTML = ''; unassigned.style.display = 'none'; }
    let unassignedCount = 0;
    ids.forEach(id => {
      const p = players[id];
      const chip = document.createElement('div'); chip.className = 'lobby-player-chip';
      if (id === online.playerId) chip.classList.add('me');
      const av = p.name === 'سهى' ? '❤️' : (p.avatar || '🙂');
      chip.textContent = av + ' ' + p.name + (id === online.playerId ? ' (أنت)' : '');
      // Host can click any chip to swap that player to the opposite team
      if (online.isHost && id !== online.playerId) {
        chip.classList.add('swappable');
        chip.title = 'انقر للتبديل بين الفريقين';
        chip.onclick = () => hostMovePlayer(id, p.team === 0 ? 1 : 0);
      }
      if (p.team === 0) c0.appendChild(chip);
      else if (p.team === 1) c1.appendChild(chip);
      else { unassignedCount++; if (unassigned) { chip.classList.add('unassigned'); unassigned.appendChild(chip); } }
    });
    if (unassigned && unassignedCount > 0) unassigned.style.display = 'flex';
    // Show team picker for the current player if they haven't picked yet
    const me = players[online.playerId];
    if (teamPicker) {
      if (me && (me.team === null || me.team === undefined)) {
        teamPicker.style.display = 'flex';
        document.getElementById('lobbyPickT0').textContent = '🔵 ' + tn0;
        document.getElementById('lobbyPickT1').textContent = '🔴 ' + tn1;
      } else {
        teamPicker.style.display = 'none';
      }
    }
    // Show host balancing tools only to the host, only when 2+ players are around
    if (hostTools) hostTools.style.display = (online.isHost && ids.length >= 2) ? 'flex' : 'none';
  } else {
    teamsBox.style.display = 'none';
    if (teamPicker) teamPicker.style.display = 'none';
    if (hostTools) hostTools.style.display = 'none';
    flat.style.display = 'flex';
    flat.innerHTML = '';
    ids.forEach(id => {
      const chip = document.createElement('div');
      chip.className = 'lobby-player-chip';
      const av = players[id].name === 'سهى' ? '❤️' : (players[id].avatar || '🙂');
      chip.textContent = av + ' ' + players[id].name + (id === online.playerId ? ' (أنت)' : '');
      flat.appendChild(chip);
    });
  }
}

function onStateChange(s) {
  if (typeof s.startingTeam === 'number') online.startingTeam = s.startingTeam;
  if (s.phase==='lobby') showOnlineStage('onlineLobby');
  else if (s.phase==='spin') showSpinTeams(s);
  else if (s.phase==='question') { online.qIndex = s.qIndex; showQuestion(s); }
  else if (s.phase==='reveal') showReveal(s);
  else if (s.phase==='final') showOnlineFinalStage();
}

async function hostStartGame() {
  if (!online.isHost) return;
  if (online.subMode === 'teams') {
    // Make sure everyone has picked a team — otherwise the spinner / scoring breaks
    const snap = await fb.db.ref('rooms/'+online.code+'/players').once('value');
    const players = snap.val() || {};
    const ids = Object.keys(players);
    if (ids.length < 2) {
      showToast('⚠️ تحتاج لاعبين على الأقل لبدء اللعبة', 'var(--wrong)');
      return;
    }
    const unpicked = ids.filter(id => players[id].team !== 0 && players[id].team !== 1);
    if (unpicked.length) {
      const names = unpicked.map(id => players[id].name || '?').join('، ');
      showToast('⚠️ هؤلاء لم يختاروا فريقاً: ' + names, 'var(--wrong)');
      return;
    }
    // Both teams need at least one player
    const c0 = ids.filter(id => players[id].team === 0).length;
    const c1 = ids.filter(id => players[id].team === 1).length;
    if (c0 === 0 || c1 === 0) {
      showToast('⚠️ كل فريق يحتاج لاعب واحد على الأقل', 'var(--wrong)');
      return;
    }
  }
  await fb.db.ref('rooms/'+online.code+'/meta/status').set('active');
  if (online.subMode === 'teams') {
    online.startingTeam = Math.random() < 0.5 ? 0 : 1;
    await fb.db.ref('rooms/'+online.code+'/state').set({ phase:'spin', startingTeam: online.startingTeam });
    clearTimeout(online.hostTickTimeout);
    online.hostTickTimeout = setTimeout(()=>hostBroadcastQuestion(0), 3200);
  } else {
    hostBroadcastQuestion(0);
  }
}

async function hostBroadcastQuestion(i) {
  if (!online.isHost) return;
  online.qIndex = i;
  saveOnlineSession();
  const q = online.questions[i];
  await fb.db.ref('rooms/'+online.code+'/answers/'+i).remove();
  const state = {
    phase:'question', qIndex:i,
    current:{ q:q.q, opts:q.opts, cat:q.cat, img:q.img||null },
    startAt: firebase.database.ServerValue.TIMESTAMP
  };
  if (online.subMode === 'teams') {
    state.startingTeam = online.startingTeam;
    state.activeTeam = (online.startingTeam + i) % 2;
    const plSnap = await fb.db.ref('rooms/'+online.code+'/players').once('value');
    const players = plSnap.val() || {};
    const teamPids = Object.keys(players).filter(pid => players[pid].team === state.activeTeam);
    state.activePid = teamPids.length ? teamPids[Math.floor(Math.random()*teamPids.length)] : null;
    state.activeName = state.activePid ? (players[state.activePid].name || '') : '';
    state.current.ans = q.ans; // so the active player's lifelines can work
  }
  await fb.db.ref('rooms/'+online.code+'/state').set(state);
  clearTimeout(online.hostTickTimeout);
  online.hostTickTimeout = setTimeout(()=>hostReveal(i), online.timer*1000 + 700);
}

async function hostReveal(i) {
  if (!online.isHost) return;
  const q = online.questions[i];
  const ansSnap = await fb.db.ref('rooms/'+online.code+'/answers/'+i).once('value');
  const ans = ansSnap.val() || {};
  const plSnap = await fb.db.ref('rooms/'+online.code+'/players').once('value');
  const players = plSnap.val() || {};
  const stSnap = await fb.db.ref('rooms/'+online.code+'/state').once('value');
  const st = stSnap.val() || {};
  const updates = {};
  const dist = [0,0,0];

  if (online.subMode === 'teams') {
    const activePid = st.activePid;
    const a = activePid ? ans[activePid] : null;
    if (a && typeof a.choice==='number' && a.choice>=0 && a.choice<dist.length) dist[a.choice]++;
    let pts = 0;
    if (a && a.choice===q.ans) pts = a.joker ? 20 : 10;
    if (activePid) {
      updates['players/'+activePid+'/score'] = (players[activePid].score||0) + pts;
      updates['answers/'+i+'/'+activePid+'/correct'] = a ? (a.choice===q.ans) : false;
      updates['answers/'+i+'/'+activePid+'/pts'] = pts;
    }
  } else {
    Object.keys(players).forEach(pid=>{
      const a = ans[pid];
      let pts = 0;
      if (a && typeof a.choice==='number' && a.choice>=0 && a.choice<dist.length) dist[a.choice]++;
      if (a && a.choice===q.ans) {
        const frac = Math.max(0, Math.min(1, 1 - (a.timeMs/(online.timer*1000))));
        pts = Math.round(ONLINE_BASE_PTS*0.5 + ONLINE_BASE_PTS*0.5*frac);
      }
      updates['players/'+pid+'/score'] = (players[pid].score||0) + pts;
      updates['answers/'+i+'/'+pid+'/correct'] = a ? (a.choice===q.ans) : false;
      updates['answers/'+i+'/'+pid+'/pts'] = pts;
    });
  }
  await fb.db.ref('rooms/'+online.code).update(updates);
  await fb.db.ref('rooms/'+online.code+'/state').update({ phase:'reveal', ans:q.ans, dist });
  clearTimeout(online.hostTickTimeout);
  online.hostTickTimeout = setTimeout(()=>{
    if (i+1 < online.count) hostBroadcastQuestion(i+1);
    else fb.db.ref('rooms/'+online.code+'/state').update({ phase:'final' });
  }, ONLINE_REVEAL_MS);
}

function showQuestion(s) {
  showOnlineStage('onlineQuestion');
  online.answered = false;
  online.qStartAt = Date.now();
  online.jokerActive = false;
  online.myLifelines = { l50:false, llucky:false, lfriend:false, jdouble:false };
  const cur = s.current || {};
  document.getElementById('onlineQNum').textContent = `السؤال ${s.qIndex+1} من ${online.count}`;
  document.getElementById('onlineCat').textContent = catLabels[cur.cat] ? catLabels[cur.cat].label : '';
  document.getElementById('onlineQText').textContent = cur.q || '';
  pushRecentQuestion(cur.q);
  const oImg = document.getElementById('onlineQImage');
  if (cur.img) { oImg.src = cur.img; oImg.style.display='block'; } else { oImg.style.display='none'; oImg.src=''; }
  const isTeams = online.subMode === 'teams';
  const amActive = isTeams ? (s.activePid === online.playerId) : true;
  const banner = document.getElementById('onlineTeamTurn');
  if (isTeams) {
    const teamIdx = (typeof s.activeTeam === 'number') ? s.activeTeam : 0;
    const teamName = (online.teamNames && online.teamNames[teamIdx]) || (teamIdx===0?'الفريق الأزرق':'الفريق الأحمر');
    banner.className = 'team-turn-banner t' + teamIdx;
    banner.style.display = 'flex';
    const activeName = s.activeName || '';
    const myTurnText = amActive ? '🎯 دورك! جاوب الآن'
      : (activeName ? '⏳ دور ' + activeName + ' (' + teamName + ')' : '⏳ دور ' + teamName);
    banner.innerHTML = '<span>' + (teamIdx===0?'🔵':'🔴') + '</span><span>' + myTurnText + '</span>';
  } else {
    banner.style.display = 'none';
  }
  const box = document.getElementById('onlineOptions'); box.innerHTML='';
  (cur.opts||[]).forEach((opt,idx)=>{
    const d = document.createElement('div');
    d.className = 'online-opt oc'+idx + (isTeams && !amActive ? ' spectating' : '');
    d.textContent = opt;
    if (amActive) d.onclick = ()=>submitOnlineAnswer(idx, d);
    box.appendChild(d);
  });
  const llRow = document.getElementById('onlineLifelinesRow');
  if (isTeams && amActive) {
    online._onlineQAns = (typeof cur.ans === 'number') ? cur.ans : null;
    renderOnlineLifelines();
  } else {
    llRow.style.display = 'none'; llRow.innerHTML = '';
  }
  document.getElementById('onlineStatus').textContent = '';
  startOnlineCountdown();
}

function renderOnlineLifelines() {
  const row = document.getElementById('onlineLifelinesRow'); if (!row) return;
  const u = online.myLifelines || {};
  const items = [
    {k:'l50',     emoji:'🪓', label:'٥٠:٥٠', fn:'useOnlineLifeline50()'},
    {k:'llucky',  emoji:'🎲', label:'حظ',     fn:'useOnlineLifelineLucky()'},
    {k:'lfriend', emoji:'📞', label:'صديق',   fn:'useOnlineLifelineFriend()'},
    {k:'jdouble', emoji:'🃏', label:'جوكر ×2', fn:'useOnlineLifelineJoker()'}
  ];
  row.innerHTML = items.map(it =>
    `<button class="lifeline-btn${u[it.k]?' used':''}" ${u[it.k]?'disabled':''} onclick="${it.fn}">
      <span class="ll-emoji">${it.emoji}</span><span class="ll-label">${it.label}</span>
     </button>`
  ).join('');
  row.style.display = 'flex';
}

function _markOnlineLL(k) { if (!online.myLifelines) online.myLifelines = {}; if (online.myLifelines[k]) return false; online.myLifelines[k] = true; return true; }
function useOnlineLifeline50() {
  if (!_markOnlineLL('l50')) return;
  const ans = online._onlineQAns;
  if (typeof ans !== 'number') { renderOnlineLifelines(); return; }
  const wrongs = [0,1,2].filter(i => i !== ans);
  const toHide = wrongs[Math.floor(Math.random()*wrongs.length)];
  const el = document.getElementById('onlineOptions').children[toHide];
  if (el) { el.classList.add('lifeline-hidden'); el.onclick = null; }
  renderOnlineLifelines();
}
function useOnlineLifelineLucky() {
  if (!_markOnlineLL('llucky')) return;
  const kids = [...document.getElementById('onlineOptions').children];
  const visible = kids.map((el,i)=>el.classList.contains('lifeline-hidden')?-1:i).filter(i=>i>=0);
  if (!visible.length) { renderOnlineLifelines(); return; }
  const pick = visible[Math.floor(Math.random()*visible.length)];
  const el = kids[pick];
  if (el) submitOnlineAnswer(pick, el);
  renderOnlineLifelines();
}
function useOnlineLifelineFriend() {
  if (!_markOnlineLL('lfriend')) return;
  const ans = online._onlineQAns;
  const letters = ['أ','ب','ج'];
  let hintIdx = ans;
  if (typeof ans === 'number') {
    const goodChance = Math.random() < 0.8;
    if (!goodChance) {
      const wrongs = [0,1,2].filter(i => i !== ans);
      hintIdx = wrongs[Math.floor(Math.random()*wrongs.length)];
    }
  } else {
    hintIdx = Math.floor(Math.random()*3);
  }
  showToast('📞 صديقك يهمس: الجواب على الأرجح "' + letters[hintIdx] + '"', 'var(--gold)');
  renderOnlineLifelines();
}
function useOnlineLifelineJoker() {
  if (!_markOnlineLL('jdouble')) return;
  online.jokerActive = true;
  showToast('🃏 جوكر مفعّل! النقاط ×٢ لهذا السؤال', 'var(--gold)');
  renderOnlineLifelines();
}

function showSpinTeams(s) {
  showOnlineStage('onlineLobby'); // stay on lobby visually
  const winner = s.startingTeam || 0;
  const overlay = document.createElement('div'); overlay.className = 'spin-team-overlay'; overlay.id = 'spinTeamOverlay';
  const title = document.createElement('div'); title.className = 'spin-team-title'; title.textContent = '🎲 الحظ يقرّر من يبدأ…';
  const pill = document.createElement('div'); pill.className = 'spin-team-pill';
  overlay.appendChild(title); overlay.appendChild(pill);
  document.body.appendChild(overlay);
  const tn = online.teamNames || ['الفريق الأزرق','الفريق الأحمر'];
  let n = 0;
  const flicker = setInterval(()=>{
    const t = n % 2;
    pill.textContent = t===0 ? '🔵 ' + tn[0] : '🔴 ' + tn[1];
    pill.style.borderColor = t===0 ? '#6495ed' : '#e07050';
    pill.style.color = t===0 ? '#6495ed' : '#e07050';
    pill.style.boxShadow = '0 0 32px ' + (t===0 ? 'rgba(100,149,237,0.5)' : 'rgba(224,112,80,0.5)');
    n++;
  }, 120);
  setTimeout(()=>{
    clearInterval(flicker);
    pill.textContent = (winner===0 ? '🔵 ' : '🔴 ') + tn[winner] + ' يبدأ!';
    pill.style.borderColor = winner===0 ? '#6495ed' : '#e07050';
    pill.style.color = winner===0 ? '#6495ed' : '#e07050';
    pill.style.transform = 'scale(1.1)';
  }, 2400);
  setTimeout(()=>{ try { overlay.remove(); } catch(e){} }, 3200);
}

function startOnlineCountdown() {
  clearInterval(online.localTimerInt);
  const tEl = document.getElementById('onlineTimer');
  let left = online.timer;
  tEl.textContent = left; tEl.classList.remove('low');
  online.localTimerInt = setInterval(()=>{
    left--; tEl.textContent = Math.max(0,left);
    if (left<=5) tEl.classList.add('low');
    if (left<=0) { clearInterval(online.localTimerInt); lockOnlineOptions(); }
  }, 1000);
}
function lockOnlineOptions() {
  document.querySelectorAll('#onlineOptions .online-opt').forEach(o=>o.classList.add('disabled'));
}
function submitOnlineAnswer(idx, el) {
  if (online.answered) return;
  online.answered = true;
  const timeMs = Date.now() - online.qStartAt;
  el.classList.add('picked');
  lockOnlineOptions();
  document.getElementById('onlineStatus').textContent = '✅ تم تسجيل إجابتك… في انتظار البقية';
  const rec = { choice:idx, timeMs };
  if (online.subMode === 'teams' && online.jokerActive) rec.joker = true;
  fb.db.ref('rooms/'+online.code+'/answers/'+online.qIndex+'/'+online.playerId).set(rec);
  const llRow = document.getElementById('onlineLifelinesRow'); if (llRow) llRow.style.display = 'none';
}

function showReveal(s) {
  clearInterval(online.localTimerInt);
  showOnlineStage('onlineReveal');
  const opts = (s.current && s.current.opts) || [];
  const dist = s.dist || [];
  const total = dist.reduce((a,b)=>a+b,0) || 0;
  const distBox = document.getElementById('onlineDist');
  distBox.innerHTML = '';
  const letters = ['أ','ب','ج','د'];
  opts.forEach((opt,idx)=>{
    const count = dist[idx] || 0;
    const pct = total ? Math.round(count/total*100) : 0;
    const isCorrect = idx === s.ans;
    const row = document.createElement('div');
    row.className = 'odist-row' + (isCorrect ? ' correct' : '');
    row.innerHTML = `<div class="odist-fill" style="width:${pct}%"></div>`
      + `<div class="odist-content"><div class="odist-mark">${isCorrect?'✅':letters[idx]}</div>`
      + `<div class="odist-text">${opt}</div><div class="odist-count">${count}</div></div>`;
    distBox.appendChild(row);
  });
  fb.db.ref('rooms/'+online.code+'/answers/'+online.qIndex+'/'+online.playerId).once('value').then(snap=>{
    const a = snap.val();
    const head = document.getElementById('onlineRevealHead');
    if (a && a.correct) {
      head.className='online-reveal-head good'; head.textContent=`✅ إجابة صحيحة! +${a.pts||0}`;
      try { soundCorrect(); } catch(e){}
    } else {
      head.className='online-reveal-head bad'; head.textContent = a ? '❌ إجابة خاطئة' : '⌛ لم تجب في الوقت';
      try { soundWrong(); } catch(e){}
    }
  });
}

function renderLeaderboard(players) {
  const box = document.getElementById('onlineLeaderboard'); if (!box) return;
  const arr = Object.keys(players).map(id=>({id, ...players[id]})).sort((a,b)=>(b.score||0)-(a.score||0));
  box.innerHTML='';
  arr.forEach((p,i)=>{
    const row = document.createElement('div');
    row.className = 'olb-row' + (p.id===online.playerId?' me':'');
    const av = p.name==='سهى' ? '❤️' : (p.avatar || '🙂');
    row.innerHTML = `<div class="olb-rank">${i+1}</div><div class="olb-name">${av} ${p.name}</div><div class="olb-score">${p.score||0}</div>`;
    box.appendChild(row);
  });
}

async function showOnlineFinalStage() {
  clearInterval(online.localTimerInt);
  clearOnlineSession();
  if (online.isHost && online.code) { try { fb.db.ref('rooms/'+online.code+'/reactions').remove(); } catch(e){} }
  showOnlineStage('onlineFinal');
  const snap = await fb.db.ref('rooms/'+online.code+'/players').once('value');
  const players = snap.val() || {};
  const arr = Object.keys(players).map(id=>({id, ...players[id]})).sort((a,b)=>(b.score||0)-(a.score||0));
  const podium = document.getElementById('onlinePodium'); podium.innerHTML='';
  const rows = document.getElementById('onlineFinalRows'); rows.innerHTML='';
  if (online.subMode === 'teams') {
    const t0Total = arr.filter(p=>p.team===0).reduce((s,p)=>s+(p.score||0),0);
    const t1Total = arr.filter(p=>p.team===1).reduce((s,p)=>s+(p.score||0),0);
    const tn = online.teamNames || ['الفريق الأزرق','الفريق الأحمر'];
    const winnerIdx = t0Total>t1Total ? 0 : t1Total>t0Total ? 1 : -1;
    [{idx:0,total:t0Total,color:'#6495ed',emoji:'🔵'},{idx:1,total:t1Total,color:'#e07050',emoji:'🔴'}].forEach(t=>{
      const winnerBadge = winnerIdx === t.idx ? '🏆' : '🥈';
      const item=document.createElement('div'); item.className='podium-item';
      item.innerHTML=`<div class="podium-block" style="height:160px;background:${t.color}14;border:1px solid ${t.color}55"><div class="podium-emoji">${winnerBadge}</div></div><div class="podium-name" style="color:${t.color}">${t.emoji} ${tn[t.idx]}</div><div class="podium-score" style="color:${t.color}">${t.total}</div><div class="podium-score-lbl">نقطة</div>`;
      podium.appendChild(item);
    });
    arr.forEach(p=>{
      const tColor = p.team===1 ? '#e07050' : '#6495ed';
      const row=document.createElement('div'); row.className='final-row'; row.style.borderColor = tColor+'66';
      row.innerHTML=`<div class="final-rank-badge" style="background:${tColor}22;color:${tColor}">${p.team===1?'🔴':'🔵'}</div><div class="fr-name" style="flex:1;font-weight:700;color:${tColor}">${p.avatar||'🙂'} ${p.name}</div><div class="fr-score" style="font-family:'Tajawal',sans-serif;font-size:1.2rem;font-weight:900;color:var(--gold)">${p.score||0}</div>`;
      rows.appendChild(row);
    });
    if (winnerIdx >= 0) showToast('🏆 الفائز: ' + tn[winnerIdx], winnerIdx===0?'#6495ed':'#e07050');
    else showToast('🤝 تعادل بين الفريقين!', 'var(--gold)');
  } else {
    const medals=['🥇','🥈','🥉']; const heights=[120,160,90];
    const top = arr.slice(0,3);
    const disp = top.length===1?[top[0]] : top.length===2?[top[1],top[0]] : [top[1],top[0],top[2]];
    const rmap = top.length===1?[0] : top.length===2?[1,0] : [1,0,2];
    disp.forEach((p,pos)=>{
      if(!p) return; const rank=rmap[pos];
      const item=document.createElement('div'); item.className='podium-item';
      item.innerHTML=`<div class="podium-block" style="height:${heights[pos]||90}px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25)"><div class="podium-emoji">${medals[rank]||'🏅'}</div></div><div class="podium-name">${p.name}</div><div class="podium-score">${p.score||0}</div><div class="podium-score-lbl">نقطة</div>`;
      podium.appendChild(item);
    });
    arr.forEach((p,i)=>{
      const row=document.createElement('div'); row.className='final-row';
      row.innerHTML=`<div class="final-rank-badge">${medals[i]||'🏅'}</div><div class="fr-name" style="flex:1;font-weight:700">${p.name}</div><div class="fr-score" style="font-family:'Tajawal',sans-serif;font-size:1.2rem;font-weight:900;color:var(--gold)">${p.score||0}</div>`;
      rows.appendChild(row);
    });
  }
  try { if (typeof launchConfetti==='function') launchConfetti(); } catch(e){}
  const btn = document.getElementById('onlineRematchBtn');
  const wait = document.getElementById('onlineRematchWait');
  if (btn && wait) {
    btn.style.display = online.isHost ? 'block' : 'none';
    wait.style.display = online.isHost ? 'none' : 'block';
  }
}

async function hostRematch() {
  if (!online.isHost || !online.code) return;
  let pool = getCatPool();
  pool = applyDiffFilter(pool);
  pool = deprioritizeRecent(shuffle(pool)).slice(0, online.count);
  if (!pool.length) { showToast('⚠️ لا توجد أسئلة كافية', 'var(--wrong)'); return; }
  online.questions = pool;
  online.qIndex = 0;
  const psnap = await fb.db.ref('rooms/'+online.code+'/players').once('value');
  const players = psnap.val() || {};
  const updates = {};
  Object.keys(players).forEach(pid => { updates['players/'+pid+'/score'] = 0; });
  updates['answers'] = null;
  updates['state'] = { phase:'lobby', qIndex:0 };
  updates['meta/status'] = 'lobby';
  await fb.db.ref('rooms/'+online.code).update(updates);
  saveOnlineSession();
  showOnlineStage('onlineLobby');
  document.getElementById('lobbyHostControls').style.display = 'block';
  document.getElementById('lobbyWaitNote').style.display = 'none';
  showToast('🔄 تم تجهيز جولة جديدة — اضغط ابدأ', 'var(--gold)');
}

function copyRoomCode() {
  const code = online.code || '';
  if (navigator.clipboard) navigator.clipboard.writeText(code);
  showToast('📋 تم نسخ الرمز: '+code, 'var(--gold)');
}
function buildInviteURL(gameType, code) {
  return window.location.origin + window.location.pathname + '?r=' + code + '&g=' + gameType;
}
function copyInviteLink(gameType, code) {
  if (!code) { showToast('⚠️ لم يتم إنشاء غرفة بعد', 'var(--wrong)'); return; }
  const url = buildInviteURL(gameType, code);
  if (navigator.clipboard) navigator.clipboard.writeText(url);
  showToast('🔗 تم نسخ رابط الدعوة! شاركه مع خصمك', 'var(--gold)');
  if (navigator.share) {
    try { navigator.share({ title:'انضم لي في ونيس', text:'رابط الغرفة:', url }).catch(()=>{}); } catch(e){}
  }
}
function copyQuizLink() { copyInviteLink('quiz', online && online.code); }
function copyTrapLink() { copyInviteLink('trap', typeof trap !== 'undefined' && trap.code); }
function copyXoLink() { copyInviteLink('xo', typeof xo !== 'undefined' && xo.code); }
function copyC4Link() { copyInviteLink('c4', typeof c4 !== 'undefined' && c4.code); }
function copyMemLink() { copyInviteLink('mem', typeof mem !== 'undefined' && mem.code); }
function copyDefuseLink() { copyInviteLink('defuse', typeof defuse !== 'undefined' && defuse.code); }
function consumeInviteFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('r') || '').trim();
    const game = (params.get('g') || '').trim();
    if (!/^\d{6}$/.test(code)) return;
    const validGames = { quiz:'joinCode', trap:'trapJoinCode', xo:'xoJoinCode', c4:'c4JoinCode', mem:'memJoinCode', defuse:'defuseJoinCode' };
    if (!validGames[game]) return;
    setTimeout(() => {
      try {
        if (typeof goToOnline === 'function') goToOnline();
        if (typeof pickOnlineGameType === 'function') pickOnlineGameType(game);
        const inp = document.getElementById(validGames[game]); if (inp) inp.value = code;
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        showToast('🔗 رابط الدعوة جاهز — اكتب اسمك واضغط دخول', 'var(--gold)');
        if (inp) { inp.focus(); inp.scrollIntoView({ behavior:'smooth', block:'center' }); }
      } catch(e){}
    }, 350);
  } catch(e){}
}
window.addEventListener('DOMContentLoaded', consumeInviteFromURL);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newSw = reg.installing;
        if (!newSw) return;
        newSw.addEventListener('statechange', () => {
          if (newSw.state === 'installed' && navigator.serviceWorker.controller) {
            try { showToast('🔄 جارٍ تحديث التطبيق…', 'var(--gold)'); } catch(e){}
            try { newSw.postMessage({ type: 'SKIP_WAITING' }); } catch(e){}
          }
        });
      });
      setInterval(() => { try { reg.update(); } catch(e){} }, 60 * 60 * 1000);
    }).catch(()=>{});
    let _swReloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (_swReloaded) return;
      _swReloaded = true;
      setTimeout(() => location.reload(), 800);
    });
  });
}

// User-initiated "force-update" button. PWAs sometimes sit on a stale SW
// for hours because the page never reloads; this gives the player a reliable
// "give me the latest" path: re-fetch sw.js, activate any waiting worker,
// drop the runtime cache, then reload from network.
window.forceAppUpdate = async function(){
  const btn = document.getElementById('updateAppBtn');
  function lock(text){ if (btn){ btn.disabled = true; btn.dataset._orig = btn.dataset._orig || btn.textContent; btn.textContent = text; } }
  function unlock(text){ if (btn){ btn.disabled = false; if (text) btn.textContent = text; else if (btn.dataset._orig) btn.textContent = btn.dataset._orig; } }
  if (!('serviceWorker' in navigator)){
    try { showToast('متصفحك لا يدعم Service Worker','#ff6a6a'); } catch(e){}
    return;
  }
  try { showToast('🔍 جارٍ فحص التحديثات…','var(--gold)'); } catch(e){}
  lock('⏳ يفحص…');
  try {
    let reg = null;
    try { reg = await navigator.serviceWorker.getRegistration('sw.js')
        || await navigator.serviceWorker.getRegistration(); } catch(e){}
    if (!reg){
      // No SW yet — register fresh, then full reload to pick up assets via network
      try { reg = await navigator.serviceWorker.register('sw.js'); } catch(e){}
      try { showToast('🆕 يُفعّل التطبيق… سيُعاد التحميل','var(--gold)'); } catch(e){}
      setTimeout(() => location.reload(), 900);
      return;
    }
    // 1) Drop the runtime stale-while-revalidate cache so the next reload pulls
    //    every static asset (CSS/JS in index.html, questions.json, icons) over
    //    the network instead of revalidating in the background.
    try {
      if (window.caches){
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => /runtime/i.test(k)).map(k => caches.delete(k)));
      }
    } catch(e){}
    // 2) Re-fetch sw.js (browser bypasses HTTP cache for this per spec) to see
    //    if there's a newer worker server-side.
    await reg.update();
    // After update(): one of three states.
    if (reg.waiting){
      try { showToast('🚀 تحديث جاهز — يُفعَّل الآن','#3dba7a'); } catch(e){}
      try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch(e){}
      // controllerchange handler above will reload; fallback in case it doesn't.
      setTimeout(() => location.reload(), 1800);
      return;
    }
    if (reg.installing){
      lock('⬇️ يحمّل…');
      try { showToast('⬇️ يُحمَّل تحديث جديد…','var(--gold)'); } catch(e){}
      const sw = reg.installing;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed'){
          try { sw.postMessage({ type: 'SKIP_WAITING' }); } catch(e){}
          setTimeout(() => location.reload(), 800);
        } else if (sw.state === 'redundant'){
          unlock(); try { showToast('فشل التحديث — حاول لاحقاً','#ff6a6a'); } catch(e){}
        }
      });
      return;
    }
    // No new worker — we're already on the latest. Still reload to refresh any
    // in-memory state and pick up content stored in the existing cache fresh.
    try { showToast('✅ اللعبة على آخر إصدار — يُعاد التحميل','#3dba7a'); } catch(e){}
    unlock('✅ محدّثة');
    setTimeout(() => location.reload(), 900);
  } catch(e){
    unlock();
    try { showToast('تعذّر الفحص: ' + (e && e.message ? e.message : 'خطأ'),'#ff6a6a'); } catch(ee){}
  }
};

function leaveRoom() {
  const hostNote = (online && online.isHost)
    ? '<br><span style="color:#e07050;font-weight:800">⚠️ أنت مضيف الغرفة — سيتم إغلاقها للجميع.</span>'
    : '<br><span style="color:#e07050;font-weight:800">سيتم فقدان تقدّمك في هذه اللعبة.</span>';
  showConfirmExit({
    title: '🚪 الخروج من الغرفة',
    message: 'هل تريد الخروج من اللعبة الأونلاين؟' + hostNote,
    onAccept: function(){
      stopRoomHeartbeat();
      clearInterval(online.localTimerInt);
      clearTimeout(online.hostTickTimeout);
      online.listeners.forEach(off=>{ try{off();}catch(e){} });
      online.listeners = [];
      try {
        if (online.code && online.isHost) fb.db.ref('rooms/'+online.code).remove();
        else if (online.code && online.playerId) fb.db.ref('rooms/'+online.code+'/players/'+online.playerId).remove();
      } catch(e){}
      clearOnlineSession();
      online.code=null; online.isHost=false; online.playerId=null;
      document.getElementById('onlineScreen').style.display='none';
      goToLanding();
    }
  });
}
function pickOnlineGameType(t) {
  document.getElementById('gtQuizCard').classList.toggle('active', t==='quiz');
  document.getElementById('gtTrapCard').classList.toggle('active', t==='trap');
  document.getElementById('gtXoCard').classList.toggle('active', t==='xo');
  document.getElementById('gtC4Card').classList.toggle('active', t==='c4');
  document.getElementById('gtMemCard').classList.toggle('active', t==='mem');
  document.getElementById('gtDefuseCard').classList.toggle('active', t==='defuse');
  document.getElementById('onlineQuizPanels').style.display = t==='quiz' ? 'block' : 'none';
  document.getElementById('onlineTrapPanels').style.display = t==='trap' ? 'block' : 'none';
  document.getElementById('onlineXoPanels').style.display = t==='xo' ? 'block' : 'none';
  document.getElementById('onlineC4Panels').style.display = t==='c4' ? 'block' : 'none';
  document.getElementById('onlineMemPanels').style.display = t==='mem' ? 'block' : 'none';
  document.getElementById('onlineDefusePanels').style.display = t==='defuse' ? 'block' : 'none';
}
const OPEN_ROOMS_PREFIXES = { trap:'t', xo:'x', c4:'c', mem:'m', defuse:'d' };
const OPEN_ROOMS_GAME_LABELS = { trap:{name:'الفخ', avatar:'🛡️'}, xo:{name:'XO', avatar:'🎮'}, c4:{name:'أربعة في صف', avatar:'🔴'}, mem:{name:'الذاكرة', avatar:'🃏'}, defuse:{name:'إبطال القنبلة', avatar:'🧨'} };
let _openRoomsCb = null;

function attachOpenRoomsListener() {
  if (_openRoomsCb || !fbReady()) return;
  const ref = fb.db.ref('rooms');
  _openRoomsCb = ref.on('value', snap => {
    const rooms = snap.val() || {};
    Object.entries(OPEN_ROOMS_PREFIXES).forEach(([gameKey, prefix]) => {
      const list = [];
      const canSpectate = ['xo','c4','mem'].includes(gameKey);
      Object.entries(rooms).forEach(([key, room]) => {
        if (!key || !key.startsWith(prefix) || key.length !== 7) return; // expect prefix + 6 digits
        if (!room || !room.meta || !room.players) return;
        if (isRoomIdle(room)) return; // hide stale rooms from browse list
        const p0 = room.players.p0 || {}, p1 = room.players.p1 || {};
        if (!p0.joined) return;
        const inLobby = (room.meta.status === 'lobby');
        const isFull = !!p1.joined;
        if (!inLobby && !canSpectate) return; // active non-spectatable: skip
        if (inLobby && isFull) return; // full + lobby = nothing to do
        const myState = (gameKey==='trap'?trap : gameKey==='xo'?xo : gameKey==='c4'?c4 : gameKey==='mem'?mem : defuse);
        if (myState && myState.code && myState.role==='p0' && key === prefix+myState.code) return;
        list.push({
          code: key.slice(1), hostName: p0.name || room.meta.hostName || 'لاعب',
          guestName: (p1.name || ''), canJoin: inLobby && !isFull, canSpectate: canSpectate && !inLobby,
          _ts: room.meta.createdAt || 0
        });
      });
      list.sort((a,b) => (b._ts||0) - (a._ts||0));
      renderOpenRoomsList(gameKey, list);
    });
  });
}
function detachOpenRoomsListener() {
  if (!_openRoomsCb || !fbReady()) return;
  try { fb.db.ref('rooms').off('value', _openRoomsCb); } catch(e){}
  _openRoomsCb = null;
}

function renderOpenRoomsList(gameKey, list) {
  const panel = document.getElementById(gameKey + 'OpenRoomsPanel');
  const el = document.getElementById(gameKey + 'OpenRooms');
  if (!el || !panel) return;
  const label = OPEN_ROOMS_GAME_LABELS[gameKey] || { name:'', avatar:'🎮' };
  if (!list.length) {
    panel.style.display = 'block';
    el.innerHTML = '<div class="open-rooms-empty">✨ لا توجد غرف مفتوحة الآن<br><span style="color:var(--text);font-size:0.88rem;font-style:normal;display:inline-block;margin-top:6px">كن أول من ينشئ غرفة — انزل للأسفل واضغط <strong style="color:var(--gold)">إنشاء غرفة</strong></span></div>';
    return;
  }
  panel.style.display = 'block';
  el.innerHTML = list.slice(0, 10).map(r => {
    const safeHost = String(r.hostName).replace(/[<>"&]/g, '');
    const safeGuest = String(r.guestName || '').replace(/[<>"&]/g, '');
    const playingLabel = r.canSpectate ? (' <small style="color:var(--muted)">vs ' + safeGuest + '</small>') : '';
    const joinBtn = r.canJoin ? `<button class="orr-join" onclick="event.stopPropagation();joinOpenRoom('${gameKey}','${r.code}')">⚔️ دخول</button>` : '';
    const watchBtn = r.canSpectate ? `<button class="orr-spectate" onclick="event.stopPropagation();spectateRoom('${gameKey}','${r.code}')">👁️ شاهد</button>` : '';
    return `<div class="open-room-row">
      <span class="orr-host">${label.avatar} ${safeHost}${playingLabel}</span>
      <span class="orr-code">#${r.code}</span>
      ${watchBtn}${joinBtn}
    </div>`;
  }).join('');
}
const PROFILE_KEY = 'quizPlayerProfile';
const PROFILE_AVATARS = ['🦁','🐯','🐻','🦊','🐼','🦄','🐲','🐸','🐵','🤖','😎','👻','🦅','🐶','🐱','🦝','🐺','🦉'];
function defaultProfile() {
  return {
    name:'لاعب', avatar:'🦁', createdAt: Date.now(),
    stats:{
      quiz:{ games:0, totalScore:0 },
      trap:{ games:0, wins:0, losses:0, currentStreak:0, bestStreak:0 },
      xo:{ games:0, wins:0, losses:0, draws:0 },
      c4:{ games:0, wins:0, losses:0, draws:0 },
      mem:{ games:0, wins:0, losses:0, pairs:0 },
      defuse:{ games:0, wins:0, losses:0, currentStreak:0, bestStreak:0 },
      dino:{ games:0, bestScore:0, totalDistance:0 },
      brainrot:{ games:0, bestScore:0, totalSurvived:0 },
      space:{ games:0, bestScore:0, totalKills:0, bestStage:1 },
      wanees:{ games:0, bestScore:0, levelsCleared:0, coinsCollected:0 }
    }
  };
}
function loadProfile() {
  let prof;
  try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) {
    const p = JSON.parse(raw);
    const d = defaultProfile();
    p.stats = p.stats || {};
    Object.keys(d.stats).forEach(k => { p.stats[k] = Object.assign({}, d.stats[k], p.stats[k] || {}); });
    prof = Object.assign(d, p);
  } } catch(e){}
  if (!prof) prof = defaultProfile();
  if (!prof.playerId) {
    prof.playerId = 'u' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    try { saveProfile(prof); } catch(e){}
  }
  return prof;
}
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch(e){} }
function updateProfileStat(game, mutator) {
  const p = loadProfile();
  if (!p.stats[game]) p.stats[game] = {};
  mutator(p.stats[game], p);
  saveProfile(p);
}
function recordGameResult(game, result) {
  updateProfileStat(game, (s) => {
    s.games = (s.games||0) + 1;
    if (result.won) {
      s.wins = (s.wins||0) + 1;
      if ('currentStreak' in s) { s.currentStreak = (s.currentStreak||0) + 1; if (s.currentStreak > (s.bestStreak||0)) s.bestStreak = s.currentStreak; }
    }
    if (result.lost) {
      s.losses = (s.losses||0) + 1;
      if ('currentStreak' in s) s.currentStreak = 0;
    }
    if (result.draw) { s.draws = (s.draws||0) + 1; }
    if (result.defused) {
      s.wins = (s.wins||0) + 1;
      s.currentStreak = (s.currentStreak||0) + 1;
      if (s.currentStreak > (s.bestStreak||0)) s.bestStreak = s.currentStreak;
    }
    if (result.exploded) {
      s.losses = (s.losses||0) + 1;
      s.currentStreak = 0;
    }
    if (typeof result.score === 'number') s.totalScore = (s.totalScore||0) + result.score;
    if (typeof result.pairs === 'number') s.pairs = (s.pairs||0) + result.pairs;
  });
  try { checkAchievements(); } catch(e){}
  try { if (result.won || result.defused) gameLeaderboardBump(game, 1); } catch(e){}
}
function gameLeaderboardBump(game, inc) {
  if (!fbReady()) return;
  const p = loadProfile();
  const ref = fb.db.ref('leaderboard_games/'+isoWeekId()+'/'+game+'/'+p.playerId);
  ref.transaction(cur => {
    cur = cur || { wins:0 };
    return {
      name: p.name || 'لاعب',
      avatar: p.avatar || '🦁',
      wins: (cur.wins||0) + inc,
      ts: Date.now()
    };
  }).catch(()=>{});
}
function gameLeaderboardLoad(game, cb) {
  if (!fbReady()) { cb([]); return; }
  const sortKey = (game === 'dino' || game === 'brainrot' || game === 'space' || game === 'wanees') ? 'bestScore' : 'wins';
  fb.db.ref('leaderboard_games/'+isoWeekId()+'/'+game).orderByChild(sortKey).limitToLast(20).once('value').then(snap => {
    const arr = [];
    snap.forEach(c => { const v = c.val(); arr.push({ id:c.key, ...v }); });
    arr.sort((a,b) => ((b[sortKey])||0) - ((a[sortKey])||0));
    cb(arr);
  }).catch(()=>cb([]));
}
function dinoLeaderboardSubmit(score) {
  bestScoreLeaderboardSubmit('dino', score);
}
function brainrotLeaderboardSubmit(score) {
  bestScoreLeaderboardSubmit('brainrot', score);
}
function spaceLeaderboardSubmit(score) {
  bestScoreLeaderboardSubmit('space', score);
}
function waneesLeaderboardSubmit(score) {
  bestScoreLeaderboardSubmit('wanees', score);
}
function bestScoreLeaderboardSubmit(game, score) {
  if (!fbReady()) return;
  if (!(score > 0)) return;
  const p = loadProfile();
  const ref = fb.db.ref('leaderboard_games/'+isoWeekId()+'/'+game+'/'+p.playerId);
  ref.transaction(cur => {
    cur = cur || { bestScore:0 };
    if (score <= (cur.bestScore||0)) return;
    return {
      name: p.name || 'لاعب',
      avatar: p.avatar || '🦁',
      bestScore: score,
      ts: Date.now()
    };
  }).catch(()=>{});
}

let _glbCurrentGame = 'trap';
function openGameLeaderboards() {
  hideAllScreens();
  document.getElementById('gameLbScreen').style.display = 'block';
  switchGameLb(_glbCurrentGame);
}
function switchGameLb(game) {
  _glbCurrentGame = game;
  document.querySelectorAll('.glb-tab').forEach(t => t.classList.toggle('active', t.dataset.game === game));
  const list = document.getElementById('glbList');
  list.innerHTML = '<div class="glb-empty">⏳ جاري التحميل…</div>';
  gameLeaderboardLoad(game, arr => {
    if (!arr.length) {
      list.innerHTML = '<div class="glb-empty">لا توجد نتائج هذا الأسبوع بعد — كن الأول!</div>';
      return;
    }
    const me = (loadProfile().playerId || '');
    list.innerHTML = arr.map((r, i) => {
      const rankCls = i===0 ? 'gold' : i===1 ? 'silver' : i===2 ? 'bronze' : '';
      const medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1);
      const metric = (game === 'dino' || game === 'brainrot' || game === 'space' || game === 'wanees')
        ? ((r.bestScore||0) + ' نقطة')
        : ((r.wins||0) + ' فوز');
      return '<div class="glb-row' + (r.id===me ? ' me' : '') + '"><div class="glb-rank ' + rankCls + '">' + medal + '</div><div class="glb-avatar">' + (r.avatar || '🙂') + '</div><div class="glb-name">' + (r.name || 'لاعب') + '</div><div class="glb-wins">' + metric + '</div></div>';
    }).join('');
  });
}
const ACHIEVEMENTS = [
  { id:'first_win',      name:'الفوز الأول',          desc:'فوز واحد في أي لعبة',         emoji:'🏆', check:(p) => Object.values(p.stats).some(s => (s.wins||0) > 0) },
  { id:'all_games',      name:'مستكشف الألعاب',       desc:'العب جولة واحدة في كل الألعاب العشر', emoji:'🌟', check:(p) => ['trap','xo','c4','mem','defuse','quiz','dino','brainrot','space','wanees'].every(g => ((p.stats[g]||{}).games||0) > 0) },
  { id:'wanees_first',   name:'مغامرة أولى',           desc:'أكمل المرحلة الأولى من ونيس',     emoji:'🍄', check:(p) => ((p.stats.wanees||{}).levelsCleared||0) >= 1 },
  { id:'wanees_coins',   name:'صائد العملات',          desc:'اجمع ٥٠ عملة في لعبة ونيس إجمالاً', emoji:'🪙', check:(p) => ((p.stats.wanees||{}).coinsCollected||0) >= 50 },
  { id:'space_stage1',   name:'ربّان مبتدئ',          desc:'انتصر على زعيم المرحلة الأولى في حرب الفضاء', emoji:'🚀', check:(p) => ((p.stats.space||{}).bestStage||1) >= 2 },
  { id:'space_stage3',   name:'منقذ المجرّة',          desc:'انتصر على زعيم المرحلة الثالثة في حرب الفضاء', emoji:'🌌', check:(p) => ((p.stats.space||{}).bestStage||1) >= 4 },
  { id:'space_100kills', name:'صائد السفن',            desc:'دمّر ١٠٠ سفينة معادية إجمالاً', emoji:'💥', check:(p) => ((p.stats.space||{}).totalKills||0) >= 100 },
  { id:'dino_100',       name:'صديق الديناصور',       desc:'احصل على ١٠٠ نقطة في لعبة الديناصور', emoji:'🦖', check:(p) => ((p.stats.dino||{}).bestScore||0) >= 100 },
  { id:'dino_500',       name:'عصر الجوراسي',         desc:'احصل على ٥٠٠ نقطة في لعبة الديناصور', emoji:'🌋', check:(p) => ((p.stats.dino||{}).bestScore||0) >= 500 },
  { id:'brot_30',        name:'بداية التعفّن',          desc:'صمد ٣٠٠ نقطة في لعبة التعفّن الدماغي', emoji:'🧠', check:(p) => ((p.stats.brainrot||{}).bestScore||0) >= 300 },
  { id:'brot_1k',        name:'GigaChad',              desc:'احصل على ١٠٠٠ نقطة في التعفّن الدماغي', emoji:'💪', check:(p) => ((p.stats.brainrot||{}).bestScore||0) >= 1000 },
  { id:'brot_sigma',     name:'Ultimate Sigma',         desc:'احصل على ٢٥٠٠ نقطة في التعفّن الدماغي', emoji:'👑', check:(p) => ((p.stats.brainrot||{}).bestScore||0) >= 2500 },
  { id:'trap_3wins',     name:'بطل الفخ',             desc:'٣ انتصارات في لعبة الفخ',     emoji:'💣', check:(p) => (p.stats.trap.wins||0) >= 3 },
  { id:'trap_streak5',   name:'تاجر الحظ',            desc:'٥ انتصارات متتالية في الفخ',  emoji:'🍀', check:(p) => (p.stats.trap.bestStreak||0) >= 5 },
  { id:'xo_5wins',       name:'ملك XO',               desc:'٥ انتصارات في XO',           emoji:'🎮', check:(p) => (p.stats.xo.wins||0) >= 5 },
  { id:'c4_5wins',       name:'محترف Connect 4',      desc:'٥ انتصارات في أربعة في صف',  emoji:'🔴', check:(p) => (p.stats.c4.wins||0) >= 5 },
  { id:'mem_5wins',      name:'ذاكرة الفيل',          desc:'٥ انتصارات في الذاكرة',      emoji:'🐘', check:(p) => (p.stats.mem.wins||0) >= 5 },
  { id:'mem_pairs50',    name:'جامع الأزواج',         desc:'اكتشف ٥٠ زوجاً في الذاكرة',  emoji:'🃏', check:(p) => (p.stats.mem.pairs||0) >= 50 },
  { id:'defuse_streak3', name:'مفكك محترف',           desc:'٣ تفكيكات متتالية',          emoji:'🧨', check:(p) => (p.stats.defuse.bestStreak||0) >= 3 },
  { id:'defuse_streak10',name:'خبير القنابل',         desc:'١٠ تفكيكات متتالية',         emoji:'💎', check:(p) => (p.stats.defuse.bestStreak||0) >= 10 },
  { id:'quiz_10rounds',  name:'عاشق الأسئلة',         desc:'العب ١٠ جولات في لعبة الأسئلة', emoji:'📚', check:(p) => (p.stats.quiz.games||0) >= 10 },
  { id:'pro_player',     name:'لاعب محترف',           desc:'٢٥ فوزاً عبر كل الألعاب',    emoji:'⭐', check:(p) => Object.values(p.stats).reduce((sum,s) => sum + (s.wins||0), 0) >= 25 }
];
function checkAchievements() {
  const p = loadProfile();
  p.badges = p.badges || [];
  const newOnes = [];
  ACHIEVEMENTS.forEach(a => {
    if (p.badges.includes(a.id)) return;
    try { if (a.check(p)) { p.badges.push(a.id); newOnes.push(a); } } catch(e){}
  });
  if (newOnes.length) {
    saveProfile(p);
    newOnes.forEach((a, i) => setTimeout(() => showAchievementToast(a), i * 1800));
    if (document.getElementById('profileScreen') && document.getElementById('profileScreen').style.display === 'block') {
      try { renderBadges(); } catch(e){}
    }
  }
}
function showAchievementToast(a) {
  const banner = document.createElement('div');
  banner.className = 'achievement-banner';
  banner.innerHTML = '<div class="ach-emoji">' + a.emoji + '</div><div><div class="ach-title">🏅 إنجاز جديد!</div><div class="ach-name">' + a.name + '</div></div>';
  document.body.appendChild(banner);
  try {
    playTone(523, 0.12, 'triangle', 0.25);
    setTimeout(()=>playTone(659, 0.12, 'triangle', 0.25), 120);
    setTimeout(()=>playTone(784, 0.2, 'triangle', 0.28), 240);
  } catch(e){}
  setTimeout(() => { try { banner.remove(); } catch(e){} }, 4200);
}
function renderBadges() {
  const el = document.getElementById('profileBadges'); if (!el) return;
  const p = loadProfile();
  const earned = new Set(p.badges || []);
  el.innerHTML = ACHIEVEMENTS.map(a => {
    const got = earned.has(a.id);
    return '<div class="badge-item ' + (got ? 'earned' : 'locked') + '" title="' + a.desc + '"><div class="bi-emoji">' + (got ? a.emoji : '🔒') + '</div><div class="bi-name">' + a.name + '</div><div class="bi-desc">' + a.desc + '</div></div>';
  }).join('');
  const ct = document.getElementById('profileBadgesCount');
  if (ct) ct.textContent = earned.size + ' / ' + ACHIEVEMENTS.length;
}

function openProfile() {
  hideAllScreens();
  document.getElementById('profileScreen').style.display = 'block';
  renderProfile();
  _setNavShow(true);
}
function renderProfile() {
  const p = loadProfile();
  document.getElementById('profileAvatar').textContent = p.avatar || '🦁';
  document.getElementById('profileNameDisplay').textContent = p.name || 'لاعب';
  const days = Math.max(1, Math.floor((Date.now() - (p.createdAt||Date.now())) / 86400000));
  document.getElementById('profileMeta').textContent = 'منذ ' + days + ' يوم';
  const s = p.stats;
  document.getElementById('psQuizGames').textContent = s.quiz.games || 0;
  document.getElementById('psQuizScore').textContent = s.quiz.totalScore || 0;
  document.getElementById('psTrapWins').textContent = s.trap.wins || 0;
  document.getElementById('psTrapLosses').textContent = s.trap.losses || 0;
  document.getElementById('psTrapBest').textContent = s.trap.bestStreak || 0;
  document.getElementById('psXoWins').textContent = s.xo.wins || 0;
  document.getElementById('psXoLosses').textContent = s.xo.losses || 0;
  document.getElementById('psXoDraws').textContent = s.xo.draws || 0;
  document.getElementById('psXoRate').textContent = pct(s.xo.wins||0, (s.xo.wins||0)+(s.xo.losses||0)+(s.xo.draws||0));
  document.getElementById('psC4Wins').textContent = s.c4.wins || 0;
  document.getElementById('psC4Losses').textContent = s.c4.losses || 0;
  document.getElementById('psC4Draws').textContent = s.c4.draws || 0;
  document.getElementById('psC4Rate').textContent = pct(s.c4.wins||0, (s.c4.wins||0)+(s.c4.losses||0)+(s.c4.draws||0));
  document.getElementById('psMemWins').textContent = s.mem.wins || 0;
  document.getElementById('psMemLosses').textContent = s.mem.losses || 0;
  document.getElementById('psMemPairs').textContent = s.mem.pairs || 0;
  document.getElementById('psDefuseOK').textContent = s.defuse.wins || 0;
  document.getElementById('psDefuseBoom').textContent = s.defuse.losses || 0;
  document.getElementById('psDefuseBest').textContent = s.defuse.bestStreak || 0;
  if (document.getElementById('psDinoGames')) document.getElementById('psDinoGames').textContent = (s.dino && s.dino.games) || 0;
  if (document.getElementById('psDinoBest')) document.getElementById('psDinoBest').textContent = (s.dino && s.dino.bestScore) || 0;
  if (document.getElementById('psBrotGames')) document.getElementById('psBrotGames').textContent = (s.brainrot && s.brainrot.games) || 0;
  if (document.getElementById('psBrotBest')) document.getElementById('psBrotBest').textContent = (s.brainrot && s.brainrot.bestScore) || 0;
  if (document.getElementById('psSpaceGames')) document.getElementById('psSpaceGames').textContent = (s.space && s.space.games) || 0;
  if (document.getElementById('psSpaceBest')) document.getElementById('psSpaceBest').textContent = (s.space && s.space.bestScore) || 0;
  if (document.getElementById('psWaneesGames')) document.getElementById('psWaneesGames').textContent = (s.wanees && s.wanees.games) || 0;
  if (document.getElementById('psWaneesBest')) document.getElementById('psWaneesBest').textContent = (s.wanees && s.wanees.bestScore) || 0;
  try { renderBadges(); } catch(e){}
}
function pct(w, total) { if (!total) return '—'; return Math.round((w/total)*100) + '%'; }

let _profileEditAvatar = '';
function openProfileEdit() {
  const p = loadProfile();
  document.getElementById('profileNameInput').value = p.name || '';
  _profileEditAvatar = p.avatar || '🦁';
  const grid = document.getElementById('profileEditAvatars'); grid.innerHTML = '';
  PROFILE_AVATARS.forEach(av => {
    const d = document.createElement('div'); d.className = 'av-choice' + (av === _profileEditAvatar ? ' selected' : '');
    d.textContent = av;
    d.onclick = () => { _profileEditAvatar = av; grid.querySelectorAll('.av-choice').forEach(e => e.classList.remove('selected')); d.classList.add('selected'); };
    grid.appendChild(d);
  });
  document.getElementById('profileEditOverlay').style.display = 'flex';
}
function closeProfileEdit() { document.getElementById('profileEditOverlay').style.display = 'none'; }
function saveProfileEdit() {
  const name = (document.getElementById('profileNameInput').value || '').trim() || 'لاعب';
  const p = loadProfile();
  p.name = name;
  p.avatar = _profileEditAvatar || p.avatar || '🦁';
  saveProfile(p);
  renderProfile();
  closeProfileEdit();
  showToast('💾 تم حفظ الملف', 'var(--gold)');
  prefillProfileName();
}
function resetProfile() {
  if (!confirm('هل تريد فعلاً مسح الإحصائيات؟ لا يمكن التراجع.')) return;
  const p = loadProfile();
  const fresh = defaultProfile();
  fresh.name = p.name; fresh.avatar = p.avatar; fresh.createdAt = p.createdAt || Date.now();
  saveProfile(fresh);
  renderProfile();
  showToast('🗑️ تم مسح الإحصائيات', 'var(--gold)');
}
function prefillProfileName() {
  const p = loadProfile();
  if (!p.name || p.name === 'لاعب') return;
  ['hostName','joinName','trapHostName','trapJoinName','xoHostName','xoJoinName','c4HostName','c4JoinName','memHostName','memJoinName','defuseHostName','defuseJoinName'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = p.name;
  });
}
window.addEventListener('DOMContentLoaded', () => setTimeout(prefillProfileName, 400));

function joinOpenRoom(gameKey, code) {
  const inputMap = { trap:'trapJoinCode', xo:'xoJoinCode', c4:'c4JoinCode', mem:'memJoinCode', defuse:'defuseJoinCode' };
  const nameInputMap = { trap:'trapJoinName', xo:'xoJoinName', c4:'c4JoinName', mem:'memJoinName', defuse:'defuseJoinName' };
  const joinFnMap = { trap:joinTrapRoom, xo:joinXoRoom, c4:joinC4Room, mem:joinMemRoom, defuse:joinDefuseRoom };
  const inp = document.getElementById(inputMap[gameKey]); if (inp) inp.value = code;
  const nameInp = document.getElementById(nameInputMap[gameKey]);
  if (nameInp && !nameInp.value.trim()) {
    showToast('✏️ اكتب اسمك أولاً ثم انضم', 'var(--gold)');
    try { nameInp.focus(); nameInp.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){}
    return;
  }
  if (joinFnMap[gameKey]) joinFnMap[gameKey]();
}
const SPECTATE_PREFIXES = { xo:'x', c4:'c', mem:'m' };
async function spectateRoom(gameKey, code) {
  if (!ensureFirebase()) return;
  const prefix = SPECTATE_PREFIXES[gameKey]; if (!prefix) return;
  const sid = getPresenceId();
  const profName = (loadProfile().name) || 'متفرج';
  try {
    const ref = fb.db.ref('rooms/'+prefix+code+'/spectators/'+sid);
    await ref.set({ name: profName, ts: Date.now() });
    ref.onDisconnect().remove();
  } catch(e) {
    showToast('⚠️ تعذّر الانضمام كمتفرج', 'var(--wrong)');
    return;
  }
  if (gameKey === 'xo') xoSpectate(code, sid);
  else if (gameKey === 'c4') c4Spectate(code, sid);
  else if (gameKey === 'mem') memSpectate(code, sid);
}
function spectatorCountLabel(n) {
  const arDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  const num = String(n).split('').map(d => arDigits[+d] || d).join('');
  return '👁️ ' + num + ' ' + (n === 1 ? 'متفرج' : 'متفرجون');
}
function attachSpectatorCounter(prefix, code, stateObj, countElId) {
  if (!fbReady()) return;
  const ref = fb.db.ref('rooms/'+prefix+code+'/spectators');
  const onCount = ref.on('value', snap => {
    const n = snap.numChildren ? snap.numChildren() : Object.keys(snap.val()||{}).length;
    const el = document.getElementById(countElId);
    if (el) { el.textContent = spectatorCountLabel(n); el.style.display = n > 0 ? 'inline-block' : 'none'; }
  });
  if (stateObj && stateObj.listeners) stateObj.listeners.push(() => { try { ref.off('value', onCount); } catch(e){} });
}
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
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
  if (localStorage.getItem('quizInstallDismissed') === '1') return;
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
  const btn = document.getElementById('installAppBtn'); if (btn) btn.style.display = 'flex';
});
function triggerPwaInstall() {
  if (!_deferredInstallPrompt) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      showInfoModalHTML('🍎 ثبّت اللعبة على iPhone', '<p>اضغط زر <strong>المشاركة ⬆️</strong> في أسفل المتصفح، ثم اختر:</p><div style="text-align:center;font-size:1.2rem;margin:14px 0"><strong>"إضافة إلى الشاشة الرئيسية"</strong></div><p style="font-size:0.85rem;color:var(--muted);text-align:center">ستظهر اللعبة كتطبيق على شاشة جوالك مباشرة.</p>');
    } else {
      showToast('⚠️ التثبيت غير متاح في متصفحك الحالي', 'var(--wrong)');
    }
    return;
  }
  _deferredInstallPrompt.prompt();
  _deferredInstallPrompt.userChoice.then((choice) => {
    if (choice.outcome === 'accepted') {
      showToast('🎉 تم التثبيت! ستجد اللعبة على شاشتك', 'var(--gold)');
    }
    _deferredInstallPrompt = null;
    const btn = document.getElementById('installAppBtn'); if (btn) btn.style.display = 'none';
  });
}
function dismissInstallPrompt() {
  try { localStorage.setItem('quizInstallDismissed', '1'); } catch(e){}
  const btn = document.getElementById('installAppBtn'); if (btn) btn.style.display = 'none';
}
window.addEventListener('load', () => {
  setTimeout(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const inStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !inStandalone && localStorage.getItem('quizInstallDismissed') !== '1') {
      const btn = document.getElementById('installAppBtn');
      if (btn) { btn.style.display = 'flex'; btn.querySelector('span').textContent = '🍎 ثبّت كتطبيق'; }
    }
  }, 2500);
});
function showInfoModalHTML(title, body) {
  document.getElementById('infoModalContent').innerHTML = '<h2>' + title + '</h2>' + body;
  document.getElementById('infoModalOverlay').style.display = 'flex';
}
const TUTORIAL_KEY = 'quizTutorialSeen';
let _tutorialIdx = 0;
const _tutorialLastIdx = 3;
function maybeShowTutorial() {
  try { if (localStorage.getItem(TUTORIAL_KEY) === '1') return; } catch(e) { return; }
  setTimeout(() => {
    _tutorialIdx = 0;
    document.getElementById('tutorialOverlay').style.display = 'flex';
    renderTutorialSlide();
  }, 800);
}
function renderTutorialSlide() {
  document.querySelectorAll('.tutorial-slide').forEach((el, i) => {
    el.classList.toggle('active', i === _tutorialIdx);
  });
  document.querySelectorAll('.tutorial-dots .dot').forEach((el, i) => {
    el.classList.toggle('active', i === _tutorialIdx);
  });
  const next = document.getElementById('tutorialNextBtn');
  if (next) next.textContent = (_tutorialIdx === _tutorialLastIdx) ? '🚀 ابدأ اللعب' : 'التالي ←';
}
function tutorialNext() {
  if (_tutorialIdx >= _tutorialLastIdx) { tutorialFinish(); return; }
  _tutorialIdx++;
  renderTutorialSlide();
}
function tutorialSkip() { tutorialFinish(); }
function tutorialFinish() {
  document.getElementById('tutorialOverlay').style.display = 'none';
  try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch(e){}
}
window.addEventListener('DOMContentLoaded', () => setTimeout(maybeShowTutorial, 600));

async function openAdmin() {
  try { await loadAdminSDKs(); } catch(e) { showToast('⚠️ تعذّر تحميل أدوات الإدارة', 'var(--wrong)'); return; }
  hideAllScreens();
  const admin = document.getElementById('adminScreen');
  admin.style.display = '';
  admin.classList.add('show');
  _setNavShow(false);
  const sel = document.getElementById('aqCat');
  if (sel && !sel.options.length) {
    Object.keys(catLabels).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=catLabels[k].label; sel.appendChild(o); });
  }
  if (!fbReady()) showToast('⚠️ يتطلب إعداد Firebase', 'var(--wrong)');
  showAdminState(!!(fb.auth && fb.auth.currentUser));
}
function closeAdmin() {
  stopAdminDashboard();
  document.getElementById('adminScreen').classList.remove('show');
  goToLanding();
  if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search);
}
function showAdminState(loggedIn) {
  document.getElementById('adminLogin').style.display = loggedIn ? 'none' : 'block';
  document.getElementById('adminPanel').style.display = loggedIn ? 'block' : 'none';
  if (loggedIn) {
    adminLoadList();
    startAdminDashboard();
  } else {
    stopAdminDashboard();
  }
}

// ── Admin Dashboard ──
const ADMIN_GAME_META = {
  quiz:   { name:'الأسئلة',     emoji:'🧠', prefix:'',  codeLen:6 },
  trap:   { name:'الفخ',        emoji:'💣', prefix:'t', codeLen:7 },
  xo:     { name:'XO',          emoji:'🎮', prefix:'x', codeLen:7 },
  c4:     { name:'أربعة في صف', emoji:'🔴', prefix:'c', codeLen:7 },
  mem:    { name:'الذاكرة',     emoji:'🃏', prefix:'m', codeLen:7 },
  defuse: { name:'إبطال القنبلة',emoji:'🧨', prefix:'d', codeLen:7 }
};
let _adminDashTimer = null;

// ── Room inactivity heartbeat + auto-close ──
// While a player is in any online room, heartbeat the room's meta.lastActivity
// every 30s. Anyone scanning the rooms list (admin dashboard or open-rooms
// browser) will skip rooms whose lastActivity is older than ROOM_IDLE_LIMIT_MS.
// The admin dashboard auto-removes them on refresh.
const ROOM_IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
let _roomHeartbeatInt = null;
let _roomHeartbeatPath = null;
function startRoomHeartbeat(prefix, code) {
  stopRoomHeartbeat();
  if (!fbReady() || !code) return;
  _roomHeartbeatPath = 'rooms/' + prefix + code + '/meta/lastActivity';
  const ping = () => {
    if (!_roomHeartbeatPath) return;
    try { fb.db.ref(_roomHeartbeatPath).set(firebase.database.ServerValue.TIMESTAMP); } catch(e){}
  };
  ping(); // immediate
  _roomHeartbeatInt = setInterval(ping, 30000);
}
function stopRoomHeartbeat() {
  clearInterval(_roomHeartbeatInt);
  _roomHeartbeatInt = null;
  _roomHeartbeatPath = null;
}
function isRoomIdle(room) {
  if (!room || !room.meta) return false;
  const last = room.meta.lastActivity || room.meta.createdAt || 0;
  if (!last) return false;
  return (Date.now() - last) > ROOM_IDLE_LIMIT_MS;
}

function startAdminDashboard() {
  applyAdminCollapsibles();
  refreshAdminDashboard();
  clearInterval(_adminDashTimer);
  _adminDashTimer = setInterval(refreshAdminDashboard, 30000);
}

// Wrap each admin section into a collapsible block (idempotent)
function applyAdminCollapsibles() {
  const panel = document.getElementById('adminPanel');
  if (!panel || panel._sectionsWrapped) return;
  // Wrap the loose "📚 الأسئلة المضافة" section first (it's not in an online-panel)
  const lpt = panel.querySelector('.lobby-players-title');
  if (lpt && !lpt.closest('.online-panel')) {
    const wrap = document.createElement('div');
    wrap.className = 'online-panel';
    wrap.style.marginBottom = '14px';
    const title = document.createElement('div');
    title.className = 'online-panel-title';
    title.innerHTML = lpt.innerHTML;
    wrap.appendChild(title);
    lpt.parentNode.insertBefore(wrap, lpt);
    let node = lpt;
    while (node) {
      const next = node.nextSibling;
      if (node.id === 'adminClose' || (node.querySelector && node.querySelector('#adminClose'))) break;
      if (node !== lpt) wrap.appendChild(node);
      node = next;
    }
    lpt.remove();
  }
  // Convert each direct online-panel child to a collapsible section
  const panels = Array.from(panel.querySelectorAll(':scope > .online-panel'));
  panels.forEach((p, idx) => {
    if (p.classList.contains('admin-section')) return;
    const title = p.querySelector(':scope > .online-panel-title');
    if (!title) return;
    p.classList.add('admin-section');
    const body = document.createElement('div');
    body.className = 'admin-section-body';
    let node = title.nextSibling;
    while (node) { const next = node.nextSibling; body.appendChild(node); node = next; }
    p.appendChild(body);
    const key = 'adminSec_' + idx;
    const saved = (function(){ try { return localStorage.getItem(key); } catch(e){ return null; } })();
    const defaultOpen = (idx === 0);
    if (saved === '0' || (saved === null && !defaultOpen)) p.classList.add('collapsed');
    title.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      p.classList.toggle('collapsed');
      try { localStorage.setItem(key, p.classList.contains('collapsed') ? '0' : '1'); } catch(e){}
    });
  });
  panel._sectionsWrapped = true;
}

// Close ALL active rooms across all games at once (destructive)
async function adminCloseAllRooms() {
  if (!fbReady()) return;
  if (!confirm('⚠️ هل تريد إغلاق جميع الغرف المفتوحة الآن؟ سيتم إخراج كل اللاعبين الموجودين في كل الألعاب.')) return;
  const btn = document.getElementById('adminCloseAllBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري الإغلاق…'; }
  try {
    const snap = await fb.db.ref('rooms').once('value');
    const all = snap.val() || {};
    const updates = {};
    let count = 0;
    Object.keys(all).forEach(key => {
      if (key === '_p') return;
      if (!key) return;
      const isNumeric = /^\d{6}$/.test(key);
      const isPrefixed = key.length === 7 && /^[tcxmd]/.test(key);
      if (!isNumeric && !isPrefixed) return;
      updates[key] = null;
      count++;
    });
    if (!count) {
      showToast('لا توجد غرف لإغلاقها', 'var(--gold)');
    } else {
      await fb.db.ref('rooms').update(updates);
      showToast('✅ تم إغلاق ' + count + ' غرفة', 'var(--gold)');
    }
    refreshAdminDashboard();
  } catch(e) {
    showToast('⚠️ تعذّر إغلاق الغرف: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚠️ إغلاق جميع الغرف المفتوحة'; }
  }
}
function stopAdminDashboard() {
  clearInterval(_adminDashTimer);
  _adminDashTimer = null;
}
async function refreshAdminDashboard() {
  if (!fbReady()) return;
  try {
    const snap = await fb.db.ref('rooms').once('value');
    const all = snap.val() || {};
    // Auto-cleanup: remove rooms idle longer than ROOM_IDLE_LIMIT_MS
    const staleKeys = [];
    Object.entries(all).forEach(([k, v]) => {
      if (k === '_p') return;
      if (!k || !v) return;
      if (isRoomIdle(v)) staleKeys.push(k);
    });
    if (staleKeys.length) {
      const updates = {};
      staleKeys.forEach(k => { updates[k] = null; delete all[k]; });
      try { fb.db.ref('rooms').update(updates); } catch(e){}
      console.log('[dashboard] auto-removed', staleKeys.length, 'idle rooms');
    }
    const data = computeDashboardData(all);
    renderDashboardStats(data);
    renderDashboardGames(data);
    renderDashboardRooms(data);
    const arDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    const t = new Date();
    const hh = String(t.getHours()).padStart(2,'0').split('').map(d=>arDigits[+d]).join('');
    const mm = String(t.getMinutes()).padStart(2,'0').split('').map(d=>arDigits[+d]).join('');
    document.getElementById('dashLastUpdate').textContent = hh + ':' + mm;
  } catch(e) {
    showToast('⚠️ تعذّر تحديث اللوحة', 'var(--wrong)');
  }
}
function computeDashboardData(all) {
  const data = {
    presence: 0, totalRooms: 0, totalSpectators: 0, totalQuestions: (allQuestions || []).filter(q=>q.cat!=='custom').length,
    games: {}
  };
  Object.keys(ADMIN_GAME_META).forEach(g => { data.games[g] = { lobby:0, active:0, list:[] }; });
  // Presence (entries in rooms/_p with timestamp within 2 minutes)
  const TWO_MIN = 2 * 60 * 1000;
  const presence = all._p || {};
  const now = Date.now();
  Object.keys(presence).forEach(k => {
    const ts = presence[k];
    if (typeof ts === 'number' && (now - ts) < TWO_MIN) data.presence++;
  });
  // Walk rooms
  Object.entries(all).forEach(([key, room]) => {
    if (!key || key === '_p') return;
    if (!room || !room.meta) return;
    // Determine game type
    let gameType = null;
    if (/^\d{6}$/.test(key)) gameType = 'quiz';
    else if (key.length === 7) {
      const p = key[0];
      const m = Object.entries(ADMIN_GAME_META).find(([k,v]) => v.prefix === p);
      if (m) gameType = m[0];
    }
    if (!gameType || !data.games[gameType]) return;
    const players = room.players || {};
    const playerCount = Object.values(players).filter(p => p && p.joined).length;
    const spectators = room.spectators ? Object.keys(room.spectators).length : 0;
    if (playerCount === 0) return; // skip stale/empty rooms
    const status = room.meta.status || 'unknown';
    data.games[gameType].list.push({
      key, code: (gameType === 'quiz') ? key : key.slice(1),
      hostName: (players.p0 || {}).name || room.meta.hostName || '—',
      status, playerCount, spectators,
      createdAt: room.meta.createdAt || 0, gameType
    });
    if (status === 'lobby') data.games[gameType].lobby++;
    else if (status === 'active' || status === 'planting') data.games[gameType].active++;
    data.totalRooms++;
    data.totalSpectators += spectators;
  });
  return data;
}
function renderDashboardStats(data) {
  document.getElementById('dashOnline').textContent = data.presence;
  document.getElementById('dashRooms').textContent = data.totalRooms;
  document.getElementById('dashSpectators').textContent = data.totalSpectators;
  document.getElementById('dashQuestions').textContent = data.totalQuestions;
}
function renderDashboardGames(data) {
  const el = document.getElementById('adminGameGrid');
  el.innerHTML = Object.entries(ADMIN_GAME_META).map(([key, meta]) => {
    const g = data.games[key];
    return '<div class="admin-game-card"><div class="agc-emoji">' + meta.emoji + '</div><div class="agc-name">' + meta.name + '</div><div class="agc-stats"><span>لوبي <b class="lobby">' + g.lobby + '</b></span><span>قيد اللعب <b class="active">' + g.active + '</b></span></div></div>';
  }).join('');
}
function renderDashboardRooms(data) {
  const el = document.getElementById('adminRoomsList');
  const ct = document.getElementById('dashRoomsCount');
  // Flatten all rooms and sort newest first
  const allRooms = [];
  Object.values(data.games).forEach(g => g.list.forEach(r => allRooms.push(r)));
  allRooms.sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  ct.textContent = String(allRooms.length);
  if (!allRooms.length) {
    el.innerHTML = '<div class="admin-empty">لا توجد غرف نشطة الآن</div>';
    return;
  }
  el.innerHTML = allRooms.slice(0, 50).map(r => {
    const meta = ADMIN_GAME_META[r.gameType] || { name:'', emoji:'🎮' };
    const ageS = r.createdAt ? Math.max(0, Math.round((Date.now() - r.createdAt) / 60000)) : 0;
    const ageLabel = ageS < 1 ? 'الآن' : ('منذ ' + ageS + ' د');
    const safeName = String(r.hostName).replace(/[<>"&]/g, '');
    return '<div class="admin-room-row" data-key="' + r.key + '"><div class="arr-icon">' + meta.emoji + '</div><div class="arr-info"><div class="arr-host">' + safeName + ' <span style="color:var(--muted);font-weight:400">#' + r.code + '</span></div><div class="arr-meta">' + meta.name + ' • ' + r.playerCount + ' لاعب • ' + r.spectators + ' متفرج • ' + ageLabel + '</div></div><div class="arr-status ' + r.status + '">' + (r.status === 'lobby' ? 'لوبي' : r.status === 'active' ? 'جارية' : r.status) + '</div><button class="arr-close" onclick="adminCloseRoom(\'' + r.key + '\')">✖️ إغلاق</button></div>';
  }).join('');
}
async function adminCloseRoom(key) {
  if (!confirm('إغلاق الغرفة ' + key + '؟ سيتم إخراج جميع اللاعبين الموجودين فيها.')) return;
  try {
    await fb.db.ref('rooms/' + key).remove();
    showToast('✅ تم إغلاق الغرفة', 'var(--gold)');
    refreshAdminDashboard();
  } catch(e) {
    showToast('⚠️ تعذّر إغلاق الغرفة: ' + (e && e.message ? e.message : ''), 'var(--wrong)');
  }
}
function adminLogin() {
  if (!fbReady() || !fb.auth) { showToast('⚠️ يتطلب اتصال Firebase', 'var(--wrong)'); return; }
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value;
  if (!email || !pass) { showToast('⚠️ أدخل البريد وكلمة المرور', 'var(--wrong)'); return; }
  fb.auth.signInWithEmailAndPassword(email, pass)
    .then(()=>{ showToast('✅ تم تسجيل الدخول', 'var(--correct)'); document.getElementById('adminPass').value=''; showAdminState(true); })
    .catch(()=>showToast('⚠️ بيانات الدخول غير صحيحة', 'var(--wrong)'));
}
function adminLogout() {
  if (fb.auth) { try { fb.auth.signOut(); } catch(e){} }
  showAdminState(false);
}
function setAqAns(i, el) {
  aqAns = i;
  document.querySelectorAll('#aqAnsRow .timer-opt').forEach(o=>o.classList.remove('active'));
  if (el) el.classList.add('active');
}
let editingId = null;
let adminQuestions = {};

function adminClearForm() {
  ['aqText','aqA','aqB','aqC','aqExp','aqImg'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
  const f=document.getElementById('aqImgFile'); if(f) f.value='';
  const p=document.getElementById('aqImgPreview'); if(p){ p.style.display='none'; p.src=''; }
  setAqAns(0, document.querySelector('#aqAnsRow .timer-opt'));
}

function adminShowImgPreview(url) {
  const p = document.getElementById('aqImgPreview');
  if (!p) return;
  if (url) { p.src = url; p.style.display = 'block'; } else { p.style.display='none'; p.src=''; }
}

function adminUploadImage() {
  if (!fb.auth || !fb.auth.currentUser) { showToast('⚠️ سجّل الدخول أولاً', 'var(--wrong)'); return; }
  const f = document.getElementById('aqImgFile');
  const file = f && f.files && f.files[0];
  if (!file) { showToast('⚠️ اختر ملف صورة أو الصق رابطاً', 'var(--wrong)'); return; }
  if (!fb.storage) { showToast('⚠️ خدمة التخزين غير مفعّلة — الصق رابط صورة بدلاً من الرفع', 'var(--wrong)'); return; }
  showToast('⏳ جارٍ رفع الصورة…', 'var(--gold)');
  const ref = fb.storage.ref('questionImages/' + Date.now() + '_' + file.name.replace(/[^\w.\-]/g,'_'));
  ref.put(file)
    .then(snap => snap.ref.getDownloadURL())
    .then(url => { document.getElementById('aqImg').value = url; adminShowImgPreview(url); showToast('✅ تم رفع الصورة', 'var(--correct)'); })
    .catch(() => showToast('⚠️ تعذّر الرفع (فعّل Storage أو الصق رابطاً)', 'var(--wrong)'));
}

function adminAddQuestion() {
  if (!fb.auth || !fb.auth.currentUser) { showToast('⚠️ سجّل الدخول أولاً', 'var(--wrong)'); return; }
  const cat = document.getElementById('aqCat').value;
  const q = document.getElementById('aqText').value.trim();
  const a = document.getElementById('aqA').value.trim();
  const b = document.getElementById('aqB').value.trim();
  const c = document.getElementById('aqC').value.trim();
  const exp = document.getElementById('aqExp').value.trim();
  if (!cat || !q || !a || !b || !c) { showToast('⚠️ أكمل السؤال والخيارات الثلاثة', 'var(--wrong)'); return; }
  const img = (document.getElementById('aqImg').value||'').trim();
  const data = { cat, q, opts:[a,b,c], ans:aqAns, exp:exp||'سؤال مُضاف.', diff:'medium', img: img||null };
  if (editingId) {
    fb.db.ref('questions/'+editingId).update(data)
      .then(()=>{ showToast('✅ تم حفظ التعديل', 'var(--correct)'); adminCancelEdit(); adminLoadList(); })
      .catch(()=>showToast('⚠️ تعذّر الحفظ', 'var(--wrong)'));
  } else {
    data.ts = firebase.database.ServerValue.TIMESTAMP;
    fb.db.ref('questions').push(data)
      .then(()=>{
        showToast('✅ تمت إضافة السؤال', 'var(--correct)');
        adminClearForm();
        allQuestions.push({ cat, q, opts:[a,b,c], ans:aqAns, exp:data.exp, diff:'medium', img: img||'' });
        adminLoadList();
      })
      .catch(()=>showToast('⚠️ تعذّرت الإضافة (تحقق من القواعد)', 'var(--wrong)'));
  }
}

function adminEditQuestion(id) {
  const q = adminQuestions[id]; if (!q) return;
  editingId = id;
  document.getElementById('aqCat').value = q.cat;
  document.getElementById('aqText').value = q.q || '';
  document.getElementById('aqA').value = (q.opts&&q.opts[0]) || '';
  document.getElementById('aqB').value = (q.opts&&q.opts[1]) || '';
  document.getElementById('aqC').value = (q.opts&&q.opts[2]) || '';
  document.getElementById('aqExp').value = q.exp || '';
  document.getElementById('aqImg').value = q.img || '';
  adminShowImgPreview(q.img || '');
  const ai = q.ans || 0;
  setAqAns(ai, document.querySelectorAll('#aqAnsRow .timer-opt')[ai]);
  document.getElementById('aqSubmitBtn').textContent = '💾 حفظ التعديل';
  document.getElementById('aqCancelBtn').style.display = 'block';
  window.scrollTo(0,0);
}

function adminCancelEdit() {
  editingId = null;
  adminClearForm();
  document.getElementById('aqSubmitBtn').textContent = '➕ إضافة السؤال';
  document.getElementById('aqCancelBtn').style.display = 'none';
}

function adminBulkImport() {
  if (!fb.auth || !fb.auth.currentUser) { showToast('⚠️ سجّل الدخول أولاً', 'var(--wrong)'); return; }
  const raw = document.getElementById('aqBulk').value.trim();
  if (!raw) { showToast('⚠️ الصق مصفوفة JSON', 'var(--wrong)'); return; }
  let arr; try { arr = JSON.parse(raw); } catch(e){ showToast('⚠️ JSON غير صالح', 'var(--wrong)'); return; }
  if (!Array.isArray(arr)) { showToast('⚠️ يجب أن تكون مصفوفة []', 'var(--wrong)'); return; }
  const valid = arr.filter(q=> q && q.q && Array.isArray(q.opts) && q.opts.length===3 && typeof q.ans==='number' && q.ans>=0 && q.ans<3 && catLabels[q.cat]);
  if (!valid.length) { showToast('⚠️ لا توجد أسئلة صالحة (تحقق من cat/opts/ans)', 'var(--wrong)'); return; }
  const updates = {};
  valid.forEach(q=>{
    const key = fb.db.ref('questions').push().key;
    updates[key] = { cat:q.cat, q:q.q, opts:q.opts.slice(0,3), ans:q.ans, exp:q.exp||'سؤال مُضاف.', diff:q.diff||'medium', img:q.img||null, ts:firebase.database.ServerValue.TIMESTAMP };
  });
  fb.db.ref('questions').update(updates)
    .then(()=>{
      showToast('✅ تم استيراد '+valid.length+' سؤال', 'var(--correct)');
      valid.forEach(q=> allQuestions.push({ cat:q.cat, q:q.q, opts:q.opts.slice(0,3), ans:q.ans, exp:q.exp||'سؤال مُضاف.', diff:q.diff||'medium', img:q.img||'' }));
      document.getElementById('aqBulk').value='';
      adminLoadList();
    })
    .catch(()=>showToast('⚠️ تعذّر الاستيراد', 'var(--wrong)'));
}

function adminLoadList() {
  const box = document.getElementById('adminList'); if (!box) return;
  if (!fbReady()) { box.innerHTML=''; return; }
  box.innerHTML = '<p style="color:var(--muted);text-align:center;padding:10px">جارٍ التحميل…</p>';
  fb.db.ref('questions').once('value').then(snap=>{
    adminQuestions = snap.val() || {};
    const fsel = document.getElementById('aqFilterCat');
    if (fsel && !fsel.options.length) {
      const all=document.createElement('option'); all.value=''; all.textContent='كل الفئات'; fsel.appendChild(all);
      Object.keys(catLabels).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=catLabels[k].label; fsel.appendChild(o); });
    }
    renderAdminList();
  }).catch(()=>{ box.innerHTML='<p style="color:var(--wrong);text-align:center;padding:10px">تعذّر التحميل</p>'; });
}

function renderAdminList() {
  const box = document.getElementById('adminList'); if (!box) return;
  const ids = Object.keys(adminQuestions);
  const cEl = document.getElementById('aqCount'); if (cEl) cEl.textContent = ids.length;
  const fcat = (document.getElementById('aqFilterCat')||{}).value || '';
  const term = ((document.getElementById('aqSearch')||{}).value||'').trim();
  let list = ids.map(id=>Object.assign({id}, adminQuestions[id]));
  if (fcat) list = list.filter(q=>q.cat===fcat);
  if (term) list = list.filter(q=>(q.q||'').includes(term));
  list.reverse();
  if (!list.length) { box.innerHTML='<p style="color:var(--muted);text-align:center;padding:10px">لا توجد أسئلة مطابقة</p>'; return; }
  box.innerHTML = '';
  list.forEach(q=>{
    const row = document.createElement('div'); row.className='olb-row';
    const lbl = catLabels[q.cat] ? catLabels[q.cat].label : q.cat;
    const info = document.createElement('div'); info.className='olb-name'; info.style.flex='1';
    info.innerHTML = `<div style="font-size:0.72rem;color:var(--gold)">${lbl}</div>${q.q}`;
    const editBtn = document.createElement('button'); editBtn.textContent='✏️'; editBtn.className='lb-tab'; editBtn.style.cssText='max-width:42px;padding:6px;flex:none'; editBtn.onclick=()=>adminEditQuestion(q.id);
    const del = document.createElement('button'); del.textContent='🗑️'; del.className='lb-tab'; del.style.cssText='max-width:42px;padding:6px;flex:none'; del.onclick=()=>adminDeleteQuestion(q.id);
    row.appendChild(info); row.appendChild(editBtn); row.appendChild(del); box.appendChild(row);
  });
}
function adminCleanOldLb() {
  if (!fb.auth || !fb.auth.currentUser) { showToast('⚠️ سجّل الدخول أولاً', 'var(--wrong)'); return; }
  cleanupOldLeaderboards();
  showToast('🧹 تم تنظيف لوحات الأسابيع السابقة', 'var(--gold)');
}
function adminResetLb() {
  if (!fb.auth || !fb.auth.currentUser) { showToast('⚠️ سجّل الدخول أولاً', 'var(--wrong)'); return; }
  fb.db.ref('leaderboard').remove()
    .then(()=>showToast('🗑️ تم تصفير لوحة الشرف بالكامل', 'var(--gold)'))
    .catch(()=>showToast('⚠️ تعذّر التصفير', 'var(--wrong)'));
}
function adminDeleteQuestion(id) {
  if (!fb.auth || !fb.auth.currentUser) { showToast('⚠️ سجّل الدخول أولاً', 'var(--wrong)'); return; }
  fb.db.ref('questions/'+id).remove()
    .then(()=>{ showToast('🗑️ تم الحذف', 'var(--gold)'); adminLoadList(); })
    .catch(()=>showToast('⚠️ تعذّر الحذف', 'var(--wrong)'));
}

window.addEventListener('load', ()=>{
  if (fbReady() && fb.auth) {
    fb.auth.onAuthStateChanged(u=>{ if (document.getElementById('adminScreen').classList.contains('show')) showAdminState(!!u); });
  }
  loadRemoteQuestions();
  cleanupOldLeaderboards();
  if (getOnlineSession()) { const b=document.getElementById('onlineRejoinBanner'); if(b) b.style.display='block'; }
  else if (hasResumableGame()) { const b=document.getElementById('resumeBanner'); if(b) b.style.display='block'; }
  if (location.hash === '#admin') openAdmin();
});
const ACTIVE_GAME_KEY = 'quizActiveGame';

function snapshotGame() {
  if (gameMode === 'online') return;
  try {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify({
      v:1, ts:Date.now(),
      gameMode, playerCount, PLAYERS, scores,
      selectedCats: Array.from(selectedCats), selectedDiffs: Array.from(selectedDiffs), selectedCount, useRandomOrder, allowSkip,
      questions, qIndex, answeredCount, soloQueue, turnOrder,
      advTimer, advSpeed, advJoker, advStats, advElim, advMusic,
      timerSecs, totalRounds, currentRound,
      jokerUsed, playerStats, elimActive, elimRound,
      avatars: AVATARS.slice()
    }));
  } catch(e){}
}

function clearActiveGame() {
  try { localStorage.removeItem(ACTIVE_GAME_KEY); } catch(e){}
}

function hasResumableGame() {
  try {
    const s = JSON.parse(localStorage.getItem(ACTIVE_GAME_KEY)||'null');
    if (!s || s.gameMode==='online' || !Array.isArray(s.PLAYERS) || !s.PLAYERS.length) return null;
    if (Date.now() - (s.ts||0) > 12*3600*1000) return null;
    if ((s.answeredCount||0) >= (s.selectedCount||0) * (s.totalRounds||1)) return null;
    return s;
  } catch(e){ return null; }
}

function dismissResume() {
  clearActiveGame();
  const b = document.getElementById('resumeBanner'); if (b) b.style.display='none';
}

function resumeGame() {
  const s = hasResumableGame(); if (!s) { dismissResume(); return; }
  gameMode=s.gameMode; playerCount=s.playerCount; PLAYERS=s.PLAYERS; scores=s.scores;
  if (Array.isArray(s.selectedCats)) selectedCats = new Set(s.selectedCats);
  else if (s.selectedCat) selectedCats = new Set([s.selectedCat]);
  selectedCount=s.selectedCount;
  if (Array.isArray(s.selectedDiffs)) selectedDiffs = new Set(s.selectedDiffs);
  else if (s.selectedDiff) selectedDiffs = new Set([s.selectedDiff]);
  useRandomOrder=s.useRandomOrder; allowSkip=s.allowSkip;
  questions=s.questions; qIndex=s.qIndex; answeredCount=s.answeredCount;
  soloQueue=s.soloQueue||[]; turnOrder=s.turnOrder||[]; turnIndex=0; answers=[null,null,null];
  advTimer=s.advTimer; advSpeed=s.advSpeed; advJoker=s.advJoker; advStats=s.advStats; advElim=s.advElim; advMusic=s.advMusic;
  timerSecs=s.timerSecs||20; totalRounds=s.totalRounds||1; currentRound=s.currentRound||1;
  jokerUsed=s.jokerUsed||new Array(PLAYERS.length).fill(false);
  playerStats=s.playerStats||PLAYERS.map(()=>({correct:0,wrong:0,skipped:0,streak:0,maxStreak:0,speedPts:0}));
  elimActive=s.elimActive||PLAYERS.map(p=>p.id); elimRound=s.elimRound||0;
  if (Array.isArray(s.avatars)) s.avatars.forEach((a,i)=>{ AVATARS[i]=a; });
  const b=document.getElementById('resumeBanner'); if(b) b.style.display='none';
  document.getElementById('setupScreen').style.display='none';
  document.getElementById('landingScreen').style.display='none';
  document.getElementById('finalScreen').classList.remove('show');
  document.getElementById('gameScreen').style.display='block';
  buildScoreboard();
  updateScoreboard();
  if (advMusic) { try { startMusic(); } catch(e){} }
  loadQuestion();
}
function activeSoloPid() { return (turnOrder && turnOrder.length) ? turnOrder[0] : null; }
function renderLifelines() {
  const row = document.getElementById('lifelinesRow'); if (!row) return;
  if (!advLifelines || !useRandomOrder) { row.style.display='none'; row.innerHTML=''; return; }
  const pid = activeSoloPid(); if (pid==null || !lifelinesUsed[pid]) { row.style.display='none'; return; }
  const u = lifelinesUsed[pid];
  const items = [
    {k:'l50',     emoji:'🪓', label:'٥٠:٥٠', fn:'useLifeline50()'},
    {k:'lswap',   emoji:'🔄', label:'تبديل',   fn:'useLifelineSwap()'},
    {k:'llucky',  emoji:'🎲', label:'حظ',     fn:'useLifelineLucky()'},
    {k:'lfriend', emoji:'📞', label:'صديق',   fn:'useLifelineFriend()'}
  ];
  row.innerHTML = items.map(it =>
    `<button class="lifeline-btn${u[it.k]?' used':''}" ${u[it.k]?'disabled':''} onclick="${it.fn}">
      <span class="ll-emoji">${it.emoji}</span><span class="ll-label">${it.label}</span>
     </button>`
  ).join('');
  row.style.display='flex';
}
function markLifeline(key) {
  const pid = activeSoloPid(); if (pid==null) return false;
  if (!lifelinesUsed[pid]) lifelinesUsed[pid] = {l50:false,lswap:false,llucky:false,lfriend:false};
  if (lifelinesUsed[pid][key]) return false;
  lifelinesUsed[pid][key] = true;
  return true;
}
function useLifeline50() {
  if (!markLifeline('l50')) return;
  const q = questions[qIndex];
  const wrongs = [0,1,2].filter(i => i !== q.ans);
  const toHide = wrongs[Math.floor(Math.random()*wrongs.length)];
  const el = document.getElementById('optionsContainer').children[toHide];
  if (el) { el.classList.add('lifeline-hidden'); el.onclick = null; }
  renderLifelines();
}
function useLifelineSwap() {
  if (qIndex+1 >= questions.length) { showToast('⚠️ لا يوجد سؤال بديل', 'var(--wrong)'); return; }
  if (!markLifeline('lswap')) return;
  qIndex++;
  loadQuestion();
}
function useLifelineLucky() {
  if (!markLifeline('llucky')) return;
  const kids = [...document.getElementById('optionsContainer').children];
  const visible = kids.map((el,i)=>el.classList.contains('lifeline-hidden')?-1:i).filter(i=>i>=0);
  if (!visible.length) return;
  const pick = visible[Math.floor(Math.random()*visible.length)];
  selectOption(pick);
}
function useLifelineFriend() {
  if (!markLifeline('lfriend')) return;
  const q = questions[qIndex];
  const kids = [...document.getElementById('optionsContainer').children];
  const visible = kids.map((el,i)=>el.classList.contains('lifeline-hidden')?-1:i).filter(i=>i>=0);
  const correctVisible = visible.includes(q.ans);
  const goodChance = Math.random() < 0.8;
  let hintIdx;
  if (goodChance && correctVisible) hintIdx = q.ans;
  else {
    const wrong = visible.filter(i=>i!==q.ans);
    hintIdx = wrong.length ? wrong[Math.floor(Math.random()*wrong.length)] : q.ans;
  }
  const letters = ['أ','ب','ج'];
  showToast('📞 صديقك يهمس: الجواب على الأرجح "' + letters[hintIdx] + '"', 'var(--gold)');
  renderLifelines();
}
window.addEventListener('beforeunload', (e)=>{
  const playing = document.getElementById('gameScreen').style.display==='block'
    || document.getElementById('onlineScreen').style.display==='block';
  if (playing) { e.preventDefault(); e.returnValue=''; return ''; }
});
let netLastInfo = '';
let serverConnected = true;

function netLevelLabel(l) {
  return l >= 4 ? 'ممتاز' : l === 3 ? 'جيد' : l === 2 ? 'متوسط' : l === 1 ? 'ضعيف' : 'منقطع';
}

function updateNetUI(level, label, info) {
  const el = document.getElementById('netIndicator');
  const lbl = document.getElementById('netLabel');
  if (!el || !lbl) return;
  el.classList.remove('lvl0','lvl1','lvl2','lvl3','lvl4');
  el.classList.add('lvl' + level);
  lbl.textContent = label;
  if (info) netLastInfo = info;
}

async function measureNet() {
  if (!navigator.onLine) { updateNetUI(0, 'منقطع', 'navigator.onLine=false'); return; }
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && (c.effectiveType || typeof c.rtt === 'number')) {
    const et = c.effectiveType || '';
    const rtt = (typeof c.rtt === 'number') ? c.rtt : null;
    let level;
    if (et === '4g' || (rtt !== null && rtt < 150)) level = 4;
    else if (et === '3g' || (rtt !== null && rtt < 350)) level = 3;
    else if (rtt !== null && rtt < 700) level = 2;
    else level = 1;
    const info = 'النوع: ' + (et || 'غير معروف') + (rtt !== null ? ' • RTT: ' + rtt + 'ms' : '') + (c.downlink ? ' • السرعة: ' + c.downlink + ' Mbps' : '');
    updateNetUI(level, netLevelLabel(level), info);
    return;
  }
  try {
    const t0 = performance.now();
    await fetch('manifest.json?cb=' + Date.now(), { cache: 'no-store' });
    const ms = Math.round(performance.now() - t0);
    let level;
    if (ms < 300) level = 4; else if (ms < 600) level = 3; else if (ms < 1000) level = 2; else level = 1;
    updateNetUI(level, netLevelLabel(level), 'زمن الاستجابة: ' + ms + 'ms');
  } catch(e) {
    updateNetUI(0, 'منقطع', 'تعذّر الوصول للشبكة');
  }
}

function showNetDetails() {
  showToast('📶 ' + (document.getElementById('netLabel').textContent || '') + (netLastInfo ? ' — ' + netLastInfo : ''), 'var(--gold)');
}

let everServerConnected = false, wasServerDisconnected = false;
function watchServerConnection() {
  if (!fbReady()) return;
  try {
    fb.db.ref('.info/connected').on('value', snap => {
      const connected = !!snap.val();
      if (connected) {
        if (wasServerDisconnected) { showToast('✅ عاد الاتصال بالخادم', 'var(--correct)'); wasServerDisconnected = false; }
        everServerConnected = true;
      } else if (everServerConnected) {
        showToast('⚠️ انقطع الاتصال بالخادم — جارٍ إعادة المحاولة', 'var(--wrong)');
        wasServerDisconnected = true;
      }
    });
  } catch(e){}
}
measureNet();
setInterval(measureNet, 7000);
window.addEventListener('online',  ()=>measureNet());
window.addEventListener('offline', ()=>updateNetUI(0,'منقطع','تم فقدان الاتصال'));
try {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && c.addEventListener) c.addEventListener('change', measureNet);
} catch(e){}
window.addEventListener('load', ()=>{ measureNet(); watchServerConnection(); });
