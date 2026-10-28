/*
 * EcoQuest — Interface: telas, HUD, diálogos, notificações e ícones em pixel.
 */
(function (global) {
  'use strict';

  var EQ = global.EQ;
  var S = EQ.Storage;
  var D = EQ.DATA;

  var ICONS = {
    leaf: ['....##..', '..####..', '.#####..', '.####.#.', '####.#..', '###.#...', '..#.....', '.#......'],
    paw: ['..#..#..', '.##..##.', '........', '#..##..#', '..####..', '.######.', '.######.', '..#..#..'],
    map: ['..####..', '.##..##.', '.#....#.', '.##..##.', '..####..', '...##...', '...##...', '........'],
    book: ['######..', '#....##.', '#.##.##.', '#....##.', '#.##.##.', '#....##.', '######..', '........'],
    user: ['..####..', '..####..', '..####..', '...##...', '.######.', '########', '########', '........'],
    gear: ['...##...', '.######.', '.##..##.', '###..###', '###..###', '.##..##.', '.######.', '...##...'],
    star: ['...##...', '...##...', '########', '.######.', '..####..', '.##..##.', '.#....#.', '........'],
    lock: ['..####..', '.#....#.', '.#....#.', '########', '###..###', '###..###', '########', '........'],
    bolt: ['....##..', '...##...', '..##....', '.######.', '....##..', '...##...', '..##....', '........'],
    check: ['........', '......##', '.....##.', '#...##..', '##.##...', '.###....', '..#.....', '........'],
    arrow: ['...#....', '..##....', '.#######', '########', '.#######', '..##....', '...#....', '........'],
    walk: ['...##...', '...##...', '..####..', '.#.##.#.', '...##...', '..#..#..', '.#....#.', '........']
  };

  function icon(name, cls) {
    var rows = ICONS[name];
    if (!rows) return '';
    var rects = '';
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        if (row[x] === '#') rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    });
    return '<svg class="px-icon ' + (cls || '') + '" viewBox="0 0 8 8" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + rects + '</svg>';
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var motionQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function reducedMotion() {
    var pref = S.get().settings.motion;
    if (pref === 'reduce') return true;
    if (pref === 'full') return false;
    return !!(motionQuery && motionQuery.matches);
  }

  function applyMotion() {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion());
  }
  if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', applyMotion);

  /* ---------- Telas ---------- */
  var current = 'title';
  var screenHooks = {};

  function onScreen(name, fn) { screenHooks[name] = fn; }

  function showScreen(name) {
    if (current === 'world' && name !== 'world') EQ.World.leave();
    var screens = document.querySelectorAll('.screen');
    Array.prototype.forEach.call(screens, function (s) {
      var active = s.id === 'screen-' + name;
      s.classList.toggle('active', active);
      s.hidden = !active;
    });
    document.getElementById('hud').hidden = name === 'title';
    document.body.dataset.screen = name;
    Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (b) {
      var target = b.getAttribute('data-nav');
      var isCurrent = target === name || (target === 'map' && name === 'world');
      if (isCurrent) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    current = name;
    if (screenHooks[name]) screenHooks[name]();
    global.scrollTo(0, 0);
  }

  function currentScreen() { return current; }

  /* ---------- HUD ---------- */
  function updateHud() {
    var s = S.get();
    if (!s.profile) return;
    var info = EQ.Game.levelInfo(s.stats.xp);
    document.getElementById('hud-name').textContent = s.profile.name;
    document.getElementById('hud-level').textContent = 'Nv ' + info.level;
    document.getElementById('hud-xp-fill').style.width = Math.round(info.progress * 100) + '%';
    var bar = document.getElementById('hud-xpbar');
    bar.setAttribute('aria-valuenow', String(info.current));
    bar.setAttribute('aria-valuemax', String(info.needed));
    document.getElementById('hud-xp-text').textContent = info.current + '/' + info.needed + ' XP';
    document.getElementById('hud-seeds').textContent = s.stats.seeds;
    document.getElementById('hud-animals').textContent = EQ.Game.unlockedAnimalsCount() + '/' + D.animals.length;
    var unseen = Object.keys(s.animals).filter(function (k) { return !s.animals[k].seen; }).length;
    var badge = document.getElementById('hud-new-animals');
    badge.hidden = unseen === 0;
    badge.textContent = unseen;
    EQ.World.drawAvatar(document.getElementById('hud-avatar'), s.profile.avatar);
  }

  /* ---------- Diálogo ---------- */
  var modal, modalBody, onCloseFn = null, cleanupFn = null;

  function openDialog(build, opts) {
    opts = opts || {};
    modal = modal || document.getElementById('modal');
    modalBody = modalBody || document.getElementById('modal-body');
    runCleanup();
    modalBody.innerHTML = '';
    modal.className = 'modal' + (opts.wide ? ' wide' : '');
    modal.setAttribute('aria-label', opts.label || 'Janela');
    onCloseFn = opts.onClose || null;
    build(modalBody);
    if (!modal.open) {
      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');
    }
    var focusable = modalBody.querySelector('[autofocus], .btn-primary, button, input, select');
    if (focusable) setTimeout(function () { focusable.focus(); }, 30);
  }

  function setCleanup(fn) { cleanupFn = fn; }

  function runCleanup() {
    if (cleanupFn) { try { cleanupFn(); } catch (e) { /* ignorado */ } cleanupFn = null; }
  }

  function closeDialog() {
    if (!modal) return;
    runCleanup();
    if (modal.open) {
      if (typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
    }
  }

  function initDialog() {
    modal = document.getElementById('modal');
    modalBody = document.getElementById('modal-body');
    modal.addEventListener('close', function () {
      runCleanup();
      var fn = onCloseFn;
      onCloseFn = null;
      if (fn) fn();
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeDialog();
    });
    document.getElementById('modal-close').addEventListener('click', closeDialog);
  }

  /* ---------- Notificações ---------- */
  function toast(message, type) {
    var box = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.setAttribute('role', 'status');
    t.innerHTML = icon(type === 'achievement' ? 'star' : type === 'animal' ? 'paw' : type === 'error' ? 'lock' : 'leaf') + '<span></span>';
    t.querySelector('span').textContent = message;
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3600);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4100);
  }

  function burst(target) {
    if (reducedMotion()) return;
    var host = document.getElementById('fx');
    var rect = target ? target.getBoundingClientRect() : { left: global.innerWidth / 2, top: global.innerHeight / 3, width: 0, height: 0 };
    var colors = ['#6fd36b', '#ffcc4d', '#eef5e6', '#5ab8e8'];
    for (var i = 0; i < 24; i++) {
      var p = document.createElement('span');
      p.className = 'fx-pixel';
      p.style.left = rect.left + rect.width / 2 + 'px';
      p.style.top = rect.top + rect.height / 2 + 'px';
      p.style.background = colors[i % colors.length];
      var ang = (Math.PI * 2 * i) / 24;
      var dist = 60 + Math.random() * 80;
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      host.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 900); })(p);
    }
  }

  global.EQ.UI = {
    icon: icon,
    esc: esc,
    reducedMotion: reducedMotion,
    applyMotion: applyMotion,
    showScreen: showScreen,
    currentScreen: currentScreen,
    onScreen: onScreen,
    updateHud: updateHud,
    openDialog: openDialog,
    closeDialog: closeDialog,
    setCleanup: setCleanup,
    initDialog: initDialog,
    toast: toast,
    burst: burst
  };
})(window);
