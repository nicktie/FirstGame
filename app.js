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
