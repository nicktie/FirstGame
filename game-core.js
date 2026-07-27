/* =========================================================================
   Wanees Game Core — shared runtime for standalone games
   <script src="game-core.js"></script>
   Exposes a single global: window.WG
   Standardises the boilerplate every game re-implements: audio, haptics,
   best-score persistence, service-worker registration, a rAF game loop,
   reduced-motion detection, and tab-visibility pause hooks.
   ========================================================================= */
(function (global) {
  'use strict';

  var reduceMotion = false;
  try { reduceMotion = matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  /* ---------- Audio (lazy WebAudio, unlocked on first user gesture) ---------- */
  var AC = null;
  function initAudio() {
    if (AC) return AC;
    try { AC = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) { AC = null; }
    return AC;
  }
  function tone(freq, dur, opts) {
    if (!AC) return;
    opts = opts || {};
    var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = opts.type || 'sine';
    o.frequency.value = freq;
    g.gain.value = opts.vol == null ? 0.05 : opts.vol;
    g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + dur + 0.04);
  }
  // Named SFX presets — a shared vocabulary so games sound consistent.
  var sfx = {
    tap:   function () { tone(420, 0.05, { type: 'triangle', vol: 0.05 }); },
    good:  function () { tone(680, 0.06, { type: 'triangle', vol: 0.05 }); },
    bad:   function () { tone(150, 0.14, { type: 'sawtooth', vol: 0.06 }); },
    tick:  function () { tone(880, 0.04, { type: 'sine', vol: 0.04 }); },
    win:   function () { [523, 659, 880, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.14, { type: 'sine', vol: 0.06 }); }, i * 90); }); },
    lose:  function () { tone(220, 0.3, { type: 'sawtooth', vol: 0.06 }); tone(165, 0.4, { type: 'sawtooth', vol: 0.05 }); },
    levelup: function () { [659, 784, 988, 1318].forEach(function (f, i) { setTimeout(function () { tone(f, 0.14, { type: 'sine', vol: 0.06 }); }, i * 70); }); }
  };

  /* ---------- Haptics ---------- */
  function vibe(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} }

  /* ---------- Best-score persistence (per-game key) ---------- */
  function bestKey(game) { return 'wanees:best:' + game; }
  function loadBest(game) { try { return parseInt(localStorage.getItem(bestKey(game)) || '0', 10) || 0; } catch (e) { return 0; } }
  function saveBest(game, v) { try { localStorage.setItem(bestKey(game), String(v)); } catch (e) {} return v; }
  function recordBest(game, score) { var b = loadBest(game); if (score > b) { saveBest(game, score); return true; } return false; }

  /* ---------- rAF game loop with dt, auto-pauses when tab hidden ---------- */
  function Loop(step) {
    var raf = 0, last = 0, running = false;
    function frame(t) {
      if (!running) return;
      var dt = last ? t - last : 16; last = t;
      step(dt, t);
      raf = requestAnimationFrame(frame);
    }
    return {
      start: function () { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); },
      stop:  function () { running = false; cancelAnimationFrame(raf); },
      get running() { return running; }
    };
  }

  /* ---------- Tab-visibility pause hook ---------- */
  function onHidden(cb) {
    document.addEventListener('visibilitychange', function () { if (document.hidden) cb(); });
  }

  /* ---------- Toast ---------- */
  var _toastEl = null, _toastT = 0;
  function toast(msg, ms) {
    if (!_toastEl) { _toastEl = document.createElement('div'); _toastEl.className = 'wg-toast'; document.body.appendChild(_toastEl); }
    _toastEl.textContent = msg; _toastEl.classList.add('show');
    clearTimeout(_toastT); _toastT = setTimeout(function () { _toastEl.classList.remove('show'); }, ms || 1800);
  }

  /* ---------- Service worker registration (shared) ---------- */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      global.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
  }

  /* ---------- Arabic-Indic digit helper (shared across games) ---------- */
  function ar(n) { return String(n).replace(/[0-9]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); }

  /* ---------- Navigation ---------- */
  function goHome() { location.href = 'index.html'; }

  global.WG = {
    reduceMotion: reduceMotion,
    initAudio: initAudio, tone: tone, sfx: sfx,
    vibe: vibe,
    loadBest: loadBest, saveBest: saveBest, recordBest: recordBest,
    Loop: Loop, onHidden: onHidden,
    toast: toast, ar: ar, goHome: goHome, registerSW: registerSW
  };
})(typeof window !== 'undefined' ? window : this);
