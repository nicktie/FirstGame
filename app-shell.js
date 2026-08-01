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
