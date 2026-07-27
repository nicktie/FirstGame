/* =========================================================================
   Wanees Games Registry — single source of truth for the game catalogue.
   Loaded by BOTH index.html (window) and sw.js (importScripts → self).

   Adding a game = add one entry here. The service worker derives its
   precache list from `file`, so standalone games are cached automatically
   with no separate sw.js edit. (The visual card in index.html's grid is
   still authored by hand — it carries per-game copy that needs a human.)

   Fields:
     id      unique slug
     title   display name (Arabic)
     icon    emoji
     launch  how index.html starts it — {kind:'x'} (internal, via playGame)
             or {href:'x.html'} (standalone file)
     file    standalone HTML file to precache (only for {href} games)
   ========================================================================= */
(function (g) {
  var GAMES = [
    { id:'quiz',     title:'الأسئلة',            icon:'🧠',  launch:{ kind:'quiz' } },
    { id:'trap',     title:'الفخ',               icon:'💣',  launch:{ kind:'trap' } },
    { id:'xo',       title:'XO',                 icon:'🎮',  launch:{ kind:'xo' } },
    { id:'c4',       title:'أربعة في صف',        icon:'🔴',  launch:{ kind:'c4' } },
    { id:'mem',      title:'الذاكرة',            icon:'🃏',  launch:{ kind:'mem' } },
    { id:'defuse',   title:'إبطال القنبلة',      icon:'🧨',  launch:{ kind:'defuse' } },
    { id:'colors',   title:'حرب الألوان السريعة', icon:'⚡',  launch:{ href:'colors.html' }, file:'./colors.html' },
    { id:'dino',     title:'الديناصور',          icon:'🦖',  launch:{ kind:'dino' } },
    { id:'brainrot', title:'التعفّن الدماغي',    icon:'🧠',  launch:{ kind:'brainrot' } },
    { id:'space',    title:'حرب الفضاء',         icon:'🚀',  launch:{ kind:'space' } },
    { id:'iram',     title:'إرم: مدينة الأعمدة', icon:'🗡️', launch:{ href:'iram.html' },     file:'./iram.html' },
    { id:'borj',     title:'بنّاء البرج',        icon:'🏗️', launch:{ href:'borj.html' },     file:'./borj.html' },
    { id:'wanees3d', title:'عالم ونيس 3D',       icon:'🌳',  launch:{ href:'wanees3d.html' }, file:'./wanees3d.html' },
    { id:'tetris',   title:'تتريس',              icon:'🎮',  launch:{ href:'tetris.html' },   file:'./tetris.html' },
    { id:'wanees',   title:'ونيس',               icon:'🍄',  launch:{ kind:'wanees' } }
  ];

  g.WANEES_GAMES = GAMES;
  // Standalone HTML files, for the service worker precache.
  g.WANEES_GAME_FILES = GAMES.filter(function (x) { return x.file; }).map(function (x) { return x.file; });
  // Total playable games (source of truth for the "N لعبة" count).
  g.WANEES_GAME_COUNT = GAMES.length;
})(typeof self !== 'undefined' ? self : this);
